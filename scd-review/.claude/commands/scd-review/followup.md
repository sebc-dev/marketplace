---
name: followup
description: Followup de review v2 — vérifier les corrections après une review complétée, avec priorisation intelligente et observations v2 (correction_prompt)
allowed-tools:
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git merge-base *)
  - Bash(git branch *)
  - Bash(git show *)
  - Bash(git rev-parse *)
  - Bash(git cat-file *)
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
Vérifier les corrections apportées après une code review v2 complétée. Classifier les fichiers en corrections/non adressés/nouveaux, reviewer de manière ciblée avec verdict de résolution pour chaque fichier.
</objective>

<process>

## 0. Vérification environnement

Suivre la procédure @references/ensure-env.md.
Si config absente ou v0.13.0 → indiquer de lancer `/scd-review:init` et STOP.

## 1. Exécuter le workflow followup

Suivre @references/followup-workflow.md avec :
- Format de retour agents : @references/agent-output-format.md
- Scripts : `bash .claude/review/scripts/scd.sh followup *`
- Session protocol : @references/session-protocol.md

</process>

<guidelines>
- Toujours communiquer en français
- La conversation principale ne lit PAS les fichiers ni les diffs — rôle des agents
- Présenter le rapport de l'agent tel quel, sans re-analyser le code
- Les fichiers `unaddressed` ne nécessitent pas d'agent — afficher le contexte original directement
- Si un fichier est supprimé comme correction, le marquer auto-resolved sans discussion
- Script unique : `bash .claude/review/scripts/scd.sh` (dispatcher v2)
</guidelines>
