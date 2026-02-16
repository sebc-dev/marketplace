# Phase 1: Scaffolding and Frontmatter - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the skill directory structure at `.claude/skills/astro-cloudflare/`, write the SKILL.md frontmatter for auto-activation on Astro+Cloudflare projects, create empty stub files for all planned reference files, and establish the progressive disclosure architecture (frontmatter → body → references).

</domain>

<decisions>
## Implementation Decisions

### Activation strategy
- Skill targets **Astro + Cloudflare only** — both must be present for activation
- Primary detection via **file patterns**: `*.astro`, `astro.config.*`, `wrangler.*`, `wrangler.jsonc`
- Also include **textual "use when" triggers** so the skill activates when users ask Astro/Cloudflare questions even without an existing project
- Frontmatter description should be keyword-packed (<1024 chars) with Astro+CF terminology

### Reference file organization
- One file per **technical domain** (not grouped by concern/phase)
- **Descriptive names**: `components-islands.md`, `routing-navigation.md`, `cloudflare-platform.md`, etc.
- **Flat structure**: all files directly in `references/` — no subdirectories
- File list follows the roadmap (phases 2-4): project-structure, rendering-modes, cloudflare-platform, components-islands, routing-navigation, data-content, styling-performance, seo-i18n, typescript-testing, build-deploy, security-advanced

### Progressive disclosure architecture
- **Frontmatter (~100 tokens)**: activation only — file patterns, keywords, triggers. No instructional content.
- **Body (<500 lines)**: role determined in Phase 5 — frontmatter-only in Phase 1
- **References**: accessed via **grep hints** in SKILL.md body — Claude uses targeted grep patterns to find exact sections, not full file reads

### Stub content
- **Minimal stubs**: title only (e.g., `# Components & Islands`) — no headers, no section structure, no phase markers
- Each phase that fills a reference decides its own internal structure
- **SKILL.md in Phase 1**: frontmatter only, body written in Phase 5

### Claude's Discretion
- False positive handling (Astro projects without Cloudflare)
- Body SKILL.md role balancing (rules vs navigation) — decided in Phase 5
- Session compaction resilience timing — whether to address in Phase 1 structure or defer to Phase 5-6

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The skill should follow Claude Code skill format conventions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-scaffolding-and-frontmatter*
*Context gathered: 2026-02-03*
