# Référence — Le contrat `CLAUDE.md` : assemblage et entretien

<role>
`CLAUDE.md` est le **contrat opérationnel** : chargé à chaque session, il **pointe** vers les ADR,
`docs/ci.md` et `.claude/guards.json` sans les recopier, **lit** les commandes du projet dans
`docs/ci.md`, et porte le **glossaire de domaine** que `/scd-sdd:spec`, `/scd-sdd:tickets` et les
reviewers réemploieront. Advisory, pas exécutif.

**Il est chargé en entier, quelle que soit sa longueur** — la concision est une contrainte de coût,
pas de style. Plafond **200 lignes** (« Keep CLAUDE.md under 200 lines, give it an owner, and review
changes to it like code ») ; **cible 60-90**, ordre de grandeur mesuré sur des dépôts publics. Ce
qui dépasse ne se coupe pas au hasard : il se **déplace**, et la section Renvois en garde la trace.

**Un seul écrivain, deux gestes qui s'excluent.** `/scd-sdd:init` **assemble** un contrat absent et
**entretient** un contrat existant — jamais les deux, et jamais un ré-assemblage sur un fichier qui
existe. C'est ce qui commande le chargement.

**Deux points de chargement, exclusifs l'un de l'autre :** `/scd-sdd:init` lit **tout sauf
`<revision>`** quand `CLAUDE.md` est absent ; elle ne lit que **`<guidance>` et `<revision>`** quand
il existe. Lui cacher le `<template>` dans le second cas est **délibéré** — le bloc `<revision>` dit
pourquoi.
</role>

<template>
```markdown
# [Nom du projet]
<!-- Propriétaire : @qui — Revue : /2 semaines — Règle : supprimer plus qu'on n'ajoute. Mettre à
     jour quand : erreur refaite une 2ᵉ fois · revue qui attrape ce que Claude aurait dû savoir ·
     même correction retapée · contexte qu'un nouveau coéquipier aurait cherché. Entretien :
     /scd-sdd:init, qui détecte ce fichier et le RÉVISE. Bloc retiré avant injection. -->

## Vue d'ensemble (3-5 bullets max)
- Objet, le "quoi" produit et pour qui : [une phrase]
- Décisions figées : @docs/adr/ — NE PAS contredire un ADR accepté
- Ce qui est vérifié automatiquement : `docs/ci.md` — les contrôles bloquants font foi
- Ce que l'agent ne peut pas écrire : `.claude/guards.json` — le blocage est réel, pas un conseil
[Ne décris pas l'arborescence ni les dépendances : Claude les lit.]

## Glossaire du domaine
[Les mots du métier, et eux seuls. Un terme = une ligne. C'est le vocabulaire que les specs, les
 tickets et la review doivent employer — pas un dictionnaire technique.]
- **[terme]** : [ce qu'il désigne dans CE projet, et ce qu'il ne désigne pas]

## Commandes (reprises de docs/ci.md — s'y reporter, ne pas diverger)
- Build : `[commande]`
- Test (unitaire) : `[commande]`   # préférer un seul test, pas toute la suite
- Lint/format : `[commande]`        # SOURCE DE VÉRITÉ du style — ne pas documenter les règles ici
- Run local : `[commande]`

## Conventions qui diffèrent des défauts du langage
- [règle] — **parce que** [le motif : sans son pourquoi, une règle est ignorée dès que le contexte change]

## Workflow imposé
- Explorer + planifier AVANT de coder (plan mode) pour toute tâche multi-fichiers
- Typecheck + tests + lint AVANT de considérer une tâche terminée

## Principes non-négociables & seuils
- Diff descriptible en une phrase → direct. Nouveau comportement → `/scd-sdd:spec` puis `/scd-sdd:tickets`. Décision transverse → nouvel ADR.
- [autres principes propres au projet]

## Definition of Done (une tâche n'est "done" que si)
- [ ] Les critères d'acceptation du ticket sont vérifiés, avec leur preuve
- [ ] Lint + typecheck verts
- [ ] Rien hors périmètre du ticket n'a été modifié
- [ ] Preuve fournie (sortie de test/build), pas seulement "ça a l'air fait"

## Gotchas / comportements non-évidents
[Le poste principal de tokens passe ici : c'est ce qu'un agent ne peut pas déduire du dépôt.]
- [ex : en mode debug, les emails sont loggés sur stdout]
- [y compris ce que `docs/ci.md` déclare NE PAS couvrir]

## Renvois (divulgation progressive — ne PAS inliner)
- [Procédure]  : voir le skill /[nom]
- [Sous-arbre] : `.claude/rules/[nom].md` (path-scopé sur `[glob]`)
[Section admise **vide** au premier assemblage : un projet neuf n'a ni skill ni rule.]

# IMPORTANT
- YOU MUST montrer la preuve (sortie de commande) au lieu d'affirmer le succès.

<!-- À NE PAS mettre ici : garde-fou dur (→ .claude/guards.json / hook / permissions.deny) ·
     procédure (→ skill) · contrainte de sous-arbre (→ .claude/rules/ path-scopé) ·
     préférence perso (→ ~/.claude/CLAUDE.md) · style formaté par un outil (→ linter). -->
```
</template>

