# Phase 10: Reference File Integration - Research

**Researched:** 2026-02-04
**Domain:** Markdown content editing -- MCP callouts in 4 reference files + debug command routing expansion
**Confidence:** HIGH

## Summary

This phase adds MCP Cloudflare callouts to 4 existing reference files (`cloudflare-platform.md`, `build-deploy.md`, `security-advanced.md`, `typescript-testing.md`) and expands the debug slash command (`astro/debug.md`) with Cloudflare-specific symptom routing. The work is pure Markdown authoring with no code, no libraries, and no configuration changes. SKILL.md is NOT edited in this phase (14-line margin is reserved for Phase 11).

Each callout is 1-2 lines using the blockquote `>` format established in Phase 9. Callouts are placed AFTER the skill's integration pattern in each section, directing Claude to Cloudflare MCP for exhaustive API details that complement the skill's decision guidance. The debug command expansion adds a mini-routing block that splits Astro errors (Astro MCP) from Cloudflare errors (Cloudflare MCP) and adds 4-6 Cloudflare symptom entries to the routing table.

All source data exists in the Phase 8 verification report (tool name, query templates, precision profile) and the Phase 9 output (callout format precedent in SKILL.md). No external research needed.

**Primary recommendation:** Execute section-by-section: identify which sections in each file warrant callouts, draft the 1-2 line callout using the hybrid query pattern (`"[Product] [specific action]"`), insert after the last content line of each section (before the next `##` heading), then expand the debug command routing table.

## Standard Stack

No libraries or tools needed. This is a Markdown editing task across 5 existing files.

### Tools Used

| Tool | Purpose | Why |
|------|---------|-----|
| Text editor | Edit 5 Markdown files | Only tool needed -- Markdown authoring |

### Source Materials (Already Available)

| Source | Location | What It Provides |
|--------|----------|------------------|
| Phase 8 VERIFICATION.md | `.planning/phases/08-mcp-tool-verification/08-VERIFICATION.md` | Query templates, precision profile, hybrid query pattern |
| Phase 9 SKILL.md | `.claude/skills/astro-cloudflare/SKILL.md` | Callout format precedent (lines 97-98, 119) |
| Phase 9 SUMMARY.md | `.planning/phases/09-skill-three-way-routing/09-01-SUMMARY.md` | Confirmed format: `>` blockquote with tool reference |
| Phase 10 CONTEXT.md | `.planning/phases/10-reference-file-integration/10-CONTEXT.md` | All locked decisions on format, placement, scope |

### No Installation Needed

This phase creates no new files and installs no packages. It edits 5 existing Markdown files.

## Architecture Patterns

### Callout Format (Locked Decision from CONTEXT.md)

The blockquote callout format was established in Phase 9. Three examples exist in SKILL.md:

```markdown
> **Excluded CF products:** Zaraz, Magic Transit, Zero Trust, CDN, DNS, AI -- out of scope.
> **Fallback:** Primary source first. Ambiguous questions default to skill references.
```

