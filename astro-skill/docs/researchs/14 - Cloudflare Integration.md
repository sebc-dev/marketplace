# Astro 5.17+ / Cloudflare Integration: Production Patterns

Astro 5.17+ with **@astrojs/cloudflare 12.6.12+** provides mature Cloudflare integration, but production deployments require navigating **compatibility flags**, **binding access patterns**, and **Worker runtime constraints**. This research covers advanced patterns beyond basic setup—focusing on edge cases, anti-patterns, and production-ready configurations for creating a Claude Code skill.

---

## 1. Quick Reference (15-20 Rules for SKILL.md)

### Adapter Configuration

1. **Set `compatibility_date` to `2025-01-01+`** and include `nodejs_compat` in flags—unlocks essential Node.js polyfills and stable APIs [OFFICIAL, High]
2. **Use `imageService: 'compile'`** (default) for most projects—Sharp processes prerendered images at build, disables `astro:assets` on SSR pages [OFFICIAL, High]
3. **Enable `platformProxy.persist: true`** (default)—maintains local KV/D1/R2 data in `.wrangler/state/v3/` between `astro dev` restarts [OFFICIAL, High]
4. **Configure `workerEntryPoint` only for Durable Objects/Queues**—custom entry required for named exports beyond `fetch` handler [OFFICIAL, High, @astrojs/cloudflare@12.6.0+]
5. **Add `public/.assetsignore`** containing `_worker.js` and `_routes.json`—prevents Workers from exposing generated files as static assets [COMMUNITY, High]

### Bindings Access

6. **Access bindings via `context.locals.runtime.env`** in endpoints/actions/middleware—never import `cloudflare:workers` directly during dev [OFFICIAL, High]
7. **Run `npx wrangler types` before each build**—generates `worker-configuration.d.ts` for type-safe bindings [OFFICIAL, High]
8. **Avoid storing binding references in global scope**—bindings may become stale after code-only deploys [OFFICIAL, High]
9. **Use AsyncLocalStorage pattern for deep function access**—wrap middleware with `envStore.run(env, next)` to access bindings anywhere [COMMUNITY, Medium]

### Worker Limits

10. **Monitor bundle size with `wrangler deploy --dry-run --outdir ./dist-check`**—Free: 3MB compressed, Paid: 10MB compressed [OFFICIAL, High]
11. **Configure `limits.cpu_ms: 50000`** explicitly for CPU-intensive SSR—default 30s, max 300s on Paid [OFFICIAL, High, compatibility_date 2025-03-25+]
12. **Use streaming responses for large data**—128MB memory hard limit applies to entire isolate [OFFICIAL, High]
13. **Split heavy Workers via Service Bindings**—subrequests to bound services don't count toward the 1,000 limit [OFFICIAL, High]

### Node.js Compatibility

14. **Use `node:` prefix for all Node imports**—non-prefixed imports cause bundling failures [OFFICIAL, High]
15. **Set compatibility_date `2024-09-23+` for `nodejs_compat_v2`** auto-enable—adds polyfills for `fs`, `http`, `process` [OFFICIAL, High]
16. **Add `nodejs_compat_populate_process_env`** flag for `astro:env` secrets—required for `process.env` access in global scope [OFFICIAL, High, compatibility_date 2025-04-01+]

### Environment Variables

17. **Use `.dev.vars` for local secrets** (not `.env`)—dotenv syntax, takes precedence over `.env` [OFFICIAL, High]
18. **Never put secrets in `wrangler.jsonc vars`**—stored in plaintext; use `wrangler secret put` instead [OFFICIAL, High]
19. **Add `keep_vars = true`** if managing secrets via Dashboard—prevents Wrangler deploy from overwriting [OFFICIAL, Medium]

### Edge Features

20. **Access geolocation via headers first**: `Astro.request.headers.get("cf-ipcountry")`—simpler than accessing `request.cf` object [OFFICIAL, High]

---

## 2. Decision Matrix

