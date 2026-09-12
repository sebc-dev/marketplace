---
name: architecture
description: |
  Le CONTRAT d'architecture du cycle : où vit le modèle LikeC4 du projet (docs/architecture/, un seul
  projet LikeC4, --project toujours passé), la clé `sourceDir` comme SEUL pont code ↔ modèle exploité
  par les agents, le format de la table des invariants opposables de docs/architecture.md et sa
  question d'admission, le tri ADR (pourquoi) / modèle (quoi, maintenant) / design (comment, cette
  fois), et le serveur MCP `likec4` déclaré par le projet. Se charge pendant /scd-spec-dev:setup (qui
  pose le squelette), /scd-spec-dev:archi et /scd-spec-dev:adr, et par les agents review-context,
  architecture-reviewer et change-reviewer (câblés sur le MCP), et pr-describer (la couche « Impact
  architecture » de la PR : éléments touchés, vue Mermaid, relations, likec4 validate).
  Deux références chargées à la demande :
  references/invariants.md (la table, les 11 classes admises, la question d'admission),
  references/modele.md (les conventions .c4 du plugin : kinds, sourceDir, vues, le squelette posé par
  setup). Porte UNIQUEMENT le contrat : la SYNTAXE du DSL et les drapeaux du CLI sont dans le skill
  `likec4-dsl` (l'officiel, vendorisé), la review et ses seuils de blocage dans le skill `review`, la
  fondation OpenSpec dans le skill `openspec`.
---

# L'architecture — le modèle comme référent, pas comme prose

**Le constat qui commande tout : l'architecture n'entre plus dans le cycle par de la prose que
personne ne peut vérifier.** Un modèle LikeC4 versionné en git est validé avec un **code de sortie**,
exporté en **JSON typé**, et interrogeable par un **serveur MCP** en lecture seule. Les agents de
review lisent le modèle ; ils ne paraphrasent plus un fichier de puces.

## Les trois natures — la règle de tri

| Artefact | Nature | Ce qu'il porte |
|---|---|---|
| `docs/adr/NNNN-*.md` | **immuable** | le **pourquoi** de la décision ; un ADR accepté ne se réécrit pas, il se supersède |
| `docs/architecture/*.c4` | **durable** | le **quoi, maintenant** : la structure — éléments, relations, vues |
| `docs/architecture.md` | **durable** | les **invariants opposables**, qui nomment des éléments du modèle |
| `openspec/changes/<x>/design.md` | **par change, jetable** | le **comment, cette fois** ; cite les FQN touchés |

Une relation **nouvelle** s'écrit dans le `.c4` **dans le change qui l'introduit**, pas après coup :
le modèle et le code arrivent dans la même PR, ou le modèle ment.

## Où vit le modèle

`docs/architecture/` — **un seul projet LikeC4 par dépôt**, déclaré par `likec4.config.json` dont le
`name` est le nom du dépôt. Ce `name` se passe **toujours** en `--project` : sans lui, `likec4 export
json` peut renvoyer un **tableau** dès qu'un projet implicite apparaît, et le consommateur casse.

```
likec4 validate --no-layout --json --project <name> docs/architecture   # code 1 si invalide
likec4 export json --skip-layout --project <name> -o <fichier> docs/architecture
```

`export json` **écrit un fichier** (`likec4.json` par défaut) : il n'imprime rien sur stdout. Toujours
passer `-o`, jamais lire un tube.

## `sourceDir` — la seule clé code ↔ modèle

Chaque élément qui correspond à du code porte `metadata { sourceDir '<chemin>' }`, un chemin ou un
tableau de chemins relatifs à la racine du dépôt.

```likec4
model {
  shop = system 'Shop' {
    api = container 'API' {
      technology 'Node.js'
      metadata { sourceDir 'src/api' }
    }
    ui = container 'Web UI' {
      technology 'React'
      metadata {
        sourceDir ['src/ui', 'packages/design-system']
      }
    }
    ui -[sync]-> api 'appelle'
  }
}
```

**Rattachement d'un fichier du diff** : l'élément dont le `sourceDir` est le **préfixe le plus long**
du chemin du fichier. `src/api/auth/token.ts` va à `shop.api` (`src/api`) même si `shop` porte `src`.

**Un élément sans `sourceDir` est un élément de contexte** — un acteur, un système externe, un
regroupement : il n'est **jamais** confronté au code. Un fichier qu'aucun `sourceDir` ne couvre est
`unmapped` : il est signalé, il ne produit aucun finding.

`link` reste **libre pour l'humain** (dépôt, point d'entrée, doc) : aucun agent ne s'en sert pour
rattacher du code.

## La table des invariants — détail : `references/invariants.md`

`docs/architecture.md` porte une table, pas des puces :

```markdown
| Id | Règle | Éléments (FQN) | Classe | ADR |
|---|---|---|---|---|
| INV1 | `shop.ui` n'importe jamais `shop.orders` | shop.ui, shop.orders | 9 imports prohibés | 0003 |
| INV2 | tout accès à la base passe par `shop.api` | shop.api, shop.orders | 3 couches | 0003 |
```

**La question d'admission**, et c'est le garde-fou anti-*big design up front* de tout le dispositif :
une règle n'entre dans la table que si elle **nomme des éléments du modèle** *et* **laisse une trace
observable** dans l'arborescence ou les imports. Les classes **1 à 11** de la taxonomie passent ; les
classes 12 à 15 (sémantique, runtime, holistique) n'y entrent pas — elles ne sont pas falsifiables
par un contrôle statique, et une règle infalsifiable qu'un reviewer doit « juger » est ce qu'on
remplace.

Colonne `ADR` remplie par `/scd-spec-dev:adr`. **Une ligne sans ADR est un candidat**, proposé par
`/scd-spec-dev:archi` et promu par l'humain — jamais opposable tant qu'elle n'est pas promue.

## Le MCP — déclaré par le projet

`setup` pose la clé `likec4` dans le `.mcp.json` **du projet** :
`{ "command": "likec4", "args": ["mcp", "docs/architecture"] }`. Jamais dans le plugin : un serveur
déclaré par un plugin démarre dans le **répertoire du plugin**, et pour tous les projets qui
l'activent, modèle ou pas.

Ce que le MCP donne et que l'export n'a pas : **`sourceLocation {path, range}`** d'un élément —
quel `.c4`, quelle ligne éditer (lignes **0-based**). Les outils utiles au cycle, mesurés en `1.59.3` :
`query-by-metadata` (`key: "sourceDir"`, `matchMode: "exists"` — tous les éléments à `sourceDir` en un
appel, `metadata.sourceDir` en chaîne ou tableau), `read-element` (les relations entrantes et
sortantes **avec leur `kind`**, `defaultView`, `sourceLocation`), `find-relationships` (une paire,
avec `kind` et `sourceLocation` de la relation), `search-element` (par sous-chaîne d'id ou de titre).
`query-outgoers-graph` / `query-incomers-graph` donnent le voisinage borné par `maxDepth` mais **sans
le `kind`** des relations. `project` se passe à chaque appel. Les vingt outils sont en **lecture
seule** : le MCP n'écrit jamais le modèle, c'est l'agent qui édite le `.c4`.

## Ce que le DSL ne fait PAS

**Il décrit, il ne contraint pas.** La `specification` type ce qui *peut exister*, pas ce qui est
*autorisé* : rien dans le DSL n'exprime « `ui` ne doit jamais appeler `orders` », et aucun analyseur
d'imports n'est fourni. `likec4 validate` prouve que le **modèle** est cohérent, jamais que le
**code** l'est.

D'où la répartition : la table des invariants porte la règle, et la **couche 3** — le script de
conformité `scd-arch-conformance.mjs`, copié par `setup` dans `.claude/scripts/` du projet et joué par
le check `architecture` de la quality gate — confronte les imports réels du diff aux relations du
modèle : chaque frontière d'élément franchie (rattachement par `sourceDir`) exige une relation
`from -> to` de kind `sync` ou non typé ; sinon finding `no-relation`, `reverse-only` ou `async-only`.
Il est **aveugle** aux alias de chemins, aux barrels, aux imports dynamiques calculés et aux cycles
transitifs — les quatre limites déclarées dans son en-tête. Ce qu'il ne voit pas, l'`architecture-
reviewer` le juge, en contexte frais.
