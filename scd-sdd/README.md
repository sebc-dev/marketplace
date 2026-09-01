# scd-sdd

Cycle spec-driven **allégé**, du projet vide à la PR — et les **gardes** qui empêchent l'agent de
réécrire ce qui vérifie son travail.

> **`2.0.0` est cassant.** Le cycle `1.x` — socle en 4 phases, `specify → clarify → plan → tasks →
> analyze`, deux gates, journal, notation EARS — est **remplacé**, pas étendu. Un projet déjà suivi
> se reprend par **`/scd-sdd:migrate`**, et c'est le seul chemin : elle ARCHIVE l'arbre `1.x`
> entier dans `docs/1.x/` — rien n'est supprimé — puis le workflow normal réécrit au format
> `2.0.0` depuis cette archive.

---

## Le constat qui a produit cette version

Le cycle `1.x` coûtait plus qu'il ne rendait : **31 commandes, 21 agents, 16 011 lignes**, deux
gates bloquantes par feature, seize contrôles, un verdict à trois niveaux, et deux capacités
transverses qui **rejugeaient** ce qui était déjà écrit.

Le fait qui commande la refonte n'est pas une question de goût. **Une gate coûte à l'écriture, à la
relecture et à la convergence — et ce qu'elle attrape est du texte.** Les défauts qui coûtent
réellement sont des défauts de **comportement de l'agent au moment d'écrire du code** : éteindre le
typage, neutraliser un test, contourner un hook. Aucun contrôle documentaire ne les voit, et aucun
ne le pouvait.

`2.0.0` ne retire donc pas la rigueur : **elle la déplace**. Des gates vers les gardes.

| | `1.x` | `2.0.0` |
|---|---|---|
| Commandes | 31 | **20** |
| Agents | 21 | **15** |
| Skills | 10 | **7** |
| Gates bloquantes | 2 | **0** |
| Documents du socle | 5 | **3** |

---

## Le cycle

```
/scd-sdd:init          →  docs/adr/ · docs/ci.md · CLAUDE.md      (une fois)
/scd-sdd:guards        →  .claude/guards.json + le job CI          (une fois, rejouable)
/scd-sdd:adr           →  docs/adr/NNNN-*.md                       (à tout moment)
/scd-sdd:vision        →  docs/vision.md    (optionnel, au-dessus des features)

/scd-sdd:spec  <idée>  →  specs/NNN-slug/SPEC.md      (~40 lignes)
/scd-sdd:tickets NNN   →  specs/NNN-slug/NN-slug.md   (tranches verticales)
/scd-sdd:run NNN NN    →  branche → TDD → review → PR
```

### Le socle : trois artefacts, une conversation

| Fichier | Ce qu'il porte |
|---|---|
| `docs/adr/NNNN-*.md` | une décision structurante, **immuable une fois acceptée** |
| `docs/ci.md` | les commandes du projet, les contrôles qui bloquent, **et ce qu'ils ne couvrent pas** |
| `CLAUDE.md` | conventions, Definition of Done, **glossaire du domaine** |

`/scd-sdd:init` **n'interviewe pas**. Elle constate le dépôt — langage, scripts, workflows, configs
— et ne demande que ce qui ne s'y lit pas : le domaine, et le *pourquoi* des conventions
non-standard. Elle est **rejouable** : sur un `CLAUDE.md` existant elle **révise** section par
section, et ne ré-assemble jamais.

Un **quatrième artefact, optionnel**, se pose un cran au-dessus des features : `/scd-sdd:vision`
écrit `docs/vision.md` — le north star, les exigences `FR`/`SC`, les préoccupations par domaine
(architecture, sécurité, UX/UI) qui **nourrissent les ADR**, et un découpage `epic → feature`. Rien
du cycle n'en dépend. C'est le **seul artefact qui interviewe** — mais seulement au dépôt vide, quand
il n'y a rien à synthétiser ; sinon il révise ou compile depuis la conversation ou une archive
`docs/1.x/`. Un domaine porte des **préoccupations** ; la **décision** reste un ADR qui les cite.

### Par feature : une spec courte, des tickets verticaux

`SPEC.md` fait **~40 lignes** — Problème · Solution · Ce que ça change · Décisions d'implémentation ·
Décisions de test · Hors-périmètre — et **synthétise la conversation en cours** plutôt que de la
provoquer. Quand la feature touche une interface, `/scd-sdd:spec` propose en plus une
`maquette.md` **optionnelle** — wireframes textuels aux écrans nommés, que les critères des tickets
citent et que la vérif de mise en page compare.

Un **ticket** livre un comportement bout en bout et déclare ce qui le bloque :

```markdown
# 02 — Export CSV d'un carnet vide

**Bloqué par :** 01
**Vérif :** test
**Fichiers :** `export/csv.ts`, `export/index.ts`

## Ce que ça livre
Un export demandé sur un carnet sans contact produit un fichier téléchargeable
contenant la ligne d'en-tête et rien d'autre.

## Critères
- [ ] un carnet vide produit un fichier de 1 ligne
- [ ] l'en-tête est identique à celle d'un export non vide
```

