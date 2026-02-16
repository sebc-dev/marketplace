# Délégation cognitive aux LLM : quand l'outil d'écriture court-circuite l'apprentissage

**L'utilisation non structurée des LLM pour la rédaction dégrade la rétention, la pensée critique et la métacognition** — c'est ce que converge désormais un corpus empirique solide (2023-2025). L'effet est mesurable : dans un essai randomisé contrôlé, les utilisateurs de ChatGPT ont retenu **11 points de pourcentage de moins** que le groupe contrôle après 45 jours (Cohen's d = 0.68). Le mécanisme central est la suppression de ce que la psychologie cognitive appelle la « charge germane » — l'effort mental qui construit les schémas en mémoire à long terme. La bonne nouvelle : le workflow « rédiger d'abord, faire relire par l'IA ensuite » préserve la quasi-totalité des bénéfices d'apprentissage tout en exploitant les forces de l'IA. Ce rapport cartographie les concepts, les preuves, le réseau académique, et les garde-fous concrets pour un auteur technique qui apprend en public.

---

## Section 1 — Cartographie conceptuelle

|Concept|Définition précise|Auteur(s) de référence|Publication clé|Relation avec les LLM|
|---|---|---|---|---|
|**Cognitive offloading** (décharge cognitive)|Usage d'une action physique ou d'un outil externe pour réduire la demande cognitive d'une tâche. Neutre quant aux conséquences — peut être bénéfique ou nocif selon ce qui est déchargé.|Risko, E. F. & Gilbert, S. J.|_Trends in Cognitive Sciences_, 20(9), 676-688 (2016)|Les LLM amplifient massivement le offloading : ils ne stockent pas seulement l'information mais la traitent, l'analysent et la génèrent. Le offloading bénéfique réduit la charge _extraneous_ ; le offloading nocif élimine la charge _germane_.|
|**Cognitive outsourcing** (externalisation cognitive)|Délégation de la collecte _et du traitement_ de l'information à un agent externe, incluant le jugement et la génération. Connotation plus forte de remplacement que le offloading.|Ahlstrom-Vij, K. (philosophie) ; Tao, Zhang & Liu (psychologie AI)|_Philosophical Issues_, 26, 7-24 (2016) ; _Social Behavior and Personality_, 52(12) (2024)|Quand l'IA rédige _à la place de_ l'humain, on passe du offloading à l'outsourcing : le traitement sémantique profond — celui qui produit l'apprentissage — est délégué.|
|**Metacognitive laziness** (paresse métacognitive)|Réduction de l'engagement dans les processus d'autorégulation (planification, monitoring, évaluation) induite par la disponibilité d'un assistant IA.|Fan, Y. et al.|_British Journal of Educational Technology_, 56(2), 489-530 (2025) ; DOI: 10.1111/bjet.13544|Les étudiants utilisant ChatGPT montrent moins de processus métacognitifs et s'appuient sur l'IA au lieu de réfléchir de façon autonome. Performance immédiate améliorée, gain de connaissances nul.|
|**Generation effect** (effet de génération)|Avantage mnésique robuste pour l'information activement générée par l'apprenant vs passivement lue. Taille d'effet : d ≈ 0.40 (méta-analyse, 86 études).|Slamecka, N. J. & Graf, P.|_Journal of Experimental Psychology: Human Learning & Memory_, 4(6), 592-604 (1978)|Écrire soi-même active un réseau cortical préfrontal-postérieur (IFG, PHG, ACC, LOC). Lire la sortie d'un LLM ne produit **aucune activation différentielle significative** (Rosner et al., 2013, _Cortex_).|
|**Desirable difficulties** (difficultés souhaitables)|Conditions d'apprentissage qui ralentissent la performance apparente mais renforcent la rétention et le transfert à long terme, via un encodage plus profond.|Bjork, R. A. & Bjork, E. L.|Bjork (1994), in _Metacognition: Knowing about Knowing_, MIT Press ; Bjork & Bjork (2011)|Les LLM **éliminent systématiquement** les difficultés souhaitables : texte fluide instantané (pas de lutte générative), réponses immédiates (pas d'effort de récupération), résultat poli (pas de révision itérative).|
|**Testing effect** (effet de test / _retrieval practice_)|Phénomène selon lequel récupérer une information en mémoire renforce la rétention à long terme davantage qu'une étude additionnelle du même matériel, même sans feedback. Taille d'effet : g ≈ 0.50 (trois méta-analyses convergentes : Rowland 2014, Adesope et al. 2017, Yang et al. 2021).|Roediger, H. L., III & Karpicke, J. D.|_Psychological Science_, 17(3), 249-255 (2006) ; _Perspectives on Psychological Science_, 1(3), 181-210 (2006)|Écrire de mémoire avant de consulter un LLM active simultanément le _testing effect_ (récupération intentionnelle) et le _generation effect_ (production active). La combinaison est plus puissante que chaque effet isolé. L'illusion métacognitive documentée par Roediger & Karpicke — l'étude répétée _semble_ plus efficace alors qu'elle produit 56 % d'oubli vs 13 % pour le test — cartographie exactement le piège de la délégation IA.|
|**Deskilling** (déqualification)|Atrophie des compétences cognitives ou pratiques due à la délégation prolongée à un système automatisé. Documenté pour le GPS, les correcteurs orthographiques, l'automatisation comptable.|Rinta-Kahila et al. (2023) ; Bainbridge, L. (1983, « ironies de l'automatisation »)|_J. of the Association for Information Systems_, 24(5), 1378-1412 (2023)|Cycle vicieux : plus on délègue → moins on pratique → plus on _doit_ déléguer. L'endoscopie médicale (Budzyń et al., 2025, _Lancet_) montre un deskilling mesurable après exposition à l'IA.|
|**Extended cognition** (cognition étendue)|Thèse selon laquelle certains processus cognitifs s'étendent au-delà du cerveau pour inclure des outils externes (carnet, smartphone, IA), si ceux-ci sont disponibles, fiables et automatiquement approuvés.|Clark, A. & Chalmers, D. J.|_Analysis_, 58(1), 7-19 (1998)|Tension fondamentale : l'IA est-elle une _extension_ cognitive (augmentation) ou un _remplacement_ cognitif (extraction) ? Yadav (2025) propose que le offloading est une « réponse compensatoire à la fatigue cognitive », pas une extension naturelle.|
|**Cognitive debt** (dette cognitive)|Accumulation de coûts cognitifs différés (pensée critique affaiblie, mémoire réduite, créativité diminuée) en échange de gains d'efficacité immédiats via l'IA. Analogie directe avec la dette technique.|Kosmyna, N. et al. (MIT Media Lab)|arXiv:2506.08872 (2025) — _preprint, non encore peer-reviewed_|Connectivité neurale réduite de **55 %** chez les utilisateurs de ChatGPT vs rédacteurs autonomes. 83 % des utilisateurs de LLM incapables de citer leur propre essai. Effets persistants après retrait de l'outil.|

