# Runes & Reactivity

Svelte 5 reactivity via compiler-directive runes ($state, $derived, $effect). For exact API signatures and parameter types, use the MCP Svelte documentation server. This reference covers decision criteria, idiomatic patterns, traps, and performance guidance.

<quick_reference>
1. `$derived` is the workhorse -- use it for any value computable from other state (90% of cases)
2. `$state` for independent mutable state the component owns; deep proxy on objects/arrays
3. `$state.raw` for bulk data (1K+ items) replaced wholesale, never mutated in place
4. `$effect` is an escape hatch for side effects with outside world (DOM, network, timers) -- never for deriving state
5. Prefer event handlers over `$effect` when possible -- simpler, no dependency tracking overhead
6. `$effect` does NOT run during SSR; `$derived` does -- this asymmetry drives architecture decisions
7. Runes work identically in `.svelte` components and `.svelte.ts`/`.svelte.js` modules
8. `$state` fields in classes are non-enumerable -- implement `toJSON()` for serialization
9. Module-level `$state` leaks between SSR requests -- use Context API for per-request state
10. Always read reactive values synchronously in effects -- reads after `await`/`setTimeout` are untracked
</quick_reference>

Decision flow for selecting the correct rune for every piece of reactive state.

<decision_tree>
```
Is value computable from other state?
  YES -> Single expression? -> $derived(expr)
         Multi-statement?   -> $derived.by(() => { ... })
  NO
    |
Is it independent mutable state?
  YES -> Primitives or small objects? -> $state(initial)
         Large dataset (1K+) or wholesale replacement? -> $state.raw(initial)
  NO
    |
Need side effect with outside world (DOM/network/timer)?
  YES -> Can it go in an event handler instead?
           YES -> Use onclick/onsubmit handler (preferred)
           NO  -> $effect(() => { ... return cleanup; })
  NO
    |
Need code before DOM update (scroll preservation)?
  YES -> $effect.pre (rare)
    |
Need manually controlled effect lifetime (outside component tree)?
  YES -> $effect.root (returns cleanup fn; tests/framework code)
    |
Need writable value that resets when dependencies change (optimistic UI)?
  YES -> Writable $derived (5.25+): declare with `let`, not `const`
    |
Need auto-cancel async work on re-run?
  YES -> getAbortSignal() inside effect/derived body (5.35+)
```
</decision_tree>

Local state, $state.raw for bulk data, $state.snapshot for external APIs.

<state_patterns>
**Local component state -- the foundational pattern:**

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
<button onclick={() => count++}>{doubled}</button>
```

No wrapper objects, no `.value`. Primitives have zero proxy overhead.

**$state.raw -- skip proxy for bulk/immutable data:**

Use when: (a) datasets exceed ~1K items replaced wholesale, (b) data from external sources rendered as-is, (c) referential equality matters (proxy identity != original object).

```ts
let results = $state.raw<SearchResult[]>([]);
// Only full reassignment is tracked:
results = await fetchResults(query); // triggers update
results[0].title = 'new'; // NOT tracked -- no proxy
```

**Pattern:** `$state.raw` array of reactive class instances gives per-item granularity without array-level proxy cost.

**$state.snapshot -- strip proxy for external consumption:**

```ts
// Always use when passing reactive state to external APIs
externalChart.update($state.snapshot(reactiveData));
```

Required for: `console.log` (readable output), `structuredClone`, `postMessage`, IndexedDB, any third-party library not expecting Proxy objects.
</state_patterns>

$derived, $derived.by for multi-statement, and writable $derived for optimistic UI.

<derived_patterns>
**$derived -- single expression (most common):**

```ts
let total = $derived(items.reduce((a, b) => a + b, 0));
```

Push-pull evaluation: notified on change but not recomputed until read. Chains of 10 deriveds where only the last is read are cheap -- unread deriveds stay dirty but unconsumed.

**$derived.by -- multi-statement logic:**

```ts
let filtered = $derived.by(() => {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(i => i.name.toLowerCase().includes(q));
});
```

Use only when expression requires intermediate variables, early returns, or multi-line logic.

**Writable $derived -- optimistic UI (5.25+):**

```svelte
<script>
  let { post, like } = $props();
  let likes = $derived(post.likes); // declare with `let`, not `const`

  async function onclick() {
    likes += 1;              // temporary local override
    try { await like(); }
    catch { likes -= 1; }    // rollback on failure
  }
</script>
```

When `post.likes` changes from the server, the override is discarded automatically. Must use `let` declaration.
</derived_patterns>

$effect for side effects, cleanup patterns, $effect.pre, $effect.root, getAbortSignal.

<effect_patterns>
**Legitimate $effect uses:** canvas drawing, fetch calls, setInterval, third-party lib integration, document.title, localStorage sync.

**Debounce with cleanup:**

```svelte
<script>
  let query = $state('');
  let debounced = $state('');

  $effect(() => {
    const current = query; // read synchronously -- TRACKED
    const id = setTimeout(() => { debounced = current; }, 300);
    return () => clearTimeout(id); // cleanup cancels previous
  });
</script>
```

CRITICAL: reactive values must be read synchronously before `setTimeout`/`await`. Reads inside callbacks are NOT tracked.

**localStorage sync (external system -- legitimate use):**

```svelte
<script>
  let theme = $state(localStorage.getItem('theme') ?? 'light');
  $effect(() => { localStorage.setItem('theme', theme); });
</script>
```

**Auto-cancelling fetch with getAbortSignal (5.35+):**

```svelte
<script>
  import { getAbortSignal } from 'svelte';
  let { id } = $props();

  $effect(() => {
    fetch(`/api/items/${id}`, { signal: getAbortSignal() })
      .then(r => r.json())
      .then(data => { /* use data */ });
  });
