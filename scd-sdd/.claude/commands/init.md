---
description: "Ouvre un projet, ou entretient son contrat. Pose les trois artefacts du socle en UNE conversation courte — docs/ci.md (les commandes du projet et ce qui bloque une PR), CLAUDE.md (conventions, Definition of Done, glossaire du domaine) et l'arborescence docs/adr/ — puis appelle /scd-sdd:guards. Pas d'interview : elle CONSTATE le dépôt et ne demande que ce qui ne s'y lit pas. Rejouable — sur un CLAUDE.md existant elle RÉVISE section par section et ne ré-assemble jamais."
argument-hint: "(aucun — constate le dépôt, puis demande ce qui manque)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
  - Bash(git log *)
  - Bash(git rev-parse *)
  - Bash(mkdir -p *)
---

## Contexte

Tu ouvres le socle d'un projet : **trois artefacts, une conversation**. Le cycle `1.x` demandait
quatre interviews « une question à la fois » pour cinq documents ; c'est exactement le coût que la
refonte supprime (`DECISIONS.md` §D41).

Ce qui remplace l'interview : **tu constates**. Un dépôt dit son langage, son gestionnaire de
paquets, ses scripts, ses workflows, ses conventions. Tu ne demandes que ce qui ne s'y lit pas — le
domaine, le *pourquoi* des conventions non-standard, et les arbitrages.

**Elle est rejouable, et son second geste n'est pas le premier.** `CLAUDE.md` absent → tu
**assembles**. Présent → tu **révises**, section par section, et **jamais** tu ne ré-assembles : un
ré-assemblage écraserait tout ajout humain, et c'est le mode de défaillance que §D29 a documenté,
pas la voie de mise à jour.

