---
description: "Ouvre le miroir Linear d'un projet : vérifie la clé d'API, fait choisir l'équipe, lit ses workflow states RÉELS, crée le label de chantier s'il manque, propose l'initiative produit (réutilisée si elle existe, créée sinon), conseille en checklist les réglages UI qu'aucune API ne pose, et écrit docs/linear.md — une seule fois. Ce fichier EST l'opt-in : sans lui, aucun miroir. Ne pousse rien et refuse d'écraser un fichier existant."
argument-hint: "(aucun — écrit docs/linear.md, une seule fois)"
allowed-tools:
  - Read
  - Glob
  - AskUserQuestion
  - Write
  - Bash(curl *)
  - Bash(date *)
  - Bash(git add *)
  - Bash(git commit *)
---

## Contexte

Tu écris **`docs/linear.md`**, et ce fichier **est** l'opt-in du miroir : il existe → le miroir
existe ; il n'existe pas → `/scd-sdd:linear` s'arrête et le projet ne voit strictement aucun
changement.

Son contenu ne s'invente pas : les **noms** des workflow states appartiennent à l'équipe, pas au
plugin. Linear ne fixe que leurs **types**. C'est pourquoi cette commande **appelle l'API** avant
d'écrire quoi que ce soit — elle lit les états réels, elle ne les devine pas. Écrire une table de
correspondance de mémoire produirait un fichier qui a l'air juste et qui échouera au premier push.

Tu **ne pousses rien** : ni projet, ni issue, ni relation. Tes deux seules écritures chez Linear :
le **label de chantier**, s'il manque — parce que poser un label exige qu'il existe, et que
`/scd-sdd:linear` n'a pas le droit de le créer — et l'**initiative**, si l'humain en retient une qui
n'existe pas : même pattern, le setup crée, le push résout et rattache. Les réglages workspace
(auto-archivage, templates, activation des initiatives, intégration GitHub), eux, n'ont pas d'API
sûre : tu **constates** ce qui se lit et tu **conseilles en recette** le reste (§D22/§D29) — tu
n'exécutes jamais un réglage à la place de l'humain.

Ratio : 40% humain / 60% AI (l'humain fournit la clé, choisit l'équipe et tranche les statuts
ambigus ; tu interroges l'API, tu proposes la correspondance et tu écris le fichier).

## Règles absolues

- **Tu n'écrases jamais un `docs/linear.md` existant.** Tu configures une fois. La mise à jour est
  une **édition manuelle** : rejouer cette commande écraserait des correspondances de statuts
  arbitrées avec l'humain, sans rien signaler (garde anti-écrasement, modèle de `livraison`,
  `DECISIONS.md` §D29).
- **La valeur de la clé d'API ne s'écrit nulle part** — ni dans le fichier, ni dans le rapport, ni
  dans une commande que tu affiches. Tu passes la **variable**, jamais son contenu. `docs/linear.md`
  porte le **nom** de la variable, et lui seul.
- **Aucun identifiant, aucune URL Linear n'entre dans le dépôt, nulle part.** Les états, le label et
  l'initiative sont écrits **par leur nom**, jamais par leur `id` : `/scd-sdd:linear` les re-résout à
  chaque push. La **clé d'équipe** (`ENG`) et le **nom d'initiative** sont les deux seules
  exceptions, et ce sont des choix de configuration, pas des identifiants techniques
  (`DECISIONS.md` §D30, §D31).
- **Endpoint unique**, règle absolue : `https://api.linear.app/graphql`. Aucune autre URL n'est
  appelée — `Bash(curl *)` est un motif large, c'est cette règle qui le borne.
- **Tu lis `errors` à chaque appel**, toujours. Une requête GraphQL peut réussir **partiellement**
  avec un HTTP 200 : lire le seul code de retour te ferait croire vert un appel à moitié raté.
- **Tu ne pousses aucun contenu** : aucun projet, aucune issue, aucune relation. C'est
  `/scd-sdd:linear`, et elle se joue après.
- **Tu commites, `git add` scopé au seul `docs/linear.md`.** Jamais le travail en vol autour — sans
  quoi `/scd-sdd:run` tombera plus tard en `blocked-dirty-tree`.
- **Le problème avant les options.** Tes questions engagent un **workspace partagé** et un fichier
  qui ne se rejoue pas : dis d'abord ce qui est en jeu, puis donne à chaque option sa **conséquence
  concrète**. Le choix d'équipe fixe les états pour tous les pushs à venir ; retenir une initiative
  qui n'existe pas la **crée** chez Linear ; « aucune » se rattrape par une édition manuelle du
  fichier, pas en rejouant cette commande. Dis-le au moment de demander, pas après.
