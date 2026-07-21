# feature-specs

**Le workflow spec-driven par feature — la suite de `scd-project-docs`. Purement documentaire.**

Là où `scd-project-docs` pose **une fois** le socle d'un projet (`docs/prd.md`, `docs/stack.md`, `docs/adr/`, `CLAUDE.md`), `scd-feature-specs` le **consomme** et produit, **pour une ou plusieurs features**, les documents qui serviront de base au développement — puis **atteste qu'ils sont prêts** pour une implémentation optimale :

`specs/NNN-feature/spec.md → plan.md → tasks.md → analyze (gate de conformité) → premortem (durcissement, optionnel) → passage de main`

L'humain décide du *quoi* ; Claude interroge, écrit en EARS, planifie contre le socle, découpe en **lots reviewables** et traçables, **valide le contrat de façon adverse**, puis — pour une feature à fort enjeu, et seulement avec l'accord de l'humain — le **durcit contre les modes de défaillance projetés**.

## Frontières

- **En amont — `scd-project-docs`** = le socle projet, créé une fois au kickoff (Brief → PRD → Stack → ADR → CLAUDE.md). Ce plugin ne le crée pas : il le lit et signale s'il manque.
- **`scd-feature-specs`** = les documents par feature, récurrents. **Périmètre strictement documentaire.**
- **En aval — tout ce qui touche au code est HORS PÉRIMÈTRE.** Ni l'écriture du code, ni sa vérification post-implémentation (review et autres) : les deux relèvent d'un workflow séparé. Le cycle **s'arrête après `analyze` (et le `premortem` optionnel)** et ne reprend pas. Aucun test n'est jamais exécuté ici — le `premortem` durcit le *contrat*, pas le code.
- **Une nuance, pas une exception** : le découpage est **dimensionné pour** que la review aval soit faisable par un humain. Décider de la taille d'une unité livrable est documentaire et se joue ici — après l'implémentation, redécouper coûte le prix du code déjà écrit. Mais on rend la review possible ; on ne la conduit pas.

C'est la même frontière, répétée : chaque plugin livre un artefact et passe la main.

```
scd-project-docs  →  scd-feature-specs  →  workflow d'implémentation
   (le socle)          (les documents)        (le code + la review)
```

## Workflow (une phase = une commande, `/clear` entre chacune)

Chaque commande accepte `NNN` (ou le slug) en argument, et le **résout** toute seule si tu l'omets.

| Phase | Commande | Produit | Human/AI |
|---|---|---|---|
| 0 | `/scd-feature-specs:kickoff` | scaffold `specs/NNN-<slug>/`, calibrage, install hooks | 30/70 |
| 1 | `/scd-feature-specs:specify` | `spec.md` (EARS, FR, scope EXCLU) | 60/40 |
| 2 | `/scd-feature-specs:clarify` | `spec.md` (résout `[NEEDS CLARIFICATION]`) | 60/40 |
| 3 | `/scd-feature-specs:plan` | `plan.md` (**plan mode**, réutilise stack/ADR) | 50/50 |
| 4 | `/scd-feature-specs:tasks` | `tasks.md` (lots `Rn` reviewables, mode de vérif par lot, `[P]`, backref `_Requirements:_`) | 40/60 |
| 5 | `/scd-feature-specs:analyze` | **gate de conformité** : contrat + découpage validés (lecture seule) | 30/70 |
| 6 | `/scd-feature-specs:premortem` | **durcissement adverse** (optionnel) : 3 sous-agents projettent l'échec, l'humain approuve, les remédiations sont inscrites → **re-analyze puis boucle vers la suivante** | 40/60 |
| — | *(implémentation + review)* | **hors périmètre — workflow séparé** | — |
| ⟳ | `/scd-feature-specs:status` | tableau de bord : où en est chaque feature | 10/90 |

## Cadence : une feature à la fois, ou plusieurs

- **Séquentiel (défaut)** : on documente une feature, on la valide (`analyze`), on la durcit éventuellement (`premortem` → re-`analyze`), puis on **boucle** vers `kickoff` pour la suivante. Les `NNN` sont stables, jamais réattribués.
- **Parallèle (sans risque ici)** : documenter plusieurs features en parallèle est un usage prévu — chaque phase n'écrit que dans `specs/NNN-*/`, disjoints par construction. La seule contrainte de parallélisme porte sur l'**implémentation**, donc en aval : `status` signale les features dont les « Fichiers touchés » se recoupent, comme note transmise au workflow suivant.
- **Reprise** : `/clear` efface le contexte, pas l'état — il vit dans les fichiers. `status` le dérive (`spec.md` présent ? marqueurs restants ? `tasks.md` écrit ?), donc rien à maintenir et rien qui dérive. Aucun verdict n'est persisté : `analyze` est bon marché et se relance, là où un PASS sur disque deviendrait faux à la première édition.

## Ce qui rend le contrat implémentable

