# scd-vuejs

Vue 3 (3.4+/3.5+) production skill for Claude Code. Architecture decisions, anti-pattern prevention, ecosystem selection, and troubleshooting. Complements the official Vue documentation via WebFetch.

## What this skill covers

- **Reactivity** -- ref, reactive, shallowRef, computed, watch, watchEffect selection and pitfalls
- **Composition API** -- defineProps/defineEmits/defineModel (3.4+), useTemplateRef (3.5+), composables
- **Components & templates** -- props validation, slots, dynamic components, attrs inheritance
- **State management** -- Pinia 2.x (option/setup stores, storeToRefs), provide/inject
- **Router** -- Vue Router v4 guards, middleware, typed routes, navigation patterns
- **TypeScript** -- strict patterns, generic components, typed slots, vue-tsc
- **Forms & HTTP** -- v-model, vee-validate, FormKit, TanStack Query, composable fetching
- **Performance** -- shallowRef, v-memo, code splitting, virtualization, memory leaks
- **Testing** -- Vitest, Vue Test Utils, Playwright, component/composable/store testing
- **Build & deploy** -- Vite config, CSS scoped/:deep/Tailwind, vue-i18n, security, CI/CD

## What the official docs cover

The official Vue documentation handles API signatures, syntax reference, and tutorials. This skill handles the "what to do and why" -- production decisions, pitfalls, and anti-patterns that the docs don't cover.

## Commands

| Command | Description |
|---------|-------------|
| `/scd-vuejs:audit` | Audit a project against best practices and anti-patterns |
| `/scd-vuejs:debug` | Diagnose errors using troubleshooting tables |
| `/scd-vuejs:migrate` | Generate an Options API to Composition API migration plan |
| `/scd-vuejs:scaffold` | Create a new Vue 3 project with correct defaults |

## Install

```bash
/plugin install scd-vuejs@sebc-dev-marketplace
```

## Requirements

- Vue 3.4+ / 3.5+ project
- WebFetch available for official docs lookup (recommended)

## License

MIT
