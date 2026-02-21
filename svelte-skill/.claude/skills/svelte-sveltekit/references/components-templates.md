# Components & Templates

Svelte 5 props system, snippets, template directives, event handling, class styling, and spread patterns. For API signatures and type definitions, defer to the MCP Svelte documentation server.

<quick_reference>
1. Declare props via a single `let { ...} = $props()` with TypeScript interface
2. Use `$bindable()` only for form wrappers and UI toggles -- prefer callback props
3. Replace `<slot />` with `{@render children?.()}`, named slots with named snippets
4. Use `onclick={handler}` (lowercase) -- never `on:click` or `onClick`
5. Key every `{#each}` that has stateful items with a stable id, never with index
6. Use `class={[...]}` array syntax (5.16+) -- not `class:` directive or external clsx
7. Place local handlers AFTER `{...rest}` spread to prevent overwriting
8. Sanitize all `{@html}` content with DOMPurify -- Svelte cannot scope or track it
9. Dynamic components: `<Component />` directly -- `svelte:component` is legacy
10. Use `{@const}` inside blocks to name computed values and reduce template noise
11. Transitions are local by default in Svelte 5 -- add `|global` explicitly if needed
12. Wrap third-party components in `<svelte:boundary>` for error isolation
</quick_reference>

<props_system>
## Props: $props(), defaults, rest spread, $bindable

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary';
    children?: Snippet;
  }
  let { variant = 'primary', children, class: klass, ...rest }: Props = $props();
</script>
<button class="btn-{variant} {klass}" {...rest}>
  {@render children?.()}
</button>
```

### Rules
- **One single `$props()` per component** -- `let { a } = $props(); let { ...rest } = $props();` is a compiler error.
- **Reserved words**: use destructure rename -- `class: klass`, not `export { klass as class }`.
- **Flat props preferred**: beyond 4-5 props, refactor to compound components instead of config objects.
- **Full forwarding** (no extraction): `let props = $props()` then `{...props}` on the element.
- **Default object values are NOT `$state` proxies**: `let { data = { count: 0 } } = $props()` -- the fallback is a raw object, mutations have no reactive effect. Copy into `$state()` if local mutation is needed.
- **No nested destructuring**: `const { suggestion: { id } } = $props()` is a compiler error. Destructure in two steps, second level with `$derived`.

### $bindable -- opt-in two-way binding
```svelte
<script lang="ts">
  let { value = $bindable(''), ...props }: { value?: string } = $props();
