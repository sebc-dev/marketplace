---
name: implement
description: |
  Connaissance transverse pour le workflow dynamique d'implémentation TDD — la suite
  de scd-feature-specs. Comment lire le contrat produit en amont (specs/NNN-feature/
  {spec,plan,tasks}.md) et l'honorer, lot de review Rn par lot : la boucle rouge→vert
  →review→triage→apply, la règle « une SHALL EARS = un test nommé », le backref Kiro
  _Requirements:_, la discipline TDD (tests écrits → validés → rouge confirmé AVANT
  toute implémentation), l'invariant « ne jamais toucher aux tests en phase verte »
  garanti par un check git-diff déterministe (pas un hook, qui ignore la phase), la
  porte verte par preuve (sortie 0 failed, jamais une affirmation), le second regard
  en contexte frais pour la review (producteur ≠ vérificateur), le triage sceptique
  adversarial des findings (reproduire avant de retenir, ne corriger que correction/
  exigence), le routage de modèles (opus pour raisonnement/review, sonnet pour codegen,
  haiku pour l'enregistrement) et le contrat de fichier d'un dynamic workflow. Se charge
  pendant /scd-implement:* (run, sync, status). Périmètre : honorer et vérifier le contrat —
  pas l'écrire (spec/plan/tasks appartiennent à scd-feature-specs). Un lancement = un lot.
---

# Implémentation TDD par lot (dynamic workflow)

Ce skill outille l'**exécution** du contrat documentaire d'une feature. Là où `scd-feature-specs` produit et atteste `specs/NNN-feature/{spec,plan,tasks}.md` puis **s'arrête à la gate `analyze`**, ce plugin prend le relais : il honore le contrat et le **vérifie**, en implémentant **un lot de review `Rn` à la fois** via un **dynamic workflow** (`.claude/workflows/implement-lot.js`).

**Frontière de périmètre.** Nous n'écrivons **aucun** document de spec. Si l'implémentation révèle un défaut du contrat (une SHALL intestable, un cas manquant), on ne le corrige pas ici : on le **signale** pour un retour amont (`scd-feature-specs` : nouveau critère, FR, ou passe `premortem`). Ici on écrit les deux derniers maillons de la chaîne de traçabilité — **test** et **code** — et on coche `tasks.md`.

```
FR du PRD → FR/SHALL de la spec → tâche Tn → test → code
                                    └──────── scd-implement ────────┘
```

## Le cycle, par lot

Un lancement `/scd-implement:run NNN Rn` exécute le workflow sur **un seul** lot :

1. **Branch** (`branch-setup`) — crée **toujours** la branche dédiée `impl/<slug>-<lot>` depuis la base à jour (`git fetch`), **avant tout le reste**. Arbre propre exigé, sinon STOP.
2. **Rebase** (`rebaser`) — **préventif, idempotent** : repose la branche sur la base à jour avant d'écrire. No-op sur une branche fraîche ; utile sur une **reprise** où la base a bougé. Conflit → `--abort` + STOP.
3. **Prepare** (`lot-briefer`) — parse le lot, pull les SHALL depuis `spec.md`, détecte la commande de test.
4. **Red** (`test-writer`) — un test nommé par SHALL, exécution, **rouge confirmé**.
5. **Validate** (`test-validator`) — 1 SHALL = 1 test, cas limites, conventions, anti-patterns. Boucle de correction ≤ 2.
6. **Green** (`implementer`) — code jusqu'au vert, **sans toucher aux tests**. Retry ≤ 3.
7. **Review** (`code-reviewer`) — six dimensions, en contexte frais.
8. **Triage** (`review-validator`) — sceptique adversarial, apply/skip.
9. **Apply** (`fix-applier`) — corrections retenues, re-vérifie le vert.
10. **Record** (`progress-recorder`) — coche `tasks.md`, commit **sur la branche dédiée**.
11. **PR** (`pr-author`) — pousse la branche, ouvre la PR/MR **ready for review** avec une description structurée.

Détails d'orchestration et adaptation du script : `references/workflow-template.md`.

**Un lot = une PR.** Le run se termine par une PR par lot (`impl/<slug>-<lot>` → base). C'est le prolongement direct de « un lot ≈ une PR reviewable » : `scd-feature-specs` dimensionne la slice pour qu'un humain la review, `scd-implement` la livre effectivement en PR.

## Les invariants (ce qui n'est jamais négociable)

- **TDD strict.** Aucun code de production avant que les tests soient écrits, **validés**, et **rouges** (échec légitime). L'ordre T-test → T-impl est déjà porté par `tasks.md`. Voir `references/green-gate.md`.
- **Une SHALL = un test nommé.** Chaque `When… shall…` / `If… then… shall…` d'un FR livré par le lot se traduit en un test dont le nom décrit le scénario et le résultat. Un SHALL sans test = filet troué.
- **Ne jamais toucher aux tests en phase verte.** `implementer` et `fix-applier` ne modifient jamais les fichiers de test ; la garantie est un **check déterministe** `git diff -- <tests>` qui doit rester vide — pas un hook (un hook statique ne sait pas distinguer la phase d'écriture des tests de la phase verte). Voir `references/green-gate.md`.
- **Le vert se prouve.** `passing` n'est vrai que si la **sortie réelle** de la commande montre `0 failed`. Jamais « looks done ».
- **Producteur ≠ vérificateur.** `code-reviewer` n'a pas écrit le code : le second regard en contexte frais tue le self-preferential bias. `implementer` et `code-reviewer` ne partagent jamais de contexte.
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
- « tests intacts » → check `git diff` (vide) dans `implementer`/`fix-applier` ;
- « vert » → assertion sur la sortie `0 failed`.

Ce plugin **ne livre aucun hook** : rien ici n'est bloquant-100 % de façon *statique* (la phase compte). La gate documentaire `analyze` reste en amont ; la discipline TDD est portée par la **structure** du workflow. (Le hook d'immutabilité ADR de `scd-feature-specs`, s'il est installé dans le repo cible, ne gêne pas : `tasks.md` n'est pas sous `docs/adr/`.)

## Routage de modèles

Pour maîtriser le coût d'un dynamic workflow (« substantiellement plus » de tokens) :
- **opus** — raisonnement dur : `test-validator`, `code-reviewer`, `review-validator`.
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

- `references/tasks-parsing.md` — Parser les lots `Rn`, tâches `Tn`, backrefs `_Requirements:_`, `[P]`, `Fichiers :`, `dépend de :` ; pull des SHALL depuis `spec.md`. Chargée par `run` et `status`. Sections : `role`, `parsing`, `resolution`.
- `references/green-gate.md` — Discipline rouge/vert, EARS→test, check déterministe « tests intacts », porte verte par preuve. Sections : `role`, `tdd`, `enforcement`, `pitfalls`.
- `references/testing-rubric.md` — Rubric de test (FIRST, AAA, EP+BVA, doubles, anti-patterns, quand supprimer). Base de `test-writer`/`test-validator`. Sections : `principles`, `selection`, `doubles`, `anti-patterns`, `checklists`.
- `references/review-dimensions.md` — Les six dimensions, le modèle de sévérité, le triage sceptique (« gaps not style », anti sur-engineering). Base de `code-reviewer`/`review-validator`. Sections : `dimensions`, `severity`, `triage`.
- `references/workflow-template.md` — Le dynamic workflow `implement-lot.js` expliqué : phases, schémas, boucles gardées, `agentType`, comment l'adapter, fallback inline. Sections : `role`, `structure`, `adaptation`, `run`.
