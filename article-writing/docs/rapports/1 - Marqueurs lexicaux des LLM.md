# Marqueurs lexicaux des LLM : inventaire quantitatif et dynamique de détection

**Les textes générés par LLM portent une empreinte lexicale statistiquement mesurable**, désormais documentée par au moins cinq études quantitatives majeures à grande échelle. L'étude de référence — Kobak et al. (2025) dans _Science Advances_ — identifie **379 mots de style surreprésentés** dans les abstracts PubMed de 2024, estimant qu'au minimum **13,5 % des publications biomédicales** de cette année ont été traitées par LLM. Ce phénomène dépasse en ampleur l'impact linguistique de la pandémie de COVID-19 sur le vocabulaire scientifique. Pour le français, les données quantitatives restent quasi inexistantes : aucune étude comparable n'a été publiée, bien que des observations convergentes de praticiens francophones documentent un phénomène analogue, caractérisé par un registre excessivement formel et un « accent anglais » syntaxique.

---

## Section 1 — Inventaire lexical enrichi (anglais)

Les données ci-dessous proviennent de cinq études principales : Kobak, González-Márquez, Horvát & Lause (2025, _Science Advances_) sur 15,1 millions d'abstracts PubMed ; Gray (2024, arXiv:2403.16887) sur ~5 millions d'articles via Dimensions ; Liang et al. (2025, _Nature Human Behaviour_) sur 1,12 million de preprints ; Matsui (2025, _Perspectives on Medical Education_) sur 26,4 millions d'entrées PubMed ; et les données du scanner de vocabulaire IA de GPTZero (2024).

### Mots individuels avec données quantitatives précises

