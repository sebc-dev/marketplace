# Longueur de génération et qualité des LLM

La dégradation de la qualité des sorties de LLM en fonction de la longueur de génération est un phénomène **empiriquement démontré par au moins cinq études indépendantes**, bien qu'aucune étude unique ne mesure simultanément toutes les dimensions de qualité (cohérence, originalité, précision factuelle, diversité lexicale) comme fonction continue de la longueur. Les mécanismes techniques sous-jacents — attention dilution, softmax bottleneck, repetition self-reinforcement — sont rigoureusement prouvés pour certains, théorisés pour d'autres. Les investigations complémentaires sur les 7 gaps identifiés initialement montrent que **six ont été partiellement comblés par 49 nouvelles études** publiées entre janvier 2024 et février 2026 — seul le cadre d'évaluation multi-dimensionnel positionnel reste fondamentalement ouvert. L'avancée la plus significative : au moins cinq études contrôlées comparent désormais la génération single-shot aux approches itératives, avec une **convergence unanime en faveur de l'itératif**.

---

## Section 1 — Données empiriques : longueur vs qualité

### Études mesurant directement la dégradation

La littérature offre plusieurs démonstrations empiriques de dégradation, chacune mesurant un aspect distinct de la qualité. Aucune étude isolée ne couvre l'ensemble du spectre, mais leur convergence est significative.

**MAUVE (Pillutla et al., NeurIPS 2021, Outstanding Paper Award).** Cette métrique mesure l'écart distributionnel entre texte humain et texte généré via des frontières de divergence KL dans l'espace d'embedding GPT-2. La Figure 4 de l'article montre explicitement que **les scores MAUVE diminuent à mesure que la longueur de génération augmente**, de manière consistante à travers les tailles de modèle. C'est l'une des démonstrations les plus directes. Métrique : MAUVE score (0-1). Les autres métriques testées (Fréchet distance, generation perplexity) échouent à capturer ce pattern — la Fréchet distance montre _incorrectement_ une amélioration avec la longueur. [Confiance : **Haute** — étude peer-reviewed, résultat répliqué]

- _Citation :_ Pillutla, K., Swayamdipta, S., Zellers, R., et al. (2021). "MAUVE: Measuring the Gap Between Neural Text and Human Text using Divergence Frontiers." NeurIPS 2021. URL : https://proceedings.neurips.cc/paper/2021/file/260c2432a0eecc28ce03c10dadc078a4-Paper.pdf — Étendu dans JMLR 2023, vol. 24(356).

**LongGenBench (Wu et al., ICLR 2025).** Premier benchmark spécifiquement conçu pour évaluer la génération long-form (pas simplement le traitement d'input long). Évalue 10 LLM state-of-the-art sur des tâches de 16K et 32K tokens (diary writing, menu design, urban planning). Résultat central : **tous les modèles voient leur performance se dégrader significativement lorsque la longueur de sortie passe de 16K à 32K tokens**, avec des baisses allant de **1.2% à 47.1%** selon le modèle. Les modèles performants sur les benchmarks de retrieval (RULER) ne prédisent pas la capacité de génération longue. Métriques : Completion Rate, STIC-1 (instruction execution correctness), STIC-2 (overall quality). [Confiance : **Haute** — paper ICLR 2025]

- _Citation :_ Wu, Y., et al. (2025). "LongGenBench: Benchmarking Long-Form Generation in Long Context LLMs." ICLR 2025. URL : https://arxiv.org/abs/2409.02076

**WritingBench (Alibaba, NeurIPS 2025 Datasets Track).** Benchmark de 1,239 writing queries couvrant 6 domaines et 100 sous-domaines. L'ablation sur la longueur de sortie (Section 4.5) montre que **la plupart des modèles se dégradent au-delà de ~3,000 output tokens**, seuls les modèles spécialisés comme LongWriter maintenant la qualité au-delà. Le domaine Literature & Art obtient les scores les plus bas de manière consistante — indiquant que l'écriture créative est le premier domaine affecté. [Confiance : **Haute** — peer-reviewed]

- _Citation :_ WritingBench, arXiv:2503.05244v1, NeurIPS 2025. URL : https://arxiv.org/html/2503.05244v1

**Chroma "Context Rot" Study (Hong, Troynikov, Huber, juillet 2025).** Étude systématique sur 18 LLM (GPT-4.1, Claude Opus 4, Gemini 2.5 Pro/Flash, Qwen3, etc.) avec 4 expériences contrôlées. Résultat marquant sur la tâche Repeated Words (où input et output scalent ensemble) : **les modèles commencent à refuser, tronquer ou générer du texte aléatoire autour de 2,500–5,000 mots**. Gemini 2.5 Pro produit des sorties incohérentes dès 500-750 mots. La performance se dégrade _pour tous les modèles_ avec la longueur croissante, même sur des tâches triviales. Résultat contre-intuitif : les modèles performent _moins bien_ sur des haystacks cohérents et structurés que sur des phrases mélangées aléatoirement. [Confiance : **Moyenne-Haute** — étude reproductible avec code publié, mais auteurs affiliés à Chroma (entreprise de RAG)]

- _Citation :_ Hong, K., Troynikov, A., Huber, J. (2025). "Context Rot." URL : https://research.trychroma.com/context-rot

**Vectara Hallucination Leaderboard (2024–2025).** Sur un corpus de 7,700+ articles (droit, médecine, finance, éducation, technologie), les auteurs documentent dans leur Figure 11 : **le taux d'hallucination augmente avec la longueur de l'article**, avec une tendance générale confirmée. Les articles de haute complexité montrent des taux consistamment plus élevés. Métrique : HHEM (Hallucination Evaluation Model) score. [Confiance : **Moyenne** — benchmark industriel, non peer-reviewed]

- _Citation :_ Vectara (2024). "Introducing the Next Generation of Vectara's Hallucination Leaderboard." URL : https://www.vectara.com/blog/introducing-the-next-generation-of-vectaras-hallucination-leaderboard

**HelloBench (Que et al., ICLR 2025).** Évalue ~30 LLM sur la génération longue selon la taxonomie de Bloom. Documente que les LLM de pointe (GPT-4o, Claude 3.5 Sonnet) peinent au-delà de **4,000 mots** en single-shot ; les modèles open-source à capacité longue (LongWriter-GLM4-9B, Suri) présentent des répétitions sévères. **Corrélation négative** entre compréhension de contexte long et génération longue. [Confiance : **Haute** — ICLR 2025]

- _Citation :_ Que, H., et al. (2024). "HelloBench: Evaluating Long Text Generation Capabilities of Large Language Models." ICLR 2025. URL : https://arxiv.org/abs/2409.16191

### Études complémentaires

**FActScore (Min et al., EMNLP 2023)** décompose les générations en faits atomiques et mesure le pourcentage vérifiable. ChatGPT n'atteint que **58.3% de précision factuelle**, InstructGPT 42.5%. La Figure 2 du paper montre la précision factuelle par position relative dans la génération, avec des variations significatives. [Confiance : **Haute** — EMNLP 2023, 400+ citations]

- _Citation :_ Min, S., et al. (2023). "FActScore: Fine-grained Atomic Evaluation of Factual Precision in Long Form Text Generation." EMNLP 2023. URL : https://arxiv.org/abs/2305.14251

**Deshpande et al. (2025)** proposent PATTR (Penalty-Adjusted Type-Token Ratio) pour résoudre le confounding bien connu : la diversité lexicale apparente diminue mécaniquement avec la longueur du texte (loi de Herdan-Heap). Tests sur 7 modèles (LLaMA, OLMo, Phi), corpus de 20M+ mots. Sans correction de longueur, les métriques de diversité produisent des résultats fallacieux. [Confiance : **Haute** — méthodologiquement solide]

- _Citation :_ Deshpande, V., et al. (2025). "A Penalty Goes a Long Way: Measuring Lexical Diversity in Synthetic Texts Under Prompt-Influenced Length Variations." arXiv:2507.15092.

**Étude multilingue sur l'hallucination (2025)** apporte une nuance importante : les tokens hallucinés absolus augmentent avec la longueur de sortie, mais **le taux d'hallucination normalisé par la longueur ne montre pas de corrélation**. Cela suggère que la dégradation observée est partiellement un artefact de la longueur accrue plutôt qu'un phénomène de dégradation progressive intrinsèque. [Confiance : **Moyenne** — résultat intéressant mais nécessite réplication]

- _Citation :_ arXiv:2502.12769 (2025). "How Much Do LLMs Hallucinate across Languages?"

**LLMs Get Lost In Multi-Turn Conversation (Laban et al., Microsoft, mai 2025).** Analyse de **200,000+ conversations** sur 15 LLM : **39% de chute de performance** en multi-tour vs mono-tour. La dégradation est décomposée : l'aptitude ne baisse que de ~16%, mais la **fiabilité chute de 112%**. Le raisonnement test-time (o3, DeepSeek-R1) **ne compense pas** cette dégradation. [Confiance : **Moyenne-Haute** — preprint avec code et protocole robuste]

- _Citation :_ Laban, P., et al. (2025). "LLMs Get Lost In Multi-Turn Conversation." arXiv:2505.06120.

### Tableau de synthèse

|Étude|Dégradation longueur directe?|Résultat clé|Métriques|Confiance|
|---|---|---|---|---|
|MAUVE (Pillutla, NeurIPS 2021)|**Oui**|Score diminue avec la longueur, toutes tailles de modèle|MAUVE, PPL, Fréchet|Haute|
|LongGenBench (Wu, ICLR 2025)|**Oui**|1.2%–47.1% dégradation 16K→32K|STIC-1, STIC-2, Completion Rate|Haute|
|WritingBench (Alibaba, NeurIPS 2025)|**Oui**|Dégradation au-delà de ~3,000 tokens|Score 10 points, 5 critères/query|Haute|
|Chroma Context Rot (2025)|**Oui**|Tous modèles dégradent; refus/incohérence à 2.5K-5K mots|Accuracy, LLM-as-judge|Moyenne-Haute|
|HelloBench (Que, ICLR 2025)|**Oui**|LLM peinent > 4,000 mots; corrélation négative compréhension/génération|Bloom taxonomy, checklists|Haute|
|Vectara (2024)|**Oui**|Taux d'hallucination ↑ avec longueur article|HHEM score|Moyenne|
|FActScore (Min, EMNLP 2023)|**Oui (position)**|Précision factuelle varie par position|Atomic fact precision|Haute|
|Holtzman (ICLR 2020)|**Oui (implicite)**|Dégénérescence ↑ avec longueur sous beam search|Repetition rate, distributions|Haute|
|Laban et al. (Microsoft, 2025)|**Oui (multi-tour)**|39% chute performance; fiabilité -112%|Aptitude/fiabilité décomposées|Moyenne-Haute|
|Hallucination multilingue (2025)|**Partiel**|Taux normalisé stable; absolu ↑|Token-level hallucination|Moyenne|

---

## Section 2 — Mécanismes techniques documentés

Les mécanismes expliquant la dégradation se répartissent en trois catégories de certitude. Deux sont rigoureusement prouvés par des théorèmes mathématiques ; plusieurs sont empiriquement démontrés ; quelques-uns restent débattus ou spéculatifs.

### (a) Empiriquement démontré et/ou mathématiquement prouvé

**Softmax attention dispersion.** C'est le mécanisme le plus fondamental. Veličković et al. (ICML 2025, "Softmax is not Enough") **prouvent rigoureusement** que pour tout attention head softmax, étant donné suffisamment de tokens, les coefficients d'attention _doivent_ se disperser — l'entropie des distributions d'attention scale avec la longueur de séquence. Barbero et al. (2024, arXiv:2406.04267, "Transformers Need Glasses!") prouvent que les représentations de tokens deviennent indistinguables et que les gradients sont exponentiellement dilués ("over-squashing"). Cela s'applique à **toute architecture transformer utilisant softmax standard**. Mitigations proposées : α-entmax (attention sparse produisant des zéros exacts), Scalable-Softmax (Nakanishi, 2025), ALiBi positional bias. [Confiance : **Très Haute** — preuves théoriques]

**Softmax bottleneck.** La couche de sortie des LLM utilise une matrice softmax de rang limité (W ∈ ℝ^{v×d}) avec v >> d. Le modèle _ne peut pas_ représenter toutes les distributions de probabilité possibles sur le vocabulaire. Finlayson et al. (ICLR 2024, "Closing the Curious Case of Neural Text Degeneration") prouvent mathématiquement que le truncation sampling (nucleus/top-k) fonctionne précisément parce qu'il élimine les erreurs causées par ce bottleneck. Développement de BAT sampling (Basis-Aware Threshold). [Confiance : **Très Haute** — preuve théorique]

**Repetition self-reinforcement.** Xu et al. (NeurIPS 2022, "Learning to Break the Loop") démontrent quantitativement que la corrélation dot-product dans le mécanisme d'attention crée une **boucle de rétroaction positive** : les tokens identiques reçoivent des valeurs de corrélation élevées, renforçant la répétition. Plus de répétitions → probabilité plus élevée de continuer. Des "repetition neurons" spécifiques ont été identifiés dans les transformers (Hiraoka & Inui, NAACL 2025, arXiv:2410.13497), identifiant des neurones dans les couches FFN dont les activations contribuent directement à la répétition, avec intervention causale prouvant que des circuits neuronaux spécifiques poussent le modèle vers les tokens précédemment générés. Yao et al. (ACL 2025 Findings) utilisent des Sparse Autoencoders pour identifier des "features de répétition" spécifiques dont la désactivation atténue le phénomène. Le paper fondateur de Holtzman et al. (ICLR 2020) établit que le text degeneration (répétition, banalité, incohérence) **s'aggrave avec la longueur de séquence** sous decoding par maximisation. Mahaut & Franzon (arXiv:2504.01100, 2025) révèlent que la répétition naturelle et la répétition induite par ICL proviennent de **mécanismes internes distincts** — la répétition naturelle se concentre sur les tokens à faible information comme "comportement de repli" auto-renforçant. [Confiance : **Haute**]

**Lost in the middle.** Liu et al. (TACL 2024) démontrent une courbe en U : la performance est maximale quand l'information pertinente est au début ou à la fin du contexte, minimale au milieu. L'attention sink phenomenon (Xiao et al., 2023) montre que softmax alloue disproportionnellement l'attention aux tokens initiaux. Found in the Middle (2024, arXiv:2403.04797) attribue le problème à la propriété de décroissance à long terme de RoPE. **Ce mécanisme concerne le traitement du contexte input**, mais affecte indirectement la génération output puisque le modèle doit également lire sa propre sortie comme contexte. [Confiance : **Haute** pour l'input ; **Moyenne** pour l'extrapolation à l'output]

