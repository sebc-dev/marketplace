---
name: project-docs
description: |
  Le NIVEAU SOCLE du cycle spec-driven : les documents de gestion de projet
  écrits une fois, au démarrage — et l'entretien du seul qui en demande un,
  CLAUDE.md. Chaîne de traçabilité Produit → Technique → ADR → CI →
  CLAUDE.md, méthode d'interview « une question à la fois », règles d'écriture
  pour un agent (verbe vérifiable, technology-agnostic, scope EXCLU), la
  frontière advisory / déterministe et la phase livraison qui la franchit, les
  invariants d'architecture falsifiables de la phase technique, seuils de
  déclenchement du niveau specs, et les templates de chaque document. Se
  charge pendant /scd-sdd:init-project, produit, technique, adr, livraison,
  revise-contract et premortem (cible socle). Porte UNIQUEMENT le socle — ni
  les specs par feature (skill feature-specs), ni l'implémentation d'un lot
  (skill implement), ni le contrat du fichier de suivi (skill journal).
---

# Socle documentaire du projet (greenfield)

Ce skill outille la **création** des documents qu'on écrit **une fois**, au démarrage —
et l'**entretien** du seul d'entre eux qui en demande un, `CLAUDE.md`.
**Cinq artefacts, quatre phases**, produits dans l'ordre :

`docs/produit.md` → `docs/technique.md` → `docs/adr/NNNN-*.md` →
`docs/ci.md` → `CLAUDE.md`

La quatrième phase, `/scd-sdd:livraison`, en produit **deux** : `docs/ci.md`, puis `CLAUDE.md`.
D'où le compte honnête — **quatre commandes, cinq documents** (`DECISIONS.md` §D39). Annoncer
« quatre documents » serait faux.

Les specs par feature (`specs/NNN-slug/{spec,plan,tasks}.md`) sont **hors périmètre** :
elles relèvent du niveau suivant, ouvert par `/scd-sdd:kickoff-feature`. Ici on pose le
socle qu'elles consommeront.

## La chaîne de traçabilité

Le mot-pivot est **traçabilité** : chaque document *trace vers* le précédent, et rien ne
se répète (un seul endroit par info — on **lie**, on ne recopie pas).

| Document | Répond à | Trace vers | IDs |
|---|---|---|---|
| Produit | Pourquoi ? Quoi ? (produit, pas feature) | — (racine) | `FR-xxx`, `SC-xxx` |
| Technique | Comment ? (fondations **et** structure) | Produit | invariants → `ADR-NNNN` |
| ADR | Pourquoi CE choix ? (décision figée) | Technique | `ADR-NNNN` |
| CI | Qu'est-ce qui est **vérifié** ? (contrôles exécutés) | Technique, ADR | noms de jobs |
| CLAUDE.md | Contrat opérationnel | pointe vers tous | — |

Chaque `FR-xxx` de `docs/produit.md` devient plus tard un critère EARS puis une vérification
observable au niveau specs. Chaque décision structurante de `docs/technique.md` devient **un**
ADR, et chacun de ses **invariants** en devient un aussi. Garde ces IDs stables : ils sont le fil
qui relie le socle à l'implémentation.

`docs/technique.md` est la **source** que le reste consomme, sur ses deux moitiés. Sans sa table
d'**invariants**, les contrôles `arch-invariants` de la phase `livraison` n'ont aucun gisement et la
dimension `architecture` de la review n'a pour référent que l'existant, c'est-à-dire la dérive déjà
accumulée. Cette table ne porte que des règles **falsifiables** — une règle n'y entre que si elle
laisse une trace observable dans l'arborescence ou dans les imports —, et chacune devient un candidat
ADR. C'est aussi pourquoi la structure se décide **dans la même session** que les fondations : le
constat porte sur un framework qu'on vient de trancher, et il n'y a rien à recharger.

`docs/ci.md` est le seul document du socle dont la sortie n'est pas que de la prose : ses
noms de jobs deviennent les checks requis de la forge, et `CLAUDE.md` en **lit** les
commandes du projet au lieu de les inventer. C'est pourquoi `livraison` l'écrit **d'abord**,
et `CLAUDE.md` ensuite.

## Durcir le socle — `/scd-sdd:premortem socle`

Aucune gate ne juge le socle : rien ne rejoue `produit` ou `technique` pour dire s'ils tiennent.
C'est le niveau où l'erreur coûte le plus cher — dix features déclineront ces `FR`, et un ADR accepté
est immuable — et celui où **rien ne la rattrape mécaniquement**.

`/scd-sdd:premortem socle` est la passe qui comble ce trou : on suppose le projet échoué six
mois plus tard et on remonte à ce que le socle omettait. Ses remédiations sont bornées aux
formes du niveau — critère `SC` mesurable, `FR` produit, item de scope EXCLU, contrainte
transverse, contrôle `ci`, candidat ADR.

