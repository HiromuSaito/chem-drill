# ChemDrill 🧪

化学物質管理に関する知識を定借させるためのクイズアプリ。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロント | Vite + React + shadcn/ui + TanStack Query |
| バックエンド | Hono + tRPC on AWS Lambda |
| ORM | Drizzle |
| DB | Neon（PostgreSQL） |
| 認証 | Clerk |
| インフラ | S3 + CloudFront / API Gateway + Lambda |
| IaC | Terraform |
| バッチ | Gemini API（gemini-2.0-flash） |

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

## セットアップ

```bash
# 依存インストール
pnpm install

# 開発サーバー起動
pnpm dev

# 個別起動
pnpm --filter web dev
pnpm --filter api dev
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
