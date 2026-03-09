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

cmd_push() {
  require_stage "push"
  local env_file=".env.${STAGE}"

  if [[ ! -f "$env_file" ]]; then
    echo "Error: ${env_file} not found"
    exit 1
  fi

  echo "Comparing local ${env_file} with SST (stage: ${STAGE})..."

  # SST から現在の値を取得
  local remote
  remote=$(npx sst secret list --stage "$STAGE" 2>/dev/null | grep -v '^#' | grep -v '^$' || true)

  # 差分を表示
  local diff_output
  diff_output=$(diff <(echo "$remote" | sort) <(sort "$env_file") || true)

  if [[ -z "$diff_output" ]]; then
    echo "No differences found. Nothing to push."
    exit 0
  fi

  echo ""
  echo "=== Diff (SST → Local) ==="
  echo "$diff_output"
  echo "==========================="
  echo ""

  # 確認プロンプト
  read -r -p "Push these changes to SST? [y/N] " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi

  # .env ファイルの各行を SST に反映
  local count=0
  while IFS='=' read -r key value; do
    # 空行とコメント行をスキップ
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    echo "Setting ${key}..."
    npx sst secret set "$key" "$value" --stage "$STAGE"
    ((count++))
  done < "$env_file"

  echo "Done. ${count} secrets pushed to SST (stage: ${STAGE})."
}

# --- main ---
COMMAND="${1:-}"
case "$COMMAND" in
  pull) cmd_pull ;;
  push) cmd_push ;;
  # init) cmd_init ;;  # Task 5 で追加
  *) usage ;;
esac
