# Référence — Brief / Vision (`docs/brief.md`)

<role>
Racine de la chaîne de traçabilité. Répond au **pourquoi** et fixe le **périmètre macro**.
Léger, écrit une fois, stable. Tout le reste (PRD, Stack, ADR) trace vers lui.
Produit par interview « une question à la fois » — c'est le document le plus amont, donc le plus ambigu.

**Où cette référence se charge — deux points, et le second est partiel :**

1. par `/scd-sdd:brief`, **intégralement** : c'est le template et la méthode de la phase ;
2. par l'agent **`audit-explorer`**, le **seul bloc `<template>`**, quand `/scd-sdd:audit brief`
   juge ce document. Il n'en tire que la **liste des sections attendues** et ne le recopie nulle
   part (`DECISIONS.md` §D20) : produire le document appartient à la phase, constater ce qui y
   manque à l'audit.
</role>

<template>
```markdown
# Brief — [Projet]

## Problème
[Quel problème, pour qui, pourquoi maintenant. 3-5 phrases.]

## Objectif & résultat attendu
[Le "done" au niveau produit, mesurable si possible.]

## Utilisateurs & cas d'usage principaux
- [persona] → [job-to-be-done : ce que cette personne cherche à accomplir, pas la fonctionnalité
  qu'elle demanderait]

## Périmètre
- Inclus (v1) : [...]
- EXCLU (v1) : [...]   # crucial : borne l'agent, évite le sur-engineering

## Contraintes
- [techniques, légales, budget, plateformes cibles]

## Critères de succès (mesurables)
- SC-001 : [métrique, ex "création de compte < 2 min"]
```
</template>

<guidance>
- Interviewer AVANT d'écrire. Ne pas remplir le template de suppositions : chaque champ vide est une question.
- Le **problème** d'abord : sans problème net, tout le reste flotte. Creuser « pour qui » et « pourquoi maintenant ».
- Le **scope EXCLU** est le champ le plus précieux — il empêche l'agent (et l'humain) de sur-engineerer la v1. Forcer au moins 2-3 exclusions explicites.
- Les **SC-xxx** sont des métriques, pas des intentions : « rapide » → « chargement < 2 s ». Les numéroter, ils seront réutilisés dans le PRD.
- Rester au niveau produit/macro : aucune user story détaillée ici (ça, c'est le PRD), aucun choix technique (ça, c'est Stack).
</guidance>

<completion>
Le Brief est terminé quand :
- [ ] Le problème est formulé avec « pour qui » et « pourquoi maintenant ».
- [ ] Au moins un persona → job-to-be-done est nommé.
- [ ] Le périmètre **EXCLU (v1)** contient au moins 2-3 exclusions explicites, validées par l'utilisateur.
- [ ] Chaque critère de succès `SC-xxx` est **mesurable** (un chiffre ou un test, pas un adjectif).
- [ ] Aucun choix de stack ni user story détaillée n'a fuité dans le Brief.
</completion>
