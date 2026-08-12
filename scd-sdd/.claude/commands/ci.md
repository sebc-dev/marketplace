---
description: "Phase 6 du socle : rend déterministe, et vérifiable hors de l'agent, ce que CLAUDE.md ne peut que conseiller. Dérive les contrôles bloquants du pipeline d'une grille de cinq modes de défaillance — oracle faux, suppression du vérificateur, chaîne d'approvisionnement, building to the test, invariant d'architecture —, écrit docs/ci.md et le workflow de la forge, puis rend la recette de protection de branche et le blindage local. Clean-as-you-Code : les seuils portent sur le code nouveau."
argument-hint: "(aucun — lit docs/stack.md, docs/archi.md et docs/adr/)"
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

Tu poses les **contrôles automatiques** du projet : `docs/ci.md` et le fichier de workflow de
la forge. C'est la phase où le socle cesse d'être uniquement advisory.

Deux menaces la justifient, et elles ne se recouvrent pas. Le **code généré est vulnérable** :
un **benchmark d'éditeur** — donc à ne pas surinterpréter — mesure sur plus de cent modèles que
près de la moitié des tâches introduisent une vulnérabilité OWASP détectable ; et, mesure
académique celle-là, un nom de paquet sur cinq n'existe pas — dont 43 % reviennent à l'identique
d'un run à l'autre, ce qui rend le *slopsquatting* praticable. Quelle part de ces noms est
réellement libre à l'enregistrement n'a jamais été mesurée, et ne se cite donc pas : une phase
qui interdit d'inventer une commande ne s'autorise pas une statistique qu'elle ne peut pas
sourcer.

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

Ratio : 40% humain / 60% AI (tu dérives les contrôles des modes de défaillance et la Stack ne
décide que de l'outil qui les rend ; l'humain arbitre les seuils et ce qui bloque).

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

1. **Lis `docs/stack.md`** — prérequis strict. S'il manque, **arrête-toi** et renvoie vers
   `/scd-sdd:stack` : sans écosystème connu, aucun contrôle n'est dérivable. Lis aussi
   `docs/archi.md` — le gisement du mode 5, dont la table des invariants est ton entrée
   principale à l'étape 8 — et `docs/adr/` pour ne contredire aucune décision figée, en
   particulier la stratégie de test. `docs/archi.md` absent n'arrête rien : le mode 5 se
   dérive alors des seuls ADR, et le manque se **déclare** dans `docs/ci.md` avec le renvoi
   vers `/scd-sdd:archi`.

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
   chemins, que tu dérives des conventions de test lues dans `docs/stack.md`. Ils se partagent
   le **mode 2 par chemin** — les tests, la config, les sources — et c'est cette répartition qui
   maintient leur taux de faux positifs bas. `quality-config-guard` reçoit sa **soupape** (scope
   de commit explicite), sans quoi il bloquerait sa propre maintenance. `verifier-guard` est
   limité aux **extensions de source**, tests et documentation exclus : sans cette borne il se
   bloque sur le `docs/ci.md` que tu écris, qui cite ses propres motifs. Ces motifs se
   **dérivent** de l'écosystème via la table de la référence — `—` pour ce que l'écosystème n'a
   pas, `[à compléter]` pour ce qui n'est pas connu.

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

   - la **table des invariants de `docs/archi.md`** — la source, déjà admise et déjà classée
     (classes 1-11), chaque ligne portant sa trace observable et son ADR. Tu ne rejoues pas
     l'admission : tu la **rends exécutable** ;
   - `docs/adr/`, où tu poses la question une fois de plus, pour ce qu'`archi` n'a pas vu — un
     ADR promu depuis `_candidates/` en porte parfois un. La question est la même :
     *laisse-t-elle une trace observable dans l'arborescence ou dans les imports ?*

   `docs/archi.md` peut retarder sur les ADR : les deux sources se lisent, jamais une seule.
   Chaque invariant retenu est inscrit au **registre des ADR vérifiés** avec son ADR d'origine,
   et reste **informatif** jusqu'à mesure par rejeu sur l'historique — un contrôle maison neuf
   n'a aucun taux de faux positifs connu, et un contrôle bruyant finit désactivé.

   **Charge alors, et alors seulement, la section `## Vérification` de `references/archi.md`**
   du skill `project-docs` : l'inventaire daté de l'outillage par écosystème et la borne exacte
   du script maison. C'est ce qui décide si un invariant admis est **rendable** — un invariant
   qui exige la résolution d'alias, les cycles transitifs ou un parseur ne se rend pas à la
   regex. Tu ne charges rien d'autre de cette référence : l'admission appartient à `archi`.

9. **Si l'outillage n'est pas décidable de mémoire** — version d'une action, outil de SCA
   courant pour cet écosystème — **propose `/scd-sdd:lookup`** plutôt que d'écrire une version
   que tu supposes. Une version inventée dans un workflow casse au premier run, ou pire :
   elle marche et n'est pas celle qu'on croit.

