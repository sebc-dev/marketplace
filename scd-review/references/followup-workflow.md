<followup_workflow>

## Version v2

Les observations dans la session followup incluent les champs v2 : `correction_prompt`, `line_start`, `line_end`, `validator_decision`, `resolution`.
Les scripts de mise à jour utilisent `scd.sh followup *` (dispatcher v2) au lieu des anciens scripts séparés.

Pas de `auto_mode` en v2 — le followup est toujours interactif (contrairement à auto-review qui était séparé).
Les checkpoints utilisateur restent pour les décisions de verdict (résolu/partiellement/non résolu).

## Etape 0 — Trouver la session precedente

1. `git branch --show-current`, calculer le slug (remplacer `/` par `-`)
2. Chercher les sessions existantes via Glob :
   - `.claude/review/sessions/<slug>-followup.json`
   - `.claude/review/sessions/<slug>.json`

**Si `<slug>-followup.json` existe et `status == "in_progress"` :**
Proposer la reprise (afficher progression), puis aller a Etape 3.

**Trouver la derniere session completee :**
- Si `<slug>-followup.json` existe et `status == "completed"` → utiliser comme session precedente (round N+1)
- Sinon si `<slug>.json` existe et `status == "completed"` → utiliser comme session precedente (round 2)
- Sinon → erreur : "Aucune review completée pour cette branche. Lancez /scd-review:run d'abord."

**Valider `head_at_completion` :**
- Si le champ est absent → erreur : "Session sans `head_at_completion`. Relancez une review complete avec /scd-review:code-review pour generer ce champ."
- Valider que le SHA existe : `git cat-file -t <sha>`. Si erreur → "Le SHA de reference n'existe plus (branche rebasee ?). Relancez une review complete."

## Etape 1 — Analyser les corrections

1. `previous_head` = `head_at_completion` de la session precedente
2. Generer le diff :
   ```bash
   git diff --find-renames --name-status previous_head..HEAD > /tmp/followup-diff.txt
   ```
3. Si le fichier est vide → "Aucun commit depuis la cloture de la review precedente. Rien a verifier." → sortir

4. **Strategie `jq`** — classification automatique :
   ```bash
   bash .claude/review/scripts/scd.sh followup classify <previous_session> /tmp/followup-diff.txt
   ```
   Le script lit la session precedente, le diff, classe les fichiers (blocking > 0 + modifie → correction, blocking > 0 + non modifie → unaddressed, reste → new), extrait les contextes originaux (observations, notes, comments), gere renommages et suppressions, retourne un JSON structure.

   Claude ne lit jamais la session precedente directement.

   **Strategie `readwrite`** — Read de la session precedente, parse du diff manuellement, classification manuelle.

5. Presenter le resume de classification :
   ```
   Followup de review — <branche> (round N)
   Session precedente : <chemin> (cloturee le <date>)
   Commits depuis la cloture : <nombre>

   Classification :
   - Corrections : X fichiers (fichiers avec bloquants modifies)
   - Non adresses : Y fichiers (fichiers avec bloquants non modifies)
   - Nouveaux : Z fichiers (fichiers modifies sans bloquants precedents)
   ```
6. **Si auto_mode.enabled** → pas de confirmation, continuer directement
   **Sinon** → confirmer avec l'utilisateur avant de continuer

## Etape 2 — Creer la session followup

Creer le fichier `.claude/review/sessions/<slug>-followup.json` :

```json
{
  "type": "followup",
  "round": 2,
  "branch": "<branche>",
  "base": "<base-branch>",
  "merge_base": "<sha>",
  "previous_head": "<head_at_completion>",
  "previous_session": "<chemin>",
  "created_at": "<ISO-8601>",
  "status": "in_progress",
  "summary": {
    "total_files": 0,
    "completed": 0,
    "resolved": 0,
    "partially_resolved": 0,
    "unresolved": 0,
    "new_green": 0,
    "new_yellow": 0,
    "new_red": 0
  },
  "files": [{
    "index": 1,
    "path": "chemin/fichier.ext",
    "category": "business-logic",
    "review_type": "correction",
    "original_note": "Auth manque validation CSRF",
    "original_blocking": 1,
    "original_green": 2,
    "original_yellow": 1,
    "original_red": 1,
    "original_observations": [
      { "criterion": "security", "severity": "bloquant", "level": "red", "text": "Injection SQL via userId" }
    ],
    "original_comments": ["Verifier endpoint /api/admin"],
    "status": "pending",
    "resolution": null,
    "green": 0,
    "yellow": 0,
    "red": 0,
    "note": ""
  }],
  "user_comments": []
}
```

Ordre des fichiers : corrections (triees par `original_red` descendant) → unaddressed → new (par `category_priority`).

