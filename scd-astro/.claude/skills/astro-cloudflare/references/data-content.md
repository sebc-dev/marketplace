# Data and Content

Content Layer API, loaders, collections, Live Collections, Astro Actions, MDX/Markdoc on Cloudflare Workers.

<quick_reference>
1. Place config at `src/content.config.ts` -- not `src/content/config.ts` (first migration error)
2. Use `loader: glob({ pattern, base })` -- not `type: 'content'` (removed in v6)
3. Use `entry.id` -- not `entry.slug` (removed in v5)
4. Import render separately: `import { render } from 'astro:content'` then `render(entry)` -- not `entry.render()`
5. Use `z` from `astro/zod` -- not from `zod` package (types incompatible)
6. Use `createSchema` -- not `schema` function in loaders (v6 breaking change)
7. Always `export const prerender = true` on content collection pages for Cloudflare -- Workers has no filesystem at runtime
8. Use `file()` loader for single JSON/YAML files -- supports custom `parser` option for CSV
9. Use inline async loader for external API data -- return array with `id` property on each item
10. Use `reference('collection')` for inter-collection relationships
11. Zod 4 syntax: `z.email()` not `z.string().email()`, `{ error: "..." }` not `{ message: "..." }`
12. Run `npx astro sync` after schema changes to regenerate types
13. Filter drafts manually: `getCollection("posts", ({data}) => !data.draft)` -- no automatic filtering
14. `Astro.glob()` is removed -- use `import.meta.glob()` or Content Collections
15. Live Collections (`defineLiveCollection`) for real-time SSR content -- requires `prerender = false`
</quick_reference>
<loader_selection_matrix>
| Data Source | Loader | Reason |
|-------------|--------|--------|
| Local Markdown/MDX files | `glob({ pattern: '**/*.{md,mdx}', base })` | Pattern matching, auto-generated ID, HMR in dev |
| Single JSON or YAML file | `file('./src/data/file.json')` | Auto-parsing, simple config |
| CSV with custom parser | `file('./path.csv', { parser })` | Custom parser function (e.g., `csv-parse/sync`) |
| External REST API | Inline `async () => fetch()` returning `[{ id, ... }]` | Compact, sufficient for 90% of API cases |
| API with sync tokens | Object loader with `meta.get/set` | Persist sync state between builds |
| Storyblok CMS | `@storyblok/astro` v6.0+ `storyblokLoader()` | Official integration, Content Layer built-in |
| RSS/Atom feeds | `@ascorbic/feed-loader` | Maintained by Astro core team member |
| Airtable | `@ascorbic/airtable-loader` | Maintained by Astro core team member |
</loader_selection_matrix>
<actions_vs_api_routes>
| Use Case | Choice | Why |
|----------|--------|-----|
| Form submission with validation | Action (`accept: 'form'`) | Type-safe input, progressive enhancement, auto form parsing |
| REST API for external consumers | API route (`src/pages/api/`) | Standard HTTP verbs, content negotiation, no Astro client needed |
| Type-safe mutation from client | Action | End-to-end type safety, auto-serialization, `actions` import |
| Webhook handler (CMS, Stripe) | API route | Raw request access, custom headers, signature verification |
| File upload | API route | Stream handling, multipart parsing, Workers-compatible |
| Server-to-server callback | API route | No client context, standard HTTP response |
| Progressive enhancement form | Action (`accept: 'form'`) | Works without JS, `actionResult()` for server-rendered response |
| CRUD endpoint | API route | RESTful design, `GET`/`POST`/`PUT`/`DELETE` exports |
</actions_vs_api_routes>
<content_layer_config>
```typescript
// src/content.config.ts -- Astro 6 Content Layer API
import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/data/blog' }),
  // v6: use createSchema instead of schema for image() and other helpers
  createSchema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().check(z.maxLength(160)),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    cover: image(),
    author: reference('authors'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  loader: file('./src/data/authors.json'),
  schema: z.object({
    name: z.string(),
    email: z.email(),
    bio: z.string().check(z.maxLength(500)),
  }),
});

export const collections = { blog, authors };
```
</content_layer_config>

<csv_file_loader>
## CSV File Loader

