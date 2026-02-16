# Phase 1: Scaffolding and Frontmatter - Research

**Researched:** 2026-02-03
**Domain:** Agent Skills specification, SKILL.md frontmatter, progressive disclosure architecture
**Confidence:** HIGH

## Summary

Phase 1 creates the skill directory structure, writes the SKILL.md frontmatter for auto-activation, creates empty reference file stubs, and establishes the progressive disclosure skeleton. This is a structural phase with no npm dependencies -- the deliverable is a folder of Markdown files.

Research focused on three areas: (1) the Agent Skills frontmatter specification (verified from agentskills.io and official Claude Code docs), (2) description optimization for auto-activation (verified from Anthropic best practices), and (3) file organization patterns for progressive disclosure (verified from official docs and real-world examples). All findings are grounded in official sources and cross-verified.

The primary risk is getting the description field wrong, which would make the skill invisible to Claude. The description is the SOLE signal for auto-activation, and community reports show 20-50% activation rates for poorly described skills vs 72-90% for well-optimized ones. The description must pack file patterns, keywords, and "use when" triggers into its 1024-character budget.

**Primary recommendation:** Write the frontmatter description first, test with 5+ natural prompts before proceeding to any content creation. The description is the single highest-leverage element of the entire skill.

## Standard Stack

This phase has no library dependencies. The "stack" is the Agent Skills open standard.

### Core

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Agent Skills format | v1 (agentskills.io, Jan 2026) | Skill packaging and discovery | Official Anthropic standard; portable across Claude Code, Codex, Gemini CLI, Cursor, and 20+ agent products |
| SKILL.md + YAML frontmatter | Current specification | Entry point and metadata | Required by spec. Two mandatory fields: `name` and `description` |
| Markdown | Standard | All content files | Claude Code reads skills from filesystem. Markdown is the native format |

### Supporting

No supporting libraries needed. Phase 1 creates only Markdown files.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single skill with references | 18 separate skills (one per domain) | Would consume ~4.7K chars of 15K skill description budget. Multi-activation unreliable. Rejected per prior research. |
| Flat `references/` | Nested `references/core/`, `references/platform/` | Official guidance: one level deep from SKILL.md. Nesting adds complexity, no benefit for ~11 files. Rejected per CONTEXT.md decision. |

**Installation:**
```bash
# No installation needed. Create directories and files manually.
mkdir -p .claude/skills/astro-cloudflare/references
```

## Architecture Patterns

### Recommended Directory Structure

```
.claude/skills/astro-cloudflare/
├── SKILL.md                          # Entry point: frontmatter only in Phase 1
└── references/                       # Domain knowledge files (stubs in Phase 1)
    ├── project-structure.md          # Phase 2: project templates, naming, configs
    ├── rendering-modes.md            # Phase 2: SSG/SSR/Server Islands, output modes
    ├── cloudflare-platform.md        # Phase 2: bindings, Workers limits, env vars
    ├── components-islands.md         # Phase 3: hydration directives, nanostores
    ├── routing-navigation.md         # Phase 3: file-based routing, middleware
    ├── data-content.md               # Phase 3: Content Layer, collections, MDX
    ├── styling-performance.md        # Phase 3: scoped styles, Tailwind, images
    ├── seo-i18n.md                   # Phase 4: meta tags, sitemap, multilingual
    ├── typescript-testing.md         # Phase 4: types, Vitest, Container API
    ├── build-deploy.md               # Phase 4: wrangler, CI/CD, Pages vs Workers
    └── security-advanced.md          # Phase 4: CSP, auth, middleware, MDX advanced
```

**Total: 1 SKILL.md + 11 reference file stubs = 12 files**

### Pattern 1: YAML Frontmatter Format (Agent Skills Specification)

**What:** The SKILL.md file starts with YAML frontmatter between `---` markers containing `name` and `description` fields.
**When to use:** Always -- this is the required format per the Agent Skills spec.

```yaml
# Source: https://agentskills.io/specification
---
name: astro-cloudflare
description: |
  [keyword-packed description, max 1024 chars]
---
```

**Constraints verified from agentskills.io specification:**

