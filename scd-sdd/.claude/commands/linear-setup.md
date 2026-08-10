---
description: "Ouvre le miroir Linear d'un projet : vérifie la clé d'API, fait choisir l'équipe, lit ses workflow states RÉELS, crée le label de chantier s'il manque, et écrit docs/linear.md — une seule fois. Ce fichier EST l'opt-in : sans lui, aucun miroir. Ne pousse rien et refuse d'écraser un fichier existant."
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

Tu **ne pousses rien** : ni projet, ni issue, ni relation. La seule écriture que tu fais chez Linear
est le **label de chantier**, une fois, s'il manque — parce que poser un label exige qu'il existe, et
que `/scd-sdd:linear` n'a pas le droit de le créer.

Ratio : 40% humain / 60% AI (l'humain fournit la clé, choisit l'équipe et tranche les statuts
ambigus ; tu interroges l'API, tu proposes la correspondance et tu écris le fichier).

## Règles absolues

- **Tu n'écrases jamais un `docs/linear.md` existant.** Tu configures une fois. La mise à jour est
  une **édition manuelle** : rejouer cette commande écraserait des correspondances de statuts
  arbitrées avec l'humain, sans rien signaler (garde anti-écrasement, modèle de `contract`,
  `DECISIONS.md` §D29).
- **La valeur de la clé d'API ne s'écrit nulle part** — ni dans le fichier, ni dans le rapport, ni
  dans une commande que tu affiches. Tu passes la **variable**, jamais son contenu. `docs/linear.md`
  porte le **nom** de la variable, et lui seul.
- **Aucun identifiant, aucune URL Linear n'entre dans le dépôt, nulle part.** Les états et le label
  sont écrits **par leur nom**, jamais par leur `id` : `/scd-sdd:linear` les re-résout à chaque push.
  La **clé d'équipe** (`ENG`) est la seule exception, et c'est un choix de configuration, pas un
  identifiant technique (`DECISIONS.md` §D30).
- **Endpoint unique**, règle absolue : `https://api.linear.app/graphql`. Aucune autre URL n'est
  appelée — `Bash(curl *)` est un motif large, c'est cette règle qui le borne.
- **Tu lis `errors` à chaque appel**, toujours. Une requête GraphQL peut réussir **partiellement**
  avec un HTTP 200 : lire le seul code de retour te ferait croire vert un appel à moitié raté.
- **Tu ne pousses aucun contenu** : aucun projet, aucune issue, aucune relation. C'est
  `/scd-sdd:linear`, et elle se joue après.
- **Tu commites, `git add` scopé au seul `docs/linear.md`.** Jamais le travail en vol autour — sans
  quoi `/scd-sdd:run` tombera plus tard en `blocked-dirty-tree`.

## Définitions

- **Équipe** (team) : le conteneur permanent de Linear — backlog, workflow states, cycles, membres.
  C'est lui que tu choisis ici, une fois pour toutes. Un **projet** Linear, lui, est un livrable
  borné : c'est ce que devient une feature au push.
- **Type d'état** : la catégorie que Linear impose (`triage`, `backlog`, `unstarted`, `started`,
  `completed`, `canceled`). Le miroir raisonne sur les types.
- **État réel** : le nom que l'équipe a donné à un état de ce type — « Backlog », « In Progress »,
  « Terminé »… C'est ce que `docs/linear.md` fige, et c'est pour ça qu'il faut le lire.
- **Label de chantier** : le seul label que le miroir possède. Il distingue une issue venue de
  `docs/chantiers/` d'une issue de lot.

## Processus

1. **Vérifie que `docs/linear.md` n'existe pas** (`Glob`). S'il existe, **arrête-toi** et renvoie
   vers son **édition manuelle** : tu configures une fois, tu n'entretiens pas. Dis pourquoi —
   la table des statuts a été arbitrée avec l'humain contre les états réels de son équipe, et la
   ré-écrire depuis zéro la perdrait. La voie de mise à jour a l'air de passer par ici, elle passe
   par là-bas.

2. **Charge la référence** : `references/api.md` du skill `linear` — les blocs `<auth>`, `<queries>`
   et la **seule mutation de label** de `<mutations>`. Rien d'autre : tu ne pousses ni projet ni
   issue, donc leurs mutations ne te concernent pas. Lis la **date en tête** avant de t'y fier : si
   elle remonte à plus de six mois, dis-le à l'humain **avant** d'appeler.

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

4. **Fais choisir l'équipe.** Une seule équipe dans le workspace → annonce-la et demande
   confirmation. Plusieurs → `AskUserQuestion`, en affichant clé et nom (`ENG — Engineering`). Tu ne
   choisis jamais à la place de l'humain : c'est le conteneur permanent de tout le miroir.

5. **Lis les workflow states réels** de l'équipe retenue et **propose la correspondance** pour les
   trois types dont le miroir a besoin — `backlog`, `started`, `completed`. Un seul état d'un type →
   il s'impose, annonce-le. **Plusieurs états partagent un type** → `AskUserQuestion`, ici et
   maintenant : l'ambiguïté se tranche **une fois, au setup**, jamais en cours de push. **Aucun état
   d'un type requis** → dis-le et arrête-toi : c'est une équipe à compléter côté Linear, pas une
   correspondance à inventer.

