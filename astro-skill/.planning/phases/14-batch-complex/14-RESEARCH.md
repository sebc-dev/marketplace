# Phase 14: Batch Complex - Research

**Researched:** 2026-02-04
**Domain:** XML container application to 5 complex reference files, completing all 11 reference files
**Confidence:** HIGH

## Summary

Phase 14 applies the validated XML container pattern (Phase 12 pilot + Phase 13 batch simple) to the 5 remaining reference files: build-deploy.md, routing-navigation.md, data-content.md, styling-performance.md, and security-advanced.md. These are "complex" because they are larger (262-343 lines, 11,559-13,408 bytes), have more sections (12-15 per file), and contain structural edge cases not encountered in Phase 13: MCP callouts (4 total across 2 files), a horizontal rule divider, a content-less section header, and naming edge cases with special characters (`.assetsignore`, `_headers`, `MDX / Markdoc`, `Remark/Rehype`).

The key finding is that despite being labeled "complex," all 5 files have flat structure (zero `###` subsections), which makes the mechanical tagging straightforward. The real complexity is in tag naming decisions (special characters in headers) and the security-advanced.md structural anomaly where `## MDX/Markdoc Advanced Setup` is a content-less divider header immediately followed by `## Remark/Rehype Plugin Config`. None of the 5 files have `###` subsections, eliminating nesting decisions entirely.

Phase 13 achieved an average overhead of 2.81% across 5 files. These 5 complex files are larger, so the per-tag overhead percentage will be even lower. Estimated average: ~2.4%.

**Primary recommendation:** Process files in ascending complexity order per CONTEXT.md (build-deploy, routing-navigation, data-content, styling-performance, security-advanced). Apply CONTEXT.md naming rules strictly -- direct header-to-snake_case conversion with suffixes kept (unlike Phase 13 which shortened names). Each file gets 1 plan, validated and committed independently.

## Standard Stack

Identical to Phase 13. No libraries, frameworks, or runtime dependencies.

### Core

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| XML tags (Claude-native) | Semantic section boundaries | Validated in Phases 12-13 (avg 2.81% overhead, zero breakage) |
| Markdown | Content formatting inside containers | Preserved byte-identical per INT-01 |
| `grep -n` | Section navigation validation | All grep patterns from SKILL.md must return exactly 1 match |
| `git diff` | Content integrity validation | Ensures only XML tag lines are added |
| `wc -c` | Token overhead approximation | Character-based proxy validated (2.81% avg in Phase 13) |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `grep -c '^<[a-z_]*>$'` | Tag well-formedness | Open tag count must equal close tag count |
| `git diff \| grep '^+' \| grep -v '^+<'` | Non-XML change detection | Must return empty for each file |

### Alternatives Considered

None -- all choices locked by CONTEXT.md and validated by Phases 12-13.

## Architecture Patterns

### Complete Tag Maps for All 5 Files

#### 1. build-deploy.md (262 lines, 13,408 bytes, 13 sections)

| Line | Header | Proposed Tag | SKILL.md Grep? | Notes |
|------|--------|-------------|:-:|-------|
| 5 | `## Quick Reference` | `<quick_reference>` | No | Universal tag |
| 20 | `## Output Mode Decision Matrix` | `<output_mode_decision_matrix>` | Yes | Per CONTEXT.md: keep "Decision Matrix" suffix |
| 33 | `## Deployment Target Decision Matrix` | `<deployment_target_decision_matrix>` | Yes | Per CONTEXT.md: keep "Decision Matrix" suffix |
| 44 | `## Dev/Preview Workflow Matrix` | `<dev_preview_workflow_matrix>` | Yes | Slash becomes underscore per CONTEXT.md |
| 55 | `## Package.json Scripts` | `<package_json_scripts>` | Yes | Dot removed, standard snake_case |
| 81 | `## GitHub Actions CI/CD` | `<github_actions_ci_cd>` | Yes | Slash becomes underscore per CONTEXT.md |
| 128 | `## .assetsignore for Workers Static Assets` | `<assetsignore_for_workers_static_assets>` | Yes | Per CONTEXT.md: brute word-for-word, drop leading dot |
| 138 | `## Adapter Options` | `<adapter_options>` | Yes | Direct conversion |
| 151 | `## CLI Flags Reference` | `<cli_flags_reference>` | No | No grep pattern in SKILL.md |
| 169 | `## Debugging Workflow` | `<debugging_workflow>` | Yes | Direct conversion |
| 208 | `## VS Code Configuration` | `<vs_code_configuration>` | Yes | Direct conversion |
| 231 | `## Anti-patterns` | `<anti_patterns>` | Yes | Universal tag |
| 247 | `## Troubleshooting` | `<troubleshooting>` | Yes | Universal tag |

