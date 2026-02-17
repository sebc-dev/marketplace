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

### Always active
| Skill | Purpose |
|-------|---------|
| `writing-voice` | Editorial identity — voice, tone, banned words (EN+FR), 12 forbidden rhetorical patterns |
| `delegation-totale` | Guardrail against full-article generation in a single prompt |
| `cognitive-outsourcing` | Protects the learning benefit of writing — questions instead of explaining |

### Active during `/review` and `/polish`
| Skill | Purpose |
|-------|---------|
| `slop-vocabulary` | Detects words statistically overrepresented in LLM outputs (EN+FR catalogs with Kobak ratios) |
| `marqueurs-lexicaux` | Analyzes statistical signature — TTR, MTLD, burstiness, register leveling |
| `structure-symetrique` | Detects artificial structural regularity — 16 patterns + Bouchard structural test |
| `slop-poli` | Detects surface polish without substance — 5 diagnostic tests + VERMILLION framework |
| `fausse-profondeur` | Detects mechanical rhetorical figures — 12 categories with EN+FR examples |

### Context-dependent
| Skill | Purpose |
|-------|---------|
| `article-types` | Adjusts detection thresholds per article type (technical, REX, tutorial, opinion) |

## Quick start

```
/braindump [paste your raw notes here]
```

Then follow the workflow: `/structure` → `/draft` → `/review` → `/polish` → `/translate`.

## Installation

```bash
/plugin install article-writer@sebc-dev-marketplace
```
