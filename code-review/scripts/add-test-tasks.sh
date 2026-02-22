#!/usr/bin/env bash
set -euo pipefail

# Usage: add-test-tasks.sh <session> '<json_object>'
# Merges test_agent_tasks into the session
# Stdout: number of tasks added

session="${1:?Usage: add-test-tasks.sh <session> '<json_object>'}"
json_obj="${2:?Missing json_object}"

if [[ ! -f "$session" ]]; then
  echo "Error: session file not found: $session" >&2
  exit 1
fi

tmp="${session}.tmp"
jq --argjson tasks "$json_obj" '
  .test_agent_tasks = ((.test_agent_tasks // {}) + $tasks)
' "$session" > "$tmp" && mv "$tmp" "$session"

echo "$json_obj" | jq 'length'
