---
name: premortem
description: |
  La CAPACITÉ DE DURCISSEMENT ADVERSE transverse : on suppose l'échec, on remonte à ce
  que les documents contenaient — ou omettaient — qui l'a rendu possible, et tout risque
  retenu se referme par un changement de document. Projection d'échec, lentilles,
  générer large / appliquer étroit, gate d'approbation humain avant toute écriture.
  S'applique à TROIS cibles — le socle, une feature, un chantier — qui changent les
  documents jugés et les formes de remédiation, jamais la méthode. Se charge pendant
  /scd-sdd:premortem, seule commande qui l'invoque. Porte UNIQUEMENT la méthode et la
  table des cibles : le contrat des documents remédiés reste aux skills de leur niveau
  (project-docs, feature-specs, chantier), la ligne de journal au skill journal. Ne joue
  aucune phase : un projet sans premortem n'est pas un projet incomplet.
---

# Premortem — supposer l'échec pour durcir un plan

## Pourquoi une capacité, et pas une phase

Une phase se joue **une fois, dans un ordre imposé**, et laisse un artefact dont l'état se
dérive. Un premortem se joue **quand l'enjeu le justifie** : sur un socle avant d'en décliner
dix features, sur un contrat de feature après sa gate, sur un chantier qu'on s'apprête à
reprendre après trois semaines. Le moment n'est pas imposé par une chaîne, il est choisi.

Trois conséquences, toutes **de nature** et jamais discrétionnaires :

- **Aucun état dérivé.** Le premortem n'apparaît dans aucune table de dérivation. Un socle sans
  premortem n'est **pas** un socle incomplet, et `status` ne le réclame jamais. L'y faire figurer
  ferait croire à une phase, et transformerait une passe calibrée en cérémonie obligatoire.
- **Une ligne de journal quand même.** C'est ce qui le distingue de `research`, l'autre capacité
  transverse. Un rapport de recherche **est** le fait qu'il produit ; un premortem ne produit
  aucun artefact propre — il modifie des documents existants **sans y laisser le moindre
  marqueur**. Sans la ligne, son passage n'est dérivable de rien. La règle n'est donc pas « une
  phase journalise », c'est **« ce qui n'est dérivable de nulle part se consigne »**.
- **La cible ne se devine jamais entre niveaux.** C'est la seule capacité du plugin qui écrit
  dans trois familles de documents. Un premortem lancé sur la mauvaise cible aurait édité le
  mauvais contrat avant qu'on s'en aperçoive : à défaut d'argument, on énumère et on demande.

## Ce qui ne change jamais — la méthode

### 1. La projection d'échec

On ne demande pas « ce plan est-il bon ? » — question à laquelle on répond toujours oui. On
**pose l'échec comme acquis** et on remonte à sa cause :

> « Six mois plus tard, c'est un échec. Raconte pourquoi. »

La prospective hindsight fait émerger des risques qu'aucune checklist de conformité ne voit :
elle change la question de *prédire* à *expliquer*, et expliquer est une tâche à laquelle on est
bien meilleur. C'est le mécanisme entier de la technique — s'en écarter (« liste les risques »)
la vide de son effet.

### 2. Les lentilles

Balayées par le facilitateur, **larges par conception**. La discipline ne vient pas de restreindre
les lentilles, elle vient de la règle de remédiation (§ 3).

- **Correction & cas limites** — vide/max/hors bornes, concurrence, idempotence, ordre, locales,
  zéro/un/plusieurs. Le plan ne décrit-il que le chemin heureux ?
- **Chemins d'erreur** — dépendance en panne, timeout, refus : le dégradé est-il écrit ?
- **Fit produit / usage** — l'objet mesure-t-il une issue pour qui s'en sert, ou seulement une
  mécanique interne ? Friction, découvrabilité, état vide.
- **Données & état** — migration, rétro-compatibilité, cohérence, cycle de vie, rétention.
- **Frontières & intégrations** — contrats implicites, hypothèses sur un tiers, effets de bord.
- **Opérabilité** — observabilité, charge, rollback exigés en amont mais jamais déclinés.
- **Hypothèses tues** — ce que le plan tient pour acquis sans l'écrire. Le mode de défaillance
  n° 1, à toutes les cibles : « on avait supposé que… ».

### 3. La règle de remédiation

> **Tout risque retenu se referme par un changement de document.**

C'est elle qui empêche un premortem de dériver en séance d'inquiétude. Un risque qui ne s'exprime
dans **aucune** des formes légales de sa cible n'est pas inscrit — il prend la sortie du § 5.

### 4. Générer large, appliquer étroit

Trois barrières, dans cet ordre, et aucune n'est facultative :

