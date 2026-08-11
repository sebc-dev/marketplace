---
description: "Étape 5 d'une campagne : écrit le skill cible et ses références à partir de ce que l'intake a retenu — invariants, pièges, écarts entre majeures, choix par défaut avec leur motif. Tranche le rang de chaque chose (tête du SKILL.md, corps, référence), l'appairage à la documentation vivante de la techno sous la règle R7, et en mise à jour les quatre gestes : inchangé, touché, apparu, disparu. N'écrit que dans le plugin cible, et jamais un fait qu'aucune source ne porte."
argument-hint: "[plugin-cible] [campagne] [-- NN du sujet]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
disable-model-invocation: true
---

## Contexte

C'est ici que la campagne produit sa valeur. Tout ce qui précède a rassemblé et trié de la
matière ; tu écris le seul artefact qui servira ensuite tous les jours — le skill cible et ses
références.

**Un skill n'est pas le résumé d'un rapport.** Le rapport répond à une question de recherche ; le
skill répond à ce qu'un agent doit faire ou éviter quand il travaille dans la techno. Le second ne
se déduit pas du premier par compression : il se choisit. Ce qui mérite de descendre est ce qui
**n'est pas récupérable en ligne tel quel** — l'invariant, le piège, l'écart entre majeures, le
choix par défaut avec son motif.

Ratio : 30% humain / 70% AI (tu écris ; l'humain tranche ce qui se **retire** et ce qui
s'**embarque** — les deux gestes qu'on ne défait pas gratuitement).

## Règles absolues

- **Tu n'écris que dans le plugin cible.** Jamais dans `scd-atlas`, jamais dans un autre plugin,
  jamais dans les rapports, jamais dans une campagne antérieure.
- **Ce que l'intake n'a pas retenu ne descend pas**, et ce qu'il a retenu **avec réserve** descend
  **avec sa réserve**. Tu ne rejuges pas ses verdicts : un doute se dit, il ne se retranche pas.
- **Les classes de preuve survivent au passage.** Ce qui était incertain dans le rapport ne devient
  pas un fait dans le skill : un chiffre non recoupé, promotionnel ou issu de rétro-ingénierie ne
  descend pas — pas même étiqueté, s'il n'a aucun usage opératoire. Un seuil opérationnel s'écrit
  souvent mieux comme une **question** que comme un nombre.
- **Un fait daté descend avec sa date**, et de préférence dans une référence à part dont la
  péremption est déclarée en tête. **Un désaccord descend comme désaccord.**
- **Les instructions décisives en haut du `SKILL.md`.** Après compaction, un corps de skill est
  réinjecté plafonné à 5 000 tokens, **début conservé** : une fin de fichier est du texte qu'on perd
  en session longue.
- **La description est le déclencheur**, pas de la documentation : le routage se joue sur le couple
  `name` + `description`, et le corps n'est **jamais** lu au moment de la décision. La frontière s'y
  dit **positivement** — *porte uniquement X · le reste appartient à Y* —, jamais « ne pas utiliser
  pour… », qui rend le comportement interdit plus disponible.
- **R7 est une règle, pas une préférence.** Un `.mcp.json` ne s'embarque que pour un serveur publié
  par **l'éditeur de la technologie** ; tout serveur tiers se documente — commande d'installation
  écrite, jamais exécutée. Elle est déjà tranchée et ne se repose pas campagne par campagne.
- **Aucun fait qu'aucun rapport ni aucune fiche ne porte.** Un manque se déclare comme manque ; il
  ne se comble pas à l'écriture.
- **Retirer se fait explicitement, et sous l'œil de l'humain.**

## Processus

1. **Résous la campagne.** `$1` le plugin cible, `$2` le répertoire de campagne. Absents : cherche
   les cartes existantes. Une seule : prends-la. Zéro ou plusieurs : **arrête-toi** et demande.