<guidance>
- **Pointer, pas recopier.** Le contenu des ADR et de `docs/ci.md` reste chez eux ; `CLAUDE.md`
  *mentionne* les chemins. Recopier = dérive garantie.
- **`@import` avec parcimonie.** Les fichiers `@importés` sont chargés au lancement, donc **ne
  réduisent pas** le coût en tokens : n'importer que le stable et universel. Backticker le chemin
  pour le mentionner sans l'importer.
- **Le glossaire est du métier, pas de la technique.** Il existe parce que trois consommateurs en
  ont besoin — `spec`, `tickets`, les reviewers — et qu'un fichier séparé serait un document de
  plus que personne ne relit. Un terme dont la définition est évidente pour qui lit le code n'y
  entre pas. **Quinze lignes est déjà beaucoup** ; au-delà, c'est un document, et il change de
  nature.
- **Advisory ≠ garanti.** Relier chaque item de Definition of Done au **job** de `docs/ci.md` qui le
  vérifie, et laisser advisory — **explicitement** — ce qu'aucun job ne couvre. Un item advisory
  mêlé aux autres se lit comme garanti.
- **Test de suppression.** Pour chaque ligne : « sa suppression ferait-elle échouer Claude ? »
  Sinon, couper. Un `CLAUDE.md` gonflé dilue les règles qui comptent.
- **Commandes** : elles ne se devinent pas et ne s'inventent jamais — elles se **lisent** dans la
  table « Commandes du projet » de `docs/ci.md` et se recopient à l'identique. Un `[à compléter]`
  qui subsiste là-bas se reporte tel quel et se signale : le corriger ici créerait une commande que
  la CI n'exécute pas.
- **Le pourquoi est exigé** sur toute convention non-standard : une règle sans son motif est ignorée
  dès que le contexte change *(constat de terrain rapporté par des praticiens, pas une mesure)*.

## Quand mettre à jour — les quatre déclencheurs

Claude **refait la même erreur une 2ᵉ fois** · une **revue attrape** ce qu'il aurait dû savoir · on
**retape la même correction** · un **nouveau coéquipier** aurait cherché ce contexte. Hors de ces
quatre cas, l'ajout est probablement du bruit. Ces quatre-là déclenchent un **ajout**. Deux cas
mécaniques déclenchent un **retrait**, sans attendre aucun symptôme : `docs/ci.md` a changé (la
section Commandes en est une recopie), et le projet a **changé de génération de modèle** — la
doctrine « moins de règles » en dépend, et une règle utile à l'ancien peut nuire au nouveau.

## Où une instruction doit vivre — la table de promotion

| Symptôme | Destination |
|---|---|
| convention ou commande ratée 2 fois | **CLAUDE.md** |
| même prompt de démarrage retapé | **skill** user-invocable |
| même playbook collé 3 fois | **skill** |
| copie répétée depuis un onglet navigateur | **MCP** |
| tâche annexe qui inonde la conversation | **subagent** |
| action à faire à chaque fois sans demander | **hook** |
| fichier que l'agent ne doit jamais réécrire | **`.claude/guards.json`** |
| un 2ᵉ dépôt a besoin du même setup | **plugin** |

