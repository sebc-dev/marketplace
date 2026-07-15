# Référence — Spec delta brownfield (modèle OpenSpec)

<role>
Pour **modifier une feature existante** plutôt que créer un comportement neuf. Au lieu de réécrire
une spec complète (coûteux, sujet à la dérive et à l'hallucination d'exigences sur l'existant), on
écrit un **delta** scopé au seul changement. Cycle : **propose → apply → archive** — à l'archivage,
le delta fusionne dans la spec de vérité de la feature.
</role>

<template>
```markdown
# Delta : [changement] sur [feature existante]
Statut : Proposé | Cible : specs/NNN-feature/spec.md · Créé : [date]

## Intention
[Pourquoi ce changement, en 1-2 phrases. Trace vers le FR/SC déclencheur.]

## Comportement actuel (invariants à préserver)
- [ce qui marche aujourd'hui et NE doit PAS régresser]

## Changements (deltas)
### [ADDED]
- **FR-0xx** : When [déclencheur], the system shall [nouveau comportement]. _(PRD: FR-0xx)_
### [MODIFIED]
- **FR-0yy** : ~~[ancien SHALL]~~ → [nouveau SHALL]. Raison : [...]
### [REMOVED]
- **FR-0zz** : [comportement retiré]. Impact : [...]

## Limites de scope (ce que ce delta NE touche PAS)
- [modules/comportements hors champ — empêche la dérive collatérale]

## Vérification
- [tests de non-régression sur les invariants + tests des nouveaux SHALL]
```
</template>

<guidance>
- **Ne jamais réécrire l'existant en entier** : décrire seulement le delta. Les invariants « comportement actuel » protègent contre la régression et l'hallucination.
- **Marqueurs explicites** `[ADDED]` / `[MODIFIED]` / `[REMOVED]` : la revue se fait sur l'**intention**, pas sur un diff de 800 lignes.
- **Apply** : dérouler les mêmes phases `plan`/`tasks`/`analyze`, scopées au delta. L'implémentation elle-même se fait en aval (hors périmètre).
- **Archive** : une fois livré et vérifié, **fusionner** les deltas dans `specs/NNN-feature/spec.md` (la spec de vérité redevient complète et à jour), puis retirer le fichier delta. C'est ce qui garde les living files fidèles au code.
- **Tests de non-régression obligatoires** sur chaque invariant listé.
</guidance>
