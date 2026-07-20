---
name: run-parallel
description: "Lance PLUSIEURS lots Rn d'une feature en parallèle réel via des worktrees git isolés. Résout chaque lot, sa base (auto-stacking) et sa ligne Fichiers:, calcule la co-parallélisabilité (lots aux fichiers disjoints ET sans dépendance mutuelle non mergée → parallèles ; sinon sérialisés/empilés en chaîne --base), fetch une fois, puis exécute le workflow orchestrateur implement-parallel en arrière-plan. Chaque lot passe par implement-lot en mode worktree et se termine par sa propre PR ready-for-review."
argument-hint: "[NNN|slug] <Rn> [<Rn> …] [--base <branche>]"
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
  - Bash(git show-ref *)
  - Bash(find *)
  - Workflow
  - AskUserQuestion
---

<objective>
Implémenter **plusieurs lots de review `Rn`** d'une même feature **en parallèle réel**, chacun isolé dans son propre **worktree git** — sans collision sur le HEAD/arbre unique du checkout de session, et sans conflit de contenu au merge.

Deux couches distinctes, à ne jamais confondre :
- **Couche 1 — collision d'exécution.** Résolue par le **mode worktree** de `implement-lot` : chaque lot a son checkout, donc plusieurs lots peuvent tourner en même temps. C'est ce que ce point d'entrée active.
- **Couche 2 — conflit de contenu.** Deux lots qui éditent le **même fichier** ne peuvent pas être co-lancés sans risque de conflit au merge : l'isolation d'exécution n'y change rien. Ils doivent être **sérialisés/empilés** (chaîne `--base`), pas parallélisés. Le marqueur `[P]` de `tasks.md` encode déjà « parallélisable » (fichiers disjoints) ; ici on le **généralise** en dérivant la disjonction des ensembles `Fichiers :`.

Tu ne lis ni n'écris le code : tu **résous les cibles**, tu **calcules le plan de co-parallélisabilité** (quelles chaînes, quelles bases), puis tu **lances le workflow orchestrateur**. Tout le travail sur le code se fait dans les subagents des workflows enfants.
</objective>

<process>

## 1. Charger la connaissance transverse
Charge le skill `implement` (`references/tasks-parsing.md` pour la résolution et la ligne `Fichiers :`, `references/green-gate.md` pour la discipline rouge/vert). Communique en français.

