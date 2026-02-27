<session_protocol>
## Strategie JSON

Lire `json_strategy` dans config.json. Toutes les operations suivent cette strategie.

- `jq` : utiliser les scripts bash pour toutes les operations JSON session
- `readwrite` : utiliser Read + Write pour toutes les operations JSON

## Operations — Review standard

| Operation | jq | readwrite |
|---|---|---|
| Status | `bash .claude/review/scripts/session-status.sh <session>` | Read + afficher progression |
| Update file | `bash .claude/review/scripts/update-file.sh <session> <idx> <g> <y> <r> "<note>" <blocking>` | Read + update + Write |
| Add observations | `echo '<json_array>' \| bash .claude/review/scripts/add-observations.sh <session> <idx>` | Read + append + Write |
| Add comment | `bash .claude/review/scripts/add-comment.sh <session> "<file>" "<comment>"` | Read + append + Write |
| Add agent tasks | `bash .claude/review/scripts/add-agent-tasks.sh <session> '<json>'` | Read + merge + Write |
| Summary | `bash .claude/review/scripts/session-summary.sh <session>` | Read + table + mark completed + Write |

## Operations — Followup

| Operation | jq | readwrite |
|---|---|---|
| Classify | `bash .claude/review/scripts/classify-followup.sh <previous_session> <diff_file>` | Read session + parse diff manuellement |
| File context | `bash .claude/review/scripts/get-file-context.sh <session> <path>` | Read session + extraire |
| Update file | `bash .claude/review/scripts/update-followup-file.sh <session> <idx> <g> <y> <r> "<note>" "<resolution>"` | Read + update + Write |
| Add observations | `echo '<json_array>' \| bash .claude/review/scripts/add-observations.sh <session> <idx>` | Read + append + Write |
| Add comment | `bash .claude/review/scripts/add-comment.sh <session> "<file>" "<comment>"` | Read + append + Write |
| Summary | `bash .claude/review/scripts/followup-summary.sh <session>` | Read + table + mark completed + Write |

## Operations — Validation

| Operation | jq | readwrite |
|---|---|---|
| Update validation | `bash .claude/review/scripts/update-validation.sh <session> <file-path> '<decisions-json>'` | Read + enrich observations + Write |

Le champ `validation` est optionnel sur chaque observation :
```json
{"validation": {"decision": "apply|skip|escalate", "confidence": 0.XX, "reason": "justification"}}
```

Le summary agrega les decisions dans `summary.validation` :
```json
{"validation": {"apply": X, "skip": Y, "escalate": Z, "total": N}}
```

## Operations — Apply

| Operation | jq | readwrite |
|---|---|---|
| Create session | `bash .claude/review/scripts/create-apply-session.sh <source_session>` | Read source + construire JSON + Write |
| Update observation | `bash .claude/review/scripts/update-apply-observation.sh <session> <file_idx> <obs_idx> "<status>" "<change_summary>"` | Read + update + Write |
| Summary | `bash .claude/review/scripts/apply-summary.sh <session>` | Read + table + mark completed + Write |

## Operations — Config

| Operation | jq | readwrite |
|---|---|---|
| Update state | `bash .claude/review/scripts/update-config-state.sh <config> <field> <value>` | Read + update + Write |

## Platform Integration

| Operation | Command |
|---|---|
| Post summary | `bash .claude/review/scripts/post-review-comments.sh <session> <config> [manual]` |
| Post inline | `bash .claude/review/scripts/post-inline-comments.sh <session> <config> [filter]` |

Filtres inline : `blocking` (defaut), `all`, `red`, `yellow`.
Les deux scripts sont complementaires — inline ajoute des commentaires par observation, summary poste le resume global.
</session_protocol>
