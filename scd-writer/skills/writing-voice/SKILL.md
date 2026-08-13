---
name: writing-voice
description: |
  The author's editorial identity — six voice rules, the anti-fabrication rule, and the
  draft-time filter of banned vocabulary and rhetorical patterns that belongs in context while
  writing. Reach it whenever the author's text is written, reviewed, polished or translated.
  Cardinal principle: react, don't rewrite.
---

## Editorial identity

**The author writes to learn.** That is the invariant. Everything else — the hat, the channel, the kind of piece — varies underneath it, and if a piece teaches the author nothing, it shouldn't exist.

The invariant descends differently depending on who is speaking:

- **Personal dev, on the blog** — learning in public, in the open, with the unfinished parts left visible. This is the descent the rest of this file was originally written for.
- **AI Manager at CEGAPE, on LinkedIn** — learning from professional work, raised to the pattern, never the incident.
- **Founder of Isometria, on LinkedIn** — learning by building, where wanting something from the reader is legitimate.

The three are specified in **casquettes**. Do not treat the personal-dev descent as the whole author: it is one of three, and it is the only one with no institutional stake in being wrong.

Audience is bilingual FR/EN, mostly intermediate-to-senior developers. Everything is written in French first, then translated to English via `/translate`.

## Fixed voice, variable tone

**The voice is fixed. The tone moves.**

The voice is the six rules below, the banned vocabulary, the forbidden patterns, and the anti-fabrication rule. It is identical in a blog article, a LinkedIn article, and a LinkedIn post. It does not soften for an employer or sharpen for a prospect.

The tone is the register, the distance to the reader, the first person, and how much may be claimed. It moves with the hat (**casquettes**) and with the surface (**canaux**).

A change of tone is never a licence to change voice. If a draft stops sounding like the author, the hat or the channel was used as an excuse — and that is a finding, not a style choice.

### The three axes

Three things vary under the fixed voice, and none of them is derivable from the others. The blog is always the personal-dev hat, but LinkedIn carries two; a type never implies a hat or a channel. Each axis is resolved separately, and each of the three skills below carries only its own.

| Axis | Skill | Drives |
|------|-------|--------|
| Who is speaking | **casquettes** | First person, claims, stakes, disclosure |
| Where and how long | **canaux** | Detector calibration, surface conventions |
| What kind of piece | **article-types** | Structure, per-type detector tolerance |

## Voice rules

Six rules. Each carries a **Confused with** line: the way the rule fails when it is applied too hard, which is also the most common false positive during `/review`. When a finding turns on one of these lines, it goes through **faux-positifs**.

### 1. Direct

**Rule.** Say what you mean. No throat-clearing, no "In today's rapidly evolving world."
**Protects.** The reader's first thirty seconds — on a feed, the only ones you get.
**Confused with.** Curtness. Direct means no preamble; it does not mean no warmth, no asides, no explanation.
**Test.** Delete the first sentence of each section. If nothing is lost, it was throat-clearing.

### 2. Technical but accessible

**Rule.** Use precise terms, and explain them when a reader outside the niche wouldn't know them.
**Protects.** The bilingual intermediate-to-senior audience, which is expert in *some* corner and not in this one.
**Confused with.** Dilution. Explaining a term is one clause, not a paragraph, and never a reason to pick the vaguer word.
**Test.** Every jargon term either gets a five-word gloss on first use or is load-bearing enough that the reader will look it up.

### 3. Conversational

**Rule.** Write like you'd explain it to a colleague over coffee. Contractions are fine. Short sentences are fine. Asides are fine.
**Protects.** Register variation — the thing LLMs flatten first (marqueurs-lexicaux).
**Confused with.** Chattiness. Filler ("So, here's the thing"), forced enthusiasm, and emoji punctuation are not conversation; they are `fausse-profondeur` #8 with a friendly face.
**Test.** Read it aloud. Anything you would not say to a colleague, cut — including anything you would be embarrassed to say.

### 4. Concrete over abstract

**Rule.** Every claim needs an example, a number, or a story. "X is useful" is not a sentence — "X saved me three hours on project Y" is.
**Protects.** Lived-experience markers, the strongest human signal there is.
**Confused with.** Fabricated specificity. An invented number is worse than the abstraction it replaced — see *Anti-fabrication* below.
**Test.** For each claim, name the source of the detail. If the answer is "it sounded plausible", delete it and ask the author.

### 5. Developed paragraphs over bullet lists

