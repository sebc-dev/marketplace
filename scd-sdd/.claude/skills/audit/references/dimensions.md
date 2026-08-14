# Référence — Les dimensions de l'audit

**Où elle se charge** (`DECISIONS.md` §D20) : par `/scd-sdd:audit`, et par elle seule — le bloc
`resolution` à l'étape 1, puis **le seul bloc de la dimension résolue**. L'agent `audit-explorer`
ne la charge pas : la commande lui **passe** la grille du bloc, comme `premortem` passe son bloc de
cible.

La **méthode** — les quatre temps, l'échelle, le verdict binaire, l'appariement, la garde
anti-boucle — est dans le `SKILL.md` et ne se répète pas ici.

<resolution>
## Résoudre la dimension, puis la cible

**Le premier token décide de la dimension.** Confronte-le à la table des dimensions du `SKILL.md` :

1. Il **nomme une dimension** → elle est retenue, et le **reste** de l'argument désigne la cible.
2. Sinon → la dimension est la **seule existante**, `validation-socle`, et le token **est** la
   cible.

`/scd-sdd:audit prd` fonctionne donc aujourd'hui et **continuera de fonctionner** quand d'autres
dimensions existeront : leurs noms sont **composés** (`validation-socle`, et ses successeurs sur le
même patron), aucun ne collisionne avec un token de document.

**La cible ne se devine jamais.** Sans argument de cible : énumère les documents de la dimension
**présents sur disque**, avec leur date de dernière modification, et demande via `AskUserQuestion`.
N'infère rien — ni « le plus récent », ni « celui de la dernière ligne de journal ». Se tromper de
cible produit une fiche qui nomme le mauvais document, et c'est le genre d'erreur qu'on ne voit
qu'après avoir corrigé le mauvais fichier.

**Les tokens de la dimension `validation-socle` :**

| Token | Ce qui est jugé |
|---|---|
| `brief` | `docs/brief.md` |
| `prd` | `docs/prd.md` |
| `stack` | `docs/stack.md` |
| `archi` | `docs/archi.md` |
| `adr` | `docs/adr/` — le **répertoire entier**, `_candidates/` compris |
| `ci` | `docs/ci.md` |
| `claude-md` *(alias accepté : `contract`)* | `CLAUDE.md` |

**Annonce toujours la dimension et la cible retenues**, et ce que tu vas lire, avant de déléguer
quoi que ce soit.
</resolution>

<validation-socle>
## Dimension `validation-socle`

Elle juge la **conformité** d'**UN** document du socle, frais de sa phase, contre son template,
son amont et sa propre forme. Elle ne touche **jamais** `specs/` — `analyze` les couvre.

### 1. Précondition

Le document cible **existe**. S'il manque, c'est un **arrêt dur** : renvoie vers la phase qui le
produit (`/scd-sdd:brief`, `prd`, `stack`, `archi`, `adr`, `ci`, `contract`) et n'écris rien —
ni fiche, ni ligne de journal. Un document absent n'est pas un finding, c'est une phase non jouée.

### 2. Ce qui est jugé

**Le document cible, et lui seul.** Pas son voisin, pas la chaîne, pas le projet.

### 3. Le contexte, jamais jugé

La **chaîne amont** du document (colonne ci-dessous) et `docs/journal/socle.md` — la chronologie
des phases, et leur fraîcheur contre la date de modification des fichiers.

> **Un défaut constaté dans l'amont est un signalement, jamais un finding du document jugé.**

Il rejoint le **Lot C** de la fiche, **nommé**, avec la commande qui le traiterait — règle reprise
du bloc `<hors-forme>` de `premortem` : rien ne s'abandonne en silence. Le corriger ici serait une
écriture qu'aucune résolution de cible n'a couverte.

### 4. La grille de contrôles

**Chaque contrôle porte sa nature** — `D` **déterministe** ou `J` **de jugement**. C'est elle qui
décide ce qui se déroule intégralement à chaque passe et ce qui entre dans la **passe delta**
(§ *La partition de la grille* du `SKILL.md`, et le § 5 ci-dessous).

**Le critère est falsifiable** : *une seconde exécution, sur le même texte, reproduit-elle le finding
au caractère près ?* Un renvoi résout ou non, un marqueur est là ou non, une section existe ou non,
un ID existe dans l'amont ou non → `D` ; tout le reste est `J`. **En cas de doute, `J`** : classé
`D` à tort, un contrôle produit du bruit à chaque passe — le défaut qu'on corrige.

