---
name: feature-specs
description: |
  Le NIVEAU SPECS du cycle spec-driven : la déclinaison du socle en contrat exécutable, une
  feature à la fois. Chaîne spec → plan → tasks → analyze, notation EARS (5 patterns, un
  SHALL = une vérification observable), mode de vérification par lot (TDD par défaut, sinon
  test-after / check / inhérent), backref Kiro _Requirements:_, découpage en lots de review
  Rn dimensionnés pour qu'un humain puisse reviewer l'implémentation aval, greenfield-feature
  vs brownfield-delta, et la règle de résolution « quelle feature est en cours » après un
  /clear. Se charge pendant /scd-sdd:kickoff-feature, specify, clarify, plan, tasks, analyze,
  premortem et status-specs. Porte UNIQUEMENT les specs par feature — ni le socle (skill
  project-docs), ni l'écriture ou la review du code (skill implement), ni le contrat du
  fichier de suivi (skill journal).
---

# Specs par feature

Ce skill outille la **déclinaison** du socle en specs exécutables, **par feature** :
`specs/NNN-slug/spec.md` → `plan.md` → `tasks.md` → **`analyze`** (gate de conformité) →
*[`premortem`, optionnel]* → *passage de main à l'implémentation*.
`NNN` = numéro séquentiel zero-paddé (`001`, `002`…). Ces fichiers sont **vivants** : on les
édite quand le comportement change, on ne les jette pas après livraison.

**Frontière de périmètre.** Ce niveau est **purement documentaire** : il produit le contrat
d'une feature, atteste qu'il est prêt, et s'arrête. Écrire le code et le reviewer relèvent du
skill `implement` — ne prescris jamais *comment* implémenter, n'exécute aucun test. Seule
nuance : le **dimensionnement** des lots `Rn` se joue ici, car après l'implémentation
redécouper coûte le prix du code écrit. On rend la review possible ; on ne la conduit pas.

**Deux natures de phase.** `specify`, `clarify`, `plan` et `tasks` **écrivent** ; `analyze` et
`status-specs` sont en **lecture seule**. **`premortem` n'est pas une phase de ce niveau** : c'est
une **capacité transverse** (socle, feature, chantier), qui se joue ici *après* une gate au vert,
durcit le *contrat* et impose une **re-passe `analyze`** puisqu'elle modifie ce que la gate venait
d'attester. Seule écriture **déléguée** du plugin, d'où son gate humain. Skill **`premortem`**.

## La chaîne de traçabilité (elle descend du socle)

Le mot-pivot reste **traçabilité**. Chaque maillon *trace vers* le précédent ; rien ne se
recopie (on lie).

| Artefact | Répond à | Trace vers | IDs |
|---|---|---|---|
| `docs/prd.md` (socle) | Quoi, niveau produit | Brief | `FR-xxx`, `SC-xxx` |
| `spec.md` (feature) | Quoi, niveau feature | PRD (`FR/SC`) | `FR-xxx` feature, `SC-xxx`, `SHALL` EARS |
| `plan.md` | Comment | spec + `docs/stack.md` + `docs/archi.md` + `docs/adr/` | fichiers, contrats |
| `tasks.md` | Découpage exécutable **et reviewable** | plan + spec (`_Requirements:_`) | `Rn` (lots), `Tn`, `[P]` |
| *vérif + code* | *Preuve* | *tasks* | *— (niveau implémentation)* |

Chaîne complète : **`FR` du PRD → `FR`/`SHALL` de la spec feature → tâche → vérification →
code**. Ce niveau valide la chaîne **jusqu'à `tasks.md`** ; l'implémentation écrit les deux
derniers maillons. Garde les IDs stables : c'est le fil qu'elle suivra.

## Cadence : une feature à la fois (et le parallèle quand il est sûr)

