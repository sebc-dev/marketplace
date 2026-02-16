# Architecture: Cloudflare MCP Documentation Integration (v0.2)

**Domain:** Integrating `search_cloudflare_documentation` into existing Astro/Cloudflare Claude Code Skill
**Researched:** 2026-02-03
**Overall confidence:** HIGH for integration patterns (based on proven v0.1 architecture), MEDIUM for exact MCP tool behavior (WebSearch/WebFetch unavailable -- tool name and behavior taken from PROJECT.md specification)

---

## Current Architecture (v0.1 Baseline)

The skill is a three-layer progressive disclosure system with a single MCP bridge:

```
Layer 1: SKILL.md frontmatter (always loaded, ~100 tokens)
Layer 2: SKILL.md body (loaded on trigger, 256 lines)
Layer 3: references/ (11 files, 2,895 lines total, loaded on demand)
Layer 4: MCP -- search_astro_docs only (Astro official docs)
```

**Key v0.1 MCP integration facts:**
- SKILL.md has an `## MCP Integration` section (lines 82-98, ~17 lines)
- Only `mcp__astro_doc__search_astro_docs` is referenced
- Reference files contain ZERO MCP callouts (the v0.1 ARCHITECTURE.md recommended "MCP Queries for More Detail" sections per reference file, but this was not implemented)
- The MCP boundary is defined only in SKILL.md: "Use MCP when" vs "Use THIS SKILL when"
- SKILL.md is at 256 lines (244 lines remaining to 500-line limit)
- Frontmatter description is 996 chars (28 chars remaining to 1024-char limit)

---

## Target Architecture (v0.2)

Add a second MCP tool (`search_cloudflare_documentation`) to create a **dual-MCP bridge** -- one for Astro official docs, one for Cloudflare official docs. The skill continues to own the opinionated "when/what/why" layer; both MCPs provide the raw "how/all-options" layer.

```
Layer 1: SKILL.md frontmatter (unchanged -- no room for additions)
Layer 2: SKILL.md body (modified -- expanded MCP section)
  - ## MCP Integration (renamed, expanded to cover both tools)
Layer 3: references/ (modified -- targeted MCP callouts added)
  - cloudflare-platform.md (primary: most Cloudflare MCP callouts)
  - build-deploy.md (secondary: wrangler/deploy callouts)
  - typescript-testing.md (secondary: binding types callouts)
  - security-advanced.md (minor: Workers security callouts)
Layer 4: MCP (expanded)
  +------------------------------------------+
  | mcp__astro_doc__search_astro_docs        |
  | (Astro official documentation)           |
  +------------------------------------------+
  | mcp__cloudflare__search_cloudflare_documentation |
  | (Cloudflare official documentation)      |
  +------------------------------------------+
```

**Confidence:** HIGH for the pattern (mirrors proven v0.1 MCP integration). MEDIUM for the exact MCP server name prefix (`mcp__cloudflare__` is assumed -- must be verified against actual MCP server configuration at implementation time).

---

## MCP Tool Name Convention

**CRITICAL:** The fully qualified MCP tool name follows the pattern `mcp__<server-name>__<tool-name>`.

The Astro MCP is referenced as: `mcp__astro_doc__search_astro_docs`

For Cloudflare MCP, the fully qualified name depends on the server name configured in `.claude/settings.json` or the user's MCP configuration. Likely candidates:

| Server name | Fully qualified tool name |
|-------------|---------------------------|
| `cloudflare` | `mcp__cloudflare__search_cloudflare_documentation` |
| `cloudflare_docs` | `mcp__cloudflare_docs__search_cloudflare_documentation` |
| `cloudflare-docs` | `mcp__cloudflare-docs__search_cloudflare_documentation` |

**Recommendation:** Use a placeholder pattern in the skill content and verify the exact name during Phase 1 implementation. The v0.1 approach used the literal name `mcp__astro_doc__search_astro_docs` -- the v0.2 integration must use the exact literal name too.

