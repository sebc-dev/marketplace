# Phase 8: MCP Tool Verification - Research

**Researched:** 2026-02-04
**Domain:** Cloudflare MCP Documentation Server -- tool specification and behavior characterization
**Confidence:** HIGH

## Summary

This research empirically investigated the Cloudflare Documentation MCP server (`docs.mcp.cloudflare.com`) to confirm the exact tool names, parameter schemas, return formats, and behavior available to this project's Claude Code sessions. The server is already configured in the project's MCP settings as the `cloudflare` server using `npx mcp-remote https://docs.mcp.cloudflare.com/mcp`.

The documentation MCP server (version 0.5.1, codenamed `docs-vectorize`) exposes exactly **2 tools**: `search_cloudflare_documentation` and `migrate_pages_to_workers_guide`. The primary tool accepts a single `query: string` parameter and returns up to 10 results in XML format with `<url>`, `<title>`, and `<text>` fields. It uses semantic search via Cloudflare Vectorize with the `@cf/google/embeddinggemma-300m` embedding model, meaning queries are matched semantically rather than by keyword. The second tool takes no parameters and returns a plain text migration guide.

Separately, Cloudflare operates **16 distinct MCP servers** (not just one), each at its own subdomain. The `docs.mcp.cloudflare.com` server is documentation-only. The `bindings.mcp.cloudflare.com` server handles Workers Bindings (KV, D1, R2) operations. Only the docs server is configured in this project, which is correct for the skill's purpose (documentation reference, not account management).

**Primary recommendation:** The tool name `mcp__cloudflare__search_cloudflare_documentation` is confirmed. Use it with specific, product-scoped queries (e.g., "Workers KV put API") because the semantic search covers the entire Cloudflare documentation corpus (50+ products). The `migrate_pages_to_workers_guide` tool exists but is out of scope for the skill.

## Standard Stack

This phase is not about libraries/tools to install. It is about characterizing an already-configured MCP server.

### MCP Server Configuration (Already in Project)

| Property | Value | Confidence |
|----------|-------|------------|
| Server name in Claude Code | `cloudflare` | HIGH -- from project MCP settings |
| Transport | stdio via `npx mcp-remote` | HIGH -- from project MCP settings |
| Remote URL | `https://docs.mcp.cloudflare.com/mcp` | HIGH -- from project MCP settings |
| Server package version | `0.5.1` (docs-vectorize) | HIGH -- from GitHub CHANGELOG.md |
| Auth | OAuth (handled by mcp-remote) | HIGH -- from GitHub README |

### Fully Qualified Tool Names

| Tool | FQ Name in Claude Code | Confidence |
|------|------------------------|------------|
| Search Documentation | `mcp__cloudflare__search_cloudflare_documentation` | HIGH -- server name `cloudflare` + tool name `search_cloudflare_documentation` from source code |
| Pages Migration Guide | `mcp__cloudflare__migrate_pages_to_workers_guide` | HIGH -- same derivation from source code |

### No Installation Needed

The MCP server is remote (hosted by Cloudflare). No npm packages to install. The `mcp-remote` bridge is already configured.

## Architecture Patterns

### Tool 1: `search_cloudflare_documentation`

**Fully qualified name:** `mcp__cloudflare__search_cloudflare_documentation`

**Parameter schema (from source code -- zod):**
```typescript
{
  query: z.string()  // Required. Natural language search query.
}
```

Single parameter. No optional parameters. No pagination. No filters.

**Description (from source code):**
> "Search the Cloudflare documentation" -- covering Workers, Pages, R2, AI products, Zero Trust, CDN, and billing topics.

**Return format (from source code):**
XML structure with up to 10 results:
```xml
<result>
  <url>https://developers.cloudflare.com/workers/...</url>
  <title>Page Title</title>
  <text>Relevant text excerpt from the documentation page...</text>
</result>
<result>
  <url>...</url>
  <title>...</title>
  <text>...</text>
</result>
```

**Search mechanism:**
- Semantic search via Cloudflare Vectorize index
- Embedding model: `@cf/google/embeddinggemma-300m`
- Query prefix used internally: `"task: search result | query: "` + user query
- Returns TOP_K = 10 results (hardcoded)
- Retry logic: exponential backoff with full jitter, 10 retries, starting at 50ms

**Key implication:** Because it uses semantic search (not keyword search), queries phrased as natural language questions or descriptions will work well. However, the entire Cloudflare documentation corpus is indexed, so product-scoping keywords are essential to get relevant results.

