# Writing Guide

The editorial system every article on this site runs through. Read §1 before
starting a piece; consult §3 while drafting; pass §5 before publishing. This is a
living document — edit it as the voice sharpens.

Audience goal: **build an audience** (developers who follow). The bar for any
piece is not "is this impressive" but **"would someone follow me after reading
this one thing."** That only happens when the work has a recognizable spine.

---

## 1. Positioning & spine

Re-read this paragraph before every piece:

> A systems-minded engineer with design taste, making AI legible — explaining it
> clearly first, building it into real products, and doing both with craft.

Two layers:

- **Moat (always-on, slow-aging): systems thinking + design taste.** This is
  *how* every topic gets treated, not a separate subject. It is what keeps the
  AI writing from drowning in the noise of fifty thousand identical accounts.
- **Topic priority (emphasis order):**
  1. 🥇 **Vulgarize AI** — explain it so a smart non-expert, or a busy dev,
     actually gets it. The lead product; what travels furthest.
  2. 🥈 **Build AI into products** — the engineering of shipping AI features/UX.
  3. 🥉 **Build *with* AI** — agentic dev workflow (parallel agents, Conductor,
     the real day-to-day).

**The texture rule.** Build-with-AI (🥉) is almost never its own announcement.
It is the *raw material* the explanations and case studies are made of — the real
screenshots, transcripts, diffs, and tradeoffs that prove the explainer isn't
hand-waving. If a draft is "look at this AI workflow I have," stop: find the
explanation or product story it is actually evidence for.

---

## 2. The Learn-in-Public loop

Default workflow. Don't write *about* things — **publish the exhaust of doing
them.** The unit of work is not "a post," it's *something real you built or
figured out this week*, split into recombinable lego blocks.

```
   You build/learn something real (your exhaust)
            │
            ▼
   ┌──────────────────────────────────────────────┐
   │  Split into 1–3 lego blocks (Diátaxis types)  │
   ├──────────────────────────────────────────────┤
   │  🥇 EXPLANATION  → flagship /blog essay        │  ← the "follow" magnet
   │  🥉 TUTORIAL     → "build it yourself" post    │  ← proof you actually did it
   │  🥈 CASE STUDY   → /work entry (if product-y)  │  ← the receipts
   └──────────────────────────────────────────────┘
            │
            ▼
   Explanation links to the tutorial links to the case study.
   One week of real work → a cluster, not a one-off.
```

The explanation is what spreads (reach). The tutorial and case study are the
evidence that keeps it from being noise. Aim to leave every piece of work as a
**cluster of linked blocks**, not a single orphaned post.

Optimize for the **smallest publishable unit**. A single annotated screenshot
with two paragraphs is a legitimate seedling (see §4). Shipping small and often
beats hoarding for the magnum opus — the audience tells you what to grow.

---

## 3. The four content types (Diátaxis)

The discipline that prevents muddy posts. Two axes — *learning vs doing*,
*practical steps vs theoretical knowledge* — give four types. **One piece is one
type.** Mixing an explanation with a how-to is the single most common failure
mode of AI blogging; if a draft is doing two of these, split it into two blocks.

```
                 PRACTICAL (steps)        THEORETICAL (knowledge)
 LEARNING   ┌──────────────────────┬──────────────────────────┐
 (study)    │  TUTORIAL            │  EXPLANATION             │
            │  build-with 🥉        │  VULGARIZE 🥇 + thinking  │
            ├──────────────────────┼──────────────────────────┤
 DOING      │  HOW-TO              │  REFERENCE               │
 (work)     │  build-into 🥈        │  proof / receipts         │
            └──────────────────────┴──────────────────────────┘
```

| Type | What it is | AI angle it serves | The one mistake to avoid | Title pattern |
|---|---|---|---|---|
| **Explanation** | Builds a mental model. Answers *why / what's really going on.* | 🥇 vulgarize + thinking | Sneaking in setup steps — that's a tutorial. Keep it conceptual. | *"What \<X\> actually does when …"* / *"How to think about \<X\>"* |
| **Tutorial** | A guided, learn-by-doing path to a working result. | 🥉 build-with | Assuming context. A tutorial must work start-to-finish for a stranger. | *"Build a tiny \<X\> in \<N\> lines"* |
| **How-to** | Steps to solve one specific real problem for someone who already has context. | 🥈 build-into | Explaining theory mid-recipe — link to the explanation instead. | *"How to \<task\> behind a \<boundary\>"* |
| **Reference** | Precise description of how a thing is. Dry on purpose. | proof / receipts | Narrative. Reference is looked-up, not read. | *"The \<interface\>, annotated"* |

