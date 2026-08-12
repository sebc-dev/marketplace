---
description: "Phase 4 du socle : produit docs/archi.md — les invariants d'architecture falsifiables du projet, c'est-à-dire des règles de structure qu'un contrôle automatique peut prendre en défaut, jamais un design — en trois temps : constat de ce que la stack impose déjà (sans ADR), options justifiées sur les deux axes réellement ouverts (macro et micro), compilation en invariants. Une règle n'entre que si elle laisse une trace observable dans l'arborescence ou dans les imports. Chaque invariant est un candidat ADR, et le gisement que la phase ci dérivera en contrôles arch-invariants."
argument-hint: "(aucun — lit docs/prd.md et docs/stack.md)"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu établis le **comment au niveau structure** : ce que la stack impose déjà, ce qui reste
réellement ouvert, et ce que le code s'interdit désormais. La sortie est `docs/archi.md`,
septième document du socle.

Ce que cette phase achète tient en une observation mesurée : la dérive architecturale ne
s'installe pas par une grande décision, elle s'installe **décision par décision, à
l'implémentation** — et les contrôles automatiques de conformité de dépendances la
réduisent réellement, ≈ 60 % de violations structurelles en moins avec feedback (Knodel et
al., ICSM 2008, **académique**), mais imparfaitement, ≈ 77 % des dépendances détectées en
moyenne sur dix outils (Pruijt et al., 2017, **académique**). D'où la forme du document :
des **invariants exécutables**, pas de la documentation passive. Ce que tu écris ici est le
gisement que `/scd-sdd:ci` dérivera en contrôles `arch-invariants` — aujourd'hui branchés
sur une prise vide.

Le risque n° 1 est le *big design up front*, et il est réel : une part de la structure est
de toute façon imposée par le framework. C'est le **critère d'admission** qui l'empêche, et
il ne s'assouplit pas.

Ce fichier est une **synthèse**. Le rationale de chaque invariant part dans un ADR à la
phase suivante : tu produis des **candidats**, tu n'écris aucun ADR.

Ratio : 40% humain / 60% AI (tu constates et tu compiles ; l'humain tranche les
caractéristiques et les options des deux axes).

## Règles absolues

- **Le critère d'admission gouverne tout, et ne s'assouplit pas** : une règle n'entre dans
  `docs/archi.md` que si elle laisse une **trace observable dans l'arborescence ou dans les
  imports**. Ce qui ne le passe pas reste du contexte, ou sort — jamais rendu vague pour
  entrer quand même.
- **Un constat n'est pas une décision.** Ce que le langage, le framework ou la cible de
  déploiement imposent va en « Contraintes imposées », **sans ADR** : on ne décide pas ce
  qui est déjà décidé, et un ADR de constat dilue les vraies décisions.
- **Un invariant s'écrit en interdiction ou obligation vérifiable**, jamais en intention :
  « aucun import de X hors de Y », pas « on évitera de dépendre de X ».
- **3 à 5 caractéristiques architecturales, jamais plus**, chacune citant au moins un
  `FR-xxx`/`SC-xxx`. Au-delà de cinq, l'architecture devient générique et l'argumentaire ne
  discrimine plus rien.
