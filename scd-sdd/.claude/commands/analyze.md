---
description: "Phase 5 des specs : gate de conformité du contrat (un contrôle bloquant, joué avant d'implémenter). Ne modifie aucun document du contrat. Atteste que spec/plan/tasks sont prêts pour l'implémentation ET que le découpage produira des unités reviewables par un humain. 16 contrôles, rapport à trois niveaux — Critical (bloque l'implémentation), Major (à corriger, ne bloque pas le démarrage), Minor (amélioration) —, verdict PRÊT uniquement si zéro Critical. Consigne son verdict au journal, et porte la liste des corrections dans un chantier de gate pour qu'elle survive au /clear — avec les Major arbitrés une fois pour toutes."
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
  - Bash(git diff *)
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
travail est portée par un **chantier de gate**, qu'un Major s'arbitre **une fois** — et, dès la
passe 2, **s'écarte de lui-même** s'il n'a pas été traité.

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
- **Tu déroules les contrôles déterministes intégralement, à chaque passe.** Tu ne sautes
  **jamais** un contrôle `D` parce que la fiche dit « arbitré » : tu détectes tout, tu ne changes
  que la présentation. C'est ce qui empêche la gate de devenir un tampon, et c'est gratuit. Les
  contrôles **de jugement** sont bornés par la **passe delta** — la règle est **restreinte, jamais
  retirée**, et la nature de chaque contrôle est portée par la grille, pas par toi.
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
  mesure une violation sur le code réel, pas une gate documentaire sur un plan. Et **sans table
  d'invariants dans `docs/technique.md`, le contrôle 15 ne se déclenche pas** — ce n'est pas un
  finding, c'est une moitié de phase du socle qui n'a pas été jouée.
- **Sans aucun `.feature`, le contrôle 16 ne se déclenche pas** — même règle : ce n'est pas un
  finding, c'est une non-applicabilité. Et quand il se déclenche, il ne porte **jamais** sur le
  vert : tu n'exécutes aucun test, tu juges la **dérivation** et la **forme**.
- **Verdict `PRÊT` uniquement si zéro Critical.** La **garde**, elle, lit `Critical + Major` : deux
  décomptes distincts, jamais confondus (`DECISIONS.md` §D39).
- **Les Minor se taisent dès la passe 2.** Rendus en entier à la passe 1 ; ensuite, une ligne — « N
  Minor, non détaillés ». Ils ne comptent dans aucun verdict et ne sont portés par aucune fiche.
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

3. **Lis** `specs/<cible>/spec.md`, `plan.md`, `tasks.md`, plus `docs/produit.md`,
   `docs/technique.md` — sa table d'**invariants** comprise, si elle en porte une — et
   `docs/adr/`.

3bis. **Récupère l'historique — la fiche, puis le journal.** Sans lui tu repartirais à froid, et
   surtout tu ne saurais ni à quelle passe tu es, ni si les précédentes ont fait baisser quoi que ce
   soit.

   **La fiche** :
   - `ls docs/chantiers/en-cours/*-gate-<cible>.md` → une fiche ouverte ? Lis-la : son
     `## À corriger` est la liste de la passe précédente, son `## Écarté` les arbitrages en
     vigueur, et sa ligne `HEAD <sha>` est l'**ancre** dont dépend la passe delta.
   - Aucune fiche ouverte → `ls docs/chantiers/archive/*-gate-<cible>.md` et prends la **plus
     récente** : tu en reprends le `## Écarté`, et lui seul. Un arbitrage est une décision, pas une
     note de passage.
   - Rien nulle part → première passe, tu pars de zéro. Ce n'est pas une anomalie.

   **Le journal** — `docs/journal/<cible>.md`, les lignes de phase `analyze`. Elles sont déjà
   versionnées, une par passe, avec leur décompte ; personne ne les lisait :
   - **le numéro de la passe courante** — compte les lignes **depuis la dernière ligne `PRÊT`**,
     exclue, et ajoute 1. C'est elle qui borne le cycle, pas le `Ouvert le` de la fiche : les lignes
     sont datées **au jour**, et un `PRÊT` du matin qui a archivé la fiche précédente porte la même
     date que la fiche ouverte l'après-midi. Aucune fiche ouverte → passe **1** ;
   - **la trajectoire des décomptes**, dans l'ordre, telle qu'elle s'affichera en tête de rapport :
     `3C·5M → 2C·4M → 2C·6M` — **les deux décomptes**, la garde lisant leur somme et le verdict les
     seuls Critical.

