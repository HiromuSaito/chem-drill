# トライアル問題の固定化

## 背景

トライアルページの問題は毎回 `ORDER BY RANDOM()` で DB からランダム取得していた。
問題を固定化したい（Issue #66）。

## 方針

トライアル用の問題をフロントエンドにハードコードし、API 呼び出しを廃止する。
DB に保存されている問題である必要はない。

## 変更内容

### フロントエンド

- `apps/web/src/features/trial/trial-questions.ts` を新設し、5問分の問題データを `QuestionDto[]` 型の定数として定義
- `apps/web/src/features/trial/trial-page.tsx` から `useQuery` / API 呼び出し / ローディング・エラー状態を削除し、定数を直接 `SessionContainer` に渡す

### バックエンド（削除）

- `apps/api/src/presentation/routes/trial/trial.route.ts` — 削除
- `apps/api/src/application/question/get-trial-questions.ts` — 削除
- `apps/api/src/presentation/routes/index.ts` — trial ルートのインポートとマウントを削除
- `apps/api/src/composition-root.ts` — `GetTrialQuestions` 関連を削除
