# Référence — Le catalogue des stratégies (le champ `stratégie`)

**Chargement.** Complément du `SKILL.md` de `strategie-verif`. Le `mode` (`tdd`/`test`/`observé`/
`aucun`) va dans le champ `**Vérif :**` du ticket ; la **`stratégie`** le qualifie dans la sortie
`{ mode, stratégie, justification }` et oriente l'aval (le `test-writer`, le `coverage-reviewer`).
Chaque stratégie a des **conditions de domination** précises — c'est ce que résume ce fichier.

## Table de correspondance mode → stratégie

| Stratégie | Mode | Domine quand | Pourquoi (et le piège) |
|---|---|---|---|
| **canonique** (Canon TDD) | `tdd` | cas énumérables, règle métier claire, interface stable | lister les scénarios, un test à la fois, petits pas. Piège : tester la méthode/classe et non le **comportement** → suites fragiles (Cooper). |
| **property-based** | `tdd` | la fonction a des propriétés/lois (round-trip, idempotence, monotonie, conservation) | une **propriété** est un oracle plus dur à hardcoder qu'un exemple (Hughes/QuickCheck). Idéal contre le reward hacking. |
| **bug reproductible** | `tdd` | correction d'un bug avec repro | oracle trivial : écrire le test qui échoue **à cause du bug**, puis corriger. Cas approuvé même par Ousterhout. |
| **characterization / golden master** | `test` | legacy sans spec, migration, refactor de masse | on capture le comportement **actuel** comme référence, sans connaître la spec correcte (Feathers). Piège : fige aussi les bugs actuels — c'est voulu (préserver), pas valider. |
| **intégration / composant / contrat** | `test` | fort couplage I/O, réseau, dépendances dures à isoler | oracle déterministe au bon niveau, **sans sur-mock** (DHH, Cooper). Aux frontières de services : le **contrat** est l'unité pertinente. |
| **approval / snapshot** | `observé` | sorties complexes : PDF, image, XML, layout, UI | écrire des assertions attribut par attribut serait ingérable ; on approuve une référence (ApprovalTests, Falco). Même famille que golden master. |
| **comparaison de capture** | `observé` | rendu visuel qu'aucun test automatisé ne constate | motif Anthropic « screenshot to compare » ; sinon `humanCheckRequired`. |
| **(spike)** | `aucun` | exploration, prototype jetable, recherche d'approche | pas d'oracle → pas de test **pendant** l'exploration. Si le code est conservé, ré-entrer dans l'arbre. |

## Le contrôle de la qualité de l'oracle (transverse)

Deux stratégies ne produisent pas un mode mais **contrôlent l'oracle** — elles sont des garde-fous,
pas des cases du champ `**Vérif :**` :

- **Mutation testing (léger)** — mesure si les tests détecteraient réellement un défaut. Pertinent
  comme contrôle anti-tautologie sur le code touché : un test qui survit à toutes les mutations est
  vide. À suggérer, pas à imposer (coûteux).
- **Filtres TestGen-LLM** — pour tout test **généré** par le modèle : ne l'accepter comme oracle que
  s'il **compile**, **passe de façon fiable**, et **augmente la couverture**. Sans ce filtre, un test
  généré n'est pas un oracle.

## Rappels de niveau (la pyramide)

- Privilégier les **small tests** (rapides, déterministes, sans I/O) — mais ne pas y forcer un code
  couplé à l'infra : préférer un test d'intégration honnête à un test unitaire sur-mocké.
- Éviter le **cornet de glace inversé** (trop de tests end-to-end lents et flaky) : la flakiness érode
  la confiance dans l'oracle (~1,5 % chez Google est déjà le seuil d'alerte).
- « Sur-testing » unitaire de cas qui n'arrivent jamais = gaspillage (Coplien) : la valeur est dans
  les **comportements** attendus par la spec, pas dans la couverture structurelle.

## Comment renseigner la `justification`

Une **phrase**, ancrée dans le ticket, qui nomme la branche de l'arbre franchie — pas un exposé :

- `tdd (property-based) — l'export/import doit être un round-trip idempotent (étape 4, propriété)`
- `test (characterization) — refactor du parseur legacy sans spec écrite (étape 2, comportement à préserver)`
- `observé (approval) — le PDF généré n'a pas d'assertion unitaire raisonnable (étape 2, sortie complexe)`
- `arbitrage humain — l'énoncé ne dit pas ce que « valide » signifie pour un IBAN (étape 0, ambiguïté)`
