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
  - Bash(git status:*)
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

## 0.5. Selection du perimetre de review

Cette etape est OBLIGATOIRE — elle ne peut pas etre sautee.

1. Calculer le merge-base : `git merge-base <base_branch> HEAD`
2. Lister les fichiers modifies : `git diff --name-status <merge-base>..HEAD`
3. Afficher un resume : nombre de fichiers par statut (A/M/D) et par categorie
4. Demander a l'utilisateur :
   ```
   AskUserQuestion(
     questions: [{
       question: "X fichiers modifies sur cette branche. Quel perimetre pour la review ?",
       header: "Perimetre",
       options: [
         { label: "Tous les fichiers", description: "Reviewer l'ensemble des X fichiers" },
         { label: "Exclure des patterns", description: "Exclure par pattern glob (ex: *.xml, grails-app/domain/**)" },
         { label: "Selection manuelle", description: "Choisir les fichiers a inclure par numeros ou chemins" }
       ],
       multiSelect: false
     }]
   )
   ```
5. **"Tous les fichiers"** → `review_scope` = liste complete, continuer
6. **"Exclure des patterns"** → demander les patterns a exclure, filtrer la liste, afficher le resultat et confirmer
7. **"Selection manuelle"** → afficher la liste numerotee complete, l'utilisateur saisit les numeros (ex: "1-5,8,12-20") ou chemins
8. **"Other"** → traiter comme un pattern d'exclusion ou une liste de fichiers selon le contenu

Stocker la liste finale dans `review_scope`. Afficher :
```
Perimetre confirme : Y fichiers selectionnes sur X total
```

Le `review_scope` est transmis au pipeline. Lors de la creation de la session JSON (Etape 2 du review-workflow), seuls les fichiers presents dans `review_scope` sont inclus.

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
