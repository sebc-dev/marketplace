# State Management & Pinia

Production patterns for Vue 3 state management with Pinia. Covers store architecture, reactivity traps, SSR, testing, and advanced action patterns. For exact API signatures, use official Vue docs via WebFetch.

<quick_reference>

## Quick Reference — 10 Rules

1. **Pinia is the official Vue 3 state manager** — replaces Vuex entirely
2. **`storeToRefs()`** to destructure store — plain destructuring loses reactivity
3. **Option stores:** `state`/`getters`/`actions` — simpler, DevTools-friendly
4. **Setup stores:** Composition API style — more flexible, better TypeScript inference
5. **One store per domain concern** — never one mega-store
6. **`$patch()`** for batch updates — single mutation event in DevTools
7. **Store actions can be async** — handle errors inside actions with try/catch
8. **Stores are singletons** — SSR needs one Pinia instance per request
9. **Don't destructure the store directly** — `storeToRefs()` for refs, methods directly
10. **`provide`/`inject`** for component-tree-scoped state, Pinia for app-wide state

</quick_reference>

<option_vs_setup_store>

## Option Store vs Setup Store

| Criteria | Option Store | Setup Store |
|---|---|---|
| Mental model | Vuex-like, explicit sections | Composition API, free-form |
| TypeScript inference | Good, needs typed state return | Excellent, automatic inference |
| DevTools `$patch` tracking | Full support | Full support |
| Composable reuse | Limited | Import and use composables directly |
| Migration path | Start here, convert later | Target for complex domains |
| Learning curve | Lower | Requires Composition API knowledge |

**Option store:**
```ts
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0, name: 'Counter' }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
  },
})
```

**Setup store:**
```ts
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const name = ref('Counter')
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, name, doubleCount, increment }
})
```

> Setup stores must explicitly return everything that should be accessible.

</option_vs_setup_store>

<store_architecture>

## Store Architecture

**One store per domain** — split by business concern:
```
stores/
  useUserStore.ts       # Auth, profile, preferences
  useCartStore.ts       # Cart items, totals
  useProductStore.ts    # Product catalog, search
  useNotificationStore.ts
```

**Store composition** — one store calling another:
```ts
// stores/useCartStore.ts
export const useCartStore = defineStore('cart', () => {
  const userStore = useUserStore() // import and use directly

  const discountedTotal = computed(() =>
    userStore.isPremium ? total.value * 0.9 : total.value
  )
  return { discountedTotal }
})
```

**Key rules:**
- Avoid circular dependencies between stores — restructure if Store A needs Store B needs Store A
- Lazy import inside actions to break cycles: `const other = useOtherStore()` inside the action body
- Factory pattern for dynamic stores: `const useRepoStore = (id: string) => defineStore(\`repo-\${id}\`, () => { ... })()`
- **Layer separation:** stores own state logic, composables own UI logic (scroll position, form validation)

</store_architecture>

<reactivity_traps>

## Reactivity Traps

**Destructuring loses reactivity:**
```ts
const store = useCounterStore()

// WRONG — count is a static value
const { count } = store

// CORRECT — count is a ref
const { count } = storeToRefs(store)

// Actions are plain functions — destructure directly
const { increment } = store
```

**`$patch` behavior:**
```ts
// Object syntax — shallow merge, single DevTools event
store.$patch({ name: 'New', count: store.count + 1 })

// Callback syntax — direct mutation, single subscription event, complex logic
store.$patch((state) => {
  state.items.push(newItem)
  state.total = state.items.reduce((sum, i) => sum + i.price, 0)
})
```

**Getter returning new object each time — triggers unnecessary re-renders:**
```ts
// BAD — new array reference every access
getters: {
  activeItems: (state) => state.items.filter(i => i.active)
}
// FIX — cache in component with computed, or memoize in store
```

</reactivity_traps>

<actions_advanced>

## Advanced Action Patterns

**Async with error handling:**
```ts
actions: {
  async fetchUser(id: string) {
    this.loading = true
    this.error = null
    try {
      this.user = await api.getUser(id)
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Unknown error'
      throw e // re-throw if callers need to handle
    } finally {
      this.loading = false
    }
  }
}
```

