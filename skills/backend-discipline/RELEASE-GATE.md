# Release Gate — pre-merge / pre-deploy discipline checklist

Run this against the diff before merge, and the relevant rows before deploy. A green build that skips the gate is **not done**. Each row maps to an iron law / hygiene heuristic; the point is to make the laws *checked*, not remembered.

## Any new endpoint

- [ ] Identity & scope come from the **token claim**, not the body/params/args (law 1).
- [ ] Returns the **one response envelope**; errors go through the global middleware; no leaked exception text (law 2).
- [ ] Reads go through the **shared visibility predicate** — no hand-rolled permission check (law 9).
- [ ] If expensive (LLM, blob, heavy query): behind a **rate-limit bucket** by user/cost.
- [ ] Input sanitized at the boundary; size-limited.

## Any new entity / schema change

- [ ] **Deletion semantics chosen** (hard vs soft) and stated in CONTEXT.md (law 4).
- [ ] Migration via the tool (`ef migrations add` / equiv), **snapshot not hand-edited**.
- [ ] If it references blobs, the reference is in the **GC live-set** (law 7 — the classic miss).
- [ ] New natural-key uniqueness enforced by a **DB constraint**, not app-level check-then-insert (law 8).
- [ ] Term defined in **CONTEXT.md** with its `_Avoid_` line.

## Any new secret / config

- [ ] **Fail-fast** if missing or placeholder at startup, not at first request (law 6).
- [ ] Read through the single config point; no scattered defaults (law 5).

## Anything touching tokens / auth

- [ ] Issued through the **single mint function**; not `new Token(...)` inline (law 5).
- [ ] Revocation considered: epoch / per-user epoch / subject check — not TTL alone (law 10).
- [ ] Sliding-renewal / expiry behavior unchanged or ADR'd.

## Any side-effecting background work

- [ ] It does **not** fire user-facing actions; it touches private data or is an explicit job system (law 3).
- [ ] Multi-instance / retry safe: **idempotency key** or natural-key guard (law 8).

## Any new or changed rule

- [ ] Enforced **structurally** (type / guard / constraint / startup check), not by comment or prompt (hygiene 2).
- [ ] Added/updated in the **invariants registry**, tagged with its ADR.
- [ ] If it loosens an existing rule: it's a **narrow, guarded exception** with an ADR, not a global relaxation (hygiene 3).

## Any non-obvious decision in the diff

- [ ] **ADR written** with rejected alternatives + consequences, and its number cited in the code (loop step RECORD/REFERENCE).
- [ ] No **retired concept** silently reintroduced (hygiene 6) — if revived, a superseding ADR exists.

## Deploy-time

- [ ] Startup fail-fast passes (config, secrets, registry resolution) — a bad config fails the deploy, never reaches users.
- [ ] Token-invalidating changes (epoch bump, key rotation) have a client story (401 → re-login handled) before shipping.
- [ ] CORS / allowed-origins explicit in prod, not wildcard-by-default.

---

**How to use in review**: don't tick every box on every PR — scan to the sections the diff touches (the headers are the index) and check those. The discipline is that the relevant boxes are *checked*, not that the list is long.
