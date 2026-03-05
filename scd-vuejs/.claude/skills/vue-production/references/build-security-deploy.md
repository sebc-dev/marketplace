# Build, Security & Deployment

Vite build configuration, XSS/CSTI prevention, authentication architecture, observability, Docker/Cloudflare deployment, and CI/CD pipelines for Vue 3 production apps. For exact API signatures, use official Vue docs via WebFetch.

Ten rules that cover 90% of build, security, and deployment decisions.

<quick_reference>

1. `VITE_` prefix exposes env vars to client bundle — server secrets MUST NOT use this prefix
2. `v-html` = XSS vector — ALWAYS sanitize with DOMPurify before rendering
3. CSTI (Client-Side Template Injection) is a Vue-specific XSS variant — never use user input in templates
4. CSP: strict Content-Security-Policy, avoid `'unsafe-inline'` for scripts
5. Token storage: httpOnly cookies > memory > localStorage (XSS accessible)
6. `vue-tsc --noEmit` in CI pipeline for type checking `.vue` files
7. Sentry + `@sentry/vue` for production error tracking with component tree context
8. Docker: multi-stage build (node:build -> nginx:serve)
9. Preview deployments for every PR (Cloudflare Pages, Vercel, Netlify)
10. Rollback strategy: keep previous deployment, instant switch

</quick_reference>

Vite project configuration, environment variables, chunk splitting, and build optimization.

<vite_config>

**vite.config.ts essentials:**

```ts
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue({ features: { optionsAPI: false } })],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true, secure: false },
    },
  },
  build: {
    sourcemap: 'hidden', // generates maps for Sentry, strips sourceMappingURL from bundles
    rollupOptions: {
      output: {
        manualChunks: { 'vue-vendor': ['vue', 'vue-router', 'pinia'] },
      },
    },
  },
})
```

**Environment files** (loading priority): `.env` -> `.env.local` -> `.env.[mode]` -> `.env.[mode].local`. Files with `.local` suffix must be gitignored.

**VITE_ prefix rule:** all `VITE_*` vars are statically replaced at build time and baked into the JS bundle. Dynamic access (`import.meta.env[key]`) does NOT work. Type env vars via `ImportMetaEnv` interface in `env.d.ts`.

**Build optimization levers:**
- `minify: 'esbuild'` (default, 20-40x faster than Terser)
- `esbuild: { drop: ['console', 'debugger'] }` to strip console in production
- `reportCompressedSize: false` to speed up build output
- `build.target: 'esnext'` to skip transpilation for modern browsers
- Barrel files (`export * from`) kill tree-shaking — avoid them

**Plugin ecosystem:** `@vitejs/plugin-vue`, `vite-plugin-vue-devtools`, `unplugin-vue-router`, `unplugin-auto-import`, `unplugin-vue-components`, `rollup-plugin-visualizer` (last in array)

**Chunk error recovery after deploy** — old chunks deleted, cached HTML references them:

```ts
window.addEventListener('vite:preloadError', (event) => {
  window.location.reload() // hard navigation fetches fresh HTML
})
```

</vite_config>

XSS vectors specific to Vue 3 and how to neutralize them.

<security_xss>

**v-html:** sets `innerHTML` directly. `<script>` tags don't execute but event handlers do: `<img src=x onerror="steal()">` fires immediately. Ban `v-html` via `vue/no-v-html` ESLint rule, use `vue-dompurify-html` directive instead:

```ts
// main.ts — global DOMPurify directive
import VueDOMPurifyHTML from 'vue-dompurify-html'
app.use(VueDOMPurifyHTML, {
  default: { FORBID_TAGS: ['style', 'script'], FORBID_ATTR: ['onerror', 'onload'] },
  namedConfigurations: {
    plaintext: { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'] },
  },
})
// Usage: <div v-dompurify-html="userContent"></div>
```

**CSTI (Client-Side Template Injection):** Vue compiles `{{ }}` expressions — if user content is in a template node, attackers execute arbitrary JS. DOMPurify does NOT protect against CSTI (no HTML-dangerous characters). Rule: never mount Vue on DOM containing user-provided content. Use `v-pre` on sections with server-rendered user data.

**URL injection:** `:href` and `:src` don't sanitize protocols — `javascript:alert()` executes on click. Sanitize with `@braintree/sanitize-url`.

**SVG injection:** inline SVGs can contain `<script>` and event handlers. Sanitize with DOMPurify `USE_PROFILES: { svg: true }`.

**CSP headers** — strict policy for Vue 3 SPA (runtime-only build is CSP-compliant without `unsafe-eval`):