|Mot/Expression|Catégorie linguistique|Données quantitatives|Corpus source|Source académique|Preuve|
|---|---|---|---|---|---|
|**underscores**|Verbe d'emphase|Ratio r = **13,8×** (fréquence observée/attendue 2024)|PubMed 15,1M abstracts|Kobak et al., _Science Advances_ 11(27), 2025|🟢|
|**showcasing**|Verbe promotionnel|Ratio r = **10,7×** ; **20×** surreprésentation IA|PubMed + arXiv CS|Kobak et al. 2025 ; Liang et al. _Nature Human Behaviour_ 2025 ; GPTZero 2024|🟢|
|**potential**|Hedging / possibilité|Écart de fréquence δ = **0,052** (plus grand écart absolu de 2024)|PubMed 15,1M|Kobak et al. 2025|🟢|
|**findings**|Nominalisation|δ = **0,041**|PubMed 15,1M|Kobak et al. 2025|🟢|
|**crucial**|Intensifier évaluatif|δ = **0,037**|PubMed 15,1M|Kobak et al. 2025|🟢|
|**intricate**|Adjectif évaluatif|**+117 %** entre 2022 et 2023 ; top-4 par log odds ratio|Dimensions ~5M articles + arXiv CS|Gray 2024 ; Liang et al. 2025|🟢|
|**groundbreaking**|Adjectif hyperbolique|**+52 %** entre 2022 et 2023|Dimensions|Gray 2024|🟢|
|**outwith**|Préposition (écossais)|**+185 %** entre 2022 et 2023|Dimensions|Gray 2024|🟢|
|**innovative**|Adjectif promotionnel|Accélération marquée en 2023 ; parmi les top adjectifs dans les peer reviews post-ChatGPT|Dimensions + reviews ICLR/NeurIPS|Gray 2024 ; Liang et al. ICML 2024|🟢|
|**versatile**|Adjectif évaluatif|Accélération en 2023, confirmé indépendamment|Dimensions + reviews IA|Gray 2024 ; Liang et al. ICML 2024|🟢|
|**innovatively**|Adverbe|**~+60 %** entre 2022 et 2023|Dimensions|Gray 2024|🟢|
|**methodically**|Adverbe|**+26 %** entre 2022 et 2023|Dimensions|Gray 2024|🟢|
|**comprehensive**|Adjectif de portée|Membre du set de 10 mots communs excédentaires (Δ_common = 0,134)|PubMed 15,1M|Kobak et al. 2025|🟢|
|**notably**|Marqueur discursif|Membre du set des 10 mots communs excédentaires|PubMed 15,1M|Kobak et al. 2025|🟢|
|**enhancing**|Verbe amélioratif|Membre du set des 10 mots communs excédentaires|PubMed 15,1M|Kobak et al. 2025|🟢|
|**additionally**|Connecteur discursif|Membre du set des 10 mots communs excédentaires|PubMed 15,1M|Kobak et al. 2025|🟢|
|**exhibited**|Verbe formel|Membre du set des 10 mots communs excédentaires|PubMed 15,1M|Kobak et al. 2025|🟢|
|**insights**|Nominalisation|Membre du set des 10 mots communs excédentaires|PubMed 15,1M|Kobak et al. 2025|🟢|
|**particularly**|Adverbe intensifier|Membre du set des 10 mots communs excédentaires|PubMed 15,1M|Kobak et al. 2025|🟢|
|**boast**|Verbe promotionnel|Z-score modifié ≥ 3,5 en 2024 (p < 0,001 pour le groupe)|PubMed 26,4M|Matsui, _Perspectives on Medical Education_ 14(1), 2025|🟢|
|**bolster**|Verbe amélioratif|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**unwavering**|Adjectif intensifier|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**transformative**|Adjectif promotionnel|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**elevate**|Verbe amélioratif|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**embark**|Verbe métaphorique|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**testament**|Nom évaluatif|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**mitigate**|Verbe de hedging|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**navigate**|Verbe métaphorique|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**foster**|Verbe amélioratif|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**streamline**|Verbe d'efficience|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**holistic**|Adjectif de portée|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**imperative**|Adjectif d'urgence|Z-score modifié ≥ 3,5|PubMed 26,4M|Matsui 2025|🟢|
|**remarked**|Verbe de parole|**18×** surreprésentation IA|Documents IA vs humains|GPTZero AI Vocabulary Scanner, 2024|🟡|
|**aligns**|Verbe corporatif|**16×** surreprésentation IA|Documents IA vs humains|GPTZero 2024|🟡|
|**surpassing**|Verbe comparatif|**12×** surreprésentation IA|Documents IA vs humains|GPTZero 2024|🟡|
|**tragically**|Adverbe émotionnel|**11×** surreprésentation IA|Documents IA vs humains|GPTZero 2024|🟡|
|**impacting**|Verbe (forme spécifique)|**11×** surreprésentation IA|Documents IA vs humains|GPTZero 2024|🟡|

### Expressions et syntagmes avec données quantitatives

|Expression|Catégorie|Données quantitatives|Source|Preuve|
|---|---|---|---|---|
|**"plays a crucial/significant role in shaping"**|Formule évaluative|**182×** surreprésentation IA|GPTZero 2024 (Forbes)|🟡|
|**"notable works include"**|Formule biographique|**120×**|GPTZero 2024|🟡|
|**"today's fast-paced world"**|Formule d'ouverture clichée|**107×**|GPTZero 2024|🟡|
|**"aims to explore/enhance"**|Formule d'introduction|**50×+**|GPTZero 2024|🟡|
|Co-occurrence de ≥2 mots parmi {intricate, meticulous, meticulously, commendable}|Combinaison marqueurs|**+468 %** en 2023|Gray 2024|🟢|
|**"in the ever-evolving landscape of"**|Formule métaphorique|Universellement citée|Praticiens multiples|🔴|
|**"it's important/worth noting that"**|Hedging formulaïque|Universellement citée|Praticiens + GPTZero|🟡|
|**"navigate the complexities of"**|Métaphore du voyage|Universellement citée|Praticiens multiples|🔴|

### Données structurelles globales

L'étude Kobak et al. fournit le cadre quantitatif le plus solide : sur les 379 mots de style excédentaires identifiés en 2024, **66 % sont des verbes** et **14 % des adjectifs**. L'effet est inégalement distribué géographiquement : les articles de computation en provenance de Chine atteignent un taux estimé de **~40 %** de traitement LLM (Δ = 0,41). Les journaux à accès ouvert comme MDPI et Frontiers montrent des taux nettement supérieurs à la moyenne. Liang et al. confirment indépendamment que **jusqu'à 22,5 % des abstracts CS sur arXiv** et **6,5–16,9 % des peer reviews** dans les conférences IA sont substantiellement modifiés par LLM.

