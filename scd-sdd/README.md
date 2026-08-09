# scd-sdd

Cycle spec-driven complet, du projet vide à la PR — en un seul plugin.

> Ce plugin **remplace** `scd-project-docs`, `scd-feature-specs` et `scd-implement`, retirés
> de la marketplace. Un projet qui tournait avec eux se reprend avec `/scd-sdd:migrate` —
> voir la section « Migration » en bas.

## Les trois niveaux

| Niveau | Quand | Produit |
|---|---|---|
| **Socle** | une fois, au démarrage du projet | `docs/{brief,prd,stack,archi,ci}.md`, `docs/adr/NNNN-*.md`, le workflow de CI, `CLAUDE.md` |
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
| `/scd-sdd:archi` | `docs/archi.md` — caractéristiques retenues et table d'invariants falsifiables |
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
  passes suivantes il est **détecté quand même** — les 15 contrôles se déroulent toujours
  intégralement — mais présenté à part, hors du décompte du verdict. Un finding neuf ressort
  alors du bruit. **Un Critical, lui, ne s'arbitre jamais.**

Le rapport gagne aussi un bloc **« Corrigés depuis »** : le signal qui manquait pour
distinguer *corrigé* de *pas re-mentionné cette fois*.

## La phase `archi` — des invariants falsifiables, jamais un design

L'architecture était présente **quatre fois** dans le plugin, et uniquement du côté des
**consommateurs** : `docs/stack.md` n'en demandait que quelques phrases de prose, `adr` ne
posait **aucune question structurelle**, le contrôle `arch-invariants` de la phase `ci`
était décrit de bout en bout mais branché sur une prise vide, et la dimension
`architecture` du reviewer avait pour seul référent « l'existant » — c'est-à-dire la dérive
déjà accumulée, pas une intention. Le tuyau était posé ; il manquait la source.

C'est ce que produit `/scd-sdd:archi`, **quatrième phase du socle**, entre `stack` et `adr` :
`docs/archi.md`. La dérive s'installe exactement par le chemin qui restait ouvert —
*developers make ad-hoc decisions when implementing*, décision par décision, feature par
feature (Anthony et al., ICSA 2024). Les contrôles automatiques de conformité de dépendances
la réduisent réellement — ≈ 60 % de violations structurelles en moins avec feedback (Knodel,
ICSM 2008) — mais imparfaitement : ≈ 77 % des dépendances détectées en moyenne sur dix outils
(Pruijt et al., 2017). Deux mesures, pas deux promesses.

### Trois temps, et un critère de fin qui se vérifie

1. **Constat** — ce que la stack et le framework imposent déjà. C'est consigné comme
   contrainte, **sans ADR** : on ne décide pas ce qui est déjà décidé. La question de
   partage est unique — *le framework échouerait-il sans cette règle ?*
2. **Options justifiées** sur les seuls axes réellement ouverts, et ils sont **deux** et
   indépendants : la décomposition **macro** (modules, bounded contexts) et l'organisation
   **micro** (couches, vertical slice, hexagonal). Les confondre est une erreur de
   catégorie. L'agent y est **contradicteur** — il argumente pour et contre —, jamais
   animateur d'un atelier d'évaluation : aucune méthode du domaine n'est validée en solo,
   et ATAM/QAW se chiffrent en dizaines de jours-homme.
3. **Compilation en invariants**, chacun passant la **question d'admission** — *la règle
   laisse-t-elle une trace observable dans l'arborescence ou dans les imports ?*

Le critère de fin est falsifiable : **chaque invariant a sa trace et son candidat ADR** —
jamais « l'architecture est décrite ». C'est ce qui empêche la phase de dégénérer en *big
design up front*, son risque n° 1, puisqu'une part de la structure est de toute façon
imposée par le framework.

`docs/archi.md` porte aussi les **caractéristiques architecturales retenues** — 3 à 5,
jamais plus, chacune tracée vers des `FR`/`SC` du PRD. C'est la seule passerelle documentée
entre exigences et structure, et au-delà de cinq on décrit une architecture générique.

### Ce qui entre, et ce que la phase n'admet pas

| Entre | N'entre pas |
|---|---|
| « la couche `db/` n'est atteinte que par `server/` » | « le code sera modulaire » |
| « aucun import de `react` hors de `ui/` » | « les responsabilités sont bien séparées » |
| « un handler ne dépasse pas N fichiers importés » | « l'architecture est évolutive » |

