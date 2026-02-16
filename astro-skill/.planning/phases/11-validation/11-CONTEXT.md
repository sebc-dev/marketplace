# Phase 11: Validation - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify that all v0.2 changes (Phases 8-10) work correctly together and that v0.1 functionality is preserved. This phase produces validation reports and finalizes the v0.2 milestone. No new content is created — only verification and documentation of results.

</domain>

<decisions>
## Implementation Decisions

### Routing test scenarios
- Claude selects representative questions for each of the 5 routing categories (pure Astro, pure Cloudflare, intersection, out of scope, ambiguous)
- Two-phase validation: documentary verification (exhaustive) + targeted E2E MCP calls (high-risk cases only)
- E2E tests limited to cases where bad routing produces broken code: breaking changes, incorrect configs, ambiguous decisions
- MCP responses stored as reference fixtures for future regression detection

### Report format
- Separate files per validation aspect (routing-validation.md, regression-check.md, mcp-fixtures.md)
- Full detail per test: query used, expected result, actual result, verdict, notes
- Summary matrix table at top of each file with all tests and status
- Files stored in `.planning/phases/11-validation/`

### Non-regression strategy (v0.1)
- Claude identifies critical grep patterns from existing code (no predefined list)
- Full scan of all skill files, not just files modified by v0.2
- Astro MCP integration verified via git diff only (no functional MCP call) — confirm zero changes to search_astro_docs sections
- v0.1 files not touched by v0.2 confirmed identical (no re-verification of v0.1 integration criteria)

### Pass/fail criteria
- Zero tolerance: every test must pass, no acceptable failures
- Run all tests before reporting (don't stop at first failure) — report all results, then fix
- Callout format consistency verified via automated grep pattern (blockquote + query string format)
- Phase includes milestone finalization: STATE.md update + milestone complete signal on success

### Claude's Discretion
- Selection of specific test queries for each routing scenario
- Exact grep patterns for v0.1 regression detection
- How to structure the git diff for Astro MCP verification
- Number of E2E MCP calls (within "high-risk cases only" constraint)

</decisions>

<specifics>
## Specific Ideas

- User proposed a structured three-phase validation workflow: (1) documentary routing check via matrix, (2) targeted E2E on high-risk cases, (3) fixture storage for future regression
- "Test E2E quand la consequence d'un mauvais routage est du code casse" — the one-way door heuristic for deciding what gets a real MCP call
- MCP fixtures should document not just pass/fail but what the tool does NOT return (gaps that skill references must cover)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-validation*
*Context gathered: 2026-02-04*
