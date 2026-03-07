# ユーザーによる出題案の申請機能 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 一般ユーザーが出題案を作成・編集・申請でき、管理者がレビューできるようにする。

**Architecture:** ユーザー向け専用 API ルート `/api/user-proposals` を新設し、既存の管理者向けルートとは分離する。ユースケース層は共通で使い回す。フロントエンドは `/proposals` 配下にユーザー向けページを新設し、管理者画面には提案者情報を追加表示する。

**Tech Stack:** Hono (OpenAPIHono) / Drizzle ORM / React + TanStack Query + shadcn/ui

---

### Task 1: CreateQuestionProposal ユースケースに userId を追加

**Files:**

- Modify: `apps/api/src/application/question-proposal/create-question-proposal.ts`

**Step 1: `CreateQuestionProposalInput` に `userId` を追加**

```typescript
export type CreateQuestionProposalInput = {
  questionText: string;
  difficulty: string;
  choices: string[];
  correctIndexes: number[];
  explanation: string;
  categoryId: string;
  userId?: string; // 追加
};
```

**Step 2: `execute` 内で `userId` を `QuestionProposal.create()` に渡す**

```typescript
const { proposal, event } = QuestionProposal.create({
  questionText: QuestionText.create(input.questionText),
  difficulty: Difficulty.create(input.difficulty),
  choices: input.choices,
  correctIndexes: CorrectIndexes.create(input.correctIndexes),
  explanation: Explanation.create(input.explanation),
  categoryId: Id.of<Category>(input.categoryId),
  userId: input.userId, // 追加
});
```

**Step 3: ビルド確認**

Run: `pnpm --filter api tsc --noEmit`
Expected: エラーなし

**Step 4: コミット**

```bash
git add apps/api/src/application/question-proposal/create-question-proposal.ts
git commit -m "feat: CreateQuestionProposal に userId パラメータを追加"
```

---

### Task 2: QuestionProposalProjectionQueryService に listByUserId を追加

**Files:**

- Modify: `apps/api/src/domain/question-proposal/query-service/question-proposal-projection-query-service.ts`
- Modify: `apps/api/src/infrastructure/question-proposal/drizzle-question-proposal-projection-query-service.ts`

**Step 1: インターフェースに `listByUserId` メソッドを追加**

`apps/api/src/domain/question-proposal/query-service/question-proposal-projection-query-service.ts` に以下を追加:

```typescript
export interface QuestionProposalProjectionQueryService {
  list(
    status: string | undefined,
    categoryId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsResult>;
  findById(
    questionProposalId: string,
  ): Promise<QuestionProposalProjectionDto | null>;
  listByUserId( // 追加
    userId: string,
    status: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsResult>;
}
```

**Step 2: Drizzle 実装に `listByUserId` を追加**

`apps/api/src/infrastructure/question-proposal/drizzle-question-proposal-projection-query-service.ts` に以下のメソッドを追加:

```typescript
async listByUserId(
  userId: string,
  status: string | undefined,
  limit: number,
  offset: number,
): Promise<ListQuestionProposalsResult> {
  const tx = getCurrentTransaction();

  const userCondition = eq(questionProposalProjections.userId, userId);
  const statusCondition = status
    ? eq(
        questionProposalProjections.status,
        status as "pending" | "reviewed" | "approved" | "rejected" | "withdrawn",
      )
    : undefined;
  const conditions = and(userCondition, statusCondition);

  const [items, totalResult] = await Promise.all([
    tx
      .select({
        projection: questionProposalProjections,
        isPublished: questions.isPublished,
      })
      .from(questionProposalProjections)
      .leftJoin(
        questions,
        eq(questionProposalProjections.questionId, questions.id),
      )
      .where(conditions)
      .orderBy(desc(questionProposalProjections.createdAt))
      .limit(limit)
      .offset(offset),
    tx
      .select({ count: count() })
      .from(questionProposalProjections)
      .where(conditions),
  ]);

  return {
    items: items.map((row) => toDto(row.projection, row.isPublished)),
    total: totalResult[0]?.count ?? 0,
  };
}
```

**Step 3: ビルド確認**

Run: `pnpm --filter api tsc --noEmit`
Expected: エラーなし

