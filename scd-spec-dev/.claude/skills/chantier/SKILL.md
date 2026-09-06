---
name: chantier
description: |
  Contrat des fiches docs/chantiers/<état>/AAAA-MM-JJ-slug.md : l'unité de travail qui ne
  relève d'aucune phase du cycle (debug, hotfix, spike, ops, montée de version), ou qu'un
  /clear interrompt en vol. État porté par le répertoire (en-cours / en-attente / archive),
  anatomie et vocabulaire de la fiche, sélection par branche pour les worktrees, contrôle de
  fraîcheur, cycle de vie. Deux références chargées bloc par bloc : fiche.md pour qui ÉCRIT une
  fiche, manifeste.md pour le contexte rechargé à la reprise. Se charge pendant /scd-spec-dev:pause,
  resume et note, quand run ou run-parallel ouvrent une fiche sur un run bloqué, et quand status
  ou une commande lit une fiche sans l'écrire. Porte UNIQUEMENT les chantiers : ni la dérivation de
  l'état du cycle depuis OpenSpec et les tickets (skills openspec, implement), ni le contenu des
  documents produits. Une fiche ne dit jamais où en est le projet.
---

# Chantiers — `docs/chantiers/`

Un chantier est **un fichier par unité de travail** — celle qui ne relève d'aucune phase du cycle
spec-driven, ou qu'un `/clear` interrompt en vol. Ouvert, il porte de quoi reprendre ; fermé, il
devient l'archive de ce qui a été fait et pourquoi (`references/fiche.md`, bloc `<pourquoi>`).

Ce dispositif est **orthogonal à OpenSpec** : un chantier n'est pas un change. Un change livre une
capacité et laisse un delta dans `openspec/specs/` ; un chantier n'écrit dans aucune spec. La
frontière est nette — si le travail modifie le produit de façon à changer une capacité, il faut un
change, pas une fiche (`references/fiche.md`, bloc `<frontiere>`).

⚠️ **Aucun fait dérivable n'a le droit de figurer dans une fiche.** C'est ce qui l'empêche d'être un
fichier d'état, donc d'être démentie par les fichiers et la forge. Ce qui compte comme fait
dérivable, et les deux autres propriétés qui le garantissent : `references/fiche.md`, bloc
`<interdits>`.

## Emplacement, état, nommage

```
docs/chantiers/
  en-cours/     2026-08-04-verrou-compte.md
  en-attente/   2026-07-30-refonte-cache.md
  archive/      2026-07-28-flake-session.md
```

- **L'état est le répertoire**, jamais un champ. Changer d'état est un `git mv`. Il n'y a **aucun**
  champ `État :` dans une fiche : un chemin et un champ finiraient par se contredire, et rien ne
  trancherait.
- **`en-cours/` peut contenir plusieurs fiches** — le cas normal quand `run-parallel` fait tourner
  plusieurs tickets en worktrees isolés. La branche lève l'ambiguïté (§ « Cibler un chantier »).
- **Nom : `AAAA-MM-JJ-slug.md`, daté de l'ouverture**, jamais renommé. Le tri par nom donne la
  chronologie gratuitement dans les trois répertoires. Aucun compteur à maintenir.
- **Toute fiche est commitée** — les règles de commit sont dans `references/fiche.md`, bloc
  `<template>`. **En worktree**, chaque copie de travail voit les chantiers commités *sur sa
  branche* : c'est ce qui rend la sélection par branche fiable.

## Anatomie de la fiche

Un titre `#`, la ligne `Portée`, la ligne d'en-tête datée, puis `## Objectif`,
`## Contexte à charger`, `## Acquis`, `## Prochaine étape`, `## Écarté`. Plafond **~50 lignes** —
même valeur partout, mais ce qu'un dépassement signale dépend de la **nature** de la fiche
(`references/fiche.md`, bloc `<template>`). Le **template complet** est dans le même bloc — il ne se
charge que pour écrire.

- **`Portée`**, vocabulaire fermé donc greppable : `<change> · ticket NN` | `<change>` | `socle` |
  `hors-cycle`. La forme `· ticket NN` est celle qu'ouvrent `/scd-spec-dev:run` et
  `/scd-spec-dev:run-parallel` sur un run **bloqué** — le seul fait de ce niveau qu'aucun fichier ne
  dérive. `<change>` est le nom du répertoire de change sous `openspec/changes/`.
- **`branche`** porte une double charge : c'est l'**ancre de fraîcheur** *et* la **clé de sélection
  par worktree**. Ne l'omets jamais.
- Un champ **`Bloqué par :`** est admis sous l'en-tête quand le chantier attend un tiers (review,
  déploiement, réponse). C'est un **motif**, pas un état : il ne change pas de répertoire.
- À la fermeture, la fiche gagne **`## Issue`** — ce qui a été fait, le commit ou la PR — et part
  telle quelle dans `archive/`.

