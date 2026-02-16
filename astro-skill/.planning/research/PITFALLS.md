# Domain Pitfalls: XML Semantic Restructuring of Skill Reference Files

**Domain:** Claude Code Skill -- adding XML semantic containers to 11 existing Markdown reference files
**Researched:** 2026-02-04
**Overall confidence:** HIGH (pitfalls grounded in actual file analysis) / MEDIUM (Claude attention behavior claims from guide)
**Context:** v0.3 milestone for astro-cloudflare skill. 11 reference files (2,915 lines, 125,079 chars). 102 grep patterns in SKILL.md. 117 `##` sections across files. 94 fenced code blocks (188 fence markers). Files already contain Astro/HTML/Vue template syntax inside code blocks.

---

## Critical Pitfalls

Mistakes that break existing navigation, corrupt content, or negate the benefits of restructuring.

---

### Pitfall 1: Grep Pattern Breakage from Headers Moving Inside XML Containers

**What goes wrong:** SKILL.md contains 102 grep patterns like `grep -n "## Quick Reference" references/cloudflare-platform.md`. These patterns match the exact text of Markdown headers. If XML restructuring moves a header inside an XML container, the header text itself does not change -- BUT if the restructuring accidentally modifies the header text (adding, removing, or rewording), the grep pattern silently returns no match. Claude then cannot navigate to that section.

**Why it happens:** During restructuring, the temptation is to "clean up" header text to better match the XML container name. For example, wrapping `## Bindings Access` in `<bindings_access>` makes the header feel redundant. The restructurer removes or renames the header to avoid the "tag duplicates header" anti-pattern from the guide. But the grep pattern `grep -n "## Bindings Access"` depends on that exact header text existing.

**Consequences:**
- Silent failure: grep returns empty, Claude sees no output and has no navigation target
- All 102 grep patterns validated in v0.2 could regress
- Navigation becomes unreliable -- the core value proposition of SKILL.md's grep-based system breaks
- No error message alerts Claude to the problem; it simply cannot find the section

**Prevention:**
1. **Golden rule: NEVER modify header text that is a grep target.** Before restructuring any file, extract all grep patterns targeting that file from SKILL.md and lock those header strings
2. Run `grep -c "## Header Text" references/file.md` for every grep pattern BEFORE and AFTER restructuring -- count must be 1 in both cases
3. The guide says "La balise structure, le header precise" -- XML tags WRAP headers, they do not REPLACE them. `<bindings_access>` wraps `## Bindings Access` which then contains sub-headers like `### In .astro pages`, `### In API endpoints`
4. Create a verification script: extract all 102 grep patterns from SKILL.md and run them against the restructured files. All 102 must return exactly 1 match

**Detection:**
- Run all 102 grep patterns after each file edit: `grep -c "pattern" file` must equal 1
- Diff header lines before/after: `grep "^## \|^### " file` should be identical
- Warning sign: any file where the restructurer says "I renamed this header to match the XML tag"

**Confidence:** HIGH -- the 102 grep patterns are verified artifacts from v0.2 validation. The risk is mechanical and deterministic.

**Phase:** Must be enforced as an invariant in EVERY editing phase. Verification after EVERY file.

---

### Pitfall 2: XML Tags Colliding with HTML/Template Syntax Inside Fenced Code Blocks

**What goes wrong:** Reference files contain 94 fenced code blocks (188 fence markers). Many contain Astro template syntax (`<Component />`, `<slot />`, `<ClientRouter />`), Vue templates (`<template>`, `<script setup>`), HTML elements (`<div>`, `<span>`), and JSX (`<button onClick=...>`). When Claude processes a file with both XML semantic containers and code blocks containing angle-bracket syntax, the attention boundaries may blur -- Claude might interpret a code example's `<Component>` as a semantic container boundary, or conversely, ignore a real XML container that looks like a code example.