⚠️ **La section `## Problème` de `docs/produit.md` n'est jamais remédiée** : elle porte
l'intention d'origine, pas une cible. C'est la protection que portait le **Brief** avant la
fusion ; la borne s'est déplacée de *ce fichier* à *cette section*, elle n'a pas disparu
(`DECISIONS.md` §D39). Le reste de `docs/produit.md` est remédiable.

**Ce n'est pas une cinquième phase.** Elle est optionnelle, ne figure dans aucune table de
dérivation, et un socle sans premortem n'est pas un socle incomplet. Méthode et formes : skill
`premortem`.

## Entretenir le contrat — `/scd-sdd:revise-contract`

Les documents du socle s'écrivent une fois. `CLAUDE.md` est le seul qui **dérive** : il recopie les
commandes de `docs/ci.md`, et rien ne rejoue cette recopie quand `livraison` est rejouée. D'où une
commande **à part**, qui n'est pas une phase — rejouable à volonté, réclamée par aucun `status`, et
« aucune édition » y est un résultat valide (`DECISIONS.md` §D29).

**Trois écrivains, trois rôles disjoints**, et c'est la ligne à ne pas perdre :

| Écrivain | Rôle | Geste |
|---|---|---|
| `livraison` | **assemble**, une fois | écrit depuis le template, et refuse d'écraser un fichier existant |
| `revise-contract` | **entretient** | retire, resynchronise, déplace vers un renvoi — n'enrichit pas |
| `premortem socle` | **durcit** | ajoute un principe ou un item de DoD, borné (§D28) |

Une commande qui ferait les trois recréerait le trou qu'elle ferme : **entretenir n'est pas
ré-assembler**. La règle qui commande l'entretien — *une ligne inconnue du template est présumée
légitime* — vit dans le bloc `<revision>` de `references/claude-md.md`, que `revise-contract` seule charge.

## Méthode d'interview

En **greenfield**, rien n'existe à dériver du code. La qualité vient de l'élicitation, pas de la
génération. La règle qui la porte — *une question à la fois* — est une **règle de dialogue** : elle
vit recopiée dans le `## Règles absolues` de chaque commande qui interviewe (`DECISIONS.md` §D32),
pas ici. Ce qui suit est ce qu'aucune commande ne porte : l'amorce, l'outil, la condition d'arrêt.

