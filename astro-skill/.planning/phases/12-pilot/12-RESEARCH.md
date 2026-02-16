# Phase 12: Pilot - Research

**Researched:** 2026-02-04
**Domain:** XML container pattern applied to `cloudflare-platform.md` as validated pilot template
**Confidence:** HIGH

## Summary

Phase 12 applies XML semantic containers to `cloudflare-platform.md` (242 lines, 9,002 bytes, 8 `##` sections + 2 `###` subsections) as the single pilot file. The work has two deliverables produced in sequence: (1) an XML-CONVENTIONS.md document in `.planning/`, and (2) the restructured pilot file. Zero content changes are allowed -- only XML tag lines are added.

The critical insight from this research is that **the user's CONTEXT.md decisions override several recommendations from the earlier v0.3 research documents** (FEATURES.md, ARCHITECTURE.md). Specifically: headers are KEPT inside tags (earlier research proposed removing them in some cases), tag-header duplication IS allowed (earlier research said no duplication), and 1-level nesting IS allowed (earlier research recommended flat-only). This research document reflects the CONTEXT.md decisions as the authoritative source.

**Primary recommendation:** Build XML-CONVENTIONS.md first defining the 3 universal tags and the derivation rules for domain-specific tags, then apply the pattern to cloudflare-platform.md mechanically, then validate with the 3 automated checks (grep, diff, overhead).

## Standard Stack

This is a structural reformatting task. There are no libraries, frameworks, or runtime dependencies.

### Core

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| XML tags (Claude-native) | Semantic section boundaries | Anthropic trains Claude to recognize XML tags as attention delimiters |
| Markdown | Content formatting inside containers | Preserves readability, compatible with skill loading |
| `grep -n` | Section navigation validation | All 8 patterns for this file must return exactly 1 match each |
| `git diff` | Content integrity validation | Ensures only XML tag lines are added |
| `wc -c` | Token overhead approximation | Character-based proxy sufficient for 5% threshold |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `bash` scripting | Automated grep validation | Extract patterns from SKILL.md, execute against modified file |
| `diff` + filter | Non-XML change detection | Filter git diff output to isolate lines that are NOT XML tags |

### Alternatives Considered

None -- the CONTEXT.md decisions lock all technology choices. This is manual text editing with automated validation.

## Architecture Patterns

### Reconciliation: CONTEXT.md Overrides Earlier Research

The v0.3 research documents (FEATURES.md, ARCHITECTURE.md, STACK.md) were produced before the user discussion that created CONTEXT.md. Several recommendations conflict. The CONTEXT.md decisions are authoritative:

| Topic | Earlier Research Said | CONTEXT.md Decided | Impact |
|-------|----------------------|-------------------|--------|
| Header-tag duplication | "No tag/header duplication -- if tag is `<anti_patterns>`, do NOT add `## Anti-patterns` inside" (FEATURES TS-1, TS-3, TS-4) | "Duplication avec headers OK : un tag peut reprendre le concept du header si c'est descriptif" | Tags CAN match their header name. `<anti_patterns>` wrapping `## Anti-patterns` is valid. |
| Header removal | FEATURES proposed removing `## Quick Reference` when tag replaces it | "Le tag englobe le header" -- header stays INSIDE the tag | ALL `## Header` lines are preserved. Zero content modification. |
| Nesting | ARCHITECTURE Decision 2: "Flat siblings only (No Nesting)" | "1 niveau de nesting max : un tag parent peut contenir des tags enfants" | 1-level nesting IS allowed (e.g., `<config_templates>` could contain `<wrangler_config>` and `<dev_vars>`) |
| SKILL.md grep changes | FEATURES TS-7 proposed updating ~40-60 grep patterns | Prior decision: "SKILL.md requires zero changes" | Zero SKILL.md changes. All 8 cloudflare-platform.md grep patterns must match unchanged. |
| Tag format | FEATURES proposed `<pattern name="bindings_access">` with attributes | CONTEXT: "Tags domain-specific : nommés selon le contenu" (no attributes mentioned) | Use plain descriptive tag names like `<bindings_access>`, no attributes |
| Blank lines | ARCHITECTURE Rule 6 debated blank lines around tags | CONTEXT: "Pas de ligne vide entre tag d'ouverture/fermeture et contenu -- format compact" | Compact: `<tag>\n## Header\n...content...\n</tag>` |

### File Structure: cloudflare-platform.md Section Map

The pilot file has this exact structure (8 `##` sections, 2 `###` subsections):

