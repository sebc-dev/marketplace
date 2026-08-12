---
description: "Phase 7 du socle, terminale : assemble CLAUDE.md, le contrat opérationnel. Pointe vers les documents produits sans les recopier, lit les commandes du projet dans docs/ci.md, fond la constitution (principes + seuils), pose la Definition of Done. Court, haut-signal, advisory (il conseille l'agent, rien ne l'exécute — ce sont les contrôles de la phase ci qui bloquent)."
argument-hint: "(aucun — lit docs/brief.md, prd.md, stack.md, archi.md, adr/, ci.md)"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu assembles **`CLAUDE.md`**, le contrat opérationnel chargé à chaque session. C'est la
dernière phase du socle.

Sa contrainte dominante est la **concision**, et elle n'est pas esthétique : `CLAUDE.md`
occupe du contexte à chaque session, sur chaque tâche. Chaque ligne inutile dilue les
règles qui comptent. D'où la règle du pointeur — le contenu reste dans `docs/`, tu
n'écris que le chemin.

Sa seconde propriété est d'être **advisory** — il *conseille* l'agent, rien ne l'exécute.
Écrire « les tests doivent passer » ne fait pas passer les tests. Ce qui doit arriver à 100 % est un hook, un linter ou un test — pas
une phrase. Tu peux le noter, tu ne dois pas le présenter comme garanti.

C'est exactement pourquoi la phase `ci` te précède : ce qui est déterministe existe déjà,
figé dans `docs/ci.md`. Tu n'as donc plus à inventer les commandes du projet ni à espérer
que quelqu'un transforme un jour tes phrases en contrôles — tu **lis** les unes et tu
**pointes** les autres.

Ratio : 40% humain / 60% AI (assemblage ; les commandes viennent de `docs/ci.md`, l'humain
valide ce qui est repris).

## Règles absolues

- **Pointer, pas recopier.** Le contenu du Brief, du PRD et de la Stack reste dans
  `docs/`. `CLAUDE.md` mentionne les chemins (`@docs/…`) — recopier garantit la dérive.
- **`@import` avec parcimonie.** Les fichiers `@importés` sont chargés au lancement :
  n'importe que le stable et l'universel.
- **Test de chaque ligne** : « sa suppression ferait-elle échouer Claude ? » Sinon, coupe.
  **Cible 60-90 lignes, plafond 200.**
- **Aucune règle de style écrite à la main.** Le style appartient au linter, qui en est
  la source de vérité.
- **Aucune commande inventée, et plus aucune commande devinée.** Les commandes du projet
  sont celles de `docs/ci.md` — tu les recopies **à l'identique**, un caractère près : une
  variante ici et un contrôle CI vert deviennent deux vérités concurrentes.
- **Advisory ≠ garanti.** Ne présente jamais la Definition of Done comme une contrainte
  exécutée. Ce qui est réellement exécuté, ce sont les contrôles de `docs/ci.md` sous
  protection de branche : nomme-les comme tels, et rien d'autre.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — EARS,
  gate, lot, ADR, invariant, advisory… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.

## Processus

1. **Lis les six prérequis** : `docs/brief.md`, `docs/prd.md`, `docs/stack.md`,
   `docs/archi.md`, `docs/adr/` et `docs/ci.md`. Si l'un manque, **arrête-toi** et renvoie
   vers la commande correspondante — un contrat qui pointe vers un document inexistant est
   pire qu'un contrat absent. `docs/archi.md` absent → `/scd-sdd:archi`, qui est la phase 4 ;
   `docs/ci.md` absent → `/scd-sdd:ci`, qui est la phase 6.

   **Puis vérifie que `CLAUDE.md` n'existe pas** (`Glob`). S'il existe, **arrête-toi** et renvoie
   vers `/scd-sdd:revise-contract` : tu assembles une fois, tu n'entretiens pas. Ré-assembler
   depuis le template écraserait les remédiations de `premortem socle` et tout ajout humain — la
   voie de mise à jour a l'air de passer par ici, elle passe par là-bas.

