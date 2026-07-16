---
name: feature-specs
description: |
  Connaissance transverse pour le cycle spec-driven par feature — la suite de
  scd-project-docs. La chaîne de traçabilité spec → plan → tasks → analyze qui
  descend du socle (PRD/Stack/ADR), la notation EARS (5 patterns, chaque SHALL =
  un test), le backref Kiro _Requirements:_, le découpage en lots de review (Rn :
  vertical slices dimensionnées pour qu'un humain puisse reviewer l'implémentation
  aval — bloquants qualitatifs, seuils advisory), la décision greenfield-feature vs
  brownfield-delta, l'advisory-vs-déterministe (hooks), les seuils de déclenchement
  et les templates copy-paste de chaque artefact. Porte aussi la cadence du cycle :
  une feature à la fois par défaut (le cycle boucle vers la suivante), parallèle
  possible car chaque feature écrit dans son propre dossier, et la règle de résolution
  « quelle feature est en cours » après un /clear. Se charge pendant les commandes
  /scd-feature-specs:* (kickoff, status, specify, clarify, plan, tasks, analyze).
  Porte UNIQUEMENT les specs par feature — pas les documents de gestion de projet
  créés au kickoff (brief/prd/stack/adr/CLAUDE.md), qui relèvent de scd-project-docs.
  Périmètre strictement documentaire : ni l'écriture du code, ni sa vérification
  post-implémentation (review) — le cycle se termine à la gate analyze.
---

# Specs par feature (spec-driven development)

Ce skill outille la **déclinaison** du socle projet en specs exécutables, **par feature**. Là où `scd-project-docs` pose le socle une fois (`docs/prd.md`, `docs/stack.md`, `docs/adr/`, `CLAUDE.md`), ce workflow le consomme et produit, à chaque feature, dans le repo cible :

`specs/NNN-feature/spec.md` → `plan.md` → `tasks.md` → **`analyze`** (gate terminale) → *passage de main*.

**Frontière de périmètre.** Ce workflow est **purement documentaire**. Il produit les documents d'une feature et **atteste** qu'ils sont prêts pour une implémentation optimale — puis il **s'arrête**. Tout ce qui touche au code est hors périmètre et relève d'un workflow séparé, en aval :

