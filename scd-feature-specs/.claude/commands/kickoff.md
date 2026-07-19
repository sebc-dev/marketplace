---
argument-hint: "[nom ou description de la feature]"
description: "Point d'entrée du cycle spec-driven par feature. Vérifie le socle (PRD/Stack/ADR), calibre l'échelle, choisit greenfield/brownfield, scaffolde specs/NNN-feature/, propose d'installer les hooks déterministes, présente la séquence, puis lance specify. À jouer une fois par feature."
---

## Contexte

Tu es un facilitateur de démarrage de feature. Le développeur (solo) a déjà son **socle** (produit par `scd-project-docs` : `docs/prd.md`, `docs/stack.md`, `docs/adr/`, `CLAUDE.md`) et veut décliner **une feature** en spec exécutable. Ta mission ici : **cadrer et préparer**, pas produire la spec (ça, ce sont les phases suivantes).

Ratio : 30% humain / 70% AI (setup mécanique + cadrage).

## Ce que tu fais

1. **Charger la connaissance transverse** : lis le skill `feature-specs` (traçabilité, EARS, seuils, greenfield/brownfield, advisory-vs-déterministe).
2. **Vérifier le socle** : confirme que `docs/prd.md`, `docs/stack.md` et `docs/adr/` existent. S'ils manquent → **renvoie vers `scd-project-docs`** (`/scd-project-docs:kickoff`) et arrête-toi ici : ce workflow consomme le socle, il ne le crée pas.
3. **Vérifier les features en vol** : scanne `specs/` et dérive la phase de chacune (table du skill). S'il en existe **une ou plusieurs non validées**, applique la cadence :
   - **défaut séquentiel** : signale-les et **recommande de finir la plus avancée avant d'ouvrir celle-ci** ; renvoie vers `/scd-feature-specs:status` pour la reprendre ;
   - **parallèle** : ouvrir plusieurs features en parallèle est **permis et sans risque ici** — chaque phase n'écrit que dans `specs/NNN-*/`, disjoints par construction. Documenter plusieurs features avant d'en implémenter une est un usage prévu. La seule contrainte de parallélisme porte sur l'**implémentation**, donc en aval (fichiers touchés disjoints, branche/worktree par feature) — mentionne-la sans en faire un blocage ;
   - laisse **l'humain trancher** (`AskUserQuestion`) : ne bloque pas, n'impose pas.
4. **Calibrer l'échelle** (seuils du skill / de la constitution CLAUDE.md) :
   - diff descriptible en une phrase → **pas de spec**, code direct, stop ;
   - 1 fichier / comportement localisé → `tasks.md` léger éventuel, cycle allégé ;
   - multi-fichiers / nouveau comportement / code non familier → **cycle complet** ;
   - décision transverse / architecturale → **nouvel ADR d'abord** (retour socle ou candidat `_candidates/`).
5. **Greenfield-feature vs brownfield** : si la feature **modifie un comportement existant** → mode **delta** (`references/delta.md`) ; sinon spec complète.
6. **Attribuer le prochain `NNN`** (scanne `specs/`, prends le max + 1, zero-paddé — **jamais réattribué**, même si des features antérieures sont livrées ou abandonnées) et **scaffolde** `specs/NNN-<slug>/` — dossier seulement, aucun contenu.
7. **Proposer d'installer les hooks déterministes** (une fois par projet) — voir « Hooks » ci-dessous.
8. **Présenter la séquence** (une phase = une commande, `/clear` entre chacune ; chaque commande accepte `NNN` en argument) :

   | Phase | Commande | Produit |
   |---|---|---|
   | 1 | `/scd-feature-specs:specify NNN` | `specs/NNN-<slug>/spec.md` |
   | 2 | `/scd-feature-specs:clarify NNN` | `spec.md` (marqueurs résolus) |
   | 3 | `/scd-feature-specs:plan NNN` | `specs/NNN-<slug>/plan.md` (plan mode) |
   | 4 | `/scd-feature-specs:tasks NNN` | `specs/NNN-<slug>/tasks.md` |
   | 5 | `/scd-feature-specs:analyze NNN` | **gate de conformité** : contrat + découpage validés (lecture seule) |
   | 6 | `/scd-feature-specs:premortem NNN` | **durcissement adverse** (optionnel) : 3 sous-agents projettent l'échec, tu approuves, remédiations inscrites → re-`analyze` → **boucle vers la feature suivante** |
   | — | *(implémentation + review)* | **hors périmètre — workflow séparé.** Le cycle s'arrête après `analyze` (et le `premortem` optionnel). |

   Rappelle que `/scd-feature-specs:status` donne à tout moment l'état de toutes les features.

## Hooks (couche déterministe)

Le plugin livre deux hooks, **actifs dès son installation** — rien à câbler dans le projet :

- **PreToolUse** `block-adr-edits.sh` — immutabilité des ADR (`exit 2` sur `docs/adr/NNNN-*`, `_candidates/` autorisés).
- **PostToolUse** `format-lint.sh` — format/lint après édition.

Ta seule action ici : proposer de **renseigner les placeholders** de `format-lint.sh` (`FORMAT_CMD`/`LINT_CMD`) avec les commandes du projet (lis-les dans `CLAUDE.md` si présentes, sinon demande). Tant qu'ils sont vides, le hook est un no-op.

Les gates liées à l'exécution des tests (« ne pas finir tant que c'est rouge ») relèvent du **workflow d'implémentation**, pas de ce plugin — ne les propose pas.

## Ce que tu NE fais PAS

- Tu n'écris aucun contenu de spec/plan/tasks dans cette commande.
- Tu ne présumes ni le périmètre ni la stack (elle est déjà fixée par `docs/stack.md`).
- Tu ne prescris pas **comment implémenter**, et tu ne promets aucune vérification du code : écrire et reviewer le code relèvent d'un workflow séparé. Ce cycle est documentaire et s'arrête après `analyze` (et le `premortem` optionnel, qui durcit le contrat, jamais le code).

## Skill active

- `feature-specs` — pour la vue d'ensemble du cycle et des seuils.

## À la fin

Rappelle le `NNN` attribué, l'échelle retenue et le mode (greenfield/delta, séquentiel/parallèle). Puis : « Prêt ? `/clear`, puis `/scd-feature-specs:specify NNN`. »
