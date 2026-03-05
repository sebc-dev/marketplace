# Components & Templates

Vue 3 component system (SFC, props, emits, slots, dynamic components) and template syntax (directives, refs, attrs inheritance). For exact API signatures, use official Vue docs via WebFetch.

<quick_reference>
1. Single-file components (.vue) with `<script setup lang="ts">` as standard -- composable-first
2. Props are one-way down -- never mutate a prop directly, emit events to request parent changes
3. Events flow up via `defineEmits` -- use typed events with explicit payload types
4. Slots for content distribution -- named slots for multiple insertion points
5. v-bind shorthand (3.4+): `:prop` same-name shorthand when prop name matches variable
6. `v-for` requires `:key` -- use stable unique IDs, never array index on dynamic lists
7. `v-if` vs `v-show`: `v-if` is lazy (removes from DOM), `v-show` toggles `display` (frequent toggling)
8. `Teleport` for modals/tooltips/toasts -- render outside component DOM tree
9. Component names: PascalCase in script, PascalCase or kebab-case in templates
10. Props should be immutable -- emit events to request parent changes
</quick_reference>
<props_validation>

## Props with TypeScript

```vue
<script setup lang="ts">
// Type-based props -- compiler extracts runtime checks
interface Props {
  title: string
  count?: number
  items: string[]
  status: 'active' | 'inactive'
  config?: Record<string, unknown>
}

// withDefaults for optional props with defaults
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  status: 'active',
  config: () => ({})  // Object/Array defaults MUST use factory function
})
</script>
```

```vue
<script setup lang="ts">
// Runtime validation (when you need validator functions)
const props = defineProps({
  score: {
    type: Number,
    required: true,
    validator: (v: number) => v >= 0 && v <= 100
  },
  variant: {
    type: String as PropType<'primary' | 'ghost'>,
    default: 'primary'
  }
})
</script>
```

| Rule | Detail |
|------|--------|
| Naming | camelCase in script, kebab-case in templates (automatic conversion) |
| Boolean casting | `<Comp disabled />` = `true`, absence = `false` |
| Object/Array defaults | Must use factory function `() => ({})` or `() => []` |
| Type + Runtime | Cannot mix type-based `defineProps<T>()` with runtime object syntax |
| Readonly | Props are shallowly readonly -- deep mutation silently works but is a bug |
</props_validation>
<slots_composition>

## Slots

```vue
<!-- Card.vue -- child with named + scoped slots -->
<template>
  <div class="card">
    <header v-if="$slots.header"><slot name="header" /></header>
    <slot />  <!-- default slot -->
    <div v-for="(item, i) in items" :key="item.id">
      <slot name="item" :item="item" :index="i" />
    </div>
  </div>
</template>
```

```vue
<!-- Parent usage -->
<Card>
  <p>Body content</p>
  <template #header><h2>Title</h2></template>
  <template #item="{ item, index }">{{ index }}: {{ item.name }}</template>
  <template #[dynamicSlotName]>Dynamic</template>
</Card>
```

- Check slot existence: `$slots.header` in template, `useSlots()` in script
- **Renderless pattern:** component with logic only, expose data via `<slot :x="x" :y="y" />`
</slots_composition>
<dynamic_components>

## Dynamic & Async Components

```vue
<script setup lang="ts">
import TabA from './TabA.vue'
import TabB from './TabB.vue'

const tabs = { TabA, TabB } as const
const current = ref<keyof typeof tabs>('TabA')
</script>

<template>
  <!-- Dynamic component switching -->
  <KeepAlive :max="5" :include="['TabA']">
    <component :is="tabs[current]" :key="current" />
  </KeepAlive>
</template>
```

```ts
// Async component with loading/error states
const AsyncDialog = defineAsyncComponent({
  loader: () => import('./HeavyDialog.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorFallback,
  delay: 200,        // ms before showing loading
  timeout: 10000     // ms before error state
})
```

| Feature | Usage |
|---------|-------|
| `<component :is>` | Switch between components dynamically |
| `KeepAlive` | Cache instances on switch, `include`/`exclude` by name, `max` limit |
| `defineAsyncComponent` | Code splitting, lazy load with loading/error states |
| `Suspense` | For `async setup()` components, `#default` + `#fallback` slots |
</dynamic_components>
<builtin_components>

## Built-in Components

```vue
<template>
  <!-- Transition: single element enter/leave -->
  <Transition name="fade" mode="out-in" appear>
    <component :is="currentView" :key="viewKey" />
  </Transition>

  <!-- TransitionGroup: list with move animations -->
  <TransitionGroup name="list" tag="ul" move-class="list-move">
    <li v-for="item in sortedItems" :key="item.id">{{ item.name }}</li>
  </TransitionGroup>

  <!-- Teleport: render in different DOM location -->
  <Teleport to="body" :disabled="inline">
    <div class="modal-overlay" v-if="open">
      <div class="modal">
        <slot />
      </div>
    </div>
  </Teleport>
</template>
```

