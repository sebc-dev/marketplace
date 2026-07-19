# Référence — Rubric de test (agnostique)

<role>
Le standard de qualité des tests que `test-writer` produit et que `test-validator` fait respecter. Distillé de la discipline du test (Fowler, Khorikov, Meszaros, données Google). Agnostique à toute techno.
</role>

<principles>
## Fondamentaux

- Tester le **comportement observable**, jamais l'implémentation interne.
- Test de validation : « si je refactore l'implémentation sans changer le comportement, ce test passe-t-il encore ? » Sinon → à réécrire.
- Hiérarchie de vérification : sortie (retours) > état > communication (mocks).
- Un test = un concept logique = une raison d'échouer.

## AAA (obligatoire)
Arrange (préparer le SUT et les données) / **Act (une seule ligne)** / Assert (vérifier le comportement observable), séparés par une ligne vide. Plusieurs lignes en Act = plusieurs comportements → scinder.

## Nommage
Format : `scenario_et_resultat_attendu`, en langage naturel, compréhensible **sans lire le corps**.
- Bon : `delivery_with_past_date_is_invalid`, `cart_applies_discount_when_total_exceeds_threshold`.
- Mauvais : `testIsValid`, `test1`, `itWorks`.

## FIRST
- **Fast** : < 100 ms/test ; zéro I/O réelle.
- **Isolated** : exécutable seul, dans n'importe quel ordre ; zéro état mutable partagé.
- **Repeatable** : déterministe ; horloge et aléatoire injectables (jamais `Date.now()`/`new Date()` direct, seed fixe).
- **Self-validating** : assertions explicites, pass/fail automatique.
- **Timely** : écrit au moment du développement (ici : avant l'impl).
</principles>

<selection>
## Sélection des cas (EP + BVA)

Pour chaque comportement, couvrir systématiquement :
1. **Happy path** — cas nominal.
2. **Boundary** — valeurs limites (17/18/19 pour un seuil à 18).
3. **Error** — entrées invalides, null/undefined/vide.
4. **Edge** — collections vides, chaîne vide, zéro, négatifs.

Isoler chaque partition invalide (un cas par test) pour localiser précisément la cause d'échec. Les cas `error`/`edge` correspondent souvent aux SHALL `If… then… shall…`.

## Données de test
- **Test Data Builder** avec valeurs par défaut sensées ; ne spécifier **que** les champs pertinents au comportement testé.
- Fixtures fraîches ; jamais d'état mutable partagé.
- Tests paramétrés : label lisible par jeu ; ne jamais mélanger chemins succès et erreur dans une même table.
- **DAMP > DRY** dans les tests : scénarios inline et explicites ; ne factoriser que les mécanismes (builders, assertions custom). Pas de `beforeEach` qui masque l'intention.
</selection>

<doubles>
## Doubles de test — usage minimal

```
Dummy → remplit un paramètre, jamais utilisé
Stub  → réponses pré-programmées (simule des entrées)
Fake  → implémentation simplifiée (ex. base en mémoire)
Mock  → vérification de comportement sortant (DERNIER RECOURS)
```
Règles :
- Mocker **seulement** les dépendances hors-process non maîtrisées (API externes, SMTP, bus de messages).
- Vraies collaborations pour les dépendances internes ; préférer les fakes aux mocks.
- **> 2-3 doubles dans un test = signal de refactoring** du SUT.
- « Ne mocke que ce que tu possèdes » → wrappe les libs tierces dans un adaptateur.
</doubles>

<anti-patterns>
## Anti-patterns (interdits)

| Anti-pattern | Détection | Correction |
|---|---|---|
| **The Liar** | `expect` absent ou trivial | Vérifier un comportement observable concret |
| **The Mockery** | Plus de mocks que d'assertions | Réduire les doubles, vraies collaborations |
| **The Inspector** | Réflexion, cast, accès privé | Tester via l'API publique seulement |
| **The Giant** | Test > 50 lignes | Scinder (1 concept = 1 test) |
| **Fragile** | Casse au refactoring sans bug | Asserter sorties et effets observables |
| **The Nitpicker** | `toEqual` sur objet/JSON entier | Asserter les champs pertinents |
| **Free Ride** | Assertion greffée sur un test existant | Un test par comportement |
| **Flaky** | `sleep`, `Date.now()`, réseau | Horloge injectable, seed fixe, zéro I/O réelle |
| **Tautologie** | L'assertion ré-implémente la logique | Asserter le résultat attendu en dur/indépendant |

## Couverture
Indicateur **négatif** (faible = certainement sous-testé), **jamais une cible** (haute ≠ bien testé). Ne jamais écrire de test sans assertion pour gonfler la couverture.

## Quand supprimer un test
Fonctionnalité obsolète · couplé à l'implémentation (casse à chaque refactoring) · dupliqué par un test de portée plus large · non traçable à une exigence · `@Ignored`/skip permanent · irréparablement flaky.
</anti-patterns>

<checklists>
## Avant de valider un test
- Le nom décrit scénario ET résultat attendu.
- AAA, Act sur une seule ligne.
- Assertions sur le comportement observable (pas l'implémentation).
- Survit à un refactoring interne du SUT.
- Valeurs limites et cas d'erreur couverts.
- Déterministe et indépendant.
- Doubles ≤ 2-3, aucun accès privé, aucun `sleep`.

## Anti-flakiness
- Horloge injectable (pas de `Date.now()`/`new Date()` direct).
- Zéro appel réseau réel, zéro accès disque réel (ou abstrait).
- Zéro état mutable partagé, aléatoire à seed fixe.
- Assertions indépendantes de l'ordre des collections.
</checklists>
