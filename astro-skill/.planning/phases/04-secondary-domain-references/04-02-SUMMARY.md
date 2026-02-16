---
phase: 04-secondary-domain-references
plan: 02
subsystem: knowledge-base
tags: [typescript, testing, vitest, container-api, cloudflare-bindings, playwright]
completed: 2026-02-03
duration: 2min
dependency-graph:
  requires: [02-01, 02-03]
  provides: [typescript-testing-reference]
  affects: [05-01]
tech-stack:
  added: []
  patterns: [getViteConfig, experimental_AstroContainer, defineWorkersConfig, vitest-pool-workers]
key-files:
  created:
    - .claude/skills/astro-cloudflare/references/typescript-testing.md
  modified: []
decisions:
  - id: "04-02-01"
    decision: "Separate vitest.config.workers.ts for Cloudflare binding tests"
    reason: "Standard Vitest config uses getViteConfig for Astro transforms; binding tests need defineWorkersConfig from @cloudflare/vitest-pool-workers -- incompatible in single config"
  - id: "04-02-02"
    decision: "14 Quick Reference rules covering both TypeScript and testing domains"
    reason: "Combined file covers two research sources (11+12); 14 rules captures the most critical guidance from both without exceeding the format"
  - id: "04-02-03"
    decision: "Package Scripts section added beyond plan minimum"
    reason: "Complete test script reference (test:unit, test:bindings, test:e2e) provides copy-pasteable workflow; complements build-deploy.md without duplicating CI/CD content"
---

# Phase 4 Plan 2: TypeScript and Testing Summary

TypeScript config with Astro presets, full env.d.ts pattern for Cloudflare binding type safety, Vitest setup using getViteConfig() with experimental_AstroContainer, Cloudflare bindings testing via @cloudflare/vitest-pool-workers, and Playwright E2E with wrangler pages dev.

## Tasks Completed

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Write typescript-testing.md reference file | 3dd4df3 | Done |
| 2 | Verify quality and cross-references | (verification only) | Done |

## What Was Built

`typescript-testing.md` (278 lines) containing:

- **Quick Reference:** 14 imperative rules covering TypeScript config, env.d.ts, Vitest setup, Container API, and Cloudflare bindings testing
- **TypeScript Config Decision Matrix:** 6 scenarios mapping project type to Astro preset with key settings
- **env.d.ts Full Pattern:** Complete type-safe environment with App.Locals, Runtime<Env>, Env interface, SessionData
- **Test Type Decision Matrix:** 10 testing scenarios with tool recommendations and rationale
- **Vitest Config:** getViteConfig() pattern with node environment and v8 coverage
- **Container API Tests:** Props, slots, named slots, framework renderer registration with loadRenderers()
- **Cloudflare Bindings Tests:** defineWorkersConfig with KV and D1 examples using cloudflare:test
- **Playwright Config:** E2E setup with wrangler pages dev webServer for Workers runtime
- **Package Scripts:** Complete test workflow (unit, bindings, e2e)
- **Anti-patterns:** 10 entries with CRITICAL/HIGH/MEDIUM severity tags
- **Troubleshooting:** 11 entries covering both Astro-generic and Cloudflare-specific errors

## Decisions Made

1. **Separate vitest configs for unit vs binding tests** -- getViteConfig and defineWorkersConfig are incompatible in a single config file; separate configs with dedicated npm scripts
2. **14 Quick Reference rules** -- combined TypeScript (8) and testing (6) rules into single ordered list
3. **Package Scripts section added** -- provides copy-pasteable workflow beyond plan minimum; boundary respected (no CI/CD which belongs in build-deploy.md)

## Deviations from Plan

None -- plan executed exactly as written.

## Quality Checks

- [x] 278 lines (within 250-360 range)
- [x] No Astro 4 deprecated patterns (output: 'hybrid', entry.slug, entry.render(), ViewTransitions, type: 'content')
- [x] No cross-domain content leakage (no wrangler.jsonc template, no ESLint/Prettier, no Content Layer)
- [x] All code examples use Astro 5.x API correctly
- [x] 3+ Cloudflare-specific troubleshooting entries (runtime undefined, env.DB undefined, locals.runtime type error)
- [x] Code comments follow `// src/path/file.ts -- description` convention
- [x] getViteConfig() used (not defineConfig)
- [x] experimental_AstroContainer used (not AstroContainer)
- [x] @cloudflare/vitest-pool-workers referenced and demonstrated

## Cross-References

- **project-structure.md** (Phase 2): Referenced for tsconfig.json template and env.d.ts basics
- **cloudflare-platform.md** (Phase 2): Referenced for Cloudflare binding types (wrangler.jsonc, Env interface)
- **build-deploy.md** (Phase 4): Will contain CI/CD scripts, ESLint config (no duplication)

## Next Phase Readiness

No blockers. typescript-testing.md is complete and ready for Phase 5 SKILL.md synthesis.
