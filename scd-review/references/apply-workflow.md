<apply_workflow>

## Mode auto detection

Lire `auto_mode` dans config.json. Si `auto_mode.enabled == true`, les checkpoints utilisateur sont remplaces par des decisions automatiques basees sur `validation.decision` des observations.

## Etape 0 — Trouver la session source

1. `git branch --show-current`, calculer le slug (remplacer `/` par `-`)
2. Chercher les sessions via Glob :
   - `.claude/review/sessions/<slug>-apply.json`
   - `.claude/review/sessions/<slug>-followup.json`
   - `.claude/review/sessions/<slug>.json`

**Si `<slug>-apply.json` existe et `status == "in_progress"` :**
Proposer la reprise :

```
AskUserQuestion(
  questions: [{
    question: "Une session apply est en cours. Que souhaitez-vous faire ?",
    header: "Session apply",
    options: [
      { label: "Reprendre", description: "Continuer depuis la derniere observation traitee" },
      { label: "Recommencer", description: "Supprimer la session apply et en creer une nouvelle" }
    ],
    multiSelect: false
  }]
)
```

- **Reprendre** → lire la session, trouver la premiere observation `pending`, aller a Etape 3
- **Recommencer** → supprimer le fichier, continuer vers la recherche de session source

**Trouver la derniere session completee (priorite : followup > review) :**
- Si `<slug>-followup.json` existe et `status == "completed"` → utiliser comme source
- Sinon si `<slug>.json` existe et `status == "completed"` → utiliser comme source
- Sinon → erreur : "Aucune review completee pour cette branche. Lancez /scd-review:code-review d'abord."

## Etape 1 — Extraire les observations

Extraire via @references/session-protocol.md (create apply session).

Presenter le resume :
```
Apply des corrections — <branche>
Session source : <chemin> (completee le <date>)

Observations a traiter :
- X bloquantes (red)
- Y suggestions (yellow)
- Z fichiers concernes

Ordre : fichiers avec bloquants d'abord
```

Confirmer avec l'utilisateur avant de continuer.

## Etape 2 — Creer la session apply

Ecrire le JSON dans `.claude/review/sessions/<slug>-apply.json` avec Write.

## Etape 3 — Boucle observation par observation

Parcourir les fichiers dans l'ordre, puis les observations dans chaque fichier.

Pour chaque fichier :
```
--- Fichier X/Y : chemin/fichier.ext [CATEGORIE] ---
```

Pour chaque observation pending dans le fichier :

### 3a. Afficher l'observation

```
---
📋 Observation X.Y — <level_emoji> **<criterion>** [<SEVERITE>]

📁 Fichier : `<chemin/fichier.ext>`
🔍 Probleme : <texte de l'observation>
   <detail de l'observation — explication complete du probleme>
💡 Correction suggeree : <suggestion de l'observation — direction de correction>
---
```

Si `detail` et `suggestion` absents (anciennes sessions), afficher uniquement le `text`.

### 3b. Resolution pre-apply (si validation disponible)

Si l'observation possede un champ `validation` (enrichi par le review-validator) :

**Mode interactif (auto_mode.enabled == false) :**
Afficher la recommandation du validator avant le AskUserQuestion :
```
🤖 Recommandation validator : <decision> (confiance: <confidence>)
   Raison : <reason>
```

**Mode auto (auto_mode.enabled == true) :**
- `validation.decision == "apply"` et `confidence >= confidence_threshold` → action = Appliquer, pas de AskUserQuestion
- `validation.decision == "skip"` → action = Sauter, pas de AskUserQuestion
- `validation.decision == "escalate"` → si `auto_mode.escalate_to_user == true` : AskUserQuestion standard, sinon action = Sauter
- Logger `[AUTO] <decision> obs <X.Y> — <reason>` via add-comment.sh

### 3b-bis. Demander l'action

**Si auto_mode.enabled et decision resolue en 3b** → sauter ce checkpoint, aller a 3c.

**Sinon (mode interactif — comportement v0.11.0 inchange) :**

```
AskUserQuestion(
  questions: [{
    question: "Comment traiter cette observation ?",
    header: "Obs X.Y",
    options: [
      { label: "Appliquer", description: "Lancer le fix-applier pour corriger" },
      { label: "Sauter", description: "Passer cette observation sans la corriger" },
      { label: "Rejeter", description: "Faux positif — l'observation est incorrecte" },
      { label: "Discuter", description: "En parler avant de decider" }
    ],
    multiSelect: false
  }]
)
```

### 3c. Traiter la reponse

**Appliquer** :
```
Task(
  subagent_type: "fix-applier",
  run_in_background: false,
  description: "Fix: <criterion> in <filename>",
  prompt: "Corrige l'observation suivante :
📁 Fichier : <chemin>
Categorie : <category>
🔍 Observation : criterion=<criterion>, severity=<severity>, level=<level>,
text=<text>, detail=<detail>, suggestion=<suggestion>"
)
```

Afficher le rapport du fix-applier. Extraire le status (`applied` ou `skipped_ambiguous`).

Mise a jour via @references/session-protocol.md (update apply observation).

Si `skipped_ambiguous`, informer l'utilisateur et re-afficher le AskUserQuestion.

**Sauter** : mise a jour via @references/session-protocol.md — status `"skipped"`.

**Rejeter** : mise a jour via @references/session-protocol.md — status `"dismissed"`.

**Discuter** : discussion dans la conversation principale. Ensuite re-afficher le AskUserQuestion.

### 3d. Avancer

Apres chaque observation traitee (sauf Discuter), passer a la suivante.

Afficher la progression :
```
[X/Y observations traitees — A appliquees, S sautees, R rejetees]
```

## Etape 4 — Synthese

Apres la derniere observation, generer la synthese via @references/session-protocol.md (apply summary). Afficher le resultat.

Recommander `/scd-review:review-followup` pour verifier les corrections.

### Etape 4-bis — Lancer la validation (mode interactif, optionnel)

Si `validator.enabled == true` et `auto_mode.enabled == false` et que la session source ne contient PAS de champ `validation` sur les observations :

```
AskUserQuestion(
  questions: [{
    question: "Voulez-vous lancer le validator avant d'appliquer les corrections ?",
    header: "Validator",
    options: [
      { label: "Oui", description: "Analyser les observations avec le review-validator pour obtenir des recommandations" },
      { label: "Non", description: "Appliquer sans validation automatique" }
    ],
    multiSelect: false
  }]
)
```

Si "Oui" → lancer la validation par fichier (meme logique que auto-review-workflow phase 2), puis reprendre la boucle.

<constraints>
- fix-applier en foreground — attendre son resultat avant de continuer
- fix-applier isole : tout le contexte dans son prompt, il ne voit pas la conversation principale
- Economie de contexte : ~150-250 tokens par observation dans la conversation principale
- Si l'utilisateur enchaine "Appliquer", pas de bavardage — afficher le rapport et passer a la suite
- La session apply est independante de la session source — ne modifie pas la review/followup originale
</constraints>

</apply_workflow>