2. **Charge le skill `campaign`**, sa `references/carte.md` et sa **`references/distillation.md`**
   intégralement. `references/appairage-doc.md` se charge à l'étape 6, quand l'appairage se tranche
   — pas avant.

3. **Sélectionne les sujets** : case `Comblé` à `✓`, case `Distillé` à `—`. Un sujet dont la liste
   de comblement est encore ouverte **ne se distille pas** : signale-le et renvoie vers
   `/scd-atlas:intake`. Un `NN` en argument restreint à ce seul sujet.

4. **Inventorie l'existant.** En **mise à jour** : le `SKILL.md` cible, ses références, ce que
   chaque fichier porte déjà et où. En **création** : il n'y a rien à inventorier, et le squelette
   se pose à l'étape 7.

5. **Trie ce qui descend, sujet par sujet.** Invariant, piège avec son **symptôme observable**,
   écart entre majeures, choix par défaut avec son motif. Ne descendent pas : ce que le modèle sait
   déjà, ce qu'une signature d'API dira mieux et plus frais que nous, et ce que l'environnement du
   projet dit lui-même — un skill qui recopie l'environnement est un cache, il n'est justifié que
   quand la consultation coûte cher, et il périme en silence.

6. **Tranche le rang de chaque chose — c'est LA décision de l'étape.** Trois rangs : tête du
   `SKILL.md` (ce qu'il faut avoir lu pour ne pas se tromper), corps plus bas (la table consultée à
   la demande), fichier de `references/` (ce qu'une seule branche atteint, ou ce qui est volumineux,
   ou ce qui est daté). La règle de partage : **ce dont toutes les branches ont besoin reste dans le
   fichier ; ce qu'une seule branche atteint descend derrière un pointeur.** Trois contraintes de
   mécanique ne se négocient pas : références à **un seul niveau** depuis le `SKILL.md`, table des
   matières au-delà de 100 lignes, **point de chargement déclaré** pour chaque référence.

7. **Tranche l'appairage.** Charge `references/appairage-doc.md` et applique l'arbre : plugin
   officiel de l'éditeur → ne pas dupliquer, en dépendre ; MCP officiel → l'embarquer avec le skill
   qui enseigne **quand** l'appeler ; `llms.txt` exploitable → skill statique et URL épinglées, qui
   est l'option par défaut. **La position d'un écosystème se constate, avec sa date** — si la
   campagne ne l'a pas collectée, c'est un trou, pas une supposition. Tout ajout ou modification
   d'un `.mcp.json` passe par l'humain (`AskUserQuestion`), R7 ayant déjà exclu le cas tiers.

8. **Écris.** En création : le `SKILL.md` puis ses références. En mise à jour : les **quatre
   gestes**, un par un, par `Edit` ciblés — *inchangé* → ne pas toucher (réécrire ce qu'on n'a pas
   re-sourcé est le moyen le plus rapide de perdre une vérité au profit d'une reformulation) ;
   *touché* → remplacer le passage concerné et **seulement** lui ; *apparu* → poser au rang qui lui
   revient ; *disparu* → retirer, **après accord humain**. Ce qui décrit une version morte se
   supprime ; ce qui décrit un **écart entre majeures reste**, parce que c'est justement ce qui a de
   la valeur.

9. **Fais descendre les irréductibles** que l'intake a marqués sans pouvoir les écrire — campagne de
   création, skill inexistant à l'époque. Une limite s'écrit **là où quelqu'un irait la chercher**.

10. **Relis la description, même si tu n'y as pas touché.** Un skill qui a gagné une branche et pas
    un déclencheur ne se déclenchera pas dessus. Troisième personne, cas d'usage clé en tête, termes
    concrets d'utilisateur et non termes internes du plugin, **un déclencheur par branche** (deux
    synonymes sont une branche écrite deux fois), et **entre guillemets** si elle contient `:`, `#`
    ou `[` — un YAML cassé se comporte exactement comme une description faible.

