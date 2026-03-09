# AI 出題案生成: 候補選択方式への変更

GitHub Issue: #81

## 概要

AI による出題案生成時、生成結果を即座に DB 保存せず、候補として画面に返し、管理者が選択したもののみ出題案として登録する。

## 現状

1. 管理者が URL + カテゴリを入力して生成
2. API が Gemini で 10 問生成し、すべて `question_proposals` に即保存
3. 結果一覧を表示

## 変更後のフロー

1. 管理者が URL + カテゴリを入力して生成
2. API が Gemini で候補を生成し、**DB に保存せず JSON で返す**
3. 候補一覧を画面に表示（チェックボックス + 問題文 + 難易度）
4. 管理者がモーダルで詳細確認し、登録したい候補を選択
5. 「選択した問題を登録」で選択分のみ一括保存

## API 変更

### 削除

- `POST /api/question-proposals/generate-from-url`

### 新規

#### `POST /api/question-proposals/generate-candidates`

Gemini で候補を生成し、DB に保存せず返す。

- リクエスト: `{ url: string, categoryId: string }`
- レスポンス: `{ candidates: GeneratedQuestion[] }`

#### `POST /api/question-proposals/bulk-create`

選択された候補を一括で `question_proposals` に保存。

- リクエスト: `{ categoryId: string, questions: GeneratedQuestion[] }`
- レスポンス: `{ proposals: QuestionProposal[] }`

### GeneratedQuestion 型

```typescript
{
  questionText: string
  difficulty: "easy" | "medium" | "hard"
  choices: string[]
  correctIndexes: number[]
  explanation: string
}
```

## フロントエンド変更

### ProposalGeneratePage 改修

1. **生成フェーズ**: URL + カテゴリ入力フォーム → `generate-candidates` 呼び出し → 候補を React state に保持
2. **選択フェーズ**:
   - 候補一覧テーブル（チェックボックス + 問題文 + 難易度 + 詳細ボタン）
   - 全選択 / 全解除ボタン
   - 詳細ボタン → モーダルで読み取り専用表示（問題文、選択肢、正答、解説）
   - 「選択した問題を登録」ボタン → `bulk-create` 呼び出し
3. **完了後**: `/admin/proposals` に遷移
4. **離脱防止**: 候補が state にある状態で `beforeunload` + React Router `useBlocker` で確認ダイアログ

## 変更しないもの

- ドメインエンティティ (`QuestionProposal`)
- 既存の出題案一覧・詳細・編集ページ
- Gemini 連携の生成ロジック自体
