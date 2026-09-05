# RNCP Commitment Protocol v1

Provider-neutral contract for machine-native commitments.

## Invariant

`Reality -> Commitment -> Independent Verification -> Capability Unlock -> Downstream Action -> External Reality Event -> Durable State -> Replay Reject`

## Provider roles

- **issuer** creates a commitment and publishes its canonical payload hash.
- **verifier** obtains evidence independently and recomputes the hash; issuer-provided assertions are insufficient.
- **executor** may act only after a valid commitment is verified.
- **reality_observer** is an external system that records the downstream action as an independently retrievable event.

## Canonical commitment

The commitment payload is an opaque UTF-8 string. Its SHA-256 digest is the protocol identity for integrity checks.

A valid commitment must contain:

- unique `event_id`
- issuer, verifier, executor, and reality observer provider identities
- `payload_sha256`
- `state=VALID`
- capability `single_use=true`
- replay policy `REJECT_AFTER_CONSUMPTION`

## Safety rules

1. Verification must fetch evidence independently from the issuer's workflow state.
2. Hash verification must be recomputed by the verifier.
3. Capability unlock occurs only after verification passes.
4. The downstream action produces an external observer receipt.
5. Consumption is durable and replay of the same event is rejected.
6. Provider adapters must be replaceable without changing the commitment object.