```
Line   1: # Cloudflare Platform                    (file title - NO tag)
Line   2: (blank)
Line   3: ## Quick Reference                       (lines 3-13, 9 rules)
Line  14: (blank)
Line  15: ## Bindings Access                       (lines 15-68, code blocks + MCP callouts)
Line  69: (blank)
Line  70: ## Workers Limits                        (lines 70-81, table + MCP callout)
Line  82: (blank)
Line  83: ## Node.js Compatibility                 (lines 83-112, tables + MCP callout)
Line 113: (blank)
Line 114: ## Environment Variables                  (lines 114-137, code + rules)
Line 137: (blank)
Line 138: ## Config Templates                       (lines 138-216, parent with 2 ###)
Line 140:   ### wrangler.jsonc                      (lines 140-204)
Line 206:   ### .dev.vars                           (lines 206-216, code + MCP callout)
Line 217: (blank)
Line 218: ## Anti-patterns                          (lines 218-229, table)
Line 230: (blank)
Line 231: ## Troubleshooting                        (lines 231-242, table)
```

### Pattern 1: Universal Tags (Compact Format)

The 3 universal tags are applied identically across all files:

```markdown
<quick_reference>
## Quick Reference

1. Rule one
2. Rule two
</quick_reference>

<anti_patterns>
## Anti-patterns

| Don't | Do | Impact |
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Fix |
</troubleshooting>
```

**Key properties:**
- Tag opens on its own line immediately BEFORE the `## Header`
- NO blank line between `<tag>` and `## Header` (compact format per CONTEXT.md)
- NO blank line between last content line and `</tag>` (compact format)
- The `## Header` is INSIDE the tag (part of the semantic block)
- Existing blank lines BETWEEN sections are preserved (the blank line between `</tag>` and the next `<tag>`)

### Pattern 2: Domain-Specific Tags (Claude's Discretion)

For cloudflare-platform.md, the domain-specific tags should be derived from section content. Recommended mapping:

| Section | Recommended Tag | Rationale |
|---------|----------------|-----------|
| `## Bindings Access` | `<bindings_access>` | Direct match to content domain -- how to access bindings |
| `## Workers Limits` | `<workers_limits>` | Platform constraints reference table |
| `## Node.js Compatibility` | `<nodejs_compatibility>` | Compatibility status reference table |
| `## Environment Variables` | `<environment_variables>` | Env var patterns and rules |
| `## Config Templates` | `<config_templates>` | Parent container for config examples |

### Pattern 3: Nesting Decision for Config Templates

The `## Config Templates` section contains two `###` subsections that are independently queryable (SKILL.md has separate grep patterns for each: `### wrangler.jsonc` and `### .dev.vars`).

**Decision point:** Should `### wrangler.jsonc` and `### .dev.vars` receive their own nested tags inside `<config_templates>`?

**Analysis using the CONTEXT.md test -- "est-ce interrogeable independamment?":**
- `### wrangler.jsonc` -- YES, it has its own grep pattern in SKILL.md and is a standalone config template
- `### .dev.vars` -- YES, it has its own grep pattern in SKILL.md and is a standalone config template

**Recommendation:** Use 1-level nesting here. This is the exact case the CONTEXT.md nesting rule was designed for:

```markdown
<config_templates>
## Config Templates

<wrangler_config>
### wrangler.jsonc

```jsonc
{...}
```
</wrangler_config>

<dev_vars>
### .dev.vars

```bash
...
```

> **Cloudflare MCP:** For complete wrangler.jsonc schema reference...
</dev_vars>
</config_templates>
```

**Overhead cost:** 4 additional tag lines (2 open + 2 close for nested tags). At ~15 bytes each, adds ~60 bytes. Acceptable for demonstrating the nesting pattern in the pilot.

**Alternative (flat only):** Skip nested tags, keep `<config_templates>` as a single container with both `###` sections inside. This is simpler and the grep patterns for `### wrangler.jsonc` and `### .dev.vars` still work because the `### ` headers remain unchanged.

**My recommendation:** Use flat approach (no nesting) for the pilot. Reason: the grep patterns already find the `###` headers, nesting adds complexity without measurable benefit for this file, and a simpler pilot is easier to validate. Reserve nesting for files where subsections are truly independent semantic units that do NOT have existing grep patterns pointing at their headers.

### Pattern 4: MCP Callouts Inside Parents

MCP callouts (blockquotes starting with `> **Cloudflare MCP:**`) remain inside their parent container. No dedicated tag. Three sections contain MCP callouts:

- `## Bindings Access` (line 67-68)
- `## Workers Limits` (line 81)
- `## Node.js Compatibility` (line 112)
- `### .dev.vars` inside `## Config Templates` (line 216)

