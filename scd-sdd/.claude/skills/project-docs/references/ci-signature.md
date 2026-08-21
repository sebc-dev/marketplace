# Référence — La soupape de `verifier-guard` (signature du commit)

<role>
Elle répond à **une seule question** : comment un garde qui vise l'agent laisse passer le cas
légitime sans que l'agent puisse ouvrir la porte lui-même. Pourquoi la soupape de
`quality-config-guard` ne convient pas ici : `references/ci.md`, § `verifier-guard`. C'est cette
différence, et elle seule, qui justifie d'introduire de la cryptographie pour **ce** garde et
**nulle part ailleurs** dans le cycle.

**Où cette référence se charge — un seul point, et il est conditionnel :**

par `/scd-sdd:livraison`, à son **étape 6** et alors seulement, quand le garde `verifier-guard` est
retenu.
Un projet qui ne pose pas le garde ne la lit jamais — c'est le motif pour lequel elle vit dans un
fichier séparé (`DECISIONS.md` §D20, §D26). L'agent `audit-explorer` ne la charge **pas** : ce n'est
pas un document du socle, mais un dispositif, et l'audit juge `docs/ci.md` contre le `<template>` de
`references/ci.md`.

⚠️ `references/ci.md` est **toujours déjà chargée** quand celle-ci l'est — l'étape 2 de la commande
précède l'étape 6. C'est ce qui autorise les renvois vers elle ci-dessous : ils résolvent dans la
fenêtre, ils ne renvoient pas vers un fichier absent.

**Cette phase n'exécute aucune cryptographie.** Elle écrit le workflow qui vérifie une signature,
comme elle rend la commande de protection de branche sans la jouer. Elle ne génère aucune clé,
n'écrit pas l'outillage de signature de l'humain, et ne touche à aucune configuration `git`
locale. La recette est ici ; la surface d'échec est chez le projet.
</role>

<template>
```markdown
## Soupape de `verifier-guard` — signature du commit
Registre de clés : `[chemin versionné — ex. .github/allowed_signers]`
État : **[amorcé le AAAA-MM-JJ | À AMORCER — sans registre, aucun neutralisant n'est accepté]**
Vérification : **hors ligne**, dans le job `verifier-guard` · aucune action tierce, `git` suffit
Base du diff : point de divergence avec `[branche par défaut]` · le job exige `fetch-depth: 0`

Ordre des deux contrôles, et il n'est pas interchangeable :
1. **le registre** — tout commit du diff qui touche le registre est signé par une clé qui y
   figurait **à la base** ;
2. **le code** — tout commit qui ajoute un motif neutralisant dans un fichier de source est signé
   par une clé du registre **courant**, et son message de commit porte le motif, non vide.

Fermeture par défaut — chacun de ces cas est un **refus**, jamais un avertissement :
registre absent **de l'arbre courant alors qu'un motif est ajouté** · base indéterminable ·
signature autre que « bonne » · contrôle 1 en échec.

### Ce que la soupape ne prouve pas
- La CI lit un **type de clé**. Elle ne distingue pas une clé à passphrase jamais chargée dans
  l'agent SSH d'une clé nue : la propriété réelle — « la clé n'entre jamais dans l'agent » — est
  une discipline d'**environnement**, pas un mécanisme, et aucun job ne la vérifie.
- Le fichier de clé reste lisible par tout processus de l'utilisateur, donc **exfiltrable**.
- L'**outillage de signature n'est pas écrit par l'agent** : c'est le seul endroit du dispositif
  où son concours est un risque, et aucun job de CI ne le voit.
- **En local, l'attribution n'est pas vérifiable** — une signature n'existe pas avant le commit.
  Le vert local signifie *couvert*, jamais *approuvé*.
- Le dispositif ferme l'IA qui évade ; il ne ferme pas l'accès aux identifiants du poste.
```
</template>

<guidance>

## Le modèle de menace — trois niveaux, et on ne vend jamais l'un pour l'autre

| Niveau | Ce que l'adversaire peut faire | Ce qui l'arrête |
|---|---|---|
| **N1** — une IA qui se trompe | écrit du code non conforme, de bonne foi | n'importe quel check déterministe |
| **N2** — une IA qui évade (injection de prompt, instruction adverse dans une donnée lue) | écrit **tout** le dépôt : le code, les gardes, les workflows, les tests, et sa propre attestation | **seulement** une preuve qu'elle ne peut pas fabriquer avec l'écriture du dépôt |
| **N3** — un accès aux identifiants du poste | tout N2, plus les jetons et les clés lisibles par l'utilisateur | rien de ce qui vit sur ce poste |

