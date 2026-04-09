---
title: Hooks | Letta Docs
description: Run custom scripts at key points in the agent lifecycle
---

Hooks let you run custom scripts at key points during Letta Code’s execution. Use them to enforce policies, automate workflows, or integrate with external tools.

## Hook Lifecycle

Hooks fire at specific points during a Letta Code session:

| Hook                 | When it fires                               | Can block? |
| -------------------- | ------------------------------------------- | ---------- |
| `PreToolUse`         | Before tool execution                       | Yes        |
| `PostToolUse`        | After tool completes successfully           | No         |
| `PostToolUseFailure` | After tool fails (stderr fed back to agent) | No         |
| `PermissionRequest`  | When permission dialog appears              | Yes        |
| `UserPromptSubmit`   | User submits a prompt                       | Yes        |
| `Notification`       | Letta Code sends a notification             | No         |
| `Stop`               | Agent finishes responding                   | Yes        |
| `SubagentStop`       | Subagent task completes                     | Yes        |
| `PreCompact`         | Before context compaction                   | No         |
| `SessionStart`       | Session begins or resumes                   | No         |
| `SessionEnd`         | Session terminates                          | No         |

## Configuration

Hooks are configured in your settings files. Letta Code checks three locations (in priority order):

1. `.letta/settings.local.json` - Local project settings (not committed)
2. `.letta/settings.json` - Project settings (can commit to share with team)
3. `~/.letta/settings.json` - User global settings

Hooks from all locations are merged, with local hooks running first.

### Structure

Tool-related hooks (`PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`) use matchers to specify which tools to target:

.letta/settings.json

```
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/validate-bash.sh"
          }
        ]
      }
    ]
  }
}
```

Simple hooks (`Stop`, `Notification`, etc.) don’t need matchers:

.letta/settings.json

```
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/run-on-stop.sh"
          }
        ]
      }
    ]
  }
}
```

### Matcher Patterns

| Pattern         | Matches                            |
| --------------- | ---------------------------------- |
| `"Bash"`        | Exact tool name                    |
| `"Edit\|Write"` | Multiple tools (regex alternation) |
| `"Notebook.*"`  | Regex pattern                      |
| `"*"` or `""`   | All tools                          |

### Managing Hooks

Use the `/hooks` command to view and manage your hook configuration interactively.

## Hook types

Letta Code supports two types of hooks: **command hooks** that run shell scripts, and **prompt hooks** that use an LLM to evaluate actions.

### Command hooks

Command hooks execute shell scripts and use exit codes to allow or block actions. This is the default hook type, covered in detail in the [Writing hooks](#writing-hooks) section below.

```
{
  "type": "command",
  "command": "./hooks/validate-bash.sh",
  "timeout": 60000
}
```

### Prompt hooks

Prompt hooks send the hook input to an LLM for evaluation instead of running a shell script. The LLM decides whether to allow or block the action based on your prompt.

```
{
  "type": "prompt",
  "prompt": "Block any Bash commands that modify files outside the src/ directory. Only allow read operations on system files.",
  "model": "haiku",
  "timeout": 30000
}
```

| Field     | Required | Description                                             |
| --------- | -------- | ------------------------------------------------------- |
| `type`    | Yes      | Must be `"prompt"`                                      |
| `prompt`  | Yes      | Instructions for the LLM to evaluate the action         |
| `model`   | No       | Model to use for evaluation (defaults to agent’s model) |
| `timeout` | No       | Timeout in milliseconds (default: 30000)                |

Use `$ARGUMENTS` in your prompt to reference the hook input JSON. If omitted, the input is appended automatically.

Prompt hooks are shown with a `✦` indicator in the `/hooks` manager.

**Supported events:** `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `UserPromptSubmit`, `Stop`, `SubagentStop`

**Example: Block dangerous operations with natural language**

.letta/settings.json

```
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Block any commands that delete files, modify system configuration, or access sensitive directories like /etc or ~/.ssh. Allow normal development commands.",
            "model": "haiku"
          }
        ]
      }
    ]
  }
}
```

## Writing Hooks

### Input Format

Hooks receive JSON data via stdin containing context about the event:

```
{
  "event_type": "PreToolUse",
  "working_directory": "/path/to/project",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  }
}
```

The exact fields vary by event type. Tool-related events include `tool_name` and `tool_input`. Session events include agent and conversation IDs.

#### Reasoning and Message Context

`PostToolUse` and `Stop` hooks include the agent’s reasoning and messages that led to the action:

**PostToolUse** includes:

- `preceding_reasoning` - the agent’s thinking that led to the tool call
- `preceding_assistant_message` - any assistant text before the tool call

**Stop** includes:

- `preceding_reasoning` - the agent’s thinking that led to the final response
- `assistant_message` - the agent’s final message to the user
- `user_message` - the user’s original prompt that started this turn

Example Stop hook input:

```
{
  "event_type": "Stop",
  "stop_reason": "end_turn",
  "preceding_reasoning": "The user asked about the project structure. I should summarize what I found.",
  "assistant_message": "Here's an overview of the project structure...",
  "user_message": "What does this project look like?"
}
```

This enables logging, analysis, and automation based on agent reasoning.

### Exit Codes

| Exit Code | Behavior                                               |
| --------- | ------------------------------------------------------ |
| `0`       | Success - action proceeds normally                     |
| `1`       | Non-blocking error - logged, action continues          |
| `2`       | Blocking error - action stopped, stderr shown to agent |

For blocking hooks (`PreToolUse`, `PermissionRequest`, `Stop`, etc.), exit code 2 prevents the action and sends your stderr message to the agent as feedback.

### Additional context injection

`PostToolUse` hooks that exit with code 0 can inject additional context into the agent’s conversation by printing JSON to stdout. The JSON should contain an `additionalContext` field (either at the top level or nested under `hookSpecificOutput`):

```
{
  "additionalContext": "The tests passed but code coverage dropped to 72%."
}
```

Or:

```
{
  "hookSpecificOutput": {
    "additionalContext": "Lint warnings found in the changed files."
  }
}
```

The `additionalContext` string is fed back to the agent as context after the tool completes. Non-JSON stdout is ignored.

#### Where hook feedback is injected

- `PostToolUse` `additionalContext` is injected as hook feedback after the tool call completes.
- `UserPromptSubmit` hook feedback is injected as a `<system-reminder>` for that turn.

Hook feedback is turn context, not a memory block write.

Hook feedback is injected for the current turn, but it can still appear in conversation history for that turn. It is not an in-place replacement mechanism for previous messages.

#### Real-time machine state pattern

For continuously changing context (for example foreground window, running processes, active app), prefer a pull-based pattern:

1. Run a local watcher that updates a single snapshot source (such as `runtime_state.json`).
2. Expose a custom tool (for example `get_runtime_state`) that reads the latest snapshot on demand.
3. Have the agent call that tool when needed, instead of injecting repeated chat context.

This keeps context fresh without continuously adding stale copies to the transcript.

### Timeouts

Hooks have a default timeout of 60 seconds. You can configure a custom timeout per hook:

```
{
  "type": "command",
  "command": "./hooks/slow-check.sh",
  "timeout": 120000
}
```

Timeout is specified in milliseconds.

## Examples

### Block dangerous commands

Prevent `rm -rf` commands while still allowing the agent to work autonomously:

hooks/block-rm-rf.sh

```
#!/bin/bash
# Block dangerous rm -rf commands


