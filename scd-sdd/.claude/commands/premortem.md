---
description: "Durcissement adverse par projection d'échec — on suppose que ça a échoué, et on remonte à ce que les documents omettaient qui l'a rendu possible —, applicable au SOCLE, à une FEATURE ou à un CHANTIER. Chaque risque retenu se referme par un changement de document, jamais par du code. Trois sous-agents — un projette, un trie, un applique APRÈS approbation humaine. Capacité transverse, pas une phase : optionnelle, jamais réclamée par status."
argument-hint: "socle | NNN ou slug | chantier <slug> — la cible n'est jamais devinée"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Edit
  - Task
  - AskUserQuestion
  - Bash(git log *)
  - Bash(git rev-parse *)
  - Bash(git merge-base *)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(date *)
---

## Contexte

Tout le cycle demande « ce document est-il bien formé ? ». Cette commande pose la question
orthogonale : **s'il était honoré tel quel, est-ce que ça échouerait quand même ?**

Un PRD peut être parfaitement mesurable et viser la mauvaise issue. Un contrat de feature peut
être tracé, testable et bien découpé, et omettre le chemin d'erreur qui le fera tomber en
production. Une fiche de chantier peut être à jour et illisible pour celui qui la reprendra dans
trois semaines. C'est un **premortem** : on se projette après coup **en supposant l'échec**, puis
on remonte à ce que les documents contenaient — ou omettaient — qui l'a rendu possible.

Ce n'est **pas une phase** : rien ne la réclame, `status` ne la signale jamais comme manquante, et
un projet sans premortem n'est pas un projet incomplet. C'est une **capacité transverse**, comme
la recherche — elle se joue quand l'enjeu le justifie, sur la cible qu'on lui donne.

Contrairement aux gates, elle **écrit**. Elle reste purement documentaire — aucun code, aucun
test — et **l'humain décide du quoi**, via un gate d'approbation explicite avant toute
modification.

Ratio : 40% humain / 60% AI (les deux premiers agents tournent en autonomie ; l'humain approuve,
le troisième applique).

## Règles absolues

- **La cible ne se devine jamais entre niveaux.** Sans argument, tu énumères et tu demandes. *(La
  règle et son motif vivent dans le bloc `<resolution>` que tu charges à l'étape 1 ; l'absolu est
  rappelé ici — et ici seulement — parce que c'est le seul texte que tu lis avant tout chargement,
  et qu'aucune gate n'attrape une cible mal résolue.)*
- **Rien n'est modifié avant l'approbation humaine.** Les remédiations validées sont *proposées*,
  jamais appliquées d'office.
- **Tu n'appliques que l'ensemble approuvé.** Aucun ajout de ton cru en cours de route — ce serait
  du scope creep ayant contourné le seul gate qui existe.
- **Tu ne remédies jamais hors de la cible.** Un risque qui vise un autre niveau est un
  **signalement**, pas un edit. Les formes légales de chaque cible sont limitatives.
- **Tout reste documentaire.** Jamais de code, jamais l'édition d'un ADR accepté.
- **Tu ne doubles aucune gate.** On ne rejuge ni EARS, ni backref, ni verticalité : on cherche les
  modes de défaillance que la conformité **ne voit pas**.
- **Calibrage.** Pour un plan descriptible en une phrase, saute cette passe. Le premortem paie sur
  le non trivial, le difficile à défaire, le fort enjeu.
- **Le problème avant les options.** Au gate d'approbation, chaque remédiation s'ouvre sur **ce
  que le risque ferait au produit**, en langage courant — c'est ce qui se décide ; le fichier,
  l'ID et la forme ne sont que l'endroit où l'écrire. Approuver sans avoir compris le risque
  n'est pas approuver.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — EARS,
  gate, lot, ADR, invariant, advisory… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Un ID se cite avec son intitulé** à sa première mention — « FR-003 (export CSV) », jamais
  « FR-003 » nu. La règle vaut pour **tout** identifiant que tu emploies, y compris ceux que le
  projet ou la session viennent de créer et que le plugin ne connaît pas. Un identifiant seul
  n'explique rien à qui ne l'a pas sous les yeux.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Définitions

**Cible** — le niveau sur lequel porte la passe, et lui seul : `socle`, une `feature`, un
`chantier`. Elle détermine ce qu'on lit, les formes de remédiation légales, le journal et la
suite. La méthode, elle, ne change pas.

**Forme de remédiation** — la plus petite modification de document qui referme un risque. La liste
est **limitative par cible** ; ce qui n'y entre pas prend la sortie de secours (chantier
`en-attente`) ou devient un signalement.

