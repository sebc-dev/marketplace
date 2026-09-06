# Référence — La fiche de chantier

Chargée par ce qui **écrit** une fiche, et par rien d'autre : `/scd-spec-dev:pause` (intégralement —
seul applicateur de `<elagage>`), `/scd-spec-dev:note` (intégralement **sauf `<elagage>`** — une
fiche d'archive naît fermée), et `/scd-spec-dev:run` / `/scd-spec-dev:run-parallel` (`<interdits>` et
`<template>`) quand un run se **bloque** : la fiche est alors le seul endroit où ce fait laisse une
trace.

Les commandes qui **lisent** une fiche — `status`, une commande qui doit cibler un chantier — n'en
ont **pas** besoin : l'anatomie de la fiche et la ligne `Portée` sont dans le `SKILL.md`.

<pourquoi>

## Pourquoi les chantiers existent

Chaque phase du cycle laisse un artefact : le change vit dans `openspec/changes/`, les tickets dans
`changes/<x>/tickets/`, les cases se cochent, les PR s'ouvrent — l'état se dérive, `/clear` efface le
contexte mais pas la progression. Deux choses échappent à ce mécanisme.

- **Le travail hors des phases** — un flake corrigé, une montée de version, un spike, un hotfix, une
  tâche d'ops. Aucun change, aucun ticket, aucune case, aucune PR ne le porte ; au mieux un commit,
  qui dit le *quoi* et jamais le *pourquoi* ni l'impasse.
- **Le travail interrompu en vol** — une tâche longue coupée par un `/clear`. Ce qui est sur disque
  survit ; l'intention, la décision prise, l'étape suivante et les pistes écartées sont perdues, et
  la reprise les rachète au prix fort.

Un chantier est **un fichier par unité de travail**. Ouvert, il porte de quoi reprendre ; fermé, il
devient l'archive de ce qui a été fait et pourquoi.

</pourquoi>

<interdits>

## Ce qu'un chantier n'est pas

Le repo refuse les fichiers d'état. Une fiche n'en est pas un ; trois propriétés le garantissent :

1. **Aucun fait dérivable n'a le droit d'y figurer** — état d'un ticket, résultat de tests, verdict
   de la quality gate, inventaire de fichiers, pourcentage d'avancement, numéro de PR présenté comme
   un état, état d'un change lisible par `openspec list`. Un artefact qui ne contient aucun fait
   dérivable **ne peut pas contredire les fichiers**.
2. **Elle parle d'intention, au passé.** « j'allais », « j'ai décidé », « j'ai écarté ». Jamais
   l'indicatif présent sur le projet. La péremption s'**entend** à la lecture.
3. **Elle est consommée.** Un fichier d'état est fait pour durer et rester vrai ; une fiche est faite
   pour être refermée. `resume` l'archive, il ne la maintient pas.

Une décision **structurante** ne va pas dans une fiche : elle va dans un ADR (`docs/adr/`, immuable).
Un changement de capacité va dans un **change** OpenSpec (`/opsx:propose`). Le détail d'un changement
de code va dans le message de commit.

</interdits>

<template>

## Le format complet

**Plafond ~50 lignes** — la valeur est la même pour toutes les fiches ; ce qu'un dépassement veut
dire dépend de la **nature** de la fiche, et l'issue avec :

| Nature | Un dépassement signale | L'issue |
|---|---|---|
| travail ouvert (`pause`) | à l'écriture initiale : un périmètre de capacité ; à l'actualisation : l'accumulation | ouvrir un change (`/opsx:propose`) plutôt qu'une fiche ; **élaguer d'abord** (bloc `<elagage>`), le renvoi ne vaut que si la fiche élaguée dépasse encore |
| archive (`note`) | la fiche **héberge** la connaissance au lieu de l'**indexer** — le travail est terminé, ce n'est jamais une capacité neuve | router le surplus — candidat ADR, change, message de commit — et garder l'index |
| run bloqué (`run`, `run-parallel`) | le workflow s'est arrêté — la taille suit ce qu'il a produit avant | format serré : le statut `blocked-*`, ce qui a été écrit, ce qui reste. **Jamais tronquer** la sortie d'erreur |

```markdown
# Verrouillage du compte après 5 échecs

Portée : verrou-compte · ticket 02
Ouvert le 2026-08-04 · Actualisé le 2026-08-05 · branche `impl/verrou-compte-02` · HEAD `a1b2c3d`

## Objectif
Faire passer le scénario « 5e échec verrouille » au vert sans toucher au middleware de session.

## Contexte à charger
à lire      `openspec/changes/verrou-compte/specs/auth/spec.md` § lockout — le delta à honorer (18 l.)

## Acquis
- Le rate-limit passe en local.
- Compteur décidé dans la table `login_attempt`, pas le cache (vidé au déploiement).

## Prochaine étape
Écrire le test rouge `SC-02a — verrouille au 5e échec` dans `test/auth/lockout.test.ts`.

## Écarté
- Redis — aucun ADR ne l'autorise.
- Middleware `rateLimit` existant — compte par IP, le critère demande par compte.
```

