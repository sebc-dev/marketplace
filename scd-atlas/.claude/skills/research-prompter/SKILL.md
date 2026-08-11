---
name: research-prompter
description: |
  Compose des prompts pour Claude Research (Desktop), la recherche approfondie
  multi-sources : évaluation de portée et découpage si la demande est composite,
  squelette à sept blocs, calibrage focalisé / standard / étendu, ancrage par
  citations verbatim, niveaux de preuve et étiquetage des sources (officiel ·
  préprint · benchmark d'éditeur · marketing). Générique — tout sujet —, et
  spécialisable par packs de domaines chargés seulement si le domaine est retenu.
  Se charge pendant /scd-atlas:prompt et /scd-atlas:prompts, et depuis une
  campagne dès qu'un sujet est routé Research. Porte uniquement la composition :
  il ne lance aucune recherche (aucune session ne peut lancer Research), il
  n'orchestre aucune campagne (skill campaign) et il ne collecte rien lui-même.
---

# Composer un prompt Claude Research

## Les quatre règles qui décident du reste

1. **Une session Research traite une seule question centrale**, avec ses angles connexes. Évaluer la
   portée passe avant toute collecte de détail : une demande composite se découpe, et le découpage
   se propose à l'humain plutôt qu'il ne s'impose.
2. **Le prompt final fait 150 à 350 mots.** Le meilleur prompt n'est ni le plus long ni le plus
   complexe : c'est celui qui atteint son but de façon fiable avec le minimum de structure
   nécessaire.
3. **Le raisonnement est déjà actif.** Ce qui reste utile, ce sont les consignes de **stratégie de
   recherche** — commencer large puis resserrer, poser des hypothèses concurrentes, suivre sa
   confiance, extraire les citations avant de synthétiser. Les injonctions à réfléchir sont au mieux
   redondantes.
4. **Un prompt ne se compose pas sans ses URL.** Research ne construit aucune URL : il n'atteint que
   celles qu'on lui donne ou qu'il obtient d'une recherche. Une URL exacte, canonique et statique
   descend **dans** le prompt ; une URL devinée n'existe pas.

## Le processus, en trois temps

### Temps 1 — la portée

Avant tout le reste : la demande est-elle atomique ou composite ? Les critères de scission et le
modèle de réponse en cas de découpage vivent dans `references/squelette.md`. Le calibre — focalisé,
standard, étendu — se choisit ici, et il se pilote par la portée du prompt : il n'existe aucun
sélecteur de mode ni de durée dans l'interface Research.

Une question qui n'aurait pas dû partir en Research se détecte aussi ici. Charger
`references/routage-limites.md` et **router avant de composer** : ce qui exige de lire du code
source, un diff, un historique, ou une documentation rendue en JavaScript revient vide ou
incomplet, et se collecte en session Claude Code.

### Temps 2 — les cinq informations

**Qui** (rôle, secteur, expertise sur le sujet) · **pourquoi** (la décision que la recherche sert, et
sous quel délai) · **contraintes** (budget, stack, géographie, période, sources imposées ou exclues)
· **format** (rapport, synthèse, tableau, ADR, document de référence) · **ce qu'il sait déjà**, pour
que la recherche ne redécouvre pas l'évidence.

Une réponse partielle n'arrête pas la composition : composer quand même, et **nommer les hypothèses
comblées** dans le rendu à l'humain.

### Temps 3 — la composition

Charger `references/squelette.md` et assembler. Si le sujet relève d'un domaine outillé, charger
**en plus** son pack — voir la table des références. La checklist de livraison est en fin de
squelette : elle se passe avant de rendre, pas après.

## L'ancrage — ce qui ne bouge pas

Ces six points valent quel que soit le sujet, le domaine ou le calibre. Ils sont la raison pour
laquelle un rapport revenu est exploitable.

### 1. Citations verbatim

Extraire d'abord les passages **mot pour mot** qui portent la réponse, puis fonder la réponse dessus,
et **attribuer par affirmation** — une source par *claim*, pas une bibliographie en fin de document
que rien ne relie au texte. C'est la technique de fiabilisation la mieux étayée par la documentation
officielle, et celle que Research applique en interne avec un agent de citation dédié. Elle ne se
retire d'aucun prompt à enjeu factuel.

Corollaire : **une affirmation qu'aucune citation ne porte est une affirmation du modèle.** Elle
s'écrit comme telle, ou elle ne s'écrit pas.

### 2. L'incertitude est permise, et l'absence de donnée est un résultat

Donner explicitement la permission de dire « je ne sais pas », et demander le marqueur `[INCERTAIN]`
là où les données manquent, divergent ou ne sont pas vérifiables. « Aucun taux mesuré et indépendant
n'a été trouvé » est un résultat de recherche — c'est même le plus utile, parce que c'est celui
qu'une recherche paresseuse remplace par un chiffre plausible.

### 3. Hypothèses concurrentes

Quand les sources divergent, demander H1, H2, ce qui les départagerait, et la confiance de chacune.
Une divergence entre deux sources réputées est une information sur le sujet, pas un bruit à lisser :
le prompt demande de la **signaler**, jamais de trancher en silence.

La confiance annoncée est un signal de **classement**, jamais une probabilité — la confiance
verbalisée d'un modèle est systématiquement sur-confiante. Elle sert à ordonner, pas à calculer.

### 4. Niveaux de preuve et étiquettes de source

Deux axes, tous deux demandés dans le bloc `<rules>` — ils ne se remplacent pas l'un l'autre.

| Niveau de preuve | Ce que ça veut dire |
|---|---|
| **mesuré** | protocole public, chiffres reproductibles ou au moins vérifiables |
| **rapporté** | affirmé par une source identifiée, sans protocole publié |
| **anecdotique** | témoignage, expérience non contrôlée, retour de praticien |
| **non étayé** | circule sans source primaire trouvable — à démentir explicitement |

| Étiquette de source | Ce qu'elle change |
|---|---|
| **officiel** | doc ou publication de l'éditeur — fait autorité sur son produit, pas sur ses concurrents |
| **préprint indépendant** | non revu par les pairs ; le protocole est lisible, la conclusion n'est pas validée |
| **benchmark d'éditeur** | auto-favorisant par construction, parfois entraîné sur ses propres tâches |
| **commercial / marketing** | comparatif de vendeur, benchmark maison — jamais une source primaire |

Un chiffre officiel reste souvent une **évaluation interne non reproduite par un tiers** : « établi »
qualifie alors le fait qu'il a été *publié*, pas qu'il a été *répliqué*. Le prompt demande d'écrire
la différence.

### 5. Qualité de source

Sources primaires d'abord — documentation officielle versionnée, article académique, dépôt,
changelog, texte de loi. Un chiffre trouvé sur trois pages qui se citent l'une l'autre n'est pas
recoupé : c'est **une seule** source, et le prompt demande de remonter au document d'origine.

### 6. XML structurel, jamais décoratif

Les balises délimitent des blocs hétérogènes — consignes, contexte, sources, format attendu. Elles
n'ajoutent rien à un prompt court et homogène, où elles ne font que du bruit. Le squelette à sept
blocs les emploie pour cette raison, pas par style.

## Ce qui rend un prompt moins fiable

Ces pratiques ont été calibrées pour des modèles antérieurs et se retournent aujourd'hui. Le détail
et les motifs sont dans `references/squelette.md`, section anti-patterns ; l'essentiel tient en une
ligne : **une consigne énoncée une fois, en prose claire, suffit.** Le langage impératif massif
provoque du sur-déclenchement d'outils et de la sur-vérification, et la répétition en fin de prompt
ne sert plus rien.

## Packs de domaines

Un pack apporte les heuristiques de sourçage propres à un domaine : quelles familles de sources font
autorité selon le type de question, quels pièges le domaine porte et par quoi les parer, quels angles
ajouter ou retrancher. Il se charge **seulement** quand le sujet relève du domaine, et il s'ajoute au
squelette générique sans le remplacer.

Un domaine non couvert n'empêche rien : le squelette générique compose un prompt correct sans pack.

## Références

| Fichier | Quand le charger |
|---|---|
| `references/squelette.md` | À la composition, toujours : les sept blocs, les critères de scission, les calibres, les quatre templates par cas d'usage, les anti-patterns, la checklist de livraison. |
| `references/routage-limites.md` | Au temps 1, avant de composer : ce que Research n'atteint pas, et ce qui doit être collecté en session Claude Code plutôt que recherché. Chargé aussi par `campaign` au routage d'une carte. |
| `references/contexte-research.md` | À la composition, pour ce qui est **daté** — architecture, quotas, interface, fiabilité mesurable. Porte sa date en tête et un bloc de péremption : à revérifier avant de s'y fier, et aucun de ses chiffres ne descend dans un livrable. |
| `references/domaines/tech-dev.md` | Quand le sujet porte sur une technologie, un langage, un framework, une bibliothèque ou un écosystème logiciel. |
