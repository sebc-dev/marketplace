---
description: "Phase 1 du socle : produit docs/produit.md par interview « une question à la fois » — le problème, les personas, les user stories priorisées, les exigences fonctionnelles atomiques FR-xxx, le périmètre EXCLU et les critères de succès mesurables SC-xxx. Technology-agnostic. Racine de la chaîne de traçabilité, écrite une fois."
argument-hint: "[idée du projet — optionnel]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu élabores **`docs/produit.md`**, racine de la chaîne de traçabilité : la Technique, les
ADR, la CI et `CLAUDE.md` traceront tous vers lui. Il répond au **pourquoi** et au **quoi**,
au **niveau produit** — les capacités d'ensemble, pas l'implémentation détaillée d'une
feature, qui appartient au niveau specs en aval.

En greenfield, il n'y a **rien à dériver** — aucun code, aucune spec antérieure. La qualité
du document ne vient donc pas de ta capacité à générer, mais de ta capacité à **faire dire**.
Le développeur détient le *quoi* et le *pourquoi* ; toi, tu questionnes, tu reformules, puis
tu compiles.

Le document doit **survivre à un changement de stack** : c'est ce qui justifie la contrainte
technology-agnostic. Ses `FR-xxx` sont le fil le plus long du cycle — ils deviendront des
critères EARS au niveau specs, puis des vérifications observables à l'implémentation. Leur
numérotation est donc définitive.

