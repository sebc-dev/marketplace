---
description: "Pilotage du miroir Linear, en lecture seule : le garde des 250 issues du plan Free, l'hygiène de backlog, la vue Now/Next/Later — rendus en session, jamais persistés. N'écrit rien, ni chez Linear, ni dans le dépôt (aucun outil d'écriture). Exige docs/linear.md ; la revue de backlog recommandée toutes les 2-4 semaines."
argument-hint: "(aucun — interroge le workspace en lecture seule)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(curl *)
  - Bash(date *)
---

## Contexte

La priorisation vit chez Linear, et entre deux pushs rien ne la ramène en session : l'étape de
lecture de `/scd-sdd:linear` ne se joue qu'au détour d'un push. Tu es cette lecture, promue en
commande autonome (§D31) : tu comptes le workspace face au **mur des 250 issues** du plan Free, tu
passes les **quatre contrôles d'hygiène**, tu rends la vue **Now/Next/Later** — et tu t'arrêtes là.
C'est la « revue de backlog » que la cadence solo recommande toutes les 2-4 semaines.

Tu n'es **pas un 4ᵉ `status`** : les trois `status` dérivent l'état des fichiers du dépôt, tu
interroges un tiers. Aucun `status` ne te réclame, aucune table de dérivation ne te cite, et un
projet sans `docs/linear.md` n'a rien à te demander.

Ta vue **meurt avec la session**. Tout ce qu'elle montre — décompte, candidates, identifiants
Linear — se lit, se discute, et ne s'écrit nulle part : agir est le travail de l'humain, dans
Linear.

Ratio : 5% humain / 95% AI (l'humain lit le rapport et agit dans Linear ; tu lis, tu comptes, tu
rends).

## Règles absolues

- **`docs/linear.md` absent → arrêt immédiat**, renvoi vers `/scd-sdd:linear-setup`. Ce fichier
  **est** l'opt-in : sans lui il n'y a pas de miroir, donc rien à piloter.
- **Aucune mutation GraphQL, nulle part.** Tu n'envoies que des requêtes de lecture — c'est la
  règle que le `grep` négatif de la charte contrôle sur ce fichier. Côté dépôt, la non-écriture est
  **mécanique** : tu n'as ni `Write`, ni `Edit`, ni git, et ton `allowed-tools` est la preuve.
- **Rien de ce que tu lis n'est persisté.** Ni fichier, ni cache : la vue est
  éphémère par nature, pas par oubli. Aucun identifiant, aucune URL Linear ne ressort de cette
  commande vers un fichier — les afficher **en session** est légal, la vue meurt avec elle.
- **Les issues du miroir sans contrepartie fichier sont rapportées, jamais touchées.** Candidates à
  l'archivage : le mot est « candidates » — archiver appartient à l'humain, chez Linear.
- **Endpoint unique**, règle absolue : `https://api.linear.app/graphql`. Aucune autre URL n'est
  appelée — `Bash(curl *)` est un motif large, c'est cette règle qui le borne.
- **La valeur de la clé d'API ne s'affiche jamais** — ni dans une commande montrée, ni dans le
  rapport, ni dans un message d'erreur que tu recopies. Tu passes la **variable**, jamais son
  contenu.
- **Tu lis `errors` à chaque appel**, toujours. Une requête GraphQL peut réussir **partiellement**
  avec un HTTP 200 : un décompte bâti sur le seul code de retour serait faux en silence.
- **À la demande, jamais en polling.** Une revue est un acte de l'humain, pas une boucle : tu joues
  tes ~5-6 requêtes paginées une fois, et tu rends.

## Définitions

- **Issue du miroir** : une issue dont la description porte le **marqueur** en dernière ligne
  (`— miroir scd-sdd · clé : …`). Une issue **sans** marqueur appartient à l'humain et n'apparaît
  dans **aucun** contrôle.
- **Cycle de revue** : la cadence recommandée en solo, 2-4 semaines. C'est le seuil de dormance du
  3ᵉ contrôle d'hygiène.

## Processus

1. **Vérifie l'opt-in** (`Glob docs/linear.md`). Absent → **arrête-toi** : dis que le miroir n'est
   pas configuré, qu'il n'y a donc rien à piloter, et renvoie vers `/scd-sdd:linear-setup`.
   Présent → lis-le : le **nom** de la variable de clé d'API surtout — le bloc `<contrat>` de
   `references/linear-md.md` dit ce que les sept rubriques portent.

2. **Vérifie la clé par `viewer`**, avant tout le reste. Le nom de la variable se **lit** au
   fichier — tu ne le présumes **jamais** `LINEAR_API_KEY`. Passe-le en substitution **avec
   message**, `${<NOM_LU>:?absente de l'environnement}`, pour que les deux arrêts se distinguent :
   - **variable absente** → le shell s'arrête avant l'appel. Nomme la variable attendue, dis où se
     crée une clé personnelle (Linear → *Settings* → *Security & access* → *Personal API keys*),
     **arrête-toi** ;
   - **`viewer` en erreur d'authentification** → la variable existe, la clé est refusée (révoquée,
     mal copiée, ou d'un autre workspace). Même arrêt, message différent.

   Dans les deux cas : **arrêt pédagogique, jamais de best-effort**. L'appel API **est** la
   commande — sans lui, il n'y a pas de vue à rendre.

3. **Charge tes références** : les blocs `<auth>` et `<pilotage>` de `references/api.md` du skill
   `linear` — **lis la date en tête** et compare-la au jour (`date +%F`) : plus de six mois →
   dis-le à l'humain avant de te fier aux requêtes — et `references/pilotage.md` **intégralement** :
   les seuils du garde, les quatre contrôles, l'ossature du rendu.

