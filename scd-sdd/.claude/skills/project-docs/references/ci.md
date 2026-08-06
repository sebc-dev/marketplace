# Référence — Contrôles CI (`docs/ci.md`)

<role>
Répond à **comment on garantit** ce que `CLAUDE.md` ne peut que conseiller. Trace vers la Stack :
les contrôles se dérivent de l'écosystème choisi, ils ne le choisissent pas. Produit deux artefacts —
`docs/ci.md`, la synthèse dérivable qui prouve que la phase est faite, et le **fichier de workflow**
de la forge, qui est le contrôle réel.

Sa raison d'être tient en une phrase : **la vérification doit sortir de l'agent**. Le niveau
implémentation atteste de lui-même que les tests sont intacts — il exécute `git diff` sur les
fichiers de test, les restaure s'ils ont bougé, et retourne `testsUntouched: true`. Producteur et
vérificateur sont le même acteur, ce que le plugin refuse partout ailleurs. La CI est le seul endroit
où cette règle est vérifiée par quelqu'un d'autre (`DECISIONS.md` §D22).

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
| # | Job | Contrôle | Commande | Portée | Statut | Couvre |
|---|---|---|---|---|---|---|
| 1 | `build` | Build + typage strict | ... | diff + dépôt | Bloquant | contrat d'API, null-safety |
| 2 | `test` | Tests + couverture différentielle | ... | code nouveau | Bloquant (≥ N%) | régression |
| 3 | `sca` | SCA sur lockfile | ... | dépôt entier | Bloquant | paquet halluciné, CVE |
| 4 | `secrets` | Secrets vérifiés | ... | dépôt entier | Bloquant | secret en dur |
| 5 | `sast` | SAST haute-confiance | ... | diff | Bloquant (high) | injection, XSS, path-traversal |
| 6 | `test-integrity` | Intégrité des tests | ... | diff des tests | Bloquant | subversion des tests |
| 7 | `quality-config-guard` | Config qualité figée | ... | diff | Bloquant | seuils abaissés |
| — | `lint` | Style | ... | diff | Informatif | lisibilité |
| — | `test-antipatterns` | Anti-patterns de test | ... | diff des tests | Informatif | assertion faible |
| — | `ablation` | Ablation no-op (nocturne) | ... | dépôt | Informatif | building to the test |

## Protection de branche
Branche : `[défaut]` · Checks requis : `[noms de jobs, à l'identique]`
Bypass : **interdit** ("Do not allow bypassing") · Force-push et suppression : interdits
État : **[posée le AAAA-MM-JJ | À POSER — sans elle, tout ce qui précède est informatif]**

## Blindage local (défense en profondeur — ne remplace pas le ruleset)
[bloc PreToolUse + script, ou « non installé »]

## Ce que ces contrôles ne couvrent pas
- Les régressions sémantiques silencieuses : du code qui compile, passe le lint et des tests
  dont l'oracle est faux est indétectable automatiquement.
- Les tests écrits pour valider un bug — l'oracle capture le comportement réel, pas l'attendu.
- Le *building to the test* : la logique peut vivre dans une démo jetable et l'artefact demandé
  rester mort. Seule l'ablation no-op le voit, et elle est informative.
- La logique métier et l'autorisation (IDOR) : le SAST ne modélise pas l'intention.

## Palier suivant
→ docs/chantiers/en-attente/AAAA-MM-JJ-durcissement-ci.md
```
</template>

<guidance>

## L'arbitrage central : le diff ou le dépôt entier

*Clean-as-you-Code* : on n'impose de seuil que sur le **code nouveau ou modifié**, jamais sur
l'intégralité. Un seuil de couverture **globale** est un anti-pattern documenté — il échoue
indéfiniment sur du legacy et pousse à écrire des tests sans valeur pour atteindre le chiffre, ce qui
aggrave le problème d'oracles faux du code généré.

- **Sur le diff** : couverture, SAST, duplication, complexité, intégrité des tests.
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

## Dériver les deux contrôles d'intégrité

Ils ne dépendent pas de l'écosystème : ce sont des `git diff` sur des chemins. Ils visent l'agent,
pas le code qu'il écrit, et chacun porte un signal **déterministe et greppable** — c'est ce qui leur
fait passer les quatre facteurs malgré un taux de faux positifs non mesuré.

| Mode de défaillance | Signal observable dans le diff | Job |
|---|---|---|
| Réécriture ou désactivation d'un test | `assert True`, `sys.exit(0)` ou `return` précoce ajouté ; `skip`/`xfail`/`only` ajouté ; fichier de test supprimé ou vidé | `test-integrity` |
| Affaiblissement des assertions | plus d'assertions retirées qu'ajoutées sur le diff des tests | `test-integrity` |
| Abaissement des seuils qualité | diff sur la config de lint, la config CI, les seuils, les fichiers d'ignore | `quality-config-guard` |

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
  test-integrity: { ... } # a besoin de fetch-depth: 0 pour voir la base
  quality-config-guard: { ... }
```

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
  une garantie. Ne jamais laisser croire le contraire par omission.

## Le palier suivant, et pourquoi c'est une fiche

Les contrôles dont le taux de faux positifs n'est pas connu restent **informatifs**. Les faire monter
demande de mesurer sur ~30 jours d'exécution réelle, puis de rendre bloquant ce qui passe sous
~10-15 %. Ce travail n'est pas une phase du cycle et un `/clear` l'effacerait : il devient une fiche
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
- [ ] `test-integrity` et `quality-config-guard` sont présents, et le second a sa **soupape**.
- [ ] Le lockfile est committé et l'installation verrouillée (`npm ci` ou équivalent).
- [ ] La section **« Ce que ces contrôles ne couvrent pas »** est remplie, pas vide ni générique.
- [ ] Le **blindage local** est rendu avec sa réserve — défense en profondeur, pas backstop.
- [ ] L'état de la protection de branche est écrit : **posée** avec sa date, ou **À POSER** avec la
      conséquence (sans elle, tout est informatif).
- [ ] La fiche de durcissement est ouverte dans `en-attente/`, portée `socle`, et commitée.
</completion>
