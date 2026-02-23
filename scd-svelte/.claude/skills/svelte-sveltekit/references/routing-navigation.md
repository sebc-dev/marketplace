# Routing & Navigation

Filesystem-based routing, dynamic params, layout nesting, navigation APIs, preloading, page options, and invalidation in SvelteKit 2. For full API signatures, defer to the MCP Svelte tool.

<quick_reference>
1. Routes live in `src/routes/` -- directories define URL paths, `+`-prefixed files define behavior
2. Route files: `+page.svelte`, `+page.js`, `+page.server.js`, `+layout.svelte`, `+layout.js`, `+layout.server.js`, `+server.ts`, `+error.svelte`
3. Non-`+`-prefixed files in route dirs are ignored by the router -- colocate route-specific components safely
4. Priority order: static > `[param=matcher]` > `[param]` > `[[optional]]` > `[...rest]` -- ties resolved alphabetically
5. `redirect(303, '/path')` without `throw` in SvelteKit 2 -- it throws internally
6. Use `$app/state` (not deprecated `$app/stores`) for `page`, `navigating`, `updated`
7. Svelte 5 layouts: `let { children } = $props()` + `{@render children()}` -- not `<slot />`
8. All `cookies.set()`/`cookies.delete()` require explicit `{ path: '/' }` in SvelteKit 2
9. `goto()` is client-only, cannot target external URLs -- use `window.location.href` for external
10. Page options (`ssr`, `csr`, `prerender`) cascade from layouts, children can override
11. `invalidate(() => true)` is NOT the same as `invalidateAll()` -- the latter also reruns zero-dependency loads
12. `preloadCode()` requires `base` prefix: `preloadCode(base + '/about')`
</quick_reference>

Route types -- all dynamic segments, matchers, and special patterns.

<route_types>
| Pattern | Syntax | Example Path | Notes |
|---------|--------|-------------|-------|
| Static | `src/routes/about/` | `/about` | Highest priority |
| Required param | `[param]` | `/blog/[slug]/` -> `/blog/hello` | Must match exactly one segment |
| Validated param | `[param=matcher]` | `/posts/[id=integer]/` | Rejects invalid -> tries next route -> 404 |
| Optional param | `[[param]]` | `/[[lang]]/about/` -> `/about` or `/fr/about` | Primary use: i18n default language |
| Rest/catch-all | `[...rest]` | `/docs/[...path]/` -> `/docs/a/b/c` | Lowest priority, value can be empty string |
| Mixed static+dynamic | `[lang]-[region]` | `/en-US` | All params required |

**Custom param matchers:**

```ts
// src/params/integer.ts
import type { ParamMatcher } from '@sveltejs/kit';
export const match: ParamMatcher = (param) => /^\d+$/.test(param);
```

Usage: `src/routes/posts/[id=integer]/+page.svelte`. Matchers run on both server and client. They cannot access other params or transform values. If matcher rejects, SvelteKit tries remaining routes by priority order.

**Overlapping dynamic routes** (`[id]` and `[slug]` at same level) cause ambiguous matching -- use param matchers to disambiguate.
</route_types>

Layout nesting, route groups for isolation, and layout resets.

<layout_patterns>
**Decision matrix:**

| Scenario | Approach |
|----------|----------|
| Shared chrome across all pages (nav/footer) | Root `+layout.svelte` |
| Section-specific shell (dashboard sidebar) | Nested `+layout.svelte` in that directory |
| Unrelated sections needing different layouts | Route groups: `(app)/`, `(marketing)/` |
| Single page needs a different layout | `+page@segment.svelte` layout reset |
| Login/embed page with no layout at all | `+page@.svelte` (reset to root) |
| Only 1-2 outlier pages | Composition with `$lib` components, not new groups |

**Canonical route groups example:**

```
src/routes/
├── (marketing)/          # public layout: nav + footer
│   ├── +layout.svelte
│   ├── +page.svelte      # homepage at /
│   ├── pricing/
│   └── about/
├── (app)/                # app layout: sidebar + header
│   ├── +layout.svelte
│   ├── +layout.server.ts # loads user data for all app pages
│   ├── dashboard/
│   └── settings/
│       ├── +layout.svelte # nested settings subnav
│       ├── profile/
│       └── billing/
├── login/
│   └── +page@.svelte     # resets to root layout (no nav/sidebar)
└── +layout.svelte         # minimal root: just {@render children()}
```

**Key rules:**
- Route groups `(name)` provide layout isolation without affecting URLs
- Layout data merges downward -- same-key conflicts: page overrides layout (last writer wins)
- Error in `+layout.server.js` renders the error boundary ABOVE that layout, not beside it
- Root layout errors fall through to `src/error.html` static fallback
</layout_patterns>

Programmatic navigation, shallow routing, lifecycle hooks, and snapshots.

