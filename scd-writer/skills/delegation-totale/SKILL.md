---
name: delegation-totale
description: |
  Always active. Guardrail against full-article generation in a single prompt. Redirects
  to the phased workflow when a total delegation pattern is detected. Based on R2
  quantitative degradation data from WritingBench, LongWriter, Chroma, and 8 studies
  confirming iterative superiority. Position: optimization, not restriction.
---

## Why single-prompt generation fails

### Quantitative degradation thresholds

Quality degrades predictably with length in single-prompt generation:

| Study/Benchmark | Degradation threshold | Evidence |
|----------------|----------------------|----------|
| WritingBench | ~3,000 tokens | Quality drops sharply beyond this point |
| LongWriter | ~2,000 words | Coherence and specificity degrade |
| Chroma | 2,500-5,000 words | Sweet spot for single-generation quality ceiling |

Beyond these thresholds, the model's softmax attention disperses across the growing context, repetition self-reinforcement kicks in (generating "X is important" makes the model more likely to generate "X is important" again), and mode collapse pulls the output toward the most statistically probable — and therefore most generic — angle.

### The angle problem

A single prompt under-constrains the completion space. With no iterative feedback narrowing the angle, the model selects the most statistically probable interpretation of the topic. By definition, the most probable angle is the most generic one. This is why "Write me an article about Vite" produces the same article everyone else would get — it lacks the author's specific angle.

### Iterative superiority: 8 confirming studies

| Study | Year/Venue | Improvement | Key finding |
|-------|-----------|-------------|-------------|
| Self-Refine | NeurIPS 2023 | ~20% | Iterative self-feedback outperforms single-pass across tasks |
| CogWriter | ACL 2025 | 22% | Structured decomposition beats single-prompt for long-form |
| PEARL | 2024 | 15-25% | Plan-then-write improves coherence in long documents |
| Sparks (Microsoft) | 2023 | Qualitative | Multi-step prompting essential for complex reasoning |
| Constitutional AI | Anthropic 2023 | Variable | Iterative revision improves alignment and quality |
| Chain-of-Thought | Various 2023-24 | 10-40% | Decomposition improves reasoning quality |
| DSPy | Stanford 2024 | 15-30% | Modular decomposition outperforms monolithic prompts |
| RecurrentGPT | 2023 | Qualitative | Paragraph-by-paragraph generation maintains coherence |

**Sweet spot:** 2-3 revision passes. Beyond 3, returns diminish and the text can become over-smoothed. The first revision pass produces the biggest quality jump.

## Detection signals

Patterns that trigger this guardrail:

### Direct generation requests
- "Write me an article about X"
- "Generate N words on Y"
- "Draft a complete section on Z"
- "Write me a blog post about W"
- "Create an article covering A, B, and C"

### Disguised delegation
- "Transform these bullet points into an article"
- "Turn my notes into a polished piece"
- "Expand this into a full article"
- Any request for > 2-3 paragraphs without prior braindump/structure phase

### Scope signals
- No raw notes provided
- No personal angle mentioned
- Topic described in abstract terms ("about AI in healthcare") rather than specific terms ("about what I learned migrating our DICOM pipeline to Cloudflare R2")

## Decision tree

```
Request for content generation
├── Short (<800 words) AND standardized format?
│   ├── Yes → Direct generation OK (changelog, release note, commit message, short email)
│   └── No ↓
├── Medium (800-1500 words)?
│   ├── Author has raw notes/braindump? → Optional: suggest workflow but don't block
│   └── No notes? → Redirect to /braindump
└── Long (>1500 words)?
    └── Always redirect to workflow, regardless of context
```

## Response when triggered

**Tone: optimization, not restriction.** Position the workflow as the path to better results, not a limitation.

1. **Acknowledge the request.** Don't refuse abruptly.
2. **Briefly explain why.** One sentence: iterative approaches produce 15-57% better results than single-prompt generation.
3. **Redirect to the workflow.** Ask for raw notes or suggest `/braindump`.
4. **Ask the key question:** "What are your raw notes or ideas on this topic?"

Example:
> I can help you write this article, but the result will be significantly better if we use the phased workflow — research shows 15-57% quality improvement from iterative approaches vs single-prompt generation. Do you have raw notes or ideas? Paste them here or start with `/braindump`.

## Exceptions

Direct generation is acceptable when:
- **Short standardized content** (<800 words): emails, changelogs, release notes, commit messages, PR descriptions
- **Intentional throwaway drafts:** The author explicitly says they want a disposable starting point they'll rewrite entirely
- **The author has already completed braindump/structure:** They're in the workflow and just need a paragraph unblocked (this is /draft territory, not delegation)
- **Non-article content:** Code comments, documentation snippets, metadata

## What this skill does NOT do

This skill does not prevent all AI-assisted writing. It specifically prevents the "generate an entire article from a single prompt" anti-pattern. The phased workflow (/braindump → /structure → /draft → /review → /polish) is designed to use AI at every step — but in the right way, preserving the author's voice and thinking.

## Relationship with other skills

- **cognitive-outsourcing**: Protects comprehension. This skill protects production quality. Together they form the guardrail layer.
- **slop-poli**: Explains why single-prompt generation produces slop — Level 1-2 quality without Level 3-4 substance.
- **writing-voice**: The voice rules only work when the author is actually writing. Full delegation bypasses the voice entirely.
