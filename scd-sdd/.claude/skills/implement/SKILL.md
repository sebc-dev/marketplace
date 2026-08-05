---
name: implement
description: |
  Le NIVEAU IMPLÉMENTATION du cycle spec-driven : honorer et vérifier le contrat
  produit en amont, un lot de review Rn à la fois, via un dynamic workflow qui
  orchestre des subagents dédiés. Mode de vérification déclaré par lot (_vérif :_ —
  TDD par défaut, sinon test-after / check / inhérent), règle « une SHALL EARS = une
  vérification observable », porte de vérif par preuve et jamais par affirmation,
  producteur ≠ vérificateur, triage adversarial des findings, description de PR comme
  artefact de review, anti-orphelinage des PR empilées, isolation par worktree pour le
  parallélisme réel. Se charge pendant /scd-sdd:run, run-parallel, sync, reland et
  status-impl. Porte UNIQUEMENT l'exécution du contrat — ni le socle (skill
  project-docs), ni l'écriture des specs (skill feature-specs), ni le contrat du
  fichier de suivi (skill journal).
---

# Implémentation par lot, selon son mode de vérification (dynamic workflow)

Ce skill outille l'**exécution** du contrat documentaire d'une feature. Là où le niveau specs
produit et atteste `specs/NNN-feature/{spec,plan,tasks}.md` puis **s'arrête à la gate
`analyze`**, ce niveau prend le relais : il honore le contrat et le **vérifie**, en implémentant
**un lot de review `Rn` à la fois** via un **dynamic workflow** (`.claude/workflows/implement-lot.js`).
Chaque lot déclare un **mode de vérification** (`_vérif :_` ∈ `TDD` défaut · `test-after` ·
`check` · `inhérent`) que le workflow lit et honore — le TDD reste le défaut, plus la loi unique.

**Frontière de périmètre.** Nous n'écrivons **aucun** document de spec. Si l'implémentation
révèle un défaut du contrat (une SHALL intestable, un cas manquant), on ne le corrige pas ici :
on le **signale** pour un retour au niveau specs (skill `feature-specs` : nouveau critère, FR,
ou passe `premortem`). Ici on écrit les deux derniers maillons de la chaîne de traçabilité —
**vérification** et **code** — et on coche `tasks.md`.

```
FR du PRD → FR/SHALL de la spec → tâche Tn → vérification → code
                                  └──── niveau implémentation ────┘
```

## Le cycle, par lot

Un lancement `/scd-sdd:run NNN Rn` exécute le workflow sur **un seul** lot. Le préambule (1-3)
et le final (Review→PR) sont **invariants** ; le **segment de vérification** (au centre) dépend
du `_vérif :_` du lot :

1. **Branch** (`branch-setup`) — crée **toujours** la branche dédiée `impl/<slug>-<lot>` depuis
   la base à jour (`git fetch`), **avant tout le reste**. Arbre propre exigé, sinon STOP.
2. **Rebase** (`rebaser`) — **préventif, idempotent** : repose la branche sur la base à jour
   avant d'écrire. No-op sur une branche fraîche ; utile sur une **reprise** où la base a bougé.
   Conflit → `--abort` + STOP.
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

Détails d'orchestration, segment par mode et adaptation du script :
`references/workflow-template.md` et `references/verification-modes.md`.

**Un lot = une PR.** Le run se termine par une PR par lot (`impl/<slug>-<lot>` → base). C'est le
prolongement direct de « un lot ≈ une PR reviewable » : le niveau specs dimensionne la slice
pour qu'un humain la review, ce niveau-ci la livre effectivement en PR.

## Les invariants (ce qui n'est jamais négociable)

- **Le mode vient du contrat ; on l'applique, on ne le réinvente pas.** Chaque lot déclare
  `_vérif :_` (défaut `TDD` si absent). Un `check`/`inhérent` sur de la vraie logique métier est
  un finding amont, pas un raccourci que le workflow entérine. Voir `references/verification-modes.md`.
- **TDD strict quand le mode l'exige.** En `TDD`, aucun code de production avant que les tests
  soient écrits, **validés**, et **rouges** (échec légitime) — l'ordre T-test → T-impl est déjà
  porté par `tasks.md`. En `test-after`, le test est écrit après l'impl mais reste **dû** (au
  vert, validé).
- **Une SHALL = une vérification observable et nommée.** En TDD/test-after : un test nommé
  (`When… shall…` → `submit_valid_form_creates_account`). En check/inhérent : une **preuve
  observable capturée**. Un SHALL sans vérification = filet troué.
