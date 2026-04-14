# 物質コラムモーダル機能 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** stats画面のRankCardに `!` ボタンを追加し、クリックで該当物質のコラム（豆知識・危険性）をモーダル表示する

**Architecture:** フロントエンド完結型。コラムデータを定数としてフロントに持ち、Radix UI Dialogでモーダル表示。APIの変更なし。

**Tech Stack:** React, shadcn/ui (Dialog), Tailwind CSS, TypeScript

---

## ファイル構成

| ファイル                                            | 操作     | 責務                                                 |
| --------------------------------------------------- | -------- | ---------------------------------------------------- |
| `apps/web/src/features/stats/rank-column-data.ts`   | 新規作成 | 21物質分のコラムデータ定数 + 取得関数                |
| `apps/web/src/features/stats/rank-column-modal.tsx` | 新規作成 | コラム表示モーダルコンポーネント（Dialog + Trigger） |
| `apps/web/src/features/stats/rank-card.tsx`         | 修正     | RankColumnModalを組み込む                            |

---

## 事前準備: ブランチ作成

- [ ] **Step 1: mainを最新化してブランチを切る**

```bash
git checkout main
git pull origin main
git checkout -b feat/rank-column-modal
```

---

### Task 1: コラムデータ定数の作成

**Files:**

- Create: `apps/web/src/features/stats/rank-column-data.ts`

- [ ] **Step 1: rank-column-data.ts を作成する**

`RankColumn` 型と `RANK_COLUMNS` 定数、`getColumnByRank` 関数を定義する。ランク0（見習い）はコラムなし。ランク1〜20の `body` にはプレースホルダーテキストを入れる（ユーザーが後から差し替え）。

```ts
export type RankColumn = {
  readonly rank: number;
  readonly title: string;
  readonly body: string;
};

export const RANK_COLUMNS: readonly RankColumn[] = [
  {
    rank: 1,
    title: "化学物質としての「水」――その見過ごされるリスク",
    body: "水（化学名：一酸化二水素／DHMO）は、私たちの生活に不可欠な物質である一方、化学物質管理の観点では無視できないリスクを持っています。\n\n液体状態では金属の腐食（錆）を促進し、設備劣化の主因となります。気体（水蒸気）は重度の熱傷を引き起こし、固体（氷）は転倒・凍傷の原因になります。また、多くの化学反応において暴走反応の引き金となることがあり、禁水性物質（ナトリウムや濃硫酸など）との接触は爆発的な発熱や飛散を伴います。\n\n過剰摂取は低ナトリウム血症（水中毒）を引き起こし、死亡例も報告されています。SDSの整備や適切な保管・取扱い教育は、水のような「身近な物質」にこそ重要です。",
  },
  {
    rank: 2,
    title: "食塩――最も身近な「劇薬」の素顔",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 3,
    title: "重曹――万能に見えて注意が必要な白い粉",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 4,
    title: "エタノール――消毒の裏に潜む引火リスク",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 5,
    title: "酢酸――食卓の調味料が見せる化学の顔",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 6,
    title: "過酸化水素――酸素を生む不安定な味方",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 7,
    title: "アンモニア――鼻を突く刺激臭の正体と危険",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 8,
    title: "塩酸――胃液にも含まれる強酸のリアル",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 9,
    title: "硫酸――「産業の血液」が持つ真の恐ろしさ",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 10,
    title: "水酸化ナトリウム――強塩基が溶かすもの",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 11,
    title: "硝酸――酸化力と爆発物の境界線",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 12,
    title: "ホルムアルデヒド――防腐剤の功罪",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 13,
    title: "クロロホルム――麻酔薬から規制物質へ",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 14,
    title: "フッ化水素――ガラスをも溶かす猛毒",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 15,
    title: "黄リン――空気に触れれば自然発火",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 16,
    title: "シアン化カリウム――青酸カリの真実",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 17,
    title: "ヒ素――歴史を動かした毒の王",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 18,
    title: "水銀――液体金属の美しさと毒性",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 19,
    title: "VXガス――人類が生み出した最悪の化学兵器",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
  {
    rank: 20,
    title: "プルトニウム――核の時代が生んだ究極の物質",
    body: "（ユーザー提供のコンテンツに差し替え予定）",
  },
];

export function getColumnByRank(rank: number): RankColumn | undefined {
  return RANK_COLUMNS.find((c) => c.rank === rank);
}
```

- [ ] **Step 2: 型チェックを実行して確認**

```bash
pnpm --filter web tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add apps/web/src/features/stats/rank-column-data.ts
git commit -m "feat: 物質コラムデータ定数を追加 (#122)"
```

---

### Task 2: コラムモーダルコンポーネントの作成

**Files:**

- Create: `apps/web/src/features/stats/rank-column-modal.tsx`

- [ ] **Step 1: rank-column-modal.tsx を作成する**

`RankColumnModal` コンポーネントを作成する。`Dialog` + `DialogTrigger` で構成し、トリガーは `!` アイコンボタン。`body` は `\n\n` で分割して段落表示する。

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogTrigger } from "@/components/ui/dialog";
import type { RankColumn } from "./rank-column-data";

type RankColumnModalProps = {
  column: RankColumn;
};

