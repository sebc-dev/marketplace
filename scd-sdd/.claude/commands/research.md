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

- **Tu ne modifies aucun document du socle.** Ni `docs/stack.md`, ni un ADR, ni `CLAUDE.md`, ni
  une spec. La chaîne du cycle transforme un chiffre non vérifié en ADR immuable que `CLAUDE.md`
  interdit ensuite de contredire : c'est le *citation laundering*, et cette règle est le seul
  garde-fou. Tu rends une liste ; l'humain décide.
- **Ce qui n'est pas établi est isolé et nommé**, jamais fondu dans le reste : `[À VÉRIFIER]`,
  `[INCERTAIN]`, source unique non recoupée, éval interne non reproductible, préprint, contenu
  commercial. Isoler ne veut pas dire jeter — ça veut dire que ça ne descend pas dans un
  document que la suite du cycle traitera comme vrai.
- **La confiance verbalisée n'est pas une probabilité**, y compris celle que le rapport
  s'attribue à lui-même. C'est un signal de classement, systématiquement sur-confiant.
- **Tu ne lances aucune recherche toi-même** à l'aller : tu n'as ni `WebSearch` ni `WebFetch`. Tu
  composes un prompt, l'humain le joue dans Claude Desktop. Pour chercher en session, c'est
  `/scd-sdd:lookup`.
- **Un rapport n'est jamais mis à jour : il se refait**, sous une date neuve. La date du nom
  **est** le contrôle de fraîcheur, et un rapport n'est jamais renommé.
- **Aucun rétro-lien.** Tu n'ajoutes à aucun rapport la liste des décisions qu'il a servies : le
  lien existe déjà dans l'autre sens, et un rapport qui liste ses usages est un fichier qui
  croît.
- **Tu commites, `git add` scopé au seul fichier écrit.** Jamais le travail en vol autour — sans
  quoi `/scd-sdd:run` tombera plus tard en `blocked-dirty-tree`.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — EARS,
  gate, lot, ADR, invariant, advisory… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Définitions

- **Aller** : composer et écrire `docs/research/AAAA-MM-JJ-slug.prompt.md`. La session s'arrête
  là ; la recherche se joue ailleurs.
- **Retour** : classer `docs/research/AAAA-MM-JJ-slug.md` et le relire de manière critique. Peut
  arriver des jours plus tard, dans une autre session.
- **Actionnable** : une affirmation établie, qui répond à la décision nommée par la question, et
  que la phase en cours peut utiliser telle quelle. Tout le reste attend son tour.

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

3. **Charge `references/prompt-research.md`** du skill `research`. Elle est **datée en tête** :
   si l'état remonte à plus de six mois, dis-le à l'humain avant de composer et propose de
   revérifier les points marqués ⚠. Aucun chiffre de cette référence ne sort dans un document du
   socle.

4. **Compose le prompt** selon le gabarit à six blocs — question · périmètre · contraintes de
   sourcing · hypothèses concurrentes · format de rendu · ce qui ferait changer la
   recommandation. Le dernier bloc est celui qu'on oublie et le plus rentable : sans lui, la
   recommandation ne se révisera pas quand le contexte bougera. Relis contre le bloc
   `<completion>` de la référence, et vérifie qu'aucun déclencheur de sa table `<obsolete>` n'a
   glissé dans le prompt.

