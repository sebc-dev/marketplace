---
name: fausse-profondeur
description: |
  Active during /review and /polish. Detects mechanical rhetorical figures that simulate
  eloquence without adding meaning. Covers R7's 12 major categories with EN + FR examples,
  operational detection tests, and legitimate-use exceptions. Provides a per-paragraph
  detection grid for /review. Complements slop-vocabulary (vocabulary) and
  marqueurs-lexicaux (statistical distribution).
---

## What this skill detects

Mechanical rhetoric is not about vocabulary (that's slop-vocabulary) or statistical patterns (that's marqueurs-lexicaux). It's about rhetorical structures that create the illusion of depth, engagement, or eloquence while adding zero information. These patterns are the output of reward models that optimize for "sounds good" over "says something."

Source: R7, Inventaire des figures rhetoriques mecaniques des LLM, with data from Reinhart et al. (PNAS 2025), Jiang & Hyland (2025), Guo (2025), Lehmann (2025), Stockton (2025).

## The 12 categories

### 1. Negation-affirmation reframe — "It's not X, it's Y"
Most distinctive LLM pattern of 2025 (Guo, Stockton, Lehmann). Washington Post analysis: ~6% of 328,744 ChatGPT messages contained this pattern.

**EN examples:** "It's not a tool, it's a mindset." / "No complexity. No overhead. Just results." / "It's less about speed and more about clarity."
**FR examples:** "Ce n'est pas un outil, c'est une philosophie." / "Pas une plainte. Une observation." / "Il ne s'agit pas de vitesse, mais de clarte."

**Detection test:** Does the negation introduce a genuine conceptual distinction the reader wouldn't have made? If the "not X" part is a straw man, flag it.
**Legitimate use:** When the distinction is real, surprising, and backed by argument. "It's not a bug, it's a race condition" is legitimate because it changes the debugging approach.

### 2. Em-dash overuse and formatting artifacts
Em dash usage tripled on tech subreddits in one year (GitHub "Em Dash Conspiracy" data). Also: random bolding, Unicode formatting, emoji-led bullets in professional context, bullet + bold title restating content.

**EN examples:** "The real issue — and this is what most people miss — is..." / "Performance — the true bottleneck — demands attention."
**FR examples:** "Le vrai probleme — et c'est ce que la plupart oublient — c'est..." / "La performance — veritable goulot d'etranglement — merite attention."

**Detection test:** Remove the em-dash clause. Does the sentence lose information? If not, the clause is decorative.
**Legitimate use:** Parenthetical clauses that add genuinely necessary context, especially when actual parentheses would be confusing.

### 3. Artificial transitions and false engagement
Simulate conversational engagement without creating authentic connection. Jiang & Hyland (2025): ChatGPT uses fewer real engagement markers while multiplying simulacra.

**EN examples:** "Let's dive in." / "Let's unpack this." / "Here's the thing." / "Here's the kicker." / "Enter: [thing]." / "The best part?" / "Ready to level up?"
**FR examples:** "Plongeons dans le vif du sujet." / "Entrons dans le detail." / "Le plus interessant ?" / "Voyons cela de plus pres."

**Detection test:** Delete the transition. Does the text flow as well or better without it? If yes, flag it.
**Legitimate use:** Rare. A genuine "Here's the thing" works only when followed by a genuinely surprising claim.

### 4. Excessive hedging and false concessions
Neutralize both positions to avoid saying anything. Create an illusion of nuance that's actually non-commitment.

**EN examples:** "While X is true, it's also important to consider Y." / "It's worth noting that..." / "Based on the information provided..." / "It's important to remember that..."
**FR examples:** "Si X est vrai, il convient neanmoins de considerer Y." / "Il est important de noter que..." / "Force est de constater que..."

**Detection test:** After the concession, does the author actually take a position? If the paragraph ends without a clear stance, it's false concession. Look for the "both-sides" trap: presenting arguments for and against without ever concluding.
**Legitimate use:** When genuinely uncertain or when the evidence is truly mixed. The test is whether the hedging reflects real epistemic state or performative caution.