La grille d'admission est une taxonomie de **onze classes statiques** — sens des
dépendances, cycles, couches, frontières de modules, placement, nommage structurel,
visibilité déclarée, isolation du framework, imports prohibés, métriques structurelles
seuillées, couplage statique. Les quatre autres — sémantique, runtime, holistique — sont
**hors périmètre par construction**, et `docs/archi.md` les **nomme** dans une section
dédiée : taire un trou ferait croire le contraire.

### Le pont : un invariant devient un contrôle

Chaque ligne à colonne `ADR` vide est un **candidat** que la phase `adr` promeut — exactement
comme les décisions de `docs/stack.md`. L'entrée de la phase `ci` devient alors **double** et
**ordonnée** : la table de `docs/archi.md` d'abord, déjà admise et déjà classée, puis
`docs/adr/` pour ce qu'elle n'a pas vu — un ADR promu après coup peut porter un invariant que
la phase n'a pas vu passer. `arch-invariants` a enfin sa source.

Côté specs, l'accroche est **double**, parce que l'advisory seul ne tient pas :
`/scd-sdd:plan` confronte les fichiers touchés de chaque lot aux invariants — l'issue par
défaut étant de **changer le découpage**, la dérogation devant être nommée et justifiée — et
`/scd-sdd:analyze` va la chercher en **15ᵉ contrôle**, classé **Major et jamais Critical** :
bloquer une gate documentaire ferait d'elle un `arch-invariants` avant l'heure, alors que
c'est la CI qui mesure sur le code réel. Le reviewer, lui, prend `docs/archi.md` pour
référent — violation d'un invariant = **bloquant** — et « cohérence avec l'existant » devient
le **repli nommé**, écrit comme le mode dégradé qu'il est.

Enfin, la phase **admet**, elle ne vérifie pas : elle n'écrit rien dans `docs/ci.md`, ne
choisit aucun outil et **n'en exécute aucun**. L'inventaire d'outillage par écosystème vit
dans une section de référence que seule la phase `ci` charge, au moment d'en dériver les
contrôles — un instantané **daté**, à re-vérifier à l'adoption. Et tout est **additif** :
sans `docs/archi.md`, `arch-invariants` reste vide, le reviewer garde son repli, le 15ᵉ
contrôle ne se déclenche pas. Rien ne casse.

## La phase `ci` — la vérification sort de l'agent

`CLAUDE.md` est **advisory par construction** : écrire « les tests doivent passer » ne fait
pas passer les tests. Le socle s'arrêtait là. Il gagne une phase avant sa dernière,
`/scd-sdd:ci`, qui rend **déterministe** ce que le contrat ne peut que conseiller.

Pourquoi de l'extérieur : le niveau implémentation atteste **de lui-même** que les tests
sont intacts. C'est la seule configuration producteur-vérificateur du plugin, et le terrain
la dit insuffisante. La CI vérifie ce que l'agent affirme.

### Les contrôles se dérivent d'une grille, pas d'une liste d'outils

Une liste d'outils ne dit pas **contre quoi** on se défend : elle ne permet ni de juger
qu'un contrôle candidat couvre un mode déjà couvert, ni de voir qu'un mode n'est couvert
par rien. La phase part donc de **cinq modes de défaillance** — oracle faux · suppression
du vérificateur · chaîne d'approvisionnement (quatre sous-cas) · *building to the test* ·
violation d'invariant d'architecture — et chaque contrôle porte le sien. Une grille est
agnostique par construction, là où une liste d'outils est un instantané qui périme seul.

De là, **onze contrôles bloquants** dérivés de `docs/stack.md` : build et typage, tests et
couverture *différentielle*, SCA sur lockfile committé, secrets vérifiés, SAST — plus six
qui visent l'agent, et non le code qu'il écrit.

| Job | Ce qu'il refuse |
|---|---|
| `test-integrity` | assertion supprimée, `assert True`, `skip`/`xfail` ajouté, fichier de test vidé |
| `quality-config-guard` | seuil abaissé, règle désactivée — soupape `chore(ci):` pour sa propre maintenance |
| `verifier-guard` | le typage, le lint ou le SAST **éteints ligne à ligne** dans du code de production |
| `workflow-integrity` | une action de CI non épinglée par SHA immuable |
| `dependency-review` | une dépendance ajoutée en silence, un lockfile altéré |
| cooldown | une version publiée depuis moins de N jours — clé du résolveur, pas un job |

