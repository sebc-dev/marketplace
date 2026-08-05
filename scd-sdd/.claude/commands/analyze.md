---
description: "Phase 5 des specs : gate de conformité du contrat. Lecture seule + rapport. Atteste que spec/plan/tasks sont prêts pour l'implémentation ET que le découpage produira des unités reviewables par un humain. 14 contrôles, rapport Critical/Major/Minor, verdict PRÊT ssi zéro Critical. Consigne son verdict au journal."
argument-hint: "[NNN ou slug — optionnel, résolu sinon]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Edit
  - Task
---

## Contexte

Tu tiens la **gate de conformité** du cycle. Les documents sont écrits ; ta mission est
d'**attester qu'ils sont prêts** pour une implémentation optimale — ou de dire précisément ce
qui manque.

Deux questions, pas une :

1. **Le contrat tient-il ?** Traçabilité complète, critères testables, frontières tenues.
2. **Le découpage produira-t-il des unités reviewables par un humain ?** Un contrat
   parfaitement tracé mais livrable en un seul bloc produit une review que personne ne fera
   vraiment. C'est la dernière occasion de le corriger : après l'implémentation, redécouper
   coûte le prix du code déjà écrit.

Ce n'est pas une revue de code : il n'existe pas encore. C'est un contrôle qualité du
**contrat** — des « unit tests for English ». Attraper un trou ici coûte infiniment moins cher
qu'après l'implémentation.

Ratio : 30% humain / 70% AI (analyse mécanique ; l'humain décide de corriger ou de passer la
main).

## Règles absolues

- **Tu ne modifies aucun document du contrat.** `spec.md`, `plan.md`, `tasks.md` et le socle
  sortent de cette commande **bit pour bit identiques**. Ta sortie est un rapport en
  conversation. Seule écriture autorisée : la ligne de journal (voir plus bas).
- **Tu ne persistes aucun verdict comme état.** Un `PRÊT` écrit sur disque deviendrait faux à
  la première édition d'un document. La gate est bon marché : on la relance.
- **Tu ne corriges pas toi-même** : tu nommes le fichier, l'ID et l'action.
- **Tu ne juges pas le code** : il n'existe pas. Les tests sont *prévus* dans `tasks.md`,
  jamais exécutés ici.
- **Pas de préférences de style.** T'en tenir à ce qui affecte la testabilité, la traçabilité,
  les frontières ou la reviewability.
- **Une estimation n'est pas une gate.** Un lot hors seuils de dimensionnement est **Major,
  jamais Critical** — ces seuils sont transposés du code par analogie et le budget est une
  estimation. Les bloquants du découpage sont **qualitatifs** : verticalité, sujet unique,
  indépendance.
- **Verdict `PRÊT` uniquement si zéro Critical.**

## Processus

1. **Résous la feature cible** — règle de résolution du skill `feature-specs`, section
   « Cibler une feature ». Candidature propre à cette phase : la feature disposant d'un
   **`tasks.md`**. **Annonce la cible retenue.**

2. **Charge la référence** : `references/analyze.md` du skill `feature-specs`.

3. **Lis** `specs/<cible>/spec.md`, `plan.md`, `tasks.md`, plus `docs/prd.md`,
   `docs/stack.md` et `docs/adr/`.

4. **Déroule les 14 contrôles** de `references/analyze.md` :

   | Groupe | Contrôles | Objet |
   |---|---|---|
   | Traçabilité | 1-3 | spec→PRD, spec→tasks, tasks→spec |
   | Qualité des critères | 4-6 | EARS, verbe vérifiable, atomicité |
   | Frontières | 7-9 | technology-agnostic, scope EXCLU, ambiguïtés |
   | Cohérence | 10-11 | socle, contradictions internes |
   | Reviewability | 12-14 | verticalité, sujet unique, dimensionnement |

5. **Délègue un second regard en contexte frais** (outil `Task`, les deux **en parallèle** —
   leurs mandats sont disjoints) : **`ears-verifier`** pour les contrôles 1-11,
   **`slice-auditor`** pour 12-14. Recommandé si la feature est grosse, et **fortement** si
   c'est cette session qui a rédigé les documents : elle est alors mal placée pour les juger.

6. **Produis un seul rapport** classé **Critical / Major / Minor** selon le bloc `<report>` de
   la référence — fusionne les findings des subagents **sans les rejuger** — avec la couverture
   chiffrée, le récapitulatif du découpage et le **Verdict**.

7. **Consigne au journal** (voir ci-dessous).

## Ce que tu NE fais PAS

- Aucune modification de `spec.md`, `plan.md`, `tasks.md`, ni du socle.
- Aucun rapport écrit sur disque : le rapport reste en conversation.
- Tu ne prescris pas **comment** implémenter.
- Tu n'exécutes aucun test.

## Consigne au journal

C'est **l'exception explicite** à la règle de lecture seule, et la raison d'être de cette
section : le verdict de cette gate n'existe **nulle part ailleurs**. Elle n'écrit aucun
rapport, donc sans cette ligne, savoir si le contrat a été validé — et quand — est perdu à la
fin de la session.

Charge le skill `journal` et ajoute **une ligne** dans `docs/journal/NNN-slug.md`,
par `Edit` ciblé :

- **Phase** : `analyze`
- **Résultat** : le **verdict en gras**, puis le décompte par sévérité.
  Exemple : `**PRÊT** — 0 Critical · 1 Major · 2 Minor`
  ou : `**CORRIGER D'ABORD** — 2 Critical (FR-003 non testable, R2 horizontal)`.

Ce que cette ligne est, et ce qu'elle n'est pas : c'est un **événement daté** — « le 28/07, la
gate a rendu PRÊT » reste vrai pour toujours. Ce n'est **pas** un état « la feature est
validée », qui cesserait d'être vrai à la première édition. Les lecteurs (`status-specs`,
`status`) ne la convertissent en état qu'après un contrôle de fraîcheur contre la date de
modification des trois documents. Tu n'écris rien d'autre, nulle part.

Une gate au rouge se consigne **aussi** : c'est la moitié de l'histoire qui a de la valeur.

## Skill active

- `feature-specs` — charge `references/analyze.md`.
- `journal` — contrat de `docs/journal/*.md`.
- Subagents (recommandés, en parallèle, contexte frais) : `ears-verifier` — contrat (1-11) ·
  `slice-auditor` — découpage (12-14).

## À la fin

Donne le **Verdict**, en passant le `NNN`.

**Si `PRÊT POUR IMPLÉMENTATION`** — « `specs/<cible>/` est un contrat validé : traçabilité
complète, critères testables, frontières tenues, et un découpage en N lots dont chacun sera
reviewable par un humain. »

- Feature non triviale (chemins d'erreur nombreux, enjeu produit) → **propose la passe de
  durcissement** : « Pour chercher les modes de défaillance que la conformité ne couvre pas,
  lance `/scd-sdd:premortem NNN` avant le passage de main. »
- Sinon, la main passe au niveau implémentation : « `/clear`, puis `/scd-sdd:run NNN R1`. »
- Si d'autres features sont en vol, renvoie plutôt vers `/scd-sdd:status-specs`.

**Si `CORRIGER D'ABORD`** — renvoie vers la phase concernée pour les Critical (`specify NNN` /
`clarify NNN` / `plan NNN` / `tasks NNN` — **tous** les défauts de découpage relèvent de
`tasks NNN`), puis relance `/scd-sdd:analyze NNN`.