```markdown
> **Caveats:** Titles empty (extract from `<text>` heading). URLs doubled (strip first `https://developers.cloudflare.com/` prefix).
```

**Phase 10 callout format (derived from CONTEXT.md decisions):**

```markdown
> **Cloudflare MCP:** `mcp__cloudflare__search_cloudflare_documentation` -- `"[Product] [specific action query]"`
```

This is 1 line: tool name + contextual query template. For sections covering multiple products, use 2 lines:

```markdown
> **Cloudflare MCP:** `mcp__cloudflare__search_cloudflare_documentation`
> Queries: `"Workers KV namespace put method API"` | `"Cloudflare D1 prepare bind SQL API"`
```

### Callout Placement Rules (Locked Decision)

1. **One callout per relevant section** (not one per file)
2. **Placed AFTER the skill's integration pattern** -- pattern first, then callout
3. **Quick Reference sections: NO callouts** -- callouts go in detailed sections below
4. **Only where Cloudflare docs genuinely add value** -- no forced callouts
5. **No caveats repeated in callouts** -- SKILL.md line 119 is the single source for caveats

### Section-by-Section Callout Map

#### cloudflare-platform.md (REF-01)

| Section | Line | Callout? | Query Template | Rationale |
|---------|------|----------|----------------|-----------|
| Quick Reference | 3 | NO | -- | Locked: no callouts in quick reference |
| Bindings Access | 15 | YES | `"Workers KV namespace put get API"` | Skill shows HOW to access bindings in Astro; CF docs have exhaustive method signatures |
| Workers Limits | 67 | YES | `"Cloudflare Workers platform limits and pricing"` | Skill has summary table; CF docs have current limits, pricing tiers, edge cases |
| Node.js Compatibility | 78 | YES | `"Workers nodejs_compat Node.js API support"` | Skill has status table; CF docs have per-module details and compat flag changelog |
| Environment Variables | 107 | NO | -- | This section is Astro-on-Cloudflare integration (how to use .dev.vars, astro:env) -- skill territory |
| Config Templates | 131 | YES | `"Wrangler configuration wrangler.toml schema"` | Skill has template; CF docs have complete schema reference with all options |
| Anti-patterns | 209 | NO | -- | Curated skill content, no CF docs complement needed |
| Troubleshooting | 222 | NO | -- | Curated skill content, no CF docs complement needed |

**Total callouts: 4** (Bindings Access, Workers Limits, Node.js Compatibility, Config Templates)

#### build-deploy.md (REF-02)

| Section | Line | Callout? | Query Template | Rationale |
|---------|------|----------|----------------|-----------|
| Quick Reference | 5 | NO | -- | Locked: no callouts in quick reference |
| Output Mode Decision Matrix | 20 | NO | -- | Pure Astro decision (output modes) -- Astro MCP territory |
| Deployment Target Decision Matrix | 33 | NO | -- | Astro-on-Cloudflare integration -- skill territory |
| Dev/Preview Workflow Matrix | 44 | NO | -- | Skill's integration workflow, not CF API |
| Package.json Scripts | 55 | NO | -- | Astro tooling, not CF-specific |
| GitHub Actions CI/CD | 81 | YES | `"Cloudflare wrangler-action GitHub Actions deploy"` | Skill has template; CF docs have full wrangler-action options, secrets config |
| .assetsignore | 126 | NO | -- | Small Astro-specific workaround, no CF docs to add |
| Adapter Options | 136 | NO | -- | Astro adapter config -- Astro MCP territory |
| CLI Flags Reference | 149 | YES | `"Wrangler CLI commands reference"` | Skill has summary; CF docs have complete wrangler CLI reference |
| Debugging Workflow | 165 | YES | `"Wrangler dev inspect debugging Workers"` | Skill has workflow; CF docs have Chrome DevTools integration details |
| VS Code Configuration | 202 | NO | -- | Editor setup, not CF-specific |
| Anti-patterns | 225 | NO | -- | Curated skill content |
| Troubleshooting | 241 | NO | -- | Curated skill content |

**Total callouts: 3** (GitHub Actions CI/CD, CLI Flags Reference, Debugging Workflow)

#### security-advanced.md (REF-03)

| Section | Line | Callout? | Query Template | Rationale |
|---------|------|----------|----------------|-----------|
| Quick Reference | 5 | NO | -- | Locked: no callouts in quick reference |
| Security Decision Matrix | 22 | NO | -- | Astro decision matrix, skill territory |
| Security Headers Middleware | 30 | NO | -- | Astro middleware pattern -- skill territory |
| Auth Middleware Pattern | 62 | NO | -- | Astro middleware pattern -- skill territory |
| Actions Security Pattern | 86 | NO | -- | Astro Actions -- explicitly callout-free per CONTEXT.md |
| Secrets Management | 115 | YES | `"Cloudflare Workers secrets wrangler secret put"` | Skill shows pattern; CF docs have secret management CLI, dashboard, API details |
| CSP Config | 146 | NO | -- | Astro experimental.csp -- Astro territory |
| MDX/Markdoc Advanced Setup | 174 | NO | -- | Pure Astro/MDX -- no Cloudflare boundary |
| Remark/Rehype Plugin Config | 176 | NO | -- | Pure Astro -- no Cloudflare boundary |
| Custom Component Mapping | 208 | NO | -- | Pure Astro -- no Cloudflare boundary |
| Markdoc Custom Tags | 233 | NO | -- | Pure Astro -- no Cloudflare boundary |
| Shiki Dual Theme CSS | 262 | NO | -- | Pure CSS/Astro -- no Cloudflare boundary |
| Custom Remark Plugin | 290 | NO | -- | Pure Astro -- no Cloudflare boundary |
| Anti-patterns | 311 | NO | -- | Curated skill content |
| Troubleshooting | 328 | NO | -- | Curated skill content |

**Total callouts: 1** (Secrets Management)

**Note:** security-advanced.md is mostly Astro patterns (middleware, Actions, CSP, MDX/Markdoc). The only Cloudflare-specific boundary is Secrets Management (wrangler secret put, dashboard secrets). The success criteria mentions "Cloudflare security features and secrets management" -- Secrets Management alone satisfies this. The other sections (CSP, security headers) are Astro middleware patterns implemented on any platform.

#### typescript-testing.md (REF-04)

| Section | Line | Callout? | Query Template | Rationale |
|---------|------|----------|----------------|-----------|
| Quick Reference | 5 | NO | -- | Locked: no callouts in quick reference |
| TypeScript Config Decision Matrix | 22 | NO | -- | Astro TS config -- Astro territory |
| env.d.ts Full Pattern | 37 | YES | `"Cloudflare Workers types workers-types"` | Skill shows pattern; CF docs have @cloudflare/workers-types reference, Env interface details |
| Test Type Decision Matrix | 70 | NO | -- | Skill decision matrix -- skill territory |
| Vitest Config | 85 | NO | -- | Astro-specific getViteConfig -- Astro territory |
| Container API Test | 108 | NO | -- | Astro Container API -- Astro territory |
| Cloudflare Bindings Test | 163 | YES | `"Cloudflare vitest-pool-workers configuration"` | Skill has config template; CF docs have full pool-workers config, miniflare options, advanced patterns |
| Playwright Config | 205 | NO | -- | Standard Playwright -- no CF boundary |
| Package Scripts | 233 | NO | -- | Astro tooling |
| Anti-patterns | 249 | NO | -- | Curated skill content |
| Troubleshooting | 264 | NO | -- | Curated skill content |

**Total callouts: 2** (env.d.ts Full Pattern, Cloudflare Bindings Test)

### Debug Command Expansion (REF-05)

The current debug command (`astro/debug.md`) has:

1. **Step 2 routing table** (12 symptom patterns) -- all route to skill reference files
2. **Step 7 fallback** ("If No Match Found") -- suggests Astro MCP only

**Changes needed (from CONTEXT.md):**

1. **Add 4-6 Cloudflare symptom entries to Step 2 routing table** covering:
   - Runtime errors: CPU limit exceeded, KV binding not found, memory limit
   - Wrangler/deploy errors: compatibility_date issues, node_compat missing, wrangler config errors

2. **Replace Step 7 fallback** with mini-routing:
   - If Astro error (components, routing, config) -> Astro MCP
   - If Workers/KV/D1/R2 error -> Cloudflare MCP
   - Preserve existing Astro MCP fallback but restructure into routing logic

**Proposed Cloudflare symptom entries for Step 2:**

| Symptom Pattern | Reference/Action |
|-----------------|-----------------|
| `CPU time exceeded` / Worker CPU limit | `cloudflare-platform.md` + Cloudflare MCP: `"Workers CPU time limits"` |
| `KV namespace not bound` / binding errors in production | `cloudflare-platform.md` + Cloudflare MCP: `"Workers KV binding wrangler configuration"` |
| `compatibility_date` errors / compat flag issues | `cloudflare-platform.md` + Cloudflare MCP: `"Workers compatibility flags dates"` |
| `node_compat` / Node.js API not available | `cloudflare-platform.md` + Cloudflare MCP: `"Workers nodejs_compat Node.js API"` |
| Wrangler deploy fails / `wrangler pages deploy` errors | `build-deploy.md` + Cloudflare MCP: `"Wrangler deploy troubleshooting"` |

That gives 5 entries (within the 4-6 range), covering both runtime (CPU, KV binding) and wrangler/deploy (compat_date, node_compat, deploy) categories.

**Proposed Step 7 fallback restructure:**

```markdown
### If No Match Found

