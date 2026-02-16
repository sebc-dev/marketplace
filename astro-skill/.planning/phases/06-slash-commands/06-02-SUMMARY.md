---
phase: 06-slash-commands
plan: 02
subsystem: commands
tags: [slash-command, audit, dynamic-context-injection, anti-patterns, critical-rules]

dependency-graph:
  requires: [01-01, 01-02, 02-01, 02-02, 02-03, 03-01, 03-02, 03-03, 03-04, 04-01, 04-02, 04-03, 04-04, 05-01]
  provides: [audit-command]
  affects: []

tech-stack:
  added: []
  patterns: [dynamic-context-injection, severity-categorized-reporting, grep-based-anti-pattern-discovery]

key-files:
  created:
    - .claude/commands/astro/audit.md
  modified: []

decisions:
  - id: audit-dynamic-antipatterns
    choice: "Read anti-patterns dynamically from reference files via grep, never hardcode"
    why: "Reference files are source of truth and may be updated independently"
  - id: audit-four-stages
    choice: "Four audit stages: Critical Rules, Cloudflare Compatibility, Config Correctness, Best Practices"
    why: "Maps to CRITICAL/CRITICAL/HIGH/MEDIUM severity for prioritized remediation"
  - id: audit-post-fix-offer
    choice: "Offer to fix CRITICAL issues with user confirmation per fix"
    why: "CRITICAL issues break build/runtime and should be fixed immediately, but user should approve each change"

metrics:
  duration: 2min
  completed: 2026-02-03
---

# Phase 06 Plan 02: Audit Command Summary

**JWT-style one-liner:** Audit command with dynamic context injection pre-reading 5 project files, checking 10 Critical Rules at CRITICAL severity, reading Anti-patterns from all 11 reference files via grep, and severity-categorized reporting (CRITICAL/HIGH/MEDIUM)

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create audit command | feadeb6 | .claude/commands/astro/audit.md |

## What Was Built

### Audit command (.claude/commands/astro/audit.md)

A comprehensive project audit command that:

1. **Pre-reads project state** via dynamic context injection (`!`command`` syntax) for:
   - `astro.config.mjs` / `astro.config.ts`
   - `package.json`
   - `wrangler.jsonc` / `wrangler.toml`
   - `tsconfig.json`
   - `src/content.config.ts`
   - `src/content/config.ts` (wrong location check)
   - Environment files (`.dev.vars`, `.env`)
   - Source file structure (`.astro`, `.ts`, `.tsx`)

2. **Stage 1 -- Critical Rules (CRITICAL):** Checks all 10 Critical Rules from SKILL.md with specific grep commands for each rule violation

3. **Stage 2 -- Cloudflare Compatibility (CRITICAL):** Reads cloudflare-platform.md Anti-patterns dynamically, checks for process.env, Sharp, missing nodejs_compat flags, .env/.dev.vars conflicts

4. **Stage 3 -- Config Correctness (HIGH):** Reads Anti-patterns from project-structure.md, rendering-modes.md, typescript-testing.md, build-deploy.md -- checks platformProxy, tsconfig extends, wrangler types scripts, adapter import

5. **Stage 4 -- Best Practices (MEDIUM):** Reads Anti-patterns from components-islands.md, routing-navigation.md, data-content.md, styling-performance.md, seo-i18n.md, security-advanced.md -- checks client:load overuse, missing site config, inline styles, Image alt attributes

6. **Report format:** Structured output with Summary, CRITICAL/HIGH/MEDIUM sections, Passed Checks, and Recommendations

7. **Post-audit:** Offers to fix CRITICAL issues with user confirmation, suggests reference sections for other issues

## Key Design Decisions

1. **Dynamic anti-pattern reading:** All anti-pattern content is read from reference files at audit time via grep, not hardcoded in the command. This means the audit automatically picks up any updates to reference files.

2. **Four severity stages:** Maps naturally to CRITICAL (build/runtime breaking), HIGH (bugs/DX), MEDIUM (best practices), with two CRITICAL stages (rules + Cloudflare) reflecting the dual-platform nature of the skill.

3. **Pre-loaded project state:** 8 dynamic context injections give Claude full project context before any instructions, enabling faster and more accurate auditing.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

All verification criteria passed:
- File exists at `.claude/commands/astro/audit.md`
- `disable-model-invocation: true` present (1 match)
- Dynamic context injection for astro.config, package.json, wrangler, tsconfig (5 cat commands)
- Anti-patterns references (16 matches across all 11 reference files)
- Critical Rules references (3 matches)
- CRITICAL/HIGH/MEDIUM severity levels (11 matches)
- No `argument-hint` in frontmatter (0 matches, correct)

## Next Phase Readiness

Plan 06-02 complete. Phase 06 has 2 plans total. With 06-01 (scaffold + migrate) already done, Phase 06 is ready for completion assessment.
