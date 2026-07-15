# Référence — Plan de tâches de feature (`specs/NNN-feature/tasks.md`)

<role>
Découpe `plan.md` en tâches discrètes, ordonnées par dépendances, **traçables** vers la spec.
Chaque tâche : assez petite pour être sûre, assez grande pour faire avancer ; **un critère
observable = un commit = un test vert**. Sert d'état inter-sessions (cases cochées).
C'est le **contrat** remis au workflow d'implémentation (hors périmètre) — pas son mode d'emploi.
</role>

<template>
```markdown
# Tâches : [feature]
Trace vers : plan.md (fichiers) · spec.md (FR/SC/SHALL)

## Légende
- [ ] à faire · [x] fait · [P] parallélisable (aucune dépendance avec les autres [P])
- _Requirements:_ backref vers les FR/SC couverts (style Kiro)

## Tâches
- [ ] T1 — Écrire le test pour FR-001 (When…shall…) _Requirements: FR-001_ ; dépend de : —
- [ ] T2 — Implémenter FR-001 jusqu'à ce que T1 passe _Requirements: FR-001_ ; bloqué par : T1
- [ ] T3 [P] — Écrire le test pour FR-002 _Requirements: FR-002_ ; dépend de : —
- [ ] T4 — Implémenter FR-002 _Requirements: FR-002_ ; bloqué par : T3
- [ ] T5 — Cas limite : test + impl de FR-00x (If…then…shall…) _Requirements: FR-00x_
- [ ] T6 — Vérif bout-en-bout (l'étape du plan) _Requirements: SC-001_
```
> Les cases seront cochées par le workflow d'implémentation, pas ici. Ce fichier part rempli et vierge.
</template>

<guidance>
- **Ordre TDD** : la tâche « écrire le test » précède la tâche « implémenter ». Le code est « fait » quand le test passe.
- **Backref `_Requirements:_`** sur chaque tâche : le fil qui relie tâche → FR/SHALL → PRD. Une tâche sans backref est suspecte (scope creep).
- **Couverture** : chaque `FR`/`SHALL` de la spec a **au moins** une tâche test + une tâche impl. `analyze` le vérifiera.
- **`[P]`** uniquement si la tâche n'a **aucune** dépendance croisée avec les autres `[P]` (fichiers disjoints).
- **Une tâche = un commit vérifiable** : critère de succès observable, pour un `git revert` propre et pour que le workflow d'implémentation puisse prouver chaque pas.
- **Rien hors périmètre** : pas de tâche qui n'implémente pas un FR ou la vérif.
</guidance>

<completion>
Le plan de tâches est terminé quand :
- [ ] Chaque `FR`/`SHALL` de la spec est couvert par ≥ 1 tâche test **et** ≥ 1 tâche impl.
- [ ] Chaque tâche porte un backref `_Requirements:_` valide.
- [ ] L'ordre TDD est respecté (test avant impl) et les dépendances (`bloqué par`) sont explicites.
- [ ] Les `[P]` sont réellement indépendantes.
- [ ] Une tâche de **vérif bout-en-bout** (l'étape du plan) clôt la liste.
</completion>
