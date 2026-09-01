---
description: "Reprend un projet suivi par scd-sdd 1.x vers 2.0.0, qui est CASSANT : elle ARCHIVE et elle RÉPARE, elle ne convertit pas. L'arbre 1.x entier — produit/technique, brief/prd/stack/archi, docs/adr/, le journal, les audits, les specs — part INTÉGRALEMENT dans docs/1.x/ et rien n'est supprimé ; les artefacts 2.0.0 sont ensuite écrits par les commandes qui les connaissent (/init, /adr, /spec, /tickets), depuis l'archive comme matière première. Entre les deux, elle répare ce qui NOMME mécaniquement les artefacts morts — chemins de CI, docs/linear.md, pointeurs de CLAUDE.md — et rend ce qu'un garde du projet lui refuse d'écrire. À jouer une fois par projet."
argument-hint: "(aucun — diagnostique le projet courant)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
  - Bash(git status *)
  - Bash(git log *)
  - Bash(git ls-files *)
  - Bash(git mv *)
  - Bash(mkdir -p *)
  - Bash(date -I)
  - Bash(gh pr list *)
  - Bash(glab mr list *)
---

## Contexte

`scd-sdd` **2.0.0** remplace le cycle `1.x`, et le remplacement est **cassant sur tous les axes** :
onze commandes ont disparu, les artefacts ont changé de nom et de forme, la notation EARS est
abandonnée, le journal est retiré (`DECISIONS.md` §D41). Un projet suivi en `1.x` que l'on ouvrirait
avec `2.0.0` sans reprise se retrouverait avec **deux vocabulaires concurrents** dans le même dépôt
— et c'est le seul état que cette commande existe pour empêcher.

**Tu archives et tu répares ; tu ne convertis pas.** Traduire document par document reviendrait à
porter ici les gabarits de `spec`, `tickets`, `adr` et `CLAUDE.md` — quatre copies qui dériveraient
de leur original au premier changement. Le format cible est écrit par les commandes qui le
connaissent, et l'archive est leur matière première.

Ce que tu fais donc, dans cet ordre : tu **constates**, tu **archives intégralement**, tu **répares
ce qui nomme mécaniquement les artefacts morts**, tu **déposes les candidats** qui donnent à
`/scd-sdd:adr` de quoi travailler, et tu **rends la séquence**.

Tu **diagnostiques d'abord, tu proposes ensuite, tu n'appliques qu'après accord**. Une reprise
déplace des documents que l'humain a écrits et relus : elle ne se joue pas en silence.

Ratio : 50% humain / 50% AI (tu constates et tu déplaces ; l'humain arbitre, signe, et réécrit
ensuite avec le workflow).

## Règles absolues

- **L'archive est intégrale, et elle est le seul geste destructif autorisé — qui ne détruit rien.**
  Tout l'arbre `1.x` part dans **`docs/1.x/`** par `git mv`. Tu ne supprimes **aucun** fichier, tu
  n'en réécris **aucun** en place. Ce qui est archivé reste lisible, greppable et daté.
- **Tu archives au RÉPERTOIRE dès que le répertoire part entier**, et c'est **obligatoire** pour
  `docs/adr/` : `git mv docs/adr docs/1.x/adr`, jamais un `git mv` par ADR. C'est ce qui distingue
  un déplacement d'une réécriture — y compris aux yeux des gardes Bash d'un projet, qui surveillent
  `adr/<chiffre>` et bloqueraient le second. Seul `specs/NNN-*/` se déplace pièce par pièce,
  puisqu'il garde ses `acceptance/`.
- **Tu n'écris aucun artefact `2.0.0`.** Ni `SPEC.md`, ni ticket, ni ADR, ni `CLAUDE.md`
  ré-assemblé. Tu écris trois choses et trois seulement : l'index de l'archive, les **candidats**
  dans `docs/adr/_candidates/`, et les **réparations mécaniques** de l'étape 6.
- **Tu ne lis que l'arbre vivant.** `docs/1.x/`, `docs/archives/`, `archive/`, `node_modules/`,
  `dist/`, `coverage/` sont hors périmètre. Un `docs/prd.md` trouvé sous `archive/socle-v1/` n'est
  pas un document du projet, et le convertir serait ressusciter un mort.
