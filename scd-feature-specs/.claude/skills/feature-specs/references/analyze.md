# Référence — Gate de conformité (`analyze`)

<role>
**Gate de conformité du cycle.** Atteste que `spec.md` / `plan.md` / `tasks.md` sont **prêts pour une
implémentation optimale** par un workflow aval. Peut être suivie de la passe optionnelle `premortem`
(`references/premortem.md`), qui durcit un contrat déjà conforme par projection d'échec. **Lecture
seule + rapport** : ne modifie aucun
fichier, n'écrit aucun verdict sur disque (un PASS persisté deviendrait faux dès la prochaine
édition — la gate est bon marché, on la relance).

Ce n'est pas une revue de code : le code n'existe pas encore et n'est pas notre affaire. C'est un
**contrôle qualité du contrat** — des « unit tests for English ». Attraper un trou ici coûte
infiniment moins cher qu'après l'implémentation.
</role>

<checks>
Quatorze contrôles, groupés. Chacun est **vérifiable** : ne rapporte que ce qui est constatable dans
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
</checks>

<report>
Aucune écriture de fichier. Findings classés par ce qu'ils coûtent en aval :

- **Critical** — rend l'implémentation non fiable, ou la review aval fictive : `FR` sans impl ou sans vérification observable, `[NEEDS CLARIFICATION]` restant, plan contredisant un ADR, scope EXCLU violé, critère non testable (adjectif nu), **lot horizontal**, **lot à sujets multiples**, mode `check`/`inhérent` masquant l'absence de preuve sur de la **logique métier**.
- **Major** — fera perdre du temps : backref manquant, tâche orpheline, critère hors EARS, fuite de stack dans la spec, `FR` non atomique, **lot hors seuils de scission**, **mode de vérification ≠ `TDD` non justifié**.
- **Minor** — améliore : `[P]` douteux, patron de référence absent, formulation perfectible.

Format :
```
## Validation — specs/NNN-feature
### Critical (N)
- [FR-003] « le système doit être rapide » : adjectif sans cible → non testable.
  → Remplacer par une valeur mesurable (ex. « P99 < 50 ms »). Fichier : spec.md
- [R2] « table users + API + UI » : lot horizontal → non reviewable seul.
  → Scinder par étape du workflow : R2a « s'inscrire », R2b « se connecter ». Fichier : tasks.md
### Major (N) / ### Minor (N)
- …

Couverture : X/Y FR ont une vérification observable + une impl · Z tâches sans backref
Vérification : N lots (M non-`TDD` : modes déclarés + justifiés)
Découpage : N lots · ~X lignes estimées au total · Z lots hors seuils
Verdict : PRÊT POUR IMPLÉMENTATION | CORRIGER D'ABORD (Critical présents)
```

Chaque finding nomme le **fichier**, l'**ID** (`FR-xxx`, `Tn` ou `Rn`) concerné et l'**action** de
correction — pour un lot rejeté, l'action est un **axe de scission** nommé. Verdict `PRÊT`
uniquement si **zéro Critical**.

**Deux seconds regards, deux mandats disjoints.** Le contexte principal a souvent rédigé ces
documents : il est mal placé pour les juger. Déléguer en contexte frais (sur demande, ou si la
feature est grosse) :
- `ears-verifier` — traçabilité, conformité EARS, frontières, cohérence socle (contrôles 1-11) ;
- `slice-auditor` — reviewability du découpage (contrôles 12-14).

Ils sont indépendants : les lancer en parallèle, puis fusionner leurs findings dans un rapport
unique sans les rejuger.
</report>

<guidance>
- **Ne corrige pas.** Tu signales, tu nommes le fichier et l'action. L'humain ou la phase concernée corrige.
- **Ne rapporte pas de préférences de style.** Un relecteur à qui on demande de trouver des lacunes en trouvera toujours ; s'en tenir à ce qui affecte la testabilité, la traçabilité ou les frontières.
- **Ne juge pas le code** : il n'existe pas. Les tests sont *prévus* dans `tasks.md`, pas exécutés.
- **N'exige pas un test là où la preuve est légitimement autre.** Un lot `inhérent` (CI, infra, config, scaffolding) n'a pas de tâche test : la preuve est le critère d'acceptation de l'impl (« run → vert »). Ne le rapporte pas comme « FR sans test » — vérifie seulement que ce critère est **observable** (pas un adjectif) et que le mode est **déclaré et justifié**. Le finding, c'est un `check`/`inhérent` posé sur de la logique métier testable, pas l'usage légitime du mode.
- **Ne transforme pas une estimation en gate.** Les budgets de lots sont des ordres de grandeur documentaires (ce plugin ne lit pas le code) et les seuils viennent d'études sur le code, transposés par analogie. Ils déclenchent une question, jamais un verdict — d'où « lot hors seuils = Major ». Les bloquants du découpage sont **qualitatifs** : verticalité, sujet unique, indépendance.
- **Relançable à volonté** : après correction, rejouer la gate. C'est bon marché et toujours à jour.
- **Le cycle boucle après la conformité.** Un verdict `PRÊT` ouvre le passage de main. Pour une feature à fort enjeu, la passe optionnelle `premortem` durcit le contrat d'abord (puis on relance cette gate). Une fois `PRÊT` (re)confirmé, le contrat part vers le workflow d'implémentation et on repart sur la suivante par `/scd-feature-specs:kickoff` (ou `status` si plusieurs sont en vol).
</guidance>
