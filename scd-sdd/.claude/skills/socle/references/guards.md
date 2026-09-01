# Référence — Les gardes (`.claude/guards.json`, `docs/ci.md`)

**Deux points de chargement.** `/scd-sdd:guards` la charge **intégralement**. `/scd-sdd:init` ne
charge que le bloc `<ci-md>`, pour le gabarit de `docs/ci.md` — elle ne pose aucun garde
elle-même, elle appelle la commande qui le fait.

<role>

Le cycle ne valide plus les documents par des gates : il **surveille l'agent pendant qu'il
travaille**. C'est le même budget de rigueur, dépensé là où il change quelque chose (`DECISIONS.md`
§D41).

**Ce qu'on garde, et pourquoi c'est ça.** Le terrain de §D22 est sans ambiguïté : un agent a
contourné des hooks pre-commit par `--no-verify`, `git stash` et flags silencieux sur **six commits
consécutifs**, malgré des règles `CLAUDE.md` explicites. Un texte que l'agent lit ne le contraint
pas. **La défense doit venir de l'extérieur de l'agent.**

**Le partage plugin / projet.** Le plugin porte le **script** — le mécanisme, identique partout. Le
projet porte la **liste** — `.claude/guards.json`, qu'il écrit et possède. Le plugin ne devine
jamais ce qu'un projet protège. C'est la restriction que §D41 pose nommément sur §D22 (et sur
l'écarté n° 4 de §D40) : la maxime *le plugin écrit la recette, le projet porte le mécanisme* vaut
pour ce qui s'exécute **sur le code du projet** ; un garde de session s'exécute **sur l'agent**, et
c'est le plugin qui fournit l'agent.

**La trace est le livrable ; le blocage n'en est que la conséquence.** `.claude/guard-log.jsonl`
consigne chaque tentative — date, outil, fichier, règle, extrait. La question à laquelle le
dispositif répond n'est pas *l'a-t-on empêché ?* mais **l'a-t-il essayé ?** Un blocage silencieux
détruit cette information.

</role>

<couches>

| # | Où | Teste | Sans `guards.json` | Avec |
|---|---|---|---|---|
| 1 | `PreToolUse` `Edit\|Write\|NotebookEdit\|MultiEdit` | le **chemin**, sous la racine du projet | silence | **bloque** + trace |
| 1b | `PreToolUse` `Bash` | un verbe d'écriture, ou une redirection, **visant** un chemin protégé | silence | **bloque** + trace |
| 2 | `PreToolUse` `Edit\|Write` | le **contenu écrit**, et seulement ce qui est **introduit** | **avertit** + trace | **bloque** + trace |
| 2b | `PreToolUse` `Bash` | un motif **déversé** dans un fichier du projet (redirection, heredoc) | **avertit** + trace | **bloque** + trace |
| 3 | job CI | le **diff** de la PR | — | posé par `/scd-sdd:guards` |
| — | `block-adr-edits.sh` | réécriture d'un ADR **existant** | **bloque** | **bloque** |

**La couche 2b existe parce qu'un garde qui ne couvre qu'une surface DÉPLACE le geste au lieu de le
réduire** — constat d'usage réel, pas hypothèse : bloqué en `Edit`, le réflexe suivant est
`echo … >> src/a.ts`. Elle est volontairement étroite — seulement ce qui **déverse** du texte dans un
fichier du projet —, pour qu'un `grep` qui cherche le motif et un `sed -i` qui le **retire** ne
déclenchent rien.

**La couche 2 est celle qui compte.** Elle vise un fichier que l'agent a parfaitement le **droit**
d'éditer — son propre code —, ce qui la rend structurellement invisible à la couche 1. C'est le
mode 2 de la grille de §D25, *le plus attrapable de tous*, et il n'était couvert par aucun contrôle
local avant elle.

**L'asymétrie du régime sans opt-in est délibérée.** Les motifs de la couche 2 (`@ts-ignore`,
`as any`, `.skip(`, `--no-verify`…) n'ont pas besoin de connaître le projet pour être justes : les
taire par défaut coûterait plus qu'ils ne dérangent. Les chemins protégés, eux, sont **entièrement**
une décision de projet : sans liste, la couche 1 se tait complètement.

</couches>

<template>

`.claude/guards.json` — écrit par `/scd-sdd:guards`, **possédé par le projet**.

