# article-writer

Claude Code & Cowork plugin for **human-first writing workflows**. The human writes and thinks, Claude questions, structures, and polishes. Never generates content on the author's behalf.

## Workflow

7 phases, from raw ideas to publication-ready text:

| Command | Phase | Human/AI ratio |
|---------|-------|----------------|
| `/braindump` | Raw capture + Socratic dialogue | 70/30 |
| `/structure` | Outline review (author proposes, Claude challenges) | 80/20 |
| `/draft` | Directed writing (unblock specific passages) | 70-90/10-30 |
| `/review` | Multi-axis critical review, no rewriting | 40/60 |
| `/polish` | Surface corrections (grammar, flow, consistency) | 50/50 |
| *(Phase 7)* | *Human-only: rest 24-48h, re-read cold, publish* | *100/0* |

## Skills

### Always active
| Skill | Purpose |
|-------|---------|
| `writing-voice` | Editorial identity — voice, tone, banned words, forbidden rhetorical patterns |
| `delegation-totale` | Guardrail against full-article generation in a single prompt |
| `cognitive-outsourcing` | Protects the learning benefit of writing — questions instead of explaining |

### Active during `/review` and `/polish`
| Skill | Purpose |
|-------|---------|
| `slop-vocabulary` | Detects words statistically overrepresented in LLM outputs (FR + EN) |
| `marqueurs-lexicaux` | Analyzes global statistical signature — distribution patterns, not just words |
| `structure-symetrique` | Detects artificial structural regularity (uniform sections, template patterns) |
| `slop-poli` | Detects content with surface polish but no substance |
| `fausse-profondeur` | Detects mechanical rhetorical figures — punchy triads, unearned depth, empty questions |

### Context-dependent
| Skill | Purpose |
|-------|---------|
| `article-types` | Adjusts behavior per article type (technical, REX, tutorial, opinion) |

## Installation

```bash
/plugin install article-writer@sebc-dev-marketplace
```
