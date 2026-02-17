---
name: article-types
description: |
  Context-dependent. Activated when the author specifies article type (technical, REX,
  tutorial, opinion) or when context makes it clear. Provides per-type calibration tables,
  specific questions for /braindump, structural expectations for /structure, review focus
  areas for /review, and tolerance levels for each detection skill.
---

## Technical / dev article

### What makes a good technical article
The author solved a problem, discovered something non-obvious, or compared approaches honestly. The reader walks away able to do something they couldn't before, or understanding something they didn't.

### Angles to explore during /braindump
- What problem did you solve that wasn't documented well?
- What surprised you? What was counter-intuitive?
- What common mistake do people make that you can help them avoid?
- What's the honest comparison between approaches? (not "X is better than Y" but "X is better for A, Y is better for B")
- What does the official documentation not tell you?

### Structural expectations for /structure
- Prerequisites explicit upfront
- Problem before solution (why before how)
- Code that actually works (tested, with version numbers)
- Edge cases and gotchas mentioned
- No "Understanding X" or "The Importance of Y" subheadings

### Review focus areas for /review
- **Biggest slop risk (R5):** Fluency without understanding — the article reads well but the author hasn't actually done what they describe. Look for: no error messages, no version numbers, no "gotchas", no mention of what didn't work.
- **Argumentation:** Are technical claims supported by evidence or just asserted?
- **Completeness:** Would a reader get stuck following this? Are there implicit steps?
- **Specificity:** Version numbers, dates, concrete benchmarks, actual error messages.

### Calibration table
| Detection skill | Tolerance | Rationale |
|----------------|-----------|-----------|
| slop-vocabulary | Medium | Technical jargon creates false positives ("robust" in statistics is fine) |
| fausse-profondeur | Medium | Some technical explanation patterns look like LLM patterns |
| marqueurs-lexicaux | Medium | Jargon repetition is normal in technical writing |
| structure-symetrique | Medium | Technical articles have legitimate structural regularity |
| slop-poli | Low | Technical articles must demonstrate understanding, not just fluency |

## Experience report (REX)

### What makes a good REX
A real story with a learning arc: initial assumption → what actually happened → what the author learned → what the reader can take away. The arc is everything — without it, the REX is just a timeline.

### Angles to explore during /braindump
- What assumption did you start with? Was it wrong?
- What would you do differently with the benefit of hindsight?
- What's the transferable learning — what can someone else apply to their own situation?
- What was the hardest decision? Why was it hard?
- What did the team disagree about? Who was right?

### Structural expectations for /structure
- Narrative arc, not chronological list
- The "turning point" — the moment where understanding changed
- Honest admission of mistakes or wrong assumptions
- Transferable takeaway stated explicitly
- No template structure (intro → context → what happened → conclusion)

### Review focus areas for /review
- **Biggest slop risk (R5):** Absence of learning arc. Events presented chronologically without analysis. No "what I'd do differently."
- **Authenticity:** Is there specific lived experience? Names, dates, concrete situations?
- **Voice:** Does this sound like someone recounting a real experience or summarizing someone else's?
- **Value:** Would another developer gain something actionable from reading this?

### Calibration table
| Detection skill | Tolerance | Rationale |
|----------------|-----------|-----------|
| slop-vocabulary | Low | Lived experience has its own vocabulary, not LLM vocabulary |
| fausse-profondeur | Low | REX should be grounded, not rhetorical |
| marqueurs-lexicaux | Low | Burstiness should be high — stories are naturally bursty |
| structure-symetrique | Low | Narrative is naturally irregular |
| slop-poli | Very low | REX without substance is just a timeline |

## Tutorial / guide

### What makes a good tutorial
A reader with the stated prerequisites can follow every step without getting stuck. The tutorial adds value beyond the official documentation — commentary on why, warnings about pitfalls, context for decisions.

