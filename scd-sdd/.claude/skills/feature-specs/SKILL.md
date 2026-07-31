---
name: feature-specs
description: |
  Le NIVEAU SPECS du cycle spec-driven : la déclinaison du socle en contrat
  exécutable, une feature à la fois. Chaîne spec → plan → tasks → analyze, notation
  EARS (5 patterns, un SHALL = une vérification observable), mode de vérification
  par lot (TDD par défaut, sinon test-after / check / inhérent), backref Kiro
  _Requirements:_, découpage en lots de review Rn dimensionnés pour qu'un humain
  puisse reviewer l'implémentation aval, greenfield-feature vs brownfield-delta, et
  la règle de résolution « quelle feature est en cours » après un /clear. Se charge
  pendant /scd-sdd:kickoff-feature, specify, clarify, plan, tasks, analyze,
  premortem et status-specs. Porte UNIQUEMENT les specs par feature — ni le socle
  (skill project-docs), ni l'écriture ou la review du code (skill implement), ni le
  contrat du fichier de suivi (skill journal).
---

# Specs par feature

Ce skill outille la **déclinaison** du socle en specs exécutables, **par feature**. Là où le
niveau socle se pose une fois (`docs/prd.md`, `docs/stack.md`, `docs/adr/`, `CLAUDE.md`), ce
niveau le consomme et produit, à chaque feature :

`specs/NNN-slug/spec.md` → `plan.md` → `tasks.md` → **`analyze`** (gate de conformité) →
**`premortem`** (durcissement adverse, optionnel) → *passage de main à l'implémentation*.

`NNN` = numéro séquentiel zero-paddé (`001`, `002`…). Ces fichiers sont **vivants** : on les
édite quand le comportement change, on ne les jette pas après livraison.

**Frontière de périmètre.** Ce niveau est **purement documentaire** : il produit le contrat
d'une feature, atteste qu'il est prêt, et s'arrête. Écrire le code et le reviewer relèvent du
niveau suivant (skill `implement`) — ne prescris jamais *comment* implémenter, ne pilote
aucune boucle « jusqu'à ce que les tests passent », n'exécute aucun test. Il n'y a **pas** de
phase `verify` ici : le `premortem` durcit le *contrat* par projection d'échec, pas du code
qui n'existe pas encore. Seule nuance : le **dimensionnement** des lots `Rn` se joue ici, car
après l'implémentation redécouper coûte le prix du code écrit. On rend la review possible ; on
ne la conduit pas.

**Deux natures de phase.** `specify`, `clarify`, `plan`, `tasks` et `premortem` **écrivent** ;
`analyze` et `status-specs` sont en **lecture seule**. `premortem` est la dernière phase
d'écriture et la seule dont les modifications sont proposées par des sous-agents : un contrat
qui part à l'implémentation ne doit pas avoir été altéré par une IA sans revue, d'où le **gate
d'approbation humain** avant écriture, puis la **re-passe `analyze`**.

## La chaîne de traçabilité (elle descend du socle)

Le mot-pivot reste **traçabilité**. Chaque maillon *trace vers* le précédent ; rien ne se
recopie (on lie).

| Artefact | Répond à | Trace vers | IDs |
|---|---|---|---|
| `docs/prd.md` (socle) | Quoi, niveau produit | Brief | `FR-xxx`, `SC-xxx` |
| `spec.md` (feature) | Quoi, niveau feature | PRD (`FR/SC`) | `FR-xxx` feature, `SC-xxx`, `SHALL` EARS |
| `plan.md` | Comment | spec + `docs/stack.md` + `docs/adr/` | fichiers, contrats |
| `tasks.md` | Découpage exécutable **et reviewable** | plan + spec (`_Requirements:_`) | `Rn` (lots), `Tn`, `[P]` |
| *vérif + code* | *Preuve* | *tasks* | *— (niveau implémentation)* |

Chaîne complète : **`FR` du PRD → `FR`/`SHALL` de la spec feature → tâche → vérification →
code**. Ce niveau produit et valide la chaîne **jusqu'à `tasks.md`** ; l'implémentation en
écrit les deux derniers maillons. Garde les IDs stables : c'est le fil qu'elle suivra.

## Cadence : une feature à la fois (et le parallèle quand il est sûr)

- **Séquentiel (défaut, recommandé)** : `kickoff-feature → specify → clarify → plan → tasks →
  analyze → premortem → (re-analyze)`, puis on recommence avec la feature suivante. Le cycle
  boucle. `premortem` est **optionnel** (à calibrer, cf. seuils) et suit une première gate au
  vert. C'est le mode sûr pour un solo — pas de context switching.
