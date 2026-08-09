---
description: "Ouvre le niveau SOCLE d'un projet : scaffolde docs/, docs/adr/, docs/research/, docs/journal/socle.md et les trois répertoires d'état de docs/chantiers/, établit ce qui est déjà fait, présente la séquence brief → prd → stack → archi → adr → ci → contract, puis lance la première phase manquante. À jouer une fois au démarrage — rejouable sans risque pour reprendre."
argument-hint: "[nom ou idée du projet — optionnel]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
  - Bash(mkdir -p *)
---

## Contexte

Tu ouvres le **niveau socle** d'un projet : les sept documents qu'on écrit une fois, au
démarrage, et sur lesquels tout le reste du cycle s'appuie. Ta mission ici est
d'**orienter et préparer**, pas de produire les documents — chaque document a sa propre
commande.

Cette commande est **idempotente**. Elle n'est pas réservée à un répertoire vierge : sur
un projet déjà entamé, elle complète ce qui manque et te dit où reprendre. Un projet
qu'on rouvre après six mois est le cas normal, pas l'exception.

Ratio : 20% humain / 80% AI (scaffolding mécanique + établissement de l'état).

## Règles absolues

- **Tu n'écrases jamais un document existant.** `docs/brief.md` déjà là = phase faite ;
  tu ne la rejoues pas et tu ne proposes pas de l'écraser. Pour reprendre un document,
  c'est sa commande dédiée, en connaissance de cause.
- **Tu ne crées aucun contenu de document.** Tu crées des répertoires et le journal, rien
  d'autre.
- **Tu dérives l'état des fichiers, jamais d'un fichier d'état.** La présence de
  `docs/prd.md` est ce qui prouve que la phase PRD est faite — pas une ligne de journal.
- **Tu ne reconstruis jamais le journal a posteriori.** Sur un projet démarré sans lui,
  tu le crées vide : on n'invente pas de dates. Sur un projet venu des trois anciens
  plugins, c'est `/scd-sdd:migrate` qui reconstitue les lignes datables depuis git — pas
  toi.

## Processus

1. **Charge la connaissance transverse** : lis le skill `project-docs` (chaîne de
   traçabilité, méthode d'interview, règles d'écriture).

2. **Établis l'état du socle** — l'existence de chaque fichier, rien de plus. Le socle a
   **sept phases** :

   | Fichier | Phase | Commande |
   |---|---|---|
   | `docs/brief.md` | 1 — Brief | `/scd-sdd:brief` |
   | `docs/prd.md` | 2 — PRD | `/scd-sdd:prd` |
   | `docs/stack.md` | 3 — Stack | `/scd-sdd:stack` |
   | `docs/archi.md` | 4 — Archi | `/scd-sdd:archi` |
   | `docs/adr/*.md` | 5 — ADR | `/scd-sdd:adr` |
   | `docs/ci.md` | 6 — CI | `/scd-sdd:ci` |
   | `CLAUDE.md` | 7 — Contrat | `/scd-sdd:contract` |

   Un fichier présent **contenant encore un `[NEEDS CLARIFICATION]`** compte comme
   **incomplet**, pas comme fait : signale-le nommément.

3. **Scaffolde ce qui manque**, sans jamais toucher à ce qui existe :
   - `docs/`, `docs/adr/`, `docs/adr/_candidates/` et `docs/journal/` (`mkdir -p`) —
     `_candidates/` accueillera les brouillons d'ADR laissés par le niveau specs
     (`plan`, `premortem`) ;
   - `docs/chantiers/en-cours/`, `docs/chantiers/en-attente/` et `docs/chantiers/archive/`
     (`mkdir -p`) — les trois états d'un chantier **sont** ces répertoires (skill `chantier`) ;
   - `docs/research/` (`mkdir -p`) — l'emplacement des rapports de recherche. Il est créé
     vide et **n'apparaît nulle part dans la table de l'étape 2** : la recherche est une
     capacité, disponible à tout moment via `/scd-sdd:lookup` et `/scd-sdd:research`, pas
     une phase. Un répertoire vide ici ne rend pas le socle incomplet, et l'annoncer comme
     une étape ferait croire le contraire ;
   - `docs/journal/socle.md` s'il est absent — uniquement le titre, le bloc de citation
     prescrits par le skill `journal`, et l'en-tête de la table, sans aucune ligne.

   Tu ne crées **aucun** `docs/journal/NNN-slug.md` : c'est `/scd-sdd:kickoff-feature` qui le
   fait, une feature à la fois.

4. **Présente la séquence et le point de reprise.** Une phase = une commande, `/clear`
   entre chacune. Marque les phases faites, l'incomplète le cas échéant, et nomme **la
   première phase manquante** — c'est elle qu'on lance. Sur un projet déjà avancé,
   signale que `/scd-sdd:status` rend les trois niveaux (socle, specs, implémentation),
   là où toi tu ne rends que le socle.

5. **Rappelle la frontière** : le socle s'arrête à `CLAUDE.md`. Les specs par feature
   (`specs/NNN-slug/`) sont le niveau suivant, ouvert par `/scd-sdd:kickoff-feature`.

6. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu n'écris aucun document de contenu (Brief, PRD, Stack, ADR, CLAUDE.md).
- Tu ne présumes ni de la stack, ni du périmètre, ni du nom du projet.
- Tu n'interviewes pas : c'est le travail des phases suivantes.
- Tu ne remplis pas rétroactivement le journal pour les phases déjà faites — tu renvoies
  vers `/scd-sdd:migrate` si le projet vient des trois anciens plugins.
- Tu ne comptes **jamais** `docs/research/` parmi les phases du socle, ni dans la table
  d'état, ni dans la séquence, ni dans le décompte des phases faites ou manquantes.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (jamais de réécriture du fichier) :

- **Phase** : `init-project`
- **Résultat** : ce qui a été scaffoldé, et le socle préexistant le cas échéant —
  `docs/ · docs/adr/ · docs/journal/socle.md créés` ou `arborescence déjà en place ·
  brief + prd présents · reprise en stack`.

## Skill active

- `project-docs` — vue d'ensemble de la chaîne et de la séquence du socle.
- `journal` — contrat de `docs/journal/*.md` (gabarit du fichier, règle d'ajout).

## À la fin

Annonce la première phase manquante et propose de l'enchaîner. Pour un projet vierge :
« Prêt ? Lance `/scd-sdd:brief $ARGUMENTS` — et fais `/clear` avant chaque phase pour
garder le contexte propre. »

Si les sept phases sont déjà faites, ne relance rien : le socle est complet, la suite est
`/scd-sdd:kickoff-feature`.
