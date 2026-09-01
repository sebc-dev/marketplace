---
description: "Où en est le projet, en une lecture : le socle (les trois artefacts, la vision si elle existe, et l'état des gardes), les features et leurs tickets, les PR ouvertes avec leur SÛRETÉ DE MERGE (OK, DANGEREUX, EMPILÉ EN ATTENTE, ORPHELIN), les chantiers ouverts, et le compte des tentatives bloquées par les gardes. Tout est DÉRIVÉ des fichiers et de la forge — aucun fichier d'état, aucun journal. Donne UNE prochaine commande. Lecture seule : n'écrit rien, et n'a aucun outil pour le faire."
argument-hint: "[NNN|slug — optionnel, sinon tout le projet]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(git fetch *)
  - Bash(git symbolic-ref *)
  - Bash(git merge-base *)
  - Bash(git rev-parse *)
  - Bash(git show *)
  - Bash(git ls-remote *)
  - Bash(git log *)
  - Bash(gh pr list *)
  - Bash(gh pr view *)
  - Bash(glab mr list *)
  - Bash(glab mr view *)
---

## Contexte

Tu réponds à **« où en est ce projet, et qu'est-ce que je lance maintenant ? »**. C'est le point
d'entrée après un `/clear`, ou après une semaine d'absence.

**Tout se dérive.** Les fichiers disent l'état du socle et des features ; la forge dit l'état des PR ;
les fiches de `docs/chantiers/` disent ce qu'un `/clear` a interrompu ; `.claude/guard-log.jsonl` dit
ce que l'agent a tenté d'écrire et n'a pas pu. **Il n'y a aucun fichier d'état à maintenir, et il n'y
a plus de journal** (`DECISIONS.md` §D41) : une session qui en chercherait un chercherait un fichier
qui n'existe pas.

Cette commande a remplacé trois tableaux de bord (`status`, `status`, `status`). Elle rend
**un** rapport, et son argument le restreint à une feature.

