---
description: "Implémentation de PLUSIEURS lots Rn d'une feature en parallèle réel, chacun isolé dans son propre worktree git. Résout chaque lot, sa base (auto-stacking) et sa ligne Fichiers:, calcule la co-parallélisabilité (fichiers disjoints ET aucune dépendance mutuelle non mergée → parallèle ; sinon sérialisé en chaîne --base), fetch une seule fois, puis lance l'orchestrateur implement-parallel. Une PR par lot. Consigne une ligne de journal par lot."
argument-hint: "[NNN|slug] <Rn> [<Rn> …] [--base <branche>]"
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
  - Bash(git show-ref *)
  - Bash(find *)
  - Workflow
  - AskUserQuestion
---

## Contexte

Tu implémentes **plusieurs lots de review `Rn`** d'une même feature **en parallèle réel**, chacun
isolé dans son propre **worktree git** — sans collision sur le HEAD unique du checkout de session,
et sans conflit de contenu au merge.

**Deux couches distinctes, à ne jamais confondre :**

- **Couche 1 — collision d'exécution.** Résolue par le **mode worktree** de `implement-lot` : chaque
  lot a son checkout, donc plusieurs lots peuvent tourner en même temps. C'est ce que ce point
  d'entrée active.
- **Couche 2 — conflit de contenu.** Deux lots qui éditent le **même fichier** ne peuvent pas être
  co-lancés sans risque de conflit au merge : l'isolation d'exécution n'y change **rien**. Ils
  doivent être **sérialisés/empilés** (chaîne `--base`), pas parallélisés. Le marqueur `[P]` de
  `tasks.md` encode déjà « fichiers disjoints » ; ici on le **généralise** en dérivant la
  disjonction des ensembles `Fichiers :`.

Tu ne lis ni n'écris le code : tu **résous les cibles**, tu **calcules le plan de
co-parallélisabilité**, tu **lances l'orchestrateur**, puis tu **consignes une ligne par lot**.

Ratio : 30% humain / 70% AI (l'humain valide le plan de chaînes avant le fan-out).

## Règles absolues

- **La disjonction est la condition dure du parallèle.** Ne co-lance **jamais** deux lots dont les
  `Fichiers :` se recoupent : sérialise-les en chaîne `--base`. En cas de doute sur la disjonction
  (ligne `Fichiers :` absente ou ambiguë), **sérialise** — le parallèle est une optimisation, pas
  une obligation.
- **Un lot = une PR**, même en parallèle : chaque lot part de sa base et ouvre sa propre PR
  reviewable.
- **Un seul `git fetch`, avant le fan-out.** Jamais un par lot : les workflows enfants reçoivent
  `prefetched: true` et ne re-fetchent pas, ce qui évite des fetch concurrents qui se contendent.
- **Tu présentes le plan avant de lancer.** Les chaînes, l'ordre, les bases, ce qui est parallèle et
  ce qui est sérialisé.
- **Tu ne modifies jamais `spec.md` / `plan.md` / `tasks.md`.**

## Processus

1. **Résous la feature cible** selon la section « Cibler une feature » du skill `feature-specs` —
   référencée, jamais recopiée. Charge le skill `implement` (`references/tasks-parsing.md` pour le
   parsing, le `_vérif :_`, la ligne `Fichiers :` et la règle de co-parallélisabilité ;
   `references/verification-modes.md` pour la discipline par mode). `slug` = suffixe de `featureDir`
   après `NNN-`. Communique en français.

2. **Vérifie les préconditions — STOP si l'une manque :**
   - `specs/NNN-feature/tasks.md` existe. Sinon → STOP, renvoie vers le cycle des specs.
   - **Gate `analyze` au vert** (comme `run`) : `[NEEDS CLARIFICATION]` résiduel, ou `plan.md`/
     `tasks.md` manquant → STOP et renvoie vers la phase manquante ; propose `/scd-sdd:analyze NNN`.
   - **Arbre de travail** : contrairement à `/scd-sdd:run`, un arbre **sale est toléré** ici — le
     mode worktree crée chaque branche via `git worktree add`, qui ne touche pas au checkout
     principal. Signale-le si l'arbre est sale, pour rassurer : rien n'y sera modifié.
   - **Lots** : au moins **deux** `Rn` demandés (un seul → renvoie vers `/scd-sdd:run`, plus léger).
     À défaut d'arguments, propose les lots non finis et lançables via `AskUserQuestion`.

3. **Résous chaque lot : fichiers, dépendances, base.** Pour **chaque** `Rn` demandé, extrais de
   `tasks.md` :
   - **Fichiers `F(Rn)`** : la ligne `Fichiers : …` du lot. C'est l'ensemble qui décide la
     disjonction. Lot sans ligne `Fichiers :` → dérive-la de l'union des fichiers de ses tâches, ou
     à défaut considère-le **non disjoint de tout** (on ne co-lance pas ce qu'on ne peut pas prouver
     disjoint).
   - **Dépendances `deps(Rn)`** : la ligne `dépend de : …`.
   - **Base par défaut du repo** : `git symbolic-ref refs/remotes/origin/HEAD` (repli `main`/`master`
     via `git show-ref`).

   Applique la résolution de base de `/scd-sdd:run` (auto-stacking) pour les dépendances **hors** de
   l'ensemble demandé :
   - `--base <branche>` explicite → gagne pour **tous** les lots (rare ; à documenter).
   - Une dépendance `Rk` **hors** de l'ensemble, **branchée et non mergée** (`git ls-remote` /
     `git rev-parse` la trouvent ; `git merge-base --is-ancestor <ref-Rk> <base-défaut>` code ≠ 0) →
     ce lot **s'empile** sur `impl/<slug>-Rk` (base + oldBase). Deux telles dépendances → **ne
     devine pas** : `AskUserQuestion` ou exige `--base`.
   - Dépendance non branchée **et** non mergée (lot pas encore fait) → ce lot est **bloqué** :
     signale-le, exclus-le du lancement, ou propose de lancer d'abord sa dépendance.

