# Phase 4: Secondary Domain References - Research

**Researched:** 2026-02-03
**Domain:** Astro 5.17+ secondary concerns: SEO/i18n, TypeScript/testing, build/deploy, security/advanced patterns on Cloudflare Workers
**Confidence:** HIGH

## Summary

This research covers the four secondary domain reference files for the Astro/Cloudflare Claude Code Skill: `seo-i18n.md`, `typescript-testing.md`, `build-deploy.md`, and `security-advanced.md`. Each file must provide Claude with supporting knowledge that complements the core feature domains completed in Phase 3. The content focuses on areas where Claude's training data is most likely wrong or outdated.

The source material is exceptionally strong: 8 existing research files (9-SEO, 10-i18n, 11-TypeScript, 12-Testing, 13-Build, 15-Security, 16-DevX, 18-MDX/Markdoc) contain ~5,000+ lines of verified content across these domains. Unlike Phase 3 where four files covered four domains, Phase 4 combines multiple research files per reference (e.g., security-advanced.md draws from Research 15 + Research 17 + Research 18). This combination approach requires careful content assignment to avoid duplication with Phase 2-3 files.

Key constraints: Each file should target ~250-350 lines following the established pattern. Phase 3 decisions explicitly deferred middleware auth/CSP to `security-advanced.md` and Actions CSRF/validation to `security-advanced.md`. The `data-content.md` file already covers MDX/Markdoc basics (decision matrix, syntax gotchas), so `security-advanced.md` handles the advanced MDX setup (custom components, remark/rehype plugins). Workers is the default platform (Pages deprecated April 2025).

**Primary recommendation:** For each reference file, condense from the corresponding research files. The cross-domain content assignment table below defines exactly what goes where. Prioritize: (1) Cloudflare-specific constraints/workarounds, (2) patterns Claude would get wrong without the skill, (3) decision matrices, (4) counter-intuitive anti-patterns. Omit anything already covered in Phase 2-3 files.

## Standard Stack

This phase produces Markdown reference files, not code. The "stack" is the knowledge domain being documented.

### Core Knowledge Domains

| Domain | Target File | Primary Sources | Secondary Sources |
|--------|------------|-----------------|-------------------|
| SEO, meta tags, sitemap, OpenGraph, structured data, i18n routing, hreflang | `seo-i18n.md` | Research 9 (SEO) + Research 10 (i18n) | Astro sitemap/rss docs, Google structured data docs |
| TypeScript config, env.d.ts, Cloudflare binding types, Vitest, Container API | `typescript-testing.md` | Research 11 (TypeScript) + Research 12 (Testing) | Astro TypeScript docs, Cloudflare Vitest integration |
| Wrangler dev/deploy, package.json scripts, CI/CD, debugging tools | `build-deploy.md` | Research 13 (Build) + Research 16 (DevX) | Astro deploy docs, Cloudflare wrangler docs |
| CSP, auth middleware, Actions security, secrets, MDX/Markdoc advanced setup | `security-advanced.md` | Research 15 (Security) + Research 18 (MDX/Markdoc) | Astro CSP experimental docs, OWASP guidelines |

### Cross-Domain Content Assignment

Topics that touch multiple files need explicit assignment to prevent duplication:

