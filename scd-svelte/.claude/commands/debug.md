---
description: "Diagnose Svelte 5 / SvelteKit 2 errors. Routes symptoms to skill troubleshooting tables, then falls back to Svelte MCP documentation."
argument-hint: "[error message or symptom]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Debug Svelte 5 / SvelteKit 2 Errors

Diagnose Svelte 5 and SvelteKit 2 errors by routing symptoms to the correct skill reference file and presenting structured fixes.

## Step 1: Accept Symptom

Use `$ARGUMENTS` as the error or symptom description. If `$ARGUMENTS` is empty, ask the user to describe the error or paste the full error message.

## Step 2: Route Symptom to Reference Files

Match the user's symptom against this routing table to identify which reference file(s) contain the relevant troubleshooting information:

| Symptom Pattern | Reference File(s) |
|---|---|
| `ERR_SVELTE_TOO_MANY_UPDATES` / infinite loop | `runes-reactivity.md` |
| `$effect` not running on server / SSR asymmetry | `runes-reactivity.md` |
| `ownership_invalid_mutation` warning | `components-templates.md` |
| Hydration mismatch / client-server mismatch | `testing-styling-deploy.md` |
| Module state leak between users (SSR) | `state-management.md` |
| Context not available / called outside component | `state-management.md` |
| Store/rune confusion / `$` prefix errors | `ecosystem-antipatterns.md` |
| Load function waterfall / sequential awaits | `data-loading.md` |
| Form action CSRF error | `data-loading.md` |
| Serialization failure in load function | `data-loading.md` |
| `Cannot find module $app/...` / `$lib/...` | `typescript-patterns.md` |
| Generated types stale / `$types` errors | `typescript-patterns.md` |
| 404 on dynamic routes | `routing-navigation.md` |
| Prerender errors / `getStaticPaths` equivalent | `routing-navigation.md` |
| Hooks not running / auth bypass | `hooks-errors-security.md` |
| `$: ` reactive statement not working | `ecosystem-antipatterns.md` |
| `export let` / `createEventDispatcher` errors | `ecosystem-antipatterns.md` |
| Build failures / adapter errors | `testing-styling-deploy.md` |
| Test failures / vitest config issues | `testing-styling-deploy.md` |
| Transition / animation glitches | `testing-styling-deploy.md` |

If the symptom matches multiple patterns, route to ALL matched reference files.

If no clear match, check the three most likely based on context:
- Config/build errors -> `testing-styling-deploy.md`
- Runtime/component errors -> `runes-reactivity.md` or `components-templates.md`
- Data/server errors -> `data-loading.md` or `hooks-errors-security.md`

## Step 3: Read Troubleshooting Section from Matched Reference File(s)

For each matched reference file:

1. Find the troubleshooting section:
   ```
   grep -n '<troubleshooting>' .claude/skills/svelte-sveltekit/references/{matched-file}
   ```
2. Read the troubleshooting table (columns: Symptom | Cause | Fix)
3. Find the row that most closely matches the user's symptom

## Step 4: Check Anti-patterns (Fallback)

If no direct match was found in the troubleshooting table, check the anti_patterns section:

1. Find the anti-patterns section:
   ```
   grep -n '<anti_patterns>' .claude/skills/svelte-sveltekit/references/{matched-file}
   ```
2. Read the anti-patterns table
3. Check if the user's error aligns with a known anti-pattern

## Step 5: Check Critical Rules

Read the Critical Rules section from SKILL.md to check if the symptom matches any of the 10 breaking change violations:

```
grep -n "## Critical Rules" .claude/skills/svelte-sveltekit/SKILL.md
```

The 10 Critical Rules cover the most common Svelte 5 / SvelteKit 2 errors:
1. `$derived(expr)` -- NOT `$effect(() => { x = f(y) })`
2. `$props()` -- NOT `export let`
3. `{#snippet}` + `{@render}` -- NOT `<slot>`
4. Callback props -- NOT `createEventDispatcher`
5. Context API -- NOT module-level `$state` (SSR leak)
6. Load functions -- NOT `onMount(() => fetch(...))`
7. `hooks.server.ts` -- NOT layout load for auth
8. `class={[...]}` -- NOT `class:name={bool}`
9. `event.fetch` -- NOT global `fetch` in load
10. `$effect` does NOT run in SSR -- guard with `browser`

Many errors trace back to one of these violations.

## Step 6: Read Relevant Project Files

To confirm the diagnosis, read the user's project files that relate to the error:

- **Rune errors:** Read the failing .svelte or .svelte.ts file
- **Load errors:** Read the +page.server.ts or +page.ts file
- **Config errors:** Read svelte.config.js, tsconfig.json, vite.config.ts
- **Type errors:** Read src/app.d.ts and the failing file
- **Hook errors:** Read src/hooks.server.ts
- **Route errors:** Check src/routes/ structure with Glob

Use Glob to locate files if paths are uncertain:
```
glob src/routes/**/+page.server.ts
glob svelte.config.*
glob src/hooks.*
```

## Step 7: Present Diagnosis

Present the diagnosis in this structured format:

### Diagnosis

**Symptom:** [User's error description]

**Likely Cause:** [From troubleshooting table, anti-patterns, or Critical Rules]

**Fix:**
[From troubleshooting table fix column, with code snippet showing the exact change needed.]

**Prevention:** [How to avoid this in the future]

**Reference:** [Link to the reference file section, e.g., "See `.claude/skills/svelte-sveltekit/references/runes-reactivity.md` troubleshooting section"]

### If No Match Found

If no troubleshooting entry, anti-pattern, or Critical Rule matches the symptom:

1. Say so honestly: "This symptom is not covered in the skill's troubleshooting tables."
2. Route to the Svelte MCP server:
   ```
   mcp__svelte__get-documentation({ section: "<relevant section>" })
   ```
   First call `mcp__svelte__list-sections` to find the right section.
3. Suggest the user share more context (full error stack trace, config files, reproduction steps).

## Step 8: Offer to Apply Fix

Ask the user: "Would you like me to apply this fix to your project?"

Do NOT auto-apply the fix. Wait for explicit user confirmation before making any changes.

## Important Constraints

- ALWAYS read from reference files for diagnosis. Never diagnose from memory alone.
- Route to MULTIPLE reference files if the symptom spans domains.
- Check Critical Rules for EVERY diagnosis -- many Svelte 5 errors trace back to breaking change violations or Svelte 4 syntax.
- Present the fix before applying it. The user decides whether to proceed.
- After applying a fix to a .svelte file, always run `mcp__svelte__svelte-autofixer` to validate.
