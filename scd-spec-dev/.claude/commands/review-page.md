---
description: "La PAGE DE RELECTURE, hors du cycle run : rend un diff donné (un ticket `<change> NN`, un range git, une PR, la branche courante, ou l'arbre de travail) en une page où chaque fichier porte son diff avec basculement vers le fichier complet, la narration par fichier composée par `pr-describer`, les schémas LikeC4 et le graphe d'impact — pensée pour relire sur un téléphone —, puis la publie en artefact avec son `state.json` (cases « vu », notes ancrées à la ligne, verdict). `notes <URL>` fait le chemin inverse : elle relit la relecture posée sur la page, imprime le compte-rendu et propose de le poster en `gh pr review`. LECTURE SEULE sur le code : elle n'écrit aucun code, n'applique aucune note et n'ouvre aucune PR. Complète /scd-spec-dev:run, dont l'étape 6bis publie la même page pour un ticket qu'il vient d'implémenter."
argument-hint: "[<change> NN | <range git> | #PR | rien] | notes <URL artefact>"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Task
  - Write
  - Bash(openspec:*)
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git status *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git rev-parse *)
  - Bash(git fetch *)
  - Bash(ls *)
  - Bash(find *)
  - Bash(grep *)
  - Bash(echo *)
  - Bash(tr *)
  - Bash(mkdir *)
  - Bash(node *)
  - Bash(cat *)
  - Bash(gh pr view *)
  - Bash(gh pr comment *)
  - Bash(gh pr review *)
  - Bash(glab mr note *)
  - Artifact
  - AskUserQuestion
---

## Ce que fait cette commande

Deux verbes, et deux seulement.

- **Rendre** la page de relecture d'un diff **déjà écrit** — un ticket, un range, une PR, la branche
  courante, l'arbre de travail —, hors du cycle `run` : le diff de chaque fichier avec un
  basculement vers le fichier complet, la narration par fichier du `pr-describer`, les schémas
  LikeC4, le graphe d'impact, et un rendu qui tient sur un téléphone. La page est publiée en
  **artefact**, avec son `state.json` : l'humain y coche les fichiers vus, annote une ligne, rend un
  verdict, et tout cela **revient**.
- **Relire** (`notes <URL>`) la relecture faite sur une page déjà publiée : lire son `state.json`,
  imprimer le compte-rendu, et proposer de le poster en `gh pr review`.

C'est le pendant hors run de l'**étape 6bis** de `/scd-spec-dev:run` — même script, même manifeste,
même publication. Ce que `run` fait pour un ticket qu'il vient d'implémenter, cette commande le fait
pour n'importe quel diff.

**La page MONTRE, elle ne juge pas.** Elle ne produit aucune sévérité, aucun finding : les
annotations d'un diff viennent du triage de la review (`review.applied` / `review.rejected`), et
**hors du cycle `run` il n'y en a pas** — la page est alors le diff, la narration et les schémas,
rien d'autre. Pour un jugement, c'est `/scd-spec-dev:review`, qui est une autre commande.

Ratio : ~30 % humain / 70 % IA — l'IA rend et publie, l'humain **lit, coche, annote et tranche** ;
c'est lui qui fait la relecture, la page n'est que le support.

## Ce qu'elle ne fait JAMAIS

- **Elle n'écrit aucun code.** Ni correctif, ni test, ni commit. Elle lance un script et publie un
  fichier.
- **Elle n'applique aucune note.** `--apply` — transformer les notes de type `changement` en
  findings et les faire appliquer — est **différé** (lot LR3b) : appliquer une note humaine hors du
  run demande une branche checkoutée, une re-vérification et un push, donc un mini-workflow, pas un
  `Task` lancé depuis une commande. Aujourd'hui, une note s'applique **à la main** ou par un
  **nouveau ticket**.
- **Elle n'ouvre, ne pousse et ne merge aucune PR**, ne crée aucune branche, ne coche aucun critère.
  Elle peut **commenter** une PR existante (le lien de la page) et y **poster une review**
  (`notes`) — jamais plus.
- **Elle ne juge rien.** Aucun reviewer n'est lancé ; `review.applied` et `review.rejected` du
  manifeste restent **vides**.
