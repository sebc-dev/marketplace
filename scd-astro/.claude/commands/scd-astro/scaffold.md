---
description: Create a new Astro 5.x project on Cloudflare Workers with recommended structure, configs, and best practices
disable-model-invocation: true
argument-hint: "[project-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Scaffold Astro/Cloudflare Project

Create a new Astro 5.x project targeting Cloudflare Workers with correct defaults and best practices from the astro-cloudflare skill.

## Step 1: Project Name

Use `$ARGUMENTS` as the project directory name. If `$ARGUMENTS` is empty, ask the user for a project name before proceeding.

## Step 2: Configuration Questions

Ask the user ALL of the following questions at once (present them together, not sequentially):

1. **Rendering mode:**
   - SSG (static site, default)
   - SSG + SSR pages (static with some dynamic pages)
   - Full SSR (all pages server-rendered)

2. **Cloudflare bindings:** None (default), KV, D1, R2, or any combination

3. **Tailwind CSS:** Yes (default) / No

4. **Package manager:** npm (default), pnpm, yarn

Wait for the user's answers before proceeding to Step 3.

## Step 3: Read Config Templates from Skill Reference Files

CRITICAL: Do NOT generate config files from memory. Read templates from the skill reference files and adapt them based on the user's choices.

### Always read:

- **Directory structure:**
  `grep -n "## File Organization" .claude/skills/astro-cloudflare/references/project-structure.md`
  Read the section to get the canonical directory layout. Use the simple structure for small projects (few pages, no collections) or the complex structure for larger projects.

- **Astro config template (choose based on rendering mode):**
  - If SSG: `grep -n "### astro.config.mjs -- SSG" .claude/skills/astro-cloudflare/references/project-structure.md`
  - If SSR or SSG+SSR: `grep -n "### astro.config.mjs -- SSR" .claude/skills/astro-cloudflare/references/project-structure.md`
  Read the matched section for the config template.

- **TypeScript config:**
  `grep -n "### tsconfig.json" .claude/skills/astro-cloudflare/references/project-structure.md`
  Read the section for the tsconfig template.

- **env.d.ts:**
  `grep -n "### src/env.d.ts" .claude/skills/astro-cloudflare/references/project-structure.md`
  Read the section for the env.d.ts template.

- **content.config.ts:**
  `grep -n "### src/content.config.ts" .claude/skills/astro-cloudflare/references/project-structure.md`
  Read the section for the content config template.

- **Wrangler config:**
  `grep -n "### wrangler.jsonc" .claude/skills/astro-cloudflare/references/cloudflare-platform.md`
  Read the section for the wrangler.jsonc template.

- **Dev vars:**
  `grep -n "### .dev.vars" .claude/skills/astro-cloudflare/references/cloudflare-platform.md`
  Read the section for the .dev.vars template.

- **Rendering mode details:**
  `grep -n "## Output Modes" .claude/skills/astro-cloudflare/references/rendering-modes.md`
  Read the section to confirm correct output/adapter configuration for the chosen mode.

- **Package scripts:**
  `grep -n "## Package.json Scripts" .claude/skills/astro-cloudflare/references/build-deploy.md`
  Read the section for the correct npm scripts (dev, build, preview, deploy, cf-typegen).

- **VS Code config:**
  `grep -n "## VS Code Configuration" .claude/skills/astro-cloudflare/references/build-deploy.md`
  Read the section for .vscode/extensions.json and .vscode/settings.json templates.

### Conditionally read:

- **If Tailwind selected:**
  `grep -n "## Tailwind v4 Setup" .claude/skills/astro-cloudflare/references/styling-performance.md`
  Read the section for Tailwind v4 installation and config.

- **If bindings selected:**
  `grep -n "## Bindings Access" .claude/skills/astro-cloudflare/references/cloudflare-platform.md`
  Read the section for binding access patterns and type generation.

## Step 4: Generate Project Files

Create the project directory and generate all files, adapting the templates from Step 3 for the user's choices:

1. **Create project directory** at the specified name
2. **Create directory structure** per the File Organization section (adapt simple vs complex based on scope)
3. **Write `astro.config.mjs`** from the matched template (SSG or SSR variant)
   - Use `imageService: 'compile'` in adapter config (NOT Sharp)
   - Use `output: 'static'` or `output: 'server'` (NEVER `output: 'hybrid'`)
4. **Write `tsconfig.json`** from the template
5. **Write `src/env.d.ts`** from the template -- add binding types if bindings selected
6. **Write `src/content.config.ts`** from the template -- place at `src/content.config.ts` (NOT `src/content/config.ts`)
7. **Write `wrangler.jsonc`** from the template
   - Add binding entries if bindings selected (KV, D1, R2 sections)
   - Workers target (NOT Pages)
8. **Write `.dev.vars`** from the template
9. **Write `package.json`** with:
   - Correct scripts from build-deploy.md Package Scripts section
   - Include `wrangler types` in the dev/build pipeline
   - Correct dependencies for chosen options
10. **Write `.gitignore`** including: `.wrangler/`, `.dev.vars`, `dist/`, `node_modules/`, `.astro/`
11. **Write `.vscode/extensions.json`** and `.vscode/settings.json`** from build-deploy.md VS Code Configuration section
12. **Write a starter `src/pages/index.astro`** page
13. **Write `src/layouts/Base.astro`** with a minimal HTML shell

## Step 5: Post-Creation

1. Run the selected package manager install command (`npm install`, `pnpm install`, or `yarn`)
2. If bindings were configured, run `npx wrangler types` to generate Cloudflare binding types
3. Print a summary:
   - List of created files
   - Selected configuration choices
   - Next steps (e.g., `cd <project>`, `npm run dev`, how to deploy)

## Critical Rules (MUST apply)

Before generating ANY file, ensure compliance with ALL 10 Critical Rules from the astro-cloudflare SKILL.md:

1. `src/content.config.ts` -- NOT `src/content/config.ts`
2. `entry.id` -- NOT `entry.slug`
3. `import { render } from 'astro:content'` then `render(entry)` -- NOT `entry.render()`
4. `loader: glob({ pattern, base })` -- NOT `type: 'content'`
5. `<ClientRouter />` from `astro:transitions` -- NOT `<ViewTransitions />`
6. `Astro.locals.runtime.env.VAR` -- NOT `process.env.VAR`
7. `imageService: 'compile'` in adapter config -- NOT Sharp
8. `output: 'static'` or `output: 'server'` -- NOT `output: 'hybrid'`
9. `decodeURIComponent(Astro.params.slug)` for decoded params
10. `import { z } from 'astro/zod'` -- NOT `import { z } from 'zod'`

NEVER inline config patterns from memory. Always read them from the reference files in Step 3.
