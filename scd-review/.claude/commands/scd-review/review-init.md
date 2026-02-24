---
name: review-init
description: Bootstrap de la configuration code review — detection environnement et creation config
argument-hint: "[--force]"
allowed-tools:
  - Bash(jq *)
  - Bash(bash .claude/review/scripts/*)
  - Bash(chmod +x *)
  - Bash(gh *)
  - Bash(glab *)
  - Bash(uname *)
  - Read
  - Write
  - Glob
  - AskUserQuestion
  - Task
---

<objective>
Initialiser l'environnement de code review. Detecter l'environnement, installer les dependances, configurer la plateforme.
</objective>

<arguments>
- `--force` : reinitialiser le state (re-executer toutes les etapes meme si deja done)
</arguments>

<process>

## 1. Charger le contexte

Lire `.claude/review/config.json` si existant (Read).
Si argument `--force` → reset `state.steps_status` : tous a "pending".

## 2. Determiner le mode

- **Config absente** → init complet (toutes les etapes)
- **Config presente + steps tous "done" + pas de --force** → afficher le resume actuel et STOP
- **Config presente + steps pending/stale** → init incremental (seulement ce qui manque)

## 3. Executer le workflow

Suivre la procedure dans @references/init-workflow.md :
- Phase 1 : Lancer scout-alpha pour probe environnement
- Phase 2 : Actions automatiques basees sur probe + steps_status
- Phase 3 : Checkpoint unique (plateforme)
- Phase 4 : Finalisation
- Phase 5 : Structured return

References disponibles :
- @references/default-config.json — template config par defaut
- @references/cli-install-guide.md — guides installation CLI
- @references/gitignore-entries.md — entrees gitignore

</process>
