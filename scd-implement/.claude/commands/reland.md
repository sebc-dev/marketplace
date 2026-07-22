---
name: reland
description: "Remédiation des lots ORPHELINS : un lot dont la PR a été mergée dans une branche de lot intermédiaire (cul-de-sac) au lieu de la branche par défaut, laissant son code absent de main. Détecte les orphelins depuis l'état des PR + le signal contenu de tasks.md à origin/<défaut>, calcule le range de commits propres de chaque lot, puis délègue le rattrapage à l'agent relander (nouvelle branche depuis la base par défaut → cherry-pick → nouvelle PR ready → commentaire sur l'orpheline). Ne résout aucun conflit automatiquement ; idempotent (no-op si le lot est déjà dans main)."
argument-hint: "[NNN|slug] [Rn]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(git fetch *)
  - Bash(git status *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git rev-parse *)
  - Bash(git show *)
  - Bash(git ls-remote *)
  - Bash(gh pr list *)
  - Bash(gh pr view *)
  - Bash(glab mr list *)
  - Bash(glab mr view *)
  - Task
  - AskUserQuestion
---

<objective>
**Rattraper un lot orphelin.** Le stacking a une faille vécue : si un humain merge une PR empilée alors que sa base est encore la branche de lot intermédiaire `impl/<slug>-Rk`, GitHub fusionne les commits **dans cette branche cul-de-sac**, jamais dans la branche par défaut. La PR passe `MERGED`, mais le code est **orphelin** — absent de `main`. Symptôme réel : `PR #6 MERGED base=impl/<slug>-R5`, mais `main` sans le code de `R6`.

Cette commande **détecte** les lots orphelins, **calcule** de façon déterministe les commits propres à rapatrier, puis **délègue** le rattrapage à l'agent `relander` (branche `reland/<slug>-Rn` depuis `défaut` → cherry-pick → nouvelle PR ready → commentaire sur l'orpheline). C'est le pendant curatif du garde-fou draft de `pr-author` : la prévention rend le mauvais merge difficile, `reland` répare quand il a quand même eu lieu. **Aucun conflit n'est résolu automatiquement** (STOP + rapport).
</objective>

<process>

## 1. Charger la connaissance et résoudre la feature
Charge le skill `implement` (`references/tasks-parsing.md`). Résous la feature comme `/scd-implement:run` (argument `NNN`/slug, sinon la seule feature en vol, sinon `AskUserQuestion`). `slug` = suffixe après `NNN-`. Communique en français.

**Précondition — `gh`/`glab` requis.** Détecter un orphelin exige l'état des PR (`MERGED` + `baseRefName` + `headRefOid`). Sans CLI de forge → STOP : « État PR indisponible, impossible de détecter les orphelins ; installe/authentifie `gh`/`glab`. »

## 2. Préparer les signaux (défaut, fetch, tasks.md dans main)
- `défaut` = `git symbolic-ref refs/remotes/origin/HEAD` → suffixe après `origin/` (fallback `main`/`master`).
- `git fetch origin` (met à jour `origin/<défaut>` et les branches de lot).
- Lis `origin/<défaut>:specs/<NNN-slug>/tasks.md` via `git show` — les cases **telles qu'elles sont dans `main`** (≠ le `tasks.md` local, qui peut porter des cases cochées sur une branche de lot non mergée). C'est le **signal contenu** de « lot arrivé dans `main` ».

## 3. Détecter les lots orphelins
Pour chaque lot `Rn` de `tasks.md` (ou le seul `Rn` fourni en argument), récupère sa PR : `gh pr list --head impl/<slug>-Rn --state all --json number,state,baseRefName,headRefName,headRefOid` (équivalent `glab mr list`). Un lot est **🔴 ORPHELIN** ssi **toutes** ces conditions :
1. sa PR est **`MERGED`** ;
2. sa base au merge `baseRefName` **≠ `défaut`** (mergée dans une branche de lot `impl/<slug>-Rk`) ;
3. le lot est **absent de `main`** : ses `Tn` ne sont **pas** cochés dans `origin/<défaut>:tasks.md` (signal contenu, prioritaire), **corroboré** par `! git merge-base --is-ancestor <headRefOid> origin/<défaut>` (code ≠ 0).

