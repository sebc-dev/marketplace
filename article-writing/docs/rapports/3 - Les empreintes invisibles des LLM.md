# Les empreintes invisibles des LLM : signatures statistiques, détection et contre-mesures

Les grands modèles de langage produisent des signatures statistiques involontaires qui les trahissent — et ces marqueurs sont désormais bien documentés scientifiquement. **Le RLHF (Reinforcement Learning from Human Feedback) est le principal amplificateur de ces biais lexicaux**, créant un effondrement de la diversité vocabulaire vers des tokens « sûrs » et préférés par les annotateurs humains. L'étude de référence de Kobak et al. (2025, _Science Advances_) sur **15,1 millions d'abstracts PubMed** estime qu'au minimum **13,5 %** des abstracts de 2024 ont été traités par des LLM, atteignant **40 %** dans certains sous-corpus. Le phénomène est mesurable, mais pas immuable : les marqueurs évoluent entre générations de modèles, créant une course permanente entre détection et évasion. Pour un rédacteur utilisant l'IA comme assistant éditorial, comprendre ces mécanismes est la clé pour produire un texte authentiquement humain.

---

## Section A — Mécanismes

### Pourquoi les LLM convergent vers certains tokens

Le mécanisme fondamental tient en trois étapes cumulatives. D'abord, **la prédiction token-par-token** : le modèle calcule une distribution de probabilité sur tout le vocabulaire (~50 000+ tokens) via la fonction softmax, qui amplifie intrinsèquement les écarts entre logits. Les tokens les plus probables concentrent la majorité de la masse probabiliste. Ensuite, **les stratégies d'échantillonnage** (température, top-k, top-p/nucleus sampling) tronquent systématiquement la queue de distribution, excluant les tokens rares ou inhabituels. À température modérée (0,7–1,0, valeur par défaut de la plupart des déploiements), le modèle favorise mécaniquement les tokens à haute probabilité. Holtzman et al. (« The Curious Case of Neural Text Degeneration », ICLR 2020) ont formalisé ce phénomène en introduisant le nucleus sampling.

Mais c'est la troisième couche — **le fine-tuning d'alignement par RLHF** — qui amplifie le plus les biais lexicaux. Chen et al. (« On the Algorithmic Bias of Aligning Large Language Models with RLHF », _Journal of the American Statistical Association_, vol. 120, n° 552, 2025) démontrent que la régularisation par divergence KL dans le RLHF crée un **biais algorithmique inhérent** pouvant mener à un « effondrement des préférences » (_preference collapse_), où les préférences minoritaires sont virtuellement ignorées. Un article sur le Soft Preference Learning (arXiv:2511.08594, 2024) confirme que « les algorithmes d'alignement comme le RLHF et le DPO réduisent significativement la diversité des sorties LLM — non seulement en termes de structure et de choix lexical, mais aussi en termes de perspectives sociétales ». [Confiance : élevée — publications évaluées par les pairs]

### Le RLHF comme amplificateur lexical : le cas « delve »

L'article de référence de Juzek et al. (« Why Does ChatGPT 'Delve' So Much? », COLING 2025, ACL Anthology) apporte la preuve expérimentale la plus directe du rôle du RLHF. En comparant Llama Base et Llama Instruct sur un corpus de 26,7 millions d'abstracts PubMed (5,2 milliards de tokens), les auteurs identifient **21 « mots focaux »** surreprésentés. Résultat clé : 813 des 814 mots significativement plus utilisés par Llama Instruct que par Llama Base étaient aussi surreprésentés par rapport au baseline humain. Ils émulent ensuite la procédure LHF expérimentalement et démontrent que « les participants préfèrent systématiquement les variantes de texte contenant certains mots », établissant un **lien causal** entre les préférences humaines dans le feedback et la surreprésentation lexicale. [Confiance : élevée — COLING 2025, évalué par les pairs]

L'hypothèse des annotateurs kenyans/nigérians (où le mot « delve » est plus fréquent dans l'anglais formel local) avancée par Alex Hern dans _The Guardian_ (avril 2024) et relayée par Simon Willison n'a pas été confirmée par l'analyse des variétés d'anglais dans le corpus ICE par Juzek et al. [Confiance : faible — hypothèse plausible mais non confirmée empiriquement]

### Les distributions de Zipf perturbées par les LLM

Huang et al. (« How Do LLM-Generated Texts Impact Term-Based Retrieval Models? », arXiv:2508.17715, 2025) montrent que les textes générés par LLM présentent un α₁ de Zipf plus faible que les textes humains dans 8 des 9 jeux de données testés, indiquant **une distribution plus uniforme du vocabulaire de base**. Les LLM génèrent du texte avec un vocabulaire plus étroit, davantage de verbes auxiliaires et moins de mots de contenu que les humains (observation convergente de Muñoz-Ortiz et al., 2024 ; Seals et Shalin, 2023). [Confiance : élevée — convergence de plusieurs études]

### La diversité lexicale réduite : TTR, MTLD et entropie de Shannon

Au-delà des distributions de Zipf, des métriques classiques de stylométrie quantifient directement l'appauvrissement lexical des LLM. Le **TTR** (_Type-Token Ratio_, V/N) est la plus ancienne mais sa sensibilité à la longueur du texte la rend inadaptée aux comparaisons brutes humain/LLM. Le **MTLD** (_Measure of Textual Lexical Diversity_, McCarthy & Jarvis 2010, _Behavior Research Methods_) résout ce problème par un algorithme séquentiel bidirectionnel : le texte est parcouru token par token, un TTR courant est calculé cumulativement ; lorsqu'il descend sous le seuil de 0,720, un « facteur » est compté et le TTR est réinitialisé. Le MTLD final égale N divisé par le nombre de facteurs — c'est « the only index not found to vary as a function of text length » parmi les quatre types de validité testés. Le **vocd-D** et son successeur analytique **HD-D** (McCarthy & Jarvis 2007, _Language Testing_) utilisent une approche par courbe d'échantillonnage avec distribution hypergéométrique, éliminant le biais de longueur par une autre voie.

L'**entropie de Shannon au niveau texte**, H = −Σ p(w) log₂ p(w), mesure l'uniformité de la distribution du vocabulaire d'un document. Elle est **fondamentalement distincte** de l'entropie token par token de GLTR : l'entropie textuelle est une propriété intrinsèque du texte (aucun modèle requis), tandis que l'entropie GLTR mesure la prévisibilité du texte *pour* un modèle de référence. Un texte peut avoir une entropie lexicale élevée (vocabulaire diversifié) mais une entropie conditionnelle basse (si le modèle trouve les choix prévisibles en contexte).

