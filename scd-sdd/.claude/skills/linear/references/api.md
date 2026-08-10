# Référence — API Linear (GraphQL) (état au 2026-08-10, à revérifier)

Chargée par `/scd-sdd:linear` — **intégralement** — et par `/scd-sdd:linear-setup` — les blocs
`<auth>`, `<queries>` et la seule mutation de label de `<mutations>`.

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

## Lire — les quatre requêtes du miroir

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

</queries>

<mutations>

## Écrire — cinq mutations, et pas une de plus

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

### Ce qu'aucune des deux commandes n'appelle

`issueDelete`, `issueArchive`, `projectDelete`, `projectArchive`, et toute mutation de commentaire,
de cycle ou de membre. Le miroir ne supprime rien et n'archive rien : un lot disparu d'un `tasks.md`
laisse son issue en place, et c'est l'humain qui décide de son sort.

</mutations>

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
