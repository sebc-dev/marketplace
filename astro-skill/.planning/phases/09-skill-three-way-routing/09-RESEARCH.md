# Phase 9: SKILL.md Three-Way Routing - Research

**Researched:** 2026-02-04
**Domain:** SKILL.md content editing -- routing table, Cloudflare MCP instructions, and line budget management
**Confidence:** HIGH

## Summary

This phase edits a single file (`.claude/skills/astro-cloudflare/SKILL.md`) in a single section (MCP Integration, lines 82-99). The work is pure Markdown authoring constrained by a strict line budget (+30 lines, hard limit 280 body lines). All input data exists in the Phase 8 verification report (`08-VERIFICATION.md`), the current SKILL.md, and the CONTEXT.md decisions.

The technical challenge is not complexity but compression: fitting a routing table (8+ rows), Cloudflare MCP tool entry (mirroring the Astro MCP format), query templates (2-3 examples), a caveats note, an exclusions note, and a fallback chain into 30 lines of Markdown. Every line must earn its place.

No libraries, no code, no configuration changes. This is a content authoring phase with precise constraints.

**Primary recommendation:** Draft the content bottom-up: write the routing table first (highest value per line), then the Cloudflare MCP tool entry, then caveats, and cut examples if budget is tight. Use the existing Astro MCP entry (lines 84-98) as the structural template for the Cloudflare entry.

## Standard Stack

No libraries or tools needed. This is a Markdown editing task.

### Tools Used

| Tool | Purpose | Why |
|------|---------|-----|
| Text editor | Edit SKILL.md | Only tool needed -- Markdown authoring |

### Source Materials (Already Available)

| Source | Location | What It Provides |
|--------|----------|------------------|
| Phase 8 VERIFICATION.md | `.planning/phases/08-mcp-tool-verification/08-VERIFICATION.md` | Confirmed tool name, query templates, precision profile, caveats |
| Current SKILL.md | `.claude/skills/astro-cloudflare/SKILL.md` | Existing Astro MCP entry to mirror, line count baseline |
| Phase 9 CONTEXT.md | `.planning/phases/09-skill-three-way-routing/09-CONTEXT.md` | Locked user decisions on format, placement, budget |

### No Installation Needed

This phase creates no new files and installs no packages. It edits an existing Markdown file.

## Architecture Patterns

### Current MCP Integration Section Structure (Lines 82-99)

```
82  ## MCP Integration                          <- section heading
83  (blank)
84  **Tool:** `mcp__astro_doc__search_astro_docs`
85  (blank)
86  **Use MCP when you need:**
87  - Exact API signatures (e.g., ...)
88  - Config option exhaustive lists (e.g., ...)
89  - Migration guide details beyond the 10 Critical Rules above
90  - Integration setup steps (e.g., ...)
91  - Version-specific changelogs and release notes
92  (blank)
93  **Use THIS SKILL when you need:**
94  - Architecture decisions (rendering mode, ...)
95  - Anti-patterns and Astro 5.x breaking change prevention
96  - Cloudflare-specific patterns (bindings, ...)
97  - Grep navigation to reference file sections (see below)
98  - Troubleshooting symptoms and fixes for Astro-on-Cloudflare errors
99  (blank)
100 ## Reference Navigation                     <- next section (DO NOT TOUCH)
```

**Current section size:** 18 lines (82-99 inclusive)
**Current SKILL.md body:** 238 lines (after YAML frontmatter)
**Budget:** +30 lines = 268 target, 280 hard limit
**New section target size:** 18 + 30 = 48 lines maximum

### Target Section Structure (After Phase 9)

The new MCP Integration section must contain these elements in this order (per CONTEXT.md decisions):

