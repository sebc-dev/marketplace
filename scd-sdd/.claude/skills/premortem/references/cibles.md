# Référence — Les trois cibles du premortem

Un seul bloc se charge : celui de la cible résolue. La **méthode** — projection d'échec,
lentilles, trois barrières, calibrage — est dans le `SKILL.md` et ne se répète pas ici.

<resolution>
La cible **ne se devine jamais entre niveaux**. C'est la seule règle de résolution du plugin qui
traverse trois familles de documents, et un premortem écrit : se tromper de cible coûte un
contrat édité par erreur.

1. Un **argument** est fourni → il tranche le niveau, dans cet ordre de reconnaissance :
   - `socle` (littéral) → cible **socle** ;
   - `chantier <fragment>` → cible **chantier**, puis résolution du fragment selon
     « Cibler un chantier » du skill `chantier` ;
   - tout le reste (`003`, `auth`, `003-auth`, un chemin `specs/…`) → cible **feature**, puis
     résolution selon « Cibler une feature » du skill `feature-specs`.
2. **Aucun argument** → n'infère rien. Énumère les candidates des trois niveaux — le socle s'il a
   au moins un PRD, les features dont la dernière gate `analyze` est au vert, les fiches de
   `en-cours/` — et demande via `AskUserQuestion`.

Les deux règles de résolution **intra-niveau** appartiennent à leur skill et sont référencées,
jamais recopiées. Ce bloc ne tranche que le niveau.

**Annonce toujours la cible retenue**, et ce que tu vas lire, avant de déléguer quoi que ce soit.
</resolution>

<socle>
## Cible `socle`

**Précondition.** `docs/prd.md` existe. Un socle réduit au brief n'a pas encore de plan à
durcir : renvoie vers `/scd-sdd:prd`.

**Ce qui est jugé** — ceux de ces documents qui existent, sans en réclamer aucun :
`docs/prd.md` · `docs/stack.md` · `docs/archi.md` · `docs/adr/*.md` · `docs/ci.md` · `CLAUDE.md`.

**Le contexte, jamais jugé** : `docs/brief.md` (l'intention d'origine) et `docs/journal/socle.md`
(la chronologie, et sa fraîcheur). Le brief **n'est jamais remédié** : un risque qui pointe vers
lui dit que le PRD le lit mal — c'est une remédiation du PRD — ou qu'on veut changer d'intention,
ce qui est une décision humaine et pas une sortie de premortem.

**Scénario-cadre.**

> « Six mois après le démarrage, le projet a échoué — ou il a coûté trois fois le prévu, ou on l'a
> refondu. Le socle disait exactement ce qu'il dit là. Raconte pourquoi. »

Les lentilles se lisent au niveau produit et projet : le PRD mesure-t-il une issue ou une
activité ? La Stack porte-t-elle une hypothèse de charge, de coût ou d'équipe qui n'est écrite
nulle part ? Un ADR tient-il pour acquis un contexte qui aura changé ? La CI attrape-t-elle ce
qui casse vraiment, ou ce qui est facile à mesurer ? Et les **invariants** : la structure qui
aura vraiment fait mal six mois plus tard est-elle dans la table, ou la table ne retient-elle que
ce qui était facile à formuler au démarrage ? Un invariant qui, tenu à la lettre, ferait échouer
le projet compte autant qu'un invariant manquant.

**Formes de remédiation légales.**

- **Nouveau `SC-xxx` mesurable** dans `docs/prd.md` — verbe vérifiable, jamais adjectif.
- **Nouveau `FR-xxx` produit** dans `docs/prd.md`, prochain ID libre, jamais réattribué.
- **Item de scope EXCLU** dans la section « NON inclus » du PRD. Quand la bonne réponse est « on
  ne fait pas ça », l'écrire ferme la porte — c'est souvent la remédiation la plus rentable.
- **Contrainte ou exigence non fonctionnelle** dans `docs/stack.md`.
- **Contrôle** dans `docs/ci.md`, bloquant ou informatif selon que son taux de faux positifs a
  été mesuré sur la stack réelle. Non mesuré → informatif, et le passage en bloquant devient un
  chantier `en-attente`.
- **Principe ou entrée de Definition of Done** dans `CLAUDE.md`. **Garde-fou** : `CLAUDE.md` est
  *advisory*. Ce qui doit tenir à 100 % ne s'y écrit pas — ça descend dans `docs/ci.md`. Proposer
  une règle `CLAUDE.md` là où un contrôle est possible est un faux durcissement.
- **Candidat ADR** dans `docs/adr/_candidates/` pour une décision structurante. **Jamais** un edit
  d'ADR accepté : le hook `block-adr-edits` rend `exit 2`, et c'est voulu.
