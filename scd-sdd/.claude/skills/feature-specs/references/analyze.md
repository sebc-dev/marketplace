# Référence — Gate de conformité (`analyze`)

<role>
**Gate de conformité du cycle.** Atteste que `spec.md` / `plan.md` / `tasks.md` sont **prêts pour une
implémentation optimale** par un workflow aval. Peut être suivie de la passe optionnelle `premortem`
(skill `premortem`), qui durcit un contrat déjà conforme par projection d'échec. **Lecture
seule + rapport** : ne modifie aucun document du contrat, et ne persiste **aucun verdict comme
état** (un PASS écrit sur disque deviendrait faux dès la prochaine édition — la gate est bon
marché, on la relance).

Seule écriture autorisée : **une ligne datée dans `docs/journal/NNN-slug.md`**. C'est un *événement* — « le
28/07, la gate a rendu PRÊT » reste vrai pour toujours — et non un état qu'on relirait comme
« la feature est validée ». Un lecteur ne le convertit jamais en état sans contrôler sa fraîcheur
contre la date de modification de `spec.md`/`plan.md`/`tasks.md` (skill `journal`).

Ce n'est pas une revue de code : le code n'existe pas encore et n'est pas notre affaire. C'est un
**contrôle qualité du contrat** — des « unit tests for English ». Attraper un trou ici coûte
infiniment moins cher qu'après l'implémentation.
</role>

<checks>
Quinze contrôles, groupés. Chacun est **vérifiable** : ne rapporte que ce qui est constatable dans
les fichiers, jamais une impression.

**Traçabilité (la chaîne doit être complète et sans orphelin)**
1. **spec → PRD** : chaque `FR-xxx`/`SC-xxx` de la feature trace vers un `FR/SC` du `docs/prd.md` (`_(PRD: FR-0xx)_`), ou l'écart est explicitement justifié.
2. **spec → tasks** : chaque `FR`/`SHALL` a, dans **un seul** lot, ≥ 1 tâche **d'impl** et ≥ 1 **vérification observable** — tâche test (`TDD`/`test-after`), tâche check (`check`), ou le critère d'acceptation de l'impl lui-même (`inhérent`). Chaque lot **déclare** son mode ; tout mode ≠ `TDD` est **justifié** (une ligne), et un `check`/`inhérent` posé sur de la logique métier est un finding.
3. **tasks → spec** : chaque tâche porte un backref `_Requirements:_` valide. Une tâche orpheline = scope creep.

**Qualité des critères (testabilité)**
4. **EARS** : chaque critère suit un des 5 patterns (`ears.md`). Un critère hors EARS sans raison = Major.
5. **Verbe vérifiable, jamais adjectif** : aucun « rapide / robuste / sécurisé / intuitif » sans cible mesurable. Un adjectif non chiffré = un test impossible à écrire.
6. **Atomicité** : aucun `FR` ne contient un « et » masquant deux comportements.

**Frontières (ce qui empêche le sur-engineering et les fuites)**
7. **Technology-agnostic** : aucun framework/lib/DB dans `spec.md` (ils appartiennent à `plan.md`).
8. **Scope EXCLU** : la section « NON inclus » existe et est non vide ; rien dans `plan.md`/`tasks.md` n'implémente ce qu'elle exclut.
9. **Ambiguïtés** : zéro `[NEEDS CLARIFICATION]` restant.

**Cohérence**
10. **Socle** : `plan.md` ne contredit aucun ADR accepté, ne re-décide rien de `docs/stack.md`, et toute décision structurante nouvelle est un **candidat** dans `docs/adr/_candidates/`. Aucune info du socle n'est recopiée (on lie).
11. **Contradictions internes** : aucun couple de critères mutuellement incompatibles ; `plan.md` nomme des fichiers précis, cite un patron de référence, et définit **une** étape de vérification bout-en-bout.

**Reviewability du découpage (ce qui décide si la review humaine aval sera réelle ou fictive)**
12. **Verticalité** : chaque lot `Rn` de `tasks.md` traverse les couches et livre de la valeur vérifiable. Un lot horizontal (« créer la table », « créer l'API ») = Critical : sa correction ne se juge qu'en assemblage, donc il n'est pas reviewable seul.
13. **Sujet unique & indépendance** : chaque lot est nommable en une phrase sans « et », et se comprend sans charger les lots voisins en mémoire (`dépend de :` = ordre, pas compréhension).
14. **Dimensionnement** : aucun lot ne dépasse les signaux de scission (≈ 400 lignes estimées, ≈ 7 concepts, ≈ 5-7 critères par exigence) sans justification. Un dépassement est **Major, jamais Critical** — ces seuils sont transposés du code par analogie et le budget est une estimation, pas une mesure. Symétriquement : un lot qui ne livre aucun incrément vérifiable est une couche déguisée à refusionner.

**Architecture (le socle structurel, quand il existe)**
15. **Invariants d'architecture** : les fichiers touchés de `plan.md` respectent les invariants de `docs/archi.md` — aucune frontière franchie, aucun sens de dépendance inversé, aucun artefact placé hors du dossier prescrit —, ou la dérogation est **nommée et justifiée** dans « Réutilisation du socle » (l'étape de confrontation de `/scd-sdd:plan`). Une dérogation muette est un **Major**. Ce contrôle est **Major, jamais Critical** : bloquer la gate dessus ferait d'`analyze` un `arch-invariants` avant l'heure, alors que c'est la CI qui mesure une violation sur le code réel. **Pas de `docs/archi.md` → le contrôle est sans objet**, et son absence n'est pas un finding : la phase `archi` n'a simplement pas été jouée.
</checks>

