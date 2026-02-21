# Hooks, Errors & Security

SvelteKit hooks lifecycle, error boundary architecture, auth patterns, CSRF/CSP, and env strategy. API signatures deferred to MCP Svelte -- this covers decision patterns, correct ordering, and critical pitfalls only.

Execution order, locals typing, and essential rules.
<quick_reference>
1. Request cycle: `reroute` -> `handle` (pre-resolve) -> load functions -> render -> `handle` (post-resolve) -> response
2. Form actions cycle: `handle` -> action -> re-invalidation loads -> render -> response
3. Static assets and prerendered pages NEVER pass through hooks
4. `event.locals` accessible in: server load, form actions, `+server.ts`, downstream hooks -- NEVER in universal load (`+page.ts`)
5. Type `App.Locals` in `src/app.d.ts` -- top-level `import` breaks global namespace, use inline `import('$lib/types').User`
6. Type `App.Error` for sanitized error shape returned to client
7. `sequence()` pre-processing runs in order (1->N), post-processing in reverse (N->1)
8. `resolve(event)` MUST be called in every handle branch (unless returning an early Response)
9. `error()` and `redirect()` do NOT use `throw` in SvelteKit 2 -- they throw internally (return type: `never`)
10. `cookies.set()` requires explicit `path` in SvelteKit 2 -- omission is a TypeError
11. `$env/dynamic/*` forbidden during prerendering -- use `$env/static/*`
12. Never store mutable state in module scope in hooks when deploying serverless
</quick_reference>

Server-side hooks: handle, handleFetch, handleError, init, and composition via sequence().
<server_hooks>
Canonical handle hook with pre/post processing and sequence composition:
```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

const auth: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get('session');
  event.locals.user = session ? await validateSession(session) : null;
  const response = await resolve(event);
  response.headers.set('x-request-id', event.locals.requestId);
  return response;
};
export const handle = sequence(auth, /* other hooks */);
```

Recommended sequence order (one responsibility per hook):
```ts
export const handle = sequence(
  handleSentry,          // 1. Monitoring (wraps everything)
  handleAuth,            // 2. Session resolution
  handleAuthorization,   // 3. Route protection (depends on 2)
  handleRateLimit,       // 4. Rate limiting
  handleSecurityHeaders, // 5. Security headers
  handleI18n,            // 6. Locale + transformPageChunk
  handleLogger           // 7. Logging (timing in post-processing)
);
```
`transformPageChunk` applies in REVERSE order. `preload` and `filterSerializedResponseHeaders` use the FIRST hook that defines them.

Waterfall fix -- `sequence()` is sequential, use parallel for independent ops:
```ts
// Wrong: sequential waterfall
export const handle = sequence(handleAuth, handleTenant, handleFlags);
// Right: parallel for independent operations [COMMUNITY]
export const handle = sequence(
  handleSentry,
  parallel(resolveAuth, resolveTenant, resolveFlags), // Promise.all inside
  handleAuthorization, // depends on results above via locals
);
```

handleFetch -- intercepts `event.fetch` server-side:
```ts
export const handleFetch: HandleFetch = async ({ request, fetch, event }) => {
  if (request.url.startsWith('https://api.myapp.com/'))
    request = new Request(request.url.replace('https://api.myapp.com/', 'http://internal-api:3000/'), request);
  if (request.url.startsWith('https://api.my-domain.com/'))
    request.headers.set('cookie', event.request.headers.get('cookie') ?? '');
  return fetch(request);
};
```
Cookies forwarded automatically for same-origin/app subdomains, but NOT sibling subdomains (`www.` to `api.`).

init hook (since 2.10) -- one-shot, runs before first request:
```ts
export const init: ServerInit = async () => { await db.connect(); };
```
Client-side `init` in `hooks.client.ts` DELAYS hydration -- keep minimal.
</server_hooks>

Hooks-first auth, session resolution, route protection.
<auth_patterns>
```ts
// src/hooks.server.ts -- auth MUST live in hooks, not layout load
const handleAuth: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get('session');
  event.locals.user = session ? await validateSession(session) : null;
  return resolve(event);
};
const handleAuthorization: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith('/app/') && !event.locals.user)
    redirect(303, '/login'); // no throw in SK2
  return resolve(event);
};
export const handle = sequence(handleAuth, handleAuthorization);
```

Expose locals to pages (the ONLY correct way):
```ts
// src/routes/+layout.server.ts
export const load = ({ locals }) => ({ user: locals.user });
```

In try-catch, re-throw SvelteKit errors:
```ts
try {
  await riskyOperation();
  redirect(303, '/success');
} catch (e) {
  if (isHttpError(e) || isRedirect(e)) throw e;
}
```
</auth_patterns>

What belongs in `event.locals` and `App.Locals` typing.
<locals_typing>
- PUT: session data, request ID, locale, tenant info, feature flags -- lightweight, once per request
- DO NOT PUT: DB connections, HTTP clients, large objects -- use `init` hook or module singletons

```ts
// src/app.d.ts -- CRITICAL: no top-level imports
declare global {
  namespace App {
    interface Locals {
      user: import('$lib/types').User | null; // inline import() syntax
      requestId: string;
    }
    interface Error { message: string; errorId: string; }
    interface Platform {} // Cloudflare: { env: { KV: KVNamespace } }
  }
}
export {};

// Wrong: top-level import breaks App namespace
import type { User } from '$lib/types';
// Right: inline import preserves global declaration
interface Locals { user: import('$lib/types').User | null }
```
</locals_typing>

