# Technology Stack: Astro Skill for Claude Code

**Project:** astro-skill (Claude Code Skill for Astro 5.17+ on Cloudflare)
**Researched:** 2026-02-03
**Mode:** Ecosystem (Stack dimension)

---

## Executive Summary

This is not a traditional software stack. There are no npm packages to install, no build tools to configure, no runtime to deploy. A Claude Code Skill is a **knowledge artifact**: Markdown files organized in a specific directory structure, discovered and loaded by Claude Code's skill system. The "stack" is the file organization strategy, the progressive disclosure architecture, and the integration pattern with the MCP documentation server.

The core challenge is unique: condensing 18 research files (~400KB of structured knowledge) into a skill that respects Claude Code's progressive disclosure architecture (Level 1: ~100 tokens metadata, Level 2: <5K tokens SKILL.md body, Level 3: unlimited reference files loaded on demand) while remaining navigable and useful.

---

## Recommended Stack

### Core Technology: Claude Code Agent Skills Standard

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Agent Skills format | Open standard (agentskills.io) | Skill packaging and discovery | Official Anthropic standard; portable across Claude Code, Codex, Gemini CLI, Cursor, and others. No alternative exists for Claude Code skills. |
| SKILL.md + YAML frontmatter | Current (Jan 2026) | Entry point and metadata | Required by the spec. Two mandatory fields: `name` (max 64 chars, lowercase+hyphens) and `description` (max 1024 chars). |
| Markdown | Standard | All content files | Claude Code reads skills from filesystem using Read tools. Markdown is the native format. |

**Confidence: HIGH** -- Based on official Anthropic documentation at platform.claude.com and code.claude.com.

### MCP Integration

| Technology | Purpose | Why |
|------------|---------|-----|
| `mcp__astro_doc__search_astro_docs` | Official Astro documentation lookup | Already available in project MCP config. The skill provides the "how/why/when" layer; MCP provides the "what" layer (raw API docs, configuration options). |

**Confidence: HIGH** -- MCP tool already configured per PROJECT.md. Official Anthropic docs confirm MCP tool references in skills use `ServerName:tool_name` format.

### No Additional Dependencies

This project requires zero npm packages, zero build tools, zero external services. The deliverable is a folder of Markdown files placed at `.claude/skills/astro-cloudflare/`.

---

## Skill File Structure: Recommended Architecture

### Design Decision: Single Skill with Domain-Based References

**Recommendation:** One skill directory with domain-organized reference files.

**Rationale against multiple skills (one per domain):**
- The 15,000-character default budget for `<available_skills>` metadata means 18 separate skills would consume ~109 chars XML overhead + description length per skill. At ~150 chars average description, that is ~4,662 chars just for our skills, leaving reduced room for other skills the user may have installed.
- The 18 domains are NOT orthogonal capabilities -- they are facets of ONE capability (Astro + Cloudflare development). A user working on an Astro page simultaneously needs rendering, components, routing, and Cloudflare knowledge. Splitting into 18 skills would require Claude to activate multiple skills per task, which is unreliable (50-80% activation rate per skill).
- Official Anthropic best practices show the BigQuery example: one skill with `reference/finance.md`, `reference/sales.md`, etc. This is the canonical pattern for multi-domain knowledge skills.

**Rationale against putting everything in SKILL.md:**
- The 500-line soft limit for SKILL.md body would be exceeded by a factor of 10+ if all 18 domains were inlined.
- Progressive disclosure is the core design principle: SKILL.md should be a navigation hub + critical rules, not a knowledge dump.

**Confidence: HIGH** -- Directly supported by official Anthropic best practices documentation (Pattern 2: Domain-specific organization) and the BigQuery skill example.

### Recommended Directory Layout

