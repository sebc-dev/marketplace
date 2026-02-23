# Project Structure

Astro 5.x on Cloudflare: file organization, naming conventions, and config templates.

<quick_reference>
1. Place `content.config.ts` at `src/content.config.ts` -- not `src/content/config.ts`
2. Include `.astro/types.d.ts` in tsconfig -- not `src/env.d.ts`
3. Use `loader: glob()` in collections -- not `type: 'content'`
4. Use `entry.id` -- `entry.slug` is removed in Astro 5
5. Use `import { render } from 'astro:content'` -- not `entry.render()`
6. Put optimized images in `src/assets/`, static files in `public/`
7. Run `wrangler types` before `astro dev` to generate Cloudflare types
8. Use `imageService: 'compile'` or `'passthrough'` -- Sharp is incompatible with Workers
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
│   └── env.d.ts                        # Cloudflare Runtime types
├── public/
├── astro.config.mjs
├── wrangler.jsonc
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
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
  trailingSlash: 'never',
  compressHTML: true,
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
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
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
<cloudflare_runtime_types>
```typescript
/// <reference path="../.astro/types.d.ts" />

interface CloudflareEnv {
  SESSION: KVNamespace;      // KV binding
  DB: D1Database;            // D1 binding
  API_SECRET: string;        // Secret from .dev.vars
}
type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends Runtime {
    user?: { id: string; email: string };
  }
  interface SessionData { userId?: string; cart?: string[] }
}
```
</cloudflare_runtime_types>
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
<package_json_script>
```json
{
  "scripts": {
    "dev": "wrangler types && astro dev",
    "build": "wrangler types && astro check && astro build",
    "preview": "wrangler pages dev ./dist",
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
| Use Sharp as image service | `imageService: 'passthrough'` or `'compile'` | Sharp incompatible with Workers |
| Include `src/env.d.ts` in tsconfig | Include `.astro/types.d.ts` | Types not generated by Astro 5 |
| Skip `wrangler types` before dev | `wrangler types && astro dev` | Cloudflare Runtime types stale |
| Use `output: 'hybrid'` | Use `output: 'static'` (hybrid removed in v5) | Config error |
| Use `[...path].astro` with Server Islands | Use `[path].astro` (single param) | Infinite loop, browser crash |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module 'astro:content'` | `content.config.ts` in wrong location | Move to `src/content.config.ts` |
| `entry.slug is undefined` | Content Layer uses `id` not `slug` | Replace `slug` with `id` in all references |
| `entry.render is not a function` | Render API changed in Astro 5 | `import { render } from 'astro:content'; await render(entry)` |
| Types `astro:content` disappear after save | Known dev server bug | Restart dev server |
| `.env` values ignored locally | `.dev.vars` file exists | Remove `.dev.vars` or migrate all vars into it |
| `Image service "Sharp" not compatible` | Cloudflare adapter active | Set `imageService: 'passthrough'` in adapter config |
| KV/D1 types incorrect after config change | Types not regenerated | Run `wrangler types` then restart dev server |
| `Could not resolve "events"` or `"os"` | Node.js module on Workers | Add `"nodejs_compat"` to `compatibility_flags` |
| `Hydration completed but contains mismatches` | Cloudflare Auto Minify enabled | Disable Auto Minify in Cloudflare dashboard |
| Server Island infinite loop | Catch-all `[...path].astro` route | Rename to `[path].astro` single-segment param |
</troubleshooting>