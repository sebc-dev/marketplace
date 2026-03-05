# Composition API & Lifecycle

Vue 3 Composition API patterns, compiler macros, composable architecture, provide/inject, and lifecycle hooks. For exact API signatures, use official Vue docs via WebFetch.

<quick_reference>
1. `<script setup>` is the standard -- compiles to setup() with better TS inference and smaller bundle
2. defineProps/defineEmits/defineModel are compiler macros -- no import needed, top-level only
3. defineModel() (3.4+) replaces manual prop+emit for v-model -- supersedes VueUse useVModel()
4. Composables: prefix with `use`, accept MaybeRefOrGetter, normalize with toValue(), return refs
5. Lifecycle hooks must be registered synchronously in setup -- after await they are silently ignored
6. provide/inject for dependency injection across component tree -- InjectionKey<T> + Symbol for type safety
7. onScopeDispose over onUnmounted in composables -- works in stores, effectScope, and components
8. useTemplateRef() (3.5+) replaces string template refs for type-safe DOM access
9. onWatcherCleanup (3.5+) for cleanup in watchers -- replaces manual AbortController patterns
10. getCurrentInstance() is NOT for application code -- use provide/inject or Pinia instead
</quick_reference>

Compiler macros: defineProps, defineEmits, defineModel, defineSlots, defineExpose, defineOptions.

<define_macros>
## defineProps

**Type-based (recommended)** -- full TS inference, smaller bundle:
```ts
const props = defineProps<{ title: string; count?: number; items?: string[] }>()
```
Runtime declaration only when validator needed: `defineProps({ email: { type: String, validator: (v: string) => v.includes('@') } })`.

**Reactive props destructure (3.5+)** -- replaces withDefaults:
```ts
const { msg = 'hello', labels = ['one', 'two'] } = defineProps<{ msg?: string; labels?: string[] }>()
// Destructured props need getter wrapper for reactivity:
// watch(() => msg, ...) or useDoubled(() => msg)
```
Pre-3.5: use `withDefaults(defineProps<T>(), { labels: () => ['one', 'two'] })` -- factory function required for objects/arrays.

## defineEmits

Type-based with labeled tuple syntax (3.3+):
```ts
const emit = defineEmits<{ change: [id: number]; update: [value: string]; submit: [] }>()
```
Trap: emitting `click`/`focus`/`input` collides with native DOM events -- use `item-click`, `value-change`.

## defineModel (3.4+)

```ts
const model = defineModel<string>()               // v-model="val"
const title = defineModel<string>('title')         // v-model:title="t"
const [model, modifiers] = defineModel<string>({   // with modifiers
  set: (value) => modifiers.capitalize ? value.charAt(0).toUpperCase() + value.slice(1) : value
})
```
Known traps: (1) default without parent value causes desync (parent=undefined, child=default). (2) Object values shared by reference -- child mutations directly affect parent. Clone if independent state needed.

## defineSlots, defineExpose, defineOptions

- **defineSlots**: typed scoped slots for generic components -- `defineSlots<{ default: (props: { item: T }) => any }>()`
- **defineExpose**: imperative public API only (`focus()`, `open()`, `close()`). Code smell if exposing reactive state.
- **defineOptions**: `inheritAttrs: false` and component `name` (auto-inferred from filename since 3.2.34).
</define_macros>

Composable design: naming, inputs, outputs, cleanup, async patterns.

<composable_architecture>
## Naming and types

| Prefix | Purpose | Example |
|--------|---------|---------|
| `use` | Standard composable | `useMouse`, `useStorage` |
| `create` | Factory returning composable | `createSharedState` |
| `on` | Event listener | `onClickOutside` |
| `try` | Safe operation (no throw) | `tryOnMounted`, `tryOnScopeDispose` |

Types: `Use{Name}Options` for options, `Use{Name}Return` for return type.

## Input: MaybeRefOrGetter + toValue()

```ts
export function useTitle(title: MaybeRefOrGetter<string>) {
  watchEffect(() => { document.title = toValue(title) })
}
// Valid: useTitle('Static'), useTitle(ref('Dyn')), useTitle(() => `Page ${n.value}`)
```
Exception: never use MaybeRefOrGetter for callbacks -- toValue() would invoke them.

