---
description: "Phase 5 du socle : rend déterministe, et vérifiable hors de l'agent, ce que CLAUDE.md ne peut que conseiller. Dérive de la Stack les contrôles bloquants du pipeline — qualité du code et intégrité des tests —, écrit docs/ci.md et le workflow de la forge, puis rend la recette de protection de branche et le blindage local. Clean-as-you-Code : les seuils portent sur le code nouveau."
argument-hint: "(aucun — lit docs/stack.md)"
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
mesuré sur plus de cent modèles, près de la moitié des tâches introduisent une vulnérabilité
OWASP détectable, et un nom de paquet sur cinq n'existe pas — un tiers peut l'enregistrer pour
y livrer du code malveillant. Et **l'agent qui écrit contourne ce qui le contrarie** : réécrire
un test plutôt que le faire passer, abaisser un seuil, sauter un hook.

La seconde menace vise ce plugin en particulier. Le niveau implémentation atteste **de
lui-même** que les tests sont intacts : il lance `git diff` sur les fichiers de test, les
restaure s'ils ont bougé, et retourne `testsUntouched: true`. Le producteur est son propre
vérificateur — exactement ce que le cycle refuse ailleurs. Ce que l'agent affirme de lui-même,
la CI le **vérifie de l'extérieur**.

Ratio : 40% humain / 60% AI (tu dérives les contrôles de la stack, l'humain arbitre les seuils
et ce qui bloque).

## Règles absolues

- **La défense vient de l'extérieur de l'agent.** Un hook local se contourne, et une consigne
  écrite dans `CLAUDE.md` a déjà été ignorée six commits d'affilée. Le backstop est le check
  serveur sous protection de branche ; tout le reste est de la défense en profondeur, et se
  présente comme tel.
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

## Processus

1. **Lis `docs/stack.md`** — prérequis strict. S'il manque, **arrête-toi** et renvoie vers
   `/scd-sdd:stack` : sans écosystème connu, aucun contrôle n'est dérivable. Lis aussi
   `docs/adr/` pour ne contredire aucune décision figée, en particulier la stratégie de test.

2. **Charge le template et ses règles** : lis `references/ci.md` du skill `project-docs`.

3. **Détecte la forge** — `git remote get-url origin`. GitHub → nominal. GitLab → équivalent
   annoncé comme best-effort. Aucun remote → mode dégradé, **déclaré en clair** dans
   `docs/ci.md` : la phase produit alors une intention, pas une garantie. Jamais par omission.

4. **Dérive les cinq contrôles de qualité** de l'écosystème, via la table de la référence :
   build et typage, tests et couverture différentielle, SCA sur lockfile, secrets vérifiés,
   SAST. Pour chacun, note la **commande réelle**, sa **portée** (diff ou dépôt entier) et le
   mode de défaillance couvert. SCA et secrets portent sur le **dépôt entier** — une CVE dans
   une dépendance non touchée reste exploitable, un secret dans un fichier non modifié reste
   un secret.

5. **Ajoute les deux contrôles d'intégrité** — `test-integrity` et `quality-config-guard`. Ils
   ne dépendent pas de l'écosystème : ce sont des `git diff` sur des chemins, que tu dérives
   des conventions de test lues dans `docs/stack.md`. `quality-config-guard` reçoit sa
   **soupape** (scope de commit explicite), sans quoi il bloquerait sa propre maintenance.

6. **Si l'outillage n'est pas décidable de mémoire** — version d'une action, outil de SCA
   courant pour cet écosystème — **propose `/scd-sdd:lookup`** plutôt que d'écrire une version
   que tu supposes. Une version inventée dans un workflow casse au premier run, ou pire :
   elle marche et n'est pas celle qu'on croit.

7. **Fais trancher ce qui n'a pas de bonne réponse par défaut** (`AskUserQuestion`, deux ou
   trois questions, pas plus) : le seuil de couverture différentielle ; le SAST bloquant
   d'emblée sur high-severity ou en report-only le temps de mesurer ; les contrôles lents sur
   le chemin critique ou en exécution nocturne.

