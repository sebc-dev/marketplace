---
name: qmd-search
description: |
  On-device hybrid search engine for indexed markdown documents, project docs, and crawled technical documentation.
  qmd search query vsearch vector semantic BM25 full-text collection index embed knowledge-base.
  MCP tools: qmd_search, qmd_vector_search, qmd_deep_search, qmd_get, qmd_multi_get, qmd_status.
  Use when: user asks to search indexed docs, find in documentation, look up knowledge base, retrieve indexed content, query docs, "what do the docs say about".
  Complements WebFetch for live web content; qmd searches pre-indexed local documents. If qmd MCP tools unavailable, fall back to Grep/Read.
---

## MCP Tool Routing

| Need | Tool | When |
|------|------|------|
| Quick keyword lookup | `mcp__qmd__qmd_search` | Known terms, exact matches, fast results |
| Conceptual similarity | `mcp__qmd__qmd_vector_search` | Fuzzy meaning, "how to...", paraphrased queries |
| Best quality results | `mcp__qmd__qmd_deep_search` | Complex questions, research, critical lookups |
| Retrieve full document | `mcp__qmd__qmd_get` | Need complete file content by path or docid |
| Retrieve multiple docs | `mcp__qmd__qmd_multi_get` | Glob patterns, comma-separated paths, batch retrieval |
| Index health check | `mcp__qmd__qmd_status` | Verify collections, check what's indexed |

## Search Strategy

1. **Start with `qmd_search`** for known terms — fastest, no model inference
2. **Escalate to `qmd_deep_search`** when keyword search misses or query is conceptual
3. **Use `qmd_vector_search`** for pure semantic similarity (no keyword component)
4. **Retrieve with `qmd_get`** once you identify the right document

## Score Interpretation

| Score Range | Meaning | Action |
|-------------|---------|--------|
| 0.8 - 1.0 | Highly relevant | Use directly |
| 0.5 - 0.8 | Moderately relevant | Review, likely useful |
| 0.2 - 0.5 | Somewhat relevant | Skim for context |
| 0.0 - 0.2 | Low relevance | Skip unless nothing better |

## Collection Scoping

Always scope searches to relevant collections when possible:
- Pass `collection` parameter to MCP tools to filter results
- Use `qmd_status` to discover available collections
- Narrower scope = faster + more relevant results

## Search Tips

- **Combine approaches**: keyword search for specific APIs, deep search for concepts
- **Use `--full` flag** (or full parameter) when you need complete document content in results
- **Check `min_score`**: set to 0.3+ to filter noise in large indexes
- **Result count**: default 5, increase to 10-20 for broad exploration

## Reference Files

- `references/search-modes.md` — Hybrid pipeline details, scoring, chunking strategy
  - Sections: search_pipeline, scoring_system, chunking_strategy
- `references/collection-management.md` — Collections, contexts, indexing, maintenance
  - Sections: collections, contexts, indexing, maintenance
- `references/mcp-tools.md` — MCP tool details, parameters, response formats
  - Sections: search_tools, retrieval_tools, status_tool, http_transport
