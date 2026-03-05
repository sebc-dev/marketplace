# TypeScript Patterns

Vue 3 + TypeScript production patterns: props/emits/slots typing, composable generics, Pinia store typing, Vue Router type augmentation, and environment declarations. For exact API signatures, use official Vue docs via WebFetch.

<quick_reference>
1. Use vue-tsc for type checking, NOT tsc -- vue-tsc understands .vue files; add `vue-tsc --noEmit` before `vite build` in CI
2. defineProps<{}>() type-based declaration for best TS inference -- never mix type-based and runtime in same call
3. withDefaults() for defaults with type-based defineProps (pre-3.5); destructured defaults preferred in 3.5+
4. Ref<T> unwraps automatically in templates -- no .value typing needed there
5. InjectionKey<T> for type-safe provide/inject -- always use Symbol-based keys with typed wrappers
6. ComponentExposed<typeof Comp> for typing template refs to components -- InstanceType does NOT capture defineExpose
7. Avoid `as` and `any` -- use type guards, Zod validation, discriminated unions; ESLint no-explicit-any enforced
8. @ts-expect-error over @ts-ignore -- fails when underlying error disappears, preventing stale suppressions
9. Generic components: `<script setup lang="ts" generic="T">` -- T inferred from prop usage
10. env.d.ts for ImportMeta.env typing -- only VITE_ prefixed vars exposed to client code
</quick_reference>

<props_typing>
## Props Typing

**Type-based with destructured defaults (3.5+):**

```ts
const { count = 0, msg = 'hello' } = defineProps<{
  count?: number
  msg?: string
}>()
```

**withDefaults (pre-3.5):** `withDefaults(defineProps<{ labels?: string[] }>(), { labels: () => ['one'] })` -- factory REQUIRED for objects/arrays.

**Imported types (3.3+):** `import type { Props } from './types'` then `defineProps<Props & { extra?: string }>()`.

**Discriminated union props:** `defineProps<{ mode: 'edit'; itemId: string } | { mode: 'create'; template?: string }>()`.

