<auto_review_workflow>

## Vue d'ensemble

Pipeline automatique 5 phases sans interaction utilisateur. Chaque phase est sequentielle — la suivante depend du resultat de la precedente.

Prerequis : `auto_mode.enabled == true` dans config.json (force par le dispatcher auto-review).

## Phase 1 — Review automatique

Executer @references/review-workflow.md avec `auto_mode.enabled == true`.

Les guards auto dans review-workflow.md gerent :
- Pas de confirmation de l'ordre des fichiers (etape 2)
- Action par defaut "next" apres chaque fichier (etape 3e)
- Log `[AUTO]` pour chaque action automatique

A la fin de cette phase, la session review est `completed` avec toutes les observations.

## Phase 2 — Validation par review-validator

Lire la session completee. Pour chaque fichier ayant des observations red ou yellow :

### 2a. Filtrage pre-validation

Si `validator.skip_green == true` dans config.json :
- Filtrer les observations `level: "green"` — elles ne sont pas envoyees au validator
- Leur attribuer directement `validation: {"decision": "skip", "confidence": 1.0, "reason": "Green observation"}`

### 2b. Lancement du validator par fichier

Pour chaque fichier avec des observations non-green, par batch de `validator.batch_size` fichiers en parallele :

```
Task(
  subagent_type: "review-validator",
  run_in_background: true,
  description: "Validate: <filename>",
  prompt: "session_path=<session_path>
file_path=<file_path>
observations=<JSON array des observations non-green du fichier>
diff_context=git diff <merge_base>..HEAD -- <file_path>"
)
```

### 2c. Collecte des resultats

Pour chaque validator termine :
1. `TaskOutput(task_id, block: true)`
2. Parser le rapport selon @references/agent-output-format.md (format review-validator)
3. Persister les decisions via @references/session-protocol.md (update validation) :
   - **Strategie jq** : `bash .claude/review/scripts/update-validation.sh <session> <file-path> '<decisions-json>'`
   - **Strategie readwrite** : Read session + enrichir chaque observation avec `.validation` + Write

### 2d. Resume de validation

Afficher :
```
Validation terminee — <branch>
- Apply : X observations (fix valide et confirme)
- Skip : Y observations (faux positif ou bruit)
- Escalate : Z observations (decision humaine requise)
- Confiance moyenne : 0.XX
```

## Phase 3 — Apply selectif

Executer @references/apply-workflow.md avec `auto_mode.enabled == true`.

Les guards auto dans apply-workflow.md gerent :
- `validation.decision == "apply"` → fix-applier lance automatiquement
- `validation.decision == "skip"` → observation sautee automatiquement
- `validation.decision == "escalate"` → selon `auto_mode.escalate_to_user` :
  - `true` : AskUserQuestion pour cette observation uniquement
  - `false` : observation sautee avec log `[AUTO] escalate skipped`

Collecter les observations escaladees pour le rapport final.

A la fin de cette phase, la session apply est `completed`.

## Phase 4 — Followup automatique

Si au moins une observation a ete appliquee en phase 3 :

Executer @references/followup-workflow.md avec `auto_mode.enabled == true`.

Les guards auto dans followup-workflow.md gerent :
- Pas de confirmation de la classification (etape 1)
- Verdicts deduits automatiquement du rapport agent (etape 3)
- Resolutions acceptees sans checkpoint

A la fin de cette phase, la session followup est `completed`.

Si aucune observation appliquee → sauter cette phase et le mentionner dans le rapport.

## Phase 5 — Rapport consolide

### 5a. Generation du rapport

**Strategie jq** :
```bash
bash .claude/review/scripts/auto-report.sh <session-slug> <sessions-dir>
```
Le script consolide review + validation + apply + followup.

**Strategie readwrite** :
Lire les 4 sessions et construire le rapport manuellement.

### 5b. Affichage du rapport

```
# Auto-Review Report — <branch>

## Resume
- Fichiers analyses : X
- Observations totales : Y (Z bloquantes)
- Validees apply : A | skip : S | escalate : E
- Corrections appliquees : C | sautees : K | rejetees : R
- Followup : F resolus | P partiellement | U non resolus

## Escalations (decision humaine requise)
[Liste des observations escaladees avec fichier, critere, raison]

## Corrections appliquees
[Liste des fichiers modifies avec resume du changement]

## Observations sautees
[Liste avec raison du skip]

## Verdict
<verdict automatique base sur les escalations et echecs>
```

### 5c. Verdict automatique

- **Pret a merger** : 0 escalations bloquantes, 0 echecs apply, followup tout resolu
- **Attention requise** : escalations presentes ou echecs apply — lister les points a revoir
- **Blocage** : observations bloquantes non resolues apres followup

### 5d. Post sur la plateforme (si configure)

Si `auto_mode.post_on_complete == true` et `platform.type != null` :
- Poster le rapport consolide via post-review-comments.sh
- Le rapport auto inclut le tag `[AUTO-REVIEW]` dans l'en-tete

</auto_review_workflow>
