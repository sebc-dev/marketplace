# Phase 9: SKILL.md Three-Way Routing - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand SKILL.md's MCP Integration section with dual-MCP coordination: a routing table that maps question domains to the correct source (Astro MCP, Cloudflare MCP, or skill references), plus usage instructions for the Cloudflare MCP tool. No changes to content outside the MCP Integration section. No new capabilities beyond routing guidance.

</domain>

<decisions>
## Implementation Decisions

### Routing table format
- Markdown table with columns: Domain/Product | Source | Example question
- One row per product/domain (Astro components, Cloudflare Workers, KV, D1, R2, Astro-on-CF integration, etc.)
- One example question per row (not more) to keep compact
- Excluded products (Zaraz, Magic Transit, etc.) listed as a note below the table, not in the table itself

### Routing table placement
- Table placed BEFORE the individual MCP tool instructions (top-down: routing first, then details)
- Within the existing MCP Integration section

### Cloudflare MCP instructions
- Mirror the existing Astro MCP instruction structure (same format, same style)
- Pattern generique + 2-3 examples: generic pattern is "[Product] [specific action]", with concrete examples
- Allowlist: Workers, KV, D1, R2 only (the 4 empirically verified in Phase 8)
- Include a caveats sub-section documenting known quirks (empty titles, doubled URL prefixes) from Phase 8 findings

### Cas limites & fallback
- Integration questions (e.g., "use KV in Astro endpoint"): skill references have priority, Cloudflare MCP as complement for detailed API info
- Explicit fallback chain documented: try primary source first, then fallback source if insufficient
- Ambiguous questions default to skill references (safe default)
- One MCP tool per question, not both — routing designates the most pertinent single source to avoid contradictions

### Budget & placement constraints
- All changes confined to MCP Integration section only — zero modifications to v0.1 content elsewhere
- Budget: +30 lines max (SKILL.md currently 237, target max 267, hard limit 280)
- If budget is tight, reduce examples first (keep routing table and caveats)
- Do not condense or reorganize existing v0.1 sections

### Claude's Discretion
- Exact wording of routing table rows
- How to phrase the fallback chain concisely
- Whether caveats need their own sub-heading or fit as a note
- Exact number of query template examples (2-3 range)

</decisions>

<specifics>
## Specific Ideas

- Mirror Astro MCP structure for consistency — user wants both MCP entries to "look the same"
- Phase 8 findings feed directly: hybrid queries (product name + natural language) outperform pure keywords — templates should reflect this
- Caveats section should mention: empty `<title>` fields (extract from `<text>` heading), doubled URL prefixes (strip first prefix)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-skill-three-way-routing*
*Context gathered: 2026-02-04*
