---
name: audit
description: |
  La CAPACITÉ D'AUDIT transverse : un document déjà produit est confronté à une grille de
  conformité, et ce qui manque devient une liste de travail — jamais une réécriture. Quatre
  temps — explorer, juger, gate humain, écrire —, l'explorateur collecte sans juger, verdict
  binaire CONFORME | À CORRIGER, appariement entre passes. S'applique à des DIMENSIONS qui
  changent les documents jugés et la grille, jamais la méthode ; une seule existe —
  validation-socle, sur les sept documents du socle. Se charge pendant /scd-sdd:audit, seule
  commande qui l'invoque. Porte UNIQUEMENT la méthode et la table des dimensions : le contrat
  des documents jugés reste au skill project-docs, la fiche au skill chantier, la ligne de
  journal au skill journal. N'écrit JAMAIS dans le document jugé, ne couvre ni les specs
  (analyze les couvre) ni le code (code-reviewer), et ne joue aucune phase : un document non
  audité n'est pas un document incomplet.
---

# Audit — juger un document déjà produit

## Pourquoi une capacité, et pas une phase

Le socle s'écrit par interview, puis se consomme tel quel. Rien ne le relit : les trois `status`
ne testent que l'**existence** des documents, et la chaîne de traçabilité
`Brief → PRD → Stack → Archi → ADR → CI → CLAUDE.md` propage un défaut d'amont sans que rien ne
le voie — un `FR` sans lien vers le Brief, un candidat ADR listé dans `stack.md` que la phase
`adr` n'a jamais instruit, un invariant sans trace observable, un pointeur mort dans `CLAUDE.md`.
L'audit comble ce trou, **document par document**, quand on veut le combler.

Deux conséquences, toutes deux **de nature** et jamais discrétionnaires :

- **Aucun état dérivé.** L'audit n'apparaît dans aucune table de dérivation. Un socle non audité
  n'est **pas** un socle incomplet, et `status` ne le réclame jamais. L'y faire figurer ferait
  croire à une phase, et transformerait une passe calibrée en cérémonie obligatoire.
- **Une ligne de journal quand même.** Le **verdict** n'est dérivable d'aucun fichier — et la
  fiche ne le porte **jamais**. La règle n'est donc pas « une phase journalise », c'est **« ce qui
  n'est dérivable de nulle part se consigne »**. Sans la ligne, savoir si un document a été jugé,
  quand, et avec quelle issue, meurt à la fin de la session.

## Ce qui ne change jamais — la méthode

### 1. Les quatre temps

**explorer → juger → gate humain → écrire.**

| Temps | Qui | Ce qu'il produit |
|---|---|---|
| **1. Explorer** | `audit-explorer` — contexte frais, modèle imposé à l'appel, `Read, Grep, Glob` | un **dossier de preuves** : inventaire des sections face au `<template>`, résolution de **chaque** ID et renvoi (citation verbatim + numéro de ligne), marqueurs trouvés, décomptes |
| **2. Juger** | la **session principale** | des **findings** classés Critical / Major / Minor, appariés à la passe précédente |
| **3. Gate humain** | l'**humain** | les Major assumés, **avec motif**. Jamais un Critical |
| **4. Écrire** | la commande | **deux** écritures, et deux seulement : une **ligne de journal** (le verdict) et une **fiche de chantier** (la liste de travail) |

> **Le document jugé sort bit pour bit identique.** C'est ce qui rend l'audit rejouable sans
> risque, et ce qui l'empêche de devenir un écrivain de plus là où le plugin en compte déjà
> assez (`DECISIONS.md` §D29 : `CLAUDE.md` a **trois** écrivains, pas quatre).

### 2. L'explorateur collecte, il ne juge pas

C'est la séparation qui fonde le dispositif. Un agent à qui on demande de *juger* rend des verdicts
qu'on ne peut plus vérifier ; un agent à qui on demande de *collecter* rend des faits qu'on peut
opposer au document. Le dossier de preuves cite **verbatim**, avec les numéros de ligne, pour que
la session juge **sans relire le document en entier**.

Le jugement reste donc à la **session principale** — le modèle le plus capable disponible, et
celui qui a lu la grille. `producteur ≠ vérificateur` tient alors par deux moyens, tous deux
nécessaires :

