# Performance & Lifecycle

Vue 3 rendering optimization, bundle strategy, memory management, and lifecycle edge cases for production apps. For exact API signatures, use official Vue docs via WebFetch.

<quick_reference>
## Quick Reference — 10 Performance Rules

1. **shallowRef()** for large data (1000+ items) — avoids deep proxy overhead
2. **v-memo** for expensive list item rendering — caches vnode unless deps change
3. **v-once** for truly static content — rendered once, never patched
4. **Lazy loading:** `defineAsyncComponent` + dynamic `import()` for heavy components
5. **Virtual scrolling** for 10K+ items (`vue-virtual-scroller`)
6. **computed()** is automatically cached — prefer over methods in templates
7. **Object.freeze() / markRaw()** for large read-only datasets
8. **watchPostEffect** over nextTick for post-DOM-update logic
9. **Error boundaries:** `onErrorCaptured` + `return false`, or ErrorBoundary component pattern
10. **onRenderTriggered** (dev only) to diagnose unnecessary re-renders
</quick_reference>

<rendering_optimization>
## Rendering Optimization

Vue 3 compiler optimizations are automatic: static hoisting, patch flags, tree flattening. Focus on what you control.

### v-memo — Skip Re-render When Deps Unchanged

```vue
<div v-for="item in list" :key="item.id" v-memo="[item.id, item.selected]">
  <ExpensiveChild :item="item" />
</div>
```

Only re-renders when `item.id` or `item.selected` changes. All other prop changes ignored.

### v-once — Render Once, Never Diff Again

```vue
<div v-once>
  <h1>{{ appTitle }}</h1>
  <LargeStaticTree />
</div>
```

### Key Attribute — Force Re-creation

```vue
<UserProfile :key="userId" />
<!-- Component fully destroyed and recreated when userId changes -->
```

### Template Pitfalls

- Functional components have **no significant perf advantage** in Vue 3 (compiler optimizes SFCs)
- Avoid inline object creation in templates — creates new reference every render:

```vue
<!-- Bad: new object every render -->
<Comp :style="{ color: dynamicColor }" />

<!-- Good: stable reference -->
<Comp :style="computedStyle" />
```
</rendering_optimization>

<reactivity_performance>
## Reactivity Performance

| Scenario | Use | Why |
|---|---|---|
| Small/medium data | `ref()` | Deep reactivity is fine |
| 1000+ items array | `shallowRef()` | Avoids proxying every nested object |
| Third-party instance (Chart.js, map) | `markRaw()` or `shallowRef()` | Proxy breaks internal state |
| Large read-only dataset | `Object.freeze()` | Vue skips making it reactive |

### shallowRef + triggerRef for Manual Updates

```ts
const items = shallowRef<Item[]>([])

function updateItem(index: number, patch: Partial<Item>) {
  items.value[index] = { ...items.value[index], ...patch }
  triggerRef(items) // manually notify watchers
}
```

### Watch Specific Slices, Not Whole Objects

```ts
// Bad: deep watch on entire store state
watch(() => store.state, handler, { deep: true })

// Good: watch a computed derivation
const activeCount = computed(() => store.items.filter(i => i.active).length)
watch(activeCount, handler)
```

### computed() Caching

- Only re-evaluates when reactive deps change
- Must be a **pure function** — no side effects, no async
- Prefer computed over methods in templates (methods re-run every render)
</reactivity_performance>

<bundle_loading>
## Bundle & Loading Strategy

**Targets:** <200KB initial JS (gzipped), <50KB per route chunk.

### Route-Level Code Splitting

```ts
const routes = [
  { path: '/dashboard', component: () => import('./views/Dashboard.vue') },
  { path: '/settings', component: () => import('./views/Settings.vue') },
]
```

### Component-Level Async Loading

```ts
const HeavyEditor = defineAsyncComponent({
  loader: () => import('./HeavyEditor.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,       // ms before showing loading
  timeout: 10000,   // ms before showing error
})
```

### Tree-Shaking

- Use **named imports** from libraries: `import { debounce } from 'lodash-es'`
- Avoid barrel re-exports that prevent tree-shaking
- Vite generates prefetch links automatically for route chunks

### Bundle Analysis

```bash
npx vite-bundle-visualizer
# or
npx rollup-plugin-visualizer
```
</bundle_loading>

<runtime_patterns>
## Runtime Patterns

### Off-Main-Thread Work

- **Web Workers** for CPU-intensive operations (parsing, sorting large datasets)
- **Debounce/throttle** for frequent events (resize, scroll, input)
- **requestAnimationFrame** for visual/animation updates