Ratio : 60% humain / 40% AI (l'humain répond et arbitre, tu structures).

## Règles absolues

- **Une question à la fois.** Chaque question s'appuie sur la réponse précédente. Un
  questionnaire déballé d'un coup produit des réponses courtes et un document creux.
- **Aucun champ rempli par supposition.** Un champ vide est une question, jamais une
  invention plausible.
- **Technology-agnostic, sans exception.** Un framework, une lib ou une DB ici est une fuite
  à corriger, pas un détail. Les contraintes techniques, légales, de budget et de plateforme
  vont dans `docs/technique.md`, § *Contraintes transverses* — c'est là qu'elles servent à
  trancher.
- **Niveau produit, pas feature.** Si tu te surprends à décrire des écrans, des endpoints ou
  des tables, tu es descendu d'un niveau.
- **FR atomique et testable.** Une exigence = un comportement vérifiable = un futur test.
  Tout `FR` contenant « et » se scinde.
- **Aucun adjectif dans un critère de succès.** « rapide », « intuitif », « fiable » ne
  donnent aucune cible : chaque intention devient un `SC-xxx` mesurable (un chiffre ou un
  test).
- **Le périmètre EXCLU et les `SC-xxx` ne se demandent qu'une fois.** Avant la fusion des
  phases `brief` et `prd`, ils étaient réclamés **deux fois**, la seconde « héritée et
  affinée » de la première. Ce doublon est supprimé (`DECISIONS.md` §D39) : n'ajoute ni
  seconde liste de `SC`, ni section « Inclus » — l'inclus **est** la liste des `FR-xxx`.
- **Aucune ambiguïté tranchée en silence.** Une zone floue devient un
  `[NEEDS CLARIFICATION : question précise]`, résolu par interview avant de clore.
- **IDs stables.** `FR-xxx` et `SC-xxx` sont numérotés une fois et ne sont jamais
  renumérotés : tout l'aval s'y accroche.
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

1. **Charge le template et ses règles** : lis `references/produit.md` du skill
   `project-docs`, **intégralement** (`role`, `template`, `guidance`, `completion`).

2. **Mène l'interview**, dans cet ordre de priorité — chaque étage conditionne le suivant :

   | Ordre | Sujet | Ce qu'on cherche |
   |---|---|---|
   | 1 | **Problème** | pour qui, et pourquoi maintenant |
   | 2 | **Objectif & résultat attendu** | le « done » au niveau produit |
   | 3 | **Personas → jobs** | au moins un persona nommé avec son job-to-be-done |
   | 4 | **User stories priorisées** | P1/P2/P3, chacune reliée à un `SC-xxx` |
   | 5 | **Scénarios Given/When/Then** | entrées et sorties concrètes, par story |
   | 6 | **Exigences fonctionnelles** | `FR-xxx` atomiques et testables |
   | 7 | **Cas limites** | conditions frontières, scénarios d'erreur |
   | 8 | **Périmètre EXCLU** | **2-3 exclusions explicites minimum** |
   | 9 | **Critères de succès** | `SC-xxx` mesurables |

   Sans problème net, tout le reste flotte : ne quitte pas l'étage 1 tant que « pour qui » et
   « pourquoi maintenant » ne sont pas tranchés. C'est aussi la **seule section que rien ne
   remédiera plus tard** — `/scd-sdd:premortem socle` ne la touche jamais (`DECISIONS.md`
   §D39) : la formuler juste ici est le seul moment.

   Utilise `AskUserQuestion` pour les choix fermés — priorité entre personas, ordre des
   stories, arbitrages de périmètre. Pour la priorité, dis d'abord **ce qu'elle décide** : ce
   qui sera construit en premier, donc ce qui existera si on s'arrête là.

3. **Insiste sur le scope EXCLU.** C'est le champ qui protège le plus le projet : il borne
   l'agent en aval et coupe le sur-engineering. Si l'utilisateur n'en donne pas
   spontanément, propose des exclusions plausibles et fais-les valider ou rejeter. Une
   **seule** section, et aucune section « Inclus » en face.

4. **Scinde chaque `FR` non atomique** et vérifie que chacun est vérifiable par une sortie,
   pas par une appréciation.

5. **Résous chaque `[NEEDS CLARIFICATION]`** par question ciblée. Aucun ne subsiste à la
   clôture : c'est la condition de sortie de la phase.

6. **Compile `docs/produit.md`** en suivant le template, une fois tout couvert. Numérote les
   `FR-xxx` et les `SC-xxx` de façon stable : ils seront repris par tout l'aval.

7. **Relis contre le bloc `<completion>`** de `references/produit.md`, et **relis-toi
   spécifiquement à la recherche d'une fuite technique** — c'est l'erreur la plus fréquente à
   cette phase. Signale nommément tout critère non atteint plutôt que de le masquer.

8. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Aucun choix technique : pas de framework, de lib, de base de données, de protocole ni de
  nom de service. Aucune contrainte technique non plus — elles vont dans `docs/technique.md`.
- Aucune spec de feature (`spec.md`, plan, tâches) : c'est `/scd-sdd:kickoff-feature`.
- Aucune estimation de charge ni découpage en tâches.
- Tu n'ajoutes ni section « Inclus », ni seconde liste de `SC-xxx` : le doublon que la fusion
  vient de supprimer ne se recrée pas dans le même fichier.
- Tu ne clos pas la phase avec un `[NEEDS CLARIFICATION]` résiduel.
- Tu ne complètes pas un document existant en silence : si `docs/produit.md` est déjà là,
  dis-le et demande si on le reprend.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `produit`
- **Résultat** : chiffré et factuel — nb de personas · nb de `FR-xxx` · nb de `SC-xxx` ·
  nb d'exclusions · nb de marqueurs restants.
  Exemple : `3 personas · 12 FR · 5 SC · 3 exclusions · 0 marqueur`.

## Skill active

- `project-docs` — charge `references/produit.md`, **intégralement** (`role` + `template` +
  `guidance` + `completion`).
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Confirme explicitement les deux conditions de sortie : **aucun `[NEEDS CLARIFICATION]` ne
subsiste** et **aucun choix technique n'a fuité**.

Récapitule ensuite le **périmètre EXCLU** — c'est le champ que l'utilisateur doit relire en
priorité, parce que c'est celui qui contraindra le plus l'agent en aval.

Propose ensuite l'**audit**, optionnel : « Pour vérifier que `docs/produit.md` est complet,
mesurable et sans marqueur laissé en place : `/clear`, puis `/scd-sdd:audit produit`. L'audit
confronte le document à une grille et rend une **liste de travail** — il ne touche jamais au
document lui-même. Le `/clear` n'est pas cosmétique : juger ce qu'on vient d'écrire, c'est relire
ses intentions au lieu du texte. Rien ne l'exige — sans audit, la suite est
`/scd-sdd:technique`. »

Puis : « `/clear`, puis `/scd-sdd:technique` — les fondations techniques **et** la structure, dans
la même session. »