- **Un document que le plugin n'a jamais produit ne s'archive pas.** Les documents propres au projet
  — un document commercial, un dossier de preuves, une note métier — restent où ils sont et
  paraissent au rapport sous « conservé, hors cycle ». Tu ne décides pas du rangement de l'humain.
- **Tu ne commites rien et tu ne signes jamais.** Tu laisses l'arbre prêt ; l'humain commite. Là où
  un contrôle du projet exige une **signature**, tu le dis à l'avance et tu renvoies vers
  `/scd-sdd:signer` — un commit signé atteste qu'un humain a vu, et c'est précisément ce qu'un agent
  ne peut pas produire.
- **Ce que tu ne peux pas écrire, tu le rends.** Un projet `1.x` porte souvent ses propres gardes de
  session, qui refusent l'écriture sur `CLAUDE.md`, `.claude/` ou `.github/workflows/`. Un refus
  n'est pas un échec : c'est un geste qui change de main. Tu le portes au rapport, prêt à coller,
  et tu continues.
- **Aucun déplacement en silence.** Chaque pièce archivée est **annoncée avec ce qu'elle portait**,
  et l'humain tranche. « Tout archiver » est une réponse valide, mais c'est **sa** réponse.
- **Tu ne devines aucun contenu.** Ce qu'un document `1.x` ne dit pas ne s'invente pas : ça devient
  un `[à compléter]` **signalé**, dans le candidat ou au rapport.
- **Arbre propre exigé, et aucune PR de lot ouverte.** `git status --porcelain` non vide → STOP. Une
  PR `impl/<slug>-Rn` encore ouverte → STOP : ses commits visent des fichiers que tu vas déplacer,
  et le rebase d'après serait à faire à l'aveugle.
- **Tu es le seul fichier du plugin qui a le droit de nommer le vocabulaire `1.x`** — `brief`,
  `prd`, `stack`, `archi`, `produit`, `technique`, `contract`, `livraison`, `analyze`, `premortem`,
  `audit`, `lot Rn`, `SHALL`, `FR-xxx`, `tasks.md`. Tu le nommes **comme hérité**, jamais comme
  courant.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — ticket,
  tranche verticale, garde, candidat ADR, check requis… — reçoit une glose d'**une ligne**, entre
  parenthèses ou entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que
  l'humain emploie le terme lui-même**.
- **Un ID se cite avec son intitulé** — « FR-003 (export CSV) », « R7 (le code recopié ouvre la
  session) », jamais l'identifiant nu. La règle vaut pour **tout** identifiant, y compris ceux
  hérités du projet.
- **Tu parles la langue de l'humain.**

## Définitions

- **`1.x`** — le cycle précédent, sous ses **deux formes** : avant la fusion `1.19.0`
  (`brief.md`, `prd.md`, `stack.md`, `archi.md`) et après (`produit.md`, `technique.md`). Les deux
  se traitent pareil, et un projet peut porter des restes des deux.
- **Candidat ADR** — un brouillon dans `docs/adr/_candidates/`, que `/scd-sdd:adr` promeut en ADR
  définitif. C'est la seule voie, et elle est à sens unique.
- **Réparation mécanique** — une édition qui ne change aucune décision : un chemin qui a bougé, un
  nom de fichier qui n'existe plus, une commande retirée du plugin. Rien d'autre n'entre ici.

## Processus

1. **Charge les skills `socle` et `specs`** (voir `## Skill active`). Communique en français.

