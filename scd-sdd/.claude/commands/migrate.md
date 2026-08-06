---
description: "Reprend un projet venu de scd-project-docs / scd-feature-specs / scd-implement, ou d'une version antérieure à l'éclatement du journal : diagnostique l'installation et le projet, convertit un docs/JOURNAL.md monolithique en docs/journal/*.md, reconstitue depuis l'historique git ce qui manque, scaffolde docs/chantiers/, applique les correctifs après accord, puis rend le point de reprise. À jouer une fois par projet migré."
argument-hint: "(aucun — inspecte l'installation, docs/ et specs/)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
  - Bash(git log *)
  - Bash(git rev-parse *)
---

## Contexte

`scd-sdd` **remplace** `scd-project-docs`, `scd-feature-specs` et `scd-implement`. Sur un projet
qui tournait avec eux, les artefacts (`docs/`, `specs/`) sont **compatibles tels quels** : les
formats n'ont pas bougé et aucun document produit ne cite de nom de commande. Ce qui casse est
ailleurs, et c'est invisible tant que rien ne le nomme :

- les trois anciens plugins **restent installés**, donc leurs hooks tournent **en double** et
  leurs skills entrent en concurrence de routage avec les quatre nouveaux ;
- les placeholders `FORMAT_CMD` / `LINT_CMD` de `format-lint.sh` sont **repartis à vide** — le
  nouveau plugin est un nouveau répertoire de cache ;
- `docs/journal/` **n'existe pas**, donc `/scd-sdd:status` dégrade : ni chronologie, ni
  contrôle de fraîcheur des gates ;
- `docs/chantiers/` **n'existe pas**, donc `/scd-sdd:pause` n'a nulle part où poser une fiche.

**Deuxième provenance** : un projet suivi sous une version de `scd-sdd` **antérieure à
l'éclatement du journal** a un `docs/JOURNAL.md` **monolithique**, à sections. Il se convertit en
un fichier par cible (`DECISIONS.md` §D17). C'est un **déplacement de lignes**, pas une
réécriture — et c'est toi qui le fais. Les deux provenances se cumulent sans se gêner : un projet
peut avoir besoin de la conversion **et** de la reconstitution des phases jamais journalisées.

Tu diagnostiques ces plans, tu convertis, tu reconstitues ce que git permet de reconstituer, et tu
rends la main. Tu es une commande de **reprise**, jouée une fois — pas une phase du cycle.

Ratio : 30% humain / 70% AI (diagnostic mécanique ; l'humain accorde chaque écriture et
désinstalle les anciens plugins).

## Règles absolues

- **Tu ne désinstalles ni n'installes aucun plugin.** `/plugin uninstall` appartient à l'humain ;
  tu produis les lignes prêtes à copier.
- **Tu ne convertis aucun artefact.** `docs/` et `specs/` se reprennent tels quels. Un `tasks.md`
  sans `_vérif :_` ou sans ligne `Fichiers :` est **signalé**, jamais réécrit : la
  rétro-compatibilité est déjà portée par `implement/references/tasks-parsing.md`.
- **Tu n'écris rien sans accord explicite** (`AskUserQuestion`), écriture par écriture, avec
  l'aperçu de ce qui sera écrit.
- **La conversion ne réécrit aucune ligne.** Un `docs/JOURNAL.md` monolithique se convertit par
  **déplacement** : chaque section devient un fichier, lignes inchangées au caractère près. Tu
  comptes les lignes avant et après ; si le total diverge, tu **t'arrêtes** sans rien supprimer.
- **Tu ne reconstitues une cible que si son fichier `docs/journal/<cible>.md` est absent.**
  Présent → tu n'y ajoutes que ta propre ligne. C'est ce qui te rend **rejouable sans doubler
  quoi que ce soit**.
- **Tu ne reconstitues jamais un fait non dérivable** — verdict `analyze`, `premortem` appliqué,
  issue d'un lot. Ils n'ont de trace nulle part, ni disque ni git. Les **chantiers** non plus :
  ils n'ont laissé aucun artefact daté avant d'exister.
- **Hors dépôt git → aucune ligne reconstituée.** Tu crées les fichiers avec leur en-tête vide et
  tu dis pourquoi. Les mtime d'une copie de fichiers sont fausses.
- **Tu ne joues aucune phase du cycle** et tu n'écris aucun contenu de document.

## Définitions

- **Ancien plugin** : `scd-project-docs`, `scd-feature-specs` ou `scd-implement`, dans n'importe
  quelle version.
- **Hook en double** : les deux hooks de `scd-sdd` (`block-adr-edits.sh` en `PreToolUse`,
  `format-lint.sh` en `PostToolUse`) existent à l'identique dans `scd-feature-specs`. Les
  `hooks/hooks.json` étant auto-découverts à la racine de chaque plugin, les deux copies se
  déclenchent tant que l'ancien est installé.
- **Pointeur périmé** : une occurrence de `/scd-project-docs:`, `/scd-feature-specs:` ou
  `/scd-implement:` écrite à la main dans un fichier du projet.

