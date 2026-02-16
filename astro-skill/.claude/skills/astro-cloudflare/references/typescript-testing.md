# TypeScript and Testing

TypeScript config, env.d.ts patterns, Cloudflare binding types, Vitest setup with Container API, and E2E testing on Cloudflare Workers.

<quick_reference>
1. Include `.astro/types.d.ts` in tsconfig `include` array -- generated types for content collections, actions, env
2. Run `astro sync` before `tsc --noEmit` -- generates `.astro/types.d.ts` required by the compiler
3. Use `moduleResolution: "Bundler"` -- not `"node"` (breaks `astro:*` imports)
4. Declare `App.Locals extends Runtime` in `env.d.ts` -- type-safe Cloudflare bindings via `locals.runtime.env`
5. Run `astro check && tsc --noEmit` for full type validation -- `astro check` validates `.astro`, `tsc` validates `.ts`
6. Use `satisfies APIRoute` for endpoint handlers -- better inference than direct type annotation
7. Import `Runtime<Env>` from `@astrojs/cloudflare` -- not manual typing of the runtime object
8. Use `getViteConfig()` from `astro/config` for Vitest -- not standard `defineConfig` (breaks Astro transforms)
9. Import `experimental_AstroContainer` from `astro/container` -- not `AstroContainer` (API is still experimental)
10. Use `@cloudflare/vitest-pool-workers` for tests needing real Cloudflare bindings -- runs in actual workerd
11. Pin Vitest to 3.x -- Vitest 4.x is incompatible with Astro 5.x (causes `[object Object]` errors)
12. Use `environment: 'node'` in vitest config for unit tests -- not `happy-dom` (breaks Astro server transforms)
13. Add `globals: true` in vitest config -- avoids importing `describe`/`test`/`expect` in every file
14. Run `wrangler types` before build/test -- generates `Env` types from wrangler.jsonc bindings
</quick_reference>
<typescript_config>
| Scenario | Preset | Key Settings |
|----------|--------|-------------|
| Quick prototype / POC | `astro/tsconfigs/base` | Add `strictNullChecks: true` (required for Content Collections) |
| Standard project | `astro/tsconfigs/strict` | Default CLI choice, good balance of safety and pragmatism |
| Production app | `astro/tsconfigs/strictest` | Maximum type safety, prefix unused params with `_` |
| Library / shared package | `astro/tsconfigs/strict` | Add `declaration: true`, `declarationMap: true` |
| Strict team / CI enforced | `astro/tsconfigs/strictest` | Combine with `astro check && tsc --noEmit` in CI |
| Content-only site (no SSR) | `astro/tsconfigs/base` | Minimal config, add `strictNullChecks: true` for collections |

**All presets include:** `moduleResolution: "Bundler"`, `verbatimModuleSyntax: true`, `isolatedModules: true`, `noEmit: true`.

**Cloudflare addition:** Add `types: ["@cloudflare/workers-types"]` to `compilerOptions` when targeting Workers.
</typescript_config>
<env_types>
```typescript
/// <reference path="../.astro/types.d.ts" />
// src/env.d.ts -- full type-safe Cloudflare environment
type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  KV_CACHE: KVNamespace;
  ASSETS_BUCKET: R2Bucket;
  API_SECRET: string;
}

declare namespace App {
  interface Locals extends Runtime {
    user: { id: string; email: string } | null;
    requestId: string;
  }
  interface SessionData {
    userId: string;
    cart: string[];
  }
}
```

**Key rules:**
- `Env` interface lists all bindings from wrangler.jsonc -- D1, KV, R2, secrets
- `App.Locals extends Runtime` gives `locals.runtime.env` full type safety
- `App.SessionData` types the Astro Sessions API (Astro 5.5+)
- Run `wrangler types` to auto-generate `Env` from wrangler.jsonc instead of manual declaration
- See project-structure.md for tsconfig.json template and file organization