If no troubleshooting entry, anti-pattern, or Critical Rule matches the symptom:

1. Say so honestly: "This symptom is not covered in the skill's troubleshooting tables."
2. Route to the appropriate MCP based on error domain:
   - **Astro errors** (components, routing, rendering, config, content): use Astro MCP
     ```
     mcp__astro_doc__search_astro_docs({ query: "<relevant search terms>" })
     ```
   - **Cloudflare errors** (Workers runtime, KV/D1/R2 bindings, wrangler, deploy): use Cloudflare MCP
     ```
     mcp__cloudflare__search_cloudflare_documentation({ query: "<product> <specific error>" })
     ```
3. Suggest the user share more context (full error stack trace, config files, reproduction steps).
```

### Line Impact Summary

| File | Current Lines | Callouts Added | Lines Added (est.) | New Total (est.) |
|------|--------------|----------------|-------------------|-----------------|
| cloudflare-platform.md | 233 | 4 | +5 (4 callouts + 1 blank) | 238 |
| build-deploy.md | 256 | 3 | +4 (3 callouts + 1 blank) | 260 |
| security-advanced.md | 341 | 1 | +2 (1 callout + 1 blank) | 343 |
| typescript-testing.md | 278 | 2 | +3 (2 callouts + 1 blank) | 281 |
| astro/debug.md | 149 | 5 symptoms + fallback rewrite | +15 (est.) | 164 |
| **SKILL.md** | **284 (266 body)** | **0** | **0** | **284 (unchanged)** |

**Total callouts across reference files: 10**
**Total new symptom entries in debug: 5**
**SKILL.md: UNTOUCHED (0 changes)**

Reference files have no line budget constraints. Only SKILL.md has the 280-line hard limit, and Phase 10 does not touch SKILL.md.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Query template wording | Invent new query patterns | Adapt from Phase 8 VERIFICATION.md Section 4 templates | Empirically tested, precision-rated |
| Callout format | Create new format | Copy Phase 9 blockquote style from SKILL.md lines 97-98, 119 | Consistency with established format |
| Section selection criteria | Guess which sections need callouts | Apply CONTEXT.md rule: "only where Cloudflare docs genuinely add value" | Prevents forced/useless callouts |
| Debug symptom entries | Brainstorm symptoms | Derive from existing Troubleshooting tables in reference files | Symptoms already catalogued, just need MCP routing |

**Key insight:** Phase 8 produced the query templates. Phase 9 established the callout format. Phase 10 is assembly and placement -- copy the format, adapt the query template to each section's context, insert after the skill's content. No invention needed.

## Common Pitfalls

### Pitfall 1: Placing Callouts in Wrong Position
**What goes wrong:** Callout placed before the skill's integration pattern, or inside a code block, or in a Quick Reference section.
**Why it happens:** Not reading CONTEXT.md placement rules carefully.
**How to avoid:** Always place AFTER the last content line of the section, before the next `##` heading. Never in Quick Reference. Verify with grep after editing.
**Warning signs:** Callout appears above a code block or table that it should follow.

