---
name: slop-poli
description: |
  Detection de contenu avec polish de surface mais sans substance (slop).
  Le slop n'est pas faux — il est vide. Grammaticalement correct, bien structure,
  fluide, mais ne dit rien d'original. Activer pendant /draft (prevention) et
  /review (detection).
---

## Qu'est-ce que le slop

Le "slop" (terme popularise par Charlie Guo, Artificial Ignorance, 2024) designe du contenu majoritairement ou entierement genere par IA, presente comme ecrit par un humain, quelle que soit la qualite formelle. Le marqueur : **polish de surface sans rien en dessous**.

Distinction cle :
- **Hallucination** : le contenu est factuellement faux
- **Slop** : le contenu est formellement correct mais intellectuellement vide

## Marqueurs semantiques

### Absence de these originale
Le texte ne defend aucune position claire. Il presente "les differents aspects" d'un sujet sans jamais trancher. Un article de qualite a une these identifiable en une phrase.

### Absence d'experience vecue
Pas d'anecdotes personnelles, pas de contexte specifique, pas de "j'ai decouvert que..." ou "dans mon projet...". Le contenu pourrait avoir ete ecrit par n'importe qui.

### Absence de prise de position risquee
L'auteur ne dit rien qui pourrait etre conteste. Tout est consensuel, equilibre, nuance au point de ne plus rien affirmer.

### Absence de donnees specifiques
Pas de chiffres precis, pas de noms, pas de versions, pas de dates. Tout reste au niveau de l'abstraction.

### Generalites substituables
Le contenu s'applique a n'importe quel sujet du meme domaine.

## Le test de substituabilite

**Si on remplace le sujet principal par n'importe quel autre sujet du meme domaine, le texte reste-t-il vrai ?**

- "Ce framework est puissant et flexible" → vrai pour n'importe quel framework → slop
- "Ce framework resout le probleme specifique de X en faisant Y, contrairement a Z qui..." → specifique → pas slop

Appliquer ce test paragraphe par paragraphe pendant `/review`.

## Grille d'evaluation

| Critere | Score | Indicateur |
|---|---|---|
| These identifiable | 0-2 | 0 = aucune these, 2 = these claire et tranchee |
| Specificite | 0-2 | 0 = substituable, 2 = ancre dans un contexte unique |
| Experience personnelle | 0-2 | 0 = absente, 2 = presente et pertinente |
| Donnees concretes | 0-2 | 0 = abstractions, 2 = chiffres/exemples precis |
| Prise de risque | 0-2 | 0 = consensuel, 2 = position contestable argumentee |
| **Total** | **/10** | **< 4 = slop probable, 4-6 = a surveiller, > 6 = OK** |

## Prevention en /draft

Quand Claude aide a la redaction (mode B de `/draft`), appliquer ces regles :
- Ne jamais produire de phrase qui passerait le test de substituabilite
- Inclure des elements specifiques au sujet de l'auteur
- Preferer une formulation imparfaite mais specifique a une formulation polie mais generique
- Si le paragraphe genere sonne trop "propre", le signaler a l'auteur
