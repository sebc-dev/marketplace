# Référence — la carte, l'artefact d'état d'une campagne

Chargée par `campaign` à **chaque étape** du pipeline. Elle dit où vivent les artefacts, quelle
forme a la carte, ce que chaque case veut dire, et comment on reprend une campagne après un
`/clear`. La méthode d'orchestration est dans le `SKILL.md` et ne se recopie pas ici.

- [Les deux natures d'une campagne](#les-deux-natures-dune-campagne)
- [Un répertoire est une campagne](#un-répertoire-est-une-campagne)
- [Le format](#le-format)
- [Le vocabulaire des cases](#le-vocabulaire-des-cases)
- [Les notes par sujet](#les-notes-par-sujet)
- [Créer, mettre à jour, reprendre](#créer-mettre-à-jour-reprendre)
- [Ce que la carte n'est pas](#ce-que-la-carte-nest-pas)

## Les deux natures d'une campagne

Une campagne vise **un plugin** ou **un thème**. La nature est un fait de l'en-tête, et c'est tout ce
dont les commandes aval ont besoin : elles résolvent la campagne par la carte trouvée sur le disque.

| Nature | Ce qu'on vise | Ouverte par | Livrable |
|---|---|---|---|
| **plugin** | une techno, pour créer ou mettre à jour un plugin | `/scd-atlas:map` | le skill distillé et ses références |
| **thème** | une question large qui vaut plusieurs sessions Research | `/scd-atlas:map-theme` | le **corpus** : rapports, fiches de collecte, liste de comblement refermée |

**Un thème se cartographie en sujets**, exactement comme une techno — un *sujet* reste une **ligne de
carte**, quelle que soit la nature. Ce qui change tient en trois points, et trois seulement :

- **la cible** — un plugin porte un `plugin.json` et impose l'emplacement de ses artefacts ; un thème
  vise un **répertoire nommé**, dans n'importe quel dépôt ;
- **le périmètre** — un plugin se différencie de ses campagnes antérieures en quatre catégories
  (mode `mise à jour`) ; un thème se borne par son **acquis** (voir l'en-tête) ;
- **l'aval** — le pipeline d'un thème **s'arrête à l'intake**. `distill` et `evals` sont sans objet :
  il n'y a ni skill à écrire ni déclenchement à mesurer, et la colonne `Distillé` vaut `s.o.` sur
  toute la carte.

Tout le reste est identique et ne se ré-invente pas : le routage en trois routes, le format
ci-dessous, le vocabulaire des cases, la règle *le disque gagne*, l'idempotence de chaque étape.

## Un répertoire est une campagne

Pour une campagne **de plugin**, tous les artefacts vivent **dans le plugin cible**, sous
`docs/researchs/` — précédent `scd-astro/docs/researchs/`, dont le sous-dossier `v6/` est le
précédent exact d'une campagne de mise à jour.

Pour une campagne **de thème**, ils vivent dans le **répertoire nommé à l'ouverture** — celui-là et
aucun autre. Il ne se devine pas : sans répertoire nommé, la campagne ne démarre pas, exactement
comme une campagne de plugin sans plugin nommé.

```
<plugin-cible>/docs/researchs/[<campagne>/]
  carte.md              # l'état — une ligne par sujet
  collecte/NN-slug.md   # une fiche de pré-collecte par sujet : URL vérifiées, versions, extraits
  prompts/NN-slug.md    # un prompt prêt à jouer dans Desktop
  NN-slug.md            # le rapport revenu, déposé par l'humain
```

La **première** campagne d'un plugin s'écrit à la racine de `docs/researchs/` ; chacune des
suivantes reçoit son sous-répertoire, nommé par ce qui la motive (`v6`, `astro-7`, `securite`). La
règle tient en une phrase : **la carte est à la racine de son répertoire, et ce répertoire est la
campagne.**

Deux conséquences qui ne se négocient pas :

- **une campagne ne modifie jamais les artefacts d'une campagne antérieure.** Elle les lit pour se
  différencier ; un sujet rejoué reçoit un rapport neuf dans le répertoire courant, l'ancien reste
  en l'état ;
- **le nom d'un fichier se dérive de la ligne de carte** — `NN` sur deux chiffres, `slug` en
  kebab-case sans accent. Un plugin repris dont les anciens rapports suivent une autre convention ne
  se renomme pas : la convention s'applique aux fichiers de la campagne courante, pas
  rétroactivement.

## Le format

Un en-tête écrit une fois, une table, et — seulement si un sujet l'appelle — des notes. **La table
est la même dans les deux natures** ; seul l'en-tête diffère.

Campagne **de plugin** :

```markdown
# Carte de campagne — <plugin cible>

**Nature** : plugin · **Mode** : création | mise à jour · **Cible** : <techno et version visée> ·
**Ouverte le** : AAAA-MM-JJ · **Campagnes antérieures** : <répertoires, ou « aucune »>

| # | Sujet | Route | Collecte | Prompt | Rapport | Comblé | Distillé |
|---|---|---|---|---|---|---|---|
| 01 | Architecture | research | ✓ | ✓ | ✓ | ✓ | ✓ |
| 02 | Bindings Cloudflare | mixte | ✓ | ✓ | ✓ | — | — |
| 03 | Changelog v7 | code | ✓ | s.o. | s.o. | ✓ | — |
```

Campagne **de thème** :

```markdown
# Carte de campagne — <thème>

**Nature** : thème · **Question** : <le thème en une phrase> ·
**Ancrage** : <le dépôt ou le projet que la campagne interroge, ou « aucun »> ·
**Ouverte le** : AAAA-MM-JJ · **Acquis** : <documents qui répondent déjà, ou « aucun »>

| # | Sujet | Route | Collecte | Prompt | Rapport | Comblé | Distillé |
|---|---|---|---|---|---|---|---|
| 01 | Modes de defaillance du code genere | research | ✓ | ✓ | ✓ | ✓ | s.o. |
| 02 | Outillage reel du depot | code | ✓ | s.o. | s.o. | — | s.o. |
```

Les trois faits propres à un thème ne se dérivent d'aucun fichier, d'où leur place dans l'en-tête :

- **`Question`** — le thème en une phrase. C'est elle qui dit si un sujet proposé est dedans ou
  dehors, et elle ne se re-négocie pas à chaque reprise ;
- **`Ancrage`** — le dépôt que la campagne interroge, quand elle en a un. Il rend les sujets
  **concrets** (l'outillage réel, la stack réelle) au lieu de génériques, et c'est un **canal de
  collecte de premier rang** (`collecte.md`). Une campagne de thème peut n'avoir aucun ancrage : la
  question est alors purement doctrinale ;
- **`Acquis`** — les documents qui répondent **déjà** à une part de la question. Ce qu'ils couvrent
  ne reçoit pas de ligne : rejouer une session Research pour reconfirmer ce qui est su est une
  session perdue, et c'est la même règle que la catégorie `inchangé` d'une mise à jour. L'acquis est
  **déclaratif** — la campagne le lit pour se borner, elle ne l'audite pas et ne le tient pas pour
  vrai.

Le **mode** `création | mise à jour` est **propre à la nature `plugin`** : un thème n'a pas de skill
existant à différencier, il a un acquis.

La colonne `Route` n'accepte que le vocabulaire de `routage-limites.md` : **`research`**, **`code`**,
**`mixte`**. Rien d'autre — pas de « à décider », qui est l'absence de routage et se traite en ne
créant pas encore la ligne.

## Le vocabulaire des cases

Trois valeurs, et trois seulement.

| Valeur | Sens |
|---|---|
| `—` | à faire |
| `✓` | fait **et constaté sur le disque** |
| `s.o.` | sans objet pour cette route |

Il n'y a pas de case « en cours » : un travail en cours est un travail à faire. Pas de pourcentage,
pas de date dans une case — la carte croît avec les sujets, jamais avec le temps.

| Colonne | Remplie par | `✓` signifie |
|---|---|---|
| Route | `map` | le sujet est routé ; le motif est en note s'il ne va pas de soi |
| Collecte | `collect` | `collecte/NN-slug.md` existe et porte au moins une URL vérifiée ou une version exacte |
| Prompt | `prompts` | `prompts/NN-slug.md` existe et a passé la checklist de `squelette.md` |
| Rapport | constaté par `intake` | `NN-slug.md` existe dans le répertoire de campagne |
| Comblé | `intake` | la liste de comblement du sujet est vide, ou refermée |
| Distillé | `distill` | le sujet est écrit dans le skill cible ou dans une de ses références |

`s.o.` a **deux cas légaux, et deux seulement** :

- **`Prompt` et `Rapport`, pour une route `code`** — un sujet routé `code` ne reçoit aucun prompt
  Research et n'attend aucun rapport. Pour lui, `Collecte` et `Comblé` portent tout le poids : c'est
  la collecte qui tient lieu de source ;
- **`Distillé`, sur toute la carte d'une campagne de thème** — le pipeline s'y arrête à l'intake. La
  colonne **ne disparaît pas** : les commandes lisent la table par nom de colonne, et une table à
  géométrie variable les ferait deviner.

Partout ailleurs, `s.o.` est une case mal remplie.

## Les notes par sujet

Deux choses, et deux seulement, ont ici leur domicile — ce sont celles qu'aucun fichier ne dérive :

- **le motif d'un routage qui ne va pas de soi** — pourquoi ce sujet part en `code` alors qu'il
  ressemble à du `research`, ou l'inverse ;
- **la liste de comblement ouverte par l'intake** — ce que le rapport signale lui-même comme
  incertain, tronqué ou manquant, une ligne par trou, cochée quand la collecte l'a comblé.

```markdown
## Notes

### 02 — Bindings Cloudflare
- **Routage** : mixte — la doctrine d'usage est publique, les signatures se lisent dans les types.
- **Comblement** :
  - [x] la liste exacte des bindings de la v4 — collectée par `gh api`, extrait dans la fiche.
  - [ ] les limites de taille par binding — le rapport les donne sans citation.
```

Un sujet sans note n'a pas de section. Rien d'autre n'entre dans les notes : ni compte rendu de
session, ni journal, ni date, ni décision de fond — une décision se prend, s'écrit dans le skill
cible, et se justifie dans un rapport.

## Créer, mettre à jour, reprendre

**Créer.** Seules les deux commandes d'ouverture écrivent l'en-tête et créent des lignes — `map`
pour un plugin, `map-theme` pour un thème. Rejouée sur une carte existante, l'une comme l'autre
**ajoute** les sujets manquants : elle ne retire aucune ligne, ne remet aucune case à `—`, et ne
réécrit pas l'en-tête.

**Mettre à jour.** Chaque commande édite les lignes des sujets qu'elle vient de traiter, une par
une. Une case passe à `✓` **après** constat sur le disque, jamais en même temps que l'action, et
jamais par anticipation.

**Reprendre après un `/clear`.** Lire la carte, puis lister le répertoire de campagne. En cas de
désaccord, **le disque gagne** : une case `—` dont le fichier existe passe à `✓`, une case `✓` sans
fichier repasse à `—`. Cette remise à niveau est silencieuse — ce n'est pas un événement à
journaliser, c'est la carte qui rattrape la réalité.

Un rapport déposé par l'humain est exactement ce cas : rien ne l'annonce, seule sa présence le dit.

## Ce que la carte n'est pas

- **Pas un journal** — elle croît avec les sujets, pas avec le temps. Aucune ligne ne s'y ajoute
  parce qu'une session a eu lieu.
- **Pas un plan** — ni date prévisionnelle, ni assignation, ni ordre imposé entre sujets.
- **Pas une source** — aucun fait du domaine étudié ne s'y écrit. Les faits sont dans les rapports,
  les fiches de collecte et le skill produit.
- **Pas un artefact de `scd-atlas`** — elle vit dans la cible nommée, plugin ou répertoire de thème,
  et n'en sort jamais.
