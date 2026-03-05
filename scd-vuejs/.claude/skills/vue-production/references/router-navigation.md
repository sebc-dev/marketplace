# Vue Router v4 & Navigation

Production reference for Vue Router v4.x with Vue 3 Composition API. Covers route architecture, navigation guards, state management integration, and TypeScript patterns. For exact API signatures, use official Vue docs via WebFetch.

<quick_reference>
## Quick Reference — 10 Rules

1. **useRoute() is reactive** — but destructuring loses reactivity. Use `computed(() => route.params.id)`.
2. **Guards use return values** — `return false`, `return '/login'`, `return undefined` (proceed). The `next()` callback is a deprecated pattern.
3. **Lazy load every route** — `() => import('./views/Page.vue')` gives automatic code splitting.
4. **Nested routes: 2–3 levels max** — use componentless parent routes for logical grouping.
5. **Named routes over path strings** — type safety, easier refactoring, no hardcoded URLs.
6. **router.push() returns a Promise** — `await` it to detect and handle navigation failures.
7. **Route params are ALWAYS strings** — parse numbers explicitly with `parseInt` / `parseFloat`.
8. **Per-route guards for route-specific logic** — global guards for app-wide concerns (auth, analytics).
9. **404 catch-all** — `{ path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound }`.
10. **Route declaration order matters** — specific routes before dynamic params, catch-all last.
</quick_reference>

<route_architecture>
## Route Architecture

### File Organization by Feature Module

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from '@/features/auth/routes'
import { dashboardRoutes } from '@/features/dashboard/routes'
import { settingsRoutes } from '@/features/settings/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('@/views/Home.vue') },
    ...authRoutes,
    ...dashboardRoutes,
    ...settingsRoutes,
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue') },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
})
```

```ts
// src/features/dashboard/routes.ts
import type { RouteRecordRaw } from 'vue-router'

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: () => import('./layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard-home', component: () => import('./views/Overview.vue') },
      { path: 'analytics', name: 'dashboard-analytics', component: () => import('./views/Analytics.vue') },
      { path: 'projects/:projectId', name: 'dashboard-project', component: () => import('./views/Project.vue') },
    ],
  },
]
```

### Nesting Decisions

| Scenario | Approach |
|---|---|
| Shared layout (sidebar, header) | Nested routes with parent layout component |
| Logical grouping, no shared UI | Componentless parent (no `component`, just `children`) |
| Multi-panel layouts | Named views (`components: { default, sidebar }`) |
| Independent pages | Flat routes at root level |
| More than 3 levels deep | Flatten — redesign with componentless parents |

### Named Views

```vue
<!-- AppLayout.vue -->
<template>
  <RouterView />
  <RouterView name="sidebar" />
</template>
```

```ts
{
  path: '/workspace',
  components: {
    default: () => import('./views/Workspace.vue'),
    sidebar: () => import('./views/WorkspaceSidebar.vue'),
  },
}
```
</route_architecture>

<guards_middleware>
## Guards & Middleware

### Execution Order

```
beforeEach (global) → beforeEnter (per-route) → beforeRouteEnter (in-component) → afterEach (global)
```

### Global Guard — Auth + Analytics

```ts
router.beforeEach(async (to, from) => {
  const auth = useAuthStore()

  // Public routes pass through
  if (!to.meta.requiresAuth) return

  // Not authenticated → redirect to login
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Role check
  if (to.meta.roles && !to.meta.roles.includes(auth.user.role)) {
    return { name: 'forbidden' }
  }

  // Proceed (return undefined or true)
})

router.afterEach((to, from) => {
  document.title = (to.meta.title as string) ?? 'App'
  analytics.trackPageView(to.fullPath)
})
```

### Per-Route Guard — Data Prefetch

```ts
{
  path: '/projects/:id',
  component: () => import('./views/Project.vue'),
  beforeEnter: async (to) => {
    const store = useProjectStore()
    const exists = await store.fetchProject(to.params.id as string)
    if (!exists) return { name: 'not-found' }
  },
}
```

### Composable Guard Factory

```ts
// src/router/guards.ts
export function requireRole(...roles: string[]) {
  return (to: RouteLocationNormalized) => {
    const auth = useAuthStore()
    if (!roles.includes(auth.user.role)) {
      return { name: 'forbidden' }
    }
  }
}

// Usage
{ path: '/admin', beforeEnter: requireRole('admin', 'superadmin'), ... }
```

### Avoiding Infinite Redirect Loops

```ts
// BAD — infinite loop if login also requires auth
router.beforeEach((to) => {
  if (!isAuthenticated) return { name: 'login' }
})

// GOOD — exclude login route from auth check
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }
})
```
</guards_middleware>

<state_navigation>
## State & Navigation

### Reactive Route Params

```vue
<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Reactive param access
const projectId = computed(() => route.params.id as string)

// Watch for same-route param changes
watch(() => route.params.id, async (newId) => {
  if (newId) await loadProject(newId as string)
})
</script>
```

### Same-Route Component Re-creation

```vue
<!-- Force component re-creation on param change -->
<RouterView :key="route.fullPath" />

<!-- OR watch params inside component (preferred for data fetching) -->
```

### Navigation Failure Handling

```ts
import { NavigationFailureType, isNavigationFailure } from 'vue-router'

const result = await router.push({ name: 'dashboard' })

