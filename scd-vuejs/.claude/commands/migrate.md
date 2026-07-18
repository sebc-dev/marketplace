---
description: "Analyze a Vue 2/Options API project and generate a prioritized migration plan to Vue 3 Composition API. Scans for legacy patterns and produces per-file migration checklists."
disable-model-invocation: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Migrate to Vue 3 Composition API

Analyze a Vue project and generate a prioritized migration plan from Options API / Vue 2 patterns to Vue 3 Composition API with `<script setup>`.

## Current Project State

### Package.json
!`cat package.json 2>/dev/null || echo "NO_PACKAGE_JSON"`

### Vite / Webpack Config
!`cat vite.config.ts 2>/dev/null || cat vite.config.js 2>/dev/null || cat vue.config.js 2>/dev/null || echo "NO_BUILD_CONFIG"`

### Component Count
!`find src -name "*.vue" 2>/dev/null | wc -l`

### Source Files
!`find src -name "*.vue" -o -name "*.ts" -o -name "*.js" 2>/dev/null | sort | head -50`

---

## Step 1: Read Migration Reference

Read the relevant reference sections for migration patterns:
```bash
grep -n '<anti_patterns>' .claude/skills/vue-production/references/composition-api.md
grep -n '<quick_reference>' .claude/skills/vue-production/references/reactivity-refs.md
grep -n '<anti_patterns>' .claude/skills/vue-production/references/state-pinia.md
```

## Step 2: Scan for Legacy Patterns

Run ALL of these scans to build the migration inventory:

**Pattern 1 -- Options API (`export default {}`):**
```bash
grep -rn 'export default {' src/ --include="*.vue" 2>/dev/null | grep -v node_modules
```
Flag any Options API components. Target: `<script setup lang="ts">`.

**Pattern 2 -- `this.$emit` -> `defineEmits()`:**
```bash
grep -rn 'this\.\$emit' src/ --include="*.vue" 2>/dev/null | grep -v node_modules
```

**Pattern 3 -- `this.$refs` -> `useTemplateRef()` (3.5+) or ref variable:**
```bash
grep -rn 'this\.\$refs' src/ --include="*.vue" 2>/dev/null | grep -v node_modules
```

**Pattern 4 -- `this.$nextTick` -> `nextTick()` import:**
```bash
grep -rn 'this\.\$nextTick' src/ --include="*.vue" 2>/dev/null | grep -v node_modules
```

**Pattern 5 -- Vuex -> Pinia:**
```bash
grep -rn 'vuex\|mapState\|mapGetters\|mapActions\|mapMutations\|this\.\$store' src/ --include="*.vue" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules
```

**Pattern 6 -- Vue Router v3 patterns -> v4:**
```bash
grep -rn 'this\.\$router\|this\.\$route\|beforeRouteEnter.*next' src/ --include="*.vue" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules
```

**Pattern 7 -- Mixins -> Composables:**
```bash
grep -rn 'mixins:' src/ --include="*.vue" 2>/dev/null | grep -v node_modules
```

**Pattern 8 -- Filters -> Functions/computed:**
```bash
grep -rn 'filters:' src/ --include="*.vue" 2>/dev/null | grep -v node_modules
```

**Pattern 9 -- `$on/$off/$once` event bus -> Pinia or mitt:**
```bash
grep -rn '\$on\|\$off\|\$once\|EventBus' src/ --include="*.vue" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules
```

**Pattern 10 -- `Vue.set/Vue.delete` -> direct assignment (Vue 3 proxy):**
```bash
grep -rn 'Vue\.set\|Vue\.delete\|\$set\|\$delete' src/ --include="*.vue" --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules
```

## Step 3: Identify Component Dependencies

Build a dependency graph to determine migration order (leaf components first):

```bash
# Find which components import other components
grep -rn "import .* from '\./\|import .* from '@/" src/ --include="*.vue" 2>/dev/null | grep -v node_modules
```

**Bottom-up strategy:** Migrate leaf components (no child component imports) first, then work up to parent components and layouts.

## Step 4: Generate Migration Plan

