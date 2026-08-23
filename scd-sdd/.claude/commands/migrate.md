---
description: "Reprend un projet suivi par scd-sdd 1.x et le convertit vers 2.0.0, qui est CASSANT : docs/produit.md et docs/technique.md deviennent des candidats ADR et des sections de CLAUDE.md, chaque specs/NNN/{spec,plan,tasks}.md devient un SPEC.md court plus des tickets, docs/journal/ est ARCHIVÉ et jamais supprimé, les chantiers sont conservés tels quels, et les gardes de session sont posés. Diagnostique d'abord, propose ensuite, n'applique qu'après accord — et ne touche JAMAIS docs/adr/. À jouer une fois par projet."
argument-hint: "(aucun — diagnostique le projet courant)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
  - Bash(git status *)
  - Bash(git log *)
  - Bash(git mv *)
  - Bash(mkdir -p *)
  - Bash(date -I)
---

## Contexte

`scd-sdd` **2.0.0** remplace le cycle `1.x`, et le remplacement est **cassant sur tous les axes** :
onze commandes ont disparu, les artefacts ont changé de nom et de forme, la notation EARS est
abandonnée, le journal est retiré (`DECISIONS.md` §D41). Un projet suivi en `1.x` que l'on ouvrirait
avec `2.0.0` sans conversion se retrouverait avec **deux vocabulaires concurrents** dans le même
dépôt — et c'est le seul état que cette commande existe pour empêcher.

Tu **diagnostiques d'abord, tu proposes ensuite, tu n'appliques qu'après accord**. Une conversion
touche des documents que l'humain a écrits et relus : elle ne se joue pas en silence.

