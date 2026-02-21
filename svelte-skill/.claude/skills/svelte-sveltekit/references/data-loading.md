# Data Loading & Server Interactions

Load functions, form actions, API routes, streaming, and invalidation patterns. For API signatures and type details, use the MCP Svelte documentation server.

<quick_reference>
1. Always use load functions — never `onMount`/`$effect` (no SSR, no dependency tracking)
2. Always use provided `fetch` param — never global `fetch` (no cookies, no relative URLs on server)
3. Default to `+page.server.ts` unless you need non-serializable returns or browser-direct API access
4. Prefer form actions over API routes for `<form>` mutations (progressive enhancement, auto revalidation)
5. Use `invalidate('app:resource')` over `invalidateAll()` — surgical invalidation
6. Never store user state in module-level variables — shared across SSR requests (data leaks)
7. Use `$derived(data.prop)` not `const { prop } = data` — destructuring breaks reactivity
8. Never place `redirect()`/`error()` inside `try...catch` — use `isHttpError()`/`isRedirect()` to re-throw
9. Auth guards in `hooks.server.ts` handle — not layout load (parallel execution, page runs before redirect)
10. Custom dependencies: `depends('app:resource')` pattern must match `[a-z]+:`
</quick_reference>

Decision tree for choosing a data strategy:

<server_vs_universal>
## +page.server.ts vs +page.ts

| Criterion | `+page.server.ts` (Server) | `+page.ts` (Universal) |
|-----------|---------------------------|----------------------|
| Runs where | Server only | Server (SSR) + browser (client nav) |
| Access secrets/DB/cookies/locals/platform | Yes | No |
| Return non-serializable values | No (devalue: Date, Map, Set, BigInt OK — NOT class instances/functions) | Yes (component constructors, functions) |
| Browser fetches directly | No (proxied through server) | Yes (skips server on client nav) |

**When both coexist:** server load runs first, its return passed as `data` property to universal load. Universal load's return replaces server load entirely — server return is NOT passed to the component.

### Decision flow
```
Need data before rendering?
├── Needs secrets/DB/cookies/locals/platform? → +page.server.ts
├── Public external API (browser can call directly)? → +page.ts
├── Need non-serializable return (component constructors)? → +page.ts
└── Default → +page.server.ts
```
</server_vs_universal>

Parallel loading eliminates the most common performance problem — sequential awaits:

<parallel_loading>
## Avoiding Waterfall Patterns

SvelteKit runs layout and page load functions **concurrently** by default. Waterfalls are developer-introduced:

```ts
// ❌ WATERFALL — sequential awaits on independent requests
export async function load({ fetch }) {
  const posts = await fetch('/api/posts').then(r => r.json());
  const tags = await fetch('/api/tags').then(r => r.json());
  return { posts, tags };
}

// ✅ PARALLEL — Promise.all fires both simultaneously
export async function load({ fetch }) {
  const [posts, tags] = await Promise.all([
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/tags').then(r => r.json())
  ]);
  return { posts, tags };
}
```

**`await parent()` creates waterfalls.** Start own work first, then await parent:

```ts
export async function load({ parent }) {
  const myData = getData();         // fires immediately
  const { user } = await parent();  // waits for parent
  return { items: await myData, user };
}
```

### Invalidation
- Form action with `use:enhance` → automatic `invalidateAll` (default); custom callback for selective
- After API call / WebSocket → `invalidate('app:resource')` targeted
- Unknown scope → `invalidateAll()` (last resort)

**Mental model:** Rerunning load updates `data` prop — does NOT recreate component. Use `$derived()` for reactivity, `{#key}` to force recreation.
</parallel_loading>

Streaming defers non-critical data while rendering immediately with blocking data:

<streaming>
## Streaming with Non-Awaited Promises

Return promises **without** `await` — page renders with critical data, streamed data arrives async:

```ts
// +page.server.ts
export async function load({ fetch }) {
  return {
    post: await fetch('/api/post').then(r => r.json()),       // blocks render
    comments: fetch('/api/comments').then(r => r.json())      // streams in
  };
}
```

Template **must** handle pending state:

```svelte
{#await data.comments}
  <p>Loading comments...</p>
{:then comments}
  {#each comments as c}<p>{c.text}</p>{/each}
{:catch error}
  <p>Failed: {error.message}</p>
{/await}
```

### Constraints
- **Requires JavaScript** — no-JS users see nothing for streamed data
- Cannot call `setHeaders` or `redirect` inside streamed promises (headers already sent)
- Unhandled rejections before render crash the server — attach `.catch(() => {})` to non-fetch promises
- Platforms that buffer responses (AWS Lambda) deliver all data at once — streaming still works but no progressive rendering
</streaming>

Form actions handle mutations with progressive enhancement and automatic revalidation:

<form_actions>
## Named Actions + use:enhance

```ts
// +page.server.ts
export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    if (!name) return fail(400, { name, missing: true });
    await db.createItem({ name });
    // load functions rerun automatically after successful action
  },
  delete: async ({ request }) => {
    const data = await request.formData();
    await db.deleteItem(data.get('id') as string);
  }
};
```

```svelte
<!-- Template: action="?/create" targets named action, use:enhance adds JS enhancement -->
<form method="POST" action="?/create" use:enhance>
  <input name="name" value={form?.name ?? ''} />
  {#if form?.missing}<p class="error">Name required</p>{/if}
  <button>Add</button>
</form>
```

### use:enhance behavior
- **Default** (no callback): runs `invalidateAll()` on success
- **Custom callback**: return async function for optimistic UI, use `applyAction(result)` instead of `update()` to avoid over-invalidation
- `form` prop (typed via `PageProps`) receives `fail()` return data

