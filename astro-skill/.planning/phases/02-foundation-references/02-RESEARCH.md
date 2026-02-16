# Phase 2: Foundation References - Research

**Researched:** 2026-02-03
**Domain:** Astro 5.x project structure, rendering modes, Cloudflare platform integration
**Confidence:** HIGH

## Summary

This research covers the three foundation reference files for the Astro/Cloudflare Claude Code Skill: `project-structure.md`, `rendering-modes.md`, and `cloudflare-platform.md`. These files must capture platform-level knowledge that Claude gets wrong from training data -- specifically Astro 5.x breaking changes from v4, Cloudflare Workers runtime constraints, and the intersection of both.

The source material is strong: 18 existing research files (docs/researchs/) contain ~8,750 lines of verified content. Research files 1 (Architecture), 2 (Rendering Modes), and 14 (Cloudflare Integration) map directly to our three targets. The main research task was verifying this content against current official documentation, identifying what has changed since the research was written, and determining what Claude actually needs (vs what it already knows).

Key finding: Astro 6 beta (Dec 2025) introduces workerd dev mode and changes to `Astro.locals.runtime`, but the skill targets Astro 5.17+. The reference files should note Astro 6 as forward-looking but write all patterns for 5.x. Cloudflare has officially deprecated Pages in favor of Workers (April 2025), which changes the default deployment recommendation.

**Primary recommendation:** Write each reference file as a prescriptive, table-heavy document of 150-250 lines, drawing from verified research files 1/2/14, with config templates distributed by domain (astro.config in project-structure, wrangler.jsonc in cloudflare-platform, etc.).

## Standard Stack

This phase produces Markdown reference files, not code. The "stack" is the knowledge domain being documented.

### Core Knowledge Domains

| Domain | Target File | Primary Source | Secondary Sources |
|--------|------------|----------------|-------------------|
| Project structure, naming, config defaults | `project-structure.md` | Research file 1 (Architecture) | Astro official project structure docs |
| Rendering modes, prerender, Server Islands | `rendering-modes.md` | Research file 2 (Rendering Modes) | Astro rendering modes docs, v5 upgrade guide |
| Cloudflare bindings, limits, platform | `cloudflare-platform.md` | Research file 14 (Cloudflare Integration) | Cloudflare Workers docs, adapter docs |

### Config Files to Document (distributed across reference files)

| Config File | Goes In | Why There |
|-------------|---------|-----------|
| `astro.config.mjs` (SSG/SSR/hybrid variants) | `project-structure.md` | Core project config, covers output modes |
| `tsconfig.json` | `project-structure.md` | TypeScript project setup |
| `src/content.config.ts` | `project-structure.md` | Content Layer config, project-level |
| `src/env.d.ts` | `project-structure.md` | Type declarations, project-level |
| `package.json` scripts | `project-structure.md` | Dev workflow, project-level |
| `.gitignore` entries | `project-structure.md` | Project hygiene |
| `wrangler.jsonc` | `cloudflare-platform.md` | Cloudflare-specific config |
| `.dev.vars` | `cloudflare-platform.md` | Cloudflare env management |

## Architecture Patterns

### Pattern 1: Quick Reference Header

**What:** Every reference file starts with a 5-10 line Quick Reference block containing the most critical rules for that domain. Claude can stop reading there for simple cases.

**Why:** CONTEXT.md decision: "Quick Reference systematique en tete de chaque fichier." This matches the progressive disclosure principle -- Claude loads the file, reads the Quick Reference, and only continues if the task requires deeper knowledge.

**Structure:**
```markdown
## Quick Reference

1. Rule one -- imperative, one line
2. Rule two -- imperative, one line
...
```

### Pattern 2: Concept-Based Hierarchy

**What:** Organize sections by concept (File Organization > Naming > Config Files), not by action (Creating a Page > Adding a Component).

**Why:** CONTEXT.md decision: "Hierarchie par concept, pas par action." This matches how Claude looks up information -- it needs to know "what are the naming conventions" not "how to create a file."

### Pattern 3: Config Template Variants

**What:** Provide multiple config variants per file (SSG, SSR, hybrid for astro.config.mjs). Each is copy-pasteable without package versions.

**Why:** CONTEXT.md decision: "Plusieurs variantes par fichier de config" and "Pas de versions de packages dans les templates." Claude copies the template and uses the MCP for current package versions.

