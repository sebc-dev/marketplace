---
argument-hint: "[NNN ou slug de la feature — optionnel, résolu sinon]"
description: "Phase 4 : produit specs/NNN-feature/tasks.md. Lots de review Rn (vertical slices dimensionnées pour être reviewables par un humain) découpés en tâches Tn ordonnées par dépendances, marqueurs [P] parallélisables, backref _Requirements: FR-xxx_ (style Kiro), mode de vérification par lot (TDD par défaut ; test-after / check / inhérent pour le non-testable comme la CI/infra/config). Un lot ≈ une PR reviewable ; une tâche = un critère observable = un commit."
---

## Contexte

Tu découpes `plan.md` en **lots de review traçables**, à deux granularités :

- le **lot `Rn`** est l'unité de **review humaine** : une vertical slice livrant une capability vérifiable, dimensionnée pour être reviewée d'un bloc une fois implémentée ;
- la **tâche `Tn`** est l'unité de **progression** : un critère observable = un commit = une vérification au vert.

Pourquoi les lots : un `tasks.md` parfaitement tracé mais livrable en un seul bloc produit une review que personne ne fera vraiment — le reviewer skimme, et le défaut passe. Le dimensionnement se décide **ici**, il ne se rattrape pas en aval.

Le fichier sert d'état inter-sessions (cases cochées) et constitue le **contrat** remis au workflow d'implémentation (hors périmètre).

Ratio : 40% humain / 60% AI (découpage mécanique, l'humain valide l'ordre et la granularité).

## Règles absolues

- **Vertical, jamais horizontal.** Un lot traverse les couches et livre de la valeur vérifiable. « Créer la table » / « créer l'API » / « créer l'UI » sont trois couches, pas trois lots.
- **Un seul sujet par lot**, nommable en une phrase sans « et ».
- **Mode de vérification par lot** (`TDD` défaut · `test-after` · `check` · `inhérent`) : chaque lot le déclare (`_vérif : <mode>_`) ; tout mode ≠ `TDD` porte une justification d'une ligne. En `TDD`, la tâche « écrire le test » précède « implémenter ». L'ordre de vérification vit dans le lot, jamais entre les lots. `check`/`inhérent` réservés au non-testable (visuel, CI/infra/config, one-shot) — jamais sur de la logique métier.
- **Backref `_Requirements:_`** sur chaque tâche. Une tâche sans backref = scope creep suspect.
- **Couverture** : chaque `FR`/`SHALL` a, dans **un seul** lot, ≥ 1 tâche impl **et** ≥ 1 vérification observable (tâche test, tâche check, ou le critère d'acceptation de l'impl en mode `inhérent`).
- **`[P]`** seulement si aucune dépendance croisée (fichiers disjoints) — au niveau tâche comme au niveau lot.

## Processus

1. **Résous la feature cible** — règle de résolution du skill (section « Cibler une feature ») : argument `NNN`/slug s'il est fourni ; sinon l'unique feature avec `plan.md` et sans `tasks.md` ; sinon liste les candidates et demande. **Annonce la cible retenue.**
2. Charge les références : lis `references/tasks.md` **et** `references/reviewability.md` du skill `feature-specs`.
3. Lis `specs/<cible>/plan.md` et `spec.md` (prérequis).
4. **Découpe d'abord en lots** `Rn` : une capability par lot, ordonnés par dépendance (`dépend de : Rn`), chacun portant les `FR` livrés, un budget estimé (ordre de grandeur dérivé des « Fichiers touchés » du plan — **pas** une mesure), ses fichiers et ses concepts.
5. **Applique les signaux de scission** de `references/reviewability.md` (≈ 400 lignes estimées, ≈ 7 concepts, ≈ 5-7 critères par exigence). Un dépassement → scinde **verticalement** (étapes du workflow, variations de règle, variations de données, CRUD, chemins, effort). Un lot qui ne livre aucun incrément vérifiable → refusionne-le.
6. **Puis remplis chaque lot** de ses tâches `Tn` : déclare le **mode de vérification** du lot (`TDD` par défaut ; `test-after`/`check`/`inhérent` justifié d'une ligne si la feature ne se prête pas au test-first — CI/infra/config, visuel, one-shot), dépendances explicites (`bloqué par`), marqueurs `[P]`, backref `_Requirements: FR-xxx, SC-xxx_`, ordre de vérification cohérent avec le mode.
7. Clos par un lot de **vérif bout-en-bout** (l'étape du plan).
8. Relis contre le bloc `<completion>` de `references/tasks.md` : chaque FR/SHALL couvert, chaque lot vertical et à sujet unique.

## Ce que tu NE fais PAS

- Tu n'implémentes pas, et tu ne prescris pas **comment** implémenter : le code relève d'un workflow séparé. `tasks.md` est le **contrat** qu'il consommera, pas son mode d'emploi.
- Tu ne prescris pas le git : le lot est l'unité de livraison **recommandée** (« un lot ≈ une PR reviewable »), pas une instruction de branchement.
- Tu ne présentes aucun budget estimé comme une mesure : ce plugin ne lit pas le code.
- Tu n'ajoutes aucune tâche hors périmètre (qui n'implémente pas un FR ou la vérif).

## Skill active

- `feature-specs` — charge `references/tasks.md` et `references/reviewability.md`.

## À la fin

Rappelle la double granularité : `tasks.md` est le contrat remis au workflow d'implémentation — chaque **lot** est dimensionné pour être reviewable d'un bloc par un humain, chaque **tâche** est vérifiable isolément (un critère observable, une vérification, un commit). Les cases seront cochées là-bas, pas ici.

Annonce le nombre de lots et leur budget estimé total, en rappelant que ce sont des ordres de grandeur destinés à déclencher la scission, pas des mesures.

Puis, en passant le `NNN` de la cible : « Étape suivante : `/clear`, puis `/scd-feature-specs:analyze NNN` (gate de conformité). Pour une feature à fort enjeu, une passe de durcissement optionnelle — `/scd-feature-specs:premortem NNN` — peut suivre. »
