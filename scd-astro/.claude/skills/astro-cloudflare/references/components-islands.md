# Components and Islands

Hydration directives, Server Islands, nanostores cross-island state, and component typing patterns on Cloudflare Workers.

<quick_reference>
1. Use `client:visible` as default for below-fold components -- saves initial JS bundle
2. Use `client:idle` with timeout for above-fold non-critical -- `client:idle={{timeout: 500}}`
3. Reserve `client:load` only for critical immediate interactions (checkout, auth)
4. Use `client:visible={{rootMargin: "200px"}}` to pre-hydrate before viewport entry
5. Use `client:media="(max-width: 768px)"` for mobile-only components
6. Use `client:only="react"` when component needs browser APIs and SSR is not viable
7. Always provide `slot="fallback"` for Server Islands with matching dimensions to prevent CLS
8. Keep Server Island props < 2KB and serializable (no functions, no class instances) -- >2KB switches to POST (uncacheable)
9. Use `Astro.request.headers.get('Referer')` inside Server Islands -- `Astro.url` returns `/_server-islands/ComponentName`
10. Use nanostores for cross-island state -- import same store module path in all islands
11. Never write to nanostores from `.astro` frontmatter -- it does not affect client-side components
12. Always destructure `class` before spread: `const { class: className, ...rest } = Astro.props` -- pass `{...rest}` to include `data-astro-cid-*`
</quick_reference>
<hydration_directives>
| Scenario | Directive | Why |
|----------|-----------|-----|
| Checkout button / auth form | `client:load` | Critical for conversion, must be interactive immediately |
| Burger menu (above-fold) | `client:idle={{timeout: 1000}}` | Not used immediately but must be ready quickly |
| Below-fold carousel | `client:visible={{rootMargin: "300px"}}` | Pre-hydrate before viewport entry avoids perceived delay |
| Chat widget | `client:idle={{timeout: 2000}}` | Low priority, can wait for main thread idle |
| Mobile sidebar | `client:media="(max-width: 768px)"` | No JS loaded on desktop where sidebar is not used |
| Client-only component (maps) | `client:only="react"` | Requires browser APIs, SSR not viable |
| Footer contact form | `client:visible={{rootMargin: "400px"}}` | High rootMargin gives hydration time during scroll |
| Analytics tracking | `client:idle={{timeout: 500}}` | Timeout guarantees hydration even without `requestIdleCallback` |
| Search modal | `client:idle` | Above-fold but not instant-needed, idle is sufficient |
| Comment section | `client:visible` | Maximum savings -- loads only if user scrolls to comments |
</hydration_directives>
<island_comparison>
## Island vs Static vs Server Island

| Need | Approach | Why Not Alternatives |
|------|----------|---------------------|
| Static nav with links | `.astro` component | Zero JS, pure HTML rendering |
| Dropdown menu (hover/click) | Island `client:idle` | Requires event listeners for interactivity |
| Dynamic price per user session | Server Island `server:defer` | Personalized but not interactive -- no JS needed |
| Add-to-cart button | Island `client:load` | Critical interactivity, must respond immediately |
| User avatar (logged in) | Server Island `server:defer` | Dynamic content, fallback shows generic avatar |
| Product filter list | Island `client:visible` | Filter = interactivity, visible = JS savings |
| Editorial content with images | `.astro` + `<Image>` | Static content, image optimization at build, zero JS |
| Real-time weather widget | Island `client:only="vue"` | Needs geolocation API, SSR not viable |

**Decision rule:** Interactivity required --> Island. Dynamic content without interactivity --> Server Island. Everything else --> static `.astro` component.
</island_comparison>
<nanostores>
```typescript
// src/stores/cart.ts -- single source of truth
import { atom, map } from 'nanostores';

export const $isCartOpen = atom(false);
export const $cart = map<Record<string, { qty: number; price: number }>>({});

export function addToCart(id: string, price: number) {
  const current = $cart.get()[id];
  $cart.setKey(id, { qty: (current?.qty ?? 0) + 1, price });
}

export function toggleCart() {
  $isCartOpen.set(!$isCartOpen.get());
}
```