**Step 4: コミット**

```bash
git add apps/api/src/domain/question-proposal/query-service/question-proposal-projection-query-service.ts \
        apps/api/src/infrastructure/question-proposal/drizzle-question-proposal-projection-query-service.ts
git commit -m "feat: QuestionProposalProjectionQueryService に listByUserId を追加"
```

---

### Task 3: Projection Query にユーザー名を追加（管理者向け）

**Files:**

- Modify: `apps/api/src/domain/question-proposal/query-service/question-proposal-projection-query-service.ts`
- Modify: `apps/api/src/infrastructure/question-proposal/drizzle-question-proposal-projection-query-service.ts`

**Step 1: DTO に `userName` を追加**

`QuestionProposalProjectionDto` に以下を追加:

```typescript
export type QuestionProposalProjectionDto = {
  // ... 既存フィールド
  userName: string | null; // 追加
};
```

**Step 2: Drizzle 実装の `list` と `findById` で user テーブルを LEFT JOIN**

`drizzle-question-proposal-projection-query-service.ts` を変更:

- import に `user` を追加: `import { questionProposalProjections, questions, user } from "../db/schema.ts";`
- `list` メソッドの select に `.leftJoin(user, eq(questionProposalProjections.userId, user.id))` を追加
- `findById` メソッドにも同様の LEFT JOIN を追加
- select に `userName: user.name` を追加
- `toDto` 関数に `userName` パラメータを追加

`toDto` の変更後:

```typescript
function toDto(
  row: typeof questionProposalProjections.$inferSelect,
  isPublished: boolean | null,
  userName: string | null,
): QuestionProposalProjectionDto {
  return {
    // ... 既存フィールド
    userName,
  };
}
```

**Step 3: `listByUserId` の `toDto` 呼び出しも更新**

`listByUserId` は自分の出題案なので `userName` は不要だが、インターフェースの統一のため null を渡す（もしくは呼び出し元でセッションの名前を使う）。ここでは null を渡す:

```typescript
items: items.map((row) => toDto(row.projection, row.isPublished, null)),
```

**Step 4: ビルド確認**

Run: `pnpm --filter api tsc --noEmit`
Expected: エラーなし

**Step 5: コミット**

```bash
git add apps/api/src/domain/question-proposal/query-service/question-proposal-projection-query-service.ts \
        apps/api/src/infrastructure/question-proposal/drizzle-question-proposal-projection-query-service.ts
git commit -m "feat: QuestionProposalProjectionDto に userName を追加（user テーブル JOIN）"
```

---

### Task 4: 管理者向けレスポンスに userName を追加

**Files:**

- Modify: `apps/api/src/presentation/routes/question-proposals/type.ts`
- Modify: `apps/api/src/presentation/routes/question-proposals/question-proposals.route.ts`

**Step 1: `QuestionProposalProjectionResponse` に `userName` を追加**

`apps/api/src/presentation/routes/question-proposals/type.ts`:

```typescript
export type QuestionProposalProjectionResponse = {
  // ... 既存フィールド
  userName: string | null; // 追加
};
```

`toProjectionResponse` は spread で DTO をコピーしているので、`userName` は自動的に含まれる。

**Step 2: ルートの OpenAPI スキーマに `userName` を追加**

`apps/api/src/presentation/routes/question-proposals/question-proposals.route.ts` の `questionProposalWithDatesSchema` に追加:

```typescript
userName: z.string().nullable(), // 追加
```

**Step 3: ビルド確認**

Run: `pnpm --filter api tsc --noEmit`
Expected: エラーなし

**Step 4: コミット**

```bash
git add apps/api/src/presentation/routes/question-proposals/type.ts \
        apps/api/src/presentation/routes/question-proposals/question-proposals.route.ts
git commit -m "feat: 管理者向け出題案レスポンスに userName を追加"
```

---

### Task 5: ユーザー向け API ルート `/api/user-proposals` を作成

**Files:**

- Create: `apps/api/src/presentation/routes/user-proposals/user-proposals.route.ts`
- Modify: `apps/api/src/presentation/routes/index.ts`

**Step 1: ユーザー向けルートファイルを作成**

