# scd-review

Automated code review pipeline on the current branch. Chained review+validation pipeline, `correction_prompt` for precise fixes, business context injection, model profiles, and inline-only PR/MR comments.

## Commands

### `/scd-review:init [--force]`

Bootstrap the code review environment. Detects `jq`, installs the `scd.sh` script dispatcher, and configures your platform (GitHub / GitLab / local). Migrates automatically from v0.x configurations.

Run this once before your first review. Use `--force` to re-probe the environment (bypasses the 24h cache).

### `/scd-review:run [--fix] [--post] [--context ...] [base-branch]`

The main pipeline. Runs a chained review+validation workflow on the current branch with zero human checkpoints (except optional mid-run and escalations).

**Flags:**

| Flag | Behavior |
|---|---|
| *(none)* | Same as `--fix` (default) |
| `--fix` | Apply corrections via fix-applier after review |
| `--post` | Post inline comments on the open PR/MR |
| `--fix --post` | Apply corrections, then post remaining observations |
| `--context ticket:PROJ-123` | Inject a ticket (GitHub/GitLab/Jira) as business context |
| `--context file:specs/auth.md` | Inject a local file as business context |
| `--context url:https://...` | Inject a URL as business context |

**Pipeline phases:**

1. **Context resolution** — resolves `--context` sources into a markdown file injected into reviewer agents
2. **Review** — `code-reviewer` / `test-reviewer` agents in a sliding window (max N parallel), produce observations with `correction_prompt`
3. **Validation (chained)** — `review-validator` starts on each file as soon as its review finishes (not a separate batch phase)
4. **Dispatch** — fix-applier applies corrections (`--fix`), or inline comments are posted (`--post`)
5. **Consolidated report** — verdict with escalation list and resolution summary

**Circuit breaker:** if the diff exceeds `pipeline.max_files_per_run` (default: 20), the most critical files are processed first and `continue` handles the rest. An optional checkpoint at 50% gives a progress summary.

### `/scd-review:followup`

Followup review after corrections. Finds the last completed session, computes the diff since closure, and classifies files:

- **Corrections** — files with blocking observations that were modified
- **Unaddressed** — files with blocking observations not modified
- **New** — other modified files

Each file gets a resolution verdict (resolved / partially resolved / unresolved). Supports chained rounds.

### `/scd-review:continue`

Resume an interrupted review or followup. Files pending are re-scored by risk before relaunching agents — critical files are processed first regardless of original order.

### `/scd-review:settings`

Interactive configuration wizard. Set model profiles, default pipeline behavior, validator threshold, and platform in one guided session.

## Agents

All agents run as background subagents. The main conversation never reads files or diffs directly — it only orchestrates and displays results.

### `scout-alpha` (haiku)

Read-only environment scanner. Detects `jq`, OS, gh/glab availability, scripts installation, and sessions directory. Results are cached in `config.json` for 24h — re-used on subsequent `init` calls unless `--force` is passed.

### `code-reviewer`

Analyzes one code file per invocation. Three phases:

1. **Context & diff** — reads the diff, identifies what changed and why, uses cross-file context when needed
2. **Observations** — analyzes against 6 criteria: `architecture`, `security`, `performance`, `conventions`, `error-handling`, `test-coverage`. Classifies each as blocking (🔴) or suggestion (🟡)
3. **Structured report** — returns observations with `correction_prompt` (autonomous fix instruction), `line_start`/`line_end` for inline posting, and human-readable analysis

If `--context` was provided, the resolved context file is injected into the prompt: the agent evaluates whether the implementation matches the ticket's acceptance criteria and domain language.

Supports two modes: **FULL** (review from merge-base) and **CORRECTION** (verify fixes from previous HEAD, used by `followup`).

### `test-reviewer`

Analyzes test files. Automatically used for files categorized as `tests`.

1. **Run tests** — detects the framework (vitest, jest, pytest, go test, cargo test...) and executes scoped to the file
2. **Quality** — checks AAA structure, naming, test doubles, FIRST properties, anti-patterns
3. **Coverage** — runs coverage if supported, evaluates pertinence using Khorikov's classification (domain code = must test; trivial code = don't bother)

Requires the testing-principles rule, installed automatically by `init`.

### `review-validator`

Arbitration agent. Called per-file as soon as the reviewer finishes (chained pipeline — no separate batch phase). For each observation:

1. **Verify** — checks whether the problem actually exists in the diff
2. **Evaluate** — assesses whether the `correction_prompt` describes a truly surgical fix (< 10 lines, no refactoring)
3. **Decide** — `apply` (safe to fix), `skip` (false positive), or `escalate` (human decision needed)

Constraints: **read-only**, never proposes alternative code, always escalates on doubt.

### `fix-applier`

Correction agent for `--fix` mode. Uses `correction_prompt` as its primary instruction (v1 format):

