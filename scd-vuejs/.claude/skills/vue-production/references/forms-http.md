# Forms & HTTP

Vue 3 form management and HTTP data fetching patterns: defineModel, validation, form state isolation, composable fetching, caching, auth interceptors — with decision tables, anti-patterns and troubleshooting. For exact API signatures, use official Vue docs via WebFetch.

Ten rules that cover 90% of form and HTTP decisions.

<quick_reference>

1. `defineModel()` (3.4+) for v-model — replaces manual prop + emit pattern
2. v-model on objects: mutation by reference — clone if child needs independent state
3. Validation: "reward early, punish late" — validate on blur first, then on input after first error
4. Form state isolation: clone-on-mount, never bind directly to store/API data
5. `shallowRef` for API response data (large objects not mutated in place)
6. AbortController in every composable fetch — cancel on unmount or re-trigger
7. `onWatcherCleanup` (3.5+) for cancelling previous fetch in watchers
8. TanStack Query for complex cache/refetch needs, simple composable for basic fetching
9. Token refresh: queue pending requests during refresh, replay after
10. Repository pattern: abstract API calls behind typed functions

</quick_reference>

defineModel basics, modifiers, multiple bindings, and the object mutation trap.

<vmodel_definemodel>

**Basic usage — replaces prop + emit boilerplate:**

```ts
const model = defineModel<string>()                    // Ref<string | undefined>
const model = defineModel<string>({ required: true })  // Ref<string>
const title = defineModel<string>('title')             // v-model:title
const content = defineModel<string>('content')         // v-model:content
const [model, modifiers] = defineModel<string, 'trim' | 'uppercase'>()
// modifiers.trim — boolean, no automatic effect on custom components
```

**Object by-reference trap:** `defineModel` wrapping an object lets child mutate parent data directly without emitting `update:modelValue`. Vue core team calls this an anti-pattern.

```ts
// PROBLEM: child mutates parent silently
const model = defineModel<User>()
model.value.name = 'new' // parent object mutated, no event

// FIX: clone for independent state
const local = ref(structuredClone(toRaw(props.modelValue)))
watch(local, (v) => emit('update:modelValue', structuredClone(toRaw(v))), { deep: true })
```

**v-model modifiers (.lazy, .number, .trim) on custom components:** passed as `modelModifiers` prop but have no automatic effect. `.number` and `.trim` cause cursor jumps on custom inputs.

</vmodel_definemodel>

Validation library choice, timing UX, async validation, and Zod integration.

<validation>

| Need | Recommendation |
|---|---|
| UI library (Vuetify, PrimeVue, Radix) | vee-validate (headless, no UI conflicts) |
| Schema-driven / generated forms | FormKit (JSON schema with expressions, conditionals) |
| Minimal bundle, simple forms | Manual Zod composable |
| Existing Vuelidate codebase | Migrate to Regle (spiritual successor) |

**Timing UX — "reward early, punish late":**

```ts
function useFieldValidation(value: Ref<string>, validate: (v: string) => string | null) {
  const error = ref<string | null>(null)
  const hasBeenInvalid = ref(false)

  function onBlur() {
    const result = validate(value.value)
    error.value = result
    if (result) hasBeenInvalid.value = true
  }
  watch(value, (v) => { if (hasBeenInvalid.value) error.value = validate(v) })
  return { error, onBlur }
}
```

**Async validation (uniqueness checks) — debounce + AbortController:**

```ts
let controller: AbortController | null = null
async function validateUsername(value: string): Promise<string | true> {
  controller?.abort()
  controller = new AbortController()
  try {
    const res = await fetch(`/api/check?u=${value}`, { signal: controller.signal })
    return (await res.json()).available || 'Username taken'
  } catch (e) {
    if ((e as Error).name === 'AbortError') return true
    return 'Validation failed'
  }
}
```

**Zod as single source of truth:** define schema once, use for form + API validation. Field-level: `schema.shape.email.safeParse(value)`. Form-level: `schema.safeParse(formData)`.

**Error display a11y:** `aria-describedby` linking to error element, `aria-invalid="true"` on errored fields, `role="alert"` for dynamic errors. Use `v-show` (not `v-if`) for error wrappers so `aria-live` regions exist in DOM on load.

</validation>

Clone-on-mount, dirty tracking, wizard forms, file uploads, dynamic forms.

