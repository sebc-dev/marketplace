---
description: "Quality audit of an existing plugin. Evaluates structure, descriptions, context budget, orchestration, and completeness. Produces a severity-rated report."
argument-hint: "[path to plugin directory]"
---

## Context

You are a plugin quality auditor. Analyze the plugin at the given path and produce a structured audit report across 5 stages.

Ratio: 20% human / 80% AI. The AI performs all analysis. The human reviews findings.

## Stage 1: Structure Validation

Read the plugin's `plugin.json` and directory structure. Check:

- [ ] `plugin.json` is valid JSON with required fields (name, version, description)
- [ ] Referenced component directories exist (commands/, skills/, agents/, hooks/)
- [ ] Skill directories contain SKILL.md files
- [ ] SKILL.md files have valid YAML frontmatter starting at line 1
- [ ] `name` field ≤ 64 chars, kebab-case, no `anthropic`/`claude` reserved words
- [ ] `name` matches directory name
- [ ] **`references/`, `scripts/`, `assets/` live INSIDE the skill folder** (`skills/<skill>/references/`), NOT at the plugin root — flag as Critical if found at root
- [ ] Frontmatter contains only spec-recognized fields (no `version`, `author`, `tags` — they're silently ignored)
- [ ] Claude Code-only fields (`allowed-tools`, `when_to_use`, `paths`, `disable-model-invocation`, `user-invocable`) only used in skills targeting Claude Code
- [ ] No orphaned files (files not reachable from any component)

## Stage 2: Description Quality

For each skill, evaluate the description field:

| Criterion | Score 0-3 |
|-----------|-----------|
| **Length within spec:** ≤ 1024 chars (or ≤ 1536 with `when_to_use` for Claude Code) | |
| **Third-person, impératif:** never "I will…" | |
| **Keyword density:** domain terms, file extensions, config names, action verbs | |
| **TRIGGER markers:** explicit activation conditions (file patterns, imports, keywords) | |
| **SKIP / boundary markers:** "Do NOT use for..." / "SKIP when..." / "Complements X" | |
| **Front-loaded triggers:** key keywords in the first sentence (resilient to truncation) | |
| **NOT a workflow summary:** description describes when to activate, not the steps the skill performs | |

Score guide: 0=missing, 1=weak, 2=adequate, 3=strong

**Critical anti-pattern check:** Does the description summarize a workflow ("First X, then Y, then Z")? If yes, flag as **Critical** — Claude reads the summary and skips the SKILL.md, defeating progressive disclosure. The skill should be either (a) reframed as activation conditions only, or (b) converted to a command if it's actually a multi-step orchestrated workflow.

## Stage 3: Context Budget Analysis

Estimate token costs across the 4 layers:

| Layer | Content | Estimated tokens |
|-------|---------|-----------------|
| L1: Metadata | Skill descriptions (always loaded) | |
| L2: Body | SKILL.md content (loaded on match) | |
| L3: References | Reference files (loaded on demand) | |
| L4: Commands | Command files (loaded on invoke) | |

Check against targets:
- Inactive cost (L1 only) < 300 tokens?
- Body (L2) < 200 lines per skill?
- References (L3) use XML tags for selective loading?

## Stage 4: Orchestration Review

Analyze how components work together:

- [ ] **Each skill is single-purpose.** A skill describing multiple unrelated tasks should be split.
- [ ] **Skills hold expertise; commands hold workflows.** Flag as Major any skill whose body reads like an orchestrated pipeline ("First X, then Y, then Z, finally Z") — that belongs in a command.
- [ ] Commands leverage skill knowledge (not duplicate it)
- [ ] Reference files are indexed in SKILL.md body
- [ ] Reference files use XML tags for sections
- [ ] References are one level deep (no reference -> reference chains)
- [ ] Hooks (if any) block at boundaries, not mid-execution
- [ ] Agents (if any) return structured summaries, not verbose dumps
- [ ] No MUST/ALWAYS empilés without justification (Anthropic yellow flag — explain *why* instead)
- [ ] No duplicated content across components

## Stage 5: Completeness Check

- [ ] README.md exists with description, boundary declaration, and installation instructions
- [ ] All commands have `description` in frontmatter
- [ ] Commands with arguments have `argument-hint`
- [ ] Human/AI ratio documented for each command
- [ ] No time-sensitive content (versions, dates, URLs that change)
- [ ] No sensitive information (API keys, internal paths)
- [ ] If skill is published or shared: an eval set of 16-20 queries (8-10 should-trigger, 8-10 near-miss should-NOT-trigger) is documented or available
- [ ] No bundled large SDK docs that change frequently (prefer `WebFetch` to live README)

## Output Format

```
# Audit Report: [plugin-name]

## Summary
Total issues: X Critical, Y Major, Z Minor
Overall score: [A/B/C/D/F]

## Stage 1: Structure
[Findings with severity]

## Stage 2: Descriptions
[Skill-by-skill scores]

## Stage 3: Context Budget
[Token estimates and budget compliance]

## Stage 4: Orchestration
[Component interaction findings]

## Stage 5: Completeness
[Missing elements]

## Top 3 Priority Fixes
1. [Most critical issue]
2. [Second most critical]
3. [Third most critical]

## Recommendations
[Ordered list of improvements]
```

### Severity classification

- **Critical:** Prevents reliable activation or breaks validation. Must fix.
- **Major:** Wastes significant tokens or degrades user experience. Should fix.
- **Minor:** Suboptimal but functional. Fix if time allows.

### Scoring guide

- **A:** 0 Critical, <=2 Minor. Ready to publish.
- **B:** 0 Critical, 1-3 Major. Fix majors before publishing.
- **C:** 1-2 Critical. Needs work.
- **D:** 3+ Critical. Significant redesign needed.
- **F:** Structural issues preventing validation.
