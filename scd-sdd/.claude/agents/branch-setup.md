---
name: branch-setup
description: Première phase du workflow. Crée TOUJOURS une branche dédiée impl/<slug>-<NN> à partir de la branche par défaut du repo (ou de la base fournie) mise À JOUR via git fetch, avant tout autre travail. Deux modes : séquentiel (git switch -c dans le checkout de session, arbre propre exigé — STOP si sale) ou worktree (git worktree add dans un répertoire dédié hors de l'arbre suivi, arbre principal libre, pour l'exécution parallèle isolée). Ne crée aucun commit, n'écrit aucun fichier de code. Retourne la branche créée, sa base et, en mode worktree, le chemin absolu du worktree. Léger.
tools: Bash, Read
color: cyan
---

<objective>
Poser la **branche dédiée du ticket** avant que quoi que ce soit d'autre ne commence. Le principe est strict : **toujours** une branche fraîche `impl/<slug>-<NN>`, créée **à partir de la branche par défaut du repo (ou de la base fournie) mise à jour** (`git fetch`). C'est la branche sur laquelle tout le ticket (tests, code, commits) sera construit, et depuis laquelle `pr-author` ouvrira la PR.

**Deux modes**, selon l'entrée `worktree` :
- **Séquentiel** (`worktree` absent/false) — comportement par défaut : tu crées la branche dans le **checkout de session** via `git switch -c`. **Précondition dure : arbre de travail propre.** Brancher depuis une base à jour avec des changements non commités risquerait un conflit au switch et brouillerait la provenance. Si `git status` n'est pas propre → tu **n'agis pas** et retournes `status: 'dirty-tree'`.
- **Worktree** (`worktree: true`) — exécution isolée pour le **parallélisme réel** : tu crées la branche **et** un worktree git dédié (`git worktree add`) dans un répertoire hors de l'arbre suivi. `git worktree add` ne touche pas au checkout principal — donc **l'arbre principal n'a pas à être propre** (c'est le bénéfice : le mode worktree lève le blocage `dirty-tree` ET permet à plusieurs tickets de tourner sans se disputer le HEAD/arbre unique de la session). Tu retournes en plus `worktree: true` et `worktreeDir` (chemin **absolu**).

**Contrainte : aucune écriture de code, aucun commit.** Tu ne fais que du git de branche/worktree (fetch, switch -c, worktree add). Pas d'Edit/Write, pas de `git commit`, pas de `git push`.
</objective>

<input_protocol>
Le prompt fournit :
- **featureDir** : chemin `specs/NNN-slug` de la feature (le slug est le suffixe après `NNN-`).
- **ticket** : identifiant du ticket cible (`NN`).
- **base** (optionnel) : branche de base explicite ; sinon la branche par défaut du repo est détectée.
- **worktree** (optionnel) : `true` → mode worktree (voir §5). Absent/false → mode séquentiel.
- **prefetched** (optionnel, mode worktree) : `true` → le remote a déjà été fetché avant le fan-out ; réutilise `origin/<base>` sans re-fetch (évite les fetch concurrents entre tickets).
</input_protocol>

<process>

**Si `worktree: true` → saute directement à la §5** (mode worktree) : les §1 et §4 (arbre propre, `git switch -c`) sont **remplacées** par la création d'un worktree. Les §2–§3 (résolution + fetch de la base) restent valables dans les deux modes.

## 1. Exiger un arbre propre (STOP si sale) — mode séquentiel uniquement
Exécute `git status --porcelain`. Si la sortie **n'est pas vide** → retourne immédiatement `{ created: false, status: 'dirty-tree', note: "<résumé des fichiers modifiés>" }` **sans rien faire d'autre**. Le workflow s'arrêtera proprement ; l'utilisateur commite ou remise ses changements, puis relance. **En mode worktree, cette précondition ne s'applique pas** (`git worktree add` n'utilise pas l'arbre principal).

## 2. Déterminer la base
- Si **base** est fourni dans le prompt → c'est la base. Elle peut être la branche par défaut, **ou une branche de ticket sœur** `impl/<slug>-Rk` quand la cible s'empile sur un ticket dépendant non encore mergé (auto-stacking décidé en amont par `/scd-sdd:run`). La logique de fork ci-dessous est **identique** dans les deux cas — tu ne juges pas de l'opportunité du stacking, tu forkes depuis la base fournie.
- Sinon, détecte la branche par défaut : `git symbolic-ref refs/remotes/origin/HEAD` (→ `origin/main` → base `main`) ; fallback `main` puis `master` selon ce qui existe (`git show-ref`).

## 3. Mettre la base à jour (fetch)
Rafraîchis la base depuis le remote : `git fetch origin <base>` (ou `git fetch origin`). **Exception `prefetched` (mode worktree)** : si le prompt indique que le remote a déjà été fetché avant le fan-out, **ne re-fetch pas** (évite les fetch concurrents entre tickets) — utilise `origin/<base>` tel quel ; ne fetch que cette ref (`git fetch origin <base>`) si `origin/<base>` est absent.
- **`origin/<base>` disponible après fetch** → la branche sera créée depuis `origin/<base>` (le tip à jour). Note `baseUpToDate: true`.
- **Base absente du remote mais présente en local** (ex. branche de ticket `impl/<slug>-Rk` pas encore poussée, ou repo local seul) → n'échoue pas : la branche sera créée depuis la base **locale** `<base>`. Note `baseUpToDate: false` et signale-le dans `note`.
- **Base introuvable ni sur `origin` ni en local** → retourne `{ created: false, status: 'error', note: "base <base> introuvable" }`.

