# Référence — distiller les rapports en skill

Chargée par `campaign` à la **distillation** (`/scd-atlas:distill`). Elle porte la manière d'écrire le
skill cible et ses références à partir de ce que l'intake a retenu. Comment le plugin produit
s'appaire à la documentation vivante de sa techno est dans `appairage-doc.md` ; ce qui est vrai et ce
qui ne l'est pas a été tranché à l'intake et ne se rejuge pas ici.

- [Ce qu'on distille](#ce-quon-distille)
- [Où chaque chose se pose](#où-chaque-chose-se-pose)
- [La description est le déclencheur](#la-description-est-le-déclencheur)
- [Les leviers d'écriture](#les-leviers-décriture)
- [Les classes de preuve survivent au passage](#les-classes-de-preuve-survivent-au-passage)
- [Mettre à jour un skill qui existe](#mettre-à-jour-un-skill-qui-existe)
- [Les seuils, avec leur classe](#les-seuils-avec-leur-classe)
- [Ce que la distillation n'écrit pas](#ce-que-la-distillation-nécrit-pas)

## Ce qu'on distille

**Un skill n'est pas le résumé d'un rapport.** Le rapport répond à une question de recherche ; le
skill répond à ce qu'un agent doit faire ou éviter quand il travaille dans la techno. Le second ne
se déduit pas du premier par compression : il se choisit.

Ce qui mérite de descendre est ce qui **n'est pas récupérable en ligne tel quel** :

- l'**invariant** — ce qui est vrai quoi qu'il arrive dans cette techno, et qu'un agent enfreint par
  défaut ;
- le **piège** — le comportement qui a l'air correct et ne l'est pas, avec le symptôme observable qui
  le trahit ;
- l'**écart entre majeures** — ce qui a changé, dans quel sens, et ce que l'ancien pattern produit
  aujourd'hui. Aucun mécanisme de documentation ne le donne : c'est la valeur propre de la
  distillation ;
- le **choix par défaut** avec son motif, quand la techno en offre plusieurs et que l'agent en prend
  un au hasard.

Ce qui n'a pas à descendre : ce que le modèle sait déjà, ce qu'une signature d'API dira mieux et plus
frais que nous, et **ce que l'environnement du projet dit lui-même** — un script de manifeste, une
option de configuration lisible sur place. Un skill qui recopie l'environnement est un cache : il
n'est justifié que quand la consultation coûte cher, et il périme en silence.

## Où chaque chose se pose

Trois rangs, du plus immédiat au plus lointain. Le choix du rang est **la** décision de la
distillation.

| Rang | Ce qui y vit | Coût |
|---|---|---|
| **corps du `SKILL.md`, en tête** | ce qu'il faut avoir lu pour ne pas se tromper — les règles décisives, dans l'ordre où elles décident | chargé à chaque invocation |
| **corps du `SKILL.md`, plus bas** | la référence consultée à la demande, qui a sa place dans le fichier : un jeu de règles plat, une table de décision | chargé à chaque invocation |
| **fichier de `references/`** | ce qu'une branche seulement atteint, ou ce qui est volumineux, ou ce qui est daté | chargé seulement quand son pointeur porte |

La règle de partage : **ce dont toutes les branches ont besoin reste dans le fichier ; ce qu'une
seule branche atteint descend derrière un pointeur.** Trop peu descendre gonfle le haut ; trop
descendre cache ce qui sert toujours.

Trois contraintes de mécanique qui ne se négocient pas :

- **les instructions décisives en haut du `SKILL.md`** — après compaction, un corps de skill est
  réinjecté plafonné à **5 000 tokens, début conservé** (officiel). Une fin de fichier est du texte
  qu'on perd en session longue ;
- **les références à un seul niveau depuis le `SKILL.md`** — une référence qui en pointe une autre se
  lit en morceaux. Un sous-répertoire est un chemin, pas un second niveau, tant que le `SKILL.md`
  pointe le fichier **directement** ;
- **une table des matières en tête de toute référence de plus de 100 lignes**, et un point de
  chargement déclaré : *quand* on la charge, pas seulement ce qu'elle contient.

Chaque référence dit en une phrase ce qu'elle porte **et** ce qu'elle ne porte pas — c'est ce qui
empêche deux fichiers de dire la même chose à moitié.

## La description est le déclencheur

Le routage se joue sur le couple `name` + `description` chargé au démarrage : **le corps n'est jamais
lu au moment de la décision.** Une description est donc de l'ingénierie de déclenchement, pas de la
documentation.

- **troisième personne**, cas d'usage clé **en tête** — les premiers mots font le travail ;
- **ce que le skill fait ET quand l'employer**, avec les termes concrets qu'un utilisateur emploierait
  — pas les termes internes du plugin ;
- **un déclencheur par branche.** Deux synonymes qui nomment la même branche sont une branche écrite
  deux fois : les fusionner libère de la place pour une vraie branche ;
- **la frontière se dit positivement** — *porte uniquement X · le reste appartient à Y*. Une
  prohibition (« ne pas utiliser pour… ») met le comportement interdit en contexte et le rend plus
  disponible, pas moins ; et l'expérience du dépôt est qu'un correctif de déclenchement passe par ce
  que la description **revendique**, jamais par ce qu'elle interdit ;
- **entre guillemets** si elle contient `:`, `#` ou `[` — un YAML cassé se comporte exactement comme
  une description faible : `/skill` marche, l'auto-déclenchement jamais.

Une description peut être parfaite et **muette** : le listing des descriptions a un budget, et au
dépassement Claude Code tronque puis **supprime** celles des skills les moins invoquées — un skill
neuf est le premier à disparaître. Avant de réécrire une description qui ne déclenche pas,
**diagnostiquer** (`/doctor`, `/context`, `--debug`) : réécrire ce qui n'a jamais été livré ne change
rien.

## Les leviers d'écriture

- **Le mot porteur.** Un concept compact que le modèle possède déjà (*invariant*, *piège*, *régression*)
  ancre une région entière de comportement en un token, à condition d'être répété **comme mot** et
  jamais redéfini comme phrase. Un mot inventé ne recrute rien : il faut payer sa définition. Cherche
  activement les passages qui se contractent en un mot — une triade épelée trois fois en est un.
- **Prompter le positif.** Écrire le comportement visé, pour que l'interdit ne soit pas prononcé. Une
  interdiction ne se justifie que comme garde-fou dur, et alors elle s'accompagne de sa cible
  positive.
- **Une seule source de vérité par affirmation.** La même règle à deux endroits coûte deux fois, se
  corrige à moitié, et se donne un rang qu'elle n'a pas. C'est l'inverse exact du mot porteur, qui
  répète un token et jamais un sens.
- **Le critère de fin.** Une étape écrite pour un agent se termine sur une condition qu'il peut
  constater. Une borne floue (« la doctrine est comprise ») invite à finir avant d'avoir fini ; une
  borne exigeante (« chaque invariant a son symptôme observable ») force le travail.
- **Élaguer.** Passer chaque ligne au test : **change-t-elle quelque chose par rapport à ce que le
  modèle ferait sans elle ?** Si non, supprimer la phrase entière plutôt que la raccourcir. Un skill
  trop long dilue l'attention même quand chaque ligne est juste.

## Les classes de preuve survivent au passage

C'est la règle qui distingue une distillation d'une recopie : **ce qui était incertain dans le
rapport ne devient pas un fait dans le skill.**

- un chiffre **non recoupé, promotionnel ou issu de rétro-ingénierie** ne descend pas — pas même
  étiqueté, s'il n'a aucun usage opératoire. Un seuil opérationnel s'écrit souvent mieux comme une
  **question** (*le contenu doit-il être exact ?*) que comme un nombre ;
- un fait **daté** — un quota, un plafond tarifaire, une position d'écosystème — descend avec sa date,
  et de préférence dans une référence à part, dont la péremption est déclarée en tête ;
- un **désaccord entre sources réputées** descend comme désaccord ; le trancher en silence dans un
  skill produit une assurance que rien ne soutient ;
- une **limite irréductible** relevée à l'intake descend là où quelqu'un irait la chercher. Un trou
  connu qui n'est écrit nulle part se comble par une invention au premier usage.

Et deux choses que le skill produit doit porter, quel que soit l'appairage retenu : **les URL
canoniques épinglées** (aucun agent ne va chercher un index qu'on ne lui nomme pas) et **la version
visée**, écrite, avec la manière de la lire dans le manifeste du projet.

## Mettre à jour un skill qui existe

Le mode *mise à jour* de la campagne a différencié les sujets ; la distillation en tire quatre gestes
distincts, et ils ne se confondent pas :

| Catégorie | Le geste |
|---|---|
| **inchangé** | ne pas toucher. Réécrire ce qu'on n'a pas re-sourcé est le moyen le plus rapide de perdre une vérité au profit d'une reformulation |
| **touché** | remplacer le passage concerné, et **seulement** lui, par ce que le nouveau rapport établit |
| **apparu** | poser le contenu au rang qui lui revient — et se demander si sa branche mérite une référence à elle, ou une ligne dans une référence existante |
| **disparu** | retirer, explicitement. Ce qui décrit une version morte se supprime ; ce qui décrit un écart entre majeures **reste**, parce que c'est justement ce qui a de la valeur |

Après une mise à jour, la description est à relire même si on n'y a pas touché : un skill qui a gagné
une branche et pas un déclencheur ne se déclenchera pas dessus.

## Les seuils, avec leur classe

| Seuil | Valeur | Classe |
|---|---|---|
| Corps d'un `SKILL.md` | **< 500 lignes** | officiel (bonnes pratiques) |
| Corps d'un `SKILL.md` | **< ~5 000 tokens** | officiel (standard ouvert) |
| Réinjection après compaction | **5 000 tokens par skill, 25 000 au total, début conservé** | officiel |
| Table des matières | au-delà de **100 lignes** de référence | officiel |
| « au-delà de 500 lignes, le skill n'est plus chargé » | — | **faux / introuvable** : ne pas s'en servir comme argument |
| Taux d'auto-déclenchement d'une description passive vs directive | ~77 % vs ~100 % | **communauté** — un expérimentateur, un modèle. Directionnel, jamais une spécification |

## Ce que la distillation n'écrit pas

- **Rien dans `scd-atlas`.** Elle écrit dans le plugin cible, et nulle part ailleurs.
- **Rien dans les rapports.** Ils restent en l'état, y compris ce qu'ils disent de faux : c'est ce
  qu'une campagne ultérieure lira pour se différencier.
- **Aucune entrée de publication** — ni `marketplace.json`, ni `publish.json`, ni `/publish`.
- **Aucun fait qu'aucun rapport ni aucune collecte ne porte.** Un manque se déclare comme manque ; il
  ne se comble pas à l'écriture.