```
.claude/skills/astro-cloudflare/
|
|-- SKILL.md                          # Entry point: <500 lines
|                                     # Contains: frontmatter, critical rules,
|                                     # decision matrices (compact), grep hints,
|                                     # MCP integration instructions, navigation
|
|-- references/                       # Domain knowledge files (loaded on demand)
|   |
|   |-- architecture.md              # Project structure, config defaults, conventions
|   |-- rendering.md                 # SSG/SSR/Server Islands, output modes, prerender
|   |-- components.md                # Astro components, props, slots, lifecycle
|   |-- routing.md                   # File-based routing, dynamic routes, API routes
|   |-- data.md                      # Content Layer, collections, loaders, Zod schemas
|   |-- islands.md                   # Hydration directives, nanostores, inter-island comm
|   |-- styling.md                   # CSS strategies, scoped styles, Tailwind integration
|   |-- performance.md              # Core Web Vitals, image optimization, bundling
|   |-- seo.md                       # Meta tags, sitemap, structured data, OG
|   |-- i18n.md                      # Internationalization patterns for Astro
|   |-- typescript.md                # TS config, env.d.ts, type patterns
|   |-- testing.md                   # Vitest, Container API, Playwright
|   |-- build-deploy.md              # Build pipeline, wrangler, Pages vs Workers
|   |-- cloudflare.md                # Bindings, KV/D1/R2, platformProxy, limits
|   |-- security.md                  # CSP, CORS, secrets, auth patterns
|   |-- devx.md                      # Tooling, scripts, debugging, DX patterns
|   |-- advanced-patterns.md         # View Transitions, middleware, Actions advanced
|   |-- markdown-mdx.md              # Content authoring, MDX, Markdoc, remark/rehype
|
|-- templates/                        # Config file templates (copied, not read)
|   |-- astro-config.mjs             # Annotated astro.config.mjs for Cloudflare
|   |-- wrangler.jsonc               # Annotated wrangler.jsonc with common bindings
|   |-- tsconfig.json                # Recommended tsconfig with path aliases
|   |-- env-types.d.ts               # Cloudflare Runtime type declarations
|   |-- content-config.ts            # Content Layer config with loader examples
|   |-- package-scripts.json         # Recommended package.json scripts block
```

**Total: 1 SKILL.md + 18 reference files + 6 template files = 25 files**

**Confidence: HIGH** for the overall structure. MEDIUM for exact template file list (may need iteration based on usage).

### Why This Specific Organization

#### Why organize references by domain (not by concern type)?

The research files are already organized by domain (Architecture, Rendering, Components...). Each file internally contains Quick Reference, Decision Matrix, Anti-patterns, Troubleshooting, and Code Patterns sections. Reorganizing by concern type (e.g., all decision matrices in one file, all anti-patterns in another) would:

1. **Break natural lookup patterns.** When Claude is helping build a routing feature, it needs routing decision matrices AND routing anti-patterns AND routing code patterns. Domain-based organization means one file read, not three.
2. **Increase token waste.** A "decision-matrices.md" file would load ALL decision matrices when Claude only needs the one for rendering mode selection.
3. **Complicate grep hints.** Domain-based grep hints in SKILL.md are intuitive: "For routing patterns: see references/routing.md". Concern-based hints require Claude to know which concern type to search.

**Confidence: HIGH** -- This aligns with Anthropic's official Pattern 2 (domain-specific organization) and minimizes token usage per task.

#### Why separate templates/ from references/?

Templates are files meant to be **copied or adapted** into the user's project. References are files meant to be **read for guidance**. The semantic distinction matters because:

1. Claude should know the intent: "copy this file" vs "read this for advice."
2. Templates are version-sensitive (astro.config.mjs structure changes between Astro versions); references contain timeless patterns.
3. The SKILL.md can provide different navigation for each: "Copy templates/ for project scaffolding" vs "Consult references/ for design decisions."

**Confidence: MEDIUM** -- This is inferred from the official skill structure patterns (skills/ + assets/ separation in Anthropic docs) but not explicitly documented for this use case.

#### Why 18 reference files, not fewer consolidated files?

Fewer files (e.g., consolidating Architecture + Rendering + Components into "core.md") would:

1. Load more tokens than needed for any single query.
2. Reduce the effectiveness of grep hints (broader files mean less targeted results).
3. Create maintenance burden when updating one domain.

18 files match the 18 research source files. Each reference file should be 200-400 lines (condensed from the 400-700 line research originals by removing what Claude already knows and what the MCP server covers).

