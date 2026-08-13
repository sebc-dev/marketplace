# Référence — Architecture (`docs/archi.md`)

<role>
Répond au **comment au niveau structure** : ce que la stack impose déjà, ce qui reste réellement
ouvert, et ce que le code s'interdit désormais. Trace vers le PRD (les caractéristiques servent des
`FR`/`SC`) et vers la Stack (le constat porte sur le langage et le framework déjà tranchés).
Produit **`docs/archi.md`**, **quatrième** document du socle — après le Brief, le PRD et la Stack,
avant les ADR —, en **trois temps** : constat, options justifiées, compilation en invariants.

Ce fichier est la **synthèse** ; les ADR portent le rationale, un par décision — exactement la
relation `docs/stack.md` ↔ `docs/adr/`. Chaque invariant est un **candidat ADR** que la phase `adr`
promeut, et rien d'autre : cette phase n'écrit aucun ADR, n'écrit rien dans `docs/ci.md`, et ne
choisit aucun outil de vérification.

**Le critère qui gouverne toute la phase**, et qu'on n'assouplit pas :

> Une règle n'entre dans `docs/archi.md` que si elle laisse une **trace observable dans
> l'arborescence ou dans les imports**.

C'est ce qui empêche la phase de dégénérer en *big design up front* — le risque n° 1, puisqu'une
part de la structure est de toute façon imposée par le framework. Le plafond documentaire est C4
Context + Container **en prose courte** (Brown, **praticien reconnu**) ; ce qui ne passe pas
l'admission reste du contexte, ou sort.

**Où cette référence se charge — trois points, et seul le premier est intégral :**

1. par `/scd-sdd:archi`, **intégralement** : c'est le template et la méthode de la phase ;
2. par `/scd-sdd:ci`, **la seule section `## Vérification` de la `<guidance>`**, et seulement au
   moment de dériver les contrôles `arch-invariants`. L'admission appartient à `archi`, la
   vérification à `ci` — un seul endroit par information ;
3. par l'agent **`audit-explorer`**, le **seul bloc `<template>`**, quand `/scd-sdd:audit archi`
   juge ce document. Il n'en tire que la **liste des sections attendues** et ne le recopie nulle
   part (`DECISIONS.md` §D20) : admettre un invariant appartient à `archi`, constater ce qui manque
   à l'audit.
</role>

<template>
```markdown
# Architecture — [Projet]
Statut : Brouillon | Créé : [date] | Trace vers : docs/prd.md, docs/stack.md

## Légende
- **Invariant** — une règle de structure qui doit rester vraie tout le temps (« aucun import de
  `db/` hors de `server/` »). Ce n'est pas un design : c'est ce qu'on s'interdit.
- **Trace observable** — ce qu'un contrôle automatique regarderait pour prendre la règle en défaut :
  un chemin de fichier, une ligne d'import. **Sans trace observable, la règle n'entre pas** — sinon
  personne ne pourra jamais dire si elle est respectée.
- **Caractéristique** — la qualité qu'on cherche à préserver (testabilité, time-to-market…). Les
  invariants existent pour la servir ; la colonne *Sert* dit laquelle.
- **Classe** — la famille de l'invariant (1 = sens des dépendances, 5 = placement des fichiers…),
  utile parce que chaque famille se vérifie avec le même genre d'outil.
- **Candidat ADR** — la colonne *ADR* reste **vide** ici : elle sera remplie par la phase
  `/scd-sdd:adr`, qui fige le pourquoi de chaque invariant dans un fichier à part.

## Vue d'ensemble
[2-4 phrases : type d'appli, style macro retenu (décomposition), style micro retenu
(organisation interne d'un module). Pas de diagramme outillé — C4 Context + Container en mots.]

## Caractéristiques architecturales retenues
| # | Caractéristique | Ce qu'elle exige de la structure | Sert (FR/SC) |
|---|---|---|---|
| C1 | [ex : testabilité] | [ex : le domaine s'instancie sans base ni HTTP] | FR-003, SC-002 |
| C2 | [ex : time-to-market] | ... | SC-001 |
[3 à 5 lignes. Jamais plus : au-delà, l'argumentaire ne discrimine plus rien.]

## Contraintes imposées par la stack
| Contrainte | Imposée par | Conséquence structurelle |
|---|---|---|
| [ex : routage par arborescence] | [framework] | l'emplacement des pages n'est pas un choix |
[Aucun ADR pour ces lignes : un constat n'est pas une décision.]

## Invariants
| # | Invariant | Classe | Trace observable | Sert | ADR |
|---|---|---|---|---|---|
| I1 | aucun import de `db/` hors de `server/` | 1 — sens des dépendances | ligne d'import dans un fichier hors `server/` | C1, FR-003 | *(vide)* |
| I2 | [ex : un handler HTTP réside dans `routes/`] | 5 — placement | chemin du fichier | C2 | *(vide)* |
[Une ligne sans trace observable n'entre pas. La colonne ADR se laisse **vide** au premier
passage — n'y écris jamais un numéro : les ADR n'existent pas encore. Elle est bouclée par la
phase `adr`, et tant qu'elle est vide l'invariant est un **candidat**.]

## Ce que cette architecture n'admet pas comme invariant
- **Classe 12 — conformité sémantique de nommage à l'intention métier** : relève du jugement,
  pas d'un grep.
- **Classe 13 — contrats de comportement runtime** (latence, disponibilité, fraîcheur).
- **Classe 14 — drift de configuration, sécurité runtime, coûts.**
- **Classe 15 — propriétés holistiques composites** (« posture de sécurité »).
- [Et ce qui a été proposé puis refusé faute de trace observable, nommé ici plutôt que tu.]
```
</template>

