# Référence — Les tickets (`specs/NNN-slug/NN-slug.md`)

**Deux points de chargement.** `/scd-sdd:tickets` la charge **intégralement**. L'agent
`ticket-briefer` ne charge que le bloc `<format>`, pour parser le ticket qu'on lui donne.

⚠️ **Ce fichier est le domicile des seuils de scission chiffrés.** Ni le `SKILL.md`, ni les
commandes, ni les agents ne les recopient : ils y renvoient.

<role>
Un **ticket** est une tranche verticale : il traverse les couches et livre un comportement
vérifiable de bout en bout. Un ticket ≈ une PR.

Chaque ticket déclare les tickets qui le **bloquent**. Un ticket sans bloqueur démarre
immédiatement ; le **front** est l'ensemble des tickets dont tous les bloqueurs sont faits, et c'est
ce que `/scd-sdd:run` prend.

**La granularité s'arbitre avec l'humain, pas seule.** C'est le second des deux gestes de
validation du niveau feature, et le seul endroit où le découpage se corrige à bon marché.
</role>

<format>
```markdown
# NN — [Titre du ticket]

**Bloqué par :** [NN, NN] | rien — démarrable
**Vérif :** test | observé
**Fichiers :** [modules ou chemins pressentis — sert à décider ce qui est parallélisable]

## Ce que ça livre
[Le comportement bout en bout, du point de vue de l'utilisateur. Pas une liste de couches à
 construire — si tu écris « créer la table X puis l'endpoint Y », le ticket est horizontal.]

## Critères
- [ ] [critère observable — ce qu'on peut constater quand c'est fait]
- [ ] [critère observable]
```

**Numérotation** : `01`, `02`… dans l'**ordre des dépendances** — un bloqueur porte toujours un
numéro inférieur à ce qu'il bloque. Elle ne se renumérote pas après coup : un ticket inséré prend le
prochain numéro libre et déclare ses bloqueurs.

**Les deux modes de vérification, et il n'y en a que deux :**

| Mode | Quand | Ce qui fait preuve |
|---|---|---|
| `test` *(défaut)* | un test automatisé peut constater le comportement | la **sortie réelle** du test : `0 failed` |
| `observé` | aucun test automatisé n'est possible — infra, mise en page, effet externe | une **preuve capturée** : sortie de commande, capture, log |

`observé` sur de la logique métier est un défaut de découpage, pas un raccourci. Si tu l'écris,
dis **pourquoi** aucun test n'est possible ; si tu ne peux pas, le mode est `test`.