|Situation|Recommended Approach|Reason|Confidence|
|---|---|---|---|
|**Pages vs Workers (new project)**|Workers with `assets.directory`|Cloudflare announced Workers is primary investment; Pages is maintenance-only|[OFFICIAL] High|
|**Pages vs Workers (existing Pages)**|Keep Pages if working well|Migration not required; automatic preview deployments still valuable|[OFFICIAL] Medium|
|**imageService choice**|`'compile'` (default)|Sharp at build time for prerendered; passthrough for SSR. `'cloudflare'` requires paid Image Resizing|[OFFICIAL] High|
|**imageService for dynamic images**|`'cloudflare'` or `'passthrough'`|`'compile'` disables `astro:assets` on SSR pages|[OFFICIAL] High|
|**nodejs_compat flag selection**|Always use `nodejs_compat`|Required for most npm packages; v2 auto-enabled on date ≥2024-09-23|[OFFICIAL] High|
|**nodejs_compat_v2 opt-out**|Add `no_nodejs_compat_v2` flag|Only if reducing bundle size matters more than polyfill coverage|[OFFICIAL] Medium|
|**Sessions storage**|KV via `sessionKVBindingName`|Built-in Astro 5.6+ support; fs fallback automatic in dev|[OFFICIAL] High|
|**High-frequency writes**|Durable Objects, not KV|KV: 1 write/sec limit, 60s propagation; DO: immediate consistency|[OFFICIAL] High|
|**Database connections**|Hyperdrive for PostgreSQL|Workers can't maintain persistent TCP pools; Hyperdrive handles pooling|[OFFICIAL] High|
|**Bundle exceeds 3MB (Free)**|Upgrade to Paid (10MB) or split Workers|Service Bindings connect Workers without subrequest limits|[OFFICIAL] High|
|**CPU-intensive SSR**|Configure `limits.cpu_ms: 300000`|Default 30s may timeout; max 5 minutes on Paid|[OFFICIAL] High|
|**Caching strategy**|`fetch` API with `cf.cacheTtl` for tiered cache|Cache API is edge-local only; `fetch` integrates with tiered caching|[OFFICIAL] High|
|**Local dev vs production parity**|`astro build && wrangler dev` for final testing|`astro dev` uses Node.js with workerd proxies, not native workerd|[COMMUNITY] High|

---

## 3. Anti-patterns Table

