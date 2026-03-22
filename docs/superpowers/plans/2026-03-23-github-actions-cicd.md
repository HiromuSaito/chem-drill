# GitHub Actions CI/CD パイプライン実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GitHub Actions で CI（PR 時の品質チェック）と CD（マージ後の自動デプロイ）パイプラインを構築する。

**Architecture:** CI と CD を別ワークフローに分離。CI は PR 時に lint/build/test を実行。CD は main/production への push 時に CI 再実行 + OIDC 認証 + DB マイグレーション + SST デプロイを実行。

**Tech Stack:** GitHub Actions, pnpm, turbo, SST v4, AWS OIDC, Drizzle Kit

**Spec:** `docs/superpowers/specs/2026-03-23-github-actions-cicd-design.md`

---

## ファイル構成

| 操作 | ファイル                       | 責務                      |
| ---- | ------------------------------ | ------------------------- |
| 作成 | `.github/workflows/ci.yml`     | PR 時の CI ワークフロー   |
| 作成 | `.github/workflows/deploy.yml` | push 時の CD ワークフロー |

---

### Task 1: CI ワークフローの作成

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: .github/workflows ディレクトリを作成**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: ci.yml を作成**

`.github/workflows/ci.yml` に以下を書く:

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

注意点:

- `pnpm/action-setup@v4` はルートの `package.json` の `packageManager: "pnpm@9.15.0"` を自動検出するため、バージョン指定不要
- `cache: "pnpm"` で pnpm store を自動キャッシュ
- `--frozen-lockfile` で lockfile と実際の依存に差異がある場合にエラーにする
- turbo が `packages/shared` → `apps/api` / `apps/web` の依存順にタスクを実行する

- [ ] **Step 3: コミット**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: PR 時の CI ワークフローを追加"
```

---

### Task 2: CD ワークフローの作成

**Files:**

- Create: `.github/workflows/deploy.yml`

**前提:** AWS 側の OIDC プロバイダーと IAM ロールが作成済みであること（Task 3 参照）。GitHub リポジトリの Secret に `AWS_ROLE_ARN` が設定済みであること。これらがなくてもワークフローファイル自体は作成可能。

- [ ] **Step 1: deploy.yml を作成**

`.github/workflows/deploy.yml` に以下を書く:

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

      - name: Set DATABASE_URL
        run: echo "DATABASE_URL=$(npx sst secret get DatabaseUrl --stage ${{ github.ref_name == 'main' && 'dev' || 'production' }})" >> $GITHUB_ENV

      - name: DB Migrate
        run: pnpm --filter api db:migrate

      - name: Deploy
        run: pnpm sst:deploy --stage ${{ github.ref_name == 'main' && 'dev' || 'production' }}
```

注意点:

- `permissions.id-token: write` は OIDC トークン発行に必須
- `aws-actions/configure-aws-credentials@v4` で OIDC 経由の AssumeRole を実行
- ステージ判定: `github.ref_name == 'main'` → `dev`、それ以外（`production`）→ `production`
- `DATABASE_URL` は SST シークレットから取得。`npx sst secret get` は AWS 認証後に実行可能
- DB マイグレーション (`db:migrate`) はデプロイ前に実行
- `drizzle.config.ts` が `process.env.DATABASE_URL` を参照するため、`$GITHUB_ENV` 経由で環境変数を設定

- [ ] **Step 2: コミット**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: push 時の CD ワークフロー（OIDC + マイグレーション + SST デプロイ）を追加"
```

---

### Task 3: AWS OIDC プロバイダーと IAM ロールの作成（手動作業）

これは GitHub Actions ワークフローのコード作成ではなく、AWS コンソールまたは CLI での手動設定作業。

- [ ] **Step 1: IAM OIDC プロバイダーを作成**

AWS コンソール（IAM → ID プロバイダー → プロバイダを追加）または CLI:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

- [ ] **Step 2: デプロイ用 IAM ロールを作成**

ロール名: `github-actions-chem-drill-deploy`（任意）

信頼ポリシー（`<ACCOUNT_ID>` を自分の AWS アカウント ID に置換）:

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

許可ポリシー: `AdministratorAccess` を付与（SST デプロイに必要な権限が広範なため。稼働安定後に最小権限に絞る）。

- [ ] **Step 3: GitHub リポジトリに Secret を設定**

GitHub リポジトリの Settings → Secrets and variables → Actions → New repository secret:

- Name: `AWS_ROLE_ARN`
- Value: Step 2 で作成したロールの ARN（例: `arn:aws:iam::123456789012:role/github-actions-chem-drill-deploy`）

---

### Task 4: 動作確認

- [ ] **Step 1: CI ワークフローの動作確認**

テスト用ブランチを作成し、main 向けの PR を作成して CI が実行されることを確認:

```bash
git checkout -b test/ci-workflow
# 何か小さな変更を加える（例: README に空行追加）
git commit --allow-empty -m "test: CI ワークフローの動作確認"
git push -u origin test/ci-workflow
gh pr create --title "test: CI ワークフローの動作確認" --body "CI ワークフローの動作確認用 PR。確認後クローズする。"
```

GitHub の PR ページで Actions タブを確認:

- CI ジョブが実行されること
- lint / build / test がすべて PASS すること

確認後 PR をクローズしブランチを削除:

```bash
gh pr close --delete-branch
```

- [ ] **Step 2: CD ワークフローの動作確認**

Task 3 の AWS 設定が完了している前提で、main に push して CD が実行されることを確認:

- GitHub Actions タブで Deploy ワークフローが実行されること
- OIDC 認証が成功すること
- DB マイグレーションが実行されること
- SST デプロイが成功すること

問題が発生した場合は GitHub Actions のログを確認して対処する。
