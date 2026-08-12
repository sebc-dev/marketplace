# Référence — Stack technique (`docs/stack.md`)

<role>
Répond au **comment** au niveau fondations : langages, frameworks, libs, contraintes techniques
transverses. Trace vers le PRD (la stack sert les FR/SC, pas l'inverse). Produit en mode
**« options justifiées »** : l'agent propose des options argumentées, l'humain tranche.
Chaque décision structurante retenue devient **un ADR** (promu par la phase `adr`). Ce fichier est
la **synthèse** ; les ADR portent le rationale détaillé, un par décision.

**Ce fichier ne décrit pas l'architecture.** La forme de la solution — style macro, organisation
interne d'un module, invariants du projet — est produite par la phase **suivante**, `/scd-sdd:archi`,
dans `docs/archi.md`. Ici on tranche les **fondations** : ce que le langage, le framework et la cible
de déploiement seront. C'est précisément ce constat qu'`archi` reprend en entrée.
</role>

<template>
```markdown
# Stack technique — [Projet]
Statut : Brouillon | Créé : [date] | Trace vers : docs/prd.md

## Vue d'ensemble
[Une phrase : ce que le projet est techniquement — type d'appli.]
La forme de la solution — style macro et micro, invariants — est dans `docs/archi.md` (phase 4).

## Choix retenus
| Domaine | Choix | Sert (FR/SC) | ADR |
|---|---|---|---|
| Langage | [ex] | FR-001, FR-003 | ADR-0001 |
| Framework | [ex] | ... | ADR-0002 |
| Base de données | [ex] | ... | ADR-0003 |
| Auth | [ex] | ... | ADR-0004 |
| Cible de déploiement | [ex] | SC-002 | ADR-0005 |
| Tests | [ex] | (tous) | ADR-0006 |

## Contraintes techniques transverses
- [ex : offline-first, RGPD, budget, latence cible]

## Décisions structurantes → candidats ADR
- [décision] : retenue car [raison]. Alternative écartée : [X] car [Y].  → ADR-000N
```
</template>

<guidance>
- **Mode options justifiées.** Pour chaque domaine à trancher, présenter 2-3 options avec pour/contre reliés aux FR/SC du PRD, puis laisser l'utilisateur choisir (`AskUserQuestion` convient). Ne pas imposer une stack par défaut sans arbitrage explicite.
- **Trace vers le PRD.** Chaque choix doit servir une exigence : la colonne « Sert (FR/SC) » n'est pas décorative. Un choix qui ne sert aucun FR/SC est probablement du sur-engineering.
- **Réutiliser l'existant** sauf justification : ne pas ajouter une dépendance sans raison reliée à une exigence.
- **Distinguer structurant / cosmétique.** Seules les décisions **coûteuses à inverser** (langage, archi, DB, auth, déploiement, stratégie de test) deviennent des ADR. Le choix d'un utilitaire mineur n'en mérite pas un.
- Ce fichier reste une **synthèse** : le *pourquoi* détaillé et les alternatives vont dans les ADR (phase `adr`), pas ici. Éviter la duplication.
- **Ne pas décrire l'architecture ici.** La § Vue d'ensemble tient en une phrase et **renvoie** vers `docs/archi.md` : le style de décomposition, l'organisation interne d'un module et les invariants du projet appartiennent à la phase `archi`, qui les compile en règles **falsifiables** — une trace observable dans l'arborescence ou dans les imports. Quelques phrases de prose ici produiraient un doublon non falsifiable, et c'est ce doublon qui dériverait.
- **Une décision structurante peut nourrir les deux.** Un choix de Stack devient un ADR ; s'il impose en plus une règle au code (« la logique métier n'importe pas le framework web »), c'est `archi` qui l'admet en invariant, pas cette phase. Le noter dans « Contraintes techniques transverses » suffit à ce qu'`archi` le reprenne.
</guidance>

<completion>
La Stack est terminée quand :
- [ ] Chaque domaine structurant (langage, framework, DB, auth, déploiement, tests) est tranché ou explicitement marqué « non applicable ».
- [ ] Chaque choix est relié à au moins un `FR-xxx`/`SC-xxx` (colonne « Sert »).
- [ ] Chaque décision structurante a une **alternative écartée** nommée avec sa raison.
- [ ] La liste « Décisions structurantes → candidats ADR » est prête à alimenter la phase `adr` (chaque ligne = un futur ADR-000N).
- [ ] La § Vue d'ensemble tient en **une phrase** et **renvoie** vers `docs/archi.md` : aucun style de décomposition, aucune organisation interne de module, aucun invariant n'est décrit ici.
- [ ] Aucune fuite : le PRD n'a pas été rétro-modifié pour coller à un choix technique.
</completion>