Most flagship "follow magnets" are **Explanations**. Most `/work` entries are
**Case studies** (a narrative form, see §6) backed by **Reference**.

---

## 4. The maturity ladder (🌱 → 🌳)

Publishing stays low-pressure because not every post must be canonical. Ship
seedlings often; *promote* the ones that resonate.

| Stage | Where | Bar | Encoded as |
|---|---|---|---|
| 🌱 **Seedling** | `/blog`, rough-on-purpose, dated | a paragraph + a real screenshot/diff | `tags: [seedling]` |
| 🌿 **Growing** | `/blog`, finished | one clear idea, fully formed | `tags: [growing]` |
| 🌳 **Evergreen** | `/blog`, flagship, pinnable | the canonical piece you'd want found | `tags: [evergreen]` |

**Encoding (zero code today):** post front-matter is a strict schema with
`tags: string[]` and `draft: boolean` already present (`src/core/domain/post.ts`).
Use `draft: true` for unpublished work-in-progress, and a **stage tag** for the
maturity of *published* pieces. Promoting this to a typed `stage` front-matter
field later is a one-line schema addition — don't build it until volume justifies
it (no `/notes` or `/lab` route yet; tags first).

---

## 5. Per-article checklist

Every draft passes this before publishing:

1. **One type?** Is this exactly one Diátaxis type (§3), or a muddy mix that
   should be split into a cluster?
2. **Spine present?** Where is the systems/design-taste angle? If a generic AI
   account could have written it, the moat is missing.
3. **Real artifact?** What is the receipt — the screenshot, transcript, diff,
   benchmark, or code that proves this is lived, not summarized?
4. **One idea.** Can the piece be summarized in a single sentence? If it needs
   "and also," cut or split.
5. **Audience earns a follow?** After reading only this, is there a reason to
   want the next one?
6. **Cluster links?** Does it link to its sibling blocks (explanation ⇄ tutorial
   ⇄ case study) where they exist?
7. **Texture rule (§1).** If this is build-with-AI content, is it serving an
   explanation/product story rather than being a bare "look at my workflow"?
8. **Front-matter correct?** `title`, `date`, `summary`, `tags` (incl. stage),
   `draft` set deliberately.

---

## 6. Voice & craft rules

- **Concrete over abstract.** A specific example beats a general claim every time.
- **Show the real thing.** Actual screenshots, real agent transcripts, the actual
  diff — not reconstructed-for-the-post versions.
- **One idea per piece.** Depth on one thing, not breadth on five.
- **Earn the abstraction.** Lead with the concrete case; generalize only after the
  reader has something to hang it on.
- **Lead with the point.** Conclusion first, then the reasoning — readers scan.
- **Terse beats polite.** Cut hedging, throat-clearing, and "in this post I will."
- **Respect the reader's competence.** Vulgarize the unfamiliar, never the reader.

---

## 7. Worked example — the parallel-agents cluster

One real thing (running multiple coding agents in parallel via Conductor),
through the whole system:

- 🥇 **Explanation (flagship `/blog`):** *"What's actually happening when you run
  4 coding agents in parallel"* — the mental model: context windows, queues, and
  merge conflicts framed as a systems problem. Spine = systems thinking. Stage:
  🌳 evergreen target.
- 🥉 **Tutorial (`/blog`):** *"Set up parallel agent workspaces in an afternoon"*
  — guided, works start-to-finish. The build-with-AI texture, serving the
  explanation above. Links back to it.
- 🥈 **Case study (`/work`):** *"This portfolio, built with a fleet of agents —
  the boundaries that made it safe"* — Situation → Decision → Tradeoff → Outcome,
  with the hexagonal port boundaries as the receipts (Reference-grade detail).

That single week of real work demonstrates all three AI angles **in priority
order**, proves the craft/systems moat, and is fully authentic because it was
lived. That is the shape to aim for every time.
