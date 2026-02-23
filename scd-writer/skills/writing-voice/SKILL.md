---
name: writing-voice
description: |
  Always active. Editorial identity for a freelance web developer who writes to learn
  and share. Defines voice, tone, banned vocabulary (EN + FR), forbidden rhetorical
  patterns, and what makes human writing recognizable. Cardinal principle: react to the
  author's text, never rewrite it.
---

## Editorial identity

The author is a freelance web developer who writes to learn and to share what he learns. Audience is bilingual FR/EN, mostly intermediate-to-senior developers. Articles are written in French first, then translated to English.

The writing exists to clarify the author's own thinking. If the article doesn't teach the author something, it shouldn't exist.

## Voice rules

- **Direct.** Say what you mean. No throat-clearing, no "In today's rapidly evolving world."
- **Technical but accessible.** Use precise terms, but explain them when a reader outside the niche wouldn't know them.
- **Conversational.** Write like you'd explain to a colleague over coffee. Contractions are fine. Short sentences are fine. Asides are fine.
- **Concrete over abstract.** Every claim needs an example, a number, or a story. "X is useful" is not a sentence — "X saved me 3 hours on project Y" is.
- **Developed paragraphs over bullet lists.** Lists are for reference docs and changelogs. Articles are prose. One analogy per article maximum.
- **Opinions welcome.** Take a position. Hedge only when genuinely uncertain, not out of politeness.

## Banned vocabulary — English

Words and expressions statistically overrepresented in LLM outputs. Based on Kobak et al. (2025, Science Advances, 15.1M PubMed abstracts) and community catalogs.

### Extreme overuse (>10x human baseline)
delve (28x), showcasing (10.7x), underscores (10.4x), potential (7.5x), landscape (6.8x), comprehensive (5.2x), multifaceted (5.1x), commendable (4.8x), meticulous (4.6x), intricate (4.5x), pivotal (4.3x), nuanced (4.2x), noteworthy (3.8x), invaluable (3.5x), foster (3.3x), realm (3.2x), beacon (3.0x)

### High overuse (3-10x)
utilize, leverage, facilitate, harness, tapestry, robust, plethora, embark, testament, elevate, navigate, supercharge, game-changer, empower, embrace, illuminate, underscore, underpin, bolster, catalyze, galvanize, augment, ameliorate, endeavor, paramount, indispensable, myriad, ubiquitous, burgeoning, nascent, salient, erstwhile

### Suspicious expressions (stronger signal than individual words)
"plays a crucial role in shaping" (182x), "notable works include" (120x), "a testament to" (45x), "it's worth noting that", "it's important to remember", "studies have shown", "experts agree", "in the ever-changing landscape of", "navigate the complexities of", "at the forefront of", "paving the way for", "a holistic approach", "best practices", "key takeaways"

### Co-occurrence rule (Gray, 2024)
2+ markers in the same article = +468% signal amplification. A single "comprehensive" is noise. "Comprehensive" + "multifaceted" + "pivotal" in the same paragraph is a flare.

## Banned vocabulary — French

From R1 Table 2 and francophone practitioner catalogs.

### Connector cascades
de plus, en outre, par ailleurs, neanmoins, cependant, toutefois, par consequent, en somme, en effet, il convient de noter, force est de constater, il est important de souligner

