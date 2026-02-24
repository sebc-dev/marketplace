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
- **Blocking/Suggestion** — observations are classified as blocking (must fix) or suggestion (informational), preventing infinite correction loops
- **Cross-platform** — works with or without `jq` installed

### `/scd-review:review-followup`

Followup review after corrections. Finds the last completed review session, computes the diff since closure, and classifies files into three categories:
- **Corrections** — files with blocking observations that were modified
- **Unaddressed** — files with blocking observations that were not modified
- **New** — other modified files

Each correction file gets a resolution verdict (resolved / partially resolved / unresolved). Supports chained followups (round 2, 3, ...).

### `/scd-review:review-post`

Manually post (or re-post) review results to GitHub/GitLab. Useful when:
- The PR/MR didn't exist at the time of review
- Re-posting after a network error
- Posting to a different PR

Requires platform to be configured via `review-init`.

### `/scd-review:review-continue`

Quick resume shortcut for the current branch. Finds the active session (followup or original review) and jumps straight to the next pending file.

## Agents

Every file in the review is analyzed by a dedicated background agent, keeping the main conversation lightweight and enabling longer reviews without context exhaustion.

### `code-reviewer`

Specialized subagent for code file analysis (all categories except tests). Performs a 3-phase analysis:

1. **Context & diff** — reads the file diff, understands what changed and why, identifies cross-file context
2. **Observations** — analyzes against 6 criteria (architecture, security, performance, conventions, error-handling, test-coverage), classifies each as blocking or suggestion
3. **Structured report** — returns a formatted report with human-readable observations and extractable JSON for session persistence

Supports two modes:
- **FULL** — complete review from merge-base (used in `code-review` and `review-followup` for new files)
- **CORRECTION** — targeted verification from previous HEAD, checks whether original blocking observations are addressed (used in `review-followup` for correction files)

### `test-reviewer`

Specialized subagent for test file analysis. Automatically used when files are categorized as `tests`.

1. **Runs tests** — detects the test framework and executes the test suite scoped to the file
2. **Quality analysis** — evaluates each test against principles (AAA structure, naming, test doubles, FIRST properties, anti-patterns)
3. **Coverage analysis** — runs coverage if supported and evaluates pertinence using Khorikov's code classification

**Prerequisites:**
- Testing principles rule installed via `/scd-review:review-init` (automatic)

### Agent pipeline

Both agents are managed through a sliding window pipeline (max 5 concurrent):

- **Step 2-bis** — launch agents for the first 5 files in the review order
- **Step 3** — after each file review, launch the agent for file N+5 (replacing the consumed slot)
- **Resume** — when resuming via `review-continue`, agents are re-launched for the next 5 pending files

This ensures zero wait time (agents finish while the user reviews earlier files) and minimal main context usage (~100-200 tokens per file instead of ~500-1000).

## GitHub / GitLab Integration

Optionally post review results directly on your PRs (GitHub) or MRs (GitLab). Configured during `review-init`.

**How it works:**
- After `code-review` or `review-followup` completes, results are automatically posted as a review comment
- GitHub: uses `gh pr review` with `--request-changes` (blocking observations) or `--approve` (all resolved)
- GitLab: uses `glab mr note` to post a comment
- The posted comment includes blocking observations, suggestions (collapsible), and a verdict
- Comments are localized based on `options.language` in config.json (`fr` or `en`)

**Requirements:**
- GitHub: [GitHub CLI](https://cli.github.com) (`gh`) installed and authenticated (`gh auth login`)
- GitLab: [GitLab CLI](https://gitlab.com/gitlab-org/cli) (`glab`) installed and authenticated (`glab auth login`)

**Error handling:** posting never blocks the review. If the CLI is missing, no PR/MR is open, or the network fails, a warning is displayed and the review continues normally.

## Scripts

When `jq` is available, the plugin uses pre-written bash/jq scripts instead of generating jq filters inline. Scripts are installed from the plugin into `.claude/review/scripts/` during `review-init`.

| Script | Purpose | Used in |
|---|---|---|
| `init-strategy.sh` | Set `json_strategy` in config.json | review-init (step 5) |
| `update-file.sh` | Mark file completed, recalculate summary (with blocking count) | code-review (step 3d) |
| `add-observations.sh` | Store observation details via stdin pipe | code-review (step 3d) |
| `add-comment.sh` | Append user comment to session | code-review (step 3e) |
| `session-status.sh` | Read-only session status display | code-review (step 0), review-continue (step 3) |
| `session-summary.sh` | Generate recap table + mark completed with `head_at_completion` | code-review (step 4) |
| `add-agent-tasks.sh` | Store agent task IDs (code-reviewer + test-reviewer) | code-review (step 2-bis), review-followup (step 2-bis), review-continue (step 4) |
| `classify-followup.sh` | Classify files for followup (corrections/unaddressed/new) | review-followup (step 1) |
| `get-file-context.sh` | Extract single file context from session | review-followup (step 3) |
| `update-followup-file.sh` | Update followup file with resolution verdict | review-followup (step 3) |
| `followup-summary.sh` | Generate followup recap + mark completed | review-followup (step 4) |
| `post-review-comments.sh` | Format + post review to GitHub/GitLab | code-review (step 4-bis), review-followup (step 4-bis), review-post |

## Runtime files

The plugin creates files under `.claude/review/` in your project:

```
.claude/review/
  config.json                  # Review configuration (criteria, categories, jq strategy)
  sessions/
    feature-auth.json          # Session file per branch (slug of branch name)
    feature-auth-followup.json # Followup session (created by review-followup)
  scripts/
    *.sh                       # jq scripts installed from the plugin
```

Add `.claude/review/sessions/` and `.claude/review/scripts/` to your `.gitignore` — session files are temporary and scripts are installed from the plugin.

## Configuration

`config.json` is created by `/scd-review:review-init` with sensible defaults. You can customize:

- `category_priority` — order in which file categories are reviewed
- `review_criteria` — what aspects to analyze (architecture, security, performance, etc.)
- `options.default_base_branch` — default base branch (default: `main`)
- `platform.type` — `"github"`, `"gitlab"`, or `null` (disabled)
- `platform.auto_post` — `true` to auto-post after review, `false` to disable

## Requirements

- **jq** (optional) — enables atomic JSON updates via pre-written scripts. If not available, falls back to full read/write cycles. Install: `brew install jq` / `apt install jq` / `choco install jq`
- **gh** (optional) — GitHub CLI for posting reviews on PRs. Install: `brew install gh` / `apt install gh` / `winget install GitHub.cli`
- **glab** (optional) — GitLab CLI for posting reviews on MRs. Install: `brew install glab` / `apt install glab` / `winget install GLab.glab`

## Install

```
/plugin install scd-review@sebc-dev-marketplace
```
