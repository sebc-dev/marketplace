---
name: project-docs
description: |
  Connaissance transverse pour le kickoff documentaire d'un projet greenfield :
  la chaîne de traçabilité Brief → PRD → Stack → ADR → CLAUDE.md, la méthode
  d'interview « une question à la fois », les règles d'écriture pour un agent
  (verbe vérifiable, technology-agnostic, scope EXCLU, advisory vs déterministe)
  et les templates copy-paste de chaque document. Se charge pendant les commandes
  /scd-project-docs:* (kickoff, brief, prd, stack, adr, contract). Porte UNIQUEMENT
  les documents de gestion de projet créés une fois au démarrage — pas les specs
  par feature (spec/plan/tasks), qui relèvent d'un autre workflow.
---

# Documents de kickoff projet (greenfield)

Ce skill outille la **création** des documents de gestion de projet « génériques » — ceux qu'on écrit **une fois**, au démarrage. Cinq artefacts, produits dans l'ordre :

`docs/brief.md` → `docs/prd.md` → `docs/stack.md` → `docs/adr/NNNN-*.md` → `CLAUDE.md`

Les specs par feature (spec/plan/tasks) sont **hors périmètre** : elles relèvent d'un workflow séparé, en aval. Ici on pose le socle qu'elles consommeront.

## La chaîne de traçabilité

Le mot-pivot est **traçabilité** : chaque document *trace vers* le précédent, et rien ne se répète (un seul endroit par info — on **lie**, on ne recopie pas).

| Document | Répond à | Trace vers | IDs |
|---|---|---|---|
| Brief | Pourquoi ? périmètre macro | — (racine) | `SC-xxx` |
| PRD | Quoi ? (produit, pas feature) | Brief | `FR-xxx`, `SC-xxx` |
| Stack | Comment ? (fondations techniques) | PRD | — |
| ADR | Pourquoi CE choix ? (décision figée) | Stack | `ADR-NNNN` |
| CLAUDE.md | Contrat opérationnel | pointe vers tous | — |

Chaque `FR-xxx` du PRD devient plus tard un test dans le workflow specs. Chaque décision structurante de la phase Stack devient **un** ADR. Garde ces IDs stables : ils sont le fil qui relie le socle à l'implémentation future.

## Méthode d'interview

En **greenfield**, rien n'existe à dériver du code. La qualité vient de l'élicitation, pas de la génération. Règle : **une question à la fois**, chaque question construite sur la réponse précédente, jusqu'à couverture complète — puis compilation dans le template.

Amorce (Harper Reed, à adapter à la langue de l'utilisateur) :
> « Pose-moi une question à la fois pour élaborer une spec pas à pas de cette idée. Chaque question s'appuie sur mes réponses précédentes. But : une spécification détaillée. Une seule question à la fois. Voici l'idée : \<IDÉE\> »

Outil natif équivalent : `AskUserQuestion` pour les choix fermés (personas, priorités, options de stack). L'interview s'arrête quand **tout `[NEEDS CLARIFICATION]` est résolu** — pas avant.

## Règles d'écriture pour un agent

- **Verbe vérifiable, jamais adjectif.** « rapide / sécurisé / robuste » ne donne aucune cible. Écris « P99 < 50 ms », « retourne un code d'erreur structuré pour tout 4xx/5xx ». Un adjectif = une hallucination potentielle.
- **Technology-agnostic dans le PRD.** Le PRD dit le *quoi* : aucun framework, lib ou DB. Tout choix technique descend dans Stack/ADR. Une fuite de stack dans le PRD casse la séparation.
- **Scope EXCLU explicite.** Nommer ce que le produit/la v1 ne fait PAS borne l'agent et évite le sur-engineering. Section obligatoire dans Brief et PRD.
- **Advisory vs déterministe.** CLAUDE.md est du contexte *advisory*, pas une couche d'application. Ce qui DOIT arriver à 100 % (lint, tests bloquants) est un hook/linter/test — jamais une phrase. Le noter dans CLAUDE.md, mais ne pas croire que l'écrire le garantit.
- **Un seul endroit par info.** La répétition gaspille du contexte et invite la dérive. Lier vers `docs/`, ne pas recopier.

## Seuils de déclenchement (constitution fondue dans CLAUDE.md)

Pas de `constitution.md` séparée pour un solo : ces principes vont dans une section de `CLAUDE.md` (phase `contract`). Ils cadrent quand déclencher le workflow specs en aval :

- Diff descriptible en une phrase → direct, pas de spec, pas de plan mode.
- 1 fichier, comportement localisé → `tasks.md` léger éventuel.
- Multi-fichiers / nouveau comportement / code non familier → cycle spec→plan→tasks complet.
- Décision transverse / architecturale → nouvel ADR.

## Les cinq documents (templates en progressive disclosure)

Charge **uniquement** le template de la phase courante (la commande le fait pour toi) :

- `references/brief.md` — Brief / Vision.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/prd.md` — PRD / spec produit (niveau projet, pas feature).
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/stack.md` — Stack technique + méthode « options justifiées ».
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/adr.md` — ADR fondateurs (Nygard, immuables), dérivés de Stack.
  - Sections : `role`, `template`, `guidance`, `completion`
- `references/claude-md.md` — assemblage de CLAUDE.md (pointeurs + Definition of Done + principes fondus).
  - Sections : `role`, `template`, `guidance`, `completion`
