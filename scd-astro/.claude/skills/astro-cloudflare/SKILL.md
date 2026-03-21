---
name: astro-cloudflare
description: |
  Astro 6.x on Cloudflare Workers. Rendering modes (SSG, SSR, Server Islands,
  server:defer), hydration (client:load, client:visible, client:idle,
  client:only), Content Layer with loaders, content.config.ts, Live Collections,
  Content Collections, Astro Actions, middleware, ClientRouter, Cloudflare
  bindings (KV, D1, R2, Durable Objects) via `import { env } from
  'cloudflare:workers'`, workerd dev server, nodejs_compat, Zod 4, Vite 7,
  Fonts API, CSP security, Sessions (auto KV). Astro 6 breaking-change
  prevention. Routing, dynamic routes, getStaticPaths, scoped styles, Tailwind
  CSS, TypeScript env.d.ts, MDX, Markdoc, image optimization
  (cloudflare-binding), SEO sitemap OpenGraph, wrangler, .dev.vars. Use when
  working with .astro files, astro.config.mjs, astro.config.ts, wrangler.jsonc,
  wrangler.toml, or Cloudflare Workers Astro projects. Use when asking about
  Astro components, islands architecture, SSR on Cloudflare, Astro middleware,
  Astro Actions, Content Collections, Cloudflare bindings, environment
  variables, or migrating to Astro 6. Complements
  mcp__svelte__get-documentation for official API reference.
---

## Critical Rules (Astro 6.x on Cloudflare)

These breaking changes cause the most common code generation errors. Apply them before writing any Astro code.

1. `src/content.config.ts` -- NOT `src/content/config.ts` (path changed in v5)
2. `entry.id` -- NOT `entry.slug` (removed in v5)
3. `import { render } from 'astro:content'` then `render(entry)` -- NOT `entry.render()` (method removed in v5)
4. `loader: glob({ pattern, base })` -- NOT `type: 'content'` (legacy collections removed in v6)
5. `<ClientRouter />` from `astro:transitions` -- NOT `<ViewTransitions />` (removed in v6)
6. `import { env } from 'cloudflare:workers'` then `env.VAR` -- NOT `Astro.locals.runtime.env.VAR` (removed in v6, NOT `process.env.VAR`)
7. `imageService: 'cloudflare-binding'` as default -- `'compile'` for build-only, `{ build: 'compile', runtime: 'cloudflare-binding' }` for dual-mode
8. `output: 'static'` or `output: 'server'` -- NOT `output: 'hybrid'` (removed in v5, use per-page `prerender` instead)
9. `decodeURIComponent(Astro.params.slug)` -- NOT raw `Astro.params.slug` (auto-decode removed in v5)
10. `import { z } from 'astro/zod'` with Zod 4 syntax -- `z.email()` NOT `z.string().email()`, `{ error: "..." }` NOT `{ message: "..." }`
11. Node 22.12.0+ required -- NOT Node 18 or 20 (dropped in v6)
12. `getStaticPaths()` params MUST be strings -- `{ id: '123' }` NOT `{ id: 123 }`
13. No `Astro.glob()` -- use `import.meta.glob()` or content collections (removed in v6)
14. `security: { csp: true }` -- NOT `experimental: { csp: true }` (stabilized in v6)

## Decision Matrices

### Rendering Mode

| Scenario | Mode | Config |
|----------|------|--------|
| Pure static site | SSG | `output: 'static'`, no adapter needed |
| < 30% dynamic pages | SSG + adapter | `output: 'static'` + adapter, `prerender: false` per dynamic page |
| > 70% dynamic pages | SSR | `output: 'server'` + adapter, `prerender: true` per static page |
| Static + personalized sections | SSG + Server Islands | `output: 'static'` + adapter, `server:defer` on dynamic parts |
| Dynamic content without rebuild | SSR + Live Collections | `output: 'server'`, `defineLiveCollection()` in `src/live.config.ts` |