- **Parallèle (possible)** : plusieurs features en vol à des phases différentes. **Tout ce
  niveau se parallélise sans risque** — chaque phase n'écrit que dans `specs/NNN-*/`, dossiers
  disjoints par construction. Documenter trois features avant d'en implémenter une seule est
  parfaitement viable.

  La contrainte de parallélisme ne porte que sur l'**implémentation**. Signale-la quand même à
  la remise du contrat : deux features dont les sections « Fichiers touchés » se recoupent ne
  s'implémentent pas en même temps sans conflit. `status-specs` croise ces sections pour le
  dire.

## Cibler une feature (résolution)

`/clear` entre les phases efface le contexte : une commande ne peut pas *supposer* sa cible.
**Règle de résolution, identique partout** :

1. Un **argument** est fourni (`003`, `auth`, `003-auth`, ou un chemin) → c'est la cible.
   Match sur le préfixe `NNN` **ou** sur le slug.
2. Sinon, **une seule** feature est candidate pour cette phase (cf. table ci-dessous) → la
   prendre et **l'annoncer** explicitement.
3. Sinon (0 ou ≥ 2 candidates) → **ne devine jamais** : liste les candidates avec leur phase
   et demande via `AskUserQuestion` (ou renvoie vers `/scd-sdd:status-specs`).

**Dérivation de la phase depuis les fichiers** — l'état vit dans les fichiers, pas dans le
contexte : aucun fichier d'état à maintenir, donc rien qui dérive.

| État sur disque | Phase courante | Commande suivante |
|---|---|---|
| dossier vide | à spécifier | `specify` |
| `spec.md` contenant `[NEEDS CLARIFICATION]` | à clarifier | `clarify` |
| `spec.md` propre, pas de `plan.md` | à planifier | `plan` |
| `plan.md`, pas de `tasks.md` | à découper | `tasks` |
| `tasks.md` présent | à valider (gate de conformité) | `analyze` |
| `DELTA.md` présent | mode **delta** (brownfield) | idem, scopé au delta |

`premortem` **n'apparaît pas dans la table** : il édite les fichiers existants sans produire de
marqueur, donc il n'est pas dérivable de l'état disque. C'est une passe **explicitement
invoquée** après une première gate `analyze` au vert, quand on veut durcir le contrat avant le
passage de main ; ses modifications sont ensuite re-gatées par `analyze`.

Il n'y a **pas** d'état « livrée » dérivable : une fois `analyze` au vert (et le `premortem`
éventuel appliqué puis reconfirmé), le contrat part au niveau implémentation. `analyze` étant
en lecture seule et bon marché, on le **relance** plutôt que d'en persister le verdict comme
un état — un PASS écrit sur disque deviendrait faux à la première édition.

`/scd-sdd:status-specs` applique cette table à toutes les features : c'est le tableau de bord
(quoi en vol, à quelle phase, quoi ensuite, et si le parallèle est sûr). Les `NNN` sont
**stables et jamais réattribués** : `kickoff-feature` prend `max(NNN) + 1`, même si des
features antérieures sont livrées ou abandonnées.

**Cette table est la source de vérité unique du plugin.** Les commandes, les trois `status` et
`run` la **référencent** ; elles ne la recopient jamais.

## État dérivé, événement journalisé

La dérivation ci-dessus donne un instantané : elle dit *où on en est*, jamais *quand on y est
arrivé*. Chaque commande de ce niveau consigne donc sa ligne dans la section `## NNN-slug` de
`docs/JOURNAL.md` — `kickoff-feature` crée la section, les six suivantes y ajoutent une ligne
datée. Seul `status-specs` n'écrit rien : il lit.

Deux de ces lignes portent un fait que **rien ne permet de dériver** :

- le **verdict d'`analyze`** — la gate est en lecture seule, elle n'écrit aucun rapport ;
- un **`premortem` appliqué** — il édite `spec/plan/tasks` sans laisser le moindre marqueur.

Le format, la règle d'ajout et le vocabulaire attendu par phase appartiennent au skill
**`journal`**, chargé au moment de consigner — ils ne sont pas recopiés ici. Retenir seulement
la frontière : une ligne est un **événement daté**, définitivement vrai, jamais un état. Un
lecteur ne la convertit en état qu'après un **contrôle de fraîcheur** contre la dernière
modification des fichiers concernés.

## EARS — la notation des critères d'acceptation

Chaque critère d'acceptation s'écrit en **EARS** (`references/ears.md`). Forme générale :
`While <précondition>, when <déclencheur>, the <système> shall <réponse>.`
Cinq patterns : **ubiquitous, event-driven, state-driven, unwanted behavior, optional
feature**.

