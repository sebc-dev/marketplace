# article-writer

Claude Code plugin for **human-first writing workflows**. The human writes and thinks, Claude questions, structures, reviews, and polishes. Never generates content on the author's behalf.

Articles are written in French first, then translated to English via `/translate`.

## Philosophy

Writing is thinking. When you write to learn, the cognitive effort of formulating ideas is the point — not the output. This plugin ensures AI assists the writing process without replacing it.

- **The human owns the content.** Thesis, opinions, anecdotes, angle — always human.
- **AI owns the process.** Questioning, structural review, detection, surface corrections.
- **Never 0%/100%.** Even at maximum AI involvement (review), the human still decides what to fix and how.
- **Iterative beats single-shot.** Research shows 15-57% quality improvement from phased approaches vs single-prompt generation.

## Workflow

8 phases, from raw ideas to bilingual publication:

| Phase | Command | What happens | Human/AI |
|-------|---------|-------------|----------|
| 1-2 | `/braindump` | Raw capture + Socratic dialogue | 70/30 |
| 3 | `/structure` | Outline review (author proposes, Claude challenges) | 80/20 |
| 4 | `/draft` | Directed writing (unblock specific passages) | 70-90/10-30 |
| 5 | `/review` | Multi-axis critical review, no rewriting | 40/60 |
| 6 | `/polish` | Surface corrections (grammar, flow, consistency) | 50/50 |
| 6b | `/translate` | FR→EN translation + full re-polish pass | 30/70 |
| 7 | *(human)* | Rest 24-48h, reread cold, read aloud, publish | 100/0 |

## Skills

15 skills, grouped by the job they do. Each one's own description says when it fires — this table is the human index, not a second copy of them.

### The voice, and the three axes that vary under it
| Skill | Owns |
|-------|------|
| `writing-voice` | Editorial identity: six voice rules, anti-fabrication, the draft-time filter — and the definition of the three axes below |
| `casquettes` | Who is speaking — personal dev, AI Manager at CEGAPE, founder of Isometria |
| `canaux` | Where and how long — form drives the detectors, platform drives the surface |
| `article-types` | What kind of piece — the one detector-tolerance table |

### The guardrails
| Skill | Owns |
|-------|------|
| `delegation-totale` | A whole article from one prompt: the redirect, and the exceptions |
| `cognitive-outsourcing` | Offloading a task vs handing over the understanding — the Socratic redirect |

### The detectors
| Skill | Owns |
|-------|------|
| `slop-poli` | Whether the piece says anything. Outranks every surface finding |
| `marqueurs-lexicaux` | The statistical distribution — burstiness, register leveling, recycling |
| `structure-symetrique` | The document's shape — 16 patterns, Bouchard test, genre matrix |
| `fausse-profondeur` | Mechanical rhetorical figures — 12 categories, paragraph by paragraph |
| `slop-vocabulary` | Words and expressions overrepresented in LLM output, EN and FR |

### The arbiter
| Skill | Owns |
|-------|------|
| `faux-positifs` | What to do when a detector fires on legitimate writing. Every finding passes through it before the report is written |

### On demand
| Skill | Owns |
|-------|------|
| `lisibilite-fr` | French readability by pure counting — LIX, ARI, and what corrupts them |
| `seo-editorial` | On-page editorial SEO — Google publishes no character limit, only a pixel budget |
| `skills-tiers` | Whether a third-party writing skill can be installed, forked or trusted |

Some skills carry a `references/` folder — dated sources, tooling notes, the evidence behind a guardrail. Those load only when asked for; nothing in a `SKILL.md` depends on having read them.

## Quick start

```
/braindump [paste your raw notes here]
```

Then follow the workflow: `/structure` → `/draft` → `/review` → `/polish` → `/translate`.

## Installation

```bash
/plugin install scd-writer@sebc-dev-marketplace
```
