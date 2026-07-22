# implement

**Le workflow dynamique d'implémentation — la suite de `scd-feature-specs`. Un lot de review à la fois, selon son mode de vérification.**

Là où `scd-feature-specs` produit et **atteste** le contrat d'une feature (`specs/NNN-feature/{spec,plan,tasks}.md`, gate `analyze` au vert) puis **s'arrête**, `scd-implement` prend le relais : il **honore** ce contrat et le **vérifie**, en implémentant **un lot `Rn` à la fois** via un **dynamic workflow** — un script JS qui orchestre des subagents dédiés en arrière-plan. Chaque lot déclare un **mode de vérification** (`_vérif :_` ∈ `TDD` défaut · `test-after` · `check` · `inhérent`) que le workflow lit et honore — **le TDD est le défaut, plus la loi unique**.

```
Branche dédiée (base à jour) → Rebase (préventif) → Prepare (mode) →
   segment de vérif SELON LE MODE :
     TDD        → Rouge (tests) → Valider → Vert (impl)
     test-after → Vert (impl) → Tests (au vert) → Valider
     check      → Vert (impl) → Verify (vérif observable, contexte frais)
     inhérent   → Vert (impl) → Verify (critère d'acceptation = la preuve)
   → Review → Triage sceptique → Apply → Record → PR
```

L'humain a décidé du *quoi* en amont (le contrat, mode compris). Ici, le workflow exécute le *comment* et **prouve la vérification** — 0 failed ou preuve observable — sans intervention humaine en cours de run.

## Frontières

- **En amont — `scd-feature-specs`** = les documents par feature, **mode de vérif compris**. Ce plugin ne les écrit pas : il les lit et signale si le contrat est incomplet (ou si un mode paraît mal choisi).
- **`scd-implement`** = le code + la vérification + la review. Il écrit les **deux derniers maillons** de la chaîne de traçabilité — *vérification* (test ou preuve observable) et *code* — et coche `tasks.md`.
- Si l'implémentation révèle un défaut du **contrat** (SHALL intestable, cas manquant), il le **signale** pour un retour amont ; il ne le corrige pas ici.

```
scd-project-docs  →  scd-feature-specs  →  scd-implement
   (le socle)          (les documents)       (le code + la review)
```

## Le cycle, par lot

Un lancement = un lot `Rn`. Le préambule et le final sont **invariants** ; le **segment de vérification** (Red/Validate/Green ou Green/Verify) dépend du mode du lot. Douze agents dédiés :

| Phase | Agent | Rôle | Modèle | Mode |
|---|---|---|---|---|
| Branch | `branch-setup` | crée **toujours** `impl/<slug>-<lot>` depuis la base **à jour** (arbre propre exigé) | haiku | tous |
| Rebase | `rebaser` | **préventif, idempotent** : repose la branche sur la base à jour (no-op si fraîche) | haiku | tous |
| Prepare | `lot-briefer` | parse le lot **et son mode**, pull les SHALL, détecte le test runner | sonnet | tous |
| Red | `test-writer` | un test nommé par SHALL — **rouge** (TDD) ou **vert** (test-after) | sonnet | TDD, test-after |
| Validate | `test-validator` | 1 SHALL = 1 test, cas limites, conventions, anti-patterns | opus | TDD, test-after |
| Green | `implementer` | code jusqu'au **vert** (si tests) ou selon le **critère d'acceptation**, sans toucher aux tests | sonnet | tous |
| Verify | `verifier` | vérif **observable** en contexte frais ; preuve capturée ou `humanCheckRequired` | opus | check, inhérent |
| Review | `code-reviewer` | 6 dimensions, en contexte frais | opus | tous |
| Triage | `review-validator` | triage **sceptique adversarial** (apply/skip) | opus | tous |
| Apply | `fix-applier` | applique les findings retenus, **re-vérifie selon le mode** | sonnet | tous |
| Record | `progress-recorder` | coche `tasks.md`, commit sur la branche dédiée | haiku | tous |
| PR | `pr-author` | pousse la branche, ouvre la PR/MR **ready** avec description adaptée au mode | sonnet | tous |

## Les invariants

