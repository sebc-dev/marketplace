---
description: "Implémentation de PLUSIEURS tickets NN d'une feature en parallèle réel, chacun isolé dans son propre worktree git. Résout chaque ticket, sa base (auto-stacking) et sa ligne Fichiers:, calcule la co-parallélisabilité (fichiers disjoints ET aucune dépendance mutuelle non mergée → parallèle ; sinon sérialisé en chaîne --base), fetch une seule fois, puis lance l'orchestrateur implement-parallel. Une PR par ticket."
argument-hint: "[NNN|slug] <NN> [<NN> …] [--base <branche>]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(date -I)
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

Tu implémentes **plusieurs tickets de review `NN`** d'une même feature **en parallèle réel**, chacun
isolé dans son propre **worktree git** — sans collision sur le HEAD unique du checkout de session,
et sans conflit de contenu au merge.

**Deux couches distinctes, à ne jamais confondre :**

- **Couche 1 — collision d'exécution.** Résolue par le **mode worktree** de `implement-ticket` : chaque
  ticket a son checkout, donc plusieurs tickets peuvent tourner en même temps. C'est ce que ce point
  d'entrée active.
- **Couche 2 — conflit de contenu.** Deux tickets qui éditent le **même fichier** ne peuvent pas être
  co-lancés sans risque de conflit au merge : l'isolation d'exécution n'y change **rien**. Ils
  doivent être **sérialisés/empilés** (chaîne `--base`), pas parallélisés. Le marqueur `[P]` de
  le fichier du ticket encode déjà « fichiers disjoints » ; ici on le **généralise** en dérivant la
  disjonction des ensembles `Fichiers :`.

Tu ne lis ni n'écris le code : tu **résous les cibles**, tu **calcules le plan de
co-parallélisabilité**, tu **lances l'orchestrateur**, puis tu **consignes une ligne par ticket**.

Ratio : 30% humain / 70% AI (l'humain valide le plan de chaînes avant le fan-out).

## Règles absolues

- **La disjonction est la condition dure du parallèle.** Ne co-lance **jamais** deux tickets dont les
  `Fichiers :` se recoupent : sérialise-les en chaîne `--base`. En cas de doute sur la disjonction
  (ligne `Fichiers :` absente ou ambiguë), **sérialise** — le parallèle est une optimisation, pas
  une obligation.
- **Un ticket = une PR**, même en parallèle : chaque ticket part de sa base et ouvre sa propre PR
  reviewable.
- **Un seul `git fetch`, avant le fan-out.** Jamais un par ticket : les workflows enfants reçoivent
  `prefetched: true` et ne re-fetchent pas, ce qui évite des fetch concurrents qui se contendent.
- **Tu présentes le plan avant de lancer.** Les chaînes, l'ordre, les bases, ce qui est parallèle et
  ce qui est sérialisé.
- **Tu ne modifies jamais `SPEC.md` / `SPEC.md` / le fichier du ticket.**

## Processus

1. **Résous la feature cible** selon la section « Cibler une feature » du skill `specs` —
   référencée, jamais recopiée. Charge le skill `implement` (`references/tickets-parsing.md` pour le
   parsing, le `_vérif :_`, la ligne `Fichiers :` et le bloc `<co-parallelism>` ;
   `references/verification-modes.md` pour la discipline par mode). `slug` = suffixe de `featureDir`
   après `NNN-`. Communique en français.

2. **Vérifie les préconditions — STOP si l'une manque :**
   - `specs/NNN-slug/NN-*.md` existe. Sinon → STOP, renvoie vers le cycle des specs.
   - **Au moins un ticket** dans `specs/NNN-slug/` (comme `run`) : sinon `SPEC.md`/
     aucun ticket dans `specs/NNN-slug/` → STOP et propose `/scd-sdd:tickets NNN`.
   - **Arbre de travail** : contrairement à `/scd-sdd:run`, un arbre **sale est toléré** ici — le
     mode worktree crée chaque branche via `git worktree add`, qui ne touche pas au checkout
     principal. Signale-le si l'arbre est sale, pour rassurer : rien n'y sera modifié.
   - **Tickets** : au moins **deux** `NN` demandés (un seul → renvoie vers `/scd-sdd:run`, plus léger).
     À défaut d'arguments, propose les tickets non finis et lançables via `AskUserQuestion`.

3. **Résous chaque ticket : fichiers, dépendances, base.** Pour **chaque** `NN` demandé, extrais de
   le fichier du ticket :
   - **Fichiers `F(NN)`** : la ligne `Fichiers : …` du ticket. C'est l'ensemble qui décide la
     disjonction. Ticket sans ligne `Fichiers :` → dérive-la de l'union des fichiers de ses tâches, ou
     à défaut considère-le **non disjoint de tout** (on ne co-lance pas ce qu'on ne peut pas prouver
     disjoint).
   - **Dépendances `deps(NN)`** : la ligne `dépend de : …`.
   - **Base par défaut du repo** : `git symbolic-ref refs/remotes/origin/HEAD` (repli `main`/`master`
     via `git show-ref`).

   Applique la résolution de base de `/scd-sdd:run` (auto-stacking) pour les dépendances **hors** de
   l'ensemble demandé :
   - `--base <branche>` explicite → gagne pour **tous** les tickets (rare ; à documenter).
   - Une dépendance `Rk` **hors** de l'ensemble, **branchée et non mergée** (`git ls-remote` /
     `git rev-parse` la trouvent ; `git merge-base --is-ancestor <ref-Rk> <base-défaut>` code ≠ 0) →
     ce ticket **s'empile** sur `impl/<slug>-Rk` (base + oldBase). Deux telles dépendances → **ne
     devine pas** : `AskUserQuestion` ou exige `--base`.
   - Dépendance non branchée **et** non mergée (ticket pas encore fait) → ce ticket est **bloqué** :
     signale-le, exclus-le du lancement, ou propose de lancer d'abord sa dépendance.