CSS classes for `<Transition name="fade">`: `.fade-enter-from`, `.fade-enter-active`, `.fade-enter-to`, `.fade-leave-from`, `.fade-leave-active`, `.fade-leave-to`. Use `mode="out-in"` to prevent overlap.
</builtin_components>
<template_patterns>

## Template Patterns

```vue
<template>
  <!-- v-for + filtering: ALWAYS use computed, never v-if on same element -->
  <div v-for="item in activeItems" :key="item.id">
    {{ item.name }}
  </div>

  <!-- Template ref (3.5+) -->
  <input ref="searchInput" />

  <!-- v-html: XSS risk -- ALWAYS sanitize -->
  <div v-html="sanitizedHtml" />

  <!-- Event modifiers -->
  <form @submit.prevent="onSubmit">
    <button @click.stop.once="handleClick">Click</button>
  </form>

  <!-- Key modifiers -->
  <input @keyup.enter="submit" @keyup.escape="cancel" />
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'

const activeItems = computed(() => items.value.filter(i => i.active))
const searchInput = useTemplateRef('searchInput') // 3.5+
const sanitizedHtml = computed(() => DOMPurify.sanitize(rawHtml.value))
</script>
```

| Modifier | Effect |
|----------|--------|
| `.prevent` | `e.preventDefault()` |
| `.stop` | `e.stopPropagation()` |
| `.once` | Fire handler only once |
| `.self` | Only if `e.target === e.currentTarget` |
| `.capture` | Use capture mode |
| `.passive` | `{ passive: true }` for scroll perf |
</template_patterns>
<attrs_inheritance>

## Attribute Inheritance

By default, non-prop non-emit attributes (`class`, `style`, `id`, `data-*`, `aria-*`) pass through to the root element.

```vue
<!-- BaseButton.vue -- manual attrs binding -->
<script setup lang="ts">
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
</script>

<template>
  <div class="btn-wrapper">
    <!-- Bind attrs to inner element instead of root -->
    <button class="btn" v-bind="attrs">
      <slot />
    </button>
  </div>
</template>
```

| Scenario | Behavior |
|----------|----------|
| Single root element | Attrs auto-applied to root |
| Multi-root component | Attrs NOT auto-inherited -- must bind explicitly with `v-bind="$attrs"` |
| `inheritAttrs: false` | Disable auto-inheritance, use `useAttrs()` for manual control |
| Class/style merging | Parent and component classes are merged (not replaced) |
</attrs_inheritance>
<anti_patterns>

## Anti-patterns

| Don't | Do | Severity |
|-------|-----|----------|
| Mutate props directly | Emit event to parent, let parent update | CRITICAL |
| `v-for` without `:key` | Always use stable unique key | CRITICAL |
| `v-for` with index as key on dynamic lists | Use `item.id` or stable unique ID | HIGH |
| `v-if` + `v-for` on same element | Computed filter or `<template v-for>` wrapper | HIGH |
| God components (>300 lines) | Extract child components or composables | HIGH |
| Prop drilling >3 levels | `provide`/`inject` or Pinia store | HIGH |
| Using `$parent`/`$children` | Props/emits or provide/inject | HIGH |
| String template refs with name collision | `useTemplateRef()` (3.5+) | MEDIUM |
| Inline complex expressions in template | Computed properties | MEDIUM |
| Event bus for parent-child communication | Props/emits pattern | MEDIUM |
</anti_patterns>
<troubleshooting>

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Prop mutation warning" | Mutating prop directly | Emit event, let parent update the value |
| Component not rendering | Not imported or not registered | Auto-import or explicit import in `<script setup>` |
| Slot content not showing | Wrong slot name or missing `<template>` wrapper | Check `#name` matches slot definition |
| `v-for` items not updating | Using index as key with splice/sort | Use unique stable IDs as `:key` |
| Attrs applied to wrong element | Multi-root without explicit `v-bind="$attrs"` | Add `inheritAttrs: false` + manual binding |
| Event not firing | camelCase vs kebab-case mismatch | `defineEmits` with exact names, parent uses kebab-case |
| Async component stuck loading | Network error or wrong import path | Add `errorComponent` to `defineAsyncComponent` options |
| KeepAlive not caching | Missing `include` or component re-created | Check `include` pattern matches component `name` |
| Teleport content duplicated | Multiple `<Teleport>` to same target | Use different targets or single `<Teleport>` instance |
| `useTemplateRef` returns null | Ref accessed before mount | Access in `onMounted` or use `watchEffect` |
</troubleshooting>
