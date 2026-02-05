# ChemDrill 🧪

化学物質管理に関する知識を定借させるためのクイズアプリ。

## 技術スタック

| レイヤー     | 技術                                      |
| ------------ | ----------------------------------------- |
| フロント     | Vite + React + shadcn/ui + TanStack Query |
| バックエンド | Hono + tRPC on AWS Lambda                 |
| ORM          | Drizzle                                   |
| DB           | Neon（PostgreSQL）                        |
| 認証         | Clerk                                     |
| インフラ     | S3 + CloudFront / API Gateway + Lambda    |
| IaC          | Terraform                                 |
| バッチ       | Gemini API（gemini-2.0-flash）            |

## プロジェクト構成

```
chem-drill/
├── apps/
│   ├── web/          # フロントエンド（SPA）
│   ├── api/          # API
│   └── batch/        # クイズ自動生成バッチ
├── packages/
│   └── shared/       # 共通ユーティリティ
└── infra/            # Terraform
```

## 環境構築

### 前提条件

- Node.js 20 LTS
- pnpm 9.x（`corepack enable` で有効化可能）

### セットアップ手順

```bash
# 1. pnpm を有効化（未インストールの場合）
corepack enable

# 2. 依存インストール
pnpm install

# 3. 開発サーバー起動（web + api 同時起動）
pnpm dev
```

web は `http://localhost:5173`、API は `http://localhost:3001` で起動します。

### 個別起動

```bash
pnpm --filter web dev   # フロントエンドのみ
pnpm --filter api dev   # バックエンドのみ
```

### ビルド

```bash
pnpm build
```

### DBマイグレーション

ORM には Drizzle Kit を使用。開発用と本番用で手順が異なる。

**開発時（直接反映）**

```bash
pnpm --filter api db:push       # schema.ts の変更を直接DBに反映
```

**本番向け（マイグレーション管理）**

```bash
pnpm --filter api db:generate   # schema.ts の差分から ./drizzle/ にSQLファイルを生成
pnpm --filter api db:migrate    # 未適用のSQLファイルをDBに順次適用
```

`db:generate` で生成された SQL は git にコミットし、デプロイ時に `db:migrate` で適用する。
`db:migrate` は適用済みのマイグレーションを追跡するため、同じファイルが二重に実行されることはない。

**その他**

```bash
pnpm --filter api db:studio     # Drizzle Studio（DBのGUI）を起動
```

### テスト

```bash
pnpm test                    # 全パッケージのテスト実行
pnpm --filter api test       # API のみ
pnpm --filter api test:watch # ウォッチモード
```

### リント・フォーマット

```bash
pnpm lint           # ESLint
pnpm format         # Prettier（修正）
pnpm format:check   # Prettier（チェックのみ）
pnpm type-check     # TypeScript 型チェック
```

## 環境変数

```bash
# Neon
DATABASE_URL=

# Clerk
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Gemini（バッチ用）
GEMINI_API_KEY=
```

## バッチ（クイズ自動生成）

```bash
pnpm --filter batch generate --url "https://..." --category "化学物質管理"
```

## 機能

### MVP

- カテゴリ別クイズ
- 正誤フィードバック + 解説表示
- スコア・正答率の記録

### 発展

- 管理画面（問題の追加・編集）
- メンバーごとの進捗ダッシュボード
- 苦手分野の可視化
- Slack通知
- バッチ定期実行（Lambda + EventBridge）
