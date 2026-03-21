# Project Structure

Astro 6.x on Cloudflare: file organization, naming conventions, and config templates.

<quick_reference>
1. Place `content.config.ts` at `src/content.config.ts` -- not `src/content/config.ts`
2. Include `.astro/types.d.ts` in tsconfig -- not `src/env.d.ts`
3. Use `loader: glob()` in collections -- not `type: 'content'`
4. Use `entry.id` -- `entry.slug` is removed
5. Use `import { render } from 'astro:content'` -- not `entry.render()`
6. Put optimized images in `src/assets/`, static files in `public/`
7. Default imageService is `cloudflare-binding` -- Sharp is incompatible with Workers
8. Node 22+ required -- Astro 6 drops Node 18/20
9. `wrangler.jsonc` is optional -- Astro reads bindings from `astro.config.mjs`
10. `src/live.config.ts` for Astro Live (optional) -- real-time sync config
</quick_reference>
<file_organization>
<simple_site>
```
project/
├── src/
│   ├── pages/              # File-based routing (kebab-case)
│   │   ├── index.astro
│   │   └── [service].astro # Dynamic route
│   ├── components/         # PascalCase (.astro, .tsx)
│   ├── layouts/            # PascalCase (BaseLayout.astro)
│   ├── content/blog/       # Collection data (markdown, yaml)
│   ├── assets/             # Optimized images (processed by Astro)
│   ├── styles/             # Global CSS
│   └── content.config.ts   # Content Layer config (src/ root!)
├── public/                 # Static files served as-is
├── astro.config.mjs
├── tsconfig.json
└── package.json
```
</simple_site>
<complex_ssg_ssr_server_island>
```
project/
├── src/
│   ├── pages/
│   │   ├── index.astro                 # SSG (default)
│   │   ├── blog/[slug].astro           # SSG
│   │   ├── app/dashboard.astro         # SSR (prerender = false)
│   │   └── api/contact.ts              # API endpoint
│   ├── components/
│   │   ├── ui/                         # Atomic (Button.astro, Card.astro)
│   │   ├── blocks/                     # Composite (Hero.astro, Pricing.astro)
│   │   ├── islands/                    # Hydrated (ContactForm.tsx)
│   │   └── server/                     # Server Islands (UserProfile.astro)
│   ├── layouts/
│   ├── actions/
│   │   └── index.ts                    # export const server = { ... }
│   ├── lib/                            # Business logic (db.ts, auth.ts)
│   ├── utils/                          # Pure utilities (formatDate.ts)
│   ├── types/                          # Shared types
│   ├── middleware.ts                    # Astro middleware
│   ├── content/
│   ├── assets/
│   ├── content.config.ts
│   ├── env.d.ts                        # Cloudflare env types
│   └── live.config.ts                  # Astro Live config (optional)
├── public/
├── astro.config.mjs
├── wrangler.jsonc                      # Optional (Astro reads bindings natively)
├── tsconfig.json
├── .dev.vars                           # Cloudflare local env (not .env)
└── package.json
```
</complex_ssg_ssr_server_island>
</file_organization>
<naming_conventions>
| Element | Convention | Example |
|---------|-----------|---------|
| Component | PascalCase | `HeaderNav.astro`, `ContactForm.tsx` |
| Page | kebab-case | `about-us.astro`, `our-services.astro` |
| Layout | PascalCase | `BaseLayout.astro`, `BlogLayout.astro` |
| Dynamic route | `[param]` | `[slug].astro`, `[id].astro` |
| Rest route | `[...param]` | `[...path].astro` (avoid with Server Islands) |
| Collection dir | kebab-case | `blog/`, `case-studies/` |
| Content file | kebab-case | `my-post.md`, `web-design.yaml` |
| Content config | Exact | `src/content.config.ts` |
| Action | camelCase | `submitContact`, `subscribeNewsletter` |
| Actions entry | Exact | `src/actions/index.ts` |
| Middleware | Exact | `src/middleware.ts` |
| API route | kebab-case | `src/pages/api/send-email.ts` |
| Utility | camelCase | `formatDate.ts`, `validateEmail.ts` |
| Unit test | `.test.ts` | `Button.test.ts`, `formatDate.test.ts` |
| E2E test | `.spec.ts` | `contact-form.spec.ts` |
</naming_conventions>
<config_templates>
<ssg_config>
```javascript
import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://example.com',
  trailingSlash: 'never',
  compressHTML: true,
});
```
</ssg_config>
<ssr_cloudflare_config>

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
export default defineConfig({
  site: 'https://example.com',
  output: 'server',
  adapter: cloudflare({
    imageService: 'cloudflare-binding',
  }),
  trailingSlash: 'never',
  compressHTML: true,
  security: {
    csp: true, // Content-Security-Policy (nonce-based)
  },
});
```
</ssr_cloudflare_config>
<static_default_with_ssr_config>

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
export default defineConfig({
  site: 'https://example.com',
  adapter: cloudflare({
    imageService: 'cloudflare-binding',
  }),
  fonts: {
    families: [{ name: 'Inter', provider: 'google' }],
  },
});
// Pages needing SSR: export const prerender = false
```
</static_default_with_ssr_config>
<tsconfig>
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strictNullChecks": true,
    "allowJs": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```
</tsconfig>
<cloudflare_env_types>
```typescript
/// <reference path="../.astro/types.d.ts" />

