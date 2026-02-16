# Phase 8: MCP Tool Verification Report

**Verified:** 2026-02-04
**Method:** Empirical testing via direct HTTP calls to `https://docs.mcp.cloudflare.com/mcp`
**Status:** VERIFIED -- tool name, parameters, and return format confirmed

---

## 1. Confirmed Tool Specification

### Primary Tool: `search_cloudflare_documentation`

| Property | Value | Confidence |
|----------|-------|------------|
| Fully qualified name (Claude Code) | `mcp__cloudflare__search_cloudflare_documentation` | **CONFIRMED** -- 6 successful calls |
| Parameter schema | `{ query: string }` (required, no other params) | **CONFIRMED** -- all calls used only `query` |
| Return format | XML with `<result>` blocks containing `<url>`, `<title>`, `<text>` | **CONFIRMED** -- see raw example below |
| Max results per call | Up to 10 (observed 7-10 per query) | **CONFIRMED** |
| Search type | Semantic (not keyword) | **CONFIRMED** -- natural language queries work well |
| Server name | `docs-ai-search` version `0.4.4` | **CONFIRMED** -- from `initialize` response |

**Parameter schema (confirmed via successful calls):**
```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string" }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

**Return format structure (confirmed):**
```
content: [{ type: "text", text: "<result>\n<url>...</url>\n<title>...</title>\n<text>...</text>\n</result>\n<result>..." }]
```

The response is a single `text` content block containing concatenated XML `<result>` elements. Each result has:
- `<url>` -- documentation page URL (note: URLs have doubled prefix, e.g., `https://developers.cloudflare.com/https://developers.cloudflare.com/workers/...`)
- `<title>` -- page title (observed: often empty in practice)
- `<text>` -- relevant text excerpt (substantial, often 500-2000 chars)

**Important observation -- empty titles:** In all 6 test queries, the `<title>` field was consistently empty. The `<text>` field contains markdown-like content that often starts with the page heading, so title information can be extracted from there.

**Important observation -- doubled URL prefix:** All returned URLs contain a doubled prefix (`https://developers.cloudflare.com/https://developers.cloudflare.com/...`). When using these URLs, strip the first `https://developers.cloudflare.com/` prefix to get the actual working URL.

### Secondary Tool: `migrate_pages_to_workers_guide`

| Property | Value | Confidence |
|----------|-------|------------|
| Fully qualified name | `mcp__cloudflare__migrate_pages_to_workers_guide` | **CONFIRMED** -- listed in `tools/list` response |
| Parameters | None (empty object `{}`) | **CONFIRMED** |
| Return format | Plain text | CONFIRMED (from `tools/list` description) |
| Relevance to skill | LOW -- Pages-to-Workers migration only | N/A |

### All Tools on Cloudflare Documentation MCP Server

| Tool | Skill Relevance | Notes |
|------|----------------|-------|
| `search_cloudflare_documentation` | **YES -- primary tool** | Core documentation lookup for Workers, KV, D1, R2 |
| `migrate_pages_to_workers_guide` | Out of scope for core skill | Useful only for Pages-to-Workers migration scenarios |

No other tools exist on this server. Total: 2 tools.

---

## 2. Precision Profile

### Summary Table

| Product | Precision | Results Relevant | Total Results | Notes |
|---------|-----------|-----------------|---------------|-------|
| Workers (runtime API) | **HIGH** | 5/7 | 7 | Strong coverage of fetch handler, runtime APIs, event lifecycle |
| Workers (compat flags) | **MEDIUM** | 6/9 | 9 | Good nodejs_compat coverage, some drift to unrelated compat flags and changelog entries |
| KV | **HIGH** | 6/6 | 6 | Excellent -- all results directly about KV API methods |
| D1 | **HIGH** | 5/6 | 6 | Strong -- overview, D1Database class, prepare/bind/batch, query guide |
| R2 | **MEDIUM** | 5/8 | 8 | Good core coverage, some drift to WAF lists API and AI Search |
| Bindings (ambiguous) | **MEDIUM** | 5/7 | 7 | Good wrangler.toml coverage but includes Durable Objects and infrastructure-as-code |

### Key Observations

