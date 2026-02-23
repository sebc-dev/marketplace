# TypeScript Patterns

TypeScript typing patterns for Svelte 5 components and SvelteKit 2 routes. For API signatures and exhaustive type lists, defer to the Svelte MCP server (`mcp__svelte__get-documentation`).

Setup checklist -- verify these before writing any TypeScript in a Svelte/SvelteKit project.
<quick_reference>
1. Extend generated tsconfig: `{ "extends": "./.svelte-kit/tsconfig.json" }` -- never override `paths` or `baseUrl`
2. Declare `App.Locals` and `App.Error` in `src/app.d.ts` -- undeclared locals silently become `any`
3. End `app.d.ts` with `export {};` -- required when file contains `import` statements
4. Use `import type` for all type-only imports -- `verbatimModuleSyntax: true` enforces this
5. Use `.svelte.ts` only for files containing runes (`$state`, `$derived`, `$effect`) -- use plain `.ts` otherwise
6. Route files (`+page.ts`, `+page.server.ts`) always use plain `.ts` -- never `.svelte.ts`
7. Run `npm run dev` once before expecting `$types` imports to resolve -- types generated on first run
8. Use `kit.alias` in `svelte.config.js` for path aliases -- not `paths` in tsconfig
9. Avoid runtime TS features (enums, decorators, `namespace`) -- Svelte does not transpile them natively
10. Run `svelte-check` in CI -- catches `.svelte` template type errors that `tsc` misses
</quick_reference>

Props interface patterns, HTML attribute intersection, and Snippet typing.
<props_typing>
**Named interface for 3+ props:**
```ts
interface Props {
  label: string;
  count?: number;
  onchange: (value: number) => void;
}
let { label, count = 0, onchange }: Props = $props();
```

**Inline annotation for trivial components:**
```ts
let { adjective }: { adjective: string } = $props();
```

**Wrapper components -- intersect with HTML attributes:**
```ts
import type { HTMLButtonAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type Props = { variant: 'primary' | 'ghost'; children: Snippet } & HTMLButtonAttributes;
let { variant, children, ...rest }: Props = $props();
```
Without `HTMLButtonAttributes`, consumers cannot pass `class`, `onclick`, `disabled`, etc.
For elements without a dedicated type: `SvelteHTMLElements['div']` from `svelte/elements`.

**Callback props replace createEventDispatcher:**
```ts
interface Props {
  onselect: (item: Item) => void;      // required
  ondelete?: (id: string) => void;     // optional
  onsubmit: (data: FormData) => Promise<void>;  // async supported
}
```

**Snippet typing -- type parameter is a TUPLE:**
```ts
import type { Snippet } from 'svelte';
interface Props {
  children: Snippet;              // no parameters
  row: Snippet<[Item]>;           // one parameter -- NOT Snippet<Item>
  cell: Snippet<[Item, number]>;  // two parameters
  footer?: Snippet;               // optional
}
```

| Wrong | Right | Why |
|-------|-------|-----|
| `header: Snippet<string>` | `header: Snippet<[string]>` | Type param must be a tuple |
| `createEventDispatcher<{ select: Item }>()` | `onselect: (item: Item) => void` | Dispatcher deprecated in Svelte 5 |
| `Record<string, unknown>` for props | Named `interface Props { ... }` | Bypasses all prop checking |
</props_typing>

Rune type inference rules -- annotate only when inference fails.
<rune_typing>
**Decision tree -- when to annotate:**
- Initial value present and type matches full range -> let inference work
- Union type or nullable -> annotate explicitly
- No initial value -> annotate explicitly
- Literal narrowing unwanted -> annotate with union

```ts
let count = $state(0);                           // inferred: number
let user = $state<User | null>(null);            // explicit: union type
let status = $state<'idle' | 'loading'>('idle'); // explicit: prevents literal narrowing
let doubled = $derived(count * 2);               // inferred: number
```

**$bindable -- type comes from Props interface, not from $bindable itself:**
```ts
// Wrong
let { value = $bindable<boolean>() }: Props = $props();
// Right
interface Props { value: boolean; }
let { value = $bindable() }: Props = $props();
```

**Shared reactive state -- .svelte.ts with getter pattern:**
```ts
// counter.svelte.ts -- uses $state, so .svelte.ts required
export function createCounter(initial: number) {
  let count = $state(initial);
  return {
    get count() { return count; },  // getter required for reactivity
    increment() { count++; }
  };
}
```
Cannot directly export a reassigned `$state` variable -- use getter/setter or object pattern.

| Wrong | Right | Why |
|-------|-------|-----|
| `let count: number = $state<number>(0)` | `let count = $state(0)` | Triple redundant annotation |
| `$state()` without value on non-class field | `$state<T>(initialValue)` | Adds `undefined` to type |
| `$state("Loading")` compared to other strings | `$state<Status>("Loading")` | Literal narrowing prevents comparison |
</rune_typing>