```
## MCP Integration

### Source Routing                              <- NEW: routing table
[table: Domain/Product | Source | Example question]
[exclusions note below table]

### Astro Docs MCP                              <- EXISTING content reformatted under sub-heading
**Tool:** `mcp__astro_doc__search_astro_docs`
[existing "Use MCP when" list -- UNCHANGED]

### Cloudflare Docs MCP                         <- NEW: mirrors Astro entry
**Tool:** `mcp__cloudflare__search_cloudflare_documentation`
[use when list]
[allowlist: Workers, KV, D1, R2]
[query pattern + 2-3 examples]
[caveats note]

**Use THIS SKILL when you need:**               <- EXISTING "use skill" content -- UNCHANGED
[existing list -- UNCHANGED]
```

### Pattern: Routing Table (Locked Decision)

Columns: Domain/Product | Source | Example question

Rows to include (from CONTEXT.md decisions):

| Domain/Product | Source | Rationale |
|----------------|--------|-----------|
| Astro components, routing, config | Astro MCP | Pure Astro framework questions |
| Astro Content Layer, Actions | Astro MCP | Pure Astro API reference |
| Cloudflare Workers runtime | Cloudflare MCP | Workers API, limits, compat flags |
| Workers KV | Cloudflare MCP | KV put/get/delete/list API |
| D1 database | Cloudflare MCP | D1 prepare/bind/batch API |
| R2 object storage | Cloudflare MCP | R2 put/get/list API |
| Astro-on-Cloudflare integration | Skill references | Bindings access via `locals.runtime.env`, adapter config, platform patterns |
| Troubleshooting & anti-patterns | Skill references | Skill has curated error-to-fix mappings |

**Line cost estimate:** 1 heading + 1 header row + 1 separator + 8 data rows + 1 blank + 1 exclusion note = 13 lines

### Pattern: Cloudflare MCP Entry (Mirrors Astro Entry)

Structure to mirror from existing Astro entry (lines 84-98):