**Mode collapse from fine-tuning.** Une étude publiée sur OpenReview (2024, "Attributing Mode Collapse in the Fine-Tuning Pipeline") attribue systématiquement la perte de diversité à chaque étape d'entraînement. **Le SFT cause la plus grande baisse de diversité** ; le DPO contribue minimalement. Les tâches créatives montrent des baisses plus importantes que les tâches factuelles. Zhang et al. (arXiv:2510.01171, octobre 2025) identifient le **biais de typicalité** dans les données de préférence comme driver fondamental du mode collapse dans les LLM alignés : la diversité est retenue dans les poids mais masquée par l'alignement. Le Verbalized Sampling récupère ~66.8% de la diversité du modèle de base après DPO. Le post "Mysteries of Mode Collapse" (janus, 2022, Alignment Forum) documente un token confidence souvent supérieur à 99% dans text-davinci-002. Nuance importante : le RLHF avec pénalité KL vers le modèle de base peut _contraindre_ la réduction d'entropie (LessWrong, 2023). [Confiance : **Haute**]

**KV-cache degradation.** La KV-cache croît linéairement avec la longueur de séquence (~1MB/token). KVFundaBench (2025, arXiv:2502.01941) montre une dégradation de 1% à 40% selon les tâches sous compression du cache. LASER-KV (2025) mesure **15-30% de dégradation** sur les tâches de long contexte avec les méthodes de compression standard. Les tokens proximaux (initiaux + récents) sont substantiellement plus importants que les tokens distants (PoD, 2024). [Confiance : **Haute**]

**Entropy collapse during RL training.** Cui et al. (2025, arXiv:2505.22617) documentent un effondrement d'entropie consistant pendant l'entraînement RL : l'entropie de politique chute fortement en début d'entraînement. Environ **20% des tokens à haute entropie ("critical decision points") gouvernent disproportionnellement les trajectoires de sortie**. L'effondrement corrèle avec la saturation de performance. EntroPIC (arXiv:2511.15248, novembre 2025) analyse ces dynamiques et propose une stabilisation d'entropie par contrôleur PID. [Confiance : **Haute**]

**Induction Head Toxicity (arXiv:2505.13514, mai 2025).** Propose que la surdominance des induction heads pendant la génération exacerbe les outputs répétitifs en supprimant les autres têtes d'attention. Explication spécifique à l'architecture transformer. [Confiance : **Moyenne** — preprint]

### (b) Théorisé / consensus expert

**Context rot / rendements décroissants du contexte long.** Anthropic reconnaît explicitement dans son engineering blog (2025, "Effective Context Engineering for AI Agents") que "context must be treated as a finite resource with diminishing marginal returns." Understanding AI (2025) rapporte le phénomène sous le terme "context rot." L'étude Chroma le confirme empiriquement, mais le mécanisme précis — au-delà de l'attention dilution — reste partiellement théorique. [Confiance : **Haute** pour le phénomène ; **Moyenne** pour le mécanisme complet]

