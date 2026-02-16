# Feature Landscape: v0.2 MCP Cloudflare Documentation Integration

**Domain:** Claude Code Skill MCP integration (Cloudflare documentation server for Astro/Workers skill)
**Researched:** 2026-02-03
**Overall Confidence:** MEDIUM (Cloudflare MCP server capabilities based on training data + project context analysis; no live web verification available)

---

## Context

v0.1 established the Astro MCP boundary pattern: SKILL.md has a `## MCP Integration` section declaring `mcp__astro_doc__search_astro_docs` with explicit "Use MCP when" / "Use THIS SKILL when" lists. Reference files contain no MCP callouts -- all MCP guidance lives in SKILL.md.

v0.2 adds a second MCP tool: `search_cloudflare_documentation` from a Cloudflare docs MCP server. The challenge is determining:
1. Which Cloudflare topics are relevant for Astro/Workers development
2. Which topics the skill already covers well enough (keep as skill knowledge)
3. Which topics should delegate to the MCP for authoritative, current detail
4. What query patterns help users get useful results from the MCP

### Existing Cloudflare Coverage in Skill (v0.1)

The skill already has substantial Cloudflare content across multiple files:

| File | Cloudflare Topics Covered | Approx. Lines |
|------|---------------------------|---------------|
| `cloudflare-platform.md` | Bindings (KV/D1/R2), Workers limits, Node.js compat, env vars, wrangler config, platformProxy | 234 |
| `build-deploy.md` | Deployment target, wrangler-action CI, .assetsignore, adapter options, CLI flags, debugging | 257 |
| `data-content.md` | SSR data fetching with `cf.cacheTtl`, bindings in Actions | 291 |
| `security-advanced.md` | Secrets management on Workers, `locals.runtime.env` patterns | 342 |
| `typescript-testing.md` | Cloudflare binding types, `worker-configuration.d.ts`, wrangler types | ~43 mentions |
| `SKILL.md` | Critical Rules #6/#7, MCP boundary, troubleshooting index | 257 |

**Total Cloudflare-related content: ~255 mentions across 11 files.** This is NOT thin coverage. The skill's Cloudflare layer is already opinionated and substantial.

---

## Table Stakes

Features the MCP Cloudflare integration MUST have or it adds no value.

### TS-1: MCP Boundary Declaration in SKILL.md

