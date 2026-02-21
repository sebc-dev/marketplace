# Testing, Styling & Deployment

Testing (Vitest + Playwright), CSS/Tailwind v4, transitions, adapter selection, and deploy patterns for SvelteKit 2 + Svelte 5. For API signatures, defer to MCP Svelte tool.

Essential rules for testing setup, styling defaults, and adapter selection.
<quick_reference>
1. Use `.svelte.test.ts` extension when test file uses runes -- mandatory for `$state`/`$derived`/`$effect` in test code
2. Add `svelteTesting()` plugin OR set `resolve.conditions: ['browser']` -- without it, Vitest resolves SSR code silently
3. Multi-project Vitest config: `client` (browser/jsdom) for `.svelte.test.ts`, `server` (Node) for `.test.ts`
4. CSS scoped by default via `.svelte-xyz` hash -- `:global()` only for `{@html}`, JS-created DOM, third-party overrides
5. `class={[...]}` (5.16+) over `class:` directive -- better Tailwind support, officially recommended
6. Tailwind v4: `@tailwindcss/vite` BEFORE `sveltekit()` -- not PostCSS
7. Prefer `css` transitions over `tick` -- WAAPI, off-main-thread, 60fps
8. Animate only `transform`, `opacity`, `filter` -- layout properties reflow per frame
9. Always handle `prefers-reduced-motion` via `prefersReducedMotion` from `svelte/motion` (v5.7+)
10. Switch `adapter-auto` to platform-specific before production
11. Set `ORIGIN` or forwarding headers for adapter-node -- form actions fail without it
12. `$env/dynamic/*` throws during prerender; `$env/static/*` baked at build (bad for Docker multi-env)
</quick_reference>

Vitest configuration: sveltekit plugin, svelteTesting, multi-project client/server separation.
<vitest_setup>
**Default (jsdom):** `plugins: [sveltekit(), svelteTesting()]`, `environment: 'jsdom'`, setup: `import '@testing-library/jest-dom/vitest'` + jsdom polyfills (see mocking_patterns).

**Multi-project (recommended, Vitest >=3.2):**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [sveltekit()],
  test: {
    projects: [
      { extends: true, test: {
          name: 'client',
          browser: { enabled: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
          include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
          exclude: ['src/lib/server/**'],
      }},
      { extends: true, test: {
          name: 'server', environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts}'],
          exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
      }},
    ],
  },
});
```

**File naming = project assignment:** `.svelte.test.ts` -> client (runes processed), `.test.ts` -> server (Node), `.ssr.test.ts` -> SSR (Node).

**Environments:** jsdom = default, needs polyfills | happy-dom = 2-3x faster, vitest-axe incompatible | vitest-browser-svelte = real browser, no polyfills, auto-retry locators, Svelte core endorsed.
</vitest_setup>

Component testing: render, runes, snippets, callbacks, context, prop updates.
<component_testing>
**@testing-library/svelte (jsdom) vs vitest-browser-svelte (real browser):**
```typescript
// jsdom -- flushSync needed, fireEvent async
render(Counter, { count: 0 });
await userEvent.setup().click(screen.getByRole('button'));
expect(screen.getByRole('button')).toHaveTextContent('1');

// vitest-browser-svelte -- auto-retry, no act()
const screen = render(Counter, { count: 1 });
await screen.getByRole('button').click();
await expect.element(screen.getByText('Count is 2')).toBeVisible();
```

**$effect testing (requires .svelte.test.ts + $effect.root + flushSync):**
```javascript
const cleanup = $effect.root(() => {
  let count = $state(0);
  let log = [];
  $effect(() => { log.push(count); });
  flushSync(); expect(log).toEqual([0]);
  count = 1; flushSync(); expect(log).toEqual([0, 1]);
});
cleanup(); // MUST call -- no auto-cleanup
```

**Key patterns:**
- **Callback props** (replaces dispatcher): `render(Button, { onclick: vi.fn() })` then assert `expect(handler).toHaveBeenCalledWith(expect.any(MouseEvent))`
- **Snippets** (replaces slots): `createRawSnippet(() => ({ render: () => '<span>text</span>' }))` passed as `children` prop
- **Context**: `render(Comp, { props: {...}, context: new Map([['key', val]]) })`
- **Bindings/complex**: create wrapper `.svelte` component (official recommendation)
- **Prop updates**: `const { rerender } = render(Comp, { count: 0 }); await rerender({ count: 5 })`
- **$derived in .svelte.ts modules**: read through getters, never snapshot -- recomputes lazily on access
</component_testing>

E2E with Playwright: SSR, hydration, progressive enhancement, auth.
<e2e_testing>
**Config:** `webServer: { command: 'npm run build && npm run preview', port: 4173 }`, `use: { baseURL, trace: 'on-first-retry' }`, projects with setup dependency for auth.

**SvelteKit-specific patterns:**
```typescript
// SSR without JS
const ctx = await browser.newContext({ javaScriptEnabled: false });
await ctx.newPage().goto('/'); // assert server-rendered content

