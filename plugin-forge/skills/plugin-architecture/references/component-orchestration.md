<interaction_matrix>
## Component Interaction Matrix

How plugin components connect to each other.

| Source -> Target | Mechanism | Use case |
|------------------|-----------|----------|
| Command -> Subagent | `Task()` tool in body | Parallel research, isolated heavy computation |
| Command -> Hook | `hooks:` field in YAML frontmatter | Temporary validation during workflow |
| Command -> Skill | Natural language reference | Command leverages skill knowledge |
| Skill -> Reference | Relative path link | Deep-dive documentation |
| Skill -> Hook | Hooks scoped in SKILL.md | Auto-cleanup after skill deactivation |
| Hook -> Claude | Exit codes + JSON stdout | Conditional blocking (exit 2 = block + feedback) |
| Agent -> Skill | `skills:` field in agent config | Inject domain expertise into agent |
| CLAUDE.md -> Skill | Trigger table mapping | Route keywords to skills |
| MCP -> Skill | Skill documents MCP usage patterns | Teach how to use external tools |

### Key principle

Components have a **natural hierarchy**:
```
CLAUDE.md (always on, universal rules)
  -> Skills (auto-activated, domain knowledge)
    -> Reference files (on-demand, deep details)
  -> Commands (user-triggered, explicit workflows)
    -> Agents (isolated execution, delegated tasks)
  -> Hooks (event-driven, deterministic validation)
  -> MCP (external connectivity)
```

Each level loads more context but less frequently.
</interaction_matrix>

<skill_plus_commands>
## Pattern: Skill + Commands

The standard plugin architecture. Skill provides domain knowledge, commands provide explicit workflows.

### Structure

```
my-plugin/
  skills/domain-name/
    SKILL.md           # Domain knowledge, auto-activated
    references/        # Deep documentation
  commands/
    action-a.md        # Explicit workflow using domain knowledge
    action-b.md        # Another workflow
```

### How it works

1. User asks a question about the domain -> skill auto-activates, provides knowledge
2. User invokes `/plugin:action-a` -> command loads, leverages skill knowledge for structured workflow
3. Command can reference skill concepts without re-explaining them

### Design rules

- **Skill handles knowledge**, commands handle workflows
- Commands should assume the skill is already loaded (Claude loads it when relevant)
- Don't duplicate skill content in commands — reference it
- Each command should have a clear human/AI ratio and specific output format

### Example: astro-skill

```
Skill: astro-cloudflare
  Knowledge: rendering modes, hydration, Content Layer, bindings
  Decision matrices, critical rules, MCP routing

Commands:
  /astro:audit    -> Audit existing Astro project (uses skill knowledge)
  /astro:scaffold -> Generate project structure (uses skill conventions)
  /astro:debug    -> Debug Astro-specific issues (uses skill troubleshooting)
```
</skill_plus_commands>

<detection_workflow>
## Pattern: Detection + Workflow

Multiple skills detect different aspects. Commands orchestrate multi-skill analysis.

### Structure

```
my-plugin/
  skills/
    detector-a/SKILL.md    # Detects aspect A
    detector-b/SKILL.md    # Detects aspect B
    detector-c/SKILL.md    # Detects aspect C
  commands/
    scan.md                # Orchestrates all detectors
    phase-1.md             # Uses specific detectors
    phase-2.md             # Uses different detectors
```

### How it works

1. Each detector skill has a focused domain (vocabulary, structure, voice)
2. Commands specify which skills to activate: "Run detector-a and detector-b scans"
3. A master command orchestrates the full pipeline across all detectors

### Design rules

- Each detector should be independently useful (not just a sub-component)
- Detectors should have non-overlapping domains to avoid conflicts
- The orchestrating command specifies the order and aggregation of results
- Keep each detector small (<100 lines) since multiple may load simultaneously

### Example: article-writing

```
Skills (detectors):
  writing-voice       -> Editorial identity, banned vocabulary
  slop-vocabulary     -> LLM marker words (EN + FR catalogs)
  fausse-profondeur   -> Mechanical rhetorical patterns
  marqueurs-lexicaux  -> Statistical signature analysis
  structure-symetrique -> Document-level structural patterns

Commands (workflow):
  /braindump  -> Phase 1: Capture (no detectors)
  /structure  -> Phase 2: Organize
  /draft      -> Phase 3: Write
  /review     -> Phase 5: ALL detectors active simultaneously
  /polish     -> Phase 6: Surface cleanup
```
</detection_workflow>

<command_scoped_hooks>
## Pattern: Command-Scoped Hooks

Hooks defined in command frontmatter are automatically cleaned up after command execution.

### Mechanism

```yaml
---
description: Deploy to staging with validation
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-deploy.sh"
          once: true
---
```

The `once: true` flag ensures the hook runs only once per session — useful for expensive initialization.

### Use cases

| Scenario | Hook type | Matcher |
|----------|-----------|---------|
| Lint after each file write | PostToolUse | `Write\|Edit` |
| Validate before deployment | PreToolUse | `Bash` |
| Type-check before commit | PreToolUse | `Bash(git commit)` |
| Clean up temp files on stop | Stop | (none) |

