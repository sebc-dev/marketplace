# Référence — Gate de conformité (`analyze`)

<role>
**Gate de conformité du cycle.** Atteste que `spec.md` / `plan.md` / `tasks.md` sont **prêts pour une
implémentation optimale** par un workflow aval. Peut être suivie de la passe optionnelle `premortem`
(skill `premortem`), qui durcit un contrat déjà conforme par projection d'échec.

**Ce que la gate ne touche pas, et ce qu'elle écrit** — la frontière est là, et elle n'est pas
« lecture seule » :

- elle ne modifie **aucun document du contrat** : `spec.md`, `plan.md`, `tasks.md` et le socle en
  sortent **bit pour bit identiques** ;
- elle ne persiste **aucun verdict comme état** (un PASS écrit deviendrait faux dès la prochaine
  édition — la gate est bon marché, on la relance) ;
- elle écrit exactement **deux artefacts, ailleurs** : **une ligne datée dans
  `docs/journal/NNN-slug.md`** et une **fiche de chantier de gate** (`<gate>` ci-dessous), qui porte
  la liste de corrections et **jamais** le verdict.

La ligne de journal est un *événement* — « le 28/07, la gate a rendu PRÊT » reste vrai pour
toujours — et non un état qu'on relirait comme « la feature est validée ». Un lecteur ne le
convertit jamais en état sans contrôler sa fraîcheur contre la date de modification de
`spec.md`/`plan.md`/`tasks.md` (skill `journal`). Pourquoi la fiche, elle, a le droit d'exister :
`<gate>`.

Ce n'est pas une revue de code : le code n'existe pas encore et n'est pas notre affaire. C'est un
**contrôle qualité du contrat** — des « unit tests for English ». Attraper un trou ici coûte
infiniment moins cher qu'après l'implémentation.
</role>

<checks>
Seize contrôles, groupés. Chacun est **vérifiable** : ne rapporte que ce qui est constatable dans
les fichiers, jamais une impression.

**Chaque contrôle porte sa nature** — `D` **déterministe** ou `J` **de jugement**. C'est elle qui
décide ce qui se déroule intégralement à chaque passe et ce qui entre dans la **passe delta**
(`<gate>`, § *La partition de la grille, et la passe delta*). Un contrôle qui porte les deux natures
les nomme **clause par clause** : une résolution est `D`, la **suffisance** de ce qui la justifie
est `J`.

**Le critère est falsifiable** : *une seconde exécution, sur le même texte, reproduit-elle le finding
au caractère près ?* Un backref résout ou non, un marqueur est là ou non, une section existe ou non,
un `FR` existe dans le PRD ou non → `D` ; tout le reste — EARS, verticalité, dimensionnement,
cohérence avec le socle — est `J`. **En cas de doute, `J`** : classé `D` à tort, un contrôle produit
du bruit à chaque passe, ce qui est le défaut qu'on corrige.

**Traçabilité (la chaîne doit être complète et sans orphelin)**
1. **spec → PRD** `D` : chaque `FR-xxx`/`SC-xxx` de la feature trace vers un `FR/SC` du `docs/prd.md` (`_(PRD: FR-0xx)_`), ou l'écart est explicitement justifié — la **suffisance** de cette justification, `J`.
2. **spec → tasks** `D` : chaque `FR`/`SHALL` a, dans **un seul** lot, ≥ 1 tâche **d'impl** et ≥ 1 **vérification observable** — tâche test (`TDD`/`test-after`), tâche check (`check`), ou le critère d'acceptation de l'impl lui-même (`inhérent`). Chaque lot **déclare** son mode `D` ; tout mode ≠ `TDD` est **justifié** (une ligne) — la justification est présente `D`, sa pertinence `J` —, et un `check`/`inhérent` posé sur de la logique métier est un finding `J`.
3. **tasks → spec** `D` : chaque tâche porte un backref `_Requirements:_` valide. Une tâche orpheline = scope creep.

