# Phase 7: Activation Testing and Validation - Research

**Researched:** 2026-02-03
**Domain:** Claude Code skill validation / auto-activation testing / session resilience
**Confidence:** HIGH

## Summary

This phase validates the completed astro-cloudflare skill end-to-end across four test dimensions: auto-activation triggering, reference file navigation, MCP integration boundary, and session resilience after context compaction. Unlike Phases 1-6 which produced artifacts, Phase 7 is a testing phase that produces a validation report and fixes any failures found.

The research investigated how Claude Code skill auto-activation works (description-based keyword matching, default 15,000 character budget for all skill descriptions), what survives context compaction (CLAUDE.md rules persist, conversation-embedded instructions may be lost, skill descriptions remain in context but full skill content may need re-invocation), and how to structure effective validation checklists for manual testing of an AI assistant's behavior.

The key insight from research is that auto-activation reliability depends primarily on the description field keywords matching user prompt terms. The skill's description (1017 chars) is already keyword-dense with explicit "Use when" triggers. Testing must verify that these keywords actually trigger activation with natural (non-keyword-stuffed) prompts. For session resilience, the critical finding is that rules encoded in the SKILL.md body (Critical Rules section) should survive compaction because Claude re-reads loaded skills, but rules that are deeply nested in reference files may not be consulted again after compaction unless the user's prompt triggers navigation.

**Primary recommendation:** Execute testing as a structured checklist with pre-written prompts, expected outcomes, and pass/fail columns. Split into two plans: Plan 1 covers activation + navigation + MCP tests (can be verified mechanically against file contents). Plan 2 covers session resilience (requires a real long conversation simulation). Fix failures inline during testing, not as a separate remediation step.

## Standard Stack

This phase produces a validation report, not code. No library dependencies.

### Core
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| Markdown | Validation report format (07-VALIDATION.md) | Consistent with project documentation |
| grep -n | Verify navigation hints target correct files/sections | Same tool Claude uses at runtime |
| git show | Read committed skill files for verification | Files exist in git, not working tree |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| wc -l | Verify SKILL.md stays under 500 lines | Quick structural check |
| git diff | Compare before/after if fixes are needed | Track what changed during testing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual prompt-by-prompt testing | Automated test harness (Scott Spence approach) | Overkill for 1 skill with 8 test prompts; manual is faster |
| Real Claude Code session for all tests | Simulated grep verification | Some tests (activation, resilience) require real Claude interaction; navigation can be verified mechanically |

## Architecture Patterns

### Validation Report Structure
```
.planning/phases/07-activation-testing/07-VALIDATION.md
├── ## Test 1: Activation Scenarios (TEST-01)
│   ├── Positive prompts (5+) with pass/fail
│   └── Negative prompts (3+) with pass/fail
├── ## Test 2: Reference Navigation (TEST-02)
│   ├── Per-file test questions (11 files)
│   └── Grep hint verification results
├── ## Test 3: MCP Integration (TEST-03)
│   ├── MCP-appropriate prompts
│   └── Skill-appropriate prompts
├── ## Test 4: Session Resilience (TEST-04)
│   ├── Pre-compaction noise conversation
│   ├── Post-compaction critical rule checks
│   └── 80% threshold assessment
└── ## Go/No-Go Decision
```

### Pattern 1: Structured Test Checklist with Pre-Written Prompts
**What:** Each test is a table row with: test ID, prompt text, expected behavior, actual result, pass/fail, notes
**When to use:** For all four test categories
**Why:** Reusable across future skill updates. Someone can re-run these exact prompts after modifications.

**Example:**
```markdown
### Positive Activation Prompts

| # | Prompt | Expected | Result | P/F |
|---|--------|----------|--------|-----|
| P1 | "Create an Astro component with client:visible hydration" | Skill activates, references components-islands.md | | |
| P2 | "Configure wrangler for D1 database bindings" | Skill activates, references cloudflare-platform.md | | |
```

