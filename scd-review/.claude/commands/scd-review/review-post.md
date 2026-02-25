---
name: review-post
description: Poster ou re-poster les resultats d'une review completee sur GitHub/GitLab
allowed-tools:
  - Bash(git branch:*)
  - Bash(bash .claude/review/scripts/*)
  - Read
  - Glob
  - AskUserQuestion
---

<objective>
Publication manuelle des resultats de review sur PR/MR. Utile quand le PR/MR n'existait pas au moment de la review, apres une erreur reseau, ou pour re-poster.
</objective>

<process>

## 0. Verification environnement

Suivre la procedure @references/ensure-env.md pour charger la config et verifier l'env_cache.
Si config absente → indiquer de lancer `/scd-review:review-init` et STOP.

## 1. Verifier la plateforme

Lire `platform.type` dans la config chargee.
Si `platform.type == null` :
```
Plateforme non configuree. Lancez /scd-review:review-init pour configurer l'integration GitHub/GitLab.
```
→ STOP

## 2. Executer le workflow de publication

Suivre @references/post-workflow.md.

</process>

<guidelines>
- Toujours communiquer en francais
- Economiser le contexte : deleguer aux references
</guidelines>
