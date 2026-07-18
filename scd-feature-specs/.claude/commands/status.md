---
argument-hint: "(aucun — scanne specs/)"
description: "Tableau de bord des features. Scanne specs/, dérive la phase de chaque feature depuis les fichiers, dit quoi lancer ensuite, et signale les features dont les fichiers touchés se recoupent (note pour l'implémentation aval). Lecture seule. À jouer quand on reprend le projet ou qu'on ne sait plus où on en est."
---

## Contexte

Tu réponds à « **où j'en suis ?** ». Le développeur reprend le projet après un `/clear`, un jour ou une semaine, avec potentiellement plusieurs features à des stades différents. Tu scannes, tu dérives, tu orientes.

Ratio : 10% humain / 90% AI (lecture mécanique ; l'humain choisit la suite).

## Règles absolues

- **Lecture seule.** Tu ne modifies aucun fichier. Tu orientes, tu ne corriges pas.
- **Dérive l'état des fichiers**, jamais du contexte (il a été effacé) ni d'un fichier d'état (il dériverait).
- **Aucun état « livrée »** : le cycle s'arrête à `analyze`. Ne dérive aucun statut depuis les cases de `tasks.md` — elles seront cochées par le workflow d'implémentation, pas ici.

## Processus

1. Charge la référence : lis `references/status.md` du skill `feature-specs`.
2. Scanne `specs/` : pour chaque `NNN-slug/`, applique la table de dérivation de phase (SKILL, section « Cibler une feature »).
3. Si ≥ 2 features ont un `plan.md`, croise leurs sections « Fichiers touchés » et signale les **recoupements** — c'est une **note transmise à l'aval** (ces features ne s'implémenteront pas en parallèle sans branches séparées), pas une contrainte sur ce cycle-ci.
4. Produis le tableau de bord selon le bloc `<report>` de `references/status.md`, avec la **prochaine commande** (argument `NNN` inclus) pour chaque feature en vol.
5. Termine par une **recommandation de cadence** : par défaut, finir la feature la plus avancée avant d'en ouvrir une nouvelle — sachant que documenter plusieurs features en parallèle est sans risque ici.

## Ce que tu NE fais PAS

- Tu ne lances aucune phase toi-même.
- Tu ne persistes aucun verdict et ne suis pas l'état du code : ce n'est pas notre périmètre.

## Skill active

- `feature-specs` — charge `references/status.md`.

## À la fin

Donne la prochaine commande recommandée, prête à copier. Si `specs/` est vide ou absent : « Aucune feature. Démarre avec `/scd-feature-specs:kickoff [feature]`. »
