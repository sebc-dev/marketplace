# Référence — le squelette d'un prompt Research

Chargée par `research-prompter` à la **composition**. Elle porte la **forme** du prompt ; la méthode
qui ne bouge pas — citations verbatim, niveaux de preuve, hypothèses concurrentes — est dans le
`SKILL.md` et ne se recopie pas ici.

- [Évaluer la portée](#évaluer-la-portée)
- [Calibrer](#calibrer)
- [Les sept blocs](#les-sept-blocs)
- [Quatre templates par cas d'usage](#quatre-templates-par-cas-dusage)
- [Anti-patterns](#anti-patterns)
- [Checklist avant de rendre](#checklist-avant-de-rendre)

## Évaluer la portée

Une session Research traite une seule question centrale. Scinder dès qu'**un seul** de ces critères
est rempli :

- plusieurs décisions indépendantes, prenables séparément ;
- sujets disjoints — périmètre, secteur ou objectif différents ;
- mélange macro/micro exigeant des familles de sources différentes ;
- plus de six angles distincts dans le `<content>` prévu ;
- livrable hétérogène — un tableau *et* un ADR *et* une synthèse ;
- rétrospective historique et prospective combinées ;
- audiences multiples — comité technique *et* comité d'investissement.

Ne pas scinder quand :

- les angles perdent leur sens séparément — comparer trois frameworks est **une** question à
  plusieurs options, pas trois questions ;
- l'humain demande explicitement une vision synthétique unique et accepte la perte de profondeur ;
- le sujet tient en six angles cohérents.

Le découpage se **propose**, il ne s'impose pas :

```
Analyse de portée

La demande couvre [N] sujets qui gagnent à être traités séparément :

1. **[Titre]** — [objectif central en une phrase]
   → Calibre : focalisé / standard / étendu
2. **[Titre]** — [...]

Séquence : [parallélisable / chaînée, et pourquoi]
Point de jonction : [comment les résultats se recombinent]

(A) construire les [N] prompts · (B) en prioriser un ·
(C) regrouper malgré la perte de profondeur ?
```

## Calibrer

Il n'existe **aucun** sélecteur de mode dans l'interface Research, et aucune durée officielle
courante. Le dimensionnement se pilote par la portée du prompt lui-même — ne jamais annoncer une
durée ni un nombre de sources garanti.

| Calibre | Contenu | Signature |
|---|---|---|
| **Focalisé** | 1 question, 2-3 angles | une réponse vérifiable, peu de sources contradictoires |
| **Standard** | 1 décision, 4-6 angles | comparaison ou état des lieux borné |
| **Étendu** | 1 décision, ≤ 6 angles + multi-entités | due diligence, revue de littérature, panorama |

## Les sept blocs

```xml
<goal>
[Verbe d'action] + [sujet précis] + [périmètre]
</goal>

<context>
Qui : [rôle, secteur]
Pourquoi : [décision servie par la recherche]
Contraintes : [budget, stack, équipe, géographie, période]
Déjà connu : [ce qu'il est inutile de redémontrer]
</context>

<content>
1. [Angle 1]
2. [Angle 2]
...  (≤ 6 angles)
</content>

<sources>
Prioriser : [sources primaires du domaine, URL canoniques exactes]
Traiter avec prudence : [agrégateurs, contenu sponsorisé, fermes SEO]
Période : [filtre temporel]
Signaler les désaccords entre sources réputées plutôt que de trancher silencieusement.
</sources>

<output>
Format : [structure attendue]
Éléments requis : [tableau, niveau de confiance par affirmation, recommandations,
seuils qui feraient réviser la recommandation]
</output>

<method>
Commence large, puis resserre sur les zones à enjeu.
Développe plusieurs hypothèses concurrentes et suis ton niveau de confiance pour chacune.
Avant de synthétiser, extrais verbatim les passages qui portent les affirmations clés.
Relis ta synthèse une fois : qu'est-ce qui manque, qu'est-ce qui ne tient que sur une
source unique ?
</method>

<rules>
Contexte : fonde-toi uniquement sur ce prompt. N'utilise ni mémoire, ni profil, ni
conversation antérieure, et n'infère aucune préférence à partir d'un historique.
Sourçage : tout chiffre, citation ou affirmation datée renvoie à une source effectivement
consultée. Pas d'URL ni de référence reconstituée de mémoire.
Incertitude : si les données manquent, divergent ou ne sont pas vérifiables, dis-le et
marque [INCERTAIN] plutôt que de combler.
Qualification : distingue fait établi / interprétation d'auteur / opinion, et source
primaire / reprise secondaire.
</rules>
```

Quatre points d'usage, chacun pour une raison :

- **`<method>` porte de la stratégie, pas de la mécanique.** C'est ce qui remplace les anciens
  déclencheurs de réflexion : le raisonnement est déjà actif, la façon de chercher ne l'est pas.
- **`<rules>` tient en un seul bloc.** Empiler sept interdits dans deux blocs distincts est
  exactement l'anti-pattern « répétition + impératif ». Une formulation suffit.
- **La consigne d'isolation reste justifiée** — Claude.ai dispose d'une mémoire et d'un contexte
  projet susceptibles de biaiser une recherche censée être neutre. Une phrase, pas un bloc.
- **Les URL exactes vivent dans `<sources>`.** Research ne construit aucune URL : ce qui n'est pas
  écrit là n'est pas atteignable. Préférer les pages `/blob/` aux `/raw/`, les variantes `.md`, et
  les index `llms.txt` quand ils existent.

## Quatre templates par cas d'usage

Chacun se complète des blocs `<method>` et `<rules>` standard, inchangés.

### 1. Comparaison de technologies

```xml
<goal>Compare [A], [B], [C] pour [cas d'usage], en vue de [décision].</goal>

<context>Stack actuel : [...]. Équipe : [taille, expertise]. Contraintes : [budget, scale, délai].</context>

<content>
1. Benchmarks de performance sur [les métriques qui comptent ici]
2. Maturité de l'écosystème (releases, mainteneurs, support)
3. Courbe d'apprentissage pour ce profil d'équipe
4. Coût total de possession sur 3 ans
5. Risques : vendor lock-in, dette de migration, signaux d'abandon
</content>

<sources>
Prioriser : documentation officielle, changelogs, benchmarks reproductibles, retours
d'entreprises comparables et nommées.
Traiter avec prudence : comparatifs d'éditeur, contenus sponsorisés, articles SEO génériques.
Période : 24 derniers mois, sauf pour l'historique de gouvernance du projet.
</sources>

<output>
Tableau comparatif + matrice pondérée + recommandation argumentée.
Un niveau de confiance par critère. Plan de migration si une bascule est recommandée.
</output>
```

### 2. Veille sectorielle / état de l'art

```xml
<goal>Établis l'état actuel et les dynamiques émergentes de [domaine] pour [secteur].</goal>

<content>
1. Acteurs et structure du marché
2. Évolutions des 12-18 derniers mois
3. Ruptures technologiques ou réglementaires à surveiller
4. Signaux faibles et angles morts du discours dominant
5. Risques sectoriels
</content>

<sources>
Prioriser : rapports d'analystes, publications réglementaires, études académiques,
communications d'acteurs primaires.
Traiter avec prudence : contenus de plus de 18 mois, blogs généralistes, reprises de communiqués.
</sources>

<output>Résumé exécutif (300 mots) + analyse par thème + ce qui reste non établi.</output>
```

### 3. Due diligence

```xml
<goal>Évalue [entreprise / solution] en vue de [investissement / adoption / partenariat].</goal>

<content>
1. Historique, gouvernance, positionnement
2. Solidité financière ou technique selon les données publiques
3. Forces et faiblesses documentées, avec sources nommées
4. Retours utilisateurs vérifiables
5. Signaux d'alerte, litiges, controverses
6. Alternatives comparables
</content>

<sources>
Prioriser : sources primaires (dépôts réglementaires, documentation officielle), avis
vérifiés, témoignages attribués.
Traiter avec prudence : communiqués, contenu auto-promotionnel, avis anonymes.
</sources>

<output>
Structure ADR (Status, Context, Decision, Consequences) + scorecard risques/opportunités.
Pour chaque risque, ce qu'il faudrait vérifier pour le confirmer ou l'écarter.
</output>
```

### 4. Document de référence technique

C'est le template d'une campagne `scd-atlas` : un sujet de la carte, une version fixée, un rapport
destiné à être distillé.

```xml
<goal>Constitue un document de référence sur [technologie, version précise].</goal>

<context>
Usage : matière première d'un skill pour agent de code. Audience : développeurs.
Stack : [...]. Version cible : [exacte, jamais « la dernière »].
</context>

<content>
1. Concepts et architecture
2. Patterns d'implémentation
3. Configuration et déploiement
4. Pièges non évidents et erreurs fréquentes
5. Écosystème et outils complémentaires
6. Évolutions récentes et ruptures de compatibilité
</content>

<output>
Document structuré, exemples de code, configurations types, liens vers sources primaires.
Priorise les pièges — ce qui casse, ce qui n'est pas dans la doc — sur les rappels de l'évident.
</output>
```

> **Ce que le rapport devient ensuite.** Un document de référence produit ainsi ne s'injecte pas tel
> quel dans un `CLAUDE.md` : le document monolithique chargé en amont est un anti-pattern documenté.
> Il se découpe en skill et références chargés à la demande — c'est l'étape de distillation.

## Anti-patterns

| Pratique | Statut | Motif |
|---|---|---|
| « Think step-by-step », « réfléchis en profondeur » | à retirer | raisonnement déjà actif ; gain marginal à négatif |
| Balise `<thinking>` manuelle | à retirer | second brouillon en conflit avec le raisonnement natif |
| Impératifs en majuscules répétés | à retirer | sur-déclenchement d'outils et sur-vérification documentés |
| Répéter une instruction en fin de prompt | à retirer | calibré pour des modèles qui écoutaient mieux la fin du contexte |
| Sept interdits dans deux blocs séparés | à condenser | un énoncé clair vaut mieux que sept cris |
| Demander cinq choses à la fois | à scinder | dilution du raisonnement, résultats superficiels |
| Contexte insuffisant | à corriger | symétrique du précédent : viser le minimum **nécessaire**, pas le minimum |
| Annoncer une durée ou un nombre de sources garanti | à retirer | aucune donnée officielle courante |
| Laisser le modèle deviner une URL | à corriger | Research ne construit aucune URL — la pré-collecte les fournit |

## Checklist avant de rendre

- [ ] Une seule question centrale ; découpage proposé si la demande était composite
- [ ] Verbe d'action et périmètre explicites dans `<goal>`
- [ ] Le *pourquoi* figure dans `<context>`, pas seulement le *quoi*
- [ ] Version cible nommée, quand le sujet en a une
- [ ] Six angles au plus dans `<content>`
- [ ] Sources priorisées **et** sources à traiter avec prudence ; URL exactes, jamais devinées
- [ ] Format de sortie décrit, avec ses éléments obligatoires et ce qui ferait réviser la conclusion
- [ ] `<method>` présent, sans déclencheur de réflexion
- [ ] `<rules>` présent, en prose, énoncé une fois
- [ ] Aucun impératif en majuscules, aucune répétition
- [ ] 150-350 mots
- [ ] Les hypothèses comblées faute de réponse humaine sont nommées dans le rendu