Le consensus empirique est quasi unanime. Terčon & Dobrovoljc (2025, arXiv:2510.05136), synthétisant 44 études, rapportent que la littérature conclut « almost universally » que le texte IA est moins lexicalement diversifié. Muñoz-Ortiz et al. (2024, _Artificial Intelligence Review_) mesurent sur six LLM un classement sans ambiguïté : **Humain > LLaMa > Mistral >> Falcon**, la famille de modèles important plus que la taille pour la richesse lexicale. Toutes les différences sont statistiquement significatives (p < 0,05).

**Exception notable :** Martínez et al. (2024, _ACM TIST_) montrent que **GPT-4 atteint une diversité similaire, voire supérieure aux humains** dans certains cas, tandis que GPT-3.5 reste inférieur. La diversité dépend fortement de la version du modèle et des paramètres de décodage (température, _frequency penalty_). Herbold et al. (2023) confirment : GPT-3.5 < Humain < GPT-4. Ce résultat signifie que la diversité lexicale seule devient un signal moins fiable face aux modèles de dernière génération. [Confiance : élevée — convergence de multiples études peer-reviewed]

Ces trois dimensions — faible diversité lexicale (MTLD/entropie), faible perplexité, faible burstiness — forment une **triade corrélée mais non redondante** caractéristique du texte LLM. Dans les classificateurs ML académiques, la diversité lexicale joue un rôle remarquable : une étude publiée dans _AI and Ethics_ (Springer, 2025) utilisant XGBoost rapporte qu'elle est **la _feature_ la plus importante** — devant la perplexité — avec un F1 de 94 %. Le framework **DivEye** (Basani & Chen, 2025, arXiv:2509.18880) capture la diversité des patterns de _surprisal_ et surpasse les détecteurs zero-shot existants de jusqu'à 33,2 %. Aucun détecteur commercial majeur (GPTZero, Originality.ai, Binoculars) ne documente cependant l'utilisation explicite de ces métriques. [Confiance : élevée pour le pattern ; moyenne pour DivEye, preprint]


### Les idiolectes des différents modèles

Reinhart et al. (« Do LLMs write like humans? Variation in grammatical and rhetorical styles », _PNAS_, 122(8), 2025) fournissent la comparaison inter-modèles la plus rigoureuse à ce jour. En utilisant les 66 caractéristiques linguistiques de Douglas Biber sur des corpus parallèles humain/LLM, ils révèlent que :

- **GPT-4o** utilise les propositions participiales présentes à **5,3× le taux humain**, les nominalisations à ~2× et la voix passive agentive à ~0,5× le taux humain.
- Les **modèles instruction-tuned** montrent des écarts plus grands que les modèles base — l'instruction tuning éloigne le modèle du style humain plutôt que de l'en rapprocher.
- Un classificateur random forest atteint **66 % de précision** pour distinguer 7 sources textuelles, les erreurs se concentrant entre modèles de la même famille (Llama 8B vs 70B).
- Seulement **4,2 %** des textes LLM sont faussement classés comme humains.

Une analyse de linguistique forensique publiée par _Scientific American_ (2025) appliquant la méthode Delta de Burrows révèle des « idiolectes » distincts : ChatGPT adopte un style « clinique et académique » tandis que Gemini est « plus conversationnel et explicatif ». Sur le thème du diabète, Gemini utilise « high blood sugar » 158 fois contre 25 pour ChatGPT, qui préfère « blood glucose levels ». [Confiance : élevée pour PNAS ; moyenne pour Scientific American]

### Pourquoi les LLM produisent des collocations prévisibles : le mécanisme autorégressif

Le rapport documente les marqueurs unilexicaux et les expressions multi-mots surreprésentées, mais le mécanisme qui produit ces **signatures de co-occurrence** mérite un cadrage distinct. La décomposition autorégressive P(x₁...xₙ) = ∏ P(xᵢ | x₁...xᵢ₋₁) favorise mécaniquement les continuations à haute probabilité conjointe : une fois « it is » généré, P(« important » | « it is ») est élevée, puis P(« to » | « important ») est élevée, créant des chaînes de collocations en cascade. McCoy et al. (2024, _PNAS_, 121(41), « Embers of Autoregression ») formalisent cet effet : même sur des tâches déterministes où la probabilité inconditionnelle P(output) devrait être non pertinente, les prédictions du LLM restent influencées par la fréquence des combinaisons dans les données d'entraînement.

Le RLHF amplifie considérablement cette concentration. West & Potts (2025, ICLR, « Diverse Preference Learning ») **prouvent formellement** que le régulariseur KL du RLHF/DPO élimine la diversité entre synonymes équivalents — si un annotateur n'a pas de préférence forte entre deux formulations, la politique optimale en sélectionne une quasi systématiquement. Zhang et al. (2025, arXiv:2510.01171) identifient un **biais de typicalité** : les annotateurs favorisent les formulations familières par effet de simple exposition et fluence de traitement, renforçant les collocations fréquentes lors de l'entraînement. Kirk et al. (2023, arXiv:2310.06452) fournissent la première démonstration empirique du _mode collapse_ induit par le RLHF par rapport au SFT.

La **différence avec les marqueurs unilexicaux** est structurelle : « crucial » apparaît fréquemment dans les deux types de textes, mais sa co-occurrence systématique avec « to note that » à une fréquence statistiquement anormale crée une signature distincte. Les humains introduisent plus de variance en choisissant parmi un éventail plus large de formulations alternatives. Les données empiriques confirment la puissance de ce signal : **DNA-GPT** (Yang et al., ICLR 2024) montre que l'AUROC passe de ~58 % pour les unigrammes à **~97 % pour les 6-grams** — les patterns de co-occurrence d'ordre élevé constituent le signal discriminant le plus puissant identifié à ce jour. **Ghostbuster** (Verma et al., NAACL 2024) atteint un F1 de 99,0 en combinant unigrammes, trigrammes Kneser-Ney et probabilités LM dans un classificateur linéaire. [Confiance : élevée — PNAS, ICLR, NAACL, tous peer-reviewed]

