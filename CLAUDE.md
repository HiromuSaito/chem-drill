# CLAUDE.md

## プロジェクト概要

Turborepo + pnpm workspace によるモノレポ構成。

## アーキテクチャ

### モノレポ構成

- `apps/web` - Vite + React + shadcn/ui（SPA）
- `apps/api` - Hono + tRPC on AWS Lambda
- `apps/batch` - Gemini API によるクイズ自動生成
- `packages/shared` - 共通ユーティリティ（型共有は tRPC が担う）
- `infra/` - Terraform（environments/ + modules/）

## 技術スタック

- **フロント**: Vite + React + shadcn/ui + TanStack Query
- **バックエンド**: Hono + tRPC on AWS Lambda
- **ORM**: Drizzle（マイグレーションも Drizzle Kit を使用）
- **DB**: Neon（サーバーレス PostgreSQL）
- **認証**: Clerk
- **インフラ**: S3 + CloudFront / API Gateway + Lambda
- **IaC**: Terraform
- **バッチ**: Gemini API（gemini-2.0-flash）

## 設計ルール

### Hono + tRPC

- tRPC は `/trpc/*` にマウント
- tRPC に乗らないエンドポイント（Clerk Webhook 等）は Hono で直接ハンドリング
- 認証ミドルウェアは Hono レイヤーで処理

### フロントエンド

- UI コンポーネントは shadcn/ui を使用
- shadcn MCP サーバーを利用して正確なコンポーネント情報を参照すること
- API との型共有は tRPC が担うため、手動の型定義は最小限に

## コマンド

```bash
# 依存インストール
pnpm install

# 全体開発サーバー起動
pnpm dev

# 個別起動
pnpm --filter web dev
pnpm --filter api dev

# ビルド
pnpm build

# リント
pnpm lint

# クイズ自動生成バッチ
pnpm --filter batch generate --url "https://..." --category "化学物質管理"

# Drizzle マイグレーション
pnpm --filter api db:generate
pnpm --filter api db:push
```

## MCP設定

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/shadcn-mcp"]
    }
  }
}
```

## その他ルール

- やりとりは必ず日本語で行うこと
