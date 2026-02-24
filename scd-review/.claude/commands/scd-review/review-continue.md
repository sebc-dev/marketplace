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
3. Chercher les sessions via Glob (priorite : followup d'abord) :
   - `.claude/review/sessions/<slug>-followup.json`
   - `.claude/review/sessions/<slug>.json`

**Priorite : followup `in_progress` > review originale `in_progress`.**

Si `<slug>-followup.json` existe et `status == "in_progress"` :
→ Reprendre le followup (aller a Etape 3 followup ci-dessous).

Si `<slug>.json` existe et `status == "in_progress"` :
→ Reprendre la review originale (aller a Etape 3 review ci-dessous).

Si aucune session `in_progress` trouvee :
```
Aucune review en cours pour la branche <branche>.
Lancez /scd-review:code-review pour demarrer une nouvelle review
ou /scd-review:review-followup pour un followup.
```

## 3. Afficher la progression

Lire `json_strategy` dans la config.

**Strategie `jq`** :
```bash
bash .claude/review/scripts/session-status.sh .claude/review/sessions/<session-file>
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

## 4. Charger les definitions d'agents

Lire `plugin_root` dans `.claude/review/config.json`. Si `null` → erreur : `Plugin root non configure. Lancez /scd-review:review-init d'abord.`

Lire les definitions d'agents pour les injecter dans les prompts des subagents :

1. Read `<plugin_root>/.claude/agents/code-reviewer.md` → retenir comme `CODE_REVIEWER_INSTRUCTIONS`
2. Read `<plugin_root>/.claude/agents/test-reviewer.md` → retenir comme `TEST_REVIEWER_INSTRUCTIONS`
3. Si l'un des fichiers est introuvable → erreur : `Agents introuvables dans <plugin_root>. Relancez /scd-review:review-init pour re-detecter le plugin root.`

## 5. Relancer les agents pour les fichiers pending

Les agents du batch precedent sont perdus (nouvelle session Claude). Il faut relancer les agents pour les prochains fichiers pending.

1. Lire `agent_tasks` dans la session JSON (peut etre absent ou vide si la session est ancienne)
2. Identifier les fichiers `pending` dans l'ordre
3. Lancer les agents pour les **5 premiers fichiers pending** qui necessitent un agent :
   - **Review originale** : chaque fichier pending (sauf supprimes) obtient un agent (code-reviewer ou test-reviewer selon la categorie)
   - **Followup** : fichiers `correction` et `new` obtiennent un agent, les `unaddressed` sont exclus
4. Stocker les task IDs dans `agent_tasks` :
   - **Strategie `jq`** : `bash .claude/review/scripts/add-agent-tasks.sh <session> '<json>'`
   - **Strategie `readwrite`** : Read + Write

Meme logique de lancement que l'etape 2-bis de code-review / review-followup.

## 6. Reprendre la review

**Si la session est une review originale** (`<slug>.json`) :
Continuer avec l'Etape 3 du workflow `/scd-review:code-review` a partir du prochain fichier `pending`. Suivre exactement le meme processus : en-tete, recuperation rapport agent, metriques, mise a jour JSON, checkpoint utilisateur, pipeline glissant.
Quand tous les fichiers sont termines, executer l'Etape 4 (synthese) de `/scd-review:code-review`.

**Si la session est un followup** (`<slug>-followup.json`) :
Continuer avec l'Etape 3 du workflow `/scd-review:review-followup` a partir du prochain fichier `pending`. Suivre exactement le meme processus : contexte original, rapport agent, verdict de resolution, pipeline glissant.
Quand tous les fichiers sont termines, executer l'Etape 4 (synthese) de `/scd-review:review-followup`.

</process>
