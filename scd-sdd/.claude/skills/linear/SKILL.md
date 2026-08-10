---
name: linear
description: |
  La CAPACITÉ DE MIROIR LINEAR transverse, OPT-IN : ce que le dépôt sait déjà —
  features, lots Rn, fiches de chantier — est POUSSÉ vers un workspace Linear, où
  l'équipe fait sa priorisation. Granularité feature → projet · lot Rn → issue
  (tâches Tn en checklist, dépendances en relations) · fiche → issue labellisée,
  clé dérivée du nom de fichier, idempotence, propriété des champs, contrat de
  docs/linear.md. Sens STRICTEMENT unique : rien de ce qui vit chez Linear ne
  redescend jamais dans les fichiers, qui restent la source de vérité. Se charge
  pendant /scd-sdd:linear et /scd-sdd:linear-setup, et JAMAIS ailleurs. Porte
  UNIQUEMENT le miroir : ni le contrat des specs (feature-specs), ni celui des
  chantiers (chantier), ni le journal (journal) — il n'écrit aucune ligne. Ne joue
  aucune phase et n'en bloque aucune : un projet sans docs/linear.md ne voit
  strictement aucun changement.
---

# Miroir Linear — `docs/linear.md`

## Pourquoi une capacité, et pas une phase

Une phase se joue **une fois, dans un ordre imposé**, et laisse un artefact dont l'état se dérive.
Le miroir se joue **quand l'humain le décide**, autant de fois qu'il veut, et ne laisse **aucun
artefact** dans le dépôt : son résultat vit chez Linear.

Trois conséquences, toutes **de nature** et jamais discrétionnaires :

- **Aucune ligne de journal.** Le miroir ne produit aucun fait non dérivable : son résultat est
  interrogeable chez Linear, et `docs/linear.md` est le fait que produit le setup. Le
  `## Consigne au journal` des deux commandes existe quand même, pour dire qu'elles n'écrivent rien
  et pourquoi — comme `lookup`, `research` et les trois commandes de chantier.
- **Aucun état dérivé.** `docs/linear.md` n'apparaît dans **aucune** table d'état de `status` : l'y
  faire figurer ferait croire à une phase, et un projet sans miroir n'est pas un projet incomplet.
- **Aucune accroche.** Aucune phase ne pousse le miroir. Une accroche aurait suspendu la phase à la
  disponibilité d'un service tiers, et fait payer une lecture de plus aux projets qui n'ont pas de
  workspace.

**L'opt-in est un fichier** : `docs/linear.md` existe → le miroir existe. C'est l'état dérivé du
système de fichiers, jamais un champ à maintenir (charte §5). Ce fichier est légal au même titre que
`docs/ci.md` — une configuration bornée, arbitrée une fois par l'humain, que rien d'autre ne peut
porter.

## La granularité — trois objets, trois portées d'état

| Fichier | Objet Linear | Ce qui porte l'état |
|---|---|---|
| feature `specs/NNN-slug/` | **projet** | — (Linear calcule l'avancement depuis les issues) |
| lot `Rn` de `tasks.md` | **issue** du projet — tâches `Tn` en checklist, dépendances en relations | cases cochées : 0 → Backlog · partiel → In Progress · toutes → Done |
| fiche `docs/chantiers/<état>/AAAA-MM-JJ-slug.md` | **issue** labellisée `chantier` | son **répertoire**, via la table de `docs/linear.md` |

La hiérarchie reste **plate** — projet → issue → checklist. Les tâches `Tn` ne deviennent pas des
sous-issues : elles vivent dans la description de l'issue du lot, ce qui garde **une issue = une
unité priorisable**.

Le mot « projet » ne désigne pas la même chose chez Jira et chez Linear : « un projet Linear par
feature » se lit, en Jira, *une epic par feature*, et le conteneur permanent est l'**équipe**,
choisie une fois au setup. La table de correspondance complète vit dans le `README.md` du plugin et
dans le rapport de `linear-setup`.

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
crée **0** objet et ne met à jour que ce qui a bougé. Un push qui recrée est un **défaut de
matching**, pas un run normal.

## La propriété des champs

| Champ | Propriétaire |
|---|---|
| préfixe-clé du titre | **miroir** |
| suffixe du titre | humain — jamais touché |
| description de l'issue (checklist `Tn` + marqueur) | **miroir** — **reconstruite en entier** à chaque push |
| workflow state | **miroir** |
| relations `dépend de` | **miroir** |
| label `chantier` | **miroir** — il le **pose**, il ne le **crée** pas |
| priorité, estimation, assigné, cycle, autres labels, commentaires | humain — jamais touchés |

⚠ **La description est reconstruite, pas fusionnée.** Du texte humain écrit dans la description d'une
issue de lot est **perdu au push suivant**. Les **commentaires** ne sont jamais touchés : c'est là
que ça se dit, et `linear-setup` le porte en avertissement.

Le **label de chantier** est créé **une fois** par `linear-setup`, s'il n'existe pas dans l'équipe,
puis figé dans `docs/linear.md`. `linear` ne le crée **jamais** : label introuvable au push → l'issue
est créée **sans** label et le fait remonte au rapport, jamais en silence.

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

Plusieurs états d'une équipe peuvent partager un type. L'ambiguïté se tranche **une fois, au setup,
avec l'humain** — jamais en cours de push.

Un **projet** Linear ne reçoit **aucun état** : son avancement est calculé gratuitement depuis ses
issues. Lui en imposer un serait un second chiffre à maintenir, et il dériverait.

## Le contrat de `docs/linear.md`

Écrit **une fois** par `/scd-sdd:linear-setup`, qui **refuse d'écraser** un fichier existant (garde
anti-écrasement, modèle de `contract`, §D29). La mise à jour est une **édition manuelle**.

