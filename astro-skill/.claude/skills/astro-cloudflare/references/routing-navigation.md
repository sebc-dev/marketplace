# Routing and Navigation

File-based routing, dynamic routes, ClientRouter, middleware, redirects, and catch-all patterns on Cloudflare Workers.

<quick_reference>
1. Decode all params manually with `decodeURIComponent(Astro.params.slug)` -- auto-decode removed in Astro 5.0
2. Use `page.url.next` directly in paginate() links -- base path included automatically since v5.0
3. Use `output: 'static'` (default) with per-page `prerender: false` -- `output: 'hybrid'` removed in v5.0
4. Use `<ClientRouter />` from `astro:transitions` -- `<ViewTransitions />` deprecated in 5.0, removed in 6.0
5. Access env vars via `Astro.locals.runtime.env` in SSR -- never `process.env` or `import.meta.env` for secrets
6. Limit `_routes.json` to 100 rules max with wildcards -- exceed causes deploy error 8000057
7. Never prerender `404.astro` when using Server Islands -- causes 404 on `/_server-islands/` requests
8. Exclude `/_server-islands/*` from catch-all `[...slug].astro` -- prevents infinite loop and Worker crash
9. Prefer `redirects` in astro.config.mjs over `_redirects` file -- `_redirects` ignored by Worker functions
10. Guard `runtime.env` access in middleware: `if (context.locals.runtime?.env)` -- undefined during prerendering
11. Avoid `trailingSlash: 'always'` with API endpoints -- causes routing conflicts on Cloudflare
12. Use `routes.extend.exclude` to force static serving of specific routes
</quick_reference>
<routing_strategy_decision_matrix>
| Page Type | Approach | Cloudflare Reasoning |
|-----------|----------|---------------------|
| Static page (about, contact) | `prerender: true` (implicit default) | No Worker invocation, CDN-served, minimal latency |
| Blog with 100+ posts | `getStaticPaths()` + Content Layer, prerender | Zero cold start, build time acceptable |
| User dashboard | `prerender: false` + middleware auth | Personalized data, session required |
| REST API endpoint | `.ts` endpoint with `prerender: false` | Access `runtime.env` for D1/KV/R2 bindings |
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
    params: { slug: post.id },
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
}

const { page } = Astro.props;
---
{page.url.prev && <a href={page.url.prev}>Previous</a>}
{page.url.next && <a href={page.url.next}>Next</a>}
```
</dynamic_routes_with_get_static_paths>
<cloudflare_route_configuration>
```javascript
// astro.config.mjs -- routes.extend for Cloudflare
adapter: cloudflare({
  platformProxy: { enabled: true },
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

**Cloudflare files and routing interaction:**

| File | Generated By | Purpose | Limitation |
|------|-------------|---------|------------|
| `_routes.json` | Adapter (auto) | Determines Worker vs static serving | Max 100 rules total |
| `_redirects` | Manual | Static-only route redirects | Ignored for Worker-handled routes |
| `_headers` | Manual | Response headers for static assets | Not applied to Worker responses |
</cloudflare_route_configuration>
<middleware_pattern>
```typescript
// src/middleware.ts
import { defineMiddleware, sequence } from 'astro:middleware';

const runtimeGuard = defineMiddleware(async (context, next) => {
  // Guard for prerendered routes (runtime undefined during build)
  if (context.locals.runtime?.env) {
    context.locals.apiKey = context.locals.runtime.env.API_KEY;
  }
  return next();
});

const logging = defineMiddleware(async (context, next) => {
  const start = Date.now();
  const response = await next();
  console.log(`${context.request.method} ${context.url.pathname} ${Date.now() - start}ms`);
  return response;
});

// Chain multiple middleware with sequence()
export const onRequest = sequence(runtimeGuard, logging);
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
export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const id = decodeURIComponent(params.id!);
  const db = locals.runtime.env.DB; // D1 binding
  const item = await db.prepare('SELECT * FROM items WHERE id = ?')
    .bind(id).first();
  if (!item) return new Response(null, { status: 404 });
  return Response.json(item);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();
  const db = locals.runtime.env.DB;
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
| `process.env.SECRET` in SSR | `Astro.locals.runtime.env.SECRET` | CRITICAL -- undefined on Workers |
| `params.slug` without decode | `decodeURIComponent(params.slug)` | CRITICAL -- encoded chars since v5.0 |
| Manual `base` concat with `page.url.next` | Use `page.url.next` directly | HIGH -- double base `/docs/docs/page/2` |
| `_redirects` file for Worker routes | `redirects` in astro.config.mjs | HIGH -- `_redirects` ignored by Functions |
| 100+ individual rules in `_routes.json` | Use wildcards (`/_astro/*`) | HIGH -- deploy error 8000057 |
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
| 404 in prod but works in dev | `_routes.json` missing route pattern | Add pattern to `routes.extend.include` in adapter config |
| Params show `%20` instead of spaces | v5.0 breaking change, auto-decode removed | Wrap with `decodeURIComponent(Astro.params.slug)` |
| Pagination URLs doubled `/docs/docs/page/2` | `paginate()` includes base since v5.0 | Remove manual `${base}` concat before `page.url.next` |
| Error 1042/522 for custom 404 | 404.astro prerendered with Server Islands | Set `prerender: false` on 404.astro |
| Server Islands infinite loop | Catch-all `[...slug].astro` matches `/_server-islands/*` | Add guard to exclude reserved paths |
| `runtime.env` undefined in dev | platformProxy not enabled or `.dev.vars` missing | Set `platformProxy: { enabled: true }` + create `.dev.vars` |
| `runtime.env` undefined during build | Middleware accessing env for prerendered route | Guard with `if (context.locals.runtime?.env)` |
| Error 8000057 overlapping rules | Duplicate patterns in `_routes.json` | Use wildcards, avoid individual file exclusions |
| Redirect not working on SSR route | `_redirects` ignored by Functions | Use `redirects` config or `Astro.redirect()` in code |
| Cold start 500ms+ on first request | Worker evicted after inactivity | Prefer prerender for static content or scheduled warm-up |
</troubleshooting>