**Pitfalls:**
- Destructured props in watch need getter: `watch(() => count, cb)` not `watch(count, cb)`
- Optional boolean props default to `false` at runtime (Vue behavior), not `undefined` as TS suggests
- withDefaults + generics has known bugs (vuejs/core#8310) -- prefer destructured defaults in 3.5+
</props_typing>

<component_typing>
## Component Typing

**defineEmits -- named tuple syntax (3.3+):**

```ts
const emit = defineEmits<{
  update: [id: number, value: string]
  delete: [id: number]
}>()
```

**defineSlots:** `defineSlots<{ default: (props: { item: T }) => any; header?: (props: { title: string }) => any }>()` -- return type ignored (use `any`).

**defineModel:** `defineModel<string>()` for default v-model, `defineModel<number>('count')` for named.

**Generic components:**

```vue
<script setup lang="ts" generic="T extends Record<string, any>">
defineProps<{ items: T[]; selected?: T }>()
defineEmits<{ select: [item: T] }>()
// T inferred from items prop at usage site
</script>
```

**Template ref typing:**

```ts
const input = useTemplateRef<HTMLInputElement>('input')     // DOM element
```

```ts
import type { ComponentExposed } from 'vue-component-type-helpers'
const modal = useTemplateRef<ComponentExposed<typeof MyModal>>('modal')
// InstanceType<typeof Comp> does NOT capture defineExpose methods
```
</component_typing>

<composable_typing>
## Composable Typing

**Flexible inputs with MaybeRefOrGetter:**

```ts
import { toValue, toRef, type MaybeRefOrGetter } from 'vue'

export function useTitle(title: MaybeRefOrGetter<string>) {
  watch(toRef(title), (t) => { document.title = t }, { immediate: true })
}
// Accepts: plain value, ref, computed, or getter function
```

- `MaybeRefOrGetter<T>` for read-only inputs; `MaybeRef<T>` for writable/two-way
- `toValue()` to read current value; `toRef()` to convert to watchable source
- Never use `unref()` -- does NOT handle getters; always prefer `toValue()`

**Return:** plain object of refs (`return { x, y }`) -- destructurable without losing reactivity. For shared/library composables, define explicit return interface (`UseStorageReturn<T>`) as API contract.

**Generic composable:**

```ts
export function useCycleList<T>(list: MaybeRefOrGetter<T[]>) {
  const items = toRef(list)
  const index = ref(0)
  const state = computed(() => items.value[index.value])
  const next = () => { index.value = (index.value + 1) % items.value.length }
  return { state, next, index }
}
```

**Overloaded signatures (VueUse pattern):**

```ts
export function useEventListener<K extends keyof WindowEventMap>(
  event: K, handler: (e: WindowEventMap[K]) => void
): () => void
export function useEventListener<K extends keyof HTMLElementEventMap>(
  target: MaybeRefOrGetter<HTMLElement | null>, event: K, handler: (e: HTMLElementEventMap[K]) => void
): () => void
export function useEventListener(...args: any[]): () => void { /* implementation */ }
```
</composable_typing>

<store_typing>
## Pinia Store Typing

**Option store -- explicit state interface** (without it, `[]` infers as `never[]`):

```ts
interface ProductState { items: Product[]; loading: boolean; error: string | null }
export const useProductStore = defineStore('products', {
  state: (): ProductState => ({ items: [], loading: false, error: null }),
})
```

**Setup store** -- `ref()` = state, `computed()` = getters, `function` = actions. ALL state MUST be returned (SSR, devtools, plugins).

**Store factory with generics** -- use setup stores (Option stores have `UnwrapRefSimple<T>` generic bugs):

```ts
export function createCrudStore<T extends { id: string }>(name: string, endpoint: string) {
  return defineStore(name, () => {
    const items = ref<T[]>([])
    async function fetchAll() { items.value = await fetch(`/api/${endpoint}`).then(r => r.json()) }
    return { items, fetchAll }
  })
}
```

**storeToRefs** -- required for destructuring: `const { items } = storeToRefs(store)` for refs, `const { fetchAll } = store` for actions.

**Extract store type:** `type ProductStore = ReturnType<typeof useProductStore>`

**Inter-store deps:** call `useOtherStore()` inside getters/actions, never at setup store top-level if circular risk. In SSR, `useStore()` must be called BEFORE any `await`.
</store_typing>

<router_typing>
## Vue Router Typing

**RouteMeta augmentation:**

```ts
// router.d.ts
import 'vue-router'
export {}  // CRITICAL: without this, file is not a module and overwrites instead of augmenting

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth: boolean
    title?: string
    layout?: 'default' | 'admin' | 'auth'
  }
}
```

**Route params are ALWAYS string at runtime** (or string[] for repeated). Never trust `as number`:

```ts
// Validate at boundary
const userId = computed(() => {
  const id = Number(route.params.id)
  if (Number.isNaN(id)) throw new Error('Invalid user ID')
  return id
})
// Or convert in route definition: props: (route) => ({ id: Number(route.params.id) })
```

**Typed guards -- return value style (not next()):**

```ts
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !auth.isLoggedIn()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})
```

**Auto-generated typed routes:** `unplugin-vue-router` generates RouteNamedMap with typed params. VueRouter() plugin MUST be before Vue() in vite.config.
</router_typing>

<env_typing>
## Environment Typing

**env.d.ts:**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- Only `VITE_` prefixed vars are exposed to client code
- Server-only vars: no `VITE_` prefix, access via server middleware only
- Include `env.d.ts` in tsconfig `include` array
</env_typing>

<anti_patterns>
## Anti-Patterns

| Anti-pattern | Problem | Fix |
|---|---|---|
| `as any` to silence errors | Hides real type mismatches, crashes at runtime | Proper typing, type guard, or Zod validation |
| Untyped API responses (`r.json()`) | Returns `any`, propagates through codebase | `fetch -> unknown -> schema.parse() -> typed` |
| Optional props without defaults | `undefined` at runtime, template crashes | withDefaults or destructured defaults |
| `@ts-ignore` | Stays silent forever, masks future errors | `@ts-expect-error` with description comment |
| Typing computed as `Ref<T>` | Wrong type wrapper | Let inference work or use `ComputedRef<T>` |
| Loose string types for events | No autocomplete, typos pass | Literal union types in defineEmits |
| Missing vue-tsc in CI | Type errors in .vue files pass silently | `vue-tsc --noEmit` before `vite build` |
| Type assertion on template refs | `as HTMLInputElement` is fragile | `useTemplateRef<HTMLInputElement>('name')` |
| Module augmentation without `export {}` | Overwrites interface instead of augmenting | Add `export {}` to make file a module |
| `reactive<T>()` generic parameter | Return type is `UnwrapRef<T>`, not `T` | Annotate variable: `const x: T = reactive({...})` |
</anti_patterns>

<troubleshooting>
## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Type error in .vue but not in .ts | tsc doesn't understand .vue files | Use `vue-tsc --noEmit` for checking |
| defineProps type not inferred | Mixing runtime and type-based declaration | Use one style consistently |
| Template ref typed as null | Ref not typed with element type | `useTemplateRef<HTMLElement>('name')` |
| inject() type is unknown | Missing InjectionKey | Use `InjectionKey<T>` with Symbol |
| Store getters lose types | Complex generic inference in Pinia | Annotate getter return types explicitly |
| VITE_ env var is undefined at runtime | Missing env.d.ts or wrong prefix | Add to ImportMetaEnv, check VITE_ prefix |
| Generic component not inferring T | Missing generic attribute on script | Add `generic="T"` to `<script setup>` |
| vue-tsc errors don't match IDE | Version mismatch vue-tsc / typescript | Align versions, check Volar extension |
| `[]` inferred as `never[]` in store state | No type annotation on empty array | Use `ref<T[]>([])` or typed state interface |
| Circular store dependency infinite loop | Top-level useStore() calls in setup stores | Defer reads into computed or actions |
</troubleshooting>
