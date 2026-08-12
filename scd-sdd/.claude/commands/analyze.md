---
description: "Phase 5 des specs : gate de conformité du contrat (un contrôle bloquant, joué avant d'implémenter). Ne modifie aucun document du contrat. Atteste que spec/plan/tasks sont prêts pour l'implémentation ET que le découpage produira des unités reviewables par un humain. 15 contrôles, rapport à trois niveaux — Critical (bloque l'implémentation), Major (à corriger, ne bloque pas le démarrage), Minor (amélioration) —, verdict PRÊT uniquement si zéro Critical. Consigne son verdict au journal, et porte la liste des corrections dans un chantier de gate pour qu'elle survive au /clear — avec les Major arbitrés une fois pour toutes."
argument-hint: "[NNN ou slug — optionnel, résolu sinon]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Task
  - AskUserQuestion
  - Bash(ls *)
  - Bash(git rev-parse *)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(git mv *)
  - Bash(date *)
---

## Contexte

Tu tiens la **gate de conformité** du cycle. Les documents sont écrits ; ta mission est
d'**attester qu'ils sont prêts** pour une implémentation optimale — ou de dire précisément ce
qui manque.

Deux questions, pas une :

1. **Le contrat tient-il ?** Traçabilité complète, critères testables, frontières tenues.
2. **Le découpage produira-t-il des unités reviewables par un humain ?** Un contrat
   parfaitement tracé mais livrable en un seul bloc produit une review que personne ne fera
   vraiment. C'est la dernière occasion de le corriger : après l'implémentation, redécouper
   coûte le prix du code déjà écrit.

Ce n'est pas une revue de code : il n'existe pas encore. C'est un contrôle qualité du
**contrat** — des « unit tests for English ». Attraper un trou ici coûte infiniment moins cher
qu'après l'implémentation.

Et une contrainte que les passes précédentes t'imposent : **converger**. Une gate qu'on rejoue
trois fois en re-listant les mêmes findings ne valide rien, elle use. C'est pourquoi la liste de
travail est portée par un **chantier de gate** et qu'un Major s'arbitre **une fois**.

Ratio : 30% humain / 70% AI (analyse mécanique ; l'humain décide de corriger, d'arbitrer ou de
passer la main).

## Règles absolues

- **Tu ne modifies aucun document du contrat.** `spec.md`, `plan.md`, `tasks.md` et le socle
  sortent de cette commande **bit pour bit identiques**. Tu écris exactement deux choses,
  ailleurs : la **ligne de journal** et le **chantier de gate**.
- **Tu ne persistes aucun verdict comme état.** Un `PRÊT` écrit sur disque deviendrait faux à
  la première édition d'un document. La gate est bon marché : on la relance. Le chantier de gate
  ne porte **pas** le verdict — il porte la **liste de travail**, qui ne devient pas fausse quand
  un document bouge : elle devient *faite*, et c'est vérifiable.
- **Tu déroules les 15 contrôles intégralement, à chaque passe.** Tu ne sautes **jamais** un
  contrôle parce que la fiche dit « arbitré » : tu détectes tout, tu ne changes que la
  présentation. C'est ce qui empêche la gate de devenir un tampon.
- **On n'arbitre jamais un Critical.** Seuls les Major et les Minor s'écartent, avec motif et
  date. Une demande d'arbitrage sur un Critical se refuse en le disant.
- **Tu ne corriges pas toi-même** : tu nommes le fichier, l'ID et l'action.
- **Tu ne juges pas le code** : il n'existe pas. Les tests sont *prévus* dans `tasks.md`,
  jamais exécutés ici.
- **Pas de préférences de style.** T'en tenir à ce qui affecte la testabilité, la traçabilité,
  les frontières ou la reviewability.
- **Une estimation n'est pas une gate.** Un lot hors seuils de dimensionnement est **Major,
  jamais Critical** — ces seuils sont transposés du code par analogie et le budget est une
  estimation. Les bloquants du découpage sont **qualitatifs** : verticalité, sujet unique,
  indépendance.
- **Un invariant d'architecture franchi est un Major, jamais un Critical.** Bloquer la gate
  dessus, ce serait faire d'`analyze` un `arch-invariants` avant l'heure : c'est la **CI** qui
  mesure une violation sur le code réel, pas une gate documentaire sur un plan. Et **sans
  `docs/archi.md`, le contrôle 15 ne se déclenche pas** — ce n'est pas un finding, c'est une
  phase du socle qui n'a pas été jouée.
- **Verdict `PRÊT` uniquement si zéro Critical.**
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — EARS,
  gate, lot, ADR, invariant, advisory… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Un ID se cite avec son intitulé** à sa première mention — « FR-003 (export CSV) », jamais
  « FR-003 » nu. La règle vaut pour **tout** identifiant que tu emploies, y compris ceux que le
  projet ou la session viennent de créer et que le plugin ne connaît pas. Un identifiant seul
  n'explique rien à qui ne l'a pas sous les yeux.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Processus

