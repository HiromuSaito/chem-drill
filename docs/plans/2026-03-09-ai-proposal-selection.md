# AI 出題案候補選択機能 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** AI 生成結果を即 DB 保存せず候補として返し、管理者が選択したもののみ一括登録する

**Architecture:** 既存の `GenerateQuestionProposals` ユースケースを2つに分離（候補生成 / 一括登録）。API エンドポイントも対応して2つに分割。フロントエンドはチェックボックス選択 UI + 詳細モーダルに改修。

**Tech Stack:** Hono (OpenAPIHono) / React / TanStack Query / shadcn/ui (Dialog, Checkbox, Table)

---

### Task 1: 候補生成ユースケース作成（API）

Gemini を呼び出して `GeneratedQuestion[]` を返すだけのユースケースを新設。DB 保存しない。

**Files:**

- Create: `apps/api/src/application/question-proposal/generate-candidates.ts`

**Step 1: ユースケースを作成**

```typescript
// apps/api/src/application/question-proposal/generate-candidates.ts
import type {
  GeneratedQuestion,
  QuestionGenerationService,
} from "./question-generation-service.ts";

const QUESTION_COUNT = 10;

export class GenerateCandidates {
  constructor(private questionGenerationService: QuestionGenerationService) {}

  async execute(input: { url: string }): Promise<GeneratedQuestion[]> {
    return this.questionGenerationService.generate(input.url, QUESTION_COUNT);
  }
}
```

**Step 2: コンパイル確認**

Run: `pnpm --filter api exec tsc --noEmit`
Expected: PASS

**Step 3: コミット**

```bash
git add apps/api/src/application/question-proposal/generate-candidates.ts
git commit -m "feat: add GenerateCandidates use case (no DB save)"
```

---

### Task 2: 一括登録ユースケース作成（API）

選択された候補を一括で `QuestionProposal` として保存するユースケース。既存の `CreateQuestionProposal` のロジックをループ実行。

**Files:**

- Create: `apps/api/src/application/question-proposal/bulk-create-question-proposals.ts`

**Step 1: ユースケースを作成**

```typescript
// apps/api/src/application/question-proposal/bulk-create-question-proposals.ts
import type { Category } from "../../domain/category/entity/category.ts";
import { Id } from "../../domain/shared/id.ts";
import { CorrectIndexes } from "../../domain/shared/value-object/correct-indexes.ts";
import { Difficulty } from "../../domain/shared/value-object/difficulty.ts";
import { Explanation } from "../../domain/shared/value-object/explanation.ts";
import { QuestionText } from "../../domain/shared/value-object/question-text.ts";
import { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";
import type { GeneratedQuestion } from "./question-generation-service.ts";

export class BulkCreateQuestionProposals {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
  ) {}

  async execute(input: {
    categoryId: string;
    questions: GeneratedQuestion[];
  }): Promise<QuestionProposal[]> {
    const categoryId = Id.of<Category>(input.categoryId);
    const proposals: QuestionProposal[] = [];

    for (const q of input.questions) {
      const proposal = await this.uow.run(async () => {
        const { proposal, event } = QuestionProposal.create({
          questionText: QuestionText.create(q.questionText),
          difficulty: Difficulty.create(q.difficulty),
          choices: q.choices,
          correctIndexes: CorrectIndexes.create(q.correctIndexes),
          explanation: Explanation.create(q.explanation),
          categoryId,
        });

        await this.questionProposalRepository.save(proposal, event);
        return proposal;
      });

      proposals.push(proposal);
    }

    return proposals;
  }
}
```

**Step 2: コンパイル確認**

Run: `pnpm --filter api exec tsc --noEmit`
Expected: PASS

**Step 3: コミット**

```bash
git add apps/api/src/application/question-proposal/bulk-create-question-proposals.ts
git commit -m "feat: add BulkCreateQuestionProposals use case"
```

---

### Task 3: Composition Root 更新 & 旧ユースケース削除

新しいユースケースを DI 登録し、旧 `GenerateQuestionProposals` を削除。

