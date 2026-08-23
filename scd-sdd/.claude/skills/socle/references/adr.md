# Référence — Les ADR (`docs/adr/NNNN-titre.md`)

<role>
Un **ADR** — *Architecture Decision Record* — fige **une** décision structurante dans un fichier
court, au format Nygard, **immuable une fois accepté**. C'est le seul document du socle qui croît
avec le temps, et c'est voulu : il évite les décisions « dans la tête » et donne à l'agent un socle
stable qu'aucune session ne re-litige.

**Immuable veut dire immuable.** Un ADR n'est jamais réédité ; s'il devient faux, on en écrit un
**nouveau** qui le remplace, et l'ancien passe à « Remplacé par ADR-XXXX ». Un hook du plugin
(`block-adr-edits.sh`) rend la règle mécanique : la **création** passe, la **réécriture** est
bloquée.

**Deux sources de candidats, et la phase les épuise toutes les deux :**

1. la conversation en cours — un choix qu'on vient de faire et qui engage le code au-delà de la
   feature du jour ;
2. les brouillons de `docs/adr/_candidates/`, laissés par `/scd-sdd:spec` ou `/scd-sdd:tickets` —
   c'est leur voie de promotion, et la seule.

**Un point de chargement** : `/scd-sdd:adr`, intégralement.
</role>

<template>
```markdown
# ADR-[NNNN] : [titre de la décision]
Statut : Accepté | Date : [AAAA-MM-JJ]

## Contexte
[Les forces en présence, les contraintes, ce qui rendait la décision nécessaire MAINTENANT.]

## Décision
[La décision, en voix active : « Nous utiliserons X ».]

## Conséquences
[Positives ET négatives : ce à quoi le code s'engage désormais, et ce que le choix ferme.]

## Alternatives considérées
- [alternative] : écartée car [raison]

## Vérifiable ?
[Si la décision laisse une trace observable dans l'arborescence ou dans les imports, la nommer :
 c'est ce que `/scd-sdd:guards` pourra dériver en contrôle. Sinon : « non — décision de
 principe ».]
```
</template>

<guidance>
- **Un ADR = une décision structurante.** Pas d'ADR pour un utilitaire mineur ou une convention
  évidente. Le test : *quelqu'un qui arrive dans six mois se demanderait-il pourquoi c'est comme
  ça ?*
- **Numérotation** : `NNNN` sur quatre chiffres, séquentiel, à partir du plus petit libre dans
  `docs/adr/`. Elle ne se renumérote jamais.
- **Voix active** dans la Décision : « Nous utiliserons Postgres », pas « Postgres pourrait être
  utilisé ».
- **Conséquences négatives obligatoires.** Un ADR sans contrepartie est suspect : nommer ce que le
  choix coûte ou ferme. Un ADR qui n'a que des avantages n'a pas été instruit.
- **La section `Vérifiable ?` est le pont vers les gardes.** Le critère d'admission est le même que
  celui des contrôles de CI : la décision laisse-t-elle une **trace observable dans l'arborescence
  ou dans les imports** ? Si oui, elle peut devenir un contrôle `arch-invariants`. Si non, elle
  reste un ADR et c'est très bien — la majorité le sont.
- **Un brouillon promu est signalé, jamais supprimé par la commande.** Elle n'a pas l'outil pour le
  faire, et un brouillon qui reste se représentera en candidat à la passe suivante.
</guidance>

<completion>
Les ADR sont terminés quand :
- [ ] Chaque candidat des **deux** sources — la conversation, `docs/adr/_candidates/` — a
      **exactement un** ADR correspondant, ou a été écarté **avec son motif dit à l'humain**.
- [ ] Chaque ADR a un `NNNN` séquentiel unique et le statut « Accepté ».
- [ ] Chaque ADR nomme au moins une **alternative écartée** avec sa raison.
- [ ] Chaque section **Conséquences** contient au moins une conséquence négative ou un coût.
- [ ] Chaque section **Vérifiable ?** est remplie — y compris quand la réponse est « non ».
- [ ] Le sort de chaque brouillon promu a été **signalé à l'utilisateur** pour qu'il le supprime.
</completion>
