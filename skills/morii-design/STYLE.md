# Morii Style — one language, tuned per product; divergence lives in form

> **Read** when a product or page has no decided look, or when the user rejects the look.
> Morii is one language — 克制 · 层次 · 呼吸感 — not a theme picker. 克制 means every element and every color has a job; it does not mean neutral. A product tunes it with a few dials and never swaps it for a costume. What differs between good designs is mostly **form**, not skin.

## 1. The language's range

| Axis | In range | Outside the language |
|---|---|---|
| **Surface** | one flat sheet · tone steps · a soft diffuse lift · a shape grown from its host · a real object's proportions (a note as a sheet of paper) | heavy outlines, hard offset shadows, bevels and edge lights, grain, glow backdrops |
| **Color** | neutral + one accent · a brand-tinted ground · solid color blocks for sections or objects · a harmonized category set (`--cat-*`) · monochrome — hues from the product, each with a job | unrelated hues, muddy greyed mid-tones over large areas, decorative gradients |
| **Ground** | dark · light · both | — |
| **Shape** | soft to round, scaled by the box | sharp zero radius, shapes mixed at random |
| **Type** | system sans; a serif only for long reading; mono only for code and IDs | display fonts as decoration |
| **Depth** | flat at rest, diffuse when floating | shadows on resting things |
| **Density** | airy · comfortable · compact, by content | — |
| **Motion** | crisp · springy, by gesture | — |

## 2. Dials — a product's tuning

The head of the token file holds them: brand hue, color strategy, ground, `--shape`, `--density`, `--depth`, `--pace`. Set them once per product from its content — dense operations → compact and crisp; long reading → airy and softer — and every screen inherits them. That tuning is the product's unified style.

## 3. Divergence is in form

When a design is undecided, make 3–4 directions that differ in kind, on the same content, with the same dials:

- **What leads** — which figure, object or action is the protagonist.
- **Structure** — a strip and a big chart · one hero and a drill-down · a timeline · a bento with one dominant tile; a list · a board · a canvas.
- **Where things come from** — a panel that slides in, a shape that grows out of its trigger, an inline expansion, a layer over the object.
- **Material within the range** — a flat sheet vs. a soft lift vs. a shape grown from its host.
- **Density** — how much is visible at once.

Recommend one and say why, tied to the content. Changing only the hue or the radius is not a direction; swapping the skin for a theme is not one either.

## 4. The Morii preset

`Token.css` is Morii's tuning — one choice, not the language's rule: tone-step surfaces · mostly neutral + one accent, color at full strength where it lands · dark-first with a light twin · soft shape (pills only for chips) · system sans, two weights · hairline lines · flat at rest, diffuse only when floating · comfortable · crisp motion · solid icons. Inside Morii and Hrige repos it is the decided tuning; a new product re-tunes the dials, not the language.
