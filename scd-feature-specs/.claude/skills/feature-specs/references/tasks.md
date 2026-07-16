# Référence — Plan de tâches de feature (`specs/NNN-feature/tasks.md`)

<role>
Découpe `plan.md` en **lots de review** (`Rn`), eux-mêmes découpés en tâches (`Tn`) ordonnées par
dépendances et **traçables** vers la spec.

Deux granularités, deux rôles :
- le **lot `Rn`** est l'unité de **review humaine** : une vertical slice livrant une capability
  vérifiable, dimensionnée pour être reviewée d'un bloc une fois implémentée (`references/reviewability.md`) ;
- la **tâche `Tn`** est l'unité de **progression** : **un critère observable = un commit = un test vert**.

Sert d'état inter-sessions (cases cochées). C'est le **contrat** remis au workflow d'implémentation
(hors périmètre) — pas son mode d'emploi.
</role>

<template>
```markdown
# Tâches : [feature]
Trace vers : plan.md (fichiers) · spec.md (FR/SC/SHALL)

## Légende
- [ ] à faire · [x] fait · [P] parallélisable (aucune dépendance avec les autres [P])
- `Rn` = lot de review : une vertical slice, unité de livraison recommandée (≈ une PR reviewable)
- _Requirements:_ backref vers les FR/SC couverts (style Kiro)

## R1 — [capability nommable en une phrase]
_Livre : FR-001, FR-002_ · _~180 lignes est._ · _3 concepts_ · dépend de : —
Fichiers : `api/signup.ts`, `db/users.ts`, `ui/SignupForm.tsx`

- [ ] T1 — Écrire le test pour FR-001 (When…shall…) _Requirements: FR-001_ ; dépend de : —
- [ ] T2 — Implémenter FR-001 jusqu'à ce que T1 passe _Requirements: FR-001_ ; bloqué par : T1
- [ ] T3 [P] — Écrire le test pour FR-002 _Requirements: FR-002_ ; dépend de : —
- [ ] T4 — Implémenter FR-002 _Requirements: FR-002_ ; bloqué par : T3

## R2 [P] — [autre capability]
_Livre : FR-003_ · _~120 lignes est._ · _2 concepts_ · dépend de : —
Fichiers : `api/reset.ts`, `ui/ResetForm.tsx`

- [ ] T5 — Écrire le test pour FR-003 _Requirements: FR-003_
- [ ] T6 — Implémenter FR-003 _Requirements: FR-003_ ; bloqué par : T5
- [ ] T7 — Cas limite : test + impl de FR-00x (If…then…shall…) _Requirements: FR-00x_

## R3 — Vérification bout-en-bout
_Livre : SC-001_ · dépend de : R1, R2

- [ ] T8 — Vérif bout-en-bout (l'étape du plan) _Requirements: SC-001_
```
> Les cases seront cochées par le workflow d'implémentation, pas ici. Ce fichier part rempli et vierge.
</template>

<guidance>
**Dimensionner les lots** (détail : `references/reviewability.md` — la charger pour découper) :
- **Vertical, jamais horizontal.** Un lot traverse les couches et livre de la valeur vérifiable.
  « Créer la table », « créer l'API », « créer l'UI » sont trois couches, pas trois lots : leur
  correction ne se juge qu'en assemblage, donc aucune n'est reviewable seule.
- **Un seul sujet par lot**, nommable en une phrase sans « et ».
- **Compréhensible seul** : `dépend de :` exprime un ordre, pas un besoin de charger le lot voisin
  en mémoire pour comprendre celui-ci.
- **Signaux de scission** (≈ 400 lignes estimées, ≈ 7 concepts, ≈ 5-7 critères par exigence) : un
  dépassement déclenche une scission verticale, il ne rend pas un verdict. Le budget en lignes est
  une **estimation** dérivée des « Fichiers touchés » du plan — un ordre de grandeur, pas une mesure.
- **Trop petit aussi est un défaut** : un lot qui ne livre aucun incrément vérifiable est une couche
  déguisée, à refusionner.

**Écrire les tâches** :
- **Ordre TDD, dans le lot** : la tâche « écrire le test » précède la tâche « implémenter ». Le code
  est « fait » quand le test passe. L'ordre TDD ne vit **jamais** entre les lots (« tous les tests »
  puis « toute l'impl » = deux lots horizontaux).
- **Backref `_Requirements:_`** sur chaque tâche : le fil qui relie tâche → FR/SHALL → PRD. Une
  tâche sans backref est suspecte (scope creep).
- **Couverture** : chaque `FR`/`SHALL` de la spec a **au moins** une tâche test + une tâche impl,
  dans **un seul** lot. `analyze` le vérifiera.
- **`[P]`** uniquement si aucune dépendance croisée (fichiers disjoints) — au niveau tâche comme au
  niveau lot. `[P]` dit « peut tourner en parallèle » ; un lot dit « se review d'un bloc » : deux
  tâches `[P]` du même lot restent dans le même lot.
- **Une tâche = un commit vérifiable** : critère de succès observable, pour un `git revert` propre
  et pour que le workflow d'implémentation puisse prouver chaque pas.
- **Rien hors périmètre** : pas de tâche qui n'implémente pas un FR ou la vérif.

**Ce que le lot ne prescrit pas** : le lot est l'unité de livraison **recommandée** (« un lot ≈ une
PR reviewable »). Comment l'aval commite, branche ou empile ses PR ne nous regarde pas.
</guidance>

<completion>
Le plan de tâches est terminé quand :
- [ ] Chaque lot `Rn` est une **vertical slice** à **un seul sujet**, compréhensible seule.
- [ ] Chaque lot porte : les `FR` livrés, un budget estimé, ses fichiers, ses dépendances.
- [ ] Aucun lot ne dépasse les signaux de scission sans justification explicite.
- [ ] Chaque `FR`/`SHALL` de la spec est couvert par ≥ 1 tâche test **et** ≥ 1 tâche impl.
- [ ] Chaque tâche porte un backref `_Requirements:_` valide.
- [ ] L'ordre TDD est respecté **dans** chaque lot et les dépendances (`bloqué par`) sont explicites.
- [ ] Les `[P]` sont réellement indépendantes (tâches et lots).
- [ ] Un lot de **vérif bout-en-bout** (l'étape du plan) clôt la liste.
</completion>