4. **Calcule la co-parallélisabilité (chaînes).** Construis la relation de **conflit** entre tickets
   demandés `Ri`, `Rj` (i ≠ j) : ils **conflictent** si
   1. **fichiers non disjoints** : `F(Ri) ∩ F(Rj) ≠ ∅`, **ou**
   2. **dépendance dans l'ensemble** : `Rj ∈ deps(Ri)` ou `Ri ∈ deps(Rj)`.

   Puis :
   - **Composantes connexes** de cette relation = les **chaînes**. Deux tickets sans lien de conflit
     (direct ou transitif) sont dans des chaînes **différentes** → lançables **en parallèle**.
   - **Ordre dans une chaîne** : tri topologique par `dépend de :` ; à égalité (conflit de fichiers
     sans dépendance), par **numéro de ticket croissant**.
   - **Bases dans une chaîne** :
     - **1er ticket** → sa base naturelle (étape 3 : défaut, ou auto-stacking sur une dépendance
       hors-ensemble non mergée). `oldBase` selon les règles de `run`.
     - **tickets suivants** → `base = impl/<slug>-<ticket-précédent-dans-la-chaîne>` et
       `oldBase = impl/<slug>-<ticket-précédent>`. On **empile** : la PR du ticket suivant ne diffère que
       du précédent (pas de rejeu, pas de conflit de contenu au merge). Valable que le lien soit une
       vraie dépendance ou un simple chevauchement de fichiers.

   **Refuse explicitement de co-lancer des tickets aux fichiers qui se recoupent.** Annonce-le
   clairement — « `R2` et `R3` partagent `src/checks/index.ts` → non co-lancés en parallèle ; empilés
   en chaîne `R2→R3` » — et place-les dans la **même chaîne**, jamais dans deux chaînes parallèles.

   **Présente le plan à l'utilisateur avant de lancer.**

5. **Fetch unique, puis lance l'orchestrateur.**
   - **Un seul `git fetch origin` AVANT le fan-out.**
   - **Résous deux chemins absolus** (les workflows bundlés se lancent **par `scriptPath`, jamais par
     `name`** — cf. `/scd-sdd:run`) :
     ```bash
     find "$HOME/.claude/plugins/cache" -path '*scd-sdd*/implement-parallel.js' 2>/dev/null | sort -V | tail -1
     find "$HOME/.claude/plugins/cache" -path '*scd-sdd*/implement-ticket.js'      2>/dev/null | sort -V | tail -1
     ```
     (Repli sur `"$HOME/.claude/plugins"` si le cache ne renvoie rien ; en dernier recours, demande
     le chemin.)
   - **Normalise les DEUX scripts en LF avant de lancer.** Un seul octet `CR` fait rejeter le
     workflow par la couche de permission avant démarrage ; un cache installé sous
     `core.autocrlf=true` avant le correctif `.gitattributes` garde ses CRLF. Les deux scripts sont
     concernés : `implement-parallel.js` est le `scriptPath`, et `implement-ticket.js` est
     ré-exécuté par l'orchestrateur via `workflow({scriptPath})` — il traverse donc la même couche.
     Copie chacun en LF et passe **ces** chemins (scripts auto-contenus, sûrs depuis une copie) :
     ```bash
     tr -d '\r' < "<implement-parallel.js résolu>" > "${TMPDIR:-/tmp}/implement-parallel.$$.js"
     tr -d '\r' < "<implement-ticket.js résolu>"   > "${TMPDIR:-/tmp}/implement-ticket.$$.js"
     ```
   - **Résous le répertoire des références du skill** (comme `/scd-sdd:run`, étape *a-ter*) : sans
     lui, les agents de review chargent `references/*.md` par un `find /` → prompt → refus → run
     bloqué. Frère déterministe du script d'**origine** (pas du temporaire) :
     ```bash
     REFS="$(cd "$(dirname "<implement-ticket.js résolu>")/../skills/implement/references" && pwd)"
     ```
   - **Lance** l'orchestrateur en lui passant le plan, le chemin de `implement-ticket.js` (qu'il
     exécute via `workflow({scriptPath})`, imbrication d'un seul niveau) et `refsDir` (qu'il forwarde
     à chaque ticket) :
     ```
     Workflow(scriptPath: "<implement-parallel.js NORMALISÉ>", args: {
       featureDir: "specs/NNN-feature",
       implPath: "<implement-ticket.js NORMALISÉ>",
       refsDir: "<REFS résolu>",
       chains: [
         { id: "R2",     tickets: [ { ticket: "R2" } ] },
         { id: "R3->R4", tickets: [ { ticket: "R3" }, { ticket: "R4", base: "impl/<slug>-R3", oldBase: "impl/<slug>-R3" } ] }
       ]
     })
     ```
     Omets `base`/`oldBase` quand ils n'ont pas lieu d'être (1er ticket indépendant sur la base par
     défaut).
   - **Permissions** : chaque ticket pousse et ouvre une PR. Pré-allowlister `Bash(git push *)`,
     `Bash(gh pr *)`, `Bash(glab mr *)` évite des prompts en cours de run. **Ne pousse pas le
     parallélisme au point de saturer** l'auth / le rate-limit `gh`/`glab` : le nombre de chaînes
     borne naturellement la largeur (l'orchestrateur respecte le plafond de concurrence des
     workflows).

