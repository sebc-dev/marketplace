---
description: "Reprend un chantier après un /clear : sélectionne la fiche (par argument, sinon par branche courante — le cas worktree), contrôle sa fraîcheur (ancre git, âge, prochaine étape déjà faite), recharge SON manifeste de contexte — la liste de références que la fiche déclare — selon la classe de chacune, puis rend ses comptes. Peut aussi mettre le chantier en attente, le fermer ou l'abandonner par git mv. Le point d'entrée quand on rouvre un travail suspendu."
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
  - Bash(date *)
---

## Contexte

Une fiche de chantier dit ce que quelqu'un **allait faire**, à une date, depuis une branche. Elle
peut donc avoir vieilli : le dépôt a bougé, l'étape a déjà été franchie, la branche n'existe plus.

Tu la sélectionnes, tu la **contrôles avant de la croire**, tu recharges exactement le contexte
qu'elle désigne — ni plus, ni moins — et tu rends la main pour le travail.

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
- **Le problème avant les options.** Avant de demander la suite, dis en deux ou trois phrases ce
  qui est en jeu : la fiche est-elle encore fiable, son étape est-elle déjà franchie. Chaque
  option décrit sa **conséquence concrète** — ce qui bouge sur disque, ce qui se reprend, ce qui
  ne se reprend plus —, jamais en jargon. Une option énoncée sans son enjeu ne se choisit pas,
  elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain —
  chantier, portée, ancre, manifeste, fraîcheur, consommé… — reçoit une glose d'**une ligne**,
  entre parenthèses ou entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout
  dès que l'humain emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une
  question.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Processus

1. **Sélectionne la fiche** selon la section « Cibler un chantier » du skill `chantier` —
   **chargée, donc jamais recopiée ici**.

   Aucune fiche nulle part → dis-le, renvoie vers `/scd-sdd:status`, et **rien d'autre**. Tu n'en
   crées pas : c'est `/scd-sdd:pause`.

2. **Contrôle la fraîcheur** — la table des trois contrôles du skill `chantier`, appliquée telle
   quelle. Un ✔ consommé → propose la fermeture d'emblée. **Retiens les trois verdicts** : ils
   commandent la restitution, et ils décident seuls du chargement de l'étape 6.

3. **Vérifie chaque affirmation** de `## Acquis` et `## Prochaine étape` contre les fichiers, dans
   la mesure du possible. Ce qui se vérifie est rendu comme un fait ; ce qui ne se vérifie pas est
   rendu **entre guillemets**, attribué à la fiche.

4. **Recharge le contexte**, classe par classe. Charge `chantier/references/manifeste.md`, blocs
   **`<classes>` `<lecture>` `<delegation>`** et **eux seuls** — `<regle_maitresse>` et
   `<controles>` gouvernent l'**écriture** d'un manifeste, travail de `/scd-sdd:pause`. La table de
   `<classes>` dit ce que chaque classe devient ; applique-la sans la réinterpréter.

   Deux règles à toi : une ligne `à déléguer` **sans question** est invalide — signale-la et ne
   charge rien ; une cible **disparue** est **signalée**, pas cherchée ailleurs.

5. **Rends tes comptes** en une ligne, puis restitue : l'objectif, l'acquis vérifié, la prochaine
   étape, et les pistes écartées — celles-ci intégralement, ce sont elles qui évitent de
   ré-explorer.

6. **Demande la suite** (`AskUserQuestion`). **Pose d'abord le problème en une ou deux phrases** —
   ce que les contrôles viennent de dire de cette fiche, et ce que ça change : une fiche à jour
   se reprend, une fiche consommée se referme, une fiche suspecte se relit avant d'être suivie.

   **Charge `exposition` — régime *options* — si et seulement si l'étape 2 a rendu au moins un ⚠ ou
   un ✔ consommé** : il y a alors un arbitrage réel, *suivre une intention désancrée ou la
   refermer*. Fraîche sur les trois, la fiche n'en ouvre aucun — « reprendre » est l'issue évidente
   et les options ci-dessous portent déjà leur conséquence. La condition ne se mesure pas : elle est
   **déjà rendue** à l'étape 2.

   Puis les quatre options, **chacune avec sa conséquence dite en clair**, jamais réduite à son
   `git mv` :

   - **reprendre** — « on continue maintenant ». Rien ne bouge sur disque, la fiche reste ouverte
     et tu rends la main sur la prochaine étape ;
   - **mettre en attente** — « on y revient plus tard, pas aujourd'hui ». `git mv` vers
     `en-attente/`. **C'est réversible** : la fiche garde son contexte, un `resume` la rouvre ;
   - **fermer** — « c'est fait ». Tu ajoutes `## Issue` (ce qui a été fait, le commit ou la PR),
     puis `git mv` vers `archive/`. La fiche ne se reprend plus, elle se relit ;
   - **abandonner** — « on ne le fera pas ». Tu ajoutes `## Issue` disant que le chantier est
     abandonné **et pourquoi**, puis `git mv` vers `archive/`. Même effet que fermer, motif
     opposé — et c'est le motif qui fera la valeur de la fiche dans six mois.

   Dis explicitement, à la première invocation, ce que les deux dernières ont en commun et ce qui
   les sépare de la deuxième : **`en-attente/` se rouvre, `archive/` non**. C'est la seule
   confusion coûteuse de cette question. Aucune option ne supprime quoi que ce soit.

   Tout déplacement est suivi de `git add` scopé et d'un commit `chore(chantier): <action> <titre>`.