**Tags:** 13 (3 universal + 10 domain-specific)
**MCP callouts:** 3 (lines 126, 167, 206) -- all stay inside parent section tags:
- Line 126: inside `<github_actions_ci_cd>`
- Line 167: inside `<cli_flags_reference>`
- Line 206: inside `<debugging_workflow>`
**Estimated overhead:** 26 lines x ~30 avg bytes = ~780 bytes. 780/13,408 = **~5.8%**

**OVERHEAD ALERT:** At 5.8%, this triggers the "5.0-6.0% review" threshold from XML-CONVENTIONS.md. The long tag names are the cause:
- `output_mode_decision_matrix` (29 chars x 2 lines = ~62 bytes)
- `deployment_target_decision_matrix` (34 chars x 2 lines = ~72 bytes)
- `assetsignore_for_workers_static_assets` (39 chars x 2 lines = ~82 bytes)
- `dev_preview_workflow_matrix` (28 chars x 2 lines = ~60 bytes)

CONTEXT.md says to keep suffixes like "Decision Matrix" and do "brute word for word" conversion. The 5.0-6.0% threshold says "review subsection tags (apply queryability test)" -- but there are no subsections here, just long names from long headers. Per Claude's Discretion on overhead threshold, the planner should verify after applying tags. If overhead hits >6.0%, shortening may be necessary despite CONTEXT.md preference.

**SKILL.md grep patterns (11):**
```
grep -n "## Output Mode Decision Matrix" references/build-deploy.md
grep -n "## Deployment Target Decision Matrix" references/build-deploy.md
grep -n "## Dev/Preview Workflow Matrix" references/build-deploy.md
grep -n "## Package.json Scripts" references/build-deploy.md
grep -n "## GitHub Actions CI/CD" references/build-deploy.md
grep -n "## .assetsignore" references/build-deploy.md
grep -n "## Adapter Options" references/build-deploy.md
grep -n "## Debugging Workflow" references/build-deploy.md
grep -n "## VS Code Configuration" references/build-deploy.md
grep -n "## Anti-patterns" references/build-deploy.md
grep -n "## Troubleshooting" references/build-deploy.md
```

---

#### 2. routing-navigation.md (273 lines, 11,922 bytes, 12 sections)

| Line | Header | Proposed Tag | SKILL.md Grep? | Notes |
|------|--------|-------------|:-:|-------|
| 5 | `## Quick Reference` | `<quick_reference>` | No | Universal tag |
| 20 | `## Routing Strategy Decision Matrix` | `<routing_strategy_decision_matrix>` | Yes | Keep "Decision Matrix" suffix |
| 35 | `## Redirect Method Selection` | `<redirect_method_selection>` | Yes | Keep "Selection" suffix |
| 46 | `## Route Priority Reference` | `<route_priority_reference>` | Yes | Direct conversion |
| 59 | `## Dynamic Routes with getStaticPaths` | `<dynamic_routes_with_get_static_paths>` | Yes | camelCase split to snake_case |
| 100 | `## Cloudflare Route Configuration` | `<cloudflare_route_configuration>` | Yes | Direct conversion |
| 128 | `## Middleware Pattern` | `<middleware_pattern>` | Yes | Keep "Pattern" suffix |
| 168 | `## Catch-all Route Guard Pattern` | `<catch_all_route_guard_pattern>` | Yes | Hyphen becomes underscore, keep "Pattern" |
| 191 | `## API Endpoint Pattern` | `<api_endpoint_pattern>` | No | No grep pattern in SKILL.md |
| 224 | `## ClientRouter` | `<client_router>` | Yes | camelCase split to snake_case |
| 243 | `## Anti-patterns` | `<anti_patterns>` | Yes | Universal tag |
| 260 | `## Troubleshooting` | `<troubleshooting>` | Yes | Universal tag |

**Tags:** 12 (3 universal + 9 domain-specific)
**MCP callouts:** 0
**Estimated overhead:** 24 lines x ~28 avg bytes = ~672 bytes. 672/11,922 = **~5.6%**

**OVERHEAD ALERT:** Also in the 5.0-6.0% review zone. Long tag names:
- `routing_strategy_decision_matrix` (33 chars x 2 = ~70 bytes)
- `dynamic_routes_with_get_static_paths` (37 chars x 2 = ~78 bytes)
- `catch_all_route_guard_pattern` (30 chars x 2 = ~64 bytes)
- `cloudflare_route_configuration` (31 chars x 2 = ~66 bytes)

Same guidance as build-deploy.md: verify after application, shorten if >6.0%.

