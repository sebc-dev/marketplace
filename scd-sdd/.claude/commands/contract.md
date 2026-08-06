---
description: "Phase 6 du socle, terminale : assemble CLAUDE.md, le contrat opérationnel. Pointe vers les documents produits sans les recopier, lit les commandes du projet dans docs/ci.md, fond la constitution (principes + seuils), pose la Definition of Done. Court, haut-signal, advisory."
argument-hint: "(aucun — lit docs/brief.md, prd.md, stack.md, adr/, ci.md)"
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

C'est exactement pourquoi la phase `ci` te précède : ce qui est déterministe existe déjà,
figé dans `docs/ci.md`. Tu n'as donc plus à inventer les commandes du projet ni à espérer
que quelqu'un transforme un jour tes phrases en contrôles — tu **lis** les unes et tu
**pointes** les autres.

Ratio : 40% humain / 60% AI (assemblage ; les commandes viennent de `docs/ci.md`, l'humain
valide ce qui est repris).

## Règles absolues

- **Pointer, pas recopier.** Le contenu du Brief, du PRD et de la Stack reste dans
  `docs/`. `CLAUDE.md` mentionne les chemins (`@docs/…`) — recopier garantit la dérive.
- **`@import` avec parcimonie.** Les fichiers `@importés` sont chargés au lancement :
  n'importe que le stable et l'universel.
- **Test de chaque ligne** : « sa suppression ferait-elle échouer Claude ? » Sinon, coupe.
  Cible < 200 lignes.
- **Aucune règle de style écrite à la main.** Le style appartient au linter, qui en est
  la source de vérité.
- **Aucune commande inventée, et plus aucune commande devinée.** Les commandes du projet
  sont celles de `docs/ci.md` — tu les recopies **à l'identique**, un caractère près : une
  variante ici et un contrôle CI vert deviennent deux vérités concurrentes.
- **Advisory ≠ garanti.** Ne présente jamais la Definition of Done comme une contrainte
  exécutée. Ce qui est réellement exécuté, ce sont les contrôles de `docs/ci.md` sous
  protection de branche : nomme-les comme tels, et rien d'autre.

## Processus

1. **Lis les cinq prérequis** : `docs/brief.md`, `docs/prd.md`, `docs/stack.md`,
   `docs/adr/` et `docs/ci.md`. Si l'un manque, **arrête-toi** et renvoie vers la commande
   correspondante — un contrat qui pointe vers un document inexistant est pire qu'un
   contrat absent. `docs/ci.md` absent → `/scd-sdd:ci`, qui est la phase 5.

2. **Charge le template et ses règles** : lis `references/claude-md.md` du skill
   `project-docs`.

3. **Assemble `CLAUDE.md`** selon le template :
   - **Vue d'ensemble** (3-5 bullets) et **pointeurs** `@docs/brief.md`, `@docs/prd.md`,
     `@docs/stack.md`, `docs/adr/` — avec la consigne de ne jamais contredire un ADR
     accepté ;
   - **Commandes** du projet (build, test unitaire, lint/format, run local) : **lues dans
     la table « Commandes du projet » de `docs/ci.md`** et recopiées telles quelles. Tu
     n'interviewes plus et tu n'inventes rien. Une case que `docs/ci.md` laisse en
     `[à compléter]` le reste ici, et tu le **signales** : c'est un trou de la phase `ci`,
     pas une décision à prendre maintenant. Ajoute le pointeur `docs/ci.md` — le détail
     des contrôles y vit, il ne se recopie pas ;
   - **Conventions** qui diffèrent des défauts du langage, uniquement celles-là ;
   - **Principes non-négociables & seuils** — la constitution fondue ici plutôt que dans
     un fichier séparé ; reprends les seuils de déclenchement du skill `project-docs`, en
     nommant `/scd-sdd:kickoff-feature` comme point d'entrée du niveau specs ;
   - **Definition of Done** vérifiable — et vérifiable **par les contrôles bloquants de
     `docs/ci.md`**, nommés par leur job. Un item de DoD qu'aucun contrôle ne couvre reste
     légitime, mais il est advisory : ne le mélange pas avec ceux qui le sont vraiment ;
   - **Gotchas** — les comportements non-évidents qu'un agent ne peut pas deviner, dont
     ceux que `docs/ci.md` déclare **ne pas** couvrir.

4. **Relis contre le bloc `<completion>`** de `references/claude-md.md`.

5. **Signale les étapes aval**, hors socle. La CI n'en est plus une : elle est faite. Ce
   qui reste est l'**immutabilité des ADR** en hook, le **blindage local** — le bloc est
   déjà rendu par `docs/ci.md`, section « Blindage local », tu pointes, tu ne le recopies
   pas — et, si `docs/ci.md` porte encore **À POSER** pour la protection de branche, le
   fait de la poser : sans elle, les contrôles sont informatifs et ta DoD retombe entière
   dans l'advisory. Puis ouvrir la première feature.

6. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu ne recopies aucun extrait du Brief, du PRD, de la Stack, d'un ADR — ni la table des
  contrôles de `docs/ci.md`, dont tu ne prends que les commandes.
- Tu n'inventes aucune commande de build, test ou lint, et tu n'en devines aucune : elles
  viennent de `docs/ci.md`, ou elles y sont un `[à compléter]` que tu reportes tel quel.
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

Le socle est complet, en six documents : Brief, PRD, Stack, ADR, **CI**, CLAUDE.md.
Récapitule les trois étapes recommandées, dans cet ordre :

1. **Ce qui reste déterministe à poser** — la protection de branche si `docs/ci.md` la
   porte encore **À POSER**, puis le blindage local et le hook d'immutabilité des ADR.
   Rappelle la phrase qui décide de tout : tant que la protection de branche n'est pas
   posée, les contrôles de `docs/ci.md` sont informatifs, et `CLAUDE.md` reste seul.
2. **Première feature** — `/clear`, puis `/scd-sdd:kickoff-feature`.
3. **Discipline `/clear`** — une phase, un contexte propre.