All stay inside their enclosing tag.

### Anti-Patterns to Avoid

- **DO NOT modify any content inside sections** -- not even whitespace normalization, typo fixes, or reordering
- **DO NOT add XML attributes** -- no `name="..."` or `type="..."` on any tag
- **DO NOT remove `## Header` lines** -- every header stays intact inside its tag
- **DO NOT add blank lines between tags and headers** -- compact format per CONTEXT.md
- **DO NOT add tags around the `# Cloudflare Platform` title** -- it stays outside all containers as file-level metadata
- **DO NOT add XML comments** -- they add overhead without user validation
- **DO NOT change the order of sections** -- section order stays identical to current file

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token counting | Custom tokenizer | `wc -c` before/after comparison | Character count is a sufficient proxy for 5% threshold; actual tokenizer API adds unnecessary complexity |
| Grep validation | Manual check of each pattern | Bash one-liner extracting patterns from SKILL.md | Automated = reproducible, catch human error |
| Content integrity | Visual diff inspection | `git diff` filtered to show only non-XML lines | Eyes miss small changes; script catches everything |
| Tag well-formedness | Manual counting | `grep -c '<[a-z_]*>' file` vs `grep -c '</[a-z_]*>' file` | Open count must equal close count |

**Key insight:** All validation can be done with standard Unix tools. No custom scripts beyond simple one-liners.

## Common Pitfalls

### Pitfall 1: Accidentally Modifying Content

**What goes wrong:** While adding XML tags, the editor accidentally changes whitespace, moves content between sections, or introduces typos.
**Why it happens:** The task feels mechanical ("just add tags") so attention drops.
**How to avoid:** After adding tags, run `git diff`. Every changed line must start with `<` or `</` followed by a snake_case tag name. Any other changes = failure.
**Warning signs:** Diff showing more than 16 changed lines (8 open + 8 close tags = 16 lines for flat approach, or 20 for nested approach).

### Pitfall 2: Blank Line Confusion at Section Boundaries

**What goes wrong:** Extra blank lines are added between tags and headers, or existing blank lines between sections are removed.
**Why it happens:** The compact format decision (no blank lines between tag and header) conflicts with visual readability instincts.
**How to avoid:** The rule is precise: `<tag>\n## Header` (tag immediately followed by header on next line). Blank lines exist only BETWEEN sections (between `</tag>` and the next `<tag>`), exactly as they exist now between sections.
**Warning signs:** File gains more or fewer blank lines than expected.

### Pitfall 3: Grep Patterns Breaking Due to Unexpected Characters

**What goes wrong:** A grep pattern returns 0 matches after restructuring.
**Why it happens:** Should not happen if XML tags are on their own lines and headers remain unchanged. But could happen if: (a) a header is accidentally modified, (b) a tag is placed on the same line as a header, or (c) the file is saved with different encoding.
**How to avoid:** Run all 8 grep patterns against the file immediately after saving. Each must return exactly 1 match.
**Warning signs:** Any grep returning 0 or 2+ matches.

### Pitfall 4: Config Templates Section Boundary

**What goes wrong:** The closing `</config_templates>` tag is placed too early (before `### .dev.vars`) or the MCP callout after `.dev.vars` is left outside the container.
**Why it happens:** `## Config Templates` spans from line 138 to line 216, with the MCP callout on line 216 belonging to the `.dev.vars` subsection but visually appearing near the section boundary.
**How to avoid:** The `</config_templates>` closing tag must go AFTER line 216 (the MCP callout), BEFORE the blank line that precedes `## Anti-patterns` on line 218.
**Warning signs:** MCP callout orphaned outside its parent container.

### Pitfall 5: Over-Tagging the Pilot

**What goes wrong:** Adding tags to every subsection, every code block, every paragraph. The pilot becomes a test of maximum tagging rather than a validated template.
**Why it happens:** Enthusiasm for the XML pattern leads to "more is better" thinking.
**How to avoid:** Apply the "interrogeable independamment?" test from CONTEXT.md. Default is `##` level tagging. Only promote `###` to tagged status if it passes the test AND has a grep pattern in SKILL.md.
**Warning signs:** Token overhead exceeding 4% on a 9KB file (budget is under 5%, but this file should be well under at ~3%).

## Code Examples

### Example 1: Complete Pilot File Structure (Recommended)

This shows the flat approach (no nesting) for maximum simplicity:

