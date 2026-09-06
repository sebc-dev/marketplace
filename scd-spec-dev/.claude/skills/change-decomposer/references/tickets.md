# Référence — Le format et le découpage des tickets

**Deux points de chargement.** `/scd-spec-dev:tickets` (via `change-decomposer`) la charge
**intégralement**. L'agent `ticket-briefer` n'en charge que le bloc `<format>`, pour parser un ticket
qu'on lui donne.

⚠️ **Ce fichier est le domicile unique des seuils de scission chiffrés.** Ni le `SKILL.md`, ni la
commande, ni les agents ne les recopient : ils y renvoient.

<role>
Un **ticket** (`changes/<x>/tickets/NN-slug.md`) est une **tranche verticale** : il traverse les
couches et livre un comportement vérifiable de bout en bout. Un ticket ≈ une PR.

Chaque ticket déclare les tickets qui le **bloquent**. Un ticket sans bloqueur démarre
immédiatement ; le **front** est l'ensemble des tickets dont tous les bloqueurs sont faits, et c'est
ce que `/scd-spec-dev:run` prend.

**La granularité s'arbitre avec l'humain, pas seule.** C'est le second des deux gestes de validation
(le premier étant la relecture du change), et le seul endroit où le découpage se corrige à bon
marché — une fois l'implémentation lancée, corriger coûte des PR.
</role>

<format>
```markdown
# NN — [Titre : le comportement livré]

**Bloqué par :** [NN, NN] | —
**Vérif :** tdd | test | observé | aucun
**Fichiers :** `[chemins pressentis — sert à décider ce qui est parallélisable]`

## Ce que ça livre
[Le comportement bout en bout, du point de vue de l'utilisateur. Pas une liste de couches à
 construire — « créer la table X puis l'endpoint Y » est un ticket horizontal, à rejeter.]

## Critères
- [ ] [critère observable — un scénario WHEN/THEN du delta]   (SC-NNa)
- [ ] [critère observable]                                    (SC-NNb)
```

**Numérotation** : `01`, `02`… dans l'**ordre des dépendances** — un bloqueur porte toujours un
numéro inférieur à ce qu'il bloque. Elle ne se renumérote pas après coup : un ticket inséré prend le
prochain numéro libre et déclare ses bloqueurs.

**IDs de critère** : `SC-<NN><lettre>`, stables, un par scénario WHEN/THEN du delta. Ils se figent
**après** l'arbitrage de granularité (un critère déplacé suit son ticket et change d'id).

**Les quatre modes de vérification** (décidés par le skill `strategie-verif`, un ticket à la fois) :

| Mode | Quand | Ce qui fait preuve |
|---|---|---|
| `tdd` | oracle exprimable avant le code, déterministe, testable | test écrit **avant** le code, rouge → vert |
| `test` | oracle après coup : legacy/migration, ou couplage I/O | test écrit **juste après** le code, `0 failed` |
| `observé` | aucun test automatisé possible — rendu, sortie complexe, effet externe | **preuve capturée** : sortie, capture, log — ou `humanCheckRequired` |
| `aucun` | spike / exploration / prototype jetable | aucune — pas de segment test dans `run` |

`observé` ou `aucun` sur de la logique métier avec oracle est un défaut de découpage, pas un
raccourci. Le mode porte sa **justification** (une phrase, cf. skill `strategie-verif`).
</format>

<criteria>
Checklist appliquée **à chaque ticket**, jamais à la feature entière.

**Bloquants — un seul « non » suffit à rejeter le découpage.**
- [ ] **Un seul sujet.** Le ticket livre un comportement nommable en une phrase, sans « et ».
- [ ] **Tranche verticale.** Il traverse les couches et livre de la valeur vérifiable de bout en
      bout. Un ticket horizontal (« la table », « l'API », « l'UI » séparés) est **rejeté**.
- [ ] **Compréhensible seul.** Le lire ne demande pas de charger les tickets voisins. Les
      dépendances sont d'**ordre**, pas de **compréhension**.
- [ ] **Chaque critère est observable et vient d'un scénario du delta.** « L'export fonctionne »
      n'est pas un critère ; « un export de 0 ligne produit un fichier avec l'en-tête seul » en est un.
- [ ] **Tient dans une fenêtre de contexte fraîche.** Un ticket qu'un agent ne peut pas charger
      entièrement ne sera pas implémenté correctement — c'est la contrainte réelle de l'aval.

**Signaux de scission — un dépassement n'invalide pas, il déclenche « scinde ce ticket ».**
- [ ] Budget estimé ≤ ~400 lignes de diff.
- [ ] ≤ ~7 concepts distincts.
- [ ] ≤ ~7 critères.
- [ ] Reviewable en ≤ ~60 min *(corollaire des trois précédents, pas une mesure indépendante)*.