**SKILL.md grep patterns (10):**
```
grep -n "## Routing Strategy Decision Matrix" references/routing-navigation.md
grep -n "## Redirect Method Selection" references/routing-navigation.md
grep -n "## Route Priority Reference" references/routing-navigation.md
grep -n "## Dynamic Routes with getStaticPaths" references/routing-navigation.md
grep -n "## Cloudflare Route Configuration" references/routing-navigation.md
grep -n "## Middleware Pattern" references/routing-navigation.md
grep -n "## Catch-all Route Guard Pattern" references/routing-navigation.md
grep -n "## ClientRouter" references/routing-navigation.md
grep -n "## Anti-patterns" references/routing-navigation.md
grep -n "## Troubleshooting" references/routing-navigation.md
```

---

#### 3. data-content.md (290 lines, 11,559 bytes, 13 sections)

| Line | Header | Proposed Tag | SKILL.md Grep? | Notes |
|------|--------|-------------|:-:|-------|
| 5 | `## Quick Reference` | `<quick_reference>` | No | Universal tag |
| 20 | `## Loader Selection Matrix` | `<loader_selection_matrix>` | Yes | Direct conversion |
| 33 | `## Actions vs API Routes` | `<actions_vs_api_routes>` | Yes | Direct conversion |
| 46 | `## Content Layer Config` | `<content_layer_config>` | Yes | Direct conversion |
| 80 | `## CSV File Loader` | `<csv_file_loader>` | No | No grep pattern in SKILL.md |
| 108 | `## Inline Async Loader` | `<inline_async_loader>` | No | No grep pattern in SKILL.md |
| 135 | `## Astro Actions Basic Signature` | `<astro_actions_basic_signature>` | Yes | Direct conversion |
| 165 | `## MDX / Markdoc Decision` | `<mdx_markdoc_decision>` | Yes | Per CONTEXT.md: slash becomes underscore |
| 179 | `## Rendering Content` | `<rendering_content>` | Yes | Direct conversion |
| 205 | `## Querying Collections` | `<querying_collections>` | No | No grep pattern in SKILL.md |
| 223 | `## SSR Data Fetching on Cloudflare` | `<ssr_data_fetching_on_cloudflare>` | Yes | Direct conversion |
| 260 | `## Anti-patterns` | `<anti_patterns>` | Yes | Universal tag |
| 277 | `## Troubleshooting` | `<troubleshooting>` | Yes | Universal tag |

**Tags:** 13 (3 universal + 10 domain-specific)
**MCP callouts:** 0
**Estimated overhead:** 26 lines x ~25 avg bytes = ~650 bytes. 650/11,559 = **~5.6%**

**OVERHEAD ALERT:** Also in the 5.0-6.0% review zone. Long tag names:
- `astro_actions_basic_signature` (30 chars x 2 = ~64 bytes)
- `ssr_data_fetching_on_cloudflare` (32 chars x 2 = ~68 bytes)
- `loader_selection_matrix` (24 chars x 2 = ~52 bytes)

**SKILL.md grep patterns (9):**
```
grep -n "## Loader Selection Matrix" references/data-content.md
grep -n "## Actions vs API Routes" references/data-content.md
grep -n "## Content Layer Config" references/data-content.md
grep -n "## Astro Actions Basic Signature" references/data-content.md
grep -n "## MDX / Markdoc Decision" references/data-content.md
grep -n "## Rendering Content" references/data-content.md
grep -n "## SSR Data Fetching on Cloudflare" references/data-content.md
grep -n "## Anti-patterns" references/data-content.md
grep -n "## Troubleshooting" references/data-content.md
```

---

#### 4. styling-performance.md (296 lines, 11,673 bytes, 12 sections)

| Line | Header | Proposed Tag | SKILL.md Grep? | Notes |
|------|--------|-------------|:-:|-------|
| 5 | `## Quick Reference` | `<quick_reference>` | No | Universal tag |
| 22 | `## Image Service Selection` | `<image_service_selection>` | Yes | Keep "Selection" suffix |
| 32 | `## Image Component Patterns` | `<image_component_patterns>` | Yes | Direct conversion |
| 79 | `## Scoped Style Propagation` | `<scoped_style_propagation>` | Yes | Direct conversion |
| 115 | `## CSS Approach Selection` | `<css_approach_selection>` | Yes | Keep "Selection" suffix |
| 127 | `## Tailwind v4 Setup` | `<tailwind_v4_setup>` | Yes | Direct conversion |
| 171 | `## Caching Strategy` | `<caching_strategy>` | Yes | Direct conversion |
| 185 | `## _headers File Pattern` | `<headers_file_pattern>` | Yes | Per CONTEXT.md: drop leading underscore, brute word-for-word |
| 213 | `## Prefetch Strategy` | `<prefetch_strategy>` | Yes | Direct conversion |
| 243 | `## SSR Cache Headers` | `<ssr_cache_headers>` | No | No grep pattern in SKILL.md |
| 266 | `## Anti-patterns` | `<anti_patterns>` | Yes | Universal tag |
| 283 | `## Troubleshooting` | `<troubleshooting>` | Yes | Universal tag |

