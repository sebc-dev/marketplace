# qmd Search Modes & Pipeline

<search_pipeline>
## Hybrid Search Pipeline

The `query` command (and `qmd_deep_search` MCP tool) uses a multi-stage pipeline:

### Stage 1: Query Expansion
- Original query weighted x2
- LLM generates alternative formulation (qmd-query-expansion-1.7B model)
- Both queries run in parallel through all search backends

### Stage 2: Parallel Retrieval
- **BM25 (FTS5)**: SQLite full-text search on all query variants
- **Vector**: Cosine similarity search on embedded chunks

### Stage 3: Reciprocal Rank Fusion (RRF)
- Combines results from all query variants and search methods
- k=60 fusion constant
- Top-rank bonuses: +0.05 for #1, +0.02 for #2-3
- Top 30 candidates advance to re-ranking

### Stage 4: LLM Re-ranking
- Qwen3-Reranker scores each candidate (yes/no + logprob confidence)
- Position-aware blending:
  - Ranks 1-3: 75% retrieval, 25% reranker
  - Ranks 4-10: 60% retrieval, 40% reranker
  - Ranks 11+: 40% retrieval, 60% reranker

### Search Mode Comparison

| Mode | CLI | MCP Tool | Speed | Quality | Use When |
|------|-----|----------|-------|---------|----------|
| Keyword | `qmd search` | `qmd_search` | Fast | Good for exact terms | Known keywords, API names, error messages |
| Semantic | `qmd vsearch` | `qmd_vector_search` | Medium | Good for concepts | "How to...", paraphrased, fuzzy queries |
| Hybrid | `qmd query` | `qmd_deep_search` | Slower | Best overall | Complex questions, research, critical lookups |

### CLI Search Options

```
-n <num>              # Results count (default: 5, 20 for --files/--json)
-c, --collection      # Filter by collection name
--all                 # Return all matches above threshold
--min-score <num>     # Relevance threshold (default: 0)
--full                # Include complete document content
--line-numbers        # Add line numbers to output
--index <name>        # Use named index
```

### Output Formats

```
--json                # Structured JSON with snippets (best for agents)
--files               # CSV: docid,score,filepath,context
--csv                 # Comma-separated values
--md                  # Markdown format
--xml                 # XML structure
(default)             # Colorized CLI with score highlighting
```
</search_pipeline>

<scoring_system>
## Score Normalization

| Source | Raw Range | Normalized | Notes |
|--------|-----------|------------|-------|
| BM25 (FTS5) | 0-25+ | `Math.abs(score)` | Term frequency based |
| Vector (Cosine) | 0-1 | `1/(1+distance)` | Semantic similarity |
| Reranker (LLM) | 0-10 | `/10` | Relevance judgment |

### Interpretation Guide

| Score | Meaning | CLI Color |
|-------|---------|-----------|
| 0.8 - 1.0 | Highly relevant | Green |
| 0.5 - 0.8 | Moderately relevant | Green (>0.7) / Yellow |
| 0.2 - 0.5 | Somewhat relevant | Yellow (>0.4) / Default |
| 0.0 - 0.2 | Low relevance | Default |

### Practical Thresholds

- **Precise search** (known answer exists): `--min-score 0.5`
- **Exploratory search** (broad discovery): `--min-score 0.2`
- **Exhaustive search** (don't miss anything): `--min-score 0` with `--all`
</scoring_system>

<chunking_strategy>
## Document Chunking

Documents are split into ~900-token chunks with 15% overlap for vector embedding.

### Smart Boundary Detection

Break points scored by priority:

| Boundary Type | Score | Notes |
|---------------|-------|-------|
| H1 heading (`#`) | 100 | Strongest break |
| H2 heading (`##`) | 90 | Strong break |
| Code block boundary | 80 | Preserves code integrity |
| Horizontal rule (`---`) | 60 | Section separator |
| Blank line | 20 | Paragraph break |
| List item | 5 | Weak break |
| Line break | 1 | Last resort |

### Algorithm
- Target chunk size: ~900 tokens
- Look-back window: 200 tokens before target for best break point
- Code blocks never split mid-function
- Overlap ensures context continuity between chunks

### Implications for Indexing
- Short documents (< 900 tokens): single chunk, full context preserved
- Long documents: multiple chunks, each retrievable independently
- Well-structured markdown (headings, sections) produces better chunks
</chunking_strategy>