**Default:** `output: 'static'` with `@astrojs/cloudflare` adapter. See [references/rendering-modes.md](references/rendering-modes.md).

### Hydration Directive

| Scenario | Directive | Why |
|----------|-----------|-----|
| Below-fold interactive | `client:visible` | Defers JS until element enters viewport |
| Above-fold critical (checkout, auth) | `client:load` | Immediate interactivity required |
| Above-fold non-critical (menu, search) | `client:idle` | Ready after main thread idle |
| Mobile-only component | `client:media="(max-width: 768px)"` | No JS loaded on desktop |
| Requires browser APIs (maps, geo) | `client:only="react"` | SSR not viable |

**Default:** `client:visible` for most components. See [references/components-islands.md](references/components-islands.md).

### Actions vs API Routes

| Use Case | Choice | Why |
|----------|--------|-----|
| Form validation/mutation | Astro Action (`accept: 'form'`) | Type-safe, progressive enhancement, auto CSRF |
| REST endpoint for external consumers | API route (`src/pages/api/`) | Standard HTTP verbs, content negotiation |
| Webhook receiver (Stripe, CMS) | API route | Raw request access, signature verification |
| Real-time / SSE streaming | API route | Actions do not support streaming responses |

**Default:** Astro Actions for form submissions. Bindings via `import { env } from 'cloudflare:workers'`. See [references/data-content.md](references/data-content.md).

### Server Islands vs Alternatives

| Need | Solution | Why |
|------|----------|-----|
| Personalized content in static page | Server Island (`server:defer`) | No client JS, CDN-cached shell, dynamic fragment |
| Interactive widget (forms, filters) | Client Island (`client:visible`) | Requires event listeners and state |
| Real-time push data (chat, notifications) | Client-side WebSocket/SSE | Server Islands have no push capability |
| Auth-gated section in static page | Server Island (`server:defer`) | Checks cookies/session without exposing full page as dynamic |

**Default:** Server Island (`server:defer`) for dynamic-in-static without client JS. See [references/components-islands.md](references/components-islands.md).

## MCP Integration

### Source Routing

| Domain | Source | Example |
|--------|--------|---------|
| Astro components, routing, config | Astro MCP | `getCollection` overloads |
| Astro Actions, Content Layer API | Astro MCP | `defineAction` options |
| Workers runtime, limits, compat | Cloudflare MCP | Workers fetch handler params |
| KV binding API | Cloudflare MCP | KV put expiration options |
| D1 binding API | Cloudflare MCP | D1 prepare bind batch |
| R2 binding API | Cloudflare MCP | R2 put get list objects |
| Astro-on-Cloudflare patterns | Skill references | bindings via `cloudflare:workers` |
| Troubleshooting, anti-patterns | Skill references | build fails on Cloudflare |

> **Excluded CF products:** Zaraz, Magic Transit, Zero Trust, CDN, DNS, AI -- out of scope.
> **Fallback:** Primary source first. Ambiguous questions default to skill references.

### Astro Docs MCP

**Tool:** `mcp__svelte__get-documentation` (Astro docs via Svelte MCP)

**Use MCP when you need:**
- Exact API signatures (e.g., `defineAction` options, `getCollection` overloads)
- Config option exhaustive lists (e.g., all `astro.config.mjs` fields)
- Migration guide details beyond the 14 Critical Rules above
- Integration setup steps (e.g., `@astrojs/react` config options)
- Version-specific changelogs and release notes

### Cloudflare Docs MCP

**Tool:** `mcp__cloudflare__search_cloudflare_documentation`

**Scope:** Workers, KV, D1, R2 only. Query pattern: `"[Product] [specific action]"`
- `"Workers KV namespace put method API parameters"`
- `"Cloudflare D1 database prepare bind SQL API"`

> **Caveats:** Titles empty (extract from `<text>` heading). URLs doubled (strip first `https://developers.cloudflare.com/` prefix).

