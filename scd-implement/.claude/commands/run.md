---
name: run
description: "Lance le dynamic workflow d'implémentation TDD sur UN lot Rn d'une feature (rouge→vert→review→triage→apply→PR). Résout la feature et le lot depuis le disque, vérifie que la gate analyze est au vert, puis exécute le workflow implement-lot en arrière-plan, qui se termine par une PR ready-for-review."
argument-hint: "[NNN|slug] [Rn] [--base <branche>]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(git status *)
  - Bash(git rev-parse *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git ls-remote *)
  - Bash(find *)
  - Workflow
  - AskUserQuestion
---

<objective>
Implémenter **un seul lot de review `Rn`** d'une feature documentée par `scd-feature-specs`, via le dynamic workflow `implement-lot` (script JS orchestrant onze subagents dédiés en arrière-plan, à commencer par la création d'une branche dédiée depuis la base à jour puis un rebase préventif).

Tu ne lis ni n'écris le code toi-même : tu **résous la cible**, tu **vérifies les préconditions**, puis tu **lances le workflow**. Tout le travail sur le code se fait dans les subagents du workflow.
</objective>

<process>

## 1. Charger la connaissance transverse

Charge le skill `implement` (`references/tasks-parsing.md` pour la résolution de la cible, `references/green-gate.md` pour la discipline rouge/vert). Communique en français.

## 2. Résoudre la feature cible

Applique la règle de résolution (identique à `scd-feature-specs`) :

1. **Argument `NNN`/slug fourni** → match sur le préfixe `NNN` **ou** le slug dans `specs/`.
2. Sinon, **une seule** feature a un `tasks.md` avec des lots non entièrement cochés → la prendre et l'**annoncer**.
3. Sinon (0 ou ≥ 2 candidates) → **ne devine pas** : liste les candidates via `AskUserQuestion` (ou renvoie vers `/scd-implement:status`).

## 3. Vérifier les préconditions (STOP si non remplies)

- `specs/NNN-feature/tasks.md` existe. Sinon → « Pas de `tasks.md`. Termine d'abord le cycle `scd-feature-specs` (jusqu'à `analyze`). » et STOP.
- **Gate `analyze` au vert.** Ce plugin implémente un contrat *validé*. Tu ne persistes aucun verdict `analyze` (il n'en existe pas sur disque), donc **rappelle** à l'utilisateur de l'avoir passée : si `spec.md` contient encore `[NEEDS CLARIFICATION]`, ou si `plan.md`/`tasks.md` manquent → STOP et renvoie vers la phase manquante. En cas de doute, propose de lancer `/scd-feature-specs:analyze NNN` d'abord.
- **Arbre de travail git propre EXIGÉ.** La première phase du workflow (`branch-setup`) crée toujours la branche dédiée `impl/<slug>-<lot>` à partir de la base **à jour** (`git fetch`) — ce qui suppose un arbre propre. Exécute `git status --porcelain` : **s'il n'est pas vide → STOP** et demande à l'utilisateur de commiter ou remiser (`git stash`) ses changements avant de relancer. (Si tu lances quand même, le workflow s'arrêtera de lui-même en `blocked-dirty-tree` sans rien écrire.)

## 4. Résoudre le lot cible **et sa base**

**Lot** :
- **Argument `Rn` fourni** → c'est la cible.
- Sinon → prends le **premier lot `Rn` non entièrement coché** dans l'ordre des dépendances (`dépend de : Rn`), en respectant que ses dépendances soient cochées. Annonce-le.
- Si un lot dépend d'un lot non implémenté → signale-le et propose le lot débloquable, ou demande via `AskUserQuestion`.

**Base — auto-stacking des lots dépendants (déterministe).** Décide **ici** la base à passer au workflow, pour qu'un lot qui `dépend de :` un autre non encore mergé s'empile correctement au lieu de rejouer son diff. `slug` = suffixe de `featureDir` après `NNN-` ; détecte la base par défaut du repo (`git symbolic-ref refs/remotes/origin/HEAD` → `main`, fallback `main`/`master`).

