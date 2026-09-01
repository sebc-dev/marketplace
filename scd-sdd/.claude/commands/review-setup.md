---
description: "Pose et entretient `.claude/review.json` — la liste, possédée par le projet, des skills et serveurs MCP pertinents pour la review d'implémentation. Constate le dépôt (skills locaux, `.mcp.json`, stack), fait cocher et annoter les candidats par l'humain, écrit le fichier, puis propose de le protéger via les gardes. La liste fait autorité dans le dossier `aids` que `review-context` sert aux six reviewers. Rejouable et idempotente : une seconde passe met la liste à jour sans écraser les `why`/`relevantTo` saisis."
argument-hint: "(aucun — constate, puis propose)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
---

## Contexte

La phase review du cycle tient compte des **skills et serveurs MCP pertinents** : `review-context`
résout une rubrique `aids` (skills/MCP à considérer) et la sert, telle quelle, aux six reviewers en
contexte frais. Cette rubrique combine deux sources — l'**auto-détection** de ce qui est disponible,
et la **liste que le projet déclare**, qui **fait autorité**. Tu poses et tu entretiens cette liste.

**Ce que tu écris est une liste, pas un mécanisme.** Le mécanisme — l'auto-détection, la distillation
d'un skill, la citation d'un MCP en pointeur — est livré par le plugin et identique partout
(§D41). La **liste** de ce qui compte pour la review appartient au projet, et à personne d'autre. Tu
la fais dire, tu ne la devines pas.

Elle vit dans **`.claude/review.json`** — hors du `CLAUDE.md` chargé à chaque session, parce qu'elle
ne sert qu'à la review. Le fichier est **opt-in** : absent, `review-context` retombe sur la seule
auto-détection, en mode dégradé.