**Why it happens:** Claude treats XML tags as "semantic markers" not through formal XML parsing but through pattern matching in the attention mechanism. The attention mechanism does not have a formal concept of "inside a fenced code block." A `<ProductPrice>` inside a code block and a `<product_pricing>` container tag both activate similar attention patterns. The distinction relies on Claude's learned understanding of Markdown code fences, which is imperfect.

**Specific high-risk files (by code block count with template syntax):**
- `components-islands.md`: 20 fence markers, 10 JSX/Astro template tags -- highest risk
- `styling-performance.md`: 26 fence markers, 9 Astro template blocks
- `security-advanced.md`: 22 fence markers, contains MDX template syntax
- `cloudflare-platform.md`: 20 fence markers, 4 Astro template blocks
- `routing-navigation.md`: 16 fence markers, 4 Astro template blocks

**Consequences:**
- Claude might treat a code example's closing `</Component>` as closing a semantic container, causing attention to "leak" across section boundaries
- In extreme cases, Claude might reproduce XML container tags in generated code, confusing them with template syntax
- The benefit of XML containers (sharper attention boundaries) gets diluted by noise from template syntax in code blocks

**Prevention:**
1. **Use snake_case tag names exclusively** -- `<bindings_access>`, `<server_island_pattern>`, not `<BindingsAccess>` or `<ServerIslandPattern>`. PascalCase collides visually with Astro/React component names in code blocks. snake_case creates maximum visual distance from template syntax
2. **Never nest XML containers around individual code blocks** -- place containers around the entire section (header + explanation + code block + notes), not around individual code blocks
3. **Use descriptive multi-word tags** that cannot be confused with HTML elements -- `<hydration_directive_matrix>` is unambiguously a semantic container; `<matrix>` could be confused with a hypothetical component name
4. **Do not add XML tags inside code blocks** -- this seems obvious but it is the most common mistake when restructuring files with many examples
5. For the highest-risk file (`components-islands.md`), use fewer, broader containers rather than many narrow ones

**Detection:**
- After restructuring, verify no XML container tag appears inside any fenced code block: search for `<[a-z_]+>` between ``` markers
- Review each file for visual ambiguity: can a human reader instantly distinguish container tags from code examples?
- Warning sign: tag names that match any component name used in examples (e.g., never use `<server_island>` as a container tag when `<ServerIsland>` appears in code)

**Confidence:** MEDIUM -- the Claude attention mechanism behavior with mixed XML/code-blocks is based on the guide's claims and general prompt engineering knowledge. Not empirically tested with these specific files.

**Phase:** Tag naming convention must be decided during planning. Enforced during every editing phase.

---

### Pitfall 3: Content Corruption During "Pure Format" Restructuring

**What goes wrong:** The requirement is "zero content change -- same information, different structure." But restructuring 2,915 lines across 11 files manually introduces accidental changes: deleted blank lines alter Markdown rendering, table rows get reordered, code block indentation shifts, trailing whitespace changes break pre-formatted output, and copy-paste errors silently modify code examples.

**Why it happens:** The restructurer adds XML tags by editing the file, and during editing, the editor/AI modifies adjacent content. Common corruption modes:
- Blank line before/after a code fence removed (Markdown requires blank lines around fenced blocks in many renderers)
- Table alignment pipes shifted when reformatting around XML tags
- Leading spaces inside code blocks changed (indentation matters in Python, YAML, config files)
- A character accidentally deleted or added in a code example
- Section ordering changed "for better flow" inside an XML container

**Specific risks in these files:**
- `project-structure.md`: contains tree diagrams using ASCII box-drawing characters -- any spacing change corrupts the visual layout
- `cloudflare-platform.md`: contains jsonc config templates with precise comment alignment
- `security-advanced.md`: contains middleware code patterns where indentation carries semantic meaning
- All 11 files: contain Markdown tables with pipe alignment -- adding lines around them risks breaking alignment

**Consequences:**
- Code examples that no longer compile or have wrong behavior
- Decision matrices with rows in wrong order losing their logical progression
- Config templates with wrong indentation producing invalid output if copy-pasted
- Subtle bugs: a developer copies a code example from the skill reference and it does not work because a character was changed during restructuring

**Prevention:**
1. **Diff every file after restructuring** -- `git diff --word-diff references/file.md` must show ONLY XML tag additions and whitespace changes around them
2. **Use a content hash per section** -- before restructuring, compute character count per `##` section. After restructuring, verify each section has identical character count (excluding XML tags)
3. **Never reorder sections** -- even if a different order seems "more logical" inside an XML container, preserve original ordering
4. **Preserve blank lines exactly** -- Markdown requires blank lines before/after headers, code fences, and tables. Do not add or remove blank lines except the ones directly adjacent to the new XML tags
5. **Process one file at a time with immediate verification** -- do not batch-restructure multiple files before verifying