**Use THIS SKILL when you need:**
- Architecture decisions (rendering mode, hydration, Actions vs API routes)
- Anti-patterns and Astro 6.x breaking change prevention
- Cloudflare-specific patterns (bindings via `cloudflare:workers`, Workers limits, `.dev.vars`)
- Troubleshooting symptoms and fixes for Astro-on-Cloudflare errors
- `astro preview` runs on workerd — full parity with production

## Reference Files

- `references/project-structure.md` — File organization, naming conventions, config templates (Astro 6 + Cloudflare Workers)
  - Organization: quick_reference, file_organization
  - Conventions: naming_conventions
  - Config templates: astro config, wrangler.jsonc, tsconfig, env.d.ts (no Runtime<Env>), content_config, package_json scripts, gitignore
  - Quality: anti_patterns, troubleshooting

- `references/rendering-modes.md` — Output modes, Server Islands, Live Collections, feature compatibility
  - Modes: quick_reference, output_modes, prerender_toggle_pattern, programmatic_prerender_control
  - Decision matrices: decision_matrix, when_to_use_server_islands_vs_alternatives
  - Server Islands: server_islands_pattern_with_fallback, props_rules, url_behavior
  - Compatibility: feature_compatibility (includes Live Collections, Sessions)
  - Quality: anti_patterns, troubleshooting

- `references/cloudflare-platform.md` — Bindings via `cloudflare:workers` (KV/D1/R2), Workers limits, workerd dev, env vars
  - Config: quick_reference, config_templates (wrangler.jsonc without `main` field)
  - Bindings: bindings_access (`import { env } from 'cloudflare:workers'`)
  - Runtime: nodejs_compatibility, environment_variables, workers_limits
  - Quality: anti_patterns, troubleshooting

- `references/components-islands.md` — Hydration directives, Server Islands, nanostores, slots, component typing, Fonts API
  - Hydration: quick_reference, hydration_directives
  - Islands: island_comparison
  - State: nanostores
  - Server Islands: server_island
  - Slots & typing: slots_and_rendering, component_typing
  - Quality: anti_patterns (includes CSP + islands note), troubleshooting

- `references/routing-navigation.md` — File routing, dynamic routes, redirects, middleware (`cloudflare:workers`), ClientRouter
  - Decision matrices: routing_strategy_decision_matrix, redirect_method_selection
  - Routing: quick_reference, route_priority_reference, dynamic_routes_with_get_static_paths, cloudflare_route_configuration
  - Middleware: middleware_pattern (bindings via `cloudflare:workers`)
  - Patterns: catch_all_route_guard_pattern, api_endpoint_pattern
  - Navigation: client_router
  - Quality: anti_patterns, troubleshooting

- `references/data-content.md` — Content Layer, loaders, collections, Live Collections, Actions (Zod 4), MDX/Markdoc
  - Decision matrices: loader_selection_matrix, actions_vs_api_routes, mdx_markdoc_decision
  - Content Layer: quick_reference (Zod 4, createSchema), content_layer_config, rendering_content, querying_collections
  - Live Collections: live_collections (`defineLiveCollection`, `getLiveEntry`, `src/live.config.ts`)
  - Actions: astro_actions_basic_signature (`cloudflare:workers` bindings)
  - Data fetching: ssr_data_fetching_on_cloudflare (`cloudflare:workers`)
  - Quality: anti_patterns (Astro.glob() CRITICAL, createSchema), troubleshooting

- `references/styling-performance.md` — Images (cloudflare-binding), Fonts API, scoped styles, Tailwind v4, caching, prefetch
  - Images: quick_reference, image_service_selection (cloudflare-binding default), image_component_patterns
  - Fonts: fonts_api (providers, `<Font />` component)
  - Styling: scoped_style_propagation, css_approach_selection, tailwind_v4_setup
  - Caching & performance: caching_strategy, headers_file_pattern, ssr_cache_headers, prefetch_strategy
  - Quality: anti_patterns, troubleshooting