<guidance>

## La méthode en trois temps, et son critère de fin

Ni interview pure, ni options justifiées pures. L'interview produirait de la prose sur une matière
que l'humain ne maîtrise pas forcément, et rien n'y serait falsifiable ; les options justifiées
seules feraient « décider » ce que le framework impose déjà. D'où trois temps, dans cet ordre.

| Temps | Ce qu'on fait | Ce qui en sort | ADR ? |
|---|---|---|---|
| 1 — **Constat** | ce que la stack et le framework imposent | § Contraintes imposées | **non** |
| 2 — **Options justifiées** | les seuls axes réellement ouverts, par axe | § Vue d'ensemble + § Caractéristiques | oui, via les invariants |
| 3 — **Compilation** | chaque décision passe la question d'admission | § Invariants + § Ce qu'on n'admet pas | oui — un invariant = un candidat |

**Le critère de fin est falsifiable, et c'est le seul :**

> **Chaque invariant a sa trace observable et son candidat ADR.**

Jamais « l'architecture est décrite », qui ne se vérifie pas. Un document sans invariant n'est pas
une phase jouée : c'est une prose de contexte.

## Temps 1 — un constat n'est pas une décision

Lister d'abord ce que le langage, le framework et les cibles de déploiement décident **déjà** :
routage par arborescence, convention de dossiers imposée, modèle de modules, frontière client /
serveur, mécanisme d'injection. Ces lignes vont dans « Contraintes imposées », **sans ADR** : on ne
décide pas ce qui est déjà décidé, et un ADR pour un constat gonfle `docs/adr/` d'un bruit qui
dilue les vraies décisions.

Une contrainte peut néanmoins **produire un invariant** : le framework impose le dossier, la
règle « rien d'autre que des pages dans ce dossier » est une décision du projet et passe
l'admission. Le partage se lit à une question : *le framework échouerait-il sans cette règle ?* Si
oui, c'est une contrainte ; si non, c'est un invariant.

## Temps 2 — deux axes indépendants, et les confondre est une erreur de catégorie

Les options se présentent **par axe**, avec les critères de choix de la littérature, jamais un
argumentaire d'évangélisation. « Clean Architecture *vs* Vertical Slice » est une fausse dichotomie
— les deux coexistent dans un monolithe modulaire (Jovanović, **praticien reconnu**).

**Axe macro — la décomposition du système.**

| Option | Critère de choix documenté | Ce qu'elle coûte |
|---|---|---|
| Monolithe modulaire | frontières nettes sans la complexité opérationnelle des microservices ; transition ultérieure possible | discipline de frontières sans barrière de déploiement |
| Microservices / services | besoin de déploiement et de mise à l'échelle indépendants | complexité opérationnelle, cohérence à terme |
| Event-driven | découplage temporel, réactivité, scalabilité | cohérence à terme, complexité opérationnelle |

**Axe micro — l'organisation interne d'un module.**

