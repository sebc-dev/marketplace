# State Management

Svelte 5 state mechanism selection, SSR safety, Context API, module state, store interop, and $app/state. For rune API signatures ($state, $derived, $effect) defer to the MCP Svelte documentation server.

<quick_reference>
1. Component-local mutable state -> `$state()` in `<script>`, computed -> `$derived()`
2. Parent-child (1-2 levels) -> `$props()` / `$bindable()`
3. Subtree sharing (3+ levels) -> Context API (`setContext`/`getContext`)
4. App-wide + SSR -> Context API in root `+layout.svelte`
5. App-wide + client-only SPA -> Module-level `$state` in `.svelte.ts`
6. Read-only config/constants -> Module-level in `.svelte.ts` (safe even with SSR)
7. SvelteKit page/nav data -> `$app/state` (page, navigating, updated)
8. Start/stop notifiers or load() return -> Svelte stores (still needed)
9. Legacy store interop -> `fromStore()` / `toStore()` from `svelte/store`
10. External push sources (Firebase, WS) -> `createSubscriber` from `svelte/reactivity`
11. Large immutable data replaced wholesale -> `$state.raw()` (no proxy overhead)
12. NEVER use `$effect` to synchronize state -- use `$derived`
</quick_reference>

Full decision flow for selecting the right state mechanism.

<decision_tree>
```
START: Where does this state live and who needs it?
|
+-- Only this component?
|   YES -> $state() in component <script>
|   +-- Computed from other state? -> $derived() or $derived.by()
|   +-- Side effect (DOM, network, analytics)? -> $effect() (escape hatch only)
|
+-- Parent <-> Child (1-2 levels)?
|   YES -> $props() / $bindable()
|
+-- Shared across subtree (3+ levels)?
|   YES -> Context API (setContext/getContext)
|   +-- Type safety without manual keys? -> createContext<T>() [v5.40+]
|   +-- MUST pass $state OBJECTS, not primitives (primitives lose reactivity)
|
+-- App-wide shared state?
|   +-- Using SSR (SvelteKit)?
|   |   +-- Per-user/mutable -> Context API in root +layout.svelte
|   |   +-- Read-only config -> Module-level .svelte.ts (safe)
|   +-- Client-only SPA?
|       +-- Module-level $state in .svelte.ts (singleton)
|
+-- SvelteKit page/navigation data?
|   -> $app/state (page, navigating, updated)
|
+-- Need start/stop notification (setup on first sub, teardown on last)?
|   -> Svelte stores (writable/readable with StartStopNotifier)
|
+-- Returning reactive state from load() functions?
|   -> Svelte stores (runes cannot be returned from load)
|
+-- Bridging external reactive source?
|   -> createSubscriber from svelte/reactivity
|
+-- Interop with legacy store-based library?
    -> fromStore() / toStore() bridges from svelte/store
```
</decision_tree>

Context API patterns for SSR-safe shared state across component subtrees.

<context_api>
**Typed accessor pattern (all versions):**

```ts
// lib/contexts/user.ts (pure .ts -- no runes needed)
import { getContext, setContext } from 'svelte';
const USER_KEY = Symbol('user');
interface UserState { name: string; email: string }
export function setUserContext(user: UserState) { return setContext(USER_KEY, user); }
export function getUserContext() { return getContext<UserState>(USER_KEY); }
```

**Provider** (+layout.svelte): `let user = $state({...}); setUserContext(user);`
**Consumer** (any descendant): `const user = getUserContext(); // user.name is reactive`

**createContext pattern (v5.40+):**

```ts
import { createContext } from 'svelte';
interface UserState { name: string; email: string }
export const [getUserContext, setUserContext] = createContext<UserState>();
// No manual key, type-safe, throws if not set
```

**Rules:**
- Context is ONLY available inside the component tree (not in hooks, load functions, or endpoints)
- Pass `$state` objects or getter functions -- NEVER primitives (see anti_patterns)
- Each SSR request creates a new component tree -> context is automatically per-request isolated
- Context accessor files use `.ts` (not `.svelte.ts`) since they only wrap setContext/getContext
</context_api>