Ratio : 10% humain / 90% AI (lecture mécanique ; l'humain choisit la suite).

## Règles absolues

- **Tu n'écris rien.** Ton `allowed-tools` n'a ni `Write`, ni `Edit`, ni aucune commande git qui
  modifie — c'est la **preuve**, pas une phrase de ce corps.
- **Tu ne devines aucun état.** Un fait que tu ne peux pas dériver se dit **inconnu**, jamais
  supposé. C'est particulièrement vrai des PR quand ni `gh` ni `glab` n'est disponible.
- **Une seule prochaine commande.** Trois suggestions valent zéro suggestion. S'il y a plusieurs
  fronts, nomme celui qui débloque le reste et **dis pourquoi**.
- **Une PR non classée n'existe pas.** Chaque PR ouverte reçoit sa classe de sûreté ; « je n'ai pas
  pu déterminer » est une classe et se dit.
- **Un ID se cite avec son intitulé** à sa première mention — « 03 (export CSV vide) », jamais
  « 03 » nu. La règle vaut pour **tout** identifiant que tu emploies.
- **Tu parles la langue de l'humain.**

## Définitions

- **Ticket démarrable** — à faire ou en cours, et **tous** ses bloqueurs sont faits.
- **PR empilée** — sa base n'est pas la branche par défaut mais la branche d'un autre ticket.
- **Orphelin** — un ticket dont la PR a été mergée dans une branche de ticket intermédiaire
  (cul-de-sac) au lieu de la branche par défaut : **son code est absent de `main`**.

## Processus

1. **Charge le skill `specs`** pour la table « Cibler une feature » et la dérivation d'état, et le
   skill `implement` (`references/tickets-parsing.md`, blocs `<etats>` et `<resolution>`).
   Communique en français.

2. **Le socle** — présence de `docs/adr/` *(et le compte d'ADR)*, `docs/ci.md`, `CLAUDE.md`. Puis
   `docs/vision.md`, **optionnel** *(présent, on le constate — et on peut compter ses epics — absent,
   ce n'est pas un manque : aucune alarme, aucun renvoi)*. Puis les **gardes** :
   `.claude/guards.json` existe-t-il, combien de chemins protège-t-il, et `.claude/guard-log.jsonl`
   porte combien de lignes ? **Un socle incomplet se dit avant tout le reste** : il change la valeur
   de tout ce qui suit.

3. **Les features.** `specs/*/` ; pour chacune, l'état selon la table du skill `specs`, puis, si
   elle a des tickets : combien de faits, combien démarrables, lesquels bloqués et par quoi.
   ⚠️ **Signale les features dont les lignes `Fichiers :` se recoupent** — deux features actives sur
   les mêmes fichiers est le conflit qu'on découvre au merge, jamais avant.

4. **Les PR.** `git fetch`, puis `gh pr list` / `glab mr list`. Pour chaque PR de ticket ouverte,
   classe-la :

   | Classe | Condition | Ce que ça veut dire |
   |---|---|---|
   | **OK** | base = branche par défaut | mergeable telle quelle |
   | **DANGEREUX** | base = branche d'un ticket **déjà mergé** | merger **orphelinerait** ce code — rebaser d'abord (`/scd-sdd:sync`) |
   | **EMPILÉ EN ATTENTE** | base = branche d'un ticket **non mergé** | normal ; attendre que la base soit mergée |
   | **ORPHELIN** | mergée, mais son code est absent de la branche par défaut | rattraper (`/scd-sdd:reland`) |
   | **INCONNU** | ni `gh` ni `glab`, ou la base ne se résout pas | dis-le, ne suppose pas |

   Un **orphelin** se détecte en croisant l'état « mergée » de la PR et l'absence de son contenu à
   `origin/<défaut>` — les critères cochés du ticket sont le signal le plus simple.

5. **Les chantiers.** `docs/chantiers/en-cours/` et `en-attente/` : titre, `Portée`, date
   d'actualisation. **C'est ici que vivent les runs bloqués** : un `/scd-sdd:run` qui échoue ne coche
   aucun critère et n'ouvre aucune PR — sans sa fiche, il serait indiscernable d'un ticket jamais
   lancé. Une fiche dont la `Portée` nomme un ticket est donc un fait de premier ordre.

6. **La trace des gardes.** Si `.claude/guard-log.jsonl` n'est pas vide : le **compte**, la règle la
   plus fréquente, la date de la plus récente. Une ligne, pas un tableau — le détail est un fichier
   que l'humain ouvre, et `/scd-sdd:guards` le déroule.

7. **Une prochaine commande**, et une seule.

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
ADR        : [N] · docs/ci.md : [oui|MANQUANT] · CLAUDE.md : [oui|MANQUANT] · docs/vision.md : [oui|absent] (optionnel)
Gardes     : [N chemins protégés | ABSENTS] · trace : [N] tentatives [depuis date]

## Features
| Feature | État | Tickets | Démarrables |
|---|---|---|---|
| 001-auth | en implémentation | 3/5 faits | 04 |
[⚠ recoupement de fichiers entre … et … : à dire ici]

## PR ouvertes
| PR | Ticket | Base | Sûreté |
|---|---|---|---|
| #12 | 03 (export CSV vide) | main | OK |
| #13 | 04 (…) | impl/auth-03 | DANGEREUX — 03 est mergé, rebaser |

## Chantiers
[titre — portée — actualisé le … | « aucun »]

## Prochaine commande
`/scd-sdd:…`  — [pourquoi celle-là, en une phrase]
```

</report>

## Skill active

- Skill `specs` — section « Cibler une feature » et dérivation d'état, **référencées** et jamais
  recopiées.
- Skill `implement` — `references/tickets-parsing.md`, blocs `<etats>` et `<resolution>`.
- Skill `chantier` — pour lire l'en-tête d'une fiche. **Pas** ses références d'écriture : tu ne
  produis aucune fiche.

## À la fin

Rien de plus que le rapport. La prochaine commande **est** la conclusion : ne la répète pas, et
n'en ajoute pas une seconde.