Les « **tortured phrases** » de Cabanac, Labbé & Magazinov (2021) représentent le **miroir inversé** de ce phénomène : la substitution synonymique mot par mot (« artificial intelligence » → « counterfeit consciousness ») détruit l'intégrité collocative, créant un signal par l'absence des co-occurrences attendues. La surreprésentation LLM et la destruction par paraphrase reposent sur le même insight : les patterns collocatifs portent une empreinte distinctive qui diffère entre texte humain, texte paraphrasé et texte génératif. [Confiance : élevée — travaux couverts par _Nature_, base PPS de 7 000+ phrases]

### Watermarking involontaire versus intentionnel

La distinction est fondamentale. Les **signatures involontaires** émergent de la convergence des données d'entraînement, de l'architecture, du RLHF et du décodage. Elles sont détectables par analyse statistique mais fragiles — elles changent avec les mises à jour du modèle. Les **filigranes intentionnels** sont des interventions cryptographiques délibérées dans le processus d'échantillonnage.

**Kirchenbauer et al.** (« A Watermark for Large Language Models », ICML 2023, arXiv:2301.10226) introduisent la méthode de référence : avant chaque token, un hachage du contexte précédent partitionne le vocabulaire en « liste verte » et « liste rouge ». Un biais δ est ajouté aux logits des tokens verts avant le softmax, rendant leur sélection plus probable. La détection se fait par z-test sans accès au modèle — uniquement avec la clé secrète. Pour un texte watermarké, « la probabilité que le nombre observé de tokens verts survienne par hasard est ≈6×10⁻¹⁴ ». [Confiance : élevée — ICML, évalué par les pairs]

**Scott Aaronson** (UT Austin, ex-OpenAI) a développé un schéma parallèle utilisant le **truc de Gumbel** pour un échantillonnage pseudo-aléatoire « sans distorsion » — le texte apparaît statistiquement identique sans la clé. Décrit dans des conférences et blogs (novembre 2022, Simons Institute août 2023), **ce schéma n'a jamais été déployé en production** selon une interview Axios de janvier 2025, ni publié comme article formel. [Confiance : moyenne — sources non évaluées par les pairs]

**SynthID-Text** de Google DeepMind (Dathathri et al., _Nature_ 634, 818-823, 2024) représente le seul filigrane intentionnel déployé à grande échelle — testé sur **~20 millions de réponses Gemini** sans dégradation de qualité, open-sourcé via Hugging Face. [Confiance : élevée — Nature]

Un lecteur humain attentif ne peut pas détecter un filigrane intentionnel bien conçu : les schémas « sans distorsion » (distortion-free) sont conçus pour être invisibles sans la clé cryptographique. Les signatures involontaires, en revanche, produisent des artefacts observables : surreprésentation lexicale, uniformité syntaxique, ton diplomatique.

### Le problème de l'impossibilité théorique

Sadasivan et al. (« Can AI-Generated Text be Reliably Detected? », arXiv:2303.11156, 2023) portent le coup théorique le plus sérieux. Leur attaque par paraphrase récursive fait chuter le TPR du watermarking de Kirchenbauer de **99,8 % à 9,7 %** au seuil de 1 % FPR. Leur résultat théorique relie l'AUROC du meilleur détecteur possible à la distance de variation totale entre distributions humaine et IA : **à mesure que les LLM s'améliorent, cette distance diminue et la détection tend vers le hasard**. [Confiance : élevée pour le résultat théorique ; la portée pratique reste débattue]

### L'évolution temporelle des marqueurs

Les signatures lexicales sont instables entre générations. L'observation la plus documentée : le mot « delve », massivement surreprésenté par ChatGPT en 2023-2024, a **chuté fortement début 2025** après avoir été publiquement identifié comme marqueur IA. Une étude (« Human-LLM Coevolution: Evidence from Academic Writing », arXiv:2502.09606, 2025) montre que d'autres mots comme « significant » continuent d'augmenter. Les éditeurs Wikipedia observent : « En 2025, 'delve' est mort, 'underscore' est mourant » (Wikipedia:Signs of AI writing, décembre 2025). Il est « 100 % certain que les programmes de détection sont utilisés pour entraîner les LLM à ne plus écrire ainsi » — mais « les anciens signes seront simplement remplacés par de nouveaux ». [Confiance : élevée — observations convergentes, mais pas d'étude longitudinale systématique]

---

## Section B — Corpus de marqueurs enrichi

### Tableau 1 : Marqueurs lexicaux anglais (nouveaux, au-delà du point de départ)

|Mot / Expression|Ratio LLM:Humain|Source|Type de preuve|Date|
|---|---|---|---|---|
|_showcasing_|r = 10,7 (PubMed) ; 20× (GPTZero)|Kobak et al. 2025, _Science Advances_ ; GPTZero (3,3M docs)|Étude empirique évaluée par les pairs ; corpus commercial|2025|
|_underscores_|r = 13,8|Kobak et al. 2025, _Science Advances_|Étude empirique (15,1M abstracts)|2025|
|_delves_ (forme fléchie)|r = 28,0|Kobak et al. 2025, _Science Advances_|Étude empirique|2025|
|_crucial_|δ = 0,037 (gap de fréquence)|Kobak et al. 2025 ; Gray 2024 (Dimensions)|Études empiriques|2024-2025|
|_comprehensive_|« common set » top-10|Kobak et al. 2025|Étude empirique|2025|
|_enhancing_|« common set » top-10|Kobak et al. 2025|Étude empirique|2025|
|_notably_|« common set » top-10|Kobak et al. 2025|Étude empirique|2025|
|_particularly_|« common set » top-10|Kobak et al. 2025|Étude empirique|2025|
|_across_|« common set » top-10|Kobak et al. 2025|Étude empirique|2025|
|_within_|« common set » top-10|Kobak et al. 2025|Étude empirique|2025|
|_exhibited_|« common set » top-10|Kobak et al. 2025|Étude empirique|2025|
|_insights_|« common set » top-10|Kobak et al. 2025|Étude empirique|2025|
|_additionally_|« common set » top-10|Kobak et al. 2025|Étude empirique|2025|
|_intricate_|+117 % (2022→2023)|Gray 2024, UCL Library (Dimensions)|Étude empirique|2024|
|_noteworthy_|+30 %+ (groupe adj.)|Gray 2024|Étude empirique|2024|
|_versatile_|+30 %+ (groupe adj.)|Gray 2024|Étude empirique|2024|
|_invaluable_|+30 %+ (groupe adj.)|Gray 2024|Étude empirique|2024|
|_innovative_|+30 %+ (groupe adj.)|Gray 2024 ; Liang et al. 2025 (_Nature Human Behaviour_)|Études empiriques|2024-2025|
|_ingenious_|+30 %+ (groupe adj.)|Gray 2024|Étude empirique|2024|
|_meticulously_ (adv.)|+137 %|Gray 2024|Étude empirique|2024|
|_innovatively_|+26 %|Gray 2024|Étude empirique|2024|
|_methodically_|+26 %|Gray 2024|Étude empirique|2024|
|_nuanced_|21 mots focaux|Juzek & Ward, COLING 2025|Évaluation par les pairs|2025|
|_surpass / surpassing_|12× (GPTZero) ; mot focal|GPTZero 2024 ; Juzek & Ward 2025|Corpus commercial ; évaluation pairs|2024-2025|
|_remarked_|18×|GPTZero (3,3M docs, oct. 2024)|Corpus commercial|2024|
|_aligns_|16×|GPTZero|Corpus commercial|2024|
|_impacting_|11×|GPTZero|Corpus commercial|2024|
|_fostering / foster_|—|Multiples listes praticiens (Embryo, AI Phrase Finder)|Consensus communautaire|2024-2025|
|_elevate_|—|Guardian (via Willison, avril 2024)|Observation praticien|2024|
|_resonate_|—|Guardian (via Willison, avril 2024)|Observation praticien|2024|
|_testament_|—|Guardian (via Willison, avril 2024)|Observation praticien|2024|
|_streamline_|—|Multiples listes praticiens|Consensus communautaire|2024-2025|
|_transformative_|—|Multiples listes praticiens|Consensus communautaire|2024-2025|
|_groundbreaking_|—|Multiples listes praticiens|Consensus communautaire|2024-2025|
|_paramount_|—|Multiples listes praticiens|Consensus communautaire|2024-2025|

