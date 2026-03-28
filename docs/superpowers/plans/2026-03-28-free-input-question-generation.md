# キーワード・説明文からの問題生成 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ユーザーがキーワードや説明文をテキスト入力し、AIが正解ベースで問題・ダミー選択肢・解説を生成する新しいソースタイプ `freeInput` を追加する。

**Architecture:** 既存の `GenerationSource` discriminated union に `freeInput` バリアントを追加し、Gemini アダプターで正解ベース生成用プロンプトに分岐する。フロントエンドの生成フォームに4つ目のソースタブを追加する。生成数は `freeInput` の場合のみ3問固定。

**Tech Stack:** TypeScript, Zod, Hono (OpenAPIHono), Gemini API (@google/genai), React, react-hook-form, shadcn/ui

**注意:** 既存コードでは discriminator フィールドが `type`（設計ドキュメントの `sourceType` ではない）。本計画はコードに合わせて `type` を使用する。

---

## ファイル構成

| 操作 | ファイル                                                                                               | 責務                                           |
| ---- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| 修正 | `apps/api/src/application/question-proposal/question-generation-service.ts`                            | `GenerationSource` 型に `freeInput` 追加       |
| 修正 | `apps/api/src/application/question-proposal/generate-candidates.ts`                                    | `freeInput` の場合は3問に変更                  |
| 修正 | `apps/api/src/infrastructure/question-generation/gemini-question-generation-adapter.ts`                | `freeInput` 分岐と正解ベースプロンプト追加     |
| 修正 | `apps/api/src/infrastructure/question-generation/__tests__/gemini-question-generation-adapter.test.ts` | `freeInput` テスト追加                         |
| 修正 | `apps/api/src/presentation/routes/question-proposals/question-proposals.route.ts`                      | Zod スキーマに `freeInput` バリアント追加      |
| 修正 | `apps/web/src/features/admin/proposals/proposal-generate-page.tsx`                                     | 「キーワード・説明文」タブとテキストエリア追加 |

---

### Task 1: GenerationSource 型に freeInput を追加

**Files:**

- Modify: `apps/api/src/application/question-proposal/question-generation-service.ts`

- [ ] **Step 1: `GenerationSource` 型に `freeInput` バリアントを追加**

```typescript
// apps/api/src/application/question-proposal/question-generation-service.ts
export type GeneratedQuestion = {
  questionText: string;
  difficulty: "easy" | "medium" | "hard";
  choices: string[];
  correctIndexes: number[];
  explanation: string;
};

export type GenerationSource =
  | { type: "url"; url: string }
  | { type: "pdf"; data: string }
  | { type: "image"; data: string; mimeType: "image/jpeg" | "image/png" }
  | { type: "freeInput"; input: string };

export interface QuestionGenerationService {
  generate(
    source: GenerationSource,
    questionCount: number,
  ): Promise<GeneratedQuestion[]>;
}
```

- [ ] **Step 2: 型チェックを実行**

Run: `pnpm --filter api exec tsc --noEmit`
Expected: コンパイルエラー — `buildPrompt` と `generate` メソッドで `freeInput` のケースが網羅されていない（switch/if-else の exhaustive check）。これは Task 3 で修正する。

- [ ] **Step 3: コミット**

```bash
git add apps/api/src/application/question-proposal/question-generation-service.ts
git commit -m "feat: GenerationSource 型に freeInput バリアントを追加"
```

---

### Task 2: GenerateCandidates ユースケースで freeInput は3問固定にする

**Files:**

- Modify: `apps/api/src/application/question-proposal/generate-candidates.ts`

- [ ] **Step 1: freeInput の場合は3問、それ以外は10問にする**

```typescript
// apps/api/src/application/question-proposal/generate-candidates.ts
import type {
  GeneratedQuestion,
  GenerationSource,
  QuestionGenerationService,
} from "./question-generation-service.ts";

const DEFAULT_QUESTION_COUNT = 10;
const FREE_INPUT_QUESTION_COUNT = 3;

export class GenerateCandidates {
  constructor(private questionGenerationService: QuestionGenerationService) {}

  async execute(input: GenerationSource): Promise<GeneratedQuestion[]> {
    const questionCount =
      input.type === "freeInput"
        ? FREE_INPUT_QUESTION_COUNT
        : DEFAULT_QUESTION_COUNT;
    return this.questionGenerationService.generate(input, questionCount);
  }
}
```

