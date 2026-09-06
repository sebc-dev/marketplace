---
description: "Monte OpenSpec dans le projet cible et l'accorde au schéma scd de ce plugin, en UNE passe rejouable. DÉTECTE OpenSpec sans jamais l'installer (le repli npx n'existe pas : les /opsx:* appellent `openspec` nu, allowed-tools scellé sur Bash(openspec:*) — exiger `openspec` sur le PATH est le seul montage viable) : absent, elle s'arrête en guidant vers `npm i -g @fission-ai/openspec@latest`. Présente, elle pose l'échafaudage (`openspec init --tools claude`, jamais re-init : au re-jeu `openspec update`), copie la recette de schéma scd portée par le plugin dans openspec/schemas/scd/, accorde openspec/config.yaml (schema: scd + un bloc context/rules balisé, édits humains préservés), scaffolde les gabarits durables (vision, roadmap, caps, adr/0001) seulement s'ils manquent, et pose le filet CI grep des escape-hatches. Idempotente par artefact : chaque artefact a un propriétaire et une règle au re-jeu."
argument-hint: "(aucun — détecte, monte, rejouable)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
  - Bash(openspec:*)
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
  Archi    : invariants dans docs/architecture.md + docs/adr/
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

---

## Étape 5 — Scaffolder les gabarits durables (seulement s'ils manquent)

La **couche durable** est écrite par l'humain (aidé d'OpenSpec) — le plugin ne ré-implémente pas
d'interview. `/setup` pose seulement des **gabarits de départ**, et **uniquement si le fichier est
absent** (un fichier existant n'est jamais touché : `test -f` avant chaque écriture).

| Fichier | Nature | Contenu du stub |
|---|---|---|
| `docs/vision.md` | durable | North star, exigences FR, critères de succès SC, hors-scope |
| `docs/roadmap.md` | durable | epics → stories ; « une story = un change » |
| `docs/architecture.md` | cap | invariants d'architecture (référent des ADR d'archi) |
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

  > Invariants d'architecture. Référent des ADR d'archi. Le *pourquoi* d'un choix structurant
  > reste un ADR (docs/adr/), pas ce fichier.

  ## Invariants
  - INV1 —
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
  définissant un job équivalent ; **tout le reste du fichier est préservé**.
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
```

Les jetons détectés : `@ts-ignore`, `as any`, `eslint-disable`, `.skip(`, `# noqa`, `--no-verify`.
C'est un **filet** grossier (il rattrape ce qui est entré hors session), pas une serrure fine : la
review reste le juge de la pertinence.

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
- filet CI posé (système détecté, chemin du fichier).

Puis la **prochaine action** : ouvrir un premier change avec `/opsx:propose "<idée>"` (relire), puis
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
