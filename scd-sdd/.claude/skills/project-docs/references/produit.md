# Référence — Produit (`docs/produit.md`)

<role>
**Racine de la chaîne de traçabilité.** Répond au **pourquoi** et au **quoi**, au niveau
**produit/projet** (jamais per-feature) : le problème, les personas, les user stories priorisées,
les exigences fonctionnelles atomiques, le périmètre EXCLU et les critères de succès mesurables.
**Technology-agnostic** : aucun choix technique n'entre ici. Produit par interview
« une question à la fois » — c'est le document le plus amont, donc le plus ambigu, et rien
n'existe encore à en dériver.

Écrit **une fois**, stable. Tout le reste du socle — Technique, ADR, CI, `CLAUDE.md` — trace vers
lui, et le niveau specs viendra le décliner en `spec/plan/tasks` par feature.

⚠️ **La section `## Problème` n'est jamais remédiée.** Elle porte l'**intention d'origine**, pas une
cible : `/scd-sdd:premortem socle` peut remédier `docs/produit.md`, **jamais cette section**
(`DECISIONS.md` §D39, arbitrage n° 2). C'est la protection que portait le **Brief** avant la
fusion ; la borne s'est déplacée de *ce fichier* à *cette section*, elle n'a pas disparu.

**Où cette référence se charge — deux points, et le second est partiel :**

1. par `/scd-sdd:produit`, **intégralement** : c'est le template et la méthode de la phase ;
2. par l'agent **`audit-explorer`**, le **seul bloc `<template>`**, quand `/scd-sdd:audit produit`
   juge ce document. Il n'en tire que la **liste des sections attendues** et ne le recopie nulle
   part (`DECISIONS.md` §D20) : produire le document appartient à la phase, constater ce qui y
   manque à l'audit.
</role>

<template>
```markdown
# Produit — [Projet]
Statut : Brouillon | Créé : [date] | Trace vers : — (racine de la chaîne)

## Légende
- **Produit** — ce document : ce que le produit fait et pour qui, jamais comment il le fait. Il est
  la racine du socle ; les choix techniques vivent dans `docs/technique.md`.
- **FR-xxx** — une **exigence fonctionnelle** : une capacité du produit, énoncée assez précisément
  pour qu'on puisse dire oui ou non si elle est là.
- **SC-xxx** — un **critère de succès** : comment on mesure que c'est réussi. Un chiffre ou un fait
  constatable, pas une appréciation.
- **User story** — un parcours vu du côté de la personne qui s'en sert, avec sa priorité (P1 = sans
  ça, le produit ne sert à rien).
- **Given / When / Then** — la forme d'un scénario d'acceptation : l'état de départ, l'action, le
  résultat attendu. Les trois mots-clés restent en anglais, comme partout ailleurs ; **la phrase,
  elle, s'écrit en français**.
- **[NEEDS CLARIFICATION]** — une ambiguïté posée et **jamais tranchée en silence**.

## Problème
[Quel problème, pour qui, pourquoi maintenant. 3-5 phrases.]

## Objectif & résultat attendu
[Le "done" au niveau produit, mesurable si possible.]

## Utilisateurs & cas d'usage
- [persona] → [job-to-be-done : ce que cette personne cherche à accomplir, pas la fonctionnalité
  qu'elle demanderait]

## User stories (priorisées)
### US1 — [titre] (Priorité : P1)
[Parcours en langage clair.]
- Pourquoi cette priorité : [valeur, trace vers un SC-xxx ci-dessous]
- Scénarios d'acceptation :
  1. **Given** [état initial], **When** [action], **Then** [résultat attendu]
  2. **Given** [...], **When** [...], **Then** [...]

## Exigences fonctionnelles (atomiques, testables)
- **FR-001** : Le système DOIT [capacité précise et vérifiable]
- **FR-002** : L'utilisateur DOIT pouvoir [interaction]
- **FR-00X** : [NEEDS CLARIFICATION : question précise]   # marquer l'incertitude

## Cas limites
- Que se passe-t-il si [condition frontière] ?
- Comment le système gère [scénario d'erreur] ?

## Périmètre EXCLU
- [ce que le produit / la v1 ne fait PAS — borne l'agent, évite le sur-engineering]
[Il n'y a **pas** de section « Inclus » : l'inclus est la liste des `FR-xxx` ci-dessus. En écrire
une seconde recréerait le doublon que la fusion vient de supprimer.]

## Critères de succès (mesurables)
- **SC-001** : [métrique vérifiable, ex « création de compte < 2 min »]
```
</template>

