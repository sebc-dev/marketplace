---
description: "Étape 6 d'une campagne, la dernière : valide mécaniquement le plugin cible, puis mesure que ses skills se déclenchent sur les vraies questions de leur domaine — une session claude -p fraîche par requête, la réponse lue sur l'appel Skill réellement émis, aucun modèle juge. Pose le harnais de régression dans le plugin cible hors publication, itère les correctifs de description sur le train, ne prononce le verdict que sur le test, et ne coche que ce qu'elle a exécuté."
argument-hint: "<plugin-cible> [-- --passes N | --only ID]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - Bash
  - AskUserQuestion
disable-model-invocation: true
---

## Contexte

Dernière étape du pipeline, et elle porte deux choses distinctes dont la première passe d'abord :
la **validation mécanique** du plugin cible — un frontmatter cassé se comporte exactement comme une
description faible —, puis la **mesure de déclenchement**, qui répond à une seule question : *une
vraie question d'utilisateur atteint-elle le bon skill ?*

Elle se mesure sur le comportement réel. Chaque requête part dans une session `claude -p` fraîche,
et la réponse se lit sur l'appel d'outil `Skill` que le modèle émet — pas sur ce qu'il dit de
lui-même. « Est-ce que tu chargerais le skill X ? » mesure autre chose.

Le harnais reste **dans le plugin cible et hors publication** : c'est un harnais de régression, pas
un artefact de campagne. Toute édition future d'une `description:` devra être re-notée contre lui.
Le précédent complet est `scd-flutter/evals/` — sept skills, 126 requêtes.

Ratio : 30% humain / 70% AI (tu écris le corpus et tu joues les runs ; l'humain autorise le coût et
lit le verdict).

## Règles absolues

- **On ne coche que ce qu'on a exécuté.** Un harnais écrit n'est pas un harnais joué ; un run lancé
  n'est pas un run noté. Aucun état ne s'affirme avant d'avoir été constaté sur le disque.
- **Aucun modèle juge, aucun auto-rapport.** La session se coupe **au premier appel `Skill`** — le
  corps n'est jamais chargé, c'est la décision qu'on mesure. Tant qu'aucun skill n'est appelé, le
  tour va **jusqu'au bout** : un bloc de texte n'est pas une décision, et couper dessus compterait
  un succès comme un échec.
- **Le seuil se dérive du nombre de passes** (`n // 2 + 1`) — il ne se code pas en dur. Un seuil
  figé à « 2 sur 3 » sous-note silencieusement toute campagne jouée à un autre nombre de passes.
- **Cinq passes, pas trois.** À 3, le plancher de bruit est du même ordre que la marge du verdict :
  trois passes coûtent moins cher et ne peuvent pas prononcer.
- **Le verdict se prononce sur `test` uniquement**, les correctifs s'itèrent sur `train`. Noter une
  description contre les requêtes sur lesquelles on l'a réglée ne mesure rien.
- **Le contrôle de contamination passe avant la mesure.** Une requête qui reprend les termes exacts
  d'une description mesure une correspondance de chaîne, pas un routage.
- **Le correctif va dans la `description:`, formulé positivement** — ce que le skill revendique, pas
  ce qu'il interdit. Ré-introduire une clause « ne pas utiliser pour… » pour réparer une near-miss
  est le réflexe naturel, et il ne tient pas.
- **Le modèle s'enregistre, il ne se suppose pas.** Un alias est résolu côté serveur : chaque
  enregistrement porte l'identifiant du modèle qui a réellement répondu, et **deux runs dont
  l'identifiant diffère ne sont pas comparables**, quoi que dise la version du binaire.
- **Le coût s'annonce avant de se dépenser** : une session par requête **et par passe**.

## Processus

1. **Résous le plugin cible.** `$1` est son répertoire ; absent ou inexistant, **arrête-toi**. Lis
   sa carte de campagne si elle existe — elle dit quels sujets sont `Distillé`, ce qui se lit avec
   le verdict. Pas de carte : continue quand même. **Le harnais mesure un plugin, pas une
   campagne.**

2. **Charge le skill `campaign` et sa `references/evals.md`** intégralement : les deux formes de
   requête, les cinq conditions de comparabilité, le train/test, la lecture d'un échec et la liste
   de validation mécanique s'y lisent.

3. **Joue la validation mécanique, et elle est bloquante.** `claude plugin validate
   ./<plugin-cible>` au vert ; chaque `SKILL.md` porte `name` (kebab-case, identique au répertoire)
   et `description` ; les références sont à **un seul niveau** depuis leur `SKILL.md` et toute
   référence de plus de 100 lignes porte sa table des matières ; toute commande à effet de bord
   porte `disable-model-invocation: true` et un `allowed-tools` réduit au nécessaire ; les chemins
   sont en slashs. Un défaut ici se corrige **avant** de mesurer : réécrire une description qui n'a
   jamais été livrée ne change rien.

4. **Pose ou reprends le harnais** dans `<plugin-cible>/evals/`, sur le modèle de
   `scd-flutter/evals/` : `run.py`, `score.py`, `check_contamination.py`, `queries.jsonl`, `runs/`,
   un `.gitignore` pour le répertoire de travail, un `README.md` qui dit ce qui est mesuré et
   comment le rejouer. Un harnais existant **ne se réécrit pas** : il se complète. Puis vérifie sur
   `publish.json` que rien de `evals/` n'est publié — l'allowlist, pas une intention.

