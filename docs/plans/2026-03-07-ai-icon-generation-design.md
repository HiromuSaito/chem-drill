# AIアイコン自動生成機能 設計書

## 概要

LLM（Gemini 2.5 Flash）を使って、ユーザーの回答に基づいたフラットデザインのアイコン画像を自動生成・提案する。

## 全体フロー

```
[アカウント画面] → 「AIで生成」ボタン
  → [モーダル] Step1: カラーパレットから色を選択（8〜10色）
  → [モーダル] Step2: 好きな化学元素・分子を自由テキスト入力
  → [モーダル] Step3: 雰囲気を選択（かわいい / クール / シンプル / サイエンス風）
  → [モーダル] 「生成する」→ ローディング表示
  → [モーダル] 3枚の候補を表示 → 1枚選択 → 「設定する」
  → アイコン反映、モーダル閉じる
```

## API エンドポイント

### `POST /api/user/icon/generate`（認証必須）

リクエスト:

```json
{ "color": "string", "element": "string", "style": "string" }
```

- `color`: 好きな色（カラーパレットから選択）
- `element`: 好きな化学元素・分子（自由テキスト）
- `style`: 雰囲気（"cute" | "cool" | "simple" | "science"）

処理:

1. Gemini 2.5 Flash を3回並列呼び出し（バリエーションのためプロンプトを微調整）
2. Sharp で 256x256 WebP に加工
3. S3 に `icons/{userId}/candidates/{0,1,2}.webp` として保存

レスポンス:

```json
{ "candidates": [{ "url": "string", "key": "string" }, ...] }
```

エラー:

- Gemini 429 → 「現在生成が混み合っています。しばらく待ってからお試しください」
- その他エラー → 「画像生成に失敗しました」
- 3枚中一部失敗 → 成功した分だけ返す（0枚なら全体エラー）

### `POST /api/user/icon/select`（認証必須）

リクエスト:

```json
{ "selectedKey": "string", "rejectedKeys": ["string", ...] }
```

処理:

1. 選択画像を `icons/{userId}.webp` にコピー
2. 不要な候補画像を S3 から削除
3. `user.image` を更新

レスポンス:

```json
{ "imageUrl": "string" }
```

## DDD レイヤー構成

### 新規ファイル

| レイヤー       | ファイル                                             | 内容                             |
| -------------- | ---------------------------------------------------- | -------------------------------- |
| Domain         | `domain/user/icon-generator.ts`                      | `IconGenerator` インターフェース |
| Infrastructure | `infrastructure/generation/gemini-icon-generator.ts` | Gemini API 画像生成実装          |
| Application    | `application/user/generate-icon.ts`                  | `GenerateIcon` ユースケース      |
| Application    | `application/user/select-icon.ts`                    | `SelectIcon` ユースケース        |

### 変更ファイル

| ファイル                                 | 変更内容                                           |
| ---------------------------------------- | -------------------------------------------------- |
| `presentation/routes/user/user.route.ts` | 2エンドポイント追加                                |
| `composition-root.ts`                    | 新サービスの DI 登録                               |
| `sst.config.ts`                          | Lambda に `s3:GetObject`, `s3:CopyObject` 権限追加 |

## S3 ストレージ

- 候補画像: `icons/{userId}/candidates/{0,1,2}.webp`
- 正式画像: `icons/{userId}.webp`（既存と同じ）
- 未選択の候補は放置（select 時に rejected のみ削除）
- 既存の `S3IconStorage` と `SharpIconProcessor` を再利用

## プロンプト設計

- フラットデザインのアイコン風画像を生成
- 3回の呼び出しでバリエーション（構図・色合いの微調整）を出す
- ユーザー入力の色・元素・雰囲気を組み込んだプロンプトテンプレート
- `responseModalities: ["image"]` を使用

## フロントエンド

### 新規ファイル

| ファイル                                    | 内容                         |
| ------------------------------------------- | ---------------------------- |
| `features/account/generate-icon-dialog.tsx` | ステップウィザード型モーダル |

### 変更ファイル

| ファイル                            | 変更内容                             |
| ----------------------------------- | ------------------------------------ |
| `features/account/account-page.tsx` | IconSection に「AIで生成」ボタン追加 |

### モーダル仕様

- shadcn `Dialog` コンポーネントを使用
- Step 1: カラーパレット（8〜10色のボタン）
- Step 2: 自由テキスト入力（化学元素・分子）
- Step 3: 雰囲気選択（かわいい / クール / シンプル / サイエンス風）
- 生成中: ローディング表示
- 結果: 3枚の候補をグリッド表示 → 1枚選択 → 「設定する」

## 設計判断

- **レート制限**: アプリ側では設けない。Gemini API の無料枠制限（429エラー）に依存し、エラーハンドリングで対応
- **候補のライフサイクル**: select 時に rejected のみ削除。未選択のまま閉じた候補は放置
- **画像生成方式**: 3回並列呼び出し（確実に3枚得るため）
- **画像テイスト**: フラットデザインのアイコン風
- **元素入力**: 自由テキスト入力
