---
name: fausse-profondeur
description: |
  Detection de figures rhetoriques mecaniques simulant l'eloquence sans apporter
  de sens. Triades percutantes, profondeur non meritee, questions rhetoriques vides.
  Activer pendant /review et /polish. Contribue a writing-voice pour la liste
  des patterns interdits.
---

## Triades percutantes

### Definition
Trois adjectifs, noms ou verbes en rafale qui creent un effet rythmique sans apporter de nuance reelle. Les LLM surproduisent ce pattern car la "rule of three" est un pattern rhetorique humain fort — les modeles l'ont appris et le reproduisent mecaniquement.

### Exemples mecaniques (a signaler)
- "Rapide, efficace, fiable."
- "Innovant, flexible et evolutif."
- "Clarte, precision et elegance."
- "Fast, scalable, and reliable."

### Exemples legitimes (a ne PAS signaler)
- "Il a hesite, recule, puis finalement accepte." → progression narrative reelle
- "Le systeme doit etre disponible, coherent et tolerant aux partitions." → theoreme CAP, chaque terme a un sens technique precis

### Critere de distinction
Chaque element de la triade apporte-t-il une information **distincte et necessaire** ? Si on retire un element, perd-on du sens ? Si non, c'est mecanique.

## Profondeur non meritee

### Definition
Phrases dramatiques qui creent une attente jamais satisfaite. Elles promettent une revelation profonde mais sont suivies d'une observation banale.

### Patterns a detecter
- "Quelque chose a change."
- "Mais voici le point crucial."
- "Et c'est la que tout bascule."
- "La verite, c'est que..."
- "Ce que personne ne dit..."
- "Le vrai probleme est ailleurs."

### Critere de detection
La phrase qui suit la phrase dramatique est-elle a la hauteur de la promesse ? Si la "revelation" est une observation que tout le monde connait deja, c'est de la fausse profondeur.

## Questions rhetoriques vides

### Definition
Le LLM pose une question, y repond immediatement, et la reponse n'apporte rien de nouveau. C'est un pattern de remplissage qui donne l'illusion de progression argumentative.

### Patterns a detecter
- "La solution ? Plus simple qu'on ne le pense."
- "Pourquoi est-ce important ? Parce que..."
- "Que retenir ? Trois choses essentielles."
- "Le resultat ? [reponse evidente]"

### Questions rhetoriques legitimes (a ne PAS signaler)
- Questions qui invitent reellement a la reflexion sans reponse immediate
- Questions qui introduisent un retournement inattendu
- Questions qui structurent un raisonnement complexe

## Autres patterns mecaniques

### Reformulations sans valeur
"En d'autres termes..." suivi d'une paraphrase qui n'ajoute rien. Si la reformulation dit exactement la meme chose, elle est inutile.

### Faux parallelismes
Structures paralleles forcees qui creent un rythme artificiel sans enrichir le propos.

### Conclusions circulaires
La conclusion repete l'introduction en changeant quelques mots. Aucune progression intellectuelle entre le debut et la fin.

### Formules de transition creuses
"Cela nous amene a un point important...", "Il est essentiel de comprendre que...", "Examinons maintenant..." — du remplissage qui n'apporte rien.

## Grille de detection pour /review

Pour chaque paragraphe, verifier :

1. [ ] Contient-il une triade percutante ? → Si oui, chaque element est-il distinct et necessaire ?
2. [ ] Contient-il une phrase dramatique ? → Si oui, la suite est-elle a la hauteur ?
3. [ ] Contient-il une question rhetorique ? → Si oui, la reponse est-elle surprenante ou evidente ?
4. [ ] Contient-il une reformulation ? → Si oui, ajoute-t-elle du sens ?
5. [ ] La conclusion repete-t-elle l'introduction ? → Si oui, signaler

## Quand c'est legitime

Ces figures sont legitimement utilisees quand :
- L'auteur les emploie consciemment pour un effet stylistique precis
- La triade contient trois concepts reellement distincts
- La phrase dramatique est suivie d'une veritable revelation
- La question rhetorique ouvre une reflexion non-evidente
- Le contexte est une prise de parole orale retranscrite