| Option | Critère de choix documenté | Ce qu'elle coûte |
|---|---|---|
| Vertical slice | features majoritairement indépendantes, partage minimal | duplication assumée entre slices |
| Clean / en couches | logique de domaine partagée entre cas d'usage, équipe raisonnant en couches | abstractions et *ceremony* supplémentaires |
| Hexagonal (ports & adapters) | besoin fort d'isoler le domaine des dépendances externes, testabilité | indirections supplémentaires |
| Transaction script | domaine mince, CRUD dominant | plafond bas dès que la logique s'épaissit |

Présenter **2-3 options par axe ouvert**, chacune reliée aux caractéristiques retenues et aux
`FR`/`SC` qu'elles servent (`AskUserQuestion` convient), puis laisser l'utilisateur trancher. Un axe
que le temps 1 a fermé ne se rouvre pas : on ne propose pas d'options sur ce que le framework
impose.

**L'alternative écartée ne se recopie pas ici.** Elle appartient à l'ADR (§ Alternatives
considérées), écrit à la phase suivante avec l'humain présent. `docs/archi.md` reste une synthèse.

## Les caractéristiques : 3 à 5, tracées, et pas une de plus

Les *architecture characteristics* sont le seul pont documenté entre exigences et structure
(Richards & Ford, **livre d'auteurs reconnus**) : elles fondent l'argumentation du temps 2. La règle
est de viser le **plus petit nombre** — « never shoot for the best architecture, but rather for the
least worst one ». Au-delà de cinq, l'architecture devient générique et l'argumentaire ne discrimine
plus rien ; le profil *essential* d'arc42 (**praticien reconnu**) tient la même ligne : les quality
goals sont le minimum toujours documenté.

Chacune cite au moins un `FR-xxx`/`SC-xxx`. Une caractéristique qui ne sert aucune exigence est du
sur-engineering, exactement comme un choix de Stack sans ligne « Sert ».

## Le rôle de l'agent — contradicteur, pas animateur

L'agent **argumente pour et contre** chaque option, au sens du mode options justifiées. Il ne joue
pas un atelier d'évaluation : **aucune méthode d'évaluation d'architecture n'est validée en usage
solo** — ATAM et QAW sont structurellement multi-parties-prenantes et chiffrés à 32-70 staff-days
(rapports SEI, **officiel**), et ne se présentent pas comme « allégés ». La passe adverse du socle
existe déjà et vit ailleurs : `/scd-sdd:premortem socle`.

## Temps 3 — la grille d'admission : onze classes

Pour chaque décision du temps 2 et chaque règle proposée, **une seule question** — celle de l'étape
7 de `adr`, mot pour mot :

> *Cette décision laisse-t-elle une trace observable dans l'arborescence ou dans les imports ?*

Si oui, elle donne un invariant, et sa classe se lit dans cette table. Si non, elle reste de la
prose de contexte, ou sort.

| # | Classe | Ce qu'elle contraint | Où la trace se voit |
|---|---|---|---|
| 1 | Sens des dépendances | le domaine n'importe pas l'infrastructure | ligne d'import |
| 2 | Absence de cycles | entre modules ou paquets | graphe d'imports |
| 3 | Règles de couches | une couche n'accède qu'aux couches autorisées | ligne d'import |
| 4 | Frontières de modules | un module n'accède qu'à l'API publique d'un autre | chemin importé |
| 5 | Placement | un type d'artefact réside dans le dossier prescrit | chemin du fichier |
| 6 | Nommage structurel | suffixes `Controller`/`Service`/`Repository`, casse | nom de fichier ou de symbole |
| 7 | Visibilité déclarée | ce qui est exporté *vs* interne | mot-clé d'export |
| 8 | Isolation du framework | la logique métier n'importe pas le framework web | ligne d'import |
| 9 | Imports prohibés | listes noires d'APIs ou de paquets | ligne d'import |
| 10 | Métriques structurelles seuillées | taille de fichier, dépendances par unité, complexité | AST / parseur |
| 11 | Couplage statique | connascence, distance à la *main sequence* | graphe d'imports |

**Les deux côtés de la frontière, en exemples :**

- « la couche `db/` n'est atteinte que par `server/` » → **entre** (classe 1, trace : ligne d'import).
- « un handler HTTP réside dans `routes/` » → **entre** (classe 5, trace : chemin du fichier).
- « le cœur métier n'importe aucun paquet du framework web » → **entre** (classe 8).
- « le code sera modulaire » → **n'entre pas** : rien à observer.
- « les noms de variables reflètent le vocabulaire métier » → **n'entre pas** (classe 12, jugement).
- « le P99 reste sous 200 ms » → **n'entre pas** (classe 13, runtime) — c'est un `SC` du PRD, pas un
  invariant.

