<post_workflow>

## Etape 1 — Resoudre la session completee

1. `git branch --show-current` → calculer le slug (remplacer `/` par `-`)
2. Chercher les sessions via Glob, priorite :
   - `.claude/review/sessions/<slug>-followup.json` avec `status == "completed"`
   - `.claude/review/sessions/<slug>.json` avec `status == "completed"`
3. Prendre la premiere session completee trouvee (followup prioritaire sur review)
4. Si aucune session completee :
   ```
   Aucune review completee pour cette branche. Lancez /scd-review:code-review d'abord.
   ```
   → STOP

## Etape 2 — Afficher le resume

Lire la session avec Read et afficher :
```
Session trouvee : <chemin>
  Branche  : <branch>
  Type     : review | followup (round N)
  Date     : <created_at>
  Fichiers : <total>
  Bloquants: <blocking count>
```

## Etape 3 — Confirmation

```
AskUserQuestion(
  questions: [{
    question: "Poster les resultats de cette review sur le PR/MR ?",
    header: "Post review",
    options: [
      { label: "Poster", description: "Publier les resultats sur le PR/MR" },
      { label: "Annuler", description: "Ne pas poster" }
    ],
    multiSelect: false
  }]
)
```

- **Poster** → continuer vers etape 3b
- **Annuler** → "Publication annulee." → STOP

## Etape 3b — Commentaires inline (optionnel)

Proposer les commentaires inline sur les fichiers du PR/MR :

```
AskUserQuestion(
  questions: [{
    question: "Poster aussi les observations en commentaires inline sur les fichiers ?",
    header: "Inline",
    options: [
      { label: "Bloquants", description: "Poster uniquement les observations bloquantes en inline" },
      { label: "Tous", description: "Poster toutes les observations en inline" },
      { label: "Non", description: "Passer — poster uniquement le resume global" }
    ],
    multiSelect: false
  }]
)
```

- **Bloquants** → `bash .claude/review/scripts/post-inline-comments.sh <session> .claude/review/config.json blocking`
- **Tous** → `bash .claude/review/scripts/post-inline-comments.sh <session> .claude/review/config.json all`
- **Non** → continuer directement vers etape 4

Afficher le resultat retourne par le script, puis continuer vers etape 4 dans tous les cas.

## Etape 4 — Publication

```bash
bash .claude/review/scripts/post-review-comments.sh <session> .claude/review/config.json manual
```

Le flag `manual` bypass le check `auto_post` (specifique a `/review-post`).

Afficher le resultat retourne par le script :
- `POSTED: ...` → succes, afficher le message
- `SKIP: no open PR/MR found` → "Aucun PR/MR ouvert pour la branche. Creez un PR/MR puis relancez `/scd-review:review-post`."
- `WARN: ...` → afficher l'avertissement

<constraints>
- Le workflow ne construit jamais de markdown de posting — le script gere le format
- Le workflow ne detecte pas le PR/MR — le script gere la detection
- Seul le script interagit avec gh/glab
- Le script requiert jq pour lire la session et construire le commentaire
</constraints>

</post_workflow>
