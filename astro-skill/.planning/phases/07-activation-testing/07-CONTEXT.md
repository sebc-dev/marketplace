# Phase 7: Activation Testing and Validation - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate end-to-end that the Astro/Cloudflare skill works correctly: auto-activation triggers on the right prompts, Claude navigates to correct reference files, MCP integration functions properly, and critical rules survive long sessions. Fix any failures found during testing.

</domain>

<decisions>
## Implementation Decisions

### Activation scenarios
- Test both technical prompts ("create an Astro component", "configure wrangler for D1") and conversational prompts ("my Astro site doesn't deploy", "problem with Cloudflare Pages")
- Negative tests cover: neighboring frameworks (Next.js, Nuxt, SvelteKit, Remix), Cloudflare-only prompts without Astro, generic questions ("help with CSS")
- Minimum coverage: 5 positive prompts, 3 negative prompts (per roadmap requirements)
- Delivery format: structured checklist with pre-written prompts, expected results, and pass/fail columns

### Reference navigation
- Precision level: correct file (not section-level) — question about hydration must reach components-islands.md
- Coverage: all 11 reference files must have at least one test question
- Claude generates realistic test questions per domain (based on actual file content)
- MCP boundary testing: verify both actual `search_astro_docs` calls (for API details not in skill) AND decision logic (skill for decisions/anti-patterns, MCP for API ref/config)

### Session resilience
- Method: real long conversation — pose 10-15 varied questions before testing critical rule retention
- Critical rules to verify after long session: Astro 5 breaking changes (content.config.ts path, slug to id, render() API, type:'content' to loader, ViewTransitions to ClientRouter) AND Cloudflare constraints (no Sharp, no process.env, nodejs_compat, Workers limits)
- Success threshold: 80%+ of critical rules retained (with identification of any lost rules)

### Results format
- Checklist + notes: pass/fail table with explanatory notes for failures or unexpected results
- Storage: `.planning/phases/07-activation-testing/07-VALIDATION.md`
- On failure: correct immediately, re-test, then continue (not just document)
- Go/no-go criteria: activation + breaking changes must pass (critical), navigation/MCP can have minor reserves

### Claude's Discretion
- Exact wording of test prompts (both positive and negative)
- Order of test execution
- How to structure the "noise" conversation before resilience testing
- Whether to split validation into multiple plans or execute as one

</decisions>

<specifics>
## Specific Ideas

- Checklist should be reusable — someone could re-run these tests after future skill updates
- Negative activation tests should include prompts that mention "Astro" in non-framework contexts (astronomy) to test specificity
- Resilience test should mix Astro and non-Astro questions in the "noise" section to simulate real usage

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-activation-testing*
*Context gathered: 2026-02-03*
