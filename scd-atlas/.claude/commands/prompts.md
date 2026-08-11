---
description: "Étape 3 d'une campagne : compose un prompt Claude Research par sujet routé research ou mixte, à partir de la carte et des fiches de pré-collecte. Écrit prompts/NN-slug.md dans le plugin cible, prêt à jouer dans Desktop par l'humain. Ne compose rien elle-même : elle charge le skill research-prompter et lui applique sa méthode, sujet par sujet, sans raccourci de lot."
argument-hint: "[plugin-cible] [campagne] [-- NN du sujet]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
disable-model-invocation: true
---

## Contexte

Tu composes les prompts que l'humain jouera dans Claude Research (Desktop). La sortie est un
fichier par sujet, `prompts/NN-slug.md`, dans le répertoire de campagne.

Tu es à la **charnière humaine** du pipeline : après toi, rien n'avance en session tant qu'un
rapport n'est pas revenu. Un prompt faible ne se rattrape donc pas par une itération — il se paie
par une session Research entière, environ 15× les tokens d'un chat, et par un rapport qu'il faudra
combler à la main.

**Tu ne composes pas toi-même.** La méthode appartient au skill `research-prompter`, et elle est la
même en campagne que hors campagne : douze sujets à traiter n'autorisent aucun raccourci. Un prompt
composé « vite parce qu'il y en a douze » est un prompt qui reviendra en rapport faible.

Ratio : 20% humain / 80% AI (tu composes en lot ; l'humain relit avant de jouer, et c'est lui qui
joue).

## Règles absolues

- **Un sujet, un prompt, une session Research.** Jamais deux sujets dans un prompt, quelle que
  soit leur proximité.
- **Le prompt final fait 150 à 350 mots.** Ni le plus long ni le plus structuré : celui qui atteint
  son but avec le minimum de structure nécessaire.
- **Une URL devinée n'existe pas.** Ne descendent que les URL vérifiées de la fiche de collecte.
  Research ne construit aucune URL : il n'atteint que celles qu'on lui donne ou qu'il trouve.
- **Ce qui vient d'un canal que Research n'a pas descend en extrait cité**, avec sa provenance et
  sa date — jamais en lien. Une version exacte descend toujours, avec sa date de publication.
- **Pas de fiche de collecte, pas de prompt.** La case `Collecte` du sujet doit valoir `✓`. Sinon,
  signale et renvoie vers `/scd-atlas:collect` : composer sans elle produit un prompt d'URL
  devinées.
- **Aucun chiffre de `contexte-research.md` ne descend dans un prompt.** Ces chiffres décrivent
  l'outil à une date, pas le sujet étudié ; les mettre dans un `<context>` ferait passer un état
  daté pour un fait du domaine.
- **Tu ne crées aucune ligne de carte.** Une portée composite se **propose** en scission — et une
  scission retenue se joue par `/scd-atlas:map`, seule commande qui écrit des lignes.
- **Un sujet routé `code` ne reçoit pas de prompt.** Ses colonnes `Prompt` et `Rapport` restent
  `s.o.` : sa fiche de collecte est sa source.

## Processus

1. **Résous la campagne.** `$1` le plugin cible, `$2` le répertoire de campagne. Absents : cherche
   les cartes existantes. Une seule : prends-la. Zéro ou plusieurs : **arrête-toi** et demande.
   Carte absente : renvoie vers `/scd-atlas:map`.

2. **Charge la carte** via `campaign` / `references/carte.md`, puis **reprends-la contre le
   disque** : liste `prompts/`, une case `—` dont le fichier existe passe à `✓`, une case `✓` sans
   fichier repasse à `—`.

3. **Sélectionne les sujets** : route `research` ou `mixte`, case `Prompt` à `—`, case `Collecte`
   à `✓`. Un `NN` en argument restreint à ce seul sujet. Les sujets écartés se disent en fin de
   commande, avec le motif — un sujet sauté en silence passe pour traité.

4. **Charge le skill `research-prompter`** et applique **ses trois temps**, sujet par sujet. Rien
   de sa méthode ne se recopie ici : elle se lit chez lui.

5. **Temps 1 — la portée.** Le routage est déjà fait par `map` ; ce qui reste ouvert est la
   **scission**. Un sujet qui remplit un seul des critères de scission de `squelette.md` ne se
   compose pas de force : propose le découpage à l'humain, avec les sujets qu'il produirait, et
   **laisse la ligne en `—`** jusqu'à ce que `map` la reprenne. Le calibre — focalisé, standard,
   étendu — se choisit ici, et il se pilote par la portée : il n'existe aucun sélecteur de durée
   dans l'interface Research.