### Pattern 4: Anti-patterns Section at End

**What:** Dedicated `## Anti-patterns` section at the end of each file. No confidence tags -- all presented as absolute rules. Troubleshooting in symptom/cause/fix tables with one-line fixes.

**Why:** CONTEXT.md decision: "Anti-patterns dans une section dediee en fin de fichier" and "Pas de confidence tags." The one-line fix constraint is a design rule from CONTEXT.md -- complex fixes point to Patterns or Config Templates sections.

### Recommended Section Order (Claude's Discretion)

For each reference file, use this section ordering:

```
## Quick Reference          (5-10 lines, critical rules)
## [Concept Sections]       (tables + code blocks, domain-specific)
## Config Templates         (copy-pasteable variants)
## Anti-patterns            (don't/do/impact table)
## Troubleshooting          (symptom/cause/fix table)
```

This ordering supports progressive reading: Quick Reference first, concept sections for understanding, templates for action, anti-patterns and troubleshooting for problem-solving.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Astro 5.x breaking changes list | Manual research | Existing research file 1 + verified v5 upgrade guide | Already catalogued: content.config.ts location, slug->id, type->loader, ViewTransitions->ClientRouter, render() API change |
| Cloudflare Workers limits table | Manual research | Existing research file 14 + official limits page | Already structured: Free vs Paid, memory/CPU/bundle/subrequests |
| Rendering mode decision matrix | Manual research | Existing research file 2 | Already has situation/mode/config/reason table with 9+ scenarios |
| Config templates | Start from scratch | Existing research file 1 code patterns | Already has annotated astro.config, wrangler.jsonc, tsconfig, env.d.ts, content.config.ts, package.json scripts |

**Key insight:** The 18 research files are the primary source. The planner's job is condensation and verification, not creation. Each research file already has Quick Reference, Decision Matrix, Anti-patterns, Troubleshooting, and Code Patterns sections -- the exact structure the reference files need.

## Common Pitfalls

### Pitfall 1: Including What Claude Already Knows

**What goes wrong:** Writing basic Astro syntax (`.astro` file structure, frontmatter, slots) that Claude's training data covers well. This wastes the 150-250 line budget on non-value content.
**Why it happens:** Research files are comprehensive and include basics for completeness.
**How to avoid:** Focus exclusively on: (a) Astro 5.x breaking changes vs 4.x, (b) Cloudflare-specific constraints, (c) intersection knowledge neither Astro nor CF docs cover well. For each line, ask: "Would Claude do this correctly without the skill?"
**Warning signs:** Sections explaining what `.astro` files are, how slots work, or basic TypeScript.

### Pitfall 2: Time-Sensitive Version Numbers

**What goes wrong:** Hardcoding `@astrojs/cloudflare 12.6.12` or `wrangler v3.91.0` in templates. These become stale immediately.
**Why it happens:** Research files snapshot specific versions.
**How to avoid:** CONTEXT.md decision: "Pas de versions de packages dans les templates." Use version ranges only for breaking changes: "Since Astro 5.0: content.config.ts at src/ root." Use generic "Astro 5.x" otherwise.
**Warning signs:** Exact patch version numbers in code templates, date-specific compatibility_date values without "or later" qualifier.

### Pitfall 3: Duplicating Between Reference Files

**What goes wrong:** The same anti-pattern (e.g., `process.env` not working on Workers) appears in both `project-structure.md` and `cloudflare-platform.md`.
**Why it happens:** Cross-cutting concerns touch multiple domains.
**How to avoid:** Each fact lives in exactly ONE file. Use the domain assignment: project-level concerns in project-structure, Cloudflare-specific in cloudflare-platform, rendering-specific in rendering-modes.
**Warning signs:** Grep for the same error message or rule appearing in multiple files.

### Pitfall 4: MCP References in Reference Files

**What goes wrong:** Adding "use search_astro_docs for..." instructions in the reference files.
**Why it happens:** Seems helpful to guide Claude to MCP.
**How to avoid:** CONTEXT.md decision: "pas de references croisees vers search_astro_docs dans les fichiers de reference (reserve a SKILL.md body en Phase 5)." MCP integration instructions go ONLY in SKILL.md body.
**Warning signs:** Any mention of `search_astro_docs` or MCP in reference files.

