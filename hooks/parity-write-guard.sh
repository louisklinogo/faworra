#!/bin/bash
# Parity write guard for PreToolUse (Edit|Write)
# Blocks edits to protected files unless parity artifact exists and is complete

set -e

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')

# Only check Edit and Write tools
if [ "$tool_name" != "Edit" ] && [ "$tool_name" != "Write" ]; then
  exit 0
fi

# Skip if no file path
if [ -z "$file_path" ]; then
  exit 0
fi

# Parity-sensitive directories (relative to repo root)
# Based on Midday architecture from .references/midday-wiki
#
# Dashboard Application (UI and routing):
# - components/canvas, charts, forms, modals, sheets, tables, widgets, metrics
# - components/sidebar, main-menu, desktop-header, mobile-menu, user-menu
# - store, hooks, utils, lib (state management and utilities)
# - app/[locale] (routing structure)
# - middleware.ts, actions (auth and routing)
#
# API Application (apps/api):
# - All routers, context, queries - Midday-style tRPC patterns
#
# Packages (all Midday-derived):
# - packages/ui (shared UI primitives)
# - packages/db (schema, queries, team-scoped patterns)
# - packages/auth (Better Auth config - adapted from Midday auth patterns)
# - packages/banking (banking integration)
# - packages/accounting (accounting logic)
# - packages/categories (category management)
# - packages/location (location data)
# - packages/plans (subscription plans)
# - packages/config (configuration)
# - packages/env (environment)
#
# Mobile App (Phase 2):
# - apps/mobile/src - will follow Midday patterns when developed
#
protected_dirs=(
  # === DASHBOARD APP ===
  # Dashboard UI components
  "apps/dashboard/src/components"
  # Dashboard routing and pages
  "apps/dashboard/src/app"
  # Dashboard state management
  "apps/dashboard/src/store"
  # Dashboard hooks
  "apps/dashboard/src/hooks"
  # Dashboard utilities
  "apps/dashboard/src/utils"
  # Dashboard design system
  "apps/dashboard/src/lib"
  # Dashboard middleware (auth/routing)
  "apps/dashboard/src/middleware.ts"
  # Dashboard actions (server actions)
  "apps/dashboard/src/actions"
  # Dashboard trpc client
  "apps/dashboard/src/trpc"

  # === API APP ===
  # API app - all source (routers, context, middleware)
  "apps/api/src"

  # === MOBILE APP (Phase 2) ===
  # Mobile app - will follow Midday patterns
  "apps/mobile/src"

  # === SHARED PACKAGES ===
  # Shared UI package
  "packages/ui/src"
  # Database package (schema, queries, client)
  "packages/db/src"
  # Auth package (Better Auth config)
  "packages/auth/src"
  # API package (tRPC routers, context)
  "packages/api/src"
  # Banking integration
  "packages/banking/src"
  # Accounting logic
  "packages/accounting/src"
  # Category management
  "packages/categories/src"
  # Location data
  "packages/location/src"
  # Subscription plans
  "packages/plans/src"
  # Configuration
  "packages/config"
  # Environment
  "packages/env/src"
)

# Check if file is in protected scope
is_protected=false
for dir in "${protected_dirs[@]}"; do
  if [[ "$file_path" == *"$dir"* ]]; then
    is_protected=true
    break
  fi
done

# If not in protected scope, allow
if [ "$is_protected" = false ]; then
  exit 0
fi

# Check for parity artifact
artifact_path=".letta/runtime/parity/current-task.json"
if [ ! -f "$artifact_path" ]; then
  echo "BLOCKED: File '$file_path' is in a parity-protected scope." >&2
  echo "" >&2
  echo "Midday-first enforcement requires a parity artifact before editing." >&2
  echo "" >&2
  echo "Create artifact at: .letta/runtime/parity/current-task.json" >&2
  echo "Required fields: taskId, scope, parityMode, middayFiles, faworraFiles" >&2
  echo "" >&2
  echo "See: docs/policies/midday-parity-enforcement.md" >&2
  exit 2
fi

# Validate artifact completeness
status=$(jq -r '.status // "missing"' "$artifact_path")
scope=$(jq -r '.scope // "missing"' "$artifact_path")
parity_mode=$(jq -r '.parityMode // "missing"' "$artifact_path")
midday_files_count=$(jq '.middayFiles | length // 0' "$artifact_path")
faworra_files_count=$(jq '.faworraFiles | length // 0' "$artifact_path")
deviations_count=$(jq '.deviations | length // 0' "$artifact_path")

# Check status is active
if [ "$status" != "active" ]; then
  echo "BLOCKED: Parity artifact status is '$status' (must be 'active')." >&2
  exit 2
fi

# Check scope is parity-critical or parity-adjacent
if [ "$scope" != "parity-critical" ] && [ "$scope" != "parity-adjacent" ]; then
  echo "BLOCKED: Parity artifact scope is '$scope' (must be 'parity-critical' or 'parity-adjacent' for protected files)." >&2
  exit 2
fi

# Check parity mode is valid
if [ "$parity_mode" != "copy" ] && [ "$parity_mode" != "adapted" ] && [ "$parity_mode" != "no-equivalent" ]; then
  echo "BLOCKED: Invalid parityMode '$parity_mode' (must be 'copy', 'adapted', or 'no-equivalent')." >&2
  exit 2
fi

# Check Midday files are mapped (unless no-equivalent)
if [ "$parity_mode" != "no-equivalent" ] && [ "$midday_files_count" -eq 0 ]; then
  echo "BLOCKED: No Midday source files mapped in parity artifact." >&2
  echo "parityMode is '$parity_mode' but middayFiles is empty." >&2
  exit 2
fi

# Check Faworra files are declared
if [ "$faworra_files_count" -eq 0 ]; then
  echo "BLOCKED: No Faworra target files declared in parity artifact." >&2
  exit 2
fi

# Check if this file is in the declared Faworra files
# Extract just the filename portion for matching
filename=$(basename "$file_path")
faworra_files=$(jq -r '.faworraFiles[]' "$artifact_path" 2>/dev/null || true)
file_declared=false
if echo "$faworra_files" | grep -q "$filename"; then
  file_declared=true
fi

if [ "$file_declared" = false ]; then
  echo "WARNING: File '$file_path' is not declared in parity artifact faworraFiles." >&2
  echo "Consider updating the artifact or verifying this is the correct target." >&2
  # Warning only, not blocking
fi

# Check deviations are declared if adapted mode
if [ "$parity_mode" = "adapted" ] && [ "$deviations_count" -eq 0 ]; then
  echo "BLOCKED: parityMode is 'adapted' but no deviations declared." >&2
  echo "Document what changed and why in the deviations array." >&2
  exit 2
fi

# All checks passed
exit 0