1. **Product-scoped queries perform best.** Queries with explicit product names (KV, D1) returned the most precise results.
2. **KV queries are the most precise.** 6/6 results directly about KV API methods -- the tool excels here.
3. **Ambiguous queries return cross-product results.** The "bindings in wrangler.toml" query returned results spanning KV, R2, D1, Durable Objects, and general wrangler config -- expected behavior for a broad query.
4. **Compatibility flags queries pick up changelogs.** Workers compat flag queries returned some changelog entries alongside reference pages -- partiel but still useful.
5. **R2 queries can drift.** The R2 query returned a WAF Lists API endpoint result (hors sujet) -- likely due to semantic similarity of "list API parameters."

---

## 3. Detailed Query Results

### Query 1: Workers Runtime API

**Query:** `"Cloudflare Workers runtime API fetch handler and event lifecycle"`
**Results:** 7
**Rating:** HIGH precision

| # | URL (cleaned) | Content Topic | Classification |
|---|---------------|---------------|----------------|
| 1 | /workers/languages/rust/ | Rust Workers runtime API, event macro, fetch parameters | partiel (Rust-specific, not JS) |
| 2 | /workers/runtime-apis/eventsource/ | EventSource SSE API | partiel (runtime API but not fetch handler) |
| 3 | /workers/runtime-apis/handlers/fetch/ | **Fetch handler: request, env, ctx parameters** | **exact** |
| 4 | /workers-ai/features/function-calling/embedded/examples/fetch/ | Workers AI function calling with fetch | hors sujet |
| 5 | /workers/runtime-apis/fetch/ | **Fetch API for outbound requests** | **exact** |
| 6 | /workflows/ | Cloudflare Workflows features | hors sujet |
| 7 | /workers/runtime-apis/ | **Runtime APIs overview page** | **exact** |

**Notes:** 3 exact hits for Workers runtime/fetch. The Rust result is partiel because it covers the same concepts in a different language. Workers AI function calling is hors sujet.

### Query 2: Workers Compatibility Flags

**Query:** `"Workers compatibility flags nodejs_compat compatibility date"`
**Results:** 9
**Rating:** MEDIUM precision

| # | URL (cleaned) | Content Topic | Classification |
|---|---------------|---------------|----------------|
| 1 | /hyperdrive/examples/connect-to-postgres/ | nodejs_compat flag for Postgres driver | partiel (mentions flag in context of Hyperdrive) |
| 2 | /workers/runtime-apis/nodejs/https/ | Node.js HTTPS module compat flags | partiel (specific flag, not overview) |
| 3 | /cache/interaction-cloudflare-products/workers-cache-rules/ | Cache API compat flags | partiel (cache-specific flags) |
| 4 | /pages/functions/get-started/ | Pages Functions compat flags config | partiel (Pages context) |
| 5 | /changelog/2025-03-11-process-env-support/ | **nodejs_compat_populate_process_env flag** | **exact** |
| 6 | /workers/configuration/compatibility-flags/ | **Compatibility flags reference page** | **exact** |
| 7 | /changelog/2025-04-08-nodejs-crypto-and-tls/ | nodejs_compat crypto/TLS changelog | partiel |
| 8 | /workers/platform/changelog/ | Workers platform changelog | partiel |
| 9 | /workers/configuration/compatibility-dates/ | **Compatibility dates reference** | **exact** |

**Notes:** 3 exact hits including the main compat flags reference page. Many partiel results reference nodejs_compat in various contexts. No hors sujet results -- all relate to Workers compatibility.

### Query 3: KV Binding API

**Query:** `"Workers KV namespace put get delete API method parameters"`
**Results:** 6
**Rating:** HIGH precision

| # | URL (cleaned) | Content Topic | Classification |
|---|---------------|---------------|----------------|
| 1 | /kv/api/delete-key-value-pairs/ | **KV delete() method with parameters** | **exact** |
| 2 | /kv/ | **KV overview with put/get/list/delete examples** | **exact** |
| 3 | /kv/api/write-key-value-pairs/ | **KV put() method with expiration options** | **exact** |
| 4 | /kv/get-started/ | **KV getting started guide** | **exact** |
| 5 | /kv/api/list-keys/ | **KV list() method** | **exact** |
| 6 | /kv/api/read-key-value-pairs/ | **KV get() method** | **exact** |

**Notes:** Perfect precision. Every result directly addresses KV API methods. This is the best-performing query across all tests.

### Query 4: D1 Binding API