**Ce dispositif ferme N2. Il ne ferme pas N3, et ça s'écrit dans `docs/ci.md`.** Présenter une
parade N2 comme si elle couvrait N3 est exactement le vert trompeur que la phase existe pour
supprimer.

L'invariant dont tout le reste découle, à retenir mot pour mot :

> **Une attestation produite par l'agent n'est pas une preuve sur l'agent.** Tant que la trace
> d'une gate vit dans l'espace que l'agent peut écrire, elle atteste qu'un état a été déclaré
> approuvé — jamais **par qui**.

La propriété visée, elle, survit au mécanisme : **le seul accès en écriture au dépôt ne suffit pas
à produire une approbation valide.**

## Le registre de clés — dans le dépôt, auto-référence fermée

Le registre est un **fichier versionné** du dépôt : une clé publique par ligne autorisée à ouvrir
le garde. Format `allowed_signers` d'OpenSSH, celui que `git` sait consommer :

```
nom@exemple.org ssh-ed25519 AAAAC3Nza...
```

Il vit dans le dépôt, et non hors de lui, pour une raison qui décide de tout : la vérification est
**hors ligne**. Aucune requête réseau ⇒ aucun service à interroger, aucun réglage de forge à
relire ⇒ l'attribution est appliquée par le **check requis lui-même**. Un réglage de forge, lui,
n'est relu par aucun check : sa désactivation ne fait échouer personne.

**L'auto-référence se ferme dans les deux sens, et c'est l'erreur que tout le monde commet une
fois.** Le registre **exige** une signature par une clé qui y figurait **avant le diff** — sans
quoi l'agent s'y ajoute et signe ce qu'il veut, et le mécanisme entier ne vaut rien. Le motif
greppable, lui, n'exige rien pour lui-même : il **est** son propre contenu, il entre dans un diff
quand on l'ajoute et en sort quand on le retire. C'est pourquoi la soupape n'a besoin d'aucun
artefact d'approbation séparé, ni d'empreinte de contenu : tout motif neuf vit dans un commit, ce
commit doit être signé, et le déplacer ou le recomposer invalide la signature. *Approuver tôt,
pousser après* est fermé **par construction**.

Ce que l'empreinte apportait en plus se récupère par une exigence simple : le **message du commit
signé porte le motif**, non vide. La revue est une lecture, pas une case.

## L'ordre des deux vérifications — il n'est pas un détail d'implémentation

Les deux contrôles n'utilisent **pas le même fichier de référence**, et le second ne vaut rien si
le premier n'a pas tourné avant :