### Angles to explore during /braindump
- What's the prerequisite knowledge? Be specific.
- What step is most likely to trip someone up? Why?
- What's the order a beginner would naturally follow?
- What does the official doc not explain well?
- What common mistakes will readers make? How do you know?

### Structural expectations for /structure
- Clear prerequisites section
- Steps in an order a beginner would follow naturally
- Each step completable before moving to the next
- Code verified and reproducible with specific versions
- Expected outcomes stated ("after this step, you should see X")

### Review focus areas for /review
- **Biggest slop risk (R5):** Paraphrased documentation — the tutorial adds nothing beyond what the official docs already say.
- **Completeness:** Can a reader actually follow this from start to finish without getting stuck?
- **Order:** Is the sequence natural for the target skill level?
- **Prerequisites:** Are they realistic and explicit?
- **Note from R4:** Step-by-step tutorials naturally resemble LLM output. Structural symmetry tolerance is high. Focus on content quality, not structural patterns.

### Calibration table
| Detection skill | Tolerance | Rationale |
|----------------|-----------|-----------|
| slop-vocabulary | Medium-high | Instructional language overlaps with LLM patterns |
| fausse-profondeur | Medium | Instructional tone can seem mechanical |
| marqueurs-lexicaux | Medium-low | Low burstiness is natural for step-by-step, but vocabulary should still vary |
| structure-symetrique | High | Structural regularity is expected and legitimate |
| slop-poli | Medium | A tutorial can be useful without being deeply personal |

## Opinion / reflection

### What makes a good opinion piece
A clear thesis the reader can disagree with, supported by evidence and honest engagement with counter-arguments. The author's specific experience and perspective shape the argument in a way no one else could replicate.

### Angles to explore during /braindump
- What's your position, stated in one sentence? Could someone disagree?
- What evidence supports your position? From your own experience?
- What's the strongest counter-argument? Have you addressed it honestly?
- Who disagrees with you and why? Are they wrong, or partially right?
- What personal experience shaped this opinion?

### Structural expectations for /structure
- Thesis stated early and clearly
- Evidence from the author's experience, not generic claims
- Counter-arguments addressed honestly (not straw-manned)
- The conclusion goes further than the introduction — intellectual progression
- No false balance ("on one hand... on the other hand..." without concluding)

### Review focus areas for /review
- **Biggest risk (R3):** Register leveling — the opinion piece sounds like a report instead of a person arguing a position. If it could be published under anyone's name, it lacks voice.
- **Biggest rhetorical risk (R7):** Hedging patterns ("it's possible that...", "one could argue that...") are the most common failure in opinion pieces. Track and flag every hedge.
- **Thesis strength:** Is the thesis specific and contestable? "AI will change everything" is not a thesis. "Companies should ban AI writing tools for junior developers because they prevent skill development" is.
- **Counter-arguments:** Are they the strongest possible, or straw men?
- **Voice:** Does the reader know exactly what the author thinks? Any ambiguity means the opinion is too weak.

### Calibration table
| Detection skill | Tolerance | Rationale |
|----------------|-----------|-----------|
| slop-vocabulary | Very low | Personal writing should have the least LLM footprint |
| fausse-profondeur | Very low | Rhetorical patterns are most visible in opinion writing |
| marqueurs-lexicaux | Very low | Register leveling is the biggest risk — must sound personal |
| structure-symetrique | Very low | Personal thought doesn't follow templates |
| slop-poli | Very low | An opinion without substance is just noise |

## Cross-type calibration summary

| Detection skill | Technical | REX | Tutorial | Opinion |
|----------------|-----------|-----|----------|---------|
| slop-vocabulary | Medium | Low | Medium-high | Very low |
| fausse-profondeur | Medium | Low | Medium | Very low |
| marqueurs-lexicaux | Medium | Low | Medium-low | Very low |
| structure-symetrique | Medium | Low | High | Very low |
| slop-poli | Low | Very low | Medium | Very low |
