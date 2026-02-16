# Signatures structurelles du texte LLM et caractéristiques de l'écriture humaine organique

Les textes générés par LLM présentent des **signatures structurelles quantifiables et récurrentes** — uniformité de longueur phrastique, prédominance de relations d'Élaboration dans la structure discursive, rigidité des templates organisationnels — que la recherche empirique distingue désormais de l'écriture humaine avec une fiabilité croissante mais non absolue. La burstiness (variabilité de complexité phrastique) reste un signal utile mais insuffisant seul, biaisé contre les locuteurs non natifs. Les modèles récents (GPT-4o, Claude 3.5) sont structurellement moins prévisibles que leurs prédécesseurs, mais conservent des empreintes identifiables — chaque famille de LLM possède une "empreinte stylistique" distincte, confirmée par des études à grande échelle. La littérature francophone sur ce sujet est embryonnaire : aucune étude académique française ne traite spécifiquement des patterns structurels du texte IA en français.

---

## Section 1 — Signatures structurelles documentées

| Pattern structurel                                    | Description                                                                                                                                                                                                                                | Source (auteur, date, type)                                                                                                                | Métrique si disponible                                                                                                                                                             | Niveau de preuve                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Distribution étroite des longueurs de phrase**      | Les LLM produisent des phrases concentrées dans la plage 10-30 tokens, avec variance réduite. Les humains montrent une distribution plus étalée incluant davantage de phrases >40 tokens.                                                  | Muñoz-Ortiz, Gómez-Rodríguez, Vilares — _Artificial Intelligence Review_ 57, 265 (2024) ; arXiv 2308.09067                                 | Histogrammes de distribution de longueur de phrase (tokens/phrase) ; écart moyen humain > écart moyen LLM sur 6 modèles testés                                                     | **Empirique** — étude large-scale, 6 LLM, peer-reviewed       |
| **Prédominance des relations d'Élaboration (RST)**    | Dans l'analyse par Rhetorical Structure Theory, les textes LLM montrent une surreprésentation des relations d'Élaboration, tandis que les textes humains utilisent davantage de relations Joint (ramification discursive plus équilibrée). | « Threads of Subtlety: Detecting Machine-Generated Texts Through Discourse Motifs » — arXiv 2402.10586 (fév. 2024)                         | Fréquence des motifs discursifs extraits d'arbres RST transformés en hypergraphes récursifs ; motif index 0 (Elaboration) = signal machine ; motif index 5 (Joint) = signal humain | **Empirique** — analyse quantitative avec classificateurs     |
| **Perte de cohérence discursive en document long**    | Les LLM segmentent les textes en blocs traités séquentiellement, perdant la cohérence thématique centrale. Les humains maintiennent un fil directeur stable sur l'ensemble du document.                                                    | « Discourse Features Enhance Detection of Document-Level Machine-Generated Content » — arXiv 2412.12679 (déc. 2024)                        | Score DTransformer combinant features PDTB et sémantiques                                                                                                                          | **Empirique** — nouveau dataset (paraLFQA, paraWP)            |
| **Absence de variation de registre selon le genre**   | Les LLM instruction-tuned produisent un style informationnellement dense et nominal quel que soit le genre textuel demandé. Ils ne s'adaptent pas aux conventions de registre (formel vs informel).                                        | Reinhart, Markey et al. (Carnegie Mellon) — _PNAS_ 122(8), e2422455122 (fév. 2025) ; arXiv 2410.16107                                      | Features de Biber (grammaticales et rhétoriques) ; matrice de confusion bloc-diagonale dans classificateur Random Forest                                                           | **Empirique** — PNAS peer-reviewed, deux corpus parallèles    |
| **Complexité syntaxique excessive et nominalisation** | ChatGPT produit des phrases avec une profondeur d'arbre de dépendance supérieure (GPT-3 : 6.18, GPT-4 : 5.94 vs humains : 5.72) et davantage de propositions subordonnées (2.31/2.08 vs 1.81). Usage accru de nominalisations.             | Herbold, Hautli-Janisz et al. — _Scientific Reports_ 13, 18617 (2023) ; arXiv 2304.14276                                                   | Profondeur d'arbre de dépendance (spaCy) ; nombre de propositions subordonnées ; fréquence de nominalisations                                                                      | **Empirique** — Nature Scientific Reports, large-scale corpus |
| **Distribution symétrique du surprisal**              | Le texte IA produit des distributions de surprisal par token plus symétriques (skewness faible). Le texte humain montre une skewness positive (tokens rares, surprenants) et une kurtosis plus élevée (queues lourdes).                    | Framework DivEye — arXiv 2509.18880 (2025)                                                                                                 | Skewness (γ₁) et Kurtosis (γ₂) des distributions de surprisal par token                                                                                                            | **Empirique** — testé sur 12 modèles, 8 domaines              |
| **Template paragraphique tripartite**                 | Les paragraphes IA suivent un schéma rigide : phrase générale/introductive → information utile centrale → phrase de clôture généraliste. Structure identique répétée paragraphe après paragraphe.                                          | Stéphane Torregrosa, Squid-Impact (sept. 2025) ; Pangram Labs, Bradley Emi (avr. 2025) ; Elizabeth Steere, _Inside Higher Ed_ (juil. 2024) | Non formalisé quantitativement                                                                                                                                                     | **Observationnel** — convergence de multiples praticiens      |
| **Ouvertures de paragraphes formulaïques**            | Les paragraphes IA commencent par un ensemble restreint de transitions : « Furthermore », « Moreover », « Overall », « Additionally ». En français : « De surcroît », « En somme », « Tout d'abord… Ensuite… En conclusion ».              | Elizabeth Steere, _Inside Higher Ed_ (juil. 2024) — analyse de 50+ essais IA ; Blog du Modérateur (FR)                                     | Fréquence comparée des connecteurs d'ouverture (humain vs IA)                                                                                                                      | **Empirique** — étude systématique de 50+ essais              |
| **Structure list-like et sous-sections excessives**   | Les LLM insèrent des listes à puces, des sous-titres numérotés et des bullet points dans des genres textuels où les humains n'en utilisent jamais (essai formel, prose argumentative).                                                     | Pangram Labs (avr. 2025) ; Steere (juil. 2024) ; Wikipedia: Signs of AI Writing                                                            | Non formalisé                                                                                                                                                                      | **Observationnel** — multiples praticiens concordants         |
| **Conclusions disproportionnées et répétitives**      | Les conclusions IA sont anormalement longues, commencent par « Overall » / « In conclusion » / « En somme », et restituent mécaniquement le contenu déjà énoncé. Les conclusions humaines sont plus courtes et ajoutent une perspective.   | Pangram Labs (avr. 2025) ; Compilatio (FR)                                                                                                 | Ratio longueur conclusion / longueur corps de texte                                                                                                                                | **Observationnel** — praticiens, non quantifié formellement   |
| **Entrée directe dans le sujet (absence de warm-up)** | Les essais IA abordent immédiatement le sujet. L'écriture humaine utilise des entrées graduelles : anecdotes, définitions, questions rhétoriques avant d'arriver à la thèse.                                                               | Steere, _Inside Higher Ed_ (juil. 2024)                                                                                                    | Non formalisé                                                                                                                                                                      | **Empirique** — comparaison systématique                      |
| **Distances de dépendance sous-optimales**            | Les LLM produisent des distances de dépendance syntaxique moins optimisées que les humains (plus éloignées du minimum théorique), à l'exception de Falcon.                                                                                 | Muñoz-Ortiz et al. (2024)                                                                                                                  | Distance de dépendance moyenne (Mean Dependency Distance)                                                                                                                          | **Empirique**                                                 |
| **Moins de marqueurs épistémiques et modaux**         | Les textes IA contiennent moins de verbes modaux, moins de hedges, et moins de marqueurs de discours que l'écriture humaine — signes d'une argumentation moins nuancée.                                                                    | Herbold et al. (2023) ; Frontiers in Education (2024)                                                                                      | Fréquence des marqueurs de modalité et de discours                                                                                                                                 | **Empirique**                                                 |
| **Persistance de la troisième personne**              | Même sur des questions personnelles ou de type reader-response, l'IA reste en troisième personne et évite le « je ».                                                                                                                       | Steere, _Inside Higher Ed_ (juil. 2024)                                                                                                    | Non formalisé                                                                                                                                                                      | **Empirique** — comparaison systématique                      |
| **Usage excessif du tiret cadratin (em dash)**        | Les LLM surutilisent le tiret cadratin (—) comme élément structurel pour insérer des clauses explicatives ou des pauses dramatiques.                                                                                                       | REM Web Solutions ; Pangram Labs (2025)                                                                                                    | Non formalisé                                                                                                                                                                      | **Observationnel** — source unique corroborée                 |
| **Sous-titres génériques**                            | Les LLM produisent des sous-titres interchangeables suivant des formules récurrentes : « Understanding X », « The Importance of Y », « The Future of Z », « What Is X? », « Key Takeaways ». En français : « Comprendre X », « L'importance de Y », « L'avenir de Z ». Les titres à deux-points (« Digital Marketing in 2025: Trends, Tools, and Tactics ») sont également sur-représentés car le format décrit nettement le sujet — les humains expriment davantage un jugement, une implication ou une tension. | Bouchard, _Towards AI_ (janv. 2026) ; TRO Agency (2025) ; BlueMagnet (2026) | Non formalisé quantitativement | **Observationnel** — convergence de multiples praticiens |
| **Annonces de plan et signposting métatextuel**       | Les LLM surreprésentent le métadiscours interactif (annonces d'objectifs, séquençage, marqueurs endophoriques) : « In this article, we will… », « First… then… finally », « Now that we've explored X… ». Parallèlement, ils sous-représentent le métadiscours interactionnel (hedges, boosters, marqueurs d'attitude). L'IA écrit *sur* l'article plutôt que *sur* le sujet, et ce signposting persiste tout au long du document. En français, l'annonce de plan est une convention académique légitime (« annonce du plan »), rendant ce signal plus ambigu. | Jiang & Hyland, _English for Specific Purposes_ (2025) ; Bouchard, _Towards AI_ (janv. 2026) ; TRO Agency (2025) | Ratio métadiscours interactif / interactionnel (cadre de Hyland 2005) | **Empirique** — publication peer-reviewed ESP, corroborée par praticiens |
| **« Unearned profundity »**                           | Phrases dramatiques sans substance insérées pour créer un effet de profondeur : « Something shifted. », « Everything changed. », « But here's the thing. » Combinées avec des triades percutantes (« Fast, efficient, and reliable. »). | Charlie Guo, _The Field Guide to AI Slop_ (oct. 2025) | Non formalisé | **Observationnel** — source unique mais détaillée |
| **Artefacts de formatage Unicode**                    | Usage de caractères Unicode stylistiques dans des contextes professionnels : flèches (→), signes de multiplication (×), caractères gras Unicode (𝗯𝗼𝗹𝗱), emojis en guise de puces. Atypique de l'écriture humaine professionnelle. | Guo, _The Field Guide to AI Slop_ (oct. 2025) | Non formalisé | **Observationnel** — source unique |
| **Noms fictifs stéréotypés**                          | 60-70% des noms dans les exemples fictifs de ChatGPT et Claude sont « Emily » ou « Sarah ». Les humains puisent dans un répertoire de noms plus divers et souvent culturellement situé. | Pangram Labs (2025) | Fréquence des prénoms dans les exemples fictifs | **Observationnel** — source unique |

### Exemples illustratifs par pattern

Chaque paire ci-dessous est un exemple construit pour démontrer le pattern. La version IA illustre le signal structurel ; la version humaine illustre l'écriture organique correspondante.

**#1 — Distribution étroite des longueurs de phrase**

> *IA :* "Machine learning models require large datasets. These datasets must be carefully curated. Data quality directly impacts model performance. Poor data leads to unreliable predictions. Regular validation helps maintain accuracy."
>
> *Humain :* "You need data — lots of it. But here's the thing most tutorials won't tell you: a small, clean dataset almost always beats a massive, noisy one. I learned this the hard way after spending three weeks scraping Reddit."

> *IA (FR) :* « Les modèles d'apprentissage automatique nécessitent de grands jeux de données. Ces données doivent être soigneusement préparées. La qualité des données impacte directement les performances. »
>
> *Humain (FR) :* « Il faut des données. Beaucoup. Mais pas n'importe lesquelles — un petit dataset propre bat presque toujours un gros dataset bruité. J'ai mis trois semaines à le comprendre. »

**#2 — Prédominance Élaboration RST**

> *IA :* "Transfer learning is a powerful technique. It allows models to leverage knowledge from one task to improve performance on another. This approach is particularly useful when labeled data is scarce. By using pre-trained models, researchers can significantly reduce training time."
>
> *Humain :* "Transfer learning sounds great in theory, but watch out: fine-tuning BERT on 200 medical records gave us worse F1 than training a simple logistic regression from scratch. The domain gap was just too wide."

**#3 — Perte de cohérence en document long**

> *IA (paragraphe 12 d'un article) :* "The system processes input data through multiple layers. Each layer extracts increasingly abstract features." [Sans référence au pipeline custom décrit au paragraphe 3]
>
> *Humain (paragraphe 12) :* "Remember the three-stage pipeline from earlier? This is where stage two — the feature extraction we spent so long debugging — finally pays off."

**#4 — Absence de variation de registre**

> *IA :* "The deployment process involves several critical steps. First, the container image must be built. Subsequently, the orchestration layer must be configured. Finally, monitoring must be established."
>
> *Humain :* "Deployment is straightforward — in theory. Build the image, configure k8s, set up monitoring. In practice? Our first deploy took six hours because someone forgot to set the memory limit. Don't be that person."

**#5 — Complexité syntaxique excessive**

> *IA :* "The implementation of microservices architecture, which has been increasingly adopted by organizations seeking to enhance their scalability and maintainability, necessitates a comprehensive understanding of distributed systems principles."
>
> *Humain :* "Microservices look simple on the whiteboard. Then you deploy them and discover you've traded one monolith for fifty tiny problems that all fail differently."

**#6 — Template paragraphique tripartite**

> *IA :* "Containerization has revolutionized software deployment. By packaging applications with their dependencies, containers ensure consistency across environments. This approach has become essential for modern DevOps practices."
>
> *Humain :* "Containers solve the 'works on my machine' problem. Mostly. You'll still hit edge cases with GPU drivers and filesystem permissions that make you question your career choices."

**#7 — Ouvertures formulaïques**

> *IA :* "In today's rapidly evolving technological landscape, artificial intelligence has emerged as a transformative force that is reshaping industries across the globe."
>
> *Humain :* "Last Tuesday, our image classifier flagged a chihuahua as a blueberry muffin. Again. That's when I decided to rewrite the preprocessing pipeline."

> *IA (FR) :* « Dans le paysage technologique en constante évolution, l'intelligence artificielle s'est imposée comme une force transformatrice. »
>
> *Humain (FR) :* « Mardi dernier, notre classifieur a confondu un chihuahua avec un muffin. Pour la troisième fois. J'ai refait le pipeline. »

**#8 — Structure list-like excessive**

> *IA :* "Key benefits of TypeScript include: 1) Static type checking 2) Better IDE support 3) Improved code maintainability 4) Enhanced refactoring capabilities 5) Better documentation through types."
>
> *Humain :* "TypeScript caught a bug in production code that had been hiding for months — a function expected a string but got undefined. That alone justified the migration. The IDE autocomplete is a nice bonus."

**#9 — Conclusions répétitives**

> *IA :* "In conclusion, as we have seen throughout this article, microservices architecture offers significant advantages in terms of scalability, maintainability, and deployment flexibility. By adopting microservices, organizations can achieve greater agility."
>
> *Humain :* "So: use microservices if your team is big enough to own them independently. Otherwise, a well-structured monolith will serve you better and let you sleep at night."

**#10 — Entrée directe dans le sujet**

> *IA :* "React is a JavaScript library for building user interfaces. It was developed by Facebook and is maintained by Meta. React uses a virtual DOM for efficient rendering."
>
> *Humain :* "I switched our dashboard from jQuery spaghetti to React last quarter. Here's what I wish someone had told me before I started."

**#11 — Persistance de la 3e personne**

> *IA :* "Developers should consider implementing error boundaries in their React applications. When a component throws an error, the error boundary catches it and displays a fallback UI."
>
> *Humain :* "I wrap every route-level component in an error boundary now. I used to skip it, thinking 'my code won't crash.' It does. It always does."

**#12 — Usage excessif du em dash**

> *IA :* "The framework — which was originally designed for mobile applications — has evolved into a comprehensive solution — one that addresses both frontend and backend concerns — making it ideal for full-stack development."
>
> *Humain :* "The framework started as a mobile toolkit. Over time, it grew to cover the full stack. That's both its strength and its biggest source of complexity."

**#13 — Moins de marqueurs épistémiques**

> *IA :* "This approach significantly reduces latency. The results demonstrate clear improvements in throughput. The architecture provides robust fault tolerance."
>
> *Humain :* "We think this cuts latency, though our benchmarks are probably too synthetic to be sure. Throughput looks better, at least in our tests. Fault tolerance? Honestly, we haven't stress-tested it enough to say."

**#14 — Burstiness basse** — La burstiness se manifeste à l'échelle du document entier. Pour l'illustrer, comparer les cinq premières phrases d'un article :

> *IA :* Cinq phrases consécutives de 14, 16, 15, 17, 14 tokens (CV ≈ 0.08).
>
> *Humain :* Cinq phrases de 4, 32, 8, 45, 6 tokens (CV ≈ 0.85). L'alternance entre fragments percutants et développements longs crée le « rythme » organique.

---

## Section 2 — Métriques quantitatives de régularité

### 2.1 Burstiness (variabilité phrastique)

**Définition :** Mesure de la variation des patterns d'écriture et des perplexités par phrase sur l'ensemble d'un document. Une burstiness basse signifie une construction phrastique uniforme (signal IA) ; une burstiness haute signifie une alternance entre phrases simples et complexes (signal humain).

**Implémentation GPTZero (code open-source initial) :**

```
Burstiness = max(perplexité_par_phrase)
Perplexité_moyenne = Σ(perplexité_par_phrase) / N
```

Le modèle de production actuel de GPTZero est plus sophistiqué, intégrant la burstiness comme l'un de **7 composants** de détection.

**Utilisateurs commerciaux :** GPTZero (composant explicite), QuillBot, Originality.ai (composant signalé). Turnitin considère explicitement la burstiness comme **insuffisante** et utilise un transformeur profond capturant des dépendances statistiques de plus haut ordre.

**Référence :** GPTZero (gptzero.me/news/perplexity-and-burstiness-what-is-it/) ; code GitHub BurhanUlTayyab/GPTZero.

**Niveau de confiance :** Élevé pour l'existence du signal, Moyen pour sa fiabilité isolée.

### 2.2 Perplexité et courbure de probabilité

**Perplexité :** PP = 2^(-1/N × Σ log₂ P(tᵢ | t₁...tᵢ₋₁)). Le texte IA a une perplexité plus basse (plus prévisible) que le texte humain. Utilisée par la quasi-totalité des détecteurs.

**Courbure de probabilité (DetectGPT) :** d(x, p_θ, q) = [log p_θ(x) − E_{x̃∼q(·|x)} log p_θ(x̃)] / σ_{x̃∼q(·|x)} log p_θ(x̃). Le texte machine occupe les régions de **courbure négative** de la fonction de log-probabilité. Mitchell et al., ICML 2023 (arXiv 2301.11305).

**Fast-DetectGPT :** Courbure conditionnelle ; texte machine ≈ 3, texte humain ≈ 0. Amélioration de ~75% sur DetectGPT. Bao et al., ICLR 2024 (arXiv 2310.05130).

**Niveau de confiance :** Élevé — publications ICML et ICLR peer-reviewed.

### 2.3 Statistiques d'ordre supérieur du surprisal (DivEye)

**Métriques :** Skewness (γ₁) et Kurtosis (γ₂) des distributions de surprisal par token. Le texte IA produit des distributions plus **symétriques** (skewness basse) ; le texte humain montre une **skewness positive** (présence de tokens rares) et une **kurtosis élevée** (comportement à queues lourdes reflétant la diversité stylistique).

**Référence :** arXiv 2509.18880 (2025). Résultats compétitifs sur 12 modèles, 8 domaines, 4 stratégies de décodage.

**Détecteurs commerciaux :** Non confirmé dans les outils commerciaux actuels. Approche académique récente.

**Niveau de confiance :** Moyen — prépublication, non encore adoptée par les outils commerciaux.

### 2.4 Distribution de longueur de phrase

**Méthode :** Histogrammes de tokens par phrase ; coefficient de variation (CV = σ/μ) de la longueur de phrase ; mesures de diversité textuelle (STTR, MTLD). Les LLM concentrent les phrases dans la plage 10-30 tokens avec une variance plus faible. Les humains produisent une distribution plus large avec plus de phrases longues (>40 tokens).

**Référence :** Muñoz-Ortiz et al. (2024), _Artificial Intelligence Review_.

**Détecteurs commerciaux :** QuillBot et NetusAI mentionnent explicitement la variation de longueur de phrase. Copyleaks analyse la « dispersion syllabique ».

**Niveau de confiance :** Élevé.

### 2.5 Métriques de complexité syntaxique

**Méthode :** Profondeur de l'arbre de dépendance (via parseur spaCy) ; nombre de propositions subordonnées ; distance de dépendance moyenne ; fréquence des nominalisations.

**Référence :** Herbold et al. (2023), _Scientific Reports_.

**Détecteurs commerciaux :** Copyleaks utilise l'analyse POS (parties du discours). Compilatio (FR) analyse « la construction des phrases ».

**Niveau de confiance :** Élevé.

### 2.6 Fréquence des motifs discursifs (RST)

**Méthode :** Extraction de motifs discursifs à partir d'arbres RST transformés en hypergraphes récursifs. Distribution de fréquence des motifs comparée entre texte humain et machine.

**Référence :** arXiv 2402.10586 (2024).

**Détecteurs commerciaux :** Non signalé dans les outils commerciaux. Approche académique.

**Niveau de confiance :** Moyen — une seule étude utilisant cette métrique spécifique.

### 2.7 Ratio contenu/fonction et POS bigrams

**Méthode :** Ratio mots de contenu / mots-outils. Les humains moyennent 0.98, l'IA moyenne **1.37** — créant une « lourdeur » informationnelle dans le texte IA. Les POS bigrams (bigrammes de parties du discours) sont hautement discriminants pour l'identification du modèle source.

**Référence :** MultiLingual Magazine (sept. 2025) pour le ratio ; McGovern et al., COLING 2025 pour les POS bigrams.

**Niveau de confiance :** Moyen pour le ratio (source magazine) ; Élevé pour les POS bigrams (peer-reviewed).

---

## Section 3 — Caractéristiques de l'écriture humaine organique

Pour chaque signature IA identifiée, voici le comportement humain correspondant documenté dans la littérature.

**Distribution étroite des longueurs de phrase (IA)** → L'écriture humaine produit une **distribution étalée et à queues lourdes** : alternance naturelle entre phrases très courtes (3-5 mots, pour l'emphase) et phrases longues et complexes (40+ tokens, pour le raisonnement détaillé). Cette variabilité crée un rythme organique que les lecteurs perçoivent inconsciemment. | Muñoz-Ortiz et al. (2024)

**Prédominance de l'Élaboration discursive (IA)** → Les humains utilisent une **structure discursive plus ramifiée** avec davantage de relations Joint (coordination), créant un discours qui bifurque, digresse, et revient — plutôt qu'un empilement linéaire d'élaborations. L'arbre discursif humain est plus large et moins profond. | arXiv 2402.10586

**Perte de cohérence en document long (IA)** → Les écrivains humains experts maintiennent un **fil thématique central** à travers le document entier, avec des digressions contrôlées qui reviennent au thème principal. La cohérence humaine est tissée, non segmentée. | arXiv 2412.12679

**Absence de variation de registre (IA)** → L'écriture humaine **adapte spontanément le registre** au genre et au contexte : plus nominale et dense pour un article scientifique, plus verbale et impliquée pour un billet de blog, plus familière pour une conversation. Les features de Biber montrent des profils rhétoriques distincts par genre chez les humains, convergents chez l'IA. | Reinhart et al., PNAS (2025)

**Complexité syntaxique excessive (IA)** → L'écriture humaine exhibe une **complexité syntaxique modérée mais variable** : des phrases simples côtoient des constructions élaborées selon le besoin communicatif. Les humains utilisent plus de **verbes modaux et marqueurs épistémiques** (« perhaps », « might suggest », « il semblerait ») qui témoignent d'une pensée en cours plutôt que d'une assertion aplatie. | Herbold et al. (2023)

**Template paragraphique tripartite (IA)** → Les paragraphes humains ont des **longueurs et structures irrégulières** : un paragraphe d'une phrase pour l'emphase, suivi d'un paragraphe de 8 phrases pour développer une preuve, puis un paragraphe moyen avec un twist argumentatif. La structure sert le propos, non un template. | Pangram Labs (2025) ; Steere (2024)

**Ouvertures formulaïques (IA)** → Les humains commencent les paragraphes de manière **diverse et contextuelle** : par un exemple concret, une question, un fait surprenant, un fragment, une référence au paragraphe précédent — rarement par un connecteur logique formel isolé. | Steere, _Inside Higher Ed_ (2024)

**Entrée directe dans le sujet (IA)** → L'écriture humaine, notamment les essais et billets de blog, comporte une **entrée graduelle** : anecdote personnelle, question ouverte, scène, ou définition problématisée avant d'arriver à la thèse. Tom Johnson note que l'alternance entre narration personnelle (première personne) et explication (troisième personne) est un marqueur fort d'authenticité. | Steere (2024) ; Tom Johnson, idratherbewriting.com (oct. 2023)

**Persistance de la troisième personne (IA)** → Les écrivains humains **alternent les voix narratives** selon le besoin rhétorique : première personne pour l'expérience vécue, troisième pour l'analyse, deuxième pour l'adresse au lecteur. Cette alternance est rare dans le texte IA non prompté. | Steere (2024)

**Distribution symétrique du surprisal (IA)** → Le texte humain contient des **pics de surprisal** — mots rares, tournures inattendues, métaphores originales — qui créent une distribution à skewness positive. Ces « aspérités stylistiques » sont ce qui donne au texte sa texture unique et reconnaissable. | DivEye, arXiv 2509.18880

**Conclusions longues et répétitives (IA)** → Les conclusions humaines sont typiquement **plus courtes que les conclusions IA** et ajoutent une perspective nouvelle, une question ouverte, ou un retournement — plutôt que de résumer mécaniquement le contenu précédent. | Pangram Labs (2025)

**Sous-titres génériques (IA)** → Les écrivains humains créent des titres qui expriment un **jugement, une implication ou une tension** : « Why your deployment pipeline is lying to you », « The hidden cost of microservices » plutôt que « Understanding Deployment Pipelines » ou « The Importance of Microservices ». Les titres humains sont moins descriptifs et plus éditoriaux. | Bouchard (2026) ; BlueMagnet (2026)

**Annonces de plan et signposting métatextuel (IA)** → L'écriture humaine **réduit le signposting au minimum** dans les genres informels et l'accompagne de **marqueurs interactionnels** (hedges, engagement du lecteur) dans les genres formels. Un humain écrit « I'll walk you through three things that surprised me » plutôt que « In this article, we will first examine… then discuss… and finally conclude… ». | Jiang & Hyland (ESP 2025)

---

## Section 4 — Techniques de cassure de symétrie

### Le pass structurel de Bouchard

**Origine.** Louis-François Bouchard (co-fondateur de Towards AI, créateur « What's AI ») a publié le 15 janvier 2026 un article intitulé *How to Clean Up AI-Generated Drafts Without Sounding Like ChatGPT*, décrivant cette heuristique sous le nom « Do a structural pass before a language pass ». La technique s'appuie sur deux années d'édition de milliers de soumissions assistées par IA chez Towards AI.

**Méthode.** Résumer chaque paragraphe en une seule phrase, puis lire ces résumés comme un outline. Si la séquence suit « définition → liste → récapitulation → futur vague », ou si les résumés sont structurellement interchangeables (on pourrait permuter les paragraphes sans perdre de sens), le texte est templated. Bouchard : « The language has been de-delved, but the thought structure is still pure model. »

**Quand l'appliquer.** Sur tout texte de plus de 4-5 paragraphes, comme premier filtre structurel avant toute analyse lexicale ou stylistique. L'heuristique est particulièrement discriminante pour les essais d'opinion et articles de blog, où la régularité structurelle est suspecte. Elle est moins pertinente pour les tutoriels step-by-step et la documentation, dont la régularité est une convention de genre.

**Tentative de formalisation.** Aucune publication académique ne formalise directement la « substituabilité structurelle des paragraphes » comme métrique. Cependant, plusieurs travaux convergent :

- **Kim et al. (ACL 2024)** proposent un score MF-IDF (Motif Frequency-Inverse Document Frequency) extrait d'arbres RST hiérarchiques, montrant que les textes humains ont une variabilité structurelle significativement plus grande dans leurs motifs discursifs — ce que le test de Bouchard détecte intuitivement.
- **Tulchinskii et al. (NeurIPS 2023)** mesurent la dimensionalité intrinsèque des embeddings : le texte IA occupe un sous-espace ~1.5 dimensions inférieur au texte humain, suggérant une uniformité structurelle quantifiable.
- **Formalisation proposée** [Inférence, non validée] : calculer la similarité cosinus entre les embeddings des résumés mono-phrase de N paragraphes consécutifs. Si la moyenne dépasse un seuil (~0.85, à calibrer empiriquement), le texte est probablement templated.

**Niveau de confiance :** Élevé pour la technique elle-même (observation systématique de praticien). Moyen pour la formalisation proposée (inférence non testée).

### Autres heuristiques de détection structurelle

Au-delà du pass de Bouchard, 25 heuristiques praticien ont été identifiées, regroupées par catégorie :

**Tests de structure (fiabilité expert-recommandée)**

- **Test du template** (Pangram Labs / Max Spero) : vérifier si le texte suit intro → 3-4 paragraphes → liste à puces → conclusion.
- **Test d'uniformité des paragraphes** (Pangram Labs / Bradley Emi) : vérifier que les paragraphes sont de longueur approximativement égale. Corroboré multi-sources.
- **Test des transitions formulaïques** (Steere, U. North Georgia) : surreprésentation de « Firstly », « Furthermore », « Moreover », « On the other hand ». Basé sur 50+ essais.
- **Test des cinq structures de phrases** (Michelle Kassorla) : cinq patterns syntaxiques récurrents (simple+simple, jointures par point-virgule, transitions adverbiales, modificateurs en fin de phrase, structures parallèles).
- **Test de la conclusion** (Steere + Pangram) : conclusion commençant par « Overall » / « In Conclusion », anormalement longue, répétant le contenu.

**Tests de contenu (fiabilité semi-empirique à empirique)**

- **Test de profondeur/spécificité** (Steere, Pangram, Marian University) : absence d'insights originaux, d'anecdotes personnelles, d'observations uniques. Corroboré par « Writing with a Reader in Mind » (Iperstoria 2025).
- **Test de vérification des citations** (Steere) : vérifier l'existence réelle des sources citées. **Le test le plus fiable** de cette catégorie.
- **Test de voix personnelle** (Steere, Marian U.) : absence du « je » et du hedging. Confirmé par Jiang & Hyland (ESP 2025).
- **Test du biais de subtopic** (Spero, Pangram) : sur un sujet large, l'IA gravite vers les sous-thèmes les plus évidents. Anecdotique.

**Tests de style et lexique (fiabilité variable)**

- **AI tells lexicaux** (Pangram / Spero + Emi ; Stockton) : « delve », « tapestry », « vibrant », « realm », « embark », « navigate », « landscape », « testament », « underscore », « foster ». Augmentation ~400% de « delve » dans PubMed post-2022.
- **Test du « consensus middle »** (Stockton) : l'IA choisit le mot à haute probabilité (« transform ») plutôt que le mot précis (« upended », « restructured »).
- **Test de l'hyperbole** (Steere) : qualificatifs disproportionnés pour des sujets banals (« groundbreaking », « vital »).
- **Test de la surexplication appositionnelle** (Steere) : l'IA définit systématiquement les personnes par des appositions (« Margaret Fuller, a pioneering feminist and transcendentalist thinker »).

**Tests de processus (fiabilité élevée)**

- **Défense orale** (Kelley, Inside Higher Ed 2023 ; Hammer et Elliott, U. Penn) : demander à l'auteur de discuter et défendre son texte. Test le plus fiable en contexte éducatif.
- **Comparaison avec un baseline IA** (Kelley, Pangram) : générer le même exercice avec ChatGPT et comparer.

**Avertissement critique :** Plusieurs « tells IA » correspondent à des conventions normales de l'écriture académique APA (voix passive, transitions formelles), créant un risque de faux positif significatif pour certaines disciplines (lettre de réponse à Steere, _Inside Higher Ed_, août 2024).

### Techniques validées empiriquement ou fondées sur la recherche

**Réécrire la structure, pas le vocabulaire.** Consensus de multiples sources indépendantes : les détecteurs réagissent plus aux patterns de phrases prévisibles qu'au vocabulaire. Changer l'ordre des phrases, varier les ouvertures, modifier le rythme est plus efficace que remplacer des synonymes. AISEO confirme : « Editing manually often fails because writers focus on word changes instead of structural variation. » JustDone corrobore : « AI detectors react more to predictable sentence patterns than vocabulary. » _Niveau de confiance : Élevé — convergence de sources indépendantes._

**Varier délibérément la longueur des phrases.** Alterner une phrase longue explicative (25+ mots), une phrase courte percutante (5 mots), puis une phrase de longueur moyenne. Cette technique cible directement la métrique de burstiness mesurée par GPTZero et QuillBot. Exemple concret : au lieu de trois phrases de 15 mots, écrire une phrase de 25 mots, puis « C'est tout. », puis une phrase de 12 mots. | JustDone (2025) ; NetusAI _Niveau de confiance : Élevé — directement lié à la métrique de burstiness documentée._

**Varier la longueur des paragraphes.** Faire coexister des paragraphes de 2 phrases (pour l'emphase) et des paragraphes de 6-7 phrases (pour les preuves détaillées). Briser l'apparence « machine-balanced » de paragraphes de longueur identique. | Pangram Labs (2025) ; JustDone _Niveau de confiance : Moyen — observation de praticiens, cohérent avec la recherche sur la burstiness._

**Utiliser un « information pattern » intentionnel.** Choisir délibérément un arc narratif (problème → investigation → révélation ; question → exploration → complication → insight) au lieu de laisser l'IA imposer son template par défaut. Tom Johnson détaille cette approche : « My first step is to identify the information pattern I want to use. This narrative arc — from raising a concern, to chronicling its study, to achieving revelation — mimics the hero's journey story structure. » | Tom Johnson, idratherbewriting.com (oct. 2023) _Niveau de confiance : Moyen — recommandation d'un praticien expert en rédaction technique, non validée empiriquement._

**Appliquer le framework de Christensen (rhétorique générative de la phrase).** Le pattern de phrase cumulative de Francis Christensen — une proposition de base suivie d'une série de modificateurs libres — fournit un cadre pour créer des structures phrastiques à la fois complexes et organiquement variables, brisant la monotonie syntaxique de l'IA. | Daniel Plate, thèse de master, Lindenwood University (2025) _Niveau de confiance : Faible — source unique (thèse de master), mais fondement théorique solide (Christensen est une référence en rhétorique)._

### Techniques recommandées par des praticiens

**Élaguer les reformulations (« Delete-to-Reveal »).** Lire chaque paragraphe et supprimer 1-2 phrases qui ne font que reformuler l'idée déjà énoncée. L'IA gonfle les paragraphes par reformulation ; l'écriture humaine est plus tendue. Complémentaire à la technique Bouchard (résumé en une phrase pour révéler le template), cette technique brise le template en le raccourcissant. | JustDone (2025) _Niveau de confiance : Moyen._

**Alterner voix personnelle et explication analytique.** Insérer des anecdotes en première personne (« J'ai testé ceci et voilà ce qui s'est passé ») entre les passages explicatifs en troisième personne. Tom Johnson décrit cette technique comme l'une des plus efficaces : « when you switch into the 'I' mode, narrating a personal experience to complement explanations, it helps readers believe that all the content is human-generated. » | Tom Johnson, idratherbewriting.com (oct. 2023) _Niveau de confiance : Moyen — praticien expérimenté, mais pas de validation quantitative._

**Casser les triplets en structures asymétriques.** Quand l'IA organise les points en groupes de trois, fusionner deux points en une phrase ou développer un seul point en un exemple détaillé, brisant la symétrie structurelle. | JustDone (2025) _Niveau de confiance : Moyen._

**Diversifier les ouvertures de phrase.** Cesser de commencer plusieurs phrases par « This » ou « The ». Varier : connecteurs, exemples spécifiques, assertions directes, questions, fragments. | JustDone (2025) _Niveau de confiance : Moyen._

**Ajouter une entrée graduelle (warm-up narratif).** Au lieu de l'approche IA « droit au but », insérer un contexte anecdotique ou une question avant d'arriver à la thèse. | Steere, _Inside Higher Ed_ (2024) _Niveau de confiance : Élevé — fondé sur comparaison systématique humain/IA._

**Lire à voix haute pour détecter l'absence de « musique du texte ».** Technique recommandée spécifiquement pour le français par Stéphane Torregrosa : la lecture orale révèle l'uniformité rythmique que l'œil ne perçoit pas à l'écrit. | Squid-Impact (sept. 2025) _Niveau de confiance : Faible — praticien unique, non validé._

**Utiliser les détecteurs IA comme outil diagnostic (feedback loop structurel).** Soumettre le texte à un détecteur, identifier les zones à burstiness faible ou détectées comme IA, puis varier manuellement ces passages — non pour « battre » le détecteur, mais pour localiser l'uniformité structurelle. | NetusAI _Niveau de confiance : Moyen._

---

## Section 5 — Variations par modèle et par genre

### Empreintes stylistiques distinctes par famille de LLM

La recherche récente confirme sans ambiguïté que **chaque famille de LLM possède une empreinte stylistique identifiable**. McGovern et al. (COLING 2025, arXiv 2405.14057) démontrent que des classificateurs simples basés sur des n-grams et des POS features atteignent des performances robustes pour identifier le modèle source d'un texte, même hors domaine. Les empreintes sont « génétiques » — elles persistent entre les variantes d'une même famille (llama-13b et llama-65b ont des empreintes similaires). ChatGPT et davinci (même famille OpenAI) partagent des empreintes proches, tandis que Flan diverge substantiellement.

Bitton, Bitton et Nisan (Copyleaks, arXiv 2503.01659, mars 2025) confirment ces résultats avec un ensemble de 3 classificateurs entraînés sur Claude, Gemini, Llama et OpenAI, atteignant une **précision de 0.9988 et un taux de faux positifs de 0.0004** sur 200 000 échantillons. Résultat notable : les empreintes persistent « even when prompted to write in different writing styles ». Un test sur des modèles non vus révèle que **DeepSeek-R1 est classifié comme OpenAI dans 74.2% des cas** — suggérant fortement un entraînement par distillation sur des sorties OpenAI. Phi-4 et Grok-1, en revanche, montrent des empreintes totalement distinctes.

Cependant, Muñoz-Ortiz et al. (2024) soulignent que les **différences entre LLM et humains sont systématiquement plus grandes que les différences entre LLM eux-mêmes** — les modèles se ressemblent plus entre eux qu'ils ne ressemblent aux humains. Reinhart et al. (PNAS 2025) ajoutent que l'**instruction tuning amplifie la divergence stylistique** par rapport aux humains : les modèles de base Llama 3 ressemblent davantage aux humains que leurs versions instruction-tuned, et le scaling (augmentation de taille) ne corrige pas ce problème structurel.

### Variations par genre textuel et calibration des signaux

La recherche sur les variations structurelles selon le genre est insuffisamment développée mais livre des constats opérationnellement importants. L'étude Springer 2026 (*Evaluating accuracy of AI content detectors*, Int. J. Educational Integrity) testant Turnitin et Originality sur 192 textes montre un effondrement de précision du domaine humanities au domaine scientifique : Turnitin passe de 0.86 à 0.51, Originality de 0.96 à 0.58. Le benchmark RAID (Dugan et al., ACL 2024) confirme sur 6+ millions de générations que le taux de faux positifs varie fortement par domaine lorsqu'un seuil unique est utilisé.

Sardinha (2024, cité dans Terçon, arXiv 2510.05136) offre la comparaison la plus systématique : les textes académiques IA manquent d'éléments narratifs et de références explicites ; les essais IA sont informationnellement denses mais moins impliqués ; les articles de presse IA montrent moins d'implication et de narration ; les conversations IA sont plus abstraites. Le constat-clé : « les différences de degré d'abstraction ne deviennent apparentes que lorsqu'on prend en compte le genre textuel. »

Tom Johnson (idratherbewriting.com, oct. 2023) observe que l'IA « inevitably steers into explanation more than argument » — elle défaille vers le mode expositif quel que soit le genre, alors que les billets de blog et essais personnels requièrent des structures argumentatives, exploratoires ou narratives.

#### Calibration par genre : recommandations opérationnelles

**Tutoriel technique : supprimer 5 signaux sur 16.** La régularité structurelle est inhérente au genre. Les phrases impératives courtes, les étapes numérotées, l'entrée directe dans le sujet et l'absence de marqueurs épistémiques sont des conventions. Signaux à supprimer : #1 (longueur de phrase), #8 (structure list-like), #10 (entrée directe), #13 (marqueurs épistémiques), #14 (burstiness). Signaux qui restent pertinents : la perte de cohérence entre étapes dépendantes (#3) est le signal le plus fiable — un humain maintient les dépendances logiques, l'IA perd le fil. L'absence de variation de registre (#4) est discriminante : les tutoriels humains injectent de la personnalité. La complexité syntaxique excessive (#5) est un signal fort car les tutoriels doivent être simples.

**Essai d'opinion / blog : activer tous les signaux à sensibilité maximale.** Aucun des 16 signaux ne présente de risque de faux positif significatif. Les signaux les plus discriminants sont la basse burstiness (#14), l'absence de marqueurs épistémiques (#13), le manque de variation de registre (#4) et la persistance de la 3e personne (#11). C'est le meilleur genre pour la détection structurelle.

**Article technique / état de l'art : supprimer la 3e personne, relever les seuils.** L'écriture académique utilise conventionnellement la 3e personne (#11 — supprimer). L'entrée directe (#10) est normale. Les marqueurs épistémiques (#13) et la burstiness (#14) doivent voir leur seuil relevé. Le signal le plus fiable : les ouvertures formulaïques (#7) — « In recent years, X has gained significant attention » est devenu quasi-diagnostique. L'étude Sci-SpanDet (arXiv 2510.00890) montre que le conditionnement par section améliore la détection dans le texte académique.

**Documentation logicielle : 10-12 signaux sur 16 à supprimer.** Pire genre pour la détection structurelle. Pangram Labs rapporte un taux de faux positifs de 0.0% et recommande de ne pas scanner les manuels d'instruction. Seuls trois signaux restent partiellement fiables : la cohérence interne (#3), la complexité syntaxique excessive (#5), l'usage du em dash (#12). Approches alternatives plus efficaces : vérification de l'exactitude factuelle, validation des références croisées, correction du code.

**Newsletter technique : profil hybride.** La mixité résumés/commentaire/recommandations crée une burstiness élevée attendue, rendant l'uniformité IA très suspecte. Signaux partiellement supprimables : #10 (entrée directe) et #8 (listes dans les sections roundup). Tous les autres restent actifs. [INCERTAIN — pas d'étude empirique directe sur les newsletters.]

#### Le problème du code dans le texte technique

Les blocs de code perturbent toutes les métriques structurelles : ils créent une distribution bimodale artificielle de longueurs et introduisent une perplexité extrême masquant la basse perplexité de la prose IA. Pangram Labs rapporte ~20% de faux négatifs sur le code IA seul. **Recommandation : isoler les blocs de code avant l'analyse de la prose.** Analyser les segments de prose indépendamment. Les segments courts entre blocs de code peuvent être trop brefs pour une détection fiable (Pangram recommande « over a couple hundred words »).

#### Matrice genre × signal

| Signal | Tutoriel | Blog / Opinion | Article technique | Doc logicielle | Newsletter |
|--------|----------|---------------|-------------------|----------------|------------|
| #1 Longueur de phrase étroite | ❌ | ✅ Élevé | ⚠️ Relever seuil | ❌ | ✅ Moyen-élevé |
| #2 Élaboration RST | ✅ Moyen-élevé | ✅ Élevé | ✅ Élevé | ✅ Moyen | ✅ Élevé |
| #3 Perte de cohérence | ✅ Élevé | ✅ Moyen | ✅ Élevé | ✅ Moyen-élevé | ✅ Moyen |
| #4 Absence variation registre | ✅ Moyen-élevé | ✅ Très élevé | ✅ Moyen-élevé | ❌ | ✅ Très élevé |
| #5 Complexité syntaxique | ✅ Élevé | ✅ Moyen | ✅ Élevé | ✅ Élevé | ✅ Moyen-élevé |
| #6 Template tripartite | ⚠️ Moyen | ✅ Élevé | ✅ Élevé | ❌ | ✅ Moyen-élevé |
| #7 Ouvertures formulaïques | ⚠️ Moyen | ✅ Élevé | ✅ Très élevé | ❌ | ✅ Élevé |
| #8 Structure list-like | ❌ | ✅ Moyen-élevé | ✅ Moyen | ❌ | ⚠️ Moyen |
| #9 Conclusions répétitives | ✅ Moyen | ✅ Élevé | ✅ Élevé | ❌ | ✅ Moyen-élevé |
| #10 Entrée directe | ❌ | ✅ Moyen | ❌ | ❌ | ⚠️ Moyen |
| #11 Persistance 3e personne | ✅ Moyen | ✅ Élevé | ❌ | ❌ | ✅ Élevé |
| #12 Em dash excessif | ✅ Élevé | ✅ Moyen-élevé | ✅ Élevé | ✅ Moyen-élevé | ✅ Moyen |
| #13 Marqueurs épistémiques | ❌ | ✅ Très élevé | ⚠️ Relever seuil | ❌ | ✅ Élevé |
| #14 Basse burstiness | ❌ | ✅ Très élevé | ⚠️ Relever seuil | ❌ | ✅ Très élevé |
| #15 Sous-titres génériques | ⚠️ Moyen | ✅ Élevé | ✅ Très élevé | ❌ | ✅ Élevé |
| #16 Annonce de plan | ⚠️ Moyen | ✅ Élevé | ⚠️ Moyen | ❌ | ✅ Élevé |

**Légende :** ✅ = signal pertinent (poids plein), ⚠️ = signal à pondérer (poids réduit), ❌ = signal à supprimer (faux positif probable)

**Signaux universels** (fiables dans tous les genres) : #3 (cohérence), #5 (complexité syntaxique), #12 (em dash).
**Signaux les plus genre-dépendants** : #1, #8, #10, #13, #14 — variant de « supprimer » à « très élevé ».
**Meilleur genre pour la détection** : blog/opinion (tous signaux actifs).
**Pire genre** : documentation logicielle (10-12 signaux sur 16 à supprimer).
## Section 6 — Burstiness et variabilité phrastique

### État actuel des connaissances

La burstiness — variabilité de la complexité et de la longueur phrastique au sein d'un document — est le **signal structurel le plus cité** dans l'écosystème de détection IA, mais sa fiabilité comme prédicteur isolé est **sérieusement remise en question** par la recherche récente.

Le concept a été popularisé par Edward Tian (GPTZero, janvier 2023) qui l'a défini comme « a measure of how much writing patterns and text perplexities vary over the entire document ». L'implémentation initiale de GPTZero était remarquablement simple : la burstiness équivalait au **maximum de la perplexité par phrase** (non une mesure de variance, comme souvent décrit). Le modèle de production actuel est plus sophistiqué, intégrant la burstiness comme l'un de sept composants.

Le signal de base est réel : **les textes LLM montrent effectivement une burstiness plus faible** que les textes humains, confirmé par Muñoz-Ortiz et al. (2024) avec des données quantitatives sur 6 modèles, et par Kujur (SSRN, 2025) qui documente « more uniform sentence structures » dans le texte IA. Les humains alternent naturellement entre phrases courtes et percutantes et phrases longues et élaborées, créant une variation rythmique que les LLM ne reproduisent pas spontanément.

### Limites critiques documentées

Trois problèmes majeurs limitent la fiabilité de la burstiness comme signal de détection.

Le **biais contre les locuteurs non natifs** est le plus grave. Liang et al. (Stanford, _Patterns_ 4(7), 2023) ont démontré que plus de **61% des essais TOEFL rédigés par des locuteurs non natifs** sont faussement classifiés comme IA par les détecteurs basés sur la perplexité/burstiness, contre seulement ~5% pour les locuteurs natifs. Les écrivains non natifs produisent naturellement un texte à variance syntaxique réduite (burstiness basse), structurellement indistinguable du texte IA par cette métrique.

Le **problème de contamination des données d'entraînement** est soulevé par Pangram Labs (Bradley Emi, mars 2025) : tout texte présent dans les données d'entraînement du LLM utilisé pour calculer la perplexité aura une perplexité uniformément basse, donc une burstiness basse, et sera faussement classifié comme IA. Pangram Labs démontre que la Déclaration d'Indépendance américaine, des passages bibliques, et des articles Wikipedia sont systématiquement flaggés comme IA.

L'**amélioration des LLM** érode progressivement le signal. Kujur (2025) note explicitement : « as language models have advanced, these differences have diminished significantly. » GPT-4 et les modèles ultérieurs montrent une capacité accrue à mimer la variabilité humaine. Plusieurs sources mentionnent que les modèles 2025 peuvent « incorporate variability algorithms » [INCERTAIN — aucune source académique ne confirme un mécanisme spécifique].

### Mesure concrète

Pour mesurer la burstiness d'un texte en pratique, la méthode la plus accessible est le **coefficient de variation de la longueur de phrase** (CV = écart-type / moyenne des longueurs de phrase en tokens). Un CV faible suggère une uniformité structurelle. L'approche plus sophistiquée calcule la perplexité par phrase via un modèle de langue (GPT-2 ou similaire) puis mesure la variance de ces scores. Les outils commerciaux (GPTZero, QuillBot) automatisent ce calcul mais ne divulguent pas leurs seuils exacts.

Turnitin a pris une position notable en déclarant explicitement dans son livre blanc (août 2024) que la perplexité et la burstiness sont **insuffisantes** et que leur architecture transformeur profond capture « an enormous number of long-range statistical dependencies » plus informatives que ces métriques simples.

### Verdict

La burstiness est un **signal réel mais non suffisant**. Elle est utile comme composant d'un ensemble de signaux, mais **jamais fiable isolément**. Son utilisation pour la détection dans un contexte bilingue FR/EN est particulièrement risquée étant donné le biais documenté contre les écritures non natives. Pour un workflow d'écriture humain-IA, la burstiness est plus utile comme **outil diagnostic** (identifier les passages trop uniformes à réviser) que comme métrique de validation finale.

**Niveau de confiance global : Élevé** pour l'existence du signal ; **Élevé** pour ses limitations.

---

## Section 7 — Lacunes et questions ouvertes

### Lacunes majeures identifiées

**Absence quasi totale de recherche francophone sur les patterns structurels.** Aucune étude académique française ne traite spécifiquement des signatures structurelles (longueur de paragraphe, distribution phrastique, schémas organisationnels) du texte IA en français. Le papier le plus proche est MOSAIC (Dubois, Piantanida, Yvon — Sorbonne/ISIR, ACL 2025), mais il se concentre sur les approches perplexité/compression et non sur la structure discursive. Les observations structurelles sur le français proviennent exclusivement de praticiens (Torregrosa, Compilatio, Kitcreanet) sans validation empirique formelle. C'est une lacune significative pour un blog technique bilingue.

**Pas d'étude longitudinale systématique.** Aucune étude n'a suivi les mêmes métriques structurelles à travers les générations de modèles (GPT-3 → 3.5 → 4 → 4o) avec une méthodologie contrôlée. Le récit d'« évolution » est inféré de comparaisons transversales, non de mesures longitudinales.

**Genres techniques sous-étudiés.** Les tutoriels, la documentation technique, et les articles de blog technique — exactement les genres pertinents pour le contexte de cette recherche — sont **quasi absents de la littérature empirique**. La majorité des études portent sur les essais académiques et les articles de presse. L'extrapolation des résultats à d'autres genres est incertaine.

**Le pattern « définition → explication → nuance → résumé » est désormais partiellement documenté.** Bouchard (2026) décrit un équivalent (« definition → list → recap → vague future ») et Jiang & Hyland (ESP 2025) formalisent la surreprésentation des frame markers comme composante mesurable. Le pattern n'a pas de nom formel unique dans la littérature, mais il est désormais corroboré par des sources multiples (praticiens et académiques).

**Pas de comparaison structurelle formelle Claude vs GPT vs Gemini.** Les études de fingerprinting (McGovern et al., Bitton et al.) confirment que les modèles ont des empreintes distinctes, mais les descriptions qualitatives des différences structurelles spécifiques entre Claude, GPT-4 et Gemini restent **anecdotiques et souvent issues de contenus marketing**. La seule donnée structurellement informative est que les empreintes sont « familiales » et persistent malgré le prompting stylistique.

### Contradictions entre sources

**Burstiness : signal fiable ou obsolète ?** GPTZero le présente comme « key factor unique to GPTZero detector » ; Pangram Labs le qualifie de fondamentalement insuffisant ; Turnitin le considère explicitement inadéquat seul. La vérité est probablement contextuelle : utile pour les textes longs et les modèles plus anciens, déclinant en fiabilité avec les modèles récents.

**L'instruction tuning : améliore ou dégrade la détectabilité ?** Kirk et al. (ICLR 2024) montrent que le RLHF **réduit la diversité** de sortie (devrait faciliter la détection), mais Reinhart et al. (PNAS 2025) montrent que les modèles instruction-tuned **divergent davantage des humains** stylistiquement. Ces deux constats sont compatibles (moins divers ET plus éloignés des humains), mais leur implication pour la détection effective est ambiguë.

**Résultat d'impossibilité vs détection pratique.** Sadasivan et al. (ICLR 2024) prouvent théoriquement qu'un LLM suffisamment bon rend la détection marginalement meilleure qu'aléatoire. Or les détecteurs actuels fonctionnent avec une précision substantielle (>80% dans beaucoup de conditions). La réconciliation est que les modèles actuels ne sont pas encore « suffisamment bons » au sens du théorème, et que les approches structurelles (discours RST, features de Biber) semblent plus robustes au paraphrasing que les approches token-level — mais cette robustesse n'est pas garantie à long terme.

### Questions ouvertes pour la recherche future

La question de savoir si les patterns structurels IA en **français** diffèrent de ceux en anglais reste entièrement ouverte. Compilatio rapporte des taux de détection élevés (98.5%) sur le français après fine-tuning spécifique, mais ces chiffres sont auto-reportés et non vérifiés indépendamment. L'oscillation entre « traduction littérale et adaptation culturelle » mentionnée par Torregrosa pourrait constituer un signal structurel spécifique au français, mais cette hypothèse n'a été ni testée ni quantifiée.

L'impact de la **température de génération et du system prompt** sur les patterns structurels est un angle mort majeur. Les études comparent typiquement la sortie « par défaut » des modèles. Or un system prompt soigneusement conçu (comme ceux utilisés dans un workflow en 7 phases) pourrait atténuer significativement les patterns structurels documentés — sans que cette atténuation ait été mesurée.

Enfin, l'**homogénéisation linguistique à grande échelle** documentée par Sourati et al. (2025) — diminution de la variabilité stylistique sur Reddit, dans l'écriture scientifique et les revues peer-reviewed — pose une question fondamentale : si l'écriture humaine elle-même converge vers les patterns LLM par exposition et usage, la distinction structurelle humain/IA pourrait devenir intrinsèquement plus difficile, indépendamment des progrès des détecteurs. Cette hypothèse n'est pas encore testée empiriquement mais constitue sans doute la question la plus importante pour les années à venir.

La question de la **calibration optimale des seuils par genre** reste ouverte. FairOPT (arXiv 2502.04528) propose des seuils adaptatifs réduisant la disparité de 27.4% avec moins de 0.1% de perte de précision, mais cette approche n'a pas été testée avec la matrice de signaux structurels proposée ici. Les taux de faux positifs par domaine publiés par Pangram Labs (0.0% pour la documentation de code, 0.23% pour les recettes) suggèrent que la calibration par genre est le levier le plus important pour la fiabilité opérationnelle.

## Section 8 — Workflow de détection recommandé

La séquence ci-dessous ordonne les vérifications du plus fiable au moins fiable, en intégrant la calibration par genre comme prérequis.

### Étape 0 — Classification du genre

Avant toute analyse, identifier le genre textuel (tutoriel, blog, article technique, documentation, newsletter) et charger le profil de calibration correspondant (matrice Section 5). Si le texte contient des blocs de code, les isoler et analyser la prose seule.

### Étape 1 — Pass structurel de Bouchard (confiance : élevée)

Résumer chaque paragraphe en une phrase. Lire les résumés comme un outline. Si la séquence suit « définition → liste → récapitulation → futur vague » ou si les résumés sont interchangeables, c'est un signal fort. Ce test prend 2-3 minutes et offre le meilleur ratio signal/effort.

### Étape 2 — Signaux universels (confiance : élevée)

Vérifier les trois signaux fiables dans tous les genres : perte de cohérence dans les documents longs (#3), complexité syntaxique excessive (#5), surreprésentation du em dash (#12). Taux de faux positifs bas quelle que soit la catégorie textuelle.

### Étape 3 — Signaux calibrés par genre (confiance : élevée à moyenne)

Appliquer les signaux marqués ✅ dans la matrice pour le genre identifié. Pour le blog/opinion, activer tous les signaux à sensibilité maximale. Pour le tutoriel, se concentrer sur la cohérence inter-étapes et la variation de registre. Pour l'article technique, surveiller prioritairement les ouvertures formulaïques et les sous-titres génériques.

### Étape 4 — Analyse lexicale ciblée (confiance : moyenne-élevée)

Scanner pour les AI tells lexicaux (« delve », « tapestry », « vibrant », « landscape »), les phrases rouges (« It's important to note », « In the ever-evolving landscape »), et les noms IA (« Emily », « Sarah » dans les exemples). Signal fort en agrégat mais faible individuellement.

### Étape 5 — Vérification du métadiscours (confiance : moyenne-élevée, sauf genre académique)

Mesurer le ratio métadiscours interactif (signposting, transitions, frame markers) vs métadiscours interactionnel (hedges, boosters, marqueurs d'attitude). Un ratio élevé interactif / bas interactionnel est un signal IA. L'écriture académique présente naturellement un ratio élevé de métadiscours interactif — pondérer en conséquence.

### Étape 6 — Tests de contenu (confiance : variable)

Vérifier la profondeur et la spécificité : insights non évidents, anecdotes personnelles, références à des expériences spécifiques. Vérifier les citations si présentes (test le plus fiable de cet axe). Évaluer la voix personnelle et le biais de subtopic.

### Étape 7 — Jugement global pondéré

Aucun signal individuel n'est définitif. Seuil recommandé [Inférence] : **3+ signaux calibrés positifs = investigation approfondie**, **5+ signaux = forte présomption**. Documenter les signaux détectés et leur poids dans le genre concerné.