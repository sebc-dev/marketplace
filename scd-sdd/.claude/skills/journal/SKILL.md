---
name: journal
description: |
  Contrat des fichiers de suivi docs/journal/socle.md et docs/journal/NNN-slug.md du cycle
  spec-driven : emplacement, format, règle d'ajout, vocabulaire de chaque phase, et la
  frontière événement-vs-état qui décide ce qui a le droit d'y figurer. Se charge quand une
  commande /scd-sdd:* consigne la phase qu'elle vient de jouer — les 19 commandes de phase,
  d'init-project à reland — plus premortem, revise-contract et audit, qui ne sont pas des phases
  mais dont le résultat ne se dérive d'aucun fichier. Ni lookup, ni research, ni les commandes linear* n'y écrivent :
  leur rapport, ou docs/linear.md et le miroir lui-même, est le fait (skills research, linear).
  Porte UNIQUEMENT le journal : ni la dérivation de l'état depuis les fichiers (skills
  project-docs, feature-specs, implement), ni le travail hors des phases du cycle, qui est un
  chantier et non une ligne (skill chantier), ni le contenu des documents produits. La
  reconstitution vit dans references/reconstitution.md, que seule la commande migrate charge.
---

# Journal — `docs/journal/*.md`

## Pourquoi il existe

L'état du cycle se **dérive des fichiers** : `spec.md` existe → la feature est spécifiée ; les
cases `[x]` de `tasks.md` → les lots faits. C'est robuste et ça survit au `/clear` sans rien
maintenir. Mais la dérivation ne donne qu'un instantané : elle dit *où on en est*, jamais *comment
on y est arrivé, ni quand*.

Le journal est donc la **chronologie des phases jouées** — une ligne par phase jouée, **et par ce
qui n'est dérivable de nulle part**. Chaque commande concernée y consigne son résultat ; les trois
`status` ne consignent rien, ils lisent.

Et parmi ces lignes, **cinq faits ne sont connaissables que là**, parce qu'ils ne laissent aucune
trace sur disque :

| Fait | Pourquoi il n'est pas dérivable |
|---|---|
| le verdict d'une gate `analyze` | `analyze` est en lecture seule, il n'écrit aucun rapport |
| un `premortem` appliqué | il édite les documents de sa cible sans y laisser de marqueur |
| l'issue d'un lot | un run **bloqué** ne coche rien et ne produit aucune PR |
| le résultat d'une `revise-contract` | elle édite `CLAUDE.md` sans y laisser de marqueur, et une passe sans édition ne laisse rien du tout |
| le verdict d'un `audit` | le document jugé sort **bit pour bit identique**, et la fiche qu'il ouvre porte la liste de travail, **jamais** le verdict — une passe `CONFORME` peut même n'ouvrir aucune fiche |

Sans le journal, ces cinq-là sont perdus à la fin de la session. Les autres lignes, elles, sont
redondantes avec les fichiers **par leur existence** mais pas **par leur date** : c'est ce qui rend
la péremption détectable.

**La règle n'est donc pas « une phase journalise ».** C'est **« ce qui n'est dérivable de nulle
part se consigne »**. Les **quatre** capacités transverses le montrent en se départageant :
`research` n'écrit **aucune** ligne, parce que le rapport qu'il produit **est** le fait ; le
miroir `linear` non plus, et pour **deux** motifs qui lui sont propres — le setup et le push
parce que le miroir est **idempotent et interrogeable chez Linear** et que le fait produit par le
setup est `docs/linear.md`, non parce qu'ils seraient en lecture seule, `linear-setup` écrivant ;
la revue parce qu'elle est en **lecture seule** et ne rend qu'une **vue éphémère**, qui n'a rien
laissé à consigner ; `premortem`, lui, écrit une ligne, parce
qu'il ne produit aucun artefact propre — il modifie des documents existants sans y laisser de
marqueur — alors même qu'il n'est pas une phase et n'apparaît dans aucune table de dérivation. Sa
seule exception : la cible `chantier`, où la fiche modifiée **est** le fait et où son
`Actualisé le` date le durcissement (skill `chantier`). L'`audit`, lui, écrit une ligne parce qu'il
**n'écrit rien** dans ce qu'il juge : sa fiche porte la liste de travail, jamais le verdict.