- [ ] **Step 2: コミット**

```bash
git add apps/api/src/application/question-proposal/generate-candidates.ts
git commit -m "feat: freeInput ソースの場合は生成数を3問に変更"
```

---

### Task 3: Gemini アダプターに freeInput 対応を追加

**Files:**

- Modify: `apps/api/src/infrastructure/question-generation/gemini-question-generation-adapter.ts`
- Test: `apps/api/src/infrastructure/question-generation/__tests__/gemini-question-generation-adapter.test.ts`

- [ ] **Step 1: テストファイルに freeInput のテストを追加**

`apps/api/src/infrastructure/question-generation/__tests__/gemini-question-generation-adapter.test.ts` の末尾、`describe("空レスポンス", ...)` の前に以下を追加:

```typescript
describe("freeInput source", () => {
  it("テキストのみをプロンプトに含め、urlContext や inlineData を使わない", async () => {
    mockGenerateContent.mockResolvedValue({ text: VALID_RESPONSE });

    await adapter.generate({ type: "freeInput", input: "GHSとは" }, 3);

    expect(mockGenerateContent).toHaveBeenCalledOnce();
    const args = mockGenerateContent.mock.calls[0][0];

    // urlContext が含まれていないこと
    expect(args.config?.tools).toBeUndefined();

    // contents がテキストのみ（inlineData なし）
    expect(args.contents).toEqual(
      expect.arrayContaining([expect.stringContaining("GHSとは")]),
    );
  });

  it("正解ベース生成用のプロンプトが使用される", async () => {
    mockGenerateContent.mockResolvedValue({ text: VALID_RESPONSE });

    await adapter.generate({ type: "freeInput", input: "SDSの記載項目" }, 3);

    const args = mockGenerateContent.mock.calls[0][0];
    const prompt = args.contents[0];
    expect(prompt).toContain("正解の根拠として");
    expect(prompt).toContain("SDSの記載項目");
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `pnpm --filter api test -- --run apps/api/src/infrastructure/question-generation/__tests__/gemini-question-generation-adapter.test.ts`
Expected: FAIL — `freeInput` のケースが `generate` メソッドと `buildPrompt` メソッドで未処理。

- [ ] **Step 3: `generate` メソッドに freeInput 分岐を追加**

`apps/api/src/infrastructure/question-generation/gemini-question-generation-adapter.ts` の `generate` メソッドを以下に変更:

```typescript
  async generate(
    source: GenerationSource,
    questionCount: number,
  ): Promise<GeneratedQuestion[]> {
    const promptText = this.buildPrompt(source, questionCount);

    let requestParams;
    if (source.type === "url") {
      requestParams = {
        model: MODEL,
        contents: [promptText],
        config: { tools: [{ urlContext: {} }] },
      };
    } else if (source.type === "freeInput") {
      requestParams = {
        model: MODEL,
        contents: [promptText],
      };
    } else {
      requestParams = {
        model: MODEL,
        contents: [
          {
            role: "user" as const,
            parts: [
              {
                inlineData: {
                  mimeType:
                    source.type === "pdf"
                      ? "application/pdf"
                      : source.mimeType,
                  data: source.data,
                },
              },
              { text: promptText },
            ],
          },
        ],
      };
    }

    const response =
      await this.getClient().models.generateContent(requestParams);

    const text = response.text;
    if (!text) {
      throw new Error("Gemini API からのレスポンスが空です");
    }

    try {
      const jsonText = this.extractJson(text);
      const parsed = JSON.parse(jsonText);
      return questionGenerationResultSchema.parse(parsed);
    } catch (e) {
      throw new Error(
        `Gemini の出力を解析できませんでした: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
```

- [ ] **Step 4: `buildPrompt` メソッドに freeInput 分岐を追加**

`buildPrompt` メソッドを以下に変更:

```typescript
  private buildPrompt(source: GenerationSource, questionCount: number): string {
    if (source.type === "freeInput") {
      return `以下の内容を正解の根拠として、化学物質管理に関するクイズを${questionCount}問生成してください。
ダミーの選択肢もそれらしいものを生成してください。

入力内容:
${source.input}

## ルール
1. 各問題は4〜8個の選択肢を持ってください。
2. 正解は1つ以上設定できます。複数正解の問題も含めてください。
3. 難易度は easy / medium / hard のいずれかで、バランスよく割り振ってください。
4. 問題文は500文字以内、解説文は1000文字以内としてください。
5. 正確な情報に基づいた問題を作成してください。
6. 入力内容が正解の根拠となるようにしてください。

## 出力形式
以下の JSON 配列形式で出力してください。JSON のみを出力し、それ以外のテキストは含めないでください。

\`\`\`json
[
  {
    "questionText": "問題文",
    "difficulty": "easy",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correctIndexes": [0],
    "explanation": "解説文"
  }
]
\`\`\``;
    }

    const sourceDescription =
      source.type === "url"
        ? `以下のURLの内容を読み取り、`
        : source.type === "pdf"
          ? `以下のPDFの内容を読み取り、`
          : `以下の画像の内容を読み取り、`;

    const urlLine = source.type === "url" ? `\nURL: ${source.url}\n` : "";

    return `${sourceDescription}化学物質管理に関するクイズを${questionCount}問生成してください。
${urlLine}
## ルール
1. 各問題は4〜8個の選択肢を持ってください。
2. 正解は1つ以上設定できます。複数正解の問題も含めてください。
3. 難易度は easy / medium / hard のいずれかで、バランスよく割り振ってください。
4. 問題文は500文字以内、解説文は1000文字以内としてください。
5. 正確な情報に基づいた問題を作成してください。

## 出力形式
以下の JSON 配列形式で出力してください。JSON のみを出力し、それ以外のテキストは含めないでください。

\`\`\`json
[
  {
    "questionText": "問題文",
    "difficulty": "easy",
    "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correctIndexes": [0],
    "explanation": "解説文"
  }
]
\`\`\``;
  }
```

- [ ] **Step 5: テストを実行して成功を確認**

Run: `pnpm --filter api test -- --run apps/api/src/infrastructure/question-generation/__tests__/gemini-question-generation-adapter.test.ts`
Expected: ALL PASS

- [ ] **Step 6: コミット**

```bash
git add apps/api/src/infrastructure/question-generation/gemini-question-generation-adapter.ts apps/api/src/infrastructure/question-generation/__tests__/gemini-question-generation-adapter.test.ts
git commit -m "feat: Gemini アダプターに freeInput ソース対応を追加"
```

---

### Task 4: API ルートのリクエストスキーマに freeInput を追加

**Files:**

- Modify: `apps/api/src/presentation/routes/question-proposals/question-proposals.route.ts`

- [ ] **Step 1: `generateCandidatesSchema` に freeInput バリアントを追加**

`apps/api/src/presentation/routes/question-proposals/question-proposals.route.ts` の `generateCandidatesSchema` を以下に変更:

```typescript
const generateCandidatesSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("url"),
      url: z.string().url(),
    }),
    z.object({
      type: z.literal("pdf"),
      data: z
        .string()
        .refine(
          (s) => base64ByteLength(s) <= MAX_PDF_SIZE_BYTES,
          "PDF ファイルは 4MB 以下にしてください",
        ),
    }),
    z.object({
      type: z.literal("image"),
      data: z
        .string()
        .refine(
          (s) => base64ByteLength(s) <= MAX_IMAGE_SIZE_BYTES,
          "画像ファイルは 2MB 以下にしてください",
        ),
      mimeType: z.enum(["image/jpeg", "image/png"]),
    }),
    z.object({
      type: z.literal("freeInput"),
      input: z.string().min(1).max(2000),
    }),
  ])
  .openapi("GenerateCandidatesRequest");
