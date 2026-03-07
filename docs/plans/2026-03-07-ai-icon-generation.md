# AIアイコン自動生成機能 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Gemini 2.5 Flash を使って、ユーザーの好みに基づいたフラットデザインのアイコン画像を3枚生成・提案し、選択したものをアイコンとして設定できるようにする。

**Architecture:** 既存の Hono Lambda + S3 + Gemini API 構成を活用。DDD レイヤー（Domain → Application → Infrastructure → Presentation）に従い、`IconGenerator` インターフェースで Gemini API を抽象化。フロントは shadcn Dialog によるステップウィザード型モーダル。

**Tech Stack:** Hono (OpenAPIHono), @google/genai, Sharp, AWS S3, React, shadcn/ui, TanStack Query, Vitest

---

### Task 1: ドメイン層 — `IconGenerator` インターフェース

**Files:**

- Create: `apps/api/src/domain/user/icon-generator.ts`

**Step 1: インターフェースを作成**

```typescript
// apps/api/src/domain/user/icon-generator.ts
export interface IconGeneratorInput {
  color: string;
  element: string;
  style: "cute" | "cool" | "simple" | "science";
}

export interface IconGenerator {
  generate(input: IconGeneratorInput): Promise<Buffer>;
}
```

**Step 2: コミット**

```bash
git add apps/api/src/domain/user/icon-generator.ts
git commit -m "feat: IconGenerator ドメインインターフェースを追加"
```

---

### Task 2: インフラ層 — `S3IconStorage` に候補画像の保存・コピー・削除メソッドを追加

**Files:**

- Modify: `apps/api/src/domain/user/icon-storage.ts`
- Modify: `apps/api/src/infrastructure/storage/s3-icon-storage.ts`

**Step 1: `IconStorage` インターフェースにメソッドを追加**

`apps/api/src/domain/user/icon-storage.ts` に以下のメソッドを追加:

```typescript
export interface IconStorage {
  put(userId: string, data: Buffer): Promise<string>;
  delete(userId: string): Promise<void>;
  putCandidate(
    userId: string,
    index: number,
    data: Buffer,
  ): Promise<{ url: string; key: string }>;
  copyToMain(userId: string, candidateKey: string): Promise<string>;
  deleteCandidates(keys: string[]): Promise<void>;
}
```

**Step 2: `S3IconStorage` に実装を追加**

`apps/api/src/infrastructure/storage/s3-icon-storage.ts` に以下を追加:

- `putCandidate(userId, index, data)`: `icons/{userId}/candidates/{index}.webp` に保存し、`{ url, key }` を返す
- `copyToMain(userId, candidateKey)`: 候補キーから `icons/{userId}.webp` にコピーし、URL を返す。`CopyObjectCommand` を使用。
- `deleteCandidates(keys)`: 指定されたキーの配列を `DeleteObjectCommand` で一括削除

`@aws-sdk/client-s3` の import に `CopyObjectCommand`, `GetObjectCommand` を追加する。

`copyToMain` の実装:

```typescript
async copyToMain(userId: string, candidateKey: string): Promise<string> {
  const bucket = this.getBucketName();
  const destKey = this.key(userId);
  await this.getClient().send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${candidateKey}`,
      Key: destKey,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  const endpoint = this.getEndpoint?.();
  const baseUrl = endpoint
    ? `${endpoint.replace(/\/$/, "")}/${bucket}`
    : `https://${bucket}.s3.ap-northeast-1.amazonaws.com`;
  return `${baseUrl}/${destKey}?v=${Date.now()}`;
}
```

**Step 3: コミット**

```bash
git add apps/api/src/domain/user/icon-storage.ts apps/api/src/infrastructure/storage/s3-icon-storage.ts
git commit -m "feat: IconStorage に候補画像の保存・コピー・削除メソッドを追加"
```

---

### Task 3: インフラ層 — `GeminiIconGenerator` 実装

**Files:**

- Create: `apps/api/src/infrastructure/generation/gemini-icon-generator.ts`

**Step 1: テストを作成**

`apps/api/src/infrastructure/generation/__tests__/gemini-icon-generator.test.ts` を作成:

```typescript
import { describe, it, expect, vi } from "vitest";
import { GeminiIconGenerator } from "../gemini-icon-generator.ts";