**Confidence: MEDIUM** -- The exact number may change during implementation. Some domains may be thin enough to merge (e.g., security + CSP could fold into cloudflare.md). Target: no reference file under 100 lines (merge if too thin) and none over 500 lines (split if too thick).

---

## SKILL.md Content Architecture

### Frontmatter Design

```yaml
---
name: astro-cloudflare
description: |
  Astro 5.17+ development on Cloudflare Workers/Pages. Provides best
  practices, decision matrices, anti-patterns, and code templates.
  Use when: working on .astro files, astro.config, wrangler.jsonc,
  Cloudflare bindings (KV/D1/R2), Content Layer, Server Islands,
  hydration directives, Astro Actions, or Astro middleware.
  Use search_astro_docs MCP tool for official API documentation.
---
```

**Key design choices:**
- Name: `astro-cloudflare` (17 chars, descriptive, within 64-char limit)
- Description: packed with trigger keywords (file extensions, config names, Cloudflare services, Astro features). Lists specific Astro concepts to maximize activation probability.
- Includes MCP tool reference in description to prime Claude for MCP usage.
- Third-person voice per official best practices.
- Under 1024 characters.

**Confidence: HIGH** -- Based on official triggering optimization guidance. The description includes specific file patterns and feature names that match real user prompts.

### SKILL.md Body Structure (Target: 350-450 lines)

```
Section 1: Critical Rules (50-70 lines)
  - 15-20 imperative rules that prevent common mistakes
  - These are the "always do / never do" items
  - Sourced from Anti-patterns Tables across all 18 research files
  - Only rules Claude would NOT know from training data

Section 2: Decision Matrices (80-120 lines, compact tables)
  - Rendering mode selection (SSG vs SSR vs Server Islands)
  - Hydration directive selection (client:load vs :visible vs :idle)
  - Actions vs API Routes
  - Image service selection (passthrough vs compile vs cloudflare)
  - Pages vs Workers deployment
  - These are the highest-value condensations from the research

Section 3: MCP Integration Instructions (20-30 lines)
  - When to use search_astro_docs vs reference files
  - MCP tool provides: official API docs, configuration reference, changelog
  - Skill provides: best practices, anti-patterns, decision guidance, templates
  - Example MCP query patterns

Section 4: Reference Navigation (60-80 lines)
  - One block per domain with:
    - 1-line description of what the reference covers
    - grep hint for key sections
  - Example:
    "## Cloudflare Integration
     Bindings, KV/D1/R2, platformProxy, Worker limits, env vars.
     grep -n "^## " references/cloudflare.md"

Section 5: Template Usage (30-40 lines)
  - When to use each template
  - Scaffolding workflow: "For new project, copy templates/ and customize"
  - Template modification guidance

Section 6: Project Conventions (30-50 lines)
  - Naming conventions table (compact)
  - Directory structure overview
  - File placement rules
```

**Total estimate: ~350-450 lines. Under the 500-line limit with margin.**

**Confidence: MEDIUM** -- The line counts are estimates. Final structure will emerge during content condensation. The section ordering prioritizes what Claude needs most often (critical rules first, since they prevent errors on every task).

---

## Reference File Content Strategy

### Condensation Protocol

Each reference file is condensed from its corresponding research file using this protocol:

| Source Section | Transformation | Target in Reference |
|----------------|----------------|---------------------|
| Quick Reference (15-20 rules) | Keep rules Claude does NOT already know. Remove obvious items. | Top of file, numbered list |
| Decision Matrix | Keep as table. Remove obvious decisions. | Decision Matrix section |
| Anti-patterns Table | Keep critical anti-patterns. Remove those covered in SKILL.md. | Anti-patterns section |
| Troubleshooting Table | Keep Cloudflare-specific and Astro 5.x-specific issues. Remove generic items. | Troubleshooting section |
| Code Patterns | Keep 1-2 canonical examples per pattern. Remove verbose alternatives. | Code Patterns section |

**Target per file: 200-400 lines** (from 400-700 line originals).

**Key principle: Do not duplicate what the MCP `search_astro_docs` tool provides.** The MCP tool covers official API documentation, configuration options, and getting-started guides. The reference files cover: best practices, anti-patterns, decision guidance, Cloudflare-specific gotchas, and patterns that are NOT in the official docs (community-discovered, version-specific workarounds).