**Action required:** Before writing any content, the implementer must check the MCP server configuration to determine the exact fully qualified tool name. This is a Phase 1 blocker.

**Confidence:** LOW for the exact tool name. HIGH for the pattern requirement (fully qualified names are mandatory per v0.1 precedent).

---

## MCP Boundary Pattern: Dual-MCP Division of Labor

### What goes WHERE

| Information type | Source | Rationale |
|------------------|--------|-----------|
| "Which rendering mode for this use case?" | Skill (SKILL.md / references/) | Decision guidance = skill value-add |
| "What are all options for `defineAction`?" | MCP `search_astro_docs` | Astro API reference = Astro official docs |
| "What are all KV operation methods?" | MCP `search_cloudflare_documentation` | Cloudflare API reference = Cloudflare official docs |
| "Anti-pattern: don't use Sharp on Workers" | Skill (references/) | Cross-platform gotcha = skill value-add |
| "How to configure D1 bindings in wrangler.jsonc?" | Skill pattern + MCP Cloudflare for latest syntax | Skill has the opinionated pattern, MCP has exhaustive options |
| "Workers CPU/memory limits?" | Skill (cloudflare-platform.md) | Concise table = skill value-add; MCP for edge cases |
| "Durable Objects alarm API signature?" | MCP `search_cloudflare_documentation` | DO API details beyond skill scope |
| "How to set up Hyperdrive with Astro?" | Skill pattern + MCP Cloudflare | Skill has the "when", MCP has the "how" |
| "R2 presigned URL generation?" | MCP `search_cloudflare_documentation` | Raw API detail = MCP territory |
| "What Node.js APIs are supported on Workers?" | Skill (cloudflare-platform.md) for common ones, MCP for exhaustive list | Skill has curated table, MCP has complete reference |

### Boundary Rule (single sentence)

**The skill owns Astro-on-Cloudflare decisions, anti-patterns, and curated patterns. The Astro MCP owns Astro API details. The Cloudflare MCP owns Cloudflare service API details. When a topic spans both (e.g., "D1 in Astro"), the skill provides the integration pattern and delegates to the appropriate MCP for service-specific API depth.**

**Confidence:** HIGH -- directly extends the proven v0.1 boundary pattern.

---

## Files That Need Modification

### 1. SKILL.md (REQUIRED -- primary integration point)

**Current state:** 256 lines, `## MCP Integration` section at lines 82-98 (17 lines)

**Changes needed:**

1. **Rename section:** `## MCP Integration` becomes `## MCP Integration` (keep name, expand content)
2. **Add Cloudflare MCP tool entry** alongside existing Astro tool entry
3. **Expand "Use MCP when" list** to include Cloudflare-specific triggers
4. **Add "MCP tool selection" matrix** -- when to use which MCP tool

**Proposed structure for the expanded MCP section:**

```markdown
## MCP Integration

### Astro Documentation
**Tool:** `mcp__astro_doc__search_astro_docs`

Use for: Astro API signatures, config option lists, migration guides, integration setup, changelogs.

### Cloudflare Documentation
**Tool:** `mcp__<server>__search_cloudflare_documentation`

Use for: Cloudflare service APIs (KV, D1, R2, DO, Queues), wrangler CLI reference, Workers runtime APIs, Cloudflare dashboard configuration, Pages/Workers deployment options.

### MCP Tool Selection

| Question is about... | Use |
|----------------------|-----|
| Astro component/config API | search_astro_docs |
| Cloudflare service API (KV, D1, R2) | search_cloudflare_documentation |
| @astrojs/cloudflare adapter options | search_astro_docs |
| wrangler CLI commands/flags | search_cloudflare_documentation |
| Astro + Cloudflare integration pattern | THIS SKILL (references/) |
| Workers runtime limits/compatibility | THIS SKILL (cloudflare-platform.md) |

### Use THIS SKILL when you need:
- Architecture decisions (rendering mode, hydration, Actions vs API routes)
- Anti-patterns and Astro 5.x breaking change prevention
- Cloudflare-specific patterns (bindings access, Workers limits, `.dev.vars`)
- Grep navigation to reference file sections (see below)
- Troubleshooting symptoms and fixes for Astro-on-Cloudflare errors
```

