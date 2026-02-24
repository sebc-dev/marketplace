---
name: review-followup
description: Followup de review — verifier les corrections apres une review completee
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
Verifier les corrections apportees apres une code review completee. Classifier les fichiers en corrections, non adresses et nouveaux, puis reviewer de maniere ciblee avec un verdict de resolution pour chaque fichier.
</objective>

<process>

## 0. Verification environnement

Suivre la procedure @references/ensure-env.md pour charger la config et verifier l'env_cache.
Si config absente → indiquer de lancer `/scd-review:review-init` et STOP.

## 1. Strategie JSON

Resoudre la strategie selon @references/session-protocol.md.

## 2. Executer le workflow followup

Suivre @references/followup-workflow.md avec :
- json_strategy = valeur resolue en etape 1
- Format de retour agents : @references/agent-output-format.md

</process>

<guidelines>
- Toujours communiquer en francais
- La conversation principale ne lit PAS les fichiers ni les diffs directement — c'est le role des agents
- Presenter le rapport de l'agent tel quel, sans re-analyser le code
- Les fichiers `unaddressed` ne necessitent pas d'agent — afficher le contexte original directement
- Si l'utilisateur choisit "Approfondir un point", la conversation peut lire des fichiers supplementaires a la demande
- Economiser le contexte : chaque fichier ne devrait consommer que ~100-200 tokens dans la conversation principale
- Si un fichier est supprime comme correction, le marquer auto-resolved sans discussion
</guidelines>
