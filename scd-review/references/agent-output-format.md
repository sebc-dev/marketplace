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
</agent_output_format>