| | Ce qu'il protège | Registre de référence | Sur quoi il porte |
|---|---|---|---|
| **1** | le registre | sa version **à la base** du diff | **chaque commit** du range qui touche le registre |
| **2** | le code | sa version **courante** (dans l'arbre) | chaque commit qui **ajoute** un motif dans un fichier de source |

Le rejeu adverse dit pourquoi : **un agent qui s'ajoute au registre puis supprime sa propre entrée
passe le contrôle 2 et échoue au contrôle 1.** Son commit de motif est bien signé par une clé qui
figurait au registre à cet instant ; mais le commit qui l'y a ajoutée n'est signé par personne
d'autorisé, et le retrait final rend le **diff net** du registre vide. D'où deux règles qui se
perdent vite :

- le contrôle 1 se fait **commit par commit** sur `base..HEAD`, jamais sur le diff net du fichier —
  un ajout suivi d'un retrait ne laisse aucun diff net ;
- il **précède** le contrôle 2, et son échec est un refus immédiat : évaluer le second après aurait
  produit un vert sur la moitié du dispositif.

## La recette — hors ligne, aucune action tierce

`git` sait vérifier une signature SSH contre un fichier `allowed_signers` (`gpg.ssh.allowedSignersFile`).
C'est une dépendance de moins — et la règle de maturité de `references/ci.md` s'applique d'autant
mieux qu'aucune action d'emballage n'est en jeu.

Esquisse, à adapter aux chemins, aux extensions et à la forge réels du projet :

```bash
set -uo pipefail
base="$BASE_SHA"                 # point de divergence — le job exige fetch-depth: 0
REG='.github/allowed_signers'    # le chemin réel du projet
MOTIFS='...'                     # les motifs de la table de references/ci.md, écosystème du projet
SRC=( ... )                      # les pathspecs de source, tests et documentation EXCLUS

# 0. Contexte indéterminable → refus (fermeture par défaut)
git rev-parse --verify "$base^{commit}" >/dev/null 2>&1 \
  || { echo "::error::base du diff introuvable — historique incomplet"; exit 1; }

git config gpg.format ssh

# 1. LE REGISTRE, contre sa version À LA BASE, commit par commit
if git show "$base:$REG" > "$RUNNER_TEMP/signers.base" 2>/dev/null; then
  git config gpg.ssh.allowedSignersFile "$RUNNER_TEMP/signers.base"
  for c in $(git rev-list --no-merges "$base..HEAD" -- "$REG"); do
    git verify-commit "$c" 2>/dev/null \
      || { echo "::error::$c touche $REG sans signature d'une clé déjà présente à la base"; exit 1; }
  done
else
  echo "::warning::amorçage — $REG absent à la base : cette PR l'installe SANS PREUVE."
  echo "::warning::seule parade : pousser ce fichier soi-même et vérifier la clé de ses yeux."
fi

# 2. LE CODE, contre le registre COURANT
git config gpg.ssh.allowedSignersFile "$REG"
for c in $(git rev-list --no-merges "$base..HEAD"); do
  git show "$c" --format= --unified=0 -- "${SRC[@]}" \
    | grep '^+' | grep -v '^+++' | grep -qE "$MOTIFS" || continue
  [ -f "$REG" ] \
    || { echo "::error::$c éteint un vérificateur et aucun registre n'existe : pas de soupape"; exit 1; }
  git verify-commit "$c" 2>/dev/null \
    || { echo "::error::$c éteint un vérificateur sans signature valide"; exit 1; }
  git log -1 --format=%B "$c" | grep -qE "$MOTIFS" \
    || { echo "::error::$c est signé mais son message ne dit pas quel vérificateur il éteint"; exit 1; }
done
exit 0
```

Trois points de cette esquisse ne sont pas négociables :

- **La base est le point de divergence**, jamais le dernier commit ni « les fichiers de la PR ».
  Même réponse en local et en CI, un motif introduit tôt dans la branche reste vu, pousser un
  commit de plus ne dilue rien, et le découpage en commits cesse d'être un contournement.
- **On conclut depuis le diff**, jamais depuis la trace d'exécution d'un garde. Un garde contourné
  n'efface pas la ligne qu'il aurait dû refuser.
- **Tout ce qui n'est pas une signature bonne est un refus.** `git verify-commit` sort non nul, ou
  `git log -1 --format='%G?'` rend autre chose que `G` : refus. Une signature valide mais dont le
  signataire n'est pas au registre n'est pas une demi-preuve, c'est une absence de preuve.

## L'amorçage — un trou irréductible, à écrire et non à contourner

Tant que le registre n'existe pas à la base, la PR qui l'installe le fait **sans preuve** : il
n'existe aucune clé de confiance pour signer l'arrivée de la première clé de confiance. Le workflow
émet un `::warning` explicite et laisse passer ; **la seule parade est humaine** — pousser ce
fichier soi-même et vérifier de ses yeux la clé qu'il contient.

Corollaire qui mord sur l'ordre des travaux : le fichier qui porte la liste des chemins protégés
**se protège lui-même à l'instant où on le modifie**. Registre amorcé et clé de signature doivent
donc exister **avant ou dans la même tranche** que le garde. Poser le garde d'abord et le registre
ensuite bloque le chantier sans issue.

## En local, et sans forge

Les deux constats sont dans `references/ci.md` — § `verifier-guard` pour le vert local qui signifie
*couvert* et non *approuvé*, § *Les modes dégradés* pour la soupape qui disparaît avec la forge. Ce
qu'ils n'y disent pas, et qui décide de l'implémentation :

**Ne rejoue pas la recette entière en local.** Elle vivrait à deux endroits qui divergeraient, et le
script local vit dans un espace que l'agent écrit. Le garde local constate la **couverture** — « ce
diff ajoute un neutralisant, il exigera un commit signé » — et rien de plus.

## Ce que le dispositif ne prouve pas — à écrire à côté de ce qu'il garantit

La propriété de sécurité réelle n'est pas « la phrase de passe est secrète » mais **« la clé
n'entre jamais dans l'agent SSH »** : sans la clé dans l'agent, la signature échoue et aucun commit
n'est créé ; après un seul chargement, elle est obtenue sans jamais connaître la phrase.
*(Vérifié par rejeu en dépôt jetable, 2026-08 : une mesure locale, sur une seule configuration —
elle illustre le mécanisme, elle ne le généralise pas. Rejoue-la sur ta propre stack avant d'en
faire une garantie.)* C'est une
propriété de l'**environnement** — pas de terminal, pas de programme *askpass* — et non du
protocole. **La CI ne peut donc pas la vérifier** : elle lit un type de clé, elle ne distingue pas
une clé à phrase jamais chargée d'une clé nue.

La discipline qui la rend tenable tient en une phrase : **la clé de signature ne sert qu'à signer**,
jamais à s'authentifier auprès de la forge. Il n'y a alors aucune occasion légitime de la charger.

Deux résiduels s'ajoutent, et ils vont dans `docs/ci.md`, dans le corps et jamais en note :

1. le fichier de clé reste **lisible donc exfiltrable** par tout processus de l'utilisateur — c'est
   le passage en N3, que le chiffrement renchérit sans le fermer ;
2. **l'outillage de signature ne doit pas être écrit par l'agent.** C'est le seul endroit du
   dispositif où son concours est un risque et non une aide, et aucun job de CI ne le voit.

## Trois pistes écartées — et le motif compte autant que le choix

- **TOTP.** Un code atteste qu'un humain a lu un téléphone autour d'un instant ; il n'est **lié à
  aucun contenu**. Pour être vérifié en CI il doit figurer dans le commit, donc dans l'historique,
  donc être lisible par l'agent — qui le recopie sur un autre commit en alignant la date. Refermer
  ce rejeu exigerait un registre serveur des codes consommés : protocole maison, état persistant,
  nouveaux modes de panne. Sur une phase dont la règle est qu'un contrôle fragile finit désactivé,
  c'est disqualifiant.
- **La porte d'approbation sur la forge.** Techniquement la bonne réponse à « utiliser mon MFA » :
  un job qui déclare un environnement se met en pause et attend un clic authentifié. Tuée **deux
  fois, par deux relevés indépendants**, pour la même raison mesurée : le jeton de la forge sur le
  poste porte la portée `repo`, **donc l'agent approuve sa propre porte**. Elle ne redevient viable
  qu'après avoir rétrogradé le jeton de l'agent en lecture seule — précondition non remplie, et non
  défaut du mécanisme. Note connexe : la forge **interdit d'approuver sa propre PR**, donc le
  schéma « 1 approbation requise » est mort-né à mainteneur unique — et le solo est le cas
  **nominal**, pas le cas dégradé.
- **La clé matérielle à présence physique (FIDO2).** Elle aurait converti la garantie en **preuve
  vérifiable par la CI** — le type de clé atteste le contact physique — et immunisé le dispositif
  contre le chargement dans l'agent. **Ce chemin est fermé par arbitrage humain, il n'est pas
  différé** : ne pas le rouvrir en croyant combler un oubli. Conséquence assumée, à écrire :
  l'écart entre la propriété visée et ce que la machine peut vérifier est **définitif**.

## Cette référence cite les motifs que le garde traque

`@ts-ignore`, `as any`, `nosemgrep` apparaissent **ici aussi**, en plus de `references/ci.md` et du
`docs/ci.md` produit. C'est un fichier de plus sur lequel un garde trop large se bloquerait : le
motif est en § `verifier-guard` de `references/ci.md`. Ce qui en découle pour l'esquisse ci-dessus :
l'exclusion de la documentation est sa **première ligne de pathspecs**, pas un réglage cosmétique.

</guidance>

<completion>
La soupape est posée quand :
- [ ] Le **registre de clés** est nommé par son chemin versionné, et son état est écrit : **amorcé**
      avec sa date, ou **À AMORCER** avec la conséquence (aucun neutralisant accepté).
- [ ] **L'ordre des deux contrôles** est écrit, avec le registre de référence de chacun : la base
      pour le contrôle du registre, l'arbre courant pour celui du code.
- [ ] Le contrôle du registre porte **commit par commit** sur le range, jamais sur le diff net.
- [ ] La **base du diff** est le point de divergence avec la branche par défaut, et le job déclare
      `fetch-depth: 0`.
- [ ] Le **message du commit signé porte le motif**, non vide.
- [ ] La **fermeture par défaut** est écrite et couvre les quatre cas : registre absent, base
      indéterminable, signature non bonne, contrôle du registre en échec.
- [ ] L'**amorçage** est rendu avec son `::warning` et la parade humaine — jamais contourné en
      silence.
- [ ] La section **« Ce que la soupape ne prouve pas »** est dans `docs/ci.md`, dans le corps :
      N2 fermé et **N3 non fermé**, la clé jamais chargée qui n'est pas vérifiable, le fichier de
      clé exfiltrable, l'outillage de signature que l'agent n'écrit pas, le vert local qui signifie
      *couvert* et non *approuvé*.
- [ ] La portée du garde **exclut la documentation**, sans quoi ce dispositif se bloque sur la
      notice qui le décrit.
- [ ] **Aucune clé n'a été générée, aucune configuration `git` locale touchée, aucun outillage de
      signature écrit** : la phase rend la recette, l'humain la joue.
</completion>
