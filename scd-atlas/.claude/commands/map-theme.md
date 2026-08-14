---
description: "Ouvre une campagne de recherche sur un THÈME — une question large qui vaut plusieurs sessions Claude Research — au lieu d'un plugin techno : cartographie la question en sujets et les route (research, code ou mixte). Écrit la carte de campagne dans un répertoire nommé, l'artefact d'état qui survit au /clear. Peut s'ancrer dans un dépôt, dont l'état réel rend les sujets concrets, et se borne par l'acquis déjà écrit. Le pipeline s'arrête à l'intake : le livrable est le corpus, pas un skill."
argument-hint: "<répertoire de campagne> [nom du thème]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
disable-model-invocation: true
---

## Contexte

Tu ouvres une campagne de recherche sur un **thème** — *une question large qui vaut plusieurs
sessions Claude Research*. C'est la sœur de `/scd-atlas:map`, qui fait la même chose pour une
techno et son plugin. La sortie est **la carte** : une ligne par sujet, dans le répertoire nommé,
qui porte le routage et l'avancement de toute la campagne à venir.

Un mot de vocabulaire, une fois : un **thème** est la question d'ensemble ; un **sujet** est **une
ligne de carte**, c'est-à-dire une session Research. Un thème se cartographie en sujets.

Trois choses se jouent ici et nulle part ailleurs. **La question** — la phrase qui dira, à chaque
reprise, si un sujet est dedans ou dehors. **Le périmètre** — quels sujets la couvrent, et lesquels
sont déjà couverts par l'acquis, donc ne se rejouent pas. Et **le routage** — ce qui part en Claude
Research, ce qui se collecte en session, ce qui demande les deux. Un routage faux coûte une session
Research entière pour un rapport vide : Research n'atteint ni le code brut, ni les diffs, ni
l'historique, ni une documentation rendue en JavaScript, et il ne construit aucune URL.

Tu es aussi, avec `map`, l'une des deux seules commandes qui **créent des lignes**. Les commandes
suivantes cochent des cases sur les lignes que tu écris ; un sujet que tu oublies n'existera pour
aucune d'elles.

