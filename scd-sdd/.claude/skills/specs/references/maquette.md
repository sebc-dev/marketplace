# Référence — La maquette d'une feature (`specs/NNN-slug/maquette.md`)

**Un point de chargement** : `/scd-sdd:spec`, intégralement, **seulement quand la feature touche
une interface** (étape 7). Les autres lecteurs — `/scd-sdd:tickets`, `ticket-briefer`, le
`verifier` — lisent le **fichier** `maquette.md` du projet cible, jamais cette référence.

<role>
`specs/NNN-slug/maquette.md` répond à **une** question qu'aucun autre artefact ne porte : *à quoi
cette interface ressemble-t-elle, en structure et en zones ?* Le `SPEC.md` dit ce que la feature
**change** ; la maquette dit ce que l'utilisateur **voit** — écrans nommés, zones, états.

**Elle est optionnelle.** Une feature sans interface n'en a pas ; une feature avec interface peut
s'en passer. Rien du cycle n'en dépend : elle est détectée **sur le disque**, le répertoire commun
`specs/NNN-slug/` EST le lien, et le lien est **descendant seulement** — le `SPEC.md` ne la nomme
jamais.

**Elle porte l'intention, jamais l'avancement.** Pas de case cochée, pas d'écran « fait » : l'état
réel se dérive du disque par `/scd-sdd:status`, et `maquette.md` ne compte pas dans cette
dérivation.

**Elle est textuelle et diffable** — wireframes ASCII box-drawing, Mermaid pour les flux — parce
que ses lecteurs sont des agents autant que l'humain. Une image ne se cite pas dans un critère ;
un bloc `## Écran :` si.

**Elle a quatre lecteurs, et c'est ce qui justifie son existence :** l'humain qui relit ;
`/scd-sdd:tickets`, dont les critères citent les écrans par leur nom ; `ticket-briefer`, qui
extrait verbatim les blocs `## Écran :` dans le brief ; le `verifier` en `observé (mise en page)`,
dont le `humanCheckRequired` devient **comparatif** (« comparer à l'`Écran : X` ») au lieu
d'imaginé.

**Elle est advisory, comme la spec.** Relue par l'humain, et c'est sa seule validation — pas de
gate, pas de verdict, aucune notation de conformité au dessin.
</role>

<template>
````markdown
# NNN — Maquette : [Titre de la feature]

[1-3 phrases : ce que cette interface doit permettre, pour qui.]

## Écran : [Nom]
[Une phrase : à quoi cet écran sert.]

```
┌──────────────────────────────────────┐
│ [zone : nommée par ce qu'elle permet]│
├──────────────┬───────────────────────┤
│ [zone]       │ [zone]                │
└──────────────┴───────────────────────┘
```

**Zones :**
- [zone] — [ce qu'elle permet, une ligne]

**États** (seulement ceux qu'un comportement de la spec exige) :
- vide — [ce qui s'affiche]
- erreur — [ce qui s'affiche]
- chargement — [ce qui s'affiche]

**Responsive** (seulement si un comportement en dépend) : [une annotation, jamais un 2ᵉ dessin]

## Flux
[Optionnel — un flowchart Mermaid entre écrans nommés.]

## Sources
[Optionnel — POUR L'HUMAIN SEULEMENT : lien Figma, image. Le texte fait foi pour les agents ;
 un lien mort n'invalide rien.]
````

Le nom d'un écran est **STABLE** et parle le vocabulaire du glossaire de `CLAUDE.md` : c'est
l'ancre que les tickets et le `verifier` citent.
</template>

<guidance>
- **Quand la proposer.** La conversation de cadrage a touché des écrans, un formulaire, une
  navigation — alors la maquette se **propose**, jamais ne s'impose : « non » est une réponse
  complète, et rien n'est écrit.
- **Quand s'abstenir.** Une feature API/CLI/headless n'a pas de maquette ; un changement d'UI
  trivial (un libellé, une couleur) n'en mérite pas une.
- **Granularité : la structure et les zones, jamais le pixel.** Couleurs, typo, espacements
  relèvent du design system du projet. Une zone se nomme par **ce qu'elle permet** — ni nom de
  composant, ni chemin de fichier.
- **Un écran = un bloc `## Écran : <nom>`.** Renommer un écran = rejouer `/scd-sdd:spec`, qui met
  à jour les écrans ET les citations qui les nomment.
- **Rejouable = révision écran par écran**, jamais de ré-assemblage (§D29) : on révise le bloc
  concerné, on ne régénère pas le fichier.
- **La spec fait foi.** Un écran qui montre un comportement absent de `## Ce que ça change` est du
  scope creep dessiné : le comportement entre d'abord dans la spec, ou l'écran ne le montre pas.
</guidance>

<completion>
Cette checklist **guide** l'écriture — personne ne la re-vérifie en aval : aucune notation normée,
aucune vérification mécanique de conformité (écarté n° 4 de §D41, §D22).

`specs/NNN-slug/maquette.md` est terminée quand :
- [ ] Chaque écran a un **nom stable citable** (`## Écran : <nom>`, vocabulaire du glossaire).
- [ ] Les wireframes montrent des **zones**, pas des pixels — aucune couleur, typo ou composant.
- [ ] Les seuls **états** dessinés sont ceux qu'un comportement de la spec exige.
- [ ] Le fichier porte l'**intention seule** — aucune case, aucun avancement.
- [ ] `## Sources`, si présente, est marquée **humain-seulement** ; le texte fait foi.
- [ ] Le `SPEC.md` ne nomme **pas** la maquette — le répertoire commun est le seul lien.
</completion>
