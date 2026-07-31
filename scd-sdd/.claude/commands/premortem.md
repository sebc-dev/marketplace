---
description: "Phase 6 des specs, optionnelle : durcissement adverse par premortem, APRÈS la gate analyze. Trois sous-agents — un projette l'échec de la feature et remonte à la cause dans le contrat, un trie les risques, un applique les remédiations APRÈS approbation humaine. Écrit dans spec/plan/tasks, reste documentaire, et impose une re-passe analyze."
argument-hint: "[NNN ou slug — optionnel, résolu sinon]"
allowed-tools:
  - Read
  - Glob
  - Edit
  - AskUserQuestion
  - Task
---

## Contexte

`analyze` a déjà attesté que le contrat est **conforme**. Cette phase pose une question
différente, en contexte frais : **s'il était implémenté tel quel, la feature échouerait-elle
quand même ?**

Un contrat peut être parfaitement tracé, testable et bien découpé, et pourtant omettre le cas
limite, le chemin d'erreur ou l'hypothèse tue qui le fera échouer une fois livré. C'est un
**premortem** : on se projette après la livraison **en supposant l'échec**, et on remonte à ce
que le contrat contenait — ou omettait — qui l'a rendu possible.

Contrairement à `analyze`, cette phase **écrit** : elle durcit les documents. Elle reste
purement documentaire (aucun code, aucun test), et **l'humain décide du quoi** — ici via un
gate d'approbation explicite avant toute modification.

Ratio : 40% humain / 60% AI (les deux premiers agents tournent en autonomie ; l'humain
approuve, le troisième applique).

## Règles absolues

- **Rien n'est modifié avant l'approbation humaine.** Les remédiations validées sont
  *proposées*, jamais appliquées d'office.
- **Tu n'appliques que l'ensemble approuvé.** Aucun ajout de ton cru en cours de route — ce
  serait du scope creep ayant contourné le seul gate qui existe.
- **Tout reste documentaire.** Une remédiation est un changement de `spec.md`, `plan.md` ou
  `tasks.md`, ou un candidat dans `docs/adr/_candidates/`. Jamais de code, jamais l'édition
  d'un ADR accepté.
- **Tu ne doubles pas `analyze`.** On ne rejuge ni EARS, ni backref, ni verticalité : on
  cherche les modes de défaillance que la conformité **ne voit pas**.
- **Calibrage.** Pour un diff descriptible en une phrase, saute cette passe (cf. seuils du
  skill). Le premortem paie sur les features non triviales.

## Processus

1. **Résous la feature cible** — règle de résolution du skill `feature-specs`, section
   « Cibler une feature ». Candidature propre à cette phase : la feature disposant d'un
   `tasks.md` **ayant passé `analyze`**. **Annonce la cible retenue.**

   Vérifie que la gate est au vert : le premortem se joue **après** `analyze`, jamais à sa
   place. La section `## NNN-slug` de `docs/JOURNAL.md` en porte la trace datée — vérifie aussi
   que les documents n'ont pas bougé depuis. Sinon, renvoie vers `/scd-sdd:analyze NNN`.

2. **Charge la référence** : `references/premortem.md` du skill `feature-specs`.

3. **Anime le premortem** — délègue à `premortem-facilitator` (outil `Task`) sur le chemin
   cible. Il rend une liste de risques classée par impact × vraisemblance.

4. **Valide et trie** — délègue à `premortem-validator` en lui passant la liste du facilitateur
   **et** le chemin. Il rejette la spéculation non ancrée, le déjà-couvert, le scope creep et
   le style ; il retient les vrais trous et les normalise en remédiations concrètes.
   *(Séquentiel : le valideur a besoin de la sortie du facilitateur.)*

5. **Gate d'approbation humain** — présente les remédiations retenues en **liste numérotée**,
   chacune avec : fichier, ID cible, type de changement, texte proposé. Demande lesquelles
   appliquer — toutes, une sélection par numéro, ou aucune.
   - ≤ 4 remédiations → `AskUserQuestion` avec `multiSelect` ;
   - au-delà → présente la liste et attends la réponse en clair.

   **Rien n'est écrit tant que l'humain n'a pas tranché.** S'il ne retient rien, arrête-toi et
   dis-le — c'est un résultat valide.

6. **Applique** — délègue à `premortem-applier` en lui passant **uniquement** l'ensemble
   approuvé. Il inscrit les changements en préservant la traçabilité (IDs stables, prochain ID
   libre, backref PRD, critère EARS conforme, tâche dans le bon lot) et rend le journal des
   changements.

7. **Consigne au journal** (voir ci-dessous).

8. **Re-gate** — le contrat a changé : recommande `/scd-sdd:analyze NNN` pour reconfirmer
   `PRÊT` avant le passage de main.

## Ce que tu NE fais PAS

- Aucune écriture avant l'approbation ; aucune remédiation hors de l'ensemble approuvé.
- Tu ne prescris pas **comment** implémenter, tu n'écris pas de code, tu n'exécutes aucun test.
- Tu n'édites aucun ADR accepté — candidats seulement (le hook `block-adr-edits` le bloque de
  toute façon, `exit 2`).
- Tu ne rejoues pas `analyze` toi-même : tu la recommandes.

## Consigne au journal

Le premortem **édite `spec.md` / `plan.md` / `tasks.md` sans y laisser le moindre marqueur** :
son passage n'est dérivable d'aucun fichier. Sans cette ligne, il est invisible — c'est
pourquoi il n'apparaît pas dans la table de dérivation du skill.

Charge le skill `journal` et ajoute **une ligne** dans la section `## NNN-slug` de
`docs/JOURNAL.md`, par `Edit` ciblé :

- **Phase** : `premortem`
- **Résultat** : le nombre de remédiations appliquées et les IDs créés.
  Exemple : `3 remédiations appliquées (FR-007 ajouté · T12 dans R2 · 1 item EXCLU)`.

Une passe sans remédiation retenue se consigne aussi : `0 remédiation — contrat inchangé`.
C'est un fait utile, et l'absence de ligne se lirait comme un premortem jamais joué.

## Skill active

- `feature-specs` — charge `references/premortem.md`.
- `journal` — contrat de `docs/JOURNAL.md`.
- Subagents, dans cet ordre : `premortem-facilitator` → `premortem-validator` → *[gate
  humain]* → `premortem-applier`.

## À la fin

- **Remédiations appliquées** : « Contrat durci — R remédiations inscrites. **Relance
  `/scd-sdd:analyze NNN`** pour reconfirmer `PRÊT` avant le passage de main. »
- **Rien retenu ou approuvé** : « Premortem passé sans remédiation : le contrat tient tel quel.
  La main passe à l'implémentation — `/scd-sdd:run NNN R1`. »

Puis boucle le cycle : « Feature suivante : `/clear`, puis `/scd-sdd:kickoff-feature [feature]`
» — ou `/scd-sdd:status-specs` si plusieurs features sont en vol.
