---
description: "Découpe une feature en TICKETS — des tranches verticales qui traversent les couches et livrent chacune un comportement vérifiable de bout en bout, avec ses critères observables et la liste des tickets qui la bloquent. Écrit specs/NNN-slug/NN-slug.md, un fichier par ticket, numérotés dans l'ordre des dépendances. Présente le découpage et ARBITRE la granularité avec l'humain avant d'écrire : c'est la seule validation du niveau feature, et elle ne se saute pas. Le refactor large échappe au découpage vertical et se séquence en expand-contract."
argument-hint: "[NNN ou slug — optionnel, résolu depuis le disque]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

Tu découpes une feature cadrée en **tickets** : un ticket = une tranche verticale = une PR. Chacun
livre un comportement bout en bout et déclare ce qui le bloque.

**L'arbitrage de granularité avec l'humain est le cœur de la commande**, pas une formalité de
sortie. C'est le second des deux gestes de validation du niveau feature — et le seul endroit où un
découpage se corrige à bon marché. Une fois les tickets écrits et l'implémentation lancée, corriger
coûte des PR.

Le cycle `1.x` déléguait ce jugement à un agent (`slice-auditor`) puis à une gate à seize contrôles
qui rendait un verdict. On rend le jugement à l'humain, qui l'a de toute façon toujours eu : la gate
lui redemandait la même chose, en plus cher (`DECISIONS.md` §D41).

