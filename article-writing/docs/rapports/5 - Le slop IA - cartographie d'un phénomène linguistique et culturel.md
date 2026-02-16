# Le slop IA : cartographie d'un phénomène linguistique et culturel

**Le « slop » désigne le contenu généré par IA, non sollicité et non révisé, qui présente une compétence de surface masquant un vide substantiel.** Le terme a été propulsé dans le vocabulaire courant entre mai 2024 (tweet viral de @deepfates) et décembre 2025 (mot de l'année Merriam-Webster), parcourant en 19 mois le chemin du jargon internet au dictionnaire. Ce rapport fournit une base de connaissances catégorisée, sourcée et exploitable pour détecter, prévenir et documenter le slop dans un workflow éditorial technique.

---

## Section 1 — Définitions et généalogie

### La cristallisation du terme : mai 2024

Le mot « slop » existait dans le jargon internet bien avant l'IA. Son origine remonte à 4chan (2016), où le terme « goyslop » désignait la nourriture industrielle de masse, avant de perdre son préfixe et de devenir un terme générique pour tout contenu à faible effort — « Netflix slop », « Marvel slop ». [PRATICIEN] Max Read (Substack, « What is slop, exactly? », 19 décembre 2025) documente cette pré-histoire et soutient que le slop comme modificateur « suggests a set of qualities — forgettability, predictability, unoriginality, lifelessness — rather than a particular origin. »

Le moment fondateur est le **tweet de @deepfates du 6 mai 2024** (301K+ vues) : « Watching in real time as 'slop' becomes a term of art. The way that 'spam' became the term for unwanted emails, 'slop' is going in the dictionary as the term for unwanted AI generated content. » Ce tweet reprenait @allgarbled (4 mai 2024) qui se plaignait du « wall of LLM slop » dans les résultats Google. Deux jours plus tard, **Simon Willison** publie l'article fondateur « Slop is the new name for unwanted AI-generated content » (simonwillison.net, 8 mai 2024). [CONSENSUS]

### Définitions par auteur — cartographie des nuances

**Simon Willison** (simonwillison.net, 8 mai 2024) propose la définition la plus opérationnelle : le slop est du contenu IA **à la fois non sollicité (unrequested) et non révisé (unreviewed)**. Citation exacte : « Not all promotional content is spam, and not all AI-generated content is slop. But if it's mindlessly generated and thrust upon someone who didn't ask for it, slop is the perfect term for it. » Willison est explicitement pro-LLM pour la productivité personnelle — sa définition cible uniquement la _publication_ de contenu non révisé. Il a également forgé « **slom** » (9 mai 2024) pour l'intersection spam + slop, et étendu le concept au code (« AI slop in pull requests », décembre 2025). [PRATICIEN] Confiance : Élevée.

**Maggie Appleton** (maggieappleton.com, « The Expanding Dark Forest and Generative AI », première présentation avril 2023, mise à jour UX Brighton novembre 2024) définit le slop comme « unwanted, unhelpful AI generated content » et l'inscrit dans la **métaphore de la « Dark Forest »** : le web devient hostile, les humains se retirent dans le « cozy web » (Discord, WhatsApp, newsletters). Son travail _précède_ la popularisation du terme — elle décrivait le phénomène avant que le mot n'existe. Sa contribution unique est écologique : le slop n'est pas un problème isolé mais un symptôme de la transformation systémique du web. [PRATICIEN] Confiance : Élevée.

**Cory Doctorow** (pluralistic.net, multiples articles 2024-2025) ne définit jamais formellement le slop mais le tisse dans ses cadres de l'**enshittification** et du **reverse centaur** (l'humain réduit au rôle d'assistant de l'IA). Ses contributions terminologiques sont dérivatives : « **slopvertising** » (publicité générée par IA, 11 décembre 2025), « **AI-sloppified** » et « **webslop** » (15 juillet 2025), ainsi que le relais du terme « **slopsquatting** » (vulnérabilité sécurité où l'IA invente des noms de bibliothèques). Pour Doctorow, le slop est un symptôme du capitalisme monopolistique, pas un problème technologique. [OPINION] Confiance : Élevée.

**Kevin Baker** (cité par Max Read, décembre 2025) offre la définition la plus philosophique : le slop est « **the negative platonic form: not the ideal that particulars aspire toward, but the silhouette left when you subtract everything that would make a specific instance rather than a thing of a type.** » Ses lecteurs ont glossé cela comme « antihaecceity » — l'absence de spécificité individuelle. [OPINION] Confiance : Moyenne (source secondaire).

**Kommers et al.** (arXiv 2601.06060, janvier 2026, Alan Turing Institute / Purdue / Duke / U Chicago) — premier travail académique rigoureux de définition — identifient **trois propriétés prototypiques** : (1) **Compétence superficielle** — « a veneer of quality belied by a deeper lack of substance » ; (2) **Effort asymétrique** — production quasi-instantanée, vérification coûteuse ; (3) **Producibilité de masse**. Ils identifient aussi trois dimensions de variance : utilité instrumentale, personnalisation, surréalisme. [EMPIRIQUE] Confiance : Élevée.

**Merriam-Webster** (mot de l'année 2025) : « digital content of low quality that is produced usually in quantity by means of artificial intelligence. » **Oxford University Press** (finaliste 2024, +332% d'usage détecté) : « Art, writing, or other content generated using artificial intelligence, shared and distributed online in an indiscriminate or intrusive way, and characterized as being of low quality, inauthentic, or inaccurate. » L'American Dialect Society, The Economist et le Macquarie Dictionary (Australie) ont également sélectionné « slop » comme mot de l'année 2025. [CONSENSUS] Confiance : Élevée.

### Le terme en français : un champ lexical encore instable

L'**Office québécois de la langue française (OQLF)** a proposé en mai 2025 le terme officiel « **contenu dégénératif** » (portmanteau dégénératif + génératif). La linguiste Laurence Grondin-Robillard (UQAM) critique ce choix : « Des termes faisant allusion à l'IA auraient été à propos comme de la 'bouillie d'IA'. » Géraldine Moinard (Le Robert) propose « **bouillie numérique** » ou « **purée numérique** ». En pratique, les médias francophones utilisent des périphrases variables : « déchets d'IA » (Le Big Data), « pollution informationnelle » (Agence Science-Presse), ou simplement « slop » non traduit (InnoSpira, Developpez.com). **Aucun consensus terminologique n'a émergé en français.** [PRATICIEN] Confiance : Élevée.

### Timeline de la mainstreaming

|Date|Événement|
|---|---|
|Mai 2024|Tweet @deepfates → article Willison → The Guardian couvre le terme|
|Juin 2024|New York Times : « First Came 'Spam.' Now, With A.I., We've Got 'Slop' »|
|Nov 2024|Oxford finaliste mot de l'année (+332% d'usage)|
|Déc 2024|Washington Post argumente que « slop » aurait dû gagner|
|Mai 2025|OQLF propose « contenu dégénératif »|
|Juil 2025|Wall Street Journal : « AI Slop Is Everywhere »|
|Déc 2025|**Merriam-Webster : mot de l'année 2025**|

