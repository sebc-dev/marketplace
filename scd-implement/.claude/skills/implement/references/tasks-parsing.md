# Référence — Parser `tasks.md` et résoudre la cible

<role>
Comment lire le `tasks.md` produit par `scd-feature-specs`, en extraire les lots `Rn` et leurs tâches `Tn`, et résoudre quelle feature / quel lot implémenter. Utilisé par `/scd-implement:run`, `/scd-implement:status` et l'agent `lot-briefer`.
</role>

<parsing>
## Structure d'un `tasks.md`

Deux granularités :
- **lot `Rn`** = unité de review = vertical slice (≈ une PR reviewable). C'est **l'unité d'implémentation** de ce plugin.
- **tâche `Tn`** = unité de progression = un critère observable = un commit = un test vert.

### En-tête de lot
```
## R1 — [capability nommable en une phrase]
_Livre : FR-001, FR-002_ · _~180 lignes est._ · _3 concepts_ · dépend de : —
Fichiers : `api/signup.ts`, `db/users.ts`, `ui/SignupForm.tsx`
```
- `## Rn [P] — <titre>` : le `[P]` (optionnel) marque un lot parallélisable (fichiers disjoints).
- `_Livre : FR-xxx_` : les FR/SC que le lot **livre** → source des SHALL à tester.
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
- Type dérivé du libellé : « Écrire le test » → `test` ; « Implémenter » → `impl` ; « Cas limite : test + impl » → les deux.
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
