# Le schéma scd — artefacts, optionnalité, tickets

Charge ce bloc pour le détail du schéma custom `scd`. Le **plugin porte la recette**
(`openspec-schema/scd/schema.yaml` + templates) ; `/scd-spec-dev:setup` la **copie** dans
`<projet>/openspec/schemas/scd/`. Le plugin porte la recette, le projet porte l'instance. Éprouvé
contre **OpenSpec 1.12.0 réel** (L2).

## Les artefacts

| id | generates | requires | rôle |
|---|---|---|---|
| `proposal` | `proposal.md` | `[]` | pourquoi / quoi ; capacités touchées ; backréf EPIC/STORY (roadmap) et FR (vision) |
| `specs` | `specs/**/*.md` | `[proposal]` | deltas ADDED/MODIFIED/REMOVED, scénarios `#### Scenario:` WHEN/THEN — **la source des critères** |
| `design` | `design.md` | `[proposal]` | approche technique, **jetable** ; cite les ADR contraignants ; **≠ ADR** |
| `test-plan` | `test-plan.md` | `[design]` | **optionnel** : stratégie de test du change |
| `security-review` | `security-review.md` | `[design]` | **optionnel** : revue sécu du change |
| `ux` | `ux.md` | `[proposal]` | **optionnel** : parcours/écrans/états + lien canvas ; « Pas d'impact UI » sinon |

## L'optionnalité — par la clôture de `apply.requires`, pas un champ

OpenSpec **n'a pas de champ `optional`**. Le seul levier est **`apply.requires`**, dont la **clôture
transitive** définit les artefacts REQUIS ; tout artefact hors clôture (`test-plan`, `security-review`,
`ux`) est générable mais **ne bloque pas**.

**`apply.requires` doit être `[specs, design]`** — pas seulement `[design]`. Raison prouvée en L2 :
`design` ne requiert que `proposal`, donc avec `[design]` seul, **`specs` tomberait hors clôture et
deviendrait optionnel** — ce qu'on ne veut surtout pas (`specs` est la source des critères).
`openspec status` le confirme : avec `[specs, design]`, un change sans specs est bien « Blocked by:
specs, design ».

Faits zod (OpenSpec 1.12.0) : le champ `description` d'un artefact est **obligatoire** (`z.string()`) ;
`generates` accepte un **glob relatif** (`"specs/**/*.md"`) ; `apply.tracks` est **nullable** — ici
`null`, car il n'y a **aucun `tasks.md`** (les tickets ne sont pas un artefact de schéma).

## Les tickets ne sont PAS un artefact de schéma

Ils sont produits par la **commande** `/scd-spec-dev:tickets` (skill `change-decomposer` +
`strategie-verif`, granularité arbitrée par l'humain), dans `changes/<x>/tickets/NN-slug.md`. Ce
sous-dossier est **toléré** : `openspec validate <change> --strict` passe. La raison d'en faire une
commande et non un `/opsx:ff` générique : la décomposition doit **invoquer `strategie-verif` par
ticket** et **arbitrer la granularité** — deux choses qu'une boucle de schéma ne fait pas proprement
(cf. skill `change-decomposer`).

## Le bloc `apply` — la frontière écrite dans le schéma

`apply.instruction` dit noir sur blanc : **ne pas implémenter le change inline**, déléguer à
`/scd-spec-dev:tickets` puis `/scd-spec-dev:run`, **jamais `/opsx:apply`**. La frontière n'est pas
seulement une convention du plugin — elle est inscrite dans la recette de schéma que `/setup` copie
dans le projet.

## Pièges de format des specs (rejets silencieux)

- Un scénario utilise **exactement 4 dièses** (`#### Scenario:`) — 3 dièses ou une puce **échouent
  silencieusement**.
- Une nouvelle capacité commence par `## Purpose` de **50+ caractères** (sinon `validate --strict` la
  juge trop brève) ; **ne pas** ajouter `## Purpose` au delta d'une capacité **existante**.
- Un `MODIFIED` doit inclure le **bloc complet** mis à jour (en-tête exact) — un MODIFIED partiel perd
  du détail à l'archivage ; pour ajouter sans changer, utiliser `ADDED`.
- Un change **zéro-delta** est rejeté sauf `skip_specs: true` dans son `.openspec.yaml` (refacto pur,
  outillage, docs) — ne jamais inventer une exigence pour satisfaire le validateur.
