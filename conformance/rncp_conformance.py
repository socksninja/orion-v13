#!/usr/bin/env python3
"""Provider-neutral RNCP-COMMITMENT-V1 conformance verifier."""
import hashlib
import json
import sys
from pathlib import Path

REQUIRED = {
    "protocol", "event_id", "issuer", "verifier", "executor",
    "reality_observer", "commitment", "capability", "replay_policy"
}


def fail(reason: str) -> None:
    print(json.dumps({"decision": "FAIL", "reason": reason}, sort_keys=True))
    raise SystemExit(1)


def verify(path: str) -> dict:
    obj = json.loads(Path(path).read_text())
    if set(obj) != REQUIRED:
        fail("REQUIRED_FIELDS_OR_ADDITIONAL_FIELDS")
    if obj["protocol"] != "RNCP-COMMITMENT-V1":
        fail("PROTOCOL_VERSION_MISMATCH")
    if not isinstance(obj["event_id"], str) or len(obj["event_id"]) < 8:
        fail("EVENT_ID_INVALID")
    for actor_name in ("issuer", "verifier", "executor", "reality_observer"):
        actor = obj[actor_name]
        if set(actor) != {"provider", "executor_class"}:
            fail(f"ACTOR_SHAPE_INVALID:{actor_name}")
        if not all(isinstance(v, str) and v for v in actor.values()):
            fail(f"ACTOR_VALUE_INVALID:{actor_name}")
    commitment = obj["commitment"]
    if set(commitment) != {"payload", "payload_sha256", "state"}:
        fail("COMMITMENT_SHAPE_INVALID")
    if not isinstance(commitment["payload"], str) or not commitment["payload"]:
        fail("PAYLOAD_INVALID")
    expected = hashlib.sha256(commitment["payload"].encode()).hexdigest()
    if commitment["payload_sha256"] != expected:
        fail("PAYLOAD_HASH_MISMATCH")
    if commitment["state"] != "VALID":
        fail("COMMITMENT_NOT_VALID")
    capability = obj["capability"]
    if set(capability) != {"name", "single_use"}:
        fail("CAPABILITY_SHAPE_INVALID")
    if not isinstance(capability["name"], str) or not capability["name"]:
        fail("CAPABILITY_NAME_INVALID")
    if capability["single_use"] is not True:
        fail("CAPABILITY_MUST_BE_SINGLE_USE")
    if obj["replay_policy"] != "REJECT_AFTER_CONSUMPTION":
        fail("REPLAY_POLICY_INVALID")
    return {
        "decision": "PASS",
        "protocol": obj["protocol"],
        "event_id": obj["event_id"],
        "payload_sha256": expected,
        "capability": obj["capability"]["name"],
        "single_use": True,
        "replay_policy": obj["replay_policy"],
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        fail("USAGE")
    print(json.dumps(verify(sys.argv[1]), sort_keys=True))
