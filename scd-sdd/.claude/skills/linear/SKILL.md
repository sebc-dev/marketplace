---
name: linear
description: |
  La CAPACITÉ DE MIROIR LINEAR transverse, OPT-IN : ce que le dépôt sait déjà —
  features, lots Rn, fiches de chantier — est POUSSÉ vers un workspace Linear, où
  l'équipe fait sa priorisation. Granularité produit (configuré au setup) →
  initiative · feature → projet · lot Rn → issue (tâches Tn en checklist,
  dépendances en relations) · fiche → issue labellisée. Clé dérivée du nom de
  fichier, idempotence, propriété des champs, pilotage en lecture seule, accroche
  PR best-effort, contrat de docs/linear.md. Sens STRICTEMENT unique : rien de ce
  qui vit chez Linear ne redescend jamais dans les fichiers, qui restent la
  source de vérité. Se charge pendant /scd-sdd:linear, linear-setup et
  linear-review, et pour le seul agent pr-describer, qui lit references/api.md
  (accroche PR, §D31) — JAMAIS ailleurs. Ne joue aucune phase et n'en bloque
  aucune : un projet sans docs/linear.md ne voit strictement aucun changement.
---

# Miroir Linear — `docs/linear.md`

## Pourquoi une capacité, et pas une phase

Une phase se joue **une fois, dans un ordre imposé**, et laisse un artefact dont l'état se dérive.
Le miroir se joue **quand l'humain le décide**, autant de fois qu'il veut, et ne laisse **aucun
artefact** dans le dépôt : son résultat vit chez Linear.

Trois conséquences, toutes **de nature** et jamais discrétionnaires :

- **Aucune ligne de journal.** Le miroir ne produit aucun fait non dérivable : son résultat est
  interrogeable chez Linear, et la vue de `linear-review` meurt avec la session. Le `## Consigne au
  journal` des trois commandes existe quand même, pour dire qu'elles n'écrivent rien et pourquoi.
- **Aucun état dérivé.** `docs/linear.md` n'apparaît dans **aucune** table d'état de `status` : l'y
  faire figurer ferait croire à une phase, et un projet sans miroir n'est pas un projet incomplet.
- **Aucune accroche qui pousse.** Aucune phase ne pousse le miroir : une accroche l'aurait suspendue
  à un service tiers, et fait payer une lecture aux projets sans workspace. L'**accroche PR**
  (§D31) n'en est pas une — une ligne dans un artefact déjà sortant, restriction **nommée** de §D30.

**L'opt-in est un fichier** : `docs/linear.md` existe → le miroir existe — l'état dérivé du système
de fichiers, jamais un champ à maintenir (charte §5). Ce fichier est légal au même titre que
`docs/ci.md` : une configuration bornée, arbitrée une fois par l'humain, que rien d'autre ne porte.

## La granularité — quatre objets

| Fichier | Objet Linear | Ce qui porte l'état |
|---|---|---|
| le produit — **configuré au setup**, rubrique 7 optionnelle | **initiative** | — (elle appartient à l'humain) |
| feature `specs/NNN-slug/` | **projet** — rattaché à l'initiative si configurée | — (Linear calcule l'avancement depuis les issues) |
| lot `Rn` de `tasks.md` | **issue** du projet — tâches `Tn` en checklist, dépendances en relations | cases cochées : 0 → Backlog · partiel → In Progress · toutes → Done |
| fiche `docs/chantiers/<état>/AAAA-MM-JJ-slug.md` | **issue** labellisée `chantier` | son **répertoire**, via la table de `docs/linear.md` |

Le produit n'est **pas une dérivation** : aucun fichier n'en porte le nom de façon stable, donc le
nom de l'initiative est une **configuration** arbitrée au setup, jamais re-dérivée (§D31). Le
miroir ne possède de l'initiative **que le rattachement des projets** — tout le reste est à l'humain.

La hiérarchie reste **plate** — initiative → projet → issue → checklist. Les tâches `Tn` ne
deviennent pas des sous-issues : elles vivent dans la description de l'issue du lot, ce qui garde
**une issue = une unité priorisable**.

« Un projet Linear par feature » se lit, en Jira, *une epic par feature* ; le conteneur permanent
est l'**équipe**, choisie une fois au setup. La table de correspondance complète vit dans le
`README.md` du plugin et dans le rapport de `linear-setup`.

**La résolution des cibles ne vit pas ici** : sections « Cibler une feature » (skill `feature-specs`)
et « Cibler un chantier » (skill `chantier`), référencées et **jamais recopiées** (charte §1).

## La clé est dérivée du nom de fichier

