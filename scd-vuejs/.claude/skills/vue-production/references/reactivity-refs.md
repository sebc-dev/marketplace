# Reactivity & Refs

Core Vue 3 reactivity patterns: ref vs reactive, watchers, computed, shallowRef — with decision tables, anti-patterns and troubleshooting. For exact API signatures, use official Vue docs via WebFetch.

Ten rules that cover 90% of reactive code decisions.

<quick_reference>

1. `ref()` for primitives and objects — unwraps in templates, `.value` in script
2. `reactive()` for objects only — loses reactivity on reassignment or destructuring
3. `shallowRef()` for large data (1000+ items) or third-party objects (Chart.js, D3, Three.js)
4. `computed()` is cached, only re-evaluates when deps change — must be side-effect-free
5. `watch()` for side effects when specific sources change (explicit, lazy by default)
6. `watchEffect()` for auto-tracking all reactive deps (runs immediately)
7. `toRef()` / `toRefs()` to preserve reactivity when destructuring reactive objects
8. `triggerRef()` to force update on shallowRef after in-place mutation
9. Reactive values read after `await` / `setTimeout` are NOT tracked by watchers or computed
10. `ref()` on DOM elements via `useTemplateRef('name')` (3.5+) or template ref attribute

</quick_reference>

Decision table for choosing the right reactive primitive.

<ref_vs_reactive>

| Data shape | Recommended | Why |
|---|---|---|
| Primitive (string, number, boolean) | `ref()` | Only option — `reactive()` doesn't accept primitives |
| Object / collection (default) | `ref()` | Safe reassignment via `.value`, no destructuring trap |
| Map / Set with mutation methods | `reactive()` | Convenient mutation syntax, but never reassign |
| Large dataset (1000+ nested items) | `shallowRef()` | Avoids deep Proxy overhead |
| Third-party instance (Chart.js, D3) | `shallowRef()` + `markRaw()` | Prevents Proxy from breaking internal getters/setters |

**Why ref() is the default:** Works with primitives, no destructuring trap, consistent `.value` access, full replacement via `.value =` is safe. Core team consensus (Anthony Fu, Eduardo San Martin Morote) and official docs recommend ref over reactive.

**reactive() reassignment trap:**

```ts
// BUG: template still bound to old proxy
let state = reactive({ count: 0 })
state = reactive({ count: 1 }) // disconnected!

// FIX: use ref
const state = ref({ count: 0 })
state.value = { count: 1 } // works
```

**reactive() destructuring trap:**

```ts
// BUG: count is a plain number, not reactive
const { count } = reactive({ count: 0 })

// FIX: toRefs preserves reactivity
const { count } = toRefs(reactive({ count: 0 }))
```

**Reactive Props Destructure (3.5+):**

```vue
<script setup lang="ts">
// 3.5+: compiler transforms this to keep reactivity
const { title, count = 0 } = defineProps<{ title: string; count?: number }>()
// Pass to composables as getter: useMyComposable(() => title)
</script>
```

</ref_vs_reactive>

Watch and watchEffect patterns, flush timing, cleanup, and stopping.

<watchers>

| Need | Use | Key option |
|---|---|---|
| React to specific source changes | `watch(source, cb)` | Lazy by default |
| Auto-track all deps in callback | `watchEffect(cb)` | Runs immediately |
| Old + new value comparison | `watch(source, (n, o) => {})` | — |
| Run once then stop | `watch(src, cb, { once: true })` | 3.4+ |
| Run on creation | `watch(src, cb, { immediate: true })` | — |
| Read DOM after update | `watch(src, cb, { flush: 'post' })` | Or `watchPostEffect()` |
| Limit deep traversal depth | `watch(src, cb, { deep: 2 })` | 3.5+ |

**Watch signature patterns:**

```ts
// Single ref
watch(count, (newVal, oldVal) => { /* ... */ })

// Getter (specific property of reactive object)
watch(() => state.count, (n, o) => { /* ... */ })

// Multiple sources
watch([count, name], ([newCount, newName], [oldCount, oldName]) => { /* ... */ })
```

**Deep watching performance:** `watch(reactiveObj, cb)` implicitly enables `deep: true` — traverses every nested property. On 10K-item arrays, this creates tens of thousands of tracked deps. Prefer a getter for specific props, or use `{ deep: 2 }` (3.5+) to limit depth.

**onWatcherCleanup (3.5+):**

```ts
import { watch, onWatcherCleanup } from 'vue'

watch(searchQuery, (query) => {
  const controller = new AbortController()
  onWatcherCleanup(() => controller.abort())
  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then(r => r.json())
    .then(data => { results.value = data })
})
```

Replaces the older `onCleanup` 3rd parameter. Supports multiple independent registrations and works from nested helper functions.

