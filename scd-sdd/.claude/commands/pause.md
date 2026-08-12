---
description: "Pose ou actualise un chantier avant un /clear en cours de tâche : écrit docs/chantiers/en-cours/AAAA-MM-JJ-slug.md — l'objectif, le contexte à recharger sous forme de références classées, l'acquis, la prochaine étape, les pistes écartées — puis le commite. Dans le cycle comme hors cycle. Pas pour le /clear entre deux phases : là, rien n'est perdu."
argument-hint: "[titre du chantier — optionnel, déduit de la session]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - AskUserQuestion
  - Bash(wc *)
  - Bash(git rev-parse *)
  - Bash(git status --porcelain)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(date *)
---

## Contexte

Une tâche longue est parfois plus efficace découpée par des `/clear`. Ce qui est sur disque
survit ; ce qui n'y est pas — l'objectif, la décision prise, l'étape suivante, les pistes déjà
écartées — est perdu, et la reprise le rachète au prix fort.

Tu écris une **fiche de chantier** qui rend la reprise bon marché. Tu n'écris pas un état du
projet : tu consignes ce qui a été **établi** et **décidé** à cette date, et **où retrouver** le
reste.

**Ce n'est pas pour le `/clear` entre deux phases du cycle** — là, rien n'est perdu, l'artefact
est sur disque et la commande suivante le dérive. C'est pour le `/clear` *à l'intérieur* d'une
phase, ou *hors* du cycle.

