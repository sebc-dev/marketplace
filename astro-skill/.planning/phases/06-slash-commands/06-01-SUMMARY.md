---
phase: 06-slash-commands
plan: 01
subsystem: commands
tags: [slash-commands, scaffold, debug, troubleshooting, project-creation]
completed: 2026-02-03
duration: 2min
dependency-graph:
  requires: [05-01, 05-02]
  provides: [scaffold-command, debug-command]
  affects: [06-02]
tech-stack:
  added: []
  patterns: [command-driven-workflow, symptom-routing, reference-file-delegation]
key-files:
  created:
    - .claude/commands/astro/scaffold.md
    - .claude/commands/astro/debug.md
  modified: []
decisions:
  - id: "06-01-A"
    decision: "Scaffold asks all config questions at once (not sequentially) to minimize round-trips"
  - id: "06-01-B"
    decision: "Debug command inlines the 12-row routing table (small enough, critical for fast routing)"
  - id: "06-01-C"
    decision: "Both commands use allowed-tools to restrict tool access to what each workflow needs"
metrics:
  tasks: 2
  commits: 2
  deviations: 0
---

# Phase 06 Plan 01: Scaffold and Debug Commands Summary

**Slash commands for guided project creation and structured error diagnosis using skill reference files.**

## What Was Built

### Scaffold Command (`.claude/commands/astro/scaffold.md`)

A guided project creation workflow invoked via `/project:astro:scaffold [name]` that:

- Accepts project name from `$ARGUMENTS` or prompts for one
- Asks all configuration questions at once: rendering mode (SSG/SSR), Cloudflare bindings (KV/D1/R2), Tailwind CSS, package manager
- Reads ALL config templates from skill reference files via grep navigation (never inlines from memory):
  - `project-structure.md` for directory layout, astro.config variants, tsconfig, env.d.ts, content.config.ts
  - `cloudflare-platform.md` for wrangler.jsonc and .dev.vars templates
  - `rendering-modes.md` for output mode confirmation
  - `build-deploy.md` for package scripts and VS Code config
  - `styling-performance.md` for Tailwind v4 setup (conditional)
- Generates complete project files adapted to user choices
- Runs package install and wrangler types post-creation
- Embeds all 10 Critical Rules as compliance checklist
- `disable-model-invocation: true` prevents auto-invocation

### Debug Command (`.claude/commands/astro/debug.md`)

A structured error diagnosis workflow invoked via `/project:astro:debug [error]` that:

- Accepts error/symptom from `$ARGUMENTS` or prompts for description
- Routes symptoms via 12-row inline table to correct reference file(s):
  - Covers: import errors, build failures, env vars, images, hydration, content collections, routing, security, SEO, Server Islands, bindings, ViewTransitions
- Reads Troubleshooting tables from matched reference files via grep
- Falls back to Anti-patterns sections if no direct troubleshooting match
- Checks all 10 Critical Rules (many errors trace to breaking change violations)
- Reads relevant project files (astro.config, wrangler, tsconfig) to confirm diagnosis
- Presents structured diagnosis: Symptom, Cause, Fix, Reference, Diagnostic commands
- Offers to apply fix with explicit user confirmation (no auto-apply)
- Suggests `mcp__astro_doc__search_astro_docs` if no match found
- `disable-model-invocation: true` prevents auto-invocation

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `1aef2d9` | Scaffold command with guided workflow reading from reference files |
| 2 | `7573519` | Debug command with symptom routing and structured diagnosis |

## Decisions Made

1. **[06-01-A] All questions at once:** Scaffold presents rendering mode, bindings, Tailwind, and package manager questions simultaneously rather than sequentially, minimizing round-trips for the user.

2. **[06-01-B] Inline routing table:** The 12-row symptom routing table is small enough to inline in the debug command (vs. reading from SKILL.md each time), and it is critical for fast symptom-to-file routing.

3. **[06-01-C] Scoped allowed-tools:** Scaffold allows Read/Write/Bash/Glob/Grep (needs to create files and run installs). Debug allows Read/Grep/Glob/Bash (needs to read and search, plus run diagnostic commands).

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| Both files exist | PASS |
| `disable-model-invocation: true` in both | PASS (1 each) |
| `$ARGUMENTS` in both | PASS (1+ each) |
| Reference paths in scaffold | PASS (13 refs) |
| Troubleshooting in debug | PASS (8 mentions) |

## Next Phase Readiness

Plan 06-02 (review command) can proceed. The commands directory `.claude/commands/astro/` is established. The pattern of reading from reference files and using `disable-model-invocation: true` is set.
