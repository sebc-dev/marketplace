---
name: code-review
description: Review guidee interactive du diff entre la branche courante et la branche de base
argument-hint: "[base-branch]"
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
---

<objective>
Guider l'utilisateur a travers une code review interactive de tous les changements sur la branche courante par rapport a la branche de base. Reviewer fichier par fichier dans un ordre optimal, expliquer chaque changement en detail, et dialoguer avec l'utilisateur.

Branche de base : $ARGUMENTS (defaut: lire `options.default_base_branch` dans config.json, sinon `main`)
</objective>

<process>

## Pre-requis

Verifier que `.claude/review/config.json` existe (Glob). Si absent, indiquer :
```
Config absente. Lancez /scd-review:review-init d'abord.
```
Et s'arreter.

## Strategie JSON

Lire `json_strategy` dans `.claude/review/config.json`.

Si `json_strategy == "jq"`, utiliser les scripts pour toutes les operations JSON session :
- Status session : `bash .claude/review/scripts/session-status.sh <session>`
- Mise a jour fichier : `bash .claude/review/scripts/update-file.sh <session> <idx> <g> <y> <r> "<note>"`
- Ajout commentaire : `bash .claude/review/scripts/add-comment.sh <session> "<file>" "<comment>"`
- Ajout test tasks : `bash .claude/review/scripts/add-test-tasks.sh <session> '<json>'`
- Synthese + cloture : `bash .claude/review/scripts/session-summary.sh <session>`

Si `json_strategy == "readwrite"`, utiliser Read + Write pour toutes les operations JSON.

## Etape 0 — Initialiser ou reprendre

1. Lire `.claude/review/config.json` pour connaitre `json_strategy`
2. Identifier la branche courante : `git branch --show-current`
3. Calculer le slug de branche : remplacer `/` par `-` (ex: `feature/auth` → `feature-auth`)
4. Chercher `.claude/review/sessions/<slug>.json` via Glob

**Si une session existe et `status` != `"completed"` :**

- **Strategie `jq`** : `bash .claude/review/scripts/session-status.sh .claude/review/sessions/<slug>.json`
  Afficher le resultat tel quel, puis demander a l'utilisateur : reprendre ou recommencer ?
- **Strategie `readwrite`** : Read du fichier session, compter les fichiers completed/pending, afficher la progression manuellement.

- **Reprendre** → aller a Etape 3 sur le prochain fichier `pending`
- **Recommencer** → supprimer le fichier session, continuer vers Etape 1

**Si aucune session ou session `completed`** → Etape 1

## Etape 1 — Collecter le contexte

1. `git branch --show-current`
2. Base branch = `$ARGUMENTS` si fourni, sinon la valeur de `options.default_base_branch` dans config.json, sinon `main`
3. `git merge-base <base> HEAD`
4. `git diff --name-status --stat <merge-base>..HEAD`
5. `git log --oneline --reverse <merge-base>..HEAD`

Presenter un resume initial :
- Nom de la branche et son objectif probable (deduit du nom et des commits)
- Nombre de fichiers modifies (M), ajoutes (A), supprimes (D)
- Nombre de commits
- Taille globale des changements (insertions/deletions)

## Etape 2 — Planifier et persister

1. Classifier chaque fichier selon `category_priority` du config :

   | Categorie | Patterns typiques |
   |---|---|
   | build-config | package.json, Cargo.toml, build.gradle, *.config.*, CI, Dockerfile |
   | database-migrations | migrations/, changelogs, schema files, *.sql |
   | domain-models | models/, entities/, domain/, types, schemas |
   | infrastructure | utils/, helpers/, lib/, shared/, base classes |
   | business-logic | services/, use-cases/, handlers/, core logic |
   | controllers-api | controllers/, routes/, api/, endpoints, +server.ts |
   | views-ui | views/, components/, pages/, templates, +page.svelte, *.html |
   | integration-wiring | config/, DI, resources.groovy, app.module, providers |
   | tests | test/, tests/, spec/, *.test.*, *.spec.* |
   | i18n-docs | *.md, messages.properties, locales/, i18n/, *.po |

2. Presenter l'ordre avec justification
3. Apres confirmation utilisateur → creer le fichier session JSON

**Structure du fichier session** `.claude/review/sessions/<slug>.json` :
```json
{
  "branch": "<branche>",
  "base": "<base-branch>",
  "merge_base": "<sha>",
  "created_at": "<ISO-8601>",
  "status": "in_progress",
  "summary": {
    "total_files": 0,
    "completed": 0,
    "green": 0,
    "yellow": 0,
    "red": 0
  },
  "files": [
    {
      "index": 1,
      "path": "chemin/fichier.ext",
      "category": "business-logic",
      "status": "pending",
      "green": 0,
      "yellow": 0,
      "red": 0,
      "note": ""
    }
  ],
  "user_comments": []
}
```

Ecrire le JSON avec Write.

### 2-bis. Lancer les agents test-reviewer en background

Apres la persistance du fichier session, identifier tous les fichiers de categorie `tests` dans la session.

Pour chaque fichier de test, lancer un agent `test-reviewer` en background :

```
Task(
  subagent_type: "general-purpose",
  run_in_background: true,
  description: "Test review: <nom-fichier>",
  prompt: "Tu es un test-reviewer specialise. Lis la definition d'agent dans ${CLAUDE_PLUGIN_ROOT}/.claude/agents/test-reviewer.md et suis ses instructions pour analyser le fichier <chemin-du-fichier>. Contexte git : merge-base=<sha>, base branch=<base>."
)
```

Stocker les task IDs retournes dans la session JSON :

