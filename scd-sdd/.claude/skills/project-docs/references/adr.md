# Référence — ADR fondateurs (`docs/adr/NNNN-titre.md`)

<role>
Fige les **décisions structurantes du départ**, une par fichier, au format Nygard. Trois sources de
candidats, et la phase les épuise toutes les trois : la liste « Décisions structurantes » de
`docs/technique.md`, la table des **invariants** du même fichier (§D27), et les brouillons laissés
dans `docs/adr/_candidates/` par le niveau specs — dont c'est la voie de promotion. Les **deux
premières vivent désormais dans un seul document** (§D39) ; elles restent **deux sources**, et deux
colonnes `ADR` distinctes à boucler. **Immuables** :
un ADR n'est jamais réédité ; s'il devient faux, on en écrit un nouveau qui le remplace
(statut « Remplacé par ADR-XXXX »). C'est le journal fiable des choix — il évite les décisions
« dans la tête » et donne à l'agent un socle stable dès le jour 1.

**Où cette référence se charge — deux points, et le second est partiel :**

1. par `/scd-sdd:adr`, **intégralement** : c'est le template et la méthode de la phase ;
2. par l'agent **`audit-explorer`**, le **seul bloc `<template>`**, quand `/scd-sdd:audit adr` juge
   le répertoire `docs/adr/`. Il n'en tire que la **liste des sections attendues** et ne le recopie
   nulle part (`DECISIONS.md` §D20) : l'audit constate, il n'édite rien — un ADR accepté est
   immuable, et ce qu'il remonte se referme par un candidat ou un supersede.
</role>

<template>
```markdown
# ADR-[NNNN] : [titre de la décision]
Statut : Accepté | Date : [date] | Trace vers : docs/technique.md

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
- **Un ADR = une décision structurante.** Prendre les candidats des **trois** sources — liste « Décisions structurantes » de `docs/technique.md`, table d'invariants du même fichier, brouillons de `docs/adr/_candidates/` — et en faire un fichier chacun. Ne pas produire d'ADR pour une non-décision (utilitaire mineur, convention évidente).
- **Numérotation** : `NNNN` sur 4 chiffres, séquentiel (`0001`, `0002`…), à partir du plus petit libre dans `docs/adr/`.
- **Voix active** dans la Décision : « Nous utiliserons Postgres », pas « Postgres pourrait être utilisé ».
- **Conséquences négatives obligatoires.** Un ADR sans contrepartie est suspect : nommer ce que le choix coûte ou ferme.
- **Trace vers `docs/technique.md` et les FR/SC** : le Contexte cite les exigences que la décision sert.
- **Immutabilité** : au kickoff on *crée* les ADR (statut « Accepté »). On ne réédite jamais un ADR existant ; la maintenance ultérieure (superseding) relève du workflow aval, pas de ce kickoff.
</guidance>

<completion>
Les ADR fondateurs sont terminés quand :
- [ ] Chaque candidat des **trois** sources — liste « Décisions structurantes » de `docs/technique.md`, table d'invariants du même fichier, `docs/adr/_candidates/` — a **exactement un** ADR correspondant.
- [ ] Chaque ADR a un `NNNN` séquentiel unique et un statut « Accepté ».
- [ ] Chaque ADR nomme au moins une **alternative écartée** avec sa raison.
- [ ] Chaque section **Conséquences** contient au moins une conséquence négative/coût.
- [ ] Les **deux** colonnes « ADR » de `docs/technique.md` — « Choix retenus » **et** « Invariants » — référencent chacune les fichiers créés depuis elles (traçabilité bidirectionnelle, les **deux** colonnes bouclées). Un ADR promu depuis un brouillon n'y figure pas : il trace vers son origine, le plan de sa feature.
- [ ] Le sort de chaque brouillon promu a été **signalé à l'utilisateur** pour qu'il le supprime — la phase n'a aucun outil pour le faire, et un brouillon qui reste se représentera en candidat à la passe suivante.
</completion>