- **écrire le code** — ne prescris jamais *comment* implémenter (pas de boucle « jusqu'à ce que les tests passent », pas de pilotage) ;
- **vérifier le code implémenté** — la revue post-implémentation (review et autres) appartient au workflow aval. Il n'y a **pas** de phase `verify` ici.

Ici on produit le contrat et on le valide ; ailleurs on l'honore et on le vérifie. C'est la même frontière que `scd-project-docs` pose vis-à-vis des specs : chaque plugin livre un artefact et passe la main.

**Une nuance, pas une exception.** Le découpage est **dimensionné pour** que la review aval soit faisable par un humain (les lots `Rn`, ci-dessous). Décider de la taille d'une unité livrable est documentaire et se joue **ici** — après l'implémentation, redécouper coûte le prix du code déjà écrit. Mais nous ne faisons toujours **aucune** review de code : nous rendons la review possible, nous ne la conduisons pas.

`NNN` = numéro séquentiel zero-paddé (`001`, `002`…). Ces fichiers sont **vivants** (living files) : on les édite quand le comportement change, on ne les jette pas après livraison.

## La chaîne de traçabilité (elle descend du socle)

Le mot-pivot reste **traçabilité**. Chaque maillon *trace vers* le précédent ; rien ne se recopie (on lie).

| Artefact | Répond à | Trace vers | IDs |
|---|---|---|---|
| `docs/prd.md` (socle) | Quoi, niveau produit | Brief | `FR-xxx`, `SC-xxx` |
| `spec.md` (feature) | Quoi, niveau feature | PRD (`FR/SC`) | `FR-xxx` feature, `SC-xxx`, `SHALL` EARS |
| `plan.md` | Comment | spec + `docs/stack.md` + `docs/adr/` | fichiers, contrats |
| `tasks.md` | Découpage exécutable **et reviewable** | plan + spec (`_Requirements:_`) | `Rn` (lots), `Tn`, `[P]` |
| *tests + code* | *Preuve* | *tasks* | *— (workflow aval)* |

Chaîne complète : **`FR` du PRD → `FR`/`SHALL` de la spec feature → tâche → test → code**. Nous produisons et validons la chaîne **jusqu'à `tasks.md`** ; le workflow aval en écrit les deux derniers maillons. Garde les IDs stables : c'est le fil qu'il suivra.

## Cadence : une feature à la fois (et le parallèle quand il est sûr)

Les features s'ajoutent **au fur et à mesure**. Deux modes :

- **Séquentiel (défaut, recommandé)** : `kickoff → specify → clarify → plan → tasks → analyze`, puis **on recommence** avec la feature suivante. Le cycle boucle : un verdict `PRÊT` en fin d'`analyze` renvoie vers `kickoff`. C'est le mode sûr pour un solo — pas de context switching.
- **Parallèle (possible)** : plusieurs features en vol à des phases différentes. **Tout le cycle se parallélise sans risque** — chaque phase n'écrit que dans `specs/NNN-*/`, dossiers disjoints par construction. Documenter trois features avant d'en implémenter une seule est parfaitement viable.

  La contrainte de parallélisme ne porte que sur l'**implémentation**, donc **en aval, hors de ce plugin**. Signale-la quand même à la remise du contrat : deux features dont les sections « Fichiers touchés » se recoupent ne s'implémentent pas en même temps sans conflit (branche/worktree séparés, ou séquentiel). `status` croise ces sections pour le dire.

## Cibler une feature (résolution)

`/clear` entre les phases efface le contexte : une commande ne peut pas *supposer* sa cible. **Règle de résolution, identique partout** :

1. Un **argument** est fourni (`003`, `auth`, `003-auth`, ou un chemin) → c'est la cible. Match sur le préfixe `NNN` **ou** sur le slug.
2. Sinon, **une seule** feature est candidate pour cette phase (cf. table ci-dessous) → la prendre et **l'annoncer** explicitement.
3. Sinon (0 ou ≥ 2 candidates) → **ne devine jamais** : liste les candidates avec leur phase et demande via `AskUserQuestion` (ou renvoie vers `/scd-feature-specs:status`).

**Dérivation de la phase depuis les fichiers** — l'état vit dans les fichiers, pas dans le contexte : aucun fichier d'état à maintenir, donc rien qui dérive.

| État sur disque | Phase courante | Commande suivante |
|---|---|---|
| dossier vide | à spécifier | `specify` |
| `spec.md` contenant `[NEEDS CLARIFICATION]` | à clarifier | `clarify` |
| `spec.md` propre, pas de `plan.md` | à planifier | `plan` |
| `plan.md`, pas de `tasks.md` | à découper | `tasks` |
| `tasks.md` présent | à valider (gate terminale) | `analyze` |
| `DELTA.md` présent | mode **delta** (brownfield) | idem, scopé au delta |

Il n'y a **pas** d'état « livrée » dérivable : une fois `analyze` au vert, le contrat part vers le workflow d'implémentation et le suivi du code ne nous regarde plus. `analyze` étant en lecture seule et bon marché, on le **relance** plutôt que de persister un verdict — un PASS écrit sur disque deviendrait faux à la première édition.

`/scd-feature-specs:status` applique cette table à toutes les features : c'est le tableau de bord (quoi en vol, à quelle phase, quoi ensuite, et si le parallèle est sûr). Les `NNN` sont **stables et jamais réattribués** : `kickoff` prend `max(NNN) + 1`, même si des features antérieures sont livrées ou abandonnées.

## EARS — la notation des critères d'acceptation

Chaque critère d'acceptation s'écrit en **EARS** (`references/ears.md`). Forme générale :
`While <précondition>, when <déclencheur>, the <système> shall <réponse>.`
Cinq patterns : **ubiquitous, event-driven, state-driven, unwanted behavior, optional feature**.

Règle d'or : **un `SHALL` = un test nommé**. Un SHALL qui ne se traduit pas en test observable est mal écrit (adjectif au lieu de verbe vérifiable). Pour les critères multi-chemins à haute valeur, dériver un scénario **Gherkin** exécutable du SHALL (`references/gherkin.md`) — en complément, pas en remplacement.

## Les lots de review — la granularité qui décide de la review humaine

`tasks.md` a **deux** granularités, pas une :

- le **lot `Rn`** est l'unité de **review humaine** : une *vertical slice* livrant une capability vérifiable, dimensionnée pour être reviewée d'un bloc une fois implémentée. C'est l'unité de livraison recommandée à l'aval (« un lot ≈ une PR reviewable ») ;
- la **tâche `Tn`** est l'unité de **progression** : un critère observable = un commit = un test vert. L'ordre TDD vit **dans** le lot, jamais entre les lots.

Pourquoi : un `tasks.md` parfaitement tracé mais livrable en un seul bloc produit une review que personne ne fera vraiment — le reviewer skimme, et le défaut passe. La traçabilité garantit que tout est couvert ; le dimensionnement garantit que quelqu'un le lira.

**Bloquants (qualitatifs) :** un seul sujet · vertical slice (jamais une couche horizontale : « créer la table » / « créer l'API » ne se jugent qu'en assemblage) · compréhensible seul.
**Signaux de scission (advisory) :** ≈ 400 lignes estimées · ≈ 7 concepts · ≈ 5-7 critères par exigence. Un dépassement déclenche une scission verticale, **il ne rend pas un verdict** : ces seuils viennent d'études sur le code, transposés aux documents par analogie, et le budget en lignes est une estimation dérivée du plan — ce plugin ne lit pas le code. Ne les présente jamais comme des mesures.

Détail, patterns de scission et checklist : `references/reviewability.md`. Audit en contexte frais : subagent `slice-auditor`.

## Greenfield-feature vs brownfield-delta

- **Greenfield-feature** (comportement neuf) → `spec.md` complète.
- **Brownfield** (modifie un comportement existant) → **spec delta** (`references/delta.md`) : marqueurs `[ADDED]` / `[MODIFIED]` / `[REMOVED]`, cycle propose → apply → archive, fusion dans la spec de vérité une fois livré. Empêche l'hallucination d'exigences sur l'existant et combat la dérive spec↔code.

## Advisory vs déterministe

`CLAUDE.md` et les specs sont du contexte **advisory** : aucune garantie d'application. Ce qui DOIT arriver à 100 % est un **hook** (voir `hooks/` du plugin) :
- immutabilité des ADR → PreToolUse `exit 2` ;
- format/lint après édition → PostToolUse.

Piège : **`exit 2` = bloquer ; `exit 1` = erreur ignorée**. Une gate écrite en `exit 1` ne bloque rien.

Les gates liées à l'exécution des tests (« ne pas finir tant que c'est rouge ») appartiennent au workflow d'implémentation, **pas à ce plugin** : ici, aucun test n'est exécuté. Notre seule gate est `analyze` — advisory, sur les **documents**, avec deux seconds regards en contexte frais aux mandats disjoints : `ears-verifier` (contrat : traçabilité, EARS, frontières) et `slice-auditor` (découpage : verticalité, sujet unique, dimensionnement).