### Design rules

- Use command-scoped hooks for temporary validation specific to one workflow
- Use project-level hooks (in `hooks.json`) for universal validation
- Prefer "block at commit" over "block at write" — let Claude work freely, validate the result
- Exit code 2 blocks the operation and sends stderr as feedback to Claude

### Anti-pattern: blocking writes

Blocking every Write/Edit operation with validation hooks confuses and frustrates the agent. It can't understand why operations fail mid-plan. Instead, let it write freely and validate at boundaries (commit, deploy, publish).
</command_scoped_hooks>

<agent_delegation>
## Pattern: Agent Delegation

Commands spawn agents via `Task()` for isolated heavy computation.

### When to delegate

| Signal | Delegate? | Why |
|--------|-----------|-----|
| Step produces >5000 tokens of output | Yes | Isolate verbose results |
| Step reads >10 files | Yes | Prevent context pollution |
| Step is parallelizable | Yes | Run multiple agents simultaneously |
| Step needs restricted tools | Yes | Agent can have limited `allowed-tools` |
| Step needs main context awareness | No | Agent won't see conversation history |
| Step is a quick lookup | No | Overhead > benefit |

### Implementation in commands

```markdown
---
description: Full plugin audit
---
## Phase 1: Gather data (delegated)
Use Task tool to spawn analysis agents in parallel:
- Agent 1: Read all skill files, evaluate descriptions
- Agent 2: Read all commands, check frontmatter
- Agent 3: Count tokens, estimate context budget

## Phase 2: Synthesize (main context)
Combine agent reports into a unified audit report.
Present findings to user with severity ratings.
```

### Communication protocol

Agents should write structured output, not prose:
```
## Findings
| File | Issue | Severity |
|------|-------|----------|
| SKILL.md | Description too vague | Critical |
| audit.md | Missing argument-hint | Minor |
```

### Master-Clone vs Lead-Specialist

**Prefer Master-Clone:** The main agent (with full CLAUDE.md context) decides dynamically what to delegate. Each subagent is general-purpose, receiving specific instructions per task.

**Avoid Lead-Specialist:** Pre-defined specialized agents with rigid roles. This creates gatekeeping where the main agent loses holistic reasoning capability.
</agent_delegation>

<lifecycle_patterns>
## Component Lifecycle Patterns

### Skill lifecycle

```
Session start
  -> Load metadata (name + description) for all skills
  -> User prompt arrives
  -> Claude matches description keywords
  -> Load SKILL.md body (if match confidence high enough)
  -> Claude references specific sections
  -> Load reference files on demand (via Read tool)
Session end
  -> All skill context discarded
```

### Command lifecycle

```
User types /command [args]
  -> Load command .md file
  -> $ARGUMENTS replaced with user input
  -> Command-scoped hooks activated (if any in frontmatter)
  -> Claude executes command instructions
  -> Command-scoped hooks cleaned up
  -> Command context remains in session history
```

### Hook lifecycle

```
Event fires (PreToolUse, PostToolUse, Stop, etc.)
  -> Matcher evaluated against tool name/args
  -> If match: execute hook script/command
  -> Exit code determines outcome:
     0 = success (proceed)
     1 = error (unexpected, logged)
     2 = block (prevent operation, stderr sent to Claude)
  -> Prompt-based hooks: stdout injected as assistant context
```

### Agent lifecycle

```
Task() called from main context
  -> New 200K context window created
  -> Agent prompt + inherited CLAUDE.md loaded
  -> Agent executes autonomously
  -> Agent returns summary to main context
  -> Agent context discarded
```
</lifecycle_patterns>

<anti_patterns>
## Orchestration Anti-Patterns

### 1. The monolithic command
A single command that tries to do everything: research, plan, implement, test, deploy. Break into separate commands per phase, or let the skill handle knowledge and the command handle one specific workflow.

### 2. The REST API mirror (MCP)
Creating one MCP tool per API endpoint (`read_user`, `update_user`, `delete_user`). Instead, create high-level tools (`manage_user_lifecycle`) that encapsulate common workflows. Migrate stateless tools to simple CLIs; reserve MCP for stateful environments.

### 3. The custom slash command maze
Creating 15+ commands with a complex naming taxonomy that users must memorize. The point of an AI agent is to understand natural language. Use 3-5 commands max, and let the skill handle routing for everything else.

### 4. The over-specialized agent
Defining rigid agent personas (PM agent, Architect agent, QA agent) that can't adapt. The main agent with full context makes better decisions about delegation than a pre-defined hierarchy.

### 5. The hook-at-write blocker
Blocking every Write/Edit with validation hooks. This confuses the agent mid-execution. Block at commit boundaries instead — let the agent work freely, validate the output.

### 6. The context duplicator
Same instructions in CLAUDE.md, skill body, command body, and agent prompt. Each component has a different loading strategy. Put the information where it belongs:
- Always needed? -> CLAUDE.md
- Needed for domain questions? -> Skill body
- Needed for deep dives? -> Reference files
- Needed for specific workflow? -> Command body
- Needed for isolated execution? -> Agent prompt
</anti_patterns>
