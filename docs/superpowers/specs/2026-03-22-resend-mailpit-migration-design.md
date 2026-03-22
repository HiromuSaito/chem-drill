# メール送信を AWS SES から Resend / Mailpit に移行する設計

## 背景

AWS SES のサンドボックス解除申請が下りないため、メール送信プロバイダーを Resend に切り替える。ローカル開発環境では `aws-ses-v2-local` の代わりに Mailpit を使用する。

GitHub Issue: #88

## 方針

- Resend SDK を直接使用するシンプルな実装
- 環境変数 `USE_RESEND=true` で切り替え（未設定時は Mailpit にフォールバックし、安全側に倒す）
- SES 関連のインフラ定義・依存をすべて撤去
- Resend のドメイン認証用 DNS レコードは Resend ダッシュボードから手動で Route53 に追加

## 変更対象

### 1. メール送信の実装変更

**ファイル:** `apps/api/src/infrastructure/auth/send-otp-email.ts`

現在の SES SDK 呼び出しを以下のロジックに書き換える：

- `USE_RESEND=true` の場合 → `resend` パッケージの SDK でメール送信
- それ以外（未設定・false）→ `nodemailer` で Mailpit の SMTP（`localhost:1025`）経由で送信

送信元アドレスは環境変数 `EMAIL_FROM`（旧 `SES_FROM_EMAIL`）から取得する。

### 2. SST インフラ定義 (`sst.config.ts`)

- `shared` ステージの SES Identity / DKIM / DMARC リソース定義をすべて削除
- シークレット変更:
  - `SesFromEmail` → `EmailFrom` にリネーム
  - `ResendApiKey` を新規追加
- Lambda 環境変数:
  - `SES_FROM_EMAIL` → `EMAIL_FROM` にリネーム
  - `RESEND_API_KEY` を追加
  - `USE_RESEND=true` をハードコード（デプロイ環境では常に Resend を使用）
- SES 関連の IAM 権限（`ses:SendEmail`, `ses:SendRawEmail`）を削除

### 3. Docker Compose (`docker-compose.yml`)

`ses-local` サービスを削除し、`mailpit` サービスに置き換え：

- イメージ: `axllent/mailpit`
- ポート: `1025`（SMTP）、`8025`（Web UI）

### 4. 環境変数

**ローカル (`apps/api/.env`):**

- `SES_ENDPOINT` を削除
- `SES_FROM_EMAIL` → `EMAIL_FROM` にリネーム
- `USE_RESEND` は設定しない（デフォルトで Mailpit）

**`.env.dev.example`, `.env.production`:**

- `SesFromEmail` → `EmailFrom` にリネーム
- `ResendApiKey` を追加

### 5. パッケージ依存関係 (`apps/api/package.json`)

- 追加: `resend`, `nodemailer`
- 追加（devDependencies）: `@types/nodemailer`
- 削除: `@aws-sdk/client-sesv2`

## 環境切り替えまとめ

| 環境             | `USE_RESEND` | メール送信先                   |
| ---------------- | ------------ | ------------------------------ |
| ローカル開発     | 未設定       | Mailpit（SMTP localhost:1025） |
| dev / production | `true`       | Resend API                     |

## メール送信元

全環境共通: `noreply@chem-drill.com`（`EMAIL_FROM` 環境変数で管理）
