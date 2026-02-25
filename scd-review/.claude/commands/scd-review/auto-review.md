---
name: auto-review
description: Pipeline de code review automatique complet (review, validation, apply, followup, rapport) sans interaction utilisateur
argument-hint: "[base-branch]"
allowed-tools:
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git merge-base:*)
  - Bash(git branch:*)
  - Bash(git show:*)
  - Bash(git rev-parse:*)
  - Bash(git cat-file:*)
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
Executer un pipeline de code review automatique complet sur la branche courante : review → validation → apply → followup → rapport consolide.

Les interactions humaines sont minimisees — seules les observations `escalate` demandent une decision.

Branche de base : $ARGUMENTS (defaut: lire `options.default_base_branch` dans config.json, sinon `main`)
</objective>

<process>

## 0. Verification environnement

Suivre la procedure @references/ensure-env.md pour charger la config et verifier l'env_cache.
Si config absente → indiquer de lancer `/scd-review:review-init` et STOP.

## 1. Strategie JSON

Resoudre la strategie selon @references/session-protocol.md.

## 2. Activer le mode auto

Forcer `auto_mode.enabled = true` dans la config en memoire pour cette session.
Cela active les guards auto dans tous les workflows references.

## 3. Executer le pipeline

Suivre @references/auto-review-workflow.md avec :
- base_branch = $ARGUMENTS ou config.options.default_base_branch ou "main"
- json_strategy = valeur resolue en etape 1
- Format de retour agents : @references/agent-output-format.md

</process>

<guidelines>
- Toujours communiquer en francais
- La conversation principale ne lit PAS les fichiers ni les diffs directement — c'est le role des agents
- Afficher un resume concis a la fin de chaque phase (pas de rapport intermediaire verbeux)
- Les seules interactions sont les observations `escalate` quand `auto_mode.escalate_to_user == true`
- Le rapport final consolide est la sortie principale de cette commande
</guidelines>
