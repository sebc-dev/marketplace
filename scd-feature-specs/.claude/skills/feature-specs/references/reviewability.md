# Référence — Reviewability : dimensionner les lots de review

<role>
Dimensionne le découpage pour que l'implémentation aval produise des unités **reviewables par un
humain**. Un `tasks.md` bien tracé mais découpé en un seul bloc de 1 200 lignes produit une review
que personne ne fera vraiment : le reviewer skimme, et le défaut passe.

Chargée par la phase `tasks` (pour **dimensionner**) et par le subagent `slice-auditor` (pour
**auditer**). Le lot de review (`Rn`) est un **groupe de tâches**, pas un fichier : il vit dans les
en-têtes de `tasks.md`.

**Ce que la reviewability n'est pas :** un budget de lignes. La taille est une condition
**nécessaire mais non suffisante** — un lot petit mais incohérent, ou plausible-mais-faux, échappe
quand même à la détection. Ce sont la **cohésion**, l'**indépendance** et la **structuration** qui
portent l'essentiel, d'où la séparation bloquants / signaux ci-dessous.
</role>

<criteria>
Checklist appliquée **à chaque lot `Rn`**, pas à la feature entière.

**Bloquants — un seul « non » suffit à rejeter le découpage.**
- [ ] **Un seul sujet.** Le lot livre une capability nommable en une phrase, sans « et ».
- [ ] **Vertical slice.** Il traverse les couches pour livrer de la valeur vérifiable de bout en
      bout. Un lot horizontal (« créer la table », « créer l'API », « créer l'UI ») est **rejeté** :
      sa correction ne se juge qu'en assemblage, donc il n'est pas reviewable seul.
- [ ] **Reviewable seul.** Comprendre le lot ne demande pas de charger en mémoire les lots voisins.
      Les dépendances (`dépend de : Rn`) sont d'**ordre**, pas de **compréhension**.
- [ ] **Chaque `FR` du lot a sa tâche test + impl** (couverture — déjà contrôlée par `analyze`).

**Signaux de scission — un dépassement n'invalide pas, il déclenche « scinde ce lot » (Major).**
- [ ] Budget estimé ≤ ~400 lignes de diff.
- [ ] ≤ ~7 concepts / exigences distincts dans le lot.
- [ ] ≤ ~5-7 critères d'acceptation par exigence.
- [ ] Reviewable en ≤ ~60 min (le corollaire des trois précédents, pas une mesure indépendante).

**Signaux « trop petit »** — l'excès inverse existe :
- Le lot ne livre aucun incrément de valeur vérifiable → c'est une tâche horizontale déguisée,
  à refusionner avec son voisin.
- Ses implications ne se comprennent qu'avec un autre lot → même conclusion.

**Robustesse anti-IA** (les documents audités sont générés par IA) :
- [ ] Aucun lot ne livre de fonctionnalité spéculative non demandée (le scope EXCLU de `spec.md`
      fait foi).
- [ ] Les hypothèses implicites du découpage sont explicitées, pas enfouies.
- [ ] L'auditeur a **cherché une erreur**, il n'a pas confirmé. La sur-complétude et la verbosité
      d'un artefact IA créent un faux sentiment de complétude : un découpage qui « a l'air complet »
      est précisément le cas où il faut lire ligne à ligne.
</criteria>

<splitting>
Quand un lot dépasse les signaux, scinde-le **verticalement**. Patterns, du plus utile au plus rare :

- **Étapes du workflow** — le parcours a 4 étapes → un lot par étape utile isolément.
- **Variations de règle métier** — le cas nominal d'abord ; chaque variation devient un lot.
- **Variations de données** — un lot par forme d'entrée (un format, une locale, un type de compte).
- **Opérations CRUD** — `create` livrable et reviewable sans `delete`.
- **Chemins (SPIDR)** — happy path d'abord, chemins alternatifs ensuite.
- **Effort simple/complexe** — la version naïve qui marche, puis l'optimisation.

Règle : viser des lots de **tailles comparables**, chacun **dépriorisable** (on doit pouvoir en
retirer un sans casser les autres). Si scinder oblige à créer un lot horizontal, c'est que le
découpage vertical est ailleurs — cherche un autre axe plutôt que de céder.

**Ordonner :** les lots sont ordonnés par dépendance (`dépend de : Rn`) et notés `[P]` quand leurs
sections « Fichiers touchés » sont disjointes — même règle que pour les tâches, un cran au-dessus.
</splitting>

<pitfalls>
- **Ne transforme pas une estimation en gate.** Les seuils chiffrés (400 lignes, 60 min, 7 concepts)
  viennent d'études sur le **code** et l'**inspection formelle**, transposés aux documents par
  analogie raisonnée. Aucun seuil de taille n'est empiriquement validé pour des specs. Ils
  déclenchent une question (« ce lot ne serait-il pas trop gros ? »), ils ne rendent pas un verdict.
- **Le budget en lignes est une estimation documentaire**, dérivée des « Fichiers touchés » du
  `plan.md`. Ce plugin ne lit pas le code : annoncer `~180 LOC` est un ordre de grandeur destiné à
  déclencher la scission, jamais une mesure. Ne la présente pas comme telle.
- **Ne prescris pas le git.** Le lot est l'unité de livraison **recommandée** au workflow aval —
  « un lot ≈ une PR reviewable ». Comment il commite, branche ou empile ses PR ne nous regarde pas.
- **Ne confonds pas `[P]` et lot.** `[P]` dit « peut tourner en parallèle » ; un lot dit « se review
  d'un bloc ». Deux tâches parallélisables du même lot restent dans le même lot.
- **Un lot n'est pas une étape TDD.** « Tous les tests » puis « toute l'impl » = deux lots
  horizontaux. L'ordre TDD vit **dans** le lot (test → impl par FR), jamais entre les lots.
</pitfalls>
