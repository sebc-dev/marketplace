# plugin-forge

Architectural design patterns for Claude Code plugins. Covers component selection, context budget architecture, multi-component orchestration, and quality validation.

## What this plugin does

**plugin-forge** answers the "when" and "why" of plugin design:
- Which component type (skill, command, agent, hook, CLAUDE.md, MCP) fits your use case?
- How to size a plugin (micro, standard, workflow)?
- How to budget context across metadata, body, references, and commands?
- How to orchestrate multiple components together?

## Boundary with plugin-dev

- **plugin-forge** = WHEN and WHY (architecture, decisions, orchestration, quality)
- **plugin-dev** = HOW (syntax, format, file structure, API)

## Commands

| Command | Description | Human/AI |
|---------|-------------|----------|
| `/scd:design` | Guided design workshop for a new plugin | 60/40 |
| `/scd:forge-audit` | Quality audit of an existing plugin | 20/80 |
| `/scd:distill` | Transform a document into an optimized reference file | 20/80 |

## Installation

```bash
/plugin install plugin-forge@sebc-dev-marketplace
```
