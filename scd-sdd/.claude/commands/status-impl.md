---
description: "Tableau de bord d'implémentation. Scanne specs/, dérive l'avancement des lots Rn depuis les cases cochées de tasks.md, lit au journal le dernier run de chaque lot (le seul moyen de voir un run bloqué), dit quel lot lancer ensuite, et classe chaque PR de lot selon sa sûreté de merge : OK, DANGEREUX (empilé, dépendance mergée — merger orphelinerait), EMPILÉ EN ATTENTE, ORPHELIN (mergé hors de la branche par défaut, code absent de main). Lecture seule."
argument-hint: "[NNN|slug] (ou rien — scanne specs/)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(git fetch *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git rev-parse *)
  - Bash(git show *)
  - Bash(git ls-remote *)
  - Bash(gh pr list *)
  - Bash(gh pr view *)
  - Bash(glab mr list *)
  - Bash(glab mr view *)
  - Bash(grep *)
  - Bash(ls *)
---

## Contexte

Tu réponds à « **où en est l'implémentation, et quelles PR sont sûres à merger ?** ». Le développeur
reprend après un `/clear` et veut savoir quels lots `Rn` sont faits, lequel lancer ensuite, et surtout
**quelles PR de lot il ne doit pas merger telles quelles** — le stacking a une faille : merger une PR
empilée alors que sa base est encore une branche de lot intermédiaire envoie le code dans un
cul-de-sac, jamais dans `main` (code **orphelin**).

Tu croises **trois sources** :

- **les cases de `tasks.md`**, qui donnent l'avancement des lots. Ici, contrairement au niveau specs,
  les cases `[x]` **sont** la source de vérité : c'est ce niveau-ci qui les coche, via
  `progress-recorder` ;
- **l'état des PR** (`gh`/`glab`), qui donne la sûreté de merge ;
- **`docs/journal/NNN-slug.md`**, qui donne le seul fait que ni les cases ni les PR ne portent :
  **un run bloqué**. Un run qui échoue ne coche rien et n'ouvre aucune PR — sans le journal, il est
  indiscernable d'un lot jamais lancé.

Et, en complément, l'**en-tête** des fiches de `docs/chantiers/en-cours/` : si la `Portée` d'une
fiche nomme un lot, ce lot a été relayé par un `/scd-sdd:pause`. C'est la réparation la plus
concrète de l'angle mort des runs interrompus en vol — sans jamais scanner les worktrees.

Tu es la vue **détaillée du niveau implémentation**. La vue des trois niveaux est `/scd-sdd:status` ;
le détail des specs est dans `/scd-sdd:status-specs`.

