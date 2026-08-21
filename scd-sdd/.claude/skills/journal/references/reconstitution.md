# Référence — Reconstitution et conversion du journal

Chargée par `/scd-sdd:migrate` **seule**. Aucune autre commande chargeant le skill `journal` n'en a
le moindre usage : c'est pourquoi elle ne vit pas dans le `SKILL.md`.

Trois opérations distinctes, toutes réservées à `migrate` :

- la **conversion du socle** — les quatre documents d'avant `1.19.0` vers les deux qui les
  remplacent : un déplacement de sections, aucune phrase réécrite ;
- la **conversion du journal** — un `docs/JOURNAL.md` monolithique vers `docs/journal/*.md` : un
  déplacement de lignes, aucune ligne inventée ;
- la **reconstitution** d'une chronologie absente depuis l'historique git — des lignes neuves,
  mais datées d'un fait vérifiable.

Les trois sont indépendantes et se cumulent. Un projet peut n'en demander aucune, une seule, ou
les trois.

<conversion>

## Conversion du socle — quatre documents → deux

Un projet suivi avant `1.19.0` porte `docs/brief.md`, `docs/prd.md`, `docs/stack.md` et
`docs/archi.md`. La fusion (`DECISIONS.md` §D39) les remplace par `docs/produit.md` et
`docs/technique.md`. C'est un **déplacement de sections** : aucune phrase n'est reformulée, aucun
`FR-xxx`, `SC-xxx` ni numéro d'ADR ne change.

1. **Précondition.** Au moins un des quatre anciens fichiers présent **et** sa cible absente. Cible
   déjà présente → **rien à convertir pour ce document**, on n'y touche pas. C'est ce qui rend
   l'opération rejouable.
2. **Report section par section**, selon les deux tables ci-dessous. Une section absente de la
   source ne crée pas de section vide dans la cible. Une section de la source **hors table** →
   **STOP** et demander ; on ne classe pas au jugé.
3. **Contrôle avant suppression.** Chaque section de chaque source doit se retrouver dans une
   cible, ou avoir été explicitement fusionnée. Sinon → **STOP**, on ne supprime rien.
4. **Puis seulement** supprimer les anciens fichiers.

### `docs/brief.md` + `docs/prd.md` → `docs/produit.md`

| Section cible | Source |
|---|---|
| `## Légende` | **neuve** — reprise du `<template>` de `references/produit.md` |
| `## Problème` | `brief` — telle quelle |
| `## Objectif & résultat attendu` | `brief` — telle quelle |
| `## Utilisateurs & cas d'usage` | `brief` § *… principaux* — titre raccourci, contenu inchangé |
| `## User stories (priorisées)` | `prd` — telle quelle |
| `## Exigences fonctionnelles (atomiques, testables)` | `prd` — telle quelle, **numéros `FR-xxx` inchangés** |
| `## Cas limites` | `prd` — telle quelle |
| `## Périmètre EXCLU` | **fusion** de `brief` § *Périmètre* (sa moitié exclue) et `prd` § *NON inclus* |
| `## Critères de succès (mesurables)` | **fusion** de `brief` § *Critères de succès* et `prd` § *Critères de succès mesurables*, **numéros `SC-xxx` inchangés** |

⚠️ **Deux sections du Brief ne vont pas dans `produit.md`, et c'est là qu'une conversion se
trompe.**

- **`## Contraintes`** (techniques, légales, budget, plateformes) part dans **`docs/technique.md`**,
  § *Contraintes transverses*. `docs/produit.md` ne les demande plus du tout : la fusion les a
  déplacées d'un document à l'autre, pas supprimées.
- **La moitié *incluse* du `## Périmètre`** n'a **aucune section d'accueil**, et il ne faut pas en
  créer une. L'inclus *est* la liste des `FR-xxx`, qui est déjà reportée — ajouter une section
  « Inclus » produirait un finding déterministe au premier audit de la dimension `produit`.

### `docs/stack.md` + `docs/archi.md` → `docs/technique.md`