Global type declarations in `src/app.d.ts` -- shapes types across the entire SvelteKit app.
<app_types>
```ts
// src/app.d.ts
import type { User, Session } from '$lib/types';

declare global {
  namespace App {
    interface Error {
      message: string;        // required -- always include
      code?: string;          // e.g., 'NOT_FOUND', 'UNAUTHORIZED'
      errorId?: string;       // for error tracking
    }
    interface Locals {
      user: User | null;
      session: Session | null;
      requestId: string;
    }
    interface PageData {
      title?: string;         // shared across ALL pages
    }
    interface PageState {
      showModal?: boolean;    // for pushState()/replaceState()
    }
    interface Platform {}     // adapter-specific (Cloudflare, Vercel)
  }
}
export {};  // CRITICAL: makes this a module when imports are present
```

**Key rules:**
- `App.Locals` populated in `handle` hook -> available in all server contexts (load, actions, hooks, +server.ts)
- `App.Error` shapes `page.error` in `+error.svelte` and `handleError` return
- `App.PageData` = app-wide shared data; route `PageData` from `$types` = per-route data
- `App.PageState` types the `page.state` object from `$app/state`
- Without `export {}`, adding `import` makes the file a module and `App` namespace stops being ambient

**Cloudflare `App.Platform` pattern:**
```ts
interface Platform {
  env: {
    DB: D1Database;
    KV: KVNamespace;
  };
  context: ExecutionContext;
}
```
Access via `event.platform.env.DB` in server load/hooks. Use `import type` for Cloudflare types.
</app_types>

Generic components with the `generics` attribute on `<script>`.
<generics>
```svelte
<script lang="ts" generics="T extends { id: string }">
  import type { Snippet } from 'svelte';
  interface Props {
    items: T[];
    select: (item: T) => void;
    row: Snippet<[T]>;
  }
  let { items, select, row }: Props = $props();
</script>
```

- Content of `generics=""` is what goes between `<...>` in a generic function
- Multiple type params supported: `generics="T extends { id: string }, U = string"`
- TypeScript infers `T` from usage at the call site
- **Known limitation:** `const Typed = GenericComp<string>` (TSInstantiationExpression) not supported by Svelte compiler

**Dynamic components -- Svelte 5 components are functions, not classes:**
```ts
import type { Component } from 'svelte';
let CurrentView: Component<{ data: Item }> = $state(ListView);
// Template: <CurrentView data={item} />
```

**Svelte 4 -> 5 type migration (key entries):**

| Svelte 4 | Svelte 5 | Notes |
|----------|----------|-------|
| `SvelteComponent` | `Component` | Function type, not class |
| `ComponentProps<MyComp>` | `ComponentProps<typeof MyComp>` | `typeof` required |
| `ComponentEvents<MyComp>` | _(deprecated)_ | Use callback props |
| `new MyComp({ target })` | `mount(MyComp, { target })` | Returns exports, not instance |
| `component.$destroy()` | `unmount(component)` | `outro: true` since 5.13 |
| `$$Generic<T>` | `generics="T"` on `<script>` | Attribute syntax |
| `<slot>` / `$$Slots` | `{#snippet}` / `Snippet<[T]>` | Snippets are typed |
| `svelte.JSX` namespace | `svelte/elements` module | Named attribute types |
</generics>

Auto-generated types for `$env` modules based on `.env` file contents.
<env_types>
**Four modules -- two axes (static/dynamic, private/public):**

| Module | Server-only | Tree-shakeable | Runtime value |
|--------|-------------|----------------|---------------|
| `$env/static/private` | Yes | Yes (inlined at build) | Build-time |
| `$env/static/public` | No | Yes (inlined at build) | Build-time |
| `$env/dynamic/private` | Yes | No | Runtime |
| `$env/dynamic/public` | No | No | Runtime |

**Rules:**
- Importing `$env/static/private` or `$env/dynamic/private` in client-side code triggers a build error
- `import type` from private modules is safe -- types are erased at compile time
- Prefer static imports for tree-shaking; use dynamic only when values change at runtime
- Types auto-generated from `.env` file contents

**Server-only modules (`$lib/server`):**
- Files in `$lib/server/` or with `.server.ts` suffix are enforced server-only at build time
- SvelteKit traces the full import chain -- even indirect imports trigger errors
- `import type` from server modules is always safe
</env_types>

Load function typing with auto-generated `$types`.
<load_function_types>
**Page component (SvelteKit 2.16+):**
```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  let { data, form }: PageProps = $props();
</script>
```

**Layout component:**
```svelte
<script lang="ts">
  import type { LayoutProps } from './$types';
  let { data, children }: LayoutProps = $props();
</script>
```

**Server load + actions:**
```ts
// +page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  return { post: await db.getPost(params.slug) };  // return type inferred
};

export const actions = {
  update: async ({ request }) => {
    const data = await request.formData();
    if (!data.get('title')) return fail(400, { missing: true });
    return { success: true };
  }
} satisfies Actions;  // satisfies preserves specific return types
```

