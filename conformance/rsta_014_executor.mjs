#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const reject = reason => ({ decision: 'REJECT', reason });

function processEnvelope(envelope, ledger) {
  const required = new Set(['schema','protocol','event_id','commitment','capability','execution_intent','replay_policy']);
  if (Object.keys(envelope).sort().join('|') !== [...required].sort().join('|')) return [reject('ENVELOPE_FIELDS_INVALID'), ledger];
  if (envelope.schema !== 'rncp-rsta-014-portable-envelope-v1') return [reject('SCHEMA_INVALID'), ledger];
  if (envelope.protocol !== 'RNCP-COMMITMENT-V1') return [reject('PROTOCOL_VERSION_MISMATCH'), ledger];
  const eventId = envelope.event_id;
  if (typeof eventId !== 'string' || eventId.length < 8) return [reject('EVENT_ID_INVALID'), ledger];
  if (ledger[eventId]?.state === 'CONSUMED') return [reject('DURABLE_EVENT_ALREADY_CONSUMED'), ledger];
  const c = envelope.commitment;
  if (JSON.stringify(Object.keys(c).sort()) !== JSON.stringify(['payload','payload_sha256','state'].sort()) || c.state !== 'VALID') return [reject('COMMITMENT_INVALID'), ledger];
  const digest = crypto.createHash('sha256').update(c.payload, 'utf8').digest('hex');
  if (digest !== c.payload_sha256) return [reject('PAYLOAD_HASH_MISMATCH'), ledger];
  const cap = envelope.capability;
  if (JSON.stringify(Object.keys(cap).sort()) !== JSON.stringify(['name','single_use'].sort()) || !cap.name || cap.single_use !== true) return [reject('CAPABILITY_INVALID'), ledger];
  const intent = envelope.execution_intent;
  if (JSON.stringify(Object.keys(intent).sort()) !== JSON.stringify(['action','target','idempotency_key'].sort()) || intent.idempotency_key !== eventId) return [reject('EXECUTION_INTENT_INVALID'), ledger];
  if (envelope.replay_policy !== 'REJECT_AFTER_CONSUMPTION') return [reject('REPLAY_POLICY_INVALID'), ledger];

  const receiptPayload = `event_id=${eventId}|capability=${cap.name}|action=${intent.action}|idempotency_key=${intent.idempotency_key}`;
  const receiptSha = crypto.createHash('sha256').update(receiptPayload, 'utf8').digest('hex');
  ledger[eventId] = { state: 'CONSUMED', capability: cap.name, receipt: { payload: receiptPayload, payload_sha256: receiptSha, state: 'REALITY_RECORDED' } };
  return [{ decision: 'EXECUTED', event_id: eventId, capability: cap.name, transition: 'VALID->UNLOCKED->EXECUTED->REALITY_RECORDED', receipt_sha256: receiptSha, replay_policy: envelope.replay_policy }, ledger];
}

if (process.argv.length !== 4) { console.log(JSON.stringify(reject('USAGE'))); process.exit(1); }
const envelope = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ledgerPath = process.argv[3];
const ledger = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : {};
const [result, nextLedger] = processEnvelope(envelope, ledger);
fs.writeFileSync(ledgerPath, JSON.stringify(nextLedger, null, 2) + '\n');
console.log(JSON.stringify(result));
process.exit(result.decision === 'EXECUTED' ? 0 : 1);
