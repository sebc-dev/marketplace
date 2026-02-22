# code-review

Interactive guided code review on the current branch. Reviews file by file in optimal order with JSON-based progress tracking, jq-optimized state updates, and cross-platform design.

## Commands

### `/code-review:review-init`

Bootstrap the code review environment. Detects whether `jq` is available for optimized JSON updates (falls back to read/write strategy), creates the configuration file and sessions directory.

Run this once before your first review.

### `/code-review:code-review [base-branch]`

Full interactive review workflow. Walks through all changes on the current branch compared to the base branch (default: `main`).

Features:
- **Resumable** — progress is tracked in JSON session files, pick up where you left off
- **Interactive** — pause after each file to discuss, ask questions, or add comments
- **Architecture-aware** — review order follows dependency flow for better comprehension
- **Categorized observations** — each change gets rated as good, question, or attention
- **Cross-platform** — works with or without `jq` installed

### `/code-review:review-continue`

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
- Testing principles rule installed via `/code-review:review-init` (automatic)

## Runtime files

The plugin creates files under `.claude/review/` in your project:

```
.claude/review/
  config.json          # Review configuration (criteria, categories, jq strategy)
  sessions/
    feature-auth.json  # Session file per branch (slug of branch name)
```

Add `.claude/review/sessions/` to your `.gitignore` — session files are temporary and branch-specific.

## Configuration

`config.json` is created by `/code-review:review-init` with sensible defaults. You can customize:

- `category_priority` — order in which file categories are reviewed
- `review_criteria` — what aspects to analyze (architecture, security, performance, etc.)
- `options.default_base_branch` — default base branch (default: `main`)

## Requirements

- **jq** (optional) — enables atomic JSON updates. If not available, falls back to full read/write cycles. Install: `brew install jq` / `apt install jq` / `choco install jq`

## Install

```
/plugin install code-review@sebc-dev-marketplace
```