## Processus

1. **Résous la cible** — bloc `<resolution>` de la référence. Un argument tranche le niveau
   (`socle` littéral · `chantier <fragment>` · tout le reste = feature) ; à défaut, énumère les
   candidates des trois niveaux et demande via `AskUserQuestion`. **Annonce la cible retenue et ce
   que tu vas lire.**

2. **Charge la référence** : `references/cibles.md` du skill `premortem` — **le bloc de la cible
   résolue**, plus le bloc `<hors-forme>`, qui vaut pour les trois.

3. **Vérifie la précondition de la cible** — elle est propre à chacune, et le bloc chargé à
   l'étape 2 la porte **en entier** : applique-la telle qu'elle y est écrite, ne la complète pas de
   mémoire. Si elle n'est pas tenue, **arrête-toi** et renvoie vers la commande qui la rétablit.

   Cible `chantier` : charge aussi `references/manifeste.md` du skill `chantier`, **bloc par
   bloc** — `<classes>` et `<lecture>` pour **honorer** le manifeste ; `<delegation>` s'il porte une
   ligne `à déléguer` ; `<regle_maitresse>` et `<controles>` **en plus**, et seulement si tu vas en
   **écrire** une ligne. **Résous ici les lignes `à déléguer`**, via `chantier-reader`, avant tout
   appel — le bloc de cible dit pourquoi c'est à toi de le faire. Tu passeras les réponses ancrées
   au facilitateur avec le reste.

4. **Anime le premortem** — délègue à `premortem-facilitator` (outil `Task`) en lui passant **la
   cible résolue et son chemin**, puis le **bloc de cible** intégralement : documents jugés,
   contexte, scénario-cadre, formes légales. Il rend une liste de risques classée par
   impact × vraisemblance.

5. **Valide et trie** — délègue à `premortem-validator` en lui passant la liste du facilitateur,
   **le même bloc de cible**, et le chemin. Il rejette la spéculation non ancrée, le déjà-couvert,
   le scope creep et le style ; il retient les vrais trous et les normalise en remédiations
   concrètes. *(Séquentiel : le valideur a besoin de la sortie du facilitateur.)*

6. **Gate d'approbation humain** — **charge le skill `exposition`**, **régime *gate*** : un décor
   commun **une fois en tête**, jamais répété par item, puis des entrées qui se jugent seules.
   Présente les remédiations retenues en **liste numérotée**,
   chacune ouverte par **ce que le risque ferait au produit**, en une phrase de langage courant et
   sans jargon — c'est ce qui se décide ; le reste n'est que l'endroit où l'écrire. Puis, sur la
   même entrée : fichier, ID ou rubrique cible, forme, texte proposé. Présente **à part** les
   sorties de secours (chantier `en-attente`) et les **signalements hors cible**, qui s'approuvent
   séparément. Demande lesquelles appliquer — toutes, une sélection par numéro, ou aucune.
   - ≤ 4 remédiations → `AskUserQuestion` avec `multiSelect` ;
   - au-delà → présente la liste et attends la réponse en clair.

   **Rien n'est écrit tant que l'humain n'a pas tranché.** S'il ne retient rien, arrête-toi et
   dis-le — c'est un résultat valide.

7. **Applique** — délègue à `premortem-applier` en lui passant **uniquement** l'ensemble approuvé,
   le bloc de cible et **la date du jour** (il n'a pas `Bash` et ne doit jamais la déduire). Il
   inscrit les changements en préservant les invariants du niveau (IDs
   stables, prochain ID libre, backref, forme conforme, plafond de fiche) et rend le journal des
   changements.

8. **Commite ce qui doit l'être.** Une fiche de chantier écrite ou durcie se commite,
   `git add` **scopé à la fiche**, dans un commit isolé — sans quoi `/scd-sdd:run` tomberait en
   `blocked-dirty-tree`. Les documents du socle et des specs suivent la discipline du projet.

9. **Consigne au journal** (voir ci-dessous) — sauf cible `chantier`.

10. **Enchaîne selon la cible** — re-passe `analyze` imposée pour une feature ; features en vol à
    re-valider si le socle a bougé ; rien à re-jouer pour un chantier.

## Ce que tu NE fais PAS

- Aucune écriture avant l'approbation ; aucune remédiation hors de l'ensemble approuvé ; aucune
  remédiation hors des formes légales de la cible.
- Tu ne prescris pas **comment** implémenter, tu n'écris pas de code, tu n'exécutes aucun test.
- Tu n'édites aucun ADR accepté — candidats seulement (le hook `block-adr-edits` le bloque de
  toute façon, `exit 2`). Tu n'édites jamais `docs/brief.md`.
