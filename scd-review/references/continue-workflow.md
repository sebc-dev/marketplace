<continue_workflow>

## Workflow de reprise v2.1

### Étape 1 — Résoudre la session en cours

1. `git branch --show-current` → slug = branch.replace('/', '-')
2. Chercher les sessions via Glob :
   - `.claude/review/sessions/<slug>-followup.json`
   - `.claude/review/sessions/<slug>.json`

**Priorité de résolution :**
- Si `<slug>-followup.json` existe et `status == "in_progress"` → reprendre followup
- Sinon si `<slug>.json` existe et `status == "in_progress"` → **détecter le stade** (Étape 1-bis)
- Si les deux sont `"completed"` → "Toutes les sessions sont complétées. Lancez /scd-review:run pour une nouvelle review."
- Si aucune session → "Aucune session pour cette branche. Lancez /scd-review:run."

### Étape 1-bis — Détecter le stade de reprise (session review)

Pour `<slug>.json` `in_progress`, déterminer à quelle phase reprendre :

```bash
PENDING_FILES=$(bash .claude/review/scripts/scd.sh session pending-files \
  .claude/review/sessions/<slug>.json | wc -l)
DECISION_JSON=$(bash .claude/review/scripts/scd.sh session decision-summary \
  .claude/review/sessions/<slug>.json)
PENDING_DECISIONS=$(echo "$DECISION_JSON" | jq -r '.pending')
APPLY_COUNT=$(echo "$DECISION_JSON" | jq -r '.apply')
FIXED_COUNT=$(jq '[.files[].observations[] | select(.resolution == "fixed")] | length' \
  .claude/review/sessions/<slug>.json)
```

**Stade de reprise :**

| Condition | Stade | Action |
|---|---|---|
| `PENDING_FILES > 0` | **Phase 1-2** (review/validation incomplète) | Étape 2-4 ci-dessous (existant) |
| `PENDING_FILES == 0` ET `PENDING_DECISIONS > 0` | **Phase 3.0** (décisions en attente) | Étape 6 |
| `PENDING_FILES == 0` ET `PENDING_DECISIONS == 0` ET `APPLY_COUNT > FIXED_COUNT` | **Phase 3.5** (fix batch interrompu) | Étape 7 |
| Sinon | Phase 4 inachevée | Étape 8 (clôture directe) |

### Étape 2 — Afficher la progression

**Pour une session review (`<slug>.json`) :**
```bash
bash .claude/review/scripts/scd.sh session status .claude/review/sessions/<slug>.json
```

Afficher :
```
Reprise de review — <branch>
Progression : X/Y fichiers completés
🔴 Bloquants : B  🟡 Suggestions : S  🟢 Bons : G
Prochain fichier : <chemin> [<catégorie>]
```

**Pour une session followup (`<slug>-followup.json`) :**
Lire les champs `summary` et afficher le résumé des corrections/unaddressed/nouveaux.

### Étape 3 — Re-scoring des fichiers pending (v2)

Pour les sessions review, re-scorer les fichiers pending par risque :
```bash
bash .claude/review/scripts/scd.sh session pending-files \
  .claude/review/sessions/<slug>.json --sort-by=risk
```

Cela garantit que si l'interruption a eu lieu tôt dans le run, les fichiers critiques sont traités en priorité lors de la reprise (indépendamment de l'ordre initial).

### Étape 4 — Relancer les agents

**Pour une session review :**

Lancer les agents pour les fichiers pending dans l'ordre de risque (max `pipeline.max_parallel_agents` agents) :

Vérifier si un fichier contexte existe :
```bash
[[ -f ".claude/review/sessions/<slug>-context.md" ]] && context_ref="@.claude/review/sessions/<slug>-context.md"
```

Résoudre les modèles :
```bash
MODEL=$(bash .claude/review/scripts/scd.sh config resolve-model .claude/review/config.json code-reviewer)
```

Pour chaque fichier pending (dans l'ordre de risque, jusqu'à max agents) :
- Si catégorie == `tests` → lancer `test-reviewer`
- Sinon → lancer `code-reviewer` (MODE FULL)
- Injecter le contexte si présent

Stocker les task_ids dans la session.

**Pour une session followup :**
Router vers @references/followup-workflow.md à partir de l'étape 2-bis.

### Étape 5 — Continuer le workflow (Phase 1-2)

Reprendre la boucle de review/followup à partir du premier fichier pending :
- Récupérer les outputs des agents (`TaskOutput(block: true)`)
- Normaliser via `scd.sh agent validate-output`
- Persister observations + métriques
- Enchaîner la validation (review-validator per-file comme dans run-workflow)

Quand tous les fichiers sont reviewés/validés, **enchaîner sur Étape 6** (décisions interactives) — sauf si la session a été créée avec `flags.auto_fix == true` (vérifier via `config_snapshot.flags`).

### Étape 6 — Reprise Phase 3.0 (décisions interactives)

Si `PENDING_DECISIONS > 0` (et `PENDING_FILES == 0`), reprendre la phase de décision :

1. Annoncer :
   ```
   Reprise de la phase de décision — <branch>
   P observation(s) en attente
   ```
2. Suivre @references/decision-workflow.md à partir de l'**Étape 2** (la seed-decisions n'est plus nécessaire si déjà faite ; l'appel reste idempotent et peut être relancé sans risque).
3. À la fin de la boucle, enchaîner sur l'Étape 7 si des fixes sont en attente.

### Étape 7 — Reprise Phase 3.5 (fix batch)

Si `APPLY_COUNT > FIXED_COUNT` (et toutes les décisions sont prises), lancer le batch fix-applier :

1. Lister les observations `user_decision == "apply"` ET `resolution == null` :
   ```bash
   jq -c '[.files[] as $f | $f.observations[]
     | select(.user_decision == "apply")
     | select((.resolution // null) == null)
     | (. + {file_path: $f.path})] | .[]' \
     .claude/review/sessions/<slug>.json
   ```
2. Pour chaque observation, lancer `fix-applier` (séquentiel) — cf. Phase 3.5 du @references/run-workflow.md.
3. Une fois terminé, enchaîner sur l'Étape 8.

### Étape 8 — Clôture

```bash
bash .claude/review/scripts/scd.sh validation report \
  <slug> .claude/review/sessions
```

Afficher le rapport final (cf. Phase 4 de run-workflow.md).

**Cas particulier** : si des observations restent `user_decision == "defer"`, la session est marquée `completed` mais le verdict sera `attention_required`. L'utilisateur peut relancer `/scd-review:continue` plus tard si la session est repassée `in_progress` manuellement (rare), sinon il doit lancer un followup.

</continue_workflow>