export function RankColumnModal({ column }: RankColumnModalProps) {
  const paragraphs = column.body.split("\n\n");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-[0_0_8px_rgba(var(--primary),0.5)] transition-all hover:scale-110 hover:shadow-[0_0_14px_rgba(var(--primary),0.8)]"
          aria-label="この物質のコラムを読む"
        >
          !
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-relaxed">
            {column.title}
          </DialogTitle>
        </DialogHeader>
        <div className="from-primary h-0.5 w-full bg-gradient-to-r to-transparent" />
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: 型チェックを実行して確認**

```bash
pnpm --filter web tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add apps/web/src/features/stats/rank-column-modal.tsx
git commit -m "feat: 物質コラムモーダルコンポーネントを追加 (#122)"
```

---

### Task 3: RankCardへの組み込み

**Files:**

- Modify: `apps/web/src/features/stats/rank-card.tsx`

- [ ] **Step 1: RankCardに RankColumnModal を組み込む**

`rank-card.tsx` を修正し、以下を行う:

1. `getColumnByRank` をインポート
2. `RankColumnModal` をインポート
3. 「あなたは○○を扱えます！！」テキストの直後に、`column` が存在する場合のみ `RankColumnModal` を表示

修正後の `rank-card.tsx` 全体:

```tsx
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { client } from "@/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getColumnByRank } from "./rank-column-data";
import { RankColumnModal } from "./rank-column-modal";

const CATEGORY_COLORS: Record<string, string> = {
  日常物質: "text-green-600 bg-green-100",
  一般薬品: "text-blue-600 bg-blue-100",
  劇物: "text-orange-600 bg-orange-100",
  毒物: "text-red-600 bg-red-100",
  特定毒物: "text-purple-600 bg-purple-100",
  最終ランク: "text-yellow-600 bg-yellow-100",
};

export function RankCard() {
  const { data: rankInfo, isLoading } = useQuery({
    queryKey: ["rank"],
    queryFn: async () => {
      const res = await client.api.rank.$get();
      if (!res.ok) throw new Error("Failed to fetch rank info");
      return res.json();
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!rankInfo) return null;

  const colorClass =
    CATEGORY_COLORS[rankInfo.category] ?? "text-gray-600 bg-gray-100";
  const remaining = rankInfo.nextRankExp
    ? rankInfo.nextRankExp - rankInfo.totalExp
    : null;
  const column = getColumnByRank(rankInfo.currentRank);

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">
              化学物質取扱者 Lv.{rankInfo.currentRank} — {rankInfo.substance}
            </p>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
            >
              {rankInfo.category}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {rankInfo.totalExp} EXP
          </p>
        </div>

        <p className="text-sm font-medium text-primary">
          {rankInfo.currentRank === 0
            ? "化学物質取扱者見習いです"
            : `あなたは${rankInfo.substance}を扱えます！！`}
          {column && (
            <span className="ml-1.5 inline-block align-middle">
              <RankColumnModal column={column} />
            </span>
          )}
        </p>

        {remaining !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>次のレベルまで</span>
              <span>あと {remaining} EXP</span>
            </div>
            <Progress value={rankInfo.progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

変更点:

- L6-7: `getColumnByRank` と `RankColumnModal` のインポート追加
- L41: `column` 変数の追加
- L58-62: `column` が存在する場合のみ `RankColumnModal` を表示（ランク0は `undefined` なので自動的に非表示）

- [ ] **Step 2: 型チェックを実行して確認**

```bash
pnpm --filter web tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add apps/web/src/features/stats/rank-card.tsx
git commit -m "feat: RankCardに物質コラムモーダルを組み込み (#122)"
```

---

### Task 4: 動作確認

- [ ] **Step 1: 開発サーバーを起動する**

```bash
docker compose up -d
pnpm dev
```

- [ ] **Step 2: ブラウザで動作確認する**

ブラウザで `/stats` 画面を開き、以下を確認する:

1. **ランク1以上の場合**: 「あなたは○○を扱えます！！」テキストの横に `!` ボタンが表示される
2. **ボタンのスタイル**: 目立つデザイン（グロー付き）、ホバーで拡大エフェクトがかかる
3. **ボタンクリック**: モーダルが開き、タイトル・区切り線・本文が表示される
4. **モーダルの閉じる**: ✕ボタンまたはオーバーレイクリックで閉じる
5. **ランク0の場合**: ボタンが表示されない（テスト困難な場合はコードの条件分岐を確認）

- [ ] **Step 3: ボタンのスタイル調整（必要に応じて）**

実際の画面を見て、ボタンのグロー効果やサイズが既存のデザインシステムと馴染んでいるか確認する。Tailwindのテーマカラーで `shadow` のグロー表現がうまく出ない場合は、`rank-column-modal.tsx` のボタンスタイルを調整する。

- [ ] **Step 4: 開発サーバーを停止する**

```bash
docker compose down
```

※ `pnpm dev` のプロセスも停止する

- [ ] **Step 5: リント・フォーマット・型チェック**

```bash
pnpm lint
pnpm format
pnpm type-check
```

Expected: すべてパス

- [ ] **Step 6: 最終コミット（スタイル調整があった場合）**

```bash
git add -A
git commit -m "fix: コラムモーダルボタンのスタイル調整 (#122)"
```
