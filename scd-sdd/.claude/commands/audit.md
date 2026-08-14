---
description: "Audit d'un document du socle déjà produit — on le confronte à une grille de conformité (complétude, traçabilité vers l'amont, cohérence, forme) et ce qui manque devient une liste de travail, jamais une réécriture. Le document jugé sort bit pour bit identique : la commande écrit deux choses, une ligne de journal et une fiche de chantier (le pense-bête daté qui survit au /clear). Un explorateur collecte les preuves sans juger, la session juge, l'humain arbitre les Major. Verdict CONFORME uniquement si zéro Critical. Capacité transverse à dimensions, pas une phase : optionnelle, jamais réclamée par status."
argument-hint: "[dimension] brief | prd | stack | archi | adr | ci | claude-md — jamais deviné"
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

Le socle s'écrit par interview, puis se consomme tel quel. **Rien ne le relit.** Les trois `status`
ne testent que l'**existence** des documents, et la chaîne `Brief → PRD → Stack → Archi → ADR → CI
→ CLAUDE.md` propage un défaut d'amont sans que rien ne le voie : un `FR` qui ne trace vers rien, un
candidat ADR listé dans la Stack que la phase `adr` n'a jamais instruit, un invariant sans trace
observable, un pointeur mort dans `CLAUDE.md`.

Le niveau specs a `analyze` pour ça. Le socle n'a rien — et `/scd-sdd:premortem socle` ne comble pas
le trou : il juge l'**ensemble** sous l'angle de la **projection d'échec**, quand la question posée
ici est celle de la **conformité d'UN document frais**.

Tu combles ce trou, **un document à la fois**, quand on te le demande. Ce n'est **pas une phase** :
rien ne la réclame, `status` ne la signale jamais comme manquante, un socle non audité n'est pas un
socle incomplet. Et contrairement aux gates que tu croises, tu **n'écris rien dans ce que tu
juges** : ta sortie est une liste de travail, pas une correction.

Ratio : 20% humain / 80% AI (exploration et jugement mécaniques ; l'humain arbitre les Major et
décide de corriger).

## Règles absolues

- **Le document jugé sort bit pour bit identique.** Tu écris exactement deux choses, ailleurs : la
  **ligne de journal** et la **fiche de chantier**. C'est ce qui te rend rejouable sans risque.
- **Tu n'écris jamais le verdict dans la fiche.** Il vit au journal, daté. Un `CONFORME` écrit sur
  disque deviendrait faux à la première édition du document ; une **liste de travail**, elle, ne
  devient pas fausse — elle devient *faite*, et c'est vérifiable.
- **L'explorateur collecte, tu juges.** Tu n'acceptes de lui aucune sévérité ni aucun verdict : tu
  appliques la grille **toi-même**, au dossier de preuves.
- **Un défaut de l'amont n'est pas un finding du document jugé.** C'est un **signalement**, nommé,
  avec la commande qui le traiterait. Rien ne s'abandonne en silence.
- **Tu ne corriges pas toi-même** : tu nommes le fichier, l'ID et l'action.
- **Verdict `CONFORME` uniquement si zéro Critical.**
- **Le problème avant les options.** Au gate d'arbitrage, chaque finding s'ouvre sur **ce que le
  défaut coûterait en aval**, en langage courant — c'est ce qui se décide ; le fichier, l'ID et la
  correction ne sont que l'endroit où l'écrire. Arbitrer sans avoir compris le coût n'est pas
  arbitrer.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — dimension,
  dossier de preuves, finding, fiche, appariement, arbitrage, EARS, invariant… — reçoit une glose
  d'**une ligne**, entre parenthèses ou entre tirets. Jamais un paragraphe, jamais deux fois, et
  **plus du tout dès que l'humain emploie le terme lui-même** : c'est ce signal-là qui règle le
  niveau, pas une question.
- **Un ID se cite avec son intitulé** à sa première mention — « FR-003 (export CSV) », jamais
  « FR-003 » nu. La règle vaut pour **tout** identifiant que tu emploies, y compris ceux que le
  projet ou la session viennent de créer et que le plugin ne connaît pas. Un identifiant seul
  n'explique rien à qui ne l'a pas sous les yeux.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Définitions

**Dimension** — l'angle de l'audit, et lui seul : il décide **quels documents** sont auditables,
**quelle grille** s'applique et **par quelle voie** une correction est légale. La méthode, elle, ne
change pas. Une seule existe : `validation-socle`.

**Dossier de preuves** — ce que l'explorateur rend : des **faits cités verbatim avec leur numéro de
ligne**, jamais une opinion. Il existe pour que tu juges sans rouvrir le document en entier.

**Lot de correction** — le regroupement du `## À corriger` de la fiche **par voie de correction**,
pas par sévérité : `A` éditions dans le document · `B` candidats ou supersede ADR · `C` renvois et
signalements. Un lot vide ne s'écrit pas.