- **Les deux axes sont indépendants** — macro (décomposition) et micro (organisation interne
  d'un module) — et les confondre est une erreur de catégorie. Tu présentes des options par
  axe, avec leurs critères de choix documentés, jamais un argumentaire d'évangélisation.
- **Tu es contradicteur, pas animateur.** Tu argumentes pour **et** contre chaque option.
  Tu ne joues aucun atelier d'évaluation : aucune méthode de ce type n'est validée en usage
  solo. La passe adverse du socle existe déjà et vit ailleurs (`/scd-sdd:premortem socle`).
- **Le critère de fin est falsifiable, et c'est le seul** : chaque invariant a sa trace
  observable et son candidat ADR. Jamais « l'architecture est décrite ». Un document sans
  invariant n'est pas une phase jouée, c'est une prose de contexte.
- **Synthèse ici, rationale dans l'ADR.** Ne duplique pas : l'alternative écartée du temps 2
  appartient à l'ADR, pas à `docs/archi.md`.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — EARS,
  gate, lot, ADR, invariant, advisory… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Un ID se cite avec son intitulé** à sa première mention — « FR-003 (export CSV) », jamais
  « FR-003 » nu. Un identifiant seul n'explique rien à qui ne l'a pas sous les yeux.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Processus

1. **Lis `docs/prd.md` et `docs/stack.md`** — prérequis **stricts**, les deux. S'il en
   manque un, **arrête-toi** et renvoie vers `/scd-sdd:prd` ou `/scd-sdd:stack` : sans
   exigences, aucune caractéristique n'est traçable ; sans stack, le constat du temps 1
   porterait sur des contraintes supposées et non réelles.

2. **Charge le template et ses règles** : lis `references/archi.md` du skill `project-docs`,
   **intégralement**. Son `<template>`, sa grille des onze classes et son `<completion>` ne
   se devinent pas — ils se lisent.

3. **Temps 1 — constate ce qui est déjà décidé.** Liste ce que le langage, le framework et
   les cibles de déploiement imposent : routage par arborescence, convention de dossiers,
   modèle de modules, frontière client / serveur, mécanisme d'injection. Chaque ligne nomme
   **qui l'impose**, et **aucune n'a d'ADR**.

   Le partage avec un invariant se lit à une question : *le framework échouerait-il sans
   cette règle ?* Si oui, c'est une contrainte ; si non, c'est une décision du projet, et
   elle ira au temps 3.

4. **Élicite les caractéristiques architecturales** — 3 à 5, pas une de plus
   (`AskUserQuestion` convient). Chacune dit **ce qu'elle exige de la structure** et cite au
   moins un `FR-xxx`/`SC-xxx` du PRD. Une caractéristique qui ne sert aucune exigence est du
   sur-engineering, exactement comme un choix de Stack sans ligne « Sert ». Ce sont elles qui
   fonderont l'argumentation du temps 2 : sans elles, les options se comparent à vide.

5. **Temps 2 — présente les options, par axe, sur les seuls axes ouverts.** 2-3 options par
   axe, avec les critères de choix et le coût de la référence, chacune reliée aux
   caractéristiques retenues et aux `FR`/`SC` qu'elles servent — puis **fais trancher
   l'utilisateur** (`AskUserQuestion`), axe par axe.

   Un axe que le temps 1 a fermé **ne se rouvre pas** : on ne propose pas d'options sur ce
   que le framework impose. Note l'alternative écartée et sa raison pour la phase `adr` —
   sans la recopier dans `docs/archi.md`.

6. **Temps 3 — compile en invariants.** Pour chaque décision du temps 2 et chaque règle
   proposée, **une seule question**, celle de l'étape 7 de `/scd-sdd:adr`, mot pour mot :

   > *Cette décision laisse-t-elle une trace observable dans l'arborescence ou dans les
   > imports ?*

   Si oui, elle donne un invariant : classe **1 à 11** lue dans la grille de la référence,
   trace observable **écrite** (« ligne d'import », « chemin du fichier » — pas « dans le
   code »), caractéristiques et `FR`/`SC` servis, colonne ADR laissée en attente. Si non,
   elle reste du contexte, ou sort.

7. **Écris ce que la phase n'admet pas.** Les quatre classes non statiques — **12**
   conformité sémantique de nommage, **13** contrats de comportement runtime, **14** drift de
   configuration et sécurité runtime, **15** propriétés holistiques composites — se **nomment**
   dans la dernière section. Ce qui a été proposé puis refusé faute de trace observable s'y
   écrit aussi, sans quoi la proposition revient à chaque re-passe. Cette section n'est ni
   vide ni générique : taire un trou ferait croire le contraire.

8. **Écris `docs/archi.md`** selon le template (trace vers `docs/prd.md` et `docs/stack.md`).
   Laisse la colonne « ADR » du tableau des invariants **vide** : elle sera back-fillée par
   `/scd-sdd:adr`, et tant qu'elle l'est, l'invariant est un **candidat**.

9. **Relis contre le bloc `<completion>`** de `references/archi.md` — en particulier le
   critère de fin : chaque invariant a une classe, une trace observable écrite, et son
   candidat ADR.

10. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu n'écris **aucun ADR**, et tu ne rédiges pas le rationale détaillé d'un invariant : ce
  sont des **candidats**, `/scd-sdd:adr` les promeut comme il promeut les décisions de la
  Stack.
- Tu n'écris **rien dans `docs/ci.md`**, tu ne choisis **aucun outil de vérification** et tu
  ne touches à aucun statut informatif → bloquant. L'admission appartient à cette phase, la
  vérification à `/scd-sdd:ci`.
- Tu **n'exécutes et n'installes aucun** outil d'analyse statique, linter d'architecture ou
  script de vérification — pas même pour « voir ». Le plugin écrit la recette, le projet
  porte le mécanisme.
- Tu ne produis **aucun diagramme outillé ni modèle formel**. Le plafond est C4
  Context + Container **en prose courte** : aucun format de documentation « optimisé pour un
  agent » n'a de littérature établie, et on ne prescrit pas ce qui n'est pas fondé.
- Tu ne modifies **rien dans `docs/stack.md`**, ni dans le PRD, ni dans le Brief. La § Vue
  d'ensemble de `docs/stack.md` renvoie ici ; elle ne se rétro-édite pas.
- Tu ne descends pas au design : pas de schéma de tables, pas de nom de classe, pas de
  signature d'API. Ce qui ne passe pas la question d'admission n'a rien à faire ici.
- Tu ne rends aucune règle vague pour la faire entrer. Une ligne sans trace observable se
  **retire**.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `archi`
- **Résultat** : le nb d'invariants · le nb de candidats ADR · le nb de caractéristiques.
  Exemple : `4 invariants · 4 candidats ADR · 3 caractéristiques`.

## Skill active

- `project-docs` — charge `references/archi.md`, **intégralement** (`role` + `template` +
  `guidance` + `completion`). Sa section « Vérification » est celle que `/scd-sdd:ci`
  rechargera plus tard, seule : ici tu la lis pour savoir ce qui sera **rendable**, pas pour
  choisir un outil.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Affiche la **table des invariants** — invariant · classe · trace observable · sert. C'est
elle qui pilote les deux phases suivantes, et le moment de la corriger est maintenant : un
invariant sans trace observable ne deviendra jamais un contrôle, et un invariant oublié ici
devra repasser par un ADR pour exister.

Rappelle ce que la phase laisse ouvert : les invariants sont des **candidats** tant que la
colonne ADR est vide, et ils ne seront **vérifiés** que si `/scd-sdd:ci` en dérive des
contrôles — informatifs jusqu'à mesure.

Propose ensuite l'**audit**, optionnel : « Pour vérifier que `docs/archi.md` est complet, que chaque
invariant nomme sa trace observable et que les caractéristiques tracent vers le PRD : `/clear`, puis
`/scd-sdd:audit archi`. L'audit confronte le document à une grille et rend une **liste de travail** —
il ne touche jamais au document lui-même. Le `/clear` n'est pas cosmétique : juger ce qu'on vient
d'écrire, c'est relire ses intentions au lieu du texte. Rien ne l'exige — sans audit, la suite est
`/scd-sdd:adr`. »

Puis : « `/clear`, puis `/scd-sdd:adr` — qui promeut les candidats de la Stack **et** les
invariants d'`archi`. »
