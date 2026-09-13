---
name: backend-discipline
description: High-discipline methodology for designing and evolving a backend / API service — ADR decision records, a CONTEXT.md ubiquitous language with Avoid anti-patterns, load-bearing iron laws (identity-from-auth, never server-trigger, one response envelope, hard-vs-soft delete per data plane, single-point minting, fail-fast startup), and decision-hygiene heuristics (fail-safe bias, structure over prompt/convention, narrow-exception-with-guards, orthogonality, left-shift validation, retire-don't-resurrect). Use when starting or rebuilding a backend, making a non-trivial architecture or data-model decision, writing an ADR, defining domain terms for a service, designing auth/identity/deletion/idempotency, or reviewing backend design for discipline. Distilled from the MoriiServer methodology; domain-agnostic — works for any language/stack.
---

# Backend Discipline

A methodology, not a framework. It governs **how you decide, record, name, and enforce** — so a backend stays coherent across hundreds of decisions and never drifts. Distilled from a production ASP.NET Core service (MoriiServer) but every rule here is stack-agnostic.

The output of this skill is **discipline applied**: a decision made the disciplined way, an ADR written, a domain term pinned with its `Avoid`, an invariant enforced *structurally*, a review run against the gate. It is not code — it makes whatever code you write coherent.

## When to reach for it

- Starting or rebuilding a backend (greenfield or a migration like Next.js → .NET).
- Any **non-trivial decision**: data model, deletion semantics, auth, identity scope, idempotency, sync, what the server may trigger.
- Writing/updating an **ADR** or the **CONTEXT.md** domain language.
- Reviewing a design or PR for discipline ("is this rule enforced or just hoped for?").

For one-off CRUD with no decision in it, skip — discipline is for decisions, not boilerplate.

## The discipline loop — every non-trivial decision runs this

```
DECIDE → RECORD → NAME → ENFORCE → REFERENCE
```

1. **DECIDE** with the hygiene heuristics (`DECISION-HYGIENE.md`), not by reflex. Name the rejected alternatives — the decision's value lives in *why not the others*.
2. **RECORD** it as a numbered ADR (`ADR-TEMPLATE.md`) the moment it's non-obvious or someone will later ask "why". Capture rejected options + consequences, not just the choice.
3. **NAME** any new concept in `CONTEXT.md` — tight definition + `_Avoid_:` (retired words, wrong models). One word, one meaning (`CONTEXT-TEMPLATE.md`).
4. **ENFORCE** the rule *structurally* — a type, a guard, a converter, a startup check — **never** a comment or a prompt (see hygiene law: structure > convention). Add the rule to the invariants registry.
5. **REFERENCE** the ADR number everywhere it bites — in code comments, in the CONTEXT entry, in the invariant. The number is the durable handle that ties a line of code back to its reason.

Skip a step and the system rots: an unrecorded decision gets re-litigated; an un-named concept grows two meanings; a rule enforced only by comment gets violated on the third PR.

## The iron laws — load-bearing, keep them all

These hold for essentially every backend. Full catalog with rationale + how-to-check in **`IRON-LAWS.md`**. The short list:

1. **Identity & scope come from the verified credential, never the body.** Data range = the JWT/session subject; request params and model/tool args never widen it.
2. **One response envelope.** Every endpoint returns the same `{code, message, data}` shape; one global exception middleware; internal exception text never reaches the client.
3. **The server never fires user-facing actions.** It stores config and schedules *data* jobs; the online/authorized actor fires side effects. (Internal data computation — sweeps, enrich — is not "triggering".)
4. **Hard-delete vs soft-delete is chosen per data plane and never mixed.** Authoritative/shared → hard; mirrored/synced → soft + tombstone. State which and why.
5. **Mint/sign/generate through one function.** Tokens, secrets, IDs — single point, zero scattered defaults (defaults drift = security holes).
6. **Fail fast at startup.** Missing config, placeholder secret, duplicate registration → throw at boot, not at first request.
7. **Content-address blobs behind a pluggable store.** Hash = name; storage behind an interface so OSS swap is impl-only; GC live-set must include *every* reference (attachments AND avatars AND …).
8. **Idempotency is structural.** Callbacks/retries carry idempotency keys (e.g. Redis SETNX); natural-key uniqueness; a retry never double-writes.
9. **One visibility predicate.** Every read path goes through the same access check; never re-implement permissions per controller.
10. **Revocation isn't TTL.** Global epoch + per-user epoch + subject-existence check — not just short-lived tokens.

## Decision hygiene — how each call gets made

Full heuristics + worked examples in **`DECISION-HYGIENE.md`**. The reflexes:

- **Fail-safe bias.** Irreversible action (delete) + fuzzy trigger (similarity/AI) → bias *structurally* toward not acting. Fuzzy to find candidates, exact-match to act; a wrong guess is a NO-OP.
- **Structure > prompt/convention.** "A soft rule that's been violated three times must be enforced in the type system." If a comment keeps getting ignored, make it a compile error or a guard.
- **Narrow exception + guards.** Must break a rule? Open the *narrowest* hole with explicit guards and an ADR — never loosen the rule globally.
- **Orthogonality, never bleed.** Distinct concerns get distinct slots/columns/namespaces; never overload one field with two meanings (or document the dual meaning loudly).
- **Left-shift validation.** Resolve registries / parse config at boot so extension mistakes fail at startup, not in prod.
- **Retire, don't resurrect.** A pruned concept stays pruned; revert via git + a superseding ADR, never by silently re-adding the word.
- **Derive, don't store.** Client-derivable values (counts, streaks, digests) are derived; the server ships raw facts and keeps zero presentation state.

## The three durable documents

A disciplined backend keeps exactly these, and keeps them current:

| Doc | Holds | Template |
|-----|-------|----------|
| **CONTEXT.md** | the ubiquitous language: every term + `_Avoid_`, relationships, example dialogue, flagged ambiguities | `CONTEXT-TEMPLATE.md` |
| **docs/adr/NNNN-*.md** | one file per decision, with rejected alternatives + lineage (`amends`/`supersedes`/`archive`) | `ADR-TEMPLATE.md` |
| **CLAUDE.md「关键不变量」** | the load-bearing invariants, stated once, each tagged with its ADR number | see `IRON-LAWS.md` §registry |

CONTEXT.md mechanics (term sharpening, the `_Avoid_` move, domain-expert dialogue) are the `domain-modeling` skill — **compose with it**, don't re-derive. This skill adds the backend layer: ADRs, iron laws, enforcement.

## Before merge / deploy — run the gate

The pre-merge and pre-deploy discipline checklist (new endpoint / new entity / new secret / new rule / token-affecting change) lives in **`RELEASE-GATE.md`**. Run it; a green diff that skips the gate is not done.

## Using this on a real migration

Rebuilding an existing backend onto this methodology: **write CONTEXT.md first** (pin the domain in the new language before any code), then scaffold the skeleton with the iron laws baked in, then port system-by-system — each port that makes a non-obvious choice gets an ADR. The methodology is the order of operations, not an afterthought.
