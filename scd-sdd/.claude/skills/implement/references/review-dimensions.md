# Référence — Dimensions de review, dossier de contexte et triage sceptique

**Points de chargement, tous par un agent** — aucune commande ne charge ce fichier : la review ne se
joue que dans le workflow, par ces agents. Chacun ne charge **que ses blocs** :

- l'agent **`review-context`** — `<dossier>` **seul** : il collecte le contexte (invariants ADR,
  sections de spec) que les six reviewers consomment. Il **ne juge pas**.
- les **six agents reviewers**, un par dimension, joués **en parallèle** — chacun **son** bloc
  `<dim-…>` **et** `<severity>`, jamais une autre dimension ni `<triage>` : `architecture-reviewer`
  (`<dim-architecture>`), `cleanliness-reviewer` (`<dim-cleanliness>`), `conventions-reviewer`
  (`<dim-conventions>`), `coverage-reviewer` (`<dim-coverage>`), `security-reviewer`
  (`<dim-security>`), `error-handling-reviewer` (`<dim-error-handling>`). Chacun produit et classe
  les findings de **sa seule** dimension ; il ne les trie pas.
- l'agent **`review-validator`** — `<triage>` **seul**, ni `<dossier>`, ni un `<dim-…>`, ni
  `<severity>` : trier des findings **déjà produits et classés** est son unique rôle.

Ce qui est ici ne se recopie **ni** dans le corps d'un agent, **ni** dans sa sortie : il l'applique.

<role>
Les six dimensions de la code review — **une par agent reviewer, jouées en parallèle** —, le
**dossier de contexte** qui les alimente une fois pour toutes, le modèle de sévérité partagé, et la
discipline de triage adversarial. Le second regard est en **contexte frais** : aucun reviewer n'a
écrit le code, et c'est ce qui le rend utile (un reviewer non biaisé voit ce que l'auteur ne voit
plus).
</role>

<dossier>
## Le dossier de contexte — `review-context`

Six reviewers vont juger le **même** diff. Leur faire lire à chacun `docs/adr/` et `SPEC.md` serait
six lectures redondantes et potentiellement divergentes. `review-context` les fait **une fois**, en
contexte frais, et rend un **dossier** que chaque reviewer reçoit tel quel — exactement la relation
que `brief.conventions` entretient déjà avec le `CLAUDE.md` cible : un **canal** unique vers un
référent, jamais un référent que chacun re-résout.

Ce qu'il résout, à partir du `brief` (les ADR cités, les fichiers du ticket) et de la liste des
fichiers modifiés :

- **`invariants[]`** — la table des invariants d'architecture de `docs/adr/`, `{ id, rule, source }`.
  C'est le **référent de la dimension `architecture`** ; table absente ou vide → `invariants: []`, et
  `architecture-reviewer` retombe alors sur son repli nommé.
- **`adrs[]`** — le corps des ADR **contraignant ce ticket** (cités par le brief, ou touchant ses
  fichiers), `{ id, title, decision, consequences }`. On **résume**, on ne recopie pas l'ADR entier.
- **`decisions[]`** — les décisions d'implémentation de `SPEC.md ## Décisions` qui contraignent le
  diff.
- **`outOfScope[]`** — les items de `SPEC.md ## Hors-périmètre` pertinents : ce qu'**aucun** reviewer
  ne doit réclamer.
- **`contracts`** — les contrats d'interface du ticket (signatures, endpoints, codes d'erreur), s'ils
  sont écrits.