**Detection:**
- `git diff --stat` should show only line additions (new XML tags) with minimal deletions
- For each file: line count before + (number of XML tag lines added) = line count after
- Run all 102 grep patterns after each file
- Warning sign: any git diff showing changes inside fenced code blocks

**Confidence:** HIGH -- content corruption during reformatting is the most common failure mode in any "structure-only" refactoring. The risk is proportional to file count (11) and total lines (2,915).

**Phase:** Verification protocol must be defined before editing begins. Applied after every single file.

---

### Pitfall 4: Token Overhead Exceeding the Benefit Threshold

**What goes wrong:** Each XML container adds an opening tag, a closing tag, and possibly attributes. Across 11 files with 117 `##` sections, this could add 200-400 tokens. The guide claims 5-10% overhead with 10-42% attention improvement. But if containers are too granular (one per `###` sub-section), overhead climbs to 15-20%, and the attention benefit saturates beyond 8-10 containers per file.

**Why it happens:** The restructurer treats every `##` header as deserving its own XML container, then adds containers around `###` sub-sections too, creating nested XML. Each tag pair costs approximately 2-4 tokens (opening) + 2-4 tokens (closing) = 4-8 tokens. With 117 sections, that is 468-936 tokens added. Current total across all files is roughly 125,079 chars / 4 = ~31,270 tokens. Adding 468-936 tokens is 1.5-3% overhead -- acceptable. But nesting pushes this higher.

**Quantified analysis per file:**

| File | Lines | Chars | ~Tokens | `##` Sections | If 1 tag per `##` (tokens added) | Overhead % |
|------|-------|-------|---------|---------------|----------------------------------|------------|
| security-advanced.md | 343 | 13,272 | ~3,318 | 15 | 90-120 | 2.7-3.6% |
| build-deploy.md | 262 | 13,408 | ~3,352 | 13 | 78-104 | 2.3-3.1% |
| data-content.md | 290 | 11,559 | ~2,890 | 13 | 78-104 | 2.7-3.6% |
| routing-navigation.md | 273 | 11,922 | ~2,981 | 12 | 72-96 | 2.4-3.2% |
| styling-performance.md | 296 | 11,673 | ~2,918 | 12 | 72-96 | 2.5-3.3% |
| typescript-testing.md | 282 | 12,725 | ~3,181 | 11 | 66-88 | 2.1-2.8% |
| seo-i18n.md | 251 | 11,005 | ~2,751 | 11 | 66-88 | 2.4-3.2% |
| components-islands.md | 265 | 12,044 | ~3,011 | 9 | 54-72 | 1.8-2.4% |
| cloudflare-platform.md | 242 | 9,002 | ~2,251 | 8 | 48-64 | 2.1-2.8% |
| rendering-modes.md | 161 | 9,230 | ~2,308 | 7 | 42-56 | 1.8-2.4% |
| project-structure.md | 250 | 9,239 | ~2,310 | 6 | 36-48 | 1.6-2.1% |

**Conclusion:** At 1 XML tag pair per `##` section, overhead is 1.6-3.6% per file -- well within the 5-10% budget. The danger zone starts with nesting (containers around `###` sub-sections) which doubles the tag count.