Ratio : 40% humain / 60% AI (l'humain coche et annote la pertinence, tu constates et tu écris).

## Règles absolues

- **Tu ne devines aucune pertinence.** Chaque entrée vient soit d'un fichier que tu as **vu sur le
  disque** — un `SKILL.md` local, un serveur de `.mcp.json` —, soit d'une saisie explicite de
  l'humain. Un candidat plausible mais inventé fait du bruit dans le raisonnement de six reviewers.
- **La liste est du projet, pas de toi.** Tu proposes les candidats détectés ; l'humain coche ce qui
  compte pour SA review. Rien ne s'inscrit sans son arbitrage.
- **Un skill se distille, un MCP se pointe.** Tu n'as pas les outils MCP, et `review-context` non
  plus : pour un serveur MCP tu captures de **quoi** il fait autorité (et son autofixer), en
  pointeur — jamais son contenu. Un skill local, lui, sera distillé plus tard par `review-context`.
- **Tu ne protèges pas `review.json` toi-même.** `.claude/guards.json` se protège lui-même : un agent
  ne peut pas l'éditer. Tu **rends** la recommandation — ajouter `.claude/review.json` aux chemins
  protégés — et tu renvoies vers `/scd-sdd:guards`, qui possède ce fichier.
- **L'entretien ne détruit pas l'acquis.** À la seconde passe, tu proposes les écarts (skill
  nouvellement installé et non listé, MCP démonté encore listé) mais tu **ne réécris jamais** un
  `why` ou un `relevantTo` déjà saisi sans le dire. Un retrait passe par une question, pas en silence.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans son
  enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — dossier,
  rubrique `aids`, pointeur, distillation, chemin protégé, opt-in… — reçoit une glose d'**une ligne**,
  entre parenthèses ou entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que
  l'humain emploie le terme lui-même**.
- **Un ID se cite avec son intitulé** à sa première mention — « le skill `flutter-widgets`
  (composition de widgets) », jamais le nom nu. La règle vaut pour tout skill, serveur ou dimension
  que tu emploies, y compris ceux que le projet vient de créer et que le plugin ne connaît pas.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Définitions

- **`aids`** — la rubrique du dossier de review que `review-context` sert aux reviewers :
  `{ skills[], mcp[] }`. `review.json` en est la source qui **fait autorité**.
- **`relevantTo`** — les dimensions de review qu'une entrée concerne, sous-ensemble de
  `architecture · cleanliness · conventions · coverage · security · error-handling` ; vide = toutes.
- **`source`** — `projet` (issu de `review.json`, fait autorité) ou `auto` (auto-détecté, non
  confirmé). Ce que tu écris ici est toujours `projet` ; l'auto-détection en session ajoute le reste.

## Processus

1. **Charge le bloc `<dossier>`** de `references/review-dimensions.md` du skill `implement` (voir
   `## Skill active`) — le schéma d'`aids` et sa discipline. Ce **bloc seul**, jamais une dimension
   ni `<severity>`/`<triage>` : tu poses la liste, tu ne juges pas. Communique en français.

2. **Constate l'existant, avant toute proposition.**
   - `.claude/review.json` — présent ? lisible ? Si oui, **cette passe est un entretien**, pas une
     pose : tu compares l'existant au disque et tu proposes les écarts.
   - `.claude/guards.json` — présent ? (il décide de la recommandation de protection, étape 6).
   - `.mcp.json` — présent ? quels serveurs y sont déclarés ?

3. **Dérive les candidats du disque**, dans cet ordre, en restant conservateur :
   - **skills locaux** — `.claude/skills/*/SKILL.md` : lis `name` et `description` de chacun.
   - **serveurs MCP** — les serveurs de `.mcp.json` (et, si l'humain les mentionne, ceux montés hors
     dépôt — tu ne les vois pas, tu les inscris sur sa parole).
   - **stack** — le langage et les frameworks déduits des manifestes (`package.json`, `Cargo.toml`,
     `pubspec.yaml`…) et des extensions du dépôt : ce qui oriente quelles dimensions comptent.
   ⚠️ **Un candidat douteux se propose comme incertain, jamais comme évident.** La pertinence d'un
   skill pour la review ne se déduit pas de sa seule présence sur le disque.

4. **Présente les candidats et fais arbitrer** par `AskUserQuestion`, le problème posé d'abord. Pour
   chaque candidat retenu, fais préciser :
   - `relevantTo` — quelles dimensions il concerne ;
   - `why` — en une ligne, pourquoi un reviewer doit le considérer ;
   - pour un **MCP** : `authoritativeFor` (de quoi il fait autorité) et `autofixer` (son outil
     d'autofix, s'il en a un). **Jamais** de contenu distillé : c'est un pointeur.

5. **En entretien, montre les écarts** et ne touche pas à l'acquis sans le dire : un skill nouveau non
   listé → propose de l'ajouter ; un skill supprimé ou un MCP démonté encore listé → propose de le
   retirer ; les `why`/`relevantTo` déjà saisis restent, sauf demande explicite.

6. **Écris `.claude/review.json`** sur le schéma du bloc `<dossier>` — `{ skills: [...], mcp: [...] }`,
   avec les seules entrées approuvées. À la pose, `Write` ; en entretien, `Edit` ciblés.

7. **Rends la recommandation de protection**, et **ne l'applique pas** : `.claude/review.json` décide
   de la pertinence de la review, un agent en plein run ne doit pas pouvoir se l'amender. Comme
   `guards.json` se protège lui-même et t'interdit de l'éditer, tu **rends** la ligne à ajouter à sa
   liste `protected` et tu renvoies vers `/scd-sdd:guards`. Si `guards.json` n'existe pas, dis-le et
   renvoie vers `/scd-sdd:guards` pour poser les gardes d'abord.

## Ce que tu NE fais PAS

- Tu **n'interroges aucun serveur MCP** : tu n'en as pas les outils, et l'exécuter en review serait un
  autre chantier. Tu cites de quoi il fait autorité, tu ne distilles pas son contenu.
- Tu **n'édites pas `.claude/guards.json`** — il se protège lui-même ; tu rends la recommandation et
  renvoies vers `/scd-sdd:guards`.
- Tu **ne devines aucune pertinence** — sans candidat sur disque ni saisie de l'humain, rien ne
  s'inscrit.
- Tu **n'écris aucun document du socle** et **ne joues aucune** phase ni review. Tu poses une liste,
  tu ne juges aucun diff.
- Tu **ne supprimes jamais** un fichier, et tu ne réécris pas un `why`/`relevantTo` saisi sans le dire.

<report>

```
## review.json — [posé | entretenu]

Fichier      : .claude/review.json [écrit | mis à jour] · [N] skill(s) · [M] MCP
Protection   : [déjà dans guards.json · À AJOUTER (voir ci-dessous) · pas de guards.json → /scd-sdd:guards]

### Skills retenus
| name | relevantTo | why |
|---|---|---|
| … | … | … |

### MCP retenus (pointeurs — jamais interrogés)
| server | authoritativeFor | autofixer |
|---|---|---|
| … | … | … |

### Écarts (entretien seulement)
[skill nouveau non listé · MCP démonté encore listé · — aucun]

### À ajouter à guards.json (protected)
".claude/review.json"   // rejoue /scd-sdd:guards, ou ajoute-la à la main
[ou « déjà protégé » / « pas de guards.json — pose les gardes d'abord »]
```

</report>

## Skill active

Skill `implement` — référence `references/review-dimensions.md`, bloc **`<dossier>` seul** (le schéma
d'`aids` et sa discipline). **Pas** les dimensions, **pas** `<severity>` ni `<triage>` : tu poses la
liste, tu ne juges pas.

## À la fin

- `review.json` écrit et la protection reste à poser → *« La liste est posée. Protège-la :
  `/scd-sdd:guards` (ajoute `.claude/review.json` aux chemins protégés), puis commite. »*
- `guards.json` absent → *« La liste est posée, mais rien ne la protège encore :
  `/scd-sdd:guards` pour poser les gardes et y inscrire `.claude/review.json`. »*
- Tout est en place → *« La review tiendra compte de cette liste au prochain `/scd-sdd:run NNN NN`. »*