3ter. **Commite les corrections, puis prends l'ancre.** `git diff -- specs/<cible>/` : diff non vide
   → `git add specs/<cible>/` puis
   `git commit -m "docs(specs): corrections gate <cible> passe N"`, **annoncé en une ligne** en tête
   de rapport. Puis `git rev-parse HEAD`.

   C'est ce qui rend la passe delta applicable : **aucune** des quatre phases de correction ne porte
   `Bash(git …)`, donc personne ne pouvait remplir sa précondition et toute passe était intégrale
   (`DECISIONS.md` §D39). Tu commites **exactement** ce que l'humain vient d'écrire — les trois
   documents sortent toujours de cette commande **bit pour bit identiques**. Rien à commiter → tu ne
   commites pas, et tu ne l'annonces pas.

4. **Déroule les 16 contrôles** de `references/analyze.md` :

   | Groupe | Contrôles | Objet |
   |---|---|---|
   | Traçabilité | 1-3 | spec→produit, spec→tasks, tasks→spec |
   | Qualité des critères | 4-6 | EARS, verbe vérifiable, atomicité |
   | Frontières | 7-9 | technology-agnostic, scope EXCLU, ambiguïtés |
   | Cohérence | 10-11 | socle, contradictions internes |
   | Reviewability | 12-14 | verticalité, sujet unique, dimensionnement |
   | Architecture | 15 | invariants de `docs/technique.md` — **Major**, et sans objet si la table est absente ou vide |
   | Gherkin | 16 | `.feature` dérivé de son `SHALL` et bien formé — sans objet s'il n'y en a aucun |

   **Le contrôle 16 charge sa propre référence, et seulement s'il se déclenche** : `Glob` sur
   `specs/<cible>/acceptance/*.feature` ; au moins un → charge le bloc `<guidance>` de
   `references/gherkin.md` avant de juger. Aucun → dis-le en une ligne et passe.

   **Le régime de la passe décide de ce que tu déroules sur quoi** — la règle, le calcul et les
   **deux cas de mode dégradé** sont au § *La partition de la grille, et la passe delta* (`<gate>`
   de la référence), la **nature** de chaque contrôle dans la grille elle-même (`<checks>`). **Ne
   recopie ni l'un ni l'autre.** Tu n'as qu'à trancher la branche :

   - **Passe 1**, ou l'un des deux cas dégradés → passe **intégrale**, annoncée **avec son motif**
     en tête de rapport ;
   - **Passe 2 et au-delà**, ancre présente → passe **delta**, sur ce que rend
     `git diff <ancre> -- specs/<cible>/`. L'étape 3ter a déjà commité ce qui traînait : le cas
     « corrections non commitées » n'existe plus.

5. **Délègue un second regard en contexte frais** (outil `Task`, les deux **en parallèle** —
   leurs mandats sont disjoints) : **`ears-verifier`** pour les contrôles 1-11,
   **`slice-auditor`** pour 12-14. Recommandé si la feature est grosse, et **fortement** si
   c'est cette session qui a rédigé les documents : elle est alors mal placée pour les juger.

   **Les contrôles 15 et 16 restent au contexte principal** : les deux mandats délégués sont
   **bornés à 1-11 et 12-14** et ne bougent pas. C'est toi qui as lu `docs/technique.md` à l'étape 3,
   et c'est toi qui charges `references/gherkin.md` à l'étape 4 — aucun des deux agents ne reçoit
   les `.feature` dans son protocole d'entrée.

6. **Apparie avec la passe précédente**, si elle existe, selon le § *Appariement entre passes*
   (`<gate>` de la référence) : il donne la clé — triplet `[ID]` · fichier · nature —, ses
   **quatre** issues et ce qui compte, ou non, dans le décompte qui décide du verdict.