Un phénomène symétrique mérite attention : Matsui (2025) documente des mots en **déclin** post-ChatGPT — "hypothesis," "results suggest," "all patients," "treatment of" — ainsi que les verbes basiques "is" et "are," ce qui suggère que les LLM substituent un vocabulaire plus dense et plus abstrait au langage scientifique concret.

### Taxonomie fonctionnelle des marqueurs

Juzek & Ward (2025, COLING) identifient **21 mots focaux** via un pipeline systématique en trois étapes et attribuent le phénomène au **RLHF** : les annotateurs humains préfèrent inconsciemment les textes utilisant un registre soutenu, créant une boucle de rétroaction. Le survey de Terčon (2025, arXiv:2510.05136) propose une taxonomie linguistique complète des caractéristiques du texte IA, distinguant les niveaux lexical (diversité réduite, nominalisation accrue, moins de pronoms personnels), morpho-syntaxique (plus de relations auxiliaires/copules, plus de déterminants), et phrastique (variation de longueur réduite). Reinhart et al. (2025, _PNAS_) démontrent que **l'instruction tuning — et non l'architecture du modèle — est le facteur causal principal** de ce style distinctif, qui persiste même quand le modèle est invité à écrire de la fiction ou du dialogue informel.

---

## Section 2 — Inventaire lexical enrichi (français)

**⚠ Avertissement méthodologique : aucune étude quantitative publiée ne fournit de ratios de surreprésentation mot par mot pour le français.** Les données ci-dessous reposent sur deux études académiques avec volet français (sans quantification lexicale individuelle), des extrapolations de données anglaises, et des observations convergentes de praticiens francophones. Cette transparence est essentielle : le champ francophone accuse un retard de 2-3 ans sur la recherche anglophone en matière de détection lexicale LLM.

### Études académiques documentant le phénomène en français

Rigouts Terryn & de Lhoneux (2024, HumEval @ LREC-COLING 2024, pp. 12-27) ont comparé ~550 textes journalistiques français humains vs. LLM (GPT-4, Zephyr) et trouvé que **16 % des annotations d'erreurs linguistiques étaient directement liées à un transfert négatif de l'anglais**. 🟢 Les calques documentés incluent « faire du sens » (← "to make sense") et « adresser un problème » (← "to address a problem"). Guo et al. (2024, arXiv:2410.15956, Inria Paris/Apple) mesurent une **divergence lexicale significative** entre sorties LLM et textes humains en français — supérieure à celle observée en anglais — qu'ils qualifient d'« accent anglais » des LLM, manifesté par des structures de phrases calquées sur l'anglais.

### Marqueurs français documentés par observations convergentes

