# Rendering Modes

<quick_reference>
1. Use `output: 'static'` (default) for sites with mostly static pages -- opt out with `prerender: false` per page
2. Use `output: 'server'` for apps with mostly dynamic pages -- opt in with `prerender: true` per page
3. Never use `output: 'hybrid'` -- removed in Astro 5.0, its behavior merged into `static`
4. Export `prerender` only with static `true` or `false` -- dynamic values cause `InvalidPrerenderExport`
5. Use the `astro:route:setup` hook for programmatic prerender control based on environment or route pattern
6. Server Islands require the Cloudflare adapter, `server:defer` directive, and a fallback slot with fixed dimensions
7. Keep Server Island props serializable -- no functions, no circular refs; props > 2048 bytes trigger POST (uncacheable)
8. Implement `getStaticPaths()` for every dynamic `[param].astro` route in prerender mode
</quick_reference>
<output_modes>
| Aspect | `output: 'static'` (default) | `output: 'server'` |
|--------|-------------------------------|---------------------|
| Default rendering | SSG (prerendered at build) | SSR (rendered per request) |
| Opt-out/in | `export const prerender = false` per page | `export const prerender = true` per page |
| Adapter required | Only if any page uses SSR or Server Islands | Always |
| CDN caching | Automatic for all static pages | Manual via `Cache-Control` headers |
| Cold start | None for static pages | Workers cold start on first request |
| Best for | Sites with < 30% dynamic pages | Apps with > 70% dynamic pages |

**Prerender toggle pattern:**

```astro
---
// Static page in server mode
export const prerender = true;
---

---
// Dynamic page in static mode
export const prerender = false;
---
```

**Programmatic prerender control with `astro:route:setup`:**

```javascript
// In astro.config.mjs integrations array
{
  name: 'selective-prerender',
  hooks: {
    'astro:route:setup': ({ route }) => {
      if (route.pattern.startsWith('/blog/')) route.prerender = true;
      if (route.pattern.startsWith('/api/')) route.prerender = false;
    },
  },
}
```
</output_modes>
<decision_matrix>
| Project Type | Mode | Config | Cloudflare Reasoning |
|-------------|------|--------|---------------------|
| Static site (docs, portfolio) | SSG pure | `output: 'static'`, no adapter | CDN-served globally, ~30ms TTFB, zero Workers cost |
| Blog with comments | Static + Server Islands | `output: 'static'` + adapter, `server:defer` on comments | Shell cached on CDN, comments load dynamically |
| Client dashboard / SaaS | Server | `output: 'server'` | All content depends on authenticated user session |
| E-commerce light (< 1000 products) | Static + opt-out SSR | `output: 'static'` + adapter, `prerender: false` on cart/checkout | Product pages static (SEO), cart uses Workers SSR |
| E-commerce with real-time stock | Server + prerender categories | `output: 'server'`, `prerender: true` on category pages | Stock rendered at request time; categories cached |
| Landing pages with A/B testing | Static + Server Islands | `output: 'static'` + adapter, `server:defer` on variants | Common shell CDN-cached, variant injected per request |
| API-first with few pages | Server | `output: 'server'` | Endpoints dominate, little static content to optimize |
| Site with geo-personalization | Static + Server Islands | `output: 'static'` + adapter, `server:defer` on price/locale | 95% static on CDN, geo-content via `cf-ipcountry` header |
| Blog + authenticated dashboard | Server + selective prerender | `output: 'server'`, `prerender: true` on public blog pages | Blog pages avoid Workers cold start; dashboard SSR-secured |
| Marketing site + contact form | Static + Astro Actions | `output: 'static'` + adapter, `prerender: false` on form endpoint | Pages CDN-cached, form submission via Workers |
</decision_matrix>
<server_islands>
Server Islands render dynamic components inside static pages using the `server:defer` directive. The static shell loads instantly from the CDN; the deferred component loads asynchronously from Workers.

**Pattern with fallback (required to prevent CLS):**

```astro
---
// src/pages/product/[id].astro (static page)
import ProductPrice from '../components/ProductPrice.astro';
---
<h1>{product.data.name}</h1>

<ProductPrice server:defer productId={product.id}>
  <div slot="fallback" style="height:48px;width:120px">
    <span class="animate-pulse bg-gray-200 rounded">Loading...</span>
  </div>
</ProductPrice>
```