Le troisième est le mode le plus attrapable de tous, et aucun des sept contrôles
précédents ne le voyait : **l'agent n'écrit pas du code qui échoue au typage, il éteint le
typage sur la ligne qui échoue.** Un `as any` dans du code de production passait
`test-integrity`, qui regarde le diff des tests, comme `quality-config-guard`, qui regarde
celui des configs. Sa portée est limitée aux extensions de **source**, tests et
documentation exclus — un garde qui balaie tout se bloque sur le `docs/ci.md` du projet,
qui cite ces motifs pour les documenter.

Les trois suivants ferment ce que la SCA laissait ouvert : elle n'attrape que les **CVE
connues**, ni un paquet hostile trop récent pour figurer dans une base, ni une action
compromise par déplacement de tag, ni une altération directe du lockfile.

S'y ajoute un contrôle **informatif promouvable**, `arch-invariants` — le gisement
principal, puisque les défauts qui comptent dans du code généré sont des violations de
contrat propres au projet, qu'aucun outil générique ne connaît. Son entrée est **double et
ordonnée** : la table d'invariants de `docs/archi.md`, déjà admise et déjà classée, puis les
**ADR acceptés** pour ce qu'elle n'a pas vu. Un ADR y entre s'il laisse une **trace
observable dans l'arborescence ou dans les imports** — le même critère, dont `archi` est
désormais la source principale. Le contrôle reste informatif jusqu'à mesure par **rejeu sur
l'historique**, et le seuil vaut dans les deux sens : au-delà de 15 % de faux positifs, un
bloquant rebascule en informatif.

### La soupape du garde — une signature, pas un scope de commit

`verifier-guard` se déclenchera légitimement : un `as unknown as` dans un shim de types
est un cas réel, et un garde sans sortie bloque une PR sans issue. Mais la soupape de
`quality-config-guard` ne tient pas ici : **l'agent écrit `chore(types):` aussi facilement
qu'il écrit `as any`**. Pour la config qualité, la soupape doit rendre le geste
**visible**, et un scope suffit ; pour ce garde, elle doit le rendre **impossible à
l'agent**, parce que la menace visée *est* l'agent.

Elle est donc la **signature cryptographique du commit** qui introduit le motif, vérifiée
hors ligne par le job contre un registre de clés publiques versionné dans le dépôt, en
**fermeture par défaut** : sans registre, aucune suppression de vérificateur n'est
acceptée. La recette vit dans une référence à part, chargée **seulement quand le garde est
retenu** — la phase ne la paie pas quand elle ne la pose pas.

Deux choses s'écrivent à côté de ce qu'elle garantit. Le dispositif arrête l'IA qui évade,
celle qui écrit tout le dépôt y compris les gardes et sa propre attestation ; il n'arrête
**pas** l'accès aux identifiants du poste, et vendre l'un pour l'autre serait exactement le
vert trompeur que la phase existe pour supprimer. Et **le plugin n'exécute aucune
cryptographie** : il écrit le workflow qui la vérifie, comme il rend la recette de
protection de branche sans la jouer.

### Ce que la phase pose, et ce qu'elle laisse à l'humain

Elle écrit `docs/ci.md` et le fichier de workflow ; elle **rend sans les exécuter** la
recette `gh` de protection de branche et le bloc `PreToolUse` qui bloque `--no-verify` en
local. Sans le ruleset posé — geste humain — tout ce qui précède est informatif. Le reste
du durcissement part en fiche `docs/chantiers/en-attente/`, parce qu'une section de plus
dans `docs/ci.md` ne serait jamais relue. `docs/ci.md` porte enfin, en section obligatoire,
**ce que ces contrôles ne couvrent pas**, mode par mode : l'oracle faux, que seul le test
de mutation atteint partiellement ; la régression sémantique silencieuse ; le *building to
the test* ; et la réserve qui vaut pour les gardes eux-mêmes — **réprimer un comportement
peut le rendre plus subtil plutôt que l'éliminer.**

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
Stack → Archi → **ADR immuable** → spec → code — est un vecteur de *citation laundering* : une
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
