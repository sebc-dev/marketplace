---
argument-hint: "(lit docs/prd.md)"
description: "Phase 3 : produit docs/stack.md en mode « options justifiées ». Fondations techniques (langage, framework, DB, auth, déploiement, tests) reliées aux FR/SC. Prépare la liste des décisions structurantes → candidats ADR."
---

## Contexte

Tu établis les **fondations techniques** du projet à partir du PRD. Mode **options justifiées** : tu proposes, l'humain tranche. La stack sert les exigences (FR/SC), jamais l'inverse. Chaque décision structurante retenue deviendra un ADR à la phase suivante.

Ratio : 50% humain / 50% AI (tu proposes des options argumentées, l'humain arbitre).

## Règles absolues

- Ne jamais imposer une stack par défaut sans arbitrage explicite de l'utilisateur.
- Chaque choix doit **servir** au moins un `FR-xxx`/`SC-xxx` ; un choix qui ne sert rien est du sur-engineering.
- Ne rétro-modifie jamais le PRD pour coller à un choix technique.
- Ce fichier est une **synthèse** : le rationale détaillé va dans les ADR, pas ici.

## Processus

1. Lis `docs/prd.md` (prérequis — s'il manque, renvoie vers `/scd-project-docs:prd`).
2. Charge le template et ses règles : lis `references/stack.md` du skill `project-docs`.
3. Pour chaque domaine structurant (**langage, framework, base de données, auth, cible de déploiement, stratégie de test**, + tout domaine propre au projet) :
   - présente 2-3 options avec pour/contre **reliés aux FR/SC**,
   - laisse l'utilisateur choisir (`AskUserQuestion`),
   - note l'alternative écartée et sa raison.
4. Remplis le tableau « Choix retenus » (avec colonne « Sert (FR/SC) ») et les contraintes transverses.
5. Dresse la liste **« Décisions structurantes → candidats ADR »** : une ligne par décision coûteuse à inverser (ce sera l'entrée de la phase `adr`).
6. Compile `docs/stack.md` (trace vers `docs/prd.md`).
7. Relis contre le bloc `<completion>` de `references/stack.md`.

## Skill active

- `project-docs` — charge `references/stack.md`.

## À la fin

Montre la liste des candidats ADR (elle pilote la phase suivante). Puis : « `/clear`, puis `/scd-project-docs:adr` pour figer ces décisions. »