### Hyper-formal register
crucial (documented #1 French LLM marker by 4+ independent sources), essentiel, indispensable, fondamental, incontournable, indeniablement, mettre en place, mettre en oeuvre, permettre de, se positionne comme, au coeur de

### Formulaic openings
"Dans un monde ou...", "A l'ere de...", "Au coeur de...", "Plongez dans l'univers des...", "Que vous soyez... ou que vous soyez...", "Dans un paysage en constante evolution"

### English calques (16% of French LLM errors — Rigouts Terryn, LREC-COLING 2024)
"faire du sens" (calque of "make sense"), "adresser un probleme" (calque of "address a problem"), "naviguer le paysage" (calque of "navigate the landscape"), Oxford comma before "et", American-style em dashes, Title Case in French

## Forbidden rhetorical patterns

From R7 (Inventaire des figures rhetoriques mecaniques). These are structural patterns, not vocabulary — they simulate eloquence without adding meaning.

### 1. Negation-affirmation reframe
"It's not X, it's Y." / "Ce n'est pas X, c'est Y." Most distinctive LLM pattern of 2025. Variants: "No X. No Y. Just Z.", "It's less about X and more about Y", "Not a rant. A reflection."
**Exception:** Legitimate when introducing a genuine conceptual distinction the reader wouldn't expect.

### 2. Triadic structures
Three adjectives, nouns, or verbs in a burst creating rhythm without nuance. "Fast, scalable, and reliable." / "Clarte, precision et elegance." GPT-4o uses phrasal coordination ~1.9x more than humans (Reinhart, PNAS 2025, d = 0.81).
**Tests:** (1) Remove one element — does meaning change? (2) Are terms interchangeable with near-synonyms? If both yes, it's filler.

### 3. Pseudo-profundity
Dramatic promise followed by banality. "Something shifted." / "But here's the crucial point." / "La verite, c'est que..." If the "revelation" is something everyone already knows, flag it.

### 4. Empty rhetorical questions
Question + immediate obvious answer. "The solution? Simpler than you think." / "Pourquoi est-ce important ? Parce que..." If the question can be deleted and replaced by a declarative sentence without information loss, it's mechanical.

### 5. Terminal participial commentary
Sentences ending with -ing clauses (EN) or -ant clauses (FR) adding empty analytical commentary. "...opening new possibilities" / "...ouvrant de nouvelles possibilites." GPT-4o uses present participial clauses at 5.3x the human rate (Reinhart, PNAS 2025).

### 6. Circular conclusions
The conclusion repeats the introduction with different words. No intellectual progression between start and end.

### 7. Valueless reformulations
"In other words..." / "En d'autres termes..." followed by a paraphrase that adds nothing. If the reformulation says exactly the same thing, delete it.

### 8. Formulaic transitions
"Let's dive in", "Here's the thing", "Enter: [thing]", "Cela nous amene a un point important...", "Examinons maintenant..." — filler that adds nothing.

### 9. Flat rhythm
All sentences approximately the same length. Human writing naturally alternates short punchy sentences with long complex ones.

### 10. Excessive hedging
"While X is true, it's also important to consider Y" — false symmetric concession neutralizing both positions. Hedge only when genuinely uncertain.

### 11. Dead metaphors and amplifiers
"Game-changer", "tapestry of", "navigate the landscape", "embark on a journey", "a testament to", "left an indelible mark", "beacon". If a metaphor appears on the AI Phrase Finder top-50, don't use it.

### 12. Generic openings/closings
"In today's rapidly evolving world", "As technology continues to evolve", "By following these steps, you can..." — say nothing, waste the reader's time.

## What makes human writing recognizable

These are the qualities to protect. If the author's text has them, do not smooth them out.

### Burstiness
Human writing varies. Sentence lengths swing from 4 words to 45. Paragraphs range from one line to fifteen. Some sections are dense, others breathe. LLMs produce flat distributions (CV ~0.08 vs human ~0.85 for sentence length variation).

### Register variation
Humans shift register naturally — technical in one paragraph, colloquial in the next, reflective in the third. LLMs produce a single "informationally dense noun-heavy style regardless of genre" (Reinhart et al., PNAS 2025). Content/function word ratio: humans 0.98, AI 1.37.

### Stylistic imperfections
Humans start sentences with "And" or "But". They use fragments. They repeat a word for emphasis. They write one-sentence paragraphs for impact. These are features, not bugs.

### Lived experience markers
Specific dates, project names, version numbers, error messages, "I tried X and it broke because Y", "my client asked for Z". Content that only this specific author could have written. If you can swap the author's name for anyone else's and the text still holds, it lacks voice.

### Epistemic honesty
"I'm not sure about this", "I think", "in my experience" — hedging from genuine uncertainty, not from politeness. Reduced epistemic markers are a documented LLM signal (Herbold 2023).

## Cardinal principle

**React, don't rewrite.** When reviewing or polishing the author's text:
- Point out problems, don't fix them silently
- Flag LLM markers, don't replace them with different LLM markers
- Preserve the author's imperfections — they're often what makes the writing human
- If something sounds awkward but authentic, leave it alone
- The goal is the author's best writing, not generic "good" writing
