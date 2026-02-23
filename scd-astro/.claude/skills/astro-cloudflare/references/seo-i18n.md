# SEO and Internationalization

Meta tags, sitemap, OpenGraph, JSON-LD structured data, i18n routing, hreflang, and language detection for Astro 5.x on Cloudflare Workers.

<quick_reference>
1. Always define `site` in astro.config.mjs -- required by sitemap, RSS, canonical URLs, and absolute og:image
2. Use `new URL(Astro.url.pathname, Astro.site)` for canonical URLs -- never hardcode domain or use `Astro.url.href` (returns localhost in SSG)
3. Use `set:html={JSON.stringify(schema)}` for JSON-LD -- Astro escapes `<script>` content by default, breaking JSON
4. Set `trailingSlash: 'never'` in config -- avoids duplicate canonical URLs and sitemap mismatches
5. Prerender SEO endpoints (sitemap, RSS, robots.txt) with `export const prerender = true` -- avoids Workers CPU timeouts
6. Use `workers-og` for dynamic OG images on Cloudflare Workers -- Sharp and resvg are incompatible with workerd runtime
7. Always use absolute HTTPS URLs for og:image -- social crawlers do not resolve relative URLs
8. Set `prefixDefaultLocale: true` for consistent URL structure across all locales (`/en/about`, `/fr/about`)
9. Set `redirectToDefaultLocale: false` to prevent redirect loops on Cloudflare (`/en/en/en/...`)
10. Use `Astro.currentLocale` to detect locale in pages -- `Astro.preferredLocale` returns Accept-Language header value, not URL locale
11. Generate `x-default` hreflang manually -- no Astro library generates it automatically
12. Use Paraglide (Inlang) for translations on Workers -- astro-i18next abandoned 3 years, fs-backend incompatible
</quick_reference>
<seo_component>
```astro
---
// src/components/SEOHead.astro -- reusable SEO head component
interface Props {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const { title, description, image = '/og-default.png', type = 'website', noindex = false } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const imageURL = new URL(image, Astro.site);
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />
{noindex && <meta name="robots" content="noindex, nofollow" />}
<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={imageURL} />
<meta name="twitter:card" content="summary_large_image" />
```

Build this manually instead of using `astro-seo` (unmaintained 2+ years, not tested with Astro 5.x). The manual component provides equivalent type-safety with zero dependency risk.
</seo_component>
<sitemap_config>
```javascript
// astro.config.mjs -- sitemap with filter and serialize
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin/') && !page.includes('/drafts/'),
      serialize(item) {
        if (item.url === 'https://example.com/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        return item;
      },
      // Add i18n alternates in sitemap
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en-US', fr: 'fr-FR' },
      },
    }),
  ],
});
```

For full SSR sites, `@astrojs/sitemap` does not discover dynamic routes automatically. Create a custom sitemap endpoint with `export const prerender = true` to build a static XML file from your data source.
</sitemap_config>
<json_ld>
```astro
---
// src/components/JsonLd.astro -- type-safe structured data
// Optional: npm install schema-dts for TypeScript types
interface Props {
  schema: Record<string, unknown> | Record<string, unknown>[];
}

const { schema } = Astro.props;
const jsonLd = Array.isArray(schema)
  ? { "@context": "https://schema.org", "@graph": schema }
  : { ...schema, "@context": "https://schema.org" };
---
<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

Use `@graph` to combine multiple schemas (Organization + BreadcrumbList + Article) in a single `<script>` tag. Install `schema-dts` for optional TypeScript types on schema properties.
</json_ld>

<rss_endpoint>
## RSS Endpoint

```typescript
// src/pages/rss.xml.ts -- RSS with Content Collections
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export const prerender = true; // Required for Cloudflare Workers

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return rss({
    title: 'My Blog',
    description: 'Recent posts',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
}
```

Filter drafts with `({ data }) => !data.draft` in `getCollection`. Use `post.id` (not `post.slug` -- removed in Astro 5).
</rss_endpoint>
<i18n_config>
```javascript
// astro.config.mjs -- i18n routing for Cloudflare
export default defineConfig({
  site: 'https://example.com',
  output: 'server',
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    routing: {
      prefixDefaultLocale: true,       // /en/about and /fr/about
      redirectToDefaultLocale: false,   // Prevents redirect loops
      fallbackType: 'rewrite',         // Show fallback content without visible redirect
    },
    fallback: {
      fr: 'en', // Missing FR pages serve EN content
    },
  },
});
```

The `prefixDefaultLocale: true` + `redirectToDefaultLocale: false` combo prevents 90% of documented redirect loop bugs. The `redirectToDefaultLocale` default will change to `false` in Astro 6.
</i18n_config>
<hreflang>
```astro
---
// src/components/HrefLangs.astro -- hreflang with x-default
const LOCALES = ['en', 'fr'];
const DEFAULT_LOCALE = 'en';
const siteUrl = Astro.site?.toString().replace(/\/$/, '') || '';
const currentPath = Astro.url.pathname;

