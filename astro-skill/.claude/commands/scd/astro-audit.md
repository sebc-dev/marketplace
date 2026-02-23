---
description: Audit an existing Astro 5.x / Cloudflare Workers project against skill best practices and anti-patterns
disable-model-invocation: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Audit Astro/Cloudflare Project

Perform a comprehensive audit of the current Astro 5.x / Cloudflare Workers project against the astro-cloudflare skill best practices and anti-patterns.

## Current Project State

### Astro Config
!`cat astro.config.mjs 2>/dev/null || cat astro.config.ts 2>/dev/null || echo "NO_ASTRO_CONFIG"`

### Package.json
!`cat package.json 2>/dev/null || echo "NO_PACKAGE_JSON"`

### Wrangler Config
!`cat wrangler.jsonc 2>/dev/null || cat wrangler.toml 2>/dev/null || echo "NO_WRANGLER_CONFIG"`

### TypeScript Config
!`cat tsconfig.json 2>/dev/null || echo "NO_TSCONFIG"`

### Content Config
!`cat src/content.config.ts 2>/dev/null || echo "NO_CONTENT_CONFIG"`

### Content Config (wrong location check)
!`ls src/content/config.ts 2>/dev/null || echo "NOT_AT_WRONG_LOCATION"`

### Environment Files
!`ls .dev.vars .env 2>/dev/null || echo "NO_ENV_FILES"`

### Source Structure
!`find src -type f -name "*.astro" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -30 || echo "NO_SRC"`

---

## Audit Instructions

Run the audit in four stages, from most critical to least. For each check, inspect the pre-loaded project state above and use Grep/Glob to scan source files as needed.

### Stage 1: Critical Rules Check (CRITICAL severity)

Read the 10 Critical Rules from `.claude/skills/astro-cloudflare/SKILL.md`:

```bash
grep -n "## Critical Rules" .claude/skills/astro-cloudflare/SKILL.md
```

Then read the section (lines after that heading until the next `##`). Check the project against ALL 10 rules:

**Rule 1 -- Content config location:**
Check if `src/content/config.ts` exists (the WRONG location). Content config must be at `src/content.config.ts`.
```bash
ls src/content/config.ts 2>/dev/null
```

**Rule 2 -- No entry.slug usage:**
```bash
grep -rn "\.slug" src/ --include="*.astro" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules
```
Flag any `entry.slug` or `.slug` access on content entries. Should use `entry.id` instead.

**Rule 3 -- render() imported from astro:content:**
```bash
grep -rn "\.render()" src/ --include="*.astro" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules
```
Flag any `entry.render()` method calls. Should use `import { render } from 'astro:content'` then `render(entry)`.

**Rule 4 -- loader: glob() or loader: file() syntax:**
Check the content config for `type: 'content'` or `type: 'data'` (deprecated Astro v4 syntax).
```bash
grep -n "type:" src/content.config.ts 2>/dev/null | grep -E "'content'|'data'|\"content\"|\"data\""
```
Should use `loader: glob({ pattern, base })` or `loader: file()` instead.

**Rule 5 -- ClientRouter, not ViewTransitions:**
```bash
grep -rn "ViewTransitions" src/ --include="*.astro" --include="*.ts" --include="*.tsx" 2>/dev/null
```
Flag any `ViewTransitions` import or usage. Should use `<ClientRouter />` from `astro:transitions`.

**Rule 6 -- Astro.locals.runtime.env, not process.env:**
```bash
grep -rn "process\.env\." src/ --include="*.astro" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v "env\.d\.ts"
```
Flag any `process.env.VAR` usage in src/. Should use `Astro.locals.runtime.env.VAR` on Workers runtime. Note: `process.env` in `astro.config.mjs` is acceptable (build-time only).

**Rule 7 -- imageService: 'compile', not Sharp:**
Check the pre-loaded package.json for `sharp` in dependencies. Check astro.config for `imageService` setting.
```bash
grep -n "sharp" package.json 2>/dev/null
```
Should use `imageService: 'compile'` in the adapter config, not Sharp (incompatible with Workers).