**Tags:** 12 (3 universal + 9 domain-specific)
**MCP callouts:** 0
**Estimated overhead:** 24 lines x ~24 avg bytes = ~576 bytes. 576/11,673 = **~4.9%**

**Overhead OK:** Just under 5% threshold. Shorter tag names in this file help.

**SKILL.md grep patterns (10):**
```
grep -n "## Image Service Selection" references/styling-performance.md
grep -n "## Image Component Patterns" references/styling-performance.md
grep -n "## Scoped Style Propagation" references/styling-performance.md
grep -n "## CSS Approach Selection" references/styling-performance.md
grep -n "## Tailwind v4 Setup" references/styling-performance.md
grep -n "## Caching Strategy" references/styling-performance.md
grep -n "## _headers File Pattern" references/styling-performance.md
grep -n "## Prefetch Strategy" references/styling-performance.md
grep -n "## Anti-patterns" references/styling-performance.md
grep -n "## Troubleshooting" references/styling-performance.md
```

---

#### 5. security-advanced.md (343 lines, 13,272 bytes, 15 sections)

| Line | Header | Proposed Tag | SKILL.md Grep? | Notes |
|------|--------|-------------|:-:|-------|
| 5 | `## Quick Reference` | `<quick_reference>` | No | Universal tag |
| 22 | `## Security Decision Matrix` | `<security_decision_matrix>` | Yes | Direct conversion |
| 30 | `## Security Headers Middleware` | `<security_headers_middleware>` | Yes | Direct conversion |
| 62 | `## Auth Middleware Pattern` | `<auth_middleware_pattern>` | Yes | Keep "Pattern" suffix |
| 86 | `## Actions Security Pattern` | `<actions_security_pattern>` | Yes | Keep "Pattern" suffix |
| 115 | `## Secrets Management` | `<secrets_management>` | Yes | Direct conversion |
| 148 | `## CSP Config` | `<csp_config>` | Yes | Direct conversion |
| 176 | `## MDX/Markdoc Advanced Setup` | `<mdx_markdoc_advanced_setup>` | Yes | Slash -> underscore. **STRUCTURAL EDGE CASE** (see below) |
| 178 | `## Remark/Rehype Plugin Config` | `<remark_rehype_plugin_config>` | Yes | Slash -> underscore |
| 210 | `## Custom Component Mapping` | `<custom_component_mapping>` | Yes | Direct conversion |
| 235 | `## Markdoc Custom Tags` | `<markdoc_custom_tags>` | No | No grep pattern in SKILL.md |
| 264 | `## Shiki Dual Theme CSS` | `<shiki_dual_theme_css>` | No | No grep pattern in SKILL.md |
| 292 | `## Custom Remark Plugin` | `<custom_remark_plugin>` | No | No grep pattern in SKILL.md |
| 313 | `## Anti-patterns` | `<anti_patterns>` | Yes | Universal tag |
| 330 | `## Troubleshooting` | `<troubleshooting>` | Yes | Universal tag |

**Tags:** 15 (3 universal + 12 domain-specific)
**MCP callouts:** 1 (line 146) -- inside `<secrets_management>`
**Horizontal rule:** Line 174 (`---`) -- between `## CSP Config` and `## MDX/Markdoc Advanced Setup`. Must stay OUTSIDE tags (between closing `</csp_config>` and opening `<mdx_markdoc_advanced_setup>`).
**Estimated overhead:** 30 lines x ~24 avg bytes = ~720 bytes. 720/13,272 = **~5.4%**

**OVERHEAD NOTE:** In the 5.0-6.0% review zone. With 15 tags, this is expected. Per CONTEXT.md: "If the 15 are semantically distinct, 15 tags is legitimate. The 5% threshold decides automatically."

**STRUCTURAL EDGE CASE: Content-less `## MDX/Markdoc Advanced Setup`**

Lines 176-177 show:
```
## MDX/Markdoc Advanced Setup

## Remark/Rehype Plugin Config
```

The `## MDX/Markdoc Advanced Setup` header has NO content -- it is immediately followed by `## Remark/Rehype Plugin Config`. This is a section divider/category header, not a content section.

**Options:**
1. **Tag it with zero content** -- `<mdx_markdoc_advanced_setup>` wraps only the `## MDX/Markdoc Advanced Setup` header line. The tag contains a header and nothing else.
2. **Merge with next section** -- Include `## MDX/Markdoc Advanced Setup` inside `<remark_rehype_plugin_config>` as an introductory header.
3. **Leave untagged** -- Skip tagging this empty section.

