---
name: journal
description: |
  Contrat du fichier de suivi docs/JOURNAL.md du cycle spec-driven : format,
  règle d'ajout, vocabulaire de chaque phase, règle de reconstitution à la
  migration, et la frontière événement-vs-état qui décide ce qui a le droit d'y
  figurer. Se charge quand une commande /scd-sdd:* consigne ce qu'elle vient de
  faire (init-project, brief, prd, stack, adr, contract, kickoff-feature,
  specify, clarify, plan, tasks, analyze, premortem, run, run-parallel, sync,
  reland, migrate) et quand /scd-sdd:status le relit. Porte UNIQUEMENT le
  journal : ni la dérivation de l'état depuis les fichiers (elle appartient aux
  skills project-docs, feature-specs et implement), ni le contenu des documents
  produits.
---

# Journal — `docs/JOURNAL.md`

## Pourquoi il existe

L'état du cycle se **dérive des fichiers** : `spec.md` existe → la feature est
spécifiée ; les cases `[x]` de `tasks.md` → les lots faits. C'est robuste et ça survit
au `/clear` sans rien maintenir. Mais la dérivation ne donne qu'un instantané : elle dit
*où on en est*, jamais *comment on y est arrivé, ni quand*.

Le journal est donc la **chronologie des phases jouées** — une ligne par phase, socle et
features. Chaque commande qui joue une phase y consigne son résultat ; les trois `status`
ne consignent rien, ils lisent.

Et parmi ces phases, **trois faits ne sont connaissables que là**, parce qu'ils ne
laissent aucune trace sur disque :

| Fait | Pourquoi il n'est pas dérivable |
|---|---|
| le verdict d'une gate `analyze` | `analyze` est en lecture seule, il n'écrit aucun rapport |
| un `premortem` appliqué | il édite `spec/plan/tasks` sans laisser de marqueur |
| l'issue d'un lot | un run **bloqué** ne coche rien et ne produit aucune PR |

Sans le journal, ces trois-là sont perdus à la fin de la session. Les autres lignes,
elles, sont redondantes avec les fichiers **par leur existence** mais pas **par leur
date** : c'est ce qui rend la péremption détectable (voir ci-dessous).

## La frontière : événement, pas état

- Le journal enregistre **ce qui est arrivé, à une date**. Une ligne est un fait passé,
  définitivement vrai.
- Le journal n'enregistre **jamais l'état courant**. « la feature 001 est validée » est
  un état : il se périme dès qu'on touche `spec.md`. « le 28/07, `analyze` a rendu
  PRÊT » est un événement : il reste vrai pour toujours.
- **Un lecteur ne dérive donc jamais un état d'une ligne seule.** Il croise la date de
  la ligne avec la dernière modification des fichiers concernés
  (`git log -1 --format=%cI -- <fichier>`, repli sur la mtime). Si les fichiers ont
  bougé après, l'événement est **périmé** et doit être affiché comme tel.

## Format

Une section `## Socle` puis une section `## NNN-slug` par feature. Dans chaque section,
une table chronologique — **une ligne = un événement**.

```markdown
# Journal — <nom du projet>

> Trace chronologique des phases jouées. Les fichiers restent la source de vérité de
> l'état courant ; ce journal enregistre les événements et les faits non dérivables
> (verdict analyze, premortem appliqué, issue d'un lot). Une ligne = un événement.

## Socle

| Date | Phase | Résultat |
|---|---|---|
| 2026-07-25 | brief | 3 personas · 4 SC · 3 exclusions |
| 2026-07-26 | prd | 12 FR · 5 SC · 0 marqueur |
| 2026-07-26 | stack | Astro 6 + Cloudflare + D1 · 4 décisions → ADR |
| 2026-07-27 | adr | 0001..0004 · stack.md rétro-lié |
| 2026-07-27 | contract | CLAUDE.md · 6 principes · DoD 5 items |

## 001-auth

| Date | Phase | Résultat |
|---|---|---|
| 2026-07-27 | specify | 6 FR · 2 [NEEDS CLARIFICATION] |
| 2026-07-27 | clarify | 2 résolus · 0 restant |
| 2026-07-28 | plan | 7 fichiers touchés · 1 candidat ADR |
| 2026-07-28 | tasks | 4 lots · 11 tâches |
| 2026-07-28 | analyze | **PRÊT** — 0 Critical · 2 Minor |
| 2026-07-29 | premortem | 3 remédiations appliquées (FR-007 ajouté) |
| 2026-07-29 | run R1 | ✅ done · TDD · 5 tests · PR #10 |
| 2026-07-30 | run R2 | ⛔ blocked-red · branche impl/auth-R2 |
| 2026-07-30 | run R2 | ✅ done · TDD · 4 tests · PR #12 (empilée sur R1) |
```

