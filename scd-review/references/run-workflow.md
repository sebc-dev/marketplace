<run_workflow>

## Vue d'ensemble

Pipeline v2 en 4 phases enchaînées. Zéro checkpoint humain sauf mi-parcours optionnel et escalations.

```
Phase 0 — Context Resolution  (script déterministe, si --context)
Phase 1 — Review Pipeline     (code-reviewer / test-reviewer en pipeline glissant)
Phase 2 — Validation chaînée  (review-validator dès qu'un fichier est reviewé)
Phase 3 — Dispatch            (--fix → fix-applier | --post → inline | les deux)
Phase 4 — Rapport consolidé
```

Comportement par défaut (sans flag) : `--fix` — self-review avec application des corrections.

## Phase 0 — Résolution du contexte (si --context)

Si la commande reçoit un ou plusieurs `--context <type>:<value>` :

1. Lire le sessions_dir depuis config.json
2. Pour chaque source de contexte, appeler :
   ```bash
   bash .claude/review/scripts/scd.sh context resolve <type> <value> \
     .claude/review/sessions <branch> .claude/review/config.json
   ```
   Types supportés : `ticket`, `file`, `url` — voir @references/context-resolution.md

3. Afficher le résultat (RESOLVED/WARN) pour chaque source
4. Le fichier `.claude/review/sessions/<slug>-context.md` sera injecté dans les prompts des agents review si il existe

## Phase 1 — Review (pipeline glissant)

### 1a. Contexte git

```bash
git branch --show-current        # branche courante
git merge-base <base_branch> HEAD  # merge_base
git diff --name-status <merge_base>..HEAD  # fichiers modifiés
git log --oneline --reverse <merge_base>..HEAD  # commits
```

Base branch = argument fourni, sinon `options.default_base_branch` dans config.json, sinon `main`.

### 1b. Sélection du périmètre

Si `--context` fourni → afficher le contexte résolu comme information.

Calculer la liste des fichiers :
1. Appliquer le filtre `max_files_per_run` depuis config.json (défaut : 20)
2. Si le diff dépasse le seuil → tronquer + message informatif :
   ```
   ── Circuit breaker ──────────────────────────────────
   Diff: 34 fichiers — seuil: 20 fichiers
   Ce run traitera les 20 fichiers les plus risqués.
   Utilisez /scd-review:continue pour les 14 restants.
   ─────────────────────────────────────────────────────
   ```

### 1c. Création de la session v2

Fichier `.claude/review/sessions/<slug>.json` :
```json
{
  "session_id": "<slug>-<YYYYMMDD>-<HHMM>",
  "type": "review",
  "version": "2.0.0",
  "branch": "<branche>",
  "base_branch": "<base>",
  "merge_base": "<sha>",
  "head_at_start": "<sha>",
  "created_at": "<ISO-8601>",
  "status": "in_progress",
  "config_snapshot": {
    "model_profile": "<profil>",
    "default_output": "<output>",
    "max_parallel_agents": 5,
    "validator_threshold": 0.75
  },
  "context_sources": [],
  "files": [{
    "index": 1,
    "path": "<chemin>",
    "category": "<catégorie>",
    "risk_score": 0,
    "status": "pending",
    "green": 0, "yellow": 0, "red": 0, "blocking": 0,
    "observations": [],
    "note": ""
  }],
  "agent_tasks": {},
  "summary": {
    "total_files": 0, "completed": 0,
    "green": 0, "yellow": 0, "red": 0, "blocking": 0,
    "fixed": 0, "posted": 0, "skipped": 0, "escalated": 0
  },
  "user_comments": []
}
```

Remplir `context_sources` si `--context` a été fourni.

Classifier chaque fichier selon `category_priority` dans config.json :

| Catégorie | Patterns typiques |
|---|---|
| build-config | package.json, Cargo.toml, build.gradle, *.config.*, CI, Dockerfile |
| database-migrations | migrations/, changelogs, schema, *.sql |
| domain-models | models/, entities/, domain/, types, schemas |
| infrastructure | utils/, helpers/, lib/, shared/, base classes |
| business-logic | services/, use-cases/, handlers/, core logic |
| controllers-api | controllers/, routes/, api/, endpoints, +server.ts |
| views-ui | views/, components/, pages/, templates, +page.svelte |
| integration-wiring | config/, DI, app.module, providers |
| tests | test/, tests/, spec/, *.test.*, *.spec.* |
| i18n-docs | *.md, messages.properties, locales/, i18n/ |

