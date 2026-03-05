---
name: vue-production
description: |
  Vue 3 (3.4+/3.5+) production expertise. Composition API (<script setup>),
  ref/reactive/computed/watch, defineProps/defineEmits/defineModel (3.4+),
  useTemplateRef (3.5+), composable architecture, provide/inject, Pinia 2.x
  (option/setup stores, storeToRefs), Vue Router v4 (guards, middleware,
  typed routes), v-model, form validation (vee-validate, FormKit),
  HTTP composables (useFetch, TanStack Query), TypeScript strict patterns
  (generic components, typed slots, vue-tsc), Vitest + Vue Test Utils,
  performance (shallowRef, v-memo, code splitting, virtualization),
  Vite configuration, CSS scoped/:deep/v-bind()/Tailwind, vue-i18n,
  security (XSS, CSRF, CSP, token storage), observability (Sentry, DevTools),
  deployment (Docker, Cloudflare Pages, CI/CD).
  Use when working with .vue files, vite.config.ts, vue.config.*, pinia stores,
  router files, composables, or Vue 3 projects.
  No MCP -- use official Vue docs via WebFetch for API signatures.
---

## Critical Rules (Vue 3 Composition API)

These cause the most common code generation errors. Apply before writing any Vue code.

1. `ref()` by default -- NOT `reactive()` (loses reactivity on reassignment/destructuring)
2. `defineModel()` for v-model (3.4+) -- NOT manual prop + emit. Object passed by reference trap
3. Composables: `toValue()`/`toRef()` at boundaries -- accept MaybeRefOrGetter, return refs
4. Lifecycle hooks synchronous -- hooks after `await` are silently ignored (except `<script setup>`)
5. `storeToRefs()` to destructure Pinia -- NOT direct destructuring (loses reactivity)
6. `useRoute()` is reactive, destructuring is not -- use `computed(() => route.params.id)`
7. Guards: return values -- NOT `next()` callback (deprecated pattern)
8. `shallowRef()` for large data -- NOT `ref()` for 1000+ items or third-party objects
9. `v-html` = XSS vector -- ALWAYS sanitize with DOMPurify. CSTI = Vue-specific vulnerability
10. `VITE_` prefix exposes to client bundle -- server secrets MUST NOT use this prefix

## Decision Matrices

### Ref vs Reactive vs ShallowRef

| Data type | Choice | Why |
|-----------|--------|-----|
| Primitive (string, number, boolean) | `ref()` | Only option, consistent .value |
| Object / collection (default) | `ref()` | Safe reassignment + destructuring |
| Large dataset (1000+ items) | `shallowRef()` | Avoids deep proxy overhead |
| Third-party instance (Chart.js, D3) | `shallowRef()` + `markRaw()` | Prevents proxy interference |

### State Mechanism

| Scope | Mechanism | When |
|-------|-----------|------|
| Single component | `ref()` / `reactive()` local | Default for component state |
| Parent to child | `defineProps()` | One-way data flow |
| Child to parent | `defineEmits()` | Event-based communication |
| Two-way binding | `defineModel()` (3.4+) | Forms, toggles, inputs |
| Component subtree | `provide()` / `inject()` | Theme, auth, config |
| App-wide shared | Pinia store | User session, cart, feature flags |
| Server cache | TanStack Query | API data with cache/refetch |

### Load Strategy

| Need | Approach | When |
|------|----------|------|
| Simple one-off fetch | Composable with `ref` + `fetch` | Basic API call |
| Cached with refetch | TanStack Query | Multiple consumers, stale-while-revalidate |
| Form submission | Direct `fetch`/`ofetch` in handler | No caching needed |
| Background sync | Polling composable or WebSocket | Real-time updates |

## Official Docs Integration

No MCP server available. Use WebFetch for official documentation when you need exact API signatures, config option lists, or directive syntax:

| Domain | URL |
|--------|-----|
| Vue 3 core | `https://vuejs.org/api/` |
| Vue Router | `https://router.vuejs.org/api/` |
| Pinia | `https://pinia.vuejs.org/api/` |
| Vite | `https://vite.dev/config/` |
| VueUse | `https://vueuse.org/functions.html` |

## Reference Files

- `references/reactivity-refs.md` -- ref/reactive/shallowRef selection, watchers, computed patterns
  - Sections: quick_reference, ref_vs_reactive, watchers, shallow_reactivity, computed_patterns, anti_patterns, troubleshooting

