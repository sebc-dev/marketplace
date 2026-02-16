# Phase 13: Batch Simple - Research

**Researched:** 2026-02-04
**Domain:** XML container application to 5 simpler reference files, replicating the validated Phase 12 pilot pattern
**Confidence:** HIGH

## Summary

Phase 13 applies the XML container pattern validated in Phase 12 (cloudflare-platform.md, 8 tags, 3.48% overhead) to 5 reference files: rendering-modes.md, project-structure.md, components-islands.md, seo-i18n.md, and typescript-testing.md. The work is purely mechanical -- adding XML tag lines around `##` sections following XML-CONVENTIONS.md. Zero content changes allowed.

The key finding is that all 5 files follow the same structural pattern as the pilot: `##` sections as primary blocks, with `###` subsections only in project-structure.md (10 subsections under 2 parent `##` sections). The tag count ranges from 7 (rendering-modes.md) to 11 (seo-i18n.md, typescript-testing.md), all well within the overhead budget. One file (project-structure.md) requires a nesting decision for `###` subsections that have their own SKILL.md grep patterns.

**Primary recommendation:** Process files in ascending complexity order: rendering-modes.md (7 tags, 0 subsections), components-islands.md (9 tags, 0 subsections), seo-i18n.md (11 tags, 0 subsections), typescript-testing.md (11 tags, 0 subsections, 2 MCP callouts), project-structure.md (6 tags + subsection decision, 10 `###` headers). Each file gets 1 plan, validated and committed independently.

## Standard Stack

This is a structural reformatting task identical to Phase 12. No libraries, frameworks, or runtime dependencies.

### Core

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| XML tags (Claude-native) | Semantic section boundaries | Validated in Phase 12 pilot (3.48% overhead, zero breakage) |
| Markdown | Content formatting inside containers | Preserved byte-identical per INT-01 |
| `grep -n` | Section navigation validation | All grep patterns from SKILL.md must return exactly 1 match |
| `git diff` | Content integrity validation | Ensures only XML tag lines are added |
| `wc -c` | Token overhead approximation | Character-based proxy validated in pilot (3.48%) |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `grep -c '^<[a-z_]*>$'` | Tag well-formedness | Open tag count must equal close tag count |
| `git diff \| grep '^+' \| grep -v '^+<'` | Non-XML change detection | Must return empty for each file |

### Alternatives Considered

None -- all choices locked by CONTEXT.md and validated by Phase 12 pilot.

## Architecture Patterns

### File Analysis: Complete Section Maps

#### 1. rendering-modes.md (simplest -- 7 sections, 0 subsections)

**Baseline:** 161 lines, 9,230 bytes

| Line | Header | Tag | Content |
|------|--------|-----|---------|
| 3 | `## Quick Reference` | `<quick_reference>` | 8 numbered rules (lines 3-12) |
| 14 | `## Output Modes` | `<output_modes>` | Table + code blocks (lines 14-52) |
| 54 | `## Decision Matrix` | `<decision_matrix>` | Project type/mode table (lines 54-67) |
| 69 | `## Server Islands` | `<server_islands>` | Code examples + props rules + table (lines 69-120) |
| 122 | `## Feature Compatibility` | `<feature_compatibility>` | Feature/mode matrix table (lines 122-133) |
| 135 | `## Anti-patterns` | `<anti_patterns>` | Don't/Do/Impact table (lines 135-148) |
| 149 | `## Troubleshooting` | `<troubleshooting>` | Symptom/Cause/Fix table (lines 149-161) |

**Tags:** 7 (3 universal + 4 domain-specific)
**Estimated overhead:** 14 lines x ~25 avg bytes = ~350 bytes. 350/9,230 = **~3.8%**
**Subsection nesting:** None needed (no `###` headers)
**MCP callouts:** None
**SKILL.md grep patterns:** 6 (excludes Quick Reference which has no grep pattern)
**Edge cases:** None -- clean flat structure identical to pilot

#### 2. components-islands.md (9 sections, 0 subsections)

**Baseline:** 265 lines, 12,044 bytes