**RLHF-induced sycophancy.** Sharma et al. (2024, Anthropic) démontrent la sycophancy à travers cinq RLHF AI assistants. Shapira et al. (2026, arXiv:2602.01002) prouvent formellement que le RLHF amplifie la sycophancy quand les réponses sycophantiques sont surreprésentées parmi les completions à haut reward. Ce mécanisme affecte la qualité des longs outputs en produisant du contenu _agréable mais incorrect_. [Confiance : **Haute**]

### (c) Avancées théoriques récentes sur la dégénérescence autoregressive

Quatre directions convergentes formalisent progressivement le phénomène autrefois désigné comme "regression to the mean in autoregressive sampling."

**Dimension de corrélation (Du & Tanaka-Ishii, NeurIPS 2025).** Introduit une mesure fractale-géométrique d'auto-similarité pour quantifier la complexité du texte perçue par un LLM. **Détecte de manière fiable plusieurs formes de dégénérescence** (répétition, incohérence, banalité) au-delà de ce que la perplexité seule capture — pont entre propriétés locales et globales. [Confiance : **Haute** — peer-reviewed NeurIPS 2025]

**Entropy-Reservoir Bregman Projection / ERBP (Chen, arXiv:2512.14879, décembre 2025).** Cadre information-géométrique formel. **Théorème 1 (Contraction d'entropie)** : sans couplage externe, le bruit d'échantillonnage fini cause une décroissance exponentielle de l'entropie dans l'espace des distributions. **Proposition 1** : l'entropie se contracte **géométriquement** (taux de décroissance exponentiel). **Théorème 2 (Plancher d'entropie)** : un "réservoir d'entropie" garantit un plancher non-trivial. Taux de décroissance en forme fermée dépendant de la taille d'échantillon. [Confiance : **Moyenne** — preprint, mais formalisme rigoureux]

**Token Maturation (arXiv:2601.04854, janvier 2026).** Cadre autorégressif continu où les tokens évoluent comme des trajectoires vectorielles dans l'espace d'embedding avant discrétisation. Les représentations se **stabilisent géométriquement** tandis que l'entropie prédictive reste élevée. La discrétisation prématurée dans les modèles AR standard cause la dégénérescence. Génère du texte cohérent sous décodage argmax **entièrement déterministe** sans pénalités de répétition. [Confiance : **Moyenne** — preprint récent, cadre théorique novateur]

**La pièce manquante** reste l'unification : aucun article ne fournit un modèle mathématique complet montrant comment P(token_t | contexte) se concentre progressivement sur les tokens génériques à mesure que t croît dans une seule passe autoregressive, avec des taux de convergence formels pour les transformers. [Confiance : **Haute** que le gap théorique persiste]

### (d) Spéculatif ou non documenté en tant que tel

**"Token-level probability flattening over long sequences."** Documenté indirectement via les résultats de softmax dispersion (Veličković et al., 2025) et le cadre ERBP, mais aucun paper ne mesure spécifiquement l'aplatissement des distributions next-token comme fonction de la position de génération pendant un seul inference pass. L'EDT (Zhang, Bao & Huang, arXiv:2403.14541, 2024) démontre empiriquement que l'entropie des distributions de tokens **fluctue tout au long de la génération**, justifiant l'ajustement dynamique de la température. [TO VERIFY pour une mesure systématique]

---

## Section 3 — Single-shot vs itératif : comparaisons directes

### Évolution du gap : de l'absence à la convergence

Le rapport initial identifiait l'absence d'étude formelle A/B comme le gap le plus significatif. **Ce gap est désormais partiellement comblé** : au moins cinq études contrôlées comparent la génération single-shot aux approches itératives, avec une convergence unanime en faveur de l'itératif.

### Études fondatrices (identifiées dans le rapport initial)

**Self-Refine (Madaan et al., NeurIPS 2023).** Framework faisant itérer un LLM unique en boucle FEEDBACK → REFINE → FEEDBACK, sans entraînement additionnel. Résultat : **~20% d'amélioration absolue en moyenne** sur 7 tâches par rapport à la génération single-shot. **La majeure partie des gains survient dans les 2 premières itérations**, avec des rendements décroissants. Même GPT-4 bénéficie significativement. Ce n'est pas exactement une comparaison paragraphe-par-paragraphe, mais c'est la démonstration la plus solide que **l'itération améliore la qualité**. [Confiance : **Haute** — NeurIPS 2023]

- _Citation :_ Madaan, A., et al. (2023). "Self-Refine: Iterative Refinement with Self-Feedback." NeurIPS 2023. URL : https://arxiv.org/abs/2303.17651

**LongWriter AgentWrite Pipeline (ICLR 2025).** Décompose les tâches d'écriture longues en sous-tâches au niveau du paragraphe : plan d'écriture avec objectifs de mots, puis génération séquentielle. Production d'outputs cohérents jusqu'à **20,000 mots**. Le LongWriter-6k 9B surpasse des modèles propriétaires plus grands. **Finding critique** : ajouter un plan d'écriture explicite au prompt améliore la longueur mais **diminue la qualité**. [Confiance : **Haute** — ICLR 2025]

- _Citation :_ Bai, Y., et al. (2024). "LongWriter: Unleashing 10,000+ Word Generation from Long Context LLMs." ICLR 2025. URL : https://arxiv.org/abs/2408.07055

