# scd-project-docs

Workflow de **kickoff greenfield** : produire, une fois au démarrage d'un projet, les documents de gestion de projet « génériques ». Six phases user-invoked enchaînent une **chaîne de traçabilité** :

```
Brief → PRD → Stack → ADR fondateurs → CLAUDE.md
```

Les **specs par feature** (spec/plan/tasks) sont **hors périmètre** — elles relèvent d'un workflow séparé, en aval. Ce plugin s'arrête au socle que ces specs viendront consommer.

## Philosophie

- **Greenfield = interview.** Rien n'existe à dériver du code : la qualité vient de l'élicitation « une question à la fois », pas de la génération.
- **L'humain décide le quoi ; Claude drafte et questionne.** Aucun document n'est produit par supposition.
- **Traçabilité par IDs.** `SC-xxx` (critères de succès), `FR-xxx` (exigences), `ADR-NNNN` (décisions). Ces IDs relient le socle à l'implémentation future.
- **Séparation stricte quoi / comment.** Le PRD reste technology-agnostic ; tout choix technique descend dans Stack, et chaque décision structurante devient un ADR immuable.
- **`/clear` entre chaque phase** pour garder le contexte propre.

## Commandes

| Phase | Commande | Produit | Mode |
|---|---|---|---|
| 0 | `/scd-project-docs:kickoff` | scaffold `docs/` + orientation | setup |
| 1 | `/scd-project-docs:brief` | `docs/brief.md` | interview |
| 2 | `/scd-project-docs:prd` | `docs/prd.md` | interview |
| 3 | `/scd-project-docs:stack` | `docs/stack.md` | options justifiées |
| 4 | `/scd-project-docs:adr` | `docs/adr/NNNN-*.md` | dérivé de Stack |
| 5 | `/scd-project-docs:contract` | `CLAUDE.md` | assemblage |

## Skill

- `project-docs` — connaissance transverse (chaîne de traçabilité, méthode d'interview, règles d'écriture pour un agent, seuils de déclenchement) + les cinq templates copy-paste en `references/` (chargés un par phase, en disclosure progressive) :
  - `references/brief.md`, `references/prd.md`, `references/stack.md`, `references/adr.md`, `references/claude-md.md`

## Utilisation

```
/plugin install scd-project-docs@sebc-dev-marketplace
```

Puis, au démarrage d'un projet :

```
/scd-project-docs:kickoff mon-idee-de-projet
# /clear entre chaque phase
/scd-project-docs:brief
/scd-project-docs:prd
/scd-project-docs:stack
/scd-project-docs:adr
/scd-project-docs:contract
```

## Portée & suites

Ce kickoff crée le socle documentaire. Étapes recommandées **après** (hors de ce plugin) :

1. Transformer les garanties dures (tests/lint bloquants, immutabilité des ADR) en **hooks déterministes** — CLAUDE.md est advisory, pas exécutif.
2. Démarrer le **workflow specs** par feature (spec → plan → tasks).
