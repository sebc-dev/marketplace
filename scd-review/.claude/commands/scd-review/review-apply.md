---
name: review-apply
description: Appliquer les corrections d'une code review — traiter chaque observation interactivement (appliquer, sauter, rejeter, discuter)
allowed-tools:
  - Bash(git branch:*)
  - Bash(git rev-parse:*)
  - Bash(bash .claude/review/scripts/*)
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Apres une code review completee, traiter les observations (bloquantes et suggestions) interactivement. Pour chaque observation, l'utilisateur peut : appliquer la correction (via un agent isole), sauter, rejeter (faux positif), ou discuter.
</objective>

<process>

## 0. Verification environnement

Suivre la procedure @references/ensure-env.md pour charger la config et verifier l'env_cache.
Si config absente → indiquer de lancer `/scd-review:review-init` et STOP.

## 1. Strategie JSON

Resoudre la strategie selon @references/session-protocol.md.

## 2. Executer le workflow apply

Suivre @references/apply-workflow.md avec la json_strategy resolue.

</process>

<guidelines>
- Toujours communiquer en francais
- Economiser le contexte : deleguer aux references
- Agents en subagent_type natif (fix-applier)
</guidelines>