### nextTick — Legitimate Uses Only

```ts
// DOM measurement after state change
count.value++
await nextTick()
const height = el.value!.offsetHeight

// Focus management after conditional render
showInput.value = true
await nextTick()
inputRef.value?.focus()
```

### watchPostEffect > nextTick

```ts
// Prefer: declarative, auto-disposed
watchPostEffect(() => {
  if (items.value.length) {
    scrollToBottom(containerRef.value)
  }
})
```

### onUpdated Pitfall

Mutating state inside `onUpdated` causes an **infinite loop**. Use `watch` or `computed` instead.

### Error Boundaries

```ts
onErrorCaptured((err, instance, info) => {
  reportError(err, info)
  return false // stop propagation
})
```
</runtime_patterns>

<memory_leaks>
## Memory Leak Prevention

Common sources: forgotten event listeners, uncleared intervals, unclosed WebSocket, orphaned watchers.

### Cleanup Pattern — Match Every Side Effect

```ts
const controller = new AbortController()
const intervalId = setInterval(poll, 5000)

window.addEventListener('resize', onResize, { signal: controller.signal })

onUnmounted(() => {
  controller.abort()          // cancels fetch + removes listener
  clearInterval(intervalId)
})
```

### effectScope for Grouped Cleanup

```ts
const scope = effectScope()
scope.run(() => {
  const doubled = computed(() => count.value * 2)
  watch(doubled, handler)
})
onUnmounted(() => scope.stop()) // disposes all effects at once
```

### Known Issues

- **KeepAlive:** watchers continue running in deactivated components (use `onDeactivated` to pause)
- **Detached DOM nodes:** chart/map instances must be explicitly destroyed in `onUnmounted`
- **Third-party libraries:** always call their `destroy()` / `dispose()` methods on unmount
</memory_leaks>

<profiling>
## Profiling & Diagnostics

### onRenderTracked / onRenderTriggered (Dev Only)

```ts
onRenderTriggered((event) => {
  // event: { effect, target, type, key, newValue, oldValue }
  debugger // pause here to inspect what triggered re-render
})
```

### Tools

| Tool | Use Case |
|---|---|
| Vue DevTools | Component tree, state inspection, performance timeline |
| Chrome Performance tab | Frame-by-frame rendering analysis |
| Chrome Memory snapshots | Heap growth, detached DOM nodes |
| Lighthouse | Automated performance audit (LCP, FID, CLS) |
| `vite-bundle-visualizer` | Bundle composition and size |
</profiling>

<anti_patterns>
## Anti-Patterns

| Pattern | Problem | Fix |
|---|---|---|
| `ref()` for 10K+ items | Deep proxy overhead on every nested object | `shallowRef()` + `triggerRef()` |
| Deep watch on large store state | Fires on any nested change, expensive traversal | Computed getter on specific slice |
| Inline object in template `:style="{...}"` | New reference every render, triggers child update | Computed property for stable reference |
| Missing cleanup in `onUnmounted` | Memory leaks, zombie listeners | `AbortController`, `clearInterval`, `removeEventListener` |
| Mutating state in `onUpdated` | Infinite render loop | Use `watch` or `computed` instead |
| `nextTick` chains | Masking reactivity bugs, fragile timing | `watchPostEffect` for declarative post-DOM logic |
| Eager loading all routes | Bloated initial bundle | Lazy `() => import()` for every route |
| Inline handlers creating closures in `v-for` | New function per item per render | Extract to method with item param |
| Expensive list without `v-memo` | Re-renders all items on any list change | Add `v-memo` with relevant deps |
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Solution |
|---|---|---|
| App feels slow on large list | Deep proxy on thousands of items | `shallowRef` + `v-memo` + virtual scrolling |
| Memory grows on navigation | Cleanup missing in `onUnmounted` | Add cleanup for all side effects (listeners, timers, sockets) |
| Component re-renders unnecessarily | Prop or computed creates new object reference each time | Stabilize references with computed, use `v-memo` |
| Bundle too large (>200KB gzip) | All routes eagerly loaded | Lazy import every route, analyze with bundle visualizer |
| `onUpdated` infinite loop | State mutation inside `onUpdated` | Move logic to `watch` or `computed` |
| `nextTick` doesn't fix timing issue | Underlying reactivity problem, not a timing problem | Fix reactivity instead of adding `nextTick` |
| Chart.js / map library crashes with proxy | Vue proxied the third-party instance | Use `shallowRef()` or `markRaw()` for library objects |
| Watcher fires too often | Deep watch on large object triggers on every nested change | Watch specific computed slice of the data |
</troubleshooting>
