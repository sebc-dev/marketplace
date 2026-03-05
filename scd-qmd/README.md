# scd-qmd

On-device search engine plugin for project docs and crawled technical documentation, powered by [qmd](https://github.com/tobi/qmd).

## What it does

Integrates qmd's hybrid search (BM25 + vector + LLM re-ranking) into Claude Code via MCP tools and structured commands for managing your local knowledge base.

## Components

### Skill: qmd-search
Auto-activates when you need to search indexed documentation. Routes queries to the right MCP tool based on search type.

### Commands

| Command | Description |
|---------|-------------|
| `/scd-qmd:setup` | Install qmd, configure MCP, verify models |
| `/scd-qmd:index` | Manage collections and indexing |
| `/scd-qmd:crawl <url>` | Crawl web docs, save as markdown, index |
| `/scd-qmd:search <query>` | Search indexed docs with progressive strategy |

### MCP Tools

Once configured, these tools are available:

- `qmd_search` — Fast BM25 keyword search
- `qmd_vector_search` — Semantic vector similarity
- `qmd_deep_search` — Full hybrid pipeline with re-ranking
- `qmd_get` — Retrieve single document
- `qmd_multi_get` — Batch document retrieval
- `qmd_status` — Index health check

## Quick Start

```bash
/scd-qmd:setup                    # Install and configure
/scd-qmd:crawl https://docs.example.com  # Index web documentation
/scd-qmd:search "authentication"  # Search your knowledge base
```

## Requirements

- Node.js >= 22 or Bun >= 1.0.0
- ~2GB disk space for local models (auto-downloaded)
