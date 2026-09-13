# Iron Laws — load-bearing rules + how to check each

Every backend keeps these. Each law: the rule, *why* it's load-bearing, and the concrete check. Tag each adopted law with an ADR number in your invariants registry.

## 1. Identity & scope come from the verified credential

Data range is the authenticated subject (JWT/session claim) — **never** the request body, query param, or a model/tool argument.

- **Why**: the body is attacker-controlled. The moment scope can come from input, every endpoint is an IDOR / privilege-escalation waiting to happen.
- **Check**: grep controllers for `userId`/`tenantId` read from `body`/`request`/args. Identity must come from `claims`/`ctx.User` only. One helper (`TryGetUserId`) all controllers reuse.

## 2. One response envelope

Every endpoint returns one shape: `{ code, message, data }`. One global exception middleware turns any throw into that shape with a generic message. Internal exception text (SQL, paths, stack) never reaches the client.

- **Why**: a uniform contract lets every client write one response handler; leaked exception text is a recon gift.
- **Check**: no controller does its own try/catch-to-JSON; the middleware is registered first; error responses carry no `ex.Message`.
- **Watch**: decide the wrapper shape ONCE. If clients read `response.data.x`, never ship an endpoint that returns `x` flat — that split is a silent contract break.

## 3. The server never fires user-facing actions

The server **stores** config and schedules **data** jobs. The online/authorized actor fires user-facing side effects (notifications, reminders, sends). No server cron that pushes a notification or "completes" something on a user's behalf.

- **Why**: server-fired user actions can't be cancelled, audited, or consented to at fire time; they create unkillable behavior and timezone bugs.
- **Nuance**: internal data computation (GC sweeps, enrichment, batch distill) is **not** "triggering" — the law forbids firing *at users/clients*, not all background work.
- **Check**: every `BackgroundService`/cron either only touches private data or is an explicit, opt-in job system — never silently acts on a user's stream.

## 4. Hard-delete vs soft-delete is chosen per data plane, never mixed

Pick per plane and write it down: authoritative / shared / multi-actor data → **hard** delete (the row is gone). Mirrored / synced / single-owner data → **soft** delete (`DeletedAt` tombstone that propagates).

- **Why**: mixing them inside one plane makes "is this gone?" unanswerable; soft-deleting shared data leaves zombies, hard-deleting synced data breaks convergence.
- **Check**: each entity's deletion semantics is stated in CONTEXT.md; a plane doesn't contain both kinds without a recorded reason.

## 5. Mint / sign / generate through one function

Token signing, secret reads, ID generation — **one** function each, reused by every call site. No second place that re-implements claims, expiry defaults, or signing.

- **Why**: two code paths = two sets of defaults = drift = the day one path forgets the new claim and forges a valid-looking token.
- **Check**: exactly one `MintToken`/`SignX`; new issue points call it, never `new JwtSecurityToken(...)` inline.

## 6. Fail fast at startup

Missing config, a still-placeholder secret (`CHANGE_ME`), a duplicate tool/route registration → **throw at boot**. Resolve registries at startup to validate them.

- **Why**: a config error that surfaces at first request is a prod incident; at boot it's a failed deploy that never goes live.
- **Check**: secret readers throw on placeholder/empty; `ToolRegistry`/`SkillRegistry` resolved in startup scope so dup names fail the deploy.

## 7. Content-address blobs behind a pluggable store

Large binaries named by content hash (SHA-256), stored behind an interface (`IBlobStore` → `DiskBlobStore`, later `OssBlobStore`). Domain code knows only the hash.

- **Why**: content-addressing dedupes and makes blobs immutable; the interface makes the OSS migration an impl swap, not a refactor.
- **GC trap**: the sweep's **live-reference set must include every kind of reference** — attachments *and* avatars *and* task-progress images. Miss one class and the sweeper deletes live data. This is the most common content-store bug.

## 8. Idempotency is structural

Callbacks, retries, multi-device actions carry an idempotency key (Redis `SETNX` claim, or a natural-key unique constraint). A retry must never double-write.

- **Why**: payment callbacks retry, clients retry, multiple devices race — "it usually only happens once" is not a guarantee.
- **Check**: payment-notify / job-claim paths take a key first; natural-key entities have a DB unique constraint, not app-level "check then insert".

## 9. One visibility predicate

All read paths go through a single access/visibility check (`SocialAccess.VisibleX`). Controllers never hand-roll "can this user see this".

- **Why**: permission logic copied into N controllers drifts; one of the copies will forget a case and leak.
- **Check**: reads compose the shared predicate; no controller writes its own `WHERE ownerId == ... OR ...`.

## 10. Revocation isn't TTL

Token revocation = global epoch (bump to invalidate all) + per-user epoch (bump on password-change / logout-all) + subject-existence check (token's subject must still exist) — **plus** short-ish TTL, not instead of it.

- **Why**: short TTL alone can't revoke a leaked token now; a stale token whose user was deleted must 401, not write orphan data.
- **Check**: `OnTokenValidated` verifies subject exists + epoch ≥ current; password-change bumps per-user epoch.

## Cross-cutting also-rans (adopt as needed)

- **Rate-limit in buckets**: auth (by IP, against stuffing) · per-user (against abuse) · expensive endpoint (by cost, against cost-DoS).
- **Security headers + input sanitizing** at the boundary: `nosniff` / `DENY` / referrer policy; strip NUL / malformed bytes before they reach handlers.
- **Schema changes via migrations only**: `ef migrations add` (or equivalent) — never hand-edit the snapshot.
- **Naming/format conventions stated once** (e.g. async methods un-suffixed, single-statement `if`/`catch` inline) so style never gets re-debated in review.

## The invariants registry (CLAUDE.md「关键不变量」)

Keep one list of the load-bearing rules, each **one line, tagged with its ADR**. It is the single place a new contributor (or agent) learns what must stay true. A rule that isn't in the registry isn't enforced — it's folklore. When an ADR amends a rule, edit the line and re-tag.