6. **Rends compte.** Le workflow tourne en arrière-plan (`/workflows`). À la complétion, résume le
   retour (`status: all-done | partial | all-blocked`) puis, **par ticket** : `status`, `branch`, `base`,
   `pr` (URL ou null), et `worktreeDir` **si conservé** (ticket en échec — le worktree est laissé pour
   inspection humaine).
   - Les tickets `done` ont vu leur worktree **supprimé** après création de la PR ; les tickets bloqués
     **gardent le leur**.
   - **PR empilées (`pr.stacked`)** : un ticket empilé (2ᵉ+ d'une chaîne, ou stacké sur une dépendance
     hors-ensemble) ouvre sa PR en **draft** (labels `stacked`/`needs-sync`). C'est voulu — **ne pas
     merger avant `/scd-sdd:sync`** une fois la dépendance mergée. La 1ʳᵉ PR d'une chaîne sur le
     défaut est ready.
   - **Chaînes sérialisées** : rappelle qu'un ticket empilé bloqué interrompt les tickets en aval de sa
     chaîne (`blocked-upstream`).


8. **Une fiche de chantier par ticket bloqué.** Même règle que `/scd-sdd:run`, et **une fiche par
   ticket** — jamais une fiche unique pour le lancement : un run parallèle peut en bloquer trois sur
   cinq, et une fiche commune rendrait chacun irrécupérable seul.
   `docs/chantiers/en-cours/AAAA-MM-JJ-run-<slug>-<NN>.md`, `Portée : NNN-slug · ticket NN`.

   ⚠️ **Le mode worktree change ce qu'il faut écrire, pas où.** La fiche va dans le dépôt principal,
   mais elle **nomme le worktree** : sur un `blocked-unknown`, c'est le seul endroit où le travail
   du ticket peut se trouver.

## Ce que tu NE fais PAS

- Tu ne lis pas les diffs et tu n'écris pas de code — c'est le rôle des subagents des workflows
  enfants.
- Tu ne co-lances pas des tickets aux fichiers non disjoints, même si l'utilisateur le demande : tu
  expliques et tu sérialises.
- Tu ne fetches pas par ticket, tu ne relances pas un ticket bloqué automatiquement.
- Tu ne modifies ni le contrat, ni le fichier du ticket.
- Tu ne supprimes pas un worktree conservé : il porte peut-être le seul exemplaire du travail.

## Skill active

- `specs` — section « Cibler une feature » pour la résolution de la cible.
- `implement` — charge `references/tickets-parsing.md` (**seule commande à avoir besoin de son bloc
  `<co-parallelism>`**) et `references/verification-modes.md`.

## À la fin

Propose la suite : `/scd-sdd:status NNN` (classe la sûreté de merge des PR),
`/scd-sdd:sync NNN` (quand une dépendance est mergée), `/scd-sdd:reland NNN` (si un orphelin est
signalé), ou relancer un ticket bloqué via `/scd-sdd:run NNN NN`.

Sur un ticket bloqué dont la reprise n'est pas immédiate — et **en particulier si son worktree a été
conservé** : « `/scd-sdd:pause` depuis ce worktree avant de `/clear`. La fiche enregistrera sa
branche, et le hook la ressortira à la prochaine session ouverte dessus. »

Coût : le parallèle multiplie la dépense d'un dynamic workflow par le nombre de tickets concurrents.
Réserve-le aux tickets réellement indépendants et de taille maîtrisée. Suivre `/workflows`.