### Le continuum offloading → outsourcing : cinq critères de démarcation

La littérature converge vers un **continuum** plutôt qu'une frontière nette, modulé par cinq critères :

1. **Qui fait le traitement sémantique ?** Si c'est l'IA, c'est de l'outsourcing. (Principe de Peps McCrea : « whoever does the thinking gets the learning. »)
2. **La charge germane est-elle préservée ?** (Sweller) — L'offloading bénéfique réduit la charge extraneous ; l'outsourcing nocif réduit la charge germane.
3. **Les difficultés souhaitables sont-elles maintenues ?** (Bjork) — Si l'outil élimine l'effort de génération, de récupération, d'organisation, le bénéfice d'apprentissage disparaît.
4. **Le monitoring métacognitif reste-t-il actif ?** (Fan et al., 2024) — L'outsourcing s'accompagne de paresse métacognitive mesurable.
5. **L'outil est-il un échafaudage ou un substitut ?** — Un échafaudage soutient l'apprenant dans une zone de développement proximal ; un substitut le remplace.

---

## Section 2 — Synthèse des preuves empiriques

### Impact sur la mémoire et la rétention

L'étude la plus directe est celle de **Barcaui (2025)**, un essai randomisé contrôlé (N=120 étudiants) publié dans _International Journal of Information Management Data Insights_. Le groupe ChatGPT a obtenu **57,5 % de bonnes réponses** à un test de rétention 45 jours après l'apprentissage, contre **68,5 %** pour le groupe apprentissage traditionnel — soit un écart de 11 points avec une taille d'effet **d = 0.68** (effet moyen-fort), p = 0,002. La limite principale est la restriction à un seul domaine (concepts d'IA) dans une seule institution.

**Stadler, Bannert & Sailer (2024)** complètent ce tableau dans _Computers in Human Behavior_ (N=91). Les étudiants utilisant ChatGPT-3.5 pour une tâche de recherche ont expérimenté une charge cognitive significativement plus faible sur _toutes_ les dimensions — y compris la charge germane. Résultat paradoxal : ils ont produit un **raisonnement de qualité inférieure** dans leurs recommandations finales comparé au groupe Google Search. L'IA a réduit l'effort qui produit l'apprentissage.

L'étude de la **Wharton School (Bastani et al., 2024)**, bien que working paper non encore publié en revue, impressionne par son échelle : **~1 000 lycéens turcs** dans un essai randomisé à trois bras. Le groupe GPT Base (ChatGPT standard) a réalisé +48 % sur les exercices pratiques mais a scoré **17 % en dessous** du groupe contrôle aux examens sans assistance. Le groupe GPT Tutor (interface Socratique avec indices mais sans réponses directes) n'a montré aucune dégradation — preuve que le _design_ de l'interaction, pas l'IA elle-même, détermine l'effet sur l'apprentissage.

### Impact sur la pensée critique et l'engagement cognitif

**Lee, Sarkar, Tankelevitch et al. (2025)**, dans une étude Microsoft Research/Carnegie Mellon présentée à **ACM CHI '25** (N=319 knowledge workers, 936 exemples de tâches réelles), ont trouvé que **69-79 % des travailleurs** rapportent un effort réduit pour les activités de pensée critique quand ils utilisent de l'IA générative. Une confiance élevée dans l'IA prédit moins de pensée critique ; une confiance élevée en soi-même prédit plus de pensée critique. Seuls **36 % des participants** déclarent utiliser la pensée critique pour atténuer les risques liés à l'IA. La limite majeure est le design cross-sectionnel et les mesures auto-rapportées.

**Gerlich (2025)** dans _Societies_ (N=666, méthodes mixtes) identifie une **corrélation négative significative** entre la fréquence d'utilisation d'outils IA et les capacités de pensée critique, avec le cognitive offloading comme variable médiatrice. Les **participants plus jeunes** montrent une dépendance accrue et des scores de pensée critique plus bas — un résultat particulièrement préoccupant pour les développeurs juniors.

L'étude MIT « Your Brain on ChatGPT » (**Kosmyna et al., 2025**, arXiv:2506.08872) apporte des données neurophysiologiques préliminaires fascinantes mais à interpréter avec prudence. Sur 54 participants suivis sur 4 mois avec EEG 32 canaux, les utilisateurs de ChatGPT montrent la **connectivité cérébrale la plus faible** de tous les groupes, avec une réduction progressive des réseaux alpha et bêta au fil des sessions. **83 % des utilisateurs de LLM** ne pouvaient pas citer des passages de leurs propres essais. Lorsque les utilisateurs de LLM ont été basculés en condition « cerveau seul » (session 4), leur activité neurale restait significativement plus faible — suggérant des effets persistants. **Caveats importants** : preprint non peer-reviewed, très petit N (18 pour la session 4), participants d'universités d'élite de Boston, critiques méthodologiques publiées (arXiv:2601.00856).

### La paresse métacognitive — l'étude clé

L'article de référence est **Fan et al. (2024/2025)** dans le _British Journal of Educational Technology_, 56(2), 489-530, DOI: 10.1111/bjet.13544. Étude expérimentale randomisée en laboratoire (N=117 étudiants universitaires) comparant quatre conditions : ChatGPT, expert humain, outils checklist, pas d'outil supplémentaire. Les participants réalisaient une tâche de rédaction d'essai sur l'IA dans l'éducation.

Résultats clés : **aucune différence de motivation** entre les groupes, mais des **différences significatives dans les processus d'autorégulation**. Le groupe ChatGPT a montré moins de processus métacognitifs (évaluation, orientation, planification) et a centré son processus de révision sur les interactions avec ChatGPT plutôt que sur la réflexion autonome. ChatGPT a **significativement amélioré la qualité des essais** mais n'a produit **aucun gain significatif en acquisition de connaissances ni en transfert**. Le concept de « paresse métacognitive » est introduit : gains de performance à court terme au prix du développement de compétences authentiques. Les étudiants ont fréquemment copié-collé depuis ChatGPT malgré des consignes contraires — un pattern comportemental que le process mining a permis d'identifier objectivement.

La force de cette étude réside dans sa rigueur méthodologique : design randomisé, données multi-canal (traces d'activité, questionnaires, scores d'essais, tests de connaissances), process mining des séquences d'autorégulation. Limite : setting de laboratoire (validité écologique limitée), tâche unique, durée courte.

### L'illusion de compréhension et la disruption métacognitive

**Fernandes et al. (2026)** dans _Computers in Human Behavior_ (DOI: 10.1016/j.chb.2025.108779) montrent sur ~500 participants que les utilisateurs de ChatGPT pour des tâches de raisonnement logique (LSAT) **surestiment systématiquement leur performance cognitive**. La plupart ne promptent ChatGPT qu'une seule fois par question — un « offloading cognitif » sans engagement critique. Résultat frappant : l'effet Dunning-Kruger **cesse d'exister** avec l'IA — l'outil aplatit les différences de calibration basées sur les compétences réelles.