function getCanonicalPath(path: string): string {
  return path.replace(/^\/(en|fr)\//, '/').replace(/^\/(en|fr)$/, '/');
}

function buildLocalizedUrl(path: string, locale: string): string {
  const cleanPath = getCanonicalPath(path);
  return `${siteUrl}/${locale}${cleanPath === '/' ? '' : cleanPath}`;
}
---
<link rel="canonical" href={`${siteUrl}${currentPath}`} />
{LOCALES.map((locale) => (
  <link rel="alternate" hreflang={locale} href={buildLocalizedUrl(currentPath, locale)} />
))}
<link rel="alternate" hreflang="x-default" href={buildLocalizedUrl(currentPath, DEFAULT_LOCALE)} />
```

Every page must include self-referencing canonical + all locale alternates + x-default. No Astro package generates x-default automatically -- always add it manually.
</hreflang>
<translation_matrix>
| Scenario | Solution | Why |
|----------|----------|-----|
| 2 languages, < 50 keys | Manual JSON with `as const` typing | Zero dependencies, full TypeScript autocomplete |
| 3+ languages, growing content | Paraglide (Inlang) | Tree-shaking (-70% bundle), Workers-compatible, actively maintained |
| Content-heavy i18n (blog, docs) | Content Collections per locale | Separate files per language, locale field in schema |
| URL-only i18n (no UI strings) | Astro built-in `i18n.routing` | Native routing, no translation library needed |
| CMS-driven translations | CMS API + locale param | Translations managed in CMS, fetched at build/runtime |
| Full app with pluralization | Paraglide with ICU messages | `Intl.PluralRules` support, message extraction tooling |
</translation_matrix>
<language_detection>
```typescript
// src/middleware.ts -- SSR language detection for Cloudflare
import { defineMiddleware } from 'astro:middleware';

const SUPPORTED = ['en', 'fr'] as const;
const DEFAULT = 'en';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const pathLocale = pathname.split('/')[1];

  // Route already prefixed -- continue
  if (SUPPORTED.includes(pathLocale as any)) return next();

  // Root "/" -- detect and redirect
  if (pathname === '/' || pathname === '') {
    const acceptLang = context.request.headers.get('accept-language') || '';
    const browserLang = acceptLang.slice(0, 2).toLowerCase();
    const target = SUPPORTED.includes(browserLang as any) ? browserLang : DEFAULT;
    return context.redirect(`/${target}/`, 302);
  }

  // Unprefixed paths -- redirect to default locale
  return context.redirect(`/${DEFAULT}${pathname}`, 301);
});
```

Use SSR middleware for language detection -- Cloudflare `_redirects` does not support Accept-Language conditions. Always use 302 (temporary) for language detection redirects so search engines index locale-specific URLs.
</language_detection>
<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| Omit `site` in astro.config.mjs | Always define `site: 'https://...'` | CRITICAL |
| `redirectToDefaultLocale: true` with prefix config | `redirectToDefaultLocale: false` | CRITICAL |
| Use `astro-seo` package | Build manual `<SEOHead />` component | HIGH |
| Relative og:image URLs (`/og.png`) | `new URL('/og.png', Astro.site).href` | HIGH |
| `Astro.preferredLocale` for page routing | `Astro.currentLocale` (URL-based) | HIGH |
| `Astro.url.href` for canonical URLs | `new URL(Astro.url.pathname, Astro.site)` | HIGH |
| Use `astro-i18next` for translations | Paraglide or manual JSON | MEDIUM |
| JSON-LD with `{JSON.stringify()}` in script | `set:html={JSON.stringify(schema)}` | MEDIUM |
| Cache SSR pages on `Vary: Accept-Language` | Use distinct URLs per locale (`/en/`, `/fr/`) | MEDIUM |
| Single root 404.astro with i18n enabled | Create `/[locale]/404.astro` per locale | MEDIUM |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| Sitemap returns 404 | Missing `export const prerender = true` on SSR site | Add prerender directive to sitemap endpoint |
| Canonical URL shows localhost | Missing `site` in astro.config.mjs | Add `site: 'https://yourdomain.com'` |
| JSON-LD not detected by Google | Using `{JSON.stringify()}` instead of `set:html` | Use `set:html={JSON.stringify(schema)}` on script tag |
| Wrong language served on Cloudflare | CDN caching ignores Accept-Language header | Use URL-prefixed locales, not same-URL language switching |
| 404 not displayed with i18n SSR | Root 404.astro routing bug with i18n | Create `/pages/[locale]/404.astro` explicitly |
| OG image not rendering on social platforms | Relative URL or Sharp used on Workers | Use absolute HTTPS URL, use `workers-og` for dynamic images |
| Redirect loop on locale switch | `redirectToDefaultLocale: true` with `prefixDefaultLocale: true` | Set `redirectToDefaultLocale: false` |
| RSS feed returns empty items | `getCollection` not filtering drafts, or missing prerender | Filter with `({ data }) => !data.draft`, add `prerender = true` |
</troubleshooting>
