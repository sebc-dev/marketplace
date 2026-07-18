---
argument-hint: "(lit docs/stack.md)"
description: "Phase 4 : génère les ADR fondateurs dans docs/adr/NNNN-*.md, un par décision structurante de la Stack. Format Nygard, immuables, statut Accepté. Traçabilité bidirectionnelle avec docs/stack.md."
---

## Contexte

Tu figes les **décisions structurantes du départ** en ADR, à partir de la liste « candidats ADR » de la Stack. Un ADR = une décision, au format Nygard, **immuable**. C'est un travail de rédaction cadré : tu drafts, l'humain valide.

Ratio : 30% humain / 70% AI (dérivation depuis Stack ; l'humain valide le contenu).

## Règles absolues

- **Un ADR par décision structurante**, pas plus, pas moins. Aucune ADR pour une non-décision (utilitaire mineur, convention évidente).
- **Numérotation séquentielle** `NNNN` (4 chiffres), à partir du plus petit libre dans `docs/adr/`.
- **Conséquence négative obligatoire** dans chaque ADR : nommer ce que le choix coûte ou ferme.
- **Immutabilité** : on crée (statut « Accepté »). On ne réédite jamais un ADR existant.

## Processus

1. Lis `docs/stack.md` (prérequis — s'il manque, renvoie vers `/scd-project-docs:stack`) et récupère la liste « Décisions structurantes → candidats ADR ».
2. Charge le template et ses règles : lis `references/adr.md` du skill `project-docs`.
3. Pour chaque décision structurante, écris `docs/adr/NNNN-titre.md` :
   - Contexte (cite les FR/SC servis), Décision (voix active), Conséquences (positives ET négatives), Alternatives considérées.
   - Fais valider le contenu par l'utilisateur avant de figer le statut « Accepté ».
4. **Boucle la traçabilité** : renseigne la colonne « ADR » du tableau de `docs/stack.md` avec chaque fichier créé.
5. Relis contre le bloc `<completion>` de `references/adr.md`.

## Ce que tu NE fais PAS

- Tu n'installes pas de hook d'immutabilité ADR ici : c'est de la maintenance, hors du kickoff de création (à signaler comme étape aval).

## Skill active

- `project-docs` — charge `references/adr.md`.

## À la fin

Liste les ADR créés et confirme que chaque candidat de la Stack a bien son ADR. Puis : « `/clear`, puis `/scd-project-docs:contract` pour assembler CLAUDE.md. »
