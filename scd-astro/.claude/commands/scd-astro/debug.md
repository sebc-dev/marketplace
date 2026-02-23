---
description: Diagnose common Astro 5.x / Cloudflare Workers errors using skill troubleshooting tables
disable-model-invocation: true
argument-hint: "[error message or symptom description]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Debug Astro/Cloudflare Errors

Diagnose Astro 5.x and Cloudflare Workers errors by routing symptoms to the correct skill reference file and presenting structured fixes.

## Step 1: Accept Symptom

Use `$ARGUMENTS` as the error or symptom description. If `$ARGUMENTS` is empty, ask the user to describe the error or paste the full error message.

## Step 2: Route Symptom to Reference Files

Match the user's symptom against this routing table to identify which reference file(s) contain the relevant troubleshooting information:

| Symptom Pattern | Reference File(s) |
|---|---|
| `Cannot find module` / import errors / module resolution | `typescript-testing.md` |
| Build fails on Cloudflare / deploy errors | `build-deploy.md` |
| `process.env` undefined / env var not found | `cloudflare-platform.md` |
| Image processing errors / Sharp / `Could not load image` | `styling-performance.md` |
| Hydration mismatch / client hydration errors | `components-islands.md` |
| Content collection errors / `getCollection` / loader errors | `data-content.md` |
| 404 on dynamic routes / `getStaticPaths` issues | `routing-navigation.md` |
| CSP / security header issues / blocked by policy | `security-advanced.md` |
| Sitemap missing / SEO tags not rendering / OpenGraph | `seo-i18n.md` |
| Server Island not rendering / `server:defer` issues | `components-islands.md` + `rendering-modes.md` |
| Binding not available in dev / KV/D1/R2 undefined | `cloudflare-platform.md` |
| ViewTransitions errors / navigation glitches | `routing-navigation.md` |
| `CPU time exceeded` / Worker CPU limit | `cloudflare-platform.md` |
| `KV namespace not bound` / binding errors in production | `cloudflare-platform.md` |
| `compatibility_date` / compat flag errors | `cloudflare-platform.md` |
| `node_compat` / Node.js API not available on Workers | `cloudflare-platform.md` |
| Wrangler deploy fails / `wrangler pages deploy` errors | `build-deploy.md` |

If the symptom matches multiple patterns, route to ALL matched reference files.

If the symptom does not clearly match any pattern, check the three most likely files based on the error context (config errors -> `project-structure.md` or `build-deploy.md`, runtime errors -> `cloudflare-platform.md`, component errors -> `components-islands.md`).

## Step 3: Read Troubleshooting Section from Matched Reference File(s)

For each matched reference file:

1. Find the Troubleshooting section:
   ```
   grep -n "## Troubleshooting" .claude/skills/astro-cloudflare/references/{matched-file}
   ```
2. Read the Troubleshooting table (columns: Symptom | Cause | Fix)
3. Find the row that most closely matches the user's symptom

## Step 4: Check Anti-patterns (Fallback)

If no direct match was found in the Troubleshooting table, check the Anti-patterns section:

1. Find the Anti-patterns section:
   ```
   grep -n "## Anti-patterns" .claude/skills/astro-cloudflare/references/{matched-file}
   ```
2. Read the Anti-patterns table (columns: Don't | Do | Severity)
3. Check if the user's error aligns with a known anti-pattern

## Step 5: Check Critical Rules

Read the Critical Rules section from SKILL.md to check if the symptom matches any of the 10 breaking change violations:

```
grep -n "## Critical Rules" .claude/skills/astro-cloudflare/SKILL.md
```

The 10 Critical Rules cover the most common Astro 5.x breaking changes:
1. `content.config.ts` path (`src/` not `src/content/`)
2. `entry.id` not `entry.slug`
3. `render(entry)` not `entry.render()`
4. `loader: glob()` not `type: 'content'`
5. `<ClientRouter />` not `<ViewTransitions />`
6. `Astro.locals.runtime.env.VAR` not `process.env.VAR`
7. `imageService: 'compile'` not Sharp
8. `output: 'static'` or `'server'` not `'hybrid'`
9. `decodeURIComponent(Astro.params.slug)` for decoded params
10. `import { z } from 'astro/zod'` not from `'zod'`

Many errors trace back to one of these violations.

## Step 6: Read Relevant Project Files

To confirm the diagnosis, read the user's project files that relate to the error:

- **Config errors:** Read `astro.config.mjs` (or `.ts`), `wrangler.jsonc` (or `.toml`), `tsconfig.json`
- **Import errors:** Read the file that fails to import
- **Content errors:** Read `src/content.config.ts` (check path -- NOT `src/content/config.ts`)
- **Binding errors:** Read `wrangler.jsonc` and `src/env.d.ts`
- **Build errors:** Read `package.json` (scripts and dependencies)
- **Routing errors:** Read the failing route file and check `src/pages/` structure

Use Glob to locate files if paths are uncertain:
```
glob src/**/content.config.ts
glob astro.config.*
glob wrangler.*
```

## Step 7: Present Diagnosis

Present the diagnosis in this structured format:

### Diagnosis

**Symptom:** [User's error description]

**Likely Cause:** [From Troubleshooting table, Anti-patterns, or Critical Rules]

**Fix:**
[From Troubleshooting table fix column, with code snippet if available. Show the exact change needed.]

**Reference:** [Link to the reference file section for full context, e.g., "See `.claude/skills/astro-cloudflare/references/cloudflare-platform.md` Troubleshooting section"]

**Diagnostic commands:** [If relevant, suggest debugging commands from build-deploy.md Debugging Workflow section]
- `wrangler tail` -- live log streaming for production errors
- `wrangler dev --inspect` -- debugger for local Workers issues
- `astro build 2>&1 | head -50` -- capture build error details

### If No Match Found

If no troubleshooting entry, anti-pattern, or Critical Rule matches the symptom:

1. Say so honestly: "This symptom is not covered in the skill's troubleshooting tables."
2. Route to the appropriate MCP based on error domain:
   - **Astro errors** (components, routing, rendering, config, content):
     ```
     mcp__astro_doc__search_astro_docs({ query: "<relevant search terms>" })
     ```
   - **Cloudflare errors** (Workers runtime, KV/D1/R2, wrangler, deploy):
     ```
     mcp__cloudflare__search_cloudflare_documentation({ query: "<product> <specific error>" })
     ```
3. Suggest the user share more context (full error stack trace, config files, reproduction steps).

## Step 8: Offer to Apply Fix

Ask the user: "Would you like me to apply this fix to your project?"

Do NOT auto-apply the fix. Wait for explicit user confirmation before making any changes.

If the user confirms, apply the fix and verify it resolves the issue (re-run the failing command or build).

## Important Constraints

- ALWAYS read from reference files for diagnosis. Never diagnose from memory alone.
- Route to MULTIPLE reference files if the symptom spans domains (e.g., Server Island issues touch both `components-islands.md` and `rendering-modes.md`).
- Check Critical Rules for EVERY diagnosis -- many Astro 5.x errors trace back to breaking change violations.
- Present the fix before applying it. The user decides whether to proceed.
