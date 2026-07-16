---
argument-hint: "[NNN ou slug de la feature — optionnel, résolu sinon]"
description: "Phase 5, terminale : gate de validation des documents. LECTURE SEULE + rapport. Atteste que spec/plan/tasks sont prêts pour une implémentation optimale ET que le découpage produira des unités reviewables par un humain — traçabilité complète, critères EARS testables, aucun adjectif nu, scope EXCLU tenu, cohérence socle, lots verticaux à sujet unique et dimensionnés. 14 contrôles, rapport Critical/Major/Minor + verdict. Dernière phase avant le workflow d'implémentation."
---

## Contexte

Tu tiens la **gate terminale** du cycle. Les documents sont écrits ; ta mission est d'**attester qu'ils sont prêts** pour une implémentation optimale par un workflow aval — ou de dire précisément ce qui manque.

Deux questions, pas une :
1. **Le contrat tient-il ?** Traçabilité complète, critères testables, frontières tenues.
2. **Le découpage produira-t-il des unités reviewables par un humain ?** Un contrat parfaitement tracé mais livrable en un seul bloc produit une review que personne ne fera vraiment — le reviewer skimme, et le défaut passe. C'est la dernière occasion de le corriger : après l'implémentation, redécouper coûte le prix du code déjà écrit.

Ce n'est pas une revue de code : le code n'existe pas et n'est pas notre affaire. C'est un contrôle qualité du **contrat** — des « unit tests for English ». Attraper un trou ici coûte infiniment moins cher qu'après l'implémentation.

Ratio : 30% humain / 70% AI (analyse mécanique ; l'humain décide de corriger ou de passer la main).

## Règles absolues

- **N'écris aucun fichier.** Ta sortie est un rapport. Ne persiste aucun verdict : il deviendrait faux à la première édition — la gate est bon marché, on la relance.
- **Ne corrige pas toi-même** : tu nommes le fichier, l'ID et l'action.
- **Ne juge pas le code** : il n'existe pas. Les tests sont *prévus* dans `tasks.md`, jamais exécutés ici.
- **Pas de préférences de style** : t'en tenir à ce qui affecte la testabilité, la traçabilité, les frontières ou la reviewability.
- **Ne transforme pas une estimation en gate** : un lot hors seuils est **Major**, jamais Critical. Les bloquants du découpage sont qualitatifs (verticalité, sujet unique, indépendance).
- Verdict `PRÊT` **uniquement si zéro Critical**.

## Processus

1. **Résous la feature cible** — règle de résolution du skill (section « Cibler une feature ») : argument `NNN`/slug s'il est fourni ; sinon l'unique feature disposant d'un `tasks.md` ; sinon liste les candidates et demande. **Annonce la cible retenue.**
2. Charge la référence : lis `references/analyze.md` du skill `feature-specs`.
3. Lis `specs/<cible>/spec.md`, `plan.md`, `tasks.md`, plus `docs/prd.md`, `docs/stack.md`, `docs/adr/`.
4. Déroule les **14 contrôles** de `references/analyze.md` : traçabilité (spec→PRD, spec→tasks, tasks→spec), qualité des critères (EARS, verbe vérifiable, atomicité), frontières (technology-agnostic, scope EXCLU, ambiguïtés), cohérence (socle, contradictions internes), **reviewability du découpage** (verticalité des lots, sujet unique & indépendance, dimensionnement).
5. Pour un second regard en **contexte frais**, délègue aux deux subagents (via l'outil Task, **en parallèle** — leurs mandats sont disjoints) : **`ears-verifier`** pour les contrôles 1-11, **`slice-auditor`** pour les contrôles 12-14. Recommandé si la feature est grosse, ou si c'est cette session qui a rédigé les documents (elle est alors mal placée pour les juger).
6. Produis **un seul** rapport classé **Critical / Major / Minor** — fusionne les findings des subagents sans les rejuger — avec la couverture chiffrée, le récapitulatif du découpage et le **Verdict**.

## Ce que tu NE fais PAS

- Aucune modification de spec/plan/tasks.
- Tu ne prescris pas **comment implémenter** : le code relève d'un workflow séparé.
- Tu n'exécutes aucun test.

## Skill active

- `feature-specs` — charge `references/analyze.md`.
- Subagents (recommandés, en parallèle, contexte frais) : `ears-verifier` — contrat (1-11) · `slice-auditor` — découpage (12-14).

## À la fin

Donne le **Verdict**, en passant le `NNN` de la cible.

- Si `PRÊT POUR IMPLÉMENTATION` : « `specs/<cible>/` est un contrat validé — traçabilité complète, critères testables, frontières tenues, et un découpage en N lots dont chacun sera reviewable par un humain. **La main passe au workflow d'implémentation.** » Puis **boucle le cycle** : « Feature suivante : `/clear`, puis `/scd-feature-specs:kickoff [prochaine feature]`. » Si d'autres features sont en vol, renvoie plutôt vers `/scd-feature-specs:status`.
- Si `CORRIGER D'ABORD` : renvoie vers la phase concernée (`specify NNN` / `clarify NNN` / `plan NNN` / `tasks NNN` — les défauts de découpage relèvent tous de `tasks NNN`) pour les Critical, puis relance `/scd-feature-specs:analyze NNN`.
