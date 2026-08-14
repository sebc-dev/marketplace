---
name: campaign
description: |
  Orchestre une campagne de recherche approfondie sur une cible nommée : un plugin
  techno à créer ou mettre à jour (scd-astro, scd-svelte, scd-flutter…), ou un thème
  — une question large qui vaut plusieurs sessions Research, éventuellement ancrée
  dans un dépôt dont l'état réel rend les sujets concrets. Cartographie des sujets,
  routage research / code / mixte, pré-collecte des URL canoniques et des versions
  exactes, génération des prompts, intake critique des rapports revenus, comblement
  des angles morts ; puis, pour un plugin seulement, distillation en skill et
  références et evals de déclenchement. La carte des sujets porte l'état de la
  campagne et survit au /clear. Se charge pendant /scd-atlas:map, map-theme, collect,
  prompts, intake, distill et evals. Porte uniquement l'orchestration : il ne compose
  aucun prompt (skill research-prompter), il ne lance aucune recherche — aucune
  session ne le peut —, et il n'écrit jamais dans scd-atlas, seulement dans la cible
  nommée.
---

# Orchestrer une campagne de recherche

## Les cinq règles qui décident du reste

1. **La carte porte l'état.** Un seul artefact de suivi par campagne. Toute étape la lit avant
   d'agir et met à jour **la ligne du sujet qu'elle vient de traiter**, jamais la table entière. Si
   la carte et le disque se contredisent, **le disque gagne** : la carte se corrige.
2. **La campagne n'écrit que dans la cible nommée** — le plugin, ou le répertoire de campagne d'un
   thème. Jamais dans `scd-atlas`, jamais ailleurs, jamais dans un dépôt d'ancrage. Une campagne
   dont la cible n'est pas nommée ne démarre pas — c'est une précondition, pas une valeur par
   défaut à deviner.
3. **Le pipeline est humain-au-milieu par construction.** Aucune session Claude Code ne peut lancer
   Research dans Desktop. Une étape aval **constate** que les rapports sont là ; elle ne les attend
   pas en session, et elle ne fabrique jamais le contenu d'un rapport absent.
4. **On route avant de composer.** Charger `../research-prompter/references/routage-limites.md` à la
   cartographie : un sujet qui exige du code source, un diff, un historique ou une doc rendue en
   JavaScript se collecte, il ne se recherche pas. Il ne reçoit alors aucun prompt.
5. **Un rapport n'est pas un acquis.** Marqueurs `[INCERTAIN]`, sources uniques, angles morts que le
   rapport déclare lui-même : ce qui ne se reprend pas est **nommé et isolé**, jamais fondu dans le
   reste. C'est ce qui distingue un intake d'une relecture.

## Les deux natures d'une campagne

Une campagne vise **un plugin** ou **un thème**. La nature est un fait de l'en-tête de carte, et
c'est tout ce dont les étapes ont besoin pour se comporter correctement.

| Nature | Ce qu'on vise | Ouverte par | Livrable | Le pipeline |
|---|---|---|---|---|
| **plugin** | une techno | `/scd-atlas:map` | le skill distillé et ses références | les six étapes |
| **thème** | une question large qui vaut plusieurs sessions Research | `/scd-atlas:map-theme` | le **corpus** : rapports, fiches, comblement refermé | **s'arrête à l'intake** |

**Un thème se cartographie en sujets**, exactement comme une techno : un *sujet* reste une **ligne de
carte**, quelle que soit la nature. Ce qui change tient en trois points — la **cible** (un plugin
impose l'emplacement de ses artefacts ; un thème vise un répertoire nommé, dans n'importe quel
dépôt), le **périmètre** (un plugin se différencie en quatre catégories ; un thème se borne par son
**acquis**), et l'**aval** (`distill` et `evals` sont sans objet pour un thème, et s'arrêtent). Le
reste — routage, format, cases, idempotence, *le disque gagne* — est identique.

Un thème peut déclarer un **ancrage** : le dépôt qu'il interroge. C'est un canal de collecte de
premier rang (`references/collecte.md`) et une **source**, jamais une cible — la campagne n'y écrit
rien, même quand son répertoire s'y trouve.

## Le pipeline

| # | Étape | Commande | Ce qu'elle lit | Ce qu'elle écrit |
|---|---|---|---|---|
| 1 | Cartographie et routage | `/scd-atlas:map` · `/scd-atlas:map-theme` | la cible, l'ancrage et l'acquis, les campagnes antérieures | la carte |
| 2 | Pré-collecte | `/scd-atlas:collect` | la carte | une fiche de collecte par sujet |
| 3 | Génération des prompts | `/scd-atlas:prompts` | la carte, les fiches de collecte | un prompt par sujet routé `research` ou `mixte` |
| — | **L'humain** joue les prompts dans Desktop et dépose les rapports | — | — | les rapports |
| 4 | Intake et comblement | `/scd-atlas:intake` | les rapports revenus | la liste de comblement, puis les fiches comblées |
| 5 | Distillation — **plugin seulement** | `/scd-atlas:distill` | les rapports, les fiches | le skill cible et ses références |
| 6 | Evals et validation — **plugin seulement** | `/scd-atlas:evals` | le skill cible | le harnais de déclenchement |