2. **Charge le template et ses règles** : lis `references/claude-md.md` du skill
   `project-docs` — **tout sauf le bloc `<revision>`**, qui appartient à
   `/scd-sdd:revise-contract` et ne te concerne pas.

3. **Assemble `CLAUDE.md`** selon le template :
   - **En-tête en commentaires HTML** — le propriétaire, la règle « supprimer plus qu'on
     n'ajoute », les quatre déclencheurs de mise à jour et le renvoi vers
     `/scd-sdd:revise-contract`. Le bloc est retiré avant injection : il ne coûte **rien** en
     contexte, et c'est lui qui donne un propriétaire à l'entretien ;
   - **Vue d'ensemble** (3-5 bullets) et **pointeurs** `@docs/brief.md`, `@docs/prd.md`,
     `@docs/stack.md`, `docs/archi.md`, `docs/adr/` — avec la consigne de ne jamais
     contredire un ADR accepté, ni franchir un **invariant** de `docs/archi.md`. Ce dernier
     pointeur n'est pas décoratif : la dimension `architecture` de la review et les contrôles
     `arch-invariants` de la CI y renvoient tous les deux ;
   - **Commandes** du projet (build, test unitaire, lint/format, run local) : **lues dans
     la table « Commandes du projet » de `docs/ci.md`** et recopiées telles quelles. Tu
     n'interviewes plus et tu n'inventes rien. Une case que `docs/ci.md` laisse en
     `[à compléter]` le reste ici, et tu le **signales** : c'est un trou de la phase `ci`,
     pas une décision à prendre maintenant. Ajoute le pointeur `docs/ci.md` — le détail
     des contrôles y vit, il ne se recopie pas ;
   - **Conventions** qui diffèrent des défauts du langage, uniquement celles-là ;
   - **Principes non-négociables & seuils** — la constitution fondue ici plutôt que dans
     un fichier séparé ; reprends les seuils de déclenchement du skill `project-docs`, en
     nommant `/scd-sdd:kickoff-feature` comme point d'entrée du niveau specs ;
   - **Definition of Done** vérifiable — et vérifiable **par les contrôles bloquants de
     `docs/ci.md`**, nommés par leur job. Un item de DoD qu'aucun contrôle ne couvre reste
     légitime, mais il est advisory : ne le mélange pas avec ceux qui le sont vraiment ;
   - **Gotchas** — les comportements non-évidents qu'un agent ne peut pas deviner, dont
     ceux que `docs/ci.md` déclare **ne pas** couvrir. C'est le poste où passe l'essentiel des
     tokens du contrat : c'est ce qui ne se déduit d'aucune lecture du dépôt ;
   - **Renvois** — les skills du projet et les `.claude/rules/` path-scopées, en pointeurs et
     jamais inlinés. La section est admise **vide** au premier assemblage : un projet neuf n'a
     ni skill ni rule. Elle existe quand même, parce que c'est là que l'entretien déplacera ce
     qu'il retire — sans elle, il n'aurait nulle part où le mettre.

4. **Relis contre le bloc `<completion>`** de `references/claude-md.md`, puis **fais valider
   l'assemblage** par `AskUserQuestion` avant d'écrire le fichier. Deux sections seulement s'y
   prêtent, parce qu'elles sont les seules que rien du dépôt ne dicte : les **principes
   non-négociables** et la **Definition of Done**. Le reste est dérivé des documents du socle et ne
   se met pas au vote.

   Dis en une phrase ce qui est en jeu — ce fichier est chargé **en entier à chaque session**, donc
   chaque ligne se paie —, et pour chaque principe proposé, ce qu'il changera concrètement au
   travail de l'agent. Ce qui n'est pas retenu ne s'écrit pas : `/scd-sdd:revise-contract` pourra
   l'ajouter plus tard, et retirer coûte plus cher qu'ajouter.