- Tu ne rejoues aucune gate toi-même : tu les recommandes.
- **Tu ne touches pas à une fiche de gate** (`docs/chantiers/en-cours/*-gate-NNN-*.md`) quand tu
  durcis une feature. Tu viens de modifier le contrat : sa liste de corrections est **périmée**, et
  c'est la re-passe `analyze` qui la rafraîchira. Ses arbitrages (`## Écarté`) restent valides.
- Tu n'abandonnes jamais un risque retenu en silence : il est appliqué, ou reporté en chantier, ou
  nommé en signalement.

## Consigne au journal

Le premortem **édite les documents de sa cible sans y laisser le moindre marqueur** : son passage
n'est dérivable d'aucun fichier. Sans cette ligne, il est invisible — c'est pourquoi il
n'apparaît dans aucune table de dérivation.

Charge le skill `journal` et ajoute **une ligne**, par `Edit` ciblé, dans le fichier de la cible.
Tu ne **crées** pas ce fichier s'il manque — tu n'as pas `Write` : signale-le et renvoie vers
`/scd-sdd:migrate`, la ligne se consignera après, et les remédiations déjà appliquées restent
valides. ⚠️ Tu ne la fais **pas** créer par `premortem-applier` sous prétexte qu'il a `Write` : il
inscrit des remédiations dans les documents de la cible, et élargir son mandat rouvrirait la
frontière de §D24.

| Cible | Fichier | Phase |
|---|---|---|
| socle | `docs/journal/socle.md` | `premortem` |
| feature | `docs/journal/NNN-slug.md` | `premortem` |
| chantier | **aucun** — la fiche est le fait, son `Actualisé le` date le durcissement | — |

**Résultat** : le nombre de remédiations appliquées et les IDs ou rubriques créés. Exemple :
`3 remédiations appliquées (FR-007 ajouté · T12 dans R2 · 1 item EXCLU)`. Pour le socle :
`2 remédiations (SC-004 ajouté · 1 contrôle ci informatif) · 1 chantier ouvert`.

Une passe sans remédiation retenue se consigne aussi : `0 remédiation — documents inchangés`.
C'est un fait utile, et l'absence de ligne se lirait comme un premortem jamais joué.

## Skill active

- `premortem` — la méthode et la table des cibles ; charge `references/cibles.md`, **bloc par
  bloc** : `<resolution>` + **bloc de la cible résolue** + `<hors-forme>`.
- Le skill du niveau de la cible, pour les invariants des documents remédiés : `project-docs`
  (socle) · `feature-specs` (feature) · `chantier` (chantier, et toute sortie de secours) — plus,
  **bloc par bloc**, `chantier/references/fiche.md` (`<interdits>` et `<template>`) dès qu'une
  fiche est écrite, et `chantier/references/manifeste.md` (`<classes>` `<lecture>` pour honorer ;
  `<delegation>` s'il y a une ligne `à déléguer` ; `<regle_maitresse>` `<controles>` en plus pour
  écrire) dès qu'un manifeste de contexte est en jeu.
- `exposition` — **régime *gate***, chargé à l'étape 6. Aucune `references/`.
- `journal` — contrat de `docs/journal/*.md`. **Pas pour une cible `chantier`.**
- Subagents, dans cet ordre : `premortem-facilitator` → `premortem-validator` → *[gate humain]* →
  `premortem-applier`.

## À la fin

Selon la cible et l'issue :

- **Feature, remédiations appliquées** : « Contrat durci — R remédiations inscrites. **Relance
  `/scd-sdd:analyze NNN`** pour reconfirmer `PRÊT` avant le passage de main. » Ajoute, si une fiche
  de gate est ouverte : « sa liste de corrections est périmée jusqu'à cette re-passe — n'y travaille
  pas d'ici là. »
- **Socle, remédiations appliquées** : « Socle durci — R remédiations inscrites. » Si `prd.md` ou
  `stack.md` a bougé, **nomme les features déjà spécifiées** et recommande `/scd-sdd:analyze NNN`
  sur chacune : leurs backrefs pointent vers ce qui vient de changer.
- **Chantier, remédiations appliquées** : « Fiche durcie et commitée — R remédiations. La reprise
  se fera par `/scd-sdd:resume <slug>`. »
- **Rien retenu ou approuvé** : « Premortem passé sans remédiation : les documents tiennent tels
  quels. » Puis la suite normale de la cible.

Rappelle les **chantiers ouverts** et les **signalements hors cible** s'il y en a : ce sont les
seuls résultats de la séance qui ne sont dans aucun document.
