# メール送信を SES から Resend / Mailpit に移行 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** メール送信を AWS SES から Resend に移行し、ローカル開発環境を Mailpit に切り替える

**Architecture:** `send-otp-email.ts` の内部実装を差し替える。`USE_RESEND=true` で Resend SDK、未設定時は nodemailer で Mailpit SMTP に送信。関数シグネチャは変更しないため、呼び出し元 (`auth.ts`) への影響なし。

**Tech Stack:** Resend SDK, nodemailer, Mailpit (Docker), SST v4

**Spec:** `docs/superpowers/specs/2026-03-22-resend-mailpit-migration-design.md`

**Branch:** main から `feat/resend-mailpit-migration` ブランチを切って作業する（worktree は使用しない）

---

### Task 0: ブランチ作成

- [ ] **Step 1: main から作業ブランチを作成**

```bash
git checkout main
git checkout -b feat/resend-mailpit-migration
```

---

### Task 1: パッケージ依存関係の入れ替え

**Files:**

- Modify: `apps/api/package.json`

- [ ] **Step 1: SES SDK を削除し、resend と nodemailer を追加**

```bash
cd apps/api
pnpm remove @aws-sdk/client-sesv2
pnpm add resend nodemailer
pnpm add -D @types/nodemailer
```

- [ ] **Step 2: 型チェックが通ることを確認**

```bash
cd apps/api
pnpm type-check
```

Expected: `send-otp-email.ts` で SES のインポートエラーが出る（これは想定通り、次の Task で修正する）

- [ ] **Step 3: コミット**

```bash
git add apps/api/package.json pnpm-lock.yaml
git commit -m "chore: @aws-sdk/client-sesv2 を削除し resend / nodemailer を追加"
```

---

### Task 2: メール送信実装の書き換え

**Files:**

- Modify: `apps/api/src/infrastructure/auth/send-otp-email.ts`

- [ ] **Step 1: `send-otp-email.ts` を Resend / nodemailer ベースに書き換え**

```typescript
import { Resend } from "resend";
import { createTransport } from "nodemailer";
import { requireEnv } from "../../env.ts";

const useResend = process.env.USE_RESEND === "true";

function sendViaResend(
  from: string,
  to: string,
  subject: string,
  text: string,
) {
  const resend = new Resend(requireEnv("RESEND_API_KEY"));
  return resend.emails.send({ from, to: [to], subject, text });
}

function sendViaMailpit(
  from: string,
  to: string,
  subject: string,
  text: string,
) {
  const transport = createTransport({
    host: "localhost",
    port: 1025,
    secure: false,
  });
  return transport.sendMail({ from, to, subject, text });
}

export async function sendOtpEmail(
  email: string,
  otp: string,
  type: string,
): Promise<void> {
  const from = requireEnv("EMAIL_FROM");
  const subject =
    type === "sign-in" ? "Chem Drill ログインコード" : "Chem Drill 認証コード";
  const text = `あなたの認証コードは ${otp} です。5分以内に入力してください。`;

  if (useResend) {
    await sendViaResend(from, email, subject, text);
  } else {
    await sendViaMailpit(from, email, subject, text);
  }
}
```

- [ ] **Step 2: 型チェックが通ることを確認**

```bash
cd apps/api
pnpm type-check
```

Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add apps/api/src/infrastructure/auth/send-otp-email.ts
git commit -m "feat: メール送信を SES から Resend / Mailpit に切り替え"
```

---

### Task 3: Docker Compose の ses-local を Mailpit に置き換え

**Files:**

- Modify: `docker-compose.yml`

- [ ] **Step 1: `ses-local` サービスを `mailpit` に置き換え**

変更前:

```yaml
ses-local:
  image: dasprid/aws-ses-v2-local
  container_name: chem-drill-ses
  ports:
    - "8005:8005"
```

変更後:

```yaml
mailpit:
  image: axllent/mailpit
  container_name: chem-drill-mailpit
  ports:
    - "1025:1025"
    - "8025:8025"
