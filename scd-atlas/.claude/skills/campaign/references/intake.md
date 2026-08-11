# Référence — l'intake : lire un rapport en critique, en tirer une liste de comblement

Chargée par `campaign` à l'**intake** (`/scd-atlas:intake`), pour chaque rapport revenu. Elle porte la
méthode de relecture et la forme de son livrable. Les canaux qui **comblent** les trous ainsi ouverts
sont dans `collecte.md` ; l'endroit où la liste s'écrit est dans `carte.md`.

- [La règle](#la-règle)
- [Les sept passes de lecture](#les-sept-passes-de-lecture)
- [Le verdict, affirmation par affirmation](#le-verdict-affirmation-par-affirmation)
- [La liste de comblement](#la-liste-de-comblement)
- [Refermer, ou déclarer irréductible](#refermer-ou-déclarer-irréductible)
- [Le rapport ne se corrige pas](#le-rapport-ne-se-corrige-pas)
- [Ce que l'intake ne fait pas](#ce-que-lintake-ne-fait-pas)

## La règle

**Un rapport est une source de plus, pas un acquis.** Un rapport Research revient long, structuré,
sourcé et sûr de lui — c'est exactement ce qui rend la relecture nécessaire. L'intake est le moment
où l'on sépare **ce qui descendra dans le skill cible** de ce qui reste à vérifier et de ce qui ne
descendra jamais.

Un rapport passe l'intake **par sujet**, jamais par lot : la carte porte une ligne par sujet, et un
rapport peut être exploitable pendant que son voisin ouvre six trous.

## Les sept passes de lecture

Chacune se lit sur le rapport entier, dans cet ordre. Les trois premières sont mécaniques — le
rapport se dénonce lui-même ; les quatre suivantes demandent de croiser avec ce qu'on sait.

| # | Passe | Ce qu'on cherche |
|---|---|---|
| 1 | **Marqueurs** | chaque `[INCERTAIN]` du corps : donnée manquante, divergente ou non vérifiable. Le prompt les a demandés — ils sont là pour être ramassés |
| 2 | **Caveats et angles morts** | la section où le rapport dit ce qui ne tient que sur une source unique, ce qu'il n'a pas instruit, ce qu'il n'a pas pu lire. **C'est la section la plus utile du rapport** |
| 3 | **Désaccords laissés ouverts** | deux sources réputées qui se contredisent. Un désaccord n'est pas un défaut du rapport : il se transmet tel quel, il ne se tranche pas à l'intake |
| 4 | **Affirmations sans citation** | une affirmation qu'aucune citation verbatim ne porte est une affirmation du modèle. Elle ne descend pas sans être vérifiée |
| 5 | **Classes de preuve** | le rapport étiquette-t-il ses chiffres ? Un chiffre étiqueté *benchmark d'éditeur*, *marketing* ou *rapporté* ne monte pas au rang d'un chiffre *mesuré* parce qu'il est commode |
| 6 | **Sources qui se citent l'une l'autre** | trois pages qui relaient le même billet font **une** source, pas trois. Le recoupement se vérifie en remontant au document d'origine |
| 7 | **Péremption et versions** | la date du rapport face aux versions qu'il décrit. Une majeure sortie depuis, un plafond tarifaire, un quota : ce sont les faits qui vieillissent le plus vite |

Le vocabulaire des deux axes — *mesuré · rapporté · anecdotique · non étayé* et *officiel · préprint
· benchmark d'éditeur · marketing* — est celui que le prompt a demandé ; il est défini dans le skill
`research-prompter` et ne se redéfinit pas ici. **L'intake ne l'invente pas, il vérifie qu'il a été
appliqué.**

Une passe de plus, hors table, et c'est celle qu'on oublie : **ce que le prompt demandait et que le
rapport ne traite pas.** Elle se joue en relisant le prompt de `prompts/NN-slug.md` à côté du
rapport. Un angle silencieusement sauté ne laisse aucun marqueur.

## Le verdict, affirmation par affirmation

Trois issues, et trois seulement. Le classement porte sur les affirmations **à enjeu** — celles qui
descendront dans le skill cible ou qui commandent une décision ; le reste n'a pas besoin d'être trié.

| Verdict | Ce que ça veut dire | Ce qui suit |
|---|---|---|
| **repris** | source primaire, citation présente, recoupée ou officielle sur son propre objet | descend à la distillation |
| **repris avec réserve nommée** | vrai mais borné — une seule source, un chiffre daté, un périmètre plus étroit que ce que la phrase suggère | descend **avec** sa réserve, jamais sans |
| **non repris** | promotionnel, non recoupé, rétro-ingénierie, ou hors du périmètre du rapport | ne descend pas, et le motif s'écrit une fois |

Un verdict **non repris** n'est pas une ligne de comblement : il est clos. Ce qui ouvre une ligne,
c'est un fait dont on a **besoin** et que le rapport n'établit pas.

## La liste de comblement

Elle vit dans les notes de la carte, sous la section du sujet, une ligne par trou. Une ligne utile
nomme trois choses : **ce qui manque**, **le canal qui le donnerait**, et **ce que ça change** si le
trou reste ouvert.

```markdown
### 04 — Adaptateur de déploiement
- **Comblement** :
  - [x] la liste exacte des options de configuration en v7 — `gh api` sur le fichier de types,
        extrait cité dans la fiche de collecte.
  - [ ] la date de sortie de la 7.2 — API du registre ; sans elle, impossible de dire quelles
        options sont disponibles chez un utilisateur à jour.
```

Deux règles de forme, qui évitent qu'elle ne devienne un journal :

- **une ligne se coche, elle ne se réécrit pas.** Ce qui a comblé le trou s'écrit en fin de ligne, en
  quelques mots — le contenu, lui, va dans la fiche de collecte du sujet, qui sert de cache ;
- **la liste précède la collecte.** On ouvre toutes les lignes d'un sujet, puis on collecte. L'ordre
  inverse — collecter au fil de la lecture — produit des trous jamais écrits, donc jamais refermés,
  et une session suivante ne saura pas qu'ils existaient.

## Refermer, ou déclarer irréductible

Un sujet n'est `Comblé` que si **chaque ligne est cochée ou déclarée irréductible** — jamais parce
qu'on a arrêté de chercher.

Un trou est **irréductible** quand aucun canal ne le donne : la mesure n'existe pas publiquement, la
source est privée, le fait n'est pas encore arrêté par l'éditeur. Il se déclare alors deux fois :

- la ligne de comblement se coche en le disant (`[x] — aucun canal : la donnée n'existe pas
  publiquement`) ;
- **et il descend dans le skill cible comme une limite écrite**, à l'endroit où quelqu'un irait la
  chercher. Un trou connu qui n'est écrit nulle part sera comblé par une invention au premier usage.

C'est la seule chose que l'intake fait descendre lui-même dans le plugin cible — une limite, jamais
un fait.

## Le rapport ne se corrige pas

Un rapport revenu est un artefact **committé en l'état**. On ne l'édite pas, on ne le complète pas, on
n'y annote pas les verdicts : ce qui a été trouvé après lui vit dans la **fiche de collecte** du
sujet, ce qui est jugé vit dans la **liste de comblement**, et ce qui est retenu vit dans le **skill
cible**. Corriger le rapport ferait disparaître la trace de ce qu'une campagne a réellement rapporté
— et c'est précisément ce qu'une campagne ultérieure lira pour se différencier.

Un rapport franchement inexploitable — hors sujet, tronqué, sans citation — n'est pas réparé non
plus : le sujet se rejoue avec un prompt révisé, dans le répertoire de la campagne, et l'ancien reste
où il est.

## Ce que l'intake ne fait pas

- **Il ne distille pas.** Décider où une affirmation retenue s'écrit dans le skill cible appartient à
  `distillation.md`. L'intake tranche ce qui est vrai ; la distillation tranche ce qui est dit.
- **Il ne lance aucune recherche** et n'attend aucun rapport en session : il constate ce qui est sur
  le disque, et un sujet dont le rapport n'est pas revenu n'est pas un sujet en échec.
- **Il ne tranche aucun désaccord entre sources réputées.** Il le transmet.
- **Il ne coche aucune case de la carte qu'il n'a pas constatée** — `Rapport` se coche sur la présence
  du fichier, `Comblé` sur l'état de la liste, jamais sur une intention.
