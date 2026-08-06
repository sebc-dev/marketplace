# scd-sdd

Cycle spec-driven complet, du projet vide à la PR — en un seul plugin.

> Ce plugin **remplace** `scd-project-docs`, `scd-feature-specs` et `scd-implement`, retirés
> de la marketplace. Un projet qui tournait avec eux se reprend avec `/scd-sdd:migrate` —
> voir la section « Migration » en bas.

## Les trois niveaux

| Niveau | Quand | Produit |
|---|---|---|
| **Socle** | une fois, au démarrage du projet | `docs/{brief,prd,stack,ci}.md`, `docs/adr/NNNN-*.md`, le workflow de CI, `CLAUDE.md` |
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
| `/scd-sdd:ci` | `docs/ci.md` + le workflow de la forge |
| `/scd-sdd:contract` | `CLAUDE.md` |

### Specs
| Commande | Produit |
|---|---|
| `/scd-sdd:kickoff-feature` | `specs/NNN-slug/` |
| `/scd-sdd:specify` | `spec.md` |
| `/scd-sdd:clarify` | `spec.md` sans marqueur |
| `/scd-sdd:plan` | `plan.md` |
| `/scd-sdd:tasks` | `tasks.md` |
| `/scd-sdd:analyze` | gate de conformité — verdict au journal, corrections dans un chantier de gate |

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

### Durcissement
| Commande | Effet |
|---|---|
| `/scd-sdd:premortem` | suppose l'échec et remonte à ce que les documents omettaient — sur le **socle**, une **feature** ou un **chantier**. Écrit, après approbation humaine |

### Recherche
| Commande | Effet |
|---|---|
| `/scd-sdd:lookup` | répond **en session** à une question factuelle et datée, en citant ses sources — **n'écrit aucun fichier** |
| `/scd-sdd:research` | l'**aller** : compose un prompt Claude Research dans `docs/research/` · le **retour** : classe le rapport revenu, le relit, et rend ce qu'il ne faut **pas** reprendre comme acquis |

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

### Le chantier de gate — ce qui ferme la boucle `tasks` ↔ `analyze`

`analyze` ne modifie aucun document du contrat et ne persiste aucun verdict — mais sa
**liste de corrections** est désormais une fiche de portée `NNN-slug · gate`. Sans elle,
la liste mourait au `/clear` suivant et la commande de correction repartait à froid :
c'est ce qui faisait tourner le contrat en rond sans converger.

Deux mécanismes en découlent :

- **`specify` / `clarify` / `plan` / `tasks` lisent la fiche** avant de travailler, et
  corrigent depuis sa liste plutôt qu'en re-dérivant tout.
- **Un Major s'arbitre une fois**, avec motif et date, dans le `## Écarté` de la fiche. Aux
  passes suivantes il est **détecté quand même** — les 14 contrôles se déroulent toujours
  intégralement — mais présenté à part, hors du décompte du verdict. Un finding neuf ressort
  alors du bruit. **Un Critical, lui, ne s'arbitre jamais.**

Le rapport gagne aussi un bloc **« Corrigés depuis »** : le signal qui manquait pour
distinguer *corrigé* de *pas re-mentionné cette fois*.

## La phase `ci` — la vérification sort de l'agent

`CLAUDE.md` est **advisory par construction** : écrire « les tests doivent passer » ne fait
pas passer les tests. Le socle s'arrêtait là. Il gagne une phase avant sa dernière,
`/scd-sdd:ci`, qui rend **déterministe** ce que le contrat ne peut que conseiller.

Elle dérive de `docs/stack.md` **sept contrôles bloquants** — build et typage, tests et
couverture *différentielle*, SCA sur lockfile committé, secrets vérifiés, SAST — dont deux
qui visent l'agent et non le code qu'il écrit : **`test-integrity`** (assertion supprimée,
`assert True`, `skip`/`xfail` ajouté, fichier de test vidé) et **`quality-config-guard`**
(seuils abaissés, règles désactivées), ce dernier avec sa soupape `chore(ci):` pour ne pas
bloquer sa propre maintenance.

Pourquoi de l'extérieur : le niveau implémentation atteste **de lui-même** que les tests
sont intacts. C'est la seule configuration producteur-vérificateur du plugin, et le terrain
la dit insuffisante. La CI vérifie ce que l'agent affirme.

Elle écrit `docs/ci.md` et le fichier de workflow ; elle **rend sans les exécuter** la
recette `gh` de protection de branche et le bloc `PreToolUse` qui bloque `--no-verify` en
local. Sans le ruleset posé — geste humain — tout ce qui précède est informatif. Le reste
du durcissement part en fiche `docs/chantiers/en-attente/`, parce qu'une section de plus
dans `docs/ci.md` ne serait jamais relue. `docs/ci.md` porte enfin, en section obligatoire,
**ce que ces contrôles ne couvrent pas** : régression sémantique silencieuse, oracle faux,
*building to the test*.

