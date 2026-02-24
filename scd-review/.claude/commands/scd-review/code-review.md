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
- Mise a jour fichier : `bash .claude/review/scripts/update-file.sh <session> <idx> <g> <y> <r> "<note>" <blocking>`
- Ajout observations : `echo '<json_array>' | bash .claude/review/scripts/add-observations.sh <session> <idx>`
- Ajout commentaire : `bash .claude/review/scripts/add-comment.sh <session> "<file>" "<comment>"`
- Ajout agent tasks : `bash .claude/review/scripts/add-agent-tasks.sh <session> '<json>'`
- Synthese + cloture : `bash .claude/review/scripts/session-summary.sh <session>`

Si `json_strategy == "readwrite"`, utiliser Read + Write pour toutes les operations JSON.

## Charger les definitions d'agents

Lire `plugin_root` dans `.claude/review/config.json`. Si `null` → erreur : `Plugin root non configure. Lancez /scd-review:review-init d'abord.`

Lire les definitions d'agents pour les injecter dans les prompts des subagents :

1. Read `<plugin_root>/.claude/agents/code-reviewer.md` → retenir comme `CODE_REVIEWER_INSTRUCTIONS`
2. Read `<plugin_root>/.claude/agents/test-reviewer.md` → retenir comme `TEST_REVIEWER_INSTRUCTIONS`
3. Si l'un des fichiers est introuvable → erreur : `Agents introuvables dans <plugin_root>. Relancez /scd-review:review-init pour re-detecter le plugin root.`

Ces contenus seront passes directement dans les prompts Task (etapes 2-bis et 3f).

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
    subagent_type: "general-purpose",
    run_in_background: true,
    description: "Test review: <nom-fichier>",
    prompt: "Tu es un test-reviewer specialise. Voici ta definition d'agent :
<agent_instructions>
{TEST_REVIEWER_INSTRUCTIONS}
</agent_instructions>
Suis ces instructions pour analyser le fichier <chemin>. Contexte git : merge-base=<sha>, base branch=<base>."
  )
  ```
- **Sinon** → lancer un **code-reviewer** :
  ```
  Task(
    subagent_type: "general-purpose",
    run_in_background: true,
    description: "Code review: <nom-fichier>",
    prompt: "Tu es un code-reviewer specialise. Voici ta definition d'agent :
<agent_instructions>
{CODE_REVIEWER_INSTRUCTIONS}
</agent_instructions>
Suis ces instructions en MODE FULL pour analyser le fichier <chemin>. Contexte git : merge-base=<sha>, base branch=<base>."
  )
  ```

Stocker tous les task IDs dans la session JSON :

- **Strategie `jq`** : `bash .claude/review/scripts/add-agent-tasks.sh .claude/review/sessions/<slug>.json '<json>'`
  ou `<json>` est un objet `{"chemin/fichier1": "task_id_1", "chemin/fichier2": "task_id_2", ...}`
- **Strategie `readwrite`** : Read + Write pour ajouter/mettre a jour `agent_tasks` dans le JSON.

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

Recuperer le resultat de l'agent background pour ce fichier :

```
TaskOutput(task_id: agent_tasks["chemin/du/fichier"], block: true)
```

En pratique, l'agent aura eu le temps de finir pendant la review des fichiers precedents (lance au moins 1 fichier en avance).

Afficher le rapport retourne par l'agent tel quel. Le rapport contient :
- **Changements** : description de ce qui a change, pourquoi, contexte
- **Observations** : liste classee des observations avec niveaux et severites
- Pour les fichiers de test : le rapport test-reviewer inclut egalement l'execution des tests, la qualite et la couverture

La conversation principale ne lit PAS les fichiers ni les diffs elle-meme. Elle se contente de presenter le rapport de l'agent. Cela economise le contexte de la conversation principale.

### 3c. Extraire les metriques du rapport

Parser le rapport de l'agent pour extraire :
- La section `### Metriques` → valeurs green, yellow, red, blocking, note
- La section `### Observations JSON` → le tableau JSON des observations

Ces valeurs sont utilisees pour la persistance session (3d) et les checkpoints (3e).

### 3d. Mettre a jour la session JSON

