---
name: socle
description: |
  Le SOCLE d'un projet — trois artefacts écrits une fois, et les GARDES qui les rendent
  autre chose que des conseils. `docs/adr/NNNN-*.md` (décisions structurantes, immuables),
  `docs/ci.md` (ce qui décide qu'une PR passe) et `CLAUDE.md` (conventions, commandes,
  Definition of Done, glossaire de domaine). Porte la frontière advisory / déterministe et
  la façon dont le plugin la franchit : un texte que l'agent lit ne le contraint pas, donc
  la défense vient de l'extérieur de l'agent — hooks de session livrés par le plugin,
  périmètre possédé par le projet. Se charge pendant /scd-sdd:init, adr, guards et signer.
  Porte UNIQUEMENT le socle — ni la spec d'une feature ni son découpage en tickets (skill
  specs), ni l'implémentation d'un ticket (skill implement), ni le travail hors cycle
  (skill chantier).
---

# Le socle : trois artefacts, et ce qui les fait tenir

Trois documents, écrits une fois au démarrage, relus rarement. Ce qui les distingue des cinq
documents du cycle `1.x` : **aucun n'est produit par une interview**, et **aucun n'est jugé par une
gate**. Ils existent parce que quelque chose en aval les lit — pas pour attester d'un travail.

| Document | Ce qu'il porte | Qui le lit ensuite |
|---|---|---|
| `docs/adr/NNNN-*.md` | une décision structurante, son contexte, ses conséquences | `/scd-sdd:spec`, `/scd-sdd:tickets`, la review (`review-context` → `architecture-reviewer`) |
| `docs/ci.md` | les commandes du projet, les contrôles qui bloquent, ce qu'ils **ne** couvrent pas | `CLAUDE.md`, `/scd-sdd:guards`, `/scd-sdd:signer` |
| `CLAUDE.md` | conventions, commandes, Definition of Done, **glossaire de domaine** | toute session, chargé en entier |

## La frontière qui commande tout

`CLAUDE.md` est **advisory** — il conseille l'agent, rien ne l'exécute. C'est sa nature, pas son
défaut : un contrat chargé dans chaque session doit être court et lisible, et un texte ne bloque
rien.

Ce qui bloque est ailleurs, et à deux endroits : les **contrôles de CI** (`docs/ci.md`), qui
mesurent le code livré, et les **gardes de session** (`.claude/guards.json`), qui surveillent
l'agent pendant qu'il écrit. Le terrain de `DECISIONS.md` §D22 est ce qui justifie les seconds — un
agent a contourné des hooks pre-commit sur **six commits consécutifs** malgré des règles
`CLAUDE.md` explicites. **La défense doit venir de l'extérieur de l'agent.**

Le partage entre le plugin et le projet suit de là (§D41) : le plugin porte le **script**, identique
partout ; le projet porte la **liste**, qu'il possède et que le plugin ne devine jamais.

## Le glossaire vit dans `CLAUDE.md`, et c'est un choix

Le vocabulaire du domaine — les mots que `spec`, `tickets` et les reviewers doivent employer —
tient en une quinzaine de lignes et se paie **une fois**, dans un fichier de toute façon chargé en
entier. Un fichier séparé serait un document de plus que personne ne relit : le mode de défaillance
que §D29 nomme.

## Un seul écrivain pour `CLAUDE.md`, et deux gestes qui s'excluent

`/scd-sdd:init` **assemble** un contrat absent et **entretient** un contrat existant. Jamais les
deux, et **jamais un ré-assemblage sur un fichier qui existe** : ce serait écraser tout ajout
humain — le mode de défaillance documenté en §D29, pas la voie de mise à jour.

C'est ce qui commande le chargement de `references/claude-md.md` : `<template>` **ou** `<revision>`,
jamais ensemble. Cacher le template pendant la révision est délibéré — le traiter comme un
référentiel de conformité ferait retirer toute ligne qu'il ne prévoit pas, alors qu'**une ligne
inconnue est présumée légitime**.

## Les références

| Référence | Ce qu'elle porte | Chargée par |
|---|---|---|
| `references/guards.md` | les trois couches de gardes, `.claude/guards.json`, le job CI, le gabarit de `docs/ci.md`, les limites déclarées | `/scd-sdd:guards` (intégrale) · `/scd-sdd:init` (bloc `<ci-md>` seul) |
| `references/claude-md.md` | le contrat : gabarit, doctrine, table de promotion, checklist d'entretien | `/scd-sdd:init` — **tout sauf `<revision>`** en assemblage, **`<guidance>` + `<revision>` seuls** en révision |
| `references/adr.md` | le format Nygard, les deux sources de candidats, le critère `Vérifiable ?` | `/scd-sdd:adr` (intégrale) |
| `references/signature.md` | la soupape de `verifier-guard` : registre de clés, vérification hors ligne, modèle de menace | `/scd-sdd:guards`, **étape 7 et conditionnelle** — seulement si le garde est retenu |

⚠️ **`/scd-sdd:signer` ne charge aucune référence**, et c'est délibéré (§D40, écarté n° 3) : ce dont
elle a besoin est dans le `docs/ci.md` **du projet** et dans ses workflows, pas dans le plugin. Une
liste de motifs figée ici dériverait pour tous les projets à la fois.

## Deux écrivains pour `docs/ci.md`, et leurs portées ne se recouvrent pas

`/scd-sdd:init` écrit le document et toutes ses sections **sauf une** ; `/scd-sdd:guards` écrit et
rafraîchit la seule `## Gardes de session`, qui **pointe** vers `.claude/guards.json` et ne le
recopie jamais.

## Frontière négative

Ce skill ne porte **ni** le contenu d'une feature (`SPEC.md`, tickets — skill `specs`), **ni**
l'exécution d'un ticket (skill `implement`), **ni** le travail hors cycle (skill `chantier`). Un
défaut du socle révélé en aval se **signale** ; il ne se corrige pas depuis l'aval.
