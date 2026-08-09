# Référence — Contrôles CI (`docs/ci.md`)

<role>
Répond à **comment on garantit** ce que `CLAUDE.md` ne peut que conseiller. Les contrôles se dérivent
d'une **grille de modes de défaillance** — ce contre quoi on se défend — et la Stack ne décide que de
l'outil qui les rend : on trace vers elle, on ne la choisit pas ici. Produit deux artefacts —
`docs/ci.md`, la synthèse dérivable qui prouve que la phase est faite, et le **fichier de workflow**
de la forge, qui est le contrôle réel.

Sa raison d'être tient en une phrase : **la vérification doit sortir de l'agent**. Le niveau
implémentation atteste de lui-même que les tests sont intacts — il exécute `git diff` sur les
fichiers de test, les restaure s'ils ont bougé, et retourne `testsUntouched: true`. Producteur et
vérificateur sont le même acteur, ce que le plugin refuse partout ailleurs. La CI est le seul endroit
où cette règle est vérifiée par quelqu'un d'autre.

**Le critère qui gouverne toute la phase**, et qu'on n'assouplit pas :

> Valeur = Risque_couvert × (1 − Taux_de_faux_positifs) × Poids_latence × Poids_maintenance

Un contrôle n'est **bloquant** que s'il passe les quatre seuils : impact élevé ET déterministe · FP
sous ~10-15 % après réglage · latence compatible avec le budget de la PR · configuration déclarative
sans réglage récurrent. Il en rate un → **informatif** (il annote la PR, il ne bloque pas). Le coût
opérationnel fait partie du calcul : **un contrôle bruyant finit désactivé**, et son efficacité
théorique tombe alors à zéro.
</role>

