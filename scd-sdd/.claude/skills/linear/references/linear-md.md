# Référence — Contrat de `docs/linear.md`

**Deux points de chargement** : `/scd-sdd:linear-setup` — **intégralement**, c'est elle qui écrit le
fichier — et `/scd-sdd:linear-review` — le seul bloc `<contrat>`.

⚠ **`/scd-sdd:linear` ne charge pas cette référence, et c'est délibéré** — ne pas « rétablir » ce
point de chargement. Le push **lit `docs/linear.md` lui-même**, en entier, à son étape 1, qui nomme
les rubriques qu'il en extrait : un fichier présent sur le disque fait foi sur son propre contenu, et
en charger la description par-dessus mettrait deux sources dans la même fenêtre (§D35). La seconde
serait même la moins fiable des deux le jour où un projet porte un fichier écrit avant la dernière
rubrique — cas prévu, et traité par le push comme *rubrique absente ou `aucune`*, sans rien avoir à
lire ici. Ce que le bloc `<contrat>` ajoute au fichier — le refus d'écraser, l'édition manuelle, la
rétro-compatibilité, ce qui n'y entre jamais — lie l'**écrivain** ; le push n'écrit rien.

Le `SKILL.md` porte le **pourquoi** du fichier — l'opt-in est un fichier, l'état dérivé du chemin
(charte §5) ; cette référence porte son **contenu exact** : ce que le setup écrit, ce que la revue
relit.

<contrat>

## Les sept rubriques — et pas une de plus

Écrit **une fois** par `/scd-sdd:linear-setup`, qui **refuse d'écraser** un fichier existant (garde
anti-écrasement, modèle de `livraison`, §D29). La mise à jour est une **édition manuelle**.

1. la **clé de l'équipe** (`ENG`) et son nom ;
2. le **nom** de la variable d'environnement qui porte la clé d'API — **jamais sa valeur**
   (le dépôt porte le nom, l'environnement porte le secret) ;
3. la table des **statuts** : type visé → état réel de l'équipe ;
4. le **nom du label** de chantier ;
5. la convention de **nommage** des titres ;
6. la table de **propriété des champs** ;
7. l'**initiative** — rubrique **optionnelle** : `<nom>` ou `aucune`. Le nom est une
   **configuration** (précédent exact de la clé d'équipe, §D31), proposé au setup depuis le nom du
   repo ou `docs/produit.md`, confirmé par l'humain, **jamais re-dérivé**.

**Rétro-compatibilité.** Un fichier à **six rubriques** (1.10.0) reste intégralement valide :
rubrique 7 **absente ou `aucune`** → aucune écriture d'initiative, comportement sans initiative
strictement inchangé — l'opt-in dans l'opt-in. L'ajout de la rubrique est l'**édition manuelle**,
jamais un rejeu du setup, que le garde refuse ; son message de refus en donne la forme.

Ce que le fichier ne porte **jamais** : un identifiant ou une URL Linear, la valeur d'une clé, une
liste d'issues, un mapping. La clé d'équipe et le nom d'initiative sont des **choix de
configuration**, pas des identifiants techniques : ce sont les deux seuls mots venus de Linear que
le dépôt porte (§D30, §D31).

Le fichier est **fermé** — aucun run ne l'allonge. Il n'entre dans **aucune** table de dérivation,
et **aucun** `status` ne le réclame.

</contrat>

<template>

## Template — copy-paste

À remplir par `linear-setup` : états et label **par leur nom** (lus par API, jamais devinés), date
du jour, rubrique 7 selon la réponse de l'humain.

```markdown
# Miroir Linear — configuration

Écrit le AAAA-MM-JJ par /scd-sdd:linear-setup. Mise à jour : édition manuelle — la commande ne se
rejoue pas.

## Équipe

ENG — Engineering

## Clé d'API

Variable d'environnement : LINEAR_API_KEY (le nom seul — la valeur ne s'écrit nulle part)

## Statuts — type visé → état réel de l'équipe

| Type | État |
|---|---|
| backlog | Backlog |
| started | In Progress |
| completed | Done |

## Label de chantier

chantier

## Nommage des titres

| Objet | Titre |
|---|---|
| projet d'une feature | NNN-slug |
| issue d'un lot | Rn — <intitulé du lot> |
| issue de chantier | AAAA-MM-JJ-slug — <titre de la fiche> |

Le préfixe-clé appartient au miroir ; tout le reste du titre appartient à l'humain.

## Propriété des champs

| Champ | Propriétaire |
|---|---|
| préfixe-clé des titres | miroir |
| description d'une issue de lot (checklist Tn + marqueur) | miroir — reconstruite à chaque push |
| workflow state | miroir — n'avance que vers un type supérieur, ne rétrograde jamais |
| relations « dépend de » | miroir |
| label chantier | miroir — posé au push, créé au seul setup |
| rattachement projet ↔ initiative | miroir — rattache au push, ne crée jamais l'initiative |
| priorité, estimation, assigné, cycle, autres labels, commentaires | humain — jamais touchés |
| suffixe des titres, description d'un projet, description de l'initiative | humain — jamais touchés |

## Initiative

aucune
```

</template>
