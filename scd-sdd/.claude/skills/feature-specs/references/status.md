# Référence — Tableau de bord des features (`status-specs`)

<role>
Répond à « où j'en suis ? » quand on reprend le projet après un `/clear`, un jour ou une semaine.
**Lecture seule + rapport.** Scanne `specs/`, dérive la phase de chaque feature **depuis les
fichiers** (aucun fichier d'état à maintenir, donc rien qui dérive), la croise avec les événements
datés de `docs/journal/NNN-slug.md`, et dit quoi lancer ensuite. Transmet aussi une **note d'aval** : quelles
features se recoupent sur les fichiers touchés, donc lesquelles ne s'implémenteront pas en parallèle
sans conflit.
</role>

<report>
```
## Features — specs/
| NNN | Feature | Phase courante | Mode | Gate                            | Prochaine commande     |
|-----|---------|----------------|------|---------------------------------|------------------------|
| 001 | auth    | à valider      | neuf | ✅ PRÊT (28/07) · premortem 29/07 | /scd-sdd:run 001 R1    |
| 002 | billing | à valider      | delta| ⚠ PRÊT (26/07) · tasks.md 29/07  | /scd-sdd:analyze 002   |
| 003 | export  | à spécifier    | neuf | —                               | /scd-sdd:specify 003   |

En vol : 3
Recommandation : 002 a été édité après sa gate — revalider avant le passage de main.

Note pour l'aval : 001 et 002 se recoupent sur `src/api/routes.ts` (« Fichiers touchés »)
  → à ne pas implémenter en parallèle sans branches séparées.
```

Lire l'exemple : 001 et 002 sont tous deux « à valider » — c'est ce que **la dérivation** peut dire
d'un dossier contenant un `tasks.md`, et elle le dira toujours. C'est la colonne **Gate**, tirée du
journal, qui les sépare : 001 a été gaté et rien n'a bougé depuis, 002 a été édité après le sien.
Sans elle, les deux features resteraient indistinguables.

Colonne **Gate** — le seul fait de ce tableau qui ne vient pas des fichiers :

- `—` : aucune ligne `analyze` au journal pour cette feature (jamais gatée, ou journal absent).
- `✅ <verdict> (JJ/MM)` : dernière ligne `analyze` de `## NNN-slug`, et aucun des trois documents
  n'a bougé depuis. Ajouter `· premortem JJ/MM` si une ligne `premortem` la suit.
- `⚠ <verdict> (JJ/MM) · <fichier> JJ/MM` : un document a été modifié **après** la gate — le verdict
  est **périmé**, la prochaine commande redevient `analyze`.
</report>

<guidance>
- **Dérivation de la phase** : applique la table du SKILL (section « Cibler une feature »). Elle y est la source de vérité unique — ne la recopie pas ici.
- **Pas d'état « livrée ».** La dernière phase dérivable est `analyze` : une fois le verdict `PRÊT`, le contrat part au niveau implémentation. **Ne dérive aucun statut depuis les cases de `tasks.md`** — l'avancement des lots `Rn` et la sûreté de merge des PR sont le périmètre de `/scd-sdd:status-impl`, vers lequel renvoyer. Ici, la prochaine commande d'une feature gatée `PRÊT` est simplement `/scd-sdd:run NNN R1`.
- **Le verdict `analyze` se lit au journal, jamais comme un état.** `analyze` ne persiste aucun état sur disque : il laisse une ligne datée dans `docs/journal/NNN-slug.md`. Un événement (« le 28/07, la gate a rendu PRÊT ») reste vrai pour toujours ; « la feature est validée » ne l'est plus dès qu'on touche un document.
- **Contrôle de fraîcheur, obligatoire.** Avant d'afficher une gate, comparer la date de la ligne à la dernière modification de `spec.md`, `plan.md` et `tasks.md` — `git log -1 --format=%cI -- <fichier>`, repli sur la mtime hors dépôt git. Le document a bougé après → afficher le verdict **périmé** (`⚠`) et remettre `analyze` en prochaine commande. Sans ce contrôle, le journal ment silencieusement.
- **Pas de journal, pas d'invention.** `docs/journal/` absent (projet démarré avant lui, ou jamais gaté) → colonne `Gate` à `—` et **signaler l'absence** en pied de rapport. Une commande de `status` ne crée ni ne complète le journal : elle est en lecture seule, et un verdict `analyze` ne se déduit d'aucun fichier. Projet venu des trois anciens plugins → renvoyer vers `/scd-sdd:migrate`, seule commande autorisée à créer le journal et à en reconstituer les lignes **datables depuis git** (skill `journal`, `references/reconstitution.md`) — jamais un verdict. Un `docs/JOURNAL.md` monolithique (projet suivi avant l'éclatement du journal) relève du même renvoi : `migrate` le convertit, `status-specs` ne le lit pas. Le reste du tableau, purement dérivé, reste exact.
- **Tout le cycle est parallélisable** : chaque phase n'écrit que dans `specs/NNN-*/`, disjoints par construction. Documenter plusieurs features en parallèle est un usage prévu, sans risque.
- **Note d'aval sur les conflits** : croiser les sections « Fichiers touchés » des `plan.md` et signaler les recoupements. C'est une **information transmise au workflow d'implémentation**, pas une contrainte sur ce cycle-ci.
- **Ne rien modifier** : ce n'est pas une commande d'action. Elle oriente, elle ne corrige pas.
- Si `specs/` est vide ou absent → renvoyer vers `/scd-sdd:kickoff-feature`.
</guidance>