### Pitfall 2: Repeating Caveats in Every Callout
**What goes wrong:** Each callout mentions empty titles and doubled URLs.
**Why it happens:** Wanting to be thorough per-callout.
**How to avoid:** CONTEXT.md is explicit: "No caveats repeated in callouts -- SKILL.md is the single source for caveats (empty titles, doubled URLs)." Each callout is just tool name + query template.
**Warning signs:** Callout exceeds 2 lines.

### Pitfall 3: Callouts for Astro-Only Sections
**What goes wrong:** Adding a Cloudflare MCP callout to sections like "CSP Config" or "Container API Test" that are pure Astro patterns.
**Why it happens:** Trying to maximize callout count to "be thorough."
**How to avoid:** Apply the rule: does this section have a Cloudflare API boundary? If the section teaches Astro patterns (even if they run on Cloudflare), it's skill/Astro territory. Only sections that reference Cloudflare-specific APIs (KV/D1/R2 methods, Workers limits, wrangler config, Workers types) warrant callouts.
**Warning signs:** Callout query template references an Astro concept rather than a Cloudflare product.

### Pitfall 4: Breaking Existing Grep Navigation Patterns
**What goes wrong:** Adding callouts that shift content and break the grep patterns listed in SKILL.md Reference Navigation section.
**Why it happens:** Inserting content before a `##` heading that grep targets.
**How to avoid:** Callouts are inserted WITHIN sections (after content, before next `##`). Grep patterns match headings (`## Bindings Access`), not line numbers. Adding lines within a section does not break grep-based heading navigation.
**Warning signs:** `grep -n "## Bindings Access" references/cloudflare-platform.md` returns a different heading or fails.