Ratio : 10% humain / 90% AI (lecture mécanique ; l'humain choisit la suite).

## Règles absolues

- **Lecture seule.** Tu ne modifies aucun fichier — **ni un journal, ni une fiche de chantier** — et
  tu ne lances aucun workflow. `git fetch` (mise à jour des refs de suivi) est toléré : il ne touche
  ni l'arbre de travail ni l'historique local. Tout le reste est de la lecture. Tu ne joues aucune
  phase, donc tu ne consignes rien, et c'est de nature, pas un oubli.
- **Des fiches de chantier tu ne lis que la ligne `Portée`.** Jamais le corps, jamais le manifeste :
  c'est `/scd-sdd:resume` qui restitue une intention, et ça coûte un contexte qu'un tableau de bord
  ne dépense pas. Un chantier **ne change pas** le calcul du prochain lot lançable.
- **Tu n'ouvres aucun journal en entier** : tu en extrais par motif les lignes `run Rn`, `sync` et
  `reland` (étape 5).
- **Dérive l'avancement des cases de `tasks.md`**, jamais du contexte (il a été effacé) ni d'un
  fichier d'état (il dériverait).
- **Une ligne de journal n'est jamais un état.** C'est un événement daté. La colonne « Dernier run »
  rapporte ce qui **s'est passé**, elle ne redéfinit jamais l'avancement : sur désaccord, **les cases
  gagnent**.
- **Dégradation propre sans `gh`/`glab`.** Sans CLI de forge (ou sans remote), tu ne peux pas lire
  l'état des PR : classe alors sur le seul signal git, **signale que l'état PR est indisponible**, et
  n'annonce ni DANGEREUX ni ORPHELIN à tort.
- **Tu n'inventes aucune date.** Journal absent → colonne « Dernier run » à `—` et absence signalée.

## Définitions

Partagées avec `/scd-sdd:sync` et `/scd-sdd:reland` ; portées par le skill `implement`.

- **`défaut`** = branche par défaut du repo : `git symbolic-ref refs/remotes/origin/HEAD` → suffixe
  après `origin/` (repli `main`/`master`).
- **Lot `Rk`** → branche `impl/<slug>-Rk` ; sa PR `Pk` se trouve par
  `gh pr list --head impl/<slug>-Rk --state all --json
  number,state,baseRefName,headRefName,headRefOid` (ou `--search "head:impl/<slug>-Rk"`).
  `slug` = suffixe de `featureDir` après `NNN-`.
- **PR empilée** : `P.baseRefName` == une branche de lot `impl/<slug>-R*` (donc **≠ `défaut`**).
- **Lot arrivé dans `main`** — signal de **contenu**, robuste au squash/rebase/merge-commit : ses
  tâches `Tn` sont **cochées** dans `origin/<défaut>:specs/<NNN-slug>/tasks.md`, lu par
  `git show origin/<défaut>:specs/<NNN-slug>/tasks.md`. Corroboration git (fiable pour un
  merge-commit) : `git merge-base --is-ancestor <headRefOid> origin/<défaut>` (code 0 = arrivé).
  **Le signal de contenu est prioritaire** sur l'ancêtre git — un squash change les SHA et fait
  échouer l'ancêtre à tort.

## Processus

1. **Charge la référence** : `references/tasks-parsing.md` du skill `implement` (parsing des lots
   `Rn`, tâches `Tn`, `dépend de :`).

2. **Prépare le signal `main`** (best-effort, saute si indisponible) : détermine `défaut`, puis
   `git fetch origin` (met à jour `origin/<défaut>` et les branches de lot). Récupère
   `origin/<défaut>:specs/<NNN-slug>/tasks.md` via `git show` pour lire les cases **telles qu'elles
   sont dans `main`** — à ne pas confondre avec le `tasks.md` local, qui peut porter des cases cochées
   sur une branche de lot non mergée.

3. **Scanne `specs/`** : pour chaque `NNN-slug/tasks.md` **local**, énumère les lots `Rn` et calcule
   leur **avancement** depuis les cases locales :
   - **fait** : toutes les tâches `Tn` du lot cochées `[x]` ;
   - **en cours** : certaines cochées, d'autres non ;
   - **à faire** : aucune cochée.

4. **Détermine le prochain lot lançable** : le premier `Rn` non fait dans l'ordre des dépendances
   **dont toutes les dépendances (`dépend de : Rn`) sont faites**. Signale tout lot **bloqué**
   (dépendance non faite).

5. **Extrais de `docs/journal/NNN-slug.md`**, s'il existe, sans l'ouvrir :

   ```bash
   grep -hE '\| (run R|sync|reland) ' docs/journal/NNN-slug.md
   ```

   Pour chaque lot, garde la **dernière** ligne `run Rn`, plus les lignes `sync`/`reland` qui la
   suivent. C'est ce qui alimente la colonne **« Dernier run »**, et c'est la seule façon de voir :
   - un lot **bloqué** (`⛔ blocked-*`) — aucune case cochée, aucune PR : invisible partout ailleurs ;
   - un lot **relancé après échec** — deux lignes, dont on ne garde que la dernière ;
   - un **worktree conservé** après un échec parallèle, dont le chemin n'est listé nulle part.

   **Pas de contrôle de fraîcheur ici**, contrairement à `/scd-sdd:status-specs` : au niveau specs le
   verdict `analyze` n'existe nulle part sur disque, donc le journal est la seule source et sa
   péremption doit être vérifiée. Ici les cases de `tasks.md` sont autoritaires et toujours à jour :
   le journal ne fait qu'**ajouter** ce qu'elles ne peuvent pas porter. En cas de désaccord (journal
   `✅ done`, cases non cochées), affiche les deux et **fie-toi aux cases**.

   Puis `ls docs/chantiers/en-cours/` et, pour chaque fiche, lis **la seule ligne `Portée`**
   (`grep -m1 '^Portée' <fiche>`). Une portée de la forme `NNN-slug · lot Rn` marque ce lot d'un
   `⏸` dans la colonne « Dernier run », avec le titre de la fiche en note de pied. Cela ne change
   **rien** au calcul de l'étape 4.

6. **Classe la sûreté de merge de chaque PR de lot** (best-effort ; saute proprement si
   `gh`/`glab`/remote indisponible et signale « état PR indisponible »). Pour chaque lot `Rn`, récupère
   sa PR (§Définitions) et applique **exactement** cette table :

   | État | Condition | Action recommandée |
   |---|---|---|
   | **OK** | PR `MERGED` **et** lot arrivé dans `main` ; **ou** PR `OPEN` **non empilée** (base = `défaut`) | rien — sûre / en attente de review |
   | **⚠️ DANGEREUX** | PR `OPEN` **∧** base = `impl/<slug>-Rk` **∧** `Rk` **arrivé** dans `main` | `/scd-sdd:sync NNN Rn` — merger maintenant **orphelinerait** ; sync rebase sur `défaut`, retargete la base, passe ready |
   | **⚠️ EMPILÉ EN ATTENTE** | PR `OPEN` **∧** base = `impl/<slug>-Rk` **∧** `Rk` **pas encore** dans `main` | merger d'abord `Rk`, **puis** `/scd-sdd:sync NNN Rn` |
   | **🔴 ORPHELIN** | PR `MERGED` **∧** base ≠ `défaut` **∧** lot **absent** de `main` (Tn non cochés dans `origin/<défaut>`, corroboré par `! git merge-base --is-ancestor <headRefOid> origin/<défaut>`) | `/scd-sdd:reland NNN Rn` — rapatrie le lot sur `main` par cherry-pick + nouvelle PR |

   **Cas limite — base pointant une branche de lot supprimée.** Si `P.baseRefName` désigne une branche
   `impl/<slug>-Rk` qui n'existe plus (GitHub a auto-retargeté la PR après merge de `Rk`), recalcule
   l'état depuis la **base courante** de la PR (souvent déjà `défaut`) — **ne signale pas de dérive à
   tort**.

7. **Produis le tableau de bord** selon le bloc `<report>`, avec la **prochaine commande** prête à
   copier pour chaque feature en vol et la classification des PR.

8. Si `analyze` n'a manifestement pas été passée (spec avec `[NEEDS CLARIFICATION]`, `tasks.md`
   absent), signale-le : l'implémentation ne doit pas démarrer sur un contrat non validé.

