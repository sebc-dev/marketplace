# Référence — Dimensions de review et triage sceptique

**Deux points de chargement, tous deux par un agent** :

- l'agent **`code-reviewer`** — `<dimensions>` et `<severity>` **seuls** : il produit les findings et
  les classe, il ne les trie pas ;
- l'agent **`review-validator`** — `<triage>` **seul** : il tranche `apply`/`skip` sur des findings
  déjà produits et déjà classés.

Aucune commande ne la charge : la review ne se joue que dans le workflow, par ces deux agents. Ce qui
est ici ne se recopie **ni** dans leur corps, **ni** dans leur sortie.

<role>
Les six dimensions de la code review, le modèle de sévérité, et la discipline de triage adversarial. Le second regard est en **contexte frais** : le reviewer n'a pas écrit le code.
</role>

<dimensions>
## Les six dimensions

- **architecture** — **référent : la table des invariants de `docs/technique.md`, quand elle existe.** Le diff s'y confronte : frontière franchie, sens de dépendance inversé, artefact placé hors du dossier prescrit, import prohibé. Une **violation d'invariant = bloquant**, sauf si le `plan.md` du lot la déclare et la justifie — l'invariant (`I3`) est alors cité dans le finding. Un invariant **ne se re-discute pas** : il tient son autorité de la phase `technique` et de l'ADR qui le porte ; le reviewer constate s'il est franchi, et s'il le juge faux ou périmé, c'est une **suggestion**, jamais un bloquant. **Repli nommé, quand cette table est absente ou vide** : le référent redevient la cohérence avec l'**existant** — séparation des couches, couplage, patterns adaptés. C'est un mode dégradé, pas l'état normal : l'existant est la dérive déjà accumulée, pas une intention. Un couplage fort ou une violation structurelle majeure reste bloquant dans les deux cas.
- **propreté** — lisibilité, nommage, duplication, complexité, code mort. Généralement suggestion (sauf illisibilité rendant le code non maintenable).
- **conventions** — idiomes du langage, structure, style, cohérence avec le projet. **Référent : le `CLAUDE.md` du projet cible et les patrons existants** — la même source que la dimension *architecture* nomme `docs/technique.md`. Tu ne le relis pas toi-même : `lot-briefer` l'a déjà lu et l'a résumé dans le champ `conventions` du brief, qui est ton **canal** vers ce référent, jamais un référent concurrent. Champ vide ou muet sur le point jugé → le référent se réduit aux patrons existants, et l'écart relève de la **suggestion**, jamais du bloquant : une convention qu'aucun document ne porte n'est pas une exigence.
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

**Un invariant de `docs/technique.md` cité par un finding est une exigence.** Il n'est ni un bug ni un `SHALL`, et sans cette ligne il tomberait sous « hors-scope » ou sous le doute — le producteur de findings porte ce référent depuis 1.8.0, le triage doit le porter aussi, sans quoi le bloquant est neutralisé au filtre. Reproduire reste requis : ouvrir `docs/technique.md`, lire l'invariant cité, constater le franchissement dans le diff. Trois issues seulement — franchissement constaté → **apply** ; franchissement non reproductible, ou invariant inexistant dans la table → **skip** (non-reproduit) ; franchissement constaté mais **déclaré et justifié dans le `plan.md` du lot** → **skip** (hors-scope), en nommant la dérogation. Ce qu'on ne fait jamais : skip parce que l'invariant paraît discutable — sa justesse n'est pas du ressort du triage.

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