| Aspect | Detail |
|--------|--------|
| **Why Expected** | Without explicit boundary instructions, Claude will not know when to use `search_cloudflare_documentation` vs the skill's existing Cloudflare content. The skill already has dense Cloudflare coverage -- adding MCP without boundary creates confusion over which source to consult. |
| **Complexity** | Low |
| **What** | Add a second tool entry in the `## MCP Integration` section alongside the existing Astro MCP, with clear "Use Cloudflare MCP when" / "Use THIS SKILL when" lists. |
| **Dependency** | Existing `## MCP Integration` section in SKILL.md (lines 82-98) |
| **Notes** | Mirror the exact pattern used for `mcp__astro_doc__search_astro_docs`. Use the fully qualified tool name `mcp__cloudflare_docs__search_cloudflare_documentation` (exact server name depends on user's MCP config -- document this). |

### TS-2: Topic Routing Table (Skill vs MCP Responsibility)

| Aspect | Detail |
|--------|--------|
| **Why Expected** | The skill covers Cloudflare topics at the intersection with Astro (bindings access patterns, adapter config, Workers limits for Astro). The MCP covers ALL Cloudflare documentation. Without a routing table, Claude may redundantly search MCP for topics already in the skill, or fail to search for topics only the MCP covers. |
| **Complexity** | Medium |
| **What** | A mapping table in SKILL.md or cloudflare-platform.md that routes topics to the right source. See "Topic Mapping" section below for full analysis. |
| **Dependency** | TS-1 (boundary must exist first) |
| **Notes** | This is the core intellectual contribution of v0.2 -- it is NOT just "add MCP tool name." It is classifying 20+ Cloudflare documentation areas into skill-owned vs MCP-delegated. |

### TS-3: Query Pattern Templates for Cloudflare MCP

| Aspect | Detail |
|--------|--------|
| **Why Expected** | MCP documentation search tools work best with specific queries. Vague queries like "Cloudflare Workers" return noisy results. Query templates help Claude formulate effective searches. The existing Astro MCP integration lacks query templates (a gap from v0.1). |
| **Complexity** | Low |
| **What** | A set of 8-12 recommended query patterns that map common user needs to effective MCP search strings. See "Query Patterns" section below. |
| **Dependency** | TS-1 |
| **Notes** | Include these in SKILL.md or as part of the boundary section. Keep concise -- Claude internalizes patterns, not reference manuals. |

### TS-4: MCP Callouts in Cloudflare Reference Files

| Aspect | Detail |
|--------|--------|
| **Why Expected** | When Claude reads a reference file section (e.g., Workers limits in cloudflare-platform.md), it needs to know where deeper information lives. Without callouts, Claude either makes do with the skill's summary or fails to look further. |
| **Complexity** | Low |
| **What** | Add "For detailed API reference, use `search_cloudflare_documentation`" callouts at strategic points in reference files where the skill provides decision guidance but not API details. |
| **Dependency** | TS-1, TS-2 (must know WHICH topics to delegate) |
| **Notes** | v0.1 reference files have ZERO MCP callouts (verified by grep). The Astro MCP callouts also live only in SKILL.md. For v0.2, adding targeted callouts in reference files is an evolution of the pattern. Limit to 1-2 per reference file to avoid noise. |

---

## Differentiators

Features that make this integration better than simply having the MCP tool available.

### D-1: Cloudflare Topic Scope Filter (Relevance Boundary)

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | The Cloudflare MCP covers 50+ product areas (Workers, Pages, R2, D1, KV, Durable Objects, AI, Zero Trust, Access, Magic Transit, Spectrum, CDN, DNS, Registrar, Stream, Images, Calls, Email Routing, Zaraz, Web Analytics, Turnstile, etc.). For an Astro/Workers freelance skill, maybe 15-20 are relevant. Telling Claude "do NOT search for Zero Trust configuration via MCP" prevents wasted context and hallucinated advice about products the user does not use. |
| **Complexity** | Low |
| **What** | An explicit "Cloudflare Products in Scope" and "Out of Scope" list that constrains when Claude should invoke the Cloudflare MCP. |
| **Dependency** | TS-1, TS-2 |
| **Notes** | This is unique to a skill integration -- bare MCP has no concept of scope filtering. The skill adds value by curating which subset of Cloudflare docs is relevant. |

### D-2: Enriched Grep Hints for MCP Navigation

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | v0.1 has 102 grep patterns for navigating reference files. v0.2 should add grep patterns specifically for Cloudflare-MCP-adjacent content (e.g., patterns that lead to sections with MCP callouts). This helps Claude discover MCP delegation points without reading entire files. |
| **Complexity** | Low |
| **What** | Add 5-10 new grep patterns to SKILL.md's Reference Navigation section for Cloudflare MCP touchpoints. |
| **Dependency** | TS-4 (callouts must exist for grep to find them) |
| **Notes** | Example: `grep -n "search_cloudflare_documentation" references/cloudflare-platform.md` to find all MCP delegation points. |

### D-3: Dual-MCP Coordination Pattern

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | Some questions span both Astro and Cloudflare (e.g., "How do I configure Astro sessions with Cloudflare KV?" or "What are the limits of R2 when used with Astro image optimization?"). The skill should teach Claude when to query BOTH MCPs and how to synthesize answers. |
| **Complexity** | Medium |
| **What** | A brief section in SKILL.md that addresses cross-MCP queries. Example: "For Astro adapter configuration, use search_astro_docs. For Cloudflare binding configuration, use search_cloudflare_documentation. For their intersection (e.g., platformProxy behavior), check THIS SKILL first." |
| **Dependency** | TS-1, TS-2 |
| **Notes** | This is the highest-value differentiator. No individual MCP knows about the other. Only the skill can coordinate between them. |

### D-4: Cloudflare Error Code Reference with MCP Fallback

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | Cloudflare Workers produce specific error codes (1042, 522, 1101, etc.) that developers encounter. The skill's troubleshooting tables cover some (error 1042 = prerender issues), but the full set lives in Cloudflare docs. Adding a "For Cloudflare error codes not listed here, search_cloudflare_documentation" pattern enriches the debug command. |
| **Complexity** | Low |
| **What** | Extend the debug command's "No Match Found" section to suggest Cloudflare MCP alongside Astro MCP. Add common Cloudflare error codes to cloudflare-platform.md troubleshooting. |
| **Dependency** | TS-1, existing debug command |
| **Notes** | The debug slash command already suggests `mcp__astro_doc__search_astro_docs` as fallback. Extending to include Cloudflare MCP is straightforward. |

### D-5: Wrangler Configuration Deep Dive via MCP

| Aspect | Detail |
|--------|--------|
| **Value Proposition** | The skill's wrangler.jsonc template covers the common case (bindings, assets, compat flags). But wrangler has dozens of additional configuration fields (tail_consumers, mtls_certificates, workflows, analytics_engine_datasets, version_metadata, etc.). Teaching Claude to MCP-search for advanced wrangler config prevents the skill from bloating. |
| **Complexity** | Low |
| **What** | A callout in cloudflare-platform.md wrangler section: "For advanced wrangler.jsonc fields beyond this template, use search_cloudflare_documentation('wrangler configuration [field_name]')." |
| **Dependency** | TS-4 |
| **Notes** | Keeps the skill's wrangler template lean (common case) while providing a path to the full reference. |

---

## Anti-Features

Features to deliberately NOT build. These would dilute the skill's focus or duplicate MCP responsibility.

### AF-1: Do NOT Cover Non-Astro Cloudflare Products

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Zero Trust, Access, Magic Transit, Spectrum, CDN advanced rules, Argo Smart Routing, Load Balancing, Waiting Room, Bot Management | These products are enterprise infrastructure unrelated to building Astro sites for TPE/PME. Including them wastes skill space and creates false confidence that the skill covers topics it cannot properly address. | Explicitly list these as "Out of Scope" in the MCP boundary. If Claude encounters a question about them, it should state they are outside the skill's domain and suggest using the Cloudflare MCP or dashboard docs directly -- NOT attempt to answer from skill content. |

**Evidence:** Project context specifies "sites vitrine TPE/PME (800-5000 EUR) sur Cloudflare Workers." Enterprise products are irrelevant.

### AF-2: Do NOT Duplicate Cloudflare API Reference

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Documenting KV API methods (`get`, `put`, `delete`, `list` with all options), D1 SQL syntax, R2 API signatures, Workers AI model IDs | The Cloudflare MCP exists precisely for this. Duplicating API reference in the skill creates maintenance burden and staleness. The skill's value is knowing WHEN to use KV vs D1 vs R2, not the exact API signature. | Keep decision guidance in skill (KV vs D1 vs R2 matrix). Delegate API details to MCP: "For KV API options (metadata, expiration, list cursors), use search_cloudflare_documentation." |

**Evidence:** v0.1 established this principle for Astro docs (AF-5 in original FEATURES.md). Same principle applies to Cloudflare docs. The skill is the "savoir-faire" layer, not the reference manual.

### AF-3: Do NOT Add Cloudflare Dashboard Configuration

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Step-by-step Dashboard UI instructions (creating KV namespaces, configuring DNS, setting up custom domains) | Dashboard UIs change frequently. Screenshots become stale. Claude cannot interact with UIs anyway. | Provide wrangler CLI equivalents (which the skill already does: `wrangler kv:namespace create`, `wrangler secret put`). For Dashboard-specific tasks, delegate to MCP. |

**Evidence:** The skill is a coding assistant, not a Cloudflare admin guide.

### AF-4: Do NOT Create Separate Cloudflare-Only Reference Files

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Creating new files like `references/cloudflare-kv.md`, `references/cloudflare-d1.md`, `references/cloudflare-r2.md` | Fragments the skill's architecture. v0.1 deliberately consolidated Cloudflare content into `cloudflare-platform.md` as the single Cloudflare reference. Adding per-product files would break the orthogonal domain structure and create navigation confusion. | Keep `cloudflare-platform.md` as the single Cloudflare reference. Add MCP callouts within it for deep dives. |

**Evidence:** v0.1 FEATURES.md (AF-8) explicitly states: "All reference files at ONE level from SKILL.md." Adding per-product Cloudflare files violates this constraint.

### AF-5: Do NOT Teach Cloudflare Workers Development Without Astro

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Generic Workers patterns (Service Workers, module syntax, Durable Objects class implementation, Queues consumer patterns) that are not Astro-specific | The skill targets Astro on Cloudflare, not Cloudflare Workers generally. Generic Workers patterns would dilute the Astro-specific guidance and confuse scope. | Cover only the Workers patterns that intersect with Astro: bindings access via `locals.runtime.env`, platformProxy for dev, adapter configuration. For generic Workers development, delegate to MCP entirely. |

**Evidence:** Project constraint: "Focus exclusif Cloudflare" means Cloudflare-as-deployment-target-for-Astro, not Cloudflare-as-standalone-platform.

### AF-6: Do NOT Duplicate the Astro MCP Boundary Pattern Verbatim

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Copy-pasting the Astro MCP section structure without adapting for Cloudflare-specific needs | The Cloudflare MCP covers a broader, more diverse product surface than the Astro MCP (which covers one framework). A one-to-one copy would miss the need for product scoping (D-1) and cross-MCP coordination (D-3). | Use the same structural pattern (tool name, "Use MCP when", "Use SKILL when") but add Cloudflare-specific elements: product scope filter, query patterns, cross-MCP coordination note. |

---

## Topic Mapping: Skill vs MCP Responsibility

This is the core analysis. For each Cloudflare documentation area relevant to Astro/Workers development, classify whether the skill owns the topic (decision guidance, anti-patterns, integration patterns) or delegates to MCP (API reference, configuration details, product-specific deep dives).

### Topics the SKILL Owns (Do NOT Delegate to MCP)

These topics are at the Astro-Cloudflare intersection. The skill provides unique value that neither MCP can provide alone.

| Topic | Why Skill Owns It | Skill Location |
|-------|-------------------|----------------|
| Bindings access pattern (`locals.runtime.env`) | Astro-specific pattern, not in Cloudflare docs | cloudflare-platform.md |
| platformProxy configuration | Astro adapter feature, not standard Cloudflare | cloudflare-platform.md, build-deploy.md |
| `nodejs_compat` flags for Astro | Which flags needed specifically for Astro deps | cloudflare-platform.md |
| `.dev.vars` vs `.env` for Astro dev | Interaction between Astro env and Cloudflare env | cloudflare-platform.md |
| Image service selection on Workers | `'compile'` vs `'cloudflare'` vs `'passthrough'` | build-deploy.md, styling-performance.md |
| Workers limits impact on Astro SSR | How 128MB/CPU limits affect SSR rendering | cloudflare-platform.md |
| KV vs D1 vs R2 decision matrix | When to use which storage for Astro sites | cloudflare-platform.md |
| `wrangler.jsonc` template for Astro | Opinionated, Astro-ready config template | cloudflare-platform.md |
| Deployment workflow (astro build + wrangler) | Astro-specific build pipeline | build-deploy.md |
| Troubleshooting Astro-on-Cloudflare errors | Intersection errors (Error 1042, binding issues) | All reference troubleshooting tables |
| AsyncLocalStorage pattern for bindings | Astro middleware -> deep function access | cloudflare-platform.md |
| Sessions with KV on Cloudflare | `sessionKVBindingName` adapter option | build-deploy.md |
| Security headers via middleware vs _headers | Workers ignores _headers for dynamic routes | security-advanced.md |
| `wrangler types` -> `env.d.ts` pipeline | TypeScript integration specific to Astro | typescript-testing.md |

### Topics the MCP Should Own (Delegate via Callouts)

These topics are Cloudflare-product-specific. The skill provides enough guidance to make decisions, but API details should come from Cloudflare docs.

| Topic | Why Delegate | Query Pattern | Callout Location |
|-------|-------------|---------------|-----------------|
| KV API reference (get/put/delete/list options, metadata, expiration) | API surface is large, versioned | `"KV namespace API [method]"` | cloudflare-platform.md Bindings section |
| D1 SQL reference and limitations | D1-specific SQL dialect, limits | `"D1 database SQL [topic]"` | cloudflare-platform.md Bindings section |
| R2 API reference (multipart upload, presigned URLs) | Complex API, many options | `"R2 bucket API [operation]"` | cloudflare-platform.md Bindings section |
| Durable Objects class implementation | Complex pattern, not Astro-specific | `"Durable Objects [topic]"` | cloudflare-platform.md |
| Queues producer/consumer configuration | Advanced Workers feature | `"Queues [producer/consumer] configuration"` | cloudflare-platform.md |
| Workers AI model catalog and API | Rapidly changing model list | `"Workers AI [model/task]"` | NEW: mention in SKILL.md scope |
| Hyperdrive setup and configuration | Database proxy, not Astro-specific | `"Hyperdrive [topic]"` | cloudflare-platform.md |
| Wrangler CLI advanced commands | Full CLI reference too large for skill | `"wrangler [command] [subcommand]"` | build-deploy.md |
| Cloudflare DNS configuration | Not Astro-specific infrastructure | `"DNS records [type]"` | Not in skill (scope filter) |
| Custom domains setup | Dashboard/API task, not code | `"custom domain Workers"` | Not in skill (scope filter) |
| Cache API detailed reference | API surface beyond `cf.cacheTtl` basics | `"Cache API Workers [method]"` | data-content.md SSR section |
| Compatibility flags full reference | Skill covers Astro-critical ones; MCP for rest | `"compatibility flags [flag_name]"` | cloudflare-platform.md compat section |
| Service Bindings configuration | Advanced Workers topology | `"Service Bindings [topic]"` | cloudflare-platform.md limits section |
| Observability and logging | Workers-specific, not Astro | `"Workers observability [topic]"` | build-deploy.md debugging section |
| Tail workers and log push | Monitoring infrastructure | `"tail workers configuration"` | Not in skill (too advanced for TPE/PME) |

### Topics Entirely Out of Scope (Do NOT Search MCP For)

These Cloudflare products are irrelevant to Astro/Workers TPE/PME sites. The skill should tell Claude to NOT search for them.

| Product Area | Why Out of Scope |
|-------------|-----------------|
| Zero Trust / Access / Tunnel | Enterprise identity/access management |
| Magic Transit / Magic WAN | Enterprise network infrastructure |
| Spectrum | Non-HTTP protocol proxying |
| Argo Smart Routing | Enterprise traffic optimization |
| Load Balancing | Enterprise multi-origin |
| Waiting Room | High-traffic queuing system |
| Bot Management | Enterprise bot detection |
| WARP client | Consumer VPN product |
| Cloudflare for SaaS | Multi-tenant platform feature |
| Area 1 Email Security | Email security product |
| Cloudflare Images (separate from Workers) | Standalone image CDN product |
| Cloudflare Stream | Video streaming product |
| Cloudflare Calls | WebRTC product |
| Web3 / IPFS Gateway | Blockchain/distributed web |
| China Network | Regional compliance product |
| DDoS protection (advanced rules) | Enterprise security |

---

## Query Patterns for Cloudflare MCP

Effective queries help Claude extract useful information. These templates map user intent to MCP search strings.

### Storage API Queries

| User Need | MCP Query Template |
|-----------|-------------------|
| KV read/write with options | `"KV namespace get put options metadata expiration"` |
| D1 prepared statements and types | `"D1 database prepared statement bind parameter types"` |
| R2 upload with multipart | `"R2 multipart upload createMultipartUpload"` |
| R2 presigned URLs | `"R2 presigned URL getSignedUrl"` |
| D1 batch operations | `"D1 batch execute multiple statements transaction"` |
| KV list with cursor pagination | `"KV list keys cursor prefix limit"` |

### Workers Runtime Queries

| User Need | MCP Query Template |
|-----------|-------------------|
| Compatibility flag effects | `"Workers compatibility flags [flag_name] behavior"` |
| Workers memory/CPU limits | `"Workers platform limits CPU memory subrequests"` |
| Node.js module support status | `"Workers nodejs compatibility [module_name]"` |
| Cron triggers (scheduled) | `"Workers scheduled event cron trigger"` |
| WebSocket support in Workers | `"Workers WebSocket Durable Objects"` |
| Workers environment variables | `"Workers environment variables secrets wrangler"` |

### Deployment and Infrastructure Queries

| User Need | MCP Query Template |
|-----------|-------------------|
| Wrangler deploy options | `"wrangler deploy command options flags"` |
| Custom domains for Workers | `"Workers custom domains routes configuration"` |
| Workers analytics and metrics | `"Workers analytics metrics observability"` |
| Error codes meaning | `"Cloudflare error [code_number] Workers"` |

### Advanced Feature Queries

| User Need | MCP Query Template |
|-----------|-------------------|
| Durable Objects patterns | `"Durable Objects class constructor fetch alarm"` |
| Queues message handling | `"Queues producer consumer batch message"` |
| Workers AI inference | `"Workers AI run model [task_type]"` |
| Hyperdrive database proxy | `"Hyperdrive connection string PostgreSQL"` |
| Service Bindings between Workers | `"Service Bindings fetch between Workers"` |

---

## Feature Dependencies

```
TS-1 (MCP Boundary Declaration)
  |
  +--> TS-2 (Topic Routing Table)
  |      |
  |      +--> TS-4 (MCP Callouts in Reference Files)
  |      |      |
  |      |      +--> D-2 (Enriched Grep Hints)
  |      |      +--> D-5 (Wrangler Deep Dive via MCP)
  |      |
  |      +--> D-1 (Scope Filter)
  |
  +--> TS-3 (Query Pattern Templates)
  |
  +--> D-3 (Dual-MCP Coordination)
  |
  +--> D-4 (Error Code Reference + MCP Fallback)
```

**Critical path:** TS-1 -> TS-2 -> TS-4 -> D-2

---

## Implementation Sizing

### Changes to Existing Files

| File | Change Type | Estimated Lines Added |
|------|------------|----------------------|
| SKILL.md `## MCP Integration` | Extend with Cloudflare MCP tool entry, scope filter | +20-30 lines |
| SKILL.md Reference Navigation | Add MCP-related grep patterns | +5-8 lines |
| SKILL.md Troubleshooting Index | Add Cloudflare error codes row | +2-3 lines |
| `references/cloudflare-platform.md` | Add 2-3 MCP callouts in Bindings, Compat, Limits sections | +6-10 lines |
| `references/build-deploy.md` | Add 1-2 MCP callouts in Debugging, Wrangler sections | +4-6 lines |
| `references/data-content.md` | Add 1 MCP callout in SSR Data Fetching section | +2-3 lines |
| `references/security-advanced.md` | Add 1 MCP callout in Secrets section | +2-3 lines |
| `commands/astro/debug.md` | Extend "No Match" fallback to include Cloudflare MCP | +5-8 lines |

**Total estimated change:** ~50-70 lines added across 8 files. No new files needed.

### New Content Needed

None. This milestone modifies existing files only. No new reference files (AF-4).

---

## MVP Recommendation

### Phase 1: Core MCP Boundary (must ship)

1. **TS-1** -- MCP boundary declaration with Cloudflare MCP tool name
2. **TS-2** -- Topic routing table (skill vs MCP)
3. **D-1** -- Scope filter (in-scope vs out-of-scope Cloudflare products)
4. **TS-3** -- Query pattern templates (8-12 patterns)

This produces the SKILL.md changes (~30 lines) that enable Claude to use the Cloudflare MCP effectively with proper delegation.

### Phase 2: Reference File Callouts (high value, low risk)

5. **TS-4** -- MCP callouts in 4-5 reference files
6. **D-2** -- Enriched grep hints for MCP navigation
7. **D-3** -- Dual-MCP coordination pattern
8. **D-4** -- Debug command extension

This adds the callouts (~25 lines) across reference files that connect the skill's decision guidance to the MCP's API reference.

### Defer to Post-v0.2

- **D-5** (Wrangler deep dive) -- Only if users actually need advanced wrangler config frequently
- Any new reference files -- Maintain v0.1 architecture

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Topic mapping (skill vs MCP) | HIGH | Based on comprehensive analysis of existing skill content and Cloudflare product landscape from training data |
| Query patterns | MEDIUM | Based on training data knowledge of how MCP doc search tools work; not verified against actual Cloudflare MCP server behavior |
| MCP tool name format | LOW | Exact fully qualified tool name (`mcp__[server]__search_cloudflare_documentation`) depends on user's MCP server configuration; needs verification at implementation time |
| Scope filter (out-of-scope products) | HIGH | Based on clear project constraint: TPE/PME sites on Cloudflare Workers |
| Implementation sizing | HIGH | Based on direct analysis of existing file structure and content |

### Key Uncertainty

**The exact Cloudflare MCP tool name and behavior:** The project context references `search_cloudflare_documentation` as the tool name. The MCP server name (which forms the prefix `mcp__[server]__`) needs to be verified from the user's MCP configuration. This is a phase 1 implementation detail, not a research blocker.

**Query effectiveness:** The query patterns are based on how documentation search tools generally work. Actual Cloudflare MCP search may have different quality characteristics (e.g., better with product names, worse with API method names). Testing query patterns against the real MCP should be part of implementation validation.

---

## Sources

### Direct Analysis (HIGH confidence)
- Existing SKILL.md (257 lines) -- MCP boundary pattern, Critical Rules, decision matrices
- 11 reference files -- Cloudflare content distribution analysis (255 mentions across files)
- `docs/researchs/14 - Cloudflare Integration.md` -- Original Cloudflare research (610 lines)
- PROJECT.md -- v0.2 scope definition, constraints, out-of-scope items
- v0.1 FEATURES.md -- Established anti-features (AF-5, AF-8) that apply to v0.2

### Training Data (MEDIUM confidence)
- Cloudflare developer documentation structure (developers.cloudflare.com product areas)
- Cloudflare MCP documentation server capabilities
- MCP tool naming conventions for Claude Code

### Not Verified (LOW confidence)
- Exact Cloudflare MCP server tool names and parameters
- Query quality for specific search patterns
- Whether MCP returns structured vs unstructured results