**Files:**

- Modify: `apps/api/src/composition-root.ts`
- Delete: `apps/api/src/application/question-proposal/generate-question-proposals.ts`

**Step 1: composition-root.ts を更新**

import の変更:

- 削除: `import { GenerateQuestionProposals } from ...`
- 追加:
  ```typescript
  import { GenerateCandidates } from "./application/question-proposal/generate-candidates.ts";
  import { BulkCreateQuestionProposals } from "./application/question-proposal/bulk-create-question-proposals.ts";
  ```

インスタンス生成の変更:

- 削除: `const generateQuestionProposals = new GenerateQuestionProposals(unitOfWork, questionGenerationAdapter, questionProposalRepository);`
- 追加:
  ```typescript
  const generateCandidates = new GenerateCandidates(questionGenerationAdapter);
  const bulkCreateQuestionProposals = new BulkCreateQuestionProposals(
    unitOfWork,
    questionProposalRepository,
  );
  ```

dependencies オブジェクトの変更:

- 削除: `generateQuestionProposals,`
- 追加:
  ```typescript
  generateCandidates,
  bulkCreateQuestionProposals,
  ```

**Step 2: 旧ユースケースファイルを削除**

```bash
rm apps/api/src/application/question-proposal/generate-question-proposals.ts
```

**Step 3: コンパイル確認**

Run: `pnpm --filter api exec tsc --noEmit`
Expected: この時点ではルートファイルが旧名を参照しているため FAIL（Task 4 で修正）

**Step 4: コミット**

```bash
git add -A
git commit -m "refactor: replace GenerateQuestionProposals with GenerateCandidates + BulkCreateQuestionProposals"
```

---

### Task 4: API ルート更新

旧 `generate-from-url` エンドポイントを `generate-candidates` と `bulk-create` に置換。

**Files:**

- Modify: `apps/api/src/presentation/routes/question-proposals/question-proposals.route.ts`

**Step 1: スキーマ追加**

`generateFromUrlSchema` を `generateCandidatesSchema` にリネーム（中身は同じ: `{ url, categoryId }`）。

`generatedQuestionSchema` を新規追加:

```typescript
const generatedQuestionSchema = z
  .object({
    questionText: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
  })
  .openapi("GeneratedQuestion");

const bulkCreateSchema = z
  .object({
    categoryId: z.string().uuid(),
    questions: z.array(generatedQuestionSchema).min(1),
  })
  .openapi("BulkCreateQuestionProposalsRequest");
```

**Step 2: ルート定義を置換**

旧 `proposalGenerateRoute` を削除し、以下2つを追加:

```typescript
const generateCandidatesRoute = createRoute({
  method: "post",
  path: "/generate-candidates",
  tags: ["QuestionProposal"],
  summary: "URLからAI出題候補を生成（DB保存なし）",
  request: {
    body: {
      content: { "application/json": { schema: generateCandidatesSchema } },
    },
  },
  responses: {
    200: {
      description: "生成された候補一覧",
      content: {
        "application/json": {
          schema: z.object({
            candidates: z.array(generatedQuestionSchema),
          }),
        },
      },
    },
  },
});

const bulkCreateRoute = createRoute({
  method: "post",
  path: "/bulk-create",
  tags: ["QuestionProposal"],
  summary: "選択した出題候補を一括登録",
  request: {
    body: {
      content: { "application/json": { schema: bulkCreateSchema } },
    },
  },
  responses: {
    200: {
      description: "作成された出題案一覧",
      content: {
        "application/json": {
          schema: z.array(questionProposalSchema),
        },
      },
    },
  },
});
```

**Step 3: ハンドラを置換**

旧 `.openapi(proposalGenerateRoute, ...)` を削除し、以下2つを追加:

```typescript
.openapi(generateCandidatesRoute, async (c) => {
  const { url } = c.req.valid("json");
  const candidates = await deps.generateCandidates.execute({ url });
  return c.json({ candidates });
})
.openapi(bulkCreateRoute, async (c) => {
  const input = c.req.valid("json");
  const proposals = await deps.bulkCreateQuestionProposals.execute(input);
  return c.json(proposals.map(toQuestionProposalResponse));
})
```

**Step 4: コンパイル確認**

Run: `pnpm --filter api exec tsc --noEmit`
Expected: PASS

**Step 5: コミット**

```bash
git add apps/api/src/presentation/routes/question-proposals/question-proposals.route.ts
git commit -m "feat: replace generate-from-url with generate-candidates and bulk-create endpoints"
```

---

### Task 5: フロントエンド - 候補選択 UI の実装

`ProposalGeneratePage` を改修。生成後にチェックボックス付き候補一覧を表示し、選択したもののみ一括登録。

**Files:**

- Modify: `apps/web/src/features/admin/proposals/proposal-generate-page.tsx`

**Step 1: import 追加**

```typescript
import { useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckSquare, Square, Eye } from "lucide-react";
```

**Step 2: 候補の型定義**

```typescript
type Candidate = {
  questionText: string;
  difficulty: "easy" | "medium" | "hard";
  choices: string[];
  correctIndexes: number[];
  explanation: string;
};
```

**Step 3: コンポーネント内の state 追加**

```typescript
const [candidates, setCandidates] = useState<Candidate[]>([]);
const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
const [detailIndex, setDetailIndex] = useState<number | null>(null);
```

**Step 4: generateMutation を変更**

API 呼び出し先を `generate-candidates` に変更し、成功時に candidates state を更新:

```typescript
const generateMutation = useMutation({
  mutationFn: async (data: GenerateForm) => {
    const res = await client.api["question-proposals"][
      "generate-candidates"
    ].$post({
      json: data,
    });
    if (!res.ok) throw new Error("Failed to generate candidates");
    return res.json();
  },
  onSuccess: (data) => {
    setCandidates(data.candidates);
    setSelectedIndexes(new Set(data.candidates.map((_, i) => i)));
  },
});
```

**Step 5: bulkCreateMutation を追加**

```typescript
const bulkCreateMutation = useMutation({
  mutationFn: async () => {
    const selectedQuestions = candidates.filter((_, i) =>
      selectedIndexes.has(i),
    );
    const res = await client.api["question-proposals"]["bulk-create"].$post({
      json: {
        categoryId: form.getValues("categoryId"),
        questions: selectedQuestions,
      },
    });
    if (!res.ok) throw new Error("Failed to create proposals");
    return res.json();
  },
  onSuccess: () => {
    navigate("/admin/proposals");
  },
});
```

**Step 6: 選択ヘルパー関数**

```typescript
const toggleSelect = useCallback((index: number) => {
  setSelectedIndexes((prev) => {
    const next = new Set(prev);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  });
}, []);

const toggleAll = useCallback(() => {
  setSelectedIndexes((prev) =>
    prev.size === candidates.length
      ? new Set()
      : new Set(candidates.map((_, i) => i)),
  );
}, [candidates]);
```

**Step 7: 結果テーブル部分を差し替え**

現在の `{generateMutation.data && (...)}` ブロックを以下に差し替え:

