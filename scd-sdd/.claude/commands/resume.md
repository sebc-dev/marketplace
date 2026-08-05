---
description: "Reprend un chantier après un /clear : sélectionne la fiche (par argument, sinon par branche courante — le cas worktree), contrôle sa fraîcheur (ancre git, âge, prochaine étape déjà faite), recharge SON manifeste de contexte selon la classe de chaque référence, puis rend ses comptes. Peut aussi mettre le chantier en attente, le fermer ou l'abandonner par git mv. Le point d'entrée quand on rouvre un travail suspendu."
argument-hint: "[fragment de slug ou date — optionnel, résolu par la branche courante sinon]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Edit
  - Task
  - AskUserQuestion
  - Bash(git rev-parse *)
  - Bash(git merge-base *)
  - Bash(git log *)
  - Bash(git mv *)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(ls *)
  - Bash(date *)
---

## Contexte

Une fiche de chantier dit ce que quelqu'un **allait faire**, à une date, depuis une branche. Elle
peut donc avoir vieilli : le dépôt a bougé, l'étape a déjà été franchie, la branche n'existe plus.

Tu la sélectionnes, tu la **contrôles avant de la croire**, tu recharges exactement le contexte
qu'elle désigne — ni plus, ni moins — et tu rends la main pour le travail. Le manifeste sépare le
suivi du contexte : c'est toi qui honores cette séparation, référence par référence.

