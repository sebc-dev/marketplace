---
name: faux-positifs
description: |
  What to do when a detector fires on legitimate writing. Reach it before any finding is
  written up, when two detectors claim the same span, and when an English rule is about to be
  applied to French — the em dash, straight quotes, a translated blocklist.
---

## Why this skill exists

Two reasons, and the second is the load-bearing one.

**Arbitration.** Six detectors run over the same text. They overlap by design (a triad is both `fausse-profondeur` #2 and, in three-item-list form, `structure-symetrique` #9), and a review that reports the same span three times is a review the author stops reading.

**Structural collision.** The short LinkedIn post is, by construction, what every detector is trained to flag: short blocks, high symmetry, list-like structure, no burstiness, a hook, a closing question. A legitimate post and a generated one are structurally identical at that length. Without this skill, the detection layer's verdict on the author's most frequent format is "slop", every time — and a detector that is wrong every time gets ignored, including when it is right.

## Precedence rules

Applied in order to any signal from any detector — a readability outlier from `lisibilite-fr` is settled here like everything else. The first rule that resolves the case wins.

1. **The author's own sample outranks the generic rule.** If the author has supplied a sample of their published writing and it does the flagged thing habitually, the flag is a false positive. The catalogs describe LLM writing statistically; the sample describes *this* author. Say so and move on — do not flag the same habit on every paragraph.
2. **Form outranks the detector.** If `canaux` suppresses a detector for the piece's form, its signal is not a finding. A 150-word post has no burstiness, and reporting its absence is reporting a measurement error.
3. **Quoted and non-prose material is out of scope.** Never flag inside a quotation, a code block, an error message, a command, a log excerpt, a bibliography, or a term of art the field actually uses. The author did not write it, or cannot rename it.
4. **Stated intent outranks inference.** If the author says the reframe is deliberate, or the repetition is for emphasis, it is settled. Note it once if it recurs; do not relitigate.
5. **Otherwise: report, do not fix.** The cardinal principle in writing-voice is not suspended by uncertainty. React, don't rewrite.

## Known false-positive families

| Signal | Legitimate case | How to tell |
|--------|----------------|-------------|
| Banned word (`robust`, `leverage`, `nascent`) | Term of art in the domain, or inside a quote or benchmark name | Is there a plain synonym that a specialist would accept? If no, it's the word |
| Triad | Three real things, exhaustively enumerated | Suppression test: remove one. If information is lost, it's an enumeration, not filler |
| Em dash | The author's habitual punctuation | Check the sample. French typography also differs from the American pattern the catalogs describe |
| Bullet list | Tutorial steps, changelog, a short-form post, reference material | `canaux` and `article-types` both raise the tolerance. Prose is the default for argument, not for procedure |
| Flat rhythm | Under ~150 words, the metric has no sample | Suppressed by form (rule 2) |
| Repetition of a word | Deliberate emphasis, or the correct technical term used four times | Would a synonym be less precise? Then repetition is right |
| Hedging | Genuine uncertainty — epistemic honesty is a *protected* human signal | Does the author eventually take a position? If yes, the hedge is honest |
| Rhetorical question | The answer is genuinely non-obvious | Can it be replaced by a declarative without information loss? If no, it earns its place |
| Formulaic opening | The hook is a legitimate `canaux` type executed well | Does the body deliver what the first line promised? |
| "It's not X, it's Y" | A real conceptual distinction the reader wouldn't expect | Already an exception in `fausse-profondeur` #1 |

## When the rule came from English

A whole family of false positives has one cause: **the signal is an English heuristic fired on a
French text.** It deserves its own check because it does not look like a false positive — it looks
like a clean hit, and "fixing" it damages correct French.

Ask one question of any typographic or lexical rule before acting on it: **is this measured in
French, or transposed from English?**

| Heuristic | Verdict in French |
|---|---|
| Ban the em dash `—` | **False friend.** The em dash is standard French punctuation for dialogue, incise and enumeration (OQLF). What the catalogs describe is the *American unspaced pattern*, not the character. Never strip dashes from a French draft |
| Blocklist of AI words translated from English | **Not transposable.** No French corpus study has measured a list the way Kobak measured English. A translated blocklist has no evidential basis — see the head of `slop-vocabulary`'s French catalog |
| Title Case in headings | **Not applicable.** French capitalises the first word only. There is nothing to detect |
| Straighten curly quotes | **Backwards.** French uses `« … »`. Straightening them is a typographic regression, not a de-AI-ing |
| Low perplexity = AI | **Partially valid**, and only against a French reference model. Discriminating power is moderate |
| Flat sentence-length variation | **Plausible in French** — consistent with Alavoine et al. — but burstiness itself was defined and validated on English |

This applies to third-party skills as much as to this plugin's own detectors. `humanizer`, the most
widely installed de-AI-ing skill, hard-codes the first four rows; `skills-tiers` carries which of
its rules have an escape hatch and which must be removed outright.

**Reporting.** A finding killed by this section is worth one line, once per piece, not per
occurrence: *"seven em dashes — French punctuation, not a marker, not flagged."*

## Arbitration between detectors

This table is where detector overlaps are settled — the one place. When several detectors fire on the same span, report it **once**, under the detector that owns the deepest cause:

| Overlap | Reported under | Because |
|---------|---------------|---------|
| Triad / three-item list | fausse-profondeur | The rhetoric is the cause; the structure is the symptom |
| Empty transition / template structure | structure-symetrique | The template pulls in the transitions, not the reverse |
| Banned word / register leveling | marqueurs-lexicaux | If the whole register is level, individual words are a consequence |
| Polished but empty / any surface signal | slop-poli | Substance failure outranks every surface failure |
| Anything / cognitive-outsourcing | cognitive-outsourcing | If the author didn't do the thinking, style findings are premature |

**Rule of thumb:** substance beats structure beats rhetoric beats vocabulary. Report at the deepest level that is true, and mention the shallower ones only as evidence for it.

## Reporting format

A suspected false positive is not silence and is not a finding. It is a finding that shows its own doubt, so the author can settle it in one word:

```
? l. 34 — "fast, typed, and boring" reads as a triad (fausse-profondeur #2),
  but suppression changes the meaning: "boring" is the argument.
  Reading it as deliberate. Say if not.
```

Three properties: the line, the signal and its detector, and the reason for doubt. Never more than three lines. If a family recurs, report it once with a count — "seven em dashes, consistent with the sample, not flagged individually" — rather than seven times.

## Invocation

- During `/review`: after the detectors have run, before the report is written. Every finding passes through here.
- During `/polish`: on any span the author has already defended once.
- On demand: "is this a false positive?" — answer with the precedence rules, in order.
- Never as a shortcut to suppress a whole detector. If a detector is wrong on a whole class of pieces, that is a calibration bug in `canaux` or `article-types`, and it gets fixed there.

## Limits of the evidence base in French

Two gaps are known, and neither can be closed by looking harder. They bound what any verdict here is worth, and they are written down so that nobody fills them with an invented number.

**No French long-form editorial corpus annotated human/AI exists publicly.** The French corpora that do exist cover Q&A (HC3 translated; Alavoine et al. 2024, 49 questions) and short encyclopedic articles (Schaaff et al. 2023, 100 French texts). The genre this plugin actually serves — the blog post, the brand piece, the long LinkedIn post — is represented in none of them. Every detector threshold applied to that genre is therefore an extrapolation from a different one. Consequence for arbitration: **a binary "AI or human" verdict on a French long-form piece is not founded and is never issued.** The detectors report signals; they do not attribute origin.

**No false-positive rate has been measured for non-native French writers.** The one solid figure in the literature — 61.22% of TOEFL essays misclassified as AI-generated, dropping to 11.77% after lexical enrichment (Liang et al., *Patterns* 4(7), 2023) — is English. The mechanism behind it (low perplexity, low lexical diversity) is exactly what `marqueurs-lexicaux` measures, so the risk plausibly transfers to French — but no study has measured it. Consequence: when the author is not a native French speaker, or is writing in a second register, **precedence rule 1 (the author's own sample) is not a convenience, it is the only available correction.** Ask for a sample rather than trusting the statistical signal, and say that the risk is unquantified in French rather than putting a number on it.

## The standard this holds

Every rule above decides what is *true* about the text. A finding that survives the five precedence rules is reported plainly, with no softening — and the author's most frequent format, the short post, is held to substance and vocabulary precisely because nothing else is measurable there.