7. **Produis un seul rapport** classé **Critical / Major / Minor** selon le bloc `<report>` de
   la référence — fusionne les findings des subagents **sans les rejuger** —, puis applique la
   **monotonie du verdict** (`<report>`, § *Le verdict est monotone*).

   L'ordre du rapport n'est pas indifférent :

   1. la **trajectoire** des décomptes et le **régime** de la passe — delta, ou intégrale et
      pourquoi —, **avant tout finding** : c'est cela qui se décide ;
   2. le **commit de corrections** de l'étape 3ter, s'il a eu lieu ;
   3. **dès la passe 2**, si la **garde sur la divergence** (`Critical + Major`) s'est déclenchée,
      dis-le ici, et pas ailleurs ;
   4. les findings par sévérité, puis les blocs d'appariement ;
   5. la couverture chiffrée, le récapitulatif du découpage et le **Verdict**.

8. **Propose les arbitrages** (`AskUserQuestion`) — **charge le skill `exposition`**, **régime
   *gate*** : le décor de la gate se pose **une fois en tête** (ce qui a été examiné, contre quoi,
   ce que le verdict veut dire), et chaque finding ne porte ensuite que ce qui lui est propre, plus
   **ce qui se passe s'il n'est pas approuvé**. **Ne propose jamais d'arbitrer un Critical.**

   **Ce que tu soumets dépend de la passe** (`<gate>`, § *L'auto-écart des Major*) :

   - **Passe 1** — les Major **neufs**, un par un : demande lesquels sont assumés et **exige un
     motif** pour chacun. Un refus de trancher est une réponse valide, le Major reste dans la liste.
   - **Passe 2 et au-delà** — tu ne redemandes **que les Major neufs de cette passe**. Ceux qui
     restaient **non traités** depuis la précédente sont passés **seuls** en `## Écarté`, motif
     `non traité à la passe N` : tu les **nommes une fois** au rapport, tu ne les soumets plus, et tu
     dis qu'ils restent dans la fiche et **se rouvrent** sur demande. Cesser de demander n'est pas
     cacher.

9. **Écris le chantier de gate**, selon `<gate>` de la référence :
   - **`CORRIGER D'ABORD`** → ouvre `docs/chantiers/en-cours/AAAA-MM-JJ-gate-<cible>.md` (ou
     actualise celui qui existe) : les Critical, les Major non arbitrés, les arbitrages dans
     `## Écarté`. Les Minor non arbitrés restent en conversation.
   - **`PRÊT`** → une fiche ouverte existe ? Ajoute `## Issue` (ce qui a été corrigé, en combien de
     passes) et `git mv` vers `archive/`. Aucune fiche → n'en crée pas : il n'y a pas de travail à
     porter.

   Une fiche actualisée voit son `Actualisé le` **et son ancre `HEAD` rafraîchis** — `git rev-parse
   HEAD` —, et une fiche ouverte porte la même ancre dès sa création. Sans ce rafraîchissement, la
   passe 3 calculerait son delta contre l'ancre de la passe 1 : les corrections déjà jugées
   repasseraient dans le champ, et le delta ne bornerait plus rien.

   Puis `git add` **scopé à la fiche** et `git commit -m "chore(chantier): gate <cible>"` — sans
   quoi l'arbre reste sale et `/scd-sdd:run` tombera en `blocked-dirty-tree`.

10. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Aucune modification de `spec.md`, `plan.md`, `tasks.md`, ni du socle.
- **Tu ne juges pas le socle.** Tu le lis comme référentiel — un `FR` de spec doit tracer vers
  `docs/produit.md` —, mais la conformité de `docs/produit.md`, `technique.md`, `docs/adr/`,
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
- Tu ne sautes **aucun contrôle déterministe**, même sur un finding déjà arbitré. Et tu ne
  **restreins** les contrôles de jugement que sous le régime delta, jamais parce que le document te
  paraît connu.
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

- `feature-specs` — charge `references/analyze.md`, dont sa section `<gate>` : le contrat de la
  fiche, l'appariement et ses **quatre** issues, la **partition** de la grille et la **passe
  delta** (l'ancre, le commit préalable, les deux cas dégradés), la garde sur la **divergence** (`Critical + Major`) et le
  **budget de deux passes**. La **nature** `D`/`J` de chaque contrôle vit dans `<checks>`, et la
  **monotonie** du verdict dans `<report>`. Plus, **sous condition et seul bloc `<guidance>`**,
  `references/gherkin.md` : uniquement si la feature porte au moins un `acceptance/*.feature`
  (contrôle 16).
- `chantier` — anatomie, nommage, `Portée`, cycle de vie. Tu **écris** une fiche, donc tu charges
  `references/fiche.md`, blocs **`<interdits>`**, **`<template>`** et **`<frontiere>`** — pas
  `<pourquoi>`, qui explique le dispositif à qui l'ouvre. Tu n'as **pas** besoin de
  `references/manifeste.md` : le `## Contexte à charger` d'une fiche de gate se réduit aux deux ou
  trois documents du contrat, tous petits et tous `à lire`.
- `exposition` — **deux régimes, deux moments** : **régime *gate*** à l'étape 8, toujours ; **régime
  *options*** au `## À la fin`, **conditionnel** — seulement si le budget de passes est atteint avec
  une fiche de gate encore ouverte. Aucune `references/`.
- `journal` — contrat de `docs/journal/*.md`.
- Subagents (recommandés, en parallèle, contexte frais) : `ears-verifier` — contrat (1-11) ·
  `slice-auditor` — découpage (12-14). Les contrôles **15** et **16** ne sont délégués à aucun des
  deux.

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

⚠️ **Si l'humain a refusé d'arbitrer des Major à l'étape 8, ils restent — dis-le dans la même phrase
que le verdict** : **nomme-les**, dis qu'ils **ne bloquent pas le démarrage** — le verdict ne compte
que les Critical — et dis **où** ils sont : dans la fiche de gate qui vient d'être archivée s'il y en
avait une, sinon dans ce seul rapport, qui ne survivra pas au `/clear`.

**Si `CORRIGER D'ABORD`** — renvoie vers la phase concernée pour les Critical (`specify NNN` /
`clarify NNN` / `plan NNN` / `tasks NNN` — **tous** les défauts de découpage relèvent de
`tasks NNN`).

Rappelle que la liste est **dans la fiche de gate**, pas seulement à l'écran : « `/clear` puis
`/scd-sdd:tasks NNN` — la commande chargera la fiche, tu ne repars pas de zéro. » Ce qui vient
**après** la correction dépend du budget de passes, ci-dessous.

**Puis le budget de passes décide de ce que tu proposes** — § *La garde sur la divergence, et le
budget de passes* (`<gate>` de la référence), qui porte la condition et les issues. **Deux branches,
une seule s'applique.**

**Sous le budget** (passe 1) — « Puis relancer `/scd-sdd:analyze NNN` : l'appariement fera le
reste, et la passe suivante ne re-jugera que ce qui a bougé. »

**Au budget** — **2ᵉ passe, et fiche de gate encore ouverte** : à la place de la relance, charge le
skill `exposition`, **régime *options***, et **pose l'arbitrage** par `AskUserQuestion` — c'est un
choix entre issues concurrentes, pas un tri. Les **trois issues** sont au
§ *La garde sur la divergence, et le budget de passes* (`<gate>`) ; ce que la commande ajoute, c'est
de les **ancrer dans cette feature-ci** :

- pour *le blocage est en amont* — **nomme** ce qui manque au socle et la commande qui le traiterait
  (`/scd-sdd:audit <document>`, `/scd-sdd:adr`) ; la fiche reste ouverte et porte le signalement ;
- pour *la phase a été jouée trop tôt* — **nomme** la reprise de fond qu'elle appelle
  (`/scd-sdd:specify NNN`, ou une scission dont la seconde moitié devient une feature à part par
  `/scd-sdd:kickoff-feature`). Renvoie vers `/scd-sdd:status-specs` si plusieurs sont en vol ;
- pour *une passe de plus* — présente-la comme la réponse **valide** qu'elle est.
