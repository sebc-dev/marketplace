---
name: review-continue
description: Reprendre une code review interrompue sur la branche courante
allowed-tools:
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git merge-base:*)
  - Bash(git branch:*)
  - Bash(git show:*)
  - Bash(bash .claude/review/scripts/*)
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Reprendre rapidement une code review interrompue sur la branche courante, sans avoir a re-specifier la branche de base ni reconfigurer quoi que ce soit.
</objective>

<process>

## 1. Charger la config

Lire `.claude/review/config.json`. Si absent :
```
Config absente. Lancez /scd-review:review-init d'abord.
```

## 2. Trouver la session

1. `git branch --show-current`
2. Calculer le slug de branche (remplacer `/` par `-`)
3. Chercher `.claude/review/sessions/<slug>.json` via Glob

Si aucune session trouvee :
```
Aucune review en cours pour la branche <branche>.
Lancez /scd-review:code-review pour demarrer une nouvelle review.
```

Si session trouvee mais `status` == `"completed"` :
```
La review de <branche> est deja terminee (X fichiers, 🟢G 🟡Y 🔴R).
Lancez /scd-review:code-review pour demarrer une nouvelle review.
```

## 3. Afficher la progression

Lire `json_strategy` dans la config.

**Strategie `jq`** :
```bash
bash .claude/review/scripts/session-status.sh .claude/review/sessions/<slug>.json
```
Afficher le resultat tel quel.

**Strategie `readwrite`** : Read du fichier session JSON et afficher :
```
Reprise de la review — <branche> (base: <base-branch>)
  X/N fichiers reviewes
  Fichiers termines :
    1/N fichier.ext [Categorie] — note
    ...
  Prochain fichier : X+1/N fichier.ext [Categorie]
```

## 4. Reprendre la review

Continuer avec l'Etape 3 du workflow `/scd-review:code-review` a partir du prochain fichier `pending`. Suivre exactement le meme processus : en-tete, diff, observations, mise a jour JSON, conversation libre.

Quand tous les fichiers sont termines, executer l'Etape 4 (synthese) de `/scd-review:code-review`.

</process>