**Confidence: HIGH** for the condensation protocol. MEDIUM for target line counts (depends on how much Claude already knows per domain).

### Deduplication with SKILL.md

Any rule or anti-pattern that appears in SKILL.md MUST NOT appear in the reference files. Information exists in exactly ONE place:

- SKILL.md: Cross-cutting rules that apply to ALL domains
- references/X.md: Domain-specific rules that apply only when working in domain X

**Confidence: HIGH** -- This is an official anti-pattern to avoid (duplication SKILL.md <-> references/).

---

## MCP Integration Architecture

### Skill + MCP Coupling Pattern

```
User asks about Astro feature
        |
        v
Claude activates astro-cloudflare skill
        |
        v
SKILL.md loaded: critical rules + decision matrices + grep hints
        |
        v
    [Is this a "how to use the API" question?]
    YES --> Use search_astro_docs MCP tool for official docs
    NO  --> Read references/domain.md for best practices & patterns
        |
        v
    [Is this a "scaffold new project" task?]
    YES --> Copy from templates/, customize based on SKILL.md rules
    NO  --> Apply guidance from references + SKILL.md rules
```

### MCP Tool Reference Format in SKILL.md

Per official Anthropic documentation, MCP tool references MUST use fully qualified names:

```markdown
## Official Documentation

For official Astro API documentation, configuration reference, and
getting-started guides, use the MCP documentation tool:

  mcp__astro_doc__search_astro_docs("query about astro feature")

This skill provides the OPINIONATED layer:
- WHEN to use which feature (decision matrices)
- HOW to avoid common mistakes (anti-patterns)
- WHAT patterns work best on Cloudflare (platform-specific guidance)
- WHY certain approaches are preferred (rationale)

The MCP tool provides the FACTUAL layer:
- API signatures and parameters
- Configuration option lists
- Official examples and tutorials
- Version-specific changelog entries
```

**Confidence: HIGH** -- MCP tool name format verified via official docs. The skill/MCP division of responsibility is a design decision with HIGH confidence based on PROJECT.md constraints and the "don't duplicate official docs" principle.

---

## Alternatives Considered

| Decision | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| One skill vs 18 skills | Single `astro-cloudflare` skill | One skill per domain | 18 skills would consume excessive `<available_skills>` budget (~4.7K chars). Activation unreliable for multi-domain tasks. Official pattern is single skill with domain references. |
| References by domain vs by concern | By domain (routing.md, cloudflare.md) | By concern (decision-matrices.md, anti-patterns.md) | Domain-based matches how users think and reduces tokens per task. Cross-domain concerns go in SKILL.md body. |
| Flat references/ vs nested references/core/ + references/platform/ | Flat `references/` | Nested subdirectories | Official guidance: one level deep from SKILL.md. Nesting adds complexity with no benefit for 18 files. |
| Templates as separate files vs inline in references | Separate `templates/` directory | Inline code blocks in reference files | Templates are meant to be copied; references are meant to be read. Different usage intent warrants different location. |
| SKILL.md as navigation hub vs comprehensive guide | Navigation hub + critical rules | Comprehensive guide with everything | 500-line limit makes comprehensive impossible. Hub pattern matches official progressive disclosure architecture. |
| Integrate MCP references vs standalone | Coupled with MCP | Standalone (no MCP dependency) | MCP provides current official docs. Skill provides opinionated layer. Duplication would increase maintenance burden and skill size. |

---

## Token Budget Analysis

### Metadata Cost (Level 1 -- Always Loaded)

- Name: ~5 tokens
- Description: ~80-100 tokens (targeting 600-800 chars)
- XML overhead: ~109 chars
- **Total Level 1 cost: ~120 tokens per API request**

This leaves ample room within the 15,000-character default budget for other skills.

### SKILL.md Cost (Level 2 -- Loaded When Skill Activates)

- Target: 350-450 lines
- Estimated: ~3,000-4,000 tokens
- Within the recommended <5,000 token guideline

### Reference File Cost (Level 3 -- Loaded On Demand)