**Le socle commun** — les cinq contrôles qui valent pour les sept documents :

1. **Complétude face au `<template>`** `D` — chaque section attendue existe et est non vide. Une
   section prévue et vide est un finding ; une section **absente** l'est aussi.
2. **Marqueurs restants** `D` — zéro `[à compléter]`, `[NEEDS CLARIFICATION]`, `TODO`, `TBD`, `XXX`
   laissé en place. Ces cinq-là sont **binaires** : leur présence *est* le finding, et rien à
   trancher. La nature `D` du contrôle porte sur **ces cinq marqueurs**, et sur eux seuls.
   Les points de suspension ne le sont **pas**. `…` est un caractère de prose parfaitement
   légitime — le plugin s'en sert lui-même —, donc sa seule présence ne prouve rien, et un
   contrôle qui l'attraperait au motif qu'il est là fabriquerait des faux positifs à la chaîne.
   Trois signes le qualifient comme marqueur, et il en faut **au moins un** :
   - il est **seul dans son unité** — une ligne, une cellule de table, une puce, un champ après
     son libellé —, ou il suit immédiatement un titre de section sinon vide ;
   - il est **enfermé dans un gabarit** — `[…]`, `< … >`, `(…)` tenant la place d'un contenu ;
   - il occupe **la même position qu'un `…` du `<template>`** : le gabarit laissé tel quel. C'est
     le signe le plus fort, et le seul qui se vérifie sans jugement, le `<template>` étant chargé.

   Un `…` au milieu d'une phrase, ou fermant une énumération, n'est **jamais** un marqueur.
   ⚠️ **Ce qui ne porte aucun des trois signes se rapporte en `À VÉRIFIER`, jamais en finding.**
   Ce contrôle est délibérément non binaire sur ce seul caractère, et l'explorateur a **trois**
   issues pour ça : trancher au hasard fabriquerait des Critical que rien n'aurait mesurés. Un
   `À VÉRIFIER` **n'est pas un finding**, donc il n'entre dans aucun décompte, et la nature `D` ne
   s'étend pas à lui.
3. **Traçabilité amont** `D` — chaque ID cité et chaque renvoi **résout** : le fichier existe,
   l'ancre existe, l'ID existe dans le document amont. Un renvoi mort est un Critical ; un renvoi
   ambigu, un Major.
4. **Cohérence** `J` — aucune affirmation ne contredit l'amont. Un chiffre, un nom de commande ou
   une contrainte qui diverge de sa source est un finding, même s'il est plus juste : c'est la
   **divergence** qu'on constate, l'humain tranche laquelle a raison.
5. **Forme** `J` — `## Légende` présente quand le `<template>` en porte une ; verbes **vérifiables**
   et non adjectifs ; pas de fait dérivable écrit en dur là où il se lit ailleurs. *(Sa seule part
   binaire — la `## Légende` est là ou non — est déjà couverte par le contrôle 1, qui est `D` ; ce
   qui reste ici est du jugement.)*

**Le `<template>` ne se recopie jamais ici** — il dériverait. `audit-explorer` charge le bloc
`<template>` de la référence `project-docs` du document jugé (`DECISIONS.md` §D20) :

| Token | Référence dont l'explorateur charge le `<template>` |
|---|---|
| `brief` `prd` `stack` `archi` `adr` `ci` | `project-docs/references/<token>.md` |
| `claude-md` | `project-docs/references/claude-md.md` |

*(`ci-signature.md` n'est pas un document du socle : elle n'est jamais une cible.)*

**La table par document** — ce que la dimension ajoute au socle commun, et par quelle voie une
correction est légale :

