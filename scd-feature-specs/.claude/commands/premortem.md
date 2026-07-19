---
argument-hint: "[NNN ou slug de la feature — optionnel, résolu sinon]"
description: "Phase 6, terminale : passe de durcissement adverse par premortem, APRÈS la gate analyze. Trois sous-agents — un anime le premortem (projette l'échec de la feature et remonte à la cause dans le contrat), un valide et trie les risques, un applique les remédiations APRÈS approbation humaine. Écrit dans spec/plan/tasks (contrairement à analyze). Reste purement documentaire ; recommande une re-passe analyze puisque le contrat a changé."
---

## Contexte

`analyze` a déjà attesté que le contrat est **conforme**. Cette phase pose une question différente,
en contexte frais : **s'il était implémenté tel quel, la feature échouerait-elle quand même ?** Un
contrat peut être parfaitement tracé, testable et bien découpé, et pourtant omettre le cas limite,
le chemin d'erreur ou l'hypothèse tue qui la fera échouer une fois livrée.

C'est un **premortem** : on se projette après la livraison en supposant l'échec, et on remonte à ce
que le contrat contenait — ou omettait — qui l'a rendu possible. Contrairement à `analyze`, cette
phase **écrit** : elle durcit les documents. Comme toutes les phases d'écriture du plugin, elle reste
**purement documentaire** (aucun code, aucun test) et **l'humain décide du quoi** — ici via un gate
d'approbation explicite avant toute modification.

Ratio : 40% humain / 60% AI (les deux premiers agents tournent en autonomie ; l'humain approuve, le troisième applique).

## Règles absolues

- **Ne modifie rien avant l'approbation humaine.** Les remédiations validées sont *proposées*, pas appliquées.
- **N'applique que l'ensemble approuvé.** Aucun ajout de ton cru — ce serait du scope creep sans gate.
- **Reste documentaire.** Toute remédiation est un changement de `spec.md`/`plan.md`/`tasks.md`, ou un candidat ADR dans `_candidates/`. Jamais de code, jamais d'edit d'ADR accepté.
- **Ne double pas `analyze`.** On ne rejuge pas EARS/backref/verticalité : on cherche les modes de défaillance que la conformité ne voit pas.
- **Calibrage.** Pour un diff descriptible en une phrase, saute cette passe — cf. seuils du skill. Le premortem paie sur les features non triviales.

## Processus

1. **Résous la feature cible** — règle de résolution du skill (« Cibler une feature ») : argument `NNN`/slug s'il est fourni ; sinon l'unique feature disposant d'un `tasks.md` ayant passé `analyze` ; sinon liste et demande. **Annonce la cible.** Vérifie qu'`analyze` est au vert : le premortem se joue **après** la gate, pas à sa place.
2. Charge la référence : lis `references/premortem.md` du skill `feature-specs`.
3. **Anime le premortem** — délègue à `premortem-facilitator` (outil Task) sur le chemin cible. Il rend une liste de risques classée par impact × vraisemblance.
4. **Valide et trie** — délègue à `premortem-validator` en lui passant la liste du facilitateur et le chemin. Il rejette la spéculation, le déjà-couvert, le scope creep et le style ; il retient les vrais trous et les normalise en remédiations concrètes. *(Séquentiel : le valideur a besoin de la sortie du facilitateur.)*
5. **Gate d'approbation humain** — présente les remédiations retenues en **liste numérotée** (chacune : fichier, ID cible, type de changement, texte proposé) et demande lesquelles appliquer : toutes, une sélection par numéro, ou aucune. Peu de remédiations (≤ 4) → `AskUserQuestion` avec `multiSelect` ; au-delà → présente la liste et attends la réponse en clair. **Rien n'est écrit tant que l'humain n'a pas tranché.** S'il ne retient rien, arrête ici et dis-le.
6. **Applique** — délègue à `premortem-applier` en lui passant **uniquement** l'ensemble approuvé. Il inscrit les changements en préservant la traçabilité (IDs, backrefs, EARS, bon lot) et rend le journal des changements.
7. **Re-gate** — le contrat a changé : recommande `/scd-feature-specs:analyze NNN` pour reconfirmer `PRÊT` avant le passage de main.

## Ce que tu NE fais PAS

- Aucune écriture avant l'approbation ; aucune remédiation hors de l'ensemble approuvé.
- Tu ne prescris pas *comment* implémenter ; tu n'écris pas de code ; tu n'exécutes aucun test.
- Tu n'édites pas les ADR acceptés (candidats seulement).

## Skill active

- `feature-specs` — charge `references/premortem.md`.
- Subagents (séquentiels puis, après approbation, l'applicateur) : `premortem-facilitator` → `premortem-validator` → *[gate humain]* → `premortem-applier`.

## À la fin

- Si des remédiations ont été appliquées : « Contrat durci — R remédiations inscrites. **Relance `/scd-feature-specs:analyze NNN`** pour reconfirmer `PRÊT`, puis la main passe au workflow d'implémentation. »
- Si rien n'a été retenu ou approuvé : « Premortem passé sans remédiation : le contrat tient tel quel. **La main passe au workflow d'implémentation.** »
- Puis **boucle le cycle** : « Feature suivante : `/clear`, puis `/scd-feature-specs:kickoff [prochaine feature]` » (ou `/scd-feature-specs:status` si plusieurs features sont en vol).