| Topic | Lives In | NOT In (already covered) |
|-------|----------|--------------------------|
| Canonical URL construction | seo-i18n | routing-navigation (Phase 3) |
| hreflang + x-default | seo-i18n | - |
| i18n routing config (prefixDefaultLocale) | seo-i18n | routing-navigation (Phase 3) |
| Language detection middleware | seo-i18n | routing-navigation (has basic middleware) |
| Sitemap + @astrojs/sitemap config | seo-i18n | - |
| JSON-LD structured data | seo-i18n | - |
| tsconfig.json template | typescript-testing | project-structure (Phase 2, has basic template) |
| env.d.ts with App.Locals + Runtime | typescript-testing | project-structure (Phase 2, has skeleton) |
| Container API testing | typescript-testing | - |
| Vitest config for Astro | typescript-testing | - |
| @cloudflare/vitest-pool-workers | typescript-testing | - |
| package.json scripts | build-deploy | project-structure (Phase 2, has basic scripts) |
| wrangler.jsonc template | build-deploy | cloudflare-platform (Phase 2, has full template) |
| CI/CD GitHub Actions | build-deploy | - |
| Wrangler dev/deploy commands | build-deploy | - |
| Debugging tools (wrangler --inspect, tail) | build-deploy | - |
| CSP experimental config | security-advanced | - |
| Middleware security headers | security-advanced | routing-navigation (has basic middleware only) |
| Auth patterns with middleware | security-advanced | routing-navigation (has authCheck redirect stub) |
| Actions CSRF/validation | security-advanced | data-content (has basic signature only) |
| Secrets management (.dev.vars) | security-advanced | cloudflare-platform (Phase 2, has basics) |
| MDX custom components mapping | security-advanced | data-content (has basic MDX/Markdoc decision) |
| Remark/rehype plugin configuration | security-advanced | data-content (mentions "MDX inherits from markdown.*") |
| Markdoc custom tags (markdoc.config.mjs) | security-advanced | data-content (mentions "uses markdoc.config.mjs") |
| Shiki dual theme CSS | security-advanced | styling-performance (has scoped styles only) |

## Architecture Patterns

### Pattern 1: Quick Reference Header (continued from Phase 2-3)

**What:** Every reference file starts with numbered imperative rules.
**Format:** `1. Always define "site" in astro.config.mjs -- required by sitemap, RSS, canonical URLs`
**Target:** 10-14 rules per file covering the most critical domain-specific guidance.
**Tone:** Imperative, direct, one line per rule.

### Pattern 2: Decision Matrix Tables

**What:** Scenario | Choice | Why tables that guide pattern selection.
**Key matrices per file:**
- seo-i18n: SEO component approach (manual vs library), i18n routing config, translation solution selection
- typescript-testing: TypeScript preset selection, test type/tool selection
- build-deploy: output mode selection, deployment target, preview method
- security-advanced: CSP implementation approach, secrets access method, MDX vs Markdoc for author content

### Pattern 3: Anti-patterns with Confidence Tags

**Format:** CRITICAL/HIGH/MEDIUM matching Phase 2-3's system.
**Key anti-patterns per file:**
- CRITICAL: Missing `site` in astro.config breaks sitemap/canonical (seo-i18n)
- CRITICAL: `import.meta.env.SECRET` undefined on Workers SSR (security-advanced)
- CRITICAL: Vitest 4.x incompatible with Astro 5.x (typescript-testing)
- CRITICAL: `output: 'hybrid'` removed in Astro 5.0 (build-deploy)
- HIGH: `_headers` file ignored for SSR routes (security-advanced)
- HIGH: `set:html` bypasses escaping (security-advanced)
- HIGH: Duplicate remarkPlugins in markdown AND mdx config (security-advanced)

### Pattern 4: Troubleshooting at End

**What:** 3-column Symptom | Cause | Fix tables at the end of each file.
**Coverage:** Both Astro-generic AND Cloudflare-specific errors per domain.

### Recommended Section Order per File

```
## Quick Reference          (10-14 imperative rules)
## [Decision Matrices]      (tables: Scenario | Choice | Why)
## [Key Patterns]           (code examples, ~2-4 per file)
## Anti-patterns            (tagged CRITICAL/HIGH/MEDIUM)
## Troubleshooting          (Symptom | Cause | Fix table)
```

Same structure as Phase 2-3.

## Content Maps Per Reference File

### seo-i18n.md Content Map

