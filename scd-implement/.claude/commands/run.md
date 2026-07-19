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
  - Workflow
  - AskUserQuestion
---

<objective>
Implémenter **un seul lot de review `Rn`** d'une feature documentée par `scd-feature-specs`, via le dynamic workflow `implement-lot` (script JS orchestrant dix subagents dédiés en arrière-plan, à commencer par la création d'une branche dédiée depuis la base à jour).

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

## 4. Résoudre le lot cible

- **Argument `Rn` fourni** → c'est la cible.
- Sinon → prends le **premier lot `Rn` non entièrement coché** dans l'ordre des dépendances (`dépend de : Rn`), en respectant que ses dépendances soient cochées. Annonce-le.
- Si un lot dépend d'un lot non implémenté → signale-le et propose le lot débloquable, ou demande via `AskUserQuestion`.

## 5. Lancer le workflow

Le workflow **commence** par créer la branche dédiée et se **termine** par une **PR ready-for-review** (une par lot). Rappels avant lancement :
- **Branche d'abord** : la première phase (`branch-setup`) crée toujours `impl/<slug>-<lot>` depuis la base **à jour** (`git fetch`) — rien n'atterrit sur la base. C'est pourquoi l'arbre doit être propre (cf. préconditions).
- **Base** : si `--base <branche>` est fourni, passe-le (la branche dédiée **et** la PR partent de cette base) ; sinon le workflow détecte la branche par défaut du repo.
- **Action sortante** : `pr-author` fera `git push` + `gh pr create` / `glab mr create`. Pour éviter un prompt en cours de run, l'utilisateur peut pré-allowlister `Bash(git push *)`, `Bash(gh pr *)`, `Bash(glab mr *)`. Signale-le si ce n'est pas déjà le cas.

Lance `implement-lot` avec les arguments résolus :

```
Workflow(name: "implement-lot", args: { featureDir: "specs/NNN-feature", lot: "Rn", base: "<branche ou omis>" })
```

> Le workflow est bundlé dans ce plugin (`.claude/workflows/implement-lot.js`). Si l'invocation par `name` ne le résout pas, lance-le par chemin : `Workflow(scriptPath: "<plugin>/.claude/workflows/implement-lot.js", args: {...})`. C'est un **template** — adapte-le si la feature l'exige (ex. framework de test particulier), sans casser le contrat parser.

## 6. Rendre compte

Le workflow tourne en arrière-plan (`/workflows` pour suivre). À sa complétion, résume le `status` retourné :
- `done` → lot vert, findings appliqués/rejetés, cases cochées, **PR ouverte** (`pr.url`, ou `pr: null` si push/CLI indisponible — indique alors la branche poussée). Propose le lot suivant (`/scd-implement:run NNN Rn+1`) ou `/scd-implement:status NNN`.
- `blocked-dirty-tree` → l'arbre n'était pas propre au moment de brancher ; **rien n'a été écrit**. Demande de commiter/remiser puis relancer.
- `blocked-branch` → la branche dédiée n'a pas pu être posée (ex. problème git) ; rien n'a été écrit.
- `blocked-red` / `blocked-tests-modified` / `blocked-after-fix` → explique le blocage et la reprise possible (aucune PR n'est ouverte pour un lot bloqué ; la branche dédiée existe déjà).

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
