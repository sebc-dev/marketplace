# Référence — EARS (Easy Approach to Requirements Syntax)

Chargée par `/scd-sdd:specify` (intégralement, avec `references/spec.md`) et par l'agent
**`premortem-applier`**, qui écrit un critère neuf sur un `FR` existant et doit le poser dans un des
cinq patterns. Ailleurs, elle est **citée sans être chargée** : le contrôle 4 d'`analyze` et la table
des cibles du skill `premortem` y renvoient pour le compte des patterns, pas pour la matière.

<patterns>
Forme générale : `While <précondition(s)>, when <déclencheur>, the <système> shall <réponse(s)>.`
Zéro-ou-plusieurs préconditions, zéro-ou-un déclencheur, un nom de système, une-ou-plusieurs réponses.

Les 5 patterns :

1. **Ubiquitous** (toujours vrai, pas de condition) :
   `The <système> shall <réponse>.`
2. **Event-driven** (déclenché par un événement) :
   `When <déclencheur>, the <système> shall <réponse>.`
3. **State-driven** (vrai pendant un état) :
   `While <état>, the <système> shall <réponse>.`
4. **Unwanted behavior** (erreur / cas indésirable) :
   `If <condition indésirable>, then the <système> shall <réponse>.`
5. **Optional feature** (dépend d'une capacité présente) :
   `Where <feature incluse>, the <système> shall <réponse>.`

Combinables : `While <état>, when <déclencheur>, the <système> shall <réponse>.`
</patterns>

<examples>
- Ubiquitous : « The system shall log every authentication attempt with a UTC timestamp. »
- Event-driven : « When a user submits the login form, the system shall validate credentials against the store. »
- State-driven : « While the session is unauthenticated, the system shall reject requests to /admin with 401. »
- Unwanted behavior : « If credential validation fails 5 times within 60 s, then the system shall lock the account for 15 min. »
- Optional feature : « Where two-factor auth is enabled, the system shall require a TOTP code after password validation. »

Chacun → **une vérification observable nommée** (par défaut un test : `test_logs_auth_attempt`, `test_rejects_admin_when_unauthenticated`, `test_locks_account_after_5_failures`… ; la forme réelle — test-first, check, ou preuve inhérente en CI/infra — se décide en phase `tasks`).
</examples>

<pitfalls>
- **Adjectif au lieu de verbe vérifiable** : « shall be fast/secure/robust » → non testable. Remplacer par une cible mesurable (« shall respond within 50 ms P99 »).
- **Plusieurs comportements dans un SHALL** : un « et » → scinder en deux FR.
- **Précondition confondue avec déclencheur** : `While` (état persistant) ≠ `When` (événement ponctuel).
- **Limites d'EARS** : au-delà de 3 préconditions, la phrase devient illisible → table de décision ou diagramme d'états. Les exigences non-fonctionnelles pures (contraintes archi) se capturent parfois mieux hors EARS. EARS est un *mindset* autant qu'une syntaxe.
- **Chemins multiples** : un critère avec plusieurs branches à haute valeur → compléter par un scénario Gherkin dérivé (`gherkin.md`).
</pitfalls>
