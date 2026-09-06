# Les huit dimensions en détail & le contrat de finding

Charge ce bloc pour le **référent** de chaque dimension, son **seuil de blocage exact**, et le schéma
de finding que tous partagent. Chaque reviewer juge **une seule** dimension, en **contexte frais**, et
ne remonte que ce que sa dimension couvre.

## Le contrat de finding (schéma partagé)

```json
{
  "dimension":   "sécurité",
  "severity":    "bloquant | suggestion",
  "location":    "src/api/user.ts:42",
  "summary":     "une phrase : le défaut",
  "rationale":   "pourquoi c'en est un, ancré dans le diff / un invariant / une exigence",
  "correction_prompt": "instruction AUTONOME pour corriger — réappliquable sans le contexte du reviewer"
}
```

Un `correction_prompt` doit être **exécutable seul** : il nomme le fichier, le défaut, et la
correction attendue, sans supposer que le lecteur a vu le reste de la review.

## Les six reviewers de code

### `architecture-reviewer`
- **Référent** : la table d'invariants de `docs/architecture.md` et les ADR contraignants, **résolus
  par `review-context`** (il ne relit pas les documents lui-même).
- **Bloque** : frontière franchie, sens de dépendance inversé, artefact hors du dossier prescrit, import
  prohibé — toute **violation d'invariant**, sauf **dérogation déclarée** dans le change.
- **Repli** quand la table est vide : cohérence avec l'existant. Un invariant **ne se re-discute pas**.

### `security-reviewer`
- **Bloque** : injection, XSS, secret en clair, authz/authn cassée, entrée non validée, désérialisation
  non sûre — **confirmé dans le diff**.
- **Ne bloque pas** : une spéculation non ancrée dans le code n'est pas un finding.

### `error-handling-reviewer`
- **Bloque** : erreur non gérée / avalée sur un **chemin critique**, message inexploitable, ressource
  non libérée. Hors chemin critique → suggestion.

### `coverage-reviewer`
- **Mode `tdd`/`test`** : signale les chemins/branches non exercés ; un **chemin critique de logique
  métier sans test = bloquant**. Il signale le trou, il ne réécrit pas les tests.
- **Mode `observé`** : aucun test automatisé n'est attendu (c'est le contrat) — il juge si la vérif
  observable couvre les chemins critiques et **ne remonte JAMAIS « absence de test »**.

### `conventions-reviewer`
- **Référent** : le champ `conventions` du BRIEF (tiré de `CLAUDE.md` + patrons existants par
  `ticket-briefer`) — il ne relit pas `CLAUDE.md` lui-même.
- **Seuil** : un écart **qu'aucun document ne porte** est une **suggestion**, pas un bloquant.

### `cleanliness-reviewer`
- Lisibilité, nommage, duplication, complexité, code mort.
- **Seuil** : **suggestion** par défaut — **bloquant** seulement si l'illisibilité rend le code non
  maintenable.

## Les deux reviewers propres au plugin

### `change-reviewer` — le seul au niveau artefact
- **Reçoit le dossier du change** (proposal + deltas + design), pas le dossier de review.
- **Bloque** : change mal cadré ou hors-périmètre, critère **non testable**, conflit avec une capacité
  **vivante** (`openspec/specs/`), `openspec validate --strict` en échec.
- **Autorisé à rouvrir le change** : c'est la seule dimension qui remet en cause l'artefact amont, pas
  seulement le code. Sauté hors d'un ticket (range/PR sans change).

### `integrity-reviewer` — le jumeau review-time du filet CI
- Cherche dans les **lignes ajoutées** les mêmes jetons que le filet CI : `@ts-ignore`, `as any`,
  `eslint-disable`, `.skip(`, `# noqa`, `--no-verify` ; **et** l'affaiblissement d'un **test existant**,
  d'un **workflow CI**, ou d'une **config d'outillage**.
- **Bloque** l'introduction d'un jeton ou l'affaiblissement d'un chemin protégé **sans dérogation
  déclarée**.
- **Nuance anti-faux-positif** : ajouter un **test NEUF** en `tdd`/`test` est le contrat — il vise
  l'affaiblissement, jamais l'ajout. **Filet, pas serrure** : il rattrape après coup, il ne bloque pas
  au write-time.

## Le triage (`review-validator`) — ce qui survit

Après le fan-out, `review-validator` reproduit chaque finding et applique un filtre dur :

- **Garde** : ce qui touche la **correction** (le code est faux) ou une **exigence** (un critère, un
  invariant, une convention documentée).
- **Rejette** : style pur, spéculation non reproduite, sur-engineering, hors-scope, doublon.
- **Au doute → skip.** Un faux positif coûte plus qu'un vrai négatif ici : la review de pertinence vaut
  par ce qu'elle **ne** remonte pas autant que par ce qu'elle remonte.

Les findings **rejetés** sont conservés **avec leur motif** dans la description de PR : la trace du
raisonnement de review est un livrable, pas seulement la liste des corrections appliquées.
