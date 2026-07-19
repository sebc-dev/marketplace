---
argument-hint: "[NNN|slug] (ou rien — scanne specs/)"
description: "Tableau de bord d'implémentation. Scanne specs/, dérive pour chaque feature l'avancement de ses lots Rn depuis les cases cochées de tasks.md, dit quel lot lancer ensuite, et signale les lots bloqués par une dépendance non implémentée. Lecture seule."
allowed-tools:
  - Read
  - Grep
  - Glob
---

## Contexte

Tu réponds à « **où en est l'implémentation ?** ». Le développeur reprend après un `/clear` et veut savoir quels lots `Rn` sont faits, lequel lancer ensuite, et s'il y a des blocages. Tu scannes, tu dérives depuis les cases de `tasks.md`, tu orientes.

Ratio : 10% humain / 90% AI (lecture mécanique ; l'humain choisit la suite).

## Règles absolues

- **Lecture seule.** Tu ne modifies aucun fichier et ne lances aucun workflow.
- **Dérive l'état des cases de `tasks.md`**, pas du contexte (effacé) ni d'un fichier d'état (il dériverait). Ici, contrairement au `status` de `scd-feature-specs`, les cases `[x]` **sont** la source de vérité : c'est ce plugin (via `progress-recorder`) qui les coche.

## Processus

1. Charge la référence : lis `references/tasks-parsing.md` du skill `implement` (parsing des lots `Rn`, tâches `Tn`, `dépend de :`).
2. Scanne `specs/` : pour chaque `NNN-slug/tasks.md`, énumère les lots `Rn` et calcule leur état :
   - **fait** : toutes les tâches `Tn` du lot cochées `[x]` ;
   - **en cours** : certaines cochées, d'autres non ;
   - **à faire** : aucune cochée.
3. Détermine le **prochain lot lançable** : le premier `Rn` non fait dans l'ordre des dépendances **dont toutes les dépendances (`dépend de : Rn`) sont faites**. Signale tout lot **bloqué** (dépendance non faite).
4. Produis le tableau de bord (voir `<report>`), avec la **prochaine commande** prête à copier pour chaque feature en vol.
5. Si `analyze` n'a manifestement pas été passée (spec avec `[NEEDS CLARIFICATION]`, `tasks.md` absent), signale-le : l'implémentation ne doit pas démarrer sur un contrat non validé.

## Ce que tu NE fais PAS

- Tu ne lances aucun lot toi-même (c'est `/scd-implement:run`).
- Tu ne lis pas le code ni les diffs, tu ne juges pas la qualité de l'implémentation — seulement l'avancement dérivé des cases.

<report>
```
## Implémentation — specs/

### NNN-slug
Lots : X faits · Y en cours · Z à faire
- [x] R1 — <capability>           (fait)
- [~] R2 — <capability>           (en cours : T3, T4 restants)
- [ ] R3 — <capability>           (à faire · bloqué par R2)
Prochain : /scd-implement:run NNN R2

### MMM-autre
...

Recommandation : finir R2 de NNN-slug avant d'ouvrir un nouveau lot.
```
</report>

## Skill active

- `implement` — charge `references/tasks-parsing.md`.

## À la fin

Donne la prochaine commande recommandée, prête à copier. Si `specs/` est vide ou sans `tasks.md` : « Aucune feature prête à implémenter. Termine un cycle `scd-feature-specs` (jusqu'à `analyze`). »
