---
description: "Recherche approfondie en deux temps. Sans argument ou avec une question : compose un prompt Claude Research prêt à coller dans Claude Desktop, selon les bonnes pratiques du skill research, et l'écrit dans docs/research/. Avec le chemin d'un rapport revenu de Claude Desktop : le classe, en extrait ce qui est actionnable, et signale ce qu'il ne faut PAS reprendre comme acquis."
argument-hint: "[question à rechercher | chemin d'un rapport à classer]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
  - Bash(ls *)
  - Bash(date *)
  - Bash(git add *)
  - Bash(git commit *)
---

## Contexte

Certaines questions ne se répondent pas en session : elles demandent de lire vingt sources, de
départager des hypothèses, et de rendre un document qu'on relira dans six mois. Elles se
sous-traitent à Claude Research, dans Claude Desktop — et l'aller-retour est le moment où tout
peut se perdre.

Tu tiens les **deux bouts** de cet aller-retour. À l'aller, tu composes un prompt qui cadre la
question, impose ses contraintes de sourcing et dit ce qui ferait changer la recommandation. Au
retour, tu classes le rapport **et tu le relis de manière critique** — c'est la moitié qui
compte, parce qu'un rapport qui revient n'est pas un acquis : c'est une source de plus, et le
fait qu'il ait été produit pour nous ne le rend pas plus vrai.

Ratio : 50% humain / 50% AI (l'humain cadre la question, lance la recherche dans Claude Desktop
et décide seul de ce qui descend dans le socle ; tu composes, tu classes et tu qualifies).

## Règles absolues

- **Tu ne modifies aucun document du socle.** Ni `docs/technique.md`, ni un ADR, ni `CLAUDE.md`, ni
  une spec. Tu rends une liste ; l'humain décide. C'est la règle centrale du skill `research`, et
  la seule qui reste écrite ici alors qu'elle est chargée : tu es la commande du couple qui a
  `Write` et `Edit`, donc la seule qui pourrait l'enfreindre. Le mécanisme qu'elle bloque — le
  *citation laundering* — est au skill.
- **Tu appliques le skill `research` et sa référence, tu ne les résumes pas.** Le contrat de
  `docs/research/` — nommage, péremption, absence de rétro-lien —, la relecture critique et ses
  passes, les caveats de fiabilité : tout est **chargé** (voir `## Skill active`), donc absent
  d'ici. Le `## Processus` dit à quel moment tu appliques quoi, jamais ce que ça dit.
- **Tu ne lances aucune recherche toi-même** à l'aller : tu n'as ni `WebSearch` ni `WebFetch`. Tu
  composes un prompt, l'humain le joue dans Claude Desktop. Pour chercher en session, c'est
  `/scd-sdd:lookup`.
- **Tu commites, `git add` scopé au seul fichier écrit.** Jamais le travail en vol autour — sans
  quoi `/scd-sdd:run` tombera plus tard en `blocked-dirty-tree`.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — EARS,
  ticket, ADR, invariant, garde, advisory… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Définitions

- **Aller** : composer et écrire `docs/research/AAAA-MM-JJ-slug.prompt.md`. La session s'arrête
  là ; la recherche se joue ailleurs.
- **Retour** : classer `docs/research/AAAA-MM-JJ-slug.md` et le relire de manière critique. Peut
  arriver des jours plus tard, dans une autre session.

*(**Actionnable** n'est pas défini ici : c'est la première passe de relecture du skill, et son
référent y est écrit — la décision servie, pas la phase.)*

## Processus

1. **Détermine le temps** — ce n'est pas un mode, c'est le bout de l'aller-retour où tu te
   trouves :
   - l'argument est un **chemin existant** (ou un fragment qui résout vers un fichier de
     `docs/research/`) → **retour**, va en 6 ;
   - l'argument est une **question**, ou il n'y a pas d'argument → **aller**, continue.

   Sans argument, demande la question. Ambigu — un argument qui pourrait être les deux —
   `AskUserQuestion`, jamais une supposition : les deux temps n'écrivent pas le même fichier.