**Recommendation:** Option 1 (tag it with zero content). Rationale:
- CONTEXT.md says "every `##` section gets its tag"
- SKILL.md has a grep pattern for it (`grep -n "## MDX/Markdoc Advanced Setup"`)
- Keeping it as its own tag preserves the grep pattern and follows the "every `##` gets a tag" rule
- The tag will contain only the header line, which is minimal overhead (~56 bytes)
- Option 2 would break the grep pattern (header would be inside the wrong tag)
- Option 3 violates the "every `##` wrapped" requirement

**Merger analysis (per CONTEXT.md discretion):**

The 15 sections break into two semantic groups separated by `---`:
- **Security group** (lines 5-173): Quick Reference, Security Decision Matrix, Security Headers Middleware, Auth Middleware Pattern, Actions Security Pattern, Secrets Management, CSP Config
- **Advanced content group** (lines 176-344): MDX/Markdoc Advanced Setup, Remark/Rehype Plugin Config, Custom Component Mapping, Markdoc Custom Tags, Shiki Dual Theme CSS, Custom Remark Plugin, Anti-patterns, Troubleshooting

Within each group, all sections are semantically distinct units. No two sections cover the same topic closely enough to justify merging. The only "merger candidate" is `## MDX/Markdoc Advanced Setup` with `## Remark/Rehype Plugin Config`, but since both have SKILL.md grep patterns, merging would break navigation.

**Recommendation:** Keep all 15 tags. They are semantically distinct. The 5.4% overhead is within the review zone but below the 6% reduction threshold.

**SKILL.md grep patterns (11):**
```
grep -n "## Security Decision Matrix" references/security-advanced.md
grep -n "## Security Headers Middleware" references/security-advanced.md
grep -n "## Auth Middleware Pattern" references/security-advanced.md
grep -n "## Actions Security Pattern" references/security-advanced.md
grep -n "## Secrets Management" references/security-advanced.md
grep -n "## CSP Config" references/security-advanced.md
grep -n "## MDX/Markdoc Advanced Setup" references/security-advanced.md
grep -n "## Remark/Rehype Plugin Config" references/security-advanced.md
grep -n "## Custom Component Mapping" references/security-advanced.md
grep -n "## Anti-patterns" references/security-advanced.md
grep -n "## Troubleshooting" references/security-advanced.md
```

---

### Tag Naming Rules Applied (CONTEXT.md Decisions)

Unlike Phase 13 which shortened names (e.g., `hydration_directives` from `## Hydration Directive Decision Matrix`), Phase 14 CONTEXT.md explicitly states:

1. **Direct header-to-snake_case conversion** -- no shortcuts or simplification
2. **Keep suffixes** like "Decision Matrix", "Selection", "Pattern"
3. **Special characters:**
   - `.assetsignore` -> `assetsignore` (drop leading dot)
   - `_headers` -> `headers` (drop leading underscore)
   - `MDX / Markdoc` -> `mdx_markdoc` (space-slash-space becomes underscore)
   - `Remark/Rehype` -> `remark_rehype` (slash becomes underscore)
   - `CI/CD` -> `ci_cd` (slash becomes underscore)
   - `getStaticPaths` -> `get_static_paths` (camelCase split)
   - `ClientRouter` -> `client_router` (camelCase split)
   - `Package.json` -> `package_json` (dot removed)
   - `Dev/Preview` -> `dev_preview` (slash becomes underscore)
   - `v4` stays as `v4` (version number)

**Consequence:** Tag names are longer than Phase 13, pushing overhead into the 5-6% review zone for 3 of 5 files. This is an accepted tradeoff per CONTEXT.md.

### Processing Order (from CONTEXT.md)

| Order | File | Tags | Bytes | Est. Overhead | MCP Callouts | Edge Cases |
|-------|------|:----:|------:|:----:|:----:|------------|
| 1 | build-deploy.md | 13 | 13,408 | ~5.8% | 3 | Long tag names |
| 2 | routing-navigation.md | 12 | 11,922 | ~5.6% | 0 | camelCase headers |
| 3 | data-content.md | 13 | 11,559 | ~5.6% | 0 | Slash in header |
| 4 | styling-performance.md | 12 | 11,673 | ~4.9% | 0 | Underscore-prefix header |
| 5 | security-advanced.md | 15 | 13,272 | ~5.4% | 1 | HR divider, empty section header, most tags |

**Totals:** 65 tags across 5 files (61,834 bytes total content)

### Pattern: Tag Application (Same as Phases 12-13)

```markdown
# File Title (NO tag wrapper)

Subtitle text (NO tag wrapper)

<quick_reference>
## Quick Reference

1. Rule one
2. Rule two
</quick_reference>

<domain_specific_tag>
## Domain Section

Content, tables, code blocks...

> **Cloudflare MCP:** callout stays inside parent tag
</domain_specific_tag>

<anti_patterns>
## Anti-patterns

| Don't | Do | Severity |
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Fix |
</troubleshooting>
```