2. **Diagnostique, sans rien écrire.** Sur l'**arbre vivant** seulement :

   | Trace | Traitement |
   |---|---|
   | `docs/{brief,prd,stack,archi,produit,technique}.md` | → `docs/1.x/` |
   | `docs/adr/` **et** `docs/adr/_candidates/` | → `docs/1.x/adr/` — puis candidats reconstitués (étape 5) |
   | `docs/journal/` | → `docs/1.x/journal/` |
   | `docs/audit-*.md`, `docs/*-audit*.md` | → `docs/1.x/` — rapports d'une commande retirée |
   | `specs/NNN-*/{spec,plan,tasks}.md` | → `docs/1.x/specs/NNN-*/` |
   | `specs/NNN-*/acceptance/*.feature` | **restent** — ce sont des tests, pas de la doc |
   | `docs/ci.md` | **reste**, réparé (étape 6) |
   | `CLAUDE.md` | **reste**, réparé (étape 6) — jamais ré-assemblé ici |
   | `docs/chantiers/`, `docs/research/` | **restent** — artefacts `2.0.0` |
   | `docs/linear.md` | **reste**, réparé (étape 6) |
   | tout autre document du projet | **conservé, hors cycle** — nommé au rapport |

   Relève en plus les **trois choses qu'aucun tableau ne donne** :

   - **Les gardes que le projet porte déjà.** `.claude/settings.json` (hooks `PreToolUse`),
     `.claude/hooks/`, `.claude/commands/`. Un projet `1.x` mûr en a écrit pour compenser ce que le
     plugin ne faisait pas encore — et `2.0.0` livre désormais les couches 1 et 2. Note **ce qui se
     recouvre** et **ce que ses gardes vont te refuser d'écrire**.
   - **Les chemins `1.x` écrits en dur hors de `docs/`.** `grep` les workflows de la forge, les
     scripts de `scripts/`, les hooks, pour `specs/**`, `spec.md`, `plan.md`, `tasks.md`,
     `docs/journal`, `docs/produit`, `docs/prd`. ⚠️ **Un contrôle bloquant qui surveille un chemin
     disparu reste vert et ne protège plus rien** — sur un système sensible à la casse,
     `specs/**/spec.md` ne voit pas `SPEC.md`. C'est le défaut le plus cher de la reprise, et le
     plus silencieux.
   - **L'état réel de chaque feature** : *aucun lot livré* · *partielle* · *tous les lots livrés*,
     dérivé des cases de `tasks.md`. Plus les PR de lot ouvertes (`gh pr list` / `glab mr list`).

3. **Rends le diagnostic et attends.** Une ligne par pièce, avec **ce qu'elle portait**. **Rien
   n'est écrit à ce stade.** Si le projet n'a aucune trace `1.x`, dis-le et arrête-toi : il n'y a
   rien à reprendre, et fabriquer une migration pour justifier la commande est le défaut à éviter.

4. **Archive.** `mkdir -p docs/1.x`, puis un `git mv` **par répertoire ou par fichier racine**.
   Écris ensuite **`docs/1.x/README.md`** — l'index daté, et le seul document neuf de cette
   étape : une ligne par pièce, disant ce qu'elle portait et **quelle commande la lisait**, puisque
   plus aucune ne la lira. Nomme-y ce que rien ne reconstitue : les verdicts de gate, les premortems
   appliqués, les issues de lots du journal.

5. **Dépose les candidats ADR.** `/scd-sdd:adr` ne connaît que deux sources — la conversation en
   cours, et `docs/adr/_candidates/`. Sans dépôt, elle n'aurait **rien** à promouvoir : c'est ta
   part du travail, et elle est la raison pour laquelle la reprise ne perd pas les décisions.

   - **Un candidat par ADR archivé**, au format du `<template>` de `socle/references/adr.md`, dont
     le corps est repris **verbatim** de `docs/1.x/adr/NNNN-*.md`. Sa première ligne nomme sa
     provenance. Renseigne `Vérifiable ?` quand la décision laisse une trace observable.
   - **Un candidat par décision de `stack.md` / `archi.md` / `technique.md` dont la colonne *ADR*
     était vide** — elles seules n'ont jamais été figées.
   - **Les renvois `FR-xxx` / `SC-xxx` / `I-n` se repointent vers `docs/1.x/`, ils ne se
     suppriment pas.** `FR` et `PRD` y sont des noms de **notation**, pas des noms de fichier.
     Faut-il inliner l'exigence en prose ou garder le renvoi hérité ? **C'est une décision par ADR,
     et elle appartient à `/scd-sdd:adr`** — pas à un balayage global.

   ⚠️ **Un candidat n'est pas un ADR**, et l'ancienne numérotation ne survit pas : le nouveau
   `docs/adr/` repart à `0001`. C'est `/scd-sdd:adr` qui promeut, un par un, avec l'humain — et
   c'est ce qui empêche cette commande de refiger quarante décisions d'un coup.