### Pattern 2: Navigation Verification via Grep
**What:** For each of the 11 reference files, write a domain-specific question, then verify the grep hint in SKILL.md targets the correct file and section
**When to use:** For TEST-02 (Reference Navigation)
**Why:** Can be verified mechanically -- run the grep command, check the output matches the expected section. Does not require a full Claude session.

**Example:**
```markdown
### Reference Navigation Verification

| File | Test Question | Grep Pattern | Expected Section | Verified |
|------|--------------|-------------|-----------------|----------|
| components-islands.md | "How do I share state between islands?" | `grep -n "Nanostores" references/components-islands.md` | ## Nanostores Pattern | |
```

### Pattern 3: Session Resilience via Long Conversation
**What:** Pose 10-15 varied questions (mix of Astro, non-Astro, and general coding) to build up context, then test whether critical rules are still applied
**When to use:** For TEST-04 (Session Resilience)
**Why:** The CONTEXT.md decision specifies "real long conversation" approach. This simulates actual usage patterns where context compaction may occur.

### Anti-Patterns to Avoid
- **Testing activation with keyword-stuffed prompts:** "Astro Cloudflare component island hydration" is not how real users talk. Use natural language prompts.
- **Testing only one prompt per category:** Statistical noise means a single prompt might activate or not activate for reasons unrelated to the skill. Use 5+ positive, 3+ negative.
- **Testing navigation without running actual grep commands:** Grep patterns could be stale if reference files were edited. Verify by running each pattern.
- **Assuming compaction preserves everything:** Detailed instructions from early in conversation may be lost. The Critical Rules in SKILL.md body should survive because they are part of the loaded skill content, but only if the skill remains loaded.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Activation testing framework | Custom script/hook system | Manual checklist with pre-written prompts | Only testing 1 skill with ~8 prompts; framework is overkill |
| Grep pattern validation | Manual spot-checking | Run ALL 102 grep patterns and verify each returns exactly 1 line | Phase 05-02 established this pattern; reuse it |
| Session resilience simulation | Token-counting tool | Real conversation with 10-15 questions | No reliable way to force compaction; long conversation is the best approximation |
| Test result tracking | Spreadsheet or database | Markdown table in 07-VALIDATION.md | Consistent with project documentation format |

**Key insight:** Phase 7 is validation, not automation. The tests are run once (or re-run after fixes). A reusable checklist in markdown is the right fidelity level.

## Common Pitfalls

### Pitfall 1: Confusing Skill Loading with Skill Activation
**What goes wrong:** Tester assumes the skill "activated" because Claude knows about Astro, but actually Claude used training data, not the skill
**Why it happens:** Claude has Astro knowledge from training. The skill adds Cloudflare-specific patterns and breaking change prevention that Claude would not know otherwise.
**How to avoid:** Test for skill-specific knowledge, not general Astro knowledge. The litmus test: does Claude apply Critical Rule #1 (`src/content.config.ts` not `src/content/config.ts`)? Does it recommend `client:visible` as default hydration? These are skill-specific behaviors.
**Warning signs:** Claude gives correct but generic Astro advice without referencing specific files or patterns from the skill

### Pitfall 2: Testing Navigation Without Verifying the Full Chain
**What goes wrong:** Grep hint returns the right line number, but Claude does not actually read that section
**Why it happens:** Navigation testing only verifies the grep pattern works, not that Claude follows the navigation chain from SKILL.md to the reference file
**How to avoid:** For at least a subset of navigation tests, verify the full chain: ask a domain question, check that Claude reads the correct reference file section (visible in tool use), and gives an answer consistent with that section's content
**Warning signs:** Claude gives correct answers from training data rather than from reference file content

