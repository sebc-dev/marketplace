---
description: "Phase 3 du socle : produit docs/stack.md en mode « options justifiées » — fondations techniques (langage, framework, DB, auth, déploiement, tests) reliées aux FR/SC du PRD. Prépare la liste des décisions structurantes qui alimentera les ADR."
argument-hint: "(aucun — lit docs/prd.md)"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu établis les **fondations techniques** du projet à partir du PRD.

Le mode est **« options justifiées »** : tu proposes des options argumentées, l'humain
tranche. Ce n'est pas de la politesse — un choix de stack imposé par un agent est un
choix que personne ne peut défendre six mois plus tard, et il est coûteux à inverser.

Ce fichier est une **synthèse**. Le rationale détaillé de chaque décision coûteuse à
inverser part dans un ADR à la phase `adr` : la sortie la plus importante de cette
commande n'est pas le tableau des choix, c'est la **liste des candidats ADR**.

Tu ne décris **pas l'architecture** : la forme de la solution — décomposition, organisation
interne d'un module, invariants du projet — est établie juste après, par `/scd-sdd:archi`,
qui **part de** ce que tu tranches ici. La § Vue d'ensemble y renvoie en une phrase.

Ratio : 50% humain / 50% AI (tu proposes et argumentes, l'humain arbitre).

## Règles absolues

- **Aucune stack par défaut sans arbitrage explicite.** Ni ta préférence, ni le choix le
  plus populaire, ni celui du dernier projet.
- **Chaque choix sert au moins un `FR-xxx`/`SC-xxx`.** La colonne « Sert » n'est pas
  décorative : un choix qui ne sert aucune exigence est du sur-engineering, et il se
  retire.
- **Alternative écartée nommée**, avec sa raison, pour chaque décision structurante.
- **Le PRD n'est jamais rétro-modifié** pour coller à un choix technique. La stack sert
  les exigences, pas l'inverse.
- **Synthèse ici, rationale dans l'ADR.** Ne duplique pas : tu prépares les ADR, tu ne
  les écris pas.

## Processus

1. **Lis `docs/prd.md`** — prérequis strict. S'il manque, **arrête-toi** et renvoie vers
   `/scd-sdd:prd` : sans exigences, aucun choix technique n'est justifiable.

2. **Charge le template et ses règles** : lis `references/stack.md` du skill
   `project-docs`.

3. **Traite chaque domaine structurant** — **langage, framework, base de données, auth,
   cible de déploiement, stratégie de test**, plus tout domaine propre au projet. Pour
   chacun :
   - présente **2-3 options** avec pour/contre **reliés aux `FR`/`SC` concernés** ;
   - **si l'arbitrage dépend d'un fait que tu ne tiens pas de mémoire** — maturité réelle
     d'un framework, limite d'un service géré, état d'un écosystème —, **fais-le sourcer
     avant de trancher** : `/scd-sdd:research` pour un arbitrage entier,
     `/scd-sdd:lookup` pour un fait ponctuel et daté, qui répond en session. Un pour/contre
     écrit au jugé se lit exactement comme un pour/contre sourcé, et il descend ensuite dans
     un ADR **immuable** : c'est là que la chaîne de traçabilité devient un vecteur de
     blanchiment de citation. Annonce la question et laisse l'humain lancer la recherche —
     tu reprends la phase quand le résultat est là ;
   - fais trancher l'utilisateur (`AskUserQuestion`) ;
   - note l'alternative écartée **et sa raison**.

   Un domaine sans objet se marque explicitement « non applicable » — il ne se saute pas
   en silence.

4. **Remplis le tableau « Choix retenus »**, colonne « Sert (FR/SC) » comprise, puis les
   **contraintes techniques transverses** (offline-first, RGPD, latence cible, budget…).

5. **Dresse la liste « Décisions structurantes → candidats ADR »** : une ligne par
   décision **coûteuse à inverser**. Le tri est le travail réel de cette étape —
   langage, architecture, DB, auth, déploiement, stratégie de test en sont ; le choix
   d'un utilitaire mineur ou d'une convention évidente n'en est pas. C'est cette liste
   que `/scd-sdd:adr` consommera, une ligne = un ADR.

6. **Compile `docs/stack.md`** (trace vers `docs/prd.md`). Laisse la colonne « ADR » du
   tableau **vide** : elle sera back-fillée par `/scd-sdd:adr`.

7. **Relis contre le bloc `<completion>`** de `references/stack.md`.

8. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu n'écris aucun ADR ici, et tu ne rédiges pas le rationale détaillé d'une décision.
- Tu ne descends pas au niveau de l'implémentation (schéma de tables, arborescence de
  fichiers, noms de modules).
- Tu ne modifies pas `docs/prd.md` ni `docs/brief.md`.
- Tu n'ajoutes aucune dépendance sans la relier à une exigence.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `stack`
- **Résultat** : les choix structurants · le nb de décisions → ADR.
  Exemple : `Astro 6 + Cloudflare + D1 · 4 décisions → ADR`.

## Skill active

- `project-docs` — charge `references/stack.md`.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Affiche la liste **« Décisions structurantes → candidats ADR »** : c'est elle qui pilote
la phase `adr`, et le moment de la corriger est maintenant, pas après.

Puis : « `/clear`, puis `/scd-sdd:archi` — la structure, avant de figer les décisions : elle
constate ce que ces choix imposent déjà, et en tire les invariants que `/scd-sdd:adr` figera
avec ceux d'ici. »