`apps/api/src/presentation/routes/user-proposals/user-proposals.route.ts`:

```typescript
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Dependencies } from "../../../composition-root.ts";
import type { AuthEnv } from "../../../infrastructure/auth/auth-middleware.ts";
import { errorSchema } from "../shared/schema.ts";
import {
  toQuestionProposalResponse,
  toProjectionResponse,
} from "../question-proposals/type.ts";

const questionProposalSchema = z
  .object({
    id: z.string().uuid(),
    status: z.string(),
    text: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
    rejectReason: z.string().optional(),
  })
  .openapi("UserQuestionProposal");

const projectionSchema = z
  .object({
    questionProposalId: z.string().uuid(),
    status: z.string(),
    text: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
    rejectReason: z.string().nullable(),
    questionCreated: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("UserQuestionProposalProjection");

const createSchema = z
  .object({
    questionText: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
  })
  .openapi("CreateUserProposalRequest");

const updateSchema = z
  .object({
    questionText: z.string(),
    difficulty: z.string(),
    choices: z.array(z.string()),
    correctIndexes: z.array(z.number().int()),
    explanation: z.string(),
    categoryId: z.string().uuid(),
  })
  .openapi("UpdateUserProposalRequest");

const proposalIdParam = z.object({
  id: z.string().uuid(),
});

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["UserProposal"],
  summary: "自分の出題案一覧を取得",
  request: {
    query: z.object({
      status: z
        .enum(["pending", "reviewed", "approved", "rejected", "withdrawn"])
        .optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  },
  responses: {
    200: {
      description: "出題案一覧",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(projectionSchema),
            total: z.number().int(),
          }),
        },
      },
    },
  },
});

const getRoute = createRoute({
  method: "get",
  path: "/:id",
  tags: ["UserProposal"],
  summary: "自分の出題案詳細を取得",
  request: { params: proposalIdParam },
  responses: {
    200: {
      description: "出題案詳細",
      content: { "application/json": { schema: projectionSchema } },
    },
    403: {
      description: "権限なし",
      content: { "application/json": { schema: errorSchema } },
    },
    404: {
      description: "見つかりません",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

const createProposalRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["UserProposal"],
  summary: "出題案を新規作成",
  request: {
    body: { content: { "application/json": { schema: createSchema } } },
  },
  responses: {
    200: {
      description: "作成された出題案",
      content: { "application/json": { schema: questionProposalSchema } },
    },
  },
});

const updateRoute = createRoute({
  method: "put",
  path: "/:id",
  tags: ["UserProposal"],
  summary: "出題案を編集",
  request: {
    params: proposalIdParam,
    body: { content: { "application/json": { schema: updateSchema } } },
  },
  responses: {
    200: {
      description: "更新された出題案",
      content: { "application/json": { schema: questionProposalSchema } },
    },
    403: {
      description: "権限なし",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

const submitRoute = createRoute({
  method: "post",
  path: "/:id/submit",
  tags: ["UserProposal"],
  summary: "出題案を申請",
  request: { params: proposalIdParam },
  responses: {
    200: {
      description: "申請された出題案",
      content: { "application/json": { schema: questionProposalSchema } },
    },
    403: {
      description: "権限なし",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

export const createUserProposalsRoute = (deps: Dependencies) =>
  new OpenAPIHono<AuthEnv>()
    .openapi(listRoute, async (c) => {
      const user = c.get("user");
      const { status, limit, offset } = c.req.valid("query");
      const result = await deps.listUserProposals.execute(
        user.id,
        status,
        limit,
        offset,
      );
      return c.json({
        items: result.items.map(toProjectionResponse),
        total: result.total,
      });
    })
    .openapi(getRoute, async (c) => {
      const user = c.get("user");
      const { id } = c.req.valid("param");
      const proposal = await deps.getQuestionProposal.execute(id);
      if (!proposal) {
        return c.json({ error: "Not found" }, 404);
      }
      if (proposal.userId !== user.id) {
        return c.json({ error: "Forbidden" }, 403);
      }
      return c.json(toProjectionResponse(proposal), 200);
    })
    .openapi(createProposalRoute, async (c) => {
      const user = c.get("user");
      const input = c.req.valid("json");
      const proposal = await deps.createQuestionProposal.execute({
        ...input,
        userId: user.id,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(updateRoute, async (c) => {
      const user = c.get("user");
      const { id } = c.req.valid("param");
      // 所有者チェック
      const existing = await deps.getQuestionProposal.execute(id);
      if (!existing || existing.userId !== user.id) {
        return c.json({ error: "Forbidden" }, 403);
      }
      const input = c.req.valid("json");
      const proposal = await deps.updateQuestionProposal.execute({
        questionProposalId: id,
        ...input,
      });
      return c.json(toQuestionProposalResponse(proposal));
    })
    .openapi(submitRoute, async (c) => {
      const user = c.get("user");
      const { id } = c.req.valid("param");
      // 所有者チェック
      const existing = await deps.getQuestionProposal.execute(id);
      if (!existing || existing.userId !== user.id) {
        return c.json({ error: "Forbidden" }, 403);
      }
      const proposal = await deps.submitQuestionProposal.execute({
        questionProposalId: id,
      });
      return c.json(toQuestionProposalResponse(proposal));
    });
```