<navigation>
**`goto()` rules:**
- Client-only -- crashes in SSR. Use `redirect()` on server, `onMount`/event handler on client
- Cannot target external URLs in SvelteKit 2 (throws error). Use `window.location.href`
- Does NOT restore scroll position (unlike `history.back()` which triggers `popstate`)

**Shallow routing -- modal with data preloading:**

```svelte
<script>
  import { preloadData, pushState, goto } from '$app/navigation';
  import { page } from '$app/state';
  import Modal from './Modal.svelte';
  import ItemPage from './[id]/+page.svelte';
  let { data } = $props();
</script>

{#each data.items as item}
  <a
    href="/items/{item.id}"
    onclick={async (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const result = await preloadData(e.currentTarget.href);
      if (result.type === 'loaded' && result.status === 200) {
        pushState(e.currentTarget.href, { selected: result.data });
      } else {
        goto(e.currentTarget.href);
      }
    }}
  >{item.name}</a>
{/each}

{#if page.state.selected}
  <Modal onclose={() => history.back()}>
    <ItemPage data={page.state.selected} />
  </Modal>
{/if}
```

Type safety -- declare `App.PageState` in `src/app.d.ts`:
```ts
declare namespace App {
  interface PageState { selected?: Record<string, any>; }
}
```

**Limitations:** `page.state` is always `{}` during SSR, lost on page reload, JS-only. The `<a href>` ensures progressive enhancement.

**Navigation lifecycle hooks** (execution order):

`beforeNavigate` -> data loading -> `onNavigate` -> DOM update -> `afterNavigate`

| Hook | Fires on | Use case |
|------|----------|----------|
| `beforeNavigate` | Client navigations + page unload (`willUnload`) | Unsaved changes guard, force reload on app update |
| `onNavigate` | Client navigations only (NOT full-page) | View Transitions API integration |
| `afterNavigate` | After DOM update (skip `type === 'enter'` for initial) | Analytics tracking |

All hooks must be called during component initialization.

**Snapshots** -- preserve form state across navigation:

```svelte
<script lang="ts">
  import type { Snapshot } from './$types';
  let comment = $state('');
  export const snapshot: Snapshot<{ comment: string }> = {
    capture: () => ({ comment }),
    restore: (val) => { comment = val.comment; }
  };
</script>
```

Use for: form drafts, accordion/tab state. NOT for: data that belongs in URL (filters, pagination). Must be JSON-serializable + reasonably small (stored in `sessionStorage`).
</navigation>

Preloading strategies for links and programmatic warming.

<preloading>
| Scenario | Attribute / API | Why |
|----------|----------------|-----|
| Most navigation links (default) | `data-sveltekit-preload-data="hover"` on `<body>` | Saves ~200ms, feels instant |
| Rapidly-changing data, many links | `data-sveltekit-preload-data="tap"` per link | Reduces false-positive fetches |
| Heavy JS pages users might visit | `data-sveltekit-preload-code="viewport"` | Loads code as links scroll into view |
| Don't preload specific expensive links | `data-sveltekit-preload-data="false"` | Prevents unwanted data fetching |
| Programmatic preload during idle | `preloadCode(base + '/path')` / `preloadData(base + '/path')` | Warm cache for likely targets |

**Gotchas:**
- `viewport` and `eager` only apply to links in DOM immediately after navigation -- dynamically rendered links (inside `{#if}`) fall back to `hover`/`tap`
- Preloading auto-disabled when `navigator.connection.saveData` is `true`
- `preloadCode()` requires `base` prefix from `$app/paths` (SvelteKit 2 change)
</preloading>

Per-route rendering strategy: prerender, ssr, csr combinations.

<page_options>
Options export from `+page.js` / `+layout.js` and cascade from layouts (children override).

| Strategy | Options | Result | Use When |
|----------|---------|--------|----------|
| Default SSR + CSR | `ssr: true` (default) | Server-rendered, hydrated | Most pages |
| Static prerender | `prerender = true` | Built at build time, no server | Blog posts, marketing pages |
| Zero-JS static | `csr = false; prerender = true` | Static HTML, no JS shipped | Documentation, legal pages |
| SPA (client-only) | `ssr = false` | Empty HTML shell, client render | Authenticated dashboards |
| Prerender with fallback | `prerender = 'auto'` | Prerender + keep in SSR manifest | Pages that might have dynamic variants |

**Key rules:**
- `ssr: false` in a layout makes ALL child routes SPA-like
- `csr: false` means full-page navigations only (no client-side routing)
- `trailingSlash` default is `'never'` -- `'ignore'` harms SEO, avoid it
- `+server.ts` files support `prerender` and `trailingSlash` but NOT `ssr`/`csr`

**i18n routing with reroute hook:**

```ts
// src/hooks.ts -- runs on both server and client
import type { Reroute } from '@sveltejs/kit';
const translations: Record<string, string> = {
  '/fr/a-propos': '/fr/about',
};
export const reroute: Reroute = ({ url }) => {
  if (url.pathname in translations) return translations[url.pathname];
};
```

