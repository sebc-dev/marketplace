# Référence — PRD / spec produit (`docs/prd.md`)

<role>
Répond au **quoi**, au niveau **produit/projet** (pas per-feature). User stories priorisées,
exigences fonctionnelles atomiques, critères mesurables. **Technology-agnostic** : aucun choix
technique. Trace vers le Brief. Produit par interview. Source de vérité produit qu'un futur
workflow specs viendra décliner en spec/plan/tasks par feature.

**Où cette référence se charge — deux points, et le second est partiel :**

1. par `/scd-sdd:prd`, **intégralement** : c'est le template et la méthode de la phase ;
2. par l'agent **`audit-explorer`**, le **seul bloc `<template>`**, quand `/scd-sdd:audit prd` juge
   ce document. Il n'en tire que la **liste des sections attendues** et ne le recopie nulle part
   (`DECISIONS.md` §D20) : produire le document appartient à la phase, constater ce qui y manque à
   l'audit.
</role>

<template>
```markdown
# PRD — [Projet]
Statut : Brouillon | Créé : [date] | Trace vers : docs/brief.md

## Légende
- **PRD** — *Product Requirements Document* : ce que le produit fait, jamais comment il le fait.
- **FR-xxx** — une **exigence fonctionnelle** : une capacité du produit, énoncée assez précisément
  pour qu'on puisse dire oui ou non si elle est là.
- **SC-xxx** — un **critère de succès** : comment on mesure que c'est réussi. Un chiffre ou un fait
  constatable, pas une appréciation.
- **User story** — un parcours vu du côté de la personne qui s'en sert, avec sa priorité (P1 = sans
  ça, le produit ne sert à rien).
- **Given / When / Then** — la forme d'un scénario d'acceptation : l'état de départ, l'action, le
  résultat attendu. Les trois mots-clés restent en anglais, comme partout ailleurs ; **la phrase,
  elle, s'écrit en français**.
- **[NEEDS CLARIFICATION]** — une ambiguïté posée et **jamais tranchée en silence**.

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
- **Technology-agnostic** — l'énoncé et son motif sont au `SKILL.md`, § *Règles d'écriture pour un agent*, et ne se recopient pas ici. Ce document est celui où la règle mord : la fuite est l'erreur la plus fréquente de la phase, et le `<completion>` la contrôle.
- **Niveau produit, pas feature.** Décrire les capacités d'ensemble, pas l'implémentation détaillée d'une feature — ce détail-là appartient au workflow specs en aval. Éviter le doublon.
- **FR atomiques et testables.** Une exigence = un comportement vérifiable = un futur test. Si un FR contient « et », le scinder.
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