## Processus

1. **Résous la dimension, puis la cible** — bloc `<resolution>` de `references/dimensions.md`, qui
   porte l'algorithme du premier token, la table des tokens de la dimension, la règle de
   non-inférence et l'annonce à faire avant de déléguer quoi que ce soit. Applique-le tel quel ;
   l'outil de la question, quand il en faut une, est `AskUserQuestion`.

2. **Charge le seul bloc de la dimension résolue** dans `references/dimensions.md`. Pas les autres :
   ils ne s'appliquent pas, et les lire n'apporterait que du bruit.

3. **Vérifie la précondition, puis la position de la session.**
   - Le document cible **manque** → **arrêt dur** : renvoie vers la phase qui le produit, et
     n'écris **rien** — ni fiche, ni ligne de journal. Un document absent n'est pas un finding,
     c'est une phase non jouée.
   - **La session courante a-t-elle rédigé ce document ?** Si oui, **dis-le** et recommande
     `/clear` puis relance de la commande. Tu ne bloques pas — mais juger ce qu'on vient d'écrire,
     c'est relire ses propres intentions au lieu du texte, et c'est la moitié de
     `producteur ≠ vérificateur` qui repose sur toi (l'autre moitié est le `/clear` de l'accroche).

4. **Récupère l'historique — la fiche, puis le journal.** Sans lui tu repartirais à froid, et
   surtout tu ne saurais ni à quelle passe tu es, ni si les précédentes ont fait baisser quoi que ce
   soit.

   **La fiche** :
   - `ls docs/chantiers/en-cours/*-audit-<document>.md` → une fiche ouverte ? Lis-la : son
     `## À corriger` est la liste de la passe précédente, son `## Écarté` les arbitrages en vigueur,
     et sa ligne `HEAD <sha>` est l'**ancre** dont dépend la passe delta.
   - Aucune fiche ouverte → `ls docs/chantiers/archive/*-audit-<document>.md` et prends la **plus
     récente** : tu en reprends le `## Écarté`, et lui seul, selon la règle de ré-import et
     d'élagage du § *L'appariement entre passes* du skill. Ce que tu n'as pas repris, dis-le.
   - Rien nulle part → première passe, tu pars de zéro. Ce n'est pas une anomalie.

   **Le journal** — `docs/journal/socle.md`, les lignes de phase `audit` qui visent **cette
   cible**. Elles sont déjà versionnées, une par passe, avec leur décompte ; personne ne les lisait :
   - **le numéro de la passe courante** — compte les lignes **depuis la dernière ligne `CONFORME`**,
     exclue, et ajoute 1. C'est elle qui borne le cycle, pas le `Ouvert le` de la fiche : les lignes
     sont datées **au jour**, et un `CONFORME` du matin qui a archivé la fiche précédente porte la
     même date que la fiche ouverte l'après-midi. Aucune fiche ouverte → passe **1** ;
   - **la trajectoire des décomptes**, dans l'ordre, telle qu'elle s'affichera en tête de rapport :
     `3 Critical → 2 → 2 → 4`.

5. **Délègue l'exploration** à `audit-explorer` (outil `Task`), en lui passant : la dimension, le
   **chemin du document jugé**, la **liste de ses amonts** avec leurs chemins, la **grille du bloc**
   que tu viens de charger, et la **référence `project-docs` dont il charge le `<template>`**. Tu
   lui **imposes son modèle à l'appel** — `{agentType: 'scd-sdd:audit-explorer', model: 'haiku'}`,
   et `'sonnet'` si le document est volumineux (au-delà de ~300 lignes) ou si la cible est un
   **répertoire** (`adr`).

   Il rend un dossier de preuves **sans aucune sévérité**. S'il en émet une, ignore-la : elle n'a
   pas été portée par la grille.