## Seuils de déclenchement (repris de la constitution CLAUDE.md)

Ne pas sur-cérémonialiser. Avant `kickoff`, calibrer :
- Diff descriptible en une phrase → direct, **pas de spec**, pas de plan mode.
- 1 fichier, comportement localisé → `tasks.md` léger éventuel, pas de cycle complet.
- Multi-fichiers / nouveau comportement / code non familier → **cycle complet** spec→plan→tasks→analyze.
- Décision transverse / architecturale → **nouvel ADR d'abord** (retour vers `scd-project-docs` ou candidat dans `docs/adr/_candidates/`).

## Règles d'écriture pour un agent

- **Verbe vérifiable, jamais adjectif.** « rapide / robuste / sécurisé » = cible nulle. Écrire « P99 < 50 ms », « retourne un code structuré pour tout 4xx/5xx ».
- **Spec technology-agnostic.** Le *quoi* et les critères ; aucun framework/lib/DB (ça descend dans `plan.md`, qui s'appuie sur `stack.md`/`adr/`).
- **Scope EXCLU explicite.** Nommer ce que la feature ne fait PAS borne l'agent.
- **Un seul endroit par info.** Lier vers le socle, ne pas recopier.
- **Plan mode pour `plan.md`** (recommander `opusplan` : Opus planifie, Sonnet exécute).
- **Découper verticalement.** Un lot = une capability traversant les couches. Une couche seule n'est pas reviewable seule.
- **Revue adverse** en contexte frais (subagents `ears-verifier` et `slice-auditor`) : rapporter les gaps, pas les préférences de style. Les documents audités sont générés par IA — verbeux et sur-complets, donc « ils ont l'air complets » est le cas où il faut lire ligne à ligne. Chercher l'erreur, pas la confirmation.

## Les artefacts et outils (progressive disclosure)

Charge **uniquement** la référence de la phase courante (la commande le fait) :

- `references/status.md` — Tableau de bord des features (dérivation de phase, sûreté du parallèle). Sections : `role`, `report`, `guidance`
- `references/spec.md` — Spec de feature (EARS, FR, scope EXCLU). Sections : `role`, `template`, `guidance`, `completion`
- `references/clarify.md` — Gate de clarification (`[NEEDS CLARIFICATION]`). Sections : `role`, `process`, `completion`
- `references/plan.md` — Plan technique (réutilise stack/ADR, plan mode). Sections : `role`, `template`, `guidance`, `completion`
- `references/tasks.md` — Plan de tâches : lots `Rn` + tâches `Tn` (backref `_Requirements:_`, TDD, `[P]`). Sections : `role`, `template`, `guidance`, `completion`
- `references/reviewability.md` — Dimensionner les lots de review (bloquants vs signaux, patterns de scission verticale). Chargée avec `tasks.md` pendant la phase `tasks`. Sections : `role`, `criteria`, `splitting`, `pitfalls`
- `references/analyze.md` — **Gate terminale** : 14 contrôles de validation du contrat et du découpage, rapport Critical/Major/Minor + verdict. Sections : `role`, `checks`, `report`, `guidance`
- `references/ears.md` — Les 5 patterns EARS + SHALL→test. Sections : `patterns`, `examples`, `pitfalls`
- `references/delta.md` — Modèle delta brownfield (OpenSpec). Sections : `role`, `template`, `guidance`
- `references/gherkin.md` — Complément Gherkin dérivé d'EARS. Sections : `role`, `template`, `guidance`
- `references/autonomous-loops.md` — boucle de maintenance du drift spec↔code (gabarit `loop.md`). **Ne pilote aucune implémentation.** Sections : `scope`, `loop-md`, `pitfalls`