**Expressions multi-mots anglaises à forte surreprésentation :**

|Expression|Ratio LLM:Humain|Source|Date|
|---|---|---|---|
|« objective study aimed »|269×|GPTZero (3,3M docs)|oct. 2024|
|« play a significant/crucial role in shaping »|182×|GPTZero|oct. 2024|
|« notable works/figures include »|120×|GPTZero|oct. 2024|
|« today's fast-paced world »|107×|GPTZero|oct. 2024|
|« aims to explore / aims to [verbe] »|50×|GPTZero|oct. 2024|
|« It is important/worth noting that »|—|Consensus communautaire + Embryo (mars 2025)|2024-2025|
|« In today's rapidly evolving [X] »|—|GPTZero + Embryo|2024-2025|
|« cannot be overstated »|—|Embryo (mars 2025)|2025|

**Note méthodologique :** Les ratios GPTZero proviennent d'un corpus de 3,3 millions de documents (octobre 2024) — large mais issu d'une entreprise commerciale de détection. Les données Kobak et al. et Gray sont les plus fiables (corpus massifs, méthodologies transparentes, évaluation par les pairs pour Kobak).

**Donnée quantitative nouvelle sur des marqueurs déjà connus :** « delve » (forme conjuguée _delves_) atteint un ratio de **28,0** dans Kobak et al. (2025) — bien au-delà du +400 % précédemment documenté. Kobak identifie un ensemble de **379 mots de style en excès** en 2024, dont **66 % sont des verbes** et 14 % des adjectifs. Les 10 mots les plus discriminants (_across, additionally, comprehensive, crucial, enhancing, exhibited, insights, notably, particularly, within_) à eux seuls produisent un Δ_common = 0,134, c'est-à-dire que **≥13,4 % des abstracts** contiennent au moins un de ces 10 mots en excès.

### Tableau 2 : Marqueurs lexicaux français (nouveaux, au-delà du point de départ)

**Avertissement important :** Contrairement aux marqueurs anglais, **il n'existe à ce jour aucune étude quantitative sur corpus comparant les fréquences lexicales du français LLM vs français humain**. Tous les marqueurs ci-dessous proviennent d'observations de praticiens francophones, confirmées par recoupement de 3 à 5 sources indépendantes. [Confiance : moyenne]

|Mot / Expression FR|Catégorie|Sources (min. 2 indépendantes)|
|---|---|---|
|**crucial**|Adjectif n°1 identifié|Digitad.ca, Redacteur.com, Blog du Modérateur, Daria Viktorova (Substack), Flint.media|
|**essentiel**|Adjectif|Digitad.ca, Redacteur.com|
|**fondamental**|Adjectif|Digitad.ca, Redacteur.com|
|**captivant** / **fascinant** / **passionnant**|Adjectifs d'enthousiasme|Daria Viktorova, Flint.media|
|**révolutionnaire**|Adjectif tech/innovation|Daria Viktorova|
|**transformateur**|Calque de « transformative »|Daria Viktorova|
|**permettre (de)**|Verbe passe-partout|Daria Viktorova, Digitad.ca|
|**optimiser les processus**|Expression business|Digitad.ca|
|**mettre en place** / **mettre en œuvre**|Verbes génériques|Daria Viktorova|
|**répondre aux besoins**|Expression formulaïque|Digitad.ca|
|**dans le monde actuel**|Ouverture cliché|Digitad.ca|
|**dans cette optique** / **dans ce cadre**|Connecteurs vagues|Digitad.ca, Daria Viktorova|
|**à l'ère de** / **à l'heure de**|Ouverture cliché|Flint.media (GenerationIA)|
|**il est essentiel de** / **il est impératif**|Hedging impersonnel|Alexia (Substack), Flint.media|
|**non seulement… mais aussi…**|Structure binomiale en boucle|Alexia (Substack), Daria Viktorova|
|**n'oubliez pas que**|Ton didactique|Alexia (Substack)|
|**plonger dans** / **naviguer** / **s'embarquer**|Métaphores génériques (calques EN)|Alexia (Substack)|
|**en outre**|Connecteur n°1 surreprésenté|Yiaho.com, Alexia, Daria Viktorova, Digitad.ca|
|**par ailleurs**|Connecteur n°2|Multiples sources|
|**de plus** / **néanmoins** / **cependant**|Connecteurs formels|Yiaho.com, Daria Viktorova|
|**par conséquent** / **en résumé** / **en somme**|Connecteurs de conclusion|Daria Viktorova, Flint.media|
|**d'une part… par ailleurs… en somme…**|Cadre tripartite prévisible|Daria Viktorova|