</script>
<input bind:value {...props} />
```
**Use**: input/select/textarea wrappers, UI toggles, readonly measurements (`bind:clientWidth`), headless libs.
**Avoid**: complex validation, multi-consumer state, deep structures -- prefer callback props.
**Gotchas**: props are NOT bindable by default -- `bind:prop` without `$bindable()` errors. `bind:foo={undefined}` with `$bindable('default')` throws. Mutating parent `$state` prop triggers `ownership_invalid_mutation`.
</props_system>

<snippets>
## Snippets & {@render} -- replacing slots

Snippets are typed render functions that replace slots. `children` is the implicit snippet (replaces `<slot />`). Named snippets replace `<slot name="x">`.

### Generic data list (component + consumer)
```svelte
<!-- DataList.svelte -->
<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  let { data, row, empty }: { data: T[]; row: Snippet<[T]>; empty?: Snippet } = $props();
</script>
{#if data.length === 0}
  {@render empty?.()}
{:else}
  {#each data as item}{@render row(item)}{/each}
{/if}

<!-- Usage: types inferred from data -->
<DataList data={users}>
  {#snippet row(user)}<span>{user.name}</span>{/snippet}
  {#snippet empty()}<p>No results</p>{/snippet}
</DataList>
```

### Key patterns
- **Optional children with fallback**: `{#if children}{@render children()}{:else}Fallback{/if}`
- **Short form** (no fallback): `{@render children?.()}`
- **Conditional snippet**: `{@render (condition ? snippetA : snippetB)()}`

### Snippet vs component

| Criterion | Snippet | Component |
|-----------|---------|-----------|
| Own state / scoped styles | No | Yes |
| Cross-file reuse | Limited | Yes |
| Overhead / recursion | Very low / Yes | Higher / Yes |

**Gotchas**: snippets are stateless (need `$state` = use component). Lexical scoping only. `children` is reserved in runes mode. No rest params: `{#snippet foo(...args)}` is invalid.
</snippets>

<template_patterns>
## Template blocks: {#each}, {#if}, {#await}, {@const}, {@html}

### {#each} keying decision matrix

| Situation | Key needed? | Which key? |
|-----------|:-----------:|------------|
| Static list, text only | No | -- |
| Items with internal state (inputs, components) | **Yes** | `item.id` |
| Reordered / filtered / sorted list | **Yes** | `item.id` |
| `animate:flip` usage | **Required** | `item.id` |

```svelte
<!-- Wrong: index key = default behavior, object key loses identity on API refresh -->
{#each items as item, i (i)}    <!-- WRONG -->
{#each items as item (item)}     <!-- WRONG -->

<!-- Right -->
{#each items as { id, name, ...rest } (id)}
  {@const label = name.toUpperCase()}
  <Item {name} {label} {...rest} />
{:else}
  <p>No items</p>
{/each}
```

**Repeat N times**: `{#each { length: 8 }, i}...{/each}`. **Iterables**: `Map`/`Set` work but arrays faster; use `SvelteMap`/`SvelteSet` from `svelte/reactivity` for deep reactivity.

### {#await} -- race conditions handled automatically
Only the most recent promise resolves. In SSR, only `pending` renders. With SvelteKit, load data arrives resolved via `$props()` -- use `{#await}` only for client-created promises.

### {#key} -- force remount or replay transitions
`{#key selectedUserId}<UserProfile id={selectedUserId} />{/key}`. Anti-pattern: using `{#key}` for derived values -- use `$derived` instead.

### {@const}
Block-scoped computed values. Only inside `{#if}`, `{#each}`, `{#snippet}` -- not at template top level.

### {@html} -- XSS danger
`{@html DOMPurify.sanitize(userContent)}`. Content is invisible to Svelte: no scoped styles, no reactivity. Use `:global` to style.
</template_patterns>

<dynamic_components>
## Dynamic components -- Svelte 5

Components are dynamic by default. No need for `svelte:component`.

```svelte
<script>
  let Component = $derived(condition ? DialogA : DialogB);
</script>
<Component {data} />

<!-- In an each: dot notation -->
{#each items as item (item.id)}
  <item.component {...item.props} />
{/each}
```

```svelte
<!-- LEGACY -- never generate -->
<svelte:component this={Component} />
```

For dynamic HTML tags, use `<svelte:element this={tagName}>` -- if `this` is nullish, nothing renders.
</dynamic_components>

<event_handling>
## Events: callback props, delegation, onclick

Svelte 5 replaces `createEventDispatcher` and `on:event` with callback props and native DOM event attributes.

```svelte
<script lang="ts">
  let { onselect, ondelete }: {
    onselect?: (item: Item) => void;
    ondelete?: (id: string) => void;
  } = $props();
</script>
<button onclick={() => onselect?.(item)}>Select</button>
```

**Naming**: DOM-like wrappers use exact DOM name (`onclick`, `oninput`). Business events prefix `on` (`onselect`, `onsave`).

**Modifier replacements**: `on:click|preventDefault` becomes `onclick={(e) => { e.preventDefault(); handler(e); }}`. `on:click|capture` becomes `onclickcapture={handler}`. `on:click|passive` becomes `on()` from `svelte/events` with `{ passive: true }`.

### Gotchas
- **Event delegation**: Svelte 5 uses root listener for common events. `stopPropagation()` fails with direct `addEventListener` -- use `on()` from `svelte/events`.
- **Touch/wheel passive**: `ontouchmove`/`ontouchstart` silently ignore `preventDefault()`. Use `on()` with `{ passive: false }`.
- **One handler per event**: `onclick={a} onclick={b}` invalid -- combine in single handler.
- **Handlers fire AFTER bindings**: in `oninput`, `bind:value` already has the new value.
- **Component callbacks get direct args**: `(item: Item)`, not `CustomEvent` -- no `.detail`.
</event_handling>

<class_styling>
## Class styling: class={[...]}, ClassValue, forwarding

```svelte
<!-- Array syntax (built-in clsx, 5.16+) -- RECOMMENDED -->
<div class={['px-4 py-2 rounded', active && 'bg-blue-600', size === 'lg' && 'text-xl']}>
<!-- Object syntax -->
<div class={{ active, disabled: !enabled }}>
<!-- Forwarded class -->
<button {...props} class={['btn-base', props.class]}>

<!-- AVOID: class: directive and external clsx() -->
<div class:active={isActive}>          <!-- less powerful -->
<div class={clsx('base', active && 'active')}>  <!-- unnecessary since 5.16 -->
```

**Type safety**: `ClassValue` from `svelte/elements` (5.19+). **Tailwind**: `twMerge()` still needed for conflict resolution -- built-in clsx does not resolve Tailwind conflicts.

**style: directive**: use for dynamic values and CSS custom properties (`style:--theme-color={color}`). Not for static styles. `style:color="red"` overrides `style="color: blue !important"`.
</class_styling>

<spread_patterns>
## Spread order, rest props, attribute precedence

Attribute order is sequential: local attributes AFTER spread override it, BEFORE get overridden.

```svelte
<button {...restProps} class={['btn', restProps.class]} onclick={(e) => {
  handleClick(e);
  restProps.onclick?.(e);
}}>
  {@render children?.()}
</button>
```

**Coercion traps**: `<input type="range" value={0.5} step="0.1" />` rounds value before step applies -- put `step` before `value`. Same for `<img loading="lazy" src="...">` -- `loading` before `src`.
</spread_patterns>

<anti_patterns>
## Anti-patterns -- what never to generate

| Anti-pattern | Problem | Correct approach |
|-------------|---------|-----------------|
| Blind spread `{...props}` on HTML element | Transmits non-DOM props, pollutes markup | Destructure: `let { myProp, ...htmlAttrs } = $props()` |
| Nested destructuring `{ a: { b } } = $props()` | Compiler error | Two-step: destructure first level, then `$derived` |
| Multiple `$props()` calls | Compiler error | Single `let { a, ...rest } = $props()` |
| `$effect` for derived values | Breaks SSR, unnecessary re-runs | Use `$derived` or `$derived.by()` |
| `on:click={handler}` | Svelte 4 legacy syntax | `onclick={handler}` |
| `<slot />` / `<slot name="x">` | Svelte 4 legacy syntax | `{@render children?.()}` / named snippets |
| `export let prop` | Svelte 4 legacy syntax | `let { prop } = $props()` |
| `createEventDispatcher()` | Svelte 4 legacy syntax | Callback props (`onselect`, `onsave`) |
| `<svelte:component this={X}>` | Svelte 4 legacy syntax | `<X />` directly |
| Quoting single expressions `disabled="{expr}"` | Coerces to string in Svelte 6 | `disabled={expr}` |
| Index as `{#each}` key | Identical to default behavior, no benefit | Use stable `item.id` |
| Module-level `$state` with SSR | Shared across ALL server requests, data leak | Use Context API for per-request state |
</anti_patterns>

<troubleshooting>
## Common issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ownership_invalid_mutation` warning | Mutating a `$state` prop received from parent | Use callback props or mark with `$bindable()` |
| Snippet fallback not rendering | Using `{@render children?.()}` instead of explicit `{#if}` check | Use `{#if children}{@render children()}{:else}Fallback{/if}` |
| Default object prop not reactive | Default values in `$props()` are raw objects, not `$state` proxies | Copy into `$state()` if local mutation is needed |
| `bind:this` undefined in template logic | Accessed before mount or during SSR | Guard with `$effect` or `onMount` |
| `{#each}` items lose state on reorder | Missing or unstable key (index) | Add `(item.id)` key expression |
| `stopPropagation` not working | Event delegation in Svelte 5 conflicts with direct `addEventListener` | Use `on()` from `svelte/events` instead |
| `e.preventDefault()` silently ignored | `ontouchmove`/`ontouchstart` are passive by default | Use `on()` from `svelte/events` with `{ passive: false }` |
| Stale computed value after navigation | SvelteKit reuses components, init code runs once | Use `$derived(data.items.length)` not `const count = data.items.length` |
| `<svelte:boundary>` not catching errors | Error is in event handler, setTimeout, or async code | Boundaries only catch render/effect errors; handle async errors manually |
| Scoped styles not applying to `{@html}` content | `{@html}` is invisible to Svelte's style scoping | Wrap in container and use `:global` selectors |
</troubleshooting>
