---
name: openspec
description: |
  La FONDATION OpenSpec sur laquelle ce plugin est bâti, et la FRONTIÈRE que le plugin ne franchit
  pas. Porte : pourquoi OpenSpec (fort sur la couche doc→tickets — specs vivantes, modèle delta
  ADDED/MODIFIED/REMOVED, CLI déterministe, injection de contexte par config.yaml — absent sur la
  couche d'implémentation, où le plugin met sa valeur) ; les CINQ temps (cadrage durable → change →
  tickets → run → archive) ; les TROIS natures de document (durable / par change / immuable) et leur
  règle de tri ; le schéma custom scd (proposal → specs → design, + test-plan/security-review/ux
  optionnels) ; la dérivation de l'état des changes depuis openspec list ; et la règle cardinale — on
  n'appelle JAMAIS /opsx:apply, /scd-spec-dev:run prend le relais sur les tickets. Se charge pendant
  /scd-spec-dev:setup, tickets, run et status. Deux références chargées à la demande :
  references/schema.md (le schéma scd, la clôture d'optionnalité), references/cli.md (le CLI, l'install
  et l'idempotence par artefact). Porte UNIQUEMENT la fondation : ni le découpage d'un change en
  tickets (skill change-decomposer), ni le niveau implémentation d'un ticket (skill implement), ni la
  review (skill review).
---

# OpenSpec — la fondation, et la frontière

Ce plugin est bâti **sur** OpenSpec, sans en être un fork : il l'installe dans le projet cible et lui
ajoute la couche qu'OpenSpec n'a pas.

## Pourquoi OpenSpec, et où il s'arrête

OpenSpec est fort **exactement là où un cycle spec-driven fait de documents statiques est fragile**, et
absent **exactement là où la valeur se joue** :

- **Il porte la couche doc→tickets** : un socle en **specs vivantes** (`openspec/specs/`, source de
  vérité), un modèle **delta** (ADDED/MODIFIED/REMOVED) qui fusionne à l'archivage, un **CLI
  déterministe** (`init`, `list`, `diff`, `validate`, `show`, `archive`, `schema …`), et l'injection de
  contexte durable par `config.yaml`.
- **Il est absent sur la couche d'implémentation** : pas de `run` par ticket, pas de workflow de
  subagents, pas de review. **C'est là que ce plugin met toute sa valeur.**

La personnalisation d'OpenSpec **s'arrête à la génération des artefacts** : son schéma déclaratif
couvre `proposal → specs → design → …`, et son bloc `apply` n'est qu'une boucle générique — pas de
commandes custom, pas d'étapes de workflow au-delà des artefacts. Donc le workflow d'implémentation
**ne peut pas vivre dans un schéma OpenSpec** — il vit dans ce plugin.

## La règle cardinale — jamais `/opsx:apply`

`/opsx:apply` et `/scd-spec-dev:run` sont tous deux de simples slash-commands sur des fichiers. **On
n'appelle jamais `/opsx:apply`** : on branche `/scd-spec-dev:run` sur les **tickets** que la
décomposition produit (skill `change-decomposer`). Le bloc `apply` du schéma scd le dit lui-même — son
`instruction:` délègue à `/scd-spec-dev:tickets` puis `/scd-spec-dev:run`, et interdit d'implémenter
inline.

## Les cinq temps

1. **Cadrage durable** — vision, roadmap, caps (architecture, test, sécurité, design-system), ADR.
   Tient le cap, injecté partout via le `context:` de `config.yaml`.
2. **Change** — une **story** de la roadmap ouvre un change OpenSpec (proposal / design / deltas ;
   test-plan, security-review, ux optionnels). **1er geste humain : relire.**
3. **Tickets** — `/scd-spec-dev:tickets` décompose le change en tranches verticales ; `strategie-verif`
   tranche le mode de chaque ticket. **2e geste humain : arbitrer la granularité.**
4. **Implémentation** — `/scd-spec-dev:run` passe chaque ticket par le cycle (une PR chacun).
5. **Archive** — les PR mergées → `openspec archive` fusionne les deltas dans `openspec/specs/`, qui
   **reboucle** sur la roadmap : la spec livrée devient la vérité courante et repriorise Next/Later.

## Trois natures de document — la règle de tri

| Nature | Sens | Où |
|---|---|---|
| **Durable** | vrai pour tout le projet, révisé rarement ; contexte de tous les changes | `docs/`, pointés par `config.yaml` |
| **Par change** | décidé pour *ce* travail, généré puis figé à l'archivage | `openspec/changes/<x>/` |
| **Immuable** | écrit une fois, jamais réécrit, s'accumule | `docs/adr/` |

Règle : **cadrage du projet → durable** ; **décision de ce change → artefact** (fusionné à
l'archivage) ; **décision structurante qu'on relira dans six mois → ADR immuable**. Une seule source de
vérité par fait : le `context` de `config.yaml` résume et pointe, les ADR tranchent, `design.md` est
**jetable** (jamais promu en ADR).

## Le schéma scd — l'essentiel (détail : references/schema.md)

Fork de `spec-driven`. Le **plugin porte la recette** (`openspec-schema/scd/`), `/setup` la **copie**
dans `<projet>/openspec/schemas/scd/`. Artefacts : `proposal` → `specs` (la source des critères,
scénarios `#### Scenario:` WHEN/THEN) et `design` (technique, jetable, cite les ADR), plus `test-plan`,
`security-review`, `ux` **optionnels**. L'optionnalité n'est **pas un champ** : elle se lit dans la
clôture transitive de `apply.requires`, qui **doit être `[specs, design]`** (cf. references/schema.md).
**Les tickets ne sont PAS un artefact de schéma** — ils sortent de la commande
`/scd-spec-dev:tickets`, dans `changes/<x>/tickets/` (sous-dossier toléré par `validate --strict`).

## Dériver l'état, ne pas le maintenir

Il n'y a **aucun fichier d'état, aucun journal**. `openspec list` dit l'état OpenSpec de chaque change ;
les fichiers `tickets/` disent le découpage ; la forge dit l'état des PR ; les fiches de
`docs/chantiers/` disent ce qu'un `/clear` a interrompu. Une session qui chercherait un fichier d'état
chercherait un fichier qui n'existe pas. C'est aligné sur OpenSpec, **0-gate par conception**, et sur
ce plugin, **0-hook de session** : le seul garde-fou automatique est le filet CI, hors boucle de dev.