| Line | Header | Tag | Content |
|------|--------|-----|---------|
| 5 | `## Quick Reference` | `<quick_reference>` | 12 numbered rules (lines 5-18) |
| 20 | `## Hydration Directive Decision Matrix` | `<hydration_directive_decision_matrix>` | Scenario/directive table (lines 20-33) |
| 35 | `## Island vs Static vs Server Island` | `<island_vs_static_vs_server_island>` | Need/approach table (lines 35-48) |
| 50 | `## Nanostores Pattern` | `<nanostores_pattern>` | Code blocks + key rules (lines 50-117) |
| 119 | `## Server Island Pattern` | `<server_island_pattern>` | Code blocks + constraints (lines 119-158) |
| 160 | `## Slots and Conditional Rendering` | `<slots_and_conditional_rendering>` | Code blocks + slot rules (lines 160-198) |
| 200 | `## Component Typing Patterns` | `<component_typing_patterns>` | Code blocks (lines 200-233) |
| 235 | `## Anti-patterns` | `<anti_patterns>` | Don't/Do/Severity table (lines 235-250) |
| 252 | `## Troubleshooting` | `<troubleshooting>` | Symptom/Cause/Fix table (lines 252-265) |

**Tags:** 9 (3 universal + 6 domain-specific)
**Estimated overhead:** 18 lines x ~35 avg bytes = ~630 bytes. 630/12,044 = **~5.2%**
**Overhead concern:** Slightly above 5% baseline due to long tag names. Review options:
- `hydration_directive_decision_matrix` (37 chars + angle brackets = 39 chars x 2 = 78 bytes)
- `island_vs_static_vs_server_island` (35 chars + angle brackets = 37 chars x 2 = 74 bytes)
- `slots_and_conditional_rendering` (32 chars + angle brackets = 34 chars x 2 = 68 bytes)
- `component_typing_patterns` (26 chars + angle brackets = 28 chars x 2 = 56 bytes)

