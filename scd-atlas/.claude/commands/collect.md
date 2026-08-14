---
description: "Étape 2 d'une campagne : pré-collecte en session Claude Code ce que Claude Research n'atteindra pas — URL canoniques vérifiées, versions exactes et dates de publication, code brut, diffs, changelogs, métadonnées de registres, et l'état réel du dépôt d'ancrage quand la campagne en déclare un. Écrit une fiche de collecte par sujet dans le répertoire de campagne, qui sert de matière aux prompts et de source unique aux sujets routés code. gh authentifié d'abord, curl plutôt que WebFetch dès qu'il faut l'exact."
argument-hint: "[cible] [campagne] [-- NN du sujet]"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - Bash
  - WebSearch
  - WebFetch
disable-model-invocation: true
---

## Contexte

Tu collectes ce que Research ne pourra pas atteindre, **avant** que les prompts soient composés.
La sortie est une fiche par sujet, `collecte/NN-slug.md`, dans le répertoire de campagne.

Elle a deux usages, et le second se sous-estime toujours. Pour un sujet `research` ou `mixte`,
elle fournit la matière qui descendra *dans* le prompt : les URL que Research pourra réellement
ouvrir, les versions exactes qui l'empêcheront de mélanger deux majeures, les extraits de ce qu'il
n'a pas le droit de lire. Pour un sujet **`code`, elle tient lieu de source** — il n'y aura ni
prompt ni rapport, et ce que tu n'écris pas ici n'existera nulle part.

La fiche est aussi un **cache**. Une réponse d'API qu'on y écrit ne se redemande pas à la session
suivante, et les quotas d'une campagne un peu large se comptent.

Ratio : 10% humain / 90% AI (mécanique ; l'humain n'intervient que si un canal est fermé).

## Règles absolues

- **WebFetch est un outil de question-réponse, pas de récupération.** La page est convertie puis
  soumise à un petit modèle avec un prompt d'extraction : ce qui revient est *sa réponse*, pas la
  page. Le critère de bascule n'est pas une taille, c'est une question — **le contenu doit-il être
  exact ?** Si oui, `curl` via Bash.
- **Rien de deviné.** Une URL construite par pattern n'est pas une URL collectée : elle s'ouvre
  réellement, ou elle ne descend pas. Une version se lit dans un registre, jamais de mémoire.
- **Ce qui ne se lit pas par le web ne descend pas comme URL, il descend comme contenu.** Un
  changelog obtenu par `gh api` se recopie en **extrait cité**, avec sa provenance et sa date :
  Research ne peut pas ouvrir l'URL d'où il vient.
- **`gh auth status` avant tout appel GitHub.** Non authentifié, c'est 60 requêtes par heure et
  par IP contre 5 000 — et l'échec du trousseau fait repartir `gh api` en anonyme **en silence**.
  Le contrôle est `gh api rate_limit` **avant** un gros lot, pas après.
- **Aucune décision de collecte ne se prend sur un chiffre non officiel.** Les seuils exacts de
  troncature de WebFetch viennent de rétro-ingénierie communautaire ; le principe est officiel, les
  valeurs ne le sont pas. Idem pour les limites chiffrées de l'API npm, que personne ne publie.
- **Tu ne coches qu'après constat sur le disque.** Une case passe à `✓` parce que le fichier
  existe et porte quelque chose, jamais parce que l'action vient d'être tentée.
- **Sur `429` : backoff exponentiel avec jitter.** Jamais de retry serré, jamais de contournement
  d'un quota ou d'une politique de registre.

## Processus

1. **Résous la campagne.** `$1` est la cible — un **plugin**, ou directement le **répertoire de
   campagne** d'un thème —, `$2` le sous-répertoire de campagne. Un `$1` qui porte une `carte.md`
   *est* la campagne. Absents : cherche les cartes existantes (`*/docs/researchs/**/carte.md`).
   Une seule : prends-la. Zéro ou plusieurs : **arrête-toi** et demande — tu n'en choisis pas une,
   et tu n'élargis pas le glob à tout le disque. Carte absente pour une cible nommée : renvoie vers
   `/scd-atlas:map` (plugin) ou `/scd-atlas:map-theme` (thème), sans rien écrire.

   **Lis la nature dans l'en-tête** de la carte : elle décide de l'ancrage à ouvrir à l'étape 4, et
   de rien d'autre ici — la méthode de collecte est la même dans les deux natures.

2. **Charge le skill `campaign`**, sa `references/carte.md` et sa **`references/collecte.md`**
   intégralement : les canaux, leur seuil de bascule, les endpoints par objet visé, les politiques
   de registre et ce qui a le droit de descendre dans un prompt s'y lisent, ils ne s'improvisent
   pas.

3. **Reprends la carte contre le disque.** Liste `collecte/` : une case `Collecte` à `—` dont la
   fiche existe passe à `✓`, une case `✓` sans fichier repasse à `—`. Silencieusement.

4. **Ouvre les canaux et mesure-les.** Si la carte déclare un **ancrage**, c'est le canal qui
   s'ouvre en premier : il n'a ni quota, ni troncature, ni latence, et il dit l'état réel de la
   cible. Puis `gh auth status`, et `gh api rate_limit` si le lot le justifie. Non authentifié :
   dis-le à l'humain **avant** de commencer, avec ce que ça coûte — une collecte un peu large meurt
   contre le mur des 60/h.