## Règle d'ajout

1. **Créer le fichier s'il est absent**, avec le titre et le bloc de citation ci-dessus.
2. **Créer la section** `## Socle` ou `## NNN-slug` si elle n'existe pas, à la fin du
   fichier — les features apparaissent donc dans l'ordre où on les ouvre.
3. **Ajouter la ligne en fin de section**, jamais ailleurs.
4. **Ne jamais réécrire ni supprimer une ligne passée.** Un `run R2` qui échoue puis
   réussit produit **deux** lignes : l'échec fait partie de l'histoire.
5. **Une seule ligne par événement**, en `Edit` ciblé — jamais de réécriture du fichier.
6. **Date au format `YYYY-MM-DD`**, celle du jour. Ne jamais l'inventer ni la déduire :
   la prendre du contexte de session, sinon `date -I` / `Get-Date -Format yyyy-MM-dd`.
   Seule `/scd-sdd:migrate` écrit des dates passées, et uniquement depuis git
   (§ « Reconstitution »).

## Reconstitution (migration seulement)

Un projet démarré avant le journal — typiquement sous `scd-project-docs`,
`scd-feature-specs` et `scd-implement` — n'a aucune chronologie. Elle n'est pourtant pas
perdue : **git la porte**. `/scd-sdd:migrate` est la **seule** commande autorisée à
écrire des lignes antérieures à son exécution, et sous quatre conditions strictes :

1. **Le fichier doit être absent.** `docs/JOURNAL.md` présent → aucune reconstitution,
   on n'y touche pas. C'est ce qui rend l'opération rejouable sans doubler de ligne.
