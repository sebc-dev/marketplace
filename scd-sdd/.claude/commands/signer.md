---
description: "Prépare un commit de bout en bout quand le projet a une soupape par signature : trie l'index, DÉRIVE de docs/ci.md et des workflows réels si la signature humaine est exigée et pourquoi, compose le message aux scopes que les gardes imposent. Commite elle-même un commit ordinaire, sans -S ; pour un commit à signer, laisse index et message prêts et rend la main. Elle n'écrit ni ne lance jamais l'outillage de signature. Pas une phase : rejouable, jamais réclamée par status."
argument-hint: "[chemins, ou en clair ce qui doit partir — sinon le travail de la session]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - AskUserQuestion
  - Bash(git status *)
  - Bash(git diff *)
  - Bash(git add *)
  - Bash(git reset *)
  - Bash(git log *)
  - Bash(git commit *)
---

## Contexte

Tu prépares un commit sur un projet où **la signature d'un commit est le mécanisme d'autorisation
d'au moins un contrôle bloquant** — la soupape de `verifier-guard`, écrite par
`/scd-sdd:guards` quand le garde est retenu (`DECISIONS.md` §D26).

Cette soupape est un **geste humain**, et le plugin n'écrit pas l'outillage qui la produit : c'est
le seul endroit du dispositif où le concours de l'agent est un risque et non une aide. Le cycle
sait donc **poser** la porte, et ne disait jusqu'ici nulle part **quand la pousser**. C'est le trou
que tu combles.

Le mode de défaillance à fermer n'est pas « il manque un motif ». C'est qu'un outil **affirme une
négative sur une liste qu'il ne sait pas incomplète** : sur un projet réel, un script qui
énumérait ses motifs en dur a affiché *« aucune — un commit ordinaire n'a pas besoin d'être
signé »* sur un commit que la CI refusait, parce qu'un garde était né **28 commits après lui**. Un
projet élargit toujours la surface de signature au-delà de la recette du plugin. **Tu dérives, tu
n'énumères jamais.**

Ratio : 30% humain / 70% AI (tu tries, tu décides et tu composes ; l'humain relit le diff que son
outil lui affiche, et tape sa phrase de passe — ou ne la tape pas).

## Règles absolues

- **Tu ne signes jamais.** Ni `git commit -S`, ni `--gpg-sign`, ni `git commit --amend` sur un
  commit signé. Une signature atteste qu'un humain a vu et vouché ; produite par toi, elle
  n'atteste plus rien. Ton `allowed-tools` porte `Bash(git commit *)` parce que tu commites le cas
  ordinaire — l'interdit est ici, pas dans l'outillage, et c'est pourquoi il est écrit.
- **Tu ne touches pas aux clés ni à leur configuration** : jamais `ssh-add`, jamais `~/.ssh`,
  jamais `user.signingkey` / `commit.gpgsign` / `gpg.ssh.*`, ni en lecture ni en écriture.
- **Tu n'écris pas l'outillage de signature, et tu ne le lances pas.** Tu le nommes. Un outil qui
  produit des signatures et que tu pourrais modifier afficherait une chose et en signerait une
  autre ; et le lancer toi-même ferait transiter la phrase de passe par autre chose que le clavier
  de l'humain — il refuse d'ailleurs de tourner hors terminal, et essayer quand même est déjà la
  faute.
- **Sur ignorance, tu suspends — tu ne rassures pas.** Un garde de la CI que tu ne sais pas
  prédire ne te fait pas signer par précaution, et ne se tait pas : il te retire le droit de
  conclure « commit ordinaire ». Fermeture par défaut, comme les contrôles eux-mêmes.
- **Tu ne fais pas signer pour rien.** Aucun motif → tu commites, sans `-S`. Ce qui se signe trop
  souvent ne se relit plus, et la relecture est la seule chose que la signature atteste.
- **Tu ne pousses rien.** Ni `git push`, ni ouverture de PR : tu n'en as pas les outils, et le
  périmètre s'arrête au commit.
- **Le problème avant les options.** Si le tri de l'index est ambigu, pose ce qui est en jeu en
  deux phrases avant de proposer des choix — un index mal composé se signe aussi bien qu'un bon, et
  la signature attesterait alors d'un périmètre que personne n'a voulu.
- **Glose au premier emploi.** Le premier terme de méthode que tu adresses à l'humain — soupape,
  garde, scope, registre de clés, index — reçoit une glose d'**une ligne**. Jamais deux fois, et
  **plus du tout dès que l'humain emploie le terme lui-même**.