```jsonc
{
  "protected": [
    ".github/workflows/**",          // chaîne CI
    ".husky/**",                     // hooks de commit
    "[config de typage]",            // ex: tsconfig*.json, pyproject.toml, go.mod
    "[config de lint]",              // ex: eslint.config.*, .ruff.toml
    "[config de test]",              // ex: vitest.config.*, jest.config.*, pytest.ini
    ".claude/review.json",           // OPTIONNEL — liste review possédée par le projet, si présente
    {"glob": "[globs de test]", "mode": "no-rewrite"}   // OPTIONNEL — voir <arbitrage-tests>
  ],
  "weakening": {
    "block": true,
    "allow": [
      // Une dérogation SANS `raison` est ignorée par le hook. Ce n'est pas un contrôle
      // de forme : sans motif écrit, personne n'a eu à défendre pourquoi.
      {"motif": "as-any", "chemin": "src/legacy/**", "raison": "portage, ADR-0007"}
    ],
    "exclude": [
      // Des CHEMINS que la couche 2 ne juge pas du tout — pour du contenu qui CITE les
      // motifs sans les appliquer. `*.md`, `*.txt`, `*.rst` et `docs/**` le sont déjà
      // d'office, comme `verifier-guard` les exclut en CI, et pour la même raison : un
      // document qui décrit un garde le cite forcément. Même exigence de `raison`.
      {"chemin": "tools/lint-rules/**", "raison": "règles qui citent les motifs traqués"}
    ]
  },
  "log": ".claude/guard-log.jsonl"
}
```

**Deux modes, et un seul est sûr par défaut.** `strict` — toute écriture est bloquée. `no-rewrite` —
la **création** passe, la réécriture d'un fichier existant est bloquée ; c'est la sémantique des
ADR, et la seule qui laisse un agent produire un fichier neuf sous un chemin gardé. Une entrée
écrite en chaîne vaut `strict`.

⚠️ **Trois chemins sont protégés en dur dès que le fichier existe**, cités ou non par la liste :
`.claude/guards.json`, `.claude/guard-log.jsonl`, `.claude/settings.json`. Un agent ne doit pouvoir
ni éditer sa propre laisse, ni effacer la trace de ses tentatives.

⚠️ **`docs/adr/` n'entre PAS dans `protected`.** `block-adr-edits.sh` les traite déjà, avec la
distinction création/réécriture que la phase `adr` exige. Les y remettre en `strict` interdirait
d'écrire un ADR.

**`.claude/review.json` — protège-le si le projet l'utilise.** C'est la liste des skills/MCP
pertinents pour la review (lue par `review-context`), **possédée par le projet** et qui **fait
autorité**. Un agent en plein run ne doit pas pouvoir s'amender la pertinence de sa propre review —
même motif que `guards.json`. Il n'est **pas** protégé en dur (opt-in, comme le fichier lui-même) :
si le fichier existe, ajoute-le à `protected`.

</template>

<arbitrage-tests>

**Protéger les fichiers de test est une décision de projet, et elle a un coût réel.** À poser à
l'humain, jamais à trancher seul.

- **Si l'humain écrit les tests** — protège-les en `strict`. C'est le cas le plus fort du
  dispositif : le test est l'oracle, et un oracle que l'agent peut réécrire n'est plus un oracle.
- **Si `/scd-sdd:run` les écrit** — ne les protège pas en `strict`. L'agent `test-writer` les crée
  puis les corrige jusqu'à ce qu'ils échouent pour la bonne raison ; `strict` casserait la boucle
  au premier ajustement. Le mode `no-rewrite` ne suffit pas non plus.
  **Le niveau implémentation porte déjà l'invariant, mécaniquement** : `implementer` et
  `fix-applier` vérifient que `git diff -- <tests>` reste vide et **restaurent** le fichier sinon.
  La couche 3 (CI) le confirme sur le diff de la PR.
- **Cas mixte** — protège les tests que l'humain a écrits par un glob distinct
  (`tests/acceptance/**`), pas la totalité.

Ce que le choix ne change pas : la couche 2 attrape `.skip(` et `.only(` **partout**, y compris
dans un test non protégé.

</arbitrage-tests>

<derivation>

**Dériver la liste, jamais la recopier.** Trois questions, dans cet ordre — chacune se répond en
lisant le dépôt, pas en supposant l'écosystème.

1. **Qu'est-ce qui décide qu'une PR passe ?** Les workflows de `.github/workflows/` (ou l'équivalent
   de la forge). Tout ce qui y est cité est un candidat.
2. **Qu'est-ce qui règle la sévérité de ces contrôles ?** Les fichiers de config qu'ils lisent —
   typage, lint, tests, seuils de couverture, fichiers d'ignore. C'est là que se joue
   l'*abaissement de seuil*, que la couche 2 ne sait pas voir (comparer des nombres n'est pas
   gréper un motif) : **la couche 1 est son seul garde local.**
3. **Qu'est-ce qui empêcherait le contrôle de tourner du tout ?** `.husky/`, `.pre-commit-config.yaml`,
   les `Makefile`/`justfile` qui portent les commandes de vérification.

| Écosystème | Typage | Lint | Tests / seuils |
|---|---|---|---|
| JS/TS | `tsconfig*.json` | `eslint.config.*`, `.eslintrc*`, `biome.json` | `vitest.config.*`, `jest.config.*` |
| Python | `mypy.ini`, `pyrightconfig.json`, `pyproject.toml` | `.ruff.toml`, `.flake8`, `pyproject.toml` | `pytest.ini`, `.coveragerc` |
| Go | `go.mod` | `.golangci.yml` | — |
| Rust | `Cargo.toml`, `rust-toolchain.toml` | `clippy.toml` | `Cargo.toml` |
| JVM | `build.gradle*`, `pom.xml` | `detekt.yml`, `checkstyle.xml` | idem build |
| Dart | `analysis_options.yaml` | idem | `dart_test.yaml` |

Un `pyproject.toml` ou un `Cargo.toml` porte typage, lint **et** build : le protéger bloque aussi
l'ajout d'une dépendance. Le dire à l'humain avant de l'inscrire.

</derivation>

<ci>

**La couche 3 est reprise, pas réinventée** — les trois contrôles d'intégrité de §D25 sont
inchangés, et **les noms de job ne se renomment jamais** : ce sont des checks requis, et un
renommage laisse un check fantôme qui bloque toutes les PR.

| Job | Portée | Signal |
|---|---|---|
| `verifier-guard` | fichiers de **source**, tests et docs **exclus** | un neutralisant de typage, de lint ou de SAST **ajouté** |
| `test-integrity` | fichiers de **test** | test supprimé ou vidé · `skip`/`only`/`xfail` ajouté · plus d'assertions retirées qu'ajoutées |
| `quality-config-guard` | fichiers de **config** | diff sur la sévérité, les seuils, les fichiers d'ignore |

**L'exclusion des tests par `verifier-guard` n'ouvre pas de trou** — `test-integrity` les couvre — et
elle est ce qui maintient le taux de faux positifs nul des deux côtés. Elle l'empêche aussi de **se
bloquer lui-même** : `docs/ci.md` cite `@ts-ignore` pour le documenter.

```bash
base="$BASE_SHA"                                   # divergence avec la branche par défaut
SRC=( '*.ts' '*.tsx' ':(exclude)**/*.test.*' ':(exclude)**/*.spec.*' \
      ':(exclude)tests/**' ':(exclude)docs/**' ':(exclude)*.md' )
MOTIFS='@ts-(ignore|nocheck|expect-error)|as any|as unknown as|eslint-disable|nosemgrep|# *nosec'
git diff "$base"...HEAD -- "${SRC[@]}" | grep '^+' | grep -v '^+++' | grep -nE "$MOTIFS" \
  && { echo "⛔ Un vérificateur est éteint sur une ligne de source." >&2; exit 1; }
exit 0
```

**Les motifs se dérivent par écosystème, ils ne s'inventent pas.** Ce qui n'est pas connu reste
`[à compléter]`. Une cellule vide se lit `—` quand l'écosystème n'a pas ce levier : un compilateur
Go ou Rust ne s'éteint pas par annotation, seul son lint le fait.

**Les deux soupapes ne sont pas la même, et c'est le point.** Pour `quality-config-guard`, un scope
de commit explicite (`chore(ci):`) suffit : il rend le geste **visible**. Pour `verifier-guard`, il
ne suffit pas — **l'agent écrit `chore(types):` aussi facilement qu'il écrit `as any`** : la soupape
doit rendre le geste **impossible à l'agent**, parce que la menace visée *est* l'agent. C'est la
**signature du commit** (§D26), accompagnée par `/scd-sdd:signer`. Le plugin **n'exécute aucune
cryptographie** : il écrit le workflow qui la vérifie.

**La protection de branche est le backstop.** Sans elle, tout ce qui précède est informatif :
checks requis, bypass interdit, force-push et suppression interdits. `/scd-sdd:guards` **rend la
commande, elle ne la joue pas** — c'est le dépôt de l'humain.

La recette, pour GitHub (forge par défaut) — **un ruleset porte les quatre garanties d'un coup** :
checks requis (`required_status_checks`), suppression et force-push interdits (`deletion`,
`non_fast_forward`), bypass interdit (aucun `bypass_actors`). À rendre prête à coller, en
remplaçant `<o>/<r>` et en listant **les noms de jobs requis à l'identique** de `<ci-md>` :

```bash
gh api --method POST repos/<o>/<r>/rulesets -H "Accept: application/vnd.github+json" --input - <<'JSON'
{
  "name": "défaut — checks requis",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_status_checks", "parameters": {
      "strict_required_status_checks_policy": true,
      "required_status_checks": [
        { "context": "build" }, { "context": "test" }, { "context": "sca" },
        { "context": "secrets" }, { "context": "sast" }, { "context": "test-integrity" },
        { "context": "quality-config-guard" }, { "context": "verifier-guard" },
        { "context": "workflow-integrity" }, { "context": "dependency-review" }
      ] } }
  ]
}
JSON
```

⚠️ **Le corps passe en JSON par `--input -`, jamais en `-F 'rules[][…]'` répétés.** `gh api`
**n'agrège pas** ces `-F` dans un même objet de règle : il crée une règle orpheline par ligne, et
GitHub répond **422 — `data matches no possible input`** sur chaque contexte. Le faux positif est
qu'un agent qui compose la commande lui-même retombe naturellement sur cette forme cassée.
Corollaire : l'API `rulesets` accepte les contextes **par leur nom**, sans run préalable — la note
« laisser le workflow tourner sur `pull_request` d'abord » ne vaut que pour le menu déroulant de
l'**interface**, pas pour cette commande.

</ci>

<ci-md>

Le gabarit de `docs/ci.md`. **Deux écrivains, deux portées, et elles ne se recouvrent pas** :
`/scd-sdd:init` écrit le document et toutes ses sections **sauf une** ; `/scd-sdd:guards` écrit et
rafraîchit la seule `## Gardes de session`.

⚠️ La section des gardes **pointe** vers `.claude/guards.json` et ne le restitue jamais : deux
sources pour un même fait, et la copie dérive au premier ajout (§D29, §D37).

```markdown
# Contrôles CI — [Projet]
Statut : Actif | Créé : [AAAA-MM-JJ] | Forge : [GitHub Actions]

## Commandes du projet
| Rôle | Commande |
|---|---|
| Build | [ex: npm run build] |
| Typage | [ex: tsc --noEmit] |
| Tests | [ex: npm test] |
| Couverture | [ex: npm test -- --coverage] |
| Lint / format | [ex: npm run lint] |
| Audit des dépendances | [ex: npm audit --audit-level=high] |

## Contrôles
| # | Job | Contrôle | Portée | Statut | Mode couvert |
|---|---|---|---|---|---|
| 1 | `build` | Build + typage strict | diff + dépôt | Bloquant | **vérificateur** — cible du mode 2 |
| 2 | `test` | Tests + couverture différentielle | code nouveau | Bloquant (≥ N%) | **vérificateur** — l'oracle, cible du mode 1 |
| 3 | `sca` | SCA sur lockfile | dépôt entier | Bloquant | 3 — **CVE connues seulement** |
| 4 | `secrets` | Secrets vérifiés | dépôt entier | Bloquant | **vérificateur** — cible du mode 2 |
| 5 | `sast` | SAST haute-confiance | diff | Bloquant (high) | **vérificateur** — cible du mode 2 |
| 6 | `test-integrity` | Intégrité des tests | diff des tests | Bloquant | 2 — dans les tests |
| 7 | `quality-config-guard` | Config qualité figée | diff | Bloquant | 2 — par la config |
| 8 | `verifier-guard` | Garde anti-suppression | diff des **sources** | Bloquant | 2 — typage, lint, SAST éteints |
| 9 | `workflow-integrity` | Actions épinglées par SHA | `.github/workflows` | Bloquant | 3d — tag déplacé |
| 10 | `dependency-review` | Revue des dépendances sur le diff | lockfile + manifeste | Bloquant | 3a, 3c |
| 11 | — (résolveur) | Cooldown de dépendances | installation | Bloquant (déclaratif) | 3a, 3b |
| — | `arch-invariants` | Invariants venus des ADR | diff | Informatif → bloquant après mesure | 5 |
| — | `lint` | Style | diff | Informatif | **vérificateur** |
| — | `ablation` | Ablation no-op (nocturne) | dépôt | Informatif | 4 — building to the test |

Le contrôle 11 n'est pas un job : c'est une **clé de configuration** du gestionnaire de paquets,
et c'est `quality-config-guard` qui garde son abaissement.

## Registre des ADR vérifiés en CI
| ADR | Invariant | Contrôle | Statut |
|---|---|---|---|
| [ADR-0003] | [ex : aucun import de `db/` hors de `server/`] | `arch-invariants` | Informatif depuis [date] |

## Gardes de session
<!-- Écrite et rafraîchie par /scd-sdd:guards, jamais par /scd-sdd:init. -->
Périmètre : **`.claude/guards.json`** — source unique, ne pas recopier ici.
Couche 1 (chemins) : [posée le AAAA-MM-JJ | absente]
Couche 2 (affaiblissement) : [bloquante | avertissement seul]
Trace : `.claude/guard-log.jsonl` — [N] tentatives depuis [date]
Dérogations : [N, chacune avec sa raison dans guards.json | aucune]

## Protection de branche
Branche : `[défaut]` · Checks requis : `[noms de jobs, à l'identique]`
Bypass : **interdit** ("Do not allow bypassing") · Force-push et suppression : interdits
État : **[posée le AAAA-MM-JJ | À POSER — sans elle, tout ce qui précède est informatif]**

## Ce que ces contrôles ne couvrent pas
[Une puce par trou, **nommé sur ce projet**. Les crochets sont des amorces : le trou générique est
déjà connu, ce qui manque est son instance ici.]
- **L'oracle faux.** Aucun outil ne connaît l'intention.
  [Où, dans ce projet, un test vert ne prouverait rien : quel comportement, quel oracle.]
- **L'invariant non formalisé.** Un contrôle maison ne vaut que sa liste.
  [Quelles décisions d'ADR ne sont encore traduites en aucune règle.]
- **Le *building to the test* « propre ».**
  [Quel artefact de ce projet pourrait satisfaire un contrôle sans remplir l'exigence.]
- **Ce que le SAST ne modélise pas** : la logique métier et l'autorisation.
  [Les endroits de ce projet où une décision d'autorisation se prend — IDOR.]
- **Le contournement par une forme non reconnue.** La couche 1b des gardes lit une ligne de
  commande ; un agent déterminé passera à côté.
- **`python3` absent** : les couches 1 et 2 ne tournent pas, sans message. Seule la CI reste.
- Et la réserve qui vaut pour tous les gardes greppables, à écrire telle quelle : **réprimer un
  comportement peut le rendre plus subtil plutôt que l'éliminer.** Aucune mesure publiée ne
  tranche. Ces contrôles réduisent une surface, ils ne ferment pas le sujet.
```

</ci-md>

<limites>

À dire à l'humain, jamais à taire.

- **`python3` absent = aucune protection locale, et sans message.** Les hooks ne peuvent pas
  s'annoncer s'ils ne démarrent pas. `/scd-sdd:guards` le contrôle explicitement ; la couche 3 est
  le rattrapage.
- **La couche 1b est best-effort.** Elle découpe la ligne comme un shell (`shlex`), relie une
  redirection à SA cible et un verbe aux opérandes de SON segment (une copie à sa seule
  destination), et inspecte la charge utile d'un `-c`. Une variable, un `xargs`, un nom construit à
  l'exécution lui échappent toujours.
- **La couche 2b est plus étroite encore.** Elle ne s'arme que sur un **déversement** — redirection
  ou heredoc. Un `sed -i` qui INSÈRE un neutralisant n'est pas couvert, et c'est délibéré : la même
  forme sert à en RETIRER un, et la bloquer interdirait le nettoyage.
- **Une exclusion `weakening.exclude` est un trou déclaré.** Elle porte sa `raison`, elle se relit,
  et elle vaut mieux qu'un faux positif qui apprend à l'agent que le garde se trompe — mais elle
  reste un trou, et rien ne la rappelle à la relecture d'une PR.
- **Un `guards.json` illisible n'ouvre pas les gardes** : les trois chemins protégés en dur tiennent
  et le hook avertit. Un JSON cassé serait sinon le contournement le plus simple du dispositif.
- **Rien de tout ceci ne remplace la relecture.** La couche 2 attrape le geste grossier ; elle ne
  voit pas un test dont l'assertion est vraie par construction.

</limites>