**ERGO — Entropy-Guided Resetting (NeurIPS 2025 Workshop).** Utilise l'entropie de Shannon sur les distributions next-token pour détecter le désalignement pendant la génération. Résultat : **56.6% d'amélioration moyenne** sur les baselines multi-turn, **24.7% d'augmentation de performance peak**, **35.3% de réduction de la variabilité**. Insight crucial : les fluctuations d'entropie ne sont **pas un proxy de la longueur** (Spearman ρ = −0.014, p=0.45) — elles capturent une confusion réelle du modèle. [Confiance : **Haute** pour les résultats quantitatifs ; **Moyenne** pour la généralisation à l'écriture créative]

- _Citation :_ arXiv:2510.14077 (2025). "ERGO: Entropy-guided Resetting for Generation Optimization."

### Nouvelles études contrôlées (2024–2026)

**CogWriter (Wan et al., ACL 2025 Findings).** Framework multi-agent inspiré de la théorie cognitive de l'écriture, avec agents de planification, génération, monitoring et révision. Comparé directement aux baselines single-shot (LongWriter, GPT-4o, GPT-4o-mini) et à Self-Refine sur LongGenBench-16K. CogWriter avec Qwen-2.5-14B surpasse GPT-4o single-shot de **22% en précision de suivi d'instructions**. L'ablation décompose les bénéfices séparés de la planification, du monitoring et de la révision. [Confiance : **Haute** — peer-reviewed ACL]

- _Citation :_ Wan, C., et al. (2025). "CogWriter." ACL 2025 Findings, pp. 9832–9844. URL : https://arxiv.org/abs/2502.12568

**LongEval (Wu et al., février 2025).** Benchmark de 166 échantillons humains (arXiv, blogs, Wikipedia) comparant explicitement génération directe vs plan-based. **Les LLM performent mieux sous le paradigme plan-based** : meilleure adhérence au contenu, redondances réduites, dégradation plus gracieuse avec la longueur. [Confiance : **Moyenne-Haute** — preprint avec code]

- _Citation :_ Wu, Y., et al. (2025). "LongEval." arXiv:2502.19103. Code : GitHub Wusiwei0410/LongEval.

**Writing Path (Lee et al., NAACL 2025 Industry Track).** Framework outline-guided comparé à la génération directe sur GPT-3.5-turbo, GPT-4 et HyperCLOVA X dans 5 domaines. **Gains significatifs sur tous les modèles** avec la génération guidée par outline. Utilise CheckEval (checklists personnalisées) avec évaluation LLM-juge et humaine. [Confiance : **Haute** — peer-reviewed NAACL]

- _Citation :_ Lee, S., et al. (2025). "Writing Path." NAACL 2025 Industry Track, pp. 233–250. URL : https://arxiv.org/abs/2404.13919

**DOME (Wang et al., NAACL 2025).** Outline hiérarchique dynamique fusionnant planification et écriture pour la génération de récits longs. Améliore la cohérence de **6.87%** vs méthodes état-de-l'art ; le module Memory-Enhancement réduit les conflits contextuels de **87.61%**. [Confiance : **Haute** — peer-reviewed NAACL]

- _Citation :_ Wang, X., et al. (2025). "DOME." NAACL 2025, pp. 1352–1391. URL : https://arxiv.org/abs/2412.13575

**SuperWriter (Wu et al., juin 2025).** Pipeline plan → draft → refine avec DPO hiérarchique via MCTS. L'ablation sur WritingBench quantifie le gain incrémental de chaque étape : base Qwen2.5-7B à **7.43 → outputs finaux : 8.21 → SFT three-stage : 8.47 → + DPO hiérarchique : 8.51**. Le SuperWriter-LM 7B surpasse des modèles propriétaires plus grands. [Confiance : **Moyenne** — preprint avec code]

- _Citation :_ Wu, Y., et al. (2025). "SuperWriter." arXiv:2506.04180.

**Ex3 (Huang et al., ACL 2024).** Pipeline en trois étapes (Extract–Excelsior–Expand) pour la génération de romans. L'expansion arborescente depth-first produit des romans plus cohérents que les approches plan-then-write simples. [Confiance : **Haute** — peer-reviewed ACL]

- _Citation :_ Huang, L., et al. (2024). "Ex3." ACL 2024, pp. 9125–9146.

**Agents' Room (Huot et al., ICLR 2025).** Système multi-agent pour la génération narrative avec agents spécialisés (intrigue, personnages, cadre, style). La collaboration multi-étapes produit des récits plus cohérents que l'approche single-agent. [Confiance : **Haute** — peer-reviewed ICLR]

- _Citation :_ Huot, F., et al. (2025). "Agents' Room." ICLR 2025. URL : https://arxiv.org/abs/2410.02603

### Évidence praticienne

**Expérience de Tom Johnson (idratherbewriting.com, juin 2025).** Prompt donné à Gemini pour améliorer itérativement un blog post à travers 10 itérations. **La qualité atteint son pic aux itérations 2-3, puis se dégrade.** Ce résultat s'aligne avec Self-Refine (gains concentrés sur les premières itérations) et suggère un sweet spot de **2-3 passes de révision**. [Confiance : **Moyenne** — expérience anecdotique documentée]

- _Citation :_ Johnson, T. (2025). "The allure of iterative improvement loops." URL : https://idratherbewriting.com/blog/allure-of-the-loop

**Kia Ghods et al.** apportent un contrepoint : quand les LLM reçoivent suffisamment de contexte d'écriture, "LLMs given the extra context of ShortStories no longer homogenize stylistically." Cela suggère que **fournir plus de contexte peut atténuer l'homogénéisation** — un argument indirect en faveur des approches itératives qui maintiennent un contexte riche.

- _Citation :_ Ghods, K., et al. "Evidence Against LLM Homogenization in Creative Writing." URL : https://kiaghods.com/assets/pdfs/LLMHomogenization.pdf

### Synthèse sur le gap single-shot vs itératif

La convergence est frappante : **toutes les études trouvées (8/8) confirment la supériorité des approches itératives/structurées** sur le single-shot pour la génération longue. Le gain se décompose en bénéfices séparés de la planification (+0.78 WritingBench), du raffinement SFT (+1.04), du DPO hiérarchique (+1.08 cumulé). Le gap reste partiellement ouvert car aucune étude unique ne compare systématiquement le spectre complet des approches (single-shot, Self-Refine, AgentWrite, outline-based, chunk-with-reset) sous des conditions identiques avec un benchmark standardisé. Les métriques restent inconsistantes entre études.

---

## Section 3b — Le problème de l'angle et la convergence vers le générique

### Le mécanisme fondamental

Le problème de l'angle — la tendance d'un LLM à produire le contenu le plus statistiquement probable plutôt qu'un contenu distinctif — découle de la superposition de trois mécanismes documentés dans ce rapport.

**Étape 1 : Le prompt unique sous-contraint l'espace des complétions.** Un prompt comme "écris un article sur le télétravail" définit un espace de complétions possibles extrêmement vaste. Le modèle doit sélectionner parmi cet espace, et par construction du sampling autorégressif, il favorise les continuations à haute probabilité — c'est-à-dire les plus fréquemment représentées dans les données d'entraînement. Le softmax bottleneck (Finlayson et al., ICLR 2024) garantit que cette sélection est structurellement biaisée vers un sous-ensemble limité de distributions. Le résultat est l'angle le plus "moyen" : l'introduction la plus typique, les arguments les plus courants, la structure la plus standard.

**Étape 2 : L'alignement amplifie la convergence.** Le mode collapse from fine-tuning (OpenReview, 2024) montre que le SFT cause la plus grande baisse de diversité. Le biais de typicalité identifié par Zhang et al. (2025) révèle que les données de préférence RLHF surreprésentent les réponses "typiquement bonnes" — agréables, structurées, complètes — au détriment des réponses originales ou surprenantes. La diversité existe encore dans les poids du modèle mais est masquée par l'alignement. L'étude de Moon et al. (2024) le confirme quantitativement : chaque essai GPT additionnel contribue _moins de nouvelles idées_ qu'un essai humain, et l'écart de diversité s'élargit avec le nombre d'essais.

**Étape 3 : Le prompt unique ne peut pas compenser.** Le résultat le plus critique vient d'Anderson, Shah & Kreminski (C&C 2024) : **les différentes stratégies de prompting ne réduisent pas de manière fiable l'homogénéisation**. Modifier le prompt — même de manière sophistiquée — ne suffit pas à forcer un angle distinctif car le mécanisme de convergence opère au niveau du sampling et de l'alignement, pas au niveau de l'instruction.

### Comment l'itératif force la spécificité

L'approche itérative atténue ce problème par trois voies complémentaires.

Premièrement, **chaque prompt additionnel réduit l'espace de complétions possibles**. Si le premier prompt demande "écris un article sur le télétravail", le deuxième peut spécifier "concentre-toi sur l'impact du télétravail sur les relations hiérarchiques dans les PME françaises du secteur agroalimentaire." Cette progressive narrowing force le modèle vers des complétions moins statistiquement probables — et donc moins génériques.

Deuxièmement, **l'auteur injecte ses propres contraintes et son expertise à chaque étape**. En examinant le premier draft et en guidant les itérations suivantes, l'humain apporte un "prior" que le modèle ne possède pas : connaissance du public cible, préférences stylistiques, angle éditorial spécifique. Les données de Kia Ghods et al. confirment que fournir du contexte d'écriture riche atténue l'homogénéisation stylistique.

Troisièmement, **le resetting de contexte rompt les boucles de rétroaction**. Le repetition self-reinforcement (Xu et al., NeurIPS 2022) crée des boucles de rétroaction positive où la génération passée influence la génération future vers plus de similarité. En segmentant la génération et en contrôlant le contexte fourni à chaque segment, l'approche itérative empêche ces boucles de s'établir. Les données d'ERGO (NeurIPS 2025 Workshop) montrent que le resetting basé sur l'entropie produit **56.6% d'amélioration moyenne**, précisément parce qu'il interrompt la dérive.

### Patterns stylistiques spécifiques de la convergence générique

La littérature identifie des marqueurs concrets de cette convergence : fréquence plus élevée de phrases dans la plage 10-30 tokens (vs humains plus variés), "register leveling" (effacement des distinctions de genre), sur-utilisation de mots-style ("delve," "multifaceted"), exposition redondante, métaphores forcées, descriptions florales, "telling instead of showing," clichés, évitement des contractions. Kobak et al. (Science Advances, 2024) montrent qu'au moins **13.5% des abstracts biomédicaux de 2024** ont été traités par LLM, avec un vocabulaire excessif servant de marqueur.

---

## Section 4 — Recommandations workflow des praticiens

### Tableau des recommandations documentées

|Praticien|Workflow recommandé|Justification donnée|Type d'évidence|
|---|---|---|---|
|**Tom Johnson** (Google, idratherbewriting.com)|Décomposition section par section ; d'abord outline, puis expansion individuelle de chaque section ; séparer suggestion d'améliorations et réécriture en deux étapes|Prévient condensation/omission ; permet correction précoce ; les premières itérations calibrent les suivantes|Expérience documentée + expérimentation (10 itérations Gemini)|
|**Aaron Held** (aaronheld.com)|Workflow itératif 4 fenêtres avec Claude Code ; fichier de workflow reproductible dans `.claude/workflows/` ; éditions ciblées plutôt que réécriture de sections entières|"Let the collaboration evolve" ; éditions ciblées > réécriture massive|Workflow personnel documenté|
|**Ethan Mollick** (Wharton, One Useful Thing)|Approche conversationnelle ; "80% of making good prompts is having a conversation" ; demander 50 idées au lieu de 10, puis explorer via branching|Conversation itérative plutôt que prompt unique complexe ; les modèles récents nécessitent moins de prompt engineering sophistiqué|Expérience + recherche Wharton Generative AI Lab|
|**Simon Willison** (simonwillison.net)|Résumés de longues instances pour créer des contextes frais ; "don't publish slop" ; contexte comme ressource finie|Context rot observé ; qualité dégradée "around 100k tokens" avec Gemini 2.5|Observation d'expert, pas de protocole formel pour la prose|
|**Maggie Appleton** (GitHub Next)|Prototype "Lodestone" : le modèle guide l'humain à travers un processus structuré plutôt que d'écrire à sa place|"Get us to think more, not less" — le modèle comme guide de pensée critique|Design research|
|**Paul Graham** (paulgraham.com)|Pas de workflow AI spécifique ; position philosophique : "writing is thinking"|L'externalisation de l'écriture = externalisation de la pensée|Opinion/position philosophique|

### Convergences notables

Trois patterns émergent. Premièrement, **tous les praticiens identifiés qui émettent une recommandation explicite favorisent une forme d'itération** — aucun ne recommande le single-shot pour du contenu long et de qualité. Deuxièmement, la justification varie : Johnson invoque la prévention d'erreurs cumulatives, Mollick l'exploration via branching, Willison la gestion du context rot. Troisièmement, la méthode exacte diffère significativement : décomposition structurée (Johnson), conversation ouverte (Mollick), workflow reproductible automatisé (Held).

Il faut noter que **la base d'évidence de ces recommandations reste principalement anecdotique**. Aucun de ces praticiens ne cite d'étude contrôlée comparant les approches. Leur autorité repose sur l'expérience accumulée et l'observation systématique, pas sur la mesure formelle.

---

## Section 5 — Sweet spot et paramètres optimaux

### Convergence sur un seuil de dégradation autour de 2,000-3,000 tokens

Bien qu'aucune étude ne détermine un sweet spot optimal unique, plusieurs sources convergent vers un seuil approximatif.

**WritingBench** (NeurIPS 2025) montre une dégradation au-delà de **~3,000 output tokens** pour la majorité des modèles. **LongWriter** (ICLR 2025) identifie le plafond effectif de génération des LLM actuels à **~2,000 mots** sans entraînement spécialisé. L'étude **Chroma** montre des ruptures (refus, troncation, texte aléatoire) entre **2,500 et 5,000 mots**. **HelloBench** (ICLR 2025) documente que les LLM de pointe peinent au-delà de **4,000 mots** en single-shot. Ce n'est pas une coïncidence : le bottleneck SFT identifié par LongWriter explique pourquoi les modèles standard "plafonnent" autour de ce seuil.

**Le seuil d'itération optimal semble se situer à 2-3 passes.** Self-Refine (NeurIPS 2023) montre que la majeure partie des gains survient dans les 2 premières itérations. L'expérience de Tom Johnson avec 10 itérations de Gemini confirme un pic à l'itération 2-3 suivi de dégradation. Cela suggère un pattern en U inversé : trop peu d'itérations (single-shot) sous-optimise, trop d'itérations provoque une dégradation par sur-raffinement.

### Avancées sur la détection du point de dégradation

Le concept de "sweet spot" de longueur est désormais formalisé pour le raisonnement via le **Reasoning Completion Point (RCP)** et le diagnostic d'overthinking (survey TMLR 2025, Sui et al.).

**Word Salad Chopper (EMNLP 2025)** démontre qu'un **classificateur linéaire simple sur les hidden states** détecte le point de bascule, avec **55%+ du budget de tokens gaspillé** en raisonnement redondant dans les modèles de raisonnement. La génération prolongée peut **activement dégrader** les réponses, pas seulement gaspiller des ressources.

**Stop Spinning Wheels (arXiv:2508.17627, août 2025)** définit formellement le RCP et atteint **30%+ de réduction de tokens** sans perte de précision sur AIME24, AIME25, GPQA-Diamond via seuillage heuristique léger.

**CodeFast/GenGuard (Guo et al., ISSTA 2024)** propose un classificateur gating sur les hidden states pour le code avec **précision et rappel > 0.95**, accélération de **34% à 452%** sans perte de Pass@1.

**OptimalThinkingBench (Muennighoff et al., arXiv:2508.13141, août 2025)** fournit des métriques unifiées évaluant à la fois le sur-pensé et le sous-pensé, montrant que **la pensée prolongée peut dégrader la performance** sur les requêtes simples.

**Sun et al. (arXiv:2504.14350, avril 2025)** testent 30 LLM sous budgets variés : le choix optimal de taille de modèle et de style de prompt **change selon le budget de tokens** — un petit modèle avec CoT peut surpasser un grand modèle sous budget serré.

**Limite importante** : la quasi-totalité de ces travaux ciblent le raisonnement mathématique ou le code. **La génération libre en prose reste sous-représentée.** La transposition de ces détecteurs à l'écriture longue constitue un axe de recherche prioritaire.

### Paramètres de sampling et longueur

L'étude "Beware of Words" (ACM TIST) sur la diversité lexicale fournit des données quantifiées : la diversité lexicale augmente légèrement avec la température, le frequency penalty et le presence penalty ; le top-p n'a pas d'effet sauf pour des valeurs proches de 1.0. Le paper LZ Penalty (arXiv:2504.20131, 2025) démontre que ni le repetition penalty standard ni le frequency penalty ne sont des solutions fiables pour la génération longue. Le DRY penalty (Don't Repeat Yourself) est recommandé par la communauté r/LocalLLaMA mais sans validation formelle.