- `references/composition-api.md` -- defineProps/defineEmits/defineModel, composables, provide/inject, lifecycle
  - Sections: quick_reference, define_macros, composable_architecture, provide_inject, lifecycle_patterns, anti_patterns, troubleshooting

- `references/components-templates.md` -- Props, slots, dynamic components, template directives, attrs
  - Sections: quick_reference, props_validation, slots_composition, dynamic_components, builtin_components, template_patterns, attrs_inheritance, anti_patterns, troubleshooting

- `references/state-pinia.md` -- Pinia option/setup stores, storeToRefs, actions, SSR, testing
  - Sections: quick_reference, option_vs_setup_store, store_architecture, reactivity_traps, actions_advanced, ssr_pinia, testing_stores, anti_patterns, troubleshooting

- `references/router-navigation.md` -- Route architecture, guards, navigation state, typed routes
  - Sections: quick_reference, route_architecture, guards_middleware, state_navigation, typescript_routes, production_patterns, anti_patterns, troubleshooting

- `references/typescript-patterns.md` -- Props typing, component typing, composable typing, env typing
  - Sections: quick_reference, props_typing, component_typing, composable_typing, store_typing, router_typing, env_typing, anti_patterns, troubleshooting

- `references/forms-http.md` -- v-model/defineModel, validation, HTTP composables, TanStack Query, auth
  - Sections: quick_reference, vmodel_definemodel, validation, form_architecture, http_composables, cache_tanstack, auth_interceptors, anti_patterns, troubleshooting

- `references/performance-lifecycle.md` -- Rendering optimization, bundle loading, memory leaks, profiling
  - Sections: quick_reference, rendering_optimization, reactivity_performance, bundle_loading, runtime_patterns, memory_leaks, profiling, anti_patterns, troubleshooting

- `references/testing-styling-i18n.md` -- Vitest, Vue Test Utils, scoped CSS, Tailwind, vue-i18n
  - Sections: quick_reference, vitest_setup, component_testing, e2e_patterns, scoped_css, tailwind_vue, i18n_patterns, anti_patterns, troubleshooting

- `references/build-security-deploy.md` -- Vite config, XSS/CSRF/CSP, Sentry, Docker, CI/CD
  - Sections: quick_reference, vite_config, security_xss, security_auth, observability, deployment, cicd, anti_patterns, troubleshooting

## Quick Troubleshooting Index

Route error symptoms to the right reference file.

| Symptom | Reference |
|---------|-----------|
| Reactive value not updating after reassignment | [reactivity-refs.md](references/reactivity-refs.md) |
| Watch not firing / firing too often | [reactivity-refs.md](references/reactivity-refs.md) |
| shallowRef not triggering update | [reactivity-refs.md](references/reactivity-refs.md) |
| Lifecycle hook silently ignored | [composition-api.md](references/composition-api.md) |
| Composable not cleaning up | [composition-api.md](references/composition-api.md) |
| defineModel object mutates parent | [composition-api.md](references/composition-api.md) |
| Prop mutation warning | [components-templates.md](references/components-templates.md) |
| Slot content not rendering | [components-templates.md](references/components-templates.md) |
| v-for items not updating correctly | [components-templates.md](references/components-templates.md) |
| Store state not reactive after destructuring | [state-pinia.md](references/state-pinia.md) |
| SSR state leaked between requests | [state-pinia.md](references/state-pinia.md) |
| Route param not updating component | [router-navigation.md](references/router-navigation.md) |
| Infinite redirect loop in guards | [router-navigation.md](references/router-navigation.md) |
| vue-tsc errors not matching IDE | [typescript-patterns.md](references/typescript-patterns.md) |
| Generic component not inferring type | [typescript-patterns.md](references/typescript-patterns.md) |
| Race condition in search/fetch | [forms-http.md](references/forms-http.md) |
| v-model not updating parent | [forms-http.md](references/forms-http.md) |
| App slow with large list | [performance-lifecycle.md](references/performance-lifecycle.md) |
| Memory grows on navigation | [performance-lifecycle.md](references/performance-lifecycle.md) |
| Scoped style not applying to child | [testing-styling-i18n.md](references/testing-styling-i18n.md) |
| XSS in user-generated content | [build-security-deploy.md](references/build-security-deploy.md) |
| VITE_ variable undefined at runtime | [build-security-deploy.md](references/build-security-deploy.md) |
