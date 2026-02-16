---
name: slop-vocabulary
description: |
  Detection de vocabulaire statistiquement surrepresente dans les outputs LLM.
  Activer lors des phases /review et /polish pour scanner le texte. Peut etre
  active explicitement par l'auteur a tout moment.
---

## Pourquoi ces mots posent probleme

Les LLM convergent vers des tokens "surs" — formels, polis, non-engageants — en raison du RLHF qui penalise les formulations potentiellement offensantes ou trop familieres. Le resultat : certains mots apparaissent a des frequences anormales dans les outputs IA. "Delve" a augmente d'environ 400% dans les articles PubMed post-GPT. "Meticulously researched" d'environ 3900%. Ces mots deviennent des marqueurs detectables.

## Liste de detection — Anglais

### Adverbes de qualification excessive
meticulously, seamlessly, arguably, undeniably, remarkably, fundamentally, inherently, notably, particularly, overwhelmingly

### Noms abstraits pompeux
tapestry, landscape, realm, plethora, myriad, beacon, cornerstone, paradigm, synergy, ecosystem (sens figure)

### Verbes de substitution formelle
leverage, utilize, harness, delve, navigate (sens figure), foster, elevate, streamline, spearhead, empower, underscore

### Formules d'introduction
It's worth noting that, It's important to note, As we delve into, In today's rapidly evolving, At its core, Let's explore

### Collocations suspectes
comprehensive overview, in-depth analysis, key takeaways, game-changer, cutting-edge, best practices, deep dive, holistic approach

## Liste de detection — Francais

### Adverbes et locutions
indeniablement, incontestablement, de maniere transparente, de facon holistique, fondamentalement, remarquablement

### Noms et expressions
paysage (sens figure), panoplie, plethore, ecosysteme (sens figure), pilier, paradigme, synergie

### Formules d'introduction
Il convient de noter, Force est de constater, Dans un monde en constante evolution, Au coeur de, Il est crucial de, Explorons, Plongeons dans

### Collocations suspectes
vue d'ensemble complete, analyse approfondie, points cles a retenir, veritable revolution, a la pointe de, bonnes pratiques, approche holistique

## Regles de detection

Un mot seul n'est pas un signal fiable. Le vrai signal est la **densite** et la **co-occurrence** :
- 1 mot suspect isole : ignorer (usage potentiellement naturel)
- 2-3 mots suspects dans le meme paragraphe : signaler comme avertissement
- 4+ mots suspects dans un passage court : signaler comme probleme
- Collocation suspecte : toujours signaler (les combinaisons sont plus revelatory que les mots individuels)

## Quand signaler

- Pendant `/review` : scanner l'article entier, reporter les passages a risque
- Pendant `/polish` : scan final, derniere verification avant publication
- Sur demande explicite de l'auteur

## Quand ne PAS signaler

- Le mot est utilise dans son sens technique precis (ex: "ecosystem" pour un vrai ecosysteme logiciel)
- Le contexte est une citation directe
- L'auteur a explicitement choisi ce mot en connaissance de cause