### Pitfall 3: Negative Activation Tests That Are Too Obviously Non-Astro
**What goes wrong:** Negative tests like "help me with Python" are trivially non-Astro. They don't test the interesting boundary cases.
**Why it happens:** Easy to write obviously-unrelated prompts
**How to avoid:** Include boundary cases per CONTEXT.md decisions: "Cloudflare Workers without Astro" (Cloudflare keyword overlap), "Next.js on Vercel" (neighboring framework), "astronomy image processing" (word "Astro" in different context)
**Warning signs:** All negative tests pass trivially because they have zero keyword overlap with the skill description

### Pitfall 4: Session Resilience Test That Does Not Actually Approach Compaction
**What goes wrong:** 10 questions are asked but they are short and the context is nowhere near full, so compaction never triggers
**Why it happens:** Simple Q&A exchanges consume far less context than file reads, tool uses, and code generation
**How to avoid:** The "noise" conversation should include actions that generate substantial context: asking Claude to read files, generate code, explain complex topics. 10-15 substantive questions with tool use should approach the compaction threshold.
**Warning signs:** `/context` shows context is only 30% full after the noise conversation

### Pitfall 5: Not Fixing Failures Inline
**What goes wrong:** All tests are run, failures are documented, but fixes are deferred
**Why it happens:** Momentum of completing the checklist
**How to avoid:** Per CONTEXT.md decision: "On failure: correct immediately, re-test, then continue." Each failure should be fixed before proceeding to the next test category.
**Warning signs:** Validation report has multiple failures with notes like "to be fixed later"

## Code Examples

### Activation Test Prompt Design
```markdown
## Positive Activation Prompts (5+ required)

Prompts must be NATURAL language, not keyword-stuffed.
Each targets a different domain to test description keyword coverage.

| # | Prompt | Target Domain | Key Description Keywords |
|---|--------|--------------|-------------------------|
| P1 | "Create an Astro component that loads a React counter with client:visible" | components-islands | Astro component, client:visible |
| P2 | "Configure wrangler for D1 database bindings in my Astro project" | cloudflare-platform | wrangler, D1, Cloudflare, Astro |
| P3 | "My Astro site doesn't deploy to Cloudflare Pages -- build fails" | build-deploy | Astro, Cloudflare Pages, deploy |
| P4 | "Set up content collections with MDX in Astro 5" | data-content | content collections, MDX, Astro 5 |
| P5 | "How do I add SSR to specific pages in my Astro static site?" | rendering-modes | SSR, Astro, static site |
| P6 | "Configure environment variables for my Astro app on Workers" | cloudflare-platform | environment variables, Astro, Workers |

## Negative Activation Prompts (3+ required)

| # | Prompt | Why It Should NOT Activate | Boundary Being Tested |
|---|--------|---------------------------|----------------------|
| N1 | "Set up a Next.js app with Vercel deployment" | Neighboring framework, different provider | Framework specificity |
| N2 | "Help me process astronomy images with Python" | Word "astro" in non-framework context | Semantic disambiguation |
| N3 | "Configure Cloudflare Workers for a Hono API" | Cloudflare without Astro | Platform overlap without framework |
```

### Navigation Test Design
```markdown
## Reference Navigation Tests (all 11 files)

For each file, the test question should be answerable ONLY from that
specific reference file, not from SKILL.md body or general knowledge.

| File | Test Question | Expected Grep | Expected Content |
|------|--------------|---------------|-----------------|
| project-structure.md | "What's the recommended file layout for an Astro 5 project?" | `grep -n "## File Organization"` | Directory tree with src/ structure |
| rendering-modes.md | "When should I use Server Islands vs client islands?" | `grep -n "## Server Islands"` | server:defer pattern |
| cloudflare-platform.md | "How do I access KV bindings in Astro middleware?" | `grep -n "## Bindings Access"` | Astro.locals.runtime.env pattern |
| components-islands.md | "How do I share state between React and Vue islands?" | `grep -n "## Nanostores Pattern"` | nanostores cross-framework pattern |
| routing-navigation.md | "What are the redirect methods available in Astro on Cloudflare?" | `grep -n "## Redirect Method Selection"` | 6-method redirect table |
| data-content.md | "How do I set up Actions for form handling?" | `grep -n "## Astro Actions Basic Signature"` | defineAction with accept:'form' |
| styling-performance.md | "How do I configure image optimization without Sharp on Workers?" | `grep -n "## Image Service Selection"` | imageService: 'compile' |
| seo-i18n.md | "How do I generate hreflang tags for multilingual Astro site?" | `grep -n "## Hreflang Component"` | HreflangComponent pattern |
| typescript-testing.md | "How do I test Astro components with Container API?" | `grep -n "## Container API Test"` | experimental_AstroContainer |
| build-deploy.md | "How do I set up CI/CD for Astro on Cloudflare?" | `grep -n "## GitHub Actions CI/CD"` | wrangler-action@v3 workflow |
| security-advanced.md | "How do I add CSP headers to my Astro SSR app?" | `grep -n "## CSP Config"` | CSP middleware pattern |
```

