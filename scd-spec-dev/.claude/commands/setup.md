---
description: "Monte OpenSpec dans le projet cible et l'accorde au schéma scd de ce plugin, en UNE passe rejouable. DÉTECTE OpenSpec sans jamais l'installer (le repli npx n'existe pas : les /opsx:* appellent `openspec` nu, allowed-tools scellé sur Bash(openspec:*) — exiger `openspec` sur le PATH est le seul montage viable) : absent, elle s'arrête en guidant vers `npm i -g @fission-ai/openspec@latest`. Présente, elle pose l'échafaudage (`openspec init --tools claude`, jamais re-init : au re-jeu `openspec update`), copie la recette de schéma scd portée par le plugin dans openspec/schemas/scd/, accorde openspec/config.yaml (schema: scd + un bloc context/rules balisé, édits humains préservés), scaffolde les gabarits durables (vision, roadmap, caps, adr/0001) seulement s'ils manquent, et pose le filet CI grep des escape-hatches. Idempotente par artefact : chaque artefact a un propriétaire et une règle au re-jeu. Monte aussi la dimension ARCHITECTURE : détecte LikeC4 (absent, les étapes LikeC4 sont SAUTÉES ET SIGNALÉES — le reste du montage joue, contrairement à OpenSpec qui est la fondation), pose le squelette de modèle docs/architecture/ (likec4.config.json + model.c4), récrit docs/architecture.md au format table d'invariants opposables, ajoute la clé likec4 au .mcp.json du projet sans toucher aux autres serveurs, copie le script de conformité code ↔ modèle scd-arch-conformance.mjs dans .claude/scripts/ (plugin-owned, rafraîchi), et pose un job CI likec4-validate dans le même workflow que le filet escape-hatch."
argument-hint: "(aucun — détecte, monte, rejouable)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
  - Bash(openspec:*)
  - Bash(likec4:*)
  - Bash(mkdir:*)
  - Bash(cp:*)
  - Bash(ls:*)
  - Bash(test:*)
  - Bash(cat:*)
  - Bash(git rev-parse:*)
  - Bash(git remote:*)
---

## Ce que fait cette commande

`/scd-spec-dev:setup` **monte OpenSpec dans le projet courant** et l'accorde au schéma `scd` porté par
ce plugin. Une seule passe, **rejouable** : on peut la relancer à tout moment sans rien casser.

Le plugin **porte la recette**, le projet **porte l'instance** : le schéma `scd` vit dans le plugin
(`${CLAUDE_PLUGIN_ROOT}/openspec-schema/scd/`) et cette commande le **copie** dans le projet.

## Ce qu'elle ne fait JAMAIS

- **Elle n'installe pas OpenSpec elle-même.** Absente sur le PATH, elle s'arrête et **guide** — elle
  ne lance aucun `npm i`, aucune action machine silencieuse.