Ratio : 50% humain / 50% AI (tu inventories, tu proposes la liste et le routage ; l'humain tranche
la question, le périmètre et l'acquis).

## Règles absolues

- **Pas de répertoire nommé, pas de campagne.** Le premier argument est le répertoire où la
  campagne vivra. Absent : **arrête-toi**. Ne le dérive pas du nom du thème, ne prends pas le
  répertoire courant, ne propose pas une valeur par défaut. C'est la même garde que le plugin cible
  de `map`, et elle a le même motif : rien ne s'écrit dans un endroit deviné.
- **Tu n'écris que dans ce répertoire.** Jamais dans `scd-atlas`, jamais dans le dépôt d'ancrage,
  jamais ailleurs. Le répertoire peut ne pas exister : tu le crées.
- **L'acquis borne, il ne se juge pas.** Ce que l'humain déclare comme déjà répondu ne reçoit pas de
  ligne. Tu le lis pour te borner — tu ne l'audites pas, tu ne le corriges pas, et tu ne le tiens
  pas pour vrai. Un acquis faux produit un trou de carte, jamais une erreur de fait.
- **L'ancrage se lit, il ne se collecte pas.** Tu ouvres les fichiers du dépôt pour rendre les
  sujets concrets ; tu n'exécutes rien, tu n'interroges aucune API et tu n'écris aucune fiche. La
  collecte est l'étape suivante, et elle a les outils que tu n'as pas.
- **La colonne `Route` n'accepte que trois mots** : `research`, `code`, `mixte`. Pas de « à
  décider » — un sujet non routé est un sujet dont on ne crée pas encore la ligne.
- **Un sujet routable en `code` ne part pas en Research par confort.** La collecte est moins chère
  et surtout exacte ; une session Research coûte environ 15× les tokens d'un chat.
- **La colonne `Distillé` vaut `s.o.` sur toute la carte.** Le pipeline d'un thème s'arrête à
  l'intake : il n'y a ni skill à écrire ni déclenchement à mesurer.
- **Les recherches complémentaires se proposent, jamais en silence.** Ce que le thème appelle et que
  tu n'as pas retenu se dit à l'humain, qui décide.

## Processus

1. **Résous le répertoire de campagne.** `$1` est son chemin. Absent : **arrête-toi** et
   demande-le, sans rien écrire. S'il existe et porte déjà une `carte.md`, c'est une reprise :
   passe à l'étape 4.

2. **Charge le skill `campaign` et sa `references/carte.md`**, intégralement : les deux natures,
   l'en-tête d'un thème, le format, le vocabulaire des cases et la règle de reprise ne se devinent
   pas.

3. **Établis la question, l'ancrage et l'acquis** (`AskUserQuestion`, une question à la fois) :

   - **la question** — le thème en une phrase, celle qui tranchera « dedans / dehors ». `$2` la
     dégrossit s'il est fourni ; elle se reformule quand même avec l'humain, parce que c'est elle
     qui borne tout le reste ;
   - **l'ancrage** — le dépôt ou le projet que la campagne interroge, s'il y en a un. Une question
     purement doctrinale n'en a pas, et c'est légal ;
   - **l'acquis** — les documents qui répondent **déjà** à une part de la question. Propose ce que
     tu trouves (l'ancrage en porte souvent), l'humain complète et tranche.

4. **Reprends une carte existante avant tout le reste.** Si la carte existe déjà, lis-la puis liste
   le répertoire : en cas de désaccord, **le disque gagne**. Une case `—` dont le fichier existe
   passe à `✓`, une case `✓` sans fichier repasse à `—`. Silencieusement — ce n'est pas un
   événement, c'est la carte qui rattrape la réalité. Puis reprends à l'étape 8.

5. **Lis l'ancrage, s'il y en a un** (`Read`, `Glob`). Tu cherches ce qui rend les sujets
   **concrets** plutôt que génériques : ce qui tourne déjà, la stack réelle et ses versions
   installées, la forme du projet, ce que le projet s'est déjà dit. Un thème ancré doit produire des
   sujets qu'on ne poserait pas de la même façon sur un autre dépôt — sinon l'ancrage n'a servi à
   rien.

   **Ce que tu lis est un constat de départ, pas une recommandation.** L'outillage en place est
   précisément ce que la recherche aura à juger.

6. **Lis l'acquis** et dresse la liste de ce qu'il couvre déjà. C'est la borne du périmètre :
   rejouer une session Research pour reconfirmer ce qui est su est une session perdue — la même
   règle que la catégorie `inchangé` d'une campagne de plugin.

7. **Dresse la liste des sujets.** Chacun doit tenir en **une session Research** : une question
   centrale et ses angles connexes. Un sujet qui en contient visiblement deux se propose scindé.

   Trois sources, dans cet ordre : ce que la **question** appelle par elle-même ; ce que l'**ancrage**
   rend nécessaire et qu'on n'aurait pas vu sans lui ; ce que l'**acquis** laisse ouvert — y compris
   ce qu'il déclare lui-même incertain ou daté.

8. **Fais valider le périmètre** (`AskUserQuestion`) : la liste des sujets, et ce que tu as écarté
   comme couvert par l'acquis. C'est le seul moment où le périmètre se discute — après, il se
   complète par un rejeu, jamais par une correction en cours de route.

9. **Route chaque sujet.** Charge `../research-prompter/references/routage-limites.md` du skill
   `research-prompter` et applique-la sujet par sujet :

   - **`research`** — doctrine, état de l'art, comparaisons, controverses, retours d'expérience ;
   - **`code`** — code source, diffs, historique, changelogs bruts, doc rendue en JavaScript,
     métadonnées exactes de paquets, **et l'état du dépôt d'ancrage**. Aucun prompt, aucun rapport :
     `s.o.` dans les deux colonnes ;
   - **`mixte`** — un versant public et un versant vérifiable. Prompt **et** pré-collecte.

   Un thème ancré produit beaucoup de `mixte`, et c'est normal : la doctrine se cherche dehors, son
   applicabilité se vérifie dans le dépôt.

   Un routage qui **ne va pas de soi** reçoit sa note — c'est l'un des deux seuls contenus admis en
   notes, et il évite que la question se rouvre à chaque reprise.

10. **Écris la carte.** Absente : `Write`, en-tête de thème plus table, au format de `carte.md`.
    Présente : `Edit` ciblés, une ligne ajoutée par sujet neuf, **sans toucher à l'en-tête ni aux
    lignes existantes**. Numérotation `NN` sur deux chiffres, slug en kebab-case sans accent : c'est
    de cette ligne que toutes les commandes aval dériveront leurs noms de fichiers.

    Toutes les cases d'une ligne neuve sont à `—`, sauf `Distillé` (`s.o.` toujours) et les `s.o.`
    d'une route `code`. **Tu ne coches rien d'autre que `Route`.**

11. **Propose les recherches complémentaires.** Ce que le thème appelle au-delà de la carte se
    nomme, avec ce qu'il apporterait. L'humain décide ; ce qui est retenu devient une ligne de plus,
    ce qui est écarté ne se tait pas.

## Ce que tu NE fais PAS

- Tu **ne composes aucun prompt**. La composition appartient à `research-prompter`, et elle a sa
  commande (`/scd-atlas:prompts`). Router n'est pas composer.
- Tu **ne collectes rien** — pas de `Bash`, pas de web. Tu n'as pas ces outils, et c'est délibéré :
  la carte se fait sur ce que le disque et l'humain disent, pas sur une exploration.
- Tu **n'écris rien dans le dépôt d'ancrage.** Tu le lis. Il est une source, pas une cible — même
  si le répertoire de campagne se trouve dedans.
- Tu **ne coches aucune case** hors `Route` et les `s.o.` structurels, et tu n'anticipes aucun
  travail aval.
- Tu **n'écris aucun fait du thème étudié** dans la carte. Elle n'est pas une source : les faits
  vivent dans les rapports et les fiches de collecte.
- Tu **ne corriges pas l'acquis**, et tu ne le ré-instruis pas. Ce qu'il dit de faux se signale à
  l'humain ; ça ne devient pas un sujet sans son accord.
- Tu **ne modifies aucun artefact d'une campagne antérieure**, quelle que soit sa nature.

## La carte

Tu es, avec `map`, l'une des deux seules commandes qui **créent** l'en-tête et les lignes :

- l'en-tête porte `Nature : thème`, la question, l'ancrage, la date d'ouverture et l'acquis ;
- une ligne par sujet retenu, `Route` remplie, `Distillé` à `s.o.`, le reste à `—` ;
- une note par routage qui ne va pas de soi.

## Skills actifs

- `campaign` — charge `references/carte.md` **intégralement** (les deux natures, l'en-tête d'un
  thème, format, vocabulaire des cases, reprise). Les autres références de ce skill ne se chargent
  pas ici : ni la doctrine de collecte, ni l'intake, et surtout aucune référence aval — elles sont
  plugin-only.
- `research-prompter` — charge **seulement** `references/routage-limites.md`, à l'étape 9. Ni le
  squelette, ni la fiche de contexte, ni aucun pack de domaine : tu ne composes pas.

## À la fin

Affiche **la carte telle qu'écrite**, et sépare ce qui part en Research de ce qui se collecte :
c'est le seul moment où le routage se corrige à peu de frais. Affiche aussi ce que l'acquis a
écarté — ce qui n'est pas rejoué doit être vu, sinon il passe pour oublié.

Rappelle ce que la carte laisse ouvert : toute case est à `—` tant que le fichier n'est pas sur le
disque, et **le disque gagne** à chaque reprise. Rappelle aussi où s'arrête le pipeline : à
l'intake. Le livrable est le **corpus** — rapports, fiches de collecte, liste de comblement
refermée. Ce que le dépôt en fait ensuite n'appartient pas à la campagne.

Puis : « `/clear`, puis `/scd-atlas:collect` — la pré-collecte fournit les URL exactes, les versions
et les extraits du dépôt d'ancrage qui descendront *dans* les prompts. Un prompt composé sans elle
contiendra des URL devinées, qui n'existent pas. »