// GoogleGenAI をモックして、画像生成のプロンプト構築とレスポンス処理をテスト
describe("GeminiIconGenerator", () => {
  it("generate が Buffer を返す", async () => {
    const fakeImageData = Buffer.from("fake-png-data");
    const base64Data = fakeImageData.toString("base64");

    const mockGenerateContent = vi.fn().mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data,
                },
              },
            ],
          },
        },
      ],
    });

    const mockAi = {
      models: { generateContent: mockGenerateContent },
    };

    const generator = new GeminiIconGenerator(() => "fake-api-key");
    // @ts-expect-error テスト用にモック注入
    generator["ai"] = mockAi;

    const result = await generator.generate({
      color: "blue",
      element: "H2O",
      style: "cute",
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe("fake-png-data");
    expect(mockGenerateContent).toHaveBeenCalledOnce();

    // プロンプトに入力値が含まれていることを確認
    const callArgs = mockGenerateContent.mock.calls[0][0];
    const promptText = JSON.stringify(callArgs);
    expect(promptText).toContain("blue");
    expect(promptText).toContain("H2O");
  });

  it("画像データがない場合はエラーをスロー", async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ text: "Sorry, I cannot generate images." }],
          },
        },
      ],
    });

    const mockAi = {
      models: { generateContent: mockGenerateContent },
    };

    const generator = new GeminiIconGenerator(() => "fake-api-key");
    // @ts-expect-error テスト用にモック注入
    generator["ai"] = mockAi;

    await expect(
      generator.generate({ color: "red", element: "Fe", style: "cool" }),
    ).rejects.toThrow();
  });
});
```

**Step 2: テストが失敗することを確認**

```bash
cd apps/api && pnpm test src/infrastructure/generation/__tests__/gemini-icon-generator.test.ts
```

Expected: FAIL（`gemini-icon-generator.ts` が存在しない）

**Step 3: `GeminiIconGenerator` を実装**

```typescript
// apps/api/src/infrastructure/generation/gemini-icon-generator.ts
import { GoogleGenAI } from "@google/genai";
import type {
  IconGenerator,
  IconGeneratorInput,
} from "../../domain/user/icon-generator.ts";

const MODEL = "gemini-2.5-flash";

const STYLE_LABELS: Record<IconGeneratorInput["style"], string> = {
  cute: "かわいい、丸みのある、パステル調",
  cool: "クール、シャープ、メタリック",
  simple: "ミニマル、幾何学的、モノトーン",
  science: "サイエンス風、分子構造モチーフ、実験器具",
};

export class GeminiIconGenerator implements IconGenerator {
  private ai: GoogleGenAI | null = null;

  constructor(private getApiKey: () => string) {}

