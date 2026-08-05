---
description: "Phase 2 des specs : gate de clarification. Résout chaque [NEEDS CLARIFICATION] de spec.md par questions fermées et répercute la réponse en critère EARS. Ne passe pas tant qu'il en reste un seul. À jouer avant plan."
argument-hint: "[NNN ou slug — optionnel, résolu sinon]"
allowed-tools:
  - Read
  - Glob
  - Edit
  - AskUserQuestion
---

## Contexte

Tu tiens la **gate de clarification**, juste avant le plan.

Une ambiguïté non résolue ne reste pas ambiguë : elle devient un choix silencieux au moment du
plan ou de l'implémentation, pris par une IA qui n'a pas l'information et le comblera par
plausibilité. C'est le point du cycle où une question coûte le moins cher.

Tu ne produis aucun nouveau fichier : tu **édites `spec.md` en place**.

Ratio : 60% humain / 40% AI (l'humain tranche, tu répercutes en EARS).

## Règles absolues

- **Une ambiguïté = une question fermée.** Tu ne tranches jamais toi-même une zone floue, même
  quand la réponse te paraît évidente.
- **Chaque réponse est répercutée en critère EARS testable**, pas en note de prose. Une réponse
  qui n'aboutit pas à un critère vérifiable n'a rien résolu.
- **Les IDs restent stables.** Un `FR` clarifié garde son numéro ; ce sont les backrefs aval
  qui en dépendent.
- **Tu ne passes pas la gate tant qu'il reste un seul `[NEEDS CLARIFICATION]`.**

## Processus

1. **Résous la feature cible** — règle de résolution du skill `feature-specs`, section
   « Cibler une feature ». Candidature propre à cette phase : la feature dont le `spec.md`
   **contient encore des `[NEEDS CLARIFICATION]`**. **Annonce la cible retenue.**

2. **Charge la référence** : `references/clarify.md` du skill `feature-specs`.

3. **Scanne `specs/<cible>/spec.md`** et dresse la liste complète : les marqueurs explicites
   **et** les zones sous-spécifiées qui n'en portent pas — critère sans valeur mesurable, cas
   limite absent, contrat d'E/S flou, comportement d'erreur non dit.

4. **Pour chaque point, pose une question fermée** via `AskUserQuestion` : ≤ 4 options,
   mutuellement exclusives, chacune décrivant sa conséquence. Regroupe les questions
   indépendantes dans un même appel.

5. **Répercute chaque réponse dans `spec.md`** : remplace le marqueur par le critère EARS
   résolu, ajuste les `FR`/`SC` dépendants, garde les IDs stables.

6. **Re-scanne et itère** jusqu'à **zéro** marqueur.

7. **Relis contre le bloc `<completion>`** de `references/clarify.md`.

8. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Aucun choix technique ni découpage en tâches.
- **Tu n'introduis aucune exigence nouvelle.** Tu désambiguïses l'existant. Une idée qui surgit
  pendant l'interview et qui élargit le périmètre se propose à l'humain, elle ne s'écrit pas
  d'autorité — c'est du scope creep sans gate.
- Tu ne supprimes pas un marqueur sans réponse : tu le résous ou tu t'arrêtes.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/NNN-slug.md`,
par `Edit` ciblé :

- **Phase** : `clarify`
- **Résultat** : le nombre résolu et le nombre restant.
  Exemple : `2 résolus · 0 restant`.

Une passe interrompue avec des marqueurs restants se consigne quand même — `1 résolu · 3
restants` est un fait, et la ligne suivante montrera la reprise.

## Skill active

- `feature-specs` — charge `references/clarify.md`.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Confirme « **0 `[NEEDS CLARIFICATION]` restant** » — ou nomme ceux qui restent et dis pourquoi.
Puis, en passant le `NNN` : « `/clear`, puis `/scd-sdd:plan NNN` (en plan mode, idéalement
`opusplan`). »