7. **Si la portée nomme une feature ou un lot**, donne la commande du cycle qui suit —
   `/scd-sdd:run NNN Rn`, par exemple. **Tu ne la lances pas.**

<report>
```
⏸ Chantier repris — « Verrouillage du compte après 5 échecs »
   Portée 001-auth · lot R2 · posé le 04/08, actualisé le 05/08 sur `impl/auth-R2`
   Fraîcheur : ✔ même branche qu'à l'écriture · ✔ 1 j · prochaine étape pas encore faite

Contexte rechargé — 2 fichiers lus (118 l.) · 1 extrait ciblé (class RateLimiter)
                    · 1 question déléguée · 2 repères signalés, non chargés

Objectif       Faire passer FR-004 au vert sans toucher au middleware de session.
Acquis         Le rate-limit passe en local (vérifié).
               « Compteur décidé dans la table login_attempt, pas le cache. »
Prochaine       Écrire le test rouge `locks_after_fifth_failure` dans
étape           test/auth/lockout.test.ts — non présent à ce jour.
Écarté         Redis (absent de docs/technique.md) · middleware rateLimit (compte par IP).
```

La ligne `Contexte rechargé` **dit ce que chaque classe a fait**, elle ne récite pas ses noms — la
correspondance est dans le bloc `<lecture>` du manifeste.

Une fiche **suspecte** remplace la ligne `Fraîcheur` par, par exemple :
`⚠ suspect — la fiche a été écrite sur impl/auth-R2, tu es sur main, et le dépôt a avancé
ailleurs depuis (HEAD a1b2c3d n'est plus un ancêtre)`, et le rapport ajoute en pied :
« L'intention tient peut-être, l'ancrage non — relis avant de suivre. »
</report>

## Ce que tu NE fais PAS

- Tu n'écris aucun contenu de document, tu ne joues aucune phase, tu ne lances aucune gate.
- Tu ne lances pas la commande de cycle que tu recommandes.
- Tu ne remplaces pas une fiche fermée par un fichier vide « consommé » : un fichier vide est un
  fichier d'état à zéro. **Le déplacement dans `archive/` est le signal.**
- Tu ne renommes aucune fiche.
- Tu ne crées pas de chantier — c'est `/scd-sdd:pause`.
- Tu ne récrits pas l'histoire d'une fiche : `## Acquis` et `## Écarté` se complètent, jamais ne
  se corrigent rétroactivement.

## Consigne au journal

**Aucune.** Reprendre, mettre en attente ou fermer un chantier n'est pas une phase du cycle, et le
déplacement de la fiche **est** la trace — l'archive datée par son nom porte la chronologie.
Journaliser chaque pause et chaque reprise polluerait la chronologie des
phases avec du bruit à la paire. C'est de nature, pas un oubli.

## Skill active

- `chantier` — contrat de `docs/chantiers/` : § « Cibler un chantier », § « Contrôle de
  fraîcheur », anatomie de la fiche, cycle de vie. Charge `references/manifeste.md`, blocs
  **`<classes>` `<lecture>` `<delegation>`** et eux seuls. **Pas** `references/fiche.md` : tu ne
  rédiges aucune fiche — tu ajoutes au plus un `## Issue` à la fermeture.
- `exposition` — **régime *options***, **conditionnel** : chargé à l'étape 6 **seulement si**
  l'étape 2 a rendu au moins un ⚠ suspect, ⚠ ancien ou ✔ consommé. Aucune `references/`. Les quatre
  suites sont des issues concurrentes, pas une liste à trier.
- **Pas `feature-specs`.** La `Portée` de la fiche est **déjà résolue** (`001-auth · lot R2`) : tu
  la lis, tu ne la résous pas. « Cibler une feature » répond à *quelle feature est en cours après
  un `/clear`* — question que tu n'as pas. Un `Glob specs/NNN-*/` suffit à vérifier l'existence.

## À la fin

Donne la prochaine action, prête à copier : la commande du cycle si la portée en désigne une,
sinon la reprise du travail décrit par la fiche.

Si la fiche est ressortie **⚠ suspecte**, **⚠ ancienne** ou **✔ consommée**, dis-le en une ligne et
propose `/scd-sdd:resume` → « fermer » plutôt que de la suivre.
