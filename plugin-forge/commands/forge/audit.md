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
- [ ] name fields are kebab-case and match directory names
- [ ] No orphaned files (files not reachable from any component)

## Stage 2: Description Quality

For each skill, evaluate the description field:

| Criterion | Score 0-3 |
|-----------|-----------|
| **Keyword density:** domain terms, file patterns, action verbs | |
| **Activation triggers:** "Use when..." conditions present | |
| **Boundary markers:** "Do NOT use for..." / "Complements X" | |
| **Specificity:** would this activate reliably? | |

Score guide: 0=missing, 1=weak, 2=adequate, 3=strong

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

- [ ] Commands leverage skill knowledge (not duplicate it)
- [ ] Reference files are indexed in SKILL.md body
- [ ] Reference files use XML tags for sections
- [ ] References are one level deep (no reference -> reference chains)
- [ ] Hooks (if any) block at boundaries, not mid-execution
- [ ] Agents (if any) return structured summaries, not verbose dumps
- [ ] No duplicated content across components

## Stage 5: Completeness Check

- [ ] README.md exists with description, boundary declaration, and installation instructions
- [ ] All commands have `description` in frontmatter
- [ ] Commands with arguments have `argument-hint`
- [ ] Human/AI ratio documented for each command
- [ ] No time-sensitive content (versions, dates, URLs that change)
- [ ] No sensitive information (API keys, internal paths)

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