<guidance>
- **Interviewer AVANT d'écrire.** Ne pas remplir le template de suppositions : chaque champ vide est une question.
- **Le problème d'abord** : sans problème net, tout le reste flotte. Creuser « pour qui » et « pourquoi maintenant ». C'est la seule section que rien ne remédiera plus tard — la formuler juste ici est le seul moment.
- **Technology-agnostic** — l'énoncé et son motif sont au `SKILL.md`, § *Règles d'écriture pour un agent*, et ne se recopient pas ici. Ce document est celui où la règle mord : la fuite est l'erreur la plus fréquente de la phase, et le `<completion>` la contrôle.
- **Niveau produit, pas feature.** Décrire les capacités d'ensemble, pas l'implémentation détaillée d'une feature — ce détail-là appartient au workflow specs en aval. Éviter le doublon.
- **FR atomiques et testables.** Une exigence = un comportement vérifiable = un futur test. Si un FR contient « et », le scinder.
- **Given/When/Then** pour les scénarios : entrées/sorties concrètes, pas de généralité.
- **`[NEEDS CLARIFICATION]`** pour toute zone floue : ne jamais trancher silencieusement une ambiguïté. Résoudre par interview avant de clore.
- **Prioriser (P1/P2/P3)** : l'agent et l'humain doivent savoir quoi construire d'abord.
- **Le scope EXCLU est le champ le plus précieux du document** ; le pourquoi est au `SKILL.md`, § *Règles d'écriture pour un agent*. Ce qui est propre à ce document : forcer au moins **2-3 exclusions explicites**, validées par l'utilisateur. Il n'est demandé **qu'une fois** — avant la fusion, le Brief et le PRD le réclamaient tous les deux, le second « héritant et affinant » le premier.
- **Les `SC-xxx` sont des métriques, pas des intentions** : « rapide » → « chargement < 2 s ». Eux non plus ne sont demandés **qu'une fois**. Les numéroter : ils seront réutilisés par tout l'aval.
- **Aucune contrainte technique ici.** Les contraintes transverses — techniques, légales, budget, plateformes cibles — vivent dans `docs/technique.md`, § *Contraintes transverses*, où elles servent à trancher. Ce qui borne le **produit** s'écrit en `FR` ou en `## Périmètre EXCLU`.
</guidance>

<completion>
Le document Produit est terminé quand :
- [ ] Le problème est formulé avec « pour qui » et « pourquoi maintenant ».
- [ ] Au moins un persona → job-to-be-done est nommé.
- [ ] Chaque user story a une priorité et au moins un scénario **Given/When/Then**.
- [ ] Chaque `FR-xxx` est **atomique** (un seul comportement) et **testable** (vérifiable par une sortie).
- [ ] Tous les `[NEEDS CLARIFICATION]` ont été résolus par interview (aucun ne subsiste à la clôture).
- [ ] Le **périmètre EXCLU** contient au moins 2-3 exclusions explicites, validées par l'utilisateur — **une seule section**, et aucune section « Inclus » n'a été ajoutée.
- [ ] Chaque critère de succès `SC-xxx` est **mesurable** (un chiffre ou un test, pas un adjectif) — **une seule liste**, non dupliquée.
- [ ] Les `FR-xxx` et `SC-xxx` sont numérotés et stables (ils seront réutilisés en aval).
- [ ] Aucun choix technique (framework/lib/DB) n'apparaît — le document est resté technology-agnostic.
</completion>
