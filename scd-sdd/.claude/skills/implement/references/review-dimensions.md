# Référence — Dimensions de review et triage sceptique

<role>
Les six dimensions de la code review, le modèle de sévérité, et la discipline de triage adversarial. Base de `code-reviewer` (produit les findings) et `review-validator` (les trie). Le second regard est en **contexte frais** : le reviewer n'a pas écrit le code.
</role>

<dimensions>
## Les six dimensions

- **architecture** — séparation des couches, cohérence avec l'existant, couplage, patterns adaptés. Couplage fort ou violation structurelle majeure = bloquant.
- **propreté** — lisibilité, nommage, duplication, complexité, code mort. Généralement suggestion (sauf illisibilité rendant le code non maintenable).
- **conventions** — idiomes du langage, structure, style, cohérence avec le projet (le `CLAUDE.md` cible et les patrons existants).
- **couverture** — modes `TDD`/`test-after` : chemins/branches du code non exercés par les tests du lot ; chemin critique de logique métier sans test = bloquant (le reviewer **signale** le trou, il ne réécrit pas les tests). Modes `check`/`inhérent` : **pas** de test automatisé attendu (c'est le contrat) — juger si la vérif observable prévue couvre les chemins critiques ; ne jamais remonter « absence de test ».
- **sécurité** — injection, XSS, secrets en clair, authz/authn, validation des entrées, désérialisation non sûre. Vulnérabilité confirmée = bloquant.
- **error-handling** — cas limites, erreurs avalées, messages, résilience. Erreur non gérée sur chemin critique = bloquant.
</dimensions>

<severity>
## Sévérité

- **Bloquant** — impact réel sur la production ou la maintenabilité : bug, vulnérabilité confirmée, perte de données, dette majeure, chemin critique non testé ou non géré.
- **Suggestion** — amélioration sans risque immédiat : style, nommage, micro-perf, structurel nice-to-have.

Chaque finding porte un `correction_prompt` **autonome et chirurgical** :
`File: <chemin>, lines <N>[-M]. Replace: <code actuel>. With: <code cible>. Verify: <vérifications / commande de test>.`
</severity>

<triage>
## Triage sceptique et adversarial

Un reviewer à qui on demande de trouver des défauts en trouvera **toujours**. Le triage est le contrepoids : sa valeur est de **rejeter**. Posture sceptique (les reviewers sceptiques détectent mieux ; les biais pro-automation créent une sur-confiance dangereuse).

**Reproduire avant de retenir.** Pour chaque finding : le code cité existe-t-il ? Le problème est-il présent dans le **diff du lot** (pas dans du pré-existant hors périmètre) ? Non reproductible → **skip**.

**Ne retenir que** ce qui touche :
- la **correction** (bug, vuln confirmée, perte de données, erreur non gérée sur chemin critique), ou
- une **exigence** du contrat (`SHALL`/FR non respecté, chemin critique non couvert).

**Rejeter (skip)** :
- **style** pur / formatage / nommage cosmétique ;
- **spéculation** non ancrée dans le code (« pourrait poser problème si… ») ;
- **sur-engineering** (généricité, abstraction, config non demandée) — le risque propre de la review adverse ;
- **hors-scope** (au-delà du lot ou du contrat validé) ;
- **doublon**.

**Décision** : `apply` si reproduit + touche correction/exigence + fix chirurgical clair + risque de régression faible. Sinon `skip`. **En cas de doute → skip** (jamais d'apply sur un doute). Un lot vert avec **zéro finding retenu** est un résultat valide.

## Après application
Les corrections retenues sont appliquées **chirurgicalement** (rien d'autre), **sans toucher aux tests**, puis la vérification est reconfirmée selon le mode : `0 failed` + `git diff` tests vide (TDD/test-after), ou la preuve observable ré-exécutée (check/inhérent). Priorité à la vérif : mieux vaut une correction en moins qu'un lot cassé « plus propre ».
</triage>
