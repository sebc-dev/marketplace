---
phase: 10-reference-file-integration
plan: 01
subsystem: skill-mcp-integration
tags: [cloudflare-mcp, reference-callouts, debug-routing, dual-mcp]
requires:
  - phase-08 (MCP tool verification)
  - phase-09 (SKILL.md dual-MCP routing)
provides:
  - 10 MCP callouts across 4 reference files at Cloudflare API boundaries
  - dual-MCP fallback in debug slash command
  - 5 Cloudflare symptom entries in debug routing table
affects:
  - phase-11 (SKILL.md line budget validation)
tech-stack:
  added: []
  patterns:
    - blockquote MCP callout format consistent with Phase 9
    - dual-MCP routing pattern (domain-based error routing)
key-files:
  created: []
  modified:
    - .claude/skills/astro-cloudflare/references/cloudflare-platform.md
    - .claude/skills/astro-cloudflare/references/build-deploy.md
    - .claude/skills/astro-cloudflare/references/security-advanced.md
    - .claude/skills/astro-cloudflare/references/typescript-testing.md
    - .claude/commands/astro/debug.md
key-decisions:
  - Callouts placed after section content, before next ## heading (not in Quick Reference)
  - Hybrid query templates maintained (product name + specific action, 5+ words)
  - Debug fallback routes by error domain (Astro vs Cloudflare) instead of single-MCP
duration: 3min
completed: 2026-02-04
---

# Phase 10 Plan 01: Reference File MCP Callouts Summary

**10 Cloudflare MCP callouts across 4 reference files + dual-MCP debug routing with 5 Cloudflare symptom entries**

## Performance

- Duration: ~3 minutes
- Tasks: 2/2 complete
- Lines added: ~35 across 5 files

## Accomplishments

1. Added 4 MCP callouts to `cloudflare-platform.md` at Cloudflare API boundaries (Bindings Access, Workers Limits, Node.js Compatibility, Config Templates)
2. Added 3 MCP callouts to `build-deploy.md` (GitHub Actions CI/CD, CLI Flags Reference, Debugging Workflow)
3. Added 1 MCP callout to `security-advanced.md` (Secrets Management)
4. Added 2 MCP callouts to `typescript-testing.md` (env.d.ts Full Pattern, Cloudflare Bindings Test)
5. Added 5 Cloudflare symptom entries to debug routing table (CPU time exceeded, KV namespace not bound, compatibility_date, node_compat, wrangler deploy)
6. Replaced single-MCP fallback with dual-MCP routing in debug command (Astro errors -> Astro MCP, Cloudflare errors -> Cloudflare MCP)

## Task Commits

| Task | Name | Commit | Key Change |
|------|------|--------|------------|
| 1 | Add MCP callouts to 4 reference files | `01f4e9b` | 10 callouts using consistent blockquote format |
| 2 | Expand debug command with Cloudflare routing | `953c3c9` | 5 symptoms + dual-MCP fallback |

## Files Modified

| File | Change |
|------|--------|
| `cloudflare-platform.md` | +4 MCP callouts (8 lines) |
| `build-deploy.md` | +3 MCP callouts (6 lines) |
| `security-advanced.md` | +1 MCP callout (2 lines) |
| `typescript-testing.md` | +2 MCP callouts (4 lines) |
| `debug.md` | +5 symptom rows, replaced fallback section (+14/-4 lines) |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Callouts after section content, not in Quick Reference | Quick Reference is for fast scanning; callouts are supplementary |
| Config Templates callout placed after .dev.vars (end of section) | Covers entire Config Templates section including wrangler.jsonc and .dev.vars |
| Dual-MCP routing by error domain | More precise than single fallback; Cloudflare errors get Cloudflare docs |

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- SKILL.md remains at 266 lines with 14-line margin (untouched by this phase as planned)
- All 10 reference file callouts use consistent format compatible with Phase 11 validation
- Debug command routing table now has 17 symptom entries (12 original + 5 Cloudflare)
- Ready for Phase 11 (final validation and line budget audit)