// Access bindings via: import { env } from 'cloudflare:workers';
// env.SESSION, env.DB, env.API_SECRET — no Astro.locals needed

declare namespace App {
  interface Locals {
    cfContext: ExecutionContext;
    user?: { id: string; email: string };
  }
  interface SessionData { userId?: string; cart?: string[] }
}
```
</cloudflare_env_types>
<content_config>
### src/content.config.ts

```typescript
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});
const testimonials = defineCollection({
  loader: file('./src/data/testimonials.json'),
  schema: z.object({ name: z.string(), company: z.string(), quote: z.string() }),
});
export const collections = { blog, testimonials };
```
</content_config>
<wrangler_jsonc>
```jsonc
{
  // wrangler.jsonc is optional in Astro 6 — Astro reads bindings natively
  "name": "my-project",
  "compatibility_date": "2025-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "not_found_handling": "single-page-application",
  // No "main" field needed — Astro generates the entry point
  "kv_namespaces": [{ "binding": "SESSION", "id": "abc123" }],
  "d1_databases": [{ "binding": "DB", "database_name": "mydb", "database_id": "def456" }]
}
```
</wrangler_jsonc>
<package_json_script>
```json
{
  "scripts": {
    "dev": "wrangler types && astro dev",
    "build": "wrangler types && astro check && astro build",
    "preview": "astro preview",
    "deploy": "npm run build && wrangler pages deploy ./dist",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```
</package_json_script>
<gitignore>
```
dist/
.astro/
node_modules/
.wrangler/
.dev.vars
```
</gitignore>
</config_templates>
<anti_patterns>
| Don't | Do | Impact |
|-------|-----|--------|
| Place `content.config.ts` in `src/content/` | `src/content.config.ts` (src root) | Build fails, collections not detected |
| Use `type: 'content'` in defineCollection | `loader: glob({ pattern, base })` | Deprecated, types break |
| Reference `entry.slug` | Use `entry.id` | Undefined at runtime |
| Call `entry.render()` | `import { render } from 'astro:content'` | Method removed from entry object |
| Use `.dev.vars` AND `.env` together | Choose one; `.dev.vars` ignores `.env` | Env values silently missing |
| Use Sharp as image service | `imageService: 'cloudflare-binding'` (default) | Sharp incompatible with Workers |
| Include `src/env.d.ts` in tsconfig | Include `.astro/types.d.ts` | Types not generated by Astro |
| Use `Astro.locals.runtime.env.MY_VAR` | `import { env } from 'cloudflare:workers'` | `runtime` removed, use `cloudflare:workers` |
| Use `platformProxy` in adapter config | Remove it — workerd runs natively in dev | Option removed in Astro 6 |
| Extend `Runtime<Env>` in Locals | Declare `Locals { cfContext: ExecutionContext }` | `Runtime<Env>` type removed |
| Use `output: 'hybrid'` | Use `output: 'static'` (hybrid removed) | Config error |
| Use `[...path].astro` with Server Islands | Use `[path].astro` (single param) | Infinite loop, browser crash |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module 'astro:content'` | `content.config.ts` in wrong location | Move to `src/content.config.ts` |
| `entry.slug is undefined` | Content Layer uses `id` not `slug` | Replace `slug` with `id` in all references |
| `entry.render is not a function` | Render API changed | `import { render } from 'astro:content'; await render(entry)` |
| Types `astro:content` disappear after save | Known dev server bug | Restart dev server |
| `.env` values ignored locally | `.dev.vars` file exists | Remove `.dev.vars` or migrate all vars into it |
| `Cannot find module 'cloudflare:workers'` | Missing types or compat flags | Run `wrangler types`, ensure `nodejs_compat` flag |
| KV/D1 types incorrect after config change | Types not regenerated | Run `wrangler types` then restart dev server |
| `Could not resolve "events"` or `"os"` | Node.js module on Workers | Add `"nodejs_compat"` to `compatibility_flags` |
| `require is not defined` (CJS error) | CJS module used in Workers ESM | Replace with ESM import or use dynamic `import()` |
| `Astro.locals.runtime is undefined` | v5 pattern removed in Astro 6 | Use `import { env } from 'cloudflare:workers'` instead |
| Dev server missing bindings | workerd not running bindings | Ensure `wrangler types` ran and `astro dev` uses workerd |
| Server Island infinite loop | Catch-all `[...path].astro` route | Rename to `[path].astro` single-segment param |
</troubleshooting>