## À mettre / à ne pas mettre / où déplacer

| À METTRE | À NE PAS y mettre | Où, et pourquoi |
|---|---|---|
| commandes exactes build/test/lint | règles que le formatter applique déjà | nulle part — doublon déterministe |
| *gotchas* et pièges du dépôt | procédure multi-étapes | **skill** — chargé à l'invocation seulement |
| conventions non-standard **+ le pourquoi** | garde-fou dur (« ne jamais toucher `.env` ») | **`.claude/guards.json`** — enforcement réel |
| glossaire du domaine (≤ 15 lignes) | dictionnaire technique | supprimer — Claude lit le code |
| brève description du dépôt | arborescence, liste de dépendances | supprimer — Claude les lit |
| renvois (`@`, noms de skills) | contrainte propre à `src/api/**` | **`.claude/rules/` path-scopé** — charge sur match |
| règles vraies pour toute l'équipe | préférence personnelle | **`~/.claude/CLAUDE.md`** ou local gitignoré |

## La frontière skills / hooks / rules — trois axes, et un seul ne suffit jamais

Trois questions décident : **quand** l'instruction est chargée, ce qu'elle devient **à la
compaction**, son **autorité**.

| Mécanisme | Chargé | À la compaction | Autorité |
|---|---|---|---|
| `CLAUDE.md` racine | démarrage, toute la session | **réinjecté** | advisory |
| `CLAUDE.md` de sous-dossier | à la demande | **non réinjecté** | advisory |
| `.claude/rules/` path-scopé | sur match de chemin | **non réinjecté** | advisory |
| skill | description au démarrage, corps à l'invocation | réinjecté si invoqué, budget partagé | advisory |
| hook · `guards.json` · `permissions.deny` | sur événement du cycle de vie | sans objet | **déterministe** |

Trois conséquences. Ce qui **doit survivre à un `/compact`** va au `CLAUDE.md` racine, nulle part
ailleurs. Un « ne jamais » qui doit tenir sous pression n'est pas une phrase : une instruction est
suivie la plupart du temps, un garde l'est toujours — c'est la frontière que franchit
`/scd-sdd:guards`. Et une rule **non** path-scopée est mécaniquement identique à du contenu mis
dans `CLAUDE.md`.
</guidance>

<completion>
`CLAUDE.md` est terminé quand :
- [ ] Il **pointe** vers `docs/adr/`, `docs/ci.md` et `.claude/guards.json` — sans recopier leur contenu.
- [ ] La section **Commandes** est identique à la table « Commandes du projet » de `docs/ci.md` — aucune commande ajoutée, aucune reformulée.
- [ ] Le **glossaire** ne porte que des termes du **domaine**, et tient en 15 lignes ou moins.
- [ ] Les sections **Definition of Done** (vérifiable) et **Principes & seuils** sont présentes.
- [ ] Chaque convention non-standard porte **son pourquoi**.
- [ ] Aucune règle de style écrite à la main (déléguée au linter), ni arborescence, ni liste de dépendances : ce que Claude lit du dépôt n'y figure pas.
- [ ] L'**en-tête en commentaires HTML** porte le **propriétaire**, la règle « supprimer plus qu'on n'ajoute » et les **quatre déclencheurs** ; la section **Renvois** existe — **vide est valide** au premier assemblage.
- [ ] Le fichier vise **60-90 lignes** et ne dépasse pas **200**.
- [ ] Les garanties dures renvoient aux jobs de `docs/ci.md`, et **l'état de la protection de branche** est rappelé à l'utilisateur : tant qu'elle porte **À POSER**, ces contrôles sont informatifs.
</completion>

<revision>
Bloc de l'**entretien**. Il ne s'applique qu'à un `CLAUDE.md` **existant**, et il se charge **à la
place** du `<template>`, jamais avec lui.

## La règle qui commande tout : une ligne inconnue est présumée légitime

