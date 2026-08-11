---
name: campaign
description: |
  Orchestre une campagne de recherche approfondie pour créer ou mettre à jour un
  plugin techno (scd-astro, scd-svelte, scd-flutter…) : cartographie des sujets,
  routage research / code / mixte, pré-collecte des URL canoniques et des versions
  exactes, génération des prompts, intake critique des rapports revenus, comblement
  des angles morts, distillation en skill et références, evals de déclenchement. La
  carte des sujets porte l'état de la campagne et survit au /clear. Se charge
  pendant /scd-atlas:map, collect, prompts, intake, distill et evals. Porte
  uniquement l'orchestration : il ne compose aucun prompt (skill research-prompter),
  il ne lance aucune recherche — aucune session ne le peut —, et il n'écrit jamais
  dans scd-atlas, seulement dans le plugin cible.
---

# Orchestrer une campagne de recherche

## Les cinq règles qui décident du reste

1. **La carte porte l'état.** Un seul artefact de suivi par campagne. Toute étape la lit avant
   d'agir et met à jour **la ligne du sujet qu'elle vient de traiter**, jamais la table entière. Si
   la carte et le disque se contredisent, **le disque gagne** : la carte se corrige.
2. **La campagne n'écrit que dans le plugin cible.** Jamais dans `scd-atlas`, jamais ailleurs. Une
   campagne dont le plugin cible n'est pas nommé ne démarre pas — c'est une précondition, pas une
   valeur par défaut à deviner.
3. **Le pipeline est humain-au-milieu par construction.** Aucune session Claude Code ne peut lancer
   Research dans Desktop. Une étape aval **constate** que les rapports sont là ; elle ne les attend
   pas en session, et elle ne fabrique jamais le contenu d'un rapport absent.
4. **On route avant de composer.** Charger `../research-prompter/references/routage-limites.md` à la
   cartographie : un sujet qui exige du code source, un diff, un historique ou une doc rendue en
   JavaScript se collecte, il ne se recherche pas. Il ne reçoit alors aucun prompt.
5. **Un rapport n'est pas un acquis.** Marqueurs `[INCERTAIN]`, sources uniques, angles morts que le
   rapport déclare lui-même : ce qui ne se reprend pas est **nommé et isolé**, jamais fondu dans le
   reste. C'est ce qui distingue un intake d'une relecture.

## Le pipeline

| # | Étape | Commande | Ce qu'elle lit | Ce qu'elle écrit |
|---|---|---|---|---|
| 1 | Cartographie et routage | `/scd-atlas:map` | le plugin cible, les campagnes antérieures | la carte |
| 2 | Pré-collecte | `/scd-atlas:collect` | la carte | une fiche de collecte par sujet |
| 3 | Génération des prompts | `/scd-atlas:prompts` | la carte, les fiches de collecte | un prompt par sujet routé `research` ou `mixte` |
| — | **L'humain** joue les prompts dans Desktop et dépose les rapports | — | — | les rapports |
| 4 | Intake et comblement | `/scd-atlas:intake` | les rapports revenus | la liste de comblement, puis les fiches comblées |
| 5 | Distillation | `/scd-atlas:distill` | les rapports, les fiches | le skill cible et ses références |
| 6 | Evals et validation | `/scd-atlas:evals` | le skill cible | le harnais de déclenchement |

**Le pipeline est ordonné, la campagne ne l'est pas.** L'avancement se suit **par sujet**, pas par
phase : un sujet peut être distillé quand son voisin attend encore son rapport. C'est précisément ce
que la carte rend lisible, et c'est ce qui permet de reprendre après un `/clear` sans rien rejouer.

Chaque étape est **idempotente** : rejouée, elle complète et ne détruit pas. Une case ne repasse
jamais de `✓` à `—`.

## Créer ou mettre à jour

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
- **Elle ne coche aucune case qu'elle n'a pas constatée sur le disque.**

## Références

| Fichier | Quand le charger |
|---|---|
| `references/carte.md` | À chaque étape : l'emplacement des artefacts, le format de la carte, le vocabulaire des cases, la reprise après `/clear`. |
| `references/collecte.md` | À la pré-collecte (`collect`) et au comblement (`intake`) : quel canal pour quoi, le seuil de bascule de chacun, ce qui a le droit de descendre dans un prompt. |
| `references/intake.md` | À l'intake : lire un rapport en critique et en tirer une liste de comblement. |
| `references/appairage-doc.md` | À la distillation, pour décider comment le plugin produit s'appaire à la documentation de sa techno — MCP officiel, `llms.txt` pointé, skill statique — et ce qu'il a le droit d'embarquer. |
| `references/distillation.md` | À la distillation : écrire le skill cible et ses références. |
| `references/evals.md` | Aux evals : le harnais de déclenchement et la validation mécanique. |
| `../research-prompter/references/routage-limites.md` | Au routage de la carte : ce que Research n'atteint pas, donc ce qui doit être collecté. **Référence partagée** — `research-prompter` la charge aussi, à son temps 1. |
