# Le modèle `.c4` — conventions du plugin

> Référence du skill `architecture`. Chargée quand on **écrit** dans le modèle :
> `/scd-spec-dev:setup` (le squelette), `/scd-spec-dev:archi` (amorçage et révision),
> `/scd-spec-dev:adr` (le delta d'un ADR), et un `design.md` qui introduit une relation.
> La **syntaxe** du DSL et les drapeaux du CLI sont dans le skill `likec4-dsl` : cette référence ne
> porte que ce que **ce plugin** décide par-dessus.

## Le vocabulaire — cinq kinds d'éléments, deux kinds de relations

```likec4
specification {
  element actor     { style { shape person } }
  element system
  element container
  element component
  element store     { style { shape storage } }

  relationship sync  { title 'appelle' }
  relationship async { title 'publie vers' }
}
```

| Kind | Ce qu'il désigne | `sourceDir` ? |
|---|---|---|
| `actor` | un humain ou un système tiers qui utilise le produit | **non** — élément de contexte |
| `system` | le produit lui-même ; **un seul** par dépôt, il porte le nom du projet | rarement |
| `container` | une unité déployable ou un paquet : une API, un front, un worker, un package | **oui** |
| `component` | une part interne d'un conteneur, quand le conteneur est trop gros pour une seule ligne | **oui** |
| `store` | une base, un cache, un bus — ce qui détient de l'état | **oui**, s'il a du code ici |

**Deux niveaux sous le `system` suffisent** (`container`, puis `component` si besoin). Un troisième
niveau se demande explicitement à l'humain : au-delà, le modèle décrit le code plutôt que la
structure, et il pourrit à la première refonte.

**Les deux kinds de relations sont un choix de ce plugin**, pas du DSL : `sync` (appel bloquant,
l'appelant dépend de l'appelé) et `async` (événement, l'émetteur ne dépend pas du destinataire). La
distinction compte pour la conformité : un import direct matérialise une relation `sync`, un `async`
ne laisse **pas** de trace d'import et n'est jamais attendu dans le diff.

## `sourceDir` — les deux formes

```likec4
api = container 'API' {
  technology 'Node.js'
  metadata { sourceDir 'src/api' }
}

ui = container 'Web UI' {
  technology 'React'
  metadata {
    sourceDir ['src/ui', 'packages/design-system']
  }
  link ../../src/ui/index.ts
}
```

Chemins **relatifs à la racine du dépôt**, sans `./` ni barre finale. Les deux formes ressortent
telles quelles dans `likec4 export json` (`"sourceDir": "src/api"` / `"sourceDir": ["src/ui",
"packages/design-system"]`) et sont interrogeables par `query-by-metadata` côté MCP.

`link` est **libre pour l'humain** — un chemin vers le point d'entrée, une URL de doc. Aucun agent ne
rattache du code par `link`.

## Les vues — une par conteneur, une par ADR

```likec4
views {
  view index {
    title "Vue d'ensemble"
    include *
  }

  view api of api {
    title 'API'
    include *
  }

  view adr-0003 of shop {
    title 'ADR 0003 — extraction du store de commandes'
    include *
  }
}
```

- **`index`** — obligatoire, posée par `setup`, `include *`.
- **Une vue par conteneur**, nommée comme lui (`view api of api`). C'est elle que `pr-describer`
  rend en Mermaid quand un ticket touche ce conteneur.
- **Une vue `adr-NNNN` par ADR qui touche le modèle**, `of` l'élément le plus haut concerné. Les
  tirets sont valides dans un identifiant LikeC4. **Un ADR sans delta de modèle n'a pas de vue** — et
  pas de section « Modèle ».

`likec4 gen mermaid -o <dir>` sort un `.mmd` **par vue**, en `graph TB` Mermaid standard — rendu
nativement par GitHub dans une PR ou un ADR. Pas de `C4Context` : c'est du flowchart.

## Le squelette posé par `setup`

Écrit **seulement si absent**, puis jamais retouché — le modèle appartient à l'humain.
`<projet>` = le `name` du dépôt (tirets admis ; un point ou une espace deviennent un tiret).

```likec4
// Modèle LikeC4 — posé par /scd-spec-dev:setup, possédé par le projet.
// Amorcer avec /scd-spec-dev:archi. Valider :
//   likec4 validate --no-layout --json --project <nom-du-dépôt> docs/architecture

specification {
  element actor     { style { shape person } }
  element system
  element container
  element component
  element store     { style { shape storage } }

  relationship sync  { title 'appelle' }
  relationship async { title 'publie vers' }
}

model {
  <projet> = system '<nom-du-dépôt>' {
    description 'À compléter : les conteneurs du projet, chacun avec son metadata sourceDir.'
  }
}

views {
  view index {
    title "Vue d'ensemble"
    include *
  }
}
```

Accompagné de `docs/architecture/likec4.config.json` :

```json
{
  "$schema": "https://likec4.dev/schemas/config.json",
  "name": "<nom-du-dépôt>"
}
```

Le `system` est **vide à dessein** : les conteneurs viennent de `/scd-spec-dev:archi`, qui les lit
dans l'arborescence réelle. Un squelette pré-rempli d'hypothèses est un modèle faux dès le premier
jour.

## Découper en plusieurs `.c4`

Tous les `.c4` du dossier **fusionnent en un seul modèle**. Un fichier par sous-domaine est légitime
dès que `model.c4` dépasse la page ; `extend` permet d'ajouter à un élément déclaré ailleurs, par son
FQN complet. Le nom des fichiers n'a aucune sémantique — ce qui compte est le FQN.

## Valider, toujours

```
likec4 validate --no-layout --json --project <name> docs/architecture
```

Code de sortie **1** si invalide, `{ valid, errors[{message, file, line, range}] }` sur stdout. `-f
<fichier>` est répétable et filtre les erreurs aux fichiers d'un ticket. Tout édit d'un `.c4` — par
`archi`, par `adr`, ou dans un change — se termine par cette commande.
