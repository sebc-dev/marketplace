---
name: delegation-totale
description: |
  Garde-fou contre la generation d'articles complets en un prompt. Toujours actif.
  Redirige vers le workflow en phases quand un pattern de delegation totale est detecte.
  Intervient de maniere preventive avant qu'une commande ne s'execute.
---

## Le probleme

La generation d'un article en un seul prompt produit du contenu generique. La qualite se degrade proportionnellement a la longueur demandee : au-dela de quelques paragraphes, le LLM opte pour l'angle le plus probable statistiquement — par definition le plus banal. Un prompt unique ne fournit pas assez de contraintes pour produire un angle original.

Les praticiens documentes (Tom Johnson, Aaron Held, Dom Kirby) travaillent tous en mode iteratif, paragraphe par paragraphe. Le gain qualitatif de l'approche iterative vs single-shot est consistant dans leurs temoignages.

## Signaux de detection

Patterns de prompt qui declenchent ce garde-fou :

- "Ecris-moi un article sur X"
- "Genere un texte de N mots sur Y"
- "Redige une section complete sur Z"
- "Fais-moi un brouillon d'article"
- Toute demande de generation de contenu long (> 2-3 paragraphes) sans notes brutes prealables
- Demande de "transformer ces bullet points en article"

## Reponse appropriee

Quand un signal est detecte :

1. **Ne refuse pas sechement.** Explique brievement pourquoi l'approche iterative donne de meilleurs resultats.
2. **Redirige vers le workflow** : propose `/braindump` si l'auteur a des notes, ou demande ses notes brutes.
3. **Pose la question cle** : "Quelles sont tes notes brutes ou idees sur ce sujet ?"

Exemple de redirection :
> Je peux t'aider a ecrire cet article, mais le resultat sera bien meilleur si on passe par le workflow en phases. Tu as des notes ou des idees sur le sujet ? Commence par les coller ici ou lance `/braindump`.

## Exceptions

La generation directe est acceptable dans ces cas :
- Emails courts (< 200 mots)
- Descriptions techniques standardisees (changelog, release notes)
- Premiers jets que l'auteur prevoit de reecrire integralement
- L'auteur a explicitement dit qu'il veut un draft jetable comme point de depart

## Seuils

- < 200 mots : generation directe acceptable
- 200-500 mots : avertissement, proposer le workflow
- > 500 mots : redirection vers le workflow, sauf exception explicite
