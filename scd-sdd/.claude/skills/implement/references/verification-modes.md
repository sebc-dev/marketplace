# Référence — Modes de vérification et enforcement déterministe

<role>
La mécanique de vérification du workflow, **par mode de lot**. Le contrat amont (`scd-sdd`) déclare pour chaque lot `Rn` un `_vérif : <mode>_` ∈ `TDD` (défaut) · `test-after` · `check` · `inhérent`. Ce fichier explique comment le workflow honore chacun : l'ordre des phases, la traduction EARS→test (modes-test), la vérif observable (check/inhérent), l'invariant « ne jamais toucher aux tests » et pourquoi c'est un check déterministe plutôt qu'un hook, la preuve par sortie réelle. Utilisé par `test-writer`, `test-validator`, `implementer`, `verifier`, `fix-applier` et la commande `run`.
</role>

<modes>
## Le mode gouverne le segment de vérification

L'invariant du contrat est constant : **chaque `FR`/`SHALL` du lot est rattaché à ≥ 1 tâche d'impl ET à ≥ 1 vérification observable**. Ce qui varie, c'est la **forme** de cette vérification. Le workflow lit `brief.verifMode` (défaut `TDD` si le marqueur est absent — rétro-compatible) et adapte **uniquement le segment du milieu** ; Branch/Rebase/Prepare en amont et Review/Triage/Apply/Record/PR en aval sont invariants.

| Mode | Segment de vérification | Preuve |
|---|---|---|
| `TDD` (défaut) | `Red`(test-writer, rouge) → `Validate` → `Green`(implementer, tests intacts) | sortie `0 failed` |
| `test-after` | `Green`(implementer d'abord) → `Red`(test-writer, **vert** attendu) → `Validate` → `Green`(porte) | sortie `0 failed` |
| `check` | `Green`(implementer) → `Verify`(verifier, contexte frais) | `observableProof` ou `humanCheckRequired` |
| `inhérent` | `Green`(implementer) → `Verify`(verifier ré-exécute le critère d'acceptation) | run vert (CI/terraform/script) ou `humanCheckRequired` |

**Le défaut reste `TDD`.** Un `check`/`inhérent` posé sur de la vraie logique métier est un finding amont (`scd-sdd:analyze`), pas un raccourci que le workflow entérine. Les agents aval **ne redécident jamais** le mode : ils l'appliquent et signalent ce qui cloche.
</modes>

<tdd>
## Mode TDD — l'ordre non négociable

Repris de la constitution TDD (Spec Kit) : **aucun code de production n'est écrit avant que**
1. les tests soient **écrits**,
2. **validés** (correspondance au contrat, qualité — voir `testing-rubric.md`),
3. confirmés **en échec (rouge)**.

C'est déjà l'ordre porté par `tasks.md` (T-test avant T-impl, dans le même lot). Le workflow le matérialise en phases : `Red` → `Validate` → `Green`.

## Mode test-after — l'impl d'abord, le test après (toujours automatisé)

Pour les lots où le test-first n'aide pas (refactor à comportement constant, exploration) mais où un test automatisé reste dû. Ordre : `Green`(impl-first, prouve build/run) → `Red`(test-writer écrit les tests contre l'impl existante, état attendu **vert**) → `Validate` → `Green`(porte finale : `0 failed`, tests intacts). Un test qui échoue légitimement révèle un écart de l'**impl** à combler (jamais un test à affaiblir). La justification d'une ligne du contrat accompagne ce mode.

## EARS → test (modes TDD et test-after)

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

<observable>
## Modes check et inhérent — la vérif observable (pas de test unitaire)

Certaines features ne se prêtent pas à un test automatisé : CI, infra, config, scaffolding, mise en page, one-shot. La preuve reste **observable et nommée**, mais prend une autre forme, produite par l'agent `verifier` **en contexte frais** (il n'a pas écrit le code — c'est ce qui remplace, pour ces modes, l'invariant « producteur ≠ vérificateur » du TDD).