6. **Juge, ici, au contexte principal.** Le **régime de la passe** décide de ce que tu déroules sur
   le dossier de preuves — la règle est au § *La partition de la grille, et la passe delta* du
   skill, le calcul et les **trois cas de mode dégradé** au § *La passe delta* du bloc de dimension,
   et la **nature** de chaque contrôle dans la grille elle-même. **Ne recopie aucun des trois.** Tu
   n'as qu'à trancher la branche :

   - **Passe 1**, ou l'un des trois cas dégradés → passe **intégrale**, annoncée **avec son motif**
     en tête de rapport ;
   - **Passe 2 et au-delà**, ancre présente et rien de non commité sur la cible → passe **delta**,
     sur ce que rend `git diff <ancre> -- <chemin de la cible>`.

   Classe chaque finding en **Critical / Major / Minor** selon l'échelle du skill, applique la
   **monotonie du verdict** (§ 4), puis **apparie** avec la passe précédente selon le
   § *L'appariement entre passes* — il donne la clé, ses **quatre** issues et ce qui compte, ou non,
   dans le décompte qui décide du verdict.

   Rends **un seul rapport** en conversation, dans cet ordre :

   1. la **trajectoire** des décomptes et le **régime** de la passe — delta, ou intégrale et
      pourquoi —, **avant tout finding** : c'est elle qui se décide ;
   2. **dès la passe 2**, si la **garde sur la divergence** s'est déclenchée, dis-le ici, et pas
      ailleurs ;
   3. les findings par sévérité, chacun avec sa **voie de correction** (lot A, B ou C) ;
   4. les blocs d'appariement, puis le **Verdict**.

7. **Gate d'arbitrage humain** (`AskUserQuestion`) — **charge le skill `exposition`**, **régime
   *gate*** : le décor de l'audit se pose **une fois en tête**, et chaque finding ne porte ensuite
   que ce qui lui est propre. S'il reste des Major non arbitrés, demande lesquels sont assumés et
   **exige un motif** pour chacun. Chaque finding s'ouvre sur **ce que le défaut coûterait en
   aval**, en langage courant, avant le triplet fichier / ID / correction proposée. Un refus de
   trancher est une réponse valide : le Major reste dans la liste. Rien n'est écrit avant cette
   étape.

8. **Écris les deux artefacts, et rien d'autre.** Le § *La fiche et ses lots* du bloc de dimension
   dit tout : où va la fiche, ce qu'elle porte, comment son `## À corriger` s'organise en lots, et —
   à son alinéa *Cycle de vie* — ce que chaque verdict lui fait, l'ouvrir, l'actualiser ou
   l'archiver avec son `## Issue`. Applique-le tel quel.

   Une fiche actualisée voit son `Actualisé le` **et son ancre `HEAD` rafraîchis** — `git rev-parse
   HEAD` —, et une fiche ouverte porte la même ancre dès sa création. Sans ce rafraîchissement, la
   passe 3 calculerait son delta contre l'ancre de la passe 1 : les corrections déjà jugées
   repasseraient dans le champ, et le delta ne bornerait plus rien.

   Puis `git add` **scopé à la fiche** et `git commit -m "chore(chantier): audit <document>"` —
   sans quoi l'arbre reste sale et `/scd-sdd:run` tomberait en `blocked-dirty-tree`. Enfin,
   consigne au journal (voir ci-dessous).

## Ce que tu NE fais PAS

- **Tu n'édites jamais le document jugé.** Ni pour corriger un marqueur oublié, ni pour « juste »
  refermer un renvoi mort. Le socle sort de cette commande **bit pour bit identique** — et tu ne
  deviens pas un quatrième écrivain de `CLAUDE.md`, que `DECISIONS.md` §D29 limite à trois.
- **Tu n'écris pas le verdict dans la fiche.** Elle porte la liste de travail et les arbitrages,
  jamais le verdict, jamais la couverture chiffrée, jamais les Minor.
- **Tu n'arbitres rien à la place de l'humain** : un arbitrage sans motif explicite n'est pas un
  arbitrage. Ce qui peut s'écarter et ce qui ne s'écarte jamais est fixé par le skill, et tu ne
  l'élargis pas.
- **Tu ne juges jamais `specs/`.** La dimension `validation-socle` ne touche que le socle ;
  `/scd-sdd:analyze` couvre les specs avec ses 16 contrôles, et doubler la gate n'apporterait qu'un
  second avis sur le même texte.
- Tu ne rejoues **jamais** la phase qui a produit le document : ré-assembler est une voie de
  destruction qui a l'air d'une voie de mise à jour. La voie normale est l'édition chirurgicale,
  portée par les lots de la fiche.
- Tu ne juges pas l'amont comme s'il était la cible, tu n'exécutes aucun test, tu ne lis aucun code.

## Consigne au journal

Le **verdict** n'existe **nulle part ailleurs** — surtout pas dans la fiche, qui porte la liste de
travail. Sans cette ligne, savoir si un document a été jugé, quand, et avec quelle issue, meurt à la
fin de la session. C'est pourquoi l'audit journalise **sans être une phase** : la règle n'est pas
« une phase journalise », c'est **« ce qui n'est dérivable de nulle part se consigne »**.

