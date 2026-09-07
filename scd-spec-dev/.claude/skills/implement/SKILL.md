---
name: implement
description: |
  Le NIVEAU IMPLÉMENTATION du cycle : honorer et vérifier, un ticket NN à la fois, le contrat
  produit en amont par le change et sa décomposition. Porte le VOCABULAIRE partagé de ce niveau —
  la résolution et le parsing du fichier ticket (`**Vérif :**`, `**Fichiers :**`, `**Bloqué par :**`,
  critères à id stable SC-<NN><lettre>, états faits/démarrable/bloqué), les QUATRE modes de vérif
  (tdd/test/observé/aucun) et la discipline par mode, la structure producteur ≠ vérificateur avec la
  CEINTURE verify-time, la co-parallélisabilité (disjonction des fichiers → chaînes), et
  l'ANTI-ORPHELINAGE des PR empilées (défaut, PR empilée, DANGEREUX, ORPHELIN, priorité du signal de
  contenu). Se charge pendant /scd-spec-dev:run, run-parallel, review, sync, reland et status — les
  commandes le RÉFÉRENCENT sans recopier ; leurs algorithmes déterministes (résolution de base,
  co-parallélisabilité) y sont aussi inlinés, autosuffisants. Deux références chargées à la demande :
  references/modes.md (les 4 modes + le cycle par ticket), references/anti-orphelinage.md (le stacking
  et ses trois pannes). Porte UNIQUEMENT le niveau implémentation : ni la fondation OpenSpec et la
  dérivation d'état des changes (skill openspec), ni les huit dimensions de la review (skill review),
  ni le découpage d'un change (skill change-decomposer), ni le contrat hors-cycle (skill chantier).
---

# Le niveau implémentation

On a quitté OpenSpec. Un **change** a été décomposé en **tickets** verticaux (skill
`change-decomposer`), chacun un comportement vérifiable de bout en bout ≈ une PR. Ce niveau
**honore** chaque ticket, le **vérifie**, et ouvre **une PR par ticket** — sans jamais appeler
`/opsx:apply` : `run` prend le relais sur les tickets. La rigueur ne vient d'aucune garde de session
(0-hook) ; elle vient de la **review en contexte frais** (skill `review`) et de la **structure
producteur ≠ vérificateur**.

## Le fichier ticket — résolution & parsing

Un ticket vit dans `openspec/changes/<x>/tickets/NN-slug.md`. Format posé par la décomposition :

```markdown
# 02 — Export CSV d'un carnet vide
**Bloqué par :** 01
**Vérif :** tdd
**Fichiers :** `export/csv.ts`
## Ce que ça livre
Un export sur un carnet vide produit un fichier avec l'en-tête et rien d'autre.
## Critères
- [ ] un carnet vide produit un fichier de 1 ligne          (SC-02a)
- [ ] l'en-tête est identique à celle d'un export non vide   (SC-02b)
```

