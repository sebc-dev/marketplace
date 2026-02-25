<review_workflow>

## Mode auto detection

Lire `auto_mode` dans config.json. Si `auto_mode.enabled == true`, les checkpoints utilisateur sont remplaces par des actions par defaut. La variable `is_auto` est utilisee dans les etapes suivantes.

## Etape 0 — Initialiser ou reprendre

1. Identifier la branche courante : `git branch --show-current`
2. Calculer le slug de branche : remplacer `/` par `-` (ex: `feature/auth` → `feature-auth`)
3. Chercher `.claude/review/sessions/<slug>.json` via Glob

**Si une session existe et `status` != `"completed"` :**

- **Strategie `jq`** : `bash .claude/review/scripts/session-status.sh .claude/review/sessions/<slug>.json`
  Afficher le resultat tel quel, puis demander a l'utilisateur : reprendre ou recommencer ?
- **Strategie `readwrite`** : Read du fichier session, compter les fichiers completed/pending, afficher la progression manuellement.

- **Reprendre** → aller a Etape 3 sur le prochain fichier `pending`
- **Recommencer** → supprimer le fichier session, continuer vers Etape 1

**Si aucune session ou session `completed`** → Etape 1

## Etape 1 — Collecter le contexte

1. `git branch --show-current`
2. Base branch = parametre fourni, sinon `options.default_base_branch` dans config.json, sinon `main`
3. `git merge-base <base> HEAD`
4. `git diff --name-status --stat <merge-base>..HEAD`
5. `git log --oneline --reverse <merge-base>..HEAD`

Presenter un resume initial :
- Nom de la branche et son objectif probable (deduit du nom et des commits)
- Nombre de fichiers modifies (M), ajoutes (A), supprimes (D)
- Nombre de commits
- Taille globale des changements (insertions/deletions)

## Etape 2 — Planifier et persister

**Filtrage par review_scope** : si un `review_scope` est fourni (par auto-review etape 0.5), filtrer la liste de fichiers de l'etape 1 pour ne garder que ceux presents dans `review_scope`. Les fichiers exclus ne sont ni planifies ni inclus dans la session JSON.

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
3. **Si auto_mode.enabled** → pas de confirmation, continuer directement
   **Sinon** → confirmation utilisateur avant de creer le fichier session JSON

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
    "red": 0,
    "blocking": 0
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
      "blocking": 0,
      "observations": [],
      "note": ""
    }
  ],
  "user_comments": []
}
```

Ecrire le JSON avec Write.

### 2-bis. Lancer le premier batch d'agents (pipeline de 5)

Apres la persistance du fichier session, lancer les agents pour les **5 premiers fichiers** (ou tous si < 5). Chaque fichier obtient un agent dedie lance en background :

**Pour chaque fichier de index 1 a min(5, total_files) :**

- **Si le fichier est supprime (status D dans git)** → pas d'agent, sera traite directement
- **Si categorie == `tests`** → lancer un **test-reviewer** :
  ```
  Task(
    subagent_type: "test-reviewer",
    run_in_background: true,
    description: "Test review: <nom-fichier>",
    prompt: "Fichier: <chemin>. merge_base=<sha>, base_branch=<base>."
  )
  ```
- **Sinon** → lancer un **code-reviewer** :
  ```
  Task(
    subagent_type: "code-reviewer",
    run_in_background: true,
    description: "Code review: <nom-fichier>",
    prompt: "MODE FULL. Fichier: <chemin>. merge_base=<sha>, base_branch=<base>."
  )
  ```

Stocker tous les task IDs dans la session JSON : @references/session-protocol.md (add agent tasks)

**Objectif** : les agents finissent pendant que l'utilisateur review les premiers fichiers. Maximum 5 agents en parallele a tout moment.

## Etape 3 — Review fichier par fichier

Pour chaque fichier `pending` dans l'ordre :

### 3a. En-tete

Afficher :
```
Fichier X/Y : chemin/du/fichier [CATEGORIE]
```

**Si le fichier est supprime (status D dans git)** : Indiquer "Fichier supprime" et passer directement a 3d (marquer completed avec 0 observations, note "Fichier supprime").

### 3b. Recuperer le rapport de l'agent

```
TaskOutput(task_id: agent_tasks["chemin/du/fichier"], block: true)
```

Afficher le rapport retourne par l'agent tel quel. La conversation principale ne lit PAS les fichiers ni les diffs elle-meme.

### 3c. Extraire les metriques du rapport

Parser selon @references/agent-output-format.md :
- La section `### Metriques` → valeurs green, yellow, red, blocking, note
- La section `### Observations JSON` → le tableau JSON des observations

### 3d. Mettre a jour la session JSON

