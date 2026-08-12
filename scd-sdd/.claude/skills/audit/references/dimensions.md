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
N'infère rien — ni « le plus récent », ni « celui de la dernière ligne de journal ».

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

**Le socle commun** — les cinq contrôles qui valent pour les sept documents :

1. **Complétude face au `<template>`** — chaque section attendue existe et est non vide. Une
   section prévue et vide est un finding ; une section **absente** l'est aussi.
2. **Marqueurs restants** — zéro `[à compléter]`, `[NEEDS CLARIFICATION]`, `TODO`, `TBD`, `…`
   laissé en place.
3. **Traçabilité amont** — chaque ID cité et chaque renvoi **résout** : le fichier existe, l'ancre
   existe, l'ID existe dans le document amont. Un renvoi mort est un Critical ; un renvoi
   ambigu, un Major.
4. **Cohérence** — aucune affirmation ne contredit l'amont. Un chiffre, un nom de commande ou une
   contrainte qui diverge de sa source est un finding, même s'il est plus juste : c'est la
   **divergence** qu'on constate, l'humain tranche laquelle a raison.
5. **Forme** — `## Légende` présente quand le `<template>` en porte une ; verbes **vérifiables**
   et non adjectifs ; pas de fait dérivable écrit en dur là où il se lit ailleurs.

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
| `brief` | — (racine) | complétude interne ; **scope EXCLU non vide** ; critères de succès `SC-xxx` **mesurables** (une valeur, jamais un adjectif) | **Lot A** |
| `prd` | `brief` | chaque `FR-xxx`/`SC-xxx` **trace vers le Brief** ou justifie l'écart ; **technology-agnostic** (aucun framework, lib ni DB) ; IDs **sans trou** non expliqué ; section « NON inclus » non vide | **Lot A** |
| `stack` | `prd` | chaque fondation est **reliée** à un `FR`/`SC` du PRD ; la liste des **candidats ADR** existe et est non vide ; rien n'y est décidé sans motif | **Lot A** |
| `archi` | `stack`, `prd` | chaque invariant est **falsifiable** — il nomme sa **trace observable** dans l'arborescence ou dans les imports ; **3 à 5 caractéristiques** retenues, chacune tracée vers un `FR`/`SC` ; la **colonne ADR** est remplie ou le candidat est nommé ; les classes hors périmètre sont **déclarées** | **Lot A** |
| `adr` | `stack`, `archi` | **un ADR par candidat** listé en amont, ou l'écart est instruit ; traçabilité **bidirectionnelle** (l'amont pointe l'ADR, l'ADR pointe l'amont) ; **format Nygard** complet ; **statut** présent et cohérent — un `Accepté` sans conséquences écrites est un finding | **Lot B** — candidat ou supersede **uniquement** : un ADR accepté est **immuable**, et le hook `block-adr-edits` rend `exit 2` |
| `ci` | `archi`, `adr`, `stack` | chaque contrôle **dérive d'un mode de défaillance** de la grille, pas d'une liste d'outils ; un contrôle n'est **bloquant** que si son taux de faux positifs a été **mesuré** sur la stack réelle (sinon : informatif) ; la **table des commandes** est complète et exécutable | **Lot A** |
| `claude-md` | `ci`, et tous les autres | chaque **pointeur résout** ; la **section Commandes** correspond à `docs/ci.md` ; **plafond 200 lignes** (cible 60-90) ; rien d'*advisory* n'y tient lieu de contrôle déterministe | **Lot C** — renvoi vers `/scd-sdd:revise-contract` : l'audit **détecte**, il n'édite **jamais** `CLAUDE.md` (§D29 — trois écrivains, pas quatre) |

**Classer.** L'échelle du `SKILL.md` s'applique telle quelle. Repères pour cette dimension :
un renvoi mort, une section obligatoire absente, un marqueur `[NEEDS CLARIFICATION]` restant, un
`FR` sans amont, un invariant sans trace observable → **Critical**. Un écart non justifié, un ID
manquant, un contrôle bloquant sans mesure, une divergence de chiffre → **Major**. Une formulation
perfectible, un ordre de sections inhabituel → **Minor**.

### 5. La fiche et ses lots

`docs/chantiers/en-cours/AAAA-MM-JJ-audit-<document>.md`, **portée `socle · audit`**. C'est un
chantier **ordinaire** (skill `chantier`) : plafond **~50 lignes**, aucun fait dérivable, aucun
verdict. **`/scd-sdd:resume` n'a besoin d'aucun outillage neuf pour la traiter.**

Elle porte les **Critical** et les **Major non arbitrés**, plus **tout arbitrage** dans
`## Écarté`. Les **Minor** restent en conversation : les porter recréerait le bruit qu'on
supprime.

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
- **[FR-012] Critical** — « exporter les données » ne trace vers aucun `SC` du Brief.
  → Ajouter `_(Brief: SC-002)_`, ou justifier l'écart en une ligne.
- **[NON inclus] Major** — la section existe mais est vide.
  → Nommer ce que la v1 ne fait pas : facturation, multi-tenant.
### Lot C — renvois et signalements
- **[SC-002] Major** — signalement **amont** : le critère du Brief est un adjectif nu
  (« rapide »), donc rien ne peut y tracer proprement. → `/scd-sdd:audit brief`.

## Prochaine étape
`/scd-sdd:resume audit-prd` pour traiter le Lot A, puis relancer `/scd-sdd:audit prd`.

## Écarté
- [FR-007] IDs non contigus (FR-006 → FR-008) — assumé le 12/08 : le FR-007 a été retiré au
  cadrage, et réattribuer son ID casserait les backrefs déjà écrits.
```

**Cycle de vie.** Verdict `À CORRIGER` → ouvrir ou actualiser la fiche. Verdict `CONFORME` → une
fiche ouverte existe ? Ajouter `## Issue` (ce qui a été corrigé, en combien de passes) et
`git mv` vers `archive/`. Aucune fiche ouverte → n'en crée pas : il n'y a pas de travail à porter.

### 6. Journal, et ce qui suit

**Journal.** `docs/journal/socle.md`, phase **`audit`** — le fichier ne varie pas avec la cible,
la dimension étant celle du socle. Le verdict **en gras**, la cible, puis le décompte :

- `**CONFORME** — prd · 0 Critical · 1 Major arbitré`
- `**À CORRIGER** — prd · 2 Critical (FR-012 sans amont · NON inclus vide) · 3 Major`

Une passe `CONFORME` **sans fiche se consigne aussi** : l'absence de ligne se lirait comme un
audit jamais joué.

**Ce qui suit.** Aucune gate n'existe à ce niveau : rien à re-jouer mécaniquement, et l'audit ne
bloque aucune phase.

- **Lot A** → `/clear`, puis `/scd-sdd:resume audit-<document>`, avec le modèle adéquat. Puis
  relancer `/scd-sdd:audit <document>` — l'appariement fera le reste.
- **Lot B** → les candidats sont écrits dans `docs/adr/_candidates/` ; c'est `/scd-sdd:adr` qui
  les instruit. Le candidat n'est **pas** un renvoi dans le vide : la phase `adr` le promeut, et
  `ci` relit ensuite `docs/archi.md` **et** `docs/adr/`.
- **Lot C** → `/scd-sdd:revise-contract` pour `claude-md` ; pour un signalement amont, la commande
  nommée dans la ligne. **Ne les traite pas toi-même.**
</validation-socle>
