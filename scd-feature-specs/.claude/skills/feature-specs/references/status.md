# Référence — Tableau de bord des features (`status`)

<role>
Répond à « où j'en suis ? » quand on reprend le projet après un `/clear`, un jour ou une semaine.
**Lecture seule + rapport.** Scanne `specs/`, dérive la phase de chaque feature **depuis les
fichiers** (aucun fichier d'état à maintenir, donc rien qui dérive), et dit quoi lancer ensuite.
Transmet aussi une **note d'aval** : quelles features se recoupent sur les fichiers touchés, donc
lesquelles ne s'implémenteront pas en parallèle sans conflit.
</role>

<report>
```
## Features — specs/
| NNN | Feature | Phase courante | Mode | Prochaine commande |
|-----|---------|----------------|------|--------------------|
| 001 | auth    | à valider      | neuf | /scd-feature-specs:analyze 001 |
| 002 | billing | à planifier    | delta| /scd-feature-specs:plan 002 |
| 003 | export  | à spécifier    | neuf | /scd-feature-specs:specify 003 |

En vol : 3
Recommandation : termine 001 (à valider) avant d'ouvrir plus loin — cadence séquentielle par défaut.

Note pour l'aval : 001 et 002 se recoupent sur `src/api/routes.ts` (« Fichiers touchés »)
  → à ne pas implémenter en parallèle sans branches séparées.
```
</report>

<guidance>
- **Dérivation de la phase** : applique la table du SKILL (section « Cibler une feature »). Elle y est la source de vérité unique — ne la recopie pas ici.
- **Pas d'état « livrée ».** Le cycle se termine à `analyze` : une fois le verdict `PRÊT`, le contrat part vers le workflow d'implémentation et le suivi du code ne nous regarde plus. Ne dérive aucun statut depuis les cases de `tasks.md` : elles seront cochées en aval, pas ici.
- **Ne persiste aucun verdict** : `analyze` est en lecture seule et bon marché — pour savoir si une feature est validée, on la relance. Un PASS écrit sur disque deviendrait faux à la première édition.
- **Tout le cycle est parallélisable** : chaque phase n'écrit que dans `specs/NNN-*/`, disjoints par construction. Documenter plusieurs features en parallèle est un usage prévu, sans risque.
- **Note d'aval sur les conflits** : croiser les sections « Fichiers touchés » des `plan.md` et signaler les recoupements. C'est une **information transmise au workflow d'implémentation**, pas une contrainte sur ce cycle-ci.
- **Ne rien modifier** : ce n'est pas une commande d'action. Elle oriente, elle ne corrige pas.
- Si `specs/` est vide ou absent → renvoyer vers `/scd-feature-specs:kickoff`.
</guidance>
