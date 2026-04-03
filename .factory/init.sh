#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d "node_modules" ]; then
  bun install
fi

if [ ! -x "node_modules/.bin/portless" ]; then
  bun install
fi

for required_env in "apps/api/.env" "apps/dashboard/.env"; do
  if [ ! -f "$required_env" ]; then
    echo "Missing required env file: $required_env" >&2
    exit 1
  fi
done