| Section cible | Source |
|---|---|
| `## Légende` | `archi` — telle quelle ; absent → reprise du `<template>` de `references/technique.md` |
| `## Vue d'ensemble` | **fusion** des deux § *Vue d'ensemble* — `stack` en portait une phrase plus un renvoi vers `archi`, **le renvoi disparaît avec le fichier** |
| `## Choix retenus` | `stack` — telle quelle |
| `## Contraintes transverses` | `stack` § *Contraintes techniques transverses* — le titre **perd le mot « techniques »** pour accueillir aussi le `## Contraintes` du Brief (ci-dessus) |
| `## Décisions structurantes → candidats ADR` | `stack` — telle quelle. **Ne pas la perdre** : c'est une des sources de la phase `adr` |
| `## Contraintes imposées par la stack` | `archi` — telle quelle |
| `## Caractéristiques architecturales retenues` | `archi` — telle quelle |
| `## Invariants` | `archi` — telle quelle, **table inchangée** |
| `## Ce que cette architecture n'admet pas comme invariant` | `archi` — telle quelle |

⚠️ **`docs/archi.md` est absent sur la plupart des projets à convertir** — la phase lui est
postérieure. `docs/technique.md` naît alors de `stack.md` seule, **sans table d'invariants**, et
c'est un état légal : tout l'aval traite *table absente ou vide* comme *contrôle sans objet*. Ne
fabrique aucun invariant pour combler, et ne le signale pas comme un défaut de migration.

## Conversion du journal — `docs/JOURNAL.md` → `docs/journal/*.md`

Un projet démarré avant l'éclatement du journal a un `docs/JOURNAL.md` unique, à sections. Il est
éclaté en un fichier par cible. **Aucune ligne n'est réécrite** : la règle d'ajout n° 4 du skill
(« ne jamais réécrire ni supprimer une ligne passée ») protège contre la falsification de
l'histoire, pas contre son classement.

1. **Précondition.** `docs/JOURNAL.md` présent. S'il est absent, il n'y a rien à convertir — passer
   à la reconstitution.
2. **Une section, un fichier.** `## Socle` → `docs/journal/socle.md`. Chaque `## NNN-slug` →
   `docs/journal/NNN-slug.md`. Une section inconnue → **STOP** et demander ; on ne classe pas au
   jugé.
3. **Chaque fichier reçoit** le titre `# Journal — <socle|NNN-slug>`, le bloc de citation du
   gabarit, puis la table de la section, **lignes inchangées au caractère près**. Le titre `##` de
   la section disparaît : le fichier *est* la cible.
4. **Contrôle avant suppression.** Le nombre total de lignes de table dans `docs/journal/*.md` doit
   égaler celui de `docs/JOURNAL.md`. Sinon → **STOP**, on ne supprime rien.
5. **Puis seulement** supprimer `docs/JOURNAL.md`, dans le même commit que les créations.

Ce qui n'est **pas** converti : rien d'autre. La conversion ne crée aucun chantier, ne déduit
aucune ligne manquante, ne réordonne pas les lignes d'une section.

</conversion>

<reconstitution>

## Reconstitution — depuis l'historique git

Un projet démarré avant le journal — typiquement sous `scd-project-docs`, `scd-feature-specs` et
`scd-implement` — n'a aucune chronologie. Elle n'est pourtant pas perdue : **git la porte**.
`/scd-sdd:migrate` est la **seule** commande autorisée à écrire des lignes antérieures à son
exécution, et sous quatre conditions strictes.

1. **Le fichier cible doit être absent.** `docs/journal/<cible>.md` présent → aucune
   reconstitution pour cette cible, on n'y touche pas. C'est ce qui rend l'opération rejouable sans
   doubler de ligne.
