---
description: "Décompose un change OpenSpec en TICKETS verticaux — le pont change→tickets, le 2e des deux gestes humains. Lit le change (proposal + deltas specs/ + design, plus test-plan/security-review/ux s'ils existent), extrait les scénarios WHEN/THEN des deltas en critères à ID stable (SC-<NN><lettre>), regroupe en tranches verticales dont chacune livre un comportement vérifiable de bout en bout (≈ une PR), invoque le skill strategie-verif par ticket pour décider `**Vérif :**` (tdd | test | observé | aucun, ou escalade arbitrage humain), déduit `**Fichiers :**` (parallélisation) et `**Bloqué par :**` (dépendances). ARBITRE la granularité avec l'humain AVANT d'écrire — c'est la seule validation du niveau change, elle ne se saute pas — puis écrit changes/<x>/tickets/NN-slug.md, un fichier par ticket, dans l'ordre des dépendances. N'écrit JAMAIS dans le change (proposal/specs/design sont la matière) ni dans openspec/specs/ (fusionné à l'archivage). N'appelle jamais /opsx:apply : c'est /scd-spec-dev:run qui prend le relais sur les tickets."
argument-hint: "[<change> — optionnel, résolu depuis openspec/changes/]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
  - Bash(openspec:*)
  - Bash(ls:*)
  - Bash(test:*)
  - Bash(cat:*)
---

## Ce que fait cette commande

`/scd-spec-dev:tickets` **décompose un change OpenSpec en tickets** — le pont entre la couche
doc→specs d'OpenSpec (qui s'arrête au change) et la couche d'implémentation de ce plugin (qui prend
un ticket à la fois). C'est le **2e des deux gestes humains** du cycle : le premier est de relire le
change, le second — ici — d'**arbitrer la granularité du découpage**.

La substance vit dans le skill **`change-decomposer`** (méthode, format, seuils) et dans le skill
**`strategie-verif`** (le mode de vérif par ticket), tous deux chargés ci-dessous. Cette commande
est le point d'entrée : elle résout le change, applique la méthode, arbitre, écrit.

**Ratio : ~40 % humain / 60 % IA** — tu proposes le découpage, l'humain le corrige jusqu'à l'accord.

## Ce qu'elle ne fait JAMAIS

- **Elle n'écrit aucun ticket avant l'accord** sur le découpage. Écrire d'abord et demander ensuite
  transforme l'arbitrage en validation de façade.
- **Elle ne modifie pas le change** — ni `proposal.md`, ni les deltas `specs/`, ni `design.md`. Le
  change est la **matière**, pas la cible. Un défaut révélé se **signale** (le change se révise via le
  skill OpenSpec `openspec-update-change`).
- **Elle n'écrit rien dans `openspec/specs/`** : la fusion des deltas est le travail de
  `openspec archive`, après les PR — jamais ici.
- **Elle n'appelle jamais `/opsx:apply`** et **ne lance aucune implémentation** : c'est
  `/scd-spec-dev:run`, un ticket à la fois.

---

## Étape 1 — Résoudre le change cible

- **Argument fourni** (`$ARGUMENTS`) → c'est le change.
- **Sinon** → résoudre depuis le disque. Un change de `openspec/changes/` qui a des deltas
  (`specs/**/spec.md`) et **pas encore** de `tickets/`. Pour lister : `openspec list`. Un seul
  candidat → le prendre ; plusieurs → demander à l'humain (`AskUserQuestion`).

Si aucun change décomposable n'existe, s'arrêter et l'indiquer : ouvrir d'abord un change avec
`/opsx:propose "<idée>"`, le relire, puis relancer `/scd-spec-dev:tickets`.

## Étape 2 — Décomposer (skill `change-decomposer`)

Charger le skill **`change-decomposer`** et suivre sa méthode en sept temps (`SKILL.md` +
`references/tickets.md` **intégralement**). En résumé opérationnel :

1. **Lire le change en entier** : `proposal.md`, tous les `specs/**/spec.md` (les deltas),
   `design.md`, plus `test-plan.md` / `security-review.md` / `ux.md` s'ils existent ; puis les
   documents durables pointés par `openspec/config.yaml` (vision, roadmap, architecture, `docs/adr/`)
   et le glossaire de `CLAUDE.md` — le vocabulaire des tickets est celui du domaine.
2. **Explorer le dépôt** : l'état réel du code touché ; repérer le **préfactoring** et le **refactor
   large** (→ expand-contract, bloc `<splitting>`).
3. **Extraire et regrouper** : chaque scénario WHEN/THEN → un critère candidat ; regrouper en
   **tranches verticales** passant les bloquants de `<criteria>`.
