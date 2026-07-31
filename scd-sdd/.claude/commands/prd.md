---
description: "Phase 2 du socle : produit docs/prd.md par interview — le quoi au niveau produit, user stories priorisées, exigences fonctionnelles atomiques FR-xxx, critères mesurables SC-xxx. Technology-agnostic. Trace vers le Brief."
argument-hint: "(aucun — lit docs/brief.md)"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu élabores le **PRD**, la source de vérité produit. Il répond au *quoi*, au **niveau
produit** — les capacités d'ensemble, pas l'implémentation détaillée d'une feature, qui
appartient au niveau specs en aval.

Le PRD doit **survivre à un changement de stack** : c'est ce qui justifie la contrainte
technology-agnostic. Ses `FR-xxx` sont le fil le plus long du cycle — ils deviendront des
critères EARS au niveau specs, puis des vérifications observables à l'implémentation.
Leur numérotation est donc définitive.

Ratio : 60% humain / 40% AI (l'humain arbitre, tu dérives et structures).

## Règles absolues

- **Technology-agnostic, sans exception.** Un framework, une lib ou une DB dans le PRD
  est une fuite à corriger, pas un détail.
- **Niveau produit, pas feature.** Si tu te surprends à décrire des écrans, des
  endpoints ou des tables, tu es descendu d'un niveau.
- **FR atomique et testable.** Une exigence = un comportement vérifiable = un futur
  test. Tout `FR` contenant « et » se scinde.
- **Aucune ambiguïté tranchée en silence.** Une zone floue devient un
  `[NEEDS CLARIFICATION : question précise]`, résolu par interview avant de clore.
- **IDs stables.** `FR-xxx` et `SC-xxx` sont numérotés une fois et ne sont jamais
  renumérotés : tout l'aval s'y accroche.

## Processus

1. **Lis `docs/brief.md`** — prérequis strict. S'il manque, **arrête-toi** et renvoie
   vers `/scd-sdd:brief` : sans le pourquoi ni le périmètre macro, un PRD n'est que de
   l'invention.

2. **Charge le template et ses règles** : lis `references/prd.md` du skill
   `project-docs`.

3. **Dérive un premier jet** de user stories depuis le Brief et **priorise-les**
   (P1/P2/P3), en reliant chaque priorité à un `SC-xxx` du Brief. Un premier jet dérivé
   se critique mieux qu'une page blanche — mais il se fait valider, il ne s'impose pas.

4. **Interviewe pour combler**, une question à la fois :
   - les scénarios **Given/When/Then** de chaque story (entrées et sorties concrètes) ;
   - la scission de chaque `FR` non atomique ;
   - les **cas limites** (conditions frontières, scénarios d'erreur) ;
   - la section **NON inclus**, héritée et affinée depuis le scope EXCLU du Brief ;
   - les `SC-xxx` — métriques, jamais adjectifs.

5. **Résous chaque `[NEEDS CLARIFICATION]`** par question ciblée. Aucun ne subsiste à la
   clôture : c'est la condition de sortie de la phase.

6. **Compile `docs/prd.md`** (trace vers `docs/brief.md`), avec des `FR-xxx`/`SC-xxx`
   numérotés de façon stable.

7. **Relis contre le bloc `<completion>`** de `references/prd.md`, et **relis-toi
   spécifiquement à la recherche d'une fuite technique** — c'est l'erreur la plus
   fréquente à cette phase.

8. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Aucun choix technique : pas de framework, de lib, de base de données, de protocole ni
  de nom de service.
- Aucune spec de feature (`spec.md`, plan, tâches) : c'est `/scd-sdd:kickoff-feature`.
- Tu ne rétro-modifies pas `docs/brief.md` pour le faire coller au PRD ; si le Brief est
  faux, tu le signales et l'humain tranche.
- Tu ne clos pas la phase avec un `[NEEDS CLARIFICATION]` résiduel.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans la section `## Socle` de
`docs/JOURNAL.md`, par `Edit` ciblé (crée le fichier ou la section s'ils manquent) :

- **Phase** : `prd`
- **Résultat** : nb de `FR-xxx` · nb de `SC-xxx` · nb de marqueurs restants.
  Exemple : `12 FR · 5 SC · 0 marqueur`.

## Skill active

- `project-docs` — charge `references/prd.md`.
- `journal` — contrat de `docs/JOURNAL.md`.

## À la fin

Confirme explicitement les deux conditions de sortie : **aucun `[NEEDS CLARIFICATION]`
ne subsiste** et **aucun choix technique n'a fuité**.

Puis : « `/clear`, puis `/scd-sdd:stack`. »
