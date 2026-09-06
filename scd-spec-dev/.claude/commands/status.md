---
description: "Où en est le projet, en une lecture : le socle (OpenSpec monté, le schéma scd, config.yaml, les docs durables et le filet CI), les changes et leurs tickets (dérivés d'openspec list + tickets/), les PR ouvertes avec leur SÛRETÉ DE MERGE (OK, DANGEREUX, EMPILÉ EN ATTENTE, ORPHELIN), et les chantiers ouverts. Tout est DÉRIVÉ des fichiers et de la forge — aucun fichier d'état, aucun journal. Donne UNE prochaine commande. Lecture seule : n'écrit rien, et n'a aucun outil pour le faire."
argument-hint: "[<change> — optionnel, sinon tout le projet]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(openspec:*)
  - Bash(git fetch *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git rev-parse *)
  - Bash(git show *)
  - Bash(git ls-remote *)
  - Bash(git log *)
  - Bash(ls *)
  - Bash(gh pr list *)
  - Bash(gh pr view *)
  - Bash(glab mr list *)
  - Bash(glab mr view *)
---

## Ce que fait cette commande

Tu réponds à **« où en est ce projet, et qu'est-ce que je lance maintenant ? »**. C'est le point
d'entrée après un `/clear`, ou après une semaine d'absence.

**Tout se dérive.** OpenSpec dit l'état des changes (`openspec list`) ; les fichiers `tickets/` disent
le découpage ; la forge dit l'état des PR ; les fiches de `docs/chantiers/` disent ce qu'un `/clear` a
interrompu. **Il n'y a aucun fichier d'état à maintenir, et il n'y a pas de journal** : une session qui
en chercherait un chercherait un fichier qui n'existe pas. Ce plugin est **0-gate, 0-hook de session**
: il n'y a donc **pas** de trace de gardes à dérouler — le seul garde-fou automatique est le filet CI,
hors boucle de dev.

