---
name: research
description: |
  La CAPACITÉ DE RECHERCHE transverse : comment on cherche un fait qu'on ne tient
  pas de mémoire, et ce qu'on a le droit d'en reprendre. Ancrage par citations
  verbatim, permission d'exprimer l'incertitude, hypothèses concurrentes, niveaux
  de preuve et étiquetage des sources (officiel · préprint · benchmark d'éditeur ·
  marketing), qualité de source, contrat de docs/research/. Se charge pendant
  /scd-sdd:lookup et /scd-sdd:research, et depuis toute phase qui doit sourcer un
  arbitrage — stack, adr, ci, plan. Porte UNIQUEMENT la méthode : ne joue aucune
  phase, n'écrit aucune ligne de journal (skill journal), et ne modifie jamais un
  document du socle — un rapport ne descend pas seul dans stack.md ni dans un ADR
  immuable, sous peine de citation laundering.
---

# Recherche — `docs/research/`

## Pourquoi une capacité, et pas une phase

Une phase se joue **une fois, dans un ordre imposé**, et laisse un artefact dont l'état se dérive.
Une recherche se joue **quand la question se pose** : `stack` en a besoin pour ne pas trancher de
mémoire, `adr` pour sourcer un rationale qu'il va figer, `ci` pour ne pas inventer une version
d'outil, `plan` au niveau specs — et le cas le plus fréquent est hors de toute phase.

Trois conséquences, toutes **de nature** et jamais discrétionnaires :

- **Aucune ligne de journal.** Ces commandes ne jouent aucune phase, et ce qu'elles produisent
  **est** le fait : le rapport lui-même. Même raisonnement que « la fiche est le fait » pour les
  chantiers (`DECISIONS.md` §D18 et §D23). `lookup` ne produit même aucun fichier.
- **Aucun état dérivé.** `docs/research/` n'apparaît dans aucune table d'état de `status` : l'y
  faire figurer ferait croire à une phase, et un socle sans recherche n'est pas un socle incomplet.
- **Deux verbes, pas une commande à modes** (§D7). `lookup` répond en session et n'écrit rien ;
  `research` produit un artefact, quitte la session, et revient plus tard.

## Le risque qui gouverne tout le reste

La chaîne de traçabilité du cycle est un **vecteur de *citation laundering*** — une source
inexistante gagne en légitimité en passant successivement par des documents réels que personne ne
vérifie :

> Brief → PRD → Stack → **ADR accepté, immuable** → spec → tests → code

Un chiffre non vérifié entré au début ressort en décision que `CLAUDE.md` interdit de contredire, et
que la gate `analyze` protège au lieu de la questionner. Le mécanisme est mesuré ailleurs : une
étude Columbia relayée par *STAT* compte **1 article sur 458** portant une référence fabriquée en
2025, contre 1 sur 2 828 en 2023 *(source tierce, presse scientifique — voir
`docs/research_claude/`)*.

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
| **commercial / marketing** | comparatif de vendeur, benchmark maison — jamais une source primaire |

Un chiffre officiel reste souvent une **éval interne non reproductible par un tiers** : « établi »
qualifie alors le fait qu'il a été *publié*, pas qu'il a été *répliqué*. Écris la différence.

### 5. Qualité de source

Sources primaires d'abord — documentation officielle, article ou PDF académique, dépôt, changelog,
texte de loi — plutôt que fermes de contenu SEO qui recopient sans vérifier. Remonte au document
d'origine avant de citer : un chiffre trouvé sur trois pages qui se citent l'une l'autre n'est pas
recoupé, c'est **une seule** source.

### 6. XML structurel, pas décoratif

Les balises délimitent un rôle : documents, sources, variables, consignes. Elles ne décorent pas un
prompt court et homogène, où elles n'ajoutent que du bruit. Même règle que dans le plugin — voir
`CONVENTIONS.md` §1, « les balises XML ne sont pas un style ».

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
  serait un fichier qui croît (§D23).
- Le **format attendu** d'un rapport — TL;DR / Key Findings / Details / Recommendations / Caveats,
  confiance par affirmation, marqueurs `[À VÉRIFIER]` et `[INCERTAIN]` — vit dans
  `references/prompt-research.md`, chargée à la composition.

## Reprendre un résultat — la relecture critique

C'est la moitié qui compte. **Un rapport qui revient n'est pas un acquis : c'est une source de
plus**, et le fait qu'il ait été produit pour nous ne le rend pas plus vrai.

1. **Extraire ce qui est actionnable pour la phase en cours** — le reste attend son tour.
2. **Isoler et nommer ce qui ne se reprend pas comme acquis** : tout ce qui porte `[À VÉRIFIER]`,
   `[INCERTAIN]`, « source unique non recoupée », « éval interne », « préprint », « contenu
   commercial ». Isoler ne veut pas dire jeter — ça veut dire que ça ne descend pas dans un document
   que la suite du cycle traitera comme vrai.
3. **Rappeler que la confiance verbalisée n'est pas une probabilité**, y compris celle du rapport.
4. **Ne modifier aucun document du socle.** Rendre la liste ; l'humain décide ce qui descend dans
   `docs/stack.md` ou dans un ADR.

Le contrôle négatif qui prouve que la règle a tenu : après l'import d'un rapport,
`docs/journal/socle.md` n'a **pas** grossi, et aucun document du socle n'a été touché.

## Références

| Fichier | Quand la charger |
|---|---|
| `references/prompt-research.md` | `/scd-sdd:research` — le gabarit de prompt, ce qui est devenu obsolète dans la doctrine de prompting, et les caveats de fiabilité utiles à la relecture. **Datée en tête** : à revérifier avant de s'y fier. |
