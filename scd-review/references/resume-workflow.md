<resume_workflow>

## Etape 1 — Resoudre la session

1. `git branch --show-current` → calculer le slug (remplacer `/` par `-`)
2. Chercher les sessions via Glob, priorite :
   - `.claude/review/sessions/<slug>-apply.json` avec `status == "in_progress"`
   - `.claude/review/sessions/<slug>-followup.json` avec `status == "in_progress"`
   - `.claude/review/sessions/<slug>.json` avec `status == "in_progress"`
3. Si aucune session `in_progress` :
   ```
   Aucune review en cours pour la branche <branche>.
   Lancez /scd-review:code-review pour demarrer une nouvelle review,
   /scd-review:review-followup pour un followup,
   ou /scd-review:review-apply pour appliquer des corrections.
   ```
   → STOP

## Etape 2 — Afficher la progression

Lire `json_strategy` dans la config chargee.

**Strategie `jq`** :
```bash
bash .claude/review/scripts/session-status.sh .claude/review/sessions/<session-file>
```
Afficher le resultat tel quel.

**Strategie `readwrite`** : Read du fichier session JSON et afficher :
```
Reprise de <type> — <branche> (base: <base-branch>) | X/Y traites
```

## Etape 3 — Relancer les agents

**Si apply** (`<slug>-apply.json`) : pas d'agents a relancer (fix-applier est foreground). Passer a etape 4.

**Si review ou followup** : les agents du batch precedent sont perdus (nouvelle session Claude). Relancer pour les 5 prochains fichiers pending.

- **Review** : meme logique que @references/review-workflow.md etape 2-bis :
  - Categorie `tests` → `Task(subagent_type: "test-reviewer", run_in_background: true, prompt: "Fichier: <chemin>. merge_base=<sha>, base_branch=<base>.")`
  - Sinon → `Task(subagent_type: "code-reviewer", run_in_background: true, prompt: "MODE FULL. Fichier: <chemin>. merge_base=<sha>, base_branch=<base>.")`

- **Followup** : meme logique que @references/followup-workflow.md etape 2-bis (5 prochains fichiers eligible, exclure `unaddressed` et auto-resolus)

Stocker task IDs via @references/session-protocol.md (add agent tasks).

## Etape 4 — Router vers le workflow

### Si review (`<slug>.json`)

Suivre @references/review-workflow.md etapes 3-4 a partir du prochain fichier `pending`.
Format agents : @references/agent-output-format.md.

### Si apply (`<slug>-apply.json`)

Suivre @references/apply-workflow.md a partir de l'etape 3 (boucle observation par observation) puis etape 4 (synthese).

### Si followup (`<slug>-followup.json`)

Suivre @references/followup-workflow.md etapes 3-4 a partir du prochain fichier `pending`.
Format agents : @references/agent-output-format.md.

</resume_workflow>
