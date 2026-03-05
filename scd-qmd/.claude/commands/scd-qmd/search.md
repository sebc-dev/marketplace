---
description: "Search indexed documentation with qmd"
argument-hint: "<query>"
allowed-tools:
  - Bash
  - Read
---

## Search qmd Index

You are searching indexed documentation using qmd CLI.

### Parse Query

The user provides a search query as argument. If no query is provided, ask for one.

### Search Strategy

Execute searches progressively:

**1. Start with keyword search (fast):**
```bash
qmd search "<query>" --json -n 10
```

**2. If keyword results are insufficient (< 3 results above 0.3 score), escalate to hybrid:**
```bash
qmd query "<query>" --json -n 10 --min-score 0.2
```

**3. If the user wants a specific collection:**
```bash
qmd query "<query>" -c <collection> --json -n 10
```

### Present Results

For each result, show:
- **Score** (with interpretation: high/medium/low)
- **Document path** and collection
- **Relevant snippet** (from search output)

### Follow-up Actions

After presenting results, offer:
1. **Read full document**: `qmd get <path> --full` for any result
2. **Refine search**: adjust query, change collection scope, or try different search mode
3. **Related search**: suggest related queries based on results

### Output Parsing

When using `--json`, results contain:
```json
{
  "docid": "abc123",
  "score": 0.85,
  "path": "collection/file.md",
  "context": "Collection context",
  "snippet": "...matching content..."
}
```

Use scores to rank and filter results before presenting to user.

### Tips

- For API names, function names, exact terms: keyword search is usually sufficient
- For "how to" questions or conceptual queries: go straight to hybrid (`qmd query`)
- Always mention which collection(s) results came from
- If no results, check `qmd status` to verify collections are indexed and embedded
