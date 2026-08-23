---
description: "Cadre une feature en UNE spec courte : écrit specs/NNN-slug/SPEC.md (~40 lignes) — le problème, la solution, les comportements observables, les décisions d'implémentation et de test, le hors-périmètre. Elle SYNTHÉTISE la conversation en cours et n'interviewe pas : ce qui a été dit s'écrit, seul ce qui manque vraiment se demande. Relue par l'humain, et c'est sa seule validation — aucune gate, aucun verdict, aucun critère normé. Attribue le NNN et scaffolde le répertoire de la feature."
argument-hint: "[l'idée de la feature — optionnel si la conversation la porte déjà]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - AskUserQuestion
  - Bash(git log *)
---

## Contexte

Tu cadres une feature en **un** document court, relu une fois. C'est le premier des deux artefacts
du niveau feature ; le second, ce sont les tickets.

**Tu synthétises, tu n'interviewes pas.** Le contenu est déjà là : l'humain a expliqué ce qu'il
veut, tu as exploré le dépôt, vous avez peut-être discuté des options. Écris ce qui a été dit. Le
cycle `1.x` extrayait ça par interview « une question à la fois » sur dix tours, puis le passait par
une gate de clarification — c'est exactement le coût que la refonte supprime (`DECISIONS.md` §D41).

Ce qui reste à demander est ce qui **manque réellement** : une décision qui n'a pas été prise, un
hors-périmètre qu'on n'a pas nommé. Trois questions, pas trente.

Ratio : 30% humain / 70% AI (tu compiles et tu proposes ; l'humain relit et corrige).

## Règles absolues

- **Tu n'interviewes pas.** Une question dont la réponse est dans la conversation ou sur le disque
  est une question de trop.
- **Le document tient en ~40 lignes**, plafond 80. Il sera relu ; un document de 200 lignes ne l'est
  pas, et une spec non relue n'a aucune validation.
- **Aucun critère normé.** Pas d'EARS, pas de `SHALL`, pas de `FR-xxx`. La notation existait pour un
  agent vérificateur qui n'existe plus : sans lecteur, elle est une contrainte de rédaction que rien
  ne récompense. Les critères **observables** vivent dans les tickets, en français.
- **Aucun marqueur d'ambiguïté.** Pas de `[NEEDS CLARIFICATION]` : il n'y a plus de gate pour les
  résoudre. Un flou se tranche **maintenant**, en conversation, ou s'écrit **au hors-périmètre**
  comme délibérément non tranché.
- **Le hors-périmètre n'est jamais vide.** Une feature sans rien d'écarté n'a pas été cadrée.
- **Tu ne contredis aucun ADR accepté.** Si la décision doit changer, c'est un **nouvel** ADR, et tu
  le signales — jamais une spec qui passe outre en silence.
- **Une décision structurante ne se tranche pas ici.** Brouillon dans `docs/adr/_candidates/`, renvoi
  vers `/scd-sdd:adr`.
- **Aucun chemin de fichier, aucun extrait de code**, sauf l'exception du `<template>` : un extrait
  qui encode une décision plus précisément que la prose (machine à états, schéma, forme d'un type).
  Le reste périme en un jour.
- **Tu emploies le vocabulaire du glossaire de `CLAUDE.md`.** S'il en manque un terme, dis-le : c'est
  à l'humain de décider s'il l'y ajoute.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — couture,
  hors-périmètre, ADR, tranche verticale… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain emploie
  le terme lui-même**.
- **Un ID se cite avec son intitulé** à sa première mention — « ADR-0003 (import de `db/` interdit
  hors de `server/`) », jamais « ADR-0003 » nu. La règle vaut pour **tout** identifiant que tu
  emploies, y compris ceux que le projet ou la session viennent de créer.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Processus

1. **Charge la référence `spec.md`** (voir `## Skill active`). Communique en français.

2. **Vérifie le socle — mais ne bloque pas dessus.** `CLAUDE.md` et `docs/adr/` absents → signale-le
   et renvoie vers `/scd-sdd:init`, puis **demande si on continue quand même**. Une spec écrite sans
   glossaire ni ADR est possible ; elle est juste moins bonne, et l'humain doit le savoir.

3. **Explore le dépôt** si tu ne l'as pas déjà fait dans cette conversation : ce qui existe déjà et
   que la feature touche, les modules concernés, les tests comparables. C'est ce qui remplace
   l'interview.

4. **Esquisse les coutures de test, et fais-les valider.** Une **couture** — l'endroit où l'on peut
   substituer un comportement pour l'observer — se choisit avant d'écrire, parce qu'elle contraint
   le découpage. Préfère une couture **existante** à une neuve ; place-la **aussi haut que
   possible** ; **moins il y en a, mieux c'est** — l'idéal est une seule. Vérifie avec l'humain
   qu'elles correspondent à ce qu'il attend.

5. **Attribue le `NNN`** (`max(NNN) + 1` sur `specs/`, jamais réattribué) et le slug. Scaffolde
   `specs/NNN-slug/`.

6. **Écris `SPEC.md`** sur le `<template>`. Ce qui a été décidé en conversation va aux **décisions
   d'implémentation**, avec son *pourquoi*. Ce qui a été écarté va au **hors-périmètre**, avec son
   motif.

7. **Dépose les décisions structurantes rencontrées** en brouillon dans `docs/adr/_candidates/`, et
   **nomme-les** dans le rapport. Tu ne les figes pas.

8. **Rends la spec à relire.** C'est le premier des deux gestes de validation du niveau feature, et
   il n'y en a pas de troisième : dis-le, plutôt que de laisser croire qu'une gate suivra.

## Ce que tu NE fais PAS

- Tu **n'interviewes pas** et tu ne poses aucun marqueur d'ambiguïté.
- Tu **n'écris aucun ticket** — c'est `/scd-sdd:tickets`, et le découpage s'arbitre séparément.
- Tu **n'écris aucun ADR** ni ne touches à `docs/adr/NNNN-*.md`.
- Tu **ne touches à aucun document du socle** — `CLAUDE.md`, `docs/ci.md`, `.claude/guards.json`.
- Tu **n'écris aucun code** et n'exécutes aucun test.
- Tu **ne rends aucun verdict**. Il n'y a plus de gate, et prétendre en jouer une serait rétablir ce
  que la refonte a retiré.

<report>

```
## Spec — specs/NNN-slug/SPEC.md

[N] lignes · [N] comportements · [N] décisions d'implémentation · [N] écartés

### Ce qu'il faut relire en priorité
[Les deux ou trois points où tu as tranché sans que l'humain l'ait dit explicitement.
 C'est la partie utile du rapport : le reste, il le lira dans le fichier.]

### Décisions structurantes déposées en candidat
[une ligne par brouillon — ou « aucune »]

### Ce que je n'ai pas pu établir
[une ligne par trou réel — ou « rien »]
```

</report>

## Skill active

Skill `specs` — référence `references/spec.md`, chargée **intégralement**.

## À la fin

*« Relis `specs/NNN-slug/SPEC.md` — c'est la seule validation de ce document, il n'y a pas de gate
derrière. Quand elle te convient : `/scd-sdd:tickets NNN` pour la découper. »*

- Des candidats ADR ont été déposés → **dis-le séparément** : *« [N] décisions structurantes
  attendent d'être figées : `/scd-sdd:adr`. »*
