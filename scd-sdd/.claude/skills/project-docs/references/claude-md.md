# Référence — Le contrat `CLAUDE.md` : assemblage et entretien

<role>
`CLAUDE.md` est le **contrat opérationnel** : chargé à chaque session, il **pointe** vers les
documents du socle (Brief, PRD, Stack, Archi, ADR, CI) sans les recopier, et **lit** les commandes
du projet dans `docs/ci.md`. C'est ici que la **constitution est fondue** (principes
non-négociables + seuils de déclenchement) plutôt que dans un fichier séparé. Advisory, pas
exécutif.

**Il est chargé en entier, quelle que soit sa longueur** — la concision est une contrainte de coût,
pas de style. Plafond **200 lignes** (« Keep CLAUDE.md under 200 lines, give it an owner, and
review changes to it like code ») ; **cible 60-90**, ordre de grandeur mesuré sur des dépôts
publics. Ce qui dépasse ne se coupe pas au hasard : il se **déplace**, et la section Renvois en
garde la trace.

**Le contrat a un entretien, et les deux gestes s'excluent.** `contract` **assemble**, une fois, et
ne se rejoue **pas** sur un fichier existant : il écraserait les remédiations de `premortem socle`
et tout ajout humain. `/scd-sdd:revise-contract` **entretient** — retirer, resynchroniser, déplacer ; jamais enrichir.

**Deux points de chargement, et le second est partiel :** `/scd-sdd:contract` lit **tout sauf
`<revision>`** ; `/scd-sdd:revise-contract` ne lit que **`<guidance>` et `<revision>`**. Ne pas lui
donner le `<template>` est délibéré : une commande qui entretient ne doit jamais avoir le
référentiel d'assemblage sous les yeux, sous peine de traiter toute ligne hors template comme un
écart de conformité.
</role>

<template>
```markdown
# [Nom du projet]
<!-- Propriétaire : @qui — Revue : /2 semaines — Règle : supprimer plus qu'on n'ajoute. Mettre à
     jour quand : erreur refaite une 2ᵉ fois · revue qui attrape ce que Claude aurait dû savoir ·
     même correction retapée · contexte qu'un nouveau coéquipier aurait cherché. Entretien :
     /scd-sdd:revise-contract — ne PAS rejouer /scd-sdd:contract. Bloc retiré avant injection. -->

## Vue d'ensemble (3-5 bullets max)
- Objet : [une phrase] — voir @docs/brief.md
- Le "quoi" produit : @docs/prd.md — Les fondations techniques : @docs/stack.md
- Ce que le code s'interdit : `docs/archi.md` — NE PAS franchir un invariant
- Décisions figées : @docs/adr/ — NE PAS contredire un ADR accepté
- Ce qui est vérifié automatiquement : `docs/ci.md` — les contrôles bloquants font foi
[Ne décris pas l'arborescence ni les dépendances : Claude les lit.]

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

## Principes non-négociables & seuils (constitution fondue)
- Diff descriptible en une phrase → direct. Multi-fichiers / nouveau comportement → cycle spec complet. Décision transverse → nouvel ADR.
- [autres principes propres au projet]

## Definition of Done (une tâche n'est "done" que si)
- [ ] Tests correspondant aux critères d'acceptation écrits ET passants
- [ ] Lint + typecheck verts
- [ ] Rien hors périmètre de la tâche n'a été modifié
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

<!-- À NE PAS mettre ici : garde-fou dur (→ hook PreToolUse / permissions.deny) ·
     procédure (→ skill) · contrainte de sous-arbre (→ .claude/rules/ path-scopé) ·
     préférence perso (→ ~/.claude/CLAUDE.md) · style formaté par un outil (→ linter). -->
```
</template>

