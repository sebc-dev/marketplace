---
name: article-types
description: |
  Calibration by kind of piece: technical, REX, tutorial, opinion. Reach it once the type is
  stated or clear, for that type's braindump questions, structural expectations, review focus
  and detector tolerance. The axis: what kind of piece.
---

Two things this skill deliberately does not carry. The **per-genre slop risk** is in `slop-poli`, section *Genre-specific slop markers*. Read there what each type fails at when it fails on substance. The **detector tolerances** are one table, at the bottom of this file; the per-type sections below carry only what is not a tolerance.

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
- **Argumentation:** Are technical claims supported by evidence or just asserted?
- **Completeness:** Would a reader get stuck following this? Are there implicit steps?
- **Specificity:** Version numbers, dates, concrete benchmarks, actual error messages.

## Experience report (REX)

### What makes a good REX
A real story with a learning arc: initial assumption → what actually happened → what the author learned → what the reader can take away. The arc is everything: without it, the REX is just a timeline.

### Angles to explore during /braindump
- What assumption did you start with? Was it wrong?
- What would you do differently with the benefit of hindsight?
- What's the transferable learning, and what can someone else apply to their own situation?
- What was the hardest decision? Why was it hard?
- What did the team disagree about? Who was right?

### Structural expectations for /structure
- Narrative arc, not chronological list
- The "turning point", the moment where understanding changed
- Honest admission of mistakes or wrong assumptions
- Transferable takeaway stated explicitly
- No template structure (intro → context → what happened → conclusion)

### Review focus areas for /review
- **Authenticity:** Is there specific lived experience? Names, dates, concrete situations?
- **Voice:** Does this sound like someone recounting a real experience or summarizing someone else's?
- **Value:** Would another developer gain something actionable from reading this?

## Tutorial / guide

### What makes a good tutorial
A reader with the stated prerequisites can follow every step without getting stuck. The tutorial adds value beyond the official documentation: commentary on why, warnings about pitfalls, context for decisions.

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
- **Completeness:** Can a reader actually follow this from start to finish without getting stuck?
- **Order:** Is the sequence natural for the target skill level?
- **Prerequisites:** Are they realistic and explicit?
- **Note from R4:** Step-by-step tutorials naturally resemble LLM output. Judge content quality, not structural patterns.

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
- The conclusion goes further than the introduction, showing intellectual progression
- No false balance ("on one hand... on the other hand..." without concluding)

### Review focus areas for /review
- **Register leveling** is the failure mode here, and it is a `marqueurs-lexicaux` hit: the piece sounds like a report instead of a person arguing a position.
- **Hedging** is the second, and a `fausse-profondeur` #4 hit. Track every hedge: it is the most common failure in opinion pieces.
- **Thesis strength:** Is the thesis specific and contestable? "AI will change everything" is not a thesis. "Companies should ban AI writing tools for junior developers because they prevent skill development" is.
- **Counter-arguments:** Are they the strongest possible, or straw men?
- **Voice:** Does the reader know exactly what the author thinks? Any ambiguity means the opinion is too weak.

## Detector tolerance by type

The one calibration table. Every detector reads its own row here rather than keeping a copy.

| Detection skill | Technical | REX | Tutorial | Opinion |
|----------------|-----------|-----|----------|---------|
| slop-vocabulary | Medium | Low | Medium-high | Very low |
| fausse-profondeur | Medium | Low | Medium | Very low |
| marqueurs-lexicaux | Medium | Low | Medium-low | Very low |
| structure-symetrique | Medium | Low | High | Very low |
| slop-poli | Low | Very low | Medium | Very low |

Two rationales are worth stating because they are not obvious from the type. **Tutorial** tolerates structural regularity because step-by-step instructions are legitimately uniform. **Technical** tolerates vocabulary because domain jargon overlaps the catalogs: `robust` in a statistics sentence is the word, not a marker. Everywhere else the tolerance restates the type: personal writing carries the least LLM footprint, and a REX without substance is a timeline.

Form calibration multiplies with this table rather than replacing it (see **canaux**).