**Biais anglophone dans le français LLM :** Rigouts Terryn & de Lhoneux (HumEval Workshop @ LREC-COLING 2024, Torino) ont quantifié que **16 % de toutes les erreurs/particularités linguistiques annotées dans du texte français LLM ont un lien clair avec l'anglais**. Corpus : 550 textes (GPT-4, Zephyr, GEITje). Phénomènes spécifiques : calques littéraux (« faire du sens » ← _make sense_), virgule Oxford avant « et » (violation des règles typographiques françaises), tirets cadratins à l'américaine. [Confiance : élevée — workshop LREC-COLING, évalué par les pairs]

### Tableau 3 : Marqueurs syntaxiques et structurels

|Pattern|Description|Comment détecter|Source|Confiance|
|---|---|---|---|---|
|**Propositions participiales présentes ×2-5**|Les LLM instruction-tuned utilisent les participes présents à 2-5× le taux humain (GPT-4o : 5,3×)|Compter les formes en _-ing_ (EN) ou participes présents (FR) par phrase|Reinhart et al. 2025, _PNAS_|Élevée|
|**Nominalisations ×1,5-2**|Densité de noms abstraits dérivés de verbes/adjectifs|Compter les suffixes -tion, -ment, -ness, -ity (EN)|Reinhart et al. 2025, _PNAS_|Élevée|
|**Voix passive agentive ÷2**|GPT-4o utilise la voix passive agentive à ~0,5× le taux humain|Identifier les constructions passives avec complément d'agent|Reinhart et al. 2025, _PNAS_|Élevée|
|**Uniformité de longueur de phrase**|Distribution plus étroite, concentrée sur 10-30 tokens ; variance significativement plus faible que le texte humain|Calculer l'écart-type des longueurs de phrases ; faible variance = probable LLM|Muñoz-Ortiz et al. 2024, _AI Review_|Élevée|
|**Burstiness faible**|Variation réduite des patterns d'écriture à travers le document|Mesurer la variance des perplexités phrase par phrase ; faible burstiness = probable LLM|GPTZero (métrique fondatrice) ; confirmé par analyses empiriques multiples|Élevée|
|**Perplexité basse**|Texte LLM plus prévisible pour un modèle de référence|Calculer la perplexité via un modèle de référence ; texte humain typiquement >85 (seuil GPTZero)|Mitchell et al. (DetectGPT, ICML 2023) ; GLTR (Gehrmann et al., ACL 2019)|Élevée|
|**Entropie de probabilité token basse**|Les tokens occupent les régions à haute probabilité du modèle|GLTR : visualiser la proportion de tokens dans le top-10/top-100|Gehrmann, Strobelt & Rush 2019, ACL|Élevée|
|**Uniformité de longueur de paragraphe**|Paragraphes de longueur similaire (~3 phrases), structure intro-corps-conclusion à chaque paragraphe|Mesurer la variance de longueur des paragraphes|Pangram Labs 2025 ; observations convergentes|Moyenne|
|**Ouvertures formulaïques de paragraphe**|Chaque paragraphe commence par un connecteur formel (« Furthermore », « Moreover », « Additionally »)|Vérifier si >30 % des phrases commencent par les 3 mêmes transitions|Framework VERMILLION (ResearchLeap, 2025)|Moyenne|
|**Tirets cadratins excessifs (—)**|Surreprésentation des em dashes, sous-représentation des points-virgules|Compter les occurrences par 1000 mots|Pangram Labs 2025 ; Goedecke 2025 ; observations multiples|Moyenne|
|**Zéro erreurs grammaticales**|Absence totale de coquilles, erreurs d'accord — perfection suspecte|Vérifier l'absence totale d'imperfections sur un texte long|Compilatio.net ; observations praticiens FR|Moyenne|
|**« Nivellement de registre »**|Le même style dense et informatif persiste indépendamment du genre demandé (académique, conversationnel, journalistique)|Comparer le style réel au genre demandé|Reinhart et al. 2025, _PNAS_ ; Muñoz-Ortiz et al. 2024|Élevée|
|**Diversité lexicale réduite (MTLD, entropie)**|MTLD et entropie de Shannon plus faibles que le texte humain (sauf GPT-4+)|Calculer le MTLD (seuil 0,72) et H = −Σ p(w) log₂ p(w) ; comparer aux baselines humaines du domaine|Muñoz-Ortiz et al. 2024, _AI Review_ ; Martínez et al. 2024, _ACM TIST_ ; Springer _AI and Ethics_ 2025|Élevée (GPT-3.5, open-source) ; Moyenne (GPT-4+)|
|**Signatures _n-grams_ d'ordre élevé**|Distribution de _n-grams_ (4+) significativement différente entre humain et LLM|Distance en variation totale sur les distributions de _n-grams_ (4-6)|DNA-GPT, Yang et al. 2024, ICLR|Élevée|