|❌ Don't Do|✅ Alternative (Astro 5.17+/Cloudflare)|Impact|Source|
|---|---|---|---|
|Import `cloudflare:workers` directly|Access via `context.locals.runtime.env`|`Cannot find module` error in `astro dev`|[GitHub #13523] High|
|Use non-prefixed Node imports (`import fs from 'fs'`)|Use `node:` prefix (`import fs from 'node:fs'`)|Package resolution failure at build|[OFFICIAL] High|
|Use Sharp image service|Use `imageService: 'compile'` or `'cloudflare'`|Build fails: "adapter not compatible with Sharp"|[GitHub #191] High|
|Store binding derivatives in global scope|Access bindings fresh in each request|Stale references after code-only deploys|[OFFICIAL] High|
|Use KV for counters/high-write data|Use Durable Objects|1 write/sec limit, 60s eventual consistency|[OFFICIAL] High|
|Bundle large assets in Worker code|Store in KV/R2/D1, fetch at runtime|Bundle exceeds 3-10MB limit|[OFFICIAL] High|
|Use packages with persistent DB pools|Use per-request connections or Hyperdrive|Connections not reusable across requests|[COMMUNITY] High|
|Deploy without `nodejs_compat` flag|Add to `compatibility_flags` array|Most npm packages fail at runtime|[OFFICIAL] High|
|Expensive code in global scope|Move initialization into request handlers|1-second startup timeout exceeded|[OFFICIAL] High|
|Use `astro-compress` on Cloudflare|Remove package or use `@playform/compress`|Build crashes during image optimization|[COMMUNITY] Medium|
|Rely on `process.env` before `2025-04-01` date|Add `nodejs_compat_populate_process_env` flag|`process.env` undefined in global scope|[GitHub #13503] High|
|Use `passThroughOnException`|Handle errors in middleware/endpoints|Not available in Cloudflare Pages; throws error|[OFFICIAL] High|
|Expect `fs.watch()` to work|Use KV/D1 polling or Durable Objects|File watching not supported on Workers|[OFFICIAL] High|
|Use `http2` module|Use standard `fetch` or `node:http`|`node:http2` is non-functional stub|[OFFICIAL] High|
|Assume local dev mirrors production|Final test with `astro build && wrangler dev`|platformProxy emulates, not replicates, workerd|[COMMUNITY] High|

---

## 4. Troubleshooting Table

|Symptom|Probable Cause|Fix|Source|
|---|---|---|---|
|`Cannot bundle Node.js built-in "node:stream"`|Package using CJS Node imports (e.g., Vue server-renderer)|Add to `vite.ssr.external`; update package|[GitHub #470] High|
|`Worker exceeded size limit of 3 MiB`|Bundle too large|Paid plan (10MB), tree-shake, Service Bindings|[OFFICIAL] High|
|`Cannot read properties of undefined (reading 'env')`|Accessing runtime during prerendering|Guard with `if (import.meta.env.SSR)` or use `astro:env`|[GitHub #8347] High|
|`SyntaxError: Unexpected token 'with'`|Node.js version too old on CF Pages|Set `NODE_VERSION=22` env var|[COMMUNITY] High|
|Image 404 on Workers (works on Pages)|Different static asset handling|Use `imageService: 'passthrough'`; verify `_routes.json`|[GitHub #13825] High|
|`[object Object]` instead of HTML|Middleware returning incorrect Response|Upgrade adapter to 12.6+; check middleware return|[GitHub #14983] High|
|`ReferenceError: FinalizationRegistry is not defined`|Old compatibility_date|Set to `2025-05-05` or later|[COMMUNITY] High|
|Bindings undefined in local dev|platformProxy not enabled|Set `platformProxy: { enabled: true }`|[OFFICIAL] High|
|SSR routes returning 404|Route specificity issues in `_routes.json`|Configure `routes.extend.include` manually|[GitHub #14067] High|
|`_worker.js` exposed as asset error|Missing `.assetsignore` file|Create `public/.assetsignore` with `_worker.js`|[GitHub #15134] High|
|`ERR_REQUIRE_ESM` during build|ESM/CJS mismatch or old Bun|Use npm; delete `node_modules` and reinstall|[COMMUNITY] Medium|
|Hydration mismatch errors|Cloudflare Auto Minify enabled|Disable Auto Minify in CF Dashboard|[OFFICIAL] High|
|KV/D1 operations failing locally|`.dev.vars` missing binding config|Ensure bindings in `wrangler.jsonc`; check `.wrangler/state/` exists|[OFFICIAL] High|
|Sessions not persisting|Using fs fallback in dev (not KV)|Expected behavior; test with `wrangler dev` for KV|[GitHub #13831] Medium|
|`astro:env` secrets undefined in Actions|Missing compat flag|Add `nodejs_compat_populate_process_env` flag|[GitHub #13503] High|

---

## 5. Code Patterns (Minimal Examples)

### Complete production-ready `astro.config.mjs`

```javascript
// astro.config.mjs
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server', // or 'hybrid' for selective SSR
  adapter: cloudflare({
    imageService: 'compile', // Sharp at build; passthrough for SSR
    platformProxy: {
      enabled: true,
      configPath: 'wrangler.jsonc',
      persist: true, // Persist binding data between dev restarts
    },
    sessionKVBindingName: 'SESSIONS', // Must match wrangler binding
    // Only if using Durable Objects or Queues:
    // workerEntryPoint: { path: 'src/worker.ts', namedExports: ['MyDO'] },
    routes: {
      extend: {
        include: [{ pattern: '/api/*' }], // Force SSR
        exclude: [{ pattern: '/docs/*' }], // Force static
      },
    },
  }),
  env: {
    schema: {
      DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      PUBLIC_API_BASE: envField.string({ context: 'client', access: 'public' }),
    },
  },
  vite: {
    ssr: {
      external: ['node:async_hooks'], // Externalize Node.js modules if needed
    },
    build: {
      minify: process.env.NODE_ENV === 'production', // false for debugging
    },
  },
});
```

### Bindings access in Page (.astro)

```astro
---
// src/pages/dashboard.astro
export const prerender = false; // Required for SSR

// Access bindings via Astro.locals (only in frontmatter)
const { env } = Astro.locals.runtime;
const userData = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
  .bind(Astro.params.id)
  .first();

// Access cf object via headers (simpler)
const country = Astro.request.headers.get('cf-ipcountry');
---
<h1>Welcome, {userData?.name} from {country}</h1>
```

### Bindings access in Endpoint

```typescript
// src/pages/api/data.ts
import type { APIContext } from 'astro';
export const prerender = false;

export async function GET({ locals, params }: APIContext) {
  const { env } = locals.runtime;
  
  // KV access
  const cached = await env.CACHE.get(`data:${params.id}`, 'json');
  if (cached) return Response.json(cached);
  
  // D1 access
  const { results } = await env.DB
    .prepare('SELECT * FROM items WHERE category = ?')
    .bind(params.category)
    .all();
  
  // R2 access (for files)
  const file = await env.STORAGE.get('config.json');
  const config = file ? await file.json() : {};
  
  // Cache result in KV
  await env.CACHE.put(`data:${params.id}`, JSON.stringify(results), {
    expirationTtl: 3600,
  });
  
  return Response.json(results);
}

export async function POST({ locals, request }: APIContext) {
  const { env } = locals.runtime;
  const body = await request.json();
  
  // Queue message for async processing
  await env.TASKS.send({ action: 'process', payload: body });
  
  return Response.json({ queued: true });
}
```

### Middleware with bindings and cf object

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  // Guard against prerendering (runtime undefined at build time)
  if (!context.locals.runtime) return next();
  
  const { env, cf } = context.locals.runtime;
  
  // Geolocation-based routing
  const country = cf?.country ?? context.request.headers.get('cf-ipcountry');
  if (country === 'CN' && !context.url.pathname.startsWith('/cn/')) {
    return context.redirect('/cn' + context.url.pathname);
  }
  
  // Rate limiting via KV
  const clientIP = context.request.headers.get('cf-connecting-ip');
  const rateKey = `rate:${clientIP}:${Math.floor(Date.now() / 60000)}`;
  const requests = parseInt(await env.CACHE.get(rateKey) ?? '0');
  
  if (requests > 100) {
    return new Response('Rate limited', { status: 429 });
  }
  await env.CACHE.put(rateKey, String(requests + 1), { expirationTtl: 120 });
  
  return next();
});
```

### Astro Action with bindings

```typescript
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  createItem: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().min(1),
      category: z.string(),
    }),
    handler: async (input, context) => {
      const { env } = context.locals.runtime;
      
      const result = await env.DB
        .prepare('INSERT INTO items (name, category) VALUES (?, ?) RETURNING id')
        .bind(input.name, input.category)
        .first();
      
      // Invalidate cache
      await env.CACHE.delete(`items:${input.category}`);
      
      return { id: result?.id };
    },
  }),
};
```

### Complete TypeScript typing

```typescript
// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference path="../worker-configuration.d.ts" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

// worker-configuration.d.ts (generated by `wrangler types`)
interface Env {
  // KV Namespaces
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  
  // D1 Databases
  DB: D1Database;
  
  // R2 Buckets
  STORAGE: R2Bucket;
  
  // Durable Objects
  ROOMS: DurableObjectNamespace;
  
  // Queues
  TASKS: Queue<{ action: string; payload: unknown }>;
  
  // Service Bindings
  AUTH_SERVICE: Fetcher;
  
  // AI
  AI: Ai;
  
  // Environment Variables
  ENVIRONMENT: string;
  API_VERSION: string;
}
```

### Cache API in endpoint

```typescript
// src/pages/api/cached-data.ts
export const prerender = false;

export async function GET({ request, locals }) {
  const url = new URL(request.url);
  // Cache key must be valid URL format
  const cacheKey = new Request(`https://cache${url.pathname}${url.search}`);
  
  const cache = caches.default;
  let response = await cache.match(cacheKey);
  
  if (response) {
    // Add header to indicate cache hit
    response = new Response(response.body, response);
    response.headers.set('X-Cache', 'HIT');
    return response;
  }
  
  // Fetch fresh data
  const data = await fetchExpensiveData(locals.runtime.env);
  
  response = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Required for caching
      'X-Cache': 'MISS',
    },
  });
  
  // Store in cache (non-blocking)
  locals.runtime.ctx.waitUntil(cache.put(cacheKey, response.clone()));
  
  return response;
}
```

### Sessions with KV

```typescript
// src/pages/api/login.ts
export const prerender = false;

export async function POST({ request, session, redirect }) {
  const data = await request.formData();
  const email = data.get('email');
  
  // Astro 5.6+ sessions - auto-uses KV on Cloudflare
  await session.set('user', { email, loggedIn: true });
  
  return redirect('/dashboard');
}

// src/pages/dashboard.astro
---
export const prerender = false;

const user = await Astro.session.get('user');
if (!user?.loggedIn) {
  return Astro.redirect('/login');
}
---
<h1>Welcome, {user.email}</h1>
```

### AsyncLocalStorage pattern (deep function access)

```typescript
// src/lib/env-store.ts
import { AsyncLocalStorage } from 'node:async_hooks';

export const envStore = new AsyncLocalStorage<Env>();
export const getEnv = () => envStore.getStore()!;

// src/middleware.ts
import { envStore } from './lib/env-store';

export const onRequest = defineMiddleware((context, next) => {
  if (!context.locals.runtime) return next();
  return envStore.run(context.locals.runtime.env, next);
});

// src/lib/db.ts - can now access env anywhere
import { getEnv } from './env-store';

export async function getUser(id: string) {
  const env = getEnv(); // Works in any function!
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
}
```

---

## 6. References

### Complete annotated `wrangler.jsonc`

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  
  // === IDENTITY ===
  "name": "my-astro-app",
  "main": "./dist/_worker.js", // Astro generates this
  
  // === COMPATIBILITY (Critical for Node.js support) ===
  "compatibility_date": "2025-01-01", // Keep updated quarterly
  "compatibility_flags": [
    "nodejs_compat", // Required: enables Node.js polyfills
    "nodejs_compat_populate_process_env" // Required for astro:env secrets
    // Add "no_nodejs_compat_v2" only if reducing bundle size is critical
  ],
  
  // === STATIC ASSETS (Workers with assets) ===
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS", // Access via env.ASSETS.fetch()
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "none", // Let Astro handle 404s
    "run_worker_first": ["/api/*", "/dashboard/*", "!/static/*"] // SSR routes
  },
  
  // === RESOURCE LIMITS ===
  "limits": {
    "cpu_ms": 50000 // 50s default; max 300000 (5min) on Paid
  },
  
  // === BINDINGS ===
  "kv_namespaces": [
    { "binding": "CACHE", "id": "<KV_ID>" },
    { "binding": "SESSIONS", "id": "<SESSIONS_KV_ID>" } // For Astro sessions
  ],
  "d1_databases": [
    { 
      "binding": "DB", 
      "database_id": "<D1_ID>",
      "database_name": "production",
      "migrations_dir": "migrations"
    }
  ],
  "r2_buckets": [
    { "binding": "STORAGE", "bucket_name": "assets" }
  ],
  "durable_objects": {
    "bindings": [
      { "name": "ROOMS", "class_name": "ChatRoom" }
    ]
  },
  "queues": {
    "producers": [{ "binding": "TASKS", "queue": "task-queue" }],
    "consumers": [{ 
      "queue": "task-queue",
      "max_batch_size": 10,
      "max_batch_timeout": 30
    }]
  },
  "services": [
    { "binding": "AUTH", "service": "auth-worker" }
  ],
  "ai": { "binding": "AI" },
  "hyperdrive": [
    { "binding": "HYPERDRIVE", "id": "<HYPERDRIVE_CONFIG_ID>" }
  ],
  
  // === NON-SECRET VARIABLES ===
  "vars": {
    "ENVIRONMENT": "production",
    "LOG_LEVEL": "info"
  },
  // Secrets: use `wrangler secret put SECRET_NAME`
  
  // === OBSERVABILITY ===
  "observability": {
    "enabled": true,
    "head_sampling_rate": 0.1 // Sample 10% of requests
  },
  
  // === SOURCE MAPS (for error debugging) ===
  "upload_source_maps": true,
  
  // === ENVIRONMENTS ===
  "env": {
    "staging": {
      "name": "my-astro-app-staging",
      "vars": { "ENVIRONMENT": "staging" },
      "kv_namespaces": [
        { "binding": "CACHE", "id": "<STAGING_KV_ID>" }
      ]
    }
  }
}
```

### Compatibility flags for Astro

|Flag|Minimum Date|Purpose|
|---|---|---|
|`nodejs_compat`|(manual)|Enables all Node.js APIs|
|`nodejs_compat_v2`|2024-09-23|Enhanced polyfills (auto on this date)|
|`nodejs_compat_populate_process_env`|2025-04-01|`process.env` in global scope|
|`enable_nodejs_http_modules`|2025-08-15|`node:http/https` client|
|`enable_nodejs_http_server_modules`|2025-09-01|`node:http` server (Express support)|
|`enable_nodejs_fs_module`|2025-09-01|Full `node:fs` virtual filesystem|
|`nodejs_als`|(manual)|AsyncLocalStorage only (lighter than full compat)|
|`global_fetch_strictly_public`|(recommended)|Strict fetch behavior|

### Node.js APIs compatibility on Workers

|Module|Status|Notes|
|---|---|---|
|`node:buffer`|✅ Full|Native C++ implementation|
|`node:crypto`|✅ Full|Uses BoringSSL|
|`node:stream`|✅ Full|All stream types|
|`node:path`|✅ Full||
|`node:url`|✅ Full||
|`node:util`|✅ Full||
|`node:events`|✅ Full|EventEmitter|
|`node:async_hooks`|✅ Full|AsyncLocalStorage|
|`node:zlib`|✅ Full|Including Brotli|
|`node:dns`|✅ Full|Uses 1.1.1.1 DoH|
|`node:net`|✅ Full|Workers Sockets API|
|`node:tls`|⚠️ Partial|Basic support|
|`node:fs`|✅ Full*|Virtual in-memory; no `watch()`|
|`node:http/https`|✅ Full*|Wraps fetch; date ≥2025-08-15|
|`node:child_process`|❌ Stub|Non-functional|
|`node:cluster`|❌ Stub|Non-functional|
|`node:http2`|❌ Stub|Non-functional|
|`node:vm`|❌ Stub|Non-functional|

### Worker Limits Quick Reference

|Resource|Free|Paid|Workaround|
|---|---|---|---|
|Bundle (compressed)|3 MB|10 MB|Service Bindings|
|Memory|128 MB|128 MB|Streaming|
|CPU time|10 ms|5 min max|`limits.cpu_ms`|
|Subrequests|50|1,000|Service Bindings (uncounted)|
|KV ops/request|1,000|1,000|Batch operations|
|Daily requests|100K|Unlimited|Upgrade|

---

## 7. Sources Consulted

### Official Documentation [HIGH Confidence]

- https://docs.astro.build/en/guides/integrations-guide/cloudflare/ — Astro adapter docs (v12.6.12)
- https://docs.astro.build/en/guides/deploy/cloudflare/ — Deployment guide
- https://developers.cloudflare.com/workers/configuration/compatibility-flags/ — Compat flags reference
- https://developers.cloudflare.com/workers/runtime-apis/nodejs/ — Node.js APIs
- https://developers.cloudflare.com/workers/platform/limits/ — Worker limits
- https://developers.cloudflare.com/workers/runtime-apis/cache/ — Cache API
- https://developers.cloudflare.com/workers/configuration/environment-variables/ — Env vars workflow

### Astro Versions Confirmed

- **Astro**: 5.17+ (sessions stable in 5.6+, `astro:env` Cloudflare support in 5.6+)
- **@astrojs/cloudflare**: 12.6.12 (latest as of Feb 2026)
- Repository moved from `withastro/adapters` to `withastro/astro/packages/integrations/cloudflare` (Feb 2025)

### Critical GitHub Issues

|Issue|Status|Impact|
|---|---|---|
|[#14945](https://github.com/withastro/astro/issues/14945)|Open|SSR import paths incorrect|
|[#14067](https://github.com/withastro/astro/issues/14067)|Open|Route specificity issues|
|[#13825](https://github.com/withastro/astro/issues/13825)|Open|Image 404 on Workers|
|[#13523](https://github.com/withastro/astro/issues/13523)|Open|`cloudflare:workers` import in dev|
|[#15134](https://github.com/withastro/astro/issues/15134)|Open|`_worker.js` exposed as asset|

### Documentation Gaps Identified [DOC-GAP]

1. **Direct `request.cf` access in Astro** — only header access (`cf-ipcountry`) documented
2. **Cache API in Astro endpoints** — no official examples
3. **Why Pages middleware ignored** — Advanced mode behavior not prominently documented
4. **`platformProxy` emulation limitations** — dev/prod differences not comprehensive
5. **`cloudflare:workers` import** — doesn't work in `astro dev`, only production

### Community Sources [MEDIUM Confidence]

- https://dev.to/mrtoxas/access-cloudflare-runtime-env-in-nested-functions-with-astro-ssr-3mn5 — AsyncLocalStorage pattern
- https://opennext.js.org/cloudflare/troubleshooting — Cross-framework troubleshooting patterns
- Cloudflare Community Forums — User-reported issues and workarounds