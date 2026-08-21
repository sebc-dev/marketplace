# Référence — Spec de feature (`specs/NNN-feature/spec.md`)

<role>
Répond au **quoi**, au niveau **feature** (pas produit). Décline un ou plusieurs `FR-xxx` de
`docs/produit.md` en critères d'acceptation **EARS** testables. **Technology-agnostic** : aucun
choix technique (ça descend dans `plan.md`, qui s'appuie sur `docs/technique.md` et `docs/adr/`). Produit par interview
« une question à la fois ». Racine de la traçabilité feature → plan → tasks → test.
</role>

<template>
```markdown
# Spec : [NOM FEATURE]
Statut : Brouillon | Créé : [date] | Trace vers : docs/produit.md (FR-xxx, SC-xxx)

## Légende
- **EARS** (*Easy Approach to Requirements Syntax*) — la forme normée des critères : cinq patterns,
  un par situation. Les mots-clés (`When`, `While`, `If…then`, `Where`, `shall`) sont la syntaxe de
  la méthode, pas un choix de style : ils restent en anglais pour que chaque critère se relise et se
  vérifie de la même façon partout. `docs/produit.md`, lui, n'emprunte l'anglais qu'aux trois
  mots-clés d'un scénario (`Given`/`When`/`Then`) : il décrit le produit en français, pas un
  critère de test.
- **shall** — le verbe de l'exigence : une phrase = une exigence = **une vérification observable**
  (un test automatisé, le plus souvent).
- **unwanted behavior** — le pattern du cas indésirable : `If <condition>, then the system shall …`
- **_(PRD: FR-0xx)_** — la backref : le besoin produit que ce critère de feature décline, tel qu'il
  est écrit dans `docs/produit.md`. C'est le fil qui permet de savoir, plus tard, pourquoi cette
  ligne existe. Le mot `PRD` y est un **nom de notation, pas un nom de fichier** : il précède la
  fusion de `1.19.0` et **ne change pas**, sinon toutes les specs déjà écrites perdraient leur
  backref d'un coup — et `/scd-sdd:migrate` ne touche jamais à `specs/`.
- **[NEEDS CLARIFICATION]** — une ambiguïté posée et **jamais tranchée en silence**. La phase
  `/scd-sdd:clarify` les résout une par une ; il n'en reste aucune quand on passe au plan.

## Résumé
[2-3 phrases : la capacité livrée et sa valeur. Trace vers le(s) FR produit couverts.]

## User stories (priorisées)
### US1 — [titre] (Priorité : P1)
[Parcours en langage clair.]
- Trace vers : produit FR-0xx, SC-0xx
- Scénarios d'acceptation (EARS) :
  1. **When** [déclencheur], the system **shall** [réponse vérifiable]
  2. **While** [état], **when** [déclencheur], the system **shall** [réponse]

## Exigences fonctionnelles (EARS, atomiques, testables)
- **FR-001** : When [déclencheur], the system shall [comportement précis]. _(PRD: FR-0xx)_
- **FR-002** : The system shall [capacité ubiquitous]. _(PRD: FR-0xx)_
- **FR-00X** : [NEEDS CLARIFICATION : question précise]

## Cas limites & comportements indésirables (unwanted behavior)
- **FR-0xx** : If [condition d'erreur], then the system shall [réponse structurée].
- Que se passe-t-il si [condition frontière] ?

## Contrats d'entrée/sortie (schémas machine-lisibles)
[Schéma requête/réponse, codes d'erreur — le QUOI observable, pas l'implémentation.]

## NON inclus (frontière de périmètre)
- [ce que la feature ne fait PAS — empêche le sur-engineering]

## Critères de succès mesurables
- **SC-001** : [métrique vérifiable, ex « création < 2 min »]. _(PRD: SC-0xx)_
```
</template>

<guidance>
- **Chaque critère en EARS** (`references/ears.md`) : un `SHALL` = une **vérification observable** nommée (le test automatisé en est la forme par défaut ; la forme réelle — test-first, check, inhérent — se décide en phase `tasks`). Pas de « et » dans un FR (le scinder).
- **Technology-agnostic, sans exception.** Un framework/lib/DB dans la spec = fuite à corriger vers `plan.md`. La spec survit à un changement de stack.
- **Trace vers `docs/produit.md`** : chaque `FR` de feature référence le `FR/SC` produit qu'il décline (`_(PRD: FR-0xx)_`). Si aucun FR produit ne couvre le besoin, c'est peut-être un trou de `docs/produit.md` → signaler.
- **`[NEEDS CLARIFICATION]`** pour toute ambiguïté : ne jamais trancher silencieusement. Résolu par la phase `clarify`.
- **Scope EXCLU obligatoire** : au moins 1-2 exclusions.
- **Brownfield** : si la feature modifie l'existant, basculer au format delta (`references/delta.md`) plutôt que réécrire une spec complète.
- **Multi-chemins** : pour un critère à états/chemins multiples à haute valeur de test, ajouter un scénario Gherkin dérivé (`references/gherkin.md`).
</guidance>

<completion>
La spec est terminée quand :
- [ ] Chaque `FR-xxx` est en **EARS**, **atomique** et **testable** (traduisible en une vérification observable).
- [ ] Chaque `FR-xxx`/`SC-xxx` **trace vers** un `FR/SC` de `docs/produit.md` (ou l'écart est signalé).
- [ ] Aucun choix technique n'apparaît (spec restée technology-agnostic).
- [ ] La section **NON inclus** borne le périmètre.
- [ ] Les cas limites et comportements indésirables (`If … then … shall`) sont couverts.
- [ ] Des `[NEEDS CLARIFICATION]` peuvent subsister — ils seront résolus par `clarify` (mais aucune ambiguïté n'a été tranchée en silence).
</completion>
