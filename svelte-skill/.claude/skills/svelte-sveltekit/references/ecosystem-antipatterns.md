# Ecosystem & Anti-patterns

Library selection, integration patterns, and corrective guardrails for Svelte 5 + SvelteKit 2. API signatures and syntax details are handled by the MCP Svelte tool -- this file covers decision-making, pitfalls, and migration rules.

<quick_reference>
## Compatibility snapshot (Feb 2026)

| Category | Default pick | Svelte 5 | Status |
|----------|-------------|----------|--------|
| UI (Tailwind) | shadcn-svelte (Bits UI) | Native | Active |
| UI (Design system) | Skeleton v3 | Native | Active |
| Headless primitives | Bits UI v2 | Native | Active |
| Forms | Superforms v2 + Formsnap v2 | Compat (stores) | Active |
| Auth (full) | Better Auth v1.4+ | Confirmed | Very active |
| Auth (DIY) | Lucia patterns + Arctic v3 | N/A (guide) | Active |
| ORM | Drizzle (`sv add drizzle`) | First-class | Very active |
| Data fetch | Load functions + TanStack Query v6 | Native runes | Active |
| i18n | Paraglide JS v2 (`sv add paraglide`) | Native | Active |
| Toasts | svelte-sonner v1 | Native | Active |
| Utilities | Runed | Native | Active |

**Top anti-patterns (by severity):**
- AP-01 CRITICAL: `$effect` for derived state -- use `$derived` instead
- AP-04 CRITICAL: Module-level `$state` leaks across SSR requests
- AP-11 CRITICAL: `{@html}` without sanitization = XSS
- AP-03 HIGH: `onMount` fetch in SvelteKit pages -- use `load` functions
- AP-05 HIGH: `$effect` does not run during SSR -- derived values will be undefined
- AP-16 HIGH: Bare `window`/`document` at top-level crashes SSR

**Dead libraries (never use):** Melt UI, svelte-french-toast, svelte-headless-table, @auth/sveltekit (new projects), svelte-motion (micha-lmxt), Svelte DevTools extension, create-svelte, svelte-navigator/svelte-routing
</quick_reference>

Library selection and integration patterns for UI frameworks.

<ui_components>
## Decision tree

```
Need UI components?
+-- Tailwind project? --> shadcn-svelte (copy-paste, owns code in $lib/components/ui)
+-- Full design system (themes, tokens)? --> Skeleton v3 (Tailwind v4 required)
+-- Rapid prototype (60+ pre-styled)? --> Flowbite Svelte
+-- Headless only (bring your CSS)? --> Bits UI v2 standalone
+-- Cross-framework shared? --> Skeleton v3 or Zag.js
```

**shadcn-svelte** -- Components copied into project, you own the code. Uses Bits UI + CSS custom properties for theming + `tailwindcss-animate`. Dark mode via `.dark` class.

**Skeleton v3** -- Requires Tailwind v4. Packages: `@skeletonlabs/skeleton` (core) + `@skeletonlabs/skeleton-svelte` (components). v2 to v3 is a full rewrite (themes incompatible).

**Bits UI v2** (v2.15+) -- Compound API (`Dialog.Root`, `Dialog.Content`). WAI-ARIA, keyboard nav, focus management. Style via `class` prop + data attributes. Compose with snippets. `$bindable` for two-way binding.