```tsx
{
  candidates.length > 0 && (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          生成候補（{candidates.length} 件中 {selectedIndexes.size} 件選択）
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {selectedIndexes.size === candidates.length ? (
              <>
                <Square className="size-4" />
                全解除
              </>
            ) : (
              <>
                <CheckSquare className="size-4" />
                全選択
              </>
            )}
          </Button>
          <Button
            size="sm"
            disabled={
              selectedIndexes.size === 0 || bulkCreateMutation.isPending
            }
            onClick={() => bulkCreateMutation.mutate()}
          >
            {bulkCreateMutation.isPending
              ? "登録中..."
              : `選択した ${selectedIndexes.size} 件を登録`}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-primary/10">
              <TableRow className="border-b-2 border-primary/30">
                <TableHead className="w-10" />
                <TableHead className="w-[60%] font-bold text-primary">
                  問題文
                </TableHead>
                <TableHead className="font-bold text-primary">難易度</TableHead>
                <TableHead className="font-bold text-primary">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIndexes.has(index)}
                      onCheckedChange={() => toggleSelect(index)}
                    />
                  </TableCell>
                  <TableCell className="max-w-0 truncate">
                    {item.questionText}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {difficultyLabels[item.difficulty] ?? item.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailIndex(index)}
                    >
                      <Eye className="size-4" />
                      詳細
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 8: 詳細モーダル追加**

コンポーネントの return の末尾（閉じ `</div>` の直前）に追加:

```tsx
<Dialog open={detailIndex !== null} onOpenChange={() => setDetailIndex(null)}>
  <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
    <DialogHeader>
      <DialogTitle>候補詳細</DialogTitle>
    </DialogHeader>
    {detailIndex !== null &&
      candidates[detailIndex] &&
      (() => {
        const item = candidates[detailIndex];
        return (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                問題文
              </p>
              <p className="mt-1">{item.questionText}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                難易度
              </p>
              <Badge variant="secondary" className="mt-1">
                {difficultyLabels[item.difficulty] ?? item.difficulty}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                選択肢
              </p>
              <ul className="mt-1 space-y-1">
                {item.choices.map((choice, i) => (
                  <li
                    key={i}
                    className={
                      item.correctIndexes.includes(i)
                        ? "font-bold text-green-600"
                        : ""
                    }
                  >
                    {i + 1}. {choice}
                    {item.correctIndexes.includes(i) && " ✓"}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">解説</p>
              <p className="mt-1 whitespace-pre-wrap">{item.explanation}</p>
            </div>
          </div>
        );
      })()}
  </DialogContent>
</Dialog>
```

**Step 9: コンパイル確認**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: PASS

**Step 10: コミット**

```bash
git add apps/web/src/features/admin/proposals/proposal-generate-page.tsx
git commit -m "feat: add candidate selection UI with detail modal"
```

---

### Task 6: ページ離脱防止の実装

候補が state にある状態でページ離脱時に確認ダイアログを表示。

**Files:**

- Modify: `apps/web/src/features/admin/proposals/proposal-generate-page.tsx`

**Step 1: beforeunload イベント追加**

import に `useEffect` を追加し、コンポーネント内に:

```typescript
useEffect(() => {
  if (candidates.length === 0) return;
  const handler = (e: BeforeUnloadEvent) => {
    e.preventDefault();
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}, [candidates.length]);
```

**Step 2: React Router useBlocker 追加**

```typescript
import { useNavigate, useBlocker } from "react-router-dom";
```

コンポーネント内に:

```typescript
const blocker = useBlocker(candidates.length > 0);

useEffect(() => {
  if (blocker.state === "blocked") {
    const confirmed = window.confirm(
      "生成された候補が未登録です。ページを離れますか？",
    );
    if (confirmed) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }
}, [blocker]);
```

**Step 3: コンパイル確認**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: PASS

**Step 4: コミット**

```bash
git add apps/web/src/features/admin/proposals/proposal-generate-page.tsx
git commit -m "feat: add navigation guard for unsaved candidates"
```

---

### Task 7: 動作確認 & エラー表示の追加

bulkCreateMutation のエラー表示を追加し、全体の動作確認。

**Files:**

- Modify: `apps/web/src/features/admin/proposals/proposal-generate-page.tsx`

**Step 1: エラー表示追加**

既存の `generateMutation.isError` ブロックの下に:

```tsx
{
  bulkCreateMutation.isError && (
    <p className="text-sm text-destructive">
      登録エラー: {bulkCreateMutation.error.message}
    </p>
  );
}
```

**Step 2: ビルド確認**

Run: `pnpm build`
Expected: PASS

**Step 3: コミット**

```bash
git add apps/web/src/features/admin/proposals/proposal-generate-page.tsx
git commit -m "feat: add error display for bulk create mutation"
```
