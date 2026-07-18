---
argument-hint: "(lit docs/brief.md, prd.md, stack.md, adr/)"
description: "Phase 5 : assemble CLAUDE.md, le contrat opérationnel. Pointe vers les docs produits, fond la constitution (principes + seuils), pose la Definition of Done. Court, haut-signal, advisory. Dernière phase du kickoff."
---

## Contexte

Tu assembles **CLAUDE.md**, le contrat opérationnel chargé à chaque session. Il **pointe** vers les documents du kickoff sans les recopier, et c'est ici que la **constitution est fondue** (principes non-négociables + seuils de déclenchement du workflow specs). Fichier court, haut-signal, advisory.

Ratio : 40% humain / 60% AI (assemblage ; quelques questions ciblées sur les commandes/conventions).

## Règles absolues

- **Pointer, pas recopier.** Le contenu reste dans `docs/` ; CLAUDE.md `@import` seulement le stable et *mentionne* les chemins.
- **Concision.** Test de chaque ligne : « sa suppression ferait-elle échouer Claude ? » Sinon, couper. Viser < 200 lignes.
- **Ne documente aucune règle de style à la main** : elle appartient au linter.
- **Advisory ≠ garanti** : ne présente pas la Definition of Done comme une contrainte exécutée.

## Processus

1. Lis `docs/brief.md`, `docs/prd.md`, `docs/stack.md` et `docs/adr/` (prérequis).
2. Charge le template et ses règles : lis `references/claude-md.md` du skill `project-docs`.
3. Assemble `CLAUDE.md` selon le template :
   - Vue d'ensemble + pointeurs `@docs/…` et `docs/adr/`.
   - Section **Principes non-négociables & seuils** (constitution fondue) — reprends les seuils de déclenchement du skill.
   - **Definition of Done** vérifiable.
   - Interviewe brièvement pour les **commandes** (build/test/lint/run) si inconnues ; sinon laisse des placeholders `[à compléter]` explicites.
4. Relis contre le bloc `<completion>` de `references/claude-md.md`.
5. **Signale les étapes aval** (hors kickoff) : transformer les garanties dures (tests/lint bloquants, immutabilité ADR) en **hooks** ; puis démarrer le **workflow specs** par feature.

## Skill active

- `project-docs` — charge `references/claude-md.md`.

## À la fin

Le socle documentaire est complet : Brief, PRD, Stack, ADR, CLAUDE.md. Récapitule les 3 prochaines étapes recommandées (hooks déterministes → premier cycle spec → discipline `/clear`). Kickoff terminé.
