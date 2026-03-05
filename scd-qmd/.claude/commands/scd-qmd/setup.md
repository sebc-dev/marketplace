---
description: "Install and configure qmd (on-device search engine)"
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
---

## Setup qmd

You are setting up qmd, an on-device search engine for markdown documents.

### Step 1: Check Installation

Run `which qmd` to check if qmd is installed.

**If not installed**, ask the user which package manager to use, then install:
```bash
npm install -g @tobilu/qmd
# or
bun install -g @tobilu/qmd
```

Verify with `qmd --version`.

### Step 2: Check Models

Run `qmd status` to see if models are downloaded. First run auto-downloads ~2GB of models to `~/.cache/qmd/models/`.

If models aren't ready, run `qmd embed` on an empty index to trigger download.

### Step 3: Configure MCP

Check if the project already has a `.mcp.json` with qmd configured. If not, create or update it:

```json
{
  "mcpServers": {
    "qmd": {
      "command": "qmd",
      "args": ["mcp"]
    }
  }
}
```

If the user wants HTTP transport for faster repeated searches, configure instead:
```json
{
  "mcpServers": {
    "qmd": {
      "type": "http",
      "url": "http://localhost:8181/mcp"
    }
  }
}
```
And start the daemon: `qmd mcp --http --daemon`

### Step 4: Initial Collection (Optional)

Ask the user if they want to index a directory now. If yes:

1. `qmd collection add <path> --name <name>`
2. `qmd context add qmd://<name> "<description>"`
3. `qmd embed`

### Step 5: Summary

Report:
- qmd version
- Models status
- MCP configuration
- Collections configured (if any)
- Next steps (suggest `/scd-qmd:index` to add collections or `/scd-qmd:crawl` to index web docs)