Ratio : 40% humain / 60% AI (tu proposes le découpage ; l'humain le corrige jusqu'à l'accord).

## Règles absolues

- **Tu n'écris aucun fichier avant l'accord** sur le découpage. Écrire d'abord et demander ensuite
  transforme l'arbitrage en validation de façade.
- **Tranche verticale, sans exception hors refactor large.** Un ticket horizontal — « créer la
  table », puis « créer l'API », puis « créer l'UI » — est **rejeté** : sa correction ne se juge
  qu'en assemblage, et il ne livre rien.
- **Tout comportement de `## Ce que ça change` est couvert, et rien d'autre ne l'est.** Un ticket
  qui livre ce que la spec n'a pas demandé est du scope creep : le **hors-périmètre** fait foi.
- **Le graphe des `Bloqué par` est acyclique et au moins un ticket est démarrable.** Sinon le graphe
  est faux, pas la feature.
- **Les seuils sont des questions, jamais des verdicts.** Un dépassement déclenche « ce ticket ne
  serait-il pas trop gros ? ». Il n'y a plus de verdict dans ce cycle, et tu n'en rends pas.
- **Tu cherches une erreur, tu ne confirmes pas.** Ton propre découpage est généré : sa
  sur-complétude crée un faux sentiment de complétude. Celui qui « a l'air complet » est précisément
  celui à relire ligne à ligne.
- **Une décision structurante rencontrée ne se tranche pas ici** : brouillon dans
  `docs/adr/_candidates/`, renvoi vers `/scd-sdd:adr`.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — tranche
  verticale, bloqueur, front, expand-contract, préfactoring… — reçoit une glose d'**une ligne**,
  entre parenthèses ou entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès
  que l'humain emploie le terme lui-même**.
- **Un ID se cite avec son intitulé** à sa première mention — « 03 (export CSV vide) », jamais
  « 03 » nu. La règle vaut pour **tout** identifiant que tu emploies, y compris ceux que la session
  vient de créer.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Processus

1. **Résous la feature cible** selon la section « Cibler une feature » du skill `specs` — source de
   vérité unique, référencée et jamais recopiée. Filtre propre à cette étape : les features qui ont
   un `SPEC.md` et pas encore de tickets. Charge `references/tickets.md` **intégralement**.
   Communique en français.

2. **Lis `SPEC.md` en entier**, plus les ADR acceptés et le glossaire de `CLAUDE.md` — et
   `maquette.md` si elle existe : la règle de citation des écrans vit dans le bloc `<format>` de
   `references/tickets.md`. Les titres et les critères emploient le vocabulaire du domaine, pas le
   tien.

3. **Explore le dépôt** si ce n'est pas déjà fait : l'état réel du code que la feature touche.
   Cherche les occasions de **préfactoring** — *make the change easy, then make the easy change*.
   Un déplacement mécanique qui simplifierait plusieurs tickets **est** un ticket, et il les bloque.

4. **Repère le refactor large**, s'il y en a un. Un changement mécanique dont le rayon d'action
   traverse le dépôt ne rentre dans aucune tranche verticale : ne le force pas, séquence-le en
   **expand → migrer par paquets → contract**, selon le bloc `<splitting>`. Le manquer produit un
   ticket qui ne peut pas rester vert, et personne ne comprendra pourquoi.

5. **Compose le découpage** : tranches verticales, chacune passant les quatre bloquants de
   `<criteria>`, avec ses bloqueurs. Applique les signaux de scission — et souviens-toi que
   **l'excès inverse existe** : un ticket qui ne livre aucun incrément vérifiable est une tâche
   horizontale déguisée, à refusionner.

6. **Présente le découpage et arbitre** — c'est l'étape qui compte. Une liste numérotée ; pour
   chacun : le **titre**, **ce qu'il livre** (le comportement, pas les couches), et **ce qui le
   bloque**. Puis trois questions, posées ensemble :
   - la granularité est-elle juste — trop grossier, trop fin ?
   - les dépendances sont-elles réelles, ou seulement l'ordre dans lequel tu y as pensé ?
   - faut-il fusionner ou scinder quelque chose ?

   **Itère jusqu'à l'accord.** Ne passe pas à l'étape 7 sur un « ça a l'air bien » ambigu.

7. **Écris les tickets**, un fichier par ticket, `specs/NNN-slug/NN-slug.md`, sur le bloc
   `<format>`. Numérotation dans l'**ordre des dépendances** : un bloqueur porte toujours un numéro
   inférieur. Renseigne `**Vérif :**` — `test` par défaut ; tout `observé` porte son motif.

8. **Contrôle le graphe** avant de rendre : acyclique, au moins un ticket démarrable, chaque
   bloqueur existe. Un graphe faux se voit ici ou ne se voit jamais.

## Ce que tu NE fais PAS

- Tu **ne modifies ni `SPEC.md` ni `maquette.md`.** Si le découpage révèle un défaut de la spec,
  **signale-le** pour un retour à `/scd-sdd:spec` — ne le corrige pas en passant.
- Tu **n'écris aucun ADR** ni aucun document du socle.
- Tu **n'écris aucun code** et n'exécutes aucun test.
- Tu **ne lances aucune implémentation** — c'est `/scd-sdd:run`, et il prend un ticket à la fois.
- Tu **ne rends aucun verdict** et n'ouvres aucune fiche de corrections.
- Tu **ne prescris pas le git** — branches, commits, PR empilées appartiennent au niveau
  implémentation.

<report>

```
## Tickets — specs/NNN-slug/ · [N] tickets

| # | Livre | Bloqué par | Vérif |
|---|---|---|---|
| 01 | … | rien | test |
| 02 | … | 01 | test |

Démarrables maintenant : [01, …]
[Si refactor large : « 01-03 forment un expand-contract — le vert n'est promis qu'à … »]

### Couverture
[Chaque comportement de `## Ce que ça change` → le(s) ticket(s) qui le livrent.
 Tout comportement non couvert est un défaut, et se dit.]

### Ce que j'ai écarté du découpage
[une ligne par option de scission envisagée et rejetée, avec son motif — ou « rien »]
```

</report>

## Skill active

Skill `specs` — référence `references/tickets.md`, chargée **intégralement**. La règle « Cibler une
feature » est **référencée** dans le `SKILL.md`, jamais recopiée ici.

## À la fin

*« [N] tickets écrits, [M] démarrables. Prochaine étape : `/scd-sdd:run NNN 01` — un ticket, une
branche, une PR. »*

- Plusieurs tickets démarrables aux fichiers disjoints → *« 01 et 03 touchent des fichiers
  disjoints et ne se bloquent pas : `/scd-sdd:run-parallel NNN 01 03` les joue en parallèle réel. »*
- Un défaut de la spec a été révélé → **dis-le d'abord, seul** : *« Le découpage a révélé [quoi] —
  `/scd-sdd:spec NNN` avant d'implémenter. »*
