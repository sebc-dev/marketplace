# Référence — La vision produit (`docs/vision.md`)

**Un point de chargement** : `/scd-sdd:vision`, intégralement.

<role>
`docs/vision.md` répond à **une** question que rien d'autre ne porte : *pourquoi ce produit, et
qu'a-t-il décidé de réussir ?* C'est le **niveau au-dessus de la feature** — le seul artefact du
socle qui parle du produit **dans son ensemble** plutôt que d'une feature à la fois. Le `1.x` le
tenait en deux documents (`brief.md` « Vision », `prd.md` « au niveau produit, pas per-feature ») ;
`2.0.0` le tenait en une ligne de `CLAUDE.md`, et c'était trop peu.

**Il est optionnel.** Un projet sans lui fonctionne à l'identique : `spec`, `tickets`, `run`,
`status` n'en dépendent pas. Il existe quand un produit vit assez longtemps pour qu'une base de
vision serve — plusieurs features, plusieurs mois.

**Il porte l'intention, pas l'état.** Sa liste de features peut être en avance sur le disque : c'est
un artefact de **planification**, pas un tableau de bord. L'état réel d'une feature reste **dérivé
du disque** par `/scd-sdd:status` (doctrine « aucun fichier d'état », §D1/§D18).

**Il a trois lecteurs, et c'est ce qui le distingue d'un document décoratif :** l'humain qui
planifie ; `/scd-sdd:spec`, qui y ancre une feature (quel `FR`/`SC`, sous quel epic) ; et
`/scd-sdd:adr`, qui remonte ses préoccupations de domaine encore ouvertes comme candidats.

**Il est relu par un humain, et c'est sa seule validation.** Pas de gate, pas de verdict, pas de
notation à résoudre. Écrit une fois, révisé rarement.
</role>

<template>
```markdown
# [Produit] — Vision & exigences

## Vision
[Le north star : le pourquoi du produit dans son ensemble, et pour qui. 2-4 phrases.
 C'est ce qu'aucun SPEC.md ne porte — une feature dit son pourquoi local, pas celui du produit.]

## Exigences fonctionnelles (FR)
[Ce que le produit doit faire, au niveau produit — atomique, stable, numéroté.
 Une exigence = une ligne. C'est le référentiel qu'une feature décline, jamais l'inverse.]
- **FR-1** — [exigence]
- **FR-2** — [exigence]

## Critères de succès (SC)
[Comment on saura que le produit réussit — mesurable de préférence.
 Distinct des FR : le FR est ce qu'on fait, le SC est ce qui prouve que ça valait le coup.]
- **SC-1** — [critère]

## Domaines transverses (base des ADR)
[Les préoccupations durables par domaine que les ADR devront trancher — le QUOI qu'on doit réussir,
 pas le COMMENT. Une préoccupation numérotée = une ligne. La DÉCISION reste un ADR, qui cite la
 préoccupation. Domaines par défaut ci-dessous ; en ajouter (perf, données/privacy, a11y, ops) ou
 en retirer selon le projet — un service headless n'a pas d'UX/UI. Une poignée de puces par
 domaine : une profondeur qui déborde est un ADR, pas une section d'ici.]

### Architecture
- **ARCH-1** — [contrainte / caractéristique / préoccupation durable]

### Sécurité
- **SEC-1** — [préoccupation durable]

### UX/UI
- **UX-1** — [préoccupation durable]

## Découpage — epics
[Un epic = un regroupement de features autour d'un résultat produit, au-dessus de la feature.]

### Epic A — [nom] · Now
[Intention en une phrase : le résultat produit visé.]
Résultats-clés :
- [l'issue observable de l'epic, que ses features déclinent — 2 à 3 au plus]
Features :
- 001 — [titre]   (FR-1, FR-2 · SC-1)
- 004 — [titre]   (FR-3)

### Epic B — [nom] · Next
...
```
</template>

<guidance>
- **`FR`/`SC` vivent ici, et nulle part ailleurs.** Le `SPEC.md` d'une feature y **renvoie**
  (« décline FR-2 »), il ne les recopie pas — une copie dérive au premier changement. C'est aussi
  pourquoi la règle « aucun `FR-xxx` dans un `SPEC.md` » de `/scd-sdd:spec` **tient toujours** : la
  notation avait disparu faute de lecteur (§D41) ; elle revient **au seul niveau qui en a un**, le
  produit.
- **Domaines = préoccupations, jamais décisions.** `ARCH-*`/`SEC-*`/`UX-*` disent le *quoi* durable ;
  le *comment* est un **ADR** qui cite la préoccupation. On n'inscrit ici **aucun invariant, aucun
  chemin de fichier, aucune décision** : la table d'invariants *enforced* reste `docs/adr/`, celle
  que l'`architecture-reviewer` juge. Sans cette règle, on reconstruit le `archi.md` du `1.x`
  (310 lignes) que §D41 a dissous — un doc qui doublait les ADR et dérivait d'eux.
- **Lien descendant seul.** L'epic nomme ses features par `NNN` ; on n'ajoute **rien** au `SPEC.md`.
  Ajouter un champ au contrat des specs pour porter le lien est le geste que §D41 a refusé.
- **Horizon au niveau epic.** Now / Next / Later décrit un epic, pas une feature. L'avancement réel
  d'une feature se lit sur le disque via `/scd-sdd:status` — ne pas cocher de cases de features ici,
  ce serait un fichier d'état, et c'est interdit.
- **Discipline de poids.** Le fichier porte déjà vision + `FR` + `SC` + domaines + epics : le risque
  est de rebâtir `prd.md` **et** `archi.md`. Chaque domaine tient en une poignée de puces ; une
  feature n'apparaît que par son `NNN` et son titre. Ce qui déborde en profondeur est un ADR ou une
  spec, pas une rallonge d'ici.
- **La frontière advisory/déterministe tient.** Une préoccupation, un `FR`, un `SC` n'imposent rien —
  seuls l'ADR, `docs/ci.md` et `.claude/guards.json` bloquent. Un document de vision reste un
  conseil ; c'est sa nature, pas son défaut.
</guidance>

<completion>
`docs/vision.md` est terminé quand :
- [ ] La **Vision** dit le pourquoi du produit **entier** et pour qui — pas le pourquoi d'une feature.
- [ ] Les **`FR`** sont atomiques et numérotés ; les **`SC`** sont distincts des `FR` (preuve, pas action).
- [ ] Chaque **domaine** ne porte que des **préoccupations** (`ARCH-*`/`SEC-*`/`UX-*`) — aucune décision,
      aucun invariant, aucun chemin de fichier : ceux-là sont des ADR.
- [ ] Chaque **epic** porte un horizon (Now/Next/Later), une intention, 2-3 résultats-clés, et **nomme
      ses features par `NNN`** — sans cocher leur avancement (dérivé du disque).
- [ ] Aucun `FR`/`SC` n'est recopié dans un `SPEC.md`, et aucune préoccupation ne double un ADR accepté.
- [ ] Le document reste **scannable** : une poignée de puces par domaine, une ligne par feature.
</completion>