**Line budget impact:** Current MCP section is 17 lines. Proposed expansion is ~25 lines. Net increase: ~8 lines. New SKILL.md total: ~264 lines. Well within 500-line limit.

**Frontmatter impact:** Current description is 996/1024 chars. The MCP tool name does NOT go in the frontmatter description (it already says "Complements mcp__astro_doc__search_astro_docs for official API reference"). Adding a second MCP reference to the description is NOT possible (only 28 chars remaining). The frontmatter description should remain unchanged. The Cloudflare MCP instructions live in the body only.

**Confidence:** HIGH -- follows v0.1 pattern exactly, with a second tool added.

### 2. cloudflare-platform.md (REQUIRED -- highest-value integration)

**Current state:** 233 lines, covers bindings, Workers limits, Node.js compat, env vars, wrangler config
**Cloudflare keyword density:** 34 matches (highest among reference files by topic relevance)

**Changes needed:**

Add MCP delegation callouts at boundaries where the reference file provides a curated pattern but the Cloudflare docs have exhaustive API details. Specific insertion points:

| Section | Callout to add | Rationale |
|---------|---------------|-----------|
| Bindings Access (line ~15) | "For complete KV/D1/R2 API methods, use `search_cloudflare_documentation` with query: 'Workers KV API' or 'D1 SQL API' or 'R2 API'" | Skill has the Astro access pattern; MCP has the full service API |
| Workers Limits (line ~67) | "For current limit values and pricing tiers, use `search_cloudflare_documentation` with query: 'Workers limits'" | Limits may change; MCP has current values |
| Node.js Compatibility (line ~78) | "For complete Node.js API compatibility status, use `search_cloudflare_documentation` with query: 'Workers Node.js compatibility'" | Skill has curated table; full list is larger |
| Config Templates / wrangler.jsonc (line ~133) | "For all wrangler.jsonc configuration options, use `search_cloudflare_documentation` with query: 'wrangler configuration'" | Skill has the Astro-optimized template; MCP has every option |

**Estimated line increase:** ~8-12 lines (4 callout blocks of 2-3 lines each)

**Format for callouts (consistent pattern):**

```markdown
> **Cloudflare docs:** For complete KV API methods, use `search_cloudflare_documentation` with query: "Workers KV API".
```

Single-line blockquote format. Compact. Visually distinct from the skill's own content. Grep-friendly with the `> **Cloudflare docs:**` prefix.

**Confidence:** HIGH -- these are clear boundaries where skill knowledge ends and raw API docs begin.

### 3. build-deploy.md (REQUIRED -- secondary integration)

**Current state:** 256 lines, covers wrangler workflow, CI/CD, deployment, debugging
**Cloudflare keyword density:** 56 matches (highest raw count, but many are Astro-Cloudflare patterns, not pure Cloudflare API)

**Changes needed:**

| Section | Callout to add | Rationale |
|---------|---------------|-----------|
| Deployment Target Decision Matrix | "For Workers vs Pages migration guide, use `search_cloudflare_documentation` with query: 'migrate Pages to Workers'" | Deployment strategy details beyond skill scope |
| Dev/Preview Workflow Matrix | "For wrangler CLI flags and options, use `search_cloudflare_documentation` with query: 'wrangler dev'" | Skill has the recommended workflow; MCP has all CLI flags |
| GitHub Actions CI/CD | "For wrangler-action configuration, use `search_cloudflare_documentation` with query: 'wrangler GitHub Actions'" | CI config options beyond the skill's template |
| Adapter Options | "For @astrojs/cloudflare adapter API, use `search_astro_docs` with query: 'cloudflare adapter'" | This is an Astro MCP callout, not Cloudflare MCP -- included here because build-deploy references adapter |