### Pitfall 5: Debug Command Fallback Not Preserving Astro MCP
**What goes wrong:** The new Cloudflare MCP routing replaces the Astro MCP fallback entirely.
**Why it happens:** Rewriting the fallback section without preserving existing content.
**How to avoid:** CONTEXT.md says "Existing Astro MCP fallback preserved but restructured into the routing logic." Both MCPs must appear in the fallback: Astro MCP for Astro errors, Cloudflare MCP for Cloudflare errors.
**Warning signs:** `grep "search_astro_docs" .claude/commands/astro/debug.md` returns no results after editing.

### Pitfall 6: Inconsistent Query Template Style
**What goes wrong:** Some callouts use keyword queries (`"KV put"`) while others use the hybrid pattern (`"Workers KV namespace put method API"`).
**Why it happens:** Not following the Phase 8 finding consistently.
**How to avoid:** ALL query templates must follow the hybrid pattern: `"[Product name] [specific action in natural language]"`. Product name anchors the search; natural language provides context. Minimum 5-7 words per query.
**Warning signs:** Any query template shorter than 4 words.

## Code Examples

### Example 1: Callout in cloudflare-platform.md Bindings Access Section

After the existing `> Note: Astro.locals.runtime is the Astro 5.x pattern.` on line 65:

```markdown
> Note: `Astro.locals.runtime` is the Astro 5.x pattern. This changes in Astro 6.

> **Cloudflare MCP:** For complete KV/D1/R2 binding method signatures, query `mcp__cloudflare__search_cloudflare_documentation` with `"Workers KV namespace put get API"` or `"Cloudflare D1 prepare bind SQL API"`.
```

**Line cost:** 2 lines (1 blank + 1 callout). The blank line before `>` is needed to separate from the existing `> Note:`.

### Example 2: Callout in cloudflare-platform.md Workers Limits Section

After the Workers Limits table (line 77):

```markdown
| Daily requests | 100K | Unlimited | Upgrade to Paid |

> **Cloudflare MCP:** For current limits and pricing details, query `"Cloudflare Workers platform limits and pricing"`.
```

**Line cost:** 2 lines (1 blank + 1 callout).

### Example 3: Callout in typescript-testing.md Cloudflare Bindings Test Section

After the `**Run binding tests separately:**` line (line 203):

```markdown
**Run binding tests separately:** `vitest run --config vitest.config.workers.ts`

> **Cloudflare MCP:** For complete vitest-pool-workers options, query `"Cloudflare vitest-pool-workers configuration miniflare"`.
```

**Line cost:** 2 lines (1 blank + 1 callout).

### Example 4: Debug Command Symptom Entry

New row in the Step 2 routing table:

```markdown
| `CPU time exceeded` / Worker CPU limit | `cloudflare-platform.md` |
| `KV namespace not bound` / binding errors in prod | `cloudflare-platform.md` |
| `compatibility_date` / compat flag errors | `cloudflare-platform.md` |
| `node_compat` / Node.js API not available on Workers | `cloudflare-platform.md` |
| Wrangler deploy fails / `wrangler pages deploy` errors | `build-deploy.md` |
```

### Example 5: Debug Command Fallback Rewrite

Replace the current "If No Match Found" section (Step 7, lines 127-134):

```markdown
### If No Match Found

If no troubleshooting entry, anti-pattern, or Critical Rule matches the symptom:

1. Say so honestly: "This symptom is not covered in the skill's troubleshooting tables."
2. Route to the appropriate MCP based on error domain:
   - **Astro errors** (components, routing, rendering, config, content):
     ```
     mcp__astro_doc__search_astro_docs({ query: "<relevant search terms>" })
     ```
   - **Cloudflare errors** (Workers runtime, KV/D1/R2, wrangler, deploy):
     ```
     mcp__cloudflare__search_cloudflare_documentation({ query: "<product> <specific error>" })
     ```
3. Suggest the user share more context (full error stack trace, config files, reproduction steps).
```

## State of the Art