- **Glose au premier emploi.** Le premier terme que tu adresses à l'humain — équipe, projet, issue,
  initiative, workflow state, label, miroir, opt-in — reçoit une glose d'**une ligne**, entre
  parenthèses ou entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que
  l'humain emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
  ⚠️ La table « si tu viens de Jira » est en **fin** de rapport : c'est un récapitulatif, pas une
  dispense de gloser en session — l'humain rencontre ces mots bien avant de la lire.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Définitions

- **Équipe** (team) : le conteneur permanent de Linear — backlog, workflow states, cycles, membres.
  C'est lui que tu choisis ici, une fois pour toutes. Un **projet** Linear, lui, est un livrable
  borné : c'est ce que devient une feature au push.
- **Type d'état** : la catégorie que Linear impose (`triage`, `backlog`, `unstarted`, `started`,
  `completed`, `canceled`). Le miroir raisonne sur les types.
- **État réel** : le nom que l'équipe a donné à un état de ce type — « Backlog », « In Progress »,
  « Terminé »… C'est ce que `docs/linear.md` fige, et c'est pour ça qu'il faut le lire.
- **Label de chantier** : le seul label que le miroir possède. Il distingue une issue venue de
  `docs/chantiers/` d'une issue de ticket.
- **Initiative** : le conteneur produit au-dessus des projets Linear — optionnelle, activée par
  workspace. Son nom est une **configuration** arbitrée ici, une fois (§D31), jamais une
  dérivation ; le miroir n'en possède que le **rattachement** des projets, au push.

## Processus

1. **Vérifie que `docs/linear.md` n'existe pas** (`Glob`). S'il existe, **arrête-toi** et renvoie
   vers son **édition manuelle** : tu configures une fois, tu n'entretiens pas. Dis pourquoi —
   la table des statuts a été arbitrée avec l'humain contre les états réels de son équipe, et la
   ré-écrire depuis zéro la perdrait. La voie de mise à jour a l'air de passer par ici, elle passe
   par là-bas. Un cas la précise, et il reste manuel : un fichier à **six rubriques** (1.10.0) gagne
   la rubrique 7 par édition — `## Initiative` en dernière position, `<nom>` ou `aucune` ; le
   `<template>` de `references/linear-md.md` en donne la forme.

2. **Charge les références** : d'`references/api.md` du skill `linear`, les **quatre** blocs
   `<auth>`, `<queries_config>`, `<mutations_setup>` et `<pagination>`, et eux seuls — tu ne pousses
   ni projet ni issue, donc ni leurs lectures de matching ni leurs mutations ne te concernent.
   `<pagination>` en fait partie parce que **deux de tes trois lectures se paginent** : sans la
   boucle, un workspace de plus de 50 équipes ou de 50 labels te ferait travailler sur une liste
   tronquée, sans le dire. Et `references/linear-md.md` — **intégralement** : le contrat des
   rubriques et le `<template>` que tu rempliras. Lis la **date en tête** d'`api.md` avant de t'y
   fier : si elle remonte à plus de six mois, dis-le à l'humain **avant** d'appeler.