- **Elle ne lit pas les diffs elle-même.** Comme à l'étape 6bis de `run`, la règle tient : le diff
  est l'affaire du script, la narration celle du `pr-describer`.

---

# Rendu — la page

## Étape 1 — Résoudre le diff cible

Selon `$ARGUMENTS` (si le premier mot est `notes`, saute tout ce bloc et va à la section
**`notes <URL>`**) :

- **`<change> NN`** → le ticket : sa branche `impl/<slug>-NN` contre sa base. Résous le slug par
  `ls openspec/changes/<x>/tickets/NN-*.md`. La base est `git merge-base <défaut> impl/<slug>-NN` ;
  si le ticket porte un `**Bloqué par :**`, sa base réelle est la branche du ticket bloquant (la
  résolution est celle du skill `implement`). `changeDir` et `ticket` sont connus : ils iront au
  manifeste.
- **`<range git>`** → `A...B` (trois points) : `--base "$(git merge-base A B)"`, `--head B`.
  `A..B` (deux points) : `--base A`, `--head B`. Le script attend **toujours** une base déjà
  résolue — il joue un range à deux points.
- **`#PR`** → `gh pr view <n> --json url,headRefName,baseRefName` (ou `glab`). Head =
  `headRefName` (`git fetch origin <headRefName>` si la branche manque localement), base =
  `git merge-base <baseRefName> <headRefName>`, et l'URL descend en `--pr`.
- **Rien** → la branche courante contre la branche par défaut
  (`git symbolic-ref refs/remotes/origin/HEAD` → défaut) : `--base "$(git merge-base <défaut> HEAD)"`,
  `--head <branche courante>`.

**Le cas `WORKTREE`.** Il ne se pose que quand la tête résolue **est la branche checkoutée** (cas
`rien`, ou un ticket dont la branche est celle du checkout) : si `git status --porcelain` n'est pas
vide, l'arbre porte des changements non commités que le range ne verra pas. **Demande**
(`AskUserQuestion`) : relire l'**arbre de travail** (`--head WORKTREE`, base = la base résolue
ci-dessus) ou le **range commité** tel quel. Ne décide pas seul — ce sont deux relectures
différentes. En `WORKTREE`, le script compare la base à l'arbre et ajoute les fichiers non suivis
(`--others --exclude-standard`) ; il ne mute jamais l'index et ne voit pas les fichiers ignorés.

Ambigu ou vide → `AskUserQuestion`. Communique en français.

**Le `<slug>`** — le nom des fichiers de travail, et l'identité de la page à travers les re-rendus :

| Cible | `<slug>` |
|---|---|
| ticket / branche | le nom de la branche, `/` remplacé par `-` (`impl/export-02` → `impl-export-02`) |
| range | `range-<base7>-<head7>` (les 7 premiers caractères des deux sha) |
| PR | `pr-<n>` |
| arbre de travail | le slug de la branche courante suffixé `-worktree` |

## Étape 2 — Résoudre le contexte (une fois)

- **Si un ticket est identifié** (cas `<change> NN`) : produis le BRIEF via l'agent `ticket-briefer`
  (`Task`) sur `openspec/changes/<x>/tickets/NN-*.md`, puis le dossier via `review-context`
  (`Task`) — c'est lui qui résout le **modèle LikeC4** touché par le diff (`model`, `modelFilesInDiff`)
  dont la page fait le graphe d'impact et les schémas. Tu en tires `verifMode`, les critères, et
  `model`.
- **Sinon** (range / PR / branche sans ticket) : **contexte léger** — la liste des fichiers,
  `CLAUDE.md`, `docs/architecture.md` s'il existe. Pas de BRIEF, `model: null`, `criteria: []` :
  sans ticket il n'y a ni critères ni matrice, et la page le dira.

## Étape 3 — La narration : `pr-describer` en mode page seule

Lance `pr-describer` par `Task`. Le prompt lui donne **exactement** :

