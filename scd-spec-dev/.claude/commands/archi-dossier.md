---
description: "Écrit le DOSSIER D'ARCHITECTURE complet du projet avec LikeC4 — contexte (acteurs, systèmes externes), conteneurs et composants avec sourceDir, déploiement, flux clés en vues dynamiques, README narratif aux vues rendues en Mermaid, candidats d'invariants et candidats d'ADR — en deux modes choisis sur le disque : RELEVÉ sur un projet existant (tout vient du code : arborescence, manifestes, imports, SDK, variables d'environnement, Dockerfile, CI ; brouillon complet en une passe, chaque élément avec sa trace, puis UNE relecture humaine) ; CONCEPTION sur un projet vide (tout vient de docs/vision.md, docs/roadmap.md, des specs OpenSpec et de l'humain interrogé par lots ; les conteneurs prévus portent #planned et le sourceDir que les premiers tickets devront honorer). Le mode se force par argument. N'écrit aucun ADR (c'est /scd-spec-dev:adr), n'édite aucun code. Complète /scd-spec-dev:archi, qui reste le geste court sur le seul modèle structurel."
argument-hint: "[releve | conception] — sinon choisi sur le disque : relevé s'il y a du code suivi hors docs/, openspec/, .claude/"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
  - Bash(likec4:*)
  - Bash(ls:*)
  - Bash(test:*)
  - Bash(git ls-files:*)
  - Bash(mkdir:*)
  - Bash(cat:*)
---

## Ce que fait cette commande

`/scd-spec-dev:archi-dossier` **écrit tout ce qu'un lecteur attend d'un dossier d'architecture**, là
où `/scd-spec-dev:archi` n'écrit que la structure que la review lit : les conteneurs, leurs vues, les
candidats d'invariants. Ici s'ajoutent le **contexte** (qui utilise le produit, de quoi il dépend),
les **composants**, le **déploiement** (où tourne quoi), les **flux** clés (comment une requête
traverse le système), un **README narratif** dont les vues sont rendues en Mermaid, et la liste des
**décisions à figer** par `/scd-spec-dev:adr`.

Deux modes, parce que **le modèle est le référent, pas le code**. La review et le script de conformité
confrontent le diff au modèle ; un modèle écrit **avant** le code est donc un contrat que les premiers
tickets doivent honorer, et un modèle relevé **depuis** le code est une photographie que la révision
de `/archi` tiendra à jour. Les deux modes produisent les **mêmes documents** ; seule la source
change :

| | **Relevé** (projet existant) | **Conception** (projet vide) |
|---|---|---|
| Source | l'arborescence, les manifestes, les imports, les SDK, l'environnement, la CI | `docs/vision.md`, `docs/roadmap.md`, les specs OpenSpec, et l'humain |
| `sourceDir` | le dossier réel | le dossier **prévu**, avec le tag `#planned` |
| Rythme | **brouillon complet en une passe**, chaque élément avec sa trace, puis **une** relecture | **questions par lots** : il n'y a rien à lire, tout vient de l'humain |
| Ratio | ~20 % humain / 80 % IA | ~60 % humain / 40 % IA |

## Ce qu'elle ne fait JAMAIS

- **Aucun ADR.** Elle liste les décisions à figer, avec leur trace ; le *pourquoi* est le travail de
  `/scd-spec-dev:adr`. Un ADR écrit depuis le code inventerait ce pourquoi.
- **Aucun élément sans trace en relevé**, aucun **sans décision humaine en conception**. Un
  conteneur que rien n'atteste ne s'écrit pas ; un conteneur « qui serait bien » non plus.
- **Aucune édition de code**, ni de `docs/adr/`, ni de `docs/vision.md` ou `docs/roadmap.md` :
  tu les lis, tu n'y écris pas.
- **Jamais un troisième niveau** sous le `system`, **jamais de `link`** — les deux règles de `/archi`
  tiennent ici.
- **Jamais de réécriture d'un `.c4` existant** : tu ajoutes par `extend` ou par Edit, tu ne remplaces
  pas un fichier que l'humain possède.

---

## Étape 0 — Précondition, projet, mode

```
test -f docs/architecture/likec4.config.json
```

