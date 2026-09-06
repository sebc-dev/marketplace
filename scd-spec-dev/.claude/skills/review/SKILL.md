---
name: review
description: |
  La REVIEW DE PERTINENCE — là où ce plugin met toute sa rigueur, à la place des gardes de session
  (doctrine 0-gate, 0-hook). Porte les HUIT dimensions jugées en contexte frais et leurs seuils de
  blocage : les six de code (architecture, sécurité, conventions, propreté, error-handling,
  couverture) + change (le diff honore-t-il le change, sans conflit avec les specs vivantes — le seul
  reviewer au niveau artefact) + integrity (escape-hatches et chemins protégés affaiblis — le jumeau
  review-time du filet CI). Porte la structure producteur ≠ vérificateur, le dossier de contexte
  résolu UNE fois, le triage adversarial (reproduire avant de retenir, au doute skip), et la frontière
  entre ce qui BLOQUE et ce qui reste suggestion. Se charge pendant /scd-spec-dev:run (phase Review) et
  /scd-spec-dev:review (l'utilitaire hors run). Une référence chargée à la demande :
  references/dimensions.md (les huit dimensions en détail + le contrat de finding). Porte UNIQUEMENT
  la review : elle n'écrit ni ne corrige rien (fix-applier applique, sous /scd-spec-dev:run), ne porte
  ni le parsing du ticket ni l'anti-orphelinage (skill implement), ni la fondation OpenSpec (skill
  openspec), ni le découpage (skill change-decomposer).
---

# La review de pertinence — huit dimensions en contexte frais

## La doctrine — pourquoi la rigueur est ici

Ce plugin n'a **aucune garde de session** (0-hook write-time) : un hook à chaque écriture alourdit le
temps de dev, et **ce qu'il attrape est du texte**. La rigueur est mise dans la **review par agents
dédiés** — qui jugent la **pertinence** des changements — et dans la **structure producteur ≠
vérificateur**. La recherche TDD, elle, recommande des hooks anti-triche : cette tension est
**assumée**, pas masquée. On l'assume en **review-time + verify-time** ; c'est ce que L9 doit
trancher. Deux filets restent automatiques : l'`integrity-reviewer` (review-time) et le **job CI grep**
(hors boucle de dev).

**Producteur ≠ vérificateur, toujours.** Aucun reviewer n'a écrit le code qu'il juge : ils partent en
**contexte frais**. C'est vrai dans le cycle `run` (phase Review) comme dans l'utilitaire
`/scd-spec-dev:review` sur du code déjà écrit.

## Les huit dimensions (détail : references/dimensions.md)

Le fan-out lance **huit reviewers en parallèle**, chacun sur sa **seule** dimension, sur le même diff.
Six sur le **dossier de review** (résolu une fois), `change` sur le **dossier du change**, `integrity`
sur le **diff seul**.

| Dimension | Reviewer | Ce qui BLOQUE |
|---|---|---|
| architecture | `architecture-reviewer` | violation d'un invariant `docs/architecture.md`/ADR sans dérogation déclarée |
| sécurité | `security-reviewer` | vulnérabilité **confirmée dans le diff** (une spéculation non ancrée n'est pas un finding) |
| error-handling | `error-handling-reviewer` | erreur non gérée sur un **chemin critique** |
| couverture | `coverage-reviewer` | en `tdd`/`test` : chemin critique / critère sans test. En `observé` : **jamais** « absence de test » |
| **change** | `change-reviewer` | change mal cadré, critère non testable, conflit avec les specs vivantes, `openspec validate --strict` en échec — **niveau artefact** |
| **integrity** | `integrity-reviewer` | escape-hatch (`@ts-ignore`, `as any`, `eslint-disable`, `.skip(`, `# noqa`, `--no-verify`) ou chemin protégé (test/CI/config d'outillage) affaibli, dans les **lignes ajoutées**, sans dérogation |
| conventions | `conventions-reviewer` | rien par défaut — un écart qu'aucun document ne porte est **suggestion** |
| propreté | `cleanliness-reviewer` | rien par défaut — **sauf** une illisibilité qui rend le code non maintenable |

**Deux nuances qui se reperdent.** `integrity` est un **filet, pas une serrure** : ajouter un **test
neuf** en `tdd`/`test` est le contrat, pas une infraction — il vise l'**affaiblissement** d'un test
existant, pas l'ajout. Et `change` est le **seul reviewer au niveau artefact**, autorisé à rouvrir le
change ; il reçoit le **dossier du change**, pas le dossier de review.

Chaque reviewer rend des findings au schéma commun `{ severity: bloquant|suggestion, location,
summary, rationale, correction_prompt }` — le `correction_prompt` est **autonome** (réappliquable
sans le contexte du reviewer).

## Le dossier de contexte — résolu une fois

`review-context`, en contexte frais, résout **une seule fois** ce que six reviewers reliraient sinon :
invariants de `docs/architecture.md`, corps des ADR contraignants, décisions d'implémentation et
hors-périmètre du change, contrats d'interface, et les **aides** (`.claude/review.json` fait autorité —
skills distillés, serveurs MCP en pointeur). Il **cite**, il ne juge pas.

## Le triage adversarial

Tous les findings passent par `review-validator` (contexte frais) : il **reproduit** chaque finding
dans le code avant de le retenir, ne garde que ce qui touche la **correction** ou une **exigence**, et
**rejette** style/spéculation/sur-engineering/hors-scope/doublon. **Au doute → skip.** Le triage décide
`apply`/`skip` ; il ne corrige rien. Un finding retenu est ensuite appliqué chirurgicalement par
`fix-applier` (dans `run` seulement ; l'utilitaire `review` **rapporte** et n'applique pas).

## Deux entrées, un même dispositif

- **Dans `run`** (phase Review, après Green/Verify et la quality gate) : la review est une **porte** du
  cycle. Un bloquant retenu qui n'est pas résolu échoue le ticket. Findings appliqués **et** rejetés
  sont consignés dans la description de PR.
- **`/scd-spec-dev:review`** (hors run) : même batterie, même triage, mais **lecture seule** — elle
  rapporte, n'applique rien, n'ouvre aucune PR. Hors d'un ticket (range/PR sans change), la dimension
  **change** est sautée (pas de change à confronter) et **couverture** ne peut pas réclamer « critère
  sans test » (pas de critères) — et le rapport le dit.
