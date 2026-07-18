---
description: Audit a Svelte 5 / SvelteKit 2 project against skill best practices and anti-patterns
disable-model-invocation: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Audit Svelte 5 / SvelteKit 2 Project

Perform a comprehensive audit of the current Svelte 5 / SvelteKit 2 project against the svelte-sveltekit skill best practices and anti-patterns.

## Current Project State

### Svelte Config
!`cat svelte.config.js 2>/dev/null || cat svelte.config.ts 2>/dev/null || echo "NO_SVELTE_CONFIG"`

### Package.json
!`cat package.json 2>/dev/null || echo "NO_PACKAGE_JSON"`

### TypeScript Config
!`cat tsconfig.json 2>/dev/null || echo "NO_TSCONFIG"`

### App Types
!`cat src/app.d.ts 2>/dev/null || echo "NO_APP_DTS"`

### Server Hooks
!`cat src/hooks.server.ts 2>/dev/null || echo "NO_HOOKS_SERVER"`

### Vite Config
!`cat vite.config.ts 2>/dev/null || cat vite.config.js 2>/dev/null || echo "NO_VITE_CONFIG"`

### Source Structure
!`find src -type f \( -name "*.svelte" -o -name "*.ts" -o -name "*.svelte.ts" \) 2>/dev/null | head -40 || echo "NO_SRC"`

---

## Audit Instructions

Run the audit in four stages, from most critical to least. For each check, inspect the pre-loaded project state above and use Grep/Glob to scan source files as needed.

### Stage 1: Critical Rules Check (CRITICAL severity)

Read the 10 Critical Rules from `.claude/skills/svelte-sveltekit/SKILL.md` then check each:

**Rule 1 -- $effect for derived state:**
```bash
grep -rn '\$effect' src/ --include="*.svelte" --include="*.svelte.ts" 2>/dev/null
```
Flag any `$effect(() => { ... = ...})` where the assignment could be `$derived`. Look for `$effect` setting state that depends on other state.

**Rule 2 -- export let (Svelte 4 syntax):**
```bash
grep -rn 'export let ' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
```
Flag any `export let` in .svelte files. Must use `let { ... } = $props()` instead.

**Rule 3 -- <slot> usage (deprecated):**
```bash
grep -rn '<slot' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
```
Flag any `<slot>` or `<slot name=`. Must use `{#snippet}` + `{@render}` instead.

**Rule 4 -- createEventDispatcher (removed):**
```bash
grep -rn 'createEventDispatcher' src/ --include="*.svelte" --include="*.ts" 2>/dev/null | grep -v node_modules
```
Flag any usage. Must use callback props (e.g., `onchange`) instead.

**Rule 5 -- Module-level $state (SSR singleton leak):**
```bash
grep -rn '^\(export \)\?\(let\|const\) .* = \$state' src/ --include="*.svelte.ts" --include="*.svelte.js" 2>/dev/null
```
Flag any module-level `$state` in `.svelte.ts` files. Must use Context API for SSR-safe state.

**Rule 6 -- onMount fetch (data should be in load functions):**
```bash
grep -rn 'onMount' src/ --include="*.svelte" 2>/dev/null
```
For each match, check if it contains `fetch`. Data fetching must use `+page.server.ts` or `+page.ts` load functions.

**Rule 7 -- Auth in layout load (should be in hooks.server.ts):**
Check if authentication/authorization logic exists in `+layout.ts` or `+layout.server.ts` load functions instead of `hooks.server.ts`.
```bash
grep -rn 'session\|auth\|user\|token' src/routes/ --include="+layout.ts" --include="+layout.server.ts" 2>/dev/null
```

**Rule 8 -- class: directive (deprecated):**
```bash
grep -rn 'class:' src/ --include="*.svelte" 2>/dev/null | grep -v 'class=' | grep -v node_modules
```
Flag any `class:name={bool}`. Must use `class={['a', condition && 'b']}` (5.16+).

**Rule 9 -- Global fetch instead of event.fetch:**
```bash
grep -rn 'fetch(' src/routes/ --include="+page.server.ts" --include="+page.ts" --include="+layout.server.ts" --include="+layout.ts" 2>/dev/null | grep -v 'event.fetch\|event\.fetch\|\.fetch(' | grep -v node_modules
```
Flag any bare `fetch()` in load functions. Must use `event.fetch` to preserve cookies and handle relative URLs.

**Rule 10 -- $effect without SSR guard:**
```bash
grep -rn '\$effect' src/ --include="*.svelte" --include="*.svelte.ts" 2>/dev/null
```
For each `$effect` that accesses browser APIs (window, document, localStorage), verify it's guarded with `browser` from `$app/environment`.