## 2. Résoudre la feature cible
Comme `/scd-implement:run` : argument `NNN`/slug → match sur préfixe ou slug dans `specs/` ; sinon la seule feature avec des lots non finis (l'annoncer) ; sinon `AskUserQuestion` ou renvoi vers `/scd-implement:status`. `slug` = suffixe de `featureDir` après `NNN-`.

## 3. Vérifier les préconditions (STOP si non remplies)
- `specs/NNN-feature/tasks.md` existe. Sinon → STOP, renvoie vers `scd-feature-specs`.
- **Gate `analyze` au vert** (comme `run`) : si `spec.md` contient `[NEEDS CLARIFICATION]`, ou si `plan.md`/`tasks.md` manquent → STOP et renvoie vers la phase manquante ; propose `/scd-feature-specs:analyze NNN`.
- **Arbre de travail** : contrairement à `/scd-implement:run`, un arbre **sale est toléré** ici — le mode worktree crée chaque branche via `git worktree add`, qui ne touche pas au checkout principal. (Signale-le si l'arbre est sale, pour rassurer : rien n'y sera modifié.)
- **Lots** : au moins **deux** `Rn` demandés (un seul → renvoie vers `/scd-implement:run`, plus léger). Les `Rn` sont donnés en arguments ; à défaut, propose les lots non finis et lançables via `AskUserQuestion`.

## 4. Résoudre chaque lot : Fichiers, dépendances, base
Pour **chaque** `Rn` demandé, extrais de `tasks.md` :
- **Fichiers `F(Rn)`** : la ligne `Fichiers : …` du lot (chemins). C'est l'ensemble qui décide la disjonction. Si un lot n'a pas de ligne `Fichiers :`, dérive-la de l'union des fichiers de ses tâches, ou — à défaut — considère-le **non disjoint** de tout (prudence : on ne co-lance pas ce qu'on ne peut pas prouver disjoint).
- **Dépendances `deps(Rn)`** : la ligne `dépend de : …`.
- **Base par défaut du repo** : `git symbolic-ref refs/remotes/origin/HEAD` (→ `main`, fallback `main`/`master` via `git show-ref`).

Applique la résolution de base de `/scd-implement:run` (auto-stacking) pour les dépendances **hors du lot demandé** :
- `--base <branche>` explicite → gagne pour **tous** les lots (rare ; à documenter).
- Une dépendance `Rk` **hors** de l'ensemble demandé, **branchée et non mergée** (`git ls-remote`/`git rev-parse` la trouvent ; `git merge-base --is-ancestor <ref-Rk> <base-défaut>` code ≠ 0) → ce lot **s'empile** sur `impl/<slug>-Rk` (base + oldBase). Deux telles dépendances → **ne devine pas** : `AskUserQuestion` ou exige `--base`.
- Dépendance non branchée et non mergée (lot pas encore fait) → ce lot est **bloqué** : signale-le, exclus-le du lancement (ou propose de lancer d'abord sa dépendance).

## 5. Calculer la co-parallélisabilité (chaînes)
Construis la relation de **conflit** entre lots demandés `Ri`, `Rj` (i ≠ j) : ils **conflictent** si
1. **fichiers non disjoints** : `F(Ri) ∩ F(Rj) ≠ ∅`, **ou**
2. **dépendance dans l'ensemble** : `Rj ∈ deps(Ri)` ou `Ri ∈ deps(Rj)`.

Puis :
- **Composantes connexes** de cette relation = les **chaînes**. Deux lots sans lien de conflit (direct ou transitif) sont dans des chaînes **différentes** → lançables **en parallèle**.
- **Ordre dans une chaîne** : tri topologique par `dépend de :` ; à égalité (conflit de fichiers sans dépendance), par **numéro de lot croissant**.
- **Bases dans une chaîne** :
  - **1er lot** de la chaîne → sa base naturelle (§4 : défaut, ou auto-stacking sur une dépendance hors-ensemble non mergée). `oldBase` selon les règles de `run`.
  - **lots suivants** → `base = impl/<slug>-<lot-précédent-dans-la-chaîne>` et `oldBase = impl/<slug>-<lot-précédent>`. On **empile** : la PR du lot suivant ne diffère que du précédent (pas de rejeu, pas de conflit de contenu au merge). C'est valable que le lien soit une vraie dépendance ou un simple chevauchement de fichiers.

**Refuse explicitement de co-lancer des lots aux fichiers qui se recoupent.** Quand deux lots partagent un fichier, **annonce-le clairement** (« `R2` et `R3` partagent `src/checks/index.ts` → non co-lancés en parallèle ; empilés en chaîne `R2→R3` ») et place-les dans la **même chaîne** — jamais dans deux chaînes parallèles. La disjonction des `Fichiers :` est la **condition dure** du parallèle.

Présente le plan à l'utilisateur avant de lancer : les chaînes, l'ordre, les bases, et ce qui est parallèle vs sérialisé.

## 6. Fetch unique, puis lancer l'orchestrateur
- **Un seul `git fetch origin` AVANT le fan-out** (jamais un par lot — les workflows enfants reçoivent `prefetched: true` et ne re-fetchent pas, ce qui évite des fetch concurrents qui se contendent).
- **Résous deux chemins absolus** (les workflows bundlés d'un plugin se lancent **par `scriptPath`, jamais par `name`** — cf. `/scd-implement:run`) :
  ```bash
  find "$HOME/.claude/plugins/cache" -path '*scd-implement*/implement-parallel.js' 2>/dev/null | sort -V | tail -1
  find "$HOME/.claude/plugins/cache" -path '*scd-implement*/implement-lot.js'      2>/dev/null | sort -V | tail -1
  ```
  (Fallback `"$HOME/.claude/plugins"` si le cache ne renvoie rien ; en dernier recours, demande le chemin.)
- **Lance** l'orchestrateur, en lui passant le plan calculé et le chemin de `implement-lot.js` (qu'il exécute via `workflow({scriptPath})`, imbrication d'un seul niveau) :
  ```
  Workflow(scriptPath: "<implement-parallel.js résolu>", args: {
    featureDir: "specs/NNN-feature",
    implPath: "<implement-lot.js résolu>",
    chains: [
      { id: "R2",     lots: [ { lot: "R2" } ] },
      { id: "R3->R4", lots: [ { lot: "R3" }, { lot: "R4", base: "impl/<slug>-R3", oldBase: "impl/<slug>-R3" } ] }
    ]
  })
  ```
  Omets `base`/`oldBase` quand ils n'ont pas lieu d'être (1er lot indépendant sur la base par défaut).
- **Permissions** : chaque lot pousse et ouvre une PR. Pré-allowlister `Bash(git push *)`, `Bash(gh pr *)`, `Bash(glab mr *)` évite des prompts en cours de run. Signale-le. **Ne pousse pas le parallélisme au point de saturer** l'auth/rate-limit `gh`/`glab` : le nombre de chaînes borne naturellement la largeur (l'orchestrateur respecte le plafond de concurrence des workflows).

## 7. Rendre compte
Le workflow tourne en arrière-plan (`/workflows`). À la complétion, résume le retour (`status: all-done | partial | all-blocked`) puis, **par lot** : `status`, `branch`, `base`, `pr` (URL ou null), et `worktreeDir` **si conservé** (lot en échec — le worktree est laissé pour inspection humaine). Rappelle que les lots `done` ont vu leur worktree **supprimé** après création de la PR ; les lots bloqués gardent le leur.
- Chaînes sérialisées : rappelle qu'un lot empilé bloqué interrompt les lots en aval de sa chaîne (`blocked-upstream`).
- Propose la suite : `/scd-implement:status NNN`, `/scd-implement:sync NNN` (quand une dépendance est mergée), ou relancer un lot bloqué via `/scd-implement:run NNN Rn`.

</process>

<guidelines>
- **Disjonction = condition dure du parallèle.** Ne co-lance jamais deux lots dont les `Fichiers :` se recoupent : sérialise-les en chaîne `--base`. En cas de doute sur la disjonction (ligne `Fichiers :` absente/ambiguë), **sérialise** — le parallèle est une optimisation, pas une obligation.
- **Un lot = une PR**, même en parallèle : chaque lot part de sa base et ouvre sa propre PR reviewable.
- **Coût.** Le parallèle multiplie la dépense d'un dynamic workflow par le nombre de lots concurrents. Réserve-le aux lots réellement indépendants et de taille maîtrisée. Suivre `/workflows`.
- La conversation principale ne lit pas les diffs ni n'écrit de code — c'est le rôle des subagents des workflows enfants.
- Tu ne modifies jamais `spec.md`/`plan.md`/`tasks.md` : le contrat est en amont.
</guidelines>

<skill>
- `implement` — charge `references/tasks-parsing.md` et `references/green-gate.md`.
</skill>
