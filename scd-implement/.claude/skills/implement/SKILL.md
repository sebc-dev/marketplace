---
name: implement
description: |
  Connaissance transverse pour le workflow dynamique d'implémentation — la suite
  de scd-feature-specs. Comment lire le contrat produit en amont (specs/NNN-feature/
  {spec,plan,tasks}.md) et l'honorer, lot de review Rn par lot, SELON LE MODE DE
  VÉRIFICATION du lot (_vérif :_) : TDD par défaut (rouge→vert), ou test-after
  (impl puis test au vert), check (vérif observable dédiée) ou inhérent (le critère
  d'acceptation de l'impl est la preuve — CI/infra/config). La règle « une SHALL EARS
  = une vérification observable » (un test nommé en TDD/test-after, une preuve capturée
  en check/inhérent), le backref Kiro _Requirements:_, la discipline TDD quand elle
  s'applique (tests écrits → validés → rouge confirmé AVANT l'impl), l'invariant « ne
  jamais toucher aux tests » garanti par un check git-diff déterministe (pas un hook,
  qui ignore la phase), la porte de vérif par preuve (sortie 0 failed OU preuve
  observable, jamais une affirmation ; ce qu'un agent ne peut constater part en
  humanCheckRequired dans la PR), le second regard en contexte frais pour la review ET
  pour la vérif non-test (producteur ≠ vérificateur : agents code-reviewer et verifier),
  le triage sceptique adversarial des findings (reproduire avant de retenir, ne corriger
  que correction/exigence), le routage de modèles (opus pour raisonnement/review/verify,
  sonnet pour codegen, haiku pour l'enregistrement) et le contrat de fichier d'un dynamic
  workflow. Se charge pendant /scd-implement:* (run, run-parallel, sync, status), plus le
  mode d'isolation par worktree git qui rend possible le parallélisme réel de plusieurs
  lots (couche 1, collision d'exécution) — distinct de la sérialisation des lots aux
  fichiers non disjoints (couche 2, conflit de contenu). Périmètre : honorer et vérifier
  le contrat — pas l'écrire (spec/plan/tasks appartiennent à scd-feature-specs). Un
  lancement séquentiel = un lot ; run-parallel en lance plusieurs.
---

# Implémentation par lot, selon son mode de vérification (dynamic workflow)

Ce skill outille l'**exécution** du contrat documentaire d'une feature. Là où `scd-feature-specs` produit et atteste `specs/NNN-feature/{spec,plan,tasks}.md` puis **s'arrête à la gate `analyze`**, ce plugin prend le relais : il honore le contrat et le **vérifie**, en implémentant **un lot de review `Rn` à la fois** via un **dynamic workflow** (`.claude/workflows/implement-lot.js`). Chaque lot déclare un **mode de vérification** (`_vérif :_` ∈ `TDD` défaut · `test-after` · `check` · `inhérent`) que le workflow lit et honore — le TDD reste le défaut, plus la loi unique.

**Frontière de périmètre.** Nous n'écrivons **aucun** document de spec. Si l'implémentation révèle un défaut du contrat (une SHALL intestable, un cas manquant), on ne le corrige pas ici : on le **signale** pour un retour amont (`scd-feature-specs` : nouveau critère, FR, ou passe `premortem`). Ici on écrit les deux derniers maillons de la chaîne de traçabilité — **test** et **code** — et on coche `tasks.md`.

```
FR du PRD → FR/SHALL de la spec → tâche Tn → test → code
                                    └──────── scd-implement ────────┘
```

## Le cycle, par lot

Un lancement `/scd-implement:run NNN Rn` exécute le workflow sur **un seul** lot. Le préambule (1-3) et le final (Review→PR) sont **invariants** ; le **segment de vérification** (au centre) dépend du `_vérif :_` du lot :

1. **Branch** (`branch-setup`) — crée **toujours** la branche dédiée `impl/<slug>-<lot>` depuis la base à jour (`git fetch`), **avant tout le reste**. Arbre propre exigé, sinon STOP.
2. **Rebase** (`rebaser`) — **préventif, idempotent** : repose la branche sur la base à jour avant d'écrire. No-op sur une branche fraîche ; utile sur une **reprise** où la base a bougé. Conflit → `--abort` + STOP.
3. **Prepare** (`lot-briefer`) — parse le lot **et son mode de vérif**, pull les SHALL depuis `spec.md`, détecte la commande de test.

   **Segment de vérification (variable selon le mode)** :
   - **`TDD`** (défaut) → **Red** (`test-writer`, rouge confirmé) → **Validate** (`test-validator`, 1 SHALL = 1 test, boucle ≤ 2) → **Green** (`implementer`, code jusqu'au vert **sans toucher aux tests**, retry ≤ 3).
   - **`test-after`** → **Green** (`implementer` d'abord, prouve build/run) → **Red** (`test-writer`, tests écrits après, **vert** attendu) → **Validate** → **Green** (porte : `0 failed`, tests intacts).
   - **`check` / `inhérent`** → **Green** (`implementer` selon le critère d'acceptation) → **Verify** (`verifier`, **contexte frais**) : vérif observable dédiée (`check`) ou ré-exécution du critère d'acceptation de l'impl (`inhérent`) → preuve capturée, ou items `humanCheckRequired` remontés à la PR.

4. **Review** (`code-reviewer`) — six dimensions, en contexte frais (**tous les modes**).
5. **Triage** (`review-validator`) — sceptique adversarial, apply/skip.
6. **Apply** (`fix-applier`) — corrections retenues, **re-vérifie selon le mode** (re-run tests, ou re-run la vérif observable).
7. **Record** (`progress-recorder`) — coche `tasks.md`, commit **sur la branche dédiée**.
8. **PR** (`pr-author`) — pousse la branche, ouvre la PR/MR **ready for review** avec une description adaptée au mode (+ checklist `humanCheckRequired` si présente).

Détails d'orchestration, segment par mode et adaptation du script : `references/workflow-template.md` et `references/verification-modes.md`.

**Un lot = une PR.** Le run se termine par une PR par lot (`impl/<slug>-<lot>` → base). C'est le prolongement direct de « un lot ≈ une PR reviewable » : `scd-feature-specs` dimensionne la slice pour qu'un humain la review, `scd-implement` la livre effectivement en PR.

## Les invariants (ce qui n'est jamais négociable)

- **Le mode vient du contrat ; on l'applique, on ne le réinvente pas.** Chaque lot déclare `_vérif :_` (défaut `TDD` si absent — rétro-compatible). TDD reste le **défaut** ; un `check`/`inhérent` sur de la vraie logique métier est un finding amont, pas un raccourci que le workflow entérine. Voir `references/verification-modes.md`.
- **TDD strict quand le mode l'exige.** En `TDD`, aucun code de production avant que les tests soient écrits, **validés**, et **rouges** (échec légitime) — l'ordre T-test → T-impl est déjà porté par `tasks.md`. En `test-after`, le test est écrit après l'impl mais reste **dû** (au vert, validé).
- **Une SHALL = une vérification observable et nommée.** En TDD/test-after : un test nommé (`When… shall…` → `submit_valid_form_creates_account`). En check/inhérent : une **preuve observable capturée** (sortie de commande, constat d'état). Un SHALL sans vérification = filet troué.
- **Ne jamais toucher aux tests (dès qu'ils existent).** `implementer` et `fix-applier` ne modifient jamais les fichiers de test ; la garantie est un **check déterministe** `git diff -- <tests>` qui doit rester vide — pas un hook (un hook statique ne sait ni distinguer la phase, ni si le lot a des tests). En check/inhérent (aucun test), l'invariant est vacant. Voir `references/verification-modes.md`.
- **La vérif se prouve.** `passing` (modes-test) n'est vrai que si la **sortie réelle** montre `0 failed` ; `verified` (check/inhérent) exige un `observableProof` capturé. Jamais « looks done ». Ce qu'un agent ne peut constater (rendu visuel, effet externe) part en `humanCheckRequired` — jamais faussement attesté.
- **Producteur ≠ vérificateur.** Ni `code-reviewer` (tous modes) ni `verifier` (check/inhérent) n'ont écrit le code : le second regard en contexte frais tue le self-preferential bias. `implementer` ne partage jamais de contexte avec eux.
- **Sceptique mais sobre.** Le triage reproduit chaque finding avant de le retenir et **ne corrige que ce qui touche la correction ou une exigence** — un reviewer trouve toujours des « défauts » ; le sur-engineering est rejeté. Voir `references/review-dimensions.md`.

## Cibler feature et lot (résolution)

Comme dans `scd-feature-specs`, `/clear` efface le contexte : une commande ne suppose pas sa cible.
1. Argument `NNN`/slug fourni → cible. Argument `Rn` fourni → lot cible.
2. Sinon : une seule feature avec des lots non finis / le premier lot non coché **dont les dépendances sont faites** → le prendre et l'annoncer.
3. Sinon (0 ou ≥ 2) → ne devine pas : `AskUserQuestion` ou renvoi vers `/scd-implement:status`.

**L'état vit dans les cases de `tasks.md`** — c'est `progress-recorder` qui les coche, et `status` qui les relit. Parsing : `references/tasks-parsing.md`.

## Advisory vs déterministe

`CLAUDE.md`/specs = contexte advisory. Ce qui DOIT arriver à 100 % ici est **déterministe et intégré au workflow**, pas un hook :
- « branche dédiée depuis la base à jour, arbre propre » → première phase `branch-setup` (fetch + `git switch -c` ; STOP si `git status` non propre) ;
- « tests intacts » (dès qu'un test existe) → check `git diff` (vide) dans `implementer`/`fix-applier` ;
- « vérifié » → assertion sur la sortie `0 failed` (modes-test) ou sur un `observableProof` capturé (check/inhérent).

Ce plugin **ne livre aucun hook** : rien ici n'est bloquant-100 % de façon *statique* (la phase **et** le mode comptent — un hook ne sait ni l'un ni l'autre). La gate documentaire `analyze` reste en amont ; la discipline de vérification, quel que soit le mode, est portée par la **structure** du workflow. (Le hook d'immutabilité ADR de `scd-feature-specs`, s'il est installé dans le repo cible, ne gêne pas : `tasks.md` n'est pas sous `docs/adr/`.)

## Routage de modèles

Pour maîtriser le coût d'un dynamic workflow (« substantiellement plus » de tokens) :
- **opus** — raisonnement dur : `test-validator`, `code-reviewer`, `review-validator`, `verifier`.
- **sonnet** — génération de code / rédaction : `test-writer`, `implementer`, `fix-applier`, `lot-briefer`, `pr-author`.
- **haiku** — mécanique : `progress-recorder`, `rebaser` (exécutent une recette, ne raisonnent pas).

Le périmètre « un lot par lancement » borne naturellement la dépense.

## Branche, PR et action sortante

Le run **commence** par poser la branche et **se conclut** par une PR ready-for-review, une par lot :
- **Branche (première phase, toujours)** : `branch-setup` crée **systématiquement** `impl/<slug>-<lot>` **avant tout autre travail**, à partir de la base **mise à jour** (`git fetch` → `origin/<base>`). Pas d'exception : même si tu es déjà sur une branche de travail, on repart de la base à jour. **Arbre propre exigé** : si `git status` n'est pas propre, le workflow s'arrête (`blocked-dirty-tree`) — commite ou remise, puis relance. Rien ne peut atterrir sur la base : le code du lot naît directement sur la branche dédiée.
- **Base** : la base est **résolue par `/scd-implement:run` avant le lancement** et s'applique **à la fois** à la branche dédiée et à la PR. Trois cas : (a) `--base <branche>` explicite → gagne toujours ; (b) auto-stacking → si le lot cible `dépend de : Rk` et que `impl/<slug>-Rk` existe et n'est **pas encore mergée** dans la base par défaut, la base devient `impl/<slug>-Rk` ; (c) sinon → branche par défaut du repo, détectée.
- **Publication** : `pr-author` détecte `gh`/`glab`, `git push -u` (jamais `--force`), et ouvre la PR/MR avec une description structurée (FR/SHALL livrés, tests, findings appliqués/rejetés, preuve du vert).
- **Permissions** : créer une PR est une **action sortante** depuis un run en arrière-plan. Pré-allowlister `Bash(git push *)`, `Bash(gh pr *)`, `Bash(glab mr *)` évite un prompt en cours de run ; sinon `pr-author` peut demander confirmation (ou, en `-p`/SDK, échouer proprement avec `created: false`).
- **Dépendances entre lots — stacking automatique et déterministe.** Un lot qui `dépend de : Rk` non encore mergé s'**empile** : `run` calcule `--base impl/<slug>-Rk`, `branch-setup` forke la branche du lot depuis cette base (le code de `Rk` est donc présent), et `pr-author` ouvre la PR **vers** `impl/<slug>-Rk` (diff = le seul lot courant, pas de rejeu de `Rk`). Quand `Rk` est mergé dans la base par défaut, les runs suivants reviennent à la base par défaut. Deux dépendances non mergées → `run` ne devine pas et demande. **Garde-fous** : `pr-author` refuse (`created: false`) toute PR dont la tête descend d'une PR ouverte visant la même base (anti-chevauchement) ; l'orchestrateur bloque (`blocked-branch-drift`) si les commits atterrissent sur une branche ≠ celle posée par `branch-setup`.
- **Rebase déterministe (préventif + curatif).** Le rebase est une **brique nommée** (`rebaser`, haiku) : elle transplante **exactement** les commits propres du lot (`git rebase --onto <base> <oldBase> <lotBranch>`), ce qui la rend robuste au mode de merge de la dépendance (merge-commit / squash / rebase). Elle est **idempotente** (skip si déjà à jour), n'auto-résout **jamais** un conflit (`--abort` + statut bloquant) et n'utilise **jamais** `--force` sec (uniquement `--force-with-lease`). Deux déclencheurs : **préventif** = phase `Rebase` du workflow (repose la branche sur la base à jour avant d'écrire) ; **curatif** = `/scd-implement:sync` quand une dépendance vient d'être mergée (« R1 mergé → rebase R2 » : re-rebase la PR de `R2` sur la base par défaut et retargete sa base). `oldBase` = la branche de la dépendance `impl/<slug>-Rk`, résolue depuis `dépend de :` — jamais devinée. `/scd-implement:status` **signale la dérive** (PR ouverte, dépendance mergée, branche non rebasée) pour rendre le besoin visible.

## Parallélisme réel : isolation par worktree (deux couches)

Par défaut, un lancement traite **un lot** dans le checkout de session. Pour lancer **plusieurs lots en même temps**, il faut lever deux obstacles **distincts** — ne jamais les confondre :

- **Couche 1 — collision d'exécution.** Tous les subagents d'un workflow opèrent dans le **cwd de session** (un seul checkout). Deux workflows concurrents partagent le même HEAD et le même arbre : `branch-setup` bascule le HEAD global (`git switch -c`) et exige un arbre propre — dès que le premier lot salit l'arbre, les autres s'arrêtent en `blocked-dirty-tree`. **C'est ce que le worktree résout** : chaque lot vit dans son propre `git worktree` (checkout séparé, HEAD indépendant), donc plusieurs lots n'entrent plus en collision.
- **Couche 2 — conflit de contenu.** Deux lots qui éditent le **même fichier** (ex. un registre à source unique `src/checks/index.ts`) entreront en conflit **au merge**, quelle que soit l'isolation d'exécution. Le worktree n'y change **rien**. Cette couche se règle par **sérialisation/empilement** (`--base`), pas par worktree. Le marqueur `[P]` de `tasks.md` encode déjà « parallélisable » (fichiers disjoints) ; on le **généralise** en dérivant la disjonction des ensembles `Fichiers :` de chaque lot.

**Contrainte technique déterminante.** L'outil `Workflow` lance ses subagents dans le cwd de session et n'expose aucun paramètre de répertoire de travail ; le mécanisme `isolation: 'worktree'` des `agent()` crée un worktree *frais par appel* (auto-nettoyé) — inutilisable pour partager **un** worktree entre toutes les phases d'un lot. Conséquence de conception : le worktree d'un lot est créé **explicitement** (`git worktree add`, par `branch-setup`) et son **chemin absolu** est propagé à chaque agent aval, qui **roote toutes ses opérations dessus** : git via `git -C "<worktreeDir>"` (jamais un git implicite sur le cwd), fichiers en chemins absolus sous `<worktreeDir>`, commande de test exécutée avec le worktree comme cwd. En mode worktree, l'arbre principal n'a **pas** à être propre (`git worktree add` ne le touche pas), et le checkout de session reste **inchangé** pendant le run.

**Nettoyage déterministe.** Succès (PR créée, branche poussée) → `pr-author` supprime le worktree (`git worktree remove --force` + `git worktree prune`). Échec/bloqué → le worktree est **conservé** et son chemin **rapporté** pour inspection humaine (le travail du lot n'existe peut-être que là). `branch-setup` fait `git worktree prune` avant toute création (idempotence).

**`/scd-implement:run-parallel`** exploite tout ça : il résout plusieurs lots, calcule la **co-parallélisabilité** (deux lots co-lançables **ssi** leurs `Fichiers :` sont disjoints **ET** aucun ne dépend de l'autre non mergé), refuse de co-lancer des lots qui se recoupent (il les **sérialise** en chaîne `--base`), fetch **une seule fois** avant le fan-out, puis lance l'orchestrateur `implement-parallel.js` — un `parallel([...])` de `workflow('implement-lot', { …, worktree: true })` (imbrication d'un seul niveau). Détails : `references/workflow-template.md` (section `parallel`) et `references/tasks-parsing.md` (co-parallélisabilité).

## Le contrat de fichier d'un dynamic workflow (rappel)

Le workflow est un script JS que le runtime exécute en arrière-plan (cf. `docs/claude-code/workflows.md`). Règles dures, à respecter si tu l'adaptes :
- `export const meta` **littéral pur** en 1re instruction (pas de variable/appel/spread/template).
- Corps async ; primitives injectées (`agent`, `pipeline`, `parallel`, `phase`, `log`, `workflow`, globals `args`/`budget`).
- **Schémas** sur chaque handoff inter-étapes ; `results.filter(Boolean)`.
- Boucles gardées par compteur **et** `budget.remaining()`.
- **Aucun** `Date.now()` / `Math.random()` / `new Date()` sans argument ; **aucune** I/O dans l'orchestrateur (tout accès disque/git se fait dans les prompts `agent()`).
- Les `agent()` ciblent les agents dédiés via `agentType: 'scd-implement:<name>'`.

## Les artefacts et outils (progressive disclosure)

Charge **uniquement** la référence utile à la phase courante :

- `references/tasks-parsing.md` — Parser les lots `Rn`, tâches `Tn`, **mode `_vérif :_`**, backrefs `_Requirements:_`, `[P]`, `Fichiers :`, `dépend de :` ; pull des SHALL depuis `spec.md` ; **règle de co-parallélisabilité** (généralisation de `[P]` : fichiers disjoints ∧ pas de dépendance non mergée). Chargée par `run`, `run-parallel` et `status`. Sections : `role`, `parsing`, `resolution`, `co-parallelism`.
- `references/verification-modes.md` — Les 4 modes de vérif (`TDD`/`test-after`/`check`/`inhérent`) et leur segment de phases, EARS→test, vérif observable (check/inhérent), check déterministe « tests intacts », porte de vérif par preuve. Sections : `role`, `modes`, `tdd`, `observable`, `enforcement`, `pitfalls`.
- `references/testing-rubric.md` — Rubric de test (FIRST, AAA, EP+BVA, doubles, anti-patterns, quand supprimer). Base de `test-writer`/`test-validator`. Sections : `principles`, `selection`, `doubles`, `anti-patterns`, `checklists`.
- `references/review-dimensions.md` — Les six dimensions, le modèle de sévérité, le triage sceptique (« gaps not style », anti sur-engineering). Base de `code-reviewer`/`review-validator`. Sections : `dimensions`, `severity`, `triage`.
- `references/workflow-template.md` — Le dynamic workflow `implement-lot.js` expliqué : phases, schémas, boucles gardées, `agentType`, comment l'adapter, fallback inline ; **mode worktree** (propagation de `worktreeDir`, `git -C`, nettoyage) et **orchestrateur parallèle** `implement-parallel.js`. Sections : `role`, `structure`, `worktree`, `parallel`, `adaptation`, `run`.