- **Strategie `jq`** : `bash .claude/review/scripts/add-test-tasks.sh .claude/review/sessions/<slug>.json '<json>'`
  ou `<json>` est un objet `{"fichier_test": "task_id", ...}`
- **Strategie `readwrite`** : Read + Write pour ajouter `test_agent_tasks` dans le JSON.

Si aucun fichier n'est de categorie `tests`, ne rien lancer et ne pas ajouter la cle.

## Etape 3 — Review fichier par fichier

Pour chaque fichier `pending` dans l'ordre :

### 3a. En-tete

Afficher :
```
Fichier X/Y : chemin/du/fichier [CATEGORIE]
```

### 3b. Expliquer les changements

- `git diff <merge-base>..HEAD -- <fichier>` pour le diff specifique
- Lire le fichier complet avec Read si le contexte est necessaire
- Pour chaque modification :
  - **Ce qui a change** : decrire precisement
  - **Pourquoi** : la decision de design derriere l'approche
  - **Contexte** : comment ce changement s'articule avec les autres fichiers de la review

### 3c. Observations de review

Analyser selon les criteres definis dans `review_criteria` du config :

- **architecture** — Separation des couches, structure des modules, patterns utilises, coherence avec l'existant
- **security** — Injection, XSS, donnees sensibles, authentification, autorisation, validation des inputs
- **performance** — N+1 queries, chargements inutiles, pagination, mise en cache, complexite algorithmique
- **conventions** — Nommage, structure, style de code, idiomes du langage, coherence avec le reste du projet
- **error-handling** — Gestion des erreurs, cas limites, resilience, messages d'erreur clairs
- **test-coverage** — Tests presents et adequats, cas couverts, qualite des assertions

Pour chaque observation, classifier :
- 🟢 **Bon** : Pattern ou choix remarquable
- 🟡 **Question** : Point a clarifier ou discuter
- 🔴 **Attention** : Probleme potentiel a adresser

### 3c-bis. Integrer le rapport test-reviewer (si categorie = tests)

Si le fichier en cours est de categorie `tests` ET que `test_agent_tasks` contient une entree pour ce fichier :

1. Recuperer le resultat de l'agent background :
   ```
   TaskOutput(task_id: "<id du test_agent_tasks>", block: true)
   ```
   En pratique, l'agent aura eu le temps de finir pendant la review des fichiers precedents.

2. Afficher le rapport structure retourne par l'agent sous le titre `### Rapport test-reviewer`

3. Integrer les counts du rapport dans les observations :
   - Les 🟢 du rapport s'ajoutent au count green du fichier
   - Les 🟡 du rapport s'ajoutent au count yellow du fichier
   - Les 🔴 du rapport s'ajoutent au count red du fichier

4. Si l'agent a trouve des tests en echec, les signaler en 🔴 dans les observations

### 3d. Mettre a jour la session JSON

Mettre a jour le fichier en cours dans la session :
- `status` → `"completed"`
- `green`, `yellow`, `red` → les decomptes d'observations
- `note` → resume en 120 caracteres max

**Strategie `jq`** :
```bash
bash .claude/review/scripts/update-file.sh .claude/review/sessions/<slug>.json <index> <green> <yellow> <red> "<note>"
```
Le script recalcule automatiquement le summary par agregation et affiche le summary mis a jour.

**Strategie `readwrite`** : Read complet du JSON + Write complet avec les valeurs mises a jour (1 seul cycle lecture/ecriture par fichier).

### 3e. Conversation libre

Indiquer que la review du fichier est terminee et que l'utilisateur peut :
- Poser des questions ou approfondir un point
- Ajouter un commentaire de review
- Dire "suivant" pour passer au fichier suivant

**IMPORTANT** : Ne JAMAIS passer au fichier suivant sans reponse explicite de l'utilisateur. Attendre sa reponse en texte libre.

Si l'utilisateur ajoute un commentaire :

- **Strategie `jq`** : `bash .claude/review/scripts/add-comment.sh .claude/review/sessions/<slug>.json "<file>" "<comment>"`
- **Strategie `readwrite`** : Read + Write pour appender dans `user_comments`.

## Etape 4 — Synthese

Apres le dernier fichier :

**Strategie `jq`** :
```bash
bash .claude/review/scripts/session-summary.sh .claude/review/sessions/<slug>.json
```
Le script genere le tableau recapitulatif, liste les commentaires, et marque la session `completed`. Afficher la sortie telle quelle.

**Strategie `readwrite`** :
1. Lire le fichier session JSON complet
2. Construire le tableau recapitulatif :
   ```
   Recapitulatif de la review — <branche>

   | # | Fichier | Categorie | 🟢 | 🟡 | 🔴 |
   |---|---------|-----------|----|----|-----|
   | 1 | ...     | ...       |  X |  Y |  Z  |
   |   | TOTAL   |           | XX | YY | ZZ  |
   ```
3. Lister les commentaires utilisateur si presents
4. Marquer la session `status: "completed"` dans le JSON

Puis dans les deux cas, fournir le verdict :
- Resume de ce que la branche accomplit
- Patterns d'architecture et de design utilises
- Preoccupations transversales identifiees
- Questions ouvertes ou suggestions d'amelioration

</process>

<guidelines>
- Toujours communiquer en francais
- Etre detaille mais concis dans les explications
- Si un fichier est volumineux, se concentrer sur les changements les plus significatifs
- Utiliser des extraits de code du diff pour illustrer les points
- Adapter le niveau de detail a la complexite du fichier
- Ne pas hesiter a lire d'autres fichiers du projet pour donner du contexte
- Les criteres de review sont generiques — les adapter au langage et framework du projet (analyser les fichiers pour detecter le stack technique)
</guidelines>
