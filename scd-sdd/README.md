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
| `/scd-sdd:init-project` | `docs/`, `docs/adr/`, `docs/JOURNAL.md` |
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
| `/scd-sdd:status` | **où on en est** — les trois niveaux, la prochaine commande |
| `/scd-sdd:status-specs` | détail des features, recoupements de fichiers |
| `/scd-sdd:status-impl` | détail des lots, sûreté de merge des PR |

### Reprise
| Commande | Effet |
|---|---|
| `/scd-sdd:migrate` | reprend un projet venu des trois anciens plugins — une fois, au début |

## Le suivi

L'état vit dans les fichiers : `/clear` efface le contexte, pas la progression.

`docs/JOURNAL.md` complète cette dérivation par la **chronologie** : **chaque phase
jouée y laisse une ligne datée**, au niveau projet (section `## Socle`) comme au niveau
feature (section `## NNN-slug`). Seuls les trois `status` n'écrivent rien — ils lisent.

Parmi ces lignes, trois faits ne sont connaissables que là, parce qu'ils ne laissent
aucune trace sur disque : le verdict d'une gate `analyze`, les remédiations d'un
`premortem`, l'issue d'un lot (y compris un run bloqué, qui ne coche rien et n'ouvre
aucune PR).

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
- `docs/JOURNAL.md` n'existe pas, donc `/scd-sdd:status` n'a ni chronologie ni contrôle
  de fraîcheur des gates.

`migrate` diagnostique les trois, **reconstitue le journal depuis l'historique git** —
une ligne par artefact présent, datée de son commit d'ajout et marquée `(reconstitué)` —
puis applique les correctifs après accord, écriture par écriture. Il ne désinstalle rien
(c'est à toi) et ne réécrit aucun document.

Ce qu'il ne reconstitue **jamais** : le verdict d'une gate `analyze`, un `premortem`
appliqué, l'issue d'un lot. Ce sont les trois faits pour lesquels le journal existe — les
fabriquer le viderait de son sens. Ils apparaîtront à leur prochaine exécution.