- **Un ID se cite avec son intitulé** — un job, un contrôle, un ADR, un ticket `NN` ne descend jamais
  nu dans un message de commit ni dans une question.
- **Tu parles la langue de l'humain.**

## Définitions

**Motif** — la raison pour laquelle *ce* commit doit être signé, nommée par le job qui l'impose.
Un commit sans motif est **ordinaire**.

**Soupape** — ce qui laisse passer le cas légitime sans que l'agent puisse ouvrir la porte
lui-même. Deux formes dans le cycle : un **scope de commit** pour la config qualité, une
**signature** pour `verifier-guard`. Elles ne se remplacent pas — un scope, tu l'écris aussi
facilement que la modification qu'il déclare.

## Processus

1. **Vérifie les préconditions.**
   - `docs/ci.md` **absent** → arrête-toi et renvoie vers `/scd-sdd:guards`. Sans lui, tu
     n'aurais aucune source pour dériver quoi que ce soit, et tu retomberais sur une liste
     devinée.
   - `docs/ci.md` présent mais **aucune soupape par signature** déclarée (ni section
     `## Soupape de verifier-guard`, ni contrôle dont la soupape est une signature) → dis-le et
     arrête-toi : sur ce projet, il n'y a rien à décider. Commiter reste le geste ordinaire de
     l'humain ou du niveau implémentation.

2. **Montre l'état** — `git status --short --untracked-files=all`, puis `git diff --stat`. Un
   fichier non suivi qui devrait partir doit être nommé : il n'entre pas dans un `git add` de
   chemins déjà suivis.

3. **Trie ce qui part.** Par défaut, le travail de la session en cours. `$ARGUMENTS` peut
   restreindre — des chemins, ou une indication en clair que tu traduis en chemins. **En cas
   d'ambiguïté, demande** (`AskUserQuestion`) plutôt que de deviner. Indexe ce qui a été retenu, et
   rien d'autre.

4. **Dérive les motifs — deux sources, croisées.** C'est l'étape qui fait cette commande, et
   l'ordre compte.

   a. **Ce que le projet déclare.** Lis `docs/ci.md` : la table des **Contrôles**, et la section
      `## Soupape de verifier-guard` si elle existe. Tu en tires la liste des contrôles dont la
      soupape est une **signature**, avec leur portée — quels chemins, quels motifs de diff.

   b. **Ce que la CI porte réellement.** Recense les jobs des workflows du dépôt qui vérifient une
      signature. Les trois traces, par ordre de fiabilité : `git verify-commit` (la recette du
      plugin), le **registre de clés** nommé dans `docs/ci.md` (souvent `.github/allowed_signers`),
      ou un script dédié appelé depuis un job. Exemple de sonde, à adapter aux fichiers réels :

      ```bash
      awk '/^  [a-z0-9-]+:$/ { j=$1; sub(/:$/, "", j) }
           /verify-commit|allowed_signers|verify-signed/ { print j }' \
          $(find .github/workflows -maxdepth 1 -name '*.y*ml' 2>/dev/null) /dev/null | sort -u
      ```

      Le `/dev/null` final n'est pas un ornement : sans lui, un dépôt sans workflow ferait lire
      l'entrée standard à `awk`, qui attendrait indéfiniment — la sonde deviendrait muette au lieu
      d'être vide.

   c. **Compare.** Un job trouvé en **b** et absent de **a** est le cas du 2026-08-23 : la CI a un
      garde que la synthèse ne connaît pas. Tu ne devines pas son motif — tu **suspends le verdict**
      (étape 6), tu nommes le job, et tu signales le trou de `docs/ci.md`.

5. **Joue chaque motif retenu sur l'INDEX.** Pour chacun, va lire la logique du job et
   **transpose-la** ; ne la recopie pas. Deux différences de contexte, toujours les mêmes :

   - un job de forge raisonne **commit par commit** sur l'intervalle d'une PR ; toi, tu raisonnes
     sur `git diff --cached`. Une réécriture rétablie plus loin dans la branche t'échappe donc, et
     rougira quand même en PR — dis-le plutôt que de prétendre le couvrir ;
   - la plupart de ces gardes ne s'arment que sur un événement de PR. Tu décides sur ce qui
     **bloquerait en PR**, jamais sur ce que la CI attrape sur un push direct : c'est la discipline
     du dépôt, pas la couverture du jour.

   Quand un job admet une **exception mesurée** — l'état d'une case de tâche libre, alors que le
   texte ne l'est pas —, reproduis la comparaison exacte du job, jamais un `grep` approchant : une
   approximation qui sur-détecte fait signer pour rien, et une qui sous-détecte fait rougir la PR.