| Section | Content | Source | Key Patterns |
|---------|---------|--------|--------------|
| Quick Reference | 10-12 rules: `site` required, canonical URL formula, `set:html` for JSON-LD, `trailingSlash: 'never'`, prerender SEO endpoints, `workers-og`, absolute URLs for og:image, `prefixDefaultLocale: true`, `redirectToDefaultLocale: false`, `Astro.currentLocale` not `preferredLocale` | Research 9 rules 1-8 + Research 10 rules 1-6 | |
| SEO Component Pattern | `<SEOHead />` with canonical, OG, Twitter Card | Research 9 code 5.1 | Manual component over `astro-seo` (unmaintained 2 years) |
| Sitemap Config | `@astrojs/sitemap` with filter + serialize | Research 9 code 5.2 | Endpoint custom for full SSR |
| JSON-LD Pattern | `set:html={JSON.stringify(schema)}`, `@graph` pattern | Research 9 code 5.4 | `schema-dts` for typing optional |
| RSS Endpoint | Content Collections + `@astrojs/rss` with prerender | Research 9 code 5.3 | |
| i18n Config | `prefixDefaultLocale: true` + `redirectToDefaultLocale: false` | Research 10 code 6.1 | Critical: avoids redirect loops |
| Hreflang Component | Self-referencing canonical + all locale alternates + x-default | Research 10 code 6.4 | No library generates x-default automatically |
| Language Detection Middleware | SSR middleware with Accept-Language parsing | Research 10 code 6.2 | Cannot use `_redirects` for this on Cloudflare |
| Translation Decision | Paraglide recommended for CF Workers, JSON manual for 2 languages | Research 10 matrix 3 | astro-i18next abandoned, astro-i18n stale |
| Anti-patterns | ~10 entries: missing site, localhost canonical, JSON-LD escaping, `Vary: Accept-Language` on CF, `redirectToDefaultLocale: true` loop | Research 9 + 10 anti-patterns | |
| Troubleshooting | ~8 entries: sitemap 404, canonical localhost, JSON-LD not detected, wrong language served, 404 with i18n SSR | Research 9 + 10 troubleshooting | |

**Estimated lines:** ~280-320

### typescript-testing.md Content Map

| Section | Content | Source | Key Patterns |
|---------|---------|--------|--------------|
| Quick Reference | 12-14 rules: `.astro/types.d.ts` in include, `astro sync` before `tsc`, `moduleResolution: "Bundler"`, `App.Locals` declaration, `astro check && tsc --noEmit`, `satisfies APIRoute`, `Runtime<Env>` import, `getViteConfig()` not `defineConfig`, `experimental_AstroContainer`, `@cloudflare/vitest-pool-workers` for bindings, Vitest 3.x not 4.x | Research 11 rules 1-14 + Research 12 rules 1-8 | |
| TypeScript Config Decision | Preset selection (base/strict/strictest), Cloudflare types | Research 11 matrix 2 | `strict` default, `strictest` for production |
| env.d.ts Pattern | `App.Locals extends Runtime<Env>`, `App.SessionData` | Research 11 code 3 | Full type-safe env bindings |
| Test Type Decision Matrix | 15+ scenarios: component → Container API, bindings → vitest-pool-workers, E2E → Playwright, Actions → extract handler | Research 12 matrix 2 | |
| Vitest Config | `getViteConfig()` with node environment | Research 12 code vitest.config | |
| Container API Test | Props, slots, named slots, framework renderers | Research 12 code container | `experimental_AstroContainer` import |
| Cloudflare Bindings Test | `@cloudflare/vitest-pool-workers` + `defineWorkersConfig` | Research 12 code mock-bindings | |
| Playwright Config | `wrangler pages dev ./dist` as webServer | Research 12 code playwright | |
| package.json Scripts | `dev`, `build`, `typecheck`, `test:unit`, `test:e2e` | Research 11 code 7 + Research 16 code | |
| Anti-patterns | ~10 entries: `defineConfig` instead of `getViteConfig`, `moduleResolution: "node"`, Vitest 4.x, `AstroContainer` not `experimental_`, `happy-dom` for everything | Research 11 + 12 anti-patterns | |
| Troubleshooting | ~10 entries: astro:content not found, runtime undefined in prerender, Vitest [object Object], Container missing renderers, types stale | Research 11 + 12 troubleshooting | |

**Estimated lines:** ~300-340

### build-deploy.md Content Map

