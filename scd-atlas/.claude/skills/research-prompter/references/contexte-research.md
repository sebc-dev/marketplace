# Référence — le contexte Research, ce qui est daté

Chargée par `research-prompter` à la **composition**, et par elle seule. Elle porte ce qui **périme** :
comment Research travaille, ce que son interface propose ou non, ce qu'il coûte, et ce qu'on peut
en dire de chiffré sans se tromper. La méthode qui ne bouge pas est dans le `SKILL.md`, la forme
dans `squelette.md`, le routage dans `routage-limites.md` — rien de tout cela ne se recopie ici.

<peremption>
État arrêté au **6 août 2026**. Trois règles d'usage, sans exception :

1. **La doc courante gagne.** Si une page officielle consultée aujourd'hui contredit cette fiche,
   c'est la fiche qui a tort — elle se corrige, elle ne s'invoque pas contre la source.
2. **Aucun chiffre d'ici ne descend dans un prompt composé.** Ces chiffres décrivent l'outil, pas le
   sujet de la recherche. Les mettre dans un `<context>` ferait passer un état daté pour un fait du
   domaine étudié.
3. **Rien ne se reprend sans sa date et sa classe de preuve.** « Éval interne, juin 2025 » et
   « mesuré par un tiers » ne se remplacent pas l'un l'autre.

Reprendre cette fiche quand :

