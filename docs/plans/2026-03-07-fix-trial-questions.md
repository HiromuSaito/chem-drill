# トライアル問題固定化 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** トライアル問題をフロントエンドにハードコードし、バックエンドのトライアル関連コードを削除する

**Architecture:** フロントに問題データを定数として定義し、API呼び出しを廃止。バックエンドのトライアル用エンドポイント・ユースケースを削除。

**Tech Stack:** React, TypeScript, Hono

---

### Task 1: トライアル用問題データの定数ファイルを作成

**Files:**

- Create: `apps/web/src/features/trial/trial-questions.ts`

**Step 1: 問題データの定数ファイルを作成**

`QuestionDto` 型（= `QuestionWithCategoryResponse`）に合わせて5問分のデータを定義する。

```ts
import type { QuestionDto } from "@/types/question";

export const TRIAL_QUESTIONS: QuestionDto[] = [
  {
    id: "trial-1",
    text: "水の化学式はどれか？",
    difficulty: "easy",
    choices: ["H2O", "CO2", "NaCl", "O2"],
    correctIndexes: [0],
    explanation:
      "水の化学式は H2O です。水素原子2つと酸素原子1つから構成されます。",
    category: { categoryId: "trial", categoryName: "基礎化学" },
  },
  {
    id: "trial-2",
    text: "塩化ナトリウムの化学式はどれか？",
    difficulty: "easy",
    choices: ["NaCl", "KCl", "CaCl2", "MgCl2"],
    correctIndexes: [0],
    explanation: "塩化ナトリウム（食塩）の化学式は NaCl です。",
    category: { categoryId: "trial", categoryName: "基礎化学" },
  },
  {
    id: "trial-3",
    text: "二酸化炭素の化学式はどれか？",
    difficulty: "easy",
    choices: ["CO", "CO2", "C2O", "O2C"],
    correctIndexes: [1],
    explanation:
      "二酸化炭素の化学式は CO2 です。炭素原子1つと酸素原子2つから構成されます。",
    category: { categoryId: "trial", categoryName: "基礎化学" },
  },
  {
    id: "trial-4",
    text: "鉄の元素記号はどれか？",
    difficulty: "easy",
    choices: ["Ir", "Fe", "F", "Fr"],
    correctIndexes: [1],
    explanation: "鉄の元素記号は Fe です。ラテン語の ferrum に由来します。",
    category: { categoryId: "trial", categoryName: "基礎化学" },
  },
  {
    id: "trial-5",
    text: "希ガスに該当する元素はどれか？（複数選択）",
    difficulty: "normal",
    choices: ["ヘリウム", "窒素", "ネオン", "酸素"],
    correctIndexes: [0, 2],
    explanation:
      "ヘリウム（He）とネオン（Ne）は希ガス（第18族元素）です。窒素と酸素は希ガスではありません。",
    category: { categoryId: "trial", categoryName: "基礎化学" },
  },
];
```

**Step 2: 型チェック**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: PASS（エラーなし）

**Step 3: コミット**

```bash
git add apps/web/src/features/trial/trial-questions.ts
git commit -m "feat: トライアル用問題データの定数ファイルを追加"
```

---

### Task 2: trial-page.tsx を定数データに切り替え

**Files:**

- Modify: `apps/web/src/features/trial/trial-page.tsx`

**Step 1: trial-page.tsx を書き換え**

- `useQuery`, `client` のインポートを削除
- `TRIAL_QUESTIONS` をインポート
- ローディング・エラー・空チェックの分岐を削除
- `SessionContainer` に `TRIAL_QUESTIONS` を直接渡す

```tsx
import { useNavigate } from "react-router-dom";
import { FlaskConical, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionContainer } from "@/features/question/session-container";
import { TRIAL_QUESTIONS } from "./trial-questions";

export function TrialPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex items-center border-b bg-background px-6 py-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <FlaskConical className="size-5 text-primary" />
          Chem Drill
        </h1>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <SessionContainer
          questions={TRIAL_QUESTIONS}
          showRetry={false}
          resultActions={
            <>
              <hr className="border-border" />
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  アカウントを作成すると、もっと多くの問題に挑戦できます
                </p>
                <Button className="w-full" onClick={() => navigate("/signup")}>
                  <UserPlus />
                  新規登録して他の問題も試す
                </Button>
              </div>
            </>
          }
        />
      </main>
    </div>
  );
}
```

**Step 2: 型チェック**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: PASS

**Step 3: コミット**

```bash
git add apps/web/src/features/trial/trial-page.tsx
git commit -m "feat: トライアルページを固定問題データに切り替え"
```

---

### Task 3: バックエンドのトライアル関連コードを削除

**Files:**

- Delete: `apps/api/src/presentation/routes/trial/trial.route.ts`
- Delete: `apps/api/src/application/question/get-trial-questions.ts`
- Modify: `apps/api/src/presentation/routes/index.ts:6,37` — `createTrialRoute` のインポートと `.route("/trial", ...)` を削除
- Modify: `apps/api/src/composition-root.ts:9,111-114,216` — `GetTrialQuestions` のインポート、インスタンス生成、`dependencies` オブジェクトから削除

**Step 1: trial.route.ts を削除**

```bash
rm apps/api/src/presentation/routes/trial/trial.route.ts
rmdir apps/api/src/presentation/routes/trial
```

**Step 2: get-trial-questions.ts を削除**

```bash
rm apps/api/src/application/question/get-trial-questions.ts
```

**Step 3: index.ts から trial ルートを削除**

`apps/api/src/presentation/routes/index.ts` から以下を削除:

- L6: `import { createTrialRoute } from "./trial/trial.route.ts";`
- L37: `.route("/trial", createTrialRoute(deps))`

**Step 4: composition-root.ts から GetTrialQuestions を削除**

`apps/api/src/composition-root.ts` から以下を削除:

- L9: `import { GetTrialQuestions } from ...`
- L111-114: `const getTrialQuestions = new GetTrialQuestions(...)`
- L216: `getTrialQuestions,`（dependencies オブジェクト内）

**Step 5: 型チェック**

Run: `pnpm --filter api exec tsc --noEmit`
Expected: PASS

**Step 6: コミット**

```bash
git add -A
git commit -m "fix: トライアル用APIエンドポイントとユースケースを削除"
```

---

### Task 4: 全体ビルド確認

**Step 1: リント**

Run: `pnpm lint`
Expected: PASS

**Step 2: ビルド**

Run: `pnpm build`
Expected: PASS

**Step 3: コミット（必要な場合のみ）**

リントやビルドで修正が必要な場合のみコミット。