**Step 2: ユーザー向け一覧ユースケースを作成**

Create: `apps/api/src/application/question-proposal/list-user-proposals.ts`

```typescript
import type {
  QuestionProposalProjectionQueryService,
  ListQuestionProposalsResult,
} from "../../domain/question-proposal/query-service/question-proposal-projection-query-service.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class ListUserProposals {
  constructor(
    private uow: UnitOfWork,
    private queryService: QuestionProposalProjectionQueryService,
  ) {}

  async execute(
    userId: string,
    status: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsResult> {
    return this.uow.run(async () => {
      return await this.queryService.listByUserId(
        userId,
        status,
        limit,
        offset,
      );
    });
  }
}
```

**Step 3: composition-root に ListUserProposals を登録**

`apps/api/src/composition-root.ts` に以下を追加:

- import: `import { ListUserProposals } from "./application/question-proposal/list-user-proposals.ts";`
- インスタンス化:

```typescript
const listUserProposals = new ListUserProposals(
  unitOfWork,
  questionProposalProjectionQueryService,
);
```

- `dependencies` オブジェクトに `listUserProposals` を追加

**Step 4: ルートを登録**

`apps/api/src/presentation/routes/index.ts` に追加:

- import: `import { createUserProposalsRoute } from "./user-proposals/user-proposals.route.ts";`
- `.use("/*", requireAuth)` の後（`requireAdmin` の前）に `.route("/user-proposals", createUserProposalsRoute(deps))` を追加

注意: `/user-proposals/*` は `requireAdmin` の対象にしない。現在の `index.ts` では `.use("/*", requireAuth)` の後に個別ルートの admin ミドルウェアが設定されている。`/user-proposals` には admin ミドルウェアを設定しないので、`requireAuth` のみで保護される。

**Step 5: ビルド確認**

Run: `pnpm --filter api tsc --noEmit`
Expected: エラーなし

**Step 6: コミット**

```bash
git add apps/api/src/presentation/routes/user-proposals/user-proposals.route.ts \
        apps/api/src/application/question-proposal/list-user-proposals.ts \
        apps/api/src/composition-root.ts \
        apps/api/src/presentation/routes/index.ts
git commit -m "feat: ユーザー向け出題案 API ルート /api/user-proposals を追加"
```

---

### Task 6: フロントエンドに constants と共通の ProposalEditForm を整備

**Files:**

- Modify: `apps/web/src/features/admin/proposals/constants.ts` → 移動先: `apps/web/src/features/proposals/constants.ts`

**Step 1: 共通 constants を作成**

`apps/web/src/features/admin/proposals/constants.ts` の内容は既にユーザー向けでも使えるので、`apps/web/src/features/proposals/constants.ts` にコピーして共用する。

管理者向けの既存 import は変更しなくてよい（重複を避けたい場合は admin 側を re-export に変更する）。

Create: `apps/web/src/features/proposals/constants.ts`

```typescript
export {
  statusLabels,
  statusVariants,
  difficultyLabels,
} from "../admin/proposals/constants";
```

