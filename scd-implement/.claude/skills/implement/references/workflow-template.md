# Référence — Le dynamic workflow `implement-lot.js`

<role>
Expliquer le script `.claude/workflows/implement-lot.js` : sa structure, ses schémas, ses boucles gardées, comment il cible les agents dédiés, comment l'adapter par run, et le fallback si `agentType` ne résout pas les agents du plugin. C'est un **template**, pas un script à rejouer verbatim.
</role>

<structure>
## Anatomie

Deux parties, dans l'ordre (contrat parser) :
1. `export const meta = { … }` — **littéral pur**, 1re instruction. `name`, `description`, `whenToUse`, `phases[]` (une entrée par `phase()`).
2. Corps async : les schémas de handoff (consts JSON Schema), puis l'orchestration.

## Les dix phases

| Phase | `agentType` | Modèle | Schéma retour |
|---|---|---|---|
| Branch | `scd-implement:branch-setup` | haiku | `BRANCH` |
| Prepare | `scd-implement:lot-briefer` | sonnet | `BRIEF` |
| Red | `scd-implement:test-writer` | sonnet | `TESTS` |
| Validate | `scd-implement:test-validator` | opus | `TEST_VERDICT` |
| Green | `scd-implement:implementer` | sonnet | `GREEN` |
| Review | `scd-implement:code-reviewer` | opus | `FINDINGS` |
| Triage | `scd-implement:review-validator` | opus | `TRIAGE` |
| Apply | `scd-implement:fix-applier` | sonnet | `GREEN` |
| Record | `scd-implement:progress-recorder` | haiku | `RECORD` |
| PR | `scd-implement:pr-author` | sonnet | `PR_RESULT` |

## Boucles gardées

- **Validate → test-writer** : ≤ 2 itérations, gardée par `budget.remaining() > 40_000`. Sort dès `verdict.ok`.
- **Green** : retry ≤ 3, gardée par le budget. Sort dès `passing && testsUntouched`.

Chaque résultat d'agent est vérifié (`if (!x) …`) — l'équivalent de `filter(Boolean)` pour des appels uniques (un agent skipped/failed retourne `null`).

## Statuts de sortie

`done` (lot vert, cases cochées, PR ouverte) · `blocked-dirty-tree` (arbre de travail non propre au moment de brancher — phase Branch) · `blocked-branch` (la branche dédiée n'a pas pu être posée) · `blocked-red` (vert jamais atteint) · `blocked-tests-modified` (l'impl a dû toucher les tests) · `blocked-after-fix` (une correction a cassé le vert). Les statuts `blocked-*` sont repris par `run` pour orienter l'humain ; le lot n'est ni coché ni transformé en PR. **`blocked-dirty-tree`/`blocked-branch` sortent dès la première phase** — rien n'a été écrit, il suffit de nettoyer l'arbre et relancer. En `done`, le retour porte `branch`, `base` et `pr: { url, number, state }` (ou `pr: null` si la publication n'a pas pu se faire — remote/CLI absent).

## Branche & PR (phases Branch + Record + PR)

**La branche est posée en toute première phase, toujours.** `branch-setup` exige un arbre propre (`git status --porcelain` vide, sinon STOP `blocked-dirty-tree`), fait `git fetch`, puis crée `impl/<slug>-<lot>` depuis la base **à jour** (`origin/<base>`, `base` = arg `args.base` sinon défaut du repo). Aucune exception : on repart de la base à jour même si on était sur une branche de travail (le stacking automatique disparaît — un lot dépendant suppose sa dépendance mergée dans la base, ou `--base` pointant sur elle). Le code du lot naît donc directement sur la branche dédiée ; `progress-recorder` ne fait plus que commiter dessus (il ne crée ni ne change de branche). `pr-author` détecte `gh`/`glab`, `git push -u` (jamais `--force`) et ouvre une PR/MR **ready** vers la même base. Créer une PR est une action sortante : pré-allowlister `Bash(git push *)`, `Bash(gh pr *)`, `Bash(glab mr *)` évite un prompt en cours de run.

## Déterminisme (non négociable)

Aucun `Date.now()` / `Math.random()` / `new Date()` sans argument ; aucune I/O dans l'orchestrateur. Tout accès disque/git est **dans les prompts `agent()`** (les subagents ont les outils). Le runtime journalise chaque `agent()` par un hash de `(prompt, opts)` — le non-déterminisme casserait le resume.
</structure>

<adaptation>
## Adapter le template

Le script est un **template**. Adapte-le à la feature quand c'est justifié, sans casser le contrat parser :
- **Commande de test particulière** : le `lot-briefer` la détecte et la met dans `brief.testCommand` ; les autres agents l'utilisent. Pas besoin de toucher au script en général.
- **Lot très large exceptionnel** : les seuils de découpage sont censés l'avoir évité en amont ; si un lot déborde, préfère demander un re-découpage `scd-feature-specs` plutôt que de complexifier le workflow.
- **Adversarial renforcé** : pour un lot sensible (sécurité), on peut spawner N sceptiques par finding bloquant (`parallel` de `review-validator`, majorité qui survit) — au prix du coût. Non activé par défaut.

Ne jamais : mettre du non-déterminisme, faire de l'I/O dans l'orchestrateur, passer des promesses nues à `parallel` (thunks `() => agent(...)` uniquement), oublier de garder une boucle.
</adaptation>

<run>
## Lancer

Depuis `/scd-implement:run`, après résolution de la cible :
```
Workflow(name: "implement-lot", args: { featureDir: "specs/NNN-slug", lot: "Rn" })
```
Suivre dans `/workflows` (P pause, X stop). Le run est reprenable **dans la même session** (les agents terminés renvoient leurs résultats cachés). Quitter Claude Code repart de zéro.

## Fallback `agentType`

Le workflow cible les agents par `agentType: 'scd-implement:<name>'`, résolus depuis le registre du plugin. **Si cette résolution échoue** (agents de plugin non vus depuis un workflow) : embarque le prompt de rôle **inline** dans chaque `agent()` (le script devient auto-suffisant), en gardant les `.md` d'agents comme source de vérité éditoriale. À confirmer au premier run ; documenter le résultat.

## Coût

Un dynamic workflow consomme « substantiellement plus » de tokens. Le périmètre « un lot par lancement » borne la dépense ; le routage opus/sonnet/haiku l'optimise. Piloter un premier run sur un petit lot (1-2 SHALL) avant de généraliser.
</run>