Ratio : 40% humain / 60% AI (tu constates et tu rédiges ; l'humain arbitre et donne le domaine).

## Règles absolues

- **Tu constates avant de demander.** Toute question dont la réponse est sur le disque est une
  question de trop, et elle décrédibilise les autres.
- **Aucune commande inventée.** La table « Commandes du projet » de `docs/ci.md` ne porte que des
  commandes **lues** dans un `package.json`, un `Makefile`, un workflow. Ce que tu ne trouves pas
  reste `[à compléter]` et se **signale** — une commande plausible que la CI n'exécute pas est pire
  qu'un trou déclaré.
- **`CLAUDE.md` existant → mode révision, sans exception.** Tu charges `<guidance>` et `<revision>`,
  **pas** `<template>`. Une ligne que le template ne prévoit pas est **présumée légitime** : elle
  subit le test de suppression comme les autres, jamais « hors template donc à retirer ».
- **Tu ne poses aucun garde toi-même.** Le périmètre protégé appartient à `/scd-sdd:guards`, qui a
  la référence et l'arbitrage. Tu l'appelles ; tu ne la doubles pas.
- **Tu n'écris aucun ADR.** Une décision qui surgit pendant cette conversation part en brouillon
  dans `docs/adr/_candidates/`, et tu renvoies vers `/scd-sdd:adr`. Le hook d'immutabilité
  t'empêcherait de toute façon de corriger un ADR mal écrit.
- **Le glossaire est du domaine, pas de la technique.** Un terme que le code explique n'y entre pas.
  Quinze lignes est déjà beaucoup.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — ADR, garde,
  advisory, Definition of Done, check requis… — reçoit une glose d'**une ligne**, entre parenthèses
  ou entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Un ID se cite avec son intitulé** à sa première mention — « ADR-0003 (import de `db/` interdit
  hors de `server/`) », jamais « ADR-0003 » nu. La règle vaut pour **tout** identifiant que tu
  emploies, y compris ceux que le projet ou la session viennent de créer.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Processus

1. **Constate le dépôt, avant toute question.** Le langage et le gestionnaire de paquets ; les
   scripts (`package.json`, `Makefile`, `justfile`, `pyproject.toml`, `Cargo.toml`) ; les workflows
   de la forge ; les configs d'outillage ; l'existence de `CLAUDE.md`, `docs/ci.md`, `docs/adr/`,
   `.claude/guards.json`. `git log --oneline -15` pour l'allure du projet et la convention de
   messages.
   **Annonce ce que tu as trouvé en cinq lignes** avant de demander quoi que ce soit : c'est ce qui
   rend les questions suivantes crédibles.

2. **Branche sur l'état.**
   - `CLAUDE.md` **absent** → assemblage : charge `<template>`, `<guidance>`, `<completion>`, et le
     bloc `<ci-md>` de `references/guards.md`. Poursuis en 3.
   - `CLAUDE.md` **présent** → révision : charge `<guidance>` et `<revision>` **seuls**, saute aux
     étapes 7 et 8, puis 9.
   - Traces d'un projet `1.x` → **arrête-toi** et renvoie vers `/scd-sdd:migrate`. Écrire
     par-dessus laisserait deux vocabulaires concurrents dans le même dépôt. Le cycle `1.x` a eu
     **deux formes**, et il faut chercher les deux : `docs/produit.md` et `docs/technique.md`
     après la fusion `1.19.0`, `docs/brief.md`, `docs/prd.md`, `docs/stack.md` et `docs/archi.md`
     avant — plus `docs/journal/` et `specs/*/tasks.md`, communs aux deux.
     ⚠️ `docs/1.x/` n'est **pas** une trace : c'est l'archive que `/scd-sdd:migrate` vient
     d'écrire, et sa présence signifie que la reprise est faite. Elle est hors de ta lecture.

3. **Scaffolde ce qui manque**, et rien de plus : `docs/`, `docs/adr/`, `docs/adr/_candidates/`,
   `docs/chantiers/{en-cours,en-attente,archive}/`, `specs/`. Un répertoire existant n'est pas
   touché.

4. **Fais dire le domaine.** C'est la seule chose qu'aucun dépôt ne contient, et c'est ce que `spec`
   et `tickets` réemploieront. Une question ouverte — *de quoi ce projet parle-t-il, dans les mots
   du métier ?* — puis tu proposes le glossaire et tu le fais corriger. Cinq à quinze termes ; un
   terme dont tu as inventé la définition est un défaut, pas une amorce.

5. **Écris `docs/ci.md`** sur le bloc `<ci-md>`, **sauf** la section `## Gardes de session`, qui
   appartient à `/scd-sdd:guards`. Les commandes se lisent (règle absolue) ; les contrôles se
   proposent selon l'écosystème constaté ; la section *Ce que ces contrôles ne couvrent pas*
   s'écrit **nommée sur ce projet** — les amorces génériques recopiées telles quelles sont un
   remplissage, et elles font croire à une couverture instruite.

6. **Écris `CLAUDE.md`** sur le `<template>`. Vise **60-90 lignes**, plafond 200. Chaque convention
   non-standard porte **son pourquoi**. La section Renvois est admise **vide** : un projet neuf n'a
   ni skill ni rule, et elle existe pour que l'entretien futur ait où déplacer ce qu'il retire.

7. *(Révision seulement)* **Déroule les deux volets** du bloc `<revision>` — le mécanique
   (4 contrôles, tranchés sans jugement) puis celui de jugement (6 contrôles, chacun rend un
   constat). En cas de doute sur l'origine d'une ligne, `git log -S'<extrait>' -- CLAUDE.md`.

8. *(Révision seulement)* **Rends deux listes séparées et attends l'arbitrage** : les **éditions
   proposées** — section, extrait visé, geste, motif en une phrase — puis les **signalements**, qui
   ne s'approuvent pas et n'ouvrent sur aucune écriture. Applique ensuite par `Edit` ciblés, un par
   édition retenue. **« Aucune édition » est un résultat valide** et se dit.

9. **Appelle `/scd-sdd:guards`.** Sans les gardes, `CLAUDE.md` n'est qu'un conseil et `docs/ci.md`
   n'est qu'une intention : dis-le en une phrase plutôt que de le laisser deviner.

## Ce que tu NE fais PAS

- Tu **n'interviewes pas**. Pas de questionnaire, pas de « une question à la fois » sur dix tours :
  c'est ce que la refonte a retiré.
- Tu **n'écris aucun ADR** — brouillon dans `_candidates/` et renvoi vers `/scd-sdd:adr`.
- Tu **n'écris pas la section `## Gardes de session`** de `docs/ci.md`, ni `.claude/guards.json`,
  ni aucun hook.
- Tu **ne ré-assembles jamais** un `CLAUDE.md` existant, même s'il te paraît mauvais. Tu le révises,
  ou tu dis pourquoi tu ne peux pas.
- Tu **ne produis aucune spec de feature**. Le *pourquoi* d'une feature vit dans son `SPEC.md`, et
  c'est `/scd-sdd:spec` qui l'écrit.
- Tu **ne joues aucune commande de forge** et n'exécutes aucun test.

<report>

```
## Socle — [posé | révisé]

Constaté     : [langage/runtime] · [gestionnaire] · [forge, ou « aucune CI »]
docs/ci.md   : [écrit | révisé] · [N] commandes lues, [M] en [à compléter]
CLAUDE.md    : [écrit | révisé] · [N] lignes (cible 60-90, plafond 200)
Glossaire    : [N] termes
docs/adr/    : [créé, vide | N ADR existants] · [_candidates/ : N brouillons]

### Ce qui reste [à compléter]
[une ligne par trou, avec ce qu'il empêche — ou « aucun »]

### Décisions rencontrées, non figées
[une ligne par candidat ADR déposé dans _candidates/ — ou « aucune »]
```

*(En révision, remplace les trois premières lignes par les deux listes du bloc `<revision>` :
éditions proposées, puis signalements.)*

</report>

## Skill active

Skill `socle` :
- `references/claude-md.md` — **tout sauf `<revision>`** en assemblage ; **`<guidance>` et
  `<revision>` seuls** en révision. Les deux ne se chargent jamais ensemble.
- `references/guards.md` — le **bloc `<ci-md>` seul**, pour le gabarit de `docs/ci.md`.

## À la fin

- Socle posé, gardes non posés → *« Le socle est écrit. Il ne bloque encore rien : `/scd-sdd:guards`
  pour poser les gardes et rendre le job CI. »*
- Socle posé et gardes en place → *« Prochaine étape : `/scd-sdd:spec` pour cadrer la première
  feature. »*
- Décisions déposées en `_candidates/` → **dis-le séparément** : *« [N] décisions attendent d'être
  figées : `/scd-sdd:adr`. »*