8. **Écris `docs/ci.md`** selon le template, en traçant vers `docs/stack.md`. La section
   **« Ce que ces contrôles ne couvrent pas »** n'est pas optionnelle : la taire ferait croire
   à une garantie qui n'existe pas.

9. **Écris le fichier de workflow** — jobs indépendants en parallèle, ordonnés par coût
   croissant, déclenchés sur `pull_request` **et** sur `push` de la branche par défaut. Les
   noms de jobs sont ceux qui deviendront les checks requis : choisis-les une fois.

10. **Rends la recette de protection de branche** — la commande prête à coller, avec les checks
    requis nommés **à l'identique**, l'interdiction de force-push et de suppression, et le
    **bypass interdit**. Tu ne l'exécutes pas. Écris son état dans `docs/ci.md` : posée avec sa
    date, ou **À POSER** avec la conséquence — sans elle, tout ce qui précède est informatif.

11. **Rends le bloc de blindage local** — le hook `PreToolUse` qui refuse de sauter les hooks de
    commit, prêt à coller, **avec sa réserve** : c'est de la défense en profondeur, pas le
    backstop, et il ne voit pas un `git` appelé via un script ou un alias.

12. **Ouvre le chantier de durcissement** — `docs/chantiers/en-attente/AAAA-MM-JJ-durcissement-ci.md`,
    portée **`socle`**. Il porte le travail de mesure des faux positifs sur ~30 jours et la
    montée en bloquant de ce qui passe le seuil. Puis `git add` **scopé à la fiche** et
    `git commit -m "chore(chantier): durcissement ci"` — sans y ajouter autre chose.

13. **Relis contre le bloc `<completion>`** de `references/ci.md`.

14. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Tu n'exécutes aucune commande de protection de branche, aucun appel d'API de forge, aucun
  push. Tu les rends, l'humain décide.
- Tu n'installes aucun hook et tu ne modifies aucun `settings.json`.
- Tu n'inventes aucune commande de build, test, lint — ni aucune version d'outil ou d'action.
- Tu ne fixes aucun seuil de couverture **globale**.
- Tu ne rends bloquant aucun contrôle dont le taux de faux positifs est inconnu : c'est le rôle
  du chantier de durcissement.
- Tu n'installes aucune dépendance et tu n'exécutes aucun outil de scan pour « voir ».
- Tu ne modifies aucun document du socle déjà produit — ni `stack.md`, ni le PRD, ni un ADR.

## Consigne au journal

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/socle.md`,
par `Edit` ciblé (crée le fichier s'il manque) :

- **Phase** : `ci`
- **Résultat** : la forge · nb de contrôles bloquants et informatifs · le seuil de couverture.
  Exemple : `GitHub Actions · 7 bloquants · 4 informatifs · couverture diff 70%`.

Une phase jouée en mode dégradé se consigne comme telle — `aucune forge · docs/ci.md seul` est
un résultat, pas un échec à taire.

## Skill active

- `project-docs` — charge `references/ci.md` (`role` + `template` + `guidance` + `completion`).
- `chantier` — format de la fiche de durcissement, nommage, `Portée`. Tu n'as **pas** besoin de
  `references/manifeste.md` : cette fiche ne porte aucun contexte volumineux.
- `journal` — contrat de `docs/journal/*.md`.

## À la fin

Affiche les **noms exacts des jobs** à cocher comme checks requis. C'est ce qui pilote l'étape
suivante, et le moment de les corriger est maintenant : un nom qui change plus tard laisse un
check requis fantôme qui bloque toutes les PR.

Rappelle la seule chose qui décide si cette phase a servi à quelque chose : **tant que la
protection de branche n'est pas posée, tous ces contrôles sont informatifs.**

Puis : « `/clear`, puis `/scd-sdd:contract` pour assembler CLAUDE.md — il lira les commandes du
projet dans `docs/ci.md`. »
