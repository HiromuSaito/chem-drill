# サインアップ画面のチェック並列化

## 概要

`signup-page.tsx` の `handleSubmit` で直列実行されている `check-username` と `check-email` API コールを `Promise.all` で並列化し、サインアップ時の待ち時間を短縮する。

## 変更対象

- `apps/web/src/features/auth/signup-page.tsx` の `handleSubmit` 関数（L39-69）

## 設計

### Before

```typescript
const usernameRes = await client.api.user["check-username"].$get(...);
// チェック
const emailRes = await client.api.user["check-email"].$get(...);
// チェック
```

2つの独立した API コールが直列で実行され、合計 2 ラウンドトリップ分の待ち時間が発生。

### After

```typescript
const [usernameRes, emailRes] = await Promise.all([
  client.api.user["check-username"].$get({ query: { username } }),
  client.api.user["check-email"].$get({ query: { email } }),
]);
```

`Promise.all` で並列実行し、1 ラウンドトリップ分に短縮。

### エラーハンドリング

- `Promise.all` 全体を1つの try-catch で囲む
- エラー時は汎用メッセージ「ユーザー名・メールアドレスの確認に失敗しました。」を表示
- 両方成功した場合は、各レスポンスを個別にチェックしてエラーメッセージを出し分け（ユーザー名重複 / メール登録済み）
