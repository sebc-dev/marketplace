---
description: "Entretien de CLAUDE.md, hors cycle : révise un contrat EXISTANT contre une checklist à deux volets — mécanique (dérive de la section Commandes contre docs/ci.md, taille, pointeurs, en-tête de maintenance) et de jugement (test de suppression, procédure réinstallée, garde-fou en prose, style manuscrit, contradiction, déductible du dépôt). Rend ses constats en deux listes, attend l'arbitrage humain, puis applique par Edit ciblés. Elle entretient et ne ré-assemble jamais. Pas une phase : rejouable, jamais réclamée par status."
argument-hint: "(aucun — lit CLAUDE.md et la table des commandes de docs/ci.md)"
allowed-tools:
  - Read
  - Glob
  - Edit
  - AskUserQuestion
---

## Contexte

Tu **entretiens** `CLAUDE.md`, le contrat opérationnel chargé à chaque session — un fichier qui
existe déjà et que personne ne relit.

Le cycle sait l'écrire une fois : c'est la phase `contract`. Il ne sait pas le maintenir. Or il
dérive, et d'abord par un endroit précis : la section **Commandes** est recopiée de la table
« Commandes du projet » de `docs/ci.md` au caractère près, et **rien ne rejoue cette recopie quand
`ci` est rejoué**. C'est la section que `/scd-sdd:kickoff-feature` consomme. Deux vérités
concurrentes s'installent sans que rien ne les signale.

La seule issue apparente est piégée : **rejouer `contract` ré-assemble depuis le template**, donc
écrase les remédiations de `premortem socle` et tout ajout humain. C'est une voie de destruction
qui a l'air d'une voie de mise à jour — et c'est pourquoi cette commande existe séparément.

Trois écrivains, trois gestes qui ne se recouvrent pas : `contract` **assemble**, une fois ;
`premortem socle` **durcit**, en ajoutant un principe ou un item de DoD ; toi, tu **entretiens** —
tu retires, tu resynchronises, tu déplaces vers un renvoi. Tu n'enrichis pas.

Ce n'est **pas une phase** : aucun `status` ne la réclame, elle se rejoue à volonté, et « aucune
édition » est un résultat parfaitement valide.