5. **Écris le corpus.** Dimensionnement de départ : **9 positives et 9 near-miss par skill**,
   réparties sur les couples de skills qui se disputent réellement du vocabulaire. Une near-miss est
   faite pour être piégeuse — elle partage du vocabulaire avec la description qu'elle ne doit **pas**
   déclencher, et c'est le test. Découpage **train/test 60/40 par skill**. Garde un **contrôle
   témoin** : une requête qui doit déclencher franchement, et qui dira si le harnais se soupçonne
   lui-même avant qu'on soupçonne les descriptions.

6. **Contrôle la contamination** (`check_contamination.py`) avant toute campagne de mesure. La
   dérive s'installe quand on écrit une requête *après* avoir lu la description qu'on veut valider.

7. **Annonce le coût et fais autoriser** (`AskUserQuestion`) : requêtes × passes = sessions, et
   dis le nombre. Le débogage d'une requête isolée se joue à **une** passe (`--only`, `--passes 1`)
   et n'a pas besoin d'autorisation.

8. **Joue le run**, dans les cinq conditions qui rendent deux campagnes comparables : ce plugin
   seul (tous les autres désactivés au lancement, les skills intégrés restent — un vrai utilisateur
   les a aussi) ; aucun contexte de projet (répertoire vide) ; aucun outil sauf `Skill` ; le modèle
   enregistré et non supposé ; le corpus figé — les requêtes ajoutées pour instruire une couture
   précise vivent dans un **fichier à part**. Les résultats bruts se conservent, un fichier par
   campagne : c'est ce qui permet de re-noter d'anciens runs quand la méthode de notation change.

9. **Note.** `--split train` pour viser un correctif, `--split test` pour le verdict. Les deux se
   lisent, un seul prononce.

10. **Corrige, au plus cinq tours.** Avant de réécrire quoi que ce soit, écarte les deux causes qui
    rendent toute réécriture inutile : la description a-t-elle été **évincée du listing** (budget —
    au dépassement, Claude Code tronque puis supprime celles des skills les moins invoqués), et le
    frontmatter est-il **valide** ? `/doctor`, `/context` et `--debug` répondent aux deux. Puis
    corrige dans la `description:`, positivement. Au-delà de cinq tours, ce n'est plus la
    formulation qui est en cause : c'est le **découpage** des skills ou la frontière entre deux
    d'entre eux, et ça se dit à l'humain.

11. **Conserve.** Le run noté reste dans `runs/`, avec son identifiant de modèle et son nombre de
    passes. Rien ne se coche sur la carte — il n'y a pas de colonne pour ça.

## Ce que tu NE fais PAS

- Tu **ne mesures pas la justesse du contenu distillé** : un skill faux se déclenche aussi bien
  qu'un skill juste. La justesse se joue à l'intake et à la distillation.
- Tu **ne mesures pas la conformité de la sortie** : voir un skill se déclencher dit que le modèle
  l'a trouvé, pas qu'il a fait ce qu'on voulait. C'est une seconde mesure, et elle se fait autrement
  — mêmes questions **avec et sans** le skill, puis comparaison.
- Tu **n'écris pas dans le corps d'un skill pour réparer un déclenchement.** Le routage se joue dans
  la `description:` ; le corps n'est jamais lu au moment de la décision.
- Tu **ne réintroduis aucune clause d'interdiction** dans une description, même pour réparer une
  near-miss tenace.
- Tu **ne mélanges pas au corpus de référence** les requêtes écrites pour instruire une couture :
  elles rendraient l'instrument incomparable d'une campagne à l'autre.
- Tu **ne notes aucun run que tu n'as pas joué**, et tu ne compares pas deux runs dont l'identifiant
  de modèle diffère.
- Tu **n'ajoutes pas le harnais à `publish.json`** et tu ne publies rien.
- Tu **n'écris rien dans `scd-atlas`**, et tu ne touches ni aux rapports, ni aux fiches de collecte.

## La carte

**Tu ne coches aucune colonne** — la carte n'en a pas pour les evals, et c'est délibéré : elle porte
une ligne par **sujet**, quand le harnais mesure un **plugin**. Un déclenchement ne s'attribue à
aucun sujet en particulier.

Tu la lis quand même, en lecture seule : elle dit quels sujets sont distillés, donc ce que la mesure
couvre réellement. Un plugin mesuré à mi-distillation se mesure valablement — mais le verdict se lit
avec ça en tête.

## Skills actifs

- `campaign` — `references/evals.md` **intégralement**. `references/carte.md` **en lecture seule**,
  pour savoir ce qui est distillé. `references/distillation.md` à un seul titre, et seulement à
  l'étape 10 : la section « La description est le déclencheur », qui dit comment une description se
  réécrit. `intake.md`, `collecte.md` et `appairage-doc.md` **ne se chargent pas ici**.
- **Pas de `research-prompter`.**

## À la fin

Affiche le **verdict sur `test`**, skill par skill, avec le nombre de passes et **l'identifiant du
modèle qui a réellement répondu** — sans lui, le run n'est comparable à rien. Puis les échecs qui
restent, et ce qu'ils disent : une near-miss isolée est une affaire de formulation, un skill qui
échoue partout est une affaire de découpage.

Dis l'état du **contrôle témoin**. S'il échoue en même temps que tout le reste, c'est le harnais
qu'on soupçonne, pas les descriptions.

Rappelle les deux choses qui se reperdent : le harnais est **de régression** — toute édition future
d'une `description:`, dans ce plugin, se re-note contre lui —, et il **n'est pas publié**, ce qui se
vérifie sur `publish.json`.

Puis : la campagne est terminée quand chaque sujet de la carte est `Distillé`. Ce qui reste ouvert
se reprend par l'étape qui le porte. **La publication est une demande humaine explicite** — aucune
commande de `scd-atlas` ne joue `/publish`, n'édite `marketplace.json` ni `publish.json`.
