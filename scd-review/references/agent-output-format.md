<agent_output_format>
## Format de retour standard v2

Tout agent de review (code-reviewer, test-reviewer) produit un rapport
se terminant par ces sections machine-parseables :

```
### Metriques
- green: X | yellow: Y | red: Z | blocking: B
- note: "resume 120 chars max"

### Observations JSON
[{"criterion":"...","severity":"bloquant|suggestion","level":"red|yellow|green",
  "location":"chemin/fichier:NN ou null",
  "line_start": NN_ou_null,
  "line_end": NN_ou_null,
  "text":"resume 15-30 mots","detail":"2-4 phrases","suggestion":"1-2 phrases ou null",
  "correction_prompt":"instruction précise et autonome ou null"}]
```

## Champs v2

### Champ `correction_prompt` (nouveau v2)

Instruction chirurgicale et autonome pour effectuer la correction. Obligatoire pour red/yellow, `null` pour green.

**Règles :**
1. Auto-suffisant — un développeur ou LLM peut l'appliquer sans contexte additionnel
2. Chirurgical — fichier exact, numéro(s) de ligne, code actuel → code cible
3. Complet — inclut les effets de bord (imports, types, tests à vérifier)
4. Concis — pas de justification, uniquement l'action

**Format recommandé :**
```
File: <chemin/fichier>, lines <N>-<M>.
Replace: `<code actuel en 1 ligne ou description>`
With: `<code cible en 1 ligne ou description>`
Verify: <vérifications post-correction (imports, types, tests)>
```

### Champs `line_start` / `line_end` (nouveau v2)

Numéros de ligne (entiers) dans le fichier HEAD. Permettent le posting inline précis sur PR/MR.
- `line_start` : première ligne concernée (obligatoire pour red/yellow si connu, sinon null)
- `line_end` : dernière ligne concernée (null si sur une seule ligne)

## Règles de parsing

- `green`, `yellow`, `red`, `blocking` : extraire les entiers après les labels
- `note` : extraire la valeur entre guillemets
- Observations JSON : parser le tableau JSON sur une seule ligne
- Les sections AVANT Metriques sont le rapport libre (afficher tel quel)
- `correction_prompt` : string ou `null`
- `line_start`, `line_end` : entiers ou `null`

## Critères

- **code-reviewer** : `architecture`, `security`, `performance`, `conventions`, `error-handling`, `test-coverage`
- **test-reviewer** : `test-execution`, `test-quality`, `test-structure`, `test-coverage`

## Format review-validator

L'agent review-validator produit un rapport se terminant par :

```
### Decisions JSON
[{"index":0,"file":"<path>","criterion":"<criterion>","level":"<red|yellow|green>",
  "decision":"apply|skip|escalate","confidence":0.XX,"reason":"justification courte"}]

### Metriques
- apply: X | skip: Y | escalate: Z
- confidence_avg: 0.XX
```

### Règles de parsing validator

- `index` : position 0-based de l'observation dans le tableau du fichier
- `decision` : `apply` (fix valide), `skip` (faux positif/bruit), `escalate` (décision humaine)
- `confidence` : 0.0 à 1.0
- Decisions JSON : parser le tableau JSON sur une seule ligne
</agent_output_format>