<form_architecture>

**Clone-on-mount — isolate form state from store/API:**

```ts
function useFormState<T extends Record<string, any>>(source: Ref<T> | ComputedRef<T>) {
  const form = ref(structuredClone(toRaw(source.value))) as Ref<T>
  const isDirty = computed(() => JSON.stringify(form.value) !== JSON.stringify(source.value))

  watch(source, (v) => { form.value = structuredClone(toRaw(v)) }, { deep: true })
  function commit() { Object.assign(source.value, structuredClone(toRaw(form.value))) }
  function reset() { form.value = structuredClone(toRaw(source.value)) }
  return { form, isDirty, commit, reset }
}
```

| Clone method | Use when | Caveat |
|---|---|---|
| `structuredClone(toRaw(obj))` | Date/Map/Set support needed | Must `toRaw()` first — throws on reactive proxies |
| `JSON.parse(JSON.stringify())` | Simple data only | Loses Date, Map, Set, undefined, functions |
| VueUse `useCloned` | Reactive clone with auto-sync | JSON method by default, accepts custom fn |

**Unsaved changes:** combine `onBeforeRouteLeave` guard + `beforeunload` event, both checking `isDirty.value`.

**Multi-step wizard:** single `useForm` at parent, steps as groups. Use `v-show` (not `v-if`) to keep fields mounted — `v-if` destroys field registrations. Validate per-step Zod sub-schema before advancing.

**File uploads:** `URL.createObjectURL()` for previews (sync, fast). Must `revokeObjectURL` on unmount. Never store raw `File` in `reactive()` / Pinia — Proxy breaks File API. Use `shallowRef` or `markRaw(file)`.

</form_architecture>

Composable fetch pattern with 4-state reactivity, AbortController, and shallowRef.

<http_composables>

```ts
export function useFetch<T>(url: MaybeRefOrGetter<string>, options?: RequestInit) {
  const data: ShallowRef<T | undefined> = shallowRef()
  const error = shallowRef<Error>()
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  let controller: AbortController | undefined

  const execute = async () => {
    controller?.abort()
    controller = new AbortController()
    status.value = 'pending'
    error.value = undefined
    try {
      const res = await fetch(toValue(url), { ...options, signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data.value = await res.json()
      status.value = 'success'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      error.value = e as Error
      status.value = 'error'
    }
  }

  watch(() => toValue(url), execute, { immediate: true })
  onScopeDispose(() => controller?.abort())
  return { data, error, status, execute }
}
```

**Why shallowRef:** `ref()` deep-proxifies nested objects. `shallowRef()` tracks `.value` assignment only — replace entire value to trigger reactivity.

**HTTP client choice:** ofetch (~4 KB) for new projects (auto JSON, error throwing, retry). Axios (~13 KB) for existing interceptor chains. Native fetch for streaming or zero-dep.

**Cleanup:** `onScopeDispose` (works in components, Pinia, effectScope), not `onUnmounted` (components only).

**Error layers:** composable (network, reactive `error` ref) -> component (`onErrorCaptured`) -> app (`app.config.errorHandler`).

**Props reactivity trap:** pass `() => props.userId` (getter), never `props.userId` (captures value at call time).

</http_composables>

TanStack Query configuration, cache keys, optimistic updates, and simple SWR alternative.

<cache_tanstack>

**When to adopt:** complex cache, deduplication, background refetch, optimistic updates, pagination. Simple one-off fetches need only a custom composable.

| Setting | Default | Recommendation |
|---|---|---|
| `staleTime` | `0` (immediately stale) | Set `5 * 60 * 1000` globally |
| `gcTime` | `5 min` | Increase for stable data |
| `retry` (mutations) | `0` | Keep at 0 — side effects must not auto-retry |

**queryKey reactivity:** computed or getter for reactive keys. `enabled` as `computed(() => !!value)`, never plain boolean.

**placeholderData vs initialData:** `initialData` persists to cache, counts toward `staleTime`. `placeholderData` is observer-level only. Use `keepPreviousData` for pagination.

**Optimistic updates:** `onMutate` (cancel + snapshot + set) -> `onError` (restore) -> `onSettled` (invalidate). `setQueryData` must be immutable.

**Simple SWR without TanStack:**

