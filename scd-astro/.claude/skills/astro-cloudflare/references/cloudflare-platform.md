# Cloudflare Platform

<quick_reference>
1. Add `nodejs_compat` to `compatibility_flags` -- required for most npm packages
2. Access bindings via `Astro.locals.runtime.env`, never import `cloudflare:workers` directly
3. Use `.dev.vars` for local secrets (not `.env`) -- `.dev.vars` takes full precedence
4. Use `node:` prefix for all Node.js imports (`node:buffer`, `node:crypto`, etc.)
5. Workers is the default platform -- Pages deprecated April 2025, no new features
6. Run `npx wrangler types` before `astro dev` to generate binding types
7. Never use Sharp image service -- use `imageService: 'compile'` (default)
8. Never store binding references in global scope -- access fresh per request
9. Avoid expensive initialization in global scope -- 1-second startup timeout
</quick_reference>
<bindings_access>
Access KV, D1, R2, and other bindings through `locals.runtime.env` in every Astro context.

**In .astro pages:**
```astro
---
const { env } = Astro.locals.runtime;
const data = await env.DB.prepare('SELECT * FROM items WHERE id = ?').bind(id).first();
---
```

**In API endpoints:**
```typescript
export async function GET({ locals }: APIContext) {
  const { env } = locals.runtime;
  const cached = await env.CACHE.get('key', 'json');
  return Response.json(cached);
}
```

**In middleware** (guard for prerendering):
```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  if (!context.locals.runtime) return next(); // Prerender guard
  const { env } = context.locals.runtime;
  // Use env.CACHE, env.DB, etc.
  return next();
});
```

**In Actions:**
```typescript
handler: async (input, context) => {
  const { env } = context.locals.runtime;
  return env.DB.prepare('INSERT INTO items (name) VALUES (?)').bind(input.name).first();
}
```

**Deep function access via AsyncLocalStorage:**
```typescript
// src/lib/env-store.ts
import { AsyncLocalStorage } from 'node:async_hooks';
export const envStore = new AsyncLocalStorage<Env>();
export const getEnv = () => envStore.getStore()!;

// In middleware: envStore.run(context.locals.runtime.env, next);
// In any function: const env = getEnv();
```

> Note: `Astro.locals.runtime` is the Astro 5.x pattern. This changes in Astro 6.

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
| `node:tls` | Partial | Basic support only |
| `node:child_process` | Stub | Non-functional |
| `node:cluster` | Stub | Non-functional |
| `node:http2` | Stub | Non-functional |
| `node:vm` | Stub | Non-functional |

**Compatibility flags:**

| Flag | Min Date | Purpose |
|------|----------|---------|
| `nodejs_compat` | (manual) | Enables all Node.js APIs |
| `nodejs_compat_v2` | 2024-09-23 | Enhanced polyfills (auto on this date) |
| `nodejs_compat_populate_process_env` | 2025-04-01 | `process.env` in global scope for `astro:env` |

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
- `process.env` does NOT work on Workers -- use `locals.runtime.env` or `astro:env`
- Add `nodejs_compat_populate_process_env` flag if using `astro:env` secrets
- Use `keep_vars = true` if managing secrets via Cloudflare Dashboard
</environment_variables>
<config_templates>
## wrangler.jsonc

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "my-astro-app",
  "main": "./dist/_worker.js",

  // Compatibility (required for Node.js support)
  "compatibility_date": "2025-01-01",
  "compatibility_flags": [
    "nodejs_compat",
    "nodejs_compat_populate_process_env"
  ],

  // Static assets (Workers deployment)
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "none"
  },

  // Resource limits
  "limits": {
    "cpu_ms": 50000
  },

  // KV Namespaces
  "kv_namespaces": [
    { "binding": "CACHE", "id": "<KV_NAMESPACE_ID>" },
    { "binding": "SESSIONS", "id": "<SESSIONS_KV_ID>" }
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
| `import { env } from 'cloudflare:workers'` | `const { env } = locals.runtime` | `Cannot find module` error in `astro dev` |
| `import fs from 'fs'` (no prefix) | `import fs from 'node:fs'` | Package resolution failure at build |
| Use Sharp image service | Use `imageService: 'compile'` or `'cloudflare'` | Build fails: "adapter not compatible with Sharp" |
| Store bindings in global variables | Access `locals.runtime.env` fresh per request | Stale references after code-only deploys |
| Use KV for high-write counters | Use Durable Objects | 1 write/sec limit, 60s eventual consistency |
| `process.env.SECRET` on Workers | Use `locals.runtime.env` or `astro:env` | `undefined` -- process.env not populated |
| Put secrets in `wrangler.jsonc` `vars` | Use `wrangler secret put` | Secrets in plaintext, committed to git |
| Expensive code in global scope | Move initialization into request handlers | 1-second startup timeout exceeded |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot bundle Node.js built-in "node:stream"` | CJS package using non-prefixed imports | Add package to `vite.ssr.external` in astro config |
| `Worker exceeded size limit of 3 MiB` | Bundle too large for Free plan | Upgrade to Paid (10MB) or split via Service Bindings |
| `Cannot read properties of undefined (reading 'env')` | Accessing runtime during prerendering | Guard with `if (!context.locals.runtime) return next()` |
| `_worker.js` exposed as static asset | Missing assetsignore file | Create `public/.assetsignore` containing `_worker.js` |
| Bindings undefined in local dev | platformProxy not enabled | Set `platformProxy: { enabled: true }` in adapter config |
| Hydration mismatch errors | Cloudflare Auto Minify enabled | Disable Auto Minify in Cloudflare Dashboard |
| `astro:env` secrets undefined in Actions | Missing compat flag | Add `nodejs_compat_populate_process_env` to flags |
| `ReferenceError: FinalizationRegistry` | Old compatibility_date | Set `compatibility_date` to `2025-05-05` or later |
</troubleshooting>
