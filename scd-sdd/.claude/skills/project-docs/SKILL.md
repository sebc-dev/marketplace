---
name: project-docs
description: |
  Le NIVEAU SOCLE du cycle spec-driven : les documents de gestion de projet
  écrits une fois, au démarrage. Chaîne de traçabilité Brief → PRD → Stack →
  Archi → ADR → CI → CLAUDE.md, méthode d'interview « une question à la fois »,
  règles d'écriture pour un agent (verbe vérifiable, technology-agnostic, scope
  EXCLU), la frontière advisory / déterministe et la phase ci qui la franchit,
  les invariants d'architecture falsifiables de la phase archi, seuils de
  déclenchement du niveau specs, et les templates copy-paste de chaque document.
  Se charge pendant /scd-sdd:init-project, brief, prd, stack, archi, adr, ci,
  contract et premortem (cible socle). Porte UNIQUEMENT le socle — ni les specs
  par feature (skill feature-specs), ni l'implémentation d'un lot (skill
  implement), ni le contrat du fichier de suivi (skill journal).
---

# Socle documentaire du projet (greenfield)

Ce skill outille la **création** des documents qu'on écrit **une fois**, au démarrage.
Sept artefacts, produits dans l'ordre :

`docs/brief.md` → `docs/prd.md` → `docs/stack.md` → `docs/archi.md` →
`docs/adr/NNNN-*.md` → `docs/ci.md` → `CLAUDE.md`

Les specs par feature (`specs/NNN-slug/{spec,plan,tasks}.md`) sont **hors périmètre** :
elles relèvent du niveau suivant, ouvert par `/scd-sdd:kickoff-feature`. Ici on pose le
socle qu'elles consommeront.

## La chaîne de traçabilité

Le mot-pivot est **traçabilité** : chaque document *trace vers* le précédent, et rien ne
se répète (un seul endroit par info — on **lie**, on ne recopie pas).

| Document | Répond à | Trace vers | IDs |
|---|---|---|---|
| Brief | Pourquoi ? périmètre macro | — (racine) | `SC-xxx` |
| PRD | Quoi ? (produit, pas feature) | Brief | `FR-xxx`, `SC-xxx` |
| Stack | Comment ? (fondations techniques) | PRD | — |
| Archi | Comment ? (au niveau **structure**) | PRD, Stack | invariants → `ADR-NNNN` |
| ADR | Pourquoi CE choix ? (décision figée) | Stack, Archi | `ADR-NNNN` |
| CI | Qu'est-ce qui est **vérifié** ? (contrôles exécutés) | Stack, Archi, ADR | noms de jobs |
| CLAUDE.md | Contrat opérationnel | pointe vers tous | — |

Chaque `FR-xxx` du PRD devient plus tard un critère EARS puis une vérification observable
au niveau specs. Chaque décision structurante de la phase Stack devient **un** ADR, et
chaque **invariant** de la phase Archi en devient un aussi. Garde ces IDs stables : ils
sont le fil qui relie le socle à l'implémentation.

`docs/archi.md` est la **source** que le reste consomme : sans lui, les invariants
d'architecture de la phase `ci` n'ont aucun gisement et la dimension `architecture` de la
review n'a pour référent que l'existant, c'est-à-dire la dérive déjà accumulée. Il ne porte
que des règles **falsifiables** — une règle n'y entre que si elle laisse une trace observable
dans l'arborescence ou dans les imports —, et chacune devient un candidat ADR. C'est pourquoi
il vient **après** `stack` (le constat porte sur un framework déjà choisi) et **avant** `adr`
(qui promeut ses invariants comme il promeut les décisions de la Stack).

`docs/ci.md` est le seul document du socle dont la sortie n'est pas que de la prose : ses
noms de jobs deviennent les checks requis de la forge, et `CLAUDE.md` en **lit** les
commandes du projet au lieu de les inventer. C'est aussi pourquoi il vient **avant**
`CLAUDE.md` et non après.

## Durcir le socle — `/scd-sdd:premortem socle`

Aucune gate ne juge le socle : rien ne rejoue `prd` ou `stack` pour dire s'ils tiennent. C'est
le niveau où l'erreur coûte le plus cher — dix features déclineront ce PRD, et un ADR accepté
est immuable — et celui où **rien ne la rattrape mécaniquement**.

`/scd-sdd:premortem socle` est la passe qui comble ce trou : on suppose le projet échoué six
mois plus tard et on remonte à ce que le socle omettait. Ses remédiations sont bornées aux
formes du niveau — critère `SC` mesurable, `FR` produit, item de scope EXCLU, contrainte de
Stack, contrôle `ci`, candidat ADR — et `docs/brief.md` n'est **jamais** remédié : il est
l'intention d'origine, pas une cible.

**Ce n'est pas une huitième phase.** Elle est optionnelle, ne figure dans aucune table de
dérivation, et un socle sans premortem n'est pas un socle incomplet. Méthode et formes : skill
`premortem`.

## Méthode d'interview

En **greenfield**, rien n'existe à dériver du code. La qualité vient de l'élicitation,
pas de la génération. Règle : **une question à la fois**, chaque question construite sur
la réponse précédente, jusqu'à couverture complète — puis compilation dans le template.