- **Le mode vient du contrat** — chaque lot déclare `_vérif :_` (défaut `TDD` si absent, rétro-compatible). Les agents l'**appliquent**, ne le réinventent pas ; un `check`/`inhérent` sur de la vraie logique métier est un finding amont.
- **TDD strict quand le mode l'exige** — en `TDD`, aucun code de production avant que les tests soient écrits, **validés**, et **rouges** (échec légitime). En `test-after`, le test est écrit après l'impl mais reste **dû** (au vert, validé).
- **Une SHALL = une vérification observable et nommée** — un test nommé (TDD/test-after), ou une **preuve observable capturée** (check/inhérent). Un SHALL sans vérification = filet troué.
- **Ne jamais toucher aux tests (dès qu'ils existent)** — garanti par un **check `git diff` déterministe** (vide), pas un hook : un hook statique ne sait ni la phase, ni si le lot a des tests. En check/inhérent, l'invariant est vacant.
- **La vérif se prouve** — `passing` (modes-test) exige `0 failed` dans la sortie réelle ; `verified` (check/inhérent) exige une preuve observable capturée. Jamais « looks done ». Le non-constatable (rendu visuel, effet externe) part en `humanCheckRequired`, jamais faussement attesté.
- **Producteur ≠ vérificateur** — ni `code-reviewer` (tous modes) ni `verifier` (check/inhérent) n'ont écrit le code ; le second regard en contexte frais tue le self-preferential bias.
- **Sceptique mais sobre** — le triage reproduit chaque finding avant de le retenir et **ne corrige que ce qui touche la correction ou une exigence**. Le sur-engineering est rejeté ; un lot vérifié avec zéro finding retenu est un résultat valide.

## Pourquoi un dynamic workflow

Le cycle est exactement le cas où « la sortie de l'étape N détermine l'étape N+1 » (route, boucle de correction des tests, retry jusqu'au vert, review → triage → apply). Le **plan sort de la tête de Claude et passe dans du code** : la boucle, les branchements et les résultats intermédiaires vivent dans le script, seul le résultat final revient au contexte. Chaque agent a un contexte isolé et un objectif borné — ce qui combat structurellement l'*agentic laziness* (s'arrêter avant la fin) et le *self-preferential bias* (préférer son propre travail).

> Un dynamic workflow consomme **substantiellement plus** de tokens qu'une session classique. Le périmètre « un lot par lancement » borne la dépense ; le routage opus/sonnet/haiku l'optimise. Piloter un premier run sur un petit lot (1-2 SHALL). Suivre dans `/workflows`.

## Commandes

| Commande | Rôle | Human/AI |
|---|---|---|
| `/scd-implement:run [NNN] [Rn]` | lance le workflow sur **un** lot (résout la cible, vérifie les préconditions) | 20/80 |
| `/scd-implement:run-parallel [NNN] <Rn> <Rn> …` | lance **plusieurs** lots en **parallèle réel** (worktrees isolés) ; sérialise ceux aux fichiers non disjoints en chaîne `--base` | 20/80 |
| `/scd-implement:sync [NNN] [Rn]` | **curatif** : re-rebase les PR de lot ouvertes dont la dépendance vient d'être mergée (« R1 mergé → rebase R2 ») | 20/80 |
| `/scd-implement:status [NNN]` | tableau de bord : lots faits / en cours / à faire, prochain lançable, **dérive de rebase** signalée | 10/90 |

L'état vit dans les cases de `tasks.md` — cochées par `progress-recorder`, relues par `status`. `/clear` efface le contexte, pas l'état.

## Un lot = une PR

Le run se conclut par une **PR ready-for-review, une par lot** — le prolongement direct de « un lot ≈ une PR reviewable » (`scd-feature-specs` dimensionne la slice ; `scd-implement` la livre).

- **Branche** : `impl/<slug>-<lot>`, créée **toujours et en toute première phase** par `branch-setup`, à partir de la base **mise à jour** (`git fetch`). Arbre de travail propre exigé (sinon le run s'arrête sans rien écrire).
- **Base** : résolue par `/scd-implement:run` et appliquée **à la branche dédiée et à la PR**. Défaut = branche par défaut du repo ; surchargeable via `--base <branche>` ; **auto-stacking** : un lot qui `dépend de : Rk` non encore mergé s'empile automatiquement sur `impl/<slug>-Rk` (base = cette branche pour le fork **et** la PR). Garde-fous déterministes : `pr-author` refuse une PR qui chevaucherait une PR ouverte de même base, et le workflow bloque si les commits dérivent hors de la branche du lot.
- **Rebase déterministe** : le rebase est une brique nommée (`rebaser`) — transplant exact des commits du lot via `git rebase --onto` (robuste au merge/squash de la dépendance), idempotent, jamais de résolution de conflit automatique, jamais de `--force` sec (`--force-with-lease` uniquement). **Préventif** dans le workflow (repose la branche avant d'écrire) ; **curatif** via `/scd-implement:sync` quand une dépendance est mergée (re-rebase la PR dépendante et retargete sa base). `/scd-implement:status` signale la dérive.
- **Plateforme** : auto-détection `gh` (GitHub) / `glab` (GitLab).
- **Description** (adaptée au mode) : FR/SHALL livrés → tests (TDD/test-after) ou preuve observable (check/inhérent), fichiers d'impl, findings appliqués/rejetés, preuve (`0 failed` ou `observableProof`), **checklist des points à vérifier par un humain** si le lot en a, traçabilité vers `specs/NNN-feature/`.

> Créer une PR est une **action sortante** depuis un run en arrière-plan. Pour éviter un prompt en cours de run, pré-allowlister `Bash(git push *)`, `Bash(gh pr *)`, `Bash(glab mr *)`. En `-p`/SDK sans CLI/auth, `pr-author` échoue proprement (`created: false`) et laisse la branche poussée.

## Parallélisme réel : isolation par worktree

Par défaut, un lancement traite **un lot** dans le checkout de session. `/scd-implement:run-parallel` en lance **plusieurs en même temps**, chacun isolé dans son propre **worktree git**. Il faut pour cela lever **deux obstacles distincts** :

- **Couche 1 — collision d'exécution.** Tous les subagents opèrent dans le cwd de session (un seul checkout, un seul HEAD). Deux runs concurrents se disputent l'arbre : le premier qui le salit bloque les autres en `blocked-dirty-tree`. **Le worktree résout ça** — `git worktree add` donne à chaque lot son checkout indépendant. L'arbre principal n'a même plus à être propre, et il reste **inchangé** pendant les runs.
- **Couche 2 — conflit de contenu.** Deux lots qui éditent le **même fichier** conflicteront au merge, worktree ou pas. L'isolation d'exécution n'y change rien : ces lots doivent être **sérialisés/empilés** (chaîne `--base`), jamais co-lancés. `run-parallel` **dérive la disjonction** des lignes `Fichiers :` (généralisation du marqueur `[P]`) : deux lots sont co-lançables **ssi** leurs fichiers sont disjoints **et** aucun ne dépend de l'autre non mergé.

Concrètement, `run-parallel` résout les lots, calcule les **chaînes** (lots indépendants → parallèles ; lots qui se recoupent → empilés), fetch **une fois**, puis lance l'orchestrateur `implement-parallel` : un fan-out de `implement-lot` (mode worktree) sur les chaînes indépendantes. **Chaque lot ouvre sa propre PR.** Nettoyage déterministe : worktree **supprimé** après succès, **conservé** (chemin rapporté) après échec pour inspection.

```
run-parallel 003 R2 R3 R4
   ├─ R2  (fichiers disjoints)        ── worktree ──▶ PR
   ├─ R3 ─▶ R4  (R4 partage un fichier avec R3)  ── empilés --base ──▶ PR, PR
   └─ …                                (chaînes lancées en parallèle)
```

> Le parallèle multiplie le coût d'un dynamic workflow par le nombre de lots concurrents. Réserve-le aux lots réellement indépendants et de taille maîtrisée.

## Couche déterministe (pas de hooks)

Ce plugin **ne livre aucun hook**. Ce qui doit arriver à 100 % **dépend de la phase et du mode** et est donc garanti *dans* le workflow :
- « branche dédiée depuis la base à jour, arbre propre » → première phase `branch-setup` (`git fetch` + `git switch -c` ; STOP si l'arbre n'est pas propre) ;
- « tests intacts » (dès qu'un test existe) → check `git diff` vide dans `implementer`/`fix-applier` ;
- « vérifié » → assertion sur `0 failed` (modes-test) ou sur un `observableProof` capturé (check/inhérent).

Un hook `PreToolUse` statique ne connaît ni la phase ni le mode (les fichiers de test ne sont connus qu'au runtime, et certains lots n'en ont pas). La discipline de vérification, quel que soit le mode, est portée par la **structure** du workflow, pas par une règle globale.

## Quick start

```
# Après une gate analyze au vert de scd-feature-specs :
/scd-implement:status                 # où en est l'implémentation ?
/scd-implement:run 003 R1             # implémente le lot R1 de la feature 003
# … suivre dans /workflows … puis :
/scd-implement:run 003 R2             # lot suivant

# plusieurs lots indépendants d'un coup (worktrees isolés, une PR par lot) :
/scd-implement:run-parallel 003 R2 R3 R4

# perdu ?
/scd-implement:status
```

## Installation

```
/plugin install scd-implement@sebc-dev-marketplace
```