- **Candidat ADR, encore**, pour un **invariant d'architecture manquant** — c'est la seule forme
  par laquelle un risque sur `docs/archi.md` se referme. **Tu n'écris jamais dans `docs/archi.md` :**
  admettre un invariant appartient à la phase `archi`, qui l'oppose à son critère de trace
  observable dans l'arborescence ou dans les imports. Le candidat n'est donc pas un renvoi dans le
  vide : `/scd-sdd:adr` promeut ce qui porte une trace observable, et `/scd-sdd:ci` relit
  `docs/archi.md` **et** `docs/adr/` — l'invariant atteint son contrôle `arch-invariants` par
  cette route. Le candidat ne se rédige qu'avec sa trace ; sans elle, ce n'est pas un invariant
  mais une intention de design, et le risque se referme ailleurs — ou nulle part.
- Un invariant **existant** jugé faux ou périmé n'entre dans aucune de ces formes : le rouvrir
  demande de superséder l'ADR qui le porte. Il devient une fiche `en-attente` (voir « Le risque
  qui n'entre dans aucune forme »), jamais une correction silencieuse de la table.

**Journal.** `docs/journal/socle.md`, phase `premortem`.

**Ce qui suit.** Aucune gate n'existe à ce niveau : rien à re-jouer mécaniquement. Mais si la
passe a touché `docs/prd.md` ou `docs/stack.md`, **les features déjà spécifiées peuvent avoir
perdu leur backref** — un `FR` de spec trace vers un `FR` du PRD. Nomme-les explicitement et
recommande `/scd-sdd:analyze NNN` sur chacune. Ne les corrige pas toi-même : ce serait une
remédiation hors de la cible approuvée.
</socle>

<feature>
## Cible `feature`

**Précondition.** La gate `analyze` est au **vert** sur cette feature. Le premortem se joue
*après* elle, jamais à sa place : il suppose un contrat déjà conforme et cherche ce que la
conformité ne couvre pas. `docs/journal/NNN-slug.md` en porte la trace datée — contrôle aussi que
`spec.md`, `plan.md` et `tasks.md` n'ont pas bougé depuis. Sinon, renvoie vers
`/scd-sdd:analyze NNN`.

**Ce qui est jugé** : `specs/NNN-slug/spec.md` · `plan.md` · `tasks.md` (et `DELTA.md` en mode
brownfield, où le premortem se scope au delta).

**Le contexte, jamais jugé** : `docs/prd.md`, `docs/stack.md`, `docs/adr/`. Un risque qui pointe
vers le socle ne se remédie pas ici — il devient un signalement, ou un premortem de cible `socle`.

**Scénario-cadre.**

> « Trois mois après la livraison, la feature a échoué — bug en production, rework massif,
> utilisateurs qui ne l'adoptent pas. Elle a été implémentée fidèlement à partir de ces
> documents. Raconte pourquoi. »

**Formes de remédiation légales.**

- **Nouveau critère EARS** sur un `FR` existant — le cas fréquent : happy path → + chemin
  d'erreur. Un des 5 patterns (`feature-specs/references/ears.md`), verbe vérifiable.
- **Nouveau `FR`** — prochain ID libre, backref PRD `_(PRD: FR-0xx)_`, ou
  `[NEEDS CLARIFICATION: lien PRD]` si le lien est incertain, jamais un lien inventé. Un `FR`
  sans tâche laisse le contrat incomplet : il vient **avec** sa tâche d'impl et sa vérification
  observable, suivant le **mode déclaré du lot** (`TDD` / `test-after` / `check` / `inhérent`).
- **Item de scope EXCLU** dans la section « NON inclus » de `spec.md`.
- **Nouvelle tâche** dans un lot `Rn` existant, avec backref `_Requirements: FR-xxx_` et à la
  bonne position si le lot suit un ordre `TDD` (test avant impl).
- **Note de plan** dans `plan.md` — hypothèse explicitée, contrat d'intégration nommé.
- **Candidat ADR** dans `docs/adr/_candidates/`.

**Journal.** `docs/journal/NNN-slug.md`, phase `premortem`.

**Ce qui suit.** Le contrat a changé : **la re-passe `/scd-sdd:analyze NNN` est imposée** avant
tout passage de main à l'implémentation.

**La fiche de gate, si elle existe.** `docs/chantiers/en-cours/*-gate-NNN-*.md` porte la liste de
corrections laissée par `analyze`. **N'y touche pas.** Tu viens de modifier le contrat : sa liste
est **périmée**, et c'est la re-passe `analyze` qui la rafraîchira. Ses arbitrages (`## Écarté`),
eux, restent valides — une remédiation ne rouvre pas une décision déjà prise.
</feature>

<chantier>
## Cible `chantier`