Module-level `.svelte.ts` singletons: three export patterns and SSR constraints.

<module_state>
**Three export patterns** (in `counter.svelte.ts`):

```ts
// A: Reactive object (simplest)
export const counter = $state({ count: 0 }); // counter.count++

// B: Class (most performant -- V8 optimizes)
class Counter {
  count = $state(0);
  doubled = $derived(this.count * 2);
  increment = () => this.count++;
}
export const counter = new Counter();

// C: Factory (isolated instances -- SSR-safe when called per component)
export function createCounter(initial = 0) {
  let count = $state(initial);
  return { get count() { return count; }, increment: () => count++ };
}
```

**Cannot directly export reassigned $state:**

```ts
// WRONG: let count = $state(0); export { count }; // raw signal, not reactive
// RIGHT: export const state = $state({ count: 0 }); // object proxy stays reactive
```

**SSR safety rules:**
- Module-level state = SINGLETON in server memory, shared across ALL requests
- Safe ONLY for: read-only constants, client-only SPAs
- UNSAFE for: any mutable per-user state in SSR (data leaks between users)
- Mutable app-wide + SSR -> Context API in root +layout.svelte

**File naming:** `.svelte.ts` only for files directly using runes. Pure TS importing from rune files stays `.ts`.
</module_state>

Bridges between Svelte stores and runes for migration and interop.

<stores_interop>
**fromStore -- consume a store in rune code:**

```ts
import { fromStore } from 'svelte/store';

const rune = fromStore(existingWritableStore);
rune.current;          // read (reactive)
rune.current = newVal; // write (calls store.set)
```

**toStore -- expose rune state to legacy store code:**

```ts
import { toStore } from 'svelte/store';

let count = $state(0);
const store = toStore(
  () => count,          // getter
  (v) => { count = v; } // setter
);
```

**When stores are still needed (not deprecated):**
1. StartStopNotifier callbacks (no rune equivalent)
2. Returning reactive values from SvelteKit `load()` functions (runes cannot be returned)
3. `svelte/motion` (tweened, spring -- still store-based)
4. Third-party libraries requiring the store contract

**Migration quick-map:**

| Svelte 4 | Svelte 5 |
|---|---|
| `writable(0)` | `let x = $state(0)` in `.svelte.ts` |
| `derived(store, fn)` | `$derived(expression)` |
| `$store` auto-subscribe | Direct variable access |
| `$: computed = ...` | `let computed = $derived(...)` |
| Store file `.ts` | Rune file `.svelte.ts` |
| `$app/stores` | `$app/state` (run `pnpx sv migrate app-state`) |
</stores_interop>

SvelteKit page/navigation reactive state via $app/state.

<app_state>
```svelte
<script>
  import { page } from '$app/state';
  const id = $derived(page.params.id); // MUST use $derived
  const isAdmin = $derived(page.data.user?.role === 'admin');
</script>
<p>Current path: {page.url.pathname}</p>
```

**vs $app/stores:** Fine-grained reactivity (page.state changes do NOT invalidate page.data), no `$` prefix, MUST use `$derived` (legacy `$:` never updates).

**Objects:** `page` (url, params, data, state, form, error, status), `navigating` (from, to, type), `updated` (new app version check).

**Form actions:** Results flow through `page.form`. Do not store in module-level state.

**Load data rule:** Always `let x = $derived(data.val)`, never `const x = data.val` (SvelteKit reuses components on navigation; const freezes).
</app_state>

SSR safety: module singleton leaks, per-request isolation rules.

<ssr_safety>
**SSR safety matrix:**

| Pattern | SSR-Safe? | Notes |
|---|---|---|
| `$state()` in component `<script>` | YES | New instance per render |
| `$derived()` / `$derived.by()` | YES | Evaluated during SSR |
| `$effect()` | NO | Does NOT run during SSR |
| `setContext()` / `getContext()` | YES | Per-request component tree |
| Module-level `$state` in .svelte.ts | DANGER | Shared between ALL requests |
| Module-level class singleton | DANGER | Same leak as above |
| Factory function (called per component) | YES | New instance per call |
| `$app/state` | YES | Per-request isolation by SvelteKit |
| `localStorage` / `sessionStorage` | NO | Does not exist on server |
| `window` / `document` | NO | Does not exist on server |

