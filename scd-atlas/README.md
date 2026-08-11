# scd-atlas

Création et mise à jour de **plugins techno** (`scd-astro`, `scd-svelte`, `scd-flutter`…) par
campagnes de recherche approfondie.

Ces plugins sont des bases de connaissance sourcées : une campagne de recherches Claude Research,
des rapports committés, un skill distillé avec ses références, souvent un serveur MCP de
documentation en regard. Le cycle a déjà été joué à la main. `scd-atlas` l'industrialise — il ne
l'invente pas.

> **Version 0.1.0 — écrit, jamais éprouvé.** Le pipeline n'a pas encore été joué de bout en bout sur
> une campagne réelle. La version reste en `0.x` tant que ce n'est pas fait.

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

| # | Étape | Commande |
|---|---|---|
| 1 | Cartographie des sujets et routage | `/scd-atlas:map` |
| 2 | Pré-collecte — URL canoniques, versions, inventaire du dépôt | `/scd-atlas:collect` |
| 3 | Un prompt Research par sujet routé `research` ou `mixte` | `/scd-atlas:prompts` |
| — | **L'humain** joue les prompts dans Claude Desktop et dépose les rapports | — |
| 4 | Intake critique, liste de comblement, collecte de comblement | `/scd-atlas:intake` |
| 5 | Distillation en skill et références | `/scd-atlas:distill` |
| 6 | Evals de déclenchement et validation mécanique | `/scd-atlas:evals` |

Plus `/scd-atlas:prompt` — le composeur de prompts Research, utilisable seul, hors campagne et pour
n'importe quel sujet.

**Le pipeline est humain-au-milieu par construction**, pas par prudence : aucune session Claude Code
ne peut lancer Research dans Desktop. Il doit donc survivre au `/clear` — c'est le rôle de la carte.

Les sept commandes ne se déclenchent **que sur invocation humaine** (`disable-model-invocation`) :
elles écrivent dans un *autre* plugin que celui-ci, donc elles ont des effets de bord qu'on ne
déclenche pas par ressemblance de vocabulaire.

## La carte

L'artefact central d'une campagne, et ce qui donne son nom au plugin. Elle vit **dans le plugin
cible**, sous `docs/researchs/`, une ligne par sujet, et porte à la fois le routage et l'avancement :

| # | Sujet | Route | Collecte | Prompt | Rapport | Comblé | Distillé |
|---|---|---|---|---|---|---|---|
| 01 | Architecture | research | ✓ | ✓ | ✓ | ✓ | ✓ |
| 02 | Bindings Cloudflare | mixte | ✓ | ✓ | ✓ | — | — |
| 03 | Changelog v7 | code | ✓ | s.o. | s.o. | ✓ | — |

Trois valeurs seulement — `—` à faire, `✓` fait et constaté sur le disque, `s.o.` sans objet pour
cette route. Elle croît avec les sujets, jamais avec le temps : le reste de l'état se dérive de la
présence des fichiers, et **un répertoire est une campagne**.

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
