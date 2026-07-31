---
description: "Tableau de bord des features. Scanne specs/, dérive la phase de chacune depuis les fichiers, croise le verdict analyze du journal avec la date de modification des documents pour signaler les gates périmées, dit quoi lancer ensuite, et signale les features dont les fichiers touchés se recoupent. Lecture seule."
argument-hint: "(aucun — scanne specs/)"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(git log *)
---

## Contexte

Tu réponds à « **où j'en suis, côté specs ?** ». Le développeur reprend le projet après un
`/clear`, un jour ou une semaine, avec potentiellement plusieurs features à des stades
différents. Tu scannes, tu dérives, tu orientes.

Tu croises **deux sources**, et c'est tout l'intérêt de cette commande :

- **les fichiers**, qui donnent la phase courante — robuste, toujours à jour, rien à maintenir ;
- **`docs/JOURNAL.md`**, qui donne le seul fait que les fichiers ne portent pas : **le verdict
  de la gate `analyze`**, et son passage éventuel au `premortem`. Sans lui, une feature au
  `tasks.md` complet reste « à valider » pour toujours — on ne distingue pas un contrat jamais
  audité d'un contrat au vert.

Tu es la vue **détaillée du niveau specs**. La vue des trois niveaux est `/scd-sdd:status` ;
le détail des lots et la sûreté de merge des PR sont dans `/scd-sdd:status-impl`.

Ratio : 10% humain / 90% AI (lecture mécanique ; l'humain choisit la suite).

## Règles absolues

- **Lecture seule.** Tu ne modifies aucun fichier — **pas même `docs/JOURNAL.md`**. Tu joues
  aucune phase, donc tu ne consignes rien. C'est la seule catégorie de commande du plugin qui
  n'écrit pas au journal, et c'est de nature, pas un oubli.
- **Dérive l'état des fichiers**, jamais du contexte (il a été effacé) ni d'un fichier d'état
  (il dériverait).
- **Une ligne de journal n'est jamais un état.** C'est un événement daté. Tu ne l'affiches
  comme une gate valide qu'après le **contrôle de fraîcheur** ci-dessous.
- **Aucun état « livrée ».** La dernière phase dérivable est `analyze`. Tu ne dérives **rien**
  des cases de `tasks.md` : l'avancement des lots est le périmètre de `/scd-sdd:status-impl`.
- **Tu n'inventes aucune date.** Journal absent → colonne `Gate` à `—` et absence signalée.

## Processus

1. **Charge la référence** : `references/status.md` du skill `feature-specs`.

2. **Scanne `specs/`** : pour chaque `NNN-slug/`, applique la **table de dérivation de phase**
   du skill `feature-specs`, section « Cibler une feature ». Relève aussi le mode (`DELTA.md`
   présent → delta, sinon neuf).

3. **Lis `docs/JOURNAL.md`** s'il existe. Pour chaque feature, dans sa section `## NNN-slug`,
   relève la **dernière** ligne `analyze` (verdict + date) et la dernière ligne `premortem`.

4. **Contrôle la fraîcheur de chaque gate** — l'étape que rien d'autre ne rattrape. Compare la
   date de la ligne `analyze` à la dernière modification de `spec.md`, `plan.md` et
   `tasks.md` :

   ```bash
   git log -1 --format=%cI -- specs/NNN-slug/tasks.md
   ```

   Repli sur la mtime du fichier hors dépôt git, ou pour un fichier non encore commité.

   - Aucun document modifié après la gate → **✅ verdict valide**.
   - Un document modifié après → **⚠ verdict périmé** : affiche le fichier et sa date, et
     remets `/scd-sdd:analyze NNN` en prochaine commande.

5. **Croise les fichiers touchés** : si ≥ 2 features ont un `plan.md`, croise leurs sections
   « Fichiers touchés » et signale les **recoupements**. C'est une **note transmise à l'aval**
   (ces features ne s'implémenteront pas en parallèle sans branches séparées), pas une
   contrainte sur ce niveau-ci.

6. **Produis le tableau de bord** selon le bloc `<report>` de `references/status.md`, avec la
   **prochaine commande** de chaque feature, argument `NNN` inclus, prête à copier.

7. **Termine par une recommandation de cadence** : par défaut, finir la feature la plus avancée
   avant d'en ouvrir une nouvelle — en rappelant que documenter plusieurs features en parallèle
   est sans risque à ce niveau.

## Dégradations

- **`specs/` vide ou absent** → « Aucune feature. Démarre avec `/scd-sdd:kickoff-feature
  [feature]`. »
- **`docs/JOURNAL.md` absent** (projet démarré avant le journal) → tableau **complet mais sans
  colonne `Gate`**, et une ligne de pied qui le dit : « Pas de `docs/JOURNAL.md` — le verdict
  `analyze` n'est pas connaissable hors session. Il apparaîtra à la prochaine gate. » **Toi, tu
  ne le crées ni ne le reconstruis** : tu es en lecture seule. Projet venu des trois anciens
  plugins → renvoie vers `/scd-sdd:migrate`, la seule commande qui le crée.
- **Section `## NNN-slug` absente pour une feature existante** → `Gate : —`. Ce n'est pas une
  anomalie à corriger : la feature n'a simplement jamais été gatée.
- **Hors dépôt git** → repli sur la mtime, et signale que la fraîcheur est moins fiable (une
  copie de fichiers peut réinitialiser les mtime).

## Ce que tu NE fais PAS

- Tu ne lances aucune phase toi-même.
- **Tu n'écris rien**, ni dans les documents, ni dans le journal.
- Tu ne suis pas l'état du code, tu ne comptes pas les lots faits, tu n'interroges ni `gh` ni
  `glab` : c'est `/scd-sdd:status-impl`.
- Tu ne rejoues pas `analyze` pour « vérifier » un verdict périmé — tu le signales et tu
  renvoies.

## Skill active

- `feature-specs` — charge `references/status.md` ; table de dérivation dans la section
  « Cibler une feature ».
- `journal` — contrat de `docs/JOURNAL.md` (**lecture seule ici**).

## À la fin

Donne **une** prochaine commande recommandée, prête à copier — celle de la feature la plus
avancée, ou celle d'une gate périmée si elle existe (une gate périmée passe devant : le contrat
part sinon à l'implémentation sur un verdict qui ne vaut plus).

Rappelle les deux vues voisines : `/scd-sdd:status` pour les trois niveaux,
`/scd-sdd:status-impl` pour le détail des lots et des PR.
