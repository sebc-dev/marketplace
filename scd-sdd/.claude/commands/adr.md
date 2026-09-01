---
description: "Fige une décision structurante en ADR — Architecture Decision Record : un fichier court et IMMUABLE une fois accepté, qui porte le pourquoi qu'on relira dans six mois. Écrit docs/adr/NNNN-titre.md au format Nygard (contexte · décision · conséquences · alternatives écartées). Trois sources de candidats : la conversation en cours, les brouillons de docs/adr/_candidates/ laissés par /scd-sdd:init, /scd-sdd:vision, /scd-sdd:spec, /scd-sdd:tickets ou /scd-sdd:migrate — dont c'est la seule voie de promotion —, et les préoccupations de domaine encore ouvertes de docs/vision.md (ARCH-/SEC-/UX-) si le fichier existe. Rejouable à tout moment du projet."
argument-hint: "[la décision à figer — optionnel, sinon relève les candidats]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - AskUserQuestion
  - Bash(date -I)
---

## Contexte

Tu figes des **décisions structurantes** — celles dont quelqu'un se demanderait, dans six mois,
pourquoi c'est comme ça. Une décision, un fichier, jamais réécrit.

Ce n'est pas une phase et ça ne se joue pas une fois : les ADR sont le seul artefact du socle qui
croît avec le projet. Une décision peut surgir n'importe quand — pendant `/scd-sdd:init`, en
écrivant une spec, en découpant des tickets, ou dans une conversation ordinaire.

**L'immutabilité est mécanique, pas une consigne.** Un hook du plugin bloque la réécriture d'un ADR
qui existe déjà ; seule la création passe. Tu ne pourras donc pas corriger un ADR mal écrit — d'où
la relecture avant écriture, à l'étape 5.

Ratio : 50% humain / 50% AI (l'humain détient la décision et ses motifs ; tu instruis et tu
rédiges).

## Règles absolues

- **Un ADR = une décision.** Deux décisions dans un fichier ne se superseden­t pas séparément, et
  l'une des deux mourra en emportant l'autre.
- **Aucune conséquence négative = ADR suspect.** Un choix qui n'a que des avantages n'a pas été
  instruit. Si tu n'en trouves pas, c'est la question à poser, pas une section à sauter.
- **Aucune alternative inventée.** Une alternative écartée est une option réellement considérée,
  avec le motif réel du rejet. « Solution B : écartée car moins adaptée » n'apprend rien à
  personne.
- **Tu n'écris jamais par-dessus un ADR existant.** S'il est faux, tu en écris un **nouveau** qui le
  remplace, et tu **signales** que l'ancien doit passer à « Remplacé par ADR-XXXX » — geste que tu
  ne peux pas faire, et qui revient à l'humain.
- **La numérotation ne se renumérote jamais.** `NNNN` sur quatre chiffres, le plus petit libre.
- **Tu ne supprimes aucun brouillon.** Tu n'en as pas l'outil, et un brouillon promu qui reste se
  représentera en candidat : signale-le pour que l'humain le retire.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — ADR,
  supersede, invariant, trace observable… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain emploie
  le terme lui-même**.
- **Un ID se cite avec son intitulé** à sa première mention — « ADR-0003 (import de `db/` interdit
  hors de `server/`) », jamais « ADR-0003 » nu. La règle vaut pour **tout** identifiant que tu
  emploies, y compris ceux que le projet ou la session viennent de créer.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Processus

1. **Charge la référence `adr.md`** (voir `## Skill active`). Communique en français.

2. **Relève les candidats, des trois sources.** L'argument s'il y en a un, ou la décision qui vient
   d'être prise dans la conversation ; `docs/adr/_candidates/*.md` ; et, **si `docs/vision.md`
   existe**, ses **préoccupations de domaine encore ouvertes** (`ARCH-*`/`SEC-*`/`UX-*` qu'aucun ADR
   ne cite déjà). Si les trois sont vides, dis-le et arrête-toi : il n'y a rien à figer, et fabriquer
   un ADR pour justifier la commande est le défaut à éviter.

3. **Trie.** Pour chaque candidat, une question : *est-ce structurant ?* Ce qui ne l'est pas se
   dit et ne s'écrit pas — un utilitaire, une convention évidente, un choix réversible en une heure.
   Rends ce tri à l'humain avant d'écrire, pas après.

4. **Instruis chaque décision retenue.** Trois choses te manquent presque toujours, et aucune ne se
   devine : **pourquoi maintenant** (ce qui la rendait nécessaire), **ce qu'elle coûte**, et **ce
   qui a été réellement envisagé d'autre**. Demande-les. Une seule question à la fois si l'humain
   hésite.

5. **Relis avant d'écrire.** Restitue chaque ADR en trois lignes — décision, coût principal,
   alternative écartée — et attends l'accord. C'est la **seule** relecture possible : après
   l'écriture, le hook interdit la correction.

6. **Écris**, un fichier par décision, `docs/adr/NNNN-titre-en-kebab.md`, sur le `<template>`.
   `date -I` pour la date. Renseigne la section **`Vérifiable ?`** : la décision laisse-t-elle une
   **trace observable dans l'arborescence ou dans les imports** ? C'est le critère qui décide si
   `/scd-sdd:guards` pourra en dériver un contrôle — et « non, décision de principe » est la réponse
   la plus fréquente, pas un échec.
   Si l'ADR tranche une préoccupation de `docs/vision.md`, **cite-la** dans le Contexte
   (« Tranche `SEC-2` (chiffrement au repos) ») — lien descendant, best-effort, sauté sans bruit si
   le fichier est absent.

7. **Signale les gestes que tu ne peux pas faire** : les brouillons promus à supprimer, un ADR
   ancien à passer en « Remplacé par », et — si un ADR neuf est vérifiable — le renvoi vers
   `/scd-sdd:guards`.

## Ce que tu NE fais PAS

- Tu **ne réécris jamais** un ADR accepté, même pour corriger une faute. Le hook te bloquerait ; la
  règle existe avant lui.
- Tu **n'écris aucun contrôle de CI** et ne touches pas à `docs/ci.md` ni à `.claude/guards.json`.
  Un ADR vérifiable **se signale** ; c'est `/scd-sdd:guards` qui dérive le contrôle.
- Tu **ne supprimes aucun brouillon** de `_candidates/`.
- Tu **ne produis aucun autre document du socle**.

<report>

```
## ADR — [N] écrits

| Fichier | Décision | Coût principal | Vérifiable ? |
|---|---|---|---|
| ADR-00NN | … | … | oui : [la trace] / non |

### Candidats écartés
[une ligne par candidat non retenu, avec son motif — ou « aucun »]

### À faire à la main
[brouillons promus à supprimer · ADR à passer en « Remplacé par » · renvoi vers guards
 — ou « rien »]
```

</report>

## Skill active

Skill `socle` — référence `references/adr.md`, chargée **intégralement**.

## À la fin

- Un ADR vérifiable a été écrit → *« ADR-00NN laisse une trace observable :
  `/scd-sdd:guards` peut en dériver un contrôle. »*
- Des brouillons ont été promus → *« [N] brouillons de `docs/adr/_candidates/` sont promus et
  doivent être supprimés à la main — je n'ai pas l'outil pour le faire. »*
- Sinon → *« Rien d'autre à figer. Reprends où tu en étais. »*