- **`## Écarté` est la rubrique de plus forte valeur** : rien d'autre dans le projet ne porte les
  pistes mortes, et ce sont elles qui coûtent le plus cher à ré-explorer.
- **L'ancre `HEAD` se rafraîchit à chaque actualisation**, en même temps qu'`Actualisé le`. Le
  contrôle de fraîcheur de `resume` en dépend : une ancre laissée périmée ferait passer une fiche à
  jour pour suspecte, ou l'inverse.
- Les règles du `## Contexte à charger` — les quatre classes, leurs seuils, le budget — et les
  exemples des quatre classes vivent dans `references/manifeste.md`, qui se charge **bloc par bloc** :
  `<regle_maitresse>`, `<classes>` et `<controles>` pour écrire. Le template n'en garde qu'**une**
  ligne : `run` et `run-parallel` écrivent un manifeste — le ticket et son change, tous deux
  `à lire` — sans charger `<classes>`, il leur faut la forme d'une ligne sous les yeux.

**Le commit.** Une fiche est **versionnée, et commitée par la commande qui l'écrit**, dans un commit
isolé dont le `git add` est **scopé à la fiche**. `git status --porcelain` non vide fait tomber
`/scd-spec-dev:run` sur son exigence d'arbre propre : une fiche non commitée casserait le niveau
implémentation ; le code en vol, lui, reste non commité. Corollaire assumé — la fiche d'un chantier
lié à un ticket, écrite sur la branche `impl/<slug>-NN` de ce ticket, arrive dans le diff de sa PR.

</template>

<elagage>

## L'élagage à l'actualisation — `pause` seul

Appliqué par `/scd-spec-dev:pause` quand il **actualise** une fiche existante — jamais à l'écriture
initiale, jamais par un autre écrivain. Ce n'est pas une compression : une actualisation ajoute et
rien ne retirait, si bien que la fiche finissait par porter des faits que le disque porte désormais —
l'élagage est le contrôle de l'interdit n° 1 **dans le temps**.

Relis chaque ligne existante contre le disque, **avant** d'ajouter quoi que ce soit :

- un **Acquis** dont le fait est maintenant porté par un commit, un delta de change ou un ticket est
  devenu **dérivable** → il sort. En cas de doute — le fait n'est que partiellement sur le disque —,
  il **reste** ;
- une ligne du **manifeste** dont la cible a été consommée — intégrée, mergée, supprimée — sort, ou
  se déclasse en `à situer` ;
- une **Prochaine étape** faite se **remplace**, elle ne s'empile jamais ;
- **`## Écarté` ne s'élague jamais** : les pistes mortes ne sont dérivables de nulle part — c'est la
  rubrique de plus forte valeur, et la seule dont la croissance est légitime.

**Tout retrait est annoncé à l'humain**, ligne par ligne, avec son motif (« porté par `a1b2c3d` »,
« intégré au delta `auth/spec.md` »). Le contenu d'une fiche est inféré de la session : un retrait
silencieux perdrait un acquis sans témoin.

</elagage>

<frontiere>

## La frontière : ce qui vit ailleurs n'entre pas dans une fiche

> Ce qu'un **artefact du cycle** porte déjà n'entre pas dans une fiche ; ce qui n'a de valeur que
> **pour reprendre le travail** y entre, et n'a nulle part ailleurs où aller.

Concrètement : un ticket porte ses critères, un change porte ses deltas, un ADR porte sa décision,
`git log` porte ce qui a été commité, `openspec list` porte l'état des changes. Une fiche qui les
redirait créerait une seconde vérité qui dérive. Ce qu'elle porte, et qu'aucun de ces fichiers ne
porte : **l'intention en vol** — ce que tu allais faire, ce que tu as écarté et pourquoi, ce qu'il
faut recharger pour continuer.

**Chantier ≠ change.** Un chantier n'écrit dans aucune spec et ne laisse aucun delta. Si le travail
modifie le produit de façon à changer une capacité, ce n'est plus un chantier : il faut ouvrir un
change (`/opsx:propose`), le décomposer (`/scd-spec-dev:tickets`) et l'implémenter (`/scd-spec-dev:run`).
Un chantier fermé n'écrit **rien** ailleurs : son lien avec un change passe par `Portée`, greppée par
`status`.

</frontiere>