```markdown
**Tool:** `mcp__cloudflare__search_cloudflare_documentation`

**Scope:** Workers, KV, D1, R2 only. Query pattern: `"[Product] [specific action]"`
- `"Workers KV namespace put method API parameters"`
- `"Cloudflare D1 database prepare bind SQL API"`
- `"Cloudflare R2 object storage put get Workers API"`

> **Caveats:** Results have empty `<title>` (extract from `<text>` heading). URLs have doubled prefix (strip first `https://developers.cloudflare.com/`).
```

**Line cost estimate:** 1 tool line + 1 blank + 1 scope line + 3 example lines + 1 blank + 1 caveat note = 8 lines

### Pattern: Fallback Chain (Locked Decision)

Per CONTEXT.md: one MCP tool per question, skill references as safe default for ambiguous questions. The fallback chain should be concise -- one or two lines:

```markdown
**Fallback:** Try primary source first. If insufficient, try fallback. Ambiguous questions default to skill references.
```

This can be integrated into the routing table as a note or a brief line after the table.

**Line cost estimate:** 1 line

### Anti-Patterns to Avoid

- **Modifying lines 1-81 or 100-257:** Phase boundary is MCP Integration section only. Zero changes to Critical Rules, Decision Matrices, Reference Navigation, or Troubleshooting Index.
- **Removing existing content to make room:** The existing Astro MCP instructions (lines 84-98) must remain intact in meaning, even if reformatted under a sub-heading.
- **Adding both MCP tools as fallback for a single query:** CONTEXT.md explicitly says "one MCP tool per question, not both."
- **Including excluded Cloudflare products in routing table:** Only Workers, KV, D1, R2. Zaraz, Magic Transit, Zero Trust, etc. are out of scope -- mentioned only as an exclusion note.
- **Breaking the 280-line hard limit:** If content exceeds budget, cut examples first (per CONTEXT.md priority).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Query template wording | Invent new query patterns | Copy/adapt from 08-VERIFICATION.md Section 4 | Empirically tested, precision-rated |
| Cloudflare MCP tool spec | Research from scratch | Copy from 08-VERIFICATION.md Section 1 | Already verified with 6 live calls |
| Caveat documentation | Guess at quirks | Copy from 08-VERIFICATION.md observations | Empirical findings, not assumptions |
| Routing table domain categorization | Arbitrary split | Use the three-way split from ROADMAP success criteria | Matches requirement MCP-02 exactly |

**Key insight:** Phase 8 did all the research. Phase 9 is assembly, not investigation. Every piece of content has a verified source.

## Common Pitfalls

### Pitfall 1: Exceeding the Line Budget
**What goes wrong:** Adding all desired content and exceeding 280 body lines.
**Why it happens:** The routing table (13 lines) + Cloudflare MCP entry (8 lines) + restructuring overhead (sub-headings, blanks) can easily consume 25-30 lines.
**How to avoid:** Draft content first, count lines, then compress. Priority order for cuts: (1) reduce examples from 3 to 2, (2) merge exclusion note into table caption, (3) inline caveats instead of separate block.
**Warning signs:** Total body lines approaching 270+.

### Pitfall 2: Breaking Existing Astro MCP Content
**What goes wrong:** Editing the "Use MCP when you need" list or changing the Astro MCP tool name.
**Why it happens:** Reformatting the section to add sub-headings may accidentally alter existing content.
**How to avoid:** Use the existing lines 84-98 verbatim. Only add a sub-heading above them. Verify after editing that a diff shows no changes to the Astro MCP bullet points.
**Warning signs:** `git diff` showing modifications to lines 86-98.

### Pitfall 3: Ambiguous Routing for Integration Questions
**What goes wrong:** The routing table sends "use KV in Astro endpoint" to Cloudflare MCP, which returns KV API docs without Astro context.
**Why it happens:** Integration questions span both domains.
**How to avoid:** Route integration questions to skill references (which contain the Astro-specific patterns) and note Cloudflare MCP as complement for API detail lookup. Per CONTEXT.md: "skill references have priority, Cloudflare MCP as complement."
**Warning signs:** Routing table rows for integration topics pointing to an MCP tool instead of skill references.

### Pitfall 4: Inconsistent Formatting Between MCP Entries
**What goes wrong:** The Cloudflare MCP entry uses a different structure than the Astro MCP entry.
**Why it happens:** Adding new elements (allowlist, caveats) that the Astro entry does not have.
**How to avoid:** Mirror the Astro entry structure exactly for the common parts (tool name, "use when" list). Add Cloudflare-specific elements (allowlist, caveats, query templates) as supplementary content after the mirrored structure.
**Warning signs:** Visual scanning of the two entries shows different formatting patterns.

### Pitfall 5: Routing Table Rows Too Verbose
**What goes wrong:** Example questions in the routing table are full sentences that bloat the table width.
**Why it happens:** Trying to be too descriptive in the example column.
**How to avoid:** Keep example questions to 6-8 words max. Use technical shorthand: "defineAction options" not "How do I configure Astro Actions with defineAction?"
**Warning signs:** Table rows wrapping in editor or exceeding 100 characters.

## Code Examples

### Example 1: Routing Table Draft

Source: Synthesized from CONTEXT.md decisions + Phase 8 precision profile + ROADMAP success criteria.

```markdown
### Source Routing

| Domain | Source | Example |
|--------|--------|---------|
| Astro components, routing, config | Astro MCP | `getCollection` overloads |
| Astro Actions, Content Layer API | Astro MCP | `defineAction` options |
| Workers runtime, limits, compat | Cloudflare MCP | Workers fetch handler params |
| KV binding API | Cloudflare MCP | KV put expiration options |
| D1 binding API | Cloudflare MCP | D1 prepare bind batch |
| R2 binding API | Cloudflare MCP | R2 put get list objects |
| Astro-on-Cloudflare patterns | Skill references | bindings via `locals.runtime.env` |
| Troubleshooting, anti-patterns | Skill references | build fails on Cloudflare |

