# Anti-orphelinage des PR empilées

Charge ce bloc pour le **sens** des termes que `run`, `run-parallel`, `sync`, `reland` et `status`
invoquent. Il porte les définitions ; les commandes portent les invocations git.

## Le problème vécu

Les tickets s'**empilent** : le ticket `02` qui `**Bloqué par :** 01` part de la branche de `01`
(`impl/<slug01>-01`) plutôt que de la branche par défaut, pour ne pas rejouer le diff de `01`. C'est
sûr **tant que `01` n'est pas mergé**. La faille : si un humain merge la PR de `02` **alors que sa
base est encore `impl/<slug01>-01`**, la forge fusionne les commits **dans cette branche
intermédiaire**, jamais dans `main`. La PR passe `MERGED`, mais le code de `02` est **orphelin** —
absent du produit.

## Définitions

- **`défaut`** — la branche par défaut du repo : `git symbolic-ref refs/remotes/origin/HEAD` → suffixe
  après `origin/` (repli `main`, puis `master`). **La seule branche où le code d'un ticket arrive
  réellement dans le produit.**
- **Branche du ticket `NN`** — `impl/<slugNN>-NN`, où `slugNN` = suffixe du nom de fichier
  `openspec/changes/<x>/tickets/NN-*.md` après `NN-`. **Slug propre à chaque ticket** : pour une
  dépendance `Rk`, résous `impl/<slugRk>-Rk` par `ls …/tickets/Rk-*.md`, ne réutilise jamais le slug
  courant.
- **PR empilée** — une PR dont la **base ≠ `défaut`**. Elle dépend qu'une autre branche de ticket soit
  mergée d'abord.
- **Ticket « arrivé dans `main` »** — son **contenu** est dans `origin/<défaut>`.

## La priorité du signal de contenu

Pour savoir si un ticket est arrivé dans `main`, **le signal de contenu prime sur l'ancêtre git** :

1. **Signal de contenu (autorité)** : les cases `## Critères` du fichier ticket **tel qu'il est dans
   `origin/<défaut>`** — `git show origin/<défaut>:openspec/changes/<x>/tickets/NN-*.md`. À ne pas
   confondre avec le fichier local, qui peut porter des cases cochées sur une branche non mergée.
2. **Corroboration git (secondaire)** : `git merge-base --is-ancestor <headRefOid> origin/<défaut>`
   (code 0 = arrivé). Elle ne dit vrai que sur **merge propre** — un **squash** ou un **rebase** casse
   l'ancêtre alors que le contenu est bien là. D'où la priorité du contenu.

## Les trois classes de PR à surveiller (`status`)

| Classe | Condition | Remède |
|---|---|---|
| **OK** | base = `défaut` | mergeable telle quelle |
| **EMPILÉ EN ATTENTE** | base = branche d'un ticket **non mergé** | normal ; attendre |
| **DANGEREUX** | base = branche d'un ticket **déjà mergé** | merger orphelinerait → `/scd-spec-dev:sync` (rebase + retarget sur `défaut` + ready) |
| **ORPHELIN** | PR mergée, mais son contenu **absent de `défaut`** | `/scd-spec-dev:reland` (nouvelle branche depuis `défaut` → cherry-pick → nouvelle PR ready → commentaire sur l'orpheline) |

## Ce que chaque commande fait de ces définitions

- **`pr-author`** (dans `run`) — une PR empilée s'ouvre en **draft** + labels `stacked`/`needs-sync` +
  bloc d'avertissement « ne pas merger directement ». C'est la barrière **préventive**.
- **`sync`** — curatif du cas « `01` mergé → rebase `02` » : délègue le rebase à `rebaser`
  (`--onto`, `--force-with-lease`, jamais de conflit auto), puis **retarget** la PR sur `défaut`,
  passe **ready**, retire `needs-sync`.
- **`reland`** — rattrapage d'un **ORPHELIN** : délègue à `relander`.
- **`status`** — classe chaque PR ouverte selon la table ci-dessus, sans rien réparer.

Aucune de ces commandes ne résout un conflit automatiquement : sur conflit, elles s'arrêtent et
rendent la main à l'humain.
