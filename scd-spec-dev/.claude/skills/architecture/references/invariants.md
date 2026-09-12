# La table des invariants — `docs/architecture.md`

> Référence du skill `architecture`. Chargée quand on **écrit**, **promeut** ou **oppose** un
> invariant : `/scd-spec-dev:archi` (candidats), `/scd-spec-dev:adr` (promotion), `review-context`
> (résolution) et `architecture-reviewer` (jugement).

## Le format

```markdown
## Invariants

| Id | Règle | Éléments (FQN) | Classe | ADR |
|---|---|---|---|---|
| INV1 | `shop.ui` n'importe jamais `shop.orders` | shop.ui, shop.orders | 9 imports prohibés | 0003 |
| INV2 | tout accès à la base passe par `shop.api` | shop.api, shop.orders | 3 couches | 0003 |
| INV3 | un composant React vit sous `src/ui/components/` | shop.ui | 5 placement | — |
```

Cinq colonnes, toutes obligatoires sauf `ADR` :

- **`Id`** — `INV<n>`, **stable et jamais réattribué**. Un invariant retiré laisse son numéro mort :
  les ADR et les tickets le citent.
- **`Règle`** — une phrase, au présent, **falsifiable**. « `shop.ui` n'importe jamais `shop.orders` »
  se vérifie ; « l'UI reste découplée » ne se vérifie pas.
- **`Éléments (FQN)`** — les identifiants **du modèle**, séparés par des virgules. C'est ce qui
  permet de rattacher un fichier du diff à l'invariant, par `sourceDir`.
- **`Classe`** — le numéro **et** le libellé court de la classe (`9 imports prohibés`). Le numéro
  rend l'admission vérifiable d'un coup d'œil.
- **`ADR`** — le numéro de l'ADR qui porte la décision, ou `—` pour un **candidat**.

## La question d'admission

> Une règle n'entre dans la table que si elle **nomme des éléments du modèle** *et* **laisse une
> trace observable** dans l'arborescence ou les imports.

C'est le garde-fou anti-*big design up front*. L'ancien plugin plafonnait l'architecture à de la
prose par crainte du BDUF ; ici le modèle est outillé, et le garde-fou est reporté **sur ce qui entre
dans la table** — pas sur l'absence d'outil. Une règle qu'aucun contrôle statique ne peut falsifier
est une intention : sa place est dans un ADR ou dans `design.md`, pas dans la table.

Deux échecs à l'admission, et ce qu'on en fait :

| Règle proposée | Pourquoi elle n'entre pas | Où elle va |
|---|---|---|
| « le nommage doit refléter le métier » | classe 12 — jugement sémantique, pas de trace | un ADR, ou `docs/conventions` |
| « la latence de `shop.api` reste sous 200 ms » | classe 13 — runtime | `docs/ci.md` / le monitoring |

## Les 11 classes admises (taxonomie `docs/playbook/archi_elicitation_2026-08.md`)

Chacune est vérifiable statiquement depuis l'arborescence, les imports ou l'AST.

| N° | Classe | Exemple de règle |
|---|---|---|
| 1 | **sens des dépendances** | le domaine n'importe pas l'infrastructure |
| 2 | **absence de cycles** | aucun cycle d'imports entre `shop.api` et `shop.ui` |
| 3 | **règles de couches** | la présentation n'accède pas à la persistance |
| 4 | **frontières de modules** | un module n'accède qu'à l'API publique d'un autre, pas à ses internes |
| 5 | **placement dans l'arborescence** | un composant React vit sous `src/ui/components/` |
| 6 | **nommage structurel** | un service porte le suffixe `Service` |
| 7 | **visibilité / surface d'API** | seul `index.ts` exporte hors du module |
| 8 | **isolation du framework** | la logique métier n'importe pas Express |
| 9 | **imports prohibés** | personne n'importe `lodash` (dépréciée ici) |
| 10 | **métriques structurelles seuillées** | complexité cyclomatique ≤ 15 par fonction |
| 11 | **couplage / connascence statique** | `shop.api` ne dépend pas de plus de 5 modules internes |

Les classes **12 à 15** sont **hors périmètre** de la table : conformité sémantique du nommage à
l'intention métier (12), contrats de comportement runtime — latence, disponibilité, fraîcheur (13),
drift de configuration, sécurité runtime, coûts (14), propriétés holistiques composites (15). Elles
exigent exécution ou jugement ; les signaler comme non vérifiables par ce moyen fait partie du
travail de `/scd-spec-dev:archi`.

## Candidat, puis promu

Un invariant naît **candidat** : `/scd-spec-dev:archi` l'observe dans les imports réels et le
propose, colonne `ADR` à `—`. Un candidat est **informatif** — l'`architecture-reviewer` peut le citer
en suggestion, jamais en bloquant.

Il devient **opposable** quand l'humain le promeut par un ADR : `/scd-spec-dev:adr` écrit la décision
et remplit la colonne. À partir de là, une violation dans un diff est **bloquante**, sauf dérogation
déclarée au ticket — et l'invariant lui-même ne se re-discute pas en review : on le change par un
nouvel ADR.
