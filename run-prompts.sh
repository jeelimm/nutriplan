#!/usr/bin/env bash
# run-prompts.sh
#
# Reads prompts.json, runs each prompt through Claude Code in order,
# verifies the build after each one, and commits on success.
# Retries up to 3 times with an auto-fix prompt on build failure.
# Stops early if estimated API cost exceeds $5.

set -uo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────

PROMPTS_FILE="prompts.json"
MAX_RETRIES=3
COST_LIMIT_USD=5.00

# Approximate Claude Sonnet pricing (per 1K tokens)
# Input:  $3.00 / MTok  → $0.003 / 1K
# Output: $15.00 / MTok → $0.015 / 1K
COST_PER_1K_INPUT=0.003
COST_PER_1K_OUTPUT=0.015

# ─── State ───────────────────────────────────────────────────────────────────

total_cost=0
completed_ids=()
failed_id=""
failed_description=""

# ─── Helpers ─────────────────────────────────────────────────────────────────

# Print a blank line for visual breathing room
spacer() { echo ""; }

# Estimate cost of a prompt/response pair in USD and add it to the running total.
# Approximation: 1 token ≈ 4 characters.
accumulate_cost() {
  local prompt_text="$1"
  local response_text="$2"

  local input_chars=${#prompt_text}
  local output_chars=${#response_text}

  local input_tokens=$(( input_chars / 4 ))
  local output_tokens=$(( output_chars / 4 ))

  # bc for floating-point arithmetic
  local added
  added=$(echo "scale=6; ($input_tokens / 1000 * $COST_PER_1K_INPUT) + ($output_tokens / 1000 * $COST_PER_1K_OUTPUT)" | bc)
  total_cost=$(echo "scale=6; $total_cost + $added" | bc)
}

# Return 0 if total_cost is still within the limit, non-zero otherwise.
within_cost_limit() {
  # bc prints 1 if the expression is true
  local ok
  ok=$(echo "$total_cost < $COST_LIMIT_USD" | bc)
  [ "$ok" -eq 1 ]
}

# ─── Dependency checks ───────────────────────────────────────────────────────

echo "🔍 Checking dependencies..."

for cmd in claude npm git jq bc; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌  Required command not found: $cmd"
    echo "    Install it and try again."
    exit 1
  fi
done

if [ ! -f "$PROMPTS_FILE" ]; then
  echo "❌  $PROMPTS_FILE not found in the current directory."
  exit 1
fi

echo "✅  All dependencies found."
spacer

# ─── Parse prompts.json ──────────────────────────────────────────────────────

FEATURE=$(jq -r '.feature' "$PROMPTS_FILE")
BRANCH=$(jq -r '.branch' "$PROMPTS_FILE")
PROMPT_COUNT=$(jq '.prompts | length' "$PROMPTS_FILE")

echo "📋  Feature : $FEATURE"
echo "🌿  Branch  : $BRANCH"
echo "📝  Prompts : $PROMPT_COUNT"
echo "💰  Cost cap: \$$COST_LIMIT_USD"
spacer

# ─── Branch setup ────────────────────────────────────────────────────────────

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" = "$BRANCH" ]; then
  echo "🌿  Already on branch: $BRANCH"
elif git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "🌿  Switching to existing branch: $BRANCH"
  git checkout "$BRANCH"
else
  echo "🌿  Creating new branch: $BRANCH (from $CURRENT_BRANCH)"
  git checkout -b "$BRANCH"
fi
spacer

# ─── Main loop ───────────────────────────────────────────────────────────────

for (( i=0; i<PROMPT_COUNT; i++ )); do
  PROMPT_ID=$(jq -r ".prompts[$i].id" "$PROMPTS_FILE")
  DESCRIPTION=$(jq -r ".prompts[$i].description" "$PROMPTS_FILE")
  PROMPT_TEXT=$(jq -r ".prompts[$i].prompt" "$PROMPTS_FILE")

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🚀  Running prompt $((i+1))/$PROMPT_COUNT  [id: $PROMPT_ID]"
  echo "📄  $DESCRIPTION"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # ── Cost guard ────────────────────────────────────────────────────────────
  if ! within_cost_limit; then
    echo ""
    echo "💸  Estimated cost \$$total_cost has exceeded the \$$COST_LIMIT_USD limit."
    echo "    Stopping before prompt #$PROMPT_ID to avoid overspend."
    failed_id="$PROMPT_ID"
    failed_description="$DESCRIPTION (cost limit reached)"
    break
  fi

  # ── Run the prompt ────────────────────────────────────────────────────────
  # --dangerously-skip-permissions auto-approves all Claude Code permission
  # prompts (file reads, writes, shell commands) without pausing for input.
  # This is intentionally safe here because:
  #   1. We always operate on a dedicated feature branch, never main.
  #   2. Every change is validated by `npm run build` before being committed.
  #   3. Failures trigger a capped retry loop (MAX_RETRIES) — not open-ended edits.
  #   4. A cost ceiling ($COST_LIMIT_USD) bounds the total number of Claude calls.
  echo ""
  echo "🤖  Sending prompt to Claude Code..."
  RESPONSE=$(claude --print --dangerously-skip-permissions -p "$PROMPT_TEXT" 2>&1) || true
  accumulate_cost "$PROMPT_TEXT" "$RESPONSE"
  printf "💰  Estimated total cost so far: \$%.4f\n" "$total_cost"

  # ── Build verification + retry loop ──────────────────────────────────────
  attempt=0
  build_ok=false

  while [ $attempt -lt $MAX_RETRIES ]; do
    attempt=$(( attempt + 1 ))

    if [ $attempt -eq 1 ]; then
      echo ""
      echo "🔨  Verifying build..."
    else
      echo ""
      echo "🔨  Retry $attempt/$MAX_RETRIES — verifying build..."
    fi

    BUILD_OUTPUT=$(npm run build 2>&1)
    BUILD_EXIT=$?

    if [ $BUILD_EXIT -eq 0 ]; then
      build_ok=true
      echo "✅  Build passed!"
      break
    fi

    echo "❌  Build failed (attempt $attempt/$MAX_RETRIES)."

    if [ $attempt -ge $MAX_RETRIES ]; then
      # No more retries left — exit the retry loop
      break
    fi

    # Cost guard before each fix attempt
    if ! within_cost_limit; then
      echo ""
      echo "💸  Cost limit reached mid-retry. Stopping."
      failed_id="$PROMPT_ID"
      failed_description="$DESCRIPTION (cost limit during fix retry)"
      break 2  # Break out of both the retry loop and the prompt loop
    fi

    # Send a fix prompt to Claude
    FIX_PROMPT="The build failed with the following error:

$BUILD_OUTPUT

Fix the issue while following CLAUDE.md guidelines."

    echo ""
    echo "🛠️   Asking Claude to fix the build error..."
    FIX_RESPONSE=$(claude --print --dangerously-skip-permissions -p "$FIX_PROMPT" 2>&1) || true
    accumulate_cost "$FIX_PROMPT" "$FIX_RESPONSE"
    printf "💰  Estimated total cost so far: \$%.4f\n" "$total_cost"
  done

  # ── Handle permanent build failure ───────────────────────────────────────
  if [ "$build_ok" = false ]; then
    echo ""
    echo "🛑  Prompt #$PROMPT_ID failed after $MAX_RETRIES attempt(s). Stopping."
    failed_id="$PROMPT_ID"
    failed_description="$DESCRIPTION"
    break
  fi

  # ── Commit on success ─────────────────────────────────────────────────────
  echo ""
  echo "💾  Committing changes..."
  git add -A
  git commit -m "prompt #${PROMPT_ID}: ${DESCRIPTION}" || {
    echo "ℹ️   Nothing to commit for prompt #$PROMPT_ID (working tree clean)."
  }

  completed_ids+=("$PROMPT_ID")
  spacer
done

# ─── Push ────────────────────────────────────────────────────────────────────

if [ ${#completed_ids[@]} -gt 0 ]; then
  echo "📤  Pushing branch $BRANCH to remote..."
  git push -u origin "$BRANCH" && echo "✅  Push successful." || echo "⚠️   Push failed — check your remote and permissions."
  spacer
fi

# ─── Summary ─────────────────────────────────────────────────────────────────

echo "╔══════════════════════════════════════════════════════╗"
echo "║                    RUN SUMMARY                       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

if [ ${#completed_ids[@]} -gt 0 ]; then
  echo "✅  Completed prompts: ${completed_ids[*]}"
else
  echo "✅  Completed prompts: none"
fi

if [ -n "$failed_id" ]; then
  echo "❌  Failed at prompt #$failed_id: $failed_description"
else
  echo "🎉  All $PROMPT_COUNT prompt(s) completed successfully!"
fi

printf "💰  Total estimated API cost: \$%.4f\n" "$total_cost"
echo ""