6. **Rends le verdict, en clair et avec son motif.** Trois issues, et une seule par passe :
   - **motif trouvé** → nomme-le avec son job : *« le texte des tâches est modifié hors cases —
     job `specs-integrity` »* ;
   - **aucun motif, et la comparaison de l'étape 4c est propre** → `aucun — commit ordinaire` ;
   - **un garde non reconnu** → `VERDICT SUSPENDU`, avec le nom du job. Jamais « commit
     ordinaire » sur une liste que tu sais incomplète.

7. **Compose le message** aux conventions du projet, lues dans `CLAUDE.md`. Deux scopes sont
   **imposés par des contrôles**, pas par le goût, et `docs/ci.md` en porte la portée exacte :
   - la **config qualité** (`quality-config-guard`) → le scope explicite qu'il accepte, ou le
     label déclaré sur la PR ;
   - le **lockfile et les dépendances** (`dependency-review`) → de même.

   Ces gardes jugent **chaque commit**, pas le diff cumulé : un commit ne peut pas porter les deux
   scopes à la fois. Si l'index mêle les deux natures, **scinde** — deux commits — au lieu de
   choisir.

   **Écris le motif de la signature dans le corps du message** quand il y en a un : c'est ce qui le
   met sous les yeux de l'humain à la relecture. Pour `verifier-guard`, ce n'est pas facultatif — le
   job **échoue** si le message d'un commit signé ne nomme pas le vérificateur éteint.

8. **Conclus, selon le verdict.**
   - **Aucun motif** → commite, `git commit -F <fichier de message>`, **sans `-S`**. Affiche le
     `git log -1 --oneline` obtenu.
   - **Motif trouvé, ou verdict suspendu** → n'exécute **aucun** `git commit`. Écris le message
     dans `.git/COMMIT_A_SIGNER` (dans `.git/`, donc jamais versionné), et cherche l'outillage du
     projet par `Glob` — `scripts/*sign*`, `bin/*sign*`. Trouvé → nomme-le dans la ligne de
     passation. Absent → rends la commande `git` nue, en disant que l'outil reste à écrire **par
     l'humain**.

## Ce que tu NE fais PAS

- Tu ne signes aucun commit, et tu ne cherches aucun moyen de le faire faire.
- Tu n'écris, ne modifies ni ne lances l'outillage de signature du projet.
- Tu ne génères aucune clé, ne touches à aucune configuration `git` locale, n'ouvres jamais
  `~/.ssh` — même pour « juste vérifier ».
- Tu n'ajoutes ni ne retires aucune clé du registre : `verifier-guard` exige qu'un commit y
  touchant soit signé par une clé **déjà** de confiance, que tu ne peux pas produire.
- Tu ne corriges pas `docs/ci.md` quand la comparaison de l'étape 4c révèle un trou — tu le
  **signales**, et il se referme en rejouant `/scd-sdd:guards`.
- Tu ne pousses rien, tu n'ouvres aucune PR, tu ne poses aucun label.
- Tu ne commites pas un index que l'humain n'a pas confirmé quand le tri était ambigu.

## Skill active

- **Aucun.** La connaissance dont tu as besoin n'est pas dans le plugin mais dans le `docs/ci.md`
  **du projet** et dans ses workflows — et c'est délibéré : une liste de motifs figée dans le
  plugin dériverait pour tous les projets à la fois (`DECISIONS.md` §D40, écarté n° 2).
- `references/signature.md` **n'est pas chargée** : elle porte la doctrine de la soupape pour
  qui l'**écrit**, à l'étape 7 de `/scd-sdd:guards`. Tu la consommes, tu ne la poses pas.

## À la fin

**Motif trouvé, ou verdict suspendu** — rappelle le motif en une ligne, puis termine par la ligne
de passation, **et rien d'autre** : l'outillage du projet s'il existe, sinon
`git commit -S -F .git/COMMIT_A_SIGNER`. Ajoute, s'il y a lieu, le trou de `docs/ci.md` que
l'étape 4c a révélé et le renvoi vers `/scd-sdd:guards`.

**Commit ordinaire** — affiche le commit créé, et arrête-toi. Rien n'est poussé ; la suite
appartient au niveau où le travail se poursuit.
