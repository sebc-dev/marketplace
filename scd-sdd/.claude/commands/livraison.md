---
description: "Phase 4 du socle, terminale : produit DEUX documents dans cet ordre — docs/ci.md puis CLAUDE.md. Dérive les contrôles bloquants du pipeline d'une grille de cinq modes de défaillance (oracle faux, suppression du vérificateur, chaîne d'approvisionnement, building to the test, invariant d'architecture), écrit le workflow de la forge et rend la recette de protection de branche ; puis assemble CLAUDE.md, qui LIT les commandes du projet dans docs/ci.md au lieu de les inventer. Clean-as-you-Code : les seuils portent sur le code nouveau. Assemble le contrat une fois et refuse d'écraser un CLAUDE.md existant."
argument-hint: "(aucun — lit docs/technique.md et docs/adr/)"
allowed-tools:
  - Read
  - Glob
  - Write
  - Edit
  - AskUserQuestion
  - Bash(git remote *)
  - Bash(git rev-parse *)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(date *)
  - Bash(ls *)
---

## Contexte

Tu produis les **deux derniers documents du socle**, dans cet ordre : `docs/ci.md` et le
fichier de workflow de la forge, **puis** `CLAUDE.md`. C'est la phase où le socle cesse
d'être uniquement advisory, et celle qui le referme.

L'ordre n'est pas un confort : `CLAUDE.md` **lit** les commandes du projet dans la table
« Commandes du projet » de `docs/ci.md` au lieu de les inventer. Écrire le contrat avant les
contrôles reviendrait à deviner ce que la phase vient de figer.

Deux menaces justifient la moitié CI, et elles ne se recouvrent pas. Le **code généré est
vulnérable** : un **benchmark d'éditeur** — donc à ne pas surinterpréter — mesure sur plus de
cent modèles que près de la moitié des tâches introduisent une vulnérabilité OWASP détectable ;
et, mesure académique celle-là, un nom de paquet sur cinq n'existe pas — dont 43 % reviennent à
l'identique d'un run à l'autre, ce qui rend le *slopsquatting* praticable. Quelle part de ces
noms est réellement libre à l'enregistrement n'a jamais été mesurée, et ne se cite donc pas :
une phase qui interdit d'inventer une commande ne s'autorise pas une statistique qu'elle ne
peut pas sourcer.

Et **l'agent qui écrit contourne ce qui le contrarie** : réécrire un test plutôt que le faire
passer, abaisser un seuil, sauter un hook, éteindre le typage sur la ligne qui échoue. Ce n'est
pas une crainte de principe. Les system cards de Claude 3.7 et 4.5 rapportent que le modèle
traite les cas de test en **cas particuliers** — il retourne la valeur attendue, ou modifie le
fichier de test — au lieu d'implémenter la solution générale ; le benchmark indépendant
EvilGenie observe un *reward hacking* explicite chez deux des trois agents de production testés.
Ce sont ces mesures qui justifient les gardes, pas un chiffre emprunté.

La seconde menace vise ce plugin en particulier. Le niveau implémentation atteste **de
lui-même** que les tests sont intacts : il lance `git diff` sur les fichiers de test, les
restaure s'ils ont bougé, et retourne `testsUntouched: true`. Le producteur est son propre
vérificateur — exactement ce que le cycle refuse ailleurs. Ce que l'agent affirme de lui-même,
la CI le **vérifie de l'extérieur**.

La moitié contrat, elle, a une contrainte dominante : la **concision**, et elle n'est pas
esthétique. `CLAUDE.md` occupe du contexte à chaque session, sur chaque tâche. Chaque ligne
inutile dilue les règles qui comptent. D'où la règle du pointeur — le contenu reste dans
`docs/`, tu n'écris que le chemin.