|Mot/Expression|Catégorie|Statut des données|Sources|Preuve|
|---|---|---|---|---|
|**crucial**|Adj. emphatique|Equivalent direct du marqueur anglais documenté (δ = 0,037 en EN)|BDM, Substack Daria, Redacteur.com, Excalibur, Flint.media|🟡|
|**essentiel**|Adj. emphatique|Observé par ≥3 sources FR indépendantes|BDM, TheConversation (Desagulier), pcexpertlemag|🟡|
|**fascinant**|Adj. emphatique|Observé par ≥3 sources FR|Substack Daria, Flint.media, Startups-nation|🟡|
|**incontournable**|Adj. emphatique|Observé FR|Excalibur 2025|🟡|
|**révolutionnaire**|Adj. hyperbolique|Observé FR|Substack Daria, Excalibur|🟡|
|**transformateur**|Adj. promotionnel|Calque de « transformative » (Z ≥ 3,5 en EN)|Substack Daria|🟡|
|**optimiser**|Verbe d'efficience|« Utilisé à toutes les sauces »|Excalibur 2025|🟡|
|**naviguer** (sens figuré)|Verbe métaphorique|Calque de « navigate » (Z ≥ 3,5 en EN) ; observé FR|Excalibur (« naviguer dans le paysage complexe »)|🟡|
|**libérer (le potentiel)**|Verbe promotionnel|Calque de « unlock the potential »|Excalibur|🟡|
|**plonger (dans)**|Verbe d'exploration|Calque de « delve » ; observé FR indépendamment|Excalibur, BDM|🟡|
|**permettre de**|Verbe passe-partout|Suremploi documenté FR|Substack Daria|🟡|
|**en outre**|Connecteur additif|Suremploi FR documenté|BDM, Substack Daria|🟡|
|**néanmoins / cependant**|Connecteurs concessifs|Suremploi FR documenté|Excalibur, BDM, Substack Daria|🟡|
|**par conséquent**|Connecteur conclusif|Suremploi FR documenté|Substack Daria|🟡|
|**il est important de noter que**|Formule introductive|Observé par ≥4 sources FR|BDM, pcexpertlemag, Substack Daria, Excalibur|🟡|
|**dans un monde qui évolue à un rythme effréné**|Formule d'ouverture|Analogue de « today's fast-paced world » (107× en EN)|BDM|🟡|
|**à l'ère de**|Formule d'ouverture|Observé FR|Flint.media|🟡|
|**une riche tapisserie de**|Calque métaphorique|Calque direct de « rich tapestry of »|Excalibur|🟡|
|**faire du sens**|Anglicisme syntaxique|**Documenté académiquement** comme calque LLM|Rigouts Terryn & de Lhoneux 2024 (LREC-COLING)|🟢|
|**adresser un problème**|Anglicisme syntaxique|**Documenté académiquement**|Rigouts Terryn & de Lhoneux 2024|🟢|
|**tiret cadratin (—)**|Ponctuation|Suremploi reconnu par OpenAI, en cours de correction|Sam Altman (X), Lessentiel.lu, Substack Daria, Digitad.ca|🟡|

### Marqueurs structurels spécifiques au français

Au-delà du vocabulaire, les praticiens francophones convergent sur plusieurs traits stylistiques systématiques : la **structure sandwich** (introduction + 3 points développés + conclusion synthétique), l'absence quasi totale d'expressions idiomatiques familières (« ça casse pas trois pattes à un canard » remplacé par des formules plates), l'uniformité de longueur des phrases, le **« lissage moral »** (clauses systématiques d'éthique sur les sujets controversés : « Cependant, il est important de considérer l'éthique... »), et la construction corrélative récurrente « Non seulement X, mais Y ». Le linguiste Guillaume Desagulier (The Conversation France, 2025) documente l'appauvrissement de la diversité lexicale et le recours systématique aux listes à puces.

### Facteurs causaux spécifiques au français

Le biais anglophone des corpus d'entraînement est le facteur explicatif principal : Llama 3.1 utilise **92 % de données anglophones**. Les annotateurs RLHF pour le français sont souvent recrutés dans des pays francophones à bas coût (Madagascar), produisant un français influencé par l'anglais. Le phénomène de « translationese » — textes d'entraînement français souvent traduits de l'anglais — amplifie les calques syntaxiques. La température basse par défaut favorise systématiquement les tokens les plus probables, renforçant les tics lexicaux.

---

## Section 3 — Méthodologie et seuils de détection

### Comment les chercheurs mesurent la surreprésentation

Quatre approches méthodologiques dominent le champ, chacune avec des forces et limites distinctes.

**L'approche « excès de vocabulaire » de Kobak et al.** (la plus rigoureuse à ce jour) s'inspire directement de l'épidémiologie et de la mesure de la surmortalité. Pour chaque mot dans un corpus de 15,1 millions d'abstracts PubMed (2010-2024), deux métriques sont calculées : le **ratio de fréquence** r = p/q (où p = fréquence observée en 2024, q = fréquence contrefactuelle extrapolée linéairement depuis 2021-2022) et l'**écart de fréquence** δ = p − q. Le ratio r amplifie les mots rares dont la fréquence explose (« delves » : r = 28,0), tandis que δ capture les mots courants dont la fréquence augmente en valeur absolue (« potential » : δ = 0,052). Un mot est classé « excédentaire » quand il franchit un seuil combiné sur le plan (r, p) avec p > 10⁻⁴ (soit > 100 usages/an). Les 379 mots identifiés sont ensuite manuellement triés entre mots de contenu (liés aux sujets, ex. COVID) et **mots de style** (marqueurs LLM). Le code source est disponible sur GitHub (berenslab/llm-excess-vocab). 🟢

