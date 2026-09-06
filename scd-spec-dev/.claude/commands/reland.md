---
description: "Remédiation des tickets ORPHELINS : un ticket dont la PR a été mergée dans une branche de ticket intermédiaire (cul-de-sac) au lieu de la branche par défaut, laissant son code absent de main. Détecte les orphelins depuis l'état des PR et le signal de contenu du ticket à origin/<défaut>, calcule le range de commits propres, puis délègue le rattrapage à l'agent relander (nouvelle branche depuis la base par défaut → cherry-pick → nouvelle PR ready → commentaire sur l'orpheline). Idempotent."
argument-hint: "[<change>] [NN]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Bash(openspec:*)
  - Bash(git fetch *)
  - Bash(git status *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git rev-parse *)
  - Bash(git show *)
  - Bash(git ls-remote *)
  - Bash(ls *)
  - Bash(gh pr list *)
  - Bash(gh pr view *)
  - Bash(glab mr list *)
  - Bash(glab mr view *)
  - Task
  - AskUserQuestion
---

## Ce que fait cette commande

Tu **rattrapes un ticket orphelin**. Le stacking a une faille vécue : si un humain merge une PR empilée
alors que sa base est encore la branche de ticket intermédiaire `impl/<slugRk>-Rk`, la forge fusionne
les commits **dans cette branche cul-de-sac**, jamais dans la branche par défaut. La PR passe `MERGED`,
mais le code est **orphelin** — absent de `main`. Symptôme réel :
`PR #6 MERGED base=impl/<slugR5>-05`, mais `main` sans le code de `06`.

Tu **détectes** les tickets orphelins, tu **calcules** de façon déterministe les commits propres à
rapatrier, puis tu **délègues** le rattrapage à l'agent `relander` (branche `reland/<slug>-NN` depuis
`défaut` → cherry-pick → nouvelle PR ready → commentaire sur l'orpheline).

C'est le pendant curatif du garde-fou draft de `pr-author` : la prévention rend le mauvais merge
difficile, `reland` répare quand il a quand même eu lieu.

Ratio : ~15 % humain / 85 % IA (mécanique ; l'humain n'intervient que sur conflit).

## Ce qu'elle ne fait JAMAIS

- **`gh`/`glab` requis.** Détecter un orphelin exige l'état des PR (`MERGED` + `baseRefName` +
  `headRefOid`). Sans CLI de forge → STOP : « État PR indisponible, impossible de détecter les
  orphelins ; installe/authentifie `gh`/`glab`. »
- **Jamais de résolution de conflit.** L'agent avorte, tu rapportes. `blocked-conflict` = intervention
  humaine.
- **Push simple, jamais `--force`.** La branche `reland/…` est neuve.
- **Idempotent.** Relançable sans effet : un ticket déjà rapatrié (dans `main`, ou avec une PR
  `reland/…` existante) est **sauté**, pas recréé.
- **Curatif ciblé.** Ne relande que des tickets **`MERGED` hors de `défaut` et absents de `main`**. Un
  ticket ouvert, ou déjà dans `main`, n'est pas concerné.
- Tu ne modifies ni le fichier du ticket, ni le change, ni le code : tu rapatries des commits déjà
  produits.

## Définitions

Le **sens** de `défaut` et de *ticket arrivé dans `main`* — dont la priorité du signal de contenu sur
l'ancêtre git — est porté par le skill `implement` (`references/anti-orphelinage.md`), que tu charges.
Ici, les seules **invocations**, partagées avec `/scd-spec-dev:status` et `/scd-spec-dev:sync` :

- `défaut` : `git symbolic-ref refs/remotes/origin/HEAD` → suffixe après `origin/` (repli
  `main`/`master`).
- Branche du ticket `NN` : `impl/<slugNN>-NN`, où `slugNN` = suffixe du nom de fichier
  `openspec/changes/<x>/tickets/NN-*.md` après `NN-` (`ls` — ⚠️ **slug propre à chaque ticket**).
- Cases cochées à l'amont : `origin/<défaut>:openspec/changes/<x>/tickets/NN-*.md` via `git show`.
  Corroboration git : `git merge-base --is-ancestor <headRefOid> origin/<défaut>` (code 0 = arrivé).

## Processus

1. **Résous le change cible** : argument `<change>`, sinon depuis `openspec/changes/`. Charge le skill
   `implement`. Communique en français. Vérifie la précondition `gh`/`glab` (STOP sinon).