| Field | Constraint | Source |
|-------|-----------|--------|
| `name` | Max 64 chars | agentskills.io spec |
| `name` | Lowercase letters, numbers, hyphens only (`a-z`, `0-9`, `-`) | agentskills.io spec |
| `name` | Must not start or end with `-` | agentskills.io spec |
| `name` | Must not contain consecutive hyphens (`--`) | agentskills.io spec |
| `name` | Must match the parent directory name | agentskills.io spec |
| `description` | Max 1024 chars | agentskills.io spec |
| `description` | Must be non-empty | agentskills.io spec |
| `description` | Cannot contain XML tags | Anthropic best practices |
| `description` | No reserved words: "anthropic", "claude" in name | Anthropic best practices |

**Confidence:** HIGH -- verified against agentskills.io specification AND platform.claude.com best practices docs. Both sources agree on all constraints.

### Pattern 2: Description Optimization for Auto-Activation

**What:** The `description` field is the SOLE signal Claude uses to decide whether to load a skill. It must be keyword-packed with specific terms users actually type.
**When to use:** Always -- this is the primary trigger mechanism.

**Official guidance from Anthropic best practices:**
1. Write in **third person** ("Provides..." not "I help with...")
2. Include **what the skill does** AND **when to use it**
3. Include **specific keywords** that match user prompts
4. Include **file pattern triggers** (e.g., "when working with *.astro files")
5. Use the **full 1024 character budget** -- this is not a place for brevity
6. Put ALL "when to use" information in the description -- NOT in the body (body loads after triggering)

**Verified example patterns from official docs:**

```yaml
# PDF Processing skill (official example):
description: Extract text and tables from PDF files, fill forms, merge documents.
  Use when working with PDF files or when the user mentions PDFs, forms, or
  document extraction.

# Excel Analysis skill (official example):
description: Analyze Excel spreadsheets, create pivot tables, generate charts.
  Use when analyzing Excel files, spreadsheets, tabular data, or .xlsx files.
```

**Anti-patterns from official docs:**
- Vague: `description: Helps with documents`
- Too short: `description: Processes data`
- Missing triggers: `description: Astro development patterns` (no "use when")

**Confidence:** HIGH -- all patterns verified from platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices.

### Pattern 3: Progressive Disclosure (Three Levels)

**What:** Skills load content in three stages to minimize token consumption.
**When to use:** Always -- this is the core architectural principle.

```
Level 1: METADATA (~100 tokens) -- ALWAYS loaded at startup
  name + description from YAML frontmatter
  Present in system prompt for ALL conversations

Level 2: INSTRUCTIONS (<5K tokens recommended, <500 lines) -- loaded on trigger
  Full SKILL.md body
  Loaded only when Claude decides skill is relevant

Level 3: RESOURCES (unbounded) -- loaded on demand
  Files in references/, scripts/, assets/
  Loaded only when Claude needs specific domain knowledge
```

**Key insight from official docs:** "In a regular session, skill descriptions are loaded into context so Claude knows what's available, but full skill content only loads when invoked."

**Phase 1 implication:** Only Level 1 (frontmatter) is written in Phase 1. Level 2 (body) is written in Phase 5. Level 3 (reference content) is written in Phases 2-4.

**Confidence:** HIGH -- verified from agentskills.io spec, code.claude.com skills docs, and platform.claude.com best practices. All three sources describe the same three-level architecture.

### Pattern 4: Stub Files with Minimal Content

**What:** Reference file stubs contain only a title heading. No section structure, no placeholders, no phase markers.
**When to use:** Phase 1 only -- each subsequent phase decides its own internal structure.

```markdown
# Components & Islands
```

**Rationale (from CONTEXT.md decisions):**
- Minimal stubs avoid premature structure decisions
- Each phase that fills a reference decides its own sections
- No "TODO" markers or section headers that might constrain later phases

**Confidence:** HIGH -- this is a locked decision from CONTEXT.md, not a research finding.

### Anti-Patterns to Avoid

