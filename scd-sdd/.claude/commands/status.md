---
description: "Vue d'ensemble des trois niveaux du cycle — socle, specs, implémentation — en une seule lecture, plus les chantiers ouverts. Dérive l'état des fichiers, extrait de docs/journal/*.md les faits non dérivables (verdict analyze, issue des lots) en contrôlant leur péremption, et donne UNE prochaine commande. Le point d'entrée quand on rouvre un projet. Lecture seule."
argument-hint: "(aucun — scanne docs/ et specs/)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(git log *)
  - Bash(git rev-parse *)
  - Bash(git merge-base *)
  - Bash(grep *)
  - Bash(ls *)
---

## Contexte

Tu réponds à « **où on en est ?** » — la question qu'on pose en rouvrant un projet sans savoir
s'il lui manque un PRD, une gate, ou juste le prochain lot. Une vue, les trois niveaux, **une**
prochaine commande.

Tu es la vue **d'ensemble**, et c'est ta contrainte principale : tu rends chaque niveau en
quelques lignes, puis tu **renvoies** pour le détail. `/scd-sdd:status-specs` croise les
« Fichiers touchés » des features ; `/scd-sdd:status-impl` classe la sûreté de merge des PR.
Refaire leur travail ici rendrait cette vue illisible et ces deux commandes inutiles.

Tu croises **quatre sources** :

- **les fichiers**, qui donnent l'état courant des trois niveaux — robuste, rien à maintenir ;
- **`docs/journal/*.md`**, qui donnent ce que les fichiers ne portent pas : verdict d'une gate
  `analyze`, `premortem` appliqué, issue d'un lot (y compris un run **bloqué**, qui ne coche rien
  et n'ouvre aucune PR) ;
- **`docs/chantiers/`**, dont l'arborescence donne le travail ouvert hors des phases, ou interrompu
  en vol — l'état est le répertoire, donc un `ls` suffit ;
- **les dates**, qui décident si une ligne de journal ou une fiche vaut encore quelque chose.

**Tu extrais, tu n'ouvres pas.** Un journal ne se `Read` jamais en entier : tu en tires par motif
les quelques lignes qui t'intéressent (étape 5). C'est ce qui garde ton coût quasi constant quel
que soit le nombre de features.

Ratio : 5% humain / 95% AI (lecture mécanique ; l'humain choisit la suite).

## Règles absolues

- **Lecture seule.** Tu ne modifies aucun fichier — **ni un journal, ni une fiche de chantier** —
  et tu n'as pas `Edit`. Tu ne joues aucune phase, donc tu ne consignes rien : c'est de nature,
  pas un oubli.
- **Dérive l'état des fichiers**, jamais du contexte (il a été effacé) ni d'un fichier d'état (il
  dériverait).
- **Une ligne de journal n'est jamais un état.** C'est un événement daté. Tu ne la présentes comme
  une gate valide qu'après le **contrôle de fraîcheur**.
- **Une fiche de chantier n'est jamais un état de projet.** C'est une intention datée, et elle peut
  être fausse. Tu l'affiches **à part**, sous contrôle de fraîcheur, jamais dans une colonne du
  tableau des features — et elle ne modifie ni la phase d'une feature, ni l'avancement d'un lot,
  ni la prochaine commande que tu dérives.
- **Tu lis les en-têtes de fiche, jamais leur corps.** Restituer une intention et recharger son
  manifeste est le travail de `/scd-sdd:resume`, et ça coûte un contexte qu'un tableau de bord ne
  dépense pas.
- **Tu n'ouvres jamais un fichier de journal en entier.** Tu extrais par motif (`grep`), et tu ne
  lis intégralement que `docs/journal/socle.md`, qui est borné par construction.
- **Tu ne recopies aucune règle déjà écrite.** Trois sources font autorité et tu les charges : la
  table de dérivation de phase (skill `feature-specs`, § « Cibler une feature »), l'avancement des
  lots (`implement/references/tasks-parsing.md`), la règle de fraîcheur
  (`feature-specs/references/status.md`, colonne `Gate`).
- **Tu ne descends pas dans le détail.** Aucun appel `gh`/`glab`, aucune classification de sûreté
  de merge, aucun croisement des « Fichiers touchés » : c'est le périmètre des deux `status`
  détaillés, vers lesquels tu renvoies.
- **Les runs en vol restent hors périmètre.** Tu ne scannes ni `git worktree list` ni les branches
  `impl/<slug>-Rn`. Un run interrompu se voit **au journal** (`⛔ blocked-*`) et, s'il a été relayé,
  dans le bloc « Chantiers » — jamais par une inspection du dépôt.