**Rule 8 -- No output: 'hybrid':**
Check the pre-loaded astro.config for `output: 'hybrid'`.
```bash
grep -n "hybrid" astro.config.mjs 2>/dev/null || grep -n "hybrid" astro.config.ts 2>/dev/null
```
Should use `output: 'static'` or `output: 'server'`, never `output: 'hybrid'` (removed in v5).

**Rule 9 -- decodeURIComponent on dynamic params:**
Check if dynamic routes exist, then verify they decode params.
```bash
find src/pages -name "[*" -o -name "\\[*" 2>/dev/null
```
If dynamic routes exist, check for `decodeURIComponent(Astro.params`:
```bash
grep -rn "Astro.params" src/ --include="*.astro" 2>/dev/null
```
Flag any raw `Astro.params.slug` usage without `decodeURIComponent()` wrapping.

**Rule 10 -- import { z } from 'astro/zod':**
```bash
grep -rn "from 'zod'" src/ --include="*.ts" --include="*.tsx" --include="*.astro" 2>/dev/null | grep -v node_modules
grep -rn "from \"zod\"" src/ --include="*.ts" --include="*.tsx" --include="*.astro" 2>/dev/null | grep -v node_modules
```
Flag any direct `import { z } from 'zod'`. Should use `import { z } from 'astro/zod'`.

### Stage 2: Cloudflare Compatibility Check (CRITICAL severity)

Read the Anti-patterns section from the Cloudflare platform reference:

```bash
grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/cloudflare-platform.md
```

Read that section (from the heading to the next `##` or end of file). Then check:

- **process.env in src/:** Already checked in Rule 6 above. Confirm no runtime `process.env` usage.
- **Sharp in dependencies:** Already checked in Rule 7 above. Confirm no Sharp dependency.
- **Missing nodejs_compat flag:**
  Check the pre-loaded wrangler config for `nodejs_compat` in `compatibility_flags`.
  ```bash
  grep -n "nodejs_compat" wrangler.jsonc 2>/dev/null || grep -n "nodejs_compat" wrangler.toml 2>/dev/null
  ```
  Must include `"nodejs_compat"` in compatibility_flags.

- **Missing nodejs_compat_populate_process_env flag:**
  Check the pre-loaded wrangler config for `nodejs_compat_populate_process_env`.
  ```bash
  grep -n "nodejs_compat_populate_process_env" wrangler.jsonc 2>/dev/null || grep -n "nodejs_compat_populate_process_env" wrangler.toml 2>/dev/null
  ```

- **.env alongside .dev.vars:**
  Check the pre-loaded environment files section. If both `.env` and `.dev.vars` exist, flag as conflict. Cloudflare uses `.dev.vars` for local secrets, not `.env`.

### Stage 3: Config Correctness Checks (HIGH severity)

Read Anti-patterns sections from these reference files dynamically:

```bash
grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/project-structure.md
grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/rendering-modes.md
grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/typescript-testing.md
grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/build-deploy.md
```

For each file, read the Anti-patterns section (from the heading to the next `##` or end of file) and check the project against each listed anti-pattern. Key checks include:

- **platformProxy not enabled:**
  Check astro.config for `platformProxy` if an adapter is present.
  ```bash
  grep -n "platformProxy" astro.config.mjs 2>/dev/null || grep -n "platformProxy" astro.config.ts 2>/dev/null
  ```
  If adapter is configured, `platformProxy: { enabled: true }` should be present for local binding access.

- **tsconfig extends incorrect base:**
  Check the pre-loaded tsconfig.json for `extends` field. Should extend `astro/tsconfigs/strict` or `astro/tsconfigs/strictest`.

- **Missing wrangler types in scripts:**
  Check the pre-loaded package.json scripts for `wrangler types` in dev or build scripts.
  ```bash
  grep -n "wrangler types" package.json 2>/dev/null
  ```

- **Missing .assetsignore (if large static assets):**
  ```bash
  ls .assetsignore 2>/dev/null || echo "NO_ASSETSIGNORE"
  ls -la public/ 2>/dev/null | head -10
  ```
  If public/ contains large assets, recommend `.assetsignore`.