Le **titre** Linear porte la clé, en préfixe :

| Objet | Titre |
|---|---|
| projet d'une feature | `NNN-slug` |
| issue d'un lot | `Rn — <intitulé du lot>` |
| issue de chantier | `AAAA-MM-JJ-slug — <titre de la fiche>` |

Et la **dernière ligne de la description** porte un marqueur de secours :

```
— miroir scd-sdd · clé : 001-auth · R2
```

Stocker la clé *fichier* dans *Linear* est **le seul sens autorisé**. **Aucun identifiant, aucune
URL Linear n'entre dans le dépôt, nulle part.** Corollaire qui se réinventerait seul : **pas de
fichier de mapping d'identifiants**. Il se présentera au premier renommage sous l'apparence d'une
optimisation ; c'est le fichier d'état interdit depuis §D1, et il dériverait au premier `git mv`.

**Résolution, dans cet ordre** : match par **titre** → match par **marqueur** → `AskUserQuestion`.
**Jamais** de duplication silencieuse. Le préfixe-clé appartient au miroir ; **tout le reste du titre
appartient à l'humain**, et ne se resynchronise jamais.

**Idempotence.** Les identifiants Linear étant re-résolus à chaque fois, un second push immédiat
crée **0** objet — rattachements compris — et ne met à jour que ce qui a bougé. Un push qui recrée
est un **défaut de matching**, pas un run normal.

## La propriété des champs

| Champ | Propriétaire |
|---|---|
| préfixe-clé du titre | **miroir** |
| suffixe du titre | humain — jamais touché |
| description de l'issue (checklist `Tn` + marqueur) | **miroir** — **reconstruite en entier** à chaque push |
| workflow state | **miroir**, co-écrit — voir « ne rétrograde jamais » |
| relations `dépend de` | **miroir** |
| label `chantier` | **miroir** — il le **pose**, il ne le **crée** pas |
| rattachement projet ↔ initiative | **miroir** — il **rattache**, il ne crée jamais l'initiative au push |
| priorité, estimation, assigné, cycle, autres labels, commentaires | humain — jamais touchés |

⚠ **La description est reconstruite, pas fusionnée.** Du texte humain écrit dans la description d'une
issue de lot est **perdu au push suivant**. Les **commentaires** ne sont jamais touchés : c'est là
que ça se dit, et `linear-setup` le porte en avertissement.

Le **label de chantier** et l'**initiative** suivent le même pattern : créés au **seul setup** (le
label s'il manque, l'initiative si l'humain la retient), figés par leur **nom** dans
`docs/linear.md`, résolus au push. Introuvables → l'issue part **sans** label, le projet **sans**
rattachement, et le fait remonte au rapport, jamais en silence — `linear` ne crée ni l'un ni l'autre.

## Les statuts par défaut

Linear ne fixe pas les **noms** d'états — chaque équipe a les siens. Il en fixe les **types** :
`triage`, `backlog`, `unstarted`, `started`, `completed`, `canceled`. Le miroir raisonne donc sur les
**types**, et `docs/linear.md` fige la correspondance vers les états **réels** de l'équipe, lus par
API au setup.

| Source | Condition | Type visé |
|---|---|---|
| lot `Rn` | aucune case cochée | `backlog` |
| lot `Rn` | au moins une cochée, pas toutes | `started` |
| lot `Rn` | toutes cochées | `completed` |
| chantier | `en-cours/` | `started` |
| chantier | `en-attente/` | `backlog` |
| chantier | `archive/` | `completed` |

**Le workflow state est co-écrit, et le miroir ne rétrograde jamais.** L'intégration GitHub est un
second écrivain **légitime** (In Progress à l'ouverture d'une PR, Done au merge — accroche PR,
§D31) : l'état dérivé des cases n'est poussé que s'il **avance vers un type supérieur** ; un push
qui « corrigerait » un In Progress en Backlog est un défaut, pas une resynchronisation.

Plusieurs états d'une équipe peuvent partager un type. L'ambiguïté se tranche **une fois, au setup,
avec l'humain** — jamais en cours de push. Un **projet** Linear ne reçoit **aucun état** : son
avancement est calculé gratuitement depuis ses issues.

## Le contrat de `docs/linear.md` — un écrivain, trois lecteurs

`/scd-sdd:linear-setup` l'écrit, **une fois**. Le push, la revue et l'agent `pr-describer` le
**lisent tel qu'il est sur le disque** : c'est le fichier qui fait foi sur son propre contenu, pas sa
description. Son contenu exact — les rubriques, le template, la rétro-compatibilité d'un fichier
écrit avant la dernière rubrique — vit dans `references/linear-md.md`, chargée par l'écrivain et par
la revue, jamais par le push.