11. **Vérifie ce que le skill produit doit porter** quel que soit l'appairage : les **URL canoniques
    épinglées** — aucun agent ne va chercher un index qu'on ne lui nomme pas — et **la version
    visée**, écrite, avec la manière de la lire dans le manifeste du projet.

12. **Élague, puis coche.** Chaque ligne passe le test : *change-t-elle quelque chose par rapport à
    ce que le modèle ferait sans elle ?* Si non, supprime la phrase entière plutôt que de la
    raccourcir. Puis coche `Distillé`, sujet par sujet, après avoir constaté le passage sur le
    disque.

## Ce que tu NE fais PAS

- Tu **ne rejuges pas ce que l'intake a tranché**. Un doute sur un verdict se signale à l'humain ; il
  ne se corrige pas en silence à l'écriture.
- Tu **n'écris rien dans `scd-atlas`** — ni dans ses skills, ni dans ses références, ni dans sa
  documentation.
- Tu **ne touches à aucun rapport** ni à aucun artefact d'une campagne antérieure.
- Tu **n'exécutes aucune installation** — pas de `claude mcp add`, pas de gestionnaire de paquets,
  pas de serveur démarré. Tu n'as pas `Bash`, et c'est délibéré : un plugin écrit une recette, il
  n'exécute pas la mécanique du projet.
- Tu **ne collectes rien**. Un trou découvert en écrivant repart par `/scd-atlas:intake`, qui a les
  canaux et qui écrit la ligne — il ne se comble pas ici, et surtout il ne se devine pas.
- Tu **ne crées aucune ligne de carte** et tu ne changes aucune route.
- Tu **ne joues aucune eval** et tu n'écris pas de harnais : c'est `/scd-atlas:evals`.
- Tu **ne publies rien** — ni `marketplace.json`, ni `publish.json`, ni `/publish`, ni commit. La
  publication est une demande humaine explicite, jamais une conséquence de la distillation.

## La carte

Tu coches **une seule colonne** : `Distillé`, sujet par sujet, après constat que le passage est
réellement écrit dans le skill cible ou dans une de ses références. Un sujet *disparu* dont le
retrait est fait se coche aussi — le geste a été joué.

Tu ne touches à aucune autre colonne, et tu n'écris **aucun fait du domaine** dans la carte : elle
n'est pas une source.

## Skills actifs

- `campaign` — `references/distillation.md` **intégralement** dès l'ouverture (les rangs, la
  description, les leviers d'écriture, les classes de preuve, les quatre gestes, les seuils avec
  leur classe), `references/carte.md` pour la reprise, et `references/appairage-doc.md` **à l'étape
  7 seulement**. `intake.md` ne se recharge pas — ce qu'il a tranché est écrit dans la carte et dans
  les fiches. `collecte.md` non plus : tu ne collectes pas. `evals.md` non : tu ne mesures pas.
- **Pas de `research-prompter`.** Il compose des prompts ; il n'a rien à dire sur l'écriture d'un
  skill.

## À la fin

Affiche, sujet par sujet : ce qui a été écrit et **à quel rang** — c'est la décision qu'un humain
peut contester le plus utilement —, ce qui a été **retiré** en mise à jour, et les **réserves qui
ont survécu** au passage.

Dis l'**appairage retenu** et son motif : quelle branche de l'arbre, sur quel constat, à quelle
date. Si un `.mcp.json` a été écrit, rappelle que ses serveurs démarrent automatiquement chez tous
les utilisateurs du plugin.

Signale ce qui n'a pas été distillé et pourquoi : comblement encore ouvert, sujet sans matière,
verdict *non repris* sur l'essentiel du rapport.

Puis dis si la **`description:`** a bougé — et qu'elle a bougé ou non, elle est à re-noter : toute
édition de description se mesure contre le harnais. Puis : « `/clear`, puis `/scd-atlas:evals`. »
