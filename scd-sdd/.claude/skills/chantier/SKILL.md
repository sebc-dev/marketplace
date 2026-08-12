---
name: chantier
description: |
  Contrat des fiches docs/chantiers/<état>/AAAA-MM-JJ-slug.md : l'unité de travail qui
  ne relève d'aucune des phases du cycle, ou qu'un /clear interrompt en vol. Format, état
  porté par le répertoire (en-cours / en-attente / archive), manifeste de contexte chargé
  à la demande, contrôle de fraîcheur, sélection par branche pour les worktrees, cycle de
  vie. Se charge pendant /scd-sdd:pause, resume et note, quand analyze, ci, premortem ou
  audit écrivent leur fiche, et quand une commande — les status, les phases specs devant
  une fiche de gate — ou le hook SessionStart en lit une. Porte UNIQUEMENT les chantiers :
  ni la chronologie des phases jouées (skill journal), ni la dérivation de l'état du cycle
  depuis les fichiers (skills project-docs, feature-specs, implement), ni le contenu des
  documents produits. Une fiche ne dit jamais où en est le projet.
---

# Chantiers — `docs/chantiers/`

## Pourquoi ils existent

Chaque phase du cycle produit un fichier : l'état se dérive, `/clear` efface le contexte mais pas
la progression. Deux choses échappent à ce mécanisme.

- **Le travail hors des phases** — un flake corrigé, une montée de version, un spike, un hotfix.
  Aucun fichier de specs, aucune case, aucune PR ne le porte ; au mieux un commit, qui dit le
  *quoi* et jamais le *pourquoi* ni l'impasse.
- **Le travail interrompu en vol** — une tâche longue coupée par un `/clear`. Ce qui est sur
  disque survit ; l'intention, la décision prise, l'étape suivante et les pistes écartées sont
  perdues, et la reprise les rachète au prix fort.

Un chantier est **un fichier par unité de travail**. Ouvert, il porte de quoi reprendre ; fermé,
il devient l'archive de ce qui a été fait et pourquoi.

## Ce qu'un chantier n'est pas

Le repo refuse les fichiers d'état. Une fiche n'en est pas un ; trois propriétés le
garantissent :

1. **Aucun fait dérivable n'a le droit d'y figurer** — état de lot, résultat de tests, verdict
   de gate, inventaire de fichiers, pourcentage d'avancement, numéro de PR présenté comme un
   état. Un artefact qui ne contient aucun fait dérivable **ne peut pas contredire les
   fichiers**.
2. **Elle parle d'intention, au passé.** « j'allais », « j'ai décidé », « j'ai écarté ». Jamais
   l'indicatif présent sur le projet. La péremption s'**entend** à la lecture.
3. **Elle est consommée.** Un fichier d'état est fait pour durer et rester vrai ; une fiche est
   faite pour être refermée. `resume` l'archive, il ne la maintient pas.

Une décision **structurante** ne va pas dans une fiche : elle va dans `docs/adr/_candidates/`. Un
changement de comportement va dans `spec.md`. Le détail d'un changement de code va dans le message
de commit.

## Emplacement, état, nommage

```
docs/chantiers/
  en-cours/     2026-08-04-verrou-compte.md
  en-attente/   2026-07-30-refonte-cache.md
  archive/      2026-07-28-flake-session.md
```

- **L'état est le répertoire**, jamais un champ. Changer d'état est un `git mv`. Il n'y a
  **aucun** champ `État :` dans une fiche : un chemin et un champ finiraient par se contredire, et
  rien ne trancherait.
- **`en-cours/` peut contenir plusieurs fiches** — c'est le cas normal quand `run-parallel` fait
  tourner plusieurs lots en worktrees isolés. La branche lève l'ambiguïté (§ « Cibler un
  chantier »).
- **Nom : `AAAA-MM-JJ-slug.md`, daté de l'ouverture**, jamais renommé. Le tri par nom donne la
  chronologie gratuitement, dans les trois répertoires. Aucun compteur à maintenir.