**Précondition.** La fiche existe. Rends son **contrôle de fraîcheur** (ancre, âge,
consommation — skill `chantier`) *avant* de déléguer : durcir une fiche dont le dépôt est parti
ailleurs produit un plan pour un monde qui n'existe plus. Une fiche suspecte ne bloque pas, mais
le dire change ce que le facilitateur cherche.

**Ce qui est jugé** : la fiche elle-même — `## Objectif`, `## Acquis`, `## Prochaine étape`,
`## Écarté`.

**Le contexte, jamais jugé** : ce que son `## Contexte à charger` désigne, **et seulement selon
la classe déclarée** — `à lire` intégralement, `à extraire` par son ancre, `à situer` jamais
chargé. Les quatre classes et leurs seuils vivent dans `chantier/references/manifeste.md` :
charge-la. Charger tout le manifeste d'un chantier pour le durcir reproduirait exactement le
problème que le manifeste résout.

Les lignes **`à déléguer`** sont résolues **par la commande** avant l'appel, via `chantier-reader`
— le facilitateur n'a pas `Task`. Il reçoit les réponses ancrées, pas les chemins.

**Scénario-cadre.**

> « Le chantier a été repris trois semaines plus tard et ça s'est mal passé — on a refait ce qui
> était déjà fait, on est reparti sur une piste déjà morte, la prochaine étape ne voulait plus
> rien dire, ou il n'a jamais été repris du tout. Raconte pourquoi. »

C'est la cible où la lentille **hypothèses tues** paie le plus : une fiche est écrite par
quelqu'un qui a tout le contexte en tête, pour quelqu'un qui n'en aura plus rien.

**Formes de remédiation légales.**

- **`## Prochaine étape` précisée ou réordonnée** — elle doit nommer un fichier, un test ou un
  symbole, sans quoi le contrôle de consommation ne peut rien vérifier.
- **Item dans `## Écarté`**, avec motif. La rubrique de plus forte valeur de la fiche : rien
  d'autre dans le projet ne porte les pistes mortes.
- **Référence ajoutée à `## Contexte à charger`**, avec sa **classe** — et jamais un chemin nu
  au-delà de ~300 lignes.
- **Conclusion distillée dans `## Acquis`** — quand ce qu'on veut est une conclusion, elle va là
  et le fichier n'est jamais rechargé.
- **Champ `Bloqué par :`** sous l'en-tête, quand le risque est l'attente d'un tiers. C'est un
  **motif**, pas un état : la fiche ne change pas de répertoire.
- **Candidat ADR** dans `docs/adr/_candidates/`, quand le premortem fait émerger une décision
  structurante — elle n'a jamais sa place dans une fiche.

**Deux gardes propres à cette cible.**

- **Le plafond de ~50 lignes tient.** Si les remédiations approuvées le font déborder, on ne
  gonfle pas : on **distille** (une conclusion remplace trois lignes de contexte) ou on **scinde**
  en un second chantier. Une fiche qui dépasse durablement n'est plus un chantier mais une
  feature — renvoyer vers `/scd-sdd:kickoff-feature`.
- **Aucun fait dérivable n'entre.** Pas d'état de lot, pas de résultat de tests, pas de verdict de
  gate, pas de pourcentage, pas de numéro de PR présenté comme un état. C'est ce qui empêche une
  fiche d'être démentie par les fichiers.

**Journal.** **Aucune ligne.** Un chantier ne journalise pas — la fiche est le fait, et son
`Actualisé le` date le durcissement. La commande met ce champ à jour et **commite la fiche**,
`git add` scopé à elle seule.

**Ce qui suit.** Rien à re-jouer. `/scd-sdd:resume` lira la fiche durcie à la reprise.
</chantier>

<hors-forme>
## Le risque qui n'entre dans aucune forme

Il ne se jette pas et ne se force pas. Deux issues, décidées au gate humain comme les autres :

- **Sa remédiation est un travail, pas un texte** — mesurer, éprouver, migrer, instrumenter → une
  **fiche `docs/chantiers/en-attente/AAAA-MM-JJ-slug.md`**, de la portée de la cible (`socle`,
  `NNN-slug`, ou `hors-cycle`). Contrat : skill `chantier`. Légal aux trois cibles.
- **Il vise un autre niveau que la cible** — un risque de socle trouvé en durcissant une feature,
  un risque de contrat trouvé en durcissant un chantier → **signalement nommé dans le rapport
  final**, avec la commande qui le traiterait. On ne remédie jamais hors de la cible : ce serait
  une écriture qu'aucune résolution de cible n'a couverte.

Dans les deux cas, le rapport final le **nomme**. Un risque retenu puis silencieusement abandonné
est le seul résultat qu'un premortem n'a pas le droit de produire.
</hors-forme>