**L'approche par suivi de mots-clés de Gray** est plus simple et reproductible : elle sélectionne des mots connus pour être disproportionnellement présents dans les sorties LLM, puis suit leur fréquence année par année dans la base Dimensions (~5 millions d'articles). La comparaison se fait contre la variabilité historique 2015-2022. Un changement est considéré significatif quand il excède nettement la plage de variation normale. Gray montre que la combinaison de marqueurs amplifie massivement le signal : les articles contenant ≥2 mots parmi {intricate, meticulous, meticulously, commendable} augmentent de **+468 %** en 2023, un signal impossible à attribuer au hasard. 🟢

**Le modèle de mélange par maximum de vraisemblance de Liang et al.** traite la distribution des fréquences de mots d'un corpus comme un mélange de texte humain et de texte LLM, estimant les proportions par maximum de vraisemblance. Cette approche nécessite un corpus de référence ground-truth (textes humains + textes IA) et utilise le **log odds ratio** pour identifier les mots les plus discriminants. Les quatre mots avec le log odds ratio le plus élevé sont : pivotal, intricate, showcasing, realm. 🟢

**Le Z-score modifié de Matsui** applique une transformation Z-score sur 135 termes potentiellement influencés par l'IA dans 26,4 millions d'entrées PubMed, comparés à 84 phrases contrôles via un modèle linéaire à effets mixtes (p < 0,001). Le seuil retenu est **Z ≥ 3,5**, atteint par 103 des 135 termes testés. La limite de cette méthode est que les termes candidats sont pré-sélectionnés à partir de discussions en ligne, introduisant un biais de sélection potentiel. 🟢

### Méthodes classiques de linguistique de corpus

Les outils traditionnels restent pertinents. Le **log-likelihood ratio** (G², Dunning 1993, Rayson & Garside 2000) compare fréquences observées et attendues entre corpus cible et corpus de référence, avec un seuil standard de G² > 6,63 (p < 0,01) ou G² > 15,13 (p < 0,0001). Il met en évidence les mots communs avec des différences de fréquence. L'**odds ratio** mesure l'ampleur relative de la différence, mettant davantage en lumière les mots rares et spécialisés. Le **log ratio** (Hardie 2014) offre une interprétation intuitive : un log ratio de 1 = mot 2× plus fréquent, log ratio de 2 = 4× plus fréquent. Des outils comme AntConc, quanteda (R) et le package Python `keyness` implémentent ces calculs.

### Seuils pratiques pour la détection

À l'échelle du corpus, Kobak utilise δ > 0,01 (1 point de pourcentage d'excès) comme seuil minimal pour qualifier un mot d'excédentaire. À l'échelle d'un texte individuel, **aucun seuil publié ne définit formellement à partir de quelle densité de marqueurs un texte « sonne IA »**. Cependant, le résultat de Gray sur les combinaisons est le plus opérationnel : la co-occurrence de **2+ marqueurs** dans un même article amplifie le signal de façon dramatique (+468 % pour deux mots, bien au-delà de toute variation naturelle). L'implication pratique est qu'un auteur humain utilisant occasionnellement « crucial » ou « comprehensive » ne sera pas signalé — c'est l'accumulation statistiquement improbable de ces termes qui trahit le traitement LLM.

### Outils de détection et leur utilisation des marqueurs lexicaux

