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

- **Followup** : 5 prochains fichiers eligible (exclure `unaddressed` et auto-resolus) :
  - Fichiers `correction` → mode CORRECTION :
    - Categorie `tests` → `Task(subagent_type: "test-reviewer", run_in_background: true, prompt: "MODE CORRECTION. Fichier: <chemin>. previous_head=<sha>.")`
    - Sinon → `Task(subagent_type: "code-reviewer", run_in_background: true, prompt: "MODE CORRECTION. Fichier: <chemin>. previous_head=<sha>. Observations bloquantes originales : [...] Commentaires : [...]")`
  - Fichiers `new` → mode FULL :
    - Categorie `tests` → `Task(subagent_type: "test-reviewer", ...)`
    - Sinon → `Task(subagent_type: "code-reviewer", ...)`

Stocker task IDs via @references/session-protocol.md (add agent tasks).

## Etape 4 — Router vers le workflow

### Si review (`<slug>.json`)

Suivre @references/review-workflow.md etapes 3-4 a partir du prochain fichier `pending`.
Format agents : @references/agent-output-format.md.

### Si apply (`<slug>-apply.json`)

Boucle observations pending :
1. Afficher l'observation (format structure : emoji level + criterion + severity + fichier + texte + detail + suggestion)
2. `AskUserQuestion` : Appliquer / Sauter / Rejeter / Discuter
3. **Appliquer** → `Task(subagent_type: "fix-applier", run_in_background: false, description: "Fix: <criterion> in <filename>", prompt: "Corrige l'observation suivante : fichier=<chemin>, categorie=<category>, observation=<criterion/severity/level/text/detail/suggestion>")`
4. Mise a jour JSON via @references/session-protocol.md (update apply observation)
5. Synthese : `apply-summary.sh` (jq) ou Read+Write (readwrite)

### Si followup (`<slug>-followup.json`)

Boucle fichiers pending par type :
1. En-tete + contexte original (depuis la session followup) + rapport agent + checkpoint type-specifique
   - `correction` → verdict resolution (Resolu / Partiellement / Non resolu / Commentaire / Approfondir)
   - `unaddressed` → choix (Accepte tel quel / Reste a corriger / Commentaire)
   - `new` → checkpoint standard (Fichier suivant / Promouvoir / Commentaire / Approfondir)
2. Pipeline glissant : apres chaque avancement, lancer l'agent du prochain fichier eligible si < 5 en vol
   - `Task(subagent_type: "code-reviewer"/"test-reviewer", ...)` selon categorie et type
   - Stocker task_id via @references/session-protocol.md (add agent tasks)
3. Synthese : `followup-summary.sh` (jq) ou Read+Write (readwrite)

### Etape 4-bis — Poster sur la plateforme (followup uniquement)

Lire `platform` dans config.json. Si `type == null` ou `auto_post == false` : passer silencieusement.

**Strategie jq** :
```bash
bash .claude/review/scripts/post-review-comments.sh .claude/review/sessions/<session-file> .claude/review/config.json
```

**Strategie readwrite** : detecter PR/MR, construire markdown, poster avec `gh pr review` ou `glab mr note`.

</resume_workflow>
