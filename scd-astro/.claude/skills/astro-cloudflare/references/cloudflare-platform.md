# Cloudflare Platform

<quick_reference>
1. Add `nodejs_compat` to `compatibility_flags` -- required for most npm packages
2. Access bindings via `import { env } from 'cloudflare:workers'` -- NOT `Astro.locals.runtime.env` (removed in v6)
3. Use `.dev.vars` for local secrets (not `.env`) -- `.dev.vars` takes full precedence
4. Use `node:` prefix for all Node.js imports (`node:buffer`, `node:crypto`, etc.)
5. Workers is the only deployment target -- Pages deprecated, adapter v13 defaults to Workers
6. Run `npx wrangler types` before `astro dev` to generate binding types (`worker-configuration.d.ts`)
7. Default image service is `cloudflare-binding` -- NOT Sharp, NOT `compile` (v13 default changed)
8. Never store binding references in global scope -- access fresh per request
9. Dev server runs in `workerd` natively -- `astro dev` and `astro preview` use real Workers runtime
10. Wrangler config is optional -- auto-generated if absent. Only needed for custom bindings
11. No `main` field needed in wrangler.jsonc -- adapter handles entrypoint automatically
12. CJS dependencies break in workerd -- pre-compile via `optimizeDeps.include` if `require is not defined`
</quick_reference>
<bindings_access>
Access KV, D1, R2, and other bindings via `import { env } from 'cloudflare:workers'` in every server-side context.

**In .astro pages:**
```astro
---
import { env } from 'cloudflare:workers';

export const prerender = false;

const data = await env.DB.prepare('SELECT * FROM items WHERE id = ?').bind(id).first();
const country = Astro.request.cf?.country;

// Background work via execution context
Astro.locals.cfContext.waitUntil(
  env.MY_KV.put('last-visit', new Date().toISOString())
);
---
```

**In API endpoints:**
```typescript
import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export async function GET(context: APIContext) {
  const cached = await env.CACHE.get('key', 'json');
  context.locals.cfContext.waitUntil(env.CACHE.put('last-read', Date.now().toString()));
  return Response.json(cached);
}
```

**In middleware:**
```typescript
import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';

export const onRequest = defineMiddleware(async (context, next) => {
  const token = context.request.headers.get('Authorization')?.replace('Bearer ', '');
  if (token) {
    const session = await env.DB.prepare('SELECT * FROM sessions WHERE token = ?')
      .bind(token).first();
    if (session) context.locals.user = session;
  }
  return next();
});
```

**In Actions:**
```typescript
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { env } from 'cloudflare:workers';

export const server = {
  addItem: defineAction({
    input: z.object({ name: z.string() }),
    handler: async (input) => {
      return env.DB.prepare('INSERT INTO items (name) VALUES (?)').bind(input.name).first();
    },
  }),
};
```

**Deep function access -- no AsyncLocalStorage needed:**
```typescript
// In any server-side module -- just import directly
import { env } from 'cloudflare:workers';

export async function getUser(id: string) {
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
}
// No middleware workaround needed in Astro 6 -- cloudflare:workers works everywhere
```

> **Note:** `cloudflare:workers` env is only available in request context (SSR pages, endpoints, middleware, actions). Not available in prerendered pages or at module top-level outside of request handling.

> **Cloudflare MCP:** For complete KV/D1/R2 binding method signatures, query `mcp__cloudflare__search_cloudflare_documentation`
> Queries: `"Workers KV namespace put get delete API"` | `"Cloudflare D1 prepare bind SQL API"`
</bindings_access>
<workers_limits>
| Resource | Free | Paid | Workaround |
|----------|------|------|------------|
| Bundle (compressed) | 3 MB | 10 MB | Service Bindings to split Workers |
| Memory | 128 MB | 128 MB | Use streaming responses |
| CPU time | 10 ms | 30s (max 5 min) | Configure `limits.cpu_ms` |
| Subrequests | 50 | 1,000 | Service Bindings (uncounted) |
| KV ops/request | 1,000 | 1,000 | Batch operations |
| Daily requests | 100K | Unlimited | Upgrade to Paid |
| Static asset files | 20,000 | 100,000 | per version |
| Static asset file size | 25 MiB | 25 MiB | |
| D1 database size | 10 GB | 10 GB | |
| Env variables | 64 (5 KB each) | 128 (5 KB each) | |

