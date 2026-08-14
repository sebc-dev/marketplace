# scd-atlas

Campagnes de recherche approfondie sur une **cible nommée** : un **plugin techno** (`scd-astro`,
`scd-svelte`, `scd-flutter`…) à créer ou mettre à jour, ou un **thème** — une question large qui
vaut plusieurs sessions Claude Research.

Un plugin techno est une base de connaissance sourcée : une campagne de recherches, des rapports
committés, un skill distillé avec ses références, souvent un serveur MCP de documentation en regard.
Le cycle a déjà été joué à la main. `scd-atlas` l'industrialise — il ne l'invente pas.

Un **thème** emprunte la même machinerie sans produire de plugin : *ce qu'on peut ajouter à la CI
d'un projet pour la qualité et la sécurité d'un code généré par IA*, par exemple. Le pipeline s'y
arrête à l'intake, et le livrable est le **corpus** — rapports triés, fiches de collecte, angles
morts comblés ou déclarés irréductibles.

> **Version 0.2.0 — écrit, jamais éprouvé.** Le pipeline n'a pas encore été joué de bout en bout sur
> une campagne réelle, quelle que soit sa nature. La version reste en `0.x` tant que ce n'est pas
> fait.

## Le défaut que le pipeline comble

Claude Research (Desktop) n'atteint pas tout : le `robots.txt` de GitHub et GitLab bloque le code
brut, les diffs, le blame et l'historique ; les documentations rendues en JavaScript reviennent
vides ; le modèle ne peut pas construire d'URL ; les grosses pages sont tronquées ; les serveurs MCP
locaux ne sont pas invocables.

Ces angles morts sont exactement ce qu'une session Claude Code sait faire — `gh` et l'API GitHub
authentifiée, `git clone`, les API des registres de paquets, un MCP de documentation. D'où un
pipeline où Claude Code intervient **des deux côtés** de Research : avant, pour pré-collecter les URL
canoniques et les versions exactes qui descendent *dans* les prompts ; après, pour combler ce que les
rapports signalent eux-mêmes comme incertain ou manquant.

## Le pipeline

| # | Étape | Commande | Thème |
|---|---|---|---|
| 1 | Cartographie des sujets et routage | `/scd-atlas:map` · `/scd-atlas:map-theme` | ✓ |
| 2 | Pré-collecte — URL canoniques, versions, inventaire du dépôt | `/scd-atlas:collect` | ✓ |
| 3 | Un prompt Research par sujet routé `research` ou `mixte` | `/scd-atlas:prompts` | ✓ |
| — | **L'humain** joue les prompts dans Claude Desktop et dépose les rapports | — | ✓ |
| 4 | Intake critique, liste de comblement, collecte de comblement | `/scd-atlas:intake` | ✓ **terminal** |
| 5 | Distillation en skill et références | `/scd-atlas:distill` | — |
| 6 | Evals de déclenchement et validation mécanique | `/scd-atlas:evals` | — |

Plus `/scd-atlas:prompt` — le composeur de prompts Research, utilisable seul, hors campagne et pour
n'importe quel sujet.

## Les deux natures d'une campagne

| Nature | Ce qu'on vise | Ouverte par | Livrable |
|---|---|---|---|
| **plugin** | une techno | `/scd-atlas:map <plugin>` | le skill distillé et ses références |
| **thème** | une question large | `/scd-atlas:map-theme <répertoire>` | le **corpus** de rapports triés |

Un thème se cartographie en **sujets**, exactement comme une techno : un *sujet* est une **ligne de
carte**, c'est-à-dire une session Research. Ce qui change tient en trois points, et trois seulement :

- **la cible** — un plugin porte un `plugin.json` et impose l'emplacement de ses artefacts ; un
  thème vise un **répertoire nommé**, dans n'importe quel dépôt. Ni l'un ni l'autre ne se devine ;
- **le périmètre** — un plugin se différencie de ses campagnes antérieures en quatre catégories ; un
  thème se borne par son **acquis**, les documents qui répondent déjà. Ce qu'ils couvrent ne reçoit
  pas de ligne : rejouer une session Research pour reconfirmer ce qui est su est une session perdue ;
- **l'aval** — `distill` et `evals` sont sans objet pour un thème, et s'arrêtent d'eux-mêmes. La
  colonne `Distillé` vaut `s.o.` sur toute la carte.

Un thème peut déclarer un **ancrage** : le dépôt qu'il interroge. C'est le canal de collecte le
moins cher — ni quota, ni troncature, ni `robots.txt` — et le seul qui donne l'état *réel* de la
cible : ce qui tourne déjà, la stack et ses versions installées, ce que le projet s'est déjà dit.
Il rend les sujets concrets au lieu de génériques. Deux règles vont avec : ce qu'on y lit est un
**constat de départ, jamais une recommandation** — c'est ce que la recherche aura à juger —, et
**rien de local ne descend comme chemin dans un prompt** : Research n'ouvre aucun système de
fichiers, donc un fichier du dépôt descend en extrait cité, comme un `gh api`.

**Le pipeline est humain-au-milieu par construction**, pas par prudence : aucune session Claude Code
ne peut lancer Research dans Desktop. Il doit donc survivre au `/clear` — c'est le rôle de la carte.

Les huit commandes ne se déclenchent **que sur invocation humaine** (`disable-model-invocation`) :
elles écrivent dans un *autre* plugin que celui-ci, donc elles ont des effets de bord qu'on ne
déclenche pas par ressemblance de vocabulaire.

## La carte

L'artefact central d'une campagne, et ce qui donne son nom au plugin. Elle vit **dans la cible
nommée** — sous `docs/researchs/` du plugin, ou dans le répertoire d'un thème —, une ligne par
sujet, et porte à la fois le routage et l'avancement :

| # | Sujet | Route | Collecte | Prompt | Rapport | Comblé | Distillé |
|---|---|---|---|---|---|---|---|
| 01 | Architecture | research | ✓ | ✓ | ✓ | ✓ | ✓ |
| 02 | Bindings Cloudflare | mixte | ✓ | ✓ | ✓ | — | — |
| 03 | Changelog v7 | code | ✓ | s.o. | s.o. | ✓ | — |

Trois valeurs seulement — `—` à faire, `✓` fait et constaté sur le disque, `s.o.` sans objet. Elle
croît avec les sujets, jamais avec le temps : le reste de l'état se dérive de la présence des
fichiers, et **un répertoire est une campagne**.

Son **en-tête** porte ce qu'aucun fichier ne dérive et change avec la nature : le mode, la techno et
les campagnes antérieures pour un plugin ; la **question**, l'**ancrage** et l'**acquis** pour un
thème.

## Les deux skills

- **`research-prompter`** — compose des prompts Claude Research pour **n'importe quel sujet**,
  spécialisé par packs de domaines (le premier étant tech/dev). Il ne sait rien des campagnes.
- **`campaign`** — orchestre une campagne de création ou de mise à jour. Il ne compose aucun prompt
  lui-même : il appelle le premier.

## Ce que scd-atlas ne fait pas

- **Il ne lance aucune recherche Research.** Il compose des prompts ; l'humain les joue.
- **Il n'installe aucun serveur MCP tiers.** Un plugin produit n'embarque un `.mcp.json` que pour un
  serveur publié par l'éditeur de la technologie ; tout serveur tiers est documenté, jamais exécuté.
- **Il ne traite pas un rapport revenu comme un acquis.** Un rapport est une source de plus : ce qui
  ne se reprend pas est isolé et nommé, jamais fondu dans le reste.