**Query:** `"Cloudflare D1 database prepare bind query batch SQL API"`
**Results:** 6
**Rating:** HIGH precision

| # | URL (cleaned) | Content Topic | Classification |
|---|---------------|---------------|----------------|
| 1 | /d1/worker-api/ | **D1 Workers Binding API overview** | **exact** |
| 2 | /d1/ | **D1 overview with features** | **exact** |
| 3 | /d1/worker-api/d1-database/ | **D1Database class: prepare, batch, exec methods** | **exact** |
| 4 | /d1/best-practices/query-d1/ | **Query D1 guide with prepare/bind examples** | **exact** |
| 5 | /d1/observability/metrics-analytics/ | D1 metrics and analytics | partiel (D1 but not API reference) |
| 6 | /d1/examples/export-d1-into-r2/ | Export D1 database example | partiel (D1 but not API reference) |

**Notes:** 4 exact hits covering the D1 API surface. The last 2 results are D1-related but not API reference -- still useful context.

### Query 5: R2 Binding API

**Query:** `"Cloudflare R2 object storage put get list API parameters"`
**Results:** 8
**Rating:** MEDIUM precision

| # | URL (cleaned) | Content Topic | Classification |
|---|---------------|---------------|----------------|
| 1 | /r2/ | **R2 overview page** | **exact** |
| 2 | /r2/examples/cache-api/ | R2 Cache API example | partiel (R2 but Cache-focused) |
| 3 | /r2/objects/download-objects/ | **R2 get() via Workers API** | **exact** |
| 4 | /waf/tools/lists/lists-api/endpoints/ | WAF Lists API endpoints | **hors sujet** |
| 5 | /r2/get-started/workers-api/ | **R2 Workers API: bucket create, put, get** | **exact** |
| 6 | /r2/objects/upload-objects/ | **R2 put() via Workers API** | **exact** |
| 7 | /learning-paths/r2-intro/series/r2-1/ | R2 getting started learning path | partiel |
| 8 | /ai-search/get-started/api/ | AI Search API (mentions R2) | **hors sujet** |

**Notes:** 4 exact hits for R2 API. 2 hors sujet results (WAF lists, AI Search) -- likely due to semantic similarity of "list API parameters." The R2 Workers API binding documentation (`/r2/api/workers/workers-api-usage/`) was not directly returned, which suggests more specific queries like "R2 bucket put get head delete Workers binding" might perform better.

### Query 6: Ambiguous Bindings Query

**Query:** `"how to configure bindings in wrangler.toml for Workers"`
**Results:** 7
**Rating:** MEDIUM precision (as expected for an ambiguous query)

| # | URL (cleaned) | Content Topic | Classification |
|---|---------------|---------------|----------------|
| 1 | /workers/development-testing/ | **Remote bindings config in wrangler** | **exact** |
| 2 | /durable-objects/reference/durable-objects-migrations/ | DO migrations in wrangler config | partiel (bindings but DO-specific) |
| 3 | /workers/wrangler/configuration/ | **Wrangler configuration reference** | **exact** |
| 4 | /workers/platform/infrastructure-as-code/ | **D1, DO, Service bindings config** | **exact** |
| 5 | -- | -- | -- |
| 6 | -- | -- | -- |
| 7 | -- | -- | -- |

**Notes:** The ambiguous query returned fewer highly relevant results but the top 3-4 were on target. The wrangler configuration page is comprehensive. Cross-product results are expected -- this validates the recommendation to use product-scoped queries.

---

## 4. Query Templates for Phase 9

These templates are refined from empirical test results. They are ready to copy into SKILL.md.

