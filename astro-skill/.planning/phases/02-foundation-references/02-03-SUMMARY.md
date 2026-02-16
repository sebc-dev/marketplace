---
phase: 02-foundation-references
plan: 03
subsystem: infra
tags: [cloudflare, workers, bindings, kv, d1, r2, wrangler, nodejs-compat, env-vars]

# Dependency graph
requires:
  - phase: 01-scaffolding-and-frontmatter
    provides: reference file stubs and SKILL.md frontmatter
provides:
  - Cloudflare Workers runtime constraints reference
  - Bindings access patterns for all Astro contexts
  - wrangler.jsonc annotated template
  - Workers limits and Node.js compatibility tables
  - Environment variable management patterns
affects: [03-core-domain-references, 04-secondary-domain-references, 05-skillmd-synthesis]

# Tech tracking
tech-stack:
  added: []
  patterns: [locals.runtime.env bindings access, AsyncLocalStorage for deep function access, .dev.vars for local secrets]

key-files:
  created: []
  modified:
    - .claude/skills/astro-cloudflare/references/cloudflare-platform.md

key-decisions:
  - "Workers is default platform (Pages deprecated April 2025) -- all templates target Workers"
  - "Astro 5.x pattern (locals.runtime.env) with forward note for Astro 6 change"
  - "Explicit nodejs_compat_populate_process_env flag in template rather than relying on date auto-enable"

patterns-established:
  - "Prescriptive reference format: Quick Reference > Concept Sections > Config Templates > Anti-patterns > Troubleshooting"
  - "One-line fixes in troubleshooting tables, complex fixes point to relevant sections"

# Metrics
duration: 2min
completed: 2026-02-03
---

# Phase 2 Plan 3: Cloudflare Platform Reference Summary

**Cloudflare Workers bindings access, runtime limits, wrangler.jsonc template, and env var management for Astro 5.17+**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-03T12:49:37Z
- **Completed:** 2026-02-03T12:51:29Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Complete cloudflare-platform.md replacing title-only stub (233 lines, 8 sections)
- Bindings access patterns documented for all 4 Astro contexts (page, endpoint, middleware, action) plus AsyncLocalStorage deep access
- Copy-pasteable wrangler.jsonc template with KV, D1, R2 bindings, assets config, environments, and annotated comments
- Workers limits table (Free/Paid/Workaround) and Node.js compatibility matrix (16 modules)
- Anti-patterns table (8 entries) and troubleshooting table (8 entries) with one-line fixes

## Task Commits

Each task was committed atomically:

1. **Task 1: Read research sources and draft reference file** - `6ae371f` (feat)
2. **Task 2: Cross-verify accuracy and finalize** - No changes needed, file passed all verification checks

**Plan metadata:** (pending)

## Files Created/Modified
- `.claude/skills/astro-cloudflare/references/cloudflare-platform.md` - Complete Cloudflare platform reference (233 lines)

## Decisions Made
- Workers is the default deployment target (Pages deprecated April 2025); all templates and guidance reflect Workers
- Used Astro 5.x bindings pattern (`locals.runtime.env`) as primary with a note about Astro 6 changes
- Included `nodejs_compat_populate_process_env` flag explicitly in wrangler.jsonc template rather than relying on compatibility_date auto-enable (RESEARCH.md flagged this as needing validation)
- No domain overlap: excluded astro.config.mjs template (project-structure.md), rendering mode matrix (rendering-modes.md), and Server Islands patterns (rendering-modes.md)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 complete: all 3 foundation reference files written (project-structure.md, rendering-modes.md, cloudflare-platform.md)
- Ready for Phase 3 (Core Domain References) which depends on Phase 2
- No blockers or concerns

---
*Phase: 02-foundation-references*
*Completed: 2026-02-03*
