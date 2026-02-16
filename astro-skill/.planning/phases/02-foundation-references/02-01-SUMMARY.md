---
phase: 02-foundation-references
plan: 01
subsystem: docs
tags: [astro, cloudflare, project-structure, config-templates, naming-conventions]

# Dependency graph
requires:
  - phase: 01-scaffolding
    provides: reference file stubs and skill skeleton
provides:
  - "project-structure.md: Astro 5.x file organization, naming, config templates for Cloudflare"
  - "Copy-pasteable astro.config.mjs (SSG/SSR/static+opt-out), tsconfig.json, env.d.ts, content.config.ts, package.json scripts, .gitignore"
  - "10 anti-patterns table, 10 troubleshooting entries for project structure domain"
affects: [03-core-references, 04-secondary-references, 05-synthesis]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Quick Reference header pattern: 5-10 imperative rules per reference file"
    - "Config template variants: multiple copy-pasteable configs per output mode"
    - "Anti-patterns as absolute rules in dedicated section (no confidence tags)"
    - "Troubleshooting fix must be one line (multi-line points to Config Templates)"

key-files:
  created: []
  modified:
    - ".claude/skills/astro-cloudflare/references/project-structure.md"

key-decisions:
  - "Three astro.config.mjs variants (SSG pure, SSR on CF, static+opt-out) cover all deployment scenarios"
  - "Excluded wrangler.jsonc template (belongs in cloudflare-platform.md per domain assignment)"
  - "Excluded .dev.vars detail section (belongs in cloudflare-platform.md)"

patterns-established:
  - "Reference file structure: Quick Reference > File Organization > Naming > Config Templates > Anti-patterns > Troubleshooting"
  - "250 lines budget achievable with table-heavy format and compact code templates"

# Metrics
duration: 3min
completed: 2026-02-03
---

# Phase 2 Plan 1: Project Structure Summary

**Prescriptive Astro 5.x project structure reference with 8 quick rules, naming table, 6 config templates, 10 anti-patterns, and 10 troubleshooting entries for Cloudflare deployment**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-03T12:47:39Z
- **Completed:** 2026-02-03T12:50:54Z
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments

- Replaced title-only stub with 250-line prescriptive reference file
- All 6 required sections written: Quick Reference, File Organization, Naming Conventions, Config Templates, Anti-patterns, Troubleshooting
- Config templates cover: astro.config.mjs (3 variants), tsconfig.json, env.d.ts, content.config.ts, package.json scripts, .gitignore
- Cross-verified all Astro 5.x breaking changes against research sources
- Confirmed no domain overlap with cloudflare-platform.md or rendering-modes.md

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Write and verify project-structure.md** - `47060cf` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `.claude/skills/astro-cloudflare/references/project-structure.md` - Complete Astro 5.x project structure reference (250 lines)

## Decisions Made

- Three astro.config.mjs variants chosen (SSG, SSR, static+SSR-opt-out) to cover all Cloudflare deployment modes
- wrangler.jsonc template excluded from this file (assigned to cloudflare-platform.md per RESEARCH.md domain map)
- .dev.vars detailed section excluded (assigned to cloudflare-platform.md)
- content.config.ts template shows both glob() and file() loaders to demonstrate both patterns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- project-structure.md complete and committed
- Ready for 02-02-PLAN.md (rendering-modes.md)
- Note: rendering-modes.md has uncommitted content in working tree (pre-existing, not from this plan)

---
*Phase: 02-foundation-references*
*Completed: 2026-02-03*
