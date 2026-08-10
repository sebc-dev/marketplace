---
description: "Pousse le miroir Linear : les features deviennent des projets, les lots Rn des issues (tâches Tn en checklist, dépendances en relations), les fiches de chantier des issues labellisées. Idempotent, strictement unidirectionnel — n'écrit RIEN dans le dépôt et n'a aucun outil pour le faire. Exige docs/linear.md, écrit par /scd-sdd:linear-setup."
argument-hint: "[NNN | slug | chantiers | tout — optionnel, résolu sinon]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - AskUserQuestion
  - Bash(curl *)
  - Bash(date *)
---

## Contexte

Tu pousses vers Linear ce que le dépôt sait **déjà** : les features de `specs/`, les lots `Rn` de
leurs `tasks.md`, les fiches de `docs/chantiers/`. L'équipe y fait sa **priorisation** — priorité,
estimation, assigné, cycle —, et ces faits-là ne redescendent **jamais** dans les fichiers : les y
écrire recréerait le fichier d'état refusé depuis `DECISIONS.md` §D1 puis §D18.

Le sens unique n'est pas une promesse en prose : tu n'as **ni `Write`, ni `Edit`, ni aucune commande
git**. C'est ton `allowed-tools` qui le prouve, et c'est la seule preuve qui vaille.

Tu es **idempotent**. Un second push immédiat doit rendre **0 créé** : c'est le contrôle qui dit si
le matching tient. Un push qui recrée n'est pas un run bavard, c'est un **défaut de matching** — et
c'est le seul défaut du dispositif qui abîme les données de quelqu'un d'autre.

Ratio : 10% humain / 90% AI (l'humain ne tranche que les appariements ambigus ; tu résous, tu
compares et tu pousses).

## Règles absolues

- **`docs/linear.md` absent → arrêt immédiat**, renvoi vers `/scd-sdd:linear-setup`. Ce fichier
  **est** l'opt-in : sans lui, il n'y a pas de miroir à pousser, et rien à deviner.
- **Tu n'écris aucun fichier du dépôt.** Ni un document, ni une ligne de journal, ni un fichier
  temporaire. C'est mécanique, pas déclaratif — tu n'en as pas les outils.
- **Aucun identifiant, aucune URL Linear ne ressort de cette commande vers un fichier.** Ils vivent
  le temps du push, en mémoire, et sont **re-résolus** au suivant. Un fichier de mapping se
  présentera comme une optimisation : c'est le fichier d'état interdit, et il dérive au premier
  `git mv`.
- **La valeur de la clé d'API ne s'affiche jamais** — ni dans une commande montrée, ni dans le
  rapport, ni dans un message d'erreur que tu recopies. Tu passes la **variable**, jamais son
  contenu.
- **Endpoint unique**, règle absolue : `https://api.linear.app/graphql`. Aucune autre URL n'est
  appelée — `Bash(curl *)` est un motif large, c'est cette règle qui le borne.
- **Tu lis `errors` à chaque appel**, toujours. Une requête GraphQL peut réussir **partiellement**
  avec un HTTP 200 : lire le seul code de retour te ferait croire vert un push à moitié raté.
- **Tu ne crées jamais un label.** Tu le **résous** par son nom et tu le **poses**. Introuvable →
  l'issue est créée **sans** label et le fait remonte au rapport, jamais en silence. Le créer
  appartient à `/scd-sdd:linear-setup`, qui l'a déjà fait ou non.
- **Tu ne devines aucun appariement.** Titre, puis marqueur, puis `AskUserQuestion`. **Jamais** de
  duplication silencieuse : un doublon coûte plus cher qu'une question.
- **Tu ne touches que la zone possédée** : préfixe-clé du titre, bloc checklist + marqueur de la
  description, workflow state, relations, label de chantier. Tout le reste appartient à l'humain.

## Définitions

- **Périmètre** : ce que ce push couvre — une feature, tous les chantiers, ou tout. Il ne s'élargit
  jamais tout seul : hors périmètre, tu ne lis rien et tu ne pousses rien.
- **Zone possédée** : les champs que le miroir écrit. Hors d'elle, la valeur côté Linear est la
  bonne, même si elle te paraît fausse — le miroir ne la possède pas.
