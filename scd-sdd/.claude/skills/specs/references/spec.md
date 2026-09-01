# Référence — La spec d'une feature (`specs/NNN-slug/SPEC.md`)

**Un point de chargement** : `/scd-sdd:spec`, intégralement.

<role>
`SPEC.md` répond à **une** question : *que construit-on, et qu'a-t-on décidé en chemin ?* Elle est
courte — **~40 lignes, plafond 80** — parce qu'elle sera relue, et qu'un document de 200 lignes ne
l'est pas.

**Elle synthétise, elle n'interviewe pas.** Le contenu est déjà dans la conversation : l'humain a
expliqué ce qu'il veut, on a exploré le dépôt, on a peut-être discuté des options. La commande
**écrit ce qui a été dit**, elle ne relance pas un questionnaire. Là où le cycle `1.x` extrayait par
interview « une question à la fois », on compile — et on ne demande que ce qui manque
**réellement**.

**Elle est relue par un humain, et c'est sa seule validation.** Pas de gate, pas de marqueur
d'ambiguïté à résoudre, pas de verdict. Ce qui reste flou après relecture se tranche en
conversation, à ce moment-là.
</role>

<template>
```markdown
# NNN — [Titre de la feature]

## Problème
[Ce qui ne va pas aujourd'hui, du point de vue de celui qui le subit. Deux à quatre phrases.
 Pas de solution ici.]

## Solution
[Ce qu'on construit, du point de vue de l'utilisateur. Deux à quatre phrases.]

## Ce que ça change, concrètement
[Une liste courte de comportements observables. C'est ce que les tickets découperont, et c'est
 la seule section que l'implémentation lira ligne à ligne.]
- [comportement]
- [comportement]

## Décisions d'implémentation
[Ce qui a été tranché en discutant, et qu'on ne veut pas re-trancher à chaque ticket : modules
 touchés, interfaces, forme des données, contrats d'API, interactions précises.
 PAS de chemins de fichiers ni d'extraits de code — ils périment en un jour.
 Exception : un extrait qui encode une décision plus précisément que la prose ne le peut
 (machine à états, schéma, forme d'un type) s'inline, réduit à sa partie décisive.]
- [décision] — [pourquoi celle-là]

## Décisions de test
[Où sont les coutures, et pourquoi celles-là. Préférer une couture existante à une neuve ;
 la placer aussi haut que possible ; moins il y en a, mieux c'est.]
- Couture : [où] — [ce qu'on y teste, ce qu'on ne peut pas y tester]
- Prior art : [tests similaires déjà dans le dépôt]

## Hors-périmètre
[Ce qui a été explicitement écarté, et le restera. C'est la section qui empêche le scope creep,
 et c'est celle que l'implémentation citera pour refuser un ajout.]
- [écarté] — [motif]
```
</template>

<guidance>
- **Le vocabulaire vient du glossaire de `CLAUDE.md`.** S'il en manque un terme, c'est un signal :
  le dire, et laisser l'humain décider s'il l'y ajoute.
- **Respecter les ADR acceptés.** Une spec qui contredit un ADR est un défaut, pas une évolution.
  Si la décision doit changer, c'est un **nouvel** ADR qui supersede l'ancien — jamais une spec qui
  passe outre en silence.
- **Une décision structurante rencontrée ici ne se tranche pas ici.** Brouillon dans
  `docs/adr/_candidates/`, renvoi vers `/scd-sdd:adr`. La spec la **mentionne** comme candidate,
  elle ne la fige pas.
- **Le hors-périmètre est la section la plus rentable du document.** C'est elle qui coûte le moins
  à écrire et qui rapporte le plus : sans elle, chaque ticket rediscute la frontière.
- **Aucun critère normé.** Le cycle `1.x` demandait des critères EARS (`WHEN … the system SHALL …`)
  parce qu'un agent vérificateur les relisait. Cet agent n'existe plus : une notation sans lecteur
  est une contrainte de rédaction que rien ne récompense (§D41). Les critères **observables** vivent
  dans les tickets, en français, et c'est l'implémentation qui les paie.
- **Les `FR`/`SC` sont du niveau produit.** S'il existe un `docs/vision.md`, il porte les exigences
  (`FR`) et les critères de succès (`SC`) ; le `SPEC.md` y **renvoie** — « décline FR-2 (export CSV) »
  — dans ses décisions d'implémentation, il ne les recopie jamais : `docs/vision.md` a un lecteur, le
  `SPEC.md` non. Absent, rien à faire.
- **Pas de chemins de fichiers.** Ils périment plus vite que le document. Nommer les **modules**,
  pas les fichiers.

## Ce qui fait qu'une spec est trop longue

Presque toujours la même chose : elle décrit **comment** au lieu de **quoi**, ou elle énumère des
cas que les tickets porteront très bien. Deux tests, dans cet ordre :

1. *Cette phrase changerait-elle si on changeait de framework ?* Si oui, elle appartient aux
   décisions d'implémentation — ou à un ADR.
2. *Cette liste sera-t-elle recopiée dans un ticket ?* Si oui, elle appartient au ticket.
</guidance>

<completion>
La spec est terminée quand :
- [ ] Le **Problème** est écrit du point de vue de qui le subit, sans solution.
- [ ] **Ce que ça change** est une liste de comportements **observables** — c'est le matériau des
      tickets.
- [ ] Chaque **décision d'implémentation** porte son *pourquoi*.
- [ ] Les **coutures de test** sont nommées, avec ce qu'elles ne couvrent pas.
- [ ] Le **hors-périmètre** n'est pas vide. Une feature sans rien d'écarté n'a pas été cadrée.
- [ ] Aucun ADR accepté n'est contredit ; les décisions structurantes rencontrées sont en
      `_candidates/` et **signalées**.
- [ ] Le document tient en **~40 lignes**, plafond 80.
</completion>