```tsx
// src/components/AddToCartButton.tsx -- React island using store
import { useStore } from '@nanostores/react';
import { $cart, addToCart } from '../stores/cart';

export default function AddToCartButton({ productId, price }: { productId: string; price: number }) {
  const cart = useStore($cart);
  return (
    <button onClick={() => addToCart(productId, price)}>
      Add to Cart ({cart[productId]?.qty ?? 0})
    </button>
  );
}
```

```astro
---
// Usage in .astro page -- read-only data passing
import AddToCartButton from '../components/AddToCartButton';
import { $cart } from '../stores/cart';
// $cart.get() works here for build-time SSG data but does NOT affect client
---
<AddToCartButton client:visible={{rootMargin: "200px"}} productId="SKU-123" price={29.99} />
```

```vue
<!-- src/components/CartBadge.vue -- second island sharing same store -->
<script setup>
import { useStore } from '@nanostores/vue';
import { $cart, $isCartOpen, toggleCart } from '../stores/cart';

const cart = useStore($cart);
const itemCount = computed(() =>
  Object.values(cart.value).reduce((sum, item) => sum + item.qty, 0)
);
</script>

<template>
  <button @click="toggleCart()">
    Cart ({{ itemCount }})
  </button>
</template>
```

**Key rules:**
- Use `.get()` in event handlers, `useStore()` for reactive rendering
- Import the same path (`../stores/cart`) in every island -- different paths create separate instances
- Never call `.set()` from `.astro` frontmatter -- changes do not propagate to hydrated components
- One framework runtime per framework -- 10 React islands share a single React runtime
</nanostores>
<server_island>
```astro
---
// src/pages/product/[id].astro -- static page with deferred island
import ProductPrice from '../components/server/ProductPrice.astro';
---
<h1>{product.data.name}</h1>

<ProductPrice server:defer productId={product.id}>
  <div slot="fallback" style="height:48px;width:120px">
    <span class="animate-pulse bg-gray-200 rounded block h-8 w-24"></span>
  </div>
</ProductPrice>
```

```astro
---
// src/components/server/ProductPrice.astro -- Server Island component
interface Props { productId: string; }
const { productId } = Astro.props;

// Access request context (cookies, headers, geo)
const country = Astro.request.headers.get('cf-ipcountry') || 'US';
const price = await getPriceForCountry(productId, country);

// Cache this Server Island response
Astro.response.headers.set('Cache-Control', 'public, max-age=3600');

// Use Referer for parent page URL (Astro.url = /_server-islands/ProductPrice)
const parentUrl = Astro.request.headers.get('Referer') || '/';
---
<div style="height:48px;width:120px">
  <span class="text-2xl font-bold">{price.formatted}</span>
</div>
```

**Props constraints:** Strings, numbers, booleans, plain objects, arrays only. No functions, class instances, or circular references. Props > 2048 bytes switch from GET to POST (uncacheable).

**Cache strategy:** Set `Cache-Control` on `Astro.response.headers` inside the Server Island. GET requests with small props are cacheable at the CDN edge. See rendering-modes.md for full Server Islands rendering context.
</server_island>
<slots_and_rendering>
```astro
---
// Conditional slot wrapper -- avoid empty markup
interface Props { title: string; }
const { title } = Astro.props;
---
<article class="card">
  <h2>{title}</h2>
  {Astro.slots.has("badge") && (
    <span class="card__badge"><slot name="badge" /></span>
  )}
  <div class="card__body"><slot /></div>
  {Astro.slots.has("footer") && (
    <footer class="card__footer"><slot name="footer" /></footer>
  )}
</article>
```

```astro
---
// Slot forwarding between nested layouts
// BlogLayout.astro wraps BaseLayout -- forward named slots
import BaseLayout from './BaseLayout.astro';
---
<BaseLayout>
  <slot name="head" slot="head" />
  <article>
    <slot />
  </article>
</BaseLayout>
```

