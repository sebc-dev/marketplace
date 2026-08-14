---
description: "Étape 1 d'une campagne : cartographie les sujets d'un plugin techno et les route — research, code ou mixte. Produit la carte de campagne dans le plugin cible, l'artefact d'état qui survit au /clear. En mise à jour, différencie l'existant en quatre catégories (inchangé, touché, apparu, disparu) et ne rejoue pas ce qui n'a pas bougé. Seule commande qui crée des lignes de carte."
argument-hint: "<plugin-cible> [nom-de-campagne]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
disable-model-invocation: true
---

## Contexte

Tu ouvres une campagne. La sortie est **la carte** : une ligne par sujet, dans le plugin cible,
qui porte le routage et l'avancement de toute la campagne à venir.

Deux choses se jouent ici et nulle part ailleurs. **Le périmètre** — quels sujets couvrent la
techno, et lesquels ne se rejouent pas parce qu'ils n'ont pas bougé. Et **le routage** — ce qui
part en Claude Research, ce qui se collecte en session, ce qui demande les deux. Un routage faux
coûte une session Research entière pour un rapport vide : Research n'atteint ni le code brut, ni
les diffs, ni l'historique, ni une documentation rendue en JavaScript, et il ne construit aucune
URL.

Tu es aussi la **seule commande qui crée des lignes**. Les cinq suivantes cochent des cases sur
les lignes que tu écris ; un sujet que tu oublies n'existera pour aucune d'elles.

Ratio : 50% humain / 50% AI (tu inventories, tu proposes la liste et le routage ; l'humain
tranche le périmètre et le nom de la campagne).

## Règles absolues

- **Pas de plugin cible nommé, pas de campagne.** Le premier argument est le répertoire du
  plugin. Absent, ou introuvable sur le disque : **arrête-toi**. Ne devine pas, ne prends pas
  « le dernier plugin touché », ne propose pas une valeur par défaut.
- **Une cible qui n'est pas un plugin n'est pas ton affaire.** Un répertoire sans
  `.claude-plugin/plugin.json`, une question large sans plugin à produire : **arrête-toi** et
  renvoie vers `/scd-atlas:map-theme`, qui ouvre une campagne de thème. Tu ne l'accueilles pas en
  élargissant ta précondition.
- **Tu n'écris que dans le plugin cible**, sous `docs/researchs/`. Jamais dans `scd-atlas`,
  jamais ailleurs.
- **Une campagne ne modifie jamais les artefacts d'une campagne antérieure.** Tu les lis pour te
  différencier ; tu n'en renommes, n'en déplaces et n'en supprimes aucun — pas même pour les
  mettre à la convention `NN-slug`.
- **Rejouée, tu ajoutes et tu ne retires pas.** Aucune ligne supprimée, aucune case remise à `—`
  autrement que par le rattrapage du disque, aucun en-tête réécrit.
- **La colonne `Route` n'accepte que trois mots** : `research`, `code`, `mixte`. Pas de « à
  décider » — un sujet non routé est un sujet dont on ne crée pas encore la ligne.
- **Un sujet routable en `code` ne part pas en Research par confort.** La collecte est moins
  chère et surtout exacte ; une session Research coûte environ 15× les tokens d'un chat.
- **Les recherches complémentaires se proposent, jamais en silence.** Ce que le sujet appelle et
  que tu n'as pas retenu se dit à l'humain, qui décide.

## Processus

1. **Résous le plugin cible.** `$1` est son répertoire. Absent ou inexistant : **arrête-toi** et
   demande-le, sans rien écrire. Vérifie qu'il porte bien un `.claude-plugin/plugin.json` — **toi**,
   tu vises un plugin, pas un répertoire quelconque. S'il n'en porte pas, ou si ce qu'on cherche est
   une question large et non un plugin à produire : renvoie vers `/scd-atlas:map-theme` et
   arrête-toi.

2. **Charge le skill `campaign` et sa `references/carte.md`**, intégralement : l'emplacement des
   artefacts, le format, le vocabulaire des cases et la règle de reprise ne se devinent pas.

3. **Inventorie le plugin cible** (`Glob`, `Read`) : ses skills et leurs références, la présence
   et le contenu de `docs/researchs/`, les sous-répertoires de campagne, la date du dernier
   rapport. Cet inventaire tranche le mode.

   **Création** — aucun rapport nulle part. La campagne s'écrit à la racine de `docs/researchs/`.

   **Mise à jour** — le plugin porte déjà des rapports. La racine est **déjà une campagne**, même
   si aucune carte ne l'accompagne (les campagnes jouées à la main n'en ont pas). La nouvelle
   campagne reçoit donc un **sous-répertoire**, dont le nom vient de `$2` ou se demande à
   l'humain : ce qui la motive, pas une date (`v7`, `securite`, `cloudflare`).

4. **Reprends une carte existante avant tout le reste.** Si la carte du répertoire courant existe
   déjà, lis-la puis liste le répertoire : en cas de désaccord, **le disque gagne**. Une case `—`
   dont le fichier existe passe à `✓`, une case `✓` sans fichier repasse à `—`. Silencieusement —
   ce n'est pas un événement, c'est la carte qui rattrape la réalité. Puis reprends à l'étape 7.

