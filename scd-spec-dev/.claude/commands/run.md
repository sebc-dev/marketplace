---
description: "Implémentation d'UN ticket NN d'un change OpenSpec : lance le dynamic workflow implement-ticket selon le mode de vérif du ticket (**Vérif :** — tdd rouge→vert le test avant le code ; test test-after ; observé une preuve capturée ; aucun un spike) → quality gate → review 8 dimensions en contexte frais → triage → apply → describe → PR. Résout le change, le ticket et sa base depuis le disque, exige un arbre propre, puis exécute le workflow en arrière-plan. On n'appelle JAMAIS /opsx:apply : run prend le relais sur les tickets."
argument-hint: "[<change>] <NN> [--base <branche>]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash(date -I)
  - Bash(openspec:*)
  - Bash(git status *)
  - Bash(git rev-parse *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git ls-remote *)
  - Bash(ls *)
  - Bash(find *)
  - Bash(tr *)
  - Bash(echo *)
  - Workflow
  - AskUserQuestion
---

## Ce que fait cette commande

Tu implémentes **un seul ticket `NN`** d'un change OpenSpec dont les tickets ont été validés, via le
dynamic workflow `implement-ticket` — un script JS qui orchestre des subagents dédiés en arrière-plan,
en commençant par créer une branche dédiée depuis la base à jour, et dont le segment central s'adapte
au mode de vérification déclaré par le ticket.

Tu ne lis ni n'écris le code toi-même. Tu fais quatre choses : **résoudre la cible**, **vérifier les
préconditions**, **lancer le workflow**, et **ouvrir une fiche de chantier si le run se bloque**. Tout
le travail sur le code se fait dans les subagents du workflow.

Ratio : ~20 % humain / 80 % IA (l'humain valide la cible et la base ; le workflow fait le reste).

## Ce qu'elle ne fait JAMAIS

- **Un lancement = un ticket.** Ne boucle jamais sur plusieurs tickets dans une même invocation. Pour
  plusieurs tickets, c'est `/scd-spec-dev:run-parallel`.
- **Arbre de travail propre EXIGÉ.** La première phase du workflow crée la branche dédiée depuis la
  base à jour, ce qui suppose un arbre propre. Pas d'exception.
- **Tu ne devines jamais la base.** Elle se résout de façon déterministe (étape 4) ou elle se demande.
  Un stacking silencieux sur la mauvaise dépendance produit un diff qui rejoue un autre ticket.
- **Tu ne modifies jamais le change ni le fichier du ticket.** Le contrat est en amont. Si
  l'implémentation révèle un défaut du change, signale-le pour un retour à `/scd-spec-dev:tickets` (ou
  au skill OpenSpec `openspec-update-change`) — ne le corrige pas ici.
- **Tu n'appelles jamais `/opsx:apply`.** La couche d'implémentation vit ici, un ticket à la fois.
- **La conversation principale ne lit pas les diffs et n'écrit pas de code.**

---

## Étape 1 — Résoudre le change cible

- **Argument `<change>` fourni** → c'est le change (le nom du répertoire sous `openspec/changes/`).
- **Sinon** → résous depuis le disque. Un change de `openspec/changes/` qui a des tickets
  (`openspec/changes/<x>/tickets/NN-*.md`). Pour lister l'état des changes : `openspec list`. Un seul
  candidat avec des tickets non finis → le prendre et **l'annoncer** ; plusieurs → `AskUserQuestion`.

Charge le skill `implement` — la discipline du niveau implémentation : résolution et parsing du ticket
(le `**Vérif :**`, le `**Bloqué par :**`, le `**Fichiers :**`), les quatre modes de vérif, les
définitions de l'anti-orphelinage. Communique en français.

> Le skill `implement` (avec ses références) porte cette discipline ; la résolution de base ci-dessous
> y est **inlinée** et autosuffisante — applique-la telle quelle, même sans charger le skill.

## Étape 2 — Vérifier les préconditions — deux, STOP si l'une manque

- **Au moins un ticket existe** dans `openspec/changes/<x>/tickets/`. Sinon → « Ce change n'a pas de
  tickets. `/scd-spec-dev:tickets <change>` d'abord. » et STOP.
- **Arbre propre.** Exécute `git status --porcelain` : **s'il n'est pas vide → STOP** et demande de
  commiter ou remiser (`git stash`) avant de relancer. (Si tu lances quand même, le workflow s'arrête
  de lui-même sans rien écrire.)

