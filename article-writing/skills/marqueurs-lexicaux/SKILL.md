---
name: marqueurs-lexicaux
description: |
  Analyse de la signature statistique globale d'un texte pour detecter l'origine LLM.
  Va au-dela des mots individuels (slop-vocabulary) pour examiner les patterns de
  distribution lexicale. Activer pendant /review et /polish.
---

## Au-dela des mots : la signature statistique

Les LLM laissent une empreinte lexicale detectable au-dela des mots individuels. La distribution de probabilite biaisee vers certains tokens "surs" cree un signal statistique — un watermarking involontaire. Meme quand les mots individuels semblent naturels, leur distribution trahit l'origine artificielle.

## Signaux de distribution

### Diversite lexicale
Les textes LLM tendent vers une diversite lexicale plus basse que les textes humains : vocabulaire plus restreint, moins de variations, repetition de structures syntaxiques. Un texte humain varie naturellement son vocabulaire au fil de l'ecriture.

### Regularite de la longueur des phrases
Les LLM produisent des phrases de longueur plus uniforme. L'ecriture humaine alterne naturellement phrases courtes et longues. Un texte ou toutes les phrases font 15-25 mots est suspect.

### Entropie de Shannon
Les textes LLM ont une entropie plus basse (plus previsibles) que les textes humains. Chaque mot suivant est plus "attendu" dans un texte genere.

## Collocations suspectes

Au-dela des mots individuels, les LLM produisent des combinaisons previsibles :

### Anglais
comprehensive overview, in-depth analysis, key takeaways, worth noting, it's important to, let's explore, deep dive into, holistic approach, best practices, real-world applications

### Francais
vue d'ensemble, il est important de souligner, explorons ensemble, plongeons dans, approche globale, bonnes pratiques, applications concretes, en fin de compte, au final

Ces collocations ont une frequence significativement plus elevee dans les textes LLM que dans l'ecriture humaine.

## Calibration par registre

Le seuil de detection doit s'adapter au type de texte :

| Type d'article | Tolerance | Raison |
|---|---|---|
| Opinion / reflexion | Basse | L'ecriture personnelle devrait etre la moins "IA" |
| REX | Basse | L'experience vecue a un vocabulaire propre |
| Article technique | Moyenne | Le jargon technique peut declencher des faux positifs |
| Tutoriel | Haute | Le format instructionnel peut naturellement ressembler a du LLM |

## Grille d'evaluation pour /review

Lors d'un `/review`, evaluer :

1. **Monotonie syntaxique** : les phrases suivent-elles toutes le meme schema (sujet-verbe-complement) ?
2. **Uniformite de longueur** : les paragraphes/phrases sont-ils tous de taille similaire ?
3. **Collocations** : reperer les combinaisons de mots trop "propres" ou formelles
4. **Previsibilite** : chaque phrase est-elle exactement ce qu'on attendrait apres la precedente ?
5. **Absence de ruptures** : manque de digressions, d'hesitations, d'imperfections stylistiques

## Relation avec slop-vocabulary

Ce skill est complementaire a `slop-vocabulary` :
- `slop-vocabulary` = **quoi** detecter (mots individuels et collocations)
- `marqueurs-lexicaux` = **comment** detecter (patterns de distribution)

Utiliser les deux ensemble pour une detection complete.
