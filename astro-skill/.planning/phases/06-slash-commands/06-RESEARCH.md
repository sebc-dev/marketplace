# Phase 6: Slash Commands - Research

**Researched:** 2026-02-03
**Domain:** Claude Code Skills / Custom Slash Commands for Astro/Cloudflare
**Confidence:** HIGH

## Summary

Phase 6 adds three slash commands to the astro-cloudflare skill: a scaffolding command (CMD-01), an audit command (CMD-02), and a debug/troubleshoot command (CMD-03). These commands exist as skill files within the existing `.claude/skills/astro-cloudflare/` directory, leveraging the reference content built in Phases 2-5.

The research confirms that Claude Code skills and custom slash commands are now unified. A file at `.claude/skills/<name>/SKILL.md` creates a `/name` command, and `.claude/commands/<name>.md` also creates a command. For this project, since the astro-cloudflare skill already exists, the commands should live as separate skill directories within `.claude/skills/` (or as simple `.md` files in `.claude/commands/`). The key architectural decision is where to place them and how they reference the existing skill reference files.

All three commands are explicit user-triggered actions that should NOT be auto-invoked by Claude. They use `disable-model-invocation: true` to ensure only the user triggers them via `/command-name`. All content needed for the commands already exists in the 11 reference files and the SKILL.md body -- the commands primarily orchestrate reading and applying that content.

**Primary recommendation:** Create three command files as `.claude/commands/astro/scaffold.md`, `.claude/commands/astro/audit.md`, and `.claude/commands/astro/debug.md`. These become `/project:astro:scaffold`, `/project:astro:audit`, and `/project:astro:debug`. Use `disable-model-invocation: true` for all three. Each command references the existing skill reference files for its knowledge base.

## Standard Stack

### Core

| Library/Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Claude Code Skills | Current | Slash command definition format | Native Claude Code mechanism, official Anthropic documentation |
| YAML frontmatter | N/A | Command metadata (name, description, allowed-tools) | Required by Claude Code skill format |
| Markdown | N/A | Command instruction body | Required format for skill content |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `$ARGUMENTS` substitution | N/A | Pass user input to commands | Scaffold: project name/type; Debug: error description |
| `!`command`` syntax | N/A | Dynamic context injection (pre-execution) | Audit: inject `cat astro.config.mjs`, `cat package.json` etc. |
| `allowed-tools` | N/A | Tool restriction per command | Scaffold needs Write+Bash; Audit needs Read+Grep; Debug needs Read+Grep+Bash |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `.claude/commands/astro/*.md` | `.claude/skills/astro-scaffold/SKILL.md` etc. | Separate skill dirs add structure but fragment the astro-cloudflare skill ecosystem. Commands in `commands/` are simpler, colocated under one namespace |
| Three separate commands | One command with subcommands via $ARGUMENTS | Three separate commands are clearer UX (`/project:astro:scaffold` vs `/project:astro scaffold`) |
| `disable-model-invocation: true` | Default (auto-invocable) | These are explicit actions (create files, read project config, diagnose errors) -- auto-invocation would be disruptive |

## Architecture Patterns

### Recommended Command Structure

```
.claude/
├── commands/
│   └── astro/
│       ├── scaffold.md      # /project:astro:scaffold
│       ├── audit.md          # /project:astro:audit
│       └── debug.md          # /project:astro:debug
└── skills/
    └── astro-cloudflare/
        ├── SKILL.md           # Main skill (auto-invoked, exists)
        └── references/        # 11 reference files (exist)
```

The commands live in `.claude/commands/astro/` and reference the skill's reference files via relative paths. This keeps the main skill clean (auto-invoked knowledge) while commands provide explicit user-triggered workflows.

### Pattern 1: Scaffolding Command (CMD-01)

**What:** Creates a new Astro/Cloudflare project with recommended structure and configs from `project-structure.md` and `cloudflare-platform.md`.

**Structure:**
```yaml
---
description: Create a new Astro 5.x project on Cloudflare with recommended structure
disable-model-invocation: true
argument-hint: [project-name]
allowed-tools: Read, Write, Bash, Glob
---
```

**Workflow:**
1. Accept project name via `$ARGUMENTS` (or prompt if not provided)
2. Ask user rendering mode preference (SSG / SSG+SSR / Full SSR) -- maps to decision matrix in `rendering-modes.md`
3. Ask which Cloudflare bindings (KV, D1, R2, none)
4. Ask if Tailwind CSS desired
5. Read config templates from `references/project-structure.md` (astro.config.mjs, tsconfig.json, env.d.ts, content.config.ts, package.json)
6. Read Cloudflare config from `references/cloudflare-platform.md` (wrangler.jsonc, .dev.vars)
7. Generate file tree per `project-structure.md` "File Organization" section
8. Run `npm install` (or `pnpm install`)
9. Run `wrangler types` to generate binding types
10. Output summary of created files

