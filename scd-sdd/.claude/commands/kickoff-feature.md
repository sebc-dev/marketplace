---
description: "Ouvre le niveau SPECS pour une feature : vérifie le socle, calibre l'échelle, tranche greenfield ou delta, attribue le NNN, scaffolde specs/NNN-slug/ et sa section de journal, puis présente la séquence. À jouer une fois par feature."
argument-hint: "[nom ou description de la feature]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
  - Bash(mkdir -p *)
---

## Contexte

Tu ouvres le **niveau specs** pour **une** feature. Le socle existe déjà (`docs/prd.md`,
`docs/stack.md`, `docs/adr/`, `CLAUDE.md`) ; ta mission ici est de **cadrer et préparer**, pas
de produire la spec — ça, ce sont les phases suivantes.

L'essentiel de cette commande tient en une question que personne d'autre ne pose : **cette
feature mérite-t-elle un cycle complet ?** Un diff descriptible en une phrase n'a pas besoin
d'une spec, et la cérémonie inutile coûte plus qu'elle ne protège.

Ratio : 30% humain / 70% AI (setup mécanique + cadrage ; l'humain tranche l'échelle).

## Règles absolues

- **Tu ne crées aucun contenu de document.** Tu crées un dossier vide — plus le marqueur
  `DELTA.md` en mode delta — et une section de journal. `spec.md`, `plan.md` et `tasks.md`
  appartiennent aux phases suivantes.
- **`NNN` = `max(NNN) + 1`**, zero-paddé, scanné sur `specs/`. **Jamais réattribué**, même si
  des features antérieures sont livrées ou abandonnées. Un numéro libéré reste libre.
- **Le socle est un prérequis strict.** Il manque → tu t'arrêtes et tu renvoies vers
  `/scd-sdd:init-project`. Ce niveau consomme le socle, il ne le crée pas.
- **Tu ne bloques jamais le parallèle.** Ouvrir plusieurs features à la fois est **sans risque
  ici** : chaque phase n'écrit que dans `specs/NNN-*/`, disjoints par construction. Tu
  recommandes le séquentiel, tu ne l'imposes pas.

## Processus

1. **Charge la connaissance transverse** : lis le skill `feature-specs` (traçabilité, EARS,
   seuils, greenfield/delta, advisory-vs-déterministe).

2. **Vérifie le socle** — `docs/prd.md`, `docs/stack.md`, `docs/adr/`. S'il manque quoi que ce
   soit, **arrête-toi** : « `/scd-sdd:init-project` d'abord — ce niveau décline le socle, il ne
   l'invente pas. »

3. **Établis les features en vol** : scanne `specs/` et dérive la phase de chacune selon la
   table de la section « Cibler une feature » du skill. S'il en existe de non validées :
   - signale-les avec leur phase et **recommande de finir la plus avancée** ;
   - rappelle que le parallèle est permis ici, et que sa seule contrainte est en aval
     (fichiers touchés disjoints, branche ou worktree par lot) ;
   - laisse **l'humain trancher** (`AskUserQuestion`) — tu ne bloques pas.

4. **Calibre l'échelle** (seuils du skill / de la constitution `CLAUDE.md`) :

   | Ampleur | Décision |
   |---|---|
   | diff descriptible en une phrase | **pas de spec** — code direct, tu t'arrêtes ici |
   | 1 fichier, comportement localisé | `tasks.md` léger éventuel, cycle allégé |
   | multi-fichiers / comportement neuf / code non familier | **cycle complet** |
   | décision transverse ou architecturale | **`/scd-sdd:adr` d'abord**, ou candidat dans `docs/adr/_candidates/` |

5. **Tranche greenfield ou delta** : la feature **modifie un comportement existant** → mode
   **delta** (`references/delta.md`), que tu signaleras en créant `DELTA.md` à l'étape 6.
   Sinon, spec complète.