| Section | Content | Source | Key Patterns |
|---------|---------|--------|--------------|
| Quick Reference | 10-12 rules: Workers is default platform, `wrangler-action@v3` not `pages-action`, `NODE_VERSION=22` in CI, `astro check` before build, `astro sync` after schema changes, `platformProxy: { enabled: true }`, `imageService: 'compile'`, `wrangler pages dev ./dist` for preview, `.assetsignore` for Workers, `ASTRO_KEY` for Server Islands | Research 13 rules 9-15 + Research 16 rules 1-3 | |
| Output Mode Decision | 5-6 scenarios: static/server/hybrid-replacement | Research 13 matrix 2 | `output: 'hybrid'` removed in v5 |
| Deployment Target Decision | Workers Static Assets (new) vs Pages (existing) | Research 13 matrix 2 (last rows) | Workers recommended for new projects |
| Dev/Preview Workflow | `astro dev` vs `wrangler pages dev ./dist` vs `astro preview` | Research 13 matrix 2 + Research 16 matrix 2 | `astro preview` does NOT use Workers runtime |
| GitHub Actions CI/CD | Full workflow: checkout, node 22, cache, build, deploy with wrangler-action | Research 13 code GitHub Actions | Branch previews with `--branch=` flag |
| Adapter Options Table | All @astrojs/cloudflare options with defaults | Research 13 reference 6.1 | |
| CLI Flags Reference | Useful astro + wrangler CLI commands and flags | Research 13 reference 6.2 + Research 16 debugging guide | `astro create-key` for Server Islands |
| Debugging Workflow | `wrangler --inspect`, `wrangler tail`, Chrome DevTools | Research 16 debugging guide | |
| VS Code Config | Recommended settings for Astro development | Research 16 code VS Code settings | Extension, ESLint, Tailwind, formatting |
| Anti-patterns | ~10 entries: `output: 'hybrid'`, `cloudflare/pages-action`, Sharp, `process.env`, dev server for preview, `/functions` directory | Research 13 + 16 anti-patterns | |
| Troubleshooting | ~10 entries: node:fs error, Sharp error, bundle size limit, CI syntax error, bindings undefined, hydration mismatch | Research 13 + 16 troubleshooting | |

**Estimated lines:** ~300-350

### security-advanced.md Content Map

| Section | Content | Source | Key Patterns |
|---------|---------|--------|--------------|
| Quick Reference | 12-14 rules: `_headers` ignored for SSR, `checkOrigin: true` default but JSON not checked, `set:html` bypasses escaping, secrets via `runtime.env` not `import.meta.env`, `xss` library for Workers sanitization, `experimental.csp` not working in dev, frame-ancestors only via header not meta, MDX inherits from markdown.*, `rehypeHeadingIds` before autolink, `defaultColor: false` for Shiki dual theme, `.astro-code` not `.shiki` CSS class | Research 15 rules + Research 18 rules 1-8 | |
| Security Decision Matrix | SSG vs Hybrid vs Full SSR: CSP/CSRF/Headers/Secrets approach | Research 15 matrix | |
| CSP Config Pattern | `experimental.csp` in astro.config.mjs | Research 15 code 1 | Incompatible with View Transitions |
| Security Headers Middleware | X-Frame-Options, HSTS, Permissions-Policy, CORS OPTIONS handler | Research 15 code 2 | Required for SSR (not handled by `_headers`) |
| Auth Middleware Pattern | Cookie-based session verification, `sequence()` for composition | Research 11 code 5 (middleware pattern) + Research 15 | Basic redirect example from routing-navigation expanded here |
| Actions Security Pattern | Zod validation + `xss` sanitization on Cloudflare Workers | Research 15 code 4 | DOMPurify/sanitize-html incompatible Workers |
| Secrets Management | `astro:env` schema + `.dev.vars` + `wrangler secret put` | Research 15 code 5-6 | Extends cloudflare-platform basics |
| MDX Advanced Setup | Remark/rehype plugin config in astro.config.mjs | Research 18 code astro.config | `rehypeHeadingIds` ordering critical |
| Custom Component Mapping | MDX `<Content components={{ h2: Heading }} />` pattern | Research 18 code MDX components | Extends data-content basics |
| Markdoc Custom Tags | `markdoc.config.mjs` with `component()` | Research 18 code Markdoc | `{% tag %}` syntax vs MDX imports |
| Shiki Dual Theme | CSS for `.astro-code` with `--shiki-dark` vars, `defaultColor: false` | Research 18 code CSS | |
| Remark Plugin Custom | `file.data.astro.frontmatter` access pattern, reading-time example | Research 18 code remark plugin | |
| Anti-patterns | ~12 entries: `unsafe-inline` CSP, `set:html` on user content, `import.meta.env.SECRET` on CF, sourcemaps in prod, `CORS: *` with credentials, duplicate remarkPlugins, HTML comments in MDX, `.shiki` CSS target | Research 15 + 18 anti-patterns | |
| Troubleshooting | ~10 entries: CSP blocks scripts (Auto Minify), `_headers` ignored on SSR, CORS preflight 404, Shiki theme unchanged (cache), MDX parsing errors, Markdoc parsing errors | Research 15 + 18 troubleshooting | |

