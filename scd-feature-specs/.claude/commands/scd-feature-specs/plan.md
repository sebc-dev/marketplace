---
argument-hint: "[NNN ou slug de la feature — optionnel, résolu sinon]"
description: "Phase 3 : produit specs/NNN-feature/plan.md EN PLAN MODE. Le comment — approche, réutilisation du socle (stack/ADR, jamais re-décidés), fichiers touchés, contrats, étape de vérif bout-en-bout. Décision structurante nouvelle → candidat ADR dans _candidates/. Trace vers spec + stack + ADR."
---

## Contexte

Tu produis le **plan technique** de la feature : le *comment*. Il **applique** le socle (`docs/stack.md`, `docs/adr/`) — il ne re-décide jamais ce qui est déjà tranché. À exécuter **en plan mode** (recommande `opusplan` : Opus planifie, Sonnet exécute). Un plan court a un meilleur taux d'acceptation qu'un plan fleuve.

Ratio : 50% humain / 50% AI (arbitrages techniques partagés).

## Règles absolues

- **Ne re-décide rien du socle.** Langage, framework, DB, auth, déploiement sont fixés par `stack.md`/`adr/`. Contredire un ADR accepté est interdit (le hook `block-adr-edits` empêche même de le réécrire).
- **Décision structurante nouvelle** (non couverte par un ADR) → **candidat** dans `docs/adr/_candidates/NNNN-draft.md`, jamais un ADR final.
- **Réutilise l'existant** : cherche fonctions/utilitaires/patrons déjà présents avant de proposer du neuf.
- **Étape de vérif bout-en-bout obligatoire** : une commande/test qui prouve la feature.

## Processus

1. **Résous la feature cible** — règle de résolution du skill (section « Cibler une feature ») : argument `NNN`/slug s'il est fourni ; sinon l'unique feature au `spec.md` propre sans `plan.md` ; sinon liste les candidates et demande. **Annonce la cible retenue.**
2. Charge la référence : lis `references/plan.md` du skill `feature-specs`.
3. Lis `specs/<cible>/spec.md`, `docs/stack.md` et `docs/adr/` (prérequis). Repère les ADR contraignants et les choix de stack qui s'appliquent.
4. Rédige `specs/<cible>/plan.md` selon le template :
   - approche ; **réutilisation du socle** (stack + ADR cités) ;
   - fichiers touchés nommés + patron de référence existant ;
   - contrats d'interface cohérents avec les contrats d'E/S de la spec ;
   - décisions & alternatives écartées ; candidat ADR si structurant et nouveau ;
   - **étape de vérification bout-en-bout** unique.
5. Vérifie que chaque `FR` de la spec est couvert par une portion du plan.
6. Relis contre le bloc `<completion>` de `references/plan.md`.

## Ce que tu NE fais PAS

- Aucun découpage en tâches numérotées (c'est `tasks`).
- Aucune écriture dans `docs/adr/` final (seulement `_candidates/`).

## Skill active

- `feature-specs` — charge `references/plan.md`.

## À la fin

Signale tout **candidat ADR** créé (à promouvoir manuellement). Puis, en passant le `NNN` de la cible : « `/clear`, puis `/scd-feature-specs:tasks NNN`. »