- le **`/clear` prescrit dans le texte de l'accroche** des sept commandes de phase du socle — il
  n'est pas cosmétique, c'est lui qui garantit que la session qui juge n'est pas celle qui a
  rédigé ;
- un **signalement** de la commande si la session courante a rédigé le document malgré tout. Elle
  ne bloque pas : elle le dit, et recommande `/clear` puis relance.

### 3. L'échelle

Générique, elle ne varie avec aucune dimension. Elle se lit toujours par **ce que le défaut
coûterait en aval** :

- **Critical** — le document ne peut pas jouer son rôle en aval : ce qui le consomme lira faux,
  ou ne trouvera rien.
- **Major** — fera perdre du temps : ce qui le consomme devra redemander, ré-arbitrer, ou
  deviner.
- **Minor** — améliore. Ne bloque rien et ne se porte pas sur disque.

### 4. Le verdict

Binaire : **`CONFORME | À CORRIGER`**. `CONFORME` **uniquement si zéro Critical**.

Le vocabulaire est **délibérément distinct** du `PRÊT | CORRIGER D'ABORD` d'`analyze` : deux gates
différentes ne portent pas le même mot, sans quoi une ligne de journal ne dirait plus laquelle a
parlé. Une passe `CONFORME` **se consigne aussi**, et sans fiche : l'absence de ligne se lirait
comme un audit jamais joué.

**Le verdict est monotone.** À partir de la passe 2, un **Critical neuf** n'est admissible que s'il
est **déterministe** ou porte sur du **texte modifié depuis l'ancre** ; tout autre plafonne en
**Major**, et le rapport le dit. Le nombre de bloquants ne peut donc que décroître — **sauf** quand
les corrections ont réellement cassé quelque chose, le seul cas où une passe de plus se justifie.

### 5. L'appariement entre passes

Un finding est identifié par le triplet **`[ID]` · fichier · nature**. À chaque passe :

1. **Dérouler la grille intégralement — les contrôles déterministes.** On ne saute **jamais** un
   contrôle déterministe parce que la fiche dit « arbitré » : on détecte tout, on ne change que la
   **présentation**. C'est gratuit, et c'est ce qui empêche l'audit de devenir un tampon. Les
   contrôles **de jugement**, eux, sont bornés par la passe delta : **restreinte, jamais retirée**.
2. Un finding apparié à une entrée d'`## Écarté` → bloc **« Déjà arbitrés »**, **hors du décompte
   qui décide du verdict**.
3. Un finding de la fiche qui n'apparaît plus → bloc **« Corrigés depuis »**, et il **sort** de la
   fiche.
4. Un finding **de jugement, neuf, sur du texte qui n'a pas bougé** → bloc **« Non détecté à la
   passe N »** : un raté de la passe précédente, pas du travail neuf. Il se rapporte **nommément**,
   **sort du décompte** et **ne peut pas être Critical**. L'effacer rendrait le dispositif
   indétectable ; le compter rétablirait la boucle.
5. Le reste → rapport normal, et écrit dans la fiche.

#### La partition de la grille, et la passe delta

Chaque contrôle porte sa **nature** — `déterministe` ou `jugement` — **dans la grille**, jamais ici
ni dans la commande : une seconde copie dériverait au premier contrôle ajouté. Le **critère qui
classe** et la **règle du doute** y vivent avec elle, au § *La grille de contrôles*.

**La passe delta.** Dès la passe 2, les contrôles de jugement ne s'appliquent qu'à ce qui a **bougé
depuis l'ancre `HEAD` de la fiche**, plus la **liste ouverte** ; les déterministes, à tout le
document. L'ancre, son calcul et ses trois cas de **mode dégradé** vivent dans la grille.

**Les arbitrages survivent à l'archivage.** À l'ouverture d'une nouvelle fiche pour le même
document, reprendre le `## Écarté` de la **dernière fiche archivée** — et lui seul : un arbitrage est
une décision, pas une note de passage. Le ré-import s'**élague** — une entrée dont l'objet n'existe
plus (ID retiré, section disparue) ne se ré-importe pas, et le retrait se dit en conversation :
l'arbitrage tombe avec son **objet**, jamais avec l'avis.

> **On n'arbitre jamais un Critical.** Seuls les Major et les Minor s'écartent, avec motif et
> date. Une demande d'arbitrage sur un Critical se refuse en le disant.

### 6. La garde anti-boucle

