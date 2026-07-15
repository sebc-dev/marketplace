#!/usr/bin/env bash
# PostToolUse — format + lint après Edit|Write.
# Non bloquant (PostToolUse) : formate/lint le fichier édité si les commandes du projet
# sont renseignées. Remplace les placeholders par les commandes réelles (voir CLAUDE.md).
set -uo pipefail

# TODO(projet) : renseigner les commandes réelles (laisser vide = no-op).
FORMAT_CMD=""   # ex: "prettier --write"  |  "gofmt -w"  |  "ruff format"
LINT_CMD=""     # ex: "eslint --fix"      |  "ruff check --fix"

input="$(cat)"
file_path="$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null || true)"
[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

[ -n "$FORMAT_CMD" ] && $FORMAT_CMD "$file_path" >/dev/null 2>&1 || true
[ -n "$LINT_CMD" ]   && $LINT_CMD   "$file_path" >/dev/null 2>&1 || true

exit 0