|Outil|Approche|Utilise des features lexicales ?|Accès|
|---|---|---|---|
|**GLTR** (MIT/Harvard, 2019)|Classement de chaque token dans la distribution de prédiction GPT-2 (top-10/100/1000)|Oui — rang du token mot par mot|Open source|
|**Ghostbuster** (UC Berkeley, NAACL 2024)|Probabilités unigrammes/trigrammes combinées via recherche structurée|**Oui explicitement** — unigrammes comme features|Open source|
|**DetectGPT** (Stanford, ICML 2023)|Courbure de la log-probabilité via perturbations|Non directement — opère sur les log-probabilités|Open source|
|**Binoculars** (ICML 2024)|Ratio perplexité/perplexité croisée entre deux LLM|Non — niveau perplexité globale|Open source|
|**GPTZero** (Princeton)|Perplexité + burstiness + 7 composantes propriétaires|Partiellement — signale des mots spécifiques (« dive, » « landscape »)|Commercial|
|**Kobak excess-vocab**|Analyse de fréquence de corpus|**Oui** — fréquence brute par mot|Open source (GitHub + Zenodo)|

Ghostbuster est l'outil le plus directement pertinent pour la détection basée sur la fréquence lexicale : il intègre explicitement un modèle unigramme et atteint **99,0 F1** en domaine, surpassant DetectGPT et GPTZero de 23,7 points F1 en moyenne. GLTR reste l'outil le plus pédagogique pour visualiser le phénomène mot par mot. Binoculars atteint les meilleures performances zero-shot : **>90 % de détection à un taux de faux positifs de 0,01 %**.

---

## Section 4 — Dynamique temporelle et variations inter-modèles

### Les marqueurs précoces déclinent, les marqueurs subtils persistent

L'étude la plus directement pertinente sur la dynamique temporelle est celle de Geng & Trotta (2025, arXiv:2502.09606, SISSA/Imperial College London), qui documente un phénomène de **coévolution humain-LLM** dans l'écriture académique. Les mots les plus ouvertement identifiés comme marqueurs LLM — « delve, » « intricate, » « realm » — ont atteint un pic début 2024, puis **ont commencé à décliner** après que les chercheurs les ont publiquement signalés (mars-avril 2024). En revanche, des mots ChatGPT-favorisés qui se fondent dans le vocabulaire académique naturel — comme « significant, » « additionally, » « comprehensive » — **continuent d'augmenter** car ils sont plus difficiles à identifier isolément comme marqueurs. 🟢

Mak & Walasek (2025, _Computers and Education: AI_) confirment cette dynamique dans le contexte étudiant : analysant 4 820 rapports d'étudiants de 2016 à 2025, ils observent que les marqueurs lexicaux ChatGPT ont **bondi en 2023-2024 puis décliné en 2025**, suggérant une adaptation active des utilisateurs. Le style est néanmoins devenu globalement plus formel, plus nominalisé et plus positif en sentiment — et **les notes n'ont pas augmenté** malgré ces changements lexicaux de surface. 🟢

Certains mots que ChatGPT _défavorise_ subissent aussi un déclin mesurable : « is, » « are, » « therefore, » « hypothesis » perdent en fréquence dans les abstracts PubMed de 2024, confirmant que l'influence LLM opère dans les deux directions. 🟢

### Empreintes distinctes par modèle

Plusieurs études démontrent que les LLM possèdent des signatures lexicales statistiquement distinguables entre eux. McGovern et al. (2024, arXiv:2405.14057) montrent qu'un simple classifieur n-grammes (GradientBoost) atteint un **F1 de 0,936 pour ChatGPT** et **0,920 pour Claude** dans une tâche d'identification multi-classes entre modèles. Ces empreintes sont persistantes au sein des familles de modèles (LLaMA-13b et LLaMA-65b produisent des distributions POS similaires) et **résistent au changement de sujet**. 🟢

Reinhart et al. (2025, _PNAS_ 122(8)) apportent l'explication causale la plus convaincante : **l'instruction tuning est le facteur principal** du style distinctif LLM, pas l'architecture ni la taille du modèle. Les modèles instruits produisent un style caractérisé par une densité informationnelle élevée, davantage de nominalisations, plus de propositions participiales, plus de voix passive — un style qui persiste même quand le prompt demande de la fiction ou du dialogue informel. Les modèles de base (non instruits) diffèrent nettement moins de l'écriture humaine. 🟢

