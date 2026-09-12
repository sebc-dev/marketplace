---
description: "Amorce ou révise le modèle LikeC4 du projet (docs/architecture/*.c4) DEPUIS LE CODE, jamais depuis des hypothèses. Deux modes choisis sur l'état du disque : AMORÇAGE quand aucun élément ne porte de `metadata { sourceDir }` — lit l'arborescence (git ls-files), les manifestes et les points d'entrée, propose les conteneurs (puis les composants si besoin) avec leur sourceDir par lots de quatre options, écrit le .c4 avec une vue par conteneur, valide (likec4 validate --no-layout --json --project), puis propose des CANDIDATS d'invariants observés dans les imports réels (colonne ADR à —, classe 1 à 11) ; RÉVISION sinon — confronte modèle et code (dossier sans élément, sourceDir disparu, relation observée absente du modèle, relation du modèle sans trace) et fait arbitrer les deltas. N'écrit aucun ADR (c'est /scd-spec-dev:adr), ne promeut aucun candidat, n'édite aucun code."
argument-hint: "(aucun — le mode est choisi sur l'état de docs/architecture/*.c4)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
  - Bash(likec4:*)
  - Bash(ls:*)
  - Bash(test:*)
  - Bash(git ls-files:*)
---

## Ce que fait cette commande

`/scd-spec-dev:archi` **fait naître le modèle depuis le code, puis le tient à jour contre lui**. Le
squelette posé par `/scd-spec-dev:setup` a un `system` **vide à dessein** : un modèle pré-rempli
d'hypothèses est faux dès le premier jour. Ici, chaque conteneur proposé vient d'un dossier réel, et
chaque relation proposée d'un import réel.

Deux modes, **choisis sur le disque**, jamais demandés : **amorçage** si aucun élément du modèle ne
porte de `sourceDir` (glose : `metadata { sourceDir '<chemin>' }`, la seule clé qui relie un élément
du modèle à du code) ; **révision** dès qu'un seul en porte.

**Ratio : ~40 % humain / 60 % IA** — tu lis et tu proposes, l'humain nomme et découpe ; tu écris
seulement ce qu'il a retenu.

## Ce qu'elle ne fait JAMAIS

- **Aucun ADR.** Un candidat d'invariant reste candidat (colonne `ADR` à `—`) ; le *pourquoi* et la
  promotion sont le travail de `/scd-spec-dev:adr`.
- **Aucun invariant sans trace observable** : une règle qui ne se lit ni dans l'arborescence ni dans
  les imports n'entre pas dans la table, et tu dis pourquoi (étape 4).
- **Aucune édition de code**, ni de `docs/adr/`. Tu écris dans `docs/architecture/*.c4` et dans la
  table de `docs/architecture.md`, rien d'autre.
