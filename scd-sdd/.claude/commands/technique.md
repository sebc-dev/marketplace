---
description: "Phase 2 du socle : produit docs/technique.md en une session et deux moitiés — les fondations (langage, framework, DB, auth, déploiement, tests) en mode « options justifiées », puis la structure en trois temps (constat de ce que la stack impose déjà, options justifiées sur les deux axes réellement ouverts, compilation en invariants). Un invariant n'entre que s'il laisse une trace observable dans l'arborescence ou dans les imports. Produit les deux listes de candidats ADR, et le gisement que la phase livraison dérivera en contrôles arch-invariants."
argument-hint: "(aucun — lit docs/produit.md)"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu établis le **comment** du projet, sur ses **deux niveaux** : les **fondations** — langage,
framework, base de données, auth, cible de déploiement, stratégie de test — et la
**structure** — ce que ces fondations imposent déjà, ce qui reste réellement ouvert, et ce
que le code s'interdit désormais. La sortie est `docs/technique.md`, **deuxième** document du
socle.

Les deux moitiés étaient deux phases jusqu'à `1.19.0`. Les réunir supprime un `/clear` et le
rechargement de contexte qui allait avec : la seconde n'a jamais rien fait d'autre que
**partir de** la première, et son temps 1 constate ce qu'un framework tranché quelques
minutes plus tôt impose (`DECISIONS.md` §D39).

Le mode des fondations est **« options justifiées »** : tu proposes des options argumentées,
l'humain tranche. Ce n'est pas de la politesse — un choix imposé par un agent est un choix
que personne ne peut défendre six mois plus tard, et il est coûteux à inverser.

Ce que la seconde moitié achète tient en une observation mesurée : la dérive architecturale
ne s'installe pas par une grande décision, elle s'installe **décision par décision, à
l'implémentation** — et les contrôles automatiques de conformité de dépendances la réduisent
réellement, ≈ 60 % de violations structurelles en moins avec feedback (Knodel et al., ICSM
2008, **académique**), mais imparfaitement, ≈ 77 % des dépendances détectées en moyenne sur
dix outils (Pruijt et al., 2017, **académique**). D'où la forme du document : des **invariants
exécutables**, pas de la documentation passive. Ce que tu écris ici est le gisement que
`/scd-sdd:livraison` dérivera en contrôles `arch-invariants`.

Le risque n° 1 est le *big design up front*, et il est réel : une part de la structure est de
toute façon imposée par le framework. C'est le **critère d'admission** qui l'empêche, et il ne
s'assouplit pas.

Ce fichier est une **synthèse**. Le rationale de chaque décision et de chaque invariant part
dans un ADR à la phase suivante : tu produis des **candidats**, tu n'écris aucun ADR.

Ratio : 45% humain / 55% AI (l'humain tranche les fondations, les caractéristiques et les
deux axes ; tu constates, tu argumentes et tu compiles).

## Règles absolues

- **Aucune stack par défaut sans arbitrage explicite.** Ni ta préférence, ni le choix le plus
  populaire, ni celui du dernier projet.
- **Chaque choix et chaque caractéristique servent au moins un `FR-xxx`/`SC-xxx`.** La colonne
  « Sert » n'est pas décorative : ce qui ne sert aucune exigence est du sur-engineering, et il
  se retire.
- **Alternative écartée nommée**, avec sa raison, pour chaque décision structurante.
- **Le critère d'admission gouverne la seconde moitié, et ne s'assouplit pas** : une règle
  n'entre dans la table des **Invariants** que si elle laisse une **trace observable dans
  l'arborescence ou dans les imports**. Ce qui ne le passe pas reste du contexte, ou sort —
  jamais rendu vague pour entrer quand même.
- **Un constat n'est pas une décision.** Ce que le langage, le framework ou la cible de
  déploiement imposent va en « Contraintes imposées par la stack », **sans ADR** : on ne décide
  pas ce qui est déjà décidé, et un ADR de constat dilue les vraies décisions.