1. **Locate** — reads the file at `line_start`/`line_end` and verifies the code matches the prompt description
2. **Fix** — applies a surgical Edit (never Write), touching only what the observation describes
3. **Verify** — re-reads the modified zone, checks syntax, runs affected tests via `scd.sh test run-affected`

If tests fail after a fix, the agent can retry or report `skipped_ambiguous`. Never reformats, never adds comments, never fixes adjacent issues.

### Pipeline

Agents run in a sliding window (max configured via `pipeline.max_parallel_agents`, default 5). The window covers both review and validation agents combined:

```
File 1: [==review==][=validate=][fix]
File 2:    [==review==][=validate=][fix]
File 3:       [==review==][=validate=][fix]
```

This eliminates wait time between phases. Observation persistence is normalized via `scd.sh agent validate-output` before writing to the session.

## GitHub / GitLab Integration

Configure during `init` or `settings`. Use `--post` to post results inline on your PR/MR.

**v1 inline-only model:** all observations are posted as inline diff comments at the exact line. Orphan observations (line outside diff) are grouped into a single general comment — never one comment per observation.

The inline comment format includes:
- Emoji + criterion + severity tag
- Detail with line reference
- Suggestion
- `correction_prompt` in a collapsible `<details>` block (actionable by the next developer)

**GitHub** — uses `POST /pulls/:id/reviews` to batch all comments in one API call. Falls back to individual comments if the batch fails.

**GitLab** — uses `POST /merge_requests/:iid/discussions` with `diff_refs` for positioned comments. Falls back to non-positioned discussion if the line is outside the diff.

**Requirements:**
- GitHub: [GitHub CLI](https://cli.github.com) (`gh`) — `brew install gh` / `apt install gh`
- GitLab: [GitLab CLI](https://gitlab.com/gitlab-org/cli) (`glab`) — `brew install glab` / `apt install glab`

Posting never blocks the review. Missing CLI, no open PR/MR, or network failure → warning displayed, review continues normally.

## Scripts

All operations go through a single dispatcher: `.claude/review/scripts/scd.sh`

```bash
scd.sh session  status | update-file | add-observations | add-comment | add-agent-tasks | summary | pending-files
scd.sh followup classify | get-context | update-file | summary
scd.sh post     inline-comments | orphan-summary
scd.sh validation update | report
scd.sh context  resolve <ticket|file|url> <value> ...
scd.sh agent    capture-output | validate-output
scd.sh test     run-affected
scd.sh init     detect-env [--force]
scd.sh config   update-state | get | resolve-model
```

Installed from the plugin into `.claude/review/scripts/` during `init`.

## Runtime files

```
.claude/review/
  config.json                  # Review configuration (v1.0.0)
  sessions/
    feature-auth.json          # Session per branch (review + validation + resolution in one file)
    feature-auth-followup.json # Followup session
    feature-auth-context.md    # Business context (created by --context)
  scripts/
    scd.sh                     # Unified dispatcher
```

Add `.claude/review/sessions/` and `.claude/review/scripts/` to your `.gitignore`.

## Configuration

`config.json` is created by `init` with sensible defaults. Customize via `/scd-review:settings` or edit directly:

| Key | Default | Description |
|---|---|---|
| `model_profile` | `"balanced"` | `balanced` (Sonnet) / `quality` (Opus for review+fix) / `budget` (Haiku for validator) |
| `model_overrides` | `{}` | Per-agent model override: `{"code-reviewer": "opus"}` |
| `default_output` | `"fix"` | Default flag: `fix`, `post`, or `both` |
| `pipeline.max_parallel_agents` | `5` | Max concurrent agents (review + validation combined) |
| `pipeline.max_files_per_run` | `20` | Circuit breaker — files over this threshold go to `continue` |
| `pipeline.midpoint_checkpoint` | `true` | Show progress summary at 50% |
| `validator.confidence_threshold` | `0.75` | Minimum confidence for `apply` decisions |
| `validator.skip_green` | `true` | Auto-skip green observations in validation |
| `category_priority` | *(10 categories)* | Review order: build-config → database → domain → ... → tests → docs |
| `platform.type` | `null` | `"github"`, `"gitlab"`, or `null` |
| `platform.inline_only` | `true` | Post inline comments only (never a general summary) |
| `context.jira_api_url` | `null` | Jira base URL for `--context ticket:` resolution |
| `options.default_base_branch` | `"main"` | Default comparison base |

## Requirements

- **jq** (optional) — atomic JSON updates via `scd.sh`. Without it, falls back to read/write cycles. `brew install jq` / `apt install jq` / `choco install jq`
- **gh** (optional) — GitHub CLI for `--post`. `brew install gh`
- **glab** (optional) — GitLab CLI for `--post`. `brew install glab`

## Install

```
/plugin install scd-review@sebc-dev-marketplace
```
