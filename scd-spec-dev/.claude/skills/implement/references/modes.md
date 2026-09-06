# Les quatre modes de vérif & le cycle par ticket

Charge ce bloc quand il faut la **discipline par mode** ou l'ordre exact des phases. Le mode vit dans
le champ `**Vérif :**` du ticket, **décidé une fois** par `strategie-verif` à la décomposition, jamais
re-décidé au run.

## Ce que chaque mode exige

| Mode | Preuve attendue | Discipline dure |
|---|---|---|
| **`tdd`** | 1 test nommé `SC-<NN><lettre>` par critère, **ROUGE avant l'impl**, puis **VERT** | l'`implementer` **n'édite jamais** les tests ; preuve = `0 failed` **et** `git diff` vide sur les tests |
| **`test`** | l'impl prouve d'abord l'**intégration** (build/typecheck/lint/run), puis tests écrits **juste après**, **VERTS** | test-after légitime (legacy, characterization, couplage I/O) ; mêmes gardes sur les tests une fois écrits |
| **`observé`** | une **preuve observable** capturée (sortie, CI local, script one-shot, capture) | ce qu'un agent ne peut pas constater (rendu visuel, effet externe) → **`humanCheckRequired`**, jamais une attestation fausse |
| **`aucun`** | rien à prouver : spike/exploration/prototype | **pas de segment test, pas de verify** ; le code est jetable ou promu par un ticket ultérieur |

## La ceinture verify-time — le cœur de la doctrine 0-hook

Le `verifier` part en **contexte frais** (il n'a pas écrit le code) et, en **`tdd` comme en `test`** :

1. se place sur un **checkout propre** ;
2. **rejoue** les tests → exige `0 failed` ;
3. exige un **`git diff` vide** sur les fichiers de test.

Un test supprimé, `.skip`é, ou réécrit pour toujours passer est **visible ici**. C'est le rattrapage
réel du reward hacking, à la place du hook write-time assumé absent (skill `review`, § doctrine). En
`observé`, le `verifier` produit la preuve observable ou remonte `humanCheckRequired`. En `aucun`, pas
de `verifier`.

## Le cycle par ticket (workflow `implement-ticket`)

15 phases. Le **segment central varie selon le mode** ; le reste est commun.

| # | Phase | Modes | Porte |
|---|---|---|---|
| 1 | **Branch** | tous | arbre propre (séquentiel) ; `impl/<slug>-NN` depuis la base à jour |
| 2 | **Rebase** | tous | préventif, idempotent (`--onto`) ; jamais de résolution auto |
| 3 | **Prepare** | tous | `ticket-briefer` → BRIEF depuis le fichier ticket, **sans hypothèse OpenSpec** |
| 4 | **Red** | tdd | 1 test/critère AVANT le code, ROUGE |
| 5 | **Validate** | tdd · test | 1 critère = 1 test, cas limites, anti-tautologie |
| 6 | **Green** | tdd · test | impl jusqu'au vert, tests intacts, diff test vide |
| — | **Green / Red / Validate** | test | l'impl prouve l'intégration, puis tests-après VERTS |
| — | **Green** | observé · aucun | preuve d'intégration (observé) / spike (aucun) |
| 7 | **Verify** | tdd · test · observé | ceinture (tdd/test) ou preuve observable/`humanCheckRequired` (observé) |
| 7½ | **Quality** | tous si `.claude/quality.json` | `quality-analyzer` → `quality-fixer` (autofix sûr) → re-analyze ; `blocking` échoue, `advisory` → findings. No-op sans le fichier |
| 8 | **Context** | tous | `review-context` : dossier résolu **une fois** pour les six reviewers de code |
| 9 | **Review** | tous | **8 reviewers ∥** contexte frais : 6 code + change + integrity (skill `review`) |
| 10 | **Triage** | tous | `review-validator` : reproduit, ne garde que correction/exigence ; au doute skip |
| 11 | **Apply** | tous | `fix-applier` chirurgical, re-vérifie selon le mode |
| 12 | **Record** | tous | `progress-recorder` coche les critères satisfaits, commit sur la branche dédiée |
| 13 | **Describe** | tous | `pr-describer` : corps en couches + matrice critère→test, findings appliqués **et** rejetés |
| 14 | **PR** | tous | `pr-author` : push + PR ready, ou **draft** anti-orphelinage si empilée |

**Producteur ≠ vérificateur** partout : celui qui écrit (`test-writer`, `implementer`, `fix-applier`)
n'est jamais celui qui juge (`test-validator`, `verifier`, les 8 reviewers, `review-validator`).

## Statuts de blocage (ce que le run rend)

`blocked-branch` · `blocked-rebase` · `blocked-brief` · `blocked-red` · `blocked-tests-modified` ·
`blocked-impl` · `blocked-verify` · `blocked-quality` (+ `-config` / `-tests-touched`) ·
`blocked-record` · `blocked-branch-drift` · `blocked-after-fix`. Sur tout `blocked-*` : **aucune PR
ouverte**, la branche du ticket existe déjà (travail non perdu), et une fiche de chantier consigne le
fait (sinon il disparaît au `/clear` — rien sur le disque ne distingue un run bloqué d'un ticket
jamais lancé).
