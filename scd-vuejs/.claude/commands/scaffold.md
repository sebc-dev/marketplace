---
description: "Create a new Vue 3 project with correct defaults and best practices. Interactive configuration, then generates structure and configs."
argument-hint: "[project name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Scaffold Vue 3 Project

Create a new Vue 3 project with Composition API, correct defaults, and best practices from the vue-production skill.

## Step 1: Project Name

Use `$ARGUMENTS` as the project directory name. If `$ARGUMENTS` is empty, ask the user for a project name before proceeding.

## Step 2: Configuration Questions

Ask the user ALL of the following questions at once using AskUserQuestion:

1. **Rendering mode:**
   - SPA (single-page app, default)
   - SSR (Nuxt 3)

2. **Router:** Yes (default) / No

3. **State management:** Pinia (default) / None

4. **Tailwind CSS:** Yes (default) / No

5. **Form validation:** None (default), vee-validate + Zod, FormKit

6. **Testing:** Vitest + Playwright (default) / Vitest only / None

7. **i18n:** None (default), vue-i18n

8. **Package manager:** npm (default), pnpm, bun

Wait for the user's answers before proceeding to Step 3.

## Step 3: Read Patterns from Skill Reference Files

CRITICAL: Do NOT generate config files from memory. Read patterns from the skill reference files and adapt them.

### Always read:

- **Reactivity patterns:**
  ```bash
  grep -n '<quick_reference>' .claude/skills/vue-production/references/reactivity-refs.md
  ```

- **Composition API patterns:**
  ```bash
  grep -n '<composable_architecture>' .claude/skills/vue-production/references/composition-api.md
  ```

- **TypeScript patterns:**
  ```bash
  grep -n '<env_typing>' .claude/skills/vue-production/references/typescript-patterns.md
  ```

- **Build config:**
  ```bash
  grep -n '<vite_config>' .claude/skills/vue-production/references/build-security-deploy.md
  ```

### Conditionally read:

- **If Router selected:**
  ```bash
  grep -n '<route_architecture>' .claude/skills/vue-production/references/router-navigation.md
  grep -n '<guards_middleware>' .claude/skills/vue-production/references/router-navigation.md
  ```

- **If Pinia selected:**
  ```bash
  grep -n '<option_vs_setup_store>' .claude/skills/vue-production/references/state-pinia.md
  grep -n '<store_architecture>' .claude/skills/vue-production/references/state-pinia.md
  ```

- **If Tailwind selected:**
  ```bash
  grep -n '<tailwind_vue>' .claude/skills/vue-production/references/testing-styling-i18n.md
  ```

- **If form validation selected:**
  ```bash
  grep -n '<validation>' .claude/skills/vue-production/references/forms-http.md
  ```

- **If testing selected:**
  ```bash
  grep -n '<vitest_setup>' .claude/skills/vue-production/references/testing-styling-i18n.md
  grep -n '<component_testing>' .claude/skills/vue-production/references/testing-styling-i18n.md
  ```

- **If i18n selected:**
  ```bash
  grep -n '<i18n_patterns>' .claude/skills/vue-production/references/testing-styling-i18n.md
  ```

## Step 4: Create Project

Use `npm create vue@latest` to scaffold the base project:

```bash
npm create vue@latest $PROJECT_NAME -- --typescript --jsx --router --pinia --vitest --playwright --eslint --prettier
```

Adjust flags based on user's choices (remove --router if no router, etc.).

Then apply customizations based on user choices.

## Step 5: Generate Config Files

Adapt templates from Step 3 for the user's choices:

1. **`vite.config.ts`** -- Set resolve alias, server proxy if needed
2. **`src/env.d.ts`** -- ImportMetaEnv typing for VITE_ variables
3. **`src/App.vue`** -- Root component with `<script setup lang="ts">`

### If Router selected:
4. **`src/router/index.ts`** -- Lazy-loaded routes, 404 catch-all, typed meta
5. **`src/views/HomeView.vue`** -- Starter page

### If Pinia selected:
6. **`src/stores/counter.ts`** -- Example setup store with storeToRefs usage

### If Tailwind selected:
7. **`tailwind.config.js`** + **`src/assets/main.css`** -- Tailwind setup

### If form validation selected:
8. **Validation setup** based on chosen library

### If i18n selected:
9. **`src/i18n/index.ts`** -- vue-i18n setup with lazy locale loading
10. **`src/i18n/locales/en.json`** -- Starter locale file

### If testing selected:
11. **`vitest.config.ts`** -- Vitest config with vue plugin
12. **`src/components/__tests__/example.test.ts`** -- Example component test

## Step 6: Install Dependencies

Run the selected package manager to install, then add optional dependencies:

```bash
cd $PROJECT_NAME && npm install
```

Add optional packages based on choices:
- Tailwind: `npm install -D tailwindcss @tailwindcss/vite`
- Testing: Already included via create-vue flags
- Form validation: `npm install vee-validate zod @vee-validate/zod` or `npm install @formkit/vue`
- i18n: `npm install vue-i18n`
- HTTP: `npm install ofetch` (recommended over raw fetch)

## Step 7: Post-Creation Summary

Print a summary:

```markdown
## Project Created: [name]

### Configuration
- Rendering: [mode]
- Router: [yes/no]
- State: [Pinia/none]
- Tailwind: [yes/no]
- Form validation: [library or none]
- Testing: [setup]
- i18n: [library or none]

### Files Created
[list of generated files]

### Next Steps
1. `cd [project-name]`
2. `npm run dev`
3. Open http://localhost:5173

### Key Conventions (Vue 3 Composition API)
- Use `ref()` not `reactive()` as default
- Use `defineModel()` not manual prop + emit for v-model (3.4+)
- Use `storeToRefs()` to destructure Pinia stores
- Use `computed(() => route.params.id)` not route destructuring
- Use `shallowRef()` for large data (1000+ items)
- Use `vue-tsc --noEmit` for type checking in CI
```

## Critical Rules (MUST apply to all generated code)

1. `ref()` by default -- NOT `reactive()`
2. `<script setup lang="ts">` -- NOT Options API
3. `defineModel()` for v-model (3.4+) -- NOT prop + emit
4. `storeToRefs()` for Pinia destructuring
5. Lazy import for router routes
6. `computed(() => route.params.id)` for reactive route params
7. Type-based `defineProps<{}>()` for TypeScript
8. AbortController in composable fetches

NEVER inline patterns from memory. Always read them from the reference files in Step 3.
