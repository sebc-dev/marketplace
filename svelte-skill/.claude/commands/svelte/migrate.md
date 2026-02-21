---
description: "Analyze a Svelte 4 project and generate a prioritized migration plan to Svelte 5 runes mode. Scans for legacy patterns and produces per-file migration checklists."
disable-model-invocation: true
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Migrate Svelte 4 to Svelte 5

Analyze a Svelte 4 project and generate a prioritized, bottom-up migration plan to Svelte 5 runes mode.

## Current Project State

### Package.json
!`cat package.json 2>/dev/null || echo "NO_PACKAGE_JSON"`

### Svelte Config
!`cat svelte.config.js 2>/dev/null || cat svelte.config.ts 2>/dev/null || echo "NO_SVELTE_CONFIG"`

### Component Count
!`find src -name "*.svelte" 2>/dev/null | wc -l`

### Source Files
!`find src -name "*.svelte" -o -name "*.svelte.ts" -o -name "*.svelte.js" 2>/dev/null | sort`

---

## Step 1: Read Migration Reference

Read the migration rules from the ecosystem-antipatterns reference:
```bash
grep -n '<migration_rules>' .claude/skills/svelte-sveltekit/references/ecosystem-antipatterns.md
```
Read that section for the Svelte 4 to 5 syntax mapping and bottom-up strategy.

Also read the critical anti-patterns:
```bash
grep -n '<critical_antipatterns>' .claude/skills/svelte-sveltekit/references/ecosystem-antipatterns.md
```

## Step 2: Scan for Legacy Patterns

Run ALL of these scans to build the migration inventory:

**Pattern 1 -- `export let` -> `$props()`:**
```bash
grep -rn 'export let ' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
```

**Pattern 2 -- `$:` reactive statements -> `$derived` / `$derived.by`:**
```bash
grep -rn '^\s*\$:' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
```

**Pattern 3 -- `createEventDispatcher` -> callback props:**
```bash
grep -rn 'createEventDispatcher' src/ --include="*.svelte" --include="*.ts" 2>/dev/null | grep -v node_modules
```

**Pattern 4 -- `<slot>` -> `{#snippet}` + `{@render}`:**
```bash
grep -rn '<slot' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
```

**Pattern 5 -- `on:click` etc -> `onclick`:**
```bash
grep -rn 'on:click\|on:change\|on:submit\|on:input\|on:keydown\|on:keyup\|on:focus\|on:blur\|on:mouseover\|on:mouseenter' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
```

**Pattern 6 -- `$$restProps` -> rest `$props()`:**
```bash
grep -rn '\$\$restProps' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
```

**Pattern 7 -- `$$slots` -> snippet checks:**
```bash
grep -rn '\$\$slots' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
```

**Pattern 8 -- `import { writable }` -> `$state` (when applicable):**
```bash
grep -rn "from 'svelte/store'" src/ --include="*.svelte" --include="*.ts" --include="*.svelte.ts" 2>/dev/null | grep -v node_modules
```

**Pattern 9 -- `class:` directive -> `class={[...]}` (5.16+):**
```bash
grep -rn 'class:' src/ --include="*.svelte" 2>/dev/null | grep -v 'class=' | grep -v node_modules
```

**Pattern 10 -- `svelte:component` -> direct dynamic component:**
```bash
grep -rn 'svelte:component' src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
```

## Step 3: Identify Component Dependencies

Build a dependency graph to determine migration order (leaf components first):

```bash
# Find which components import other components
grep -rn "import .* from '\./\|import .* from '\$lib/" src/ --include="*.svelte" 2>/dev/null | grep -v node_modules
```

**Bottom-up strategy:** Migrate leaf components (no child component imports) first, then work up to parent components and layouts.

## Step 4: Generate Migration Plan

For each file with legacy patterns, produce a migration entry.

### Migration Plan Format

```markdown
# Svelte 4 → 5 Migration Plan

## Summary
- **Total components:** [count]
- **Components needing migration:** [count]
- **Legacy pattern counts:**
  - export let: X occurrences in Y files
  - $: reactive: X occurrences in Y files
  - createEventDispatcher: X occurrences in Y files
  - <slot>: X occurrences in Y files
  - on:event: X occurrences in Y files
  - $$restProps: X occurrences in Y files
  - $$slots: X occurrences in Y files
  - svelte/store: X occurrences in Y files
  - class: directive: X occurrences in Y files
  - svelte:component: X occurrences in Y files

## Migration Order (bottom-up)

### Wave 1: Leaf Components (no child imports)
| File | Patterns | Priority |
|------|----------|----------|
| path/to/Component.svelte | export let, on:click | HIGH |

### Wave 2: Mid-level Components
| File | Patterns | Priority |
|------|----------|----------|

### Wave 3: Layouts & Pages
| File | Patterns | Priority |
|------|----------|----------|

## Per-File Migration Checklist

### [path/to/Component.svelte]
- [ ] `export let name` → `let { name } = $props()`
- [ ] `$: doubled = count * 2` → `let doubled = $derived(count * 2)`
- [ ] `on:click={handler}` → `onclick={handler}`
- [ ] `<slot>` → `{#snippet children()}{/snippet}` + `{@render children()}`

**Before:**
```svelte
[relevant snippet showing old patterns]
```

**After:**
```svelte
[equivalent Svelte 5 code]
```
```

## Step 5: Store Migration Assessment

For files using `svelte/store`, assess each case:

Read the stores interop reference:
```bash
grep -n '<stores_interop>' .claude/skills/svelte-sveltekit/references/state-management.md
```

Classify each store usage:
- **Replace with $state:** Simple component-local stores
- **Replace with Context API:** Stores used for subtree sharing
- **Keep as store:** localStorage persistence, cross-framework interop, external library requirements
- **Use fromStore/toStore bridge:** Gradual migration where stores must coexist with runes

## Step 6: Present Plan and Offer Assistance

Present the complete migration plan and ask:

1. "Would you like me to start migrating Wave 1 (leaf components)?"
2. "Would you like me to migrate a specific file?"

Do NOT auto-migrate without user confirmation. Always show before/after for each file before applying changes.

After migrating each .svelte file, run `mcp__svelte__svelte-autofixer` with `desired_svelte_version: 5` to validate.

## Important Notes

- Read migration patterns from reference files dynamically. Do NOT rely on hardcoded patterns.
- The bottom-up order is critical: migrating parent components before children can cause cascading breakage.
- Some stores should NOT be migrated (localStorage, cross-framework). Assess each case.
- `$: ` statements need case-by-case assessment: pure computations -> `$derived`, side effects -> `$effect`, event responses -> keep as handler.
- Always validate with svelte-autofixer after migration.
