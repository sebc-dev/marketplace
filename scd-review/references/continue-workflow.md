<continue_workflow>

## Workflow de reprise v2

### Étape 1 — Résoudre la session en cours

1. `git branch --show-current` → slug = branch.replace('/', '-')
2. Chercher les sessions via Glob :
   - `.claude/review/sessions/<slug>-followup.json`
   - `.claude/review/sessions/<slug>.json`

**Priorité de résolution :**
- Si `<slug>-followup.json` existe et `status == "in_progress"` → reprendre followup
- Sinon si `<slug>.json` existe et `status == "in_progress"` → reprendre review
- Si les deux sont `"completed"` → "Toutes les sessions sont complétées. Lancez /scd-review:run pour une nouvelle review."
- Si aucune session → "Aucune session pour cette branche. Lancez /scd-review:run."

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

### Étape 5 — Continuer le workflow

Reprendre la boucle de review/followup à partir du premier fichier pending :
- Récupérer les outputs des agents (`TaskOutput(block: true)`)
- Normaliser via `scd.sh agent validate-output`
- Persister observations + métriques
- Enchaîner la validation (review-validator per-file comme dans run-workflow)
- Dispatcher selon `config.default_output` (--fix ou --post selon configuration)

</continue_workflow>