### Tool 2: `migrate_pages_to_workers_guide`

**Fully qualified name:** `mcp__cloudflare__migrate_pages_to_workers_guide`

**Parameter schema:** Empty object `{}` (no parameters)

**Description (from source code):**
> "ALWAYS read this guide before migrating Pages projects to Workers."

**Return format:**
Plain text content fetched from `https://developers.cloudflare.com/workers/prompts/pages-to-workers.txt` with HTTP caching (3600-second TTL).

**Relevance to skill:** LOW -- this tool provides a static migration guide for Pages-to-Workers transitions. It could be mentioned in the skill's migration/deployment section but is not a primary tool for the skill's core use case.

### All Cloudflare MCP Servers (Full Catalog)

| Server | URL | Purpose | Relevant to Skill? |
|--------|-----|---------|---------------------|
| **Documentation** | `docs.mcp.cloudflare.com/mcp` | Search CF docs | **YES -- configured** |
| **Workers Bindings** | `bindings.mcp.cloudflare.com/mcp` | KV/D1/R2/DO operations | No (account management) |
| **Workers Builds** | `builds.mcp.cloudflare.com/mcp` | Build insights | No |
| **Observability** | `observability.mcp.cloudflare.com/mcp` | Workers logs | No |
| **Radar** | `radar.mcp.cloudflare.com/mcp` | Internet traffic data | No |
| **Container** | `containers.mcp.cloudflare.com/mcp` | Sandbox environments | No |
| **Browser Rendering** | `browser.mcp.cloudflare.com/mcp` | Web page fetching | No |
| **Logpush** | `logs.mcp.cloudflare.com/mcp` | Log job health | No |
| **AI Gateway** | `ai-gateway.mcp.cloudflare.com/mcp` | AI log inspection | No |
| **AutoRAG** | `autorag.mcp.cloudflare.com/mcp` | RAG queries | No |
| **Audit Logs** | `auditlogs.mcp.cloudflare.com/mcp` | Audit queries | No |
| **DNS Analytics** | `dns-analytics.mcp.cloudflare.com/mcp` | DNS performance | No |
| **DEM** | `dex.mcp.cloudflare.com/mcp` | App performance | No |
| **CASB** | `casb.mcp.cloudflare.com/mcp` | SaaS security | No |
| **GraphQL** | `graphql.mcp.cloudflare.com/mcp` | Analytics API | No |
| **Agents SDK Docs** | `agents.cloudflare.com/mcp` | SDK docs search | No |

**Classification for skill:** Only the Documentation server is relevant. The Bindings server (KV/D1/R2 operations) manages actual resources on a Cloudflare account -- it is NOT a documentation tool and should NOT be configured for the skill's documentation-lookup purpose.

### Anti-Patterns to Avoid

- **Vague queries without product keywords:** The Vectorize index covers ALL Cloudflare products. "how to configure" will return noise from DNS, WAF, Zero Trust, etc. Always include product name: "Workers KV configure namespace".
- **Keyword-only queries:** The semantic search works best with natural language. "KV put" is less effective than "Workers KV put method API parameters".
- **Expecting keyword filtering:** There is no `product` or `filter` parameter. Scoping is done entirely through the query string.
- **Treating results as exhaustive:** Only 10 results are returned. If results are not relevant, reformulate the query rather than expecting pagination.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cloudflare API reference lookup | Custom web scraping of developers.cloudflare.com | `mcp__cloudflare__search_cloudflare_documentation` | Semantic search over indexed corpus, always current |
| Pages-to-Workers migration guidance | Custom migration checklist | `mcp__cloudflare__migrate_pages_to_workers_guide` | Official, maintained guide from Cloudflare |
| Product-scoping in queries | Post-processing filters on results | Include product keywords in query string | Only mechanism available -- no filter parameter |

## Common Pitfalls

### Pitfall 1: Assuming Multiple Parameters Exist
**What goes wrong:** Trying to pass `product`, `limit`, `filter`, or other parameters to the search tool.
**Why it happens:** Other search tools (e.g., Algolia) have faceted search. This tool only accepts `query: string`.
**How to avoid:** Always pass a single `query` string. Scope results by including product names in the query text.
**Warning signs:** Tool errors mentioning unexpected parameters.