**Key content sources:**
- `references/project-structure.md` -- File Organization (simple/complex), Config Templates (all), package.json scripts, .gitignore
- `references/cloudflare-platform.md` -- wrangler.jsonc template, .dev.vars template, compatibility flags
- `references/rendering-modes.md` -- Output Mode Decision Matrix (determines astro.config.mjs template)
- `references/styling-performance.md` -- Tailwind v4 Setup (if selected)
- `references/build-deploy.md` -- .assetsignore, VS Code config

### Pattern 2: Audit Command (CMD-02)

**What:** Reads an existing Astro/Cloudflare project and checks configuration against best practices from all reference files.

**Structure:**
```yaml
---
description: Audit an Astro/Cloudflare project against skill best practices
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash
---
```

**Workflow:**
1. Detect project files: `astro.config.mjs`/`.ts`, `wrangler.jsonc`/`.toml`, `package.json`, `tsconfig.json`
2. Use dynamic context injection (`!`command``) to read key files before Claude sees the prompt
3. Check Critical Rules from SKILL.md (10 breaking change rules)
4. Check anti-patterns from each reference file's "Anti-patterns" section
5. Check configuration correctness:
   - `output` mode validity (no `hybrid`)
   - `imageService` (not Sharp)
   - `platformProxy` enabled
   - `nodejs_compat` in compatibility_flags
   - Content config at `src/content.config.ts` (not `src/content/config.ts`)
   - `ViewTransitions` vs `ClientRouter`
   - `process.env` usage vs `locals.runtime.env`
   - `.dev.vars` vs `.env` conflict
   - Package.json scripts (wrangler types in dev/build)
6. Generate audit report with severity levels (CRITICAL / HIGH / MEDIUM)
7. Suggest fixes with references to specific sections