- Per file: 200-400 lines = ~1,500-3,000 tokens
- Typical task loads 1-3 reference files = ~3,000-9,000 tokens
- Worst case (complex task needing 5+ domains): ~15,000 tokens
- **No fixed budget constraint on Level 3** -- files loaded only when needed

### Template File Cost

- Templates loaded only during scaffolding tasks
- Each template: 30-80 lines = ~300-800 tokens
- All templates loaded at once for scaffolding: ~2,000-4,000 tokens

**Total typical task token cost: ~6,000-13,000 tokens** (SKILL.md + 1-3 reference files)
**Total scaffolding task token cost: ~7,000-8,000 tokens** (SKILL.md + templates)

**Confidence: MEDIUM** -- Token estimates are approximate. Actual costs depend on content density and Claude's tokenizer behavior.

---

## Implementation Constraints

### Hard Constraints (Official/Verified)

| Constraint | Limit | Source | Confidence |
|------------|-------|--------|------------|
| `name` field | Max 64 chars, `[a-z0-9-]` only | Official Anthropic docs | HIGH |
| `description` field | Max 1024 chars, no XML tags | Official Anthropic docs | HIGH |
| SKILL.md body | <500 lines recommended | Official Anthropic best practices | HIGH |
| Reference depth | One level from SKILL.md | Official Anthropic best practices | HIGH |
| Skills metadata budget | 15,000 chars default (`SLASH_COMMAND_TOOL_CHAR_BUDGET`) | Official docs + GitHub issue #13099 | HIGH |
| No "anthropic" or "claude" in name | Reserved words | Official Anthropic docs | HIGH |

### Soft Constraints (Community/Inferred)

| Constraint | Guideline | Source | Confidence |
|------------|-----------|--------|------------|
| Reference files >100 lines need TOC | Aids Claude's partial reads | Official best practices | HIGH |
| Avoid time-sensitive information | Use "OLD PATTERNS" sections | Official best practices | HIGH |
| Skill activation rate | 50-80% in practice | Community reports, GitHub issues | MEDIUM |
| Description keywords match activation | Specific terms > vague descriptions | Official + community testing (20% to 90% improvement) | HIGH |

---

## Skill Placement Decision

### Recommendation: Project-level skill at `.claude/skills/astro-cloudflare/`

**Not personal (`~/.claude/skills/`)** because:
- The skill is tied to Astro + Cloudflare projects, not general-purpose
- Version-controlled with the skill project repo for maintenance and distribution
- Can be copied to client projects' `.claude/skills/` as needed

**Not plugin format** because:
- Plugin distribution adds complexity not needed for personal freelance use
- Plugin format is for marketplace distribution, which is out of scope

**Confidence: HIGH** -- Matches official guidance for project-scoped skills committed to version control.

---

## Sources

### Official (HIGH confidence)
- [Skill authoring best practices - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Extend Claude with skills - Claude Code Docs](https://code.claude.com/docs/en/skills)
- [Agent Skills overview - Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Equipping agents for the real world with Agent Skills - Anthropic Engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Agent Skills specification](https://agentskills.io)
- [anthropics/skills GitHub repository](https://github.com/anthropics/skills)

### Community (MEDIUM confidence)
- [Inside Claude Code Skills: Structure, prompts, invocation - Mikhail Shilkov](https://mikhail.io/2025/10/claude-code-skills/)
- [Claude Agent Skills: A First Principles Deep Dive - Lee Hanchung](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)
- [Claude Skills and CLAUDE.md: a practical 2026 guide for teams](https://www.gend.co/blog/claude-skills-claude-md-guide)
- [GitHub issue #13099: Document available_skills character budget limit](https://github.com/anthropics/claude-code/issues/13099)
- [Claude Code skills not triggering? It might not see them](https://blog.fsck.com/2025/12/17/claude-code-skills-not-triggering/)

### Project-Specific
- `docs/cc-skills/Guide complet des Skills personnalises pour Claude Code.md` (local research)
- `docs/cc-skills/Transformer une documentation technique volumineuse en Claude Code Skill optimise.md` (local research)
- `docs/researchs/1 - Architecture.md` through `docs/researchs/18 - Markdown MDX Markdoc.md` (18 source research files)