  private getClient(): GoogleGenAI {
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey: this.getApiKey() });
    }
    return this.ai;
  }

  async generate(input: IconGeneratorInput): Promise<Buffer> {
    const prompt = this.buildPrompt(input);

    const response = await this.getClient().models.generateContent({
      model: MODEL,
      contents: [prompt],
      config: {
        responseModalities: ["image"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error("Gemini API からのレスポンスが空です");
    }

    const imagePart = parts.find((p: any) => p.inlineData?.data);
    if (!imagePart || !imagePart.inlineData) {
      throw new Error("Gemini API から画像データを取得できませんでした");
    }

    return Buffer.from(imagePart.inlineData.data, "base64");
  }

  private buildPrompt(input: IconGeneratorInput): string {
    const styleLabel = STYLE_LABELS[input.style];
    return `Generate a flat-design icon image (256x256 pixels) for a user avatar.

Requirements:
- Primary color: ${input.color}
- Theme: inspired by the chemical element or molecule "${input.element}"
- Style: ${styleLabel}
- Flat design, suitable as a profile icon
- No text or letters in the image
- Clean, simple composition with a solid or gradient background
- The design should be visually appealing and recognizable at small sizes`;
  }
}
```

**Step 4: テストが通ることを確認**

```bash
cd apps/api && pnpm test src/infrastructure/generation/__tests__/gemini-icon-generator.test.ts
```

Expected: PASS

**Step 5: コミット**

```bash
git add apps/api/src/infrastructure/generation/gemini-icon-generator.ts apps/api/src/infrastructure/generation/__tests__/gemini-icon-generator.test.ts
git commit -m "feat: GeminiIconGenerator 実装（Gemini 2.5 Flash 画像生成）"
```

---

### Task 4: アプリケーション層 — `GenerateIcon` ユースケース

**Files:**

- Create: `apps/api/src/application/user/generate-icon.ts`
- Create: `apps/api/src/application/user/__tests__/generate-icon.test.ts`

**Step 1: テストを作成**

```typescript
// apps/api/src/application/user/__tests__/generate-icon.test.ts
import { describe, it, expect, vi } from "vitest";
import { GenerateIcon } from "../generate-icon.ts";
import type { IconGenerator } from "../../../domain/user/icon-generator.ts";
import type { IconStorage } from "../../../domain/user/icon-storage.ts";
import type { IconProcessor } from "../../../domain/user/icon-processor.ts";

describe("GenerateIcon", () => {
  it("3枚の候補画像を生成して S3 に保存し、URLとキーを返す", async () => {
    const fakeBuffer = Buffer.from("image-data");
    const processedBuffer = Buffer.from("processed-data");

    const mockGenerator: IconGenerator = {
      generate: vi.fn().mockResolvedValue(fakeBuffer),
    };

    const mockProcessor: IconProcessor = {
      process: vi.fn().mockResolvedValue(processedBuffer),
    };

    const mockStorage: IconStorage = {
      put: vi.fn(),
      delete: vi.fn(),
      putCandidate: vi
        .fn()
        .mockImplementation(
          async (_userId: string, index: number, _data: Buffer) => ({
            url: `https://bucket/icons/user1/candidates/${index}.webp`,
            key: `icons/user1/candidates/${index}.webp`,
          }),
        ),
      copyToMain: vi.fn(),
      deleteCandidates: vi.fn(),
    };

    const useCase = new GenerateIcon(mockGenerator, mockProcessor, mockStorage);
    const result = await useCase.execute("user1", {
      color: "blue",
      element: "H2O",
      style: "cute",
    });

    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates.length).toBeLessThanOrEqual(3);
    expect(mockGenerator.generate).toHaveBeenCalledTimes(3);
    expect(mockProcessor.process).toHaveBeenCalled();
    expect(mockStorage.putCandidate).toHaveBeenCalled();

    for (const candidate of result.candidates) {
      expect(candidate).toHaveProperty("url");
      expect(candidate).toHaveProperty("key");
    }
  });

  it("全ての生成が失敗した場合はエラーをスロー", async () => {
    const mockGenerator: IconGenerator = {
      generate: vi.fn().mockRejectedValue(new Error("API error")),
    };

    const mockProcessor: IconProcessor = {
      process: vi.fn(),
    };

    const mockStorage: IconStorage = {
      put: vi.fn(),
      delete: vi.fn(),
      putCandidate: vi.fn(),
      copyToMain: vi.fn(),
      deleteCandidates: vi.fn(),
    };

    const useCase = new GenerateIcon(mockGenerator, mockProcessor, mockStorage);
    await expect(
      useCase.execute("user1", { color: "red", element: "Fe", style: "cool" }),
    ).rejects.toThrow("画像生成に失敗しました");
  });
});
```

**Step 2: テストが失敗することを確認**

```bash
cd apps/api && pnpm test src/application/user/__tests__/generate-icon.test.ts
```

**Step 3: `GenerateIcon` ユースケースを実装**

```typescript
// apps/api/src/application/user/generate-icon.ts
import type {
  IconGenerator,
  IconGeneratorInput,
} from "../../domain/user/icon-generator.ts";
import type { IconProcessor } from "../../domain/user/icon-processor.ts";
import type { IconStorage } from "../../domain/user/icon-storage.ts";

interface Candidate {
  url: string;
  key: string;
}

interface GenerateIconResult {
  candidates: Candidate[];
}

export class GenerateIcon {
  constructor(
    private iconGenerator: IconGenerator,
    private iconProcessor: IconProcessor,
    private iconStorage: IconStorage,
  ) {}

  async execute(
    userId: string,
    input: IconGeneratorInput,
  ): Promise<GenerateIconResult> {
    const results = await Promise.allSettled(
      [0, 1, 2].map(() => this.iconGenerator.generate(input)),
    );

    const candidates: Candidate[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled") {
        const processed = await this.iconProcessor.process(result.value);
        const candidate = await this.iconStorage.putCandidate(
          userId,
          i,
          processed,
        );
        candidates.push(candidate);
      }
    }

    if (candidates.length === 0) {
      throw new Error("画像生成に失敗しました");
    }

    return { candidates };
  }
}
```

**Step 4: テストが通ることを確認**

```bash
cd apps/api && pnpm test src/application/user/__tests__/generate-icon.test.ts
```

**Step 5: コミット**

```bash
git add apps/api/src/application/user/generate-icon.ts apps/api/src/application/user/__tests__/generate-icon.test.ts
git commit -m "feat: GenerateIcon ユースケース実装（3枚並列生成）"
```

---

### Task 5: アプリケーション層 — `SelectIcon` ユースケース

**Files:**

- Create: `apps/api/src/application/user/select-icon.ts`
- Create: `apps/api/src/application/user/__tests__/select-icon.test.ts`

**Step 1: テストを作成**

```typescript
// apps/api/src/application/user/__tests__/select-icon.test.ts
import { describe, it, expect, vi } from "vitest";
import { SelectIcon } from "../select-icon.ts";
import type { IconStorage } from "../../../domain/user/icon-storage.ts";
import type { UserRepository } from "../../../domain/user/repository/user-repository.ts";
import type { UnitOfWork } from "../../../domain/shared/unit-of-work.ts";