Les fichiers `correction` avec `resolution: "auto_resolved_deleted"` sont pre-marques `status: "completed"` (fichier supprime = correction auto-resolue).

### 2-bis. Lancer le premier batch d'agents (pipeline de 5)

Apres la persistance de la session, lancer les agents pour les **5 premiers fichiers qui necessitent un agent** (exclure les fichiers `unaddressed` et les fichiers supprimes auto-resolus) :

**Pour chaque fichier eligible, dans l'ordre, jusqu'a 5 agents lances :**

- **Fichiers `correction`** → lancer un agent en **mode CORRECTION** :
  - Si categorie == `tests` → `Task(subagent_type: "test-reviewer", run_in_background: true, description: "Correction review: <nom-fichier>", prompt: "MODE CORRECTION. Fichier: <chemin>. previous_head=<sha>.")`
  - Sinon → `Task(subagent_type: "code-reviewer", run_in_background: true, description: "Correction review: <nom-fichier>", prompt: "MODE CORRECTION. Fichier: <chemin>. previous_head=<sha>. Observations bloquantes originales : [...] Commentaires : [...]")`

- **Fichiers `new`** → lancer un agent en **mode FULL** :
  - Si categorie == `tests` → `Task(subagent_type: "test-reviewer", run_in_background: true, description: "Test review: <nom-fichier>", prompt: "Fichier: <chemin>. merge_base=<sha>, base_branch=<base>.")`
  - Sinon → `Task(subagent_type: "code-reviewer", run_in_background: true, description: "Code review: <nom-fichier>", prompt: "MODE FULL. Fichier: <chemin>. merge_base=<sha>, base_branch=<base>.")`

Stocker les task IDs dans la session JSON :
- **Strategie `jq`** : `bash .claude/review/scripts/scd.sh session add-agent-tasks .claude/review/sessions/<slug>-followup.json '<json>'`
- **Strategie `readwrite`** : Read + Write pour ajouter `agent_tasks` dans le JSON.

Ecrire le JSON avec Write.

## Etape 3 — Review fichier par fichier

Pour chaque fichier `pending` dans l'ordre :

### Fichiers `correction`

En-tete :
```
Fichier X/Y : chemin/fichier.ext [CORRECTION]
```

Afficher le contexte original (depuis la session followup elle-meme — pas besoin de lire la session precedente) :
```
### Contexte de la review precedente
Note : "Auth manque validation CSRF"
Observations bloquantes :
- 🔴 **security** — Injection SQL via parametre userId
- 🟡 **error-handling** — Le catch ignore l'erreur silencieusement
Suggestions :
- 🟡 **conventions** — Nommage getData trop generique
Commentaires du revieweur :
- "Verifier aussi le endpoint /api/admin"
```

Puis recuperer le rapport de l'agent :
1. `TaskOutput(task_id: agent_tasks["chemin/fichier.ext"], block: true)`
2. Afficher le rapport retourne par l'agent (inclut la verification des bloquants originaux + nouvelles observations)
3. Extraire les metriques et observations JSON du rapport
4. Point de controle :

**Si auto_mode.enabled :**
- Deduire le verdict automatiquement depuis le rapport agent (section "Resolution suggeree")
- Logger `[AUTO] followup fichier X/Y — verdict: <resolution>` via add-comment.sh
- Continuer sans pause

**Sinon (mode interactif — comportement v0.11.0 inchange) :**

```
AskUserQuestion(
  questions: [{
    question: "Verdict pour ce fichier ?",
    header: "Fichier X/Y [CORRECTION]",
    options: [
      { label: "Resolu", description: "Toutes les observations bloquantes sont adressees" },
      { label: "Partiellement resolu", description: "Certaines observations bloquantes restent" },
      { label: "Non resolu", description: "Les observations bloquantes ne sont pas adressees" },
      { label: "Ajouter un commentaire", description: "Enregistrer un commentaire" },
      { label: "Approfondir un point", description: "Poser des questions ou discuter" }
    ],
    multiSelect: false
  }]
)
```

Comportement en boucle : "Ajouter un commentaire" et "Approfondir un point" re-affichent le checkpoint. Les trois premiers choix avancent au fichier suivant.

Mise a jour JSON :
- **Strategie `jq`** : `bash .claude/review/scripts/scd.sh followup update-file <session> <idx> <g> <y> <r> "<note>" "<resolution>"`
- **Strategie `readwrite`** : Read + Write

### Fichiers `unaddressed`

En-tete :
```
Fichier X/Y : chemin/fichier.ext [NON ADRESSE]
```

Afficher le contexte original (depuis la session followup). Indiquer : "Ce fichier n'a pas ete modifie depuis la review."

Point de controle :