4. **Calcule la co-parallélisabilité (chaînes).** Construis la relation de **conflit** entre lots
   demandés `Ri`, `Rj` (i ≠ j) : ils **conflictent** si
   1. **fichiers non disjoints** : `F(Ri) ∩ F(Rj) ≠ ∅`, **ou**
   2. **dépendance dans l'ensemble** : `Rj ∈ deps(Ri)` ou `Ri ∈ deps(Rj)`.

   Puis :
   - **Composantes connexes** de cette relation = les **chaînes**. Deux lots sans lien de conflit
     (direct ou transitif) sont dans des chaînes **différentes** → lançables **en parallèle**.
   - **Ordre dans une chaîne** : tri topologique par `dépend de :` ; à égalité (conflit de fichiers
     sans dépendance), par **numéro de lot croissant**.
   - **Bases dans une chaîne** :
     - **1er lot** → sa base naturelle (étape 3 : défaut, ou auto-stacking sur une dépendance
       hors-ensemble non mergée). `oldBase` selon les règles de `run`.
     - **lots suivants** → `base = impl/<slug>-<lot-précédent-dans-la-chaîne>` et
       `oldBase = impl/<slug>-<lot-précédent>`. On **empile** : la PR du lot suivant ne diffère que
       du précédent (pas de rejeu, pas de conflit de contenu au merge). Valable que le lien soit une
       vraie dépendance ou un simple chevauchement de fichiers.

   **Refuse explicitement de co-lancer des lots aux fichiers qui se recoupent.** Annonce-le
   clairement — « `R2` et `R3` partagent `src/checks/index.ts` → non co-lancés en parallèle ; empilés
   en chaîne `R2→R3` » — et place-les dans la **même chaîne**, jamais dans deux chaînes parallèles.

   **Présente le plan à l'utilisateur avant de lancer.**

5. **Fetch unique, puis lance l'orchestrateur.**
   - **Un seul `git fetch origin` AVANT le fan-out.**
   - **Résous deux chemins absolus** (les workflows bundlés se lancent **par `scriptPath`, jamais par
     `name`** — cf. `/scd-sdd:run`) :
     ```bash
     find "$HOME/.claude/plugins/cache" -path '*scd-sdd*/implement-parallel.js' 2>/dev/null | sort -V | tail -1
     find "$HOME/.claude/plugins/cache" -path '*scd-sdd*/implement-lot.js'      2>/dev/null | sort -V | tail -1
     ```
     (Repli sur `"$HOME/.claude/plugins"` si le cache ne renvoie rien ; en dernier recours, demande
     le chemin.)
   - **Lance** l'orchestrateur en lui passant le plan calculé et le chemin de `implement-lot.js`
     (qu'il exécute via `workflow({scriptPath})`, imbrication d'un seul niveau) :
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
     Omets `base`/`oldBase` quand ils n'ont pas lieu d'être (1er lot indépendant sur la base par
     défaut).
   - **Permissions** : chaque lot pousse et ouvre une PR. Pré-allowlister `Bash(git push *)`,
     `Bash(gh pr *)`, `Bash(glab mr *)` évite des prompts en cours de run. **Ne pousse pas le
     parallélisme au point de saturer** l'auth / le rate-limit `gh`/`glab` : le nombre de chaînes
     borne naturellement la largeur (l'orchestrateur respecte le plafond de concurrence des
     workflows).

