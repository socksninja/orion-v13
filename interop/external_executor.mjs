#!/usr/bin/env node
/**
 * RSTA-015 External Executor reference.
 * Intentionally standalone: no imports from conformance/ or RNCP executor code.
 * Input: portable RNCP envelope.
 * Output: external execution receipt + durable local consumption ledger.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const reject = reason => ({ decision: 'REJECT', reason, executor_provider: 'EXTERNAL_EXECUTOR_A' });

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function execute(envelope, ledger) {
  if (envelope?.protocol !== 'RNCP-COMMITMENT-V1') return reject('PROTOCOL_VERSION_MISMATCH');
  if (envelope?.schema !== 'rncp-rsta-014-portable-envelope-v1') return reject('SCHEMA_INVALID');
  const eventId = envelope.event_id;
  if (typeof eventId !== 'string' || eventId.length < 8) return reject('EVENT_ID_INVALID');

  const previous = ledger[eventId];
  if (previous?.state === 'CONSUMED') return reject('DURABLE_EVENT_ALREADY_CONSUMED');

  const c = envelope.commitment;
  if (!c || c.state !== 'VALID' || typeof c.payload !== 'string' || typeof c.payload_sha256 !== 'string') {
    return reject('COMMITMENT_INVALID');
  }
  if (sha256(c.payload) !== c.payload_sha256) return reject('PAYLOAD_HASH_MISMATCH');

  const cap = envelope.capability;
  if (!cap || typeof cap.name !== 'string' || !cap.name || cap.single_use !== true) return reject('CAPABILITY_INVALID');

  const intent = envelope.execution_intent;
  if (!intent || intent.idempotency_key !== eventId || typeof intent.action !== 'string' || typeof intent.target !== 'string') {
    return reject('EXECUTION_INTENT_INVALID');
  }
  if (envelope.replay_policy !== 'REJECT_AFTER_CONSUMPTION') return reject('REPLAY_POLICY_INVALID');

  const receiptPayload = [
    `executor_provider=EXTERNAL_EXECUTOR_A`,
    `event_id=${eventId}`,
    `commitment_sha256=${c.payload_sha256}`,
    `capability=${cap.name}`,
    `action=${intent.action}`,
    `target=${intent.target}`,
    `idempotency_key=${intent.idempotency_key}`
  ].join('|');
  const receipt = {
    state: 'REALITY_RECORDED',
    payload: receiptPayload,
    payload_sha256: sha256(receiptPayload),
    observer_provider: 'EXTERNAL_EXECUTOR_A'
  };

  ledger[eventId] = {
    state: 'CONSUMED',
    executor_provider: 'EXTERNAL_EXECUTOR_A',
    capability: cap.name,
    receipt
  };

  return {
    decision: 'EXECUTED',
    executor_provider: 'EXTERNAL_EXECUTOR_A',
    event_id: eventId,
    capability: cap.name,
    transition: 'VALID->UNLOCKED->EXECUTED->REALITY_RECORDED',
    commitment_sha256: c.payload_sha256,
    receipt_sha256: receipt.payload_sha256
  };
}

if (process.argv.length !== 4) {
  console.log(JSON.stringify(reject('USAGE')));
  process.exit(1);
}

const envelope = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ledgerPath = process.argv[3];
const ledger = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : {};
const result = execute(envelope, ledger);
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(JSON.stringify(result));
process.exit(result.decision === 'EXECUTED' ? 0 : 1);