**Consequences:**
- At >10% overhead: the token cost exceeds the attention benefit for smaller files
- Each file is loaded on-demand into an already-occupied context. Every extra token competes with the user's actual task context
- Over-tagging (excessive containers) creates "XML noise" that degrades rather than improves attention -- Claude starts treating containers as background noise

**Prevention:**
1. **Target 5-8 XML containers per file maximum** -- even files with 15 `##` sections should group related sections under broader containers
2. **Do NOT tag sections under 100 tokens** (roughly 10-15 lines) -- the overhead is not justified
3. **Never nest containers more than 1 level deep** -- the guide recommends "2-3 levels max" but for reference files (not system prompts), 1 level is sufficient
4. **Skip the smallest files** -- `rendering-modes.md` (161 lines, 7 sections) may not benefit enough to justify any restructuring
5. **Use the guide's decision tree**: <500 tokens or <3 sections = skip XML entirely

**Detection:**
- After restructuring, count XML tag pairs per file: `grep -c '<[a-z_]' file.md`
- Calculate overhead: (tag line count * ~6 tokens) / (total file tokens). If >10%, reduce tags
- Warning sign: any file with more XML containers than `##` sections

**Confidence:** HIGH for the arithmetic. MEDIUM for the "attention improvement" claims from the guide (10-42% is cited from "Microsoft 2024 studies and community benchmarks" but not independently verified).

**Phase:** Container count budget must be set during planning. Verified post-editing.

---

## Moderate Pitfalls

Mistakes that create technical debt, inconsistency, or suboptimal results without breaking functionality.

---

### Pitfall 5: Inconsistent Tag Naming and Structure Across 11 Files

**What goes wrong:** Files processed at different times (or by different prompts/sessions) drift in naming convention, container granularity, and structural patterns. File A uses `<anti_patterns>`, file B uses `<antipatterns>`, file C uses `<dont_do_this>`. File A wraps Quick Reference in a container, file B does not. File A separates `<rules>` and `<examples>`, file B keeps them mixed.

**Why it happens:** With 11 files restructured sequentially (likely across multiple sessions), each session starts fresh without remembering the exact conventions used in previous sessions. Claude's tendency to "improve" patterns means later files may get different treatment than earlier ones. Even with a written convention, drift occurs through small variations.

**Consequences:**
- Claude's attention mechanism benefits from consistent patterns across files -- if `<anti_patterns>` is the tag in some files and `<common_mistakes>` in others, the cross-file pattern recognition is weakened
- Maintenance burden: updating tag conventions later requires editing all 11 files
- Any future tooling (grep for container tags, automated validation) needs to handle variations

**Prevention:**
1. **Define the complete tag vocabulary before any editing begins.** The reference files share common structural patterns. Pre-define the exact tag names:

   | Section Pattern | Standard Tag | Used In |
   |-----------------|-------------|---------|
   | Quick Reference | `<quick_reference>` | All 11 files |
   | Anti-patterns table | `<anti_patterns>` | All 11 files |
   | Troubleshooting table | `<troubleshooting>` | All 11 files |
   | Decision Matrix | `<decision_matrix>` | ~8 files |
   | Code patterns / templates | `<patterns>` or `<config_templates>` | ~6 files |
   | Domain-specific sections | `<[domain_specific_name]>` | Per file |

2. **Create a reference example** -- restructure ONE file first (preferably a medium-complexity file like `cloudflare-platform.md`), get approval, then use it as the template for all others
3. **Process files in a single session or with explicit carry-over** -- paste the tag vocabulary at the start of each session
4. **Verify consistency post-hoc:** `grep -rn '<[a-z_]*>' references/*.md | sort` should show consistent patterns

**Detection:**
- After all 11 files are done, extract all unique tag names: `grep -oh '<[a-z_]*>' references/*.md | sort -u`
- Tags that appear in only one file but describe a common pattern (anti-patterns, troubleshooting) indicate inconsistency
- Warning sign: the tag vocabulary exceeds 40 unique tags (target: 15-25)