> **Cloudflare MCP:** For Workers type definitions, query `mcp__cloudflare__search_cloudflare_documentation` with `"Cloudflare Workers types workers-types"`.
</env_types>
<test_types>
| What to Test | Tool | Why |
|-------------|------|-----|
| Astro component (props/slots) | Vitest + Container API | Server-side render, check HTML output |
| React/Vue/Svelte island | Vitest + Container API + `loadRenderers()` | Requires framework renderer registration |
| API route (GET/POST) | Vitest + Container API | `container.renderToResponse()` with `routeType: 'endpoint'` |
| Astro Action (validation) | Vitest | Extract handler function, test with mock context |
| Content Collection schema | Vitest | `schema.parse()` / `schema.safeParse()` directly |
| Middleware logic | Vitest | Mock context and `next()`, test in isolation |
| Cloudflare binding logic (KV/D1/R2) | `@cloudflare/vitest-pool-workers` | Real workerd runtime, not Node.js emulation |
| E2E user flow | Playwright | Full browser, real server via `wrangler pages dev` |
| Visual regression | Playwright | `toHaveScreenshot()` with multiple viewports |
| SSR output validation | Playwright + wrangler | `wrangler pages dev ./dist` as webServer for Workers runtime |
</test_types>
<vitest_config>
```typescript
/// <reference types="vitest/config" />
// vitest.config.ts -- Astro + Cloudflare unit tests
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,astro}'],
      exclude: ['**/*.config.*', 'src/test/**'],
    },
  },
});
```

**Critical:** Use `getViteConfig()` from `astro/config` -- not `defineConfig()` from `vitest/config`. Standard `defineConfig` skips Astro file transforms, causing parse errors on `.astro` imports.
</vitest_config>
<container_api>
```typescript
// src/components/__tests__/Card.test.ts -- props, slots, named slots
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test, describe } from 'vitest';
import Card from '../Card.astro';

describe('Card component', () => {
  test('renders with props and default slot', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Card, {
      props: { title: 'Test Title' },
      slots: { default: '<p>Card content</p>' },
    });
    expect(html).toContain('Test Title');
    expect(html).toContain('Card content');
  });

  test('renders with named slots', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Card, {
      props: { title: 'With Badge' },
      slots: {
        default: 'Body text',
        badge: '<span>New</span>',
        footer: '<a href="/more">Read more</a>',
      },
    });
    expect(html).toContain('New');
    expect(html).toContain('Read more');
  });
});
```

**Framework components:** Add renderers for React/Vue/Svelte islands.

```typescript
// src/components/__tests__/ReactIsland.test.ts -- framework renderer
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getContainerRenderer } from '@astrojs/react';
import { test, expect } from 'vitest';
import MyWrapper from '../MyWrapper.astro';

test('renders React island inside Astro wrapper', async () => {
  const renderers = await loadRenderers([getContainerRenderer()]);
  const container = await AstroContainer.create({ renderers });
  const html = await container.renderToString(MyWrapper, {
    props: { count: 5 },
  });
  expect(html).toContain('5');
});
```
</container_api>
<bindings_test>
```typescript
// vitest.config.workers.ts -- separate config for binding tests
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          kvNamespaces: ['KV_CACHE'],
          d1Databases: ['DB'],
        },
      },
    },
  },
});
```

```typescript
// src/lib/__tests__/kv-cache.test.ts -- real workerd bindings
import { env } from 'cloudflare:test';
import { test, expect } from 'vitest';

test('KV put and get', async () => {
  await env.KV_CACHE.put('key:1', JSON.stringify({ name: 'Test' }));
  const data = await env.KV_CACHE.get('key:1', 'json');
  expect(data.name).toBe('Test');
});

test('D1 query', async () => {
  await env.DB.exec('CREATE TABLE IF NOT EXISTS users (id TEXT, name TEXT)');
  await env.DB.prepare('INSERT INTO users VALUES (?, ?)').bind('1', 'Alice').run();
  const result = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind('1').first();
  expect(result?.name).toBe('Alice');
});
```

