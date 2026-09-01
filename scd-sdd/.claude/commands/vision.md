---
description: "Pose ou entretient la vision produit — docs/vision.md, l'artefact OPTIONNEL au-dessus des features : le north star, les exigences FR, les critères de succès SC, la stack sur laquelle le produit est bâti (CONSTATÉE — le pourquoi d'un choix structurant reste un ADR), les préoccupations par domaine (architecture, sécurité, UX/UI…) qui servent de base aux ADR, et un découpage epic → feature où chaque epic nomme ses features par NNN. Deux gestes qui s'excluent : elle SYNTHÉTISE ou RÉVISE quand il y a de la matière (un docs/vision.md existant, une archive docs/1.x/, ou la conversation), et elle INTERVIEWE quand il n'y en a aucune — le seul endroit du cycle où l'interview revient, parce qu'une vision écrite de zéro n'a rien à compiler. Aucune gate, relue par l'humain. Rejouable."
argument-hint: "[l'idée du produit — optionnel si la conversation ou une archive la porte déjà]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
  - Bash(git log *)
---

## Contexte

Tu poses la **vision produit** : un artefact **optionnel**, un cran **au-dessus de la feature**,
que rien d'autre ne porte. Le `SPEC.md` d'une feature dit son pourquoi **local** ; `docs/vision.md`
dit le pourquoi du **produit entier**, ses exigences (`FR`), ses critères de succès (`SC`), la
stack sur laquelle il est bâti (**constatée**, jamais argumentée), les préoccupations durables par
domaine qui **nourrissent les ADR**, et un découpage `epic → feature`.

**Tu as deux gestes, et ils s'excluent — comme `/scd-sdd:init` assemble ou révise.** Lequel se
décide en **constatant la matière disponible**, jamais en demandant :

- **`docs/vision.md` existe** → tu **révises** section par section. Tu **ne ré-assembles jamais** :
  une ligne que le gabarit ne prévoit pas est **présumée légitime**, elle subit le test de
  suppression comme les autres — pas « hors gabarit donc à retirer ». Ré-assembler écraserait tout
  ajout humain (le mode de défaillance de §D29).
- **Une archive `docs/1.x/{brief,prd,produit,stack,technique}.md` est présente** (projet repris par
  `/scd-sdd:migrate`) → tu **synthétises depuis l'archive comme matière première**, exactement comme
  `/init`, `/spec` et `/tickets` réécrivent le `2.0.0` depuis `docs/1.x/`. Tu confirmes avec
  l'humain avant d'écrire.
- **La conversation porte déjà le produit** → tu **synthétises ce qui a été dit**, à la manière de
  `/scd-sdd:spec`. Tu ne relances pas un questionnaire.
- **Rien de tout cela** → tu **interviewes**. C'est le **seul endroit du cycle où l'interview
  revient**, et c'est délibéré : §D41 l'a retirée au niveau feature parce que la conversation y
  porte déjà le contenu, mais une vision produit écrite de zéro n'a **aucun signal antérieur à
  compiler**. Tu **dis que tu interviewes et pourquoi**, et tu restes **borné** — vision, `FR`, `SC`,
  domaines, epics initiaux, pas trente tours.

L'interview s'arrête à cette commande : `/scd-sdd:spec` n'interviewe **jamais**.

Ratio : 40% humain / 60% AI (tu constates, tu synthétises, tu rédiges ; l'humain détient la vision
et arbitre).

## Règles absolues

- **Tu constates la matière avant de choisir ton geste.** Le geste ne se demande pas : `docs/vision.md`,
  `docs/1.x/`, la conversation, `specs/*/` sur le disque — tu regardes, puis tu branches.
- **`docs/vision.md` existant → révision, sans exception.** Édition chirurgicale, jamais un
  ré-assemblage. Une ligne inconnue est présumée légitime ; en cas de doute sur son origine,
  `git log -S'<extrait>' -- docs/vision.md`.
- **`FR`/`SC` vivent ici, et le `SPEC.md` y renvoie sans les recopier.**
- **Un domaine porte des préoccupations, jamais des décisions.** Tu n'écris ici **aucun invariant,
  aucun chemin de fichier, aucune décision**.
- **La stack se constate, elle ne s'argumente pas.** Une ligne par élément — le rôle, jamais la
  version exacte (les manifestes du dépôt la portent) ; le *pourquoi* d'un choix structurant est un
  ADR que la ligne cite. Rien de choisi → la section s'omet, et un choix en cours part en candidat.
- **L'horizon est au niveau epic (Now/Next/Later), jamais feature.** Tu ne coches **aucun**
  avancement de feature.
- **Lien descendant seul.** L'epic nomme ses features par `NNN`. Tu ne touches à **aucun** `SPEC.md`.
- **Aucune gate, aucun verdict.** La relecture humaine est la seule validation — dis-le, plutôt que
  de laisser croire qu'un contrôle suivra.
- **Tu n'écris aucun ADR.** Une décision structurante qui surgit part en brouillon dans
  `docs/adr/_candidates/`, avec renvoi vers `/scd-sdd:adr`. Une **préoccupation** n'est pas une
  décision : elle reste dans `docs/vision.md`.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce produit, et en quoi les options diffèrent vraiment. Une option
  énoncée sans son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — `FR`, `SC`,
  epic, préoccupation, ADR, advisory… — reçoit une glose d'**une ligne**. Jamais deux fois, et
  **plus du tout dès que l'humain emploie le terme lui-même**.
