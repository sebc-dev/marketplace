<decision_workflow>

## Vue d'ensemble

Phase 3.0 du pipeline `run` (et reprise via `continue`). Pour chaque observation issue de la validation, l'utilisateur décide explicitement de l'action à mener avant tout fix automatique. Chaque décision est persistée immédiatement dans la session.

```
Validator → user_decision = null         (observation à décider)
Phase 3.0 (cette référence)
  ├─ seed-decisions (auto-skip des validator-skip)
  ├─ Pour chaque pending :
  │    ├─ Affichage : contexte + recommandation validator
  │    ├─ AskUserQuestion (Apply / Skip / Defer / Discuss)
  │    ├─ Si "Discuss" → analyse approfondie + re-prompt
  │    └─ Persistance : scd.sh session set-decision (immédiat)
  └─ Fin : tous les pending sont décidés OU utilisateur interrompt
Phase 3.5 → fix-applier batch sur user_decision == "apply"
```

**Invariant** : aucun fix n'est appliqué pendant la Phase 3.0. Les corrections sont accumulées via `user_decision = "apply"` puis exécutées en lot par Phase 3.5.

**Reprise** : l'interruption (Ctrl+C, kill, fin de conversation) ne perd aucune décision déjà persistée. `/scd-review:continue` reprend à la première observation `user_decision == null`.

## Étape 1 — Initialisation

### 1a. Auto-skip des validator-skip

```bash
bash .claude/review/scripts/scd.sh session seed-decisions \
  .claude/review/sessions/<slug>.json
```

Marque automatiquement `user_decision = "skip"` (avec `reason = "auto-seeded from validator skip"`) toutes les observations où `validator_decision == "skip"`. Idempotent.

### 1b. Récupérer le résumé décisionnel

```bash
bash .claude/review/scripts/scd.sh session decision-summary \
  .claude/review/sessions/<slug>.json
```

Retour :
```json
{ "total": N, "pending": P, "apply": A, "skip": S, "defer": D }
```

Si `pending == 0` → toutes les décisions sont prises, sauter en Phase 3.5.

### 1c. Annoncer la phase

```
── Phase de décision interactive ─────────────────────
N observations à valider (les false positives ont été auto-skip).
Pour chaque : Appliquer / Sauter / Différer / Discuter
Vos décisions sont sauvegardées au fil de l'eau.
──────────────────────────────────────────────────────
```

## Étape 2 — Boucle de décision

### 2a. Récupérer la prochaine observation

```bash
bash .claude/review/scripts/scd.sh session pending-decisions \
  .claude/review/sessions/<slug>.json | head -n 1
```

Ordre : red avant yellow, blocking avant suggestion, puis risk_score desc, puis path, puis line_start.

Si stdout vide → toutes les observations sont décidées, sortir de la boucle.

### 2b. Présenter l'observation

Afficher EXACTEMENT dans cet ordre :

```
━━━ Observation X/N ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fichier  : <file_path>:<line_start>-<line_end>
Critère  : <criterion>  Sévérité : <severity> (<level>)

Problème : <text>

Détail   : <detail>

Direction : <suggestion>

Correction proposée :
<correction_prompt>

Recommandation validator : <validator_decision> (confiance <validator_confidence>)
Raison : <validator_reason>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2c. Demander la décision

```
AskUserQuestion(
  questions: [{
    question: "Décision pour cette observation ?",
    header: "Décision <criterion>",
    multiSelect: false,
    options: [
      {
        label: "Appliquer",
        description: "fix-applier corrigera selon le correction_prompt en Phase 3.5"
      },
      {
        label: "Sauter",
        description: "Ignorer définitivement — l'observation ne sera plus reproposée"
      },
      {
        label: "Différer",
        description: "Décision plus tard — sera reprise par /scd-review:continue"
      },
      {
        label: "Discuter",
        description: "Analyser plus en détail (impact, contexte, alternatives) avant de décider"
      }
    ]
  }]
)
```

### 2d. Persister la décision

**Si la réponse est `Appliquer`, `Sauter` ou `Différer` :**

```bash
bash .claude/review/scripts/scd.sh session set-decision \
  .claude/review/sessions/<slug>.json \
  <obs_id> \
  <apply|skip|defer> \
  "<raison utilisateur si fournie, sinon vide>"