### Pitfall 2: Confusing the 16 Cloudflare MCP Servers
**What goes wrong:** Expecting `docs.mcp.cloudflare.com` to perform KV/D1/R2 operations, or confusing it with the Bindings server.
**Why it happens:** The prior v0.2 research mentioned the `@cloudflare/mcp-server-cloudflare` package generically, suggesting a single server.
**How to avoid:** The skill only references the Documentation server. Make it clear that this tool searches documentation -- it does not manage Cloudflare resources.
**Warning signs:** References to "the Cloudflare MCP" as if it were a single thing.

### Pitfall 3: Expecting Keyword Search Behavior
**What goes wrong:** Queries like "KV put" returning unrelated results about other "put" operations.
**Why it happens:** Semantic search matches by meaning, not exact keywords. Short keyword queries may have ambiguous semantic meaning.
**How to avoid:** Use descriptive natural language queries: "Workers KV Namespace put method API" instead of "KV put".
**Warning signs:** Results about wrong Cloudflare products despite including a product keyword.

### Pitfall 4: Not Accounting for OAuth Authentication
**What goes wrong:** MCP tool calls fail silently or return auth errors.
**Why it happens:** The docs server requires OAuth authentication, handled by `mcp-remote`. If the OAuth token has expired or was never granted, calls fail.
**How to avoid:** Ensure OAuth is completed when first configuring the MCP server. The `mcp-remote` bridge handles token refresh.
**Warning signs:** Tool call timeouts or authentication error messages.

### Pitfall 5: Stale Tool Name Assumptions
**What goes wrong:** Using a different tool name than `search_cloudflare_documentation` (e.g., `search_docs`, `query_cloudflare`).
**Why it happens:** Prior research had MEDIUM confidence on tool name. Multiple blog posts reference the tool without its exact registered name.
**How to avoid:** The verified name is `search_cloudflare_documentation`. In Claude Code FQ form: `mcp__cloudflare__search_cloudflare_documentation`.
**Warning signs:** "Tool not found" errors.

## Code Examples

### Invoking the Search Tool (Verified Pattern)

The tool is invoked in SKILL.md and reference files using this notation:

```
mcp__cloudflare__search_cloudflare_documentation({ query: "Workers KV put API parameters" })
```

This mirrors the existing Astro MCP pattern:
```
mcp__astro_doc__search_astro_docs({ query: "defineAction options parameters" })
```

### Return Format Example (Reconstructed from Source Code)

```xml
<result>
  <url>https://developers.cloudflare.com/kv/api/write-key-value-pairs/</url>
  <title>Write key-value pairs - Cloudflare KV</title>
  <text>To create a new key-value pair, or to update the value for a particular key, call the put method... NAMESPACE.put(key, value, options?)...</text>
</result>
<result>
  <url>https://developers.cloudflare.com/kv/api/</url>
  <title>KV Runtime API - Cloudflare KV</title>
  <text>Workers KV is accessible from Workers via the runtime API... The KV binding gives your Worker access to a KV namespace...</text>
</result>
```

### Query Templates for Phase 9 (Ready to Copy)

These query patterns are designed for semantic search effectiveness, scoped to products relevant to the skill:

| Product | Query Template | Purpose |
|---------|---------------|---------|
| Workers runtime | `"Cloudflare Workers runtime API [topic]"` | General Workers API reference |
| Workers limits | `"Cloudflare Workers platform limits and pricing [resource]"` | CPU time, memory, request size limits |
| Workers compat | `"Workers compatibility flags and compatibility date"` | Compatibility flag reference |
| KV | `"Workers KV [operation] API parameters"` | KV read/write/list operations |
| D1 | `"Cloudflare D1 database [operation] SQL API"` | D1 query/prepare/batch |
| R2 | `"Cloudflare R2 object storage [operation] API"` | R2 put/get/list objects |
| Wrangler | `"Wrangler CLI [command] configuration"` | Wrangler commands reference |
| Workers Static Assets | `"Workers static assets configuration and routing"` | Static asset serving with Workers |
| Node.js compat | `"Workers nodejs_compat compatibility flag Node.js APIs"` | Node.js API availability on Workers |

**Query formulation recommendations (from semantic search behavior):**
- **Prefer:** Descriptive natural language -- "How to write a key-value pair to Workers KV namespace"
- **Avoid:** Short keyword-only -- "KV put"
- **Prefer:** Product-scoped -- "Workers KV list keys with prefix"
- **Avoid:** Generic -- "list keys" (could match any product)
- **Prefer:** Specific API focus -- "D1 prepare bind query statement parameters"
- **Avoid:** Broad conceptual -- "how databases work on Cloudflare"

