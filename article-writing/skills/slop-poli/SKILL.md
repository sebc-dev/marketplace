---
name: slop-poli
description: |
  Active during /draft (prevention) and /review (detection). Detects content with surface
  polish but no substance — slop. Based on Kommers et al. (2026) three-property definition,
  four quality levels, five diagnostic tests, and the VERMILLION framework. Provides a
  0-10 scoring grid for /review and prevention rules for /draft.
---

## Definition

Slop (Kommers et al., arXiv 2601.06060, Alan Turing Institute, January 2026) has three prototypical properties:
1. **Superficial competence** — a veneer of quality masking a deeper lack of substance
2. **Asymmetric effort** — near-instantaneous production, costly verification
3. **Mass producibility** — could be generated for any topic with a trivial prompt change

Slop is not hallucination. Hallucination is factually wrong. Slop is formally correct but intellectually empty — grammatically perfect, well-structured, fluent, and vacuous.

**Diagnostic question:** Would this text change if the author had different experience, expertise, or values? If no, it's slop.

## Four quality levels

AI performance degrades across these levels. The first two mask the failure of the last two.

### Level 1: Formal quality (AI excels)
Grammar, spelling, fluency, punctuation, transitions. AI produces near-perfect formal quality, which creates a processing fluency bias — fluent text is judged as more true and higher quality (documented cognitive bias).

### Level 2: Structural quality (AI partially manages)
Logical organization, apparent claim-evidence-conclusion chains, section flow. AI can produce structurally competent text, but the structure often follows templates (see structure-symetrique) rather than the argument's natural shape.

### Level 3: Epistemic quality (AI systematically fails)
Confidence modulation (knowing when to hedge vs assert), specific verifiable examples, authentic engagement with counter-arguments, genuine acknowledgment of limitations. This is where slop reveals itself — perfect form with no epistemic substance.

### Level 4: Vocal quality (AI fundamentally incapable)
Situated perspective, learning arc, stakes-based position-taking, lived experience, vulnerability, humor, idiosyncrasy. The author's fingerprint. If a text has Levels 1-2 but lacks Levels 3-4, it's polished slop.

## The 5 diagnostic tests

Apply these during /review, paragraph by paragraph.

### 1. Swap test
Replace the main subject with any similar subject in the same domain.
- "This framework is powerful and flexible" → true for any framework → **slop**
- "Astro's island architecture means I can ship a React component inside an otherwise static page without a JS bundle for the whole site" → specific to Astro → **not slop**

### 2. Voice test
Could you identify the author from reading this text alone?
- "Many developers find that..." → could be anyone → **slop**
- "I spent three evenings trying to get this working before I realized the problem was in my Cloudflare Workers config, not in the framework" → specific author → **not slop**

### 3. So-what test (The Economist test)
After each paragraph, can the reader answer "so what?"
- "React is a popular library for building user interfaces" → so what? → **slop**
- "React's reconciliation algorithm means your component re-renders on every state change, which is why my dashboard with 200 rows was freezing" → clear so-what → **not slop**

### 4. Anecdote test
Does the text contain a specific, personal, non-generic story?
- Generic: "Teams often struggle with migration projects"
- Specific: "We migrated 47 Cloudflare Workers in two weeks and the one that broke production was the one we thought was simplest"

### 5. Specificity test
Does the text contain dates, names, version numbers, concrete numbers from the author's experience?
- Generic: "Performance improved significantly"
- Specific: "Build time dropped from 45s to 12s after switching from Webpack 5 to Vite 5.4"

## VERMILLION framework

10 diagnostic signals (ResearchLeap, 2025). Each letter maps to a detectable pattern.

| Letter | Signal | Substance indicator | Slop indicator |
|--------|--------|-------------------|---------------|
| **V** | Vocabulary patterns | Precise, technical when needed | Overuse of "delve", "pivotal", "nuanced" |
| **E** | Echoed structures | Natural syntactic variation | Same sentence pattern 3+ times consecutively |
| **R** | Rigid transitions | Organic, sometimes abrupt | "Furthermore"/"Moreover"/"Additionally" cascade |
| **M** | Mechanical rhythm | Short/long alternation, one-liners | Near-uniform sentence and paragraph lengths |
| **I** | Inflexible paragraphing | Variable lengths including one-liners | Systematically 4-6 sentences per paragraph |
| **L** | Lack of lived experience | Specific anecdotes, proper nouns, sensory details | "Many developers find that..." |
| **L** | Lexical anomalies | Register consistent with context | Unusually elevated vocabulary for context |
| **I** | Information sourcing | Specific citations with verifiable origin | "Studies have shown...", "Experts agree..." |
| **O** | Over-hedging | Appropriate certainty modulation | "It's worth noting that...", "It's important to..." |
| **N** | Neutralized stance | Clear position even when nuanced | Systematic false balance without conclusion |

## Genre-specific slop markers

### Technical blog
Biggest risk: fluency without understanding. The article reads well but the author hasn't actually done the thing they're describing. Look for: absence of error messages, no version numbers, no "gotchas", no mention of what didn't work.

### Experience report (REX)
Biggest risk: absence of learning arc. A real REX shows: initial assumption → reality check → what changed in the author's thinking. Slop REX presents events chronologically without analysis.

### Opinion/reflection
Biggest risk: false balance. The article presents "pros and cons" without ever committing to a position. Every paragraph hedges. The reader finishes without knowing what the author actually thinks.

### Tutorial
Biggest risk: paraphrased documentation. The tutorial adds nothing that the official docs don't already say. No personal commentary on why steps are ordered this way, no warnings about common mistakes.

## Scoring grid for /review

| Criterion | 0 | 1 | 2 |
|----------|---|---|---|
| **Identifiable thesis** | No position taken | Implied but not stated | Clear, specific, debatable thesis |
| **Specificity** | Fully substitutable | Some specific elements | Anchored in unique context |
| **Personal experience** | Absent | Present but generic | Specific, relevant, non-obvious |
| **Concrete data** | Pure abstractions | Some specifics | Dates, versions, numbers, error messages |
| **Risk-taking** | Pure consensus | Mild opinion | Contestable position, argued |
| **Total** | **/10** | | |

**Interpretation:**
- 0-3: Slop — surface polish, no substance. Flag entire passage.
- 4-6: At risk — has some substance but needs reinforcement. Flag weak areas.
- 7-10: Substantive — genuine voice and content.

## Prevention rules for /draft

When assisting with writing (Mode B of /draft), actively prevent slop:

1. **Never produce a sentence that passes the swap test.** If the sentence would be equally true with a different subject, it's too generic. Ask the author for specifics.
2. **Include the author's specific context.** Use their project names, version numbers, error messages from the braindump notes.
3. **Prefer imperfect but specific over polished but generic.** "The deploy broke at 2am and I had to rollback" beats "Deployment challenges are common in microservices architectures."
4. **If the paragraph sounds too smooth, say so.** "This paragraph is technically correct but doesn't sound like you. Can you tell me what specifically happened?"
5. **Test every paragraph against the so-what test.** If there's no clear takeaway, it's padding.

## Relationship with other skills

- **slop-vocabulary**: Detects lexical markers of AI text. This skill detects semantic emptiness regardless of vocabulary.
- **fausse-profondeur**: Detects rhetorical patterns that simulate depth. This skill evaluates whether actual depth exists.
- **structure-symetrique**: Detects structural templates. This skill evaluates whether content within the structure has substance.
- **cognitive-outsourcing**: Both protect against shortcuts. cognitive-outsourcing protects learning; this skill protects quality.
- **delegation-totale**: Single-prompt generation almost always produces slop. This skill explains why.
