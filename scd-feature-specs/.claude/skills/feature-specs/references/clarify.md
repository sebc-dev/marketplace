# Référence — Gate de clarification (`clarify`)

<role>
Gate **avant `plan`**. Résout chaque `[NEEDS CLARIFICATION]` de `spec.md` par questions structurées,
puis met à jour la spec. Objectif : réduire le rework en aval — une ambiguïté non résolue devient un
choix silencieux (donc une hallucination probable) au moment du plan ou de l'implémentation.
Ne produit pas de nouveau fichier : édite `spec.md` en place.
</role>

<process>
1. Scanner `spec.md` et lister tous les marqueurs `[NEEDS CLARIFICATION]`, plus toute zone sous-spécifiée détectée (critère sans valeur mesurable, cas limite absent, contrat d'E/S flou).
2. Pour chaque point, poser une **question fermée** via `AskUserQuestion` (options mutuellement exclusives + « Autre »). Grouper au maximum 4 questions par appel ; une question par ambiguïté.
3. Répercuter chaque réponse dans `spec.md` :
   - remplacer le `[NEEDS CLARIFICATION]` par le critère EARS résolu ;
   - ajuster les FR/SC dépendants (cohérence) ;
   - conserver les IDs stables.
4. Re-scanner : itérer jusqu'à **zéro** marqueur restant.
</process>

<completion>
La clarification est terminée quand :
- [ ] Aucun `[NEEDS CLARIFICATION]` ne subsiste dans `spec.md`.
- [ ] Chaque réponse a été répercutée en critère EARS testable (pas juste une note en prose).
- [ ] Aucune ambiguïté n'a été tranchée sans confirmation de l'humain.
- [ ] Les FR/SC dépendants restent cohérents (pas de contradiction introduite).
</completion>
