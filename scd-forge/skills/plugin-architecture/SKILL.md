---
name: plugin-architecture
description: |
  Architectural design patterns for Claude Code plugins. Component selection
  (skill vs command vs agent vs hook vs CLAUDE.md vs MCP), plugin sizing
  (micro/standard/workflow), context budget architecture (4-layer model),
  skill description optimization (TRIGGER/SKIP patterns, eval methodology),
  reference file design (references/ INSIDE the skill folder), multi-component
  orchestration patterns, and quality validation. Use when designing a new
  plugin, deciding which components to use, optimizing context consumption,
  reviewing plugin architecture, choosing between a skill and a command, or
  writing skill descriptions that activate reliably. Complements plugin-dev
  (component syntax) with holistic design patterns. Do NOT use for individual
  component syntax — route those questions to plugin-dev skills instead.
---

## Component Selection Matrix

Pick the right component for each piece of functionality.

| Need | Component | Why |
|------|-----------|-----|
| Domain expertise auto-activated by context (single-purpose) | **Skill** | Progressive disclosure; loaded only when relevant |
| Explicit user action, multi-step orchestrated workflow | **Command** | On-demand invocation via `/command`; clear sequencing |
| Autonomous multi-step execution with isolated context | **Agent** | Own 200K context window; parallel execution |
| Deterministic validation on lifecycle events | **Hook** | Exit codes block/allow; no LLM reasoning needed |
| Universal project rules, always-on conventions | **CLAUDE.md** | Loaded every session; <100 lines ideal |
| External service connectivity, stateful APIs | **MCP** | Tool bridge to Playwright, databases, APIs |

**Decision flow:** Is it always needed? -> CLAUDE.md. Is it deterministic? -> Hook. Is it a multi-step workflow with sequenced phases? -> Command. Is it context-dependent expertise (single-purpose)? -> Skill. Does it need isolated execution? -> Agent. Does it connect external services? -> MCP.

## Skills are NOT workflows — read this before using a skill

A skill encodes **expertise that activates contextually**, not an orchestrated pipeline. The most common architectural mistake is using a skill where a command belongs.

**Workflow signals — use a COMMAND, not a skill:**
- The description naturally reads "First X, then Y, then Z."
- The work has explicit phases the user controls progression through.
- It needs to spawn agents, write files in a specific order, or call multiple tools deterministically.
- The user explicitly invokes it ("run the deploy", "audit my plugin").

**Expertise signals — use a SKILL:**
- The work answers "what are the rules / patterns / anti-patterns for X?"
- It activates because the user mentioned a domain (file pattern, technology, concept).
- It's reusable across many different commands and contexts.
- Single-purpose: one coherent domain, one mental model.

**Why this matters (from the spec):** if your skill description summarizes a workflow ("Use for TDD — write test first, watch fail, write minimal code, refactor"), Claude reads the summary and skips the SKILL.md body. Description = activation conditions only, never a workflow recipe. Workflow steps belong inside the body or, better, in a command.

**Composition rule:** skills provide knowledge; commands orchestrate. A `/deploy` command can rely on a `kubernetes-patterns` skill — the command sequences the work, the skill informs each step.

## Hard limits (canonical spec)

| Field / artifact | Limit | Notes |
|---|---|---|
| `name` | 64 chars, kebab-case | Reserved words `anthropic`/`claude` forbidden |
| `description` | 1024 chars (API/spec) | UI Claude.ai sometimes truncates earlier |
| `description` + `when_to_use` (Claude Code) | 1536 chars combined | `when_to_use` is Claude Code only |
| SKILL.md body | < 500 lines (hard max) | Target: under 200 |
| Skills per API request | 8 max | — |
| Skills per Managed Agents session | 20 max | — |
| Total skills upload (API) | 8 MB | — |

**Frontmatter fields that DO NOT exist in the spec:** `version`, `author`, `tags`. They're silently ignored.

**Claude Code-only frontmatter fields:** `allowed-tools`, `when_to_use`, `disable-model-invocation`, `user-invocable`, `paths`, `model`, `effort`, `agent`, `hooks`, `argument-hint`. These are NOT honored by the Agent SDK or API.

## Plugin Sizing Heuristic

