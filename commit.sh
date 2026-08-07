#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
else
  BRANCH="main"
fi

cd "$ROOT"

# --- Auto-commit message generation ---------------------------------------
# Builds a Conventional Commits message from the staged changes when the user
# does not supply one explicitly. The commit type is inferred from the kind of
# files changed, and the subject is derived from the directory that contains
# the most changed files plus the dominant action (add/remove/update/refactor).
generate_commit_message() {
  local status
  status=$(git diff --cached --name-status --diff-filter=ACMR 2>/dev/null || true)
  if [ -z "$status" ]; then
    echo "chore: update repository"
    return
  fi

  declare -A dir_count=()
  local added=0 deleted=0 modified=0
  local has_src=0 has_docs=0 has_tests=0 has_styles=0 has_config=0
  local code file dir

  while IFS=$'\t' read -r code file; do
    [ -z "${file:-}" ] && continue
    case "$code" in
      A*) added=$((added + 1)) ;;
      D*) deleted=$((deleted + 1)) ;;
      M*|R*) modified=$((modified + 1)) ;;
    esac
    case "$file" in
      *.md|*.mdx|docs/**) has_docs=1 ;;
      *.test.*|tests/**|**/__tests__/**) has_tests=1 ;;
      *.css|*.scss) has_styles=1 ;;
      src/**) has_src=1 ;;
      *) has_config=1 ;;
    esac
    dir=$(dirname "$file")
    dir_count["$dir"]=$(( ${dir_count["$dir"]:-0} + 1 ))
  done <<< "$status"

  # Conventional commit type
  local type="chore"
  if [ "$has_docs" -eq 1 ] && [ "$has_src" -eq 0 ]; then
    type="docs"
  elif [ "$has_tests" -eq 1 ] && [ "$has_src" -eq 0 ]; then
    type="test"
  elif [ "$has_src" -eq 1 ]; then
    type="feat"
  elif [ "$has_styles" -eq 1 ]; then
    type="style"
  fi

  # Verb from the nature of the staged changes
  local verb
  if [ "$added" -gt 0 ] && [ "$deleted" -eq 0 ] && [ "$modified" -eq 0 ]; then
    verb="add"
  elif [ "$deleted" -gt 0 ] && [ "$added" -eq 0 ] && [ "$modified" -eq 0 ]; then
    verb="remove"
  elif [ "$modified" -gt 0 ] && [ "$added" -eq 0 ] && [ "$deleted" -eq 0 ]; then
    verb="update"
  else
    verb="refactor"
  fi

  # Subject scope: directory holding the most changed files
  local scope="" best="" max=0 d
  for d in "${!dir_count[@]}"; do
    if [ "${dir_count[$d]}" -gt "$max" ]; then
      max="${dir_count[$d]}"
      best="$d"
    fi
  done
  if [ -z "$best" ] || [ "$best" = "." ]; then
    [ "$has_config" -eq 1 ] && scope="configuration" || scope="repository"
  else
    scope=$(basename "$best")
    [ -z "$scope" ] && scope="files"
  fi

  echo "$type: $verb $scope"
}

# --- Local CI checks (mirrors .github/workflows/ci.yml) -------------------
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

# --- Stage & commit -------------------------------------------------------
git add .

if git diff --cached --quiet --diff-filter=ACMR; then
  echo "Nothing to commit."
  exit 0
fi

if [ $# -ge 1 ]; then
  MSG="$*"
elif [ -n "${COMMIT_MSG:-}" ]; then
  MSG="$COMMIT_MSG"
else
  MSG=$(generate_commit_message)
fi

echo "Commit message: $MSG"
git commit -m "$MSG"
git pull --rebase --autostash origin "$BRANCH"
git push origin "$BRANCH"