<template>
```markdown
# Contrôles CI — [Projet]
Statut : Actif | Créé : [date] | Trace vers : docs/stack.md | Forge : [GitHub Actions]

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
| # | Job | Contrôle | Commande | Portée | Statut | Mode couvert |
|---|---|---|---|---|---|---|
| 1 | `build` | Build + typage strict | ... | diff + dépôt | Bloquant | **vérificateur** — cible du mode 2 (contrat d'API, null-safety) |
| 2 | `test` | Tests + couverture différentielle | ... | code nouveau | Bloquant (≥ N%) | **vérificateur** — l'oracle, cible du mode 1 (régression) |
| 3 | `sca` | SCA sur lockfile | ... | dépôt entier | Bloquant | 3 — **CVE connues seulement** |
| 4 | `secrets` | Secrets vérifiés | ... | dépôt entier | Bloquant | **vérificateur** — cible du mode 2 (secret en dur) |
| 5 | `sast` | SAST haute-confiance | ... | diff | Bloquant (high) | **vérificateur** — cible du mode 2 (injection, XSS, path-traversal) |
| 6 | `test-integrity` | Intégrité des tests | ... | diff des tests | Bloquant | 2 — dans les tests |
| 7 | `quality-config-guard` | Config qualité figée | ... | diff | Bloquant | 2 — par la config |
| 8 | `verifier-guard` | Garde anti-suppression | ... | diff des **sources** | Bloquant | 2 — typage, lint et SAST éteints ligne à ligne |
| 9 | `workflow-integrity` | Actions épinglées par SHA + audit | ... | `.github/workflows` | Bloquant | 3d — action compromise par déplacement de tag |
| 10 | `dependency-review` | Revue des dépendances sur le diff | ... | diff du lockfile + manifeste | Bloquant | 3a, 3c — dépendance ajoutée en silence, lockfile altéré |
| 11 | — (résolveur) | Cooldown de dépendances | [clé de config] | installation | Bloquant (déclaratif) | 3a, 3b — version publiée depuis moins de N jours |
| — | `arch-invariants` | Invariants d'architecture (`docs/archi.md` + ADR) | ... | diff | Informatif → bloquant après mesure | 5 — violation d'un invariant admis |
| — | `lint` | Style | ... | diff | Informatif | **vérificateur** — cible du mode 2 (lisibilité) |
| — | `test-antipatterns` | Anti-patterns de test | ... | diff des tests | Informatif | 1, partiellement — assertion faible |
| — | `ablation` | Ablation no-op (nocturne) | ... | dépôt | Informatif | 4 — building to the test |

Le contrôle 11 n'est pas un job : c'est une **clé de configuration** du gestionnaire de paquets, et
c'est `quality-config-guard` qui garde son abaissement.

## Registre des ADR vérifiés en CI
| ADR | Invariant | Source | Contrôle | Statut |
|---|---|---|---|---|
| [ADR-0003] | [ex : aucun import de `db/` hors de `server/`] | `docs/archi.md` I1 | `arch-invariants` | Informatif depuis [date] |
| [ADR-0007] | [ex : invariant venu d'un ADR promu après coup] | `docs/adr/` | `arch-invariants` | Informatif depuis [date] |

## Protection de branche
Branche : `[défaut]` · Checks requis : `[noms de jobs, à l'identique]`
Bypass : **interdit** ("Do not allow bypassing") · Force-push et suppression : interdits
État : **[posée le AAAA-MM-JJ | À POSER — sans elle, tout ce qui précède est informatif]**

## Blindage local (défense en profondeur — ne remplace pas le ruleset)
[bloc PreToolUse + script, ou « non installé »]

## Ce que ces contrôles ne couvrent pas
- **Mode 1 — l'oracle faux sémantique.** Du code qui compile, passe le lint et des tests dont
  l'assertion vérifie la mauvaise chose est indétectable : aucun outil ne connaît l'intention. Le
  test écrit pour valider un bug en est le cas typique. Le test de mutation le signale
  *statistiquement* et ne le prouve pas — il reste nocturne et informatif.
- **Mode 5 — l'invariant non encore formalisé.** Un contrôle maison ne vaut que sa liste : une
  décision d'architecture non traduite en règle est invisible.
- **Mode 4 — le *building to the test* « propre ».** Si l'artefact demandé satisfait le contrôle sans
  remplir l'exigence et qu'il n'est pas mort, ni l'ablation no-op ni la détection de code mort ne le
  voient.
- La logique métier et l'autorisation (IDOR) : le SAST ne modélise pas l'intention.
- Et la réserve qui vaut pour tous les gardes greppables : **réprimer un comportement peut le rendre
  plus subtil plutôt que l'éliminer.** Aucune mesure publiée ne tranche. Ces contrôles réduisent une
  surface, ils ne ferment pas le sujet.

## Palier suivant
→ docs/chantiers/en-attente/AAAA-MM-JJ-durcissement-ci.md
```
</template>

<guidance>

## La grille des cinq modes — l'ossature de dérivation

**On dérive un contrôle d'un mode de défaillance, jamais d'un outil disponible.** Une liste d'outils
ne dit pas *contre quoi* on se défend : elle ne permet ni de voir qu'un candidat double un contrôle
existant, ni qu'un mode n'est couvert par rien. Une grille est en outre agnostique par construction —
un outil périme, un mode non.

| # | Mode | Ce qui se passe | Ce qui le détecte | Ce qui le rate |
|---|---|---|---|---|
| 1 | **Oracle faux** | le test passe, mais son assertion vérifie la mauvaise chose — souvent parce qu'il a été écrit après le code par le même acteur | test de mutation, nocturne et informatif | SAST, SCA, lint — et la **couverture**, qui mesure l'exécution et non l'assertion |
| 2 | **Suppression du vérificateur** | l'agent n'écrit pas du code qui échoue au typage : il **éteint le typage** sur la ligne qui échoue | `verifier-guard` (code), `test-integrity` (tests), `quality-config-guard` (config) — grep déterministe sur le diff | tout le reste : avant ce garde, un `as any` dans du code de production passait **tous** les autres contrôles au vert |
| 3 | **Chaîne d'approvisionnement** | (a) paquet halluciné puis enregistré par un tiers · (b) paquet hostile trop récent pour figurer dans une base · (c) lockfile altéré directement · (d) action CI compromise par déplacement de tag | cooldown (a, b) · revue des dépendances sur le diff (a, c) · épinglage SHA + audit du workflow (d) | la SCA sur lockfile, qui ne voit que les **CVE connues** |
| 4 | **Building to the test** | la logique vit dans un artefact jetable et l'artefact demandé reste mort ; ou le code satisfait le contrôle plutôt que l'exigence | ablation no-op, nocturne et informative | tout contrôle qui regarde le code livré sans vérifier qu'il **sert** |
| 5 | **Violation d'invariant d'architecture** | le code est correct en général et viole une décision propre au projet | invariants dérivés de **`docs/archi.md`** et des **ADR**, informatifs jusqu'à mesure | tous les outils génériques : ils ne connaissent pas le contrat du projet |

Le mode 5 est le **gisement principal** : les défauts qui comptent dans du code généré sont des
violations de contrat propres au projet. C'est aussi celui dont le contrôle est le plus cher à régler,
d'où son statut informatif d'abord.

Trois règles d'usage, et elles sont ce qui distingue une grille d'une liste :

- **Un contrôle candidat qui ne se rattache à aucun mode ne se pose pas.** Il coûte de la latence et
  de la maintenance pour un risque qu'on n'a pas nommé.
- **Un mode qu'aucun contrôle ne couvre s'écrit** dans « Ce que ces contrôles ne couvrent pas ». Un
  trou déclaré vaut mieux qu'un contrôle qui *prétend* le couvrir — c'est exactement le cas de la
  couverture de ligne face au mode 1.
- **Un contrôle peut être un vérificateur plutôt qu'un détecteur.** Le typage, le lint, le SAST et le
  scan de secrets ne détectent aucun mode : ils **sont** ce que le mode 2 éteint, et l'oracle de test
  est ce que le mode 1 corrompt. Ils s'inscrivent au tableau avec ce statut, ce qui interdit de lire
  leur vert comme une couverture des modes qui les visent.

## L'arbitrage central : le diff ou le dépôt entier

*Clean-as-you-Code* : on n'impose de seuil que sur le **code nouveau ou modifié**, jamais sur
l'intégralité. Un seuil de couverture **globale** est un anti-pattern documenté — il échoue
indéfiniment sur du legacy et pousse à écrire des tests sans valeur pour atteindre le chiffre, ce qui
aggrave le problème d'oracles faux du code généré.

- **Sur le diff** : couverture, SAST, et les trois gardes d'intégrité.
- **Sur le dépôt entier** : SCA et secrets. Une CVE dans une dépendance non touchée reste
  exploitable ; un secret dans un fichier non modifié reste un secret.

## Dériver les cinq contrôles de qualité de l'écosystème

| Écosystème | Build / typage | Tests + couv. diff | SCA lockfile | Secrets | SAST |
|---|---|---|---|---|---|
| JS/TS | `tsc --noEmit` | vitest/jest + `diff-cover` | `npm ci` + OSV-Scanner | TruffleHog `--only-verified` | Semgrep |
| Python | mypy / pyright | pytest-cov + `diff-cover` | pip-audit (`poetry.lock`) | idem | Semgrep |
| Go | `go build` + `go vet` | `go test -cover` | `govulncheck` (`go.sum`) | idem | Semgrep |
| Rust | `cargo check` | `cargo tarpaulin` | `cargo audit` (`Cargo.lock`) | idem | Semgrep |
| JVM | le compilateur | JaCoCo | OSV-Scanner | idem | Semgrep / CodeQL |
| Dart/Flutter | `dart analyze --fatal-infos` | `flutter test --coverage` | OSV-Scanner (`pubspec.lock`) | idem | Semgrep |

**Le lockfile est committé et l'installation verrouillée** — `npm ci` et jamais `npm install`, et
l'équivalent ailleurs. Sans version figée, la SCA ne prouve rien : elle scanne autre chose que ce qui
sera installé. C'est la contre-mesure au *slopsquatting*, où un nom de paquet halluciné par un modèle
est enregistré par un tiers pour y livrer du code malveillant.

**Secrets : préférer un scanner à vérification.** Un scanner par entropie ou regex génère du bruit
sur les fixtures et le base64 ; un scanner qui **teste si le credential est actif** ne remonte que ce
qui compte. Et rappeler dans `docs/ci.md` qu'un secret détecté se **rotate**, il ne se supprime pas
seulement de l'historique.

## Dériver les trois contrôles d'intégrité — le mode 2

Ils ne dépendent pas de l'écosystème : ce sont des `git diff` sur des chemins. Ils visent l'agent,
pas le code qu'il écrit, et chacun porte un signal **déterministe et greppable** — c'est ce qui leur
fait passer les quatre facteurs malgré un taux de faux positifs non mesuré.

Ils se partagent le mode 2 **par chemin**, et cette répartition n'est pas cosmétique : c'est elle qui
maintient le taux de faux positifs bas de part et d'autre, en évitant qu'un garde ait à distinguer un
neutralisant de test d'un neutralisant de production.

| Mode de défaillance | Signal observable dans le diff | Job | Portée |
|---|---|---|---|
| Réécriture ou désactivation d'un test | `assert True`, `sys.exit(0)` ou `return` précoce ajouté ; `skip`/`xfail`/`only` ajouté ; fichier de test supprimé ou vidé | `test-integrity` | fichiers de test |
| Affaiblissement des assertions | plus d'assertions retirées qu'ajoutées sur le diff des tests | `test-integrity` | fichiers de test |
| Abaissement des seuils qualité | diff sur la config de lint, la config CI, les seuils, les fichiers d'ignore | `quality-config-guard` | fichiers de config |
| Extinction du vérificateur sur la ligne qui échoue | annotation d'ignore de typage, désactivation de lint, échappement de type, erreur avalée — **ajoutés** | `verifier-guard` | fichiers de **source** |

**`test-integrity` ne peut pas reproduire la règle temporelle du niveau implémentation.** Cette
règle est « les tests existent, rouges, et ne bougent plus pendant l'implémentation » ; or en mode
TDD la PR d'un lot contient légitimement les tests **et** le code. Le job porte donc les signaux
ci-dessus, qui sont vrais quel que soit le moment.

**`quality-config-guard` a besoin d'une soupape**, sinon il bloque sa propre maintenance : le
changement de config est autorisé quand **tous** les commits qui y touchent portent un scope
explicite (`chore(ci):`) ou un label. Jamais en silence.

Esquisse, à adapter à la forge et aux chemins réels du projet :

```bash
base="$BASE_SHA"                      # SHA de la base de la PR
TESTS='tests/ **/*_test.* **/*.test.*'   # les globs réels du projet
d() { git diff "$base"...HEAD -- $TESTS; }

# 1. un fichier de test supprimé
git diff --diff-filter=D --name-only "$base"...HEAD -- $TESTS | grep . && exit 1
# 2. un neutralisant ajouté
d | grep -nE '^\+.*(assert True|assert 1 *== *1|sys\.exit\(0\)|\.skip\(|\.only\(|@pytest\.mark\.(skip|xfail)|#\[ignore\]|t\.Skip\()' && exit 1
# 3. plus d'assertions retirées qu'ajoutées
a=$(d | grep -cE '^\+.*(assert|expect|require\.)'); r=$(d | grep -cE '^-.*(assert|expect|require\.)')
[ "$r" -gt "$a" ] && exit 1
exit 0
```

## `verifier-guard` — le garde anti-suppression

C'est le contrôle le plus rentable de la phase, et il manquait. **L'agent n'écrit pas du code qui
échoue au typage : il éteint le typage sur la ligne qui échoue.** Le signal est un grep sur le diff —
impact élevé, latence de quelques secondes, faux positifs proche de zéro par construction dès lors que
les tests sont exclus. Il passe les quatre facteurs sans réserve : **bloquant**.

**Le nom du job est `verifier-guard`, et il ne se renomme pas.** Il devient un check requis ; un
renommage laisse un check fantôme qui bloque toutes les PR. Il nomme l'objet protégé, comme
`test-integrity` et `quality-config-guard`, jamais le geste interdit.

**Sa portée est limitée aux extensions de source — tests et documentation exclus.** Ce n'est pas un
détail de réglage, c'est ce qui l'empêche de **se bloquer lui-même** : le `docs/ci.md` que cette phase
produit cite `@ts-ignore` et `as any` pour les documenter, et le premier diff qui touche à la
documentation du garde le ferait échouer. L'exclusion des tests n'ouvre pas de trou — `test-integrity`
les couvre, et c'est cette répartition qui rend le taux de faux positifs nul des deux côtés.

**Les motifs se dérivent par écosystème, ils ne s'inventent pas.** Ce qui n'est pas connu reste
`[à compléter]`, comme toute commande que la phase ne peut pas sourcer. Une cellule vide se lit `—`
quand l'écosystème n'a **pas** ce levier : un compilateur Go ou Rust ne s'éteint pas par annotation.

| Écosystème | Extensions de source | Neutralisant de typage | Neutralisant de lint | Échappement de type | Erreur avalée |
|---|---|---|---|---|---|
| JS/TS | `*.ts` `*.tsx` `*.js` `*.jsx` | `@ts-ignore` `@ts-nocheck` `@ts-expect-error` | `eslint-disable` (ligne, bloc, fichier) | `: any` `as any` `as unknown as` | `catch {}` vide |
| Python | `*.py` | `# type: ignore` `# mypy: ignore-errors` | `# noqa` `# pylint: disable` | `Any` `cast(Any, …)` | `except …: pass` nu |
| Go | `*.go` | — (le compilateur ne s'éteint pas par annotation) | `//nolint` `//lint:ignore` | `interface{}` / `any` sur une signature publique | `_ = err` |
| Rust | `*.rs` | — (idem) | `#[allow(…)]` `#![allow(warnings)]` | `[à compléter]` | `let _ = <Result>` |
| JVM | `*.java` `*.kt` | — (idem) | `@SuppressWarnings` `@Suppress` `//noinspection` | cast brut vers `Object` / `as Any` | `catch (…) {}` vide |
| Dart/Flutter | `*.dart` | `// ignore:` `// ignore_for_file:` | idem — l'analyseur porte les deux | `dynamic` `as dynamic` | `catch (_) {}` vide |

**Trois neutralisants ne dépendent pas du langage mais de l'outil**, et s'ajoutent à toutes les
colonnes : `nosemgrep`, `# nosec`, `trufflehog:ignore`. Ils éteignent le SAST et le scan de secrets —
les mêmes vérificateurs, par un autre commutateur.

Esquisse, à adapter aux extensions et aux globs réels du projet :

```bash
base="$BASE_SHA"                    # point de divergence avec la branche par défaut
SRC=( '*.ts' '*.tsx' ':(exclude)**/*.test.*' ':(exclude)**/*.spec.*' ':(exclude)tests/**' \
      ':(exclude)docs/**' ':(exclude)*.md' )
MOTIFS='@ts-(ignore|nocheck|expect-error)|as any|as unknown as|: *any\b|eslint-disable|nosemgrep'

added() { git diff "$base"...HEAD -- "${SRC[@]}" | grep '^+' | grep -v '^+++'; }

if added | grep -nE "$MOTIFS"; then
  echo "⛔ Un vérificateur est éteint sur une ligne de source." >&2
  # La soupape s'insère ICI, avant de refuser — voir plus bas.
  exit 1
fi
exit 0
```

**Le garde a une soupape, et ce n'est pas celle de `quality-config-guard`.** Un `as unknown as` dans un
shim de types est un cas légitime : sans sortie, le garde bloque une PR sans issue. Mais un scope de
commit explicite ne tient pas ici — **l'agent écrit `chore(types):` aussi facilement qu'il écrit
`as any`**. Pour la config qualité, la soupape doit rendre le geste **visible**, et un scope suffit ;
pour ce garde, elle doit le rendre **impossible à l'agent**, parce que la menace visée *est* l'agent.
La soupape retenue est une **signature du commit** qui introduit le motif, vérifiée hors ligne par le
job contre un registre de clés versionné, en fermeture par défaut. **Cette phase n'exécute aucune
cryptographie** : elle écrit le workflow qui la vérifie, comme elle rend la commande de protection de
branche sans la jouer. La recette, son modèle de menace et ce qu'elle ne prouve pas vivent dans
`references/ci-signature.md`, **chargée seulement quand le garde est retenu**.

**Le garde tourne aussi en local ; la signature ne s'y vérifie pas.** Une signature ne peut pas être
vérifiée avant que le commit existe : un garde local constate la **couverture** — « ce diff ajoute un
neutralisant, il exigera un commit signé » — jamais l'attribution. Le vert local signifie **couvert**,
jamais **approuvé**, et `docs/ci.md` le dit en clair.

## Dériver les trois contrôles de chaîne d'approvisionnement — le mode 3

La SCA sur lockfile n'attrape que les **CVE connues**. Elle ne voit ni un paquet hostile trop récent
pour figurer dans une base de vulnérabilités, ni une action CI compromise par déplacement de tag, ni
une altération directe du lockfile. Trois contrôles ferment ces sous-cas, et deux d'entre eux sont
**déclaratifs** — une clé de configuration n'est pas un job à maintenir, et le coût opérationnel fait
partie du critère.

| Sous-cas | Contrôle | Ce qui le rend, quand c'est connu (constat 2026-08) |
|---|---|---|
| (a) paquet halluciné puis enregistré par un tiers | cooldown **et** revue du diff | voir les deux lignes suivantes — c'est le seul sous-cas qui en demande deux |
| (b) paquet hostile trop récent pour une base de CVE | cooldown de dépendances | pnpm : `minimumReleaseAge` (natif depuis 10.16, activé par défaut à 24 h en pnpm 11 ; la clé va dans `pnpm-workspace.yaml`, celles de `.npmrc` étant ignorées) — autres gestionnaires : `[à compléter]`. Une fenêtre de 24 h à 7 j suffit : les versions compromises sont généralement retirées en quelques heures |
| (c) lockfile altéré directement | revue des dépendances sur le diff | `git diff` sur le lockfile **et** le manifeste, agnostique : tout ajout devient visible |
| (d) action CI compromise par déplacement de tag | épinglage par SHA complet + audit du workflow | actions épinglées à un SHA immuable, bumps proposés par le robot de dépendances ; GitHub Actions : `zizmor --offline .github/workflows/`, qui voit aussi les permissions trop larges, l'injection de script et les déclencheurs dangereux — GitLab : `[à compléter]` |

**Le principe du cooldown est agnostique — son implémentation native ne l'est pas.** « Ne pas installer
une version publiée depuis moins de N jours » se pose partout ; la clé qui le fait respecter est propre
au gestionnaire de paquets, et n'existe pas partout. Là où elle n'existe pas, l'écrire `[à compléter]`
et **ne pas la remplacer par un job maison** : un contrôle qui rejoue la résolution de dépendances
échoue au facteur maintenance.

**L'épinglage se vérifie, il ne se déclare pas.** Un `@v3` réintroduit par un copier-coller annule
l'épinglage de tout le fichier sans que rien ne change de couleur : c'est le job d'audit, sur
`.github/workflows/`, qui le voit — pas la revue.

## Les invariants d'architecture — le mode 5, dérivé d'`archi` et des ADR

**La source est `docs/archi.md`**, produit par la phase `archi` : sa table des invariants porte
déjà, ligne à ligne, l'invariant, sa **classe** (1-11), sa **trace observable**, la caractéristique
qu'il sert et son ADR. L'admission a été jouée là-bas ; ici on la **rend exécutable**, on ne la
rejoue pas. Un invariant admis n'est pas pour autant rendable : ce que l'outillage atteint et ce
qui lui résiste sont dans la section **Vérification** de `references/archi.md`, à charger à ce
moment-là et à ce moment-là seulement.

**L'entrée reste double.** `docs/adr/` porte les décisions structurantes du projet, et la CI peut
en dériver des contrôles — c'est le sens inverse de celui qu'interdit la règle de traçabilité : un
rapport de recherche ne descend jamais seul dans un ADR, mais un ADR **accepté** peut remonter en
contrôle vérifié. Un ADR promu depuis `_candidates/` après coup peut donc porter un invariant que
`docs/archi.md` ne contient pas, et `docs/archi.md` peut retarder sur les ADR. Les deux se lisent.

Relire `docs/adr/`, et pour chaque décision que la table d'`archi` ne couvre pas, se poser la même
question : *cette décision laisse-t-elle une trace observable dans l'arborescence ou dans les
imports ?* Si oui, elle donne un invariant.

Un projet **sans `docs/archi.md`** ne bloque rien : le mode 5 se dérive des seuls ADR, et le manque
se déclare dans « Ce que ces contrôles ne couvrent pas » avec le renvoi vers `/scd-sdd:archi` — un
gisement amputé de sa source principale n'est pas une couverture.

- « la couche `db/` n'est atteinte que par `server/` » → un contrôle sur les imports.
- « aucune dépendance runtime hors de celles listées » → un contrôle sur le manifeste.
- « tout point d'entrée HTTP valide son entrée par le schéma partagé » → un contrôle maison sur les
  fichiers de route.

Un contrôle maison (lecture de fichiers + expression régulière, sans dépendance externe) suffit et se
maintient ; un analyseur de graphe de dépendances fait la même chose sur les imports statiques
uniquement — les imports dynamiques lui échappent, et un agent en génère.

**Ils restent informatifs jusqu'à mesure, et le tableau porte le lien vers l'ADR.** Un contrôle maison
neuf n'a aucun taux de faux positifs connu, et un contrôle bruyant finit désactivé — son efficacité
théorique tombe alors à zéro. La mesure se fait par **rejeu sur l'historique du dépôt**, pas sur une
fenêtre de temps : le volume de PR d'un développeur seul ne suffit pas à estimer un taux en temps réel.
Sous ~10-15 % de faux positifs sur le rejeu, l'invariant passe bloquant. **Le seuil vaut dans les deux
sens** : un taux mesuré au-delà de 15 % rebascule un bloquant en informatif.

## La maturité de l'outillage — un outil mort est un contrôle mort

Le précédent est interne à cette référence : elle a recommandé une action de CI **archivée par son
propriétaire depuis le 9 avril 2024**, en lecture seule et explicitement dépréciée par son mainteneur
au profit du binaire natif. C'est exactement le coût que le critère à quatre facteurs cherche à éviter,
et il est invisible au moment du choix : il apparaît des mois plus tard, quand plus personne ne relit.

Avant de retenir un outil, vérifier **quatre** points, et les écrire dans `docs/ci.md` avec leur date
de constat : dépôt actif et non archivé · licence du moteur **et** des règles · le palier gratuit
suffit sans carte bancaire · une alternative existe si le mainteneur disparaît.

Trois seuils déclenchent une **re-passe** de la phase, et le retrait de l'outil concerné :

- le mainteneur disparaît, ou le dépôt est archivé ;
- la licence change — y compris sur les seules **règles**, le moteur restant libre ;
- le palier gratuit se met à exiger une carte : le composant devient inutilisable ici, quel que soit
  son mérite.

Préférer partout le **binaire invoqué directement** à une action d'emballage : c'est une dépendance de
moins, et c'est la couche qui meurt en premier.

## Ordonnancer le pipeline

Par **coût croissant et signal décroissant**, jobs indépendants en parallèle : d'abord ce qui échoue
en secondes (lint, typage, build) ; en parallèle secrets et SCA, rapides et indépendants ; puis tests
et couverture ; enfin les lents. Les contrôles très lents (ablation no-op, mutation testing, scan
complet) sortent du chemin critique de la PR — exécution nocturne ou hebdomadaire.

**Le piège n°1 : le déclencheur.** Un check qui ne tourne pas sur `pull_request` n'apparaît **jamais**
dans la liste des status checks sélectionnables, et une fois exigé il bloque la PR indéfiniment.
Déclencher sur `pull_request` **et** sur `push` de la branche par défaut.

```yaml
on:
  pull_request:
  push:
    branches: [ <branche par défaut> ]
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  build: { ... }          # les noms de jobs deviennent les noms des checks requis
  test: { ... }
  sca: { ... }
  secrets: { ... }
  sast: { ... }
  test-integrity: { ... }      # a besoin de fetch-depth: 0 pour voir la base
  quality-config-guard: { ... }
  verifier-guard: { ... }      # idem — et la soupape a besoin de l'historique signé
  workflow-integrity: { ... }
  dependency-review: { ... }
```

Les trois jobs neufs sont **rapides et indépendants** : ils partent avec les secrets et la SCA, pas
après les tests. Le cooldown de dépendances n'apparaît pas ici — il agit au résolveur, à
l'installation, et c'est `quality-config-guard` qui garde sa clé de configuration.

## La protection de branche — le backstop

Sans elle, **rien de ce qui précède ne bloque quoi que ce soit**. En solo on ne peut pas s'auto-
approuver une PR de façon significative : le garde-fou n'est pas la revue, ce sont les status checks
requis. Rendre la commande prête à coller, avec les noms de jobs **à l'identique**, et ne pas
l'exécuter.

Sur la branche par défaut : exiger les checks · exiger la branche à jour avant merge · interdire
force-push et suppression · et **interdire le bypass**. Ce dernier point est le seul qui compte
vraiment : un propriétaire de dépôt contourne ses propres règles par défaut, et des règles
contournables « offrent un faux sentiment de sécurité ».

## Le blindage local — défense en profondeur, jamais le backstop

Une consigne `CLAUDE.md` ne tient pas : un agent a contourné des hooks pre-commit par `--no-verify`,
`git stash` et flags silencieux sur **six commits consécutifs** malgré des règles explicites
l'interdisant. C'est pourquoi le hook ci-dessous est un complément, et l'écrire dans `docs/ci.md`
**avec cette réserve** est obligatoire — le présenter comme une garantie reproduirait l'erreur.

`.claude/settings.json` du projet :

```json
{ "hooks": { "PreToolUse": [ { "matcher": "Bash",
  "hooks": [ { "type": "command", "command": "bash .claude/hooks/block-no-verify.sh" } ] } ] } }
```

`.claude/hooks/block-no-verify.sh` — même forme que le hook d'immuabilité des ADR du plugin
(`exit 2` bloque ; `exit 1` serait ignoré et ne bloquerait rien) :

```bash
#!/usr/bin/env bash
set -uo pipefail
cmd="$(cat | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || true)"
[ -z "$cmd" ] && exit 0
case "$cmd" in
  *"git commit"*--no-verify*|*"git commit"*" -n"*|*"git push"*--no-verify*)
    echo "⛔ Les hooks de commit ne se sautent pas." >&2
    echo "   Un hook cassé se répare ou se signale — il ne se contourne pas." >&2
    exit 2 ;;
esac
exit 0
```

Ses limites, à dire aussi : il ne voit pas un `git` appelé via un script ou un alias, et le motif
` -n` peut mordre sur un message qui le contient.

## Les modes dégradés

- **GitLab** — même jeu de contrôles dans `.gitlab-ci.yml`, avec des règles `merge_request_event`.
  L'équivalent du ruleset sont les *protected branches* et les *merge request approvals* ; le
  paramétrage diffère, l'intention est la même. Annoncer que c'est du best-effort.
- **Aucune forge** — écrire `docs/ci.md` quand même, avec les commandes réelles, et **déclarer en
  clair** qu'aucun contrôle ne s'exécute automatiquement : la phase produit alors une intention, pas
  une garantie. Ne jamais laisser croire le contraire par omission. **La soupape du garde disparaît
  avec la forge**, et cette disparition s'écrit : sa valeur vient entièrement d'un check hors de portée
  de l'agent. Sans check, poser une clé et un registre coûte un vrai geste humain pour **zéro
  garantie**, et un registre inerte *ressemble* à une garantie — c'est le vert trompeur, reconstitué
  par excès de zèle.

## Le palier suivant, et pourquoi c'est une fiche

Les contrôles dont le taux de faux positifs n'est pas connu restent **informatifs**. Les faire monter
demande de le mesurer par **rejeu sur l'historique du dépôt**, pas sur une fenêtre de temps : le
volume de PR d'un développeur seul ne suffit pas à estimer un taux en temps réel. Sous ~10-15 % de
faux positifs sur le rejeu, le contrôle passe bloquant — et **le seuil vaut dans les deux sens**, un
taux mesuré au-delà de 15 % rebascule un bloquant en informatif.

Ce travail n'est pas une phase du cycle et un `/clear` l'effacerait : il devient une fiche
`docs/chantiers/en-attente/AAAA-MM-JJ-durcissement-ci.md`, portée **`socle`** — le vocabulaire de
`Portée` est fermé, il n'y a pas de portée `socle · ci`.

Et une réserve à consigner dans la fiche : réprimer un comportement peut le rendre plus subtil
plutôt que l'éliminer. Ces contrôles réduisent une surface, ils ne ferment pas le sujet.

</guidance>

<completion>
La phase CI est terminée quand :
- [ ] Chaque contrôle a une **commande réelle**, ou un `[à compléter]` explicite — jamais une
      commande inventée.
- [ ] **Aucun seuil de couverture globale** : le seuil porte sur le code nouveau.
- [ ] La **portée** (diff ou dépôt entier) est déclarée pour chaque contrôle, et SCA + secrets
      portent bien sur le dépôt entier.
- [ ] Les **noms de jobs** du workflow et les **checks requis** de la recette sont identiques,
      caractère pour caractère.
- [ ] Le workflow se déclenche sur `pull_request` **et** sur `push` de la branche par défaut.
- [ ] **Chaque contrôle du tableau porte un mode** de la grille — ou la mention *vérificateur* s'il
      est ce qu'un mode attaque. Aucun contrôle sans mode, aucun mode couvert par un contrôle qui ne
      le détecte pas.
- [ ] `test-integrity`, `quality-config-guard` et `verifier-guard` sont présents, et les deux derniers
      ont leur **soupape** — un scope de commit pour la config, une **signature** pour le garde.
- [ ] La portée de `verifier-guard` est limitée aux **extensions de source** : tests et documentation
      exclus, sans quoi il se bloque sur le `docs/ci.md` qui cite ses propres motifs.
- [ ] Les motifs du garde sont **dérivés** de l'écosystème du projet, jamais inventés : `[à compléter]`
      pour ce qui n'est pas connu, `—` pour ce que l'écosystème n'a pas.
- [ ] Les **trois contrôles de chaîne d'approvisionnement** sont posés : cooldown de dépendances
      (ou `[à compléter]` si le résolveur ne l'offre pas), revue des dépendances sur le diff,
      épinglage des actions par SHA complet **vérifié** par un audit du workflow.
- [ ] Les **invariants d'architecture** sont dérivés de `docs/archi.md` **et** de `docs/adr/` — les
      deux sources lues, pas une — et tracés dans le registre des ADR vérifiés avec leur origine,
      **informatifs** jusqu'à mesure par rejeu sur l'historique. `docs/archi.md` absent est
      **déclaré** comme trou, jamais tu.
- [ ] Chaque outil retenu porte sa **date de constat de maturité** — non archivé, licence du moteur et
      des règles, palier gratuit sans carte.
- [ ] Le lockfile est committé et l'installation verrouillée (`npm ci` ou équivalent).
- [ ] La section **« Ce que ces contrôles ne couvrent pas »** est remplie, pas vide ni générique.
- [ ] Le **blindage local** est rendu avec sa réserve — défense en profondeur, pas backstop.
- [ ] L'état de la protection de branche est écrit : **posée** avec sa date, ou **À POSER** avec la
      conséquence (sans elle, tout est informatif).
- [ ] La fiche de durcissement est ouverte dans `en-attente/`, portée `socle`, et commitée.
</completion>