### Cartographie sémantique : slop vs concepts adjacents

Le slop se distingue de concepts proches. Le « **botshit** » (Hannigan, McCarthy & Spicer, SSRN décembre 2023, repris dans Harvard Business Review juillet 2024) désigne le contenu chatbot « coherent-sounding but inaccurate or fabricated » — focalisé sur le risque épistémique de l'hallucination, là où le slop couvre un spectre plus large incluant du contenu factuellement correct mais substantivement vide. La « **slopaganda** » (Mark Alfano, Macquarie University, Filosofiska Notiser 2025) désigne spécifiquement le slop à visée de manipulation politique. Le « **webslop** » (Doctorow) qualifie la dégradation globale du contenu web. [PRATICIEN/EMPIRIQUE]

---

## Section 2 — Taxonomie et manifestations par genre textuel

### Cadres taxonomiques formels

**Shaib et al.** (arXiv 2509.19163, septembre 2025, Northeastern University / Meta AI) proposent la taxonomie la plus rigoureuse, issue d'entretiens avec des chercheurs NLP, écrivains et philosophes, puis testée par annotation de 150 articles et 100 passages Q&R. Trois piliers, dix sous-dimensions : **Utilité informationnelle** (densité, pertinence), **Qualité informationnelle** (factualité, biais), **Qualité stylistique** (répétition, « templatedness », cohérence, verbosité, complexité lexicale, ton). Leur conclusion clé : **la force des dimensions latentes varie selon le domaine** — actualités et Q&R technique produisent des patterns de slop différents. [EMPIRIQUE] Confiance : Élevée.

Le **SlopDetector** (slopdetector.org, 2025-2026) propose cinq catégories pragmatiques : Generic Slop (templates vagues), Pseudo-Insight Slop (fausse profondeur), Fake Authority Slop (ton expert sans substance), Wikipedia Rehash (paraphrase encyclopédique), Wellness Slop (auto-aide universalisée). [PRATICIEN] Confiance : Moyenne.

### Manifestations par genre textuel

**LinkedIn / réseaux sociaux professionnels.** Originality AI (Fast Company, 2024) mesure que **54% des posts LinkedIn longs (100+ mots) montrent des signes d'assistance IA** (8 795 posts analysés, janvier 2018–octobre 2024). [EMPIRIQUE] Les marqueurs structurels spécifiques incluent : le format « broetry » (paragraphes d'une seule phrase empilés), l'ouverture dramatique formulaïque (« I was broke. Then I learned this secret. »), les fermetures d'engagement-bait (« Agree? » / « Thoughts? »), les listes à emojis (✅ 📊 💡), et le formatage Unicode gras/italique (𝗯𝗼𝗹𝗱) — presque exclusivement un artéfact IA selon Charlie Guo. Au niveau du contenu : vulnérabilité performative (arc formulaïque lutte → révélation → triomphe), anecdotes de succès fabriquées, sagesse quasi-oraculaire en bouchées. [PRATICIEN]

