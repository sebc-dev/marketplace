---
description: "Phase 4 du socle : fige les décisions structurantes en ADR dans docs/adr/NNNN-*.md, une par candidat — listé dans la Stack, ou laissé en brouillon dans docs/adr/_candidates/ par le niveau specs (plan, premortem), dont c'est la voie de promotion. Format Nygard, statut Accepté, immuables. Boucle la traçabilité bidirectionnelle avec docs/stack.md."
argument-hint: "(aucun — lit docs/stack.md)"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu figes les **décisions structurantes du départ** en ADR, à partir de la liste
« Décisions structurantes → candidats ADR » de la Stack. Un ADR = une décision, au format
Nygard, **immuable**.

Ce qu'un ADR achète : il empêche la décision de rester « dans la tête ». Six mois plus
tard, personne — humain ou agent — ne peut rouvrir un choix sans savoir ce qu'il coûtait
d'en changer. C'est pour ça que la **conséquence négative** est obligatoire : un ADR qui
ne nomme que des avantages ne documente pas une décision, il la vend.

C'est un travail de rédaction cadré : tu drafts, l'humain valide avant de figer.

Ratio : 30% humain / 70% AI (dérivation depuis la Stack ; l'humain valide le contenu).

## Règles absolues

- **Un ADR par décision structurante**, ni plus ni moins. Aucun ADR pour une
  non-décision (utilitaire mineur, convention évidente) : le bruit dilue le signal.
- **Numérotation `NNNN` sur 4 chiffres**, séquentielle, au **plus petit numéro libre**
  dans `docs/adr/`. Un numéro n'est **jamais réutilisé**, même si un ADR est abandonné.
- **Conséquence négative obligatoire** dans chaque ADR : ce que le choix coûte ou ferme.
- **Immutabilité.** Ici on **crée** (statut « Accepté »). On ne réédite jamais un ADR
  existant — s'il devient faux, un futur ADR le remplacera.
- **Traçabilité bidirectionnelle.** L'ADR trace vers `docs/stack.md`, et `docs/stack.md`
  doit référencer l'ADR en retour. Un sens sans l'autre laisse la boucle ouverte.
- **Un fait daté se cite par sa source, jamais nu.** Si elle est un rapport de recherche,
  c'est `docs/research/AAAA-MM-JJ-slug.md`, nommé dans le Contexte ou les Alternatives.
  Un ADR est **immuable** : ce qui entre ici sans source ressort en décision que
  `CLAUDE.md` interdit de contredire et que la gate `analyze` protège au lieu de la
  questionner. Un fait que tu ne tiens pas de mémoire se source **avant** d'être figé —
  `/scd-sdd:lookup` s'il est ponctuel, `/scd-sdd:research` s'il porte l'arbitrage.
- **Un ADR accepté peut remonter en contrôle vérifié.** Une décision qui laisse une **trace
  observable** — dans l'arborescence ou dans les imports — est dérivable en contrôle
  automatique par `/scd-sdd:ci`, qui relit `docs/adr/` pour ça. C'est le sens **inverse** de
  celui que la règle précédente interdit : un rapport ne descend jamais seul dans un ADR
  immuable, mais ce qu'un ADR a figé peut monter en invariant vérifié. Ici tu le **repères et
  tu le signales** — tu ne dérives aucun contrôle, et tu n'ajoutes rien à l'ADR pour le
  marquer : la phase `ci` re-dérive depuis `docs/adr/`, qui reste la source.

## Processus

1. **Lis `docs/stack.md`** — prérequis strict. S'il manque, **arrête-toi** et renvoie
   vers `/scd-sdd:stack` : les candidats ADR viennent de là. Récupère la liste
   « Décisions structurantes → candidats ADR ».

   Complète-la des **brouillons** de `docs/adr/_candidates/*.md` (`Glob`), s'il y en a :
   les décisions structurantes laissées par le niveau specs (`plan`, `premortem`)
   attendent leur promotion **ici** — c'est cette commande que `plan` nomme pour ça.
   Chaque brouillon se traite comme un candidat de plus, validation humaine comprise.

2. **Charge le template et ses règles** : lis `references/adr.md` du skill
   `project-docs`.

3. **Détermine la numérotation** : liste `docs/adr/*.md` et prends le **plus petit
   numéro libre**. Sur un projet vierge, `0001`. Sur un projet déjà pourvu d'ADR, tu
   continues la série — tu ne repars jamais de `0001`.

4. **Pour chaque décision structurante**, écris `docs/adr/NNNN-titre-en-kebab-case.md` :
   - **Contexte** — forces en présence, contraintes, et les `FR`/`SC` que la décision
     sert (cités nommément). Un fait qui vient d'une recherche se cite par son fichier,
     `docs/research/AAAA-MM-JJ-slug.md` — et ce qui y portait `[À VÉRIFIER]`,
     `[INCERTAIN]` ou « source unique non recoupée » ne se fige pas ici sans que
     l'utilisateur l'ait explicitement validé ;
   - **Décision** — en **voix active** : « Nous utiliserons X », pas « X pourrait être
     utilisé » ;
   - **Conséquences** — positives **et** négatives ; ce à quoi le code s'engage désormais ;
   - **Alternatives considérées** — au moins une, écartée, avec sa raison.

   **Fais valider le contenu par l'utilisateur** avant de figer le statut « Accepté ».

5. **Boucle la traçabilité** — l'étape que rien d'autre ne rattrape : renseigne la
   colonne « ADR » du tableau « Choix retenus » de `docs/stack.md` avec chaque fichier
   créé. C'est la **seule** édition d'un artefact antérieur de tout le socle ; elle se
   fait par `Edit` ciblé sur les cellules concernées, sans rien réécrire d'autre.

6. **Signale le sort des brouillons promus** : chaque fichier de `_candidates/` devenu un
   ADR est à **supprimer par l'utilisateur** — tu n'as aucun outil pour le faire — sans
   quoi il se représentera en candidat à la prochaine passe. La colonne « ADR » de
   `docs/stack.md` (étape 5) ne concerne que les candidats issus de la Stack : un
   brouillon promu trace vers son origine (le plan de la feature), pas vers le tableau.

7. **Repère les décisions à trace observable** — celles qui laisseront un contrôle
   automatique derrière elles. Une seule question par ADR écrit : *cette décision laisse-t-elle
   une trace dans l'arborescence ou dans les imports ?* « la couche `db/` n'est atteinte que
   par `server/` » → oui ; « nous utiliserons PostgreSQL » → non. Note celles qui répondent oui
   pour les nommer à la fin : `/scd-sdd:ci` relira `docs/adr/` et en dérivera des **invariants
   d'architecture**, informatifs jusqu'à mesure. Tu ne les dérives pas ici, et rien n'est perdu
   si tu en manques une — la phase `ci` repart des fichiers, pas de ta liste.

8. **Relis contre le bloc `<completion>`** de `references/adr.md` — en particulier :
   chaque candidat de la Stack a **exactement un** ADR, et chaque ADR a au moins une
   conséquence négative.

9. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu ne réédites aucun ADR existant, et tu ne changes le statut d'aucun.
- Tu n'installes pas de hook d'immutabilité ADR : c'est de la maintenance, hors du socle
  de création — signale-le comme étape aval.
- Tu ne crées pas d'ADR pour une décision absente de la liste des candidats — Stack ou
  `_candidates/` — sans faire valider l'ajout par l'utilisateur.
- Tu ne supprimes ni ne modifies aucun brouillon de `_candidates/` : promu ou écarté, son
  sort se signale à l'utilisateur, il ne s'exécute pas ici.
- Tu ne modifies rien d'autre dans `docs/stack.md` que la colonne « ADR ».
- Tu ne dérives aucun contrôle de CI et tu n'écris rien dans `docs/ci.md`. Repérer une trace
  observable (étape 7) n'est pas poser un invariant : le formuler ici le figerait dans un
  document immuable, avant même que la phase `ci` ait vu l'écosystème qui doit le rendre.
- Tu ne touches à aucun rapport de `docs/research/` — pas même pour y noter l'ADR qu'il a
  servi. Le lien va de l'ADR vers le rapport, jamais l'inverse : un rapport qui listerait
  ses usages serait un fichier qui croît.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `adr`
- **Résultat** : la plage de numéros écrits · la confirmation du rétro-liage.
  Exemple : `0001..0004 · stack.md rétro-lié`.

## Skill active

- `project-docs` — charge `references/adr.md`.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Liste les ADR créés et confirme, candidat par candidat, que chacun a bien le sien — puis
que la colonne « ADR » de `docs/stack.md` est complète. Nomme enfin ceux qui laissent une
**trace observable** (étape 7), s'il y en a : ce sont les invariants que la phase suivante
ira chercher.

Puis : « `/clear`, puis `/scd-sdd:ci` pour poser les contrôles automatiques — la phase qui
rend déterministe ce que `CLAUDE.md` ne pourra que conseiller, et qui dérivera des ADR
acceptés ce qu'ils imposent au code. »