Le hook local `format-lint.sh` (PostToolUse) est, lui, **livré inerte** — placeholders
`FORMAT_CMD`/`LINT_CMD` vides, no-op tant qu'ils le restent — et la phase `ci` n'y touche
pas : il vit dans le cache du plugin, remis à vide à chaque mise à jour, et un renseignement
one-shot s'y perdrait. C'est `/scd-sdd:kickoff-feature` qui propose de le renseigner, à
chaque feature, depuis les commandes que `CLAUDE.md` tient de `docs/ci.md` ; et
`/scd-sdd:migrate` le re-diagnostique après une réinstallation.

## La recherche — transverse, et jamais reprise telle quelle

Une recherche ne joue **aucune phase** : elle ne journalise pas, le **rapport est le fait**.
`/scd-sdd:lookup` répond en session et ne persiste rien ; `/scd-sdd:research` fait l'aller
(un prompt Claude Research prêt à coller) et le retour (le rapport classé sous
`docs/research/AAAA-MM-JJ-slug.md`).

La moitié qui compte est **le retour**. La chaîne de traçabilité du plugin — Brief → PRD →
Stack → **ADR immuable** → spec → code — est un vecteur de *citation laundering* : une
source inexistante gagne en légitimité en traversant des documents réels que personne ne
vérifie, et ressort en décision que `CLAUDE.md` interdit de contredire. D'où la règle
centrale : **`research` ne modifie aucun document du socle.** Il isole ce qui porte
`[À VÉRIFIER]`, `[INCERTAIN]`, « source unique non recoupée », « éval interne », « préprint »
ou « contenu commercial », le nomme comme **non repris comme acquis**, et rend une liste.
L'humain décide ce qui descend dans `stack.md` ou dans un ADR.

Le lien va donc de la décision vers sa source, **jamais l'inverse** : un rapport qui
listerait les décisions qu'il a servies serait un fichier qui croît.

## Le premortem — transverse aussi, et il écrit

Toutes les gates du cycle demandent « ce document est-il bien formé ? ». `/scd-sdd:premortem`
pose la question orthogonale : **s'il était honoré tel quel, est-ce que ça échouerait quand
même ?** On se projette après coup **en supposant l'échec**, on l'explique, et on remonte à ce
que les documents omettaient. Poser l'échec comme acquis fait émerger ce qu'une checklist de
conformité ne voit pas — expliquer est une tâche à laquelle on est bien meilleur que prédire.

Elle s'applique à **trois cibles**, qui changent les documents jugés et ce qu'on a le droit
d'écrire, jamais la méthode :

| Cible | Ce qui est jugé | Ce qui suit |
|---|---|---|
| `/scd-sdd:premortem socle` | `prd.md` `stack.md` `adr/` `ci.md` `CLAUDE.md` | les features en vol dont les backrefs ont bougé sont **nommées** |
| `/scd-sdd:premortem 003` | `spec.md` `plan.md` `tasks.md`, après une gate au vert | **re-passe `analyze` imposée** |
| `/scd-sdd:premortem chantier <slug>` | une fiche de `docs/chantiers/` | rien — `resume` lira la fiche durcie |

Trois barrières, dans cet ordre : un valideur en contexte frais rejette le spéculatif, le
déjà-couvert et le scope creep ; **l'humain approuve** ; l'applicateur n'inscrit que l'approuvé.
Le scope creep est le risque n° 1 de la passe — c'est la seule écriture **déléguée** du plugin.

Deux règles font le reste. **On ne remédie jamais hors de la cible** : les formes légales sont
limitatives, et un risque qui vise un autre niveau devient un signalement. Et **un risque retenu
n'est jamais abandonné en silence** : s'il ne se referme par aucun texte — mesurer, éprouver,
migrer —, il devient une fiche `docs/chantiers/en-attente/`.

Comme la recherche, ce n'est **pas une phase** : rien ne la réclame, `status` ne la signale jamais
comme manquante, un socle sans premortem n'est pas un socle incomplet. Contrairement à elle, elle
**journalise** — parce qu'elle ne produit aucun artefact propre : elle modifie des documents
existants sans y laisser de marqueur, et sans sa ligne son passage serait dérivable de rien. Seule
exception, la cible `chantier` : la fiche est le fait, son `Actualisé le` suffit.

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

Depuis la **1.2.0**, `scd-sdd` **éclate `docs/JOURNAL.md`** en un fichier par cible. C'est un
changement **cassant** pour un projet déjà suivi, et le chemin de reprise est le même : **une
fois par projet**, `/scd-sdd:migrate`.

> ⚠️ Le numéro de version reste en `1.x` tant que le dispositif n'a pas été éprouvé en
> situation réelle. Il ne signale donc **pas** la rupture — `/scd-sdd:migrate` est le seul
> garde-fou, et il faut le jouer avant toute autre commande sur un projet existant.

La conversion est un **déplacement de lignes** — chaque section `##` devient un fichier,
lignes inchangées au caractère près, l'ancien fichier n'étant supprimé qu'après vérification
du compte. Aucune ligne n'est réécrite, aucune n'est inventée. `migrate` scaffolde au
passage les trois répertoires de `docs/chantiers/`.

Les autres artefacts (`docs/`, `specs/`) sont inchangés.
