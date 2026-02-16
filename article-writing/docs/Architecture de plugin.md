# Article Writer Plugin — Architecture & Description Document

**Version** : 0.1.0-draft **Auteur** : Negus Salomon **Statut** : Base de travail — pré-intégration des rapports de recherche **Cible** : Claude Cowork (compatible Claude Code)

---

## 1. Vision et positionnement

### Problème

Un développeur qui écrit pour apprendre fait face à une tension permanente : l'IA accélère la production mais menace l'authenticité, la voix personnelle et l'apprentissage. Les workflows "naïfs" (demander à l'IA d'écrire) produisent du contenu générique, détectable, et n'apportent aucun bénéfice cognitif à l'auteur.

### Solution

Un plugin Cowork qui encode un workflow en 7 phases où l'humain reste pilote à chaque étape. Le plugin ne génère jamais de contenu à la place de l'auteur — il questionne, structure, détecte et polit. La valeur ajoutée est double : gain de temps estimé à 40-50% sur les phases mécaniques (structuration, édition) tout en préservant l'intégrité de la voix et le bénéfice d'apprentissage.

### Différenciateur vs plugins marketing/productivité existants

Les plugins Anthropic officiels (marketing, productivity) sont orientés _production de contenu_ — ils génèrent, planifient, exécutent. Ce plugin est orienté _écriture assistée_ — il refuse explicitement de remplacer l'auteur. Le ratio humain/IA varie de 100%/0% (capture brute) à 40%/60% (relecture critique) mais ne descend jamais à 0%/100%.

---

## 2. Architecture du plugin

### Structure de fichiers

```
article-writer/
├── .claude-plugin/
│   └── plugin.json                    # Manifeste du plugin
├── .mcp.json                         # Connecteurs externes (optionnel)
├── commands/
│   ├── braindump.md                  # Phase 1+2 : capture → dialogue socratique
│   ├── structure.md                  # Phase 3 : plan structuré
│   ├── draft.md                      # Phase 4 : rédaction dirigée
│   ├── review.md                     # Phase 5 : relecture critique
│   └── polish.md                     # Phase 6 : polish final
├── skills/
│   ├── writing-voice.md              # Style, ton, identité éditoriale
│   ├── article-types.md              # Frameworks par type d'article
│   ├── slop-vocabulary.md            # R1 — Mots bannis et vocabulaire IA
│   ├── delegation-totale.md          # R2 — Anti-pattern délégation totale
│   ├── marqueurs-lexicaux.md         # R3 — Signature statistique LLM
│   ├── structure-symetrique.md       # R4 — Régularité structurelle artificielle
│   ├── slop-poli.md                  # R5 — Premier output sans substance
│   ├── cognitive-outsourcing.md      # R6 — Court-circuit de l'apprentissage
│   └── fausse-profondeur.md          # R7 — Triades et rhétorique mécanique
└── assets/                           # (futur) échantillons de style, checklists
    └── .gitkeep
```

### Principes architecturaux

|Principe|Application|
|---|---|
|**File-based**|Tout en Markdown + JSON, pas de code, pas d'infra|
|**Séparation skills/commands**|Skills = passif (auto-activé), commands = explicite (humain déclenche)|
|**Progressive disclosure**|Les skills se chargent uniquement quand pertinents|
|**Tool-agnostic**|Pas de dépendance à un éditeur ou outil de notes spécifique|
|**Humain pilote**|Aucune commande ne génère de contenu sans directive explicite|

### Flux de données entre composants

```
┌─────────────────────────────────────────────────────────────┐
│  SKILLS (auto-activés, passifs)                             │
│                                                             │
│  writing-voice ──────────────────────── Appliqué à TOUT     │
│  article-types ──────────────────────── Activé si type      │
│                                         d'article précisé   │
│  slop-vocabulary ────┐                                      │
│  marqueurs-lexicaux ─┤                                      │
│  structure-symetrique┤── Activés pendant /review et /polish │
│  slop-poli ──────────┤                                      │
│  fausse-profondeur ──┘                                      │
│  delegation-totale ──────────────────── Garde-fou global    │
│  cognitive-outsourcing ──────────────── Garde-fou global    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  COMMANDS (explicites, humain déclenche)                    │
│                                                             │
│  /braindump ─── Phase 1+2 ─── Ratio 70%H/30%IA            │
│       ↓                                                     │
│  /structure ── Phase 3 ───── Ratio 80%H/20%IA              │
│       ↓                                                     │
│  /draft ────── Phase 4 ───── Ratio 70-90%H/10-30%IA        │
│       ↓                                                     │
│  /review ──── Phase 5 ───── Ratio 40%H/60%IA               │
│       ↓                                                     │
│  /polish ──── Phase 6 ───── Ratio 50%H/50%IA               │
│       ↓                                                     │
│  (Phase 7 : décantation humaine, hors plugin)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Manifeste et connecteurs

### plugin.json

```json
{
  "name": "article-writer",
  "version": "0.1.0",
  "description": "Workflow d'écriture en 7 phases pour développeur-auteur. L'humain écrit et pense, Claude questionne, structure et polit. Ne génère jamais de contenu à la place de l'auteur.",
  "author": "Negus Salomon"
}
```

### .mcp.json — Phase initiale

```json
{
  "mcpServers": {}
}
```

**Extensions futures envisagées** :

- Obsidian (via plugin MCP Obsidian) pour récupérer les notes brutes directement
- Système de fichiers local pour accéder aux articles précédents (calibration de style)

---

## 4. Description détaillée des skills

Chaque skill ci-dessous sera alimenté par un rapport de recherche approfondi. Cette section décrit l'objectif, le périmètre, le mode d'activation et la structure cible de chaque fichier.

---

### 4.1 — `writing-voice.md` : Identité éditoriale

**Objectif** : Définir la voix, le ton et les contraintes stylistiques de l'auteur pour que Claude les applique automatiquement à toute interaction, sans qu'on le demande.

**Mode d'activation** : Toujours actif. Ce skill constitue le contexte de base de toute session d'écriture. Il s'applique aussi bien aux réponses de Claude qu'à son évaluation du texte de l'auteur.

**Périmètre** :

- Identité de l'auteur : qui il est, pourquoi il écrit, pour qui
- Règles de style positives : ce qui caractérise sa voix (direct, technique accessible, conversationnel, apartés autorisés)
- Règles de style négatives : ce qu'il ne fait jamais (listes à puces excessives, formules d'introduction mécanique, analogies multiples)
- Configuration Custom Styles : référence aux échantillons d'écriture si présents dans `assets/`
- Principe cardinal : ne jamais réécrire le texte de l'auteur sauf demande explicite de déblocage

**Structure cible du fichier** :

```
---
name: writing-voice
description: [activation trigger]
---

