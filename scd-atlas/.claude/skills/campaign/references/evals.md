# Référence — le harnais de déclenchement et la validation mécanique

Chargée par `campaign` aux **evals** (`/scd-atlas:evals`), la dernière étape du pipeline. Elle porte
la manière de mesurer qu'un skill distillé se déclenche sur les vraies questions de son domaine, et
la validation mécanique du plugin cible. Comment le skill est écrit est dans `distillation.md`.

Le précédent complet est `scd-flutter/evals/` — sept skills, 126 requêtes, harnais non publié.

- [Ce que le harnais mesure](#ce-que-le-harnais-mesure)
- [Les deux formes de requête](#les-deux-formes-de-requête)
- [Les conditions à contrôler](#les-conditions-à-contrôler)
- [Train et test](#train-et-test)
- [La contamination](#la-contamination)
- [Où vit le harnais, et ce qu'il coûte](#où-vit-le-harnais-et-ce-quil-coûte)
- [Lire un échec](#lire-un-échec)
- [La validation mécanique](#la-validation-mécanique)
- [Ce que les evals ne mesurent pas](#ce-que-les-evals-ne-mesurent-pas)

## Ce que le harnais mesure

Une seule chose : **une vraie question d'utilisateur atteint-elle le bon skill ?** Et elle se mesure
sur le comportement réel, pas sur une déclaration :

- chaque requête part dans une session `claude -p` **fraîche** ;
- la réponse se lit sur l'appel d'outil `Skill` que le modèle émet réellement ;
- **aucun modèle juge, aucun auto-rapport.** « Est-ce que tu chargerais le skill X ? » mesure ce que
  le modèle dit de lui-même, ce qui n'est pas la question.

La session se coupe **au premier appel `Skill`** : le corps du skill n'est jamais chargé, la réponse
n'est jamais produite — c'est la décision qu'on mesure, pas la sortie. En revanche, tant qu'aucun
skill n'est appelé, **le tour va jusqu'au bout** : un bloc de texte n'est pas une décision, le modèle
écrit régulièrement un préambule avant de prendre un outil, et couper dessus compterait un succès
comme un échec.

## Les deux formes de requête

| Forme | Ce qu'elle est | Elle passe quand |
|---|---|---|
| **positive** | une question qui appartient au skill visé | le skill attendu se charge dans une **majorité stricte** des passes |
| **near-miss** | une question qui *ressemble* au skill visé et appartient à un autre | le skill interdit se charge dans **moins de la moitié** des passes |

Une near-miss est faite pour être piégeuse : elle partage du vocabulaire avec la description du skill
qu'elle ne doit pas déclencher. C'est le test, pas un défaut du test.

**Le seuil se dérive du nombre de passes** (`n // 2 + 1`), il ne se code pas en dur. Un seuil figé à
« 2 sur 3 » sous-note silencieusement toute campagne jouée à un autre nombre de passes — à 5 passes,
une near-miss dont le skill interdit part 3 fois sur 5 passerait encore.

**Cinq passes, pas trois.** À 3, le plancher de bruit est du même ordre que la marge du verdict : une
re-passe à descriptions strictement identiques peut déplacer plusieurs verdicts et laisser le gate à
moins d'un point de son seuil. Trois passes coûtent moins cher et ne peuvent pas prononcer.

Dimensionnement de départ, sur le précédent : **9 positives + 9 near-miss par skill**, réparties sur
les couples de skills qui se disputent réellement du vocabulaire.

## Les conditions à contrôler

Une mesure de déclenchement n'a de sens que comparée à une autre. Ces cinq conditions sont ce qui
rend deux campagnes comparables :

- **ce plugin seul.** Tous les autres plugins installés sur la machine sont désactivés au lancement.
  Les skills intégrés de Claude Code restent — un vrai utilisateur les a aussi. Installer un plugin
  de plus sans l'ajouter à la liste de désactivation casse la comparabilité sans rien signaler ;
- **aucun contexte de projet.** Les sessions tournent dans un répertoire vide : pas de `CLAUDE.md`,
  pas d'arborescence, rien sur quoi router que la question ;
- **aucun outil sauf `Skill`.** Tout le reste est refusé, pour que le modèle ne puisse pas aller lire
  le dépôt et en déduire où la question appartient ;
- **le modèle enregistré, pas supposé.** Un alias (`sonnet`) est résolu côté serveur, et une révision
  derrière l'alias est invisible dans la version du binaire. Chaque enregistrement porte l'identifiant
  du modèle qui a réellement répondu ; **deux runs dont l'identifiant diffère ne sont pas
  comparables**, quoi que dise le binaire ;
- **le corpus figé.** Les requêtes ajoutées pour instruire une couture précise vivent dans un fichier
  **à part**, joué à la demande — les mélanger au corpus de référence rend l'instrument
  incomparable d'une campagne à l'autre.

## Train et test

Découpage **60/40 par skill**. Les correctifs s'itèrent sur `train` ; **le verdict se prononce sur
`test` uniquement.** Noter une description contre les requêtes sur lesquelles on l'a réglée ne mesure
rien.

La boucle de correction se **plafonne** — cinq tours. Au-delà, ce n'est plus la formulation qui est en
cause : c'est le découpage des skills, ou la frontière entre deux d'entre eux.

## La contamination

Un contrôle à jouer **avant** toute campagne de mesure : les requêtes ne doivent pas réciter les
descriptions. Une requête qui reprend les termes exacts d'une description mesure une correspondance
de chaîne, pas un routage. La dérive est insidieuse — elle s'installe quand on écrit une requête
*après* avoir lu la description qu'on veut valider.

## Où vit le harnais, et ce qu'il coûte

**Dans le plugin cible, et non publié.** C'est un harnais de régression, pas un artefact de campagne :
toute édition future d'une `description:` doit être re-notée contre lui. Il reste donc dans le
plugin, hors de l'allowlist de publication — ce qui se vérifie sur `publish.json`, pas sur une
intention.

Le coût est réel et se calcule avant de lancer : **une session par requête et par passe**. Sept
skills à 18 requêtes, jouées 5 fois, font plus de six cents sessions. Une campagne de mesure se
lance donc quand on a quelque chose à mesurer, et le débogage d'une requête isolée se fait à une
passe.

Les résultats bruts se conservent, un fichier par campagne : c'est ce qui permet de re-noter
d'anciennes campagnes quand la méthode de notation change — et cela arrive.

## Lire un échec

**Le correctif va dans la `description:`** — c'est là que se joue le routage, le corps n'étant jamais
lu au moment de la décision. Il se formule **positivement** : ce que le skill revendique, pas ce
qu'il interdit. Ré-introduire une clause d'interdiction pour réparer une near-miss est le réflexe
naturel et il ne tient pas ; la frontière se dit *porte uniquement X · le reste appartient à Y*.

Avant de réécrire quoi que ce soit, écarter les deux causes qui rendent toute réécriture inutile : la
description a-t-elle été **évincée du listing** (budget), et le frontmatter est-il **valide** ?
`/doctor`, `/context` et `--debug` répondent aux deux.

Un contrôle témoin vaut d'être gardé dans le corpus : **une requête dont on sait qu'elle doit
déclencher**, franchement. Si elle échoue en même temps que tout le reste, le harnais se soupçonne
lui-même avant les descriptions — la littérature rapporte un déclenchement automatique nul en mode
headless sur certaines versions, quand le précédent `scd-flutter` y mesure des déclenchements réels.
Les deux ne peuvent pas être vrais partout : le témoin dit dans lequel des deux mondes on se trouve.

## La validation mécanique

Elle est séparée de la mesure, et elle passe d'abord :

- `claude plugin validate ./<plugin-cible>` au vert — sur le manifeste du plugin ;
- chaque `SKILL.md` porte `name` (kebab-case, identique au répertoire) et `description` ;
- les références sont à **un seul niveau** depuis leur `SKILL.md`, et toute référence de plus de 100
  lignes porte sa table des matières ;
- toute commande à effet de bord porte `disable-model-invocation: true`, et son `allowed-tools` est
  réduit au nécessaire ;
- les chemins sont en slashs, jamais en séparateurs Windows.

## Ce que les evals ne mesurent pas

- **La conformité de la sortie.** Voir un skill se déclencher dit que le modèle l'a trouvé, pas qu'il
  a fait ce qu'on voulait. C'est une seconde mesure, et elle se fait autrement : mêmes questions en
  session fraîche **avec et sans** le skill, et comparaison des réponses.
- **La justesse du contenu distillé.** Un skill faux se déclenche aussi bien qu'un skill juste. La
  justesse se joue à l'intake et à la distillation, pas ici.
- **Le comportement chez l'utilisateur final.** La mesure tourne sans contexte de projet, ce qui est
  ce qu'on veut pour isoler le routage — et ce qui la rend muette sur le reste.

Et une règle d'écriture de l'étape elle-même : **on ne coche que ce qu'on a exécuté.** Un harnais
écrit n'est pas un harnais joué, un run lancé n'est pas un run noté, et la carte ne porte l'état
d'aucun des deux avant de l'avoir constaté sur le disque.
