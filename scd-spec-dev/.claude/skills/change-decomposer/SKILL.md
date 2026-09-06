---
name: change-decomposer
description: |
  Le PONT change→tickets. Décompose un change OpenSpec (proposal + deltas specs/ + design, plus
  test-plan/security-review/ux s'ils existent) en TICKETS verticaux — chacun un comportement
  vérifiable de bout en bout, une PR. Extrait les scénarios WHEN/THEN des deltas en critères à ID
  STABLE (SC-<NN><lettre>), regroupe en tranches verticales, invoque le skill strategie-verif par
  ticket pour le champ `**Vérif :**`, déduit `**Fichiers :**` (parallélisation) et
  `**Bloqué par :**` (dépendances), ARBITRE la granularité avec l'humain (2e geste humain), puis
  écrit changes/<x>/tickets/NN-slug.md au format du template. Se charge pendant /scd-spec-dev:tickets.
  Porte UNIQUEMENT le découpage : il ne décide pas le mode de vérif (skill strategie-verif),
  n'implémente rien (workflow run), et n'écrit JAMAIS dans le change (proposal/specs/design sont la
  matière, pas la cible) ni dans openspec/specs/ (fusionné à l'archivage, pas ici).
---

# Le pont change → tickets

OpenSpec s'arrête au **change** : proposal, deltas de specs, design. La décomposition en **tickets**
n'est pas un artefact de schéma — c'est ce skill, invoqué par `/scd-spec-dev:tickets` — parce
qu'elle doit faire deux choses qu'une boucle générique ne fait pas : **invoquer `strategie-verif`
par ticket**, et **arbitrer la granularité avec l'humain**.

Un **ticket** est une tranche verticale : il traverse les couches et livre un comportement vérifiable
de bout en bout. Un ticket ≈ une PR. Le détail du format, des critères de découpage et des seuils vit
dans `references/tickets.md`, **chargé intégralement** — jamais recopié ici.

## Ce que le change fournit à chaque champ du ticket

| Champ du ticket | Source dans le change |
|---|---|
| `## Critères` | **les scénarios WHEN/THEN des deltas** (`changes/<x>/specs/**/spec.md`), chacun avec son id stable |
| `## Ce que ça livre` | `proposal.md` (le pourquoi/quoi) + `design.md` (l'approche) |
| `**Vérif :**` | le skill **`strategie-verif`**, un ticket à la fois |
| `**Fichiers :**` | `design.md` (périmètre ; sert à paralléliser via worktrees) |
| `**Bloqué par :**` | ordre des deltas & dépendances, tranchés à la décomposition |

**La source des critères, ce sont les deltas** — les blocs `#### Scenario:` WHEN/THEN des fichiers
`spec.md` du change (ADDED/MODIFIED/REMOVED). `proposal` dit *pourquoi*, `design` dit *comment* ; ni
l'un ni l'autre ne remplace un scénario comme critère.

## Les IDs stables `SC-<NN><lettre>`

Chaque scénario WHEN/THEN devient **un** critère, porteur d'un id **stable** : `SC-` + le numéro du
ticket + une lettre (`SC-02a`, `SC-02b`). Cet id est le **fil** de toute la traçabilité aval :

```
delta:   WHEN un carnet est vide THEN l'export produit 1 ligne
  ↓  critère : - [ ] un carnet vide produit un fichier de 1 ligne   (SC-02a)
  ↓  test    : test("SC-02a — un carnet vide produit un fichier de 1 ligne", …)
  ↓  PR      : matrice critère → test → statut
```

L'id ne se renumérote pas après coup. Un critère déplacé d'un ticket à l'autre **change** d'id (il
suit son ticket) ; c'est pourquoi les ids se figent **après** l'arbitrage de granularité, pas avant.

## La méthode (sept temps)

1. **Résous le change cible.** Argument `<change>` s'il est donné ; sinon, résous depuis le disque —
   un change de `openspec/changes/` qui a des deltas (`specs/`) et **pas encore** de `tickets/`. En
   cas d'ambiguïté, `openspec list` puis demander. Communique dans la langue de l'humain.

2. **Lis le change en entier** : `proposal.md`, tous les `specs/**/spec.md` (les deltas), `design.md`,
   plus `test-plan.md` / `security-review.md` / `ux.md` **s'ils existent**. Lis aussi les documents
   durables que `config.yaml` pointe (vision, roadmap, architecture, `docs/adr/`) et le glossaire de
   `CLAUDE.md` : les titres et critères emploient le **vocabulaire du domaine**, pas le tien.

3. **Explore le dépôt** — l'état réel du code que le change touche. Cherche le **préfactoring** :
   *make the change easy, then make the easy change*. Un déplacement mécanique qui simplifierait
   plusieurs tickets **est** un ticket, et il les bloque. Repère aussi le **refactor large** (rayon
   d'action transverse) : il ne rentre dans aucune tranche verticale → séquence expand-contract
   (bloc `<splitting>` de `references/tickets.md`).

4. **Extrais et regroupe.** Chaque scénario WHEN/THEN → un critère candidat. Regroupe les critères en
   **tranches verticales**, chacune passant les bloquants de `<criteria>`. C'est un premier jet — la
   granularité se corrige à l'étape 6, pas maintenant.

5. **Décide le mode de chaque ticket.** Pour chaque tranche, invoque **`strategie-verif`** (arbre à
   cinq étapes) → `{ mode, stratégie, justification }`, ou une **escalade** `arbitrage humain`. Une
   escalade se **remonte** à l'étape 6 (l'humain tranche, le ticket reçoit alors un mode concret).

6. **Présente le découpage et arbitre** — l'étape qui compte, le 2e geste humain. Une liste
   numérotée ; pour chacun : **titre**, **ce qu'il livre** (le comportement, pas les couches),
   **ce qui le bloque**, **le mode** proposé (et le motif s'il n'est pas `tdd`). Puis les questions,
   posées ensemble : la granularité est-elle juste (trop grossier / trop fin) ? les dépendances
   sont-elles réelles ou seulement l'ordre où tu y as pensé ? faut-il fusionner ou scinder ? les
   escalades `arbitrage humain` : quel mode l'humain retient-il ? **Itère jusqu'à l'accord** — pas
   de « ça a l'air bien » ambigu.

7. **Écris les tickets** — **après** l'accord, un fichier par ticket, `changes/<x>/tickets/NN-slug.md`,
   au format du template `ticket.md` (sur le disque du projet, posé par `/setup`). Numérotation dans
   l'**ordre des dépendances** : un bloqueur porte toujours un numéro inférieur. Fige les ids
   `SC-<NN><lettre>`. Renseigne `**Vérif :**` — `arbitrage humain` n'est jamais une valeur du champ
   (le mode retenu par l'humain l'est) ; tout mode ≠ `tdd` est cohérent avec sa justification.

## Règles absolues

- **Rien n'est écrit avant l'accord.** Écrire d'abord et demander ensuite transforme l'arbitrage en
  validation de façade. Le `tickets/` reste absent tant que l'humain n'a pas tranché.
- **Tranche verticale, sans exception hors refactor large.** Un ticket horizontal — « créer la
  table », puis « l'API », puis « l'UI » — est **rejeté** : il ne livre rien de vérifiable seul.
- **Tout comportement des deltas est couvert, et rien d'autre.** Le hors-périmètre du `proposal`/
  `design` fait foi ; un ticket qui livre ce que le change n'a pas demandé est du scope creep.
- **Le graphe des `Bloqué par` est acyclique, au moins un ticket démarrable.** Sinon le graphe est
  faux, pas le change.
- **Un ID se cite avec son intitulé** à sa première mention — « 02 (export CSV vide) », jamais « 02 »
  nu — y compris les ids que la session vient de créer.
- **Le problème avant les options**, à chaque arbitrage : deux ou trois phrases sur ce qui est en jeu
  pour ce projet et en quoi les options diffèrent, chaque option décrite par sa **conséquence pour le
  projet**. Glose d'une ligne au premier terme de méthode, jamais deux fois.
- **Tu cherches une erreur, tu ne confirmes pas** : un découpage généré qui « a l'air complet » est
  précisément celui à relire ligne à ligne.
- **Une décision structurante rencontrée ne se tranche pas ici** : elle est un **ADR** (`docs/adr/`),
  pas une ligne de ticket ni un ajout à `design.md`.

## Ce que ce skill NE fait PAS

- Il **ne modifie ni le `proposal`, ni les deltas `specs/`, ni le `design`.** Si le découpage révèle
  un défaut du change, il le **signale** (le change se révise via le skill OpenSpec
  `openspec-update-change`) — il ne le
  corrige pas en passant.
- Il **n'écrit rien dans `openspec/specs/`** : la fusion des deltas est le travail de
  `openspec archive`, après les PR, jamais ici.
- Il **ne décide pas** le mode de vérif lui-même — il **invoque** `strategie-verif`.
- Il **n'écrit aucun code**, n'exécute aucun test, **ne lance aucune implémentation** (c'est
  `/scd-spec-dev:run`, un ticket à la fois) et **ne rend aucun verdict**.
- Il **ne prescrit pas le git** — branches, commits, PR empilées sont du niveau implémentation.

## Références & skills

- `references/tickets.md` — **chargée intégralement** : format du ticket, checklist de découpage,
  seuils de scission, expand-contract, lien critère → test. Domicile unique des seuils chiffrés.
- `references/brief.md` — le contrat **BRIEF**, la couture invisible entre les tickets écrits ici et
  tout l'aval (`ticket-briefer` → workflow `run`). Producteur ≠ consommateur.
- Skill **`strategie-verif`** — invoqué par ticket à l'étape 5. Il décide le mode ; ce skill décide
  le découpage. Frontière nette.