Un ticket **horizontal** — « créer la table », puis « créer l'API », puis « créer l'UI » — est
rejeté : sa correction ne se juge qu'en assemblage, donc il ne livre rien de vérifiable.

⚠️ **Le refactor large est l'exception.** Un changement mécanique dont le rayon d'action traverse le
dépôt ne rentre dans aucune tranche verticale — aucune ne peut rester verte. Il se séquence en
**expand → migrer par paquets → contract**.

### La validation tient en deux gestes humains

1. **Relire la `SPEC.md`.** Quarante lignes, une fois.
2. **Arbitrer la granularité des tickets.** `/scd-sdd:tickets` présente son découpage et **demande** :
   trop gros, trop fin, les dépendances sont-elles réelles ? Il itère jusqu'à l'accord.

Il n'y a pas de troisième geste. Pas de gate, pas de verdict, pas de fiche de corrections.

---

## Les gardes

Le terrain est sans ambiguïté : un agent a contourné des hooks pre-commit par `--no-verify`,
`git stash` et flags silencieux sur **six commits consécutifs**, malgré des règles `CLAUDE.md`
explicites. **Un texte que l'agent lit ne le contraint pas.**

| Couche | Teste | Sans `guards.json` | Avec |
|---|---|---|---|
| **1 — chemins** | le fichier visé : tests, workflows, config d'outillage | silence | **bloque** + trace |
| **1b — shell** | `sed -i`, `rm`, `mv`, une redirection vers un chemin protégé | silence | **bloque** + trace *(best-effort)* |
| **2 — affaiblissement** | le **contenu écrit** : `@ts-ignore`, `as any`, `eslint-disable`, `.skip(`, `# noqa`, `--no-verify` | **avertit** + trace | **bloque** + trace |
| **3 — CI** | le diff de la PR : `verifier-guard`, `test-integrity`, `quality-config-guard` | — | posé par `/scd-sdd:guards` |
| **ADR** | la réécriture d'un ADR **existant** | **bloque** | **bloque** |

**La couche 2 est celle qui compte.** Elle vise un fichier que l'agent a parfaitement le **droit**
d'éditer — son propre code —, ce qui la rend structurellement invisible à la couche 1.

**La trace est le livrable ; le blocage n'en est que la conséquence.** Chaque tentative écrit une
ligne dans `.claude/guard-log.jsonl` : date, outil, fichier, règle, extrait. La question à laquelle
le dispositif répond n'est pas *l'a-t-on empêché ?* mais **l'a-t-il essayé ?**

**Le plugin porte le script, le projet porte la liste.** `.claude/guards.json` appartient au projet
et lui seul ; le plugin ne devine jamais ce qu'un dépôt protège. Trois chemins sont malgré tout
protégés **en dur** — `guards.json`, `guard-log.jsonl`, `settings.json` : un agent ne doit pouvoir
ni éditer sa propre laisse, ni effacer la trace de ses tentatives.

### Ce que les gardes ne couvrent pas

- **L'oracle faux.** Aucun outil ne connaît l'intention. Un test vert peut ne rien prouver.
- **Le contournement par une forme non reconnue.** La couche 1b lit une ligne de commande.
- **`python3` absent** : les couches 1 et 2 ne tournent pas, **sans message** — un hook qui ne
  démarre pas ne peut pas s'annoncer. La CI est le rattrapage.
- Et la réserve qui vaut pour tout garde greppable : **réprimer un comportement peut le rendre plus
  subtil plutôt que l'éliminer.** Aucune mesure publiée ne tranche.

**La soupape est `/scd-sdd:signer`** : ce qui doit vraiment franchir un garde franchit par un commit
**signé**, donc relu par un humain. Le plugin **n'exécute aucune cryptographie** — il écrit le
workflow qui la vérifie.

---

## L'implémentation

`/scd-sdd:run NNN NN` lance un *dynamic workflow* de subagents en arrière-plan :

```
Branch → Rebase → Prepare → [Red → Validate → Green] ou [Green → Verify] → Review → Triage → Apply → Record → Describe → PR
```

**Deux modes de vérification, et deux seulement.** `test` (défaut) : rouge confirmé avant le vert,
preuve = `0 failed` sur la sortie réelle. `observé` : aucun test automatisé possible, preuve =
observation **capturée**. Un `observé` sur de la logique métier est un défaut de découpage.

Les invariants qui ne se négocient pas :

- **Un critère = une vérification observable et nommée.**
- **Ne jamais toucher aux tests** dès qu'ils existent — garanti par un `git diff` déterministe, pas
  par une consigne.
- **La vérif se prouve.** « looks done » n'est jamais un état.
- **Producteur ≠ vérificateur.** Ni le reviewer ni le `verifier` n'ont écrit le code.
- Ce qu'un agent **ne peut pas** constater part en `humanCheckRequired` et remonte en checklist dans
  la PR — jamais faussement attesté, et **aucun agent ne coche jamais une case**.

