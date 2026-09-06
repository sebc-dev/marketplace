---
description: "Implémentation de PLUSIEURS tickets NN d'un change en parallèle réel, chacun isolé dans son propre worktree git. Résout chaque ticket, sa base (auto-stacking) et sa ligne **Fichiers :**, calcule la co-parallélisabilité (fichiers disjoints ET aucune dépendance mutuelle non mergée → parallèle ; sinon sérialisé en chaîne --base), fetch une seule fois, puis lance l'orchestrateur implement-parallel. Une PR par ticket. On n'appelle JAMAIS /opsx:apply."
argument-hint: "[<change>] <NN> [<NN> …] [--base <branche>]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(date -I)
  - Bash(openspec:*)
  - Bash(git fetch *)
  - Bash(git status *)
  - Bash(git rev-parse *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git ls-remote *)
  - Bash(git show-ref *)
  - Bash(ls *)
  - Bash(find *)
  - Bash(tr *)
  - Bash(echo *)
  - Workflow
  - AskUserQuestion
---

## Ce que fait cette commande

Tu implémentes **plusieurs tickets `NN`** d'un même change **en parallèle réel**, chacun isolé dans son
propre **worktree git** — sans collision sur le HEAD unique du checkout de session, et sans conflit de
contenu au merge.

**Deux couches distinctes, à ne jamais confondre :**

- **Couche 1 — collision d'exécution.** Résolue par le **mode worktree** de `implement-ticket` : chaque
  ticket a son checkout, donc plusieurs tickets peuvent tourner en même temps. C'est ce que ce point
  d'entrée active.
- **Couche 2 — conflit de contenu.** Deux tickets qui éditent le **même fichier** ne peuvent pas être
  co-lancés sans risque de conflit au merge : l'isolation d'exécution n'y change **rien**. Ils doivent
  être **sérialisés/empilés** (chaîne `--base`), pas parallélisés. On dérive la disjonction des
  ensembles `**Fichiers :**` de chaque ticket.

Tu ne lis ni n'écris le code : tu **résous les cibles**, tu **calcules le plan de co-parallélisabilité**,
tu **lances l'orchestrateur**, puis tu **consignes une ligne par ticket**.