- **`check`** — vérification observable **dédiée**, distincte de l'impl : lancer le service et constater, requêter l'état après une opération, valider un artefact produit. Le `verifier` exécute, capture la sortie dans `observableProof`.
- **`inhérent`** — le **critère d'acceptation de la tâche d'impl EST** la preuve (« le pipeline CI passe au vert », « `terraform apply` converge »). Le `verifier` ré-exécute ce critère (build/lint CI en local, `terraform plan`/`apply`, script one-shot) et capture la sortie.

**`humanCheckRequired`** — ce qu'un agent ne peut pas constater par exécution (rendu visuel d'une mise en page, effet sur un système externe, résultat visible seulement en CI post-merge) n'est **jamais faussement attesté** : le `verifier` l'émet en item actionnable, que `pr-author` remonte en **checklist** dans la PR pour le reviewer humain. `verified: true` est licite s'il ne reste que des `humanCheckRequired` documentés ; `verified: false` est réservé à une vérif qui **échoue** (critère non satisfait).
</observable>

<enforcement>
## Invariant « tests intacts » (déterministe, pas un hook)

Dès qu'un fichier de test existe, `implementer` (et `fix-applier`) **ne le modifient jamais**. La garantie n'est pas un hook mais un **check git-diff** intégré à l'agent :

```
git diff -- <chaque fichier de test>   # DOIT être vide
```

Si le diff n'est pas vide → restaurer les tests (`git checkout -- <tests>`), ré-exécuter, et si le vert dépendait d'une modification de test → **échec** (`testsUntouched: false`), on n'annonce pas le vert. En modes `check`/`inhérent` (aucun fichier de test), l'invariant est **vacant** : `testsUntouched: true`.

**Pourquoi pas un hook ?** Un hook `PreToolUse` est *statique* : il ne sait pas si on est en phase « écriture des tests » (où éditer un test est légitime) ou en phase « verte » (où c'est interdit) — ni même si le lot a des tests. Les fichiers de test ne sont connus qu'au runtime, après `test-writer`. Le check git-diff, lui, est *conscient de la phase* et vérifie l'état réel. C'est l'application correcte du principe advisory-vs-déterministe : ce qui doit arriver à 100 % **et dépend de la phase** se garantit dans la boucle, pas par une règle globale.

## Porte de vérification par preuve

La preuve est **mécanique**, jamais une affirmation (« looks done » est le mode d'échec classique de l'auto-évaluation) :
- modes-test → `passing: true` **uniquement** si la sortie réelle montre `0 failed` ;
- modes check/inhérent → `verified: true` **uniquement** avec un `observableProof` capturé (ou des `humanCheckRequired` documentés).

La preuve est remontée dans `output`/`observableProof` : c'est ce qui alimente la description de PR, à la manière d'un `/goal` dont la condition doit être démontrable par un output mécanique.
</enforcement>

<pitfalls>
## Pièges à éviter

- **Faux vert / fausse preuve par contournement** : affaiblir une assertion via le code, coder une valeur en dur pour matcher l'attendu, ajouter `skip`/`xfail`, court-circuiter le chemin testé — ou, en check/inhérent, prétendre avoir constaté un rendu qu'on n'a pas ouvert. Interdit : implémenter le vrai comportement, observer réellement.
- **Rouge illégitime (TDD)** : un test qui échoue sur un import cassé / une erreur de syntaxe n'est pas un rouge TDD valide ; c'est un test à corriger. Seul l'échec « assertion non satisfaite / fonctionnalité absente attendue » compte.
- **Mode mal appliqué** : traiter un lot `TDD` comme un `check` (sauter les tests) est une régression grave. Le mode vient du contrat ; les agents l'appliquent, ne l'inventent pas.
- **Boucle non gardée** : les corrections (tests, vert) sont bornées par un compteur **et** `budget.remaining()`. Un lot qui ne verdit/ne se vérifie pas retourne un statut `blocked-*`, il ne boucle pas indéfiniment.
- **Élargir le périmètre** : implémenter au-delà du lot (fonctionnalité non couverte, refactoring adjacent) est du sur-engineering — hors périmètre.
- **Corriger le contrat en douce** : si la vérif révèle une SHALL erronée ou un mode mal choisi, ne pas « ajuster » pour coller au code. Signaler pour un retour `scd-sdd`.
</pitfalls>
