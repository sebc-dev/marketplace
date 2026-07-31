# Référence — Assemblage de `CLAUDE.md`

<role>
Dernière phase du kickoff. `CLAUDE.md` est le **contrat opérationnel** : chargé à chaque session,
il **pointe** vers les docs produits (Brief, PRD, Stack, ADR) sans les recopier. C'est aussi ici
que la **constitution est fondue** (principes non-négociables + seuils de déclenchement) plutôt
que dans un fichier séparé. Advisory, pas exécutif : garder court, haut-signal, cible < 200 lignes.
</role>

<template>
```markdown
# [Nom du projet]

## Vue d'ensemble (3-5 bullets max)
- Objet : [une phrase] — voir @docs/brief.md
- Le "quoi" produit : @docs/prd.md — Les fondations techniques : @docs/stack.md
- Décisions figées : @docs/adr/ — NE PAS contredire un ADR accepté

## Commandes (ce que Claude ne peut pas deviner)
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
- **Advisory ≠ garanti.** Écrire la Definition of Done dans CLAUDE.md ne la fait pas respecter. Ce qui DOIT arriver à 100 % doit AUSSI devenir un hook/linter/test — le signaler à l'utilisateur comme prochaine étape (hors périmètre de ce kickoff de création).
- **Concision.** Test de chaque ligne : « sa suppression ferait-elle échouer Claude ? » Sinon, couper. Un CLAUDE.md gonflé dilue les règles qui comptent.
- **Commandes** : en greenfield elles peuvent être inconnues ; interviewer brièvement (build/test/lint/run) ou laisser des placeholders explicites `[à compléter]`.
</guidance>

<completion>
CLAUDE.md est terminé quand :
- [ ] Il **pointe** vers `docs/brief.md`, `docs/prd.md`, `docs/stack.md`, `docs/adr/` — sans recopier leur contenu.
- [ ] La section **Definition of Done** est présente et vérifiable.
- [ ] La section **Principes & seuils** (constitution fondue) est présente.
- [ ] Aucune règle de style n'est documentée à la main (déléguée au linter).
- [ ] Le fichier reste court et haut-signal (viser < 200 lignes).
- [ ] Les garanties dures (tests/lint bloquants) sont signalées à l'utilisateur comme devant devenir des hooks — étape hors de ce kickoff.
</completion>