**Séquentiel (défaut, recommandé)** : `kickoff-feature → specify → clarify → plan → tasks →
analyze` (+ `premortem → re-analyze` si l'enjeu le justifie), puis la suivante — le mode sûr en solo.
**Parallèle (possible)** : tout ce niveau se parallélise, chaque phase n'écrivant que dans
`specs/NNN-*/`, disjoints par construction. La contrainte ne porte que sur
l'**implémentation** : deux features aux « Fichiers touchés » communs ne s'implémentent pas
en même temps — `status-specs` croise ces sections pour le dire.

## Cibler une feature (résolution)

`/clear` entre les phases efface le contexte : une commande ne peut pas *supposer* sa cible.
**Règle de résolution, identique partout** :

1. Un **argument** est fourni (`003`, `auth`, `003-auth`, ou un chemin) → c'est la cible.
   Match sur le préfixe `NNN` **ou** sur le slug.
2. Sinon, **une seule** candidate pour cette phase (table ci-dessous) → la prendre et **l'annoncer**.
3. Sinon (0 ou ≥ 2 candidates) → **ne devine jamais** : liste les candidates avec leur phase
   et demande via `AskUserQuestion` (ou renvoie vers `/scd-sdd:status-specs`).

**Dérivation de la phase depuis les fichiers** — aucun fichier d'état à maintenir, rien qui dérive.

| État sur disque | Phase courante | Commande suivante |
|---|---|---|
| dossier vide | à spécifier | `specify` |
| `spec.md` contenant `[NEEDS CLARIFICATION]` | à clarifier | `clarify` |
| `spec.md` propre, pas de `plan.md` | à planifier | `plan` |
| `plan.md`, pas de `tasks.md` | à découper | `tasks` |
| `tasks.md` présent | à valider (gate de conformité) | `analyze` |
| `DELTA.md` présent | mode **delta** (brownfield) | idem, scopé au delta |

`premortem` **n'apparaît pas dans la table**, et n'y apparaîtra jamais : il édite sans produire
de marqueur, et n'est pas une phase — passe **explicitement invoquée** après une gate au vert,
re-gatée ensuite ; une feature sans premortem n'est pas incomplète. Pas d'état « livrée » non
plus : `analyze`, lecture seule et bon marché, se **relance** plutôt que
d'en persister le verdict (un PASS écrit deviendrait faux à la première édition).
`/scd-sdd:status-specs` applique cette table à toutes les features. Les `NNN` sont **stables
et jamais réattribués** (`max(NNN) + 1`).

**Cette table est la source de vérité unique du plugin.** Les commandes, les trois `status` et
`run` la **référencent** ; elles ne la recopient jamais.

## État dérivé, événement journalisé

La dérivation dit *où on en est*, jamais *quand on y est arrivé*. Chaque
commande de ce niveau consigne donc sa ligne dans `docs/journal/NNN-slug.md` —
`kickoff-feature` crée le fichier, les suivantes ajoutent une ligne datée ; `status-specs` lit
sans écrire. Deux lignes portent un fait que **rien ne permet de dériver** : le **verdict
d'`analyze`** (gate en lecture seule, aucun rapport écrit) et un **`premortem` appliqué**
(aucun marqueur laissé). Une ligne est un **événement daté**, jamais un état : un lecteur ne
la convertit en état qu'après un **contrôle de fraîcheur** contre la dernière modification des
fichiers. Format, règle d'ajout et vocabulaire : skill **`journal`**.

## EARS — la notation des critères d'acceptation

Chaque critère d'acceptation s'écrit en **EARS** (`references/ears.md`, 5 patterns) :
`While <précondition>, when <déclencheur>, the <système> shall <réponse>.` Règle
d'or : **un `SHALL` = une vérification observable et nommée** — un SHALL qui ne s'y
traduit pas est mal écrit (adjectif au lieu de verbe vérifiable). *Observable* n'impose pas
*test automatisé* : la **forme** se décide en phase `tasks` via le mode du lot. Pour un
critère multi-chemins à haute valeur, dériver un **Gherkin** (`references/gherkin.md`) — en
complément, jamais en remplacement.

## Les lots de review — la granularité qui décide de la review humaine

`tasks.md` a **deux** granularités : le **lot `Rn`**, unité de **review humaine** — une
*vertical slice* livrant une capability vérifiable, « un lot ≈ une PR reviewable » — et la
**tâche `Tn`**, unité de **progression** (un critère observable = un commit). La traçabilité
garantit que tout est couvert ; le dimensionnement garantit que quelqu'un le lira.
**Bloquants (qualitatifs)** : un seul sujet · vertical slice (jamais une couche horizontale) ·
compréhensible seul. **Signaux de scission (advisory)** : ≈ 400 lignes · ≈ 7 concepts ·
≈ 5-7 critères par exigence — des estimations, jamais des mesures ni des verdicts. Seuils,
patterns et checklist : `references/reviewability.md`. Audit en contexte frais : `slice-auditor`.

## Le mode de vérification — le test automatisé est le défaut, pas la loi

L'invariant du contrat : **chaque `FR`/`SHALL` est rattaché à ≥ 1 tâche dont l'achèvement est
observable**, plus ≥ 1 tâche d'impl. Chaque lot déclare son **mode** (`_vérif : <mode>_`) ;
dès qu'il quitte `TDD`, une justification d'une ligne l'accompagne :

| Mode | Preuve | Pour |
|---|---|---|
| `TDD` (défaut) | test écrit **avant** l'impl, passé au vert | tout ce qui est testable |
| `test-after` | test automatisé écrit après l'impl | refactor à comportement constant |
| `check` | vérification observable dédiée, pas de test auto | visuel, one-shot |
| `inhérent` | **aucune tâche de vérif séparée** : le critère d'acceptation de l'impl *est* la preuve | CI, infra, config, scaffolding |

La preuve reste **observable** et **traçable** dans les quatre modes ; un `check`/`inhérent`
sur de la logique métier est un finding d'`analyze`. Taxonomie : `references/tasks.md`.

## Greenfield-feature vs brownfield-delta

- **Greenfield-feature** (comportement neuf) → `spec.md` complète.
- **Brownfield** (modifie un comportement existant) → **spec delta** (`references/delta.md`) :
  marqueurs `[ADDED]` / `[MODIFIED]` / `[REMOVED]`, cycle propose → apply → archive, fusion
  dans la spec de vérité une fois livré — empêche d'halluciner des exigences sur l'existant.

## Advisory vs déterministe

`CLAUDE.md` et les specs sont du contexte **advisory** : aucune garantie d'application. Ce qui
DOIT arriver à 100 % est un **hook** (`hooks/` du plugin) : immutabilité des ADR → PreToolUse
`exit 2` ; format/lint → PostToolUse. Piège : **`exit 2` = bloquer ; `exit 1` = erreur
ignorée**. Les gates liées aux tests appartiennent au niveau implémentation. Notre seule gate
est `analyze` — advisory, sur les **documents**, épaulée par des seconds regards en contexte
frais aux mandats disjoints : `ears-verifier` (contrat : traçabilité, EARS, frontières —
contrôles 1-11) et `slice-auditor` (découpage : verticalité, sujet unique, dimensionnement —
12-14). Le **15ᵉ** — les invariants d'architecture — n'est délégué à personne : la commande le
joue elle-même, faute d'un mandat qui lui corresponde. Hors gate, le trio `premortem-facilitator` / `premortem-validator` / `premortem-applier`
pilote la seule écriture **déléguée** du plugin : le gate humain garde la décision du *quoi*,
l'`exit 2` de `block-adr-edits` protège les ADR acceptés, et la re-passe `analyze` reconfirme.

## Seuils de déclenchement (repris de la constitution `CLAUDE.md`)

Ne pas sur-cérémonialiser. Avant `kickoff-feature`, calibrer : diff descriptible en une phrase
→ direct, **pas de spec** ; 1 fichier, comportement localisé → `tasks.md` léger éventuel ;
multi-fichiers / nouveau comportement / code non familier → **cycle complet** ; décision
transverse ou architecturale → **nouvel ADR d'abord** (`/scd-sdd:adr`, ou candidat dans
`docs/adr/_candidates/`).