3. **Vérifie la clé par `viewer`**, avant tout le reste. Le nom par défaut de la variable est
   `LINEAR_API_KEY` ; demande-le (`AskUserQuestion`) si le projet en utilise un autre. Passe-le en
   substitution **avec message** — `${LINEAR_API_KEY:?absente de l'environnement}` — pour que les
   deux arrêts se distinguent :
   - **la variable est absente** → le shell s'arrête avant l'appel. Nomme la variable attendue, dis
     où se crée une clé personnelle (Linear → *Settings* → *Security & access* → *Personal API
     keys*), **arrête-toi** ;
   - **`viewer` répond une erreur d'authentification** → la variable existe mais la clé est refusée
     (révoquée, mal copiée, ou d'un autre workspace). Même arrêt, message différent.

   Dans les deux cas, **arrêt pédagogique et jamais de best-effort** : l'appel API **est** la
   commande, et il ne resterait rien derrière un demi-succès.

4. **Fais choisir l'équipe.** Lis la liste **en entier**, paginée : tu fais choisir dans cette
   liste, donc une liste tronquée ferait retenir une équipe par défaut d'en connaître une meilleure,
   et rien ne le signalerait. Une seule équipe dans le workspace → annonce-la et demande
   confirmation. Plusieurs → `AskUserQuestion`, en affichant clé et nom (`ENG — Engineering`). Tu ne
   choisis jamais à la place de l'humain : c'est le conteneur permanent de tout le miroir.

   Au passage, un **constat** : le nombre d'équipes du workspace — le total accumulé sur toutes les
   pages —, rapporté tel quel. Une seule suffit au miroir, et le plan Free en autorise **deux** —
   garder le quota en réserve est un conseil, pas une règle.

5. **L'initiative — optionnelle.** Interroge les initiatives du workspace (requête n° 5) :
   - **l'API refuse, ou rend une liste vide** — les deux se traitent pareil, le comportement quand
     les initiatives ne sont pas activées n'étant pas documenté → la rubrique 7 s'écrira `aucune`,
     et la checklist du rapport conseillera l'activation (*Settings → Initiatives*). **Dégradation
     douce, jamais d'arrêt** : « l'appel est la commande » ne vaut que pour la clé ;
   - **l'API répond** → `AskUserQuestion` : le nom que tu proposes (dérivé du nom du repo ou du
     titre de `docs/produit.md`), un autre nom, ou aucune initiative. Le nom retenu est une
     **configuration** (§D31) : arbitré ici, une fois, jamais re-dérivé. Ensuite :
     - une initiative **existante** porte ce nom → tu la réutilises, tu ne crées rien ;
     - **aucune** ne le porte → crée-la par `initiativeCreate` et **lis `success`** — la
       **deuxième et dernière** écriture de cette commande chez Linear ;
     - l'humain n'en veut **aucune** → la rubrique s'écrit `aucune`, comportement sans initiative
       strictement inchangé — l'opt-in dans l'opt-in.

6. **Lis les workflow states réels** de l'équipe retenue et **propose la correspondance** pour les
   trois types dont le miroir a besoin — `backlog`, `started`, `completed`. Un seul état d'un type →
   il s'impose, annonce-le. **Plusieurs états partagent un type** → `AskUserQuestion`, ici et
   maintenant : l'ambiguïté se tranche **une fois, au setup**, jamais en cours de push. **Aucun état
   d'un type requis** → dis-le et arrête-toi : c'est une équipe à compléter côté Linear, pas une
   correspondance à inventer.

7. **Le label de chantier.** Cherche-le dans les labels de l'équipe (nom par défaut : `chantier`),
   **liste paginée en entier** : conclure « absent » sur une page manquante créerait un **doublon**
   d'un label déjà là, et le miroir ne saurait plus lequel il pose.
   - **il existe** → tu le réutilises, tu ne crées rien ;
   - **il manque** → propose de le créer (`AskUserQuestion` : ce nom, un autre, ou aucun), puis
     crée-le par `issueLabelCreate` et **lis `success`**. Avec l'initiative, c'est l'une des **deux
     seules** écritures de cette commande chez Linear, et elle n'a lieu qu'ici : `/scd-sdd:linear`
     **pose** le label, elle ne le **crée** jamais.
   - **aucun label** retenu → écris-le tel quel dans le fichier ; les issues de chantier seront
     créées sans label, et `/scd-sdd:linear` le rapportera à chaque push.

8. **Écris `docs/linear.md`** — les **sept rubriques du contrat**, selon le `<template>` de
   `references/linear-md.md` : la rubrique 7 porte la réponse de l'humain, `<nom>` ou `aucune`,
   plus la date du jour (`date +%F`) et le nom de la commande qui l'a écrit. Trois points qui
   décident de sa validité : les états, le label et l'initiative sont écrits **par leur nom** ; la
   variable de clé par son **nom seul** ; et le fichier ne porte **ni identifiant, ni URL, ni liste
   d'issues, ni mapping**. Il est **fermé** — il ne croît pas.

9. **Rends le rapport** (voir le bloc ci-dessous), puis **commite** : `git add docs/linear.md` et
   `git commit -m "docs(linear): configuration du miroir"`, scopé au seul fichier écrit.

