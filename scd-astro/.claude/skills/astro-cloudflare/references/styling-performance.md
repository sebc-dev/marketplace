# Styling and Performance

Scoped styles, Tailwind v4, Fonts API, image optimization with cloudflare-binding, caching strategies, Core Web Vitals, and prefetch on Cloudflare Workers.

<quick_reference>
1. Use `@tailwindcss/vite` for Tailwind v4 -- `@astrojs/tailwind` is deprecated since Astro 5.2
2. Add `@reference "../styles/global.css"` in `<style>` blocks to use `@apply` with Tailwind v4 -- style blocks no longer access theme variables by default
3. Import global CSS in Layout before other imports -- guarantees lowest cascade precedence
4. Pass `class` prop AND `{...rest}` to child components -- propagates `data-astro-cid-*` for scoped style inheritance
5. Use `:global(.selector)` to mix scoped and global styles -- prefer over `is:global` for precision
6. Avoid CSS-in-JS runtime (styled-components/Emotion) for SSR on Cloudflare -- causes FOUC, streaming incompatibility, and CSP conflicts
7. Use `imageService: 'cloudflare-binding'` (new default in Astro 6) -- uses Cloudflare Images binding, auto-provisioned on deploy. Fallback: `imageService: { build: 'compile', runtime: 'cloudflare-binding' }` for dual-mode
8. Use `priority` attribute on the single LCP image per page -- enables `loading="eager"` + `decoding="sync"` + `fetchpriority="high"`
9. Use `layout="constrained"` as default image layout -- responsive shrink without upscale, generates srcset/sizes
10. Configure `/_astro/*` with `Cache-Control: public, max-age=31536000, immutable` in `public/_headers`
11. Use `build.inlineStylesheets: 'auto'` (default) -- inlines CSS < 4kB, externalizes otherwise
12. Use `--astro-code-foreground` for Shiki code block text color -- Shiki v4 in Astro 6 (renamed from `--astro-code-color-text` in Astro 5)
13. Disable Auto Minify in Cloudflare dashboard -- breaks Server Islands and causes hydration mismatches
14. Configure `prefetch.defaultStrategy: 'hover'` -- balance UX responsiveness and bandwidth consumption
15. Use Fonts API (`fonts` config + `<Font />` component) for self-hosted fonts -- auto-download, cache, fallback generation, GDPR-compliant
</quick_reference>
<image_service_selection>
| Scenario | Service | Reason |
|----------|---------|--------|
| Default Astro 6 on Cloudflare | `cloudflare-binding` (default) | Cloudflare Images binding, auto-provisioned `IMAGES` binding on deploy |
| Dual-mode: build-time + runtime | `{ build: 'compile', runtime: 'cloudflare-binding' }` | Compile at build for prerendered pages, cloudflare-binding at runtime for SSR |
| Prerendered-only site on Cloudflare | `compile` | Sharp at build time, no runtime transforms needed |
| SSR with Cloudflare Image Resizing (paid) | `cloudflare` | Direct Cloudflare Image Resizing API, 5K free transforms/month |
| No optimization needed | `passthrough` | CLS prevention preserved, no image transformation |
| Sharp on Workers | Never | Requires native bindings (`libvips`), incompatible with workerd |
| Dev local vs production | Both use workerd in Astro 6 | Dev server runs real workerd runtime, no dev/prod discrepancy |

```javascript
// astro.config.mjs -- Astro 6 image service options
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare({
    // Option 1: Default (cloudflare-binding)
    imageService: 'cloudflare-binding',

    // Option 2: Dual-mode (recommended for hybrid sites)
    // imageService: { build: 'compile', runtime: 'cloudflare-binding' },

    // Option 3: Build-only fallback
    // imageService: 'compile',
  }),
  image: {
    layout: 'constrained',        // default layout for <Image>
    responsiveStyles: true,        // false by default in v6 -- enable explicitly
  },
});
```
</image_service_selection>
<image_component_patterns>
```astro
---
// Hero image -- LCP element with priority
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---
<Image
  src={heroImage}
  alt="Hero banner"
  priority
  layout="full-width"
  fit="cover"
  position="center"
/>
<!-- Generates: loading="eager" decoding="sync" fetchpriority="high" -->
<!-- + srcset responsive + hashed CSS classes (CSP-compatible) -->
```

```astro
---
// Responsive image -- constrained layout (default)
import { Image } from 'astro:assets';
import productPhoto from '../assets/product.jpg';
---
<Image
  src={productPhoto}
  alt="Product photo"
  layout="constrained"
  width={800}
  height={600}
/>
<!-- Responsive styles use :where() selectors (specificity 0) for easy overrides -->
<!-- Styles emitted via data-astro-image attributes + hashed classes (not inline) -->
```

