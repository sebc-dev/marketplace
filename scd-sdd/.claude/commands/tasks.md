---
description: "Phase 4 des specs : produit specs/NNN-slug/tasks.md. Lots de review Rn (vertical slices dimensionnées pour être reviewables par un humain : une tranche qui traverse toutes les couches et livre un morceau de fonctionnalité complet, relisable seul) découpés en tâches Tn ordonnées par dépendances, marqueurs [P] (parallélisable), backref _Requirements:_ (le fil vers les exigences couvertes), mode de vérification déclaré par lot. Un lot ≈ une PR ; une tâche = un critère observable = un commit."
argument-hint: "[NNN ou slug — optionnel, résolu sinon]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu découpes `plan.md` en **lots de review traçables**, à deux granularités :

- le **lot `Rn`** est l'unité de **review humaine** : une vertical slice livrant une capability
  vérifiable, dimensionnée pour être reviewée d'un bloc une fois implémentée ;
- la **tâche `Tn`** est l'unité de **progression** : un critère observable = un commit = une
  vérification au vert.

Pourquoi les lots : un `tasks.md` parfaitement tracé mais livrable en un seul bloc produit une
review que personne ne fera vraiment — le reviewer skimme, et le défaut passe. Le
dimensionnement se décide **ici** ; en aval, redécouper coûte le prix du code déjà écrit.

`tasks.md` est le **contrat** remis au niveau implémentation, et son état inter-sessions.

Ratio : 40% humain / 60% AI (découpage mécanique ; l'humain valide l'ordre et la granularité).

## Règles absolues

- **Vertical, jamais horizontal.** Un lot traverse les couches et livre de la valeur
  vérifiable. « Créer la table » / « créer l'API » / « créer l'UI » sont trois couches, pas
  trois lots : leur correction ne se juge qu'en assemblage.
- **Un seul sujet par lot**, nommable en une phrase **sans « et »**.
- **Mode de vérification déclaré par lot** (`_vérif : <mode>_`) : `TDD` par défaut, sinon
  `test-after`, `check` ou `inhérent` — et tout mode ≠ `TDD` porte une **justification d'une
  ligne**. En `TDD`, la tâche « écrire le test » précède « implémenter ». L'ordre de
  vérification vit **dans** le lot, jamais entre les lots. `check`/`inhérent` sont réservés au
  non-testable (visuel, CI, infra, config, one-shot) — **jamais sur de la logique métier**.
- **Backref `_Requirements:_` sur chaque tâche.** Une tâche sans backref est du scope creep
  suspect : elle n'implémente rien qu'on ait demandé.
- **Couverture** : chaque `FR`/`SHALL` a, dans **un seul** lot, ≥ 1 tâche d'impl **et** ≥ 1
  vérification observable (tâche test, tâche check, ou le critère d'acceptation de l'impl en
  mode `inhérent`).
- **`[P]` seulement si aucune dépendance croisée** (fichiers disjoints) — au niveau tâche comme
  au niveau lot.
- **Cases écrites vierges** (`- [ ]`). Elles seront cochées au niveau implémentation, pas ici.
- **Le problème avant les options.** Avant chaque arbitrage — l'étape 5bis en est l'application —,
  pose en deux ou trois phrases ce qui est en jeu pour ce projet et en quoi les options diffèrent.
  Chaque option décrit sa **conséquence en termes du projet**, jamais en jargon.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — EARS,
  gate, lot, ADR, invariant, advisory… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Un ID se cite avec son intitulé** à sa première mention — « FR-003 (export CSV) », jamais
  « FR-003 » nu. La règle vaut pour **tout** identifiant que tu emploies, y compris ceux que le
  projet ou la session viennent de créer et que le plugin ne connaît pas. Un identifiant seul
  n'explique rien à qui ne l'a pas sous les yeux.

## Processus

1. **Résous la feature cible** — règle de résolution du skill `feature-specs`, section
   « Cibler une feature ». Candidature propre à cette phase : la feature avec `plan.md` et
   **sans `tasks.md`**. **Annonce la cible retenue.**

1bis. **Charge le chantier de gate, s'il y en a un** — `Glob` sur
   `docs/chantiers/en-cours/*-gate-<cible>.md`. Une fiche ouverte signifie qu'une passe
   `/scd-sdd:analyze` a laissé une liste de corrections : lis son `## À corriger` et son
   `## Écarté`, et **pars de là**. C'est ici que ça compte le plus : **tous** les défauts de
   découpage te reviennent, et re-dériver les lots à froid recasse ce qui allait autant que ça
   corrige — c'est exactement la boucle `tasks` ↔ `analyze`.

   Traite les entrées dont la ligne `Phase :` te désigne ; **laisse les autres intactes**, elles
   relèvent d'une autre commande. Et **ne modifie pas la fiche** : c'est `/scd-sdd:analyze` qui
   l'actualise, en constatant à la passe suivante ce qui a disparu.

   Pas de fiche → tu pars du contrat. Ce n'est pas une anomalie.