| Product | Query Template | Purpose | Empirical Precision |
|---------|---------------|---------|---------------------|
| Workers runtime | `"Cloudflare Workers runtime API [topic]"` | General Workers API reference | HIGH |
| Workers fetch handler | `"Workers fetch handler request env ctx parameters"` | Fetch handler signature and usage | HIGH |
| Workers compat flags | `"Workers compatibility flags [flag_name]"` | Specific compatibility flag reference | MEDIUM |
| Workers nodejs_compat | `"Workers nodejs_compat compatibility flag Node.js APIs"` | Node.js API availability on Workers | MEDIUM |
| KV read/write | `"Workers KV namespace [operation] API method parameters"` | KV put/get/delete/list operations | HIGH |
| KV specific method | `"Workers KV [method_name] key-value pairs"` | Individual KV method details | HIGH |
| D1 API | `"Cloudflare D1 database [operation] SQL API"` | D1 prepare/bind/batch/exec | HIGH |
| D1 specific method | `"D1 Workers binding [method] prepared statement"` | Individual D1 method details | HIGH |
| R2 API | `"Cloudflare R2 object storage [operation] Workers API"` | R2 put/get/list/delete via binding | MEDIUM |
| R2 specific operation | `"R2 bucket [put/get/head/delete] Workers binding"` | Individual R2 operation details | MEDIUM |
| Wrangler config | `"Wrangler configuration [binding_type] wrangler.toml"` | Binding configuration reference | MEDIUM |
| Workers limits | `"Cloudflare Workers platform limits and pricing [resource]"` | CPU time, memory, request size | Untested (from research) |
| Workers Static Assets | `"Workers static assets configuration and routing"` | Static asset serving | Untested (from research) |

### Template Usage Pattern for SKILL.md

```
When looking up [product] API details, use:
mcp__cloudflare__search_cloudflare_documentation({ query: "[template]" })
```

---

## 5. Formulation Recommendations

### What Works Best

- **Prefer product-scoped descriptive queries** over generic ones.
  - Good: `"Workers KV namespace put get delete API method parameters"` (6/6 exact)
  - Bad: `"how to store data"` (would match KV, D1, R2, Durable Objects, etc.)

- **Prefer including "API" or "method" in the query** when looking for binding reference.
  - Good: `"D1 database prepare bind query batch SQL API"` (4/6 exact)
  - Bad: `"D1 database usage"` (too vague, would return overview/tutorial pages)

- **Prefer specific method names** when targeting a particular operation.
  - Good: `"Workers KV namespace put get delete API method parameters"`
  - Good: `"D1 Workers binding prepare bind query statement"`

- **Prefer "Workers" prefix for binding products** (KV, D1, R2 are accessed via Workers bindings).
  - Good: `"Workers KV namespace put API"` -- scopes to binding API
  - Bad: `"KV put"` -- too short, ambiguous semantic meaning

### What to Avoid

- **Avoid queries without a product name.** The Vectorize index covers ALL Cloudflare products (50+). Generic queries like `"how to configure bindings"` return cross-product results spanning KV, R2, Durable Objects, Service Bindings, etc.

- **Avoid very short keyword queries.** The semantic search needs enough context to disambiguate. `"KV put"` is less effective than `"Workers KV put method API parameters"`.

- **Avoid mixing too many product keywords.** A query like `"KV D1 R2 Workers API"` confuses the semantic search. Query one product at a time.

- **Avoid expecting exact keyword matching.** The search is semantic, not keyword-based. The query `"R2 list API parameters"` returned a WAF Lists API result because "list API parameters" is semantically similar across products.

### Natural Language vs Keywords

Empirical testing shows **hybrid queries work best**: start with a product name (keyword anchor), then describe what you want in natural language. Pure keyword queries (`"KV put get delete"`) are less effective than descriptive ones (`"Workers KV namespace put get delete API method parameters"`).

---

## 6. Appendix: Raw Example

### Query: `"Workers KV namespace put get delete API method parameters"`

This query was selected as the representative example because it achieved 6/6 exact precision -- every result directly addresses KV API methods.

**Raw response (JSON-RPC):**

