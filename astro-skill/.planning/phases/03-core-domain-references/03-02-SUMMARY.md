---
phase: 03-core-domain-references
plan: 02
subsystem: references
tags: [routing, middleware, clientrouter, redirects, catch-all, cloudflare-workers, astro-5]

# Dependency graph
requires:
  - phase: 02-foundation-references
    provides: Reference file format (Quick Reference, Decision Matrix, Anti-patterns, Troubleshooting pattern)
provides:
  - routing-navigation.md reference covering file-based routing, dynamic routes, ClientRouter, middleware, redirects, catch-all patterns on Cloudflare
affects:
  - 04-secondary-references (security-advanced.md builds on middleware basics documented here)
  - 05-skill-synthesis (SKILL.md synthesizes routing patterns from this reference)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Redirect Method Selection table for Cloudflare-specific redirect routing"
    - "Cloudflare route configuration with routes.extend pattern"
    - "Dynamic routes with getStaticPaths + pagination patterns"

key-files:
  created: []
  modified:
    - .claude/skills/astro-cloudflare/references/routing-navigation.md

key-decisions:
  - "Included redirect method selection table (6 methods) as distinct section -- high value for Cloudflare-specific redirect routing confusion"
  - "Added getStaticPaths + pagination code patterns to reach line target while providing high-value content"
  - "Kept middleware authCheck as basic redirect example (not auth implementation) to stay within Phase 3 scope"

patterns-established:
  - "Anti-patterns table with CRITICAL/HIGH/MEDIUM severity tags (continued from Phase 2)"
  - "Cloudflare files interaction table (generated/manual, purpose, limitations)"

# Metrics
duration: 2min
completed: 2026-02-03
---

# Phase 3 Plan 2: Routing & Navigation Reference Summary

**Routing and navigation reference with 12 imperative rules, Astro 5.x breaking changes (param decoding, paginate base, hybrid removal), ClientRouter, middleware with runtime.env guard, catch-all route guards, and Cloudflare-specific troubleshooting**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-03T13:59:59Z
- **Completed:** 2026-02-03T14:02:19Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- 273-line routing-navigation.md covering all Astro 5.x routing breaking changes
- 12-rule Quick Reference with imperative tone matching Phase 2 format
- 10-scenario Routing Strategy Decision Matrix with Cloudflare reasoning
- 6-method Redirect Method Selection table for Cloudflare-specific redirect confusion
- Middleware pattern with runtime.env guard and sequence() chaining
- Catch-all route guard excluding _server-islands, _astro, _actions reserved paths
- REST API endpoint pattern with D1 binding and ALL method fallback
- ClientRouter documented (replaces deprecated ViewTransitions)
- 12-row anti-patterns table with CRITICAL/HIGH/MEDIUM severity
- 10-row troubleshooting table with Cloudflare-specific entries

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Write and verify routing-navigation.md** - `735ce26` (feat)

## Files Created/Modified
- `.claude/skills/astro-cloudflare/references/routing-navigation.md` - Complete routing and navigation reference for Astro 5.x on Cloudflare Workers

## Decisions Made
- Included redirect method selection table (6 methods) as distinct section -- high value for resolving Cloudflare-specific redirect confusion (_redirects vs config vs code)
- Added getStaticPaths + pagination code patterns to reach 250+ line target while providing high-value reference content
- Kept middleware authCheck as basic redirect example (not auth implementation) to respect Phase 4 boundary
- Included Cloudflare route configuration section with routes.extend and files interaction table

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Routing reference complete, ready for remaining Phase 3 files (data-content.md, styling-performance.md)
- Middleware basics documented here; Phase 4 security-advanced.md can build on this foundation
- No blockers

---
*Phase: 03-core-domain-references*
*Completed: 2026-02-03*
