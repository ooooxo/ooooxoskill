# ADR Discipline + Template

An Architecture Decision Record is the durable answer to "why is it like this?". The number becomes the handle you cite in code, CONTEXT.md, and the invariants registry forever.

## When to write one

Write an ADR the moment a decision is **any** of:
- non-obvious (a future reader will ask "why not the simpler thing?"),
- has **rejected alternatives** worth remembering,
- establishes or amends an **invariant**,
- breaks a rule (records the narrow exception + its guard).

Don't ADR boilerplate or reversible trivia. Do ADR anything you'd re-litigate in six months.

## Numbering & lifecycle

- Sequential: `docs/adr/NNNN-kebab-slug.md` (`0036-ai-memory-plane.md`). Numbers never reused.
- **Lineage in the header**: `amends NNNN` (refines), `supersedes NNNN` (replaces the decision), and move dead ones to `docs/adr/archive/`. A decision is never edited away — it's superseded by a new number that argues the change.
- **The number is load-bearing**: cite `ADR 0036` in code comments, CONTEXT entries, and invariant lines. That back-reference is how a line of code stays connected to its reason across years.

## The value is the rejected alternatives

A good ADR spends more ink on *what we didn't do and why* than on the choice. The choice is often obvious in hindsight; the rejected paths are what stop someone re-trying them. Capture the dead ends.

## Template

```markdown
# ADR NNNN — <decision in a phrase>

- Status: Accepted | Superseded by NNNN | Amended by NNNN
- Amends / Supersedes: NNNN (if any)
- Date: YYYY-MM-DD

## Context
What forced a decision. The constraints, the pressure, what was true before.
Link the CONTEXT.md terms involved.

## Decision
What we will do — stated as a rule, present tense, testable.
The invariant this creates or changes (and which registry line it updates).

## Rejected alternatives
- **<Option A>** — why not (the failure mode it would cause).
- **<Option B>** — why not.
(This section is the point of the ADR. Be specific about the failure each avoided.)

## Consequences
- What gets simpler / harder.
- New guard / structure that enforces it (per "structure > convention").
- Migration / client work it implies.
- Known follow-ups or flagged ambiguities (link to CONTEXT.md if open).
```

## Discipline checks

- A decision enforced only by comment or prompt is **not** done — the ADR's Consequences must name the **structural** guard (law: structure > convention).
- An ADR that lists no rejected alternatives is usually a decision that wasn't really examined — go back.
- Amending a rule? Edit the invariants-registry line **and** re-tag it to the new ADR in the same change.
- Reviving a retired concept needs a superseding ADR, never a quiet re-add (hygiene law 6).