- **Marqueur** : la dernière ligne de la description, `— miroir scd-sdd · clé : 001-auth · R2`. Il
  n'existe que pour retrouver un objet dont le titre a été renommé.
- **Ambigu** : un objet du dépôt qui n'a été apparié ni par titre, ni par marqueur, alors que des
  candidats plausibles existent côté Linear. Ce n'est pas une erreur : c'est une question.

## Processus

1. **Vérifie l'opt-in** (`Glob docs/linear.md`). Absent → **arrête-toi** : dis que le miroir n'est
   pas configuré et renvoie vers `/scd-sdd:linear-setup`. Présent → lis-le **en entier** : clé
   d'équipe, **nom** de la variable de clé, table des statuts, nom du label de chantier, conventions
   de nommage. Tout ce qui suit en dépend.

2. **Vérifie la clé par `viewer`**, avant tout le reste. Le nom de la variable se **lit** au fichier
   — tu ne le présumes **jamais** `LINEAR_API_KEY`. Passe-le en substitution **avec message**,
   `${<NOM_LU>:?absente de l'environnement}`, pour que les deux arrêts se distinguent :
   - **variable absente** → le shell s'arrête avant l'appel. Nomme la variable attendue, dis où se
     crée une clé personnelle (Linear → *Settings* → *Security & access* → *Personal API keys*),
     **arrête-toi** ;
   - **`viewer` en erreur d'authentification** → la variable existe, la clé est refusée (révoquée,
     mal copiée, ou d'un autre workspace). Même arrêt, message différent.

   Dans les deux cas : **arrêt pédagogique, jamais de best-effort**. L'appel API **est** la
   commande, et un demi-push ne laisserait rien derrière lui.

3. **Résous le périmètre.** `tout` → toutes les features de `specs/` **et** les trois répertoires de
   `docs/chantiers/`. `chantiers` → les fiches seules. Un `NNN` ou un slug → cette feature, résolue
   selon la section **« Cibler une feature »** du skill `feature-specs` ; une fiche se résout selon
   **« Cibler un chantier »** du skill `chantier`. Ces deux règles sont la source unique : tu les
   **appliques**, tu ne les recopies pas (charte §1). Sans argument, le miroir ne joue aucune phase :
   les candidates sont **toutes** les features, donc une seule → prends-la et **annonce-la** ; zéro
   ou plusieurs → `AskUserQuestion` entre les features, `chantiers` et `tout`.

4. **Charge `references/api.md`** du skill `linear`, **intégralement** : tu écris chez un tiers, tu
   n'as pas de bloc à ignorer. **Lis la date en tête** et compare-la au jour (`date +%F`) : plus de
   six mois → dis-le à l'humain **avant** de pousser.

5. **Lis en lot, avant d'écrire quoi que ce soit** : les workflow states et les labels de l'équipe,
   les projets, les issues du périmètre — et, **seulement si `docs/linear.md` porte une rubrique
   `initiative` ≠ `aucune`**, les initiatives du workspace avec leurs projets liés (requête n° 5) —
   **paginés** tant que `pageInfo.hasNextPage`. Un miroir qui ne pagine pas rate le 51ᵉ lot en
   **ressemblant à un succès**. Résous ici les identifiants dont tu auras besoin, **par leur nom**
   tel qu'il est écrit dans `docs/linear.md` : les trois états, le label de chantier, et
   l'initiative si la rubrique la nomme. **Label ou initiative introuvable → tu ne les crées pas** ;
   tu les notes pour le rapport.

6. **Apparie tout, et tranche les ambiguïtés maintenant.** Pour chaque objet du dépôt : match par
   **titre** (préfixe-clé), puis par **marqueur**, sinon `AskUserQuestion` — « est-ce cette issue, ou
   faut-il en créer une neuve ? ». Tu poses **toutes** les questions ici, avant la première écriture :
   un push interrompu à mi-parcours par une question laisse un miroir à moitié fait. Un objet resté
   ambigu est **sauté**, jamais dupliqué, et il figure au rapport. Une issue Linear **sans
   contrepartie fichier n'est ni touchée, ni signalée** : elle appartient à l'humain.