### Stage 2: Anti-pattern Scan (HIGH severity)

Read the `<anti_patterns>` sections from the reference files dynamically:

```bash
grep -n '<anti_patterns>' .claude/skills/svelte-sveltekit/references/runes-reactivity.md
grep -n '<anti_patterns>' .claude/skills/svelte-sveltekit/references/components-templates.md
grep -n '<anti_patterns>' .claude/skills/svelte-sveltekit/references/ecosystem-antipatterns.md
```

Read each anti_patterns section and scan the project. Key checks:

- **on:click syntax (Svelte 4):**
  ```bash
  grep -rn 'on:click\|on:change\|on:submit\|on:input\|on:keydown' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
  ```
  Must use `onclick`, `onchange`, etc. (no colon).

- **$$restProps / $$slots (Svelte 4 API):**
  ```bash
  grep -rn '\$\$restProps\|\$\$slots' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
  ```

- **$: reactive statements (Svelte 4):**
  ```bash
  grep -rn '^\s*\$:' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
  ```

- **Store imports in new code:**
  ```bash
  grep -rn "from 'svelte/store'" src/ --include="*.svelte" --include="*.ts" --include="*.svelte.ts" 2>/dev/null | grep -v node_modules
  ```
  Flag unless used for legacy interop. New code should use runes.

### Stage 3: Architecture Review (MEDIUM severity)

Read relevant reference file sections for architecture patterns:

```bash
grep -n '<decision_tree>' .claude/skills/svelte-sveltekit/references/state-management.md
grep -n '<server_vs_universal>' .claude/skills/svelte-sveltekit/references/data-loading.md
grep -n '<auth_patterns>' .claude/skills/svelte-sveltekit/references/hooks-errors-security.md
```

Analyze project-wide patterns:

- **State mechanism coherence:** Are different state mechanisms used consistently? Mixed stores + runes without interop bridges?
- **Load function patterns:** Sequential awaits causing waterfalls? Missing `Promise.all`?
  ```bash
  grep -rn 'await.*await' src/routes/ --include="+page.server.ts" --include="+page.ts" 2>/dev/null
  ```
- **Routing structure:** Deep layout nesting? Missing route groups?
- **Auth strategy:** Is auth in hooks.server.ts (correct) or scattered in layout load functions?

### Stage 4: Ecosystem Check (LOW severity)

Read the ecosystem reference:
```bash
grep -n '<quick_reference>' .claude/skills/svelte-sveltekit/references/ecosystem-antipatterns.md
```

Check package.json for:
- **Deprecated libraries:** svelte-forms-lib, svelte-navigator, svelte-routing, carbon-components-svelte (Svelte 4 only)
- **Svelte 5 compatibility:** Check that UI libraries are Svelte 5 compatible
- **Svelte version:** Verify `svelte` is 5.x in dependencies

---

## Report Format

Output the audit report in this structure:

```markdown
# Svelte 5 / SvelteKit 2 Audit Report

## Summary
- **Project:** [name from package.json]
- **Svelte version:** [from package.json]
- **SvelteKit version:** [from package.json]
- **Adapter:** [detected from svelte.config]
- **Issues found:** X CRITICAL, Y HIGH, Z MEDIUM, W LOW

## CRITICAL Issues
[If any -- these break SSR, cause runtime errors, or use removed APIs]

### [Issue title]
- **Rule:** [rule number if applicable]
- **File:** path/to/file:line
- **Problem:** [what's wrong]
- **Fix:** [the correct Svelte 5 pattern]
- **Reference:** [path to reference file section]

## HIGH Issues
[If any -- anti-patterns that cause bugs or poor DX]

## MEDIUM Issues
[If any -- architecture improvements]

## LOW Issues
[If any -- ecosystem recommendations]

## Passed Checks
[List of checks that passed]

## Recommendations
[Ordered list of fixes, most critical first]
```

If a section has no issues, include it with "None found." to confirm it was checked.

---

## Post-Audit Actions

After presenting the report:

1. **Offer to fix CRITICAL issues** -- Ask user confirmation before each fix.
2. **Suggest reference file sections** for HIGH and MEDIUM issues.
3. **If no issues found** -- Confirm the project follows Svelte 5 / SvelteKit 2 best practices.

## Important Notes

- Read anti-patterns from reference files dynamically. Do NOT rely on hardcoded content -- reference files are the source of truth.
- Check ALL pre-loaded files even if some are missing. Report "NOT FOUND" as a finding if essential files are missing.
- Do not suggest fixes that contradict the skill reference files.