```astro
---
// Remote image with manual preload using getImage()
import { getImage } from 'astro:assets';
const hero = await getImage({
  src: 'https://cdn.example.com/hero.jpg',
  width: 1200, height: 630, format: 'webp',
});
---
<head>
  <link rel="preload" as="image" href={hero.src} fetchpriority="high" />
</head>
<img src={hero.src} {...hero.attributes} alt="Hero" loading="eager" />
```

Note: In Astro 6, responsive image styles use `data-astro-fit` / `data-astro-pos` attributes with hashed CSS classes instead of inline `--fit` / `--pos` custom properties. This change ensures CSP compatibility. Styles use `:where()` (specificity 0) for easy overrides.
</image_component_patterns>
<fonts_api>
Astro 6 Fonts API: auto-downloads, caches, self-hosts fonts with optimized fallbacks. All fonts served from your domain (GDPR-compliant, no third-party requests).

**Available providers:** `fontsource()`, `google()`, `bunny()`, `adobe({ id })`, `fontshare()`, `npm()`, `local()`, `googleicons()`

```javascript
// astro.config.mjs -- Fonts API configuration
import { defineConfig, fontProviders } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare({
    imageService: 'cloudflare-binding',
  }),
  fonts: [{
    provider: fontProviders.google(),
    name: 'Inter',
    cssVariable: '--font-inter',
    formats: ['woff2'],  // woff2 only by default in v6
  }, {
    provider: fontProviders.fontsource(),
    name: 'Fira Code',
    cssVariable: '--font-code',
  }, {
    provider: fontProviders.npm(),  // @fontsource/* packages
    name: 'Geist',
    cssVariable: '--font-geist',
  }, {
    provider: fontProviders.local(),
    name: 'CustomFont',
    cssVariable: '--font-custom',
    options: {
      variants: [
        { src: './fonts/custom-regular.woff2', weight: 400, style: 'normal' },
        { src: './fonts/custom-bold.woff2', weight: 700, style: 'normal' },
      ]
    }
  }],
});
```

```astro
---
// Layout.astro -- Font component for preload + @font-face injection
import { Font } from 'astro:assets';
---
<head>
  <Font cssVariable="--font-inter" preload />
  <Font cssVariable="--font-code" />
</head>
<style is:global>
  body { font-family: var(--font-inter); }
  code { font-family: var(--font-code); }
</style>
```

| Feature | Details |
|---------|---------|
| Default format | `woff2` only (add `formats: ['woff2', 'woff']` if woff fallback needed) |
| Cache locations | Dev: `.astro/fonts/`, Build: `node_modules/.astro/fonts/`, Prod: `_astro/fonts/` |
| Fallback fonts | Auto-generated with capsize metrics (ascender/descender adjusted) -- reduces CLS |
| Preload | `<Font cssVariable="..." preload />` adds `<link rel="preload">` hints |
| CSP compatible | Font-face CSS auto-hashed when `security.csp` is enabled |
| GDPR | All fonts self-hosted, zero third-party requests from user browser |
| Programmatic | `getFontData()` for OG image generation (Satori) |
</fonts_api>
<scoped_style_propagation>
```astro
---
// src/components/Button.astro
// Accept class prop and propagate data-astro-cid-* for parent styling
const { class: className, ...rest } = Astro.props;
---
<button class:list={["btn", className]} {...rest}>
  <slot />
</button>

<style>
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
  }
</style>
```

```astro
---
// src/pages/index.astro -- parent styles the child
import Button from '../components/Button.astro';
---
<Button class="primary">Click me</Button>

<style>
  /* Works because data-astro-cid is propagated via {...rest} */
  .primary {
    background: var(--color-brand);
    color: white;
  }
</style>
```

