---
description: "Pose, répare et rend compte des gardes de session — les blocages qui empêchent l'agent de réécrire ce qui vérifie son travail (tests, workflows de CI, config d'outillage) et d'éteindre un contrôle sur la ligne qui échoue (@ts-ignore, as any, .skip, --no-verify). Écrit .claude/guards.json — le périmètre, possédé par le projet —, rend le job CI qui rattrape ce qui est entré hors session, et DÉROULE la trace des tentatives bloquées : savoir que l'agent a essayé est le signal, pas seulement qu'il a échoué. Rejouable, idempotente."
argument-hint: "(aucun — constate, puis propose)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
  - Bash(python3 --version)
---

## Contexte

Le cycle ne valide plus les documents par des gates : il **surveille l'agent pendant qu'il
travaille**. Tu poses ce dispositif, tu le répares, et tu rends compte de ce qu'il a attrapé.

Le fait qui commande tout : un texte que l'agent lit ne le contraint pas. Le terrain de
`DECISIONS.md` §D22 est sans ambiguïté — un agent a contourné des hooks pre-commit sur **six
commits consécutifs** malgré des règles `CLAUDE.md` explicites. Ce que tu poses ici est extérieur à
l'agent, donc il tient.

**Ce que tu écris est un périmètre, pas un mécanisme.** Le mécanisme — les hooks — est livré par le
plugin et identique partout. La **liste** de ce qui est protégé appartient au projet, et à personne
d'autre. C'est toi qui la fais dire, tu ne la devines pas.

