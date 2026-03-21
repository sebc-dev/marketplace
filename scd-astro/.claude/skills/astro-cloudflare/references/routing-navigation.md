# Routing and Navigation

File-based routing, dynamic routes, ClientRouter, middleware, redirects, and catch-all patterns on Cloudflare Workers.

<quick_reference>
1. Decode all params manually with `decodeURIComponent(Astro.params.slug)` -- auto-decode removed in Astro 5.0
2. Use `page.url.next` directly in paginate() links -- base path included automatically since v5.0
3. Use `output: 'static'` (default) with per-page `prerender: false` -- `output: 'hybrid'` removed in v5.0
4. Use `<ClientRouter />` from `astro:transitions` -- `<ViewTransitions />` removed in 6.0
5. Access bindings via `import { env } from 'cloudflare:workers'` -- replaces `locals.runtime.env` in v6
6. `_routes.json` is Pages-only (deprecated) -- Workers mode uses standard Worker routing
7. Never prerender `404.astro` when using Server Islands -- causes 404 on `/_server-islands/` requests
8. Exclude `/_server-islands/*` from catch-all `[...slug].astro` -- prevents infinite loop and Worker crash
9. Prefer `redirects` in astro.config.mjs over `_redirects` file -- `_redirects` ignored by Worker functions
10. `getStaticPaths()` params must be strings -- `params: { page: 2 }` fails, use `String(2)`
11. Avoid `trailingSlash: 'always'` with API endpoints -- causes routing conflicts on Cloudflare
12. Use `routes.extend.exclude` to force static serving of specific routes
</quick_reference>
<routing_strategy_decision_matrix>
| Page Type | Approach | Cloudflare Reasoning |
|-----------|----------|---------------------|
| Static page (about, contact) | `prerender: true` (implicit default) | No Worker invocation, CDN-served, minimal latency |
| Blog with 100+ posts | `getStaticPaths()` + Content Layer, prerender | Zero cold start, build time acceptable |
| User dashboard | `prerender: false` + middleware auth | Personalized data, session required |
| REST API endpoint | `.ts` endpoint with `prerender: false` | `import { env } from 'cloudflare:workers'` for D1/KV/R2 bindings |
| Personalized content on static page | Server Islands `server:defer` | Static shell cached on CDN, dynamic islands via Workers |
| Permanent redirect /old to /new | `redirects` in astro.config.mjs | Generated in Worker, bypasses `_redirects` limitations |
| Internal rewrite (same content, different URL) | `Astro.rewrite('/target')` in page | Preserves browser URL, SEO-friendly |
| Pagination with base path | `paginate()` without manual base concat | Base auto-included since v5.0, avoids double path |
| Catch-all fallback endpoint | Export `ALL: APIRoute` handler | Returns 405 for undefined HTTP methods |
| Multi-param route `/[lang]-[version]/` | `[a]-[b]` syntax in getStaticPaths | Supported pattern, all params required in paths |
</routing_strategy_decision_matrix>
<redirect_method_selection>
| Method | Use When | Cloudflare Behavior |
|--------|----------|---------------------|
| `redirects` in astro.config.mjs | Static permanent/temporary redirects | Handled by Worker, reliable for all routes |
| `Astro.redirect('/path', 301)` | Conditional redirects in page/endpoint logic | Code-level control, runs in Worker |
| `context.redirect()` in middleware | Auth redirects, locale detection | Runs before page handler |
| `context.rewrite()` in middleware | URL masking, A/B testing | Re-executes middleware chain with new URL |
| `_redirects` file | Static-only routes (no Worker) | Ignored for routes handled by Functions |
| External redirects in config | `'/ext': 'https://...'` (v5.2+) | Native support, avoids meta refresh |
</redirect_method_selection>
<route_priority_reference>
Routes resolve in this order (highest to lowest priority):
1. Reserved routes: `_astro/`, `_server-islands/`, `_actions/`
2. Segment count: `/a/b/c` wins over `/a/b` wins over `/a`
3. Static routes over dynamic: `/posts/create` wins over `/posts/[id]`
4. Named params over rest params: `/posts/[id]` wins over `/posts/[...slug]`
5. Prerendered over on-demand: `prerender: true` wins over `prerender: false`
6. Endpoints over pages: `.ts/.js` wins over `.astro`
7. File routes over config redirects
8. Alphabetical order as final fallback
</route_priority_reference>
<dynamic_routes_with_get_static_paths>
```astro
---
// src/pages/blog/[slug].astro
import { getCollection, render } from 'astro:content';
export const prerender = true;

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },  // Must be string -- numbers cause build error
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<Content />
```