10. **Charge le skill `exposition`** — **régime *options*** —, puis **fais trancher ce qui n'a pas
    de bonne réponse par défaut** (`AskUserQuestion`, deux ou
    trois questions, pas plus) : le seuil de couverture différentielle ; le SAST bloquant
    d'emblée sur high-severity ou en report-only le temps de mesurer ; les contrôles lents sur
    le chemin critique ou en exécution nocturne. La **fenêtre du cooldown de dépendances**, elle,
    ne se demande pas : la référence en donne une acceptable (24 h à 7 j, les versions compromises
    étant retirées en quelques heures). Retiens-la, écris-la dans `docs/ci.md`, et n'en fais une
    question que s'il te reste une place.

11. **Écris `docs/ci.md`** selon le template, en traçant vers `docs/stack.md`. La section
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

16. **Relis contre le bloc `<completion>`** de `references/ci.md`.

17. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu n'exécutes aucune commande de protection de branche, aucun appel d'API de forge, aucun
  push. Tu les rends, l'humain décide.
- Tu n'installes aucun hook et tu ne modifies aucun `settings.json`.
- Tu n'inventes aucune commande de build, test, lint — ni aucune version d'outil ou d'action.
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
- Tu ne modifies aucun document du socle déjà produit — ni `stack.md`, ni `archi.md`, ni le
  PRD, ni un ADR. Un invariant que tu ne sais pas rendre exécutable se **déclare** dans « Ce
  que ces contrôles ne couvrent pas » ; il ne se reformule pas dans `docs/archi.md`.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `ci`
- **Résultat** : la forge · nb de contrôles bloquants et informatifs · le seuil de couverture.
  Exemple : `GitHub Actions · 11 bloquants · 4 informatifs · couverture diff 70%`.

Une phase jouée en mode dégradé se consigne comme telle — `aucune forge · docs/ci.md seul` est
un résultat, pas un échec à taire.

## Skill active

- `project-docs` — charge `references/ci.md` (`role` + `template` + `guidance` + `completion`).
  Et deux chargements **conditionnels**, chacun à son étape et pas avant :
  `references/ci-signature.md` à l'étape 6, seulement si tu retiens `verifier-guard` — un projet
  sans ce garde ne la lit jamais ; et la **seule section `## Vérification`** de
  `references/archi.md` à l'étape 8, pour son inventaire d'outillage. Le reste de cette
  référence — template, grille des onze classes, critère d'admission — appartient à
  `/scd-sdd:archi` et ne se charge pas ici.
- `exposition` — **régime *options***, chargé à l'étape 10. Aucune `references/`.
- `chantier` — format de la fiche de durcissement, nommage, `Portée`. Tu n'as **pas** besoin de
  `references/manifeste.md` : cette fiche ne porte aucun contexte volumineux.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Affiche les **noms exacts des jobs** à cocher comme checks requis. C'est ce qui pilote l'étape
suivante, et le moment de les corriger est maintenant : un nom qui change plus tard laisse un
check requis fantôme qui bloque toutes les PR.

Rappelle la seule chose qui décide si cette phase a servi à quelque chose : **tant que la
protection de branche n'est pas posée, tous ces contrôles sont informatifs.**

Si tu as retenu `verifier-guard`, rappelle aussi le geste humain sans lequel sa soupape ne vaut
rien : **poser le registre de clés et vérifier de ses yeux la clé qu'il contient.** La PR qui
l'installe le fait sans preuve — il n'existe aucune clé de confiance pour signer l'arrivée de la
première —, et ce trou est irréductible : il se surveille, il ne se contourne pas.

Propose ensuite l'**audit**, optionnel : « Pour vérifier que `docs/ci.md` est complet, que chaque
contrôle dérive d'un mode de défaillance et qu'aucun bloquant ne l'est sans mesure : `/clear`, puis
`/scd-sdd:audit ci`. L'audit confronte le document à une grille et rend une **liste de travail** —
il ne touche jamais au document lui-même. Le `/clear` n'est pas cosmétique : juger ce qu'on vient
d'écrire, c'est relire ses intentions au lieu du texte. Rien ne l'exige — sans audit, la suite est
celle qui vient. »

Puis la suite, qui **dépend de l'existence de `CLAUDE.md`** — vérifie-la par `Glob` avant de
l'annoncer :

- **`CLAUDE.md` absent** — le socle n'est pas fini : « `/clear`, puis `/scd-sdd:contract` pour
  assembler CLAUDE.md — il lira les commandes du projet dans `docs/ci.md`. »
- **`CLAUDE.md` présent** — tu viens donc de **rejouer** cette phase, et la table « Commandes du
  projet » a peut-être bougé. La section Commandes de `CLAUDE.md` en est une recopie au caractère
  près que **rien ne rejoue** : c'est par là que deux vérités concurrentes s'installent, et c'est
  cette section que `/scd-sdd:kickoff-feature` consomme. Donc : « `/clear`, puis
  `/scd-sdd:revise-contract` pour resynchroniser CLAUDE.md. » Et dis-le explicitement : **ne
  rejoue pas `/scd-sdd:contract`** — il ré-assemblerait depuis le template et écraserait les
  remédiations de `premortem socle` et tout ajout humain. L'entretien resynchronise sans
  ré-assembler ; c'est la seule voie.