| Document | Amont croisé | Contrôles propres | Voie de correction |
|---|---|---|---|
| `brief` | — (racine) | complétude interne `D` ; **scope EXCLU non vide** `D` ; critères de succès `SC-xxx` **mesurables** (une valeur, jamais un adjectif) `J` | **Lot A** |
| `prd` | `brief` | chaque `FR-xxx`/`SC-xxx` **trace vers le Brief** `D`, ou justifie l'écart — la **suffisance** de la justification, `J` ; **technology-agnostic** (aucun framework, lib ni DB) `J` ; IDs **sans trou** non expliqué `D` ; section « NON inclus » non vide `D` | **Lot A** |
| `stack` | `prd` | chaque fondation est **reliée** à un `FR`/`SC` du PRD `D` ; la liste des **candidats ADR** existe et est non vide `D` ; rien n'y est décidé sans motif `J` | **Lot A** |
| `archi` | `stack`, `prd` | chaque invariant est **falsifiable** — il nomme sa **trace observable** dans l'arborescence ou dans les imports `J` ; **3 à 5 caractéristiques** retenues `D`, chacune tracée vers un `FR`/`SC` `D` ; la **colonne ADR** est remplie ou le candidat est nommé `D` ; les classes hors périmètre sont **déclarées** `D` | **Lot A** |
| `adr` | `stack`, `archi` | **un ADR par candidat** listé en amont `D`, ou l'écart est instruit `J` ; traçabilité **bidirectionnelle** (l'amont pointe l'ADR, l'ADR pointe l'amont) `D` ; **format Nygard** complet `D` ; **statut** présent `D` et cohérent avec le contenu `J` — un `Accepté` sans conséquences écrites est un finding | **Lot B** — candidat ou supersede **uniquement** : un ADR accepté est **immuable**, et le hook `block-adr-edits` rend `exit 2` |
| `ci` | `archi`, `adr`, `stack` | chaque contrôle **dérive d'un mode de défaillance** de la grille, pas d'une liste d'outils `J` ; un contrôle n'est **bloquant** que si son taux de faux positifs a été **mesuré** sur la stack réelle (sinon : informatif) `D` ; la **table des commandes** est complète et exécutable `J` | **Lot A** |
| `claude-md` | `ci`, et tous les autres | chaque **pointeur résout** `D` ; la **section Commandes** correspond à `docs/ci.md` `D` ; **plafond 200 lignes** (cible 60-90) `D` ; rien d'*advisory* n'y tient lieu de contrôle déterministe `J` | **Lot C** — renvoi vers `/scd-sdd:revise-contract` : l'audit **détecte**, il n'édite **jamais** `CLAUDE.md` (§D29 — trois écrivains, pas quatre) |

**Classer.** L'échelle du `SKILL.md` s'applique telle quelle. Repères pour cette dimension :
un renvoi mort, une section obligatoire absente, un marqueur `[NEEDS CLARIFICATION]` restant, un
`FR` sans amont, un invariant sans trace observable → **Critical**. Un écart non justifié, un ID
manquant, un contrôle bloquant sans mesure, une divergence de chiffre → **Major**. Une formulation
perfectible, un ordre de sections inhabituel → **Minor**.

### 5. La passe delta

**L'ancre.** La fiche ouverte porte `HEAD <sha>`, rafraîchi à chaque actualisation. C'est la
**seule** mémoire légale de ce qui a déjà été jugé : écrire « section jugée conforme » dans la fiche
serait un fait dérivable (`DECISIONS.md` §D1, §D18, §D21), et deviendrait faux à la première
édition. Le disque porte déjà l'historique.

**Le calcul.** `git rev-parse HEAD` pour l'ancre du jour ; `git diff <ancre> -- <chemin de la
cible>` pour ce qui a bougé depuis. Les contrôles **`J`** ne s'appliquent qu'à ces lignes-là, plus
la **liste ouverte** du `## À corriger` de la fiche. Les contrôles **`D`** se déroulent sur tout le
document, à chaque passe — ils sont gratuits et sans bruit, et c'est là que la règle « dérouler la
grille intégralement » reste entière.

**Trois cas rendent le delta incalculable. Dans les trois, la passe est intégrale :**

1. **Passe 1** — aucune fiche précédente, donc aucune ancre.
2. **Pas d'ancre** — la fiche est antérieure au dispositif, ou sa ligne `HEAD` manque.
3. **Corrections non commitées** — `git diff -- <chemin de la cible>` rend un diff non vide : ce
   qui a bougé depuis le jugement n'est pas dans l'historique, et le diff contre l'ancre ne le
   verrait pas.

⚠️ **Le mode dégradé se dit** — annonce la passe intégrale **et son motif** en tête de rapport. Le
danger n'est pas l'excès de couverture, c'est l'inverse : un delta calculé sur une ancre absente
rend un diff **vide**, donc **zéro contrôle de jugement joué**. Une passe delta silencieusement
dégradée est un tampon, et ce serait pire que le défaut d'origine.

### 6. La fiche et ses lots

`docs/chantiers/en-cours/AAAA-MM-JJ-audit-<document>.md`, **portée `socle · audit`**. C'est un
chantier **ordinaire** (skill `chantier`), au **régime des fiches-listes** : une ligne par
finding, une par entrée d'`## Écarté`, cible ~50 lignes **annoncée jamais bloquante**, liste
**jamais tronquée** (`chantier/references/fiche.md`, bloc `<template>`) ; aucun fait dérivable,
aucun verdict. **`/scd-sdd:resume` n'a besoin d'aucun outillage neuf pour la traiter.**

