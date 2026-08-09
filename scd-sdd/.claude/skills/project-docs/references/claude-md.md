# Référence — Assemblage de `CLAUDE.md`

<role>
Dernière phase du kickoff, la **septième**. `CLAUDE.md` est le **contrat opérationnel** : chargé à
chaque session, il **pointe** vers les docs produits (Brief, PRD, Stack, Archi, ADR, CI) sans les
recopier, et il **lit** les commandes du projet dans `docs/ci.md`. C'est aussi ici
que la **constitution est fondue** (principes non-négociables + seuils de déclenchement) plutôt
que dans un fichier séparé. Advisory, pas exécutif : garder court, haut-signal, cible < 200 lignes.
</role>

<template>
```markdown
# [Nom du projet]

## Vue d'ensemble (3-5 bullets max)
- Objet : [une phrase] — voir @docs/brief.md
- Le "quoi" produit : @docs/prd.md — Les fondations techniques : @docs/stack.md
- Ce que le code s'interdit : `docs/archi.md` — NE PAS franchir un invariant
- Décisions figées : @docs/adr/ — NE PAS contredire un ADR accepté
- Ce qui est vérifié automatiquement : `docs/ci.md` — les contrôles bloquants font foi

## Commandes (reprises de docs/ci.md — s'y reporter, ne pas diverger)
- Build : `[commande]`
- Test (unitaire) : `[commande]`   # préférer un seul test, pas toute la suite
- Lint/format : `[commande]`        # SOURCE DE VÉRITÉ du style — ne pas documenter les règles ici
- Run local : `[commande]`

## Conventions qui diffèrent des défauts du langage
- [ex : ES modules, pas CommonJS ; pas de dépendance nouvelle sans justification]

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
- [ex : en mode debug, les emails sont loggés sur stdout]

# IMPORTANT
- YOU MUST montrer la preuve (sortie de commande) au lieu d'affirmer le succès.
```
</template>

<guidance>
- **Pointer, pas recopier.** Le contenu du Brief/PRD/Stack reste dans `docs/` ; CLAUDE.md ne fait que `@import` la constitution stable et *mentionner* les chemins des specs. Recopier = dérive garantie.
- **`@import` avec parcimonie.** Les fichiers `@importés` sont chargés au lancement : n'importer que le stable et universel. Laisser Brief/PRD/Stack être lus à la demande (backtick le chemin pour le mentionner sans l'importer si besoin).
- **Constitution fondue ici** : la section « Principes & seuils » remplace un `constitution.md` séparé (choix assumé pour un solo).
- **Advisory ≠ garanti.** Écrire la Definition of Done dans CLAUDE.md ne la fait pas respecter. Ce qui DOIT arriver à 100 % est exécuté par les contrôles bloquants de `docs/ci.md`, sous protection de branche : relier chaque item de DoD au job qui le vérifie, et laisser advisory — explicitement — ce qu'aucun job ne couvre.
- **Concision.** Test de chaque ligne : « sa suppression ferait-elle échouer Claude ? » Sinon, couper. Un CLAUDE.md gonflé dilue les règles qui comptent.
- **Commandes** : elles ne se devinent plus et ne s'inventent jamais — elles se **lisent** dans la table « Commandes du projet » de `docs/ci.md` et se recopient à l'identique. Un `[à compléter]` qui subsiste là-bas se reporte tel quel et se signale : c'est un trou de la phase `ci`, et le corriger ici créerait une commande que la CI n'exécute pas.
</guidance>

<completion>
CLAUDE.md est terminé quand :
- [ ] Il **pointe** vers `docs/brief.md`, `docs/prd.md`, `docs/stack.md`, `docs/archi.md`, `docs/adr/`, `docs/ci.md` — sans recopier leur contenu, et **sans recopier la table des invariants**.
- [ ] La section **Commandes** est identique à la table « Commandes du projet » de `docs/ci.md` — aucune commande ajoutée, aucune reformulée.
- [ ] La section **Definition of Done** est présente et vérifiable.
- [ ] La section **Principes & seuils** (constitution fondue) est présente.
- [ ] Aucune règle de style n'est documentée à la main (déléguée au linter).
- [ ] Le fichier reste court et haut-signal (viser < 200 lignes).
- [ ] Les garanties dures (tests/lint bloquants) renvoient aux jobs de `docs/ci.md`, et **l'état de la protection de branche** est rappelé à l'utilisateur : tant qu'elle porte **À POSER**, ces contrôles sont informatifs.
</completion>
