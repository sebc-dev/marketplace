---
phase: 03-core-domain-references
plan: 03
subsystem: data
tags: [astro, content-layer, loaders, collections, actions, mdx, markdoc, cloudflare, zod]

# Dependency graph
requires:
  - phase: 02-foundation-references
    provides: project-structure.md and rendering-modes.md format/style reference
provides:
  - "data-content.md reference file covering Content Layer API, loaders, collections, Actions, MDX/Markdoc"
affects: [05-skill-synthesis, security-advanced cross-reference for Actions CSRF]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Quick Reference numbered imperative rules (continued from Phase 2)"
    - "Decision matrix tables: Scenario | Choice | Why"
    - "Anti-patterns with CRITICAL/HIGH/MEDIUM severity tags"
    - "Troubleshooting: Symptom | Cause | Fix (Astro + Cloudflare)"
    - "CSV file loader with custom parser pattern"
    - "SSR data fetching with AbortController + cf cache options"

key-files:
  created: []
  modified:
    - ".claude/skills/astro-cloudflare/references/data-content.md"

key-decisions:
  - "Actions kept to basic signature and decision matrix only -- CSRF/validation deferred to Phase 4 security-advanced.md"
  - "SSR data fetching pattern included with AbortController timeout and Cloudflare cf cache options"
  - "CSV file loader example included as separate section to demonstrate custom parser option"
  - "Querying Collections section added showing getCollection filter and getEntry reference resolution"

metrics:
  duration: "3min"
  completed: "2026-02-03"
---

# Phase 3 Plan 3: Data and Content Summary

Content Layer API with glob/file/inline loaders, Zod schemas, Actions vs API routes decision matrix, MDX/Markdoc setup on Cloudflare Workers.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write data-content.md reference file | 69f35cd | data-content.md |
| 2 | Verify quality and cross-references | (verification only) | data-content.md |

## Decisions Made

1. **Actions scope boundary**: Basic `defineAction` signature and Actions vs API routes decision matrix included. CSRF protection and advanced validation patterns explicitly deferred to Phase 4 `security-advanced.md` with a cross-reference note in the file.

2. **SSR data fetching pattern**: Added an API route example with `AbortController` timeout and Cloudflare `cf: { cacheTtl, cacheEverything }` options, demonstrating the correct Workers-compatible pattern for external API calls.

3. **CSV loader as separate section**: Elevated CSV file loader with custom parser to its own section (rather than a note in the loader matrix) because the `parser` option pattern is non-obvious and frequently needed.

4. **Collection querying section**: Added a Querying Collections section showing `getCollection` with filter function, `getEntry` by id, and reference resolution -- patterns Claude needs to produce correct page code.

## Key Artifacts

**`.claude/skills/astro-cloudflare/references/data-content.md`** (290 lines)

Sections:
- Quick Reference (12 numbered imperative rules)
- Loader Selection Matrix (8 data sources)
- Actions vs API Routes (8 use cases)
- Content Layer Config (glob + file loaders with schema)
- CSV File Loader (custom parser pattern)
- Inline Async Loader (external API pattern)
- Astro Actions Basic Signature (defineAction with Cloudflare bindings)
- MDX / Markdoc Decision (3 formats with notes)
- Rendering Content (blog post page with component mapping)
- Querying Collections (filter, getEntry, reference resolution)
- SSR Data Fetching on Cloudflare (AbortController + cf cache)
- Anti-patterns (12 entries: 4 CRITICAL, 4 HIGH, 4 MEDIUM)
- Troubleshooting (10 entries including 2 Cloudflare-specific)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- File exists at correct path: PASS
- Line count 290 (within 250-320 range): PASS
- Starts with `# Data and Content`: PASS
- Quick Reference with 12 numbered rules: PASS
- Loader selection matrix table: PASS
- Actions vs API routes decision matrix: PASS
- content.config.ts code example with glob() and file(): PASS
- Actions defineAction code example: PASS
- Anti-patterns with CRITICAL/HIGH/MEDIUM tags: PASS
- Troubleshooting with Symptom/Cause/Fix columns: PASS
- Uses `entry.id` not `entry.slug` in code: PASS
- Uses `render(entry)` import pattern not `entry.render()`: PASS
- Uses `loader: glob()` not `type: 'content'`: PASS
- Uses `z from 'astro/zod'` not `z from 'zod'`: PASS
- No CSRF/validation details for Actions: PASS
- No cross-domain content leakage: PASS
- No deprecated Astro 4 patterns in code examples: PASS

## Next Phase Readiness

No blockers. Plan 03-04 (styling-performance.md) can proceed. All cross-references from data-content.md are forward-looking to Phase 4 security-advanced.md.
