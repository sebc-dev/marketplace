# Phase 10: Reference File Integration - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Add MCP Cloudflare callouts to 4 reference files and the debug slash command. The callouts direct Claude to Cloudflare MCP at specific boundaries where the skill provides integration patterns but Cloudflare docs have exhaustive API details. No new reference files created, no SKILL.md body changes (14-line margin reserved for Phase 11).

</domain>

<decisions>
## Implementation Decisions

### Callout format
- Blockquote simple with `>` prefix — consistent with Phase 9 style in SKILL.md
- 1-2 lines per callout: tool name + contextual query template
- Each callout includes a query template specific to the section context (e.g., `"Workers KV put API"` in the KV section)
- No caveats repeated in callouts — SKILL.md is the single source for caveats (empty titles, doubled URLs)

### Callout placement
- One callout per relevant section (not one per file) — targeted to sections where Cloudflare docs complement the skill
- Placed AFTER the skill's integration pattern — the skill gives the pattern first, then the callout says "for the complete API, consult..."
- Quick Reference sections at top of files: no callouts — callouts go in detailed sections below
- Only in sections where Cloudflare docs genuinely add value — no forced callouts in sections without clear Cloudflare boundary (e.g., Astro Actions Security stays callout-free)

### Debug command integration
- Replace the current fallback block with a mini-routing: if Astro error → Astro MCP, if Workers/KV/D1/R2 error → Cloudflare MCP
- Add 4-6 Cloudflare symptom entries in the debug routing table (Step 2), covering both runtime errors (CPU limit, KV not bound) and wrangler/deploy errors (compatibility_date, node_compat)
- Existing Astro MCP fallback preserved but restructured into the routing logic

### Claude's Discretion
- Exact query template wording per callout (must follow hybrid pattern: product name + specific action)
- Which specific sections in each reference file warrant a callout vs which don't
- Exact Cloudflare symptom entries for the debug routing table (within the 4-6 range, covering both runtime and wrangler/deploy)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following the Phase 9 format precedent.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-reference-file-integration*
*Context gathered: 2026-02-04*