For each file with legacy patterns, produce a migration entry.

### Migration Plan Format

```markdown
# Vue 3 Composition API Migration Plan

## Summary
- **Total components:** [count]
- **Components needing migration:** [count]
- **Legacy pattern counts:**
  - Options API (export default): X files
  - this.$emit: X occurrences in Y files
  - this.$refs: X occurrences in Y files
  - this.$nextTick: X occurrences in Y files
  - Vuex (mapState/mapGetters/etc): X occurrences in Y files
  - Vue Router v3 patterns: X occurrences in Y files
  - Mixins: X files
  - Filters: X files
  - Event bus ($on/$off): X occurrences in Y files
  - Vue.set/Vue.delete: X occurrences in Y files

## Migration Order (bottom-up)

### Wave 1: Leaf Components (no child imports)
| File | Patterns | Priority |
|------|----------|----------|
| path/to/Component.vue | Options API, this.$emit | HIGH |

### Wave 2: Mid-level Components
| File | Patterns | Priority |
|------|----------|----------|

### Wave 3: Pages & Layouts
| File | Patterns | Priority |
|------|----------|----------|

## Per-File Migration Checklist

### [path/to/Component.vue]
- [ ] `export default { ... }` -> `<script setup lang="ts">`
- [ ] `props: { name: String }` -> `defineProps<{ name: string }>()`
- [ ] `emits: ['update']` -> `defineEmits<{ (e: 'update'): void }>()`
- [ ] `this.$emit('update')` -> `emit('update')`
- [ ] `data() { return { count: 0 } }` -> `const count = ref(0)`
- [ ] `computed: { doubled() {} }` -> `const doubled = computed(() => ...)`
- [ ] `watch: { ... }` -> `watch(source, callback)`
- [ ] `methods: { ... }` -> `function methodName() { ... }`
- [ ] `this.$refs.input` -> `useTemplateRef<HTMLInputElement>('input')`

**Before:**
```vue
[relevant snippet showing old patterns]
```

**After:**
```vue
[equivalent Composition API code]
```
```

## Step 5: Vuex to Pinia Assessment

For files using Vuex, assess each store:

Read the Pinia reference:
```bash
grep -n '<option_vs_setup_store>' .claude/skills/vue-production/references/state-pinia.md
```

Classify each Vuex module:
- **Direct conversion:** Simple state/getters/mutations/actions -> Pinia setup store
- **Needs redesign:** Complex module with nested state -> split into multiple Pinia stores
- **mapState/mapGetters:** -> `storeToRefs(useXStore())`
- **mapActions/mapMutations:** -> direct store method calls

### Vuex to Pinia Mapping

| Vuex | Pinia |
|------|-------|
| `state` | `ref()` / `reactive()` in setup store |
| `getters` | `computed()` |
| `mutations` | Direct state modification (removed concept) |
| `actions` | Functions (sync or async) |
| `modules` | Separate stores (`useXStore()`) |
| `mapState()` | `storeToRefs(useXStore())` |
| `mapGetters()` | `storeToRefs(useXStore())` |
| `mapActions()` | `const { action } = useXStore()` |
| `this.$store.dispatch()` | `const store = useXStore(); store.action()` |
| `this.$store.commit()` | Direct method call or `$patch()` |

## Step 6: Present Plan and Offer Assistance

Present the complete migration plan and ask:

1. "Would you like me to start migrating Wave 1 (leaf components)?"
2. "Would you like me to migrate a specific file?"

Do NOT auto-migrate without user confirmation. Always show before/after for each file before applying changes.

## Important Notes

- Read migration patterns from reference files dynamically. Do NOT rely on hardcoded patterns.
- The bottom-up order is critical: migrating parent components before children can cause cascading breakage.
- Vuex to Pinia is a separate migration wave -- assess complexity before starting.
- Options API `data()` -> `ref()` (NOT `reactive()`) as default per Critical Rule #1.
- Every migrated component should use `<script setup lang="ts">`.
- After migration, consider running the `/scd-vuejs:audit` command to verify best practices.