<report>
Le rapport reste en conversation. **Sa liste de travail, elle, est écrite dans un chantier de
gate** (`<gate>` ci-dessous) — sans quoi elle meurt au `/clear` suivant, et la passe d'après
repart à froid. Findings classés par ce qu'ils coûtent en aval :

- **Critical** — rend l'implémentation non fiable, ou la review aval fictive : `FR` sans impl ou sans vérification observable, `[NEEDS CLARIFICATION]` restant, plan contredisant un ADR, scope EXCLU violé, critère non testable (adjectif nu), **lot horizontal**, **lot à sujets multiples**, mode `check`/`inhérent` masquant l'absence de preuve sur de la **logique métier**.
- **Major** — fera perdre du temps : backref manquant, tâche orpheline, critère hors EARS, fuite de stack dans la spec, `FR` non atomique, **lot hors seuils de scission**, **mode de vérification ≠ `TDD` non justifié**, **invariant de `docs/archi.md` franchi sans dérogation justifiée**.
- **Minor** — améliore : `[P]` douteux, patron de référence absent, formulation perfectible.

Format :
```
## Validation — specs/NNN-feature
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

Couverture : X/Y FR ont une vérification observable + une impl · Z tâches sans backref
Vérification : N lots (M non-`TDD` : modes déclarés + justifiés)
Découpage : N lots · ~X lignes estimées au total · Z lots hors seuils
Verdict : PRÊT POUR IMPLÉMENTATION (zéro Critical) | CORRIGER D'ABORD (Critical présents)
```

Les deux blocs neufs n'existent qu'à partir de la deuxième passe. **« Corrigés depuis »** est le
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
unique sans les rejuger. **Le contrôle 15 n'est délégué ni à l'un ni à l'autre** : il se juge
contre `docs/archi.md`, que le contexte principal a lu, et les deux mandats restent ceux-ci.
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
- [FR-003] `spec.md` — adjectif sans cible → non testable.
  → Mettre une valeur mesurable (ex. « P99 < 50 ms »). Phase : `specify`
- [R2] `tasks.md` — lot horizontal → non reviewable seul.
  → Scinder par étape : R2a « s'inscrire », R2b « se connecter ». Phase : `tasks`
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
rien. Le plafond de ~50 lignes du skill `chantier` tient ainsi sans exception.

**L'arbitrage.** `## Écarté` est le registre des findings qu'on assume, avec **motif et date**.

> **On n'arbitre jamais un Critical.** Un Critical rend l'implémentation non fiable ou la review
> aval fictive : il bloque, toujours. Seuls les Major et les Minor s'arbitrent. Une demande
> d'arbitrage sur un Critical se refuse en le disant.

C'est la frontière qui empêche la gate de devenir un tampon.

**Appariement entre passes.** Un finding est identifié par le triplet **`[ID]` · fichier ·
nature** (`[FR-003] spec.md adjectif-sans-cible`). À chaque passe :

1. **Dérouler les 15 contrôles intégralement.** On ne saute **jamais** un contrôle parce que la
   fiche dit « arbitré » — on détecte tout, on ne change que la *présentation*.
2. Un finding apparié à une entrée d'`## Écarté` → bloc **« Déjà arbitrés »**, hors du décompte
   qui décide du verdict.
3. Un finding de la fiche qui n'apparaît plus → bloc **« Corrigés depuis »**, et il sort de la
   fiche.
4. Le reste → rapport normal, et écrit dans la fiche.

**Cycle de vie.** Verdict `CORRIGER D'ABORD` → ouvrir ou actualiser la fiche. Verdict `PRÊT` →
ajouter `## Issue` (ce qui a été corrigé, en combien de passes) et l'archiver.

**Les arbitrages survivent à l'archivage.** À l'ouverture d'une nouvelle fiche de gate pour la même
feature, reprendre le `## Écarté` de la **dernière fiche archivée** de cette feature
(`docs/chantiers/archive/*-gate-NNN-slug.md`, la plus récente). Un arbitrage est une décision, pas
une note de passage : le re-litiger à chaque re-gate serait exactement la boucle qu'on ferme.
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
  indéfiniment. Si une passe ne produit ni correction constatée ni arbitrage neuf, dis-le : le
  blocage est ailleurs que dans le contrat.
- **Le cycle boucle après la conformité.** Un verdict `PRÊT` ouvre le passage de main. Pour une feature à fort enjeu, la passe optionnelle `premortem` durcit le contrat d'abord (puis on relance cette gate). Une fois `PRÊT` (re)confirmé, le contrat part vers le workflow d'implémentation et on repart sur la suivante par `/scd-sdd:kickoff-feature` (ou `/scd-sdd:status-specs` si plusieurs sont en vol).
</guidance>