**Confidence:** HIGH -- inconsistency across sequential edits is a structural certainty without explicit prevention.

**Phase:** Define vocabulary during planning. First file serves as template. Consistency audit after all files.

---

### Pitfall 6: Over-Structuring Small Sections (The "Tag Every Paragraph" Trap)

**What goes wrong:** The guide explicitly warns against "over-tagging: granulite excessive" and "fichier trop structure pour son contenu." A section with 3 lines of content wrapped in XML tags has 25% overhead. The restructurer, enthusiastic about XML benefits, tags every small section including single-paragraph notes, short lists, and one-row tables.

**Why it happens:** The restructurer treats XML restructuring as a checklist ("wrap every section in a tag") rather than a judgment call ("does this section benefit from an attention boundary?"). Small sections like MCP callout blockquotes, single-sentence notes, and 3-line sub-sections do not need their own container.

**Specific examples from the files:**

Things that should NOT get their own container:
- Single-line notes like `> Note: Astro.locals.runtime is the Astro 5.x pattern` (cloudflare-platform.md line 65)
- MCP callout blockquotes (already visually distinct via `>` prefix)
- Sub-sections with only a code block and no explanatory text
- The `# Title` header at the top of each file (wrapping the entire file in a container is the anti-pattern of wrapping the document itself)

Things that SHOULD get containers:
- Quick Reference (numbered rule list, scanned frequently)
- Multi-example pattern sections (Nanostores Pattern, Server Island Pattern)
- Decision matrix tables with accompanying explanation
- Anti-patterns table (distinct functional role from the rest of the file)
- Troubleshooting table (distinct functional role)

**Prevention:**
1. **Minimum section size for tagging: 5+ lines of content** (excluding the tag lines themselves)
2. **Do NOT tag** the file-level `# Title` header, standalone blockquotes, or individual `###` sub-sections within an already-tagged `##` section
3. **Ask the filtering question:** "Would Claude's attention be measurably better if this section had an XML boundary?" If the section is already visually distinct (table, code block, blockquote), the answer is probably no
4. **Target ratio:** content tokens inside a container should be at least 10x the tag tokens. A `<tag>` ... `</tag>` pair costs ~6-8 tokens; the content inside should be at least 60-80 tokens

**Detection:**
- After restructuring, identify containers with <5 lines of content between opening and closing tags
- Calculate per-container ratio: if tag overhead exceeds 10% of container content, the container is too small
- Warning sign: containers that are adjacent with no content between their closing and the next opening tag

**Confidence:** HIGH -- the guide itself identifies this as an anti-pattern. The risk is real because the restructurer is primed to "add XML" and may over-apply.

**Phase:** Judgment criteria must be in the editing guidelines. Review during verification.

---

### Pitfall 7: Tag Names That Duplicate Markdown Headers (Redundancy Anti-Pattern)

**What goes wrong:** The guide warns: "Balises qui dupliquent les headers Markdown" is an anti-pattern. Example: `<anti_patterns>## Anti-patterns</anti_patterns>`. The tag name and the header say exactly the same thing. This wastes tokens and clutters the file without adding semantic value.

**Why it happens:** The most obvious tag name for a section is derived from its header. `## Troubleshooting` naturally suggests `<troubleshooting>`. When the header is a single concept, the tag name will inevitably mirror it.

**The nuance:** Complete redundancy is wasteful, but for common structural sections (Anti-patterns, Troubleshooting, Quick Reference), the duplication is acceptable because:
- The XML tag serves a different function (attention boundary) than the Markdown header (document structure)
- These sections contain multiple sub-elements (table rows, rules) that benefit from the container
- The header MUST be preserved for grep pattern compatibility (Pitfall 1)