**Il ne juge pas** : ni sévérité, ni finding, ni correction. Il **cite** (avec l'ID et la source), et
un champ introuvable reste **vide** — jamais inventé, puisqu'il finirait dans le raisonnement d'un
reviewer. Lecture seule.
</dossier>

<dim-architecture>
## Dimension `architecture` — `architecture-reviewer`

**Référent : `invariants[]` du dossier de contexte** (résolu de `docs/adr/` par `review-context` — tu
ne relis pas `docs/adr/` toi-même). Le diff s'y confronte : frontière franchie, sens de dépendance
inversé, artefact placé hors du dossier prescrit, import prohibé. Une **violation d'invariant =
bloquant**, sauf si le `SPEC.md` la déclare et la justifie — l'invariant (`I3`) est alors cité dans le
finding. Un invariant **ne se re-discute pas** : il tient son autorité de la phase `technique` et de
l'ADR qui le porte ; tu constates s'il est franchi, et si tu le juges faux ou périmé, c'est une
**suggestion**, jamais un bloquant. **Repli nommé, quand `invariants[]` est vide** : le référent
redevient la cohérence avec l'**existant** — séparation des couches, couplage, patterns adaptés. C'est
un mode dégradé, pas l'état normal : l'existant est la dérive déjà accumulée, pas une intention. Un
couplage fort ou une violation structurelle majeure reste bloquant dans les deux cas.
</dim-architecture>

<dim-cleanliness>
## Dimension `propreté` — `cleanliness-reviewer`

Lisibilité, nommage, duplication, complexité, code mort. Généralement **suggestion** — sauf une
illisibilité qui rend le code non maintenable, alors bloquant.
</dim-cleanliness>

<dim-conventions>
## Dimension `conventions` — `conventions-reviewer`

Idiomes du langage, structure, style, cohérence avec le projet. **Référent : le `CLAUDE.md` du projet
cible et les patrons existants** — que `ticket-briefer` a déjà lu et résumé dans le champ
`conventions` du brief, qui est ton **canal** vers ce référent, jamais un référent concurrent ; tu ne
relis pas `CLAUDE.md` toi-même. Champ vide ou muet sur le point jugé → le référent se réduit aux
patrons existants, et l'écart relève de la **suggestion**, jamais du bloquant : une convention
qu'aucun document ne porte n'est pas une exigence.
</dim-conventions>

<dim-coverage>
## Dimension `couverture` — `coverage-reviewer`

Modes `test` : chemins/branches du code non exercés par les tests du ticket ; chemin critique de
logique métier sans test = **bloquant** (tu **signales** le trou, tu ne réécris pas les tests). Modes
`observé` : **pas** de test automatisé attendu (c'est le contrat) — juge si la vérif observable prévue
couvre les chemins critiques, et ne remonte **jamais** « absence de test ». Le mode du ticket t'est
donné (`verifMode`).
</dim-coverage>

<dim-security>
## Dimension `sécurité` — `security-reviewer`

Injection, XSS, secrets en clair, authz/authn, validation des entrées, désérialisation non sûre.
Vulnérabilité **confirmée** = bloquant. Une spéculation non ancrée dans le diff (« pourrait poser
problème si… ») n'est pas un finding : elle tomberait au triage de toute façon, ne l'émets pas.
</dim-security>

<dim-error-handling>
## Dimension `error-handling` — `error-handling-reviewer`

Cas limites, erreurs avalées, messages, résilience. Erreur non gérée sur **chemin critique** =
bloquant.
</dim-error-handling>

<severity>
## Sévérité — le barème partagé par les six reviewers

- **Bloquant** — impact réel sur la production ou la maintenabilité : bug, vulnérabilité confirmée,
  perte de données, dette majeure, chemin critique non testé ou non géré.
- **Suggestion** — amélioration sans risque immédiat : style, nommage, micro-perf, structurel
  nice-to-have.

Chaque finding porte un `correction_prompt` **autonome et chirurgical** :
`File: <chemin>, lines <N>[-M]. Replace: <code actuel>. With: <code cible>. Verify: <vérifications / commande de test>.`

**Reste dans ta dimension.** Un défaut qui relève d'une autre dimension est couvert par un autre
reviewer : ne l'émets pas, tu créerais un doublon que le triage devrait rejeter.
</severity>

<triage>
## Triage sceptique et adversarial

Six reviewers à qui on demande de trouver des défauts en trouveront **toujours**. Le triage est le
contrepoids : sa valeur est de **rejeter**. Posture sceptique (les reviewers sceptiques détectent
mieux ; les biais pro-automation créent une sur-confiance dangereuse).

**Reproduire avant de retenir.** Pour chaque finding : le code cité existe-t-il ? Le problème est-il
présent dans le **diff du ticket** (pas dans du pré-existant hors périmètre) ? Non reproductible →
**skip**.

**Ne retenir que** ce qui touche :
- la **correction** (bug, vuln confirmée, perte de données, erreur non gérée sur chemin critique), ou
- une **exigence** du contrat (`critère`/FR non respecté, chemin critique non couvert).

**Un invariant de `docs/adr/` cité par un finding est une exigence.** Il n'est ni un bug ni un
`critère`, et sans cette ligne il tomberait sous « hors-scope » ou sous le doute — `architecture-reviewer`
porte ce référent, le triage doit le porter aussi, sans quoi le bloquant est neutralisé au filtre.
Reproduire reste requis : ouvrir `docs/adr/`, lire l'invariant cité, constater le franchissement dans
le diff. Trois issues seulement — franchissement constaté → **apply** ; franchissement non
reproductible, ou invariant inexistant dans la table → **skip** (non-reproduit) ; franchissement
constaté mais **déclaré et justifié dans le `SPEC.md`** → **skip** (hors-scope), en nommant la
dérogation. Ce qu'on ne fait jamais : skip parce que l'invariant paraît discutable — sa justesse
n'est pas du ressort du triage.

**Dédoublonner.** Six reviewers indépendants peuvent pointer le **même** défaut par deux angles (une
entrée non validée vue par `security-reviewer` et par `error-handling-reviewer`). Un seul `apply`
suffit ; les autres sont des **doublons** (`skip`).

**Rejeter (skip)** :
- **style** pur / formatage / nommage cosmétique ;
- **spéculation** non ancrée dans le code (« pourrait poser problème si… ») ;
- **sur-engineering** (généricité, abstraction, config non demandée) — le risque propre de la review
  adverse, amplifié par le fan-out ;
- **hors-scope** (au-delà du ticket ou du contrat validé) ;
- **doublon**.

**Décision** : `apply` si reproduit + touche correction/exigence + fix chirurgical clair + risque de
régression faible. Sinon `skip`. **En cas de doute → skip** (jamais d'apply sur un doute). Un ticket
vert avec **zéro finding retenu** est un résultat valide.

## Après application
Les corrections retenues sont appliquées **chirurgicalement** (rien d'autre), **sans toucher aux
tests**, puis la vérification est reconfirmée selon le mode : `0 failed` + `git diff` tests vide
(test), ou la preuve observable ré-exécutée (observé). Priorité à la vérif : mieux vaut une correction
en moins qu'un ticket cassé « plus propre ».
</triage>