**Pagination with getStaticPaths:**

```astro
---
// src/pages/blog/page/[page].astro
import { getCollection } from 'astro:content';
export const prerender = true;

export async function getStaticPaths({ paginate }) {
  const posts = await getCollection('blog');
  return paginate(posts, { pageSize: 10 });
  // paginate() generates params as strings automatically
}

const { page } = Astro.props;
---
{page.url.prev && <a href={page.url.prev}>Previous</a>}
{page.url.next && <a href={page.url.next}>Next</a>}
```

**Params must be strings** -- `params: { id: 42 }` fails at build, use `params: { id: String(42) }`.
</dynamic_routes_with_get_static_paths>
<cloudflare_route_configuration>
```javascript
// astro.config.mjs -- routes.extend for Cloudflare Workers
adapter: cloudflare({
  routes: {
    extend: {
      include: [{ pattern: '/api/*' }],   // Force Worker invocation
      exclude: [{ pattern: '/_astro/*' }]  // Force static serving
    }
  }
}),
redirects: {
  '/old': '/new',
  '/blog/old-post': '/blog/new-post',
  '/external': 'https://example.com/page'  // v5.2+ external redirect
}
```

**Cloudflare routing notes (Astro 6 / Workers mode):**
- `_routes.json` is a Pages-only concept (deprecated) -- Workers mode handles routing natively via workerd
- `_redirects` / `_headers` files are Pages-only -- use `redirects` config or middleware for Workers
- No `platformProxy` needed -- Astro 6 runs natively on workerd, bindings available via `cloudflare:workers`
</cloudflare_route_configuration>
<middleware_pattern>
```typescript
// src/middleware.ts
import { defineMiddleware, sequence } from 'astro:middleware';
import { env } from 'cloudflare:workers';

const bindingAccess = defineMiddleware(async (context, next) => {
  // env is available at module level -- no need for locals.runtime
  // Guard for prerendered routes (env unavailable during build)
  if (!import.meta.env.PROD || context.url.pathname.startsWith('/_')) {
    return next();
  }
  context.locals.apiKey = env.API_KEY;
  return next();
});

const logging = defineMiddleware(async (context, next) => {
  const start = Date.now();
  const response = await next();
  console.log(`${context.request.method} ${context.url.pathname} ${Date.now() - start}ms`);
  return response;
});

// Chain multiple middleware with sequence()
export const onRequest = sequence(bindingAccess, logging);
```

**Middleware redirect and rewrite:**