## Identité éditoriale
[Qui est l'auteur, pourquoi il écrit, audience cible]

## Règles de style — ce qui caractérise ma voix
[Patterns positifs à reproduire/respecter]

## Règles de style — ce que je ne fais jamais
[Patterns négatifs à éviter]

## Mots et expressions bannis
[Liste consolidée FR + EN, alimentée par le rapport R1]

## Patterns rhétoriques interdits
[Liste consolidée, alimentée par le rapport R7]

## Principe cardinal
[Règle d'or : réagir, pas réécrire]
```

**Dépendances** : Consomme les résultats des rapports R1 (slop vocabulary) et R7 (fausse profondeur) pour la liste de mots bannis et les patterns rhétoriques interdits.

**Risques** : Un skill trop long (> 500 lignes) diluera l'attention de Claude. Maintenir la concision en externalisant les listes exhaustives dans des fichiers de référence sous `assets/` si nécessaire.

---

### 4.2 — `article-types.md` : Frameworks par type d'article

**Objectif** : Fournir à Claude des grilles d'analyse et de questionnement adaptées au type de contenu que l'auteur produit, pour que les commandes `/braindump`, `/structure` et `/review` ajustent automatiquement leur comportement.

**Mode d'activation** : Activé quand l'auteur précise le type d'article (technique, REX, tutoriel, opinion) ou quand le contexte le rend évident.

**Périmètre** :

- **Article technique / dev** : angles à explorer (problème résolu, découverte contre-intuitive, piège courant, comparaison d'approches), vérifications (prérequis, cas limites, code testé)
- **Retour d'expérience (REX)** : priorité sur l'apprentissage transférable, questions clés (échecs, décisions alternatives, leçons pour d'autres devs), risque de contenu auto-centré
- **Tutoriel / guide** : complétude des étapes, ordre naturel pour le niveau cible, prérequis explicités, vérification technique du code
- **Opinion / réflexion** : force de l'argumentation, traçabilité des formules de couverture, proposition systématique de contre-arguments

**Structure cible du fichier** :

```
---
name: article-types
description: [activation trigger]
---

## Article technique
[Grille de questionnement + vérifications spécifiques]

## Retour d'expérience
[Focus apprentissage transférable + risques à surveiller]

## Tutoriel
[Complétude + ordre + vérification technique]

## Opinion
[Force argumentaire + contre-arguments + formules de couverture]
```

**Dépendances** : Ce skill fournit le contexte que les commandes `/braindump`, `/structure` et `/review` consomment pour adapter leur comportement.

---

### 4.3 — `slop-vocabulary.md` : Mots bannis et vocabulaire IA (Rapport R1)

**Objectif** : Encoder la connaissance sur les mots et expressions dont la fréquence anormale dans les outputs LLM trahit l'origine artificielle du texte. Ce skill doit permettre à Claude de détecter ces marqueurs dans le texte de l'auteur et de les signaler lors des phases de relecture.

**Mode d'activation** : Activé automatiquement pendant les commandes `/review` et `/polish`. Peut être activé explicitement par l'auteur à tout moment.

**Contenu attendu du rapport de recherche R1** :

Ce rapport doit documenter :

1. **Les données quantitatives de base** : L'étude de Kobak & al. sur l'augmentation de fréquence de mots spécifiques dans les articles académiques post-GPT. Les chiffres exacts (ex : "delve" +400%, "meticulously researched" +3900%) avec leurs sources primaires et leur méthodologie. L'ampleur réelle du phénomène — touche-t-il tous les domaines ou principalement la recherche académique ?
    
2. **La taxonomie des mots à risque** : Pas seulement une liste plate, mais une classification par catégorie. On s'attend à trouver des catégories comme : adverbes de qualification excessive ("meticulously", "seamlessly"), noms abstraits pompeux ("tapestry", "landscape", "realm"), verbes de substitution formelle ("leverage", "utilize", "harness"), formules d'introduction bureaucratiques ("il convient de noter", "force est de constater"). La recherche doit aussi couvrir les spécificités françaises — les LLM entraînés sur du français formel surproduisent-ils les mêmes catégories de mots ?
    
3. **Le mécanisme causal** : Pourquoi les LLM favorisent-ils ces mots précis ? L'hypothèse est que les modèles convergent vers des tokens "sûrs" — formels, polis, non-committing — en raison du RLHF qui pénalise les formulations potentiellement offensantes ou trop familières. Les travaux de Jeremy Nguyen (Swinburne University) et d'autres chercheurs en NLP sur les biais de distribution de tokens post-fine-tuning devraient éclairer ce point.
    
4. **Les limites de la détection par mots-clés** : Un mot n'est pas un signal fiable en isolation. "Delve" peut être utilisé naturellement par un anglophone natif. Le vrai signal est la _densité_ et la _co-occurrence_ — plusieurs mots suspects dans le même texte. Comment calibrer le seuil de détection pour éviter les faux positifs ?
    
5. **L'évolution temporelle** : Les LLM changent de version fréquemment. Les mots marqueurs de GPT-3.5 ne sont pas les mêmes que ceux de Claude ou GPT-4. La liste est-elle stable ou nécessite-t-elle une mise à jour continue ? Quels mots persistent à travers les modèles et lesquels sont spécifiques à un modèle ?
    

**Structure cible du skill** :

```
---
name: slop-vocabulary
description: Détection de vocabulaire statistiquement surreprésenté dans les outputs LLM.
  Activer lors des phases /review et /polish pour scanner le texte.
---

## Pourquoi ces mots posent problème
[Résumé du mécanisme causal, 3-5 lignes]

## Liste de détection — Anglais
### Catégorie 1 : [nom de catégorie]
[mots + fréquence d'apparition si disponible]
### Catégorie 2 : ...

## Liste de détection — Français
### Catégorie 1 : ...

## Règles de détection
[Seuil de densité, co-occurrence, calibration faux positifs]

## Quand signaler
[Contexte d'activation : review, polish, toujours]

## Quand ne PAS signaler
[Cas légitimes d'usage de ces mots]
```

**Relations avec d'autres skills** : Consommé par `writing-voice.md` (qui maintient la liste de mots bannis active en permanence) et par les commandes `/review` et `/polish` (qui scannent activement).

---

### 4.4 — `delegation-totale.md` : Anti-pattern de génération complète (Rapport R2)

**Objectif** : Encoder la connaissance sur pourquoi la génération d'articles en un seul prompt produit des résultats médiocres, et doter Claude de la capacité à reconnaître et refuser ce pattern quand l'auteur le demande (consciemment ou non).

**Mode d'activation** : Garde-fou global — toujours actif. Ce skill intervient de manière préventive quand Claude détecte une demande de type "écris-moi un article sur X".

**Contenu attendu du rapport de recherche R2** :

1. **La dégradation qualité/longueur** : Études et benchmarks documentant la corrélation inverse entre longueur de génération demandée et qualité du contenu. Les analyses de ai.cc et d'autres sources sur la "regression to the mean" stylistique des LLM sur les longs outputs. Existe-t-il un seuil de longueur au-delà duquel la dégradation s'accélère (ex : au-delà de 500 mots, 1000 mots) ?
    
2. **Single-shot vs iterative prompting** : Comparaisons documentées entre la génération d'un texte en un prompt vs un workflow itératif paragraphe par paragraphe. Les workflows de Tom Johnson (10 étapes), Aaron Held, et d'autres praticiens. Les gains qualitatifs mesurables (si existants) de l'approche itérative.
    
3. **Le problème de l'angle** : Un prompt unique ne fournit pas assez de contraintes pour produire un angle original. Le LLM opte pour l'angle le plus probable statistiquement, qui est par définition le plus générique. Comment l'approche itérative force-t-elle la spécificité ?
    
4. **Les exceptions légitimes** : Y a-t-il des cas où la génération en un prompt est acceptable ? (ex : emails courts, descriptions techniques standardisées, premiers jets qu'on prévoit de réécrire intégralement). Le skill doit savoir quand le garde-fou est approprié et quand il serait une friction inutile.
    
5. **Le pattern de redirection** : Comment Claude doit-il réagir quand il détecte une demande de délégation totale ? Refuser sèchement ? Proposer le workflow en phases ? Demander d'abord les notes brutes de l'auteur ? Documenter les meilleures pratiques de redirection.
    

**Structure cible du skill** :

```
---
name: delegation-totale
description: Garde-fou contre la génération d'articles complets en un prompt.
  Toujours actif. Redirige vers le workflow en phases quand détecté.
---

## Le problème
[Pourquoi la génération complète échoue, avec données]

## Signaux de détection
[Patterns de prompt qui déclenchent ce garde-fou]

## Réponse appropriée
[Comment rediriger : proposer /braindump, demander les notes brutes]

## Exceptions
[Cas où la génération directe est acceptable]

## Seuils de longueur
[Données sur la dégradation qualité/longueur si disponibles]
```

**Relations avec d'autres skills** : Ce skill est un garde-fou pour toutes les commandes. Il intervient _avant_ qu'une commande ne s'exécute si la demande correspond au pattern de délégation totale.

---

### 4.5 — `marqueurs-lexicaux.md` : Signature statistique des LLM (Rapport R3)

**Objectif** : Aller au-delà de la simple liste de mots bannis (R1) pour documenter la _signature statistique_ globale des LLM — les patterns de distribution lexicale qui trahissent l'origine artificielle d'un texte, même quand les mots individuels semblent naturels.

**Mode d'activation** : Activé pendant `/review` et `/polish`. Fournit la grille d'analyse que Claude utilise pour évaluer l'authenticité d'un texte.

**Contenu attendu du rapport de recherche R3** :

1. **Watermarking involontaire** : Les LLM laissent une empreinte lexicale détectable au-delà des mots individuels. Documenter le concept de "implicit watermarking" — la distribution de probabilité biaisée vers certains tokens "sûrs" qui crée un signal statistique. Les travaux de Stanford (Liang & al.) sur la détection de texte généré par machine. La différence entre watermarking intentionnel (injecté) et involontaire (biais de distribution).
    
2. **Outils de détection existants** : Comment fonctionnent GPTZero, Originality.ai, Turnitin AI Detection, ZeroGPT ? Quels signaux exploitent-ils ? Quelle est leur fiabilité mesurée (taux de faux positifs/négatifs) ? Sont-ils plus fiables sur certains types de texte que d'autres ? L'objectif n'est pas de promouvoir ces outils mais de comprendre les signaux qu'ils détectent pour les éviter en amont.
    
3. **La diversité lexicale comme signal** : Les métriques comme le TTR (Type-Token Ratio), la richesse lexicale, et l'entropie de Shannon appliquées à la détection. Les textes LLM ont-ils une diversité lexicale mesurablementement différente des textes humains ? Les travaux de recherche sur ce sujet.
    
4. **Les patterns de co-occurrence** : Au-delà des mots individuels, les LLM produisent des _collocations_ (combinaisons de mots) prévisibles. "Comprehensive overview", "in-depth analysis", "key takeaways" — ces collocations ont-elles une fréquence mesurablementement plus élevée dans les textes LLM ?
    
5. **Spécificités par modèle** : Claude, GPT-4, Gemini ont-ils des signatures différentes ? Les marqueurs sont-ils cross-modèle ou spécifiques à une famille de modèles ? Le RLHF crée-t-il une convergence de signature entre modèles ou des divergences ?
    
6. **Le problème des faux positifs** : Un texte humain formel (article académique, rapport juridique) peut déclencher les mêmes signaux qu'un texte LLM. Comment calibrer la détection pour différents registres de langue ? Le skill doit-il adapter son seuil de sensibilité au type d'article (technique, opinion, REX) ?
    

**Structure cible du skill** :

```
---
name: marqueurs-lexicaux
description: Analyse de la signature statistique globale d'un texte pour détecter
  l'origine LLM. Activé pendant /review et /polish.
---

## Au-delà des mots : la signature statistique
[Explication du concept de watermarking involontaire]

## Signaux de distribution
[Métriques : TTR, entropie, diversité lexicale]

## Collocations suspectes
[Combinaisons de mots typiquement LLM, classées par catégorie]

## Calibration par registre
[Seuils ajustés selon le type d'article]

## Grille d'évaluation pour Claude
[Checklist concrète que Claude applique pendant /review]
```

**Relations avec d'autres skills** : Complémentaire à `slop-vocabulary.md` (R1 = mots individuels, R3 = patterns de distribution). Consommé par `/review` et `/polish`.

**Risque de redondance avec R1** : R1 et R3 traitent tous deux du vocabulaire IA. La distinction est : R1 = _quoi_ détecter (liste de mots), R3 = _comment_ détecter (méthode statistique). Si les rapports de recherche montrent que la distinction est artificielle, fusionner les deux skills en un seul.

---

### 4.6 — `structure-symetrique.md` : Régularité structurelle artificielle (Rapport R4)

**Objectif** : Encoder la connaissance sur les patterns de structure qui trahissent l'origine IA d'un texte et doter Claude de la capacité à les détecter dans le texte de l'auteur.

**Mode d'activation** : Activé pendant `/review`. Peut être activé pendant `/structure` pour vérifier que le plan proposé ne suit pas un template générique.

**Contenu attendu du rapport de recherche R4** :

1. **L'inventaire des patterns structurels LLM** : Documenter exhaustivement les patterns que les LLM imposent à leurs outputs. Le pattern "définition → explication → nuance → mini-résumé" par section. L'uniformité de longueur des paragraphes. Les sous-titres génériques ("Comprendre X", "L'importance de Y", "L'avenir de Z"). Les introductions qui annoncent le plan. Les conclusions qui résument chaque section. Chaque pattern doit être illustré par un exemple concret.
    
2. **La notion de "template writing"** : Existe-t-il une recherche académique sur la distinction entre écriture organique (humaine) et écriture par template (LLM) ? Les travaux en études de composition (composition studies) sur les structures textuelles. Les analyses de style computationnelles qui comparent la variance structurelle des textes humains vs LLM.
    
3. **Le test de Louis Bouchard** : "Convertir chaque paragraphe en une phrase résumé et lire ces phrases comme un plan." Approfondir cette heuristique. Peut-on la formaliser ? Y a-t-il d'autres tests heuristiques pour détecter la symétrie structurelle ?
    
4. **Les patterns structurels par type de contenu** : Un tutoriel a naturellement une structure plus régulière qu'un essai d'opinion. Comment le skill doit-il ajuster sa sensibilité au type d'article ? Un tutoriel step-by-step avec des sections de longueur uniforme n'est pas suspect — un article d'opinion avec la même régularité l'est.
    
5. **Comment "casser la symétrie"** : Au-delà de la détection, le skill doit guider l'auteur pour varier sa structure. Varier la longueur des paragraphes, ne pas terminer chaque section par un récapitulatif, mélanger paragraphes denses et paragraphes aérés, insérer des apartés ou anecdotes qui brisent le rythme.
    

**Structure cible du skill** :

```
---
name: structure-symetrique
description: Détection de régularité structurelle artificielle dans les textes.
  Activé pendant /review et /structure.
---

## Patterns structurels à détecter
[Inventaire illustré de chaque pattern]

## Le test du plan résumé
[Heuristique formalisée de détection]

## Calibration par type d'article
[Tutoriel = tolérance haute, Opinion = tolérance basse]

## Stratégies pour casser la symétrie
[Conseils actionnables pour l'auteur]
```

**Relations avec d'autres skills** : Consommé par `/review` et `/structure`. Complémentaire à `slop-vocabulary.md` (R1 = signal lexical, R4 = signal structurel).

---

### 4.7 — `slop-poli.md` : Le premier output sans substance (Rapport R5)

**Objectif** : Encoder la connaissance sur le phénomène du "slop" — contenu IA avec un polish de surface mais sans substance — et doter Claude de critères pour distinguer qualité formelle et qualité substantielle.

**Mode d'activation** : Garde-fou activé pendant `/draft` (pour éviter que Claude ne produise du slop quand il aide à rédiger) et pendant `/review` (pour détecter du slop dans le texte de l'auteur qui aurait trop délégué).

**Contenu attendu du rapport de recherche R5** :

1. **Définition et origine du terme "slop"** : Charlie Guo (Artificial Ignorance) a popularisé ce terme en 2024. Documenter sa définition exacte, le contexte d'émergence, et la distinction avec "hallucination" ou "confabulation". Le slop n'est pas faux — il est _vide_. Il est grammaticalement correct, bien structuré, fluide, mais ne dit rien d'original ou de substantiel.
    
2. **Les marqueurs de slop** : Au-delà du vocabulaire et de la structure (couverts par R1, R3, R4), le slop a des marqueurs _sémantiques_ : absence de thèse originale, absence d'expérience vécue, absence de prise de position risquée, absence de données spécifiques, généralités qui s'appliquent à n'importe quel sujet. Comment les formaliser pour que Claude puisse les détecter ?
    
3. **L'homogénéisation du web** : Des travaux documentent l'impact de la génération massive de contenu IA sur la qualité globale du web. L'étude de Moisey et al. ou d'autres recherches sur le "model collapse" et l'impact sur la diversité du contenu. Le problème est systémique : plus il y a de contenu IA, plus les modèles s'entraînent sur du contenu IA, plus les outputs convergent.
    
4. **La distinction qualité formelle vs substantielle** : Comment formaliser cette distinction pour un skill ? La qualité formelle (grammaire, fluidité, structure) est mesurable par des métriques classiques. La qualité substantielle (originalité de la thèse, profondeur de l'analyse, spécificité des exemples, risque intellectuel) est plus difficile à évaluer. Quels critères Claude peut-il utiliser ?
    
5. **Le test du "si on remplaçait le sujet"** : Un texte slop reste vrai si on remplace le sujet par n'importe quel autre sujet du même domaine. "Ce framework est puissant et flexible" pourrait s'appliquer à n'importe quel framework. C'est un test de spécificité — si le contenu n'est pas spécifique à son sujet, c'est probablement du slop.
    

**Structure cible du skill** :

```
---
name: slop-poli
description: Détection de contenu avec polish de surface mais sans substance.
  Activé pendant /draft (prévention) et /review (détection).
---

## Qu'est-ce que le slop
[Définition, distinction avec hallucination]

## Marqueurs sémantiques
[Absence de thèse, d'expérience, de prise de risque, de spécificité]

## Le test de substituabilité
[Si on remplace le sujet, le texte reste-t-il vrai ?]

## Grille d'évaluation
[Critères pour distinguer qualité formelle et substantielle]

## Comment l'éviter en /draft
[Règles pour Claude quand il aide à rédiger]
```

**Relations avec d'autres skills** : R5 est le skill "sémantique" qui complète les skills "lexicaux" (R1, R3) et "structurels" (R4). Ensemble, ils forment la grille de détection complète.

---

### 4.8 — `cognitive-outsourcing.md` : Court-circuit de l'apprentissage (Rapport R6)

**Objectif** : Encoder la connaissance sur le phénomène de délégation cognitive à l'IA et ses effets sur l'apprentissage, pour que Claude préserve activement le bénéfice cognitif de l'écriture.

**Mode d'activation** : Garde-fou global — toujours actif, avec une vigilance particulière pendant `/braindump` (où la tentation de demander à Claude d'expliquer est forte) et `/draft` (où la tentation de déléguer la rédaction est forte).

**Contenu attendu du rapport de recherche R6** :

1. **La distinction cognitive offloading vs outsourcing** : Le cognitive offloading (noter un numéro de téléphone plutôt que le mémoriser) est un comportement adaptatif normal documenté par la psychologie cognitive. Le cognitive outsourcing (déléguer la compréhension elle-même à un outil) est le problème spécifique aux LLM. Documenter cette distinction avec les travaux de Risko & Gilbert (2016) sur le cognitive offloading et les recherches récentes spécifiques aux LLM.
    
2. **La "paresse métacognitive"** : L'étude publiée dans le British Journal of Education Technology (décembre 2024) qui documente le phénomène. Que montre-t-elle exactement ? Les étudiants utilisant l'IA dès le départ copient-collent au lieu de synthétiser. Quels sont les effets mesurés sur la rétention, la compréhension profonde, et la capacité à transférer les connaissances ?
    
3. **Les travaux de Gerd Gigerenzer** : Son concept de "outsourcing of thinking" dans le contexte plus large de la dépendance technologique. Ses recommandations pour préserver l'autonomie cognitive. L'applicabilité de ses travaux au contexte spécifique des LLM.
    
4. **Le PMC/NIH (2025) sur le cognitive outsourcing** : La terminologie et le cadre conceptuel utilisés. Les effets documentés sur la formation des connexions neuronales. Les recommandations pour un usage des LLM compatible avec l'apprentissage.
    
5. **Le contre-mécanisme "écrire avant de vérifier"** : La recommandation centrale est d'écrire sa propre explication d'un concept avant de demander à Claude de la vérifier. Documenter les fondements cognitifs de cette approche. L'effet "generation effect" en psychologie cognitive (générer soi-même une réponse améliore la rétention vs la lire passivement). Les travaux sur le "testing effect" qui montrent que l'effort de rappel renforce la mémoire.
    
6. **L'application au workflow d'écriture** : Comment le plugin encode concrètement la protection de l'apprentissage. Exemples de situations où Claude doit refuser d'expliquer et plutôt questionner. La différence entre "explique-moi X" (outsourcing) et "qu'est-ce qui est incorrect dans mon explication de X" (vérification, compatible avec l'apprentissage).
    

**Structure cible du skill** :

```
---
name: cognitive-outsourcing
description: Protection du bénéfice cognitif de l'écriture. Garde-fou global
  pour préserver l'apprentissage de l'auteur. Toujours actif.
---

## Le problème : offloading vs outsourcing
[Distinction fondamentale avec exemples]

## Les effets documentés
[Résumé des recherches sur paresse métacognitive et rétention]

## Signaux de détection
[Patterns de demande qui indiquent un outsourcing : "explique-moi...",
"comment fonctionne...", "qu'est-ce que..."]

## Réponse appropriée
[Questionner au lieu d'expliquer. Demander "qu'en penses-tu d'abord ?"]

## Exceptions
[Cas où l'explication directe est légitime : concept hors du champ
d'apprentissage, vérification factuelle pure]
```

**Relations avec d'autres skills** : Ce skill est un garde-fou global comme `delegation-totale.md` (R2). R2 protège contre la délégation de la _production_, R6 protège contre la délégation de la _compréhension_. Ensemble, ils forment la couche de protection du workflow.

---

### 4.9 — `fausse-profondeur.md` : Triades et rhétorique mécanique (Rapport R7)

**Objectif** : Encoder la connaissance sur les figures rhétoriques mécaniques que les LLM utilisent pour simuler l'éloquence, et doter Claude de la capacité à les détecter et les signaler.

**Mode d'activation** : Activé pendant `/review` et `/polish`. Contribue aussi à `writing-voice.md` pour la liste des patterns interdits.

**Contenu attendu du rapport de recherche R7** :

1. **La taxonomie de Charlie Guo** : Les trois marqueurs principaux documentés dans Artificial Ignorance : triades percutantes, profondeur non méritée, questions rhétoriques mid-phrase. Documenter chaque marqueur avec des exemples concrets, des variantes, et des explications de pourquoi ils "fonctionnent" (au sens où ils trompent un lecteur rapide) mais échouent (au sens où ils ne disent rien de substantiel).
    
2. **Les triades percutantes** : "Rapide, efficace, fiable." Les LLM adorent les listes de trois adjectifs ou noms. Documenter pourquoi (la "rule of three" est un pattern rhétorique humain fort, les LLM l'ont appris et le surproduisent). Identifier les variantes : triades d'adjectifs, triades de noms, triades de verbes. Distinguer les triades mécaniques (vides de sens) des triades légitimes (qui apportent une nuance réelle).
    
3. **La profondeur non méritée** : Phrases dramatiques qui créent une attente jamais satisfaite. "Quelque chose a changé." "Mais voici le point crucial." "Et c'est là que tout bascule." Ces phrases promettent une révélation profonde mais sont suivies d'une observation banale. Documenter les patterns de ces phrases et leur effet sur le lecteur (création d'une attente → déception → sentiment de superficialité).
    
4. **Les questions rhétoriques vides** : "La solution ? Plus simple qu'on ne le pense." Le LLM pose une question, y répond immédiatement, et la réponse n'apporte rien. C'est un pattern de remplissage qui donne l'illusion de la progression argumentative. Documenter les variantes et les distinguer des questions rhétoriques légitimes (qui invitent réellement à la réflexion).
    
5. **Autres patterns rhétoriques mécaniques** : Au-delà de la taxonomie de Guo, existe-t-il d'autres patterns documentés ? Les travaux de Jian et al. sur les patterns persuasifs des LLM. Le concept de "empty rhetoric" dans la détection de contenu artificiel. Les patterns comme l'usage excessif de "en d'autres termes" (reformulation qui n'ajoute rien), les faux parallélismes, les conclusions circulaires.
    
6. **La "rhétorique computationnelle"** : Existe-t-il un champ de recherche émergent sur la rhétorique spécifique aux LLM ? Comment les modèles apprennent-ils les patterns rhétoriques humains et pourquoi les surproduisent-ils ? Le lien avec le RLHF qui récompense la "persuasivité perçue" au détriment de la substance.
    

**Structure cible du skill** :

```
---
name: fausse-profondeur
description: Détection de figures rhétoriques mécaniques simulant l'éloquence
  sans apporter de sens. Activé pendant /review et /polish.
---

## Triades percutantes
[Définition, exemples, variantes, distinction mécanique vs légitime]

## Profondeur non méritée
[Phrases dramatiques vides, patterns, exemples]

## Questions rhétoriques vides
[Pattern question-réponse immédiate, variantes]

## Autres patterns
[Reformulations vides, faux parallélismes, conclusions circulaires]

## Grille de détection pour Claude
[Checklist concrète avec seuils de tolérance]

## Quand c'est légitime
[Cas où ces figures sont utilisées intentionnellement et efficacement]
```

**Relations avec d'autres skills** : Alimente `writing-voice.md` pour la liste des patterns interdits. Complémentaire à `slop-poli.md` (R5) : R5 détecte l'absence de substance, R7 détecte les _simulacres_ de substance.

---

## 5. Description détaillée des commands

### 5.1 — `/braindump` : Capture et dialogue socratique (Phases 1+2)

**Objectif** : Fusionner les phases de capture brute et de dialogue socratique en une seule commande. L'auteur colle ses notes brutes, Claude questionne pour faire émerger les idées implicites.

**Ce que Claude fait** : Questionner, pas rédiger. Le ratio est 70% humain / 30% IA. Claude lit les notes, identifie la thèse implicite, les hypothèses non formulées, les angles personnels, et pose des questions une par une.

**Ce que Claude ne fait pas** : Rédiger du contenu, proposer un plan, résumer les notes, "améliorer" les idées.

**Skills activés** : `writing-voice` (toujours), `article-types` (si le type est précisé), `delegation-totale` (garde-fou), `cognitive-outsourcing` (garde-fou).

**Inputs attendus** : Notes brutes de l'auteur via `$ARGUMENTS`, ou fichier local si connecteur configuré.

**Outputs** : Série de questions, une à la fois, avec attente de réponse entre chaque.

**Variantes** :

- Mode "Socratic Sparring Partner" : contradicteur bienveillant qui interroge les prémisses
- Mode "Exploration libre" : questions ouvertes sans direction imposée

---

### 5.2 — `/structure` : Plan structuré (Phase 3)

**Objectif** : L'auteur propose un plan, Claude le challenge. La commande n'accepte pas d'input sans plan de l'auteur.

**Ce que Claude fait** : Analyser la progression logique, identifier les angles morts, signaler les sections à risque de généricité, proposer des réagencements uniquement si justifiés logiquement. Ratio 80% humain / 20% IA.

**Ce que Claude ne fait pas** : Créer un plan from scratch, proposer des "cookie-cutter subheadings", imposer un template.

**Skills activés** : `writing-voice`, `article-types`, `structure-symetrique` (pour vérifier que le plan ne ressemble pas à un template IA), `delegation-totale` (garde-fou).

**Inputs attendus** : Plan de l'auteur + description de l'angle + audience cible.

**Outputs** : Analyse critique du plan avec suggestions justifiées.

**Garde-fous spécifiques** : Si l'auteur ne fournit pas de plan et demande à Claude d'en créer un, rediriger vers `/braindump` d'abord.

---

### 5.3 — `/draft` : Rédaction dirigée (Phase 4)

**Objectif** : Aider l'auteur à débloquer des passages précis pendant la rédaction, sans générer de sections entières. Deux modes de fonctionnement.

**Mode A — Déblocage ponctuel (par défaut)** : L'auteur écrit, bloque sur un passage, soumet ce passage. Claude reformule _ce passage_ en gardant les idées et le ton de l'auteur. Ratio 70-90% humain / 10-30% IA.

**Mode B — Directeur paragraphe par paragraphe (sur demande)** : L'auteur décrit ce qu'il veut paragraphe par paragraphe, Claude articule ses idées. Signale les idées mal conçues.

**Skills activés** : `writing-voice` (critique), `slop-poli` (prévention — Claude doit éviter de produire du slop lui-même), `cognitive-outsourcing` (garde-fou).

**Inputs attendus** : Passage bloquant (mode A) ou description du paragraphe souhaité (mode B).

**Outputs** : Reformulation (mode A) ou paragraphe dirigé (mode B), limité à un paragraphe par interaction.

**Garde-fous spécifiques** :

- Ne jamais générer plus d'un paragraphe sans validation
- Surveiller la tendance à glisser vers l'explication plutôt que l'argumentation
- Signaler les incohérences plutôt que les masquer

---

### 5.4 — `/review` : Relecture critique (Phase 5)

**Objectif** : Soumettre un article complet pour une analyse critique multi-axes. C'est la commande la plus importante du plugin — elle mobilise le maximum de skills.

**Ce que Claude fait** : Identifier les faiblesses sur 5 axes (argumentation, clarté, structure, authenticité, manques) avec localisation précise. Ratio 40% humain / 60% IA.

**Ce que Claude ne fait pas** : Réécrire quoi que ce soit. Proposer des reformulations. Corriger directement.

**Skills activés** : Tous les skills de détection — `slop-vocabulary`, `marqueurs-lexicaux`, `structure-symetrique`, `slop-poli`, `fausse-profondeur`, plus `writing-voice` et `article-types`.

**Inputs attendus** : Article complet via `$ARGUMENTS` ou fichier local.

**Outputs** : Liste de problèmes, chacun avec localisation, nature, explication du _pourquoi_. Pas de corrections proposées.

**Format de sortie** :

```
[Section X, paragraphe Y]
Nature : [argumentation faible / pattern IA / structure symétrique / ...]
Problème : [description]
Pourquoi c'est un problème : [explication]
```

---

### 5.5 — `/polish` : Polish linguistique final (Phase 6)

**Objectif** : Corrections de surface uniquement — grammaire, fluidité, cohérence terminologique. Aucun changement de fond.

**Ce que Claude fait** : Corriger les fautes, scinder les phrases trop longues, combler les transitions manquantes, éliminer les répétitions. Ratio 50% humain / 50% IA.

**Ce que Claude ne fait pas** : Changer le ton, le niveau de langage, les opinions, les expressions familières volontaires, la structure.

**Skills activés** : `writing-voice`, `slop-vocabulary` (scan final), `fausse-profondeur` (scan final).

**Inputs attendus** : Version quasi-finale de l'article.

**Outputs** : Texte corrigé avec chaque modification marquée `[MODIFIÉ: raison]` pour acceptation/rejet individuel.

---

## 6. Matrice de couverture skills × commands

|Skill|/braindump|/structure|/draft|/review|/polish|Global|
|---|:-:|:-:|:-:|:-:|:-:|:-:|
|writing-voice|✓|✓|✓|✓|✓|✓|
|article-types|✓|✓|·|✓|·|·|
|slop-vocabulary (R1)|·|·|·|✓|✓|·|
|delegation-totale (R2)|✓|✓|·|·|·|✓|
|marqueurs-lexicaux (R3)|·|·|·|✓|✓|·|
|structure-symetrique (R4)|·|✓|·|✓|·|·|
|slop-poli (R5)|·|·|✓|✓|·|·|
|cognitive-outsourcing (R6)|✓|·|✓|·|·|✓|
|fausse-profondeur (R7)|·|·|·|✓|✓|·|

✓ = activé · = non activé

---

## 7. Plan d'intégration des rapports de recherche

### Processus par rapport

Pour chacun des 7 rapports (R1 à R7) :

1. **Lecture du rapport** : Identifier les données factuelles, les mécanismes causaux, les taxonomies, les seuils et les exemples
2. **Extraction** : Séparer ce qui relève du skill (connaissance opérationnelle pour Claude) de ce qui relève de la culture générale (intéressant mais non actionnable)
3. **Rédaction du skill** : Écrire le fichier .md en suivant la structure cible définie ci-dessus
4. **Calibration** : Vérifier que le skill reste sous 300 lignes (cible) / 500 lignes (maximum absolu)
5. **Test** : Soumettre un article-test et vérifier que le skill s'active correctement et produit des résultats utiles
6. **Itération** : Ajuster les seuils, exemples et formulations selon les résultats

### Ordre d'intégration recommandé

|Ordre|Rapport|Raison|
|:-:|---|---|
|1|R1 — slop-vocabulary|Fondation : liste de mots, utilisée par writing-voice et les commandes de relecture|
|2|R7 — fausse-profondeur|Complète R1 : patterns rhétoriques, utilisés par writing-voice|
|3|R4 — structure-symetrique|Signal structurel indépendant des deux précédents|
|4|R5 — slop-poli|Signal sémantique, mobilise les concepts de R1, R7, R4|
|5|R3 — marqueurs-lexicaux|Approfondit R1, potentiellement fusionnable|
|6|R2 — delegation-totale|Garde-fou, moins dépendant des autres rapports|
|7|R6 — cognitive-outsourcing|Garde-fou, moins dépendant des autres rapports|

### Critères de validation par skill

- [ ] Le skill est auto-contenu (compréhensible sans lire le rapport source)
- [ ] Le skill est actionnable (Claude peut l'appliquer immédiatement)
- [ ] Le skill est calibré (seuils de détection, gestion des faux positifs)
- [ ] Le skill est concis (< 300 lignes, cible < 200 lignes)
- [ ] Le skill contient des exemples concrets (pas seulement des principes abstraits)
- [ ] Le skill distingue "quand signaler" et "quand ne pas signaler"

---

## 8. Extensions futures

### Court terme (post-intégration des 7 rapports)

- **Fichier `settings-local.md`** : Échantillons d'écriture de l'auteur (3-5 articles) pour calibration Custom Styles
- **Commande `/status`** : Résumé de l'état d'avancement dans le workflow (phase courante, notes accumulées, problèmes identifiés)

### Moyen terme

- **Connecteur MCP Obsidian** : Récupérer les notes brutes depuis le vault sans copier-coller
- **Commande `/ideate`** : Phase 0 — exploration d'angles avant même le braindump
- **Agent `style-checker`** : Sub-agent dédié qui analyse les échantillons d'écriture pour extraire automatiquement les règles de style

### Long terme

- **Commande `/publish`** : Phase 7 — génération automatique du front-matter, meta descriptions, tags SEO
- **Métriques de session** : Tracking du ratio humain/IA par article, évolution dans le temps
- **Multi-langue** : Adaptation des listes de mots et patterns pour d'autres langues que FR/EN