## Output: plain object of refs (never reactive)

```ts
function useMouse() {
  const x = ref(0), y = ref(0)
  return { x, y }  // destructure-safe
}
// WRONG: reactive({x:0,y:0}) -- destructuring loses reactivity
```

## Cleanup hierarchy

```
onScopeDispose    -> composable/library code (works in effectScope AND components)
onUnmounted       -> component-specific cleanup only
onWatcherCleanup  -> watcher-specific cleanup (Vue 3.5+)
effectScope       -> managing groups of effects outside components (Pinia stores, tests)
```

```ts
export function useInterval(cb: () => void, ms: MaybeRefOrGetter<number>) {
  let timer: ReturnType<typeof setInterval> | null = null
  const clean = () => { if (timer) { clearInterval(timer); timer = null } }
  const resume = () => { clean(); timer = setInterval(cb, toValue(ms)) }
  resume()
  onScopeDispose(clean)  // works in components, stores, effectScope
  return { pause: clean, resume }
}
```

## Async: prefer "reactive sync" pattern

```ts
// Prefer: sync setup, data flows reactively
const data = ref<ApiResponse | null>(null)
fetch('/api').then(r => r.json()).then(res => { data.value = res })
const user = computed(() => data.value?.user)
// Avoid: async composable requiring Suspense + risking context loss
```

## onWatcherCleanup (3.5+)

```ts
watch(searchQuery, (query) => {
  const controller = new AbortController()
  onWatcherCleanup(() => controller.abort())
  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then(r => r.json()).then(res => { results.value = res })
    .catch(e => { if (e.name !== 'AbortError') throw e })
})
```

## When to extract

Keep inline: component-specific, < 50 lines, not shared. Extract: reused 2+ components, script > 200 lines, independently testable. Warning signs: 300+ lines, 5+ refs, 3+ watchers.
</composable_architecture>

Type-safe dependency injection across the component tree.

<provide_inject>
## InjectionKey + injectStrict

```ts
// keys.ts
export const FormCtxKey: InjectionKey<FormContext> = Symbol('FormContext')

// Provider
provide(FormCtxKey, formContext)

// Consumer -- injectStrict throws if missing
function injectStrict<T>(key: InjectionKey<T>, fallback?: T): T {
  const resolved = inject(key, fallback)
  if (resolved === undefined) throw new Error(`Could not resolve ${key.description}`)
  return resolved
}
```

## Reactive provide -- critical pitfall

```ts
provide('count', count.value)  // WRONG: snapshot, not reactive
provide('count', count)        // CORRECT: ref object
provide('prop', computed(() => props.myProp))  // CORRECT: reactive derived
```
Keep mutations in provider, pass `readonly()` refs + mutation functions to consumers.

## Use cases

| Pattern | Best for | Not for |
|---------|----------|---------|
| Composable + provide/inject | Form contexts, theme, compound components | Global state (use Pinia) |
| App-level provide | Config, i18n, shared services | Everything (recreates Pinia poorly) |
| Symbol keys + InjectionKey<T> | All injection | String keys (collision-prone) |
</provide_inject>

Hook execution order, async context loss, KeepAlive, cleanup, SSR, error boundaries.

<lifecycle_patterns>
## Execution order

```
Mount:   Parent setup -> Parent onBeforeMount -> [Child setup -> Child onBeforeMount -> Child onMounted] -> Parent onMounted
Update:  Parent onBeforeUpdate -> Child onBeforeUpdate -> Child onUpdated -> Parent onUpdated
Unmount: Parent onBeforeUnmount -> Child onBeforeUnmount -> Child onUnmounted -> Parent onUnmounted
```

## Async context loss after await

| API | Before await | After await (setup) | After await (`<script setup>`) |
|-----|-------------|---------------------|-------------------------------|
| Lifecycle hooks | Works | Silently ignored | Works (withAsyncContext) |
| watch/computed | Auto-disposed | Works but **leaks** | Auto-disposed |
| getCurrentInstance | Works | Returns null | Works |

Rule: register all hooks before any await. `<script setup>` + top-level await is the only safe async (requires `<Suspense>`).