**Messeri & Crockett (2024)** dans _Nature_ (627, 49-58, 373+ citations) théorisent les « illusions de compréhension » créées par l'IA dans la recherche scientifique : les chercheurs croient comprendre plus qu'ils ne comprennent réellement. Quatre types d'illusions identifiés : ampleur exploratoire, profondeur explicative, objectivité, compréhension. Risque de « monocultures scientifiques » où les méthodes dominantes étouffent les alternatives.

### Corpus PMC/PubMed sur le cognitive outsourcing (2024–2026)

Le terme « cognitive outsourcing » n'est pas un descripteur MeSH standard ; les articles pertinents sur PubMed utilisent _cognitive offloading_, _automation bias_, _deskilling_, ou _cognitive dependency_.

**León-Domínguez (2024)** dans _Neuropsychology_ (38(4):293-308, PMID: 38300581, DOI: 10.1037/neu0000948) propose trois hypothèses prospectives sur la manière dont les chatbots IA pourraient influencer les processus cognitifs des générations à venir. En s'appuyant sur l'hypothèse du « recyclage neuronal », il argue que les chatbots IA agissent comme des « prothèses cognitives » empêchant la stimulation des fonctions exécutives d'ordre supérieur, menant à l'atrophie cognitive.

**Heersmink (2024)** — _correction bibliographique_ : l'article est publié dans _Nature Human Behaviour_ (pas PNAS Nexus), sous le titre _Use of large language models might affect our cognitive skills_ (PMID: 38519731, DOI: 10.1038/s41562-024-01859-y). C'est un commentaire utilisant le cadre de la cognition étendue/distribuée pour analyser l'interaction humain-LLM.

**Østergaard (2026)** dans _Acta Psychiatrica Scandinavica_ (PMID: 41565304, DOI: 10.1111/acps.70069) utilise explicitement le terme « outsourcing » du raisonnement scientifique et développe le concept de « dette cognitive » — l'accumulation de coûts cognitifs à long terme de la sur-dépendance à l'IA. Cite directement Kosmyna et al. et León-Domínguez.

**Dergaa et al. (2024)** dans _Frontiers in Artificial Intelligence_ (PMC11020077) proposent trois « hypothèses d'ajustement cognitif » — somme nulle, ajustement doux, ajustement dur — décrivant un spectre d'impacts des chatbots IA sur l'attention, la fonction exécutive, le langage, la mémoire et la cognition sociale.

**Zhai, Wibowo et Li (2024)** dans _Smart Learning Environments_ (11(1):28, DOI: 10.1186/s40561-024-00316-7) constituent la revue systématique la plus pertinente : la sur-dépendance aux systèmes de dialogue IA **diminue la pensée critique et la prise de décision indépendante**, même quand l'efficacité s'améliore.

**Note méthodologique** : plusieurs études clés de ce rapport (Fan et al. dans _BJET_, Gerlich dans _Societies_, Kosmyna et al. sur arXiv) ne sont _pas_ indexées dans MEDLINE/PubMed. Le corpus PMC couvre principalement l'angle neuroscientifique et clinique du phénomène ; les preuves éducatives et comportementales se trouvent dans des bases complémentaires (ERIC, Scopus, Web of Science).

### Productivité vs apprentissage : le paradoxe fondamental

**Wu et al. (2025)** dans _Scientific Reports_ (N=3 562, quatre expériences répliquées) démontrent que la collaboration humain-IA générative **améliore significativement la performance immédiate** mais que cette augmentation **ne persiste pas** dans les tâches indépendantes suivantes. Le passage de l'assistance IA au travail solo provoque une **baisse significative de la motivation intrinsèque** et une **augmentation de l'ennui** (p < 0,001). L'IA crée une dépendance motivationnelle en plus de la dépendance cognitive.

L'étude Harvard/BCG de **Dell'Acqua et al. (2023)** (N=758 consultants BCG) montre que pour les tâches « within the frontier » de l'IA, la productivité augmente de **+12,2 %**, la vitesse de **+25,1 %**, et la qualité de **+40 %**. Mais pour les tâches « outside the frontier », la productivité apparente augmente tandis que la **précision chute significativement** — une « combinaison dangereuse ». L'homogénéisation des outputs est un effet secondaire documenté. Observation critique pour le deskilling : déléguer les tâches « within-frontier » à l'IA prive les juniors des opportunités de développement.

### Les parallèles de deskilling : GPS, correcteurs, automatisation

La littérature sur le **GPS et la cognition spatiale** est la plus robuste (10+ études). **Dahmani & Bohbot (2020)** montrent sur N=50 conducteurs suivis sur 3 ans qu'une plus grande utilisation du GPS prédit un déclin plus prononcé de la mémoire spatiale. **Javadi et al. (2017)** en IRMf confirment que la navigation basée sur la mémoire augmente l'activité hippocampique et préfrontale ; la navigation GPS ne le fait pas. **Maguire et al. (2000)** ont montré que les chauffeurs de taxi londoniens, qui mémorisent 25 000 rues, développent des hippocampes physiquement plus volumineux — preuve que la pratique construit littéralement l'architecture neurale.

En médecine, **Budzyń et al. (2025)** dans _The Lancet Gastroenterology & Hepatology_ documentent un deskilling clinique mesurable : le taux de détection d'adénomes par les endoscopistes a chuté de **28,4 % à 22,4 %** après exposition routinière à la détection de polypes assistée par IA. **Rinta-Kahila et al. (2023)** documentent des cycles vicieux d'érosion des compétences dans l'automatisation comptable.

### Le chaînon manquant : « écrire puis vérifier » vs « l'IA écrit puis j'édite »

**Aucune étude n'a directement comparé ces deux workflows** en mesurant les résultats d'apprentissage — un gap significatif dans la littérature identifié indépendamment par plusieurs agents de recherche. Cependant, quatre lignes de preuves indirectes convergent fortement :

- Le **generation effect** (d ≈ 0.40 sur 86 études) prédit un avantage mnésique massif pour la génération par l'humain
- Le design crossover de **Kosmyna et al.** montre que les utilisateurs « cerveau d'abord » qui reçoivent ensuite l'accès à l'IA maintiennent leur engagement cognitif, tandis que l'inverse montre une altération résiduelle
- Le **GPT Tutor** de Bastani et al. (qui force la réflexion avant de donner des indices) élimine la dégradation observée avec le GPT Base
- **Stadler et al.** montrent que Google Search (synthèse active multi-sources) produit un meilleur raisonnement que ChatGPT malgré une charge cognitive plus élevée

La convergence de ces preuves indirectes constitue un argument fort, mais **un essai randomisé comparant directement les deux workflows serait une contribution empirique majeure**.

---

## Section 3 — Réseau académique

### Cinq courants de recherche interconnectés