2. **Cadre la question** (`AskUserQuestion`, deux ou trois questions, pas plus). Trois choses, et
   ce sont elles qui décident de la qualité du rapport : la **décision** que la réponse doit
   servir, le **périmètre et ses exclusions** — sans exclusions écrites, une recherche s'étale —
   et **l'horizon** : à quelle date la réponse doit être vraie.

3. **Charge les blocs d'aller de `references/prompt-research.md`** — `<peremption>` d'abord, puis
   `<obsolete>`, `<stable>`, `<gabarit>`, `<completion>`. **Pas `<caveats>`** : il sert au retour.
   Applique `<peremption>` avant de te servir du reste — c'est lui qui dit ce que la date du
   fichier impose, et il est le seul bloc que les deux temps ont en commun.

4. **Compose le prompt** selon le bloc `<gabarit>`, tous ses blocs renseignés — celui qu'on oublie
   est le dernier, et la référence dit pourquoi. Puis relis contre `<completion>`, et vérifie
   qu'aucun déclencheur de la table `<obsolete>` n'a glissé dans le prompt.

5. **Écris `docs/research/AAAA-MM-JJ-slug.prompt.md`** (date du jour, slug depuis la question ;
   crée `docs/research/` s'il manque), **affiche le prompt prêt à coller**, et annonce **ce que
   la recherche ne pourra pas atteindre** — les murs sont énumérés au skill. Avant, jamais après.
   Puis `git add <le prompt>` et `git commit -m "docs(research): prompt <slug>"`. **Stop** — la
   suite se passe dans Claude Desktop.

6. **Retour — classe le rapport.** Écris-le sous `docs/research/AAAA-MM-JJ-slug.md`, avec le même
   slug que son `.prompt.md` s'il existe, en appliquant le contrat de nommage du skill. Un rapport
   déjà présent sous ce nom **ne s'écrase pas** : c'est une recherche neuve, donc un nom neuf.
   Charge maintenant les blocs de retour de la référence — `<peremption>` et `<caveats>` ; tu n'as
   plus besoin du gabarit.

7. **Relis de manière critique** — c'est la vraie valeur de cette moitié. Applique les **quatre
   passes** du § *Reprendre un résultat* du skill, dans leur ordre, en t'aidant de `<caveats>`.
   Trois choses que cette commande ajoute, et elles seules :
   - **nomme la décision que tu sers** — la phase en cours si la recherche en sert une, sinon la
     décision que le `## Question` du prompt nommait. Si aucune n'est nommable, dis-le : sans
     référent, la première passe n'a pas de critère ;
   - **donne à chaque item isolé son motif**, pas un simple étiquetage ;
   - **traite les murs comme une limite du résultat**, pas comme un détail de méthode : ce que le
     rapport dit avoir manqué faute d'accès borne ce qu'on peut en reprendre.

8. **Charge le skill `exposition`** — **régime *options*** — et **rends la liste** (voir le bloc
   ci-dessous), puis **arrête-toi là**. Tu ne descends rien dans
   `docs/technique.md` ni dans un ADR : tu nommes la commande qui le ferait, l'humain la joue.

9. **Commite** : `git add <le rapport>` puis `git commit -m "docs(research): <slug>"`, scopé au
   seul fichier.

<report>
```
📄 Rapport classé — docs/research/2026-08-06-outillage-sca-node.md
   Prompt d'origine : 2026-08-06-outillage-sca-node.prompt.md
   Décision servie  : phase ci — quel outil de SCA pour cet écosystème

Actionnable
  • osv-scanner couvre npm sur lockfile, sortie SARIF   [officiel · mesuré]
  • le scan doit porter sur le dépôt entier, pas le diff [officiel · rapporté]

Ne se reprend PAS comme acquis
  • « -60 % de faux positifs »        éval interne non reproductible par un tiers
  • le comparatif des 4 outils        source `commercial`, publiée par l'un des 4
  • le seuil de sévérité conseillé    [INCERTAIN] dans le rapport lui-même

Rappel   Les niveaux de confiance du rapport classent, ils ne mesurent pas.
Murs     2 sources derrière connexion, non lues — le rapport le dit.

→ Rien n'a été modifié dans le socle. Ce qui doit descendre : /scd-sdd:adr (ou /scd-sdd:guards).
```

Hors de toute phase, la ligne `Décision servie` porte la décision que le prompt nommait, et la
dernière ligne devient : `→ Rien n'a été modifié. Aucune commande à jouer : la décision est hors
cycle.` Une recherche sans décision nommable l'écrit telle quelle — jamais une phase inventée.
</report>

## Ce que tu NE fais PAS

- Tu ne modifies aucun document du socle, aucune spec, aucun ticket — même quand le rapport
  paraît trancher net. Tu n'ouvres pas non plus de candidat d'ADR à sa place.
- Tu ne lances aucune recherche web : tu n'en as pas les outils. C'est `/scd-sdd:lookup` en
  session, ou Claude Desktop pour le rapport.
- Tu ne mets à jour, ne renommes ni ne supprimes un rapport existant, et tu n'y ajoutes aucun
  rétro-lien vers les décisions qu'il a servies.
- Tu ne réécris pas le rapport revenu pour l'améliorer : tu le classes tel quel et tu le
  qualifies à côté. Un rapport corrigé n'est plus une source.
- Tu ne commites rien d'autre que le fichier que tu viens d'écrire.

## Skill active

- `research` — et c'est l'inventaire de ce qui n'est **pas** écrit dans ce fichier : le contrat de
  `docs/research/` (nommage daté, la date comme contrôle de fraîcheur, l'absence de rétro-lien),
  les deux vocabulaires fermés, le *citation laundering*, les murs, et les quatre passes de la
  relecture critique avec le référent de la première.
- `references/prompt-research.md` — **datée en tête** et chargée **bloc par bloc**, jamais en
  entier : `<peremption>` `<obsolete>` `<stable>` `<gabarit>` `<completion>` à l'**aller**
  (étape 3), `<peremption>` `<caveats>` au **retour** (étape 6). `<peremption>` est le seul
  commun ; aucun chiffre de ce fichier ne sort dans un document du socle.
- `exposition` — **régime *options***, chargé à l'étape 8, pour rendre la liste. Aucune
  `references/`.

**`project-docs` n'est pas chargé, et c'est volontaire.** Nommer la décision — ou la phase — que le
rapport doit servir ne demande pas de le charger : aucun document du socle ne sort d'ici, et charger
le skill qui les écrit rendrait tentant de le faire.

## À la fin

**À l'aller** : affiche le chemin du `.prompt.md`, le prompt prêt à coller, et les murs annoncés.
Puis : « Colle ce prompt dans Claude Research (Claude Desktop). Au retour, enregistre la réponse
et joue `/scd-sdd:research docs/research/<AAAA-MM-JJ-slug>.md` pour la classer et la relire. »

**Au retour** : rappelle en une ligne que **rien n'a été modifié dans le socle**, et nomme la
commande qui ferait descendre ce qui est actionnable — `/scd-sdd:adr`, `/scd-sdd:guards` ou
`/scd-sdd:spec` selon ce qui est servi. **Tu ne la lances pas** : c'est la décision
de l'humain, et c'est tout l'intérêt de la règle.

Si la recherche ne servait **aucune phase** — le cas le plus fréquent —, ne nomme aucune de ces
quatre commandes : dis que la décision est hors cycle et rends la main. Proposer une phase au
hasard ferait descendre le rapport quelque part, ce qui est exactement l'interdit.
