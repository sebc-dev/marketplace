---
description: "Diagnose Vue 3 / Composition API errors. Routes symptoms to skill troubleshooting tables, then falls back to official Vue docs via WebFetch."
argument-hint: "[error message or symptom]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# Debug Vue 3 Errors

Diagnose Vue 3 and Composition API errors by routing symptoms to the correct skill reference file and presenting structured fixes.

## Step 1: Accept Symptom

Use `$ARGUMENTS` as the error or symptom description. If `$ARGUMENTS` is empty, ask the user to describe the error or paste the full error message.

## Step 2: Route Symptom to Reference Files

Match the user's symptom against this routing table to identify which reference file(s) contain the relevant troubleshooting information:

| Symptom Pattern | Reference File(s) |
|---|---|
| Reactive value not updating / lost reactivity | `reactivity-refs.md` |
| Watch not firing / watch fires too often | `reactivity-refs.md` |
| shallowRef not triggering update | `reactivity-refs.md` |
| Template ref is null | `reactivity-refs.md`, `composition-api.md` |
| Lifecycle hook silently ignored / not called | `composition-api.md` |
| defineModel object mutates parent directly | `composition-api.md` |
| Composable not cleaning up / memory leak | `composition-api.md`, `performance-lifecycle.md` |
| provide/inject value not reactive | `composition-api.md` |
| Prop mutation warning | `components-templates.md` |
| Slot content not rendering | `components-templates.md` |
| v-for items not updating / key issues | `components-templates.md` |
| Attrs applied to wrong element | `components-templates.md` |
| Store state not reactive after destructuring | `state-pinia.md` |
| SSR state leaked between requests | `state-pinia.md` |
| Pinia action not tracked in DevTools | `state-pinia.md` |
| Route param not updating component | `router-navigation.md` |
| Infinite redirect loop in guards | `router-navigation.md` |
| Navigation failure silently ignored | `router-navigation.md` |
| TypeScript type error in .vue file | `typescript-patterns.md` |
| Generic component not inferring type | `typescript-patterns.md` |
| v-model not updating parent | `forms-http.md` |
| Race condition in search / stale data | `forms-http.md` |
| 401 loop / token refresh issue | `forms-http.md` |
| App slow with large list / performance | `performance-lifecycle.md` |
| Memory grows on navigation | `performance-lifecycle.md` |
| onUpdated infinite loop | `performance-lifecycle.md` |
| Scoped style not applying to child | `testing-styling-i18n.md` |
| Test passes but component doesn't work | `testing-styling-i18n.md` |
| useI18n error outside component | `testing-styling-i18n.md` |
| XSS in user-generated content | `build-security-deploy.md` |
| VITE_ variable undefined | `build-security-deploy.md` |
| Build fails in CI but works locally | `build-security-deploy.md` |

If the symptom matches multiple patterns, route to ALL matched reference files.

If no clear match, check the three most likely based on context:
- Reactivity/state errors -> `reactivity-refs.md` or `state-pinia.md`
- Component/template errors -> `components-templates.md` or `composition-api.md`
- Build/config errors -> `build-security-deploy.md` or `typescript-patterns.md`

## Step 3: Read Troubleshooting Section from Matched Reference File(s)

For each matched reference file:

1. Find the troubleshooting section:
   ```
   grep -n '<troubleshooting>' .claude/skills/vue-production/references/{matched-file}
   ```
2. Read the troubleshooting table (columns: Symptom | Cause | Fix)
3. Find the row that most closely matches the user's symptom

## Step 4: Check Anti-patterns (Fallback)

If no direct match was found in the troubleshooting table, check the anti_patterns section:

1. Find the anti-patterns section:
   ```
   grep -n '<anti_patterns>' .claude/skills/vue-production/references/{matched-file}
   ```
2. Read the anti-patterns table
3. Check if the user's error aligns with a known anti-pattern

## Step 5: Check Critical Rules

Read the Critical Rules section from SKILL.md to check if the symptom matches any of the 10 critical rule violations:

The 10 Critical Rules cover the most common Vue 3 errors:
1. `ref()` by default -- NOT `reactive()`
2. `defineModel()` for v-model (3.4+) -- NOT prop + emit
3. Composables: `toValue()`/`toRef()` at boundaries
4. Lifecycle hooks synchronous -- after `await` silently ignored
5. `storeToRefs()` for Pinia destructuring
6. `useRoute()` is reactive, destructuring is not
7. Guards: return values -- NOT `next()` callback
8. `shallowRef()` for large data
9. `v-html` = XSS vector -- sanitize with DOMPurify
10. `VITE_` prefix exposes to client bundle

Many errors trace back to one of these violations.

## Step 6: Read Relevant Project Files

To confirm the diagnosis, read the user's project files that relate to the error:

- **Reactivity errors:** Read the failing .vue or composable file
- **Store errors:** Read the Pinia store file
- **Router errors:** Read src/router/index.ts and relevant route files
- **Config errors:** Read vite.config.ts, tsconfig.json
- **Type errors:** Read the failing file and tsconfig.json
- **Build errors:** Read vite.config.ts, package.json

Use Glob to locate files if paths are uncertain:
```
glob src/stores/**/*.ts
glob src/router/**/*.ts
glob src/composables/**/*.ts
glob vite.config.*
```

## Step 7: Present Diagnosis

Present the diagnosis in this structured format:

### Diagnosis

**Symptom:** [User's error description]

**Likely Cause:** [From troubleshooting table, anti-patterns, or Critical Rules]

**Fix:**
[From troubleshooting table fix column, with code snippet showing the exact change needed.]

**Prevention:** [How to avoid this in the future]

**Reference:** [Link to the reference file section]

### If No Match Found

If no troubleshooting entry, anti-pattern, or Critical Rule matches the symptom:

1. Say so honestly: "This symptom is not covered in the skill's troubleshooting tables."
2. Route to official docs via WebFetch:
   - `https://vuejs.org/api/` for core API
   - `https://router.vuejs.org/api/` for router
   - `https://pinia.vuejs.org/api/` for Pinia
3. Suggest the user share more context (full error stack trace, config files, reproduction steps).

## Step 8: Offer to Apply Fix

Ask the user: "Would you like me to apply this fix to your project?"

Do NOT auto-apply the fix. Wait for explicit user confirmation before making any changes.

## Important Constraints

- ALWAYS read from reference files for diagnosis. Never diagnose from memory alone.
- Route to MULTIPLE reference files if the symptom spans domains.
- Check Critical Rules for EVERY diagnosis -- many Vue 3 errors trace back to these violations.
- Present the fix before applying it. The user decides whether to proceed.