**La maquette, si elle existe.** Quand `specs/NNN-slug/maquette.md` est sur le disque, un critère
qui livre un écran le cite **par son nom** — « l'`Écran : Tableau de bord` affiche… » — et un
`observé` de mise en page nomme l'écran dans son motif : `observé (mise en page — Écran : Tableau
de bord)`. Un critère constate un **comportement** ; il ne note jamais la conformité au dessin.
</format>

<criteria>
Checklist appliquée **à chaque ticket**, jamais à la feature entière.

**Bloquants — un seul « non » suffit à rejeter le découpage.**
- [ ] **Un seul sujet.** Le ticket livre un comportement nommable en une phrase, sans « et ».
- [ ] **Tranche verticale.** Il traverse les couches et livre de la valeur vérifiable de bout en
      bout. Un ticket horizontal (« créer la table », « créer l'API », « créer l'UI ») est
      **rejeté** : sa correction ne se juge qu'en assemblage.
- [ ] **Compréhensible seul.** Le lire ne demande pas de charger les tickets voisins. Les
      dépendances sont d'**ordre**, pas de **compréhension**.
- [ ] **Chaque critère est observable.** « L'export fonctionne » n'est pas un critère ; « un export
      de 0 ligne produit un fichier avec l'en-tête seul » en est un.
- [ ] **Tient dans une fenêtre de contexte fraîche.** C'est la contrainte réelle de l'aval : un
      ticket qu'un agent ne peut pas charger entièrement ne sera pas implémenté correctement.

**Signaux de scission — un dépassement n'invalide pas, il déclenche « scinde ce ticket ».**
- [ ] Budget estimé ≤ ~400 lignes de diff.
- [ ] ≤ ~7 concepts distincts.
- [ ] ≤ ~7 critères.
- [ ] Reviewable en ≤ ~60 min *(corollaire des trois précédents, pas une mesure indépendante)*.

**Signaux « trop petit »** — l'excès inverse existe :
- Le ticket ne livre aucun incrément vérifiable → c'est une tâche horizontale déguisée, à refusionner
  avec son voisin.
- Ses implications ne se comprennent qu'avec un autre ticket → même conclusion.

**Robustesse anti-IA** — le découpage est produit par une IA, et il faut le lire comme tel :
- [ ] Aucun ticket ne livre de fonctionnalité spéculative non demandée : le **hors-périmètre** de
      `SPEC.md` fait foi.
- [ ] Les hypothèses implicites du découpage sont explicitées, pas enfouies.
- [ ] Tu as **cherché une erreur**, tu n'as pas confirmé. La sur-complétude d'un artefact généré
      crée un faux sentiment de complétude : un découpage qui « a l'air complet » est précisément
      celui qu'il faut lire ligne à ligne.
</criteria>

<splitting>
Quand un ticket dépasse les signaux, scinde-le **verticalement**. Patterns, du plus utile au plus
rare :

- **Étapes du parcours** — le parcours a 4 étapes → un ticket par étape utile isolément.
- **Variations de règle métier** — le cas nominal d'abord ; chaque variation devient un ticket.
- **Variations de données** — un ticket par forme d'entrée (un format, une locale, un type de
  compte).
- **Opérations CRUD** — `create` livrable et vérifiable sans `delete`.
- **Chemins** — happy path d'abord, chemins alternatifs ensuite.
- **Effort simple/complexe** — la version naïve qui marche, puis l'optimisation.

Règle : viser des tickets de **tailles comparables**, chacun **dépriorisable** — on doit pouvoir en
retirer un sans casser les autres. Si scinder oblige à créer un ticket horizontal, c'est que l'axe
vertical est ailleurs : cherche un autre axe plutôt que de céder.

**Le préfactoring passe en premier.** *Make the change easy, then make the easy change.* Si un
ticket serait beaucoup plus simple après un déplacement mécanique, ce déplacement est un ticket, et
il bloque les autres.

## L'exception : le refactor large

Un **refactor large** est un changement mécanique — renommer une colonne, retyper un symbole
partagé — dont le **rayon d'action** traverse tout le dépôt : une seule édition casse des milliers
d'appels, et **aucune tranche verticale ne peut rester verte**. Ne le force pas dans le moule ;
séquence-le en **expand–contract** :

1. **Expand** — ajouter la nouvelle forme **à côté** de l'ancienne. Rien ne casse. Un ticket.
2. **Migrer** — déplacer les appelants par **paquets** dimensionnés sur le rayon d'action (par
   module, par répertoire), chacun bloqué par l'expand. La CI reste verte de paquet en paquet, puisque l'ancienne
   forme existe toujours.
3. **Contract** — supprimer l'ancienne forme quand plus aucun appelant ne reste. Un ticket, bloqué
   par **tous** les paquets de migration.

Quand même les paquets ne peuvent pas rester verts seuls, garde la séquence mais fais-les partager une
branche d'intégration, que bloque un dernier ticket *intégrer et vérifier* : le vert n'est promis
que là, et c'est dit.
</splitting>

<pitfalls>
- **Ne transforme pas une estimation en gate.** Les seuils chiffrés de `<criteria>` viennent
  d'études sur le **code** et l'**inspection formelle**, transposés par analogie raisonnée. Aucun
  n'est empiriquement validé pour un découpage. Ils déclenchent une **question**, jamais un verdict —
  et il n'y a plus de verdict dans ce cycle.
- **Le budget en lignes est une estimation documentaire.** Ce plugin ne lit pas le code : annoncer
  `~180 lignes` est un ordre de grandeur destiné à déclencher la scission, jamais une mesure. Ne le
  présente pas comme telle.
- **Pas de chemins de fichiers dans `## Ce que ça livre`.** La ligne `**Fichiers :**` existe pour
  ça, et elle sert à une chose précise : décider ce qui est **parallélisable** — deux tickets aux
  fichiers disjoints et sans dépendance mutuelle peuvent tourner ensemble.
- **Ne prescris pas le git.** Le ticket est l'unité de livraison **recommandée** — « un ticket ≈ une
  PR ». Comment il commite, branche ou empile ses PR appartient au niveau implémentation.
- **Un ticket n'est pas une étape de vérification.** « Tous les tests » puis « toute l'impl » = deux
  tickets horizontaux. La vérification d'un comportement vit **dans** le ticket qui le livre.
</pitfalls>

<completion>
Le découpage est terminé quand :
- [ ] Chaque comportement de **`## Ce que ça change`** de `SPEC.md` est couvert par au moins un
      ticket — et l'inverse : aucun ticket ne livre ce que la spec n'a pas demandé.
- [ ] Chaque ticket passe les **quatre bloquants**.
- [ ] Le graphe des `Bloqué par` est **acyclique**, et la numérotation le respecte.
- [ ] Au moins un ticket est **démarrable** (aucun bloqueur). Sinon le graphe est faux.
- [ ] Chaque ticket déclare son mode de **vérif** ; tout `observé` porte son motif.
- [ ] Le découpage a été **présenté à l'humain et approuvé**. C'est la seule validation, et elle ne
      se saute pas.
</completion>
