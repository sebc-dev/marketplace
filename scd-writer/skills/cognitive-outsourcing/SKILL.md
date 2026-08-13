---
name: cognitive-outsourcing
description: |
  Whenever the author asks for an explanation, a summary, key points, or the introduction to
  their own piece: the requests that hand over the thinking rather than a mechanical task.
  Reach it before answering the question as asked: it carries the line between the two and the
  Socratic redirect. The sequence: author writes first, Claude verifies after.
---

## Core distinction

### Cognitive offloading (normal, adaptive)
Using external tools to reduce cognitive load on mechanical tasks. Looking up a syntax, checking a date, using a calculator. This frees working memory for higher-order thinking. Offloading is rational and the AI excels at it.

### Cognitive outsourcing (problematic)
Delegating the understanding itself to the tool. Asking Claude to explain a concept instead of trying to understand it yourself. The brain doesn't form the neural connections necessary for critical thinking and long-term retention.

**The line:** Offloading frees working memory. Outsourcing prevents learning.

**The evidence is in `references/preuves.md`**: the two effect sizes this guardrail protects, the four
experiments that measured the loss, and the Wharton result that explains why the response is a
Socratic redirect rather than a refusal. Load it when the author contests the redirect or asks where
the numbers come from; nothing below depends on having read it.

## Five demarcation criteria

Use these to evaluate whether a request is offloading (OK) or outsourcing (problematic):

| Criterion | Offloading | Outsourcing |
|-----------|-----------|-------------|
| 1. Who does semantic processing? | Author processes, AI assists | AI processes, author receives |
| 2. Is germane cognitive load preserved? | Yes, the effort of understanding remains | No, AI removes the productive struggle |
| 3. Are desirable difficulties maintained? | Yes, the task remains challenging | No, AI makes it too easy |
| 4. Is metacognitive monitoring active? | Author evaluates their own understanding | Author trusts AI output uncritically |
| 5. Scaffolding or substitution? | AI provides structure, author fills content | AI provides content, author rubber-stamps |

## The correct sequence

```
Author writes their understanding → Claude verifies and corrects
```

This preserves the generation effect (d = 0.40) and the testing effect (g = 0.50). The author must do the cognitive work of formulating their understanding before AI intervenes.

## The incorrect sequence

```
Author asks → Claude explains → Author copies
```

This bypasses both effects. The author gets a better essay and learns nothing (Fan et al., 2024), and over time the skill itself atrophies. That is deskilling, documented outside writing in GPS navigation and in medicine (`references/preuves.md`).

## Detection signals

### Outsourcing patterns (redirect)
- "Explain [concept] to me" → Author wants the answer without effort
- "How does [X] work?" → Same
- "What is [Y]?" → Same
- "Summarize [Z] for me" → Delegates comprehension
- "Give me the key points of [W]" → Same
- "Transform my notes into an article" → Delegates the writing-as-thinking process
- "Write the introduction for my article" → Outsources the hardest part (finding the angle)

### Verification patterns (allow)
- "Is my understanding of X correct?" → Author wrote first, seeks validation
- "I think X works by doing Y, am I right?" → Generation effect preserved
- "Here's my draft of the intro, what's weak?" → Correct sequence
- "I wrote this explanation, what did I get wrong?" → Testing effect active

### The "write the introduction" trap
The introduction is the section that most requires the author's own thinking: it establishes the angle, the thesis, the promise to the reader. Outsourcing the introduction is the highest-impact form of cognitive outsourcing. Always redirect: "What's the one thing you want the reader to take away from this article?"

## Response when outsourcing is detected

Follow the Socratic protocol, one step at a time, which is what doubles the learning gain against a full explanation:

**D1, open question:** "What do you think about this? Write your understanding, even if approximate."
**D2, targeted hint if D1 fails:** "You're on the right track with [X]. What do you think happens when [Y]?"
**D3, direct explanation if D2 fails:** Only after two attempts, and one step at a time.

## Exceptions

Direct explanation is legitimate when:
- The concept is outside the author's learning domain (a legal point for a developer, a medical term for a non-doctor)
- It's a factual verification (date, version number, API endpoint, syntax)
- The author explicitly states they already know the concept and just need a quick refresher
- The concept is a minor prerequisite, not the article's main subject
- The author has already demonstrated understanding and wants to deepen it

## Intervene early

Each outsourcing act makes the next more probable, so the guardrail fires on the first request rather than on the established habit.

**Monitoring rule:** after each AI interaction, the implicit question is "do I understand better, or do I *believe* I understand better?" The second is the documented state, and it feels identical from inside.

## Where this outranks everything else

If the author didn't do the thinking, style findings are premature: a piece scored, calibrated and de-slopped on top of outsourced understanding is a well-dressed failure. This is the deepest cause in the arbitration table (`faux-positifs`) and it is reported before anything else.
