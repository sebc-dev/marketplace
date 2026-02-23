---
name: slop-vocabulary
description: |
  Active during /review and /polish. Detects words and expressions statistically
  overrepresented in LLM outputs. Provides quantitative ratios from Kobak et al. (2025),
  English and French catalogs organized by linguistic function, expression-level signals,
  co-occurrence rules, and density-based detection thresholds. Complements marqueurs-lexicaux
  (which handles statistical distribution patterns, not word catalogs).
---

## Source and methodology

Primary source: Kobak et al. (2025), "Delving into ChatGPT usage in academic writing through excess vocabulary", Science Advances, based on 15.1 million PubMed abstracts (2010-2024). Pre/post ChatGPT frequency comparison yields excess usage ratios per word.

Secondary sources: Gray (2024) co-occurrence amplification study, AI Phrase Finder (50,000+ texts), Reinhart et al. (PNAS 2025) for syntactic markers, Rigouts Terryn (LREC-COLING 2024) for French calques.

## English catalog — organized by linguistic function

### Verbs (66% of excess markers per Kobak taxonomy)
| Verb | Excess ratio | Notes |
|------|-------------|-------|
| delve | 28.0x | Most extreme single-word marker |
| showcase | 10.7x | |
| underscore | 10.4x | |
| utilize | 6.2x | Almost always replaceable by "use" |
| leverage | 5.8x | |
| foster | 3.3x | |
| facilitate | 3.1x | |
| harness | 2.9x | |
| bolster | 2.7x | |
| catalyze | 2.5x | |
| augment | 2.3x | |
| ameliorate | 2.1x | |
| elevate | 2.0x | |
| navigate | 1.9x | As metaphor, not literal |
| illuminate | 1.8x | |
| empower | 1.7x | |
| embark | 1.6x | |
| embrace | 1.5x | AI Phrase Finder "obsession" word |

### Adjectives (14% of excess markers)
| Adjective | Excess ratio |
|-----------|-------------|
| multifaceted | 5.1x |
| commendable | 4.8x |
| meticulous | 4.6x |
| intricate | 4.5x |
| pivotal | 4.3x |
| nuanced | 4.2x |
| noteworthy | 3.8x |
| invaluable | 3.5x |
| paramount | 3.2x |
| indispensable | 3.0x |
| robust | 2.8x |
| comprehensive | 2.6x |
| salient | 2.4x |
| burgeoning | 2.2x |
| nascent | 2.0x |

### Adverbs
notably, meticulously, undeniably, remarkably, arguably, crucially, intriguingly, importantly

### Abstract nouns
landscape, tapestry, realm, beacon, testament, plethora, myriad, endeavor, synergy, paradigm

### Formal substitute verbs (replace common verbs with unnecessarily formal ones)
utilize (for use), facilitate (for help), implement (for start/do), leverage (for use), navigate (for deal with), optimize (for improve), streamline (for simplify)

### Introduction formulas
"In this article, we will explore...", "Let's dive into...", "Let's unpack...", "Here's the thing:", "Enter: [thing]"

## Expression-level signals

Expressions are stronger markers than individual words because they're less likely to appear by chance.

| Expression | Excess ratio | Notes |
|-----------|-------------|-------|
| "plays a crucial role in shaping" | 182x | Strongest documented expression-level marker |
| "notable works include" | 120x | |
| "a testament to" | 45x | |
| "it's worth noting that" | ~30x | Filler hedge |
| "it's important to remember" | ~25x | |
| "in the ever-changing landscape of" | ~20x | |
| "navigate the complexities of" | ~18x | |
| "at the forefront of" | ~15x | |
| "paving the way for" | ~12x | |
| "a holistic approach" | ~10x | |
| "best practices" | ~8x | Legitimate in some technical contexts |
| "key takeaways" | ~7x | |

## French catalog

### Connector cascades (most frequent French LLM signal)
de plus, en outre, par ailleurs, neanmoins, cependant, toutefois, par consequent, en somme, en effet, il convient de noter, force est de constater, il est important de souligner, a cet egard, dans cette optique

The "philosophy essay" effect: LLMs chain formal connectors creating a register that sounds like a high-school dissertation, not a blog article.

### The "crucial" cluster (#1 French marker, documented by 4+ independent sources)
crucial, essentiel, indispensable, fondamental, incontournable, primordial, determinant

### Hyper-formal register (wider gap than in English)
indeniablement, mettre en place, mettre en oeuvre, permettre de, se positionne comme, au coeur de, dans un paysage en constante evolution, il est a noter que, il importe de souligner

### Formulaic openings
"Dans un monde ou...", "A l'ere de...", "Au coeur de...", "Plongez dans l'univers des...", "Que vous soyez... ou que vous soyez...", "Dans un contexte ou..."

### English calques (16% of all French LLM linguistic errors)
"faire du sens" (make sense → avoir du sens), "adresser un probleme" (address → traiter), "naviguer le paysage" (navigate the landscape), "basiquement" (basically), Oxford comma before "et", American em dashes in French text, Title Case where French uses lowercase

### Participial abuse (-ant endings)
End-of-sentence participial clauses: "...ouvrant de nouvelles possibilites", "...suscitant des defis", "...permettant ainsi de..." — GPT-4o uses present participial clauses at 5.3x the human rate.

## Co-occurrence amplification rule

From Gray (2024): 2+ markers in the same article produce +468% signal amplification. The signal is not additive — it's multiplicative.

**Practical implication:** A single "comprehensive" in isolation is noise (the word exists in normal English). But "comprehensive" + "multifaceted" + "pivotal" in the same paragraph is a strong AI signal.

## Density-based detection rules

### For /review — flagging thresholds
| Density | Action |
|---------|--------|
| 1 isolated marker in the article | Ignore — normal vocabulary overlap |
| 2-3 markers in the same paragraph | Warning — flag to author, could be coincidence |
| 4+ markers in the same paragraph | Problem — almost certainly AI-influenced passage |
| Any expression-level marker (>10x ratio) | Always flag — these are near-certain signals |
| Connector cascade (3+ formal connectors in sequence) | Always flag in blog context |

### For /polish — correction approach
- Flag markers but do NOT auto-replace (the author decides)
- Suggest simpler alternatives only when the marker adds no precision
- Never replace a marker with another marker from the banned list
- Context matters: "robust" in a statistics context is legitimate; "robust solution" in a blog post is slop

## Calibration by article type

Tolerance levels vary. See article-types skill for full calibration tables.

| Article type | Tolerance | Rationale |
|-------------|-----------|-----------|
| Opinion/reflection | Very low | Personal writing should have the least LLM footprint |
| Experience report (REX) | Low | Lived experience has its own vocabulary |
| Technical/dev | Medium | Technical jargon can trigger false positives |
| Tutorial/guide | Medium-high | Instructional format naturally overlaps with LLM patterns |

## Temporal note

Marker lists are not static. "Delve" has declined since widespread awareness (late 2024). "Significant" and "crucial" are rising. New markers emerge as models update. The ratios in this skill reflect 2024-2025 data and should be treated as directional, not absolute.

## Relationship with other skills

- **writing-voice**: Consumes the banned word lists from this skill for the always-active voice filter
- **marqueurs-lexicaux**: Complements this skill — slop-vocabulary detects *what* (specific words), marqueurs-lexicaux detects *how* (statistical distribution patterns like TTR, entropy, burstiness)
- **fausse-profondeur**: Handles rhetorical patterns (structural), not vocabulary
- **slop-poli**: Uses vocabulary detection as one input to the broader "substance vs polish" evaluation
