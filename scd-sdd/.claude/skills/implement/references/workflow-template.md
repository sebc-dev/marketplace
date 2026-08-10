# Référence — Le dynamic workflow `implement-lot.js`

<role>
Expliquer le script `.claude/workflows/implement-lot.js` : sa structure, ses schémas, ses boucles gardées, comment il cible les agents dédiés, comment l'adapter par run, et le fallback si `agentType` ne résout pas les agents du plugin. C'est un **template**, pas un script à rejouer verbatim.
</role>

<structure>
## Anatomie

Deux parties, dans l'ordre (contrat parser) :
1. `export const meta = { … }` — **littéral pur**, 1re instruction. `name`, `description`, `whenToUse`, `phases[]` (une entrée par `phase()`).
2. Corps async : les schémas de handoff (consts JSON Schema), puis l'orchestration.

## Les phases (segment de vérification variable selon le mode)

Préambule et final sont **invariants** ; le segment du milieu dépend de `brief.verifMode` (défaut `TDD`). Une phase non jouée (`Red`/`Validate` en check/inhérent, `Verify` en TDD/test-after) n'apparaît simplement pas dans ce run.

| Phase | `agentType` | Modèle | Schéma retour | Joué en mode |
|---|---|---|---|---|
| Branch | `scd-sdd:branch-setup` | haiku | `BRANCH` | tous |
| Rebase | `scd-sdd:rebaser` | haiku | `REBASE` | tous |
| Prepare | `scd-sdd:lot-briefer` | sonnet | `BRIEF` | tous |
| Red | `scd-sdd:test-writer` | sonnet | `TESTS` | TDD, test-after |
| Validate | `scd-sdd:test-validator` | opus | `TEST_VERDICT` | TDD, test-after |
| Green | `scd-sdd:implementer` | sonnet | `GREEN` | tous |
| Verify | `scd-sdd:verifier` | opus | `VERIFY` | check, inhérent |
| Review | `scd-sdd:code-reviewer` | opus | `FINDINGS` | tous |
| Triage | `scd-sdd:review-validator` | opus | `TRIAGE` | tous |
| Apply | `scd-sdd:fix-applier` | sonnet | `GREEN` | tous (re-vérifie selon le mode) |
| Record | `scd-sdd:progress-recorder` | haiku | `RECORD` | tous |
| Describe | `scd-sdd:pr-describer` | opus | `PR_BODY` | tous (sautable) |
| PR | `scd-sdd:pr-author` | sonnet | `PR_RESULT` | tous |

**Ordre du segment par mode** (voir `references/verification-modes.md`) :
- `TDD` → Red → Validate → Green.
- `test-after` → Green(impl-first) → Red(vert attendu) → Validate → Green(porte).
- `check`/`inhérent` → Green → Verify.

