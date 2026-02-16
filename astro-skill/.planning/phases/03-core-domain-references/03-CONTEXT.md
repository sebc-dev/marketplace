# Phase 3: Core Domain References - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Feature-level reference files for Astro components/islands, routing/navigation, data/content, and styling/performance. Each file gives Claude the knowledge to generate correct code in that domain on Cloudflare Workers. Creating these 4 reference files — not modifying SKILL.md or adding new capabilities.

</domain>

<decisions>
## Implementation Decisions

### File structure
- Quick Reference at top of every file: numbered imperative rules (same pattern as Phase 2)
- Target ~300 lines per file — be selective on content to stay compact
- Troubleshooting table at end of each file (not distributed inline)
- 4 plans: one per reference file (components-islands, routing-navigation, data-content, styling-performance)

### Content format
- ~50% tables + ~50% code examples — minimal narrative prose
- Decision matrices in markdown table format: Scenario | Choice | Why (consistent with Phase 2)
- Quick Reference rules in imperative direct tone: "Use client:visible for below-fold components"
- Code examples show correct pattern only by default; anti-pattern (DO/DON'T contrast) only when the pitfall is counter-intuitive or frequent

### Pattern coverage
- Hydration directives: decision tree format (scenario → recommended directive), not individual documentation
- Anti-patterns with confidence tags (CRITICAL/HIGH/MEDIUM), same system as Phase 2
- Middleware: basics (signature, sequence, simple redirects) in routing-navigation; auth/CSP middleware in Phase 4 security-advanced.md
- Astro Actions: decision matrix Actions vs API routes + basic signature in data-content; advanced security (CSRF, validation details) in Phase 4

### Troubleshooting
- 3-column tables: Symptom | Cause | Fix (same as Phase 2)
- Cover both Astro-generic errors AND Cloudflare-specific errors per domain
- Number of entries per file: Claude's discretion (adjust by domain density)
- Astro 5 breaking changes: brief mention in relevant file + cross-reference to SKILL.md (Phase 5) for full details — no full duplication

### Claude's Discretion
- Exact number of troubleshooting entries per file
- How to handle photos with no EXIF data patterns within the ~300 line budget
- Internal section ordering within each file (after Quick Reference, before Troubleshooting)
- Which specific code examples to include vs omit given the size constraint

</decisions>

<specifics>
## Specific Ideas

- Phase 2 established the patterns: Quick Reference numbered rules, decision matrices as tables, anti-patterns with confidence tags, troubleshooting at end — Phase 3 continues all of these
- Tables are the primary prose replacement — use them for decisions, comparisons, directive choices, pattern selection
- "50% tables + 50% code" is the content formula — not 50% narrative text

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-core-domain-references*
*Context gathered: 2026-02-03*