**Tag name shortening recommendation (Claude's Discretion):**
Per CONTEXT.md, tag names derive from `## Header` via snake_case. These headers are long. However, CONTEXT.md says "Claude's Discretion" for domain-specific tag names. Shortened alternatives that preserve semantics:

| Full Derivation | Shortened | Rationale |
|----------------|-----------|-----------|
| `hydration_directive_decision_matrix` | `hydration_directives` | "Decision Matrix" is format, not content |
| `island_vs_static_vs_server_island` | `island_comparison` | Comparison semantics preserved |
| `slots_and_conditional_rendering` | `slots_and_rendering` | "Conditional" is implicit in content |
| `component_typing_patterns` | `component_typing` | "Patterns" is format-adjacent |
| `nanostores_pattern` | `nanostores` | "Pattern" is format, not content |
| `server_island_pattern` | `server_island` | "Pattern" is format, not content |

**Recommendation:** Use shortened names. They are more semantic (describe content, not format per XML-CONVENTIONS.md rule 1), reduce overhead, and still match `## Header` intent. With shortened names: ~18 lines x ~22 avg bytes = ~396 bytes. 396/12,044 = **~3.3%**.

**MCP callouts:** None
**SKILL.md grep patterns:** 8 (all `##` headers except Quick Reference)
**Edge cases:** None -- clean flat structure

#### 3. seo-i18n.md (11 sections, 0 subsections)

**Baseline:** 251 lines, 11,005 bytes

| Line | Header | Tag | Content |
|------|--------|-----|---------|
| 5 | `## Quick Reference` | `<quick_reference>` | 12 numbered rules (lines 5-18) |
| 20 | `## SEO Component Pattern` | `<seo_component>` | Code block + notes (lines 20-49) |
| 51 | `## Sitemap Config` | `<sitemap_config>` | Code block + notes (lines 51-80) |
| 82 | `## JSON-LD Structured Data` | `<json_ld>` | Code block + notes (lines 82-100) |
| 102 | `## RSS Endpoint` | `<rss_endpoint>` | Code block + notes (lines 102-128) |
| 130 | `## i18n Config` | `<i18n_config>` | Code block + notes (lines 130-153) |
| 155 | `## Hreflang Component` | `<hreflang>` | Code block + notes (lines 155-181) |
| 183 | `## Translation Decision Matrix` | `<translation_matrix>` | Scenario/solution table (lines 183-192) |
| 194 | `## Language Detection Middleware` | `<language_detection>` | Code block + notes (lines 194-223) |
| 225 | `## Anti-patterns` | `<anti_patterns>` | Don't/Do/Severity table (lines 225-238) |
| 240 | `## Troubleshooting` | `<troubleshooting>` | Symptom/Cause/Fix table (lines 240-251) |

**Tags:** 11 (3 universal + 8 domain-specific)
**Estimated overhead:** 22 lines x ~20 avg bytes = ~440 bytes. 440/11,005 = **~4.0%**
**Tag name decisions (Claude's Discretion):** Several headers benefit from semantic shortening:
- `seo_component_pattern` -> `seo_component` (drop "Pattern")
- `json_ld_structured_data` -> `json_ld` (recognizable abbreviation)
- `translation_decision_matrix` -> `translation_matrix` (drop "Decision")
- `language_detection_middleware` -> `language_detection` (drop "Middleware" -- format term)
- `hreflang_component` -> `hreflang` (the content domain IS hreflang)

**Soft threshold check:** 11 tags on 251 lines (1 tag per ~23 lines). Reasonable density, no over-tagging concern.
**MCP callouts:** None
**SKILL.md grep patterns:** 10 (all `##` headers except Quick Reference)
**Edge cases:** None -- clean flat structure

#### 4. typescript-testing.md (11 sections, 0 subsections)

**Baseline:** 282 lines, 12,725 bytes

| Line | Header | Tag | Content |
|------|--------|-----|---------|
| 5 | `## Quick Reference` | `<quick_reference>` | 14 numbered rules (lines 5-20) |
| 22 | `## TypeScript Config Decision Matrix` | `<typescript_config>` | Scenario/preset table + notes (lines 22-35) |
| 37 | `## env.d.ts Full Pattern` | `<env_types>` | Code block + key rules + MCP callout (lines 37-70) |
| 72 | `## Test Type Decision Matrix` | `<test_types>` | What-to-test/tool table (lines 72-85) |
| 87 | `## Vitest Config` | `<vitest_config>` | Code block + notes (lines 87-108) |
| 110 | `## Container API Test` | `<container_api>` | Code blocks (lines 110-163) |
| 165 | `## Cloudflare Bindings Test` | `<bindings_test>` | Code blocks + MCP callout (lines 165-207) |
| 209 | `## Playwright Config` | `<playwright_config>` | Code block + notes (lines 209-235) |
| 237 | `## Package Scripts` | `<package_scripts>` | Code block (lines 237-251) |
| 253 | `## Anti-patterns` | `<anti_patterns>` | Don't/Do/Severity table (lines 253-266) |
| 268 | `## Troubleshooting` | `<troubleshooting>` | Symptom/Cause/Fix table (lines 268-282) |

**Tags:** 11 (3 universal + 8 domain-specific)
**Estimated overhead:** 22 lines x ~22 avg bytes = ~484 bytes. 484/12,725 = **~3.8%**
**Tag name decisions (Claude's Discretion):**
- `typescript_config_decision_matrix` -> `typescript_config` (drop format terms)
- `env_d_ts_full_pattern` -> `env_types` (semantic: it's about type declarations, not the filename)
- `test_type_decision_matrix` -> `test_types` (drop format terms)
- `container_api_test` -> `container_api` (drop "Test" -- the content IS the API usage pattern)
- `cloudflare_bindings_test` -> `bindings_test` (shorter, "Cloudflare" implicit in context)

**MCP callouts:** 2 (line 70 in env.d.ts section, line 207 in Bindings Test section -- both stay inside parent tags)
**SKILL.md grep patterns:** 10 (all `##` headers except Quick Reference)
**Edge cases:** MCP callouts must be included inside their parent tags (same pattern as pilot)

#### 5. project-structure.md (most complex -- 6 `##` sections, 10 `###` subsections)

**Baseline:** 250 lines, 9,239 bytes

| Line | Header | Tag | Content |
|------|--------|-----|---------|
| 5 | `## Quick Reference` | `<quick_reference>` | 8 numbered rules (lines 5-14) |
| 16 | `## File Organization` | `<file_organization>` | 2 subsections (lines 16-70) |
| 18 | `  ### Simple site (SSG)` | (inside parent) | Tree diagram (lines 18-36) |
| 38 | `  ### Complex site (SSG + SSR + Server Islands)` | (inside parent) | Tree diagram (lines 38-70) |
| 72 | `## Naming Conventions` | `<naming_conventions>` | Convention table (lines 72-90) |
| 92 | `## Config Templates` | `<config_templates>` | 8 subsections (lines 92-221) |
| 94 | `  ### astro.config.mjs -- SSG` | (inside parent) | Code block (lines 94-103) |
| 105 | `  ### astro.config.mjs -- SSR` | (inside parent) | Code block (lines 105-120) |
| 122 | `  ### astro.config.mjs -- Static default` | (inside parent) | Code block (lines 122-135) |
| 137 | `  ### tsconfig.json` | (inside parent) | Code block (lines 137-153) |
| 155 | `  ### src/env.d.ts` | (inside parent) | Code block (lines 155-173) |
| 175 | `  ### src/content.config.ts` | (inside parent) | Code block (lines 175-196) |
| 198 | `  ### package.json scripts` | (inside parent) | Code block (lines 198-211) |
| 213 | `  ### .gitignore entries` | (inside parent) | Code block (lines 213-221) |
| 223 | `## Anti-patterns` | `<anti_patterns>` | Don't/Do/Impact table (lines 223-236) |
| 238 | `## Troubleshooting` | `<troubleshooting>` | Symptom/Cause/Fix table (lines 238-250) |

**Tags:** 6 at `##` level (3 universal + 3 domain-specific)
**Estimated overhead (flat):** 12 lines x ~24 avg bytes = ~288 bytes. 288/9,239 = **~3.1%**

**Subsection nesting analysis:**

The `## Config Templates` section contains 8 `###` subsections. Five of these have their own SKILL.md grep patterns:
- `### astro.config.mjs -- SSG` -- grep pattern exists
- `### astro.config.mjs -- SSR` -- grep pattern exists
- `### tsconfig.json` -- grep pattern exists
- `### src/env.d.ts` -- grep pattern exists
- `### src/content.config.ts` -- grep pattern exists

Three do NOT have grep patterns:
- `### astro.config.mjs -- Static default with SSR opt-out` -- no grep pattern
- `### package.json scripts` -- no grep pattern
- `### .gitignore entries` -- no grep pattern

The `## File Organization` section contains 2 `###` subsections. Neither has SKILL.md grep patterns:
- `### Simple site (SSG)` -- no grep pattern
- `### Complex site (SSG + SSR + Server Islands)` -- no grep pattern

**Queryability test for `###` subsections:**

Per CONTEXT.md: "Could Claude need this section by itself?"

| Subsection | Queryable? | Rationale |
|-----------|-----------|-----------|
| `### Simple site (SSG)` | No | Only meaningful in context of File Organization |
| `### Complex site (SSG + SSR + Server Islands)` | No | Only meaningful in context of File Organization |
| `### astro.config.mjs -- SSG` | Yes | SKILL.md has grep pattern, independently useful config template |
| `### astro.config.mjs -- SSR` | Yes | SKILL.md has grep pattern, independently useful config template |
| `### astro.config.mjs -- Static default` | Marginal | No grep pattern, but independently useful |
| `### tsconfig.json` | Yes | SKILL.md has grep pattern, independently useful config |
| `### src/env.d.ts` | Yes | SKILL.md has grep pattern, independently useful type template |
| `### src/content.config.ts` | Yes | SKILL.md has grep pattern, independently useful config |
| `### package.json scripts` | Marginal | No grep pattern, but useful as standalone reference |
| `### .gitignore entries` | No | Too short (5 lines), not independently useful |

**Nesting recommendation:** Use flat structure for `## File Organization` (subsections are not independently queryable). For `## Config Templates`, the pilot decision was flat, and the same logic applies here even more strongly: there are 8 subsections, nesting all would add 16 extra tag lines (~400 bytes, pushing overhead to ~7.4%). Even nesting only the 5 with grep patterns adds 10 lines (~250 bytes, overhead ~5.8%). The flat approach preserves grep pattern functionality (headers are unchanged) with lower overhead.

**Recommendation:** Flat structure throughout. 6 `##`-level tags only. All `###` headers stay inside their parent tags without their own XML tags. This matches the pilot decision for `config_templates` and keeps overhead at ~3.1%.

**MCP callouts:** None
**SKILL.md grep patterns:** 9 (includes 5 for `###` subsections + 4 for `##` sections)
**Edge cases:**
- `### headers without parent ##` -- Per CONTEXT.md: "### without parent ## treated as ##". This does NOT apply here -- all `###` headers have parent `##` sections.
- `## File Organization` has a subtitle line (line 3: "Astro 5.x on Cloudflare...") that is NOT a section header. It sits between `# Project Structure` and `## Quick Reference` as descriptive text. This text has NO tag (it's file-level metadata like the title).

### Processing Order (Claude's Discretion -- Ascending Complexity)

| Order | File | Tags | Subsections | Complexity Factors |
|-------|------|------|-------------|-------------------|
| 1 | rendering-modes.md | 7 | 0 | Simplest structure, no subsections, no MCP callouts |
| 2 | components-islands.md | 9 | 0 | Flat, but long tag names need shortening decisions |
| 3 | seo-i18n.md | 11 | 0 | Most tags among flat files, but straightforward derivation |
| 4 | typescript-testing.md | 11 | 0 | Same tag count as seo-i18n, but has 2 MCP callouts to position |
| 5 | project-structure.md | 6 | 10 | Fewest `##` tags but 10 `###` subsections requiring nesting decisions |

### Pattern 1: Tag Application (Same as Pilot)

```markdown
# File Title (NO tag wrapper)

<quick_reference>
## Quick Reference

1. Rule one
2. Rule two
</quick_reference>

<domain_specific>
## Domain Section

Content...
</domain_specific>

<anti_patterns>
## Anti-patterns

| Don't | Do | Impact |
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Fix |
</troubleshooting>
```

### Pattern 2: Subtitle Text Between Title and First Section

project-structure.md has a descriptive subtitle on line 3 (between `# Project Structure` and `## Quick Reference`). This text stays OUTSIDE all tags, same as the file title:

```markdown
# Project Structure

Astro 5.x on Cloudflare: file organization, naming conventions, and config templates.

<quick_reference>
## Quick Reference
...
```

Similarly, components-islands.md (line 3), seo-i18n.md (line 3), and typescript-testing.md (line 3) have subtitle lines. All stay outside tags.

### Pattern 3: MCP Callouts Inside Parents

typescript-testing.md has 2 MCP callouts (lines 70 and 207). Both stay inside their parent section tags:
- Line 70 (`> **Cloudflare MCP:** ... Workers types`) -> inside `<env_types>`
- Line 207 (`> **Cloudflare MCP:** ... vitest-pool-workers`) -> inside `<bindings_test>`

### Pattern 4: Universal Tag Consistency Check (Success Criterion 2)

After Phase 13, all 6 processed files (pilot + 5) must use identical universal tag names:

| Tag | cloudflare-platform | rendering-modes | project-structure | components-islands | seo-i18n | typescript-testing |
|-----|:--:|:--:|:--:|:--:|:--:|:--:|
| `<quick_reference>` | Y | Y | Y | Y | Y | Y |
| `<anti_patterns>` | Y | Y | Y | Y | Y | Y |
| `<troubleshooting>` | Y | Y | Y | Y | Y | Y |

All 5 files have `## Quick Reference`, `## Anti-patterns`, and `## Troubleshooting` sections. All 3 universal tags will be present in all 6 files.

### Anti-Patterns to Avoid

- **DO NOT modify any content** -- not even whitespace normalization, typo fixes, or reordering (INT-01)
- **DO NOT add tags around file titles** -- `# Title` stays outside all containers
- **DO NOT add tags around subtitle text** -- descriptive lines between `#` title and first `##` stay outside
- **DO NOT nest `###` subsections** -- flat structure for all 5 files (pilot precedent)
- **DO NOT use long mechanical tag names** -- shorten to semantic content descriptors (e.g., `hydration_directives` not `hydration_directive_decision_matrix`)
- **DO NOT add blank lines between tags and content** -- compact format per conventions
- **DO NOT change section order** -- sections stay in their original position

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token counting | Custom tokenizer | `wc -c` before/after | Character proxy validated in pilot (3.48% measured vs ~3.9% estimated) |
| Grep validation | Manual check | Bash loop over SKILL.md patterns per file | Automated, reproducible, catches human error |
| Content integrity | Visual diff | `git diff \| grep '^+' \| grep -v '^+<'` | Eyes miss small changes; filter catches everything |
| Tag well-formedness | Manual counting | `grep -c '^<[a-z_]*>$'` vs `grep -c '^</[a-z_]*>$'` | Open must equal close |
| Cross-file universal tag check | Manual comparison | `grep -l '<quick_reference>' references/*.md \| wc -l` | Must return 6 after Phase 13 |

**Key insight:** All 4 validation checks from the pilot apply identically to each of the 5 files. Plus 1 new cross-file check for universal tag consistency (Success Criterion 2).

## Common Pitfalls

### Pitfall 1: Tag Name Inconsistency Across Files

**What goes wrong:** Using slightly different tag names for the same universal concept (e.g., `<anti_pattern>` singular vs `<anti_patterns>` plural).
**Why it happens:** Different files have slightly different `## Header` text (e.g., `## Anti-patterns` vs `## Anti-Patterns`). Mechanical derivation produces different tags.
**How to avoid:** Universal tags are FIXED names: `quick_reference`, `anti_patterns`, `troubleshooting`. Never derive them -- copy them exactly.
**Warning signs:** `grep -l '<anti_patterns>' references/*.md` returning fewer than 6 matches after Phase 13.

### Pitfall 2: Subtitle Lines Getting Wrapped in Tags

**What goes wrong:** The descriptive subtitle text between `# Title` and `## Quick Reference` gets included inside `<quick_reference>`.
**Why it happens:** The subtitle looks like section content, and the first `##` section starts nearby.
**How to avoid:** The opening `<quick_reference>` tag goes immediately before `## Quick Reference`, not before the subtitle text. The subtitle is file-level metadata like the title.
**Warning signs:** `git diff` showing the subtitle line inside a tag.

### Pitfall 3: Section Boundary Errors on Long Files

**What goes wrong:** A closing tag is placed too early or too late, cutting off content or including content from the next section.
**Why it happens:** Files with 11 sections (seo-i18n, typescript-testing) have many boundaries to manage.
**How to avoid:** For each section, identify the last content line (often a table row, code block closing, or note paragraph) and place `</tag>` immediately after it. The blank line separating sections goes AFTER the closing tag.
**Warning signs:** grep pattern returning a line number that falls inside the wrong tag.

### Pitfall 4: Accidentally Modifying Content While Adding Tags

**What goes wrong:** A content line is accidentally changed during tag insertion.
**Why it happens:** The task feels mechanical ("just add tags") so attention drops, especially by file 4 or 5.
**How to avoid:** After each file, run the diff integrity check. Every added line must be an XML tag line only.
**Warning signs:** `git diff` showing content changes.

### Pitfall 5: project-structure.md Subtitle Edge Case

**What goes wrong:** The subtitle on line 3 ("Astro 5.x on Cloudflare: file organization...") is treated as part of `## Quick Reference`.
**Why it happens:** It sits between the title and the first `##` section.
**How to avoid:** `<quick_reference>` opens at line 5 (before `## Quick Reference`), not at line 3 (before the subtitle). The subtitle stays untagged.
**Warning signs:** The subtitle appearing inside `<quick_reference>` in the diff.

### Pitfall 6: Overhead Exceeding 5% on components-islands.md

**What goes wrong:** Using full mechanical tag name derivation (e.g., `hydration_directive_decision_matrix`) produces tag names so long that overhead exceeds 5%.
**Why it happens:** XML-CONVENTIONS.md says "derive from ## Header via snake_case" but some headers are very long.
**How to avoid:** Use semantic shortening per Claude's Discretion. Convention rule 1 says tags should be "semantic (not format)" -- dropping format words like "Decision Matrix", "Pattern" is actually more aligned with the conventions.
**Warning signs:** `wc -c` showing overhead > 5% before committing.

## Code Examples

### Example 1: Validation Script for One File

```bash
FILE="rendering-modes"
REF=".claude/skills/astro-cloudflare/references/${FILE}.md"

# 1. Grep patterns (extract from SKILL.md)
echo "=== Grep Patterns ==="
grep "references/${FILE}.md" .claude/skills/astro-cloudflare/SKILL.md | \
  grep -oP 'grep -n "[^"]*" references/[^ `]*' | \
  while read cmd; do
    result=$(cd .claude/skills/astro-cloudflare && eval "$cmd" 2>/dev/null)
    count=$(cd .claude/skills/astro-cloudflare && eval "$cmd" 2>/dev/null | wc -l)
    if [ "$count" -eq 1 ]; then
      echo "PASS ($count match): $cmd"
    else
      echo "FAIL ($count matches): $cmd"
    fi
  done

# 2. Diff integrity
echo "=== Diff Integrity ==="
NON_XML=$(git diff "$REF" | grep '^+' | grep -v '^+++' | grep -v '^+$' | grep -v '^+</?[a-z_]*>$')
if [ -z "$NON_XML" ]; then
  echo "PASS: Only XML tag lines added"
else
  echo "FAIL: Non-XML changes detected:"
  echo "$NON_XML"
fi

# 3. Overhead
echo "=== Overhead ==="
AFTER=$(wc -c < "$REF")
echo "Size: $AFTER bytes"

# 4. Tag well-formedness
echo "=== Tag Balance ==="
OPEN=$(grep -c '^<[a-z_]*>$' "$REF")
CLOSE=$(grep -c '^</[a-z_]*>$' "$REF")
echo "Open: $OPEN, Close: $CLOSE"
[ "$OPEN" -eq "$CLOSE" ] && echo "PASS" || echo "FAIL"
```

### Example 2: Cross-File Universal Tag Validation

```bash
# After all 5 files are done, verify universal tags across all 6 processed files
cd .claude/skills/astro-cloudflare
for tag in quick_reference anti_patterns troubleshooting; do
  count=$(grep -l "<${tag}>" references/cloudflare-platform.md references/rendering-modes.md references/project-structure.md references/components-islands.md references/seo-i18n.md references/typescript-testing.md | wc -l)
  echo "${tag}: ${count}/6 files"
done
# Expected: all 3 return "6/6 files"
```

### Example 3: rendering-modes.md Tagged Structure (Simplest File)

```markdown
# Rendering Modes

<quick_reference>
## Quick Reference

1. Use `output: 'static'` (default)...
...
8. Implement `getStaticPaths()`...
</quick_reference>

<output_modes>
## Output Modes

| Aspect | `output: 'static'` | `output: 'server'` |
...code blocks...
</output_modes>

<decision_matrix>
## Decision Matrix

| Project Type | Mode | Config | Reasoning |
...
</decision_matrix>

<server_islands>
## Server Islands

Server Islands render dynamic components...
...code blocks and tables...
</server_islands>

<feature_compatibility>
## Feature Compatibility

| Feature | SSG | SSR | Server Islands |
...
</feature_compatibility>

<anti_patterns>
## Anti-patterns

| Don't | Do | Impact |
...
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Fix |
...
</troubleshooting>
```

## Complete Tag Budget Summary

| File | `##` Sections | Tags | Baseline (bytes) | Est. Overhead | Est. % |
|------|:---:|:---:|---:|---:|---:|
| rendering-modes.md | 7 | 7 | 9,230 | ~350 | ~3.8% |
| components-islands.md | 9 | 9 | 12,044 | ~396 | ~3.3% |
| seo-i18n.md | 11 | 11 | 11,005 | ~440 | ~4.0% |
| typescript-testing.md | 11 | 11 | 12,725 | ~484 | ~3.8% |
| project-structure.md | 6 | 6 | 9,239 | ~288 | ~3.1% |
| **Totals** | **44** | **44** | **54,243** | **~1,958** | **~3.6%** |

All files comfortably within the 5% threshold. Aggregate overhead matches the pilot extrapolation (~3.5%).

## State of the Art

| Phase 12 (Pilot) | Phase 13 (Batch) | Impact |
|-------------------|-------------------|--------|
| 1 file, 8 tags, 3.48% overhead | 5 files, 44 tags, ~3.6% avg overhead | Pattern scales linearly |
| Flat structure validated | Flat structure applied to all 5 files | Consistency confirmed |
| Tag derivation rules established | Rules applied mechanically with semantic shortening | Domain-specific names per file |
| 4 validation checks defined | Same 4 checks + 1 cross-file check | Validation scales |

## Open Questions

### 1. Tag Name Shortening Authority

- **What we know:** CONTEXT.md grants Claude's Discretion for domain-specific tag names. XML-CONVENTIONS.md says names should be "semantic (not format)".
- **What's unclear:** Whether dropping words like "Decision Matrix", "Pattern" from tag names is acceptable given the convention says "derive from ## Header via snake_case."
- **Recommendation:** Use shortened names. The convention says tags "describe content semantically" -- format words (Matrix, Pattern) are not semantic. The derivation rule is a starting point, not a rigid formula. Shortened names are MORE aligned with convention rule 1 than mechanical full derivation.

### 2. project-structure.md Nesting Potential

- **What we know:** `## Config Templates` has 8 `###` subsections, 5 with SKILL.md grep patterns. These pass the queryability test. But the pilot used flat structure for `config_templates`.
- **What's unclear:** Whether nesting would add enough value to justify the overhead increase.
- **Recommendation:** Stay flat. Grep patterns work unchanged. Overhead stays at ~3.1%. The pilot set the precedent. Nesting can be explored in Phase 14 (complex files) if needed.

## Sources

### Primary (HIGH confidence)
- `.claude/skills/astro-cloudflare/references/rendering-modes.md` -- Full file read, 161 lines, 7 sections mapped
- `.claude/skills/astro-cloudflare/references/project-structure.md` -- Full file read, 250 lines, 6+10 sections mapped
- `.claude/skills/astro-cloudflare/references/components-islands.md` -- Full file read, 265 lines, 9 sections mapped
- `.claude/skills/astro-cloudflare/references/seo-i18n.md` -- Full file read, 251 lines, 11 sections mapped
- `.claude/skills/astro-cloudflare/references/typescript-testing.md` -- Full file read, 282 lines, 11 sections mapped
- `.claude/skills/astro-cloudflare/SKILL.md` -- All grep patterns extracted per file (6+9+8+10+10 = 43 patterns)
- `.planning/XML-CONVENTIONS.md` -- Authoritative tagging rules (113 lines)
- `.claude/skills/astro-cloudflare/references/cloudflare-platform.md` -- Pilot reference (8 tags, 3.48% overhead)
- `.planning/phases/12-pilot/12-02-SUMMARY.md` -- Pilot validation results
- `.planning/phases/12-pilot/12-VERIFICATION.md` -- Phase 12 verification report

### Secondary (MEDIUM confidence)
- `.planning/phases/12-pilot/12-RESEARCH.md` -- Pilot research with architecture patterns and anti-patterns
- `.planning/phases/12-pilot/12-CONTEXT.md` -- User decisions that constrained pilot

### Tertiary (LOW confidence)
None -- all findings are based on direct analysis of project files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- identical to Phase 12, no new tools
- Architecture: HIGH -- all 5 files fully analyzed, section maps complete, tag budgets calculated
- Pitfalls: HIGH -- derived from pilot experience + file-specific structural analysis

**Research date:** 2026-02-04
**Valid until:** Indefinite (structural transformation of existing files; no external dependencies)
