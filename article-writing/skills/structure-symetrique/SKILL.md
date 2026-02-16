---
name: structure-symetrique
description: |
  Detection de regularite structurelle artificielle dans les textes. Les LLM imposent
  des patterns de structure previsibles. Activer pendant /review et /structure pour
  verifier que le texte ne suit pas un template generique.
---

## Patterns structurels a detecter

### Le pattern section-type
Chaque section suit : definition → explication → nuance → mini-resume. Cette regularite est un marqueur fort de generation IA.

### Uniformite de longueur
Tous les paragraphes font approximativement la meme taille. Toutes les sections ont le meme nombre de paragraphes. L'ecriture humaine varie naturellement.

### Sous-titres generiques
"Comprendre X", "L'importance de Y", "Les avantages de Z", "L'avenir de W". Ces patterns de sous-titres sont sur-representes dans les outputs LLM.

### Introductions annonciatrices
"Dans cet article, nous allons explorer...", "Nous aborderons successivement..." Les LLM annoncent le plan dans l'introduction. L'ecriture humaine entre souvent directement dans le sujet.

### Conclusions-miroirs
La conclusion repete l'introduction en la reformulant. Chaque section se termine par un mini-resume. Ces patterns creent une symetrie artificielle.

### Transitions mecaniques
"Passons maintenant a...", "Comme nous l'avons vu...", "Apres avoir examine X, tournons-nous vers Y." Les transitions humaines sont moins systematiques.

## Le test du plan resume

Convertir chaque paragraphe en une phrase resume et lire ces phrases comme un plan. Si le plan qui en resulte ressemble a un template generique applicable a n'importe quel sujet, le texte a probablement une structure trop symetrique.

### Comment l'appliquer
1. Extraire la premiere phrase de chaque paragraphe
2. Les lire a la suite comme un plan
3. Evaluer : ce plan pourrait-il etre celui de n'importe quel article sur un sujet voisin ?
4. Si oui, la structure est trop generique

## Calibration par type d'article

| Type | Tolerance a la symetrie | Raison |
|---|---|---|
| Tutoriel | Haute | Structure step-by-step naturellement reguliere |
| Article technique | Moyenne | Une certaine structure est attendue |
| REX | Basse | Le recit d'experience est naturellement irregulier |
| Opinion | Tres basse | La pensee personnelle ne suit pas de template |

## Strategies pour casser la symetrie

Quand une symetrie excessive est detectee, suggerer :

- **Varier la longueur des paragraphes** : alterner paragraphes denses et aeres
- **Supprimer les mini-resumes de section** : laisser le lecteur synthetiser
- **Ne pas terminer symetriquement** : chaque section peut finir differemment
- **Inserer des ruptures** : anecdote, question ouverte, apartes qui brisent le rythme
- **Entrer dans le sujet** : pas d'introduction qui annonce le plan
- **Varier les sous-titres** : questions, affirmations, fragments — pas toujours le meme schema
