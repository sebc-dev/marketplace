# Testing, Styling & I18n

Vue 3 testing with Vitest and Vue Test Utils, CSS scoping and Tailwind integration, and vue-i18n Composition API patterns. For exact API signatures, use official Vue docs via WebFetch.

<quick_reference>
1. Vitest + @vue/test-utils for unit/component tests, Playwright for E2E -- Nuxt uses Playwright natively
2. mount() for integration (~80% of tests), shallowMount() only for deeply nested expensive trees
3. Test behavior, not implementation -- query by role/text, not class/id; never assert wrapper.vm or wrapper.props()
4. Scoped CSS: `<style scoped>` adds data-v-hash attribute selectors -- prevents leaking OUT but does NOT block external styles IN
5. :deep(.child-class) to style child component internals from parent -- always prefix with parent class, use sparingly
6. v-bind() in CSS for reactive style values: `color: v-bind(themeColor)` -- compiled to CSS variables, set as inline styles at runtime
7. Tailwind + cn() utility (clsx + tailwind-merge) for conditional class merging and prop forwarding
8. vue-i18n Composition API: useI18n() must be called in setup(); outside components use i18n.global.t() directly
9. Lazy-load translation files per locale to reduce bundle -- mandatory beyond 2-3 locales or 500+ keys
10. Always use Intl.PluralRules-based pluralizationRules -- vue-i18n defaults to English 2-form rules for ALL locales
</quick_reference>

<vitest_setup>
## Vitest Setup

**vitest.config.ts -- production-ready:**

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom', // 2-5x faster; per-file jsdom override: // @vitest-environment jsdom
    globals: true,            // tradeoff: pollutes TS global scope -- prefer explicit imports
    setupFiles: ['./test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts'],
      thresholdAutoUpdate: true, // ratchet: coverage only goes up
    },
  },
})
```

**Environment:** happy-dom as default (fast), add `// @vitest-environment jsdom` on files needing full DOM (a11y tests, getByRole). Vitest Browser Mode with real Chromium is 4x faster than jsdom for large suites.

**Performance:** `pool: 'threads'` faster than default forks. Never `isolate: false` for Vue -- DOM state leaks. Use `--shard` for CI parallelism.

**Testing composables -- withSetup pattern:**

```ts
function withSetup<T>(composable: () => T): [T, App] {
  let result: T
  const app = createApp({
    setup() { result = composable(); return () => {} },
  })
  app.mount(document.createElement('div'))
  return [result!, app]
}
// Always app.unmount() to verify cleanup
```

**Mocking:** vi.mock path must match exact import path (@/, ~/, relative). vi.fn for functions, vi.spyOn for methods. Over-mocking (4+ vi.mock calls) signals component needs refactoring.
</vitest_setup>

<component_testing>
## Component Testing

**mount vs shallowMount:** mount is default (~80%). Stub specific expensive children via `global.stubs` rather than shallow-rendering everything.

```ts
// Selective stubbing -- best of both worlds
mount(ProductPage, {
  shallow: true,
  global: { stubs: { ProductList: false } }, // render ProductList, stub others
})
```

**Props -- assert rendered output, never wrapper.props():**

```ts
expect(wrapper.classes()).toContain('btn-primary') // not wrapper.props().variant
```

**Emits:** `await wrapper.find('button').trigger('click')` then `expect(wrapper.emitted('increment')).toHaveLength(1)`.

**Async:** always `await nextTick()` after reactive changes before asserting watcher effects. Use `await flushPromises()` for Suspense/async setup.

**Pinia in tests:**

```ts
const wrapper = mount(Component, {
  global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
})
const store = useProductStore()
store.products = [{ id: 1, name: 'Test' }] // set state directly
// createSpy: vi.fn is MANDATORY with globals: false
// Fresh createTestingPinia() in beforeEach to prevent state leaks
```

**Router in tests:** createRouter with createMemoryHistory. Always `await router.push()` and `await router.isReady()`.