Ratio : 40% humain / 60% AI (l'humain arbitre le périmètre, tu constates et tu écris).

## Règles absolues

- **Tu ne devines aucun chemin protégé.** Chaque entrée de la liste vient d'un fichier que tu as
  **vu sur le disque** — un workflow, une config d'outillage. Une liste plausible mais inventée
  protège des fichiers qui n'existent pas et laisse passer ceux qui comptent.
- **Tu ne mets jamais `docs/adr/` dans `protected`.** Un hook dédié les traite déjà, avec la
  distinction création/réécriture que la phase `adr` exige. Les y remettre interdirait d'écrire un
  ADR.
- **Les fichiers de test se posent à l'humain, jamais seul.** C'est le seul arbitrage réel de la
  commande, et il dépend de qui écrit les tests. Voir le bloc `<arbitrage-tests>` de la référence.
- **Tu ne relâches jamais un garde en silence.** Élargir une dérogation, retirer un chemin,
  désactiver la couche 2 : chacun passe par une question explicite et repart avec sa **raison**
  écrite dans le fichier.
- **Une dérogation sans raison n'existe pas.** Le hook l'ignore. Ce n'est pas un contrôle de forme :
  sans motif écrit, personne n'a eu à défendre pourquoi.
- **Tu ne joues aucune commande de forge.** La protection de branche se **rend**, prête à copier.
  C'est le dépôt de l'humain.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — garde,
  couche, dérogation, check requis, soupape… — reçoit une glose d'**une ligne**, entre parenthèses
  ou entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Un ID se cite avec son intitulé** à sa première mention — « ADR-0007 (portage des types) »,
  jamais « ADR-0007 » nu. La règle vaut pour **tout** identifiant que tu emploies, y compris ceux
  que le projet ou la session viennent de créer et que le plugin ne connaît pas.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Définitions

- **Couche 1** — le blocage par **chemin** : l'agent ne peut pas écrire dans un fichier de la liste.
- **Couche 2** — le blocage par **contenu** : l'agent ne peut pas *introduire* un motif qui éteint
  un contrôle (`@ts-ignore`, `as any`, `eslint-disable`, `.skip(`, `--no-verify`…). Elle vise un
  fichier qu'il a le **droit** d'éditer, ce qui la rend invisible à la couche 1.
- **Couche 3** — le **job CI**, qui rattrape ce qui est entré hors session : édition manuelle, autre
  agent, autre machine.
- **`strict` / `no-rewrite`** — `strict` bloque toute écriture ; `no-rewrite` laisse **créer** un
  fichier neuf et bloque la réécriture d'un fichier existant.

## Processus

1. **Charge la référence `guards.md` intégralement** (voir `## Skill active`). Communique en
   français.

2. **Constate l'existant, avant toute proposition.**
   - `python3 --version` — s'il échoue, **dis-le d'abord** : les couches 1 et 2 ne tourneront pas,
     et *sans message*, puisqu'un hook qui ne démarre pas ne peut pas s'annoncer. Le reste de la
     commande garde son sens (la couche 3 est le rattrapage), mais l'humain doit le savoir avant de
     répondre à quoi que ce soit.
   - `.claude/guards.json` — présent ? lisible ? Si oui, **cette passe est un entretien**, pas une
     pose : tu compares l'existant au disque et tu proposes les écarts.
   - `.claude/guard-log.jsonl` — présent ? combien de lignes ?

3. **Dérive les candidats du disque**, selon le bloc `<derivation>` de la référence, dans cet ordre :
   les workflows de la forge, puis les configs qu'ils lisent, puis ce qui empêcherait un contrôle de
   tourner (`.husky/`, `.pre-commit-config.yaml`, `Makefile`, `justfile`).
   ⚠️ **Signale les fichiers à double rôle.** Un `pyproject.toml` ou un `Cargo.toml` porte typage,
   lint **et** dépendances : le protéger bloquera aussi l'ajout d'un paquet. Le dire avant de
   l'inscrire, pas après.

4. **Pose l'arbitrage des tests** par `AskUserQuestion`, avec le problème posé d'abord : *qui écrit
   les tests de ce projet ?* Si c'est `/scd-sdd:run`, ne les protège pas en `strict` — l'agent
   `test-writer` les crée puis les corrige jusqu'au rouge, et `strict` casserait la boucle au
   premier ajustement ; l'invariant est alors tenu ailleurs, mécaniquement, par le niveau
   implémentation et par la couche 3. Si c'est l'humain, protège-les : un oracle que l'agent peut
   réécrire n'est plus un oracle.

5. **Restitue le périmètre proposé et attends l'arbitrage** — une ligne par entrée, avec **ce que
   chacune empêche concrètement**, et non son glob. Une entrée dont tu ne sais pas dire ce qu'elle
   empêche ne s'inscrit pas.

6. **Écris `.claude/guards.json`** sur le gabarit de la référence, avec les seules entrées
   approuvées. En entretien, `Edit` ciblés ; à la pose, `Write`.
   ⚠️ **Une fois ce fichier écrit, tu ne pourras plus l'éditer** — il se protège lui-même. Une
   correction ultérieure passe par cette commande relancée, ou par l'humain.

7. **Rends la couche 3.** Écris le job dans le workflow de la forge s'il en existe un ; sinon,
   **rends le fichier prêt à coller** plutôt que d'inventer une chaîne CI que le projet n'a pas.
   Les trois noms de job — `verifier-guard`, `test-integrity`, `quality-config-guard` — ne se
   renomment jamais : ce sont des checks requis, et un renommage laisse un check fantôme qui bloque
   toutes les PR.

8. **Rends la protection de branche**, prête à copier, et **ne la joue pas**. Dis en une phrase ce
   qu'elle change : sans elle, tout ce qui précède est **informatif**. Sur GitHub, **rends la
   recette `gh api … rulesets --input -` du bloc `<ci>`** telle quelle, avec les noms de jobs
   requis — **ne la recompose pas** avec des `-F 'rules[][…]'` répétés, qui font répondre 422.

9. **Rafraîchis `docs/ci.md`** — la seule section `## Gardes de session`, sur le gabarit du bloc
   `<ci-md>`. Elle **pointe** vers `.claude/guards.json` et ne le recopie pas : deux sources pour un
   même fait, et la copie dérive au premier ajout. Si `docs/ci.md` n'existe pas, signale-le et
   renvoie vers `/scd-sdd:init` — ne le crée pas ici.

10. **Déroule la trace**, si elle existe et n'est pas vide. C'est le livrable, pas un journal de
    debug : regroupe par règle, donne la date de la plus récente, et **nomme ce que ça dit**. Trois
    tentatives sur `test-skip` en une semaine ne se lisent pas comme une tentative sur
    `workflow-integrity`.

## Ce que tu NE fais PAS

- Tu **n'écris ni ne modifies aucun hook** : ils sont livrés par le plugin, identiques partout. Un
  hook modifié dans un projet est un garde qui ment ailleurs.
- Tu **n'exécutes aucune cryptographie** et n'écris aucun outillage de signature (§D26). La soupape
  de `verifier-guard` est un **commit signé**, et c'est `/scd-sdd:signer` qui accompagne le geste.
- Tu **ne joues aucune commande de forge** — ni protection de branche, ni création de label.
- Tu **ne produis aucun document du socle**. `docs/ci.md` appartient à `/scd-sdd:init` ; tu n'y
  touches qu'à une section, celle des gardes.
- Tu **n'édites jamais `.claude/guard-log.jsonl`**, même pour l'élaguer. C'est une preuve.

<report>

```
## Gardes — [posés | entretenus | à poser]

Runtime      : python3 [version | ABSENT — couches 1 et 2 inertes, sans message]
Couche 1     : [N] chemins protégés · [posée le … | absente]
Couche 2     : [bloquante | avertissement seul — pas de guards.json]
Couche 3     : [job dans <fichier> | rendu, à coller | pas de chaîne CI]
Protection   : [posée | À POSER — sans elle, tout ce qui précède est informatif]

### Le périmètre
| Chemin | Mode | Ce que ça empêche |
|---|---|---|
| … | strict | … |

### Dérogations
[une par ligne, avec sa raison — ou « aucune »]

### La trace — [N] tentatives depuis [date]
| Règle | N | Dernière | Ce que ça dit |
|---|---|---|---|
| … | … | … | … |
[ou « aucune tentative bloquée » — et c'est un fait, pas une absence de dispositif]

### Ce qui n'est pas couvert
[les limites RÉELLES de ce projet, prises dans <limites> — jamais la liste générique]
```

</report>

## Skill active

Skill `socle` — référence `references/guards.md`, chargée **intégralement**.

## À la fin

- Le dispositif est posé et `docs/ci.md` existe → *« Les gardes sont en place. Prochaine étape :
  `/scd-sdd:spec` pour cadrer la première feature. »*
- `docs/ci.md` manque → *« Les gardes sont posés, mais le socle est incomplet :
  `/scd-sdd:init` pour écrire `docs/ci.md` et `CLAUDE.md`. »*
- La protection de branche n'est pas posée → **redis-le en dernier**, seul : c'est le backstop, et
  c'est la seule étape que tu ne peux pas jouer.