- **Putting instructional content in frontmatter:** The description is for activation keywords only, not instructions. Instructions go in the body (Phase 5).
- **Writing the body in Phase 1:** CONTEXT.md explicitly states: "SKILL.md in Phase 1: frontmatter only, body written in Phase 5." The body depends on all reference files existing first.
- **Adding section structure to stubs:** CONTEXT.md explicitly states: "Minimal stubs: title only -- no headers, no section structure, no phase markers."
- **Using the old `type: 'content'` field format in YAML:** The frontmatter uses `name` and `description`, not content-type fields. There is no `type` field in the Agent Skills spec.
- **Nesting reference files in subdirectories:** Official guidance: "Keep references one level deep from SKILL.md." All files go directly in `references/`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frontmatter format | Custom metadata format | Agent Skills YAML frontmatter | Standard spec, validated by `skills-ref validate` tool |
| Skill discovery | Custom file scanning | Agent Skills directory convention | Claude Code auto-discovers `.claude/skills/*/SKILL.md` |
| Auto-activation | Manual slash commands only | Well-crafted `description` field | Auto-activation is the primary interaction model per official docs |
| Skill validation | Manual checking | `skills-ref validate ./my-skill` | Official validation tool from agentskills.io reference library |

**Key insight:** Phase 1 is entirely about file creation following a specification. There is nothing to hand-roll -- every file format, naming convention, and directory structure is defined by the Agent Skills standard.

## Common Pitfalls

### Pitfall 1: Vague Description Causing Activation Failure

**What goes wrong:** A description like "Helps with Astro development" causes Claude to never match the skill to user prompts. Community reports show 20-50% activation rates for poorly described skills vs 72-90% for well-optimized ones.
**Why it happens:** Authors optimize for human readability instead of LLM keyword matching.
**How to avoid:**
- Include explicit file patterns: `*.astro`, `astro.config.*`, `wrangler.*`, `wrangler.jsonc`
- Include specific Astro terms: Server Islands, Content Layer, Islands Architecture, hydration directives, ClientRouter, Astro Actions
- Include specific Cloudflare terms: Workers, Pages, KV, D1, R2, bindings, platformProxy, wrangler
- Include "Use when" triggers for question-based activation (no project files present)
- Use the full 1024 character budget
- Write in third person
**Warning signs:** Test with 5+ natural prompts. If skill does not auto-activate for 3+ of them, description needs rewriting.

**Confidence:** HIGH -- verified from official best practices and community reports.

### Pitfall 2: Name Not Matching Directory Name

**What goes wrong:** The `name` field in frontmatter says `astro-cloudflare-dev` but the directory is `astro-cloudflare`. Per the Agent Skills spec, the name MUST match the parent directory name.
**Why it happens:** Authors rename the directory after writing frontmatter, or vice versa.
**How to avoid:** Decide on the name first, create the directory with that name, then write frontmatter with the matching name.
**Warning signs:** Run `skills-ref validate ./skill-dir` to catch mismatches.

**Confidence:** HIGH -- explicitly stated in agentskills.io specification: "Must match the parent directory name."

### Pitfall 3: False Positive Activation on Non-Cloudflare Astro Projects

**What goes wrong:** The skill activates on Astro projects that use Vercel, Netlify, or other hosts (not Cloudflare). This causes incorrect guidance (Cloudflare-specific rules applied to non-Cloudflare deployment).
**Why it happens:** Description includes `*.astro` file patterns which match ALL Astro projects.
**How to avoid:** The description must require BOTH Astro AND Cloudflare signals. Include Cloudflare-specific triggers (wrangler.*, Cloudflare Workers, Pages) prominently. Consider adding a negative boundary in the description ("Not for non-Cloudflare Astro deployments"). However, the CONTEXT.md also requires "use when" triggers for users asking Astro/Cloudflare questions without a project, so the balance is: file patterns require both signals, but textual triggers can be Astro+Cloudflare question-based.
**Warning signs:** Test with a pure Astro project (no wrangler files) and verify the skill does NOT activate.

**Confidence:** MEDIUM -- this is a Claude's Discretion item from CONTEXT.md. The exact balance of false positive prevention vs activation coverage needs testing in Phase 6.

### Pitfall 4: Orphaned Reference Files