Règle d'or : **un `SHALL` = une vérification observable et nommée**. Un SHALL qui ne se traduit
pas en vérification observable est mal écrit (adjectif au lieu de verbe vérifiable).
*Observable* n'impose pas *test automatisé* : la **forme** de la vérification se décide en
phase `tasks` via le mode du lot ; la spec garantit seulement que le critère est vérifiable.
Pour un critère multi-chemins à haute valeur, dériver un scénario **Gherkin** exécutable
(`references/gherkin.md`) — en complément, jamais en remplacement.

## Les lots de review — la granularité qui décide de la review humaine

`tasks.md` a **deux** granularités, pas une :

- le **lot `Rn`** est l'unité de **review humaine** : une *vertical slice* livrant une
  capability vérifiable, dimensionnée pour être reviewée d'un bloc une fois implémentée. C'est
  l'unité de livraison recommandée à l'aval (« un lot ≈ une PR reviewable ») ;
- la **tâche `Tn`** est l'unité de **progression** : un critère observable = un commit = une
  vérification au vert. L'ordre de vérification vit **dans** le lot, jamais entre les lots.

Pourquoi : un `tasks.md` parfaitement tracé mais livrable en un seul bloc produit une review
que personne ne fera vraiment — le reviewer skimme, et le défaut passe. La traçabilité garantit
que tout est couvert ; le dimensionnement garantit que quelqu'un le lira.

**Bloquants (qualitatifs)** : un seul sujet · vertical slice (jamais une couche horizontale :
« créer la table » / « créer l'API » ne se jugent qu'en assemblage) · compréhensible seul.
**Signaux de scission (advisory)** : ≈ 400 lignes estimées · ≈ 7 concepts · ≈ 5-7 critères par
exigence. Un dépassement déclenche une scission verticale, **il ne rend pas un verdict** : ces
seuils viennent d'études sur le code, transposés aux documents par analogie, et le budget en
lignes est une estimation dérivée du plan — ce niveau ne lit pas le code. Ne les présente
jamais comme des mesures.

Détail, patterns de scission et checklist : `references/reviewability.md`. Audit en contexte
frais : subagent `slice-auditor`.

## Le mode de vérification — le test automatisé est le défaut, pas la loi

L'invariant du contrat : **chaque `FR`/`SHALL` est rattaché à ≥ 1 tâche dont l'achèvement est
observable**, plus ≥ 1 tâche d'impl. Le test automatisé écrit d'abord (TDD) en est la **forme
par défaut** — mais certaines features ne s'y prêtent pas (CI, infra, config, mise en page,
one-shot). Chaque lot déclare donc un **mode** (`_vérif : <mode>_`) ; dès qu'il quitte `TDD`,
une justification d'une ligne l'accompagne (déviation documentée, jamais silencieuse) :

| Mode | Preuve | Pour |
|---|---|---|
| `TDD` (défaut) | test écrit **avant** l'impl, passé au vert | tout ce qui est testable |
| `test-after` | test automatisé écrit après l'impl | refactor à comportement constant |
| `check` | vérification observable dédiée, pas de test auto | visuel, one-shot |
| `inhérent` | **aucune tâche de vérif séparée** : le critère d'acceptation de l'impl *est* la preuve (CI au vert, `terraform apply` converge) | CI, infra, config, scaffolding |

Ce qui ne bouge jamais : la preuve reste **observable** (jamais un adjectif nu) et **traçable**
— la chaîne `SHALL → vérification → code` tient dans les quatre modes. Le défaut reste `TDD` :
un `check`/`inhérent` sur de la logique métier est un finding d'`analyze`, pas un raccourci.
Taxonomie : `references/tasks.md`.

## Greenfield-feature vs brownfield-delta

- **Greenfield-feature** (comportement neuf) → `spec.md` complète.
- **Brownfield** (modifie un comportement existant) → **spec delta**
  (`references/delta.md`) : marqueurs `[ADDED]` / `[MODIFIED]` / `[REMOVED]`, cycle propose →
  apply → archive, fusion dans la spec de vérité une fois livré. Empêche l'hallucination
  d'exigences sur l'existant et combat la dérive spec↔code.

## Advisory vs déterministe

`CLAUDE.md` et les specs sont du contexte **advisory** : aucune garantie d'application. Ce qui
DOIT arriver à 100 % est un **hook** (`hooks/` du plugin) :

- immutabilité des ADR → PreToolUse `exit 2` ;
- format/lint après édition → PostToolUse.

