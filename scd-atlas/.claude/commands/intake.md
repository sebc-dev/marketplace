---
description: "Étape 4 d'une campagne : relit en critique les rapports Claude Research déposés par l'humain, tranche affirmation par affirmation ce qui sera repris, ouvre la liste de comblement du sujet dans la carte, puis comble par les canaux d'une session Claude Code. Un rapport est une source de plus, pas un acquis : la liste s'écrit avant toute collecte, et un trou qu'aucun canal ne comble se déclare irréductible plutôt que de disparaître. Étape terminale d'une campagne de thème, dont le livrable est le corpus."
argument-hint: "[cible] [campagne] [-- NN du sujet]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - Bash
  - WebSearch
  - WebFetch
disable-model-invocation: true
---

## Contexte

Tu es de l'autre côté de la charnière humaine : les rapports sont revenus, déposés en
`NN-slug.md` à la racine du répertoire de campagne. Rien ne te l'a annoncé — seule leur présence
le dit.

Tu produis deux choses, et dans cet ordre. **La liste de comblement** d'abord : ce que le rapport
ne porte pas, ligne par ligne, dans les notes de la carte. **Le comblement** ensuite : ce qu'une
session Claude Code va chercher là où Research n'est pas allé, écrit dans la fiche de collecte du
sujet.

Un rapport Research revient long, structuré, sourcé et sûr de lui — c'est exactement ce qui rend
la relecture nécessaire. Ce qui n'est pas trié ici descendra tel quel dans l'aval — le skill cible
pour une campagne de plugin, l'usage qu'on fera du corpus pour une campagne de thème —, avec son
assurance et sans ses réserves.