6. **Répare ce qui nomme les artefacts morts.** Rien d'autre : aucune de ces éditions ne change une
   décision.

   | Où | Ce qui se répare |
   |---|---|
   | workflows de la forge, `scripts/` | les chemins `specs/**/{spec,plan,tasks}.md` → `specs/**/SPEC.md` et `specs/**/[0-9][0-9]-*.md` ; l'exemption de cases portait sur `tasks.md`, elle porte désormais sur les **tickets** |
   | `CLAUDE.md` | les pointeurs vers les documents archivés · les commandes retirées (`/scd-sdd:{brief,prd,stack,archi,produit,technique,contract,livraison,specify,clarify,plan,tasks,analyze,audit,premortem,kickoff-feature,init-project,revise-contract,status-specs,status-impl}`) · l'en-tête de maintenance, qui nomme une commande morte |
   | `docs/ci.md` | les mêmes chemins et les mêmes commandes ; la table des contrôles ne bouge pas |
   | `docs/linear.md` | la table de nommage : `Rn — <intitulé du lot>` → `NN — <intitulé du ticket>` |

   ⚠️ **Les noms de job ne se renomment JAMAIS** — ce sont des checks requis, et un renommage laisse
   un check fantôme qui bloque toutes les PR. Tu répares les **chemins**, jamais les noms.
   ⚠️ **Le miroir Linear résout ses issues par le titre.** Celles déjà poussées gardent leur titre
   `1.x` : le prochain `/scd-sdd:linear` en créerait de nouvelles à côté. Dis-le ; ne renomme rien
   chez Linear, tu n'en as pas l'outil.

   Chaque édition refusée par un garde du projet part au rapport sous « à faire à la main », avec
   son diff prêt à coller. Tu ne réessaies pas, tu ne contournes pas.

7. **Les chantiers.** Répertoires et fiches **inchangés** — `docs/chantiers/` est un artefact
   `2.0.0`. Une seule édition : les lignes `Portée` au vocabulaire mort — `· gate`, `socle · audit`,
   `· lot Rn` → `· ticket NN` ou `hors-cycle`, selon ce que la fiche dit vraiment. Une fiche de gate
   ou d'audit restée ouverte n'a plus de commande pour la fermer : **signale-la** et propose de la
   passer en `archive/`.

8. **Rends la séquence de réécriture**, feature par feature, avec **le chemin de sa source dans
   l'archive** :

   | État de la feature | Ce qu'on rejoue | Pourquoi |
   |---|---|---|
   | tous les lots livrés | `/scd-sdd:spec` **seul** | le code est dans `main` ; la spec reste la mémoire du *pourquoi*, le découpage n'a plus d'objet |
   | aucun lot livré | `/scd-sdd:spec` puis `/scd-sdd:tickets` | rien n'est engagé : la reprise est propre |
   | partielle | `/scd-sdd:spec` puis `/scd-sdd:tickets` **sur le reste seul** | ⚠️ dis-le en clair : les tickets ne couvrent que les comportements **non livrés**, et le `SPEC.md` couvre la feature entière |

9. **Nomme ce qui exigera une signature.** Sur un projet qui garde ses documents de specs sous
   contrôle (`specs-integrity` ou équivalent), **archiver un `spec.md` est une modification** :
   le commit devra être signé, et par l'humain. Liste les lots de commits concernés — c'est le
   dernier endroit où l'oublier coûte une PR rouge.

10. **Rends le point de reprise** — une prochaine commande, et une seule. C'est `/scd-sdd:init` :
    le socle avant tout le reste, puisque `/scd-sdd:adr` promeut sous un `docs/ci.md` et un
    `CLAUDE.md` à jour, et que `/scd-sdd:spec` lit le glossaire. Si le projet portait un
    `brief`/`prd`/`produit`, **signale l'option** — sans l'imposer — de reconstruire sa vision
    produit avec `/scd-sdd:vision`, qui synthétise `docs/1.x/{brief,prd,produit,stack,technique}.md`
    comme matière première : vision, `FR`/`SC`, stack et epics reviennent alors au niveau produit,
    `docs/vision.md` étant optionnel.

## Ce que tu NE fais PAS

- Tu **ne convertis aucun document**. Pas de `SPEC.md` traduit depuis un `spec.md`, pas de ticket
  déduit d'un lot `Rn`, pas d'ADR récrit. Tu archives, tu répares, tu déposes des candidats.
- Tu **ne supprimes aucun fichier**, et tu n'en proposes le retrait à personne. `docs/1.x/` est
  l'endroit où une pièce cesse d'être lue sans cesser d'exister.
