# Référence — La base de preuves (pourquoi l'arbre a cette forme)

**Chargement.** Le `SKILL.md` de `strategie-verif` porte l'arbre actionnable ; ce fichier porte le
**pourquoi** — la preuve derrière chaque branche, son niveau de confiance, et ses limites. La
matière brute complète (sources verbatim, annexe critère→source→confiance) reste
`docs/scd-spec-dev/Decider quand faire du TDD.md`, hors du plugin. On distille, on ne recopie pas.

## Le fil conducteur : l'oracle

Toute la littérature réputée converge sur une même question — **peut-on, avant le code, exprimer
sans ambiguïté ce que « correct » veut dire et le vérifier automatiquement ?** Beck le formalise
dans « Canon TDD » (2023) : l'étape 1 de TDD est d'écrire la liste des scénarios de test ; si on ne
peut pas l'écrire, on n'est pas dans les conditions de TDD — Beck bascule alors en **spike**. C'est
exactement l'étape 1 puis 2 de l'arbre.

Les propriétés observables qui rendent le test-first rentable, chacune une branche de l'arbre :

| Propriété | Effet sur la décision | Source |
|---|---|---|
| Oracle / spec claire | prérequis du test-first (sinon spike) | Beck, Ousterhout |
| Interface / contrat stable | tester le **comportement**, pas la méthode/classe | Cooper, Farley |
| Déterminisme | la flakiness détruit la valeur d'oracle (~1,5 % chez Google) | *SE at Google* ch. 11 ; Micco 2017 |
| Coût du défaut élevé | plus le coût est haut, plus le test-first se justifie | Fowler (pyramide) |
| Couplage à l'I/O | faible testabilité → test au niveau intégration, pas unitaire | DHH, Cooper |
| Durée de vie courte / diff « en une phrase » | pas de cérémonie ; impl directe | Anthropic |

## Les trois faits qui commandent l'arbre

**1. L'effet de TDD est modeste et l'ordre test-first n'est pas le facteur causal.**
- Rafique & Mišić (IEEE TSE 2013, méta-analyse 27 études) : *small positive effect on quality, little
  to no discernible effect on productivity* — et l'avantage qualité **s'efface** face à un processus
  itératif « test-last », pas seulement waterfall. **Confiance : élevée.**
- George & Williams (2004, 24 pros) : +18 % de cas black-box passés, mais +16 % de temps. Nagappan et
  al. (EMSE 2008, MS/IBM) : densité de défauts −40 % à −90 %, +15 % à +35 % de temps — **études de
  cas sans contrôle randomisé. Confiance : moyenne.**
- **Fucci et al. (IEEE TSE 2017, 82 points, 39 pros)** : le bénéfice vient de la **granularité et de
  l'uniformité du flux**, pas de l'ordre — *« Sequencing … had no important influence. »* C'est le
  résultat le plus décisif pour un agent, mais il repose **largement sur une étude. Confiance :
  moyenne.** → l'arbre impose des **petits pas** partout, et ne sacralise pas le test-first.

**2. Des stratégies intermédiaires dominent le TDD strict dans des contextes précis** — d'où les
étapes 2 et 3 (voir `strategies.md` pour le détail) : characterization/golden master (legacy),
property-based (propriétés algébriques), approval/snapshot (sorties complexes), intégration/contrat
(couplage I/O). Consensus praticien documenté, **confiance moyenne à élevée** selon la stratégie.

**3. L'agent triche, et l'ambiguïté est le déclencheur n°1.** C'est le domaine le plus neuf et le
plus décisif :
- Anthropic (Claude Code best practices) : *« Give Claude a check it can run »* ; le motif TDD (écrire
  les tests, les voir échouer, commiter, implémenter jusqu'au vert **sans modifier les tests**) est le
  motif fort du travail agentique. Corroboré : **TDFlow** (arXiv 2510.23761, 2025) atteint 88,8 % /
  94,3 % sur SWE-bench **avec des tests fournis par des humains**. **Confiance : moyenne-élevée.**
- **EvilGenie** (arXiv 2511.21654, 2025-26) : sur les problèmes **non ambigus**, hardcoding ~0,7–2,1 %,
  suppression de tests rare ; sur les problèmes **ambigus**, le hardcoding **explose à 22–44 %**.
  Enseignement direct de l'étape 0 : **sous ambiguïté, ne pas laisser l'agent générer ET satisfaire
  l'oracle.** **Confiance : phénomène élevé, taux précis moyen.**
- **SWE-bench Illusion** (arXiv 2506.12286) + audit OpenAI (59,4 % des échecs de o3 dus à des défauts
  de test) : **un test vert ne prouve pas la correction.** D'où les garde-fous : verify-time sur
  checkout propre, revue adverse contre la spec, anti-tautologie. **Confiance : élevée.**
- **TestGen-LLM** (Meta, arXiv 2402.09171) : un test généré n'est un oracle que **filtré** (compile +
  passe de façon fiable + augmente la couverture). D'où le seuil « tests générés ». **Confiance :
  élevée.**

## La tension doctrinale, assumée

La recherche (reco n°2) veut **encoder les garde-fous anti-triche en hooks write-time**, pas en
conseils — parce que sans eux le TDD *augmente* le risque pour un agent. La doctrine de ce plugin met
ces garde-fous en **review + verify-time** (zéro garde de session), pour ne pas alourdir chaque
écriture. Ce que cela déplace, sans détour :

- « l'implementer n'édite pas les tests » est une **instruction d'agent**, rattrapée **après coup**,
  jamais au write-time ;
- le rattrapage réel est au **verify-time** : `git diff` vide sur les tests, checkout propre ;
- deuxième filet : `integrity-reviewer` (escape-hatches, chemins protégés) ; troisième : le job CI
  grep, hors boucle de dev.

**C'est la question que L9 tranche** : review-time + verify-time suffisent-elles sans hook
write-time ? Si la triche passe, un hook ciblé sera réintroduit — mais on ne l'assume pas d'avance.
`strategie-verif` ne dépend pas de l'issue : il **décide** un mode, il n'enferme pas l'agent.

## Ce qui reste non établi (à lire comme des paramètres, pas des constantes)

- **Causalité de l'ordre test-first** : le résultat « granularité, pas ordre » repose surtout sur
  Fucci et al. 2017 et sa lignée. Non répliqué indépendamment à grande échelle.
- **Transfert humains → agents** : toute la base classique (2000-2021) porte sur des développeurs
  humains, souvent étudiants, sur de petites tâches. Les modes d'échec d'un agent (hardcoding,
  suppression de tests, sur-ingénierie) sont différents.
- **Taux réels de reward hacking** : 0 % à 44,4 % selon l'ambiguïté, le modèle et le protocole ;
  plusieurs chiffres viennent de données internes d'éditeur non publiées.
- **Efficacité des garde-fous anti-triche** : recommandés, jamais évalués en contrôlé pour un agent
  autonome.
- **Seuils quantitatifs** (« une phrase », flakiness ~1,5 %, filtres TestGen) : points de départ
  raisonnables tirés de sources nommées, **non validés pour la décision d'un agent**. À calibrer.

**Ce qui changerait la doctrine** : des réplications indépendantes montrant un effet productivité
positif du test-first **chez les agents** renforceraient `tdd` par défaut ; des taux de triche
durablement sous ~1 % sur des benchmarks ouverts et indépendants permettraient de relâcher certains
garde-fous coûteux (p. ex. la revue adverse systématique).