Piège : **`exit 2` = bloquer ; `exit 1` = erreur ignorée**. Une gate écrite en `exit 1` ne
bloque rien.

Les gates liées à l'exécution des tests appartiennent au niveau implémentation : ici, aucun
test n'est exécuté. Notre seule gate est `analyze` — advisory, sur les **documents**, épaulée
par des seconds regards en contexte frais aux mandats disjoints :

| Subagent | Phase | Mandat |
|---|---|---|
| `ears-verifier` | `analyze` | contrat : traçabilité, EARS, frontières, cohérence socle (contrôles 1-11) |
| `slice-auditor` | `analyze` | découpage : verticalité, sujet unique, dimensionnement (12-14) |
| `premortem-facilitator` | `premortem` | génère les modes de défaillance |
| `premortem-validator` | `premortem` | trie, rejette la spéculation et le scope creep |
| `premortem-applier` | `premortem` | inscrit **uniquement** l'ensemble approuvé par l'humain |

Le trio `premortem-*` pilote la seule passe d'écriture déléguée du niveau : le gate humain
garde la décision du *quoi*, l'`exit 2` de `block-adr-edits` empêche l'applicateur de toucher
un ADR accepté, et la re-passe `analyze` reconfirme la conformité.

## Seuils de déclenchement (repris de la constitution `CLAUDE.md`)

Ne pas sur-cérémonialiser. Avant `kickoff-feature`, calibrer :

- Diff descriptible en une phrase → direct, **pas de spec**, pas de plan mode.
- 1 fichier, comportement localisé → `tasks.md` léger éventuel, pas de cycle complet.
- Multi-fichiers / nouveau comportement / code non familier → **cycle complet**
  spec→plan→tasks→analyze.
- Décision transverse / architecturale → **nouvel ADR d'abord** (`/scd-sdd:adr`, ou candidat
  dans `docs/adr/_candidates/`).

## Règles d'écriture pour un agent

- **Verbe vérifiable, jamais adjectif.** « rapide / robuste / sécurisé » = cible nulle. Écrire
  « P99 < 50 ms », « retourne un code structuré pour tout 4xx/5xx ».
- **Spec technology-agnostic.** Le *quoi* et les critères ; aucun framework/lib/DB (ça descend
  dans `plan.md`, qui s'appuie sur `stack.md`/`adr/`).
- **Scope EXCLU explicite.** Nommer ce que la feature ne fait PAS borne l'agent.
- **Un seul endroit par info.** Lier vers le socle, ne pas recopier.
- **Plan mode pour `plan.md`** (recommander `opusplan` : Opus planifie, Sonnet exécute).
- **Chercher l'erreur, pas la confirmation.** Les documents audités sont générés par IA —
  verbeux et sur-complets. « Ils ont l'air complets » est précisément le cas où il faut lire
  ligne à ligne. Un audit rapporte des gaps, jamais des préférences de style.

## Les artefacts et outils (progressive disclosure)

Charge **uniquement** la référence de la phase courante (la commande le fait) :

| Référence | Contenu | Sections |
|---|---|---|
| `spec.md` | Spec de feature (EARS, FR, scope EXCLU) | `role` `template` `guidance` `completion` |
| `clarify.md` | Gate de clarification (`[NEEDS CLARIFICATION]`) | `role` `process` `completion` |
| `plan.md` | Plan technique (réutilise stack/ADR, plan mode) | `role` `template` `guidance` `completion` |
| `tasks.md` | Lots `Rn` + tâches `Tn` (backref, mode de vérif, `[P]`) | `role` `template` `guidance` `completion` |
| `reviewability.md` | Dimensionner les lots — chargée **avec** `tasks.md` | `role` `criteria` `splitting` `pitfalls` |
| `analyze.md` | Gate de conformité : 14 contrôles, rapport + verdict | `role` `checks` `report` `guidance` |
| `premortem.md` | Durcissement adverse : 3 sous-agents + gate humain | `role` `lenses` `process` `remediation-forms` `guidance` |
| `status.md` | Tableau de bord : phase dérivée, gate journalisée, fraîcheur | `role` `report` `guidance` |
| `ears.md` | Les 5 patterns EARS + SHALL → vérification | `patterns` `examples` `pitfalls` |
| `delta.md` | Modèle delta brownfield (OpenSpec) | `role` `template` `guidance` |
| `gherkin.md` | Complément Gherkin dérivé d'EARS | `role` `template` `guidance` |
| `autonomous-loops.md` | Drift spec↔code — **ne pilote aucune implémentation** | `scope` `loop-md` `pitfalls` |