### Pitfall 5: Multi-Line Fixes in Troubleshooting Tables

**What goes wrong:** Troubleshooting fix cells contain code blocks or multi-line instructions, breaking Markdown table formatting.
**Why it happens:** Some fixes genuinely require multiple steps.
**How to avoid:** CONTEXT.md decision: "Le fix doit tenir en une ligne." If the fix needs multi-line code, the table cell should say "See Config Templates > [section name]" and point to the relevant template.
**Warning signs:** Newlines or backtick code blocks inside table cells.

### Pitfall 6: Ignoring Astro 6 Forward Compatibility

**What goes wrong:** Writing patterns that will break in Astro 6 (e.g., `Astro.locals.runtime` access pattern changes in v6).
**Why it happens:** Skill targets 5.17+ but Astro 6 beta is already out.
**How to avoid:** Note Astro 6 changes where relevant ("Note: This pattern changes in Astro 6") but write all primary patterns for 5.x. Do not write Astro 6 patterns as primary guidance.
**Warning signs:** Using Astro 6-only APIs without noting version requirement.

## Code Examples

### project-structure.md: astro.config.mjs SSG Variant

```javascript
// astro.config.mjs -- SSG (default, no adapter needed for pure static)
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',
  // No output or adapter needed for pure SSG
  trailingSlash: 'never',
  compressHTML: true,
});
```

### project-structure.md: astro.config.mjs SSR Variant

```javascript
// astro.config.mjs -- SSR on Cloudflare Workers
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://example.com',
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
  trailingSlash: 'never',
  compressHTML: true,
});
```

### project-structure.md: astro.config.mjs Hybrid Variant (static + opt-out SSR)

```javascript
// astro.config.mjs -- Static default with SSR opt-out per page
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://example.com',
  output: 'static', // or omit (static is default)
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
});
// Pages needing SSR: export const prerender = false
```

### cloudflare-platform.md: wrangler.jsonc (Workers)

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "my-astro-app",
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "none"
  },
  "kv_namespaces": [],
  "vars": {}
}
```

### rendering-modes.md: Server Island with Fallback

```astro
---
// Parent page (static)
import UserWidget from '../components/UserWidget.astro';
---
<UserWidget server:defer userId={user.id}>
  <div slot="fallback" style="height:48px;width:120px">
    Loading...
  </div>
