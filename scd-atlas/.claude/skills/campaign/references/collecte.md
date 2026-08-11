# Référence — la doctrine de collecte en session Claude Code

Chargée par `campaign` à la **pré-collecte** (`/scd-atlas:collect`) et au **comblement**
(`/scd-atlas:intake`). Elle répond à trois questions : quel canal ouvrir pour quoi, à partir de quel
seuil en changer, et ce qui a le droit de descendre dans un prompt Research.

Elle porte les canaux qu'une **session** ouvre pour collecter. Ce qu'un **plugin produit** embarque
ou se contente de documenter comme serveur MCP est une autre question, tranchée dans
`appairage-doc.md` : les deux ne se répondent pas l'une l'autre.

- [Les deux règles qui commandent le reste](#les-deux-règles-qui-commandent-le-reste)
- [Les canaux et leur seuil de bascule](#les-canaux-et-leur-seuil-de-bascule)
- [GitHub — authentifier d'abord](#github--authentifier-dabord)
- [Les registres de paquets](#les-registres-de-paquets)
- [MCP — un canal de comblement](#mcp--un-canal-de-comblement)
- [Quotas, échecs, 429](#quotas-échecs-429)
- [Ce qui descend dans un prompt](#ce-qui-descend-dans-un-prompt)
- [Ce que cette référence ne tranche pas](#ce-que-cette-référence-ne-tranche-pas)

## Les deux règles qui commandent le reste

**1. WebFetch est un outil de question-réponse, pas un outil de récupération.** La documentation
officielle de Claude Code l'écrit sans détour : *« This makes WebFetch lossy by design. The
extraction prompt determines what reaches Claude »*. La page est récupérée, convertie en markdown —
conversion non configurable —, puis soumise à un petit modèle rapide avec un prompt d'extraction :
ce qui revient est **la réponse de ce modèle**, pas la page. La même documentation recommande `curl`
via Bash pour obtenir la page non traitée.

Conséquence opératoire : **rien de ce qui doit être cité verbatim ou lu intégralement ne passe par
WebFetch.** Le critère de bascule n'est pas une taille, c'est une question — *le contenu doit-il
être exact ?*

**2. Ce qui ne se lit pas par le web ne descend pas comme URL : il descend comme contenu.** Research
n'atteint ni le code brut, ni les diffs, ni le blame, ni l'historique (bloqués par le `robots.txt` de
GitHub et GitLab), ni une documentation rendue en JavaScript. Un changelog obtenu par `gh api` ne
s'écrit donc **pas** comme lien dans un prompt : il s'y recopie, en extrait cité, dans le `<context>`,
avec sa provenance. Une URL ne descend que si Research peut l'ouvrir.

## Les canaux et leur seuil de bascule

| Canal | Ce qu'il sert | Seuil de bascule — quand en sortir |
|---|---|---|
| **WebFetch** | une question ponctuelle sur une page statique déjà identifiée | dès qu'il faut le contenu intégral ou une citation exacte, ou dès que la page est tronquée → `curl` |
| **WebSearch** | découvrir des URL exactes — il rend des titres et des URL, jamais le contenu | **200 appels par session**, sous-agents compris ; `/clear` remet le compteur à zéro → planifier les recherches plutôt qu'explorer |
| **`curl` (Bash)** | le contenu brut et complet d'une page ou d'une API | la sortie Bash est tronquée au-delà de ~30 000 caractères (`BASH_MAX_OUTPUT_LENGTH`, plafond 150 000) → écrire dans un fichier et le lire par `Read` paginé |
| **`gh` / API GitHub** | un objet ponctuel : une release, un fichier, un diff, une issue | au-delà d'une cinquantaine de fichiers d'un même dépôt → `git clone` |
| **`git clone --depth 1`** | le volume : code brut, historique, `git blame` local | aucun — c'est le canal terminal pour un dépôt |
| **API de registre** | versions et dates de publication exactes | jamais pour autre chose : ce ne sont pas des sources de doctrine |
| **MCP** | comblement : doc rendue en JS, doc très récente | il ne remplace ni `git clone` pour le volume, ni les registres pour les dates |

> **Ce qui est établi et ce qui ne l'est pas.** La documentation officielle établit que les grosses
> pages sont **tronquées à une limite fixe**, que les réponses sont **mises en cache 15 minutes** par
> URL, qu'une redirection **cross-host n'est pas suivie** (l'URL cible revient, il faut refaire
> l'appel), et que WebFetch demande une autorisation à la première visite d'un domaine. Les valeurs
> chiffrées de cette troncature circulent en rétro-ingénierie communautaire : elles ne sont pas
> officielles, et **aucune décision de collecte ne se prend dessus**. Le cache de 15 minutes, lui, a
> une conséquence pratique : re-fetcher la même URL après une correction en amont peut rendre la
> version périmée.

## GitHub — authentifier d'abord

`gh auth status` en ouverture de collecte. Non authentifié : **60 requêtes par heure et par IP**.
Authentifié : **5 000 par heure** côté REST, et 5 000 points par heure côté GraphQL, le coût d'une
requête dépendant de sa complexité. Une collecte un peu large en anonyme meurt contre le mur.

**Le piège documenté** : si l'accès au trousseau échoue, `gh api` peut partir **non authentifié en
silence** et retomber sur les 60/h. Le symptôme est un blocage précoce et inexplicable ; le contrôle
est `gh api rate_limit` avant un gros lot, pas après.

| Objet visé | Canal |
|---|---|
| **code brut d'un fichier** | `GET /repos/{o}/{r}/contents/{chemin}` en media type `application/vnd.github.raw+json`, ou directement `raw.githubusercontent.com` (aucun `robots.txt` bloquant). Entre 1 et 100 Mo le media type `raw` est obligatoire ; au-delà de 100 Mo, non supporté |
| **diff entre deux références** | `GET /repos/{o}/{r}/compare/{base}...{head}` en media type `application/vnd.github.diff` ou `.patch`. Il n'existe pas d'endpoint de diff « metadata-only » |
| **blame** | GraphQL (objet `blame`) — il n'y a pas d'endpoint REST —, ou `git blame` en local après un clone |
| **releases et changelogs** | `GET /repos/{o}/{r}/releases`, ou `gh release list` / `gh release view` |
| **issues et PR** | REST ou GraphQL, ou `gh issue` / `gh pr` |

Pour le volume, `git clone --depth 1` combiné à `git sparse-checkout` : il ne consomme pas le quota
REST et donne l'historique et le blame en local. Le clone HTTPS anonyme reste soumis aux limites de
débit non authentifiées de GitHub.

## Les registres de paquets

Le canal de référence pour les **versions et les dates de publication** — ce sont les deux faits
qu'un rapport Research se trompe le plus facilement, et les deux qu'une API rend exacts.

| Registre | Endpoint | Ce qu'il faut savoir |
|---|---|---|
| **npm** | `https://registry.npmjs.org/{paquet}` | champ `time` (date par version), `versions`, `dist-tags.latest`. Demander la forme abrégée par `Accept: application/vnd.npm.install-v1+json` : la forme complète dépasse 10 Mo sur certains paquets |
| **PyPI** | `https://pypi.org/pypi/{paquet}/json`, ou `/{paquet}/{version}/json` | métadonnées, historique des releases avec dates et hachages. Cette API JSON est **propre à PyPI et non standardisée** ; le canal standard pour la liste des versions est l'Index API (PEP 691) |
| **crates.io** | `https://crates.io/api/v1/crates/{crate}` | **1 requête par seconde et un User-Agent identifiant, tous deux obligatoires** — politique officielle (RFC 3463). Un UA qui ne nomme que la bibliothèque HTTP augmente la probabilité d'un blocage. En volume : l'index Git ou `static.crates.io`, non soumis au rate-limit |
| **pub.dev** | `https://pub.dev/api/packages/{paquet}` | spec Hosted Pub V2, plus `/publisher` et `/score`. Les versions passent par `/api/packages/{paquet}/versions`, largement utilisé mais **absent de la liste officiellement supportée** : susceptible de changer sans préavis |

Deux points de quota qui se reperdraient :

- **PyPI n'applique aucun rate-limit à l'edge** (cache et CDN), mais demande de respecter les
  en-têtes `ETag` et `X-Cache` pour ne pas répéter des requêtes déjà servies.
- **npm ne documente aucune limite chiffrée** pour son API de lecture. C'est un résultat, pas une
  lacune de recherche : seul le code **429** est officiel. Les chiffres « 1 000/h anonyme, 5 000/h
  authentifié » qui circulent sur des blogs tiers sont **non officiels — à écarter**.

## MCP — un canal de comblement

Les serveurs MCP **complètent** les canaux ci-dessus, ils ne les remplacent pas.

- **Context7** sert de la documentation de bibliothèque à jour et version-spécifique
  (`resolve-library-id`, puis `get-library-docs`). Il comble l'angle mort de la doc rendue en
  JavaScript, puisqu'il puise à la source. Deux limites déclarées par l'éditeur : l'indexation est
  **périodique** — une release de quelques jours peut manquer — et la qualité est communautaire, non
  garantie.
- **Un serveur navigateur** couvre le rendu JavaScript qu'aucun outil intégré ne fait.
- **Le serveur MCP GitHub officiel**, en `--read-only`, offre une interface conversationnelle sur les
  dépôts, mais consomme **les mêmes quotas** que l'API : il ne desserre rien.

Ce qu'aucun MCP ne remplace : `git clone` pour le volume de code brut, et les API de registres pour
les dates exactes.

## Quotas, échecs, 429

- Respecter les en-têtes que chaque service publie : `X-RateLimit-Remaining` / `X-RateLimit-Reset`
  (GitHub), `ETag` (PyPI), la seconde entre deux appels et l'User-Agent identifiant (crates.io).
- Sur `429` : backoff exponentiel avec jitter. Jamais de retry serré.
- **Cacher localement ce qui coûte cher.** La fiche de collecte du sujet *est* ce cache : une
  réponse d'API qu'on y écrit ne se redemande pas à la session suivante.
- Réduire la charge à la source : `--depth 1`, `sparse-checkout`, forme abrégée des métadonnées npm.

## Ce qui descend dans un prompt

C'est le livrable de la pré-collecte, et il se contrôle ligne par ligne :

- **une URL ne descend que si Research peut l'ouvrir** — canonique, statique, sans authentification,
  non bloquée par le `robots.txt` de son hôte. Sinon elle ne descend pas du tout ;
- **ce qui vient d'un canal que Research n'a pas** (API, clone, MCP local) descend **en extrait
  cité**, avec sa provenance et sa date ;
- **une version exacte descend toujours**, avec sa date de publication : c'est ce qui empêche un
  rapport de mélanger deux majeures ;
- **rien de deviné.** Une URL construite par pattern n'est pas une URL collectée — ni Research ni
  les outils web de Claude Code ne construisent d'URL, et une URL fausse revient vide ou, pire,
  revient avec autre chose.

## Ce que cette référence ne tranche pas

- **Quel serveur navigateur employer** pour le rendu JavaScript : le principe est établi, aucun
  choix d'outil n'est documenté par une source primaire.
- **Ce qu'un plugin produit embarque** comme `.mcp.json` — c'est `appairage-doc.md`, et la règle y
  est stricte.
- **La qualité comparée** des serveurs de documentation : aucune mesure indépendante n'existe dans
  les sources. Un test maison la donnerait plus vite qu'une recherche.