## La frontière : un événement — ni un état, ni un chantier

- Le journal enregistre **ce qui est arrivé, à une date**. Une ligne est un fait passé,
  définitivement vrai.
- Il n'enregistre **jamais l'état courant**. « la feature 001 est validée » est un état : il se
  périme dès qu'on touche `spec.md`. « le 28/07, `analyze` a rendu PRÊT » est un événement : il
  reste vrai pour toujours.
- **Un lecteur ne dérive donc jamais un état d'une ligne seule.** Il croise la date de la ligne
  avec la dernière modification des fichiers concernés (`git log -1 --format=%cI -- <fichier>`,
  repli sur la mtime). Si les fichiers ont bougé après, l'événement est **périmé** et doit être
  affiché comme tel.
- Il n'enregistre **pas le travail hors des phases du cycle**. Un debug, un hotfix, un spike, une
  montée de version sont des **chantiers** — un fichier chacun sous `docs/chantiers/`, contrat
  porté par le skill `chantier`. La frontière, en une phrase testable :

  > Ce qui garde de la valeur **une fois le travail terminé** va au journal ; ce qui n'a de valeur
  > que **pour le reprendre** va dans une fiche de chantier.

  Un chantier fermé n'écrit donc **aucune** ligne ici : son lien avec une feature passe par son
  champ `Portée`.

## Emplacement et format

**Un fichier par cible**, jamais un fichier partagé qui croîtrait sans borne :

- `docs/journal/socle.md` — les phases du niveau socle, écrites une fois ;
- `docs/journal/NNN-slug.md` — les phases d'une feature, specs **et** implémentation.

Un fichier porte un titre, un bloc de citation, et **une seule table**. Il n'a **pas** de sections
`##` : le fichier *est* la cible.

```markdown
# Journal — 001-auth

> Trace chronologique des phases jouées sur cette feature. Les fichiers restent la source de
> vérité de l'état courant ; ce journal enregistre les événements et les faits non dérivables
> (verdicts analyze et audit, premortem appliqué, issue d'un lot même bloqué, contrat révisé).
> Une ligne = un événement.

| Date | Phase | Résultat |
|---|---|---|
| 2026-07-27 | specify | 6 FR · 2 [NEEDS CLARIFICATION] |
| 2026-07-27 | clarify | 2 résolus · 0 restant |
| 2026-07-28 | plan | 7 fichiers touchés · 1 candidat ADR |
| 2026-07-28 | tasks | 4 lots · 11 tâches |
| 2026-07-28 | analyze | **PRÊT** — 0 Critical · 2 Minor |
| 2026-07-29 | premortem | 3 remédiations appliquées (FR-007 ajouté) |
| 2026-07-29 | run R1 | ✅ done · TDD · 5 tests · PR #10 |
| 2026-07-30 | run R2 | ⛔ blocked-red · branche impl/auth-R2 |
| 2026-07-30 | run R2 | ✅ done · TDD · 4 tests · PR #12 (empilée sur R1) |
```

`docs/journal/socle.md` suit le même gabarit, titre `# Journal — socle`.

⚠️ **L'énumération des cinq faits ne varie pas d'un fichier à l'autre** : c'est le contrat du
journal, pas l'inventaire de ce fichier-là. Deux ne peuvent atterrir que dans `socle.md` (verdict
d'`audit`, contrat révisé), deux que dans un `NNN-slug.md` (verdict d'`analyze`, issue d'un lot), le
cinquième dans l'un ou l'autre selon sa cible (`premortem`) — l'amputer par cible ferait deux
gabarits qui divergeraient.

## Règle d'ajout