> **Excluded CF products:** Zaraz, Magic Transit, Zero Trust, CDN, DNS, AI -- out of scope.
> **Fallback:** Primary source first, then fallback. Ambiguous questions default to skill references.
```

**Line count:** 14 lines (1 heading + 1 blank + 1 header + 1 separator + 8 rows + 1 blank + 2 note lines)

### Example 2: Cloudflare MCP Entry Draft

Source: 08-VERIFICATION.md tool spec + CONTEXT.md mirroring decision.

```markdown
### Cloudflare Docs MCP

**Tool:** `mcp__cloudflare__search_cloudflare_documentation`

**Scope:** Workers, KV, D1, R2 only. Query pattern: `"[Product] [specific action]"`
- `"Workers KV namespace put method API parameters"`
- `"Cloudflare D1 database prepare bind SQL API"`

> **Caveats:** Titles empty (extract from `<text>` heading). URLs doubled (strip first `https://developers.cloudflare.com/` prefix).
```

**Line count:** 8 lines (1 heading + 1 blank + 1 tool + 1 blank + 1 scope + 2 examples + 1 blank + 1 caveat)

Wait -- that is 9. Let me recount without trailing blank:

1. `### Cloudflare Docs MCP`
2. (blank)
3. `**Tool:** ...`
4. (blank)
5. `**Scope:** ...`
6. `- example 1`
7. `- example 2`
8. (blank)
9. `> **Caveats:** ...`

**Line count:** 9 lines

### Example 3: Restructured Astro Entry (Sub-heading Added)

Source: Current SKILL.md lines 84-98, reformatted under sub-heading.

```markdown
### Astro Docs MCP

**Tool:** `mcp__astro_doc__search_astro_docs`

**Use MCP when you need:**
- Exact API signatures (e.g., `defineAction` options, `getCollection` overloads)
- Config option exhaustive lists (e.g., all `astro.config.mjs` fields)
- Migration guide details beyond the 10 Critical Rules above
- Integration setup steps (e.g., `@astrojs/react` config options)
- Version-specific changelogs and release notes
```

**Line count:** 11 lines (1 heading + 1 blank + 1 tool + 1 blank + 1 "use when" heading + 5 bullets + 1 trailing blank)

This is the same as existing lines 84-91 with 1 extra line for the sub-heading. Net cost: +1 line for restructuring.

### Example 4: Complete Section Assembly -- Line Budget Check

```
Section heading:     1 line   (## MCP Integration)
Blank:               1 line
Routing sub-heading: 14 lines (table + notes)
Blank:               1 line
Astro entry:         11 lines (sub-heading + existing content)
Cloudflare entry:    9 lines  (sub-heading + tool + scope + examples + caveat)
Use THIS SKILL:      8 lines  (existing "Use THIS SKILL" block, lines 93-98)
Trailing blank:      1 line
---
TOTAL:              46 lines
```

Current section: 18 lines. New section: 46 lines. Delta: +28 lines.

**Verdict:** Fits within +30 budget (268 body lines). Has 2 lines of margin to the target and 12 lines to the hard limit.

**If tight:** Drop one query template example (save 1 line), or merge the two note lines after the routing table into one (save 1 line).

## State of the Art

| Aspect | Current State | After Phase 9 | Impact |
|--------|--------------|---------------|--------|
| MCP Integration section | Single Astro MCP entry, 18 lines | Dual MCP entries + routing table, ~46 lines | Claude knows which tool to use for each domain |
| Cloudflare MCP presence | Not mentioned in SKILL.md | Full tool entry with scope, examples, caveats | MCP-01 satisfied |
| Routing guidance | None -- Claude guesses which source | Explicit routing table with 8 domains | MCP-02, MCP-04 satisfied |
| Product scope | Implicit | Explicit allowlist (Workers, KV, D1, R2) + exclusions | MCP-03 satisfied |
| Query guidance | None | 2-3 scoped templates with empirical backing | MCP-05 satisfied |

## Open Questions