5. **Écris `docs/research/AAAA-MM-JJ-slug.prompt.md`** (date du jour, slug depuis la question ;
   crée `docs/research/` s'il manque), **affiche le prompt prêt à coller**, et annonce **ce que
   la recherche ne pourra pas atteindre** : paywalls, connexion, CAPTCHA, `robots.txt`, données
   privées. Avant, jamais après. Puis `git add <le prompt>` et
   `git commit -m "docs(research): prompt <slug>"`. **Stop** — la suite se passe dans Claude
   Desktop.

6. **Retour — classe le rapport.** Écris-le sous `docs/research/AAAA-MM-JJ-slug.md`, à la date
   **du jour de la recherche**, avec le même slug que son `.prompt.md` s'il existe. Un rapport
   déjà présent sous ce nom ne s'écrase pas : c'est une recherche neuve, donc un nom neuf.

7. **Relis de manière critique** — c'est la vraie valeur de cette moitié. Quatre passes, dans cet
   ordre :
   - **extrais ce qui est actionnable pour la phase en cours** — et nomme la phase ;
   - **isole ce qui ne se reprend pas comme acquis** : `[À VÉRIFIER]`, `[INCERTAIN]`, source
     unique non recoupée, éval interne, préprint, contenu commercial. Chaque item avec son motif,
     pas un simple étiquetage ;
   - **rappelle que la confiance verbalisée n'est pas une probabilité** ;
   - **contrôle les murs** : ce que le rapport dit avoir manqué faute d'accès est une limite du
     résultat, pas un détail de méthode.

8. **Charge le skill `exposition`** — **régime *options*** — et **rends la liste** (voir le bloc
   ci-dessous), puis **arrête-toi là**. Tu ne descends rien dans
   `docs/stack.md` ni dans un ADR : tu nommes la commande qui le ferait, l'humain la joue.

9. **Commite** : `git add <le rapport>` puis `git commit -m "docs(research): <slug>"`, scopé au
   seul fichier.

<report>
```
📄 Rapport classé — docs/research/2026-08-06-outillage-sca-node.md
   Prompt d'origine : 2026-08-06-outillage-sca-node.prompt.md · phase en cours : ci

Actionnable
  • osv-scanner couvre npm sur lockfile, sortie SARIF   [officiel · mesuré]
  • le scan doit porter sur le dépôt entier, pas le diff [officiel · rapporté]

Ne se reprend PAS comme acquis
  • « -60 % de faux positifs »        éval interne non reproductible par un tiers
  • le comparatif des 4 outils        contenu commercial, publié par l'un des 4
  • le seuil de sévérité conseillé    [INCERTAIN] dans le rapport lui-même

Rappel   Les niveaux de confiance du rapport classent, ils ne mesurent pas.
Murs     2 sources derrière connexion, non lues — le rapport le dit.

→ Rien n'a été modifié dans le socle. Ce qui doit descendre : /scd-sdd:ci (ou un ADR).
```
</report>

## Ce que tu NE fais PAS

- Tu ne modifies aucun document du socle, aucune spec, aucun `tasks.md` — même quand le rapport
  paraît trancher net. Tu n'ouvres pas non plus de candidat d'ADR à sa place.
- Tu ne lances aucune recherche web : tu n'en as pas les outils. C'est `/scd-sdd:lookup` en
  session, ou Claude Desktop pour le rapport.
- Tu n'écris aucune ligne de journal (voir ci-dessous).
- Tu ne mets à jour, ne renommes ni ne supprimes un rapport existant, et tu n'y ajoutes aucun
  rétro-lien vers les décisions qu'il a servies.
- Tu ne réécris pas le rapport revenu pour l'améliorer : tu le classes tel quel et tu le
  qualifies à côté. Un rapport corrigé n'est plus une source.
- Tu ne présentes pas un niveau de confiance comme une probabilité, ni un chiffre d'éval interne
  comme un résultat répliqué.
- Tu ne commites rien d'autre que le fichier que tu viens d'écrire.

## Consigne au journal

**Aucune.** Tu ne joues aucune phase du cycle, et le fait que tu produis est le **rapport
lui-même** — l'écrire aussi au journal mettrait la même information à deux endroits et ferait
recroître un fichier partagé. C'est de nature, pas un oubli.

La chronologie des recherches est déjà portée par les **noms datés** de `docs/research/`, qui se
trient tout seuls. Le contrôle négatif qui prouve que la règle a tenu : après l'import d'un
rapport, `docs/journal/socle.md` n'a **pas** grossi.

## Skill active

- `research` — contrat de `docs/research/` : nommage daté, la date comme contrôle de fraîcheur,
  l'absence de rétro-lien, et la relecture critique. Charge `references/prompt-research.md` — le
  gabarit à six blocs, la table `<obsolete>`, les caveats de fiabilité, le bloc `<completion>` —
  à l'aller pour composer, au retour pour relire.
- `exposition` — **régime *options***, chargé à l'étape 8, pour rendre la liste. Aucune
  `references/`.

**`project-docs` n'est pas chargé, et c'est volontaire.** Nommer la phase que le rapport doit
servir ne demande pas de le charger : aucun document du socle ne sort d'ici, et charger le skill
qui les écrit rendrait tentant de le faire.

## À la fin

**À l'aller** : affiche le chemin du `.prompt.md`, le prompt prêt à coller, et les murs annoncés.
Puis : « Colle ce prompt dans Claude Research (Claude Desktop). Au retour, enregistre la réponse
et joue `/scd-sdd:research docs/research/<AAAA-MM-JJ-slug>.md` pour la classer et la relire. »

**Au retour** : rappelle en une ligne que **rien n'a été modifié dans le socle**, et nomme la
commande qui ferait descendre ce qui est actionnable — `/scd-sdd:stack`, `/scd-sdd:adr`,
`/scd-sdd:ci` ou `/scd-sdd:plan` selon la phase. **Tu ne la lances pas** : c'est la décision de
l'humain, et c'est tout l'intérêt de la règle.