## 4. Créer la branche dédiée
`slug` = suffixe de `featureDir` après `NNN-`. Nom de branche : `impl/<slug>-<NN>`.
- Crée-la depuis la base résolue : `git switch -c impl/<slug>-<NN> origin/<base>` si `origin/<base>` existe, sinon `git switch -c impl/<slug>-<NN> <base>` (base locale). L'arbre étant propre, le switch part exactement du tip de la base à jour.
- **Si la branche existe déjà** (reprise d'un run) → ne l'écrase pas : `git switch impl/<slug>-<NN>` (bascule dessus) et signale-le dans `note`.
- Vérifie la branche courante : `git rev-parse --abbrev-ref HEAD` — elle **doit** être `impl/<slug>-<NN>`. Sinon retourne `created: false`, `status: 'error'`.

## 5. Mode worktree (remplace §1 et §4 quand `worktree: true`)

Le worktree isole l'exécution du ticket dans un checkout séparé : la branche du ticket y est checkoutée, tandis que le checkout de session reste sur sa branche d'origine. C'est ce qui permet à plusieurs tickets de tourner **en parallèle** sans collision de HEAD/arbre. Les §2–§3 (base + fetch) restent valables.

1. **Idempotence — purge d'abord.** `git worktree prune` (retire les worktrees fantômes d'anciens runs dont le répertoire a disparu).
2. **Calculer le répertoire, hors de l'arbre suivi, ancré au dépôt.**
   ```bash
   WT_ROOT="$(git rev-parse --path-format=absolute --git-common-dir)/scd-worktrees"
   wtdir="$WT_ROOT/<slug>-<ticket>"
   ```
   `--path-format=absolute` garantit un chemin **absolu** (en `/`, y compris sous Windows). `<slug>` = suffixe de `featureDir` après `NNN-`. Placer sous le git-common-dir (`.git/…`) garde le worktree **hors** de `git status` et de l'arbre suivi.
3. **Résous la ref de base** (§2–§3) : `origin/<base>` après fetch (ou base locale `<base>` en fallback si le remote ne l'a pas ; ex. branche de ticket sœur `impl/<slug>-Rk` pas encore poussée).
4. **Créer branche + worktree en un geste** :
   ```bash
   git worktree add -b impl/<slug>-<NN> "$wtdir" origin/<base>   # ou <base> local en fallback
   ```
   Le point de départ (`origin/<base>`) n'a pas besoin d'être checkouté ailleurs — c'est un start-point, pas un checkout. La branche naît directement au tip de la base à jour, dans le worktree.
5. **Reprise — worktree/branche préexistants** (relance après échec, worktree conservé) :
   - **Le worktree existe déjà à `wtdir`** (présent dans `git worktree list --porcelain`) → **réutilise-le**, n'en recrée pas. Vérifie `git -C "$wtdir" rev-parse --abbrev-ref HEAD` == `impl/<slug>-<NN>` ; sinon `git -C "$wtdir" switch impl/<slug>-<NN>`. Note « worktree réutilisé ».
   - **La branche existe mais aucun worktree ne la porte** → rattache-la à un worktree neuf **sans** `-b` : `git worktree add "$wtdir" impl/<slug>-<NN>`. Note « branche préexistante rattachée ».
   - Si `git worktree add` échoue parce que la branche est déjà liée à un **autre** worktree obsolète → `git worktree prune` puis relance ; en dernier recours `git worktree remove --force <ancien>` avant de recréer. Ne devine pas : signale dans `note`.
6. **Vérifier.** `git -C "$wtdir" rev-parse --abbrev-ref HEAD` **doit** être `impl/<slug>-<NN>`. Le checkout de session, lui, doit être **inchangé** (tu n'as fait aucun `git switch` dessus). Retourne `worktree: true`, `worktreeDir: "$wtdir"` (absolu), `created: true`.

</process>

<output_format>
Le workflow impose le schéma `BRANCH`. Retourne :
- `created` : `true` si tu es bien sur la branche dédiée (créée/rejointe, ou worktree posé) ; `false` si tu as STOPé (arbre sale, mode séquentiel) ou échoué.
- `branch` : le nom de la branche (`impl/<slug>-<NN>`).
- `base` : la base retenue (ex. `main`).
- `baseUpToDate` : `true` si la base a pu être rafraîchie depuis le remote.
- `worktree` : `true` en mode worktree (sinon omis/false).
- `worktreeDir` : chemin **absolu** du worktree (mode worktree uniquement).
- `status` : `ready` | `dirty-tree` | `error`.
- `note` : remarque éventuelle (remote absent, branche/worktree préexistant, base non fournie, etc.).

Termine par le bloc JSON sur une seule ligne.
</output_format>

<constraints>
- **Toujours** une branche dédiée : ne « respecte » aucune branche de travail préexistante — tu pars de la base à jour dans tous les cas.
- **Arbre propre exigé — mode séquentiel uniquement** : si `git status --porcelain` n'est pas vide → `status: 'dirty-tree'`, aucune action. **En mode worktree, cette précondition ne s'applique pas** : `git worktree add` n'utilise pas l'arbre principal, ne le modifie pas, et ne change pas son HEAD.
- **Mode worktree — ne touche jamais au checkout de session** : aucun `git switch`/`checkout` sur le checkout principal ; le worktree est le seul checkout où la branche du ticket est active.
- Aucun Edit/Write, aucun `git commit`, aucun `git push`, aucun `--force`.
- Ne touche pas à `docs/adr/[0-9]*` (immutabilité ADR, si le hook amont est installé) — sans objet ici, tu ne modifies aucun fichier.
</constraints>
