# XML Container Conventions

Single source of truth for XML tagging rules applied to all reference files.

## 1. Tag Naming Rules

- All tag names use **strict snake_case** (lowercase letters and underscores only)
- Tag names describe content **semantically** (not format)
- Tag-header duplication is allowed when descriptive (e.g., `<platform_proxy>` for `## Platform Proxy`)
- No XML attributes -- plain tags only (`<tag>`, not `<tag attr="x">`)
- No XML comments (`<!-- -->` forbidden)

## 2. Universal Tags

Present when matching content exists. Never forced on empty content.

| Tag | Use When Section Contains |
|-----|--------------------------|
| `<quick_reference>` | Cheatsheet, matrix, or summary table |
| `<anti_patterns>` | Common errors with corrections |
| `<troubleshooting>` | Diagnostic tables or decision trees |

These 3 names are **fixed** -- never rename them per file.

## 3. Domain-Specific Tag Derivation

Derive the tag name from the `## Header` by converting to snake_case:

| Header | Tag |
|--------|-----|
| `## Bindings Access` | `<bindings_access>` |
| `## Node.js Compatibility` | `<nodejs_compatibility>` |
| `## Workers Limits` | `<workers_limits>` |
| `## Platform Proxy` | `<platform_proxy>` |

**Subsection test:** A `###` gets its own tag only if it is **independently queryable**. If not, it stays inside the parent tag untagged.

## 4. Tag Placement Format

Compact format -- no blank lines between tag and content.

**BEFORE:**

```
## Quick Reference

1. Rule one
2. Rule two
```

**AFTER:**

```
<quick_reference>
## Quick Reference

1. Rule one
2. Rule two
</quick_reference>
```

Key rules:

- Tag opens **before** the `##` header
- Tag closes **after** the last content line of the section
- **No blank line** between opening tag and header
- **No blank line** between last content line and closing tag
- Blank lines **between** sections (closing tag to next opening tag) are preserved

## 5. Nesting Rules

- **1 level maximum** -- a parent tag can contain child tags, no deeper
- Nesting is **optional** -- use only when subsections are independently queryable
- Example: `<config_templates>` could contain `<wrangler_config>` and `<dev_vars>`, but flat structure is acceptable

## 6. Content Integrity Rules

- **Zero modifications** to existing content
- Only XML tag lines (opening and closing) are added
- All Markdown headers preserved inside their tags
- All code blocks preserved byte-identical
- All tables preserved byte-identical
- MCP callouts (blockquotes starting with `>`) stay inside their parent container

## 7. Per-File Validation Checklist

Copy and complete for each tagged file:

- [ ] Every `##` section wrapped in a descriptive XML tag
- [ ] Universal tags named exactly: `quick_reference`, `anti_patterns`, `troubleshooting`
- [ ] All grep patterns from SKILL.md return exactly 1 match
- [ ] `git diff` shows only added XML tag lines (no content changes)
- [ ] Token overhead < 5% (measure with `wc -c` before/after)
- [ ] Opening tag count equals closing tag count
- [ ] No nesting beyond 1 level
- [ ] File title (`# Title`) has NO tag wrapper

**Overhead thresholds:**

| Range | Action |
|-------|--------|
| < 5.0% | Pass |
| 5.0 - 6.0% | Review subsection tags (apply queryability test) |
| 6.0 - 8.0% | Structural over-tagging -- reduce tags |
| > 8.0% | Design problem -- too much nesting or tags on small sections |

## 8. What NOT to Tag

- The file title (`# Cloudflare Platform`) -- no tag wrapper
- Individual code blocks within a section -- the section tag covers them
- Individual table rows -- the section tag covers the table
- MCP callout blockquotes -- they stay inside the parent section tag