Elle porte les **Critical** et les **Major non arbitrés**, plus **tout arbitrage** dans
`## Écarté`, et rien d'autre.

Le `## À corriger` est organisé **en lots par voie de correction**. Chaque finding garde sa
**sévérité** — elle sert l'appariement et la règle « jamais d'arbitrage sur un Critical ». **Un lot
vide ne s'écrit pas.**

- **Lot A — éditions chirurgicales dans le document** : `[ID] — défaut → correction proposée`,
  avec le **texte proposé** quand il tient en une ligne. Traité par
  `/scd-sdd:resume audit-<document>`.
- **Lot B — candidats et supersede ADR**, dans `docs/adr/_candidates/`. **Seule** voie pour la
  cible `adr`, et voie de toute décision structurante remontée par un autre document.
- **Lot C — renvois et signalements** : les findings de `claude-md` → jouer
  `/scd-sdd:revise-contract` ; les findings visant l'**amont** → signalement **nommé**, avec la
  commande qui le traiterait.

```markdown
# Audit prd — 1 Critical · 2 Major

Portée : socle · audit
Ouvert le 2026-08-12 · Actualisé le 2026-08-12 · branche `main` · HEAD `a1b2c3d`

## Objectif
Rendre `docs/prd.md` conforme : zéro Critical.

## Contexte à charger
à lire  `docs/prd.md` — le document jugé
à lire  `docs/brief.md` — l'amont contre lequel la traçabilité se vérifie

## À corriger
### Lot A — éditions dans `docs/prd.md`
- **[FR-012] Critical** — « exporter les données » ne trace vers aucun `SC` du Brief → ajouter `_(Brief: SC-002)_`, ou justifier l'écart en une ligne.
- **[NON inclus] Major** — section vide → nommer ce que la v1 ne fait pas : facturation, multi-tenant.
### Lot C — renvois et signalements
- **[SC-002] Major** — signalement **amont** : le critère du Brief est un adjectif nu (« rapide »), rien ne peut y tracer → `/scd-sdd:audit brief`.

## Prochaine étape
`/scd-sdd:resume audit-prd` pour traiter le Lot A, puis relancer `/scd-sdd:audit prd`.

## Écarté
- [FR-007] IDs non contigus (FR-006 → FR-008) — assumé le 12/08 : le FR-007 a été retiré au
  cadrage, et réattribuer son ID casserait les backrefs déjà écrits.
```

**Cycle de vie.** Verdict `À CORRIGER` → ouvrir ou actualiser la fiche. Verdict `CONFORME` → une
fiche ouverte existe ? Ajouter `## Issue` (ce qui a été corrigé, en combien de passes) et
`git mv` vers `archive/`. Aucune fiche ouverte → n'en crée pas : il n'y a pas de travail à porter.

### 7. Journal, et ce qui suit

**Journal.** `docs/journal/socle.md`, phase **`audit`** — le fichier ne varie pas avec la cible,
la dimension étant celle du socle. Le verdict **en gras**, la cible, puis le décompte :

- `**CONFORME** — prd · 0 Critical · 1 Major arbitré`
- `**À CORRIGER** — prd · 2 Critical (FR-012 sans amont · NON inclus vide) · 3 Major`

**Ce qui suit.** Aucune gate n'existe à ce niveau : rien à re-jouer mécaniquement, et l'audit ne
bloque aucune phase.

- **Lot A** → `/clear`, puis `/scd-sdd:resume audit-<document>`, avec le modèle adéquat. Puis
  relancer `/scd-sdd:audit <document>` — l'appariement fera le reste. **Sous réserve du budget de
  passes** : à la 3ᵉ passe avec fiche encore ouverte, ce n'est plus une relance qu'on propose mais
  un arbitrage (§ *La garde anti-boucle* du `SKILL.md`).
- **Lot B** → les candidats sont écrits dans `docs/adr/_candidates/` ; c'est `/scd-sdd:adr` qui
  les instruit. Le candidat n'est **pas** un renvoi dans le vide : la phase `adr` le promeut, et
  `ci` relit ensuite `docs/archi.md` **et** `docs/adr/`.
- **Lot C** → `/scd-sdd:revise-contract` pour `claude-md` ; pour un signalement amont, la commande
  nommée dans la ligne. **Ne les traite pas toi-même.**
</validation-socle>
