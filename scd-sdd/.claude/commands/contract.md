---
description: "Phase 5 du socle, terminale : assemble CLAUDE.md, le contrat opérationnel. Pointe vers les documents produits sans les recopier, fond la constitution (principes + seuils), pose la Definition of Done. Court, haut-signal, advisory."
argument-hint: "(aucun — lit docs/brief.md, prd.md, stack.md, adr/)"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu assembles **`CLAUDE.md`**, le contrat opérationnel chargé à chaque session. C'est la
dernière phase du socle.

Sa contrainte dominante est la **concision**, et elle n'est pas esthétique : `CLAUDE.md`
occupe du contexte à chaque session, sur chaque tâche. Chaque ligne inutile dilue les
règles qui comptent. D'où la règle du pointeur — le contenu reste dans `docs/`, tu
n'écris que le chemin.

Sa seconde propriété est d'être **advisory**. Écrire « les tests doivent passer » ne fait
pas passer les tests. Ce qui doit arriver à 100 % est un hook, un linter ou un test — pas
une phrase. Tu peux le noter, tu ne dois pas le présenter comme garanti.

Ratio : 40% humain / 60% AI (assemblage, plus quelques questions ciblées sur les
commandes du projet).

## Règles absolues

- **Pointer, pas recopier.** Le contenu du Brief, du PRD et de la Stack reste dans
  `docs/`. `CLAUDE.md` mentionne les chemins (`@docs/…`) — recopier garantit la dérive.
- **`@import` avec parcimonie.** Les fichiers `@importés` sont chargés au lancement :
  n'importe que le stable et l'universel.
- **Test de chaque ligne** : « sa suppression ferait-elle échouer Claude ? » Sinon, coupe.
  Cible < 200 lignes.
- **Aucune règle de style écrite à la main.** Le style appartient au linter, qui en est
  la source de vérité.
- **Advisory ≠ garanti.** Ne présente jamais la Definition of Done comme une contrainte
  exécutée.

## Processus

1. **Lis les quatre prérequis** : `docs/brief.md`, `docs/prd.md`, `docs/stack.md` et
   `docs/adr/`. Si l'un manque, **arrête-toi** et renvoie vers la commande correspondante
   — un contrat qui pointe vers un document inexistant est pire qu'un contrat absent.

2. **Charge le template et ses règles** : lis `references/claude-md.md` du skill
   `project-docs`.

3. **Assemble `CLAUDE.md`** selon le template :
   - **Vue d'ensemble** (3-5 bullets) et **pointeurs** `@docs/brief.md`, `@docs/prd.md`,
     `@docs/stack.md`, `docs/adr/` — avec la consigne de ne jamais contredire un ADR
     accepté ;
   - **Commandes** du projet (build, test unitaire, lint/format, run local) : en
     greenfield elles sont souvent inconnues — interviewe brièvement, et à défaut laisse
     des placeholders `[à compléter]` **explicites** plutôt qu'une commande inventée ;
   - **Conventions** qui diffèrent des défauts du langage, uniquement celles-là ;
   - **Principes non-négociables & seuils** — la constitution fondue ici plutôt que dans
     un fichier séparé ; reprends les seuils de déclenchement du skill `project-docs`, en
     nommant `/scd-sdd:kickoff-feature` comme point d'entrée du niveau specs ;
   - **Definition of Done** vérifiable ;
   - **Gotchas** — les comportements non-évidents qu'un agent ne peut pas deviner.

4. **Relis contre le bloc `<completion>`** de `references/claude-md.md`.

5. **Signale les étapes aval**, hors socle : transformer les garanties dures (tests et
   lint bloquants, immutabilité des ADR) en **hooks** déterministes ; puis ouvrir la
   première feature.

6. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu ne recopies aucun extrait du Brief, du PRD, de la Stack ou d'un ADR.
- Tu n'inventes aucune commande de build, test ou lint : sans réponse, c'est
  `[à compléter]`.
- Tu n'installes aucun hook ici — tu les recommandes.
- Tu ne documentes aucune règle de style, d'indentation ou de formatage.
- Tu ne modifies aucun document du socle déjà produit.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `contract`
- **Résultat** : nb de principes · taille de la Definition of Done.
  Exemple : `CLAUDE.md · 6 principes · DoD 5 items`.

## Skill active

- `project-docs` — charge `references/claude-md.md`.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Le socle est complet : Brief, PRD, Stack, ADR, CLAUDE.md. Récapitule les trois étapes
recommandées, dans cet ordre :

1. **Hooks déterministes** — transformer en hooks ce que `CLAUDE.md` ne peut que
   conseiller.
2. **Première feature** — `/clear`, puis `/scd-sdd:kickoff-feature`.
3. **Discipline `/clear`** — une phase, un contexte propre.
