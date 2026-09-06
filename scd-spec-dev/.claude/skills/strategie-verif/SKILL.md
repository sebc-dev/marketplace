---
name: strategie-verif
description: |
  DÉCIDE le mode de vérification d'UN ticket — `tdd` (test d'abord), `test` (test après),
  `observé` (preuve observable), `aucun` (spike) — ou ESCALADE en `arbitrage humain`. Se charge
  pendant /scd-spec-dev:tickets, invoqué par le skill change-decomposer un ticket à la fois, à la
  décomposition d'un change. Le discriminant n'est pas « toujours/jamais TDD » mais l'ORACLE
  vérifiable : peut-on exprimer AVANT le code ce que « correct » veut dire et le vérifier
  automatiquement ? Applique un arbre de décision à cinq étapes (portes d'arbitrage → oracle a
  priori ? → nature du travail sans oracle → déterminisme/testabilité → forme de l'oracle) fondé
  sur la recherche « Décider quand faire du TDD » distillée dans references/. Rend
  { mode, stratégie, justification } ou une escalade — DÉCIDÉ UNE FOIS, jamais re-décidé en aval.
  Porte UNIQUEMENT la décision du mode : il ne découpe pas les tickets (skill change-decomposer),
  n'écrit aucun test et n'implémente rien (workflow run).
---

# Décider le mode de vérification d'un ticket

Ce que ce skill produit pour **un** ticket, à la décomposition :

```
{ mode: tdd | test | observé | aucun, stratégie: "<qualificatif>", justification: "<une phrase>" }
```

…ou une **escalade** `arbitrage humain` (une porte de l'étape 0 s'est ouverte). Décidé **une seule
fois** — le champ `**Vérif :**` du ticket est figé, jamais re-décidé par un agent en aval.

## Le principe (ce que la recherche établit)

Trois faits commandent tout l'arbre — leur base de preuves est dans `references/preuves.md` :

1. **Pas de règle « toujours/jamais TDD ».** L'effet mesuré du test-first est *positif mais modeste*
   sur la qualité, *non concluant* sur la productivité. Le discriminant est **l'oracle vérifiable** :
   une spec claire, une interface stable, un comportement déterministe, un moyen automatique de dire
   juste/faux.
2. **Le facteur causal du bénéfice est la granularité, pas l'ordre test-first** (Fucci et al. 2017).
   Donc ce qui compte n'est pas d'imposer le test d'abord partout, mais des **petits pas** — un
   critère = une tranche vérifiable.
3. **Le risque propre à l'agent est le reward hacking** (suppression/hardcoding de tests ; EvilGenie
   mesure jusqu'à 44 % de triche **sous ambiguïté**). D'où : quand l'énoncé est ambigu, l'agent ne
   doit pas **inventer ET satisfaire** l'oracle seul → escalade.

## Les cinq modes

| Mode | Ce qui fait preuve | Stratégie typique (qualificatif) |
|---|---|---|
| `tdd` | test écrit **avant** le code, rouge → vert | canonique · property-based · bug reproductible |
| `test` | test écrit **juste après** le code, `0 failed` | characterization/golden-master · intégration/contrat |
| `observé` | **preuve capturée** : sortie, capture, log — ou `humanCheckRequired` | approval/snapshot · comparaison de capture |
| `aucun` | aucune : c'est un **spike** jetable, pas de segment test dans `run` | — |
| `arbitrage humain` | **escalade** : le skill s'arrête et remonte à l'humain | — |

> `arbitrage humain` n'est **pas** une valeur du champ `**Vérif :**` : c'est une sortie d'escalade.
> Une fois l'humain tranché, le ticket porte l'un des **quatre** modes concrets. La `stratégie`
> qualifie le mode (catalogue et conditions de domination dans `references/strategies.md`).

## L'arbre de décision

Appliqué à **un** ticket, dans l'ordre. La première correspondance décide.

**Étape 0 — Portes d'arbitrage** (un seul signal → `arbitrage humain`, on s'arrête) :
- La tâche touche **sécurité, paiement, données personnelles, santé, ou est irréversible**
  (migration destructrice, suppression de données) **et** l'oracle n'est pas fourni par l'humain.
- **L'énoncé est ambigu** sur ce que « correct » signifie — l'agent devrait à la fois inventer
  l'oracle et le satisfaire (régime où la triche explose).
- Un test ne peut passer **qu'en modifiant/supprimant** le test ou en hardcodant la réponse.
- Les tests fournis **contredisent** l'énoncé (oracle douteux).

**Étape 1 — Un oracle exprimable AVANT le code ?** Signaux dans le delta/l'énoncé : cas
entrée→sortie explicites, formule, règle métier claire, bug reproductible, contrat/interface décrit.
- **Non** → étape 2. **Oui** → étape 3.