- **Versionné, et commité par la commande qui écrit**, dans un commit isolé dont le `git add` est
  **scopé à la fiche**. `git status --porcelain` non vide fait tomber `/scd-sdd:run` en
  `blocked-dirty-tree` : une fiche non commitée casserait le niveau implémentation ; le code en
  vol, lui, reste non commité.
- **En worktree**, chaque copie de travail voit les chantiers commités *sur sa branche* : c'est ce
  qui rend la sélection par branche fiable. Corollaire assumé — la fiche d'un chantier lié à un lot
  arrive dans le diff de la PR de ce lot.

## Format de la fiche

Plafond **~50 lignes**. Au-delà, ce n'est plus un chantier mais une feature : renvoyer vers
`/scd-sdd:kickoff-feature`.

```markdown
# Verrouillage du compte après 5 échecs

Portée : 001-auth · lot R2
Ouvert le 2026-08-04 · Actualisé le 2026-08-05 · branche `impl/auth-R2` · HEAD `a1b2c3d`

## Objectif
Faire passer FR-004 au vert sans toucher au middleware de session.

## Contexte à charger
à lire      `specs/001-auth/spec.md` § FR-004 — le critère à satisfaire (18 l.)
à extraire  `src/legacy/router.ts` › `class RateLimiter` — 2400 l., seule cette classe compte
à situer    PR #12 — le lot R1 mergé, ne pas relire

## Acquis
- Le rate-limit passe en local.
- Compteur décidé dans la table `login_attempt`, pas le cache (vidé au déploiement).

## Prochaine étape
Écrire le test rouge `locks_after_fifth_failure` dans `test/auth/lockout.test.ts`.

## Écarté
- Redis — absent de `docs/stack.md`.
- Middleware `rateLimit` existant — compte par IP, le critère demande par compte.
```

- **`Portée`**, vocabulaire fermé donc greppable : `NNN-slug · lot Rn` | `NNN-slug · gate` |
  `NNN-slug` | `socle` | `socle · audit` | `hors-cycle`. Deux sont des listes de corrections :
  `· gate`, laissée par `/scd-sdd:analyze` (contrat `feature-specs/references/analyze.md`, section
  `<gate>`), et `socle · audit`, laissée par `/scd-sdd:audit` (`audit/references/dimensions.md`).
- **`branche`** porte une double charge : c'est l'**ancre de fraîcheur** *et* la **clé de sélection
  par worktree**. Ne l'omets jamais.
- **`## Écarté` est la rubrique de plus forte valeur** : rien d'autre dans le projet ne porte les
  pistes mortes, et ce sont elles qui coûtent le plus cher à ré-explorer.
- Un champ **`Bloqué par :`** est admis sous l'en-tête quand le chantier attend un tiers (review,
  déploiement, réponse). C'est un **motif**, pas un état : il ne change pas de répertoire.
- À la fermeture, la fiche gagne **`## Issue`** — ce qui a été fait, le commit ou la PR — et part
  telle quelle dans `archive/`.

## Le manifeste de contexte

`## Contexte à charger` est le cœur du dispositif : il sépare le **suivi** (léger, toujours lu) du
**contexte** (volumineux, chargé seulement à la reprise). Une ligne est une **référence** — un
pointeur et une raison — jamais du contenu recopié.

**La règle qui prime sur toutes les autres.** Au moment où la fiche s'écrit, la session **a déjà
lu** les fichiers concernés :

> Une référence dit **où retrouver** quelque chose. Si ce qu'on veut est une **conclusion**, elle
> va dans `## Acquis`, et le fichier n'est jamais rechargé.

Chaque ligne déclare ensuite **comment** elle se charge — `à lire`, `à extraire`, `à déléguer`,
`à situer`. Les quatre classes, leurs seuils, le budget et l'agent `chantier-reader` vivent dans
**`references/manifeste.md`**, chargée par `pause` et `resume` seulement.

## Cibler un chantier (résolution)

`/clear` efface le contexte : une commande ne peut pas *supposer* sa cible. **Règle de résolution,
identique partout**, dans cet ordre :

1. Un **argument** est fourni → match sur un fragment de slug ou sur la date, dans les trois
   répertoires. Plusieurs correspondances → liste et `AskUserQuestion`.