```ts
const cache = new Map<string, { data: unknown; ts: number }>()
const TTL = 5 * 60 * 1000
function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < TTL) return entry.data as T
  cache.delete(key); return undefined
}
```

**Anti-pattern:** `useQuery` inside Pinia stores — query lifecycle conflicts with store persistence. Keep queries in components or composables.

</cache_tanstack>

Token storage, Axios interceptor refresh flow, ofetch hooks.

<auth_interceptors>

| Token type | Storage | Rationale |
|---|---|---|
| Refresh token | httpOnly + Secure + SameSite cookie | JS-inaccessible, XSS-proof |
| Access token | In-memory (Pinia ref) | Short-lived, no persistence needed |
| Never | localStorage | XSS-vulnerable |

**Axios transparent refresh with request queue — key structure:**

```ts
let isRefreshing = false
let failedQueue: Array<{ resolve: Function; reject: Function; config: any }> = []

api.interceptors.response.use(res => res, async (error) => {
  const original = error.config
  // Guard: prevent infinite loop on refresh endpoint
  if (original.url?.includes('/auth/refresh')) { authStore.logout(); return Promise.reject(error) }
  if (error.response?.status === 401 && !original._retry) {
    if (isRefreshing) {
      // Queue request — resolved when refresh completes
      return new Promise((resolve, reject) => { failedQueue.push({ resolve, reject, config: original }) })
    }
    original._retry = true; isRefreshing = true
    try {
      const newToken = await authStore.refreshAccessToken()
      // Replay queued requests with new token
      failedQueue.forEach(({ resolve, config }) => {
        config.headers.Authorization = `Bearer ${newToken}`; resolve(api(config))
      })
      failedQueue = []; original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch { authStore.logout(); return Promise.reject(error) }
    finally { isRefreshing = false }
  }
  return Promise.reject(error)
})
```

**ofetch limitation:** `onResponseError` cannot transparently retry like Axios. Wrap `$fetch` in custom utility with manual retry for complex refresh flows.

</auth_interceptors>

Common mistakes with concrete consequences and fixes.

<anti_patterns>

| Anti-pattern | Consequence | Fix |
|---|---|---|
| Binding form directly to store state | Every keystroke mutates global state, no rollback | Clone on mount, commit on save |
| Forgetting AbortController in composable | Race conditions, stale data overwrites fresh | Always abort on cleanup via `onScopeDispose` |
| Unbounded cache without TTL | Memory leak, module-level Map never GCs | LRU cache with max entries and expiry |
| Token in localStorage | XSS vulnerability | httpOnly cookies for refresh, memory for access |
| Validating only on submit | Poor UX, all errors at once | Progressive: blur first, input after first error |
| Ignoring race conditions in search | Old response overwrites new | Debounce + AbortController per request |
| Single try/catch for all HTTP errors | Cannot retry 5xx while showing 4xx | Classify errors: retry server/network, display client |
| Not typing API responses | Runtime crashes from unexpected shapes | Zod validation at API boundary |
| `ref()` for large API data | Thousands of deep Proxies | `shallowRef()`, replace entire `.value` |
| `v-if` on wizard steps | Destroys field registrations | `v-show` to keep fields mounted |

</anti_patterns>

Diagnostic table: symptom, cause, solution.

<troubleshooting>

| Symptom | Cause | Solution |
|---|---|---|
| v-model not updating parent | `defineModel` not used or wrong event | Use `defineModel()` (3.4+), check named model |
| Form changes affecting store | No clone isolation | `structuredClone(toRaw())` on mount |
| Stale data after navigation | Cache not invalidated | Invalidate queryKey or `refetch()` on mount |
| Race condition in search | Concurrent requests, old arrives last | AbortController + `onWatcherCleanup` (3.5+) |
| 401 infinite loop | Refresh fails, interceptor retries | Max retry count, exclude refresh URL, redirect to login |
| File preview broken | `createObjectURL` revoked too early | Revoke on unmount only, not on file change |
| Validation fires on mount | Immediate watch on fields | Blur event for initial trigger, `$lazy: true` |
| TanStack refetching too often | `staleTime` default 0 | Increase `staleTime` (e.g. 5 min) |
| `structuredClone` throws | Called on reactive proxy | `structuredClone(toRaw(obj))` |
| Loading spinner stuck | `isLoading` not reset on error | Reset in `finally` block |

</troubleshooting>
