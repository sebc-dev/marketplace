---
description: "Manage qmd collections and indexing"
argument-hint: "[add|update|status|list]"
allowed-tools:
  - Bash
  - AskUserQuestion
---

## Manage qmd Index

You are managing qmd collections and indexing.

### Parse Argument

- `add` or no argument: Add a new collection interactively
- `update`: Update all collections and re-embed
- `status`: Show index health
- `list`: List all collections and their contents

### Command: add

1. Ask the user for:
   - **Path** to the directory to index
   - **Name** for the collection (suggest a kebab-case name based on path)
   - **Description** for context (what kind of content is this?)
   - **File mask** (default: `**/*.md`, ask if they want to customize)

2. Execute:
```bash
qmd collection add <path> --name <name> --mask "<mask>"
qmd context add qmd://<name> "<description>"
qmd embed
```

3. Verify with `qmd ls <name>` and report file count.

### Command: update

```bash
qmd update --pull && qmd embed
```

Report what changed (new files, updated files).

### Command: status

```bash
qmd status
```

Present results clearly: collections, document count, embedding coverage.

### Command: list

```bash
qmd collection list
```

For each collection, show name and optionally run `qmd ls <name>` to show file count.

### Always

- Use `--json` output when parsing results programmatically
- Report errors clearly and suggest fixes
- After adding collections, remind to use MCP tools (`qmd_search`, `qmd_deep_search`) or `/scd-qmd:search` to query
