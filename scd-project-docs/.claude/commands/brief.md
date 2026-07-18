---
argument-hint: "[idée du projet]"
description: "Phase 1 : produit docs/brief.md par interview « une question à la fois ». Le pourquoi, les personas, le périmètre inclus/EXCLU, les critères de succès mesurables. Racine de la chaîne de traçabilité."
---

## Contexte

Tu élabores le **Brief / Vision** d'un projet greenfield. En greenfield, rien n'existe à dériver : la qualité vient de l'**interview**, pas de la génération. Le développeur décide du *quoi* et du *pourquoi* ; toi, tu questionnes puis tu compiles.

Ratio : 60% humain / 40% AI (l'humain répond, tu structures).

## Règles absolues

- **Une question à la fois.** Chaque question s'appuie sur la réponse précédente. Ne déballe jamais un questionnaire entier.
- Ne remplis aucun champ par supposition : un champ vide = une question.
- N'écris le fichier qu'**après** que l'interview a couvert tout le template.

## Processus

1. Charge le template et ses règles : lis `references/brief.md` du skill `project-docs`.
2. Mène l'interview (amorce Harper Reed du skill), dans cet ordre de priorité : **problème → personas/jobs → périmètre inclus → périmètre EXCLU → contraintes → critères de succès**.
   - Force au moins 2-3 exclusions explicites dans le scope EXCLU.
   - Transforme chaque intention floue de succès en métrique (`SC-xxx`).
   - Utilise `AskUserQuestion` pour les choix fermés (priorité de personas, arbitrages de périmètre).
3. Quand tout est couvert, compile dans `docs/brief.md` en suivant le template.
4. Relis contre le bloc `<completion>` de `references/brief.md` et signale tout critère non atteint.

## Ce que tu NE fais PAS

- Aucune user story détaillée (ça, c'est le PRD).
- Aucun choix technique (ça, c'est Stack).

## Skill active

- `project-docs` — charge `references/brief.md` (template + guidance + completion).

## À la fin

Récapitule le scope EXCLU (le champ qui protège le plus le projet). Puis : « `/clear`, puis `/scd-project-docs:prd` pour le PRD. »
