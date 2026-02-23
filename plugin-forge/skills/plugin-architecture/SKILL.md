---
name: plugin-architecture
description: |
  Architectural design patterns for Claude Code plugins. Component selection
  (skill vs command vs agent vs hook vs CLAUDE.md vs MCP), plugin sizing
  (micro/standard/workflow), context budget architecture (4-layer model),
  skill description optimization, reference file design, multi-component
  orchestration patterns, and quality validation. Use when designing a new
  plugin, deciding which components to use, optimizing context consumption,
  or reviewing plugin architecture. Complements plugin-dev (component syntax)
  with holistic design patterns. Do NOT use for individual component syntax
  — route those questions to plugin-dev skills instead.
---

## Component Selection Matrix

Pick the right component for each piece of functionality.

| Need | Component | Why |
|------|-----------|-----|
| Domain knowledge, auto-activated by context | **Skill** | Progressive disclosure; loaded only when relevant |
| Explicit user action, shortcut for repeatable task | **Command** | On-demand invocation via `/command`; clear intent |
| Autonomous multi-step execution with isolated context | **Agent** | Own 200K context window; parallel execution |
| Deterministic validation on lifecycle events | **Hook** | Exit codes block/allow; no LLM reasoning needed |
| Universal project rules, always-on conventions | **CLAUDE.md** | Loaded every session; <100 lines ideal |
| External service connectivity, stateful APIs | **MCP** | Tool bridge to Playwright, databases, APIs |

**Decision flow:** Is it always needed? -> CLAUDE.md. Is it deterministic? -> Hook. Is it user-triggered? -> Command. Is it context-dependent expertise? -> Skill. Does it need isolated execution? -> Agent. Does it connect external services? -> MCP.

## Plugin Sizing Heuristic

| Size | Components | Context budget | Example |
|------|-----------|---------------|---------|
| **Micro** | 1 skill, 0-1 commands | <200 tokens inactive | Single-domain expertise (TDD, commit messages) |
| **Standard** | 1 skill + references, 2-4 commands | <300 tokens inactive | Domain + workflows (astro-skill, plugin-forge) |
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

The description field determines activation reliability. Optimize for keyword density and boundary clarity.

**Structure pattern:**
```
Line 1: What the skill does (domain + capabilities)
Line 2-3: Keyword clusters (technologies, file patterns, concepts)
Line 4: Activation triggers ("Use when..." / "Use for...")
Line 5: Boundary markers ("Do NOT use for..." / "Complements X")
```

**Keyword density rules:**
- Include file extensions and config names users will mention (`.astro`, `wrangler.jsonc`)
- Include action verbs users will type ("scaffold", "migrate", "debug")
- Include the concepts, not just the tool names ("rendering modes" not just "SSR")
- Repeat key terms across different phrasings for robust matching

**Complement declarations:** Always declare relationships to sibling skills. "Complements X for Y" prevents activation conflicts and helps Claude route correctly.

See [references/prompt-engineering.md](references/prompt-engineering.md) for description templates and advanced patterns.

## Reference File Architecture

Reference files extend skills without inflating the always-loaded context.

**Design rules:**
1. **One level deep.** SKILL.md -> reference file. Never reference -> reference.
2. **XML tags for sections.** Claude can grep for `<section_name>` and load only what's needed.
3. **Self-contained sections.** Each XML section should be understandable without reading others.
4. **Grep-friendly names.** Use `snake_case` tag names matching concepts users will ask about.

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
Skill provides domain knowledge (auto-loaded). Commands provide explicit workflows that leverage that knowledge. Example: astro-skill has the skill for Astro knowledge + `/scd:astro-audit`, `/scd:astro-scaffold` commands.

**Pattern 2: Detection + Workflow (Workflow plugin)**
Multiple skills detect different aspects (vocabulary, structure, voice). Commands orchestrate multi-skill analysis with defined phases. Example: article-writing has 7 detection skills + 6 phase commands.

**Pattern 3: Command-Scoped Hooks**
Hooks defined in command frontmatter are auto-cleaned after command execution. Use for temporary validation during specific workflows (deploy validation, pre-publish checks).

**Pattern 4: Agent Delegation**
Commands spawn agents via `Task()` for isolated heavy computation. The agent gets its own 200K context. Only a summary returns to the main context. Use when a step produces verbose output (test results, large file analysis).

See [references/component-orchestration.md](references/component-orchestration.md) for detailed patterns and interaction matrices.

## Quality Checklist

Validate a plugin against these 8 criteria before publishing.

| # | Check | Target |
|---|-------|--------|
| 1 | Description has activation keywords + boundary markers | Reliable auto-activation |
| 2 | SKILL.md body under 200 lines | Fast loading |
| 3 | References use XML tags, one level deep | Selective loading |
| 4 | Inactive context cost under 300 tokens | Minimal overhead |
| 5 | Commands have `description` + `argument-hint` in frontmatter | Discoverable |
| 6 | No syntax/format docs (route to plugin-dev) | Clear boundary |
| 7 | `plugin.json` lists only used component types | Clean manifest |
| 8 | `claude plugin validate` passes | Valid structure |

See [references/quality-patterns.md](references/quality-patterns.md) for expanded checklists and testing strategies.

## Reference Files

- `references/context-engineering.md` — Context window optimization for plugins
  - Sections: jit_loading, progressive_disclosure, context_budget_rules, subagent_isolation, phase_based_context, anti_patterns

- `references/component-orchestration.md` — Multi-component interaction patterns
  - Sections: interaction_matrix, skill_plus_commands, detection_workflow, command_scoped_hooks, agent_delegation, lifecycle_patterns, anti_patterns

- `references/prompt-engineering.md` — Writing effective descriptions and instructions
  - Sections: xml_tag_patterns, description_templates, claude_md_architecture, reference_formatting, naming_conventions, anti_patterns

- `references/quality-patterns.md` — Validation, testing, and publishing
  - Sections: skill_checklist, command_checklist, validation_workflow, testing_strategies, common_pitfalls, publishing_checklist

- `references/case-studies.md` — Anatomy of real plugins
  - Sections: astro_skill_anatomy, article_writing_anatomy, design_lessons, migration_patterns
