# キーワード・説明文からの問題生成機能

GitHub Issue: #102

## 概要

現在の問題生成はソース（URL / PDF / 画像）からの生成のみ対応している。本機能では、ユーザーがキーワードや説明文をテキスト入力し、その内容を「正解の根拠」としてAIが問題・ダミー選択肢・解説を自動生成する新しいソースタイプ `freeInput` を追加する。

## 要件

- ユーザーはキーワード（例: 「GHS」）または説明文（例: 「GHSとは化学品の分類および表示に関する世界調和システムである」）を入力できる
- 入力テキストの内容が「正解」になるような問題を生成する（正解ベース生成）
- ダミー選択肢はAIが生成する
- 生成数は固定3問
- カテゴリ選択は必須（現行と同じ）
- 生成後の候補選択・一括登録フローは現行と同じ

## 設計

### アプローチ

既存の `GenerationSource` discriminated union に `freeInput` タイプを追加する。既存のURL/PDF/画像生成フローに自然に乗る形で最小限の変更で実現する。

### API層

#### GenerationSource 型の拡張

```typescript
// question-generation-service.ts
type GenerationSource =
  | { sourceType: "url"; url: string }
  | { sourceType: "pdf"; fileData: string; fileName: string }
  | {
      sourceType: "image";
      fileData: string;
      fileName: string;
      mimeType: "image/jpeg" | "image/png";
    }
  | { sourceType: "freeInput"; input: string }; // 新規追加
```

#### API ルートのリクエストスキーマ

`/generate-candidates` エンドポイントの Zod スキーマに `freeInput` バリアントを追加する。

```typescript
// freeInput バリアント
z.object({
  sourceType: z.literal("freeInput"),
  input: z.string().min(1).max(2000),
  categoryId: z.string().uuid(),
});
```

入力テキストの上限は2000文字とする（キーワードから数段落の説明文まで十分カバーできる範囲）。

#### Gemini アダプターの分岐

`freeInput` の場合:

- `urlContext` ツールは使用しない（PDF/画像と同様）
- インラインデータも不要（テキストのみ）
- プロンプトを正解ベース生成用に切り替える

プロンプト方針:

```
以下の内容を正解の根拠として、化学物質管理に関するクイズを3問生成してください。
ダミーの選択肢もそれらしいものを生成してください。

入力内容:
{ユーザーの入力テキスト}
```

出力フォーマットは現行と同じ JSON 配列（`questionText`, `difficulty`, `choices`, `correctIndexes`, `explanation`）。

### フロントエンド

#### 問題生成フォーム

現在のソース選択タブ（URL / PDF / 画像）に「キーワード・説明文」を4つ目のタブとして追加する。

選択時の入力欄:

- テキストエリア1つ
- プレースホルダー: 「例: GHS、または説明文を入力」
- ファイルアップロードUIは非表示

#### 生成結果の表示

現行と同じフロー。候補一覧テーブルに3問が表示され、選択して一括登録する。既存の `ProposalGeneratePage` のロジックをそのまま利用する。

## 変更対象ファイル

| レイヤー | ファイル                                                                                               | 変更内容                                                     |
| -------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| ドメイン | `apps/api/src/application/question-proposal/question-generation-service.ts`                            | `GenerationSource` 型に `freeInput` 追加                     |
| インフラ | `apps/api/src/infrastructure/question-generation/gemini-question-generation-adapter.ts`                | `freeInput` の分岐追加、正解ベースプロンプト                 |
| インフラ | `apps/api/src/infrastructure/question-generation/__tests__/gemini-question-generation-adapter.test.ts` | `freeInput` のテストケース追加                               |
| API      | `apps/api/src/presentation/routes/question-proposals/question-proposals.route.ts`                      | リクエストスキーマに `freeInput` バリアント追加              |
| フロント | `apps/web/src/features/admin/proposals/proposal-generate-page.tsx`                                     | ソース選択に「キーワード・説明文」タブ追加、テキストエリアUI |

## スコープ外

- 生成数のユーザー指定機能
- カテゴリのオプショナル化
- 既存のURL/PDF/画像生成フローへの変更