**Pause / resume (3.5+):** `const { stop, pause, resume } = watch(...)` — useful for temporarily disabling watchers during bulk state updates.

**Memory leak rule:** Watchers created outside synchronous setup (after `await`, in `setTimeout`) are NOT auto-stopped on component unmount. Always register watchers synchronously, or manually call `stop()`.

</watchers>

When and how to opt out of deep reactivity.

<shallow_reactivity>

**shallowRef:** Only `.value` reassignment is tracked. Deep properties are NOT reactive.

```ts
const list = shallowRef<Item[]>([])

// Does NOT trigger updates:
list.value.push(newItem)

// Triggers update — full replacement:
list.value = [...list.value, newItem]

// Or mutate then manually trigger:
list.value.push(newItem)
triggerRef(list)
```

**shallowReactive:** Only root-level properties are reactive. Nested objects are plain.

**When to use:**

| Scenario | Pattern |
|---|---|
| Large lists (1000+ items) | `shallowRef([])` + replace or `triggerRef()` |
| Chart.js / D3 / Three.js instances | `shallowRef(null)` to track assignment |
| Object you never want proxied | `markRaw(instance)` — permanent opt-out |
| Immutable snapshots (undo history) | `markRaw()` on each clone (VueUse pattern) |

**markRaw identity warning:** `markRaw()` only applies at root. A nested object extracted from a markRaw parent and placed into a reactive container WILL be proxied — causing silent identity breaks.

</shallow_reactivity>

Computed caching, writable computed, and reference stability.

<computed_patterns>

**Read-only computed (default):**

```ts
const fullName = computed(() => `${first.value} ${last.value}`)
```

Cached — only re-evaluates when `first` or `last` change. Method calls re-run every render.

**Writable computed:**

```ts
const fullName = computed({
  get: () => `${first.value} ${last.value}`,
  set: (val: string) => {
    const [f, l] = val.split(' ')
    first.value = f
    last.value = l ?? ''
  }
})
```

Use for two-way prop binding when `defineModel()` (3.4+) is not an option.

**Rules:**
- Never put side effects in computed (no async, no DOM mutation, no API calls)
- Computed returning a new object each time triggers downstream watchers even if "semantically equal" — watch specific primitive props instead
- If a watcher's only purpose is setting another ref, replace it with computed

</computed_patterns>

Common mistakes and their fixes.

<anti_patterns>

| Anti-pattern | Problem | Correct pattern |
|---|---|---|
| `reactive()` for primitives | Doesn't work, silent failure | `ref()` |
| Destructuring `reactive()` | Extracted primitives lose reactivity | `toRefs()` or dot-notation access |
| Reassigning `reactive()` variable | Template bound to old proxy | `ref()` + `.value` or `Object.assign()` |
| Deep watch on large objects | 10K+ tracked deps, perf degradation | Getter watch on specific prop, `{ deep: 2 }` |
| Mutating a computed value | Runtime warning, no effect | Writable computed or separate ref |
| `watch` + `immediate` just to init | Redundant pattern | `watchEffect()` (auto-runs immediately) |
| Watcher registered after `await` | Not auto-stopped, memory leak | Register synchronously in setup |
| `ref()` for 1000+ items | Unnecessary deep Proxy overhead | `shallowRef()` |
| Forgetting `.value` in script | Comparing/passing ref wrapper, not value | Always use `.value` in script context |
| Nested `reactive()` inside `ref()` | Unnecessary double wrapping | `ref()` is already deep by default |

</anti_patterns>

Diagnosing reactive update failures.

<troubleshooting>

| Symptom | Cause | Fix |
|---|---|---|
| Value not updating in template | Missing `.value` in script when setting ref | Add `.value` in `<script>`, templates auto-unwrap |
| Reactive object lost after reassignment | `reactive()` variable reassigned with `=` | Use `ref()` + `.value` or `Object.assign()` on proxy |
| Watch not firing on deep change | Missing `deep: true` or using `shallowRef` | Add `{ deep: true }`, or switch to `ref()` |
| Watch fires but value seems the same | Object reference changed (computed creates new obj) | Use getter watching a specific primitive prop |
| Component not updating after array push | Using `shallowRef` — push is not tracked | Call `triggerRef()` after mutation, or replace array |
| Memory leak from watchers | Watcher created after `await` / in `setTimeout` | Register watchers synchronously in setup, call `stop()` |
| Template ref is null in onMounted | `v-if` hiding element or wrong ref name | Check `v-if` timing, use `useTemplateRef()` (3.5+) |
| Performance degraded with large list | `ref()` creating deep Proxy on 10K+ items | Switch to `shallowRef()` + `triggerRef()` |
| Pinia store value not reactive | Destructured store without `storeToRefs()` | `const { x } = storeToRefs(useMyStore())` |

</troubleshooting>
