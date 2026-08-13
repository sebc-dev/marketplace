---
name: slop-vocabulary
description: |
  Words and expressions overrepresented in LLM output, English and French. Reach it to scan a
  draft's vocabulary: the catalogs, and the density thresholds that decide when a marker is a
  finding rather than noise.
---

Every excess ratio below comes from Kobak et al. (2025), *Delving into ChatGPT usage in academic writing through excess vocabulary*, Science Advances, over 15.1 million PubMed abstracts with a pre/post-ChatGPT frequency comparison. Secondary: Gray (2024) for co-occurrence, Reinhart et al. (PNAS 2025) for syntax, Rigouts Terryn (LREC-COLING 2024) for French calques.

## English catalog, organized by linguistic function

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

**The French catalog is not of the same evidential class as the English one above.** The English
ratios come from Kobak's 15.1 million abstracts. **No measured list of French "AI words" exists.**
no French corpus study has computed excess-usage ratios the way Kobak did for English. The entries
below are converging observations from several sources, not measurements, and **no ratio should ever
be attached to them**. Treat them as a watch list whose weight comes from density and co-occurrence,
never from a number.

Two consequences that are easy to get wrong:

- **Do not transpose the English catalog by translating it.** *delve*, *tapestry*, *landscape* have
  no validated French equivalents. A translated blocklist is superstition with a French accent.
- **Words are the weakest French signal available.** In French, what is actually measured is
  statistical (`marqueurs-lexicaux`) and rhetorical (`fausse-profondeur`). If only vocabulary fires,
  the finding is thin.

### Didactic-style markers (the one qualitatively sourced French family)

Antoun et al. (2023, CORIA-TALN), the French reference work on ChatGPT detection: *"ChatGPT uses an
impersonal and didactic style… It often reformulates the question in its answer."* Concretely:

- an opening that reformulates or redefines the question it is answering;
- recommendation formulas: "il est important de…", "je vous recommande de…", "il convient de…";
- conditional propositions where a claim belongs: "cela pourrait entraîner…";
- a closing offer of help: "J'espère que cela vous aidera", "N'hésitez pas à…";
- the **absence** of any opinion marker: no "je pense que", no "à mon avis", no position taken.

**Status: expert observation, illustrated but not quantified.** It is the strongest thing anyone has
published on French AI style, and it is still not a measurement. So the action is different from the
rest of this skill: **flag these as passages to rewrite, never as evidence of AI origin.** The last
item is the one that matters most for this author, since an article with no position is a `writing-voice`
rule 6 failure whatever produced it.

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
"faire du sens" (make sense → avoir du sens), "adresser un probleme" (address → traiter), "naviguer le paysage" (navigate the landscape), "basiquement" (basically), Oxford comma before "et", Title Case where French uses lowercase

The unspaced American dash used to sit in this list, and it has been taken out on purpose. It is no longer a calque question: **writing-voice** bans `—` and `–` outright, spaced or not, in French and in English, so there is no correct French form left to contrast the calque against. The character is found by search in **structure-symetrique** #13, not weighed here.

### Participial abuse (-ant endings)
End-of-sentence participial clauses: "...ouvrant de nouvelles possibilites", "...suscitant des defis", "...permettant ainsi de...". GPT-4o uses present participial clauses at 5.3x the human rate.

## Co-occurrence amplification rule

From Gray (2024): 2+ markers in the same article produce +468% signal amplification. The signal is not additive, it's multiplicative.

**Practical implication:** A single "comprehensive" in isolation is noise (the word exists in normal English). But "comprehensive" + "multifaceted" + "pivotal" in the same paragraph is a strong AI signal.

## Density-based detection rules

### For /review: flagging thresholds
| Density | Action |
|---------|--------|
| 1 isolated marker in the article | Ignore, normal vocabulary overlap |
| 2-3 markers in the same paragraph | Warning: flag to author, could be coincidence |
| 4+ markers in the same paragraph | Problem: almost certainly AI-influenced passage |
| Any expression-level marker (>10x ratio) | Always flag: these are near-certain signals |
| Connector cascade (3+ formal connectors in sequence) | Always flag in blog context |

### For /polish: correction approach
- Flag markers but do NOT auto-replace (the author decides)
- Suggest simpler alternatives only when the marker adds no precision
- Never replace a marker with another marker from the banned list
- Context matters: "robust" in a statistics context is legitimate; "robust solution" in a blog post is slop

## Calibration

Type tolerance is the `slop-vocabulary` row of the one table in **article-types**. Form tolerance is in **canaux**: this catalog keeps its full weight in short form, but the density thresholds above have to be recomputed there: one marker in 150 words is a high ratio and a low count.

## Temporal note

Marker lists are not static. "Delve" has declined since widespread awareness (late 2024). "Significant" and "crucial" are rising. New markers emerge as models update. The ratios in this skill reflect 2024-2025 data and should be treated as directional, not absolute.