describe("SelectIcon", () => {
  it("選択画像をメインにコピーし、rejected を削除し、user.image を更新する", async () => {
    const mockStorage: IconStorage = {
      put: vi.fn(),
      delete: vi.fn(),
      putCandidate: vi.fn(),
      copyToMain: vi
        .fn()
        .mockResolvedValue("https://bucket/icons/user1.webp?v=123"),
      deleteCandidates: vi.fn(),
    };

    const mockUserRepository: UserRepository = {
      updateImage: vi.fn(),
    };

    const mockUnitOfWork: UnitOfWork = {
      run: vi.fn().mockImplementation((fn) => fn()),
    };

    const useCase = new SelectIcon(
      mockStorage,
      mockUserRepository,
      mockUnitOfWork,
    );
    const result = await useCase.execute("user1", {
      selectedKey: "icons/user1/candidates/0.webp",
      rejectedKeys: [
        "icons/user1/candidates/1.webp",
        "icons/user1/candidates/2.webp",
      ],
    });

    expect(result.imageUrl).toBe("https://bucket/icons/user1.webp?v=123");
    expect(mockStorage.copyToMain).toHaveBeenCalledWith(
      "user1",
      "icons/user1/candidates/0.webp",
    );
    expect(mockStorage.deleteCandidates).toHaveBeenCalledWith([
      "icons/user1/candidates/1.webp",
      "icons/user1/candidates/2.webp",
    ]);
    expect(mockUserRepository.updateImage).toHaveBeenCalledWith(
      "user1",
      "https://bucket/icons/user1.webp?v=123",
    );
  });
});
```

**Step 2: テストが失敗することを確認**

```bash
cd apps/api && pnpm test src/application/user/__tests__/select-icon.test.ts
```

**Step 3: `SelectIcon` ユースケースを実装**

```typescript
// apps/api/src/application/user/select-icon.ts
import type { IconStorage } from "../../domain/user/icon-storage.ts";
import type { UserRepository } from "../../domain/user/repository/user-repository.ts";
import type { UnitOfWork } from "../../domain/shared/unit-of-work.ts";

interface SelectIconInput {
  selectedKey: string;
  rejectedKeys: string[];
}

interface SelectIconResult {
  imageUrl: string;
}

export class SelectIcon {
  constructor(
    private iconStorage: IconStorage,
    private userRepository: UserRepository,
    private unitOfWork: UnitOfWork,
  ) {}