- **EARS** : chaque critère d'acceptation est un `SHALL` → une vérification observable nommée (par défaut un test ; la forme se décide au découpage via le mode de vérification du lot). Traçabilité `FR` du PRD → `FR`/`SHALL` de la spec → tâche → vérification → code. Ce plugin produit et valide la chaîne **jusqu'à `tasks.md`** ; l'aval en écrit les deux derniers maillons.
- **Deux gates** : `clarify` (aucune ambiguïté non résolue) et `analyze` (14 contrôles : traçabilité, EARS, verbe vérifiable, technology-agnostic, scope EXCLU, cohérence socle, reviewability du découpage…). Attraper un trou ici coûte infiniment moins cher qu'après l'implémentation.
- **Réutilisation du socle** : `plan` applique `stack.md`/`adr/`, ne les re-décide jamais ; une décision structurante nouvelle devient un **candidat ADR** dans `docs/adr/_candidates/`.
- **Revue adverse des documents** : deux subagents en contexte frais et en lecture seule, aux mandats disjoints — `ears-verifier` juge le contrat, `slice-auditor` juge le découpage. La session qui a rédigé les documents est mal placée pour les juger.
- **Durcissement par premortem** (optionnel, après `analyze`) : là où la gate vérifie la *conformité*, le premortem cherche les *modes de défaillance* qu'elle ne voit pas. Trois subagents en contexte frais — `premortem-facilitator` projette l'échec de la feature et remonte à la cause, `premortem-validator` trie les risques (rejette spéculation et scope creep), `premortem-applier` inscrit **uniquement** les remédiations que l'humain a approuvées. Puis on relance `analyze`, le contrat ayant changé.

## Découper pour que la review humaine ait lieu

`tasks.md` a **deux granularités** : le **lot `Rn`** est l'unité de *review* (une vertical slice livrant une capability vérifiable, unité de livraison recommandée — « un lot ≈ une PR reviewable ») ; la **tâche `Tn`** est l'unité de *progression* (un critère observable = un commit = une vérification au vert). Chaque lot déclare un **mode de vérification** — `TDD` par défaut, ou `test-after` / `check` / `inhérent` quand la feature ne se prête pas au test-first (CI, infra, config, mise en page, one-shot). L'ordre de vérification vit **dans** le lot, jamais entre les lots.

Pourquoi : un contrat parfaitement tracé mais livrable en un seul bloc produit une review que personne ne fera vraiment — le reviewer skimme, et le défaut passe. La traçabilité garantit que tout est couvert ; le dimensionnement garantit que quelqu'un le lira.

| | Critères | Effet si violé |
|---|---|---|
| **Bloquants** (qualitatifs) | un seul sujet · vertical slice (jamais « créer la table » / « créer l'API », qui ne se jugent qu'en assemblage) · compréhensible seul | **Critical** → redécouper |
| **Signaux** (advisory) | ≈ 400 lignes estimées · ≈ 7 concepts · ≈ 5-7 critères par exigence | **Major** → scinder verticalement |

> Les seuils chiffrés viennent d'études sur le **code** et l'inspection formelle, transposés aux documents par analogie ; aucun seuil n'est validé empiriquement pour des specs. Et le budget en lignes est une **estimation** dérivée du plan — ce plugin ne lit pas le code. D'où le choix : ils déclenchent une question, ils ne rendent jamais un verdict. Ce qui bloque est qualitatif.

## Couche déterministe (hooks livrés)

Le contexte est *advisory* ; ce qui doit arriver à 100 % est un **hook** :

| Hook | Event | Rôle | Où |
|---|---|---|---|
| `block-adr-edits.sh` | PreToolUse | immutabilité des ADR (`exit 2`) | niveau plugin (auto) |
| `format-lint.sh` | PostToolUse | format/lint après édition | niveau plugin (auto) |

> Les deux sont actifs dès l'installation — rien à câbler dans le projet. Renseigne `FORMAT_CMD`/`LINT_CMD` dans `format-lint.sh` avec les commandes du projet (vides = no-op).
>
> Il n'y a **pas** de gate Stop « tests verts avant de finir » : faire converger le code vers le vert est une affaire d'implémentation, donc hors périmètre.

## Capacités avancées

- **Brownfield delta** (OpenSpec) : specs delta `[ADDED]/[MODIFIED]/[REMOVED]` pour modifier une feature existante sans réécrire ni dériver.
- **Boucle de maintenance drift** : gabarit `loop.md` qui détecte les écarts spec↔code↔test et les consigne dans `DRIFT.md`. Elle **propose**, elle ne corrige jamais — garder les living files fidèles au code est un problème documentaire, donc en périmètre ; réparer le code ne l'est pas.
- **Complément Gherkin** : scénarios exécutables dérivés d'un `SHALL` pour les critères multi-chemins à haute valeur de test.

## Quick start

```
/scd-feature-specs:kickoff "authentification par email"
# puis, en faisant /clear avant chaque phase :
/scd-feature-specs:specify → :clarify → :plan → :tasks → :analyze
# analyze au vert = contrat conforme. Feature à fort enjeu ? durcis-le :
/scd-feature-specs:premortem     # 3 sous-agents + ton approbation, puis re-:analyze
# contrat validé → il boucle vers la feature suivante :
/scd-feature-specs:kickoff "export CSV"

# … puis le workflow d'implémentation prend le relais (hors périmètre) …

# perdu ? à tout moment :
/scd-feature-specs:status
```

## Installation

```
/plugin install scd-feature-specs@sebc-dev-marketplace
```
