# Référence — Parser un ticket et résoudre la cible

**Cinq points de chargement, tous des commandes** : `/scd-sdd:run` et `/scd-sdd:run-parallel`
(intégralement — `run-parallel` est la seule à avoir besoin de `<co-parallelisme>`), `/scd-sdd:sync`,
`/scd-sdd:reland`, `/scd-sdd:status`. **Aucun agent** : `ticket-briefer` a son propre protocole
d'extraction dans son corps, calibré sur le schéma `BRIEF` qu'il doit rendre.

<role>
Comment lire un ticket produit par `/scd-sdd:tickets`, résoudre lequel implémenter, et décider
lesquels sont **co-lançables en parallèle**.

⚠️ **La forme du ticket est fixée par le bloc `<format>` de `skills/specs/references/tickets.md`**,
qui l'écrit. Ce qui suit en dérive et **ne s'en écarte jamais** : si les deux divergent, c'est le
producteur qui a raison.
</role>

<parsing>
## Un ticket = un fichier

```
specs/NNN-slug/
├── SPEC.md        le contexte : problème, décisions, coutures de test, HORS-PÉRIMÈTRE
├── maquette.md    optionnelle, intention d'interface (écrite par /scd-sdd:spec ;
│                  l'implémentation ne la lit que via le brief)
├── 01-slug.md     un ticket
└── 02-slug.md
```

```markdown
# 02 — Export CSV d'un carnet vide

**Bloqué par :** 01
**Vérif :** test
**Fichiers :** `export/csv.ts`, `export/index.ts`

## Ce que ça livre
Un export demandé sur un carnet sans contact produit un fichier téléchargeable
contenant la ligne d'en-tête et rien d'autre.

## Critères
- [x] un carnet vide produit un fichier de 1 ligne
- [ ] l'en-tête est identique à celle d'un export non vide
```

- **`# NN — titre`** : le numéro est celui du **nom de fichier**, et il fait foi.
- **`**Bloqué par :**`** — les tickets qui doivent être **faits** avant celui-ci. `rien` /
  `rien — démarrable` = aucun bloqueur. C'est de l'**ordre**, pas de la compréhension.
- **`**Vérif :**`** ∈ `test` (défaut) · `observé`. **Absent → `test`.** Un `observé` porte
  normalement son motif entre parenthèses (`observé (mise en page)`) — le capturer.
- **`**Fichiers :**`** — le périmètre. Sert **uniquement** à décider ce qui est parallélisable.
- **`## Ce que ça livre`** — le comportement bout en bout. C'est le brief fonctionnel de
  l'implémenteur et la matière de la description de PR.
- **`## Critères`** — cases à cocher. **Un critère = une vérification observable = un commit.**
  Cochées par `progress-recorder`, jamais par un autre agent.

⚠️ **Il n'y a rien à aller chercher ailleurs pour implémenter.** Le cycle `1.x` faisait remonter les
énoncés `SHALL` depuis l'ancien `spec.md` pour chaque `FR` d'un lot ; le ticket est désormais
**autoportant**.
`SPEC.md` reste utile pour deux choses, et deux seulement : le **hors-périmètre**, qui sert à
refuser un ajout, et les **décisions de test**, qui disent où sont les coutures.
</parsing>

<etats>
## L'état, dérivé et jamais persisté

| Ticket | Condition |
|---|---|
| **fait** | tous ses critères sont `[x]` |
| **en cours** | certains `[x]`, d'autres `[ ]` |
| **à faire** | aucun `[x]` |
| **bloqué** | un ticket de son `Bloqué par` n'est pas **fait** |
| **démarrable** | à faire ou en cours, et tous ses bloqueurs sont faits |

Rien d'autre n'atteste qu'un ticket est fait, et rien d'autre n'a besoin de l'attester. Il n'y a
**aucun fichier d'état**, aucun journal, aucun verdict de gate à consulter.
</etats>

<resolution>
## Résoudre la feature et le ticket

**Feature** : la section **« Cibler une feature » du skill `specs`** est la source de vérité unique
du plugin — référencée, jamais recopiée. Ce niveau n'y ajoute qu'un **filtre de candidature** :
parmi les features, celles qui ont au moins un ticket non fait.

**Ticket** — la partie propre à ce niveau, et **la seule source de ces règles** (le `SKILL.md` et
les commandes y renvoient) :

- Argument `NN` fourni → cible.
- Sinon → le **premier ticket démarrable**, par numéro croissant.
- Ticket demandé mais **bloqué** → signale-le, nomme le bloqueur qui manque, et propose le premier
  démarrable.
- Aucun ticket démarrable, ou choix ambigu → **ne devine pas** : `AskUserQuestion`, ou renvoi vers
  `/scd-sdd:status`.

**Préconditions d'implémentation** — deux, et il n'y en a plus de troisième :
1. au moins un ticket existe dans `specs/NNN-slug/` ; sinon → renvoi vers `/scd-sdd:tickets` ;
2. l'arbre de travail est **propre** ; sinon → STOP.

⚠️ Il n'y a **plus de gate à vérifier**. Le cycle `1.x` exigeait un verdict `analyze` au vert, lu au
journal ; les deux ont disparu (`DECISIONS.md` §D41). Une reprise qui chercherait cette précondition
chercherait un fichier qui n'existe pas.
</resolution>

<co-parallelisme>
## Co-parallélisabilité (pour `/scd-sdd:run-parallel`)

**Deux couches, à ne pas confondre.**
- **Exécution** — réglée par l'isolation **worktree** (chaque ticket dans son propre checkout).
  C'est ce qui rend le parallèle *possible*.
- **Contenu** — deux tickets qui touchent le **même fichier** conflicteront au merge, worktree ou
  pas. C'est ce que la co-parallélisabilité *décide*.

**Règle.** Deux tickets demandés `Ti`, `Tj` sont **co-lançables** **ssi** :
1. leurs ensembles `Fichiers :` sont **disjoints** — `F(Ti) ∩ F(Tj) = ∅` — **ET**
2. **aucun ne bloque l'autre** de façon non mergée.

Sinon → ils sont **sérialisés** dans une chaîne `--base` :
- **fichiers non disjoints** → empilement, pour éviter le conflit de contenu ;
- **blocage** → empilement naturel (`base = impl/<slug>-<bloqueur>`), déjà porté par l'auto-stacking
  de `run`.

**Construire les chaînes.** Relation de conflit = (fichiers non disjoints) ∨ (blocage dans
l'ensemble demandé). Les **composantes connexes** sont les chaînes ; l'ordre intra-chaîne est
topologique par `Bloqué par`, à égalité par numéro. Le **premier** ticket d'une chaîne prend sa base
naturelle (défaut, ou auto-stacking sur un bloqueur hors-ensemble non mergé) ; les **suivants**
prennent `base = impl/<slug>-<ticket-précédent>` (+ `oldBase`). Chaînes distinctes = lancées en
parallèle.

**En cas de doute sur la disjonction** — ligne `Fichiers :` absente ou ambiguë — → **sérialise**. Le
parallèle est une optimisation, jamais une obligation : mieux vaut empiler que risquer un conflit
silencieux.

⚠️ **Le refactor large est le cas où cette règle se retourne.** Une séquence expand–contract a des
fichiers **massivement recouvrants** par construction : elle se sérialise toujours, et c'est
correct. Un `run-parallel` qui la trouverait « parallélisable » a mal lu la ligne `Fichiers :`.
</co-parallelisme>
