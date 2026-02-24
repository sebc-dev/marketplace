---
name: code-review
description: Review guidee interactive du diff entre la branche courante et la branche de base
argument-hint: "[base-branch]"
allowed-tools:
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git merge-base:*)
  - Bash(git branch:*)
  - Bash(git show:*)
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
Guider l'utilisateur a travers une code review interactive de tous les changements sur la branche courante par rapport a la branche de base. Reviewer fichier par fichier dans un ordre optimal, expliquer chaque changement en detail, et dialoguer avec l'utilisateur.

Branche de base : $ARGUMENTS (defaut: lire `options.default_base_branch` dans config.json, sinon `main`)
</objective>

<process>

## 0. Verification environnement

Suivre la procedure @references/ensure-env.md pour charger la config et verifier l'env_cache.
Si config absente → indiquer de lancer `/scd-review:review-init` et STOP.

## 1. Strategie JSON

Resoudre la strategie selon @references/session-protocol.md.

## 2. Executer le workflow

Suivre @references/review-workflow.md avec :
- base_branch = $ARGUMENTS ou config.options.default_base_branch ou "main"
- json_strategy = valeur resolue en etape 1
- Format de retour agents : @references/agent-output-format.md

</process>

<guidelines>
- Toujours communiquer en francais
- La conversation principale ne lit PAS les fichiers ni les diffs directement — c'est le role des agents
- Presenter le rapport de l'agent tel quel, sans re-analyser le code
- Si l'utilisateur choisit "Approfondir un point", la conversation peut lire des fichiers supplementaires a la demande (deep-dive exceptionnel)
- Economiser le contexte : chaque fichier ne devrait consommer que ~100-200 tokens dans la conversation principale (affichage du rapport + checkpoint)
- Le pipeline de 5 agents garantit zero temps d'attente : les agents finissent pendant que l'utilisateur review les fichiers precedents
</guidelines>