Amorce (Harper Reed, à adapter à la langue de l'utilisateur) :
> « Pose-moi une question à la fois pour élaborer une spec pas à pas de cette idée. Chaque question s'appuie sur mes réponses précédentes. But : une spécification détaillée. Une seule question à la fois. Voici l'idée : \<IDÉE\> »

Outil natif équivalent : `AskUserQuestion` pour les choix fermés (personas, priorités,
options de stack). L'interview s'arrête quand **tout `[NEEDS CLARIFICATION]` est
résolu** — pas avant.

## Règles d'écriture pour un agent

- **Verbe vérifiable, jamais adjectif.** « rapide / sécurisé / robuste » ne donne aucune
  cible. Écris « P99 < 50 ms », « retourne un code d'erreur structuré pour tout
  4xx/5xx ». Un adjectif = une hallucination potentielle.
- **Technology-agnostic dans le PRD.** Le PRD dit le *quoi* : aucun framework, lib ou DB.
  Tout choix technique descend dans Stack/ADR. Une fuite de stack dans le PRD casse la
  séparation.
- **Scope EXCLU explicite.** Nommer ce que le produit/la v1 ne fait PAS borne l'agent et
  évite le sur-engineering. Section obligatoire dans Brief et PRD.
- **Advisory vs déterministe.** CLAUDE.md est du contexte *advisory*, pas une couche
  d'application. Ce qui DOIT arriver à 100 % (lint, tests bloquants) est un
  hook/linter/test — jamais une phrase. Le noter dans CLAUDE.md, mais ne pas croire que
  l'écrire le garantit. **La commande qui franchit cette frontière est `/scd-sdd:ci`** :
  elle produit `docs/ci.md` et le workflow de la forge, et rend la protection de branche
  qui les rend bloquants. Une frontière qu'aucune commande ne franchit n'est pas une
  frontière, c'est un trou — d'où la phase 6.
- **La défense vient de l'extérieur de l'agent.** Un contrôle que l'agent qui code exécute
  lui-même n'atteste que de sa propre bonne foi. Le backstop est le check serveur sous
  protection de branche ; hook local et consigne écrite sont de la défense en profondeur,
  et se présentent comme telles.
- **Un seul endroit par info.** La répétition gaspille du contexte et invite la dérive.
  Lier vers `docs/`, ne pas recopier.

## État dérivé, événement journalisé

L'état du socle se **dérive des fichiers** : `docs/prd.md` existe → la phase PRD est
faite. Aucune commande n'écrit un fichier d'état — il dériverait.

Ce que la dérivation ne donne pas, c'est la **chronologie** : quand chaque phase a été
jouée. Chaque commande du socle consigne donc sa ligne dans `docs/journal/socle.md`. Le
format, la règle d'ajout et le vocabulaire attendu par phase appartiennent au skill
**`journal`**, qui est chargé au moment de consigner — ils ne sont pas recopiés ici.

## Seuils de déclenchement (constitution fondue dans CLAUDE.md)

Pas de `constitution.md` séparée pour un solo : ces principes vont dans une section de
`CLAUDE.md` (phase `contract`). Ils cadrent quand ouvrir le niveau specs en aval :

- Diff descriptible en une phrase → direct, pas de spec, pas de plan mode.
- 1 fichier, comportement localisé → `tasks.md` léger éventuel.
- Multi-fichiers / nouveau comportement / code non familier → cycle
  `/scd-sdd:kickoff-feature` complet (spec → plan → tasks → analyze).
- Décision transverse / architecturale → nouvel ADR.

## Les sept documents (templates en progressive disclosure)

Charge **uniquement** le template de la phase courante (la commande le fait pour toi) :

- `references/brief.md` — Brief / Vision.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/prd.md` — PRD / spec produit (niveau projet, pas feature).
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/stack.md` — Stack technique + méthode « options justifiées ».
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/archi.md` — architecture (`docs/archi.md`) : caractéristiques retenues,
  contraintes imposées par la stack, et la table des **invariants** falsifiables.
  - **Deux points de chargement** : par `/scd-sdd:archi`, **intégralement** ; et par
    `/scd-sdd:ci`, **conditionnellement** et pour sa seule section `## Vérification`
    (l'inventaire d'outillage), au moment de dériver les contrôles `arch-invariants`.
    L'admission appartient à `archi`, la vérification à `ci`.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/adr.md` — ADR fondateurs (Nygard, immuables), dérivés de Stack **et** des
  invariants d'Archi.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/ci.md` — contrôles CI (`docs/ci.md`), workflow de la forge, protection de
  branche et blindage local.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/ci-signature.md` — la **soupape** du garde `verifier-guard` : signature du
  commit vérifiée hors ligne contre un registre de clés versionné.
  - **Chargée conditionnellement** : par `/scd-sdd:ci` seulement, et seulement quand le
    garde `verifier-guard` est retenu. Un projet qui ne pose pas le garde ne la lit
    jamais — c'est la raison pour laquelle elle est séparée de `references/ci.md`.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/claude-md.md` — assemblage de CLAUDE.md (pointeurs + Definition of Done +
  principes fondus).
  - Sections : `role`, `template`, `guidance`, `completion`
