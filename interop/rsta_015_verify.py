#!/usr/bin/env python3
"""Independent RNCP boundary verifier for an external executor receipt."""
import hashlib
import json
import sys
from pathlib import Path


def reject(reason):
    print(json.dumps({"decision": "REJECT", "reason": reason}, sort_keys=True))
    return 1


def main():
    if len(sys.argv) != 3:
        return reject("USAGE")
    envelope = json.loads(Path(sys.argv[1]).read_text())
    receipt = json.loads(Path(sys.argv[2]).read_text())

    if envelope.get("protocol") != "RNCP-COMMITMENT-V1":
        return reject("PROTOCOL_VERSION_MISMATCH")
    if envelope.get("replay_policy") != "REJECT_AFTER_CONSUMPTION":
        return reject("REPLAY_POLICY_INVALID")
    event_id = envelope.get("event_id")
    cap = envelope.get("capability", {})
    commit = envelope.get("commitment", {})
    intent = envelope.get("execution_intent", {})

    if not event_id or cap.get("single_use") is not True:
        return reject("ENVELOPE_BINDING_INVALID")
    expected_commit = hashlib.sha256(commit.get("payload", "").encode()).hexdigest()
    if expected_commit != commit.get("payload_sha256"):
        return reject("COMMITMENT_HASH_INVALID")

    if receipt.get("state") != "REALITY_RECORDED":
        return reject("REALITY_RECEIPT_INVALID")
    raw = receipt.get("payload")
    if not isinstance(raw, str) or not raw:
        return reject("REALITY_PAYLOAD_INVALID")
    if hashlib.sha256(raw.encode()).hexdigest() != receipt.get("payload_sha256"):
        return reject("REALITY_RECEIPT_HASH_INVALID")

    required_parts = {
        "executor_provider=EXTERNAL_EXECUTOR_A",
        f"event_id={event_id}",
        f"commitment_sha256={commit['payload_sha256']}",
        f"capability={cap['name']}",
        f"action={intent['action']}",
        f"target={intent['target']}",
        f"idempotency_key={event_id}",
    }
    if set(raw.split("|")) != required_parts:
        return reject("REALITY_BINDING_INVALID")
    if receipt.get("observer_provider") != "EXTERNAL_EXECUTOR_A":
        return reject("OBSERVER_IDENTITY_INVALID")

    result = {
        "decision": "ACCEPT",
        "event_id": event_id,
        "executor_provider": "EXTERNAL_EXECUTOR_A",
        "capability": cap["name"],
        "commitment_sha256": commit["payload_sha256"],
        "reality_receipt_sha256": receipt["payload_sha256"],
        "transition": "COMMITMENT_ACCEPTED->EXTERNAL_EXECUTION->REALITY_RECEIPT_ACCEPTED",
    }
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
