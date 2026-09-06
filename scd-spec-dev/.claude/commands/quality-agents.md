---
description: "Co-crée AVEC L'HUMAIN, une partie à la fois, un agent DÉDIÉ par check de la quality gate — porteur des instructions « comment traiter cette partie » propres au projet. Lit `.claude/quality.json` (la liste des checks), et pour chaque check écrit `<projet>/.claude/agents/quality-<checkId>.md` : un squelette FIXE (rôle mono-check, contexte frais, LECTURE SEULE, garde-fous, contrat de sortie JSON) + un bloc d'INSTRUCTIONS co-écrit avec l'humain et éditable à la main. Enregistre le nom de l'agent dans `quality.json`. Au run (phase 7½), chaque check en échec est routé vers SON agent dédié, qui remonte les points à traiter selon ses instructions ; à défaut, le générique `quality-advisor` prend le relais. Rejouable et idempotente : le bloc d'instructions édité par l'humain est PRÉSERVÉ, le squelette est révisé, les agents orphelins (check retiré de quality.json) sont signalés."
argument-hint: "[checkId] — vide = tous les checks ; un id = (re)faire ce seul agent"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
  - Bash(ls:*)
  - Bash(test:*)
  - Bash(cat:*)
---

## Ce que fait cette commande

`/scd-spec-dev:quality-agents` **crée avec toi un agent dédié par partie de la quality gate**. Là où
`quality-setup` pose *la liste* (`.claude/quality.json` — quels checks, quelle sévérité, quel
autofix), cette commande pose *le comment* : pour chaque check, un agent qui porte **tes** instructions
sur la façon de traiter cette partie, et qui au run **remonte les points à traiter** en les suivant.

Chaque agent est un **fichier du projet** (`<projet>/.claude/agents/quality-<checkId>.md`), que tu
peux relire et éditer à la main comme n'importe quel agent. Le plugin fixe le **squelette** (rôle,
outils en lecture seule, garde-fous, contrat de sortie) ; **toi** tu écris le **bloc d'instructions**.

## Ce qu'elle ne fait jamais

- **Elle n'invente pas de check.** Elle ne crée un agent que pour un check qui **existe** dans
  `.claude/quality.json`. Pas de `quality.json` → elle s'arrête et renvoie vers `/scd-spec-dev:quality-setup`.