O'Sullivan et al. (2025, _Nature Humanities and Social Sciences Communications_) utilisent le Delta de Burrows sur des nouvelles littéraires et montrent que les textes IA forment des **clusters serrés et uniformes** alors que les textes humains montrent une variation stylistique bien plus grande. GPT-4 montre une **cohérence interne supérieure** à GPT-3.5 (cluster plus compact), ce qui le rend paradoxalement plus détectable par stylométrie. 🟢

### Différences qualitatives entre modèles

Les comparaisons qualitatives entre modèles restent principalement au niveau de l'observation praticienne. Claude est généralement perçu comme produisant un texte plus « littéraire » avec moins de buzzwords ; ChatGPT tend vers plus de formules transitionnelles (« furthermore, » « delve ») et un ton plus conventionnellement enthousiaste ; Gemini favorise la concision et les listes à puces. 🟡 Une étude dans le domaine médical (Krielke et al.) note que Gemini préfère un vocabulaire plus accessible (« blood sugar ») là où ChatGPT utilise le terme technique (« glucose »). 🟡 Cependant, **aucune étude quantitative à grande échelle ne compare directement les vocabulaires surreprésentés de GPT-4, Claude 3/3.5, et Gemini** avec la rigueur des études Kobak ou Gray. [LACUNE DOCUMENTÉE]

### Évolution par version de modèle

Milička, Marklová & Cvrček (2025, arXiv:2509.10179) appliquent le cadre dimensionnel de Biber et montrent que **tous les LLM dévient sur la dimension 1** (impliqué vs. informationnel), produisant un texte plus dense en information — mais l'ampleur de cette déviation **varie significativement par modèle**. 🟢 Les données spécifiques par version (GPT-3.5 → GPT-4 → GPT-4o → GPT-5) restent fragmentaires. GPT-4o (mai 2024) a introduit un tokenizer élargi (~200K vs. ~100K tokens), améliorant la représentation multilingue. OpenAI a reconnu travailler à la correction du tiret cadratin et d'autres tics stylistiques. Mais aucune étude publiée ne documente une réduction quantitative des marqueurs lexicaux entre versions successives de GPT. [INCERTAIN]

### Le problème de fond persiste

Le constat le plus important de Reinhart et al. est structurel : tant que le paradigme d'instruction tuning reste le même, les marqueurs fondamentaux — densité informationnelle élevée, nominalisation, registre formel inadapté, manque de hedging épistémique authentique — **persisteront indépendamment des ajustements cosmétiques** sur des mots spécifiques comme « delve. » Les modèles peuvent apprendre à éviter les mots individuellement signalés, mais le biais stylistique profond créé par le RLHF est un problème architecturalement ancré. Les détecteurs évoluent en conséquence : les outils de prochaine génération se concentrent moins sur des mots spécifiques et davantage sur les distributions de probabilité au niveau des tokens (Binoculars, Fast-DetectGPT) et les patterns structurels, anticipant un jeu du chat et de la souris où les marqueurs lexicaux évidents deviennent obsolètes mais les signatures statistiques profondes demeurent.

---

## Conclusion

Trois constats émergent de cette synthèse. Premièrement, le phénomène est **massif et quantifié** : 379 mots de style excédentaires, ≥13,5 % des publications biomédicales touchées, des ratios de surreprésentation allant de 10× à 182× pour certaines expressions. Deuxièmement, la dynamique est **coévolutive** : les marqueurs les plus visibles déclinent quand ils sont publiquement identifiés, mais des marqueurs plus subtils (mots courants légèrement surreprésentés) prennent le relais et sont plus difficiles à détecter. Troisièmement, le champ francophone présente une **lacune criante** : aucune étude quantitative comparable aux travaux de Kobak, Gray ou Liang n'existe pour le français, malgré des observations convergentes de praticiens documentant un phénomène analogue aggravé par le biais anglophone des corpus d'entraînement. L'explication causale la plus robuste pointe vers le RLHF comme mécanisme amplificateur principal — un problème qui ne se résoudra pas par le simple filtrage de listes de mots, mais qui nécessite des changements dans les méthodologies d'alignement elles-mêmes.