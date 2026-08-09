# Référence — Plan technique de feature (`specs/NNN-feature/plan.md`)

<role>
Répond au **comment**. Traduit `spec.md` en stratégie d'implémentation en **réutilisant** le socle
(`docs/stack.md`, `docs/adr/`) — il ne re-décide pas ce qui est déjà tranché. Produit **en plan
mode** (recommander `opusplan` : Opus planifie, Sonnet exécute). Trace vers spec + stack + ADR.
Concis : un plan court a un meilleur taux d'acceptation qu'un plan fleuve.
</role>

<template>
```markdown
# Plan technique : [feature]
Trace vers : specs/NNN-feature/spec.md · docs/stack.md · docs/archi.md (s'il existe) · docs/adr/

## Approche
[2-4 phrases : la stratégie retenue.]

## Réutilisation du socle
- Stack imposée par docs/stack.md : [langage/framework/DB/… déjà décidés — ne pas re-choisir]
- Invariants d'architecture (docs/archi.md) qui s'appliquent : [I1, I3 — ou « aucun »]
  → dérogation : [I3 franchi car <raison>] — à défaut, ne rien écrire ici
- ADR contraignants : [ADR-NNNN : décision qui s'applique ici]

## Fichiers touchés (nommer précisément)
- `[chemin]` : [ce qui change]
- Patron à suivre : `[fichier exemple existant]`

## Contrats d'interface
- [signatures, endpoints, schémas — cohérents avec les contrats d'E/S de la spec]

## Décisions & alternatives écartées
- [décision] car [raison]. Écarté : [alternative].
  → si structurante ET nouvelle : candidat ADR dans docs/adr/_candidates/NNNN-draft.md (JAMAIS dans adr/ final).

## Étape de vérification bout-en-bout
- [commande/test unique qui prouvera que la feature marche — sera exécutée par le workflow d'implémentation]
```
</template>

<guidance>
- **Ne re-décide rien du socle.** Langage, framework, DB, auth, déploiement sont fixés par `stack.md`/`adr/`. Le plan les *applique*. Contredire un ADR accepté = interdit (le hook `block-adr-edits` empêche d'ailleurs de le réécrire).
- **Décision structurante nouvelle** (non couverte par un ADR) → **candidat** dans `docs/adr/_candidates/`, promu manuellement plus tard. Jamais un ADR final directement.
- **Les invariants de `docs/archi.md` se confrontent, ils ne se re-décident pas.** Un lot qui franchit une frontière, inverse un sens de dépendance ou place un artefact hors du dossier prescrit change de découpage — ou **écrit sa dérogation avec sa raison**, en nommant l'invariant. Muette, elle est un **Major** à la gate `analyze` ; répétée d'une feature à l'autre, elle dit que l'invariant est périmé et relève de `/scd-sdd:archi`, jamais d'une édition d'ici. Pas de `docs/archi.md` → la ligne n'existe pas et l'étape est annoncée sautée.
- **Nommer les fichiers précisément** et pointer un **patron de référence** existant plutôt que décrire abstraitement.
- **Réutiliser l'existant** : chercher fonctions/utilitaires déjà présents avant de proposer du neuf.
- **Étape de vérif bout-en-bout obligatoire** : une commande/test qui **prouvera** la feature. Tu la *définis*, tu ne l'exécutes pas — c'est le contrat exécutable que l'aval honorera.
- **Concision** : viser un plan lisible d'un coup ; le détail va dans `tasks.md`.
</guidance>

<completion>
Le plan est terminé quand :
- [ ] La stack et les ADR contraignants sont **cités**, pas re-décidés.
- [ ] Si `docs/archi.md` existe : les fichiers touchés ont été **confrontés** à ses invariants, et
      toute frontière franchie est **nommée et justifiée**. S'il n'existe pas, l'étape a été
      annoncée sautée.
- [ ] Chaque `FR` de la spec est couvert par une portion du plan (fichiers/contrats).
- [ ] Les fichiers touchés sont nommés + un patron de référence est indiqué.
- [ ] Toute décision structurante nouvelle est un **candidat ADR** dans `_candidates/`, pas un ADR final.
- [ ] Une **étape de vérification bout-en-bout** unique et exécutable est définie.
</completion>
