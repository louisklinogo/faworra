#!/bin/bash
# Parity reminder for UserPromptSubmit
# Injects a reminder when parity work is detected in the user's prompt

input=$(cat)
user_message=$(echo "$input" | jq -r '.user_message // empty')

# Parity signal keywords
parity_signals="midday|parity|copy|mirror|match|transactions|sheets|filters|dashboard|onboarding"

# Check if user message contains parity signals
if echo "$user_message" | grep -qiE "$parity_signals"; then
  # Output additional context for the agent
  cat <<EOF
{
  "additionalContext": "MIDDAY-FIRST ENFORCEMENT ACTIVE\n\nFor parity-sensitive work:\n- Establish Midday source mapping before edits\n- Use literal copy-first parity\n- Declare deviations explicitly\n- Update parity artifact at .letta/runtime/parity/current-task.json\n\nProtected scopes require parity artifact:\n- apps/dashboard/src/components/**\n- apps/dashboard/src/app/**\n- apps/dashboard/src/hooks/**\n- packages/ui/src/components/**\n\nSee docs/policies/midday-parity-enforcement.md for full policy."
}
EOF
fi

exit 0