  async execute(
    userId: string,
    input: SelectIconInput,
  ): Promise<SelectIconResult> {
    const imageUrl = await this.iconStorage.copyToMain(
      userId,
      input.selectedKey,
    );

    await this.unitOfWork.run(async () => {
      await this.userRepository.updateImage(userId, imageUrl);
    });

    if (input.rejectedKeys.length > 0) {
      await this.iconStorage.deleteCandidates(input.rejectedKeys);
    }

    return { imageUrl };
  }
}
```

**Step 4: テストが通ることを確認**

```bash
cd apps/api && pnpm test src/application/user/__tests__/select-icon.test.ts
```

**Step 5: コミット**

```bash
git add apps/api/src/application/user/select-icon.ts apps/api/src/application/user/__tests__/select-icon.test.ts
git commit -m "feat: SelectIcon ユースケース実装（候補選択・コピー・削除）"
```

---

### Task 6: プレゼンテーション層 — API エンドポイント追加

**Files:**

- Modify: `apps/api/src/presentation/routes/user/user.route.ts`

**Step 1: 2つのルート定義とハンドラを追加**

`user.route.ts` に以下を追加:

`generateIconRoute` — `POST /icon/generate`:

- リクエスト body: `{ color: z.string().min(1), element: z.string().min(1), style: z.enum(["cute", "cool", "simple", "science"]) }`
- レスポンス 200: `{ candidates: z.array(z.object({ url: z.string(), key: z.string() })) }`
- レスポンス 429: `{ error: z.string() }` — Gemini API のレート制限エラー
- `middleware: [requireAuth]`
- ハンドラ: `deps.generateIcon.execute(userId, body)` を呼び出し
- エラーハンドリング: `429` や `Resource exhausted` を含むエラーは 429 で返す。それ以外は 500。

`selectIconRoute` — `POST /icon/select`:

- リクエスト body: `{ selectedKey: z.string().min(1), rejectedKeys: z.array(z.string()) }`
- レスポンス 200: `{ imageUrl: z.string() }`
- `middleware: [requireAuth]`
- ハンドラ: `deps.selectIcon.execute(userId, body)` を呼び出し

**Step 2: コミット**

```bash
git add apps/api/src/presentation/routes/user/user.route.ts
git commit -m "feat: POST /icon/generate, POST /icon/select エンドポイント追加"
```

---

### Task 7: DI 登録 & SST 権限追加

**Files:**

- Modify: `apps/api/src/composition-root.ts`
- Modify: `sst.config.ts`

**Step 1: `composition-root.ts` に DI 登録を追加**

```typescript
// import 追加
import { GeminiIconGenerator } from "./infrastructure/generation/gemini-icon-generator.ts";
import { GenerateIcon } from "./application/user/generate-icon.ts";
import { SelectIcon } from "./application/user/select-icon.ts";
import { DrizzleUserRepository } from "./infrastructure/user/drizzle-user-repository.ts";

// インスタンス生成（既存の iconStorage, iconProcessor の後に追加）
const iconGenerator = new GeminiIconGenerator(() =>
  requireEnv("GEMINI_API_KEY"),
);
const userRepository = new DrizzleUserRepository();

const generateIcon = new GenerateIcon(
  iconGenerator,
  iconProcessor,
  iconStorage,
);
const selectIcon = new SelectIcon(iconStorage, userRepository, unitOfWork);

