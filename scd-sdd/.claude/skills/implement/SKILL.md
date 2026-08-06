---
name: implement
description: |
  Le NIVEAU IMPLÉMENTATION du cycle spec-driven : honorer et vérifier le contrat produit en
  amont, un lot de review Rn à la fois, via un dynamic workflow qui orchestre des subagents
  dédiés. Mode de vérification déclaré par lot (_vérif :_ — TDD par défaut, sinon test-after /
  check / inhérent), règle « une SHALL EARS = une vérification observable », porte de vérif
  par preuve et jamais par affirmation, producteur ≠ vérificateur, triage adversarial des
  findings, description de PR comme artefact de review, anti-orphelinage des PR empilées,
  isolation par worktree pour le parallélisme réel. Se charge pendant /scd-sdd:run,
  run-parallel, sync, reland et status-impl. Porte UNIQUEMENT l'exécution du contrat — ni le
  socle (skill project-docs), ni l'écriture des specs (skill feature-specs), ni le contrat du
  fichier de suivi (skill journal).
---

# Implémentation par lot, selon son mode de vérification (dynamic workflow)

Ce skill outille l'**exécution** du contrat documentaire d'une feature
(`specs/NNN-feature/{spec,plan,tasks}.md`) : là où le niveau specs **s'arrête à la gate
`analyze`**, ce niveau honore le contrat et le **vérifie**, **un lot de review `Rn` à la
fois**, via un **dynamic workflow** (`.claude/workflows/implement-lot.js`). Chaque lot déclare
un **mode de vérification** (`_vérif :_` ∈ `TDD` défaut · `test-after` · `check` · `inhérent`)
que le workflow lit et honore.

**Frontière de périmètre.** Nous n'écrivons **aucun** document de spec : un défaut du contrat
révélé par l'implémentation se **signale** pour un retour au niveau specs (skill
`feature-specs`), il ne se corrige pas ici. Ce niveau écrit les deux derniers maillons de la
chaîne de traçabilité — **vérification** et **code** — et coche `tasks.md`.

## Le cycle, par lot

Un lancement `/scd-sdd:run NNN Rn` exécute le workflow sur **un seul** lot. Le préambule (1-3)
et le final (4-9) sont **invariants** ; le **segment de vérification** dépend du `_vérif :_` :

1. **Branch** (`branch-setup`) — crée **toujours** la branche dédiée `impl/<slug>-<lot>` depuis
   la base à jour (`git fetch`), **avant tout le reste**. Arbre propre exigé, sinon STOP.
2. **Rebase** (`rebaser`) — **préventif, idempotent** : repose la branche sur la base à jour
   (utile sur une **reprise** où la base a bougé). Conflit → `--abort` + STOP.