**Spécificités françaises :** Le participe présent en fin de phrase est documenté comme un tic massif de ChatGPT en français (Blog du Modérateur). La virgule Oxford avant « et » (convention anglaise) et les tirets cadratins à l'américaine sont des marqueurs typographiques distinctifs en français, absents de l'écriture humaine native. La structure « dissertation » systématique (introduction → développement tripartite → conclusion solennelle) est le pattern structural le plus reporté par les praticiens francophones. [Confiance : moyenne — observations convergentes, pas d'étude quantitative sur corpus français]

### Tableau 4 : Marqueurs de registre et de ton

|Caractéristique|Manifestation typique|Source|Confiance|
|---|---|---|---|
|**Style dense en noms, pauvre en verbes d'action**|« The implementation of the optimization of the process » plutôt que « We optimized the process »|Reinhart et al. 2025, _PNAS_ : « instruction tuning trains models in a particular informationally dense, noun-heavy style »|Élevée|
|**Ton excessivement neutre / diplomatique**|Absence de position tranchée, balance systématique des points de vue, évitement de la critique|Pangram Labs 2025 ; Muñoz-Ortiz et al. 2024 (_AI Review_)|Élevée|
|**Émotion positive dominante**|Réduction des émotions négatives (peur, dégoût) ; ton « peoplisant » et enthousiaste|Muñoz-Ortiz et al. 2024 : « LLMs are neutral by default and lack emotional expression »|Élevée|
|**Sous-utilisation du hedging épistémique**|Paradoxalement, les LLM utilisent _moins_ de vrais hedges et self-mentions que les humains dans la génération originale|Jiang & Hyland 2025, _English for Specific Purposes_ ; Yao & Liu 2025, _Journal of Pragmatics_|Élevée|
|**Méta-commentaire formulaïque**|« It's important to note », « It's worth mentioning » — pas du vrai hedging mais de la glose procédurale|Observation convergente multiples praticiens|Moyenne|
|**Absence d'anecdotes personnelles**|Pas de première personne vécue, pas d'exemples tirés de l'expérience|Digitad.ca ; Lucide.ai ; consensus communautaire|Moyenne|
|**Sur-explication**|Réponses excessivement détaillées même pour des questions simples|Yiaho.com : « trop scolaire »|Moyenne|
|**Absence de vocabulaire rare/argotique**|Pas d'argot, pas de vocabulaire littéraire véritablement rare|Projet-Voltaire.fr|Moyenne|
|**Ton bureaucratique en français**|Le français LLM sonne comme un rapport institutionnel là où l'anglais LLM est plutôt « corporate casual »|Daria Viktorova (Substack, juillet 2025)|Moyenne|
|**Clichés d'importance universelle**|« marking a pivotal moment », « represented a significant shift » — gonflement de l'importance|Wikipedia:Signs of AI writing|Moyenne|

**Différences inter-domaines :** Liang et al. (2025, _Patterns_, Cell Press) mesurent la pénétration LLM par secteur : **~24 %** des communiqués de presse corporate, **~18 %** des plaintes de consommateurs financiers, **~10 %** des offres d'emploi. Kobak et al. (2025) documentent des variations majeures entre sous-corpus académiques : les revues MDPI atteignent Δ = 0,21, Frontiers Δ = 0,20, Cureus Δ = 0,25, tandis que Nature/Science/Cell restent proches du baseline (~0,04). La Chine, la Corée du Sud et Taïwan atteignent Δ ≈ 0,20 contre ~0,05 pour le Royaume-Uni et l'Australie. [Confiance : élevée — deux études évaluées par les pairs]

---

## Section C — Outils et métriques de détection

|Outil|Méthode principale|Métriques|Fiabilité (indépendante)|Limites connues|Support FR|Source clé|
|---|---|---|---|---|---|---|
|**GPTZero**|Deep learning multi-facteurs (initialement perplexité + burstiness)|Perplexité, burstiness, classificateur DL, analyse phrase par phrase|Howard et al. (JCO, 2024) : 99,5 % sur IA pure, 0 % FP. Weber-Wulff et al. (2023) : <80 %. Cybernews 2025 : faux positifs « alarmants ». Estimation réaliste : **70-80 %**|Faux positifs sur écriture formelle ; performances dégradées sur textes courts et mixtes|✅ Oui (fin 2024)|Weber-Wulff et al. 2023, _Int. J. Educ. Integrity_|
|**Originality.ai**|Classificateur ML propriétaire entraîné sur sorties multi-LLM|Scoring ML propriétaire|**RAID Benchmark (ACL 2024)** : meilleur détecteur commercial, 85 % moyen (11 modèles), 98,2 % sur ChatGPT. Walters et al. : top-3|Payant ; vulnérable au contournement par homoglyphes ; ~5 % FPR dans certains tests|✅ Multi-langue|Dugan et al. 2024, RAID, ACL|
|**ZeroGPT**|« DeepAnalyse » — détails non publiés|Propriétaire, non documenté|Évaluations indépendantes : **35-65 %** de précision. Tests NoteGPT : ~35 % de faux soupçons. Résultats incohérents entre scans|Aucune documentation technique ; résultats variables d'un scan à l'autre ; haute fréquence de FP ; contournable par simple prompting|✅ Revendiqué (20+ langues)|Évaluations indépendantes multiples|
|**Turnitin AI**|Analyse de séquences de probabilité du mot suivant, classificateur séparé de la détection de plagiat|Probabilité next-word, patterns statistiques|Weber-Wulff et al. (2023) : **meilleur score** parmi 14 outils. Temple Univ. : 93 % sur texte humain. Mais : précision tombe à **20-63 %** sur texte paraphrasé|Minimum 300 mots ; très faible sur contenu hybride humain/IA ; marge d'erreur ±15 points ; accès institutionnel uniquement|⚠️ Limité (surtout EN)|Weber-Wulff et al. 2023|
|**Sapling**|Classificateur transformer multi-LLM + perplexité phrase par phrase|Scoring par token/phrase, perplexité|Texas A&M : 100 % IA détectée, mais **90 % FP sur texte humain**. Gold Penguin : 87 % TP, 94 % test FP|Taux de faux positifs très élevé sur texte humain ; anglais uniquement ; facilement contourné par outils humanisateurs (0 % après traitement)|❌ Non|Texas A&M (INSTARS)|
|**Copyleaks**|Empreinte linguistique multi-technique|Analyse de patterns linguistiques propriétaire|PMC/NIH : 100 % sur texte humain, 99,7 % sur DeepThink. Walters et al. : top-3|Contourné par paraphrase QuillBot ; ~5 % FPR estimé|✅ Oui (30+ langues)|Walters et al. ; PMC|
|**Binoculars**|Zero-shot : ratio perplexité/perplexité croisée entre 2 LLM (Falcon-7B)|Ratio de perplexité (métrique nouvelle)|**RAID (ACL 2024) : meilleur score global**, >90 % TPR à 0,01 % FPR sans entraînement sur ChatGPT|Faible rappel en langues à faibles ressources ; boîte noire ; « à fins académiques uniquement »|⚠️ Partiel (baisse en non-EN)|Hans et al. 2024, ICML|
|**DetectGPT**|Courbure de probabilité (zero-shot) — le texte LLM occupe des régions de courbure négative|Log-probabilité + perturbations (T5)|AUROC 0,95 sur GPT-NeoX fake news|Coûteux (~100 perturbations/passage) ; performances dégradées sur textes courts|❌ Non documenté|Mitchell et al. 2023, ICML|
|**Fast-DetectGPT**|Courbure de probabilité conditionnelle|Vraisemblance + entropie|Amélioration ~75 % AUROC vs DetectGPT ; **340× plus rapide**|Mêmes limites que DetectGPT, réduites|❌ Non documenté|Bao et al. 2024, ICLR|
|**OpenAI Classifier**|Classificateur fine-tuné sur paires humain/IA (ABANDONNÉ juil. 2023)|Scoring par classificateur|Seulement **26 % TP**, 9 % FP — OpenAI a reconnu « low rate of accuracy »|Abandonné < 6 mois après lancement. Si le créateur de ChatGPT ne peut pas détecter sa propre sortie de manière fiable, les implications sont considérables|—|OpenAI blog officiel|

**Le biais contre les non-natifs** est le problème le plus grave documenté. Liang et al. (Stanford, _Patterns_, juillet 2023) montrent un **taux de faux positifs moyen de 61,22 %** sur 91 essais TOEFL (non-natifs anglophones) testés sur 7 détecteurs, contre une précision quasi parfaite sur les essais d'élèves natifs américains. **89 sur 91** essais TOEFL ont été signalés par au moins un détecteur. Common Sense Media (2024) rapporte un FPR de **20 %** pour les étudiants noirs, 10 % pour les latinos, 7 % pour les blancs. [Confiance : élevée — _Patterns_ est évalué par les pairs]

**GLTR** (Gehrmann, Strobelt & Rush, ACL 2019) reste conceptuellement fondamental : en visualisant si chaque mot est dans le top-10 (vert), top-100 (jaune), top-1000 (rouge) ou au-delà (violet) des prédictions du modèle, l'outil a **amélioré la détection humaine de 54 % à 72 %** sans formation préalable. Le texte IA est « principalement vert et jaune » — le texte humain contient bien plus de « rouge et violet ». [Confiance : élevée — ACL, évalué par les pairs]

**La diversité lexicale dans les classificateurs académiques.** Si aucun détecteur commercial ne documente explicitement l'usage du TTR ou du MTLD, ces métriques jouent un rôle central dans les classificateurs ML de recherche. La tâche partagée AuTexTification (CEUR-WS, SEPLN 2023) inclut explicitement log-TTR, root-TTR, MTLD et HD-D parmi 74 _features_ stylométriques. Uchendu et al. (arXiv:2308.07305) montrent via analyse SHAP que le MTTR et les _hapax legomena_ sont les _features_ les plus importantes pour l'attribution de texte à un LLM spécifique. DNA-GPT (Yang et al., ICLR 2024) démontre que les _n-grams_ d'ordre élevé (≥4) atteignent un AUROC de 97 %, et Ghostbuster (Verma et al., NAACL 2024) combine unigrammes, trigrammes et probabilités LM pour un F1 de 99,0. La dimension intrinsèque des embeddings (Tulchinskii et al., NeurIPS 2023) fournit un signal complémentaire : le texte humain occupe un espace de dimension ~9 contre ~7,5 pour le texte IA. Ces résultats suggèrent que l'avenir de la détection réside dans l'**intégration de multiples dimensions statistiques** plutôt que dans l'exploitation d'un seul marqueur.

### Recherche française en détection IA

L'écosystème académique français est actif mais jeune. Le projet **MOSAIC** (Dubois, Yvon, Piantanida — Sorbonne/CNRS-ISIR, CentraleSupélec, Mila-Québec) propose une méthode d'ensemble non supervisée multilingue incluant le français, publiée aux Findings d'ACL 2025. Le **GdR IASIS du CNRS** a créé un groupe de travail spécifique « Détection de Contenus Générés » co-dirigé par Jan Butora (CRIStAL, Lille) et Eva Giboulot (INRIA/IRISA, Rennes). La startup **Label4.ai**, issue d'INRIA Rennes et CNRS Lille (avec Teddy Furon, expert mondial en tatouage numérique), a levé 1 M€ en juillet 2025 pour le traçage de contenu IA. Les travaux de **Cabanac et Labbé** (IRIT, Toulouse) sur les « tortured phrases » dans les articles scientifiques (détection de « conscience contrefaite » pour « intelligence artificielle ») sont publiés depuis 2021 et ont été couverts par _Nature_. [Confiance : élevée — sources institutionnelles vérifiées]

---

## Section D — Contre-mesures rédactionnelles

Cette checklist s'adresse au workflow décrit par l'utilisateur : l'humain rédige, l'IA intervient sur la forme. L'objectif est de maintenir un texte authentiquement humain après intervention IA — pas d'évasion de détection académique.

### Niveau mot

**Substitution systématique des marqueurs connus.** Remplacer les tokens surreprésentés par des synonymes courants mais non marqués. _Crucial_ → important, capital, déterminant (en FR) ; _showcasing_ → showing, demonstrating (en EN). Construire et maintenir une liste de mots bannis dans les instructions système (system prompt). La liste enrichie des Tableaux 1-2 ci-dessus est un point de départ directement utilisable.

**Utilisation des contractions.** Les LLM favorisent les formes longues (« it is », « do not », « cannot ») — utiliser systématiquement les contractions en anglais (« it's », « don't », « can't ») après relecture IA. En français, préférer les tournures orales aux constructions impersonnelles.

**Vocabulaire spécifique au domaine.** Remplacer le vocabulaire générique LLM par le jargon précis du domaine technique. Au lieu de « in the realm of web development », écrire le terme technique exact. Les LLM utilisent des termes vagues pour couvrir le maximum de cas (Wikipedia : « the most statistically likely result that applies to the widest variety of cases »).

**Élimination des filler phrases.** Supprimer systématiquement : « It's important to note that », « il convient de souligner que », « dans un monde en constante évolution ». Pangram Labs (2024) documente que « complex and multifaceted » apparaît **700×** plus souvent dans l'écriture IA — ces expressions sont des signaux d'alerte.

### Niveau phrase

**Varier radicalement la longueur des phrases.** C'est la contre-mesure la plus efficace au niveau phrase. Les LLM produisent des phrases de longueur uniforme (10-30 tokens). Alterner délibérément des phrases très courtes (3-5 mots) avec des phrases longues et complexes (25+ mots). C'est la définition même de la « burstiness » que les détecteurs mesurent.

**Casser la monotonie SVO.** Commencer des phrases par des subordonnées, utiliser des inversions, des fragments. Commencer par « And » ou « But » en anglais — les LLM évitent systématiquement cette construction informelle. En français, utiliser des phrases nominales ou des fragments stylistiques.

**Inclure des questions rhétoriques.** Les LLM génèrent rarement des questions sauf si explicitement demandé. Une question intégrée naturellement dans un paragraphe est un signal fort d'écriture humaine (Jiang & Hyland, 2025, _English for Specific Purposes_).

**Réduire drastiquement les connecteurs logiques.** Si chaque paragraphe commence par « Furthermore », « Moreover » ou « En outre », le signal LLM est maximal. Le framework VERMILLION recommande de signaler tout document où >30 % des phrases commencent par les 3 mêmes transitions. Préférer les transitions implicites (enchaînement logique naturel) aux connecteurs explicites.

**Maîtriser la ponctuation.** Réduire les tirets cadratins (le « tiret ChatGPT »), réintroduire des points-virgules, des parenthèses, des deux-points. En français : supprimer les virgules Oxford et vérifier la typographie française (espaces insécables, guillemets français).

### Niveau paragraphe

**Varier la longueur des paragraphes.** Alterner des paragraphes d'une phrase avec des blocs de 5-6 phrases. Les LLM produisent des paragraphes uniformes de ~3 phrases. Un paragraphe d'un mot (« Non. ») est un signal humain fort.

**Casser la « règle de trois ».** Wikipedia:Signs of AI writing documente la surreprésentation des structures tripartites (« X, Y, and Z » ; « adjective, adjective, and adjective »). Varier les longueurs de listes : parfois 2 items, parfois 5.

**Inclure des digressions.** Les observations parenthétiques, les apartés tangentiels, les anecdotes qui brisent le flux mécanique sont des marqueurs humains forts. Un LLM ne fait jamais de digression non demandée.

### Niveau document

**Injection de voix personnelle.** Ajouter des anecdotes personnelles, des exemples tirés de l'expérience vécue, des opinions tranchées avec justification. Les LLM ne peuvent pas répliquer vos histoires réelles — c'est la contre-mesure la plus robuste à long terme.

**Opinions et positions affirmées.** Les LLM default vers la neutralité diplomatique. Prendre position, critiquer, exprimer un désaccord argumenté sont des signaux humains forts. Le ton « d'une part… d'autre part » systématique est un marqueur LLM.

**Détails concrets et spécifiques.** Remplacer les généralités (« many experts believe », « in recent years ») par des faits précis avec noms, dates, lieux. Pangram Labs note que les LLM évitent les noms propres et default vers les prénoms les plus courants (60-70 % de « Emily » ou « Sarah »).

**Organisation non linéaire.** Utiliser des _in medias res_, des flashbacks, des structures non chronologiques. Les LLM produisent systématiquement introduction → développement → conclusion.

**Imperfection délibérée.** Un texte trop poli est suspect. Les légères informalités, les fragments stylistiques, les contractions, le registre familier ponctuel sont des signaux d'authenticité. Comme le note Tech Brew (janvier 2026) : « Les gens veulent utiliser l'IA pour écrire, mais ne veulent pas que ça sonne comme ce que c'est. La tension entre ces deux objectifs reste difficile à résoudre. »

### Limites des contre-mesures face aux détecteurs multi-features

Les contre-mesures ci-dessus ciblent principalement les marqueurs individuels (mots, syntaxe, structure). Or les détecteurs les plus performants combinent diversité lexicale, _n-grams_ d'ordre élevé, perplexité et burstiness dans des classificateurs multi-_features_ (Ghostbuster, classifieurs stylométriques XGBoost). Corriger un signal peut en exposer un autre : augmenter la diversité lexicale par substitution synonymique peut créer des collocations inhabituelles détectables par analyse de _n-grams_. Dubois, Yvon & Piantanida (EMNLP 2025) montrent néanmoins que des ajustements mineurs des paramètres de décodage (température, top-p) peuvent faire chuter l'AUROC de quasi-parfait à aussi bas que 1 % — soulignant la fragilité intrinsèque de tout détecteur face à la manipulation de la génération. La recommandation reste inchangée : l'édition humaine substantielle et la transparence sur l'usage de l'IA restent les stratégies les plus robustes.

### Niveau system prompt / instructions projet

Les tests montrent que les instructions personnalisées **réduisent** les marqueurs mais **ne les éliminent pas**. Pangram Labs (décembre 2024) a testé tous les styles d'écriture de Claude (Normal, Concis, Explicatif, Formel) avec des styles personnalisés basés sur de vrais articles de blog — le texte reste « clairement identifiable comme IA ». Les instructions les plus efficaces combinent : spécification de la variation de longueur des phrases, interdiction de mots marqueurs spécifiques, demande de ton conversationnel, et insertion d'exemples d'expérience personnelle. Mais le consensus des praticiens est que **l'édition humaine reste indispensable** — les prompts seuls ne suffisent pas. [Confiance : moyenne-élevée]

---

## La détection IA est-elle un problème résoluble ?

Le débat est tranché sur le plan théorique mais ouvert sur le plan pratique. Sadasivan et al. (2023) démontrent mathématiquement que pour un modèle suffisamment performant, la détection tend vers le hasard. Mais les détecteurs actuels fonctionnent encore sur le texte brut non édité — Binoculars atteint >90 % TPR à 0,01 % FPR dans le benchmark RAID (ACL 2024). Le consensus émergent converge vers trois principes : **(1)** aucun détecteur ne doit servir de preuve unique pour des décisions à forts enjeux ; **(2)** la détection fonctionne mieux sur la sortie brute que sur le texte révisé ; **(3)** l'avenir est à la **provenance** (signatures numériques C2PA, SynthID) plutôt qu'à la détection a posteriori. Google, dans sa Helpful Content Update intégrée au core ranking en mars 2024, ne pénalise pas le contenu IA _per se_ mais le contenu « non utile » — une distinction cruciale pour les rédacteurs assistés par IA qui produisent un contenu à réelle valeur ajoutée.

Les éditeurs académiques majeurs convergent : **Science** interdit totalement le texte IA (traité comme fraude scientifique) ; **Nature** autorise l'aide à la rédaction avec déclaration ; **ACM** et **IEEE** exigent une divulgation complète. **Medium** interdit le contenu IA dans son programme de rémunération. **Stack Overflow** bannit le contenu généré par IA. La tendance est à la transparence obligatoire plutôt qu'à l'interdiction totale.

Pour un développeur web freelance utilisant l'IA comme assistant éditorial avec relecture humaine systématique, le risque de détection est faible si les contre-mesures ci-dessus sont appliquées — mais la transparence reste la stratégie la plus robuste à long terme. Le jeu du chat et de la souris entre marqueurs et contre-mesures continuera ; les listes de mots bannis devront être régulièrement mises à jour à mesure que les modèles évoluent et que de nouveaux tics émergent.