- **Tu n'inventes aucune date**, et tu ne reconstruis jamais le journal a posteriori.

## Processus

1. **Charge les trois sources de vérité** : la section « Cibler une feature » du skill
   `feature-specs` (dérivation de phase), `references/status.md` du même skill (colonne `Gate`,
   règle de fraîcheur, dégradation « journal absent »), et `references/tasks-parsing.md` du skill
   `implement` (lots `Rn`, tâches `Tn`, état d'un lot).

2. **Niveau socle** — l'existence des fichiers, rien de plus, dans l'ordre de la chaîne du skill
   `project-docs` : `docs/brief.md` → `brief`, `docs/prd.md` → `prd`, `docs/stack.md` → `stack`,
   `docs/adr/*.md` → `adr`, `CLAUDE.md` → `contract`. C'est l'état que `/scd-sdd:init-project`
   établit ; tu le relis, tu ne le complètes pas. Un fichier présent contenant encore un
   `[NEEDS CLARIFICATION]` compte comme **incomplet**, pas comme fait — nomme-le.

3. **Niveau specs** — pour chaque `specs/NNN-slug/`, applique la **table de dérivation de phase**
   du skill `feature-specs`. Relève aussi le mode (`DELTA.md` présent → delta).

4. **Niveau implémentation** — pour chaque feature ayant un `tasks.md`, compte les lots `Rn`
   **faits / en cours / à faire** depuis les cases locales, et détermine le **prochain lot
   lançable** (premier `Rn` non fait dont toutes les dépendances `dépend de :` sont faites).
   Les cases sont autoritaires à ce niveau.

5. **Extrais des journaux, sans les ouvrir.** Les dates étant en ISO, le tri lexical est
   chronologique :

   ```bash
   grep -h '| analyze |'   docs/journal/NNN-slug.md | tail -1   # dernier verdict de la feature
   grep -h '| premortem |' docs/journal/NNN-slug.md | tail -1   # dernière passe de durcissement
   grep -h '| run R'       docs/journal/NNN-slug.md              # issue de chaque lot
   grep -h '^| 20'         docs/journal/*.md | sort -r | head -5 # derniers événements, tous fichiers
   ```

   `docs/journal/socle.md` est le seul que tu peux lire en entier : il est borné à quelques lignes,
   écrites une fois.

6. **Contrôle la fraîcheur de chaque gate** — applique la règle de `references/status.md`
   (`git log -1 --format=%cI -- <fichier>` sur `spec.md`, `plan.md` et `tasks.md`, repli sur la
   mtime). Rien modifié après la gate → **✅ validé** ; un document modifié après → **⚠ périmé**,
   avec le fichier et sa date, et `analyze` redevient la prochaine commande de cette feature.

7. **Compose les derniers événements** : les 3 à 5 dernières lignes du journal, **tous fichiers
   confondus**, les plus récentes d'abord. C'est la chronologie, pas un état — ne la commente
   pas, elle se lit seule. Ajoute les 2 ou 3 derniers chantiers archivés
   (`ls docs/chantiers/archive/ | tail -3`) : le tri par nom **est** leur chronologie, et c'est la
   seule trace du travail hors-cycle.

8. **Relève les chantiers**, sans ouvrir un seul corps de fiche :
   `ls docs/chantiers/en-cours/` et `ls docs/chantiers/en-attente/`. Pour chaque fiche de
   `en-cours/`, lis **l'en-tête seul** — titre, `Portée`, `Actualisé le`, `branche` — et applique
   le **contrôle de fraîcheur** du skill `chantier` (ancre : branche courante et
   `git merge-base --is-ancestor` ; âge : plus de 14 jours). `en-attente/` n'est que **compté**.

   Aucun chantier → pas de bloc, et **aucune mention** : c'est le cas normal.

9. **Choisis LA prochaine commande**, une seule, par ordre de priorité :

   1. **Socle incomplet** → sa première phase manquante. Si des features sont déjà en vol,
      signale-le comme un **trou de traçabilité** (des specs qui tracent vers un PRD absent) sans
      effacer le travail en cours du rapport.
   2. **Gate périmée** → `/scd-sdd:analyze NNN`. Elle passe devant : sinon le contrat part à
      l'implémentation sur un verdict qui ne vaut plus.
   3. **Dernier run d'un lot bloqué** (`⛔ blocked-*` au journal, aucune case cochée derrière) →
      `/scd-sdd:run NNN Rn`, à relancer.
   4. Sinon la **feature la plus avancée** : gate `PRÊT` fraîche et lots restants →
      `/scd-sdd:run NNN <prochain lot lançable>` ; sinon la commande suivante de sa phase dérivée.
   5. **Aucune feature** → `/scd-sdd:kickoff-feature`.

   **Un chantier ne devient jamais ta prochaine commande.** L'échelle ci-dessus répond à « que doit
   faire le projet ensuite » ; un chantier répond à « qu'étais-**tu** en train de faire ». Les
   mélanger laisserait une intention écraser une nécessité dérivée. Le bloc « Chantiers » est
   simplement affiché **avant** — parce qu'il est le plus périssable — et il ne remplace rien.

10. **Produis le rapport** selon le bloc `<report>`, avec la prochaine commande de chaque feature
    prête à copier, argument `NNN` inclus.

<report>
```
### Chantiers — docs/chantiers/
⏸ « Verrouillage du compte après 5 échecs » — 001-auth · lot R2
   actualisé le 05/08 sur `impl/auth-R2` · à jour
   → /scd-sdd:resume avant de suivre la prochaine commande ci-dessous
· 2 en attente · dernier archivé : 2026-08-02-vitest-3

## Où on en est

Socle       ✅ complet — brief · prd · stack · 4 ADR · CLAUDE.md
Specs       2 features · 1 validée · 1 à revalider
Implém.     001-auth : 2/4 lots faits · PR #10, #12 journalisées

### Features — specs/
| NNN | Feature | Phase courante                                  | Lots      | Prochaine commande   |
|-----|---------|-------------------------------------------------|-----------|----------------------|
| 001 | auth    | ✅ validé (analyze 28/07)                        | 2/4 faits | /scd-sdd:run 001 R3  |
| 002 | billing | ⚠ analyze PRÊT (26/07) · tasks.md modifié 29/07 | —         | /scd-sdd:analyze 002 |

### Derniers événements — docs/journal/
30/07  001-auth  run R2    ✅ done · TDD · 4 tests · PR #12
28/07  001-auth  analyze   PRÊT — 0 Critical
02/08  chantier  archivé   vitest 1.6 → 3.0

→ Prochaine : /scd-sdd:run 001 R3
   Détail PR : /scd-sdd:status-impl 001 · Détail specs : /scd-sdd:status-specs
```

Lire l'exemple : 001 et 002 ont tous deux un `tasks.md`, donc la **dérivation** les dit tous deux
« à valider » — et elle le dira toujours. C'est le journal, contrôlé en fraîcheur, qui les sépare :
001 a été gaté et rien n'a bougé depuis, 002 a été édité après le sien.

Ce que la colonne **Phase courante** peut porter :

- `à spécifier` / `à clarifier` / `à planifier` / `à découper` : phase dérivée, aucune gate encore.
- `✅ validé (analyze JJ/MM)` : dernière ligne `analyze` du journal, aucun document modifié depuis.
  Ajouter `· premortem JJ/MM` si une ligne `premortem` la suit.
- `⚠ analyze <verdict> (JJ/MM) · <fichier> modifié JJ/MM` : gate **périmée**.
- `à valider` sans date : `tasks.md` présent mais aucune ligne `analyze` — jamais gatée, ou journal
  absent. Ce n'est pas une anomalie.

La ligne **Implém.** ne dit que ce que les cases et le journal portent : lots faits, et les numéros
de PR **journalisés**. Elle n'affirme jamais qu'une PR est ouverte, mergeable ou orpheline — l'état
des PR exige `gh`/`glab`, donc `/scd-sdd:status-impl`.

Le bloc **Chantiers** ouvre le rapport parce qu'il est le plus périssable, **pas** parce qu'il
prime. Ce qu'il peut porter après le titre et la portée :

- `à jour` — l'ancre tient, la fiche a moins de 14 jours ;
- `⚠ suspect — enregistré sur impl/auth-R2, tu es sur main` : l'ancre ne tient plus ;
- `⚠ ancien (24 j)` ;
- `✔ consommé — le test locks_after_fifth_failure existe déjà` → suggère `/scd-sdd:resume` pour le
  refermer.

Plusieurs fiches dans `en-cours/` n'est pas une anomalie : c'est le mode worktree. Liste-les
toutes, la plus récemment actualisée d'abord.
</report>

## Dégradations

- **Pas de `docs/`** (ni `brief.md`, ni `prd.md`, ni `CLAUDE.md`) → le projet n'a pas de socle :
  « Rien à rendre. Ouvre le projet avec `/scd-sdd:init-project`. » N'affiche pas de tableau vide.
- **Socle présent, `specs/` vide ou absent** → rends le niveau socle, puis « Aucune feature.
  Démarre avec `/scd-sdd:kickoff-feature [feature]`. »
- **`docs/journal/` absent** (projet démarré avant le journal, ou avec les trois anciens
  plugins) → **vue dérivée complète, sans la section « Derniers événements »**, et une ligne de
  pied qui le dit : « Pas de `docs/journal/` — le verdict `analyze` et l'issue des runs ne sont
  pas connaissables hors session. Ils apparaîtront aux prochaines phases. » **Toi, tu ne le
  crées ni ne le reconstruis** : tu es en lecture seule. Si le projet vient des trois anciens
  plugins, ajoute le renvoi `/scd-sdd:migrate` — c'est la commande qui le crée et reconstitue
  depuis git les lignes que les artefacts permettent de dater.
- **`docs/JOURNAL.md` présent** (projet suivi avant l'éclatement du journal) → dis-le en
  une ligne et renvoie vers `/scd-sdd:migrate`, qui le convertit. **Tu ne le lis pas** et tu ne le
  convertis pas toi-même : rendre une vue depuis les deux formats te ferait porter deux règles de
  lecture pour toujours.
- **`docs/journal/NNN-slug.md` absent pour une feature existante** → phase dérivée seule, sans date.
- **`docs/chantiers/` absent, ou ses trois répertoires vides** → **pas de bloc « Chantiers », et
  aucune mention**. C'est le cas normal ; l'annoncer à chaque fois serait du bruit.
- **Hors dépôt git** → repli sur la mtime pour la fraîcheur, et signale que le contrôle est moins
  fiable (une copie de fichiers réinitialise les mtime).
- **Des lots faits, donc des PR probablement en vol** → ajoute toujours le renvoi
  `/scd-sdd:status-impl NNN`. Tu ne peux voir ni un **🔴 ORPHELIN** ni un **⚠️ DANGEREUX**, et ces
  deux-là passeraient devant tout ce que tu recommandes.

## Ce que tu NE fais PAS

- Tu ne lances aucune phase et tu ne corriges rien : tu orientes, une commande à la fois.
- **Tu n'écris rien**, ni dans les documents, ni dans le journal. Tu es **idempotent** et
  relançable sans effet.
- Tu n'interroges ni `gh` ni `glab`, tu ne classes pas la sûreté de merge des PR, tu ne croises pas
  les « Fichiers touchés » — les deux `status` détaillés existent pour ça.
- Tu ne scannes ni les worktrees ni les branches `impl/` : ce que le journal ne dit pas d'un run,
  tu ne l'inventes pas.
- Tu ne rejoues pas `analyze` pour « vérifier » un verdict périmé — tu le signales et tu renvoies.
- Tu ne recopies ni la table de dérivation, ni la règle de fraîcheur, ni le parsing de `tasks.md` :
  tu les charges.
- Tu ne lis pas le **corps** d'une fiche de chantier, tu n'en charges pas le manifeste, tu ne la
  déplaces ni ne la modifies — `/scd-sdd:resume` fait tout cela.

## Skill active

- `feature-specs` — table de dérivation (§ « Cibler une feature ») et `references/status.md`
  (colonne `Gate`, règle de fraîcheur).
- `implement` — `references/tasks-parsing.md` pour l'état des lots `Rn`.
- `project-docs` — chaîne du socle (brief → prd → stack → adr → CLAUDE.md).
- `journal` — contrat de `docs/journal/*.md` (**lecture seule ici**).
- `chantier` — § « Contrôle de fraîcheur » et format de l'en-tête (**en-tête seul, lecture seule
  ici** ; tu ne charges pas `references/manifeste.md`).

## À la fin

Donne **une** prochaine commande, prête à copier, selon l'ordre de priorité du `## Processus`
étape 9 — et dis en une ligne pourquoi c'est celle-là.

Si un chantier est ressorti **à jour**, rappelle en une ligne que `/scd-sdd:resume` vient **avant**
cette commande — sans jamais la remplacer.

Rappelle les deux vues détaillées : `/scd-sdd:status-specs` pour les features et leurs
recoupements de fichiers, `/scd-sdd:status-impl NNN` pour l'avancement des lots et la sûreté de
merge des PR.
