# Phase 5: SKILL.md Body - Research

**Researched:** 2026-02-03
**Domain:** Skill authoring / navigation hub design / cross-cutting content synthesis
**Confidence:** HIGH

## Summary

This phase writes the body of SKILL.md -- the markdown content after the YAML frontmatter. The body serves as Claude's entry point after the skill triggers: it must route Claude to the right reference file quickly, encode cross-cutting rules that span multiple domains, and document the boundary between the skill and the MCP `search_astro_docs` tool.

The official Anthropic skill authoring best practices (fetched 2026-02-03) explicitly recommend: SKILL.md body under 500 lines, one-level-deep references, grep hints for domain-specific navigation (Pattern 2), and fully qualified MCP tool names. Our existing structure (11 reference files, flat `references/` directory) already follows these patterns. The body must synthesize without duplicating -- reference files total 2894 lines across 11 files, each with consistent sections (Quick Reference, Decision Matrices, Anti-patterns, Troubleshooting).

The key authoring challenge is fitting the required content (breaking changes, decision matrices, grep hints for 11 files, MCP instructions) into <500 lines while remaining a useful hub. Research shows the optimal approach is: imperative rules first (highest density), compact tables for decisions, inline grep patterns per file, and a concise MCP boundary section.

**Primary recommendation:** Structure the SKILL.md body as 5 distinct sections -- Critical Rules (Astro 5.x breaking changes), Decision Matrices (4 compact tables), Reference Navigation with grep hints (one block per file), MCP Integration boundary, and a minimal Troubleshooting Quick-Index pointing to reference files.

## Standard Stack

This phase produces a markdown file, not code. There are no library dependencies.

### Core
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| Markdown | SKILL.md body format | Required by Claude Code skill architecture |
| YAML frontmatter | Already written (Phase 1) | Triggers auto-activation |
| `references/` directory | 11 files already written (Phases 2-4) | Navigation targets |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `grep -n` patterns | Navigation hints in SKILL.md | Claude uses these to jump to relevant sections |
| `mcp__astro_doc__search_astro_docs` | MCP tool for official Astro docs | When skill content doesn't cover API details |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline grep hints | Table of Contents with line numbers | Line numbers change on edits; grep patterns are stable |
| Compact decision tables | Prose-based decision guidance | Tables are scannable at lower token cost |
| Single MCP section | MCP hints scattered throughout | Centralized boundary is clearer for Claude |

## Architecture Patterns

### Recommended SKILL.md Body Structure

```
SKILL.md body (~400-480 lines):
├── ## Critical Rules                    # ~40 lines - Astro 5.x breaking changes
├── ## Decision Matrices                 # ~80 lines - 4 compact choice tables
├── ## Reference Navigation              # ~200 lines - grep hints per file
├── ## MCP Integration                   # ~30 lines - boundary + examples
└── ## Quick Troubleshooting Index       # ~40 lines - symptom -> file routing
```

### Pattern 1: Critical Rules as Numbered Imperatives
**What:** Top-of-body numbered rules for the most dangerous cross-cutting anti-patterns
**When to use:** For breaking changes that apply across multiple reference files
**Why:** Matches the "Quick Reference" pattern established in all 11 reference files (decision from 02-02). These rules are the first thing Claude reads after activation, maximizing their impact on code generation.
**Source:** Anthropic best practices -- "Only add context Claude doesn't already have"

**Example:**
```markdown
## Critical Rules (Astro 5.x on Cloudflare)

1. `src/content.config.ts` -- NOT `src/content/config.ts` (path changed in v5)
2. `entry.id` -- NOT `entry.slug` (removed in v5)
3. `import { render } from 'astro:content'` then `render(entry)` -- NOT `entry.render()`
4. `loader: glob()` -- NOT `type: 'content'` (deprecated in v5)
5. `<ClientRouter />` -- NOT `<ViewTransitions />` (deprecated v5, removed v6)
6. `Astro.locals.runtime.env` -- NOT `process.env` (undefined on Workers)
7. `imageService: 'compile'` -- NOT Sharp (incompatible with Workers)
8. `output: 'static'` or `'server'` -- NOT `'hybrid'` (removed in v5)
```

### Pattern 2: Compact Decision Matrix
**What:** Horizontal tables with clear defaults highlighted
**When to use:** For the 4 required architectural decisions
**Why:** Tables are the most token-efficient format for multi-criteria decisions. Claude can scan them faster than prose.