Mettre a jour le fichier en cours dans la session :
- `status` → `"completed"`
- `green`, `yellow`, `red` → les decomptes d'observations
- `blocking` → nombre d'observations bloquantes (🟡/🔴 classees bloquant)
- `note` → resume en 120 caracteres max

**Strategie `jq`** (2 commandes sequentielles) :

1. Counts + status :
```bash
bash .claude/review/scripts/update-file.sh .claude/review/sessions/<slug>.json <index> <green> <yellow> <red> "<note>" <blocking>
```

2. Observations (pipe le JSON array directement) :
```bash
echo '[{"criterion":"security","severity":"bloquant","level":"red","text":"Injection SQL..."},{"criterion":"conventions","severity":"suggestion","level":"yellow","text":"Nommage generique..."}]' | bash .claude/review/scripts/add-observations.sh .claude/review/sessions/<slug>.json <index>
```

Le script recalcule automatiquement le summary par agregation et affiche le summary mis a jour.

**Strategie `readwrite`** : Read complet du JSON + Write complet avec les valeurs mises a jour + observations + blocking (1 seul cycle lecture/ecriture par fichier).

### 3e. Point de controle utilisateur (barriere programmatique)

Utiliser `AskUserQuestion` pour bloquer la progression jusqu'a une action explicite de l'utilisateur :

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
- **"Ajouter un commentaire"** → demander le commentaire, l'enregistrer (voir ci-dessous), puis re-afficher le AskUserQuestion
- **"Approfondir un point"** → traiter la demande de l'utilisateur, puis re-afficher le AskUserQuestion
- **"Other" / texte libre** → traiter comme "Approfondir un point", puis re-afficher le AskUserQuestion

Cette boucle garantit que Claude ne peut PAS avancer au fichier suivant tant que l'utilisateur n'a pas explicitement choisi "Fichier suivant". Meme si un agent background termine, le AskUserQuestion bloque la progression.

**Enregistrement des commentaires :**

- **Strategie `jq`** : `bash .claude/review/scripts/add-comment.sh .claude/review/sessions/<slug>.json "<file>" "<comment>"`
- **Strategie `readwrite`** : Read + Write pour appender dans `user_comments`.

### 3f. Lancer l'agent suivant (pipeline glissant)

Apres que l'utilisateur choisit "Fichier suivant", alimenter le pipeline :

```
next_to_launch = fichier_courant.index + 5
Si next_to_launch <= total_files ET agent_tasks ne contient pas ce fichier :
  Lancer l'agent appropriate (code-reviewer ou test-reviewer) en background
  Stocker le task_id dans agent_tasks via add-agent-tasks.sh
```

Cela maintient une fenetre glissante de 5 agents : quand on consomme le resultat d'un fichier, on lance l'agent du fichier 5 positions plus loin. Le max de 5 agents en parallele est ainsi garanti.

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

   | # | Fichier | Categorie | 🟢 | 🟡 | 🔴 | B |
   |---|---------|-----------|----|----|-----|---|
   | 1 | ...     | ...       |  X |  Y |  Z  | B |
   |   | TOTAL   |           | XX | YY | ZZ  | BB|
   ```
3. Lister les commentaires utilisateur si presents
4. Marquer la session `status: "completed"` + `head_at_completion: <git rev-parse HEAD>` dans le JSON

Puis dans les deux cas, fournir le verdict :
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
4. Construire le corps markdown (meme format que le script : en-tete avec counts, observations bloquantes, suggestions en `<details>`, verdict)
5. Poster :
   - GitHub : `gh pr review <number> --request-changes --body "<body>"` si bloquants > 0, sinon `--comment`
   - GitLab : `glab mr note <iid> --message "<body>"`
6. Afficher confirmation ou message d'erreur

</process>

<guidelines>
- Toujours communiquer en francais
- La conversation principale ne lit PAS les fichiers ni les diffs directement — c'est le role des agents
- Presenter le rapport de l'agent tel quel, sans re-analyser le code
- Si l'utilisateur choisit "Approfondir un point", la conversation peut lire des fichiers supplementaires a la demande (deep-dive exceptionnel)
- Economiser le contexte : chaque fichier ne devrait consommer que ~100-200 tokens dans la conversation principale (affichage du rapport + checkpoint)
- Le pipeline de 5 agents garantit zero temps d'attente : les agents finissent pendant que l'utilisateur review les fichiers precedents
</guidelines>