Error boundaries, handleError, fail() for forms, svelte:boundary.
<error_handling>
| | Expected errors | Unexpected errors |
|---|---|---|
| Creation | `error(404, 'Not found')` | Any other thrown exception |
| Message exposed | Yes (provided message) | No (`"Internal Error"`) |
| `handleError` invoked | No | Yes |
| Default status | Specified (400-599) | 500 |

Three-level boundary hierarchy (most specific to fallback):
1. `<svelte:boundary>` -- Svelte 5, client render errors only, in-place reset
2. `+error.svelte` -- per route/layout, load + render errors, walks up to nearest parent
3. `src/error.html` -- static last-resort (root layout crash or handle error)

Walk-up rule: layout error uses `+error.svelte` ABOVE that layout, not beside it.

```svelte
<svelte:boundary>
  <ThirdPartyWidget />
  {#snippet failed(error, reset)}
    <p>Widget unavailable</p>
    <button onclick={reset}>Retry</button>
  {/snippet}
</svelte:boundary>
```
`<svelte:boundary>` does NOT capture: event handlers, setTimeout, async code outside render cycle.

```ts
// src/hooks.server.ts -- handleError must NEVER throw
export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  const errorId = crypto.randomUUID();
  console.error(`[${errorId}]`, error);
  Sentry.captureException(error, { extra: { errorId, url: event.url.href, status } });
  return { message: 'An unexpected error occurred', errorId }; // matches App.Error
};
```

fail() for form validation -- stays on page, populates `form` prop:
```ts
export const actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Not authenticated' });
    const data = await request.formData();
    if (!data.get('title')) return fail(400, { title: '', missing: true });
    await db.createPost({ title: data.get('title'), authorId: locals.user.id });
    redirect(303, '/posts');
  }
};
```
`fail()` -> ActionFailure, stays on page. `error()` -> renders `+error.svelte`. Never use `error()` for form validation.
</error_handling>

URL rewriting without redirect via universal `reroute` hook.
<reroute>
```ts
// src/hooks.ts -- runs BEFORE handle, does not change visible URL or event.url
import type { Reroute } from '@sveltejs/kit';
const translations: Record<string, string> = {
  '/fr/a-propos': '/fr/about',
  '/de/ueber-uns': '/de/about',
};
export const reroute: Reroute = ({ url }) => translations[url.pathname]; // undefined = no rewrite
```
Since 2.18: can be async with `fetch` (results cached client-side). Must be fast (delays navigation), pure, idempotent. During async reroute, `handleFetch` has no `params`/`route.id`. Use for: i18n, A/B testing, legacy redirects.
</reroute>

Client-side handleError in `src/hooks.client.ts`.
<client_hooks>
```ts
export const handleError: HandleClientError = async ({ error, status, message }) => {
  const errorId = crypto.randomUUID();
  Sentry.captureException(error, { extra: { errorId } });
  return { message: 'Something went wrong', errorId }; // must match App.Error
};
```
Same rules: never throw, never expose raw error.
</client_hooks>

Common mistakes with hooks, auth, and error handling.
<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| Auth in `+layout.ts` (universal load) | Auth in `hooks.server.ts` via `handle` | CRITICAL |
| Store DB connections in `event.locals` | `init` hook or module-level singletons | CRITICAL |
| `throw error(404)` (SK1 syntax) | `error(404)` -- throws internally in SK2 | CRITICAL |
| Omit `path` in `cookies.set()` | Always pass `path: '/'` (required in SK2) | CRITICAL |
| `error()` for form validation | `fail()` -- stays on page, populates `form` prop | HIGH |
| `$env/dynamic/*` in prerendered pages | `$env/static/*` for prerender-compatible values | HIGH |
| `process.env.SECRET` (Node-only) | `import { SECRET } from '$env/static/private'` | HIGH |
| Return raw `error` in `handleError` | Sanitized `{ message, errorId }` matching App.Error | HIGH |
| Top-level `import` in `src/app.d.ts` | Inline `import('$lib/types').Type` syntax | HIGH |
| Module-scope mutable state (serverless) | Per-request state in `event.locals` only | HIGH |
| `style-src` without `unsafe-inline` | Include `unsafe-inline` for Svelte transitions | MEDIUM |
| Security headers only in hooks | Also configure platform (`_headers`, `vercel.json`) for static content | MEDIUM |
</anti_patterns>

Diagnosing hooks, error handling, and security issues.
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| Hooks not running for static pages | Prerendered/static assets bypass hooks | Configure headers via platform (`_headers`, `vercel.json`) |
| `handleFetch` missing `params`/`route.id` | Async `reroute` pending -- route not resolved | Move param-dependent logic after reroute |
| `error()`/`redirect()` caught by try-catch | They throw internally -- catch intercepts | Add `if (isHttpError(e) \|\| isRedirect(e)) throw e` |
| `App.Locals` type not recognized | Top-level `import` in `app.d.ts` | Use inline `import()` syntax |
| `cookies.set()` throws TypeError | Missing `path` param (SK2 requirement) | Add `path: '/'` to all cookie operations |
| `handleError` crashes the app | `handleError` itself threw | Wrap in try-catch, ensure it NEVER throws |
| CSP breaks Svelte transitions | `style-src` missing `unsafe-inline` | Add `'unsafe-inline'` to `style-src` |
| `$env/dynamic` fails on prerendered page | Dynamic env forbidden in prerender | Use `$env/static/private` or disable prerender |
| `+error.svelte` not rendering for layout error | Walk-up: layout errors use `+error.svelte` ABOVE | Place error page in parent segment |
| `%sveltekit.nonce%` breaks prerender | Nonces incompatible with prerendering | Use CSP `mode: 'auto'` (nonces for SSR, hashes for prerender) |
</troubleshooting>