Absent → s'arrêter : *le squelette n'est pas posé ; joue `/scd-spec-dev:setup` d'abord*. Présent →
lire `name` : c'est le `<name>` de **tous** les `--project` qui suivent.

**Le mode.** Si l'argument est `releve` ou `conception`, il commande. Sinon :

```
git ls-files
```

Un fichier suivi au moins qui **n'est ni** sous `docs/`, `openspec/`, `.claude/`, `.github/`, **ni**
un fichier de configuration à la racine (`package.json`, `tsconfig.json`, `.gitignore`, `README.md`
et leurs semblables) ⇒ **relevé**. Rien de tel ⇒ **conception**. Dis le mode choisi et pourquoi, en
une phrase, avant de continuer : un scaffold `npm create` est du code sans architecture, et c'est
le cas où l'humain force `conception`.

Puis lister les `.c4` et chercher `sourceDir` (Grep). Les conteneurs qui en portent déjà un viennent
de `/archi` ou d'un ADR : tu les **réutilises** tels quels, tu ne les renommes pas.

## Étape 1 — La matière

**En relevé**, tout vient du disque, et tu notes pour chaque fait **où** tu l'as vu (fichier, ligne) :

- `git ls-files` — l'arborescence suivie ; les **manifestes** (`package.json` et ses `workspaces`,
  `pyproject.toml`, `go.mod`, `Cargo.toml`, `pubspec.yaml`) ; les **points d'entrée**. Comme
  `/archi`, étape 1.
- Les **imports qui franchissent un dossier** (Grep `^import`, `require(`, `from … import`, `use
  crate::`) ⇒ relations `sync`. Un `fetch`/HTTP vers un autre conteneur ⇒ relation sans trace
  d'import, notée comme telle.
- Les **SDK et clients tiers** importés (`stripe`, `@aws-sdk/*`, `googleapis`, `resend`,
  `@sentry/*`, `openai`…) ⇒ **systèmes externes**. Les **variables d'environnement** (`process.env.X`,
  `os.environ["X"]`, `.env.example`) et les **URL en configuration** ⇒ un système externe par
  service distinct. Les fournisseurs d'**auth** (`next-auth`, `passport`, `firebase/auth`, un
  `AUTH_*`) ⇒ un système externe **et** un acteur (l'utilisateur authentifié).
- Les **acteurs** : les rôles que les routes, les gardes d'autorisation ou les rôles en base
  distinguent (`admin`, `member`, `anonymous`). Un seul acteur `user` si rien ne distingue.
- Les **sous-dossiers de premier niveau** de chaque `sourceDir` ⇒ candidats **composants** — seulement
  pour un conteneur dont le `sourceDir` a **quatre sous-dossiers ou plus** ; en dessous, une ligne
  suffit.
- Le **déploiement** : `Dockerfile*`, `docker-compose*.yml`, `wrangler.toml`, `fly.toml`,
  `vercel.json`, `netlify.toml`, `k8s/`, `helm/`, `terraform/`, `serverless.yml`, et les jobs de
  déploiement de la CI (`.github/workflows/*.yml` : `deploy`, `wrangler deploy`, `flyctl`,
  `kubectl apply`). Chaque cible nommée ⇒ un nœud ; chaque service d'un compose ⇒ une instance.
- Les **flux** : les routes et handlers (`app.get(`, `router.`, `@app.route`, `+server.ts`,
  `src/routes/**`), ce qu'ils appellent, jusqu'au store. Tu en repères jusqu'à cinq, l'humain
  retiendra les deux ou trois qui comptent (étape 3).

**En conception**, tout vient de trois fichiers et de l'humain : `docs/vision.md` (les exigences FR,
les critères SC, le hors-scope), `docs/roadmap.md` (les epics), `openspec/specs/` et
`openspec/changes/` s'ils existent. Tu lis, tu **cites** ce que tu retiens (« FR3 dit… »), et tu ne
supposes rien que ces fichiers ne disent pas.

## Étape 2 — Relevé : le brouillon complet, puis une relecture

**Le problème avant le brouillon.** En trois phrases, ce que la matière dit du projet : monolithe,
monorepo, front + API + worker ; ce qui hésite ; ce qui restera hors modèle (outillage, scripts).

