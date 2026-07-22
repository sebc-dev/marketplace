---
name: sync
description: "Curatif : re-rebase les PR de lot déjà ouvertes quand la dépendance dont elles dépendent vient d'être mergée (le cas « R1 mergé → rebase R2 »). Détecte la dérive depuis tasks.md + l'état des PR, calcule base/oldBase de façon déterministe, délègue le rebase à l'agent rebaser (transplant exact, --force-with-lease), retargete la base de la PR vers la branche par défaut, la passe ready et retire le label needs-sync. C'est le pont anti-orphelinage : une PR empilée créée en draft par pr-author devient mergeable en sécurité une fois sa dépendance mergée. Ne résout aucun conflit automatiquement."
argument-hint: "[NNN|slug] [Rn]"
allowed-tools:
  - Read
  - Grep
  - Glob
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

<objective>
**Réparer la dérive** d'une PR de lot déjà ouverte : quand le lot `Rk` dont elle dépend est **mergé** (dans la branche par défaut), la branche du lot dépendant `Rn` doit être re-rebasée pour ne plus porter que **ses** commits, assise sur la branche par défaut à jour — et sa PR **retargetée vers `défaut`, passée ready, et son label `needs-sync` retiré**. C'est le curatif exact du cas « **R1 mergé → rebase R2** », et le **pont anti-orphelinage** : `pr-author` a ouvert la PR empilée en **draft** (avec label `needs-sync`) pour empêcher un merge orphelinant ; `sync` est ce qui la rend mergeable **en sécurité** une fois la dépendance dans `main` — retarget sur `défaut` (plus de cul-de-sac) + rebase + ready.

Tu ne raisonnes pas sur le git : tu **détectes** la dérive, tu **calcules** `base`/`oldBase` depuis la source de vérité (`tasks.md` + état des PR), tu **délègues** le rebase à l'agent `rebaser` (qui porte la recette et le contrat d'échec), puis tu **retargetes / passes ready / retires le label**. Un lancement traite un ou plusieurs lots dérivés d'une même feature. **Aucun conflit n'est résolu automatiquement** (STOP + rapport).
</objective>

<process>

## 1. Charger la connaissance et résoudre la feature
Charge le skill `implement` (`references/tasks-parsing.md`). Résous la feature comme `/scd-implement:run` (argument `NNN`/slug, sinon la seule feature en vol, sinon `AskUserQuestion`). `slug` = suffixe après `NNN-`. Communique en français.

## 2. Détecter les lots dérivés
Détermine la base par défaut (`git symbolic-ref refs/remotes/origin/HEAD` → `main`, fallback `master`) puis `git fetch origin`. Pour chaque lot `Rn` de `tasks.md` qui a une **PR ouverte** (`gh pr list --state open --head impl/<slug>-Rn --json number,baseRefName,headRefName` ; équivalent `glab`) :
- Lis sa dépendance `dépend de : Rk`. Pas de dépendance → rien à faire pour ce lot.
- `Rk` est-il **mergé** dans la base par défaut ? Teste : `gh pr view impl/<slug>-Rk --json state,merged` **ou** `git merge-base --is-ancestor <tip-de-Rk> origin/<base-défaut>` (code 0 = mergé). La branche `impl/<slug>-Rk` peut aussi avoir disparu du remote après merge (`git ls-remote --heads origin impl/<slug>-Rk` vide) → indice de merge.
- **Dérive** = `Rk` mergé **ET** la PR de `Rn` vise encore `impl/<slug>-Rk` (`baseRefName` ≠ base par défaut) **ou** la branche de `Rn` porte encore les commits de `Rk` (`git merge-base --is-ancestor origin/<base-défaut> impl/<slug>-Rn` échoue).
- **`Rk` non mergé** → **reste empilé**, n'annonce pas de dérive (ce n'est pas encore le moment).

Si `Rn` est fourni en argument → restreins à ce lot. Si aucun lot dérivé → annonce « rien à re-rebaser » et STOP.