// Hydration check -- SvelteKit adds data-sveltekit-hydrated to <body>
await page.waitForSelector('[data-sveltekit-hydrated]');

// Progressive enhancement -- form works without JS (same pattern as SSR)

// Client navigation without reload -- set window marker, navigate, verify marker persists
await page.evaluate(() => { (window as any).__MARKER__ = true; });
await page.getByRole('link', { name: 'About' }).click();
expect(await page.evaluate(() => (window as any).__MARKER__)).toBe(true);
```

**Auth:** `storageState` in setup project -- login once, save to `playwright/.auth/user.json`, reuse across tests.

**API mocking:** `page.route()` intercepts browser-side only. For server load mocking, use MSW in same process as SvelteKit server.

**Selectors:** `getByRole`/`getByLabel` > `getByTestId` > never `.svelte-*` classes (change on recompile).
</e2e_testing>

Mocking $app/state, virtual modules, RequestEvent factory, jsdom polyfills.
<mocking_patterns>
**SvelteKit virtual modules (setupTest.ts):**
```typescript
vi.mock('$app/state', () => ({
  page: { url: new URL('http://localhost'), params: {}, route: { id: '/' },
    status: 200, error: null, data: {}, form: null, state: {} },
  navigating: null, updated: { current: false, check: vi.fn().mockResolvedValue(false) },
}));
vi.mock('$app/navigation', () => ({
  goto: vi.fn().mockResolvedValue(undefined), invalidate: vi.fn().mockResolvedValue(undefined),
  afterNavigate: vi.fn(), beforeNavigate: vi.fn(), onNavigate: vi.fn(),
  pushState: vi.fn(), replaceState: vi.fn(),
}));
vi.mock('$app/environment', () => ({ browser: false, dev: true, building: false }));
```

**Mock RequestEvent factory** (reusable for load, actions, hooks, API routes): return object with `params: {}`, `url`, `request`, `cookies: createMockCookies()`, `locals: {}`, `route: { id: '/' }`, `fetch: vi.fn().mockResolvedValue(new Response('{}'))`, `setHeaders/depends/parent` as vi.fn(), spread `...overrides`. For form actions: build real FormData, pass as request body -- catches field name mismatches that mocks hide.

**Assertion helpers from `@sveltejs/kit`:** `isRedirect(e)`, `isHttpError(e, status)`, `isActionFailure(result)`.

**jsdom polyfills (vitest-setup.js):**
```javascript
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
Object.defineProperty(window, 'matchMedia', { writable: true,
  value: vi.fn().mockImplementation(q => ({ matches: false, media: q, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(),
    removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
```
</mocking_patterns>

Scoped CSS, :global(), custom properties, class forwarding, Tailwind v4 setup.
<styling_patterns>
**Scoping:** `.svelte-xyz` adds +0-1-0 specificity (first occurrence); subsequent uses `:where(.svelte-xyz)` (zero). Scoped `p {}` beats global `p {}`; Tailwind utilities beat or equal scoped selectors.

**:global() for dynamic DOM** (`{@html}`, D3, libraries):
```svelte
<div class="prose">{@html content}</div>
<style>.prose :global { h1 { font-size: 2rem; } p { line-height: 1.6; } }</style>
```

**Custom properties for theming** (crosses component boundaries):
`<Child --color="darkred" />` desugars to `<svelte-css-wrapper style="--color: value">`. Child re-declares locally: `--_color: var(--color, darkred)`. Warning: wrapper can break `>` selectors.

**Class forwarding** (essential for Tailwind/shadcn-svelte):
```svelte
<script>let props = $props();</script>
<button {...props} class={['btn-base', props.class]}>{@render props.children?.()}</button>
```
Type with `ClassValue` from `svelte/elements` (5.19+). `cn()` only for Tailwind conflict resolution.

**Tailwind v4:** `plugins: [tailwindcss(), sveltekit()]` (order matters). In `app.css`: `@import "tailwindcss"; @theme { ... }; @custom-variant dark (&:is(.dark *))`. Dark mode: `.dark` on `<html>` + blocking script in `app.html` reading cookie/localStorage.

**@apply in `<style>`:** requires `@reference "../../app.css"`. Wrap variants in `:global`: `main :global { @apply bg-white dark:bg-gray-900; }`. `@layer` does NOT work in component `<style>`.

| Situation | Approach |
|---|---|
| Component structural | `<style>` scoped |
| Utility layout/spacing | Tailwind in `class` |
| `{@html}` / dynamic DOM | `.container :global { ... }` |
| Cross-component theming | CSS custom properties |
| Third-party override | Custom props > class prop > `:global()` (last resort) |
</styling_patterns>

CSS vs tick transitions, WAAPI behavior, page transitions, motion accessibility.
<transitions>
**`transition:` vs `in:/out:`:** `transition:` reverses mid-animation (same effect both ways). `in:/out:` for different enter/exit, but toggle causes stacking.

**Svelte 5 WAAPI (not CSS animations):** cannot disable via CSS `animation-duration: 0ms`; easing not reversed on outro (plays backwards in time); jsdom fails with `element.animate is not a function`.

**Hydration gotcha:** `mount()` plays intros by default (breaking from Svelte 4). Guard: `let mounted = $state(false); onMount(() => mounted = true)` then `{#if mounted}<div transition:fade>...{/if}`.

**Page transitions:** View Transitions API via `onNavigate` in root layout. CSS for `::view-transition-*` must be in `:global()`. Always wrap in `@media (prefers-reduced-motion: no-preference)`.

**prefers-reduced-motion -- NOT automatic:** use CSS `@media (prefers-reduced-motion: reduce)` for CSS animations, `prefersReducedMotion.current` from `svelte/motion` for JS. Provide reduced alternative, do not just disable.

**Spring vs Tween** (classes since v5.8, not stores): Spring for continuous (mouse/drag), Tween for discrete (click). Read `.current`, write `.target`. Bind: `Spring.of(() => prop)`.

**`{#key}`** re-triggers transitions by destroy/recreate. Both instances coexist during outro.
</transitions>

Decision tree: node/cloudflare/vercel/netlify/static.
<adapter_selection>
```
Vercel?             -> adapter-vercel
Cloudflare?         -> adapter-cloudflare (Workers + Pages unified)
Netlify?            -> adapter-netlify
VPS/Docker/K8s?     -> adapter-node
Static/SPA?         -> adapter-static
Prototyping?        -> adapter-auto (switch before production)
```

| Adapter | SSR | Key Limitation | Critical Config |
|---|---|---|---|
| adapter-node | Full | Single-threaded; needs reverse proxy | `ORIGIN` or forwarding headers |
| adapter-vercel | Serverless+Edge | maxDuration per plan | `isr`, `regions` via export config |
| adapter-cloudflare | Edge | Worker size 1-10MB; no native fs | `nodejs_compat`; wrangler.toml |
| adapter-netlify | Serverless+Edge | Edge incompatible with `netlify dev` | `edge`, `split` |
| adapter-static | Build-time | No runtime server logic | `fallback`, `precompress` |

`adapter-cloudflare-workers` deprecated. CF Pages sunset April 2025 in favor of Workers.
</adapter_selection>

Docker, streaming, prerender, SPA mode, hash routing, compression.
<deploy_patterns>
**Docker (adapter-node):** Multi-stage: builder installs ALL deps (devDeps needed for build), runs `npm run build && npm prune --production`. Final stage copies `build/`, `node_modules/`, `package.json`. Use `node:22-alpine`, `dumb-init` for signals. `CMD ["node", "build"]`.

**Nginx buffer fix** (502 from large Link headers): `proxy_buffers 4 512k; proxy_buffer_size 256k; proxy_busy_buffers_size 512k;`

**Streaming SSR** (SK2: all promises stream by default): `await` to block, omit `await` to stream. Server load only, needs client JS, fails on buffering platforms (Lambda). Attach `.catch(() => {})`.

**Prerender:** `true` = build-time HTML; `'auto'` = prerender + SSR fallback. Form actions cannot prerender. `$env/dynamic/*` throws. Dynamic routes need `entries()`.

**SPA mode:** `ssr = false` root layout + adapter-static `fallback: '200.html'`. Performance penalty. Only when no server.

**Hash routing** (`router: { type: 'hash' }`): `/#/path`, SSR/prerender auto-disabled, no +server.js. For Electron, Capacitor, GitHub Pages.

**Compression:** proxy-level. In-app: `@polka/compression` (NOT `compression` -- breaks streaming).

**Shutdown:** adapter-node built-in `SHUTDOWN_TIMEOUT` (30s). Listen `sveltekit:shutdown` for cleanup.
</deploy_patterns>

Common mistakes in testing, styling, and deployment.
<anti_patterns>

| Don't | Do | Why |
|---|---|---|
| jsdom without `svelteTesting()` | Add plugin or set `resolve.conditions: ['browser']` | Silent SSR code resolution |
| `.test.ts` with runes in test | `.svelte.test.ts` | `$state is not defined` |
| Skip `$effect.root()` cleanup | Call cleanup in afterEach | Memory leaks |
| Skip `flushSync()` (jsdom) | Call before assertions | Stale values = false positives |
| Animate `width`/`height`/`top`/`left` | `transform: scale/translate` + `opacity` | Layout reflow per frame |
| Dynamic Tailwind names (`bg-${color}-500`) | Full class names in ternary | Scanner cannot resolve interpolation |
| `$effect` to derive styles | `$derived` | Async, visual inconsistencies |
| `@apply` without `@reference` | `@reference "../../app.css"` | Unknown utility error |
| `animate:flip` inside `{#if}` in `{#each}` | Filter array before iteration | Must be direct child of keyed each |
| Animation config in `$state()` | `$state.raw()` | Proxy re-renders from library internals |
| `class:` for Tailwind | `class={[...]}` (5.16+) | Parser breaks on `/`; deprecated |
| Mock `formData()` | Real FormData + Request | Hides field mismatches |
| Assert component internals | Assert visible behavior | Brittle to implementation changes |
| `$env/static/private` in Docker | `$env/dynamic/private` | Baked into image |
| ISR on personalized routes | ISR on public pages only | User data leaks via cache |
</anti_patterns>

Hydration mismatches, test config errors, build/deploy failures, styling bugs.
<troubleshooting>

| Symptom | Cause | Fix |
|---|---|---|
| `$state is not defined` in test | `.test.ts` with runes | Rename `.svelte.test.ts` |
| Component renders empty | Missing browser resolve condition | Add `svelteTesting()` or set manually |
| `element.animate is not a function` | jsdom lacks WAAPI | vitest-browser-svelte or polyfill |
| Effects not running | No `$effect.root()` scope | Wrap + `flushSync()` + cleanup |
| Hydration mismatch | `Date.now()`, invalid nesting, Safari phone links | Deterministic values; fix nesting; `<meta name="format-detection" content="telephone=no">` |
| Hydration mismatch on CF | Auto Minify strips HTML comments | Disable in CF Dashboard > Speed |
| 502 behind Nginx | Large Link preload headers | Increase `proxy_buffers`/`proxy_buffer_size` |
| "Cross-site POST forbidden" | No origin config (adapter-node) | Set `ORIGIN` or forwarding headers |
| Styles missing for `{@html}` | Dead-code CSS elimination | `.container :global { ... }` |
| `@apply` unknown utility | No `@reference` in `<style>` | Add `@reference "../../app.css"` |
| CSS variants removed in scoped | Svelte eliminates `:is(...)` as unused | Wrap in `:global { @apply ... }` |
| `$env/dynamic/*` throws | Accessed in prerendered route | Use static or set `prerender = false` |
| `compression` breaks streaming | Package lacks stream support | `@polka/compression` or proxy |
| Layout shift from transitions | `mount()` plays intros by default | `{#if mounted}` guard pattern |
| Test state leaks | Singleton or missing cleanup | Reset in beforeEach; call cleanup |
| vitest-axe fails (happy-dom) | `isConnected` bug | Switch to jsdom for a11y tests |
</troubleshooting>