2. **La date vient de git, jamais d'ailleurs** :
   `git log --diff-filter=A -1 --format=%cI -- <fichier>` (date d'**ajout**), repli
   `git log -1 --format=%cI -- <fichier>`. **Hors dépôt git, ou fichier non suivi → pas
   de ligne** : pas de mtime (une copie de fichiers les réinitialise), pas de date déduite.
3. **Une ligne exige un artefact sur disque**, et son contenu chiffré est **compté sur le
   fichier** — c'est un constat, pas un souvenir :

   | Artefact | Section | Phase | Résultat |
   |---|---|---|---|
   | `docs/brief.md` | `## Socle` | `brief` | personas · SC · exclusions |
   | `docs/prd.md` | `## Socle` | `prd` | nb FR · nb SC |
   | `docs/stack.md` | `## Socle` | `stack` | choix structurants |
   | `docs/adr/NNNN-*.md` | `## Socle` | `adr` | **une seule ligne** — plage de numéros, datée du **dernier** ADR ajouté |
   | `CLAUDE.md` | `## Socle` | `contract` | nb de principes · taille de la DoD |
   | `specs/NNN-slug/` | `## NNN-slug` | `kickoff-feature` | mode — `DELTA.md` présent → delta |
   | `…/spec.md` | `## NNN-slug` | `specify` | nb FR · nb `[NEEDS CLARIFICATION]` |
   | `…/plan.md` | `## NNN-slug` | `plan` | nb fichiers touchés |
   | `…/tasks.md` | `## NNN-slug` | `tasks` | nb lots `Rn` · nb tâches `Tn` |

4. **Chaque ligne reconstituée est marquée** `· (reconstitué)` en fin de colonne
   *Résultat*, et les lignes d'une section sont triées **par date croissante**. La citation
   d'en-tête du fichier gagne alors une phrase : *« Les lignes marquées (reconstitué) ont
   été datées depuis l'historique git lors de la migration. »*

**Ce qui ne se reconstitue jamais**, quelle que soit la commande :

| Phase | Pourquoi |
|---|---|
| `clarify` | il édite `spec.md`, il n'a aucun artefact propre à dater |
| `analyze` · `premortem` | les faits non dérivables — aucune trace, ni disque ni git |
| `run` · `sync` · `reland` | les cases `[x]` de `tasks.md` disent **quels** lots sont faits, jamais **quand**, ni par quelle PR, ni combien de fois le lot a été bloqué avant |

Un journal reconstitué est donc **partiel par construction**, et c'est correct : il rend
la chronologie des artefacts, pas une histoire inventée. Les phases manquantes
apparaîtront à leur prochaine exécution.

## Vocabulaire de la colonne *Résultat*

Court, chiffré, factuel. Ce qu'on veut relire dans six mois — pas une phrase.

| Phase | Contenu attendu |
|---|---|
| `init-project` | ce qui a été scaffoldé · socle préexistant le cas échéant |
| `migrate` | anciens plugins à désinstaller · nb de lignes reconstituées · correctifs appliqués |
| `brief` | personas · critères de succès · exclusions |
| `prd` | nb FR · nb SC · marqueurs restants |
| `stack` | choix structurants · nb de décisions → ADR |
| `adr` | plage de numéros écrits · rétro-liage de `stack.md` |
| `contract` | nb de principes · taille de la DoD |
| `kickoff-feature` | dossier `NNN-slug` créé · échelle · greenfield ou delta |
| `specify` | nb FR · nb `[NEEDS CLARIFICATION]` |
| `clarify` | nb résolus · nb restants |
| `plan` | nb fichiers touchés · candidats ADR |
| `tasks` | nb lots `Rn` · nb tâches `Tn` |
| `analyze` | **verdict en gras** — nb Critical · Major · Minor |
| `premortem` | nb remédiations appliquées · les IDs créés |
| `run Rn` | `✅ done` ou `⛔ <statut>` · mode de vérif · nb tests · n° de PR |
| `sync` / `reland` | l'action effectuée · n° de PR concernée |

Statuts d'échec possibles pour `run` : `blocked-dirty-tree`, `blocked-branch`,
`blocked-rebase`, `blocked-impl`, `blocked-red`, `blocked-tests-modified`,
`blocked-verify`, `blocked-after-fix`, `blocked-branch-drift`, `blocked-upstream`.

## Qui écrit

**La commande, jamais le workflow.** L'orchestrateur d'un dynamic workflow n'a par
contrat aucune I/O — tout accès disque passe par ses agents, et le déterminisme du
resume l'exige. `/scd-sdd:run` reçoit l'objet de retour du workflow
(`{status, mode, passing, pr, …}`) et consigne depuis la session principale.

C'est ce qui permet à un run **bloqué** de laisser une trace : l'agent
`progress-recorder` ne tourne que sur le chemin de succès, il perdrait tous les
`blocked-*`.

## Conflits en mode parallèle

Deux lots d'une même feature lancés par `run-parallel` tournent dans des worktrees
isolés et écriront tous deux en fin de la même section. Le conflit git est attendu et
trivial : lignes indépendantes, on garde les deux. Ce n'est pas une classe de problème
nouvelle — `tasks.md` est déjà édité par chaque lot parallèle.

## Ce que le journal n'est pas

- **Pas un état.** On n'y lit jamais « où on en est » directement : c'est `status` qui
  croise dérivation et journal.
- **Pas un rapport.** Le rapport d'`analyze` reste en conversation ; seul son verdict,
  daté, est consigné.
- **Pas reconstructible à volonté.** Aucune commande de phase ne remplit le journal
  rétroactivement : on n'invente pas de dates. La seule exception est encadrée —
  `/scd-sdd:migrate`, sur un projet venu des trois anciens plugins, écrit les lignes
  **datées depuis git** des artefacts présents, et rien d'autre (§ « Reconstitution »).
  `status` fonctionne sans journal, et sans les lignes qui manquent.