5. **Dresse la liste des sujets.**

   En **création**, elle part du domaine : ce qui couvre la technologie pour quelqu'un qui la
   pratique — architecture, modèles de rendu, données, tests, déploiement, sécurité, outillage…
   Le précédent est la carte à 18 sujets de `scd-astro`.

   En **mise à jour**, l'inventaire passe avant : différencie l'existant en **quatre catégories**
   — inchangé, touché, apparu, disparu (la table est dans le `SKILL.md`). **Cette
   différenciation est le livrable de l'étape**, et un sujet `inchangé` ne reçoit pas de ligne :
   rejouer une session Research pour reconfirmer ce qui n'a pas bougé est une session perdue.

6. **Fais valider le périmètre** (`AskUserQuestion`) : la liste des sujets, et en mise à jour la
   catégorie de chacun. C'est le seul moment où le périmètre se discute — après, il se complète
   par un rejeu, jamais par une correction en cours de route.

7. **Route chaque sujet.** Charge `../research-prompter/references/routage-limites.md` du skill
   `research-prompter` et applique-la sujet par sujet :

   - **`research`** — écosystème, comparaisons, doctrine, état de l'art, controverses ;
   - **`code`** — code source, diffs, historique, changelogs bruts, doc rendue en JavaScript,
     métadonnées exactes de paquets. Aucun prompt, aucun rapport : `s.o.` dans les deux colonnes ;
   - **`mixte`** — un versant public et un versant vérifiable. Prompt **et** pré-collecte.

   Un routage qui **ne va pas de soi** reçoit sa note — c'est l'un des deux seuls contenus admis
   en notes, et il évite que la question se rouvre à chaque reprise.

8. **Écris la carte.** Absente : `Write`, en-tête plus table, au format de `carte.md`. Présente :
   `Edit` ciblés, une ligne ajoutée par sujet neuf, **sans toucher à l'en-tête ni aux lignes
   existantes**. Numérotation `NN` sur deux chiffres, slug en kebab-case sans accent : c'est de
   cette ligne que toutes les commandes aval dériveront leurs noms de fichiers.

   Toutes les cases d'une ligne neuve sont à `—`, sauf les `s.o.` d'une route `code`. **Tu ne
   coches rien d'autre que `Route`** : les autres colonnes appartiennent aux commandes qui font
   le travail.

9. **Propose les recherches complémentaires.** Ce que le sujet appelle au-delà de la carte — une
   comparaison d'écosystème, une veille de gouvernance, une question de sécurité transverse — se
   nomme, avec ce qu'elle apporterait. L'humain décide ; ce qui est retenu devient une ligne de
   plus, ce qui est écarté ne se tait pas.

## Ce que tu NE fais PAS

- Tu **ne composes aucun prompt**. La composition appartient à `research-prompter`, et elle a sa
  commande (`/scd-atlas:prompts`). Router n'est pas composer.
- Tu **ne collectes rien** — pas de `Bash`, pas de web. Tu n'as pas ces outils, et c'est délibéré :
  la carte se fait sur ce que le disque et l'humain disent, pas sur une exploration.
- Tu **ne coches aucune case** hors `Route`, et tu n'anticipes aucun travail aval.
- Tu **n'écris aucun fait du domaine étudié** dans la carte. Elle n'est pas une source : les
  faits vivent dans les rapports, les fiches de collecte et le skill produit.
- Tu **ne renommes ni ne réorganises** les artefacts d'une campagne antérieure, même s'ils
  suivent une autre convention. La convention vaut pour la campagne courante.
- Tu **ne touches pas au skill cible** ni à ses références. La distillation vient six étapes plus
  loin.
- Tu **ne publies rien** — ni `marketplace.json`, ni `publish.json`, ni `/publish`.

## La carte

Tu es la seule commande qui **crée** l'en-tête et les lignes :

- l'en-tête porte le mode, la cible et sa version visée, la date d'ouverture, les campagnes
  antérieures ;
- une ligne par sujet retenu, `Route` remplie, le reste à `—` ou `s.o.` ;
- une note par routage qui ne va pas de soi.

## Skills actifs

- `campaign` — charge `references/carte.md` **intégralement** (emplacement, format, vocabulaire
  des cases, reprise). Les autres références de ce skill ne se chargent pas ici.
- `research-prompter` — charge **seulement** `references/routage-limites.md`, à l'étape 7. Ni le
  squelette, ni la fiche de contexte, ni aucun pack de domaine : tu ne composes pas.

## À la fin

Affiche **la carte telle qu'écrite**, et sépare ce qui part en Research de ce qui se collecte :
c'est le seul moment où le routage se corrige à peu de frais. En mise à jour, affiche aussi les
sujets classés `inchangé` — ce qui n'est pas rejoué doit être vu, sinon il passe pour oublié.

Rappelle ce que la carte laisse ouvert : toute case est à `—` tant que le fichier n'est pas sur
le disque, et **le disque gagne** à chaque reprise.

Puis : « `/clear`, puis `/scd-atlas:collect` — la pré-collecte fournit les URL exactes et les
versions qui descendront *dans* les prompts. Un prompt composé sans elle contiendra des URL
devinées, qui n'existent pas. »
