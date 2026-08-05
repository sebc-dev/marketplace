# scd-sdd

Cycle spec-driven complet, du projet vide à la PR — en un seul plugin.

> Ce plugin **remplace** `scd-project-docs`, `scd-feature-specs` et `scd-implement`, retirés
> de la marketplace. Un projet qui tournait avec eux se reprend avec `/scd-sdd:migrate` —
> voir la section « Migration » en bas.

## Les trois niveaux

| Niveau | Quand | Produit |
|---|---|---|
| **Socle** | une fois, au démarrage du projet | `docs/{brief,prd,stack}.md`, `docs/adr/NNNN-*.md`, `CLAUDE.md` |
| **Specs** | une fois par feature | `specs/NNN-slug/{spec,plan,tasks}.md` |
| **Implémentation** | un lot de review `Rn` à la fois | code, tests, commits, une PR par lot |

## Commandes

### Socle
| Commande | Produit |
|---|---|
| `/scd-sdd:init-project` | `docs/`, `docs/adr/`, `docs/journal/socle.md`, `docs/chantiers/` |
| `/scd-sdd:brief` | `docs/brief.md` |
| `/scd-sdd:prd` | `docs/prd.md` |
| `/scd-sdd:stack` | `docs/stack.md` |
| `/scd-sdd:adr` | `docs/adr/NNNN-*.md` |
| `/scd-sdd:contract` | `CLAUDE.md` |

### Specs
| Commande | Produit |
|---|---|
| `/scd-sdd:kickoff-feature` | `specs/NNN-slug/` |
| `/scd-sdd:specify` | `spec.md` |
| `/scd-sdd:clarify` | `spec.md` sans marqueur |
| `/scd-sdd:plan` | `plan.md` |
| `/scd-sdd:tasks` | `tasks.md` |
| `/scd-sdd:analyze` | gate de conformité — rapport + verdict |
| `/scd-sdd:premortem` | durcissement adverse du contrat |

### Implémentation
| Commande | Effet |
|---|---|
| `/scd-sdd:run` | un lot `Rn` → PR ready-for-review |
| `/scd-sdd:run-parallel` | plusieurs lots en worktrees isolés |
| `/scd-sdd:sync` | re-rebase une PR empilée dont la dépendance est mergée |
| `/scd-sdd:reland` | rapatrie un lot mergé hors de la branche par défaut |

### Suivi
| Commande | Réponse |
|---|---|
| `/scd-sdd:status` | **où on en est** — les trois niveaux, les chantiers, la prochaine commande |
| `/scd-sdd:status-specs` | détail des features, recoupements de fichiers |
| `/scd-sdd:status-impl` | détail des lots, sûreté de merge des PR |

### Chantiers
| Commande | Effet |
|---|---|
| `/scd-sdd:pause` | pose ou actualise un chantier avant un `/clear` en cours de tâche |
| `/scd-sdd:resume` | reprend un chantier : fraîcheur contrôlée, contexte rechargé |
| `/scd-sdd:note` | archive un travail hors-cycle **déjà terminé** |

### Reprise
| Commande | Effet |
|---|---|
| `/scd-sdd:migrate` | reprend un projet venu des trois anciens plugins **ou d'une version antérieure à l'éclatement du journal** — une fois, au début |

## Le suivi

L'état vit dans les fichiers : `/clear` efface le contexte, pas la progression. Deux
artefacts complètent cette dérivation, et **aucun fichier partagé ne croît** : toute
chronologie se dérive du nom et du chemin.

### Le journal — ce qui est arrivé

**Chaque phase jouée laisse une ligne datée** dans le journal de sa cible :
`docs/journal/socle.md` au niveau projet, `docs/journal/NNN-slug.md` par feature. Un
fichier par cible, donc borné par construction — une commande de phase ne lit jamais que
le sien. Seuls les trois `status` n'écrivent rien : ils lisent, et par extraction (`grep`),
jamais en ouvrant un fichier entier.

Parmi ces lignes, trois faits ne sont connaissables que là, parce qu'ils ne laissent
aucune trace sur disque : le verdict d'une gate `analyze`, les remédiations d'un
`premortem`, l'issue d'un lot (y compris un run bloqué, qui ne coche rien et n'ouvre
aucune PR).

