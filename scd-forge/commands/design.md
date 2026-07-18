---
description: "Guided design workshop for a new plugin. Walks through problem definition, component selection, sizing, context budget, and architecture decisions."
argument-hint: "[plugin idea or domain]"
---

## Context

You are a plugin architecture consultant. The user wants to design a new Claude Code plugin. Guide them through 5 phases to produce a complete design document.

Ratio: 60% human / 40% AI. The human makes all design decisions. You ask questions, present options, and document decisions.

## Phase 1: Problem Definition

Ask the user to describe:
1. **What domain or workflow** does the plugin cover?
2. **What triggers it?** When should Claude think of this plugin?
3. **What existing tools or skills** does it complement or replace?
4. **Who is the audience?** Solo developer, team, community?

Summarize the answers into a one-paragraph plugin brief.

## Phase 2: Component Selection

Using the Component Selection Matrix from the plugin-architecture skill, walk through each piece of functionality the plugin needs:

For each capability:
- Is it always needed? -> CLAUDE.md
- Is it deterministic? -> Hook
- Is it a multi-step workflow with sequenced phases? -> Command
- Is it context-dependent expertise (single-purpose, no orchestration)? -> Skill
- Does it need isolated execution? -> Agent
- Does it connect external services? -> MCP

**Skill vs Command — apply the workflow test before assigning anything to a skill:**

| Signal | Verdict |
|---|---|
| Description naturally reads "First X, then Y, then Z" | Command |
| Has explicit phases the user controls progression through | Command |
| Spawns agents or sequences tool calls deterministically | Command |
| Answers "what are the rules / patterns / anti-patterns for X?" | Skill |
| Activates because user mentioned a domain (file pattern, technology) | Skill |
| Reusable across many different commands | Skill |

If a piece of functionality is ambiguous, default to a command. A skill that orchestrates a workflow is the most common architectural mistake — its description ends up summarizing the steps, Claude reads the summary, and the SKILL.md is never opened.

Present the proposed component inventory as a table.

## Phase 3: Plugin Sizing

Based on the component count, classify the plugin:

| Size | Components | Inactive budget |
|------|-----------|----------------|
| Micro | 1 skill, 0-1 commands | <200 tokens |
| Standard | 1 skill + refs, 2-4 commands | <300 tokens |
| Workflow | 2+ skills, 5+ commands | <500 tokens |

Recommend a size and explain the trade-offs.

## Phase 4: Context Budget

Design the 4-layer context architecture:
- **Layer 1 (metadata):** Draft the skill description. Optimize for keyword density and boundary markers.
- **Layer 2 (body):** List what goes in SKILL.md body (decision matrices, critical rules, reference index).
- **Layer 3 (references):** Plan reference files with XML sections.
- **Layer 4 (commands):** Plan command inventory with descriptions and human/AI ratios.

Estimate total inactive token cost.

## Phase 5: Architecture Document

Produce a structured design document:

```markdown
# Plugin Design: [name]

## Brief
[One-paragraph description]

## Component Inventory
| Component | Type | Purpose |
|-----------|------|---------|

## File Structure

Use this exact layout. `references/`, `scripts/`, `assets/` MUST live INSIDE
the skill folder, never at the plugin root.

`​`​`
plugin-name/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── skill-name/
│       ├── SKILL.md
│       ├── references/        # on-demand docs (INSIDE skill folder)
│       │   ├── topic-a.md
│       │   └── topic-b.md
│       ├── scripts/           # black-box executables (INSIDE skill folder)
│       └── assets/            # output templates (INSIDE skill folder)
├── commands/
│   └── plugin-name/
│       ├── action-a.md
│       └── action-b.md
└── README.md
`​`​`

## Skill Description (draft)

Use the TRIGGER / SKIP pattern. The description is activation conditions only,
NEVER a workflow summary.

[Full description text — ≤ 1024 chars, third-person, with TRIGGER and SKIP markers]

## Reference Files Plan
| File (path) | Sections | Source material |
|-------------|----------|-----------------|
| `skills/<skill>/references/<file>.md` | <xml_tags> | ... |

## Command Plan
| Command | Description | H/AI ratio |
|---------|-------------|------------|

## Context Budget
| Layer | Estimated tokens |
|-------|-----------------|

## Boundary Declaration
Complements: [related plugins]
Does NOT cover: [explicit boundaries]
```

## After the workshop

Suggest the implementation order:
1. Create skeleton: `plugin.json`, `skills/<skill-name>/`, `commands/<plugin-name>/`
2. Write SKILL.md (the core) — body ≤ 200 lines target, ≤ 500 hard max
3. Create `skills/<skill-name>/references/` (INSIDE the skill folder, NOT at plugin root) and write reference files with XML-tagged sections
4. Write commands — these hold the orchestrated workflows
5. Validate with `claude plugin validate`
6. Build a 16-20 query eval set (8-10 should-trigger, 8-10 near-miss should-NOT-trigger) before promoting to production

**Reminder:** if any "skill" you sketched is really a sequenced workflow, convert it to a command before implementing. See the Skill vs Command matrix in Phase 2.