**Rule.** Lists are for reference docs and changelogs. Articles are prose. One analogy per article maximum.
**Protects.** Progressive argument — the thing a list lets a writer skip.
**Confused with.** A blanket ban. This rule is about *argument*, and it is form-dependent: tutorials have steps, and short LinkedIn posts are built on line breaks (**canaux**). Applying it to a 150-word post flags every legitimate post the author writes.
**Test.** Could the list be a paragraph without losing anything? Then it should be. Are the items sequential steps or reference entries? Then it shouldn't.

### 6. Opinions welcome

**Rule.** Take a position. Hedge only when genuinely uncertain, not out of politeness.
**Protects.** Voice itself. A piece publishable under anyone's name has none.
**Confused with.** Suppressing honest doubt. Epistemic honesty is a protected human signal — "I'm not sure the cause is X" is voice, not hedging. What is banned is the symmetric concession that neutralizes both positions.
**Test.** After reading, can the reader state what the author thinks in one sentence? If not, the position is too weak — or absent.

## The draft-time filter

The exhaustive catalogs live in the detectors, which load at `/review` and `/polish`. What follows is the short list, and it stays always-active for one reason: it has to be in context while the draft is being *written*. A marker not written costs nothing; the same marker caught later costs a round trip.

**Words.** delve, showcasing, underscores, potential, landscape, comprehensive, multifaceted, meticulous, intricate, pivotal, nuanced, noteworthy, invaluable, foster, realm — then utilize, leverage, facilitate, harness, robust, plethora, embark, testament, elevate, navigate, empower, embrace, myriad, paramount, indispensable.

**Mots.** crucial (the documented #1 French marker), essentiel, indispensable, fondamental, incontournable, indeniablement, mettre en place, mettre en oeuvre, permettre de, se positionne comme, au coeur de — and the connector cascades: de plus, en outre, par ailleurs, neanmoins, toutefois, par consequent, en somme, il convient de noter, force est de constater.

One marker is noise. **Two in the same piece amplify each other by ~470%** (Gray, 2024), which is why density and not presence is the signal. The thresholds, the expression-level catalog and the per-type calibration are in **slop-vocabulary**.

**Patterns.** The four that give a draft away fastest:

1. **Negation-affirmation reframe** — "It's not X, it's Y." / "Ce n'est pas X, c'est Y." The most distinctive LLM pattern of 2025. Legitimate only when it introduces a genuine conceptual distinction the reader wouldn't expect.
2. **Triadic structures** — three adjectives, nouns or verbs in a burst. Remove one element: if the meaning doesn't change, it was rhythm without nuance.
3. **Empty rhetorical questions** — a question followed by its own obvious answer. If a declarative sentence loses nothing, the question was mechanical.
4. **Terminal participial commentary** — sentences trailing off into -ing or -ant clauses: "...opening new possibilities" / "...ouvrant de nouvelles possibilites." GPT-4o produces these at 5.3x the human rate (Reinhart, PNAS 2025).

The other eight categories, their French variants and their legitimate-use exceptions are in **fausse-profondeur**. Nothing above is a copy: these lists are deliberately shorter than the detectors', they serve a different moment, and where the two disagree, the detector wins. They are not a copy to keep in sync.

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

## Anti-fabrication

**Never supply a fact the author did not.** No statistic, benchmark figure, date, version number, client or colleague name, error message, quotation, or "I tried X and it broke because Y."

Lived-experience markers are the strongest human signal in the list above, which makes them the most tempting thing to counterfeit. A fabricated one is worse than none: the author publishes it under their own name, and a single invented detail discredits the accurate ones around it. The rule is absolute — it is not relaxed by plausibility, by "as an example", or by the piece needing one more concrete detail to work.

When a passage needs a concrete detail that hasn't been given:

- Leave `[TODO: number of hours, from the actual project]` in place and ask. Never fill the hole and never round.
- Same for sources. R1–R7 are in `docs/rapports/`; anything else needs a link the author supplied or that has been verified. A study title, an author name, and a year are three fabrications, not one.
- Same for the author's history. Do not write "as I said last year" unless the author says so.

A draft returned with three honest `[TODO]`s is finished work. A draft returned with three invented numbers is a liability.

## Cardinal principle

**React, don't rewrite.** When reviewing or polishing the author's text:
- Point out problems, don't fix them silently
- Flag LLM markers, don't replace them with different LLM markers
- Preserve the author's imperfections — they're often what makes the writing human
- If something sounds awkward but authentic, leave it alone
- The goal is the author's best writing, not generic "good" writing
- When a marker is defensible, report it *with* the doubt rather than suppressing either — the format is in **faux-positifs**
