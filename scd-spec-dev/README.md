# scd-spec-dev

Cycle spec-driven bâti sur **OpenSpec**, du change à la PR — et la couche d'implémentation
qu'OpenSpec n'a pas.

> **⚠️ Écrit et mécaniquement vérifié, jamais joué de bout en bout.** Le plugin existe en `0.1.0`,
> `claude plugin validate` au vert, mais aucun projet réel n'a encore parcouru
> `setup → propose → tickets → run → sync → archive`. La question ouverte est celle de toute la
> conception : la **review + verify** tiennent-elles la rigueur **sans hook write-time** ?

---

## Le constat qui commande tout

OpenSpec est fort **exactement là où un cycle spec-driven fait de documents statiques est fragile**,
et absent **exactement là où la valeur se joue** :

- **Il porte la couche doc→tickets** : un socle en **specs vivantes** (`openspec/specs/`, source de
  vérité), un modèle **delta** (ADDED/MODIFIED/REMOVED) fusionné à l'archivage, un **CLI
  déterministe** (`init`, `list`, `diff`, `validate`, `archive`, `schema …`), et l'injection de
  contexte durable par `config.yaml`.
- **Il est absent sur la couche d'implémentation** : pas de `run` par ticket, pas de workflow de
  subagents, pas de review. **C'est là que ce plugin met toute sa valeur.**

Sa personnalisation s'arrête à la génération des artefacts — donc le workflow d'implémentation **ne
peut pas vivre dans un schéma OpenSpec**. Il vit dans ce plugin. Règle cardinale : **on n'appelle
jamais `/opsx:apply`** ; `/scd-spec-dev:run` prend le relais sur les tickets.

---

## Les cinq temps

```
① Cadrage durable   vision · roadmap · caps (archi/test/sécu/design-system) · ADR   (injecté via config.yaml)
② Change OpenSpec   /opsx:propose  →  proposal · design · deltas specs/              (1er geste humain : relire)
③ Tickets           /scd-spec-dev:tickets  →  tranches verticales NN-slug.md          (2e geste humain : arbitrer)
④ Implémentation    /scd-spec-dev:run <NN>  →  branche → vérif → review 8 dims → PR   (une PR par ticket)
⑤ Archive           PR mergées → openspec archive  →  openspec/specs/ (vérité courante, reboucle sur la roadmap)
```

**Deux gestes humains**, et deux seulement : relire le change, arbitrer la granularité des tickets.

---

## La doctrine : la rigueur dans la review, pas dans des gardes de session

**Aucune garde de session** (0-hook write-time). Un hook à *chaque* écriture alourdit le temps de
dev, et ce qu'il attrape est du texte. La rigueur est mise dans la **review par agents dédiés** — qui
jugent la **pertinence** des changements — et dans la **structure producteur ≠ vérificateur**.

La recherche TDD, elle, recommande des hooks anti-triche. **Cette tension est assumée, pas masquée** :

| Ce qu'une garde de session ferait | Le dispositif ici |
|---|---|
| Bloquer à l'écriture les tests / CI / config | `integrity-reviewer` : échoue le ticket si le diff touche un chemin protégé sans dérogation. **Filet, pas serrure.** |
| Bloquer `@ts-ignore`, `as any`, `.skip(`, `--no-verify`… | `integrity-reviewer` scanne les lignes ajoutées → bloquant |
| « l'implementer n'édite pas les tests » | Instruction d'agent + **verify-time** : le `verifier` exige un `git diff` vide sur les tests, sur checkout propre |
| Journal des tentatives | le rapport de findings + la description de PR (findings appliqués **et** rejetés) |
| Job CI de rattrapage | **CONSERVÉ** : un job CI qui grep les escape-hatches, hors boucle de dev — le seul garde-fou automatique |