```

- [ ] **Step 2: `generateCandidatesRoute` のサマリーを更新**

```typescript
const generateCandidatesRoute = createRoute({
  method: "post",
  path: "/generate-candidates",
  tags: ["QuestionProposal"],
  summary: "URL・PDF・画像・キーワードからAI出題候補を生成（DB保存なし）",
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
```

- [ ] **Step 3: 型チェックを実行**

Run: `pnpm --filter api exec tsc --noEmit`
Expected: PASS（エラーなし）

- [ ] **Step 4: コミット**

```bash
git add apps/api/src/presentation/routes/question-proposals/question-proposals.route.ts
git commit -m "feat: API ルートのリクエストスキーマに freeInput バリアントを追加"
```

---

### Task 5: フロントエンドに「キーワード・説明文」ソースタブを追加

**Files:**

- Modify: `apps/web/src/features/admin/proposals/proposal-generate-page.tsx`

- [ ] **Step 1: `Textarea` コンポーネントの import を追加**

ファイル先頭の import ブロックに追加:

```typescript
import { Textarea } from "@/components/ui/textarea";
```

- [ ] **Step 2: freeInput 用の Zod スキーマを追加**

`imageSchema` の後、`generateSchema` の前に追加:

```typescript
const freeInputSchema = z.object({
  sourceType: z.literal("freeInput"),
  input: z
    .string()
    .min(1, "キーワードまたは説明文を入力してください")
    .max(2000, "2000文字以内で入力してください"),
  categoryId: z.string().uuid("カテゴリを選択してください"),
});
```

- [ ] **Step 3: `generateSchema` に freeInput を追加**

```typescript
const generateSchema = z.discriminatedUnion("sourceType", [
  urlSchema,
  pdfSchema,
  imageSchema,
  freeInputSchema,
]);
```

- [ ] **Step 4: ラジオグループに「キーワード・説明文」選択肢を追加**

ソースタイプのラジオグループの配列を以下に変更:

```typescript
                        {(
                          [
                            ["url", "URL"],
                            ["pdf", "PDF"],
                            ["image", "画像"],
                            ["freeInput", "キーワード・説明文"],
                          ] as const
                        ).map(([value, label]) => (
```

- [ ] **Step 5: freeInput 用のテキストエリアを追加**

`{sourceType === "image" && (...)}` ブロックの後に追加:

```tsx
{
  sourceType === "freeInput" && (
    <FormField
      control={form.control}
      name="input"
      render={({ field }) => (
        <FormItem>
          <FormLabel>キーワード・説明文</FormLabel>
          <FormControl>
            <Textarea
              placeholder="例: GHS、または説明文を入力"
              rows={4}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

- [ ] **Step 6: `generateMutation` の `mutationFn` に freeInput 分岐を追加**

`mutationFn` を以下に変更:

```typescript
    mutationFn: async (data: GenerateForm) => {
      let json: GenerateCandidatesBody;

      if (data.sourceType === "url") {
        json = { type: "url", url: data.url };
      } else if (data.sourceType === "pdf") {
        const base64 = await fileToBase64(data.file);
        json = { type: "pdf", data: base64 };
      } else if (data.sourceType === "image") {
        const base64 = await fileToBase64(data.file);
        json = {
          type: "image",
          data: base64,
          mimeType: data.file.type as "image/jpeg" | "image/png",
        };
      } else {
        json = { type: "freeInput", input: data.input };
      }

      const res = await client.api["question-proposals"][
        "generate-candidates"
      ].$post({ json });
      if (!res.ok) throw new Error("Failed to generate candidates");
      return res.json();
    },
```

- [ ] **Step 7: `sourceType` 変更時のリセット処理を更新**

`onValueChange` のハンドラーを以下に変更:

```typescript
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.resetField("url" as never);
                          form.setValue("file" as never, undefined as never);
                          form.setValue("input" as never, "" as never);
                        }}
```

- [ ] **Step 8: `defaultValues` に `input` を追加**

```typescript
const form = useForm<GenerateForm>({
  resolver: zodResolver(generateSchema),
  defaultValues: {
    sourceType: "url",
    url: "",
    categoryId: "",
    input: "",
  } as GenerateForm,
});
```

- [ ] **Step 9: 型チェックを実行**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: PASS（エラーなし）

- [ ] **Step 10: コミット**

```bash
git add apps/web/src/features/admin/proposals/proposal-generate-page.tsx
git commit -m "feat: 問題生成フォームにキーワード・説明文ソースタブを追加"
```

---

### Task 6: 全体の型チェック・リント・テスト

**Files:** なし（検証のみ）

- [ ] **Step 1: 全体の型チェック**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 2: リント**

Run: `pnpm lint`
Expected: PASS

- [ ] **Step 3: テスト**

Run: `pnpm test`
Expected: ALL PASS（既存の QuestionProposal テストの既知の8件の失敗は除く）
