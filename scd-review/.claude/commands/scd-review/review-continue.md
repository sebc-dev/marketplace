---
name: review-continue
description: Reprendre une code review interrompue sur la branche courante
allowed-tools:
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git merge-base:*)
  - Bash(git branch:*)
  - Bash(git show:*)
  - Bash(git rev-parse:*)
  - Bash(bash .claude/review/scripts/*)
  - Bash(gh pr *)
  - Bash(glab mr *)
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Reprendre rapidement une review/followup/apply interrompue sur la branche courante.
</objective>

<process>

## 0. Verification environnement

Suivre la procedure @references/ensure-env.md pour charger la config et verifier l'env_cache.
Si config absente → indiquer de lancer `/scd-review:review-init` et STOP.

## 1. Strategie JSON

Resoudre la strategie selon @references/session-protocol.md.

## 2. Executer le workflow de reprise

Suivre @references/resume-workflow.md avec la json_strategy resolue.
Format agents : @references/agent-output-format.md.

</process>

<guidelines>
- Toujours communiquer en francais
- Economiser le contexte : deleguer aux references
- Agents en subagent_type natif (code-reviewer, test-reviewer, fix-applier)
</guidelines>
