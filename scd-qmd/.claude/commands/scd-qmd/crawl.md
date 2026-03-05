---
description: "Crawl web documentation and index it in qmd"
argument-hint: "<url>"
allowed-tools:
  - Bash
  - WebFetch
  - Write
  - Read
  - Glob
  - AskUserQuestion
---

## Crawl Web Documentation

You are crawling technical documentation from the web, saving it as local markdown, and indexing it in qmd.

### Human/AI Ratio
- **AI**: 90% — fetches, converts, organizes, and indexes
- **Human**: 10% — provides URL and confirms collection name

### Step 1: Determine Source

The user provides a URL (or you ask for one). Common patterns:
- **Documentation site**: `https://docs.example.com/` — crawl multiple pages
- **Single page**: `https://example.com/docs/api` — fetch one page
- **GitHub README**: `https://github.com/user/repo` — fetch README
- **llms.txt**: `https://example.com/llms.txt` or `https://example.com/llms-full.txt` — structured LLM-friendly docs

### Step 2: Determine Strategy

Ask the user:
1. **Collection name** (suggest based on URL domain/path)
2. **Scope**: single page, or should you follow links to related pages?
3. **Storage path**: default `~/.qmd-docs/<collection-name>/`

### Step 3: Fetch Content

Use `WebFetch` to retrieve the documentation. For each page:

1. Fetch the URL with a prompt like: "Extract all technical documentation content. Preserve code examples, API references, configuration options, and headings. Output clean markdown."
2. Save the result as a markdown file in the storage directory

**For multi-page crawls:**
1. First fetch the index/sidebar page to identify documentation links
2. Fetch each linked page (limit to 20 pages unless user requests more)
3. Name files based on page title or URL path (kebab-case)

**For llms.txt sources:**
1. Fetch the llms.txt URL
2. If it contains structured content, split into logical sections
3. Save each section as a separate markdown file

### Step 4: Organize Files

Structure the output directory:
```
~/.qmd-docs/<collection-name>/
  index.md          # Overview/table of contents
  getting-started.md
  api-reference.md
  configuration.md
  ...
```

Each file should have:
- A `# Title` heading
- Source URL as a comment: `<!-- source: https://... -->`
- Clean markdown content (no navigation, footers, ads)

### Step 5: Index in qmd

```bash
# Add collection
qmd collection add ~/.qmd-docs/<name> --name <name>

# Add context
qmd context add qmd://<name> "<description of the documentation>"

# Generate embeddings
qmd embed
```

### Step 6: Verify

```bash
qmd ls <name>
qmd search "test query" -c <name> -n 3
```

Report:
- Number of pages crawled and saved
- Collection name and file count
- Test search results to confirm indexing works
- Remind: use `mcp__qmd__qmd_deep_search` or `/scd-qmd:search` to query

### Important Notes

- **Respect rate limits**: pause between fetches if crawling many pages
- **Skip non-doc pages**: ignore login, pricing, marketing pages
- **Prefer llms.txt**: if the site offers `llms.txt` or `llms-full.txt`, prefer it over scraping
- **Update existing**: if collection exists, `qmd update && qmd embed` instead of re-adding
