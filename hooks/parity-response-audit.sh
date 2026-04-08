#!/bin/bash
# Parity response audit for Stop hook
# Verifies final response includes Midday source and deviation disclosure

set -e

input=$(cat)
assistant_message=$(echo "$input" | jq -r '.assistant_message // empty')
user_message=$(echo "$input" | jq -r '.user_message // empty')

# Check for parity artifact
artifact_path=".letta/runtime/parity/current-task.json"
if [ ! -f "$artifact_path" ]; then
  # No active parity task, allow
  exit 0
fi

# Read artifact status
status=$(jq -r '.status // "missing"' "$artifact_path")
if [ "$status" != "active" ]; then
  # Not an active parity task, allow
  exit 0
fi

# Parity enforcement was active - verify response
scope=$(jq -r '.scope // "missing"' "$artifact_path")
parity_mode=$(jq -r '.parityMode // "missing"' "$artifact_path")
midday_files=$(jq -r '.middayFiles[] // empty' "$artifact_path" | tr '\n' ' ')

# Check for Midday reference in response (unless no-equivalent)
if [ "$parity_mode" != "no-equivalent" ]; then
  if ! echo "$assistant_message" | grep -qiE "midday|source|counterpart|equivalent"; then
    echo "BLOCKED: Parity task was active but response does not reference Midday source." >&2
    echo "" >&2
    echo "Parity enforceent requires the final response to include:" >&2
    echo "  - Midday source file(s) used" >&2
    echo "  - Parity mode (copy/adapted/no-equivalent)" >&2
    echo "  - Deviation explanation (if adapted)" >&2
    echo "" >&2
    echo "Update your response to include this information." >&2
    exit 2
  fi
fi

# Check for deviation disclosure if adapted mode
if [ "$parity_mode" = "adapted" ]; then
  if ! echo "$assistant_message" | grep -qiE "deviation|adapt|modif|change|differ"; then
    echo "BLOCKED: parityMode is 'adapted' but response does not mention deviations." >&2
    echo "" >&2
    echo "Adapted parity work must explain what was changed and why." >&2
    exit 2
  fi
fi

# Check that no-equivalent is declared in response if that's the mode
if [ "$parity_mode" = "no-equivalent" ]; then
  if ! echo "$assistant_message" | grep -qiE "no.*(midday|equivalent|counterpart)|faworra-native|native"; then
    echo "BLOCKED: parityMode is 'no-equivalent' but response does not declare this." >&2
    echo "" >&2
    echo "When no Midday equivalent exists, explicitly state this in the response." >&2
    exit 2
  fi
fi

# Log successful parity audit
log_dir=".letta/logs"
mkdir -p "$log_dir"
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "[$timestamp] Parity audit passed: scope=$scope, mode=$parity_mode" >> "$log_dir/parity-audit.log"

exit 0
