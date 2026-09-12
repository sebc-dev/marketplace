---
description: "Review de pertinence à la demande, HORS du cycle run : lance la même batterie de reviewers en contexte frais (huit dimensions — architecture, sécurité, conventions, propreté, error-handling, couverture, change, integrity) sur un diff donné (une branche, une PR, un range, ou l'arbre de travail), puis un triage adversarial. Producteur ≠ vérificateur : les reviewers n'ont pas écrit le code. Lecture seule — elle RAPPORTE des findings, elle n'applique aucun correctif et n'ouvre aucune PR. Complète /scd-spec-dev:run pour relire du code déjà écrit."
argument-hint: "[<change> NN | <range git> | <#PR> | rien = branche courante vs défaut]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Task
  - Bash(openspec:*)
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git rev-parse *)
  - Bash(ls *)
  - Bash(gh pr *)
  - Bash(glab mr *)
  - AskUserQuestion
---

## Ce que fait cette commande

Tu joues la **review de pertinence** — la batterie de reviewers en contexte frais — sur un diff **déjà
écrit**, sans passer par le workflow `run` : pas de branche créée, pas d'implémentation, pas de PR.
C'est l'utilitaire pour relire un travail existant (un ticket déjà implémenté, une PR, une branche, un
range arbitraire) avec la même rigueur que le cycle.

La substance des dimensions vit dans le skill **`review`** ; cette commande est le point d'entrée :
elle résout le diff, résout le contexte une fois, orchestre le fan-out, triage, et **rapporte**.

Ratio : ~10 % humain / 90 % IA (l'humain lit le rapport et décide quoi corriger).

## Ce qu'elle ne fait JAMAIS

- **Elle n'écrit aucun code et n'applique aucun correctif.** Elle rapporte des findings ; l'humain (ou
  `/scd-spec-dev:run` sur le ticket) applique. C'est ce qui la garde utilitaire et sûre.
- **Elle n'ouvre, ne pousse et ne merge aucune PR**, ne crée aucune branche, ne coche aucun critère.
- **Elle ne juge pas le code qu'elle-même aurait écrit** : les reviewers partent en contexte frais.

## Étape 1 — Résoudre le diff cible

Selon `$ARGUMENTS` :

- **`<change> NN`** → le ticket : diff de sa branche `impl/<slug>-NN` contre sa base
  (`git merge-base` avec le défaut). Résous le slug par `ls openspec/changes/<x>/tickets/NN-*.md`. Ce
  cas active aussi la dimension **change** (le diff honore-t-il le change ?).
- **`<range git>`** (ex. `main...HEAD`, `abc123..def456`) → le range tel quel.
- **`#PR`** → la PR : `gh pr diff <n>` / `glab mr diff <n>`, et sa branche.
- **Rien** → la branche courante contre la branche par défaut
  (`git symbolic-ref refs/remotes/origin/HEAD` → défaut ; range = `<défaut>...HEAD`).

Ambigu ou vide → `AskUserQuestion`. Établis la **liste des fichiers modifiés** (`git diff --name-only`)
et distingue impl / tests — les reviewers en ont besoin. Communique en français.

## Étape 2 — Résoudre le contexte (une fois)

- **Si un ticket est identifié** (cas `<change> NN`) : produis le BRIEF via l'agent `ticket-briefer`
  (Task) sur `openspec/changes/<x>/tickets/NN-*.md`, puis le **dossier de review** via `review-context`
  (Task) — invariants de `docs/architecture.md`, le sous-graphe LikeC4 touché par le diff (par le
  MCP `likec4`), ADR contraignants, décisions/hors-périmètre, aides (`.claude/review.json`). C'est ce
  dossier qui évite six lectures redondantes. La couche « Impact architecture » d'une PR est
  produite par `run` (phase `Describe`), pas ici : cette commande rapporte, elle ne décrit aucune PR.
- **Sinon** (range/PR sans ticket) : pas de BRIEF ni de dossier riche. Constitue un contexte léger — la
  liste des fichiers, `CLAUDE.md`, `docs/architecture.md` s'il existe — et **dis-le** dans le rapport :
  hors d'un ticket, il n'y a ni critères ni hors-périmètre, donc la dimension **couverture** ne peut
  pas réclamer « critère sans test » et la dimension **change** est **sautée** (pas de change à
  confronter).

## Étape 3 — Fan-out : les reviewers en parallèle, contexte frais

Lance les reviewers **en parallèle** (plusieurs `Task` dans un seul message), chacun sur sa **seule**
dimension, sur le diff résolu. Chaque reviewer classe `bloquant`/`suggestion` et rédige un
`correction_prompt` autonome (même schéma de finding que le cycle) :

- **six reviewers de code** — `architecture-reviewer`, `security-reviewer`, `conventions-reviewer`,
  `cleanliness-reviewer`, `error-handling-reviewer`, `coverage-reviewer` — sur le diff + le dossier de
  review ;
- **`integrity-reviewer`** — escape-hatches (`@ts-ignore`, `as any`, `eslint-disable`, `.skip(`,
  `# noqa`, `--no-verify`) et chemins protégés affaiblis, dans les **lignes ajoutées** ;
- **`change-reviewer`** — **seulement si un ticket/change est identifié** — au niveau artefact : le diff
  honore-t-il le change, sans conflit avec les specs vivantes (`openspec validate --strict`) ?

Un reviewer sauté/échoué est simplement absent du rapport ; dis-le.

## Étape 4 — Triage adversarial

Passe tous les findings à l'agent `review-validator` (Task) : il **reproduit** chaque finding avant de
le retenir, ne garde que ce qui touche la **correction** ou une **exigence**, rejette style/spéculation/
sur-engineering/hors-scope/doublon ; **au doute, skip**. Le triage décide `apply`/`skip` — il ne
corrige rien (cette commande non plus).

## Étape 5 — Rapporter

```
# Review — <cible> · <N fichiers, +A/-B>

Contexte : [ticket <change> NN, dossier résolu | range/PR — contexte léger, dimensions change/couverture limitées]

## Retenus (apply) — [N]
| Dimension | Sévérité | Emplacement | Résumé |
|---|---|---|---|
| sécurité | bloquant | src/api/user.ts:42 | entrée non validée … |

## Rejetés au triage (skip) — [N]
[une ligne par finding rejeté, avec le motif du rejet]

## Dimensions
[jouées / sautées, et pourquoi une l'a été]
```

**Prochaine action** : si des findings retenus concernent un ticket, `/scd-spec-dev:run <change> NN`
les fait appliquer par le cycle (le triage y est rejoué, c'est voulu — la review à la demande ne
court-circuite pas la porte du run). Hors ticket, l'humain applique à la main.

## Ce que tu NE fais PAS

- Tu ne lis pas pour réécrire : tu ne modifies aucun fichier, tu n'appliques aucun `correction_prompt`.
- Tu n'ouvres, ne pousses, ne merges aucune PR, tu ne crées aucune branche.
- Tu ne remplaces pas la review du cycle : sur un ticket, la porte reste `/scd-spec-dev:run`.

## Skills actifs

- `review` — les huit dimensions et leurs seuils de blocage (`references/dimensions.md` pour le
  détail). Chaque agent de reviewer porte de toute façon déjà sa propre dimension.
- `implement` — résolution du ticket quand la cible est `<change> NN`.

## À la fin

Rappelle en une ligne : combien de findings retenus (dont bloquants), et la commande qui les fait
appliquer si un ticket est en jeu.