5. **Sélectionne les sujets** dont la case `Collecte` vaut `—` — toutes routes confondues, un
   sujet `code` en a autant besoin qu'un `research`. Un `NN` passé en argument restreint à ce
   seul sujet.

6. **Pour chaque sujet, choisis le canal par l'objet visé**, jamais par habitude : le **dépôt
   d'ancrage** (`Read`, `Glob`, `git` local) pour tout ce qui décrit l'état réel de la cible —
   workflows, manifestes et verrous, configuration, arborescence, historique —, `gh api` ou
   `raw.githubusercontent.com` pour un fichier ponctuel, `compare/{base}...{head}` en media type
   diff pour un écart de versions, `git clone --depth 1` (avec `sparse-checkout`) dès qu'il s'agit
   de volume ou d'historique, l'API du registre pour les versions et leurs dates, `curl` pour une
   page dont le contenu doit être exact, `WebSearch` pour **découvrir** des URL — il rend des
   titres et des URL, jamais du contenu. La table des seuils de bascule est dans `collecte.md`.

   Respecte les politiques publiées : une requête par seconde et un User-Agent identifiant sur
   crates.io, `ETag` sur PyPI, la forme abrégée des métadonnées npm, les en-têtes
   `X-RateLimit-*` de GitHub.

7. **Écris la fiche `collecte/NN-slug.md`** — le nom se dérive de la ligne de carte, jamais
   autrement. Quatre choses, et elles se distinguent :

   - **les URL vérifiées**, celles que Research pourra ouvrir : canoniques, statiques, sans
     authentification, non bloquées par le `robots.txt` de leur hôte. Une URL qui ne passe pas ce
     test ne figure pas dans cette section ;
   - **les versions exactes**, chacune avec sa date de publication et le registre d'où elle vient ;
   - **les extraits cités** de ce que Research n'atteint pas — code, diff, changelog, doc rendue
     en JavaScript, **fichier du dépôt d'ancrage** —, chacun avec sa provenance et sa date de
     collecte. Un chemin local ne descend jamais seul : Research n'ouvre aucun système de fichiers,
     et un chemin sans son contenu se comblera par pattern-matching ;
   - **ce qui a échoué** : canal fermé, quota atteint, page qui n'existe pas. Un trou nommé est un
     résultat de collecte ; un trou tu, lui, se comblera par une invention au premier usage.

   Une sortie Bash volumineuse se redirige dans un fichier et se lit par `Read` paginé — au-delà
   d'une trentaine de milliers de caractères, elle est tronquée.

8. **Coche la colonne `Collecte`** du sujet, ligne par ligne, après avoir constaté que la fiche
   existe et porte au moins une URL vérifiée ou une version exacte. Une fiche qui ne porte que des
   échecs **ne coche pas** : elle reste à `—`, avec sa note.

## Ce que tu NE fais PAS

- Tu **ne composes aucun prompt** et tu n'ouvres aucun `prompts/`. C'est `/scd-atlas:prompts`, et
  la composition appartient au skill `research-prompter`.
- Tu **ne crées aucune ligne de carte** — `map` seule le fait. Un sujet qui apparaît en cours de
  collecte se signale à l'humain et se rejoue par `map`.
- Tu **n'écris rien dans le skill cible** ni dans ses références. Une fiche de collecte n'est pas
  une distillation.
- Tu **n'écris rien dans le dépôt d'ancrage**, et tu n'y exécutes rien. Tu le lis : il est une
  source, pas une cible — même si le répertoire de campagne se trouve dedans.
- Tu **ne modifies aucun artefact d'une campagne antérieure**, y compris ses fiches et ses
  rapports.
- Tu **n'installes aucun serveur MCP** et tu ne modifies aucun `.mcp.json`. Ce qu'un plugin
  produit embarque est tranché ailleurs, à la distillation.
- Tu **ne contournes ni authentification, ni paywall, ni `robots.txt`**, et tu ne forces aucun
  quota.
- Tu **ne juges pas encore la matière**. Collecter n'est pas trier : un extrait contradictoire se
  garde avec sa provenance, il ne se lisse pas.

## La carte

Tu coches **une seule colonne** : `Collecte`, sujet par sujet, après constat de la fiche sur le
disque. Rien d'autre. Un canal définitivement fermé pour un sujet se dit en note, dans la ligne de
comblement du sujet, jamais en changeant sa route — le routage appartient à `map`.

## Skills actifs

- `campaign` — charge `references/collecte.md` **intégralement** (les deux règles, la table des
  canaux et leurs seuils, GitHub, les registres, les quotas, ce qui descend dans un prompt) et
  `references/carte.md` pour le format et la reprise. Les références aval — `intake`,
  `distillation`, `appairage-doc`, `evals` — **ne se chargent pas ici**.
- Aucun skill `research-prompter` : tu ne composes pas, et sa fiche de contexte ne t'apprendrait
  rien sur les canaux d'une session Claude Code.

## À la fin

Affiche, sujet par sujet : ce qui a été collecté, par quel canal, et **ce qui manque encore**. Un
trou nommé maintenant se comble avant que le prompt parte ; le même trou découvert au retour du
rapport coûte une session Research.

Signale séparément les sujets routés `code` — pour eux, la fiche est la source finale, et sa
complétude ne sera plus jamais revue par un rapport.

Puis : « `/clear`, puis `/scd-atlas:prompts` — qui compose un prompt par sujet routé `research` ou
`mixte`, à partir de ces fiches. »