```markdown
# Cloudflare Platform

<quick_reference>
## Quick Reference

1. Add `nodejs_compat` to `compatibility_flags` -- required for most npm packages
2. Access bindings via `Astro.locals.runtime.env`, never import `cloudflare:workers` directly
...
9. Avoid expensive initialization in global scope -- 1-second startup timeout
</quick_reference>

<bindings_access>
## Bindings Access

Access KV, D1, R2, and other bindings through `locals.runtime.env` in every Astro context.
...code blocks...
> **Cloudflare MCP:** For complete KV/D1/R2 binding method signatures...
</bindings_access>

<workers_limits>
## Workers Limits

| Resource | Free | Paid | Workaround |
...
> **Cloudflare MCP:** For current limits and pricing details...
</workers_limits>

<nodejs_compatibility>
## Node.js Compatibility

| Module | Status | Notes |
...
> **Cloudflare MCP:** For per-module compatibility details...
</nodejs_compatibility>

<environment_variables>
## Environment Variables

**`.dev.vars`** -- Local development secrets...
...
</environment_variables>

<config_templates>
## Config Templates

### wrangler.jsonc

```jsonc
{...}
```

### .dev.vars

```bash
...
```

> **Cloudflare MCP:** For complete wrangler.jsonc schema reference...
</config_templates>

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

### Example 2: Validation Grep Script

```bash
# Extract all grep patterns for cloudflare-platform.md from SKILL.md and execute them
grep 'cloudflare-platform.md' SKILL.md | \
  grep -oP '`grep -n ".*?" references/cloudflare-platform.md`' | \
  sed 's/`//g' | \
  while read cmd; do
    result=$(eval "$cmd" 2>/dev/null)
    if [ -z "$result" ]; then
      echo "FAIL: $cmd"
    else
      echo "PASS: $cmd -> $result"
    fi
  done
```

Expected output: 8 PASS lines, 0 FAIL lines.

### Example 3: Diff Integrity Check

```bash
# After committing, check that all non-blank changed lines are XML tags only
git diff HEAD~1 -- references/cloudflare-platform.md | \
  grep '^[+-]' | \
  grep -v '^[+-][+-][+-]' | \
  grep -v '^[+-]$' | \
  grep -vP '^[+-]</?[a-z_]+>$'
# Output should be EMPTY -- any lines here are non-XML content changes
```

### Example 4: Token Overhead Calculation

```bash
# Before (current file)
BEFORE=$(wc -c < references/cloudflare-platform.md)

# After (restructured file)
AFTER=$(wc -c < references/cloudflare-platform.md)

# Calculate overhead
echo "scale=2; ($AFTER - $BEFORE) * 100 / $BEFORE" | bc
# Expected: ~2.5-3.5%
```

### Example 5: Tag Well-Formedness Check

```bash
FILE=references/cloudflare-platform.md
OPEN=$(grep -cP '^<[a-z_]+>$' "$FILE")
CLOSE=$(grep -cP '^</[a-z_]+>$' "$FILE")
echo "Open tags: $OPEN, Close tags: $CLOSE"
# Must be equal. Expected: 8 each (flat) or 10 each (with nesting)
```

## State of the Art

| Old Approach (v0.2) | Current Approach (v0.3 Pilot) | When Changed | Impact |
|---------------------|-------------------------------|--------------|--------|
| Flat Markdown with `##` headers | XML containers wrapping `##` sections | v0.3 (now) | Improved Claude attention targeting |
| Visual `---` separators | XML open/close tags as boundaries | v0.3 (now) | Semantic boundaries vs visual-only |
| All content undifferentiated | Universal tags identify recurring patterns | v0.3 (now) | Consistent cross-file vocabulary |

**Note on Anthropic official guidance (verified 2026-02-04):**
- "There are no canonical 'best' XML tags -- we recommend tag names make sense with the information they surround" (Anthropic docs)
- "Nest tags for hierarchical content" (Anthropic docs)
- "Be consistent: use the same tag names throughout your prompts" (Anthropic docs)
- Anthropic explicitly recommends mixing XML with Markdown for structured prompts

## Open Questions

### 1. Nesting in Config Templates: Flat vs Nested?

- **What we know:** CONTEXT.md allows 1-level nesting. `### wrangler.jsonc` and `### .dev.vars` pass the "independently queryable" test. Both have grep patterns in SKILL.md.
- **What's unclear:** Whether nesting adds enough value to justify the complexity in the pilot template. If the pilot uses nesting, phases 13-14 will apply it everywhere possible, potentially increasing overhead.
- **Recommendation:** Start flat for the pilot. Nesting is an optional enhancement that can be added later if the flat pattern proves insufficient. A simpler pilot is a better template.