### 5. Empty amplifiers and dead metaphors
Intensifiers that add no precision, and metaphors so overused they carry no imagery.

**EN examples:** "Game-changer." / "Supercharge your workflow." / "Tapestry of technologies." / "Navigate the landscape." / "Embark on a journey." / "A testament to innovation." / "Left an indelible mark." / "At the forefront of." / "Beacon of progress."
**FR examples:** "Veritable revolution." / "Au coeur de l'innovation." / "Fer de lance du progres." / "Paysage technologique." / "Pilier fondamental."

**Detection test:** Replace the amplifier with nothing or with a plain word. Does meaning change? "Game-changing framework" → "useful framework" — if the author can't explain why it's more than useful, the amplifier is empty.
**Legitimate use:** Almost never in technical writing. Save superlatives for things that actually deserve them.

### 6. Generic openings and closings
Templates that could open or close any article on any topic.

**EN examples:** "In today's rapidly evolving world..." / "In the ever-changing landscape of..." / "As technology continues to evolve..." / "By following these steps, you can..." / "To your success."
**FR examples:** "Dans un monde en constante evolution..." / "A l'ere du numerique..." / "En suivant ces etapes, vous pourrez..." / "Dans le paysage technologique actuel..."

**Detection test:** Could this opening/closing be copy-pasted onto an article about a completely different topic? If yes, flag it.
**Legitimate use:** None in blog articles. Start with the specific thing that makes this article worth reading.

### 7. Flat rhythm — mechanical parallelism
All sentences approximately the same length. Never switches grammatical person. Noun-heavy style: 1.5-2x more nominalizations, 2-5x more present participial clauses than human writing (Reinhart et al., PNAS 2025).

**Detection test:** Count sentence lengths in a paragraph. If the coefficient of variation is below 0.15 (all sentences within 20% of average length), flag it. Human writing typically has CV > 0.40.
**Legitimate use:** Step-by-step instructions (tutorials) naturally have more uniform sentence length.