Ratio : 20% humain / 80% AI (lecture et collecte mécaniques ; l'humain relit les irréductibles,
seuls trous qu'on renonce à combler).

## Règles absolues

- **Un rapport est une source de plus, pas un acquis.** Ce qui ne se reprend pas est **nommé et
  isolé**, jamais fondu dans le reste.
- **La liste précède la collecte.** Toutes les lignes d'un sujet s'ouvrent, **puis** on collecte.
  Collecter au fil de la lecture produit des trous jamais écrits, donc jamais refermés — et une
  session suivante ne saura pas qu'ils existaient.
- **Le rapport ne se corrige pas.** C'est un artefact committé en l'état : on ne l'édite pas, on ne
  le complète pas, on n'y annote aucun verdict. Ce qu'on trouve après lui vit dans la fiche de
  collecte, ce qu'on juge dans la liste de comblement, ce qu'on retient dans le skill cible.
- **Un désaccord entre sources réputées se transmet, il ne se tranche pas.** Le trancher en silence
  produit une assurance que rien ne soutient.
- **Un rapport absent n'est pas un échec, et il ne se fabrique jamais.** Tu constates ce qui est sur
  le disque ; tu n'attends aucun rapport en session.
- **Une limite irréductible se déclare deux fois** — la ligne se coche en le disant, et la limite
  descend là où quelqu'un irait la chercher. Un trou connu écrit nulle part se comble par une
  invention au premier usage.
- **Tu ne coches qu'après constat sur le disque.** `Rapport` sur la présence du fichier, `Comblé`
  sur l'état de la liste, jamais sur une intention.

## Processus

1. **Résous la campagne.** `$1` est la cible — un **plugin**, ou directement le **répertoire de
   campagne** d'un thème —, `$2` le sous-répertoire de campagne. Un `$1` qui porte une `carte.md`
   *est* la campagne. Absents : cherche les cartes existantes (`*/docs/researchs/**/carte.md`).
   Une seule : prends-la. Zéro ou plusieurs : **arrête-toi** et demande. Carte absente : renvoie
   vers `/scd-atlas:map` ou `/scd-atlas:map-theme` selon ce que la cible est.

   **Lis la nature dans l'en-tête** : elle ne change ni les sept passes, ni les trois verdicts, ni
   la liste de comblement — elle décide seulement où descend un irréductible (étape 9) et ce qui
   vient après toi (`## À la fin`).

2. **Charge le skill `campaign`**, sa `references/carte.md` et sa **`references/intake.md`**
   intégralement — les sept passes, les trois verdicts, la forme de la liste et la clôture par
   *irréductible* s'y lisent. **Ne charge pas encore `collecte.md`** : la doctrine de canaux se
   charge à l'étape 7, quand la liste est écrite. L'ordre est mécanique, pas seulement prescrit.

3. **Reprends la carte contre le disque.** Liste le répertoire de campagne : une case `Rapport` à
   `—` dont le `NN-slug.md` existe passe à `✓`, une case `✓` sans fichier repasse à `—`.
   Silencieusement — la carte rattrape la réalité, ce n'est pas un événement.

4. **Sélectionne les sujets.** Case `Comblé` à `—`, et de la matière à lire : un rapport présent
   pour une route `research` ou `mixte`, **une fiche de collecte pour une route `code`**. Un sujet
   `code` passe l'intake comme les autres — il n'a ni prompt ni rapport, sa fiche tient lieu de
   source, et sa section « ce qui a échoué » tient lieu de section caveats. Un `NN` en argument
   restreint à ce seul sujet.

5. **Lis le rapport en critique**, sujet par sujet : les **sept passes** de `intake.md`, dans leur
   ordre — marqueurs, caveats et angles morts, désaccords ouverts, affirmations sans citation,
   classes de preuve, sources qui se citent l'une l'autre, péremption et versions. Puis la passe
   hors table, celle qu'on oublie : **relis `prompts/NN-slug.md` à côté du rapport** et cherche ce
   que le prompt demandait et que le rapport ne traite pas. Un angle silencieusement sauté ne
   laisse aucun marqueur.

6. **Tranche les affirmations à enjeu** — celles qui seront reprises en aval, ou qui commandent une
   décision. Trois verdicts, et trois seulement : *repris*, *repris avec réserve
   nommée*, *non repris*. Un *non repris* est clos, son motif s'écrit une fois : il n'ouvre pas de
   ligne de comblement. Ce qui ouvre une ligne, c'est un fait dont on a **besoin** et que le
   rapport n'établit pas.

7. **Écris la liste de comblement entière** dans les notes de la carte, sous la section du sujet,
   **avant d'ouvrir le moindre canal**. Une ligne utile nomme trois choses : ce qui manque, le
   canal qui le donnerait, et ce que ça change si le trou reste ouvert.

8. **Puis seulement, charge `references/collecte.md`** et comble. Le canal se choisit par l'objet
   visé, jamais par habitude ; `gh auth status` avant tout appel GitHub, et `curl` plutôt que
   `WebFetch` dès que le contenu doit être exact. Le contenu obtenu va dans la **fiche de collecte**
   du sujet, qui sert de cache ; la ligne, elle, se **coche** avec quelques mots — elle ne se
   réécrit pas.

9. **Déclare les irréductibles.** Un trou est irréductible quand aucun canal ne le donne : la
   mesure n'existe pas publiquement, la source est privée, le fait n'est pas arrêté par l'éditeur.
   Coche la ligne en le disant, puis fais descendre la limite **là où quelqu'un ira la chercher** :

   - campagne de **plugin** — dans le **skill cible**. C'est la seule chose que l'intake y fait
     descendre, une limite et jamais un fait. Si le skill n'existe pas encore (campagne de
     création), laisse la ligne cochée et **marquée `irréductible`** : c'est `/scd-atlas:distill`
     qui la fera descendre, et il la trouvera là ;
   - campagne de **thème** — dans la **note du sujet** et dans sa **fiche de collecte**, section
     « ce qui a échoué ». Il n'y a pas d'aval qui la perdrait : le corpus est le livrable, et une
     limite écrite nulle part se comble par une invention au premier usage.