```
AskUserQuestion(
  questions: [{
    question: "Ce fichier avec bloquants n'a pas ete modifie. Que faire ?",
    header: "Fichier X/Y [NON ADRESSE]",
    options: [
      { label: "Accepte tel quel", description: "Les bloquants sont acceptes, pas de correction necessaire" },
      { label: "Reste a corriger", description: "Ce fichier devra etre corrige dans un prochain round" },
      { label: "Ajouter un commentaire", description: "Enregistrer un commentaire" }
    ],
    multiSelect: false
  }]
)
```

- "Accepte tel quel" → resolution `resolved`, avancer
- "Reste a corriger" → resolution `unresolved`, avancer
- "Ajouter un commentaire" → enregistrer, re-afficher le checkpoint

Mise a jour JSON : meme scripts/strategie que pour corrections (green/yellow/red restent a 0 pour unaddressed).

### Fichiers `new`

En-tete :
```
Fichier X/Y : chemin/fichier.ext [NOUVEAU]
```

Si `original_observations` est present (fichier etait dans la review precedente avec 🟢/suggestions) : afficher le contexte en information.

Recuperer le rapport de l'agent :
1. `TaskOutput(task_id: agent_tasks["chemin/fichier.ext"], block: true)`
2. Afficher le rapport retourne par l'agent (review complete avec systeme bloquant/suggestion)
3. Extraire les metriques et observations JSON du rapport
4. Point de controle standard :

```
AskUserQuestion(
  questions: [{
    question: "Review du fichier terminee. Que souhaitez-vous faire ?",
    header: "Fichier X/Y [NOUVEAU]",
    options: [
      { label: "Fichier suivant", description: "Passer au prochain fichier" },
      { label: "Promouvoir une suggestion", description: "Passer une suggestion en bloquant" },
      { label: "Ajouter un commentaire", description: "Enregistrer un commentaire" },
      { label: "Approfondir un point", description: "Poser des questions ou discuter" }
    ],
    multiSelect: false
  }]
)
```

Mise a jour JSON : `update-followup-file.sh` avec `resolution: "null"` (pas de resolution pour les nouveaux fichiers).

### Pipeline glissant (tous types sauf unaddressed)

Apres que l'utilisateur avance au fichier suivant, alimenter le pipeline :

```
Chercher le prochain fichier eligible (correction ou new, pas unaddressed) qui n'a pas
encore d'agent lance. S'il existe et qu'il reste de la capacite (< 5 agents en vol) :
  Lancer l'agent appropriate (code-reviewer ou test-reviewer) en background
  Stocker le task_id dans agent_tasks via add-agent-tasks.sh
```

### Observations et persistance (tous types)

Apres la mise a jour du fichier, pipe les observations au script :
```bash
echo '<json_array>' | bash .claude/review/scripts/scd.sh session add-observations <session> <idx>
```

## Etape 4 — Synthese followup

Apres le dernier fichier :

**Strategie `jq`** :
```bash
bash .claude/review/scripts/scd.sh followup summary .claude/review/sessions/<slug>-followup.json
```
Le script genere le tableau recapitulatif par section (corrections/non adresses/nouveaux), marque la session `completed` + `head_at_completion`. Afficher la sortie telle quelle.

**Strategie `readwrite`** :
1. Lire le fichier session JSON complet
2. Construire le tableau par section (corrections, non adresses, nouveaux)
3. Resume : X resolus, Y partiellement resolus, Z non resolus
4. Marquer la session `status: "completed"` + `head_at_completion: <git rev-parse HEAD>`

Verdict final :
- "Pret a merger" si 0 bloquants non resolus
- "Encore X bloquants a adresser" sinon, avec la liste des fichiers concernes

## Etape 4-bis — Poster sur la plateforme (si configure)

Lire `platform` dans config.json. Si `type == null` ou `auto_post == false` : passer silencieusement.

**Strategie jq** :
```bash
bash .claude/review/scripts/post-review-comments.sh .claude/review/sessions/<slug>-followup.json .claude/review/config.json
```
Afficher le resultat retourne (POSTED/SKIP/WARN).

**Strategie readwrite** :
1. Lire `platform` dans config.json. Si `type == null` ou `auto_post == false` : passer silencieusement.
2. Detecter le PR/MR :
   - GitHub : `gh pr list --head <branch> --json number --jq '.[0].number'`
   - GitLab : `glab mr list --source-branch <branch> -o json`
3. Si aucun PR/MR ouvert → "Aucun PR/MR ouvert. Publication sautee."
4. Construire le corps markdown (format followup : en-tete avec resolution counts, observations bloquantes restantes, verdict)
5. Poster avec le bon statut :
   - GitHub : `gh pr review <number> --approve --body "<body>"` si tout est resolu, sinon `--request-changes`
   - GitLab : `glab mr note <iid> --message "<body>"`
6. Afficher confirmation ou message d'erreur

</followup_workflow>