**La review de pertinence, huit dimensions en contexte frais** : architecture · sécurité ·
conventions · propreté · error-handling · couverture · **change** (bien cadré, testable, sans conflit
avec les specs vivantes — le seul reviewer au niveau artefact) · **integrity** (escape-hatches +
chemins protégés). Producteur ≠ vérificateur : aucun reviewer n'a écrit le code.

**La quality gate** (opt-in par check, advisory par défaut) : une gate *déterministe et outillée*
(lint, typecheck, couverture, complexité) distincte de la review LLM. `quality-fixer` résorbe
l'autofix sûr ; ce qu'il ne peut pas corriger mécaniquement (complexité, duplication, lint sans
`--fix`) est repris **par un agent dédié à chaque partie de la gate** — co-créé avec l'humain via
`/scd-spec-dev:quality-agents` (`.claude/agents/quality-<check>.md`, possédé par le projet, porteur
des instructions « comment traiter cette partie »), ou le générique `quality-advisor` à défaut. En
contexte frais, il remonte les points à traiter selon les instructions de sa partie ; la proposition
est appliquée via le triage adversarial puis le `fix-applier` (les agents dédiés sont **lecture
seule** — c'est le `fix-applier`, sous triage, qui applique). Sans `.claude/quality.json`, c'est un
no-op — le 0-gate reste vrai par défaut.

**L'applier du projet** (optionnel, top-level `applier` de `quality.json`) : certains défauts ne sont
réparables *que* dans les tests — un mutant qui survit faute d'assertion —, et le `fix-applier`
générique n'y touche jamais. Un projet peut donc déclarer un **applier à lui** — co-créé avec l'humain
par `/scd-spec-dev:quality-agents`, top-level `applier` de `quality.json` —, seul agent du cycle
autorisé à **renforcer** les tests. Le droit n'est pas une confiance : il est borné par l'**additivité** —
aucune assertion, aucun cas, aucun fichier de test retiré ou affaibli, aucun `.skip(`/`.only(`
ajouté. Sans applier déclaré, la ceinture habituelle tient : diff de test **vide**, sinon le ticket
échoue.

Et ce n'est pas l'applier qui certifie son propre travail — ce serait producteur = vérificateur, ce
que le cycle interdit partout ailleurs. Le **`test-edit-validator`** intervient en contexte frais :
il **rejoue lui-même** les contrôles sur le `git diff` réel, puis **juge les tests ajoutés**. Car
l'additivité ne suffit pas — on peut ajouter un test qui n'assure rien, satisfaire le contrôle
mécanique et ne rien détecter de plus : tautologie, exécution sans assertion, assertion sur un double
plutôt que sur le comportement. Son verdict fait foi ; une violation échoue le ticket en
`blocked-quality-test-edit`, éditions laissées **sur la branche** pour que l'humain voie ce qui a été
tenté.

---

## `strategie-verif` — quatre modes, fondés sur la recherche TDD

Le mode de vérif de chaque ticket est **décidé une fois** à la décomposition, par un arbre de
décision dont le discriminant n'est pas « toujours/jamais TDD » mais l'**oracle vérifiable** :

| Mode | Quand | Preuve |
|---|---|---|
| **`tdd`** | oracle exprimable avant le code (règle métier, bug reproductible, contrat) | 1 test/critère, rouge → vert, tests intacts |
| **`test`** | legacy, migration, couplage I/O | test-after : intégration prouvée, puis tests verts |
| **`observé`** | UI/rendu/effet externe | preuve observable capturée, ou `humanCheckRequired` |
| **`aucun`** | spike, exploration | ni test ni verify |

Portes d'arbitrage → `arbitrage humain` sur sécurité/paiement/données perso sans oracle, énoncé
ambigu, ou tests qui contredisent l'énoncé.

---

## Installation & usage

```bash
/plugin install scd-spec-dev@sebc-dev-marketplace
```

**Une fois, par projet :**

```bash
/scd-spec-dev:setup          # détecte OpenSpec (guide l'install si absent), openspec init,
                             # copie le schéma scd, accorde config.yaml, gabarits durables, filet CI
/scd-spec-dev:quality-setup  # (optionnel) paramètre la quality gate → .claude/quality.json
```

> `/setup` **détecte** OpenSpec, il ne l'installe jamais lui-même : absent, il s'arrête en guidant
> vers `npm i -g @fission-ai/openspec@latest`. Les `/opsx:*` appellent `openspec` nu (pas de repli
> `npx`) — l'avoir sur le PATH est le seul montage viable.

**Par feature :**

```bash
/opsx:propose "<idée>"          # → change (proposal + deltas + design)   ·  1er geste humain : relire
/scd-spec-dev:tickets           # → tranches verticales NN-*.md            ·  2e geste humain : arbitrer
/scd-spec-dev:run <NN>          # → cycle par ticket → une PR
/scd-spec-dev:run-parallel …    # → plusieurs tickets, worktrees, une PR chacun
/scd-spec-dev:sync              # PR mergées → rebase anti-orphelinage, puis /opsx:archive
```

---

## Les commandes

| Commande | Rôle |
|---|---|
| `/scd-spec-dev:setup` | monte OpenSpec dans le projet, copie le schéma `scd`, `config.yaml`, gabarits durables, filet CI. Idempotente par artefact |
| `/scd-spec-dev:quality-setup` | paramètre la quality gate → `.claude/quality.json` (possédé par le projet) |
| `/scd-spec-dev:quality-agents` | co-crée avec l'humain les agents de la gate (projet) : un **diagnostiqueur par check** (`quality-<id>.md`, lecture seule) et, optionnel, l'**applier** (top-level `applier`) — le seul autorisé à renforcer les tests |
| `/scd-spec-dev:tickets` | décompose un change en tickets verticaux (invoque `strategie-verif`, arbitre la granularité) |
| `/scd-spec-dev:run` | implémente **un** ticket : vérif → quality gate → review 8 dims → triage → PR |
| `/scd-spec-dev:run-parallel` | plusieurs tickets en parallèle réel, chacun dans son worktree |
| `/scd-spec-dev:review` | review de pertinence à la demande, hors run — **lecture seule**, rapporte |
| `/scd-spec-dev:sync` · `reland` | anti-orphelinage des PR empilées (curatif · rattrapage d'orphelin) |
| `/scd-spec-dev:status` | où en est le projet, dérivé d'`openspec list` + tickets + PR + chantiers |
| `/scd-spec-dev:pause` · `resume` · `note` | chantiers : le contexte à travers les `/clear` |

---

## Ce qu'il y a dedans

- **7 skills** — `openspec` (la fondation & la frontière), `implement` (le niveau implémentation),
  `review` (les huit dimensions), `strategie-verif` (le mode par ticket), `change-decomposer` (le
  pont change→tickets), `chantier` (le hors-cycle).
- **28 agents** — le cœur du run (briefer, `escalation-triage` — le triage d'escalade §14 en
  pré-flight, branch-setup, test-writer/validator, implementer, verifier, review-context/validator,
  fix-applier, progress-recorder, pr-describer/author, rebaser, relander), les **8 reviewers** en
  contexte frais, la quality gate (analyzer + fixer + advisor + `test-edit-validator`, qui audite les
  éditions de test d'un applier de projet), le `chantier-reader`.
- **2 workflows** — `implement-ticket.js` (16 phases, segment de vérif variable selon les 4 modes) et
  `implement-parallel.js` (chaînes indépendantes, un worktree par ticket).
- **La recette de schéma `scd`** — `openspec-schema/scd/` (le plugin porte la recette, `/setup` la
  copie dans le projet).

---

## Autonome

`scd-spec-dev` est **auto-suffisant** : ses agents lisent les tickets et ne dépendent d'aucun autre
plugin. Il s'appuie sur une seule fondation externe — **OpenSpec** — pour la couche doc→tickets, et
apporte lui-même tout le reste : la couche d'implémentation, la review, les chantiers.