2. **La date vient de git, jamais d'ailleurs** :
   `git log --diff-filter=A -1 --format=%cI -- <fichier>` (date d'**ajout**), repli
   `git log -1 --format=%cI -- <fichier>`. **Hors dépôt git, ou fichier non suivi → pas de ligne** :
   pas de mtime (une copie de fichiers les réinitialise), pas de date déduite.
3. **Une ligne exige un artefact sur disque**, et son contenu chiffré est **compté sur le
   fichier** — c'est un constat, pas un souvenir :

   | Artefact | Fichier de journal | Phase | Résultat |
   |---|---|---|---|
   | `docs/produit.md` | `socle.md` | `produit` | personas · nb FR · nb SC · exclusions |
   | `docs/technique.md` | `socle.md` | `technique` | choix structurants · nb d'invariants · nb de caractéristiques |
   | `docs/adr/NNNN-*.md` | `socle.md` | `adr` | **une seule ligne** — plage de numéros, datée du **dernier** ADR ajouté |
   | `docs/ci.md` **puis** `CLAUDE.md` | `socle.md` | `livraison` | **une seule ligne**, datée du **premier** des deux ajouté : nb de contrôles bloquants · nb d'informatifs · nb de principes · taille de la DoD |
   | `specs/NNN-slug/` | `NNN-slug.md` | `kickoff-feature` | mode — `DELTA.md` présent → delta |
   | `…/spec.md` | `NNN-slug.md` | `specify` | nb FR · nb `[NEEDS CLARIFICATION]` |
   | `…/plan.md` | `NNN-slug.md` | `plan` | nb fichiers touchés |
   | `…/tasks.md` | `NNN-slug.md` | `tasks` | nb lots `Rn` · nb tâches `Tn` |

   ⚠️ **Sur un projet d'avant `1.19.0`, la date d'un document fusionné se prend sur l'ancien
   fichier.** `docs/produit.md` et `docs/technique.md` n'existent qu'à partir de la conversion : les
   dater sur leur propre ajout ferait remonter tout le socle au jour de la migration. Prends la date
   d'ajout du **plus ancien** des fichiers absorbés — `docs/brief.md` ou `docs/prd.md` pour
   `produit`, `docs/stack.md` ou `docs/archi.md` pour `technique` —, et **une seule ligne** par
   phase neuve. Aucun de ces fichiers dans l'historique → la règle 3 s'applique telle quelle.

   **La conversion du socle ne casse pas cette datation, même jouée d'abord.** `git log` lit
   l'historique, pas l'arbre de travail : un `docs/brief.md` supprimé rend toujours sa date
   d'ajout. L'ordre des deux opérations est donc libre — et c'est bien la date de l'**ancien**
   fichier qu'on cherche, pas celle du fichier fusionné.

4. **Chaque ligne reconstituée est marquée** `· (reconstitué)` en fin de colonne *Résultat*, et les
   lignes d'un fichier sont triées **par date croissante**. La citation d'en-tête gagne alors une
   phrase : *« Les lignes marquées (reconstitué) ont été datées depuis l'historique git lors de la
   migration. »*

</reconstitution>

<non_reconstituable>

## Ce qui ne se reconstitue jamais

Quelle que soit la commande :

| Phase | Pourquoi |
|---|---|
| `clarify` | il édite `spec.md`, il n'a aucun artefact propre à dater |
| `analyze` · `premortem` | les faits non dérivables — aucune trace, ni disque ni git |
| `revise-contract` | elle édite `CLAUDE.md` sans y laisser de marqueur, et git n'en date que l'**ajout**, donc `livraison` ; une passe sans édition ne laisse même pas de commit |
| `audit` | le document jugé sort **bit pour bit identique** — aucun diff à dater ; la fiche qu'il ouvre est un chantier (ci-dessous) et ne porte jamais le verdict |
| `run` · `sync` · `reland` | les cases `[x]` de `tasks.md` disent **quels** lots sont faits, jamais **quand**, ni par quelle PR, ni combien de fois le lot a été bloqué avant |
| les **chantiers** | un chantier n'a laissé aucun artefact daté avant d'exister ; et il ne s'écrit pas au journal |

Un journal reconstitué est donc **partiel par construction**, et c'est correct : il rend la
chronologie des artefacts, pas une histoire inventée. Les phases manquantes apparaîtront à leur
prochaine exécution.

</non_reconstituable>