**Slot rules:**
- Use `Astro.slots.has('name')` to conditionally render wrapper elements
- Forward named slots with `<slot name="x" slot="x" />` syntax
- Named slots must be direct children of the component -- not nested inside other elements
- Empty slot passed by parent does NOT trigger the fallback content
</slots_and_rendering>
<component_typing>
```astro
---
// HTMLAttributes extension -- full attribute forwarding
import type { HTMLAttributes } from 'astro/types';

interface Props extends HTMLAttributes<'a'> {
  external?: boolean;
}

const { external = false, class: className, ...rest } = Astro.props;
const externalAttrs = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
---
<a class:list={["link", { "link--external": external }, className]} {...externalAttrs} {...rest}>
  <slot />
</a>
```

```astro
---
// Polymorphic component -- dynamic tag with type safety
import type { HTMLTag, Polymorphic } from 'astro/types';

type Props<Tag extends HTMLTag> = Polymorphic<{ as: Tag }> & {
  variant?: 'primary' | 'secondary';
};

const { as: Tag = 'button', variant = 'primary', class: className, ...rest } = Astro.props;
---
<Tag class:list={["btn", `btn--${variant}`, className]} {...rest}>
  <slot />
</Tag>
```
</component_typing>
<anti_patterns>
| Don't | Do | Severity |
|-------|-----|----------|
| `client:load` on all components | Use `client:visible` / `client:idle` by default | CRITICAL |
| Pass functions as Server Island props | Pass IDs, fetch data inside the island | CRITICAL |
| Nest islands (island inside island) | Single island with child components inside | HIGH |
| Place Server Island in named slot | Use as direct child only (bug #13969) | HIGH |
| Use `Astro.url` inside Server Island | Use `Astro.request.headers.get('Referer')` | HIGH |
| Write to nanostores from `.astro` frontmatter | Initialize and write client-side only | HIGH |
| DOM manipulation between islands | Use nanostores or `CustomEvent` dispatch | HIGH |
| `client:only` without fallback HTML | Always provide fallback content for SEO/a11y | MEDIUM |
| Map `client:load` over arrays | One controller island managing N static items | MEDIUM |
| Use 3+ framework runtimes in one project | One primary framework + vanilla JS for simple interactions | MEDIUM |
| Pass complex nested props to islands | Flatten data structure, pass IDs instead | MEDIUM |
| CSS child selector `> .child` with islands | Account for `<astro-island>` wrapper: `> astro-island > .child` | MEDIUM |
</anti_patterns>
<troubleshooting>
| Symptom | Cause | Fix |
|---------|-------|-----|
| `Hydration completed but contains mismatches` | Cloudflare Auto Minify enabled | Disable Auto Minify in Cloudflare dashboard (Speed > Optimization) |
| Island never hydrates (no error) | Missing `client:*` directive or wrong import path | Verify directive is present and import path resolves |
| `client:visible` never triggers | Element has `display:none` or zero dimensions | Use `client:idle` instead or ensure element has layout dimensions |
| Nanostores not syncing between islands | Different import paths (alias vs relative) | Unify all imports to the same exact path |
| Server Islands return 404 | `src/pages/404.astro` has `prerender = true` | Set `export const prerender = false` on 404.astro |
| Server Islands broken in production on Cloudflare | Auto Minify removes `<!--server-island-start-->` HTML comments | Disable Auto Minify in Cloudflare dashboard |
| Scoped styles not applied to component | `{...rest}` not spread on root element | Always spread rest props to include `data-astro-cid-*` attributes |
| Props undefined in component | Missing `interface Props` definition in frontmatter | Define `interface Props { ... }` with explicit types |
| Server Island returns wrong URL via `Astro.url` | Normal behavior: `Astro.url` = `/_server-islands/Name` | Use `Astro.request.headers.get('Referer')` for parent page URL |
| `Cannot bundle node:stream` (Vue SSR on Cloudflare) | Vue SSR uses Node APIs not available in Workers | Add to `vite.ssr.external` and enable `nodejs_compat` flag |
</troubleshooting>