**Étape 2 — Pas d'oracle a priori : nature du travail ?**
- Exploration / spike / prototype jetable / recherche d'approche → **`aucun`**. *(Si le code est
  conservé, ré-entrer dans l'arbre pour la version propre.)*
- Legacy à modifier sans spec, migration, refactor de masse → **`test`**, stratégie
  *characterization / golden master* : capturer le comportement actuel comme référence.
- UI / rendu visuel / sortie complexe (PDF, image, layout) → **`observé`**, stratégie
  *approval/snapshot* + comparaison de capture.

**Étape 3 — Déterministe et testable sans lourde infra ?**
- **Non** (fort couplage I/O, réseau, non-déterminisme, dépendances dures à isoler) → **`test`** au
  niveau *intégration / composant / contrat* (éviter le sur-mock). Si même ce niveau n'est pas
  atteignable → **`observé`** avec la limite de vérifiabilité documentée.
- **Oui** → étape 4.

**Étape 4 — Forme de l'oracle** (tous → `tdd`, petits pas) :
- Propriétés / invariants / lois (round-trip, idempotence, monotonie) → `tdd` **property-based**
  (une propriété résiste mieux au hardcoding qu'un exemple).
- Bug reproductible → `tdd` : le test qui échoue à cause du bug **d'abord**.
- Cas énumérables / règle métier claire / interface stable → `tdd` **canonique** (Canon TDD).

## Le lien critère → test (modes `tdd` et `test`)

Chaque critère du ticket (scénario WHEN/THEN, id stable `SC-<NN><lettre>`) → **un test nommé, un
pour un**. Le nom du test **porte l'id** : `test("SC-02a — un carnet vide produit 1 ligne", …)`. En
aval, le `coverage-reviewer` bloque tout critère orphelin. En `observé`, la preuve capturée couvre
les chemins critiques ; en `aucun`, aucun test n'est attendu.

## Les garde-fous anti-triche (ce dont dépendent `tdd` et `test`)

Ce skill **décide** le mode ; il n'**exécute** rien. Mais un mode `tdd`/`test` ne vaut que si l'aval
tient ces garde-fous — les nommer ici fait partie de la décision, car un ticket dont on ne peut pas
les tenir bascule en `observé` ou `arbitrage humain` :

- tests **commités avant** l'implémentation (checkpoint) ;
- l'implementer **n'édite pas** les tests (instruction d'agent) ;
- **verify-time** : `git diff` **vide** sur les fichiers de test, sur **checkout propre** — un test
  neutralisé y est visible. C'est la ceinture ;
- **granularité fine et uniforme** (le facteur causal), pas de gros incréments ;
- **revue adverse en contexte frais** : le diff satisfait la **spec**, pas seulement les tests ;
- **anti-tautologie** (`review-validator`) : assertion réelle, pas de test vide.

> La recherche recommanderait d'encoder ces garde-fous en **hook write-time**. La doctrine de ce
> plugin les met en **review + verify** (0 garde de session). C'est la tension assumée que L9
> tranche — voir `references/preuves.md`. Ce skill n'en dépend pas : il décide, il n'enferme pas.

## Seuils (points de départ, à calibrer — non prouvés)

- Changement **descriptible en une phrase** et non risqué → impl directe + `test` léger, sauter la
  cérémonie TDD.
- **Flakiness** notable sur un test (ordre de grandeur de référence : ~1,5 % chez Google) → ne pas
  en faire un oracle de gating.
- **Ambiguïté** non levée après **une** passe de clarification → étape 0 (escalade).
- **Tests générés** par le modèle → n'accepter comme oracle que filtrés (compile + passe de façon
  fiable + augmente la couverture), façon TestGen-LLM.

Ces seuils sont des **paramètres**, pas des constantes prouvées (`references/preuves.md`, §non
établi). Ils déclenchent une bascule de mode, jamais un verdict chiffré.

## Ce que ce skill NE fait PAS

- Il **ne découpe pas** le change en tickets — c'est le skill `change-decomposer`.
- Il **n'écrit aucun test** et **n'implémente rien** — c'est le workflow `run`.
- Il **ne re-décide pas** un mode déjà posé sur un ticket : la décision est prise une fois.
- Il **ne rend aucun verdict de qualité** : il choisit un mode et le justifie en une phrase.

## Références

- `references/preuves.md` — la base de preuves distillée (pourquoi l'arbre a cette forme), les
  niveaux de confiance, et ce qui reste non établi. La matière brute reste
  `docs/scd-spec-dev/Decider quand faire du TDD.md` (hors plugin).
- `references/strategies.md` — le catalogue des stratégies (property-based, characterization/golden
  master, approval/snapshot, intégration/contrat, mutation) et leurs conditions de domination.