L'entretien **édite chirurgicalement et ne ré-assemble jamais**. Une ligne que le `<template>` ne
prévoit pas subit le **test de suppression** comme les autres — jamais « hors template, donc à
retirer ». C'est pourquoi le `<template>` n'est pas chargé ici : le traiter comme un référentiel de
conformité ferait de la commande un destructeur de tout ajout humain, et **rejouer l'assemblage est
le mode de défaillance, pas la voie de mise à jour** (§D29). En cas de doute sur une ligne,
`git log -S'<extrait>' -- CLAUDE.md` en donne l'écrivain et la date : un retrait se propose **avec
ce fait**, jamais sans.

## Volet mécanique — 4 contrôles, tranchés sans jugement

1. **Dérive des Commandes.** Chaque ligne contre la table « Commandes du projet » de `docs/ci.md`,
   au caractère près. Un écart se resynchronise **depuis** elle, **jamais** l'inverse ; un
   `[à compléter]` se reporte tel quel et se signale.
2. **Taille.** Cible 60-90 lignes, plafond 200. Au-delà, la question n'est pas « que couper » mais
   « que **déplacer** », et vers quel mécanisme.
3. **Pointeurs.** Chaque `@chemin` et chaque chemin en backticks résout-il ? Un pointeur mort fait
   croire à un document. ⚠️ Un projet migré depuis `1.x` en porte presque toujours :
   `docs/produit.md`, `docs/technique.md`, `docs/brief.md`, `docs/prd.md`, `docs/stack.md`,
   `docs/archi.md`, `docs/journal/` — tous déplacés dans `docs/1.x/` par `/scd-sdd:migrate`.
4. **En-tête de maintenance.** Commentaires HTML présents, avec propriétaire et déclencheurs ?
   Absents, l'entretien n'a personne pour le porter.

## Volet de jugement — 6 contrôles, chacun rend un constat, jamais une édition

1. **Test de suppression, ligne à ligne** : « sa suppression ferait-elle échouer Claude ? »
2. **Procédure réinstallée** : un runbook de plusieurs étapes a repoussé ici → **skill**.
3. **Garde-fou en prose** : un « ne jamais » qui doit tenir à 100 % → **`.claude/guards.json`**,
   un hook, ou `permissions.deny`. C'est le contrôle le plus rentable depuis `2.0.0` : le mécanisme
   existe enfin, et une phrase qui prétendait faire son travail peut être **remplacée**, pas
   seulement déplorée.
4. **Style manuscrit** : une règle que le linter applique déjà → supprimer.
5. **Contradictions, internes _et_ inter-fichiers.** La hiérarchie des `CLAUDE.md` est **additive,
   sans précédence** — tous sont concaténés, et « Claude may pick one arbitrarily » : un
   recouvrement entre la racine et un sous-dossier n'est arbitré par personne. On tranche dans le
   racine ; ce qui vit ailleurs se **signale**. Le niveau utilisateur (`~/.claude/`) est hors dépôt :
   angle mort assumé.
6. **Déductible du dépôt** : arborescence, dépendances, vue d'architecture → supprimer.

## Signaler n'est pas écrire, et rien ne s'écrit sans l'humain

Un skill à créer, une rule path-scopée, un hook, un `CLAUDE.md` de sous-dossier qui recouvre le
racine, un trou de `docs/ci.md` : ce sont des **signalements**, présentés à part et **jamais
écrits**. Si un contrôle de jugement conclut « cette règle est ignorée », le doute porte d'abord sur
la **délivrance** et non sur la qualité : `/context` dit si le fichier est seulement chargé — geste
humain, hors de ta portée.

Le rapport rend **deux listes séparées** : les **éditions proposées** — une par ligne : section,
extrait visé, geste (retirer · resynchroniser · déplacer vers un renvoi), motif en une phrase —
puis les **signalements** — mécanisme visé, ce qui y appartiendrait, qui doit le créer. **Rien n'est
appliqué avant l'arbitrage humain**, et « aucune édition » est un **résultat valide** qui se
consigne.
</revision>