**Estimated lines:** ~320-370 (largest file due to dual domain: security + MDX/Markdoc advanced)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SEO component | Custom research on meta tags | `<SEOHead />` pattern from Research 9 | Canonical URL formula, OG absolute URLs already verified |
| JSON-LD schema definitions | Manual schema.org research | `schema-dts` types + `set:html` pattern | Google required properties per type already catalogued |
| Sitemap for SSR routes | Guess at `@astrojs/sitemap` behavior | Custom endpoint pattern from Research 9 | Official sitemap doesn't discover SSR dynamic routes |
| OG images on Cloudflare | Trial Sharp/resvg | `workers-og` library | Only package compatible with workerd runtime |
| i18n routing config | Trial and error on i18n options | `prefixDefaultLocale: true` + `redirectToDefaultLocale: false` combo | Prevents 90% of documented redirect loop bugs |
| Vitest config for Astro | Standard Vitest `defineConfig` | `getViteConfig()` from `astro/config` | Required for Astro file transforms to work |
| Cloudflare binding tests | Manual mocking with JS objects | `@cloudflare/vitest-pool-workers` | Tests run in actual workerd, not emulated Node.js |
| Security headers for SSR | `_headers` file only | Middleware pattern | `_headers` ignored for dynamic SSR responses |
| XSS sanitization on Workers | DOMPurify | `xss` (js-xss) library | DOMPurify requires jsdom, incompatible with Workers |
| CI/CD pipeline | Manual wrangler commands | `cloudflare/wrangler-action@v3` | Official action, `pages-action` deprecated |
| Remark/rehype plugin ordering | Manual placement | `rehypeHeadingIds` explicitly first when autolink needed | IDs injected after user plugins by default, breaking autolink |

**Key insight:** The 8 research files (9, 10, 11, 12, 13, 15, 16, 18) provide thoroughly verified patterns for every topic. The planner's job is condensation, cross-referencing, and Phase 2-3 deduplication -- not original content creation.

## Common Pitfalls

### Pitfall 1: Duplicating Content Already in Phase 2-3 Files

**What goes wrong:** `build-deploy.md` re-explains wrangler.jsonc config already in `cloudflare-platform.md`, or `security-advanced.md` re-documents basic middleware already in `routing-navigation.md`.
**Why it happens:** Research files cover topics comprehensively; Phase 2-3 already used some of this content.
**How to avoid:** Follow the cross-domain content assignment table strictly. For each content block, check: "Is this already in a Phase 2-3 file?" If yes, add a brief cross-reference: "See cloudflare-platform.md for wrangler.jsonc template."
**Warning signs:** Same code example appearing in Phase 2-3 AND Phase 4 files.

### Pitfall 2: Security-Advanced.md Exceeding Line Budget

**What goes wrong:** This file covers TWO distinct domains (security + MDX/Markdoc advanced), making it the densest Phase 4 file.
**Why it happens:** SECN-04 requirement explicitly combines these domains.
**How to avoid:** MDX/Markdoc advanced section should be ~100 lines covering: remark/rehype config, custom component mapping, Markdoc tags, Shiki dual theme. Security section gets ~200 lines. Total ~320-370 lines maximum.
**Warning signs:** File exceeding 380 lines, MDX/Markdoc section being too basic (already covered in data-content.md) or too comprehensive.

### Pitfall 3: Stale Astro 4 Patterns

