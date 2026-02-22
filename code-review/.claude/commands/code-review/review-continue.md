---
name: review-continue
description: Reprendre une code review interrompue sur la branche courante
allowed-tools:
  - Bash(git diff:*)
  - Bash(git log:*)
  - Bash(git merge-base:*)
  - Bash(git branch:*)
  - Bash(git show:*)
  - Bash(jq * .claude/review/sessions/*)
  - Bash(mv * .claude/review/sessions/*)
  - Read
  - Write
  - Glob
  - Grep
---

<objective>
Reprendre rapidement une code review interrompue sur la branche courante, sans avoir a re-specifier la branche de base ni reconfigurer quoi que ce soit.
</objective>

<process>

## 1. Charger la config

Lire `.claude/review/config.json`. Si absent :
```
Config absente. Lancez /code-review:review-init d'abord.
```

## 2. Trouver la session

1. `git branch --show-current`
2. Calculer le slug de branche (remplacer `/` par `-`)
3. Chercher `.claude/review/sessions/<slug>.json` via Glob

Si aucune session trouvee :
```
Aucune review en cours pour la branche <branche>.
Lancez /code-review:code-review pour demarrer une nouvelle review.
```

Si session trouvee mais `status` == `"completed"` :
```
La review de <branche> est deja terminee (X fichiers, 🟢G 🟡Y 🔴R).
Lancez /code-review:code-review pour demarrer une nouvelle review.
```

## 3. Afficher la progression

Lire le fichier session JSON et afficher :
```
Reprise de la review — <branche> (base: <base-branch>)
  X/N fichiers reviewes
  Fichiers termines :
    1/N fichier.ext [Categorie] — note
    ...
  Prochain fichier : X+1/N fichier.ext [Categorie]
```

## 4. Reprendre la review

Continuer avec l'Etape 3 du workflow `/code-review:code-review` a partir du prochain fichier `pending`. Suivre exactement le meme processus : en-tete, diff, observations, mise a jour JSON, conversation libre.

Quand tous les fichiers sont termines, executer l'Etape 4 (synthese) de `/code-review:code-review`.

</process>