1. **Résous la feature cible** — règle de résolution du skill `feature-specs`, section
   « Cibler une feature ». Candidature propre à cette phase : la feature disposant d'un
   **`tasks.md`**. **Annonce la cible retenue.**

2. **Charge la référence** : `references/analyze.md` du skill `feature-specs` — dont sa section
   `<gate>`, qui porte le contrat du chantier de gate.

3. **Lis** `specs/<cible>/spec.md`, `plan.md`, `tasks.md`, plus `docs/prd.md`,
   `docs/stack.md`, `docs/archi.md` **s'il existe** et `docs/adr/`.

3bis. **Récupère l'historique de gate de cette feature**, sans quoi tu repartirais à froid :
   - `ls docs/chantiers/en-cours/*-gate-<cible>.md` → une fiche ouverte ? Lis-la : son
     `## À corriger` est la liste de la passe précédente, son `## Écarté` les arbitrages en
     vigueur.
   - Aucune fiche ouverte → `ls docs/chantiers/archive/*-gate-<cible>.md` et prends la **plus
     récente** : tu en reprends le `## Écarté`, et lui seul. Un arbitrage est une décision, pas une
     note de passage.
   - Rien nulle part → première passe, tu pars de zéro. Ce n'est pas une anomalie.

4. **Déroule les 15 contrôles** de `references/analyze.md` :

   | Groupe | Contrôles | Objet |
   |---|---|---|
   | Traçabilité | 1-3 | spec→PRD, spec→tasks, tasks→spec |
   | Qualité des critères | 4-6 | EARS, verbe vérifiable, atomicité |
   | Frontières | 7-9 | technology-agnostic, scope EXCLU, ambiguïtés |
   | Cohérence | 10-11 | socle, contradictions internes |
   | Reviewability | 12-14 | verticalité, sujet unique, dimensionnement |
   | Architecture | 15 | invariants de `docs/archi.md` — **Major**, et sans objet s'il n'existe pas |

5. **Délègue un second regard en contexte frais** (outil `Task`, les deux **en parallèle** —
   leurs mandats sont disjoints) : **`ears-verifier`** pour les contrôles 1-11,
   **`slice-auditor`** pour 12-14. Recommandé si la feature est grosse, et **fortement** si
   c'est cette session qui a rédigé les documents : elle est alors mal placée pour les juger.

   **Le contrôle 15 reste au contexte principal** : les deux mandats délégués sont inchangés, et
   c'est toi qui as lu `docs/archi.md` à l'étape 3.

6. **Apparie avec la passe précédente**, si elle existe — triplet `[ID]` · fichier · nature :
   - apparié à une entrée d'`## Écarté` → bloc **« Déjà arbitrés »**, hors du décompte qui décide
     du verdict ;
   - présent dans la fiche mais introuvable maintenant → bloc **« Corrigés depuis »** ;
   - le reste → rapport normal.

7. **Produis un seul rapport** classé **Critical / Major / Minor** selon le bloc `<report>` de
   la référence — fusionne les findings des subagents **sans les rejuger** — avec la couverture
   chiffrée, le récapitulatif du découpage et le **Verdict**.

8. **Propose les arbitrages** (`AskUserQuestion`) : s'il reste des Major non arbitrés, demande
   lesquels sont assumés et **exige un motif** pour chacun. Un refus de trancher est une réponse
   valide — le Major reste dans la liste. **Ne propose jamais d'arbitrer un Critical.**

9. **Écris le chantier de gate**, selon `<gate>` de la référence :
   - **`CORRIGER D'ABORD`** → ouvre `docs/chantiers/en-cours/AAAA-MM-JJ-gate-<cible>.md` (ou
     actualise celui qui existe) : les Critical, les Major non arbitrés, les arbitrages dans
     `## Écarté`. Les Minor non arbitrés restent en conversation.
   - **`PRÊT`** → une fiche ouverte existe ? Ajoute `## Issue` (ce qui a été corrigé, en combien de
     passes) et `git mv` vers `archive/`. Aucune fiche → n'en crée pas : il n'y a pas de travail à
     porter.

   Puis `git add` **scopé à la fiche** et `git commit -m "chore(chantier): gate <cible>"` — sans
   quoi l'arbre reste sale et `/scd-sdd:run` tombera en `blocked-dirty-tree`.

10. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Aucune modification de `spec.md`, `plan.md`, `tasks.md`, ni du socle.
- **Tu ne juges pas le socle.** Tu le lis comme référentiel — un `FR` de spec doit tracer vers le
  PRD —, mais la conformité de `docs/brief.md`, `prd.md`, `stack.md`, `archi.md`, `docs/adr/`,
  `ci.md` et `CLAUDE.md` relève d'`/scd-sdd:audit <document>`. Un défaut constaté **dans le socle**
  se **signale**, en nommant cette commande ; il ne devient jamais un finding de cette gate, qui
  atteste des specs.