**What goes wrong:** Using `output: 'hybrid'`, `entry.slug`, `entry.render()`, or `<ViewTransitions />` in code examples.
**Why it happens:** Claude's training data heavily contains Astro 4 patterns.
**How to avoid:** Every code example must use Astro 5.x API. Phase 3 RESEARCH.md's "State of the Art" table applies equally to Phase 4.
**Warning signs:** Any deprecated identifiers in code examples.

### Pitfall 4: Including Phase 5 Content

**What goes wrong:** Adding grep hints, cross-cutting decision matrices, or SKILL.md navigation content.
**Why it happens:** Phase 5 synthesizes content from all reference files; it's tempting to pre-optimize.
**How to avoid:** Phase 4 fills the 4 stub files with domain-specific content. Cross-cutting synthesis, navigation hub content, and MCP integration belong in Phase 5.
**Warning signs:** References to "SKILL.md should..." or grep hint patterns in the reference files.

### Pitfall 5: SEO-i18n.md Being Too FR-Centric

**What goes wrong:** The source research files (9, 10) use French examples and FR/EN locale pairs throughout.
**Why it happens:** Research was written for a French-speaking audience (original project is FR-targeted).
**How to avoid:** Reference files should use English code comments and generic locale examples. Use `en`/`fr` as example locale pair in i18n section, but code comments and explanations in English matching all other reference files.
**Warning signs:** French-language comments in code examples, French prose in rule descriptions.

### Pitfall 6: Missing Deferred Content from Phase 3

**What goes wrong:** Phase 3 explicitly deferred several topics to Phase 4 that must NOT be forgotten:
- Middleware auth/CSP -> security-advanced.md (from routing-navigation decision [03-02])
- Actions CSRF/validation -> security-advanced.md (from data-content decision [03-03])
- Advanced MDX setup (custom components, remark/rehype) -> security-advanced.md (from SECN-04)
**Why it happens:** Phase 4 planner doesn't check Phase 3 deferred items.
**How to avoid:** The planner MUST verify each deferred item appears in a Phase 4 file. data-content.md line 163 explicitly says "CSRF protection and advanced validation patterns belong in security-advanced.md (Phase 4)."
**Warning signs:** Phase 3 files still containing "Phase 4" references with no corresponding Phase 4 content.

### Pitfall 7: Inconsistent Code Example Style with Phase 2-3

**What goes wrong:** Phase 4 code examples use different comment styles, different TypeScript patterns, or different formatting than Phase 2-3.
**Why it happens:** Different research sources have different coding styles.
**How to avoid:** Match Phase 2-3 conventions: `// src/path/file.ts -- description` for first line, TypeScript with explicit types, `locals.runtime.env` pattern for Cloudflare bindings, `export const prerender = true/false` pattern where relevant.
**Warning signs:** Inconsistent comment style, Python-style code, missing TypeScript types.

## Code Examples

Verified patterns to include per file:

### seo-i18n.md Key Patterns

```astro
---
// src/components/SEOHead.astro -- reusable SEO head component
interface Props {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const { title, description, image = '/og-default.png', type = 'website', noindex = false } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const imageURL = new URL(image, Astro.site);
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />
{noindex && <meta name="robots" content="noindex, nofollow" />}
<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={imageURL} />
<meta name="twitter:card" content="summary_large_image" />
```

```astro
---
// src/components/HrefLangs.astro -- hreflang with x-default
const LOCALES = ["en", "fr"];
const DEFAULT_LOCALE = "en";
const siteUrl = Astro.site?.toString().replace(/\/$/, "") || "";
const currentPath = Astro.url.pathname;

function getCanonicalPath(path: string): string {
  return path.replace(/^\/(en|fr)\//, "/").replace(/^\/(en|fr)$/, "/");
}
function buildLocalizedUrl(path: string, locale: string): string {
  const cleanPath = getCanonicalPath(path);
  return `${siteUrl}/${locale}${cleanPath === "/" ? "" : cleanPath}`;
}
---
<link rel="canonical" href={`${siteUrl}${currentPath}`} />
{LOCALES.map((locale) => (
  <link rel="alternate" hreflang={locale} href={buildLocalizedUrl(currentPath, locale)} />
))}
<link rel="alternate" hreflang="x-default" href={buildLocalizedUrl(currentPath, DEFAULT_LOCALE)} />
```