| Size | Components | Context budget | Example |
|------|-----------|---------------|---------|
| **Micro** | 1 skill, 0-1 commands | <200 tokens inactive | Single-domain expertise (TDD, commit messages) |
| **Standard** | 1 skill + references, 2-4 commands | <300 tokens inactive | Domain + workflows (scd-astro, scd-forge) |
| **Workflow** | 2+ skills, 5+ commands, agents, hooks | <500 tokens inactive | Full lifecycle (article-writing, BMAD) |

**Sizing rule:** Start micro. Add components only when you hit a concrete limitation — not hypothetical future needs.

## Context Budget Architecture

Plugins consume context across 4 layers. Budget each deliberately.

```
Layer 1: Metadata (~50-100 tokens) — ALWAYS loaded
  name + description from SKILL.md frontmatter
  Loaded at session start for ALL installed skills

Layer 2: Body (~500-2000 tokens) — loaded ON MATCH
  SKILL.md content below frontmatter
  Loaded when description matches user intent

Layer 3: References (~0 tokens until needed) — loaded ON DEMAND
  files in references/ directory
  Claude reads specific sections via grep-friendly XML tags

Layer 4: Commands (~0 tokens until invoked) — loaded ON INVOKE
  files in commands/ directory
  Only loaded when user types /command
```

**Budget rules:**
- Layer 1 total across all installed plugins should stay under 2000 tokens
- Layer 2 target: <200 lines per skill (hard max: 500)
- Layer 3: no limit per file, but use XML sections so Claude loads selectively
- Layer 4: no budget concern (only one command active at a time)

**Optimization:** Move decision matrices and quick-reference tables into SKILL.md body (Layer 2). Move detailed explanations, examples, and deep patterns into references (Layer 3).

## Skill Description Optimization

The description is the **only text always present in the system prompt** alongside the name. It's the activation trigger, not a summary. Claude tends to under-trigger — descriptions must be "pushy" with concrete triggers and explicit boundaries.

**Structure pattern (TRIGGER / SKIP):**
```
Line 1: What the skill does — domain + capabilities, third-person impératif
Line 2-3: Keyword clusters (technologies, file patterns, concepts, action verbs)
Line 4: TRIGGER when: <concrete trigger 1>; <trigger 2>; <trigger 3>
Line 5: SKIP / Do NOT use for: <near-miss boundary>; <complement declaration>
```

**Critical rules:**
- **Third person, impératif.** Never "I will…" — Anthropic best-practices: inconsistent POV breaks discovery.
- **Front-load triggers.** If the description gets truncated by budget caps, the head must contain the keywords.
- **Activation conditions only — no workflow summary.** A description that summarizes steps ("Use for TDD: write test, watch fail, refactor") makes Claude read the summary and skip the SKILL.md.
- **Concrete triggers beat abstract claims.** File extensions (`.astro`, `wrangler.jsonc`), import names (`anthropic`, `@anthropic-ai/sdk`), domain keywords ("Server Islands", "rendering modes"), action verbs ("scaffold", "migrate", "debug").
- **Always declare complements.** "Complements X for Y" prevents activation conflicts.
- **Always declare boundaries.** "Do NOT use for X" / "SKIP when filename matches `*-openai.py`" prevents over-triggering.

**The "pushiness" calibration:** if a skill under-triggers in real use, add explicit instructions inside the description: *"Use this skill whenever the user mentions X, Y, or Z, even if they don't explicitly ask for the skill."*

**Activation reliability methodology** — see [references/quality-patterns.md](references/quality-patterns.md):
- 16-20 eval queries (8-10 should-trigger + 8-10 near-miss should-NOT-trigger)
- 3 runs per query for variance reduction
- 60/40 train/test split, select on test set
- Test on the same model used in production

See [references/prompt-engineering.md](references/prompt-engineering.md) for description templates and TRIGGER/SKIP examples.

## Reference File Architecture

Reference files extend skills without inflating the always-loaded context.

**Location rule (non-negotiable):** `references/` lives **inside the skill folder**, never at the plugin root. The path is `<plugin>/skills/<skill-name>/references/<file>.md`. Same for `scripts/` (executable black-box code) and `assets/` (output templates, fonts).

```
plugin-name/
├── .claude-plugin/plugin.json
└── skills/
    └── skill-name/
        ├── SKILL.md           # required, < 500 lines
        ├── references/        # on-demand documentation (INSIDE skill folder)
        ├── scripts/           # black-box executables (INSIDE skill folder)
        └── assets/            # output artifacts (INSIDE skill folder)
```

