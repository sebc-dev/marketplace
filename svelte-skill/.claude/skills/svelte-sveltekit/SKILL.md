---
name: svelte-sveltekit
description: |
  Svelte 5 and SvelteKit 2. Runes ($state, $derived, $effect, $props, $bindable),
  Snippets ({#snippet}, {@render}), component model, props system, reactive classes,
  .svelte.ts modules, Context API (setContext, getContext, createContext), state
  management, routing, load functions, form actions, form validation, hooks
  (handle, handleFetch, handleError, reroute), middleware, error handling,
  TypeScript patterns, testing (Vitest, Playwright, vitest-browser-svelte),
  transitions, animations, Tailwind CSS v4, styling, scoped CSS, adapters
  (node, cloudflare, vercel, netlify, static), SSR, SSG, prerendering,
  streaming, deployment, performance, ecosystem libraries (shadcn-svelte,
  Bits UI, Skeleton, Superforms, Drizzle, Better Auth, Paraglide).
  Use when working with .svelte files, .svelte.ts files, .svelte.js files,
  svelte.config.js, svelte.config.ts, +page.svelte, +layout.svelte,
  +page.server.ts, +server.ts, +error.svelte, app.d.ts, hooks.server.ts,
  or SvelteKit projects. Complements the Svelte MCP server (list-sections,
  get-documentation, svelte-autofixer, playground-link) for official API reference.
---

## Critical Rules (Svelte 5 / SvelteKit 2)

These cause the most common code generation errors. Apply before writing any Svelte code.

1. `$derived(expr)` -- NOT `$effect(() => { x = f(y) })` (derived state must use $derived)
2. `let { ...props }: Props = $props()` -- NOT `export let prop` (removed in Svelte 5)
3. `{#snippet name()}...{/snippet}` + `{@render name()}` -- NOT `<slot>` (deprecated in Svelte 5)
4. Callback props (`onchange`) -- NOT `createEventDispatcher` (removed in Svelte 5)
5. Module-level `$state` = SINGLETON SSR leak -- use Context API for per-request state
6. `+page.server.ts` load -- NOT `onMount(() => fetch(...))` (data fetching in load functions)
7. `hooks.server.ts` handle for auth -- NOT layout load functions (auth runs on every request)
8. `class={['a', condition && 'b']}` (5.16+) -- NOT `class:name={bool}` (deprecated directive)
9. `event.fetch` in load functions -- NOT global `fetch` (loses cookies, breaks SSR relative URLs)
10. `$effect` does NOT run in SSR -- guard with `browser` from `$app/environment`

## Decision Matrices

### Rune Selection

| Need | Rune | Why |
|------|------|-----|
| Computed from other state | `$derived` / `$derived.by` | SSR-safe, no infinite loops |
| Independent mutable state | `$state` | Primitives or objects (deep proxy) |
| Side effect (DOM, fetch, log) | `$effect` | Escape hatch -- 10% of cases |
| Response to user event | Event handler | No rune needed |
| State without proxy (perf) | `$state.raw` | Large objects, reference comparison |
| Snapshot for serialization | `$state.snapshot` | FormData, localStorage |

### State Mechanism

| Scope | Mechanism | When |
|-------|-----------|------|
| Single component | `$state` local | Default |
| Parent to child | `$props()` | One-way data flow |
| Child to parent | Callback prop | Bubble events up |
| Two-way binding | `$bindable` | Forms, toggles |
| Component subtree | `setContext/getContext` | Theme, auth, config |
| Typed context (5.40+) | `createContext` | Same as above, type-safe |
| Module singleton (client-only) | `.svelte.ts` export | Cache, feature flags |
| Legacy, interop, persistence | `writable`/`readable` stores | localStorage, cross-framework |

### Load Function Type

| Need | File | Why |
|------|------|-----|
| DB access, secrets, server-only | `+page.server.ts` | Runs only on server |
| Public API fetch, client nav | `+page.ts` | Also runs in browser |
| Both | Coexistence | .server for sensitive, .ts for public |
| Partial streaming | `+page.server.ts` | Non-awaited promises streamed |
| Parent data sharing | `+layout(.server).ts` | Shared across child routes |

### Rendering Mode

| Scenario | Config | Adapter |
|----------|--------|---------|
| Full static (blog, docs) | `prerender = true` (default) | `adapter-static` |
| Full SSR (app) | `ssr = true, prerender = false` | `adapter-node` / `adapter-cloudflare` |
| SPA mode | `ssr = false, csr = true` | `adapter-static` with `fallback: 'index.html'` |
| Hybrid per-page | Mix `prerender` per route | `adapter-node` / `adapter-cloudflare` |

## MCP Integration

### Source Routing

| Domain | Source | Example |
|--------|--------|---------|
| Rune API signatures | MCP get-documentation | $state overloads, $derived.by signature |
| Component/directive syntax | MCP get-documentation | {#each} keyed, bind: options |
| SvelteKit config options | MCP get-documentation | svelte.config.js fields, adapter options |
| Code validation | MCP svelte-autofixer | Always validate after generation |
| Playground | MCP playground-link | Standalone examples |
| Architecture decisions | Skill references | When $derived vs $effect |
| Anti-patterns | Skill references | Wrong/Right patterns |
| Ecosystem libraries | Skill references | shadcn-svelte vs Skeleton |
| Troubleshooting | Skill references | ERR_SVELTE_TOO_MANY_UPDATES |

### Svelte MCP Server

**Tools:** `mcp__svelte__list-sections`, `mcp__svelte__get-documentation`, `mcp__svelte__svelte-autofixer`, `mcp__svelte__playground-link`

**Use MCP when you need:**
- Exact API signatures (e.g., `$state` overloads, `$derived.by` return type)
- Config option exhaustive lists (e.g., all `svelte.config.js` fields)
- Component syntax reference (e.g., `{#each}` keying, `bind:` targets)
- Code validation after generating `.svelte` files

**Post-generation workflow:** After generating a `.svelte` file, always call `mcp__svelte__svelte-autofixer` with `desired_svelte_version: 5`.

**Use THIS SKILL when you need:**
- Architecture decisions (rune selection, state mechanism, load function type)
- Anti-patterns and Svelte 5 breaking change prevention
- Ecosystem library selection and compatibility
- Troubleshooting symptoms and fixes

## Reference Files

- `references/runes-reactivity.md` -- Rune selection, $state/$derived/$effect patterns, reactive classes, .svelte.ts modules
  - Sections: quick_reference, decision_tree, state_patterns, derived_patterns, effect_patterns, class_reactivity, shared_modules, anti_patterns, troubleshooting

- `references/components-templates.md` -- Props system, snippets, template directives, events, class styling
  - Sections: quick_reference, props_system, snippets, template_patterns, dynamic_components, event_handling, class_styling, spread_patterns, anti_patterns, troubleshooting

- `references/routing-navigation.md` -- Route types, layouts, navigation, preloading, page options, invalidation
  - Sections: quick_reference, route_types, layout_patterns, navigation, preloading, page_options, invalidation, anti_patterns, troubleshooting

- `references/data-loading.md` -- Load functions, streaming, form actions, API routes, error handling
  - Sections: quick_reference, server_vs_universal, parallel_loading, streaming, form_actions, api_routes, error_handling, anti_patterns, troubleshooting

- `references/state-management.md` -- State mechanism selection, Context API, module state, stores interop, SSR safety
  - Sections: quick_reference, decision_tree, context_api, module_state, stores_interop, app_state, ssr_safety, anti_patterns, troubleshooting

- `references/typescript-patterns.md` -- TypeScript setup, props typing, rune typing, app.d.ts, generics, load function types
  - Sections: quick_reference, props_typing, rune_typing, app_types, generics, env_types, load_function_types, anti_patterns, troubleshooting

- `references/hooks-errors-security.md` -- Hooks execution, auth patterns, locals typing, error handling, svelte:boundary
  - Sections: quick_reference, server_hooks, auth_patterns, locals_typing, error_handling, reroute, client_hooks, anti_patterns, troubleshooting

- `references/testing-styling-deploy.md` -- Vitest setup, component testing, Playwright, styling, transitions, adapters, deployment
  - Sections: quick_reference, vitest_setup, component_testing, e2e_testing, mocking_patterns, styling_patterns, transitions, adapter_selection, deploy_patterns, anti_patterns, troubleshooting

- `references/ecosystem-antipatterns.md` -- Library selection, forms, auth, database, i18n, critical anti-patterns, migration
  - Sections: quick_reference, ui_components, forms_validation, auth_libraries, database, i18n, data_fetching, critical_antipatterns, migration_rules, troubleshooting

## Quick Troubleshooting Index

Route error symptoms to the right reference file.

| Symptom | Reference |
|---------|-----------|
| ERR_SVELTE_TOO_MANY_UPDATES / infinite loop | [runes-reactivity.md](references/runes-reactivity.md) |
| Hydration mismatch | [testing-styling-deploy.md](references/testing-styling-deploy.md) |
| ownership_invalid_mutation warning | [components-templates.md](references/components-templates.md) |
| Module state leak between users (SSR) | [state-management.md](references/state-management.md) |
| Load function waterfall (sequential awaits) | [data-loading.md](references/data-loading.md) |
| Cannot find module $app/... | [typescript-patterns.md](references/typescript-patterns.md) |
| Form action CSRF error | [data-loading.md](references/data-loading.md) |
| $effect not running on server | [runes-reactivity.md](references/runes-reactivity.md) |
| 404 on dynamic routes | [routing-navigation.md](references/routing-navigation.md) |
| Context not available (called outside component) | [state-management.md](references/state-management.md) |
| $: reactive statement not working | [ecosystem-antipatterns.md](references/ecosystem-antipatterns.md) |
| Store/rune confusion | [ecosystem-antipatterns.md](references/ecosystem-antipatterns.md) |