**Snapshot testing:** use sparingly, only for stable static UI. Never snapshot 100+ line components.
</component_testing>

<e2e_patterns>
## E2E Patterns

**Playwright vs Cypress:**

| Factor | Playwright | Cypress |
|---|---|---|
| Nuxt integration | Native (@nuxt/test-utils) | Manual |
| Performance | ~1.8s per test | ~16s per test |
| Parallelism | Free, built-in | Paid (Cypress Cloud) |
| Multi-browser/tab | Native | Architectural limitation |
| Live debugging DX | Post-mortem Trace Viewer | Time-travel GUI (best) |

**Recommendation:** Playwright for new Vue/Nuxt projects. Keep Cypress only for existing investment.

**Patterns:** Page Object pattern for maintainable tests. data-testid for stable selectors. Network intercepts for async data.

**Visual regression:** Playwright `toHaveScreenshot()` (free, Docker CI for consistency) or Chromatic (5k snapshots/month free tier).

**Testing trophy for Vue:** static analysis 100%, composable unit tests ~30%, component integration ~60%, E2E smoke ~10%.
</e2e_patterns>

<scoped_css>
## Scoped CSS

**How scoped works:** PostCSS at build time appends `[data-v-xxxxx]` attribute selectors. Hash derives from filename. Adds +0,1,0 specificity (one extra class equivalent).

**Pseudo-selectors:**

| Selector | Compiled output | Use case |
|---|---|---|
| `.a :deep(.b)` | `.a[data-v-xxx] .b` | Style child component internals |
| `:slotted(div)` | `div[data-v-xxx-s]` | Style slot content |
| `:global(.red)` | `.red` | Escape scoping entirely |

**Rules:** always use class selectors (not element selectors). Always prefix :deep() with parent class. Document every :deep() with why and target library version. Prefer CSS custom properties over :deep() when library exposes --v-* vars.

**v-bind() in CSS:** `color: v-bind(themeColor)` compiles to `var(--hash-themeColor)`, set as inline style at runtime. Use for truly dynamic runtime values only. For static variants use conditional classes.

**Pitfalls:** v-html content does NOT get data-v- attributes (scoped styles fail). v-bind() in v-for components creates DOM bloat (each instance gets inline styles). Expressions need quotes: `v-bind('obj.prop')`.

**CSS Modules:** `<style module>` hashes class names (`$style.className`). Better isolation than scoped. Use for shared/library components. Element selectors NOT scoped in Modules.

**CSS ordering dev vs prod:** Vite injects styles in component-load order (dev) vs extracted chunks (prod) -- never rely on source order. Use CSS Layers or Modules.
</scoped_css>

<tailwind_vue>
## Tailwind + Vue

