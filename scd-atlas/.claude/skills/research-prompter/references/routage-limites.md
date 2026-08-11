# Référence — router avant de composer : ce que Research n'atteint pas

Chargée par `research-prompter` au **temps 1**, avant toute composition, et par `campaign` au
**routage** d'une carte de sujets. Elle répond à une seule question : *ce sujet doit-il partir en
Research, être collecté en session Claude Code, ou les deux ?*

- [Les trois routes](#les-trois-routes)
- [Ce que Research n'atteint pas](#ce-que-research-natteint-pas)
- [Quand ne pas lancer Research du tout](#quand-ne-pas-lancer-research-du-tout)
- [Le coût est un critère de routage](#le-coût-est-un-critère-de-routage)
- [Sans contournement en session Research](#sans-contournement-en-session-research)
- [Ce qui ferait réviser ce routage](#ce-qui-ferait-réviser-ce-routage)

## Les trois routes

| Route | Ce qui la caractérise | Exemples |
|---|---|---|
| **research** | Écosystème, comparaisons, doctrine, état de l'art, controverses. Beaucoup de sources publiques, aucune n'a besoin d'être lue intégralement ni citée ligne à ligne. | « patterns de rendu d'un framework », « santé et gouvernance d'un projet », « ce qui a changé entre deux majeures, du point de vue des utilisateurs » |
| **code** | Code source, diffs, historique, changelogs bruts, documentation rendue en JavaScript, métadonnées exactes de paquets. | « la signature réelle de cette API dans la v7 », « la liste exacte des breaking changes du CHANGELOG », « la date de publication de chaque version » |
| **mixte** | La question a un versant public et un versant vérifiable. Research donne la carte, la collecte donne les faits exacts. | « l'intégration avec telle plateforme » — la doctrine se cherche, les noms d'API se lisent |

La route **code** n'est pas un échec : c'est le mode nominal pour tout ce qui doit être exact. Un
sujet routé `code` ne reçoit aucun prompt Research, et la carte l'écrit `s.o.` en colonne rapport.

Un sujet **mixte** reçoit un prompt Research **et** une entrée dans la liste de pré-collecte : ce que
la collecte trouve descend dans le prompt, ce qui reste ouvert revient par le rapport.

## Ce que Research n'atteint pas

Toutes ces limites sont documentées par des sources primaires Anthropic ou par lecture directe des
`robots.txt`. Elles se contournent **hors** session Research, jamais dedans.

| Limite | Mécanisme | Ce qui la remplace |
|---|---|---|
| **Pas de rendu JavaScript** | Le fetch récupère le HTML initial, pas le DOM hydraté ; une documentation en SPA revient quasi vide | Une source statique ou `.md` équivalente ; sinon collecte en session (MCP navigateur, ou l'index `llms.txt` du site) |
| **Pas de code brut sur GitHub/GitLab** | `robots.txt` du catch-all bloque `/*/raw/`, `/*/blame/`, `/*/commits/`, les diffs, `/search`. Aucune des deux plateformes ne nomme `Claude-User` | `gh api` authentifié, `git clone --depth 1`, `raw.githubusercontent.com` — canal API, jamais le web |
| **Pages volumineuses tronquées** | Le contenu récupéré est coupé à une limite fixe, parfois au milieu | Cibler des ancres ou des sections ; fournir une variante `.md` allégée ; sinon collecter |
| **Pas de construction d'URL** | Mesure anti-exfiltration : seules les URL fournies ou issues d'une recherche précédente sont atteignables | La pré-collecte fournit les URL exactes **dans** le prompt |
| **Pas de serveurs MCP locaux** | Research n'invoque que les connecteurs distants | Faire le travail en session Claude Code, qui lit les MCP locaux |
| **Ni paywall, ni CAPTCHA, ni authentification** | `robots.txt` respecté, pas de contournement | Connecteur distant authentifié pour les données privées ; sinon inaccessible |
| **API et options inventées** | Le modèle complète par pattern-matching quand la doc manque ou est ambiguë | Citations verbatim exigées dans le prompt ; **et** vérification de chaque symbole contre la doc officielle, en collecte |

> **Ce qui n'est pas établi et ne se cite pas.** Les seuils exacts de troncature (une fenêtre
> d'environ 128 K, une taille de fetch d'environ 10 Mo) viennent de rétro-ingénierie communautaire,
> pas d'une documentation officielle : `[INCERTAIN]`. Le principe de la troncature, lui, est
> officiel. Même prudence sur les quotas chiffrés par plan, qu'Anthropic ne publie pas.

## Quand ne pas lancer Research du tout

| Situation | Pourquoi Research échoue | Router vers |
|---|---|---|
| Lire, comprendre ou modifier une base de code | Pas de système de fichiers local, `robots.txt` bloque le code brut, et un système multi-agents est explicitement inadapté aux tâches à fortes dépendances internes | **collecte en session** |
| Documentation en SPA | Pas de rendu JavaScript | **collecte en session** |
| Extraction structurée fiable et répétée | Troncature, coût, aucun contrôle sur le découpage | **collecte en session** |
| Métadonnées de paquets exactes (versions, dates) | Pages web variables | **API des registres**, en session |
| Données privées d'un SaaS | Authentification requise | Connecteur distant, ou hors périmètre |
| Réaction à un événement | Les connecteurs n'ont pas de déclencheurs | Hors périmètre d'une campagne |

## Le coût est un critère de routage

Anthropic écrit que Research « peut épuiser vos limites plus vite », et chiffre le surcoût d'un
système multi-agents à **environ 15× les tokens d'un chat** *(évaluation interne, juin 2025 —
niveau : mesuré, source : officiel éditeur)*. Le même billet note que l'usage de tokens explique à
lui seul environ 80 % de la variance de performance sur son évaluation interne.

Deux conséquences pour une campagne :

- **un sujet par session Research**, jamais deux — c'est aussi ce que dit la règle de portée ;
- **un sujet routable en `code` ne part pas en Research** par confort. La collecte en session est
  moins chère, et surtout exacte.

## Sans contournement en session Research

Ces cinq points ne se contournent pas *dans* une session : ils imposent d'en sortir.

- **Le rendu JavaScript** — aucun moyen de forcer l'exécution du JS.
- **La construction d'URL** — impossible par conception ; seule la pré-collecte y répond.
- **La lecture du code brut, du blame et de l'historique par le web** — bloquée par `robots.txt` ;
  seul le canal API y accède.
- **Le contrôle fin de la troncature** — le paramètre n'est pas exposé à l'utilisateur Desktop ; on
  n'agit qu'en amont, par des URL ciblées.
- **Une garantie de fraîcheur des versions ou des API** — il n'en existe pas. Les mitigations
  réduisent sans éliminer, et aucun score public de fiabilité spécifique à Research n'existe.

Ce dernier point est la raison pour laquelle un rapport revenu passe par un **intake critique** et
non par une simple relecture.

## Ce qui ferait réviser ce routage

- Si le rendu JavaScript devient disponible, ou si le contrôle de la troncature est exposé côté
  Desktop, la règle « sortir pour le JS et la troncature » tombe.
- Si un connecteur GitHub stable et complet remplace l'actuel, la lecture de dépôt redevient
  envisageable en session Research — la route `code` se rétrécit.
- Si un score public de fiabilité ou de fraîcheur paraît pour Research, l'exigence d'intake
  critique peut s'alléger.
