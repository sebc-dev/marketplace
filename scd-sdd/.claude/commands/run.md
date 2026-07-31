---
description: "Implémentation d'UN lot Rn : lance le dynamic workflow implement-lot selon le mode de vérif du lot (_vérif :_ — TDD rouge→vert, test-after, check ou inhérent) → review → triage → apply → describe → PR ready-for-review. Résout la feature, le lot et sa base depuis le disque, exige un arbre propre, puis exécute le workflow en arrière-plan. Consigne l'issue du lot au journal, succès comme blocage."
argument-hint: "[NNN|slug] [Rn] [--base <branche>]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Bash(git status *)
  - Bash(git rev-parse *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git ls-remote *)
  - Bash(find *)
  - Workflow
  - AskUserQuestion
---

## Contexte

Tu implémentes **un seul lot de review `Rn`** d'une feature dont le contrat est validé, via le
dynamic workflow `implement-lot` — un script JS qui orchestre des subagents dédiés en arrière-plan,
en commençant par créer une branche dédiée depuis la base à jour, et dont le segment central
s'adapte au mode de vérification déclaré par le lot.

Tu ne lis ni n'écris le code toi-même. Tu fais quatre choses : **résoudre la cible**, **vérifier
les préconditions**, **lancer le workflow**, **consigner l'issue au journal**. Tout le travail sur
le code se fait dans les subagents du workflow.