<report>
```
🔗 Miroir Linear configuré — docs/linear.md
   Équipe : ENG — Engineering  ·  clé d'API lue dans : LINEAR_API_KEY (nom seul)
   Constat : 1 équipe au workspace — le plan Free en autorise 2, quota en réserve

Statuts     backlog   → Backlog
            started   → In Progress
            completed → Done
Label       chantier  → créé dans l'équipe (il n'existait pas)
Initiative  sebc.dev  → créée dans le workspace (aucune ne portait ce nom)

Checklist côté Linear — réglages UI, pas d'API
   [ ] Auto-archivage actif (Team Settings → Issue statuses & automations) — c'est lui qui
       tient le plafond des 250 issues non archivées du plan Free
   [ ] 1-2 templates d'issues (Bug, Feature) pour ce que le miroir ne crée pas
   [ ] Labels transverses si besoin (Type/…, Area/…) — le setup ne les crée pas (§D31)
   [ ] Intégration GitHub (Settings → Integrations → GitHub) + Pull request automations de
       l'ÉQUIPE — prérequis de l'accroche PR : sans elles, la magic word ne transitionne rien
   [ ] Initiatives à activer (Settings → Initiatives) — seulement si l'API a refusé ci-dessus

Vocabulaire — à lire une fois si tu viens de Jira
   Projet Jira    → Équipe Linear   conteneur permanent : backlog, états, cycles, membres
   Epic           → Projet          livrable borné : jalons, date cible, avancement
   Story / Task   → Issue           unité de travail priorisable
   Sous-tâche     → Sous-issue ou checklist
   « un projet Linear par feature » se lit donc, en Jira : une epic par feature.

⚠  La description d'une issue de ticket est RÉÉCRITE en entier à chaque push — checklist des critères
   + marqueur. Tout texte humain écrit là est perdu au push suivant. Les COMMENTAIRES ne
   sont jamais touchés : c'est là que ça se dit.

→ Rien n'a été poussé : aucun projet, aucune issue, aucune relation.
→ Premier push : /scd-sdd:linear tout
→ Mise à jour de docs/linear.md : édition manuelle. Cette commande ne se rejoue pas.
```
</report>

## Ce que tu NE fais PAS

- Tu n'écrases, ne complètes ni ne « rafraîchis » un `docs/linear.md` existant, même si sa table de
  statuts paraît fausse. C'est une édition manuelle, et elle appartient à l'humain.
- Tu ne pousses **rien** : aucun projet, aucune issue, aucune checklist, aucune relation — leurs
  mutations ne te concernent pas, tu ne les charges même pas.
- Tu ne supprimes, n'archives et ne renommes rien côté Linear. Tes écritures s'arrêtent à **deux**
  objets — le label de chantier et l'initiative —, chacun une fois, et seulement s'il manque.
- Tu n'exécutes aucun réglage workspace — auto-archivage, templates, activation des initiatives,
  intégration GitHub : tu conseilles en recette, l'humain clique (§D22/§D29).
- Tu ne crées pas de labels transverses (`Type/…`, `Area/…`) — écarté §D31 : le miroir ne possède
  qu'**un** label, et des labels qu'aucune commande ne posera seraient des orphelins du contrat.
- Tu n'écris jamais la **valeur** d'une clé d'API, ni un identifiant, ni une URL Linear — ni dans le
  fichier, ni dans le rapport, ni dans une commande affichée.
- Tu ne devines aucun nom d'état : ils viennent de l'API, ou la commande s'arrête.
- Tu ne contournes pas une erreur d'API en essayant un autre nom de champ : tu la rapportes. C'est
  d'abord le signal que la référence a vieilli.
- Tu ne modifies aucun autre fichier du dépôt et tu ne commites rien d'autre que `docs/linear.md`.

## Skill active

- `linear` — contrat du miroir : granularité, clé dérivée, propriété des champs, sens unique.
  Charge `references/api.md` — **`<auth>`, `<queries_config>`, `<mutations_setup>` et
  `<pagination>`**, plus la date en tête, qui se lit avant tout appel — et
  `references/linear-md.md`, **intégralement** : le contrat des rubriques et son `<template>`.

**Un seul skill, et c'est volontaire.** Tu ne lis ni le ticket, ni une fiche de chantier : charger
`feature-specs` ou `chantier` ici n'aurait servi qu'à rendre tentant un push que cette commande n'a
pas le droit de faire.

## À la fin

Affiche le rapport, puis les trois suites, dans cet ordre :

1. **Le premier push** — `/scd-sdd:linear tout`, ou `/scd-sdd:linear <NNN|slug>` pour une seule
   feature. C'est elle qui crée projets, issues, checklists et relations ; elle n'a **ni `Write`, ni
   `Edit`, ni git**, et c'est ce qui prouve que le miroir ne redescend jamais dans les fichiers.
2. **La priorisation se fait dans Linear** — priorité, estimation, assigné, cycle. Le miroir ne les
   possède pas et ne les écrasera jamais ; rien de tout ça ne remontera dans le dépôt.
3. **La mise à jour de `docs/linear.md` est manuelle** — un état renommé côté Linear, une équipe
   qui change, une initiative à ajouter après coup : on édite le fichier. Cette commande ne se
   rejoue pas.