5. **Signale les étapes aval**, hors socle. La CI n'en est plus une : elle est faite. Ce
   qui reste est l'**immutabilité des ADR** en hook, le **blindage local** — le bloc est
   déjà rendu par `docs/ci.md`, section « Blindage local », tu pointes, tu ne le recopies
   pas — et, si `docs/ci.md` porte encore **À POSER** pour la protection de branche, le
   fait de la poser : sans elle, les contrôles sont **informatifs** — ils signalent sans
   rien bloquer —, et ta DoD retombe donc entière dans l'advisory. Puis ouvrir la première feature.

6. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- **Tu n'écrases aucun `CLAUDE.md` existant.** Tu assembles une fois. Un contrat déjà écrit porte
  ce que `premortem socle` y a durci et ce que l'humain y a mis : le ré-assembler le détruirait
  sans rien signaler. L'entretien est `/scd-sdd:revise-contract`, et lui seul.
- Tu ne recopies aucun extrait du Brief, du PRD, de la Stack, d'`archi.md`, d'un ADR — ni la
  table des contrôles de `docs/ci.md`, dont tu ne prends que les commandes. En particulier, la
  table des invariants ne se recopie pas dans `CLAUDE.md` : elle croîtrait en double.
- Tu n'inventes aucune commande de build, test ou lint, et tu n'en devines aucune : elles
  viennent de `docs/ci.md`, ou elles y sont un `[à compléter]` que tu reportes tel quel.
- Tu n'installes aucun hook ici — tu les recommandes.
- Tu ne documentes aucune règle de style, d'indentation ou de formatage.
- Tu ne modifies aucun document du socle déjà produit.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `contract`
- **Résultat** : nb de principes · taille de la Definition of Done.
  Exemple : `CLAUDE.md · 6 principes · DoD 5 items`.

## Skill active

- `project-docs` — charge `references/claude-md.md`, **tout sauf le bloc `<revision>`**.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Le socle est complet, en sept documents : Brief, PRD, Stack, **Archi**, ADR, **CI**,
CLAUDE.md.
Propose l'**audit**, optionnel : « Pour vérifier que `CLAUDE.md` est complet, que ses pointeurs
résolvent et que sa section Commandes correspond à `docs/ci.md` : `/clear`, puis
`/scd-sdd:audit claude-md`. L'audit confronte le document à une grille et rend une **liste de
travail** — il ne touche **jamais** à `CLAUDE.md` : ce qu'il remonte se traite par
`/scd-sdd:revise-contract`. L'audit détecte, l'entretien édite ; ils ne se remplacent pas. Le
`/clear` n'est pas cosmétique : juger ce qu'on vient d'écrire, c'est relire ses intentions au lieu
du texte. Rien ne l'exige. »

Récapitule ensuite les quatre étapes recommandées, dans cet ordre :

1. **Ce qui reste déterministe à poser** — la protection de branche si `docs/ci.md` la
   porte encore **À POSER**, puis le blindage local et le hook d'immutabilité des ADR.
   Rappelle la phrase qui décide de tout : tant que la protection de branche n'est pas
   posée, les contrôles de `docs/ci.md` sont informatifs — ils signalent sans rien bloquer —,
   et `CLAUDE.md` reste seul.
2. **Première feature** — `/clear`, puis `/scd-sdd:kickoff-feature`.
3. **L'entretien du contrat** — ce fichier ne s'écrit qu'une fois, mais il dérive. Nomme
   `/scd-sdd:revise-contract` comme la **seule** voie de mise à jour, et les quatre déclencheurs
   qui justifient de la jouer : Claude refait la même erreur une 2ᵉ fois · une revue attrape ce
   qu'il aurait dû savoir · on retape la même correction · un nouveau coéquipier aurait cherché ce
   contexte. Ajoute les **deux cas mécaniques**, qui n'attendent aucun symptôme et appellent un
   retrait plutôt qu'un ajout : **`docs/ci.md` a changé** — la section Commandes en est une recopie,
   et rien ne la rejoue — et le projet a **changé de génération de modèle**, une règle utile à
   l'ancien pouvant nuire au nouveau. Et dis pourquoi `contract` n'est pas cette voie : le
   ré-assemblage écraserait ce que le premortem et l'humain auront ajouté.
4. **Discipline `/clear`** — une phase, un contexte propre.