Un invariant s'écrit comme une **interdiction ou une obligation vérifiable**, jamais comme une
intention : « aucun import de X hors de Y », pas « on évitera de dépendre de X ».

## Ce que la phase n'admet pas se déclare, et ne se tait pas

Les quatre classes non statiques — **12** conformité sémantique de nommage, **13** contrats de
comportement runtime, **14** drift de configuration et sécurité runtime, **15** propriétés
holistiques composites — sont **hors périmètre par construction**, et `docs/archi.md` les **nomme**
dans sa dernière section. C'est le miroir exact du « ce que ces contrôles ne couvrent pas » de la
phase `ci` : taire un trou ferait croire le contraire. Ce qu'un utilisateur a proposé et qui a été
refusé faute de trace observable s'y écrit aussi — sinon la proposition revient à chaque re-passe.

## Ce que cette phase ne fait pas

- **Aucun ADR écrit.** Les invariants sont des **candidats** ; `adr` les promeut, comme il promeut
  les décisions de `stack`.
- **Rien dans `docs/ci.md`, aucun outil choisi, aucun statut informatif → bloquant.** L'admission
  appartient à `archi`, la vérification à `ci`.
- **Aucun diagramme outillé, aucun modèle formel.** Le plafond est la prose courte : aucun format de
  documentation « optimisé pour un agent » n'a de littérature établie — les seules sources sont des
  préprints 2026 **illustratifs** et des billets d'éditeurs. On ne prescrit pas ce qui n'est pas
  fondé.
- **Aucune écriture dans `docs/stack.md`.** Sa § Vue d'ensemble renvoie ici ; elle ne se rétro-édite
  pas.

## Vérification

L'outillage qui rendra les invariants exécutables. **Cette section est celle que `/scd-sdd:ci`
charge, seule et conditionnellement**, au moment de dériver les contrôles `arch-invariants`. Son
titre est exactement `## Vérification`, sans complément — c'est sous ce nom que les trois points de
déclaration la désignent, et un titre plus long les rendrait faux. Elle ne sert pas à choisir un outil pendant la phase
`archi` : elle existe pour qu'un invariant admis ici soit **rendable** plus tard, et pour qu'on
sache tout de suite ce qui ne l'est pas.

Ce qui la justifie tient en deux chiffres **mesurés**, et ils ne disent pas la même chose : les
contrôles automatiques de conformité de dépendances réduisent réellement les violations — ≈ 60 % de
violations structurelles en moins avec feedback (Knodel et al., ICSM 2008, **académique**) — mais
imparfaitement : ≈ 77 % des dépendances détectées en moyenne sur dix outils (Pruijt et al., 2017,
**académique**). Un invariant vérifié n'est donc pas un invariant garanti.

**Instantané daté du 2026-08-09.** Les versions et les statuts se re-vérifient à l'adoption, sur le
**dépôt et le registre de paquets**, jamais sur une page de présentation — et avec les seuils de
re-passe de maturité de la phase `ci` : mainteneur disparu ou dépôt archivé, licence changée (y
compris sur les seules règles), palier gratuit devenu payant.