## 3. Calculer base/oldBase (déterministe, sans deviner)
Pour chaque lot dérivé `Rn` dépendant de `Rk` mergé :
- `oldBase` = `impl/<slug>-Rk` (la branche d'où `Rn` a été cuttée — encore présente localement ; c'est ce qui rend le `--onto` robuste au squash).
- `base` = **branche par défaut** du repo (puisque `Rk` y est mergé).

## 4. Déléguer le rebase à l'agent rebaser
Pour chaque lot dérivé, invoque l'agent **`scd-implement:rebaser`** (Task) avec `{ lotBranch: "impl/<slug>-Rn", base: "<base-défaut>", oldBase: "impl/<slug>-Rk", push: true }`. L'agent transplante `oldBase..lotBranch` sur `origin/<base>` et pousse en `--force-with-lease`. Il **avorte** proprement sur conflit (`blocked-conflict`) — tu ne résous **jamais** un conflit à sa place.

## 5. Retargeter la base, passer ready, retirer `needs-sync`
Ne fais cette étape que si le rebaser n'a **pas** bloqué (`rebased` ou `up-to-date`) — un rebase bloqué (`blocked-conflict`/`blocked-push`) laisse la PR **en l'état** (toujours draft, toujours empilée) : tu ne la rends surtout pas mergeable tant que ses commits ne sont pas proprement sur `défaut`.

En trois gestes (idempotents — no-op si déjà faits) :
1. **Retarget** vers `défaut` si la PR vise encore `impl/<slug>-Rk` : `gh pr edit <number> --base <défaut>` (`glab mr update <iid> --target-branch <défaut>`). Si `impl/<slug>-Rk` a été supprimée au merge, GitHub a pu retargeter automatiquement — **vérifie `baseRefName` avant d'agir** (ne retargete pas ce qui l'est déjà).
2. **Passer ready** (la PR empilée était en draft) : `gh pr ready <number>` (`glab mr update <iid> --ready`). C'est ce qui lève la barrière : la PR n'est plus « à ne pas merger ». Si elle était déjà ready, no-op.
3. **Retirer le label `needs-sync`** (best-effort, non bloquant) : `gh pr edit <number> --remove-label needs-sync` (`glab mr update <iid> --unlabel needs-sync`). Le label `stacked` peut rester (trace historique) ou être retiré aussi — au choix ; `needs-sync` **doit** partir puisque la synchro est faite.

## 6. Rendre compte
Par lot traité : statut du rebaser (`rebased` / `up-to-date` / `blocked-*`), push effectué, base de PR retargetée, **PR passée ready**, label `needs-sync` retiré. Récapitule les lots qui **restent empilés** (dépendance non mergée → toujours draft, c'est voulu) et ceux **bloqués** (`blocked-conflict` → à rebaser à la main, la PR reste draft ; `blocked-push` → refetch puis relancer `/scd-implement:sync`).

</process>

<guidelines>
- **Pont anti-orphelinage.** Le passage ready + retrait de `needs-sync` n'a lieu **qu'après** un rebase réussi qui repose les commits sur `défaut` **et** un retarget de la base. Ne passe **jamais** une PR ready tant qu'elle vise encore une branche de lot (ce serait rouvrir la faille d'orphelinage que le draft ferme).
- **Curatif ciblé.** Ne rebase que des lots à **PR ouverte** dont la dépendance est **mergée**. Un lot pas encore lancé, ou dont la dépendance n'est pas mergée, n'est pas concerné (il reste draft — c'est voulu).
- **Jamais de résolution de conflit.** L'agent avorte ; tu rapportes. `blocked-conflict` = intervention humaine.
- **Jamais `--force` sec** : l'agent n'utilise que `--force-with-lease`.
- Tu ne modifies ni `tasks.md`, ni le code : tu réalignes des branches/PR déjà produites.
- Deux dépendances mergées / chaînes multiples : traite dans l'ordre des dépendances (rebase `Rk` avant `Rk+1`) pour ne pas rebaser sur une base elle-même dérivée.
</guidelines>

<skill>
- `implement` — charge `references/tasks-parsing.md`.
</skill>
</output>
