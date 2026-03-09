# SST シークレット同期スクリプト Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Makefile + シェルスクリプトで SST シークレットの一括管理（push/pull/init）を実現する

**Architecture:** Makefile をエントリポイントとし、実際のロジックは `scripts/secrets.sh` に集約。`.env.<stage>` ファイルでローカルにシークレットを管理し、SST との同期を行う。

**Tech Stack:** Makefile, Bash, SST CLI (`npx sst secret`)

---

### Task 1: `.env.dev.example` の作成

**Files:**

- Create: `.env.dev.example`

**Step 1: ファイルを作成**

```bash
# .env.dev.example
DatabaseUrl=
GeminiApiKey=
BetterAuthSecret=
SesFromEmail=
BasicAuthUser=
BasicAuthPassword=
```

注意: SST のシークレットキー名は PascalCase（`sst.config.ts:60-65` 参照）。`.env` だが `KEY=VALUE` ではなく `PascalCaseKey=VALUE` の形式。

**Step 2: コミット**

```bash
git add .env.dev.example
git commit -m "chore: add .env.dev.example template for SST secrets"
```

---

### Task 2: `.gitignore` に `!.env.*.example` を追加

**Files:**

- Modify: `.gitignore:8-9`

**Step 1: `.gitignore` を編集**

既存:

```
.env.*
!.env.example
```

変更後:

```
.env.*
!.env.example
!.env.*.example
```

**Step 2: `.env.dev.example` が追跡されていることを確認**

Run: `git status`
Expected: `.env.dev.example` が untracked にならないこと（Task 1 でコミット済みのため、変更なし）

**Step 3: コミット**

```bash
git add .gitignore
git commit -m "chore: allow .env.*.example files in gitignore"
```

---

### Task 3: `scripts/secrets.sh` の作成 — pull サブコマンド

**Files:**

- Create: `scripts/secrets.sh`

**Step 1: `scripts/secrets.sh` を作成（pull サブコマンドのみ）**

```bash
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
  push) cmd_push ;;
  init) cmd_init ;;
  *) usage ;;
esac
```

注意: この時点では push/init は未実装。case 文には含めるが関数定義は次のタスクで追加する。
→ 実際にはこの時点では case 文の push/init はコメントアウトしておき、Task 4, 5 で追加する。

修正版の main セクション:

```bash
# --- main ---
COMMAND="${1:-}"
case "$COMMAND" in
  pull) cmd_pull ;;
  # push) cmd_push ;;  # Task 4 で追加
  # init) cmd_init ;;  # Task 5 で追加
  *) usage ;;
esac
```

**Step 2: 実行権限を付与**

```bash
chmod +x scripts/secrets.sh
```

**Step 3: コミット**

```bash
git add scripts/secrets.sh
git commit -m "feat: add secrets.sh with pull subcommand"
```

---

### Task 4: `scripts/secrets.sh` — push サブコマンドの追加

**Files:**

- Modify: `scripts/secrets.sh`

**Step 1: `cmd_push` 関数を追加（`cmd_pull` の後に配置）**

```bash
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
```

**Step 2: case 文の push コメントアウトを解除**

```bash
  push) cmd_push ;;
```

**Step 3: コミット**

```bash
git add scripts/secrets.sh
git commit -m "feat: add push subcommand to secrets.sh"
```

---

### Task 5: `scripts/secrets.sh` — init サブコマンドの追加

**Files:**

- Modify: `scripts/secrets.sh`

**Step 1: `cmd_init` 関数を追加（`cmd_push` の後に配置）**

```bash
cmd_init() {
  require_stage "init"
  local env_file=".env.${STAGE}"

  if [[ -f "$env_file" ]]; then
    read -r -p "${env_file} already exists. Overwrite? [y/N] " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      echo "Aborted."
      exit 0
    fi
  fi

  echo "Fetching secret keys from SST (stage: ${STAGE})..."
  local output
  output=$(npx sst secret list --stage "$STAGE" 2>/dev/null)

  local template
  template=$(echo "$output" | grep -v '^#' | grep -v '^$' | sed 's/=.*/=/' || true)

  if [[ -z "$template" ]]; then
    echo "No secrets found for stage: ${STAGE}"
    exit 1
  fi

  echo "$template" > "$env_file"
  echo "Generated ${env_file} template ($(echo "$template" | wc -l) keys)"
}
```

**Step 2: case 文の init コメントアウトを解除**

```bash
  init) cmd_init ;;
```

**Step 3: コミット**

```bash
git add scripts/secrets.sh
git commit -m "feat: add init subcommand to secrets.sh"
```

---

### Task 6: `Makefile` の作成

**Files:**

- Create: `Makefile`

**Step 1: Makefile を作成**

```makefile
.PHONY: secrets-push secrets-pull secrets-init

secrets-push: ## ローカルの .env.<STAGE> を SST に一括反映
	STAGE=$(STAGE) ./scripts/secrets.sh push

secrets-pull: ## SST から現在の値を取得して .env.<STAGE> に保存
	STAGE=$(STAGE) ./scripts/secrets.sh pull

secrets-init: ## SST のシークレットキー一覧から .env.<STAGE> テンプレートを生成
	STAGE=$(STAGE) ./scripts/secrets.sh init

help: ## ヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
```

注意: Makefile のレシピはタブ文字でインデントすること（スペース不可）。

**Step 2: コミット**

```bash
git add Makefile
git commit -m "feat: add Makefile for SST secrets management"
```

---

### Task 7: README にシークレット管理の手順を追記

**Files:**

- Modify: `README.md`

**Step 1: README の「デプロイ」セクション（88行目付近）の前に、シークレット管理セクションを追加**

`### デプロイ` の直前に以下を挿入:

````markdown
### シークレット管理

SST のシークレットを `.env.<stage>` ファイルで一括管理できます。

```bash
# SST から現在のシークレットをローカルに取得
make secrets-pull STAGE=dev

# ローカルの .env.dev を SST に一括反映（差分表示 + 確認付き）
make secrets-push STAGE=dev

# SST のキー一覧からテンプレートを生成
make secrets-init STAGE=dev
```
````

`.env.dev.example` にキー一覧があります。初回セットアップ時は `make secrets-init` でテンプレートを生成し、値を埋めてから `make secrets-push` してください。

````

**Step 2: コミット**

```bash
git add README.md
git commit -m "docs: add secrets management section to README"
````

---

## タスク依存関係

```
Task 1 (.env.dev.example) ─┐
Task 2 (.gitignore)        ├─→ Task 6 (Makefile) → Task 7 (README)
Task 3 (pull)              │
  └→ Task 4 (push)        │
       └→ Task 5 (init) ──┘
```

Task 1, 2, 3 は並列実行可能。Task 4 は Task 3 に依存。Task 5 は Task 4 に依存。Task 6 は Task 1-5 完了後。Task 7 は Task 6 完了後。