```typescript
const authCheck = defineMiddleware(async (context, next) => {
  if (context.url.pathname.startsWith('/app/') && !context.locals.user) {
    return context.redirect('/login', 302);
  }
  // Rewrite re-executes middleware chain with new URL
  if (context.url.pathname === '/legacy-path') {
    return context.rewrite(new Request('/new-path'));
  }
  return next();
});
```
</middleware_pattern>
<catch_all_route_guard_pattern>
```astro
---
// src/pages/[...slug].astro
export const prerender = false;
const { slug } = Astro.params;

// Exclude reserved Astro routes to prevent infinite loops
if (slug?.startsWith('_server-islands') ||
    slug?.startsWith('_astro') ||
    slug?.startsWith('_actions')) {
  return new Response(null, { status: 404 });
}

const decoded = slug ? decodeURIComponent(slug) : '';
// Use decoded slug for page lookup, database queries, etc.
const page = await getPageBySlug(decoded);
if (!page) return Astro.redirect('/404');
---
<h1>{page.title}</h1>
```
</catch_all_route_guard_pattern>
<api_endpoint_pattern>
```typescript
// src/pages/api/items/[id].ts
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = decodeURIComponent(params.id!);
  const db = env.DB; // D1 binding via cloudflare:workers
  const item = await db.prepare('SELECT * FROM items WHERE id = ?')
    .bind(id).first();
  if (!item) return new Response(null, { status: 404 });
  return Response.json(item);
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const db = env.DB;
  const result = await db.prepare('INSERT INTO items (name) VALUES (?)')
    .bind(body.name).run();
  return Response.json(result, { status: 201 });
};

// Fallback for unsupported methods
export const ALL: APIRoute = ({ request }) => {
  return Response.json(
    { error: `${request.method} not allowed` },
    { status: 405, headers: { Allow: 'GET, POST' } }
  );
};
```
</api_endpoint_pattern>
<client_router>
```astro
---
// src/layouts/BaseLayout.astro
import { ClientRouter } from 'astro:transitions';
---
<html>
  <head>
    <ClientRouter />
  </head>
  <body>
    <slot />
  </body>
</html>
```
Replaces deprecated `<ViewTransitions />` (removed in Astro 6.0). Native View Transitions API is the long-term direction -- avoid deep coupling to ClientRouter-specific features.
</client_router>
<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| `output: 'hybrid'` | Use `'static'` or `'server'` | CRITICAL -- removed in v5.0 |
| `process.env.SECRET` in SSR | `import { env } from 'cloudflare:workers'` | CRITICAL -- undefined on Workers |
| `locals.runtime.env.SECRET` | `import { env } from 'cloudflare:workers'` | CRITICAL -- removed in Astro 6 adapter |
| `params.slug` without decode | `decodeURIComponent(params.slug)` | CRITICAL -- encoded chars since v5.0 |
| `params: { id: 42 }` (number) | `params: { id: String(42) }` | CRITICAL -- getStaticPaths requires strings |
| Manual `base` concat with `page.url.next` | Use `page.url.next` directly | HIGH -- double base `/docs/docs/page/2` |
| `_redirects` file for Worker routes | `redirects` in astro.config.mjs | HIGH -- `_redirects` ignored by Functions |
| `platformProxy: { enabled: true }` | Remove -- workerd native in Astro 6 | HIGH -- option removed from adapter |
| Catch-all without `_server-islands` exclusion | Add guard check in `[...slug].astro` | HIGH -- infinite loop, Worker crash |
| `prerender: true` on 404.astro with Server Islands | Set `prerender: false` on 404.astro | HIGH -- error 1042/522 on missing routes |
| Async at module global scope in endpoint | Move inside handler function | HIGH -- "Disallowed operation" on Workers |
| `trailingSlash: 'always'` with API endpoints | Use `'never'` or `'ignore'` | MEDIUM -- 404 on `/api/users` vs `/api/users/` |
| `getStaticPaths()` on `prerender: false` page | Remove it, use `Astro.params` directly | MEDIUM -- warning logged, confusing behavior |
| `import fs from 'fs'` in SSR endpoint | Use Web APIs or `node:` prefix with `nodejs_compat` | MEDIUM -- build failure, no filesystem on Workers |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| 404 in prod but works in dev | Route not included in Worker routing | Add pattern to `routes.extend.include` in adapter config |
| Params show `%20` instead of spaces | v5.0 breaking change, auto-decode removed | Wrap with `decodeURIComponent(Astro.params.slug)` |
| Pagination URLs doubled `/docs/docs/page/2` | `paginate()` includes base since v5.0 | Remove manual `${base}` concat before `page.url.next` |
| Error 1042/522 for custom 404 | 404.astro prerendered with Server Islands | Set `prerender: false` on 404.astro |
| Server Islands infinite loop | Catch-all `[...slug].astro` matches `/_server-islands/*` | Add guard to exclude reserved paths |
| `env` is undefined at runtime | Accessing `env` during prerender or build | Guard with `import.meta.env.PROD` check, only access `env` in SSR |
| `locals.runtime` is undefined | Astro 6 removed `locals.runtime` | Migrate to `import { env } from 'cloudflare:workers'` |
| Build fails with non-string params | `getStaticPaths` params must be strings | Convert numbers: `params: { id: String(id) }` |
| Redirect not working on SSR route | `_redirects` ignored by Functions | Use `redirects` config or `Astro.redirect()` in code |
| Cold start 500ms+ on first request | Worker evicted after inactivity | Prefer prerender for static content or scheduled warm-up |
</troubleshooting>
