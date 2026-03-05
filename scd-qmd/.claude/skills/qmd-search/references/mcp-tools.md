# qmd MCP Tools Reference

<search_tools>
## Search Tools

### qmd_search — BM25 Keyword Search

Fast full-text search using SQLite FTS5.

**Parameters:**
- `query` (string, required) — Search terms
- `collection` (string, optional) — Filter by collection name
- `n` (number, optional) — Result count (default: 5)
- `min_score` (number, optional) — Minimum relevance threshold
- `full` (boolean, optional) — Include complete document content

**Best for:** Known keywords, API names, error messages, exact terms.

**Example usage:**
```
mcp__qmd__qmd_search(query="authentication middleware", collection="api-docs", n=10)
```

### qmd_vector_search — Semantic Vector Search

Cosine similarity search on embedded document chunks.

**Parameters:**
- `query` (string, required) — Natural language query
- `collection` (string, optional) — Filter by collection name
- `n` (number, optional) — Result count (default: 5)
- `min_score` (number, optional) — Minimum relevance threshold

**Best for:** Conceptual queries, "how to..." questions, paraphrased terms.

**Example usage:**
```
mcp__qmd__qmd_vector_search(query="how to handle user login flow", collection="web-docs")
```

### qmd_deep_search — Hybrid Search with Re-ranking

Full pipeline: query expansion + BM25 + vector + RRF fusion + LLM re-ranking.

**Parameters:**
- `query` (string, required) — Natural language query
- `collection` (string, optional) — Filter by collection name
- `n` (number, optional) — Result count (default: 5)
- `min_score` (number, optional) — Minimum relevance threshold
- `full` (boolean, optional) — Include complete document content

**Best for:** Complex questions, research tasks, critical lookups where quality matters most.

**Example usage:**
```
mcp__qmd__qmd_deep_search(query="best practices for error handling in API routes", n=10, min_score=0.3)
```

**Note:** Slower than other modes due to LLM inference (query expansion + re-ranking).
</search_tools>

<retrieval_tools>
## Retrieval Tools

### qmd_get — Single Document Retrieval

Retrieve a document by filepath or document ID.

**Parameters:**
- `path` (string, required) — File path or `#docid` hash
- `from` (number, optional) — Start at line number
- `lines` (number, optional) — Maximum lines to return
- `full` (boolean, optional) — Return complete content

**Path formats:**
- `collection/path/to/file.md` — By collection-relative path
- `#abc123` — By 6-character document hash ID
- `path/file.md:42` — Start from specific line

**Example usage:**
```
mcp__qmd__qmd_get(path="api-docs/authentication.md", full=true)
mcp__qmd__qmd_get(path="#f3a2c1")
mcp__qmd__qmd_get(path="docs/api.md:100", lines=50)
```

### qmd_multi_get — Batch Document Retrieval

Retrieve multiple documents by glob pattern, comma-separated list, or document IDs.

**Parameters:**
- `paths` (string, required) — Glob pattern, comma-separated paths, or docid list
- `max_bytes` (number, optional) — Skip files exceeding size limit

**Path formats:**
- `collection/path/*.md` — Glob pattern
- `doc1.md, doc2.md` — Comma-separated list
- `#id1, #id2, #id3` — Document ID list

**Example usage:**
```
mcp__qmd__qmd_multi_get(paths="web-docs/svelte/*.md")
mcp__qmd__qmd_multi_get(paths="api.md, auth.md, routes.md", max_bytes=20480)
```
</retrieval_tools>

<status_tool>
## Status Tool

### qmd_status — Index Health & Info

Returns index health, collection details, and model status.

**Parameters:** None

**Returns:**
- Total document count
- Collection list with file counts
- Embedding coverage percentage
- Model availability

**Use to:**
- Discover available collections before searching
- Verify indexing is complete
- Check if embeddings are generated
- Debug missing search results
</status_tool>

<http_transport>
## HTTP Transport

For persistent MCP server avoiding repeated model loads:

### Start Server

```bash
qmd mcp --http                    # localhost:8181
qmd mcp --http --port 8080        # Custom port
qmd mcp --http --daemon           # Background daemon
```

### Stop Server

```bash
qmd mcp stop                      # Stop daemon
```

### Endpoints

- `POST /mcp` — MCP Streamable HTTP (stateless JSON)
- `GET /health` — Liveness check

### MCP Configuration for HTTP

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

### When to Use HTTP Transport

- **Stdio (default):** Simple setup, model loads per session, good for occasional use
- **HTTP:** Persistent server, models stay loaded, faster responses, better for frequent searches
- **HTTP daemon:** Background mode, survives terminal close, ideal for always-on indexing
</http_transport>
