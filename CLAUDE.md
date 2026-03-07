# CLAUDE.md

## プロジェクト概要

pnpm workspace によるモノレポ構成の化学物質管理クイズアプリ。

## アーキテクチャ

### モノレポ構成

- `apps/web` - Vite + React + shadcn/ui（SPA）
- `apps/api` - Hono (OpenAPIHono) on AWS Lambda
- `packages/shared` - 共通ユーティリティ

## 技術スタック

- **フロント**: Vite + React + shadcn/ui + TanStack Query
- **バックエンド**: Hono (OpenAPIHono) on AWS Lambda
- **API ドキュメント**: OpenAPI + Scalar
- **IaC**: SST v4（Pulumi ベース）
- **ORM**: Drizzle（マイグレーションも Drizzle Kit を使用）
- **DB**: PostgreSQL（本番: Neon / ローカル: Docker）
- **認証**: Better Auth（Email OTP パスワードレス認証）
- **AI**: Gemini API（gemini-2.5-flash）

## 設計ルール

### Hono RPC

- API ルートは `/api/*` 以下に OpenAPIHono ルートをマウント（`createRoute` + Zod スキーマでバリデーション & OpenAPI 定義）
- Webhook 等の非 API エンドポイントは Hono で直接ハンドリング
- フロントとの型共有は `hc<AppType>` クライアントが担う

### 認証

- Better Auth の emailOTP プラグインによるパスワードレス認証
- 認証エンドポイントは `/api/auth/**` に Better Auth ハンドラーをマウント（`app.on()` で AppType に影響しない）
- `requireAuth` ミドルウェアで API ルートを保護（`/health` と `/random-question` は除外）
- セッションは Cookie ベース（DB 管理）。CORS `credentials: true` + hc クライアント `credentials: "include"` が必須
- フロントは `better-auth/react` の `authClient` で OTP 送信・検証・セッション取得を行う

### フロントエンド

- UI コンポーネントは shadcn/ui を使用
- shadcn MCP サーバーを利用して正確なコンポーネント情報を参照すること
- API 呼び出しは `hc` + TanStack Query (`useQuery`) を使用
- ルーティングは React Router (`react-router-dom`) を使用
- 認証ガードは `ProtectedRoute` コンポーネントで `authClient.useSession()` により判定

### SST / インフラ

- インフラ定義は `sst.config.ts`（モノレポルート）に集約
- シークレットは `sst.Secret` で管理し、Lambda には `environment` で `process.env` として渡す
- ローカル開発は既存の `pnpm dev` をそのまま使用（SST は本番/ステージングデプロイ専用）
- `dev` と `production` の 2 ステージ構成

## コマンド

```bash
# 依存インストール
pnpm install

# ローカル DB 起動
docker compose up -d

# 全体開発サーバー起動
pnpm dev

# 個別起動
pnpm --filter web dev
pnpm --filter api dev

# ビルド
pnpm build

# リント
pnpm lint

# Drizzle マイグレーション
pnpm --filter api db:generate
pnpm --filter api db:push

# SST デプロイ
pnpm sst:deploy --stage dev
pnpm sst:deploy --stage production

# SST シークレット設定
npx sst secret set <Name> <Value> --stage <stage>
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
- 動作確認のためにサーバを起動した場合、確認後必ずサーバーを停止すること。
- 本PJはまだ開発中であり稼働していないため、既存のDBの状態の考慮などは必要ない。
