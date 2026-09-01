# Référence — Modes de vérification et enforcement déterministe

**Deux points de chargement, tous deux des commandes** : `/scd-sdd:run` et
`/scd-sdd:run-parallel`, intégralement, avant de lancer le workflow — ce sont elles qui doivent
savoir quel segment le mode déclenche.

**Aucun agent ne la charge**, et c'est délibéré : chaque agent du segment reçoit le mode dans son
prompt et porte la discipline de **son** rôle dans son corps (`test-writer` l'état d'exécution
attendu, `implementer` le check « tests intacts », `verifier` la preuve observable). Ce fichier est
la vue d'ensemble que seul l'appelant a besoin d'avoir.

<role>
La mécanique de vérification du workflow, **par mode de ticket**. Le ticket déclare un
`**Vérif :**` ∈ `test` (défaut) · `observé`. Ce fichier explique comment le workflow honore chacun :
l'ordre des phases, la traduction critère→test, la preuve observable, l'invariant « ne jamais
toucher aux tests » et pourquoi c'est un check déterministe plutôt qu'un hook. **Il porte la table
mode→segment** : le `SKILL.md` et `workflow-template.md` y renvoient et ne la recopient pas.
</role>

<modes>
## Le mode gouverne le segment de vérification

L'invariant est constant : **chaque critère du ticket est rattaché à ≥ 1 tâche d'impl ET à ≥ 1
vérification observable**. Ce qui varie, c'est la **forme** de cette vérification. Le workflow lit
`brief.verifMode` (défaut `test` si le marqueur est absent) et adapte **uniquement le segment du
milieu** ; Branch/Rebase/Prepare en amont et Review/Triage/Apply/Record/PR en aval sont invariants.

| Mode | Segment de vérification | Preuve |
|---|---|---|
| `test` (défaut) | `Red`(test-writer, rouge) → `Validate` → `Green`(implementer, tests intacts) | sortie `0 failed` |
| `observé` | `Green`(implementer) → `Verify`(verifier, **contexte frais**) | `observableProof` capturé, ou `humanCheckRequired` |

⚠️ **Deux modes, et il n'y en avait pas toujours deux.** Le cycle `1.x` en portait quatre —
`test-after` distinguait *quand* le test s'écrit, `inhérent` distinguait *ce qui fait preuve*. Les
deux axes étaient déclarés par un `tasks.md` qui n'existe plus (`DECISIONS.md` §D41). Ce qu'ils
protégeaient survit : un test dû reste dû, et une preuve reste capturée.

**Le défaut reste `test`.** Un `observé` posé sur de la vraie logique métier est un **défaut de
découpage**, pas un raccourci. Les agents aval **ne redécident jamais** le mode : ils l'appliquent
et signalent ce qui cloche.
</modes>

<test>
## Mode `test` — l'ordre non négociable

**Aucun code de production n'est écrit avant que**
1. les tests soient **écrits**,
2. **validés** (correspondance au ticket, qualité — voir `testing-rubric.md`),
3. confirmés **en échec (rouge)**.

Le workflow le matérialise en phases : `Red` → `Validate` → `Green`.

## Critère → test

Règle d'or : **un critère = au moins un test nommé.** Les critères d'un ticket sont écrits en
français et en langage observable — c'est délibéré (§D41) : la notation normée du cycle `1.x`
existait pour un agent vérificateur qui n'existe plus. La traduction en test est ton travail, et
elle suit la forme du critère :

| Forme du critère | Exemple de test |
|---|---|
| un déclencheur produit un effet | `submit_valid_form_creates_account` |
| une entrée invalide est refusée | `submit_with_taken_email_is_rejected` |
| un état interdit une action | `while_locked_login_is_refused` |
| une propriété toujours vraie | `password_is_always_stored_hashed` |
| un cas limite nommé | `export_of_empty_book_has_header_only` |

Un « et » dans un critère = deux comportements → **deux tests**. Un adjectif nu — « rapide »,
« robuste », « intuitif » — n'est pas testable : si un ticket en contient un, c'est un défaut
**amont** à signaler, pas à deviner.
</test>

<observable>
## Mode `observé` — la preuve capturée, sans test automatisé

Certains tickets ne se prêtent pas à un test automatisé : CI, infra, config, scaffolding, mise en
page, one-shot. La preuve reste **observable et nommée**, mais prend une autre forme, produite par
l'agent `verifier` **en contexte frais** — il n'a pas écrit le code, et c'est ce qui remplace, pour
ce mode, l'invariant « producteur ≠ vérificateur » que le rouge/vert porte en mode `test`.

Deux formes, et le `verifier` capture la sortie dans les deux cas :
- une **vérification dédiée**, distincte de l'impl : lancer le service et constater, requêter l'état
  après une opération, valider un artefact produit ;
