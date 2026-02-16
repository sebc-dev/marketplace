---
name: article-types
description: |
  Frameworks d'analyse et de questionnement par type d'article. Ajuste le comportement
  des commandes /braindump, /structure et /review selon le type de contenu. Activer
  quand l'auteur precise le type d'article (technique, REX, tutoriel, opinion) ou
  quand le contexte le rend evident.
---

## Article technique / dev

### Angles a explorer
- Probleme resolu de facon non-evidente
- Decouverte contre-intuitive
- Piege courant que personne ne documente
- Comparaison honnete d'approches (pas "X est mieux que Y")

### Verifications specifiques
- Les prerequis sont-ils explicites ?
- Les cas limites sont-ils mentionnes ?
- Le code est-il teste et fonctionnel ?
- L'article apporte-t-il quelque chose que la doc officielle ne dit pas ?

### Risques
- Tomber dans la paraphrase de documentation
- Presenter un tutoriel deguise en article technique

## Retour d'experience (REX)

### Priorite
L'apprentissage transferable : ce qu'un autre dev peut en tirer pour son propre travail.

### Questions cles
- Qu'est-ce qui a mal tourne et pourquoi ?
- Quelle decision serait differente avec le recul ?
- Quelle lecon quelqu'un d'autre peut en tirer ?

### Risques
- Contenu auto-centre sans valeur pour le lecteur
- Raconter sans analyser (chronologie sans insight)
- Excuses deguisees en REX

## Tutoriel / guide

### Verifications specifiques
- Completude des etapes (un debutant peut-il suivre sans blocage ?)
- Ordre naturel pour le niveau cible
- Prerequis explicites en introduction
- Code verifie et reproductible

### Risques
- Sauter des etapes evidentes pour l'auteur mais pas pour le lecteur
- Structure trop symetrique (acceptable pour un tutoriel, mais a surveiller)

## Opinion / reflexion

### Force de l'argumentation
- La these est-elle claire et tranchee ?
- Les preuves soutiennent-elles reellement la these ?
- Les contre-arguments sont-ils anticipes honnetement ?

### Verifications specifiques
- Traquer les formules de couverture ("il est possible que...", "on pourrait argumenter que...")
- Le lecteur sait-il exactement ce que l'auteur pense ?
- Proposer systematiquement les contre-arguments les plus solides

### Risques
- Complaisance : ne pas assez challenger sa propre these
- Faux equilibre : presenter un "pour/contre" neutre au lieu de prendre position
