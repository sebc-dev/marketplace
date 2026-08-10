# Référence — API Linear (GraphQL) (état au 2026-08-10, à revérifier)

**Quatre points de chargement** :

- `/scd-sdd:linear` — **intégralement** ;
- `/scd-sdd:linear-setup` — `<auth>`, `<queries>` et les **deux mutations du setup** de
  `<mutations>` : le label de chantier et `initiativeCreate` ;
- `/scd-sdd:linear-review` — `<auth>` et `<pilotage>` ;
- l'agent **`pr-describer`** — `<auth>` et `<accroche_pr>` **seuls** (accroche PR, §D31).

Le `SKILL.md` porte ce qui **ne bouge pas** : granularité, clé dérivée, propriété des champs, sens
unique. Ce fichier porte ce qui est **daté** — un schéma GraphQL tiers et les limites de service qui
vont avec, volatiles par nature. Les deux sont séparés pour que le second périme **visiblement**.

<peremption>

## La date en tête n'est pas décorative

État arrêté au **2026-08-10**, sur la documentation officielle Linear (`linear.app/developers`)
*(source officielle — fait autorité sur son produit, et sur lui seul)*.

Avant de t'y fier :

- si la date remonte à **plus de six mois**, dis-le à l'humain **avant** de pousser, et propose de
  revérifier les points marqués ⚠ — ce sont ceux qui dépendent d'une version de schéma ou d'un
  quota ;
- **un champ refusé par l'API n'est pas une erreur de l'humain** : c'est cette référence qui a
  vieilli. Le dire, et **ne pas contourner en devinant** un autre nom de champ ;
- le schéma fait foi à la source (`linear.app/developers/graphql`). Les requêtes ci-dessous sont un
  point de départ **vérifié à la date en tête**, pas un contrat ;
- les types de variables (`String!`, `ID!`) sont ceux du schéma ce jour-là. Une erreur de type se lit
  dans `errors[].message` et se corrige à la source.

</peremption>

<auth>

## Endpoint et authentification

**Endpoint unique**, règle absolue — aucune autre URL n'est appelée :

```
https://api.linear.app/graphql
```

La clé personnelle se passe dans l'en-tête `Authorization`, **sans préfixe `Bearer`** — le préfixe
est réservé aux jetons OAuth, que le plugin n'utilise pas.

**Test de vie**, à jouer avant tout le reste : il rend l'utilisateur authentifié et ne coûte presque
rien.

```bash
curl -sS https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query":"{ viewer { id name email } }"}'
```

`LINEAR_API_KEY` est le **nom par défaut** ; le nom réellement retenu vit dans `docs/linear.md`.
**La valeur ne s'écrit nulle part** — ni dans une commande affichée, ni dans un fichier, ni dans le
rapport. On passe la **variable**, jamais son contenu.

Deux arrêts, tous deux **pédagogiques**, et jamais un best-effort — l'appel API **est** la commande,
échouer à moitié ne laisserait rien derrière soi :

- **variable absente de l'environnement** → nommer la variable attendue, dire où se crée une clé
  personnelle (Linear → *Settings* → *Security & access* → *Personal API keys*), s'arrêter ;
- **`viewer` en erreur d'authentification** → la variable existe mais la clé est refusée (révoquée,
  mal copiée, ou d'un autre workspace). Même arrêt, message différent.

</auth>

<queries>

## Lire — les cinq requêtes du miroir

### 1. Équipes et leurs workflow states — `linear-setup`

Linear ne fixe pas les **noms** d'états ; il en fixe les **types** : `triage`, `backlog`,
`unstarted`, `started`, `completed`, `canceled`. Le miroir raisonne sur les types, `docs/linear.md`
fige la correspondance vers les états **réels** de l'équipe.

```graphql
query {
  teams { nodes { id key name states { nodes { id name type position } } } }
}
```

### 2. Labels de l'équipe — les deux commandes

```graphql
query($teamId: String!) {
  team(id: $teamId) { labels { nodes { id name } } }
}
```

`linear-setup` s'en sert pour savoir si le label de chantier existe ; `linear` pour en **résoudre
l'identifiant**. ⚠ **`linear` ne le crée jamais** — label introuvable → l'issue est créée **sans**
label, et le fait remonte au rapport.

### 3. Projets de l'équipe — le matching des features