**Qualité des critères (testabilité)**
4. **EARS** `J` : chaque critère suit un des 5 patterns (`ears.md`). Un critère hors EARS sans raison = Major.
5. **Verbe vérifiable, jamais adjectif** `J` : aucun « rapide / robuste / sécurisé / intuitif » sans cible mesurable. Un adjectif non chiffré = un test impossible à écrire.
6. **Atomicité** `J` : aucun `FR` ne contient un « et » masquant deux comportements.

**Frontières (ce qui empêche le sur-engineering et les fuites)**
7. **Technology-agnostic** `J` : aucun framework/lib/DB dans `spec.md` (ils appartiennent à `plan.md`).
8. **Scope EXCLU** : la section « NON inclus » existe et est non vide `D` ; rien dans `plan.md`/`tasks.md` n'implémente ce qu'elle exclut `J`.
9. **Ambiguïtés** `D` : zéro `[NEEDS CLARIFICATION]` restant.

**Cohérence**
10. **Socle** `J` : `plan.md` ne contredit aucun ADR accepté, ne re-décide rien de `docs/stack.md`, et toute décision structurante nouvelle est un **candidat** dans `docs/adr/_candidates/`. Aucune info du socle n'est recopiée (on lie).
11. **Contradictions internes** `J` : aucun couple de critères mutuellement incompatibles. Les trois **présences** attendues dans `plan.md` — des fichiers précis nommés, un patron de référence cité, **une** étape de vérification bout-en-bout définie — sont `D`.

