<session_protocol>
## Stratégie JSON v2

Lire `environment.json_strategy` (ou `json_strategy` racine) dans config.json. Toutes les opérations suivent cette stratégie.

- `jq` : utiliser `scd.sh` pour toutes les opérations JSON
- `readwrite` : utiliser Read + Write

## Observations v2.1 — Structure

Chaque observation contient les champs v2.1 (les champs `user_decision*` sont nouveaux en v2.1) :
```json
{
  "id": "obs_001",
  "criterion": "security",
  "severity": "blocking",
  "level": "red",
  "location": "src/auth/login.ts:42",
  "line_start": 42,
  "line_end": 45,
  "text": "résumé court",
  "detail": "explication",
  "suggestion": "direction",
  "correction_prompt": "instruction autonome",
  "validator_decision": "apply|skip|escalate|null",
  "validator_confidence": 0.92,
  "validator_reason": "justification",
  "user_decision": "apply|skip|defer|null",
  "user_decision_reason": "raison libre (optionnel)",
  "user_decision_at": "2026-05-18T14:00:00Z",
  "resolution": "fixed|posted|skipped|escalated|null"
}
```

**Pipeline décisionnel** :
- `validator_decision` = recommandation de l'agent review-validator (Phase 2)
- `user_decision` = décision explicite de l'utilisateur (Phase 3.0 — défaut)
- `resolution` = état final après fix-applier ou post (Phase 3.5/3.6)

En mode `--auto-fix`, `user_decision` est auto-rempli depuis `validator_decision`.

**Note :** plus de session de type `"apply"` en v2 — les résolutions sont stockées dans la session review directement.

## Opérations — Session review

| Opération | jq | readwrite |
|---|---|---|
| Status | `bash .claude/review/scripts/scd.sh session status <session>` | Read + afficher progression |
| Update file | `bash .claude/review/scripts/scd.sh session update-file <session> <idx> <g> <y> <r> "<note>" <blocking> <risk_score>` | Read + update + Write |
| Mark resolution | `bash .claude/review/scripts/scd.sh session mark-resolution <session> <obs_id> <fixed\|skipped\|posted\|escalated>` | Read + update obs + Write |
| Add observations | `echo '<json_array>' \| bash .claude/review/scripts/scd.sh session add-observations <session> <idx>` | Read + append + Write |
| Add comment | `bash .claude/review/scripts/scd.sh session add-comment <session> "<file>" "<comment>"` | Read + append + Write |
| Add agent tasks | `bash .claude/review/scripts/scd.sh session add-agent-tasks <session> '<json>'` | Read + merge + Write |
| Summary | `bash .claude/review/scripts/scd.sh session summary <session>` | Read + table + mark completed + Write |
| Pending files | `bash .claude/review/scripts/scd.sh session pending-files <session> [--sort-by=risk]` | Read + filter + sort |
| Seed decisions | `bash .claude/review/scripts/scd.sh session seed-decisions <session>` | Read + marquer validator-skip → user-skip + Write |
| Pending decisions | `bash .claude/review/scripts/scd.sh session pending-decisions <session>` | Read + filtrer obs sans user_decision (hors validator-skip) + sort |
| Set decision | `bash .claude/review/scripts/scd.sh session set-decision <session> <obs_id> <apply\|skip\|defer> [reason]` | Read + update obs + Write |
| Decision summary | `bash .claude/review/scripts/scd.sh session decision-summary <session>` | Read + agréger counts |

## Opérations — Followup

| Opération | jq | readwrite |
|---|---|---|
| Classify | `bash .claude/review/scripts/scd.sh followup classify <previous_session> <diff_file>` | Read session + parse diff |
| File context | `bash .claude/review/scripts/scd.sh followup get-context <session> <path>` | Read session + extraire |
| Update file | `bash .claude/review/scripts/scd.sh followup update-file <session> <idx> <g> <y> <r> "<note>" "<resolution>"` | Read + update + Write |
| Summary | `bash .claude/review/scripts/scd.sh followup summary <session>` | Read + table + mark completed + Write |

## Opérations — Validation (chaînée v2)

| Opération | jq | readwrite |
|---|---|---|
| Update validation | `bash .claude/review/scripts/scd.sh validation update <session> <file-path> '<decisions-json>'` | Read + enrich observations + Write |
| Generate report | `bash .claude/review/scripts/scd.sh validation report <slug> <sessions_dir>` | Read sessions + consolider |

Les champs `validator_decision`, `validator_confidence`, `validator_reason` sont écrits directement dans chaque observation de la session review (pas de session validate séparée).

## Opérations — Config

| Opération | jq | readwrite |
|---|---|---|
| Update state | `bash .claude/review/scripts/scd.sh config update-state <config> <field> <value>` | Read + update + Write |
| Update state nested | `bash .claude/review/scripts/scd.sh config update-state --nested <config> '<path_array>' '<value>'` | Read + setpath + Write |
| Get value | `bash .claude/review/scripts/scd.sh config get <config> <key>` | Read + extract |
| Resolve model | `bash .claude/review/scripts/scd.sh config resolve-model <config> <agent>` | Read profile + lookup |

## Platform Integration v2 — Inline uniquement

| Opération | Commande |
|---|---|
| Post inline | `bash .claude/review/scripts/scd.sh post inline-comments <session> <config> [filter]` |
| Post orphans | `bash .claude/review/scripts/scd.sh post orphan-summary <session> <config>` |

Filtres inline : `blocking` (défaut), `all`, `red`, `yellow`.

**v2 : plus de commentaire général résumé** — seuls des commentaires inline sont postés. Les observations orphelines (ligne hors diff) sont regroupées dans un SEUL commentaire général via `orphan-summary`.
</session_protocol>