- le **critère d'acceptation lui-même**, quand il est déjà exécutable (« le pipeline CI passe au
  vert », « `terraform apply` converge »). Le `verifier` le ré-exécute.

**`humanCheckRequired`** — ce qu'un agent ne peut pas constater par exécution (rendu visuel d'une
mise en page, effet sur un système externe, résultat visible seulement en CI post-merge) n'est
**jamais faussement attesté** : le `verifier` l'émet en item actionnable, qui remonte en
**checklist** dans la PR pour le reviewer humain. **Qui l'écrit dépend du chemin** : `pr-describer`
en régime nominal — c'est lui qui compose le corps, et `pr-author` le publie tel quel sans y
toucher ; `pr-author` **seulement sur son chemin de repli**, quand aucun corps ne lui est fourni et
qu'il compose un corps minimal. Dans les deux cas, **aucun agent ne coche jamais une case** : elles
appartiennent au reviewer. `verified: true` est licite s'il ne reste que des `humanCheckRequired`
documentés ; `verified: false` est réservé à une vérif qui **échoue**.

Quand `specs/NNN-slug/maquette.md` existe, le brief embarque l'extrait verbatim des blocs
`## Écran :` que le ticket livre, et le `humanCheckRequired` de mise en page devient
**comparatif** : il cite l'écran à comparer, au lieu de renvoyer l'humain à ce qu'il imagine. La
maquette reste **advisory** — ni gate ni verdict de conformité.
</observable>

<enforcement>
## Invariant « tests intacts » (déterministe, pas un hook du plugin)

Dès qu'un fichier de test existe, `implementer` (et `fix-applier`) **ne le modifient jamais**. La
garantie est un **check git-diff** intégré à l'agent :

```
git diff -- <chaque fichier de test>   # DOIT être vide
```

Si le diff n'est pas vide → restaurer les tests (`git checkout -- <tests>`), ré-exécuter, et si le
vert dépendait d'une modification de test → **échec** (`testsUntouched: false`), on n'annonce pas le
vert. En mode `observé` (aucun fichier de test), l'invariant est **vacant** : `testsUntouched: true`.

**Pourquoi pas le garde de chemins ?** `.claude/guards.json` peut protéger les tests, et **c'est le
bon choix quand l'humain les écrit**. Mais quand c'est `test-writer` qui les produit, un blocage par
chemin casserait la boucle : il les crée puis les corrige jusqu'à ce qu'ils échouent pour la bonne
raison. Le check git-diff, lui, est **conscient de la phase** — il sait qu'on est passé en phase
verte, ce qu'un hook statique ignore. Les deux mécanismes sont complémentaires et la référence
`socle/references/guards.md` porte l'arbitrage, bloc `<arbitrage-tests>`.

## Porte de vérification par preuve

La preuve est **mécanique**, jamais une affirmation (« looks done » est le mode d'échec classique de
l'auto-évaluation) :
- mode `test` → `passing: true` **uniquement** si la sortie réelle montre `0 failed` ;
- mode `observé` → `verified: true` **uniquement** avec un `observableProof` capturé, ou des
  `humanCheckRequired` documentés.

La preuve est remontée dans `output`/`observableProof` : c'est ce qui alimente la description de PR.
</enforcement>

<pitfalls>
## Pièges à éviter

- **Faux vert / fausse preuve par contournement** : affaiblir une assertion via le code, coder une
  valeur en dur pour matcher l'attendu, ajouter `skip`/`xfail`, court-circuiter le chemin testé —
  ou, en `observé`, prétendre avoir constaté un rendu qu'on n'a pas ouvert. Interdit : implémenter
  le vrai comportement, observer réellement. ⚠️ **Plusieurs de ces gestes sont désormais bloqués en
  session par la couche 2 des gardes**, et **tracés** : les tenter laisse une ligne dans
  `.claude/guard-log.jsonl`, que l'humain relit.
- **Rouge illégitime (mode `test`)** : un test qui échoue sur un import cassé ou une erreur de
  syntaxe n'est pas un rouge valide ; c'est un test à corriger. Seul l'échec « assertion non
  satisfaite / fonctionnalité absente attendue » compte.
- **Mode mal appliqué** : traiter un ticket `test` comme un `observé` (sauter les tests) est une
  régression grave. Le mode vient du ticket ; les agents l'appliquent, ne l'inventent pas.
- **Boucle non gardée** : les corrections sont bornées par un compteur **et** `budget.remaining()`.
  Un ticket qui ne verdit pas retourne un statut `blocked-*`, il ne boucle pas indéfiniment.
- **Élargir le périmètre** : implémenter au-delà du ticket est du sur-engineering. Le
  **hors-périmètre** de `SPEC.md` fait foi, et il se cite.
- **Corriger le ticket en douce** : si la vérif révèle un critère erroné ou un mode mal choisi, ne
  pas « ajuster » pour coller au code. Signaler pour un retour à `/scd-sdd:tickets`.
</pitfalls>
