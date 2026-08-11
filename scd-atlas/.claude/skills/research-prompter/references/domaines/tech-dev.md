# Pack de domaine — technologie, langage, framework, écosystème

Chargée par `research-prompter` **en plus** de `squelette.md`, et seulement quand le sujet porte sur
une technologie, un langage, un framework, une bibliothèque ou un écosystème logiciel. Elle ne
remplace rien : le squelette donne la forme, ce pack donne les **familles de sources qui font
autorité**, les **pièges du domaine** et les **angles** qui changent selon la maturité de la techno.

- [Les deux règles qui décident du reste](#les-deux-règles-qui-décident-du-reste)
- [Hiérarchie des sources par type de question](#hiérarchie-des-sources-par-type-de-question)
- [Sources primaires par écosystème](#sources-primaires-par-écosystème)
- [Pièges et parades](#pièges-et-parades)
- [Angles par calibre, modulés par la maturité](#angles-par-calibre-modulés-par-la-maturité)
- [Santé d'un projet open source](#santé-dun-projet-open-source)
- [Preuves réutilisables telles quelles](#preuves-réutilisables-telles-quelles)
- [Ce que ce pack n'établit pas](#ce-que-ce-pack-nétablit-pas)

## Les deux règles qui décident du reste

1. **Fixer la version cible dès le prompt**, dans `<context>`. Sans version nommée, la recherche
   ramène de la documentation obsolète bien référencée — le piège n° 1 du domaine, et il est mesuré
   (voir plus bas). *Seuil* : si la techno a une majeure de moins de 12 mois, doubler l'exigence de
   recoupement au changelog dans `<sources>`.
2. **Remonter à la source primaire versionnée.** Une reprise secondaire n'est retenue que si elle
   est **datée**, qu'elle **précise la version**, et qu'elle **ne contredit pas** la doc officielle.
   Les trois conditions, pas deux.

## Hiérarchie des sources par type de question

Ce tableau alimente le bloc `<sources>` : la colonne de gauche descend en « Prioriser », celle de
droite en « Traiter avec prudence ».

| Type de question | Sources faisant autorité (ordre décroissant) | À rétrograder |
|---|---|---|
| **Choix d'outil / techno** | Doc officielle + comparatif factuel de fonctionnalités ; OpenSSF *Concise Guide for Evaluating OSS* ; enquêtes d'écosystème indépendantes ; adoption réelle (deps.dev, registres de paquets) | Benchmarks d'éditeur ; listicles « top 10 » ; comparatifs sponsorisés |
| **Migration de version** | Guide de migration officiel + changelog / release notes + notes de rupture ; codemods officiels | Tutoriels de blog non datés ; réponses Q&A anciennes |
| **Bonnes pratiques** | Guides de style officiels ; doc d'architecture des mainteneurs ; références reconnues ; RFC / proposals **acceptées** | Opinions de blog isolées ; réponses fortement upvotées mais anciennes |
| **Débogage** | Issue tracker officiel + changelog du correctif ; doc de l'API concernée ; Q&A **récentes et vérifiées contre la version** | Réponses acceptées mais datées ; snippets copiés sans version |
| **Sécurité** | Bases CVE / advisories (GHSA, OSV) ; `SECURITY.md` et advisories du projet ; bulletins d'éditeur ; NVD ; ressources OpenSSF | Snippets Q&A ; réponses « ça marche » sans revue de sécurité |

⚠️ **L'existence de ces familles est un fait établi ; leur ordre de priorité est une interprétation
d'auteur de ce pack, pas un standard publié.** Un prompt peut s'en écarter en le disant.

## Sources primaires par écosystème

Deux usages : remplir `<sources>` avec des URL canoniques réelles, et **dater une fonctionnalité** —
le processus de proposal est ce qui distingue « proposé » de « livré », distinction critique pour ne
pas documenter une feature non stabilisée.

*Instantané au 2026-08-11. Les politiques de support bougent — vérifier avant de citer une date
d'EOL.*

| Écosystème | Doc & release notes | Processus de proposal | Versioning / support |
|---|---|---|---|
| **JS/TS (Node.js)** | nodejs.org/docs ; TypeScript handbook ; nodejs.org/en/about/previous-releases | **TC39** (tc39.es/process-document) — stades 0→4 | Current 6 mois → Active LTS → Maintenance ; ~30 mois de LTS, EOL au 30 avril de la 3ᵉ année (jusqu'à Node 26). **À partir de Node 27** : cadence annuelle, chaque majeure passe en LTS — *annonce officielle, mais planning futur, à revérifier* |
| **Python** | docs.python.org ; notes « What's New » | **PEP** (peps.python.org, PEP 1) ; Steering Council (PEP 13) | **PEP 602** : cadence annuelle, chaque 3.x maintenue **5 ans** — depuis 3.13, 2 ans de bugfix puis 3 ans de sécurité seule (avant : 1,5 + 3,5) |
| **Rust** | doc.rust-lang.org ; The Book ; blog.rust-lang.org | **RFC** (rust-lang.github.io/rfcs) + tracking issues | Trains de 6 semaines ; éditions (2015 / 2018 / 2021 / 2024) |
| **Go** | go.dev/doc ; go.dev/doc/devel/release ; go.dev/blog | **golang/proposal** — design docs, issue-driven | **Go 1 compatibility promise** ; support des 2 dernières majeures |
| **JVM (Java)** | docs.oracle.com ; openjdk.org ; JDK release notes ; inside.java | **JEP** (openjdk.org/jeps/1) + JCP/JSR ; états Draft→Complete | Cadence 6 mois ; LTS (17, 21, 25…) ; features souvent en « preview » avant finalisation |
| **Mobile (Kotlin / Swift)** | developer.android.com ; kotlinlang.org ; swift.org ; developer.apple.com | **KEEP** (Kotlin) ; **Swift Evolution** — phases pitch → review | Niveaux d'API Android ; versions majeures Swift |

Toutes ces sources sont **primaires**. Elles descendent dans `<sources>` en URL exactes : Research ne
construit aucune URL, et une URL devinée n'existe pas.

## Pièges et parades

| Piège | Signal de détection | Parade, dans le prompt |
|---|---|---|
| **Doc obsolète bien référencée** | Ni version ni date ; bien classée sur un moteur mais renvoie à une majeure ancienne | Exiger la vérification du sélecteur de version de la doc et la comparaison au changelog de la dernière release |
| **Réponse Q&A périmée** | Date ancienne, commentaires « ne marche plus », API dépréciée | Exiger la lecture des commentaires et le recoupement avec la doc de la version cible |
| **Ferme SEO / contenu généré en masse** | Titres « top N », prose générique, pas d'auteur nommé, pas de code testé, contenu dupliqué | Disqualifier ; exiger auteur nommé + code exécutable + version explicite |
| **Benchmark d'éditeur** | Publié par le vendeur, méthodologie absente, le concurrent perd toujours | Étiqueter « benchmark d'éditeur » et chercher un benchmark tiers reproductible |
| **Confusion entre versions** | Snippet sans version ; API de majeures différentes mélangées | Version fixée dans `<context>` ; vérification au changelog |
| **Snippet non sécurisé copié** | Code de forum repris en production sans revue | Recouper toute pratique de sécurité avec les advisories et la doc officielle |

**Cinq tests de fraîcheur d'une page**, à demander explicitement quand la recherche porte sur du
code : (1) date de publication ou de mise à jour visible ? (2) version de la techno citée ? (3) le
code correspond-il à la doc **de cette version** ? (4) auteur ou équipe identifiable ? (5) les liens
sortants sont-ils vivants — les liens morts trahissent l'âge.

## Angles par calibre, modulés par la maturité

Ce tableau alimente le bloc `<content>`, qui reste plafonné à six angles.

| Angle | Focalisé | Standard | Étendu | Modulation |
|---|---|---|---|---|
| **Concepts / modèle mental** | Rappel minimal | Oui | Approfondi + historique | Émergente : insister. Mature : condenser |
| **Patterns / bonnes pratiques** | Le pattern ciblé | 2-3 patterns clés | Panorama + anti-patterns | Mature : riche. Émergente : patterns non stabilisés, l'attendu est `[INCERTAIN]` |
| **Configuration / mise en œuvre** | Oui, précis | Oui | Oui + tuning avancé | Toujours pertinent |
| **Gotchas / pièges** | Les 1-2 majeurs | Oui | Exhaustif | Émergente : bugs et churn élevés. Mature : gotchas historiques |
| **Écosystème / intégrations** | Non | Survol | Cartographie complète | En croissance : central. En déclin : signaler les alternatives |
| **Ruptures de compatibilité** | Si migration | Oui | Historique complet | Mature : essentiel (LTS/EOL). Émergente : churn d'API attendu |

**Règle de modulation** : sur une techno **émergente**, ajouter un angle « maturité et risque
d'adoption » et retrancher l'historique exhaustif. Sur une techno **mature ou en déclin**, ajouter
« chemins de migration / EOL » et retrancher les concepts de base. *Interprétation d'auteur —
confiance moyenne.*

## Santé d'un projet open source

À joindre au `<content>` dès que la recherche sert une **décision d'adoption** d'une dépendance. Tout
y est mesurable publiquement, donc vérifiable par le rapport.

| Signal | Mesure publique | Lecture |
|---|---|---|
| **Cadence de release** | Tags et releases du dépôt | Un projet sain publie à intervalles prévisibles ; la lisibilité dépend du respect de **SemVer 2.0.0** |
| **Politique de support** | Calendrier LTS/EOL daté et publié | Son existence est un signal fort ; son absence en est un aussi |
| **Gouvernance** | Rattachement à une fondation, document de gouvernance, steering council | Réduit la dépendance à une personne |
| **Facteur de bus** | *Truck factor* calculé depuis l'historique Git | **TF ≤ 2 → risque à signaler** |
| **Réactivité issues / PR** | API GitHub ; métriques CHAOSS (*Time to First Response*, *Change Request Closure Ratio*) | Le check « Maintained » d'OpenSSF Scorecard n'évalue que les **90 derniers jours** — rétrospectif, aucune projection |
| **Politique de sécurité** | `SECURITY.md` (racine, `/docs` ou `/.github`) ; divulgation coordonnée ; badge OpenSSF Best Practices | **Absence de `SECURITY.md` → risque à signaler** |
| **Dépréciations** | Warnings, RFC de retrait, notes de migration, délais documentés | Un retrait annoncé vaut mieux qu'un retrait silencieux |

**Cadres citables, tous primaires** : **CHAOSS** (chaoss.community, Linux Foundation, 2017) —
métriques de santé communautaire indépendantes de l'implémentation ; **OpenSSF Scorecard**
(scorecard.dev, lancé en novembre 2020) — « *There are currently 18 checks made across 3 themes:
holistic security practises, source code risk assessment and build process risk assessment* »,
chaque check noté 0-10, avec « *a weekly Scorecard scan of the 1 million most critical open source
projects* » publié en dataset BigQuery ; **SLSA** (slsa.dev, build track L0→L3, provenance signée,
v1.0 en avril 2023) ; **OpenSSF *Concise Guide for Evaluating Open Source Software***.

⚠️ **Désaccord à signaler plutôt qu'à lisser** : le dépôt `ossf/scorecard` reconnaît lui-même que ses
checks « *are heuristics; there are false positives and false negatives* » et déconseille de se fier
au **score agrégé** — ce qui contredit l'usage courant du score comme note unique. Arbitrer en
faveur de l'examen **check par check**.

**Seuils qui changent la recommandation** : truck factor **≤ 2**, absence de `SECURITY.md`, ou
dernière release datant de **plus de 12 mois** → le prompt demande de signaler explicitement le
risque de maintenance ou d'abandon, et de recommander une évaluation par Scorecard.

## Preuves réutilisables telles quelles

Ces quatre résultats sont **primaires et vérifiables**. Ils descendent dans un prompt quand ils
justifient une exigence — pas comme décoration.

- **Obsolescence des Q&A** — Zhang, Wang, Chen, Zou & Hassan, *IEEE Transactions on Software
  Engineering* 47(4):850-862 (2019/2021, DOI 10.1109/TSE.2019.2906315) : « *More than half of the
  obsolete answers (58.4%) were probably already obsolete when they were first posted* » et « *only a
  small proportion (20.5%) of such answers are ever updated* ». Tags les plus touchés : node.js,
  ajax, android, objective-c. *Fait établi, source primaire.*
- **Liens morts** — même étude : **11,9 %** de 5,5 millions de liens Stack Overflow étaient morts en
  septembre 2018. *Fait établi, source primaire, daté.*
- **Code non sécurisé copié en production** — Fischer et al., « Stack Overflow Considered Harmful? »,
  *2017 IEEE Symposium on Security and Privacy* : « *15.4% of the 1.3 million Android applications we
  analyzed, contained security-related code snippets from Stack Overflow. Out of these 97.9% contain
  at least one insecure code snippet* ». *Fait établi, source primaire* — nuance à mentionner : un
  travail ultérieur (« Unhelpful Assumptions in Software Security Research ») a questionné l'absence
  de vérification manuelle documentée du pipeline snippet ↔ bytecode.
- **La source consultée change le résultat** — Acar et al., « You Get Where You're Looking For »,
  *2016 IEEE Symposium on Security and Privacy*, étude contrôlée sur 54 développeurs Android : ceux
  limités à Stack Overflow ont produit un code significativement **moins sécurisé** ; sur 139 threads
  consultés, **25 %** étaient utiles et **17 %** contenaient des extraits sécurisés. *Fait établi,
  source primaire.*

## Ce que ce pack n'établit pas

- **Truck factor — source unique.** Le « 74 % des projets à TF ≤ 2 » vient d'un **seul** article
  (Avelino, Valente & Hora, *PeerJ Preprints* 5:e1233v3, 133 projets GitHub : 46 % à TF=1, 28 % à
  TF=2). D'autres travaux (Ferreira et al., *SQJ* 2019) confirment la tendance d'une forte
  concentration de connaissance, avec des échantillons et des méthodes différents. À présenter comme
  un **ordre de grandeur**, jamais comme une constante.
- **Node 27 — planning futur.** La cadence annuelle et le passage systématique en LTS reposent sur
  une annonce officielle *à venir* : à revérifier à la date d'exécution du prompt.
- **Support Python — à recouper.** Les délais issus de PEP 602 et de sa note d'implémentation se
  recoupent avec le cycle exact de la version ciblée avant qu'une date d'EOL précise soit citée.
- **Détection des fermes SEO — interprétation d'auteur.** La littérature est majoritairement non
  académique ; les heuristiques valent ce que valent leurs signaux. *Confiance moyenne.*
- **Ordre de la hiérarchie des sources** — voir l'avertissement sous le premier tableau.
- **Aucune donnée sur Flutter / Dart.** Angle mort nommé du corpus source, non comblé ici.