- **Un invariant s'écrit en interdiction ou obligation vérifiable**, jamais en intention :
  « aucun import de X hors de Y », pas « on évitera de dépendre de X ».
- **3 à 5 caractéristiques architecturales, jamais plus.** Au-delà de cinq, l'architecture
  devient générique et l'argumentaire ne discrimine plus rien.
- **Les deux axes sont indépendants** — macro (décomposition) et micro (organisation interne
  d'un module) — et les confondre est une erreur de catégorie. Tu présentes des options par
  axe, avec leurs critères de choix documentés, jamais un argumentaire d'évangélisation.
- **Tu es contradicteur, pas animateur.** Tu argumentes pour **et** contre chaque option. Tu
  ne joues aucun atelier d'évaluation : aucune méthode de ce type n'est validée en usage solo.
  La passe adverse du socle existe déjà et vit ailleurs (`/scd-sdd:premortem socle`).
- **Le critère de fin est falsifiable, et c'est le seul** : chaque invariant a sa trace
  observable et son candidat ADR. Jamais « l'architecture est décrite ». Un document sans
  invariant n'a pas joué sa seconde moitié, c'est une prose de contexte.
- **`docs/produit.md` n'est jamais rétro-modifié** pour coller à un choix technique. La
  technique sert les exigences, pas l'inverse.
- **Synthèse ici, rationale dans l'ADR.** Ne duplique pas : tu prépares les ADR, tu ne les
  écris pas, et l'alternative écartée du temps 2 leur appartient.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
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

1. **Lis `docs/produit.md`** — prérequis strict. S'il manque, **arrête-toi** et renvoie vers
   `/scd-sdd:produit` : sans exigences, aucun choix technique n'est justifiable et aucune
   caractéristique n'est traçable.

2. **Charge le template et ses règles** : lis `references/technique.md` du skill
   `project-docs`, **intégralement**. Son `<template>`, sa grille des onze classes et son
   `<completion>` ne se devinent pas — ils se lisent.

### Moitié 1 — les fondations

3. **Traite chaque domaine structurant** — **langage, framework, base de données, auth, cible
   de déploiement, stratégie de test**, plus tout domaine propre au projet. Pour chacun :
   - **au premier domaine, charge le skill `exposition`** — **régime *options*** : il porte
     l'ordre d'exposition (l'objet avant le problème, le mécanisme quand le choix en dépend, ce
     qu'on paie par option), jamais le contenu des options ;
   - présente **2-3 options** avec pour/contre **reliés aux `FR`/`SC` concernés** ;
   - **si l'arbitrage dépend d'un fait que tu ne tiens pas de mémoire** — maturité réelle d'un
     framework, limite d'un service géré, état d'un écosystème —, **fais-le sourcer avant de
     trancher** : `/scd-sdd:research` pour un arbitrage entier, `/scd-sdd:lookup` pour un fait
     ponctuel et daté, qui répond en session. Un pour/contre écrit au jugé se lit exactement
     comme un pour/contre sourcé, et il descend ensuite dans un ADR **immuable** : c'est là que
     la chaîne de traçabilité devient un vecteur de blanchiment de citation. Annonce la question
     et laisse l'humain lancer la recherche — tu reprends la phase quand le résultat est là ;
   - fais trancher l'utilisateur (`AskUserQuestion`) ;
   - note l'alternative écartée **et sa raison**.

   Un domaine sans objet se marque explicitement « non applicable » — il ne se saute pas en
   silence.

4. **Remplis le tableau « Choix retenus »**, colonne « Sert (FR/SC) » comprise, puis les
   **contraintes transverses** — techniques, légales, budget, plateformes cibles, latence,
   offline-first : tout ce qui borne les choix sans être un choix. Une **seule** section, qui
   absorbe ce que le Brief et la Stack demandaient chacun de leur côté avant la fusion.

5. **Dresse la liste « Décisions structurantes → candidats ADR »** : une ligne par décision
   **coûteuse à inverser**. Le tri est le travail réel de cette étape — langage, décomposition,
   DB, auth, déploiement, stratégie de test en sont ; le choix d'un utilitaire mineur ou d'une
   convention évidente n'en est pas. C'est l'une des deux listes que `/scd-sdd:adr` consommera,
   une ligne = un ADR.

### Moitié 2 — la structure, en trois temps

6. **Temps 1 — constate ce qui est déjà décidé.** Liste ce que le langage, le framework et les
   cibles de déploiement **que tu viens de trancher** imposent : routage par arborescence,
   convention de dossiers, modèle de modules, frontière client / serveur, mécanisme
   d'injection. Chaque ligne nomme **qui l'impose**, et **aucune n'a d'ADR**.

   Le partage avec un invariant se lit à une question : *le framework échouerait-il sans cette
   règle ?* Si oui, c'est une contrainte ; si non, c'est une décision du projet, et elle ira au
   temps 3.

7. **Élicite les caractéristiques architecturales** — 3 à 5, pas une de plus
   (`AskUserQuestion` convient). Chacune dit **ce qu'elle exige de la structure** et cite au
   moins un `FR-xxx`/`SC-xxx` de `docs/produit.md`. Ce sont elles qui fonderont
   l'argumentation du temps 2 : sans elles, les options se comparent à vide.

8. **Temps 2 — présente les options, par axe, sur les seuls axes ouverts.** 2-3 options par
   axe, avec les critères de choix et le coût de la référence, chacune reliée aux
   caractéristiques retenues et aux `FR`/`SC` qu'elles servent — puis **fais trancher
   l'utilisateur** (`AskUserQuestion`), axe par axe. Le skill `exposition` est déjà chargé
   depuis l'étape 3 ; un axe d'architecture se tranche rarement sans que le mécanisme en jeu
   soit compris, c'est le cas type de son point 2.

   Un axe que le temps 1 a fermé **ne se rouvre pas** : on ne propose pas d'options sur ce que
   le framework impose. Note l'alternative écartée et sa raison pour la phase `adr` — sans la
   recopier dans `docs/technique.md`.

9. **Temps 3 — compile en invariants.** Pour chaque décision des deux moitiés et chaque règle
   proposée, **une seule question**, celle de l'étape 7 de `/scd-sdd:adr`, mot pour mot :

   > *Cette décision laisse-t-elle une trace observable dans l'arborescence ou dans les
   > imports ?*

   Si oui, elle donne un invariant : classe **1 à 11** lue dans la grille de la référence,
   trace observable **écrite** (« ligne d'import », « chemin du fichier » — pas « dans le
   code »), caractéristiques et `FR`/`SC` servis, colonne ADR laissée en attente. Si non, elle
   reste du contexte, ou sort.

10. **Écris ce que la phase n'admet pas.** Les quatre classes non statiques — **12** conformité
    sémantique de nommage, **13** contrats de comportement runtime, **14** drift de
    configuration et sécurité runtime, **15** propriétés holistiques composites — se **nomment**
    dans la dernière section. Ce qui a été proposé puis refusé faute de trace observable s'y
    écrit aussi, sans quoi la proposition revient à chaque re-passe. Cette section n'est ni vide
    ni générique : taire un trou ferait croire le contraire.

11. **Écris `docs/technique.md`** selon le template (trace vers `docs/produit.md`). Laisse les
    **deux** colonnes « ADR » — « Choix retenus » et « Invariants » — **vides** : elles seront
    back-fillées par `/scd-sdd:adr`, et tant que celle des invariants l'est, l'invariant est un
    **candidat**.

12. **Relis contre le bloc `<completion>`** de `references/technique.md` — en particulier le
    critère de fin : chaque invariant a une classe, une trace observable écrite, et son candidat
    ADR.

13. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu n'écris **aucun ADR**, et tu ne rédiges pas le rationale détaillé d'une décision ni d'un
  invariant : ce sont des **candidats**, `/scd-sdd:adr` les promeut.
- Tu n'écris **rien dans `docs/ci.md`**, tu ne choisis **aucun outil de vérification** et tu ne
  touches à aucun statut informatif → bloquant. L'admission appartient à cette phase, la
  vérification à `/scd-sdd:livraison`.
- Tu **n'exécutes et n'installes aucun** outil d'analyse statique, linter d'architecture ou
  script de vérification — pas même pour « voir ». Le plugin écrit la recette, le projet porte
  le mécanisme.
- Tu ne produis **aucun diagramme outillé ni modèle formel**. Le plafond est C4
  Context + Container **en prose courte** : aucun format de documentation « optimisé pour un
  agent » n'a de littérature établie, et on ne prescrit pas ce qui n'est pas fondé.
- Tu ne descends pas au design : pas de schéma de tables, pas de nom de classe, pas de
  signature d'API. Ce qui ne passe pas la question d'admission n'a rien à faire ici.
- Tu ne rends aucune règle vague pour la faire entrer. Une ligne sans trace observable se
  **retire**.
- Tu ne modifies **rien dans `docs/produit.md`**, et tu n'ajoutes aucune dépendance sans la
  relier à une exigence.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `technique`
- **Résultat** : les choix structurants · le nb de décisions → ADR · le nb d'invariants ·
  le nb de caractéristiques.
  Exemple : `Astro 6 + Cloudflare + D1 · 4 décisions → ADR · 4 invariants · 3 caractéristiques`.

## Skill active

- `project-docs` — charge `references/technique.md`, **intégralement** (`role` + `template` +
  `guidance` + `completion`). Sa section `## Vérification` est celle que `/scd-sdd:livraison`
  rechargera plus tard, seule : ici tu la lis pour savoir ce qui sera **rendable**, pas pour
  choisir un outil.
- `exposition` — **régime *options***, chargé à l'étape 3, au premier domaine traité, et
  toujours en place au temps 2. Aucune `references/`.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Affiche les **deux** sorties qui pilotent la phase suivante, et le moment de les corriger est
maintenant, pas après :

1. la liste **« Décisions structurantes → candidats ADR »** ;
2. la **table des invariants** — invariant · classe · trace observable · sert. Un invariant
   sans trace observable ne deviendra jamais un contrôle, et un invariant oublié ici devra
   repasser par un ADR pour exister.

C'est la première rencontre du mot dans le flux réel — glose-le une fois, en une ligne : un **ADR**
est une décision consignée dans un fichier court, immuable une fois acceptée ; c'est le *pourquoi*
qu'on relira dans six mois, quand personne ne se souviendra des alternatives écartées.

Rappelle ce que la phase laisse ouvert : les invariants sont des **candidats** tant que la
colonne ADR est vide, et ils ne seront **vérifiés** que si `/scd-sdd:livraison` en dérive des
contrôles — informatifs jusqu'à mesure.

Propose ensuite l'**audit**, optionnel : « Pour vérifier que `docs/technique.md` est complet, que
chaque choix est relié aux `FR`/`SC` et que chaque invariant nomme sa trace observable : `/clear`,
puis `/scd-sdd:audit technique`. L'audit confronte le document à une grille et rend une **liste de
travail** — il ne touche jamais au document lui-même. Le `/clear` n'est pas cosmétique : juger ce
qu'on vient d'écrire, c'est relire ses intentions au lieu du texte. Rien ne l'exige — sans audit, la
suite est `/scd-sdd:adr`. »

Puis : « `/clear`, puis `/scd-sdd:adr` — qui promeut les **deux** listes de candidats de
`docs/technique.md` : les décisions structurantes et les invariants. »
