---
phase: 04-secondary-domain-references
plan: 01
subsystem: seo-i18n
tags: [seo, i18n, meta-tags, sitemap, opengraph, json-ld, hreflang, canonical-urls, rss, workers-og]
completed: 2026-02-03
duration: 2min
tasks_completed: 2
tasks_total: 2

dependency_graph:
  requires: [02-01, 02-02]
  provides: [seo-i18n-reference]
  affects: [05-01]

tech_stack:
  added: []
  patterns: [SEOHead-component, json-ld-set-html, hreflang-x-default, prefixDefaultLocale-combo, language-detection-middleware]

key_files:
  created:
    - .claude/skills/astro-cloudflare/references/seo-i18n.md
  modified: []

decisions:
  - id: 04-01-01
    decision: Manual SEOHead component over astro-seo package
    reason: astro-seo unmaintained 2+ years, not tested with Astro 5.x
  - id: 04-01-02
    decision: Paraglide recommended for translations on Workers
    reason: Only solution with explicit Cloudflare Workers compatibility and tree-shaking
  - id: 04-01-03
    decision: Language detection middleware included in seo-i18n (not routing-navigation)
    reason: Cross-domain assignment table places language detection in seo-i18n scope

metrics:
  lines_written: 251
  code_blocks: 7
  tables: 4
  quick_reference_rules: 12
---

# Phase 04 Plan 01: SEO and Internationalization Summary

Reference file covering SEO meta tags, canonical URLs, OG images, JSON-LD, sitemap, RSS, i18n routing config, hreflang with x-default, language detection middleware, and translation solution decision for Astro 5.x on Cloudflare Workers.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Write seo-i18n.md reference file | 27b80c0 | references/seo-i18n.md |
| 2 | Verify quality and cross-references | (no changes needed) | references/seo-i18n.md |

## What Was Built

`seo-i18n.md` (251 lines) following the Phase 2-3 format:

- **Quick Reference**: 12 numbered imperative rules covering site config, canonical URLs, JSON-LD, trailingSlash, prerender, workers-og, og:image, prefixDefaultLocale, redirectToDefaultLocale, Astro.currentLocale, x-default hreflang, Paraglide
- **SEO Component Pattern**: Reusable `<SEOHead />` with canonical URL, OG tags, Twitter Card (manual over astro-seo)
- **Sitemap Config**: `@astrojs/sitemap` with filter, serialize, and i18n alternates
- **JSON-LD Structured Data**: `set:html` pattern with `@graph` structure, schema-dts mention
- **RSS Endpoint**: Content Collections + `@astrojs/rss` with prerender for Cloudflare
- **i18n Config**: `prefixDefaultLocale: true` + `redirectToDefaultLocale: false` combo
- **Hreflang Component**: Self-referencing canonical + all locale alternates + x-default
- **Translation Decision Matrix**: 6 scenarios (manual JSON, Paraglide, Content Collections, routing-only, CMS, pluralization)
- **Language Detection Middleware**: SSR middleware with Accept-Language parsing
- **Anti-patterns**: 10 entries with CRITICAL/HIGH/MEDIUM severity tags
- **Troubleshooting**: 8 entries with Astro-generic and Cloudflare-specific errors

## Decisions Made

1. **Manual SEOHead over astro-seo**: The `astro-seo` package is unmaintained for 2+ years and not tested with Astro 5.x. Manual component provides same type-safety with zero dependency risk.
2. **Paraglide as recommended translation solution**: Only translation library with explicit Cloudflare Workers compatibility (`disableAsyncLocalStorage`), tree-shaking (-70% bundle), and active maintenance.
3. **Language detection in seo-i18n scope**: Per cross-domain assignment table, language detection middleware belongs here (not in routing-navigation.md which has basic middleware only).

## Deviations from Plan

None -- plan executed exactly as written.

## Quality Verification

- [x] Line count 251 (within 250-340 range)
- [x] No Astro 4 deprecated patterns (output: 'hybrid', entry.slug, entry.render(), ViewTransitions)
- [x] No cross-domain content leakage (no CSP, no middleware auth, no Content Layer, no routing details)
- [x] 7 code blocks (exceeds minimum 4)
- [x] 4 tables (Translation Decision Matrix, Anti-patterns, Troubleshooting, Language Detection section)
- [x] Cloudflare-specific troubleshooting entries present (Vary header caching, Workers OG images)
- [x] Code comments follow `// src/path/file.ts -- description` convention

## Next Phase Readiness

No blockers. The seo-i18n.md reference is complete and ready for Phase 5 synthesis. Cross-references to project-structure.md (site property) and routing-navigation.md (i18n routing basics) are maintained through content boundaries without explicit links.
