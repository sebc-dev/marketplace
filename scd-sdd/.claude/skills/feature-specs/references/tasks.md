# Référence — Plan de tâches de feature (`specs/NNN-feature/tasks.md`)

<role>
Découpe `plan.md` en **lots de review** (`Rn`), eux-mêmes découpés en tâches (`Tn`) ordonnées par
dépendances et **traçables** vers la spec.

Deux granularités, deux rôles :
- le **lot `Rn`** est l'unité de **review humaine** : une vertical slice livrant une capability
  vérifiable, dimensionnée pour être reviewée d'un bloc une fois implémentée (`references/reviewability.md`) ;
- la **tâche `Tn`** est l'unité de **progression** : **un critère observable = un commit = une vérification au vert**.

Sert d'état inter-sessions (cases cochées). C'est le **contrat** remis au workflow d'implémentation
(hors périmètre) — pas son mode d'emploi.
</role>

<template>
```markdown
# Tâches : [feature]
Trace vers : plan.md (fichiers) · spec.md (FR/SC/SHALL)

## Légende
- [ ] à faire · [x] fait · [P] parallélisable (aucune dépendance avec les autres [P])
- `Rn` = **lot de review** : une *vertical slice* — une tranche qui traverse toutes les couches et
  livre un morceau de fonctionnalité complet, relisable seul (≈ une PR)
- `Tn` = **tâche** : un critère observable = un commit = une vérification au vert
- _vérif : <mode>_ = comment le lot prouve qu'il est fait — `TDD` (le test avant le code, défaut) ·
  `test-after` (le test après) · `check` (pas de test auto : une vérification observée) ·
  `inhérent` (la preuve est le résultat lui-même, ex. le pipeline CI qui passe au vert)
- _Requirements:_ = **backref** : les FR/SC que la tâche couvre — le fil qui dit pourquoi elle
  existe (notation empruntée à l'outil Kiro d'AWS)

## R1 — [la capacité livrée, nommable en une phrase]
_Livre : FR-001, FR-002_ · _vérif : TDD_ · _~180 lignes est._ · _3 concepts_ · dépend de : —
Fichiers : `api/signup.ts`, `db/users.ts`, `ui/SignupForm.tsx`

- [ ] T1 — Écrire le test pour FR-001 (When…shall…) _Requirements: FR-001_ ; dépend de : —
- [ ] T2 — Implémenter FR-001 jusqu'à ce que T1 passe _Requirements: FR-001_ ; bloqué par : T1
- [ ] T3 [P] — Écrire le test pour FR-002 _Requirements: FR-002_ ; dépend de : —
- [ ] T4 — Implémenter FR-002 _Requirements: FR-002_ ; bloqué par : T3

## R2 [P] — [une autre capacité livrée]
_Livre : FR-003_ · _vérif : TDD_ · _~120 lignes est._ · _2 concepts_ · dépend de : —
Fichiers : `api/reset.ts`, `ui/ResetForm.tsx`

- [ ] T5 — Écrire le test pour FR-003 _Requirements: FR-003_
- [ ] T6 — Implémenter FR-003 _Requirements: FR-003_ ; bloqué par : T5
- [ ] T7 — Cas limite : test + impl de FR-00x (If…then…shall…) _Requirements: FR-00x_

## R3 — Pipeline CI qui exécute lint + tests sur chaque push
_Livre : FR-010_ · _vérif : inhérent (config CI : la preuve est le run vert, pas un test unitaire)_ · _~40 lignes est._ · _1 concept_ · dépend de : —
Fichiers : `.github/workflows/ci.yml`

- [ ] T8 — Ajouter le workflow CI ; critère d'acceptation : un push déclenche le run et il passe au vert _Requirements: FR-010_

## R4 — Vérification bout-en-bout
_Livre : SC-001_ · _vérif : check (parcours observé de bout en bout)_ · dépend de : R1, R2

- [ ] T9 — Vérif bout-en-bout (l'étape du plan) _Requirements: SC-001_
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

**Mode de vérification du lot** — l'invariant : **chaque `FR`/`SHALL` est rattaché, dans un seul lot,
à ≥ 1 tâche d'impl et à ≥ 1 tâche dont l'achèvement est observable**. Le *test automatisé écrit
d'abord* (TDD) en est la **forme par défaut**, pas la seule — certaines features ne s'y prêtent pas.
Chaque lot déclare son mode (`_vérif : <mode>_`) ; dès qu'il quitte `TDD`, une **justification d'une
ligne** l'accompagne (comme un dépassement de seuil : une déviation *documentée*, jamais silencieuse).

- `TDD` (défaut) — tâche « écrire le test » **avant** tâche « implémenter ». Le code est « fait »
  quand le test passe.
- `test-after` — test automatisé toujours requis, mais écrit **après** l'impl (refactor à comportement
  constant, exploration où le test-first n'aide pas). Justifier.
- `check` — pas de test automatisé ; **vérification observable dédiée** à la place (revue visuelle
  d'une mise en page, constat d'une migration one-shot). La tâche de check porte un critère
  **observable**, jamais un adjectif. Justifier.
- `inhérent` — **aucune tâche de vérif séparée** : le critère d'acceptation de la tâche d'impl **est**
  la preuve (« le pipeline CI passe au vert », « `terraform apply` converge »). Réservé au non-testable
  par nature. Justifier.

Cas typiques du non-TDD : comportement purement visuel / mise en page · CI / infra / config /
scaffolding · one-shot (migration, script jetable) · spike explicitement hors production · glue où le
test ne ferait que dupliquer l'impl. **Le défaut reste `TDD`** : un `check`/`inhérent` posé sur de la
logique métier est un finding d'`analyze`, pas un raccourci.

**L'ordre de vérification vit dans le lot, jamais entre les lots** — quel que soit le mode : « tous
les tests » puis « toute l'impl » reste deux lots horizontaux.

**Écrire les tâches** :
- **Backref `_Requirements:_`** sur chaque tâche : le fil qui relie tâche → FR/SHALL → PRD. Une
  tâche sans backref est suspecte (scope creep).
- **Couverture** : chaque `FR`/`SHALL` de la spec est rattaché, dans **un seul** lot, à ≥ 1 tâche
  d'impl **et** à ≥ 1 **vérification observable** — une tâche test (`TDD`/`test-after`), une tâche
  check (`check`), ou le critère d'acceptation de la tâche d'impl elle-même (`inhérent`). `analyze`
  le vérifiera.
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
- [ ] Chaque lot porte : les `FR` livrés, son **mode de vérification**, un budget estimé, ses fichiers, ses dépendances.
- [ ] Aucun lot ne dépasse les signaux de scission sans justification explicite.
- [ ] Tout mode de vérification autre que `TDD` porte une justification d'une ligne.
- [ ] Chaque `FR`/`SHALL` est rattaché, dans **un seul** lot, à ≥ 1 tâche impl **et** à ≥ 1 vérification observable (tâche test, tâche check, ou critère d'acceptation de l'impl en mode `inhérent`).
- [ ] Chaque tâche porte un backref `_Requirements:_` valide.
- [ ] L'ordre de vérification est respecté **dans** chaque lot (test-first en mode `TDD`) et les dépendances (`bloqué par`) sont explicites.
- [ ] Les `[P]` sont réellement indépendantes (tâches et lots).
- [ ] Un lot de **vérif bout-en-bout** (l'étape du plan) clôt la liste.
</completion>
