# Référence — Le contrat BRIEF (la couture invisible)

**Chargement.** Complément du `SKILL.md` de `change-decomposer`. Ce fichier fixe **ce que le fichier
ticket doit contenir** pour que l'aval fonctionne sans jamais connaître OpenSpec. Le
`change-decomposer` **produit** le fichier ticket ; il ne produit pas le BRIEF lui-même.

## La frontière : le fichier ticket est le seul point de passage

```
change OpenSpec ──(change-decomposer)──▶ changes/<x>/tickets/NN-slug.md ──(ticket-briefer)──▶ BRIEF ──▶ run
   proposal/specs/design            LE fichier ticket, seul livrable         objet consommé par tout l'aval
```

**Producteur ≠ consommateur.** Le `change-decomposer` sait tout du change ; les agents aval
(`implementer`, `test-writer`, reviewers…) ne savent **rien** d'OpenSpec. Entre les deux, un seul
artefact : le **fichier ticket**. Un agent aval qui aurait besoin de rouvrir le change pour
comprendre le ticket est le signe que la décomposition a laissé un trou — le ticket doit se suffire.

C'est l'agent **`ticket-briefer`** (écrit au lot L4) qui lit le fichier ticket **sans hypothèse
OpenSpec** et en dérive l'objet `BRIEF`. `change-decomposer` n'a donc qu'une obligation : **écrire un
ticket dont le briefer peut tirer tous les champs du BRIEF.** Ce fichier documente ce contrat pour
que les deux côtés restent alignés à travers les lots.

## Les champs du BRIEF, et d'où le briefer les tire

| Champ du BRIEF | Tiré de… | Ce que `change-decomposer` doit donc garantir |
|---|---|---|
| `criteres[]` (chacun avec son id `SC-<NN><lettre>`) | `## Critères` du ticket | chaque critère observable, un par scénario WHEN/THEN, id stable présent |
| `verifMode` | `**Vérif :**` | l'un des quatre modes concrets (jamais `arbitrage humain`), cohérent avec sa justification |
| `files[]` | `**Fichiers :**` | le périmètre pressenti, suffisant pour juger la parallélisation |
| `blockedBy[]` | `**Bloqué par :**` | des numéros de tickets réels, graphe acyclique |
| `context.why` | `## Ce que ça livre` | le comportement bout en bout, du point de vue utilisateur |
| `context.decisions` | `design.md` du change (résumé dans le ticket au besoin) | ce que le ticket doit respecter de l'approche technique |
| `context.outOfScope` | hors-périmètre du `proposal`/`design` | de quoi empêcher le scope creep en aval |
| `REVIEW_CONTEXT` | ADR contraignants, `security-review.md`, `.claude/review.json` | des pointeurs résolvables — le briefer et `review-context` les rouvriront |

## Ce que cela impose au fichier ticket

- **Autosuffisance.** Titre, `## Ce que ça livre`, `## Critères` doivent se lire **sans** le change
  ouvert. Le vocabulaire est celui du domaine (glossaire `CLAUDE.md`), pas des ids internes du change.
- **Ids stables et exacts.** Le `SC-<NN><lettre>` est le fil critère → test → matrice de PR. Un id
  manquant ou dupliqué casse la traçabilité et le `coverage-reviewer`.
- **Mode concret et justifié.** `verifMode` ∈ {`tdd`, `test`, `observé`, `aucun`}. Une escalade
  `arbitrage humain` non tranchée n'a **pas** sa place dans un fichier écrit : elle se résout à
  l'arbitrage (étape 6) avant l'écriture (étape 7).
- **Périmètre honnête.** `**Fichiers :**` sert la parallélisation ; deux tickets qu'on annonce
  disjoints mais qui se recouvrent produiront des conflits de worktree en aval.

## Ce que `change-decomposer` NE met PAS dans le ticket

- **Aucune référence à OpenSpec** dans le corps du ticket (pas de chemin `openspec/…`, pas de nom de
  delta) : le ticket doit survivre à l'archivage du change. Les pointeurs de `REVIEW_CONTEXT` (ADR,
  `.claude/review.json`) sont des chemins durables du dépôt, pas des chemins de change.
- **Aucune instruction git** ni de commande d'implémentation : le BRIEF décrit *quoi* vérifier, pas
  *comment* brancher ou commiter — cela appartient au workflow `run`.
