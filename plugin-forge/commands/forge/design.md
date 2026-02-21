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
- Is it user-triggered? -> Command
- Is it context-dependent expertise? -> Skill
- Does it need isolated execution? -> Agent
- Does it connect external services? -> MCP

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
[Directory tree]

## Skill Description (draft)
[Full description text]

## Reference Files Plan
| File | Sections | Source material |
|------|----------|---------------|

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
1. Create skeleton (plugin.json, directories)
2. Write SKILL.md (the core)
3. Write reference files
4. Write commands
5. Validate with `claude plugin validate`
