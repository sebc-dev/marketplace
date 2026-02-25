<agent_output_format>
## Format de retour standard

Tout agent de review (code-reviewer, test-reviewer) produit un rapport
se terminant par ces sections machine-parseables :

```
### Metriques
- green: X | yellow: Y | red: Z | blocking: B
- note: "resume 120 chars max"

### Observations JSON
[{"criterion":"...","severity":"bloquant|suggestion","level":"red|yellow|green",
  "text":"resume 15-30 mots","detail":"2-4 phrases","suggestion":"1-2 phrases ou null"}]
```

## Regles de parsing

- `green`, `yellow`, `red`, `blocking` : extraire les entiers apres les labels
- `note` : extraire la valeur entre guillemets
- Observations JSON : parser le tableau JSON sur une seule ligne
- Les sections AVANT Metriques sont le rapport libre (afficher tel quel)

## Criteres

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

### Regles de parsing validator

- `index` : position 0-based de l'observation dans le tableau du fichier
- `decision` : `apply` (fix valide), `skip` (faux positif/bruit), `escalate` (decision humaine)
- `confidence` : 0.0 a 1.0
- `apply`, `skip`, `escalate` dans Metriques : extraire les entiers apres les labels
- Decisions JSON : parser le tableau JSON sur une seule ligne
</agent_output_format>