**`## Contexte à charger` est le manifeste** : il sépare le **suivi** (léger, toujours lu) du
**contexte** (volumineux, chargé seulement à la reprise). Une ligne est une **référence** — un
pointeur, sa classe (`à lire`, `à extraire`, `à déléguer`, `à situer`) et une raison —, jamais du
contenu recopié. Le reste est dans `references/manifeste.md`.

## Cibler un chantier (résolution)

`/clear` efface le contexte : une commande ne peut pas *supposer* sa cible. **Règle de résolution,
identique partout**, dans cet ordre :

1. Un **argument** est fourni → match sur un fragment de slug ou sur la date, dans les trois
   répertoires. Plusieurs correspondances → liste et `AskUserQuestion`.
2. Sinon, la fiche de `en-cours/` dont le champ **`branche`** vaut la branche courante
   (`git rev-parse --abbrev-ref HEAD`) → c'est elle. **C'est le cas worktree**, et c'est ce qui rend
   la sélection déterministe quand plusieurs tickets tournent en parallèle.
3. Sinon, s'il n'y a qu'**une seule** fiche dans `en-cours/` → la prendre et **l'annoncer**.
4. Sinon (0 ou ≥ 2 sans correspondance) → **ne devine jamais** : liste les candidates avec leur
   portée et leur date, et demande via `AskUserQuestion`.

Relaxation propre à ce niveau : **zéro candidate n'est pas une erreur**. Pour `pause` et `note`,
c'est un chantier neuf à ouvrir, de portée `hors-cycle` si rien ne le rattache au cycle.

**Cette règle est la source de vérité unique** — les commandes et les lecteurs la référencent, ils
ne la recopient jamais.

## Contrôle de fraîcheur

Une fiche est une intention datée : tout lecteur la contrôle **avant** de la restituer. Trois
contrôles, indépendants :

| Contrôle | Comment | Verdict |
|---|---|---|
| **Ancre** | branche courante ≠ champ `branche`, ou `git merge-base --is-ancestor <HEAD enregistré> HEAD` ≠ 0 | **⚠ suspect** — le dépôt est parti ailleurs |
| **Âge** | `Actualisé le` remonte à plus de 14 jours | **⚠ ancien** |
| **Consommation** | la `Prochaine étape` nomme un fichier, un test, un symbole, un critère — le vérifier contre les fichiers | **✔ consommé** → proposer la fermeture |

Une fiche peut être à jour en âge et suspecte en ancre : afficher les deux. **Une fiche ne bloque
jamais rien** — aucune commande ne STOP à cause d'elle, et personne n'écrit « périmé » dedans :
l'invalidation se **calcule à la lecture**, elle n'est pas un artefact.

## Cycle de vie

| Moment | Qui | Effet |
|---|---|---|
| ouverture / actualisation | `pause` | écrit dans `en-cours/` après validation humaine, puis commite |
| travail déjà terminé | `note` | écrit directement dans `archive/`, avec `## Issue` |
| run bloqué | `run` · `run-parallel` | ouvrent `en-cours/…-run-<slug>-<NN>.md` quand le workflow s'arrête sur un `blocked-*` : aucun critère coché, aucune PR — **la fiche est la seule trace** |
| signalement | `status` | lit sous contrôle de fraîcheur — l'en-tête seul |
| mise de côté · fermeture · abandon | `resume` | `git mv` vers `en-attente/` ; ou `## Issue` puis `git mv` vers `archive/` |

Une fiche archivée n'est **jamais** supprimée : l'archive est la chronologie du hors-cycle, que son
tri par nom rend lisible sans index. Le plugin ne livre **aucun hook de session** (doctrine
0-gate) : aucun `SessionStart` ne ressort une fiche au démarrage — c'est `/scd-spec-dev:status` qui
la signale. Ce qui n'a **pas** sa place dans une fiche est dans `references/fiche.md`, bloc
`<frontiere>`.

## Références

Les deux se chargent **bloc par bloc**, sur deux critères distincts : **écrire une fiche** charge
`references/fiche.md` ; **écrire ou honorer son manifeste de contexte** charge
`references/manifeste.md`. Ce qui ne fait ni l'un ni l'autre n'en charge **aucune** : lire l'en-tête
d'une fiche, sa ligne `Portée`, la règle de résolution, ou scaffolder l'arborescence se fait avec ce
`SKILL.md` et lui seul.

| Fichier | Qui la charge, et quels blocs |
|---|---|
| `references/fiche.md` | **écrire une fiche** — `pause` intégralement (seul applicateur de `<elagage>`, à l'actualisation) ; `note` intégralement sauf `<elagage>` ; `run` et `run-parallel` : `<interdits>` et `<template>`, sur un run bloqué seulement |
| `references/manifeste.md` | **le contexte à charger** — `pause` : `<regle_maitresse>` `<classes>` `<controles>` ; `resume` : `<classes>` `<lecture>` `<delegation>` |
