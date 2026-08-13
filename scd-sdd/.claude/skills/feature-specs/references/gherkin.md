# Référence — Complément Gherkin (dérivé d'EARS)

**Deux points de chargement**, tous deux conditionnels. `/scd-sdd:specify` la charge
**intégralement**, quand un critère à chemins multiples justifie le coût d'un `.feature`.
`/scd-sdd:analyze` charge le seul bloc **`<guidance>`**, et seulement si
`specs/NNN-slug/acceptance/` porte au moins un `.feature` : c'est son **contrôle 16**, et les règles
de dérivation et de forme qu'il applique sont celles d'ici, jamais une copie.

<role>
**Complément**, pas remplacement, d'EARS. EARS définit le *quoi* atomique (`SHALL`) ; Gherkin
fournit des **exemples exécutables** pour les critères à **chemins/états multiples** à haute valeur
de test. Chaque étape Gherkin a une « step definition » dans un framework BDD (Cucumber, Behave,
pytest-bdd), donnant une traçabilité exigence → test automatisée. À réserver aux critères où la
combinatoire justifie le coût du fichier `.feature` supplémentaire.
</role>

<template>
```gherkin
# specs/NNN-feature/acceptance/<critere>.feature
# Dérivé de : spec.md FR-0xx (SHALL EARS)
Feature: [nom du comportement]

  Scenario: [chemin nominal]
    Given [état initial concret]
    When [action]
    Then [résultat attendu observable]

  Scenario Outline: [chemins multiples]
    Given [état <precond>]
    When [action avec <input>]
    Then [résultat <output>]

    Examples:
      | precond | input | output |
      | ...     | ...   | ...    |
```
</template>

<guidance>
- **Dériver d'un `SHALL`**, ne pas inventer un critère parallèle : le `.feature` référence le `FR-0xx` EARS dont il est l'illustration exécutable. Pas de divergence spec ↔ scénario.
- **Seuil d'usage** : critère à ≥ 2 branches significatives ou table d'exemples utile. Un critère simple reste en EARS pur (Gherkin serait verbeux).
- **Un `Scenario Outline` + `Examples`** remplace une pluie de FR quasi-identiques.
- **Exécutable** : chaque `Then` doit correspondre à une assertion réelle ; sinon c'est de la doc, pas un test.
- **Qui l'exécute** : pas nous. Le `.feature` fait partie du **contrat** remis à l'aval — ce plugin n'exécute aucun test. Le **contrôle 16** d'`analyze` vérifie seulement qu'il est bien **dérivé d'un `SHALL`** et bien **formé**, sur les règles ci-dessus ; c'est le workflow d'implémentation qui le fera passer au vert. Un `.feature` qui contredit son `SHALL` y est un **Critical**, un `.feature` orphelin ou mal formé un **Major**.
</guidance>