1. **Le fichier doit exister avant la ligne — et le créer n'est pas donné à tout le monde.** Le
   test est ton `allowed-tools`, jamais ton intuition.
   - **Tu as `Write`** → crée-le s'il est absent : le titre, le bloc de citation et l'en-tête de
     table ci-dessus, **aucune ligne**, et `docs/journal/` avec lui si le répertoire manque.
   - **Tu n'as pas `Write`** → tu ne le crées pas, et **tu ne bloques pas pour autant**. Sur un
     projet qui porte déjà des documents, un fichier de journal absent ne dit pas « oubli » : il dit
     que le niveau n'a jamais été ouvert, ou que le journal n'a jamais été éclaté. **Signale-le** et
     renvoie vers la commande qui scaffolde — `/scd-sdd:migrate` sur un projet déjà en cours, seule
     autorisée à reconstituer ; `/scd-sdd:init-project` ou `/scd-sdd:kickoff-feature` si le niveau
     vient d'être ouvert. La ligne se consignera après, et **le reste de ton travail reste valide** :
     une ligne non consignable n'annule rien.

   ⚠️ Ce second cas n'est pas marginal — `clarify`, `run`, `run-parallel`, `sync`, `reland`,
   `premortem` et `revise-contract` journalisent **sans** `Write` : une règle inexécutable par une
   part de ses destinataires est **pire qu'absente**, elle se lit comme faite.
2. **Ne lire que le fichier de ta cible.** C'est tout l'intérêt de l'éclatement : une commande de
   phase n'a jamais besoin des autres. Ne charge pas `docs/journal/*.md` pour écrire une ligne.
3. **Ajouter la ligne en fin de table**, jamais ailleurs.
4. **Ne jamais réécrire ni supprimer une ligne passée.** Un `run R2` qui échoue puis réussit produit
   **deux** lignes : l'échec fait partie de l'histoire. *(Cette règle protège contre la
   falsification de l'histoire, pas contre son classement : la conversion d'un ancien
   `docs/JOURNAL.md` déplace les lignes sans les toucher — voir `references/reconstitution.md`.)*
5. **Une seule ligne par événement**, en `Edit` ciblé — jamais de réécriture du fichier.
6. **Date au format `YYYY-MM-DD`**, celle du jour, **jamais inventée ni déduite**. La source
   normale est le **contexte de session**, qui la porte : c'est le chemin par défaut, pas un repli.
   `date -I` / `Get-Date -Format yyyy-MM-dd` n'est ouvert qu'aux écrivains dont l'`allowed-tools`
   porte `Bash(date *)` — la plupart ne l'ont pas, et un repli qu'on n'a pas le droit d'exécuter se
   lit comme un repli qui existe. Sans date au contexte **et** sans `Bash(date *)` : demande-la ; en
   arrière-plan, où aucune question n'est possible, remonte-le dans ton retour plutôt que d'écrire
   une date fausse. Seule `/scd-sdd:migrate` écrit des dates passées, et uniquement depuis git.

## Reconstitution et conversion — `migrate` seule

Un projet démarré avant le journal n'a aucune chronologie ; un projet démarré avant l'éclatement du journal a un
`docs/JOURNAL.md` monolithique. Les deux se rattrapent, et **`/scd-sdd:migrate` est la seule
commande autorisée** à le faire : conversion par déplacement pur, reconstitution datée depuis git
et jamais autrement.

La règle complète — préconditions, source de date, table des artefacts reconstituables, liste des
non-reconstituables — vit dans **`references/reconstitution.md`**. Toute autre commande s'en tient
à la règle d'ajout ci-dessus : **on n'invente pas de dates**.

## Vocabulaire de la colonne *Résultat*

Court, chiffré, factuel. Ce qu'on veut relire dans six mois — pas une phrase.