6. **Rends compte.** Le workflow tourne en arrière-plan (`/workflows`). À la complétion, résume le
   retour (`status: all-done | partial | all-blocked`) puis, **par lot** : `status`, `branch`, `base`,
   `pr` (URL ou null), et `worktreeDir` **si conservé** (lot en échec — le worktree est laissé pour
   inspection humaine).
   - Les lots `done` ont vu leur worktree **supprimé** après création de la PR ; les lots bloqués
     **gardent le leur**.
   - **PR empilées (`pr.stacked`)** : un lot empilé (2ᵉ+ d'une chaîne, ou stacké sur une dépendance
     hors-ensemble) ouvre sa PR en **draft** (labels `stacked`/`needs-sync`). C'est voulu — **ne pas
     merger avant `/scd-sdd:sync`** une fois la dépendance mergée. La 1ʳᵉ PR d'une chaîne sur le
     défaut est ready.
   - **Chaînes sérialisées** : rappelle qu'un lot empilé bloqué interrompt les lots en aval de sa
     chaîne (`blocked-upstream`).

7. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu ne lis pas les diffs et tu n'écris pas de code — c'est le rôle des subagents des workflows
  enfants.
- Tu ne co-lances pas des lots aux fichiers non disjoints, même si l'utilisateur le demande : tu
  expliques et tu sérialises.
- Tu ne fetches pas par lot, tu ne relances pas un lot bloqué automatiquement.
- Tu ne modifies ni le contrat, ni `tasks.md`.
- Tu ne supprimes pas un worktree conservé : il porte peut-être le seul exemplaire du travail.

## Consigne au journal

Charge le skill `journal` et ajoute, dans `docs/journal/NNN-slug.md`, **une ligne par lot** — jamais
une ligne unique pour le lancement d'ensemble. Un run parallèle de trois lots produit **trois**
lignes, dans l'ordre des lots.

- **Phase** : `run Rn` — identique à `/scd-sdd:run`. Le journal ne distingue pas le mode de
  lancement : ce qui compte est l'issue du lot, pas la façon dont il a été démarré.
- **Résultat** : même vocabulaire que `run` — `✅ done · <mode> · N tests · PR #n` (avec
  `(empilée sur Rk)` le cas échéant) ou `⛔ <statut> · branche impl/<slug>-Rn`. Ajoute
  `· worktree conservé` quand un lot bloqué garde le sien : c'est l'information qui permet de
  retrouver le travail.

Les lots `blocked-upstream` (interrompus parce qu'un lot amont de leur chaîne a échoué) se
consignent **aussi** : ils n'ont rien produit, et c'est précisément ce qu'on veut pouvoir relire.

**Conflit git attendu, et trivial.** Deux lots d'une même feature tournent dans des worktrees
isolés et écriront tous deux en fin de la même section. Lignes indépendantes → on garde les deux.
Ce n'est pas une classe de problème nouvelle : `tasks.md` est déjà édité par chaque lot parallèle.

## Skill active

- `feature-specs` — section « Cibler une feature » pour la résolution de la cible.
- `implement` — charge `references/tasks-parsing.md` (§co-parallélisabilité) et
  `references/verification-modes.md`.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Propose la suite : `/scd-sdd:status-impl NNN` (classe la sûreté de merge des PR),
`/scd-sdd:sync NNN` (quand une dépendance est mergée), `/scd-sdd:reland NNN` (si un orphelin est
signalé), ou relancer un lot bloqué via `/scd-sdd:run NNN Rn`.

Sur un lot bloqué dont la reprise n'est pas immédiate — et **en particulier si son worktree a été
conservé** : « `/scd-sdd:pause` depuis ce worktree avant de `/clear`. La fiche enregistrera sa
branche, et le hook la ressortira à la prochaine session ouverte dessus. »

Coût : le parallèle multiplie la dépense d'un dynamic workflow par le nombre de lots concurrents.
Réserve-le aux lots réellement indépendants et de taille maîtrisée. Suivre `/workflows`.
