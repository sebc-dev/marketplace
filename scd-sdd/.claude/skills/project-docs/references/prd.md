# Référence — PRD / spec produit (`docs/prd.md`)

<role>
Répond au **quoi**, au niveau **produit/projet** (pas per-feature). User stories priorisées,
exigences fonctionnelles atomiques, critères mesurables. **Technology-agnostic** : aucun choix
technique. Trace vers le Brief. Produit par interview. Source de vérité produit qu'un futur
workflow specs viendra décliner en spec/plan/tasks par feature.
</role>

<template>
```markdown
# PRD — [Projet]
Statut : Draft | Créé : [date] | Trace vers : docs/brief.md

## User stories (priorisées, niveau produit)
### US1 — [titre] (Priorité : P1)
[Parcours en langage clair.]
- Pourquoi cette priorité : [valeur, trace vers SC-xxx du brief]
- Scénarios d'acceptation :
  1. **Given** [état initial], **When** [action], **Then** [résultat attendu]
  2. **Given** [...], **When** [...], **Then** [...]

## Exigences fonctionnelles (atomiques, testables)
- **FR-001** : Le système DOIT [capacité précise et vérifiable]
- **FR-002** : L'utilisateur DOIT pouvoir [interaction]
- **FR-00X** : [NEEDS CLARIFICATION : question précise]   # marquer l'incertitude

## Cas limites
- Que se passe-t-il si [condition frontière] ?
- Comment le système gère [scénario d'erreur] ?

## NON inclus (frontière de périmètre)
- [ce que le produit ne fait PAS — empêche les hallucinations d'ajout]

## Critères de succès mesurables
- **SC-001** : [métrique vérifiable]   # peut reprendre/affiner ceux du brief
```
</template>

<guidance>
- **Technology-agnostic, sans exception.** Un framework, une lib ou une DB dans le PRD = fuite à corriger : ça descend dans Stack/ADR. Le PRD survit à un changement de stack.
- **Niveau produit, pas feature.** Décrire les capacités d'ensemble, pas l'implémentation détaillée d'une feature — ce détail-là appartient au workflow specs en aval. Éviter le doublon.
- **FR atomiques et testables.** Une exigence = un comportement vérifiable = un futur test. Si un FR contient « et », le scinder. Verbe vérifiable, jamais adjectif.
- **Given/When/Then** pour les scénarios : entrées/sorties concrètes, pas de généralité.
- **`[NEEDS CLARIFICATION]`** pour toute zone floue : ne jamais trancher silencieusement une ambiguïté. Résoudre par interview avant de clore.
- Prioriser (P1/P2/P3) : l'agent et l'humain doivent savoir quoi construire d'abord.
</guidance>

<completion>
Le PRD est terminé quand :
- [ ] Chaque user story a une priorité et au moins un scénario **Given/When/Then**.
- [ ] Chaque `FR-xxx` est **atomique** (un seul comportement) et **testable** (vérifiable par une sortie).
- [ ] Tous les `[NEEDS CLARIFICATION]` ont été résolus par interview (aucun ne subsiste à la clôture).
- [ ] La section **NON inclus** borne explicitement le périmètre.
- [ ] Aucun choix technique (framework/lib/DB) n'apparaît — le PRD est resté technology-agnostic.
- [ ] Les `FR-xxx` et `SC-xxx` sont numérotés et stables (ils seront réutilisés en aval).
</completion>