**Example:**
```markdown
## Rendering Mode

| Scenario | Mode | Key |
|----------|------|-----|
| Static site | `output: 'static'` (default) | No adapter needed |
| < 30% dynamic | `output: 'static'` + adapter | `prerender: false` per page |
| > 70% dynamic | `output: 'server'` + adapter | `prerender: true` per page |
| Static + personalization | `output: 'static'` + Server Islands | `server:defer` directive |

**Default:** `output: 'static'` + cloudflare adapter. See [references/rendering-modes.md](references/rendering-modes.md) for full matrix.
```

### Pattern 3: Grep Hints per Reference File
**What:** For each reference file, a one-liner description plus grep patterns for key sections
**When to use:** For all 11 reference files
**Why:** Anthropic Pattern 2 (domain-specific organization) explicitly recommends grep patterns. This lets Claude find exact sections without reading entire files (avg 263 lines each). The patterns are stable across edits because they target section headers and unique keywords.
**Source:** Official best practices -- "Find specific metrics using grep"

**Example:**
```markdown
### rendering-modes.md
Rendering mode selection, Server Islands, prerender, SSG vs SSR.
- Decision matrix: `grep -n "Decision Matrix" references/rendering-modes.md`
- Server Islands: `grep -n "Server Islands" references/rendering-modes.md`
- Anti-patterns: `grep -n "Anti-patterns" references/rendering-modes.md`
- Troubleshooting: `grep -n "Troubleshooting" references/rendering-modes.md`
```

### Pattern 4: MCP Integration Boundary
**What:** Explicit delineation of what the skill covers vs what the MCP tool covers
**When to use:** For documenting `mcp__astro_doc__search_astro_docs`
**Why:** Anthropic requires fully qualified MCP tool names. Clear boundary prevents Claude from searching docs for things the skill already covers (wasting tokens) or missing API details the skill intentionally omits.
**Source:** Official best practices -- "MCP tool references: always use fully qualified tool names"

**Example:**
```markdown
## MCP Integration

Use `mcp__astro_doc__search_astro_docs` for:
- API signatures and parameter details
- Config option exhaustive lists
- Version-specific changelog entries
- Integration setup steps not in this skill

Do NOT use MCP for:
- Architectural decisions (use Decision Matrices above)
- Anti-patterns (use Critical Rules + reference Anti-patterns sections)
- Cloudflare-specific patterns (not in Astro docs)
```

### Anti-Patterns to Avoid
- **Duplicating reference content in SKILL.md:** The body should route, not repeat. If a rule exists in a reference file, reference it; don't copy it. Exception: the ~8 most critical cross-cutting breaking changes belong in both places.
- **Exceeding 500 lines:** Official Anthropic limit. Our target is 400-480 lines to leave margin.
- **Deep nesting references:** References from references. Our architecture is already one-level-deep.
- **Vague grep hints:** `grep "config"` matches too many lines. Use section headers or unique identifiers.
- **Time-sensitive content in the body:** No version numbers that will become stale. Use patterns like "Astro 5.x" not "Astro 5.17".

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Navigation to reference sections | Manual line-number index | `grep -n` patterns on section headers | Line numbers change on edits; grep patterns are stable |
| Decision guidance | Prose paragraphs explaining tradeoffs | Compact decision tables | Tables are scannable, lower token cost |
| MCP integration docs | Scattered hints throughout body | Single dedicated section with boundary | Centralized is clearer, testable |
| Breaking change list | Separate breaking-changes.md file | Inline numbered rules at top of body | Must be in SKILL.md body per requirements (CROSS-01) |

**Key insight:** The SKILL.md body is a routing document, not a reference document. Every line should either encode a cross-cutting rule or point Claude to where the detailed answer lives.

## Common Pitfalls

### Pitfall 1: Body Exceeds 500 Lines
**What goes wrong:** Body grows beyond the Anthropic-recommended limit, overwhelming context
**Why it happens:** Decision matrices get verbose, grep hints get duplicative, or content from references gets copied into the body
**How to avoid:** Strict line budget per section. Critical Rules ~40, Decisions ~80, Navigation ~200, MCP ~30, Troubleshooting Index ~40 = ~390 lines with buffer
**Warning signs:** Any single section exceeding its budget by >20%

### Pitfall 2: Grep Patterns Return Too Many Matches
**What goes wrong:** Claude gets 50+ grep results instead of 1-3 targeted lines
**Why it happens:** Patterns are too generic (e.g., `grep "config"`)
**How to avoid:** Target H2/H3 section headers (`## Decision Matrix`, `## Anti-patterns`). These are unique per file. Test all patterns against actual reference files before shipping.
**Warning signs:** A grep pattern matching >5 lines in a reference file

