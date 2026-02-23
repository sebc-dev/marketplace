# code-review

Interactive guided code review on the current branch. Reviews file by file in optimal order with JSON-based progress tracking, jq-optimized state updates, and cross-platform design.

## Commands

### `/scd-review:review-init`

Bootstrap the code review environment. Detects whether `jq` is available for optimized JSON updates (falls back to read/write strategy), creates the configuration file, installs scripts and sessions directory.

Run this once before your first review.

### `/scd-review:code-review [base-branch]`

Full interactive review workflow. Walks through all changes on the current branch compared to the base branch (default: `main`).

Features:
- **Resumable** — progress is tracked in JSON session files, pick up where you left off
- **Interactive** — pause after each file to discuss, ask questions, or add comments
- **Architecture-aware** — review order follows dependency flow for better comprehension
- **Categorized observations** — each change gets rated as good, question, or attention
- **Cross-platform** — works with or without `jq` installed

### `/scd-review:review-continue`

Quick resume shortcut for the current branch. Finds the active session and jumps straight to the next pending file.

## Agents

### `test-reviewer`

Specialized subagent for deep test file analysis. Automatically triggered during code review when files are categorized as `tests`.

**What it does:**
1. **Runs tests** — detects the test framework and executes the test suite scoped to the file
2. **Quality analysis** — evaluates each test against principles (AAA structure, naming, test doubles, FIRST properties, anti-patterns)
3. **Coverage analysis** — runs coverage if supported and evaluates pertinence using Khorikov's code classification

**How it works:**
- Launched in background during Step 2 (planning) — one agent per test file, all in parallel
- Results collected in Step 3 (review) when the test file is reviewed — typically zero wait time since agents finish during the review of non-test files
- The structured report is integrated into the file's review observations (green/yellow/red counts)

**Prerequisites:**
- Testing principles rule installed via `/scd-review:review-init` (automatic)

## Scripts

When `jq` is available, the plugin uses pre-written bash/jq scripts instead of generating jq filters inline. Scripts are installed from the plugin into `.claude/review/scripts/` during `review-init`.

| Script | Purpose | Used in |
|---|---|---|
| `init-strategy.sh` | Set `json_strategy` in config.json | review-init (step 5) |
| `update-file.sh` | Mark file completed, recalculate summary | code-review (step 3d) |
| `add-comment.sh` | Append user comment to session | code-review (step 3e) |
| `session-status.sh` | Read-only session status display | code-review (step 0), review-continue (step 3) |
| `session-summary.sh` | Generate recap table + mark completed | code-review (step 4) |
| `add-test-tasks.sh` | Store test-reviewer agent task IDs | code-review (step 2-bis) |

## Runtime files

The plugin creates files under `.claude/review/` in your project:

```
.claude/review/
  config.json          # Review configuration (criteria, categories, jq strategy)
  sessions/
    feature-auth.json  # Session file per branch (slug of branch name)
  scripts/
    *.sh               # jq scripts installed from the plugin
```

Add `.claude/review/sessions/` and `.claude/review/scripts/` to your `.gitignore` — session files are temporary and scripts are installed from the plugin.

## Configuration

`config.json` is created by `/scd-review:review-init` with sensible defaults. You can customize:

- `category_priority` — order in which file categories are reviewed
- `review_criteria` — what aspects to analyze (architecture, security, performance, etc.)
- `options.default_base_branch` — default base branch (default: `main`)

## Requirements

- **jq** (optional) — enables atomic JSON updates via pre-written scripts. If not available, falls back to full read/write cycles. Install: `brew install jq` / `apt install jq` / `choco install jq`

## Install

```
/plugin install scd-review@sebc-dev-marketplace
```