**Estimated line increase:** ~6-8 lines

**Confidence:** HIGH

### 4. typescript-testing.md (RECOMMENDED -- secondary integration)

**Current state:** 278 lines, covers TS config, env.d.ts, Vitest, Container API, binding tests
**Cloudflare keyword density:** 40 matches

**Changes needed:**

| Section | Callout to add | Rationale |
|---------|---------------|-----------|
| env.d.ts Full Pattern | "For Cloudflare binding type definitions, use `search_cloudflare_documentation` with query: 'Workers types'" | Type definitions for D1Database, KVNamespace, etc. come from Cloudflare |
| Cloudflare Bindings Test | "For @cloudflare/vitest-pool-workers configuration, use `search_cloudflare_documentation` with query: 'vitest pool workers'" | Testing framework is a Cloudflare product |

**Estimated line increase:** ~4 lines

**Confidence:** HIGH

### 5. security-advanced.md (OPTIONAL -- minor integration)

**Current state:** 341 lines, covers CSP, auth, Actions security, secrets, MDX/Markdoc
**Cloudflare keyword density:** 11 matches (lowest relevance for Cloudflare MCP)

**Changes needed:**

| Section | Callout to add | Rationale |
|---------|---------------|-----------|
| Secrets Management | "For Cloudflare secrets management and access policies, use `search_cloudflare_documentation` with query: 'Workers secrets'" | Skill covers the pattern; MCP has enterprise features |

**Estimated line increase:** ~2 lines

**Confidence:** MEDIUM -- the callout is helpful but not critical. Could be deferred.

### 6. Other reference files (NO CHANGES)

The following files do NOT need Cloudflare MCP callouts:

| File | Lines | Why no callout needed |
|------|-------|----------------------|
| rendering-modes.md | 161 | Pure Astro concepts; Cloudflare is not the API source |
| components-islands.md | 265 | Pure Astro hydration patterns |
| data-content.md | 290 | Astro Content Layer; MCP Astro covers this |
| routing-navigation.md | 273 | Astro routing; Cloudflare route config is in build-deploy.md |
| styling-performance.md | 296 | Astro/CSS patterns; Cloudflare caching is in cloudflare-platform.md |
| seo-i18n.md | 251 | Astro SEO/i18n patterns |
| project-structure.md | 251 | Project templates; configs already delegate correctly |

**Confidence:** HIGH -- these files have low Cloudflare service API surface area.

### 7. Slash Commands (RECOMMENDED -- minor updates)

**debug.md** (Step 7 -- "If No Match Found"):
- Currently suggests `search_astro_docs` as fallback
- Should also suggest `search_cloudflare_documentation` for Cloudflare-specific errors (binding errors, wrangler errors, Workers runtime errors)
- Add a routing hint: "If the error involves Cloudflare services (KV, D1, R2, Workers runtime), also search Cloudflare docs"

**audit.md**: No changes needed. Audit checks against skill patterns, not MCP docs.

**scaffold.md**: No changes needed. Scaffold reads from reference files, which will have their own MCP callouts.

**Estimated change:** ~3-5 lines added to debug.md

**Confidence:** HIGH

---

## Callout Format Standard

All MCP callouts across reference files MUST use a consistent format for grep-ability and visual distinction:

### For Cloudflare MCP:
```markdown
> **Cloudflare docs:** For [specific topic], use `search_cloudflare_documentation` with query: "[suggested query]".
```

### For Astro MCP (existing pattern, for consistency):
```markdown
> **Astro docs:** For [specific topic], use `search_astro_docs` with query: "[suggested query]".
```

### Grep pattern for finding all MCP callouts:
```bash
grep -rn "Cloudflare docs:\|Astro docs:" references/
```

