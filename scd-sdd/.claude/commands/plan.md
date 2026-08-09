---
description: "Phase 3 des specs : produit specs/NNN-slug/plan.md EN PLAN MODE. Le comment — approche, réutilisation du socle (stack/ADR jamais re-décidés), confrontation des fichiers touchés aux invariants de docs/archi.md, contrats, étape de vérif bout-en-bout. Décision structurante nouvelle → candidat dans docs/adr/_candidates/."
argument-hint: "[NNN ou slug — optionnel, résolu sinon]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu produis le **plan technique** de la feature : le *comment*.

Il **applique** le socle (`docs/stack.md`, `docs/archi.md` s'il existe, `docs/adr/`) — il ne
re-décide jamais ce qui est déjà tranché. À exécuter **en plan mode** (recommande `opusplan` : Opus planifie, Sonnet
exécute). Un plan court a un meilleur taux d'acceptation qu'un plan fleuve : il est relu.

Ratio : 50% humain / 50% AI (arbitrages techniques partagés).

## Règles absolues

- **Ne re-décide rien du socle.** Langage, framework, DB, auth, déploiement, tests sont fixés
  par `stack.md` et les ADR acceptés. Contredire un ADR accepté est interdit — le hook
  `block-adr-edits` empêche même d'en réécrire un (`exit 2`).
- **Les invariants de `docs/archi.md` ne se re-décident pas non plus** — ils tiennent leur
  autorité de la phase `archi` et des ADR qui les portent. Un lot qui franchit une frontière ou
  inverse un sens de dépendance change de découpage, ou **écrit et justifie** sa dérogation dans
  le plan. C'est par là que la dérive structurelle entre : une feature à la fois, par des
  décisions ad hoc que rien ne relit.
- **Décision structurante nouvelle** (non couverte par un ADR existant) → **candidat** dans
  `docs/adr/_candidates/NNNN-draft.md`, **jamais** un ADR final. La promotion en ADR accepté
  est un acte humain, via `/scd-sdd:adr`.
- **Réutilise l'existant.** Cherche les fonctions, utilitaires et patrons déjà présents dans le
  repo **avant** de proposer du neuf, et cite le patron de référence pour chaque fichier
  touché. Un plan qui réinvente ce qui existe produit du code que personne ne reconnaît.
- **Étape de vérif bout-en-bout obligatoire** : **une** commande ou vérification qui prouve la
  feature entière. Elle deviendra le dernier lot de `tasks.md`.
- **Nomme des fichiers précis.** « la couche service » n'est pas un fichier touché.

## Processus

1. **Résous la feature cible** — règle de résolution du skill `feature-specs`, section
   « Cibler une feature ». Candidature propre à cette phase : la feature au `spec.md` **propre
   (zéro marqueur) et sans `plan.md`**. **Annonce la cible retenue.**

1bis. **Charge le chantier de gate, s'il y en a un** — `Glob` sur
   `docs/chantiers/en-cours/*-gate-<cible>.md`. Une fiche ouverte signifie qu'une passe
   `/scd-sdd:analyze` a laissé une liste de corrections : lis son `## À corriger` et son
   `## Écarté`, et **pars de là**. Corriger en re-dérivant à froid, c'est risquer de recasser ce
   qui allait et de rater ce qui n'allait pas — c'est ainsi qu'on tourne en rond avec `analyze`.

   Traite les entrées dont la ligne `Phase :` te désigne ; **laisse les autres intactes**, elles
   relèvent d'une autre commande. Et **ne modifie pas la fiche** : c'est `/scd-sdd:analyze` qui
   l'actualise, en constatant à la passe suivante ce qui a disparu.

   Pas de fiche → tu pars du contrat. Ce n'est pas une anomalie.

2. **Charge la référence** : `references/plan.md` du skill `feature-specs`.

3. **Lis les prérequis** : `specs/<cible>/spec.md`, `docs/stack.md`, `docs/archi.md` **s'il
   existe** et `docs/adr/`. Repère nommément les ADR contraignants, les choix de stack et les
   **invariants** qui s'appliquent ici.

4. **Explore le repo** avant de rédiger : les fichiers voisins de ceux que tu vas toucher, les
   utilitaires réutilisables, le patron dominant du projet.

5. **Rédige `specs/<cible>/plan.md`** selon le template :
   - l'approche, en une section courte ;
   - la **réutilisation du socle** — stack, invariants d'`archi` et ADR cités, pas paraphrasés ;
   - les **fichiers touchés** nommés, chacun avec son patron de référence existant ;
   - les **contrats d'interface**, cohérents avec les contrats d'E/S de la spec ;
   - les décisions et les **alternatives écartées** avec leur raison ; candidat ADR si une
     décision est structurante **et** nouvelle. Un arbitrage qui dépend d'un fait que tu ne
     tiens pas de mémoire se **source avant** d'être écrit — `/scd-sdd:lookup` pour un fait
     ponctuel et daté, `/scd-sdd:research` pour l'arbitrage entier. Ici ce n'est pas une
     précaution de confort : un candidat non sourcé est promu tel quel par `/scd-sdd:adr`,
     et devient immuable ;
   - l'**étape de vérification bout-en-bout**, unique.

6. **Confronte les fichiers touchés aux invariants de `docs/archi.md`.** Une seule question, posée
   invariant par invariant sur la liste que tu viens d'écrire : **ce lot franchit-il une frontière,
   inverse-t-il un sens de dépendance, place-t-il un artefact hors du dossier prescrit ?**

   - **Non** → rien à écrire, l'étape est passée en silence.
   - **Oui** → l'issue par défaut est de **changer le découpage ou les fichiers touchés** pour
     rester dans l'invariant. Si la dérogation est réellement nécessaire, elle s'écrit et se
     **justifie** dans « Réutilisation du socle », en nommant l'invariant (`I3`) et la raison.
     `/scd-sdd:analyze` la cherche là : une dérogation muette est un **Major** à la gate.
   - **Pas de `docs/archi.md`** → **saute cette étape et annonce-le** (« pas de `docs/archi.md` :
     confrontation aux invariants sautée »). La phase `archi` n'a pas été jouée ; rien ne bloque.

   Une dérogation qui revient à chaque feature n'est pas une dérogation : c'est le signe que
   l'invariant est faux ou périmé. Dis-le et renvoie vers `/scd-sdd:archi` — **tu ne modifies pas
   `docs/archi.md`**.

7. **Vérifie la couverture** : chaque `FR` de la spec est couvert par une portion du plan.
   Nomme ceux qui ne le sont pas plutôt que d'élargir le plan en silence.

8. **Relis contre le bloc `<completion>`** de `references/plan.md`.

9. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Aucun découpage en tâches numérotées : c'est `tasks`.
- **Aucune écriture dans `docs/adr/`** — `_candidates/` seulement.
- **Aucune écriture dans `docs/archi.md`.** Tu confrontes le lot aux invariants, tu ne les
  amendes pas, tu n'en ajoutes pas : c'est `/scd-sdd:archi`, et l'invariant y devient un ADR.
- Tu n'implémentes rien et tu n'exécutes aucun test : le code est le niveau suivant.
- Tu ne recopies pas le socle dans le plan. Tu lies.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/NNN-slug.md`,
par `Edit` ciblé :

- **Phase** : `plan`
- **Résultat** : le nombre de fichiers touchés et les candidats ADR créés.
  Exemple : `7 fichiers touchés · 1 candidat ADR (0005-file-de-jobs)`.

## Skill active

- `feature-specs` — charge `references/plan.md`.
- `chantier` — format de la fiche de gate, pour la LIRE seulement. Tu ne l'écris ni
  ne la modifies : c'est `/scd-sdd:analyze` qui l'actualise.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Signale tout **candidat ADR** créé et rappelle qu'il reste un brouillon tant qu'un humain ne
l'a pas promu via `/scd-sdd:adr`. Puis, en passant le `NNN` : « `/clear`, puis
`/scd-sdd:tasks NNN`. »