| Champ | Ce qu'on en lit |
|---|---|
| `**Vérif :**` | le mode : `tdd` \| `test` \| `observé` \| `aucun`. **Décidé une fois** à la décomposition (skill `strategie-verif`), jamais re-décidé ici. Une valeur hors de ces quatre = ticket mal formé (`blocked-brief`). |
| `**Fichiers :**` | le périmètre. Sert à la **parallélisation** (disjonction) et oriente le reviewer. Absente → ticket **non disjoint de tout**. |
| `**Bloqué par :**` | les dépendances (numéros de ticket). Arme la résolution de base et l'ordre. Absente ou « — » → aucune dépendance. |
| `## Critères` | les critères observables, un par ligne `- [ ]`, chacun avec son **id stable** `SC-<NN><lettre>` (source : un scénario WHEN/THEN d'un delta). `[x]` = satisfait. |

**Le slug est propre à chaque ticket** — c'est le suffixe du nom de fichier après `NN-`, sans `.md`
(`ls openspec/changes/<x>/tickets/NN-*.md`). Il n'est **pas** partagé entre les tickets d'un change.
La branche dédiée est `impl/<slug>-NN`. Pour brancher sur une dépendance `Rk`, il faut résoudre **le
slug de `Rk`** (`ls …/tickets/Rk-*.md` → `impl/<slugRk>-Rk`), jamais réutiliser le slug courant.

**États dérivés** (aucun fichier d'état, aucun journal) : un ticket est **fait** si toutes ses cases
`## Critères` sont `[x]` ; **démarrable** si tous ses `**Bloqué par :**` sont faits ; **bloqué**
sinon. L'état des changes eux-mêmes se lit par `openspec list` (skill `openspec`).

## Les quatre modes de vérif — le principe

Le mode décide **la forme de la preuve**, pas le sérieux. `references/modes.md` porte la discipline
complète et le cycle par ticket ; l'essentiel :

- **`tdd`** — un oracle exprimable avant le code. 1 test nommé par critère, **ROUGE** d'abord, puis
  l'impl jusqu'au vert **sans toucher aux tests**.
- **`test`** — test-after : l'impl prouve l'intégration, puis les tests sont écrits **juste après** et
  doivent être **VERTS** (legacy/characterization, couplage I/O).
- **`observé`** — pas de test automatisé possible : une **preuve observable** est capturée, ou le
  point est remonté en `humanCheckRequired` plutôt que faussement attesté.
- **`aucun`** — spike/exploration : ni test ni verify.

**La ceinture verify-time joue en `tdd` ET `test`** (pas seulement `observé`) : le `verifier`, en
contexte frais, **rejoue les tests sur un checkout propre** et exige un `git diff` **vide** sur les
fichiers de test. C'est là qu'un test neutralisé devient visible — le rattrapage réel du reward
hacking, à la place du hook write-time qu'on assume ne pas avoir (cf. skill `review`, doctrine).
**Self-correction bornée (§14 c)** : quand la ceinture est **propre** mais qu'un critère reste
**inobservable** par la stratégie test (le test ne fait pas naître le comportement), le workflow
retente **une** fois ce critère en observé (preuve montée ou `humanCheckRequired`) avant de rendre
`blocked-verify` — le blocage de fin de run devient résolu-en-vol ou escaladé bon marché, la barre de
sortie inchangée. Une ceinture **violée** (test modifié, `failed ≠ 0`) n'est **jamais** self-corrigée.

**Le lien critère → test** (`tdd`/`test`) : un critère = **un test nommé** `SC-<NN><lettre>`, un pour
un → matrice `critère → test → statut` dans la PR ; le `coverage-reviewer` bloque tout critère
orphelin.

## Co-parallélisabilité

Deux couches à ne jamais confondre. **Collision d'exécution** (deux runs sur le même checkout) :
résolue par le **worktree** — chaque ticket a son checkout. **Conflit de contenu** (deux tickets qui
éditent le même fichier) : l'isolation d'exécution n'y change rien, ils doivent être **empilés**, pas
parallélisés.

Deux tickets `Ri`, `Rj` **conflictent** si leurs `**Fichiers :**` se recoupent (`F(Ri) ∩ F(Rj) ≠ ∅`)
**ou** si l'un dépend de l'autre. Les **composantes connexes** de cette relation sont les **chaînes** :
tickets de chaînes différentes → parallèle ; au sein d'une chaîne → sérialisés et **empilés**
(`--base` sur le précédent). **Au doute, sérialise** : le parallèle est une optimisation, pas une
obligation ; on ne co-lance jamais ce qu'on ne peut pas **prouver** disjoint.

## Anti-orphelinage (résumé — détails : references/anti-orphelinage.md)

- **`défaut`** : `git symbolic-ref refs/remotes/origin/HEAD` → suffixe après `origin/` (repli
  `main`/`master`). C'est la seule branche où le code d'un ticket « arrive » réellement.
- **PR empilée** : base ≠ `défaut`. `pr-author` l'ouvre en **draft** + labels `stacked`/`needs-sync`
  + bloc d'avertissement, pour empêcher un merge orphelinant.
- **Un ticket est « arrivé dans `main` »** quand son **contenu** est dans `origin/<défaut>`. Le
  **signal de contenu prime** sur l'ancêtre git : les cases cochées du fichier ticket **tel qu'il est
  dans `origin/<défaut>`** (`git show origin/<défaut>:…tickets/NN-*.md`) sont le signal le plus
  simple ; l'ancêtre (`git merge-base --is-ancestor`) ne corrobore que sur merge propre — un squash le
  fait mentir.
- Deux pannes du stacking : **DANGEREUX** (base = branche d'un ticket **déjà mergé** → merger
  orphelinerait ce code → curatif `/scd-spec-dev:sync`) et **ORPHELIN** (PR mergée dans une branche de
  ticket intermédiaire cul-de-sac → code absent de `main` → rattrapage `/scd-spec-dev:reland`).

## Ce que ce skill ne porte pas

Il ne décide pas le mode (skill `strategie-verif`), ne découpe pas le change (skill
`change-decomposer`), ne porte pas la fondation OpenSpec ni la dérivation d'état des changes (skill
`openspec`), ne porte pas les huit dimensions de la review (skill `review`), et n'implémente rien
lui-même — ce sont les agents du workflow `implement-ticket` qui écrivent, vérifient et ouvrent la PR.