> **Cloudflare MCP:** For current limits and pricing details, query `mcp__cloudflare__search_cloudflare_documentation` with `"Cloudflare Workers platform limits and pricing"`.
</workers_limits>
<nodejs_compatibility>
| Module | Status | Notes |
|--------|--------|-------|
| `node:buffer` | Full | Native C++ implementation |
| `node:crypto` | Full | Uses BoringSSL |
| `node:stream` | Full | All stream types |
| `node:path` | Full | |
| `node:url` | Full | |
| `node:events` | Full | EventEmitter |
| `node:async_hooks` | Full | AsyncLocalStorage |
| `node:zlib` | Full | Including Brotli |
| `node:util` | Full | |
| `node:dns` | Full | Uses 1.1.1.1 DoH |
| `node:net` | Full | Workers Sockets API |
| `node:http` | Full | Client APIs (compat_date ≥ 2025-08-15) |
| `node:https` | Full | Client APIs (compat_date ≥ 2025-08-15) |
| `node:fs` | Virtual | In-memory filesystem (compat_date ≥ 2025-08-15) |
| `node:tls` | Partial | Basic support only |
| `node:child_process` | Stub | Non-functional |
| `node:cluster` | Stub | Non-functional |
| `node:http2` | Stub | Non-functional |
| `node:vm` | Stub | Non-functional |

**Compatibility flags:**

| Flag | Min Date | Purpose |
|------|----------|---------|
| `nodejs_compat` | (manual) | **Required.** Umbrella flag for Node.js APIs |
| `nodejs_compat_v2` | 2024-09-23 | Auto-enabled with `nodejs_compat`. Full polyfills + native APIs |
| `enable_nodejs_http_modules` | 2025-08-15 | `node:http`/`node:https` client APIs |
| `enable_nodejs_fs_module` | 2025-08-15 | Virtual in-memory filesystem |
| `enable_nodejs_http_server_modules` | 2025-09-01 | `http.createServer()` — Express/Koa support |
| `enable_nodejs_process_v2` | 2025-09-01 | Comprehensive `process` implementation |
| `nodejs_compat_populate_process_env` | (manual) | Auto-populates `process.env` with text bindings |

> **Cloudflare MCP:** For per-module compatibility details, query `mcp__cloudflare__search_cloudflare_documentation` with `"Workers nodejs_compat Node.js API support"`.
</nodejs_compatibility>
<environment_variables>
**`.dev.vars`** -- Local development secrets (dotenv syntax). Overrides `.env` completely when present. Add to `.gitignore`.
```
DATABASE_URL=postgres://localhost/mydb
API_SECRET=dev-secret-key
```

**`wrangler secret put`** -- Production secrets. Use for all sensitive values:
```bash
npx wrangler secret put DATABASE_URL
```

**`vars` in wrangler.jsonc** -- Non-secret config only. Stored in plaintext, visible in source control:
```jsonc
"vars": { "ENVIRONMENT": "production", "LOG_LEVEL": "info" }
```

**Key rules:**
- Never put secrets in `wrangler.jsonc` `vars` -- they are plaintext
- `process.env` does NOT work on Workers by default -- use `import { env } from 'cloudflare:workers'` or `astro:env`
- `import.meta.env` is always inlined at build time in Astro 6 -- never use for runtime secrets
- Use `cloudflare:workers` or `astro:env/server` for runtime-only values on Cloudflare
- Add `nodejs_compat_populate_process_env` flag if using `astro:env` secrets
- Use `keep_vars = true` if managing secrets via Cloudflare Dashboard
</environment_variables>
<config_templates>
## wrangler.jsonc (Astro 6 / @astrojs/cloudflare v13)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-astro-app",
  // No "main" needed -- adapter handles entrypoint automatically

  // Compatibility (required for Node.js support)
  "compatibility_date": "2026-03-13",
  "compatibility_flags": ["nodejs_compat"],

  // Static assets (Workers deployment)
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "404-page"
  },

  // Observability
  "observability": { "enabled": true },

  // Resource limits
  "limits": {
    "cpu_ms": 50000
  },

  // KV Namespaces -- SESSION is auto-provisioned if not declared
  "kv_namespaces": [
    { "binding": "CACHE", "id": "<KV_NAMESPACE_ID>" }
  ],

  // D1 Databases
  "d1_databases": [
    {
      "binding": "DB",
      "database_id": "<D1_DATABASE_ID>",
      "database_name": "production"
    }
  ],

  // R2 Buckets
  "r2_buckets": [
    { "binding": "STORAGE", "bucket_name": "assets" }
  ],

  // Non-secret variables (plaintext -- no secrets here)
  "vars": {
    "ENVIRONMENT": "production",
    "LOG_LEVEL": "info"
  },

  // Environments
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

## .dev.vars

