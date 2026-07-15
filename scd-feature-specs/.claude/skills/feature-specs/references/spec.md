# Référence — Spec de feature (`specs/NNN-feature/spec.md`)

<role>
Répond au **quoi**, au niveau **feature** (pas produit). Décline un ou plusieurs `FR-xxx` du
`docs/prd.md` en critères d'acceptation **EARS** testables. **Technology-agnostic** : aucun choix
technique (ça descend dans `plan.md`, qui s'appuie sur `stack.md`/`adr/`). Produit par interview
« une question à la fois ». Racine de la traçabilité feature → plan → tasks → test.
</role>

<template>
```markdown
# Spec : [NOM FEATURE]
Statut : Draft | Créé : [date] | Trace vers : docs/prd.md (FR-xxx, SC-xxx)

## Résumé
[2-3 phrases : la capacité livrée et sa valeur. Trace vers le(s) FR du PRD couverts.]

## User stories (priorisées)
### US1 — [titre] (Priorité : P1)
[Parcours en langage clair.]
- Trace vers : PRD FR-0xx, SC-0xx
- Scénarios d'acceptation (EARS) :
  1. **When** [déclencheur], the system **shall** [réponse vérifiable]
  2. **While** [état], **when** [déclencheur], the system **shall** [réponse]

## Exigences fonctionnelles (EARS, atomiques, testables)
- **FR-001** : When [déclencheur], the system shall [comportement précis]. _(PRD: FR-0xx)_
- **FR-002** : The system shall [capacité ubiquitous]. _(PRD: FR-0xx)_
- **FR-00X** : [NEEDS CLARIFICATION : question précise]

## Cas limites & comportements indésirables (unwanted behavior)
- **FR-0xx** : If [condition d'erreur], then the system shall [réponse structurée].
- Que se passe-t-il si [condition frontière] ?

## Contrats d'entrée/sortie (schémas machine-lisibles)
[Schéma requête/réponse, codes d'erreur — le QUOI observable, pas l'implémentation.]

## NON inclus (frontière de périmètre)
- [ce que la feature ne fait PAS — empêche le sur-engineering]

## Critères de succès mesurables
- **SC-001** : [métrique vérifiable, ex « création < 2 min »]. _(PRD: SC-0xx)_
```
</template>

<guidance>
- **Chaque critère en EARS** (`references/ears.md`) : un `SHALL` = un test nommé. Pas de « et » dans un FR (le scinder).
- **Technology-agnostic, sans exception.** Un framework/lib/DB dans la spec = fuite à corriger vers `plan.md`. La spec survit à un changement de stack.
- **Trace vers le PRD** : chaque `FR` de feature référence le `FR/SC` produit qu'il décline (`_(PRD: FR-0xx)_`). Si aucun FR produit ne couvre le besoin, c'est peut-être un trou du PRD → signaler.
- **`[NEEDS CLARIFICATION]`** pour toute ambiguïté : ne jamais trancher silencieusement. Résolu par la phase `clarify`.
- **Scope EXCLU obligatoire** : au moins 1-2 exclusions.
- **Brownfield** : si la feature modifie l'existant, basculer au format delta (`references/delta.md`) plutôt que réécrire une spec complète.
- **Multi-chemins** : pour un critère à états/chemins multiples à haute valeur de test, ajouter un scénario Gherkin dérivé (`references/gherkin.md`).
</guidance>

<completion>
La spec est terminée quand :
- [ ] Chaque `FR-xxx` est en **EARS**, **atomique** et **testable** (traduisible en un test observable).
- [ ] Chaque `FR-xxx`/`SC-xxx` **trace vers** un `FR/SC` du PRD (ou l'écart au PRD est signalé).
- [ ] Aucun choix technique n'apparaît (spec restée technology-agnostic).
- [ ] La section **NON inclus** borne le périmètre.
- [ ] Les cas limites et comportements indésirables (`If … then … shall`) sont couverts.
- [ ] Des `[NEEDS CLARIFICATION]` peuvent subsister — ils seront résolus par `clarify` (mais aucune ambiguïté n'a été tranchée en silence).
</completion>