- **Wrong adapter import:**
  Check astro.config for the adapter import. Should be `@astrojs/cloudflare`.
  ```bash
  grep -n "cloudflare" astro.config.mjs 2>/dev/null || grep -n "cloudflare" astro.config.ts 2>/dev/null
  ```

### Stage 4: Best Practices Checks (MEDIUM severity)

Read Anti-patterns sections from the remaining reference files dynamically:

```bash
grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/components-islands.md
grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/routing-navigation.md
grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/data-content.md
grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/styling-performance.md
grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/seo-i18n.md
grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/security-advanced.md
```

For each file, read the Anti-patterns section and check the project. Key checks include:

- **client:load overuse:**
  ```bash
  grep -rn "client:load" src/ --include="*.astro" 2>/dev/null | wc -l
  grep -rn "client:visible\|client:idle" src/ --include="*.astro" 2>/dev/null | wc -l
  ```
  If `client:load` count significantly exceeds `client:visible`/`client:idle`, flag for review. Most components should use `client:visible` or `client:idle`.

- **Missing site in astro.config:**
  Check the pre-loaded astro.config for `site:` property. Needed for sitemap generation and canonical URLs.
  ```bash
  grep -n "site:" astro.config.mjs 2>/dev/null || grep -n "site:" astro.config.ts 2>/dev/null
  ```

- **ViewTransitions import:**
  Already checked in Rule 5. Confirm no `ViewTransitions` usage anywhere.

- **Inline styles that should be scoped:**
  ```bash
  grep -rn "style=" src/ --include="*.astro" 2>/dev/null | head -10
  ```
  Flag excessive inline `style=` attributes. Astro supports scoped `<style>` tags natively.

- **Missing alt on Image components:**
  ```bash
  grep -rn "<Image" src/ --include="*.astro" 2>/dev/null | grep -v "alt="
  ```
  All `<Image>` components must have `alt` attributes.

---

## Report Format

Output the audit report in this structure:

```markdown
# Astro/Cloudflare Audit Report

## Summary
- **Project:** [name from package.json]
- **Rendering mode:** [detected from astro.config output setting]
- **Adapter:** [detected from astro.config]
- **Issues found:** X CRITICAL, Y HIGH, Z MEDIUM

## CRITICAL Issues
[If any -- these break the build or runtime]

### [Issue title]
- **Rule:** [rule number if applicable]
- **File:** path/to/file:line
- **Problem:** [what's wrong]
- **Fix:** [the correct pattern]
- **Reference:** [path to reference file section]

## HIGH Issues
[If any -- these cause bugs or poor DX]

### [Issue title]
- **File:** path/to/file:line
- **Problem:** [what's wrong]
- **Fix:** [the correct pattern]
- **Reference:** [path to reference file section]

## MEDIUM Issues
[If any -- best practice improvements]

### [Issue title]
- **File:** path/to/file:line
- **Problem:** [what's wrong]
- **Fix:** [the correct pattern]
- **Reference:** [path to reference file section]

## Passed Checks
[List of checks that passed -- gives confidence the project is correct]

## Recommendations
[Ordered list of fixes, most critical first]
```

If a section has no issues, include it with "None found." to confirm it was checked.

---

## Post-Audit Actions

After presenting the report:

1. **Offer to fix CRITICAL issues** -- Ask the user for confirmation before each fix. Apply the correct pattern from the skill reference files. Never auto-fix without asking.
2. **Suggest reference file sections** for HIGH and MEDIUM issues -- Point to the specific section in the reference file where the correct pattern is documented.
3. **If no issues found** -- Confirm the project follows astro-cloudflare skill best practices. Mention which checks passed.

---

## Important Notes

- Read anti-patterns from reference files dynamically using grep. Do NOT rely on hardcoded anti-pattern content in this command -- the reference files are the source of truth and may be updated.
- Check ALL pre-loaded files even if some are missing. Report "NOT FOUND" as a CRITICAL finding if essential files like astro.config are missing.
- The audit must work on both SSG and SSR projects. Adjust checks based on the detected rendering mode.
- Do not suggest fixes that contradict the skill reference files. When in doubt, read the relevant reference section.