La recherche sur la délégation cognitive aux IA s'organise en cinq courants qui convergent progressivement :

**Courant 1 — Sciences cognitives fondamentales (pré-IA).** Le socle est constitué par **Betsy Sparrow** (Columbia), **Jenny Liu** et **Daniel Wegner** (Harvard, décédé en 2013), dont l'étude « Google Effects on Memory » (_Science_, 2011) a montré que la disponibilité attendue d'une information réduit son encodage — l'internet comme « mémoire transactive ». **Benjamin Storm** (UC Santa Cruz) a ensuite démontré le caractère auto-renforçant de l'offloading : utiliser Google pour répondre à des questions rend les participants plus enclins à utiliser Google pour des questions _faciles_ — 30 % n'essaient même plus de répondre de mémoire (Storm et al., 2017, _Memory_). **Evan Risko** (Waterloo) et **Sam Gilbert** (UCL) ont fourni le cadre théorique de référence dans leur revue de 2016. **Sandra Grinschgl** (Graz) a montré que le offloading booste la performance mais diminue la mémoire (2021, _QJEP_). Une méta-analyse de **Gong & Yang (2024)** dans _Frontiers in Public Health_ (22 études, 30 889 participants) confirme un effet Google modéré mais statistiquement significatif.

**Courant 2 — Rationalité bornée et heuristiques.** **Gerd Gigerenzer** (Max Planck Institute, puis Harding Center for Risk Literacy, Potsdam) fournit l'armature théorique. Son livre _How to Stay Smart in a Smart World_ (MIT Press, 2022) argumente que l'IA excelle dans les environnements stables et bien définis mais échoue dans les situations incertaines impliquant le comportement humain. Son article « Psychological AI » (_Perspectives on Psychological Science_, 2024, 19(5), 839-848) montre que des algorithmes heuristiques simples (basés sur la récence) surpassent des approches big-data complexes (Google Flu Trends). Sa position : ne pas faire confiance aveuglément à la technologie intelligente, ni la craindre sans raison, mais développer la _literacy_ algorithmique. Sa formulation originale du concept remonte à **« Outsourcing the Mind »** (Edge.org, 2010) : « We are in the process of outsourcing information storage and retrieval from mind to computer, just as many of us have already outsourced the ability of doing mental arithmetic to the pocket calculator. » Il ne présente pas cette externalisation comme univoquement néfaste mais exige une distinction : la question n'est pas _si_ nous externalisons, mais _ce que_ nous externalisons et _comment_. Dans _How to Stay Smart in a Smart World_ (MIT Press, 2022), il formule six prescriptions opérationnelles directement applicables aux LLM. Premièrement, l'**usage actif vs. réactif** : maintenir des plages d'une à deux heures sans interruption technologique — « utiliser Internet activement, ne pas le laisser déterminer combien de temps nous pouvons penser ». Deuxièmement, le **Stable World Principle** : les algorithmes excellent dans les environnements stables et bien définis mais échouent dans les situations instables impliquant le comportement humain — le langage, la connaissance et la vérité n'étant pas des domaines « stables », les LLM exigent une vigilance accrue. Troisièmement, l'**éducation plutôt que le paternalisme** : « My vision of people is that we should educate them so far as we can, so that they can make informed decisions themselves. » La « littératie du risque numérique » devrait être une compétence fondamentale. Quatrièmement, l'**investissement dans les compétences humaines** : « Smart technology needs smart citizens. » Cinquièmement, les **heuristiques simples en situation d'incertitude** : dans les environnements VUCA, les heuristiques simples surpassent les modèles analytiques complexes — ce qui inclut les réponses élaborées des LLM quand l'incertitude est élevée. Sixièmement, l'**exigence de transparence** pour les algorithmes à enjeux élevés. Gigerenzer n'a pas publié de travail dédié spécifiquement aux LLM, mais il est co-auteur d'un article multi-auteurs dans _PNAS Nexus_ (Capraro et al., 2024, DOI: pgae191) sur l'impact de l'IA générative. Son cadre de rationalité écologique et ses heuristiques rapides-et-frugales sont directement applicables : les utilisateurs de LLM ont besoin de compétences d'évaluation critique que l'IA elle-même ne peut pas fournir.

**Courant 3 — Évaluation critique de l'IA.** **Arvind Narayanan** et **Sayash Kapoor** (Princeton) apportent le cadre d'AI literacy avec _AI Snake Oil_ (Princeton UP, 2024) — distinction entre IA générative (progrès réel) et IA prédictive (souvent du « snake oil »). **Lisa Messeri** (Yale, anthropologie) et **M.J. Crockett** (Princeton, psychologie) théorisent les « illusions de compréhension » dans _Nature_ (2024, 373+ citations) — le risque de produire plus en comprenant moins. **Richard Heersmink** (2025, _PNAS Nexus_) aborde directement l'impact des LLM sur les compétences cognitives. **Advait Sarkar** (Microsoft Research Cambridge) argumente dans _Communications of the ACM_ (2024) que « AI Should Challenge, Not Obey ».

**Courant 4 — Collaboration humain-IA pragmatique.** **Ethan Mollick** (Wharton) est la figure centrale, avec _Co-Intelligence_ (Penguin Portfolio, 2024), l'étude BCG « Jagged Frontier » (Dell'Acqua et al., 2023, N=758), et son framework « Seven Approaches for Students ». Concepts clés : la distinction **Centaures** (division claire humain/IA) vs **Cyborgs** (intégration fluide) ; le principe « the effort IS the point » pour l'éducation. **Simon Willison** (créateur de Django, développeur indépendant) représente la perspective praticien : les LLM comme « assistant junior surconfiant », avec une insistance sur le test humain et la supervision active. **Addy Osmani** (Google Chrome) complète avec « Plan Before Prompting » et « If you lack that foundation, the AI might just amplify confusion ».

**Courant 5 — IA et éducation/pensée critique (2024-2025).** Le courant le plus récent et le plus dynamique. **Fan et al.** (Monash/Gašević, BJET 2024) introduisent la « paresse métacognitive ». **Michael Gerlich** (SBS Swiss Business School, _Societies_ 2025) documente la corrélation offloading-pensée critique. **Hyeji Lee** et al. (Microsoft/CMU, CHI 2025) mesurent la réduction d'effort critique chez les knowledge workers. **Nataliya Kosmyna** (MIT Media Lab) fournit les premières données neurophysiologiques avec le concept de « dette cognitive ». **Anjali Singh** et al. (CHI 2025 Workshop) synthétisent le tout dans « Protecting Human Cognition in the Age of AI ». **Ulises León-Domínguez** (2024, _Neuropsychology_) analyse les risques pour les fonctions exécutives supérieures.

### Concept unificateur émergent