### ERGO : vers un sweet spot dynamique plutôt que statique

Les seuils d'entropie calibrés par ERGO suggèrent que le sweet spot n'est pas un nombre fixe de tokens mais un **signal dynamique** dépendant du modèle et de la tâche. Pour Llama 3.1-8B, le seuil optimal est τ = 0.03 ; pour GPT-4o, c'est τ = 0.3. Les modèles plus capables nécessitent **moins de resets** (~38-51 shards/reset pour les modèles GPT vs ~5-7 pour les modèles plus petits). L'approche la plus prometteuse n'est pas "générer N tokens puis couper" mais "monitorer l'entropie et restructurer quand le signal l'indique."

---

## Section 5b — L'homogénéisation stylistique : inter-output ET intra-output

### Homogénéisation inter-outputs (entre utilisateurs/documents)

**Anderson, Shah & Kreminski (C&C 2024)** : étude à 36 participants sur les Torrance Tests of Creative Thinking. Les utilisateurs de ChatGPT produisent **un ensemble d'idées plus homogène au niveau du groupe** (similarité cosinus Sentence-BERT), bien que la diversité _individuelle_ ne soit pas réduite. Résultat critique : **les différentes stratégies de prompting ne réduisent pas de manière fiable l'homogénéisation**. [Confiance : **Haute**]

**Moon et al. (2024, ScienceDirect 2025)** : 2,200 essays d'admission, metric "diversity growth rate." Chaque essai humain additionnel contribue _plus de nouvelles idées_ qu'un essai GPT. **L'écart de diversité s'élargit avec le nombre d'essais**. Les modifications de paramètres ou de prompts ne mitigent pas ce gap. [Confiance : **Haute** — étude pré-enregistrée]

**Kobak et al. (Science Advances, 2024)** : au moins **13.5% des abstracts biomédicaux de 2024** traités par LLM, 40% pour certains sous-corpus. Le vocabulaire excessif ("delve," etc.) sert de marqueur. [Confiance : **Haute**]

### Homogénéisation intra-output (au sein d'un texte long unique) — NOUVEAU

Ce phénomène, initialement identifié comme gap de recherche, est désormais quantifié par deux avancées majeures.

**The Hyperfitting Phenomenon (Carlsson, Liu, Ward, Kurfali & Nivre, ICLR 2025).** Résultat le plus rigoureux : **mesure du TTR (Type-Token Ratio) des 96 derniers tokens en fonction de la position dans la séquence générée** (Figure 9). Constatation clé : "although all models show some decrease in TTR as the sequence length increases, the hyperfitted Llama 3.1 both starts at a higher value and decreases at a slower rate." Documente quantitativement que **la diversité lexicale décline progressivement au sein d'une même génération** sur TinyLlama, DeepSeek 7B, Llama 3.1 8B et 70B. L'hyperfitting — un fine-tuning ciblé qui "aiguise" les distributions de probabilité — est proposé comme remède, produisant un TTR plus élevé avec une dégradation plus lente. [Confiance : **Haute** — peer-reviewed ICLR 2025, mesure quantitative directe]

- _Citation :_ Carlsson, F., Liu, Y., Ward, R., Kurfali, M. & Nivre, J. (2025). "The Hyperfitting Phenomenon." ICLR 2025. URL : https://arxiv.org/abs/2412.04318

**EQ-Bench Longform Creative Writing Benchmark (Paech, 2025).** Évalue des novellas en 8 chapitres (~1,000 mots chacun) avec **scores de qualité par chapitre**, sparklines visuelles de dégradation, et un **"Degradation Score" explicite** mesurant la chute entre chapitre initial et final. Détecte un pattern de dégradation structurelle spécifique : les modèles dégénèrent en paragraphes à phrase unique à mesure que l'output s'allonge. Métriques additionnelles : Slop Score (phrases LLM surutilisées), répétition n-gram, rubrique 14 dimensions par chapitre. [Confiance : **Moyenne-Haute** — benchmark open-source avec code, évaluation LLM-as-judge]

- _Citation :_ Paech, S. (2025). "EQ-Bench Longform." URL : https://eqbench.com/creative_writing_longform.html