| Aspect | Current State | After Phase 10 | Impact |
|--------|--------------|----------------|--------|
| Reference file MCP awareness | Zero MCP callouts in any reference file | 10 callouts across 4 files | Claude sees MCP prompts at point-of-use |
| Debug command MCP routing | Astro MCP only in fallback | Dual-MCP routing (Astro + Cloudflare) | Cloudflare errors get MCP lookup |
| Debug symptom coverage | 12 Astro-focused symptoms | 17 symptoms (12 Astro + 5 Cloudflare) | Workers/KV/D1 runtime errors covered |
| Cross-file consistency | Phase 9 format in SKILL.md only | Same blockquote format in all files | Consistent user experience |

## Open Questions

### 1. Exact Placement of Callouts (Blank Line Handling)

- **What we know:** Callouts use `>` blockquote prefix and are placed after the skill's content.
- **What's unclear:** Whether a blank line is needed before the callout when the preceding content is a table, code block, or existing blockquote.
- **Recommendation:** Always add 1 blank line before the callout blockquote. Markdown requires blank lines before blockquotes to render correctly. If the preceding content is already a blockquote (like the `> Note:` in cloudflare-platform.md line 65), the new callout should be a separate blockquote (blank line between them) to avoid being merged.
- **Confidence:** HIGH -- standard Markdown rendering rules.

### 2. Whether Config Templates Section Warrants a Callout

- **What we know:** The `wrangler.jsonc` template in Config Templates (cloudflare-platform.md line 131) shows a complete template with KV, D1, R2 bindings.
- **What's unclear:** Whether this is enough skill content already, or whether CF docs add value for the complete wrangler schema reference.
- **Recommendation:** YES, add a callout. The skill provides a project template; Cloudflare docs have the exhaustive wrangler.jsonc/wrangler.toml schema with all possible fields (including less common ones like `logpush`, `tail_consumers`, `smart_placement`). This is a genuine boundary.
- **Confidence:** MEDIUM -- discretionary, but the wrangler schema is large and evolves.

### 3. Whether Environment Variables Section Warrants a Callout

- **What we know:** Environment Variables (cloudflare-platform.md line 107) covers `.dev.vars`, `wrangler secret put`, and `vars` in wrangler.jsonc.
- **What's unclear:** This is partly Cloudflare-specific (wrangler secrets) and partly Astro-integration (astro:env, locals.runtime.env).
- **Recommendation:** NO callout. The section primarily teaches the Astro-on-Cloudflare integration pattern (how to use .dev.vars with Astro, how locals.runtime.env works). The `wrangler secret put` command is simple enough that CF docs don't add significant value. The Secrets Management section in security-advanced.md already gets a callout for the deeper secrets topic.
- **Confidence:** MEDIUM -- borderline, but avoiding redundancy with the security-advanced.md callout.

## Sources

### Primary (HIGH confidence)
- **Phase 8 VERIFICATION.md** -- `.planning/phases/08-mcp-tool-verification/08-VERIFICATION.md` -- tool name, query templates, precision profile (344 lines, empirically verified)
- **Phase 9 SKILL.md** -- `.claude/skills/astro-cloudflare/SKILL.md` -- callout format precedent (lines 97-98, 119)
- **Phase 10 CONTEXT.md** -- `.planning/phases/10-reference-file-integration/10-CONTEXT.md` -- all locked decisions
- **All 4 reference files** -- read in full to identify section boundaries and callout candidates
- **Debug command** -- `.claude/commands/astro/debug.md` -- read in full to understand current routing table and fallback structure

### Secondary (MEDIUM confidence)
- **Phase 9 RESEARCH.md** -- `.planning/phases/09-skill-three-way-routing/09-RESEARCH.md` -- format patterns and anti-patterns
- **Phase 9 SUMMARY.md** -- `.planning/phases/09-skill-three-way-routing/09-01-SUMMARY.md` -- confirmed format decisions

### Tertiary (LOW confidence)
- None -- all findings derived from project-internal verified documents

## Metadata

**Confidence breakdown:**
- Callout format: HIGH -- directly copied from Phase 9 precedent in SKILL.md
- Section selection (which sections get callouts): MEDIUM -- Claude's discretion per CONTEXT.md, analyzed section-by-section
- Query template wording: HIGH -- adapted from Phase 8 empirically tested templates
- Debug command expansion: HIGH -- CONTEXT.md decisions are specific (4-6 entries, runtime + wrangler categories, mini-routing)
- Pitfalls: HIGH -- derived from concrete constraints (placement rules, format rules, preservation rules)

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days -- content editing, no external dependencies that could change)