4. **Décider le mode de chaque ticket** → étape 3 ci-dessous.

## Étape 3 — Décider le mode de vérif (skill `strategie-verif`)

Pour **chaque** ticket pressenti, appliquer le skill **`strategie-verif`** (arbre à cinq étapes) :

- Sortie `{ mode, stratégie, justification }` avec `mode` ∈ {`tdd`, `test`, `observé`, `aucun`} ;
- ou **escalade** `arbitrage humain` (une porte de l'étape 0 s'est ouverte : sécurité/paiement/
  données perso/irréversible sans oracle, énoncé ambigu, test non passable sans le modifier, tests
  qui contredisent l'énoncé). Une escalade se **remonte** à l'arbitrage (étape 4).

Le mode est **décidé une fois** : il devient le champ `**Vérif :**` du ticket, jamais re-décidé en
aval.

## Étape 4 — Présenter et arbitrer (le geste humain)

L'étape qui compte. Présenter le découpage — **le problème d'abord, en prose**, puis les choix : pose
en deux ou trois phrases ce qui est en jeu pour ce projet avant d'aligner les tickets, et décris
chaque option par sa **conséquence pour le projet**, jamais en jargon. Pour chaque ticket :
**titre**, **ce qu'il livre** (le comportement, pas les couches), **ce qui le bloque**, **le mode**
proposé (et son motif s'il n'est pas `tdd`). Puis les questions, posées ensemble :

- la granularité est-elle juste — trop grossier, trop fin ?
- les dépendances sont-elles réelles, ou seulement l'ordre où tu y as pensé ?
- faut-il fusionner ou scinder quelque chose ?
- les escalades `arbitrage humain` : quel mode l'humain retient-il pour ces tickets ?

**Itérer jusqu'à l'accord.** Ne pas passer à l'écriture sur un « ça a l'air bien » ambigu.

## Étape 5 — Écrire les tickets

**Après** l'accord seulement, un fichier par ticket, `changes/<change>/tickets/NN-slug.md`, au
format du template `openspec/schemas/scd/templates/ticket.md` (posé par `/setup`) :

- numérotation dans l'**ordre des dépendances** (un bloqueur porte un numéro inférieur) ;
- ids de critère `SC-<NN><lettre>` **figés** (un par scénario WHEN/THEN) ;
- `**Vérif :**` = le mode retenu (jamais `arbitrage humain` : le mode que l'humain a tranché) ;
- `**Fichiers :**` et `**Bloqué par :**` déduits ;
- `## Ce que ça livre` autosuffisant (le briefer aval le lira **sans** rouvrir le change — contrat
  BRIEF, `references/brief.md`).

Créer `changes/<change>/tickets/` si absent (`mkdir -p` via l'outil d'écriture / `test -d`).

## Étape 6 — Contrôler le graphe et rendre compte

Avant de rendre : le graphe des `Bloqué par` est **acyclique**, au moins un ticket **démarrable**,
chaque bloqueur existe, chaque scénario WHEN/THEN est couvert. Un graphe faux se voit ici ou jamais.

Puis un récapitulatif court :

```
## Tickets — changes/<change>/tickets/ · [N] tickets

| # | Livre | Bloqué par | Vérif |
|---|---|---|---|
| 01 | … | — | tdd |
| 02 | … | 01 | test |

Démarrables maintenant : [01, …]

### Couverture
[Chaque scénario WHEN/THEN des deltas → le(s) ticket(s)/critère(s) qui le livrent.
 Tout scénario non couvert est un défaut, et se dit.]

### Écarté du découpage
[une ligne par option de scission envisagée et rejetée, avec son motif — ou « rien »]
```

**Prochaine action** : `/scd-spec-dev:run 01` — un ticket, une branche, une PR. Plusieurs tickets
démarrables aux fichiers disjoints → `/scd-spec-dev:run-parallel 01 03` (worktrees, parallèle réel).
Un défaut du change révélé → **le dire d'abord, seul** : réviser le change (skill OpenSpec
`openspec-update-change`) avant d'implémenter.

## Skills actifs

- **`change-decomposer`** — méthode du découpage ; `references/tickets.md` chargée **intégralement**
  (format, critères, seuils, expand-contract), `references/brief.md` pour l'autosuffisance du ticket.
- **`strategie-verif`** — le mode de vérif par ticket (étape 3), invoqué un ticket à la fois.
- **`openspec`** — la fondation : les natures de document, le schéma `scd`, et la frontière (les
  tickets ne sortent pas du schéma ; jamais `/opsx:apply`).