**Run binding tests separately:** `vitest run --config vitest.config.workers.ts`

> **Cloudflare MCP:** For complete vitest-pool-workers options, query `mcp__cloudflare__search_cloudflare_documentation` with `"Cloudflare vitest-pool-workers configuration miniflare"`.
</bindings_test>
<playwright_config>
```typescript
// playwright.config.ts -- E2E with wrangler Workers runtime
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && wrangler pages dev ./dist --port 4321',
    url: 'http://localhost:4321',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
```

**Critical:** Use `wrangler pages dev ./dist` -- not `astro preview`. Only wrangler runs the actual Workers runtime with bindings, limits, and edge behavior.
</playwright_config>
<package_scripts>
```json
{
  "scripts": {
    "dev": "wrangler types && astro dev",
    "build": "wrangler types && astro check && tsc --noEmit && astro build",
    "preview": "astro build && wrangler pages dev ./dist",
    "typecheck": "astro sync && astro check && tsc --noEmit",
    "test:unit": "vitest run",
    "test:bindings": "vitest run --config vitest.config.workers.ts",
    "test:e2e": "playwright test"
  }
}
```
</package_scripts>
<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| `import { defineConfig } from 'vitest/config'` | `import { getViteConfig } from 'astro/config'` | CRITICAL |
| `moduleResolution: "node"` in tsconfig | `moduleResolution: "Bundler"` | CRITICAL |
| Install Vitest 4.x with Astro 5.x | Pin to Vitest `~3.x` (4.x causes rendering errors) | CRITICAL |
| `import { AstroContainer }` | `import { experimental_AstroContainer }` from `astro/container` | HIGH |
| `environment: 'happy-dom'` for all tests | `environment: 'node'` default, override per file for DOM testing | HIGH |
| Mock KV/D1 with plain JS objects | Use `@cloudflare/vitest-pool-workers` with real workerd | HIGH |
| Skip `astro check` in CI | Run `astro check && tsc --noEmit` -- catches template type errors tsc misses | MEDIUM |
| Use `astro preview` for E2E tests | Use `wrangler pages dev ./dist` to test Workers runtime | MEDIUM |
| Omit `strictNullChecks: true` | Enable it -- required for Content Collections Zod inference | MEDIUM |
| Skip `wrangler types` before dev/build | Add `wrangler types &&` prefix to dev and build scripts | MEDIUM |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module 'astro:content'` | `astro sync` not run or missing `content.config.ts` | Run `astro sync`, verify `src/content.config.ts` exists |
| `runtime` undefined in prerendered page | Prerendered pages have no Workers runtime at build time | Add `export const prerender = false` to the page |
| Vitest shows `[object Object]` errors | Using `defineConfig` instead of `getViteConfig` | Switch to `getViteConfig()` from `astro/config` |
| Container missing framework renderers | React/Vue/Svelte components render as empty | Add `loadRenderers([getContainerRenderer()])` to container setup |
| Types stale after schema change | `.astro/` cache outdated | Delete `.astro/` directory, run `astro sync` |
| `Cannot find module` in Vitest | `moduleResolution` set to `"node"` | Change to `"Bundler"` in tsconfig.json |
| E2E tests pass locally but fail in CI | Using `astro preview` instead of `wrangler pages dev` | Switch webServer command to `wrangler pages dev ./dist` |
| `env.DB` is undefined in test | Tests not using Cloudflare pool workers | Use `@cloudflare/vitest-pool-workers` with `defineWorkersConfig` |
| Type error on `Astro.locals.runtime` | Missing `App.Locals extends Runtime<Env>` | Add the declaration in `src/env.d.ts` |
| `astro check` finds errors tsc misses | Expected -- `astro check` validates `.astro` template expressions | Run both: `astro check && tsc --noEmit` |
| `'test' does not exist in type 'UserConfig'` | Vitest types not referenced | Add `/// <reference types="vitest/config" />` at top of vitest.config.ts |
</troubleshooting>