## Processus

1. **Charge la connaissance transverse** : le skill `journal` et sa référence
   **`references/reconstitution.md`**, qui porte la recette de conversion, la règle de datation,
   la table des lignes reconstituables et la liste de ce qui ne l'est jamais. Tu es la **seule**
   commande à la charger. Charge aussi la table « Cibler une feature » du skill `feature-specs`
   pour dériver la phase de chaque feature.

2. **Diagnostique l'installation.** Lis `~/.claude/plugins/installed_plugins.json`, puis les
   `enabledPlugins` de `~/.claude/settings.json`, `.claude/settings.json` et
   `.claude/settings.local.json`. Pour chaque ancien plugin trouvé, retiens son identifiant
   complet (`<nom>@<marketplace>`) et sa version. Aucun trouvé → dis-le : la migration est déjà
   faite de ce côté, le reste du diagnostic tient quand même.

3. **Diagnostique le projet** — trois recherches, aucune écriture :
   - `.claude/settings*.json` : une entrée `hooks` dont la commande contient un chemin de cache
     `*scd-project-docs*`, `*scd-feature-specs*` ou `*scd-implement*` est **obsolète** — le
     chemin disparaît à la désinstallation, le hook échouera en silence ;
   - **pointeurs périmés** : `Grep` des trois anciens préfixes dans `CLAUDE.md`, `docs/**`,
     `specs/**` et `README.md`. Rends chaque occurrence avec son remplaçant, en te servant de la
     table ci-dessous — les quatre premières lignes sont des **renommages**, pas de simples
     changements de préfixe :

     | Ancien | Nouveau |
     |---|---|
     | `/scd-project-docs:kickoff` | `/scd-sdd:init-project` |
     | `/scd-feature-specs:kickoff` | `/scd-sdd:kickoff-feature` |
     | `/scd-feature-specs:status` | `/scd-sdd:status-specs` |
     | `/scd-implement:status` | `/scd-sdd:status-impl` |
     | tout autre `/scd-<ancien>:<cmd>` | `/scd-sdd:<cmd>` |

   - `FORMAT_CMD` / `LINT_CMD` de `${CLAUDE_PLUGIN_ROOT}/hooks/scripts/format-lint.sh` : vides →
     le hook est un no-op. Cherche les commandes réelles dans `CLAUDE.md` ; à défaut, demande.

4. **Diagnostique les artefacts** — tu **constates**, tu ne convertis rien :
   - socle : lesquels des six documents existent (`docs/brief.md`, `docs/prd.md`,
     `docs/stack.md`, `docs/adr/*.md`, `docs/ci.md`, `CLAUDE.md`). `docs/ci.md` manque
     forcément sur un projet venu des trois anciens plugins : la phase `ci` leur est
     postérieure. C'est un manque à **déclarer** — le socle est alors incomplet d'une
     phase, et `/scd-sdd:ci` se joue avant de rouvrir `contract` — jamais une anomalie de
     migration à corriger ici ;
   - features : chaque `specs/NNN-slug/` et sa phase dérivée selon la table du skill
     `feature-specs`, plus le mode (`DELTA.md` présent → delta) ;
   - lots : les `## Rn` sans `_vérif :_` (→ traités en **`TDD`** par défaut) et sans ligne
     `Fichiers :` (→ `run-parallel` **sérialisera** au lieu de paralléliser). Signale-les
     nommément : ce sont des conséquences réelles, pas des défauts à corriger.

5. **Prépare la conversion, puis la reconstitution** — dans cet ordre, les deux selon
   `references/reconstitution.md`, qui fait autorité :

   - **Conversion.** `docs/JOURNAL.md` présent → compose l'arborescence cible : `## Socle` →
     `docs/journal/socle.md`, chaque `## NNN-slug` → `docs/journal/NNN-slug.md`. Une section que
     tu ne sais pas classer → **STOP** et demande ; on ne classe pas au jugé. Compte les lignes de
     table avant et après : elles doivent être égales.
   - **Reconstitution.** Pour chaque cible dont le fichier reste **absent** après conversion, et
     si le projet est un dépôt git (`git rev-parse --git-dir`), compose les lignes depuis
     l'historique. Présente chaque fichier **complet**, lignes triées par date croissante.

   Un projet déjà éclaté n'a donc rien à convertir ; un projet venu des trois anciens plugins n'a
   rien à convertir non plus, mais tout à reconstituer ; un projet à moitié suivi a besoin des deux.

6. **Demande l'accord, écriture par écriture** (`AskUserQuestion`) — jamais un accord global :
   - convertir `docs/JOURNAL.md` en `docs/journal/*.md` (et le supprimer **seulement** après que
     le compte de lignes est vérifié) ;
   - créer les `docs/journal/<cible>.md` manquants (avec ou sans lignes reconstituées) ;
   - créer `docs/chantiers/en-cours/`, `en-attente/` et `archive/` ;
   - renseigner `FORMAT_CMD` / `LINT_CMD` dans `format-lint.sh` ;
   - retirer du `.claude/settings*.json` du projet les hooks pointant un ancien cache.

   Un refus est définitif : tu n'insistes pas et tu le notes au rapport.