**The real problem is when the tag wraps a section with a single header and no sub-structure:**
```xml
<!-- BAD: tag duplicates the only header, no sub-structure to contain -->
<environment_variables>
## Environment Variables
Key rules:
- Never put secrets in wrangler.jsonc vars
</environment_variables>

<!-- GOOD: tag groups multiple related sub-sections -->
<environment_config>
## Environment Variables
...multi-paragraph content...

### .dev.vars
...

### wrangler secret put
...
</environment_config>
```

**Prevention:**
1. When the section has sub-headers (`###`), the XML tag names the GROUP and the `##` header names the topic -- this is the guide's "la balise structure, le header precise" pattern
2. When the section has NO sub-headers and is short (<10 lines), do not add an XML tag at all
3. Prefer tag names that describe the FUNCTION of the section, not its topic: `<config_templates>` wrapping `## Config Templates` is slightly redundant but acceptable; `<quick_rules>` wrapping `## Quick Reference` adds functional context

**Detection:**
- Compare each XML tag name with its immediately-following `##` header
- If they are identical (modulo formatting), consider whether the tag adds value
- Warning sign: a tag that wraps only one header and one paragraph

**Confidence:** HIGH -- this is explicitly documented in the guide as an anti-pattern.

**Phase:** Tag naming convention (Pitfall 5) should address this. Verified during review.

---

### Pitfall 8: Breaking Markdown Rendering with Misplaced XML Tags

**What goes wrong:** Markdown requires specific whitespace around block-level elements. Placing an XML tag directly adjacent to a code fence, table, or header without blank lines can break Markdown rendering in some contexts. More subtly, an unclosed or mismatched XML tag can cause Claude to interpret the rest of the file as being "inside" a container, diluting the attention boundaries for all subsequent sections.

**Why it happens:** XML tags are not Markdown syntax -- they are treated as raw HTML blocks by CommonMark-compliant parsers. A `<tag>` immediately before a `##` header might cause some renderers to treat subsequent lines as raw HTML, disabling Markdown processing. While Claude does not use a CommonMark parser for attention, inconsistent rendering in human-readable contexts (GitHub, VS Code preview) makes the files harder to maintain.

**Specific risks:**
- Missing blank line between `<tag>` and `## Header`: some Markdown renderers swallow the header
- Missing blank line between `</tag>` and next `<tag>`: content between tags may not render
- Mismatched tags (typo in closing tag): Claude sees an "open" container that never closes
- Placing `<tag>` inside a table or list: breaks the table/list rendering

**Prevention:**
1. **Always blank line before opening tag, blank line after opening tag, blank line before closing tag, blank line after closing tag:**
   ```
   [blank line]
   <container_name>
   [blank line]
   ## Header
   Content...
   [blank line]
   </container_name>
   [blank line]
   ```
2. **Never place XML tags inside Markdown tables, lists, or blockquotes** -- tags go AROUND these structures, not inside them
3. **Validate tag matching after each file:** count opening tags and closing tags. Every `<tag_name>` must have exactly one `</tag_name>`
4. **Test rendering** in at least one Markdown previewer (VS Code) after restructuring

**Detection:**
- `grep -c '<[a-z_]*>' file.md` should equal `grep -c '</[a-z_]*>' file.md` for each file
- Visual inspection: open in VS Code Markdown preview and verify all headers, tables, and code blocks render correctly
- Warning sign: any content that appears in a different font/style after restructuring

**Confidence:** HIGH -- Markdown whitespace sensitivity is well-documented. The rendering risk is real for human maintainability, even though Claude's internal processing may not be affected.

**Phase:** Whitespace convention must be in the editing guidelines. Rendering check post-editing.

---

## Minor Pitfalls

Mistakes that cause annoyance or suboptimal quality but are easily fixable.

---

### Pitfall 9: Forgetting to Update SKILL.md After Restructuring

**What goes wrong:** After restructuring reference files with XML containers, SKILL.md's Reference Navigation section may need updates. Not because grep patterns break (Pitfall 1 prevents that), but because new navigational opportunities exist -- Claude could grep for XML tag names as section markers in addition to header text.