3. **Prepare** (`lot-briefer`) — parse le lot **et son mode de vérif**, pull les SHALL depuis
   `spec.md`, détecte la commande de test.

   **Segment de vérification** — l'ordre des phases dépend du mode :

   | Mode | Segment |
   |---|---|
   | `TDD` (défaut) | **Red** (`test-writer`, rouge confirmé) → **Validate** (`test-validator`, 1 SHALL = 1 test, boucle ≤ 2) → **Green** (`implementer`, jusqu'au vert **sans toucher aux tests**, retry ≤ 3) |
   | `test-after` | **Green** (`implementer` d'abord, prouve build/run) → **Red** (tests écrits après, **vert** attendu) → **Validate** → **Green** (porte : `0 failed`, tests intacts) |
   | `check` / `inhérent` | **Green** (selon le critère d'acceptation) → **Verify** (`verifier`, **contexte frais**) : vérif observable dédiée, ou ré-exécution du critère d'acceptation → preuve capturée, ou `humanCheckRequired` remonté à la PR |

4. **Review** (`code-reviewer`) — six dimensions, en contexte frais (**tous les modes**).
5. **Triage** (`review-validator`) — sceptique adversarial, apply/skip.
6. **Apply** (`fix-applier`) — corrections retenues, **re-vérifie selon le mode**.
7. **Record** (`progress-recorder`) — coche `tasks.md`, commit **sur la branche dédiée**.
8. **Describe** (`pr-describer`) — compose la description de review. Non bloquant.
9. **PR** (`pr-author`) — pousse la branche, ouvre la PR/MR **ready for review** en **publiant**
   cette description telle quelle.

**Un lot = une PR** (`impl/<slug>-<lot>` → base) : le niveau specs dimensionne la slice pour
qu'un humain la review, ce niveau-ci la livre effectivement en PR. Détails d'orchestration :
`references/workflow-template.md` et `references/verification-modes.md`.

## Les invariants (ce qui n'est jamais négociable)

- **Le mode vient du contrat ; on l'applique, on ne le réinvente pas.** Un `check`/`inhérent`
  sur de la logique métier est un finding amont, pas un raccourci (`references/verification-modes.md`).
- **TDD strict quand le mode l'exige.** En `TDD`, aucun code de production avant des tests
  écrits, **validés**, et **rouges** ; en `test-after`, le test vient après l'impl mais reste
  **dû** (au vert, validé).
- **Une SHALL = une vérification observable et nommée.** En TDD/test-after : un test nommé
  (`When… shall…` → `submit_valid_form_creates_account`). En check/inhérent : une **preuve
  observable capturée**.
- **Ne jamais toucher aux tests (dès qu'ils existent).** `implementer` et `fix-applier` ne
  modifient jamais les fichiers de test ; la garantie est un **check déterministe**
  `git diff -- <tests>` qui doit rester vide. En check/inhérent, l'invariant est vacant.
- **La vérif se prouve.** `passing` (modes-test) n'est vrai que si la **sortie réelle** montre
  `0 failed` ; `verified` (check/inhérent) exige un `observableProof` capturé — jamais « looks
  done ». Ce qu'un agent ne peut constater part en `humanCheckRequired`, jamais faussement
  attesté.
- **Producteur ≠ vérificateur.** Ni `code-reviewer` (tous modes) ni `verifier` (check/inhérent)
  n'ont écrit le code : le second regard en contexte frais tue le self-preferential bias.
- **Sceptique mais sobre.** Le triage reproduit chaque finding avant de le retenir et ne
  corrige que **correction et exigences** (`references/review-dimensions.md`).

## Cibler feature et lot (résolution)

`/clear` efface le contexte : une commande ne suppose pas sa cible. **La feature** se résout par la section **« Cibler une feature » du skill `feature-specs`** —
source de vérité unique du plugin, référencée et jamais recopiée. Ce niveau n'y ajoute qu'un
filtre : les features dont le `tasks.md` porte des lots non entièrement cochés. **Le lot**, en
propre : l'argument `Rn` s'il est fourni ; sinon le premier `Rn` non entièrement coché **dont
toutes les dépendances sont faites** (`dépend de : Rn`), pris et annoncé ; sinon **ne devine
pas** — signale le blocage, propose le lot débloquable, ou `AskUserQuestion` / renvoi vers
`/scd-sdd:status-impl`.

**L'état vit dans les cases de `tasks.md`** — c'est `progress-recorder` qui les coche, et
`status-impl` qui les relit. Parsing : `references/tasks-parsing.md`.

## État dérivé, événement journalisé

Les cases de `tasks.md` disent *quels lots sont faits*, jamais *ce qui s'est passé*. Chaque
commande d'action consigne donc sa ligne dans `docs/journal/NNN-slug.md` — `run` et
`run-parallel` une ligne **par lot**, `sync`, `reland` ; `status-impl` lit sans écrire. Le fait
propre à ce niveau, **dérivable de rien**, est l'**issue d'un lot bloqué** : sans sa ligne, un
run qui échoue est indiscernable d'un lot jamais lancé. **C'est la commande qui
écrit** — jamais le workflow (aucune I/O par contrat) ni `progress-recorder` (chemin de succès
seul — les statuts `blocked-*` seraient perdus) : elle reçoit l'objet de retour du workflow et
consigne depuis la session principale. Format et vocabulaire : skill **`journal`**.

## Advisory vs déterministe

`CLAUDE.md`/specs = contexte advisory. Ce qui DOIT arriver à 100 % ici est **déterministe et
intégré au workflow**, pas un hook — un hook statique ne connaît ni la phase ni le mode :
« branche dédiée, arbre propre » → phase `branch-setup` ; « tests intacts » → check `git diff`
vide ; « vérifié » → assertion sur `0 failed` ou `observableProof`. La gate `analyze` reste en
amont ; la discipline est portée par la **structure** du workflow.

## Routage de modèles

Pour maîtriser le coût : **opus** — raisonnement dur (`test-validator`, `code-reviewer`,
`review-validator`, `verifier`, `pr-describer`) ; **sonnet** — génération de code
(`test-writer`, `implementer`, `fix-applier`, `lot-briefer`) et `pr-author` (garde-fous à
conditions) ; **haiku** — mécanique (`branch-setup`, `rebaser`, `progress-recorder`).

## Base et rebase

La **base** est résolue par `/scd-sdd:run` avant le lancement et vaut pour la branche comme
pour la PR : `--base` explicite, sinon **auto-stacking** (lot `dépend de : Rk` avec
`impl/<slug>-Rk` non mergée → elle devient la base, et `oldBase`), sinon branche par défaut.
Le rebase est une brique **déterministe et idempotente** (`rebaser`) : `git rebase --onto`,
jamais de résolution de conflit auto, jamais de `--force` sec — **préventif** (phase Rebase)
comme **curatif** (`/scd-sdd:sync`). Détails : `references/workflow-template.md`.

## La description de PR est un artefact de review

Le workflow ne s'arrête pas au code vert : il s'arrête quand **un humain peut reviewer** — le
niveau specs dimensionne la slice, la description rend cette promesse effective. D'où la
séparation : **`pr-describer` (opus, contexte frais, lecture seule) rédige, `pr-author`
publie.** Deux axes : **fonctionnel** (capability, valeur, backref PRD, **hors-périmètre**) et
**code** (stats de diff **mesurées** jamais estimées, ordre de lecture, points à scruter,
**transparence du triage** — findings appliqués **et** rejetés avec motif), plus la checklist
`humanCheckRequired` (jamais cochée par un agent) et le signal `oversized`. **Non bloquant** :
en échec, `pr-author` compose un repli minimal, la PR s'ouvre quand même.

## Anti-orphelinage des PR empilées (la faille du stacking)

Merger une PR empilée dont la base est **encore la branche de lot** `impl/<slug>-Rk` fusionne
les commits **dans cette branche** — cul-de-sac : PR `MERGED`, code **orphelin**, absent de
`main`. **Définitions partagées** (`status-impl`, `sync`, `reland`) : `défaut` = branche par
défaut · **PR empilée** = `baseRefName` est une branche de lot · **lot arrivé dans `main`** =
`Tn` cochés dans `origin/<défaut>:…/tasks.md` (**signal de contenu, prioritaire** — le squash
change les SHA), corroboré par `git merge-base --is-ancestor`.

Trois volets — conditions exactes et dégradé sans `gh`/`glab` dans les trois commandes :
**prévention** (`pr-author` : toute PR empilée s'ouvre en **draft**, labels `stacked` +
`needs-sync`, bloc « ⚠️ ne pas merger directement » ; non empilée → ready) ; **détection**
(`status-impl` : **OK** · **⚠️ DANGEREUX**, base `Rk` déjà dans `main`, merger orphelinerait
→ `sync` · **⚠️ EMPILÉ EN ATTENTE**, merger `Rk` d'abord · **🔴 ORPHELIN** → `reland`) ;
**remédiation** (**`sync`** rebase sur le défaut, retargete la PR, **passe ready**, retire
`needs-sync` — le pont prévention→merge ; **`reland`** recrée une branche depuis le défaut,
cherry-pick les commits propres, ouvre une PR ready → défaut, commente l'orpheline ; jamais
de résolution de conflit auto). **Règle d'or** : *ne jamais merger une PR `stacked` en draft
sans `/scd-sdd:sync` d'abord* ; traiter les 🔴 ORPHELIN avant les ⚠️ DANGEREUX.

## Parallélisme réel : isolation par worktree (deux couches)

Lancer plusieurs lots en même temps lève deux obstacles **distincts** — ne jamais les confondre :

- **Couche 1 — collision d'exécution.** Tous les subagents opèrent dans le **cwd de session** :
  deux workflows concurrents partagent HEAD et arbre, le premier qui écrit fait tomber les
  autres en `blocked-dirty-tree`. **C'est ce que le worktree résout** : `branch-setup` le crée
  **explicitement** et son **chemin absolu** est propagé à chaque agent aval, qui roote tout
  dessus (`git -C`, chemins absolus). L'arbre principal reste inchangé.
- **Couche 2 — conflit de contenu.** Deux lots qui éditent le **même fichier** entreront en
  conflit **au merge**, quelle que soit l'isolation d'exécution. Se règle par
  **sérialisation/empilement** (`--base`), dérivé de la disjonction des ensembles `Fichiers :`.

**`/scd-sdd:run-parallel`** calcule la **co-parallélisabilité** (co-lançables **ssi**
`Fichiers :` disjoints **ET** aucune dépendance mutuelle non mergée), **sérialise** en chaîne
`--base` ce qui se recoupe, fetch **une seule fois**, puis lance `implement-parallel.js`.
Mécanique : `references/workflow-template.md` (§`worktree`, §`parallel`) et
`references/tasks-parsing.md` (§co-parallélisabilité).

## Le contrat de fichier d'un dynamic workflow (rappel)

`export const meta` **littéral pur** en 1re instruction · **schémas** sur chaque handoff ·
boucles gardées par compteur **et** `budget.remaining()` · **aucun**
`Date.now()`/`Math.random()`/`new Date()` sans argument, **aucune** I/O dans l'orchestrateur
(le resume en dépend) · les `agent()` ciblent `agentType: 'scd-sdd:<name>'`.

## Les artefacts et outils (progressive disclosure)

Charge **uniquement** la référence utile à la phase courante :

| Référence | Contenu | Sections |
|---|---|---|
| `tasks-parsing.md` | Lots `Rn`, tâches `Tn`, `_vérif :_`, `_Requirements:_`, `[P]`, `Fichiers :`, `dépend de :` ; pull des SHALL ; **co-parallélisabilité**. Chargée par `run`, `run-parallel`, `status-impl` | `role` `parsing` `resolution` `co-parallelism` |
| `verification-modes.md` | Les 4 modes et leur segment de phases, EARS→test, vérif observable, check « tests intacts », porte de vérif par preuve | `role` `modes` `tdd` `observable` `enforcement` `pitfalls` |
| `testing-rubric.md` | Rubric de test (FIRST, AAA, EP+BVA, doubles, anti-patterns). Base de `test-writer`/`test-validator` | `principles` `selection` `doubles` `anti-patterns` `checklists` |
| `review-dimensions.md` | Les six dimensions, le modèle de sévérité, le triage sceptique. Base de `code-reviewer`/`review-validator` | `dimensions` `severity` `triage` |
| `workflow-template.md` | `implement-lot.js` expliqué : phases et routage de modèles, schémas, boucles gardées, statuts, branche/rebase/PR, adaptation, fallback inline ; **mode worktree** et orchestrateur parallèle | `role` `structure` `worktree` `parallel` `adaptation` `run` |