Persister via @references/session-protocol.md :
1. Update file (counts + status + note)
2. Add observations (pipe le JSON array)

### 3e. Point de controle utilisateur (barriere programmatique)

**Si auto_mode.enabled :**
- action = `auto_mode.review_action` (defaut: "next")
- Logger `[AUTO] review fichier X/Y — action: next` via add-comment.sh
- Continuer sans pause au fichier suivant

**Sinon (mode interactif — comportement v0.11.0 inchange) :**

```
AskUserQuestion(
  questions: [{
    question: "Review du fichier terminee. Que souhaitez-vous faire ?",
    header: "Fichier X/Y",
    options: [
      { label: "Fichier suivant", description: "Passer au prochain fichier de la review" },
      { label: "Promouvoir une suggestion", description: "Passer une suggestion en bloquant" },
      { label: "Ajouter un commentaire", description: "Enregistrer un commentaire de review pour ce fichier" },
      { label: "Approfondir un point", description: "Poser des questions ou discuter d'un aspect du fichier" }
    ],
    multiSelect: false
  }]
)
```

L'option "Other" est automatiquement disponible pour du texte libre.

**Comportement en boucle :**
- **"Fichier suivant"** → passer au fichier suivant (sortir de la boucle 3e)
- **"Promouvoir une suggestion"** → lister les suggestions du fichier, demander laquelle promouvoir, mettre a jour l'observation (severity → "bloquant"), incrementer `blocking` du fichier dans la session, puis re-afficher le AskUserQuestion
- **"Ajouter un commentaire"** → demander le commentaire, l'enregistrer via @references/session-protocol.md (add comment), puis re-afficher le AskUserQuestion
- **"Approfondir un point"** → traiter la demande de l'utilisateur, puis re-afficher le AskUserQuestion
- **"Other" / texte libre** → traiter comme "Approfondir un point", puis re-afficher le AskUserQuestion

Cette boucle garantit que Claude ne peut PAS avancer au fichier suivant tant que l'utilisateur n'a pas explicitement choisi "Fichier suivant".

### 3f. Pipeline glissant

Apres que l'utilisateur choisit "Fichier suivant", alimenter le pipeline :

```
next_to_launch = fichier_courant.index + 5
Si next_to_launch <= total_files ET agent_tasks ne contient pas ce fichier :
  Lancer l'agent appropriate (code-reviewer ou test-reviewer) en background
  Stocker le task_id via @references/session-protocol.md (add agent tasks)
```

Cela maintient une fenetre glissante de 5 agents. Le max de 5 agents en parallele est garanti.

## Etape 4 — Synthese

Apres le dernier fichier :

Generer la synthese via @references/session-protocol.md (summary).

**Strategie `readwrite`** — construire le tableau :
```
Recapitulatif de la review — <branche>

| # | Fichier | Categorie | 🟢 | 🟡 | 🔴 | B |
|---|---------|-----------|----|----|-----|---|
| 1 | ...     | ...       |  X |  Y |  Z  | B |
|   | TOTAL   |           | XX | YY | ZZ  | BB|
```

Lister les commentaires utilisateur si presents.
Marquer la session `status: "completed"` + `head_at_completion: <git rev-parse HEAD>`.

Fournir le verdict :
- Resume de ce que la branche accomplit
- Nombre de bloquants restants (si > 0, mentionner qu'un followup est recommande)
- Patterns d'architecture et de design utilises
- Preoccupations transversales identifiees
- Questions ouvertes ou suggestions d'amelioration

## Etape 4-bis — Poster sur la plateforme (si configure)

Lire `platform` dans config.json. Si `type == null` ou `auto_post == false` : passer silencieusement.

**Strategie jq** :
```bash
bash .claude/review/scripts/post-review-comments.sh .claude/review/sessions/<slug>.json .claude/review/config.json
```
Afficher le resultat retourne (POSTED/SKIP/WARN).

**Strategie readwrite** :
1. Lire `platform` dans config.json. Si `type == null` ou `auto_post == false` : passer silencieusement.
2. Detecter le PR/MR :
   - GitHub : `gh pr list --head <branch> --json number --jq '.[0].number'`
   - GitLab : `glab mr list --source-branch <branch> -o json`
3. Si aucun PR/MR ouvert → "Aucun PR/MR ouvert. Publication sautee."
4. Construire le corps markdown (en-tete avec counts, observations bloquantes, suggestions en `<details>`, verdict)
5. Poster :
   - GitHub : `gh pr review <number> --request-changes --body "<body>"` si bloquants > 0, sinon `--comment`
   - GitLab : `glab mr note <iid> --message "<body>"`
6. Afficher confirmation ou message d'erreur

</review_workflow>