**Prevention:**
- After all 11 files are restructured, evaluate whether SKILL.md should add grep hints for XML container tags (e.g., `grep -n "<anti_patterns>" references/file.md`)
- This is an OPTIMIZATION, not a requirement -- existing grep patterns remain functional
- Do not add XML-based grep hints unless they provide genuinely better navigation than header-based ones

**Detection:** Review SKILL.md Reference Navigation section after all files are done. Ask: "Do any restructured sections lack a grep path?"

**Phase:** Post-restructuring review. Not blocking.

---

### Pitfall 10: Restructuring Files That Do Not Benefit from XML

**What goes wrong:** The guide's decision tree says: <500 tokens AND <3 sections = Markdown pur suffit. Some reference files or sections within files may not meet the threshold for XML benefit. Applying XML uniformly to all 11 files regardless of structure wastes effort and adds overhead without benefit.

**Analysis of candidates:**
- `rendering-modes.md` (161 lines, 7 sections, ~2,308 tokens): BORDERLINE -- small file but multiple distinct functional sections. XML would help separate the decision matrix from the troubleshooting table
- All other files (242-343 lines, 6-15 sections): clearly qualify for XML restructuring

**Prevention:**
1. Apply the guide's decision tree to each file before restructuring
2. For files with <200 lines, consider using fewer containers (3-4 max) rather than the full treatment
3. It is acceptable to restructure 10 out of 11 files if the 11th does not benefit

**Detection:** Pre-planning analysis. Not a post-hoc issue.

**Phase:** Planning phase. Decide per-file scope before editing.

---

### Pitfall 11: Loss of MCP Callout Visual Distinction

**What goes wrong:** The 10 MCP callouts added in v0.2 use blockquote format (`> **Cloudflare MCP:** ...`). If XML containers wrap the entire section including the MCP callout, the callout loses its "boundary marker" role -- it becomes just another piece of content inside a container rather than a distinctive bridge to external documentation.

**Prevention:**
- Keep MCP callouts OUTSIDE XML containers, placed after the closing tag of the relevant section
- Alternatively, if inside a container, ensure the callout is the LAST element before the closing tag
- Do not wrap MCP callouts in their own XML container (over-tagging)

**Detection:** After restructuring, verify all 10 MCP callouts are visually scannable. `grep -n "Cloudflare MCP\|Astro MCP" references/*.md` should return all callouts with recognizable context.

**Phase:** Editing guidelines. Verified post-restructuring.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| Planning: tag vocabulary | Inconsistency (P5) | Moderate | Define all tag names before any editing |
| Planning: per-file scope | Over-structuring (P6), no-benefit files (P10) | Minor | Apply decision tree per file |
| Planning: editing guidelines | All pitfalls | Critical | Document whitespace rules, tag naming, grep preservation |
| Editing: first file (template) | All pitfalls surface here | Critical | Use medium-complexity file, verify thoroughly, use as model |
| Editing: high-risk files | Code block collision (P2) | Critical | components-islands.md and security-advanced.md need extra care |
| Editing: every file | Content corruption (P3), grep breakage (P1) | Critical | Diff + grep verification after EACH file |
| Editing: small sections | Over-tagging (P6), redundancy (P7) | Moderate | Apply minimum size threshold |
| Verification: batch | Inconsistency (P5), token overhead (P4) | Moderate | Cross-file audit after all 11 |
| Verification: grep regression | Pattern breakage (P1) | Critical | Run all 102 patterns, 102/102 must pass |
| Post-restructuring | SKILL.md update (P9), MCP callouts (P11) | Minor | Review and optimize navigation |

---

## Pre-Editing Checklist (Applies to Every File)