2. Sinon, la fiche de `en-cours/` dont le champ **`branche`** vaut la branche courante
   (`git rev-parse --abbrev-ref HEAD`) → c'est elle. **C'est le cas worktree**, et c'est ce qui
   rend la sélection déterministe quand plusieurs lots tournent en parallèle.
3. Sinon, s'il n'y a qu'**une seule** fiche dans `en-cours/` → la prendre et **l'annoncer**.
4. Sinon (0 ou ≥ 2 sans correspondance) → **ne devine jamais** : liste les candidates avec leur
   portée et leur date, et demande via `AskUserQuestion`.

Relaxation propre à ce niveau : **zéro candidate n'est pas une erreur**. Pour `pause` et `note`,
c'est un chantier neuf à ouvrir, de portée `hors-cycle` si rien ne le rattache au cycle.

**Cette règle est la source de vérité unique** — les commandes et les lecteurs la référencent, ils
ne la recopient jamais.

## Contrôle de fraîcheur

Une fiche est une intention datée : tout lecteur la contrôle **avant** de la restituer, comme la
règle de péremption du journal. Trois contrôles, indépendants :

| Contrôle | Comment | Verdict |
|---|---|---|
| **Ancre** | branche courante ≠ champ `branche`, ou `git merge-base --is-ancestor <HEAD enregistré> HEAD` ≠ 0 | **⚠ suspect** — le dépôt est parti ailleurs |
| **Âge** | `Actualisé le` remonte à plus de 14 jours | **⚠ ancien** |
| **Consommation** | la `Prochaine étape` nomme un fichier, un test, un symbole — le vérifier contre les fichiers | **✔ consommé** → proposer la fermeture |

Une fiche peut être à jour en âge et suspecte en ancre : afficher les deux. **Une fiche ne bloque
jamais rien** — aucune commande ne STOP à cause d'elle, et personne n'écrit « périmé » dedans :
l'invalidation se **calcule à la lecture**, elle n'est pas un artefact.

## Cycle de vie

| Moment | Qui | Effet |
|---|---|---|
| ouverture / actualisation | `pause` | écrit dans `en-cours/` après validation humaine, puis commite |
| travail déjà terminé | `note` | écrit directement dans `archive/`, avec `## Issue` |
| liste de corrections | `analyze` (gate de specs) · `audit` (document du socle) | ouvre ou actualise `en-cours/…-gate-<cible>.md`, ou `…-audit-<document>.md` ; au verdict vert — `PRÊT`, `CONFORME` —, ajoute `## Issue` et archive. L'audit ne touche **jamais** le document jugé |
| durcissement différé | `ci` · `premortem` | écrivent dans `en-attente/` — plan de durcissement CI, ou risque de premortem qui ne se referme par aucun texte ; repris via `resume`. La cible `chantier` de `premortem` édite la fiche et actualise `Actualisé le`, **sans ligne de journal** |
| annonce | hook `SessionStart` | lit l'en-tête, n'écrit rien, n'affirme aucune fraîcheur |
| signalement | `status`, `status-impl`, phases specs (fiche de gate) | lisent sous contrôle de fraîcheur — l'en-tête seul pour les `status` |
| mise de côté | `resume` | `git mv` vers `en-attente/` |
| fermeture / abandon | `resume` | ajoute `## Issue`, `git mv` vers `archive/` |

Une fiche archivée n'est **jamais** supprimée : l'archive est la chronologie du hors-cycle, que son
tri par nom rend lisible sans index.

## La frontière avec le journal

> Ce qui garde de la valeur **une fois le travail terminé** va au journal ; ce qui n'a de valeur
> que **pour le reprendre** va dans la fiche.

Concrètement : `docs/journal/*.md` porte les **phases du cycle** (une ligne = un événement daté,
immuable), `docs/chantiers/` **tout le reste**. Un chantier fermé n'écrit **aucune** ligne de
journal — son lien avec une feature passe par `Portée`, greppé par `status`. Contrat : skill `journal`.

## Références

| Fichier | Quand la charger |
|---|---|
| `references/manifeste.md` | `pause` et `resume` — les 4 classes de référence, leurs seuils, le budget, l'agent `chantier-reader` |
