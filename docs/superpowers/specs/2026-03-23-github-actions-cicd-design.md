# GitHub Actions CI/CD パイプライン設計

## 概要

GitHub Actions を使って、chem-drill プロジェクトの CI/CD パイプラインを構築する。PR 時に品質チェック（CI）を行い、マージ後に自動デプロイ（CD）を実行する。

**関連 Issue**: #19

## 背景・経緯

- 当初 AWS CodePipeline を検討したが、コスト比較の結果 GitHub Actions の方が大幅に安い（小規模利用なら無料枠内）ため方針変更
- 現在のデプロイは `sst deploy` の手動実行

## 決定事項

| 項目                | 決定                                     |
| ------------------- | ---------------------------------------- |
| CI トリガー         | PR 時（main / production 向け）          |
| CD トリガー         | main / production への push 時           |
| ワークフロー構成    | `ci.yml` と `deploy.yml` の2ファイル分離 |
| ブランチ戦略        | main → dev 環境、production → prod 環境  |
| AWS 認証            | OIDC（IAM アクセスキー不使用）           |
| 手動承認            | なし                                     |
| DB マイグレーション | CI/CD に含めない（手動実行）             |
| SST シークレット    | 事前設定済み前提（CI/CD で管理しない）   |

## ワークフロー設計

### 1. CI ワークフロー（`.github/workflows/ci.yml`）

**トリガー**: main / production ブランチ向けの PR 作成・更新時

**ジョブ**: 単一ジョブ `ci`

```yaml
name: CI

on:
  pull_request:
    branches: [main, production]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm lint

      - run: pnpm build

      - run: pnpm test
```

**ポイント**:

- `pnpm/action-setup@v4` は `package.json` の `packageManager` フィールド（`pnpm@9.15.0`）を自動検出
- `actions/setup-node` の `cache: 'pnpm'` で pnpm store をキャッシュし、2回目以降の install を高速化
- `--frozen-lockfile` で lockfile との齟齬がある場合に失敗させる
- turbo が `packages/shared` → `apps/api` / `apps/web` の依存順にタスクを実行

### 2. CD ワークフロー（`.github/workflows/deploy.yml`）

**トリガー**: main / production ブランチへの push 時

**ジョブ**: 単一ジョブ `deploy`

```yaml
name: Deploy

on:
  push:
    branches: [main, production]

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm lint

      - run: pnpm build

      - run: pnpm test

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-northeast-1

      - name: Deploy
        run: pnpm sst:deploy --stage ${{ github.ref_name == 'main' && 'dev' || 'production' }}
```

**ポイント**:

- CI と同じチェック（lint / build / test）をマージ後にも再実行し、整合性を保証
- `permissions.id-token: write` で OIDC トークンの発行を許可
- ブランチ名で SST ステージを決定: `main` → `dev`、`production` → `production`
- SST シークレットは各ステージに事前設定済みのため、追加の環境変数注入は不要

## AWS OIDC 事前準備

GitHub Actions から AWS にアクセスキーなしで認証するため、以下を事前に設定する。

### 1. IAM OIDC プロバイダーの作成

- **プロバイダー URL**: `https://token.actions.githubusercontent.com`
- **対象者（Audience）**: `sts.amazonaws.com`
- AWS コンソールの IAM → ID プロバイダー → プロバイダを追加、または AWS CLI で作成

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 2. デプロイ用 IAM ロールの作成

**信頼ポリシー**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:HiromuSaito/chem-drill:ref:refs/heads/main",
            "repo:HiromuSaito/chem-drill:ref:refs/heads/production"
          ]
        }
      }
    }
  ]
}
```

**許可ポリシー**:

- 初期は `AdministratorAccess` を付与（SST デプロイは CloudFormation, S3, Lambda, API Gateway, CloudFront, IAM, SSM 等の広範な権限を必要とするため）
- 稼働安定後に最小権限ポリシーに絞ることを推奨

### 3. GitHub リポジトリの設定

- Repository Secret `AWS_ROLE_ARN` にロールの ARN を保存
- ワークフローから `${{ secrets.AWS_ROLE_ARN }}` で参照

## スコープ外

- DB マイグレーションの自動実行（手動運用）
- 手動承認ステップ（本番稼働後に必要なら追加）
- Dependabot / Renovate による依存更新自動化（別 Issue で検討）
- コードカバレッジの計測・レポート
- セキュリティスキャン