**Signaux « trop petit »** — l'excès inverse existe :
- Le ticket ne livre aucun incrément vérifiable → tâche horizontale déguisée, à refusionner.
- Ses implications ne se comprennent qu'avec un autre ticket → même conclusion.

**Robustesse anti-IA** — le découpage est produit par une IA, lis-le comme tel :
- [ ] Aucun ticket ne livre de fonctionnalité spéculative : le **hors-périmètre** du change fait foi.
- [ ] Les hypothèses implicites du découpage sont explicitées, pas enfouies.
- [ ] Tu as **cherché une erreur**, tu n'as pas confirmé.
</criteria>

<splitting>
Quand un ticket dépasse les signaux, scinde-le **verticalement**. Patterns, du plus utile au plus
rare :

- **Étapes du parcours** — 4 étapes → un ticket par étape utile isolément.
- **Variations de règle métier** — le cas nominal d'abord ; chaque variation devient un ticket.
- **Variations de données** — un ticket par forme d'entrée (un format, une locale, un type de compte).
- **Opérations CRUD** — `create` livrable et vérifiable sans `delete`.
- **Chemins** — happy path d'abord, chemins alternatifs ensuite.
- **Effort simple/complexe** — la version naïve qui marche, puis l'optimisation.

Règle : viser des tickets de **tailles comparables**, chacun **dépriorisable** — on doit pouvoir en
retirer un sans casser les autres. Si scinder oblige à créer un ticket horizontal, l'axe vertical est
ailleurs : cherche-le plutôt que de céder.

**Le préfactoring passe en premier.** *Make the change easy, then make the easy change.* Un
déplacement mécanique qui simplifierait plusieurs tickets **est** un ticket, et il les bloque.

## L'exception : le refactor large

Un **refactor large** est un changement mécanique — renommer une colonne, retyper un symbole
partagé — dont le **rayon d'action** traverse le dépôt : une seule édition casse des milliers
d'appels, **aucune tranche verticale ne peut rester verte**. Ne le force pas ; séquence-le en
**expand → migrer → contract** :

1. **Expand** — ajouter la nouvelle forme **à côté** de l'ancienne. Rien ne casse. Un ticket.
2. **Migrer** — déplacer les appelants par **paquets** dimensionnés sur le rayon d'action (par
   module, par répertoire), chacun bloqué par l'expand. La CI reste verte de paquet en paquet.
3. **Contract** — supprimer l'ancienne forme quand plus aucun appelant ne reste. Un ticket, bloqué
   par **tous** les paquets de migration.

Si même les paquets ne peuvent pas rester verts seuls, garde la séquence mais fais-les partager une
branche d'intégration, que bloque un dernier ticket *intégrer et vérifier* : le vert n'est promis
que là, et c'est dit.
</splitting>

<pitfalls>
- **Ne transforme pas une estimation en gate.** Les seuils chiffrés viennent d'études sur le **code**
  et l'**inspection formelle**, transposés par analogie. Aucun n'est validé pour un découpage : ils
  déclenchent une **question**, jamais un verdict — et il n'y a aucun verdict dans ce cycle.
- **Le budget en lignes est une estimation documentaire.** Ce plugin ne lit pas le code au découpage :
  `~180 lignes` est un ordre de grandeur pour déclencher la scission, pas une mesure. Ne le présente
  pas comme telle.
- **Pas de chemins de fichiers dans `## Ce que ça livre`.** La ligne `**Fichiers :**` existe pour
  ça, et sert à une chose : décider ce qui est **parallélisable** — deux tickets aux fichiers
  disjoints et sans dépendance mutuelle tournent ensemble (`run-parallel`, worktrees).
- **Un ticket n'est pas une étape de vérification.** « Tous les tests » puis « toute l'impl » = deux
  tickets horizontaux. La vérification d'un comportement vit **dans** le ticket qui le livre.
- **Les critères viennent des deltas, pas du proposal.** `proposal`/`design` donnent *ce que ça
  livre* ; les scénarios WHEN/THEN des `specs/` donnent *les critères*. Ne pas les confondre.
</pitfalls>

<completion>
Le découpage est terminé quand :
- [ ] Chaque scénario WHEN/THEN des deltas est couvert par au moins un critère de ticket — et
      l'inverse : aucun ticket ne livre ce que le change n'a pas demandé.
- [ ] Chaque ticket passe les **cinq bloquants**.
- [ ] Le graphe des `Bloqué par` est **acyclique**, et la numérotation le respecte.
- [ ] Au moins un ticket est **démarrable** (aucun bloqueur). Sinon le graphe est faux.
- [ ] Chaque ticket porte son mode de **vérif** (décidé par `strategie-verif`) ; tout mode ≠ `tdd`
      porte sa justification ; aucune escalade `arbitrage humain` n'est restée non tranchée.
- [ ] Le découpage a été **présenté à l'humain et approuvé**. C'est la validation, et elle ne se
      saute pas.
</completion>
