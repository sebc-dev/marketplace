---
name: implement
description: |
  Le NIVEAU IMPLÉMENTATION du cycle spec-driven : honorer et vérifier le contrat produit en
  amont, un ticket NN à la fois, via un dynamic workflow qui orchestre des subagents
  dédiés. Mode de vérification déclaré par ticket (**Vérif :** — `test` par défaut, sinon
  observé), règle « un critère = une vérification observable », porte de vérif
  par preuve et jamais par affirmation, producteur ≠ vérificateur, triage adversarial des
  findings, description de PR comme artefact de review, anti-orphelinage des PR empilées,
  isolation par worktree pour le parallélisme réel. Se charge pendant /scd-sdd:run,
  run-parallel, sync, reland et status. Porte UNIQUEMENT l'exécution du ticket — ni le
  socle (skill socle), ni l'écriture des specs (skill specs), ni le contrat du
  travail hors cycle (skill chantier).
---

# Implémentation par ticket, selon son mode de vérification (dynamic workflow)

Ce skill outille l'**exécution** du contrat documentaire d'une feature
(`specs/NNN-feature/{spec,plan,tasks}.md`) : là où le niveau specs **s'arrête à la gate
`/scd-sdd:tickets`**, ce niveau honore le ticket et le **vérifie**, **un ticket `NN` à la
fois**, via un **dynamic workflow** (`.claude/workflows/implement-ticket.js`). Chaque ticket déclare
un **mode de vérification** (`_vérif :_` ∈ `test` défaut · `test` · `check` · `observé`)
que le workflow lit et honore.

**Frontière de périmètre.** Nous n'écrivons **aucun** document de spec : un défaut du contrat
révélé par l'implémentation se **signale** pour un retour au niveau specs (skill
`specs`), il ne se corrige pas ici. Ce niveau écrit les deux derniers maillons de la
chaîne de traçabilité — **vérification** et **code** — et coche le fichier du ticket.

## Le cycle, par ticket

Un lancement `/scd-sdd:run NNN NN` exécute le workflow sur **un seul** ticket. Le préambule (1-3)
et le final (4-10) sont **invariants** ; le **segment de vérification** dépend du `_vérif :_` :

1. **Branch** (`branch-setup`) — crée **toujours** la branche dédiée `impl/<slug>-<NN>` depuis
   la base à jour (`git fetch`), **avant tout le reste**. Arbre propre exigé, sinon STOP.
2. **Rebase** (`rebaser`) — **préventif, idempotent** : repose la branche sur la base à jour
   (utile sur une **reprise** où la base a bougé). Conflit → `--abort` + STOP.
3. **Prepare** (`ticket-briefer`) — parse le ticket **et son mode de vérif**, pull les critères depuis
   `SPEC.md`, détecte la commande de test.

   **Segment de vérification** — quatre phases possibles, dont le **sous-ensemble et l'ordre**
   dépendent du mode : **Red** (`test-writer`), **Validate** (`test-validator`), **Green**
   (`implementer`) et **Verify** (`verifier`, **contexte frais**, modes sans test). Une phase non
   jouée n'apparaît simplement pas dans le run. ⚠️ **La table mode→segment vit dans
   `references/verification-modes.md` (`<modes>`) et nulle part ailleurs** — c'est le fait qui
   divergerait le premier s'il était recopié ici.

4. **Context** (`review-context`) — résout **une fois** le dossier de contexte (invariants de
   `docs/adr/`, décisions et hors-périmètre de `SPEC.md`, contrats, et `aids` — skills/MCP
   pertinents pour la review, `.claude/review.json` faisant autorité) que les six reviewers
   consomment ; il **cite, ne juge pas**. Contexte frais.
5. **Review** (**six reviewers en parallèle**, un par dimension : `architecture-reviewer`,
   `cleanliness-reviewer`, `conventions-reviewer`, `coverage-reviewer`, `security-reviewer`,
   `error-handling-reviewer`) — chacun **sa seule** dimension, en contexte frais (**tous les
   modes**). Les findings sont fusionnés (IDs préfixés par dimension).