**Key content sources:**
- `SKILL.md` -- Critical Rules (10 items), Quick Troubleshooting Index
- All 11 reference files -- Anti-patterns tables (Don't / Do / Severity)
- `references/project-structure.md` -- File Organization, Anti-patterns
- `references/build-deploy.md` -- Package.json Scripts, Anti-patterns
- `references/typescript-testing.md` -- TypeScript Config, Anti-patterns
- `references/cloudflare-platform.md` -- Environment Variables, Anti-patterns

**Audit checklist structure (derived from anti-patterns across all references):**

| Category | Checks | Source |
|----------|--------|--------|
| Astro 5 Breaking Changes | 10 critical rules | SKILL.md Critical Rules |
| Cloudflare Compatibility | Sharp, process.env, nodejs_compat, bindings | cloudflare-platform.md |
| Rendering Config | output mode, prerender, Server Islands setup | rendering-modes.md |
| Content Layer | config path, loader syntax, entry.id vs slug | data-content.md |
| Routing | ClientRouter, catch-all guards, decodeURI | routing-navigation.md |
| Build Pipeline | package.json scripts, CI config, .assetsignore | build-deploy.md |
| TypeScript | tsconfig extends, moduleResolution, env.d.ts | typescript-testing.md |
| Security | secrets handling, CSP, CSRF | security-advanced.md |
| Performance | image service, caching headers, prefetch | styling-performance.md |
| SEO | site defined, canonical URLs, og:image absolute | seo-i18n.md |

### Pattern 3: Debug/Troubleshoot Command (CMD-03)

**What:** Diagnoses common Astro/Cloudflare errors by matching symptoms to the troubleshooting tables in reference files.

**Structure:**
```yaml
---
description: Diagnose common Astro/Cloudflare errors
disable-model-invocation: true
argument-hint: [error message or symptom]
allowed-tools: Read, Grep, Glob, Bash
---
```

**Workflow:**
1. Accept error description or symptom via `$ARGUMENTS`
2. Reference the Quick Troubleshooting Index from SKILL.md to route to correct reference file
3. Read the Troubleshooting table from the identified reference file(s)
4. Match symptom to known patterns
5. If match found: present Cause + Fix from troubleshooting table
6. If no match: check anti-patterns tables for likely root cause
7. Suggest diagnostic commands (from `build-deploy.md` Debugging Workflow)
8. Optionally read relevant project files to confirm diagnosis

**Quick Troubleshooting Index routing (from SKILL.md):**

| Symptom Pattern | Routes To |
|----------------|-----------|
| `Cannot find module` / import errors | typescript-testing.md |
| Build fails on Cloudflare | build-deploy.md |
| `process.env` undefined | cloudflare-platform.md |
| Image processing / Sharp errors | styling-performance.md |
| Hydration mismatch | components-islands.md |
| Content collection errors | data-content.md |
| 404 on dynamic routes | routing-navigation.md |
| CSP / security header issues | security-advanced.md |
| Sitemap / SEO missing | seo-i18n.md |
| Server Island not rendering | components-islands.md + rendering-modes.md |
| Binding not available in dev | cloudflare-platform.md |
| ViewTransitions errors | routing-navigation.md |

**Key content sources:**
- `SKILL.md` -- Quick Troubleshooting Index (12 symptom-to-reference mappings)
- All 11 reference files -- Troubleshooting tables (Symptom / Cause / Fix)
- `references/build-deploy.md` -- Debugging Workflow (wrangler inspect, wrangler tail, etc.)

### Anti-Patterns to Avoid

- **Duplicating reference content in commands:** Commands should reference and read existing files, not inline the content. This prevents drift.
- **Auto-invocation for action commands:** Scaffold/audit/debug are side-effect-heavy actions. Always use `disable-model-invocation: true`.
- **Overloading a single command:** Three separate commands with clear purposes are better than one swiss-army-knife command with complex argument parsing.
- **Hardcoding check values:** The audit command should read anti-patterns from reference files dynamically via grep, not hardcode the checks. This way, when references are updated, the audit stays current.
- **Missing `argument-hint`:** Without hints, users don't know what arguments to pass. Always provide `argument-hint` for scaffold and debug commands.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Project scaffolding logic | Custom file generation from scratch | Read templates from `project-structure.md` Config Templates section | Templates are already verified and maintained |
| Audit rule definitions | Inline audit rules in command | Grep anti-patterns from reference files | Single source of truth, auto-updates with reference changes |
| Symptom matching | Complex regex matching against errors | Keyword-match against Quick Troubleshooting Index | Index already maps symptoms to files, Claude's NLP handles fuzzy matching |
| Config file reading | Manual file path construction | `!`cat file`` dynamic injection or tool-based Read | Claude Code's native mechanisms handle this |

**Key insight:** The reference files built in Phases 2-5 are the single source of truth. Commands orchestrate reading and applying that content -- they never duplicate it.

## Common Pitfalls

### Pitfall 1: Command File Location Confusion
**What goes wrong:** Placing commands inside `.claude/skills/astro-cloudflare/` causes them to be treated as part of the main skill's auto-invocation pool.
**Why it happens:** Skills and commands now share the same system. Files in `.claude/skills/` can auto-invoke.
**How to avoid:** Place commands in `.claude/commands/astro/` with `disable-model-invocation: true`. They become `/project:astro:*` commands without polluting the skill's auto-activation.
**Warning signs:** Commands triggering when user asks general Astro questions.

### Pitfall 2: Context Budget Overflow
**What goes wrong:** Skill descriptions consume context budget (default 15,000 chars). Adding 3 more skills can push over the limit.
**Why it happens:** Each skill's `description` field is loaded into context for auto-invocation decisions.
**How to avoid:** Use `disable-model-invocation: true` on all three commands. This removes their descriptions from the context budget entirely (per official docs: "Description not in context").
**Warning signs:** `/context` showing "excluded skills" warning.

### Pitfall 3: Scaffold Command Creating Incorrect Configs
**What goes wrong:** Command generates `output: 'hybrid'` or uses Sharp or other deprecated/incompatible patterns.
**Why it happens:** Command instructions reference the wrong template or lack Cloudflare constraints.
**How to avoid:** Command explicitly reads from `references/project-structure.md` Config Templates and `references/cloudflare-platform.md`. Never inline config patterns.
**Warning signs:** Generated configs contain any item from the 10 Critical Rules violation list.

### Pitfall 4: Audit Command Missing Checks
**What goes wrong:** Audit misses critical anti-patterns because they were added to references after the command was written.
**Why it happens:** Audit checks are hardcoded rather than dynamically reading from reference files.
**How to avoid:** Audit command greps for "## Anti-patterns" and "## Troubleshooting" sections in each reference file, then checks the project against those tables.
**Warning signs:** Running audit on a project with known issues produces no findings.

### Pitfall 5: Debug Command Not Finding Matches
**What goes wrong:** User describes a symptom that doesn't match any exact entry in troubleshooting tables.
**Why it happens:** Troubleshooting tables use specific wording; user error descriptions vary.
**How to avoid:** Debug command uses the Quick Troubleshooting Index for routing (broad symptom categories), then reads the full troubleshooting table for detailed matching. Claude's NLP handles fuzzy matching between user description and table entries.
**Warning signs:** Debug command says "no match found" for well-known Astro/Cloudflare errors.

## Code Examples

### Command File Format (Verified from Official Docs)

```yaml
---
description: What this command does
disable-model-invocation: true
argument-hint: [expected-arguments]
allowed-tools: Read, Write, Bash, Grep, Glob
---

# Command Title

Instructions for Claude to follow when this command is invoked.

## Step 1: ...

Use $ARGUMENTS for user input.
Use !`command` for dynamic context injection.
```

Source: https://code.claude.com/docs/en/skills

### Dynamic Context Injection Pattern

```yaml
---
description: Audit project configuration
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

## Current project state

- Astro config: !`cat astro.config.mjs 2>/dev/null || cat astro.config.ts 2>/dev/null || echo "NOT FOUND"`
- Package.json: !`cat package.json 2>/dev/null || echo "NOT FOUND"`
- Wrangler config: !`cat wrangler.jsonc 2>/dev/null || cat wrangler.toml 2>/dev/null || echo "NOT FOUND"`
- TypeScript config: !`cat tsconfig.json 2>/dev/null || echo "NOT FOUND"`
- Content config location: !`ls src/content.config.ts 2>/dev/null || ls src/content/config.ts 2>/dev/null || echo "NOT FOUND"`

## Audit instructions
Check the above configurations against best practices...
```

Source: https://code.claude.com/docs/en/skills (Inject dynamic context section)

### Referencing Skill Files from Commands

```markdown
Read the anti-patterns from each reference file:
- `.claude/skills/astro-cloudflare/references/project-structure.md` -- Anti-patterns section
- `.claude/skills/astro-cloudflare/references/cloudflare-platform.md` -- Anti-patterns section
...

For each anti-pattern, check if the current project violates it.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.claude/commands/*.md` only | `.claude/skills/*/SKILL.md` + `.claude/commands/*.md` unified | 2025 | Both work identically, skills add optional features |
| No invocation control | `disable-model-invocation` + `user-invocable` fields | 2025 | Commands can be user-only or Claude-only |
| No dynamic context | `!`command`` pre-execution syntax | 2025 | Shell commands run before prompt reaches Claude |
| No argument handling | `$ARGUMENTS`, `$0`, `$1`, `$ARGUMENTS[N]` | 2025 | Positional argument access in commands |
| No subagent support | `context: fork` + `agent` field | 2025 | Commands can run in isolated subagent context |

**Deprecated/outdated:**
- None relevant -- the slash command system is actively maintained and recently unified with skills.

## Open Questions

1. **Command placement: `.claude/commands/` vs `.claude/skills/`**
   - What we know: Both work. Commands in `.claude/commands/astro/` become `/project:astro:*`. Skills in `.claude/skills/astro-scaffold/` become `/astro-scaffold`.
   - What's unclear: Whether the project prefers commands namespaced under `astro/` or as independent skills.
   - Recommendation: Use `.claude/commands/astro/` for namespace consistency (`/project:astro:scaffold`, `/project:astro:audit`, `/project:astro:debug`). This keeps them grouped and clearly scoped to the project.

2. **Scaffold command scope: full project vs incremental**
   - What we know: CMD-01 says "create a new project." This implies full project scaffolding.
   - What's unclear: Should it also support incremental additions (e.g., "add D1 binding to existing project")?
   - Recommendation: Start with full project scaffolding only. Incremental additions can be a v2 feature (CMD-04/CMD-05 are already deferred).

3. **Debug command: diagnosis only vs diagnosis + fix**
   - What we know: CMD-03 says "diagnose common errors."
   - What's unclear: Should the command also apply fixes, or just report them?
   - Recommendation: Diagnose and suggest fixes from the troubleshooting tables. Offer to apply fixes if the user confirms, but don't auto-apply. This matches the GSD debug pattern which separates diagnosis from fix.

## Sources

### Primary (HIGH confidence)
- Claude Code Skills documentation: https://code.claude.com/docs/en/skills -- Full SKILL.md format, frontmatter fields, argument handling, dynamic context injection, invocation control
- Existing astro-cloudflare SKILL.md at `.claude/skills/astro-cloudflare/SKILL.md` -- all reference navigation, critical rules, decision matrices, troubleshooting index
- 11 reference files at `.claude/skills/astro-cloudflare/references/` -- Anti-patterns and Troubleshooting tables for each domain

### Secondary (MEDIUM confidence)
- GSD command examples at `.claude/commands/gsd/*.md` -- Verified patterns for command structure (frontmatter, process sections, success criteria)
- Claude Code blog and community guides -- Patterns for scaffold/audit/debug commands

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Claude Code skills format verified with official documentation
- Architecture: HIGH -- Command structure, file placement, and content sourcing all verified against existing codebase and official docs
- Pitfalls: HIGH -- Derived from official docs (context budget, invocation control) and project-specific analysis (reference file drift)

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (stable -- Claude Code skills format well-established)