```bash
# Local development secrets -- overrides .env completely
# Use dotenv syntax. Add .dev.vars to .gitignore.
DATABASE_URL=postgres://localhost:5432/mydb
API_SECRET=dev-only-secret
STRIPE_KEY=sk_test_xxx
```

> **Cloudflare MCP:** For complete wrangler.jsonc schema reference, query `mcp__cloudflare__search_cloudflare_documentation` with `"Wrangler configuration wrangler.toml schema"`.
</config_templates>

<anti_patterns>
## Anti-patterns

| Don't | Do | Impact |
|-------|-----|--------|
| `Astro.locals.runtime.env.X` | `import { env } from 'cloudflare:workers'` | Runtime error -- API removed in adapter v13 |
| `Astro.locals.runtime.cf` | `Astro.request.cf` | Runtime error -- API removed |
| `Astro.locals.runtime.ctx.waitUntil()` | `Astro.locals.cfContext.waitUntil()` | Runtime error -- API removed |
| `Astro.locals.runtime.caches` | Global `caches` object directly | Runtime error -- API removed |
| `process.env.SECRET` on Workers | `import { env } from 'cloudflare:workers'` or `astro:env/server` | `undefined` -- process.env not populated |
| `import.meta.env.SECRET_KEY` for runtime | `import { env } from 'cloudflare:workers'` | Secret baked into bundle at build time |
| `import fs from 'fs'` (no prefix) | `import fs from 'node:fs'` | Package resolution failure at build |
| Use Sharp image service | Use `imageService: 'cloudflare-binding'` (default) | Build fails: Sharp incompatible with Workers |
| Store bindings in global variables | Access `env` fresh per request | Stale references after code-only deploys |
| Use KV for high-write counters | Use Durable Objects | 1 write/sec limit, 60s eventual consistency |
| Put secrets in `wrangler.jsonc` `vars` | Use `wrangler secret put` | Secrets in plaintext, committed to git |
| Expensive code in global scope | Move initialization into request handlers | 1-second startup timeout exceeded |
| `require('package')` in server code | Use ESM imports, or add to `optimizeDeps.include` | `require is not defined` in workerd runtime |
| `platformProxy: { enabled: true }` | Remove -- workerd native in dev | Config error -- option removed in v13 |
| `cloudflareModules: true` | Remove -- workerd handles imports natively | Config error -- option removed in v13 |
| `main: "dist/_worker.js/index.js"` in wrangler | Remove `main` field (auto-handled) | Entrypoint error |
| Deploy to Cloudflare Pages | Deploy to Workers (default) | Pages deprecated for new projects |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `Astro.locals.runtime.env has been removed` | API removed in adapter v13 / Astro 6 | Replace with `import { env } from 'cloudflare:workers'` |
| `require is not defined` during dev | CJS modules in workerd dev server | Add to `optimizeDeps.include` via Vite plugin |
| `module is not defined` in dev | CJS package loaded in workerd | Dev-only; add to `optimizeDeps.include` or wait for upstream fix |
| Build fails: `No such module "sharp"` during prerender | Default workerd prerender can't load native modules | Set `prerenderEnvironment: 'node'` in adapter config |
| `WebAssembly.instantiate` fails during build | workerd disallows dynamic WASM during prerender | Set `prerenderEnvironment: 'node'` |
| Error 1042 / 522 for non-existent routes | CF routes unknown URLs to worker | Add `"not_found_handling": "404-page"` to assets in wrangler.jsonc |
| `Worker exceeded size limit of 3 MiB` | Bundle too large for Free plan | Upgrade to Paid (10MB) or split via Service Bindings |
| `_worker.js` exposed as static asset | Missing assetsignore file | Create `public/.assetsignore` containing `_worker.js` |
| Hydration mismatch errors | Cloudflare Auto Minify enabled | Disable Auto Minify in Cloudflare Dashboard |
| `astro:env` secrets undefined in Actions | Missing compat flag | Add `nodejs_compat_populate_process_env` to flags |
| Pages return `[object Object]` instead of HTML | `enable_nodejs_process_v2` flag issue | Update Wrangler ≥4.42.0; or add `disable_nodejs_process_v2` flag |
| Styles not applied in dev mode | Early adapter v13 CSS issue | Update adapter to latest v13.1.1+ |
| `SessionStorageInitError` on deploy | KV namespace not configured | Let auto-provision work with `wrangler deploy`, or add KV binding manually |
| `dist/server/wrangler.json` missing | Adapter + `output: 'static'` conflict | Remove adapter for purely static sites |
</troubleshooting>