`/scd-sdd:run-parallel` joue plusieurs tickets en **worktrees isolés**, après avoir calculé ce qui
est réellement co-parallélisable (fichiers disjoints **et** aucun blocage mutuel non mergé).
`/scd-sdd:sync` et `/scd-sdd:reland` rattrapent les deux pathologies des PR empilées.

---

## Les 22 commandes

### Socle
| Commande | Produit |
|---|---|
| `/scd-sdd:init` | `docs/adr/`, `docs/ci.md`, `CLAUDE.md` — ou **révise** un `CLAUDE.md` existant |
| `/scd-sdd:adr` | `docs/adr/NNNN-*.md`, immuables |
| `/scd-sdd:vision` | `docs/vision.md` — **optionnel**, au-dessus des features (vision, `FR`/`SC`, domaines, epics) |
| `/scd-sdd:guards` | `.claude/guards.json`, le job CI, et **déroule la trace** |

### Feature
| Commande | Produit |
|---|---|
| `/scd-sdd:spec` | `specs/NNN-slug/SPEC.md` (+ `maquette.md`, optionnelle) |
| `/scd-sdd:tickets` | `specs/NNN-slug/NN-slug.md` |

### Implémentation
| Commande | Produit |
|---|---|
| `/scd-sdd:run` | un ticket → une PR ready-for-review |
| `/scd-sdd:run-parallel` | plusieurs tickets en worktrees isolés |
| `/scd-sdd:sync` | re-rebase une PR empilée dont la base vient d'être mergée |
| `/scd-sdd:reland` | rapatrie un ticket mergé hors de la branche par défaut |

### Chantiers — survivre au `/clear`
| Commande | Produit |
|---|---|
| `/scd-sdd:pause` | `docs/chantiers/en-cours/AAAA-MM-JJ-slug.md` |
| `/scd-sdd:resume` | recharge le contexte que la fiche désigne, sous contrôle de fraîcheur |
| `/scd-sdd:note` | une fiche d'`archive/` pour un travail hors-cycle **déjà terminé** |

### Transverse
| Commande | Produit |
|---|---|
| `/scd-sdd:status` | l'état complet, dérivé — socle, features, PR, chantiers, trace des gardes |
| `/scd-sdd:signer` | décide si un commit doit être signé, prépare l'index et le message |
| `/scd-sdd:review-setup` | `.claude/review.json` — skills et MCP pertinents pour la review d'implémentation |
| `/scd-sdd:lookup` | une réponse sourcée en session, sans rien écrire |
| `/scd-sdd:research` | compose un prompt Claude Research, puis classe le rapport revenu |
| `/scd-sdd:linear-setup` | `docs/linear.md` — l'opt-in du miroir Linear, une seule fois |
| `/scd-sdd:linear` | miroir Linear **poussé**, opt-in, strictement unidirectionnel |
| `/scd-sdd:linear-review` | pilotage du miroir Linear en session — Now/Next/Later, hygiène de backlog, rien n'est écrit |
| `/scd-sdd:migrate` | archive l'arbre `1.x` dans `docs/1.x/`, répare ce qui le nomme, rend la séquence de réécriture |

---

## L'état se dérive, toujours

Il n'y a **aucun fichier d'état** et **aucun journal**. Les cases d'un ticket disent ce qui est
fait ; la forge dit ce qui est en revue ; `git log` dit ce qui a été commité ;
`.claude/guard-log.jsonl` dit ce que l'agent a tenté.

**Un seul fait échappe aux quatre** : un `/scd-sdd:run` qui se **bloque** ne coche aucun critère et
n'ouvre aucune PR — il serait indiscernable d'un ticket jamais lancé. Il ouvre donc une **fiche de
chantier**, et `/scd-sdd:status` la relit.

Les chantiers portent leur état **dans leur répertoire** — `en-cours/`, `en-attente/`, `archive/` —
et changent d'état par `git mv`. Une fiche archivée n'est jamais supprimée.

---

## Installation

```bash
/plugin marketplace add sebc-dev/marketplace
/plugin install scd-sdd@sebc-dev-marketplace
```

Puis, dans un projet :

```bash
/scd-sdd:init      # le socle, en une conversation
/scd-sdd:guards    # les gardes + le job CI
/scd-sdd:spec      # la première feature
```

Un projet déjà suivi en `1.x` : **`/scd-sdd:migrate` d'abord**, et rien d'autre avant. Elle archive,
elle ne convertit pas — `/scd-sdd:init` vient juste après, et le reste s'écrit dessous.

---

## Ce qui n'est pas éprouvé

⚠️ **`2.0.0` est écrit et mécaniquement vérifié, jamais joué de bout en bout.** La question à
laquelle aucune session ne peut répondre est celle de la refonte entière : **le cycle allégé
produit-il des specs assez bonnes pour que `/scd-sdd:run` tienne, sans la gate qui le
garantissait ?**

Le **miroir Linear** n'a jamais été joué en réel non plus, et son remappage vers les tickets reste
un raisonnement.
