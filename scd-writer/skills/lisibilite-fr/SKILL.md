---
name: lisibilite-fr
description: |
  French readability by pure counting — words per sentence, LIX, ARI. Reach it when a score or
  an offline grammar pass is wanted, for what the formulas do not measure and the silent
  English fallbacks that corrupt a French score computed with textstat.
---

## The invariant

**These formulas measure surface, not comprehension.** Every readability index that works in French
counts the same two things: how long the sentences are and how long the words are. That is all. The
academic critique is old and settled — Benoît (1986, *Pratiques* n°52), Bailin & Grafstein (2001),
François (2013, revue TAL): the correlation between length and difficulty is weak, non-linear, and
worst on exactly the profile this plugin serves — short, technical, French.

Two consequences that decide everything below:

- **Never report a readability score as an absolute verdict on difficulty.** Report it as a relative
  indicator — against the author's own previous pieces, or against a measured corpus.
- **A score is never a finding on its own.** It is a reason to go look at the sentences it flagged.

## Default: count, don't syllabify

**LIX and ARI are the default in French, and the motive matters more than the formulas.** They are
computed from characters, words and sentences alone. Nothing else in this file is as trustworthy,
because every syllable-based score in French inherits an error nobody has measured (see *The traps*).

```
LIX = (mots / phrases) + (100 × mots de plus de 6 lettres / mots)
ARI = 4,71 × (caractères / mots) + 0,5 × (mots / phrases) − 21,43
```

A "long word" for LIX is strictly *more than 6 letters*. Björnsson (*Läsbarhetsindex*, Stockholm,
1968) published the scale; the corpus means below are measured (arXiv 2404.01196) and are the right
anchor:

| Corpus | LIX moyen |
|---|---|
| Textes pour enfants | 21,57 |
| Presse | 40,32 |
| Encyclopédie | 45,40 |
| Débats parlementaires | 47,04 |

**Do not invent a target.** Ask the question instead: *where should this piece sit?* A blog article
aimed at a broad audience that measures above the parliamentary-debate mean is not "wrong" — it is a
piece whose sentences deserve a second look. The numeric targets that circulate for blog writing are
recommendations, not measurements, and they do not descend here.

## If a French Flesch score is wanted

Kandel & Moles (1958, *Cahiers d'Études de Radio-Télévision* n°19) recalibrated Flesch for French:

```
Score = 207 − 1,015 × (mots/phrase) − 73,6 × (syllabes/mot)
```

The base constant is **207**. The value **209** circulates on SEO pages with no academic source —
discard it. This is not second-hand: the coefficients were read in `textstat` itself at tag `0.7.13`
(`textstat/backend/utils/constants.py`), so `textstat.flesch_reading_ease(texte, lang="fr")` really
does compute the formula above.

Kandel & Moles lowered the syllabic coefficient from Flesch's 84,6 to 73,6 because French words run
about 1,15× longer than English ones. Landsheere (1963) contested the approach itself: the syllable
weight penalises French structurally, because the instrument is mistuned for it, not because French
is harder. Both statements are worth keeping — the second is why the score is indicative only.

## The traps

Each one produces a plausible number and no error message. That is what makes them worth writing
down.

**`textstat` falls back to English in silence.** A configuration key absent from the `fr` block
returns the `en` value, with no warning (`textstat/backend/utils/_get_lang_cfg.py`). The `fr` block
does **not** define `syllable_threshold` — so any metric that depends on it applies the English
threshold of 3 to French text. *Symptom:* no error, no warning, a number that looks fine.

**There is no French word list in `textstat`.** Only `resources/en/easy_words.txt` and
`resources/es/easy_words.txt` ship. Dale-Chall, `difficult_words` and `text_standard` are therefore
**inoperative in French**: they fall back to the English list through the mechanism above. *Symptom:*
almost every French word counted as difficult. Only the counting metrics (LIX, ARI, words/sentence)
and Flesch-FR are usable.

**Pyphen hyphenates, it does not syllabify.** It applies Hunspell typographic break points, not
phonetic syllable boundaries. Every Flesch-type score computed in French inherits that gap, and
**its size has never been measured** — no controlled study of French syllabification by Pyphen
exists. Say the gap exists; never put a percentage on it. The figure that circulates comes from one
practitioner's testimony covering three languages at once, and it does not descend here.

**Counting unclean text.** Strip code blocks, URLs, technical identifiers and YAML front-matter
*before* any count. On a dev/AI article, identifiers and URLs are long strings with no vowel
structure: they inflate the long-word count for LIX and wreck syllable counting outright.

**Short texts.** Under roughly ten sentences the ratios are unstable, and the syllable-based scores
go first. `textstat` documents that SMOG requires at least 30 sentences to be valid and at least 3 to
run at all. On a LinkedIn post, report words per sentence and nothing else.

**Sentence segmentation is itself a source of error.** The spaCy French models split badly on `-`,
`«`, `[` and `'` (issues #4637 and #6769 in `explosion/spaCy`). Every formula above divides by the
sentence count — one bad split corrupts them all at once. *Symptom:* a LIX that moves sharply when a
dialogue dash or a quotation is added.

## What to report

Three lines, in this order, and nothing more unless asked:

1. **Words per sentence, and the longest sentence with its line number.** This is the only number
   that survives every caveat above, and it is the one the author can act on.
2. **LIX, with the corpus it sits nearest.** Not a verdict — a placement.
3. **What the outliers actually are.** A sentence of 45 words that is a list of four API parameters
   is not a readability problem; the same sentence carrying three subordinate clauses is.

A Flesch/Kandel-Moles score is reported only when the author asks for it, and always with the word
*indicatif* attached.

## Tooling

The versions, the licences, the offline correction tools and their reserves are in
**`references/outillage.md`**. Load it when an actual computed score or a grammar pass is wanted —
that is, before installing or running anything. It carries dated facts and says so at the top.

## Where this skill loses

Two precedences, both of which go against the score.

**`marqueurs-lexicaux` owns sentence-length *variance*; this skill owns sentence-length *level*.** They
pull in opposite directions on purpose — flattening a text to raise its LIX is exactly the failure
burstiness detects. When they disagree, variance wins.

**`writing-voice` rules 1 and 3 (direct, conversational) already do most of what a readability score
would ask for.** When the two disagree, the voice wins: the score is surface, the voice is the piece.
