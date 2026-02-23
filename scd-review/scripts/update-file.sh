#!/usr/bin/env bash
set -euo pipefail

# Usage: update-file.sh <session> <index> <green> <yellow> <red> "<note>"
# Marks a file as completed and recalculates summary by aggregation
# Stdout: updated summary JSON

session="${1:?Usage: update-file.sh <session> <index> <green> <yellow> <red> \"<note>\"}"
index="${2:?Missing index}"
green="${3:?Missing green count}"
yellow="${4:?Missing yellow count}"
red="${5:?Missing red count}"
note="${6:?Missing note}"

if [[ ! -f "$session" ]]; then
  echo "Error: session file not found: $session" >&2
  exit 1
fi

tmp="${session}.tmp"
jq --argjson idx "$index" \
   --argjson g "$green" \
   --argjson y "$yellow" \
   --argjson r "$red" \
   --arg note "$note" '
  (.files[] | select(.index == $idx)) |= (
    .status = "completed" |
    .green = $g |
    .yellow = $y |
    .red = $r |
    .note = $note
  ) |
  .summary.completed = ([.files[] | select(.status == "completed")] | length) |
  .summary.green = ([.files[].green] | add // 0) |
  .summary.yellow = ([.files[].yellow] | add // 0) |
  .summary.red = ([.files[].red] | add // 0)
' "$session" > "$tmp" && mv "$tmp" "$session"

# Output the updated summary
jq '.summary' "$session"