Ratio : 50% humain / 50% AI (la machine détecte et propose, l'humain tranche chaque édition).

## Règles absolues

- **Une ligne inconnue du template est présumée légitime.** C'est la règle qui commande tout le
  reste. Elle subit le test de suppression comme les autres — jamais « hors template, donc à
  retirer ». Traiter le template comme un référentiel de conformité ferait de toi le destructeur
  que tu remplaces. Tu ne charges d'ailleurs pas le `<template>`, et c'est délibéré.
- **Tu n'édites que `CLAUDE.md`.** Rien d'autre, jamais, en dehors de ta ligne de journal.
- **Tu entretiens, tu ne ré-assembles jamais.** Aucune section n'est réécrite en bloc, aucune ligne
  n'est produite de ton cru. Enrichir le contrat appartient à `premortem socle`.
- **La section Commandes n'a qu'une source et qu'un sens de correction** : elle se resynchronise
  **depuis** `docs/ci.md`, jamais l'inverse. Un `[à compléter]` se reporte tel quel et se signale —
  c'est un trou de la phase `ci`, pas une décision à prendre ici.
- **Rien n'est écrit avant l'arbitrage humain.** Tu proposes, il tranche, tu appliques ce qui a été
  retenu et rien de plus.
- **Signaler n'est pas écrire.** Un skill à créer, une rule path-scopée, un hook, un trou de
  `docs/ci.md` : tu les **nommes**, présentés à part. Tu n'en crées aucun — tu n'as ni l'outil pour
  écrire un fichier neuf, ni celui pour exécuter quoi que ce soit.

## Processus

1. **Vérifie les préconditions.**
   - `CLAUDE.md` **absent** → **arrête-toi** et renvoie vers `/scd-sdd:contract`. L'entretien ne
     crée rien : il n'y a pas de contrat à réviser.
   - `docs/ci.md` **absent** → le volet mécanique n° 1 est **impossible**. Signale-le, renvoie vers
     `/scd-sdd:ci`, et **poursuis** le reste de la checklist : les autres contrôles tiennent seuls.

2. **Charge les deux blocs** : `references/claude-md.md` du skill `project-docs`, blocs
   **`<guidance>`** et **`<revision>`** — et **eux seuls**. Le `<template>` est exclu, la référence
   dit pourquoi. Lis ensuite `CLAUDE.md` **en entier**, et la table « Commandes du projet » de
   `docs/ci.md`.

3. **Passe le volet mécanique** — les 4 contrôles du bloc `<revision>`, tranchés sans jugement. La
   taille se lit sur les numéros de ligne que `Read` te rend ; chaque pointeur se vérifie par
   `Glob` — un `@chemin` ou un chemin en backticks qui ne résout pas fait croire à un document.

4. **Passe le volet de jugement** — les 6 contrôles du même bloc. Chacun rend un **constat**,
   jamais une édition. En cas de doute sur l'origine d'une ligne, applique le contrôle de
   provenance décrit dans le bloc : une ligne apparue après une passe de durcissement a un écrivain
   connu, et son retrait se propose **avec ce fait**, jamais sans.

5. **Rends le rapport en deux listes séparées**, dans la forme que fixe le bloc `<revision>` : les
   **éditions proposées** — une par ligne, numérotée : section, extrait visé, geste (retirer ·
   resynchroniser · déplacer vers un renvoi), motif en une phrase —, puis les **signalements** —
   mécanisme visé, ce qui y appartiendrait, qui doit le créer. Si les deux listes sont vides,
   dis-le : le contrat tient tel quel.

6. **Gate humain.** Demande lesquelles appliquer — toutes, une sélection par numéro, ou aucune.
   - ≤ 4 éditions proposées → `AskUserQuestion` avec `multiSelect` ;
   - au-delà → présente la liste numérotée et attends la réponse en clair.

   Les **signalements ne s'approuvent pas** : ils ne débouchent sur aucune écriture. Ils se
   rappellent à la fin. Si l'humain ne retient aucune édition, passe directement au journal — c'est
   un résultat, pas un échec.

7. **Applique par `Edit` ciblés** — un `Edit` par édition approuvée, sur l'extrait exact visé par le
   constat. Jamais de réécriture d'une section entière, jamais de réécriture du fichier. Tu ne
   touches à aucune ligne que le rapport ne nommait pas, et à aucune que l'humain n'a pas retenue.

8. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu ne ré-assembles jamais `CLAUDE.md` depuis le template, sous aucun prétexte — c'est le mode de
  défaillance que cette commande ferme, pas un raccourci disponible.
- Tu ne retires aucune ligne au motif qu'elle est hors template.
- Tu n'ajoutes aucun principe, aucun item de Definition of Done, aucune convention de ton cru : ni
  ceux qui te sembleraient manquants, ni ceux que la checklist ferait apparaître en creux.
- Tu ne crées ni skill, ni rule, ni hook, ni fichier d'aucune sorte — tu les nommes.
- Tu ne corriges pas `docs/ci.md` depuis `CLAUDE.md`, et tu ne complètes aucun `[à compléter]`.
- Tu ne crées pas `CLAUDE.md` s'il manque, et tu ne touches à aucun autre document du socle.
- Tu n'écris rien avant que l'humain ait tranché.

## Consigne au journal

L'entretien **modifie `CLAUDE.md` sans y laisser le moindre marqueur**, et son résultat ne se dérive
d'aucun fichier : combien de lignes sont parties, si la section Commandes a dû être resynchronisée,
combien de signalements restent ouverts. Sans cette ligne, la passe est invisible.

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`, par `Edit` ciblé
(crée le fichier s'il manque) :

- **Phase** : `revise-contract`
- **Résultat** : taille avant → après · état de la section Commandes · nb de signalements.
  Exemple : `104 lignes → 87 · Commandes resynchronisées (2 écarts) · 3 signalements`.

Une révision **sans aucune édition** se consigne aussi : `92 lignes · Commandes alignées · 0
signalement — contrat inchangé`. C'est un résultat, pas une absence de fait, et l'absence de ligne
se lirait comme une révision jamais jouée.

## Skill active

- `project-docs` — charge `references/claude-md.md`, blocs **`<guidance>`** et **`<revision>`**
  uniquement.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Rappelle, dans cet ordre :

1. **Les signalements**, s'il y en a — c'est le seul résultat de la passe qui n'est écrit nulle
   part. Nomme pour chacun le mécanisme visé et la commande qui doit le porter.
2. **Les quatre déclencheurs** qui justifient de rejouer cette révision : Claude refait la même
   erreur une 2ᵉ fois · une revue attrape ce qu'il aurait dû savoir · on retape la même correction ·
   un nouveau coéquipier aurait cherché ce contexte. Hors de ces cas, l'ajout est probablement du
   bruit.
3. **Ne pas rejouer `/scd-sdd:contract`** sur ce projet : il ré-assemblerait depuis le template et
   écraserait ce que le premortem et l'humain ont ajouté. L'entretien passe par ici, et seulement
   par ici.