Calculer un `risk_score` par fichier pour la priorisation (0.0–1.0) :
```
risk_score = category_priority_index_inverted × 0.6 + diff_lines_normalized × 0.4
```
(`category_priority_index_inverted` = (total_categories - index) / total_categories)

Écrire le JSON avec Write.

### 1d. Résoudre les modèles

Avant de lancer les agents, résoudre une fois les modèles depuis config :
```bash
MODEL_REVIEWER=$(bash .claude/review/scripts/scd.sh config resolve-model .claude/review/config.json code-reviewer)
MODEL_VALIDATOR=$(bash .claude/review/scripts/scd.sh config resolve-model .claude/review/config.json review-validator)
MODEL_FIXER=$(bash .claude/review/scripts/scd.sh config resolve-model .claude/review/config.json fix-applier)
MODEL_SCOUT=$(bash .claude/review/scripts/scd.sh config resolve-model .claude/review/config.json scout-alpha)
```

### 1e. Lancer le premier batch (pipeline glissant)

Lancer les `min(max_parallel_agents, total_files)` premiers agents en background.

**Pour chaque fichier eligible (non supprimé) :**

- Vérifier si un fichier contexte existe :
  ```bash
  context_ref=""
  [[ -f ".claude/review/sessions/<slug>-context.md" ]] && \
    context_ref="@.claude/review/sessions/<slug>-context.md"
  ```

- **Si catégorie == `tests`** :
  ```
  Task(
    subagent_type: "test-reviewer",
    run_in_background: true,
    model: "<MODEL_REVIEWER>",
    description: "Test review: <nom-fichier>",
    prompt: "Fichier: <chemin>. merge_base=<sha>, base_branch=<base>.
<context_ref>"
  )
  ```

- **Sinon** :
  ```
  Task(
    subagent_type: "code-reviewer",
    run_in_background: true,
    model: "<MODEL_REVIEWER>",
    description: "Code review: <nom-fichier>",
    prompt: "MODE FULL. Fichier: <chemin>. merge_base=<sha>, base_branch=<base>.
<context_ref>"
  )
  ```

Stocker les task_ids :
```bash
bash .claude/review/scripts/scd.sh session add-agent-tasks \
  .claude/review/sessions/<slug>.json '<{"chemin/fichier": "task_id", ...}>'
```

### 1f. Boucle review + pipeline glissant

Pour chaque fichier `pending` dans l'ordre (trié par `risk_score` descendant) :

**1. Récupérer le rapport :**
```
TaskOutput(task_id: agent_tasks["chemin/fichier"], block: true)
```

**2. Normaliser la sortie :**
```bash
echo "<agent_output>" | bash .claude/review/scripts/scd.sh agent validate-output
```
Si exit 2 → log WARN, marquer fichier comme completed avec 0 observations, continuer.

**3. Persister les observations :**
```bash
echo '<obs_json>' | bash .claude/review/scripts/scd.sh session add-observations \
  .claude/review/sessions/<slug>.json <index>
```

**4. Persister les métriques :**
```bash
bash .claude/review/scripts/scd.sh session update-file \
  .claude/review/sessions/<slug>.json <idx> <g> <y> <r> "<note>" <blocking> <risk_score>
```

## Phase 2 — Validation chaînée

Dès qu'un fichier est reviewé, lancer immédiatement review-validator sur ce fichier (pas de batch séparé).

**Condition de lancement :** fichier a des observations red ou yellow ET `validator.enabled == true`.

Si `validator.skip_green == true` (défaut) : pré-marquer les observations green :
```json
{ ..., "validator_decision": "skip", "validator_confidence": 1.0, "validator_reason": "Green observation" }
```

**Lancer le validator en background :**
```
Task(
  subagent_type: "review-validator",
  run_in_background: true,
  model: "<MODEL_VALIDATOR>",
  description: "Validate: <nom-fichier>",
  prompt: "session_path=.claude/review/sessions/<slug>.json
file_path=<chemin>
observations=<JSON observations non-green>
diff_context=<git diff merge_base..HEAD -- chemin>"
)
```

**Collecter le résultat du validator :**
1. `TaskOutput(validator_task_id, block: true)`
2. Extraire `Decisions JSON:` du rapport
3. Persister via :
   ```bash
   bash .claude/review/scripts/scd.sh validation update \
     .claude/review/sessions/<slug>.json "<chemin>" '<decisions_json>'
   ```

**Checkpoint mi-parcours (optionnel) :**