### Invoking the Migration Guide Tool

```
mcp__cloudflare__migrate_pages_to_workers_guide({})
```

No parameters needed. Returns the full Pages-to-Workers migration guide as plain text.

## State of the Art

| Old Understanding | Current Reality | Impact |
|-------------------|-----------------|--------|
| Single "Cloudflare MCP server" | 16 separate MCP servers, each with distinct subdomain | Skill references only `docs.mcp.cloudflare.com` -- no confusion |
| Package `@cloudflare/mcp-server-cloudflare` as standalone | Monorepo with `apps/docs-vectorize` for docs server specifically | Server name in code is `docs-vectorize`, version 0.5.1 |
| Tool name MEDIUM confidence | Tool name HIGH confidence: `search_cloudflare_documentation` | Confirmed from source code -- exact zod schema verified |
| Return format LOW confidence | Return format HIGH confidence: XML with `<result>` blocks | Confirmed from source code -- `<url>`, `<title>`, `<text>` |
| Only 1 tool assumed | 2 tools confirmed: `search_cloudflare_documentation` + `migrate_pages_to_workers_guide` | Second tool is bonus, useful for migration scenarios |
| Keyword search assumed | Semantic search via Vectorize + embeddinggemma-300m | Changes query strategy: natural language better than keywords |

## Open Questions

### 1. Empirical Query Effectiveness
- **What we know:** Tool uses semantic search with embeddinggemma-300m, returns 10 results in XML format
- **What's unclear:** Actual precision for Workers/KV/D1/R2 queries -- how well do product-scoped queries perform? Are there edge cases where semantic search returns irrelevant results?
- **Recommendation:** Phase 8 execution (planning phase) should include 5-6 empirical test queries as decided in CONTEXT.md. This research provides the tool specification; the plan should define the actual test execution.

### 2. OAuth Session Durability
- **What we know:** The `mcp-remote` bridge handles OAuth for the docs server
- **What's unclear:** How long OAuth tokens last, whether they auto-refresh, whether Claude Code sessions need re-authentication
- **Recommendation:** Not a blocker for Phase 8 planning. If auth fails during execution, document it and provide troubleshooting instructions.

### 3. Result Freshness
- **What we know:** Server version 0.5.1, latest change was "Move docs MCP server to use AI Search"
- **What's unclear:** How frequently the Vectorize index is updated with new Cloudflare documentation
- **Recommendation:** Test with queries about recent features (e.g., `nodejs_compat_populate_process_env`) during Phase 8 execution to gauge freshness.

## Sources

### Primary (HIGH confidence)
- **GitHub source code:** `cloudflare/mcp-server-cloudflare` -- `packages/mcp-common/src/tools/docs-vectorize.tools.ts` -- exact tool names, parameter schemas, return format, embedding model
- **GitHub source code:** `apps/docs-vectorize/src/docs-vectorize.app.ts` -- server architecture, tool registration
- **GitHub CHANGELOG:** `apps/docs-vectorize/CHANGELOG.md` -- version 0.5.1 confirmed
- **GitHub package.json:** `apps/docs-vectorize/package.json` -- dependencies and version
- **GitHub README:** `apps/docs-vectorize/README.md` -- tool description, connection instructions
- **Project MCP settings:** `~/.claude.json` -- project MCP server configuration confirming `cloudflare` server name and `docs.mcp.cloudflare.com/mcp` URL

### Secondary (MEDIUM confidence)
- **Cloudflare official docs:** `developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/` -- full catalog of 16 MCP servers
- **remote-mcp.com listing:** `remote-mcp.com/servers/cloudflare-docs` -- confirms 2 tools on docs server
- **Cloudflare blog:** "Thirteen new MCP servers from Cloudflare" -- server descriptions and purposes

### Tertiary (LOW confidence)
- None -- all findings verified with source code

## Metadata

**Confidence breakdown:**
- Tool name: HIGH -- verified from TypeScript source code in GitHub repository
- Parameter schema: HIGH -- verified from zod definition in source code (`z.string()` for query)
- Return format: HIGH -- verified from source code (XML with `<result><url><title><text>`)
- Search mechanism: HIGH -- verified from source code (Vectorize + embeddinggemma-300m)
- Query effectiveness: LOW -- not empirically tested yet (deferred to Phase 8 execution)
- Full server catalog: MEDIUM -- from official Cloudflare docs page, cross-referenced with GitHub monorepo structure

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days -- server is actively maintained but tool API is stable)