Le concept de **dette cognitive** (Kosmyna et al., 2025) — par analogie avec la dette technique en développement logiciel — semble émerger comme cadre unificateur : les LLM offrent des gains d'efficacité immédiats mais génèrent des coûts cognitifs différés (pensée critique émoussée, mémoire réduite, créativité diminuée). Comme la dette technique, la dette cognitive se compose si elle n'est pas remboursée.

---

## Section 4 — Implications pratiques pour un workflow d'écriture

### Pourquoi « écrire d'abord, IA ensuite » fonctionne — la convergence des mécanismes

Le workflow du blogueur technique qui rédige lui-même puis utilise l'IA en relecture critique est soutenu par **huit mécanismes neurocognitifs indépendants** qui convergent tous dans la même direction :

|Mécanisme|« Rédiger → IA relit »|« IA rédige → humain édite »|
|---|---|---|
|Effet de génération|✅ Activation complète du réseau préfrontal-postérieur d'encodage|❌ Condition « lecture » : pas d'activation différentielle|
|Niveaux de traitement|✅ Traitement sémantique profond (sens, organisation, élaboration)|❌ Traitement superficiel (correction de surface, mise en forme)|
|Testing effect|✅ Écrire de mémoire = récupération intentionnelle ; g = 0.50 sur 3 méta-analyses (Rowland 2014, Adesope 2017, Yang 2021)|❌ Pas de récupération en mémoire ; lecture passive de la sortie IA|
|Charge cognitive|✅ Charge germane préservée ; l'IA gère la charge extraneous|❌ Charge germane déchargée ; construction de schémas court-circuitée|
|Métacognition|✅ Monitoring continu ; calibration précise du « je sais / je ne sais pas »|❌ La fluence de l'IA crée une illusion de compréhension|
|Écriture = pensée|✅ Cycle récursif complet planification-traduction-révision (Flower & Hayes)|❌ Fonction épistémique de l'écriture entièrement contournée|
|Plasticité neurale|✅ Les circuits cognitifs sont renforcés par l'usage|❌ « Use it or lose it » → atrophie progressive|
|Attention|✅ Engagement soutenu et actif tout au long|❌ Balayage passif et intermittent de la sortie IA|

L'**asymétrie est fondamentale** : le workflow « rédiger → IA relit » préserve **tous** les bénéfices d'apprentissage tout en exploitant les forces de l'IA (détection d'erreurs, perspectives alternatives, polish). Le workflow « IA rédige → humain édite » sacrifie **tous** les bénéfices d'apprentissage pour un gain de vitesse qui génère une dette cognitive composée.

### Garde-fous concrets pour un workflow d'écriture technique « learn in public »

**Principe directeur : l'IA ne touche jamais au traitement sémantique primaire.** Si l'objectif est d'apprendre un sujet en écrivant dessus, la rédaction EST l'apprentissage — la déléguer revient à payer quelqu'un pour faire votre musculation.

**Phase 1 — Recherche et compréhension (IA : rôle limité).** Lire les sources primaires soi-même. Utiliser l'IA uniquement comme « compagnon de lecture » au sens de Tyler Cowen : poser des questions sur un concept précis après l'avoir lu, pas demander un résumé. Le résumé IA court-circuite le traitement sémantique profond ; la question ciblée le renforce.

**Phase 2 — Rédaction du premier jet (IA : interdite).** Rédiger à partir de sa compréhension, sans consulter l'IA. Accepter l'imperfection — la lutte avec les mots EST le mécanisme d'encodage. Comme l'observe la chercheuse du MIT Kosmyna : « Students in the brain-only group could often recall and even recite their essays, because they had genuinely worked through the ideas. » La friction n'est pas un bug, c'est la fonctionnalité principale.

**Phase 3 — Relecture critique par IA (IA : rôle Socratique).** Soumettre le draft à l'IA avec des prompts de type adversarial : « Quelles sont les faiblesses de cet argument ? », « Quel contre-exemple un senior dev pourrait opposer ? », « Où est-ce que je simplifie à l'excès ? ». L'IA joue le rôle de reviewer exigeant, pas de ghostwriter. Ce mode correspond au rôle « AI-coach » dans le framework de Mollick & Mollick (2023) — feedback ciblé qui renforce l'apprentissage plutôt que de le remplacer.

**Phase 4 — Polish et publication (IA : rôle technique).** L'IA peut intervenir sur la charge extraneous — grammaire, style, cohérence tonale, formatage — sans toucher au fond. Cette distinction correspond exactement à la frontière CLT : extraneous load (déchargeable sans perte) vs germane load (indéchargeable sans perte d'apprentissage).

**Phase 5 — Vérification post-publication de la rétention.** Appliquer le « test GPS » de Christiane Caneva : « Si je ne peux pas expliquer ce que j'ai écrit sans consulter l'article, l'IA a fait la réflexion à ma place. » Se tester régulièrement. L'incapacité à résumer son propre article est le signal d'alerte que le workflow a dérapé vers l'outsourcing.

### Six règles opérationnelles dérivées des preuves