### Pattern: Horizontal Rule Between Sections (security-advanced.md)

```markdown
</csp_config>

---

<mdx_markdoc_advanced_setup>
## MDX/Markdoc Advanced Setup
</mdx_markdoc_advanced_setup>

<remark_rehype_plugin_config>
## Remark/Rehype Plugin Config
...
</remark_rehype_plugin_config>
```

The `---` horizontal rule stays between closing and opening tags, outside both containers. It is NOT tagged. The `## MDX/Markdoc Advanced Setup` tag wraps only the header with no content body.

### Anti-Patterns to Avoid

- **DO NOT modify any content** -- not even whitespace, typos, or reordering (INT-01)
- **DO NOT shorten tag names** -- CONTEXT.md says direct conversion, keep suffixes
- **DO NOT tag the `---` horizontal rule** -- it stays between sections
- **DO NOT merge `## MDX/Markdoc Advanced Setup` with the next section** -- both have grep patterns
- **DO NOT add blank lines between tags and content** -- compact format per conventions
- **DO NOT tag file titles** (`# Title`) or subtitle text
- **DO NOT add `###` nesting** -- all files are flat (no `###` subsections exist)
- **DO NOT panic at 5-6% overhead** -- it's the review zone, not the failure zone

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token counting | Custom tokenizer | `wc -c` before/after | Character proxy validated in pilot and Phase 13 |
| Grep validation | Manual check | Bash loop over SKILL.md patterns per file | Automated, reproducible |
| Content integrity | Visual diff | `git diff \| grep '^+' \| grep -v '^+<'` | Eyes miss small changes |
| Tag well-formedness | Manual counting | `grep -c '^<[a-z_]*>$'` vs `grep -c '^</[a-z_]*>$'` | Open must equal close |
| Cross-file universal tag check | Manual comparison | `grep -l '<quick_reference>' references/*.md \| wc -l` | Must return 11 after Phase 14 |

**Key insight:** The validation script from Phase 13 works identically. The only addition is expanding the cross-file check from 6 files to 11.

## Common Pitfalls

### Pitfall 1: Overhead in the Review Zone (5-6%)

**What goes wrong:** Tag names derived directly from long headers (e.g., `deployment_target_decision_matrix`) push overhead above 5%.
**Why it happens:** CONTEXT.md mandates keeping suffixes like "Decision Matrix", producing longer names than Phase 13's shortened approach.
**How to avoid:** Verify overhead after tagging. If a file exceeds 6.0%, it enters the "reduce" zone. At that point, consider shortening the longest tag names (Claude's Discretion on overhead).
**Warning signs:** `wc -c` showing >6.0% increase.

### Pitfall 2: Content-less Section Header in security-advanced.md

**What goes wrong:** `## MDX/Markdoc Advanced Setup` (line 176) is a divider with no content. Tagging it naively could produce a tag that wraps the next section's content.
**Why it happens:** The next `##` header (`## Remark/Rehype Plugin Config`) is on line 178, only 2 lines later.
**How to avoid:** The closing tag `</mdx_markdoc_advanced_setup>` goes immediately after the header line (line 176), wrapping only the header. A blank line separates it from the next opening tag.
**Warning signs:** `<remark_rehype_plugin_config>` content appearing inside `<mdx_markdoc_advanced_setup>`.

### Pitfall 3: Horizontal Rule Placement in security-advanced.md

**What goes wrong:** The `---` on line 174 gets included inside `<csp_config>` or `<mdx_markdoc_advanced_setup>`.
**Why it happens:** It sits between two sections and could be considered part of either.
**How to avoid:** The `---` stays outside both tags. `</csp_config>` closes before the `---`, and `<mdx_markdoc_advanced_setup>` opens after the `---`.
**Warning signs:** `---` showing inside a tag in the diff.

### Pitfall 4: MCP Callouts in build-deploy.md

**What goes wrong:** The 3 MCP callouts (blockquotes starting with `>`) get separated from their parent sections.
**Why it happens:** Callouts might look like section boundaries.
**How to avoid:** Each callout stays inside its parent section tag. They are NOT their own sections. The callout on line 126 is the last content of `<github_actions_ci_cd>`, the one on line 167 is the last content of `<cli_flags_reference>`, and the one on line 206 is the last content of `<debugging_workflow>`.
**Warning signs:** A callout appearing outside its parent tag in the diff.

### Pitfall 5: HTML-like Tags Inside Code Blocks

**What goes wrong:** The `grep -c '^<[a-z_]*>$'` validation pattern matches HTML tags inside code blocks (e.g., `<html>`, `<head>`, `<style>`, `<nav>`).
**Why it happens:** These files contain code examples with HTML tags that start on column 1.
**How to avoid:** The grep pattern `'^<[a-z_]*>$'` requires the ENTIRE line to be just the tag. Code block HTML tags like `<html>`, `<head>`, `<style>`, `<nav>` match this pattern. Use a more specific pattern that excludes common HTML tags, or manually verify the count.

**Actual false positives found in current (untagged) files:**
- routing-navigation.md: `<html>` (line 231) -- 1 false positive
- styling-performance.md: `<head>`, `<style>` (x2), `<nav>` -- 4 false positives (but these are inside code blocks and indented, so `^` anchor may not match)

**Verification approach:** After tagging, use `grep -n '^<[a-z_]*>$'` and manually verify each match is an XML container tag, not an HTML tag inside a code block. Alternative: use the tag names explicitly: `grep -c '^<quick_reference>$\|^<anti_patterns>$\|...'`.

### Pitfall 6: Accidentally Including Subtitle Text in First Tag

**What goes wrong:** build-deploy.md has a subtitle on lines 3-4 ("Wrangler workflow, CI/CD pipelines..."). This gets included inside `<quick_reference>`.
**Why it happens:** The subtitle sits between `# Title` (line 1) and `## Quick Reference` (line 5).
**How to avoid:** `<quick_reference>` opens at line 5 (before `## Quick Reference`), not at line 3. The subtitle stays untagged, same as the file title.

## Code Examples

### Validation Script (Per File)

```bash
FILE="build-deploy"
REF=".claude/skills/astro-cloudflare/references/${FILE}.md"
BASELINE=$(wc -c < "$REF")

# After tagging...
AFTER=$(wc -c < "$REF")

# 1. Grep patterns
echo "=== Grep Patterns ==="
grep "references/${FILE}.md" .claude/skills/astro-cloudflare/SKILL.md | \
  grep -oP 'grep -n "[^"]*" references/[^ `]*' | \
  while read cmd; do
    count=$(cd .claude/skills/astro-cloudflare && eval "$cmd" 2>/dev/null | wc -l)
    if [ "$count" -eq 1 ]; then
      echo "PASS: $cmd"
    else
      echo "FAIL ($count): $cmd"
    fi
  done

