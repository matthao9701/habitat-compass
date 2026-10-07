#!/bin/bash
set -Eeuo pipefail

WORKSPACE_PATH="${WORKSPACE_PATH:-$(pwd)}"
cd "${WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --frozen-lockfile --prefer-offline