<guidance>
- **Pointer, pas recopier.** Le contenu du Brief/PRD/Stack reste dans `docs/` ; CLAUDE.md ne fait que `@import` la constitution stable et *mentionner* les chemins des specs. Recopier = dérive garantie.
- **`@import` avec parcimonie.** Les fichiers `@importés` sont chargés au lancement, donc **ne réduisent pas** le coût en tokens : n'importer que le stable et universel. Backticker le chemin pour le mentionner sans l'importer.
- **Constitution fondue ici** : la section « Principes & seuils » remplace un `constitution.md` séparé (choix assumé pour un solo).
- **Advisory ≠ garanti.** Écrire la Definition of Done dans CLAUDE.md ne la fait pas respecter. Ce qui DOIT arriver à 100 % est exécuté par les contrôles bloquants de `docs/ci.md`, sous protection de branche : relier chaque item de DoD au job qui le vérifie, et laisser advisory — explicitement — ce qu'aucun job ne couvre.
- **Test de suppression.** Pour chaque ligne : « sa suppression ferait-elle échouer Claude ? » Sinon, couper. Un CLAUDE.md gonflé dilue les règles qui comptent.
- **Commandes** : elles ne se devinent plus et ne s'inventent jamais — elles se **lisent** dans la table « Commandes du projet » de `docs/ci.md` et se recopient à l'identique. Un `[à compléter]` qui subsiste là-bas se reporte tel quel et se signale : c'est un trou de la phase `ci`, et le corriger ici créerait une commande que la CI n'exécute pas.
- **Le pourquoi est exigé** sur toute convention non-standard : une règle sans son motif est ignorée dès que le contexte change.

## Quand mettre à jour — les quatre déclencheurs

Claude **refait la même erreur une 2ᵉ fois** · une **revue attrape** ce qu'il aurait dû savoir · on
**retape la même correction** · un **nouveau coéquipier** aurait cherché ce contexte. Hors de ces
quatre cas, l'ajout est probablement du bruit.

## Où une instruction doit vivre — la table de promotion

| Symptôme | Destination |
|---|---|
| convention ou commande ratée 2 fois | **CLAUDE.md** |
| même prompt de démarrage retapé | **skill** user-invocable |
| même playbook collé 3 fois | **skill** |
| copie répétée depuis un onglet navigateur | **MCP** |
| tâche annexe qui inonde la conversation | **subagent** |
| action à faire à chaque fois sans demander | **hook** |
| un 2ᵉ dépôt a besoin du même setup | **plugin** |

## À mettre / à ne pas mettre / où déplacer

| À METTRE | À NE PAS y mettre | Où, et pourquoi |
|---|---|---|
| commandes exactes build/test/lint | règles que le formatter applique déjà | nulle part — doublon déterministe |
| *gotchas* et pièges du dépôt | procédure multi-étapes | **skill** — chargé à l'invocation seulement |
| conventions non-standard **+ le pourquoi** | garde-fou dur (« ne jamais toucher `.env` ») | **hook PreToolUse / `permissions.deny`** — enforcement réel |
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
| hook · `permissions.deny` | sur événement du cycle de vie | sans objet | **déterministe** |

Trois conséquences. Ce qui **doit survivre à un `/compact`** va au `CLAUDE.md` racine, nulle part
ailleurs. Un « ne jamais » qui doit tenir sous pression n'est pas une phrase : une instruction est
suivie la plupart du temps, un hook l'est toujours — c'est la frontière que franchit la phase `ci`.
Et une rule **non** path-scopée est mécaniquement identique à du contenu mis dans `CLAUDE.md`.
</guidance>

<completion>
CLAUDE.md est terminé quand :
- [ ] Il **pointe** vers `docs/brief.md`, `docs/prd.md`, `docs/stack.md`, `docs/archi.md`, `docs/adr/`, `docs/ci.md` — sans recopier leur contenu, et **sans recopier la table des invariants**.
- [ ] La section **Commandes** est identique à la table « Commandes du projet » de `docs/ci.md` — aucune commande ajoutée, aucune reformulée.
- [ ] Les sections **Definition of Done** (vérifiable) et **Principes & seuils** (constitution fondue) sont présentes.
- [ ] Chaque convention non-standard porte **son pourquoi**.
- [ ] Aucune règle de style écrite à la main (déléguée au linter), ni arborescence, ni liste de dépendances : ce que Claude lit du dépôt n'y figure pas.
- [ ] L'**en-tête en commentaires HTML** porte le **propriétaire**, la règle « supprimer plus qu'on n'ajoute » et les **quatre déclencheurs** ; la section **Renvois** existe — **vide est valide** au premier assemblage.
- [ ] Le fichier vise **60-90 lignes** et ne dépasse pas **200**.
- [ ] Les garanties dures (tests/lint bloquants) renvoient aux jobs de `docs/ci.md`, et **l'état de la protection de branche** est rappelé à l'utilisateur : tant qu'elle porte **À POSER**, ces contrôles sont informatifs.
</completion>

