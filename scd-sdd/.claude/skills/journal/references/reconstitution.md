# Référence — Reconstitution et conversion du journal

Chargée par `/scd-sdd:migrate` **seule**. Les 20 autres commandes qui chargent le skill `journal`
n'en ont aucun usage : c'est pourquoi elle ne vit pas dans le `SKILL.md`.

Deux opérations distinctes, toutes deux réservées à `migrate` :

- la **conversion** d'un `docs/JOURNAL.md` monolithique vers `docs/journal/*.md` — un déplacement,
  aucune ligne inventée ;
- la **reconstitution** d'une chronologie absente depuis l'historique git — des lignes neuves,
  mais datées d'un fait vérifiable.

<conversion>

## Conversion — `docs/JOURNAL.md` → `docs/journal/*.md`

Un projet démarré avant l'éclatement du journal a un `docs/JOURNAL.md` unique, à sections. Il est
éclaté en un fichier par cible. **Aucune ligne n'est réécrite** : la règle d'ajout n° 4 du skill
(« ne jamais réécrire ni supprimer une ligne passée ») protège contre la falsification de
l'histoire, pas contre son classement.

1. **Précondition.** `docs/JOURNAL.md` présent. S'il est absent, il n'y a rien à convertir — passer
   à la reconstitution.
2. **Une section, un fichier.** `## Socle` → `docs/journal/socle.md`. Chaque `## NNN-slug` →
   `docs/journal/NNN-slug.md`. Une section inconnue → **STOP** et demander ; on ne classe pas au
   jugé.
3. **Chaque fichier reçoit** le titre `# Journal — <socle|NNN-slug>`, le bloc de citation du
   gabarit, puis la table de la section, **lignes inchangées au caractère près**. Le titre `##` de
   la section disparaît : le fichier *est* la cible.
4. **Contrôle avant suppression.** Le nombre total de lignes de table dans `docs/journal/*.md` doit
   égaler celui de `docs/JOURNAL.md`. Sinon → **STOP**, on ne supprime rien.
5. **Puis seulement** supprimer `docs/JOURNAL.md`, dans le même commit que les créations.

Ce qui n'est **pas** converti : rien d'autre. La conversion ne crée aucun chantier, ne déduit
aucune ligne manquante, ne réordonne pas les lignes d'une section.

</conversion>

<reconstitution>

## Reconstitution — depuis l'historique git

Un projet démarré avant le journal — typiquement sous `scd-project-docs`, `scd-feature-specs` et
`scd-implement` — n'a aucune chronologie. Elle n'est pourtant pas perdue : **git la porte**.
`/scd-sdd:migrate` est la **seule** commande autorisée à écrire des lignes antérieures à son
exécution, et sous quatre conditions strictes.

1. **Le fichier cible doit être absent.** `docs/journal/<cible>.md` présent → aucune
   reconstitution pour cette cible, on n'y touche pas. C'est ce qui rend l'opération rejouable sans
   doubler de ligne.
2. **La date vient de git, jamais d'ailleurs** :
   `git log --diff-filter=A -1 --format=%cI -- <fichier>` (date d'**ajout**), repli
   `git log -1 --format=%cI -- <fichier>`. **Hors dépôt git, ou fichier non suivi → pas de ligne** :
   pas de mtime (une copie de fichiers les réinitialise), pas de date déduite.
3. **Une ligne exige un artefact sur disque**, et son contenu chiffré est **compté sur le
   fichier** — c'est un constat, pas un souvenir :

   | Artefact | Fichier de journal | Phase | Résultat |
   |---|---|---|---|
   | `docs/brief.md` | `socle.md` | `brief` | personas · SC · exclusions |
   | `docs/prd.md` | `socle.md` | `prd` | nb FR · nb SC |
   | `docs/stack.md` | `socle.md` | `stack` | choix structurants |
   | `docs/adr/NNNN-*.md` | `socle.md` | `adr` | **une seule ligne** — plage de numéros, datée du **dernier** ADR ajouté |
   | `docs/ci.md` | `socle.md` | `ci` | nb de contrôles bloquants · nb d'informatifs |
   | `CLAUDE.md` | `socle.md` | `contract` | nb de principes · taille de la DoD |
   | `specs/NNN-slug/` | `NNN-slug.md` | `kickoff-feature` | mode — `DELTA.md` présent → delta |
   | `…/spec.md` | `NNN-slug.md` | `specify` | nb FR · nb `[NEEDS CLARIFICATION]` |
   | `…/plan.md` | `NNN-slug.md` | `plan` | nb fichiers touchés |
   | `…/tasks.md` | `NNN-slug.md` | `tasks` | nb lots `Rn` · nb tâches `Tn` |

4. **Chaque ligne reconstituée est marquée** `· (reconstitué)` en fin de colonne *Résultat*, et les
   lignes d'un fichier sont triées **par date croissante**. La citation d'en-tête gagne alors une
   phrase : *« Les lignes marquées (reconstitué) ont été datées depuis l'historique git lors de la
   migration. »*

</reconstitution>

<non_reconstituable>

## Ce qui ne se reconstitue jamais

Quelle que soit la commande :

| Phase | Pourquoi |
|---|---|
| `clarify` | il édite `spec.md`, il n'a aucun artefact propre à dater |
| `analyze` · `premortem` | les faits non dérivables — aucune trace, ni disque ni git |
| `run` · `sync` · `reland` | les cases `[x]` de `tasks.md` disent **quels** lots sont faits, jamais **quand**, ni par quelle PR, ni combien de fois le lot a été bloqué avant |
| les **chantiers** | un chantier n'a laissé aucun artefact daté avant d'exister ; et il ne s'écrit pas au journal |

Un journal reconstitué est donc **partiel par construction**, et c'est correct : il rend la
chronologie des artefacts, pas une histoire inventée. Les phases manquantes apparaîtront à leur
prochaine exécution.

</non_reconstituable>
