---
description: "Implémentation d'UN ticket NN : lance le dynamic workflow implement-ticket selon le mode de vérif du ticket (**Vérif :** — `test`, rouge→vert, le test avant le code ; `observé`, une preuve capturée quand aucun test automatisé n'est possible) → review → triage → apply → describe → PR ready-for-review. Résout la feature, le ticket et sa base depuis le disque, exige un arbre propre, puis exécute le workflow en arrière-plan."
argument-hint: "[NNN|slug] [NN] [--base <branche>]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(date -I)
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

Tu implémentes **un seul ticket de review `NN`** d'une feature dont le contrat est validé, via le
dynamic workflow `implement-ticket` — un script JS qui orchestre des subagents dédiés en arrière-plan,
en commençant par créer une branche dédiée depuis la base à jour, et dont le segment central
s'adapte au mode de vérification déclaré par le ticket.

Tu ne lis ni n'écris le code toi-même. Tu fais quatre choses : **résoudre la cible**, **vérifier
les préconditions**, **lancer le workflow**, et **ouvrir une fiche de chantier si le run se
bloque**. Tout le travail sur le code se fait dans les subagents du workflow.

Ratio : 20% humain / 80% AI (l'humain valide la cible et la base ; le workflow fait le reste).

## Règles absolues

- **Un lancement = un ticket.** Ne boucle jamais sur plusieurs tickets dans une même invocation. Pour
  plusieurs tickets, c'est `/scd-sdd:run-parallel`.
- **Arbre de travail propre EXIGÉ.** La première phase du workflow crée la branche dédiée depuis
  la base à jour, ce qui suppose un arbre propre. Pas d'exception.
- **Tu ne devines jamais la base.** Elle se résout de façon déterministe (étape 4) ou elle se
  demande. Un stacking silencieux sur la mauvaise dépendance produit un diff qui rejoue un autre
  ticket.
- **Tu ne modifies jamais `SPEC.md` ni le fichier du ticket.** Le contrat est en amont. Si
  l'implémentation révèle un défaut du contrat, signale-le pour un retour à `/scd-sdd:tickets` —
  ne le corrige pas ici.
- **La conversation principale ne lit pas les diffs et n'écrit pas de code.**

## Processus

1. **Résous la feature cible** selon la section « Cibler une feature » du skill `specs` —
   source de vérité unique, référencée et jamais recopiée. Filtre propre à ce niveau : parmi les
   candidates, celles qui portent au moins un ticket non fait. Charge aussi le
   skill `implement` (`references/tickets-parsing.md` pour le parsing du ticket et son
   `**Vérif :**`, `references/verification-modes.md` pour la discipline par mode). Communique en
   français.

2. **Vérifie les préconditions — deux, et il n'y en a plus de troisième. STOP si l'une manque :**
   - **Au moins un ticket existe** dans `specs/NNN-slug/`. Sinon → « Cette feature n'a pas de
     tickets. `/scd-sdd:tickets NNN` d'abord. » et STOP.
     ⚠️ **Il n'y a plus de gate à vérifier.** Le cycle `1.x` exigeait un verdict `analyze` au vert,
     lu au journal ; les deux ont disparu (`DECISIONS.md` §D41). Ne cherche pas ce fichier.
   - **Arbre propre.** Exécute `git status --porcelain` : **s'il n'est pas vide → STOP** et demande
     de commiter ou remiser (`git stash`) avant de relancer. (Si tu lances quand même, le workflow
     s'arrête de lui-même en `blocked-dirty-tree` sans rien écrire.)

3. **Résous le ticket cible** selon le bloc `<resolution>` de `references/tickets-parsing.md`, chargé à
   l'étape 1 — la seule source de cette règle. Deux points qui t'appartiennent : **annonce** le ticket
   que tu as pris quand il n'a pas été fourni en argument, et sur un choix ambigu ou aucun ticket
   lançable, **demande via `AskUserQuestion`** plutôt que de renvoyer.

4. **Résous la base — déterministe, jamais devinée.** Décide **ici** la base à passer au workflow,
   pour qu'un ticket qui `dépend de :` un autre non encore mergé s'**empile** au lieu de rejouer son
   diff. `slug` = suffixe de `featureDir` après `NNN-` ; base par défaut du repo via
   `git symbolic-ref refs/remotes/origin/HEAD` (repli `main`/`master`).

   - **`--base <branche>` fourni** → l'override explicite **gagne toujours**. Passe-le tel quel,
     saute la détection.
   - Sinon, lis la ligne `dépend de : …` du ticket. Pour chaque dépendance `Rk`, calcule
     `impl/<slug>-Rk` et teste **deux** conditions :
     1. **Existe** — `git rev-parse --verify --quiet refs/heads/impl/<slug>-Rk`, ou
        `git ls-remote --heads origin impl/<slug>-Rk` (sortie non vide).
     2. **Non mergée** dans la base par défaut — `git merge-base --is-ancestor <ref-de-Rk>
        <base-défaut>` retourne un code **≠ 0** (teste `origin/impl/<slug>-Rk` en priorité s'il
        existe, sinon la ref locale).
   - **Exactement une** dépendance *existante ∧ non mergée* → **auto-stacking** :
     `base = impl/<slug>-Rk`. Annonce-le : « `NN` empilé sur `Rk` : base = `impl/<slug>-Rk` (non
     encore mergé) ; la branche du ticket **ET** la PR partiront de cette base. »
   - **Aucune** (toutes mergées, ou pas encore branchées) → **n'impose pas de base** : omets
     `base`, le workflow branche depuis la base par défaut à jour.
   - **Deux ou plus** *existantes ∧ non mergées* → **ne devine pas** : demande via
     `AskUserQuestion` sur laquelle empiler (ou d'attendre les merges), ou exige un `--base`
     explicite. **Ne stacke jamais silencieusement** sur l'une d'elles.

   **`oldBase` (arme le rebase préventif `--onto`).** Indépendamment de l'état de merge, si le ticket
   `dépend de : Rk` et que `impl/<slug>-Rk` **existe** (locale ou remote), passe aussi
   `oldBase = impl/<slug>-Rk`. Sur un run frais, la phase `Rebase` est un no-op idempotent ; sur une
   **reprise** où la base a bougé (`Rk` mergé entre-temps), `oldBase` permet à `rebaser` de
   transplanter les seuls commits du ticket (`--onto`, robuste au squash). Pas de dépendance, ou
   branche absente → n'envoie pas `oldBase`.

5. **Lance le workflow.** Rappels avant lancement :
   - **Branche d'abord** : `branch-setup` crée toujours `impl/<slug>-<NN>` depuis la base à jour
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

   Le workflow se lance **par son chemin de fichier** (`scriptPath`), **jamais par `name`** : les
   workflows de ce plugin vivent sous `.claude/workflows/`, hors du répertoire `workflows/` à la
   racine du plugin — le seul auto-découvert — et le manifeste ne les déclare pas ; ils ne sont
   donc pas au registre des noms. `Workflow(name: "implement-ticket", …)` échoue avec
   « Workflow not found ».

   **a. Résous le chemin absolu du script.** `${CLAUDE_PLUGIN_ROOT}` ne s'expande pas de façon
   fiable dans un fichier de commande markdown — ne le passe pas à `scriptPath`. Résous par Bash :

   ```bash
   find "$HOME/.claude/plugins/cache" -path '*scd-sdd*/implement-ticket.js' 2>/dev/null | sort -V | tail -1
   ```

   Prends la ligne retournée (la version installée la plus haute). Si rien n'est trouvé, élargis à
   `find "$HOME/.claude/plugins" -path '*scd-sdd*/implement-ticket.js' 2>/dev/null | sort -V | tail -1`,
   puis en dernier recours demande le chemin à l'utilisateur.

   **a-bis. Normalise en LF avant de lancer.** Un seul octet `CR` dans le script fait rejeter tout
   le workflow par la couche de permission (« script contains control characters that would be
   hidden in the approval dialog »), **avant** qu'il ne démarre. Le `.gitattributes` du plugin force
   le LF au checkout, mais un cache installé sous `core.autocrlf=true` **avant** ce correctif garde
   ses CRLF — c'est un fait d'install, pas de source, donc tu ne peux pas le supposer propre. Copie
   le script en LF dans un fichier temporaire et passe **ce** chemin à `scriptPath` (le workflow est
   auto-contenu — aucun `require`, aucun chemin relatif — donc le lancer depuis une copie est sûr) :

   ```bash
   SRC="<chemin résolu en a>"
   NORM="${TMPDIR:-/tmp}/implement-ticket.$$.js"
   tr -d '\r' < "$SRC" > "$NORM" && echo "$NORM"
   ```

   **b. Lance** avec le chemin **normalisé** (`$NORM`) et les arguments résolus :

   ```
   Workflow(scriptPath: "<chemin normalisé en a-bis>", args: { featureDir: "specs/NNN-feature", ticket: "NN", base: "<branche ou omis>", oldBase: "<impl/<slug>-Rk ou omis>" })
   ```

   > C'est un **template** — adapte-le si la feature l'exige (framework de test particulier), sans
   > casser le contrat parser.

6. **Rends compte.** Le workflow tourne en arrière-plan (`/workflows` pour suivre). À sa
   complétion, résume le `status` retourné :
   - **`done`** → ticket vérifié (mode indiqué dans le retour), findings appliqués/rejetés, cases
     cochées, **PR ouverte** (`pr.url`, ou `pr: null` si push/CLI indisponible — indique alors la
     branche poussée).
     - Si **`pr.stacked`** : la PR est ouverte en **draft** (labels `stacked`/`needs-sync`, bloc
       d'avertissement). Rappelle qu'elle **ne doit pas être mergée directement** : merger d'abord
       la dépendance, puis `/scd-sdd:sync NNN NN`.
     - Si **`humanCheckRequired`** non vide (modes observé) : la PR porte une checklist de
       points qu'un humain doit constater (rendu visuel, effet externe).
     - Si **`oversized`** : la **logique de production** dépasse le seuil de review en une passe
       (les tests n'y comptent pas) — la PR le dit, mais l'humain doit savoir qu'elle demandera
       deux passes.
   - **`blocked-dirty-tree`** → l'arbre n'était pas propre au moment de brancher ; **rien n'a été
     écrit**. Commiter/remiser puis relancer.
   - **`blocked-branch`** → la branche dédiée n'a pas pu être posée (problème git) ; rien n'a été
     écrit.
   - **`blocked-rebase`** → la phase préventive a échoué : `blocked-conflict` (conflit avorté, à
     résoudre à la main), `blocked-dirty`, `blocked-push` (`--force-with-lease` rejeté → refetch
     puis relance). Aucun code écrit ; rien n'est forcé.
   - **`blocked-impl`** (observé) → l'impl-first n'a pas passé l'intégration
     (build/lint) ; explique et propose la reprise.
   - **`blocked-red`** / **`blocked-tests-modified`** (modes-test) · **`blocked-verify`**
     (observé : le `verifier` n'a pas obtenu de preuve) · **`blocked-after-fix`** → explique
     le blocage et la reprise. **Aucune PR n'est ouverte pour un ticket bloqué** ; la branche dédiée
     existe déjà.
   - **`blocked-branch-drift`** → `progress-recorder` a commité sur une branche ≠ celle posée par
     `branch-setup` (filet déterministe) : **aucune PR ouverte**. Signale
     `expectedBranch`/`recordedBranch` ; c'est un bug d'agent à investiguer avant de relancer.

8. **Sur tout statut `blocked-*` — ouvre une fiche de chantier.** C'est la **seule écriture
   documentaire** de cette commande, et elle existe pour une raison précise : un run bloqué ne
   coche aucun critère et n'ouvre aucune PR, donc **rien sur le disque ne le distingue d'un ticket
   jamais lancé**. Sans cette fiche, le fait disparaît au `/clear`.

   `docs/chantiers/en-cours/AAAA-MM-JJ-run-<slug>-<NN>.md`, `Portée : NNN-slug · ticket NN`. Charge
   les blocs `<interdits>` et `<template>` de `chantier/references/fiche.md`. Y entrent : le statut
   `blocked-*` exact, la branche du ticket (le travail n'est pas perdu), ce que le workflow a
   produit avant de s'arrêter, et la sortie d'erreur **non tronquée**. Manifeste de contexte : le
   ticket et sa `SPEC.md`, tous deux `à lire`.

   ⚠️ **C'est toi qui écris, jamais le workflow** (aucune I/O par contrat) ni `progress-recorder`,
   qui ne tourne que sur le chemin de succès — il perdrait donc exactement les statuts qu'il faut
   garder. Une fiche existe déjà pour ce ticket → **actualise-la**, n'en ouvre pas une seconde.

## Ce que tu NE fais PAS

- Tu ne lis pas les diffs, tu n'écris pas de code, tu ne juges pas la qualité de l'implémentation.
- Tu ne boucles pas sur plusieurs tickets, tu ne relances pas automatiquement un ticket bloqué.
- Tu ne modifies ni `SPEC.md`, ni le fichier du ticket (les cases sont à `progress-recorder`).
- Tu ne rebases pas et tu ne relandes pas à la main : c'est `/scd-sdd:sync` et `/scd-sdd:reland`.

## Skill active

- `specs` — section « Cibler une feature » pour la résolution de la cible.
- `implement` — charge `references/tickets-parsing.md` et `references/verification-modes.md`.
- `chantier` — `references/fiche.md`, blocs `<interdits>` et `<template>`, **seulement** si le run
  se bloque.

## À la fin

Sur un `done` : propose le ticket suivant (`/scd-sdd:run NNN NN+1`), ou `/scd-sdd:status NNN`
s'il y a des PR à classer. Sur une PR empilée, la suite est `/scd-sdd:sync NNN NN` **une fois la
dépendance mergée**.

Sur un blocage : donne la commande de reprise, et rappelle que la branche du ticket existe déjà (le
travail n'est pas perdu). **Si la reprise n'est pas immédiate**, ajoute : « `/scd-sdd:pause` avant
de `/clear` — la fiche gardera ce que tu allais faire, et c'est le seul endroit où ce run bloqué
laissera une trace. »

Coût : un dynamic workflow consomme substantiellement plus de tokens qu'une session classique ; le
périmètre « un ticket » le borne. Suivre `/workflows`.