Ratio : ~30 % humain / 70 % IA (l'humain valide le plan de chaînes avant le fan-out).

## Ce qu'elle ne fait JAMAIS

- **La disjonction est la condition dure du parallèle.** Ne co-lance **jamais** deux tickets dont les
  `**Fichiers :**` se recoupent : sérialise-les en chaîne `--base`. En cas de doute (ligne absente ou
  ambiguë), **sérialise** — le parallèle est une optimisation, pas une obligation.
- **Un ticket = une PR**, même en parallèle : chaque ticket part de sa base et ouvre sa propre PR.
- **Un seul `git fetch`, avant le fan-out.** Jamais un par ticket : les workflows enfants reçoivent
  `prefetched: true` et ne re-fetchent pas, ce qui évite des fetch concurrents qui se contendent.
- **Tu présentes le plan avant de lancer.** Les chaînes, l'ordre, les bases, ce qui est parallèle et ce
  qui est sérialisé.
- **Tu ne modifies jamais le change ni le fichier du ticket. Tu n'appelles jamais `/opsx:apply`.**

## Étape 1 — Résoudre le change cible

- **Argument `<change>` fourni** → c'est le change. Sinon, résous depuis `openspec/changes/` un change
  qui a des tickets non finis (`openspec list` pour l'état). Ambigu → `AskUserQuestion`.

Charge le skill `implement` — parsing du ticket (le `**Vérif :**`, la ligne `**Fichiers :**`, le
`**Bloqué par :**`), la co-parallélisabilité, la discipline par mode. Communique en français.

> Le skill `implement` porte cette discipline ; les étapes ci-dessous (co-parallélisabilité comprise)
> y sont inlinées et restent autosuffisantes sans charger le skill.

## Étape 2 — Vérifier les préconditions — STOP si l'une manque

- `openspec/changes/<x>/tickets/NN-*.md` existe. Sinon → STOP, renvoie vers `/scd-spec-dev:tickets <change>`.
- **Arbre de travail** : contrairement à `/scd-spec-dev:run`, un arbre **sale est toléré** ici — le
  mode worktree crée chaque branche via `git worktree add`, qui ne touche pas au checkout principal.
  Signale-le si l'arbre est sale, pour rassurer : rien n'y sera modifié.
- **Tickets** : au moins **deux** `NN` demandés (un seul → renvoie vers `/scd-spec-dev:run`, plus
  léger). À défaut d'arguments, propose les tickets non finis et lançables via `AskUserQuestion`.

## Étape 3 — Résoudre chaque ticket : slug, fichiers, dépendances, base

Pour **chaque** `NN` demandé, extrais de `openspec/changes/<x>/tickets/NN-*.md` :

- **Slug** : le suffixe du nom de fichier après `NN-` (`ls openspec/changes/<x>/tickets/NN-*.md`) → la
  branche du ticket est `impl/<slug>-NN`. ⚠️ **Le slug est propre à chaque ticket.**
- **Fichiers `F(NN)`** : la ligne `**Fichiers :**`. C'est l'ensemble qui décide la disjonction. Ticket
  sans cette ligne → considère-le **non disjoint de tout** (on ne co-lance pas ce qu'on ne peut pas
  prouver disjoint).
- **Dépendances `deps(NN)`** : la ligne `**Bloqué par :**`.
- **Base par défaut du repo** : `git symbolic-ref refs/remotes/origin/HEAD` (repli `main`/`master`).

Applique la résolution de base de `/scd-spec-dev:run` (auto-stacking) pour les dépendances **hors** de
l'ensemble demandé — en résolvant le slug de chaque dépendance `Rk` (`ls …/tickets/Rk-*.md`) :

- `--base <branche>` explicite → gagne pour **tous** les tickets (rare ; à documenter).
- Une dépendance `Rk` **hors** de l'ensemble, **branchée et non mergée** → ce ticket **s'empile** sur
  `impl/<slugRk>-Rk` (base + oldBase). Deux telles dépendances → **ne devine pas** : `AskUserQuestion`.
- Dépendance non branchée **et** non mergée (ticket pas encore fait) → ce ticket est **bloqué** :
  signale-le, exclus-le du lancement, ou propose de lancer d'abord sa dépendance.

## Étape 4 — Calculer la co-parallélisabilité (chaînes)

Construis la relation de **conflit** entre tickets demandés `Ri`, `Rj` (i ≠ j) : ils **conflictent** si

1. **fichiers non disjoints** : `F(Ri) ∩ F(Rj) ≠ ∅`, **ou**
2. **dépendance dans l'ensemble** : `Rj ∈ deps(Ri)` ou `Ri ∈ deps(Rj)`.

Puis :

- **Composantes connexes** de cette relation = les **chaînes**. Deux tickets sans lien de conflit
  (direct ou transitif) sont dans des chaînes **différentes** → lançables **en parallèle**.
- **Ordre dans une chaîne** : tri topologique par `**Bloqué par :**` ; à égalité (conflit de fichiers
  sans dépendance), par **numéro de ticket croissant**.
- **Bases dans une chaîne** :
  - **1er ticket** → sa base naturelle (étape 3 : défaut, ou auto-stacking sur une dépendance
    hors-ensemble non mergée). `oldBase` selon les règles de `run`.
  - **tickets suivants** → `base = impl/<slugPrécédent>-<ticket-précédent>` et
    `oldBase = impl/<slugPrécédent>-<ticket-précédent>`. On **empile** : la PR du ticket suivant ne
    diffère que du précédent (pas de rejeu, pas de conflit de contenu au merge). Valable que le lien
    soit une vraie dépendance ou un simple chevauchement de fichiers.

**Refuse explicitement de co-lancer des tickets aux fichiers qui se recoupent.** Annonce-le clairement
— « `02` et `03` partagent `src/export/csv.ts` → non co-lancés en parallèle ; empilés en chaîne
`02→03` » — et place-les dans la **même chaîne**, jamais dans deux chaînes parallèles.

**Présente le plan à l'utilisateur avant de lancer.**

## Étape 5 — Fetch unique, puis lancer l'orchestrateur

- **Un seul `git fetch origin` AVANT le fan-out.**
- **Résous deux chemins absolus** (les workflows bundlés se lancent **par `scriptPath`, jamais par
  `name`** — cf. `/scd-spec-dev:run`), en préférant `${CLAUDE_PLUGIN_ROOT}` résolu par Bash :

  ```bash
  ROOT="${CLAUDE_PLUGIN_ROOT}/.claude/workflows"
  PAR="$ROOT/implement-parallel.js"; IMP="$ROOT/implement-ticket.js"
  [ -f "$PAR" ] || PAR="$(find "$HOME/.claude/plugins" -path '*scd-spec-dev*/implement-parallel.js' 2>/dev/null | sort -V | tail -1)"
  [ -f "$IMP" ] || IMP="$(find "$HOME/.claude/plugins" -path '*scd-spec-dev*/implement-ticket.js'   2>/dev/null | sort -V | tail -1)"
  echo "$PAR"; echo "$IMP"
  ```

  (En dernier recours, demande le chemin.)
- **Normalise les DEUX scripts en LF.** Un seul octet `CR` fait rejeter le workflow par la couche de
  permission avant démarrage. Les deux sont concernés : `implement-parallel.js` est le `scriptPath`, et
  `implement-ticket.js` est ré-exécuté par l'orchestrateur via `workflow({scriptPath})` — il traverse
  donc la même couche. Copie chacun en LF et passe **ces** chemins (scripts auto-contenus, sûrs depuis
  une copie ; **aucun `refsDir`**) :

  ```bash
  tr -d '\r' < "$PAR" > "${TMPDIR:-/tmp}/implement-parallel.$$.js"
  tr -d '\r' < "$IMP" > "${TMPDIR:-/tmp}/implement-ticket.$$.js"
  ```

- **Lance** l'orchestrateur en lui passant le plan et le chemin de `implement-ticket.js` (qu'il exécute
  via `workflow({scriptPath})`, imbrication d'un seul niveau) :

  ```
  Workflow(scriptPath: "<implement-parallel.js NORMALISÉ>", args: {
    changeDir: "openspec/changes/<x>",
    implPath: "<implement-ticket.js NORMALISÉ>",
    chains: [
      { id: "02",     tickets: [ { ticket: "02" } ] },
      { id: "03->04", tickets: [ { ticket: "03" }, { ticket: "04", base: "impl/<slug03>-03", oldBase: "impl/<slug03>-03" } ] }
    ]
  })
  ```

  Omets `base`/`oldBase` quand ils n'ont pas lieu d'être (1er ticket indépendant sur la base par défaut).
- **Permissions** : chaque ticket pousse et ouvre une PR. Pré-allowlister `Bash(git push *)`,
  `Bash(gh pr *)`, `Bash(glab mr *)` évite des prompts en cours de run. **Ne pousse pas le parallélisme
  au point de saturer** l'auth / le rate-limit `gh`/`glab` : le nombre de chaînes borne naturellement
  la largeur (l'orchestrateur respecte le plafond de concurrence des workflows).

## Étape 6 — Rendre compte

Le workflow tourne en arrière-plan (`/workflows`). À la complétion, résume le retour
(`status: all-done | partial | all-blocked`) puis, **par ticket** : `status`, `branch`, `base`, `pr`
(URL ou null), et `worktreeDir` **si conservé** (ticket en échec — le worktree est laissé pour
inspection humaine).

- Les tickets `done` ont vu leur worktree **supprimé** après création de la PR ; les tickets bloqués
  **gardent le leur**.
- **PR empilées (`pr.stacked`)** : un ticket empilé (2ᵉ+ d'une chaîne, ou stacké sur une dépendance
  hors-ensemble) ouvre sa PR en **draft** (labels `stacked`/`needs-sync`). C'est voulu — **ne pas
  merger avant `/scd-spec-dev:sync`** une fois la dépendance mergée. La 1ʳᵉ PR d'une chaîne sur le
  défaut est ready.
- **Chaînes sérialisées** : rappelle qu'un ticket empilé bloqué interrompt les tickets en aval de sa
  chaîne (`blocked-upstream`).

## Étape 7 — Une fiche de chantier par ticket bloqué

Même règle que `/scd-spec-dev:run`, et **une fiche par ticket** — jamais une fiche unique pour le
lancement : un run parallèle peut en bloquer trois sur cinq, et une fiche commune rendrait chacun
irrécupérable seul. `docs/chantiers/en-cours/AAAA-MM-JJ-run-<slug>-<NN>.md`,
`Portée : <change> · ticket NN`.

⚠️ **Le mode worktree change ce qu'il faut écrire, pas où.** La fiche va dans le dépôt principal, mais
elle **nomme le worktree** : sur un `blocked-unknown`, c'est le seul endroit où le travail du ticket
peut se trouver.

## Ce que tu NE fais PAS

- Tu ne lis pas les diffs et tu n'écris pas de code — c'est le rôle des subagents des workflows enfants.
- Tu ne co-lances pas des tickets aux fichiers non disjoints, même si l'utilisateur le demande : tu
  expliques et tu sérialises.
- Tu ne fetches pas par ticket, tu ne relances pas un ticket bloqué automatiquement.
- Tu ne modifies ni le change, ni le fichier du ticket.
- Tu ne supprimes pas un worktree conservé : il porte peut-être le seul exemplaire du travail.

## Skills actifs

- `implement` — parsing du ticket, co-parallélisabilité, discipline par mode.
- `chantier` — `references/fiche.md` (`<interdits>`, `<template>`), par ticket bloqué seulement.

## À la fin

Propose la suite : `/scd-spec-dev:status <change>` (classe la sûreté de merge des PR),
`/scd-spec-dev:sync <change>` (quand une dépendance est mergée), `/scd-spec-dev:reland <change>` (si un
orphelin est signalé), ou relancer un ticket bloqué via `/scd-spec-dev:run <change> NN`.

Sur un ticket bloqué dont la reprise n'est pas immédiate — et **en particulier si son worktree a été
conservé** : « `/scd-spec-dev:pause` depuis ce worktree avant de `/clear`. La fiche enregistrera sa
branche, et la sélection par branche la ressortira à la prochaine session ouverte dessus. »

Coût : le parallèle multiplie la dépense d'un dynamic workflow par le nombre de tickets concurrents.
Réserve-le aux tickets réellement indépendants et de taille maîtrisée. Suivre `/workflows`.
