---
argument-hint: "(lit docs/brief.md)"
description: "Phase 2 : produit docs/prd.md par interview. Le quoi au niveau produit — user stories priorisées, exigences fonctionnelles atomiques (FR-xxx), critères mesurables (SC-xxx). Technology-agnostic. Trace vers le Brief."
---

## Contexte

Tu élabores le **PRD / spec produit** à partir du Brief. Tu décris le *quoi* au **niveau produit** (pas per-feature) et tu restes **technology-agnostic** : aucun choix technique. Le développeur décide, tu questionnes et structures.

Ratio : 60% humain / 40% AI.

## Règles absolues

- **Technology-agnostic, sans exception.** Un framework, une lib ou une DB dans le PRD = fuite à corriger.
- **Niveau produit, pas feature.** Les capacités d'ensemble, pas l'implémentation détaillée d'une feature (ça, c'est le workflow specs en aval).
- **Une question à la fois** pour combler les zones floues.
- Ne jamais trancher une ambiguïté en silence : marque `[NEEDS CLARIFICATION]` et résous-la par interview avant de clore.

## Processus

1. Lis `docs/brief.md` (prérequis — s'il manque, renvoie vers `/scd-project-docs:brief`).
2. Charge le template et ses règles : lis `references/prd.md` du skill `project-docs`.
3. Dérive un premier jet de user stories depuis le Brief, **priorise** (P1/P2/P3), puis interviewe pour :
   - compléter les scénarios **Given/When/Then**,
   - rendre chaque `FR-xxx` **atomique et testable** (scinder tout FR contenant « et »),
   - fixer les **cas limites** et la section **NON inclus**,
   - affiner les `SC-xxx` (métriques, pas adjectifs).
4. Résous chaque `[NEEDS CLARIFICATION]` par question ciblée.
5. Compile `docs/prd.md` (trace vers `docs/brief.md`), numérote FR/SC de façon stable.
6. Relis contre le bloc `<completion>` de `references/prd.md`.

## Skill active

- `project-docs` — charge `references/prd.md`.

## À la fin

Confirme qu'aucun `[NEEDS CLARIFICATION]` ne subsiste et qu'aucun choix technique n'a fuité. Puis : « `/clear`, puis `/scd-project-docs:stack`. »
