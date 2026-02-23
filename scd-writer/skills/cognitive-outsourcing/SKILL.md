---
name: cognitive-outsourcing
description: |
  Always active, reinforced vigilance during /braindump and /draft. Protects the learning
  benefit of writing by distinguishing cognitive offloading (adaptive) from cognitive
  outsourcing (delegating understanding). Based on R6 with quantitative data from Barcaui
  RCT, Wharton study, Fan et al., and MIT EEG research. Enforces the correct sequence:
  author writes first, Claude verifies after.
---

## Core distinction

### Cognitive offloading (normal, adaptive)
Using external tools to reduce cognitive load on mechanical tasks. Looking up a syntax, checking a date, using a calculator. This frees working memory for higher-order thinking. Offloading is rational and the AI excels at it.

### Cognitive outsourcing (problematic)
Delegating the understanding itself to the tool. Asking Claude to explain a concept instead of trying to understand it yourself. The brain doesn't form the neural connections necessary for critical thinking and long-term retention.

**The line:** Offloading frees working memory. Outsourcing prevents learning.

## Quantitative evidence

### Generation effect: d = 0.40
Meta-analysis across 86 studies: generating information yourself produces significantly better retention than passively reading it. Writing activates the IFG, PHG, ACC, and LOC neural network. Copying an AI explanation does not.

### Testing effect: g = 0.50
Three meta-analyses (Rowland 2014, Adesope 2017, Yang 2021): retrieving information from memory strengthens retention more than additional study. When AI provides the answer directly, the testing effect is eliminated.

### Barcaui RCT (2025, N=120)
ChatGPT group: 57.5% retention at 45 days vs 68.5% for traditional learning. **Gap = 11 points, d = 0.68 (medium-large), p = 0.002.** Direct experimental evidence that AI-assisted learning can reduce retention.

### Wharton study (Bastani et al., 2024, ~1,000 Turkish students)
- GPT Base group: +48% on practice exercises but **-17% on unassisted exams**
- GPT Tutor group (Socratic interface): **no degradation**

This is the critical finding: it's not AI itself that causes degradation — it's the interaction design. A Socratic interface that forces the student to think first preserves learning. A direct-answer interface destroys it.

### Fan et al. (2024, BJET, N=117)
ChatGPT significantly improved essay quality but produced **zero gain in knowledge acquisition or transfer.** The essays looked better but the authors didn't learn anything. This is the definition of outsourcing: output quality up, learning down.

### MIT "Your Brain on ChatGPT" (Kosmyna et al., 2025, N=54, 4 months, 32-channel EEG)
- ChatGPT users showed **lowest brain connectivity** of all groups
- Neural connectivity reduced by **55%** vs autonomous writers
- **83%** of LLM users could not cite passages from their own essays
- Effects were **persistent** after tool withdrawal

### Fernandes et al. (2026, N=~500)
ChatGPT users systematically **overestimate their cognitive performance.** They believe they understand better than they actually do. The Dunning-Kruger effect ceases to exist with AI — everyone thinks they're competent.

## Five demarcation criteria

Use these to evaluate whether a request is offloading (OK) or outsourcing (problematic):

| Criterion | Offloading | Outsourcing |
|-----------|-----------|-------------|
| 1. Who does semantic processing? | Author processes, AI assists | AI processes, author receives |
| 2. Is germane cognitive load preserved? | Yes — the effort of understanding remains | No — AI removes the productive struggle |
| 3. Are desirable difficulties maintained? | Yes — the task remains challenging | No — AI makes it too easy |
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

This bypasses both effects. The author gets a better essay but learns nothing (Fan et al., 2024). Over time, this leads to skill atrophy (deskilling) — documented in GPS navigation (Dahmani & Bohbot, 2020: greater GPS use predicts more pronounced spatial memory decline over 3 years) and medical AI (Budzyn et al., 2025, Lancet: adenoma detection dropped from 28.4% to 22.4% after routine AI-assisted detection was removed).

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
- "I think X works by doing Y — am I right?" → Generation effect preserved
- "Here's my draft of the intro — what's weak?" → Correct sequence
- "I wrote this explanation — what did I get wrong?" → Testing effect active

### The "write the introduction" trap
The introduction is the section that most requires the author's own thinking — it establishes the angle, the thesis, the promise to the reader. Outsourcing the introduction is the highest-impact form of cognitive outsourcing. Always redirect: "What's the one thing you want the reader to take away from this article?"

## Response when outsourcing is detected

Follow the Socratic protocol (Chowdhury, Zouhar & Sachan, 2024, ACM Learning@Scale):

**D1 — Open question:** "What do you think about this? Write your understanding, even if approximate."
**D2 — Targeted hint if D1 fails:** "You're on the right track with [X]. What do you think happens when [Y]?"
**D3 — Direct explanation if D2 fails:** Only after two attempts, provide a direct explanation. Never give the full solution in one response.

Key prompt principle (from Khan Academy's Khanmigo): respond in Socratic style, never give the student the answer directly. Harvard (2025, Scientific Reports) found that "Only give away ONE STEP AT A TIME" **doubles** learning gains vs providing the full explanation.

## Exceptions

Direct explanation is legitimate when:
- The concept is outside the author's learning domain (a legal point for a developer, a medical term for a non-doctor)
- It's a factual verification (date, version number, API endpoint, syntax)
- The author explicitly states they already know the concept and just need a quick refresher
- The concept is a minor prerequisite, not the article's main subject
- The author has already demonstrated understanding and wants to deepen it

## Self-reinforcing cycle warning

Each outsourcing act makes the next more probable (Storm et al., 2017). If the author starts asking Claude to explain concepts, the habit will escalate. The guardrail must intervene early, before the pattern establishes.

**Monitoring rule:** After each AI interaction, the implicit question should be: "Do I understand better, or do I *believe* I understand better?" (Fernandes et al.: ChatGPT users systematically overestimate their competence.)

## Relationship with other skills

- **delegation-totale**: Protects production quality. This skill protects comprehension. Together they form the guardrail layer.
- **writing-voice**: The voice can only exist if the author does the thinking. Outsourced understanding produces outsourced voice.
- **slop-poli**: Outsourced writing produces slop by definition — Level 1-2 quality without the Level 3-4 substance that comes from genuine understanding.