### Les chantiers — ce qui est ouvert

Le travail qui ne relève d'aucune phase — un flake corrigé, une montée de version, un
spike — ou qu'un `/clear` interrompt en vol, devient un **chantier** : une fiche
`docs/chantiers/<état>/AAAA-MM-JJ-slug.md`.

```
docs/chantiers/
  en-cours/     2026-08-04-verrou-compte.md
  en-attente/   2026-07-30-refonte-cache.md
  archive/      2026-07-28-flake-session.md
```

**L'état est le répertoire**, jamais un champ : changer d'état est un `git mv`, et le tri
par nom donne la chronologie sans aucun index à maintenir.

Le cœur d'une fiche est son **manifeste de contexte** — des *références*, jamais du
contenu recopié, et chacune déclare comment elle se charge : `à lire` (intégralement),
`à extraire` (une ancre nommée), `à déléguer` (une question, traitée par un sous-agent en
contexte isolé), `à situer` (jamais chargée). Le suivi reste léger ; le contexte se
recharge à la demande, et seulement celui-là.

Un hook `SessionStart` annonce, après un `/clear`, la fiche dont la **branche** correspond
à celle du worktree courant — ce qui rend la reprise déterministe même avec plusieurs lots
en parallèle. Il lit, il n'écrit jamais : un hook ne connaît pas l'issue de ce qu'il
consignerait, et une fiche fabriquée est pire qu'un dossier vide.

## Migration depuis les trois plugins

```
/plugin install scd-sdd@sebc-dev-marketplace
/plugin uninstall scd-project-docs@sebc-dev-marketplace
/plugin uninstall scd-feature-specs@sebc-dev-marketplace
/plugin uninstall scd-implement@sebc-dev-marketplace
```

Puis, **une fois par projet** : `/scd-sdd:migrate`.

Les artefacts sur disque (`docs/`, `specs/`) sont inchangés : un projet démarré avec les
anciens plugins est repris **tel quel**, sans conversion. Ce que `migrate` traite est
ailleurs — et c'est invisible tant que rien ne le nomme :

- les anciens plugins **encore installés** font tourner leurs hooks en double et mettent
  deux jeux de skills en concurrence de routage ;
- les placeholders `FORMAT_CMD` / `LINT_CMD` de `format-lint.sh` sont **repartis à vide**
  (nouveau plugin = nouveau répertoire de cache) ;
- `docs/journal/` n'existe pas, donc `/scd-sdd:status` n'a ni chronologie ni contrôle
  de fraîcheur des gates ; `docs/chantiers/` non plus.

`migrate` diagnostique les trois, **reconstitue le journal depuis l'historique git** —
une ligne par artefact présent, datée de son commit d'ajout et marquée `(reconstitué)` —
puis applique les correctifs après accord, écriture par écriture. Il ne désinstalle rien
(c'est à toi) et ne réécrit aucun document.

Ce qu'il ne reconstitue **jamais** : le verdict d'une gate `analyze`, un `premortem`
appliqué, l'issue d'un lot. Ce sont les trois faits pour lesquels le journal existe — les
fabriquer le viderait de son sens. Ils apparaîtront à leur prochaine exécution. Les
chantiers non plus : rien n'a existé avant `docs/chantiers/`, il n'y a rien à dater.

## Migration depuis une version antérieure de `scd-sdd`

Cette version **éclate `docs/JOURNAL.md`** en un fichier par cible. C'est un changement
**cassant** pour un projet déjà suivi, et le chemin de reprise est le même : **une fois par
projet**, `/scd-sdd:migrate`.

> ⚠️ Le numéro de version reste en `1.x` tant que le dispositif n'a pas été éprouvé en
> situation réelle. Il ne signale donc **pas** la rupture — `/scd-sdd:migrate` est le seul
> garde-fou, et il faut le jouer avant toute autre commande sur un projet existant.

La conversion est un **déplacement de lignes** — chaque section `##` devient un fichier,
lignes inchangées au caractère près, l'ancien fichier n'étant supprimé qu'après vérification
du compte. Aucune ligne n'est réécrite, aucune n'est inventée. `migrate` scaffolde au
passage les trois répertoires de `docs/chantiers/`.

Les autres artefacts (`docs/`, `specs/`) sont inchangés.