### Session Resilience Test Design
```markdown
## Critical Rules to Verify Post-Compaction

### Astro 5 Breaking Changes (5 rules)
| Rule | Test Prompt | Expected Behavior |
|------|------------|-------------------|
| content.config.ts path | "Create a blog content collection" | Uses src/content.config.ts (NOT src/content/config.ts) |
| slug to id | "Generate blog post URLs from collection" | Uses entry.id (NOT entry.slug) |
| render() API | "Render a content collection entry" | import { render } from 'astro:content' (NOT entry.render()) |
| loader not type | "Define a content collection schema" | Uses loader: glob() (NOT type: 'content') |
| ClientRouter | "Add page transitions to Astro site" | Uses <ClientRouter /> (NOT <ViewTransitions />) |

### Cloudflare Constraints (3 rules)
| Rule | Test Prompt | Expected Behavior |
|------|------------|-------------------|
| No Sharp | "Add image optimization" | Uses imageService: 'compile' (NOT Sharp) |
| No process.env | "Access API key in Astro route" | Uses Astro.locals.runtime.env (NOT process.env) |
| nodejs_compat | "Use Node.js crypto in Worker" | Mentions nodejs_compat flag requirement |
```

### MCP Boundary Test Design
```markdown
## MCP Integration Tests

### Should Use MCP (API details not in skill)
| # | Prompt | Expected | Why MCP |
|---|--------|----------|---------|
| M1 | "What are all the options for defineAction?" | Claude calls search_astro_docs | Exhaustive API signatures not in skill |
| M2 | "List all astro.config.mjs configuration fields" | Claude calls search_astro_docs | Config option lists not in skill |

### Should Use Skill (decisions/patterns in skill)
| # | Prompt | Expected | Why Skill |
|---|--------|----------|-----------|
| M3 | "Should I use SSR or SSG for my Astro site?" | Uses Decision Matrix from SKILL.md | Architecture decision covered in skill |
| M4 | "What's wrong with using process.env on Workers?" | Uses Critical Rule #6 | Anti-pattern covered in skill |
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Assume auto-activation works | Test activation with natural prompts | Anthropic docs + community research 2025 | Skills may not activate without keyword-matching descriptions |
| Persistent memory across sessions | Each session starts fresh; CLAUDE.md persists | Claude Code architecture | Skill content survives within session; cross-session relies on files |
| Manual compaction | Auto-compaction when context fills | Claude Code updates 2025 | Rules in SKILL.md body should survive because skill stays loaded |
| Single activation test | 5+ positive, 3+ negative prompts | TEST-01 requirement | Statistical reliability of activation testing |

**Key finding from research:** Claude Code's official documentation confirms: "Skill descriptions are loaded into context so Claude knows what's available, but full skill content only loads when invoked." After compaction, the description remains in context but the full skill content may need to be re-loaded. The Critical Rules in the SKILL.md body should survive if the skill was loaded pre-compaction, since the loaded skill content becomes part of the conversation context. However, reference file content (loaded on-demand via grep) would NOT survive compaction and would need to be re-fetched.

**Important nuance on activation:** The official docs state there is a 15,000 character default budget for all skill descriptions. With only one custom skill (astro-cloudflare at ~1017 chars), we are well within budget. If the user has other personal skills in ~/.claude/skills/, those compete for the same budget.

## Open Questions

1. **Can we reliably force compaction during testing?**
   - What we know: Context compaction happens automatically when context fills up. The `/compact` command forces compaction manually. Running `/context` shows current usage.
   - What's unclear: Whether 10-15 questions are sufficient to approach the compaction threshold, or whether we need to use `/compact` explicitly to simulate post-compaction behavior.
   - Recommendation: Use `/compact` explicitly after the noise conversation to guarantee compaction happens. Then test critical rules. This is more reliable than hoping natural conversation fills context.

2. **How to verify skill activation vs training knowledge?**
   - What we know: Claude has Astro knowledge from training. The skill adds specific patterns (Critical Rules, Cloudflare-specific constraints, decision matrices).
   - What's unclear: Whether Claude would give the same answers from training alone (without the skill loaded).
   - Recommendation: Test with prompts where the skill provides value beyond training: Astro 5.x breaking changes (training may have old patterns), Cloudflare-specific constraints (process.env vs runtime.env), and exact decision matrix recommendations (client:visible as default). If Claude applies these, the skill is being used.

3. **What constitutes "activation" for testing purposes?**
   - What we know: Activation means Claude loads the full SKILL.md content. This is visible in the system as a Skill tool invocation.
   - What's unclear: Whether the tester can observe skill loading in the CLI output, or must infer it from behavior.
   - Recommendation: Check for skill-specific behavior patterns. If Claude references the skill's file structure (references/*.md), uses exact Critical Rule numbers, or navigates via grep patterns, the skill is active.

## Sources

### Primary (HIGH confidence)
- Official Claude Code Skills documentation (https://code.claude.com/docs/en/skills) - fetched 2026-02-03: frontmatter format, auto-activation mechanics, description field, progressive disclosure, context budget
- Official Claude Code "How it works" documentation (https://code.claude.com/docs/en/how-claude-code-works) - fetched 2026-02-03: context compaction behavior, what survives compaction, CLAUDE.md persistence, skill loading lifecycle
- Project SKILL.md (git HEAD) - 256 lines, 11 reference files, 102 grep patterns, 10 Critical Rules, 4 decision matrices
- Project CONTEXT.md for Phase 7 - locked decisions on test methodology, coverage requirements, success thresholds

### Secondary (MEDIUM confidence)
- Scott Spence skill activation testing research (https://scottspence.com/posts/how-to-make-claude-code-skills-activate-reliably) - 200+ prompt tests, 84% activation success with forced eval hook approach. Relevant finding: keyword matching in descriptions is the primary trigger.
- GitHub issue #13099 on skill description character budget - confirms 15,000 char default budget, ~109 chars XML overhead per skill

### Tertiary (LOW confidence)
- Community reports on context compaction quality and what survives - general agreement that loaded skill content persists within session but may be summarized. Needs validation during actual testing.

## Metadata

**Confidence breakdown:**
- Activation testing methodology: HIGH - Official docs + community research confirm description-based matching; test prompt design is straightforward
- Navigation verification: HIGH - Grep patterns already verified in Phase 05-02 (102 patterns, each returns exactly 1 line); re-verification is mechanical
- MCP boundary testing: HIGH - MCP boundary explicitly documented in SKILL.md; test prompts can target the boundary precisely
- Session resilience: MEDIUM - Compaction behavior is documented but exact preservation of loaded skill content after compaction is not guaranteed by official docs. Real testing needed.
- Fix-on-failure process: HIGH - Straightforward: identify failure, edit file, re-verify. Same process used in Phases 1-6.

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (stable -- skill testing patterns unlikely to change in 30 days)
