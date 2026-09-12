---
description: "Écrit UN ADR au format Nygard (docs/adr/NNNN-slug.md — Contexte, Décision, Conséquences, Alternatives écartées, statut) à partir d'un titre et d'un contexte, numéro = le suivant dans docs/adr/. Si la décision TOUCHE LE MODÈLE LikeC4 : ajoute une section `## Modèle` (éléments touchés en FQN, le delta), édite le .c4 (nouveaux éléments/relations, `extend` si le parent vit dans un autre fichier), ajoute une vue `adr-NNNN of <élément le plus haut>`, valide (likec4 validate --no-layout --json --project), rend la vue en Mermaid (likec4 gen mermaid -o <dir>) et la colle dans l'ADR. Un ADR sans delta de modèle n'a NI section Modèle NI vue, et le dit. Promeut ou crée les invariants que la décision porte dans la table de docs/architecture.md (colonne ADR = NNNN ; un candidat qui correspond est PROMU, pas dupliqué ; Id INV<n> stable). N'édite JAMAIS un ADR accepté — un nouvel ADR supersède —, n'admet aucun invariant de classe 12-15, n'édite aucun code."
argument-hint: "\"<titre>\" \"<contexte : le problème, en une ou deux phrases>\""
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
---

## Ce que fait cette commande

`/scd-spec-dev:adr` **fige le pourquoi d'une décision structurante**, et — quand elle touche la
structure — **fait entrer le quoi dans le modèle en même temps**. C'est la règle de tri du skill
`architecture` : l'ADR porte le *pourquoi* (immuable), le `.c4` le *quoi, maintenant* (durable), la
table de `docs/architecture.md` ce qui devient *opposable* (glose : un invariant opposable est une
ligne de la table avec un ADR — une violation dans un diff est bloquante en review).

C'est aussi la **seule commande qui remplit la colonne `ADR`** de la table : un candidat proposé par
`/scd-spec-dev:archi` n'est opposable qu'une fois promu ici.

**Ratio : ~50 % humain / 50 % IA** — la décision est la sienne ; tu la mets en forme, tu la
confrontes au modèle, tu écris le delta qu'il valide.

## Ce qu'elle ne fait JAMAIS

- **Elle n'édite pas un ADR accepté.** Un changement d'avis est un **nouvel** ADR qui porte
  `Supersède : NNNN` ; l'ancien reçoit seulement, en tête de statut, `remplacé par NNNN` — c'est la
  seule ligne qu'on y touche.
- **Elle n'admet aucun invariant de classe 12-15** (sémantique, runtime, configuration, holistique) :
  l'intention reste dans le corps de l'ADR, la table n'en reçoit rien.
- **Elle n'édite aucun code**, et ne déplace jamais un `.c4` hors de `docs/architecture/`.
- **Elle n'invente pas de delta** : un ADR qui ne touche pas le modèle n'a ni section `## Modèle`
  ni vue, et le rapport le dit.

---

## Étape 0 — Préconditions et numéro

- `test -d docs/adr` — absent → s'arrêter : *joue `/scd-spec-dev:setup`*, qui pose `docs/adr/` et
  le gabarit `0001-format-adr.md`.
- `test -f docs/architecture/likec4.config.json` — absent → l'ADR **s'écrit quand même**, sans
  section `## Modèle`, et le rapport dit que la part modèle a été sautée faute de squelette.
  Présent → lire `name` : c'est le `<name>` de chaque `--project` qui suit.
- Numéro `NNNN` = le plus grand préfixe de `ls docs/adr/` + 1, sur quatre chiffres. Le slug vient du
  titre, en minuscules, tirets, sans accent.
- Lire `docs/adr/0001-format-adr.md` : c'est la forme — en-tête `- Statut :` / `- Date :`, puis
  `## Contexte`, `## Décision`, `## Conséquences`, `## Alternatives écartées`.

Titre ou contexte manquant dans `$ARGUMENTS` → les demander, en une question.

## Étape 1 — Cadrer la décision avec l'humain