7. **Applique** ce qui a été accordé, et rien d'autre.

8. **Produis le rapport** selon le bloc `<report>`, puis **consigne au journal**.

<report>
```
## Migration vers scd-sdd

Installation   ⚠ 3 anciens plugins encore installés
Projet         ⚠ 2 pointeurs périmés · hooks projet OK · format-lint à renseigner
Artefacts      ✅ socle complet · 2 features · 1 lot sans `Fichiers :`
Journal        ✅ converti — 24 lignes → socle.md (7) · 001-auth.md (11) · 002-billing.md (6)
               ✅ + 3 lignes reconstituées depuis git (2026-07-25 → 2026-07-29)
Chantiers      ✅ docs/chantiers/{en-cours,en-attente,archive}/ créés — vides

### À jouer toi-même
/plugin uninstall scd-project-docs@sebc-dev-marketplace
/plugin uninstall scd-feature-specs@sebc-dev-marketplace
/plugin uninstall scd-implement@sebc-dev-marketplace

Tant qu'ils sont là : block-adr-edits et format-lint tournent deux fois, et deux jeux
de skills se disputent le routage.

### Pointeurs périmés (à corriger à la main)
CLAUDE.md:14      /scd-feature-specs:analyze   → /scd-sdd:analyze
docs/stack.md:71  /scd-implement:status        → /scd-sdd:status-impl

### Non reconstituable — définitivement absent du journal
analyze · premortem · runs des lots — aucune trace sur disque ni dans git.
clarify — il édite spec.md, il n'a pas d'artefact propre.
chantiers — rien n'a existé avant docs/chantiers/, il n'y a rien à dater.
Les cases [x] de tasks.md restent la source de vérité des lots faits.

→ Prochaine : /scd-sdd:status
```

La ligne **Journal** ne dit jamais « chronologie complète » : elle donne le nombre de lignes et
la plage de dates couverte, à charge du lecteur de voir ce qui manque — la section
« Non reconstituable » est là pour ça, et elle n'est **pas** optionnelle.
</report>

## Ce que tu NE fais PAS

- Tu ne désinstalles, n'installes ni ne mets à jour aucun plugin.
- Tu ne corriges pas les pointeurs périmés toi-même : ils vivent dans des documents dont
  l'humain est l'auteur (`CLAUDE.md`, ses notes). Tu les listes avec leur remplaçant.
- Tu n'écris aucun contenu de document, tu ne rejoues aucune phase, tu ne lances aucune gate.
- Tu ne réécris ni `spec.md`, ni `plan.md`, ni `tasks.md` — pas même pour ajouter un `_vérif :_`
  manquant.
- Tu ne reconstitues ni verdict `analyze`, ni `premortem`, ni issue de lot, et tu ne les déduis
  pas des cases cochées.
- Tu ne touches pas à un `docs/journal/<cible>.md` déjà présent, hors ta propre ligne.
- **Tu ne réécris aucune ligne pendant la conversion**, tu ne les réordonnes pas, et tu ne
  supprimes `docs/JOURNAL.md` qu'après avoir vérifié le compte de lignes.
- Tu ne crées **aucune fiche de chantier** : tu ne fais que scaffolder les trois répertoires.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé — **après** les lignes reconstituées, et datée du **jour** :

- **Phase** : `migrate`
- **Résultat** : ce qui a été constaté et corrigé — `3 anciens plugins à désinstaller · journal
  converti (24 lignes, 3 fichiers) · 3 lignes reconstituées · chantiers/ créé · format-lint
  renseigné`. Si aucun ancien plugin n'a été trouvé et que rien n'a été écrit : `rien à migrer ·
  journal déjà éclaté`.

Cette ligne est écrite **même si l'humain a refusé toutes les autres écritures** : le diagnostic
a eu lieu, c'est un événement. Elle ne l'est pas si `docs/journal/socle.md` n'a pas pu être créé
(refus, ou absence de `docs/`).

## Skill active

- `journal` — contrat de `docs/journal/*.md`, et surtout sa référence
  **`references/reconstitution.md`** : recette de conversion, source de date, table des lignes
  reconstituables, non-reconstituables. Tu es la seule commande à la charger.
- `chantier` — uniquement pour l'arborescence de `docs/chantiers/` que tu scaffoldes.
- `feature-specs` — table « Cibler une feature » pour dériver la phase de chaque feature.
- `implement` — `references/tasks-parsing.md` pour lire les lots `Rn` et leurs lignes méta.

## À la fin

Rappelle les `/plugin uninstall` restants — c'est la seule action que tu ne peux pas faire, et
la plus conséquente. Puis : « Le reste est en place. `/clear`, puis `/scd-sdd:status` — il te dira
où reprendre. »