### SKILL.md grep hint addition:
```markdown
- MCP callouts: `grep -n "Cloudflare docs:\|Astro docs:" references/*.md`
```

**Confidence:** HIGH -- consistent format enables programmatic discovery and future maintenance.

---

## Impact Summary

### Line Budget

| File | Current lines | Added lines | New total | Budget status |
|------|--------------|-------------|-----------|---------------|
| SKILL.md | 256 | ~8 | ~264 | 264/500 (52%) |
| cloudflare-platform.md | 233 | ~10 | ~243 | No hard limit |
| build-deploy.md | 256 | ~7 | ~263 | No hard limit |
| typescript-testing.md | 278 | ~4 | ~282 | No hard limit |
| security-advanced.md | 341 | ~2 | ~343 | No hard limit |
| debug.md (command) | 150 | ~4 | ~154 | No hard limit |
| **Total delta** | | **~35 lines** | | Minimal impact |

### Frontmatter Budget

| Field | Current | Limit | Room | Action |
|-------|---------|-------|------|--------|
| name | `astro-cloudflare` (17 chars) | 64 chars | 47 chars | No change needed |
| description | 996 chars | 1024 chars | 28 chars | **No change possible** -- body-only integration |

### Files NOT modified

- references/rendering-modes.md
- references/components-islands.md
- references/data-content.md
- references/routing-navigation.md
- references/styling-performance.md
- references/seo-i18n.md
- references/project-structure.md
- commands/astro/audit.md
- commands/astro/scaffold.md

---

## Suggested Build Order

The v0.2 integration is a modification of existing files, not a ground-up build. The build order reflects dependencies between changes.

```
Phase 1: MCP Server Verification (BLOCKER)
  |  Verify the exact fully qualified tool name for search_cloudflare_documentation
  |  Test that the MCP server is accessible and returns results
  |  Document the confirmed tool name for all subsequent phases
  |
Phase 2: SKILL.md MCP Section Expansion
  |  Expand ## MCP Integration with dual-tool structure
  |  Add MCP tool selection matrix
  |  Verify SKILL.md stays under 500 lines
  |  Add grep hint for MCP callouts in references
  |
Phase 3: Primary Reference File Updates
  |  3a. cloudflare-platform.md -- add 4 Cloudflare MCP callouts
  |  3b. build-deploy.md -- add 3-4 callouts (mix of Cloudflare + Astro MCP)
  |  (These two files have the most Cloudflare API surface area)
  |
Phase 4: Secondary Reference File Updates
  |  4a. typescript-testing.md -- add 2 callouts
  |  4b. security-advanced.md -- add 1 callout (optional)
  |
Phase 5: Command Updates
  |  5a. debug.md -- add Cloudflare MCP fallback suggestion
  |
Phase 6: Validation
  |  Verify all callouts use consistent format
  |  Verify grep pattern finds all callouts
  |  Test MCP boundary: ask questions that should trigger each MCP tool
  |  Verify SKILL.md line count
```

**Phase 1 is a hard blocker.** Without the confirmed MCP tool name, all content changes would use a placeholder that must be search-and-replaced later. It is better to verify first, then write content with the correct name.

**Confidence:** HIGH for the ordering. Phase 1 blocker is a lesson learned from v0.1 where the MCP tool name had to be verified during implementation.

---

## Architectural Decisions

### Decision 1: Body-only integration (no frontmatter changes)

**Context:** Frontmatter description is at 996/1024 chars. Adding "search_cloudflare_documentation" (38 chars) is impossible.
**Decision:** All Cloudflare MCP integration lives in the SKILL.md body and reference files. The frontmatter description already mentions "Cloudflare Workers/Pages" and "Cloudflare bindings" which are sufficient activation triggers.
**Consequence:** Claude will not see the Cloudflare MCP tool name until the full SKILL.md body is loaded (Layer 2). This is acceptable because the MCP tool is a lookup mechanism, not an activation trigger.

**Confidence:** HIGH -- the frontmatter is for activation, not for MCP tool instructions.

### Decision 2: Blockquote callout format (not inline)

**Context:** Reference files could integrate MCP suggestions inline within prose, as separate sections at the end, or as blockquote callouts within existing sections.
**Decision:** Use blockquote callouts (`> **Cloudflare docs:** ...`) placed immediately after the relevant skill content within each section.
**Rationale:**
- Inline placement means Claude sees the MCP suggestion in the right context (not at the end of a long file)
- Blockquote format is visually distinct from skill content (Claude can distinguish skill guidance from MCP delegation)
- Grep-friendly prefix enables finding all callouts across all files
- Does not require restructuring existing sections

**Confidence:** HIGH -- this pattern was recommended in v0.1 ARCHITECTURE.md (Pattern 4: MCP Delegation Markers) but not implemented. Now implementing it.

### Decision 3: Suggested queries in every callout

**Context:** MCP callouts could simply say "use search_cloudflare_documentation" or could include a suggested query string.
**Decision:** Every callout includes a specific suggested query string.
**Rationale:**
- Reduces Claude's cognitive load (no need to formulate the query)
- Produces more relevant MCP results (curated queries vs. ad-hoc)
- Serves as documentation of what the MCP is expected to return
- Matches the v0.1 ARCHITECTURE.md recommendation (Component 4 example)

**Confidence:** HIGH

### Decision 4: No new reference files

**Context:** Could create a dedicated `cloudflare-mcp-guide.md` reference file for the Cloudflare MCP.
**Decision:** Do NOT create a new reference file. Integrate into existing files.
**Rationale:**
- The MCP callouts are navigation aids, not standalone knowledge
- A separate file would violate the "one level deep from SKILL.md" principle (it would be a reference about how to use another reference)
- The callouts are most useful when placed adjacent to the skill content they complement
- Adding another file increases Claude's navigation choices from 11 to 12 with minimal value

**Confidence:** HIGH

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| MCP tool name is different than expected | MEDIUM | HIGH (all callouts wrong) | Phase 1 verification is a hard blocker |
| search_cloudflare_documentation returns low-quality results | LOW | MEDIUM (callouts become noise) | Test with suggested queries in Phase 6; remove callouts that produce poor results |
| Callouts bloat reference files | LOW | LOW (total delta is ~35 lines) | Strict blockquote format, one callout per section max |
| Claude uses MCP when skill already has the answer | MEDIUM | LOW (extra latency, correct answer) | MCP tool selection matrix in SKILL.md steers to skill first |
| Frontmatter description cannot mention Cloudflare MCP | N/A (certain) | LOW | Body-only integration is sufficient; frontmatter already covers Cloudflare activation |

---

## Sources

### Project-Specific (HIGH confidence)
- `/home/negus/dev/marketplace/astro-skill/.claude/skills/astro-cloudflare/SKILL.md` -- Current v0.1 SKILL.md (256 lines, MCP section at lines 82-98)
- `/home/negus/dev/marketplace/astro-skill/.planning/PROJECT.md` -- v0.2 milestone definition with `search_cloudflare_documentation` goal
- `/home/negus/dev/marketplace/astro-skill/.planning/research/ARCHITECTURE.md` (v0.1) -- Original architecture patterns, MCP delegation markers recommendation
- All 11 reference files in `.claude/skills/astro-cloudflare/references/` -- Analyzed for Cloudflare keyword density and MCP callout insertion points
- All 3 slash commands in `.claude/commands/astro/` -- Analyzed for MCP fallback patterns

### Confidence Notes
- MCP tool name (`search_cloudflare_documentation`): From PROJECT.md specification. Exact fully qualified name (with server prefix) is UNVERIFIED -- requires Phase 1 verification.
- Integration patterns: HIGH confidence -- directly extend proven v0.1 patterns.
- Line counts and file analysis: HIGH confidence -- measured from actual files.
- WebSearch/WebFetch were unavailable during this research. The Cloudflare MCP server capabilities and exact API are not independently verified.