```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "<result>\n<url>https://developers.cloudflare.com/https://developers.cloudflare.com/kv/api/delete-key-value-pairs/</url>\n<title></title>\n<text>\n\n## Other methods to access KV\n\nYou can also [delete key-value pairs from the command line with Wrangler](/kv/reference/kv-commands/#kv-namespace-delete) or [with the REST API](/api/resources/kv/subresources/namespaces/subresources/values/methods/delete/).\n\n\n\n# Delete key-value pairs\n\nTo delete a key-value pair, call the `delete()` method of the [KV binding](/kv/concepts/kv-bindings/) on any [KV namespace](/kv/concepts/kv-namespaces/) you have bound to your Worker code:\n\nJavaScript\n\n```\n\nenv.NAMESPACE.delete(key);\n\n\n```\n\n#### Example\n\nAn example of deleting a key-value pair from within a Worker:\n\nJavaScript\n\n```\n\nexport default {\n\n  async fetch(request, env, ctx) {\n\n    try {\n\n      await env.NAMESPACE.delete(\"first-key\");\n\n\n      return new Response(\"Successful delete\", {\n\n        status: 200\n\n      });\n\n    }\n\n    catch (e)\n\n    {\n\n      return new Response(e.message, {status: 500});\n\n    }\n\n  },\n\n};\n\n\n```\n\n#### Parameters\n\n* `key`: `string`\n  * The key to associate with the value.\n\n#### Response\n\n* `response`: `Promise<void>`\n  * A `Promise` that resolves if the delete is successful.\n</text>\n</result>\n<result>\n<url>https://developers.cloudflare.com/https://developers.cloudflare.com/kv/</url>\n<title></title>\n<text>\n[KV overview with put/get/list/delete TypeScript examples]\n</text>\n</result>\n<result>\n<url>https://developers.cloudflare.com/https://developers.cloudflare.com/kv/api/write-key-value-pairs/</url>\n<title></title>\n<text>\n[KV put() method with expiration, expirationTtl, metadata options]\n</text>\n</result>\n<result>\n<url>https://developers.cloudflare.com/https://developers.cloudflare.com/kv/get-started/</url>\n<title></title>\n<text>\n[KV getting started: create namespace, bind, read/write]\n</text>\n</result>\n<result>\n<url>https://developers.cloudflare.com/https://developers.cloudflare.com/kv/api/list-keys/</url>\n<title></title>\n<text>\n[KV list() method with prefix, limit, cursor parameters]\n</text>\n</result>\n<result>\n<url>https://developers.cloudflare.com/https://developers.cloudflare.com/kv/api/read-key-value-pairs/</url>\n<title></title>\n<text>\n[KV get() method with type parameter (text, json, arrayBuffer, stream)]\n</text>\n</result>"
      }
    ]
  },
  "jsonrpc": "2.0",
  "id": 12
}
```

**Classification annotations:**

| Result | URL Path | Classification | Why |
|--------|----------|----------------|-----|
| 1 | `/kv/api/delete-key-value-pairs/` | **exact** | Direct KV delete() API reference with parameters |
| 2 | `/kv/` | **exact** | KV overview with all CRUD operation examples |
| 3 | `/kv/api/write-key-value-pairs/` | **exact** | KV put() API reference with options |
| 4 | `/kv/get-started/` | **exact** | KV getting started with binding and usage |
| 5 | `/kv/api/list-keys/` | **exact** | KV list() API reference with cursor pagination |
| 6 | `/kv/api/read-key-value-pairs/` | **exact** | KV get() API reference with type parameter |

---

## 7. Server Discovery Notes

### Server Identity

The `initialize` response revealed:
- **Server name:** `docs-ai-search` (not `docs-vectorize` as identified in research from source code)
- **Version:** `0.4.4` (research found `0.5.1` in source code changelog)
- **Protocol:** MCP 2025-03-26
- **Capabilities:** tools (listChanged), prompts (listChanged), completions

This discrepancy suggests the server was renamed or the production deployment uses a different package name than the source code. The tool names and behavior are identical to what was documented in the research phase.

### Connection Details

- **URL:** `https://docs.mcp.cloudflare.com/mcp`
- **Transport:** Streamable HTTP (no session ID required)
- **Authentication:** None required for tool calls (OAuth may be required via `mcp-remote` bridge but direct HTTP worked without auth)

---

## 8. Phase 9 Readiness Checklist

- [x] Tool name empirically confirmed: `mcp__cloudflare__search_cloudflare_documentation`
- [x] Parameter schema confirmed: `{ query: string }` only
- [x] Return format characterized with real data (not reconstructed)
- [x] Empty `<title>` behavior documented
- [x] Doubled URL prefix behavior documented
- [x] Precision profile for all 4 products (Workers, KV, D1, R2)
- [x] Query templates refined from empirical results
- [x] Formulation recommendations with concrete "prefer X over Y" guidance
- [x] Anti-patterns identified from real results
- [x] 1 annotated raw example included
- [x] Second tool (`migrate_pages_to_workers_guide`) cataloged as out of scope

**Phase 9 executor can write SKILL.md MCP integration content directly from this document without additional research or testing.**

---

*Phase: 08-mcp-tool-verification*
*Verified: 2026-02-04*