**Le pipeline est ordonné, la campagne ne l'est pas.** L'avancement se suit **par sujet**, pas par
phase : un sujet peut être distillé quand son voisin attend encore son rapport. C'est précisément ce
que la carte rend lisible, et c'est ce qui permet de reprendre après un `/clear` sans rien rejouer.

Chaque étape est **idempotente** : rejouée, elle complète et ne détruit pas. Une case ne repasse
jamais de `✓` à `—`.

## Créer ou mettre à jour — **campagne de plugin**

Les deux modes ci-dessous sont **propres à la nature `plugin`**. Un thème n'a pas de skill existant
à différencier : il se borne par son **acquis**, déclaré dans l'en-tête de sa carte, et ce que
l'acquis couvre ne reçoit pas de ligne — même règle, même motif que la catégorie `inchangé`.

**Création** — le plugin cible n'existe pas ou n'a pas de campagne antérieure. La cartographie part
du domaine : dresser la liste des sujets qui couvrent la technologie, la faire valider par l'humain,
puis router. Le précédent est la carte à 18 sujets de `scd-astro`.

**Mise à jour** — le plugin existe. L'inventaire passe avant tout : le skill et ses références, les
campagnes antérieures, la date de chaque rapport. Puis la carte se **différencie** en quatre
catégories, et cette différenciation est le livrable de l'étape 1 :

| Catégorie | Ce qu'on en fait |
|---|---|
| **inchangé** | ne se rejoue pas — une session Research pour reconfirmer ce qui n'a pas bougé est une session perdue |
| **touché** | rejoué dans la nouvelle campagne ; l'ancien rapport reste où il est, en l'état |
| **apparu** | nouveau sujet, nouvelle ligne, routage complet |
| **disparu** | retiré du skill cible à la distillation ; le rapport d'origine n'est pas supprimé |

**Une campagne ne modifie jamais les artefacts d'une campagne antérieure.** Elle les lit pour se
différencier et écrit les siens dans son propre répertoire. Le format et les emplacements sont dans
`references/carte.md`.

## Les recherches complémentaires

Au démarrage d'une campagne, **proposer** les recherches complémentaires que le sujet appelle —
chacune avec son prompt prêt à jouer. Elles ne s'imposent pas et elles ne s'omettent pas en silence :
l'humain décide ce qu'il joue, mais il décide en connaissance de ce qui a été écarté.

## La frontière avec `research-prompter`

La campagne **ne compose aucun prompt**. Elle fournit à `research-prompter` le sujet, son calibre
pressenti, la matière issue de la pré-collecte et le domaine à charger ; le composeur fait le reste,
et il applique exactement la même méthode qu'appelé hors campagne. Aucune consigne de raccourci ne
descend de la campagne vers le composeur — un prompt composé « vite parce qu'il y en a douze » est un
prompt qui reviendra en rapport faible.

Inversement, `research-prompter` ne sait rien des campagnes : il ne lit ni n'écrit la carte.

## Ce que la campagne ne fait pas

- **Elle ne lance aucune recherche.** L'étape humaine n'est pas une précaution, c'est une contrainte
  d'outillage : Research vit dans Desktop.
- **Elle n'installe aucun serveur MCP tiers.** Ce qu'un plugin produit embarque ou se contente de
  documenter est tranché dans `references/appairage-doc.md`, et la règle est stricte.
- **Elle ne publie rien** — ni entrée dans `marketplace.json`, ni dans `publish.json`, ni `/publish`.
  La publication est une demande humaine explicite, jamais une conséquence de la distillation.
- **Elle n'écrit aucune synthèse.** Pour un thème, le livrable est le **corpus** — rapports, fiches
  de collecte, comblement refermé. Compiler tout ça en un document sourcé est un travail réel, et il
  n'appartient pas à la campagne : ce que le dépôt fait de son corpus est sa décision.
- **Elle ne coche aucune case qu'elle n'a pas constatée sur le disque.**

## Références

| Fichier | Quand le charger |
|---|---|
| `references/carte.md` | À chaque étape : l'emplacement des artefacts, le format de la carte, le vocabulaire des cases, la reprise après `/clear`. |
| `references/collecte.md` | À la pré-collecte (`collect`) et au comblement (`intake`) : quel canal pour quoi, le seuil de bascule de chacun, ce qui a le droit de descendre dans un prompt. |
| `references/intake.md` | À l'intake : lire un rapport en critique et en tirer une liste de comblement. |
| `references/appairage-doc.md` | À la distillation, pour décider comment le plugin produit s'appaire à la documentation de sa techno — MCP officiel, `llms.txt` pointé, skill statique — et ce qu'il a le droit d'embarquer. **Campagne de plugin seulement.** |
| `references/distillation.md` | À la distillation : écrire le skill cible et ses références. **Campagne de plugin seulement.** |
| `references/evals.md` | Aux evals : le harnais de déclenchement et la validation mécanique. **Campagne de plugin seulement.** |
| `../research-prompter/references/routage-limites.md` | Au routage de la carte : ce que Research n'atteint pas, donc ce qui doit être collecté. **Référence partagée** — `research-prompter` la charge aussi, à son temps 1. |