```
default-src 'self'; script-src 'self' 'nonce-{SERVER_NONCE}'; style-src 'self' 'nonce-{SERVER_NONCE}'; img-src 'self' data:; connect-src 'self' https://api.example.com; frame-ancestors 'none'; object-src 'none'
```

Vite 5.2+ supports `html: { cspNonce: 'PLACEHOLDER' }` — replace server-side per request. For static hosting, use `vite-plugin-csp-guard` for hash-based CSP.

**vue-i18n CSP trap:** default build uses `new Function()`, requires `unsafe-eval`. Fix: alias to `vue-i18n/dist/vue-i18n.runtime.esm-bundler.js`.

</security_xss>

Token storage, CSRF, route guards, and API authorization.

<security_auth>

**Token storage decision:**

| Token type | Storage | Rationale |
|---|---|---|
| Refresh token | httpOnly + Secure + SameSite cookie | JS-inaccessible, XSS-proof |
| Access token | In-memory (Pinia ref) | Short-lived, lost on refresh (by design) |
| Never | localStorage / sessionStorage | XSS reads trivially |

Restore sessions on page load via silent refresh using httpOnly cookie. Use `visibilitychange` listener to refresh tokens when background tab becomes active.

**CSRF protection:** `SameSite=Lax` cookies + double-submit token via Axios. Modern alternative (2025): `Sec-Fetch-Site` header — server rejects state-changing requests where `Sec-Fetch-Site` is `cross-site` (zero client-side changes).

**Route guard = UX only, not security:** all JS is visible and modifiable. Every API endpoint must independently verify auth. Route guards prevent seeing pages, not accessing data.

```ts
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    try { await api.get('/api/user') } // verify with server, not local state
    catch { return { name: 'Login', query: { redirect: to.fullPath } } }
  }
})
```

**Open redirect vulnerability:** validate redirect targets after login — `new URL(url, origin).origin === origin`.

**CORS:** configure server-side, never `Access-Control-Allow-Origin: *` with credentials. Deploy SPA + API behind same reverse proxy to eliminate CORS entirely.

**Sensitive data:** never log tokens. Never persist access tokens with `pinia-plugin-persistedstate`. Use `v-if` (not `v-show`) for security-sensitive content — `v-show` only toggles CSS display.

</security_auth>

Error tracking, DevTools, logging, and performance monitoring.

<observability>

**Sentry + @sentry/vue** — the only APM with native Vue integration:

```ts
// main.ts — init before app.mount()
import * as Sentry from '@sentry/vue'
Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration({ router })],
  tracesSampleRate: 0.1,           // 10% in production
  replaysSessionSampleRate: 0.1,   // 10% continuous
  replaysOnErrorSampleRate: 1.0,   // 100% on error (buffer mode)
  trackComponents: true,           // ui.vue.mount/update spans
})
```

Upload source maps: `sourcemap: 'hidden'` + `@sentry/vite-plugin` (last in plugins array) + `filesToDeleteAfterUpload`. Auth token via `process.env.SENTRY_AUTH_TOKEN` (no `VITE_` prefix).

**Error handling architecture — three levels:**
1. `app.config.errorHandler` — global safety net, connected to Sentry
2. `onErrorCaptured` — subtree error boundaries (catches descendant errors only)
3. `window.addEventListener('unhandledrejection')` — catches non-Vue errors (setTimeout, third-party callbacks)

**Vue DevTools:** use `vite-plugin-vue-devtools` over browser extension (Assets, Graph, Inspector, click-to-source). Enable `app.config.performance = true` in dev for component timing.

**Logging:** structured `useLogger` composable with component name + route context. Buffer and batch delivery (20-50 entries, flush every 10s). Use `navigator.sendBeacon()` on `beforeunload`. Strip console calls in production via esbuild `drop`.

**Performance monitoring:** Web Vitals (INP replaced FID March 2024), Sentry Performance with `trackComponents`, Lighthouse CI for performance budgets.

</observability>

Docker, Cloudflare Pages, cache strategy, and static hosting.

<deployment>