### Key rules
- Redirects: `redirect(303, '/path')` — 303 See Other for POST→GET
- File uploads: add `enctype="multipart/form-data"` (SvelteKit 2 throws without it)
- Prerendered pages **cannot** have form actions
</form_actions>

API routes serve programmatic endpoints, webhooks, and REST APIs:

<api_routes>
## +server.ts — When to Use

| Need | Solution |
|------|----------|
| Data for page rendering | Load function |
| Mutation from `<form>` | Form action |
| Programmatic mutation / webhook / SSE / REST API | `+server.ts` API route |

### REST pattern

```ts
// src/routes/api/items/[id]/+server.ts
import { json, error } from '@sveltejs/kit';

export async function GET({ params }) {
  const item = await db.getItem(params.id);
  if (!item) error(404, 'Not found');
  return json(item);
}

export async function PUT({ params, request }) {
  const data = await request.json();
  await db.updateItem(params.id, data);
  return new Response(null, { status: 204 });
}

// fallback() handles unsupported methods → 405
export function fallback({ request }) {
  return new Response(`${request.method} not allowed`, { status: 405 });
}
```

### Key facts
- `+layout` files have **no effect** on `+server.ts`
- Errors render JSON or `src/error.html` — not `+error.svelte`
- When `+server.ts` coexists with `+page.svelte`: `Accept: text/html` → page, otherwise → server route
- SvelteKit sets **no CORS headers** by default — handle in `hooks.server.ts`
- Vite dev server injects `Access-Control-Allow-Origin: *` automatically — production does NOT
</api_routes>

Three control-flow functions with distinct purposes:

<error_handling>
## error(), redirect(), fail()

| Function | Use in | Purpose | Status codes |
|----------|--------|---------|-------------|
| `error(code, message)` | Load, actions, API routes | Abort with HTTP error, renders `+error.svelte` | 4xx, 5xx |
| `redirect(code, location)` | Load, actions, API routes | Navigate away | 303 (POST→GET), 307, 308 |
| `fail(code, data)` | Actions only | Return validation errors to same page | 400, 422 |

### Critical: never catch SvelteKit control flow

```ts
// ❌ try/catch swallows redirect/error — they throw internally
try {
  if (!post) error(404, 'Not found');
} catch (e) {
  return { post: null };  // silently swallows the 404
}

// ✅ Re-throw SvelteKit errors
import { isHttpError, isRedirect } from '@sveltejs/kit';
try {
  if (!post) error(404, 'Not found');
} catch (e) {
  if (isHttpError(e) || isRedirect(e)) throw e;
  error(500, 'Internal error');
}
```

`fail()` does NOT throw — it returns `ActionFailure` to the page via the `form` prop. Use in actions only.
</error_handling>

Common mistakes causing silent failures or performance degradation:

<anti_patterns>
| Anti-pattern | Problem | Correct approach | Severity |
|-------------|---------|-----------------|----------|
| `onMount` fetch instead of load | No SSR, layout shift, no dependency tracking | Use `+page.server.ts` load function | CRITICAL |
| Global `fetch` in load function | No cookie forwarding, no relative URLs, no response inlining | Use `{ fetch }` from load params | CRITICAL |
| Module-level state (`let user = $state()`) | Shared across ALL users during SSR — data leaks | Return from load; use `setContext`/`getContext` | CRITICAL |
| Auth guard in layout load | Layout runs parallel with page — page may execute before redirect | Guard in `hooks.server.ts` handle | CRITICAL |
| Sequential awaits for independent data | Waterfall — each request waits for previous | `Promise.all([...])` | HIGH |
| `await parent()` before own work | Blocks on parent completion | Start own work first, await parent after | HIGH |
| Destructuring data prop | `const { item } = data` never updates after invalidation | `let item = $derived(data.item)` | HIGH |
| `try/catch` around `error()`/`redirect()` | Swallows SvelteKit control flow | Check `isHttpError()`/`isRedirect()`, re-throw | HIGH |
| `invalidateAll()` as default | Re-runs all load functions unnecessarily | `invalidate('app:resource')` targeted | MEDIUM |
| Missing `enctype` on file upload form | SvelteKit 2 throws runtime error | Add `enctype="multipart/form-data"` | MEDIUM |
</anti_patterns>

Diagnosis guide for the most frequent runtime issues:

<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| 403/CSRF on form action behind proxy | Missing `ORIGIN` env var or proxy header mismatch | Set `ORIGIN`, `PROTOCOL_HEADER`, `HOST_HEADER` env vars |
| `[object Promise]` rendered in template | SvelteKit 2 no longer auto-awaits top-level promises | Explicitly `await` blocking data in load return |
| `use:enhance` callback values undefined | SvelteKit 2 renamed `form`→`formElement`, `data`→`formData` | Update destructuring names |
| Data not updating after invalidation | Destructured data prop | Use `$derived(data.prop)` instead of `const { prop } = data` |
| Streamed data never appears (no-JS) | Streaming requires JavaScript | Provide `{#await}` fallback or `await` critical data |
| Cookie not set / same header error | `setHeaders` cannot set `set-cookie`; can't set same header from multiple loads | Use `cookies` API for cookies; set header from one load only |
| Page load runs before auth redirect | Auth guard in layout load (parallel execution) | Move guard to `hooks.server.ts` handle |
| `$env/dynamic/*` fails during prerender | Dynamic env unavailable at build time | Use `$env/static/*` for prerendered pages |
| Streaming fails on Lambda/serverless | Platform buffers responses | Streaming still works but data arrives all at once — no progressive rendering |
| Server load dependency not tracked | SvelteKit 2 removed `dangerZone.trackServerFetches` | Use `depends('app:key')` + `invalidate('app:key')` explicitly |
</troubleshooting>
