---
description: Audit a Vue 3 project against skill best practices and anti-patterns
disable-model-invocation: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Audit Vue 3 Project

Perform a comprehensive audit of the current Vue 3 project against the vue-production skill best practices and anti-patterns.

## Current Project State

### Package.json
!`cat package.json 2>/dev/null || echo "NO_PACKAGE_JSON"`

### Vite Config
!`cat vite.config.ts 2>/dev/null || cat vite.config.js 2>/dev/null || echo "NO_VITE_CONFIG"`

### TypeScript Config
!`cat tsconfig.json 2>/dev/null || echo "NO_TSCONFIG"`

### Main Entry
!`cat src/main.ts 2>/dev/null || cat src/main.js 2>/dev/null || echo "NO_MAIN"`

### App Component
!`cat src/App.vue 2>/dev/null || echo "NO_APP_VUE"`

### Router
!`cat src/router/index.ts 2>/dev/null || cat src/router/index.js 2>/dev/null || echo "NO_ROUTER"`

### Source Structure
!`find src -type f \( -name "*.vue" -o -name "*.ts" -o -name "*.js" \) 2>/dev/null | head -50 || echo "NO_SRC"`

---

## Audit Instructions

Run the audit in four stages, from most critical to least. For each check, inspect the pre-loaded project state above and use Grep/Glob to scan source files as needed.

### Stage 1: Critical Rules Check (CRITICAL severity)

Read the 10 Critical Rules from `.claude/skills/vue-production/SKILL.md` then check each:

**Rule 1 -- reactive() misuse:**
```bash
grep -rn 'reactive(' src/ --include="*.vue" --include="*.ts" 2>/dev/null | grep -v node_modules | grep -v 'import'
```
Flag any `reactive()` used for primitives, or where reassignment/destructuring is expected. `ref()` should be the default.

**Rule 2 -- Manual prop + emit instead of defineModel:**
```bash
grep -rn "modelValue\|'update:modelValue'" src/ --include="*.vue" 2>/dev/null | grep -v node_modules
```
Flag manual v-model prop+emit patterns. Should use `defineModel()` (Vue 3.4+).

**Rule 3 -- Composable boundary issues:**
```bash
grep -rn 'export function use' src/ --include="*.ts" --include="*.vue" 2>/dev/null | grep -v node_modules
```
For each composable, check if it accepts MaybeRefOrGetter and uses toValue() at boundaries.

**Rule 4 -- Lifecycle hooks after await:**
```bash
grep -rn 'onMounted\|onUnmounted\|onBeforeMount\|onBeforeUnmount\|onActivated' src/ --include="*.vue" 2>/dev/null | grep -v node_modules
```
Cross-reference with async setup patterns. Hooks after `await` in `setup()` are silently ignored.

**Rule 5 -- Missing storeToRefs:**
```bash
grep -rn 'const {.*} = use.*Store()' src/ --include="*.vue" --include="*.ts" 2>/dev/null | grep -v storeToRefs | grep -v node_modules
```
Flag any direct destructuring of Pinia stores without `storeToRefs()`.

**Rule 6 -- useRoute() destructuring:**
```bash
grep -rn 'const {.*} = useRoute()' src/ --include="*.vue" --include="*.ts" 2>/dev/null | grep -v node_modules
```
Flag destructuring. Must use `computed(() => route.params.id)` for reactive access.

**Rule 7 -- next() callback in guards:**
```bash
grep -rn 'next(' src/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules
```
Flag any `next()` in navigation guards. Must use return-based guards.

**Rule 8 -- Missing shallowRef for large data:**
```bash
grep -rn 'ref<.*\[\]>' src/ --include="*.vue" --include="*.ts" 2>/dev/null | grep -v node_modules
```
Check if large array refs should be `shallowRef`.

**Rule 9 -- v-html without sanitization:**
```bash
grep -rn 'v-html' src/ --include="*.vue" 2>/dev/null | grep -v node_modules
```
Flag any `v-html` not preceded by DOMPurify sanitization.

**Rule 10 -- VITE_ prefix on secrets:**
```bash
grep -rn 'VITE_' .env* 2>/dev/null
```
Check for server secrets exposed with VITE_ prefix (API keys, database URLs, etc.).

### Stage 2: Anti-pattern Scan (HIGH severity)

Read the `<anti_patterns>` sections from the reference files dynamically:

```bash
grep -n '<anti_patterns>' .claude/skills/vue-production/references/reactivity-refs.md
grep -n '<anti_patterns>' .claude/skills/vue-production/references/composition-api.md
grep -n '<anti_patterns>' .claude/skills/vue-production/references/components-templates.md
```

Read each anti_patterns section and scan the project. Key checks:

- **Options API remnants:**
  ```bash
  grep -rn 'export default {' src/ --include="*.vue" 2>/dev/null | grep -v node_modules
  ```
  Flag any Options API components. New code should use `<script setup>`.

- **Event bus pattern:**
  ```bash
  grep -rn 'EventBus\|eventBus\|mitt\|tiny-emitter\|\$emit.*bus\|\$on\|\$off' src/ --include="*.vue" --include="*.ts" 2>/dev/null | grep -v node_modules
  ```

- **Direct DOM manipulation:**
  ```bash
  grep -rn 'document\.querySelector\|document\.getElementById\|\.innerHTML' src/ --include="*.vue" --include="*.ts" 2>/dev/null | grep -v node_modules
  ```

- **God components (>300 lines):**
  ```bash
  find src -name "*.vue" -exec wc -l {} + 2>/dev/null | sort -rn | head -10
  ```
  Flag components over 300 lines.

### Stage 3: Architecture Review (MEDIUM severity)

Read relevant reference file sections for architecture patterns:

```bash
grep -n '<store_architecture>' .claude/skills/vue-production/references/state-pinia.md
grep -n '<composable_architecture>' .claude/skills/vue-production/references/composition-api.md
grep -n '<route_architecture>' .claude/skills/vue-production/references/router-navigation.md
```

Analyze project-wide patterns:

- **State management coherence:** Is Pinia used consistently? Mixed reactive/store patterns?
- **Composable structure:** Are composables extracted for reusable logic?
- **Route organization:** Lazy loading on all routes? Flat vs deeply nested?
- **Prop drilling:** Any props passed through >3 levels?

### Stage 4: Ecosystem Check (LOW severity)

Check package.json for:
- **Deprecated libraries:** Vuex (use Pinia), vue-class-component, vue-property-decorator
- **Vue version:** Verify Vue 3.4+ for defineModel, 3.5+ for useTemplateRef
- **Missing vue-tsc:** Should be in devDependencies for type checking
- **Missing @vue/test-utils:** If testing is set up

---

## Report Format

Output the audit report in this structure:

```markdown
# Vue 3 Audit Report

## Summary
- **Project:** [name from package.json]
- **Vue version:** [from package.json]
- **Build tool:** [Vite version]
- **Issues found:** X CRITICAL, Y HIGH, Z MEDIUM, W LOW

## CRITICAL Issues
[If any -- these cause runtime errors, lost reactivity, or security vulnerabilities]

### [Issue title]
- **Rule:** [rule number if applicable]
- **File:** path/to/file:line
- **Problem:** [what's wrong]
- **Fix:** [the correct Vue 3 pattern]
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
3. **If no issues found** -- Confirm the project follows Vue 3 best practices.

## Important Notes

- Read anti-patterns from reference files dynamically. Do NOT rely on hardcoded content -- reference files are the source of truth.
- Check ALL pre-loaded files even if some are missing. Report "NOT FOUND" as a finding if essential files are missing.
- Do not suggest fixes that contradict the skill reference files.