10. **Coche `Comblé`** quand **chaque ligne du sujet est cochée ou déclarée irréductible** — jamais
    parce qu'on a arrêté de chercher.

## Ce que tu NE fais PAS

- Tu **ne distilles pas**. Décider où une affirmation retenue s'écrit dans le skill cible appartient
  à `/scd-atlas:distill`. Tu tranches ce qui est vrai ; lui tranche ce qui est dit.
- Tu **n'édites aucun rapport**, y compris ce qu'il dit de faux : c'est ce qu'une campagne
  ultérieure lira pour se différencier.
- Tu **ne répares pas un rapport inexploitable** — hors sujet, tronqué, sans citation. Le sujet se
  **rejoue** avec un prompt révisé, dans le répertoire de la campagne ; tu le signales, tu ne le
  réécris pas.
- Tu **ne composes aucun prompt** et tu ne crées aucune ligne de carte.
- Tu **ne modifies aucun artefact d'une campagne antérieure**.
- Tu **n'écris rien dans le skill cible** — hors la seule limite irréductible de l'étape 9.
- Tu **ne contournes ni authentification, ni paywall, ni `robots.txt`**, et tu ne forces aucun quota.
- Tu **ne publies rien** — ni `marketplace.json`, ni `publish.json`, ni `/publish`.

## La carte

Tu touches **deux colonnes, et elles ne se valent pas**. `Rapport` est un **constat** : le fichier
est là parce que l'humain l'a déposé, et la case relève du rattrapage du disque de l'étape 3, pas
de ton travail. `Comblé` est la seule que ton travail produit, et elle ne passe à `✓` qu'une fois
chaque ligne cochée ou irréductible.

Tu écris aussi les **notes de comblement** — l'un des deux seuls contenus admis en notes. Tu ne
touches ni à `Route`, ni à `Collecte`, ni à `Prompt`, ni à `Distillé`.

## Skills actifs

- `campaign` — `references/intake.md` **intégralement** dès l'ouverture, `references/carte.md` pour
  le format et la reprise, et `references/collecte.md` **seulement à l'étape 8**, jamais avant : le
  chargement tardif est ce qui rend l'ordre mécanique. `distillation.md`, `appairage-doc.md` et
  `evals.md` **ne se chargent pas ici**.
- **Pas de `research-prompter`.** Le vocabulaire des deux axes de preuve est rappelé dans
  `intake.md` — tu vérifies qu'il a été appliqué, tu ne le redéfinis pas —, et le composeur n'a rien
  à dire sur un rapport revenu.

## À la fin

Affiche, sujet par sujet : ce qui est **repris**, ce qui est **repris avec réserve** (avec la
réserve), ce qui est **non repris** (avec le motif), puis l'état de la liste de comblement — ce qui
a été refermé et par quel canal, ce qui reste ouvert.

Nomme séparément les **irréductibles**. C'est le seul moment où l'humain peut contester qu'on
renonce à un trou, et où il peut dire par quel canal privé il le comblerait.

Liste ce qui n'a pas été traité et pourquoi : rapport non revenu — ce n'est pas un échec, c'est une
étape humaine qui n'a pas eu lieu —, rapport inexploitable à rejouer, sujet sans fiche.

Puis, selon la **nature** de la campagne :

- **plugin** — « `/clear`, puis `/scd-atlas:distill` — qui écrit le skill cible à partir de ce qui
  vient d'être retenu. Un sujet dont la liste de comblement est encore ouverte ne se distille
  pas. » ;
- **thème** — **tu es la dernière étape.** Le livrable est le **corpus** : les rapports, les fiches
  de collecte et les listes de comblement refermées. Dis-le, et dis ce qui reste ouvert — un sujet
  sans rapport, une liste non refermée. Ne renvoie **pas** vers `/scd-atlas:distill` : il n'y a ni
  skill à écrire ni déclenchement à mesurer, et il s'arrêterait. Ce que le dépôt fait ensuite du
  corpus n'appartient pas à la campagne.
