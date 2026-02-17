---
name: structure-symetrique
description: |
  Active during /review and /structure. Detects artificial structural regularity in text.
  Covers all 16 structural patterns from R4 (Signatures structurelles du texte LLM),
  the Bouchard structural test, genre calibration matrix, and strategies to break symmetry.
  Works at document level, complementing paragraph-level skills (slop-vocabulary,
  marqueurs-lexicaux, fausse-profondeur).
---

## The 16 structural patterns

Source: R4 (Signatures structurelles du texte LLM et caracteristiques de l'ecriture humaine organique), with data from Munoz-Ortiz (2024), Reinhart et al. (PNAS 2025), Herbold (Scientific Reports 2023), DivEye (2025), Steere (2024).

### 1. Narrow sentence length distribution
LLM sentences cluster in the 10-30 token range. Human writing includes both very short (<5 tokens) and very long (>40 tokens) sentences.
**Detection:** If no sentence in the article is shorter than 8 words or longer than 35 words, flag it.

### 2. Predominance of Elaboration relations (RST theory)
In Rhetorical Structure Theory, LLMs overuse Elaboration (expanding on the same point) while humans use more Joint relations (parallel, independent points branching the discourse).
**Detection:** Does every paragraph elaborate on the previous one? Or do some introduce genuinely new threads?

### 3. Discourse coherence loss in long documents
LLMs segment without maintaining a central thread. After ~2000 tokens, the model loses track of the global argument and starts generating locally coherent but globally disconnected sections.
**Detection:** Read the first and last third of the article. Do they feel like the same article with the same argument? If the second half drifts, flag it.

### 4. Absence of register variation
Instruction-tuned models produce one register regardless of genre (Reinhart et al., PNAS 2025). Biber feature analysis shows convergent profiles across blogs, academic papers, and fiction.
**Detection:** Does the text maintain exactly the same formality level throughout? Human writers naturally shift: technical in explanations, casual in asides, reflective in conclusions.

### 5. Excessive syntactic complexity and nominalization
GPT-3 syntactic depth: 6.18; GPT-4: 5.94; humans: 5.72. Subordinate clauses: GPT-3 2.31 per sentence, GPT-4 2.08, humans 1.81 (Herbold, Scientific Reports 2023).
**Detection:** Sentences that are consistently complex without variation. Human writing alternates between simple declarative sentences and complex ones.

### 6. Symmetric surprisal distribution
AI text has low skewness in surprisal distribution. Human text has positive skewness and high kurtosis — rare but dramatic surprisal spikes (unexpected word choices, register breaks).
**Detection:** Does anything in the text genuinely surprise you as a reader? If every sentence is predictable, flag it.

### 7. Tripartite paragraph template
Definition sentence → useful information → generic closing sentence. This three-part pattern is the structural fingerprint of LLM paragraphs.
**Detection:** Read the first and last sentence of each paragraph. If the first is always a general statement and the last always a vague takeaway, the text follows the template.

### 8. Formulaic paragraph openings
"Furthermore", "Moreover", "Additionally" cascade (Steere, analysis of 50+ AI essays). Every paragraph opens with a formal connector.
**Detection:** List the first word of each paragraph. If 3+ consecutive paragraphs start with formal connectors ("Furthermore", "Additionally", "Moreover", "De plus", "En outre", "Par ailleurs"), flag it.

### 9. Excessive list-like structure
Bullets and numbered lists in genres where humans would write prose. Subsections where a paragraph would suffice.
**Detection:** Count lists vs prose paragraphs. In a blog article, more than 30% lists (excluding code blocks) is suspicious.

### 10. Disproportionately long conclusions starting with "Overall"/"In conclusion"
LLM conclusions are abnormally long, repetitive, and start with formulaic markers. They summarize the entire article instead of adding a final perspective.
**Detection:** Is the conclusion longer than 20% of the article? Does it start with "Overall", "In conclusion", "En somme", "En definitive"? Does it repeat points already made?

### 11. Direct entry into subject (no warm-up)
AI jumps straight to the topic without context-setting. Human writers use gradual entry — an anecdote, a question, a scene, a personal observation that leads into the topic.
**Detection:** Does the first paragraph immediately define the topic ("X is a framework for...")? Lack of warm-up is a signal, especially in opinion and REX articles.

### 12. Third-person persistence
Even on personal or reader-response questions, LLMs default to third person. Human blog writers naturally use first person ("I found", "in my experience") and second person ("you'll notice", "try this").
**Detection:** Is the article entirely in third person? In a blog post, this is a strong signal unless the author deliberately chose an impersonal tone.

### 13. Excessive em-dash usage
Em dashes as a structural element for explanatory clauses, used multiple times per paragraph.
**Detection:** More than 3 em dashes per 500 words is suspicious. See also fausse-profondeur #2.

### 14. Reduced epistemic markers
Fewer hedging words, self-mentions, and uncertainty markers (Herbold 2023). LLMs state everything with the same level of confidence.
**Detection:** Does the author ever express uncertainty ("I think", "I'm not sure", "this might be wrong")? Total absence of epistemic markers in a personal blog post is a signal.

### 15. Low burstiness
Flat energy throughout. No variation between dense analytical passages and lighter reflective ones.
**Detection:** Read the article aloud. Does it feel monotone? Do you naturally speed up or slow down at different points? If the reading pace is uniform, burstiness is low.

### 16. Generic subheadings
"Understanding X", "The Importance of Y", "The Future of Z", "Key Benefits of W", "Comprendre X", "L'importance de Y", "L'avenir de Z".
**Detection:** Could these subheadings be used for any article on a similar topic? If yes, they're generic.

## The Bouchard structural test

A 4-step formalized process for detecting templated structure (adapted from Louis Bouchard, Towards AI).

### Step 1: Summarize each paragraph in one sentence
Extract or write a one-sentence summary of what each paragraph says.

### Step 2: Read the summaries as an outline
Read all the summary sentences in sequence as if they were a document outline.

### Step 3: Evaluate the outline
Ask: Does this sequence follow a predictable template? Could these summaries, with minor word changes, describe an article on a completely different topic?

Common template patterns to detect:
- "Definition → list of benefits → how it works → comparison → future → conclusion"
- "Introduction → understanding X → the importance of Y → challenges → best practices → conclusion"
- "Problem → solution → implementation → results → takeaway"

### Step 4: Check for structural interchangeability
If the paragraph summaries are structurally interchangeable (any summary could appear in any position without logical disruption), the text lacks progressive argumentation.

**Threshold (proposed):** Cosine similarity between sentence-embeddings of paragraph summaries. If > 0.85, the paragraphs are structurally too similar.

## Genre calibration matrix

Not all genres tolerate the same level of structural regularity.

| Signal | Blog/Opinion | REX | Technical | Tutorial | Documentation |
|--------|-------------|-----|-----------|----------|---------------|
| #1 Sentence length | Active | Active | Active | Suppress | Suppress |
| #3 Coherence loss | Active | Active | Active | Active | Active |
| #5 Syntactic complexity | Active | Active | Raise threshold | Suppress | Suppress |
| #7 Tripartite template | Active | Active | Active | Suppress | Suppress |
| #8 Formulaic openings | Active | Active | Active | Raise threshold | Suppress |
| #9 List-like structure | Active | Active | Raise threshold | Suppress | Suppress |
| #11 Direct entry | Active | Active | Suppress | Suppress | Suppress |
| #12 Third person | Active | Active | Raise threshold | Raise threshold | Suppress |
| #13 Em dashes | Active | Active | Active | Active | Active |
| #16 Generic subheadings | Active | Active | Active | Active | Raise threshold |

**Universal signals** (reliable in all genres): #3 (coherence), #5 (syntactic complexity), #13 (em dashes).
**Most genre-dependent signals:** #1, #8, #11, #12.

## Strategies to break symmetry

When excessive symmetry is detected during /review, suggest:

- **Vary paragraph lengths.** Alternate between dense 8-sentence paragraphs and single-sentence punches. Some sections can be 3 paragraphs, others 1.
- **Remove section summaries.** Let the reader synthesize. Not every section needs a mini-conclusion.
- **Vary endings.** Each section can end differently — a question, a declaration, an anecdote, mid-thought leading to the next section.
- **Insert ruptures.** A personal aside, a one-line paragraph, a question that genuinely doesn't have an obvious answer.
- **Enter through experience.** Start with a specific moment, not a definition. "Last Tuesday my build failed with a cryptic error" beats "Vite is a build tool for..."
- **Vary subheadings.** Mix questions, fragments, statements, provocations. Not always "The [Noun] of [Noun]."
- **Break the third wall.** Use "I", "you", asides to the reader, self-corrections.

## Relationship with other skills

- **fausse-profondeur**: Paragraph-level rhetorical patterns. This skill works at document level.
- **marqueurs-lexicaux**: Within-paragraph statistical patterns. This skill analyzes cross-paragraph structure.
- **slop-poli**: Evaluates substance. This skill evaluates structure — they complement each other (template structure + empty content = slop).
- **article-types**: Provides genre-specific calibration that this skill applies through the matrix above.
- **writing-voice**: "What makes human writing recognizable" section describes the opposite of these 16 patterns.