# 2. Diff integrity
echo "=== Diff Integrity ==="
NON_XML=$(git diff "$REF" | grep '^+' | grep -v '^+++' | grep -v '^+$' | grep -v '^+</?[a-z_]*>$')
[ -z "$NON_XML" ] && echo "PASS" || echo "FAIL: $NON_XML"

# 3. Overhead
echo "=== Overhead ==="
OVERHEAD=$(echo "scale=2; ($AFTER - $BASELINE) * 100 / $BASELINE" | bc)
echo "${OVERHEAD}%"

# 4. Tag balance
echo "=== Tag Balance ==="
OPEN=$(grep -c '^<[a-z_]*>$' "$REF")
CLOSE=$(grep -c '^</[a-z_]*>$' "$REF")
echo "Open: $OPEN, Close: $CLOSE"
[ "$OPEN" -eq "$CLOSE" ] && echo "PASS" || echo "FAIL"
```

### Cross-File Universal Tag Validation (After All 11 Files)

```bash
cd .claude/skills/astro-cloudflare
for tag in quick_reference anti_patterns troubleshooting; do
  count=$(grep -rl "<${tag}>" references/*.md | wc -l)
  echo "${tag}: ${count}/11 files"
done
# Expected: all 3 return "11/11 files"
```

## Complete Tag Budget Summary

| File | Sections | Tags | Baseline (bytes) | Est. Overhead (bytes) | Est. % |
|------|:--------:|:----:|------------------:|----------------------:|-------:|
| build-deploy.md | 13 | 13 | 13,408 | ~780 | ~5.8% |
| routing-navigation.md | 12 | 12 | 11,922 | ~672 | ~5.6% |
| data-content.md | 13 | 13 | 11,559 | ~650 | ~5.6% |
| styling-performance.md | 12 | 12 | 11,673 | ~576 | ~4.9% |
| security-advanced.md | 15 | 15 | 13,272 | ~720 | ~5.4% |
| **Phase 14 Totals** | **65** | **65** | **61,834** | **~3,398** | **~5.5%** |

**Comparison with Phase 13:** Phase 13 achieved 2.81% average overhead with shortened tag names. Phase 14 targets ~5.5% with full-length tag names per CONTEXT.md. This is higher but within acceptable limits (5.0-6.0% review zone). If actual overhead exceeds 6.0% on any file, shortening is warranted.

**Combined Phase 12-14 totals after completion:**
- Phase 12 (pilot): 1 file, 8 tags
- Phase 13 (batch simple): 5 files, 44 tags
- Phase 14 (batch complex): 5 files, 65 tags
- **Total: 11 files, 117 tags**

## State of the Art

| Phase 13 (Batch Simple) | Phase 14 (Batch Complex) | Impact |
|--------------------------|--------------------------|--------|
| 5 files, 44 tags, 2.81% avg overhead | 5 files, 65 tags, ~5.5% avg overhead | Higher overhead due to longer tag names (CONTEXT.md decision) |
| Shortened tag names (Claude's Discretion) | Full header-to-snake_case (CONTEXT.md locked) | Different naming strategy per user decision |
| No MCP callouts in any file | 4 MCP callouts across 2 files | MCP callouts stay inside parent tags |
| No horizontal rules | 1 horizontal rule in security-advanced.md | HR stays between tags, untagged |
| No content-less sections | 1 content-less section header | Tag wraps header only |
| 0 `###` subsections | 0 `###` subsections | All files are flat -- no nesting decisions |

## Open Questions

### 1. Overhead in the 5-6% Review Zone

- **What we know:** 3 of 5 files (build-deploy, routing-navigation, data-content) are estimated at 5.5-5.8%, in the "review" zone per XML-CONVENTIONS.md.
- **What's unclear:** Whether actual overhead after tagging will be closer to 5% or 6%. Estimates use average tag name length; actual may vary.
- **Recommendation:** Apply tags per CONTEXT.md rules. If any file exceeds 6.0%, invoke Claude's Discretion on overhead to shorten the longest tag names. Document the measured overhead in each plan's validation step.

### 2. Empty Section Tag for `## MDX/Markdoc Advanced Setup`

- **What we know:** This header has no content body. It serves as a divider between the security topics and the MDX/Markdoc topics.
- **What's unclear:** Whether a tag wrapping only a header (no content) causes any issues with Claude's section retrieval.
- **Recommendation:** Tag it. A tag with only a header is structurally valid. It preserves the SKILL.md grep pattern. The overhead is minimal (~56 bytes).

### 3. False Positives in Tag Count Validation

- **What we know:** Some code blocks contain HTML tags like `<html>`, `<style>`, `<nav>` that may match `'^<[a-z_]*>$'`.
- **What's unclear:** Whether these tags appear at column 1 (start of line) in the final tagged file or are indented inside code blocks.
- **Recommendation:** After tagging each file, verify tag count manually by listing all matches with `grep -n`. If false positives appear, use an explicit pattern matching only known XML container tag names.

## Sources

### Primary (HIGH confidence)
- `.claude/skills/astro-cloudflare/references/build-deploy.md` -- Full file read, 262 lines, 13 sections mapped
- `.claude/skills/astro-cloudflare/references/routing-navigation.md` -- Full file read, 273 lines, 12 sections mapped
- `.claude/skills/astro-cloudflare/references/data-content.md` -- Full file read, 290 lines, 13 sections mapped
- `.claude/skills/astro-cloudflare/references/styling-performance.md` -- Full file read, 296 lines, 12 sections mapped
- `.claude/skills/astro-cloudflare/references/security-advanced.md` -- Full file read, 343 lines, 15 sections mapped, structural anomalies identified
- `.claude/skills/astro-cloudflare/SKILL.md` -- All grep patterns extracted (11+10+9+10+11 = 51 patterns)
- `.planning/XML-CONVENTIONS.md` -- Authoritative tagging rules (113 lines)
- `.planning/phases/14-batch-complex/14-CONTEXT.md` -- User decisions constraining Phase 14
- `.planning/phases/13-batch-simple/13-VERIFICATION.md` -- Phase 13 results (2.81% avg overhead, 51/51 grep patterns)
- `.planning/phases/13-batch-simple/13-RESEARCH.md` -- Phase 13 research patterns and tag maps
- `.planning/phases/13-batch-simple/13-01-PLAN.md` -- Plan format reference

### Secondary (MEDIUM confidence)
- Byte counts via `wc -c` -- measured directly on untagged files
- Overhead estimates -- extrapolated from Phase 13 actual results with tag name length adjustment

### Tertiary (LOW confidence)
None -- all findings based on direct analysis of project files.

## Metadata

**Confidence breakdown:**
- Tag maps: HIGH -- every `##` header identified with line numbers, tag names derived per CONTEXT.md rules
- Architecture: HIGH -- all 5 files fully analyzed, edge cases catalogued
- Pitfalls: HIGH -- derived from Phase 13 experience + file-specific structural analysis
- Overhead estimates: MEDIUM -- extrapolated from Phase 13 actuals, may vary by ~0.5% in practice

**Research date:** 2026-02-04
**Valid until:** Indefinite (structural transformation of existing files; no external dependencies)