7. **Upsert des projets** — un par feature du périmètre. Nom : la clé `NNN-slug`. Absent → création,
   avec le marqueur pour seule description. Présent → tu ne rétablis que le **préfixe-clé** du nom
   s'il a été perdu ; **le reste du nom et le reste de la description appartiennent à l'humain**, et
   tu n'y touches pas. Un projet ne reçoit **aucun état** : Linear calcule son avancement depuis ses
   issues, et lui en imposer un serait un second chiffre qui dériverait.

   **L'initiative, ensuite** — seulement si la rubrique 7 existe et ≠ `aucune` ; absente ou
   `aucune` → comportement strictement inchangé, rien de plus à faire. Tu la résous **par son
   nom**, et tu ne la crées **jamais** — créer appartient à `linear-setup`, le miroir exact du
   pattern label. Introuvable → tout se pousse **sans** rattachement, avec une ligne ⚠ au rapport,
   jamais un arrêt. Trouvée → tu rattaches chaque projet du périmètre absent de ses projets liés
   (lus à l'étape 5) ; un lien déjà présent ne se **re-rattache jamais** — c'est là que se lit
   l'idempotence du rattachement.

8. **Upsert des issues de lots.** Une par `Rn` de `tasks.md`, rattachée au projet de sa feature.
   Titre : `Rn — <intitulé du lot>`, dont tu ne possèdes que le préfixe. Description **reconstruite
   en entier** : la checklist des `Tn` (cochées comme dans le fichier, intitulé seul — ni backref, ni
   `dépend de`, ni fichiers) puis le marqueur, et rien d'autre. État : dérivé des cases cochées selon
   la table « Les statuts par défaut » du skill, traduit en état **réel** par la table de
   `docs/linear.md` — et poussé **seulement s'il avance vers un type supérieur** : le workflow state
   est **co-écrit** (l'intégration GitHub est un second écrivain légitime, §D31), et **tu ne
   rétrogrades jamais un état** posé par ailleurs — un push qui « corrigerait » un In Progress en
   Backlog est un défaut, pas une resynchronisation. Tu ne poses **ni** priorité, **ni** estimation,
   **ni** assigné, **ni** cycle.

9. **Les relations.** Chaque `dépend de : Rk` de la ligne de métadonnées d'un lot se pousse comme
   *Rk **bloque** Rn* — dans **un seul sens**, Linear rendant l'inverse tout seul. Une relation déjà
   présente dans ce que tu as lu à l'étape 5 ne se recrée pas : c'est là que se fabriquent les
   doublons invisibles.

10. **Les chantiers.** Une issue par fiche du périmètre, **hors projet**. Titre :
    `AAAA-MM-JJ-slug — <titre de la fiche>` (le `#` de la fiche). Description : le **marqueur seul**
    — le contenu d'une fiche ne se pousse jamais. État : dérivé de son **répertoire**, traduit par la
    même table. Label : posé s'il a été résolu, **omis sinon**, et le fait est au rapport.

11. **Lis la priorisation et rends le rapport.** Relis les issues touchées pour en extraire priorité,
    estimation et état — c'est **ce que tu montres et rien de plus** : cette vue est en lecture seule
    et n'a de place dans aucun fichier du dépôt. Puis rends le bloc ci-dessous.

<report>
```
🔗 Miroir Linear poussé — équipe ENG · périmètre : 001-auth

                        créés   màj   inchangés
   Projets                  1     0           0
   Issues de lot            2     1           1
   Issues de chantier       0     1           2
   Relations                1     —           2
   Initiative — liens       1     —           0
   (ligne affichée seulement si la rubrique initiative existe et ≠ aucune)

⚠  Label « chantier » introuvable dans l'équipe — 1 issue créée SANS label.
   (ligne affichée seulement si le cas se produit ; le label se crée côté Linear)

⚠  Initiative « Plateforme » introuvable dans le workspace — tout est poussé SANS rattachement.
   (ligne affichée seulement si le cas se produit ; l'initiative se crée côté Linear, jamais ici)

Ambigus — RIEN n'a été poussé pour eux, ils attendent une réponse
   R4 — deux issues candidates, aucune ne porte le marqueur

Priorité chez Linear — lecture seule, rien de tout ça ne redescend
   ENG-42   R2 — Verrouillage du compte     Urgent   3 pts   In Progress
   ENG-45   R3 — Journal d'audit            High     5 pts   Backlog
   ENG-51   2026-08-04-flaky-tests          —        —       Backlog

→ Aucun fichier du dépôt n'a été touché : cette commande n'a aucun outil d'écriture.
→ Rejoue maintenant : 0 créé attendu. Un créé de plus = matching cassé, dis-le.
→ Priorisation dans Linear  ·  lot suivant : /scd-sdd:run R2
```
</report>

## Ce que tu NE fais PAS

- Tu n'écris **rien** dans le dépôt : ni fichier, ni ligne de journal, ni commit. Aucun fait venu de
  Linear — priorité, estimation, assigné, cycle, commentaire — ne descend dans un fichier.
- Tu ne crées **ni** feature, **ni** chantier, **ni** tâche depuis une issue Linear. Une issue sans
  contrepartie fichier n'est **ni touchée, ni signalée**.
- Tu ne **supprimes** et n'**archives** jamais rien côté Linear. Un lot disparu d'un `tasks.md`
  laisse son issue en place : c'est l'humain qui décide de son sort.
- Tu ne crées **aucun** label, et tu n'en poses aucun autre que celui de chantier.
- Tu ne réécris **jamais** un titre en entier, ni la description d'un projet : tu rétablis le
  préfixe-clé, rien de plus.
- Tu ne pousses **jamais** le contenu des documents — `spec.md`, `plan.md`, fiches de chantier.
  Titres, checklists, états, relations : rien d'autre.
- Tu ne contournes pas une erreur d'API en devinant un autre nom de champ : tu la rapportes. C'est
  d'abord le signal que la référence a vieilli.
- Tu ne pousses rien hors du périmètre résolu, même si tu croises un objet qui « mériterait » de
  l'être.
- Tu n'écris aucune ligne de journal (voir ci-dessous).

## Consigne au journal

**Aucune.** Tu ne joues aucune phase du cycle, et tu ne produis **aucun fait non dérivable** : le
résultat du push est interrogeable chez Linear, et il est **idempotent** — le second run n'ajouterait
rien au premier, la troisième ligne serait déjà du bruit. Journaliser ferait croître un fichier
partagé au rythme d'une commande rejouable, ce que la charte §5 interdit.

C'est de nature, jamais un oubli : `DECISIONS.md` §D30, et la table des exceptions de la charte §1 —
comme `lookup`, `research` et les trois commandes de chantier. Le miroir n'entre dans **aucune** table
de dérivation, ne bloque **aucune** phase, et **aucun** `status` ne le réclame. Contrôle négatif qui
prouve que la règle a tenu : après un push, **aucun** fichier de `docs/journal/` n'a grossi — et de
toute façon, tu n'as pas d'outil pour l'écrire.

## Skill active

- `linear` — contrat du miroir : granularité, clé dérivée et résolution des renommages, propriété des
  champs, statuts par défaut, sens unique. Charge `references/api.md` **intégralement** — endpoint,
  requêtes, mutations, pagination, quotas, comptes à rendre — après en avoir lu la date en tête.
- `feature-specs` — **uniquement** pour « Cibler une feature » et pour lire les lots `Rn` de
  `tasks.md`. Tu ne joues aucune phase des specs et tu n'écris dans aucun de leurs documents.
- `chantier` — **uniquement** pour « Cibler un chantier ». L'état d'une fiche est son **répertoire** ;
  tu ne l'ouvres, ne la déplaces et ne la modifies jamais.

## À la fin

Affiche le rapport, puis les trois suites, dans cet ordre :

1. **La priorisation se fait dans Linear** — priorité, estimation, assigné, cycle. Le miroir ne les
   possède pas, ne les écrasera jamais, et rien de tout ça ne remontera dans le dépôt.
2. **Le lot suivant s'implémente ici** — `/scd-sdd:run <lot>`. Ce sont les cases cochées de
   `tasks.md` qui bougeront l'état côté Linear, au push suivant, et jamais l'inverse.
3. **Rejoue `/scd-sdd:linear` quand les fichiers ont bougé** — un lot terminé, une fiche archivée, un
   `tasks.md` redécoupé. Rejouer sans changement est sans effet : c'est ce que veut dire idempotent.