| Écosystème | Outil | Version · date (2026-08-09) | Classes couvertes | Effort CI |
|---|---|---|---|---|
| JVM | **ArchUnit** | v1.5.0 · 4 août 2026 (page /releases du dépôt) | 1, 2, 3, 6, 9 (par slices) | moyen — tests JUnit |
| .NET | **ArchUnitNET** | 0.13.3 · 5 mars 2026 | 1, 2, 3, 6, 9 | moyen — tests xUnit/NUnit |
| .NET | ~~NetArchTest.Rules~~ | 1.3.2 · 23 mai 2021 — **figé** | — | préférer le fork `eNhancedEdition` (1.4.5) |
| JS/TS | **dependency-cruiser** | 18.1.0 · 12 juil. 2026 (18.1.1 depuis) | 1, 2, 3, 4, 9 + type-only, orphelins | moyen — fichier de règles |
| JS/TS | **eslint-plugin-boundaries** | 7.1.0 · ≈ fin juil. 2026 | 1, 3, 4, 9 (pas les cycles) | moyen — config ESLint |
| Python | **import-linter** | 2.9 · 11 déc. 2025 | 1, 2, 3, 4, 9 | faible — TOML |
| Python | Tach | v0.35.0 · MAJ conda-forge 3 avr. 2026 **[À VÉRIFIER]** | 1, 3, 4, 7 | faible — `tach.toml` · éditeur possiblement réorienté **[À VÉRIFIER]** |
| Go | **go-arch-lint** | v1.16.0 · 9 juil. 2026 **[À VÉRIFIER]** | 1, 2, 3, 9 | faible — YAML + CLI |
| Dart/Flutter | *aucun mature* | `import_lint` 2.0.0 · 18 avr. 2026 — 28 likes, 3,7k téléch. | 1, 3 partiellement | **script maison par défaut** |

**Dart/Flutter n'a pas d'équivalent mature** : le paysage est fragmenté entre paquets à faible
adoption. Seuil de réévaluation : si un paquet dépasse ~100 likes avec éditeur vérifié et cadence
régulière, réexaminer. Aucun outil ne raisonne sur l'arborescence **source** quand il analyse du
bytecode (ArchUnit, ArchUnitNET) : le placement (classe 5) y demande autre chose.

**Le script maison sans dépendance** — parcours d'arborescence + expression régulière sur les lignes
d'import — est un choix légitime et robuste, mais **borné**, et la borne se déclare :

| Atteignable sans dépendance | Ce qui y résiste |
|---|---|
| **placement** (classe 5) — regex sur le chemin | résolution d'**alias** (`@/…`, `tsconfig paths`) et de **barrels** / ré-exports |
| **nommage** (classe 6) — regex sur les noms | **imports dynamiques** (`import()`, `importlib`) |
| **direction d'import entre dossiers** (classes 1, 3) — la plus utile | **cycles transitifs** (classe 2) — exige le graphe complet |
| **listes blanches/noires d'imports externes** (classe 9) | **type-only** *vs* runtime ; garantie de **complétude** des règles |

**Dès qu'un invariant retenu tombe dans la colonne de droite, il faut l'outil natif de
l'écosystème** — ou réimplémenter un résolveur, ce qui revient à recréer une dépendance. Les
métriques seuillées (classe 10) et le couplage statique (classe 11) exigent de toute façon un
parseur.

**Cette phase n'exécute aucun de ces outils et n'en installe aucun.** Le plugin écrit la recette, le
projet porte le mécanisme.

</guidance>

<completion>
La phase Architecture est terminée quand :
- [ ] La § Vue d'ensemble tient en **2-4 phrases** et nomme le style **macro** et le style **micro**
      retenus. Aucun diagramme outillé.
- [ ] Il y a entre **3 et 5 caractéristiques**, et chacune cite au moins un `FR-xxx`/`SC-xxx`.
- [ ] Chaque ligne de « Contraintes imposées » nomme **qui l'impose**, et **aucune** n'a d'ADR.
- [ ] **Chaque invariant a une classe (1-11) et une trace observable écrite** — pas « dans le code ».
      Une ligne sans trace observable a été retirée, pas rendue vague.
- [ ] Chaque invariant est formulé en **interdiction ou obligation vérifiable**, jamais en intention.
- [ ] **Chaque invariant a son candidat ADR** — c'est-à-dire qu'il est *admissible* comme décision
      structurante et que la phase `adr` en écrira une. Au premier passage, la colonne ADR est
      **vide** pour toutes les lignes, et c'est l'état conforme : un numéro y figurant désignerait
      un ADR qui n'existe pas. Elle ne se renseigne qu'à une relecture post-`adr`. C'est le critère
      de fin, et il ne s'assouplit pas.
- [ ] La section « Ce que cette architecture n'admet pas » **nomme les classes 12-15**, plus ce qui a
      été proposé et refusé faute de trace observable. Elle n'est ni vide ni générique.
- [ ] Aucun ADR n'a été écrit, `docs/ci.md` n'a pas été touché, aucun outil n'a été choisi.
- [ ] `docs/stack.md` n'a pas été modifié.
</completion>
