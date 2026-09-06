---
description: "Paramètre la quality gate du cycle `run` : écrit `.claude/quality.json`, la liste — POSSÉDÉE PAR LE PROJET — des checks déterministes (lint, typecheck, couverture, complexité…) que les agents quality-analyzer / quality-fixer joueront à chaque ticket. Constate le dépôt (stack, scripts, docs/ci.md), propose des candidats avec une sévérité par défaut ADVISORY et une commande d'autofix SÛRE quand elle existe, fait arbitrer par l'humain (quels checks, lesquels en `blocking`), puis écrit le fichier. Le 0-gate reste vrai par défaut : un check n'est bloquant que si le projet le déclare. Rejouable et idempotente : une seconde passe met la liste à jour sans écraser les sévérités et seuils saisis."
argument-hint: "(aucun — constate, propose, fait arbitrer, écrit)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
  - Bash(ls:*)
  - Bash(test:*)
  - Bash(cat:*)
---

## Ce que fait cette commande

`/scd-spec-dev:quality-setup` **paramètre la quality gate** du cycle `run` en écrivant
`.claude/quality.json`. Ce fichier est **possédé par le projet** — le plugin porte le *mécanisme* (la
gate, les deux agents), le projet porte la *liste* (quels checks, quels seuils, quoi bloquer).

**Le 0-gate reste vrai par défaut** : un check est **`advisory`** sauf si le projet le passe
explicitement en **`blocking`**. Sans ce fichier, la gate est un **no-op** — `run` ne joue aucun
check de qualité. C'est un opt-in.

## Ce qu'elle ne fait jamais

- **Elle n'invente pas de commande.** Un check n'est proposé que si sa commande se **lit** dans le
  dépôt (script `package.json`, cible connue, `docs/ci.md`). Rien de deviné.
- **Elle ne rend rien bloquant sans l'humain.** Le défaut est `advisory` ; `blocking` est un choix
  explicite, arbitré.
- **Elle n'écrase pas les réglages humains.** En entretien (le fichier existe), elle **révise** :
  sévérités, seuils et `autofix` déjà saisis sont préservés ; seuls les checks nouvellement détectés
  sont proposés à l'ajout.

---

## Le contrat `.claude/quality.json`

```json
{
  "version": 1,
  "scope": { "changedOnly": true, "paths": ["src/**"] },
  "checks": [
    {
      "id": "typecheck",
      "cmd": "npm run typecheck",
      "severity": "advisory",
      "autofix": null
    },
    {
      "id": "lint",
      "cmd": "npm run lint",
      "severity": "advisory",
      "autofix": "npm run lint -- --fix"
    },
    {
      "id": "format",
      "cmd": "npx prettier --check .",
      "severity": "advisory",
      "autofix": "npx prettier --write ."
    },
    {
      "id": "coverage",
      "cmd": "npm test -- --coverage",
      "severity": "advisory",
      "threshold": { "metric": "lines", "min": 80 },
      "autofix": null
    }
  ]
}
```

| Champ | Sens |
|---|---|
| `version` | version du contrat (entier, `1`) |
| `scope.changedOnly` | si `true`, appliquer le check aux fichiers **modifiés** du ticket quand l'outil le permet |
| `scope.paths` | globs où la gate s'applique (le reste est ignoré) |
| `checks[].id` | identifiant unique et parlant |
| `checks[].cmd` | **la** commande qui évalue le check ; `exit 0` = passe (sauf `threshold`) |
| `checks[].severity` | `blocking` (échoue le ticket) \| `advisory` (finding) — **défaut `advisory`** |
| `checks[].autofix` | commande de correction **SÛRE et déterministe** (formatter, `--fix`, tri d'imports) ou `null`. Jamais une correction qui réécrit de la logique. |
| `checks[].threshold` | optionnel, pour un check numérique : `{ metric, min }` ou `{ metric, max }` — le `quality-analyzer` parse la sortie de `cmd` |

**Frontière de l'`autofix` (rappel du contrat)** : seul l'autofix **sûr** est automatisé — ce que le
`quality-fixer` exécute puis re-vérifie. Un finding sans `autofix` (complexité, duplication, seuil de
couverture manqué) **reste un finding** : la review ou l'humain le traite, la gate ne réécrit pas le
code.

---

## Étape 1 — Constater le dépôt

Sans rien exécuter, réunir de quoi proposer des candidats **réels** :

- **Stack & scripts** : lire `package.json` (`scripts`), `pyproject.toml` / `ruff.toml`, `Cargo.toml`,
  `go.mod`, `Makefile`… selon ce qui est présent.
- **`docs/ci.md`** s'il existe — c'est le **cap CI**, il nomme déjà les commandes qui décident qu'une
  PR passe. Il fait autorité sur les commandes ; la gate en est l'exécution *dans* le cycle.
- **`.claude/quality.json`** — présent et lisible ? Alors cette passe est un **entretien**, pas une
  pose : on part de l'existant.

## Étape 2 — Proposer des candidats

Pour chaque check dont la commande se lit dans le dépôt, préparer une entrée :

- `cmd` = la commande **constatée** (jamais inventée) ;
- `severity` = **`advisory`** par défaut ;
- `autofix` = renseigné **seulement** si une variante de correction **sûre** existe pour cet outil
  (`eslint --fix`, `prettier --write`, `ruff --fix`, `gofmt -w`, `cargo fmt`…) ; sinon `null` ;
- `threshold` pour les checks numériques (couverture, complexité) si un seuil se lit ou est proposé.

Candidats typiques : `typecheck`, `lint`, `format`, `coverage`, `complexity`, `duplication`,
`security-audit` (ex. `npm audit`, `pip-audit`). N'inclure que ceux qui existent réellement.

## Étape 3 — Faire arbitrer (le geste humain)

Présenter les candidats — **le problème d'abord, en prose**, puis les choix. Deux décisions par
l'humain :

1. **Quels checks retenir** dans la gate.
2. **Lesquels passer en `blocking`** (le reste reste `advisory`). Rappeler l'enjeu : `blocking`
   entame le 0-gate par défaut sur ce check précis — c'est voulu ou non.

Confirmer aussi, pour les checks retenus, la **commande d'autofix** proposée (ou son absence).
Utiliser `AskUserQuestion` pour la sévérité (au moins) ; l'humain peut tout laisser en `advisory`.

## Étape 4 — Écrire `.claude/quality.json`

- **Pose** (fichier absent) : `Write` le fichier complet avec les seuls checks approuvés.
- **Entretien** (fichier présent) : `Edit` ciblés — ajouter les checks nouvellement approuvés, mettre
  à jour une `cmd` obsolète (avec confirmation), **sans toucher** aux `severity` / `threshold` /
  `autofix` déjà saisis par l'humain.

Écrire un JSON valide, indenté, conforme au contrat ci-dessus.

## Étape 5 — Rendre compte

- `.claude/quality.json` [posé | entretenu] : N check(s), dont M `blocking` ;
- rappeler que la gate se joue en **phase 7½ de `/scd-spec-dev:run`** (`quality-analyzer` →
  `quality-fixer` autofix sûr → re-analyze), et qu'elle est **no-op** si ce fichier est supprimé ;
- prochaine action : ouvrir/continuer un change, puis `/scd-spec-dev:run <NN>` — la gate s'appliquera.

> **Note de propriété.** `.claude/quality.json` est au projet. Les agents de la gate le **lisent** ;
> le `quality-fixer` ne le modifie jamais (il n'a d'ailleurs pas d'outil `Edit`). Ce fichier
> paramètre la gate, il n'est pas une cible de correction.