Le schéma **`VERIFY`** : `{ verified, mode, method, observableProof, humanCheckRequired[], note }`. Il porte la preuve observable des modes non-test (l'équivalent du `0 failed`) et la checklist `humanCheckRequired` remontée dans la PR.

Le schéma **`PR_BODY`** : `{ title, body, summary, diffStats: {files, insertions, deletions}, oversized, note }`. `body` est le corps Markdown **complet**, publié tel quel par `pr-author` (qui n'y prépend que le bloc « PR EMPILÉE »). `BRIEF.context` — rempli par `lot-briefer`, seul agent qui lit les trois documents — lui fournit le matériau fonctionnel (capability, `why`, `prdRefs`, `approach`, `adrs`, `outOfScope`, `nextLots`, `budgetEstimate`) ; il mesure lui-même le diff.

## Boucles gardées

- **Validate → test-writer** (modes-test) : ≤ 2 itérations, gardée par `budget.remaining() > 40_000`. Sort dès `verdict.ok`.
- **Green** : retry ≤ 3, gardée par le budget. Sort dès `passing && testsUntouched`.
- **Verify** (check/inhérent) : un seul appel — le `verifier` obtient la preuve ou déclare `verified:false` (blocage) / `humanCheckRequired` (déféré à l'humain).
- **Describe** : un seul appel, **sauté** si `budget.total && budget.remaining() <= 40_000`. Jamais bloquant : `desc === null` fait basculer `pr-author` sur son corps de repli, la PR s'ouvre quand même.

Chaque résultat d'agent est vérifié (`if (!x) …`) — l'équivalent de `filter(Boolean)` pour des appels uniques (un agent skipped/failed retourne `null`).

## Statuts de sortie

`done` (lot vérifié, cases cochées, PR ouverte) · `blocked-dirty-tree` (arbre de travail non propre au moment de brancher — phase Branch) · `blocked-branch` (la branche dédiée n'a pas pu être posée) · `blocked-rebase` (la phase Rebase préventive a échoué : `blocked-conflict`/`blocked-dirty`/`blocked-push`) · `blocked-impl` (l'impl-first de test-after/check/inhérent n'a pas passé l'intégration) · `blocked-red` (vert jamais atteint, modes-test) · `blocked-tests-modified` (l'impl a dû toucher les tests) · `blocked-verify` (check/inhérent : le `verifier` n'a pas obtenu de preuve et ce n'était pas déférable à l'humain) · `blocked-after-fix` (une correction a cassé la vérif) · `blocked-branch-drift` (post-Record : les commits ont atterri sur une branche ≠ celle de `branch-setup` — PR non ouverte). Les statuts `blocked-*` sont repris par `run` pour orienter l'humain ; le lot n'est ni coché ni transformé en PR. **`blocked-dirty-tree`/`blocked-branch`/`blocked-rebase` sortent tôt** — rien du code n'a été écrit, il suffit de nettoyer (arbre, conflit de rebase) et relancer ; un conflit de rebase n'est **jamais** résolu automatiquement. En `done`, le retour porte `mode`, `branch`, `base`, `humanCheckRequired[]`, `diffStats`/`oversized` (mesurés en phase Describe, `null`/`false` si elle a été sautée) et `pr: { url, number, state, stacked, base }` (ou `pr: null` si la publication n'a pas pu se faire — remote/CLI absent). `pr.stacked = true` + `state = draft` signale une PR empilée à **synchroniser avant merge** (`/scd-sdd:sync`).

## Branche, rebase & PR (phases Branch + Rebase + Record + Describe + PR)

**La branche est posée en toute première phase, toujours.** `branch-setup` exige un arbre propre (`git status --porcelain` vide, sinon STOP `blocked-dirty-tree`), fait `git fetch`, puis crée `impl/<slug>-<lot>` depuis la base **à jour** (`origin/<base>`, `base` = arg `args.base` sinon défaut du repo). `base` et `oldBase` sont **résolus en amont par `/scd-sdd:run`** (auto-stacking : un lot qui `dépend de : Rk` non mergé s'empile → `base = impl/<slug>-Rk` ; `oldBase = impl/<slug>-Rk` arme le rebase `--onto`). La phase **Rebase** (`rebaser`, préventive et idempotente) repose ensuite la branche sur la base à jour — no-op sur une branche fraîche, utile sur une reprise où la base a bougé ; conflit → `--abort` + `blocked-rebase`, jamais de résolution auto, `--force-with-lease` uniquement.

Le code du lot naît directement sur la branche dédiée ; `progress-recorder` ne fait que commiter dessus (il ne crée ni ne change de branche — l'orchestrateur bloque en `blocked-branch-drift` sinon). La phase **Describe** intercale ensuite `pr-describer` (opus, **lecture seule** : aucun push, aucune PR) : il compose la description destinée au reviewer humain — fonctionnel **et** code — et mesure lui-même le diff (`git merge-base` puis `git diff --numstat` sur `MB..HEAD`, jamais d'estimation). C'est aussi la seule phase qui touche au **miroir Linear**, et seulement si `docs/linear.md` existe : le describer y résout l'`identifier` de l'issue du lot par une **query** (jamais une mutation) et pose la magic word dans la section Traçabilité du corps — `Fixes` si la base est la branche par défaut, `Part of` si la PR est empilée. **Conditionnelle et best-effort** : fichier absent → un `Glob` et rien d'autre ; clé, réseau ou appariement en défaut → corps sans accroche + `note`, jamais un blocage et jamais une question (le workflow tourne en arrière-plan). Describe sauté par le budget → pas d'accroche non plus, le corps de repli de `pr-author` n'en porte pas : c'est assumé, le push `/scd-sdd:linear` suivant re-dérive l'état. `pr-author` détecte `gh`/`glab`, `git push -u` (jamais `--force`) et ouvre une PR/MR vers la base fournie (jamais de repli silencieux sur `main`), en refusant une PR qui chevaucherait une PR ouverte de même base. **Anti-orphelinage** : si la base ≠ branche par défaut (PR **empilée**), `pr-author` l'ouvre en **draft** avec les labels `stacked`/`needs-sync` et un bloc d'avertissement (`PR_RESULT.stacked = true`, `state = draft`) — un draft ne se merge pas sans passage ready, ce qui empêche le merge d'orpheliner le code dans une branche de lot cul-de-sac ; une PR non empilée reste **ready**. Le curatif « dépendance mergée après coup → rebase + retarget + **passage ready** + retrait de `needs-sync` » vit dans `/scd-sdd:sync` (réutilise `rebaser`) ; le rattrapage d'un orphelin déjà mergé (cherry-pick → nouvelle PR) vit dans `/scd-sdd:reland` (agent `relander`). Créer/pousser une PR est une action sortante : pré-allowlister `Bash(git push *)`, `Bash(gh pr *)`, `Bash(glab mr *)` évite un prompt en cours de run.

## Déterminisme (non négociable)

Aucun `Date.now()` / `Math.random()` / `new Date()` sans argument ; aucune I/O dans l'orchestrateur. Tout accès disque/git est **dans les prompts `agent()`** (les subagents ont les outils). Le runtime journalise chaque `agent()` par un hash de `(prompt, opts)` — le non-déterminisme casserait le resume.
</structure>

<worktree>
## Mode worktree (`args.worktree: true`)

Le workflow accepte un mode d'**isolation par worktree git**, pour permettre l'exécution parallèle réelle de plusieurs lots. C'est la réponse à la **couche 1** (collision d'exécution) — voir le SKILL pour les deux couches.

**Ce qui change dans `implement-lot.js` :**
1. **`branch-setup`** reçoit `worktree: true` et crée la branche **dans un worktree dédié** (`git worktree add -b impl/<slug>-<lot> "$wtdir" origin/<base>`), sous `"$(git rev-parse --path-format=absolute --git-common-dir)/scd-worktrees/<slug>-<lot>"` (hors de l'arbre suivi). Il **n'exige pas** un arbre principal propre. Il retourne `worktreeDir` (absolu) dans le schéma `BRANCH` (étendu : `worktree`, `worktreeDir`).
2. L'orchestrateur récupère `wtDir = branchInfo.worktreeDir` et construit deux fragments injectés dans **chaque** prompt aval :
   - `gitPrefix` = `git -C "<wtDir>"` (au lieu de `git`) — utilisé dans les checks déterministes du prompt (`${gitPrefix} diff -- <tests>`).
   - `iso` = une clause d'isolation ajoutée à la fin de chaque prompt : « opère exclusivement dans `<wtDir>` — git via `git -C`, chemins absolus, cwd de test = worktree ».
3. **`rebaser`** reçoit `worktreeDir` et opère avec `git -C` **sans** `git switch` (la branche est déjà checkoutée dans le worktree — un switch échouerait).
4. **`pr-describer`** mesure le diff via `git -C "<wtDir>"` (sans `-C`, `HEAD` serait la branche du checkout de session, donc un autre lot) et lit `featureDir/*` en chemins absolus sous le worktree. **`pr-author`** pousse via `git -C "<wtDir>" push`, crée la PR, puis — **en succès uniquement** — supprime le worktree (`git worktree remove --force` + `git worktree prune`, `worktreeRemoved: true`). En échec, il le **conserve**.
5. **Nettoyage & retours.** Tous les `return` bloqués (`blocked-red`, `blocked-after-fix`, `blocked-rebase`, `blocked-branch-drift`…) portent `worktreeDir` pour inspection humaine. Le `return` final `done` porte `worktree` et `worktreeDir` = `null` si le worktree a été supprimé après succès, sinon son chemin (cas `pr: null`).

**Invariant d'isolation prouvable** : pendant un run worktree, `git -C "<wtDir>" rev-parse --abbrev-ref HEAD` = `impl/<slug>-<lot>` **tandis que** le checkout principal reste sur sa branche d'origine (arbre et HEAD inchangés). En mode séquentiel (`worktree` absent/false), `gitPrefix` = `git`, `iso` = `""` → comportement 0.4.0 **strictement inchangé**.
</worktree>

<parallel>
## Orchestrateur parallèle `implement-parallel.js`

Un **second** workflow bundlé lance plusieurs lots en parallèle réel. Il ne fait **aucune I/O** (déterminisme) : le plan — quels lots, dans quelles chaînes, avec quelles bases — est calculé **en amont** par `/scd-sdd:run-parallel` (qui a les outils git) et passé dans `args`.

```
args = {
  featureDir, implPath,        // implPath = chemin absolu de implement-lot.js
  chains: [ { id, lots: [ { lot, base?, oldBase? } ] }, … ],
}
```

- **`parallel([...])` sur les chaînes** : chaque chaîne est un thunk ; les chaînes **indépendantes** (fichiers disjoints, pas de dépendance) tournent **concurremment**.
- **Au sein d'une chaîne** : boucle **séquentielle** — chaque lot via `workflow({ scriptPath: implPath }, { featureDir, lot, base, oldBase, worktree: true, prefetched: true })` (imbrication **d'un seul niveau** ; `implement-lot` n'appelle jamais `workflow()`). Les lots empilés (`base = impl/<slug>-<lot-précédent>`) se chaînent proprement. La chaîne **casse** au premier lot non `done` (les lots empilés en aval → `blocked-upstream`).
- **`prefetched: true`** : le remote est fetché **une seule fois** par la commande avant le fan-out ; `branch-setup` réutilise `origin/<base>` sans re-fetch (évite les fetch concurrents).
- **Retour** : `{ status: all-done|partial|all-blocked, lots: [ { lot, chain, status, branch, base, pr, worktreeDir } ] }`.

**Pourquoi la commande, pas le workflow, calcule le plan** : `parallel()` n'existe que dans un script de workflow, mais la lecture de `tasks.md` + l'état git (deps mergées ?) est de l'I/O — interdite dans l'orchestrateur. La commande fait l'analyse (co-parallélisabilité, bases), le workflow fait le fan-out déterministe.
</parallel>

<adaptation>
## Adapter le template

Le script est un **template**. Adapte-le à la feature quand c'est justifié, sans casser le contrat parser :
- **Commande de test particulière** : le `lot-briefer` la détecte et la met dans `brief.testCommand` ; les autres agents l'utilisent. Pas besoin de toucher au script en général.
- **Lot très large exceptionnel** : les seuils de découpage sont censés l'avoir évité en amont ; si un lot déborde, préfère demander un re-découpage `scd-sdd` plutôt que de complexifier le workflow.
- **Adversarial renforcé** : pour un lot sensible (sécurité), on peut spawner N sceptiques par finding bloquant (`parallel` de `review-validator`, majorité qui survit) — au prix du coût. Non activé par défaut.

Ne jamais : mettre du non-déterminisme, faire de l'I/O dans l'orchestrateur, passer des promesses nues à `parallel` (thunks `() => agent(...)` uniquement), oublier de garder une boucle.
</adaptation>

<run>
## Lancer

Depuis `/scd-sdd:run`, après résolution de la cible, on lance **par `scriptPath`** (jamais par `name`) :
```
Workflow(scriptPath: "<racine-plugin>/.claude/workflows/implement-lot.js", args: { featureDir: "specs/NNN-slug", lot: "Rn", base: "<branche ou omis>", oldBase: "<impl/<slug>-Rk ou omis>" })
```
**Pourquoi pas `name`** : un workflow bundlé dans un plugin n'est pas dans le registre des noms (seuls les workflows projet `.claude/workflows/` et built-in le sont) ; `Workflow(name: "implement-lot")` échoue avec « not found ». Et `${CLAUDE_PLUGIN_ROOT}` ne s'expande pas de façon fiable dans une commande markdown → `run` résout le chemin absolu par Bash (`find "$HOME/.claude/plugins" -path '*scd-sdd*/implement-lot.js' | sort -V | tail -1`) avant de lancer.

**Parallèle** : `/scd-sdd:run-parallel` résout **deux** chemins (`implement-parallel.js` **et** `implement-lot.js`), calcule le plan de chaînes, puis lance `Workflow(scriptPath: "<implement-parallel.js>", args: { featureDir, implPath: "<implement-lot.js>", chains: […] })`. L'orchestrateur relance `implement-lot` par `workflow({ scriptPath: implPath })` en interne (même raison : bundlé, donc par chemin).

Suivre dans `/workflows` (P pause, X stop). Le run est reprenable **dans la même session** (les agents terminés renvoient leurs résultats cachés). Quitter Claude Code repart de zéro.

## Fallback `agentType`

Le workflow cible les agents par `agentType: 'scd-sdd:<name>'`, résolus depuis le registre du plugin. **Si cette résolution échoue** (agents de plugin non vus depuis un workflow) : embarque le prompt de rôle **inline** dans chaque `agent()` (le script devient auto-suffisant), en gardant les `.md` d'agents comme source de vérité éditoriale. À confirmer au premier run ; documenter le résultat.

## Coût

Un dynamic workflow consomme « substantiellement plus » de tokens. Le périmètre « un lot par lancement » borne la dépense ; le routage opus/sonnet/haiku l'optimise. Piloter un premier run sur un petit lot (1-2 SHALL) avant de généraliser.
</run>