### 8. Mechanical triads — Rule of Three abuse
GPT-4o uses phrasal coordination ~1.9x more than humans (Cohen's d = 0.81, Reinhart et al., PNAS 2025). Lehmann: "Triple Threat Syndrome."

**Types:** Adjective triads ("fast, scalable, reliable"), noun triads ("clarity, precision, elegance"), verb triads ("analyze, optimize, deploy"), propositional triads, cascade triads ("No X. No Y. Just Z."), connector triads ("En effet... Par ailleurs... En somme...").

**Two operational tests:**
1. **Suppression test:** Remove one element. Does meaning change? If no, it's filler.
2. **Specificity test:** Are terms near-synonyms? "Crucial, essentiel et fondamental" fails — all three mean approximately the same thing.

**Density matters:** "A single triad is fine. A triad every other sentence definitely smells fishy" (Lehmann). One triad per section is tolerable; three triads in two paragraphs is a pattern.

**Legitimate use:** CAP theorem ("consistent, available, partition-tolerant") — each term is technically distinct and necessary. Narrative progression ("he hesitated, stepped back, then finally agreed") — each action is sequential and different.

### 9. Pseudo-analytical depth
Vague analysis masquerading as insight. Dramatic promises followed by banalities.

**EN examples:** "Something shifted." / "But here's the crucial point." / "Everything changed." / "This symbolizes the broader trend." / "Which reflects a deeper pattern." / "Some experts say..." (without naming them).
**FR examples:** "Quelque chose a change." / "Mais voici le point crucial." / "Et c'est la que tout bascule." / "La verite, c'est que..." / "Ce que personne ne dit..."

**Detection test:** Read the dramatic sentence and the sentence that follows it. Is the "revelation" genuinely surprising or just a restatement of something obvious? If the payoff doesn't match the buildup, it's pseudo-depth.
**Legitimate use:** When the next sentence actually delivers something unexpected that changes the reader's understanding.

### 10. Empty rhetorical questions
Question posed and immediately answered with something obvious. Creates an illusion of dialogue with the reader.

**EN examples:** "The solution? Simpler than you think." / "Why does this matter? Because..." / "What's the takeaway? Three key points."
**FR examples:** "La solution ? Plus simple qu'on ne le pense." / "Pourquoi est-ce important ? Parce que..." / "Que retenir ? Trois choses essentielles."

**Detection test:** Delete the question. Does the answer still make sense as a standalone statement? If yes, the question was filler. Also: is the answer surprising? If anyone could have guessed it, the question is theatrical.
**Legitimate use:** When the question genuinely opens a non-obvious line of reasoning, or when it voices a real reader objection that the author then addresses seriously.

### 11. Valueless reformulations
Paraphrasing what was just said without adding information. Padding.

**EN examples:** "In other words, [same thing with different vocabulary]." / "Put simply, [exact same idea]." / "That is to say, [rephrased but no new information]."
**FR examples:** "En d'autres termes, [meme chose]." / "Autrement dit, [reformulation sans ajout]." / "Dit simplement, [idem]."

**Detection test:** Cover the reformulation. Does the reader miss any information? If the preceding text already conveyed the idea clearly, the reformulation is padding.
**Legitimate use:** When genuinely simplifying a technical explanation for a broader audience — the reformulation must target a different knowledge level than the original.

### 12. Terminal participial commentary
Sentences ending with -ing (EN) or -ant (FR) clauses that add empty analytical commentary. Most specifically French LLM pattern per R7 analysis.

**EN examples:** "...opening new possibilities for developers." / "...creating a more inclusive environment." / "...paving the way for future innovations."
**FR examples:** "...ouvrant de nouvelles possibilites." / "...suscitant des defis inedits." / "...permettant ainsi d'envisager l'avenir." / "...faisant de cet outil un incontournable."

**Detection test:** Delete the participial clause. Does the sentence lose concrete information? If the clause only adds vague commentary ("opening possibilities"), flag it.
**Legitimate use:** When the participial clause contains specific, verifiable information: "...reducing build time from 45s to 12s" is fine.

## Functional taxonomy

These 12 categories serve 5 functions in LLM text:
1. **Filler rhetoric** (#3, #5, #6, #11): Occupies space without information
2. **Authority simulation** (#9, #4): Simulates expertise without foundations
3. **Engagement simulation** (#1, #3, #10): Simulates reader relationship
4. **Smoothing** (#4, #7, #12): Eliminates voice, doubt, and tension
5. **Structure simulation** (#1, #8, #9): Simulates logical organization without real thought

## Detection grid for /review

For each paragraph, check:

1. [ ] **Reframe?** Does it use "It's not X, it's Y" — is the distinction genuine?
2. [ ] **Em-dash clause?** Remove it — does the sentence lose information?
3. [ ] **Transition?** Delete it — does the text flow better without it?
4. [ ] **Hedge/concession?** Does the author eventually take a position?
5. [ ] **Amplifier?** Replace with plain language — does meaning change?
6. [ ] **Generic opening/closing?** Could it apply to any article?
7. [ ] **Flat rhythm?** Are all sentences within 20% of average length?
8. [ ] **Triad?** Suppression test + specificity test
9. [ ] **Dramatic promise?** Does the next sentence deliver?
10. [ ] **Rhetorical question?** Is the answer non-obvious?
11. [ ] **Reformulation?** Does it add new information?
12. [ ] **Participial ending?** Does the clause contain specifics?

**Severity:**
- 1-2 instances in the whole article: Minor (mention in review summary)
- Pattern in multiple paragraphs: Major (flag each instance)
- Systematic across the article: Critical (structural problem, likely AI-influenced passage)

## Relationship with other skills

- **slop-vocabulary**: Handles word-level markers. This skill handles rhetorical structures — patterns, not vocabulary.
- **marqueurs-lexicaux**: Handles statistical distribution patterns. This skill handles identifiable rhetorical figures.
- **structure-symetrique**: Handles document-level structural patterns. This skill works at paragraph level.
- **slop-poli**: Evaluates whether substance exists. This skill evaluates whether the rhetoric adds meaning.
- **writing-voice**: Consumes the 12 forbidden patterns from this skill for the always-active voice filter.