**Blog technique / documentation.** Shreya Shankar (sh-reya.com, juin 2025) identifie les marqueurs les plus précis pour ce genre : **phrases-résumé vides** (« By following these steps, we achieve better performance »), **sujet grammatical incorrect** (la phrase choisit le mauvais sujet, rendant l'écriture incohérente), **fluence sans compréhension** (texte correctement formulé qui n'explique rien, invente des termes inexistants comme « retrieval grounding »), **abus de pronoms démonstratifs** sans référent clair (« This creates friction in production » — mais qu'est-ce que « this » ?). Pour la documentation de code spécifiquement : l'IA fabrique des étapes d'instruction pour combler les lacunes (Pluralsight), ne peut pas expliquer le _pourquoi_ de la logique métier (seulement le _quoi_), rate les edge cases, et produit des suggestions qui **compilent mais causent des problèmes ultérieurs** — le type le plus dangereux. GitClear rapporte un **octuplement de la duplication de code** en 2024. Qodo Research estime que **25% des suggestions IA contiennent des erreurs factuelles ou fonctionnelles**. [EMPIRIQUE/PRATICIEN] Confiance : Élevée.

**Écriture académique / essais.** Elizabeth Steere (Inside Higher Ed, juillet 2024) documente : structure prévisible en 5 paragraphes, conclusions excessivement longues commençant par « Overall » ou « In summary », longueurs de paragraphes uniformes, et abus d'appositifs définissant des personnes/termes qu'un lecteur informé connaîtrait déjà. Pangram Labs révèle que **60-70% des prénoms** dans les textes générés par ChatGPT/Claude sont « Emily » ou « Sarah ». Le test de non-spécificité est central : l'IA évite les noms propres ou recourt aux plus génériques. [EMPIRIQUE/PRATICIEN]

**Fiction / écriture créative.** Chakrabarty et al. (arXiv 2409.14509, 2024) analysent les catégories d'édition nécessaires sur les sorties IA : **28% choix de mots maladroits**, **20% structure phrastique déficiente**, **18% exposition inutile/redondante**, **17% clichés**. Le syndrome de « self-containment » (Alexander Wales) : l'IA produit des textes autonomes même quand ils devraient être des fragments. La prose pourpre est endémique, surtout chez GPT-4o. Le défaut le plus révélateur : l'IA **expose le sous-texte** au lieu de le montrer. Une étude de l'University College Cork (2025) confirme que l'IA produit des « tightly grouped clusters reflecting narrow, consistent style » contre une variation bien plus grande chez les auteurs humains. [EMPIRIQUE]

**Email professionnel.** ZeroBounce (2025) rapporte que **24% des employés** utilisent l'IA quotidiennement pour rédiger des emails. **21%** ont surpris un collègue utilisant exactement le même email IA qu'ils avaient déjà vu, et **26%** suspectent avoir reçu une évaluation de performance rédigée par IA. Robert Thompson (Medium) nomme cela « the uncanny valley of your inbox » : « Grammar was perfect. Tone was professional. Structure was flawless. But something was wrong. » [PRATICIEN/EMPIRIQUE]

### Marqueurs structurels transversaux (au-delà du lexique)

Au-delà des marqueurs lexicaux déjà connus du lecteur, les recherches convergent sur des marqueurs **structurels, argumentatifs et stylistiques** spécifiques :

- **Rythme plat** : longueurs de phrases et paragraphes quasi-uniformes, absence de variation cadentielle (VERMILLION Framework, Shankar, Guo)
- **Équilibrage symétrique des sections** : sections de longueur quasi-identique, comme si le texte « load-balançait » ses idées (rubrique « AI Tells » de lmmx, GitHub 2025)
- **Confiance uniforme** : même niveau de certitude pour les affirmations triviales et controversées — absence de modulation épistémique (rubrique « AI Tells »)
- **Neutralité positionnelle** : refuse de s'engager, présente systématiquement « d'un côté… de l'autre » sans conclure (ibid.)
- **Absence d'arc d'apprentissage** : le texte arrive « fully formed », sans trace de confusion initiale, de correction en cours de route, ou de « I was wrong » (ibid.)
- **Nominalisation excessive** : texte lourd en noms, pauvre en verbes — Reinhart et al. (PNAS 2025) montrent que les LLM décalent systématiquement vers un style informationnel-académique (Dimension 1 de Biber), même quand on leur demande un registre casual
- **Prose nominale abstraite** : Jiang & Hyland (Written Communication, Applied Linguistics, 2025) documentent que les essais ChatGPT utilisent des « lexical bundles » plus rigides et formulaïques, dominés par des constructions nominales et prépositionnelles

[EMPIRIQUE/PRATICIEN] Confiance : Élevée.

---

## Section 3 — Grilles d'évaluation : qualité formelle vs qualité substantielle

### Framework VERMILLION (2025)

Publié dans Research Leap, ce framework à dix signaux diagnostiques offre une grille heuristique fondée sur la stylométrie et la linguistique cognitive. Chaque signal peut être évalué indépendamment :

|Signal|Substance (exemple positif)|Slop (exemple négatif)|
|---|---|---|
|**V** — Vocabulary patterns|Vocabulaire précis, technique quand nécessaire, familier quand approprié|Surreprésentation de termes « élevés » (delve, pivotal, nuanced)|
|**E** — Echoed sentence structures|Variation syntaxique naturelle|Répétition du même patron phrastique sur 3+ phrases consécutives|
|**R** — Rigid transitions|Transitions organiques, parfois abruptes|« Furthermore », « Moreover », « Additionally » en cascade|
|**M** — Mechanical rhythm|Alternance phrases courtes/longues, paragraphes d'une ligne|Longueur de phrases et paragraphes quasi-uniformes|
|**I** — Inflexible paragraphing|Paragraphes de longueurs variées, dont des one-liners percutants|Paragraphes systématiquement de 4-6 phrases|
|**L** — Lack of lived experience|Anecdotes spécifiques, noms propres, détails sensoriels|Généralités : « many developers find that... »|
|**L** — Lexical anomalies|Registre cohérent avec le contexte et l'auteur|Mots inhabituellement soutenus pour le contexte|
|**I** — Information sourcing|Citations spécifiques, données avec origine|« Studies have shown... », « Experts agree... »|
|**O** — Over-hedging|Modulation appropriée de certitude|« It's worth noting that... », « It's important to understand... »|
|**N** — Neutralized stance|Position claire, même si nuancée|Faux équilibre systématique sans conclusion|

[PRATICIEN] Confiance : Moyenne (framework non évalué empiriquement).

### Rubrique « AI Tells » (lmmx, GitHub, 2025)

La rubrique la plus complète identifiée, en six catégories. Les tells les plus discriminants pour un rédacteur technique :

**Voix et perspective** : « View from Nowhere » (pas de locuteur situé), « Missing the Why » (aucune motivation déclarée), « No Visible Learning » (le texte arrive formé, sans arc de découverte), « The Missing 'I Was Wrong' » (jamais de mise à jour des priors). **Texture épistémique** : « Uniform Confidence » (certitude plate quel que soit le poids de l'affirmation), « Positional Neutrality » (refus de s'engager), « Citation-as-Credential » (name-dropping sans explication). **Patterns structurels** : « Symmetric Load-Balancing » (sections de longueurs égales), « Throat-Clearing Opener » (paragraphe d'ouverture vide), « Missing Loose Threads » (pas de questions ouvertes, pas de tension non résolue). [PRATICIEN] Confiance : Moyenne.

### AROA : évaluation de l'originalité argumentative (Inoshita et al., arXiv, février 2026)

Ce framework évalue l'originalité (pas la qualité) à travers quatre composantes : rareté structurelle, rareté des claims, rareté des preuves, profondeur cognitive. **Découverte critique : corrélation négative forte entre qualité et rareté des claims** — les textes de haute qualité s'appuient sur des patterns d'argumentation typiques. Les essais IA atteignent une complexité structurelle comparable aux essais humains mais une rareté des claims substantiellement inférieure. **Les LLM reproduisent la forme de l'argumentation mais échouent sur l'originalité du contenu.** [EMPIRIQUE] Confiance : Élevée.

### Le test de The Economist

Le style guide de The Economist (12e éd.) fournit un test simple qui oppose directement substance et slop : « Articles should be like essays... each should be a coherent whole that will suffer if even one sentence is cut out. » **Test anti-slop : si l'on peut supprimer un paragraphe entier sans que le texte en souffre, ce paragraphe est du remplissage.** Et : « When you express opinions, do not simply make assertions. The aim is not just to tell readers what you think, but to persuade them; if you use arguments, reasoning and evidence, you may succeed. » [PRATICIEN] Confiance : Élevée.

### Méta-framework synthétique : quatre niveaux de qualité

L'analyse croisée de toutes les sources fait émerger une hiérarchie à quatre niveaux que les LLM maîtrisent de façon dégressive :

**Niveau 1 — Qualité formelle** (l'IA excelle) : grammaire, orthographe, fluidité, transitions. **Niveau 2 — Qualité structurelle** (l'IA gère partiellement) : organisation logique, présence apparente de claims/preuves/conclusions. **Niveau 3 — Qualité épistémique** (l'IA échoue systématiquement) : modulation de confiance, exemples spécifiques et vérifiables, engagement authentique avec les contre-arguments, reconnaissance des limitations. **Niveau 4 — Qualité vocale** (l'IA en est fondamentalement incapable) : perspective située, arc d'apprentissage, prise de position avec enjeux, expérience vécue, vulnérabilité, humour, idiosyncrasie.

**La question diagnostique clé** : ce texte changerait-il si l'auteur avait une expérience différente, une expertise différente, ou des valeurs différentes ? Si non — si n'importe qui aurait pu l'écrire — il manque de voix et de substance, indépendamment de sa qualité formelle. [CONSENSUS issu de la synthèse des sources] Confiance : Élevée.

---

## Section 4 — Données empiriques sur l'homogénéisation

### L'homogénéisation créative est démontrée à grande échelle

**Moon et al.** (ScienceDirect, 2025) : trois études pré-enregistrées sur **2 200 essais d'admission** comparant GPT-4 et humains. Chaque essai humain supplémentaire contribuait PLUS de nouvelles idées que chaque essai GPT-4. Le fossé de diversité **s'élargissait** avec le nombre d'essais. Améliorer les paramètres de créativité de GPT n'a PAS atténué l'écart. [EMPIRIQUE] Confiance : Élevée.

**Doshi & Hauser** (Science Advances 10(28), juillet 2024) : les histoires écrites avec ChatGPT étaient **plus uniformes** que celles écrites indépendamment. L'IA « démocratisait » la créativité en améliorant les auteurs les moins expérimentés, mais homogénéisait la production collective. [EMPIRIQUE] Confiance : Élevée.

**Padmakumar & He** (ICLR 2024) : les essais co-écrits avec InstructGPT montraient une homogénéisation supérieure à ceux écrits seuls ou avec GPT-3 base. **L'alignement par RLHF a été spécifiquement identifié comme réduisant la diversité des outputs** — GPT-3 de base ne causait PAS d'homogénéisation statistiquement significative. [EMPIRIQUE] Confiance : Élevée.

**Xu et al.** (PNAS, 2025) : nouveau score « Sui Generis » pour quantifier l'originalité des récits. Les métriques standard (compression ratio, self-BLEU, n-gram diversity) corrélaient faiblement avec les scores humains d'unicité (Spearman : 0.07, 0.33, 0.23). Les outputs LLM montraient une **homogénéisation significative au niveau de l'intrigue**. [EMPIRIQUE] Confiance : Élevée.

### Un résultat contraire important

**Fitterer, Gangl & Ulbrich** (ACL 2025, Student Research Workshop) ont comparé des articles d'actualité anglais de 2018 (pré-LLM) et 2024 (post-LLM) avec les métriques MATTR, Maas et MTLD. Résultat : **les effets d'homogénéisation ne se montrent PAS encore dans ces mesures** pour les articles de presse, bien que l'influence LLM soit apparente via un nouveau ratio « LLM-Style-Word Ratio ». Cela suggère que l'homogénéisation pourrait être plus subtile ou plus spécifique au domaine que supposé. [EMPIRIQUE] Confiance : Élevée.

### Le model collapse : une inévitabilité statistique

**Shumailov et al.** (Nature 631, juillet 2024, Oxford/Cambridge/Imperial College) : l'utilisation indiscriminée de contenu généré par modèle dans l'entraînement cause des défauts irréversibles. **Les queues de la distribution originale disparaissent.** Le phénomène est une inévitabilité statistique, démontré sur LLM, VAE et modèles gaussiens. [EMPIRIQUE] Confiance : Très élevée (Nature).

**Peterson** (arXiv 2404.03502, 2024-2025) modélise le « knowledge collapse » : une réduction de **20% du coût** du contenu IA génère des croyances publiques **2,3 fois plus éloignées de la vérité**. [EMPIRIQUE] Confiance : Élevée.

**Guo, Shang, Vazirgiannis & Clavel** (NAACL 2024, **étude dirigée par l'École Polytechnique et l'INRIA**) : déclin constant de la diversité des outputs à travers les itérations successives de fine-tuning. L'effet est particulièrement marqué pour les tâches exigeant une créativité élevée. Les tâches à basse entropie (résumé) sont moins affectées que celles à haute entropie (génération d'histoires). [EMPIRIQUE] Confiance : Élevée. **Seule étude majeure à composante française identifiée.**

### Le web est inondé : données quantitatives

**Ahrefs** (avril 2025, 900 000 pages analysées) : **74,2% des nouvelles pages web** contiennent du contenu IA. Seulement 2,5% sont « pure IA », 71,7% sont mixtes humain+IA, 25,8% purement humaines. Corrélation entre contenu IA et position Google : **0,011** (essentiellement zéro). [EMPIRIQUE] Confiance : Moyenne (détecteur propriétaire).

**Graphite/Axios** (2025, 65 000 URLs du Common Crawl) : avant ChatGPT ~5% IA, fin 2022 ~10%, 2024 40%+, **novembre 2024 : 50,3%** — le contenu IA dépasse brièvement le contenu humain. **~10 milliards de pages IA publiées depuis 2023** [estimé]. [EMPIRIQUE] Confiance : Moyenne.

**Originality.AI — suivi des SERPs Google** : de 2,27% pré-2020 à **19,56% en juillet 2025** dans le top-20 Google — augmentation d'environ 400%. [EMPIRIQUE] Confiance : Moyenne (biais commercial potentiel, mais données longitudinales utiles).

**Imperva 2025** : le trafic bot a atteint **51% de tout le trafic web en 2024** — première fois qu'il dépasse le trafic humain. **NewsGuard** : les sites d'« actualités » IA sont passés de 49 à **1 271** entre mai 2023 et mai 2025. [EMPIRIQUE] Confiance : Élevée.

### Impact mesurable sur l'engagement et le SEO

L'engagement avec les articles générés par IA a chuté de **40% en 2024** (chercheurs Olin, via ListenFirst). NP Digital rapporte que le contenu humain gagne **5,44× plus de trafic** que le contenu IA. **38% des consommateurs** expriment ouvertement du scepticisme envers le contenu IA. [EMPIRIQUE/DATA] Confiance : Moyenne (sources industrielles).

Google a infligé des actions manuelles à **1 446 sites web** lors de la Core Update de mars 2024, avec une perte cumulative de trafic estimée à **~20 millions de visiteurs/mois**. Parmi les sites de voyage ayant perdu 90%+ de visibilité, « le contenu généré par IA se distinguait le plus » (Amsive). [EMPIRIQUE] Confiance : Élevée.

### Dimension française : un angle mort empirique

**Aucune étude empirique dédiée mesurant l'homogénéisation du contenu web francophone post-LLM n'a été identifiée.** [INCERTAIN] Les observations de praticiens francophones (Digital Artness, Siècle Digital, MBA DMB) notent les mêmes patterns — « même ton, même vocabulaire, mêmes structures » — et le travail académique français se concentre sur les aspects computationnels (Guo et al. à Polytechnique, Bertrand et al. à Mila/INRIA) plutôt que sur l'analyse du corpus francophone. Un rapport EY Suisse (en français) note que le contenu IA est « prévisible et standardisé ». Une ressource UNESCO en français observe que ChatGPT est « multilingue mais monoculturel » — entraîné sur du texte anglais avec des biais culturels américains. **Cet angle mort représente une opportunité de recherche et de contenu original pour le blog de l'auteur.** Confiance de l'observation : Élevée.

---

## Section 5 — Stratégies anti-slop et workflows documentés

### Phase « Avant » — préparer avant de prompter

**Définir sa thèse unique avant toute interaction IA.** Le test le plus simple : si vous ne pouvez pas résumer votre point de vue original en une phrase AVANT de prompter l'IA, votre contenu sera du slop (Brownell, Descript Blog). Écrire d'abord ses points principaux à la main, utiliser l'IA pour affiner. [PRATICIEN]

**Définir sa voix en 3 phrases.** Si vous ne pouvez pas décrire votre voix d'écriture en 3 phrases, votre contenu IA sonnera générique (Brownell). [PRATICIEN]

**Rassembler des « signaux d'expérience ».** Screenshots de projets réels, données originales, exemples de code tirés de votre travail, anecdotes spécifiques. Ces éléments satisfont le E-E-A-T de Google (Experience, Expertise, Authoritativeness, Trustworthiness) et sont impossibles à fabriquer par un LLM. [PRATICIEN/CONSENSUS]

**Publier une politique de transparence IA** sur le blog — particulièrement important pour Medium (qui interdit le contenu IA non divulgué derrière le paywall depuis mai 2024), et comme signal de confiance pour un public français où seulement 15% des professionnels utilisent l'IA au travail (Ipsos, janvier 2025). [PRATICIEN]

### Phase « Pendant » — collaborer sans produire du slop

**Les 15 règles anti-slop de Hamel Hussain** (ML engineer, hypeflo.ws, 2025) à inclure dans chaque prompt comme instructions système. Les plus impactantes pour un rédacteur technique : (1) Chaque phrase doit être information-dense, pas de répétition/remplissage. (2) Mots courts > mots longs, moins de mots > plus de mots. (3) Éviter les exemples multiples quand un seul point clair suffit. (4) Supprimer les phrases qui reformulent la prémisse. (5) Couper les transitions creuses (« Understanding X helps you Y... »). (6) Commencer les sections par le contenu, pas par des déclarations d'importance. (7) Supprimer les phrases d'amorce (« It's worth noting that... »). (8) Remplacer les tirets cadratins par une ponctuation plus simple. (9) Faire confiance à l'intelligence du lecteur. [PRATICIEN] Confiance : Élevée (largement cité).

**Utiliser l'IA pour la structure et les brouillons, jamais pour l'idée originale.** (Brownell, The Writer). Spécifier des exemples concrets plutôt que « écris sur X ». [PRATICIEN]

### Phase « Après » — éditer, diagnostiquer, enrichir

**Supprimer 50% du output IA.** Hussain préconise une suppression agressive d'au moins la moitié. Supprimer tout ce qui reformule, explique l'importance, utilise des transitions creuses, fournit des exemples multiples quand un seul suffit, ou inclut du méta-commentaire. [PRATICIEN]

**Le test de la substituabilité** (7Vs Checklist, Madsen & Puyt, SSRN 2025) : « If you can swap the subject, names, and locations and it remains equally valid, the content is likely slop. » [PRATICIEN]

**Cinq tests diagnostiques** synthétisés des sources multiples :

- **Test du swap** : remplacer sujets/noms/lieux — toujours valide ? → slop
- **Test de la voix** : peut-on identifier l'auteur à la lecture seule ? Sinon → générique
- **Test du « so what »** : chaque paragraphe ajoute-t-il de l'information nouvelle ? Si on peut supprimer un paragraphe sans perte → slop (cf. test The Economist)
- **Test de l'anecdote** : contient-il une expérience que seul cet auteur pourrait avoir ?
- **Test de la spécificité** : les affirmations sont-elles appuyées par des exemples/données/dates issus de l'expérience de l'auteur ?

[PRATICIEN/CONSENSUS]

**La disfluence délibérée comme outil d'auto-édition.** La recherche sur le « processing fluency bias » (Reber & Schwarz, 1999 ; Schwarz et al., USC) montre que les stimuli traités fluemment sont jugés PLUS VRAIS et de MEILLEURE QUALITÉ — même quand la fluence vient de facteurs superficiels. L'IA produit du texte optimisé pour la fluence, déclenchant ce biais au premier passage. **Contre-mesure : relire son texte IA dans une police laide, imprimé, ou après un délai de 24h.** Cela perturbe le biais de fluence et permet d'évaluer la substance indépendamment du style. [EMPIRIQUE] Confiance : Élevée.

**La taxonomie des erreurs d'O'Brien** (obrien.vision, juin 2025) : plutôt qu'un vague « ça semble IA », taguer les types d'échecs spécifiques pendant la revue — Synthetic Truth Failures (faits incorrects), Topic/Persona Drift (dérive thématique), Verbosity Compensation (remplissage verbal masquant l'incertitude). [PRATICIEN]

### Outils et actions techniques

**Kagi SlopStop** (lancé 12 novembre 2025) : système communautaire de signalement du slop dans les résultats de recherche. Les domaines signalés sont dérankés. 3 000+ rapports la première semaine. [PRATICIEN]

**GitHub Anti-Slop Action** (peakoss/anti-slop) : Action GitHub qui détecte et ferme automatiquement les pull requests IA de faible qualité. Vérifie : auteurs de commits bloqués, termes interdits, réactions négatives, qualité de description. Pertinent pour le développeur maintenant des projets open-source. [PRATICIEN]

**Slop Evader** (extension navigateur par l'artiste Tega Brain) : filtre les résultats de recherche pour n'afficher que le contenu publié avant le 30 novembre 2022. [PRATICIEN]

### Politiques des plateformes

**Medium** (mai 2024) : le contenu IA ne peut pas être monétisé dans le Partner Program ; le contenu IA non divulgué est limité aux abonnés de l'auteur (« Network Only »). Divulgation obligatoire dans les deux premiers paragraphes pour le contenu assisté par IA. [CONSENSUS]

**Stack Overflow** : interdiction totale des réponses générées par IA depuis décembre 2022. Un contributeur à 1M+ de réputation (VonC) a été pris avec ~1 850 réponses en partie IA, toutes supprimées. Les questions ont chuté de **78% en glissement annuel** (3 862 en décembre 2025 vs 200K/mois au pic de 2014). [EMPIRIQUE]

**Google** (developers.google.com, mis à jour décembre 2025) : ne pénalise PAS automatiquement le contenu IA mais exige le E-E-A-T. Le contenu IA créé « primarily to manipulate rankings » = spam (« scaled content abuse »). Les images IA doivent contenir des métadonnées IPTC DigitalSourceType. [CONSENSUS]

**Substack** : aucune politique formelle — chaque publication définit sa propre politique. **Dev.to et Hashnode** : pas de politique anti-IA identifiée. Hashnode intègre même des outils IA dans son éditeur. [PRATICIEN]

**C2PA** (Coalition for Content Provenance and Authenticity) : standard technique ouvert pour intégrer des métadonnées cryptographiques de provenance, adopté par Google, Adobe, TikTok, Meta, BBC, et en cours de standardisation ISO. La NSA a recommandé son adoption en janvier 2025. [CONSENSUS]

---

## Section 6 — Contrepoints et limites du concept

### La médiocrité n'a pas attendu l'IA

L'argument le plus développé vient de **Francesco D'Isa** (The Philosophical Salon, 1er décembre 2025) : « The majority of human production has always been slop. Mediocrity is not a bug of technology; it is the baseline of culture. » Il invoque la loi de Sturgeon, les media panics historiques documentées par Kirsten Drotner, et soutient que « blaming AI for our own mediocrity is another way of denying its continuity with us. » **Scientific American** (Deni Ellis Béchard, 2025) fournit les parallèles historiques : chapbooks et ballades de colportage post-Gutenberg, Grub Street (XVIII^e), cinéma B. La conclusion clé : « The production of new types of slop widens the on-ramps, allowing more people to participate. » [OPINION/ANALYSE] Confiance : Élevée (argumentation solide). **Mais** la différence est que le coût de production du slop IA tend vers zéro tandis que le coût cognitif pour le consommateur reste constant.

### La démocratisation est réelle

**MIT Technology Review** (23 décembre 2025) présente le « generous reading » : le slop IA est « a kind of democratization. A rare skill shifts away from craftsmanship to something closer to creative direction. » Un créateur IA interviewé note : « It's very easy to copy the style... but they don't understand why I'm doing it. » [OPINION] **L.M. Sacasas** (The Convivial Society) apporte une nuance cruciale : l'IA « réussit » parce que beaucoup de tâches étaient déjà « formulaic, mechanistic, and predictable: thoughtless writing, box-checking busy work, bureaucratic hoop-jumping, the generation of meaningless content. » Le slop rend visible ce qui était déjà vide. [ANALYSE] Confiance : Élevée.

### Le concept est mal défini

**Michael Hiltzik** (LA Times, décembre 2025) : « The problem with this complaint is that almost no one makes the effort to define 'AI slop.' » Il note que la critique de Gioia reproduit presque mot pour mot les critiques du pop art dans les années 1950-60. L'étude académique de Kommers et al. confirme que « slop has so far resisted formal definition » et que les frontières précises entre slop et non-slop sont « impossible ». Shaib et al. (arXiv 2509.19163) montrent empiriquement que les jugements binaires « slop / pas slop » sont subjectifs et ne corrèlent que faiblement avec les métriques textuelles. [EMPIRIQUE/OPINION] Confiance : Élevée.

### L'abondance crée la rareté

**Posting Nexus** (Substack) cite Doug Shapiro : « Abundances actually amplify existing scarcities. » Le slop proliférant, le contenu de qualité devient PLUS précieux. Les plateformes à abonnement (Substack) en sont la preuve : si l'écriture est médiocre, les gens ne paieront pas. **La « loi de Gresham informationnelle »** (D. Corney, janvier 2023 ; Mental Garden, Medium) offre le contre-argument : comme les mauvaises monnaies chassent les bonnes, le contenu de faible valeur — ayant le même « face value » apparent (même ranking, même engagement) — prolifère aux dépens du bon. Les deux dynamiques coexistent probablement : Gresham dans les espaces ouverts (web, réseaux sociaux), rareté-valeur dans les espaces fermés (newsletters, communautés payantes). [ANALYSE] Confiance : Moyenne (modèles conceptuels, pas empiriques).

### Le biais de détection s'auto-alimente

La recherche sur la détection montre que **les détecteurs deviennent moins fiables** à mesure que les modèles s'améliorent. EvoBench (ACL 2025) documente un « clear decline in average detection performance as the LLM updates. » Binoculars n'atteint que **55,15% AUROC** pour détecter les textes Claude, contre 88%+ pour d'autres modèles. La distinction binaire humain/IA perd son sens à mesure que l'écriture hybride se normalise (arXiv 2510.20810, NeurIPS 2025). **Risque pour le concept de slop** : si la détection devient impossible, le concept perd son ancrage dans l'origine du texte et ne peut s'appuyer que sur des critères de qualité — ce qui nous ramène à des questions éditoriales pré-IA. [EMPIRIQUE] Confiance : Élevée.

### La dimension du Sud global

Le discours sur le slop est **massivement anglo-américain**. Nature Machine Intelligence (2025) documente que les LLM « trained mainly on English and Western culture-centric data, perform badly in non-Western contexts. » AfroBench identifie des lacunes majeures pour les 64 langues africaines testées. NORRAG Education note que « English-speakers have an advantage. The underprivileged ones could be Catalan-, Igbo-, Quechua- or Spanish-speakers. » Paradoxalement, la production de slop est en partie une activité économique du Sud global : Snopes rapporte que les « AI slop news stories » proviennent souvent de sites basés au Vietnam. L'économie mondiale des « data laborers » est estimée entre **150 et 430 millions de travailleurs** (Banque mondiale, via Brookings). La critique du slop risque de devenir un discours de classe si elle ignore ces asymétries. [EMPIRIQUE/ANALYSE] Confiance : Élevée.

### La dimension française du débat

BPI France (2025) offre la nuance la plus pertinente en français : « Le slop n'est pas synonyme de contenu populaire, pas même de vulgarisation. [Sa critique] ne remet pas nécessairement en cause l'utilisation de l'intelligence artificielle... mais pointe le renoncement aux critères éditoriaux, à la hiérarchisation, à la vérification et à l'intention. » Une donnée saisissante : **34% des titres téléchargés quotidiennement sur Deezer sont entièrement générés par IA, soit 50 000 titres par jour** (Ipsos/Deezer, novembre 2025). Adam Mosseri (Instagram) a lui-même admis que « l'existence du slop IA pouvait nuire à la plateforme. » [EMPIRIQUE/OPINION] Confiance : Élevée.

---

## Synthèse opérationnelle : ce qui est nouveau et actionnable

Ce rapport enrichit les connaissances existantes du lecteur sur cinq axes principaux.

**Premier axe : la définition a mûri.** Le slop n'est plus un vague qualificatif — il possède désormais des propriétés prototypiques formalisées (Kommers et al.), une définition dictionnaire (Merriam-Webster), et une double condition opérationnelle (Willison : non sollicité + non révisé). La définition philosophique de Baker (antihaecceity) offre un cadre conceptuel puissant pour un article de blog. Le terme français reste instable, ce qui est en soi un sujet d'écriture intéressant.

**Deuxième axe : les preuves empiriques de l'homogénéisation sont désormais solides.** Cinq études peer-reviewed convergent (Moon, Doshi & Hauser, Padmakumar & He, Xu, Anderson) pour démontrer que l'usage des LLM homogénéise la production collective, même quand il améliore les individus. Le résultat de Padmakumar & He est particulièrement percutant pour un article technique : c'est l'**alignement RLHF** — la procédure qui rend les modèles « utiles » — qui réduit la diversité. Le model collapse (Shumailov, Nature) en fait une inévitabilité mathématique.

**Troisième axe : les marqueurs dépassent largement le lexique.** Les frameworks VERMILLION, AI Tells (lmmx), et AROA fournissent des grilles structurelles, argumentatives et vocales directement utilisables dans un workflow d'édition. Le résultat de Reinhart et al. (PNAS) — les LLM décalent systématiquement vers le style informationnel-académique de Biber, même quand on leur demande un registre différent — est un marqueur structurel puissant à tester.

**Quatrième axe : le « processing fluency bias » explique l'uncanny valley éditorial.** Le texte IA passe au premier passage parce que notre système cognitif assimile fluence à vérité et qualité. La contre-mesure empiriquement fondée — la disfluence délibérée (changer de police, imprimer, attendre 24h) — est intégrable immédiatement dans un workflow.

**Cinquième axe : l'absence de données francophones est une opportunité.** Aucune étude empirique de l'homogénéisation du contenu web francophone n'existe. Pour un blogueur technique bilingue, c'est un terrain vierge — une analyse même modeste des marqueurs LLM dans le corpus francophone (le « dans un monde en constante évolution » comme « delve » français) constituerait une contribution originale.