- **Elle ne re-`init` jamais** un `openspec/` existant : `openspec init` est destructif (il supprime
  les reliquats d'anciennes versions). Au re-jeu, c'est `openspec update`.
- **Elle ne touche pas aux données** (`openspec/changes/`, `openspec/specs/`) ni **aux édits humains**
  de `config.yaml` (hors du bloc balisé) ou du fichier de CI (hors du bloc balisé).
- **Elle n'installe pas LikeC4 non plus, et ne s'arrête pas s'il manque** : les étapes LikeC4 sont
  **sautées et signalées**, tout le reste du montage joue (étape 1bis).
- **Elle ne touche jamais à un serveur MCP autre que `likec4`** dans le `.mcp.json` du projet.

---

## Étape 1 — Détecter OpenSpec (détecter et guider, jamais installer)

Lancer :

```
openspec --version
```

- **Présent** → noter la version, continuer à l'étape 2.
- **Absent** (`command not found` / erreur) → **STOP**. Afficher, sans rien exécuter d'autre, le
  message de guidage ci-dessous, puis rendre la main. La commande est **rejouable** : l'humain
  installe, puis relance `/scd-spec-dev:setup`.

> **Message de guidage à afficher tel quel (adapter la version si besoin) :**
>
> OpenSpec n'est pas sur ton PATH. Ce plugin ne l'installe pas lui-même (choix de conception :
> aucune action machine silencieuse). Installe-le globalement, puis relance `/scd-spec-dev:setup` :
>
> ```
> ! npm i -g @fission-ai/openspec@latest
> ```
>
> Le paquet est **`@fission-ai/openspec`** (le `openspec` nu sur npm est un placeholder 0.0.0), le
> binaire s'appelle **`openspec`**.
>
> **Si l'install réussit mais `openspec --version` reste introuvable**, c'est un piège de PATH, pas
> d'installation :
> - le **bin global npm** peut être hors du PATH — vérifier `npm prefix -g` (le binaire est dans
>   `<prefix>/bin`) et ajouter ce dossier au PATH ;
> - avec un **gestionnaire de versions Node** (nvm, fnm, asdf, volta), le shim peut manquer —
>   ouvrir un nouveau shell, ou `asdf reshim nodejs` / `hash -r` selon l'outil.

**Pourquoi exiger `openspec` sur le PATH, et pas un repli `npx`** (fait vérifié, sources primaires
`Fission-AI/OpenSpec`, 2026-09-05) : les commandes `/opsx:*` posées par `openspec init` appellent
**`openspec` nu** — leur `allowed-tools` est scellé sur `Bash(openspec:*)` et les gabarits de workflow
invoquent tous `openspec …` sans `npx`. Sans binaire sur le PATH, les `.md` sont bien scaffoldés mais
**toutes** les `/opsx:*` échouent à l'exécution. Exiger `openspec` sur le PATH n'est donc pas une
préférence : c'est le seul montage qui marche.

---

## Étape 1bis — Détecter LikeC4 (sauter et signaler, jamais s'arrêter)

L'architecture est une **dimension** du cycle, OpenSpec en est la **fondation** : LikeC4 absent, on
saute ses étapes et on le dit ; on ne stoppe pas le montage.

Lancer :

```
likec4 --version
```

- **Présent** → noter la version, marquer `LIKEC4 = présent`. Les étapes **5 (modèle + table +
  script de conformité)**, **6 (job CI `likec4-validate`)** et **6bis (`.mcp.json`)** jouent leur
  part LikeC4.
- **Absent** (`command not found` / erreur) → marquer `LIKEC4 = absent`. **Continuer le montage**
  OpenSpec normalement, et **sauter** la part LikeC4 des étapes 5, 6 et 6bis. Afficher le message de
  guidage ci-dessous, et le **répéter** dans le compte rendu de l'étape 7 — un saut silencieux est le
  seul vrai défaut ici.

> **Message de guidage à afficher tel quel :**
>
> LikeC4 n'est pas sur ton PATH : le montage a joué **sans** la dimension architecture (pas de
> modèle `docs/architecture/`, pas de script de conformité `.claude/scripts/scd-arch-conformance.mjs`,
> pas de serveur MCP `likec4`, pas de job CI `likec4-validate`). Tout le reste est monté. Installe-le, puis relance `/scd-spec-dev:setup` :
>
> ```
> ! npm i -g likec4
> ```
>
> Node **≥ 22.22.3** est exigé (`engines` du paquet fait foi ; un guide du site dit encore 20.x).
> Pour la **preview live** du modèle, l'extension **VS Code** officielle LikeC4 est le seul éditeur
> qui la rend ; le LSP standalone existe pour Neovim, Emacs, Zed et JetBrains.

**Une seule exception au saut** : si `docs/architecture/likec4.config.json` existe **déjà** sur le
disque, le projet a un modèle même si cette machine n'a pas le CLI. Dans ce cas, les étapes 4, 6 et
6bis — et la **copie du script de conformité** de l'étape 5 — jouent **quand même** leur part LikeC4
(elles n'ont besoin d'aucun binaire) ; seule la **validation** du modèle est sautée et signalée. Sans cette exception, un re-jeu depuis une machine
sans CLI **retirerait** du `config.yaml` et de la CI ce qu'un montage précédent y avait posé.

### Collision de nom sur le skill `likec4-dsl`

Ce plugin embarque le skill officiel `likec4-dsl` (syntaxe du DSL, drapeaux du CLI, garde-fous
anti-hallucination). Vérifier qu'un homonyme ne vit pas déjà dans le projet :

```
ls -d .claude/skills/likec4-dsl 2>/dev/null
```