Amorce (Harper Reed, à adapter à la langue de l'utilisateur) :
> « Pose-moi une question à la fois pour élaborer une spec pas à pas de cette idée. Chaque question s'appuie sur mes réponses précédentes. But : une spécification détaillée. Une seule question à la fois. Voici l'idée : \<IDÉE\> »

Outil natif équivalent : `AskUserQuestion` pour les choix fermés (personas, priorités,
options techniques). L'interview s'arrête quand **tout `[NEEDS CLARIFICATION]` est
résolu** — pas avant.

## Règles d'écriture pour un agent

- **Verbe vérifiable, jamais adjectif.** « rapide / sécurisé / robuste » ne donne aucune
  cible. Écris « P99 < 50 ms », « retourne un code d'erreur structuré pour tout
  4xx/5xx ». Un adjectif = une hallucination potentielle.
- **Technology-agnostic dans `docs/produit.md`.** Il dit le *quoi* : aucun framework, lib ou DB.
  Tout choix technique descend dans `docs/technique.md` et les ADR. Une fuite technique dans le
  Produit casse la séparation.
- **Scope EXCLU explicite.** Nommer ce que le produit/la v1 ne fait PAS borne l'agent et
  évite le sur-engineering. Section obligatoire dans `docs/produit.md` — **une seule fois** :
  avant la fusion, le Brief et le PRD la réclamaient tous les deux (§D39).
- **Advisory vs déterministe.** CLAUDE.md est du contexte *advisory*, pas une couche
  d'application. Ce qui DOIT arriver à 100 % (lint, tests bloquants) est un
  hook/linter/test — jamais une phrase. Le noter dans CLAUDE.md, mais ne pas croire que
  l'écrire le garantit. **La commande qui franchit cette frontière est `/scd-sdd:livraison`** :
  elle produit `docs/ci.md` et le workflow de la forge, et rend la protection de branche
  qui les rend bloquants. Une frontière qu'aucune commande ne franchit n'est pas une
  frontière, c'est un trou — d'où la phase 4.
- **La défense vient de l'extérieur de l'agent.** Un contrôle que l'agent qui code exécute
  lui-même n'atteste que de sa propre bonne foi. Le backstop est le check serveur sous
  protection de branche ; hook local et consigne écrite sont de la défense en profondeur,
  et se présentent comme telles.
- **Un seul endroit par info.** La répétition gaspille du contexte et invite la dérive.
  Lier vers `docs/`, ne pas recopier.

## État dérivé, événement journalisé

L'état du socle se **dérive des fichiers** : `docs/produit.md` existe → la phase Produit est
faite. Aucune commande n'écrit un fichier d'état — il dériverait.

Ce que la dérivation ne donne pas, c'est la **chronologie** : quand chaque phase a été
jouée. Chaque commande du socle consigne donc sa ligne dans `docs/journal/socle.md`. Le
format, la règle d'ajout et le vocabulaire attendu par phase appartiennent au skill
**`journal`**, qui est chargé au moment de consigner — ils ne sont pas recopiés ici.

⚠️ Un projet suivi avant `1.19.0` porte des lignes de journal en `brief`, `prd`, `stack`, `archi`,
`ci` et `contract` : elles **ne se réécrivent jamais**. Un fichier de journal portera deux
vocabulaires, et c'est correct — l'ancien décrit ce qui est arrivé, le neuf ce qui arrivera.

## Seuils de déclenchement (constitution fondue dans CLAUDE.md)

Pas de `constitution.md` séparée pour un solo : ces principes vont dans une section de
`CLAUDE.md` (phase `livraison`). Ils cadrent quand ouvrir le niveau specs en aval :

- Diff descriptible en une phrase → direct, pas de spec, pas de plan mode.
- 1 fichier, comportement localisé → `tasks.md` léger éventuel.
- Multi-fichiers / nouveau comportement / code non familier → cycle
  `/scd-sdd:kickoff-feature` complet (spec → plan → tasks → analyze).
- Décision transverse / architecturale → nouvel ADR.

## Les cinq documents, en six références (progressive disclosure)

Charge **uniquement** la référence de la phase courante (la commande le fait pour toi).

**Un lecteur de plus, commun aux cinq documents.** L'agent `audit-explorer` charge le **seul bloc
`<template>`** de la référence du document jugé quand `/scd-sdd:audit` juge celui-ci (§D20) : il en
tire la liste des sections attendues, et n'écrit jamais.

- `references/produit.md` — le document Produit (`docs/produit.md`) : problème, personas,
  user stories, `FR-xxx`, périmètre EXCLU, `SC-xxx`. Racine de la chaîne.
  - **Un point en commande** (plus l'audit, ci-dessus) : par `/scd-sdd:produit`,
    **intégralement**.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/technique.md` — le document Technique (`docs/technique.md`) : fondations
  (« options justifiées ») **et** structure — caractéristiques retenues, contraintes imposées par
  la stack, table des **invariants** falsifiables.
  - **Deux points en commande** (plus l'audit, ci-dessus) : par `/scd-sdd:technique`,
    **intégralement** ; et par `/scd-sdd:livraison`, **conditionnellement** et pour sa seule section
    `## Vérification` (l'inventaire d'outillage), au moment de dériver les contrôles
    `arch-invariants`. L'admission appartient à `technique`, la vérification à `livraison`.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/adr.md` — ADR fondateurs (Nygard, immuables), dérivés des **deux** listes de
  candidats de `docs/technique.md` et des brouillons de `docs/adr/_candidates/`.
  - **Un point en commande** (plus l'audit, ci-dessus) : par `/scd-sdd:adr`, **intégralement**.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/ci.md` — contrôles CI (`docs/ci.md`), workflow de la forge, protection de
  branche et blindage local.
  - **Un point en commande** (plus l'audit, ci-dessus) : par `/scd-sdd:livraison`,
    **intégralement** — c'est le premier des deux documents que la phase produit.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/ci-signature.md` — la **soupape** du garde `verifier-guard` : signature du
  commit vérifiée hors ligne contre un registre de clés versionné.
  - **Un seul point de chargement, conditionnel** : par `/scd-sdd:livraison`, à son **étape 6**, et
    seulement quand le garde `verifier-guard` est retenu. Un projet sans ce garde ne la lit jamais —
    d'où la séparation de `references/ci.md`, qui reste chargée et vers laquelle elle renvoie. Pas
    de lecteur `audit-explorer` : ce n'est pas un document du socle.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/claude-md.md` — le contrat `CLAUDE.md` : assemblage (pointeurs + Definition
  of Done + principes fondus) **et entretien**.
  - **Deux points en commande** (plus l'audit, ci-dessus) : par `/scd-sdd:livraison`, **tout
    sauf `<revision>`**, une fois `docs/ci.md` écrit ; et par `/scd-sdd:revise-contract`,
    **`<guidance>` et `<revision>` seulement**. Ne pas donner le `<template>` à l'entretien est
    délibéré — il traiterait toute ligne hors template comme un écart de conformité. L'assemblage
    appartient à `livraison`, l'entretien à `revise-contract`.
  - Sections : `role`, `template`, `guidance`, `completion`, `revision`
