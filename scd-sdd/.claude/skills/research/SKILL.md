---
name: research
description: |
  La CAPACITÉ DE RECHERCHE transverse : comment on cherche un fait qu'on ne tient
  pas de mémoire, et ce qu'on a le droit d'en reprendre. Ancrage par citations
  verbatim, permission d'exprimer l'incertitude, hypothèses concurrentes, niveaux
  de preuve et étiquetage des sources (officiel · préprint indépendant · benchmark
  d'éditeur · commercial), qualité de source, contrat de docs/research/. Se charge
  pendant /scd-sdd:lookup et /scd-sdd:research, et pendant elles seules : une phase
  qui doit sourcer un arbitrage — stack, adr, ci, plan — ROUTE vers ces deux
  commandes, elle ne charge pas ce skill. Porte UNIQUEMENT la méthode : ne joue
  aucune commande du cycle, et ne modifie
  jamais un document du socle — un rapport ne descend pas seul dans stack.md ni
  dans un ADR immuable, sous peine de citation laundering.
---

# Recherche — `docs/research/`

## Pourquoi une capacité, et pas une phase

Une recherche se joue **quand la question se pose**, jamais à un rang imposé : depuis `technique`,
`adr`, `livraison` ou `plan` qui doivent sourcer un arbitrage, et le plus souvent **hors de toute
phase**.

Quatre conséquences, toutes **de nature** et jamais discrétionnaires. Le rationale du choix vit en
`DECISIONS.md` §D23, et nulle part ici :

- **Une phase ne cherche pas elle-même, elle route.** Aucune commande de phase ne charge ce skill,
  et aucune n'a `WebSearch` ni `WebFetch` : elle renvoie vers `/scd-sdd:lookup` ou
  `/scd-sdd:research`, qui sont les **deux seuls** chargeurs.
- **Aucune trace ailleurs.** Ce que ces deux commandes produisent **est** le fait : le rapport
  lui-même. `lookup` ne produit même aucun fichier.
- **Aucun état dérivé.** `docs/research/` n'apparaît dans aucune table d'état de `status`.
- **Deux verbes, pas une commande à modes.** `lookup` répond en session et n'écrit rien ;
  `research` produit un artefact, quitte la session, et revient plus tard.

## Le risque qui gouverne tout le reste

La chaîne de traçabilité du cycle est un **vecteur de *citation laundering*** — une source
inexistante gagne en légitimité en passant successivement par des documents réels que personne ne
vérifie :

> Produit → Technique → **ADR accepté, immuable** → spec → tests → code

Un chiffre non vérifié entré au début ressort en décision que `CLAUDE.md` interdit de contredire, et
que le cycle protège au lieu de la questionner. Le mécanisme n'est pas une hypothèse : la
prévalence des références fabriquées dans la littérature publiée est mesurée **en hausse d'une année
sur l'autre**, par plusieurs protocoles indépendants *(niveau : rapporté)*.

⚠️ **Aucun chiffre n'est cité ici, et c'est délibéré** : un taux daté placé dans un fichier qui porte
« ce qui ne bouge pas » périmerait en silence — le mode de défaillance exact que la séparation
`SKILL.md` / référence existe pour empêcher. Ce que ces mesures valent, et ce qu'on n'a pas le droit
d'en transposer, vit dans le bloc `<caveats>` **daté** de `references/prompt-research.md`.

D'où la règle centrale, qui ne se négocie pas :

> **Une recherche ne modifie aucun document du socle.** Elle rend une liste ; l'humain décide ce
> qui descend.

## Chercher — ce qui ne bouge pas

### 1. Ancrage par citations verbatim

Extraire d'abord les passages **mot pour mot** qui portent la réponse, puis fonder la réponse
dessus, et **attribuer par affirmation** — une source par *claim*, pas une bibliographie en fin de
document que rien ne relie au texte. C'est la technique de fiabilisation la mieux étayée par la
documentation officielle, et celle que Claude Research applique en interne avec un agent de citation
dédié.

Corollaire, et c'est lui qui compte : **une affirmation qu'aucune citation ne porte est une
affirmation du modèle**. Elle s'écrit comme telle, ou elle ne s'écrit pas.

### 2. L'incertitude est permise, et l'absence de donnée est un résultat

Donner explicitement la permission de dire « je ne sais pas » — c'est une recommandation officielle
constante, et son coût est nul face à une réponse plausible et fausse.

Symétriquement : **l'absence de donnée s'écrit**. « Aucun taux mesuré et indépendant n'a été
trouvé » est un résultat de recherche, pas un échec à combler par une approximation. C'est même le
résultat le plus utile, parce que c'est celui qu'une recherche paresseuse remplace par un chiffre.

### 3. Hypothèses concurrentes, et auto-critique

Quand les sources divergent, **ne tranche pas artificiellement** : pose H1, H2, ce qui les
départagerait, et le niveau de confiance de chacune. Une divergence entre deux sources officielles
est une information sur le sujet, pas un bruit à lisser.

La confiance annoncée est un signal de **classement**, jamais une probabilité : la confiance
verbalisée d'un modèle est systématiquement sur-confiante. On l'utilise pour ordonner, pas pour
calculer.

### 4. Niveaux de preuve séparés, sources étiquetées

Deux axes, tous deux obligatoires — ils ne se remplacent pas l'un l'autre.

| Niveau de preuve | Ce que ça veut dire |
|---|---|
| **mesuré** | protocole public, chiffres reproductibles ou au moins vérifiables |
| **rapporté** | affirmé par une source identifiée, sans protocole publié |
| **anecdotique** | témoignage, expérience non contrôlée, retour de praticien |
| **non étayé** | circule sans source primaire trouvable — à démentir explicitement |

| Étiquette de source | Ce qu'elle change |
|---|---|
| **officiel** | doc ou publication de l'éditeur — fait autorité sur son produit, pas sur ses concurrents |
| **préprint indépendant** | non revu par les pairs ; le protocole est lisible, la conclusion n'est pas validée |
| **benchmark d'éditeur** | auto-favorisant par construction, parfois entraîné sur ses propres tâches |
| **commercial** | comparatif de vendeur, page produit, benchmark maison — jamais une source primaire |

Les quatre étiquettes s'écrivent **avec ces mots exacts** — `officiel`, `préprint indépendant`,
`benchmark d'éditeur`, `commercial`. Elles sont apposées sur des sources, donc greppables : un
synonyme — « marketing », « vendeur » — rouvre un vocabulaire qui n'a de valeur que fermé.

Un chiffre officiel reste souvent une **éval interne non reproductible par un tiers** : « établi »
qualifie alors le fait qu'il a été *publié*, pas qu'il a été *répliqué*. Écris la différence.

### 5. Qualité de source

Sources primaires d'abord — documentation officielle, article ou PDF académique, dépôt, changelog,
texte de loi — plutôt que fermes de contenu SEO qui recopient sans vérifier. Remonte au document
d'origine avant de citer : un chiffre trouvé sur trois pages qui se citent l'une l'autre n'est pas
recoupé, c'est **une seule** source.

### 6. XML structurel, pas décoratif

Les balises délimitent un rôle : documents, sources, variables, consignes. Elles ne décorent pas un
prompt court et homogène, où elles n'ajoutent que du bruit. Même règle que partout dans le plugin :
les balises XML ne sont pas un style, elles marquent un rôle.

## Ce que la recherche ne peut pas atteindre

À dire **avant** de lancer, jamais après :

- les pages sous mot de passe, derrière une connexion ou un CAPTCHA : le crawler ne les ouvre pas ;
- `robots.txt` est respecté — un site qui l'interdit ne sera pas lu ;
- **pas d'état long terme** : une session de recherche est bornée, elle ne se souvient pas de la
  précédente. C'est précisément à quoi sert `docs/research/` ;
- données privées, bases internes, outils métier : seulement via des connecteurs explicitement
  activés, jamais par défaut.

Une question dont la réponse est derrière l'un de ces murs ne se contourne pas : elle se
**reformule**, ou se répond autrement — lire le dépôt, demander à l'humain.

## Le contrat de `docs/research/`

```
docs/research/
  2026-08-06-outillage-sca-node.prompt.md   ← l'aller : le prompt composé
  2026-08-06-outillage-sca-node.md          ← le retour : le rapport classé
```

- **Nom `AAAA-MM-JJ-slug.md`**, daté du jour de la recherche et **jamais renommé**. Le tri par nom
  donne la chronologie, sans compteur ni index.
- **La date est le contrôle de fraîcheur.** Un rapport ne se met pas à jour : il se **refait**, sous
  une date neuve. Un rapport de six mois sur un écosystème qui bouge est une source *périmée*, pas
  une source fausse — et cela ne se voit qu'à son nom.
- **Versionné et commité** par la commande qui l'écrit, `git add` scopé au rapport.
- **Aucun rétro-lien** vers les décisions qu'un rapport a servies. Le lien existe déjà dans l'autre
  sens — un ADR cite `docs/research/…` dans son rationale — et un rapport qui listerait ses usages
  serait un fichier qui croît.
- Le **format attendu** d'un rapport — TL;DR / Key Findings / Details / Recommendations / Caveats,
  confiance par affirmation, marqueurs `[À VÉRIFIER]` et `[INCERTAIN]` — vit dans le bloc
  `<gabarit>` de `references/prompt-research.md`, chargé à l'**aller**.

## Reprendre un résultat — la relecture critique

C'est la moitié qui compte. **Un rapport qui revient n'est pas un acquis : c'est une source de
plus**, et le fait qu'il ait été produit pour nous ne le rend pas plus vrai.

1. **Extraire ce qui est actionnable pour la décision que la question devait servir** — le reste
   attend son tour. Le référent est **la décision, jamais la phase** : quand une phase est en cours,
   c'est la sienne ; quand la recherche est jouée hors de toute phase — le cas le plus fréquent —,
   c'est celle que le bloc `## Question` du prompt nomme, puisque le gabarit l'exige. Une recherche
   sans décision nommée n'a pas de critère d'extraction : dis-le au lieu de tout reprendre.
2. **Isoler et nommer ce qui ne se reprend pas comme acquis** : tout ce qui porte `[À VÉRIFIER]`,
   `[INCERTAIN]`, « source unique non recoupée », « éval interne », « préprint », « commercial ».
   Isoler ne veut pas dire jeter — ça veut dire que ça ne descend pas dans un document que la suite
   du cycle traitera comme vrai.
3. **Rappeler que la confiance verbalisée n'est pas une probabilité**, y compris celle du rapport.
4. **Ne modifier aucun document du socle.** Rendre la liste ; l'humain décide ce qui descend dans un ADR.

Le contrôle négatif qui prouve que la règle a tenu : après l'import d'un rapport,
aucun document du socle n'a été touché.

## Références

Une seule, et elle se charge **bloc par bloc** (`DECISIONS.md` §D20) : `/scd-sdd:research` la lit
aux **deux** temps de son aller-retour, et les deux temps n'ont pas besoin des mêmes blocs. Composer
en rechargeant les caveats de relecture, ou relire en rechargeant le gabarit, serait payer deux fois.
`/scd-sdd:lookup` ne la charge **jamais** — il ne compose rien et ne classe rien.

| Fichier · bloc | Quand le charger |
|---|---|
| `references/prompt-research.md` · `<peremption>` | **Aux deux temps, et en premier.** Le fichier est **daté en tête** : ce bloc dit ce que la date impose avant de s'y fier. |
| … · `<obsolete>` `<stable>` `<gabarit>` `<completion>` | **À l'aller** seulement — composer le prompt, puis le relire contre sa checklist. |
| … · `<caveats>` | **Au retour** seulement — les caveats de fiabilité qui servent la relecture critique du rapport revenu. |