2. **Prépare les signaux.**
   - Détermine `défaut`.
   - `git fetch origin` (met à jour `origin/<défaut>` et les branches de ticket).
   - Lis le fichier ticket **tel qu'il est dans `main`** via `git show
     origin/<défaut>:openspec/changes/<x>/tickets/NN-*.md` — les cases telles qu'elles sont sur la
     branche par défaut, à ne pas confondre avec le fichier local, qui peut porter des cases cochées sur
     une branche de ticket non mergée. C'est le **signal de contenu**.

3. **Détecte les tickets orphelins.** Pour chaque ticket `NN` du change (ou le seul `NN` fourni),
   récupère sa PR : `gh pr list --head impl/<slugNN>-NN --state all --json
   number,state,baseRefName,headRefName,headRefOid` (équivalent `glab mr list`). Un ticket est
   **🔴 ORPHELIN** ssi **toutes** ces conditions :
   1. sa PR est **`MERGED`** ;
   2. sa base au merge `baseRefName` **≠ `défaut`** (mergée dans une branche de ticket `impl/<slugRk>-Rk`) ;
   3. le ticket est **absent de `main`** : ses critères ne sont **pas** cochés dans le fichier ticket à
      `origin/<défaut>` (signal de contenu, prioritaire), **corroboré** par
      `! git merge-base --is-ancestor <headRefOid> origin/<défaut>` (code ≠ 0).

   **Idempotence — no-op si déjà rapatrié.** Si le ticket est **déjà arrivé dans `main`** (critères
   cochés à `origin/<défaut>`, ou `git merge-base --is-ancestor <headRefOid> origin/<défaut>` code 0) →
   **pas orphelin**. Si une branche ou PR `reland/<slugNN>-NN` **existe déjà**
   (`git ls-remote --heads origin reland/<slugNN>-NN` non vide, ou
   `gh pr list --head reland/<slugNN>-NN --state all`) → le rattrapage est déjà en cours ou fait :
   **signale-le et saute**, ne crée pas de doublon.

   **Cas limite — base auto-retargetée.** Si `baseRefName` == `défaut` (la forge a auto-retargeté la PR
   après suppression de la branche de ticket au merge), le ticket n'est **pas** orphelin au sens
   base ≠ défaut : fie-toi alors au seul signal contenu/ancêtre pour décider s'il est arrivé. **Ne
   signale pas d'orphelin à tort.**

   Aucun ticket orphelin → annonce « aucun ticket orphelin à rapatrier » et STOP.

4. **Calcule le range et délègue — dans l'ordre des dépendances.** Traite les orphelins dans l'ordre
   `**Bloqué par :**` — rapatrier `Rk` avant `Rk+1`, pour ne pas relander sur une base elle-même
   incomplète. Pour chaque orphelin `NN` mergé dans `impl/<slugRk>-Rk` :
   - `oldBase` = `impl/<slugRk>-Rk` — le `baseRefName` de la PR orpheline, **borne gauche** du range
     `git log <oldBase>..<headRefOid> --no-merges`.
   - `headRefOid`, et `orphanPr` = le numéro/URL de la PR orpheline.
   - récupère `capability` (titre du ticket) et les `criteres` livrés (depuis le fichier ticket) pour la
     description de la nouvelle PR.

   Invoque l'agent **`scd-spec-dev:relander`** (Task) avec `{ slug: "<slugNN>", ticket: "NN",
   base-de-la-PR: "impl/<slugRk>-Rk", headRefOid: "<oid>", orphanPr: "<url>", capability, criteres }`.
   L'agent : arbre propre exigé → branche `reland/<slugNN>-NN` depuis `origin/<défaut>` → cherry-pick
   des commits propres → push simple → PR ready → `défaut` → commente l'orpheline. Il **avorte**
   proprement sur conflit (`blocked-conflict`) ou range vide (`blocked-empty-range`).

5. **Rends compte.** Par orphelin traité : statut du relander (`relanded` → URL de la nouvelle PR ;
   `blocked-*` → raison et remédiation manuelle). Rappelle que la PR orpheline reste `MERGED`
   (commentée, **pas rouverte**) et que le rattrapage vit dans la **nouvelle** PR ready → `défaut`.
   Signale les orphelins **bloqués** : `blocked-conflict` → cherry-pick à la main ;
   `blocked-empty-range` → range à revoir, possiblement déjà dans la base ; `blocked-reland-exists` →
   branche `reland/…` préexistante à inspecter.

## Ce que tu NE fais PAS

- Tu ne résous aucun conflit, tu ne forces aucun push.
- Tu ne rouvres jamais la PR orpheline : elle reste `MERGED`, commentée.
- Tu ne relandes pas un ticket déjà dans `main`, ni un ticket dont la PR est encore ouverte.
- Tu ne recrées pas une branche `reland/…` existante — tu la signales.
- Tu ne lances aucun ticket (`/scd-spec-dev:run`), tu ne rebases aucune PR ouverte (`/scd-spec-dev:sync`).
- Tu ne modifies ni le fichier du ticket, ni le change, ni le code.

## Skill active

- `implement` — définitions de l'anti-orphelinage (`défaut`, arrivé dans `main`, priorité du
  signal de contenu) via `references/anti-orphelinage.md`, et parsing du ticket.

## À la fin

Renvoie vers `/scd-spec-dev:status <change>` pour reconfirmer que `main` a bien reçu le code — c'est la
seule vérification qui compte ici.

Plusieurs orphelins d'une même chaîne (le cas 05/06) → rappelle qu'ils ont été traités dans l'ordre
`**Bloqué par :**`, et que l'ordre de merge des nouvelles PR doit le respecter aussi.
