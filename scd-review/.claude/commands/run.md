---
name: run
description: Pipeline de code review v2.1 — review, validation chaînée, décisions interactives (défaut) puis dispatch
argument-hint: "[--auto-fix] [--post] [--no-fix] [--context ticket:X] [--context file:Y] [base-branch]"
allowed-tools:
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git merge-base *)
  - Bash(git branch *)
  - Bash(git show *)
  - Bash(git rev-parse *)
  - Bash(git status *)
  - Bash(git fetch *)
  - Bash(git pull *)
  - Bash(git show-ref *)
  - Bash(bash .claude/review/scripts/scd.sh *)
  - Bash(jq *)
  - Bash(gh pr *)
  - Bash(glab mr *)
  - Bash(glab api *)
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Exécuter le pipeline de code review v2.1 sur la branche courante.

Flags disponibles :
- *(aucun flag)*  : **mode interactif (défaut)** — review → validation → décisions une par une → fix batch
- `--auto-fix`    : bypass de la phase de décision — toutes les `validator_decision == "apply"` deviennent `user_decision = "apply"`, fix immédiat (comportement v1.0)
- `--post`        : pas de décisions interactives, post inline des observations applicables
- `--no-fix`      : review + validate uniquement, pas de dispatch (pour audit pur)
- `--context ticket:X` : injecter le ticket comme contexte métier
- `--context file:Y`   : injecter un fichier local comme contexte métier
- `--context url:Z`    : injecter une URL comme contexte métier
- `base-branch`        : branche de base (défaut : config.options.default_base_branch ou "main")

Flags combinables : `--auto-fix --post`, `--post` seul, etc.

Le mode interactif (défaut) sauvegarde chaque décision immédiatement. Interruption sans perte → `/scd-review:continue` reprend là où on s'est arrêté.
</objective>

<process>

## 0. Vérification environnement

Suivre la procédure @references/ensure-env.md.
Si config absente ou init incomplète → indiquer de lancer `/scd-review:init` et STOP.

## 1. Parser les flags

Depuis $ARGUMENTS :
- `flags.auto_fix = true` si `--auto-fix` présent (sinon false)
- `flags.post = true` si `--post` présent (sinon false)
- `flags.no_fix = true` si `--no-fix` présent (sinon false)
- `flags.context = []` liste des `--context <type>:<value>` fournis
- `base_branch` = premier argument non-flag, ou config.options.default_base_branch, ou "main"

**Résolution du mode dispatch** :
- `--no-fix` seul → mode `review_only` (skip Phase 3.0, 3.5)
- `--no-fix --post` → post inline uniquement, pas de décisions ni fix
- `--auto-fix` (avec ou sans --post) → bypass Phase 3.0 (auto-apply), Phase 3.5 active
- *(aucun de ces flags)* → **mode interactif** (Phase 3.0 active, Phase 3.5 active après décisions)

Stocker `flags` dans `config_snapshot.flags` de la session pour que `continue` connaisse le mode initial.

## 2. Exécuter le pipeline

Suivre @references/run-workflow.md avec :
- `base_branch` = valeur résolue
- `flags` = valeurs parsées
- Format agents : @references/agent-output-format.md
- Résolution contexte : @references/context-resolution.md (si --context)
- Phase 3.0 (interactif) : @references/decision-workflow.md

</process>

<guidelines>
- Toujours communiquer en français
- La conversation principale ne lit PAS les fichiers ni les diffs directement — rôle des agents (sauf en Phase 3.0 "Discuter" où Read est autorisé pour analyse approfondie)
- Agents lancés en background via Task avec subagent_type natif
- Pipeline chaîné : review-validator démarre dès qu'un fichier est reviewé (pas de batch Phase 2)
- **Mode interactif (défaut)** : décisions une par une, persistées immédiatement, interruption sans perte
- **Mode --auto-fix** : préserve le comportement v1.0 pour CI / automation
- Rapport consolidé via scd.sh validation report à la fin
</guidelines>