6. **Triage** (`review-validator`) — sceptique adversarial, apply/skip, dédoublonne entre reviewers.
7. **Apply** (`fix-applier`) — corrections retenues, **re-vérifie selon le mode**.
8. **Record** (`progress-recorder`) — coche le fichier du ticket, commit **sur la branche dédiée**.
9. **Describe** (`pr-describer`) — compose la description de review. Non bloquant.
10. **PR** (`pr-author`) — pousse la branche, ouvre la PR/MR **ready for review** en **publiant**
    cette description telle quelle.

**Un ticket = une PR** (`impl/<slug>-<NN>` → base) : le niveau specs dimensionne la slice pour
qu'un humain la review, ce niveau-ci la livre effectivement en PR. Détails d'orchestration :
`references/workflow-template.md` et `references/verification-modes.md`.

## Les invariants (ce qui n'est jamais négociable)

- **Le mode vient du contrat ; on l'applique, on ne le réinvente pas.** Un `observé`
  sur de la logique métier est un finding amont, pas un raccourci (`references/verification-modes.md`).
- **Le rouge avant le vert, en mode `test`.** Aucun code de production avant des tests
  écrits, **validés**, et **rouges** ; en `test``, le test vient après l'impl mais reste
  **dû** (au vert, validé).
- **Une critère = une vérification observable et nommée.** En test : un test nommé
  (`When… shall…` → `submit_valid_form_creates_account`). En observé : une **preuve
  observable capturée**.
- **Ne jamais toucher aux tests (dès qu'ils existent).** `implementer` et `fix-applier` ne
  modifient jamais les fichiers de test ; la garantie est un **check déterministe**
  `git diff -- <tests>` qui doit rester vide. En observé, l'invariant est vacant.
- **La vérif se prouve.** `passing` (modes-test) n'est vrai que si la **sortie réelle** montre
  `0 failed` ; `verified` (observé) exige un `observableProof` capturé — jamais « looks
  done ». Ce qu'un agent ne peut constater part en `humanCheckRequired`, jamais faussement
  attesté.
- **Producteur ≠ vérificateur.** Ni les **six reviewers** (tous modes), ni `review-context`, ni
  `verifier` (observé) n'ont écrit le code : le second regard en contexte frais tue le
  self-preferential bias. La **multiplicité** des reviewers ne le renforce ni ne le menace — chacun
  reste frais et non-auteur ; ce qu'elle achète est la **profondeur** par dimension.
- **Sceptique mais sobre.** Le triage reproduit chaque finding avant de le retenir, ne corrige que
  **correction et exigences**, et **dédoublonne** entre reviewers. La grille est dans
  `references/review-dimensions.md`, qu'aucune commande ne charge : `review-context` (`<dossier>`),
  les six reviewers (chacun **son** `<dim-…>` + `<severity>`) et `review-validator` (`<triage>`)
  s'en chargent eux-mêmes, chacun ses blocs.

## Cibler feature et ticket (résolution)

`/clear` efface le contexte : une commande ne suppose **jamais** sa cible. **La feature** se résout
par la section **« Cibler une feature » du skill `specs`** — source de vérité unique du
plugin, référencée et jamais recopiée. **Le ticket** se résout en propre à ce niveau, et la règle — le
filtre de candidature des features compris — vit dans le bloc `<resolution>` de
`references/tickets-parsing.md`, que les sept commandes concernées chargent. Le principe qui la
gouverne, lui, ne se délègue pas : **on ne devine pas un ticket**, on signale le blocage.

**L'état vit dans les cases du fichier du ticket** — c'est `progress-recorder` qui les coche, et
`/scd-sdd:status` qui les relit. Parsing : `references/tickets-parsing.md`.

## Le seul fait que rien ne dérive : un run bloqué

Les cases d'un ticket disent *ce qui est fait*, la forge dit *ce qui est en revue*, `git log` dit
*ce qui a été commité*. Un fait échappe aux trois : **un run qui se bloque ne coche aucun critère
et n'ouvre aucune PR** — il est donc indiscernable d'un ticket jamais lancé.

D'où la seule écriture documentaire de ce niveau : sur un statut `blocked-*`, la commande ouvre une
**fiche de chantier** dans `docs/chantiers/en-cours/`, de `Portée` `NNN-slug · ticket NN`. C'est
`/scd-sdd:status` qui la relit.

**C'est la commande qui écrit** — jamais le workflow (aucune I/O par contrat) ni
`progress-recorder`, qui ne tourne que sur le chemin de succès et perdrait donc exactement les
statuts qu'il faut garder. Elle reçoit l'objet de retour du workflow et écrit depuis la session
principale. Format de la fiche : skill **`chantier`**, `references/fiche.md`.

## Advisory vs déterministe

`CLAUDE.md`/specs = contexte advisory. Ce qui DOIT arriver à 100 % ici est **déterministe et
intégré au workflow**, pas un hook — un hook statique ne connaît ni la phase ni le mode :
« branche dédiée, arbre propre » → phase `branch-setup` ; « tests intacts » → check `git diff`
vide ; « vérifié » → assertion sur `0 failed` ou `observableProof`. Le découpage reste en
amont ; la discipline est portée par la **structure** du workflow.

## Routage de modèles

Le modèle est **imposé à l'appel**, par phase — jamais déclaré dans le `.md` de l'agent — et c'est le
levier de coût du workflow : raisonnement dur en **opus**, génération de code en **sonnet**, mécanique
en **haiku**. ⚠️ **L'affectation phase→modèle vit dans la table des phases de
`references/workflow-template.md`, et nulle part ailleurs** : c'est une propriété du script, qui
change avec lui.

## Base et rebase

La **base** est résolue par `/scd-sdd:run` avant le lancement et vaut pour la branche comme
pour la PR : `--base` explicite, sinon **auto-stacking** (ticket `dépend de : Rk` avec
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

Merger une PR empilée dont la base est **encore la branche de ticket** `impl/<slug>-Rk` fusionne
les commits **dans cette branche** — cul-de-sac : PR `MERGED`, code **orphelin**, absent de
`main`. **Définitions partagées** (`status`, `sync`, `reland`) : `défaut` = branche par
défaut · **PR empilée** = `baseRefName` est une branche de ticket · **ticket arrivé dans `main`** =
`Tn` cochés dans `origin/<défaut>:…/le fichier du ticket` (**signal de contenu, prioritaire** — le squash
change les SHA), corroboré par `git merge-base --is-ancestor`.

Trois volets — conditions exactes et dégradé sans `gh`/`glab` dans les trois commandes :
**prévention** (`pr-author` : toute PR empilée s'ouvre en **draft**, labels `stacked` +
`needs-sync`, bloc « ⚠️ ne pas merger directement » ; non empilée → ready) ; **détection**
(`status` : **OK** · **⚠️ DANGEREUX**, base `Rk` déjà dans `main`, merger orphelinerait
→ `sync` · **⚠️ EMPILÉ EN ATTENTE**, merger `Rk` d'abord · **🔴 ORPHELIN** → `reland`) ;
**remédiation** (**`sync`** rebase sur le défaut, retargete la PR, **passe ready**, retire
`needs-sync` — le pont prévention→merge ; **`reland`** recrée une branche depuis le défaut,
cherry-pick les commits propres, ouvre une PR ready → défaut, commente l'orpheline ; jamais
de résolution de conflit auto). **Règle d'or** : *ne jamais merger une PR `stacked` en draft
sans `/scd-sdd:sync` d'abord* ; traiter les 🔴 ORPHELIN avant les ⚠️ DANGEREUX.

## Parallélisme réel : isolation par worktree (deux couches)

Lancer plusieurs tickets en même temps lève deux obstacles **distincts** — ne jamais les confondre :

- **Couche 1 — collision d'exécution.** Tous les subagents opèrent dans le **cwd de session** :
  deux workflows concurrents partagent HEAD et arbre, le premier qui écrit fait tomber les
  autres en `blocked-dirty-tree`. **C'est ce que le worktree résout** : `branch-setup` le crée
  **explicitement** et son **chemin absolu** est propagé à chaque agent aval, qui roote tout
  dessus (`git -C`, chemins absolus). L'arbre principal reste inchangé.
- **Couche 2 — conflit de contenu.** Deux tickets qui éditent le **même fichier** entreront en
  conflit **au merge**, quelle que soit l'isolation d'exécution. Se règle par
  **sérialisation/empilement** (`--base`), dérivé de la disjonction des ensembles `Fichiers :`.

**`/scd-sdd:run-parallel`** calcule la **co-parallélisabilité** (co-lançables **ssi**
`Fichiers :` disjoints **ET** aucune dépendance mutuelle non mergée), **sérialise** en chaîne
`--base` ce qui se recoupe, fetch **une seule fois**, puis lance `implement-parallel.js`.
Mécanique : `references/workflow-template.md` (`<worktree>`, `<parallel>`) et
`references/tickets-parsing.md` (`<co-parallelism>`).

## Le contrat de fichier d'un dynamic workflow (rappel)

`export const meta` **littéral pur** en 1re instruction · **schémas** sur chaque handoff ·
boucles gardées par compteur **et** `budget.remaining()` · **aucun**
`Date.now()`/`Math.random()`/`new Date()` sans argument, **aucune** I/O dans l'orchestrateur
(le resume en dépend) · les `agent()` ciblent `agentType: 'scd-sdd:<name>'`.

## Les artefacts et outils (progressive disclosure)

Charge **uniquement** la référence utile à la phase courante, et **seulement les blocs** dont tu as
besoin. Deux des cinq ne sont chargées **par aucune commande** : ce sont des **agents** qui les
chargent, chacun ses blocs.

| Référence | Contenu | Chargée par | Sections |
|---|---|---|---|
| `tickets-parsing.md` | Format du ticket, `**Vérif :**`, `**Bloqué par :**`, `**Fichiers :**`, critères ; états dérivés ; résolution du ticket ; **co-parallélisabilité** | 5 commandes : `run`, `run-parallel` (seule à charger `<co-parallelisme>`), `sync`, `reland`, `status`. **Aucun agent** | `role` `parsing` `etats` `resolution` `co-parallelisme` |
| `verification-modes.md` | Les 4 modes et **la table mode→segment**, EARS→test, vérif observable, check « tests intacts », porte de vérif par preuve | `run`, `run-parallel`. **Aucun agent** : chaque agent du segment porte la discipline de **son** mode dans son corps | `role` `modes` `tdd` `observable` `enforcement` `pitfalls` |
| `testing-rubric.md` | Rubric de test (FIRST, AAA, EP+BVA, doubles, anti-patterns) | **Deux agents** : `test-writer` (`principles` `selection` `doubles`) et `test-validator` (`principles` `anti-patterns` `checklists`). Aucune commande | `principles` `selection` `doubles` `anti-patterns` `checklists` |
| `review-dimensions.md` | Le dossier de contexte, les six dimensions (une par reviewer) et leur référent, le modèle de sévérité, le triage sceptique | **Huit agents** : `review-context` (`dossier`), les six reviewers (chacun son `dim-…` + `severity`) et `review-validator` (`triage`). Aucune commande | `dossier` `dim-architecture` `dim-cleanliness` `dim-conventions` `dim-coverage` `dim-security` `dim-error-handling` `severity` `triage` |
| `workflow-template.md` | `implement-ticket.js` expliqué : phases et **affectation phase→modèle**, schémas, boucles gardées, statuts, branche/rebase/PR, adaptation, fallback inline ; **mode worktree** et orchestrateur parallèle | **Sur renvoi, sans point de chargement déclaré** — `run`/`run-parallel` n'en ont pas besoin pour lancer (la recette de lancement vit dans leur `## Processus`) ; elle se lit quand on adapte ou qu'on débogue le script | `role` `structure` `worktree` `parallel` `adaptation` `run` |