6. **Le label de chantier.** Cherche-le dans les labels de l'équipe (nom par défaut : `chantier`).
   - **il existe** → tu le réutilises, tu ne crées rien ;
   - **il manque** → propose de le créer (`AskUserQuestion` : ce nom, un autre, ou aucun), puis
     crée-le par la mutation de label et **lis `success`**. C'est la seule écriture de cette commande
     chez Linear, et elle n'a lieu qu'ici : `/scd-sdd:linear` **pose** le label, elle ne le **crée**
     jamais.
   - **aucun label** retenu → écris-le tel quel dans le fichier ; les issues de chantier seront
     créées sans label, et `/scd-sdd:linear` le rapportera à chaque push.

7. **Écris `docs/linear.md`** — les **six rubriques du contrat**, dans l'ordre où le skill `linear`
   les énumère, plus la date du jour (`date +%F`) et le nom de la commande qui l'a écrit. Trois
   points qui décident de sa validité : les états et le label sont écrits **par leur nom** ; la
   variable de clé par son **nom seul** ; et le fichier ne porte **ni identifiant, ni URL, ni liste
   d'issues, ni mapping**. Il est **fermé** — il ne croît pas.

8. **Rends le rapport** (voir le bloc ci-dessous), puis **commite** : `git add docs/linear.md` et
   `git commit -m "docs(linear): configuration du miroir"`, scopé au seul fichier écrit.

<report>
```
🔗 Miroir Linear configuré — docs/linear.md
   Équipe : ENG — Engineering  ·  clé d'API lue dans : LINEAR_API_KEY (nom seul)

Statuts   backlog   → Backlog
          started   → In Progress
          completed → Done
Label     chantier  → créé dans l'équipe (il n'existait pas)

Vocabulaire — à lire une fois si tu viens de Jira
   Projet Jira    → Équipe Linear   conteneur permanent : backlog, états, cycles, membres
   Epic           → Projet          livrable borné : jalons, date cible, avancement
   Story / Task   → Issue           unité de travail priorisable
   Sous-tâche     → Sous-issue ou checklist
   « un projet Linear par feature » se lit donc, en Jira : une epic par feature.

⚠  La description d'une issue de lot est RÉÉCRITE en entier à chaque push — checklist Tn
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
- Tu ne pousses **rien** : aucun projet, aucune issue, aucune checklist, aucune relation. Tu
  n'appelles ni `projectCreate`, ni `issueCreate`, ni `issueRelationCreate`.
- Tu ne supprimes, n'archives et ne renommes rien côté Linear. Tu ne crées **qu'un** label, et
  seulement s'il manque.
- Tu n'écris jamais la **valeur** d'une clé d'API, ni un identifiant, ni une URL Linear — ni dans le
  fichier, ni dans le rapport, ni dans une commande affichée.
- Tu ne devines aucun nom d'état : ils viennent de l'API, ou la commande s'arrête.
- Tu ne contournes pas une erreur d'API en essayant un autre nom de champ : tu la rapportes. C'est
  d'abord le signal que la référence a vieilli.
- Tu ne modifies aucun autre fichier du dépôt et tu ne commites rien d'autre que `docs/linear.md`.
- Tu n'écris aucune ligne de journal (voir ci-dessous).

## Consigne au journal

**Aucune.** Tu ne joues aucune phase du cycle, et le fait que tu produis est **`docs/linear.md`
lui-même** — écrit, commité, donc daté par git. L'inscrire aussi au journal mettrait la même
information à deux endroits et ferait recroître un fichier partagé. C'est de nature, jamais un
oubli : `DECISIONS.md` §D30, et la table des exceptions de la charte §1 — comme `lookup`, `research`
et les trois commandes de chantier.

Le miroir n'entre dans **aucune** table de dérivation, ne bloque **aucune** phase, et **aucun**
`status` ne le réclame. Contrôle négatif qui prouve que la règle a tenu : après un setup,
`docs/journal/socle.md` n'a **pas** grossi.

## Skill active

- `linear` — contrat du miroir : granularité, clé dérivée, propriété des champs, contrat de
  `docs/linear.md`, sens unique. Charge `references/api.md` — **`<auth>`, `<queries>` et la seule
  mutation de label**, plus la date en tête, qui se lit avant tout appel.

**Un seul skill, et c'est volontaire.** Tu ne lis ni `tasks.md`, ni une fiche de chantier : charger
`feature-specs` ou `chantier` ici n'aurait servi qu'à rendre tentant un push que cette commande n'a
pas le droit de faire.

## À la fin

Affiche le rapport, puis les trois suites, dans cet ordre :

1. **Le premier push** — `/scd-sdd:linear tout`, ou `/scd-sdd:linear <NNN|slug>` pour une seule
   feature. C'est elle qui crée projets, issues, checklists et relations ; elle n'a **ni `Write`, ni
   `Edit`, ni git**, et c'est ce qui prouve que le miroir ne redescend jamais dans les fichiers.
2. **La priorisation se fait dans Linear** — priorité, estimation, assigné, cycle. Le miroir ne les
   possède pas et ne les écrasera jamais ; rien de tout ça ne remontera dans le dépôt.
3. **La mise à jour de `docs/linear.md` est manuelle** — un état renommé côté Linear, une équipe qui
   change : on édite le fichier. Cette commande ne se rejoue pas.
