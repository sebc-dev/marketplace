---
name: astro-cloudflare
description: |
  Astro 5.x on Cloudflare Workers/Pages. Rendering modes (SSG, SSR, hybrid,
  Server Islands, server:defer), hydration (client:load, client:visible,
  client:idle, client:only), Content Layer with loaders, content.config.ts,
  Content Collections, Astro Actions, middleware, ClientRouter, Cloudflare
  bindings (KV, D1, R2, Durable Objects), platformProxy, nodejs_compat, Astro 5
  breaking-change prevention. Routing, dynamic routes, getStaticPaths, scoped
  styles, Tailwind CSS, TypeScript env.d.ts, MDX, Markdoc, image optimization,
  SEO sitemap OpenGraph, CSP security headers, wrangler dev, .dev.vars. Use when
  working with .astro files, astro.config.mjs, astro.config.ts, wrangler.jsonc,
  wrangler.toml, or Cloudflare Workers/Pages Astro projects. Use when asking
  about Astro components, islands architecture, SSR on Cloudflare, Astro
  middleware, Astro Actions, Content Collections, Cloudflare bindings,
  environment variables, or migrating to Astro 5. Complements
  mcp__astro_doc__search_astro_docs for official API reference.
---

## Critical Rules (Astro 5.x on Cloudflare)

These breaking changes cause the most common code generation errors. Apply them before writing any Astro code.