Ratio : ~10 % humain / 90 % IA (lecture mécanique ; l'humain choisit la suite).

## Règles absolues

- **Tu n'écris rien.** Ton `allowed-tools` n'a ni `Write`, ni `Edit`, ni aucune commande git qui
  modifie — c'est la **preuve**, pas une phrase de ce corps.
- **Tu ne devines aucun état.** Un fait que tu ne peux pas dériver se dit **inconnu**, jamais supposé.
  C'est particulièrement vrai des PR quand ni `gh` ni `glab` n'est disponible.
- **Une seule prochaine commande.** Trois suggestions valent zéro suggestion. S'il y a plusieurs
  fronts, nomme celui qui débloque le reste et **dis pourquoi**.
- **Une PR non classée n'existe pas.** Chaque PR ouverte reçoit sa classe de sûreté ; « je n'ai pas pu
  déterminer » est une classe et se dit.
- **Un ID se cite avec son intitulé** à sa première mention — « 02 (export CSV vide) », jamais « 02 »
  nu. La règle vaut pour **tout** identifiant que tu emploies.
- **Tu parles la langue de l'humain.**

## Définitions

- **Ticket démarrable** — à faire ou en cours, et **tous** ses `**Bloqué par :**` sont faits.
- **PR empilée** — sa base n'est pas la branche par défaut mais la branche d'un autre ticket.
- **Orphelin** — un ticket dont la PR a été mergée dans une branche de ticket intermédiaire
  (cul-de-sac) au lieu de la branche par défaut : **son code est absent de `main`**.

## Processus

1. **Charge le skill `implement`** pour le parsing du ticket (états, `**Bloqué par :**`) et les
   définitions de l'anti-orphelinage. Communique en français.

2. **Le socle durable.** OpenSpec est-il monté (`openspec/` présent, `openspec list` répond) ? Le
   `openspec/config.yaml` déclare-t-il `schema: scd` et un bloc `context` ? Les docs durables pointées
   par `config.yaml` : `docs/vision.md`, `docs/roadmap.md`, les caps (`docs/architecture.md`, test,
   sécurité, `docs/design-system.md`), `docs/ci.md`. Puis `docs/adr/` *(et le compte d'ADR)*. Enfin le
   **filet CI** (le job grep des escape-hatches) : présent ? **Un socle incomplet se dit avant tout le
   reste** — il change la valeur de tout ce qui suit. Ce qui manque se répare par `/scd-spec-dev:setup`.

3. **Les changes.** `openspec list` pour l'état OpenSpec de chaque change. Pour chacun (ou le seul
   `<change>` en argument), s'il a des tickets (`openspec/changes/<x>/tickets/`) : combien de faits,
   combien démarrables, lesquels bloqués et par quoi.
   ⚠️ **Signale les changes dont les lignes `**Fichiers :**` se recoupent** — deux changes actifs sur
   les mêmes fichiers est le conflit qu'on découvre au merge, jamais avant.

4. **Les PR.** `git fetch`, puis `gh pr list` / `glab mr list`. Pour chaque PR de ticket ouverte,
   classe-la :

   | Classe | Condition | Ce que ça veut dire |
   |---|---|---|
   | **OK** | base = branche par défaut | mergeable telle quelle |
   | **DANGEREUX** | base = branche d'un ticket **déjà mergé** | merger **orphelinerait** ce code — rebaser d'abord (`/scd-spec-dev:sync`) |
   | **EMPILÉ EN ATTENTE** | base = branche d'un ticket **non mergé** | normal ; attendre que la base soit mergée |
   | **ORPHELIN** | mergée, mais son code est absent de la branche par défaut | rattraper (`/scd-spec-dev:reland`) |
   | **INCONNU** | ni `gh` ni `glab`, ou la base ne se résout pas | dis-le, ne suppose pas |

   Un **orphelin** se détecte en croisant l'état « mergée » de la PR et l'absence de son contenu à
   `origin/<défaut>` — les critères cochés du ticket sont le signal le plus simple.

5. **Les chantiers.** `docs/chantiers/en-cours/` et `en-attente/` : titre, `Portée`, date
   d'actualisation. **C'est ici que vivent les runs bloqués** : un `/scd-spec-dev:run` qui échoue ne
   coche aucun critère et n'ouvre aucune PR — sans sa fiche, il serait indiscernable d'un ticket jamais
   lancé. Une fiche dont la `Portée` nomme un ticket est donc un fait de premier ordre.

6. **Une prochaine commande**, et une seule.

## Ce que tu NE fais PAS

- Tu **n'écris aucun fichier**, ne commites rien, ne pousses rien, ne merges rien.
- Tu **ne relances aucune commande** du cycle — tu dis laquelle jouer.
- Tu **ne rejoues aucune vérification** : tu ne lances ni tests, ni lint, ni build.
- Tu **ne scannes pas les worktrees**. Un travail en vol se déclare par une fiche de chantier ; s'il
  n'y en a pas, il est invisible, et **c'est un fait que tu peux dire** plutôt qu'un trou à combler.

<report>

```
# [Projet] — [date]

## Socle
OpenSpec   : [monté | ABSENT] · schéma scd : [oui | MANQUANT] · config.yaml context : [oui | MANQUANT]
Docs       : vision [o/absent] · roadmap [o/absent] · architecture [o/absent] · ci.md [o/MANQUANT] · ADR [N]
Filet CI   : [présent | ABSENT] (grep escape-hatches, hors boucle de dev)

## Changes
| Change | État OpenSpec | Tickets | Démarrables |
|---|---|---|---|
| export-csv | en cours | 2/4 faits | 03 |
[⚠ recoupement de fichiers entre … et … : à dire ici]

## PR ouvertes
| PR | Ticket | Base | Sûreté |
|---|---|---|---|
| #12 | 02 (export CSV vide) | main | OK |
| #13 | 03 (…) | impl/export-csv-vide-02 | DANGEREUX — 02 est mergé, rebaser |

## Chantiers
[titre — portée — actualisé le … | « aucun »]

## Prochaine commande
`/scd-spec-dev:…`  — [pourquoi celle-là, en une phrase]
```

</report>

## Skills actifs

- `implement` — parsing du ticket (états, `**Bloqué par :**`) et définitions de l'anti-orphelinage,
  **référencés** et jamais recopiés.
- `openspec` — la dérivation de l'état des changes depuis `openspec list` (aucun fichier d'état, aucun
  journal) et le socle durable.
- `chantier` — pour lire l'en-tête d'une fiche sous contrôle de fraîcheur. **Pas** ses références
  d'écriture : tu ne produis aucune fiche.

## À la fin

Rien de plus que le rapport. La prochaine commande **est** la conclusion : ne la répète pas, et n'en
ajoute pas une seconde.