- **`--base <branche>` fourni** → l'override explicite **gagne toujours**. Passe-le tel quel au workflow, saute la détection ci-dessous.
- Sinon, lis la ligne `dépend de : …` du lot cible dans `tasks.md`. Pour chaque dépendance `Rk` listée, calcule `impl/<slug>-Rk` et teste **deux** conditions :
  1. **Existe** — localement `git rev-parse --verify --quiet refs/heads/impl/<slug>-Rk`, ou sur le remote `git ls-remote --heads origin impl/<slug>-Rk` (sortie non vide).
  2. **Non mergée** dans la base par défaut — `git merge-base --is-ancestor <ref-de-Rk> <base-défaut>` retourne un code **≠ 0** (si `origin/impl/<slug>-Rk` existe, teste-le en priorité ; sinon la ref locale).
- **Exactement une** dépendance satisfait *existe ∧ non-mergée* → **auto-stacking** : `base = impl/<slug>-Rk`. Annonce-le explicitement : « `Rn` empilé sur `Rk` : base = `impl/<slug>-Rk` (non encore mergé) ; la branche du lot ET la PR partiront de cette base. »
- **Aucune** (toutes les deps sont mergées dans la base, ou pas encore branchées) → **n'impose pas de base** : omets `base`, le workflow branche depuis la base par défaut à jour (comportement inchangé des lots indépendants).
- **Deux ou plus** dépendances *existantes ∧ non-mergées* → **ne devine pas** une base unique : demande via `AskUserQuestion` sur laquelle empiler (ou d'attendre les merges), ou exige un `--base` explicite. **Ne stacke jamais silencieusement** sur l'une d'elles.

**`oldBase` (arme le rebase préventif `--onto`).** Indépendamment de l'état de merge, si le lot cible `dépend de : Rk` et que la branche `impl/<slug>-Rk` **existe** (locale ou remote), passe aussi `oldBase = impl/<slug>-Rk` au workflow. Sur un run **frais**, la phase `Rebase` est un no-op idempotent ; sur une **reprise** où la base a bougé (ex. `Rk` mergé entre-temps), `oldBase` permet à `rebaser` de transplanter les seuls commits du lot (`--onto`, robuste au squash). Pas de dépendance, ou branche `Rk` absente → n'envoie pas `oldBase`.

## 5. Lancer le workflow

Le workflow **commence** par créer la branche dédiée et se **termine** par une **PR ready-for-review** (une par lot). Rappels avant lancement :
- **Branche d'abord** : la première phase (`branch-setup`) crée toujours `impl/<slug>-<lot>` depuis la base **à jour** (`git fetch`) — rien n'atterrit sur la base. C'est pourquoi l'arbre doit être propre (cf. préconditions). La phase suivante (`Rebase`, préventive) repose la branche sur la base à jour de façon idempotente (no-op sur une branche fraîche).
- **Base / oldBase** : passe la base **résolue à l'étape 4** — soit `--base` explicite, soit la branche du lot dont dépend la cible (`impl/<slug>-Rk`) si elle est non mergée (auto-stacking), soit rien (le workflow prend alors la branche par défaut à jour). La base retenue s'applique **à la fois** à la branche dédiée et à la PR. Passe aussi `oldBase` = `impl/<slug>-Rk` si la branche de la dépendance existe (arme le rebase préventif `--onto`).
- **Action sortante** : `pr-author` fera `git push` + `gh pr create` / `glab mr create`. Pour éviter un prompt en cours de run, l'utilisateur peut pré-allowlister `Bash(git push *)`, `Bash(gh pr *)`, `Bash(glab mr *)`. Signale-le si ce n'est pas déjà le cas.

Le workflow se lance **par son chemin de fichier** (`scriptPath`), **jamais par `name`** : un workflow **bundlé dans un plugin** n'est **pas** enregistré dans le registre des noms — seuls les workflows projet (`.claude/workflows/`) et built-in (`deep-research`, `code-review`) le sont. `Workflow(name: "implement-lot", …)` échoue donc avec « Workflow not found. Available: deep-research, code-review ».

**a. Résoudre le chemin absolu du script.** Le fichier vit à `<racine-plugin>/.claude/workflows/implement-lot.js`. La variable `${CLAUDE_PLUGIN_ROOT}` **ne s'expande pas de façon fiable dans un fichier de commande markdown** (bug Claude Code connu) — ne la passe donc pas telle quelle à `scriptPath`. Résous le chemin par Bash, en ciblant la version active dans le cache des plugins :

```bash
find "$HOME/.claude/plugins/cache" -path '*scd-implement*/implement-lot.js' 2>/dev/null | sort -V | tail -1
```

Prends la ligne retournée comme chemin absolu (la version installée la plus haute). Si rien n'est trouvé (installation non standard, plugin lié en dev), élargis : `find "$HOME/.claude/plugins" -path '*scd-implement*/implement-lot.js' 2>/dev/null | sort -V | tail -1`, puis en dernier recours demande le chemin à l'utilisateur.

**b. Lancer** avec ce chemin et les arguments résolus :

```
Workflow(scriptPath: "<chemin absolu résolu en a>", args: { featureDir: "specs/NNN-feature", lot: "Rn", base: "<branche ou omis>", oldBase: "<impl/<slug>-Rk ou omis>" })
```

> C'est un **template** — adapte-le si la feature l'exige (ex. framework de test particulier), sans casser le contrat parser.

## 6. Rendre compte

Le workflow tourne en arrière-plan (`/workflows` pour suivre). À sa complétion, résume le `status` retourné :
- `done` → lot vert, findings appliqués/rejetés, cases cochées, **PR ouverte** (`pr.url`, ou `pr: null` si push/CLI indisponible — indique alors la branche poussée). Propose le lot suivant (`/scd-implement:run NNN Rn+1`) ou `/scd-implement:status NNN`.
- `blocked-dirty-tree` → l'arbre n'était pas propre au moment de brancher ; **rien n'a été écrit**. Demande de commiter/remiser puis relancer.
- `blocked-branch` → la branche dédiée n'a pas pu être posée (ex. problème git) ; rien n'a été écrit.
- `blocked-rebase` → la phase préventive de rebase a échoué (`blocked-conflict` = conflit avorté à résoudre à la main ; `blocked-dirty` ; `blocked-push` = `--force-with-lease` rejeté, refetch puis relance). Aucun code écrit ; rien n'est forcé.
- `blocked-red` / `blocked-tests-modified` / `blocked-after-fix` → explique le blocage et la reprise possible (aucune PR n'est ouverte pour un lot bloqué ; la branche dédiée existe déjà).
- `blocked-branch-drift` → `progress-recorder` a commité sur une branche ≠ celle posée par `branch-setup` (filet déterministe) : **aucune PR ouverte**. Signale `expectedBranch`/`recordedBranch` ; c'est un bug d'agent à investiguer avant de relancer.

</process>

<guidelines>
- **Un lancement = un lot.** Ne boucle pas sur plusieurs lots dans une même invocation.
- La conversation principale ne lit pas les diffs ni n'écrit de code — c'est le rôle des subagents du workflow.
- Coût : un dynamic workflow consomme substantiellement plus de tokens qu'une session classique ; le périmètre « un lot » le borne. Suivre `/workflows`.
- Tu ne modifies jamais `spec.md`/`plan.md` : le contrat est en amont. Si l'implémentation révèle un défaut du contrat, signale-le pour un retour `scd-feature-specs` (nouveau critère, FR, ou premortem), ne le corrige pas ici.
</guidelines>

<skill>
- `implement` — charge `references/tasks-parsing.md` et `references/green-gate.md`.
</skill>