- **Ne jamais toucher aux tests (dès qu'ils existent).** `implementer` et `fix-applier` ne
  modifient jamais les fichiers de test ; la garantie est un **check déterministe**
  `git diff -- <tests>` qui doit rester vide — pas un hook (un hook statique ne sait ni
  distinguer la phase, ni si le lot a des tests). En check/inhérent, l'invariant est vacant.
- **La vérif se prouve.** `passing` (modes-test) n'est vrai que si la **sortie réelle** montre
  `0 failed` ; `verified` (check/inhérent) exige un `observableProof` capturé. Jamais « looks
  done ». Ce qu'un agent ne peut constater (rendu visuel, effet externe) part en
  `humanCheckRequired` — jamais faussement attesté.
- **Producteur ≠ vérificateur.** Ni `code-reviewer` (tous modes) ni `verifier` (check/inhérent)
  n'ont écrit le code : le second regard en contexte frais tue le self-preferential bias.
- **Sceptique mais sobre.** Le triage reproduit chaque finding avant de le retenir et **ne
  corrige que ce qui touche la correction ou une exigence**. Voir `references/review-dimensions.md`.

## Cibler feature et lot (résolution)

`/clear` efface le contexte : une commande ne suppose pas sa cible.

**La feature** se résout par la section **« Cibler une feature » du skill `feature-specs`** —
source de vérité unique du plugin, référencée et jamais recopiée. Ce niveau n'y ajoute qu'un
filtre : parmi les features candidates, celles dont le `tasks.md` porte des lots non entièrement
cochés.

**Le lot**, en propre :
1. Argument `Rn` fourni → c'est la cible.
2. Sinon → le premier `Rn` non entièrement coché dans l'ordre des dépendances (`dépend de : Rn`),
   **dont toutes les dépendances sont faites** → le prendre et l'annoncer.
3. Sinon (0 candidat, ou un lot bloqué par une dépendance non faite) → **ne devine pas** :
   signale le blocage, propose le lot débloquable, ou `AskUserQuestion` / renvoi vers
   `/scd-sdd:status-impl`.

**L'état vit dans les cases de `tasks.md`** — c'est `progress-recorder` qui les coche, et
`status-impl` qui les relit. Parsing : `references/tasks-parsing.md`.

## État dérivé, événement journalisé

Les cases de `tasks.md` donnent un instantané : elles disent *quels lots sont faits*, jamais
*ce qui s'est passé*. Chaque commande d'action de ce niveau consigne donc sa ligne dans
`docs/journal/NNN-slug.md` : `run` et `run-parallel` (une ligne **par lot**), `sync`, `reland`.
Seul `status-impl` n'écrit rien — il lit.

Un fait de ce niveau n'est **dérivable de rien** : l'**issue d'un lot bloqué**. Un run qui
échoue ne coche aucune case et n'ouvre aucune PR — sans sa ligne au journal, il est
indiscernable d'un lot jamais lancé.

C'est pourquoi **c'est la commande qui écrit, jamais le workflow** : l'orchestrateur n'a par
contrat aucune I/O, et `progress-recorder` — candidat naturel puisqu'il édite déjà `tasks.md` —
ne tourne que sur le chemin de succès. Lui confier le journal perdrait les 10 statuts
`blocked-*`, c'est-à-dire précisément les runs qu'on veut tracer. La commande reçoit l'objet de
retour du workflow (`{status, mode, passing, pr, …}`) et consigne depuis la session principale.

Le format, la règle d'ajout et le vocabulaire attendu par phase appartiennent au skill
**`journal`**, chargé au moment de consigner — ils ne sont pas recopiés ici. Retenir seulement
la frontière : une ligne est un **événement daté**, jamais un état.

## Advisory vs déterministe

`CLAUDE.md`/specs = contexte advisory. Ce qui DOIT arriver à 100 % ici est **déterministe et
intégré au workflow**, pas un hook :
- « branche dédiée depuis la base à jour, arbre propre » → première phase `branch-setup` ;
- « tests intacts » (dès qu'un test existe) → check `git diff` (vide) dans
  `implementer`/`fix-applier` ;
- « vérifié » → assertion sur la sortie `0 failed` (modes-test) ou sur un `observableProof`
  capturé (check/inhérent).

Rien ici n'est bloquant-100 % de façon *statique* (la phase **et** le mode comptent — un hook ne
sait ni l'un ni l'autre). La gate documentaire `analyze` reste en amont ; la discipline de
vérification est portée par la **structure** du workflow. Le hook d'immutabilité ADR du plugin
ne gêne pas : `tasks.md` n'est pas sous `docs/adr/`.

## Routage de modèles

Pour maîtriser le coût d'un dynamic workflow (« substantiellement plus » de tokens) :
- **opus** — raisonnement dur : `test-validator`, `code-reviewer`, `review-validator`,
  `verifier`, `pr-describer`.
- **sonnet** — génération de code : `test-writer`, `implementer`, `fix-applier`, `lot-briefer`.
- **haiku** — mécanique : `progress-recorder`, `rebaser`, `branch-setup` (exécutent une recette,
  ne raisonnent pas).

`pr-author` (sonnet) est mécanique mais reste en sonnet : il porte des garde-fous à conditions
(anti-chevauchement, anti-orphelinage, worktree) qu'une recette haiku appliquerait mal.

## Branche, base et rebase

- **Branche** : `branch-setup` crée **systématiquement** `impl/<slug>-<lot>` **avant tout autre
  travail**, depuis la base **mise à jour**. **Arbre propre exigé**, sinon `blocked-dirty-tree`.
  Rien ne peut atterrir sur la base.
- **Base** : résolue par `/scd-sdd:run` **avant** le lancement, elle s'applique **à la fois** à
  la branche dédiée et à la PR. Trois cas : (a) `--base` explicite → gagne toujours ;
  (b) auto-stacking → si le lot `dépend de : Rk` et que `impl/<slug>-Rk` existe et n'est **pas
  encore mergée**, la base devient `impl/<slug>-Rk` ; (c) sinon → branche par défaut du repo.
- **Publication** : `pr-author` détecte `gh`/`glab`, `git push -u` (jamais `--force`). Il est le
  **publieur**, pas l'auteur. Pré-allowlister `Bash(git push *)`, `Bash(gh pr *)`,
  `Bash(glab mr *)` évite un prompt en cours de run.
- **Rebase déterministe.** Brique nommée (`rebaser`) : transplante **exactement** les commits
  propres du lot (`git rebase --onto <base> <oldBase> <lotBranch>`), robuste au mode de merge de
  la dépendance (merge-commit / squash / rebase). **Idempotente**, n'auto-résout **jamais** un
  conflit, **jamais** de `--force` sec (uniquement `--force-with-lease`). Deux déclencheurs :
  **préventif** (phase `Rebase`) et **curatif** (`/scd-sdd:sync`, « R1 mergé → rebase R2 »).
  `oldBase` = la branche de la dépendance, résolue depuis `dépend de :` — jamais devinée.

## La description de PR est un artefact de review

Le workflow ne s'arrête pas au code vert : il s'arrête quand **un humain peut reviewer**. Une PR
décrite par « lot R2, 5 tests, 3 fichiers » sous-traite au reviewer tout le travail de
reconstitution. Le niveau specs dimensionne la slice pour qu'elle soit reviewable ; la
description rend cette promesse effective. D'où la séparation : **`pr-describer` (opus, contexte
frais) rédige, `pr-author` (sonnet) publie** — le premier n'a aucun pouvoir sortant.

