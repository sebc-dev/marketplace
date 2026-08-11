# Référence — appairer le plugin produit à la documentation de sa techno

Chargée par `campaign` à la **distillation** (`/scd-atlas:distill`), quand il faut décider comment le
plugin cible atteint la documentation vivante de sa technologie : serveur MCP embarqué, `llms.txt`
pointé, ou skill statique seul. Elle porte aussi la **politique de confiance** — ce qu'un plugin a le
droit d'embarquer.

Elle ne dit rien des canaux qu'une **session** ouvre pour collecter : c'est `collecte.md`, et les
deux ne se répondent pas l'une l'autre.

- [La question n'est pas « MCP ou llms.txt »](#la-question-nest-pas--mcp-ou-llmstxt-)
- [L'arbre de décision](#larbre-de-décision)
- [R7 — la politique de confiance](#r7--la-politique-de-confiance)
- [Ce que le skill produit doit porter](#ce-que-le-skill-produit-doit-porter)
- [`llms-full.txt` — matière première, jamais ressource d'exécution](#llms-fulltxt--matière-première-jamais-ressource-dexécution)
- [Ce que coûte un MCP, mesuré au bon endroit](#ce-que-coûte-un-mcp-mesuré-au-bon-endroit)
- [Les pièges de mécanique d'un MCP de plugin](#les-pièges-de-mécanique-dun-mcp-de-plugin)
- [La voie de lecture n'est pas neutre](#la-voie-de-lecture-nest-pas-neutre)
- [Ce que cette référence ne tranche pas](#ce-que-cette-référence-ne-tranche-pas)

## La question n'est pas « MCP ou llms.txt »

Les deux mécanismes ne sont pas concurrents : **`llms.txt` pointe, MCP requête.** Le facteur qui
décide n'est ni l'un ni l'autre — c'est **ce que l'éditeur de la techno a déjà publié pour les
agents**. L'appairage est donc un **champ de configuration du plugin produit**, arrêté campagne par
campagne, et non un mécanisme unique choisi une fois pour toutes. C'est aussi ce qui rend la
disparition d'un fournisseur survivable : elle devient une migration de configuration.

Le partage du travail ne bouge pas, lui :

| Ce qui doit être… | Vit dans | Pourquoi |
|---|---|---|
| **vrai à coup sûr** — idiomes, pièges, patterns interdits, écarts entre majeures | le skill, en statique | c'est de la connaissance distillée : elle vaut **parce qu'**elle n'est pas récupérable telle quelle en ligne |
| **à jour** — signatures, options de configuration, nouveautés | le mécanisme d'appairage | figer une signature dans un skill, c'est signer sa péremption |
| **disponible sans réseau ni quota** | le skill, avec un pointeur vers la source | un plugin qui ne sert à rien hors ligne ne sert à rien en avion |

## L'arbre de décision

```
L'éditeur publie-t-il un plugin Claude Code officiel ?
├─ OUI   → NE PAS DUPLIQUER. Dépendre de ce plugin et le documenter comme
│          prérequis. Le plugin maison n'apporte plus que ce que l'officiel
│          n'a pas : distillation opinionnée, patterns projet, intégration
│          avec le reste de la marketplace.
│
└─ NON
   └─ L'éditeur publie-t-il un MCP officiel ?
      ├─ OUI  → EMBARQUER ce MCP dans le `.mcp.json` du plugin,
      │         + un skill qui enseigne QUAND l'appeler,
      │         + le garde-fou de version (lecture du manifeste projet).
      │         ⚠ prévoir le cas « l'utilisateur l'a déjà configuré » :
      │           le dédoublonnage se fait par endpoint, et sa définition gagne.
      │
      └─ NON
         └─ Le site de doc publie-t-il un `llms.txt` exploitable ?
            ├─ OUI → SKILL STATIQUE + URL épinglées, WebFetch dirigé.
            │        Zéro infra, zéro quota, lecture isolée.
            │        ← l'option par défaut
            │
            └─ NON
               └─ Le versionnage strict est-il exigé ?
                  ├─ OUI → index auto-hébergé, construit et versionné
                  │        par le plugin ⚠ la distribuabilité de l'index
                  │        est `[INCERTAIN]` et **bloquante pour cette
                  │        seule voie** : la vérifier avant de s'y engager
                  │
                  └─ NON → agrégateur généraliste, en dernier recours
                           (quota, non auto-hébergeable, contenu
                            communautaire non garanti)
```

Deux configurations valent d'être nommées parce qu'elles servent de repères : un écosystème qui livre
déjà **MCP + skills + subagent + instructions** est le cas où le plugin maison apporte le moins — le
documenter vaut mieux que produire un doublon plus faible ; un écosystème qui publie un **MCP
officiel sans plugin** est celui où il apporte le plus, et c'est le gabarit à suivre.

**La position d'un écosystème se constate, elle ne se suppose pas.** Elle change dans le temps, et
c'est un fait à collecter au début de campagne, avec sa date.

## R7 — la politique de confiance

**Un `.mcp.json` ne s'embarque que pour un serveur publié par l'éditeur de la technologie. Tout
serveur tiers se documente — commande d'installation écrite, jamais exécutée.**

C'est une règle, pas une préférence, et elle ne se pose pas à l'humain campagne par campagne : elle
est déjà tranchée. Le motif : les serveurs d'un plugin **démarrent automatiquement** dès l'activation
du plugin, chez tous ses utilisateurs ; et Anthropic *examine* les connecteurs de son répertoire au
regard de ses critères de référencement mais **n'en audite pas la sécurité** (source primaire, doc
sécurité de Claude Code). Le référencement officiel ne vaut donc pas garantie. Pour un serveur
d'éditeur, la confiance est déjà engagée par le choix de la techno ; pour un agrégateur, elle ne
l'est pas, et l'engager à la place de l'utilisateur n'appartient pas au plugin.

L'ordre de grandeur du risque est mesuré : sur **1 899 serveurs MCP open source**, 7,2 % portent des
vulnérabilités générales et 66 % des *code smells* (article académique, source primaire). La mesure
de *tool poisoning* souvent citée à côté (5,5 %) porte en réalité sur un sous-ensemble de **73**
serveurs — elle ne se cite pas au même rang.

## Ce que le skill produit doit porter

**Les URL, épinglées dans le skill.** Aucun agent ne va chercher spéculativement un `llms.txt` qui
n'est pas nommé : sur une étude de 137 210 domaines, les requêtes de bots IA vers un `llms.txt`
inexistant sont à **zéro** (source primaire, mesuré sur logs). La valeur d'un `llms.txt` vient donc
entièrement du fait que le plugin y pointe. C'est une ligne dans un `SKILL.md`, pas une
infrastructure — et c'est aussi ce qui évite de laisser l'agent naviguer librement depuis l'index.

**La version, en paramètre de première classe.** Hors index auto-hébergé et agrégateur versionné,
**aucun mécanisme ne s'aligne sur la version réellement installée dans le projet** : un agent équipé
du MCP officiel reçoit la doc de la dernière version, quel que soit le manifeste. C'est plus
insidieux qu'une absence de doc, parce que la réponse a l'air autoritaire. Deux parades, non
exclusives, à écrire dans le skill produit :

1. lire la version dans le manifeste du projet (`package.json`, `pubspec.yaml`…) et l'injecter dans
   les requêtes documentaires ;
2. **documenter les écarts connus entre majeures** — c'est précisément ce qu'apporte la distillation
   manuelle, et ce qu'aucun mécanisme automatique ne donne.

## `llms-full.txt` — matière première, jamais ressource d'exécution

Il **n'est pas dans la spécification** : le texte de référence, révisé en août 2026, ne le mentionne
nulle part, quand la plateforme qui l'a introduit affirme qu'il y a été adopté. Désaccord réel entre
sources, laissé ouvert : le traiter comme une **convention de plateforme largement déployée** — le
détecter, ne pas s'y fier.

Son usage légitime est **l'ingestion hors ligne** : matière première de distillation, lue une fois
pendant la campagne. L'injecter à l'exécution va contre l'intérêt même d'un skill distillé, et sa
génération automatique est souvent tronquée (plafond de 100 000 caractères chez au moins une
plateforme, avec une note des pages omises — un lecteur ne sait pas *lesquelles*).

## Ce que coûte un MCP, mesuré au bon endroit

Le coût contexte d'un MCP au repos n'est plus l'argument qu'il était : la **recherche d'outils** est
active par défaut, seuls les noms d'outils et les instructions serveur chargent au démarrage, les
schémas restent différés. Le coût dominant a basculé du côté des **réponses**.

| Fait | Valeur | Classe |
|---|---|---|
| Avertissement sur une sortie d'outil MCP | > **10 000 tokens** | officiel |
| Plafond par défaut d'une sortie d'outil MCP | **25 000 tokens** | officiel |
| Troncature d'une description d'outil ou d'instructions serveur | **2 Ko chacune** | officiel |
| Réinjection d'un corps de skill après compaction | **5 000 tokens, début conservé** | officiel |
| Ordres de grandeur au démarrage (noms d'outils, descriptions de skills, `CLAUDE.md`) | explicitement **illustratifs** dans la source | officiel, mais non mesuré |

Conséquence de sélection : **un serveur de doc qui rend des pages entières coûte bien plus qu'un
serveur qui rend des extraits ciblés** — c'est le critère le plus discriminant entre deux serveurs
qui répondent à la même question.

Et une conséquence de méthode : **la mesure se fait en session Claude Code**, avec `/mcp` (coût en
tokens par serveur) et `/context` (répartition en direct) — jamais depuis Research, qui n'invoque
aucun serveur MCP local. Instrumenter un plugin pilote vaut mieux que raisonner sur les ordres de
grandeur ci-dessus.

## Les pièges de mécanique d'un MCP de plugin

- **Le nom d'outil n'est pas celui qu'on croit.** Un outil d'un serveur embarqué dans un plugin
  s'appelle `mcp__plugin_<nom-plugin>_<nom-serveur>__<nom-outil>`, et le serveur s'enregistre sous
  `plugin:<nom-plugin>:<nom-serveur>`. Un matcher de hook ou une règle de permission écrite contre la
  clé nue du serveur ne se déclenche **jamais**. L'erreur ne se voit qu'à l'exécution.
- **Le dédoublonnage se fait par endpoint** pour les serveurs de plugins, par nom pour les scopes
  local/projet/utilisateur, et la précédence place le plugin **après** ces trois. Un utilisateur qui a
  déjà configuré le même endpoint garde sa définition : **un plugin ne peut pas supposer que sa
  configuration MCP est celle qui sera active.**
- **Ne pas activer `alwaysLoad` sur un serveur de doc.** La doc n'est pas nécessaire à chaque tour, le
  réglage met les descriptions d'outils en contexte à chaque session sans bénéfice, et il fait
  attendre le démarrage.

## La voie de lecture n'est pas neutre

**La récupération web utilise une fenêtre de contexte séparée** pour éviter d'injecter des prompts
malveillants — c'est écrit dans la doc sécurité. **Aucune protection équivalente n'est documentée
pour les résultats d'outils MCP.** À service rendu égal, la lecture par WebFetch est donc plus sûre
que la lecture par MCP, et l'isolation est gratuite.

La menace est active, pas théorique : le plus gros crawler observé sur les fichiers `llms.txt` d'une
étude de logs s'identifie comme `prompt-injection-survey/1.0`. La chaîne est directe — une page de
doc contient du texte instructionnel, l'agent la récupère **sur instruction du plugin**, donc avec le
crédit d'une source recommandée. S'y ajoute le *tool poisoning* : les descriptions d'outils MCP
entrent en contexte et sont traitées comme des instructions.

Ce qui en découle pour un `llms.txt` que **le projet** maîtrise : le traiter **comme du code** —
versionné, droits d'écriture restreints, contenu limité à des liens et des descriptions, **rien qui
ait la forme d'une instruction**, et ne lier que des ressources qu'on contrôle.

## Ce que cette référence ne tranche pas

- **La qualité comparée des mécanismes.** Aucune source ne compare, sur des tâches identiques, la
  justesse d'un MCP officiel, d'un agrégateur et d'un `llms.txt`. Les seuls chiffres qui circulent
  sont des **benchmarks fournisseurs** — ils ne se reprennent pas. Ce trou se comble par un test
  maison plus vite que par de la recherche.
- **La distribuabilité d'un index auto-hébergé** — livrable dans un plugin, ou reconstruit par chaque
  utilisateur ? `[INCERTAIN]`, et **bloquant pour cette seule voie** : à vérifier avant de s'y
  engager, jamais à supposer.
- **Les quotas et les popularités des serveurs tiers.** Les plafonds lus sur une page tarifaire
  officielle se citent avec leur date ; les limites horaires, les étoiles de dépôts et les chiffres
  d'agrégateurs relayés par des blogs ne se citent pas du tout.
- **Le cas Flutter/Dart**, angle mort nommé de la source : il s'instruit à la campagne qui le
  concerne, pas ici.