- **Elle ne donne jamais `Edit` à l'agent généré.** Le squelette fixe les outils sur `Bash, Read,
  Grep, Glob` — **lecture seule**. Un agent dédié *diagnostique et propose*, il ne réécrit pas le
  code (c'est le `fix-applier`, sous triage, qui applique). Cette frontière n'est **pas** éditable.
- **Elle n'écrase pas tes instructions.** Au re-jeu, le bloc `QUALITY-AGENT:INSTRUCTIONS` que tu as
  édité est **préservé** ; seul le squelette (hors bloc) est révisé.

---

## Précondition — la liste d'abord

1. Lire `.claude/quality.json`.
   - **Absent/illisible** → s'arrêter : « Pose d'abord la liste avec `/scd-spec-dev:quality-setup`,
     puis reviens créer les agents. » Ne rien écrire.
   - **Présent** → en extraire `checks[]`. Si un `[checkId]` est passé en argument, ne traiter que
     celui-là ; sinon les traiter tous, un par un.
2. Glober `<projet>/.claude/agents/quality-*.md` — les agents déjà générés. Un agent dont le
   `checkId` n'est **plus** dans `checks[]` est un **orphelin** : le signaler à la fin (ne pas le
   supprimer sans confirmation).

## Le squelette FIXE de l'agent généré (le plugin le porte)

Chaque `quality-<checkId>.md` est écrit sur ce moule. Seul le bloc entre les marqueurs
`QUALITY-AGENT:INSTRUCTIONS` est co-écrit ; tout le reste est fixe.

```markdown
---
name: quality-<checkId>
description: Agent dédié de la quality gate pour le check « <checkId> ». Généré par /scd-spec-dev:quality-agents, POSSÉDÉ PAR LE PROJET. En contexte frais (n'a pas écrit le code), reçoit UN finding de ce check en échec, l'analyse SELON LES INSTRUCTIONS de sa partie et REMONTE les points à traiter — un correction_prompt chirurgical si une édition de code de production bornée résorbe le check, sinon applicable:false + reason. LECTURE SEULE : diagnostique et propose, n'édite rien (sa proposition passe par le triage puis le fix-applier). Jamais les tests/la config/quality.json ; jamais un escape-hatch.
tools: Bash, Read, Grep, Glob
color: yellow
---

<objectif>
Tu es l'agent dédié au check **<checkId>** de la quality gate de ce projet — un seul check, le tien.
Tu reçois un échec de CE check et tu **remontes les points à traiter, selon les instructions
ci-dessous** (écrites pour ce projet, éditables à la main).

**Contrainte : LECTURE SEULE.** Tu diagnostiques et proposes ; tu n'édites aucun fichier.
Producteur ≠ vérificateur : ta proposition part au triage (`review-validator`) puis au `fix-applier`,
qui applique et re-vérifie. Tu n'es pas la dernière parole.
</objectif>

<protocole_entree>
Le prompt fournit : UN finding du `quality-analyzer` pour ton check (`checkId`, `severity`,
`measured`, `threshold`, `locations`, `evidence`), le BRIEF (`files`/`verifMode`/`criteres`/`context`),
les fichiers d'impl modifiés, le chemin du dépôt. La `cmd` exacte se lit dans `.claude/quality.json`.
</protocole_entree>

<!-- QUALITY-AGENT:INSTRUCTIONS:START — co-écrit avec l'humain, PRÉSERVÉ au re-jeu de /scd-spec-dev:quality-agents -->
## Comment traiter cette partie

<les instructions du projet pour CE check — voir §Co-création>
<!-- QUALITY-AGENT:INSTRUCTIONS:END -->

## Garde-fous (fixes — non éditables)

- **Jamais un escape-hatch** (`@ts-ignore`, `as any`, `eslint-disable`, `# noqa`, `.skip(`,
  `--no-verify`) ni l'abaissement d'un seuil de config pour faire taire l'outil.
- **Jamais les tests, la config d'outillage, ni `quality.json`.** Ta proposition ne vise que du
  **code de production**.
- **Couverture / seuil de tests manqué** → `applicable:false` (résorber exigerait d'écrire des tests
  neufs, ce que le `fix-applier` ne fait jamais).
- **Refactor plus large que le ticket** → `applicable:false` (à porter en ADR / autre change).
- **Au doute → `applicable:false`.**

## Diagnostiquer, sur la sortie réelle

1. Relire l'entrée du check dans `.claude/quality.json` (`cmd`, `threshold`, intention).
2. Ancrer le diagnostic dans l'`evidence` capturée et dans le diff — lire les lignes citées, rejouer
   au besoin. Appliquer les INSTRUCTIONS ci-dessus (ce qu'il faut remonter, à quel niveau).
3. Décider `applicable:true` (→ `correction_prompt` autonome, chirurgical, dans le périmètre du
   ticket, suffisant à faire repasser le check) ou `applicable:false` (→ `reason`).

## Sortie (JSON) — contrat FIXE consommé par le run

{
  "checkId": "<checkId>",
  "applicable": true,
  "kind": "refactor | dedupe | lint | complexity | …",
  "severity": "blocking | advisory",
  "location": "src/…:L-L",
  "diagnosis": "…ancré dans la sortie réelle…",
  "correction_prompt": "…autonome, chirurgical — présent ssi applicable:true…",
  "reason": "…pourquoi non applicable — présent ssi applicable:false…",
  "evidence": "…extrait de sortie…"
}
```

## Co-création — une partie à la fois (le geste humain)

Pour **chaque** check à traiter, dans l'ordre :

1. **Poser le problème en prose, PUIS proposer** (jamais l'inverse). Rappeler ce que le check mesure
   (`id`, `cmd`, `threshold`, `severity`) et **proposer un jet d'instructions par défaut** adapté à sa
   nature — un point de départ concret, pas une page blanche :
   - **complexité** → « remonter chaque fonction au-dessus du seuil ; proposer une extraction de
     fonctions pures à comportement identique ; ne pas fusionner de responsabilités » ;
   - **duplication** → « remonter les blocs dupliqués ≥ N lignes ; proposer une extraction **dans le
     même module** ; ne pas créer d'abstraction transverse sans ADR » ;
   - **lint sans `--fix`** → « remonter chaque règle enfreinte avec la ligne ; proposer la correction
     idiomatique ; jamais désactiver la règle » ;
   - **couverture** → « lister les branches/chemins non couverts ; **ne rien proposer d'appliquer**
     (écrire des tests pour atteindre un chiffre est du reward hacking) → `applicable:false`, remonter
     à l'humain » ;
   - **typecheck / audit sécu** → adapter selon ce que le projet attend.
2. **Faire arbitrer** — via `AskUserQuestion` et/ou échange en prose — les points qui changent le
   comportement de l'agent : que **remonter**, que **proposer d'appliquer** vs **laisser à l'humain**,
   les garde-fous propres au projet, le niveau de détail. L'humain édite le jet librement.
3. Le texte retenu devient le contenu du bloc `QUALITY-AGENT:INSTRUCTIONS`.

## Écrire — un agent par check

- **Pose** (`quality-<checkId>.md` absent) : `Write` le fichier complet depuis le squelette, avec le
  bloc d'instructions co-écrit et `<checkId>` substitué partout (`name`, description, objectif, sortie).
- **Entretien** (le fichier existe) : `Edit` **le seul bloc** `QUALITY-AGENT:INSTRUCTIONS` avec le
  nouveau texte si l'humain l'a révisé ; **préserver** le bloc existant s'il ne veut rien changer ;
  réviser le squelette hors bloc uniquement si le moule du plugin a évolué. Ne jamais réécrire tout
  le fichier à l'aveugle.
- **Nom** : `quality-<checkId>` en **kebab-case** — si un `id` de `quality.json` n'est pas un slug
  valide d'agent, en dériver un slug sûr et le noter.

## Enregistrer le lien dans `quality.json`

Pour chaque check dont l'agent est posé, écrire dans son entrée de `.claude/quality.json` le champ
**`"agent": "quality-<checkId>"`** (l'aiguillage que le run consomme). `Edit` ciblé, sans toucher aux
`severity`/`threshold`/`autofix` saisis. Un check sans agent dédié n'a pas ce champ → le run le route
vers le générique `quality-advisor`.

## Rendre compte

- Agents [posés | entretenus] : la liste des `quality-<checkId>` écrits, et pour chacun si le bloc
  d'instructions a été co-écrit ou préservé ;
- **orphelins** signalés (un `quality-<x>.md` dont `x` n'est plus dans `quality.json`) — proposer de
  les retirer, ne pas le faire sans accord ;
- rappeler l'aiguillage : au run (**phase 7½**), un check en échec **non-autofixable** est routé vers
  son agent dédié (`quality.json.agent`), qui remonte les points à traiter selon ses instructions →
  **triage** (`review-validator`) → **`fix-applier`** (applique, re-vérifie) → **re-analyse** ; à
  défaut d'agent dédié, le générique `quality-advisor` prend le relais ;
- prochaine action : `/scd-spec-dev:run <NN>` — l'aiguillage s'appliquera.

> **Note de propriété.** Les `quality-<checkId>.md` sont **au projet** (tu les édites). Le plugin ne
> les livre pas : il fournit *cette commande* qui les écrit, le générique `quality-advisor` en repli,
> et le run qui les invoque. Leur frontière lecture-seule reste fixée par le squelette — un agent
> dédié ne peut pas devenir un ré-écriveur de code, même édité à la main.