Ratio : 40% humain / 60% AI (tu dérives les contrôles des modes de défaillance et tu assembles ;
l'humain arbitre les seuils, ce qui bloque, et les principes du contrat).

## Règles absolues

- **La défense vient de l'extérieur de l'agent.** Un hook local se contourne, et une consigne
  écrite dans `CLAUDE.md` a déjà été ignorée six commits d'affilée. Le backstop est le check
  serveur sous protection de branche ; tout le reste est de la défense en profondeur, et se
  présente comme tel.
- **On dérive un contrôle d'un mode de défaillance, jamais d'un outil disponible.** Un candidat
  qui ne se rattache à aucun des cinq modes ne se pose pas — il coûte de la latence et de la
  maintenance pour un risque qu'on n'a pas nommé. Un mode que rien ne couvre s'écrit dans « Ce
  que ces contrôles ne couvrent pas » : un trou déclaré vaut mieux qu'un contrôle qui *prétend*
  le couvrir.
- **Clean-as-you-Code.** Les seuils portent sur le **code nouveau**. Un seuil de couverture
  globale est un anti-pattern : il échoue indéfiniment sur du legacy et pousse à écrire des
  tests sans valeur — ce qui aggrave le problème d'oracles faux du code généré.
- **Un contrôle bruyant sera désactivé**, et son efficacité théorique tombe alors à zéro. Il
  n'est bloquant que s'il passe les **quatre** facteurs : risque élevé, faux positifs bas,
  latence faible, maintenance déclarative. Trois sur quatre → informatif.
- **Un check qui ne tourne pas sur `pull_request`** n'apparaît jamais dans la liste des status
  checks requis, et bloque la PR indéfiniment une fois exigé.
- **Aucun contrôle sans commande réelle.** Ce qui n'est pas connu est un `[à compléter]`
  explicite, jamais une commande inventée.
- **Le lockfile est committé et l'installation verrouillée** (`npm ci`, jamais `npm install`,
  et l'équivalent ailleurs). Sans version figée, la SCA scanne autre chose que ce qui sera
  installé : elle ne prouve rien.
- **Tu ne poses aucune protection de branche et tu n'installes aucun hook.** Tu rends les
  commandes, l'humain les exécute.
- **Tu n'écrases aucun `CLAUDE.md` existant.** Tu assembles une fois. Un contrat déjà écrit
  porte ce que `premortem socle` y a durci et ce que l'humain y a mis : le ré-assembler le
  détruirait sans rien signaler. L'entretien est `/scd-sdd:revise-contract`, et lui seul — la
  voie de mise à jour a l'air de passer par ici, elle passe par là-bas.
- **Pointer, pas recopier.** Le contenu de `docs/produit.md` et de `docs/technique.md` reste
  dans `docs/`. `CLAUDE.md` mentionne les chemins (`@docs/…`) — recopier garantit la dérive. La
  seule exception est la table des commandes de `docs/ci.md`, recopiée **à l'identique**, un
  caractère près : une variante ici et un contrôle CI vert deviennent deux vérités concurrentes.
- **Test de chaque ligne du contrat** : « sa suppression ferait-elle échouer Claude ? » Sinon,
  coupe. **Cible 60-90 lignes, plafond 200.**
- **Aucune règle de style écrite à la main.** Le style appartient au linter, qui en est la
  source de vérité.
- **Advisory ≠ garanti.** Ne présente jamais la Definition of Done comme une contrainte
  exécutée. Ce qui est réellement exécuté, ce sont les contrôles de `docs/ci.md` sous protection
  de branche : nomme-les comme tels, et rien d'autre.
- **Le problème avant les options.** Avant chaque arbitrage, pose le problème en deux ou trois
  phrases : ce qui est en jeu pour ce projet, et en quoi les options diffèrent vraiment. Chaque
  option décrit sa **conséquence en termes du projet**, jamais en jargon. Une option énoncée sans
  son enjeu ne se choisit pas, elle se subit.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — EARS,
  gate, lot, ADR, invariant, advisory… — reçoit une glose d'**une ligne**, entre parenthèses ou
  entre tirets. Jamais un paragraphe, jamais deux fois, et **plus du tout dès que l'humain
  emploie le terme lui-même** : c'est ce signal-là qui règle le niveau, pas une question.
- **Un ID se cite avec son intitulé** à sa première mention — « FR-003 (export CSV) », jamais
  « FR-003 » nu. La règle vaut pour **tout** identifiant que tu emploies, y compris ceux que le
  projet ou la session viennent de créer et que le plugin ne connaît pas. Un identifiant seul
  n'explique rien à qui ne l'a pas sous les yeux.
- **Tu parles la langue de l'humain**, dans les questions comme dans le rapport.

## Processus

### Premier document — `docs/ci.md` et le workflow

1. **Lis `docs/technique.md`** — prérequis strict. S'il manque, **arrête-toi** et renvoie vers
   `/scd-sdd:technique` : sans écosystème connu, aucun contrôle n'est dérivable, et sans sa
   table d'invariants le mode 5 n'a aucun gisement. Lis aussi `docs/adr/` pour ne contredire
   aucune décision figée, en particulier la stratégie de test.

2. **Charge le template et ses règles** : lis `references/ci.md` du skill `project-docs`.

3. **Détecte la forge** — `git remote get-url origin`. GitHub → nominal. GitLab → équivalent
   annoncé comme best-effort. Aucun remote → mode dégradé, **déclaré en clair** dans
   `docs/ci.md` : la phase produit alors une intention, pas une garantie. Jamais par omission.

4. **Pose la grille des cinq modes, puis dérive.** Les cinq modes — oracle faux · suppression du
   vérificateur · chaîne d'approvisionnement (quatre sous-cas) · *building to the test* ·
   violation d'invariant d'architecture — sont l'ossature, et chaque ligne du tableau que tu
   écriras porte le sien. Dérive d'abord les **cinq contrôles de qualité** de l'écosystème, via
   la table de la référence : build et typage, tests et couverture différentielle, SCA sur
   lockfile, secrets vérifiés, SAST. Pour chacun, note la **commande réelle** et sa **portée**
   (diff ou dépôt entier) — SCA et secrets portent sur le **dépôt entier**, une CVE dans une
   dépendance non touchée reste exploitable et un secret dans un fichier non modifié reste un
   secret. Ces cinq-là sont des **vérificateurs**, pas des détecteurs : ils *sont* ce que le
   mode 2 éteint, et leur vert ne se lit jamais comme une couverture du mode qui les vise.

5. **Ajoute les trois contrôles d'intégrité** — `test-integrity`, `quality-config-guard` et
   `verifier-guard`. Ils ne dépendent pas de l'écosystème : ce sont des `git diff` sur des
   chemins, que tu dérives des conventions de test lues dans `docs/technique.md`. Ils se
   partagent le **mode 2 par chemin** — les tests, la config, les sources — et c'est cette
   répartition qui maintient leur taux de faux positifs bas. `quality-config-guard` reçoit sa
   **soupape** (scope de commit explicite), sans quoi il bloquerait sa propre maintenance.
   `verifier-guard` est limité aux **extensions de source**, tests et documentation exclus :
   sans cette borne il se bloque sur le `docs/ci.md` que tu écris, qui cite ses propres motifs.
   Ces motifs se **dérivent** de l'écosystème via la table de la référence — `—` pour ce que
   l'écosystème n'a pas, `[à compléter]` pour ce qui n'est pas connu.

6. **Charge la soupape du garde — seulement si tu retiens `verifier-guard`.** Le retenir est le
   cas nominal : la référence le classe **bloquant sans réserve**, et le seul cas de
   non-rétention est un dépôt **sans code source** — documentation ou configuration seules, où
   la colonne « extensions de source » n'a rien à désigner. Partout ailleurs il est retenu, et
   ce que l'écosystème ne donne pas s'écrit `[à compléter]`, jamais un job en moins. Sa soupape,
   en revanche, **n'est pas celle de `quality-config-guard`** : ce n'est pas un scope de commit
   (l'agent écrit `chore(types):` aussi facilement qu'il écrit `as any`) mais une **signature
   du commit** vérifiée hors ligne. Lis alors, et alors seulement, `references/ci-signature.md`
   du skill `project-docs` — registre de clés, ordre des deux vérifications, amorçage, et ce
   que le dispositif ne prouve pas. Tu **n'exécutes aucune cryptographie** : tu écris le
   workflow qui la vérifie.

7. **Dérive les trois contrôles de chaîne d'approvisionnement** — le mode 3, dont la SCA ne
   couvre qu'un sous-cas, les **CVE connues**. `workflow-integrity` (actions épinglées à un SHA
   complet, et un audit qui le **vérifie** — un `@v3` réintroduit par copier-coller annule
   l'épinglage sans rien changer de couleur), `dependency-review` sur le diff du lockfile **et**
   du manifeste, et le **cooldown de dépendances**. Le cooldown n'est pas un job : c'est une clé
   du résolveur, elle agit à l'installation, et c'est `quality-config-guard` qui garde son
   abaissement. Son principe est agnostique, sa clé ne l'est pas : là où le gestionnaire de
   paquets ne l'offre pas, `[à compléter]` — jamais un job maison qui rejoue la résolution.

8. **Dérive les invariants d'architecture** — le mode 5, et le **gisement principal** : les
   défauts qui comptent dans du code généré sont des violations de contrat propres au projet,
   qu'aucun outil générique ne connaît. Ton entrée est **double**, et dans cet ordre :

   - la **table des invariants de `docs/technique.md`** — la source, déjà admise et déjà classée
     (classes 1-11), chaque ligne portant sa trace observable et son ADR. Tu ne rejoues pas
     l'admission : tu la **rends exécutable** ;
   - `docs/adr/`, où tu poses la question une fois de plus, pour ce que `technique` n'a pas vu —
     un ADR promu depuis `_candidates/` en porte parfois un. La question est la même :
     *laisse-t-elle une trace observable dans l'arborescence ou dans les imports ?*

   `docs/technique.md` peut retarder sur les ADR : les deux sources se lisent, jamais une seule.
   Chaque invariant retenu est inscrit au **registre des ADR vérifiés** avec son ADR d'origine,
   et reste **informatif** jusqu'à mesure par rejeu sur l'historique — un contrôle maison neuf
   n'a aucun taux de faux positifs connu, et un contrôle bruyant finit désactivé.

   **Charge alors, et alors seulement, la section `## Vérification` de
   `references/technique.md`** du skill `project-docs` : l'inventaire daté de l'outillage par
   écosystème et la borne exacte du script maison. C'est ce qui décide si un invariant admis est
   **rendable** — un invariant qui exige la résolution d'alias, les cycles transitifs ou un
   parseur ne se rend pas à la regex. Tu ne charges rien d'autre de cette référence :
   l'admission appartient à `/scd-sdd:technique`.

9. **Si l'outillage n'est pas décidable de mémoire** — version d'une action, outil de SCA
   courant pour cet écosystème — **propose `/scd-sdd:lookup`** plutôt que d'écrire une version
   que tu supposes. Une version inventée dans un workflow casse au premier run, ou pire : elle
   marche et n'est pas celle qu'on croit.

10. **Charge le skill `exposition`** — **régime *options*** —, puis **fais trancher ce qui n'a
    pas de bonne réponse par défaut** (`AskUserQuestion`, deux ou trois questions, pas plus) :
    le seuil de couverture différentielle ; le SAST bloquant d'emblée sur high-severity ou en
    report-only le temps de mesurer ; les contrôles lents sur le chemin critique ou en exécution
    nocturne. La **fenêtre du cooldown de dépendances**, elle, ne se demande pas : la référence
    en donne une acceptable (24 h à 7 j, les versions compromises étant retirées en quelques
    heures). Retiens-la, écris-la dans `docs/ci.md`, et n'en fais une question que s'il te reste
    une place.

11. **Écris `docs/ci.md`** selon le template, en traçant vers `docs/technique.md`. La section
    **« Ce que ces contrôles ne couvrent pas »** n'est pas optionnelle : la taire ferait croire
    à une garantie qui n'existe pas — et elle se remplit **par mode**, y compris pour les trois
    que rien ne ferme.

12. **Écris le fichier de workflow** — jobs indépendants en parallèle, ordonnés par coût
    croissant, déclenchés sur `pull_request` **et** sur `push` de la branche par défaut. Les
    noms de jobs sont ceux qui deviendront les checks requis : choisis-les une fois, et
    `verifier-guard` ne se renomme plus. Les gardes qui lisent un diff ont besoin de voir la
    base de la PR.

13. **Rends la recette de protection de branche** — la commande prête à coller, avec les checks
    requis nommés **à l'identique**, l'interdiction de force-push et de suppression, et le
    **bypass interdit**. Tu ne l'exécutes pas. Écris son état dans `docs/ci.md` : posée avec sa
    date, ou **À POSER** avec la conséquence — sans elle, tout ce qui précède est informatif.

14. **Rends le bloc de blindage local** — le hook `PreToolUse` qui refuse de sauter les hooks de
    commit, prêt à coller, **avec sa réserve** : c'est de la défense en profondeur, pas le
    backstop, et il ne voit pas un `git` appelé via un script ou un alias.

15. **Ouvre le chantier de durcissement** — `docs/chantiers/en-attente/AAAA-MM-JJ-durcissement-ci.md`,
    portée **`socle`**. Il porte la mesure des faux positifs — par **rejeu sur l'historique du
    dépôt** pour les invariants d'architecture, le volume de PR d'un développeur seul ne
    suffisant pas à estimer un taux en temps réel —, la montée en bloquant de ce qui passe sous
    le seuil, et la réserve qui vaut pour tous les gardes greppables : **réprimer un
    comportement peut le rendre plus subtil plutôt que l'éliminer.** Puis `git add` **scopé à la
    fiche** et `git commit -m "chore(chantier): durcissement ci"` — sans y ajouter autre chose.

16. **Relis contre le bloc `<completion>`** de `references/ci.md`. Le premier document est
    terminé.

### Second document — `CLAUDE.md`

17. **Vérifie que `CLAUDE.md` n'existe pas** (`Glob`). **S'il existe, tu t'arrêtes là** : tu ne
    l'écrases pas, tu n'en assembles pas une seconde version, et tu ne fusionnes rien à la main.
    Signale que `docs/ci.md` vient d'être réécrit, donc que la table des commandes a peut-être
    bougé, et renvoie vers `/scd-sdd:revise-contract` — la seule voie qui resynchronise sans
    ré-assembler. Va directement au journal (étape 22), qui consigne la phase telle qu'elle
    s'est réellement jouée : `docs/ci.md` seul.

18. **Charge le template et ses règles** : lis `references/claude-md.md` du skill
    `project-docs` — **tout sauf le bloc `<revision>`**, qui appartient à
    `/scd-sdd:revise-contract` et ne te concerne pas.

19. **Assemble `CLAUDE.md`** selon le template :
    - **En-tête en commentaires HTML** — le propriétaire, la règle « supprimer plus qu'on
      n'ajoute », les quatre déclencheurs de mise à jour et le renvoi vers
      `/scd-sdd:revise-contract`. Le bloc est retiré avant injection : il ne coûte **rien** en
      contexte, et c'est lui qui donne un propriétaire à l'entretien ;
    - **Vue d'ensemble** (3-5 bullets) et **pointeurs** `@docs/produit.md`,
      `@docs/technique.md`, `docs/adr/` — avec la consigne de ne jamais contredire un ADR
      accepté, ni franchir un **invariant** de `docs/technique.md`. Ce dernier pointeur n'est
      pas décoratif : la dimension `architecture` de la review et les contrôles
      `arch-invariants` de la CI y renvoient tous les deux ;
    - **Commandes** du projet (build, test unitaire, lint/format, run local) : **lues dans la
      table « Commandes du projet » de `docs/ci.md`**, que tu viens d'écrire, et recopiées
      telles quelles. Tu n'interviewes pas et tu n'inventes rien. Une case laissée en
      `[à compléter]` le reste ici, et tu le **signales** : c'est un trou de la moitié CI, pas
      une décision à prendre maintenant. Ajoute le pointeur `docs/ci.md` — le détail des
      contrôles y vit, il ne se recopie pas ;
    - **Conventions** qui diffèrent des défauts du langage, uniquement celles-là ;
    - **Principes non-négociables & seuils** — la constitution fondue ici plutôt que dans un
      fichier séparé ; reprends les seuils de déclenchement du skill `project-docs`, en nommant
      `/scd-sdd:kickoff-feature` comme point d'entrée du niveau specs ;
    - **Definition of Done** vérifiable — et vérifiable **par les contrôles bloquants de
      `docs/ci.md`**, nommés par leur job. Un item de DoD qu'aucun contrôle ne couvre reste
      légitime, mais il est advisory : ne le mélange pas avec ceux qui le sont vraiment ;
    - **Gotchas** — les comportements non-évidents qu'un agent ne peut pas deviner, dont ceux
      que `docs/ci.md` déclare **ne pas** couvrir. C'est le poste où passe l'essentiel des
      tokens du contrat : c'est ce qui ne se déduit d'aucune lecture du dépôt ;
    - **Renvois** — les skills du projet et les `.claude/rules/` path-scopées, en pointeurs et
      jamais inlinés. La section est admise **vide** au premier assemblage : un projet neuf n'a
      ni skill ni rule. Elle existe quand même, parce que c'est là que l'entretien déplacera ce
      qu'il retire — sans elle, il n'aurait nulle part où le mettre.

20. **Relis contre le bloc `<completion>`** de `references/claude-md.md`, puis **fais valider
    l'assemblage** par `AskUserQuestion` avant d'écrire le fichier. Deux sections seulement s'y
    prêtent, parce qu'elles sont les seules que rien du dépôt ne dicte : les **principes
    non-négociables** et la **Definition of Done**. Le reste est dérivé des documents du socle et
    ne se met pas au vote.

    Dis en une phrase ce qui est en jeu — ce fichier est chargé **en entier à chaque session**,
    donc chaque ligne se paie —, et pour chaque principe proposé, ce qu'il changera concrètement
    au travail de l'agent. Ce qui n'est pas retenu ne s'écrit pas : `/scd-sdd:revise-contract`
    pourra l'ajouter plus tard, et retirer coûte plus cher qu'ajouter.

21. **Signale les étapes aval**, hors socle : l'**immutabilité des ADR** en hook, le **blindage
    local** — le bloc est déjà rendu par `docs/ci.md`, section « Blindage local », tu pointes,
    tu ne le recopies pas — et, si `docs/ci.md` porte encore **À POSER** pour la protection de
    branche, le fait de la poser.

22. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu n'exécutes aucune commande de protection de branche, aucun appel d'API de forge, aucun
  push. Tu les rends, l'humain décide.
- Tu n'installes aucun hook et tu ne modifies aucun `settings.json`.
- Tu n'inventes aucune commande de build, test, lint — ni aucune version d'outil ou d'action —
  et tu n'en devines aucune dans `CLAUDE.md` : elles viennent de `docs/ci.md`, ou elles y sont
  un `[à compléter]` que tu reportes tel quel.
- Tu ne fixes aucun seuil de couverture **globale**.
- Tu ne rends bloquant aucun contrôle **maison ou heuristique** dont le taux de faux positifs
  n'est pas mesuré — les invariants d'architecture restent informatifs jusqu'au rejeu, et c'est
  le rôle du chantier de durcissement. La borne qui autorise les gardes d'intégrité à bloquer
  malgré un taux non publié est leur **signal déterministe et greppable**, jamais l'urgence.
- Tu n'écris pas l'outillage de signature de l'humain — c'est le seul endroit du dispositif où
  ton concours est un risque et non une aide, et aucun job de CI ne le voit.
- Tu ne génères aucune clé, tu n'en publies aucune, et tu n'ajoutes aucune entrée au registre :
  la première clé de confiance est posée par l'humain, qui vérifie de ses yeux ce qu'il pousse.
- Tu n'installes aucune dépendance et tu n'exécutes aucun outil de scan pour « voir ».
- **Tu n'écrases aucun `CLAUDE.md` existant** et tu ne le complètes pas non plus : l'entretien
  est `/scd-sdd:revise-contract`, et lui seul (`DECISIONS.md` §D29 — trois écrivains, trois
  rôles).
- Tu ne recopies aucun extrait de `docs/produit.md`, de `docs/technique.md` ni d'un ADR dans
  `CLAUDE.md` — ni la table des contrôles de `docs/ci.md`, dont tu ne prends que les commandes.
  En particulier, la table des invariants ne se recopie pas : elle croîtrait en double.
- Tu ne documentes aucune règle de style, d'indentation ou de formatage.
- Tu ne modifies aucun document du socle déjà produit — ni `docs/produit.md`, ni
  `docs/technique.md`, ni un ADR. Un invariant que tu ne sais pas rendre exécutable se
  **déclare** dans « Ce que ces contrôles ne couvrent pas » ; il ne se reformule pas dans
  `docs/technique.md`.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `livraison`
- **Résultat** : les **deux** documents, dans l'ordre — la forge · nb de contrôles bloquants et
  informatifs · le seuil de couverture · puis nb de principes · taille de la Definition of Done.
  Exemple : `GitHub Actions · 11 bloquants · 4 informatifs · couverture diff 70% · CLAUDE.md ·
  6 principes · DoD 5 items`.

Deux cas se consignent tels quels, parce qu'ils sont des résultats et non des échecs à taire :
une phase jouée en **mode dégradé** — `aucune forge · docs/ci.md seul` —, et un **rejeu** où
`CLAUDE.md` existait déjà — `docs/ci.md seul · contrat existant, renvoi revise-contract`.

## Skill active

- `project-docs` — charge `references/ci.md` (`role` + `template` + `guidance` + `completion`)
  à l'étape 2, et `references/claude-md.md` **tout sauf le bloc `<revision>`** à l'étape 18.
  Plus deux chargements **conditionnels**, chacun à son étape et pas avant :
  `references/ci-signature.md` à l'**étape 6**, seulement si tu retiens `verifier-guard` — un
  projet sans ce garde ne la lit jamais ; et la **seule section `## Vérification`** de
  `references/technique.md` à l'**étape 8**, pour son inventaire d'outillage. Le reste de cette
  référence — template, grille des onze classes, critère d'admission — appartient à
  `/scd-sdd:technique` et ne se charge pas ici.
- `exposition` — **régime *options***, chargé à l'étape 10. Aucune `references/`.
- `chantier` — anatomie de la fiche de durcissement, nommage, `Portée`. Tu **écris** une fiche,
  donc tu charges `references/fiche.md`, blocs **`<interdits>`**, **`<template>`** et
  **`<frontiere>`** — ce dernier parce que tu journalises **par ailleurs** : ce qui reste à faire
  va dans la fiche, ce qui est arrivé va dans la ligne de journal. Tu n'as **pas** besoin de
  `references/manifeste.md` : cette fiche ne porte aucun contexte volumineux.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Affiche d'abord les **noms exacts des jobs** à cocher comme checks requis. C'est ce qui pilote
le geste suivant, et le moment de les corriger est maintenant : un nom qui change plus tard
laisse un check requis fantôme qui bloque toutes les PR.

Rappelle la seule chose qui décide si la moitié CI a servi à quelque chose : **tant que la
protection de branche n'est pas posée, tous ces contrôles sont informatifs** — ils signalent
sans rien bloquer —, et la Definition of Done retombe donc entière dans l'advisory.

Si tu as retenu `verifier-guard`, rappelle aussi le geste humain sans lequel sa soupape ne vaut
rien : **poser le registre de clés et vérifier de ses yeux la clé qu'il contient.** La PR qui
l'installe le fait sans preuve — il n'existe aucune clé de confiance pour signer l'arrivée de la
première —, et ce trou est irréductible : il se surveille, il ne se contourne pas.

Puis la suite, qui **dépend de ce que l'étape 17 a constaté** :

**Cas nominal — `CLAUDE.md` vient d'être assemblé.** Le socle est complet, en **cinq
documents** : Produit, Technique, ADR, CI, `CLAUDE.md`.

Propose les **deux audits** que la phase laisse ouverts, tous deux optionnels : « Pour vérifier
que `docs/ci.md` est complet, que chaque contrôle dérive d'un mode de défaillance et qu'aucun
bloquant ne l'est sans mesure : `/clear`, puis `/scd-sdd:audit ci`. Et pour vérifier que
`CLAUDE.md` est complet, que ses pointeurs résolvent et que sa section Commandes correspond à
`docs/ci.md` : `/clear`, puis `/scd-sdd:audit claude-md`. L'audit confronte le document à une
grille et rend une **liste de travail** — il ne touche jamais au document lui-même, et ce qu'il
remonte sur `CLAUDE.md` se traite par `/scd-sdd:revise-contract` : l'audit détecte, l'entretien
édite, ils ne se remplacent pas. Le `/clear` n'est pas cosmétique : juger ce qu'on vient
d'écrire, c'est relire ses intentions au lieu du texte. Rien ne l'exige. »

Récapitule ensuite les quatre étapes recommandées, dans cet ordre :

1. **Ce qui reste déterministe à poser** — la protection de branche si `docs/ci.md` la porte
   encore **À POSER**, puis le blindage local et le hook d'immutabilité des ADR.
2. **Première feature** — `/clear`, puis `/scd-sdd:kickoff-feature`.
3. **L'entretien du contrat** — `CLAUDE.md` ne s'écrit qu'une fois, mais il dérive. Nomme
   `/scd-sdd:revise-contract` comme la **seule** voie de mise à jour, et les quatre déclencheurs
   qui justifient de la jouer : Claude refait la même erreur une 2ᵉ fois · une revue attrape ce
   qu'il aurait dû savoir · on retape la même correction · un nouveau coéquipier aurait cherché
   ce contexte. Ajoute les **deux cas mécaniques**, qui n'attendent aucun symptôme et appellent
   un retrait plutôt qu'un ajout : **`docs/ci.md` a changé** — la section Commandes en est une
   recopie, et rien ne la rejoue — et le projet a **changé de génération de modèle**, une règle
   utile à l'ancien pouvant nuire au nouveau. Et dis pourquoi cette commande n'est pas cette
   voie : le ré-assemblage écraserait ce que le premortem et l'humain auront ajouté.
4. **Discipline `/clear`** — une phase, un contexte propre.

**Cas du rejeu — `CLAUDE.md` existait déjà.** Seul `docs/ci.md` a été réécrit. Dis-le, et
n'annonce pas un socle complété qui l'était déjà. La table « Commandes du projet » a peut-être
bougé, et la section Commandes de `CLAUDE.md` en est une recopie au caractère près que **rien
ne rejoue** : c'est par là que deux vérités concurrentes s'installent, et c'est cette section
que `/scd-sdd:kickoff-feature` consomme. Donc : « `/clear`, puis `/scd-sdd:revise-contract` pour
resynchroniser CLAUDE.md. » Propose l'audit `ci` s'il a lieu d'être ; ne propose pas
`/scd-sdd:audit claude-md`, dont la liste de travail se traiterait de toute façon par
l'entretien qui vient d'être nommé.