// dependencies に追加
export const dependencies = {
  // ... 既存のもの
  generateIcon,
  selectIcon,
};
```

**Step 2: `sst.config.ts` の permissions に `s3:GetObject`, `s3:CopyObject` を追加**

```typescript
permissions: [
  {
    actions: ["ses:SendEmail", "ses:SendRawEmail"],
    resources: ["*"],
  },
  {
    actions: ["s3:PutObject", "s3:DeleteObject", "s3:GetObject", "s3:CopyObject"],
    resources: [$interpolate`${iconBucket.arn}/*`],
  },
],
```

**Step 3: コミット**

```bash
git add apps/api/src/composition-root.ts sst.config.ts
git commit -m "feat: GenerateIcon/SelectIcon の DI 登録と S3 権限追加"
```

---

### Task 8: ビルド確認

**Step 1: API の型チェックとビルドを確認**

```bash
cd apps/api && pnpm run type-check
```

Expected: エラーなし

**Step 2: 全テスト実行**

```bash
cd apps/api && pnpm test
```

Expected: 全テスト PASS

**Step 3: コミット（修正があれば）**

---

### Task 9: フロントエンド — `GenerateIconDialog` モーダル

**Files:**

- Create: `apps/web/src/features/account/generate-icon-dialog.tsx`

**前提:** shadcn MCP サーバーを利用して `Dialog` コンポーネントの正確な API を確認すること。

**Step 1: ステップウィザード型モーダルを実装**

主要な状態管理:

- `step`: 1（色選択）→ 2（元素入力）→ 3（雰囲気選択）→ 4（生成中）→ 5（候補選択）
- `color`: 選択された色
- `element`: 入力された元素/分子
- `style`: 選択された雰囲気
- `candidates`: 生成された候補画像の配列
- `selectedKey`: 選択された候補のキー
- `isGenerating`: 生成中フラグ
- `isSelecting`: 選択処理中フラグ
- `error`: エラーメッセージ

カラーパレット（8色）:

```typescript
const COLORS = [
  { name: "レッド", value: "red", class: "bg-red-500" },
  { name: "ブルー", value: "blue", class: "bg-blue-500" },
  { name: "グリーン", value: "green", class: "bg-green-500" },
  { name: "イエロー", value: "yellow", class: "bg-yellow-500" },
  { name: "パープル", value: "purple", class: "bg-purple-500" },
  { name: "ピンク", value: "pink", class: "bg-pink-500" },
  { name: "オレンジ", value: "orange", class: "bg-orange-500" },
  { name: "ティール", value: "teal", class: "bg-teal-500" },
];
```

雰囲気選択:

```typescript
const STYLES = [
  { label: "かわいい", value: "cute" },
  { label: "クール", value: "cool" },
  { label: "シンプル", value: "simple" },
  { label: "サイエンス風", value: "science" },
];
```

API 呼び出し:

- 生成: `client.api.user.icon.generate.$post({ json: { color, element, style } })`
- 選択: `client.api.user.icon.select.$post({ json: { selectedKey, rejectedKeys } })`

Props:

```typescript
interface GenerateIconDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIconSet: (imageUrl: string) => void;
}
```

UI 構成:

- Step 1: 8色のカラーボタンをグリッド表示（4列×2行）、選択時にリング表示
- Step 2: テキスト入力 + 「次へ」ボタン
- Step 3: 4つのスタイルボタンをグリッド表示 + 「生成する」ボタン
- Step 4: `Loader2` アニメーション + 「生成中...」テキスト
- Step 5: 3枚の候補画像をグリッド表示（選択時にリング）+ 「設定する」ボタン

エラーハンドリング:

- 429 エラー: 「現在生成が混み合っています。しばらく待ってからお試しください」
- その他: 「画像生成に失敗しました」
- エラー時は Step 3 に戻して再試行可能にする

**Step 2: コミット**

```bash
git add apps/web/src/features/account/generate-icon-dialog.tsx
git commit -m "feat: GenerateIconDialog ステップウィザード型モーダル実装"
```

---

### Task 10: フロントエンド — アカウント画面に「AIで生成」ボタン追加

**Files:**

- Modify: `apps/web/src/features/account/account-page.tsx`

**Step 1: `IconSection` に「AIで生成」ボタンとダイアログを追加**

変更内容:

- `GenerateIconDialog` を import
- `IconSection` に `isDialogOpen` state を追加
- アイコン削除ボタンの横（または下）に「AIで生成」ボタンを追加（`Sparkles` アイコン付き、lucide-react から import）
- `GenerateIconDialog` コンポーネントを配置
- `onIconSet` コールバックで `setImage(imageUrl)` + `authClient.updateUser({ image: imageUrl })` + 成功メッセージ表示

**Step 2: コミット**

```bash
git add apps/web/src/features/account/account-page.tsx
git commit -m "feat: アカウント画面に AI アイコン生成ボタンを追加"
```

---

### Task 11: フロントエンドビルド確認 & 全体テスト

**Step 1: フロントエンドの型チェック**

```bash
cd apps/web && pnpm run build
```

Expected: エラーなし

**Step 2: API の全テスト実行**

```bash
cd apps/api && pnpm test
```

Expected: 全テスト PASS

**Step 3: lint 実行**

```bash
pnpm lint
```

Expected: エラーなし

**Step 4: 修正があればコミット**

---

### Task 12: 手動動作確認

**Step 1: ローカルサーバー起動**

```bash
docker compose up -d
pnpm dev
```

**Step 2: 確認事項**

1. アカウント画面に「AIで生成」ボタンが表示される
2. ボタンをクリックするとモーダルが開く
3. Step 1: カラーパレットから色を選択できる
4. Step 2: 元素/分子を入力できる
5. Step 3: 雰囲気を選択して「生成する」を押せる
6. 生成中のローディングが表示される
7. 候補画像が表示され、1枚選択して「設定する」でアイコンが反映される

**Step 3: サーバーを停止**

```bash
docker compose down
```

**注意:** Gemini API の無料枠で画像生成が動作するか確認。429 エラーが出た場合はエラーハンドリングが正しく動作するか確認。
