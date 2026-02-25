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
  - Bash(git add:*)
  - Bash(git commit:*)
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

## 0.5. Selection des fichiers et commit

1. Verifier les changements non commites : `git status --porcelain`
2. Si aucun changement non commite → passer directement a l'etape 1
3. Si des changements existent :
   a. Afficher la liste numerotee des fichiers modifies/ajoutes/supprimes avec leur statut (M/A/D/??)
   b. Demander a l'utilisateur :
      ```
      AskUserQuestion(
        questions: [{
          question: "Des fichiers non commites ont ete detectes. Souhaitez-vous en committer avant la review ?",
          header: "Pre-commit",
          options: [
            { label: "Tous les fichiers", description: "Stager et committer tous les fichiers modifies" },
            { label: "Continuer sans commit", description: "Lancer la review uniquement sur les commits existants" }
          ],
          multiSelect: false
        }]
      )
      ```
   c. **"Tous les fichiers"** → `git add -A`
   d. **"Continuer sans commit"** → passer a l'etape 1
   e. **"Other"** → l'utilisateur saisit les numeros ou chemins des fichiers a inclure (ex: "1,3,5" ou "src/app.ts, lib/utils.ts"). Stager uniquement ces fichiers : `git add <fichiers>`
   f. Apres le staging, demander le message de commit :
      ```
      AskUserQuestion(
        questions: [{
          question: "Message de commit ?",
          header: "Commit msg",
          options: [
            { label: "Message auto", description: "Generer un message base sur les fichiers stages" },
            { label: "wip", description: "Utiliser 'wip' comme message de commit" }
          ],
          multiSelect: false
        }]
      )
      ```
   g. **"Message auto"** → generer un message concis a partir du `git diff --cached --stat`
   h. **"wip"** → utiliser "wip" comme message
   i. **"Other"** → utiliser le texte saisi par l'utilisateur
   j. Committer : `git commit -m "<message>"`
   k. Afficher confirmation : nombre de fichiers commites et hash du commit

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