```typescript
// src/content.config.ts -- CSV with custom parser
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse as parseCsv } from 'csv-parse/sync';

const products = defineCollection({
  loader: file('src/data/products.csv', {
    parser: (text) => parseCsv(text, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
    }),
  }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    category: z.string(),
  }),
});

export const collections = { products };
```
</csv_file_loader>
<inline_async_loader>
```typescript
// src/content.config.ts -- external API loader
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const countries = defineCollection({
  loader: async () => {
    const res = await fetch('https://restcountries.com/v3.1/all');
    const data = await res.json();
    // Each item MUST have an 'id' property
    return data.map((c: any) => ({
      id: c.cca3,
      name: c.name.common,
      population: c.population,
    }));
  },
  schema: z.object({
    name: z.string(),
    population: z.number(),
  }),
});

export const collections = { countries };
```
</inline_async_loader>

<astro_actions_basic_signature>
## Astro Actions Basic Signature

```typescript
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { env } from 'cloudflare:workers';

export const server = {
  addToCart: defineAction({
    accept: 'form',
    input: z.object({
      productId: z.string(),
      quantity: z.number().int().check(z.positive()).default(1),
    }),
    handler: async (input) => {
      // Astro 6: import { env } from 'cloudflare:workers' at module level
      const db = env.DB;
      return { success: true, productId: input.productId };
    },
  }),
};

// Call from client:
// import { actions } from 'astro:actions';
// const result = await actions.addToCart({ productId: 'SKU-1' });
```

Note: CSRF protection and advanced validation patterns belong in security-advanced.md (Phase 4).
</astro_actions_basic_signature>
<mdx_markdoc_decision>
| Format | Use When | Key Difference |
|--------|----------|----------------|
| `.md` (Markdown) | No component imports needed, standard prose | Supports `<Component />` in template but no imports in file |
| `.mdx` (MDX) | JSX imports, interactive components, expressions | Full JSX support, `import` statements, `{expressions}` |
| `.mdoc` (Markdoc) | Safe authoring, custom tags, non-technical editors | Blocks HTML/JS by default, uses `{% tag %}` syntax |

- MDX inherits from `markdown.*` config -- do NOT duplicate plugins in `mdx()` options
- Markdoc uses `markdoc.config.mjs` for custom tag definitions
- Both process at build-time only -- fully compatible with Cloudflare Workers
- Use `{/* comment */}` in MDX -- not `<!-- comment -->` (parsing error)
- Close self-closing tags in MDX: `<br />` not `<br>`
</mdx_markdoc_decision>
<rendering_content>
```astro
---
// src/pages/blog/[id].astro
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Heading from '../../components/Heading.astro';
import Blockquote from '../../components/Blockquote.astro';

export const prerender = true; // Required for Cloudflare

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map(post => ({ params: { id: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content, headings, remarkPluginFrontmatter } = await render(post);
---
<BaseLayout title={post.data.title}>
  <p>{remarkPluginFrontmatter.minutesRead}</p>
  <Content components={{ h2: Heading, blockquote: Blockquote }} />
</BaseLayout>
```
</rendering_content>
<querying_collections>
```typescript
// Get all entries with filter
import { getCollection, getEntry } from 'astro:content';

// Filter by data field -- second arg is filter function
const published = await getCollection('blog', ({ data }) => {
  return !data.draft && data.pubDate <= new Date();
});

// Get single entry by collection + id
const post = await getEntry('blog', 'my-first-post');

// Resolve reference fields
const author = await getEntry(post.data.author);
```
</querying_collections>
<live_collections>
## Live Collections (Astro 6)

Live Collections fetch content at request time (SSR) instead of build time. Requires `prerender = false`.

```typescript
// src/live.config.ts -- separate config for live collections
import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';

const announcements = defineLiveCollection({
  // No loader -- data fetched at request time via getLiveCollection/getLiveEntry
  schema: z.object({
    title: z.string(),
    body: z.string(),
    publishedAt: z.coerce.date(),
  }),
});

export const collections = { announcements };
```

```astro
---
// src/pages/announcements.astro -- SSR page using live collection
import { getLiveCollection } from 'astro:content';

export const prerender = false; // Required for live collections

const { entries, error } = await getLiveCollection('announcements');
if (error) {
  // Handle error gracefully -- entries may be stale or empty
  console.error('Live collection error:', error);
}
---
<ul>
  {entries.map(entry => <li>{entry.data.title}</li>)}
</ul>
```