```astro
---
// src/components/ProductPrice.astro (Server Island component)
interface Props { productId: string; }
const { productId } = Astro.props;
const country = Astro.request.headers.get('cf-ipcountry') || 'US';
const price = await getPriceForCountry(productId, country);

// Cache this Server Island response for 1 hour
Astro.response.headers.set('Cache-Control', 'public, max-age=3600');
---
<div style="height:48px;width:120px">
  <span class="text-2xl font-bold">{price.formatted}</span>
</div>
```

**Props rules:**
- Must be serializable (strings, numbers, booleans, plain objects, arrays)
- No functions, class instances, or circular references
- Props > 2048 bytes switch from GET to POST, making the request uncacheable

**URL behavior:** Inside a Server Island, `Astro.url` returns `/_server-islands/ComponentName`. Use `Astro.request.headers.get('Referer')` to get the parent page URL.

**When to use Server Islands vs alternatives:**

| Need | Use | Why Not Alternatives |
|------|-----|---------------------|
| User avatar on static header | Server Island | Client hydration: JS bundle + flash; full SSR: loses CDN cache |
| Cart count badge | Server Island with fallback | Client fetch: double request; full SSR: no page-level CDN |
| Live search suggestions | Client-side (Alpine.js/HTMX) | Server Island: latency on each keystroke |
| Content behind auth | Server Island | Full SSR: exposes entire page as dynamic |
| Real-time notifications | Client-side WebSocket/SSE | Server Islands: no push capability |
</server_islands>
<feature_compatibility>
| Feature | SSG (`static`) | SSR (`server`) | Server Islands |
|---------|:--------------:|:--------------:|:--------------:|
| Sessions (`Astro.session`) | No | Yes | Yes |
| Actions (`astro:actions`) | Endpoints only | Full support | Callable |
| Content Layer | Build-time | Build + runtime | Yes |
| Cookies (`Astro.cookies`) | Build-time only | Yes | Yes |
| Middleware | Yes | Yes | Yes |
| Image optimization | `sharp` at build | `compile` or `cloudflare` | `compile` mode |
| Cache CDN | Automatic | Manual headers | Cacheable on GET |
| HTML Streaming | N/A | Enabled by default | Yes |
</feature_compatibility>
<anti_patterns>
| Don't | Do | Impact |
|-------|-----|--------|
| `output: 'hybrid'` | Use `'static'` or `'server'` | Config error -- hybrid removed in Astro 5.0 |
| `export const prerender = import.meta.env.VAR` | Use `astro:route:setup` hook with `loadEnv()` | `InvalidPrerenderExport` build error |
| `process.env.VAR` in components on Workers | `Astro.locals.runtime.env.VAR` | Returns `undefined` in production |
| Server Island without `slot="fallback"` | Add fallback with matching dimensions | High CLS, degraded user experience |
| Non-serializable props to Server Island | Pass ID and fetch inside island | Props silently ignored |
| `prerender: true` on `404.astro` with `output: 'server'` | Use `prerender: false` or remove the export | Cloudflare error 1042/522 on missing routes |
| Auto Minify enabled + Server Islands | Disable Auto Minify in Cloudflare dashboard | Minification removes `<!--server-island-start-->` markers, islands break |
| `getStaticPaths()` on `prerender: false` page | Remove `getStaticPaths`, use `Astro.params` directly | Warning logged, confusing behavior |
| Only Server Islands with `output: 'static'` (no SSR pages) | Add a dummy SSR page with `prerender: false` | Adapter skips Worker generation (bug #12744) |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `getStaticPaths() function is required` | Dynamic `[param].astro` without `getStaticPaths` in static mode | Add `getStaticPaths()` or `export const prerender = false` |
| `InvalidPrerenderExport` | Dynamic value for `export const prerender` | Use static `true`/`false` or `astro:route:setup` hook |
| Server Islands timeout or don't load | Auto Minify strips HTML marker comments | Disable Auto Minify in Cloudflare dashboard |
| Error 1042/522 on 404 page | 404.astro prerendered in `output: 'server'` | Set `prerender: false` on 404.astro |
| `Astro.session` is undefined | Page is prerendered or KV binding missing | Set `prerender: false` and add KV `SESSION` binding in wrangler config |
| Server Islands not detected (no Worker built) | `output: 'static'` with only Server Islands, no SSR pages | Add one page with `export const prerender = false` |
| `Astro.url` returns `/_server-islands/Name` | Normal behavior inside Server Island | Use `Astro.request.headers.get('Referer')` for parent page URL |
| 404 on dynamic SSR routes after deploy | `_routes.json` missing route pattern | Add pattern to `routes.extend.include` in adapter config |
| Cache stale after redeployment | CDN or browser cache not purged | Purge Cloudflare cache from dashboard and check `Cache-Control` headers |
</troubleshooting>