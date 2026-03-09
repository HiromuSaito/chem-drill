#!/usr/bin/env bash
set -euo pipefail

STAGE="${STAGE:-}"

usage() {
  echo "Usage: STAGE=<stage> $0 <command>"
  echo ""
  echo "Commands:"
  echo "  pull   SST から現在の値を取得して .env.<stage> に保存"
  echo "  push   ローカルの .env.<stage> を SST に一括反映"
  echo "  init   SST のシークレットキー一覧から .env.<stage> テンプレートを生成"
  exit 1
}

require_stage() {
  if [[ -z "$STAGE" ]]; then
    echo "Error: STAGE is required (e.g., STAGE=dev $0 $1)"
    exit 1
  fi
}

cmd_pull() {
  require_stage "pull"
  local env_file=".env.${STAGE}"

  echo "Pulling secrets from SST (stage: ${STAGE})..."
  local output
  output=$(npx sst secret list --stage "$STAGE" 2>/dev/null)

  # ヘッダー行（# で始まる行）と空行を除去
  local secrets
  secrets=$(echo "$output" | grep -v '^#' | grep -v '^$' || true)

  if [[ -z "$secrets" ]]; then
    echo "No secrets found for stage: ${STAGE}"
    exit 1
  fi

  echo "$secrets" > "$env_file"
  echo "Saved to ${env_file} ($(echo "$secrets" | wc -l) secrets)"
}

# --- main ---
COMMAND="${1:-}"
case "$COMMAND" in
  pull) cmd_pull ;;
  # push) cmd_push ;;  # Task 4 で追加
  # init) cmd_init ;;  # Task 5 で追加
  *) usage ;;
esac