## Cleanup inventory

| Resource | Cleanup |
|----------|---------|
| Event listeners | `removeEventListener()` |
| Timers (interval/timeout/rAF) | `clearInterval()` / `clearTimeout()` / `cancelAnimationFrame()` |
| WebSocket | `ws.close()` |
| Observers (Intersection/Mutation/Resize) | `.disconnect()` |
| AbortController | `.abort()` |
| Third-party (Chart.js, editors) | `.destroy()` |

## KeepAlive

- `onMounted` fires once (first mount). `onActivated` fires on first mount AND every reactivation.
- `onDeactivated` fires on cache AND final unmount. `onUnmounted` only on cache eviction (max).
- Known bug: watchers continue firing when deactivated -- pause manually in `onDeactivated`.

```ts
onActivated(() => { timer = setInterval(poll, 1000) })
onDeactivated(() => { clearInterval(timer!); timer = null })
```

## SSR

- `onMounted` never runs server-side -- use for browser-only code (DOM APIs, third-party libs).
- `onServerPrefetch` for server data fetching (no guaranteed order between siblings).
- Side effects in top-level setup leak on server -- `onUnmounted` is never called server-side.
- Hydration mismatch sources: `localStorage`, `window`, `new Date()`, invalid HTML nesting.

## Error boundary

`onErrorCaptured` captures descendant errors only. Return `false` to stop propagation. Async errors in setup() without `<Suspense>` are not captured.

```vue
<script setup lang="ts">
const error = ref<Error | null>(null)
onErrorCaptured((err) => { error.value = err; return false })
</script>
<template>
  <slot v-if="!error" />
  <slot v-else name="fallback" :error="error" :reset="() => error = null" />
</template>
```
</lifecycle_patterns>

Common mistakes and what to do instead.

<anti_patterns>
| Anti-pattern | Problem | Correct approach |
|-------------|---------|-----------------|
| Options API in new code | Worse TS inference, no composable reuse | Composition API with `<script setup>` |
| Lifecycle hooks after await | Silently ignored, never registered | Register all hooks synchronously before any await |
| getCurrentInstance() in app code | Returns null after await/setTimeout | provide/inject, props/emits, or Pinia |
| Monolithic onMounted | Untestable, unreusable, no isolated cleanup | Extract into composables with self-contained cleanup |
| Missing cleanup in onUnmounted | Memory leaks: timers, listeners, observers | AbortController, removeEventListener, clearInterval |
| Reactive object in provide without ref | Child receives snapshot, loses reactivity | Provide ref object directly, never `.value` |
| Composable returning reactive() | Destructuring loses reactivity | Return plain object of refs |
| defineModel for non-v-model prop | Misuse of two-way binding macro | Use defineProps for read-only data flow |
| Watcher in setTimeout | Not in component scope, never auto-stopped | Register synchronously or use effectScope + manual stop |
| Mutations in onUpdated | Triggers re-render causing infinite loop | Use watch or computed for reactive derivations |
</anti_patterns>

Diagnosis and resolution for common Composition API issues.

<troubleshooting>
| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| onMounted not called | Async setup without Suspense boundary | Wrap async component with `<Suspense>` |
| Lifecycle hook silently ignored | Registered after await in setup() | Move hook before any await |
| provide value not reactive in child | Provided `count.value` instead of `count` | Provide ref object or use `computed()` |
| inject returns undefined | No matching provide in ancestor chain | Add default value or use injectStrict |
| Composable not cleaning up | Used onUnmounted instead of onScopeDispose | Switch to onScopeDispose for portability |
| Watch continues after unmount | Watcher created after await or in setTimeout | Register synchronously or stop manually |
| defineModel object mutates parent | Object passed by reference, not cloned | Clone in child: `ref(structuredClone(model.value))` |
| Template ref is null | Accessed before onMounted or v-if hides element | Use onMounted or watch the template ref |
| Destructured prop not reactive | Pre-3.5 destructure loses reactivity | Use getter wrapper `() => prop` for composables/watchers |
| Watcher fires with stale data | Race condition from rapid async changes | onWatcherCleanup + AbortController or freshness guard |
</troubleshooting>