**Benchmarking Linguistic Diversity of Large Language Models (Guo et al., TACL 2024).** Framework complet mesurant la diversité linguistique selon trois dimensions : lexicale (TTR, Distinct-N, Self-BLEU), syntaxique (POS n-gram patterns), sémantique (sentence embeddings). Trouve que SFT et RLHF réduisent la diversité, et l'entraînement sur données synthétiques aggrave le déclin. Fournit le toolkit applicable à l'analyse intra-output, bien que les mesures publiées portent sur l'inter-output. [Confiance : **Haute** — peer-reviewed TACL]

- _Citation :_ Guo, Y., Shang, L., Vazirgiannis, M. & Clavel, C. (2024). TACL. URL : https://arxiv.org/abs/2412.10271

**Measuring Information Distortion in Hierarchical Ultra-long Novel Generation (Mikhaylovskiy, mai 2025).** Modélise la génération longue comme un problème de rate-distortion, établissant des relations quantitatives entre ratios de compression des outlines et la distorsion dans les romans générés (millions de mots). [Confiance : **Moyenne** — preprint]

### Gap résiduel

Le gap reste partiellement ouvert car aucune étude ne combine systématiquement TTR, diversité syntaxique, richesse vocabulaire et nouveauté sémantique à intervalles réguliers dans une même génération longue. Les outils nécessaires existent individuellement — FActScore pour la factualité, MATTR (Shaib et al., arXiv:2403.00553) pour la diversité lexicale positionnelle, G-Eval pour la cohérence, STIC de LongGenBench pour le suivi d'instructions — mais aucune étude ne les a encore combinés en une analyse segment-par-segment. Ce gap a été **explicitement identifié comme lacune par Wu et al. (2025, "Shifting Long-Context LLMs Research from Input to Output")** — la communauté reconnaît formellement cette lacune.

---

## Section 6 — Impact du Chain-of-Thought / extended thinking sur l'écriture longue

### La tripartition qui résout la contradiction

L'image qui émerge est remarquablement cohérente une fois décomposée en trois modalités distinctes.

**Modalité 1 : CoT en prompt — essentiellement nul pour l'écriture.**

**To CoT or not to CoT? (Sprague et al., ICLR 2025).** Méta-analyse de 100+ articles + expériences sur 20 datasets et 14 modèles. Le CoT apporte des bénéfices forts **uniquement en math/logique/symbolique** (+14.2% symbolique, +12.3% math, +6.9% logique) mais **seulement +0.7% en moyenne sur toutes les autres tâches**. Sur MMLU, 95% des gains CoT proviennent des questions contenant des signes "=". [Confiance : **Haute** — peer-reviewed ICLR 2025]

- _Citation :_ Sprague, Z., et al. (2025). "To CoT or not to CoT?" ICLR 2025. URL : https://arxiv.org/abs/2409.12183

**The Decreasing Value of Chain of Thought in Prompting (Meincke, Mollick, Mollick & Shapiro, Wharton, SSRN, juin 2025).** Pour les modèles non-raisonnement, le CoT améliore marginalement la performance moyenne mais **augmente la variabilité**. Pour les modèles raisonnement, le CoT n'ajoute que des bénéfices marginaux malgré **20–80% d'augmentation du coût d'inférence**. [Confiance : **Moyenne**]

**Modalité 2 : CoT/plan dans l'output — nuisible.**

**LongWriter (ICLR 2025)** confirme que l'inclusion d'un plan d'écriture visible dans l'output **diminue la qualité**. **LitBench (Stanford, juillet 2025)** montre que l'ajout de CoT distillé aux Generative Reward Models **diminue la précision** de 78% à 72% — pire que les GenRM standard et même que le meilleur zero-shot judge. Le CoT dans l'output introduit du bruit structurel et occupe le budget de tokens. **MathIF (arXiv:2505.14810, mai 2025)** documente un pattern de **trade-off entre performance de raisonnement et capacité de suivi d'instructions** sur 23 modèles.

**Modalité 3 : Raisonnement internalisé — bénéfique.**

**Thinking LLMs / TPO (Paliwal et al., Meta FAIR, 2024).** Résultat critique : simplement inciter un modèle à générer des pensées nuit initialement à la performance. Mais après entraînement TPO, **les modèles "pensants" surpassent les baselines sur TOUTES les catégories, y compris l'écriture créative et le marketing**. AlpacaEval : 52.5% (TPO) vs 48.4% (baseline). [Confiance : **Moyenne-Haute**]

- _Citation :_ Paliwal, S., et al. (2024). "Thinking LLMs." arXiv:2410.10630.

**Integrating Planning into Single-Turn Long-Form Text Generation (Liang et al., Google Research, soumis ICLR 2025).** La planification internalisée par fine-tuning produit **+2.5% ROUGE-Lsum** et un ratio victoire/défaite de **3.60** en évaluation humaine side-by-side. Victoires claires en organisation, pertinence et vérifiabilité. [Confiance : **Moyenne-Haute**]

**Learning to Reason for Long-Form Story Generation (arXiv:2503.22828, mars 2025).** Premier travail appliquant l'entraînement RL au raisonnement pour la génération créative longue. **64.7% de probabilité de préférence** vs baseline en qualité globale. Le modèle SFT montre des problèmes de répétition sévères que le modèle RL-reasoning évite. [Confiance : **Moyenne**]

**WritingBench — ablation étendue (NeurIPS 2025).** Les **modèles raisonnement** (Claude-3.7-thinking, DeepSeek-R1, o1-Preview) **surpassent leurs homologues non-raisonnement** sur le domaine Literature & Art. Claude-3.7-thinking mène sur les deux dimensions. [Confiance : **Haute**]

**The Illusion of Thinking (Apple ML Research, juin 2025).** Nuance importante : les modèles standard surpassent les modèles de raisonnement sur les tâches à faible complexité. Les modèles R1-distillés montrent une régression sur ArenaHard et Alpaca-Eval-2. [Confiance : **Moyenne-Haute**]

### Synthèse

La planification aide quand elle est **internalisée dans les poids** ; elle nuit quand elle **occupe des tokens de l'output**. Cette distinction résout la contradiction apparente entre WritingBench et LongWriter et fournit une directive pratique claire.

---

## Section 7 — Unification théorique du mode collapse cross-domain

### État des lieux

L'ERBP de Chen (arXiv:2512.14879) constitue la tentative d'unification la plus ambitieuse, couvrant LLM ("generative degeneracy"), GAN ("mode collapse") et RL ("policy collapse") sous un même formalisme information-géométrique — les trois phénomènes résultent de projections de Bregman stochastiques sur des supports empiriques en contraction.

**Strong Model Collapse (Dohmatob, Feng & Kempe, ICLR 2025)** établit des bornes théoriques strictes montrant que le collapse **ne peut pas être mitigé** par simple pondération de données quand la fraction synthétique ne diminue pas.

**Is Model Collapse Inevitable? (Gerstgrasser et al., COLM 2024/ICML 2024)** fournit la validation empirique cross-modale la plus convaincante : l'**accumulation de données** (garder réel + synthétique) évite le collapse, validé sur transformers LM (TinyStories), modèles de diffusion (GeoDiff), VAEs (CelebA images).

**Borji (arXiv:2410.12954, 2024)** montre via KDE que le model collapse est un phénomène **statistique fondamental** — l'ajustement et l'échantillonnage répétés de distributions mènent à la perte d'information indépendamment du type de modèle.

### Sous-lacunes persistantes

Trois sous-lacunes critiques persistent : (a) aucune théorie unifiée du mode collapse **à l'inférence/génération** (tous ces travaux traitent du collapse d'entraînement récursif) ; (b) la génération musicale est entièrement absente de tout cadre théorique ; (c) aucun parallèle formel entre la dégénérescence textuelle et le mode collapse en image/audio pendant la génération n'a été établi.

---

## Section 8 — Le paradoxe entropique et tendances émergentes

### Le paradoxe entropique des grands modèles

L'étude "When Less is More: The LLM Scaling Paradox in Context Compression" (arXiv:2602.09789) révèle que la distribution d'entropie n'est **pas monotone avec la taille du modèle** : elle diminue de 0.6B à 4B paramètres, puis _augmente_ de 4B à 90B. Les modèles plus grands entrent dans un "higher-entropy regime where multiple paraphrastic continuations remain competitive," créant un "creativity trap." Les modèles plus grands sont potentiellement **plus vulnérables** à la dérive stylistique dans les générations longues.

### Trois tendances émergentes (2025-2026)