**What goes wrong:** Reference file stubs exist in `references/` but SKILL.md does not mention them. Since Phase 1 only writes frontmatter (no body), all reference files are technically orphaned until Phase 5 writes the body with navigation links.
**Why it happens:** This is by design in Phase 1 -- the body that references these files is written in Phase 5.
**How to avoid:** Accept this as temporary. Phase 5 MUST add references to every file in the body. Add a verification step in Phase 5 planning.
**Warning signs:** After Phase 5, any file in `references/` not mentioned in SKILL.md body is a bug.

**Confidence:** HIGH -- official docs state: "Every file in the skill directory MUST be referenced from SKILL.md."

### Pitfall 5: Name Field Using Invalid Characters

**What goes wrong:** Name contains uppercase, spaces, underscores, or other invalid characters.
**Why it happens:** Authors use natural-language naming instead of slug format.
**How to avoid:** Use only lowercase letters, numbers, and hyphens. Our chosen name `astro-cloudflare` (17 chars) is valid: lowercase, uses single hyphens, doesn't start/end with hyphen, no consecutive hyphens.
**Warning signs:** Validate with the specification regex: `^[a-z][a-z0-9-]*[a-z0-9]$` (2+ chars) or `^[a-z]$` (1 char).

**Confidence:** HIGH -- verified from agentskills.io specification.

## Code Examples

### Example 1: SKILL.md Frontmatter (Phase 1 deliverable)

```yaml
# Source: Synthesized from agentskills.io spec + Anthropic best practices
---
name: astro-cloudflare
description: |
  Astro 5.x development on Cloudflare Workers/Pages. Provides rendering mode
  decisions (SSG/SSR/Server Islands), hydration strategies (client:load,
  client:visible, client:idle, server:defer), Content Layer patterns with
  loaders, Cloudflare bindings (KV, D1, R2), and anti-pattern prevention for
  Astro 5.x breaking changes. Use when working with .astro files,
  astro.config.mjs, astro.config.ts, wrangler.jsonc, wrangler.toml, or
  Cloudflare Workers/Pages projects. Use when questions involve Astro
  components, islands architecture, Content Collections, Astro Actions, Astro
  middleware, ClientRouter, Server Islands, SSR on Cloudflare, image
  optimization without Sharp, or Cloudflare bindings and environment variables.
  Complements mcp__astro_doc__search_astro_docs for official API reference.
---
```

**Character count:** ~725 characters (within 1024 limit, with room for iteration).

**Keyword coverage analysis:**
- File patterns: `.astro`, `astro.config.mjs`, `astro.config.ts`, `wrangler.jsonc`, `wrangler.toml`
- Astro features: Server Islands, Content Layer, Content Collections, Astro Actions, Astro middleware, ClientRouter, islands architecture, hydration, rendering mode, SSG, SSR, loaders
- Cloudflare features: Workers, Pages, KV, D1, R2, bindings, image optimization, Sharp
- Astro 5.x specifics: breaking changes, `client:load`, `client:visible`, `client:idle`, `server:defer`
- MCP reference: `mcp__astro_doc__search_astro_docs`
- "Use when" triggers: two explicit "Use when" clauses covering file-based and question-based activation

**Confidence:** HIGH for format. MEDIUM for keyword selection (needs testing in Phase 6). This is a starting point -- expect iteration based on activation testing.

### Example 2: Reference File Stub (Phase 1 deliverable)

```markdown
# Components & Islands
```

One line. Title only. Per CONTEXT.md decision: "Minimal stubs: title only -- no headers, no section structure, no phase markers."

### Example 3: Complete Directory After Phase 1