**Step 2: コミット**

```bash
git add apps/web/src/features/proposals/constants.ts
git commit -m "feat: ユーザー向け proposals 用の constants を整備"
```

---

### Task 7: ユーザー向け出題案一覧ページを作成

**Files:**

- Create: `apps/web/src/features/proposals/proposal-list-page.tsx`

**Step 1: 一覧ページを作成**

```tsx
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/client";
import { statusLabels, statusVariants, difficultyLabels } from "./constants";

const PAGE_SIZE = 20;

export function UserProposalListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["user-proposals", statusFilter, offset],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(offset),
      };
      if (statusFilter !== "all") {
        query.status = statusFilter;
      }
      const res = await client.api["user-proposals"].$get({ query });
      if (!res.ok) throw new Error("Failed to fetch proposals");
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">出題案</h2>
        <Button onClick={() => navigate("/proposals/new")}>
          <Plus className="size-4" />
          新規作成
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="pending">下書き</SelectItem>
            <SelectItem value="reviewed">レビュー待ち</SelectItem>
            <SelectItem value="approved">承認済</SelectItem>
            <SelectItem value="rejected">却下</SelectItem>
          </SelectContent>
        </Select>
        {data && (
          <span className="text-sm text-muted-foreground">{data.total} 件</span>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : (
        <>
          <div className="rounded-md border bg-background">
            <Table>
              <TableHeader className="bg-primary/10">
                <TableRow className="border-b-2 border-primary/30">
                  <TableHead className="w-[50%] font-bold text-primary">
                    問題文
                  </TableHead>
                  <TableHead className="font-bold text-primary">
                    難易度
                  </TableHead>
                  <TableHead className="font-bold text-primary">
                    ステータス
                  </TableHead>
                  <TableHead className="font-bold text-primary">
                    作成日
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      出題案がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((item) => (
                    <TableRow
                      key={item.questionProposalId}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/proposals/${item.questionProposalId}`)
                      }
                    >
                      <TableCell className="max-w-0 truncate font-medium">
                        {item.text}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {difficultyLabels[item.difficulty] ?? item.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariants[item.status] ?? "outline"}
                        >
                          {statusLabels[item.status] ?? item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              >
                前へ
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
              >
                次へ
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

**Step 2: コミット**

```bash
git add apps/web/src/features/proposals/proposal-list-page.tsx
git commit -m "feat: ユーザー向け出題案一覧ページを作成"
```

---

### Task 8: ユーザー向け出題案作成ページを作成

**Files:**

- Create: `apps/web/src/features/proposals/proposal-new-page.tsx`

**Step 1: 作成ページを作成**

管理者向けの `ProposalEditForm` コンポーネントを再利用する。ただし、管理者向けの `proposal-new-page.tsx` はフォームを直接インライン展開しているため、`ProposalEditForm` を使う新しいページを作成する。

```tsx
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  ProposalEditForm,
  type EditFormData,
} from "../admin/proposals/proposal-edit-form";
import { client } from "@/client";

export function UserProposalNewPage() {
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      const res = await client.api["user-proposals"].$post({
        json: {
          questionText: data.questionText,
          difficulty: data.difficulty,
          choices: data.choices.map((c) => c.value),
          correctIndexes: data.correctIndexes,
          explanation: data.explanation,
          categoryId: data.categoryId,
        },
      });
      if (!res.ok) throw new Error("Failed to create proposal");
      return res.json();
    },
    onSuccess: (data) => {
      navigate(`/proposals/${data.id}`);
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">出題案を作成</h2>
      <ProposalEditForm
        defaultValues={{
          questionText: "",
          difficulty: "medium",
          choices: [{ value: "" }, { value: "" }, { value: "" }, { value: "" }],
          correctIndexes: [],
          explanation: "",
          categoryId: "",
        }}
        onSubmit={(data) => createMutation.mutate(data)}
        onCancel={() => navigate("/proposals")}
        isPending={createMutation.isPending}
        error={createMutation.error?.message}
      />
    </div>
  );
}
```

**Step 2: コミット**

```bash
git add apps/web/src/features/proposals/proposal-new-page.tsx
git commit -m "feat: ユーザー向け出題案作成ページを作成"
```

---

### Task 9: ユーザー向け出題案詳細ページを作成

**Files:**

- Create: `apps/web/src/features/proposals/proposal-detail-page.tsx`

**Step 1: 詳細ページを作成**

ユーザー視点では approve/reject/withdraw は不要。edit と submit のみ。

```tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/client";
import {
  ProposalEditForm,
  type EditFormData,
} from "../admin/proposals/proposal-edit-form";
import { statusLabels, statusVariants, difficultyLabels } from "./constants";

export function UserProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["user-proposal", id],
    queryFn: async () => {
      const res = await client.api["user-proposals"][":id"].$get({
        param: { id: id! },
      });
      if (!res.ok) throw new Error("Failed to fetch proposal");
      return res.json();
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      const res = await client.api["user-proposals"][":id"].$put({
        param: { id: id! },
        json: {
          questionText: data.questionText,
          difficulty: data.difficulty,
          choices: data.choices.map((c) => c.value),
          correctIndexes: data.correctIndexes,
          explanation: data.explanation,
          categoryId: data.categoryId,
        },
      });
      if (!res.ok) throw new Error("Failed to update proposal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-proposal", id] });
      setEditing(false);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api["user-proposals"][":id"].submit.$post({
        param: { id: id! },
      });
      if (!res.ok) throw new Error("Failed to submit proposal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-proposal", id] });
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground">読み込み中...</p>;
  }

  if (!proposal || "error" in proposal) {
    return <p className="text-destructive">出題案が見つかりません</p>;
  }

  const canEdit = ["pending", "rejected"].includes(proposal.status);

  if (editing) {
    return (
      <ProposalEditForm
        defaultValues={{
          questionText: proposal.text,
          difficulty: proposal.difficulty as "easy" | "medium" | "hard",
          choices: proposal.choices.map((c) => ({ value: c })),
          correctIndexes: [...proposal.correctIndexes],
          explanation: proposal.explanation,
          categoryId: proposal.categoryId,
        }}
        onSubmit={(data) => updateMutation.mutate(data)}
        onCancel={() => setEditing(false)}
        isPending={updateMutation.isPending}
        error={updateMutation.error?.message}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/proposals")}
        >
          <ArrowLeft className="size-4" />
          一覧へ戻る
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight">出題案詳細</h2>
          <Badge variant={statusVariants[proposal.status] ?? "outline"}>
            {statusLabels[proposal.status] ?? proposal.status}
          </Badge>
          <Badge variant="secondary">
            {difficultyLabels[proposal.difficulty] ?? proposal.difficulty}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              編集
            </Button>
          )}
          {proposal.status === "pending" && (
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              <Send className="size-4" />
              {submitMutation.isPending ? "申請中..." : "申請する"}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">問題文</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{proposal.text}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">選択肢</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {proposal.choices.map((choice, i) => {
              const isCorrect = proposal.correctIndexes.includes(i);
              return (
                <li
                  key={i}
                  className={`rounded-md border px-4 py-2 text-sm ${
                    isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : ""
                  }`}
                >
                  <span className="mr-2 font-mono text-muted-foreground">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {choice}
                  {isCorrect && (
                    <Check className="ml-2 inline size-4 text-green-600" />
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">解説</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{proposal.explanation}</p>
        </CardContent>
      </Card>

      {proposal.rejectReason && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              却下理由
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{proposal.rejectReason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 2: コミット**

```bash
git add apps/web/src/features/proposals/proposal-detail-page.tsx
git commit -m "feat: ユーザー向け出題案詳細ページを作成"
```

---

### Task 10: ルーティングとナビゲーションにユーザー向けページを追加

**Files:**

- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/components/app-layout.tsx`

**Step 1: main.tsx にルートを追加**

import を追加:

```typescript
import { UserProposalListPage } from "./features/proposals/proposal-list-page";
import { UserProposalNewPage } from "./features/proposals/proposal-new-page";
import { UserProposalDetailPage } from "./features/proposals/proposal-detail-page";
```

`<Route element={<AppLayout />}>` の子として以下を追加（`/drill` の近くに配置）:

```tsx
<Route path="/proposals" element={<UserProposalListPage />} />
<Route path="/proposals/new" element={<UserProposalNewPage />} />
<Route path="/proposals/:id" element={<UserProposalDetailPage />} />
```

**Step 2: app-layout.tsx のナビに「出題案」を追加**

import に `Lightbulb` を追加:

```typescript
import {
  FlaskConical,
  LogOut,
  Shield,
  BookOpen,
  BarChart3,
  Lightbulb,
} from "lucide-react";
```

`navItems` に追加:

```typescript
const navItems = [
  { to: "/", label: "ドリル", icon: BookOpen },
  { to: "/proposals", label: "出題案", icon: Lightbulb },
  { to: "/stats", label: "成績", icon: BarChart3 },
];
```

ヘッダーのパンくず表示ロジックにも `/proposals` の対応を追加（既存の `navItems` ベースのロジックで自動的に動作する。ただし `/proposals/new` や `/proposals/:id` のサブパスも「出題案」と表示されるよう、`startsWith` のロジックを確認する）。

現在のロジック:

```typescript
location.pathname === item.to ||
  location.pathname.startsWith(item.to === "/" ? "/drill" : item.to);
```

`/proposals` は `item.to === "/proposals"` なので、`/proposals/new` や `/proposals/:id` も `startsWith("/proposals")` でマッチする。問題なし。

**Step 3: ビルド確認**

Run: `pnpm build`
Expected: エラーなし

**Step 4: コミット**

```bash
git add apps/web/src/main.tsx apps/web/src/components/app-layout.tsx
git commit -m "feat: ルーティングとナビゲーションにユーザー向け出題案ページを追加"
```

---

### Task 11: 管理者画面にユーザー名を表示

**Files:**

- Modify: `apps/web/src/features/admin/proposals/proposal-list-page.tsx`
- Modify: `apps/web/src/features/admin/proposals/proposal-detail-view.tsx`

**Step 1: 一覧ページに「提案者」列を追加**

`apps/web/src/features/admin/proposals/proposal-list-page.tsx` の `<TableHeader>` に列を追加:

```tsx
<TableHead className="font-bold text-primary">提案者</TableHead>
```

各行に対応するセルを追加:

```tsx
<TableCell className="text-sm">{item.userName ?? "管理者"}</TableCell>
```

`colSpan` を 5 → 6 に変更（空行表示時）。

**Step 2: 詳細ページにユーザー名を表示**

`apps/web/src/features/admin/proposals/proposal-detail-view.tsx` の `Proposal` type に `userName` を追加:

```typescript
type Proposal = {
  // ... 既存
  userName?: string | null;
};
```

ヘッダー部分の Badge の横にユーザー名を表示:

```tsx
{
  proposal.userName && (
    <Badge variant="outline">提案者: {proposal.userName}</Badge>
  );
}
```

**Step 3: ビルド確認**

Run: `pnpm build`
Expected: エラーなし

**Step 4: コミット**

```bash
git add apps/web/src/features/admin/proposals/proposal-list-page.tsx \
        apps/web/src/features/admin/proposals/proposal-detail-view.tsx
git commit -m "feat: 管理者画面の出題案一覧・詳細にユーザー名を表示"
```

---

### Task 12: 動作確認

**Step 1: ローカル DB を起動**

Run: `docker compose up -d`

**Step 2: マイグレーション実行（スキーマ変更がないので不要だが念のため）**

Run: `pnpm --filter api db:push`

**Step 3: 開発サーバーを起動して動作確認**

Run: `pnpm dev`

以下を確認:

- 一般ユーザーでログイン → サイドバーに「出題案」メニューが表示される
- `/proposals` で一覧が表示される（空の状態）
- `/proposals/new` で出題案を作成できる
- 作成後に詳細ページに遷移し、内容が表示される
- 「申請する」ボタンでステータスが reviewed に変わる
- 管理者でログイン → `/admin/proposals` にユーザー名が表示される
- 管理者が承認/却下できる
- 却下された出題案をユーザーが編集・再申請できる

**Step 4: サーバーを停止**

**Step 5: コミット（最終調整があれば）**

```bash
git add -A
git commit -m "fix: 動作確認で見つかった修正"
```
