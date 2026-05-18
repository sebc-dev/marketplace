---
name: settings
description: Configuration interactive du plugin scd-review — profil de modèles, output par défaut, pipeline, validator, plateforme
allowed-tools:
  - Bash(jq *)
  - Bash(bash .claude/review/scripts/scd.sh *)
  - Bash(mkdir -p *)
  - Read
  - Write
  - AskUserQuestion
---

<objective>
Configurer le plugin scd-review de manière interactive. Présente un questionnaire guidé et persiste les choix dans `.claude/review/config.json`.

Paramètres configurables :
- Profil de modèles (balanced / quality / budget)
- Output par défaut (interactive / fix / post / both)
- Seuil de confiance du validator
- Agents parallèles maximum
- Fichiers maximum par run
- Plateforme (GitHub / GitLab / Local)
- Checkpoint mi-parcours
</objective>

<process>

## 0. Vérification environnement

Lire `.claude/review/config.json` si existant. Si absent → afficher un message d'info et continuer avec les défauts.

## 1. Exécuter le questionnaire

Suivre @references/settings-workflow.md pour présenter les questions et persister les choix.

</process>

<guidelines>
- Toujours communiquer en français
- Afficher les valeurs actuelles de config comme indication dans les descriptions
- Écrire les changements de manière atomique (jq + tmp file)
</guidelines>