Contenu **fermé** — il ne croît pas :

1. la **clé de l'équipe** (`ENG`) et son nom ;
2. le **nom** de la variable d'environnement qui porte la clé d'API — **jamais sa valeur** (précédent
   exact du `jira_auth_token_env` de `scd-review`) ;
3. la table des **statuts** : type visé → état réel de l'équipe ;
4. le **nom du label** de chantier ;
5. la convention de **nommage** des titres ;
6. la table de **propriété des champs**.

Ce qu'il ne porte **jamais** : un identifiant ou une URL Linear, la valeur d'une clé, une liste
d'issues, un mapping. La clé d'équipe est un **choix de configuration**, pas un identifiant
technique : c'est le seul mot venu de Linear que le dépôt porte, et §D30 le nomme.

Il n'entre dans **aucune** table de dérivation, et **aucun** `status` ne le réclame.

## Ce que le miroir n'est pas

- Il n'écrit **jamais** dans les fichiers du projet depuis Linear — et pour `linear`, c'est
  **mécanique** : elle n'a ni `Write`, ni `Edit`, ni aucune commande git. Son `allowed-tools` **est**
  la preuve du sens unique ; une prose qui l'affirmerait sans l'outiller ne protégerait rien.
- Il ne crée **ni** chantier, **ni** feature, **ni** tâche depuis une issue Linear. Une issue **sans
  contrepartie fichier n'est ni touchée, ni signalée** : elle appartient à l'humain.
- Il ne **supprime** ni n'**archive** jamais rien côté Linear. Un lot disparu d'un `tasks.md` laisse
  son issue en place.
- Il ne **bloque** jamais une phase, n'apparaît dans **aucune** table de dérivation, et **aucun**
  `status` ne le réclame.
- Il ne pousse **jamais** le contenu des documents (`spec.md`, fiches de chantier) : titres,
  checklists et états, rien d'autre.
- Il n'appelle **qu'un seul endpoint**, `https://api.linear.app/graphql` — règle absolue, parce que
  `Bash(curl *)` est un motif large.
- **Ce n'est pas une synchronisation.** Il n'y a **aucun conflit** à résoudre : les fichiers ont
  raison, toujours. Ce que Linear porte en propre — priorité, estimation, assigné, cycle — n'est
  jamais écrasé **parce que le miroir ne le possède pas**, et non parce qu'on aurait arbitré en sa
  faveur.

Clé d'API absente de l'environnement → **arrêt pédagogique**, jamais de best-effort : l'appel API
**est** la commande, et échouer à moitié ne laisserait rien derrière soi.

## Références

| Fichier | Quand la charger |
|---|---|
| `references/api.md` | **Deux points de chargement.** `/scd-sdd:linear` : **intégralement**. `/scd-sdd:linear-setup` : `<auth>`, `<queries>` et la seule mutation de label de `<mutations>` — il vérifie la clé, lit les états réels et crée le label, il ne pousse rien. **Datée en tête** : un schéma tiers se périme, à revérifier avant de s'y fier. |
