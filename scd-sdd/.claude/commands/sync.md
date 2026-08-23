---
description: "Curatif anti-orphelinage (orphelinage : une PR de ticket mergée dans une branche de ticket intermédiaire au lieu de la branche par défaut — son code n'arrive jamais dans le produit) : re-rebase les PR de ticket déjà ouvertes quand la dépendance dont elles dépendent vient d'être mergée (le cas « 01 mergé → rebase 02 »). Détecte la dérive depuis les tickets et l'état des PR, calcule base/oldBase de façon déterministe, délègue le rebase à l'agent rebaser, puis retargete la base de la PR vers la branche par défaut, la passe ready et retire le label needs-sync. Ne résout aucun conflit automatiquement."
argument-hint: "[NNN|slug] [NN]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Bash(git fetch *)
  - Bash(git status *)
  - Bash(git rev-parse *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git ls-remote *)
  - Bash(git log *)
  - Bash(gh pr *)
  - Bash(glab mr *)
  - Task
  - AskUserQuestion
---

## Contexte

Tu **répares la dérive** d'une PR de ticket déjà ouverte : quand le ticket `Rk` dont elle dépend est
**mergé** dans la branche par défaut, la branche du ticket dépendant `NN` doit être re-rebasée pour ne
plus porter que **ses** commits, assise sur la branche par défaut à jour — et sa PR **retargetée
vers `défaut`, passée ready, et son label `needs-sync` retiré**.

C'est le curatif exact du cas « **R1 mergé → rebase R2** », et le **pont anti-orphelinage** :
`pr-author` a ouvert la PR empilée en **draft** (avec label `needs-sync`) pour empêcher un merge
orphelinant ; `sync` est ce qui la rend mergeable **en sécurité** une fois la dépendance dans
`main` — retarget sur `défaut` (plus de cul-de-sac) + rebase + ready.

Tu ne raisonnes pas sur le git : tu **détectes** la dérive, tu **calcules** `base`/`oldBase` depuis
la source de vérité (le fichier du ticket + état des PR), tu **délègues** le rebase à l'agent `rebaser` (qui
porte la recette et le contrat d'échec), puis tu **retargetes / passes ready / retires le label**.

Ratio : 15% humain / 85% AI (mécanique ; l'humain n'intervient que sur conflit).

## Règles absolues

- **Jamais de résolution de conflit.** L'agent avorte, tu rapportes. `blocked-conflict` =
  intervention humaine.
- **Jamais `--force` sec** : l'agent n'utilise que `--force-with-lease`.
- **Ne passe jamais une PR ready tant qu'elle vise encore une branche de ticket.** Ce serait rouvrir la
  faille d'orphelinage que le draft ferme. Le passage ready n'a lieu qu'**après** un rebase réussi
  **et** un retarget.
- **Curatif ciblé.** Ne rebase que des tickets à **PR ouverte** dont la dépendance est **mergée**. Un
  ticket pas encore lancé, ou dont la dépendance n'est pas mergée, reste draft — c'est voulu.
- Tu ne modifies ni le fichier du ticket, ni le code : tu réalignes des branches et des PR déjà produites.

## Définitions

Le **sens** de `défaut` et de *PR empilée* est porté par le skill `implement`, § Anti-orphelinage,
que tu charges. Ici, les seules **invocations**, partagées avec `/scd-sdd:status` et
`/scd-sdd:reland` :

- `défaut` : `git symbolic-ref refs/remotes/origin/HEAD` → suffixe après `origin/`
  (repli `main`/`master`).
- Branche du ticket `Rk` : `impl/<slug>-Rk`, où `slug` = suffixe de `featureDir` après `NNN-`.

## Processus

1. **Résous la feature cible** selon la section « Cibler une feature » du skill `specs` —
   référencée, jamais recopiée. Charge le skill `implement` (`references/tickets-parsing.md`).
   Communique en français.

2. **Détecte les tickets dérivés.** Détermine `défaut`, puis `git fetch origin`. Pour chaque ticket `NN` de
   le fichier du ticket ayant une **PR ouverte** (`gh pr list --state open --head impl/<slug>-NN --json
   number,baseRefName,headRefName` ; équivalent `glab`) :
   - Lis sa dépendance `dépend de : Rk`. Pas de dépendance → rien à faire pour ce ticket.
   - `Rk` est-il **mergé** dans `défaut` ? Teste `gh pr view impl/<slug>-Rk --json state,merged`
     **ou** `git merge-base --is-ancestor <tip-de-Rk> origin/<défaut>` (code 0 = mergé). La branche
     `impl/<slug>-Rk` peut aussi avoir disparu du remote après merge
     (`git ls-remote --heads origin impl/<slug>-Rk` vide) → indice de merge.
   - **Dérive** = `Rk` mergé **ET** ( la PR de `NN` vise encore `impl/<slug>-Rk`
     (`baseRefName` ≠ `défaut`) **ou** la branche de `NN` porte encore les commits de `Rk`
     (`git merge-base --is-ancestor origin/<défaut> impl/<slug>-NN` échoue) ).
   - **`Rk` non mergé** → le ticket **reste empilé**, n'annonce **pas** de dérive : ce n'est pas encore
     le moment.

   `NN` fourni en argument → restreins à ce ticket. Aucun ticket dérivé → annonce « rien à re-rebaser » et
   STOP.

