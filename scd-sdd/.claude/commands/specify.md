---
description: "Phase 1 des specs : produit specs/NNN-slug/spec.md par interview « une question à la fois ». Critères d'acceptation en EARS (des exigences en phrases normées, directement traduisibles en test), FR atomiques traçant vers le PRD, scope EXCLU, marqueurs [NEEDS CLARIFICATION] posés et non résolus (les ambiguïtés sont marquées, jamais tranchées en silence). Technology-agnostic (aucun choix technique n'entre ici). Racine de la traçabilité feature."
argument-hint: "[NNN ou slug — optionnel, résolu sinon]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu élabores la **spec de feature** : le *quoi* au niveau feature, décliné de `docs/prd.md`.

La qualité vient de l'**interview**, pas de la génération. Une spec produite d'un bloc à partir
d'une phrase est plausible et fausse : elle comble les trous par des choix silencieux, et
chacun devient une hallucination que l'implémentation exécutera fidèlement. Le développeur
décide du quoi ; toi tu questionnes, tu écris en EARS, puis tu compiles.

Ratio : 60% humain / 40% AI (l'humain répond, tu structures en EARS).

## Règles absolues

- **Une question à la fois.** Chaque question s'appuie sur la réponse précédente. Jamais un
  questionnaire entier.
- **Technology-agnostic.** Aucun framework, lib ou DB : ça descend dans `plan.md`, qui
  s'appuie sur `stack.md`/`adr/`. Une fuite de stack ici est un finding d'`analyze`.
- **Chaque critère en EARS.** Un `SHALL` = une vérification observable future (par défaut un
  test ; la forme se décide en `tasks`). Verbe vérifiable, jamais adjectif.
- **Tu poses les ambiguïtés, tu ne les tranches pas.** Toute zone floue devient un
  `[NEEDS CLARIFICATION : …]`. Trancher en silence est le défaut que `clarify` existe pour
  rattraper.
- N'écris le fichier qu'**après** que l'interview a couvert le template.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — EARS,
  gate, lot, ADR, invariant, advisory… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Un ID se cite avec son intitulé** à sa première mention — « FR-003 (export CSV) », jamais
  « FR-003 » nu. La règle vaut pour **tout** identifiant que tu emploies, y compris ceux que le
  projet ou la session viennent de créer et que le plugin ne connaît pas. Un identifiant seul
  n'explique rien à qui ne l'a pas sous les yeux.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Processus

1. **Résous la feature cible** — règle de résolution du skill `feature-specs`, section
   « Cibler une feature ». Candidature propre à cette phase : le dossier `specs/NNN-*/` **sans
   `spec.md`**. **Annonce la cible retenue** avant d'écrire quoi que ce soit.

1bis. **Charge le chantier de gate, s'il y en a un** — `Glob` sur
   `docs/chantiers/en-cours/*-gate-<cible>.md`. Une fiche ouverte signifie qu'une passe
   `/scd-sdd:analyze` a laissé une liste de corrections : lis son `## À corriger` et son
   `## Écarté`, et **pars de là**. Corriger en re-dérivant à froid, c'est risquer de recasser ce
   qui allait et de rater ce qui n'allait pas — c'est ainsi qu'on tourne en rond avec `analyze`.

   Traite les entrées dont la ligne `Phase :` te désigne ; **laisse les autres intactes**, elles
   relèvent d'une autre commande. Et **ne modifie pas la fiche** : c'est `/scd-sdd:analyze` qui
   l'actualise, en constatant à la passe suivante ce qui a disparu.

   Pas de fiche → tu pars du contrat. Ce n'est pas une anomalie.

2. **Charge les références** : `references/spec.md` et `references/ears.md` du skill
   `feature-specs` — plus `references/delta.md` si un `DELTA.md` est présent (brownfield).

3. **Ancre la traçabilité** : lis `docs/prd.md` (et `docs/brief.md` si utile) et identifie
   nommément le ou les `FR`/`SC` produit que cette feature décline.

4. **Mène l'interview**, dans cet ordre : capacité et valeur → user stories priorisées →
   critères EARS nominaux → cas limites et comportements indésirables (`If… then… shall`) →
   contrats d'E/S → scope EXCLU → critères de succès mesurables.
   - Chaque critère en **EARS**, avec backref `_(PRD: FR-0xx)_`.
   - Force **au moins 1-2 exclusions** dans le scope EXCLU : ce qu'on refuse borne l'agent
     bien plus efficacement que ce qu'on demande.
   - `AskUserQuestion` pour les choix fermés (priorités, arbitrages de périmètre).
   - Critère multi-chemins à haute valeur → propose un scénario **Gherkin** dérivé
     (`references/gherkin.md`), en complément du SHALL, jamais à sa place.

5. **Compile** dans `specs/<cible>/spec.md` selon le template — ou, si la feature est
   brownfield, complète le `DELTA.md` du dossier selon `references/delta.md`
   (`[ADDED]` / `[MODIFIED]` / `[REMOVED]`).

6. **Relis contre le bloc `<completion>`** de `references/spec.md` et signale les critères non
   atteints plutôt que de les masquer.

7. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Aucun choix technique : c'est `plan`.
- Aucun découpage en tâches : c'est `tasks`.
- Tu ne résous pas les `[NEEDS CLARIFICATION]` : c'est `clarify`. Ici tu les **poses**
  proprement, avec assez de contexte pour qu'une question fermée puisse être formulée ensuite.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/NNN-slug.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `specify`
- **Résultat** : le nombre de `FR` et le nombre de marqueurs restants.
  Exemple : `6 FR · 2 [NEEDS CLARIFICATION]`.

## Skill active

- `feature-specs` — charge `references/spec.md` et `references/ears.md` (+ `delta.md` /
  `gherkin.md` au besoin).
- `chantier` — **anatomie** de la fiche de gate, pour la LIRE seulement. Tu ne l'écris ni
  ne la modifies : c'est `/scd-sdd:analyze` qui l'actualise. Tu ne charges **aucune** de ses deux
  références : `fiche.md` sert à écrire, `manifeste.md` à recharger un contexte.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Récapitule le **scope EXCLU** et la liste des `[NEEDS CLARIFICATION]` restants — nommément,
pas en nombre seul. Puis, en passant le `NNN` : « `/clear`, puis `/scd-sdd:clarify NNN` pour
les résoudre. »

S'il n'en reste aucun, enchaîne directement sur `/scd-sdd:plan NNN`.