```bash
# Create skill directory structure
mkdir -p .claude/skills/astro-cloudflare/references

# Create SKILL.md with frontmatter only
cat > .claude/skills/astro-cloudflare/SKILL.md << 'EOF'
---
name: astro-cloudflare
description: |
  [description content as shown in Example 1]
---
EOF

# Create reference file stubs (one per domain)
echo "# Project Structure" > .claude/skills/astro-cloudflare/references/project-structure.md
echo "# Rendering Modes" > .claude/skills/astro-cloudflare/references/rendering-modes.md
echo "# Cloudflare Platform" > .claude/skills/astro-cloudflare/references/cloudflare-platform.md
echo "# Components & Islands" > .claude/skills/astro-cloudflare/references/components-islands.md
echo "# Routing & Navigation" > .claude/skills/astro-cloudflare/references/routing-navigation.md
echo "# Data & Content" > .claude/skills/astro-cloudflare/references/data-content.md
echo "# Styling & Performance" > .claude/skills/astro-cloudflare/references/styling-performance.md
echo "# SEO & Internationalization" > .claude/skills/astro-cloudflare/references/seo-i18n.md
echo "# TypeScript & Testing" > .claude/skills/astro-cloudflare/references/typescript-testing.md
echo "# Build & Deploy" > .claude/skills/astro-cloudflare/references/build-deploy.md
echo "# Security & Advanced Patterns" > .claude/skills/astro-cloudflare/references/security-advanced.md
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.claude/commands/` files only | `.claude/skills/*/SKILL.md` with frontmatter | Agent Skills standard (mid-2025) | Skills add auto-activation, supporting files, invocation control. Commands still work but skills are recommended. |
| No standard format | Agent Skills open standard (agentskills.io) | Jan 2026 | Portable across 20+ agent products (Claude Code, Codex, Gemini CLI, Cursor, etc.) |
| Manual `/skill-name` invocation only | Auto-activation via description matching | Claude Code skills feature | Skills activate automatically when description matches user context |
| Single-file skills | Multi-file skills with references | Current best practice | Progressive disclosure: SKILL.md hub + domain-organized reference files |

**Deprecated/outdated:**
- **`.claude/commands/` as primary format:** Still works, but skills are recommended. Per official docs: "Custom slash commands have been merged into skills."
- **No `name` field requirement:** The agentskills.io spec now requires `name` to match directory name. Claude Code's docs say name is optional (uses directory name if omitted), but the open standard requires it.

## Frontmatter Field Reference (Claude Code Extensions)

Claude Code extends the Agent Skills standard with additional frontmatter fields not in the base spec:

| Field | In Spec? | Claude Code? | Purpose |
|-------|----------|-------------|---------|
| `name` | Required | Optional (defaults to dir name) | Skill identifier, slash command name |
| `description` | Required | Recommended | Auto-activation trigger |
| `license` | Optional | - | License information |
| `compatibility` | Optional | - | Environment requirements |
| `metadata` | Optional | - | Arbitrary key-value pairs |
| `allowed-tools` | Experimental | Yes | Tools Claude can use without permission |
| `disable-model-invocation` | - | Yes | Prevent auto-activation (manual only) |
| `user-invocable` | - | Yes | Hide from `/` menu |
| `model` | - | Yes | Override model for this skill |
| `context` | - | Yes | `fork` for subagent execution |
| `agent` | - | Yes | Subagent type when `context: fork` |
| `hooks` | - | Yes | Skill lifecycle hooks |
| `argument-hint` | - | Yes | Autocomplete hint for arguments |

**For Phase 1:** Only `name` and `description` are needed. No other fields are required for the auto-activating knowledge skill pattern.

**Confidence:** HIGH -- verified from agentskills.io spec AND code.claude.com/docs/en/skills. The discrepancy on `name` being required (spec) vs optional (Claude Code) noted.

## Reference File Name Mapping

The CONTEXT.md locks the following 11 reference file names. This table maps each to its source research files and the phase that will fill it:

| Reference File | Title | Source Research Files | Filled In |
|----------------|-------|----------------------|-----------|
| `project-structure.md` | Project Structure | 1 (Architecture) | Phase 2 |
| `rendering-modes.md` | Rendering Modes | 2 (Rendering), 6 (Islands) partial | Phase 2 |
| `cloudflare-platform.md` | Cloudflare Platform | 14 (Cloudflare), 13 (Build) partial | Phase 2 |
| `components-islands.md` | Components & Islands | 3 (Components), 6 (Islands) | Phase 3 |
| `routing-navigation.md` | Routing & Navigation | 4 (Routing) | Phase 3 |
| `data-content.md` | Data & Content | 5 (Data), 18 (Markdown/MDX/Markdoc) | Phase 3 |
| `styling-performance.md` | Styling & Performance | 7 (Styling), 8 (Performance) | Phase 3 |
| `seo-i18n.md` | SEO & Internationalization | 9 (SEO), 10 (i18n) | Phase 4 |
| `typescript-testing.md` | TypeScript & Testing | 11 (TypeScript), 12 (Testing) | Phase 4 |
| `build-deploy.md` | Build & Deploy | 13 (Build/Deploy), 16 (DevX) | Phase 4 |
| `security-advanced.md` | Security & Advanced Patterns | 15 (Security), 17 (Advanced) | Phase 4 |