```typescript
// src/pages/rss.xml.ts -- RSS with Content Collections
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export const prerender = true; // Required for Cloudflare

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return rss({
    title: 'My Blog',
    description: 'Recent posts',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
}
```

### typescript-testing.md Key Patterns

```typescript
/// <reference path="../.astro/types.d.ts" />
// src/env.d.ts -- full type-safe environment
type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  KV_CACHE: KVNamespace;
  ASSETS_BUCKET: R2Bucket;
  API_SECRET: string;
}

declare namespace App {
  interface Locals extends Runtime {
    user: { id: string; email: string } | null;
    requestId: string;
  }
}
```

```typescript
/// <reference types="vitest/config" />
// vitest.config.ts -- Astro + Cloudflare
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
  },
});
```

```typescript
// Container API test -- props and slots
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Card from '../components/Card.astro';

test('Card renders with props and slots', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Card, {
    props: { title: 'Test' },
    slots: { default: 'Content' },
  });
  expect(html).toContain('Test');
  expect(html).toContain('Content');
});
```

### build-deploy.md Key Patterns

```json
// package.json -- complete script set
{
  "scripts": {
    "dev": "wrangler types && astro dev",
    "build": "wrangler types && astro check && tsc --noEmit && astro build",
    "preview": "astro build && wrangler pages dev dist",
    "typecheck": "astro sync && astro check && tsc --noEmit",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "deploy": "npm run build && wrangler pages deploy dist"
  }
}
```

```yaml
# .github/workflows/deploy.yml -- CI/CD pipeline
name: Deploy
on:
  push:
    branches: [main]
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          NODE_OPTIONS: "--max-old-space-size=4096"
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=my-site --branch=${{ github.head_ref || 'main' }}
```

### security-advanced.md Key Patterns

```typescript
// src/middleware.ts -- security headers for SSR
import { defineMiddleware, sequence } from 'astro:middleware';

const securityHeaders = defineMiddleware(async (context, next) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'https://yoursite.com',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  return new Response(response.body, { status: response.status, headers });
});

const auth = defineMiddleware(async ({ locals, cookies, redirect }, next) => {
  if (!locals.runtime?.env) return next(); // Prerender guard
  const token = cookies.get('session')?.value;
  if (token) {
    locals.user = await verifyToken(token, locals.runtime.env);
  } else {
    locals.user = null;
  }
  return next();
});

export const onRequest = sequence(securityHeaders, auth);
```

```javascript
// astro.config.mjs -- remark/rehype plugin configuration
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  integrations: [mdx()], // Inherits from markdown.*, no plugins here
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false, // CSS-driven theme switching
    },
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [
      rehypeHeadingIds, // MUST be before autolink
      [rehypeAutolinkHeadings, { behavior: 'append' }],
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact on Phase 4 Files |
|--------------|------------------|--------------|------------------------|
| `astro-seo` package | Manual `<SEOHead />` component | astro-seo unmaintained 2 years | seo-i18n recommends manual |
| `astro-i18next` for translations | Paraglide (Inlang) or JSON manual | astro-i18next abandoned 3 years | seo-i18n recommends Paraglide |
| Vitest `defineConfig()` | `getViteConfig()` from `astro/config` | Astro 5.x requirement | typescript-testing must use getViteConfig |
| `AstroContainer` | `experimental_AstroContainer` | Still experimental | typescript-testing keeps experimental_ prefix |
| Vitest 4.x | Vitest 3.x (4.x incompatible) | Astro 5.x constraint | typescript-testing must specify Vitest 3.x |
| `cloudflare/pages-action` | `cloudflare/wrangler-action@v3` | pages-action deprecated | build-deploy uses wrangler-action |
| Pages deployment | Workers with Static Assets | Pages deprecated April 2025 | build-deploy: Workers is default |
| CSP meta tag | `experimental.csp` config (Astro 5.9+) | Astro 5.9 | security-advanced documents experimental CSP |
| DOMPurify for sanitization | `xss` (js-xss) library | Workers incompatibility | security-advanced: DOMPurify needs jsdom |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` plugin | Astro 5.2+ | Already handled in styling-performance.md |
| ESLint v8 with `.eslintrc` | ESLint v9 flat config | Current standard | build-deploy includes ESLint v9 pattern |