- **Un ID se cite avec son intitulé** à sa première mention — « FR-2 (export CSV) », jamais « FR-2 »
  nu. La règle vaut pour tout identifiant, y compris ceux que la session vient de créer.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Processus

1. **Charge la référence `vision.md`** (voir `## Skill active`). Communique en français.

2. **Constate la matière, avant tout.** `docs/vision.md` existe-t-il ?
   `docs/1.x/{brief,prd,produit,stack,technique}.md` existe-t-il (projet repris) ? La conversation
   porte-t-elle déjà le produit ? Et `specs/*/` : quelles features sont déjà sur le disque, qu'un
   découpage devra ranger ? La **stack**, elle, se lit d'abord dans le dépôt — manifestes,
   lockfiles, configs : tu la constates avant de la demander. **Annonce ce que tu as trouvé et le
   geste que tu en tires** avant d'écrire — c'est ce qui rend la suite crédible.

3. **Branche sur la matière.**
   - `docs/vision.md` présent → **révision** : charge la doctrine d'entretien, déroule section par
     section, rends les éditions proposées et attends l'arbitrage. **« Aucune édition » est un
     résultat valide.**
   - archive `docs/1.x/` présente **ou** conversation porteuse → **synthèse** : compile la matière,
     propose, fais corriger.
   - rien → **interview bornée** : dis que tu interviewes et pourquoi, puis élicite dans cet ordre —
     la **vision** (une question ouverte), les **`FR`**, les **`SC`**, la **stack** (une question de
     constat — rien de choisi est une réponse complète, la section s'omet), les **préoccupations par
     domaine**, les **epics** initiaux. Une question à la fois si l'humain hésite ; tu t'arrêtes dès
     que le squelette tient, pas quand il est parfait.

4. **Range les features existantes.** `specs/*/` déjà peuplé → **propose** de placer chaque feature
   sous un epic, par son `NNN` et son titre. L'humain arbitre le rangement ; tu ne l'inventes pas.

5. **Écris ou révise `docs/vision.md`** sur le `<template>`. Une poignée de puces par domaine ; une
   ligne par feature. Ce qui déborde en profondeur est un ADR ou une spec, pas une rallonge d'ici.

6. **Dépose les décisions structurantes rencontrées** en brouillon dans `docs/adr/_candidates/`, et
   **nomme-les** dans le rapport. Une préoccupation de domaine n'est pas un candidat ADR : elle reste
   dans le fichier, et c'est `/scd-sdd:adr` qui viendra la trancher plus tard.

7. **Rends à relire.** C'est la seule validation. Signale les préoccupations de domaine encore
   ouvertes que `/scd-sdd:adr` pourra figer.

## Ce que tu NE fais PAS

- Tu **n'interviewes pas quand il y a de la matière** — tu synthétises ou tu révises. L'interview est
  le geste du dépôt vide, pas le geste par défaut.
- Tu **ne rends aucun verdict** et ne poses aucun marqueur d'ambiguïté : il n'y a pas de gate.
- Tu **n'écris aucun ADR** ni ne touches à `docs/adr/NNNN-*.md`. Ni `CLAUDE.md`, ni `docs/ci.md`, ni
  `.claude/guards.json`.
- Tu **ne touches à aucun `SPEC.md`** ni à aucun ticket.
- Tu **ne coches aucun avancement de feature** : l'état se dérive du disque, il ne se tient pas ici.
- Tu **n'inscris aucune décision, aucun invariant, aucun chemin de fichier** dans un domaine — ce
  sont des ADR.
- Tu **n'écris aucun code** et n'exécutes aucun test.

<report>

```
## Vision — docs/vision.md [posée par interview | synthétisée | révisée]

Matière     : [aucune → interview | archive docs/1.x/ | conversation | fichier existant]
FR · SC     : [N] exigences · [M] critères de succès
Stack       : [N] éléments, [constatée du dépôt | dite par l'humain] — ou « omise (rien de choisi) »
Domaines    : [N] préoccupations sur [architecture, sécurité, UX/UI, …]
Epics       : [N] · features rangées : [M]/[total sur disque]

### Ce qu'il faut relire en priorité
[Les deux ou trois points où tu as tranché sans que l'humain l'ait dit explicitement.]

### Préoccupations de domaine encore ouvertes
[une ligne par ARCH-*/SEC-*/UX- que /scd-sdd:adr pourrait figer — ou « aucune »]

### Décisions structurantes déposées en candidat
[une ligne par brouillon dans docs/adr/_candidates/ — ou « aucune »]

### Ce que je n'ai pas pu établir
[une ligne par trou réel — ou « rien »]
```

</report>

## Skill active

Skill `socle` — référence `references/vision.md`, chargée **intégralement**. En mode révision,
elle porte aussi la doctrine « une ligne inconnue est présumée légitime » ; en mode interview, le
`<template>` est le squelette à remplir.

## À la fin

*« Relis `docs/vision.md` — c'est la seule validation de ce document, il n'y a pas de gate derrière.
Il est optionnel : rien du cycle n'en dépend, mais `/scd-sdd:spec` l'utilisera pour ancrer une
feature sous un epic. »*

- Des préoccupations de domaine sont ouvertes → **dis-le séparément** : *« [N] préoccupations
  (`ARCH-*`, `SEC-*`, `UX-*`) attendent une décision : `/scd-sdd:adr` viendra les trancher. »*
- Des candidats ADR ont été déposés → *« [N] décisions structurantes attendent d'être figées :
  `/scd-sdd:adr`. »*
