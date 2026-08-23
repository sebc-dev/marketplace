---
name: specs
description: |
  Le NIVEAU FEATURE : une spec courte, puis des tickets en tranches verticales. `SPEC.md`
  (~40 lignes) porte le problème, la solution, les décisions d'implémentation et de test,
  le hors-périmètre ; chaque ticket `NN-slug.md` livre un comportement bout en bout, déclare
  ce qui le bloque et ses critères observables. Porte la règle de résolution « quelle feature
  est en cours » après un /clear, la dérivation de l'état depuis les fichiers, et les critères
  de découpage vertical. Se charge pendant /scd-sdd:spec, tickets, run, run-parallel, status
  et linear. Aucune gate, aucun verdict, aucune notation normée : la validation tient en deux
  gestes humains — relire la spec, arbitrer la granularité des tickets. Porte UNIQUEMENT le
  niveau feature — ni le socle (skill socle), ni l'exécution d'un ticket (skill implement),
  ni le travail hors cycle (skill chantier).
---

# Une spec courte, des tickets verticaux

Deux artefacts par feature, et c'est tout.

```
specs/NNN-slug/
├── SPEC.md        ~40 lignes, écrite une fois, relue par l'humain
├── 01-slug.md     un ticket = une tranche verticale
├── 02-slug.md
└── …
```

**Ce qui a disparu, et pourquoi ce n'est pas un manque.** Le cycle `1.x` demandait
`spec → clarify → plan → tasks → analyze` — cinq commandes, deux gates bloquantes, seize contrôles,
un verdict à trois niveaux, une notation normée. Il coûtait à l'écriture, à la relecture et à la
convergence, et **ce qu'il attrapait était du texte** : les défauts qui coûtent vraiment sont des
défauts de comportement de l'agent au moment d'écrire du code (`DECISIONS.md` §D41). Ce budget de
rigueur est parti dans les **gardes de session**.

## La validation, ce sont deux gestes humains

1. **Relire la `SPEC.md`.** Quarante lignes, une fois. Si elle est fausse, ça se voit à la lecture.
2. **Arbitrer la granularité des tickets.** `/scd-sdd:tickets` présente son découpage et **demande** :
   trop gros, trop fin, les dépendances sont-elles justes ? Il itère jusqu'à l'accord.

Il n'y a pas de troisième geste. Pas de gate, pas de verdict, pas de fiche de corrections.

## Cibler une feature (résolution)

`/clear` efface le contexte : une commande ne peut pas *supposer* sa cible. **Règle de résolution,
identique partout** :

1. Un **argument** est fourni (`003`, `auth`, `003-auth`, ou un chemin) → c'est la cible. Match sur
   le préfixe `NNN` **ou** sur le slug.
2. Sinon, **une seule** candidate pour cette étape (table ci-dessous) → la prendre et **l'annoncer**.
3. Sinon (0 ou ≥ 2 candidates) → **ne devine jamais** : liste les candidates avec leur état et
   demande via `AskUserQuestion` (ou renvoie vers `/scd-sdd:status`).

**Dérivation de l'état depuis les fichiers** — aucun fichier d'état à maintenir, rien qui dérive.

| État sur disque | Où en est la feature | Commande suivante |
|---|---|---|
| `specs/NNN-slug/` absent | à cadrer | `spec` |
| `SPEC.md` seul | à découper | `tickets` |
| tickets présents, critères non tous cochés | en implémentation | `run` |
| tous les critères de tous les tickets cochés | terminée | — |

Les `NNN` sont **stables et jamais réattribués** (`max(NNN) + 1`). Un ticket est **fait** quand
tous ses critères sont cochés : rien d'autre ne l'atteste, et rien d'autre n'a besoin de l'attester.

**Cette table est la source de vérité unique du plugin.** `/scd-sdd:status`, `run`, `run-parallel`
et `linear` la **référencent** ; ils ne la recopient jamais.

## Le ticket est l'unité, et il est vertical

Un ticket livre **un comportement bout en bout** — il traverse les couches. Un ticket horizontal
(« créer la table », puis « créer l'API », puis « créer l'UI ») est rejeté : sa correction ne se
juge qu'en assemblage, donc il n'est reviewable par personne, et il ne livre rien.

Les critères de dimensionnement, les patterns de scission et leurs pièges vivent dans
`references/tickets.md`. ⚠️ **C'est le domicile des seuils chiffrés** : ni ce fichier, ni les
commandes ne les recopient.

**L'exception qui casserait le découpage si on l'oubliait — le refactor large.** Un changement
mécanique dont le rayon d'action traverse tout le dépôt (renommer une colonne, retyper un symbole
partagé) ne rentre dans aucune tranche verticale : une seule édition casse des milliers d'appels et
rien ne peut rester vert. Il se séquence en **expand–contract**, et `references/tickets.md` en porte
la recette.

## Ce qui monte au socle

Une décision structurante rencontrée en écrivant une spec ou en découpant des tickets **ne se
tranche pas ici** : elle part en brouillon dans `docs/adr/_candidates/`, et c'est `/scd-sdd:adr` qui
la promeut. C'est la seule voie, et elle est à sens unique.

## Frontière négative

Ce skill ne porte **ni** le socle (skill `socle`), **ni** l'écriture ou la vérification du code
(skill `implement`), **ni** le travail hors cycle (skill `chantier`). Un défaut de la spec révélé à
l'implémentation se **signale** pour un retour ici ; il ne se corrige pas depuis l'aval.