- Anthropic nomme les modèles de la génération 5 dans Research — c'est le trou le plus important ;
- l'article support *Use Research on Claude* change de date « last updated » ;
- une nouvelle system card paraît (métriques d'honnêteté) ;
- le registre MCP passe de preview à GA, ou une verticale sectorielle est annoncée ;
- trimestriellement, pour les chiffres du Connectors Directory.
</peremption>

- [Comment Research travaille](#comment-research-travaille)
- [Ce que l'interface ne propose pas](#ce-que-linterface-ne-propose-pas)
- [Le raisonnement, et ce qui ne se prompte plus](#le-raisonnement-et-ce-qui-ne-se-prompte-plus)
- [Coût, quotas, fenêtre](#coût-quotas-fenêtre)
- [Ce qui est citable, et ce qui ne l'est pas](#ce-qui-est-citable-et-ce-qui-ne-lest-pas)
- [Fiabilité : le trou est le résultat](#fiabilité--le-trou-est-le-résultat)
- [Connecteurs](#connecteurs)
- [Livrables](#livrables)

## Comment Research travaille

Motif **orchestrateur-travailleurs** : un agent principal planifie et enregistre son plan en mémoire,
lance **3 à 5 sous-agents en parallèle** — chacun avec sa propre fenêtre de contexte et ses propres
outils —, puis un **CitationAgent** dédié vérifie l'attribution des sources avant livraison.

*Source primaire unique : billet d'ingénierie Anthropic* How we built our multi-agent research
system, **13 juin 2025**, jamais mis à jour depuis.

Trois conséquences pour composer :

- **L'exigence de citations verbatim tombe sur un mécanisme qui l'applique déjà.** Elle n'est pas
  décorative : elle aligne le prompt sur la passe d'attribution interne.
- **La portée pilote l'effort réellement dépensé.** Les prompts de Research explicitent leurs règles
  de scaling — 1 agent pour une recherche factuelle simple, 2 à 4 sous-agents pour une comparaison
  directe, plus de 10 pour une recherche complexe. C'est le seul levier : il n'existe aucun réglage.
- **Chaque sous-agent a sa fenêtre.** Une question composite se disperse entre des travailleurs qui
  ne se lisent pas — d'où la règle de scission, qui n'est pas une préférence de style.

⚠️ **Modèles.** La seule attribution jamais publiée est **Opus 4 en lead, Sonnet 4 en sous-agents**
(juin 2025). Aucune page officielle ne dit quels modèles animent Research aujourd'hui : toute
mention d'un modèle courant en orchestrateur relève de l'inférence tierce et se marque
`[INCERTAIN]`.

## Ce que l'interface ne propose pas

- Disponible sur les plans **payants** (Pro, Max, Team, Enterprise), sur web, desktop et mobile.
- **Prérequis officiel** : « You must have web search turned on for Research to function. »
- Activation courante : bouton « + » en bas à gauche, puis « Research » ; un indicateur bleu
  apparaît. L'UI a bougé entre mars et juin 2026 — une capture d'écran datée ne fait pas foi.
- Forçage possible par la formule « Claude, please use the Research tool to… ».
- ⚠️ **Pas de sélecteur Standard / Advanced**, pas de mode, pas de durée annoncée. La terminologie
  « Advanced Research » ne subsiste que dans l'annonce Integrations du 1ᵉʳ mai 2025, non révisée.
- ⚠️ **Aucune page Anthropic ne documente un sélecteur de modèle ou d'effort à l'intérieur de
  Research** — l'absence n'est pas documentée non plus : `[INCERTAIN]`.

D'où la règle de calibrage du squelette : le calibre se pilote par la portée du prompt, et un prompt
ne promet jamais une durée ni un nombre de sources.

## Le raisonnement, et ce qui ne se prompte plus

Faits d'API, stables et vérifiables :

- le raisonnement étendu manuel (`thinking.type: "enabled"` + `budget_tokens`) est **déprécié sur
  4.6** et **rejeté par une erreur 400 sur 4.7 et au-delà**, Sonnet 5 inclus ;
- l'**adaptive thinking** est le mode recommandé, et le seul disponible sur Fable 5 et Mythos 5 ;
- le paramètre `effort` (low / medium / high, plus `xhigh` depuis Opus 4.7) remplace le budget de
  tokens ; défaut `high` sur Opus 5 et Opus 4.8 ;
- le prefill sur le dernier tour assistant est obsolète depuis 4.6 (erreur 400).

Ce qu'il faut en retenir côté Desktop, où aucun de ces paramètres n'est accessible : **les
déclencheurs verbaux sont redondants**, la stratégie ne l'est pas. Formulation d'Anthropic pour un
prompt de recherche complexe, verbatim : « develop several competing hypotheses… track your
confidence levels… regularly self-critique… update a hypothesis tree ».

## Coût, quotas, fenêtre

- **Structure des quotas** : fenêtre glissante de 5 heures + plafonds hebdomadaires (introduits le
  28 août 2025). Sur Max, une limite hebdomadaire tous modèles et une seconde spécifique à Sonnet.
- ⚠️ **Anthropic ne publie aucun nombre fixe de messages.** Tout « ~45 messages / 5 h » est une
  estimation tierce et ne se cite pas comme une limite.
- **6 mai 2026** : doublement permanent des limites de la fenêtre de 5 heures (Pro, Max, Team,
  Enterprise) et **suppression de la réduction horaire de pointe**. La règle « limites plus strictes
  aux heures de pointe » n'existe plus — elle circule encore.
- **Fenêtre de contexte en chat** : **1M tokens sur tous les plans payants** pour Opus 5 et Sonnet 5 ;
  500K pour Opus 4.8 / 4.7 / 4.6 et Sonnet 4.6 ; 200K sinon. L'opt-in Pro ne concerne plus que
  Claude Code.
- **Research consomme les mêmes limites, plus vite.** Des retours utilisateurs de mai 2026
  (*secondaires*) évoquent 50 à 80 % du quota Pro pour une seule session — ordre de grandeur, jamais
  une mesure.

Le surcoût structurel — environ **15× les tokens d'un chat** (*éval interne Anthropic, juin 2025*) —
est un critère de **routage** avant d'être un critère de composition : voir `routage-limites.md`.

## Ce qui est citable, et ce qui ne l'est pas

| Chiffre | Statut |
|---|---|
| **+90,2 %** multi-agents (Opus 4 lead + Sonnet 4) vs Opus 4 seul | Citable **avec** sa date (juin 2025), sa nature (éval interne Anthropic) et sa portée : gain mesuré sur une éval **breadth-first**, pas un gain général |
| **~15×** de tokens vs un chat | Citable, chiffre éditeur, juin 2025 |
| Variance BrowseComp : tokens ≈ 80 %, appels d'outils ≈ 10 %, choix du modèle ≈ 5 % | Citable, éval interne, juin 2025 |
| « Jusqu'à 45 minutes » | **Obsolète.** Retiré de l'article support courant, qui dit seulement « thorough answers in minutes ». Subsiste dans l'annonce de mai 2025 |
| « ~700 sources », « 709 sources en 20 minutes » | **Non étayé.** Aucune source primaire. Seule formulation officielle : « des centaines de sources internes et externes » |
| « ~261 sources en ~6 min » | **Marketing** (AIMultiple), non revu par les pairs — et l'auteur précise lui-même que le nombre de sources ≠ la qualité |
| « ~40 connecteurs natifs » | **Obsolète.** Voir plus bas |

## Fiabilité : le trou est le résultat

⚠️ **Le « taux d'hallucination ~10 % pour Opus 4 » est non étayé.** Aucune source primaire Anthropic.
Origine probable : confusion avec un chiffre d'OpenAI Deep Research, ou lecture erronée de scores
tiers. **Il ne se cite plus.**

**Anthropic ne publie aucun taux d'hallucination agrégé.** Les system cards mesurent l'honnêteté par
des protocoles distincts : factualité sur quatre tests séparés, avec comptage distinct des réponses
correctes, incorrectes et des **abstentions** ; résistance aux fausses prémisses ; MASK ;
hallucinations d'entrée.

| Métrique sourçable | Valeur | Ce qu'elle mesure |
|---|---|---|
| MASK lying rate (system cards) | Sonnet 5 : 3,1 % · Mythos Preview : 4,4 % · Opus 4.8 : 6,1 % · Mythos 5 : 8,6 % · Sonnet 4.6 : 13,3 % | La propension au mensonge **sous pression**, pas la factualité |
| Résistance aux fausses prémisses (system card Opus 4.7) | Opus 4.7 : 77,2 % · Mythos : 80 % | Le refus d'accepter une prémisse fausse |
| System card Opus 5 | « more accurate than Opus 4.8 but hallucinates slightly more claims of a factual nature » | Plus exact globalement, mais cède davantage à l'utilisateur qui insiste |

⚠️ **Ces métriques portent sur l'honnêteté paramétrique — sans web.** Elles ne disent **rien** de la
fiabilité des citations produites en mode recherche, avec sa passe de vérification.

**Aucun taux mesuré et indépendant de fiabilité de citation propre à Claude Research n'existe.**
Toute affirmation quantitative sur ce point est non établie, et l'écrire est un résultat. Ce qui est
documenté relève d'un autre régime : les 55 % de citations fabriquées par GPT-3.5 contre 18 % pour
GPT-4 (Walters & Wilder, *Scientific Reports* 13:14045, 2023, sur 636 citations) mesurent la
**mémoire paramétrique, hors web** ; le *citation laundering* — une source inexistante qui gagne en
légitimité en traversant des documents réels que personne ne vérifie — est un **risque de méthode**
applicable à tout flux assisté par IA, pas un défaut mesuré de Claude.

C'est la raison de l'intake critique : le trou ne se comble pas par un chiffre, il se compense par
une relecture.

## Connecteurs

- Research n'invoque que les **connecteurs distants**, jamais un serveur MCP local. Pendant une
  session, les outils des connecteurs sont invoqués **automatiquement, sans approbation
  supplémentaire** — un prompt composé pour une session à connecteurs actifs le sait.
- ⚠️ **Le compte de connecteurs n'a pas de valeur officielle.** Formulation correcte : plusieurs
  centaines, catalogue unifié, sans compteur publié. Instantanés tiers : 369 au 19 juin 2026 ;
  jusqu'à 439 à l'été 2026, sur un annuaire qui croît chaque semaine. Aucun total ne se cite sans sa
  date **et** sa source.
- **Trois niveaux de confiance** : **vérifiés** (revus par Anthropic), **communautaires** (contrôles
  automatisés seulement), **custom** (serveurs distants non vérifiés ajoutés par l'utilisateur).
- ⚠️ **Aucun conflit fonctionnel documenté** entre web search et connecteurs actifs simultanément.
  L'affirmation inverse circule et est fausse ; le seul enjeu réel est la **surcharge de contexte**,
  qu'Anthropic traite en recommandant de désactiver temporairement les outils non critiques.
- Les connecteurs académiques et financiers donnent accès à du contenu authentifié **selon les
  droits existants** : c'est un accès autorisé, jamais un contournement de paywall.

## Livrables

Les sorties de Research sont des **rapports textuels cités**. La conversion en fichier passe par
**File Creation** dans la même conversation — Excel, PowerPoint, Word, PDF, **30 Mo par fichier**, à
activer dans les réglages.

Le format se pilote **uniquement par le prompt**, aucun sélecteur d'interface : rapport long
structuré, synthèse courte, tableau comparatif, format académique, prose avec données intégrées,
ADR, Executive Summary + Deep Dive. Markdown complet supporté. C'est ce que le bloc `<output>` du
squelette exploite.