Remaps localized URLs to canonical routes without changing browser URL. Runs before `handle`. Since v2.18 can be `async` with `fetch` argument.
</page_options>

Surgical vs global data revalidation.

<invalidation>
| Situation | Use | Why |
|-----------|-----|-----|
| Updated a specific resource | `invalidate('/api/posts')` or `invalidate('custom:key')` | Surgical -- only reruns dependent load functions |
| After form submission / global state change | `invalidateAll()` | Nuclear -- reruns ALL loads including zero-dependency ones |
| Navigation + revalidation | `goto('/path', { invalidateAll: true })` | Combines navigation with data refresh |
| Predicate-based | `invalidate((url) => url.pathname.startsWith('/api'))` | Flexible URL matching |

**Critical distinction:** `invalidate(() => true)` != `invalidateAll()`. The latter also reruns load functions with zero dependencies.

**Custom dependency tracking:**
```ts
// In load function
export async function load({ depends }) {
  depends('custom:posts');  // register custom dependency
  return { posts: await getPosts() };
}
// In component -- trigger rerun
invalidate('custom:posts');
```

**Automatic tracking:** SvelteKit tracks dependencies via `fetch()` calls and param access in load functions. If a load reads `url.pathname`, it reruns on every navigation. Use `untrack()` to opt out of unwanted dependencies.

**SvelteKit 2 change:** Top-level promises in load functions are streamed by default (no longer auto-awaited). Explicitly `await` or use `Promise.all` for blocking data.
</invalidation>

Common mistakes with routing and navigation.

<anti_patterns>
| Don't | Do | Why |
|-------|-----|-----|
| Auth checks only in `+layout.server.ts` | Use `hooks.server.ts` `handle` function | Layout loads run in parallel with page loads -- page data may fetch before auth fails. Layouts may not rerun during client-side nav |
| `goto('https://external.com')` | `window.location.href = 'https://external.com'` | SvelteKit 2 throws -- removed for XSS/open-redirect prevention |
| `goto()` / `invalidateAll()` during SSR | `redirect(303, '/path')` on server; `onMount(() => goto(...))` on client | Server-side `goto` throws "Cannot call goto on the server" |
| Catch `redirect()`/`error()` in try/catch | Use `isRedirect(e)` / `isHttpError(e)` to rethrow | SvelteKit 2 throws internally -- try/catch silently swallows redirects |
| `await parent()` at top of load function | Start independent fetches BEFORE `await parent()` | Creates waterfall -- blocks until all parent loads complete |
| `window`/`document` at component top level | Guard with `onMount` or `import { browser } from '$app/environment'` | Crashes during SSR: "document is not defined" |
| Deep layout nesting without purpose | Flatten hierarchy, use composition | Each level adds load waterfall, rendering boundary, and error boundary |
| `throw redirect(303, '/path')` | `redirect(303, '/path')` (no throw) | SvelteKit 2 throws internally -- explicit throw causes double-throw |
| Route groups just for organization | Plain directories for organization, groups only for layout isolation | Groups add complexity without benefit if layouts are identical |
</anti_patterns>

Common routing failures and their fixes.

<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| 404 on dynamic routes in production | Overlapping `[id]` and `[slug]` at same level | Use param matchers to disambiguate: `[id=integer]` |
| Prerender error on dynamic route | Missing `entries` for routes the crawler cannot discover | Add `export const entries` or link to pages from discoverable routes |
| Layout auth bypassed on client nav | Layout loads may not rerun during client-side navigation | Move auth to `hooks.server.ts` `handle` (runs before ALL loads) |
| `page.state` empty after reload | Shallow routing state is lost on hard reload / SSR | Design fallback: check `page.state.x` before rendering modal |
| "Cannot call goto on the server" | `goto()` called in server load or top-level script | Use `redirect()` in server context, `onMount` on client |
| Redirect silently swallowed | `redirect()` caught by surrounding try/catch | Add `if (isRedirect(e)) throw e` in catch block |
| Load function reruns unexpectedly | Auto-dependency tracking on `url.pathname` or params | Use `untrack()` to opt out of specific dependencies |
| `beforeNavigate` not firing on first load | Hook only fires on subsequent client-side navigations | Use `hooks.server.ts` for first-request protection |
| Error renders in wrong boundary | Layout errors render in the boundary ABOVE the layout | Account for this in error boundary placement; root errors -> `src/error.html` |
| Streamed data missing on page | SvelteKit 2: top-level promises no longer auto-awaited | Add explicit `await` or `Promise.all` in load function |
| Snapshots failing silently | Data contains functions, class instances, or circular refs | Ensure snapshot data is JSON-serializable |
| Dynamic preload attributes not working | `viewport`/`eager` only applies to links in DOM after navigation | Dynamically rendered links fall back to `hover`/`tap` |
</troubleshooting>
