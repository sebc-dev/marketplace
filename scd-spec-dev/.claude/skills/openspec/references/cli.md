# Le CLI OpenSpec, l'install & l'idempotence par artefact

Charge ce bloc pour l'install (ce que `/scd-spec-dev:setup` fait et ne fait pas) et la mécanique du
CLI. Faits établis par recherche sur sources primaires `Fission-AI/OpenSpec` (2026-09).

## Le CLI

`openspec` est déterministe : `init`, `update`, `list`, `diff`, `validate` (`--strict`), `show`,
`archive`, `config profile`, `schema fork/validate`, `status`, `templates`, `instructions`. Le paquet
npm est **`@fission-ai/openspec`** (le `openspec` nu sur npm est un placeholder 0.0.0) ; le binaire
s'appelle **`openspec`** ; `latest` = **1.12.0** ; branche `main`.

## Install — détecter et guider, jamais installer soi-même

`/setup` vérifie `openspec --version`. **Présent** → il continue. **Absent** → il **s'arrête** et
affiche la commande exacte (`npm i -g @fission-ai/openspec@latest`, via `!`), puis à relancer `/setup`.
Agnostique au langage : **aucune** `devDependency` imposée, aucune action machine silencieuse.

**Pourquoi exiger `openspec` sur le PATH, et pas un repli `npx`** (fait vérifié, non préférence) : les
`/opsx:*` posés par `openspec init` appellent **`openspec` nu** — leur `allowed-tools` est **scellé**
sur `Bash(openspec:*)` et les gabarits de workflow invoquent tous `openspec …` **sans** `npx`. Sans
`openspec` sur le PATH, les `.md` sont bien scaffoldés mais **toutes** les `/opsx:*` échouent à
l'exécution. Le message de guidage doit **anticiper les pièges PATH** : bin global absent du PATH, shims
nvm/fnm/asdf/volta.

## Ce que `--tools claude` installe

`openspec init --tools claude` (pas `none`, absent de la liste ; et on veut les `/opsx:*`) pose, en
delivery **`both`** par défaut :

- les commandes `.claude/commands/opsx/*.md`, **et**
- les **skills** `.claude/skills/openspec-*/SKILL.md` — profil `core` : `openspec-propose`,
  `openspec-explore`, `openspec-apply-change`, `openspec-update-change`, `openspec-sync-specs`,
  `openspec-archive-change`.

**Il n'y a pas de flag skills/commands** : c'est le **delivery mode** (`both`/`skills`/`commands`,
réglé par `openspec config profile`) qui décide — un profil `commands` seul **omettrait les skills**.
Donc `/setup` **vérifie** `.claude/skills/openspec-*` après `init`/`update` et, absents, guide vers
`openspec config profile` (delivery `both`). Il ne les écrit **jamais** : OpenSpec les possède et les
versionne, et `update` préserve un skill édité. Profils à jour : `core`/`custom` (le `expanded` du
blueprint est périmé).

## Idempotence par artefact — `/setup` rejouable, chaque artefact a son propriétaire

| Artefact | Propriétaire | Règle au re-jeu |
|---|---|---|
| Scaffold OpenSpec + **données** (`changes/`, `specs/`) | OpenSpec / le projet | **jamais** re-`init` (destructif) ; au re-jeu → `openspec update` (re-sync commandes/skills + montée CLI) ; santé vérifiée (`openspec list`) |
| Schéma `scd` (`openspec/schemas/scd/`) | **le plugin** (la recette) | **rafraîchi** (réécrit depuis la recette portée) |
| `config.yaml` (`context:` / `rules:`) | mixte (l'humain ajuste) | **révisé par blocs balisés**, édits humains préservés |
| Filet CI (job grep) | le plugin | **bloc balisé** géré, le reste du fichier préservé |
| Gabarits durables (vision, roadmap, architecture, adr/0001) | l'humain | écrits **seulement si absents** |

**Ne jamais re-`init`** : `init --tools` supprime les reliquats d'anciennes versions — c'est destructif
sur un projet qui a déjà des données. Le re-jeu passe par `openspec update`.

## `config.yaml` — l'injection de contexte durable

`/setup` pose `schema: scd` et un bloc `context:`/`rules:` **balisé**, tiré de `CLAUDE.md` +
`docs/ci.md` + les docs durables (vision, roadmap, caps). C'est ce `context` qui est injecté dans les
prompts OpenSpec — la couche durable qui tient le cap là où OpenSpec, seul, s'arrête au présent. La
règle **une seule source de vérité par fait** tient : le `context` résume et **pointe**, il ne recopie
pas les ADR ni les caps.
