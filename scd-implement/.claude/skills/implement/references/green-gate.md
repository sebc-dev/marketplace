# Référence — Discipline rouge/vert et enforcement déterministe

<role>
La mécanique TDD du workflow : l'ordre rouge→vert, la traduction EARS→test, l'invariant « ne jamais toucher aux tests en phase verte » et pourquoi c'est un check déterministe plutôt qu'un hook, la porte verte par preuve. Utilisé par `test-writer`, `implementer`, `fix-applier` et la commande `run`.
</role>

<tdd>
## L'ordre non négociable

Repris de la constitution TDD (Spec Kit) : **aucun code de production n'est écrit avant que**
1. les tests soient **écrits**,
2. **validés** (correspondance au contrat, qualité — voir `testing-rubric.md`),
3. confirmés **en échec (rouge)**.

C'est déjà l'ordre porté par `tasks.md` (T-test avant T-impl, dans le même lot). Le workflow le matérialise en phases : `Red` → `Validate` → `Green`.

## EARS → test

Règle d'or : **une SHALL = un test nommé**. Chaque critère EARS d'un FR livré par le lot devient au moins un test :

| Pattern EARS | Exemple de test |
|---|---|
| `When <event>, shall <réponse>` | `submit_valid_form_creates_account` |
| `If <condition indésirable>, then shall <réponse>` | `submit_with_taken_email_is_rejected` |
| `While <état>, shall <réponse>` | `while_locked_login_is_refused` |
| ubiquitous `The system shall …` | `password_is_always_stored_hashed` |
| `Where <feature>, shall <réponse>` | `when_2fa_enabled_prompts_for_code` |

Un `and` dans une SHALL = deux comportements → deux tests. Un adjectif nu (« rapide/robuste ») n'est pas testable : si le contrat en contient un, c'est un défaut **amont** à signaler, pas à deviner.
</tdd>

<enforcement>
## Invariant « tests intacts » (déterministe, pas un hook)

En phase verte, `implementer` (et `fix-applier`) **ne modifient jamais** les fichiers de test. La garantie n'est pas un hook mais un **check git-diff** intégré à l'agent :

```
git diff -- <chaque fichier de test>   # DOIT être vide
```

Si le diff n'est pas vide → restaurer les tests (`git checkout -- <tests>`), ré-exécuter, et si le vert dépendait d'une modification de test → **échec** (`testsUntouched: false`), on n'annonce pas le vert.

**Pourquoi pas un hook ?** Un hook `PreToolUse` est *statique* : il ne sait pas si on est en phase « écriture des tests » (où éditer un test est légitime) ou en phase « verte » (où c'est interdit). Les fichiers de test ne sont connus qu'au runtime, après `test-writer`. Le check git-diff, lui, est *conscient de la phase* et vérifie l'état réel. C'est l'application correcte du principe advisory-vs-déterministe : ce qui doit arriver à 100 % **et dépend de la phase** se garantit dans la boucle, pas par une règle globale.

## Porte verte par preuve

`passing: true` **uniquement** si la sortie réelle de la commande de test montre `0 failed`. Jamais sur affirmation (« looks done » est le mode d'échec classique de l'auto-évaluation). La sortie est remontée dans `output` : c'est la preuve, à la manière d'un `/goal` dont la condition doit être démontrable par un output mécanique.
</enforcement>

<pitfalls>
## Pièges à éviter

- **Faux vert par contournement** : affaiblir une assertion via le code, coder une valeur en dur pour matcher l'attendu, ajouter `skip`/`xfail`, court-circuiter le chemin testé. Le workflow l'interdit — implémenter le vrai comportement.
- **Rouge illégitime** : un test qui échoue sur un import cassé / une erreur de syntaxe n'est pas un rouge TDD valide ; c'est un test à corriger. Seul l'échec « assertion non satisfaite / fonctionnalité absente attendue » compte.
- **Boucle non gardée** : les corrections (tests, vert) sont bornées par un compteur **et** `budget.remaining()`. Un lot qui ne verdit pas retourne un statut `blocked-*`, il ne boucle pas indéfiniment.
- **Élargir le périmètre** : implémenter au-delà des tests du lot (fonctionnalité non couverte, refactoring adjacent) est du sur-engineering — hors périmètre du lot.
- **Corriger le contrat en douce** : si un test révèle une SHALL erronée, ne pas « ajuster » le test pour coller au code. Signaler pour un retour `scd-feature-specs`.
</pitfalls>