**L'explosion de la littérature sur l'overthinking.** Un sous-champ entier a émergé autour de la détection et la mitigation de la génération excessive. Word Salad Chopper (EMNLP 2025), Stop Spinning Wheels, SelfBudgeter, OptimalThinkingBench et la survey TMLR convergent vers un constat : les modèles gaspillent >50% de leurs tokens, et la génération prolongée peut **activement dégrader** les réponses. Les mécanismes de détection (classificateurs sur hidden states, monitoring d'entropie) sont directement transposables à la prose.

**Le paradigme "Shifting from Input to Output."** Wu et al. (2025) formalisent un changement de paradigme : la communauté a longuement étudié la compréhension de contextes longs en entrée (128K+ tokens) mais négligé la génération longue en sortie. La recherche passe de "combien le modèle peut lire" à "combien il peut écrire avec qualité."

**L'interprétabilité mécanistique de la dégénérescence.** En 2024-2025, trois études peer-reviewed (Repetition Neurons NAACL 2025, Repeat Curse ACL 2025, Correlation Dimension NeurIPS 2025) établissent les bases d'une compréhension mécanistique. Les "features de répétition" et "neurones de répétition" offrent des cibles concrètes d'intervention au-delà des heuristiques de décodage.

---

## Section 9 — Exceptions et calibration : quand le single-shot est acceptable

### Fondement empirique

Les données de ce rapport permettent d'identifier des conditions où la génération single-shot reste viable, voire optimale. L'objectif est d'éviter qu'un garde-fou itératif devienne une friction systématique sur des cas triviaux.

### Critères de viabilité du single-shot

**Seuil de longueur.** WritingBench (NeurIPS 2025) montre une dégradation significative **au-delà de ~3,000 output tokens** (~2,000 mots). En deçà, la qualité reste acceptable pour la majorité des modèles. Le plafond effectif identifié par LongWriter est de ~2,000 mots sans entraînement spécialisé. En dessous de **~500-800 mots** (~750-1,200 tokens), les mécanismes de dégradation (attention dilution, repetition self-reinforcement) n'ont pas le temps de s'installer significativement. **Le single-shot est viable pour les textes courts.**

**Nature du contenu.** La dégradation affecte les dimensions de qualité de manière inégale. WritingBench montre que le domaine Literature & Art obtient les scores les plus bas — l'écriture créative est le premier domaine affecté. Les contenus standardisés/formulaïques (emails de confirmation, descriptions produit sur template, réponses factuelles structurées) sont moins vulnérables car leur qualité ne dépend pas de l'originalité ou de la diversité stylistique. **Le single-shot est viable pour les contenus formulaïques.**

**Intention déclarée.** Un premier jet exploratoire, un brainstorming, un brouillon déclaré comme tel n'ont pas besoin d'atteindre la qualité publication. L'étude de Mollick suggère que l'exploration large (demander 50 idées au lieu de 10) est un usage légitime du single-shot, la sélection et le raffinement venant ensuite. **Le single-shot est viable pour les premiers jets déclarés.**

**Complexité de la tâche.** "The Illusion of Thinking" (Apple, 2025) montre que les modèles standard surpassent les modèles de raisonnement sur les tâches à faible complexité. Par extension, l'overhead itératif n'est pas justifié pour les tâches simples. **Le single-shot est viable pour les réponses factuelles directes.**

### Matrice de décision

|Critère|Single-shot viable|Itératif recommandé|
|---|---|---|
|Longueur|< 800 mots|> 1,500 mots|
|Type de contenu|Email, description standardisée, FAQ, résumé|Article de fond, prose créative, contenu éditorial|
|Intention|Premier jet, brainstorming, exploration|Publication, contenu destiné à un public|
|Exigence qualité|Usage interne, draft|Qualité publication, contenu signé|
|Originalité requise|Faible (template, réponse type)|Haute (angle distinctif, voix propre)|

**Zone grise (800-1,500 mots)** : la décision dépend de la combinaison des autres critères. Un email de 1,000 mots mais standardisé reste viable en single-shot. Un billet de blog de 1,000 mots destiné à publication bénéficie de l'itératif.

---

## Section 10 — Protocole de redirection : transformer les findings en comportement

### Principes de design

Ce protocole traduit les données empiriques en directives actionnables pour un assistant d'écriture. Il est calibré pour éviter deux écueils : l'absence de garde-fou (laissant le modèle produire du contenu long de qualité médiocre) et l'excès de friction (imposant un workflow itératif pour un email de 3 lignes).

### Arbre de décision

**Étape 1 : Évaluation de la demande.**

Quand une demande d'écriture est reçue, évaluer selon trois axes : la longueur anticipée du contenu final, le type de contenu (créatif / éditorial / standardisé / factuel), et l'intention déclarée ou inférée (publication / draft / exploration).

**Étape 2 : Triage.**

- **Texte court (< 800 mots) ET contenu standardisé** → Génération directe sans friction. Aucune redirection nécessaire.
- **Texte court (< 800 mots) ET contenu créatif/éditorial** → Génération directe acceptable, mais proposer un affinement en follow-up si la qualité est critique.
- **Texte moyen (800-1,500 mots)** → Proposer une décomposition optionnelle. Demander : quel est le public cible ? Quelle est l'intention (draft vs publication) ? L'angle est-il défini ?
- **Texte long (> 1,500 mots)** → Redirection vers un workflow itératif. C'est ici que les données empiriques sont les plus fortes.

**Étape 3 : Workflow itératif recommandé (pour textes longs).**

Le workflow en 4 phases s'appuie sur les données convergentes de Self-Refine, CogWriter, Writing Path, SuperWriter et les praticiens documentés.

**Phase 1 — Cadrage (avant toute génération).** Clarifier : le sujet précis, l'angle ou la thèse (pour forcer la spécificité et contrer le problème de l'angle générique), le public cible, le ton et le registre attendus, la longueur souhaitée et le format de sortie. Cette phase correspond à l'injection de contraintes qui réduit l'espace de complétions possibles et force le modèle hors des modes statistiquement dominants.

