---
description: "Phase 1 du socle : produit docs/brief.md par interview « une question à la fois » — le pourquoi, les personas, le périmètre inclus et EXCLU, les critères de succès mesurables. Racine de la chaîne de traçabilité, écrite une fois."
argument-hint: "[idée du projet — optionnel]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu élabores le **Brief / Vision**, racine de la chaîne de traçabilité : le PRD, la Stack
et les ADR traceront tous vers lui.

En greenfield, il n'y a **rien à dériver** — aucun code, aucune spec antérieure. La
qualité du document ne vient donc pas de ta capacité à générer, mais de ta capacité à
**faire dire**. Le développeur détient le *quoi* et le *pourquoi* ; toi, tu questionnes,
tu reformules, puis tu compiles.

Ratio : 60% humain / 40% AI (l'humain répond, tu structures).

## Règles absolues

- **Une question à la fois.** Chaque question s'appuie sur la réponse précédente. Un
  questionnaire déballé d'un coup produit des réponses courtes et un brief creux.
- **Aucun champ rempli par supposition.** Un champ vide est une question, jamais une
  invention plausible.
- **Aucun adjectif dans un critère de succès.** « rapide », « intuitif », « fiable » ne
  donnent aucune cible : chaque intention devient un `SC-xxx` mesurable (un chiffre ou
  un test).
- **Le fichier n'est écrit qu'après** que l'interview a couvert tout le template.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — EARS,
  gate, lot, ADR, invariant, advisory… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Un ID se cite avec son intitulé** à sa première mention — « SC-002 (délai de première
  réponse) », jamais « SC-002 » nu. La règle vaut pour **tout** identifiant que tu emploies, y
  compris ceux que le projet ou la session viennent de créer et que le plugin ne connaît pas. Un
  identifiant seul n'explique rien à qui ne l'a pas sous les yeux.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Processus

1. **Charge le template et ses règles** : lis `references/brief.md` du skill
   `project-docs` (`role`, `template`, `guidance`, `completion`).

2. **Mène l'interview**, dans cet ordre de priorité — chaque étage conditionne le suivant :

   | Ordre | Sujet | Ce qu'on cherche |
   |---|---|---|
   | 1 | **Problème** | pour qui, et pourquoi maintenant |
   | 2 | **Personas → jobs** | au moins un persona nommé avec son job-to-be-done |
   | 3 | **Périmètre inclus (v1)** | ce que la v1 fait |
   | 4 | **Périmètre EXCLU (v1)** | **2-3 exclusions explicites minimum** |
   | 5 | **Contraintes** | techniques, légales, budget, plateformes |
   | 6 | **Critères de succès** | `SC-xxx` mesurables |

   Sans problème net, tout le reste flotte : ne quitte pas l'étage 1 tant que « pour
   qui » et « pourquoi maintenant » ne sont pas tranchés. Utilise `AskUserQuestion` pour
   les choix fermés (priorité entre personas, arbitrages de périmètre).

3. **Insiste sur le scope EXCLU.** C'est le champ qui protège le plus le projet : il
   borne l'agent en aval et coupe le sur-engineering. Si l'utilisateur n'en donne pas
   spontanément, propose des exclusions plausibles et fais-les valider ou rejeter.

4. **Compile `docs/brief.md`** en suivant le template, une fois tout couvert. Numérote
   les `SC-xxx` : ils seront repris par le PRD.

5. **Relis contre le bloc `<completion>`** de `references/brief.md` et signale nommément
   tout critère non atteint plutôt que de le masquer.

6. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Aucune user story détaillée ni scénario Given/When/Then — c'est le PRD.
- Aucun choix technique, aucun nom de framework, lib ou base de données — c'est la Stack.
- Aucune estimation de charge ni découpage en tâches.
- Tu ne complètes pas un brief existant en silence : si `docs/brief.md` est déjà là,
  dis-le et demande si on le reprend.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `brief`
- **Résultat** : chiffré et factuel — nb de personas · nb de `SC-xxx` · nb d'exclusions.
  Exemple : `3 personas · 4 SC · 3 exclusions`.

## Skill active

- `project-docs` — charge `references/brief.md` (`template` + `guidance` + `completion`).
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Récapitule le **scope EXCLU** — c'est le champ que l'utilisateur doit relire en priorité,
parce que c'est celui qui contraindra le plus l'agent en aval.

Propose ensuite l'**audit**, optionnel : « Pour vérifier que `docs/brief.md` est complet, mesurable
et sans marqueur laissé en place : `/clear`, puis `/scd-sdd:audit brief`. L'audit confronte le
document à une grille et rend une **liste de travail** — il ne touche jamais au document lui-même.
Le `/clear` n'est pas cosmétique : juger ce qu'on vient d'écrire, c'est relire ses intentions au
lieu du texte. Rien ne l'exige — sans audit, la suite est `/scd-sdd:prd`. »

Puis : « `/clear`, puis `/scd-sdd:prd` pour le PRD. »