```svelte
<script>
  import { Dialog } from 'bits-ui';
</script>
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50" />
    <Dialog.Content class="fixed ...">
      {#snippet children()}<Dialog.Title>Title</Dialog.Title>{/snippet}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

| Don't | Do | Why |
|-------|-----|-----|
| Mix shadcn-svelte + Skeleton | Pick one UI system per project | CSS variable schemas and Tailwind plugins conflict |
| Use Melt UI for new projects | Use Bits UI v2 | Melt UI is maintenance mode (same author) |
| Use Zag.js for Svelte-only | Use Bits UI | Zag.js is more verbose, meant for cross-framework |
</ui_components>

Form handling with progressive enhancement and server validation.

<forms_validation>
Superforms is THE standard for SvelteKit forms. Formsnap adds WCAG accessibility. Still uses store API (`$formData`) -- no runes API yet (issue #577).

**Pattern:** Server: `superValidate(zod(schema))` in load + actions with `fail(400, { form })`. Client: `superForm(data.form, { validators: zodClient(schema) })`, destructure `{ form: formData, enhance }`, use `<form method="POST" use:enhance>`. Formsnap wraps fields: `<Field>` > `<Control>` > `{#snippet children({ props })}` > `<Label>` + `<input {...props} bind:value={$formData.x}>` > `<FieldErrors />`.

**Adapters:** Zod (+ Zod 4 via `zod4`/`zod4Client`), Valibot, ArkType, TypeBox, VineJS, 7+ others.

| Don't | Do | Why |
|-------|-----|-----|
| Build forms with raw `$state` | Use Superforms | Lose progressive enhancement, CSRF, server validation |
| Validate client-side only | Always validate server-side | Client validation is bypassable |
| Use `invalidateAll` after submit | `applyAction: 'never'` or `invalidateAll: 'pessimistic'` | Overwrites form state |
</forms_validation>

Authentication patterns and security hooks.

<auth_libraries>
- **Better Auth** (v1.4+): Full-featured (email/password, OAuth, 2FA, orgs). Absorbed Auth.js (Sept 2025).
- **Lucia patterns** + **Arctic** (v3.7): DIY ~100 lines, full control. `sv add lucia` scaffolds code. Lucia is a guide, not a package.
- **Auth.js (@auth/sveltekit)**: Maintenance mode -- migrate to Better Auth.

**Core pattern (hooks.server.ts):** Validate session on EVERY request. Better Auth: `auth.api.getSession({ headers: event.request.headers })` then manually set `event.locals.user`/`event.locals.session`, protect routes with redirect, return `svelteKitHandler({ event, resolve, auth, building })`. Lucia: custom `validateSession(event.cookies.get("session"))` with same locals pattern. Client: `createAuthClient` from `better-auth/svelte`.

| Don't | Do | Why |
|-------|-----|-----|
| Store tokens in localStorage | httpOnly cookies | XSS vulnerable |
| Auth client-side only | Always validate server-side | Bypassable |
| JWT without server sessions | Session ID cookie + server sessions | JWTs not revocable |
| Protect in `+layout.server.ts` only | Also protect in `+page.server.ts` | Layout load skips on some navigations (SK #6315) |
| `bcrypt` in serverless | `@oslojs/crypto` or `argon2` | Too slow for serverless |
| Expect `svelteKitHandler` auto-populates locals | Set `event.locals` manually | It does not auto-populate |
</auth_libraries>

ORM selection and server-side data access.

<database>
**Drizzle** (`sv add drizzle`): ~7.4kb, zero deps, edge-native via HTTP drivers. Schema in `src/lib/server/schema.ts`, client in `$lib/server/db.ts`.

**Prisma v7**: Good for non-SQL devs. Bug: run `npx svelte-kit sync` before `prisma generate` (issue #28709).

| Constraint | Node | CF Workers | Vercel Edge | Vercel Serverless |
|-----------|------|------------|-------------|-------------------|
| TCP (Postgres) | Yes | No | No | Yes |
| HTTP DB drivers | Yes | Yes | Yes | Yes |
| Drizzle | Yes | Yes | Yes | Yes |
| Prisma | Yes | Via Accelerate | Via Accelerate | Yes |

| Don't | Do | Why |
|-------|-----|-----|
| Query DB in `.svelte` components | `+page.server.ts`, `+server.ts`, `$lib/server/` | DB = server-only |
| Import ORM client-side | Place in `$lib/server/` | Prevents client imports |
| TCP drivers in serverless/edge | HTTP drivers (Neon, Turso, PlanetScale) | No TCP in Workers/Edge |
</database>

Internationalization setup and strategy.

<i18n>
**Paraglide JS v2** (`sv add paraglide`): compiled i18n, only used messages ship. Strategies: `url`, `cookie`, `domain`, `baseLocale`. Messages auto-imported in v2. Routes via `localizeHref()` / `deLocalizeUrl()`. Setup: `paraglideVitePlugin` in `vite.config.js` with `project`, `outdir`, `strategy` options.

**Pitfalls:** Prerendering needs invisible anchors per locale in `+layout.svelte`. Edge: `disableAsyncLocalStorage: true` only safe in serverless. Load functions not invalidated on lang change (#438) -- add `invalidateAll()`. Alternative: `svelte-i18n` (runtime ICU, needs `--force` for Svelte 5).
</i18n>

Client-side data fetching beyond load functions.

<data_fetching>
Load functions cover ~80% of needs. Add **TanStack Svelte Query v6** (peer `svelte >= 5.25.0`) only for: caching across navigations, background refetch/polling, optimistic mutations, infinite scroll, offline support.

**Key rule:** Pass options as thunk `(() => options)` for Svelte 5 reactivity.

**Don't use for:** Server-loaded data that rarely changes -- `load()` + `invalidate()` suffices.

**Real-time:** Native WebSocket not yet merged (PR #12973). Use `sveltekit-sse` (server-to-client) or Socket.io (bidirectional).
</data_fetching>

Core anti-patterns that break Svelte 5 / SvelteKit 2 code generation.

<critical_antipatterns>
## Anti-pattern table

| ID | Name | Sev | Wrong | Right |
|----|------|-----|-------|-------|
| AP-01 | `$effect` for derived state | Crit | `$effect(() => { d = c * 2 })` | `let d = $derived(c * 2)` |
| AP-02 | New stores in new code | High | `writable(0)` | `$state(0)` in `.svelte.ts` |
| AP-03 | `onMount` fetch in SK | High | `onMount(async () => { data = await fetch(...) })` | `+page.server.ts` load |
| AP-04 | Module `$state` in SSR | Crit | `$state(null)` in `lib/x.svelte.ts` | `setContext()` in layout |
| AP-05 | `$effect` for SSR values | High | Init via `$effect` | Use `$derived` |
| AP-06 | Runes in `.ts` files | High | `$state()` in `file.ts` | Rename to `.svelte.ts` |
| AP-07 | Destructure reactive state | High | `const { count } = counter()` | `counter().count` via getter |
| AP-08 | Mutate `$state.raw` | Med | `raw.push(item)` | `raw = [...raw, item]` |
| AP-09 | `$bindable` overuse | Med | `$bindable()` on every prop | Callback props; bind form-like only |
| AP-10 | `SvelteComponent` type | Med | `SvelteComponent`, `ComponentType` | `Component<Props>` |
| AP-11 | `{@html}` unsanitized | Crit | `{@html userInput}` | `{@html DOMPurify.sanitize(input)}` |
| AP-12 | `{#each}` no key | Med+ | `{#each items as item}` | `{#each items as item (item.id)}` |
| AP-13 | `on:click` legacy | Med | `on:click\|preventDefault` | `onclick`, call `e.preventDefault()` |

## Decision tree: $derived vs $effect

```
Computing a value from reactive state?
+-- YES --> $derived(expr) or $derived.by(() => { return val; })
+-- NO --> Side effect?
    +-- NO --> Plain variable or event handler
    +-- YES --> Can go in event handler?
        +-- YES --> Event handler (ALWAYS preferred)
        +-- NO --> Before DOM update? --> $effect.pre
                   Otherwise --> $effect (with cleanup return)
```

## Priority rules

1. `$derived` > `$effect` -- always, unless genuine side effect
2. Event handler > `$effect` -- user-triggered actions belong in handlers
3. `load` function > `onMount` fetch -- always in SvelteKit
4. Context API > module-level state -- always in SSR for per-request data
5. Callback props > `$bindable` -- one-way flow; bind form-like values only
6. Snippets > slots -- always in new code
7. `onMount` return > `onDestroy` -- avoids SSR execution

## SSR execution

| API | Server | Client |
|-----|--------|--------|
| `$derived` | Yes | Yes |
| `$effect` / `$effect.pre` | No | Yes |
| `onMount` | No | Yes |
| `onDestroy` | **Yes** | Yes |
| `use:` actions | No | Yes |
</critical_antipatterns>

Svelte 4 to 5 migration patterns and strategy.

<migration_rules>
**Strategy:** Bottom-up (leaf components first). Use `sv migrate svelte-5` or VS Code "Migrate Component to Svelte 5 Syntax".

## Key syntax changes

| Svelte 3/4 | Svelte 5 | Gotcha |
|-----------|----------|--------|
| `let x = 0` (implicit) | `let x = $state(0)` | Explicit reactivity |
| `$: d = x * 2` | `let d = $derived(x * 2)` | Not `$effect` |
| `export let foo` | `let { foo } = $props()` | Single `$props()` call |
| `on:click={fn}` | `onclick={fn}` | No modifiers |
| `createEventDispatcher` | Callback props | No `CustomEvent` wrapper |
| `<slot />` | `{@render children?.()}` | `children` reserved |
| `<slot name="x" />` | `{@render x?.()}` | Snippets are props |
| `<svelte:component this={X}>` | `<X />` | Dynamic by default |
| `new Component({ target })` | `mount(Component, { target })` | Not classes anymore |
| `writable(0)` | `$state(0)` in `.svelte.ts` | Must be `.svelte.ts` |

## Store interop bridge

```typescript
import { fromStore, toStore } from 'svelte/store';
const runeCompat = fromStore(legacyStore);    // Access via .current
const storeCompat = toStore(() => val, (v) => { val = v });
```

- `$store` auto-subscription works in `.svelte` files (both modes)
- Runes inside `derived()` stores do NOT trigger updates. Stores inside `$derived` DO work
- Shared state: `.svelte.ts` with `$state` (export object or getter/setter, not bare `let`)

## Library readiness red flags
- Uses `createEventDispatcher` or `$$props`/`$$restProps`
- Requires `<svelte:component this={X}>` or `new Component()`
- Last release before October 2024 or peer dep lacks `svelte: "^5"`
</migration_rules>

Common issues, causes, and fixes when integrating ecosystem libraries.

<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `$effect(() => { x = f(y) })` | AP-01: derived via effect | `let x = $derived(f(y))` |
| `onMount` fetch in `+page.svelte` | AP-03: bypasses SSR | Move to `load` function |
| `$state(` in `.ts` not `.svelte.ts` | AP-06: won't compile | Rename to `.svelte.ts` |
| `.push()` in `$effect` infinite loop | AP-01: reads+writes proxy | Restructure or `untrack` |
| `window`/`document` at top-level | AP-16: SSR crash | Guard: `onMount`, `$effect`, `browser` |
| `===` on `$state` proxy vs object | AP-18: identity mismatch | `$state.snapshot()` |
| prettier 3.7.0 breaks Svelte | Plugin incompatibility | Update plugin or pin prettier 3.6.2 |
| `.eslintrc` not working | v3 = flat config only | Use `eslint.config.js` (ESLint 9+) |
| Prisma generate fails before build | Needs svelte-kit sync first | `npx svelte-kit sync` then generate |
| Paraglide load stale after lang switch | Known issue #438 | Add `invalidateAll()` manually |
| `svelteKitHandler` no locals | Better Auth design | Set `event.locals` manually |
| Edge DB connection fails | No TCP in Workers/Edge | Use HTTP drivers |

## Deprecated replacements

| Deprecated | Use instead |
|-----------|-------------|
| `create-svelte` | `npx sv create` |
| Melt UI | Bits UI v2 |
| `@auth/sveltekit` | Better Auth or Lucia patterns |
| `svelte-french-toast` | `svelte-sonner` |
| `svelte-headless-table` | `@tanstack/table-core` + adapter |
| `lucide-svelte` | `@lucide/svelte` |
| `svelte-chartjs` | `svelte5-chartjs` or direct Chart.js |
| `SvelteComponent` type | `Component` from `'svelte'` |
| `writable()` new code | `$state` in `.svelte.ts` |
| Svelte DevTools ext | `$inspect()` (dev only) |
</troubleshooting>