## Le pilotage en lecture

La priorisation vit chez Linear, et `/scd-sdd:linear-review` est le moyen de la **lire sans
pousser** : le garde des 250 issues du plan Free, l'hygiène de backlog, la vue Now/Next/Later —
rendus en session, **jamais persistés**. Ce n'est pas un 4ᵉ `status` : les status dérivent des
fichiers, elle interroge un tiers. La doctrine, précisée par §D31 : **redescendre = écrire un fait
Linear dans un fichier du dépôt** ; lire-et-rapporter est légal — c'est l'étape de priorisation du
push, promue en commande. Seuils, contrôles et rendu : `references/pilotage.md`.

## L'accroche PR (§D31)

L'intégration GitHub native transitionne les issues dès qu'une **magic word** les lie à une PR.
C'est l'agent `pr-describer` (flux implement) qui la pose — dans le **corps** de la PR, section
Traçabilité : **jamais le titre** (squash-merge → message de commit → dépôt), jamais le nom de
branche. `Fixes` si la base est la branche par défaut, `Part of` si la PR est **empilée** — un mot
fermant fermerait l'issue au merge dans un cul-de-sac. **Best-effort intégral, jamais de
question** : `docs/linear.md` absent → un `Glob`, zéro réseau ; toute autre défaillance → pas de
magic word + une `note` — divergence délibérée avec la résolution du push, le flux implement ne
casse jamais. L'agent charge `<auth>` + `<accroche_pr>` d'`api.md`, en lecture seule.

## Ce que le miroir n'est pas

- Il n'écrit **jamais** dans les fichiers du projet depuis Linear — et pour `linear` comme pour
  `linear-review`, c'est **mécanique** : ni `Write`, ni `Edit`, ni git. Leur `allowed-tools` **est**
  la preuve du sens unique ; une prose qui l'affirmerait sans l'outiller ne protégerait rien.
- Il ne crée **ni** chantier, **ni** feature, **ni** tâche depuis une issue Linear. Une issue **sans
  contrepartie fichier n'est ni touchée, ni signalée** au push : elle appartient à l'humain —
  `linear-review` la **rapporte** si elle porte le marqueur du miroir, et n'y touche pas plus.
- Il ne **supprime** ni n'**archive** jamais rien côté Linear — un lot disparu d'un `tasks.md`
  laisse son issue en place — et ne **bloque** jamais une phase : aucune table de dérivation,
  aucun `status` ne le réclame.
- Il ne pousse **jamais** le contenu des documents (`spec.md`, fiches de chantier) : titres,
  checklists et états, rien d'autre.
- Il n'appelle **qu'un seul endpoint**, `https://api.linear.app/graphql` — règle absolue, parce que
  `Bash(curl *)` est un motif large.
- **Ce n'est pas une synchronisation.** Il n'y a **aucun conflit** à résoudre : les fichiers ont
  raison, toujours. Ce que Linear porte en propre — priorité, estimation, assigné, cycle — n'est
  jamais écrasé **parce que le miroir ne le possède pas**, et non parce qu'on aurait arbitré en sa
  faveur.

Clé d'API absente → **arrêt pédagogique** pour les trois commandes, jamais de best-effort : l'appel
API **est** la commande. Seule exception, écrite en §D31 : l'accroche PR dégrade en `note`.

## Références

| Fichier | Quand la charger |
|---|---|
| `references/api.md` | **Quatre points de chargement.** `/scd-sdd:linear` : **intégralement**. `/scd-sdd:linear-setup` : `<auth>`, `<queries_config>`, `<mutations_setup>`, `<pagination>`. `/scd-sdd:linear-review` : `<auth>` et `<pilotage>`. L'agent **`pr-describer`** : `<auth>` et `<accroche_pr>` seuls (§D31). **Datée en tête** — elle se lit quel que soit le bloc chargé : un schéma tiers se périme. |
| `references/linear-md.md` | Le contrat de `docs/linear.md` — les rubriques, le template, la rétro-compatibilité. `/scd-sdd:linear-setup` : **intégralement**, c'est elle qui écrit le fichier. `/scd-sdd:linear-review` : le seul bloc `<contrat>`. **`/scd-sdd:linear` ne la charge pas** — elle lit le fichier lui-même, et le fichier fait foi sur son propre contenu. |
| `references/pilotage.md` | Les seuils du garde 250, les quatre contrôles d'hygiène, le rendu Now/Next/Later. `/scd-sdd:linear-review` **seule**. |
