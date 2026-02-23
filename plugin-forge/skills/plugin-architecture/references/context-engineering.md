<jit_loading>
## JIT (Just-in-Time) Loading

Load context at the exact moment it becomes necessary, not upfront.

### Mechanism

Maintain lightweight identifiers (file paths, stored queries, links) and use these references to dynamically load data at execution time via tools.

Three phases:
1. **Indexing** — load minimal index (500-5000 tokens): tool names, short descriptions, trigger keywords
2. **Detection** — Claude analyzes user prompts for trigger keywords
3. **Loading** — only relevant complete definitions are loaded

### Plugin application

Skills implement JIT natively via the 4-layer architecture:
- Layer 1 (metadata) is the index — always loaded, ~50-100 tokens per skill
- Layer 2 (body) loads on match — Claude reads SKILL.md when description matches
- Layer 3 (references) loads on demand — Claude reads specific XML sections
- Layer 4 (commands) loads on invoke — user explicitly triggers

### Trigger table pattern for CLAUDE.md

Map keywords to specific skills or files Claude should load:

```markdown
## Context routing
- Astro, .astro, wrangler → load astro-cloudflare skill
- Article, writing, draft → load article-writing skill
- Plugin design, architecture → load plugin-architecture skill
```

### Benchmarks

- Tool selection accuracy: 49% -> 74% with JIT on Opus 4
- MCP configurations: 72K tokens -> 8.7K tokens initial (85% reduction)
- Skill metadata only: ~100 tokens per skill vs ~2000 tokens full body

### Common mistakes

- Embedding full documentation in CLAUDE.md instead of using pointers
- Loading all @imports aggressively at session start
- Hook configurations that re-inject context on every tool call
</jit_loading>

<progressive_disclosure>
## Progressive Disclosure for Plugins

Reveal complexity gradually rather than all at once.

### Three-level architecture

| Level | Content | Token cost | When loaded |
|-------|---------|------------|-------------|
| **L1: Metadata** | name + description | ~50-100 per skill | Session start |
| **L2: Body** | SKILL.md content | ~500-2000 | On match |
| **L3: References** | External files | 0 until needed | On demand |

### Design implications

