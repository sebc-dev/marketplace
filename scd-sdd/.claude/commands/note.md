---
description: "Consigne un travail hors-cycle DÉJÀ TERMINÉ — debug, hotfix, refactor, spike, montée de version, ops — en écrivant une fiche directement dans docs/chantiers/archive/, datée du jour. Ce qu'un commit ne dit jamais : le pourquoi, la cause trouvée, ce qui a été écarté. N'ouvre aucun chantier en cours et ne joue aucune commande du cycle."
argument-hint: "<ce qui a été fait — texte libre>"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - AskUserQuestion
  - Bash(git log *)
  - Bash(git rev-parse *)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(date *)
---

## Contexte

Une partie du travail réel ne passe par aucune des phases du cycle : un flake corrigé, une montée
de version, un spike qui tranche une option, un hotfix livré en quarante minutes. Rien ne le
porte — ni fichier de specs, ni case, ni PR de ticket. Au mieux un commit, qui dit le **quoi** et
jamais le **pourquoi**, ni la cause trouvée, ni ce qui a été essayé sans succès.

Tu écris une fiche de chantier **déjà fermée** : directement dans `archive/`, datée du jour. Le
tri par nom du répertoire en fait la chronologie du hors-cycle, sans index à maintenir.

Tu es le pendant de `/scd-sdd:pause` : lui consigne un travail **ouvert** pour le reprendre, toi
un travail **terminé** pour s'en souvenir.

