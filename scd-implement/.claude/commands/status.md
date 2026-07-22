---
argument-hint: "[NNN|slug] (ou rien — scanne specs/)"
description: "Tableau de bord d'implémentation. Scanne specs/, dérive pour chaque feature l'avancement de ses lots Rn depuis les cases cochées de tasks.md, dit quel lot lancer ensuite, et classe chaque PR de lot selon sa sûreté de merge : OK, ⚠️ DANGEREUX (empilé, dépendance mergée — merger orphelinerait), ⚠️ EMPILÉ EN ATTENTE (dépendance pas encore mergée), 🔴 ORPHELIN (déjà mergé hors de la branche par défaut, code absent de main). Lecture seule."
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(git fetch *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git rev-parse *)
  - Bash(git show *)
  - Bash(git ls-remote *)
  - Bash(gh pr list *)
  - Bash(gh pr view *)
  - Bash(glab mr list *)
  - Bash(glab mr view *)
---

## Contexte

Tu réponds à « **où en est l'implémentation, et quelles PR sont sûres à merger ?** ». Le développeur reprend après un `/clear` et veut savoir quels lots `Rn` sont faits, lequel lancer ensuite, et surtout **quelles PR de lot il ne doit pas merger telles quelles** — le stacking a une faille : merger une PR empilée alors que sa base est encore une branche de lot intermédiaire envoie le code dans un cul-de-sac, jamais dans `main` (code **orphelin**). Tu scannes, tu dérives depuis les cases de `tasks.md`, tu **classes** chaque PR, tu orientes.

