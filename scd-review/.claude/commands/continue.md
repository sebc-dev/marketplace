---
name: continue
description: Reprendre une code review v2 interrompue — re-scoring des fichiers pending par risque, reprise avec pipeline chaîné
allowed-tools:
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git merge-base *)
  - Bash(git branch *)
  - Bash(git show *)
  - Bash(git rev-parse *)
  - Bash(bash .claude/review/scripts/scd.sh *)
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
Reprendre rapidement une review ou followup interrompue sur la branche courante. Les fichiers pending sont re-scorés par risque avant reprise.
</objective>

<process>

## 0. Vérification environnement

Suivre la procédure @references/ensure-env.md.
Si config absente ou v0.13.0 → indiquer de lancer `/scd-review:init` et STOP.

## 1. Exécuter le workflow de reprise

Suivre @references/continue-workflow.md avec :
- Script : `bash .claude/review/scripts/scd.sh`
- Format agents : @references/agent-output-format.md
- Session protocol : @references/session-protocol.md

</process>

<guidelines>
- Toujours communiquer en français
- Économiser le contexte : déléguer aux références
- Agents en subagent_type natif (code-reviewer, test-reviewer, fix-applier)
- Script unique : `bash .claude/review/scripts/scd.sh` (dispatcher v2)
</guidelines>