**Design rules:**
1. **One level deep.** SKILL.md -> reference file. Never reference -> reference.
2. **XML tags for sections.** Claude can grep for `<section_name>` and load only what's needed.
3. **Self-contained sections.** Each XML section should be understandable without reading others.
4. **Grep-friendly names.** Use `snake_case` tag names matching concepts users will ask about.
5. **Mutual exclusivity.** Put content in `references/` when it's mutually exclusive across scenarios — Claude loads only the relevant variant. Always-needed content stays in SKILL.md body.

**XML section template:**
```xml
<concept_name>
## Concept Name

[Content that stands alone — no forward/backward references to other sections]

### Quick Reference
[Table or checklist for fast lookup]

### Anti-patterns
[Common mistakes specific to this concept]
</concept_name>
```

**SKILL.md index pattern:** List each reference file with its sections in the skill body, so Claude knows what's available without loading the files.

```markdown
- `references/context-engineering.md` — JIT loading, budget tokens, subagent isolation
  - Sections: jit_loading, lazy_file_loading, subagent_isolation, phase_based_context
```

See [references/context-engineering.md](references/context-engineering.md) for context optimization patterns.

## Multi-Component Orchestration

Four proven patterns for combining components.

**Pattern 1: Skill + Commands (Standard plugin)**
Skill provides domain knowledge (auto-loaded). Commands provide explicit workflows that leverage that knowledge. Example: scd-astro has the skill for Astro knowledge + `/scd-astro:audit`, `/scd-astro:scaffold` commands.

**Pattern 2: Detection + Workflow (Workflow plugin)**
Multiple skills detect different aspects (vocabulary, structure, voice). Commands orchestrate multi-skill analysis with defined phases. Example: article-writing has 7 detection skills + 6 phase commands.

**Pattern 3: Command-Scoped Hooks**
Hooks defined in command frontmatter are auto-cleaned after command execution. Use for temporary validation during specific workflows (deploy validation, pre-publish checks).

**Pattern 4: Agent Delegation**
Commands spawn agents via `Task()` for isolated heavy computation. The agent gets its own 200K context. Only a summary returns to the main context. Use when a step produces verbose output (test results, large file analysis).

See [references/component-orchestration.md](references/component-orchestration.md) for detailed patterns and interaction matrices.

## Quality Checklist

Validate a plugin against these 12 criteria before publishing.

| # | Check | Target |
|---|-------|--------|
| 1 | Description has TRIGGER + SKIP markers (not workflow summary) | Reliable auto-activation |
| 2 | Each skill is single-purpose (not a multi-step orchestrator) | Clear domain |
| 3 | SKILL.md body under 200 lines (hard max 500) | Fast loading |
| 4 | `references/` lives INSIDE the skill folder | Correct structure |
| 5 | References use XML tags, one level deep | Selective loading |
| 6 | Inactive context cost under 300 tokens | Minimal overhead |
| 7 | Commands have `description` + `argument-hint` in frontmatter | Discoverable |
| 8 | Workflows are commands, expertise is in skills | Component fit |
| 9 | No syntax/format docs (route to plugin-dev) | Clear boundary |
| 10 | `plugin.json` lists only used component types | Clean manifest |
| 11 | No `version` / `author` / `tags` fields in skill frontmatter | Spec compliance |
| 12 | `claude plugin validate` passes | Valid structure |

See [references/quality-patterns.md](references/quality-patterns.md) for expanded checklists, eval methodology, and testing strategies.

## Reference Files

- `references/context-engineering.md` — Context window optimization for plugins
  - Sections: jit_loading, progressive_disclosure, context_budget_rules, subagent_isolation, phase_based_context, anti_patterns

- `references/component-orchestration.md` — Multi-component interaction patterns
  - Sections: interaction_matrix, skill_plus_commands, detection_workflow, command_scoped_hooks, agent_delegation, lifecycle_patterns, anti_patterns

- `references/prompt-engineering.md` — Writing effective descriptions and instructions
  - Sections: xml_tag_patterns, description_templates, claude_md_architecture, reference_formatting, naming_conventions, anti_patterns

- `references/quality-patterns.md` — Validation, testing, and publishing
  - Sections: skill_checklist, spec_limits, command_checklist, validation_workflow, testing_strategies, common_pitfalls, publishing_checklist

- `references/case-studies.md` — Anatomy of real plugins
  - Sections: astro_skill_anatomy, article_writing_anatomy, design_lessons, migration_patterns