**Reviewability du découpage (ce qui décide si la review humaine aval sera réelle ou fictive)**
12. **Verticalité** `J` : chaque lot `Rn` de `tasks.md` traverse les couches et livre de la valeur vérifiable. Un lot horizontal (« créer la table », « créer l'API ») = Critical : sa correction ne se juge qu'en assemblage, donc il n'est pas reviewable seul.
13. **Sujet unique & indépendance** `J` : chaque lot est nommable en une phrase sans « et », et se comprend sans charger les lots voisins en mémoire (`dépend de :` = ordre, pas compréhension).
14. **Dimensionnement** `J` : aucun lot ne dépasse les signaux de scission (≈ 400 lignes estimées, ≈ 7 concepts, ≈ 5-7 critères par exigence) sans justification. Un dépassement est **Major, jamais Critical** — ces seuils sont transposés du code par analogie et le budget est une estimation, pas une mesure. Symétriquement : un lot qui ne livre aucun incrément vérifiable est une couche déguisée à refusionner. *(Une estimation ne se reproduit pas au caractère près : ce contrôle est de jugement par construction.)*

**Architecture (le socle structurel, quand il existe)**
15. **Invariants d'architecture** `J` — la **présence** d'une dérogation nommée dans « Réutilisation du socle » est `D` : les fichiers touchés de `plan.md` respectent les invariants de `docs/archi.md` — aucune frontière franchie, aucun sens de dépendance inversé, aucun artefact placé hors du dossier prescrit —, ou la dérogation est **nommée et justifiée** dans « Réutilisation du socle » (l'étape de confrontation de `/scd-sdd:plan`). Une dérogation muette est un **Major**. Ce contrôle est **Major, jamais Critical** : bloquer la gate dessus ferait d'`analyze` un `arch-invariants` avant l'heure, alors que c'est la CI qui mesure une violation sur le code réel. **Pas de `docs/archi.md` → le contrôle est sans objet**, et son absence n'est pas un finding : la phase `archi` n'a simplement pas été jouée.

**Gherkin dérivé (quand la feature en porte)**
16. **`.feature` dérivé et bien formé** — la **résolution** de la référence citée (le `FR-0xx`/`SHALL` existe-t-il dans `spec.md` ?) est `D` ; l'**écart** avec ce `SHALL` et la **forme** sont `J` : la feature porte-t-elle des `specs/NNN-slug/acceptance/*.feature` ? **Aucun → le contrôle ne se déclenche pas**, et ce n'est pas un finding : c'est une non-applicabilité (le Gherkin est un complément réservé aux critères à combinatoire réelle). Au moins un → **charge le bloc `<guidance>` de `references/gherkin.md`** — il porte les règles de dérivation et de forme, qui **ne sont pas recopiées ici** — et confronte chaque fichier à ses deux questions : est-il **dérivé** d'un `FR-0xx`/`SHALL` de `spec.md` qu'il cite et dont il ne s'écarte pas, et est-il **bien formé** ? Trois natures de finding, trois sévérités. Un `.feature` qui **contredit** le `SHALL` qu'il cite est un **Critical** : deux vérités concurrentes dans le même contrat, et c'est l'exécutable que l'aval suivra — rien en aval ne rattrape l'écart, puisque l'implémentation le fera passer au vert tel quel. Un `.feature` **sans `SHALL` d'origine** (aucune référence, ou une référence vers un `FR` inexistant) est un **Major** : du scope creep exécutable, précédent exact de la tâche orpheline du contrôle 3. Un défaut de **forme** est un **Major**. Ce contrôle **ne porte jamais sur le vert** : ce plugin n'exécute aucun test, et le faire passer appartient au workflow d'implémentation.
</checks>

<report>
Le rapport reste en conversation. **Sa liste de travail, elle, est écrite dans un chantier de
gate** (`<gate>` ci-dessous) — sans quoi elle meurt au `/clear` suivant, et la passe d'après
repart à froid. Findings classés par ce qu'ils coûtent en aval :

- **Critical** — rend l'implémentation non fiable, ou la review aval fictive : `FR` sans impl ou sans vérification observable, `[NEEDS CLARIFICATION]` restant, plan contredisant un ADR, scope EXCLU violé, critère non testable (adjectif nu), **lot horizontal**, **lot à sujets multiples**, mode `check`/`inhérent` masquant l'absence de preuve sur de la **logique métier**, **`.feature` contredisant le `SHALL` qu'il cite**.
- **Major** — fera perdre du temps : backref manquant, tâche orpheline, critère hors EARS, fuite de stack dans la spec, `FR` non atomique, **lot hors seuils de scission**, **mode de vérification ≠ `TDD` non justifié**, **invariant de `docs/archi.md` franchi sans dérogation justifiée**, **`.feature` sans `SHALL` d'origine ou mal formé**.
- **Minor** — améliore : `[P]` douteux, patron de référence absent, formulation perfectible.

**Le rapport ouvre sur la trajectoire, pas sur les findings.** Avant toute liste : la **trajectoire
des décomptes** lue au journal (`3 Critical → 2 → 2 → 4`, une ligne par passe), le **régime de la
passe** — delta, ou intégrale **et pourquoi** —, puis, si elle s'est déclenchée, la **garde sur la
divergence** (`<gate>`). C'est cela qui se décide ; les findings ne sont que le détail de la passe
courante.

**Le verdict est monotone.** À partir de la passe 2, un **Critical neuf** n'est admissible que s'il
est **déterministe** ou porte sur du **texte modifié depuis l'ancre** ; tout autre **plafonne en
Major**, et le rapport dit qu'il a plafonné. Le nombre de bloquants ne peut donc que décroître —
**sauf** quand les corrections ont réellement cassé quelque chose, le seul cas où une passe de plus
se justifie. Les sévérités plafond de la grille ne bougent pas pour autant : le contrôle 15 reste
**Major, jamais Critical**, et un `.feature` qui contredit son `SHALL` reste **Critical** quand il
est neuf sur du texte modifié.

Format :
```
## Validation — specs/NNN-feature
Trajectoire : 3 Critical → 2 → 2 → 4 · passe 4 · régime : delta (ancre a1b2c3d)
⚠ Garde : le décompte ne baisse plus depuis la passe 2.
_Critical = bloque l'implémentation · Major = à corriger, ne bloque pas le démarrage ·
Minor = amélioration_
### Critical (N)
- [FR-003] « le système doit être rapide » : adjectif sans cible → non testable.
  → Remplacer par une valeur mesurable (ex. « P99 < 50 ms »). Fichier : spec.md
- [R2] « table users + API + UI » : lot horizontal → non reviewable seul.
  → Scinder par étape du workflow : R2a « s'inscrire », R2b « se connecter ». Fichier : tasks.md
### Major (N) / ### Minor (N)
- …

### Corrigés depuis la passe du JJ/MM (N)
- [FR-003] adjectif sans cible — absent ce coup-ci.
### Déjà arbitrés (N) — non recomptés dans le verdict
- [R4] hors seuils (~520 l.) — assumé le 06/08 : CRUD homogène, scinder produirait deux
  moitiés incompréhensibles seules.
### Non détecté à la passe 3 (N) — hors décompte, jamais Critical
- [FR-008] critère hors EARS — contrôle de jugement, sur du texte inchangé depuis l'ancre :
  raté de la passe précédente, pas du travail neuf.

Couverture : X/Y FR ont une vérification observable + une impl · Z tâches sans backref
Vérification : N lots (M non-`TDD` : modes déclarés + justifiés)
Découpage : N lots · ~X lignes estimées au total · Z lots hors seuils
Verdict : PRÊT POUR IMPLÉMENTATION (zéro Critical) | CORRIGER D'ABORD (Critical présents)
```

Ces trois blocs n'existent qu'à partir de la deuxième passe. **« Corrigés depuis »** est le
signal qui manquait : sans lui, on ne distingue pas *corrigé* de *pas re-mentionné cette fois*.
Il est fiable pour un Critical ou un Major, faible pour un Minor — c'est pourquoi les Minor ne
sont pas portés par la fiche.

Chaque finding nomme le **fichier**, l'**ID** (`FR-xxx`, `Tn` ou `Rn`) concerné et l'**action** de
correction — pour un lot rejeté, l'action est un **axe de scission** nommé. Verdict `PRÊT`
uniquement si **zéro Critical**.

**Deux seconds regards, deux mandats disjoints.** Le contexte principal a souvent rédigé ces
documents : il est mal placé pour les juger. Déléguer en contexte frais (sur demande, ou si la
feature est grosse) :
- `ears-verifier` — traçabilité, conformité EARS, frontières, cohérence socle (contrôles 1-11) ;
- `slice-auditor` — reviewability du découpage (contrôles 12-14).

Ils sont indépendants : les lancer en parallèle, puis fusionner leurs findings dans un rapport
unique sans les rejuger. **Les contrôles 15 et 16 ne sont délégués ni à l'un ni à l'autre**, et les
deux mandats **1-11 / 12-14 restent bornés tels quels** : le 15 se juge contre `docs/archi.md`, que
le contexte principal a lu ; le 16 porte sur `acceptance/*.feature`, que ni l'un ni l'autre ne
reçoit dans son protocole d'entrée, et demande un chargement conditionnel qu'aucun des deux ne
déclare. Ajouter « et 16 » à un mandat contigu coûterait plus qu'il ne rapporte.
</report>

<gate>
## Le chantier de gate — où vit la liste de travail

**Pourquoi.** Le verdict est persisté (une ligne de journal), la **liste des corrections** ne
l'était pas. Or c'est la seule partie actionnable : elle mourait au `/clear`, la commande de
correction repartait à froid, et la passe suivante re-listait à l'identique les Major qu'on avait
décidé d'assumer. Le contrat ne convergeait plus.

L'interdiction d'origine — « aucun rapport sur disque » — visait juste, mais un cran trop large.
Elle protège le **verdict**, qui deviendrait faux à la première édition. Elle ne vaut pas pour la
**liste de travail** : « FR-003 n'a pas de cible chiffrée → mettre P99 < 50 ms » ne devient pas
*faux* quand un document bouge, il devient *fait* — et c'est vérifiable.

**Où.** Un chantier ordinaire (skill `chantier`), de portée **`NNN-slug · gate`**, nommé
`docs/chantiers/en-cours/AAAA-MM-JJ-gate-NNN-slug.md`. Ce n'est **pas** un document du contrat :
`spec.md`, `plan.md` et `tasks.md` sortent toujours d'`analyze` bit pour bit identiques.

```markdown
# Gate 001-auth — 2 Critical · 5 Major

Portée : 001-auth · gate
Ouvert le 2026-08-06 · Actualisé le 2026-08-06 · branche `main` · HEAD `a1b2c3d`

## Objectif
Passer la gate de conformité de 001-auth : zéro Critical.

## Contexte à charger
à lire  `specs/001-auth/spec.md` — porte FR-003
à lire  `specs/001-auth/tasks.md` — porte R2

## À corriger
### Critical (2)
- [FR-003] `spec.md` — adjectif sans cible, non testable → mettre une valeur mesurable (« P99 < 50 ms »). Phase : `specify`
- [R2] `tasks.md` — lot horizontal, non reviewable seul → scinder : R2a « s'inscrire », R2b « se connecter ». Phase : `tasks`
### Major (5)
- …

## Prochaine étape
Corriger FR-003 par `/scd-sdd:specify 001`, puis R2 par `/scd-sdd:tasks 001`.

## Écarté
- [R4] hors seuils (~520 l. estimées) — assumé le 06/08 : CRUD homogène, le scinder
  produirait deux moitiés incompréhensibles seules.
```

**Ce que la fiche porte, et ce qu'elle ne porte pas.** Les **Critical** et les **Major non
arbitrés**, plus **tout arbitrage** dans `## Écarté`. Les Minor non arbitrés restent en
conversation : les porter recréerait exactement le bruit qu'on supprime, et ils se re-dérivent pour
rien. **Le format est serré parce que la taille suit les findings** : une ligne par finding —
défaut et correction sur la même ligne —, une ligne par entrée d'`## Écarté`. Le plafond de
~50 lignes du skill `chantier` est ici une **cible annoncée, jamais bloquante** (le régime du
budget du manifeste) : on ne tronque **jamais** la liste, et un dépassement massif malgré le
format dit que le contrat est très cassé — l'issue est de le corriger, pas de raccourcir la fiche.

**L'arbitrage.** `## Écarté` est le registre des findings qu'on assume, avec **motif et date**.

> **On n'arbitre jamais un Critical.** Un Critical rend l'implémentation non fiable ou la review
> aval fictive : il bloque, toujours. Seuls les Major et les Minor s'arbitrent. Une demande
> d'arbitrage sur un Critical se refuse en le disant.

C'est la frontière qui empêche la gate de devenir un tampon.

**Appariement entre passes.** Un finding est identifié par le triplet **`[ID]` · fichier ·
nature** (`[FR-003] spec.md adjectif-sans-cible`). À chaque passe :

1. **Dérouler la grille intégralement — les contrôles déterministes.** On ne saute **jamais** un
   contrôle `D` parce que la fiche dit « arbitré » : on détecte tout, on ne change que la
   *présentation*. C'est ce qui empêche la gate de devenir un tampon, et c'est gratuit. Les
   contrôles `J` sont bornés par la passe delta ci-dessous : la règle est **restreinte, jamais
   retirée**.
2. Un finding apparié à une entrée d'`## Écarté` → bloc **« Déjà arbitrés »**, hors du décompte
   qui décide du verdict.
3. Un finding de la fiche qui n'apparaît plus → bloc **« Corrigés depuis »**, et il sort de la
   fiche.
4. Un finding **de jugement, neuf, sur du texte qui n'a pas bougé** → bloc **« Non détecté à la
   passe N »** : un raté de la passe précédente, pas du travail neuf. Il se rapporte **nommément**,
   **sort du décompte** et **ne peut pas être Critical**. L'effacer rendrait le dispositif
   indétectable ; le compter rétablirait la boucle.
5. Le reste → rapport normal, et écrit dans la fiche.

### La partition de la grille, et la passe delta

Chaque contrôle porte sa **nature** — `D` ou `J` — **dans la grille** (`<checks>`), jamais ici ni
dans la commande : une seconde copie dériverait au premier contrôle ajouté. Le **critère qui classe**
et la **règle du doute** y vivent avec elle, en tête de `<checks>`.

**L'ancre.** La fiche de gate ouverte porte `HEAD <sha>`, rafraîchi à chaque actualisation. C'est la
**seule** mémoire légale de ce qui a déjà été jugé : écrire « lot jugé conforme » dans la fiche
serait un fait dérivable (`DECISIONS.md` §D1, §D18, §D21), et deviendrait faux à la première
édition. Le disque porte déjà l'historique.

**Le calcul.** `git rev-parse HEAD` pour l'ancre du jour ; `git diff <ancre> -- specs/NNN-slug/`
pour ce qui a bougé depuis. Les contrôles **`J`** ne s'appliquent qu'à ces lignes-là, plus la
**liste ouverte** du `## À corriger`. Les contrôles **`D`** se déroulent sur les trois documents
entiers, à chaque passe — ils sont gratuits et sans bruit, et c'est là que la règle « dérouler la
grille intégralement » reste entière.

**Trois cas rendent le delta incalculable. Dans les trois, la passe est intégrale :**

1. **Passe 1** — aucune fiche précédente, donc aucune ancre.
2. **Pas d'ancre** — la fiche est antérieure au dispositif, ou sa ligne `HEAD` manque.
3. **Corrections non commitées** — `git diff -- specs/NNN-slug/` rend un diff non vide : ce qui a
   bougé depuis le jugement n'est pas dans l'historique, et le diff contre l'ancre ne le verrait
   pas. C'est le cas **courant** ici, les phases `specify`/`clarify`/`plan`/`tasks` ne commitant
   rien elles-mêmes : la passe delta suppose des corrections commitées.

⚠️ **Le mode dégradé se dit** — annonce la passe intégrale **et son motif** en tête de rapport. Le
danger n'est pas l'excès de couverture, c'est l'inverse : un delta calculé sur une ancre absente
rend un diff **vide**, donc **zéro contrôle de jugement joué**. Une passe delta silencieusement
dégradée est un tampon, et ce serait pire que le défaut d'origine.

### La garde sur la divergence, et le budget de passes

**La trajectoire s'affiche en tête de rapport**, avant les findings : `3 Critical → 2 → 2 → 4`. Elle
se lit dans `docs/journal/NNN-slug.md`, une ligne de phase `analyze` par passe — déjà versionnée, et
c'est elle qui se décide.

**La garde mesure la divergence, pas la stagnation** : **dès la passe 2** — avant, il n'y a pas de
décompte précédent et la garde ne peut rien dire —, elle se déclenche quand le décompte des
**Critical** — celui qui décide du verdict — **n'est pas strictement inférieur** à celui de la passe
précédente. Une garde qui n'attraperait que « rien ne bouge » serait muette exactement dans le cas du
**tapis roulant** — on corrige à chaque tour, et le total ne baisse pas. Les **Major** ne la
déclenchent pas : leur variation se lit dans la trajectoire, elle ne prononce rien.

**Le budget : trois passes.** Dès la **3ᵉ passe avec fiche de gate encore ouverte**, cesse de
proposer une relance et **pose l'arbitrage** — **trois issues**, dont « une passe de plus » qui reste
valide : le blocage est **en amont** (le socle manque de ce sur quoi la spec devrait tracer) · la
**phase a été jouée trop tôt**, et c'est elle qu'il faut reprendre — périmètre trop large,
`[NEEDS CLARIFICATION]` déguisé en critère, ou une feature qui en demandait deux · **une passe de
plus**. Ce n'est **pas une interdiction** — aucun hook, aucun blocage mécanique —, c'est une
**question posée** ; et le budget est un **repère**, pas une mesure : aucun corpus ne l'établit.

Ces trois issues sont **limitatives** : au budget, la fiche n'est *encore ouverte* que si le verdict
est `CORRIGER D'ABORD`, donc s'il reste au moins un **Critical** — et un Critical ne s'arbitre
jamais. L'arbitrage des Major, lui, a déjà son moment : l'étape d'arbitrage de la commande, à chaque
passe.

**Cycle de vie.** Verdict `CORRIGER D'ABORD` → ouvrir ou actualiser la fiche. Verdict `PRÊT` →
ajouter `## Issue` (ce qui a été corrigé, en combien de passes) et l'archiver.

**Les arbitrages survivent à l'archivage.** À l'ouverture d'une nouvelle fiche de gate pour la même
feature, reprendre le `## Écarté` de la **dernière fiche archivée** de cette feature
(`docs/chantiers/archive/*-gate-NNN-slug.md`, la plus récente). Un arbitrage est une décision, pas
une note de passage : le re-litiger à chaque re-gate serait exactement la boucle qu'on ferme. Le
ré-import s'**élague** : une entrée dont l'objet n'existe plus — FR retiré, lot rescindé — ne se
ré-importe pas, et le retrait se dit en conversation. L'arbitrage tombe avec son **objet**, jamais
avec l'avis.
</gate>

<guidance>
- **Ne corrige pas.** Tu signales, tu nommes le fichier et l'action. L'humain ou la phase concernée corrige.
- **Ne rapporte pas de préférences de style.** Un relecteur à qui on demande de trouver des lacunes en trouvera toujours ; s'en tenir à ce qui affecte la testabilité, la traçabilité ou les frontières.
- **Ne juge pas le code** : il n'existe pas. Les tests sont *prévus* dans `tasks.md`, pas exécutés.
- **N'exige pas un test là où la preuve est légitimement autre.** Un lot `inhérent` (CI, infra, config, scaffolding) n'a pas de tâche test : la preuve est le critère d'acceptation de l'impl (« run → vert »). Ne le rapporte pas comme « FR sans test » — vérifie seulement que ce critère est **observable** (pas un adjectif) et que le mode est **déclaré et justifié**. Le finding, c'est un `check`/`inhérent` posé sur de la logique métier testable, pas l'usage légitime du mode.
- **Ne transforme pas une estimation en gate.** Les budgets de lots sont des ordres de grandeur documentaires (ce plugin ne lit pas le code) et les seuils viennent d'études sur le code, transposés par analogie. Ils déclenchent une question, jamais un verdict — d'où « lot hors seuils = Major ». Les bloquants du découpage sont **qualitatifs** : verticalité, sujet unique, indépendance.
- **Relançable à volonté** : après correction, rejouer la gate. C'est bon marché et toujours à jour.
- **Convergence, pas répétition.** Une passe qui ressemble trait pour trait à la précédente est le
  symptôme d'un contrat qui ne converge pas. Deux garde-fous : la liste de travail est **portée par
  la fiche de gate** (`<gate>`), donc la commande de correction part d'elle et non d'une
  re-dérivation à froid ; et un Major qu'on assume **s'arbitre une fois** au lieu d'être re-signalé
  indéfiniment. **La garde, elle, mesure la divergence** — un décompte qui ne baisse plus — et un
  **budget de trois passes** propose la sortie : condition, trajectoire et issues en `<gate>`,
  § *La garde sur la divergence, et le budget de passes*. Une garde qui n'attraperait que « rien ne
  bouge » serait muette exactement là où on tourne en rond **en avançant**.
- **Le cycle boucle après la conformité.** Un verdict `PRÊT` ouvre le passage de main. Pour une feature à fort enjeu, la passe optionnelle `premortem` durcit le contrat d'abord (puis on relance cette gate). Une fois `PRÊT` (re)confirmé, le contrat part vers le workflow d'implémentation et on repart sur la suivante par `/scd-sdd:kickoff-feature` (ou `/scd-sdd:status-specs` si plusieurs sont en vol).
</guidance>
