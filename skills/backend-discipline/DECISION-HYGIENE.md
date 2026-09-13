# Decision Hygiene — the reflexes that keep a backend coherent

How each non-trivial call gets made. Each heuristic: the rule, the failure it prevents, a worked example.

## 1. Fail-safe bias

When an action is **irreversible** (delete, send, charge) and its trigger is **fuzzy** (similarity score, AI judgment, NL match), bias *structurally* toward not acting.

- Use fuzzy matching only to **find candidates**; require **exact match** (or human confirm) to **act**.
- A wrong guess must be a **NO-OP**, not a wrong deletion.
- **Example**: "forget what I told you about X" — recall candidates by embedding (fuzzy), then delete only on *exact original-text* match. AI points at the wrong row → nothing deleted. Two-layer fail-safe: prompt-unsure → treat as independent; no model available → fall back to pure cosine and **never delete**.
- **Anti-example**: deleting on a cosine ≥ 0.92 threshold. Fuzzy + irreversible = eventual wrong delete.

## 2. Structure > prompt / convention

A soft rule (comment, prompt instruction, "we agreed to…") that has been violated **three times** must be moved into structure: a type, a guard, a converter, a unique constraint, a startup check.

- **Why**: soft rules degrade. Reviewers miss them; new code doesn't know them; prompts get edited.
- **Example**: "never write the *other*-person nickname into the *self* address slot." Prompt fences failed three times → add a hard guard in the writer that rejects any value matching a known friend remark. Structure caught what three prompt revisions couldn't.
- **Move**: when you catch yourself writing "remember to…", stop and ask "what would make forgetting impossible?"

## 3. Narrow exception + guards (not a broad loosening)

When a real case forces breaking a rule, open the **narrowest possible hole**, fence it with explicit guards, and record both in an ADR. Never relax the rule globally to fit one case.

- **Example**: "synced data is append-only, never re-checked for duplicates" — but one list-append flow genuinely needs a pre-check. Solution: a *narrow* precheck that fires **only when the user names a specific collection**; event-stream writes still never dedup. The general rule stands; the exception is bounded and guarded.
- **Tell**: if your fix changes a rule's behavior for cases it wasn't about, it's too broad. Shrink it.

## 4. Orthogonality — never let two meanings share one field

Distinct concerns get distinct slots / columns / namespaces. If one column must carry two meanings, that duality is documented **loudly** and guarded — but prefer splitting.

- **Examples**: *self-address* vs *other-address* are opposite directions → two slots, never cross-write. *Calendar* (looked at) vs *alarm* (fires at you) → two entities, not one with a flag. *Real name* vs *preferred calling* → two slots, coexist.
- **Failure it prevents**: a field overloaded with two meanings produces a bug class that no amount of careful reading fixes, because the data itself is ambiguous.

## 5. Left-shift validation (boot > request > prod)

Push every failure to the earliest point it can be detected: compile-time > startup > first request > production.

- Parse config and resolve registries at **startup** so a typo or duplicate fails the deploy.
- Validate the *shape* of extension points (tool tables, skill manifests) at boot.
- **Why**: an error that can only surface in prod *will* surface in prod, at the worst time.

## 6. Retire, don't resurrect

A retired concept/word is **pruned**. It never silently reappears. To bring it back: `git revert` + a *superseding* ADR that argues the reversal — not a quiet re-add.

- **Why**: zombie concepts (re-added retired words, half-revived features) create two mental models of the system at once. The ADR trail is the only source of "is this alive?".
- **Check**: retired words live in CONTEXT.md `_Avoid_` lists; a PR reintroducing one needs an ADR or it's rejected.

## 7. Derive, don't store

Anything a client can compute from raw facts (counts, streaks, digests, relative times, display strings) is **derived client-side**. The server ships raw facts and stores zero presentation state.

- **Why**: every stored derived value is a consistency liability — it can disagree with its source. Not storing it makes the disagreement impossible.
- **Boundary**: the one thing the server *does* store is what it must arbitrate (authoritative counts like vote tallies). Presentation is never that.

## 8. Honest degradation

When data/context is genuinely missing, **say so** — never fabricate to look complete. Choose the failure direction deliberately: **fail-open** for availability where safe (a DB blip shouldn't lock out all valid users), **fail-closed** for security (an unverifiable token is rejected).

- **Example**: subject-existence check caches only *positive* existence (60s), never caches "doesn't exist"; on DB timeout it fails **open** (the request already passed signature validation, downstream writes fail anyway). One transient read never locks out the whole user base.

## The meta-rule

Every one of these trades a little short-term convenience for a structural guarantee. That trade is the methodology. When a decision feels like it's "probably fine", that's the signal to apply a heuristic and make it *provably* fine — or record (ADR) why the cheap path is acceptable here.