### Pitfall 3: Duplicating Reference Content
**What goes wrong:** Same information exists in SKILL.md body AND reference files, creating maintenance burden and inconsistency risk
**Why it happens:** Temptation to make SKILL.md "complete" rather than a hub
**How to avoid:** Only the 8 most critical Astro 5.x breaking changes belong in both places. Everything else is reference-only with grep pointers.
**Warning signs:** Any code block longer than 5 lines in SKILL.md body (should live in reference)

### Pitfall 4: Missing Grep Hint Coverage
**What goes wrong:** Claude cannot navigate to a domain because SKILL.md has no pointer
**Why it happens:** New sections added to reference files without updating SKILL.md grep hints
**How to avoid:** The SKILL.md body must have at least one grep pattern per reference file. Verification should check all 11 files are represented.
**Warning signs:** A reference file with no entry in the Navigation section

### Pitfall 5: MCP Boundary Confusion
**What goes wrong:** Claude uses MCP search for things the skill already covers (wasting tokens) or fails to use MCP for API details
**Why it happens:** Boundary is implicit rather than explicit
**How to avoid:** Explicit "Use MCP for" and "Do NOT use MCP for" lists
**Warning signs:** Claude searching `astro_docs` for "hydration directive" (covered in skill) or not searching for "Astro.session config options" (API detail not in skill)

### Pitfall 6: Decision Matrix Without Clear Default
**What goes wrong:** Claude pauses to evaluate all options instead of picking the obvious choice
**Why it happens:** Matrix presents all options equally without highlighting the Cloudflare-optimized default
**How to avoid:** Each decision matrix must have a bold **Default:** line after the table
**Warning signs:** Matrix with no default indicator

## Code Examples

This phase produces markdown, not code. The relevant examples are markdown formatting patterns.

### Cross-cutting Breaking Change Rule (verified against reference files)
```markdown
1. `src/content.config.ts` -- NOT `src/content/config.ts` (path changed in v5)
```
Source: Verified in project-structure.md Quick Reference #1, data-content.md Quick Reference #1

### Decision Matrix with Default
```markdown
| Scenario | Hydration | Why |
|----------|-----------|-----|
| Below-fold interactive | `client:visible` | **Default.** Defers JS until visible |
| Above-fold critical | `client:load` | Immediate interactivity needed |
| Above-fold non-critical | `client:idle` | Ready after main thread idle |
| Mobile-only | `client:media` | No JS on desktop |
| Browser APIs required | `client:only="react"` | SSR not viable |

**Default:** `client:visible` for most components. See [references/components-islands.md](references/components-islands.md).
```
Source: Synthesized from components-islands.md Hydration Directive Decision Matrix

### Grep Hint Block
```markdown
### data-content.md
Content Layer, loaders, collections, Actions, MDX/Markdoc.
- Loader selection: `grep -n "Loader Selection" references/data-content.md`
- Actions vs API: `grep -n "Actions vs API" references/data-content.md`
- Content config: `grep -n "Content Layer Config" references/data-content.md`
- MDX vs Markdoc: `grep -n "MDX / Markdoc" references/data-content.md`
```
Source: Derived from actual H2 headings in data-content.md