Ratio : 20% humain / 80% AI (l'humain valide la cible et la base ; le workflow fait le reste).

## Règles absolues

- **Un lancement = un lot.** Ne boucle jamais sur plusieurs lots dans une même invocation. Pour
  plusieurs lots, c'est `/scd-sdd:run-parallel`.
- **Arbre de travail propre EXIGÉ.** La première phase du workflow crée la branche dédiée depuis
  la base à jour, ce qui suppose un arbre propre. Pas d'exception.
- **Tu ne devines jamais la base.** Elle se résout de façon déterministe (étape 4) ou elle se
  demande. Un stacking silencieux sur la mauvaise dépendance produit un diff qui rejoue un autre
  lot.
- **Tu ne modifies jamais `spec.md` / `plan.md` / `tasks.md`.** Le contrat est en amont. Si
  l'implémentation révèle un défaut du contrat, signale-le pour un retour au niveau specs
  (nouveau critère, FR, ou passe `premortem`) — ne le corrige pas ici.
- **La conversation principale ne lit pas les diffs et n'écrit pas de code.**

## Processus

1. **Résous la feature cible** selon la section « Cibler une feature » du skill `feature-specs` —
   source de vérité unique, référencée et jamais recopiée. Filtre propre à ce niveau : parmi les
   candidates, celles dont le `tasks.md` porte des lots non entièrement cochés. Charge aussi le
   skill `implement` (`references/tasks-parsing.md` pour le parsing du lot et son `_vérif :_`,
   `references/verification-modes.md` pour la discipline par mode). Communique en français.

2. **Vérifie les préconditions — STOP si l'une manque :**
   - `specs/NNN-feature/tasks.md` existe. Sinon → « Pas de `tasks.md`. Termine d'abord le cycle
     des specs (jusqu'à `analyze`). » et STOP.
   - **Gate `analyze` au vert.** Ce niveau implémente un contrat *validé*. Si `spec.md` contient
     encore `[NEEDS CLARIFICATION]`, ou si `plan.md`/`tasks.md` manquent → STOP et renvoie vers la
     phase manquante. Le journal porte le verdict de la dernière gate (section `## NNN-slug`, ligne
     `analyze`) : s'il est absent, ou plus ancien que la dernière modification des trois documents,
     **signale-le** et propose `/scd-sdd:analyze NNN` d'abord. Tu ne le persistes nulle part et tu
     ne le rejoues pas toi-même.
   - **Arbre propre.** Exécute `git status --porcelain` : **s'il n'est pas vide → STOP** et demande
     de commiter ou remiser (`git stash`) avant de relancer. (Si tu lances quand même, le workflow
     s'arrête de lui-même en `blocked-dirty-tree` sans rien écrire.)

3. **Résous le lot cible.**
   - Argument `Rn` fourni → c'est la cible.
   - Sinon → le **premier lot `Rn` non entièrement coché** dans l'ordre des dépendances
     (`dépend de : Rn`), **dont les dépendances sont cochées**. Annonce-le.
   - Un lot dépendant d'un lot non implémenté → signale-le et propose le lot débloquable, ou
     demande via `AskUserQuestion`.

4. **Résous la base — déterministe, jamais devinée.** Décide **ici** la base à passer au workflow,
   pour qu'un lot qui `dépend de :` un autre non encore mergé s'**empile** au lieu de rejouer son
   diff. `slug` = suffixe de `featureDir` après `NNN-` ; base par défaut du repo via
   `git symbolic-ref refs/remotes/origin/HEAD` (repli `main`/`master`).

   - **`--base <branche>` fourni** → l'override explicite **gagne toujours**. Passe-le tel quel,
     saute la détection.
   - Sinon, lis la ligne `dépend de : …` du lot. Pour chaque dépendance `Rk`, calcule
     `impl/<slug>-Rk` et teste **deux** conditions :
     1. **Existe** — `git rev-parse --verify --quiet refs/heads/impl/<slug>-Rk`, ou
        `git ls-remote --heads origin impl/<slug>-Rk` (sortie non vide).
     2. **Non mergée** dans la base par défaut — `git merge-base --is-ancestor <ref-de-Rk>
        <base-défaut>` retourne un code **≠ 0** (teste `origin/impl/<slug>-Rk` en priorité s'il
        existe, sinon la ref locale).
   - **Exactement une** dépendance *existante ∧ non mergée* → **auto-stacking** :
     `base = impl/<slug>-Rk`. Annonce-le : « `Rn` empilé sur `Rk` : base = `impl/<slug>-Rk` (non
     encore mergé) ; la branche du lot **ET** la PR partiront de cette base. »
   - **Aucune** (toutes mergées, ou pas encore branchées) → **n'impose pas de base** : omets
     `base`, le workflow branche depuis la base par défaut à jour.
   - **Deux ou plus** *existantes ∧ non mergées* → **ne devine pas** : demande via
     `AskUserQuestion` sur laquelle empiler (ou d'attendre les merges), ou exige un `--base`
     explicite. **Ne stacke jamais silencieusement** sur l'une d'elles.

   **`oldBase` (arme le rebase préventif `--onto`).** Indépendamment de l'état de merge, si le lot
   `dépend de : Rk` et que `impl/<slug>-Rk` **existe** (locale ou remote), passe aussi
   `oldBase = impl/<slug>-Rk`. Sur un run frais, la phase `Rebase` est un no-op idempotent ; sur une
   **reprise** où la base a bougé (`Rk` mergé entre-temps), `oldBase` permet à `rebaser` de
   transplanter les seuls commits du lot (`--onto`, robuste au squash). Pas de dépendance, ou
   branche absente → n'envoie pas `oldBase`.

5. **Lance le workflow.** Rappels avant lancement :
   - **Branche d'abord** : `branch-setup` crée toujours `impl/<slug>-<lot>` depuis la base à jour
     (`git fetch`) — rien n'atterrit sur la base. La phase suivante (`Rebase`, préventive) repose la
     branche de façon idempotente (no-op sur une branche fraîche).
   - **Base / oldBase** : passe la base résolue à l'étape 4. Elle s'applique **à la fois** à la
     branche dédiée et à la PR.
   - **Action sortante** : `pr-author` fera `git push` + `gh pr create` / `glab mr create`. Pour
     éviter un prompt en cours de run, l'utilisateur peut pré-allowlister `Bash(git push *)`,
     `Bash(gh pr *)`, `Bash(glab mr *)`. Signale-le si ce n'est pas déjà le cas.
   - **Description de la PR** : l'avant-dernière phase (`Describe`, `pr-describer`, lecture seule)
     compose la description destinée au reviewer humain — fonctionnel **et** code, findings
     appliqués **et rejetés**. `pr-author` ne fait que la publier. Elle est **sautée** si le budget
     restant est trop faible : la PR s'ouvre alors avec un corps de repli minimal, jamais sans
     description.

   Le workflow se lance **par son chemin de fichier** (`scriptPath`), **jamais par `name`** : un
   workflow **bundlé dans un plugin** n'est **pas** enregistré au registre des noms — seuls les
   workflows projet (`.claude/workflows/`) et built-in le sont. `Workflow(name: "implement-lot", …)`
   échoue avec « Workflow not found ».

   **a. Résous le chemin absolu du script.** `${CLAUDE_PLUGIN_ROOT}` ne s'expande pas de façon
   fiable dans un fichier de commande markdown — ne le passe pas à `scriptPath`. Résous par Bash :

   ```bash
   find "$HOME/.claude/plugins/cache" -path '*scd-sdd*/implement-lot.js' 2>/dev/null | sort -V | tail -1
   ```

   Prends la ligne retournée (la version installée la plus haute). Si rien n'est trouvé, élargis à
   `find "$HOME/.claude/plugins" -path '*scd-sdd*/implement-lot.js' 2>/dev/null | sort -V | tail -1`,
   puis en dernier recours demande le chemin à l'utilisateur.

   **b. Lance** avec ce chemin et les arguments résolus :

   ```
   Workflow(scriptPath: "<chemin absolu résolu en a>", args: { featureDir: "specs/NNN-feature", lot: "Rn", base: "<branche ou omis>", oldBase: "<impl/<slug>-Rk ou omis>" })
   ```

   > C'est un **template** — adapte-le si la feature l'exige (framework de test particulier), sans
   > casser le contrat parser.

6. **Rends compte.** Le workflow tourne en arrière-plan (`/workflows` pour suivre). À sa
   complétion, résume le `status` retourné :
   - **`done`** → lot vérifié (mode indiqué dans le retour), findings appliqués/rejetés, cases
     cochées, **PR ouverte** (`pr.url`, ou `pr: null` si push/CLI indisponible — indique alors la
     branche poussée).
     - Si **`pr.stacked`** : la PR est ouverte en **draft** (labels `stacked`/`needs-sync`, bloc
       d'avertissement). Rappelle qu'elle **ne doit pas être mergée directement** : merger d'abord
       la dépendance, puis `/scd-sdd:sync NNN Rn`.
     - Si **`humanCheckRequired`** non vide (modes check/inhérent) : la PR porte une checklist de
       points qu'un humain doit constater (rendu visuel, effet externe).
     - Si **`oversized`** : le diff réel (`diffStats`) dépasse le seuil de review en une passe — la
       PR le dit, mais l'humain doit savoir qu'elle demandera deux passes.
   - **`blocked-dirty-tree`** → l'arbre n'était pas propre au moment de brancher ; **rien n'a été
     écrit**. Commiter/remiser puis relancer.
   - **`blocked-branch`** → la branche dédiée n'a pas pu être posée (problème git) ; rien n'a été
     écrit.
   - **`blocked-rebase`** → la phase préventive a échoué : `blocked-conflict` (conflit avorté, à
     résoudre à la main), `blocked-dirty`, `blocked-push` (`--force-with-lease` rejeté → refetch
     puis relance). Aucun code écrit ; rien n'est forcé.
   - **`blocked-impl`** (test-after/check/inhérent) → l'impl-first n'a pas passé l'intégration
     (build/lint) ; explique et propose la reprise.
   - **`blocked-red`** / **`blocked-tests-modified`** (modes-test) · **`blocked-verify`**
     (check/inhérent : le `verifier` n'a pas obtenu de preuve) · **`blocked-after-fix`** → explique
     le blocage et la reprise. **Aucune PR n'est ouverte pour un lot bloqué** ; la branche dédiée
     existe déjà.
   - **`blocked-branch-drift`** → `progress-recorder` a commité sur une branche ≠ celle posée par
     `branch-setup` (filet déterministe) : **aucune PR ouverte**. Signale
     `expectedBranch`/`recordedBranch` ; c'est un bug d'agent à investiguer avant de relancer.

7. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu ne lis pas les diffs, tu n'écris pas de code, tu ne juges pas la qualité de l'implémentation.
- Tu ne boucles pas sur plusieurs lots, tu ne relances pas automatiquement un lot bloqué.
- Tu ne modifies ni le contrat (`spec.md`/`plan.md`), ni `tasks.md` (c'est `progress-recorder`).
- Tu ne rebases pas et tu ne relandes pas à la main : c'est `/scd-sdd:sync` et `/scd-sdd:reland`.
- Tu ne rejoues pas `analyze` pour « vérifier » la gate — tu la rappelles et tu renvoies.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans la section `## NNN-slug` de
`docs/JOURNAL.md`, par `Edit` ciblé, à partir de l'objet de retour du workflow.

- **Phase** : `run Rn` — le lot est dans la cellule, pas dans le résultat.
- **Résultat**, succès : `✅ done · <mode> · N tests · PR #n`. Ajoute `(empilée sur Rk)` si
  `pr.stacked`, et `· humanCheck N` si `humanCheckRequired` n'est pas vide.
- **Résultat**, blocage : `⛔ <statut> · branche impl/<slug>-Rn` — le statut tel que retourné
  (`blocked-red`, `blocked-dirty-tree`, …).

**Un échec se consigne aussi, et c'est le cœur de la règle.** Un run bloqué ne coche aucune case
et n'ouvre aucune PR : sans cette ligne, il est indiscernable d'un lot jamais lancé. C'est le seul
fait de ce niveau que rien ne permet de dériver.

**C'est toi qui écris, pas le workflow.** L'orchestrateur n'a par contrat aucune I/O, et
`progress-recorder` ne tourne que sur le chemin de succès — lui confier le journal perdrait tous
les `blocked-*`. Un lot relancé après échec produit **deux** lignes : l'échec fait partie de
l'histoire, on ne réécrit jamais une ligne passée.

## Skill active

- `feature-specs` — section « Cibler une feature » pour la résolution de la cible.
- `implement` — charge `references/tasks-parsing.md` et `references/verification-modes.md`.
- `journal` — contrat de `docs/JOURNAL.md`.

## À la fin

Sur un `done` : propose le lot suivant (`/scd-sdd:run NNN Rn+1`), ou `/scd-sdd:status-impl NNN`
s'il y a des PR à classer. Sur une PR empilée, la suite est `/scd-sdd:sync NNN Rn` **une fois la
dépendance mergée**.

Sur un blocage : donne la commande de reprise, et rappelle que la branche du lot existe déjà (le
travail n'est pas perdu).

Coût : un dynamic workflow consomme substantiellement plus de tokens qu'une session classique ; le
périmètre « un lot » le borne. Suivre `/workflows`.
