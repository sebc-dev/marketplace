# Référence — La fiche de chantier

Chargée par les commandes qui **écrivent** une fiche : `/scd-sdd:pause` (intégralement — seul
applicateur de `<elagage>`), `/scd-sdd:note` (intégralement **sauf `<elagage>`** — une fiche
d'archive naît fermée), `/scd-sdd:analyze`, `/scd-sdd:ci`, `/scd-sdd:audit` et `/scd-sdd:premortem`
de cible `chantier` (`<interdits>` et `<template>`, plus `<frontiere>` pour ceux qui journalisent par
ailleurs). Les commandes qui **lisent** une fiche — les trois `status`, les phases specs devant une
fiche de gate, `linear`, le hook `SessionStart` — n'en ont **pas** besoin : l'anatomie de la fiche et
la ligne `Portée` sont dans le `SKILL.md`.

<pourquoi>

## Pourquoi les chantiers existent

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

</pourquoi>

<interdits>

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

</interdits>

<template>

## Le format complet

**Plafond ~50 lignes** — la valeur est la même pour toutes les fiches ; ce qu'un dépassement veut
dire dépend de la **nature** de la fiche, et l'issue avec :

| Nature | Un dépassement signale | L'issue |
|---|---|---|
| travail ouvert (`pause`) | à l'écriture initiale : un périmètre de feature ; à l'actualisation : l'accumulation | renvoyer vers `/scd-sdd:kickoff-feature` ; **élaguer d'abord** (bloc `<elagage>`), le renvoi ne vaut que si la fiche élaguée dépasse encore |
| archive (`note`) | la fiche **héberge** la connaissance au lieu de l'**indexer** — le travail est terminé, ce n'est jamais une feature | router le surplus — candidat ADR, `spec.md`, message de commit — et garder l'index |
| liste de corrections (`analyze` · gate, `audit`) | un contrat très cassé — la taille suit le nombre de findings | format serré (une ligne par finding), coût annoncé, **jamais tronquer** : corriger le contrat, pas raccourcir la fiche |

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

- **`## Écarté` est la rubrique de plus forte valeur** : rien d'autre dans le projet ne porte les
  pistes mortes, et ce sont elles qui coûtent le plus cher à ré-explorer.
- Les règles du `## Contexte à charger` — les quatre classes, leurs seuils, le budget — vivent dans
  `references/manifeste.md`, qui se charge **bloc par bloc** : `<regle_maitresse>`, `<classes>` et
  `<controles>` pour écrire.

**Le commit.** Une fiche est **versionnée, et commitée par la commande qui l'écrit**, dans un commit
isolé dont le `git add` est **scopé à la fiche**. `git status --porcelain` non vide fait tomber
`/scd-sdd:run` en `blocked-dirty-tree` : une fiche non commitée casserait le niveau
implémentation ; le code en vol, lui, reste non commité. Corollaire assumé — la fiche d'un chantier
lié à un lot arrive dans le diff de la PR de ce lot.

</template>

<elagage>

## L'élagage à l'actualisation — `pause` seul

Appliqué par `/scd-sdd:pause` quand il **actualise** une fiche existante — jamais à l'écriture
initiale, jamais par un autre écrivain (`premortem` **signale** un dépassement, il n'élague pas).
Ce n'est pas une compression : une actualisation ajoute et rien ne retirait, si bien que la fiche
finissait par porter des faits que le disque porte désormais — l'élagage est le contrôle de
l'interdit n° 1 **dans le temps**.

Relis chaque ligne existante contre le disque, **avant** d'ajouter quoi que ce soit :

- un **Acquis** dont le fait est maintenant porté par un commit, un document ou une spec est
  devenu **dérivable** → il sort. En cas de doute — le fait n'est que partiellement sur le
  disque —, il **reste** ;
- une ligne du **manifeste** dont la cible a été consommée — intégrée, mergée, supprimée — sort,
  ou se déclasse en `à situer` ;
- une **Prochaine étape** faite se **remplace**, elle ne s'empile jamais ;
- **`## Écarté` ne s'élague jamais** : les pistes mortes ne sont dérivables de nulle part — c'est
  la rubrique de plus forte valeur, et la seule dont la croissance est légitime.

**Tout retrait est annoncé au gate de validation**, ligne par ligne, avec son motif (« porté par
`a1b2c3d` », « intégré à `spec.md` FR-004 »). Le contenu d'une fiche est inféré de la session : un
retrait silencieux perdrait un acquis sans témoin.

</elagage>

<frontiere>

## La frontière avec le journal

> Ce qui garde de la valeur **une fois le travail terminé** va au journal ; ce qui n'a de valeur
> que **pour le reprendre** va dans la fiche.

Concrètement : `docs/journal/*.md` porte les **phases du cycle** (une ligne = un événement daté,
immuable), `docs/chantiers/` **tout le reste**. Un chantier fermé n'écrit **aucune** ligne de
journal — son lien avec une feature passe par `Portée`, greppé par `status`. Contrat : skill `journal`.

</frontiere>