4. **Compte le workspace** — la requête de comptage du bloc `<pilotage>`, paginée tant que
   `pageInfo.hasNextPage` : le total des nœuds accumulés est le décompte. **Workspace, pas
   équipe** — le plafond est workspace — et **archivées exclues**, `includeArchived` laissé au
   défaut : exactement la sémantique du mur. Applique les deux seuils de `<seuils>` : sous ~200
   rien à signaler, ~200-249 avertir, 250 mur atteint.

5. **Passe l'hygiène** — les quatre contrôles de `<hygiene>`, tous en lecture. Joue la **lecture
   d'hygiène** du bloc `<pilotage>` : **une seule** requête paginée, de portée workspace, qui rend
   d'un coup tout ce que les quatre contrôles et le rendu demandent. Sa sélection de champs est
   écrite là — tu ne la recomposes pas :
   - **terminées non archivées** — du plafond qui se libère ;
   - **sans priorité** sur les non terminées ;
   - **`started` dormantes** — `updatedAt` au-delà d'un cycle de revue, mesuré contre `date +%F` ;
   - **contrepartie fichier disparue** — le seul contrôle qui croise le disque : pour chaque issue
     **du miroir** (marqueur reconnu), vérifie par `Glob`/`Read` que la feature, le ticket ou la fiche
     que sa clé nomme existe encore sous `specs/` ou `docs/chantiers/`. C'est un contrôle
     d'**existence**, en lecture seule — tu ne charges ni `feature-specs`, ni `chantier` : il n'y a
     aucune cible à résoudre.

6. **Rends Now/Next/Later** — les trois listes de `<rendu>`, dérivées du **seul champ `priority`**
   de Linear : Now = Urgent + High, Next = Medium, Later = Low + No priority. L'arbitrage
   lui-même reste à l'humain, chez Linear : tu classes ce qui est écrit, tu ne re-priorises rien.

7. **Rends le rapport** — le bloc ci-dessous, et rien après lui que les suites du `## À la fin`.

<report>
```
📊 Pilotage Linear — lecture seule

   Décompte workspace : 187 / 250 issues non archivées
   (≥ ~200 → ⚠ planifier une passe d'archivage — ou le passage à Basic — avant le mur)
   (250 → 🛑 mur atteint : plus aucune issue ne peut être créée, le prochain push
    échouera sur toutes ses créations)

Now    [Urgent + High]      ENG-42  R2 — Verrouillage du compte      (001-auth)
Next   [Medium]             ENG-45  R3 — Journal d'audit             (001-auth)
Later  [Low + No priority]  ENG-51  2026-08-04-flaky-tests           (hors projet)

Hygiène — tout se traite dans Linear, rien ici
   3 terminées non archivées        → candidates à l'archivage : du plafond qui se libère
     (si elles s'accumulent, l'auto-archivage de l'équipe est probablement inactif)
   2 sans priorité                  → à prioriser (raccourci P) — sinon Later par défaut
   1 started dormante (> un cycle)  → à finir, re-prioriser ou rendre au backlog
   1 issue du miroir sans contrepartie fichier → candidate à l'archivage, NON touchée

→ Rien n'a été écrit, ni dans les fichiers, ni chez Linear.
```
</report>

## Ce que tu NE fais PAS

- Tu n'écris **rien** dans le dépôt : ni fichier, ni commit. C'est mécanique —
  tu n'en as pas les outils.
- Tu n'écris **rien** chez Linear : aucune mutation, donc ni archiver, ni prioriser, ni
  transitionner, ni corriger un titre. Une candidate à l'archivage **reste une candidate**.
- Tu ne pousses **rien** — le push est `/scd-sdd:linear`, et tu ne le déclenches pas non plus.
- Tu ne persistes **pas** la vue : pas de fichier de rapport, pas de cache d'identifiants — un
  identifiant Linear affiché ici ne se retrouve dans aucun fichier du dépôt.
- Tu ne touches pas aux issues **sans marqueur** : elles appartiennent à l'humain et n'entrent dans
  aucun contrôle.
- Tu ne re-priorises pas et tu n'inventes pas d'arbitrage : Now/Next/Later est une **lecture** du
  champ `priority`, jamais une recommandation de le changer.
- Tu ne bloques ni ne conditionnes aucune phase : aucun `status` ne te réclame, aucune gate ne
  t'attend.
- Tu ne contournes pas une erreur d'API en devinant un autre nom de champ : tu la rapportes. C'est
  d'abord le signal que la référence a vieilli.

## Skill active

- `linear` — contrat du miroir : le marqueur, la propriété des champs, le sens unique, la doctrine
  du pilotage (« redescendre = écrire un fait Linear dans un fichier ; lire-et-rapporter est
  légal »). Charge `references/api.md` — les blocs `<auth>` et `<pilotage>` **seuls**, après la
  date en tête —, le seul bloc `<contrat>` de `references/linear-md.md`, et
  `references/pilotage.md` **intégralement**.

## À la fin

Affiche le rapport, puis les trois suites, dans cet ordre :

1. **Archiver et re-prioriser se font dans Linear** — les candidates du rapport, le raccourci `P`,
   les dormantes à trancher. Rien de tout ça ne passe par le dépôt, et le miroir n'y touchera pas.
2. **Rejoue `/scd-sdd:linear` quand les fichiers ont bougé** — un ticket terminé, une fiche archivée :
   c'est le push qui remet le miroir au niveau, jamais cette revue.
3. **Le travail s'implémente ici** — `/scd-sdd:run <ticket>`. Ce sont les cases cochées de le ticket
   qui bougeront l'état côté Linear, au push suivant.
