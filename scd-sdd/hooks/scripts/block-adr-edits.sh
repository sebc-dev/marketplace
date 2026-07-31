#!/usr/bin/env bash
# PreToolUse — immutabilité des ADR.
# Bloque (exit 2) toute édition d'un ADR final docs/adr/NNNN-*.md.
# Les candidats docs/adr/_candidates/* restent autorisés (ils seront promus à la main).
# Rappel : exit 2 = bloque ; exit 1 = erreur ignorée (ne bloquerait rien).
set -uo pipefail

input="$(cat)"
file_path="$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null || true)"

# Pas de chemin exploitable → ne rien bloquer.
[ -z "$file_path" ] && exit 0

case "$file_path" in
  */docs/adr/_candidates/*|docs/adr/_candidates/*)
    exit 0 ;;                                   # candidats : autorisés
  */docs/adr/[0-9]*|docs/adr/[0-9]*)
    echo "⛔ ADR immuable : '$file_path' ne peut pas être édité." >&2
    echo "   Un ADR accepté est superseded par un NOUVEL ADR, jamais réécrit." >&2
    echo "   Rédige un candidat dans docs/adr/_candidates/ puis promeus-le manuellement." >&2
    exit 2 ;;
esac

exit 0