Ratio : 30% humain / 70% AI (l'humain dit ce qui mérite une fiche ; tu la composes et la ranges).

## Règles absolues

- **Le travail doit être terminé.** S'il est en cours, c'est `/scd-sdd:pause` — dis-le et
  n'écris rien dans `archive/`.
- **Une invocation, une fiche.** Une session qui a fait trois choses en écrit une par sujet, ou
  une seule qui les résume. Jamais un déversement.
- **Tu ne consignes jamais du travail que le cycle porte lui-même.** Un ticket implémenté, une
  spec écrite, un ADR figé : ces faits vivent dans leurs artefacts, et une fiche qui les redirait
  serait une seconde vérité. Ce que tu consignes est ce qu'**aucun fichier du cycle ne porte** —
  un debug, un hotfix, un spike, une montée de version.
- **Aucun fait dérivable dans la fiche.** Ce qui compte comme tel est énuméré par le bloc
  `<interdits>` que tu charges — tu ne t'en fais pas une liste de tête plus courte.
- **Plafond ~50 lignes.** Un dépassement ne peut pas signaler une feature — le travail est
  terminé. Il signale que la fiche **héberge** la connaissance au lieu de l'**indexer** : route le
  surplus (candidat ADR, `spec.md`, message de commit) et garde l'index.
- **Tu commites la fiche**, `git add` scopé au fichier, sans jamais toucher au reste de l'arbre.
- **Tu ne fais pas le travail** que tu consignes. Il a déjà eu lieu.
- **Le problème avant les options.** Quand tu demandes de trancher — la portée, ou s'il faut une
  fiche du tout —, dis d'abord en une ou deux phrases ce qui est en jeu, et donne à chaque option
  sa **conséquence concrète** : où la fiche atterrira, et qui la retrouvera. Quand tu refuses
  d'écrire au titre du test des trois conditions, **dis laquelle a manqué et pourquoi** — un refus
  non motivé se lit comme une panne.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain —
  chantier, portée, hors-cycle, archive… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain emploie
  le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Définitions

- **Chantier archivé** : une fiche dans `docs/chantiers/archive/AAAA-MM-JJ-slug.md`. Contrat :
  skill `chantier`.
- **Travail hors-cycle** : ce qui ne relève d'aucune phase du cycle. Typiquement `debug`, `fix`,
  `refactor`, `deps`, `spike`, `ops` — ce vocabulaire sert à *penser* la fiche, pas à la baliser :
  le titre dit ce qui a été fait, en français.

## Processus

1. **Vérifie que le travail est terminé.** En cours → renvoie vers `/scd-sdd:pause`, n'écris rien.

2. **Applique le test des trois conditions.** Les trois doivent tenir, sinon **dis-le et n'écris
   rien** :
   - **ça survit à la session** — le fait reste vrai et utile après un `/clear`. « lancé les
     tests », « lu `routes.ts` » : non ;
   - **ce n'est pas dérivable** — un fichier, un commit, une case, une PR ou un ADR ne le porte pas
     déjà. Un correctif commité ne mérite une fiche que si le commit seul ne dit pas *pourquoi* —
     ce qui est le cas d'une cause racine ou d'une impasse, presque jamais d'un renommage ;
   - **ça a un destinataire** — la fiche répond à une question qu'un humain ou une session vierge
     posera : « pourquoi ce code est comme ça ? », « a-t-on déjà essayé X ? ».

3. **Résous la portée.** Le travail touche `specs/NNN-slug/` ou son code → `NNN-slug` ; il touche
   le socle → `socle` ; sinon → `hors-cycle`. Ambigu → `AskUserQuestion`. **Zéro candidate n'est
   pas une erreur** : c'est `hors-cycle`.

4. **Compose la fiche**, format du skill `chantier`, avec `## Issue` d'emblée puisqu'elle naît
   fermée. Les rubriques utiles ici :
   - `## Objectif` — ce qu'il fallait obtenir, ou le symptôme constaté ;
   - `## Issue` — ce qui a été fait, la cause trouvée, le commit ou la PR ;
   - `## Écarté` — les pistes essayées sans succès. **C'est la rubrique de plus forte valeur** :
     rien d'autre dans le projet ne les porte ;
   - `## Contexte à charger` — **facultatif ici**, et souvent vide : une fiche archivée n'est pas
     faite pour être reprise. N'y mets que ce qu'une archéologie future voudra rouvrir.

   Pas de `## Prochaine étape` : il n'y en a pas.

5. **Prends l'ancre** (`git rev-parse --abbrev-ref HEAD`, `--short HEAD`) et la date du jour, qui
   devient le préfixe du nom de fichier.

6. **Écris** `docs/chantiers/archive/AAAA-MM-JJ-slug.md`, puis `git add <la fiche>` et
   `git commit -m "chore(chantier): <titre>"`.

<report>
```
✅ Chantier archivé — « vitest 1.6 → 3.0 »
   docs/chantiers/archive/2026-08-05-vitest-3.md · hors-cycle · commit 9c4d2b1

   Issue   4 tests réécrits (API `vi.mocked`), CI au vert.
   Écarté  Rester en 1.6 — `@vitest/coverage-v8` ne se construit plus sous Node 24.
```
</report>

## Ce que tu NE fais PAS

- Tu ne fais pas le travail, tu le consignes après coup.

- Tu ne crées pas de fiche dans `en-cours/` ni dans `en-attente/` — seulement dans `archive/`.
- Tu ne commites que la fiche, jamais le reste de l'arbre.
- Tu ne consignes pas une décision **structurante** : elle va dans `docs/adr/_candidates/`. Ni un
  changement de comportement : il va dans `spec.md`. Ni le détail d'un changement de code : il va
  dans le message de commit. La fiche **indexe** un événement, elle n'héberge pas la connaissance
  du projet.
- Tu ne réécris ni ne supprimes une fiche déjà archivée.

## Skill active

- `chantier` — contrat de `docs/chantiers/` : anatomie, nommage, `Portée`, cycle de vie. Tu
  **écris** une fiche, donc tu charges `references/fiche.md` **intégralement sauf `<elagage>`** —
  le *pourquoi*, les interdits, le template et les règles de commit ; l'élagage appartient à
  `pause`, une fiche d'archive naît fermée. Tu n'as **pas** besoin de
  `references/manifeste.md` : une fiche archivée n'a en général pas de manifeste.
- `specs` — section « Cibler une feature », uniquement pour résoudre la portée.

## À la fin

Rappelle le chemin de la fiche et son commit, en une ligne.

Si le travail que tu viens de consigner révèle un manque dans le contrat — un critère absent, un
cas limite jamais spécifié — dis-le et renvoie vers `/scd-sdd:spec NNN` ou
`/scd-sdd:tickets NNN`. **Tu ne le corriges pas toi-même.**