```

Confirmer brièvement à l'utilisateur :
```
✓ Décision persistée : <decision>  (<obs_id>)
```

Retourner à l'étape 2a (observation suivante).

**Si la réponse est `Discuter` → aller en Étape 3.**

## Étape 3 — Branche Discuter

L'utilisateur veut comprendre l'observation en profondeur avant de décider.

### 3a. Analyse approfondie

Faire dans l'ordre, sans persister de décision :

1. **Lire la zone élargie** : Read du fichier avec un contexte de ±20 lignes autour de `line_start..line_end`
2. **Cross-references** : si l'observation mentionne un import / type / fonction définie ailleurs, Grep/Glob pour trouver les usages et lire les extraits pertinents
3. **Impact** : évaluer combien de sites pourraient être affectés par la correction
4. **Alternatives** : penser à 1-2 approches alternatives au correction_prompt

### 3b. Restituer l'analyse

Afficher (concis, ~10-15 lignes max) :

```
── Analyse approfondie ──
Contexte élargi : <ce que la zone fait réellement>
Impact correction : <portée — fichier seul / N fichiers liés / refactor>
Alternatives :
  - <alternative 1 si pertinente>
  - <alternative 2 si pertinente>
Recommandation Claude : <apply/skip/defer + raison courte>
─────────────────────────
```

### 3c. Re-poser la question (3 options seulement)

```
AskUserQuestion(
  questions: [{
    question: "Après analyse, votre décision ?",
    header: "Décision finale",
    multiSelect: false,
    options: [
      { label: "Appliquer", description: "..." },
      { label: "Sauter", description: "..." },
      { label: "Différer", description: "..." }
    ]
  }]
)
```

L'option "Discuter" n'est PAS reproposée — l'analyse a déjà été faite. Si l'utilisateur veut encore plus de contexte, il peut interrompre et reprendre via `/scd-review:continue` après inspection manuelle.

Persister via `set-decision` (Étape 2d), retourner à l'étape 2a.

## Étape 4 — Fin de phase

Quand `pending-decisions` est vide :

```bash
bash .claude/review/scripts/scd.sh session decision-summary \
  .claude/review/sessions/<slug>.json
```

Afficher le résumé :

```
── Décisions enregistrées ────────────────────────────
✓ Appliquer : A   ✓ Sauter : S   ⏸ Différer : D
Total à traiter en Phase 3.5 : A correction(s)
──────────────────────────────────────────────────────
```

Si `A == 0` → annoncer "Aucune correction à appliquer." et passer directement à la Phase 4 (rapport).
Si `A > 0` → enchaîner sur la Phase 3.5 (fix-applier batch) du run-workflow.

## Stratégie readwrite (sans jq)

Si `environment.json_strategy == "readwrite"`, remplacer chaque appel `scd.sh session ...` ci-dessus par :

1. Read session JSON
2. Pour `set-decision` : trouver l'observation par `id`, ajouter `user_decision`, `user_decision_reason`, `user_decision_at`, recalculer `summary.decisions`
3. Pour `pending-decisions` : filtrer `.files[].observations[]` où `user_decision == null` ET `validator_decision != "skip"`, trier
4. Pour `seed-decisions` : itérer, marquer `user_decision = "skip"` quand `validator_decision == "skip"`
5. Write session JSON

L'invariant de persistance immédiate doit être préservé (un Write par décision).

## Notes d'implémentation

- **Aucun parallélisme** : la phase est séquentielle par construction (l'utilisateur ne peut décider que d'une chose à la fois).
- **Pas de fix-applier ici** : interdire toute invocation de Task fix-applier pendant cette phase. Les fixes batch sont la Phase 3.5.
- **Auto-mode bypass** : si `--auto-fix` est passé en arg de run, sauter intégralement cette phase et mapper directement `validator_decision == "apply"` → `user_decision = "apply"` via une boucle de `set-decision` sans interaction. (Ce mapping se fait dans run-workflow.md, pas ici.)
- **Escalations** : les observations `validator_decision == "escalate"` apparaissent normalement dans la liste pending — l'utilisateur tranche en Phase 3.0 (l'ancien checkpoint dédié aux escalations disparaît).

</decision_workflow>
