---
description: "Create a new SvelteKit 2 project with correct defaults and best practices. Interactive configuration, then generates structure and configs."
argument-hint: "[project name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Scaffold SvelteKit 2 Project

Create a new SvelteKit 2 project with Svelte 5 runes mode, correct defaults, and best practices from the svelte-sveltekit skill.

## Step 1: Project Name

Use `$ARGUMENTS` as the project directory name. If `$ARGUMENTS` is empty, ask the user for a project name before proceeding.

## Step 2: Configuration Questions

Ask the user ALL of the following questions at once using AskUserQuestion:

1. **Rendering mode:**
   - SSG (static site, default)
   - SSR (server-rendered app)
   - SPA (client-only, no SSR)
   - Hybrid (mix prerender per route)

2. **Adapter:**
   - adapter-auto (default)
   - adapter-node
   - adapter-cloudflare
   - adapter-vercel
   - adapter-netlify
   - adapter-static

3. **Tailwind CSS v4:** Yes (default) / No

4. **Auth library:** None (default), Better Auth, Lucia

5. **Database ORM:** None (default), Drizzle, Prisma

6. **i18n:** None (default), Paraglide JS v2

7. **Testing:** Vitest + Playwright (default) / Vitest only / None

8. **Package manager:** npm (default), pnpm, bun

Wait for the user's answers before proceeding to Step 3.

## Step 3: Read Patterns from Skill Reference Files

CRITICAL: Do NOT generate config files from memory. Read patterns from the skill reference files and adapt them.

### Always read:

- **Rendering mode config:**
  ```bash
  grep -n '<page_options>' .claude/skills/svelte-sveltekit/references/routing-navigation.md
  ```

- **Adapter selection:**
  ```bash
  grep -n '<adapter_selection>' .claude/skills/svelte-sveltekit/references/testing-styling-deploy.md
  ```

- **App types template:**
  ```bash
  grep -n '<app_types>' .claude/skills/svelte-sveltekit/references/typescript-patterns.md
  ```

- **Hooks patterns:**
  ```bash
  grep -n '<server_hooks>' .claude/skills/svelte-sveltekit/references/hooks-errors-security.md
  ```

- **Load function types:**
  ```bash
  grep -n '<load_function_types>' .claude/skills/svelte-sveltekit/references/typescript-patterns.md
  ```

### Conditionally read:

- **If Tailwind selected:**
  ```bash
  grep -n '<styling_patterns>' .claude/skills/svelte-sveltekit/references/testing-styling-deploy.md
  ```
  Read the Tailwind v4 setup section.

- **If auth selected:**
  ```bash
  grep -n '<auth_patterns>' .claude/skills/svelte-sveltekit/references/hooks-errors-security.md
  grep -n '<auth_libraries>' .claude/skills/svelte-sveltekit/references/ecosystem-antipatterns.md
  ```

- **If database selected:**
  ```bash
  grep -n '<database>' .claude/skills/svelte-sveltekit/references/ecosystem-antipatterns.md
  ```

- **If i18n selected:**
  ```bash
  grep -n '<i18n>' .claude/skills/svelte-sveltekit/references/ecosystem-antipatterns.md
  ```

- **If testing selected:**
  ```bash
  grep -n '<vitest_setup>' .claude/skills/svelte-sveltekit/references/testing-styling-deploy.md
  grep -n '<e2e_testing>' .claude/skills/svelte-sveltekit/references/testing-styling-deploy.md
  ```

- **If forms/validation needed:**
  ```bash
  grep -n '<forms_validation>' .claude/skills/svelte-sveltekit/references/ecosystem-antipatterns.md
  ```

## Step 4: Create Project

Use `sv create` to scaffold the base project, then customize:

```bash
npx sv create $PROJECT_NAME --template minimal --types ts
```

Then apply customizations based on user choices.

## Step 5: Generate Config Files

Adapt templates from Step 3 for the user's choices:

1. **`svelte.config.js`** -- Set adapter, prerender defaults based on rendering mode
2. **`src/app.d.ts`** -- App.Locals, App.Error, App.PageData, App.PageState typing
3. **`src/hooks.server.ts`** -- Handle hook skeleton. If auth selected, add auth middleware pattern.
4. **`src/routes/+layout.svelte`** -- Root layout with `{@render children()}`
5. **`src/routes/+page.svelte`** -- Starter home page

### If Tailwind selected:
6. **`src/app.css`** -- Tailwind v4 imports (`@import "tailwindcss"`)

### If auth selected:
7. **Auth setup** based on chosen library (hooks.server.ts integration, App.Locals typing)

### If database selected:
8. **`src/lib/server/db.ts`** -- Database client setup (server-only via `$lib/server`)

### If testing selected:
9. **`vitest.config.ts`** -- Vitest config with svelteTesting plugin
10. **`playwright.config.ts`** -- Playwright config (if Playwright selected)
11. **`src/routes/+page.svelte.test.ts`** -- Example component test

## Step 6: Install Dependencies

Run the selected package manager to install, then add optional dependencies:

```bash
cd $PROJECT_NAME && npm install
```

Add optional packages based on choices:
- Tailwind: `npx sv add tailwindcss`
- Testing: `npm install -D vitest @testing-library/svelte jsdom vitest-browser-svelte`
- Playwright: `npm install -D @playwright/test && npx playwright install`
- Auth: Install the chosen auth library
- Database: Install the chosen ORM
- i18n: Install Paraglide

## Step 7: Post-Creation Summary

Print a summary:

```markdown
## Project Created: [name]

### Configuration
- Rendering: [mode]
- Adapter: [adapter]
- Tailwind: [yes/no]
- Auth: [library or none]
- Database: [ORM or none]
- i18n: [library or none]
- Testing: [setup]

### Files Created
[list of generated files]

### Next Steps
1. `cd [project-name]`
2. `npm run dev`
3. Open http://localhost:5173

### Key Conventions (Svelte 5)
- Use `$props()` not `export let`
- Use `{#snippet}` not `<slot>`
- Use `$derived()` not `$: computed = ...`
- Use callback props not `createEventDispatcher`
- Use `class={[...]}` not `class:name={bool}`
- Always validate with svelte-autofixer after generating .svelte files
```

## Critical Rules (MUST apply to all generated code)

1. `$derived(expr)` -- NOT `$effect(() => { x = f(y) })`
2. `let { ...props } = $props()` -- NOT `export let`
3. `{#snippet}` + `{@render}` -- NOT `<slot>`
4. Callback props -- NOT `createEventDispatcher`
5. `class={[...]}` -- NOT `class:name={bool}`
6. `event.fetch` in load functions -- NOT global `fetch`
7. Auth in `hooks.server.ts` -- NOT layout load
8. `+page.server.ts` for data -- NOT `onMount(() => fetch(...))`

NEVER inline patterns from memory. Always read them from the reference files in Step 3.
