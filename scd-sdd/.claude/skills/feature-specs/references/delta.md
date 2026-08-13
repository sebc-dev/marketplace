# Référence — Spec delta brownfield (modèle OpenSpec)

Chargée par `/scd-sdd:kickoff-feature` (l'en-tête du `<template>`, pour poser le marqueur `DELTA.md`)
et par `/scd-sdd:specify` (intégralement, quand le dossier porte déjà ce marqueur). **Ni l'une ni
l'autre ne joue l'étape terminale du cycle** — voir `<guidance>`, *Archive*.

<role>
Pour **modifier une feature existante** plutôt que créer un comportement neuf. Au lieu de réécrire
une spec complète (coûteux, sujet à la dérive et à l'hallucination d'exigences sur l'existant), on
écrit un **delta** scopé au seul changement. Cycle : **propose → apply → archive** — à l'archivage,
le delta fusionne dans la spec de vérité de la feature.
</role>

<template>
```markdown
# Delta : [changement] sur [feature existante]
Statut : Proposé | Cible : specs/NNN-feature/spec.md · Créé : [date]

## Légende
- **Delta** — on ne réécrit pas la spec existante, on écrit **le seul changement**. Il fusionnera
  dans la spec de vérité à l'archivage.
- **EARS** (*Easy Approach to Requirements Syntax*) — la forme normée des critères. Les mots-clés
  (`When`, `While`, `If…then`, `Where`, `shall`) sont la syntaxe de la méthode, pas un choix de
  style, et restent donc en anglais.
- **shall** — le verbe de l'exigence : une phrase = une exigence = **une vérification observable**.
- **[ADDED] · [MODIFIED] · [REMOVED]** — la nature de chaque changement, pour qu'on sache d'un coup
  d'œil ce qui est neuf, ce qui bouge et ce qui disparaît.
- **_(PRD: FR-0xx)_** — la backref : le besoin produit que ce critère décline.

## Intention
[Pourquoi ce changement, en 1-2 phrases. Trace vers le FR/SC déclencheur.]

## Comportement actuel (invariants à préserver)
- [ce qui marche aujourd'hui et NE doit PAS régresser]

## Changements (deltas)
### [ADDED]
- **FR-0xx** : When [déclencheur], the system shall [nouveau comportement]. _(PRD: FR-0xx)_
### [MODIFIED]
- **FR-0yy** : ~~[ancien SHALL]~~ → [nouveau SHALL]. Raison : [...]
### [REMOVED]
- **FR-0zz** : [comportement retiré]. Impact : [...]

## Limites de scope (ce que ce delta NE touche PAS)
- [modules/comportements hors champ — empêche la dérive collatérale]

## Vérification
- [tests de non-régression sur les invariants + tests des nouveaux SHALL]
```
</template>

<guidance>
- **Ne jamais réécrire l'existant en entier** : décrire seulement le delta. Les invariants « comportement actuel » protègent contre la régression et l'hallucination.
- **Marqueurs explicites** `[ADDED]` / `[MODIFIED]` / `[REMOVED]` : la revue se fait sur l'**intention**, pas sur un diff de 800 lignes.
- **Apply** : dérouler les mêmes phases `plan`/`tasks`/`analyze`, scopées au delta. L'implémentation elle-même se fait en aval (hors périmètre).
- **Archive** : une fois livré et vérifié, **fusionner** les deltas dans `specs/NNN-feature/spec.md` (la spec de vérité redevient complète et à jour), puis retirer le fichier delta. C'est ce qui garde les living files fidèles au code.
- **Tests de non-régression obligatoires** sur chaque invariant listé.

⚠️ **Qui déclenche l'archivage, et qui l'exécute.** Cette référence n'est chargée qu'à l'**ouverture**
du delta : personne ne relit cette consigne à la livraison, et un `DELTA.md` jamais fusionné laisse
la feature en mode delta **à vie** — la table de dérivation du `SKILL.md` la lit comme telle tant que
le fichier existe.

- **Le déclencheur est `/scd-sdd:status-specs`**, seule commande qui repasse sur toutes les features
  sans qu'on la lui demande. Elle **dérive** le signal de la présence du fichier — `DELTA.md`
  présent, donc fusion terminale en attente — et le **signale**. Elle reste en **lecture seule** :
  c'est un signal dérivé, jamais une écriture, et elle ne juge pas si les lots sont livrés (elle ne
  dérive rien des cases de `tasks.md` — c'est `/scd-sdd:status-impl`).
- **L'exécutant est l'humain.** Fusionner, c'est décider quelles lignes de la spec de vérité sont
  remplacées : aucune commande du plugin ne le fait, et aucune ne doit s'y substituer. Le retrait de
  `DELTA.md` **est** la preuve que c'est fait — il n'y a rien d'autre à cocher.
</guidance>