Note: In Astro 6, `<style>` tags render in source order (not reversed). If you had multiple `<style>` blocks relying on the old inverted order, reorder them to match desired cascade.
</scoped_style_propagation>
<css_approach_selection>
| Scenario | Approach | Reason |
|----------|----------|--------|
| Default component styling | Astro scoped `<style>` | Zero-runtime, automatic `data-astro-cid-*` scoping |
| Utility-first styling | Tailwind v4 via `@tailwindcss/vite` | Zero-runtime, tree-shaken, CSS-first config |
| Dynamic styles in React/Vue island | CSS Modules (`.module.css`) | SSR-compatible on Cloudflare, no runtime JS |
| Type-safe zero-runtime CSS | Vanilla Extract + `@vanilla-extract/vite-plugin` | Static extraction, compatible with Workers streaming |
| Global reset/typography | Import CSS in Layout component | Lowest cascade precedence when imported first |
| Dark mode code blocks | Shiki `css-variables` theme + CSS custom properties | Native dual-theme support via `--astro-code-*` variables (Shiki v4) |
| CSS variables from frontmatter | `define:vars={{ color }}` + `var(--color)` | Passes frontmatter values to CSS without JS runtime |
| Web fonts | Fonts API (`fonts` config + `<Font />`) | Self-hosted, optimized fallbacks, CLS reduction, CSP compatible |
</css_approach_selection>
<tailwind_v4_setup>
```javascript
// astro.config.mjs
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare({
    imageService: 'cloudflare-binding',
  }),
  fonts: [{
    provider: fontProviders.fontsource(),
    name: 'Inter',
    cssVariable: '--font-inter',
  }],
  vite: { plugins: [tailwindcss()] },
});
```

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.72 0.12 260);
  --font-sans: var(--font-inter);  /* integrates with Fonts API */
}

@plugin "@tailwindcss/typography";
```

```astro
---
// Component using @apply with @reference
---
<div class="card"><slot /></div>

<style>
  @reference "../../styles/global.css";

  .card {
    @apply p-4 rounded-lg bg-white shadow-md;
  }