### 1. Sub-heading Level for MCP Entries
- **What we know:** CONTEXT.md says "mirror the existing Astro MCP instruction structure." The routing table placement is "BEFORE the individual MCP tool instructions."
- **What's unclear:** Whether to use `###` sub-headings (Source Routing, Astro Docs MCP, Cloudflare Docs MCP) or bold text headers. The current Astro entry uses bold (`**Tool:**`) without a sub-heading.
- **Recommendation:** Use `###` sub-headings for all three sub-sections. This provides visual structure, makes grep navigation possible, and costs only 3 extra lines. The budget can absorb it (+28 vs +30 budget).
- **Confidence:** MEDIUM -- this is Claude's discretion per CONTEXT.md.

### 2. Exact Wording of "Use THIS SKILL" Block
- **What we know:** The existing block (lines 93-98) lists 5 bullet points including "Cloudflare-specific patterns." After Phase 9, the routing table also addresses Cloudflare patterns.
- **What's unclear:** Whether the "Use THIS SKILL" block needs minor wording updates to avoid seeming redundant with the routing table.
- **Recommendation:** Keep it unchanged. The routing table answers "which tool?" while "Use THIS SKILL" answers "when to prefer skill over ANY MCP." They serve different purposes. Changing it risks breaking v0.1 content (Phase boundary: zero modifications to v0.1 content).
- **Confidence:** HIGH -- CONTEXT.md says "do not condense or reorganize existing v0.1 sections."

### 3. Whether 2 or 3 Query Template Examples
- **What we know:** CONTEXT.md says "2-3 examples." Budget is tight (+28 of +30).
- **What's unclear:** Whether 3 examples are worth the extra line.
- **Recommendation:** Use 2 examples (KV and D1 -- both HIGH precision from Phase 8). This saves 1 line of margin. R2 has only MEDIUM precision and would need a more complex query pattern that might confuse. Two strong examples are better than two strong + one weak.
- **Confidence:** MEDIUM -- this is Claude's discretion per CONTEXT.md.

## Sources

### Primary (HIGH confidence)
- **Phase 8 VERIFICATION.md** -- `.planning/phases/08-mcp-tool-verification/08-VERIFICATION.md` -- tool spec, query templates, precision profile, caveats (344 lines, empirically verified)
- **Current SKILL.md** -- `.claude/skills/astro-cloudflare/SKILL.md` -- existing MCP Integration section structure and content (257 lines)
- **Phase 9 CONTEXT.md** -- `.planning/phases/09-skill-three-way-routing/09-CONTEXT.md` -- all locked user decisions
- **ROADMAP.md** -- `.planning/ROADMAP.md` -- success criteria for Phase 9
- **REQUIREMENTS.md** -- `.planning/REQUIREMENTS.md` -- MCP-01 through MCP-05 requirement definitions

### Secondary (MEDIUM confidence)
- **Phase 8 RESEARCH.md** -- `.planning/phases/08-mcp-tool-verification/08-RESEARCH.md` -- background on Cloudflare MCP server architecture
- **Phase 8 SUMMARY.md** -- `.planning/phases/08-mcp-tool-verification/08-01-SUMMARY.md` -- decisions and patterns established

### Tertiary (LOW confidence)
- None -- all findings derived from project-internal verified documents

## Metadata

**Confidence breakdown:**
- Content structure: HIGH -- derived directly from CONTEXT.md locked decisions and existing SKILL.md structure
- Line budget feasibility: HIGH -- arithmetic verified against actual file (238 body lines + 28 delta = 266, under 268 target and 280 hard limit)
- Query templates: HIGH -- copied from Phase 8 empirical data, not invented
- Routing table categorization: HIGH -- maps directly to ROADMAP success criteria and REQUIREMENTS.md MCP-02
- Pitfalls: HIGH -- derived from concrete constraints (budget, phase boundary, formatting consistency)

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days -- content editing, no external dependencies that could change)
