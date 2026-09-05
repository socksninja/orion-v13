#!/usr/bin/env node
// Independent JavaScript implementation of RNCP-COMMITMENT-V1 conformance.
import fs from 'node:fs';
import crypto from 'node:crypto';

const REQUIRED = new Set([
  'protocol', 'event_id', 'issuer', 'verifier', 'executor',
  'reality_observer', 'commitment', 'capability', 'replay_policy'
]);

function fail(reason) {
  console.log(JSON.stringify({ decision: 'FAIL', reason }));
  process.exit(1);
}

function verify(path) {
  const obj = JSON.parse(fs.readFileSync(path, 'utf8'));
  const keys = Object.keys(obj);
  if (keys.length !== REQUIRED.size || keys.some((k) => !REQUIRED.has(k))) fail('REQUIRED_FIELDS_OR_ADDITIONAL_FIELDS');
  if (obj.protocol !== 'RNCP-COMMITMENT-V1') fail('PROTOCOL_VERSION_MISMATCH');
  if (typeof obj.event_id !== 'string' || obj.event_id.length < 8) fail('EVENT_ID_INVALID');

  for (const actorName of ['issuer', 'verifier', 'executor', 'reality_observer']) {
    const actor = obj[actorName];
    const actorKeys = Object.keys(actor ?? {});
    if (actorKeys.length !== 2 || !actorKeys.includes('provider') || !actorKeys.includes('executor_class')) fail(`ACTOR_SHAPE_INVALID:${actorName}`);
    if (![actor.provider, actor.executor_class].every((v) => typeof v === 'string' && v.length > 0)) fail(`ACTOR_VALUE_INVALID:${actorName}`);
  }

  const commitment = obj.commitment ?? {};
  const commitmentKeys = Object.keys(commitment);
  if (commitmentKeys.length !== 3 || !['payload', 'payload_sha256', 'state'].every((k) => commitmentKeys.includes(k))) fail('COMMITMENT_SHAPE_INVALID');
  if (typeof commitment.payload !== 'string' || commitment.payload.length === 0) fail('PAYLOAD_INVALID');
  const expected = crypto.createHash('sha256').update(commitment.payload, 'utf8').digest('hex');
  if (commitment.payload_sha256 !== expected) fail('PAYLOAD_HASH_MISMATCH');
  if (commitment.state !== 'VALID') fail('COMMITMENT_NOT_VALID');

  const capability = obj.capability ?? {};
  const capabilityKeys = Object.keys(capability);
  if (capabilityKeys.length !== 2 || !['name', 'single_use'].every((k) => capabilityKeys.includes(k))) fail('CAPABILITY_SHAPE_INVALID');
  if (typeof capability.name !== 'string' || capability.name.length === 0) fail('CAPABILITY_NAME_INVALID');
  if (capability.single_use !== true) fail('CAPABILITY_MUST_BE_SINGLE_USE');
  if (obj.replay_policy !== 'REJECT_AFTER_CONSUMPTION') fail('REPLAY_POLICY_INVALID');

  return {
    decision: 'PASS',
    protocol: obj.protocol,
    event_id: obj.event_id,
    payload_sha256: expected,
    capability: capability.name,
    single_use: true,
    replay_policy: obj.replay_policy,
  };
}

if (process.argv.length !== 3) fail('USAGE');
console.log(JSON.stringify(verify(process.argv[2])));