```graphql
query($teamId: String!, $after: String) {
  team(id: $teamId) {
    projects(first: 50, after: $after) {
      nodes { id name }
      pageInfo { hasNextPage endCursor }
    }
  }
}
```

Le matching se fait sur `name`, qui porte la clé `NNN-slug` en préfixe. **Aucun identifiant n'est
conservé côté dépôt** : il est re-résolu à chaque push.

### 4. Issues d'un périmètre — le matching des lots et des chantiers

```graphql
query($teamId: String!, $after: String) {
  issues(filter: { team: { id: { eq: $teamId } } }, first: 50, after: $after) {
    nodes {
      id title description
      state { id name type }
      project { id name }
      labels { nodes { id name } }
      relations { nodes { id type relatedIssue { id title } } }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

`description` est **nécessaire** : c'est là que vit le **marqueur de secours**, second recours du
matching quand le titre a été renommé. `relations` évite de recréer une relation déjà posée.

### 5. Initiatives du workspace et leurs projets liés — rubrique 7 seulement

```graphql
query($after: String) {
  initiatives(first: 50, after: $after) {
    nodes {
      id name
      projects(first: 50) { nodes { id } pageInfo { hasNextPage endCursor } }
    }
    pageInfo { hasNextPage endCursor }
  }
}
```

Ne se joue que si `docs/linear.md` porte une rubrique `initiative` ≠ `aucune`. L'initiative se
résout **par nom** — comme le label — et `projects` donne les liens déjà posés : c'est ce qui rend
le rattachement **idempotent**, un projet déjà lié ne se re-rattache jamais. `linear-setup` s'en
sert pour savoir si l'initiative existe ; `linear` pour résoudre et comparer avant d'écrire.

⚠ Les initiatives **s'activent** dans le workspace (*Settings → Initiatives*). Le comportement de
la requête quand elles ne le sont pas n'est **pas documenté** au 2026-08-10 : une erreur ou une
liste vide se traitent pareil — pas d'initiative disponible, et c'est un constat à rapporter, pas à
contourner.

</queries>

<mutations>

## Écrire — sept mutations, et pas une de plus

Toute mutation rend `success` : on le **lit**, on ne le suppose pas.

### Projet d'une feature

```graphql
mutation($input: ProjectCreateInput!) {
  projectCreate(input: $input) { success project { id name } }
}
mutation($id: String!, $input: ProjectUpdateInput!) {
  projectUpdate(id: $id, input: $input) { success }
}
```

`ProjectCreateInput` exige `name` et au moins une équipe (`teamIds: [String!]`) ; le reste prend ses
défauts. Le miroir ne pose **aucun état** sur un projet — Linear calcule son avancement depuis ses
issues.

### Issue d'un lot ou d'un chantier

```graphql
mutation($input: IssueCreateInput!) {
  issueCreate(input: $input) { success issue { id identifier title } }
}
mutation($id: String!, $input: IssueUpdateInput!) {
  issueUpdate(id: $id, input: $input) { success }
}
```

Champs posés par le miroir, **et eux seuls** : `teamId`, `title`, `description`, `stateId`,
`projectId`, `labelIds` (chantiers). **Jamais** `priority`, `estimate`, `assigneeId`, `cycleId` — ils
appartiennent à l'humain.

⚠ `description` est **reconstruite en entier** à chaque push : checklist `Tn` + marqueur. Du texte
humain écrit là est **perdu**. Les **commentaires** ne sont jamais touchés — c'est là que ça se dit.

### Relation « dépend de »

```graphql
mutation($input: IssueRelationCreateInput!) {
  issueRelationCreate(input: $input) { success }
}
```

`dépend de : R1` dans `tasks.md` se pousse comme *R1 **bloque** R2* : `issueId` = l'issue de **R1**,
`relatedIssueId` = celle de **R2**, `type: "blocks"`. Linear rend la relation inverse tout seul ; la
créer dans les deux sens ferait un doublon. Une relation déjà présente ne se recrée pas — c'est
l'objet de la sélection `relations` de la requête n° 4.

### Label de chantier — `linear-setup` seule

```graphql
mutation($input: IssueLabelCreateInput!) {
  issueLabelCreate(input: $input) { success issueLabel { id name } }
}
```

Créée **une fois**, au setup, si la requête n° 2 ne trouve pas le label, puis son nom est figé dans
`docs/linear.md`. **`linear` n'appelle jamais cette mutation** : elle lit, elle pose, elle ne crée
pas de label.

### Initiative — `linear-setup` seule

```graphql
mutation($input: InitiativeCreateInput!) {
  initiativeCreate(input: $input) { success initiative { id name } }
}
```

`name` est le seul champ requis. Créée **une fois**, au setup, si la requête n° 5 ne trouve pas
l'initiative retenue par l'humain, puis son **nom** est figé dans `docs/linear.md` (rubrique 7).
**`linear` n'appelle jamais cette mutation** — initiative introuvable au push → tout se pousse
**sans** initiative et le fait remonte au rapport : le miroir exact du pattern label, le setup
crée, le push résout et rattache.

### Rattachement projet ↔ initiative — `linear` seule

```graphql
mutation($input: InitiativeToProjectCreateInput!) {
  initiativeToProjectCreate(input: $input) { success }
}
```

`initiativeId` et `projectId` requis, rien d'autre. Un lien déjà présent (requête n° 5) ne se
**re-rattache jamais** — le schéma refuse d'ailleurs qu'un projet apparaisse deux fois dans une
hiérarchie d'initiatives.

⚠ **Ce nom de mutation ne vient pas des rapports committés** — ils ne documentent pas les mutations
d'initiative. Il a été vérifié le **2026-08-10** sur le schéma publié du SDK officiel
(`github.com/linear/linear`, `packages/sdk/src/schema.graphql`). S'il est refusé, c'est cette
référence qui a vieilli : le rapporter, ne pas deviner un autre nom.

### Ce que personne n'appelle

`issueDelete`, `issueArchive`, `projectDelete`, `projectArchive`, `initiativeUpdate`,
`initiativeDelete`, `initiativeArchive`, `initiativeToProjectDelete`, `attachmentCreate` (écarté
§D31 : l'intégration GitHub crée l'attachement PR ↔ issue toute seule dès que la magic word les
lie), et toute mutation de commentaire, de cycle ou de membre. Le miroir ne supprime rien,
n'archive rien, et ne possède de l'initiative **que le rattachement** : sa description, ses
updates, son sort appartiennent à l'humain — comme l'issue d'un lot disparu d'un `tasks.md`.

</mutations>

<pilotage>

## Piloter en lecture — `linear-review` seule

### Le comptage du garde 250

Aucun champ agrégé `count`/`totalCount` n'est exposé sur les connexions : on **pagine et on compte
les nœuds**. Requête reprise **verbatim** du rapport committé (`docs/scd-sdd/linear-tools.md` §3) :

```graphql
query CountActiveIssues($after: String) {
  issues(first: 250, after: $after) {
    nodes { id }
    pageInfo { hasNextPage endCursor }
  }
}
```

On boucle tant que `pageInfo.hasNextPage`, en repassant `endCursor` en `after` ; le total de
`nodes` accumulés est le décompte. **Les archivées ne comptent pas** — exclues par défaut,
`includeArchived` laissé au défaut, exactement la sémantique du plafond. Le comptage est
**workspace** — pas de filtre d'équipe : le plafond est workspace, pas équipe.

### Les champs d'hygiène

La requête n° 4, étendue de trois champs — tout ce que l'hygiène demande :

```graphql
priority        # 0 = No priority · 1 = Urgent · 2 = High · 3 = Medium · 4 = Low (verbatim schéma)
updatedAt       # ISO 8601 — la dormance se mesure dessus
state { type }  # completed/canceled non archivées → candidates à l'archivage
```

Les seuils, les quatre contrôles et le rendu Now/Next/Later vivent dans `references/pilotage.md` ;
ici, seulement ce qui dépend du schéma.

</pilotage>

<accroche_pr>

## Résoudre l'issue d'un lot — agent `pr-describer` seul (§D31)

Une seule chose à obtenir : l'**`identifier`** (`ENG-123`) de l'issue du lot, pour poser la magic
word dans le **corps** de la PR. La résolution est l'issue au titre préfixé `Rn — ` dans le projet
`NNN-slug` :

```graphql
query($project: String!, $prefix: String!) {
  issues(
    filter: { project: { name: { startsWith: $project } }, title: { startsWith: $prefix } }
    first: 10
  ) {
    nodes { identifier title }
  }
}
```

`$project` = la clé de la feature (`001-auth`), `$prefix` = le préfixe du lot (`R2 — `).
**Exactement un** résultat → c'est l'issue. **Zéro, ou plusieurs** → appariement ambigu : pas de
magic word + une `note`, **jamais de question** — divergence délibérée avec la résolution
titre → marqueur → question du push, écrite en §D31 : le flux implement tourne en arrière-plan et
ne casse jamais.

### Le choix du mot — déterministe

| Base de la PR | Magic word | Pourquoi |
|---|---|---|
| la branche par défaut | `Fixes <identifier>` | mot **fermant** — l'issue passera Done au merge |
| une branche de lot (PR **empilée**) | `Part of <identifier>` | mot **non-fermant** — un mot fermant fermerait l'issue au merge dans un cul-de-sac |

`Fixes` et `Part of` sont repris **verbatim** de la liste des magic words de la doc Linear (rapport
`linear-tools.md` : fermants `fix, fixes, fixed…` ; non-fermants `part of, related to…`). La ligne
se pose dans la section **Traçabilité** du corps — **jamais le titre** (le squash-merge en ferait
un message de commit, donc un identifiant Linear dans le dépôt), **jamais le nom de branche** (les
refs sont le dépôt). L'`identifier` est résolu à la création de la PR et n'est **stocké nulle
part** — comme le push re-résout tout.

</accroche_pr>

<pagination_erreurs>

## Pagination, limites, erreurs

**Pagination Relay.** Arguments `first` / `after` (et `last` / `before` en sens inverse). **50
résultats par défaut** sans argument. On boucle tant que `pageInfo.hasNextPage`, en repassant
`pageInfo.endCursor` en `after`.

> Un miroir qui ne pagine pas rate silencieusement le 51ᵉ lot. C'est le défaut le plus coûteux du
> dispositif, parce qu'il **ressemble à un succès**.

**Limites de service**, par heure et au **2026-08-10** :

| Authentification | Requêtes | Complexité |
|---|---|---|
| clé d'API | 2 500 / utilisateur | 3 000 000 points |
| OAuth | 5 000 / utilisateur-app | 2 000 000 points |
| non authentifié | 600 / IP | 100 000 points |

Complexité maximale d'une **seule** requête : **10 000 points**. En-têtes de réponse à lire quand ça
coince — `X-RateLimit-Requests-Remaining`, `X-RateLimit-Requests-Reset` (epoch ms UTC),
`X-Complexity`, `X-RateLimit-Complexity-Remaining`.

Conséquence directe sur le miroir : on **lit en lot** — une requête paginée par type d'objet — puis
on n'écrit qu'après avoir comparé. Une boucle qui interroge une issue à la fois brûle le quota pour
rien.

**Erreurs.** Format GraphQL standard : un tableau `errors`, chaque entrée portant `message`, `path`
et `extensions` (code, détails de validation).

⚠ **Une requête peut réussir partiellement avec un HTTP 200** — `data` rempli **et** `errors` rempli.
Un push qui ne lit que le code HTTP se croira vert alors qu'il a raté la moitié de son travail. **On
lit `errors` à chaque appel, toujours.**

Une erreur ne se contourne pas en devinant un autre nom de champ : elle se **rapporte**, et elle est
d'abord un signal que cette référence a vieilli.

</pagination_erreurs>

<completion>

## Ce qu'il faut rendre

Le push ne rend pas un récit : il rend des **comptes**, par type d'objet, plus la liste de ce qui n'a
pas pu être tranché.

| Compte | Ce qu'il veut dire |
|---|---|
| **créés** | l'objet n'existait pas côté Linear |
| **mis à jour** | il existait, et un champ **possédé par le miroir** a changé |
| **inchangés** | il existait, et rien de possédé n'avait bougé |
| **ambigus** | le matching n'a tranché ni par titre, ni par marqueur — posé à l'humain, **jamais deviné** |

Trois contrôles valent plus que les comptes eux-mêmes :

- **un second push immédiat rend 0 créé.** Sinon le matching est cassé et le miroir fabrique des
  doublons — le seul défaut du dispositif qui abîme les données de quelqu'un d'autre ;
- **aucun fichier du dépôt n'a été touché.** Pour `linear` c'est mécanique, elle n'a pas d'outil
  d'écriture ; le rapport le dit quand même, parce que c'est ce que le lecteur veut savoir ;
- **la priorisation lue chez Linear est rendue, jamais persistée.** Elle n'a de place dans aucun
  fichier du dépôt.

</completion>