```

- [ ] **Step 2: Docker Compose で Mailpit が起動することを確認**

```bash
docker compose up -d mailpit
docker compose ps
```

Expected: `chem-drill-mailpit` が running 状態

```bash
docker compose down mailpit
```

- [ ] **Step 3: コミット**

```bash
git add docker-compose.yml
git commit -m "chore: ses-local を Mailpit に置き換え"
```

---

### Task 4: 環境変数の更新

**Files:**

- Modify: `apps/api/.env`
- Modify: `.env.dev.example`
- Modify: `.env.production`

- [ ] **Step 1: `apps/api/.env` を更新**

変更内容:

- `SES_ENDPOINT=http://localhost:8005` を削除
- `SES_FROM_EMAIL=noreply@chem-drill.local` を `EMAIL_FROM=noreply@chem-drill.local` にリネーム
- `USE_RESEND` は追加しない（デフォルトで Mailpit）

- [ ] **Step 2: `.env.dev.example` を更新**

変更内容:

- `SesFromEmail=` を `EmailFrom=` にリネーム
- `ResendApiKey=` を追加

- [ ] **Step 3: `.env.production` を更新**

変更内容:

- `SesFromEmail=noreply@chem-drill.com` を `EmailFrom=noreply@chem-drill.com` にリネーム
- `ResendApiKey=` を追加（値は後で SST secret で設定）

- [ ] **Step 4: コミット**

```bash
git add apps/api/.env .env.dev.example .env.production
git commit -m "chore: 環境変数を SES から Resend / Mailpit 用にリネーム"
```

---

### Task 5: SST インフラ定義の更新

**Files:**

- Modify: `sst.config.ts`

- [ ] **Step 1: shared ステージのブロックを丸ごと削除**

`sst.config.ts` の `run()` 内から以下を削除:

- `const isShared = $app.stage === "shared";` (行 19)
- `if (isShared) { ... }` ブロック全体 (行 22-54)

また `app()` 内の shared ステージへの参照も削除:

- `removal` の条件から `input?.stage === "shared"` を削除 (行 7)
- `protect` の条件から `"shared"` を削除 (行 10)

- [ ] **Step 2: シークレット定義を変更**

変更前:

```typescript
const sesFromEmail = new sst.Secret("SesFromEmail");
```

変更後:

```typescript
const emailFrom = new sst.Secret("EmailFrom");
const resendApiKey = new sst.Secret("ResendApiKey");
```

- [ ] **Step 3: Lambda 環境変数を変更**

変更前:

```typescript
SES_FROM_EMAIL: sesFromEmail.value,
```

変更後:

```typescript
EMAIL_FROM: emailFrom.value,
RESEND_API_KEY: resendApiKey.value,
USE_RESEND: "true",
```

- [ ] **Step 4: SES の IAM 権限を削除**

`permissions` 配列から以下のブロックを削除:

```typescript
{
  actions: ["ses:SendEmail", "ses:SendRawEmail"],
  resources: ["*"],
},
```

- [ ] **Step 5: 型チェック**

```bash
pnpm type-check
```

Expected: PASS（SST 設定は TypeScript で書かれているため）

- [ ] **Step 6: コミット**

```bash
git add sst.config.ts
git commit -m "infra: SES リソース・権限を撤去し Resend シークレットを追加"
```

---

### Task 6: ローカル動作確認

- [ ] **Step 1: Docker Compose を再起動**

```bash
docker compose down
docker compose up -d
```

- [ ] **Step 2: API サーバーを起動し OTP メール送信をテスト**

```bash
cd apps/api
pnpm dev
```

ブラウザで `http://localhost:5173` にアクセスし、ログイン画面で OTP 送信を実行する。

- [ ] **Step 3: Mailpit Web UI でメール受信を確認**

ブラウザで `http://localhost:8025` を開き、OTP メールが届いていることを確認する。

- [ ] **Step 4: サーバーを停止する**

起動したサーバーを停止する。