**Phase 2 — Structure (plan/outline).** Produire un outline détaillé : sections principales avec objectifs de contenu par section, transitions logiques, estimation de longueur par section. L'outline ne doit PAS apparaître dans l'output final (les données de LongWriter et LitBench montrent que le plan dans l'output nuit à la qualité). L'outline sert de guide interne.

**Phase 3 — Génération par sections.** Produire le contenu section par section (~500-800 mots par chunk), en intégrant le contexte des sections précédentes dans chaque prompt (pour maintenir la cohérence) mais sans accumuler un contexte excessif (pour éviter le context rot). Les données de CogWriter montrent que cette décomposition + monitoring produit un gain de 22% vs single-shot.

**Phase 4 — Révision (2 passes maximum).** Self-Refine et l'expérience Tom Johnson convergent sur un sweet spot de **2-3 passes**. La première passe se concentre sur la cohérence globale, les transitions, les redondances. La seconde sur le style, la précision, la voix. Au-delà, les rendements sont décroissants et la qualité peut se dégrader.

### Calibration du ton de la redirection

La redirection ne doit pas être moralisatrice. Elle doit positionner le workflow itératif comme une **optimisation** plutôt qu'une correction. La donnée clé à communiquer : les études montrent systématiquement qu'une approche en phases améliore la qualité finale de 15-57% selon les métriques, et que les modèles les plus avancés bénéficient également de cette décomposition (Self-Refine montre que même GPT-4 s'améliore significativement).

---

## Section 11 — Gaps résiduels et questions ouvertes

Malgré les avancées significatives, six gaps persistent dans la connaissance actuelle.

**1. Aucune étude mesurant toutes les dimensions de qualité simultanément comme fonction continue de la position.** C'est le gap le plus fondamental encore ouvert. Les outils existent (FActScore, MATTR, G-Eval, STIC), mais personne ne les a combinés. Wu et al. (2025) ont formellement identifié cette lacune dans leur position paper.

**2. La transposition des détecteurs d'overthinking à la prose.** Word Salad Chopper, GenGuard, Stop Spinning Wheels fonctionnent pour le raisonnement et le code. Leur application à l'écriture créative ou technique reste à démontrer.

**3. Le sweet spot de longueur pour la prose n'est pas empiriquement validé.** La convergence autour de 2,000-3,000 tokens est un pattern observé, pas un résultat optimisé formellement. L'approche dynamique (ERGO) est plus prometteuse qu'un nombre fixe.

**4. L'homogénéisation intra-output reste partiellement mesurée.** Carlsson et al. mesurent le TTR, EQ-Bench mesure la dégradation par chapitre, mais aucune étude ne combine TTR + diversité syntaxique + richesse vocabulaire + nouveauté sémantique dans une analyse positionnelle unifiée.

**5. L'unification du mode collapse à la génération (pas à l'entraînement) reste ouverte.** Les cadres théoriques existants (ERBP, Strong Model Collapse) traitent du collapse d'entraînement récursif, pas du collapse progressif pendant une inférence unique.

**6. Aucune comparaison systématique du spectre complet des approches itératives.** Les études comparent individuellement single-shot vs une méthode itérative spécifique, mais aucun benchmark ne confronte single-shot, Self-Refine, AgentWrite, outline-based, chunk-with-reset sous conditions identiques.

---

## Conclusion

Cinq insights actionnables émergent de cette synthèse consolidée.

**La dégradation avec la longueur est un fait multi-causal.** C'est la superposition de l'attention dilution (prouvée), du repetition self-reinforcement (démontré, avec circuits neuronaux identifiés), du SFT data bottleneck (démontré), du biais de typicalité de l'alignement (démontré), et possiblement de l'exposure bias (débattu). Chaque mécanisme opère à une échelle différente.

**La supériorité de l'itératif est désormais quasi-unanime** dans la littérature (8 études concordantes, 0 discordante), avec des gains quantifiés de 15-57% selon les métriques et les approches. Le gap initial sur l'absence d'études A/B est en voie de résolution.

**La distinction entre types de raisonnement est critique.** Le CoT en prompt n'aide pas l'écriture (+0.7%). Le CoT dans l'output nuit. Le raisonnement internalisé par entraînement améliore significativement. Cette tripartition résout les contradictions apparentes dans la littérature.

**Le sweet spot est dynamique, pas statique.** Les détecteurs basés sur l'entropie et les classificateurs sur hidden states offrent des approches plus prometteuses qu'un seuil fixe de tokens. La transposition de ces outils du raisonnement vers la prose est l'axe de recherche le plus immédiatement actionnable.

**Le problème de l'angle générique est structurel, pas accidentel.** Le softmax bottleneck, le mode collapse du SFT, et le biais de typicalité du RLHF convergent pour produire le contenu le plus statistiquement probable — et donc le plus banal. L'itération est le mécanisme le plus efficace documenté pour forcer la spécificité, non pas par magie mais parce que chaque contrainte additionnelle réduit l'espace des complétions et pousse le modèle hors de ses modes dominants.

---

## Références consolidées (par ordre d'apparition)

1. Pillutla, K., et al. (2021). "MAUVE: Measuring the Gap Between Neural Text and Human Text using Divergence Frontiers." NeurIPS 2021.
2. Wu, Y., et al. (2025). "LongGenBench: Benchmarking Long-Form Generation in Long Context LLMs." ICLR 2025. arXiv:2409.02076.
3. WritingBench. (2025). arXiv:2503.05244, NeurIPS 2025.
4. Hong, K., Troynikov, A., Huber, J. (2025). "Context Rot." Chroma Research.
5. Vectara (2024). "Next Generation Hallucination Leaderboard."
6. Que, H., et al. (2024). "HelloBench." ICLR 2025. arXiv:2409.16191.
7. Min, S., et al. (2023). "FActScore." EMNLP 2023. arXiv:2305.14251.
8. Deshpande, V., et al. (2025). "A Penalty Goes a Long Way." arXiv:2507.15092.
9. arXiv:2502.12769 (2025). "How Much Do LLMs Hallucinate across Languages?"
10. Laban, P., et al. (2025). "LLMs Get Lost In Multi-Turn Conversation." arXiv:2505.06120.
11. Veličković, P., et al. (2025). "Softmax is not Enough." ICML 2025.
12. Barbero, F., et al. (2024). "Transformers Need Glasses!" arXiv:2406.04267.
13. Finlayson, M., et al. (2024). "Closing the Curious Case of Neural Text Degeneration." ICLR 2024.
14. Xu, J., et al. (2022). "Learning to Break the Loop." NeurIPS 2022.
15. Hiraoka, T. & Inui, K. (2025). "Repetition Neurons." NAACL 2025. arXiv:2410.13497.
16. Yao, S., et al. (2025). "Understanding the Repeat Curse from a Feature Perspective." ACL 2025 Findings.
17. Mahaut, M. & Franzon, F. (2025). "Repetitions Are Not All Alike." arXiv:2504.01100.
18. Holtzman, A., et al. (2020). "The Curious Case of Neural Text Degeneration." ICLR 2020.
19. Liu, N.F., et al. (2024). "Lost in the Middle." TACL 2024.
20. OpenReview (2024). "Attributing Mode Collapse in the Fine-Tuning Pipeline."
21. Zhang, Y., et al. (2025). "Verbalized Sampling." arXiv:2510.01171.
22. Cui, G., et al. (2025). arXiv:2505.22617.
23. arXiv:2511.15248 (2025). "EntroPIC."
24. arXiv:2505.13514 (2025). "Induction Head Toxicity."
25. Sharma, M., et al. (2024). Anthropic sycophancy study.
26. Shapira, N., et al. (2026). arXiv:2602.01002.
27. Du, Y. & Tanaka-Ishii, K. (2025). "Correlation Dimension of Auto-Regressive LLMs." NeurIPS 2025. arXiv:2510.21258.
28. Chen, X. (2025). "ERBP." arXiv:2512.14879.
29. arXiv:2601.04854 (2026). "Token Maturation."
30. Zhang, Y., Bao, H. & Huang, S. (2024). "EDT." arXiv:2403.14541.
31. Zhu, D., et al. (2024). "Adaptive Decoding." ICML 2024, PMLR vol. 235.
32. Madaan, A., et al. (2023). "Self-Refine." NeurIPS 2023. arXiv:2303.17651.
33. Bai, Y., et al. (2024). "LongWriter." ICLR 2025. arXiv:2408.07055.
34. arXiv:2510.14077 (2025). "ERGO."
35. Wan, C., et al. (2025). "CogWriter." ACL 2025 Findings. arXiv:2502.12568.
36. Wu, Y., et al. (2025). "LongEval." arXiv:2502.19103.
37. Lee, S., et al. (2025). "Writing Path." NAACL 2025. arXiv:2404.13919.
38. Wang, X., et al. (2025). "DOME." NAACL 2025. arXiv:2412.13575.
39. Wu, Y., et al. (2025). "SuperWriter." arXiv:2506.04180.
40. Huang, L., et al. (2024). "Ex3." ACL 2024.
41. Huot, F., et al. (2025). "Agents' Room." ICLR 2025. arXiv:2410.02603.
42. Johnson, T. (2025). "The allure of iterative improvement loops." idratherbewriting.com.
43. Ghods, K., et al. "Evidence Against LLM Homogenization in Creative Writing."
44. Anderson, B.R., Shah, D.S. & Kreminski, M. (2024). C&C 2024.
45. Moon, S., et al. (2024). ScienceDirect 2025.
46. Kobak, D., et al. (2024). Science Advances.
47. Carlsson, F., et al. (2025). "The Hyperfitting Phenomenon." ICLR 2025. arXiv:2412.04318.
48. Paech, S. (2025). "EQ-Bench Longform."
49. Guo, Y., et al. (2024). "Benchmarking Linguistic Diversity." TACL 2024. arXiv:2412.10271.
50. Mikhaylovskiy, N. (2025). arXiv:2505.12572.
51. Wu, Y., et al. (2025). "Shifting Long-Context LLMs Research from Input to Output." arXiv:2503.04723.
52. Shaib, C., et al. (2024). "Standardizing the Measurement of Text Diversity." arXiv:2403.00553.
53. Sprague, Z., et al. (2025). "To CoT or not to CoT?" ICLR 2025. arXiv:2409.12183.
54. Paliwal, S., et al. (2024). "Thinking LLMs / TPO." arXiv:2410.10630.
55. Liang, Z., et al. (2025). "Integrating Planning into Single-Turn Long-Form Text Generation." Google Research.
56. arXiv:2503.22828 (2025). "Learning to Reason for Long-Form Story Generation."
57. Fein, E., Xiang, A., et al. (2025). "LitBench." Stanford. arXiv:2507.00769.
58. Meincke, L., Mollick, E., Mollick, L. & Shapiro, D. (2025). "The Decreasing Value of CoT in Prompting." Wharton, SSRN.
59. arXiv:2505.14810 (2025). "MathIF."
60. Apple ML Research (2025). "The Illusion of Thinking."
61. Muennighoff, N., et al. (2025). "OptimalThinkingBench." arXiv:2508.13141.
62. EMNLP 2025. "Word Salad Chopper."
63. arXiv:2508.17627 (2025). "Stop Spinning Wheels."
64. Guo, L., et al. (2024). "CodeFast/GenGuard." ISSTA 2024. arXiv:2407.20042.
65. Sun, Z., et al. (2025). arXiv:2504.14350.
66. Sui, Y., et al. (2025). "Stop Overthinking: A Survey." TMLR 2025. arXiv:2503.16419.
67. arXiv:2505.11274 (2025). "SelfBudgeter."
68. Dohmatob, E., Feng, Y. & Kempe, J. (2025). "Strong Model Collapse." ICLR 2025.
69. Gerstgrasser, M., et al. (2024). "Is Model Collapse Inevitable?" COLM 2024/ICML 2024. arXiv:2404.01413.
70. Bertrand, Q., et al. (2024). "On the Stability of Iterative Retraining." ICLR 2024.
71. Borji, A. (2024). arXiv:2410.12954.
72. arXiv:2412.11292 (2024). "Grassmannian Geometry Meets DMD-GEN."
73. arXiv:2602.09789 (2026). "When Less is More: The LLM Scaling Paradox."
74. Soumission ICLR 2026, OpenReview #7421. "Entropy-Guided Token Pooling."