3. **Calcule base/oldBase — déterministe, sans deviner.** Pour chaque ticket dérivé `NN` dépendant de
   `Rk` mergé :
   - `oldBase` = `impl/<slug>-Rk` — la branche d'où `NN` a été cuttée, encore présente localement ;
     c'est ce qui rend le `--onto` robuste au squash.
   - `base` = **`défaut`**, puisque `Rk` y est mergé.

4. **Délègue le rebase.** Pour chaque ticket dérivé, invoque l'agent **`scd-sdd:rebaser`** (Task) avec
   `{ lotBranch: "impl/<slug>-NN", base: "<défaut>", oldBase: "impl/<slug>-Rk", push: true }`.
   L'agent transplante `oldBase..lotBranch` sur `origin/<base>` et pousse en `--force-with-lease`. Il
   **avorte** proprement sur conflit (`blocked-conflict`) — tu ne résous **jamais** un conflit à sa
   place.

5. **Retargete, passe ready, retire `needs-sync`.** Ne fais cette étape que si le rebaser **n'a pas
   bloqué** (`rebased` ou `up-to-date`). Un rebase bloqué (`blocked-conflict` / `blocked-push`) laisse
   la PR **en l'état** — toujours draft, toujours empilée : tu ne la rends surtout pas mergeable tant
   que ses commits ne sont pas proprement sur `défaut`.

   En trois gestes, tous **idempotents** (no-op si déjà faits) :
   1. **Retarget** vers `défaut` si la PR vise encore `impl/<slug>-Rk` :
      `gh pr edit <number> --base <défaut>` (`glab mr update <iid> --target-branch <défaut>`). Si
      `impl/<slug>-Rk` a été supprimée au merge, GitHub a pu retargeter automatiquement — **vérifie
      `baseRefName` avant d'agir**.
   2. **Passe ready** (la PR empilée était en draft) : `gh pr ready <number>`
      (`glab mr update <iid> --ready`). C'est ce qui lève la barrière. Déjà ready → no-op.
   3. **Retire le label `needs-sync`** (best-effort, non bloquant) :
      `gh pr edit <number> --remove-label needs-sync` (`glab mr update <iid> --unlabel needs-sync`).
      Le label `stacked` peut rester comme trace historique ; `needs-sync` **doit** partir puisque la
      synchro est faite.

6. **Rends compte.** Par ticket traité : statut du rebaser (`rebased` / `up-to-date` / `blocked-*`),
   push effectué, base de PR retargetée, **PR passée ready**, label retiré. Récapitule les tickets qui
   **restent empilés** (dépendance non mergée → toujours draft, c'est voulu) et ceux **bloqués**
   (`blocked-conflict` → à rebaser à la main, la PR reste draft ; `blocked-push` → refetch puis
   relancer `/scd-sdd:sync`).


## Ce que tu NE fais PAS

- Tu ne résous aucun conflit, tu ne forces aucun push.
- Tu ne rebases pas un ticket dont la dépendance n'est pas mergée — il doit rester draft.
- Tu ne passes pas ready une PR qui vise encore une branche de ticket.
- Tu ne lances aucun ticket (`/scd-sdd:run`), tu ne rapatries aucun orphelin (`/scd-sdd:reland`).
- Tu ne modifies ni le fichier du ticket, ni le contrat, ni le code.

## Skill active

- `specs` — section « Cibler une feature » pour la résolution de la cible.
- `implement` — charge `references/tickets-parsing.md` ; définitions de l'anti-orphelinage.

## À la fin

Renvoie vers `/scd-sdd:status NNN` pour reconfirmer que les PR sont classées **OK**. S'il reste
des tickets empilés en attente, rappelle l'ordre : merger la dépendance, **puis** relancer
`/scd-sdd:sync NNN`.

Deux dépendances mergées ou chaînes multiples : traite dans l'ordre des dépendances (rebaser `Rk`
avant `Rk+1`) pour ne pas rebaser sur une base elle-même dérivée.