Deux axes : **fonctionnel** (capability, valeur et backref PRD via `brief.context`, table
`FR → SHALL EARS → vérification`, et surtout le **hors-périmètre** — scope EXCLU et lots
suivants, sans quoi le reviewer réclame ce qui a été délibérément exclu) et **code** (stats de
diff **mesurées** via `git diff --numstat` sur `merge-base(base, HEAD)..HEAD` et jamais estimées,
ordre de lecture motivé, 2-3 points à scruter dérivés des SHALL `error|boundary`, commande pour
rejouer la vérif, et la **transparence du triage** — findings appliqués **et** rejetés avec leur
motif : une review dont on ne voit pas les angles morts vaut moins qu'aucune review).

Deux garde-fous portés par la description elle-même : la checklist `humanCheckRequired` (ce que
le workflow n'a **pas** pu prouver — jamais cochée par un agent) et le signal `oversized` quand
le diff réel dépasse ~400 lignes ou 2× le budget estimé du lot.

**Non bloquant.** Si `pr-describer` échoue ou est sauté faute de budget, `pr-author` compose un
corps de repli minimal : une description pauvre est un défaut de confort, jamais un motif de
perdre le lot.

## Anti-orphelinage des PR empilées (la faille du stacking)

Si un humain merge une PR empilée alors que sa base est **encore la branche de lot intermédiaire**
`impl/<slug>-Rk`, GitHub fusionne les commits **dans cette branche** — un cul-de-sac — et
**jamais dans la branche par défaut**. La PR passe `MERGED`, mais le code est **orphelin** :
absent de `main`. Symptôme réel : `PR #6 MERGED base=impl/<slug>-R5`, `main` sans le code de
`R6`. Ce trou est comblé sur **trois volets**.

**Définitions (partagées par `status-impl`, `sync`, `reland`)** :
- `défaut` = branche par défaut du repo (`git symbolic-ref refs/remotes/origin/HEAD` → suffixe
  après `origin/`).
- **PR empilée** : `baseRefName` == une branche de lot `impl/<slug>-R*` (donc ≠ `défaut`).
- **Lot arrivé dans `main`** (signal de **contenu**, robuste au squash/rebase/merge-commit) : ses
  `Tn` sont cochés dans `origin/<défaut>:specs/<NNN-slug>/tasks.md` (`git show`). Corroboration
  git : `git merge-base --is-ancestor <headRefOid> origin/<défaut>`. **Le signal contenu prime**
  (le squash change les SHA, l'ancêtre échoue alors à tort).

**1. Prévention (`pr-author`).** Toute PR empilée est ouverte en **draft** (un draft ne se merge
pas sans passage ready explicite → barrière naturelle), labellisée `stacked` + `needs-sync`
(best-effort), description préfixée d'un bloc « ⚠️ ne pas merger directement ». Retour
`stacked: true`, `state: "draft"`. Une PR non empilée reste **ready**.

**2. Détection (`/scd-sdd:status-impl`, lecture seule).** Classe chaque PR de lot en **4 états** :

| État | Condition | Remédiation |
|---|---|---|
| **OK** | `MERGED` ∧ lot arrivé dans `main` ; ou `OPEN` non empilée | — |
| **⚠️ DANGEREUX** | `OPEN` ∧ base = `impl/<slug>-Rk` ∧ `Rk` **arrivé** dans `main` | `/scd-sdd:sync NNN Rn` — merger maintenant orphelinerait |
| **⚠️ EMPILÉ EN ATTENTE** | `OPEN` ∧ base = `impl/<slug>-Rk` ∧ `Rk` **pas encore** dans `main` | merger `Rk` d'abord, **puis** `sync` |
| **🔴 ORPHELIN** | `MERGED` ∧ base ≠ `défaut` ∧ lot **absent** de `main` | `/scd-sdd:reland NNN Rn` |

Dégrade proprement sans `gh`/`glab` (signal git seul, « état PR indisponible »).

**3. Remédiation.** Deux briques, jamais de résolution de conflit auto. **`sync`** rebase
`--onto origin/<défaut> <oldBase> <branche>` (via `rebaser`, `--force-with-lease`), retargete
(`gh pr edit --base <défaut>`), **passe ready** et **retire `needs-sync`** — c'est le **pont
prévention→sync** qui rend la PR draft mergeable en sécurité. **`reland`** (agent `relander`)
recrée `reland/<slug>-Rn` depuis `origin/<défaut>`, cherry-pick les commits **propres** du lot
(`git log <oldBase>..<headRefOid> --no-merges --reverse`), pousse, ouvre une **PR ready → défaut**
et commente l'orpheline (jamais rouverte). Idempotent.

**Règle d'or.** *Ne jamais merger une PR `stacked` en draft sans avoir passé `/scd-sdd:sync`
d'abord.* Ordre d'action sur un `status-impl` : traiter les 🔴 ORPHELIN (code déjà perdu de
`main`) avant les ⚠️ DANGEREUX (risque au prochain merge).

## Parallélisme réel : isolation par worktree (deux couches)

Par défaut, un lancement traite **un lot** dans le checkout de session. Pour lancer **plusieurs
lots en même temps**, il faut lever deux obstacles **distincts** — ne jamais les confondre :

- **Couche 1 — collision d'exécution.** Tous les subagents d'un workflow opèrent dans le **cwd
  de session** (un seul checkout). Deux workflows concurrents partagent le même HEAD et le même
  arbre : `branch-setup` bascule le HEAD global et exige un arbre propre — dès que le premier lot
  salit l'arbre, les autres s'arrêtent en `blocked-dirty-tree`. **C'est ce que le worktree
  résout.**
- **Couche 2 — conflit de contenu.** Deux lots qui éditent le **même fichier** entreront en
  conflit **au merge**, quelle que soit l'isolation d'exécution. Le worktree n'y change **rien**.
  Cette couche se règle par **sérialisation/empilement** (`--base`). Le marqueur `[P]` de
  `tasks.md` encode déjà « fichiers disjoints » ; on le **généralise** en dérivant la disjonction
  des ensembles `Fichiers :`.

**Contrainte technique déterminante.** L'outil `Workflow` lance ses subagents dans le cwd de
session sans paramètre de répertoire de travail ; l'`isolation: 'worktree'` des `agent()` crée un
worktree *frais par appel* — inutilisable pour partager **un** worktree entre toutes les phases
d'un lot. D'où : le worktree est créé **explicitement** (`git worktree add`, par `branch-setup`)
et son **chemin absolu** propagé à chaque agent aval, qui **roote toutes ses opérations dessus** —
git via `git -C "<worktreeDir>"` (jamais un git implicite sur le cwd), fichiers en chemins
absolus, commande de test avec le worktree comme cwd. L'arbre principal n'a alors **pas** à être
propre et reste **inchangé**.

**Nettoyage déterministe.** Succès (PR créée) → `pr-author` supprime le worktree. Échec/bloqué →
worktree **conservé** et chemin **rapporté** pour inspection humaine (le travail du lot n'existe
peut-être que là). `branch-setup` fait `git worktree prune` avant toute création.

**`/scd-sdd:run-parallel`** exploite tout ça : résout plusieurs lots, calcule la
**co-parallélisabilité** (co-lançables **ssi** `Fichiers :` disjoints **ET** aucune dépendance
mutuelle non mergée), **sérialise** en chaîne `--base` ce qui se recoupe, fetch **une seule fois**
avant le fan-out, puis lance `implement-parallel.js`. Détails : `references/workflow-template.md`
(§`parallel`) et `references/tasks-parsing.md` (§co-parallélisabilité).

## Le contrat de fichier d'un dynamic workflow (rappel)

Le workflow est un script JS que le runtime exécute en arrière-plan. Règles dures, à respecter si
tu l'adaptes :
- `export const meta` **littéral pur** en 1re instruction (pas de variable/appel/spread/template).
- Corps async ; primitives injectées (`agent`, `pipeline`, `parallel`, `phase`, `log`, `workflow`,
  globals `args`/`budget`).
- **Schémas** sur chaque handoff inter-étapes ; `results.filter(Boolean)`.
- Boucles gardées par compteur **et** `budget.remaining()`.
- **Aucun** `Date.now()` / `Math.random()` / `new Date()` sans argument ; **aucune** I/O dans
  l'orchestrateur (tout accès disque/git se fait dans les prompts `agent()`). Le resume en dépend.
- Les `agent()` ciblent les agents dédiés via `agentType: 'scd-sdd:<name>'`.

## Les artefacts et outils (progressive disclosure)

Charge **uniquement** la référence utile à la phase courante :

| Référence | Contenu | Sections |
|---|---|---|
| `tasks-parsing.md` | Lots `Rn`, tâches `Tn`, `_vérif :_`, `_Requirements:_`, `[P]`, `Fichiers :`, `dépend de :` ; pull des SHALL ; **co-parallélisabilité**. Chargée par `run`, `run-parallel`, `status-impl` | `role` `parsing` `resolution` `co-parallelism` |
| `verification-modes.md` | Les 4 modes et leur segment de phases, EARS→test, vérif observable, check « tests intacts », porte de vérif par preuve | `role` `modes` `tdd` `observable` `enforcement` `pitfalls` |
| `testing-rubric.md` | Rubric de test (FIRST, AAA, EP+BVA, doubles, anti-patterns). Base de `test-writer`/`test-validator` | `principles` `selection` `doubles` `anti-patterns` `checklists` |
| `review-dimensions.md` | Les six dimensions, le modèle de sévérité, le triage sceptique. Base de `code-reviewer`/`review-validator` | `dimensions` `severity` `triage` |
| `workflow-template.md` | `implement-lot.js` expliqué : phases, schémas, boucles gardées, `agentType`, adaptation, fallback inline ; **mode worktree** et orchestrateur parallèle | `role` `structure` `worktree` `parallel` `adaptation` `run` |
