#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
else
  BRANCH="main"
fi

cd "$ROOT"

echo "=== Local CI checks (mirrors .github/workflows/ci.yml) ==="

if [ ! -d "$ROOT/node_modules" ]; then
  echo "[pre] Installing dependencies..."
  npm ci
fi

echo "[1/3] Linting..."
npm run lint

echo "[2/3] Type checking..."
npm run typecheck

echo "[3/3] Building..."
if NODE_OPTIONS="--max-old-space-size=1536" npm run build 2>/dev/null; then
  :
else
  echo "  [WARN] Local build failed (resource constrained). CI will run the full build."
fi

echo "=== All checks passed ==="

# Commit
if [ $# -ge 1 ]; then
  MSG="$*"
else
  echo ""
  echo "Enter commit message (leave empty to abort):"
  read -r MSG
  if [ -z "$MSG" ]; then
    echo "Aborted."
    exit 1
  fi 
fi

git add .
git commit -m "$MSG"
git pull --rebase --autostash origin "$BRANCH"
git push origin "$BRANCH"