Ratio : 15% humain / 85% AI (sélection et contrôles mécaniques ; l'humain décide de la suite).

## Règles absolues

- **Tu contrôles la fraîcheur avant de restituer quoi que ce soit.** Une fiche est une intention
  datée, pas un état. Ce que tu ne peux pas vérifier contre les fichiers, tu le rends **comme une
  citation**, jamais comme un fait.
- **Tu honores la classe de chaque référence, sans exception.** Une ligne `à situer` ne se charge
  **pas**, même si elle paraît utile. Si elle l'est vraiment, la fiche était mal classée : dis-le,
  corrige-la, et continue.
- **Tu rends tes comptes de chargement** avant de reprendre le travail. Sans ce compte rendu, un
  manifeste qui coûte trop cher ne se remarque jamais.
- **Tu ne devines jamais la cible.** 0 ou ≥ 2 candidates sans correspondance de branche → tu listes
  et tu demandes.
- **Une fiche ne bloque rien.** Périmée, suspecte ou consommée, tu le signales et tu continues ; tu
  ne STOP jamais à cause d'elle.
- **Changer d'état est un `git mv`**, suivi d'un commit scopé. Tu ne réécris pas l'état dans la
  fiche — il n'y a pas de champ `État :`.
- **Tu ne supprimes jamais une fiche.** Fermer ou abandonner, c'est déplacer vers `archive/` :
  l'archive est la chronologie du hors-cycle.

## Définitions

- **Ancre** : le couple `branche` / `HEAD` enregistré dans l'en-tête de la fiche. Il sert au
  contrôle de fraîcheur **et** à la sélection par worktree.
- **Consommée** : la `Prochaine étape` de la fiche est déjà faite sur disque. La fiche a rempli son
  office ; il faut la refermer, pas la suivre.

## Processus

1. **Sélectionne la fiche** selon la section « Cibler un chantier » du skill `chantier` —
   référencée, jamais recopiée. En résumé : argument → fragment de slug ou date ; sinon la fiche de
   `en-cours/` dont le champ `branche` vaut la branche courante (**le cas worktree**) ; sinon
   l'unique fiche de `en-cours/`, annoncée ; sinon liste et `AskUserQuestion`.

   Aucune fiche nulle part → dis-le, renvoie vers `/scd-sdd:status`, et **rien d'autre**. Tu n'en
   crées pas : c'est `/scd-sdd:pause`.

2. **Contrôle la fraîcheur** — les trois contrôles du skill `chantier`, indépendants :
   - **ancre** : `git rev-parse --abbrev-ref HEAD` ≠ champ `branche`, ou
     `git merge-base --is-ancestor <HEAD enregistré> HEAD` ≠ 0 → **⚠ suspect** ;
   - **âge** : `Actualisé le` à plus de 14 jours → **⚠ ancien** ;
   - **consommation** : la `Prochaine étape` nomme un fichier, un test, un symbole — vérifie-le
     contre les fichiers. Déjà fait → **✔ consommé**, et propose la fermeture d'emblée.

   Une fiche peut être à jour en âge et suspecte en ancre : affiche les deux.

3. **Vérifie chaque affirmation** de `## Acquis` et `## Prochaine étape` contre les fichiers, dans
   la mesure du possible. Ce qui se vérifie est rendu comme un fait ; ce qui ne se vérifie pas est
   rendu **entre guillemets**, attribué à la fiche.

4. **Recharge le contexte**, classe par classe (`chantier/references/manifeste.md`) :
   - `à lire` → `Read` intégral ;
   - `à extraire` → `Grep` / `Read` par offset sur **l'ancre seule**, jamais le fichier entier ;
   - `à déléguer` → délègue à **`chantier-reader`** (outil `Task`) en lui passant la cible et la
     question, **rien d'autre**. Une ligne `à déléguer` sans question est invalide : signale-la et
     ne charge rien ;
   - `à situer` → **ne charge rien**. Mentionne son existence, c'est tout.

   Une cible disparue depuis l'écriture de la fiche est **signalée**, pas cherchée ailleurs.

5. **Rends tes comptes** en une ligne, puis restitue : l'objectif, l'acquis vérifié, la prochaine
   étape, et les pistes écartées — celles-ci intégralement, ce sont elles qui évitent de
   ré-explorer.

6. **Demande la suite** (`AskUserQuestion`) :
   - **reprendre** — tu ne déplaces rien, le travail continue, la fiche reste dans `en-cours/` ;
   - **mettre en attente** — `git mv` vers `en-attente/` ;
   - **fermer** — ajoute `## Issue` (ce qui a été fait, le commit ou la PR), puis `git mv` vers
     `archive/` ;
   - **abandonner** — ajoute `## Issue` disant que le chantier est abandonné et pourquoi, puis
     `git mv` vers `archive/`.

   Tout déplacement est suivi de `git add` scopé et d'un commit `chore(chantier): <action> <titre>`.

7. **Si la portée nomme une feature ou un lot**, donne la commande du cycle qui suit —
   `/scd-sdd:run NNN Rn`, par exemple. **Tu ne la lances pas.**

<report>
```
⏸ Chantier repris — « Verrouillage du compte après 5 échecs »
   001-auth · lot R2 · posé le 04/08, actualisé le 05/08 sur `impl/auth-R2`
   Fraîcheur : ✔ ancre à jour · ✔ 1 j · prochaine étape non faite

Contexte chargé — 2 fichiers / 118 l. · 1 extraction (class RateLimiter) · 1 délégation · 2 situés

Objectif       Faire passer SHALL-4 au vert sans toucher au middleware de session.
Acquis         Le rate-limit passe en local (vérifié).
               « Compteur décidé dans la table login_attempt, pas le cache. »
Prochaine       Écrire le test rouge `locks_after_fifth_failure` dans
étape           test/auth/lockout.test.ts — non présent à ce jour.
Écarté         Redis (absent de docs/stack.md) · middleware rateLimit (compte par IP).
```

Une fiche **suspecte** remplace la ligne `Fraîcheur` par, par exemple :
`⚠ suspect — enregistrée sur impl/auth-R2, tu es sur main ; HEAD a1b2c3d n'est plus ancêtre`,
et le rapport ajoute en pied : « L'intention tient peut-être, l'ancrage non — relis avant de
suivre. »
</report>

## Ce que tu NE fais PAS

- Tu n'écris aucun contenu de document, tu ne joues aucune phase, tu ne lances aucune gate.
- Tu ne lances pas la commande de cycle que tu recommandes.
- Tu ne charges pas une référence `à situer`, ni le fichier entier d'une référence `à extraire`.
- Tu ne remplaces pas une fiche fermée par un fichier vide « consommé » : un fichier vide est un
  fichier d'état à zéro. **Le déplacement dans `archive/` est le signal.**
- Tu ne supprimes aucune fiche, tu ne renommes aucune fiche.
- Tu ne crées pas de chantier — c'est `/scd-sdd:pause`.
- Tu ne récrits pas l'histoire d'une fiche : `## Acquis` et `## Écarté` se complètent, jamais ne
  se corrigent rétroactivement.

## Consigne au journal

**Aucune.** Reprendre, mettre en attente ou fermer un chantier n'est pas une phase du cycle, et le
déplacement de la fiche **est** la trace — l'archive datée par son nom porte la chronologie
(`DECISIONS.md` §D18). Journaliser chaque pause et chaque reprise polluerait la chronologie des
phases avec du bruit à la paire. C'est de nature, pas un oubli.

## Skill active

- `chantier` — contrat de `docs/chantiers/` : § « Cibler un chantier », § « Contrôle de
  fraîcheur », cycle de vie. Charge `references/manifeste.md` pour les quatre classes.
- `feature-specs` — section « Cibler une feature », si la portée doit être rattachée à une feature.

## À la fin

Donne la prochaine action, prête à copier : la commande du cycle si la portée en désigne une,
sinon la reprise du travail décrit par la fiche.

Si la fiche est ressortie **⚠ suspecte**, **⚠ ancienne** ou **✔ consommée**, dis-le en une ligne et
propose `/scd-sdd:resume` → « fermer » plutôt que de la suivre.