**Deprecated/outdated patterns to flag:**
- `astro-seo` and `astro-robots-txt` (unmaintained >2 years)
- `astro-i18next` (abandoned, incompatible Workers)
- `cloudflare/pages-action` GitHub Action (deprecated)
- `AstroContainer` without `experimental_` prefix
- Vitest 4.x with Astro projects

## Open Questions

1. **Astro experimental CSP + View Transitions compatibility**
   - What we know: Research 15 notes CSP experimental is incompatible with View Transitions (ClientRouter)
   - What's unclear: Whether this is a permanent limitation or being worked on
   - Recommendation: Document as a known limitation. If using ClientRouter, use middleware-based CSP instead of experimental.csp.

2. **Exact Vitest version constraint**
   - What we know: Research 12 says "Vitest 4 not yet compatible with Astro" and recommends ~3.2.x
   - What's unclear: Whether this has been resolved since the research was written
   - Recommendation: Document as "Use Vitest 3.x" with note to check compatibility if Vitest 4.x is desired. LOW confidence on exact version pinning.

3. **security-advanced.md scope balance**
   - What we know: This file must cover BOTH security + MDX/Markdoc advanced patterns per SECN-04
   - What's unclear: Optimal balance between the two domains within ~320 lines
   - Recommendation: ~200 lines security (CSP, headers, auth, secrets, Actions CSRF) + ~120 lines MDX/Markdoc advanced (remark/rehype, custom components, Markdoc tags, Shiki themes)

4. **Workers-og package stability**
   - What we know: Research 9 recommends `workers-og` for dynamic OG images on Cloudflare Workers
   - What's unclear: Package version, maintenance status, exact API surface
   - Recommendation: Include as optional pattern for dynamic OG images. Mark as MEDIUM confidence. Build-time prerendered OG images are the safer default.

## Sources

### Primary (HIGH confidence)

- Research 9 (SEO et metadonnees) -- SEO component, sitemap, JSON-LD, OG images, canonical URLs
- Research 10 (Internationalisation) -- i18n routing, hreflang, language detection, translation solutions
- Research 11 (TypeScript) -- tsconfig patterns, env.d.ts, type migration v4->v5, Cloudflare types
- Research 12 (Testing) -- Vitest setup, Container API, Playwright config, Cloudflare bindings testing
- Research 13 (Build et deploiement) -- adapter options, output modes, CI/CD, Vite 6, wrangler config
- Research 15 (Securite) -- CSP, CSRF, XSS, secrets management, security headers
- Research 16 (DevX et tooling) -- VS Code config, ESLint, Prettier, debugging workflow
- Research 18 (Markdown MDX Markdoc) -- remark/rehype plugins, custom components, Shiki config, Markdoc tags
- Phase 2-3 completed reference files (for deduplication boundary checking)
- Phase 3 CONTEXT.md (explicit deferral decisions for Phase 4)

### Secondary (MEDIUM confidence)

- Research file cross-references to official Astro docs (astro.build/docs)
- Research file cross-references to Cloudflare developer docs
- Research file cross-references to GitHub issues

### Tertiary (LOW confidence)

- `workers-og` package maintenance status and exact API surface
- Exact Vitest version compatibility boundary with Astro 5.x
- CSP experimental + ClientRouter interaction long-term resolution

## Metadata

**Confidence breakdown:**
- SEO/i18n: HIGH -- Research 9 + 10 extensively cross-referenced with official docs
- TypeScript/Testing: HIGH -- Research 11 + 12 verified against Astro/Vitest/Cloudflare docs
- Build/Deploy: HIGH -- Research 13 + 16 verified against adapter/wrangler/CI docs
- Security: HIGH -- Research 15 verified against OWASP and Astro security advisories
- MDX/Markdoc: HIGH -- Research 18 verified against Astro markdown/mdx/markdoc docs
- Cross-domain deduplication: HIGH -- Phase 2-3 files read and content boundaries established

**Research date:** 2026-02-03
**Valid until:** 2026-03-05 (30 days -- stable domain, Astro 5.x is current stable release)