**Docker multi-stage build:**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine3.22
COPY nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
```

nginx.conf must include `try_files $uri $uri/ /index.html;` for Vue Router history mode (#1 Docker deployment issue). `nginx-unprivileged` listens on port 8080, not 80.

**Cloudflare Pages:** unlimited free bandwidth, automatic gzip/brotli, 300+ edge locations. SPA routing trap: if `404.html` exists in build output, client-side routing breaks. Use `_redirects` with `/* /index.html 200` or `not_found_handling = "single-page-application"` in `wrangler.toml`. Free plan: 500 builds/month — use branch build controls.

**Cache strategy — two-tier rule:**
- Hashed assets: `Cache-Control: public, max-age=31536000, immutable`
- `index.html`: `Cache-Control: no-cache` (always revalidate)
- `public/` files have NO cache busting — use only for `robots.txt`, `favicon.ico`

**Rollback:** keep old hashed chunks available temporarily, redeploy previous commit. Since assets are content-hashed, restoring old `index.html` instantly restores old version. Cloudflare Gradual Deployments: `wrangler versions upload` + `wrangler versions deploy` with traffic split percentages.

</deployment>

CI pipeline stages, caching, preview deployments, and release strategy.

<cicd>

**Pipeline order** — cheapest checks first, fail fast:

```
lint + type-check ──┐
                     ├──→ build ──→ e2e tests ──→ deploy
unit tests ─────────┘
```

**Critical fact:** Vite does NOT type-check. `vue-tsc --noEmit` is non-negotiable in CI — without it, type errors become runtime crashes. Use `skipLibCheck: true` in tsconfig to speed up type-checking.

**GitHub Actions key patterns:**
- `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }` — cancel superseded runs
- `pnpm install --frozen-lockfile` (or `npm ci`) — deterministic installs
- Cache pnpm store (not `node_modules/`) — pnpm's symlink structure breaks when cached
- Upload `dist/` as artifact for deploy job
- Cloudflare deploy: `cloudflare/wrangler-action@v3` with `pages deploy dist`

**Preview deployments:** deploy PR branches for review. Cloudflare Pages triggers on all branch pushes by default — use include/exclude patterns to conserve builds.

**Lighthouse CI:** automated performance budget checks on critical routes. Set baselines: INP < 200ms, LCP < 2.5s, CLS < 0.1.

**lint-staged for pre-commit:**

```json
{ "*.{js,ts,vue}": ["eslint --fix --quiet", "prettier --write"] }
```

**Case sensitivity trap:** CI runs on Linux (case-sensitive). `import './myComponent.vue'` works on macOS but fails if file is `MyComponent.vue` — #1 "works locally, fails in CI" cause.

</cicd>

Common mistakes with concrete consequences and fixes.

<anti_patterns>

| Anti-pattern | Consequence | Fix |
|---|---|---|
| `VITE_` prefix on server secrets | Secrets baked into JS bundle, visible to anyone | No prefix for server vars, access server-side only |
| `v-html` with unsanitized user input | XSS via event handler attributes | `vue-dompurify-html` directive, ban `v-html` via ESLint |
| No CSP headers | Script injection, data exfiltration | Strict CSP with nonce or hash, no `unsafe-inline` |
| Tokens in localStorage | XSS reads them trivially | httpOnly cookies for refresh, in-memory for access |
| No type checking in CI | Type errors become runtime crashes | `vue-tsc --noEmit` in CI pipeline |
| `console.log` for production debugging | Invisible to devs, blocks main thread, logs Proxies | Structured logging + Sentry with source maps |
| `sourcemap: true` in production | Full source code publicly accessible | `sourcemap: 'hidden'` + upload to Sentry + delete |
| Single deployment without rollback | Broken deploy affects all users until fix | Keep previous versions, use gradual rollouts |
| No preview deployments | Bugs discovered only after merge to main | Deploy PR branches automatically |
| Skipping E2E in CI | Integration bugs slip through | Playwright in CI with browser caching |

</anti_patterns>

Diagnostic table: symptom, cause, solution.

<troubleshooting>

| Symptom | Cause | Solution |
|---|---|---|
| `VITE_` variable undefined at runtime | Not prefixed with `VITE_` or wrong `.env` file | Check prefix and `.env.[mode]` file naming/priority |
| XSS in user-generated content | `v-html` without sanitization | Add `vue-dompurify-html` directive, ban `v-html` ESLint rule |
| CSP blocks inline scripts | `'unsafe-inline'` not set (correct!) | Use nonce-based CSP or external scripts, not `unsafe-inline` |
| Sentry not capturing Vue errors | Missing `@sentry/vue` integration | `Sentry.init({ app })` before `app.mount()` |
| Build fails in CI but works locally | Case sensitivity, missing `vue-tsc`, different Node version | Align CI environment, run `vue-tsc --noEmit`, check file cases |
| Deploy works but blank page | SPA without fallback routing on server | `try_files $uri /index.html` (nginx) or `_redirects` (CF Pages) |
| Assets 404 after deploy | Base path misconfigured or old chunks deleted | Set `base` in vite.config.ts, install `vite:preloadError` handler |
| Environment vars differ between envs | Build-time vs runtime confusion | `VITE_` = build-time only; use runtime config for dynamic values |
| Docker image too large | Single-stage build with node | Multi-stage: node build -> nginx-unprivileged serve |

</troubleshooting>