**Le problème avant les options.** Reformule le contexte reçu en deux ou trois phrases : ce qui
force à décider maintenant, et ce que la décision engage. Puis `AskUserQuestion`, quatre options au
plus, chacune avec sa **conséquence concrète** pour le projet (« tout accès à la base passera par
`orders` : `api` devra cesser d'importer `repo.js` ») :

- la décision elle-même, si le titre en laisse plusieurs possibles ;
- les alternatives qu'il écarte — elles sont la rubrique qui vaut le plus dans six mois ;
- **touche-t-elle le modèle ?** — un élément apparaît, disparaît, change de kind ou de `sourceDir`,
  une relation naît ou meurt. Si oui, lesquels, en FQN. Si non, c'est dit et l'étape 3 est sautée.
- supersède-t-elle un ADR existant ? (Grep du titre et des FQN dans `docs/adr/`.)

## Étape 2 — Écrire l'ADR

`docs/adr/NNNN-slug.md`, statut `accepté` (ou `proposé` si l'humain veut relire avant de figer) :

```markdown
# NNNN — <Titre>

- Statut : accepté
- Date : <AAAA-MM-JJ>
- Supersède : <MMMM>            ← seulement si c'est le cas

## Contexte
## Décision
## Conséquences
## Alternatives écartées
```

Une décision qui supersède : ajouter `— remplacé par NNNN` à la ligne `- Statut :` de l'ancien, et
**rien d'autre** dans son corps.

## Étape 3 — Le delta du modèle (seulement si la décision le touche)

1. **Éditer le `.c4`** (Edit, dans `docs/architecture/`). Un nouvel élément s'écrit **dans le bloc
   de son parent** si ce parent est déclaré dans le fichier que tu édites ; sinon, dans un fichier
   à toi, par `extend` et en **FQN complet** — une référence courte ne survit pas à la frontière
   d'un fichier :

   ```likec4
   model {
     extend <name> {
       db = store 'SQLite commandes' {
         technology 'SQLite'
         metadata { sourceDir 'src/db' }
       }
     }
     <name>.orders -[sync]-> <name>.db 'lit et écrit'
   }
   ```

   Un élément qui correspond à du code porte son `sourceDir` ; un élément de contexte n'en a pas.

2. **Ajouter la vue de l'ADR**, `of` l'élément **le plus haut** touché (le `system` si le delta
   traverse deux conteneurs) :

   ```likec4
   views {
     view adr-NNNN of <name> {
       title 'ADR NNNN — <titre court>'
       include *
     }
   }
   ```

3. **Valider** — jamais rendre la main sur un modèle invalide :

   ```
   likec4 validate --no-layout --json --project <name> docs/architecture
   ```

4. **Rendre la vue en Mermaid**. `gen mermaid` n'a **pas** d'option `--project` (mesuré en
   `1.59.3`) : c'est le chemin qui borne le projet. Il écrit **un `.mmd` par vue**, nommé par l'id de
   la vue, dans le répertoire de `-o`, qu'il crée. Un répertoire hors de l'arbre : rien à nettoyer.

   ```
   likec4 gen mermaid -o /tmp/likec4-mermaid docs/architecture
   ```

   Lire `/tmp/likec4-mermaid/adr-NNNN.mmd` — il commence par un front-matter `---` / `title:` /
   `---` puis `graph TB`, que GitHub rend tel quel — et le coller **entier** dans l'ADR :

   ````markdown
   ## Modèle
   - Éléments touchés : `<name>.orders`, `<name>.api`, **nouveau** `<name>.db`
   - Delta : `docs/architecture/<fichier>.c4` — <ce qui est ajouté, retiré, étendu>
   - Vue : `adr-NNNN`

   ```mermaid
   <contenu de adr-NNNN.mmd>
   ```
   ````

## Étape 4 — Les invariants que la décision porte

Relire la table de `docs/architecture.md` (format : `references/invariants.md` ; fichier absent →
le dire, renvoyer vers `setup`, et sauter l'étape) et proposer, par `AskUserQuestion` après avoir
posé le problème :

- **promotion** : un candidat (`ADR` à `—`) dont la règle est celle que la décision fixe → la
  colonne `ADR` reçoit `NNNN`, l'Id et la règle **ne bougent pas**. Jamais une seconde ligne pour la
  même règle.
- **création** : une règle nouvelle, **falsifiable statiquement** (classes 1 à 11), qui nomme des
  éléments du modèle → `| INV<n> | règle | FQN | classe | NNNN |`, `<n>` = suivant après le plus
  grand Id présent, jamais réattribué.
- **retrait** : une décision qui rend un invariant faux le laisse dans la table avec `— retiré par
  NNNN` dans la colonne `ADR` ; le numéro reste mort.

Une règle des classes 12-15 que l'humain voudrait dans la table : la refuser en nommant sa classe,
et la laisser dans `## Décision` ou `## Conséquences` de l'ADR, où elle est une intention lisible.

## Étape 5 — Rendre compte

<report>
```
✅ ADR 0002 — « Store SQLite des commandes, accessible par orders seulement »
   docs/adr/0002-store-sqlite-commandes.md · accepté · supersède : —

   Modèle   docs/architecture/adr-0002.c4 : + la2-test.db (store, src/db), + orders -[sync]-> db
            vue adr-0002 of la2-test · likec4 validate : valid · Mermaid collé
   Table    INV2 promu (ADR 0002) · INV3 créé (3 couches) · rien retiré
```
</report>

Sans delta : la ligne `Modèle` dit `aucun delta — pas de section Modèle, pas de vue`.

**Prochaine action** : si la décision impose du code (un import à retirer, un dossier à créer), c'est
un change — `/opsx:propose "<idée>"` — dont le `design.md` citera cet ADR ; jamais toi.

## Skill active

- **`architecture`** — `SKILL.md` en entier, puis `references/invariants.md` (la table, la question
  d'admission, candidat → promu) et `references/modele.md` (kinds, `sourceDir`, la vue `adr-NNNN`,
  `extend` entre fichiers).
- **`likec4-dsl`** — la syntaxe du DSL et du CLI dès que tu écris dans un `.c4` ou que tu lances
  `likec4` : identifiants à tirets admis (`adr-0002` est valide), FQN complet entre fichiers.

Tu parles la **langue de l'humain**, dans les questions comme dans l'ADR, et tu gloses **une fois**
chaque terme de méthode — ADR, opposable, candidat, delta — plus du tout dès qu'il l'emploie.