</style>
```
</tailwind_v4_setup>
<caching_strategy>
| Asset Type | Cache-Control | Where to Configure |
|------------|---------------|-------------------|
| JS/CSS hashed (`/_astro/*`) | `public, max-age=31536000, immutable` | `public/_headers` |
| HTML pages | `public, max-age=0, must-revalidate` | `public/_headers` |
| Images hashed (`/_astro/*.webp`) | `public, max-age=31536000, immutable` | `public/_headers` |
| Images non-hashed (`/images/*`) | `public, max-age=86400, stale-while-revalidate=604800` | `public/_headers` |
| Fonts (`/_astro/fonts/*`) | `public, max-age=31536000, immutable` | `public/_headers` (auto-handled by Fonts API) |
| API SSR responses | `private, max-age=X` or `no-store` | Code (`Astro.response.headers.set()`) |
| Server Islands | `public, max-age=X` via response headers | Code (inside Server Island component) |

Note: `_headers` file does NOT apply to SSR responses -- set headers programmatically in code.

Experimental route caching (Astro 6): `experimental: { routeCaching: true }` enables platform-agnostic SSR response caching with `Astro.cache` API, stale-while-revalidate, and tag-based invalidation. Built-in `memoryCache` provider; Cloudflare-specific provider (KV/Cache API) planned.
</caching_strategy>
<headers_file_pattern>
```
# public/_headers

# Astro hashed assets -- fingerprinted, never change
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# HTML pages -- revalidate on every deploy
/*
  Cache-Control: public, max-age=0, must-revalidate

# Fonts -- immutable (Fonts API outputs to /_astro/fonts/)
/fonts/*
  Cache-Control: public, max-age=31536000, immutable

# Non-hashed images -- 1 day cache + 7 day stale fallback
/images/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

# Security headers (all routes)
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
```
</headers_file_pattern>
<prefetch_strategy>
| Link Type | Strategy | Why |
|-----------|----------|-----|
| Main navigation | `hover` (default) | Balance responsiveness and bandwidth |
| Static frequently visited pages | `viewport` | Prefetch when visible, fluid UX |
| Heavy SSR pages | `tap` | Avoid unnecessary Workers invocations |
| API endpoints / server actions | `false` | Never prefetch server-side actions |
| With ClientRouter (View Transitions) | Override `prefetchAll: false` | ClientRouter defaults to `true`, can overwhelm |

```javascript
// astro.config.mjs
export default defineConfig({
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});
```

```astro
<!-- Prefetch per-link overrides -->
<nav>
  <a href="/about" data-astro-prefetch>About</a>
  <a href="/products" data-astro-prefetch="viewport">Products</a>
  <a href="/dashboard" data-astro-prefetch="tap">Dashboard</a>
  <a href="/api/report" data-astro-prefetch="false">Generate Report</a>
</nav>
```
</prefetch_strategy>
<ssr_cache_headers>
Set cache headers in code for SSR responses -- `_headers` file only applies to static assets.

```astro
---
// SSR page with cache control
export const prerender = false;
Astro.response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
Astro.response.headers.set('CDN-Cache-Control', 'public, max-age=3600');
---
```

```astro
---
// Server Island component with cache
import { env } from 'cloudflare:workers';
const country = Astro.request.headers.get('cf-ipcountry') || 'US';
const price = await getPrice(country);
Astro.response.headers.set('Cache-Control', 'public, max-age=3600');
---
<span>{price.formatted}</span>
```
</ssr_cache_headers>
<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| Sharp image service on Cloudflare SSR | `imageService: 'cloudflare-binding'` (Astro 6 default) | CRITICAL |
| `styled-components` for SSR on Cloudflare | CSS Modules, Tailwind, Panda CSS, Vanilla Extract | CRITICAL |
| CSS-in-JS runtime + CSP enabled | Build-time solutions only (Tailwind, Panda, Vanilla Extract) | CRITICAL |
| `@astrojs/tailwind` for Tailwind v4 | `@tailwindcss/vite` plugin in Vite config | HIGH |
| `@apply` without `@reference` in Tailwind v4 | Add `@reference "../../styles/global.css"` in `<style>` | HIGH |
| Fonts in `public/` directory | Fonts API (`fonts` config) or `src/assets/fonts/` | HIGH |
| Manual font packages (fontsource npm) | Fonts API with `fontProviders.fontsource()` or `fontProviders.npm()` | HIGH |
| `--astro-code-color-text` (pre-Shiki v4 variable) | `--astro-code-foreground` (Shiki v4 in Astro 6) | HIGH |
| Images without `priority` on LCP element | Add `priority` attribute on hero image | HIGH |
| Inline styles on responsive images (v5 pattern) | Use `data-astro-fit` / `data-astro-pos` attributes (v6 classes) | HIGH |
| `image.responsiveStyles` assumed true | Set `responsiveStyles: true` explicitly (default `false` in v6) | MEDIUM |
| `<link rel="stylesheet">` for local CSS | `import './style.css'` in frontmatter for bundling | MEDIUM |
| `is:global` for a single selector | `:global(.selector)` in scoped style block | MEDIUM |
| `client:only` components with Tailwind classes | Safelist classes or use them elsewhere to prevent purge | MEDIUM |
| Custom Cache-Control on `/_astro/*` | Rely on Astro fingerprinting + `immutable` | MEDIUM |
| `prefetchAll: true` + `defaultStrategy: 'load'` | `prefetchAll: false` + `hover` strategy | MEDIUM |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| Scoped styles not affecting child component | `data-astro-cid-*` not propagated to child | Pass `{...rest}` in child and spread on root element |
| `@apply` not resolving Tailwind classes | Style blocks isolated from theme in v4 | Add `@reference "../styles/global.css"` in `<style>` |
| FOUC (Flash of Unstyled Content) | CSS-in-JS runtime in SSR on Workers | Migrate to zero-runtime solution (Tailwind, CSS Modules, Panda CSS) |
| `/_image` returns 404 on Workers | `imageService` config wrong | Use `imageService: 'cloudflare-binding'` (default) or dual-mode object syntax |
| Hydration mismatch errors | Auto Minify enabled in Cloudflare dashboard | Disable Auto Minify in Cloudflare Speed settings |
| CSS assets stale after deploy | Custom Cache Rules on Cloudflare overriding headers | Use only `_headers` file, remove custom Cache Rules |
| Tailwind classes missing in production | `client:only` components purge undetected classes | Safelist classes in `global.css` or use in another file |
| Code highlighting without colors | Shiki v4 variable rename in Astro 6 | Replace `--astro-code-color-*` with `--astro-code-*` |
| Grid/flex children broken with islands | `<astro-island>` wrapper element disrupts layout | Target `> astro-island > .child` or use `display: contents` |
| Image optimization fails in SSR at runtime | Sharp incompatible with Workers runtime | Use `cloudflare-binding` (default) -- no Sharp needed at runtime |
| Styles inversed after upgrade to Astro 6 | `<style>` tags now render in source order (not reversed) | Reorder `<style>` blocks to match desired cascade |
| FOUT during ClientRouter navigation | Font preloads removed during page swap | Resolved in Astro 6 (#15514) -- update to 6.0.4+ |
| Responsive image styles not applied | `image.responsiveStyles` defaults to `false` in v6 | Set `image: { responsiveStyles: true }` in config |
| CSS selectors on `--fit`/`--pos` broken | Responsive images use hashed classes in v6 | Replace with `data-astro-fit` / `data-astro-pos` attribute selectors |
| Shiki bundle too large on Workers | Multiple Shiki themes increase worker size | Limit number of themes or use lightweight themes |
</troubleshooting>