<revision>
Bloc de l'**entretien**, chargé par `/scd-sdd:revise-contract` seule. Il ne s'applique qu'à un
`CLAUDE.md` **existant**, et ne produit **aucune écriture** avant l'arbitrage humain. Préconditions :

- `CLAUDE.md` **absent** → arrêt, renvoi vers `/scd-sdd:contract`. L'entretien ne crée rien.
- `docs/ci.md` **absent** → le volet Commandes est **impossible** : le signaler, renvoyer vers
  `/scd-sdd:ci`, et poursuivre le reste de la checklist.

## La règle qui commande tout : une ligne inconnue est présumée légitime

L'entretien **édite chirurgicalement et ne ré-assemble jamais**. Une ligne que le `<template>` ne
prévoit pas subit le **test de suppression** comme les autres — jamais « hors template, donc à
retirer ». Traiter le template comme un référentiel de conformité ferait de la commande un
destructeur des remédiations de `premortem socle` et de tout ajout humain : ce qu'elle remplace.
Contrôle de provenance en cas de doute — les lignes `premortem` de `docs/journal/socle.md` datent
les passes de durcissement : une ligne apparue après l'une d'elles a un écrivain connu, et son
retrait se propose **avec ce fait**, jamais sans.

## Volet mécanique — 4 contrôles, tranchés sans jugement

1. **Dérive des Commandes.** Chaque ligne contre la table « Commandes du projet » de `docs/ci.md`, au
   caractère près. Un écart se resynchronise **depuis** elle, **jamais** l'inverse ; un `[à compléter]` se reporte tel quel et se signale.
2. **Taille.** Cible 60-90 lignes, plafond 200. Au-delà, la question n'est pas « que couper » mais « que **déplacer** », et vers quel mécanisme.
3. **Pointeurs.** Chaque `@chemin` et chaque chemin en backticks résout-il ? Un pointeur mort fait
   croire à un document.
4. **En-tête de maintenance.** Commentaires HTML présents, avec propriétaire et déclencheurs ? Absents, l'entretien n'a personne pour le porter.

## Volet de jugement — 6 contrôles, chacun rend un constat, jamais une édition

1. **Test de suppression, ligne à ligne** : « sa suppression ferait-elle échouer Claude ? »
2. **Procédure réinstallée** : un runbook de plusieurs étapes a repoussé ici → **skill**.
3. **Garde-fou en prose** : un « ne jamais » qui doit tenir à 100 % → **hook** / `permissions.deny`.
4. **Style manuscrit** : une règle que le linter applique déjà → supprimer.
5. **Contradiction interne** : face à un conflit, le modèle choisit arbitrairement — donc on tranche.
6. **Déductible du dépôt** : arborescence, dépendances, vue d'architecture → supprimer.

## Signaler n'est pas écrire, et rien ne s'écrit sans l'humain

L'entretien n'édite **que** `CLAUDE.md`. Un skill à créer, une rule path-scopée, un hook, un trou de
`docs/ci.md` : ce sont des **signalements**, présentés à part et **jamais écrits**. La commande n'a
ni `Write` ni `Bash` — la frontière est mécanique, pas une consigne de bonne volonté.

Le rapport rend **deux listes séparées** : les **éditions proposées** — une par ligne : section,
extrait visé, geste (retirer · resynchroniser · déplacer vers un renvoi), motif en une phrase —
puis les **signalements** — mécanisme visé, ce qui y appartiendrait, qui doit le créer. **Rien n'est
appliqué avant l'arbitrage humain**, et « aucune édition » est un **résultat valide** qui se consigne.
</revision>