if (isNavigationFailure(result, NavigationFailureType.duplicated)) {
  // Already on this route — no-op
}
if (isNavigationFailure(result, NavigationFailureType.aborted)) {
  // Guard prevented navigation
  showNotification('Access denied')
}
```

### Scroll Behavior

```ts
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    // Browser back/forward: restore position
    if (savedPosition) return savedPosition
    // Hash links: scroll to element
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    // Different route: scroll to top
    if (to.path !== from.path) return { top: 0 }
  },
})
```

### Pinia + Router Sync

```ts
// Avoid race conditions: fetch data THEN navigate
async function createAndNavigate() {
  const store = useProjectStore()
  const project = await store.create(data)
  // Only navigate after store is updated
  await router.push({ name: 'project', params: { id: project.id } })
}
```
</state_navigation>

<typescript_routes>
## TypeScript Routes

### RouteMeta Augmentation

```ts
// src/router/types.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
    title?: string
    transition?: string
    breadcrumb?: string | ((route: RouteLocationNormalized) => string)
  }
}
```

### Typed Route Params

```ts
// Route params are ALWAYS strings — cast explicitly
const route = useRoute()
const id = computed(() => parseInt(route.params.id as string, 10))
const slug = computed(() => route.params.slug as string)
```

### Auto-Generated Typed Routes (unplugin-vue-router)

```ts
// vite.config.ts
import VueRouter from 'unplugin-vue-router/vite'

export default defineConfig({
  plugins: [
    VueRouter({ /* file-based routing */ }),
    Vue(),
  ],
})

// Usage — fully typed route names and params
import { useRoute } from 'vue-router/auto'
```

### Guard Typing

```ts
import type { NavigationGuardWithThis, RouteLocationNormalized } from 'vue-router'

const authGuard: NavigationGuardWithThis<undefined> = (to, from) => {
  if (!useAuthStore().isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
}
```
</typescript_routes>

<production_patterns>
## Production Patterns

### RouterView + Transition

```vue
<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="route.meta.transition ?? 'fade'" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
```

### Keep-Alive with RouterView

```vue
<RouterView v-slot="{ Component }">
  <KeepAlive :include="['DashboardView', 'SettingsView']">
    <component :is="Component" />
  </KeepAlive>
</RouterView>
```

### Lazy Loading Error Recovery

```ts
function lazyWithRetry(importFn: () => Promise<any>) {
  return () =>
    importFn().catch(() => {
      // Chunk load failure after deploy — reload once
      const key = 'chunk-retry'
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
      }
      return importFn() // final attempt
    })
}

// Usage
{ path: '/dashboard', component: lazyWithRetry(() => import('./views/Dashboard.vue')) }
```

### Dynamic Breadcrumbs from Route Meta

```vue
<script setup lang="ts">
const route = useRoute()
const breadcrumbs = computed(() =>
  route.matched
    .filter(r => r.meta.breadcrumb)
    .map(r => ({
      label: typeof r.meta.breadcrumb === 'function'
        ? r.meta.breadcrumb(route)
        : r.meta.breadcrumb,
      to: r.path,
    }))
)
</script>
```
</production_patterns>

<anti_patterns>
## Anti-Patterns

| Bad Practice | Problem | Fix |
|---|---|---|
| `next()` callback in guards | Deprecated, error-prone with multiple calls | Return-based guards: `return false`, `return { name: 'login' }` |
| `const { id } = useRoute().params` | Loses reactivity — `id` is a dead string | `computed(() => route.params.id)` |
| `router.push('/dashboard/123')` | Hardcoded paths break on refactor | `router.push({ name: 'dashboard', params: { id: '123' } })` |
| All routes in `router/index.ts` | Unmanageable in large apps | Split into feature modules, spread into main array |
| No 404 catch-all route | Blank page on unknown URLs | Add `/:pathMatch(.*)*` as last route |
| Deep nesting (>3 levels) | Complex outlet chains, hard to debug | Flatten with componentless parents |
| Fire-and-forget `router.push()` | Silent navigation failures | `await router.push()` and check for `NavigationFailure` |
| Using `route.params.id` as number directly | Params are always strings — type coercion bugs | `parseInt(route.params.id as string, 10)` |
| Accessing `this` in `beforeRouteEnter` | Component not created yet — `this` is undefined | Use return value or `onBeforeRouteUpdate` composable |
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Route param changes but component does not update | Same component instance is reused for same route | Add `:key="route.fullPath"` to `<RouterView>` or `watch(() => route.params)` |
| Infinite redirect loop | Guard redirects to a route that triggers the same guard | Add condition to exclude target route: `if (to.name !== 'login')` |
| Navigation failure silently ignored | `router.push()` not awaited | `await router.push()` and inspect the return value |
| Nested route not rendering | Parent component missing `<RouterView>` outlet | Add `<RouterView />` in the parent layout component |
| Route guard not firing | Guard placed at wrong level (global vs per-route) | Check guard registration — global in router setup, per-route in route config |
| 404 not catching all paths | Catch-all route declared before specific routes | Move `/:pathMatch(.*)*` to the **end** of the routes array |
| Page transition not working | `<Transition>` wrapping `<RouterView>` incorrectly | Use scoped slot pattern: `<RouterView v-slot="{ Component }">` |
| Lazy-loaded route fails after deploy | Chunk hash changed, browser requests old (deleted) chunk | Add retry logic with `window.location.reload()` fallback |
| Query params lost on navigation | `router.push` without preserving query | Spread existing query: `router.push({ ...to, query: { ...route.query, newParam: 'x' } })` |
</troubleshooting>
