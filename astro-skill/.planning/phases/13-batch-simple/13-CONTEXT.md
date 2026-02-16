# Phase 13: Batch Simple - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply the validated XML container pattern (from Phase 12 pilot) to the 5 simpler reference files: `rendering-modes.md`, `project-structure.md`, `components-islands.md`, `seo-i18n.md`, `typescript-testing.md`. Zero content changes — only XML tag lines added. Each file follows XML-CONVENTIONS.md exactly.

</domain>

<decisions>
## Implementation Decisions

### Batch strategy
- **5 plans, 1 per file** — each file gets its own dedicated plan
- **Validation after each file** — full validation (grep patterns + diff + overhead) completes before moving to next file
- **1 commit per file** — each file validated and committed independently
- **Parallel execution** — plans are independent and can run in parallel when possible
- **On failure: corriger et continuer** — fix the problematic file, re-validate, then proceed to next

### Nesting approach
- **Flat by default** — same approach as the pilot, no nesting unless justified
- **Nesting allowed automatically** — if a subsection clearly passes the independent queryability test, Claude nests without asking (1 level max per conventions)
- **Soft threshold ~10 tags** — above ~10 tags per file, verify there's no over-tagging
- **### without parent ## treated as ##** — orphan ### sections receive their own top-level tags

### Tag overhead threshold
- **Claude's Discretion** — 5% remains the baseline, but Claude can adapt if a very short file has mechanically higher relative overhead (the spirit of the rule matters more than the number)

### Processing order
- **By ascending complexity** — Claude analyzes the 5 files and orders them from simplest structure to most complex
- **All 5 stay in Phase 13** — even if a file is more complex than expected, it gets treated here (no deferral to Phase 14)

### Structural edge cases
- **Universal tags only when content exists** — if a file has no troubleshooting section, no `<troubleshooting>` tag is added (convention confirmed)
- **Short sections: queryability test, not size** — a 3-line config section that's independently useful gets a tag; a 20-line intro that's not queryable alone may not. The test is "Could Claude need this section by itself?" not "Is it long enough?"
- **No recap documentation needed** — tags are visible in the files themselves, no supplementary table required

### Claude's Discretion
- Exact ordering of the 5 files by complexity
- Domain-specific tag names for each file (derived from ## headers per conventions)
- Whether to nest a specific subsection (applying the queryability test)
- Overhead threshold adaptation for very short files

</decisions>

<specifics>
## Specific Ideas

- The queryability test ("Could Claude need this section by itself?") is the single decision criterion for both tagging short sections and nesting subsections — size is irrelevant
- If a section is so short it seems to lack standalone value, the real question is whether it should be merged with its neighbor — that's a structure problem, not a tagging problem (but Phase 13 doesn't restructure content, only adds tags)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-batch-simple*
*Context gathered: 2026-02-04*