- **Règle de la génération et de la récupération** : ne jamais demander à l'IA de générer du texte sur un sujet qu'on cherche à apprendre. L'effet de génération (d = 0.40) et le _testing effect_ (g = 0.50, Roediger & Karpicke, 2006) sont les deux mécanismes les plus solidement documentés en psychologie cognitive — les activer en écrivant de mémoire avant toute consultation IA est non-négociable pour un « learn in public ». L'illusion métacognitive est réelle : la réétude (comme la lecture d'un output IA) _semble_ plus productive que l'effort de récupération, mais produit une rétention dramatiquement inférieure à une semaine.
- **Règle de la difficulté productive** : si l'IA rend la tâche trop facile, elle détruit l'apprentissage. Comme le formule Ethan Mollick : « When the effort is the point, using AI to avoid it defeats the purpose. » Maintenir des sessions d'écriture « cerveau seul » pour préserver les circuits cognitifs.
- **Règle du monitoring** : après chaque interaction IA, se demander « Est-ce que je comprends mieux, ou est-ce que je _crois_ comprendre mieux ? ». L'étude Fernandes et al. (2026) montre que l'IA crée une surestimation systématique de la performance — la fluence de l'output IA est trompeuse.
- **Règle du cycle auto-renforçant** : Storm et al. (2017) montrent que chaque utilisation de Google rend la suivante plus probable. Le même mécanisme s'applique aux LLM. Établir des limites explicites d'utilisation pour éviter le cycle de dépendance.
- **Règle du junior dev** : traiter la sortie de l'IA « comme si elle venait d'un développeur junior surconfiant » (Simon Willison). Tout doit être vérifié, testé, compris. Ne jamais publier du code ou du texte qu'on ne pourrait pas expliquer ligne par ligne.
- **Règle Mitchell Hashimoto** (endossée par Willison) : pour les sujets critiques, « faire le travail deux fois » — d'abord manuellement, puis refaire avec l'IA. Cela construit les compétences ET développe l'intuition sur ce que l'IA fait bien ou mal.

### Encoder la protection cognitive dans l'interaction IA

Les principes établis ci-dessus ne sont opérationnels que s'ils sont encodés dans le système d'IA lui-même — pas seulement dans la discipline de l'utilisateur. La littérature récente (Danry et al., CHI 2023 ; Chowdhury et al., ACM Learning@Scale 2024 ; études Harvard/UPenn 2024-2025) converge sur un point : un LLM non contraint _dégrade_ la performance d'apprentissage de 17 % (Bastani et al., 2024), tandis qu'un LLM avec garde-fous socratiques _double_ les gains par rapport à un cours magistral actif (Harvard, 2025).

#### La distinction fondamentale : « explique-moi X » vs. « qu'est-ce qui cloche dans mon explication de X ? »

Cette distinction n'est pas une simple nuance conversationnelle — elle détermine si l'utilisateur engage ou court-circuite son traitement sémantique profond. Danry et al. (2023, CHI, _Don't Just Tell Me, Ask Me_, DOI: 10.1145/3544548.3580672, N=204) ont démontré empiriquement qu'une IA qui formule des questions améliore **significativement** la capacité de discernement logique par rapport à une IA qui fournit des explications directes, et même par rapport à l'absence de feedback. Jose et al. (2025, _Frontiers in Psychology_, DOI: 10.3389/fpsyg.2025.1645237) proposent une taxonomie à trois niveaux qui cartographie cette distinction :

- **Déchargement assistif** : l'IA soutient sans remplacer les processus internes — l'humain conserve le traitement sémantique, l'IA valide. Correspond à « vérifie mon explication ».
- **Déchargement substitutif** : l'IA effectue le traitement à la place de l'humain. Correspond à « explique-moi X ».
- **Déchargement disruptif** : l'IA remplace aussi la régulation et la réflexion internes, inhibant l'agentivité cognitive autonome.

#### Trois dialogues illustrant la distinction

**Outsourcing cognitif (à éviter en contexte d'apprentissage) :**

> **Utilisateur** : Explique-moi comment fonctionne le _event loop_ en JavaScript.
> **IA (mode par défaut)** : Le _event loop_ est un mécanisme qui permet à JavaScript de gérer les opérations asynchrones. Il vérifie constamment la pile d'appels et la file d'attente des messages…
> → _L'IA effectue le traitement sémantique. L'utilisateur reçoit passivement. Déchargement substitutif._

**Redirection socratique (garde-fou actif) :**

> **Utilisateur** : Explique-moi comment fonctionne le _event loop_ en JavaScript.
> **IA (mode socratique)** : Avant que je t'explique — qu'est-ce que tu sais déjà sur la façon dont JavaScript gère le code asynchrone ? Essaie de me décrire ce que tu comprends actuellement.
> → _L'IA redirige vers la récupération en mémoire. Déchargement assistif. Active le testing effect._

**Validation ciblée (workflow optimal) :**

> **Utilisateur** : Voici mon explication du _event loop_ : JavaScript utilise un seul thread. Les opérations asynchrones sont envoyées à des Web APIs, puis leur callback est placé dans une _task queue_. Le _event loop_ vérifie si la _call stack_ est vide, et si oui, pousse le prochain callback. Est-ce correct ?
> **IA (mode validation)** : Ton explication couvre bien la structure générale. Deux pistes de réflexion : tu mentionnes la _task queue_ — sais-tu qu'il existe aussi une _microtask queue_ pour les Promises, avec une priorité différente ? Et qu'entends-tu exactement par « pousse » — qui est l'agent actif dans ce transfert ?
> → _L'utilisateur a effectué le traitement sémantique. L'IA valide et affine. Déchargement assistif optimal._

#### Situations où l'IA doit questionner plutôt qu'expliquer

Le protocole d'escalade **D1→D2→D3** (Chowdhury, Zouhar & Sachan, 2024, ACM Learning@Scale) fournit un arbre de décision encodable dans tout _system prompt_ ou fichier de configuration :

**Étape 1 — Détection du contexte.** La requête porte-t-elle sur un sujet que l'utilisateur est en train d'apprendre ? Si oui → mode pédagogique. Si non (lookup factuel, productivité pure) → réponse directe légitime.

**Étape 2 — Évaluation de l'effort cognitif préalable.** L'utilisateur a-t-il déjà tenté de formuler sa compréhension ? Si oui (« vérifie mon explication ») → mode validation avec feedback ciblé. Si non (« explique-moi ») → redirection socratique.

**Étape 3 — Escalade progressive.** D1 : question ouverte (« Qu'en penses-tu ? »). D2 : indice ciblé si D1 échoue. D3 : explication directe si D2 échoue — mais jamais la solution complète en une seule réponse.

**Étape 4 — Cas spéciaux.** Si l'utilisateur soumet un texte manifestement généré par IA en demandant « améliore ça » → questionner l'intention (« Qu'est-ce que _toi_ tu penses qui devrait être amélioré ? »). Si l'utilisateur demande à l'IA de rédiger sur un sujet qu'il cherche à maîtriser → demander un brouillon de l'utilisateur d'abord.

#### Encodage dans un _system prompt_ ou fichier CLAUDE.md

L'implémentation documentée la plus robuste est celle de **Khanmigo** (Khan Academy), dont le prompt fondateur est : « You are a tutor that always responds in the Socratic style. You never give the student the answer, but always try to ask just the right question to help them learn to think for themselves. » L'étude Harvard (2025, _Scientific Reports_, DOI: s41598-025-97652-6) démontre qu'un prompt contenant « Only give away ONE STEP AT A TIME, DO NOT give away the full solution in a single message » double les gains d'apprentissage par rapport au cours magistral actif.

Cinq principes d'encodage transversaux émergent de la littérature :

1. **Contrôle structurel, pas uniquement promptuel.** L'encodage en langage naturel seul est fragile (Chowdhury et al., 2024) — les modèles « commencent à ignorer aléatoirement des parties des instructions » quand les prompts sont longs. Combiner instructions explicites et contraintes structurelles.
2. **Interdictions explicites.** Tous les _system prompts_ pédagogiques efficaces incluent des règles négatives : « NEVER provide the answer directly », « DO NOT give away the full solution ».
3. **Le protocole D1→D2→D3 est universel.** Question ouverte → indice ciblé → explication directe. Ne jamais sauter au D3 sans avoir tenté D1 et D2.
4. **Persistance de l'état d'apprentissage.** Les garde-fous sont plus efficaces quand l'IA a accès à une mémoire de ce que l'utilisateur sait et apprend (objectifs, progression, lacunes identifiées).
5. **Chargement hiérarchique.** Quatre niveaux : global (philosophie d'apprentissage), projet (contexte d'apprentissage spécifique), session (calibration dynamique), tour de parole (décision questionner/expliquer).

**Limite identifiée** : aucun framework ne résout robustement la **détection automatique du contexte d'apprentissage** sans déclaration explicite de l'utilisateur. La zone proximale de développement est difficile à calibrer pour un LLM sans évaluation préalable. C'est le problème à résoudre pour passer de la théorie à l'implémentation à grande échelle.

### Pour les développeurs spécifiquement

L'état actuel de la recherche sur **GitHub Copilot** montre des accélérations constantes de **12-25 %** (Cui et al., 2024) avec jusqu'à un tiers du code écrit par l'IA. Les développeurs chez IBM expriment explicitement leur **inquiétude face au deskilling** (Weisz et al., CHI EA '25). **Crowston & Bolici (2025)** identifient un double effet : les novices bénéficient de l'échafaudage mais risquent un apprentissage superficiel ; les professionnels gagnent en efficacité mais s'inquiètent de la perte de compétences fondamentales. Comme le résume Addy Osmani : « If you lack that foundation, the AI might just amplify confusion. »

Le workflow recommandé pour un développeur apprenant : **code-first** (concevoir, planifier, écrire la logique principale soi-même ; l'IA gère le boilerplate, la documentation, les tests). Le pattern **prompt-first** (l'IA génère tout le code, l'humain supervise) est acceptable pour les développeurs expérimentés sur des projets greenfield, mais **contre-indiqué pour l'apprentissage**.

---

## Section 5 — Bibliographie

### Sources primaires — Fondements théoriques

Bjork, R. A. (1994). Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. Shimamura (Eds.), _Metacognition: Knowing about knowing_ (pp. 185-205). MIT Press.

Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way: Creating desirable difficulties to enhance learning. In M. A. Gernsbacher et al. (Eds.), _Psychology and the real world_ (pp. 56-64). Worth Publishers.

Clark, A., & Chalmers, D. J. (1998). The extended mind. _Analysis_, 58(1), 7-19.

Craik, F. I. M., & Lockhart, R. S. (1972). Levels of processing: A framework for memory research. _Journal of Verbal Learning and Verbal Behavior_, 11(6), 671-684.

Flower, L., & Hayes, J. R. (1981). A cognitive process theory of writing. _College Composition and Communication_, 32(4), 365-387.

Risko, E. F., & Gilbert, S. J. (2016). Cognitive offloading. _Trends in Cognitive Sciences_, 20(9), 676-688. https://doi.org/10.1016/j.tics.2016.07.002

Slamecka, N. J., & Graf, P. (1978). The generation effect: Delineation of a phenomenon. _Journal of Experimental Psychology: Human Learning and Memory_, 4(6), 592-604.

Sparrow, B., Liu, J., & Wegner, D. M. (2011). Google effects on memory: Cognitive consequences of having information at our fingertips. _Science_, 333(6043), 776-778. https://doi.org/10.1126/science.1207745

Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. _Cognitive Science_, 12(2), 257-285.

Roediger, H. L., III, & Karpicke, J. D. (2006a). The power of testing memory: Basic research and implications for educational practice. _Perspectives on Psychological Science_, 1(3), 181-210. https://doi.org/10.1111/j.1745-6916.2006.00012.x

Roediger, H. L., III, & Karpicke, J. D. (2006b). Test-enhanced learning: Taking memory tests improves long-term retention. _Psychological Science_, 17(3), 249-255. https://doi.org/10.1111/j.1467-9280.2006.01693.x

Rowland, C. A. (2014). The effect of testing versus restudy on retention: A meta-analytic review of the testing effect. _Psychological Bulletin_, 140(6), 1432-1463. https://doi.org/10.1037/a0037559

Adesope, O. O., Trevisan, D. A., & Sundararajan, N. (2017). Rethinking the use of tests: A meta-analysis of practice testing. _Review of Educational Research_, 87(3), 659-701. https://doi.org/10.3102/0034654316689306

Karpicke, J. D., & Zaromb, F. M. (2010). Retrieval mode distinguishes the testing effect from the generation effect. _Journal of Memory and Language_, 62(3), 227-239. https://doi.org/10.1016/j.jml.2009.11.010

### Sources primaires — Études empiriques LLM (2024-2026)

Barcaui, A. (2025). ChatGPT as a cognitive crutch: Evidence from a randomized controlled trial on knowledge retention. _International Journal of Information Management Data Insights_. https://doi.org/10.2139/ssrn.5353041

Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2024). Generative AI can harm learning. _Wharton School Research Paper_. https://doi.org/10.2139/ssrn.4895486

Dell'Acqua, F., McFowland III, E., Mollick, E., et al. (2023). Navigating the jagged technological frontier: Field experimental evidence of the effects of AI on knowledge worker productivity and quality. _Harvard Business School Working Paper_, No. 24-013.

Fan, Y., Tang, L., Le, H., Shen, K., Tan, S., Zhao, Y., Shen, Y., Li, X., & Gašević, D. (2025). Beware of metacognitive laziness: Effects of generative artificial intelligence on learning motivation, processes, and performance. _British Journal of Educational Technology_, 56(2), 489-530. https://doi.org/10.1111/bjet.13544

Fernandes, D., et al. (2026). AI makes you smarter but none the wiser: The disconnect between performance and metacognition. _Computers in Human Behavior_. https://doi.org/10.1016/j.chb.2025.108779

Gerlich, M. (2025). AI tools in society: Impacts on cognitive offloading and the future of critical thinking. _Societies_, 15(1), Article 6. https://doi.org/10.3390/soc15010006

Kosmyna, N., Hauptmann, E., Yuan, Y. T., Situ, J., Liao, X.-H., Beresnitzky, A. V., Braunstein, I., & Maes, P. (2025). Your brain on ChatGPT: Accumulation of cognitive debt when using an AI assistant for essay writing task. _arXiv preprint arXiv:2506.08872_.

Lee, H.-P., Sarkar, A., Tankelevitch, L., Drosos, I., Rintel, S., Banks, R., & Wilson, N. (2025). The impact of generative AI on critical thinking. _Proceedings of CHI '25_. https://doi.org/10.1145/3706598.3713778

Messeri, L., & Crockett, M. J. (2024). Artificial intelligence and illusions of understanding in scientific research. _Nature_, 627(8002), 49-58. https://doi.org/10.1038/s41586-024-07146-0

Stadler, M., Bannert, M., & Sailer, M. (2024). Cognitive ease at a cost: LLMs reduce mental effort but compromise depth in student scientific inquiry. _Computers in Human Behavior_, 160, 108386. https://doi.org/10.1016/j.chb.2024.108386

Wu, S., Liu, Y., Ruan, M., Chen, S., & Xie, X. Y. (2025). Human-generative AI collaboration enhances task performance but undermines human's intrinsic motivation. _Scientific Reports_, 15(1), 15105. https://doi.org/10.1038/s41598-025-98385-2

Dergaa, I., et al. (2024). From chatbots to PhDs: The AI revolution is coming and cognitive health needs to be ready. _Frontiers in Artificial Intelligence_, 7. PMC11020077.

León-Domínguez, U. (2024). Potential cognitive risks of generative transformer-based AI chatbots on higher order executive functions. _Neuropsychology_, 38(4), 293-308. https://doi.org/10.1037/neu0000948

Østergaard, S. D. (2026). Generative AI and the outsourcing of scientific reasoning: Perils of the rising cognitive debt in academia and beyond. _Acta Psychiatrica Scandinavica_. https://doi.org/10.1111/acps.70069

Zhai, C., Wibowo, S., & Li, L. D. (2024). The effects of over-reliance on AI dialogue systems on students' cognitive abilities: A systematic review. _Smart Learning Environments_, 11(1), 28. https://doi.org/10.1186/s40561-024-00316-7

### Sources primaires — Deskilling et parallèles technologiques

Budzyń, K., et al. (2025). Endoscopist deskilling risk after exposure to artificial intelligence in colonoscopy. _The Lancet Gastroenterology & Hepatology_. https://doi.org/10.1016/S2468-1253(25)00133-5

Dahmani, L., & Bohbot, V. D. (2020). Habitual use of GPS negatively impacts spatial memory during self-guided navigation. _Scientific Reports_, 10, 6310.

Grinschgl, S., Papenmeier, F., & Meyerhoff, H. S. (2021). Consequences of cognitive offloading: Boosting performance but diminishing memory. _Quarterly Journal of Experimental Psychology_, 74, 1477-1496. https://doi.org/10.1177/17470218211008060

Rinta-Kahila, T., et al. (2023). The vicious circles of skill erosion: A case study of cognitive automation. _Journal of the Association for Information Systems_, 24(5), 1378-1412.

Storm, B. C., Stone, S. M., & Benjamin, A. S. (2017). Using the Internet to access information inflates future use of the Internet to access other information. _Memory_, 25(6), 717-723. https://doi.org/10.1080/09658211.2016.1210171

### Sources primaires — Neurosciences et mécanismes

Maguire, E. A., et al. (2000). Navigation-related structural change in the hippocampi of taxi drivers. _Proceedings of the National Academy of Sciences_, 97(8), 4398-4403.

McCurdy, M. P., et al. (2020). Theories of the generation effect and the impact of generation constraint: A meta-analytic review. _Psychonomic Bulletin & Review_, 27, 1172-1194.

Menary, R. (2007). Writing as thinking. _Language Sciences_, 29(5), 621-632.

Rosner, Z. A., Eppinger, E., & Shimamura, A. P. (2013). The generation effect: Activating broad neural circuits during memory encoding. _Cortex_, 49(7), 1901-1909.

### Sources secondaires — Livres, frameworks, praticiens

Gigerenzer, G. (2022). _How to stay smart in a smart world: Why human intelligence still beats algorithms_. MIT Press.

Gigerenzer, G. (2024). Psychological AI: Designing algorithms informed by human psychology. _Perspectives on Psychological Science_, 19(5), 839-848. https://doi.org/10.1177/17456916231180597

Heersmink, R. (2025). Use of large language models might affect our cognitive skills. _PNAS Nexus_, 4, pgae591. https://doi.org/10.1093/pnasnexus/pgae591

León-Domínguez, U. (2024). Potential cognitive risks of generative transformer-based AI chatbots on higher order executive functions. _Neuropsychology_, 38(4), 293-308. https://doi.org/10.1037/neu0000948

Mollick, E. (2024). _Co-Intelligence: Living and working with AI_. Penguin Portfolio.

Mollick, E. R., & Mollick, L. (2023). Assigning AI: Seven approaches for students, with prompts. _SSRN Working Paper_ #4475995.

Narayanan, A., & Kapoor, S. (2024). _AI Snake Oil: What artificial intelligence can do, what it can't, and how to tell the difference_. Princeton University Press.

Sarkar, A. (2024). AI should challenge, not obey. _Communications of the ACM_, 67(10), 18-21.

Chowdhury, T., Zouhar, V., & Sachan, M. (2024). Can LLMs be good tutors? Lessons from tutoring frameworks for LLM-based educational agents. _Proceedings of ACM Learning@Scale '24_.

Danry, V., et al. (2023). Don't just tell me, ask me: AI systems that intelligently frame explanations as questions improve human logical discernment accuracy over direct explanations. _Proceedings of CHI '23_. https://doi.org/10.1145/3544548.3580672

Drosos, I., Sarkar, A., et al. (2025). Provocations improve AI-assisted decision making. _arXiv preprint arXiv:2501.17247_.

Jose, A., et al. (2025). Cognitive offloading in the age of AI: A three-level taxonomy. _Frontiers in Psychology_. https://doi.org/10.3389/fpsyg.2025.1645237

Tankelevitch, L., et al. (2024). The metacognitive demands and opportunities of generative AI. _Proceedings of CHI '24_ (Best Paper). https://doi.org/10.1145/3613904.3642902

### Rapports institutionnels et ressources francophones

CNIL (2024). _Enseignants : comment utiliser un système d'IA en classe ?_ https://www.cnil.fr/fr/enseignant-usage-systeme-ia

Sénat français (2024). _IA et éducation_ (Rapport r24-101). https://www.senat.fr/rap/r24-101/r24-101_mono.html

UNESCO (2023). _Guidance for generative AI in education and research_. https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research

---

## Conclusion : ce que cette recherche change

Trois insights non triviaux émergent de cette synthèse. **Premier insight** : le problème n'est pas binaire. La question n'est pas « utiliser ou ne pas utiliser les LLM » mais « quelle couche cognitive déléguer ». La théorie de la charge cognitive de Sweller offre une grille opérationnelle précise : décharger la charge _extraneous_ (formatage, grammaire, boilerplate) libère des ressources pour l'apprentissage ; décharger la charge _germane_ (génération d'idées, organisation argumentative, élaboration sémantique) _est_ la perte d'apprentissage.

**Deuxième insight** : la dette cognitive est auto-renforçante. Storm et al. montrent que chaque acte de offloading rend le suivant plus probable. Wu et al. ajoutent que le retour au travail autonome après assistance IA provoque ennui et démotivation. Le cycle vicieux documenté par Rinta-Kahila dans l'automatisation comptable — plus on délègue, moins on peut faire seul, plus on doit déléguer — est directement transposable. Pour un développeur/blogueur, cela signifie que les « petits raccourcis » IA d'aujourd'hui construisent la dépendance de demain.

**Troisième insight** : le gap empirique le plus important — la comparaison directe des deux workflows — représente une opportunité pour un blogueur « learn in public ». Documenter rigoureusement sa propre expérience (rédaction autonome + relecture IA vs rédaction IA + édition humaine), avec des mesures de rétention à J+30, constituerait une contribution originale dans un champ où les preuves directes manquent encore. La théorie prédit fortement l'avantage du premier workflow ; le confirmer empiriquement, même en N=1 documenté, aurait une valeur réelle pour la communauté des développeurs.