Before restructuring a file:
- [ ] List all SKILL.md grep patterns targeting this file (extract exact strings)
- [ ] Count lines, characters, sections (`##`), and code blocks
- [ ] Identify code blocks containing HTML/XML-like template syntax
- [ ] Decide which sections get XML containers (using guide's decision tree)
- [ ] Choose tag names from the pre-defined vocabulary

After restructuring a file:
- [ ] Run ALL grep patterns targeting this file -- all must return exactly 1 match
- [ ] `git diff --word-diff` shows ONLY XML tag additions (no content changes inside code blocks)
- [ ] Line count = original + number of XML tag lines + whitespace lines
- [ ] Character count of content between tags matches original section character count
- [ ] Opening tag count equals closing tag count (no mismatched tags)
- [ ] No XML tags appear inside fenced code blocks
- [ ] Markdown renders correctly in VS Code preview (headers, tables, code blocks)

---

## Decision Framework: How Many Containers Per File

Based on the file analysis, recommended container counts:

| File | `##` Sections | Recommended Containers | Rationale |
|------|---------------|----------------------|-----------|
| security-advanced.md | 15 | 6-7 | Group related sections (security headers + auth + actions = 1 container) |
| build-deploy.md | 13 | 5-6 | Group deployment workflow sections |
| data-content.md | 13 | 5-6 | Group Content Layer sections vs Actions sections |
| routing-navigation.md | 12 | 5-6 | Group routing patterns vs middleware |
| styling-performance.md | 12 | 5-6 | Group styling vs performance vs caching |
| typescript-testing.md | 11 | 5-6 | Group TS config vs testing vs Vitest |
| seo-i18n.md | 11 | 5-6 | Group SEO vs i18n sections |
| components-islands.md | 9 | 5-6 | Careful with template-heavy code blocks |
| cloudflare-platform.md | 8 | 5-6 | Group bindings + env + config |
| rendering-modes.md | 7 | 4-5 | Smaller file, fewer containers |
| project-structure.md | 6 | 3-4 | Smallest section count |

**Total across all files:** ~55-65 XML container pairs, adding ~330-520 tokens (~1.1-1.7% overhead across all files). Well within the 5-10% budget.

---

## Sources

### Project Evidence (HIGH confidence)
- 11 reference files analyzed: line counts (161-343), character counts (9,002-13,408), section counts (6-15), code block counts (8-26 fence markers)
- 102 grep patterns verified in SKILL.md (from v0.2 validation: 102/102 PASS)
- 117 `##` sections across all files, 188 fence markers (94 code blocks)
- 34 occurrences of PascalCase HTML/component tags inside code blocks across 10/11 files
- 29 `\`\`\`astro` fenced blocks across 8 files, 2 `\`\`\`vue`/`\`\`\`tsx` blocks

### Guide Document (HIGH confidence for conventions, MEDIUM for attention claims)
- "XML Markdown pour references Skill Claude Code.md" -- the user's own guide document
- Decision tree: >500 tokens AND 3+ sections = use XML
- Anti-patterns: over-tagging, tag duplicating header, file too structured, workflow format in reference
- Overhead claim: 5-10% tokens, 10-42% attention improvement (attributed to "Microsoft 2024 studies")
- snake_case convention for multi-word tags, single words for short tags

### Anthropic Documentation (HIGH confidence)
- [Use XML tags to structure your prompts](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags) -- Claude trained to recognize XML tags as semantic markers
- [Claude prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) -- XML tags listed as core technique
- XML tags are not formally parsed -- treated as attention boundary markers by the Transformer mechanism

### Web Research (MEDIUM confidence)
- [Anthropic Claude Code Issue #12958](https://github.com/anthropics/claude-code/issues/12958) -- XML tags in frontmatter causing parsing failures (Dec 2025)
- [Anthropic Claude Code Issue #17559](https://github.com/anthropics/claude-code/issues/17559) -- nested markdown code block handling issues (Jan 2026)
- CommonMark spec: fenced code block content is literal text, but many parsers incorrectly process XML tags inside code blocks
- XML/HTML in Markdown code blocks is a [known cross-parser issue](https://github.com/Unstructured-IO/unstructured/issues/3578)

---

**Research completed:** 2026-02-04
**Ready for roadmap:** Yes