**cn() pattern (industry standard from shadcn-vue):**

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```

**Dynamic classes -- lookup tables only:**

```ts
const colorMap = { blue: 'bg-blue-500 hover:bg-blue-700', red: 'bg-red-500 hover:bg-red-700' }
// NEVER: `bg-${color}-500` -- gets purged in production
```

**CVA (Class Variance Authority):** define variants at module scope (outside `<script setup>`) to avoid recreation per render. Add `cva` to `tailwindCSS.experimental.classRegex` for IntelliSense.

**Tailwind v4:** use native `@theme` CSS custom properties in scoped styles instead of @apply. `@apply` inside `<style scoped>` is broken without `@reference` workaround.

**UnoCSS alternative:** ~200x faster than Tailwind JIT (regex matching), attributify mode, pure CSS icons preset, Vue ecosystem alignment (Anthony Fu).
</tailwind_vue>

<i18n_patterns>
## I18n Patterns

**Setup:**

```ts
const i18n = createI18n({
  legacy: false, // Composition API mode
  locale: 'en',
  fallbackLocale: 'en',
  pluralizationRules: {
    ru: cldrPluralRule('ru'), // Intl.PluralRules-based
    ar: cldrPluralRule('ar'),
  },
  missing: (locale, key) => console.warn(`[i18n] Missing: ${key} (${locale})`),
})
```

**useI18n():** `t()` for text, `n()` for numbers, `d()` for dates. In templates, `$t()` only accesses global scope -- use `t()` from useI18n for local scope.

**Outside components (Pinia, utils, guards):** use `i18n.global.t('key')` directly. Result is NOT reactive -- wrap in computed if needed.

**Lazy loading with race condition guard:**

```ts
let currentLoadId = 0
async function safeLoadLocale(i18n: I18n, locale: string) {
  const loadId = ++currentLoadId
  const messages = await import(`./locales/${locale}.json`)
  if (loadId !== currentLoadId) return // stale request
  i18n.global.setLocaleMessage(locale, messages.default)
}
```

Bundle default locale eagerly, lazy-load secondary locales only. ~160KB (50KB gzip) for ~2000 keys x 2 languages without lazy loading.

**TypeScript typed keys:**

```ts
// src/vue-i18n.d.ts
import en from './locales/en.json'
declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends typeof en {}
}
```

**Pluralization:** vue-i18n defaults to English 2-form rules for ALL locales. Use `Intl.PluralRules`-based custom rules. ICU message format for CLDR compliance. Test with: 0, 1, 2, 3, 5, 11, 21, 100, 1.5.

**RTL:** CSS logical properties (`padding-inline-start`) for new projects, postcss-rtlcss for existing. Set `dir="rtl"` on html. Use `<bdi>` for mixed-direction content.

**Nuxt i18n:** `@nuxtjs/i18n` with `prefix` routing strategy (most reliable for SSG/SEO). `useLocaleHead()` for hreflang meta. `detectBrowserLanguage.redirectOn: 'root'` for crawlers.
</i18n_patterns>

<anti_patterns>
## Anti-Patterns

| Anti-pattern | Problem | Fix |
|---|---|---|
| Testing implementation (wrapper.vm, wrapper.props()) | Tests framework, not behavior | Assert rendered output and emitted events |
| shallowMount everywhere | Hides child integration bugs | mount() with selective stubs |
| Scoped CSS with element selectors (div, p) | Slow attribute+element matching, broad collisions | Use class selectors always |
| :deep() everywhere | Indicates poor component API design | Expose CSS custom properties or class props |
| Hardcoded strings instead of i18n keys | Untranslatable, breaks l10n | Extract to translation files, enable no-raw-text |
| Concatenating translated fragments | Word order differs across languages | Use interpolation: `t('msg', { name })` |
| Eager loading all locales | Bundle bloat (500KB+ with 10 languages) | Lazy load per locale, eager only for default |
| CSS !important to override scoped | Specificity war escalation | CSS Layers, custom properties, or :deep() |
| Dynamic i18n key construction `t(\`error.${code}\`)` | Breaks static analysis, ESLint, TypeScript | Explicit map with static keys |
| Snapshot testing entire pages | Unreadable diffs, constant churn | Snapshot only stable, meaningful UI pieces |
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Test passes but component broken in prod | shallowMount hides child bugs | Use mount() for integration tests |
| Scoped style doesn't apply to child | Missing :deep() pseudo-selector | Add :deep(.child-class) with parent prefix |
| v-bind() in CSS not updating | Wrong variable scope or non-reactive | Ensure ref is in same component's setup |
| useI18n() error outside component | Called in plain function, not setup() | Use i18n.global.t() or call in setup |
| Translation key shows instead of text | Missing key in locale file or empty string from TMS | Check key path, fallback locale, filter empty strings |
| Test flaky with async data | Missing await nextTick/flushPromises | Add proper async waiting after state changes |
| Tailwind classes not applying in prod | Content config missing or dynamic class construction | Check content paths, use complete class strings |
| Locale switch doesn't update UI | i18n.global.t() result stored non-reactively | Wrap in computed() for reactive translation |
| CSS order differs dev vs prod build | Vite CSS chunk ordering diverges | Use CSS Layers or CSS Modules for order-independent styles |
</troubleshooting>