- `references/seo-i18n.md` — Meta tags, sitemap, OpenGraph, JSON-LD, i18n (redirectToDefaultLocale default changed), hreflang
  - SEO: quick_reference, seo_component, sitemap_config
  - Structured data: json_ld
  - RSS: rss_endpoint
  - i18n: i18n_config (redirectToDefaultLocale default false), hreflang, translation_matrix, language_detection
  - Quality: anti_patterns, troubleshooting

- `references/typescript-testing.md` — TypeScript config (no Runtime<Env>), env.d.ts, Vitest 3.2.x, Container API, Playwright
  - TypeScript: quick_reference (`cloudflare:workers`, Node 22+), typescript_config, env_types (simplified, no Runtime)
  - Testing: test_types, vitest_config (Vite 7 compat), container_api, bindings_test, playwright_config (`astro preview`)
  - Scripts: package_scripts (`astro preview`)
  - Quality: anti_patterns (Runtime<Env> removed), troubleshooting (workerd patterns)

- `references/build-deploy.md` — Wrangler workflow, `astro preview` (workerd), CI/CD, Workers deployment
  - Config: quick_reference (no platformProxy, astro preview = workerd), adapter_options (v13), vs_code_configuration
  - Decision matrices: deployment_target_decision_matrix (Workers only for new projects), dev_preview_workflow_matrix (workerd native)
  - CI/CD: package_json_scripts, github_actions_ci_cd (Node 22), assetsignore_for_workers_static_assets
  - Debug: debugging_workflow (`astro preview --inspect`), cli_flags_reference
  - Quality: anti_patterns, troubleshooting

- `references/security-advanced.md` — CSP stable (`security.csp`), auth middleware (`cloudflare:workers`), Actions security (Zod 4), secrets, MDX/Markdoc, Shiki v4
  - Security: quick_reference, security_decision_matrix (`security.csp` stable), security_headers_middleware
  - Auth & Actions: auth_middleware_pattern (`cloudflare:workers`), actions_security_pattern (Zod 4)
  - Secrets & CSP: secrets_management (`cloudflare:workers`), csp_config (stable, not experimental)
  - MDX/Markdoc: remark_rehype_plugin_config, custom_component_mapping, markdoc_custom_tags
  - Code highlighting: shiki_dual_theme_css (Shiki v4), custom_remark_plugin
  - Quality: anti_patterns, troubleshooting

## Quick Troubleshooting Index

Route error symptoms to the right reference file.

| Symptom | Reference |
|---------|-----------|
| `Cannot find module` / import errors | [typescript-testing.md](references/typescript-testing.md) |
| Build fails on Cloudflare | [build-deploy.md](references/build-deploy.md) |
| `process.env` undefined | [cloudflare-platform.md](references/cloudflare-platform.md) |
| `Astro.locals.runtime` removed / undefined | [cloudflare-platform.md](references/cloudflare-platform.md) |
| `require is not defined` (CJS in workerd) | [cloudflare-platform.md](references/cloudflare-platform.md) |
| Image processing errors / Sharp | [styling-performance.md](references/styling-performance.md) |
| Hydration mismatch | [components-islands.md](references/components-islands.md) |
| Content collection errors / Zod 4 | [data-content.md](references/data-content.md) |
| 404 on dynamic routes | [routing-navigation.md](references/routing-navigation.md) |
| CSP / security header issues | [security-advanced.md](references/security-advanced.md) |
| Sitemap / SEO missing | [seo-i18n.md](references/seo-i18n.md) |
| Server Island not rendering | [components-islands.md](references/components-islands.md) + [rendering-modes.md](references/rendering-modes.md) |
| Binding not available in dev | [cloudflare-platform.md](references/cloudflare-platform.md) |
| `createSchema` silent failure | [data-content.md](references/data-content.md) |
