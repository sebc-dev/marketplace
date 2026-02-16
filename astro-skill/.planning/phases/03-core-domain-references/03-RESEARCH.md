# Phase 3: Core Domain References - Research

**Researched:** 2026-02-03
**Domain:** Astro 5.17+ feature-level knowledge: components/islands, routing/navigation, data/content, styling/performance on Cloudflare Workers
**Confidence:** HIGH

## Summary

This research covers the four core domain reference files for the Astro/Cloudflare Claude Code Skill: `components-islands.md`, `routing-navigation.md`, `data-content.md`, and `styling-performance.md`. Each file must provide Claude with feature-level knowledge that goes beyond what training data covers -- specifically Astro 5.x API changes, Cloudflare Workers constraints per domain, and the decision matrices that guide correct pattern selection.

The source material is strong: existing research files 3 (Composants), 4 (Routing), 5 (Gestion des donnees), 6 (Islands Architecture), 7 (Styling), 8 (Performance), and 18 (Markdown/MDX/Markdoc) contain ~4,500 lines of verified content across these domains. The research files already follow a structure similar to Phase 2's reference file pattern (Quick Reference, Decision Matrix, Anti-patterns, Troubleshooting, Code Patterns).

Key constraint: Each file targets ~300 lines (up from Phase 2's ~150-250). This is still tight given the domain density. The planner must be ruthless about including only content that Claude would get wrong without the skill -- not basic Astro syntax Claude already knows.

**Primary recommendation:** For each reference file, draw from the corresponding research files. Prioritize: (1) Astro 5.x breaking changes from v4, (2) Cloudflare-specific constraints/workarounds, (3) decision matrices for choosing between alternatives, (4) counter-intuitive anti-patterns. Omit anything Claude reliably knows from training data (basic .astro syntax, basic HTML semantics, etc.).

## Standard Stack

This phase produces Markdown reference files, not code. The "stack" is the knowledge domain being documented.

### Core Knowledge Domains

| Domain | Target File | Primary Sources | Secondary Sources |
|--------|------------|-----------------|-------------------|
| Components, Islands Architecture, hydration directives, nanostores | `components-islands.md` | Research 3 (Composants) + Research 6 (Islands) | Astro directives reference, Server Islands docs |
| File-based routing, dynamic routes, ClientRouter, middleware, redirects | `routing-navigation.md` | Research 4 (Routing) | Astro routing docs, middleware docs, v5 upgrade guide |
| Content Layer API, loaders, collections, Astro Actions, MDX/Markdoc | `data-content.md` | Research 5 (Gestion des donnees) + Research 18 (Markdown/MDX) | Content collections docs, Actions docs |
| Scoped styles, Tailwind v4, image optimization, bundle analysis, CWV | `styling-performance.md` | Research 7 (Styling) + Research 8 (Performance) | Astro styling docs, images docs, Cloudflare headers docs |

### Cross-Domain Content Assignment

Some topics touch multiple files. Assignment prevents duplication:

| Topic | Lives In | NOT In |
|-------|----------|--------|
| Hydration directives (client:visible/idle/load) | components-islands | styling-performance |
| Server Islands (server:defer) | components-islands | routing-navigation |
| Middleware basics (signature, sequence, redirects) | routing-navigation | data-content |
| Middleware auth/CSP | Phase 4 (security-advanced) | routing-navigation |
| Astro Actions basics (defineAction, vs API routes) | data-content | routing-navigation |
| Actions CSRF/validation | Phase 4 (security-advanced) | data-content |
| Image optimization (Image component, services) | styling-performance | components-islands |
| Tailwind v4 setup | styling-performance | project-structure (Phase 2) |
| Content Layer config (content.config.ts) | data-content | project-structure (Phase 2) |
| ClientRouter / View Transitions | routing-navigation | components-islands |

## Architecture Patterns

### Pattern 1: Quick Reference Header (continued from Phase 2)

**What:** Every reference file starts with numbered imperative rules. Same pattern as Phase 2.
**Format:** `1. Use client:visible for below-fold components -- saves initial JS`
**Target:** 8-12 rules per file covering the most critical domain-specific guidance.
**Tone:** Imperative, direct, one line per rule.

### Pattern 2: Decision Matrix Tables

**What:** Scenario | Choice | Why tables that guide pattern selection.
**Format:** Consistent with Phase 2 -- markdown tables, not prose.
**Key matrices per file:**
- components-islands: hydration directive selection (scenario -> directive), island vs static vs Server Island
- routing-navigation: routing strategy by page type, redirect method selection
- data-content: loader selection (glob/file/inline/object), Actions vs API routes
- styling-performance: image service selection, CSS approach selection, cache strategy

### Pattern 3: Anti-patterns with Confidence Tags

**What:** Anti-patterns tagged CRITICAL/HIGH/MEDIUM matching Phase 2's system.
**Format:** DO/DON'T contrast only when the pitfall is counter-intuitive.
**Key anti-patterns to include:**
- CRITICAL: `client:load` on every component (components-islands)
- CRITICAL: `entry.slug` instead of `entry.id` (data-content)
- CRITICAL: `process.env` instead of `locals.runtime.env` (routing-navigation)
- HIGH: Server Island in named slot (components-islands)
- HIGH: `_routes.json` over 100 rules (routing-navigation)
- HIGH: Sharp image service on Cloudflare SSR (styling-performance)

### Pattern 4: Troubleshooting at End

**What:** 3-column Symptom | Cause | Fix tables at the end of each file.
**Constraint:** Fix must be one line. Multi-step fixes point to a code example section.
**Coverage:** Both Astro-generic AND Cloudflare-specific errors per domain.

### Recommended Section Order per File

```
## Quick Reference          (8-12 imperative rules)
## [Decision Matrices]      (tables: Scenario | Choice | Why)
## [Key Patterns]           (code examples, ~2-4 per file)
## Anti-patterns            (tagged CRITICAL/HIGH/MEDIUM)
## Troubleshooting          (Symptom | Cause | Fix table)
```

This mirrors Phase 2's structure. Section names within [brackets] vary by domain.

## Content Maps Per Reference File

### components-islands.md Content Map

| Section | Content | Source | Verified |
|---------|---------|--------|----------|
| Quick Reference | 10-12 rules: hydration defaults, Server Islands props, nanostores pattern, class destructuring, Astro.slots.has, define:vars gotcha | Research 3 rules + Research 6 rules | YES - directives reference docs |
| Hydration Directive Matrix | 8-10 scenarios: situation -> directive -> reason (decision tree format per CONTEXT.md) | Research 6 section 2 | YES - official docs verified |
| Island vs Static vs Server Island Matrix | 8-10 scenarios: when to use static .astro, client island, or server:defer | Research 6 section 4 | YES - Server Islands docs |
| Nanostores Pattern | Store setup (atom/map), framework bindings, cross-island communication | Research 6 section 3 + 7 | YES - official recipe docs |
| Server Island Pattern | server:defer with fallback, props < 2KB, Referer header for URL | Research 3 section 5 + Research 6 | YES - Server Islands docs |
| Anti-patterns | ~10 entries from Research 3/6: client:load everywhere, nesting islands, functions as props, DOM manipulation between islands | Research 3 + 6 | YES |
| Troubleshooting | ~8 entries: hydration mismatch, client:visible not firing, nanostores not syncing, Server Islands 404, Auto Minify breaks islands | Research 3 + 6 | YES |

**Estimated lines:** ~280-300

### routing-navigation.md Content Map

| Section | Content | Source | Verified |
|---------|---------|--------|----------|
| Quick Reference | 10-12 rules: decodeURIComponent params, paginate base, output:static, ClientRouter rename, _routes.json 100 limit, middleware guard runtime.env | Research 4 section 1 | YES - v5 upgrade guide |
| Routing Strategy Matrix | 10+ scenarios: page type -> approach -> reason (static, SSR, Server Islands, redirect) | Research 4 section 2 | YES - routing docs |
| Middleware Pattern | defineMiddleware signature, sequence(), context.locals, redirect/rewrite, runtime.env guard | Official middleware docs | YES - fetched Feb 2026 |
| ClientRouter | Rename from ViewTransitions, import from astro:transitions, known issues, future direction | v5 upgrade guide + search results | YES |
| API Endpoint Pattern | REST endpoint on Cloudflare Workers, bindings access, ALL method fallback | Research 4 section 5 | YES - endpoints docs |
| Catch-all Route Guard | Excluding _server-islands/* from [...slug].astro | Research 4 sections 3 + 5 | YES - GitHub issues confirmed |
| Anti-patterns | ~10 entries: hybrid config, manual base concat, process.env, _redirects file, 100+ routes.json rules | Research 4 section 3 | YES |
| Troubleshooting | ~8 entries: 404 in prod, double base, params encoding, Server Islands loop, runtime.env undefined | Research 4 section 4 | YES |

**Estimated lines:** ~280-300

### data-content.md Content Map

| Section | Content | Source | Verified |
|---------|---------|--------|----------|
| Quick Reference | 10-12 rules: content.config.ts location, glob()/file() loaders, entry.id not slug, render() import, z from astro/zod, prerender collections | Research 5 section 1 | YES - content collections docs |
| Loader Selection Matrix | 8 scenarios: data type -> loader -> reason (glob, file, inline, object) | Research 5 section 2a | YES - loader reference docs |
| Actions vs API Routes Matrix | 6 scenarios: use case -> choice -> reason (form handling, REST, webhooks, type-safe mutations) | Astro Actions docs (fetched) | YES - official docs |
| Content Layer Config Example | content.config.ts with glob(), file(), schemas, references | Research 5 section 6 | YES |
| Actions Basic Signature | defineAction with input/handler, calling from client, progressive enhancement | Astro Actions docs (fetched) | YES |
| MDX/Markdoc Decision | When MDX vs Markdoc, component mapping, remark/rehype plugin config | Research 18 section 2 | YES |
| Anti-patterns | ~10 entries: type:'content', entry.slug, entry.render(), z from zod, filesystem SSR, fetch without timeout | Research 5 section 3 | YES |
| Troubleshooting | ~8 entries: module not found, collection empty, slug undefined, render not function, ENOENT on CF | Research 5 section 5 | YES |

**Estimated lines:** ~280-300

### styling-performance.md Content Map

| Section | Content | Source | Verified |
|---------|---------|--------|----------|
| Quick Reference | 10-12 rules: @tailwindcss/vite not @astrojs/tailwind, @reference for @apply, imageService:'compile', priority on LCP, scopedStyleStrategy, _headers caching, Auto Minify off | Research 7 + 8 rules | YES - styling docs + images docs |
| Image Service Matrix | 4 scenarios: compile vs cloudflare vs passthrough vs Sharp (and why Sharp fails) | Research 8 section 2b | YES - adapter docs |
| Image Component Patterns | Image with layout/priority/fit, Picture for multi-format, getImage() for CSS backgrounds | Research 8 section 2a + official docs | YES - images docs (fetched) |
| Tailwind v4 Setup | @tailwindcss/vite in config, @import "tailwindcss", @reference for @apply in components | Research 7 sections 2 + 5 | YES - Tailwind v4 docs |
| CSS Approach Matrix | 5-6 scenarios: scoped styles, Tailwind, CSS Modules, Vanilla Extract, why not styled-components | Research 7 section 2 | YES |
| Caching Strategy | _headers file pattern, /_astro/* immutable, HTML revalidate, SSR headers in code | Research 8 section 4 | YES - Cloudflare headers docs |
| Core Web Vitals Checklist | LCP (priority, fonts), CLS (layout, fallbacks), prefetch strategy | Research 8 sections 1 + 2d | YES |
| Anti-patterns | ~10 entries: CSS-in-JS runtime, fonts in public/, old Shiki vars, styled-components on CF | Research 7 + 8 section 3 | YES |
| Troubleshooting | ~8 entries: @apply not resolving, FOUC, scoped styles not applying, image 404 on Workers | Research 7 + 8 sections 4 + 5 | YES |

**Estimated lines:** ~280-300

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hydration directive decision tree | Manual analysis per component | Decision matrix from Research 6 | Already covers 10+ scenarios with verified recommendations |
| Content Collections migration patterns | Manual research of v4->v5 changes | Migration checklist from Research 5 section 4 | 12-step checklist already catalogued |
| Actions vs API routes guidance | Write explanation from scratch | Decision matrix from official Actions docs | Already has clear Scenario/Choice/Why format |
| Cloudflare image service selection | Trial and error | Matrix from Research 8 section 2b | compile/cloudflare/passthrough tradeoffs documented |
| Caching headers file | Custom research | _headers template from Research 8 section 4 | Verified pattern with correct Cache-Control values |
| Tailwind v4 migration from @astrojs/tailwind | Manual migration | Research 7 section 5 code patterns | @reference requirement is non-obvious, documented |
| Middleware patterns | Write from scratch | Official middleware docs patterns | defineMiddleware, sequence(), locals typing all documented |

**Key insight:** The 7 research files (3, 4, 5, 6, 7, 8, 18) are the primary source material. The planner's job is condensation, cross-referencing, and format alignment -- not creation. Each research file already contains the decision matrices, anti-patterns, troubleshooting, and code patterns that map directly to reference file sections.

## Common Pitfalls

### Pitfall 1: Exceeding ~300 Line Budget

**What goes wrong:** Each domain has 200-500 lines of research content. Trying to include everything blows the budget.
**Why it happens:** Research files are comprehensive; reference files must be selective.
**How to avoid:** For each item, ask: "Would Claude get this wrong without the skill?" If Claude's training data covers it well (basic .astro syntax, basic HTML), omit it. Focus on: (a) Astro 5 breaking changes, (b) Cloudflare-specific constraints, (c) counter-intuitive patterns.
**Warning signs:** File exceeding 320 lines, sections explaining basic concepts.

### Pitfall 2: Duplicating Content Between Phase 2 and Phase 3 Files

**What goes wrong:** Phase 2's project-structure.md already covers content.config.ts location; data-content.md re-explains it.
**Why it happens:** Cross-cutting concerns touch multiple domains.
**How to avoid:** Phase 2 files cover platform-level config. Phase 3 files cover feature-level usage. E.g., project-structure.md has content.config.ts location and basic skeleton; data-content.md has loader selection, schema patterns, and Actions. Brief cross-reference: "See project-structure.md for config file placement."
**Warning signs:** Same code example appearing in Phase 2 and Phase 3 files.

### Pitfall 3: Duplicating Content Between Phase 3 Files

**What goes wrong:** Hydration directives appear in both components-islands.md and styling-performance.md.
**Why it happens:** Islands affect both component architecture and performance.
**How to avoid:** Follow the cross-domain content assignment table above. Each fact lives in exactly ONE file. Cross-reference where needed.
**Warning signs:** Grep for the same directive or pattern appearing in multiple Phase 3 files.

### Pitfall 4: Including Phase 4 Content in Phase 3

**What goes wrong:** Middleware auth patterns, CSRF protection, CSP headers appear in routing-navigation.md or data-content.md.
**Why it happens:** CONTEXT.md explicitly states middleware auth/CSP belongs in Phase 4 security-advanced.md, and Actions CSRF/validation belongs in Phase 4.
**How to avoid:** routing-navigation.md covers middleware basics only (signature, sequence, simple redirects, runtime.env guard). data-content.md covers Actions basic signature and decision matrix only.
**Warning signs:** Auth checks in middleware examples, CSRF tokens in Actions examples.

### Pitfall 5: Stale Astro 4 Patterns

**What goes wrong:** Using `output: 'hybrid'`, `entry.slug`, `entry.render()`, `<ViewTransitions />`, or `type: 'content'` in code examples.
**Why it happens:** Claude's training data still contains Astro 4 patterns heavily.
**How to avoid:** Every code example must use Astro 5.x API: `output: 'static'`, `entry.id`, `render(entry)` from import, `<ClientRouter />`, `loader: glob()`. Add explicit "v4 vs v5" callouts for the most common migration mistakes.
**Warning signs:** Any of the deprecated identifiers in code examples.

### Pitfall 6: Missing Cloudflare-Specific Troubleshooting

**What goes wrong:** Troubleshooting tables only cover generic Astro errors, not Cloudflare Workers runtime issues.
**Why it happens:** Research files emphasize Astro errors; Cloudflare errors are scattered.
**How to avoid:** CONTEXT.md requires "both Astro-generic errors AND Cloudflare-specific errors per domain." Each troubleshooting table must include 2-3 Cloudflare-specific entries (Auto Minify, runtime.env undefined, Sharp incompatible, _routes.json limits, etc.).
**Warning signs:** Troubleshooting table with zero Cloudflare-specific entries.

### Pitfall 7: Code Examples Without Cloudflare Context

**What goes wrong:** Code examples show patterns that work in Node.js but fail on Cloudflare Workers.
**Why it happens:** Research file examples sometimes lack the Cloudflare runtime guard.
**How to avoid:** SSR code examples must show `locals.runtime.env` access pattern, not `process.env`. Image examples must use `imageService: 'compile'`, not Sharp. Middleware must guard `runtime?.env` for prerendered routes.
**Warning signs:** `process.env`, `import Sharp`, or missing `platformProxy` in examples.

## Code Examples

### Verified Patterns to Include Per File

#### components-islands.md

```astro
<!-- Hydration directive with rootMargin -->
<AddToCart client:visible={{rootMargin: "200px"}} productId="SKU-123" />
```

```typescript
// src/stores/cart.ts -- nanostores for cross-island state
import { atom, map } from 'nanostores';
export const $isCartOpen = atom(false);
export const $cart = map<Record<string, { qty: number; price: number }>>({});
```

```astro
<!-- Server Island with fallback -->
<UserWidget server:defer userId={user.id}>
  <div slot="fallback" style="height:48px">Loading...</div>
</UserWidget>
```

#### routing-navigation.md

```typescript
// Middleware with runtime.env guard
import { defineMiddleware } from 'astro:middleware';
export const onRequest = defineMiddleware(async (context, next) => {
  if (context.locals.runtime?.env) {
    context.locals.apiKey = context.locals.runtime.env.API_KEY;
  }
  return next();
});
```

```astro
---
// Catch-all with Server Islands exclusion
const { slug } = Astro.params;
if (slug?.startsWith('_server-islands') || slug?.startsWith('_actions')) {
  return new Response(null, { status: 404 });
}
const decoded = slug ? decodeURIComponent(slug) : '';
---
```

#### data-content.md

```typescript
// src/content.config.ts -- Astro 5 Content Layer
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    cover: image(),
  }),
});
export const collections = { blog };
```

```typescript
// Astro Action basic signature
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
export const server = {
  addToCart: defineAction({
    accept: 'form',
    input: z.object({ productId: z.string() }),
    handler: async (input, ctx) => {
      // ctx.cookies, ctx.locals available
      return { success: true };
    }
  })
};
```

#### styling-performance.md

```javascript
// astro.config.mjs -- Tailwind v4 on Cloudflare
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  adapter: cloudflare({ imageService: 'compile' }),
  vite: { plugins: [tailwindcss()] },
});
```

```astro
<!-- LCP image with priority -->
<Image src={heroImage} alt="Hero" priority layout="full-width" fit="cover" />
```

```
# public/_headers -- Cloudflare caching
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
/*
  Cache-Control: public, max-age=0, must-revalidate
```

## State of the Art

| Old Approach (Astro 4.x) | Current Approach (Astro 5.x) | When Changed | Impact on Reference Files |
|---------------------------|------------------------------|--------------|---------------------------|
| `<ViewTransitions />` | `<ClientRouter />` from `astro:transitions` | Astro 5.0 | routing-navigation must use new name |
| `entry.slug` | `entry.id` | Astro 5.0 | data-content must use .id everywhere |
| `entry.render()` | `import { render } from 'astro:content'` | Astro 5.0 | data-content code examples |
| `type: 'content'` / `type: 'data'` | `loader: glob()` / `loader: file()` | Astro 5.0 | data-content loader patterns |
| `src/content/config.ts` | `src/content.config.ts` | Astro 5.0 | data-content config location |
| `output: 'hybrid'` | `output: 'static'` + per-page `prerender: false` | Astro 5.0 | routing-navigation config |
| Auto-decoded params | Manual `decodeURIComponent()` required | Astro 5.0 | routing-navigation params pattern |
| Manual base concat in paginate | `page.url.next` includes base | Astro 5.0 | routing-navigation pagination |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` plugin | Astro 5.2+ | styling-performance setup |
| Experimental responsive images | Stable `layout`/`priority` props | Astro 5.10 | styling-performance image patterns |
| `--astro-code-color-text` | `--astro-code-foreground` | Astro 5.0 | styling-performance Shiki vars |
| `Astro.glob()` | `import.meta.glob()` | Deprecated 5.0 | data-content import patterns |
| Cloudflare Pages (default) | Cloudflare Workers with assets | April 2025 | All files -- Workers is target platform |

**Deprecated/outdated patterns to explicitly flag:**
- `output: 'hybrid'` -- removed in Astro 5.0
- `<ViewTransitions />` -- deprecated 5.0, removed in 6.0
- `@astrojs/tailwind` -- deprecated for Tailwind v4
- `type: 'content'` / `type: 'data'` -- deprecated in 5.0, removed in 6.0
- `entry.slug` -- replaced by `entry.id`
- Legacy content collections without loaders
- Sharp image service on Cloudflare Workers runtime

## Open Questions

1. **Astro responsive images -- exact stable API surface**
   - What we know: `layout`, `priority`, `fit`, `position` props are stable since 5.10. `responsiveStyles: true` enables automatic CSS.
   - What's unclear: Whether `image.breakpoints` config is stable or still experimental.
   - Recommendation: Document the stable props (layout, priority, fit). Note breakpoints as configurable but do not over-document.

2. **ClientRouter future deprecation**
   - What we know: Astro team considers ClientRouter a bridge until native cross-document view transitions reach baseline. ViewTransitions component removed in Astro 6.
   - What's unclear: Whether ClientRouter itself will be deprecated in a future version.
   - Recommendation: Document current ClientRouter usage with a note that native View Transitions API is the long-term direction. Do not write patterns that deeply couple to ClientRouter-specific features.

3. **Astro Actions CSRF protection scope**
   - What we know: CONTEXT.md assigns CSRF/validation details to Phase 4 security-advanced.md.
   - What's unclear: How much CSRF context is needed in the basic Actions signature in data-content.md.
   - Recommendation: Keep data-content.md to defineAction signature, input validation, and Actions vs API routes decision. Leave CSRF to Phase 4.

4. **Photos with no EXIF data patterns**
   - What we know: CONTEXT.md gives Claude discretion on how to handle this within ~300 lines.
   - What's unclear: Whether this needs a dedicated section.
   - Recommendation: Include image optimization without Sharp as a brief subsection of styling-performance.md. The `imageService: 'compile'` pattern handles this implicitly.

## Sources

### Primary (HIGH confidence)

- Research file 3 (Composants) -- components, props, slots, directives, Server Islands
- Research file 4 (Routing) -- routing, middleware, redirects, v5 breaking changes
- Research file 5 (Gestion des donnees) -- Content Layer, loaders, Actions, cache strategies
- Research file 6 (Islands Architecture) -- hydration directives, nanostores, Server Islands
- Research file 7 (Styling) -- scoped CSS, Tailwind v4, fonts, Shiki
- Research file 8 (Performance) -- images, CWV, caching, prefetch
- Research file 18 (Markdown/MDX/Markdoc) -- MDX config, remark/rehype, Shiki
- [Astro v5 Upgrade Guide](https://docs.astro.build/en/guides/upgrade-to/v5/) -- all breaking changes
- [Astro Actions Docs](https://docs.astro.build/en/guides/actions/) -- defineAction API, progressive enhancement
- [Astro Middleware Docs](https://docs.astro.build/en/guides/middleware/) -- defineMiddleware, sequence, locals
- [Astro Images Docs](https://docs.astro.build/en/guides/images/) -- Image/Picture components, services
- [Astro Directives Reference](https://docs.astro.build/en/reference/directives-reference/) -- client:*, server:defer
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) -- Content Layer API
- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/) -- ClientRouter
- [Astro Routing Guide](https://docs.astro.build/en/guides/routing/) -- file-based routing, endpoints
- [Astro Server Islands](https://docs.astro.build/en/guides/server-islands/) -- server:defer, fallback
- [Astro Share State Between Islands](https://docs.astro.build/en/recipes/sharing-state-islands/) -- nanostores recipe
- [Astro Styling Guide](https://docs.astro.build/en/guides/styling/) -- scoped CSS, global styles
- [Tailwind v4 Astro Installation](https://tailwindcss.com/docs/installation/framework-guides/astro) -- @tailwindcss/vite setup
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) -- memory, CPU, bundle
- [Astro 5.10 Blog Post](https://astro.build/blog/astro-5100/) -- responsive images stable, priority attribute

### Secondary (MEDIUM confidence)

- [Astro 6 Beta Blog Post](https://astro.build/blog/astro-6-beta/) -- ClientRouter future, Live Collections
- [ViewTransitions Removal Issue #14369](https://github.com/withastro/astro/issues/14369) -- removal in v6
- [ClientRouter + Server Islands Issue #12780](https://github.com/withastro/astro/issues/12780) -- known interaction bugs
- Community search results on nanostores patterns (Feb 2026)
- Community search results on Tailwind v4 + Astro (Feb 2026)

### Tertiary (LOW confidence)

- Exact `image.breakpoints` stability status -- documented as stable in 5.10 but limited documentation
- rootMargin/timeout exact recommended values for hydration directives -- community-sourced, not official Astro prescriptions

## Metadata

**Confidence breakdown:**
- Components/Islands: HIGH -- Research 3 + 6 cross-referenced with official directive/Server Islands docs
- Routing/Navigation: HIGH -- Research 4 cross-referenced with v5 upgrade guide, middleware docs
- Data/Content: HIGH -- Research 5 + 18 cross-referenced with content collections and Actions docs
- Styling/Performance: HIGH -- Research 7 + 8 cross-referenced with styling, images, and Cloudflare docs
- Breaking changes: HIGH -- All verified against v5 upgrade guide
- Cloudflare-specific: HIGH -- Verified against Workers docs and adapter docs

**Research date:** 2026-02-03
**Valid until:** 2026-03-05 (30 days -- stable domain, Astro 5.x is current stable release)