**Streaming with promises:**
```ts
export const load: PageServerLoad = async ({ params }) => {
  return {
    post: await db.getPost(params.slug),     // blocks rendering
    comments: db.getComments(params.slug)     // streams to client (un-awaited)
  };
};
```

**Key types from `$types`:** `PageLoad`, `PageServerLoad`, `LayoutLoad`, `LayoutServerLoad`, `RequestHandler`, `Actions`, `EntryGenerator`, `PageData`, `LayoutData`, `ActionData`, `PageProps`, `LayoutProps`, `RouteParams`.

**Universal vs server load:**
- `PageLoad` (from `+page.ts`) -- runs on server AND client, receives `LoadEvent`
- `PageServerLoad` (from `+page.server.ts`) -- server only, receives `ServerLoadEvent` with `cookies`, `locals`, `platform`, `request`, `clientAddress`
- Using the wrong type suppresses type errors on server-only APIs

**Hooks typing:**
```ts
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const auth: Handle = async ({ event, resolve }) => {
  event.locals.user = await verifySession(event.cookies.get('session'));
  return resolve(event);
};
export const handle = sequence(auth, guard);
```
</load_function_types>

Common mistakes that bypass type safety or cause build errors.
<anti_patterns>
| Don't | Do | Why |
|-------|-----|-----|
| `export let prop` in Svelte 5 | `let { prop }: Props = $props()` | `export let` is Svelte 4 syntax |
| `createEventDispatcher()` | Callback props on `Props` interface | Dispatcher deprecated in Svelte 5 |
| `SvelteComponent` / `SvelteComponentTyped` | `Component` from `'svelte'` | Class-based types deprecated |
| `ComponentProps<MyComp>` | `ComponentProps<typeof MyComp>` | Components are functions, need `typeof` |
| Manual `PageData` interface | `import type { PageProps } from './$types'` | Breaks auto-generated type chain |
| `throw error(400, msg)` for validation | `return fail(400, { field, error })` | `error()` triggers error page, `fail()` returns to form |
| `as any` / `@ts-ignore` on rune errors | Fix with correct type: `Component`, `typeof`, explicit generic | Masks real problems |
| `writable()` / `derived()` in new code | `$state()` / `$derived()` runes | Stores work but are not idiomatic Svelte 5 |
| Missing `App.Locals` declaration | Declare in `app.d.ts` | `event.locals` silently accepts any property |
| `let count: number = $state<number>(0)` | `let count = $state(0)` | Redundant -- let inference work |
| Skip `svelte-check` in CI | Run `svelte-check` alongside `tsc --noEmit` | Catches `.svelte` template type errors |
| Set `baseUrl` or `paths` in tsconfig | Use `kit.alias` in `svelte.config.js` | Conflicts with SvelteKit generated paths |
| Use enums/decorators in `.svelte` files | Use const objects or union types | Svelte does not transpile runtime TS features |
</anti_patterns>

Common TypeScript errors in Svelte/SvelteKit projects and their fixes.
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module './$types'` | Dev server hasn't run yet | Run `npm run dev` once to generate `.svelte-kit/types/` |
| `Cannot find module '$lib/...'` | Missing path alias or tsconfig misconfigured | Verify `{ "extends": "./.svelte-kit/tsconfig.json" }` in tsconfig |
| `Type 'T \| undefined'` on `$state()` | No initial value adds `undefined` to type | Provide initial value, or use `$state() as T` in class fields |
| `'onclick' does not exist in type` | Rest props without HTML attributes intersection | Intersect with `HTMLButtonAttributes` from `svelte/elements` |
| `must be imported using a type-only import` | `verbatimModuleSyntax` enabled | Use `import type { X }` or `import { type X }` |
| `This comparison appears to be unintentional` | `$state("value")` narrowed to literal type | Use explicit generic: `$state<UnionType>("value")` |
| `'SvelteComponent' is deprecated` | Using Svelte 4 class-based types | Switch to `Component` from `'svelte'` |
| `TypeScript language features like enums are not natively supported` | Runtime TS features in `.svelte` files | Use const objects, or add `vitePreprocess({ script: true })` |
| `Not implemented TSInstantiationExpression` | `GenericComp<string>` in template | Restructure to avoid explicit instantiation expression |
| Generated types stale after route changes | `.svelte-kit/types/` cache outdated | Delete `.svelte-kit/` directory, run dev server again |
| ESLint `prefer-const` on destructured props | Mixed bindable/non-bindable destructuring | Disable rule for `$props()` lines |
| Variable named `state` or `derived` causes errors | Name collision with rune internals | Rename -- avoid `state`, `derived` as variable names |
| `App` namespace not ambient | Missing `export {}` in `app.d.ts` with imports | Add `export {};` at end and wrap in `declare global {}` |
</troubleshooting>