**Confidence:** HIGH -- file names are locked decisions from CONTEXT.md. Source mapping verified against ARCHITECTURE.md research.

## Open Questions

### 1. Optimal Description Keywords

- **What we know:** The description must include file patterns, Astro keywords, Cloudflare keywords, and "use when" triggers. The 1024-char budget allows comprehensive coverage.
- **What's unclear:** Which specific keywords maximize activation for real-world prompts. Example: Should we include "deploy to Cloudflare" or "Cloudflare deployment" or both?
- **Recommendation:** Write the best initial description (as in Code Example 1), then validate activation in Phase 6 testing. Expect 1-2 iterations.

### 2. False Positive Prevention vs Activation Coverage

- **What we know:** The skill targets Astro + Cloudflare. Including `*.astro` alone would match all Astro projects regardless of deployment target. CONTEXT.md marks this as Claude's Discretion.
- **What's unclear:** How to balance broad activation (catching all Astro+CF questions) vs narrow activation (avoiding false positives on Vercel/Netlify Astro projects).
- **Recommendation:** For Phase 1, write the description to strongly signal the Astro+Cloudflare intersection. File pattern triggers (`wrangler.*`) naturally filter for Cloudflare. Text triggers ("Use when questions involve...Cloudflare") also filter. Do NOT add negative boundaries in description ("Not for Vercel") as this wastes character budget on edge cases. Validate in Phase 6.

### 3. Session Compaction Resilience Timing

- **What we know:** Skills are forgotten after auto-compaction at ~55K tokens (GitHub issue #13919). CONTEXT.md marks this as Claude's Discretion for timing -- whether to address in Phase 1 or defer to Phase 5-6.
- **What's unclear:** Whether any Phase 1 structural decision can improve compaction resilience, or if this is purely a content concern for Phase 5.
- **Recommendation:** Defer to Phase 5-6. Phase 1 is structural (directory + frontmatter). Compaction resilience depends on content placement in SKILL.md body (e.g., critical rules in first 50 lines), which is a Phase 5 concern. No Phase 1 action needed.

## Sources

### Primary (HIGH confidence)

- **agentskills.io specification** (https://agentskills.io/specification) -- Complete SKILL.md format spec: frontmatter fields, constraints, directory structure, progressive disclosure
- **Claude Code skills docs** (https://code.claude.com/docs/en/skills) -- Skill discovery, auto-activation, frontmatter reference, supporting files, invocation control
- **Anthropic best practices** (https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) -- Description optimization, progressive disclosure patterns, anti-patterns, naming conventions, testing approach
- **anthropics/skills GitHub repo** (https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) -- Official skill-creator example showing frontmatter patterns

### Secondary (MEDIUM confidence)

- **Project research files** (.planning/research/STACK.md, ARCHITECTURE.md, PITFALLS.md, FEATURES.md, SUMMARY.md) -- Prior domain research verified against official sources
- **Community skill examples** -- Patterns observed across multiple real-world skills (Elixir Architect, Next.js skills, PDF processing)

### Tertiary (LOW confidence)

- **Activation rate statistics** (20-50% vs 72-90%) -- Community reports from multiple sources but not officially quantified by Anthropic

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Agent Skills spec is well-documented and verified from multiple official sources
- Architecture: HIGH - Directory structure, frontmatter format, progressive disclosure all verified from agentskills.io and official Anthropic docs
- Pitfalls: HIGH for spec violations (name format, description optimization), MEDIUM for false positive prevention (needs testing)

**Research date:** 2026-02-03
**Valid until:** 2026-04-03 (Agent Skills spec is stable; 60-day validity)