Puis **écris tout, en une passe**, chaque élément portant sa trace en commentaire. La convention est
`// trace : <fichier>[:ligne] — <ce qui a été vu>` ; elle est ce que l'humain relit.

`docs/architecture/model.c4` — les conteneurs et composants, par Edit dans le `system` (les
conteneurs à `sourceDir` déjà présents restent ; les nouveaux s'ajoutent à côté) :

```likec4
    api = container 'API' {
      technology 'Node.js / Fastify'
      metadata { sourceDir 'src/api' }
      // trace : package.json:12 — scripts.dev = "tsx src/api/main.ts"
      routes = component 'Routes' { metadata { sourceDir 'src/api/routes' } }
      services = component 'Services' { metadata { sourceDir 'src/api/services' } }
      // trace : src/api/ a 5 sous-dossiers
    }
    api -[sync]-> orders 'importe OrderService'   // trace : src/api/routes/orders.ts:3
```

`docs/architecture/context.c4` — **nouveau fichier**, les acteurs et les systèmes externes, avec le
bloc `specification` qui leur manque (les blocs de tête **fusionnent** entre fichiers, le squelette
de `setup` n'est pas retouché) :

```likec4
specification {
  tag external
  tag planned
}

model {
  customer = actor 'Client' {
    description 'Passe et suit ses commandes'
    // trace : src/api/auth/roles.ts:4 — rôle "customer"
  }
  stripe = system 'Stripe' {
    #external
    description 'Paiement par carte'
    // trace : src/api/services/payment.ts:1 — import Stripe from 'stripe' ; STRIPE_SECRET_KEY
  }
  customer -> <name>.ui 'utilise'
  <name>.api -[sync]-> stripe 'crée les PaymentIntent'
}
```

Un élément `#external` n'a **jamais** de `sourceDir` : c'est un élément de contexte, la review ne le
confronte pas au code. Le `system` du projet est référencé en **FQN complet** (`<name>.api`) : un
fichier voisin ne voit pas ses identifiants courts.

`docs/architecture/deployment.c4` — **nouveau fichier**, seulement si l'étape 1 a trouvé une cible :

```likec4
specification {
  deploymentNode environment
  deploymentNode node
}

deployment {
  prod = environment 'Production' {
    // trace : fly.toml:1 — app = "shop-api" ; .github/workflows/deploy.yml:22 — flyctl deploy
    fly = node 'Fly.io' {
      instanceOf <name>.api
    }
    // trace : docker-compose.yml:14 — service postgres
    db = node 'Postgres managé' {
      instanceOf <name>.orders-db
    }
  }
}

views {
  deployment view prod {
    title 'Déploiement — production'
    include * -> *
  }
}
```

`docs/architecture/flows.c4` — **nouveau fichier**, une vue `dynamic` par flux retenu (étape 3),
chaque pas tracé vers le handler qui le fait :

```likec4
views {
  dynamic view flow-checkout {
    title 'Passer une commande'
    customer -> <name>.ui 'valide le panier'
    <name>.ui -> <name>.api 'POST /orders'          // trace : src/api/routes/orders.ts:18
    <name>.api -> stripe 'crée le PaymentIntent'    // trace : src/api/services/payment.ts:40
    <name>.api -> <name>.orders-db 'insère la commande'
  }
}
```

**Les vues manquantes** : `index` existe ; une vue par conteneur nouveau (`view api of <name>.api`,
`include *`), comme `/archi`. Une vue `context` (`view context of <name> { include *, -> <name> -> }`)
si `context.c4` a au moins un acteur ou un externe.

Puis valider, **avant** toute relecture :

```
likec4 validate --no-layout --json --project <name> docs/architecture
```

Code **1** ⇒ corriger ce que tu viens d'écrire. Ne jamais soumettre un brouillon invalide.

**La relecture, une seule.** Tu rends le tableau des éléments (FQN, kind, `sourceDir`, trace) et la
liste des relations, puis **une** `AskUserQuestion` ouverte sur ce qu'il faut rayer, renommer ou
fusionner — pas une question par élément. Tu appliques les retours par Edit, tu revalides, et tu
passes à l'étape 4. Si l'humain veut relire une seconde fois, il le demande.

## Étape 3 — Les flux (les deux modes)

**Le problème avant les options.** Un flux est ce qu'un nouvel arrivant demande en premier : *que se
passe-t-il quand… ?* Trop de flux et personne ne les lit ; le dossier en porte **deux ou trois**.

En relevé, `AskUserQuestion` à choix multiple sur les flux repérés à l'étape 1 (jusqu'à cinq, chacun
avec sa route d'entrée). En conception, la même question sur les exigences FR de `docs/vision.md`
qui décrivent un parcours. Les retenus vont dans `flows.c4`.

## Étape 2bis — Conception : interroger par lots, puis écrire

Sans code, **tu ne devines rien** : chaque élément du modèle est une réponse de l'humain. La méthode
vient de `docs/playbook/archi_elicitation_2026-08.md` (questions 1 et 5) : des **caractéristiques**
attendues vers un **style**, du style vers les **conteneurs**. Cinq lots, `AskUserQuestion` à
**quatre options au plus** chacun, le problème posé en prose avant chaque lot :

1. **Ce qui compte** — deux ou trois caractéristiques parmi celles que `vision.md` laisse deviner :
   simplicité de déploiement, coût, latence, isolation des données, évolutivité de l'équipe.
   Tu cites l'exigence qui te fait proposer chacune.
2. **Le style** — les options que le lot 1 rend plausibles, avec leur conséquence sur le nombre de
   conteneurs : monolithe modulaire (un conteneur, des composants), front + API séparés, services
   par domaine. **Recommande** celui qui coûte le moins pour les caractéristiques retenues.
3. **Les conteneurs** — pour le style retenu, chaque conteneur avec son `sourceDir` **prévu** et sa
   technologie. La conséquence est dite : *tout ce qui sera écrit sous `src/api` sera rattaché à
   cet élément, et un import de `orders` depuis `ui` sera signalé par la review*.
4. **Les acteurs et les externes** — les rôles que `vision.md` nomme, les services tiers que les
   FR impliquent (paiement, mail, auth, stockage).
5. **Le déploiement** — la cible, si elle est décidée ; sinon rien, et tu le dis.

Puis tu écris les mêmes fichiers qu'en relevé, avec deux différences : chaque conteneur porte
**`#planned`** (glose : un élément dont le `sourceDir` n'existe pas encore ; la révision de `/archi`
ne le signalera pas comme disparu, et proposera de retirer le tag quand le dossier apparaîtra), et
la trace est **la décision** (`// décision : lot 2, monolithe modulaire — FR1, FR4`). Le tag est
déclaré dans `context.c4` ; sur un conteneur de `model.c4`, il s'écrit dans le corps de l'élément :

```likec4
    api = container 'API' {
      #planned
      technology 'Node.js / Fastify'
      metadata { sourceDir 'src/api' }
      // décision : lot 3 — un conteneur par unité déployable ; FR2 impose une API publique
    }
```

Valider comme en relevé. Pas de relecture séparée : l'humain a décidé chaque ligne.

## Étape 4 — Le README narratif et les vues rendues

```
mkdir -p docs/architecture/.mermaid
likec4 gen mermaid -o docs/architecture/.mermaid --project <name> docs/architecture
```

Un `.mmd` par vue. **Écris** `docs/architecture/README.md` (Write s'il n'existe pas ; sinon, Edit des
seules sections balisées `<!-- scd:… -->` ci-dessous, le reste appartient à l'humain) :

````markdown
# Architecture — <nom du projet>

<!-- scd:contexte -->
## Le produit et son contexte
<Une phrase par acteur et par système externe, tirée de sa description.>

```mermaid
<contenu de .mermaid/context.mmd>
```
<!-- /scd:contexte -->

<!-- scd:conteneurs -->
## Les conteneurs
| Élément | Technologie | Code | Ce qu'il fait |
|---|---|---|---|
| `<name>.api` | Node.js / Fastify | `src/api` | <description> |

```mermaid
<contenu de .mermaid/index.mmd>
```
<!-- /scd:conteneurs -->

<!-- scd:deploiement -->
## Le déploiement
<absent si deployment.c4 n'existe pas>
<!-- /scd:deploiement -->

<!-- scd:flux -->
## Les flux clés
### Passer une commande
```mermaid
<contenu de .mermaid/flow-checkout.mmd>
```
<!-- /scd:flux -->

<!-- scd:decisions -->
## Décisions à figer — `/scd-spec-dev:adr`
| Décision observée | Trace | ADR |
|---|---|---|
| Fastify plutôt qu'Express | `package.json:24` | — |
| Une base par conteneur | `docker-compose.yml:14,31` | — |
<!-- /scd:decisions -->

Le modèle est dans `*.c4` ; ce fichier s'en déduit. `likec4 validate --no-layout --json --project <name> docs/architecture`.
````

Les **décisions à figer** sont ce que le code (ou, en conception, les lots) a **déjà tranché** sans
que personne ne l'ait écrit : un framework choisi, un ORM, un monorepo, un bus, une base par
service. Chacune avec sa trace ; la colonne `ADR` est à `—` tant que `/scd-spec-dev:adr` ne l'a pas
remplie. **Tu ne rédiges aucun ADR** : tu nommes ce qu'il y a à figer.

Le dossier `.mermaid/` est un rendu intermédiaire : propose de l'ajouter au `.gitignore`, ne le fais
pas toi-même.

## Étape 5 — Les candidats d'invariants

Même mécanique et même règle d'admission que `/archi`, étape 4 : relire les relations **à la lumière
du modèle**, proposer des candidats (classe 1 à 11, colonne `ADR` à `—`) par `AskUserQuestion`,
écrire les retenus dans la table de `docs/architecture.md`, `INV<n>` suivant après le plus grand Id.
En conception, un candidat se lit dans les décisions des lots (« `ui` n'importera jamais `orders` »)
et mérite d'être promu **tout de suite** par `/adr`, puisque le pourquoi est connu : dis-le.

**Dire ce qui n'entre pas** : les classes 12 à 15 (sémantique, runtime, holistique) vont en ADR ou
dans `docs/ci.md`, jamais dans la table.

## Étape 6 — Rendre compte

<report>
```
## Dossier d'architecture — docs/architecture/ · relevé · likec4 validate : valid

| Fichier | Écrit | Contenu |
|---|---|---|
| model.c4 | édité | 3 conteneurs (+2), 4 composants sous api |
| context.c4 | créé | 2 acteurs, 3 externes (Stripe, Resend, GitHub OAuth) |
| deployment.c4 | créé | Production : Fly.io (api), Cloudflare Pages (ui), Postgres managé |
| flows.c4 | créé | 2 flux : checkout, inscription |
| README.md | créé | 5 sections, 4 vues Mermaid |
| ../architecture.md | édité | 3 candidats d'invariants (INV1-INV3) |

Vues : index, context, api, ui, orders, prod, flow-checkout, flow-signup
unmapped : scripts/, tools/ (outillage, non modélisé)

### Décisions à figer (README, section « Décisions à figer »)
- Fastify plutôt qu'Express — package.json:24
- Une base par conteneur — docker-compose.yml:14,31

### N'entre pas dans la table
- « l'API répond en 200 ms » — classe 13 (runtime) → docs/ci.md
```
</report>

**Prochaine action** : `/scd-spec-dev:adr "<titre>" "<contexte>"` pour la première décision à figer
— en conception, sans attendre : les invariants décidés deviennent opposables dès que l'ADR existe.
Puis `/scd-spec-dev:archi` tiendra le modèle à jour contre le code, et retirera les `#planned` au fil
des tickets.

## Skill active

- **`architecture`** — le contrat : `SKILL.md` en entier, puis `references/modele.md` (kinds,
  `sourceDir`, les fichiers du dossier, les deux tags, les kinds de déploiement) et
  `references/invariants.md` (la table, la question d'admission, les 11 classes).
- **`likec4-dsl`** — la syntaxe dès que tu écris une ligne de `.c4` ; en particulier
  `references/deployment.md` (nœuds, `instanceOf`, vues de déploiement) et
  `references/dynamic-views.md` (les vues `dynamic`, `parallel`, `variant sequence`).

Tu parles la **langue de l'humain**, tu gloses **une fois** chaque terme de méthode, et chaque
élément que tu écris dit **d'où il vient** — un fichier et une ligne, ou une décision et son lot.