1. `src/content.config.ts` -- NOT `src/content/config.ts` (path changed in v5)
2. `entry.id` -- NOT `entry.slug` (removed in v5)
3. `import { render } from 'astro:content'` then `render(entry)` -- NOT `entry.render()` (method removed in v5)
4. `loader: glob({ pattern, base })` -- NOT `type: 'content'` (deprecated in v5, types break)
5. `<ClientRouter />` from `astro:transitions` -- NOT `<ViewTransitions />` (deprecated v5, removed v6)
6. `Astro.locals.runtime.env.VAR` -- NOT `process.env.VAR` (undefined on Workers runtime)
7. `imageService: 'compile'` in adapter config -- NOT Sharp (incompatible with Workers)
8. `output: 'static'` or `output: 'server'` -- NOT `output: 'hybrid'` (removed in v5, use per-page `prerender` instead)
9. `decodeURIComponent(Astro.params.slug)` -- NOT raw `Astro.params.slug` (auto-decode removed in v5)
10. `import { z } from 'astro/zod'` -- NOT `import { z } from 'zod'` (use Astro's re-export for Content Layer compatibility)

## Decision Matrices

### Rendering Mode

| Scenario | Mode | Config |
|----------|------|--------|
| Pure static site | SSG | `output: 'static'`, no adapter |
| < 30% dynamic pages | SSG + adapter | `output: 'static'` + adapter, `prerender: false` per dynamic page |
| > 70% dynamic pages | SSR | `output: 'server'` + adapter, `prerender: true` per static page |
| Static + personalized sections | SSG + Server Islands | `output: 'static'` + adapter, `server:defer` on dynamic parts |

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

**Default:** Astro Actions for form submissions. See [references/data-content.md](references/data-content.md).

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
| Astro-on-Cloudflare patterns | Skill references | bindings via `locals.runtime.env` |
| Troubleshooting, anti-patterns | Skill references | build fails on Cloudflare |

> **Excluded CF products:** Zaraz, Magic Transit, Zero Trust, CDN, DNS, AI -- out of scope.
> **Fallback:** Primary source first. Ambiguous questions default to skill references.

### Astro Docs MCP

**Tool:** `mcp__astro_doc__search_astro_docs`

**Use MCP when you need:**
- Exact API signatures (e.g., `defineAction` options, `getCollection` overloads)
- Config option exhaustive lists (e.g., all `astro.config.mjs` fields)
- Migration guide details beyond the 10 Critical Rules above
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
- Anti-patterns and Astro 5.x breaking change prevention
- Cloudflare-specific patterns (bindings, Workers limits, `.dev.vars`, `locals.runtime.env`)
- Troubleshooting symptoms and fixes for Astro-on-Cloudflare errors

## Reference Files

- `references/project-structure.md` — File organization, naming conventions, config templates
  - Organization: quick_reference, simple_site, complex_ssg_ssr_server_island
  - Conventions: naming_conventions
  - Config templates: ssg_config, ssr_cloudflare_config, static_default_with_ssr_config, tsconfig, cloudflare_runtime_types, content_config, package_json_script, gitignore
  - Quality: anti_patterns, troubleshooting

- `references/rendering-modes.md` — Output modes, Server Islands, feature compatibility
  - Modes: quick_reference, output_modes, prerender_toggle_pattern, programmatic_prerender_control
  - Decision matrices: decision_matrix, when_to_use_server_islands_vs_alternatives
  - Server Islands: server_islands_pattern_with_fallback, props_rules, url_behavior
  - Compatibility: feature_compatibility
  - Quality: anti_patterns, troubleshooting

- `references/cloudflare-platform.md` — Bindings (KV/D1/R2), Workers limits, Node.js compat, env vars
  - Config: quick_reference, wrangler_jsonc, dev_vars
  - Bindings: bindings_access
  - Runtime: nodejs_compatibility, environment_variables, workers_limits
  - Quality: anti_patterns, troubleshooting

- `references/components-islands.md` — Hydration directives, Server Islands, nanostores, slots, component typing
  - Hydration: quick_reference, hydration_decision_table, client_load, client_idle, client_visible, client_media, client_only
  - Islands: island_vs_static_vs_server_island, decision_rule_for_island_selection
  - State: nanostores_setup, reactive_rendering_with_usestore, store_singleton_pattern, cross_island_communication
  - Server Islands: server_defer_directive, props_constraints, cache_strategy, fallback_slots_with_dimensions
  - Slots & typing: conditional_slot_wrapper, slot_forwarding_between_layouts, htmlattributes_extension, polymorphic_components
  - Quality: anti_patterns, troubleshooting

- `references/routing-navigation.md` — File routing, dynamic routes, redirects, middleware, ClientRouter
  - Decision matrices: routing_strategy_decision_matrix, redirect_method_selection
  - Routing: quick_reference, route_priority_reference, dynamic_routes_with_get_static_paths, cloudflare_route_configuration
  - Middleware: middleware_pattern
  - Patterns: catch_all_route_guard_pattern, api_endpoint_pattern
  - Navigation: client_router
  - Quality: anti_patterns, troubleshooting

- `references/data-content.md` — Content Layer, loaders, collections, Actions, MDX/Markdoc
  - Decision matrices: loader_selection_matrix, actions_vs_api_routes, mdx_markdoc_decision
  - Content Layer: quick_reference, csv_file_loader, inline_async_loader, rendering_content, querying_collections
  - Actions: astro_actions_basic_signature
  - Data fetching: ssr_data_fetching_on_cloudflare
  - Quality: anti_patterns, troubleshooting

- `references/styling-performance.md` — Images, scoped styles, Tailwind v4, caching, prefetch
  - Images: quick_reference, image_service_selection, image_component_patterns
  - Styling: scoped_style_propagation, css_approach_selection, tailwind_v4_setup
  - Caching & performance: caching_strategy, headers_file_pattern, ssr_cache_headers, prefetch_strategy
  - Quality: anti_patterns, troubleshooting

- `references/seo-i18n.md` — Meta tags, sitemap, OpenGraph, JSON-LD, i18n, hreflang
  - SEO: quick_reference, seo_component, sitemap_config
  - Structured data: json_ld
  - RSS: rss_endpoint
  - i18n: i18n_config, hreflang, translation_matrix, language_detection
  - Quality: anti_patterns, troubleshooting

- `references/typescript-testing.md` — TypeScript config, env.d.ts, Vitest, Container API, Playwright
  - TypeScript: quick_reference, typescript_config, env_types
  - Testing: test_types, vitest_config, container_api, bindings_test, playwright_config
  - Scripts: package_scripts
  - Quality: anti_patterns, troubleshooting

- `references/build-deploy.md` — Wrangler workflow, CI/CD, scripts, debugging, VS Code config
  - Config: quick_reference, adapter_options, vs_code_configuration
  - Decision matrices: output_mode_decision_matrix, deployment_target_decision_matrix, dev_preview_workflow_matrix
  - CI/CD: package_json_scripts, github_actions_ci_cd, assetsignore_for_workers_static_assets
  - Debug: debugging_workflow, cli_flags_reference
  - Quality: anti_patterns, troubleshooting

- `references/security-advanced.md` — CSP, auth middleware, Actions security, secrets, MDX/Markdoc advanced
  - Security: quick_reference, security_headers_middleware, auth_middleware_pattern, actions_security_pattern
  - Secrets & CSP: secrets_management, csp_config
  - MDX/Markdoc: remark_rehype_plugin_config, custom_component_mapping, markdoc_custom_tags
  - Code highlighting: shiki_dual_theme_css, custom_remark_plugin
  - Quality: anti_patterns, troubleshooting

## Quick Troubleshooting Index

Route error symptoms to the right reference file.

| Symptom | Reference |
|---------|-----------|
| `Cannot find module` / import errors | [typescript-testing.md](references/typescript-testing.md) |
| Build fails on Cloudflare | [build-deploy.md](references/build-deploy.md) |
| `process.env` undefined | [cloudflare-platform.md](references/cloudflare-platform.md) |
| Image processing errors / Sharp | [styling-performance.md](references/styling-performance.md) |
| Hydration mismatch | [components-islands.md](references/components-islands.md) |
| Content collection errors | [data-content.md](references/data-content.md) |
| 404 on dynamic routes | [routing-navigation.md](references/routing-navigation.md) |
| CSP / security header issues | [security-advanced.md](references/security-advanced.md) |
| Sitemap / SEO missing | [seo-i18n.md](references/seo-i18n.md) |
| Server Island not rendering | [components-islands.md](references/components-islands.md) + [rendering-modes.md](references/rendering-modes.md) |
| Binding not available in dev | [cloudflare-platform.md](references/cloudflare-platform.md) |
| ViewTransitions errors | Critical Rules #5 above + [routing-navigation.md](references/routing-navigation.md) |