**La trajectoire s'affiche en tête de rapport**, avant les findings : `3 Critical → 2 → 2 → 4`. Elle
se lit dans le **journal**, une ligne par passe — déjà versionnée, et c'est elle qui se décide.

**La garde mesure la divergence, pas la stagnation** : **dès la passe 2** — avant, il n'y a pas de
décompte précédent et la garde ne peut rien dire —, elle se déclenche quand le décompte des
**Critical** — celui du verdict — **n'est pas strictement inférieur** à celui de la passe précédente.
Une garde qui n'attraperait que « rien ne bouge » serait muette dans le cas du **tapis roulant** : on
corrige à chaque tour, et le total ne baisse pas. Les **Major** ne la déclenchent pas — leur
variation se lit dans la trajectoire, elle ne prononce rien.

**Le budget : trois passes.** Dès la **3ᵉ passe avec fiche encore ouverte**, cesse de proposer une
relance et **pose l'arbitrage** — **trois issues** : le blocage est **en amont** (un amont qui
n'existe pas) · la **phase a été jouée trop tôt**, et c'est elle qu'il faut reprendre · **une passe
de plus**, qui reste valide. Ce n'est **pas une interdiction** — aucun hook, aucun blocage
mécanique —, c'est une **question posée** ; et le budget est un **repère** : aucun corpus ne l'établit.

Ces trois issues sont **limitatives** : au budget, la fiche n'est *encore ouverte* que si le verdict
est au rouge, donc s'il reste un **Critical** — et un Critical ne s'arbitre jamais. L'arbitrage des
Major a déjà son moment : le **temps 3**, à chaque passe.

## Ce qui change — les dimensions

Une seule commande, `/scd-sdd:audit`, et des **dimensions** qui changent **ce qu'on lit**, **la
grille qu'on applique** et **par quelle voie une correction est légale**. La méthode ci-dessus,
elle, est identique.

| Dimension | Ce qui est jugé | Précondition | Journal |
|---|---|---|---|
| **`validation-socle`** | **UN** des sept documents du socle — `brief` `prd` `stack` `archi` `adr` `ci` `claude-md` | le document existe | `docs/journal/socle.md`, phase `audit` |

**Une dimension future — sécurité, UX, cohérence documentaire — est un bloc de plus dans
`references/dimensions.md`, et rien d'autre.** Ni commande neuve, ni skill neuf, ni agent neuf :
si un chantier se surprend à en vouloir un, c'est le signe qu'il a quitté le dispositif.

Le détail de chaque dimension — précondition, documents jugés, contexte jamais jugé, grille de
contrôles, format de fiche, journal et suite — vit dans `references/dimensions.md`, dont la
commande ne charge **que le bloc de la dimension résolue**.

## Ce que l'audit n'est pas

- **Pas un premortem.** `/scd-sdd:premortem socle` juge l'**ensemble** du socle sous l'angle de la
  **projection d'échec** — *conforme, et pourtant condamné ?*. L'audit juge la **conformité**
  d'**UN** document frais. Tu ne projettes aucun échec, et tu ne doubles aucune lentille du
  premortem.
- **Pas `analyze`.** La gate des specs couvre `specs/NNN-slug/` avec ses 16 contrôles. La
  dimension `validation-socle` ne touche **jamais** `specs/`.
- **Pas un entretien.** `/scd-sdd:revise-contract` entretient `CLAUDE.md` **dans la durée** — il
  retire, resynchronise, déplace. L'audit le juge **à sa sortie de phase**, et **détecte sans
  jamais éditer** : ses findings sur `claude-md` sont des **renvois**.
- **Pas une revue de code.** Il travaille sur des documents. Aucun test n'est exécuté, aucune
  implémentation n'est lue.
- **Pas une voie de correction.** Il ne rejoue **jamais** la phase qui a produit le document :
  ré-assembler est *« une voie de destruction qui a l'air d'une voie de mise à jour »* (§D29). La
  voie normale est l'**édition chirurgicale**, portée par les lots de la fiche et approuvée au
  gate.

## Références

| Fichier | Quand la charger | Sections |
|---|---|---|
| `references/dimensions.md` | `/scd-sdd:audit` — `resolution` à l'étape 1, puis **le bloc de la dimension résolue seulement**. `audit-explorer` ne la charge pas : la commande lui **passe** la grille du bloc, comme `premortem` passe son bloc de cible | `resolution` `validation-socle` |