### MCP Integration Block
```markdown
## MCP Integration

**Tool:** `mcp__astro_doc__search_astro_docs`

**Use MCP when you need:**
- Exact API signatures (e.g., `defineAction` options)
- Config option lists (e.g., all `astro.config.mjs` fields)
- Migration guide details beyond breaking changes listed above
- Integration setup (e.g., `@astrojs/react` config options)

**Use THIS SKILL when you need:**
- Architecture decisions (rendering mode, hydration, Actions vs API)
- Anti-patterns and breaking change prevention
- Cloudflare-specific patterns (bindings, Workers limits, .dev.vars)
- Grep navigation to reference file sections
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Line-number references | grep-based navigation | Anthropic best practices 2025 | Stable across edits |
| Monolithic SKILL.md | Hub + references/ | Progressive disclosure pattern | <500 line body, on-demand loading |
| Implicit MCP usage | Explicit boundary section | Best practices: fully qualified names | Clear skill vs MCP division |
| `<ViewTransitions />` | `<ClientRouter />` | Astro 5.0 | Must be in Critical Rules |
| `entry.slug` | `entry.id` | Astro 5.0 | Must be in Critical Rules |
| `entry.render()` | `import { render }` | Astro 5.0 | Must be in Critical Rules |
| `type: 'content'` | `loader: glob()` | Astro 5.0 | Must be in Critical Rules |
| `output: 'hybrid'` | `output: 'static'` or `'server'` | Astro 5.0 | Must be in Critical Rules |

## Inventory of Cross-Cutting Content for SKILL.md Body

### Critical Rules (Astro 5.x Breaking Changes -- req CROSS-01)
These appear in multiple reference files and must be consolidated in SKILL.md:

| Breaking Change | Source References |
|----------------|-------------------|
| `content.config.ts` path: `src/content.config.ts` not `src/content/config.ts` | project-structure.md, data-content.md |
| `entry.slug` removed, use `entry.id` | project-structure.md, data-content.md, seo-i18n.md |
| `entry.render()` removed, use `import { render }` | project-structure.md, data-content.md |
| `type: 'content'` deprecated, use `loader: glob()` | project-structure.md, data-content.md |
| `<ViewTransitions />` deprecated, use `<ClientRouter />` | routing-navigation.md |
| `output: 'hybrid'` removed | rendering-modes.md, routing-navigation.md, build-deploy.md |
| `process.env` undefined on Workers, use `locals.runtime.env` | cloudflare-platform.md, routing-navigation.md, build-deploy.md, security-advanced.md |
| Sharp incompatible with Workers, use `imageService: 'compile'` | cloudflare-platform.md, styling-performance.md, build-deploy.md |
| `decodeURIComponent()` required for params (auto-decode removed) | routing-navigation.md |
| `z` from `astro/zod` not `zod` package | data-content.md |

### Decision Matrices (req CROSS-02)
Four matrices required:
1. **Rendering mode**: SSG vs SSR vs Server Islands (default: `output: 'static'` + adapter)
2. **Hydration directive**: client:visible vs load vs idle vs media vs only (default: `client:visible`)
3. **Actions vs API routes**: form validation vs REST vs webhook (default: Actions for forms)
4. **Server Islands vs alternatives**: personalization vs interactivity vs push (default: Server Island for dynamic-without-interactivity)

### Grep Hints (req STRUCT-05)
All 11 reference files need navigation entries with verified grep patterns targeting actual H2/H3 headings.

### MCP Integration (req INTEG-01, INTEG-02)
Single section with fully qualified tool name and explicit boundary.

## Open Questions

1. **Exact line budget distribution**
   - What we know: Total must be <500 lines. Estimated ~390 lines across 5 sections.
   - What's unclear: Whether the Navigation section (11 files x ~15-20 lines each) fits in ~200 lines.
   - Recommendation: Budget 18 lines per reference file (file header + description + 4 grep patterns). 11 x 18 = 198 lines. Fits.

2. **Grep pattern verification**
   - What we know: All reference files use H2 headers consistently (Quick Reference, Anti-patterns, Troubleshooting).
   - What's unclear: Whether some H2 headers need adjustment for unique matching.
   - Recommendation: Test every grep pattern against actual files during implementation. The verification step should run all patterns and confirm each returns 1-3 lines.

3. **Quick Troubleshooting Index scope**
   - What we know: Requirement STRUCT-02 says "navigation hub." A symptom-to-file router would be useful.
   - What's unclear: Whether this adds enough value to justify 40 lines in the budget.
   - Recommendation: Include a compact 2-column table: symptom keyword -> reference file. ~20 lines instead of 40 to save budget.

## Sources

### Primary (HIGH confidence)
- Anthropic official best practices page (fetched 2026-02-03): SKILL.md body <500 lines, grep hints pattern, one-level references, fully qualified MCP tool names
- 11 reference files read in full: verified section headers, content structure, anti-patterns
- REQUIREMENTS.md: STRUCT-02, STRUCT-05, CROSS-01, CROSS-02, INTEG-01, INTEG-02

### Secondary (MEDIUM confidence)
- Anthropic blog "Equipping agents for the real world": progressive disclosure architecture
- Multiple community deep-dives confirming progressive disclosure patterns

### Tertiary (LOW confidence)
- None -- all findings verified against official sources or existing project files

## Metadata

**Confidence breakdown:**
- Architecture (body structure): HIGH - Anthropic official docs explicitly recommend this pattern
- Breaking changes inventory: HIGH - Verified against all 11 reference files
- Decision matrices content: HIGH - Already written in reference files, synthesis is straightforward
- Grep hint patterns: HIGH - Reference file headings are consistent and verifiable
- MCP boundary: HIGH - Official docs specify fully qualified tool names; boundary is a project decision
- Line budget: MEDIUM - Estimated 390 lines fits <500 but needs verification during implementation

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (stable -- skill authoring patterns unlikely to change in 30 days)
