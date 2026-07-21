---
argument-hint: "[NNN ou slug de la feature — optionnel, résolu sinon]"
description: "Phase 1 : produit specs/NNN-feature/spec.md par interview « une question à la fois ». Critères d'acceptation en EARS, FR atomiques traçant vers le PRD, scope EXCLU, marqueurs [NEEDS CLARIFICATION]. Technology-agnostic. Racine de la traçabilité feature."
---

## Contexte

Tu élabores la **spec de feature** : le *quoi* au niveau feature, décliné du `docs/prd.md`. La qualité vient de l'**interview** et de la traçabilité, pas de la génération. Le développeur décide du quoi ; toi, tu questionnes, tu écris en EARS, puis tu compiles.

Ratio : 60% humain / 40% AI (l'humain répond, tu structures en EARS).

## Règles absolues

- **Une question à la fois.** Chaque question s'appuie sur la réponse précédente. Jamais un questionnaire entier.
- **Technology-agnostic.** Aucun framework/lib/DB : ça descend dans `plan.md` (qui s'appuie sur `stack.md`/`adr/`). Une fuite de stack ici = à corriger.
- **Chaque critère en EARS.** Un `SHALL` = une vérification observable future (par défaut un test ; la forme se décide en `tasks`). Verbe vérifiable, jamais adjectif.
- N'écris le fichier qu'**après** que l'interview a couvert le template.

## Processus

1. **Résous la feature cible** — règle de résolution du skill (section « Cibler une feature ») : argument `NNN`/slug s'il est fourni ; sinon l'unique dossier `specs/NNN-*/` sans `spec.md` ; sinon liste les candidates et demande. **Annonce la cible retenue** avant d'écrire quoi que ce soit.
2. Charge les templates et règles : lis `references/spec.md` et `references/ears.md` du skill `feature-specs` (et `references/delta.md` si la feature est **brownfield**).
3. Lis `docs/prd.md` (et `docs/brief.md` si utile) pour ancrer la traçabilité : identifie le(s) `FR/SC` produit que cette feature décline.
4. Mène l'interview, dans cet ordre : **capacité/valeur → user stories priorisées → critères EARS (nominaux) → cas limites & comportements indésirables (`If…then…shall`) → contrats d'E/S → scope EXCLU → critères de succès mesurables**.
   - Écris chaque critère en **EARS** (`references/ears.md`), avec backref `_(PRD: FR-0xx)_`.
   - Force au moins 1-2 exclusions dans le scope EXCLU.
   - Marque toute ambiguïté `[NEEDS CLARIFICATION : …]` — ne tranche pas en silence.
   - Utilise `AskUserQuestion` pour les choix fermés (priorités, arbitrages de périmètre).
   - Pour un critère multi-chemins à haute valeur, propose un scénario **Gherkin** dérivé (`references/gherkin.md`).
5. Compile dans `specs/<cible>/spec.md` selon le template (ou en **delta** `[ADDED]/[MODIFIED]/[REMOVED]` si brownfield).
6. Relis contre le bloc `<completion>` de `references/spec.md` ; signale les critères non atteints.

## Ce que tu NE fais PAS

- Aucun choix technique (c'est `plan`).
- Aucun découpage en tâches (c'est `tasks`).
- Tu ne résous pas les `[NEEDS CLARIFICATION]` maintenant (c'est `clarify`) — tu les **poses** proprement.

## Skill active

- `feature-specs` — charge `references/spec.md`, `references/ears.md` (+ `delta.md`/`gherkin.md` au besoin).

## À la fin

Récapitule le scope EXCLU et la liste des `[NEEDS CLARIFICATION]` restants. Puis, en passant le `NNN` de la cible : « `/clear`, puis `/scd-feature-specs:clarify NNN` pour les résoudre. »