| Phase | Contenu attendu |
|---|---|
| `init-project` | ce qui a été scaffoldé · socle préexistant le cas échéant |
| `migrate` | anciens plugins à désinstaller · nb de lignes converties et reconstituées · correctifs appliqués |
| `brief` | personas · critères de succès · exclusions |
| `prd` | nb FR · nb SC · marqueurs restants |
| `stack` | choix structurants · nb de décisions → ADR |
| `archi` | nb d'invariants · nb de candidats ADR · nb de caractéristiques |
| `adr` | plage de numéros écrits · rétro-liage de `stack.md` et `archi.md` |
| `ci` | la forge · nb de contrôles bloquants et informatifs · seuil de couverture différentielle |
| `contract` | nb de principes · taille de la DoD |
| `revise-contract` | taille avant → après · Commandes resynchronisées ou alignées · nb de signalements |
| `audit` | **verdict en gras** — la cible auditée · nb Critical (avec leur cause en clair) · nb Major, arbitrés ou non |
| `kickoff-feature` | dossier `NNN-slug` créé · échelle · greenfield ou delta |
| `specify` | nb FR · nb `[NEEDS CLARIFICATION]` |
| `clarify` | nb résolus · nb restants |
| `plan` | nb fichiers touchés · candidats ADR |
| `tasks` | nb lots `Rn` · nb tâches `Tn` |
| `analyze` | **verdict en gras** — nb Critical · Major · Minor |
| `premortem` | nb remédiations appliquées · les IDs ou rubriques créés · nb chantiers ouverts |
| `run Rn` | `✅ done` ou `⛔ <statut>` · mode de vérif · nb tests · n° de PR |
| `sync` / `reland` | l'action effectuée · n° de PR concernée |

Statuts d'échec journalisables par `run` : `blocked-dirty-tree`, `blocked-branch`,
`blocked-rebase`, `blocked-impl`, `blocked-red`, `blocked-tests-modified`, `blocked-verify`,
`blocked-after-fix`, `blocked-branch-drift` — plus `blocked-upstream` et `blocked-unknown`, que
seul `run-parallel` peut retourner.

⚠️ **C'est un vocabulaire, pas une mécanique.** La liste dit quels mots une ligne a le droit de
porter ; sa **source** est le contrat de retour du dynamic workflow (`implement-lot`,
`implement-parallel`), et la **définition** de chaque statut vit dans le skill `implement`
(`references/workflow-template.md`). Un statut neuf se propage donc dans cet ordre : le workflow qui
le retourne, sa définition chez `implement`, puis le mot ici. On consigne le statut **tel qu'il est
retourné**, jamais abrégé ni reformulé — et un statut absent d'ici signale que la propagation s'est
arrêtée en route. `sync` et `reland` ont le leur (`blocked-conflict`), qui vient de leurs agents et
non du workflow de lot.

## Qui écrit

**La commande — jamais le workflow, jamais un hook.** L'orchestrateur d'un dynamic workflow n'a par
contrat aucune I/O ; tout accès disque passe par ses agents, et le déterminisme du resume l'exige.
`/scd-sdd:run` reçoit l'objet de retour du workflow (`{status, mode, passing, pr, …}`) et consigne
depuis la session principale.

C'est ce qui permet à un run **bloqué** de laisser une trace : l'agent `progress-recorder` ne tourne
que sur le chemin de succès, il perdrait tous les `blocked-*`.

Et aucun mécanisme ambiant n'écrit ici. Un hook ne connaît pas l'issue de ce qu'il
consignerait : c'est ce qui empêche structurellement le journal de devenir un verbatim de
session.

## Conflits en mode parallèle

Deux lots d'une même feature lancés par `run-parallel` tournent dans des worktrees isolés et
écriront tous deux en fin de la même table. Le conflit git est attendu et trivial : lignes
indépendantes, on garde les deux. Ce n'est pas une classe de problème nouvelle — `tasks.md` est
déjà édité par chaque lot parallèle.

## Ce que le journal n'est pas

- **Pas un état.** On n'y lit jamais « où on en est » directement : c'est `status` qui croise
  dérivation et journal.
- **Pas un rapport.** Le rapport d'`analyze` reste en conversation ; seul son verdict, daté, est
  consigné.
- **Pas un log de session.** Une action n'est pas un événement. Le travail hors des phases du cycle
  est un **chantier**, pas une ligne : un fichier sous `docs/chantiers/`, contrat porté par le
  skill `chantier`.
- **Pas reconstructible à volonté.** Aucune commande de phase ne le remplit rétroactivement : on
  n'invente pas de dates. La seule exception est encadrée et vit dans
  `references/reconstitution.md`. `status` fonctionne sans journal, et sans les lignes qui manquent.

## Références

| Fichier | Quand la charger |
|---|---|
| `references/reconstitution.md` | `/scd-sdd:migrate` uniquement — conversion d'un `docs/JOURNAL.md` monolithique et reconstitution depuis git |