Ratio : 10% humain / 90% AI (lecture mécanique ; l'humain choisit la suite).

## Règles absolues

- **Lecture seule.** Tu ne modifies aucun fichier et ne lances aucun workflow. `git fetch` (mise à jour des refs de suivi) est toléré — il ne touche ni l'arbre de travail ni l'historique local ; tout le reste est de la lecture (`git show`, `git merge-base`, `gh pr list/view`).
- **Dérive l'état des cases de `tasks.md`**, pas du contexte (effacé) ni d'un fichier d'état (il dériverait). Ici, contrairement au `status` de `scd-feature-specs`, les cases `[x]` **sont** la source de vérité : c'est ce plugin (via `progress-recorder`) qui les coche.
- **Dégradation propre sans `gh`/`glab`.** Si aucune CLI de forge n'est disponible (ou pas de remote), tu ne peux pas lire l'état des PR : classe alors sur le seul signal git (cases `tasks.md` à `origin/<défaut>` + ancêtres), **signale que l'état PR est indisponible**, et n'annonce ni DANGEREUX ni ORPHELIN à tort.

## Définitions (réutilisées par `sync` et `reland`)

- **`défaut`** = branche par défaut du repo : `git symbolic-ref refs/remotes/origin/HEAD` → suffixe après `origin/` (fallback `main`/`master`).
- **Lot `Rk`** → branche `impl/<slug>-Rk` ; sa PR `Pk` se trouve par `gh pr list --head impl/<slug>-Rk --state all --json number,state,baseRefName,headRefName,headRefOid` (ou `--search "head:impl/<slug>-Rk"`). `slug` = suffixe de `featureDir` après `NNN-`.
- **PR empilée** : `P.baseRefName` == une branche de lot `impl/<slug>-R*` (donc **≠ `défaut`**).
- **Lot arrivé dans `main`** (signal de **contenu**, robuste au squash/rebase/merge-commit) : ses tâches `Tn` sont **cochées** dans `origin/<défaut>:specs/<NNN-slug>/tasks.md` — lis-le par `git show origin/<défaut>:specs/<NNN-slug>/tasks.md`. Corroboration git (fiable pour un merge-commit ; le signal contenu prime pour un squash) : `git merge-base --is-ancestor <headRefOid> origin/<défaut>` (code 0 = arrivé). **Le signal contenu est prioritaire** sur l'ancêtre git.

## Processus

1. Charge la référence : lis `references/tasks-parsing.md` du skill `implement` (parsing des lots `Rn`, tâches `Tn`, `dépend de :`).
2. **Prépare le signal `main`** (best-effort, saute si indisponible) : détermine `défaut`, puis `git fetch origin` (met à jour `origin/<défaut>` et les branches de lot). Récupère `origin/<défaut>:specs/<NNN-slug>/tasks.md` via `git show` pour lire les cases **telles qu'elles sont dans `main`** (≠ le `tasks.md` local, qui peut porter des cases cochées sur une branche de lot non mergée).
3. Scanne `specs/` : pour chaque `NNN-slug/tasks.md` **local**, énumère les lots `Rn` et calcule leur **avancement** (cases locales) :
   - **fait** : toutes les tâches `Tn` du lot cochées `[x]` ;
   - **en cours** : certaines cochées, d'autres non ;
   - **à faire** : aucune cochée.
4. Détermine le **prochain lot lançable** : le premier `Rn` non fait dans l'ordre des dépendances **dont toutes les dépendances (`dépend de : Rn`) sont faites**. Signale tout lot **bloqué** (dépendance non faite).
5. **Classer la sûreté de merge de chaque PR de lot** (best-effort ; saute proprement si `gh`/`glab`/remote indisponible et signale « état PR indisponible »). Pour chaque lot `Rn`, récupère sa PR (§Définitions) et applique **exactement** cette table :

   | État | Condition | Action recommandée |
   |---|---|---|
   | **OK** | PR `MERGED` **et** lot arrivé dans `main` ; **ou** PR `OPEN` **non empilée** (base = `défaut`) | rien — sûre / en attente de review |
   | **⚠️ DANGEREUX** | PR `OPEN` **∧** base = `impl/<slug>-Rk` **∧** `Rk` **arrivé** dans `main` | `/scd-implement:sync NNN Rn` — merger maintenant **orphelinerait** ; sync rebase sur `défaut`, retargete la base, passe ready |
   | **⚠️ EMPILÉ EN ATTENTE** | PR `OPEN` **∧** base = `impl/<slug>-Rk` **∧** `Rk` **pas encore** dans `main` | merger d'abord `Rk`, **puis** `/scd-implement:sync NNN Rn` |
   | **🔴 ORPHELIN** | PR `MERGED` **∧** base ≠ `défaut` **∧** lot **absent** de `main` (Tn non cochés dans `origin/<défaut>`, corroboré par `! git merge-base --is-ancestor <headRefOid> origin/<défaut>`) | `/scd-implement:reland NNN Rn` — rapatrie le lot sur `main` par cherry-pick + nouvelle PR |

   **Cas limite — base pointant une branche de lot supprimée.** Si `P.baseRefName` désigne une branche `impl/<slug>-Rk` qui n'existe plus (GitHub a auto-retargeté la PR après merge de `Rk`), recalcule l'état depuis la **base courante** de la PR (souvent déjà `défaut`) — **ne signale pas de dérive à tort**.
6. Produis le tableau de bord (voir `<report>`), avec la **prochaine commande** prête à copier pour chaque feature en vol et la classification des PR.
7. Si `analyze` n'a manifestement pas été passée (spec avec `[NEEDS CLARIFICATION]`, `tasks.md` absent), signale-le : l'implémentation ne doit pas démarrer sur un contrat non validé.

## Ce que tu NE fais PAS

- Tu ne lances aucun lot toi-même (c'est `/scd-implement:run`), tu ne rebases ni ne relandes (c'est `sync`/`reland`).
- Tu ne lis pas le code ni les diffs, tu ne juges pas la qualité de l'implémentation — seulement l'avancement dérivé des cases et l'état/base des PR.
- Tu n'écris rien : `status` est **idempotent** et relançable sans effet.

<report>
```
## Implémentation — specs/

### NNN-slug
Lots : X faits · Y en cours · Z à faire
- [x] R1 — <capability>           (fait)
- [~] R2 — <capability>           (en cours : T3, T4 restants)
- [ ] R3 — <capability>           (à faire · bloqué par R2)
Prochain : /scd-implement:run NNN R2

Sûreté de merge des PR (base par défaut : main)
| Lot | PR   | État                 | Base            | Action                          |
|-----|------|----------------------|-----------------|---------------------------------|
| R1  | #10  | OK (mergé, dans main)| main            | —                               |
| R2  | #12  | ⚠️ DANGEREUX         | impl/slug-R1    | /scd-implement:sync NNN R2      |
| R4  | #14  | ⚠️ EMPILÉ EN ATTENTE | impl/slug-R3    | merger R3 d'abord, puis sync    |
| R6  | #6   | 🔴 ORPHELIN          | impl/slug-R5    | /scd-implement:reland NNN R6    |

### MMM-autre
...

Recommandation : relander R6 (code absent de main) avant tout, puis sync R2.
```
> Sans `gh`/`glab` : remplace la colonne État par « PR indisponible (pas de forge) » et ne classe que l'avancement + le signal `main` (arrivé/absent).
</report>

## Skill active

- `implement` — charge `references/tasks-parsing.md`.

## À la fin

Donne la prochaine commande recommandée, prête à copier — en **priorisant** les 🔴 ORPHELIN (code absent de `main`) puis les ⚠️ DANGEREUX (risque d'orphelinage au prochain merge). Si `specs/` est vide ou sans `tasks.md` : « Aucune feature prête à implémenter. Termine un cycle `scd-feature-specs` (jusqu'à `analyze`). »