input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')


# Only check Bash commands
if [ "$tool_name" != "Bash" ]; then
  exit 0
fi


command=$(echo "$input" | jq -r '.tool_input.command')


# Check for rm -rf pattern
if echo "$command" | grep -qE 'rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)'; then
  echo "Blocked: rm -rf commands must be run manually." >&2
  exit 2
fi


exit 0
```

.letta/settings.json

```
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/block-rm-rf.sh"
          }
        ]
      }
    ]
  }
}
```

### Auto-fix on changes

Run linting automatically after the agent makes changes:

hooks/fix-on-changes.sh

```
#!/bin/bash
# Run bun run fix if there are uncommitted changes


# Check if there are any uncommitted changes
if git diff --quiet HEAD 2>/dev/null; then
    echo "No changes, skipping."
    exit 0
fi


# Run fix - capture output and send to stderr on failure
output=$(bun run fix 2>&1)
exit_code=$?


if [ $exit_code -eq 0 ]; then
    echo "$output"
    exit 0
else
    echo "$output" >&2
    exit 2
fi
```

.letta/settings.json

```
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/fix-on-changes.sh"
          }
        ]
      }
    ]
  }
}
```

**Blocking Stop hooks** - When a Stop hook exits with code 2, the agent receives the stderr output and continues working. This is useful for automated quality checks.

### Type checking on changes

Similar to linting, run type checking after changes:

hooks/typecheck-on-changes.sh

```
#!/bin/bash
# Run typecheck if there are uncommitted changes


if git diff --quiet HEAD 2>/dev/null; then
    echo "No changes, skipping."
    exit 0
fi


output=$(tsc --noEmit --pretty 2>&1)
exit_code=$?


if [ $exit_code -eq 0 ]; then
    echo "$output"
    exit 0
else
    echo "$output" >&2
    exit 2
fi
```

### Log agent reasoning

Capture agent reasoning and responses to a log file for analysis:

hooks/log-reasoning.sh

```
#!/bin/bash
# Log agent reasoning and responses


input=$(cat)
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
event_type=$(echo "$input" | jq -r '.event_type')
reasoning=$(echo "$input" | jq -r '.preceding_reasoning // empty')
message=$(echo "$input" | jq -r '.assistant_message // empty')


log_file="${HOME}/.letta/reasoning.log"


if [ -n "$reasoning" ] || [ -n "$message" ]; then
  echo "=== $timestamp ($event_type) ===" >> "$log_file"
  [ -n "$reasoning" ] && echo "Reasoning: $reasoning" >> "$log_file"
  [ -n "$message" ] && echo "Message: $message" >> "$log_file"
  echo "" >> "$log_file"
fi


exit 0
```

.letta/settings.json

```
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/log-reasoning.sh"
          }
        ]
      }
    ]
  }
}
```

### Desktop notifications

Get notified when Letta Code needs attention (macOS):

hooks/desktop-notification.sh

```
#!/bin/bash
# Send desktop notification using osascript (macOS)


input=$(cat)
message=$(echo "$input" | jq -r '.message')
level=$(echo "$input" | jq -r '.level')


if [ "$level" = "error" ]; then
  osascript -e "display notification \"$message\" with title \"Letta Code\" subtitle \"Error\""
elif [ "$level" = "warning" ]; then
  osascript -e "display notification \"$message\" with title \"Letta Code\" subtitle \"Warning\""
else
  osascript -e "display notification \"$message\" with title \"Letta Code\""
fi


exit 0
```

.letta/settings.json

```
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/desktop-notification.sh"
          }
        ]
      }
    ]
  }
}
```
