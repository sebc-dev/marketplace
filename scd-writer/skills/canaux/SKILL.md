---
name: canaux
description: |
  Form (long / short) and platform (blog / LinkedIn): two axes, not one. Reach it before
  calibrating any detector, before writing a LinkedIn hook or call to action, and whenever a
  piece runs under ~400 words. The axis: where and how long.
---

## Two axes, not one

"Channel" looks like one variable and behaves like two. The author publishes on three surfaces, which are three points in a 2×2 with one empty cell:

| | Blog | LinkedIn |
|---|---|---|
| **Long form** | Article (1 000–3 000 words) | LinkedIn article (800–2 000 words) |
| **Short form** | none | LinkedIn post (80–300 words) |

- **Form** decides what the detectors are allowed to say. A 150-word post cannot be measured for burstiness, paragraph-length variance, or progressive argumentation: the sample is too small for the statistic to mean anything.
- **Platform** decides what the surface looks like. Markdown headings, links in body text, and code blocks are native on the blog and hostile on LinkedIn.

Reading calibration off the platform alone produces the failure this skill exists to prevent: every legitimate LinkedIn post flagged as slop.

## Axis 1: form drives the detectors

| Detector | Long form | Short form | Why |
|----------|-----------|------------|-----|
| slop-vocabulary | Full | **Full, raised** | Word-level markers work at any length; density thresholds must be recomputed, since one marker in 150 words is a high ratio but a low count |
| fausse-profondeur | Full | Full | Rhetorical figures are visible in a single sentence |
| marqueurs-lexicaux | Full | **Suppress the distribution metrics** | Type-token ratio, n-gram and burstiness figures are meaningless below ~400 words |
| structure-symetrique | Full | **Suppress** | The 16 signals are document-level. A post has no document level |
| slop-poli | Full | Full | Substance is testable at any length, arguably easier |
| cognitive-outsourcing | Full | Full | Length has nothing to do with who did the thinking |

**Short form does not mean lower standards.** It means three detectors lose their instrument, and the two that keep it (slop-vocabulary, slop-poli) carry the whole load. A short post is judged on substance and word choice, because nothing else is measurable, so `slop-poli`'s verdict there is near-final.

Form calibration and type calibration **multiply**: a short-form REX suppresses structure-symetrique for form reasons *and* keeps a low vocabulary tolerance for type reasons (**article-types**).

The `## Developed paragraphs over bullet lists` voice rule is also form-dependent (see writing-voice, and the arbitration in faux-positifs, which owns the short-form case in full).

**One rule is not form-dependent and never suppressed here: the banned dash.** Short form removes the sample a statistic needs; it does not remove a character from the text. An 80-word post is scanned for `—` like everything else.

## Axis 2: platform drives surface conventions

| | Blog | LinkedIn |
|---|---|---|
| Formatting | Full markdown, headings, code blocks | Plain text. No markdown renders. Line breaks are the only structure |
| Structure | Headings carry navigation | Blank lines between 1–3 sentence blocks |
| Links | Inline, freely | Never in the body, since reach is penalized. First comment, or nowhere |
| Code | Fenced blocks | Screenshot, or don't |
| Entry | A reader who already clicked | A reader who has not decided to read, so the first two lines are all you get |
| Length signal | Scroll depth | The "…see more" fold, around 200 characters |
| Ending | Can trail off, or land quietly | Ends on something a reader can answer |

## The hook: LinkedIn's first two lines

Above the fold there is room for roughly one sentence and a fragment. It has to be a promise the body actually keeps; a hook that oversells is `fausse-profondeur` #3 (dramatic promise, banal payoff), and it is punished harder on a feed than anywhere else.

Six openings that earn the fold, none of which require exaggeration:

1. **The counterintuitive claim.** A statement most of the audience would dispute, and that the body then defends. Not a provocation you abandon in line three.
2. **The specific number.** A real figure from real work. "Three hours a week for eight months", never a rounded, unverifiable one.
3. **The named failure.** What broke, in concrete terms. The strongest opening available to the personal-dev hat, and forbidden material for the CEGAPE hat unless raised to the pattern (see casquettes).
4. **In medias res.** Drop into the moment: the error message, the meeting, the decision. No scene-setting.
5. **The question with a non-obvious answer.** Legitimate only when the answer *is* non-obvious. Otherwise it is `fausse-profondeur` #4.
6. **The correction of self.** "I argued the opposite here two years ago." Highest-credibility opening the author has, and unfakeable.

What is not a hook: "In today's rapidly evolving landscape", "Let me tell you a story", "🚨 THREAD 🚨", or a summary of the post that removes the reason to read it.

## The call to action

- **Blog**: at most one, at the end, and it may be nothing more than the next article. A blog post with no CTA is complete.
- **LinkedIn**: one, at the end, and it must be answerable in a sentence: a genuine question, not "thoughts?". Engagement bait ("agree?", "comment YES") is slop by Kommers' first property: surface signal, no substance.
- **Never** open with the CTA, and never repeat it. Two asks read as one desperate ask.
- The founder hat may ask for business directly (see casquettes). The other two may not: an implicit pitch under a learning post is the worst of both.

## Resolving the channel

1. Blog → long form, blog conventions.
2. LinkedIn article → long form, LinkedIn conventions.
3. LinkedIn post → short form, LinkedIn conventions.
4. Not stated → **ask**. Do not infer the channel from the length of the raw notes; a braindump is always short.