2. **Charge les références** : `references/tasks.md` **et** `references/reviewability.md` du
   skill `feature-specs`. La seconde n'est pas optionnelle — c'est elle qui porte les patterns
   de scission.

3. **Lis les prérequis** : `specs/<cible>/plan.md` et `spec.md`.

4. **Découpe d'abord en lots `Rn`** — une capability par lot, ordonnés par dépendance. Chaque
   lot porte sa ligne méta et sa ligne fichiers :

   ```
   ## R1 — [capability nommable en une phrase]
   _Livre : FR-001, FR-002_ · _vérif : TDD_ · _~180 lignes est._ · _3 concepts_ · dépend de : —
   Fichiers : `api/signup.ts`, `db/users.ts`, `ui/SignupForm.tsx`
   ```

   Le budget en lignes est un **ordre de grandeur dérivé des « Fichiers touchés » du plan** —
   pas une mesure : ce niveau ne lit pas le code.

5. **Applique les signaux de scission** de `references/reviewability.md` (≈ 400 lignes
   estimées, ≈ 7 concepts, ≈ 5-7 critères par exigence). Un dépassement → **scinde
   verticalement** (étapes du workflow, variations de règle, variations de données, CRUD,
   chemins, effort). À l'inverse, un lot qui ne livre aucun incrément vérifiable est une couche
   déguisée : refusionne-le.

5bis. **Fais valider le découpage** — c'est le point de validation qu'annonce le ratio, et le seul
   moment où l'humain voit les lots avant qu'ils soient écrits ; en aval, redécouper coûte le prix
   du code déjà écrit. Présente la liste des lots — titre, ce que chacun livre, son budget estimé,
   ses dépendances — puis pose **une** question par `AskUserQuestion` : le découpage tient-il ?
   Formule-la en disant d'abord ce qui est en jeu (un lot trop gros produit une review que personne
   ne fera vraiment ; un lot trop petit ne livre rien de vérifiable), et fais porter à chaque option
   sa conséquence sur ce projet-ci, pas en jargon.

   Ce qui se valide est l'**ordre** et la **granularité** — jamais le contenu des tâches, qui
   dérive du contrat. Un lot que l'humain veut scinder ou refusionner se rejoue à l'étape 4 ;
   ensuite seulement on remplit.

   **Une seule question, une seule fois.** Si le découpage vient d'un chantier de gate (étape 1bis)
   et que rien n'a bougé, dis-le et n'en pose aucune : l'arbitrage a déjà été rendu.

6. **Remplis chaque lot de ses tâches `Tn`** : dépendances explicites (`bloqué par : Tk`),
   marqueurs `[P]`, backref `_Requirements: FR-xxx, SC-xxx_`, ordre de vérification cohérent
   avec le mode déclaré.

7. **Clos par un lot de vérification bout-en-bout** — l'étape unique du plan.

8. **Relis contre le bloc `<completion>`** de `references/tasks.md` : chaque `FR`/`SHALL`
   couvert, chaque lot vertical et à sujet unique.

9. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu n'implémentes pas, et tu ne prescris pas **comment** implémenter : `tasks.md` est le
  contrat que le niveau implémentation consommera, pas son mode d'emploi.
- Tu ne prescris pas le git : le lot est l'unité de livraison **recommandée** (« un lot ≈ une
  PR reviewable »), pas une instruction de branchement.
- **Tu ne présentes aucun budget estimé comme une mesure.** Les seuils déclenchent une
  question, jamais un verdict.
- Tu n'ajoutes aucune tâche hors périmètre — qui n'implémente pas un `FR` ou la vérification.
- Tu ne coches aucune case.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/NNN-slug.md`,
par `Edit` ciblé :

- **Phase** : `tasks`
- **Résultat** : le nombre de lots `Rn` et de tâches `Tn`, et les modes non-`TDD` s'il y en a.
  Exemple : `4 lots · 11 tâches` ou `5 lots (1 inhérent : CI) · 14 tâches`.

## Skill active

- `feature-specs` — charge `references/tasks.md` et `references/reviewability.md`.
- `chantier` — format de la fiche de gate, pour la LIRE seulement. Tu ne l'écris ni
  ne la modifies : c'est `/scd-sdd:analyze` qui l'actualise.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Rappelle la double granularité : chaque **lot** est dimensionné pour être reviewable d'un bloc
par un humain ; chaque **tâche** est vérifiable isolément. Les cases seront cochées au niveau
implémentation, pas ici.

Annonce le nombre de lots et le budget estimé total, **en rappelant que ce sont des ordres de
grandeur destinés à déclencher la scission, pas des mesures**.

Puis, en passant le `NNN` : « `/clear`, puis `/scd-sdd:analyze NNN` (gate de conformité). Pour
une feature à fort enjeu, la passe optionnelle `/scd-sdd:premortem NNN` peut suivre. »