- **Jamais un troisième niveau** sous le `system` (`container` → `component`, et c'est tout) sans
  demande explicite de l'humain.
- **Jamais de `link`** : il est libre pour l'humain, aucun agent ne rattache du code par lui.

---

## Étape 0 — Précondition, projet, mode

```
test -f docs/architecture/likec4.config.json
```

Absent → s'arrêter : *le squelette n'est pas posé ; joue `/scd-spec-dev:setup` d'abord*. Présent →
lire `name` dans ce fichier : c'est le `<name>` de **tous** les `--project` qui suivent, sans
exception.

Puis lister les `.c4` (`ls docs/architecture/*.c4`) et chercher `sourceDir` (Grep). **Aucune
occurrence → amorçage** (étape 2). **Au moins une → révision** (étape 3). Dans les deux cas, le
`system` unique est celui que `setup` a posé : tu ne le renommes pas, tu le remplis.

## Étape 1 — Lire le code (les deux modes)

- `git ls-files` — l'arborescence **suivie**, pas le disque : `node_modules/`, `dist/`, `.venv/`
  n'entrent pas dans le modèle.
- Les **manifestes** à la racine et dans les sous-dossiers (`package.json` et ses `workspaces`,
  `pyproject.toml`, `go.mod`, `Cargo.toml`, `pubspec.yaml`) : un manifeste par dossier est un
  candidat conteneur de premier rang.
- Les **points d'entrée** (`main`, `bin`, `scripts.dev`, `index.*`, `app.*`) : ils disent la
  technologie et le kind (`container` déployable, `store` s'il détient l'état).
- Les **imports qui franchissent un dossier** (Grep `^import`, `require(`, `from … import`, `use
  crate::`) : ce sont les relations `sync` observables. Un `fetch`/HTTP vers un autre conteneur est
  une relation aussi, mais elle ne laissera **pas** de trace d'import — la noter comme telle.

## Étape 2 — Amorçage : proposer, faire choisir, écrire

**Le problème avant les options.** Avant la première question, pose en deux ou trois phrases ce
que l'arborescence dit du projet — monolithe, monorepo, front + API — et ce qui hésite.

Puis `AskUserQuestion`, **par lots de quatre options au plus** : chaque option est un conteneur
pressenti avec son `sourceDir`, sa technologie et sa **conséquence** (« tout ce qui vit sous
`src/api` sera rattaché à cet élément par les reviewers »). L'humain retient, renomme, fusionne.
Un dossier de code qu'aucune option ne couvre est dit : il restera `unmapped` (glose : un fichier
qu'aucun `sourceDir` ne couvre est signalé par la review, jamais jugé).

**Composants** seulement si un conteneur retenu est trop gros pour une ligne — même mécanique, un
lot par conteneur, et jamais plus profond.

Puis écrire dans le `.c4` qui déclare le `system` (Edit, pas de réécriture du fichier) :

```likec4
    api = container 'API' {
      technology 'Node.js / Express'
      metadata { sourceDir 'src/api' }
    }
    ui = container 'Web UI' {
      metadata { sourceDir ['src/ui', 'packages/design-system'] }
    }
    api -[sync]-> orders 'importe service et repo'
    ui -[sync]-> api 'appelle /api par fetch'
```

Chemins **relatifs à la racine, sans `./` ni barre finale**. Les relations écrites sont celles que
l'étape 1 a **vues** — un import, un appel HTTP nommé — et le titre dit la trace. Puis **une vue par
conteneur**, `of` en FQN complet (elle tient ainsi même si le modèle est un jour découpé en
plusieurs fichiers) :

```likec4
  view api of <name>.api {
    title 'API'
    include *
  }
```

Remplacer la `description 'À compléter…'` du `system` par une phrase vraie, ou la retirer.

## Étape 3 — Révision : confronter, proposer les deltas, faire arbitrer

Quatre confrontations, chacune une liste — vide ou pas, elle se dit :

1. **Dossier sans élément** : un dossier de code de premier niveau (ou un manifeste) qu'aucun
   `sourceDir` ne couvre.
2. **`sourceDir` disparu** : `test -d <chemin>` échoue pour un élément du modèle.
3. **Relation observée, absente du modèle** : un import de `A` vers `B` (deux éléments à
   `sourceDir`) sans relation `A -> B` dans le `.c4`.
4. **Relation du modèle sans trace** : une relation `sync` entre deux éléments à `sourceDir` dont
   aucun import ne témoigne. Une `async` n'est **jamais** dans cette liste — elle ne laisse pas de
   trace d'import, par construction.

Le problème d'abord, puis `AskUserQuestion` par lots de quatre : chaque delta est une option avec
sa conséquence (« retirer `ui -> orders` : un import de `orders` depuis `ui` deviendra une relation
non modélisée en review »). Une relation sans trace peut être **vraie** (HTTP, événement) : c'est
à l'humain de le dire, pas à toi de la retirer. Écrire ensuite les seuls deltas retenus, par Edit.

## Étape 4 — Valider, puis proposer des candidats d'invariants

```
likec4 validate --no-layout --json --project <name> docs/architecture
```

Code **1** ⇒ corriger le `.c4` que tu viens d'éditer avant tout le reste, et remonter `errors[]` si
tu n'y arrives pas. Ne jamais rendre la main sur un modèle invalide.

Puis relire les imports **à la lumière du modèle** et proposer des **candidats** (glose : une ligne
de la table d'invariants sans ADR — informative, jamais bloquante en review) : ce qui est *vrai
aujourd'hui* et *mérite de le rester*. Typiquement `ui` n'importe pas `orders` (classe 9), le domaine
n'importe pas la couche d'exposition (classe 1), un accès à la base passe par un seul élément
(classe 3). Chaque candidat a sa **classe (1 à 11)** — voir `references/invariants.md`.

`AskUserQuestion`, quatre par lot. Les retenus vont dans la table de `docs/architecture.md` :
`| INV<n> | règle | FQN | classe | — |`. `INV<n>` = **suivant après le plus grand Id présent**, jamais
un numéro réattribué. Si la table ne porte que la ligne d'exemple de `setup` (des FQN `shop.*` qui
n'existent pas dans le modèle, sous une note « Exemple à remplacer »), remplace-la et retire la note.

**Dire ce qui n'entre pas** : une règle que l'humain te souffle et qui relève des classes 12-15
(« le nommage reflète le métier », « l'API répond en 200 ms », « la config est identique en staging »)
n'entre pas — pas de trace statique, donc rien que la review puisse constater. Sa place est un ADR
(intention) ou `docs/ci.md` (mesure) : tu le dis, tu ne l'écris pas dans la table.

## Étape 5 — Rendre compte

<report>
```
## Modèle — docs/architecture/ · amorçage · likec4 validate : valid

| Élément (FQN) | Kind | sourceDir | Relations |
|---|---|---|---|
| shop.api | container | src/api | → shop.orders (import) |
| shop.ui | container | src/ui | → shop.api (HTTP, sans trace d'import) |
| shop.orders | container | src/orders | — |

Vues : index, api, ui, orders · unmapped : scripts/ (outillage, non modélisé — dit à l'humain)

### Candidats d'invariants (docs/architecture.md, ADR = —)
| INV1 | `shop.ui` n'importe jamais `shop.orders` | 9 imports prohibés |
| INV2 | `shop.orders` n'importe jamais `shop.api` | 1 sens des dépendances |

### N'entre pas dans la table
- « l'API répond en 200 ms » — classe 13 (runtime) → docs/ci.md
```
</report>

**Prochaine action** : `/scd-spec-dev:adr "<titre>" "<contexte>"` pour promouvoir un candidat ou
figer une décision qui touche le modèle ; sinon rien — le modèle est à jour, la review le lira.

## Skill active

- **`architecture`** — le contrat que tu honores : `SKILL.md` en entier, puis
  `references/modele.md` (kinds, les deux formes de `sourceDir`, une vue par conteneur, le squelette
  de `setup`) et `references/invariants.md` (la table, la question d'admission, les 11 classes).
- **`likec4-dsl`** — la **syntaxe** du DSL et les drapeaux du CLI, dès que tu écris une ligne de
  `.c4` : identifiants à tirets admis, pas de point ; références en FQN complet entre fichiers.

Tu parles la **langue de l'humain**, dans les questions comme dans le rapport, et tu gloses
**une fois** chaque terme de méthode — plus du tout dès qu'il l'emploie lui-même.