## Règles d'écriture pour un agent

- **Verbe vérifiable, jamais adjectif** : « P99 < 50 ms », pas « rapide ».
- **Spec technology-agnostic.** Le *quoi* et les critères ; aucun framework/lib/DB (ça descend
  dans `plan.md`, qui s'appuie sur `stack.md`/`adr/`).
- **Scope EXCLU explicite.** Nommer ce que la feature ne fait PAS borne l'agent.
- **Un seul endroit par info.** Lier vers le socle, ne pas recopier.
- **Plan mode pour `plan.md`** (recommander `opusplan` : Opus planifie, Sonnet exécute).
- **Chercher l'erreur, pas la confirmation.** Les documents audités sont générés par IA —
  « ils ont l'air complets » est le cas où lire ligne à ligne. Un audit rapporte des gaps,
  jamais des préférences de style.

## Les artefacts et outils (progressive disclosure)

Charge **uniquement** la référence de la phase courante (la commande le fait) :

| Référence | Contenu | Sections |
|---|---|---|
| `spec.md` | Spec de feature (EARS, FR, scope EXCLU) | `role` `template` `guidance` `completion` |
| `clarify.md` | Gate de clarification (`[NEEDS CLARIFICATION]`) | `role` `process` `completion` |
| `plan.md` | Plan technique (réutilise stack/ADR, plan mode) | `role` `template` `guidance` `completion` |
| `tasks.md` | Lots `Rn` + tâches `Tn` (backref, mode de vérif, `[P]`) | `role` `template` `guidance` `completion` |
| `reviewability.md` | Dimensionner les lots — chargée **avec** `tasks.md` | `role` `criteria` `splitting` `pitfalls` |
| `analyze.md` | Gate de conformité : 15 contrôles, rapport + verdict | `role` `checks` `report` `gate` `guidance` |
| `status.md` | Tableau de bord : phase dérivée, gate journalisée, fraîcheur | `role` `report` `guidance` |
| `ears.md` | Les 5 patterns EARS + SHALL → vérification | `patterns` `examples` `pitfalls` |
| `delta.md` | Modèle delta brownfield (OpenSpec) | `role` `template` `guidance` |
| `gherkin.md` | Complément Gherkin dérivé d'EARS | `role` `template` `guidance` |
| `autonomous-loops.md` | Drift spec↔code — **ne pilote aucune implémentation** | `scope` `loop-md` `pitfalls` |
