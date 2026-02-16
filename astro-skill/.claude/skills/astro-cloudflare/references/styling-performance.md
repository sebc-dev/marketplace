# Styling and Performance

Scoped styles, Tailwind v4, image optimization without Sharp, caching strategies, Core Web Vitals, and prefetch on Cloudflare Workers.

<quick_reference>
1. Use `@tailwindcss/vite` for Tailwind v4 -- `@astrojs/tailwind` is deprecated since Astro 5.2
2. Add `@reference "../styles/global.css"` in `<style>` blocks to use `@apply` with Tailwind v4 -- style blocks no longer access theme variables by default
3. Import global CSS in Layout before other imports -- guarantees lowest cascade precedence
4. Pass `class` prop AND `{...rest}` to child components -- propagates `data-astro-cid-*` for scoped style inheritance
5. Use `:global(.selector)` to mix scoped and global styles -- prefer over `is:global` for precision
6. Avoid CSS-in-JS runtime (styled-components/Emotion) for SSR on Cloudflare -- causes FOUC and streaming incompatibility
7. Use `imageService: 'compile'` for Cloudflare -- Sharp requires native bindings incompatible with Workers runtime
8. Use `priority` attribute on the single LCP image per page -- enables `loading="eager"` + `fetchpriority="high"` (Astro 5.10+)
9. Use `layout="constrained"` as default image layout -- responsive shrink without upscale, generates srcset/sizes
10. Configure `/_astro/*` with `Cache-Control: public, max-age=31536000, immutable` in `public/_headers`
11. Use `build.inlineStylesheets: 'auto'` (default) -- inlines CSS < 4kB, externalizes otherwise
12. Rename `--astro-code-color-text` to `--astro-code-foreground` -- breaking change in Astro 5.0 (Shiki v5)
13. Disable Auto Minify in Cloudflare dashboard -- breaks Server Islands and causes hydration mismatches
14. Configure `prefetch.defaultStrategy: 'hover'` -- balance UX responsiveness and bandwidth consumption
</quick_reference>
<image_service_selection>
| Scenario | Service | Reason |
|----------|---------|--------|
| Hybrid/static site on Cloudflare | `compile` (default) | Sharp at build time, disabled at SSR runtime |
| SSR with runtime image transforms (paid plan) | `cloudflare` | Cloudflare Image Resizing, 5K free transforms/month |
| No optimization needed | `passthrough` | CLS prevention preserved, no image transformation |
| Sharp on Workers | Never | Requires native bindings (`libvips`), incompatible with workerd |
| Dev local vs production | Sharp local, compile/cloudflare prod | Node.js dev environment differs from Workers runtime |
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
/>
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
</image_component_patterns>
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
</scoped_style_propagation>
<css_approach_selection>
| Scenario | Approach | Reason |
|----------|----------|--------|
| Default component styling | Astro scoped `<style>` | Zero-runtime, automatic `data-astro-cid-*` scoping |
| Utility-first styling | Tailwind v4 via `@tailwindcss/vite` | Zero-runtime, tree-shaken, CSS-first config |
| Dynamic styles in React/Vue island | CSS Modules (`.module.css`) | SSR-compatible on Cloudflare, no runtime JS |
| Type-safe zero-runtime CSS | Vanilla Extract + `@vanilla-extract/vite-plugin` | Static extraction, compatible with Workers streaming |
| Global reset/typography | Import CSS in Layout component | Lowest cascade precedence when imported first |
| Dark mode code blocks | Shiki `css-variables` theme + CSS custom properties | Native dual-theme support via `--astro-code-*` variables |
| CSS variables from frontmatter | `define:vars={{ color }}` + `var(--color)` | Passes frontmatter values to CSS without JS runtime |
</css_approach_selection>
<tailwind_v4_setup>
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
  vite: { plugins: [tailwindcss()] },
});
```

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.72 0.12 260);
  --font-sans: "Inter", system-ui, sans-serif;
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
| Fonts | `public, max-age=31536000, immutable` | `public/_headers` |
| API SSR responses | `private, max-age=X` or `no-store` | Code (`Astro.response.headers.set()`) |
| Server Islands | `public, max-age=X` via response headers | Code (inside Server Island component) |

Note: `_headers` file does NOT apply to SSR responses -- set headers programmatically in code.
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

# Fonts -- immutable (versioned in filename)
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
| Sharp image service on Cloudflare SSR | `imageService: 'compile'` in adapter config | CRITICAL |
| `styled-components` for SSR on Cloudflare | CSS Modules, Tailwind, Panda CSS, Vanilla Extract | CRITICAL |
| `@astrojs/tailwind` for Tailwind v4 | `@tailwindcss/vite` plugin in Vite config | HIGH |
| `@apply` without `@reference` in Tailwind v4 | Add `@reference "../../styles/global.css"` in `<style>` | HIGH |
| Fonts in `public/` directory | `src/assets/fonts/` to avoid build duplication | HIGH |
| `--astro-code-color-text` (old Shiki variable) | `--astro-code-foreground` (Astro 5.0 rename) | HIGH |
| Images without `priority` on LCP element | Add `priority` attribute on hero image | HIGH |
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
| `/_image` returns 404 on Workers | `imageService` config wrong or `.assetsignore` missing | Use `imageService: 'compile'`, create `public/.assetsignore` |
| Hydration mismatch errors | Auto Minify enabled in Cloudflare dashboard | Disable Auto Minify in Cloudflare Speed settings |
| CSS assets stale after deploy | Custom Cache Rules on Cloudflare overriding headers | Use only `_headers` file, remove custom Cache Rules |
| Tailwind classes missing in production | `client:only` components purge undetected classes | Safelist classes in `global.css` or use in another file |
| Code highlighting without colors | Shiki v4 to v5 variable rename in Astro 5.0 | Replace `--astro-code-color-*` with `--astro-code-*` |
| Grid/flex children broken with islands | `<astro-island>` wrapper element disrupts layout | Target `> astro-island > .child` or use `display: contents` |
| Image optimization fails in SSR at runtime | Sharp incompatible with Workers runtime | Expected with `compile` -- optimization happens at build only |
</troubleshooting>
