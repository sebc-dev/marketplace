# Référence — ADR fondateurs (`docs/adr/NNNN-titre.md`)

<role>
Fige les **décisions structurantes du départ**, une par fichier, au format Nygard. Dérivés
directement de la phase Stack (chaque « décision structurante → candidat ADR »). **Immuables** :
un ADR n'est jamais réédité ; s'il devient faux, on en écrit un nouveau qui le remplace
(statut « Remplacé par ADR-XXXX »). C'est le journal fiable des choix — il évite les décisions
« dans la tête » et donne à l'agent un socle stable dès le jour 1.
</role>

<template>
```markdown
# ADR-[NNNN] : [titre de la décision]
Statut : Accepté | Date : [date] | Trace vers : docs/stack.md

## Contexte
[Forces en présence, contraintes, exigences (FR/SC) concernées.]

## Décision
[La décision, en voix active : "Nous utiliserons X".]

## Conséquences
[Positives ET négatives : ce à quoi le code s'engage désormais.]

## Alternatives considérées
- [alternative] : écartée car [raison]

## Contexte agent (optionnel)
- Décision influencée/générée par l'agent : oui/non — Revue humaine : [date]
```
</template>

<guidance>
- **Un ADR = une décision structurante.** Prendre la liste « candidats ADR » de `docs/stack.md` et en faire un fichier chacun. Ne pas produire d'ADR pour une non-décision (utilitaire mineur, convention évidente).
- **Numérotation** : `NNNN` sur 4 chiffres, séquentiel (`0001`, `0002`…), à partir du plus petit libre dans `docs/adr/`.
- **Voix active** dans la Décision : « Nous utiliserons Postgres », pas « Postgres pourrait être utilisé ».
- **Conséquences négatives obligatoires.** Un ADR sans contrepartie est suspect : nommer ce que le choix coûte ou ferme.
- **Trace vers Stack et les FR/SC** : le Contexte cite les exigences que la décision sert.
- **Immutabilité** : au kickoff on *crée* les ADR (statut « Accepté »). On ne réédite jamais un ADR existant ; la maintenance ultérieure (superseding) relève du workflow aval, pas de ce kickoff.
</guidance>

<completion>
Les ADR fondateurs sont terminés quand :
- [ ] Chaque « décision structurante » listée dans `docs/stack.md` a **exactement un** ADR correspondant.
- [ ] Chaque ADR a un `NNNN` séquentiel unique et un statut « Accepté ».
- [ ] Chaque ADR nomme au moins une **alternative écartée** avec sa raison.
- [ ] Chaque section **Conséquences** contient au moins une conséquence négative/coût.
- [ ] La colonne « ADR » de `docs/stack.md` référence bien chaque fichier créé (traçabilité bidirectionnelle).
</completion>