</script>
```

When `id` changes, the previous fetch is automatically aborted. No manual cleanup needed.

**$effect.pre** -- runs before DOM update. Rare use case: scroll position preservation.

**$effect.root** -- manually controlled lifetime outside component tree. Returns cleanup function. Used in test harnesses or framework-level orchestration.
</effect_patterns>

Reactive classes with $state fields, prototype accessor behavior, toJSON() requirement.

<class_reactivity>
**Reactive class pattern:**

```ts
class Todo {
  done = $state(false);
  text = $state('');
  urgent = $derived(this.text.includes('!'));

  constructor(text: string) {
    this.text = $state(text); // constructor assignment (5.31+)
  }

  toJSON() {
    return { done: this.done, text: this.text };
  }
}
```

**Why toJSON() is mandatory:** The compiler transforms `$state` fields into get/set pairs on the prototype -- they are NOT enumerable. Without `toJSON()`:
- `JSON.stringify(new Todo())` returns `"{}"`
- `Object.keys(todo)` returns `[]`
- `{...todo}` produces empty object
- `structuredClone(todo)` loses all state fields

This is the most reported class-related gotcha. Always implement `toJSON()` on reactive classes.

**Class instances are never proxied** -- use `$state` on individual class fields for granular reactivity.
</class_reactivity>

.svelte.ts modules, getter pattern for exports, SSR singleton trap.

<shared_modules>
**Shared state via .svelte.ts modules:**

```ts
// counter.svelte.ts
let count = $state(0);
export const counter = {
  get count() { return count; },
  increment() { count++; }
};
```

**Why getters?** Exporting `count` directly snapshots the value at import time. Getters defer the read, preserving reactivity. The compiler enforces this: you cannot export a `$state` variable that gets reassigned.

**SSR singleton trap:**

```ts
// WRONG -- module state shared across ALL server requests
let count = $state(0); // User A's state leaks to User B

// RIGHT -- Context API for per-request state
// In layout/page component:
setContext('counter', $state({ count: 0 }));
```

Node.js modules are singletons. Module-level `$state` is safe ONLY in client-only apps (SPAs, Tauri, Astro islands with `client:only`). Use Context API for any user-specific state in SSR applications.

**Context reactivity:** Context values are captured once. For reactive primitives, pass an object or getter:

```ts
// Parent:
setContext('data', { get value() { return count; } });
// Child:
const ctx = getContext('data'); // use ctx.value in template
```
</shared_modules>

Common anti-patterns in tabular format -- what to avoid and what to do instead.

<anti_patterns>
| Anti-pattern | Problem | Correct pattern |
|---|---|---|
| `$effect(() => { left = 100 - spent; })` | Timing issues, SSR broken, glitch-prone | `let left = $derived(100 - spent)` |
| Effect chains: `$effect->$state->$effect` | Cascading microtasks, hard to debug | Chain `$derived` values (push-pull, no cascading) |
| `let count = 0` expecting reactivity | NOT reactive in Svelte 5 (Svelte 4 habit) | `let count = $state(0)` |
| `$state` for constants | Wasteful signal overhead | `const API_URL = 'https://...'` |
| `$state` + `$effect` for computable values | Unnecessary complexity, SSR gaps | `$derived(expr)` or `$derived.by(() => {...})` |
| Missing cleanup in `$effect` | Leaks timers/listeners on every re-run | `return () => clearInterval(id)` |
| Destructuring reactive object | Snapshots values, kills reactivity | Access properties through proxy: `obj.prop` |
| Mutating `$state` during render | Throws `state_unsafe_mutation` | Mutate in event handlers or `$effect` only |
| Passing proxy to external lib | Unexpected behavior (proxy !== POJO) | `$state.snapshot(data)` before passing |
| Reading state after `await`/`setTimeout` | Reads are NOT tracked asynchronously | Capture value synchronously before async call |
</anti_patterns>

Common errors, SSR asymmetry, and their resolutions.

<troubleshooting>
| Symptom | Cause | Fix |
|---|---|---|
| `ERR_SVELTE_TOO_MANY_UPDATES` | Effect reads and writes properties on same proxy object (circular dependency) | Replace `$effect` with `$derived` to compute the value |
| `$effect` code produces `undefined` in SSR | `$effect` never runs on server (SSR asymmetry) | Use `$derived` for values needed during SSR; reserve `$effect` for browser-only side effects |
| `state_unsafe_mutation` error | Writing to `$state` inside template expression or `$derived` body | Move state mutation to event handler or `$effect` |
| Module state shared across SSR requests | `.svelte.ts` module-level `$state` is singleton in Node.js | Use Context API (`setContext`/`getContext`) for per-request state |
| `JSON.stringify(instance)` returns `"{}"` | `$state` class fields are non-enumerable prototype accessors | Implement `toJSON()` on the class |
| `Object.keys()`/spread returns empty | Same cause: `$state` fields are get/set on prototype | Use `toJSON()` or explicit property listing |
| Reactive value not updating in `setTimeout` | Dependency tracker only captures synchronous reads | Read the value before `setTimeout`, use captured copy inside callback |
| `$derived` chain seems expensive | Concern about long derivation chains | Non-issue: push-pull means unread deriveds don't compute; equal values skip downstream |
| `SvelteMap`/`SvelteSet` values not reactive | Values inside reactive collections are NOT deeply reactive | Use reactive class instances as values, or restructure with `$state` fields |
| Destructured prop stops updating | JavaScript destructuring evaluates at point of destructuring, bypassing proxy | Access properties via dot notation on the proxy object |
</troubleshooting>
