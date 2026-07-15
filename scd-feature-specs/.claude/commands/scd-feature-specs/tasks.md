---
argument-hint: "[NNN ou slug de la feature — optionnel, résolu sinon]"
description: "Phase 4 : produit specs/NNN-feature/tasks.md. Tâches discrètes ordonnées par dépendances, marqueurs [P] parallélisables, backref _Requirements: FR-xxx_ (style Kiro), ordre TDD (test avant impl). Une tâche = un critère observable = un commit."
---

## Contexte

Tu découpes `plan.md` en **tâches exécutables et traçables**. Chaque tâche : assez petite pour être sûre, assez grande pour faire avancer ; **un critère observable = un commit = un test vert**. Le fichier sert d'état inter-sessions (cases cochées) et constitue le **contrat** remis au workflow d'implémentation (hors périmètre).

Ratio : 40% humain / 60% AI (découpage mécanique, l'humain valide l'ordre).

## Règles absolues

- **Ordre TDD** : la tâche « écrire le test » précède la tâche « implémenter ».
- **Backref `_Requirements:_`** sur chaque tâche. Une tâche sans backref = scope creep suspect.
- **Couverture** : chaque `FR`/`SHALL` de la spec a ≥ 1 tâche test **et** ≥ 1 tâche impl.
- **`[P]`** seulement si aucune dépendance croisée (fichiers disjoints).

## Processus

1. **Résous la feature cible** — règle de résolution du skill (section « Cibler une feature ») : argument `NNN`/slug s'il est fourni ; sinon l'unique feature avec `plan.md` et sans `tasks.md` ; sinon liste les candidates et demande. **Annonce la cible retenue.**
2. Charge la référence : lis `references/tasks.md` du skill `feature-specs`.
3. Lis `specs/<cible>/plan.md` et `spec.md` (prérequis).
4. Rédige `specs/<cible>/tasks.md` selon le template : tâches `Tn`, dépendances explicites (`bloqué par`), marqueurs `[P]`, backref `_Requirements: FR-xxx, SC-xxx_`, ordre TDD.
5. Clos la liste par une tâche **vérif bout-en-bout** (l'étape du plan).
6. Relis contre le bloc `<completion>` de `references/tasks.md` : vérifie que chaque FR/SHALL est couvert.

## Ce que tu NE fais PAS

- Tu n'implémentes pas, et tu ne prescris pas **comment** implémenter : le code relève d'un workflow séparé. `tasks.md` est le **contrat** qu'il consommera, pas son mode d'emploi.
- Tu n'ajoutes aucune tâche hors périmètre (qui n'implémente pas un FR ou la vérif).

## Skill active

- `feature-specs` — charge `references/tasks.md`.

## À la fin

Rappelle que `tasks.md` est le contrat remis au workflow d'implémentation — chaque tâche y est vérifiable isolément (un critère observable, un test, un commit), et les cases seront cochées là-bas, pas ici. Puis, en passant le `NNN` de la cible : « Dernière étape : `/clear`, puis `/scd-feature-specs:analyze NNN` (gate terminale de validation). »
