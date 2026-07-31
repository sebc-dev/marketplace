# Référence — Stack technique (`docs/stack.md`)

<role>
Répond au **comment** au niveau fondations : langages, frameworks, libs, contraintes techniques
transverses. Trace vers le PRD (la stack sert les FR/SC, pas l'inverse). Produit en mode
**« options justifiées »** : l'agent propose des options argumentées, l'humain tranche.
Chaque décision structurante retenue devient **un ADR** (phase suivante). Ce fichier est la
**synthèse** ; les ADR portent le rationale détaillé, un par décision.
</role>

<template>
```markdown
# Stack technique — [Projet]
Statut : Draft | Créé : [date] | Trace vers : docs/prd.md

## Vue d'ensemble
[2-4 phrases : la forme générale de la solution — type d'appli, style d'archi.]

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
</guidance>

<completion>
La Stack est terminée quand :
- [ ] Chaque domaine structurant (langage, framework, DB, auth, déploiement, tests) est tranché ou explicitement marqué « non applicable ».
- [ ] Chaque choix est relié à au moins un `FR-xxx`/`SC-xxx` (colonne « Sert »).
- [ ] Chaque décision structurante a une **alternative écartée** nommée avec sa raison.
- [ ] La liste « Décisions structurantes → candidats ADR » est prête à alimenter la phase `adr` (chaque ligne = un futur ADR-000N).
- [ ] Aucune fuite : le PRD n'a pas été rétro-modifié pour coller à un choix technique.
</completion>
