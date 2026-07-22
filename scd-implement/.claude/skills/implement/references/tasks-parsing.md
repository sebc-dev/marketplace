# Référence — Parser `tasks.md` et résoudre la cible

<role>
Comment lire le `tasks.md` produit par `scd-feature-specs`, en extraire les lots `Rn` et leurs tâches `Tn`, résoudre quelle feature / quel lot implémenter, et décider quels lots sont **co-lançables en parallèle**. Utilisé par `/scd-implement:run`, `/scd-implement:run-parallel`, `/scd-implement:status` et l'agent `lot-briefer`.
</role>

<parsing>
## Structure d'un `tasks.md`

Deux granularités :
- **lot `Rn`** = unité de review = vertical slice (≈ une PR reviewable). C'est **l'unité d'implémentation** de ce plugin.
- **tâche `Tn`** = unité de progression = un critère observable = un commit = un test vert.

### En-tête de lot
```
## R1 — [capability nommable en une phrase]
_Livre : FR-001, FR-002_ · _vérif : TDD_ · _~180 lignes est._ · _3 concepts_ · dépend de : —
Fichiers : `api/signup.ts`, `db/users.ts`, `ui/SignupForm.tsx`
```
- `## Rn [P] — <titre>` : le `[P]` (optionnel) marque un lot parallélisable (fichiers disjoints).
- `_Livre : FR-xxx_` : les FR/SC que le lot **livre** → source des SHALL à vérifier.
- **`_vérif : <mode>_`** : le **mode de vérification** du lot ∈ `TDD` (défaut) · `test-after` · `check` · `inhérent`. Il gouverne le segment de vérification du workflow (voir `references/verification-modes.md`). **Absent → `TDD`** (rétro-compatible avec les anciens `tasks.md`). Dès que le mode ≠ `TDD`, une **justification d'une ligne** l'accompagne (`_vérif : check (revue visuelle de la mise en page)_`) — la capturer.
- `dépend de : Rn` (ou `—`) : **ordre** des lots. Un lot n'est lançable que si ses dépendances sont faites.
- `Fichiers : …` : périmètre fichiers du lot (issu de `plan.md`).