**Browser-only state pattern:** Guard with `import { browser } from '$app/environment'`; use `browser ? localStorage.getItem('x') : fallback` for init, `$effect` for persistence (client-only).

**Rules:**
- Context API is NOT available in hooks (handle, handleFetch) -- use `event.locals` for per-request server state
- Module-level state in hook files is shared across requests (same singleton danger)
- State that MUST affect SSR rendering (e.g., dark mode) -> use cookies, not localStorage
- Never conditionally render based on browser-only values during SSR (causes hydration mismatch flash)
- Test files using runes must be named `.svelte.test.ts`; use `flushSync()` for synchronous assertions
</ssr_safety>

Common mistakes with corrections in tabular format.

<anti_patterns>
| Anti-Pattern | Wrong | Right | Why |
|---|---|---|---|
| $effect for state sync | `$effect(() => { doubled = count * 2 })` | `let doubled = $derived(count * 2)` | $derived is synchronous, lazy, SSR-safe; $effect runs after DOM update, client-only |
| Storing derived in $state | `let total = $state(0); $effect(() => { total = items.reduce(...) })` | `let total = $derived(items.reduce(...))` | Two sources of truth, manual sync, timing issues |
| Module mutable state + SSR | `export const appState = $state({ user: null })` | Context API in root +layout.svelte | Module state is singleton in server memory -- user data leaks |
| Primitive in context | `setContext('count', count)` | `setContext('counter', $state({ count: 0 }))` | JS pass-by-value captures the number, not the reactive binding |
| $effect for data fetching | `$effect(() => { fetch('/api')... })` | SvelteKit `load()` function | $effect skips SSR, causes empty renders and hydration mismatch |
| Destructuring reactive | `const { count } = counter` | `counter.count` | Destructuring evaluates getter once, captures primitive |
| $effect read+write same state | `$effect(() => { count += 1 })` | Use `untrack()` or restructure | Circular read-write causes ERR_SVELTE_TOO_MANY_UPDATES |
| const for load data | `const x = data.content.length` | `let x = $derived(data.content.length)` | SvelteKit reuses components on navigation; const freezes |
| Stores in new Svelte 5 code | `writable(0)` | `$state(0)` in .svelte.ts | Runes are the idiomatic Svelte 5 approach (stores not deprecated but reserved for specific needs) |
</anti_patterns>

Common issues with state management: symptom, cause, and resolution.

<troubleshooting>
| Symptom | Cause | Fix |
|---|---|---|
| Context value is undefined | `getContext` called outside component tree (hooks, load, endpoints) | Context only works inside components; use `event.locals` in hooks |
| Context value never updates | Primitive passed to `setContext` | Pass `$state` object or getter function instead of primitive |
| Module state leaks between users (SSR) | Module-level `$state` singleton shared across requests | Move mutable state to Context API in +layout.svelte |
| `$effect` code not running during SSR | $effect is client-only by design | Use `$derived` for computed state; use load functions for data fetching |
| ERR_SVELTE_TOO_MANY_UPDATES | $effect reads and writes same reactive variable | Use `untrack()` for the read, or restructure to avoid circular dependency |
| Store `$` prefix not working in rune mode | Mixing store auto-subscribe syntax with runes | Use `fromStore()` to bridge, or migrate to `$state` |
| Computed value frozen after navigation | Used `const` instead of `$derived` for load data | Replace `const x = data.val` with `let x = $derived(data.val)` |
| Reactivity lost after destructuring | Destructured reactive object captures primitive | Access properties through the parent object: `obj.prop` not `const { prop } = obj` |
| `$app/state` not updating with `$:` | Legacy reactive declarations incompatible with $app/state | Use `$derived()` instead of `$:` |
| Hydration mismatch flash (e.g., theme) | Server renders default, client reads localStorage | Use cookies for server-aware state, or delay client render with `onMount` |
| `.svelte.ts` file not compiling runes | File extension is `.ts` instead of `.svelte.ts` | Rename to `.svelte.ts` only for files that directly use runes |
</troubleshooting>