</UserWidget>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/content/config.ts` | `src/content.config.ts` | Astro 5.0 | Build fails if old location used |
| `output: 'hybrid'` | `output: 'static'` (hybrid is default behavior) | Astro 5.0 | Config error if hybrid used |
| `entry.slug` | `entry.id` | Astro 5.0 | Runtime undefined |
| `entry.render()` | `import { render } from 'astro:content'` | Astro 5.0 | Method not found error |
| `<ViewTransitions />` | `<ClientRouter />` from `astro:transitions` | Astro 5.0 | Deprecated, removed in 6.0 |
| `type: 'content'` in collections | `loader: glob({...})` | Astro 5.0 | Collections not detected |
| `src/env.d.ts` auto-generated | `.astro/types.d.ts` in tsconfig include | Astro 5.0 | Types missing |
| `wrangler.toml` | `wrangler.jsonc` (recommended) | wrangler v3.91+ | Still works but jsonc preferred |
| Cloudflare Pages (default) | Cloudflare Workers with assets | April 2025 | Pages deprecated, no new features |
| `Astro.locals.runtime.env` | Direct platform APIs (Astro 6 only) | Astro 6.0 beta | 5.x pattern still current |

**Deprecated/outdated:**
- `output: 'hybrid'` -- removed in Astro 5.0, use `output: 'static'` instead (same behavior)
- `Astro.glob()` -- deprecated, use `import.meta.glob()` instead; removed in Astro 6.0
- Legacy content collections (`type: 'content'`) -- deprecated in 5.0, removed in 6.0
- Cloudflare Pages for new projects -- deprecated April 2025, migrate to Workers

## Verified Content Per Reference File

### project-structure.md Content Map

| Section | Content | Source | Verified |
|---------|---------|--------|----------|
| Quick Reference | 5-10 rules: content.config.ts location, .astro/types.d.ts, src/assets vs public/, naming conventions | Research 1 rules 1-8 | YES - docs.astro.build/project-structure + v5 upgrade guide |
| File Organization | Directory tree (simple + complex), purpose of each dir | Research 1 section 2 | YES - official project structure docs |
| Naming Conventions | Table: PascalCase components, kebab-case pages, exact files | Research 1 section 6 | YES - official conventions |
| Config: astro.config.mjs | 3 variants: SSG, SSR, hybrid. No package versions | Research 1 section 3 + 8 | YES - adapter docs verified |
| Config: tsconfig.json | Strict preset, .astro/types.d.ts include, path aliases | Research 1 section 3 | YES - v5 upgrade guide confirms |
| Config: env.d.ts | Runtime type, CloudflareEnv interface, App.Locals | Research 1 section 3 | YES - adapter docs |
| Config: content.config.ts | Glob/file loaders, Zod schemas, collections export | Research 1 section 8 | YES - content collections docs |
| Config: package.json scripts | wrangler types + astro dev, build, preview, deploy | Research 1 section 8 | YES - verified pattern |
| Config: .gitignore | .wrangler/, .dev.vars, dist/, .astro/ | Common CF patterns | MEDIUM - standard practice |
| Anti-patterns | ~8-10 rules from Research 1 section 5 | Research 1 | YES - verified against official docs |
| Troubleshooting | ~8-10 entries from Research 1 section 7 | Research 1 | YES - verified symptoms match |

### rendering-modes.md Content Map

| Section | Content | Source | Verified |
|---------|---------|--------|----------|
| Quick Reference | 5-10 rules: static vs server, no hybrid, prerender static values only, Server Islands adapter required | Research 2 section 1 | YES - rendering modes docs + v5 upgrade guide |
| Output Modes | static vs server comparison, prerender toggle, astro:route:setup hook | Research 2 section 2 | YES - rendering modes docs |
| Decision Matrix | 9+ scenarios: site type -> recommended mode -> config | Research 2 section 2 | YES - patterns match official guidance |
| Server Islands | server:defer, fallback slot, props serialization, cache headers, URL via Referer, ASTRO_KEY | Research 2 section 6 | YES - server islands docs verified |
| Server Islands vs Alternatives | When to use SI vs client hydration vs full SSR vs partials | Research 2 section 3 | MEDIUM - inference-based |
| Feature Compatibility Matrix | Features x Modes table (sessions, actions, content layer, etc.) | Research 2 section 7 | HIGH - matches official behavior |
| Anti-patterns | ~8-10 rules: hybrid config, dynamic prerender, process.env, missing fallback | Research 2 section 4 | YES |
| Troubleshooting | ~8-10 entries: getStaticPaths required, InvalidPrerenderExport, 1042/522 errors | Research 2 section 5 | YES |

### cloudflare-platform.md Content Map

| Section | Content | Source | Verified |
|---------|---------|--------|----------|
| Quick Reference | 5-10 rules: nodejs_compat, bindings via locals.runtime.env, .dev.vars not .env, no Sharp, node: prefix | Research 14 section 1 | YES - adapter docs + workers docs |
| Bindings Access | Pattern for KV/D1/R2 in pages, endpoints, middleware, actions. AsyncLocalStorage pattern for deep access | Research 14 section 5 | YES - adapter docs confirm pattern |
| Workers Limits | Free vs Paid table: memory, CPU, bundle, subrequests, file count | Research 14 section 6 + official limits page | YES - verified Feb 2026 |
| Node.js Compatibility | Module status table, compatibility flags timeline | Research 14 section 6 | HIGH - verified against workers docs |
| Pages vs Workers | Workers is default for new projects, Pages deprecated April 2025, migration guidance | WebSearch verified | YES - Cloudflare official announcement |
| Config: wrangler.jsonc | Full annotated template with bindings, assets, compat flags, environments | Research 14 section 6 | YES - verified against wrangler docs |
| Config: .dev.vars | Usage, .env interaction rule, gitignore | Research 14 section 1 + CF env vars docs | YES |
| Environment Variables | .dev.vars vs .env, wrangler secret put, vars in config | CF env vars docs | YES |
| Anti-patterns | ~8-10 rules: cloudflare:workers import, global bindings, KV counters, Sharp, process.env | Research 14 section 3 | YES |
| Troubleshooting | ~8-10 entries: node:stream errors, size limits, undefined env, platformProxy | Research 14 section 4 | YES |

## Open Questions

1. **Astro 6 `Astro.locals.runtime` deprecation timeline**
   - What we know: Astro 6 beta introduces direct platform API access, removing the need for `Astro.locals.runtime`
   - What's unclear: Exact timeline for stable release, whether 5.x pattern will have a migration period
   - Recommendation: Write patterns for 5.x (`Astro.locals.runtime.env`), add a one-line note about Astro 6 change where relevant

2. **`nodejs_compat_populate_process_env` flag date requirement**
   - What we know: Research 14 says compatibility_date 2025-04-01+ auto-enables it
   - What's unclear: Whether this date is confirmed or from beta docs
   - Recommendation: Include the flag explicitly in wrangler.jsonc template rather than relying on date auto-enable. Flag it as LOW confidence and verify during implementation.

3. **`run_worker_first` in wrangler assets config**
   - What we know: Research 14 shows this option for controlling SSR vs static routing
   - What's unclear: Whether this is fully stable or still changing
   - Recommendation: Include in the advanced wrangler.jsonc variant but note it as newer feature

4. **Exact line count per file**
   - What we know: CONTEXT.md says 150-250 lines per file
   - What's unclear: Whether the rich content maps above can fit in 250 lines
   - Recommendation: Prioritize ruthlessly. Quick Reference (10 lines) + 3-4 concept sections (80-120 lines) + config templates (40-60 lines) + anti-patterns table (20-30 lines) + troubleshooting table (20-30 lines) = ~170-250 lines. Feasible but tight.

## Sources

### Primary (HIGH confidence)

- [Astro Project Structure](https://docs.astro.build/en/basics/project-structure/) -- directory layout, naming conventions
- [Astro Rendering Modes](https://docs.astro.build/en/basics/rendering-modes/) -- static vs server, prerender toggle
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) -- content.config.ts location, Content Layer API, loaders
- [Astro Server Islands](https://docs.astro.build/en/guides/server-islands/) -- server:defer, fallback, props, caching
- [Astro v5 Upgrade Guide](https://docs.astro.build/en/guides/upgrade-to/v5/) -- all breaking changes v4->v5
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) -- platformProxy, imageService, bindings access, sessions
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) -- memory, CPU, bundle, subrequests (verified Feb 2026)
- [Cloudflare Env Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/) -- .dev.vars vs .env, secrets management
- Research file 1 (Architecture) -- project structure, configs, naming (pre-verified source)
- Research file 2 (Rendering Modes) -- rendering modes, Server Islands, decision matrices (pre-verified source)
- Research file 14 (Cloudflare Integration) -- bindings, limits, compatibility (pre-verified source)

### Secondary (MEDIUM confidence)

- [Astro 6 Beta Blog Post](https://astro.build/blog/astro-6-beta/) -- workerd dev mode, Astro.locals.runtime changes
- [Cloudflare Pages Deprecation](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) -- Workers is primary platform
- [Astro 5.0 Blog Post](https://astro.build/blog/astro-5/) -- hybrid removal rationale
- [Cloudflare Acquires Astro](https://blog.cloudflare.com/astro-joins-cloudflare/) -- Astro joining Cloudflare, Jan 2026

### Tertiary (LOW confidence)

- `nodejs_compat_populate_process_env` flag auto-enable date (2025-04-01) -- from Research 14, needs validation against latest compat flags docs
- `run_worker_first` assets config option -- from Research 14, newer feature, verify stability

## Metadata

**Confidence breakdown:**
- Project structure: HIGH -- Astro official docs verified, research file 1 cross-referenced
- Rendering modes: HIGH -- Astro official docs verified, v5 breaking changes confirmed, research file 2 cross-referenced
- Cloudflare platform: HIGH -- Workers docs verified, adapter docs verified, research file 14 cross-referenced
- Config templates: HIGH -- All templates verified against current official docs, no package versions included per CONTEXT.md
- Anti-patterns: HIGH -- Most are from official docs or confirmed GitHub issues
- Troubleshooting: HIGH/MEDIUM -- Symptoms verified against known issues, some community-sourced fixes

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days -- stable domain, Astro 5.x is current stable release)