Si `pipeline.midpoint_checkpoint == true` dans config.json ET 50% des fichiers complétés :
```
━━━ Review Progress: N/M files ━━━
🔴 Blocking: X  🟡 Suggestions: Y  🟢 Good: Z
Escalations: E  |  Estimated remaining: ~K agent calls
Continue? [Y/n]
```
Ce checkpoint est le seul point d'interaction humaine dans le flux. Si l'utilisateur répond non → générer le rapport partiel et s'arrêter.

**Pipeline glissant (combiné review + validation) :**

La contrainte `max_parallel_agents` s'applique au total des agents actifs (review + validation). Quand un agent se libère → lancer le prochain fichier en attente.

```
Slots disponibles = max_parallel_agents - agents_review_actifs - agents_validation_actifs
Tant que slots > 0 ET fichiers pending → lancer agents
```

## Phase 3 — Dispatch selon flags

Après que tous les fichiers sont reviewés et validés :

### 3a. Résumé pré-dispatch
```
── Dispatch ──────────────────────────────────────────
Apply : X observations  |  Skip : Y  |  Escalate : Z
Mode  : <--fix | --post | --fix --post>
──────────────────────────────────────────────────────
```

### 3b. Escalations (si présentes)

Pour chaque observation avec `validator_decision == "escalate"` :
```
AskUserQuestion(
  questions: [{
    question: "Observation escaladée — décision requise",
    header: "Escalation",
    options: [
      { label: "Appliquer", description: "fix-applier corrige cette observation" },
      { label: "Sauter", description: "Ignorer cette observation" },
      { label: "Discuter", description: "Analyser avant de décider" }
    ]
  }]
)
```
Mettre à jour `validator_decision` selon la décision utilisateur.

### 3c. Mode --fix (défaut)

Pour chaque observation avec `validator_decision == "apply"` :

```
Task(
  subagent_type: "fix-applier",
  model: "<MODEL_FIXER>",
  description: "Fix: <critère> in <nom-fichier>",
  prompt: "file_path=<chemin>
observation=<JSON observation avec correction_prompt>"
)
```

Attendre chaque fix (séquentiel pour éviter les conflits) :
1. `TaskOutput(fix_task_id, block: true)`
2. Parser `### Status: applied | skipped_ambiguous`
3. Si `applied` → marquer observation `resolution: "fixed"` + incrémenter `summary.fixed`
4. Si `skipped_ambiguous` → marquer `resolution: "skipped"` + incrémenter `summary.skipped`

Mise à jour via :
```bash
# Après chaque fix (inline via jq ou readwrite)
jq --arg path "<chemin>" --argjson obs_update '<{...}>' '
  (.files[] | select(.path == $path)).observations[] |=
    if .id == "<obs_id>" then . + $obs_update else . end
' .claude/review/sessions/<slug>.json
```

### 3d. Mode --post

Pour chaque observation avec `validator_decision == "apply"` ou `"escalate"` avec décision finale :

```bash
bash .claude/review/scripts/scd.sh post inline-comments \
  .claude/review/sessions/<slug>.json .claude/review/config.json <filter>
```

Filter selon config : `blocking` (défaut) ou `all`.

Si des orphelins sont générés :
```bash
bash .claude/review/scripts/scd.sh post orphan-summary \
  .claude/review/sessions/<slug>.json .claude/review/config.json
```

Marquer les observations postées `resolution: "posted"` + incrémenter `summary.posted`.

### 3e. Mode --post --fix

Exécuter 3c (fix) PUIS 3d (post). Le post inclut les corrections déjà appliquées (avec `resolution: "fixed"`) si filter = `all`, sinon seulement les bloquants restants.

## Phase 4 — Rapport consolidé

```bash
bash .claude/review/scripts/scd.sh validation report \
  <slug> .claude/review/sessions
```

Afficher le rapport :

```
# Run Report — <branch>

## Résumé
- Fichiers analysés : N (M filtrés par seuil)
- Observations : T (B bloquantes, Y suggestions, G bonnes)
- Validation : A apply | S skip | E escalate
- Résolutions : F fixés | P postés | K sautés | E escaladés

## Escalations (décision humaine utilisée)
[Liste : fichier | critère | raison validator | décision finale]

## Corrections appliquées
[Liste : fichier | critère | ligne(s)]

## Verdict
ready_to_merge | attention_required | blocked

---
Utilisez /scd-review:followup pour vérifier les corrections.
Utilisez /scd-review:continue si des fichiers restent à traiter.
```

Clore la session :
```bash
bash .claude/review/scripts/scd.sh session summary \
  .claude/review/sessions/<slug>.json
```

</run_workflow>
