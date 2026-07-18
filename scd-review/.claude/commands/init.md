---
name: init
description: Bootstrap de la configuration code review v2 — détection environnement, cache env, migration depuis v0.13.0, installation scripts, configuration plateforme
argument-hint: "[--force]"
allowed-tools:
  - Bash(jq *)
  - Bash(bash .claude/review/scripts/scd.sh *)
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
Initialiser l'environnement de code review v2. Détecter l'environnement (avec cache 24h), migrer si config v0.13.0 présente, installer les dépendances, configurer la plateforme.
</objective>

<arguments>
- `--force` : réinitialiser et re-prober l'environnement (ignore le cache env)
</arguments>

<process>

## 1. Charger le contexte

Lire `.claude/review/config.json` si existant (Read).
Si argument `--force` → reset `state.steps_status` : tous à "pending".

## 2. Déterminer le mode

- **Config absente** → init complet (toutes les étapes)
- **Config présente sans champ `version`** → migration v0.13.0 → v2 (Phase 0 de init-workflow)
- **Config présente + steps tous "done" + pas de --force** → afficher le résumé actuel et STOP
- **Config présente + steps pending/stale** → init incrémental (seulement ce qui manque)

## 3. Exécuter le workflow

Suivre la procédure dans @references/init-workflow.md :
- Phase 0 : Migration config v0.13.0 → v2 (si applicable)
- Phase 1 : Cache env + probe scout-alpha si nécessaire
- Phase 2 : Actions automatiques basées sur probe + steps_status
- Phase 3 : Checkpoint unique (plateforme)
- Phase 4 : Finalisation
- Phase 5 : Structured return

Références disponibles :
- @references/default-config.json — template config v2 par défaut
- @references/cli-install-guide.md — guides installation CLI
- @references/gitignore-entries.md — entrées gitignore

</process>

<guidelines>
- Toujours communiquer en français
- Script principal : `bash .claude/review/scripts/scd.sh` (dispatcher v2)
- Utiliser `scd.sh init detect-env` pour vérifier/mettre à jour le cache env
- Utiliser `scd.sh config update-state` pour les mutations de config
</guidelines>