**SKILL.md body** should contain:
- Decision matrices (quick lookup, high reuse)
- Critical rules that apply every time the skill activates
- Reference file index (so Claude knows what's available)

**Reference files** should contain:
- Detailed explanations of each concept
- Extended examples and code patterns
- Anti-patterns and troubleshooting
- Content that's needed for specific sub-tasks, not every activation

### Token budget example

A well-designed standard plugin:
```
Inactive: ~100 tokens (metadata only)
Active, simple query: ~600 tokens (metadata + body)
Active, deep query: ~2500 tokens (metadata + body + 1 reference section)
Active, complex task: ~5000 tokens (metadata + body + 2-3 reference sections)
```

### Monorepo pattern

Place subdirectory CLAUDE.md files that load on-demand:
```
project/
  CLAUDE.md              # Always loaded (~100 lines)
  frontend/CLAUDE.md     # Loaded when working in frontend/
  backend/CLAUDE.md      # Loaded when working in backend/
```
</progressive_disclosure>

<context_budget_rules>
## Context Budget Rules

### The 60% rule

Never exceed 60% context utilization. Reserve 40% for:
- Reasoning and tool call planning
- Unexpected file reads during execution
- Error handling and recovery loops

### Budget allocation targets

| Consumer | Target | Max |
|----------|--------|-----|
| System prompt + tools | 10-15% | 20% |
| CLAUDE.md (all levels) | 3-5% | 10% |
| Installed skill metadata | 1-2% | 5% |
| Active skill body | 1-3% | 5% |
| Reference files loaded | 2-5% | 10% |
| Session history | 30-40% | 50% |

### Plugin author rules

1. **Metadata budget:** Description under 1024 chars. Aim for 200-400 chars that maximize keyword density.
2. **Body budget:** SKILL.md under 200 lines. Move anything not needed every activation to references.
3. **Reference budget:** No per-file limit, but use XML sections (300-600 lines per section) so Claude loads selectively.
4. **Command budget:** No concern — only one command active at a time, and only when invoked.

### Monitoring

Use `/context` to see breakdown: system instructions, CLAUDE.md, environment, MCP tools, session history. Act at 70% — don't wait for auto-compaction at 92%.

### CLAUDE.md sizing

| Size | Quality | Risk |
|------|---------|------|
| <60 lines | Optimal adherence | May miss edge cases |
| 60-150 lines | Good adherence | Sweet spot for most projects |
| 150-300 lines | Declining adherence | Use progressive disclosure |
| >300 lines | Poor adherence | Instructions fight each other |
</context_budget_rules>

<subagent_isolation>
## Subagent Isolation for Context Preservation

### When to delegate to subagents

- Task produces verbose output (test results, logs, large file analysis)
- Research requires reading dozens of files
- Task is parallelizable with no dependencies on main context
- Domain needs restricted permissions (read-only audit)

### Architecture

Each subagent gets an independent 200K token context window. Only a structured summary returns to the main context (1000-2000 tokens typically).

### Communication pattern

Prefer file-based coordination over transcript dumping:
```
Subagent writes results to:  .claude/cache/agents/<type>/
Main agent reads these files
```

This avoids exposing 70K+ tokens of subagent transcript in the main context.

### Plugin application

Commands can spawn agents via the `Task()` tool:
```markdown
---
description: Audit plugin quality
---
Use Task tool to spawn an audit agent:
- subagent_type: general-purpose
- prompt: "Read all files in the plugin directory and evaluate against quality checklist"
- The agent returns a structured report
```

### Anti-patterns

- **Over-isolation:** Hiding too much context from the main agent prevents holistic reasoning
- **Lead-Specialist rigidity:** Custom specialized agents with fixed roles. Prefer Master-Clone: the main agent delegates dynamically via Task()
- **No-spawn depth:** Subagents cannot spawn sub-subagents. Chain from the main agent instead.
</subagent_isolation>

<phase_based_context>
## Phase-Based Context Provision

### The Explore -> Plan -> Code -> Commit workflow

Structure work into phases with explicit context boundaries:

| Phase | Activities | Context strategy |
|-------|-----------|-----------------|
| **Explore** | Read files, use subagents for details | No code writing. Gather context only. |
| **Plan** | Extended thinking, save plan to .md | Use "think hard" / "ultrathink". Write plan to file. |
| **Code** | Implement with verification | Follow the plan. Check coherence iteratively. |
| **Commit** | Finalize, PR, documentation | Clean up. Update docs if needed. |

### Phase transitions

Between phases, use one of:
- `/clear` — full context reset (strongest isolation)
- Named sessions: `claude --session=planning` (separate context per activity)
- Document & Clear: save state to .md, clear, resume from file

### The Document & Clear pattern

1. Claude documents plan/progress in a .md file
2. `/clear` resets context
3. New session reads the .md and continues

This enables handling tasks that exceed a single context window.

### Plugin design implication

Complex commands (like `/scd:design`) should structure their output in phases:
1. Research phase (read existing code, understand constraints)
2. Decision phase (present options, get user input)
3. Output phase (generate the design document)

Each phase can use `/clear` between them for long-running sessions.
</phase_based_context>

<anti_patterns>
## Context Engineering Anti-Patterns

### 1. The bloated CLAUDE.md
Loading thousands of lines of documentation into every session. Keep under 100-150 lines. Use progressive disclosure for the rest.

### 2. The eager loader
Referencing files with `@docs/architecture.md` in CLAUDE.md embeds their full content every session. Use pointers ("when working on auth, read docs/auth-architecture.md") instead.

### 3. The MCP tool hoarder
Registering many MCP tools consumes 8-30% of context just by existing. Use `defer_loading: true` or limit to essential tools.

### 4. The context rotter
Running long sessions without clearing. Context becomes "poisoned" — Claude contradicts itself and forgets project patterns. Clear between distinct tasks.

### 5. The auto-compaction truster
Relying on auto-compaction at 92%. It's opaque and often loses important context. Compact manually at breakpoints using `/compact` at 70%.

### 6. The deep reference chain
SKILL.md -> file A -> file B -> actual content. Keep references one level deep from SKILL.md.

### 7. The duplicate instructor
Same information in CLAUDE.md, skill body, and reference files. Each location has a different purpose — metadata for routing, body for decisions, references for details.
</anti_patterns>