- Tu **ne ré-assembles jamais `CLAUDE.md`** — l'assemblage et la révision appartiennent à
  `/scd-sdd:init`, et un ré-assemblage écraserait tout ajout humain (§D29).
- Tu **ne joues aucune commande du cycle** — ni `/scd-sdd:init`, ni `/scd-sdd:adr`, ni
  `/scd-sdd:spec`, ni `/scd-sdd:tickets`, ni `/scd-sdd:guards`. Tu prépares leur matière et tu rends
  leur ordre.
- Tu **ne poses aucun garde** et n'écris pas `.claude/guards.json` : c'est `/scd-sdd:guards`, après
  `/scd-sdd:init`, et elle a l'arbitrage des tests que tu n'as pas.
- Tu **ne retires aucun garde du projet**. Tu **nommes le recouvrement** avec les couches livrées
  par le plugin, et l'humain tranche — un garde retiré à tort ne se remarque qu'à la prochaine
  dérive.
- Tu **n'écris aucun code**, n'exécutes aucun test, ne commites rien, ne signes rien.
- Tu **ne désinstalles rien** : si un ancien plugin (`scd-project-docs`, `scd-feature-specs`,
  `scd-implement`) est encore installé, **rends la commande** et laisse l'humain la jouer.

<report>

```
## Reprise 1.x → 2.0.0 — [diagnostic | appliquée]

### Archivé dans docs/1.x/
| Pièce | Ce qu'elle portait | Lue par (commande retirée) |
|---|---|---|
| produit.md | 119 FR · 13 SC · 28 exclusions | /scd-sdd:produit |
| adr/ (22 ADR) | décisions figées → 22 candidats déposés | /scd-sdd:adr |
| journal/ | verdicts de gate, issues de lots — rien ne les reconstitue | — |

### Conservé
[une ligne par pièce restée en place : artefacts 2.0.0, et documents hors cycle du projet]

### Réparé
| Fichier | Ce qui a été repointé | État |
|---|---|---|
| .github/workflows/ci.yml | specs/**/spec.md → SPEC.md + tickets (job specs-integrity) | REFUSÉ par un garde du projet — diff ci-dessous |

### Candidats déposés — [N] dans docs/adr/_candidates/
[N venus des ADR archivés · M venus d'une décision jamais figée]

### À faire à la main
[une ligne par geste qu'un garde t'a refusé, ou que tu n'as pas l'outil de faire —
 avec son diff prêt à coller]

### Commits qui devront être SIGNÉS
[une ligne par lot, avec le contrôle qui l'exige — ou « aucun »]

### La séquence
1. /scd-sdd:init — socle
2. /scd-sdd:adr — promouvoir les [N] candidats
3. /scd-sdd:guards
4. (optionnel) /scd-sdd:vision — reconstruire la vision produit depuis docs/1.x/{brief,prd,produit,stack,technique}.md
5. par feature : [NNN-slug — /scd-sdd:spec seul | spec + tickets], source docs/1.x/specs/NNN-slug/

### Ce que je n'ai pas pu reprendre
[une ligne par trou, avec ce qu'il faudra écrire — ou « rien »]
```

</report>

## Skill active

- Skill `socle` — `references/adr.md` (le `<template>` des candidats et la règle d'immutabilité).
  **Pas `claude-md.md`** : tu ne rédiges pas le contrat, tu répares des pointeurs.
- Skill `specs` — `references/spec.md` et `references/tickets.md`, pour **savoir ce que la séquence
  produira** et dériver l'état des features. Tu n'en écris rien.
- Skill `chantier` — le `SKILL.md` seul : tu lis des en-têtes de fiches, tu n'en écris aucune.

## À la fin

- Reprise appliquée → *« L'arbre `1.x` est dans `docs/1.x/`, et rien n'a été perdu. Prochaine
  étape : `/scd-sdd:init` — le socle d'abord, parce que tout le reste s'écrit dessous. »*
- Diagnostic seul → *« Rien n'a été déplacé. Relance `/scd-sdd:migrate` quand tu veux appliquer. »*
- Des gestes ont été refusés par un garde du projet → **dis-le séparément**, et rends-les groupés :
  ce sont eux qui décideront si la reprise est finie ou à moitié.
- Des fiches de gate ou d'audit sont restées ouvertes → **dis-le séparément** : elles n'ont plus de
  commande pour les fermer.