```typescript
// Single entry fetch
import { getLiveEntry } from 'astro:content';

const { entry, error } = await getLiveEntry('announcements', 'welcome');
if (error) {
  // entry may be undefined if not found
}
```

Key rules:
- Config goes in `src/live.config.ts` (separate from `src/content.config.ts`)
- Always destructure `{ entries, error }` or `{ entry, error }` -- never assume success
- Pages using live collections MUST set `export const prerender = false`
- Compatible with Cloudflare Workers SSR
</live_collections>
<ssr_data_fetching_on_cloudflare>
```typescript
// src/pages/api/products.ts -- API route with timeout and cache
import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export async function GET() {
  // Astro 6: use 'cloudflare:workers' import instead of locals.runtime.env
  const kv = env.MY_KV;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://api.example.com/products', {
      signal: controller.signal,
      cf: {
        cacheTtl: 300,
        cacheEverything: true,
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(`API Error: ${response.status}`, { status: 502 });
    }
    return Response.json(await response.json());
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return new Response('Request timeout', { status: 504 });
    }
    return new Response('Service unavailable', { status: 503 });
  }
}
```
</ssr_data_fetching_on_cloudflare>
<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| `Astro.glob()` | `import.meta.glob()` or Content Collections | CRITICAL (removed v6) |
| `type: 'content'` in defineCollection | `loader: glob({ pattern, base })` | CRITICAL |
| `schema: ({ image }) =>` with helpers | `createSchema: ({ image }) =>` | CRITICAL (v6 silent failure) |
| `locals.runtime.env` / `Astro.locals.runtime.env` | `import { env } from 'cloudflare:workers'` | CRITICAL |
| `entry.slug` | `entry.id` | CRITICAL |
| `entry.render()` | `import { render } from 'astro:content'` | CRITICAL |
| `import { z } from 'zod'` | `import { z } from 'astro/zod'` | CRITICAL |
| `z.string().email()` | `z.email()` (Zod 4) | HIGH |
| `{ message: "..." }` in Zod refinements | `{ error: "..." }` (Zod 4) | HIGH |
| Read filesystem in SSR on Cloudflare | Prerender with `export const prerender = true` | HIGH |
| `fetch()` SSR without timeout | `AbortController` with 5-10s `setTimeout` | HIGH |
| `image().refine()` for dimension validation | Validate at runtime in component (removed v5) | HIGH |
| Duplicate remarkPlugins in markdown AND mdx config | Configure in `markdown.*` only, MDX inherits | HIGH |
| Schema too permissive (`z.any()`) | Type explicitly with `.default()` fallbacks | MEDIUM |
| Community loaders >1 year without update | Check for maintained fork or use inline loader | MEDIUM |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot find module 'astro:content'` | Config file wrong location | Move to `src/content.config.ts` and run `npx astro sync` |
| `entry.slug is undefined` | v5 breaking change | Replace with `entry.id` in all references |
| `entry.render is not a function` | v5 API change | `import { render } from 'astro:content'; await render(entry)` |
| Collection empty without error | `glob()` base path invalid | Verify path is relative to project root |
| `ENOENT` or file not found on SSR Cloudflare | Workers has no filesystem at runtime | Add `export const prerender = true` |
| Frontmatter properties missing in `entry.data` | v6 filters undeclared fields | Add to schema or use `z.passthrough()` |
| `image()` helper returns undefined | Using `schema` instead of `createSchema` | Change to `createSchema: ({ image }) =>` (v6 breaking) |
| Zod validation `error` field not recognized | Zod 4 renamed `message` to `error` | Update all `{ message: "..." }` to `{ error: "..." }` |
| `z.string().email()` type error | Zod 4 API change | Use `z.email()` directly (top-level validators) |
| `Astro.locals.runtime` is undefined | Removed in Astro 6 Cloudflare adapter | `import { env } from 'cloudflare:workers'` at module level |
| `Astro.glob is not a function` | Removed in Astro 6 | Use `import.meta.glob()` or Content Collections |
| Shiki theme unchanged after config change | Content Collections cache | Delete `.astro/data-store.json` and restart |
| Types `astro:content` disappear after save | Dev server bug | Restart dev server or run `npx astro sync` |
| `fetch()` timeout on SSR | CPU time exceeded or no error handling | `AbortController` + `try/catch` with 5-10s limit |
</troubleshooting>