Ratio : 40% humain / 60% AI (tu constates et tu convertis ; l'humain arbitre chaque conversion).

## Règles absolues

- **Tu ne touches JAMAIS `docs/adr/`.** Les ADR sont immuables et traversent la migration
  **inchangés** — c'est le seul artefact du socle `1.x` que `2.0.0` reprend tel quel. Un hook du
  plugin te bloquerait de toute façon ; la règle existe avant lui.
- **Tu ne supprimes jamais `docs/journal/`.** Il porte des faits que **rien ne reconstitue** —
  verdicts de gate, premortems appliqués, issues de lots. Tu le **renommes** en
  `docs/journal-1.x/`, et tu le dis.
- **Aucune conversion en silence.** Chaque document converti est **annoncé avec ce qu'il devient**,
  et l'humain tranche. « Convertir tout » est une réponse valide, mais c'est **sa** réponse.
- **Tu ne devines aucun contenu.** Ce qu'un document `1.x` ne dit pas ne s'invente pas à la
  conversion : ça devient un `[à compléter]` **signalé**.
- **Arbre propre exigé.** `git status --porcelain` non vide → STOP. Une conversion qui se mélange à
  du travail en cours est irrelisable, et donc irréversible en pratique.
- **Tu es le seul fichier du plugin qui a le droit de nommer le vocabulaire `1.x`** — `brief`,
  `prd`, `stack`, `archi`, `contract`, `analyze`, `premortem`, `audit`, `lot Rn`, `SHALL`,
  `FR-xxx`, `tasks.md`. Tu le nommes **comme hérité**, jamais comme courant.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — ticket,
  tranche verticale, garde, candidat ADR… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain emploie
  le terme lui-même**.
- **Un ID se cite avec son intitulé** — « FR-003 (export CSV) », jamais « FR-003 » nu. La règle
  vaut pour **tout** identifiant, y compris ceux hérités du projet.
- **Tu parles la langue de l'humain.**

## Définitions

- **`1.x`** — le cycle précédent : socle en 4 phases pour 5 documents, specs en 5 commandes avec
  deux gates, journal, lots `Rn`, notation EARS.
- **Candidat ADR** — un brouillon dans `docs/adr/_candidates/`, que `/scd-sdd:adr` promeut en ADR
  définitif. C'est la seule voie, et elle est à sens unique.

## Processus

1. **Charge les skills `socle` et `specs`** (voir `## Skill active`). Communique en français.

2. **Diagnostique, sans rien écrire.** Relève sur le disque :

   | Trace | Ce qu'elle devient |
   |---|---|
   | `docs/produit.md` | candidats ADR + le glossaire et la Vue d'ensemble de `CLAUDE.md` |
   | `docs/technique.md` | candidats ADR (choix retenus **et** invariants) |
   | `docs/brief.md`, `prd.md`, `stack.md`, `archi.md` | projet d'**avant** la fusion `1.19.0` — même traitement, en amont |
   | `docs/adr/` | **inchangé** |
   | `docs/ci.md` | **conservé** ; `/scd-sdd:guards` y ajoutera sa section |
   | `CLAUDE.md` | **révisé**, jamais ré-assemblé — pointeurs morts, section Commandes |
   | `docs/journal/` | renommé `docs/journal-1.x/` |
   | `specs/NNN-*/{spec,plan,tasks}.md` | un `SPEC.md` + des tickets `NN-*.md` |
   | `specs/NNN-*/acceptance/*.feature` | **conservés** — ce sont des tests, pas de la doc |
   | `docs/chantiers/` | **inchangé**, sauf les `Portée` au vocabulaire mort |
   | `.claude/guards.json` | absent → à poser |

   Relève aussi les **pointeurs périmés** : toute occurrence de `/scd-sdd:{brief,prd,stack,archi,
   produit,technique,contract,livraison,specify,clarify,plan,tasks,analyze,audit,premortem,
   kickoff-feature,init-project,revise-contract,status-specs,status-impl}` dans `CLAUDE.md`, les
   `README`, les workflows.

3. **Rends le diagnostic et attends.** Une ligne par document, avec ce qu'il devient. **Rien n'est
   écrit à ce stade.** Si le projet n'a aucune trace `1.x`, dis-le et arrête-toi : il n'y a rien à
   migrer, et fabriquer une conversion pour justifier la commande est le défaut à éviter.

4. **Le socle.** Pour chaque décision structurante de `docs/produit.md` et `docs/technique.md`
   — les choix retenus, la table des invariants —, écris un **candidat** dans
   `docs/adr/_candidates/`, au format du `<template>` de `socle/references/adr.md`. Renseigne
   `Vérifiable ?` quand la décision laisse une trace observable.
   ⚠️ **Un candidat n'est pas un ADR.** C'est `/scd-sdd:adr` qui les promeut, un par un, avec
   l'humain — et c'est ce qui empêche cette commande de figer quarante décisions d'un coup.

   Le **glossaire du domaine** se compose depuis le vocabulaire réellement employé dans
   `docs/produit.md` et les specs, et se fait **valider** : c'est le seul contenu neuf de la
   migration.

5. **`CLAUDE.md` — révision, jamais ré-assemblage.** Charge `<guidance>` et `<revision>` de
   `socle/references/claude-md.md`, **pas le `<template>`**. Une ligne que le template ne prévoit
   pas est **présumée légitime**. Ce qui se corrige ici : les pointeurs morts
   (`@docs/produit.md`, `@docs/technique.md`, `docs/journal/`) et la section Commandes contre
   `docs/ci.md`. Ce qui s'ajoute : le glossaire de l'étape 4.

6. **Les features, une par une.** Pour chaque `specs/NNN-slug/` :
   - `SPEC.md` se compose depuis `spec.md` (le problème, les FR) et `plan.md` (l'approche, les
     contrats, les coutures de test) — **~40 lignes**, sur le `<template>` de
     `specs/references/spec.md`. Le `## NON inclus` de `spec.md` devient le `## Hors-périmètre`.
   - Chaque **lot `Rn`** de `tasks.md` devient un **ticket** `NN-slug.md` : `dépend de :` →
     `**Bloqué par :**`, `Fichiers :` → `**Fichiers :**`, le titre du lot → `## Ce que ça livre`,
     et **chaque critère EARS des FR livrés** → une case de `## Critères`, **traduite en français
     observable**. Une case déjà cochée dans `tasks.md` reste cochée.
   - `_vérif :_` se traduit : `TDD` et `test-after` → **`test`** ; `check` et `inhérent` →
     **`observé`**, en gardant la justification.
   - ⚠️ **Les backrefs `_(PRD: FR-0xx)_` ne se renomment pas et ne se suppriment pas** : `PRD` y
     est un nom de **notation**, pas un nom de fichier. Ils partent avec les documents qui les
     portaient, et ce qui les remplace est le lien de traçabilité vers le candidat ADR.
   - Une feature **entièrement faite** (tous les lots cochés) se convertit quand même : son
     `SPEC.md` reste la mémoire du *pourquoi*.

7. **Le journal.** `git mv docs/journal docs/journal-1.x`, et **dis ce qu'il portait** : les
   verdicts de gate, les premortems appliqués, les issues de lots. Rien de tout cela n'existe dans
   `2.0.0` ; le fichier reste la seule mémoire de ce qui s'est passé avant.

8. **Les chantiers.** Répertoires et fiches **inchangés**. Une seule édition : les lignes `Portée`
   au vocabulaire mort — `· gate`, `socle · audit`, `· lot Rn` → `· ticket NN` ou `hors-cycle`
   selon ce que la fiche dit vraiment. Une fiche de gate ou d'audit ouverte n'a plus de commande
   pour la fermer : **signale-la** et propose de la passer en `archive/`.

9. **Les gardes.** Appelle `/scd-sdd:guards`. C'est ce que la migration **ajoute** plutôt qu'elle ne
   convertit, et le dire ainsi évite de la présenter comme une pure perte.

10. **Rends le point de reprise** — une prochaine commande, et une seule.

## Ce que tu NE fais PAS

- Tu **n'écris aucun ADR définitif** — que des candidats dans `_candidates/`.
- Tu **ne supprimes aucun fichier**. `docs/produit.md`, `docs/technique.md`,
  `specs/*/{spec,plan,tasks}.md` : tu **proposes** leur retrait à l'humain, une fois la conversion
  relue, et tu ne le fais pas toi-même. Un document converti à tort et supprimé est perdu.
- Tu **ne ré-assembles jamais `CLAUDE.md`**.
- Tu **ne joues aucune commande du cycle** — ni `/scd-sdd:spec`, ni `/scd-sdd:tickets`, ni
  `/scd-sdd:adr`. Tu prépares leur matière.
- Tu **n'écris aucun code**, n'exécutes aucun test, ne commites rien.
- Tu **ne désinstalles rien** : si un ancien plugin (`scd-project-docs`, `scd-feature-specs`,
  `scd-implement`) est encore installé, **rends la commande** et laisse l'humain la jouer.

<report>

```
## Migration 1.x → 2.0.0 — [diagnostic | appliquée]

### Le socle
| Document | Devient | État |
|---|---|---|
| docs/produit.md | [N] candidats ADR + glossaire | … |
| docs/technique.md | [N] candidats ADR | … |
| docs/adr/ ([N] ADR) | INCHANGÉ | — |
| docs/journal/ | docs/journal-1.x/ (archivé) | … |

### Les features
| Feature | SPEC.md | Tickets | Faits |
|---|---|---|---|
| 001-auth | 38 l. | 5 | 3 |

### Ce qui reste à faire à la main
[une ligne par geste que tu n'as pas l'outil de faire — promotion des candidats,
 retrait des anciens documents, désinstallation d'un ancien plugin]

### Ce que je n'ai pas pu convertir
[une ligne par trou, avec ce qu'il faudra écrire — ou « rien »]
```

</report>

## Skill active

- Skill `socle` — `references/adr.md` (le `<template>` des candidats) et
  `references/claude-md.md` (**`<guidance>` et `<revision>` seuls**, jamais le `<template>`).
- Skill `specs` — `references/spec.md` et `references/tickets.md`, pour les formes cibles.
- Skill `chantier` — le `SKILL.md` seul : tu lis des en-têtes de fiches, tu n'en écris aucune.

## À la fin

- Conversion appliquée → *« Le projet est en `2.0.0`. Prochaine étape : `/scd-sdd:adr` pour
  promouvoir les [N] candidats — c'est le seul endroit où une décision héritée redevient
  opposable. »*
- Diagnostic seul → *« Rien n'a été écrit. Relance `/scd-sdd:migrate` quand tu veux appliquer. »*
- Des fiches de gate ou d'audit sont restées ouvertes → **dis-le séparément** : elles n'ont plus de
  commande pour les fermer.