<report>
```
## Implémentation — specs/

### NNN-slug
Lots : 1 fait · 1 en cours · 2 à faire
- [x] R1 — auth de base            (fait)
- [~] R2 — reset password          (en cours : T3, T4 restants)
- [ ] R3 — sessions                (à faire · bloqué par R2)
- [ ] R4 — audit log               (à faire)
Prochain : /scd-sdd:run NNN R2

| Lot | Dernier run              | PR   | État                 | Base         | Action                     |
|-----|--------------------------|------|----------------------|--------------|----------------------------|
| R1  | ✅ done · TDD · 5 tests  | #10  | OK (mergé, dans main)| main         | —                          |
| R2  | ⛔ blocked-red (30/07)   | —    | non lancé            | —            | /scd-sdd:run NNN R2        |
| R3  | —                        | —    | non lancé            | —            | bloqué par R2              |
| R4  | ✅ done (29/07)          | #14  | ⚠️ EMPILÉ EN ATTENTE | impl/slug-R3 | merger R3, puis sync       |

Sûreté de merge (base par défaut : main) — 1 PR à traiter en priorité.

### MMM-autre
...

Recommandation : relander R6 (code absent de main) avant tout, puis sync R2.
```

Lire l'exemple : `R2` a ses cases partiellement cochées, donc « en cours » — c'est tout ce que **la
dérivation** peut dire, et elle le dira toujours. C'est la colonne **Dernier run**, tirée du journal,
qui révèle *pourquoi* : un run bloqué en `blocked-red`. Sans elle, un lot bloqué la semaine dernière
et un lot jamais lancé sont indiscernables.

Colonne **Dernier run** — le seul fait de ce tableau qui ne vient ni des fichiers ni des PR :

- `—` : aucune ligne `run Rn` au journal pour ce lot (jamais lancé, ou journal absent).
- `✅ done · <mode> · N tests` : dernière ligne `run Rn` au vert. La date n'est affichée que si elle
  éclaire quelque chose (lot ancien, ou désaccord avec les cases).