| Barrière | Qui | Ce qu'elle arrête |
|---|---|---|
| **Validation** | `premortem-validator`, contexte frais | le spéculatif, le déjà-couvert, le scope creep, le style, les doublons |
| **Approbation** | l'**humain** | tout le reste — c'est lui qui décide du *quoi* |
| **Application littérale** | `premortem-applier` | l'ajout « pendant que j'y suis », qui n'a passé aucun gate |

Séparer *générer* de *trier* est ce qui rend l'étape sûre : un agent à qui on demande d'imaginer
des échecs en produira toujours, dont beaucoup de faux. **Le scope creep est le risque n° 1 de
cette capacité** — c'est la seule passe d'écriture *déléguée* du plugin, et les trois barrières
existent pour ça.

### 5. La sortie de secours : un risque dont la remédiation est un travail

Certains risques sont réels et ne se referment par **aucun** texte : « on bloque sur un contrôle
dont on n'a jamais mesuré le taux de faux positifs », « il faudrait éprouver la restauration de
sauvegarde ». Les inscrire de force produirait une ligne creuse ; les jeter perdrait le meilleur
constat de la séance.

Ils deviennent une **fiche de chantier `en-attente`**, de la portée de la cible. C'est
exactement l'usage prévu par le skill `chantier`, et le précédent existe : le chantier de
durcissement de la phase `ci`. Cette forme est légale **à toutes les cibles**.

### 6. Le calibrage

Passe **optionnelle**. Un plan descriptible en une phrase ne la mérite pas. Elle paie sur ce qui
est non trivial, à fort chemin d'erreur ou à fort enjeu — et sur ce qu'on ne pourra pas
facilement défaire. Ne sur-cérémonialise pas : un premortem systématique est une taxe, pas un
garde-fou.

## Ce qui change — les trois cibles

Une seule commande, `/scd-sdd:premortem`, et trois cibles qui changent **ce qu'on lit**, **ce
qu'on a le droit d'écrire** et **ce qui suit**. La méthode ci-dessus, elle, est identique.

| Cible | Ce qui est jugé | Précondition | Journal | Ce qui suit |
|---|---|---|---|---|
| **socle** | `docs/prd.md` `stack.md` `adr/` `ci.md` `CLAUDE.md` — ceux qui existent. **Jamais `docs/brief.md`** : il est l'intention d'origine, donc du contexte | au moins le PRD | `docs/journal/socle.md` | re-lire les features en vol : leurs backrefs ont pu bouger |
| **feature** | `specs/NNN-slug/` `spec.md` `plan.md` `tasks.md` | gate `analyze` au vert | `docs/journal/NNN-slug.md` | **re-passe `analyze` imposée** |
| **chantier** | une fiche `docs/chantiers/<état>/AAAA-MM-JJ-slug.md` | fiche présente, contrôle de fraîcheur rendu | **aucun** — la fiche est le fait | `resume` lira la fiche durcie |

Le détail de chaque cible — documents, contexte à charger, scénario-cadre, formes de remédiation
légales — vit dans `references/cibles.md`, dont la commande ne charge **que le bloc de la cible
résolue**.

**Pourquoi la cible `chantier` ne journalise pas.** C'est la règle des chantiers, appliquée telle
quelle : un chantier ne produit jamais de ligne de journal, son lien avec le cycle passe par sa
`Portée`. Et la raison de fond tient : une fiche est **consommée puis archivée**, pas un contrat
que l'implémentation suivra pendant des mois. Son `Actualisé le` suffit à dater son durcissement.

## Ce que le premortem n'est pas

- **Pas une gate.** Il ne rend aucun verdict, ne bloque rien, n'atteste de rien. `analyze` juge la
  **conformité** ; le premortem pose une question orthogonale — *conforme, et pourtant condamné ?*
  Ne double jamais les findings d'`analyze`, d'`ears-verifier` ou de `slice-auditor`.
- **Pas une revue de code.** Il travaille sur des documents. Le code n'existe pas encore, ou n'est
  pas le sujet : on ne lit pas d'implémentation, on n'exécute aucun test.
- **Pas une session de conception.** Il ne prescrit pas *comment* faire. Une décision structurante
  qu'il fait émerger devient un **candidat ADR** dans `docs/adr/_candidates/` — jamais un edit
  d'un ADR accepté, que le hook `block-adr-edits` refuse de toute façon (`exit 2`).
- **Pas rejouable à blanc.** Chaque passe modifie les documents et périme ce qui les jugeait : une
  fiche de gate ouverte devient obsolète, un verdict `analyze` tombe. Relancer sans avoir refermé
  la passe précédente produit du bruit.

## Références

| Fichier | Quand la charger | Sections |
|---|---|---|
| `references/cibles.md` | `/scd-sdd:premortem` — `resolution` à l'étape 1, **le bloc de la cible résolue seulement** ensuite, et `hors-forme` **toujours** (il porte le contrat du signalement) | `resolution` `socle` `feature` `chantier` `hors-forme` |