- **Absent** → rien à faire.
- **Présent** → **le laisser en place** (il appartient au projet ou à l'humain) et le **signaler** :

  > Un skill `likec4-dsl` existe dans `.claude/skills/` de ce projet et entre en **collision de nom**
  > avec celui du plugin. Il n'a pas été touché. Décide lequel fait autorité : garde le tien et
  > accepte l'ambiguïté de nom, ou supprime-le à la main pour laisser celui du plugin répondre.

---

## Étape 2 — Échafaudage OpenSpec (init une fois, sinon update)

Détecter si le projet est **déjà monté** : `test -d openspec`.

- **`openspec/` absent (premier montage)** :

  ```
  openspec init --tools claude
  ```

  `--tools claude` (et non `none`, absent de la liste) installe l'intégration Claude Code en
  **delivery `both`** (le défaut) : à la fois les commandes `/opsx:*` (`.claude/commands/opsx/*.md`)
  **et les skills OpenSpec** (`.claude/skills/openspec-*/SKILL.md`) — profil `core` :
  `openspec-propose`, `openspec-explore`, `openspec-apply-change`, `openspec-update-change`,
  `openspec-sync-specs`, `openspec-archive-change`. Le cycle en dépend. `init` crée aussi `openspec/`
  avec un `config.yaml` par défaut (`schema: spec-driven`) — on le réaccordera à l'étape 4.

- **`openspec/` présent (re-jeu)** : **ne pas** re-`init`. Re-synchroniser commandes/skills et monter
  le CLI :

  ```
  openspec update
  ```

Dans les deux cas, **contrôle de santé** :

```
openspec list
```

S'il échoue, remonter la sortie à l'humain et s'arrêter là — le montage est cassé, inutile de
continuer par-dessus.

### Vérifier que les skills OpenSpec sont bien posés

Les skills sont **le cœur de l'intégration** (les `/opsx:*` s'y adossent), et ils ne sont installés
que si le **delivery mode** les inclut (`both` — le défaut — ou `skills`). Un profil global réglé sur
`commands` seul les omettrait silencieusement. Vérifier :

```
ls -d .claude/skills/openspec-* 2>/dev/null
```