- **Tu n'écris pas le rapport sur disque** : il reste en conversation. La fiche de gate porte la
  **liste de travail** — les Critical, les Major non arbitrés, les arbitrages — pas la couverture
  chiffrée, pas le récapitulatif de découpage, pas les Minor non arbitrés.
- **Tu n'écris jamais le verdict dans la fiche.** Il vit au journal, daté, et ne se relit que sous
  contrôle de fraîcheur.
- Tu n'arbitres pas un Critical, et tu n'arbitres rien **à la place de l'humain** : un arbitrage
  sans motif explicite n'est pas un arbitrage.
- Tu ne sautes aucun contrôle, même sur un finding déjà arbitré.
- Tu ne prescris pas **comment** implémenter.
- Tu n'exécutes aucun test.

## Consigne au journal

Le **verdict** de cette gate n'existe **nulle part ailleurs** — surtout pas dans le chantier de
gate, qui porte la liste de travail et jamais le verdict. Sans cette ligne, savoir si le contrat a
été validé, et quand, est perdu à la fin de la session.

Les deux écritures sont donc disjointes et le restent : **le journal dit ce qui est arrivé** (« le
28/07, la gate a rendu PRÊT »), **la fiche dit ce qu'il reste à faire**. La première est immuable,
la seconde s'actualise à chaque passe et disparaît quand elle est vide.

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/NNN-slug.md`,
par `Edit` ciblé :

- **Phase** : `analyze`
- **Résultat** : le **verdict en gras**, puis le décompte par sévérité.
  Exemple : `**PRÊT** — 0 Critical · 1 Major · 2 Minor`
  ou : `**CORRIGER D'ABORD** — 2 Critical (FR-003 non testable, R2 horizontal)`.

Ce que cette ligne est, et ce qu'elle n'est pas : c'est un **événement daté** — « le 28/07, la
gate a rendu PRÊT » reste vrai pour toujours. Ce n'est **pas** un état « la feature est
validée », qui cesserait d'être vrai à la première édition. Les lecteurs (`status-specs`,
`status`) ne la convertissent en état qu'après un contrôle de fraîcheur contre la date de
modification des trois documents. Tu n'écris rien d'autre, nulle part.

Une gate au rouge se consigne **aussi** : c'est la moitié de l'histoire qui a de la valeur.

## Skill active

- `feature-specs` — charge `references/analyze.md`, dont sa section `<gate>`.
- `chantier` — format de la fiche, nommage, `Portée`, cycle de vie. Tu n'as **pas** besoin de
  `references/manifeste.md` : le `## Contexte à charger` d'une fiche de gate se réduit aux deux ou
  trois documents du contrat, tous petits et tous `à lire`.
- `journal` — contrat de `docs/journal/*.md`.
- Subagents (recommandés, en parallèle, contexte frais) : `ears-verifier` — contrat (1-11) ·
  `slice-auditor` — découpage (12-14). Le contrôle **15** n'est délégué à aucun des deux.

## À la fin

Donne le **Verdict**, en passant le `NNN`.

**Si `PRÊT POUR IMPLÉMENTATION`** — « `specs/<cible>/` est un contrat validé : traçabilité
complète, critères testables, frontières tenues, et un découpage en N lots dont chacun sera
reviewable par un humain. »

- Feature non triviale (chemins d'erreur nombreux, enjeu produit) → **propose la passe de
  durcissement** : « Pour chercher les modes de défaillance que la conformité ne couvre pas,
  lance `/scd-sdd:premortem NNN` avant le passage de main — on y suppose que la feature a échoué,
  et on cherche ce que les documents ont laissé passer. »
- Sinon, la main passe au niveau implémentation : « `/clear`, puis `/scd-sdd:run NNN R1`. »
- Si d'autres features sont en vol, renvoie plutôt vers `/scd-sdd:status-specs`.

**Si `CORRIGER D'ABORD`** — renvoie vers la phase concernée pour les Critical (`specify NNN` /
`clarify NNN` / `plan NNN` / `tasks NNN` — **tous** les défauts de découpage relèvent de
`tasks NNN`), puis relance `/scd-sdd:analyze NNN`.

Rappelle que la liste est **dans la fiche de gate**, pas seulement à l'écran : « `/clear` puis
`/scd-sdd:tasks NNN` — la commande chargera la fiche, tu ne repars pas de zéro. »

**Si deux passes consécutives ne produisent ni correction constatée ni arbitrage neuf**, dis-le
franchement au lieu de proposer une troisième : le contrat ne converge pas, et le blocage est
ailleurs — périmètre trop large, `[NEEDS CLARIFICATION]` déguisé en critère, ou une feature qui
demandait deux features. Propose alors `/scd-sdd:status-specs` et une décision humaine, pas une
relance.