### Ligne de tâche
```
- [ ] T1 — Écrire le test pour FR-001 (When…shall…) _Requirements: FR-001_ ; dépend de : —
- [ ] T2 — Implémenter FR-001 jusqu'à ce que T1 passe _Requirements: FR-001_ ; bloqué par : T1
- [ ] T3 [P] — Écrire le test pour FR-002 _Requirements: FR-002_
```
- `- [ ]` / `- [x]` : case à cocher = **état inter-session** (cochée par `progress-recorder`).
- `Tn [P]` : `[P]` = parallélisable (aucune dépendance avec les autres `[P]`).
- Type dérivé du libellé : « Écrire le test » → `test` ; « Implémenter » → `impl` ; « Cas limite : test + impl » → les deux ; « Vérifier / constater » (lots `check`) → `check`. En mode `inhérent`, il n'y a **pas** de tâche de vérif séparée : le critère d'acceptation de la tâche d'impl est la preuve.
- `_Requirements: FR-xxx_` : backref Kiro → le(s) FR couvert(s). **Une tâche sans backref est suspecte** (scope creep) — signale-la, ne l'implémente pas aveuglément.
- `bloqué par : Tn` / `dépend de :` : ordre **intra-lot** (TDD : le test précède l'impl).

### Pull des SHALL (dans `spec.md`)
Pour chaque `FR-xxx` du `_Livre :_`, retrouve son énoncé EARS dans `spec.md` :
```
- **FR-001** : When [déclencheur], the system shall [comportement]. _(PRD: FR-0xx)_
```
Le texte après `:` est la **SHALL** à traduire en test. Type : `When…shall…` = event (happy) ; `If…then…shall…` = unwanted (error/edge) ; `While…shall…` = state ; ubiquitous = toujours vrai ; `Where…shall…` = optionnel.

### Gherkin (optionnel)
`specs/NNN-feature/acceptance/*.feature` : scénarios exécutables dérivés d'un SHALL. S'ils existent pour un FR du lot, les tests en dérivent aussi.
</parsing>

<resolution>
## Résoudre la feature et le lot

**Feature** (identique à `scd-feature-specs`) :
1. Argument `NNN`/slug/chemin → match sur préfixe `NNN` **ou** slug dans `specs/`.
2. Sinon, une seule feature a un `tasks.md` avec des lots non finis → la prendre, l'annoncer.
3. Sinon (0 ou ≥ 2) → `AskUserQuestion` ou renvoi vers `status`.

**Lot** :
- Argument `Rn` fourni → cible.
- Sinon → premier `Rn` non entièrement coché, dans l'ordre des dépendances, **dont toutes les dépendances (`dépend de :`) sont cochées**.
- Lot dont une dépendance n'est pas faite → **bloqué** : signale-le, propose le lot débloquable.

**État d'un lot** (pour `status`) :
- **fait** : toutes ses tâches `Tn` sont `[x]` ;
- **en cours** : certaines `[x]`, d'autres `[ ]` ;
- **à faire** : aucune `[x]`.

**Précondition d'implémentation** : la gate `analyze` doit avoir été passée au vert. Indices d'un contrat non prêt (→ STOP, renvoi amont) : `spec.md` contient `[NEEDS CLARIFICATION]`, ou `plan.md`/`tasks.md` absents.
</resolution>

<co-parallelism>
## Co-parallélisabilité des lots (pour `/scd-implement:run-parallel`)

Le marqueur `[P]` (`## Rn [P]`) signale un lot **parallélisable** : ses fichiers sont disjoints des autres `[P]`. `run-parallel` **généralise** ce marqueur en le **dérivant** de la ligne `Fichiers :` de chaque lot — plus robuste que se fier au seul `[P]`, qui peut manquer.

**Deux couches, à ne pas confondre** (voir le SKILL) :
- **Couche 1 — exécution.** Réglée par l'isolation **worktree** (chaque lot dans son checkout). C'est ce qui rend le parallèle *possible*.
- **Couche 2 — contenu.** Deux lots qui touchent le **même fichier** conflicteront au merge, worktree ou pas. C'est ce que la co-parallélisabilité *décide* : on ne co-lance que des lots au contenu disjoint.

**Règle.** Deux lots demandés `Ri`, `Rj` sont **co-lançables** (parallèles) **ssi** :
1. leurs ensembles `Fichiers :` sont **disjoints** — `F(Ri) ∩ F(Rj) = ∅` — **ET**
2. **aucun ne dépend de l'autre** de façon non mergée (ni `Rj ∈ dépend de(Ri)`, ni l'inverse, tant que la dépendance n'est pas mergée dans la base).

Sinon → ils doivent être **sérialisés/empilés** dans une **chaîne `--base`** (jamais en parallèle) :
- **fichiers non disjoints** → empilement pour éviter le conflit de contenu (le 2ᵉ lot branche sur le 1ᵉ, sa PR ne diffère que de lui) ;
- **dépendance** → empilement naturel (`base = impl/<slug>-<lot-dont-il-dépend>`), déjà porté par l'auto-stacking de `run`.

**Construire les chaînes.** Relation de conflit = (fichiers non disjoints) ∨ (dépendance dans l'ensemble demandé). Les **composantes connexes** de cette relation sont les chaînes ; l'ordre **intra-chaîne** est topologique par `dépend de :`, à égalité par numéro de lot. Le **1ᵉ** lot d'une chaîne prend sa base naturelle (défaut, ou auto-stacking sur une dépendance hors-ensemble non mergée) ; les **suivants** prennent `base = impl/<slug>-<lot-précédent-dans-la-chaîne>` (+ `oldBase`). Chaînes distinctes = lancées en parallèle.

**En cas de doute sur la disjonction** (ligne `Fichiers :` absente ou ambiguë) → **sérialise** : le parallèle est une optimisation, jamais une obligation ; mieux vaut empiler que risquer un conflit silencieux.
</co-parallelism>
