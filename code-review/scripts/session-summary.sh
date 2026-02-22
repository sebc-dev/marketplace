#!/usr/bin/env bash
set -euo pipefail

# Usage: session-summary.sh <session>
# Generates markdown summary table, lists comments, marks session completed
# Stdout: markdown table ready to display

session="${1:?Usage: session-summary.sh <session>}"

if [[ ! -f "$session" ]]; then
  echo "Error: session file not found: $session" >&2
  exit 1
fi

# Generate the summary output
jq -r --arg g "🟢" --arg y "🟡" --arg r "🔴" '
  .branch as $branch |
  .summary as $s |

  "Recapitulatif de la review — \($branch)\n",
  "| # | Fichier | Categorie | \($g) | \($y) | \($r) |",
  "|---|---------|-----------|-----|-----|-----|",
  (.files[] |
    "| \(.index) | \(.path) | \(.category) | \(.green) | \(.yellow) | \(.red) |"
  ),
  "|   | **TOTAL** |           | **\($s.green)** | **\($s.yellow)** | **\($s.red)** |",
  "",
  if (.user_comments | length) > 0 then
    "### Commentaires\n",
    (.user_comments[] | "- **\(.file)** : \(.comment)")
  else
    empty
  end
' "$session"

# Mark session as completed (atomic write)
tmp="${session}.tmp"
jq '.status = "completed"' "$session" > "$tmp" && mv "$tmp" "$session"