### 2. Exact Placement of Section Boundary Blank Lines

- **What we know:** CONTEXT.md says "pas de ligne vide entre tag d'ouverture/fermeture et contenu." Current file has blank lines between sections.
- **What's unclear:** Should the existing blank line between sections appear BEFORE the opening tag or AFTER the closing tag? Both produce the same visual result.
- **Recommendation:** Place blank line AFTER the closing tag, BEFORE the next opening tag. This mirrors the current blank-line-between-sections pattern:

```markdown
...last content line
</section_a>

<section_b>
## Section B Header
```

This keeps each tag group self-contained (open tag, content, close tag) with blank lines only between groups.

### 3. XML-CONVENTIONS.md Scope

- **What we know:** Must be created BEFORE the pilot. Must contain naming rules, before/after examples, validation checklist. Must be in `.planning/`.
- **What's unclear:** How detailed should the domain-specific tag derivation rules be? Too prescriptive = phases 13-14 have no flexibility. Too vague = re-discussion needed.
- **Recommendation:** Define 3-5 concrete derivation rules with examples from cloudflare-platform.md. The pilot file itself serves as the primary reference for phases 13-14.

## Implementation Sequence

The phase has a clear dependency chain:

```
1. Create XML-CONVENTIONS.md  (rules defined)
        |
        v
2. Record baseline metrics     (wc -c, grep results)
        |
        v
3. Apply XML tags to cloudflare-platform.md  (mechanical transformation)
        |
        v
4. Validate: grep patterns     (8/8 must pass)
        |
        v
5. Validate: diff integrity    (zero non-XML changes)
        |
        v
6. Validate: token overhead    (< 5%)
        |
        v
7. Validate: tag well-formedness (open = close count)
```

Steps 4-7 can run in parallel after step 3.

## Pilot File: Exact Tag Budget

| Tag | Lines Covered | Content Summary |
|-----|--------------|-----------------|
| `<quick_reference>` | 3-13 | 9 numbered rules |
| `<bindings_access>` | 15-68 | Code blocks (4 contexts), AsyncLocalStorage, 2 MCP callouts |
| `<workers_limits>` | 70-81 | Resource limits table, 1 MCP callout |
| `<nodejs_compatibility>` | 83-112 | Node module status table, compat flags table, 1 MCP callout |
| `<environment_variables>` | 114-137 | Code blocks, key rules list |
| `<config_templates>` | 138-216 | wrangler.jsonc template, .dev.vars template, 1 MCP callout |
| `<anti_patterns>` | 218-229 | Don't/Do/Impact table (8 rows) |
| `<troubleshooting>` | 231-242 | Symptom/Cause/Fix table (8 rows) |

**Total tags:** 8 open + 8 close = 16 lines added
**Estimated bytes:** 16 lines x ~22 avg bytes = ~352 bytes
**Overhead:** 352 / 9,002 = **~3.9%** (well under 5% threshold)

## Sources

### Primary (HIGH confidence)
- `.claude/skills/astro-cloudflare/references/cloudflare-platform.md` -- Full file read, section boundaries mapped
- `.claude/skills/astro-cloudflare/SKILL.md` -- All 8 grep patterns for cloudflare-platform.md verified
- `.planning/phases/12-pilot/12-CONTEXT.md` -- User decisions that constrain implementation
- `.planning/research/v0.3-ARCHITECTURE.md` -- Prior architecture research (overridden by CONTEXT.md where conflicting)
- `.planning/research/v0.3-FEATURES.md` -- Prior features research (overridden by CONTEXT.md where conflicting)
- `docs/cc-skills/XML Markdown pour references Skill Caude Code.md` -- Project XML guide

### Secondary (MEDIUM confidence)
- [Anthropic: Use XML tags to structure your prompts](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/use-xml-tags) -- Verified 2026-02-04. Confirms: no canonical best tag names, recommends consistency, nesting OK for hierarchical content.
- `.planning/research/v0.3-STACK.md` -- Token overhead estimates (3.3% aggregate, ~3.1% for cloudflare-platform.md specifically)

### Tertiary (LOW confidence)
- Microsoft 2024 study on 10-42% improvement -- Referenced in project XML guide but original paper not located. Specific percentages are approximate.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no external dependencies, purely text editing + Unix tools
- Architecture: HIGH -- CONTEXT.md decisions are unambiguous, file structure fully mapped
- Pitfalls: HIGH -- derived from direct analysis of the pilot file's structure and edge cases

**Research date:** 2026-02-04
**Valid until:** Indefinite (this is a one-time structural transformation; no external dependencies that could change)