6. **Temps 2 — les cinq informations, dérivées et non demandées.** Qui, pourquoi, contraintes,
   format, ce qu'on sait déjà : elles se lisent dans la carte (mode, cible, version visée), dans
   la fiche de collecte et dans le plugin cible lui-même — un plugin techno destine son rapport à
   la distillation en skill, et son lecteur est un agent. **Ce qui manque se comble par une
   hypothèse nommée** dans le rendu final, jamais par une question posée en lot : tu n'as pas
   `AskUserQuestion`, et c'est délibéré — pour interroger, il y a `/scd-atlas:prompt`.

7. **Temps 3 — la composition.** Charge `references/squelette.md`, et **en plus**
   `references/domaines/tech-dev.md` dès que le sujet porte sur une technologie, un langage, un
   framework ou un écosystème — ce qui est le cas par construction dans une campagne de plugin
   techno. Fais descendre la matière de la fiche selon la section « Ce qui descend dans un
   prompt » de `collecte.md` : URL ouvrables, extraits cités avec provenance, versions datées.

8. **Passe la checklist** de fin de `squelette.md` **avant** d'écrire, pas après. Un prompt qui
   n'y passe pas se corrige ; il ne s'écrit pas « pour être relu plus tard ».

9. **Écris `prompts/NN-slug.md`** — nom dérivé de la ligne de carte. Le fichier contient **le
   prompt et rien d'autre** : il doit se copier-coller tel quel dans Desktop. Ce qui l'entoure —
   hypothèses comblées, scissions proposées, URL manquantes — se dit en session, pas dans le
   fichier.

10. **Coche la colonne `Prompt`** après constat du fichier sur le disque, sujet par sujet.

## Ce que tu NE fais PAS

- Tu **ne lances aucune recherche**. Aucune session Claude Code ne peut lancer Research : le
  fichier que tu écris est joué par un humain, dans Desktop.
- Tu **ne collectes rien** — ni `Bash`, ni `WebSearch`, ni `WebFetch`. Une URL manquante se
  **signale** et renvoie vers `/scd-atlas:collect` ; elle ne se cherche pas ici, et surtout elle
  ne se devine pas.
- Tu **ne crées ni ne supprimes de ligne de carte**, et tu ne changes aucune route.
- Tu **n'écris rien dans le skill cible** ni dans ses références.
- Tu **ne fabriques aucun contenu de rapport** et tu ne pré-remplis aucun `NN-slug.md` à la racine
  de la campagne : cet emplacement appartient à l'humain qui y dépose ce que Research a rendu.
- Tu **n'allèges aucune consigne d'ancrage** — citations verbatim, `[INCERTAIN]`, hypothèses
  concurrentes, niveaux de preuve — sous prétexte de longueur. Ce sont elles qui rendent le
  rapport exploitable ; ce qui se coupe, c'est la structure décorative.
- Tu **ne répètes pas la consigne en fin de prompt** et tu n'empiles pas l'impératif : le
  raisonnement est déjà actif, et le langage impératif massif provoque du sur-déclenchement
  d'outils.

## La carte

Tu coches **une seule colonne** : `Prompt`, après constat du fichier. Une scission proposée et
acceptée ne se traduit **pas** ici — elle laisse la ligne en `—` et repart par `map`. Un sujet
`code` rencontré en chemin garde son `s.o.` : tu ne le composes pas et tu ne le signales pas comme
manquant.

## Skills actifs

- `research-prompter` — **le composeur**. Charge `references/squelette.md` à la composition
  (toujours), `references/domaines/tech-dev.md` quand le sujet relève du domaine (toujours en
  campagne de plugin techno), et `references/contexte-research.md` pour calibrer — ses chiffres
  **ne descendent pas** dans les prompts. `references/routage-limites.md` a déjà servi à `map` :
  ne la recharge que si un routage te paraît faux, et alors dis-le plutôt que de le corriger.
- `campaign` — charge `references/carte.md` (format, cases, reprise) et la seule section « Ce qui
  descend dans un prompt » de `references/collecte.md`. Les références aval ne se chargent pas ici.

## À la fin

Affiche, sujet par sujet : le prompt écrit, son calibre, et surtout **les hypothèses comblées** —
ce que tu as supposé faute de le trouver. C'est le seul moment où l'humain peut les corriger avant
qu'elles partent en session Research.

Liste séparément ce qui n'a pas été composé et pourquoi : collecte manquante, scission proposée,
route `code`.

Puis rappelle le protocole humain, dans cet ordre : **un sujet par session Research** ; copier le
fichier tel quel dans Claude Desktop ; déposer le rapport revenu en `NN-slug.md` **à la racine du
répertoire de campagne**, sans le renommer autrement. Rien ne l'annoncera à la session suivante —
seule sa présence le dira.

Puis : « `/clear`, puis `/scd-atlas:intake` dès qu'au moins un rapport est déposé. »