- `⛔ <statut> (JJ/MM)` : dernier run **bloqué**. Le statut est repris tel quel du journal
  (`blocked-red`, `blocked-dirty-tree`, `blocked-verify`, …). Ajouter `· worktree conservé` si la
  ligne le mentionne — c'est là que vit le travail du lot.
</report>
> Sans `gh`/`glab` : remplace la colonne État par « PR indisponible (pas de forge) » et ne classe que
> l'avancement, la colonne Dernier run et le signal `main` (arrivé/absent). Les colonnes PR/Base/Action
> passent à `—`.

## Dégradations

- **`specs/` vide, ou aucun `tasks.md`** → « Aucune feature prête à implémenter. Termine un cycle de
  specs (jusqu'à `analyze`). »
- **`docs/journal/` absent** (projet démarré avant le journal) → tableau **complet mais sans colonne
  « Dernier run »**, et une ligne de pied qui le dit : « Pas de `docs/journal/` — l'issue des runs
  passés n'est pas connaissable hors session, notamment les runs bloqués. Elle apparaîtra au prochain
  run. » **Toi, tu ne le crées ni ne le reconstruis** : tu es en lecture seule. Projet venu des trois
  anciens plugins → renvoie vers `/scd-sdd:migrate`, la seule commande qui le crée. Elle ne
  reconstitue **pas** l'issue des runs pour autant : elle n'a aucune source pour ça.
- **`docs/JOURNAL.md` présent** (projet suivi avant l'éclatement du journal) → dis-le en une
  ligne et renvoie vers `/scd-sdd:migrate`, qui le convertit. **Tu ne le lis pas.**
- **`docs/journal/NNN-slug.md` absent pour une feature existante** → colonne à `—` sur tous ses lots.
  Ce n'est pas une anomalie : aucun lot n'a jamais été lancé.
- **`docs/chantiers/` absent ou `en-cours/` vide** → aucun `⏸`, aucune note de pied, aucune mention.
- **Pas de `gh`/`glab`, ou pas de remote** → voir la note du `<report>`. **N'annonce ni DANGEREUX ni
  ORPHELIN** : ces deux états exigent l'état des PR.
- **Hors dépôt git** → pas de signal `main` du tout : n'affiche que l'avancement et la colonne
  « Dernier run », et dis-le.

## Ce que tu NE fais PAS

- Tu ne lances aucun lot (c'est `/scd-sdd:run`), tu ne rebases ni ne relandes (c'est `sync` / `reland`).
- **Tu n'écris rien**, ni dans `tasks.md`, ni dans le journal. `status-impl` est **idempotent** et
  relançable sans effet.
- Tu ne lis pas le code ni les diffs, tu ne juges pas la qualité de l'implémentation — seulement
  l'avancement dérivé des cases, l'issue journalisée, et l'état/base des PR.
- Tu ne dérives aucune phase de specs : c'est `/scd-sdd:status-specs`.
- Tu ne convertis pas une ligne de journal en avancement : sur désaccord, les cases gagnent.
- Tu ne lis pas le **corps** d'une fiche de chantier — seulement sa ligne `Portée` — et un chantier
  ne modifie jamais le prochain lot lançable que tu recommandes.

## Consigne au journal

**Aucune.** Tu ne joues aucune phase : tu **lis** le journal pour y trouver le dernier run de
chaque lot, tu n'y ajoutes rien. Une consultation n'est pas un événement du cycle. C'est de
nature, pas un oubli.

## Skill active

- `implement` — charge `references/tasks-parsing.md` ; définitions de l'anti-orphelinage.
- `feature-specs` — section « Cibler une feature » si un argument doit être résolu.
- `journal` — contrat de `docs/journal/*.md` (**lecture seule ici**).
- `chantier` — format de l'en-tête, pour lire la ligne `Portée` (**cette ligne seule, lecture seule
  ici** ; tu ne charges pas `references/manifeste.md`).

## À la fin

Donne la prochaine commande recommandée, prête à copier, en **priorisant** dans cet ordre :
**🔴 ORPHELIN** (code déjà absent de `main`), puis **⚠️ DANGEREUX** (risque d'orphelinage au prochain
merge), puis le prochain lot lançable.

Rappelle les deux vues voisines : `/scd-sdd:status` pour les trois niveaux, `/scd-sdd:status-specs`
pour le détail des specs.