**Idempotence (no-op si déjà rapatrié).** Si le lot est **déjà arrivé dans `main`** (Tn cochés dans `origin/<défaut>`, ou `git merge-base --is-ancestor <headRefOid> origin/<défaut>` code 0) → **pas orphelin**, ne relande pas. Si une branche/PR `reland/<slug>-Rn` **existe déjà** (`git ls-remote --heads origin reland/<slug>-Rn` non vide, ou `gh pr list --head reland/<slug>-Rn --state all`) → le rattrapage est déjà en cours/fait : **signale-le et saute** (ne recrée pas de doublon).

**Cas limite — base auto-retargetée.** Si `baseRefName` == `défaut` (GitHub a auto-retargeté la PR après suppression de la branche de lot au merge), le lot n'est **pas** orphelin au sens base ≠ défaut : fie-toi alors au seul signal contenu/ancêtre pour décider s'il est arrivé. Ne signale pas d'orphelin à tort.

Si aucun lot orphelin → annonce « aucun lot orphelin à rapatrier » et STOP.

## 4. Calculer le range et déléguer à `relander` (ordre des dépendances)
Traite les orphelins dans l'**ordre des dépendances** (`dépend de :`) — rapatrier `Rk` avant `Rk+1` pour ne pas relander sur une base elle-même incomplète. Pour chaque orphelin `Rn` mergé dans `impl/<slug>-Rk` :
- `oldBase` = `impl/<slug>-Rk` (le `baseRefName` de la PR orpheline — la **borne gauche** du range `git log <oldBase>..<headRefOid> --no-merges`).
- `headRefOid`, `orphanPr` = le numéro de la PR orpheline.
- récupère `capability` (titre du lot) et les `shalls` (FR/SHALL livrés, depuis `spec.md`) pour la description.

Invoque l'agent **`scd-implement:relander`** (Task) avec `{ featureDir, slug, lot: "Rn", base: "<défaut>", oldBase: "impl/<slug>-Rk", headRefOid: "<oid>", orphanPr: <k>, capability, shalls }`. L'agent : arbre propre exigé → branche `reland/<slug>-Rn` depuis `origin/<défaut>` → cherry-pick des commits propres → push simple → PR ready → défaut → commente l'orpheline. Il **avorte** proprement sur conflit (`blocked-conflict`) ou range vide (`blocked-empty-range`) — tu ne résous **jamais** un conflit à sa place.

## 5. Rendre compte
Par orphelin traité : statut du relander (`relanded` → URL de la nouvelle PR ; `blocked-*` → raison et remédiation manuelle). Rappelle que la PR orpheline reste `MERGED` (commentée, pas rouverte) et que le rattrapage vit dans la **nouvelle** PR ready → `défaut`. Signale les orphelins **bloqués** (`blocked-conflict` → cherry-pick à la main ; `blocked-head-unreachable`/`blocked-oldbase-unreachable` → commits/base introuvables, reland manuel depuis un reflog ; `blocked-empty-range` → range à revoir, possiblement déjà dans la base). Propose `/scd-implement:status NNN` pour reconfirmer que `main` a bien reçu le code.

</process>

<guidelines>
- **Curatif ciblé.** Ne relande que des lots **`MERGED` hors de `défaut` et absents de `main`**. Un lot ouvert (pas encore mergé), ou déjà dans `main`, n'est pas concerné.
- **Idempotent.** Relançable sans effet : un lot déjà rapatrié (dans `main`, ou avec une PR `reland/…` existante) est sauté.
- **Jamais de résolution de conflit.** L'agent avorte ; tu rapportes. `blocked-conflict` = intervention humaine.
- **Push simple, jamais `--force`.** La branche `reland/…` est neuve.
- **Ordre des dépendances.** Plusieurs orphelins d'une même chaîne (le cas R5/R6) → rapatrie dans l'ordre `dépend de :`.
- Tu ne modifies ni `tasks.md`, ni le code, ni la spec : tu rapatries des commits déjà produits dans une nouvelle PR.
</guidelines>

<skill>
- `implement` — charge `references/tasks-parsing.md`.
</skill>