## Étape 3 — Résoudre le ticket cible

Le ticket `NN` est fourni en argument, ou résolu depuis `openspec/changes/<x>/tickets/` : un ticket
non fait dont **tous** les `**Bloqué par :**` sont faits (démarrable). **Annonce** le ticket que tu as
pris quand il n'a pas été fourni ; sur un choix ambigu ou aucun ticket lançable, **demande via
`AskUserQuestion`** plutôt que de renvoyer.

**Le slug du ticket** = le suffixe du nom de fichier `openspec/changes/<x>/tickets/NN-*.md` après
`NN-`, sans `.md` (résous-le : `ls openspec/changes/<x>/tickets/NN-*.md`). La branche dédiée sera
`impl/<slug>-NN` (le workflow la calcule lui-même ; tu n'en as besoin que pour messager, et pour
résoudre les branches des dépendances à l'étape 4).

## Étape 4 — Résoudre la base — déterministe, jamais devinée

Décide **ici** la base à passer au workflow, pour qu'un ticket qui `**Bloqué par :**` un autre non
encore mergé s'**empile** au lieu de rejouer son diff. Base par défaut du repo via
`git symbolic-ref refs/remotes/origin/HEAD` (repli `main`/`master`).

⚠️ **Le slug est propre à chaque ticket** (il vient du nom de fichier `NN-slug.md`) — contrairement à
un cycle où tous les tickets d'une feature partagent un slug. Pour brancher sur une dépendance `Rk`, il
faut **résoudre le slug de `Rk`** : `ls openspec/changes/<x>/tickets/Rk-*.md` → `impl/<slugRk>-Rk`.

- **`--base <branche>` fourni** → l'override explicite **gagne toujours**. Passe-le tel quel, saute la
  détection.
- Sinon, lis la ligne `**Bloqué par :**` du ticket. Pour chaque dépendance `Rk`, résous
  `impl/<slugRk>-Rk` et teste **deux** conditions :
  1. **Existe** — `git rev-parse --verify --quiet refs/heads/impl/<slugRk>-Rk`, ou
     `git ls-remote --heads origin impl/<slugRk>-Rk` (sortie non vide).
  2. **Non mergée** dans la base par défaut — `git merge-base --is-ancestor <ref-de-Rk> <base-défaut>`
     retourne un code **≠ 0** (teste `origin/impl/<slugRk>-Rk` en priorité s'il existe, sinon la ref
     locale).
- **Exactement une** dépendance *existante ∧ non mergée* → **auto-stacking** :
  `base = impl/<slugRk>-Rk`. Annonce-le : « `NN` empilé sur `Rk` : base = `impl/<slugRk>-Rk` (non
  encore mergé) ; la branche du ticket **ET** la PR partiront de cette base. »
- **Aucune** (toutes mergées, ou pas encore branchées) → **n'impose pas de base** : omets `base`, le
  workflow branche depuis la base par défaut à jour.
- **Deux ou plus** *existantes ∧ non mergées* → **ne devine pas** : demande via `AskUserQuestion` sur
  laquelle empiler (ou d'attendre les merges), ou exige un `--base` explicite. **Ne stacke jamais
  silencieusement.**

**`oldBase` (arme le rebase préventif `--onto`).** Indépendamment de l'état de merge, si le ticket
`**Bloqué par :** Rk` et que `impl/<slugRk>-Rk` **existe** (locale ou remote), passe aussi
`oldBase = impl/<slugRk>-Rk`. Sur un run frais, la phase `Rebase` est un no-op idempotent ; sur une
**reprise** où la base a bougé (`Rk` mergé entre-temps), `oldBase` permet à `rebaser` de transplanter
les seuls commits du ticket (`--onto`, robuste au squash). Pas de dépendance, ou branche absente →
n'envoie pas `oldBase`.

## Étape 5 — Lancer le workflow

Rappels avant lancement :

- **Branche d'abord** : `branch-setup` crée toujours `impl/<slug>-NN` depuis la base à jour
  (`git fetch`) — rien n'atterrit sur la base. La phase suivante (`Rebase`, préventive) repose la
  branche de façon idempotente (no-op sur une branche fraîche).
- **Base / oldBase** : passe la base résolue à l'étape 4. Elle s'applique **à la fois** à la branche
  dédiée et à la PR.
- **Action sortante** : `pr-author` fera `git push` + `gh pr create` / `glab mr create`. Pour éviter un
  prompt en cours de run, l'utilisateur peut pré-allowlister `Bash(git push *)`, `Bash(gh pr *)`,
  `Bash(glab mr *)`. Signale-le si ce n'est pas déjà le cas.
- **Description de la PR** : l'avant-dernière phase (`Describe`, `pr-describer`, lecture seule) compose
  la description destinée au reviewer humain — fonctionnel **et** code, findings appliqués **et
  rejetés**. Elle est **sautée** si le budget restant est trop faible : la PR s'ouvre alors avec un
  corps de repli minimal, jamais sans description.

Le workflow se lance **par son chemin de fichier** (`scriptPath`), **jamais par `name`** : les
workflows de ce plugin vivent sous `.claude/workflows/`, hors du répertoire `workflows/` racine (le
seul auto-découvert) et le manifeste ne les déclare pas ; ils ne sont donc pas au registre des noms.
`Workflow(name: "implement-ticket", …)` échouerait avec « Workflow not found ».

**a. Résous le chemin absolu du script.** `${CLAUDE_PLUGIN_ROOT}` ne s'expande pas de façon fiable
quand on le passe **littéralement** à `scriptPath` — résous-le d'abord par Bash, où le shell l'expand :

```bash
SRC="${CLAUDE_PLUGIN_ROOT}/.claude/workflows/implement-ticket.js"
[ -f "$SRC" ] || SRC="$(find "$HOME/.claude/plugins/cache" -path '*scd-spec-dev*/implement-ticket.js' 2>/dev/null | sort -V | tail -1)"
[ -f "$SRC" ] || SRC="$(find "$HOME/.claude/plugins" -path '*scd-spec-dev*/implement-ticket.js' 2>/dev/null | sort -V | tail -1)"
echo "$SRC"
```

Rien trouvé → demande le chemin à l'utilisateur.

**b. Normalise en LF avant de lancer.** Un seul octet `CR` dans le script fait rejeter tout le workflow
par la couche de permission (« script contains control characters… »), **avant** qu'il ne démarre. Un
cache installé sous `core.autocrlf=true` garde ses CRLF. Copie le script en LF dans un temporaire et
passe **ce** chemin à `scriptPath` (le workflow est auto-contenu — aucun `require`, aucun chemin
relatif, aucun `refsDir` — donc le lancer depuis une copie est sûr) :

```bash
NORM="${TMPDIR:-/tmp}/implement-ticket.$$.js"
tr -d '\r' < "$SRC" > "$NORM" && echo "$NORM"
```

**c. Lance** avec le chemin **normalisé** et les arguments (les workflows de ce plugin ne prennent
**pas** de `refsDir` — leurs agents sont autonomes) :

```
Workflow(scriptPath: "<chemin normalisé en b>", args: { changeDir: "openspec/changes/<x>", ticket: "NN", base: "<branche ou omis>", oldBase: "<impl/<slugRk>-Rk ou omis>" })
```

> C'est un **template** — omets `base`/`oldBase` quand ils n'ont pas lieu d'être (ticket indépendant
> sur la base par défaut).

## Étape 6 — Rendre compte

Le workflow tourne en arrière-plan (`/workflows` pour suivre). À sa complétion, résume le `status`
retourné :

- **`done`** → ticket vérifié (mode indiqué dans le retour), findings appliqués/rejetés, quality
  advisory éventuels, cases cochées, **PR ouverte** (`pr.url`, ou `pr: null` si push/CLI indisponible
  — indique alors la branche poussée).
  - Si **`pr.stacked`** : la PR est ouverte en **draft** (labels `stacked`/`needs-sync`, bloc
    d'avertissement). Rappelle qu'elle **ne doit pas être mergée directement** : merger d'abord la
    dépendance, puis `/scd-spec-dev:sync <change> NN`.
  - Si **`humanCheckRequired`** non vide (mode observé) : la PR porte une checklist de points qu'un
    humain doit constater (rendu visuel, effet externe).
- **`blocked-branch`** → la branche dédiée n'a pas pu être posée (arbre sale au moment de brancher, ou
  problème git) ; **rien n'a été écrit**. Commiter/remiser puis relancer.
- **`blocked-rebase`** → la phase préventive a échoué (conflit avorté à résoudre à la main, ou
  `--force-with-lease` rejeté → refetch puis relance). Aucun code écrit ; rien n'est forcé.
- **`blocked-brief`** → le fichier ticket est mal formé (id absent, `**Vérif :**` illégale, « Ce que
  ça livre » vide) : le ticket est à réparer via `/scd-spec-dev:tickets`.
- **`blocked-red`** / **`blocked-tests-modified`** (tdd) · **`blocked-impl`** (test/observé/aucun :
  l'impl n'a pas passé l'intégration) · **`blocked-verify`** (le `verifier` n'a pas obtenu la ceinture
  ou une preuve observable) · **`blocked-after-fix`** → explique le blocage et la reprise. **Aucune PR
  n'est ouverte pour un ticket bloqué** ; la branche dédiée existe déjà.
- **`blocked-quality`** / **`blocked-quality-config`** / **`blocked-quality-tests-touched`** → la
  quality gate a un check `blocking` en échec, un `.claude/quality.json` illisible, ou l'autofix a
  touché un test. Explique quel check, et la reprise.
- **`blocked-record`** / **`blocked-branch-drift`** → `progress-recorder` s'est arrêté ou a commité sur
  une branche ≠ celle posée par `branch-setup` (filet déterministe) : **aucune PR ouverte**. Signale
  `expectedBranch`/`recordedBranch` ; c'est un bug d'agent à investiguer avant de relancer.

## Étape 7 — Sur tout statut `blocked-*`, ouvre une fiche de chantier

C'est la **seule écriture documentaire** de cette commande, et elle existe pour une raison précise : un
run bloqué ne coche aucun critère et n'ouvre aucune PR, donc **rien sur le disque ne le distingue d'un
ticket jamais lancé**. Sans cette fiche, le fait disparaît au `/clear`.

`docs/chantiers/en-cours/AAAA-MM-JJ-run-<slug>-<NN>.md`, `Portée : <change> · ticket NN`. Charge les
blocs `<interdits>` et `<template>` de `chantier/references/fiche.md`. Y entrent : le statut `blocked-*`
exact, la branche du ticket (le travail n'est pas perdu), ce que le workflow a produit avant de
s'arrêter, et la sortie d'erreur **non tronquée**. Manifeste de contexte : le fichier ticket et le
change, tous deux `à lire`.

⚠️ **C'est toi qui écris, jamais le workflow** (aucune I/O par contrat) ni `progress-recorder`, qui ne
tourne que sur le chemin de succès. Une fiche existe déjà pour ce ticket → **actualise-la**, n'en ouvre
pas une seconde.

## Ce que tu NE fais PAS

- Tu ne lis pas les diffs, tu n'écris pas de code, tu ne juges pas la qualité de l'implémentation.
- Tu ne boucles pas sur plusieurs tickets, tu ne relances pas automatiquement un ticket bloqué.
- Tu ne modifies ni le change, ni le fichier du ticket (les cases sont à `progress-recorder`).
- Tu ne rebases pas et tu ne relandes pas à la main : c'est `/scd-spec-dev:sync` et
  `/scd-spec-dev:reland`.

## Skills actifs

- `implement` — résolution et parsing du ticket, les quatre modes de vérif, définitions de
  l'anti-orphelinage. La résolution de base de l'étape 4 y est inlinée : autosuffisante sans le skill.
- `openspec` — la frontière : `run` prend le relais sur les tickets, jamais `/opsx:apply`.
- `chantier` — `references/fiche.md`, blocs `<interdits>` et `<template>`, **seulement** si le run se
  bloque.

## À la fin

Sur un `done` : propose le ticket suivant (`/scd-spec-dev:run <change> NN+1`), ou
`/scd-spec-dev:status <change>` s'il y a des PR à classer. Sur une PR empilée, la suite est
`/scd-spec-dev:sync <change> NN` **une fois la dépendance mergée**.

Sur un blocage : donne la commande de reprise, et rappelle que la branche du ticket existe déjà (le
travail n'est pas perdu). **Si la reprise n'est pas immédiate**, ajoute : « `/scd-spec-dev:pause` avant
de `/clear` — la fiche gardera ce que tu allais faire, et c'est le seul endroit où ce run bloqué
laissera une trace. »

Coût : un dynamic workflow consomme substantiellement plus de tokens qu'une session classique ; le
périmètre « un ticket » le borne. Suivre `/workflows`.