Ratio : 40% humain / 60% AI (tu composes depuis la session ; l'humain valide avant écriture).

## Règles absolues

- **Aucun fait dérivable dans la fiche.** Pas d'état de lot, pas de résultat de tests, pas de
  verdict de gate, pas de pourcentage d'avancement, pas de numéro de PR présenté comme un état.
  C'est ce qui empêche une fiche d'être démentie par les fichiers.
- **Tu fais valider la fiche à l'humain avant de l'écrire.** Tu es la seule commande dont le
  contenu est **inféré de la session**, donc la seule qui peut se tromper de récit.
- **Tu écris au passé d'intention** — « j'allais », « j'ai décidé », « j'ai écarté ». Jamais
  l'indicatif présent sur le projet, jamais une liste de todos.
- **Une invocation, une fiche.** Tu ne touches jamais à une autre.
- **Tu commites la fiche**, dans un commit isolé dont le `git add` est **scopé au fichier** — sans
  quoi `/scd-sdd:run` tombera en `blocked-dirty-tree`. Tu ne commites **jamais** le code en vol.
- **Tu n'écris aucun contenu de document et tu ne joues aucune phase.** Pas de `spec.md`, pas de
  `tasks.md`, pas de ligne de journal.
- **Plafond ~50 lignes.** Au-delà, ce n'est plus un chantier mais une feature : dis-le et renvoie
  vers `/scd-sdd:kickoff-feature`.
- **Le problème avant les options.** Avant de faire valider ou de faire trancher, dis en deux ou
  trois phrases ce qui est en jeu : ce que la fiche va porter, et ce qu'elle ne portera pas. Chaque
  option décrit sa **conséquence concrète** — ce qui sera écrit, commité, ou perdu au `/clear` —,
  jamais en jargon. Une option énoncée sans son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain —
  chantier, portée, ancre, manifeste, fraîcheur, consommé… — reçoit une glose d'**une ligne**,
  entre parenthèses ou entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout
  dès que l'humain emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une
  question.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Définitions

- **Chantier** : une unité de travail hors des phases du cycle, ou interrompue en vol. Un fichier,
  un état porté par son répertoire. Contrat : skill `chantier`.
- **Manifeste de contexte** : le `## Contexte à charger` de la fiche. Des **références** classées
  (`à lire`, `à extraire`, `à déléguer`, `à situer`), jamais du contenu recopié. Règles complètes :
  `chantier/references/manifeste.md`.

## Processus

1. **Résous la cible** selon la section « Cibler un chantier » du skill `chantier` — référencée,
   jamais recopiée. Une fiche de `en-cours/` correspond déjà à ce travail → tu l'**actualises** ;
   sinon tu en ouvres une neuve. **Annonce ce que tu retiens**, ne devine pas.

2. **Résous la portée.** Le travail touche `specs/NNN-slug/` ou son code → `NNN-slug`, plus
   `· lot Rn` si un lot est en jeu ; il touche le socle → `socle` ; sinon → `hors-cycle`. Ambigu →
   `AskUserQuestion`.

3. **Prends l'ancre** : `git rev-parse --abbrev-ref HEAD` et `git rev-parse --short HEAD`, plus la
   date du jour. Le champ `branche` sert **d'ancre de fraîcheur et de clé de sélection par
   worktree** — ne l'omets jamais.

4. **Charge `references/fiche.md`** du skill `chantier` — **intégralement**, c'est elle qui porte le
   template et les interdits — puis **compose les rubriques** depuis la session, sous l'interdiction
   de contenu ci-dessus : `## Objectif`, `## Contexte à charger`, `## Acquis`,
   `## Prochaine étape`, `## Écarté`.

5. **Contrôle le manifeste**, selon `references/manifeste.md` du skill `chantier` — blocs
   **`<regle_maitresse>`**, **`<classes>`** et **`<controles>`**, et **eux seuls** : `<lecture>` et
   `<delegation>` décrivent ce que `resume` fera au retour, tu n'en as pas besoin pour écrire.
   - avant tout, applique la **règle maîtresse** — ce qui est une *conclusion* va dans `## Acquis`,
     pas en référence ;
   - `wc -l` sur chaque cible existante. **Chemin nu au-delà de ~300 lignes → refusé** : exige une
     ancre (`à extraire`), une question (`à déléguer`), ou un déclassement (`à situer`) ;
   - somme les cibles `à lire`. Au-delà de ~400 lignes, **annonce le coût** et propose de réduire —
     puis écris quand même si l'humain passe outre ;
   - une cible introuvable est **retirée** et signalée, jamais conservée au cas où.

6. **Contrôle le plafond** de ~50 lignes, et l'arbre de travail (`git status --porcelain`). Du
   travail non commité substantiel → **dis-le** et propose un commit WIP *avant* la fiche : un
   demi-diff se porte infiniment mieux dans un commit que dans une fiche.

7. **Affiche la fiche en entier et fais-la valider** (`AskUserQuestion`). C'est le seul garde-fou
   contre une fiche fabriquée. **Dis en une phrase ce que tu demandes de vérifier** — le contenu
   est inféré de la session, donc c'est le récit, pas l'orthographe, qui est en jeu — et ce que
   chaque réponse entraîne : valider écrit le fichier et le commite ; refuser n'écrit **rien**,
   définitivement, et le contexte de cette session est perdu au `/clear`.

8. **Écris**, puis `git add <la fiche>` et `git commit`. Message :
   `chore(chantier): <titre>` — ou `chore(chantier): actualise <titre>`.

<report>
```
⏸ Chantier posé — « Verrouillage du compte après 5 échecs »
   docs/chantiers/en-cours/2026-08-04-verrou-compte.md · portée 001-auth · lot R2
   branche impl/auth-R2 · a1b2c3d · commit 4f2e1a0

   À recharger au retour : 2 fichiers à lire (118 l.) · 1 extrait ciblé · 1 question déléguée
                           · 2 repères signalés, non rechargés
   Prochaine étape : écrire le test rouge `locks_after_fifth_failure`

→ /clear maintenant. Au retour : /scd-sdd:resume
```

La ligne `À recharger au retour` **dit ce que chaque classe fera**, elle ne récite pas les
étiquettes de la fiche : `à lire` → « à lire », `à extraire` → « extrait ciblé », `à déléguer` →
« question déléguée », `à situer` → « signalés, non rechargés ». C'est le seul endroit où ces
quatre classes atteignent l'humain, et `/scd-sdd:resume` rend le même compte au retour.
</report>

## Ce que tu NE fais PAS

- Tu ne fais pas le travail, tu le consignes.
- Tu ne commites ni ne pousses le code en vol ; tu ne crées ni ne changes aucune branche.
- Tu ne recopies aucun contenu de fichier dans la fiche — que des références.
- Tu n'écris aucune ligne de journal : la fiche **est** le fait.
- Tu ne déplaces aucune fiche entre répertoires — c'est `/scd-sdd:resume` qui change l'état.
- Tu ne consignes pas une décision **structurante** : elle va dans `docs/adr/_candidates/`. Ni un
  changement de comportement : il va dans `spec.md`.
- Tu ne promets pas que la reprise sera automatique. Elle sera **moins chère**, jamais gratuite.

## Consigne au journal

**Aucune.** Tu ne joues aucune phase du cycle, et le fait que tu produis est la **fiche
elle-même** — l'écrire aussi au journal mettrait la même information à deux endroits et ferait
recroître un fichier partagé. C'est de nature, pas un oubli.

Le lien du chantier avec une feature passe par son champ `Portée`, que `/scd-sdd:status` greppe.

## Skill active

- `chantier` — contrat de `docs/chantiers/` : états, § « Cibler un chantier », contrôle de
  fraîcheur. Tu **écris** une fiche, donc tu charges ses deux références, **bloc par bloc** :
  `references/fiche.md` **intégralement** (le *pourquoi*, les interdits, le template et le commit),
  et `references/manifeste.md` blocs **`<regle_maitresse>`** `<classes>` `<controles>` — **pas**
  `<lecture>` ni `<delegation>`, qui appartiennent à `resume`.
- `feature-specs` — section « Cibler une feature », uniquement pour résoudre la portée quand le
  travail touche une feature.

## À la fin

Rappelle le chemin de la fiche et sa prochaine étape, puis :
« `/clear` maintenant ; au retour, `/scd-sdd:resume` — il contrôlera la fraîcheur et rechargera le
contexte. »