- la **branche** (ou `WORKTREE` et le fait que la comparaison porte sur l'arbre de travail) et la
  **base** — le **sha** du merge-base, pas un nom de branche : ses `git diff --numstat` doivent
  porter sur le même range que le script ;
- le **chemin du dépôt** ;
- `model` et `modelFilesInDiff` s'ils existent (cas ticket), sinon dis explicitement qu'il n'y a pas
  de modèle — la couche 4bis et `diagrams[]` sont alors **omis**, pas inventés ;
- le **BRIEF** s'il existe (cas ticket) : la matrice critère → test → statut est alors due, avec un
  statut **« non vérifié »** dans toute la colonne — aucun run n'a joué, rien n'a été vérifié ici ;
- la consigne de **mode page seule** : « pas de décisions de triage, donc **pas de couche 5** ; sans
  BRIEF, **pas de matrice** non plus. Voir ta section *Mode page seule*. » Rends
  `{ title, body, page }`.

`page` est le livrable de ce mode : `readingOrder`, `files[]` couvrant **tous** les fichiers du diff,
`diagrams[]`. Le describer échoue ou rend un `page` vide → continue quand même : la page se rend sans
narration et **le dit** en Synthèse. Ce n'est jamais un motif d'arrêt.

## Étape 4 — Écris le manifeste

```bash
mkdir -p .claude/review-page
grep -qs -e 'review-page' -e '^\.claude/$' .gitignore || echo "ATTENTION : ajoute .claude/review-page/ à ton .gitignore (ou joue /scd-spec-dev:setup)"
```

Le dossier porte des artefacts **de session** — manifeste, HTML, `state.json`, URL — régénérés à
chaque rendu, qui n'ont rien à faire dans un commit. `/scd-spec-dev:setup` pose la ligne du
`.gitignore` ; hors d'un projet monté par `setup`, personne ne l'a fait : la ligne de `grep` ci-dessus
le dit, et tu le **signales** à l'humain sans éditer son `.gitignore` — ce n'est pas cette commande
qui le possède.

Puis `Write` de `.claude/review-page/<slug>.manifest.json` — le script le valide **strictement** et
échoue bruyamment (code 3, champ fautif nommé) plutôt que de rendre une page vide :

```json
{
  "schemaVersion": 1,
  "meta": { "title": "<titre rendu par pr-describer>", "ticket": "<NN ou omis>",
            "changeDir": "<openspec/changes/<x> ou omis>", "branch": "<branche>",
            "base": "<sha court de la base>", "verifMode": "<tdd|test|observé|aucun, ou omis>" },
  "body": "<le body rendu par pr-describer, INLINE>",
  "page": { "readingOrder": [], "files": [], "diagrams": [] },
  "criteria": [],
  "model": null,
  "modelFilesInDiff": [],
  "review": { "applied": [], "rejected": [], "qualityAdvisory": [],
              "preflightRepairs": [], "humanChecks": [] }
}
```

Trois points où cette commande diffère de l'étape 6bis de `run`, et qui se reperdraient :

- **`body` est INLINE.** `run` passe `--pr <url>` et le script lit le corps sur la PR. Ici, il n'y a
  le plus souvent **pas de PR** : le manifeste porte donc le `body` composé à l'étape 3. Si une PR
  existe bel et bien pour la branche, passe `--pr` comme `run` le fait — le corps de la PR l'emporte
  alors, et c'est ce qu'on veut (c'est le texte que le reviewer voit sur la forge).
- **`criteria[]`** : vide hors d'un ticket. Avec un BRIEF, dérive-le de ses critères —
  `{ "id": "SC-02a", "text": "<l'énoncé>", "test": null, "status": "non vérifié", "proof": null }`.
  **N'invente aucun statut** : rien n'a été exécuté par cette commande.
- **`review`** : les cinq seaux sont **vides**. Aucun reviewer n'a tourné, aucun triage n'a décidé ;
  la page n'aura donc aucune pastille de finding sur ses lignes. C'est correct, pas une lacune.

## Étape 5 — Rends la page et publie-la

**a. Résous le script** (le shell expand `${CLAUDE_PLUGIN_ROOT}`) — c'est le même snippet qu'à
l'étape 6bis de `run` :

```bash
SCRIPT="${CLAUDE_PLUGIN_ROOT}/scripts/scd-review-page.mjs"
[ -f "$SCRIPT" ] || SCRIPT="$(find "$HOME/.claude/plugins/cache" -path '*scd-spec-dev*/scd-review-page.mjs' 2>/dev/null | sort -V | tail -1)"
[ -f "$SCRIPT" ] || SCRIPT="$(find "$HOME/.claude/plugins" -path '*scd-spec-dev*/scd-review-page.mjs' 2>/dev/null | sort -V | tail -1)"
echo "$SCRIPT"
```

Rien trouvé → dis-le et arrête-toi : sans le script il n'y a pas de page, et il n'y a rien d'autre à
faire ici.

**b. Reporte l'état s'il y en a un.** `.claude/review-page/<slug>.url` existe (la page a déjà été
publiée pour cette cible) → `Artifact(action: "read_file", url: <url lue>, path: "state.json")`, et
passe le fichier obtenu en `--state` : les notes de la relecture précédente sont **conservées**,
celles dont la ligne a disparu du diff marquées `stale`.

**c. Rends la page.**

```bash
node "$SCRIPT" --manifest .claude/review-page/<slug>.manifest.json --repo . \
  --base <sha de base> --head <branche|WORKTREE> \
  -o .claude/review-page/<slug>
```

Ajoute `--pr <url>` **seulement** si une PR existe pour cette cible (cas `#PR`, ou
`gh pr view <branche> --json url` qui en trouve une) ; sans `--pr`, le `body` inline du manifeste
fait foi. Ajoute `--state <fichier>` si **b** en a rapporté un. Le script écrit trois fichiers —
`<slug>.html` (document complet, ouvrable hors ligne), `<slug>.artifact.html` (le fragment) et
`<slug>.state.json` — et rend un JSON sur `stdout` (`title`, `pageId`, `files`, `truncated`,
`notesCarried`, `notesStale`, `warnings`) : lis-le, c'est ce que tu rapportes à la fin. Un code ≠ 0
(2 usage · 3 manifeste invalide · 4 git en échec) est un **échec bruyant** : dis le message tel quel,
ne tente pas de rendre une page approchante.

**d. Publie.**

```
Artifact(file_path: ".claude/review-page/<slug>.artifact.html",
         files: { "state.json": ".claude/review-page/<slug>.state.json" },
         capabilities: { artifact: {} }, favicon: "🔍",
         description: "Page de relecture — <titre>")
```

- `<slug>.url` existe → ajoute `url: <url lue>` pour republier **au même endroit**, et **ne passe
  PAS `files`** : un `state.json` non passé est **conservé**, le passer écraserait la relecture en
  cours. Exception : tu as reporté un état par `--state` en **b** — alors passe `files`, le fichier
  rendu contient déjà les notes précédentes.
- Écris l'URL rendue dans `.claude/review-page/<slug>.url`.
- **L'outil `Artifact` n'est pas disponible** (SDK, clé API, surface sans artefacts) → donne le
  chemin local de `.claude/review-page/<slug>.html`, qui s'ouvre hors ligne et porte tout, et
  continue. Le mode local de la page garde les cases et les notes dans le navigateur
  (`localStorage`) et propose **Copier le compte-rendu** ; `notes <URL>` n'y sert alors à rien, et
  c'est dit dans le bandeau de la page.

**e. Signale-la sur la PR**, best-effort, **seulement** si une PR existe (une erreur ici ne bloque
rien) :

```bash
gh pr comment <url de la PR> --body "Page de relecture : <URL>"    # ou : glab mr note <url> -m "…"
```

---

# `notes <URL>` — relire la relecture

`$ARGUMENTS` commence par `notes` : le reste est l'**URL de l'artefact** de la page. Rien d'autre
n'est fait — ni rendu, ni publication.

**1. Lis l'état.**

```
Artifact(action: "read_file", url: "<URL>", path: "state.json")
```

Échec (URL invalide, artefact inaccessible, `state.json` absent parce que la page n'a jamais été
enregistrée) → dis-le et arrête-toi. **Ni verdict, ni note générale, ni note** → dis-le en une ligne
(« la page n'a pas encore été relue ») et arrête-toi : il n'y a rien à rapporter, et un compte-rendu
vide posté sur une PR est du bruit.

**2. Imprime le compte-rendu**, au même format que le bouton **Copier le compte-rendu** de la page —
c'est voulu : l'humain doit reconnaître son texte.

```markdown
## Relecture — <ticket · si présent><titre>

**Verdict :** Approuvé | Changements demandés | Commentaire | non rendu · <n>/<N> fichiers vus

<la note générale, telle quelle>

### Notes

**`src/export/header.ts`**
- `:42` **changement** — <le texte de la note> _(ligne disparue du diff)_ si `stale`
- `:58` **question** — <le texte de la note>
```

Les notes sont groupées par fichier, triées par ligne. `side` vaut `old` → écris-le
(`:42 (ancienne)`), sinon la ligne est celle du nouveau fichier. Le `type` est `question` ou
`changement`, tel quel : **tu ne le réinterprètes pas**, et tu n'ajoutes ni sévérité ni jugement — ce
sont les mots de l'humain.

**3. Propose de le poster** (`AskUserQuestion`) :

- **Poster en review sur la PR** — le verdict choisit le drapeau : `approve` → `--approve`,
  `request_changes` → `--request-changes`, tout le reste (y compris un verdict non rendu) →
  `--comment`. La PR se trouve par `gh pr view <branche> --json url`, où `<branche>` est le `pageId`
  du `state.json` — c'est le nom de la branche quand la page en avait une ; pour une page de range,
  `pageId` est le slug et il ne nomme aucune branche : **demande alors l'URL à l'humain**, ne devine
  pas. Le corps est le compte-rendu Markdown **entier**, passé **par fichier** pour qu'aucun
  caractère ne soit mangé par le shell :

  ```bash
  cat > /tmp/scd-review-notes.md <<'MD'
  <le compte-rendu, tel quel>
  MD
  gh pr review <url de la PR> --request-changes --body-file /tmp/scd-review-notes.md
  ```

  Le heredoc est **quoté** (`<<'MD'`) : le compte-rendu contient des backticks et des `$`.
- **Ne rien poster** — le compte-rendu imprimé est le livrable.

**Sans forge** (`gh` absent, aucune PR pour cette branche) : ne propose rien, le compte-rendu imprimé
**est** le livrable. Dis-le, ce n'est pas un échec.

**Et après ?** Les notes de type `changement` s'appliquent **à la main**, ou en ouvrant un nouveau
ticket qui les porte. `--apply` est **différé** (lot LR3b) — la commande ne l'a pas, et elle ne
bricole pas de substitut.

---

## Ce que tu NE fais PAS

- Tu ne modifies aucun fichier du projet : ni code, ni test, ni `.gitignore` (tu **signales** la ligne
  manquante). Les seules écritures sont sous `.claude/review-page/`, un dossier ignoré par git.
- Tu n'appliques aucune note, aucun `correction_prompt`, aucun finding.
- Tu ne lances aucun reviewer et tu ne juges rien : pour un jugement, c'est `/scd-spec-dev:review`.
- Tu n'ouvres, ne pousses, ne merges aucune PR, tu ne crées aucune branche.
- Tu n'ouvres aucun diff toi-même : le script le fait, le `pr-describer` le narre.

## Skills actifs

- `review` — la page de relecture : ce qu'elle porte, ce qu'elle montre, et pourquoi elle ne juge
  pas. Les huit dimensions ne sont **pas** jouées ici.
- `implement` — résolution du ticket, de sa branche et de sa base quand la cible est `<change> NN`.
- `openspec` — seulement dans le cas ticket, pour situer le change.

## À la fin

- **Rendu** : rappelle en une ligne l'**URL** de la page publiée (ou, à défaut d'artefact, le chemin
  local de `<slug>.html`), le nombre de fichiers, et ce que le script a signalé — page tronquée,
  narration absente, notes reportées et périmées. Puis la suite : relire sur téléphone, et
  `/scd-spec-dev:review-page notes <URL>` pour récupérer les notes.
- **`notes`** : rappelle le verdict, le nombre de notes (dont périmées), et **ce qui a été posté** —
  l'URL de la review sur la PR, ou le fait que rien n'a été posté.
