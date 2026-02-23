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

### 2-bis. Preparer les agents test-reviewer (lancement differe)

Apres la persistance du fichier session, identifier tous les fichiers de categorie `tests` dans la session et noter leur position dans l'ordre de review. **Ne PAS lancer les agents maintenant.** Le lancement se fera a l'etape 3a, quand un fichier de test se trouve dans les 3 prochains fichiers.

Si aucun fichier n'est de categorie `tests`, rien a preparer.

## Etape 3 — Review fichier par fichier

Pour chaque fichier `pending` dans l'ordre :

### 3a. En-tete + lancement anticipe des test-reviewers

Afficher :
```
Fichier X/Y : chemin/du/fichier [CATEGORIE]
```

**Lancement anticipe des agents test-reviewer :** Verifier si un fichier de categorie `tests` se trouve parmi les 3 prochains fichiers dans l'ordre de review (positions courante+1 a courante+3) ET que son agent n'a pas encore ete lance. Si oui, lancer l'agent en background :

```
Task(
  subagent_type: "general-purpose",
  run_in_background: true,
  description: "Test review: <nom-fichier>",
  prompt: "Tu es un test-reviewer specialise. Lis la definition d'agent dans ${CLAUDE_PLUGIN_ROOT}/.claude/agents/test-reviewer.md et suis ses instructions pour analyser le fichier <chemin-du-fichier>. Contexte git : merge-base=<sha>, base branch=<base>."
)
```

Stocker le task ID retourne dans la session JSON :

- **Strategie `jq`** : `bash .claude/review/scripts/add-test-tasks.sh .claude/review/sessions/<slug>.json '<json>'`
  ou `<json>` est un objet `{"fichier_test": "task_id"}`
- **Strategie `readwrite`** : Read + Write pour ajouter/mettre a jour `test_agent_tasks` dans le JSON.

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

Pour chaque observation, classifier le niveau :
- 🟢 **Bon** : Pattern ou choix remarquable
- 🟡 **Question** : Point a clarifier ou discuter
- 🔴 **Attention** : Probleme potentiel a adresser

Puis pour chaque observation 🟡/🔴, classifier la severite :

**Bloquant** (impact reel sur production ou maintenabilite) :
- Vulnerabilite securite confirmee (injection, XSS, auth bypass)
- Bug ou perte de donnees non geree
- Violation d'architecture qui cause un couplage fort ou dette technique majeure
- Erreur non geree sur un chemin critique
- Test absent pour un chemin critique de logique metier

**Suggestion** (amelioration sans risque immediat) :
- Style, nommage, preferences de formatage
- Optimisation de performance mineure sans impact mesurable
- Amelioration structurelle nice-to-have
- Tests supplementaires sur du code trivial
- Message d'erreur ameliorable

**Format d'affichage** (toutes les observations inline, dans l'ordre des criteres) :
```
### Observations

🔴 **security** [BLOQUANT] — Injection SQL dans le parametre `userId`...
🟡 **error-handling** [BLOQUANT] — Le catch ignore l'erreur silencieusement...
🟡 **conventions** [SUGGESTION] — Le nommage `getData` pourrait etre plus specifique...
🟡 **performance** [SUGGESTION] — Ce `.map().filter()` pourrait etre un seul `.reduce()`...
🟢 **architecture** — Bonne separation des responsabilites dans le service...
```

Les observations bloquantes sont listees en premier, suivies des suggestions, puis des 🟢. Chaque observation est stockee dans le tableau `observations` du fichier (criterion, severity, level, text) pour etre recuperee lors du followup.

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
- Etre detaille mais concis dans les explications
- Si un fichier est volumineux, se concentrer sur les changements les plus significatifs
- Utiliser des extraits de code du diff pour illustrer les points
- Adapter le niveau de detail a la complexite du fichier
- Ne pas hesiter a lire d'autres fichiers du projet pour donner du contexte
- Les criteres de review sont generiques — les adapter au langage et framework du projet (analyser les fichiers pour detecter le stack technique)
</guidelines>
