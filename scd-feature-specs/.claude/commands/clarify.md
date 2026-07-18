---
argument-hint: "[NNN ou slug de la feature — optionnel, résolu sinon]"
description: "Phase 2 : gate de clarification. Résout chaque [NEEDS CLARIFICATION] de spec.md par questions structurées (AskUserQuestion) et met la spec à jour. Ne passe pas tant qu'il reste des marqueurs. À jouer avant plan."
---

## Contexte

Tu tiens la **gate de clarification**, juste avant le plan. Une ambiguïté non résolue devient un choix silencieux (donc une hallucination probable) au moment du plan ou de l'implémentation. Tu ne produis pas de nouveau fichier : tu **édites `spec.md` en place**.

Ratio : 60% humain / 40% AI (l'humain tranche, tu répercutes en EARS).

## Règles absolues

- **Une ambiguïté = une question fermée.** Ne tranche jamais toi-même une zone floue.
- Chaque réponse est répercutée en **critère EARS testable**, pas en note de prose.
- Tu ne passes pas la gate tant qu'il reste **un seul** `[NEEDS CLARIFICATION]`.

## Processus

1. **Résous la feature cible** — règle de résolution du skill (section « Cibler une feature ») : argument `NNN`/slug s'il est fourni ; sinon l'unique feature dont le `spec.md` contient encore des `[NEEDS CLARIFICATION]` ; sinon liste les candidates et demande. **Annonce la cible retenue.**
2. Charge la référence : lis `references/clarify.md` du skill `feature-specs`.
3. Scanne `specs/<cible>/spec.md` : liste tous les `[NEEDS CLARIFICATION]` + les zones sous-spécifiées (critère sans valeur mesurable, cas limite absent, contrat d'E/S flou).
4. Pour chaque point, pose une question fermée via `AskUserQuestion` (≤ 4 par appel, options mutuellement exclusives).
5. Répercute chaque réponse dans `spec.md` : remplace le marqueur par le critère EARS résolu, ajuste les FR/SC dépendants, garde les IDs stables.
6. Re-scanne ; itère jusqu'à **zéro** marqueur.
7. Relis contre le bloc `<completion>` de `references/clarify.md`.

## Ce que tu NE fais PAS

- Aucun choix technique ni découpage en tâches.
- Tu n'introduis pas de nouvelle exigence : tu **désambiguïses** l'existant.

## Skill active

- `feature-specs` — charge `references/clarify.md`.

## À la fin

Confirme « 0 `[NEEDS CLARIFICATION]` restant ». Puis, en passant le `NNN` de la cible : « `/clear`, puis `/scd-feature-specs:plan NNN` (en plan mode, idéalement `opusplan`). »