- **Présents** → lister les skills trouvés (ils seront repris dans le compte rendu de l'étape 7).
- **Absents** → le delivery mode exclut les skills. **Ne pas** tenter de les écrire à la main (ils
  sont possédés par OpenSpec et versionnés par lui). Guider l'humain, puis rendre la main :

  > Les skills OpenSpec (`.claude/skills/openspec-*`) ne sont pas installés — ton delivery mode est
  > probablement sur `commands` seul. Repasse-le sur `both`, puis relance `/scd-spec-dev:setup` :
  >
  > ```
  > ! openspec config profile
  > ```
  >
  > (choisis un delivery `both` ou `skills`). Au re-jeu, `openspec update` régénère les skills selon
  > ce delivery.

Les skills OpenSpec sont **possédés et versionnés par OpenSpec** : `openspec update` les régénère en
comparant leur version enregistrée et **préserve un skill édité à la main** dont la version
correspond. `/setup` ne les réécrit jamais lui-même.

---

## Étape 3 — Copier la recette de schéma `scd` (propriété du plugin, rafraîchie)

Le schéma `scd` est **possédé par le plugin** : au re-jeu il est **réécrit** depuis la recette portée,
jamais fusionné.

```
mkdir -p openspec/schemas/scd
cp -R "${CLAUDE_PLUGIN_ROOT}/openspec-schema/scd/." openspec/schemas/scd/
```

Puis valider le schéma copié :

```
openspec schema validate scd
```

> **Note de construction (L1) :** la recette de schéma (`schema.yaml` + templates) est écrite au **lot
> L2**. Tant que L2 n'est pas joué, cette copie transporte un dossier encore vide et
> `openspec schema validate scd` n'a rien à valider — c'est attendu. La **mécanique** de copie et de
> validation est en place ; son contenu arrive à L2.

---

## Étape 4 — Accorder `openspec/config.yaml` (schema: scd + bloc balisé)

`config.yaml` est de **propriété mixte** : le plugin possède un **bloc balisé** (`context` / `rules` /
`operations`), l'humain possède **tout le reste**. Au re-jeu, on remplace **uniquement** le contenu du
bloc balisé et on force `schema: scd` ; **aucun édit humain hors du bloc n'est touché**.

Lire le `config.yaml` existant, puis produire un fichier valide qui :

1. porte `schema: scd` en tête (remplacer la valeur `spec-driven` posée par `init`) ;
2. contient **exactement un** bloc balisé, délimité par ces deux lignes de commentaire :

```yaml
schema: scd

# ┌─ scd-spec-dev (généré) ─ ce bloc est réécrit à chaque /setup ; éditez HORS de lui ─┐
context: |
  Vision   : docs/vision.md · Roadmap : docs/roadmap.md (chaque change ↳ une STORY)
  Archi    : modèle LikeC4 docs/architecture/*.c4 (structure) · invariants docs/architecture.md · ADR docs/adr/
  Test     : mode de vérif (tdd / test / observé / aucun) décidé par strategie-verif à la décomposition
  Sécurité : docs/security.md ; valider toute entrée externe, aucun secret en clair
  UX/UI    : docs/design-system.md (+ canvas maître)
  CI       : docs/ci.md fait autorité sur ce qui bloque une PR (ne pas doubler)
rules:
  proposal:
    - Backréférencer l'EPIC / la STORY (docs/roadmap.md) et les FR servis (docs/vision.md).
  design:
    - Vérifier la conformité aux invariants des ADR (docs/adr/).
    - Décision structurante nouvelle → proposer un ADR (docs/adr/), ne pas la figer dans design.md.
    - Citer les éléments LikeC4 touchés par leur FQN (ex. shop.api).
    - Relation nouvelle → éditer le .c4 dans le change, puis `likec4 validate --no-layout --json --project <p> docs/architecture`.
operations:
  archive:
    guidance:
      - Cocher la STORY correspondante dans docs/roadmap.md.
# └─ fin scd-spec-dev ─┘
```

**Règles de fusion :**
- **Premier montage** : si `init` a posé un `context:` / `rules:` / `operations:` par défaut hors
  balises, les **remplacer** par le bloc balisé ci-dessus (ne pas laisser de clés en double).
- **Re-jeu** : ne réécrire **que** l'intérieur des balises. Tout ce que l'humain a ajouté ailleurs
  (autres clés top-level, commentaires, ajouts sous `rules:` hors bloc) est **préservé mot pour mot**.
- Enrichir le `context:` avec ce qui se **lit vraiment** dans le projet : si `CLAUDE.md` ou
  `docs/ci.md` existent, en tirer les commandes et conventions utiles au lieu des libellés génériques.
  Ne rien inventer : un chemin cité doit exister ou être scaffoldé à l'étape 5.

**Les deux lignes LikeC4** — `Archi : modèle LikeC4 docs/architecture/*.c4 …` dans `context` et les
deux règles `design` qui citent les FQN — sont écrites **si et seulement si
`docs/architecture/likec4.config.json` existe une fois l'étape 5 jouée**. Sans modèle, la ligne
`Archi` retombe sur sa forme courte (`invariants dans docs/architecture.md + docs/adr/`) et les deux
règles `design` ne sont pas écrites.

**Pourquoi le disque, et pas la détection du CLI** : le `config.yaml` décrit les **documents du
projet**, pas l'outillage de la machine. Un re-jeu depuis un poste sans `likec4` réécrit le bloc
balisé en entier ; si la condition était « CLI détecté », ce re-jeu **retirerait** des lignes qui
décrivent un modèle bien présent dans le dépôt. Le test `test -f docs/architecture/likec4.config.json`
couvre les deux cas d'un seul geste : le modèle vient d'être posé par l'étape 5, ou il était déjà là.

---

## Étape 5 — Scaffolder les gabarits durables (seulement s'ils manquent)

La **couche durable** est écrite par l'humain (aidé d'OpenSpec) — le plugin ne ré-implémente pas
d'interview. `/setup` pose seulement des **gabarits de départ**, et **uniquement si le fichier est
absent** (un fichier existant n'est jamais touché : `test -f` avant chaque écriture).

| Fichier | Nature | Contenu du stub |
|---|---|---|
| `docs/vision.md` | durable | North star, exigences FR, critères de succès SC, hors-scope |
| `docs/roadmap.md` | durable | epics → stories ; « une story = un change » |
| `docs/architecture/likec4.config.json` | durable | le projet LikeC4 du dépôt (`name` = nom du dépôt) — **LikeC4 seulement** |
| `docs/architecture/model.c4` | durable | le squelette du modèle : `specification` + un `system` vide + `view index` — **LikeC4 seulement** |
| `docs/architecture.md` | cap | la **table** des invariants opposables (`Id · Règle · Éléments (FQN) · Classe · ADR`) |
| `docs/test.md` | cap | pyramide de tests, Definition of Done courte |
| `docs/security.md` | cap | politique + threat model léger |
| `docs/design-system.md` | cap | tokens/composants + lien canvas maître |
| `docs/ci.md` | cap CI | commandes du projet et ce qui bloque une PR — **seulement si absent** |
| `docs/adr/0001-format-adr.md` | immuable | l'ADR qui fixe le format Nygard des ADR suivants |

Contenu des stubs (courts, à compléter par l'humain) :

- **`docs/vision.md`**

  ```markdown
  # Vision

  > PRD court, non technique. À compléter par l'humain.

  ## North star
  ## Exigences (FR)
  - FR1 —
  ## Critères de succès (SC)
  - SC1 —
  ## Hors-scope
  ```

- **`docs/roadmap.md`**

  ```markdown
  # Roadmap

  > epics → stories. **Une story = un change OpenSpec.** Seul durable qui bouge souvent.

  ## EPIC-1 —
  - [ ] STORY-1.1 —
  ```

- **`docs/architecture.md`**

  ```markdown
  # Architecture (cap durable)

  > La **table des invariants opposables** — le référent de la dimension architecture de la review.
  > La structure (*quoi, maintenant*) est dans le modèle LikeC4 `docs/architecture/*.c4` ; le
  > *pourquoi* d'un choix structurant est un ADR (`docs/adr/`), pas ce fichier.

  ## Invariants

  | Id | Règle | Éléments (FQN) | Classe | ADR |
  |---|---|---|---|---|
  | INV1 | `shop.ui` n'importe jamais `shop.orders` | shop.ui, shop.orders | 9 imports prohibés | 0003 |

  > Exemple à remplacer. **Question d'admission** : une règle n'entre dans la table que si elle
  > **nomme des éléments du modèle** et **laisse une trace observable** dans l'arborescence ou les
  > imports (classes 1 à 11 ; les classes 12 à 15 — sémantique, runtime, holistique — n'entrent pas).
  > La colonne `ADR` est remplie par `/scd-spec-dev:adr` ; une ligne sans ADR est un **candidat**,
  > proposé par `/scd-spec-dev:archi` et promu par l'humain.
  ```

- **`docs/test.md`**

  ```markdown
  # Test (cap durable)

  ## Pyramide
  ## Definition of Done
  - [ ] Chaque critère (scénario WHEN/THEN) a un test nommé pour les modes `tdd` / `test`.
  ```

- **`docs/security.md`**

  ```markdown
  # Sécurité (cap durable)

  ## Politique
  - Valider toute entrée externe. Aucun secret en clair.
  ## Threat model (léger)
  ```

- **`docs/design-system.md`**

  ```markdown
  # Design system (cap durable)

  ## Tokens
  ## Composants
  ## Canvas maître
  > Lien Claude Design :
  ```

- **`docs/ci.md`** *(seulement si absent — c'est le cap CI, ne pas le doubler)*

  ```markdown
  # CI (cap durable)

  > Ce qui décide qu'une PR passe. Fait autorité — le `context` de config.yaml pointe ici.

  ## Commandes
  - Test :
  - Lint :
  - Build :
  ## Ce qui bloque une PR
  ```

- **`docs/adr/0001-format-adr.md`** *(créer `docs/adr/` si besoin)*

  ```markdown
  # 0001 — Format des ADR

  - Statut : accepté
  - Date : <AAAA-MM-JJ>

  ## Contexte
  Les décisions structurantes doivent être tracées, immuables, relisibles dans six mois.

  ## Décision
  Chaque décision structurante est un ADR au format Nygard dans `docs/adr/NNNN-titre.md` :
  **Contexte · Décision · Conséquences · Alternatives écartées**. Un ADR accepté est **immuable** ;
  on le remplace par un nouvel ADR qui le supersède, on ne le réécrit pas.

  ## Conséquences
  `design.md` d'un change est **jetable** et cite les ADR contraignants ; il ne les remplace jamais.

  ## Alternatives écartées
  - Consigner les décisions dans les design.md : perdues à l'archivage du change.
  ```

Remplacer `<AAAA-MM-JJ>` par la date du jour.

### Le squelette du modèle LikeC4 (si `LIKEC4 = présent`)

**Sauté et signalé si `LIKEC4 = absent`** (étape 1bis). Comme les autres durables : **écrit seulement
si absent**, jamais réécrit — le modèle appartient à l'humain dès la première ligne qu'il y met.

- **`docs/architecture/likec4.config.json`** — `name` = le nom du dépôt (`basename` du
  `git rev-parse --show-toplevel`). Un seul projet LikeC4 par dépôt ; ce `name` est celui que
  `--project` prend partout ensuite.

  ```json
  {
    "$schema": "https://likec4.dev/schemas/config.json",
    "name": "<nom-du-dépôt>"
  }
  ```

- **`docs/architecture/model.c4`** — `<projet>` est le `name` du dépôt tel quel : un identifiant
  LikeC4 admet les **tirets** (`mon-projet` est valide). Seuls un **point** (séparateur de FQN) et
  une **espace** doivent être remplacés par un tiret.

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

  Le `system` est **vide à dessein** : `/scd-spec-dev:archi` propose les conteneurs depuis
  l'arborescence réelle. Les conventions du plugin — kinds, `sourceDir`, une vue par conteneur, une
  vue `adr-NNNN` par ADR — sont dans le skill `architecture` (`references/modele.md`).

- **Valider immédiatement** ce qui vient d'être posé :

  ```
  likec4 validate --no-layout --json --project <nom-du-dépôt> docs/architecture
  ```

  Code de sortie **1** ⇒ remonter la sortie `{ valid, errors[{message, file, line}] }` telle quelle à
  l'humain. Le squelette ci-dessus est validé en `1.59.3` : un échec signale un modèle déjà présent
  et cassé, pas le squelette.

### Le script de conformité code ↔ modèle (si `docs/architecture/likec4.config.json` existe)

**Même condition que les étapes 4, 6 et 6bis** — le disque, pas le CLI : la copie n'a besoin d'aucun
binaire, et un re-jeu depuis un poste sans `likec4` doit la rafraîchir comme les autres. Sans
`likec4.config.json`, rien n'est copié.

Le script est **possédé par le plugin**, sur le patron du schéma `scd` (étape 3) : au re-jeu il est
**réécrit** depuis la recette portée, jamais fusionné — une copie éditée à la main est écrasée.

```
mkdir -p .claude/scripts
cp "${CLAUDE_PLUGIN_ROOT}/scripts/scd-arch-conformance.mjs" .claude/scripts/
```

Ce qu'il fait : exporte le modèle (`likec4 export json --skip-layout --project <nom>`), rattache
chaque fichier du diff à un élément par son `sourceDir` (préfixe le plus long), extrait les imports
(JS/TS, Python, Go, Dart, Rust) et exige pour chaque frontière d'élément franchie une relation du
modèle **dans le bon sens** ; sortie JSON, code 1 si findings. Ses quatre limites — alias de chemins,
barrels, imports dynamiques calculés, cycles transitifs — sont dans son en-tête. **Pourquoi une copie
et pas un chemin vers le plugin** : le Bash d'un agent ne substitue pas `${CLAUDE_PLUGIN_ROOT}`, or
c'est `.claude/quality.json` qui l'appelle (`node .claude/scripts/scd-arch-conformance.mjs …`, le
check `architecture` proposé par `/scd-spec-dev:quality-setup`).

---

## Étape 6 — Poser le filet CI (grep des escape-hatches)

Le **seul garde-fou automatique** de ce plugin (il n'y a **aucune garde de session**) : un job CI,
**hors de la boucle de dev**, qui échoue si un escape-hatch entre dans le code. Contenu **possédé par
le plugin**, géré en **bloc balisé** ; le reste du fichier de CI est préservé.

Détecter le système de CI :

- **GitHub Actions** (`.github/` présent, ou remote GitHub via `git remote -v`) → écrire/rafraîchir le
  fichier dédié `.github/workflows/scd-escape-hatch-guard.yml` avec le contenu ci-dessous (fichier
  entièrement possédé par le plugin — le réécrire tel quel au re-jeu).
- **GitLab CI** (`.gitlab-ci.yml` présent) → insérer/rafraîchir, dans ce fichier, **uniquement** le
  bloc délimité par `# >>> scd-spec-dev:escape-hatch-guard >>>` et `# <<< scd-spec-dev <<<`,
  définissant les **deux** jobs équivalents ; **tout le reste du fichier est préservé**. Le second
  job n'est écrit que si `docs/architecture/likec4.config.json` existe :

  ```yaml
  # >>> scd-spec-dev:escape-hatch-guard >>>
  escape-hatch-guard:
    image: alpine:latest
    script:
      - apk add --no-cache git
      - |
        if git grep -nIE '@ts-ignore|(^|[^[:alnum:]])as any([^[:alnum:]]|$)|eslint-disable|\.skip\(|# noqa|--no-verify' \
             -- ':!.gitlab-ci.yml' ':!openspec/**' ':!docs/**' ':!*.md'; then
          echo "escape-hatch détecté (voir lignes ci-dessus)."; exit 1
        fi
        echo "OK — aucun escape-hatch."

  likec4-validate:
    image: node:22
    script:
      - |
        if [ ! -f docs/architecture/likec4.config.json ]; then
          echo "Pas de docs/architecture/likec4.config.json — rien à valider."; exit 0
        fi
        PROJECT=$(node -p "require('./docs/architecture/likec4.config.json').name")
        npx --yes likec4@1.59.3 validate --no-layout --json --project "$PROJECT" docs/architecture
  # <<< scd-spec-dev <<<
  ```

  (`node -p` remplace `jq`, absent de l'image `node:22`.)
- **Aucun des deux** → écrire le workflow GitHub Actions par défaut et **le signaler** à l'humain
  (« adapte ce job à ta CI si tu n'utilises pas GitHub Actions »).

Contenu de `.github/workflows/scd-escape-hatch-guard.yml` :

```yaml
# Généré par scd-spec-dev:setup — filet CI (grep des escape-hatches), hors boucle de dev.
# Le seul garde-fou automatique du plugin : la rigueur vit dans la review, pas dans des hooks.
name: escape-hatch-guard
on: [push, pull_request]
jobs:
  escape-hatch-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Grep escape-hatches
        run: |
          # Échoue si un escape-hatch est présent dans le code suivi.
          # Exclut la doc, openspec/ et .github/ (qui contient ces jetons comme MOTIF de recherche).
          if git grep -nIE '@ts-ignore|(^|[^[:alnum:]])as any([^[:alnum:]]|$)|eslint-disable|\.skip\(|# noqa|--no-verify' \
               -- ':!.github/**' ':!openspec/**' ':!docs/**' ':!*.md'; then
            echo "::error::escape-hatch détecté (voir lignes ci-dessus). À retirer, ou déroger explicitement dans la review."
            exit 1
          fi
          echo "OK — aucun escape-hatch."

  # Ce job n'est écrit que si docs/architecture/likec4.config.json existe (dimension architecture).
  likec4-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Valider le modèle LikeC4
        run: |
          # Garde : sans modèle, le job passe sans rien faire (le dépôt peut ne pas en avoir encore).
          if [ ! -f docs/architecture/likec4.config.json ]; then
            echo "Pas de docs/architecture/likec4.config.json — rien à valider."
            exit 0
          fi
          PROJECT=$(jq -r '.name' docs/architecture/likec4.config.json)
          npx --yes likec4@1.59.3 validate --no-layout --json --project "$PROJECT" docs/architecture
```

**Le job `likec4-validate` n'est écrit que si `docs/architecture/likec4.config.json` existe** — même
condition que les lignes LikeC4 de l'étape 4, et pour la même raison (c'est l'état du dépôt qui
commande, pas l'outillage du poste). Écrit, il porte **en plus** sa propre garde `test -f` : un
modèle supprimé plus tard rend le job passant, pas rouge.

**`npx --yes likec4@1.59.3`, pas `npm i -g likec4`** : la version est épinglée **dans la commande
elle-même**, au même endroit que ce qu'elle valide — un `npm i -g` sans version dériverait
silencieusement d'une mineure à l'autre, et un `npm i -g likec4@1.59.3` coûterait une ligne de plus
pour le même téléchargement. `jq` est préinstallé sur `ubuntu-latest`, et le `likec4.config.json`
posé à l'étape 5 est du JSON simple (LikeC4 accepte le JSON5 ; si l'humain y met un commentaire, `jq`
échoue et le job le dit franchement).

Les jetons détectés : `@ts-ignore`, `as any`, `eslint-disable`, `.skip(`, `# noqa`, `--no-verify`.
C'est un **filet** grossier (il rattrape ce qui est entré hors session), pas une serrure fine : la
review reste le juge de la pertinence.

---

## Étape 6bis — Déclarer le serveur MCP `likec4` dans le `.mcp.json` du projet

**Sauté si `docs/architecture/likec4.config.json` n'existe pas** (rien à interroger).

Le serveur est déclaré **par le projet**, jamais par le plugin : un serveur déclaré par un plugin
démarre dans le **répertoire du plugin** et pour **tous** les projets qui l'activent, modèle ou pas.
Dans le `.mcp.json` du projet, le répertoire courant est la racine du projet, et
`docs/architecture` s'y résout.

La clé à poser, **exactement** :

```json
{
  "mcpServers": {
    "likec4": {
      "command": "likec4",
      "args": ["mcp", "docs/architecture"]
    }
  }
}
```

Pas de `env` : `LIKEC4_WORKSPACE` est inutile puisque `likec4 mcp` accepte le répertoire **en
argument** (`likec4 mcp --help` : *path `<directory>` with LikeC4 sources, default is current
directory or `LIKEC4_WORKSPACE`*), et le `${workspaceFolder}` que montre la doc LikeC4 est une
variable **VS Code**, que Claude Code ne substitue pas. Transport **stdio** par défaut, c'est celui
qu'on veut. Et `likec4 mcp`, **jamais** `npx @likec4/mcp` : le paquet séparé pèse 408 Mo installés
contre 121 pour le CLI.

**La mécanique de fusion — la seule chose qui compte ici : ne jamais perdre un autre serveur.**

1. `test -f .mcp.json`.
2. **Fichier absent** → `Write` le fichier entier, avec le seul objet ci-dessus.
3. **Fichier présent** → le **`Read`** d'abord, toujours, puis :
   - pas de clé `mcpServers` → `Edit` pour ajouter l'objet `mcpServers` avec la seule clé `likec4`,
     les autres clés top-level du fichier laissées **mot pour mot** ;
   - `mcpServers` sans clé `likec4` → `Edit` pour **insérer** la seule entrée `likec4` dans cet
     objet, sans toucher à ses voisines ;
   - `mcpServers` avec une clé `likec4` → `Edit` pour **remplacer sa valeur** par l'objet ci-dessus
     (elle est possédée par le plugin, elle se rafraîchit) ; les voisines ne bougent pas.
4. **Ne jamais `Write` par-dessus un `.mcp.json` existant.** Réécrire le fichier entier, même « à
   l'identique plus une clé », est la façon dont on perd un serveur, un commentaire ou un ordre de
   clés. L'édition est **chirurgicale** : une clé entre, les autres ne sont pas relues.

Signaler à l'humain que le serveur MCP est déclaré mais **pas encore chargé** : Claude Code lit
`.mcp.json` au démarrage de la session, et demande une approbation la première fois.

---

## Étape 7 — Rendre compte

Afficher un récapitulatif court :

- version d'OpenSpec détectée ;
- premier montage (`init`) ou re-jeu (`update`) ;
- skills OpenSpec présents (`.claude/skills/openspec-*`) — les lister, ou signaler le delivery mode à
  corriger s'ils manquent ;
- schéma `scd` copié + résultat de `openspec schema validate scd` ;
- `config.yaml` accordé (bloc balisé posé/rafraîchi) ;
- gabarits durables **créés** (liste) vs **laissés intacts car présents** (liste) ;
- filet CI posé (système détecté, chemin du fichier) ;
- **LikeC4** : version détectée, ou **sauté et signalé** (répéter le guidage `npm i -g likec4`,
  Node ≥ 22.22.3) ; le cas échéant, la collision de nom sur `.claude/skills/likec4-dsl` ;
- **artefacts d'architecture** : `docs/architecture/likec4.config.json` et `model.c4` **créés** ou
  **laissés intacts car présents**, résultat de `likec4 validate`, `docs/architecture.md` (table),
  clé `likec4` du `.mcp.json` (ajoutée / rafraîchie / sautée), script de conformité
  `.claude/scripts/scd-arch-conformance.mjs` (copié / rafraîchi / sauté), job CI `likec4-validate`
  (posé / sauté).

Puis la **prochaine action** : amorcer le modèle avec `/scd-spec-dev:archi` si le squelette vient
d'être posé, puis ouvrir un premier change avec `/opsx:propose "<idée>"` (relire) et
`/scd-spec-dev:tickets` pour décomposer.

## Table d'idempotence (le contrat de rejouabilité)

| Artefact | Propriétaire | Règle au re-jeu |
|---|---|---|
| Échafaudage OpenSpec + **données** (`changes/`, `specs/`) | OpenSpec / le projet | **jamais** re-`init` ; `openspec update` + santé `openspec list` |
| Skills + commandes OpenSpec (`.claude/skills/openspec-*`, `.claude/commands/opsx/`) | **OpenSpec** (delivery `both`) | posés par `init`, régénérés par `update` (versionnés, édits préservés) ; `/setup` **vérifie** leur présence, ne les écrit jamais |
| Schéma `scd` (`openspec/schemas/scd/`) | **le plugin** | **rafraîchi** (réécrit depuis la recette portée) |
| `config.yaml` (`context` / `rules` / `operations`) | mixte | **bloc balisé** réécrit, édits humains hors bloc préservés ; `schema: scd` forcé |
| Filet CI | le plugin | fichier dédié réécrit (GitHub) ou **bloc balisé** (GitLab), reste préservé |
| Gabarits durables (vision, roadmap, caps, adr/0001) | l'humain | écrits **seulement si absents** |
| Modèle LikeC4 (`docs/architecture/*.c4`, `likec4.config.json`) | **l'humain** | écrits **seulement si absents** ; un modèle existant n'est ni réécrit ni reformaté, seulement **validé** |
| Serveur `likec4` du `.mcp.json` | **le plugin** (la clé), le projet (le fichier) | la clé `likec4` est **réécrite** ; toute autre clé, et tout le reste du fichier, **préservés mot pour mot** |
| Script de conformité (`.claude/scripts/scd-arch-conformance.mjs`) | **le plugin** | **rafraîchi** (recopié depuis `${CLAUDE_PLUGIN_ROOT}/scripts/`, comme le schéma `scd`) ; une copie éditée à la main est écrasée |