6. **Attribue le `NNN` et scaffolde** `specs/NNN-<slug>/` — **le dossier seul**, aucun contenu
   de document. En mode **delta**, ajoute `DELTA.md` réduit à l'en-tête du template
   (`references/delta.md` du skill `feature-specs`), sans aucune section
   `[ADDED]`/`[MODIFIED]`/`[REMOVED]` : c'est ce marqueur que toutes les phases aval — à
   commencer par `specify` — dérivent pour savoir que la feature est en mode delta.

7. **Propose de renseigner les hooks** — voir « Hooks » ci-dessous.

8. **Présente la séquence.** Une phase = une commande, `/clear` entre chacune ; chaque commande
   accepte `NNN` en argument.

   | Phase | Commande | Produit |
   |---|---|---|
   | 1 | `/scd-sdd:specify NNN` | `spec.md` |
   | 2 | `/scd-sdd:clarify NNN` | `spec.md` sans marqueur |
   | 3 | `/scd-sdd:plan NNN` | `plan.md` (en plan mode) |
   | 4 | `/scd-sdd:tasks NNN` | `tasks.md` — lots `Rn`, tâches `Tn` |
   | 5 | `/scd-sdd:analyze NNN` | **gate de conformité** — rapport + verdict, lecture seule |
   | 6 | `/scd-sdd:premortem NNN` | **durcissement adverse**, optionnel → re-`analyze` |
   | → | `/scd-sdd:run NNN R1` | niveau **implémentation** : un lot → une PR |

   Rappelle que `/scd-sdd:status-specs` donne à tout moment l'état de toutes les features, et
   `/scd-sdd:status` la vue des trois niveaux.

9. **Consigne au journal** (voir ci-dessous).

## Hooks (couche déterministe)

Le plugin livre trois hooks, **actifs dès son installation** — rien à câbler dans le projet :

- **PreToolUse** `block-adr-edits.sh` — immutabilité des ADR (`exit 2` sur `docs/adr/NNNN-*` ;
  `docs/adr/_candidates/` reste autorisé, c'est là qu'écrit `plan`).
- **PostToolUse** `format-lint.sh` — format/lint après édition.
- **SessionStart** `chantier-notice.sh` — annonce le chantier en cours après un `/clear`. **Lecture
  seule, aucun placeholder à renseigner**, et silencieux tant que `docs/chantiers/en-cours/` est
  vide. Il n'écrit jamais de fiche : un hook ne connaît pas l'issue de ce qu'il consignerait.

Ta seule action ici : proposer de renseigner les placeholders `FORMAT_CMD` / `LINT_CMD` de
`format-lint.sh` avec les commandes du projet (lis-les dans `CLAUDE.md` si elles y sont, sinon
demande). Tant qu'ils sont vides, le hook est un no-op.

Les gates liées à l'exécution des tests relèvent du niveau implémentation — ne les propose pas.

## Ce que tu NE fais PAS

- Tu n'écris aucun contenu de `spec.md`, `plan.md` ou `tasks.md`.
- Tu ne présumes ni le périmètre ni la stack (elle est fixée par `docs/stack.md`).
- Tu ne prescris pas **comment** implémenter et tu ne promets aucune vérification du code : ce
  niveau est documentaire et s'arrête à `analyze` (plus le `premortem` optionnel).
- Tu ne réattribues jamais un `NNN` libéré.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/NNN-slug.md`, par
`Edit` ciblé. C'est cette commande qui **crée le fichier de journal de la feature** —
titre et bloc de citation prescrits par le skill, puis la table :

- **Phase** : `kickoff-feature`
- **Résultat** : le dossier créé · l'échelle retenue · le mode.
  Exemple : `specs/003-export/ créé · cycle complet · greenfield`.

Si tu t'es arrêté à l'étape 4 (diff descriptible en une phrase), **ne consigne rien** : aucune
feature n'a été ouverte.

## Skill active

- `feature-specs` — vue d'ensemble du cycle, table « Cibler une feature », seuils.
- `journal` — contrat de `docs/journal/*.md` (gabarit, règle d'ajout).

## À la fin

Rappelle le `NNN` attribué, l'échelle retenue et le mode (greenfield ou delta, séquentiel ou
parallèle). Puis : « Prêt ? `/clear`, puis `/scd-sdd:specify NNN`. »