**Optimistic update with rollback:**
```ts
async function toggleFavorite(itemId: string) {
  const prev = [...favorites.value]
  favorites.value.push(itemId) // optimistic
  try {
    await api.addFavorite(itemId)
  } catch {
    favorites.value = prev // rollback
  }
}
```

**Cancellation:**
```ts
let controller: AbortController | null = null

async function search(query: string) {
  controller?.abort()
  controller = new AbortController()
  results.value = await api.search(query, { signal: controller.signal })
}
```

**Action subscriptions:**
```ts
const unsubscribe = store.$onAction(({ name, args, after, onError }) => {
  after((result) => analytics.track(name, { args, result }))
  onError((error) => logger.error(name, error))
})
```

</actions_advanced>

<ssr_pinia>

## SSR & Pinia

**Create Pinia per request** — prevents cross-request state pollution:
```ts
// server entry
export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia() // fresh per request
  app.use(pinia)
  return { app, pinia }
}
```

**Nuxt 3:** automatic SSR support via `@pinia/nuxt` — no manual setup needed.

**State serialization:** Pinia auto-serializes state to `window.__pinia` for hydration. Client-side Pinia picks it up automatically.

**Persisted state with SSR:**
```ts
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Use SSR-safe storage — cookies instead of localStorage
defineStore('user', {
  persist: {
    storage: piniaPluginPersistedstate.cookies(), // or custom SSR-safe storage
  },
})
```

> Without per-request Pinia, singleton stores share state across concurrent requests — data leaks between users.

</ssr_pinia>

<testing_stores>

## Testing Stores

**`createTestingPinia()`** — auto-stubs all actions, provides initial state:
```ts
import { createTestingPinia } from '@pinia/testing'

const wrapper = mount(MyComponent, {
  global: {
    plugins: [
      createTestingPinia({
        initialState: { counter: { count: 10 } },
      }),
    ],
  },
})

const store = useCounterStore()
expect(store.count).toBe(10)
expect(store.increment).toHaveBeenCalledTimes(0) // auto-stubbed
```

**Testing real actions:**
```ts
createTestingPinia({ stubActions: false })
```

**Mocking specific actions:**
```ts
const store = useCounterStore()
store.increment = vi.fn()
```

**Important:** always import the store *after* `createTestingPinia()` is installed — otherwise you get the real store instance.

</testing_stores>

<anti_patterns>

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Destructuring store without `storeToRefs()` | Loses reactivity — values become static snapshots | Use `storeToRefs()` for state/getters |
| Single mega-store for all app state | Unmanageable, poor code splitting, coupled domains | Split by domain: user, cart, product |
| Accessing `store.state.x` in template | Vuex pattern, unnecessary nesting in Pinia | Access `store.x` directly |
| Using Vuex in new Vue 3 project | Deprecated, no Composition API support | Use Pinia |
| Mutating store state outside actions | No traceability, DevTools can't track | Use actions or `$patch()` |
| Circular store dependencies | Runtime errors, infinite loops | Redesign boundaries or lazy-import in actions |
| Pinia store for local component state | Overkill, pollutes global state | Use `ref()`/`reactive()` in component |
| Not handling async action errors | Unhandled promise rejections, silent failures | `try`/`catch` inside every async action |
| Wrapping store state in `reactive()` | Unnecessary double-wrapping, already reactive | Use store directly or `storeToRefs()` |

</anti_patterns>

<troubleshooting>

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Store state not reactive after destructuring | Direct destructuring strips reactivity | Use `storeToRefs()` |
| Action not tracked in DevTools | Direct state mutation without `$patch` | Use `$patch()` or an action |
| SSR state leaked between requests | Singleton Pinia instance shared across requests | Create Pinia per request |
| Getter recomputes every access | Getter returns new object/array reference each time | Cache with `computed` in component or memoize |
| Store not available in component | Pinia not installed on the app instance | Call `app.use(createPinia())` before mount |
| Test store has stale state | Store persisted between test cases | Create fresh `createTestingPinia()` per test |
| Hydration mismatch with persisted state | `localStorage` not available on server | Use SSR-safe storage (cookies) |
| Circular dependency error | Store A imports Store B imports Store A | Restructure boundaries or lazy-import inside action body |
| `$subscribe` fires too often | Multiple `$patch` calls instead of batching | Use `$patch(callback)` for batch mutations |

</troubleshooting>
