#!/usr/bin/env python3
"""Independent RSTA-014 portable end-to-end executor/verifier."""
import hashlib
import json
import sys
from pathlib import Path


def reject(reason: str):
    return {"decision": "REJECT", "reason": reason}


def process(envelope: dict, ledger: dict) -> tuple[dict, dict]:
    required = {"schema", "protocol", "event_id", "commitment", "capability", "execution_intent", "replay_policy"}
    if set(envelope) != required:
        return reject("ENVELOPE_FIELDS_INVALID"), ledger
    if envelope["schema"] != "rncp-rsta-014-portable-envelope-v1":
        return reject("SCHEMA_INVALID"), ledger
    if envelope["protocol"] != "RNCP-COMMITMENT-V1":
        return reject("PROTOCOL_VERSION_MISMATCH"), ledger
    event_id = envelope["event_id"]
    if not isinstance(event_id, str) or len(event_id) < 8:
        return reject("EVENT_ID_INVALID"), ledger
    if ledger.get(event_id, {}).get("state") == "CONSUMED":
        return reject("DURABLE_EVENT_ALREADY_CONSUMED"), ledger
    c = envelope["commitment"]
    if set(c) != {"payload", "payload_sha256", "state"} or c["state"] != "VALID":
        return reject("COMMITMENT_INVALID"), ledger
    if hashlib.sha256(c["payload"].encode()).hexdigest() != c["payload_sha256"]:
        return reject("PAYLOAD_HASH_MISMATCH"), ledger
    cap = envelope["capability"]
    if set(cap) != {"name", "single_use"} or not cap["name"] or cap["single_use"] is not True:
        return reject("CAPABILITY_INVALID"), ledger
    intent = envelope["execution_intent"]
    if set(intent) != {"action", "target", "idempotency_key"} or intent["idempotency_key"] != event_id:
        return reject("EXECUTION_INTENT_INVALID"), ledger
    if envelope["replay_policy"] != "REJECT_AFTER_CONSUMPTION":
        return reject("REPLAY_POLICY_INVALID"), ledger

    receipt_payload = f"event_id={event_id}|capability={cap['name']}|action={intent['action']}|idempotency_key={intent['idempotency_key']}"
    receipt_sha = hashlib.sha256(receipt_payload.encode()).hexdigest()
    ledger[event_id] = {
        "state": "CONSUMED",
        "capability": cap["name"],
        "receipt": {"payload": receipt_payload, "payload_sha256": receipt_sha, "state": "REALITY_RECORDED"},
    }
    return {
        "decision": "EXECUTED",
        "event_id": event_id,
        "capability": cap["name"],
        "transition": "VALID->UNLOCKED->EXECUTED->REALITY_RECORDED",
        "receipt_sha256": receipt_sha,
        "replay_policy": envelope["replay_policy"],
    }, ledger


def main():
    if len(sys.argv) != 3:
        print(json.dumps(reject("USAGE"), sort_keys=True)); return 1
    envelope = json.loads(Path(sys.argv[1]).read_text())
    ledger_path = Path(sys.argv[2])
    ledger = json.loads(ledger_path.read_text()) if ledger_path.exists() else {}
    result, ledger = process(envelope, ledger)
    ledger_path.write_text(json.dumps(ledger, indent=2, sort_keys=True) + "\n")
    print(json.dumps(result, sort_keys=True))
    return 0 if result["decision"] == "EXECUTED" else 1

if __name__ == "__main__":
    raise SystemExit(main())