Les deux écritures sont donc disjointes et le restent : **le journal dit ce qui est arrivé**, **la
fiche ce qu'il reste à faire**.

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`, par `Edit` ciblé —
le fichier ne varie **pas** avec la cible, la dimension étant celle du socle :

- **Phase** : `audit`
- **Résultat** : le **verdict en gras**, la cible, puis le décompte par sévérité.
  Exemple : `**CONFORME** — prd · 0 Critical · 1 Major arbitré`
  ou : `**À CORRIGER** — prd · 2 Critical (FR-012 sans amont · NON inclus vide) · 3 Major`.

Une passe `CONFORME` **sans fiche se consigne aussi** : l'absence de ligne se lirait comme un audit
jamais joué. Un arrêt dur pour document absent, lui, ne se consigne **pas** — il n'y a pas eu
d'audit.

## Skill active

- `audit` — la méthode : les quatre temps, l'échelle, le verdict binaire **et monotone**,
  l'appariement et ses quatre issues, la partition de la grille et la passe delta, la garde sur la
  **divergence** et le **budget de passes**. Charge `references/dimensions.md`, bloc `<resolution>`
  à l'étape 1, puis **le seul bloc de la dimension résolue** — dont le § *La passe delta* porte
  l'ancre, le calcul et les trois cas dégradés.
- `chantier` — anatomie, nommage, `Portée`, cycle de vie. Tu **écris** une fiche, donc tu charges
  `references/fiche.md`, blocs **`<interdits>`**, **`<template>`** et **`<frontiere>`**. Tu n'as
  **pas** besoin de `references/manifeste.md` : le `## Contexte à charger` d'une fiche d'audit se
  réduit au document jugé et à son amont, tous `à lire`.
- `exposition` — **deux régimes, deux moments** : **régime *gate*** à l'étape 7, toujours ; **régime
  *options*** au `## À la fin`, **conditionnel** — seulement si le budget de passes est atteint avec
  une fiche encore ouverte. Aucune `references/`.
- `journal` — contrat de `docs/journal/socle.md`.
- Subagent : `audit-explorer`, **modèle imposé à l'appel**. Il ne charge pas `dimensions.md` — c'est
  toi qui lui **passes** la grille.

## À la fin

Donne le **Verdict**, en nommant la cible.

**Si `CONFORME`** — « `<document>` est conforme : complet, tracé vers son amont, cohérent avec lui. »
Puis la suite normale du socle, s'il en reste une (`/scd-sdd:<phase suivante>`) — l'audit ne bloque
aucune phase et n'en réclame aucune.

⚠️ **Si l'humain a refusé d'arbitrer des Major à l'étape 7, ils restent — dis-le dans la même
phrase que le verdict** : **nomme-les**, dis qu'ils **ne bloquent rien** — le verdict ne compte que
les Critical — et dis **où** ils sont : dans la fiche qui vient d'être archivée s'il y en avait une,
sinon dans ce seul rapport, qui ne survivra pas au `/clear`.

**Si `À CORRIGER`** — rappelle que la liste est **dans la fiche**, pas seulement à l'écran, et
renvoie lot par lot (n'annonce que les lots réellement écrits) :

- **Lot A** — « `/clear`, puis `/scd-sdd:resume audit-<document>` : la commande chargera la fiche,
  tu ne repars pas de zéro. » Ce qui vient **après** dépend du budget de passes, ci-dessous.
- **Lot B** — les candidats sont à écrire dans `docs/adr/_candidates/` ; c'est `/scd-sdd:adr` qui
  les instruit. Le candidat n'est pas un renvoi dans le vide : la phase `adr` le promeut.
- **Lot C** — `/scd-sdd:revise-contract` pour les findings de `claude-md` ; pour un signalement
  amont, la commande nommée dans la ligne. **Ne les traite pas toi-même.**

**Puis le budget de passes décide de ce que tu proposes** — § *La garde anti-boucle* du skill, qui
porte la condition et les issues. **Deux branches, une seule s'applique.**

**Sous le budget** (passe 1 ou 2) — « Puis relancer `/scd-sdd:audit <document>` : l'appariement fera
le reste. »

**Au budget** — **3ᵉ passe, et fiche encore ouverte** : à la place de la relance, charge le skill
`exposition`, **régime *options***, et **pose l'arbitrage** par `AskUserQuestion` — c'est un choix
entre issues concurrentes, pas un tri. Les **trois issues sont au § *La garde anti-boucle*** du
skill ; ce que la commande ajoute, c'est de les **ancrer dans ce projet-ci** :

- pour *le blocage est en amont* — **nomme** l'amont manquant et la commande qui le traiterait ; la
  fiche reste ouverte et son **Lot C** porte le signalement ;
- pour *la phase a été jouée trop tôt* — **nomme** la phase, et laisse-la à l'humain : ré-assembler
  est une voie de destruction qui a l'air d'une voie de mise à jour ;
- pour *une passe de plus* — présente-la comme la réponse **valide** qu'elle est.
