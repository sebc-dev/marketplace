---
name: delegation-totale
description: |
  Any request to write, generate, expand, or turn notes into a whole finished piece: the
  guardrail against a whole article from one prompt. Reach it before producing the text, for the
  redirect and for the exceptions where direct generation is legitimate. Position: optimization,
  not restriction.
---

## Why single-prompt generation fails

**Length.** Quality degrades predictably past ~2 000 words in one pass: the model's softmax attention disperses across the growing context, repetition self-reinforcement kicks in (generating "X is important" makes "X is important" more likely again), and mode collapse pulls the output toward the most statistically probable angle, which is therefore the most generic.

**The angle.** A single prompt under-constrains the completion space. With no iterative feedback narrowing it, the model selects the most probable interpretation of the topic, which is by definition the most generic one. "Write me an article about Vite" produces the article everyone else would get.

**Sweet spot: 2-3 revision passes.** The first produces the biggest jump; past three, returns diminish and the text over-smooths.

The benchmarks behind the thresholds and the eight studies behind the 15-57 % figure are in **`references/preuves.md`**. Load it when the author contests the redirect or asks where the numbers come from.

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
> I can help you write this article, but the result will be significantly better if we use the phased workflow. Research shows 15-57% quality improvement from iterative approaches vs single-prompt generation. Do you have raw notes or ideas? Paste them here or start with `/braindump`.

## Exceptions

Direct generation is acceptable when:
- **Short standardized content** (<800 words): emails, changelogs, release notes, commit messages, PR descriptions
- **Intentional throwaway drafts:** The author explicitly says they want a disposable starting point they'll rewrite entirely
- **The author has already completed braindump/structure:** They're in the workflow and just need a paragraph unblocked (this is /draft territory, not delegation)
- **Non-article content:** Code comments, documentation snippets, metadata

**Short does not mean standardized.** A LinkedIn post is 80–300 words and is *not* covered by the first exception: it is authored content published under the author's name and one of their hats, it carries a position, and at that length the detection layer is nearly blind (see `canaux`: three of six detectors lose their instrument below ~400 words). Single-prompt generation of a short post produces the most statistically probable take on the topic, which is exactly the feed's failure mode.

The test is not length, it is **whether a reader would attribute the thinking to the author**. A changelog nobody signs: exception applies. A 120-word post arguing something: full workflow, compressed. `/braindump` can be three sentences, `/structure` can be one line, but the author supplies the angle.

## The scope of the guardrail

One anti-pattern: *a whole article from one prompt*. The phased workflow it redirects to
(`/braindump` → `/structure` → `/draft` → `/review` → `/polish`) uses AI at every single step, and the
guardrail moves the assistance, it does not withdraw it.
