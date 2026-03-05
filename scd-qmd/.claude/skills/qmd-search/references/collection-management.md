# qmd Collection Management

<collections>
## Collections

A collection maps a local directory to the qmd index with an optional file mask.

### Add Collection

```bash
# Basic — indexes all markdown files in directory
qmd collection add ~/projects/docs --name project-docs

# With glob mask — only specific file patterns
qmd collection add ~/notes --name notes --mask "**/*.md"

# Multiple collections for different content types
qmd collection add ~/dev/api-docs --name api-docs
qmd collection add ~/meetings --name meetings --mask "**/*.md"
```

### Manage Collections

```bash
qmd collection list              # View all collections
qmd collection remove <name>     # Delete collection and its indexed data
qmd collection rename <old> <new>  # Rename collection
qmd ls <collection>              # List files in collection
qmd ls <collection>/<folder>     # List files in subfolder
```

### Collection Strategy for Projects

| Content Type | Suggested Name | Path | Mask |
|-------------|----------------|------|------|
| Project docs | `project-docs` | `./docs` | `**/*.md` |
| Crawled web docs | `web-docs` | `~/.qmd-docs/<topic>` | `**/*.md` |
| Meeting notes | `meetings` | `~/meetings` | `**/*.md` |
| Personal notes | `notes` | `~/notes` | `**/*.md` |
| API references | `api-refs` | `~/.qmd-docs/apis` | `**/*.md` |

### Best Practices

- Use descriptive collection names (searchable via `-c` flag)
- One collection per content domain for scoped searches
- Store crawled web docs in a dedicated directory (e.g., `~/.qmd-docs/`)
- Keep collections focused — smaller = faster + more relevant
</collections>

<contexts>
## Path Contexts

Contexts add metadata descriptions to collections and paths, helping the search engine understand content hierarchy.

### Add Context

```bash
# Collection-level context
qmd context add qmd://project-docs "Technical documentation for the marketplace project"
qmd context add qmd://web-docs "Crawled technical documentation from official sources"

# Path-level context (more specific)
qmd context add qmd://web-docs/svelte "Svelte 5 official documentation"
qmd context add qmd://web-docs/astro "Astro 5.x framework documentation"

# Global context
qmd context add / "Personal knowledge base covering all indexed content"
```

### Manage Contexts

```bash
qmd context list                 # View all contexts
qmd context rm qmd://old-path   # Remove context
```

### Why Contexts Matter

- Search results include context metadata for better understanding
- Helps the reranker judge relevance more accurately
- Enables hierarchical organization (collection → subfolder → document)
- Context descriptions appear in `--files` and `--json` output
</contexts>

<indexing>
## Indexing & Embedding

### Initial Setup

```bash
# 1. Add collections
qmd collection add ./docs --name project-docs

# 2. Add contexts
qmd context add qmd://project-docs "Project documentation"

# 3. Generate embeddings (required for vector/hybrid search)
qmd embed
```

### Embedding Details

- Uses EmbeddingGemma-300M model (~300MB, auto-downloaded)
- Chunks documents at ~900 tokens with 15% overlap
- First run downloads models (~2GB total) to `~/.cache/qmd/models/`
- Subsequent runs only embed new/changed documents

### Update Index

```bash
qmd update               # Re-index all collections (detect changes)
qmd update --pull        # Git pull before re-indexing (for git-tracked docs)
qmd embed                # Generate embeddings for new content
qmd embed -f             # Force re-embed everything
```

### Typical Workflow

```bash
# After adding new documents
qmd update && qmd embed

# After git pull on documentation repos
qmd update --pull && qmd embed

# After crawling new web docs
qmd collection add ~/.qmd-docs/new-topic --name new-topic
qmd context add qmd://new-topic "Description of the topic"
qmd embed
```
</indexing>

<maintenance>
## Index Maintenance

### Health Check

```bash
qmd status
```

Shows:
- Total documents and collections
- Embedding coverage (% of documents with vectors)
- Collection details (path, file count, last indexed)
- Model status

### Cleanup

```bash
qmd cleanup              # Remove orphaned data and cache
```

Removes:
- Cached LLM responses
- Orphaned vector data
- Documents from removed collections

### Data Storage

- Index location: `~/.cache/qmd/index.sqlite`
- Models cache: `~/.cache/qmd/models/`
- Total model size: ~2GB (downloaded on first use)

### Troubleshooting

| Issue | Solution |
|-------|----------|
| No vector results | Run `qmd embed` — embeddings not generated |
| Stale results | Run `qmd update && qmd embed` |
| Missing documents | Check `qmd collection list` and `qmd ls <name>` |
| Large index, slow queries | Use collection scoping (`-c name`) |
| Models not downloading | Check network, ensure `~/.cache/qmd/models/` is writable |
</maintenance>
