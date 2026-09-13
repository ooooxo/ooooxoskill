# CONTEXT.md — ubiquitous language template

CONTEXT.md is the project's domain dictionary: one place where every term has **one** meaning, and every wrong model is explicitly listed as `_Avoid_`. It is read before code, kept current with code, and cited by ADRs.

The *mechanics* of sharpening a term (find the real concept, name it, separate it from neighbors) belong to the **`domain-modeling`** skill — invoke it for the hard cases. This template is the backend-flavored skeleton + the discipline rules.

## Why the `_Avoid_` line is the whole point

Anyone can write a definition. The discipline is listing, per term, the **wrong models people actually reach for**: retired words, over-engineered shapes, the mistake that bites. The `_Avoid_` line is what stops the concept from quietly growing a second meaning. Never ship a term without it.

## Skeleton

```markdown
# <Domain> (server domain)

One paragraph: what this service is the authority for, and what it is NOT.
Name the major data planes (e.g. "authoritative plane: REST, hard-delete,
server-arbitrated" vs "mirrored plane: sync, soft-delete, last-write-wins")
and state they don't mix.

## Language

### <Group, e.g. Identity>

**<Term>**:
Tight definition — what it is, its key fields, its one job. State which plane it
lives on and its deletion semantics. Cite the ADR that pinned it.
_Avoid_: <retired word>; <wrong model>; <the mistake that bites>

**<Term>**:
…
_Avoid_: …

### <Group, e.g. Lifecycle / Permissions / …>
…

## Relationships
- How the entities reference each other; which crossings are allowed.
- Per-plane deletion + visibility rules restated as relationships.
- Which references must enter the blob GC live-set (every kind, or the sweeper
  deletes live data).

## Example dialogue
> **Dev:** "<a real question a newcomer asks>"
> **Domain expert:** "<the canonical one-paragraph answer, citing the ADR>"
(3–6 of these. They encode the reasoning, not just the facts — the fastest way
to onboard a human or an agent.)

## Flagged ambiguities
- Open questions, deferred decisions, known gaps — each with the trigger that
  would make us decide (e.g. "block/abuse: not built until real harassment").
```

## Discipline rules

- **One word, one meaning.** If a word is doing two jobs, split it and list the loser in `_Avoid_`.
- **Retired words live forever in `_Avoid_`.** Pruned concepts are named so they're never silently reintroduced (hygiene law 6).
- **Every term names its plane + deletion semantics.** That's where iron-law 4 (hard vs soft) gets pinned per entity.
- **Cite ADRs inline.** `(ADR 0030)` next to the rule it established — the dictionary and the decision log stay welded.
- **The example dialogue is not decoration.** It's the highest-bandwidth onboarding artifact; write the questions newcomers actually ask.
- **Keep it current.** A CONTEXT.md that lags the code is worse than none — it teaches the wrong model confidently. Updating it is part of the change, not a follow-up.
