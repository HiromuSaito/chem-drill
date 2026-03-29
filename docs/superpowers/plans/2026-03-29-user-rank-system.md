# ユーザーランク・スコア管理システム 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ドリル完了・出題案提出・出題案承認に応じて経験値を付与し、20段階のランク（化学物質対応）を管理するゲーミフィケーション機能を追加する。

**Architecture:** 新規ドメイン `user-experience` を追加し、既存のユースケース（SaveDrillSession, SubmitQuestionProposal\*, ApproveQuestionProposal）に経験値付与を組み込む。フロントはStatsページにランク情報カードを追加し、ドリル完了時にランクアップ演出モーダルを表示する。

**Tech Stack:** Drizzle ORM (PostgreSQL), Hono (OpenAPIHono), React + TanStack Query + shadcn/ui, CSS Animations

**Spec:** `docs/superpowers/specs/2026-03-29-user-rank-system-design.md`

**ブランチ:** 実装開始時に `main` から `feat/user-rank-system` を切る。

---

## ファイル構成

### 新規作成ファイル

**ドメイン層:**

- `apps/api/src/domain/user-experience/entity/user-experience.ts` — UserExperienceエンティティ（経験値加算、ランク判定ロジック）
- `apps/api/src/domain/user-experience/rank-definitions.ts` — ランク定義テーブル（20段階の定数配列）
- `apps/api/src/domain/user-experience/repository/user-experience-repository.ts` — リポジトリインターフェース
- `apps/api/src/domain/user-experience/query-service/user-experience-query-service.ts` — クエリサービスインターフェース
- `apps/api/src/domain/user-experience/__tests__/user-experience.test.ts` — ドメインエンティティのテスト
- `apps/api/src/domain/user-experience/__tests__/rank-definitions.test.ts` — ランク定義のテスト

**アプリケーション層:**

- `apps/api/src/application/user-experience/add-experience.ts` — 経験値加算ユースケース
- `apps/api/src/application/user-experience/get-user-rank-info.ts` — ランク情報取得ユースケース
- `apps/api/src/application/user-experience/get-pending-rank-ups.ts` — 未表示ランクアップ取得ユースケース
- `apps/api/src/application/user-experience/mark-rank-up-displayed.ts` — ランクアップ表示済みマークユースケース

**インフラ層:**

- `apps/api/src/infrastructure/user-experience/drizzle-user-experience-repository.ts` — リポジトリ実装
- `apps/api/src/infrastructure/user-experience/drizzle-user-experience-query-service.ts` — クエリサービス実装

**プレゼンテーション層:**

- `apps/api/src/presentation/routes/rank/rank.route.ts` — ランクAPIルート

**フロントエンド:**

- `apps/web/src/features/stats/rank-card.tsx` — ランク情報カードコンポーネント
- `apps/web/src/features/question/rank-up-modal.tsx` — ランクアップ演出モーダル
- `apps/web/src/features/question/rank-up-modal.css` — ランクアップアニメーション

### 修正ファイル

- `apps/api/src/infrastructure/db/schema.ts` — 3テーブル追加（user_experience, experience_logs, rank_up_events）
- `apps/api/src/composition-root.ts` — 新規リポジトリ・ユースケースの登録
- `apps/api/src/presentation/routes/index.ts` — ランクルートのマウント
- `apps/api/src/application/drill-session/save-drill-session.ts` — 経験値付与の組み込み
- `apps/api/src/application/question-proposal/submit-question-proposal-by-user.ts` — 経験値付与の組み込み
- `apps/api/src/application/question-proposal/submit-question-proposal-by-admin.ts` — 経験値付与の組み込み
- `apps/api/src/application/question-proposal/approve-question-proposal.ts` — 経験値付与の組み込み
- `apps/web/src/features/stats/stats-page.tsx` — ランクカード統合
- `apps/web/src/features/question/session-container.tsx` — ランクアップモーダル統合
- `apps/web/src/features/question/result-screen.tsx` — ランクアップモーダル統合

---

## Task 0: ブランチ作成

- [ ] **Step 1: mainからフィーチャーブランチを切る**

```bash
git checkout main
git pull origin main
git checkout -b feat/user-rank-system
```

---

## Task 1: ランク定義テーブル

**Files:**

- Create: `apps/api/src/domain/user-experience/rank-definitions.ts`
- Test: `apps/api/src/domain/user-experience/__tests__/rank-definitions.test.ts`

- [ ] **Step 1: テストを書く**

```typescript
// apps/api/src/domain/user-experience/__tests__/rank-definitions.test.ts
import { describe, expect, it } from "vitest";
import {
  RANK_DEFINITIONS,
  getRankForExp,
  getRankInfo,
  type RankDefinition,
} from "../rank-definitions.ts";

describe("RANK_DEFINITIONS", () => {
  it("20段階のランクが定義されている", () => {
    expect(RANK_DEFINITIONS).toHaveLength(20);
  });

  it("ランク1の必要経験値は0", () => {
    expect(RANK_DEFINITIONS[0].rank).toBe(1);
    expect(RANK_DEFINITIONS[0].requiredExp).toBe(0);
  });

  it("必要経験値が昇順に並んでいる", () => {
    for (let i = 1; i < RANK_DEFINITIONS.length; i++) {
      expect(RANK_DEFINITIONS[i].requiredExp).toBeGreaterThan(
        RANK_DEFINITIONS[i - 1].requiredExp,
      );
    }
  });

  it("ランク番号が1から20まで連番", () => {
    RANK_DEFINITIONS.forEach((def, i) => {
      expect(def.rank).toBe(i + 1);
    });
  });
});

describe("getRankForExp", () => {
  it("経験値0はランク1", () => {
    expect(getRankForExp(0)).toBe(1);
  });

  it("経験値49はランク1", () => {
    expect(getRankForExp(49)).toBe(1);
  });

  it("経験値50はランク2", () => {
    expect(getRankForExp(50)).toBe(2);
  });

  it("経験値6000はランク20", () => {
    expect(getRankForExp(6000)).toBe(20);
  });

  it("経験値10000はランク20（最大ランクを超えない）", () => {
    expect(getRankForExp(10000)).toBe(20);
  });
});

describe("getRankInfo", () => {
  it("ランク1の情報を返す", () => {
    const info = getRankInfo(1);
    expect(info.substance).toBe("水 (H₂O)");
    expect(info.category).toBe("日常物質");
  });

  it("ランク20の情報を返す", () => {
    const info = getRankInfo(20);
    expect(info.substance).toBe("プルトニウム (Pu)");
    expect(info.category).toBe("最終ランク");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
pnpm --filter api test -- --run apps/api/src/domain/user-experience/__tests__/rank-definitions.test.ts
```

Expected: FAIL — モジュールが存在しない

- [ ] **Step 3: ランク定義を実装**

```typescript
// apps/api/src/domain/user-experience/rank-definitions.ts
export type SubstanceCategory =
  | "日常物質"
  | "一般薬品"
  | "劇物"
  | "毒物"
  | "特定毒物"
  | "最終ランク";

export type RankDefinition = {
  readonly rank: number;
  readonly requiredExp: number;
  readonly substance: string;
  readonly category: SubstanceCategory;
};

export const RANK_DEFINITIONS: readonly RankDefinition[] = Object.freeze([
  { rank: 1, requiredExp: 0, substance: "水 (H₂O)", category: "日常物質" },
  { rank: 2, requiredExp: 50, substance: "食塩 (NaCl)", category: "日常物質" },
  {
    rank: 3,
    requiredExp: 120,
    substance: "重曹 (NaHCO₃)",
    category: "日常物質",
  },
  {
    rank: 4,
    requiredExp: 200,
    substance: "エタノール (C₂H₅OH)",
    category: "日常物質",
  },
  {
    rank: 5,
    requiredExp: 300,
    substance: "酢酸 (CH₃COOH)",
    category: "日常物質",
  },
  {
    rank: 6,
    requiredExp: 420,
    substance: "過酸化水素 (H₂O₂)",
    category: "一般薬品",
  },
  {
    rank: 7,
    requiredExp: 560,
    substance: "アンモニア (NH₃)",
    category: "一般薬品",
  },
  { rank: 8, requiredExp: 720, substance: "塩酸 (HCl)", category: "一般薬品" },
  {
    rank: 9,
    requiredExp: 900,
    substance: "硫酸 (H₂SO₄)",
    category: "一般薬品",
  },
  {
    rank: 10,
    requiredExp: 1100,
    substance: "水酸化ナトリウム (NaOH)",
    category: "一般薬品",
  },
  { rank: 11, requiredExp: 1350, substance: "硝酸 (HNO₃)", category: "劇物" },
  {
    rank: 12,
    requiredExp: 1650,
    substance: "ホルムアルデヒド (HCHO)",
    category: "劇物",
  },
  {
    rank: 13,
    requiredExp: 2000,
    substance: "クロロホルム (CHCl₃)",
    category: "劇物",
  },
  {
    rank: 14,
    requiredExp: 2400,
    substance: "フッ化水素 (HF)",
    category: "毒物",
  },
  { rank: 15, requiredExp: 2850, substance: "黄リン (P₄)", category: "毒物" },
  {
    rank: 16,
    requiredExp: 3350,
    substance: "シアン化カリウム (KCN)",
    category: "毒物",
  },
  { rank: 17, requiredExp: 3900, substance: "ヒ素 (As)", category: "毒物" },
  { rank: 18, requiredExp: 4500, substance: "水銀 (Hg)", category: "特定毒物" },
  { rank: 19, requiredExp: 5200, substance: "VXガス", category: "特定毒物" },
  {
    rank: 20,
    requiredExp: 6000,
    substance: "プルトニウム (Pu)",
    category: "最終ランク",
  },
]);

/** 累計経験値からランクを算出する */
export function getRankForExp(totalExp: number): number {
  let rank = 1;
  for (const def of RANK_DEFINITIONS) {
    if (totalExp >= def.requiredExp) {
      rank = def.rank;
    } else {
      break;
    }
  }
  return rank;
}

/** ランク番号からランク情報を取得する */
export function getRankInfo(rank: number): RankDefinition {
  const def = RANK_DEFINITIONS[rank - 1];
  if (!def) {
    throw new Error(`Invalid rank: ${rank}`);
  }
  return def;
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
pnpm --filter api test -- --run apps/api/src/domain/user-experience/__tests__/rank-definitions.test.ts
```

Expected: ALL PASS

- [ ] **Step 5: コミット**

```bash
git add apps/api/src/domain/user-experience/rank-definitions.ts apps/api/src/domain/user-experience/__tests__/rank-definitions.test.ts
git commit -m "feat: ランク定義テーブルを追加（20段階・化学物質対応）"
```

---

## Task 2: UserExperience ドメインエンティティ

**Files:**

- Create: `apps/api/src/domain/user-experience/entity/user-experience.ts`
- Test: `apps/api/src/domain/user-experience/__tests__/user-experience.test.ts`

- [ ] **Step 1: テストを書く**

```typescript
// apps/api/src/domain/user-experience/__tests__/user-experience.test.ts
import { describe, expect, it } from "vitest";
import { UserExperience } from "../entity/user-experience.ts";

describe("UserExperience", () => {
  describe("create", () => {
    it("初期状態はランク1、経験値0", () => {
      const ue = UserExperience.create("user-1");
      expect(ue.userId).toBe("user-1");
      expect(ue.totalExp).toBe(0);
      expect(ue.currentRank).toBe(1);
    });
  });

  describe("reconstruct", () => {
    it("保存済みデータから復元できる", () => {
      const ue = UserExperience.reconstruct("user-1", 500, 6);
      expect(ue.userId).toBe("user-1");
      expect(ue.totalExp).toBe(500);
      expect(ue.currentRank).toBe(6);
    });
  });

  describe("addExp", () => {
    it("経験値を加算できる", () => {
      const ue = UserExperience.create("user-1");
      const result = ue.addExp(30);
      expect(result.userExperience.totalExp).toBe(30);
      expect(result.rankUps).toHaveLength(0);
    });

    it("ランクアップが発生した場合にrankUpsを返す", () => {
      const ue = UserExperience.create("user-1");
      const result = ue.addExp(50);
      expect(result.userExperience.totalExp).toBe(50);
      expect(result.userExperience.currentRank).toBe(2);
      expect(result.rankUps).toHaveLength(1);
      expect(result.rankUps[0]).toEqual({ previousRank: 1, newRank: 2 });
    });

    it("複数ランクアップが同時に発生した場合", () => {
      const ue = UserExperience.create("user-1");
      const result = ue.addExp(200);
      expect(result.userExperience.currentRank).toBe(4);
      expect(result.rankUps).toHaveLength(3);
      expect(result.rankUps[0]).toEqual({ previousRank: 1, newRank: 2 });
      expect(result.rankUps[1]).toEqual({ previousRank: 2, newRank: 3 });
      expect(result.rankUps[2]).toEqual({ previousRank: 3, newRank: 4 });
    });

    it("ランク20を超えない", () => {
      const ue = UserExperience.reconstruct("user-1", 5900, 19);
      const result = ue.addExp(200);
      expect(result.userExperience.currentRank).toBe(20);
      expect(result.userExperience.totalExp).toBe(6100);
      expect(result.rankUps).toHaveLength(1);
    });

    it("既にランク20の場合はランクアップしない", () => {
      const ue = UserExperience.reconstruct("user-1", 6000, 20);
      const result = ue.addExp(100);
      expect(result.userExperience.totalExp).toBe(6100);
      expect(result.userExperience.currentRank).toBe(20);
      expect(result.rankUps).toHaveLength(0);
    });
  });

  describe("getProgress", () => {
    it("ランク1で経験値0の場合は0%", () => {
      const ue = UserExperience.create("user-1");
      expect(ue.getProgress()).toBe(0);
    });

    it("ランク1で経験値25の場合は50%", () => {
      const ue = UserExperience.reconstruct("user-1", 25, 1);
      expect(ue.getProgress()).toBe(50);
    });

    it("ランク20の場合は100%", () => {
      const ue = UserExperience.reconstruct("user-1", 6000, 20);
      expect(ue.getProgress()).toBe(100);
    });
  });

  describe("getNextRankExp", () => {
    it("ランク1から次のランクまでの必要経験値", () => {
      const ue = UserExperience.create("user-1");
      expect(ue.getNextRankExp()).toBe(50);
    });

    it("ランク20の場合はnullを返す", () => {
      const ue = UserExperience.reconstruct("user-1", 6000, 20);
      expect(ue.getNextRankExp()).toBeNull();
    });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
pnpm --filter api test -- --run apps/api/src/domain/user-experience/__tests__/user-experience.test.ts
```

Expected: FAIL

- [ ] **Step 3: エンティティを実装**

```typescript
// apps/api/src/domain/user-experience/entity/user-experience.ts
import {
  RANK_DEFINITIONS,
  getRankForExp,
  getRankInfo,
  type RankDefinition,
} from "../rank-definitions.ts";

export type RankUp = {
  readonly previousRank: number;
  readonly newRank: number;
};

export type AddExpResult = {
  readonly userExperience: UserExperience;
  readonly rankUps: readonly RankUp[];
};

export class UserExperience {
  private constructor(
    readonly userId: string,
    readonly totalExp: number,
    readonly currentRank: number,
  ) {}

  static create(userId: string): UserExperience {
    return new UserExperience(userId, 0, 1);
  }

  static reconstruct(
    userId: string,
    totalExp: number,
    currentRank: number,
  ): UserExperience {
    return new UserExperience(userId, totalExp, currentRank);
  }

  addExp(amount: number): AddExpResult {
    const newTotalExp = this.totalExp + amount;
    const newRank = getRankForExp(newTotalExp);

    const rankUps: RankUp[] = [];
    for (let r = this.currentRank + 1; r <= newRank; r++) {
      rankUps.push({ previousRank: r - 1, newRank: r });
    }

    return {
      userExperience: new UserExperience(this.userId, newTotalExp, newRank),
      rankUps,
    };
  }

  /** 現在ランク内の進捗率（0〜100） */
  getProgress(): number {
    const currentDef = getRankInfo(this.currentRank);
    const maxRank = RANK_DEFINITIONS[RANK_DEFINITIONS.length - 1].rank;
    if (this.currentRank >= maxRank) {
      return 100;
    }
    const nextDef = getRankInfo(this.currentRank + 1);
    const rangeExp = nextDef.requiredExp - currentDef.requiredExp;
    const currentExp = this.totalExp - currentDef.requiredExp;
    return Math.round((currentExp / rangeExp) * 100);
  }

  /** 次のランクまでの必要経験値。最大ランクの場合はnull */
  getNextRankExp(): number | null {
    const maxRank = RANK_DEFINITIONS[RANK_DEFINITIONS.length - 1].rank;
    if (this.currentRank >= maxRank) {
      return null;
    }
    return getRankInfo(this.currentRank + 1).requiredExp;
  }

  getRankDefinition(): RankDefinition {
    return getRankInfo(this.currentRank);
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
pnpm --filter api test -- --run apps/api/src/domain/user-experience/__tests__/user-experience.test.ts
```

Expected: ALL PASS

- [ ] **Step 5: コミット**

```bash
git add apps/api/src/domain/user-experience/entity/user-experience.ts apps/api/src/domain/user-experience/__tests__/user-experience.test.ts
git commit -m "feat: UserExperienceエンティティを追加（経験値加算・ランクアップ判定）"
```

---

## Task 3: DBスキーマ追加

**Files:**

- Modify: `apps/api/src/infrastructure/db/schema.ts`

- [ ] **Step 1: スキーマに3テーブルを追加**

`apps/api/src/infrastructure/db/schema.ts` の末尾（`export * from "./auth-schema";` の直前）に以下を追加:

```typescript
// ── 経験値 & ランク ──────────────────────────────────────────

export const experienceActionEnum = pgEnum("experience_action", [
  "drill_complete",
  "proposal_submit",
  "proposal_approved",
]);

export const userExperience = pgTable("user_experience", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id),
  totalExp: integer("total_exp").notNull().default(0),
  currentRank: integer("current_rank").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const experienceLogs = pgTable(
  "experience_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    action: experienceActionEnum("action").notNull(),
    amount: integer("amount").notNull(),
    referenceId: uuid("reference_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_experience_logs_user_id").on(table.userId),
    index("idx_experience_logs_user_action").on(table.userId, table.action),
    {
      name: "uq_experience_logs_user_action_ref",
      unique: true,
      columns: [table.userId, table.action, table.referenceId],
    },
  ],
);

export const rankUpEvents = pgTable(
  "rank_up_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    newRank: integer("new_rank").notNull(),
    previousRank: integer("previous_rank").notNull(),
    displayedAt: timestamp("displayed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_rank_up_events_user_displayed").on(
      table.userId,
      table.displayedAt,
    ),
  ],
);
```

**注意:** ユニーク制約の書き方は、Drizzle の `unique()` ヘルパーまたは `uniqueIndex()` を使う。プロジェクトの Drizzle バージョンに合わせて調整すること。正確な書き方は以下:

```typescript
import { unique } from "drizzle-orm/pg-core";
```

を追加し、`experienceLogs` テーブルの第3引数で:

```typescript
(table) => [
  index("idx_experience_logs_user_id").on(table.userId),
  index("idx_experience_logs_user_action").on(table.userId, table.action),
  unique("uq_experience_logs_user_action_ref").on(
    table.userId,
    table.action,
    table.referenceId,
  ),
],
```

- [ ] **Step 2: マイグレーション生成**

```bash
pnpm --filter api db:generate
```

- [ ] **Step 3: マイグレーション適用**

```bash
pnpm --filter api db:push
```

- [ ] **Step 4: コミット**

```bash
git add apps/api/src/infrastructure/db/schema.ts drizzle/
git commit -m "feat: 経験値・ランク関連の3テーブルをスキーマに追加"
```

---

## Task 4: リポジトリインターフェースと実装

**Files:**

- Create: `apps/api/src/domain/user-experience/repository/user-experience-repository.ts`
- Create: `apps/api/src/domain/user-experience/query-service/user-experience-query-service.ts`
- Create: `apps/api/src/infrastructure/user-experience/drizzle-user-experience-repository.ts`
- Create: `apps/api/src/infrastructure/user-experience/drizzle-user-experience-query-service.ts`

- [ ] **Step 1: リポジトリインターフェースを作成**

```typescript
// apps/api/src/domain/user-experience/repository/user-experience-repository.ts
import type { UserExperience } from "../entity/user-experience.ts";

export type ExperienceAction =
  | "drill_complete"
  | "proposal_submit"
  | "proposal_approved";

export type ExperienceLogEntry = {
  userId: string;
  action: ExperienceAction;
  amount: number;
  referenceId: string;
};

export type RankUpEventEntry = {
  userId: string;
  previousRank: number;
  newRank: number;
};

export interface UserExperienceRepository {
  /** user_experienceを upsert で保存する */
  save(userExperience: UserExperience): Promise<void>;
  /** 指定ユーザーのUserExperienceを取得。存在しなければnull */
  findByUserId(userId: string): Promise<UserExperience | null>;
  /** 経験値ログを記録する（ユニーク制約違反時はfalseを返す） */
  saveExperienceLog(entry: ExperienceLogEntry): Promise<boolean>;
  /** ランクアップイベントを記録する */
  saveRankUpEvents(events: RankUpEventEntry[]): Promise<void>;
}
```

- [ ] **Step 2: クエリサービスインターフェースを作成**

```typescript
// apps/api/src/domain/user-experience/query-service/user-experience-query-service.ts
export type RankUpEventDto = {
  id: string;
  userId: string;
  previousRank: number;
  newRank: number;
  createdAt: string;
};

export type UserRankInfoDto = {
  totalExp: number;
  currentRank: number;
  substance: string;
  category: string;
  progress: number;
  nextRankExp: number | null;
};

export interface UserExperienceQueryService {
  /** 未表示のランクアップイベントを取得 */
  getPendingRankUps(userId: string): Promise<RankUpEventDto[]>;
  /** ランクアップイベントを表示済みにする */
  markRankUpsDisplayed(eventIds: string[]): Promise<void>;
}
```

- [ ] **Step 3: リポジトリ実装を作成**

```typescript
// apps/api/src/infrastructure/user-experience/drizzle-user-experience-repository.ts
import { eq } from "drizzle-orm";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import {
  userExperience as userExperienceTable,
  experienceLogs,
  rankUpEvents,
} from "../db/schema.ts";
import { UserExperience } from "../../domain/user-experience/entity/user-experience.ts";
import type {
  UserExperienceRepository,
  ExperienceLogEntry,
  RankUpEventEntry,
} from "../../domain/user-experience/repository/user-experience-repository.ts";

export class DrizzleUserExperienceRepository implements UserExperienceRepository {
  async save(ue: UserExperience): Promise<void> {
    const tx = getCurrentTransaction();
    await tx
      .insert(userExperienceTable)
      .values({
        userId: ue.userId,
        totalExp: ue.totalExp,
        currentRank: ue.currentRank,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userExperienceTable.userId,
        set: {
          totalExp: ue.totalExp,
          currentRank: ue.currentRank,
          updatedAt: new Date(),
        },
      });
  }

  async findByUserId(userId: string): Promise<UserExperience | null> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select()
      .from(userExperienceTable)
      .where(eq(userExperienceTable.userId, userId))
      .limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return UserExperience.reconstruct(
      row.userId,
      row.totalExp,
      row.currentRank,
    );
  }

  async saveExperienceLog(entry: ExperienceLogEntry): Promise<boolean> {
    const tx = getCurrentTransaction();
    try {
      await tx.insert(experienceLogs).values({
        userId: entry.userId,
        action: entry.action,
        amount: entry.amount,
        referenceId: entry.referenceId,
      });
      return true;
    } catch (error: unknown) {
      // ユニーク制約違反（二重付与防止）
      if (
        error instanceof Error &&
        error.message.includes("uq_experience_logs_user_action_ref")
      ) {
        return false;
      }
      throw error;
    }
  }

  async saveRankUpEvents(events: RankUpEventEntry[]): Promise<void> {
    if (events.length === 0) return;
    const tx = getCurrentTransaction();
    await tx.insert(rankUpEvents).values(
      events.map((e) => ({
        userId: e.userId,
        previousRank: e.previousRank,
        newRank: e.newRank,
      })),
    );
  }
}
```

- [ ] **Step 4: クエリサービス実装を作成**

```typescript
// apps/api/src/infrastructure/user-experience/drizzle-user-experience-query-service.ts
import { eq, isNull, inArray } from "drizzle-orm";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import { rankUpEvents } from "../db/schema.ts";
import type {
  UserExperienceQueryService,
  RankUpEventDto,
} from "../../domain/user-experience/query-service/user-experience-query-service.ts";

export class DrizzleUserExperienceQueryService implements UserExperienceQueryService {
  async getPendingRankUps(userId: string): Promise<RankUpEventDto[]> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select()
      .from(rankUpEvents)
      .where(eq(rankUpEvents.userId, userId))
      .where(isNull(rankUpEvents.displayedAt))
      .orderBy(rankUpEvents.createdAt);
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      previousRank: r.previousRank,
      newRank: r.newRank,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async markRankUpsDisplayed(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;
    const tx = getCurrentTransaction();
    await tx
      .update(rankUpEvents)
      .set({ displayedAt: new Date() })
      .where(inArray(rankUpEvents.id, eventIds));
  }
}
```

**注意:** `getPendingRankUps` の WHERE 条件で `.where()` を2回チェーンしている箇所は、Drizzle では `and()` を使う必要がある場合がある。正確には:

```typescript
import { eq, isNull, and, inArray } from "drizzle-orm";

// ...
.where(and(eq(rankUpEvents.userId, userId), isNull(rankUpEvents.displayedAt)))
```

- [ ] **Step 5: コミット**

```bash
git add apps/api/src/domain/user-experience/repository/ apps/api/src/domain/user-experience/query-service/ apps/api/src/infrastructure/user-experience/
git commit -m "feat: UserExperienceリポジトリ・クエリサービスのインターフェースと実装を追加"
```

---

## Task 5: AddExperience ユースケース

**Files:**

- Create: `apps/api/src/application/user-experience/add-experience.ts`

- [ ] **Step 1: ユースケースを作成**

```typescript
// apps/api/src/application/user-experience/add-experience.ts
import type { UnitOfWork } from "../unit-of-work.ts";
import { UserExperience } from "../../domain/user-experience/entity/user-experience.ts";
import type {
  UserExperienceRepository,
  ExperienceAction,
} from "../../domain/user-experience/repository/user-experience-repository.ts";

export type AddExperienceInput = {
  userId: string;
  action: ExperienceAction;
  referenceId: string;
  amount: number;
};

export class AddExperience {
  constructor(
    private uow: UnitOfWork,
    private userExperienceRepository: UserExperienceRepository,
  ) {}

  async execute(input: AddExperienceInput): Promise<void> {
    await this.uow.run(async () => {
      // 二重付与チェック（ログ挿入がfalseなら既に付与済み）
      const logged = await this.userExperienceRepository.saveExperienceLog({
        userId: input.userId,
        action: input.action,
        amount: input.amount,
        referenceId: input.referenceId,
      });
      if (!logged) return;

      // 現在の経験値を取得（なければ初期状態を作成）
      const current =
        (await this.userExperienceRepository.findByUserId(input.userId)) ??
        UserExperience.create(input.userId);

      // 経験値加算 & ランクアップ判定
      const { userExperience: updated, rankUps } = current.addExp(input.amount);

      // 保存
      await this.userExperienceRepository.save(updated);

      // ランクアップイベント保存
      if (rankUps.length > 0) {
        await this.userExperienceRepository.saveRankUpEvents(
          rankUps.map((r) => ({
            userId: input.userId,
            previousRank: r.previousRank,
            newRank: r.newRank,
          })),
        );
      }
    });
  }
}
```

- [ ] **Step 2: コミット**

```bash
git add apps/api/src/application/user-experience/add-experience.ts
git commit -m "feat: AddExperienceユースケースを追加"
```

---

## Task 6: ランク情報取得・ランクアップ表示ユースケース

**Files:**

- Create: `apps/api/src/application/user-experience/get-user-rank-info.ts`
- Create: `apps/api/src/application/user-experience/get-pending-rank-ups.ts`
- Create: `apps/api/src/application/user-experience/mark-rank-up-displayed.ts`

- [ ] **Step 1: GetUserRankInfo を作成**

```typescript
// apps/api/src/application/user-experience/get-user-rank-info.ts
import type { UnitOfWork } from "../unit-of-work.ts";
import { UserExperience } from "../../domain/user-experience/entity/user-experience.ts";
import type { UserExperienceRepository } from "../../domain/user-experience/repository/user-experience-repository.ts";
import type { UserRankInfoDto } from "../../domain/user-experience/query-service/user-experience-query-service.ts";

export class GetUserRankInfo {
  constructor(
    private uow: UnitOfWork,
    private userExperienceRepository: UserExperienceRepository,
  ) {}

  async execute(userId: string): Promise<UserRankInfoDto> {
    return this.uow.run(async () => {
      const ue =
        (await this.userExperienceRepository.findByUserId(userId)) ??
        UserExperience.create(userId);
      const def = ue.getRankDefinition();
      return {
        totalExp: ue.totalExp,
        currentRank: ue.currentRank,
        substance: def.substance,
        category: def.category,
        progress: ue.getProgress(),
        nextRankExp: ue.getNextRankExp(),
      };
    });
  }
}
```

- [ ] **Step 2: GetPendingRankUps を作成**

```typescript
// apps/api/src/application/user-experience/get-pending-rank-ups.ts
import type { UnitOfWork } from "../unit-of-work.ts";
import type {
  UserExperienceQueryService,
  RankUpEventDto,
} from "../../domain/user-experience/query-service/user-experience-query-service.ts";

export class GetPendingRankUps {
  constructor(
    private uow: UnitOfWork,
    private userExperienceQueryService: UserExperienceQueryService,
  ) {}

  async execute(userId: string): Promise<RankUpEventDto[]> {
    return this.uow.run(async () => {
      return this.userExperienceQueryService.getPendingRankUps(userId);
    });
  }
}
```

- [ ] **Step 3: MarkRankUpDisplayed を作成**

```typescript
// apps/api/src/application/user-experience/mark-rank-up-displayed.ts
import type { UnitOfWork } from "../unit-of-work.ts";
import type { UserExperienceQueryService } from "../../domain/user-experience/query-service/user-experience-query-service.ts";

export class MarkRankUpDisplayed {
  constructor(
    private uow: UnitOfWork,
    private userExperienceQueryService: UserExperienceQueryService,
  ) {}

  async execute(eventIds: string[]): Promise<void> {
    return this.uow.run(async () => {
      await this.userExperienceQueryService.markRankUpsDisplayed(eventIds);
    });
  }
}
```

- [ ] **Step 4: コミット**

```bash
git add apps/api/src/application/user-experience/
git commit -m "feat: ランク情報取得・ランクアップ表示関連ユースケースを追加"
```

---

## Task 7: 既存ユースケースへの経験値付与組み込み

**Files:**

- Modify: `apps/api/src/application/drill-session/save-drill-session.ts`
- Modify: `apps/api/src/application/question-proposal/submit-question-proposal-by-user.ts`
- Modify: `apps/api/src/application/question-proposal/submit-question-proposal-by-admin.ts`
- Modify: `apps/api/src/application/question-proposal/approve-question-proposal.ts`

- [ ] **Step 1: SaveDrillSession に経験値付与を追加**

`apps/api/src/application/drill-session/save-drill-session.ts` を以下のように変更:

```typescript
import { Id } from "../../domain/shared/id.ts";
import {
  DrillSession,
  type DrillAnswer,
  type DrillSessionId,
} from "../../domain/drill-session/entity/drill-session.ts";
import type { DrillSessionRepository } from "../../domain/drill-session/repository/drill-session-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";
import type { AddExperience } from "../user-experience/add-experience.ts";

export class SaveDrillSession {
  constructor(
    private uow: UnitOfWork,
    private drillSessionRepository: DrillSessionRepository,
    private addExperience: AddExperience,
  ) {}

  async execute(params: {
    userId: string;
    categoryId: string | null;
    answers: DrillAnswer[];
    startedAt: string;
  }): Promise<{ sessionId: string }> {
    const sessionId = await this.uow.run(async () => {
      const id = Id.random<DrillSession>() as DrillSessionId;
      const session = DrillSession.create({
        id,
        userId: params.userId,
        categoryId: params.categoryId,
        answers: params.answers,
        startedAt: new Date(params.startedAt),
        completedAt: new Date(),
      });
      await this.drillSessionRepository.save(session);
      return { sessionId: session.id, correctCount: session.correctCount };
    });

    // 経験値付与（トランザクション外で実行、独立したUoWを使用）
    const expAmount = 10 + sessionId.correctCount * 2;
    await this.addExperience.execute({
      userId: params.userId,
      action: "drill_complete",
      referenceId: sessionId.sessionId,
      amount: expAmount,
    });

    return { sessionId: sessionId.sessionId };
  }
}
```

- [ ] **Step 2: SubmitQuestionProposalByUser に経験値付与を追加**

`apps/api/src/application/question-proposal/submit-question-proposal-by-user.ts` を以下のように変更:

```typescript
import type { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import { Id } from "../../domain/shared/id.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";
import type { AddExperience } from "../user-experience/add-experience.ts";

export class SubmitQuestionProposalByUser {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
    private addExperience: AddExperience,
  ) {}

  async execute(input: {
    questionProposalId: string;
    callerId: string;
  }): Promise<QuestionProposal> {
    const newProposal = await this.uow.run(async () => {
      const proposal = await this.questionProposalRepository.findById(
        Id.of(input.questionProposalId),
      );

      proposal.ensureOwnedBy(input.callerId);

      const { proposal: newProposal, event } = proposal.submit();

      await this.questionProposalRepository.save(newProposal, event);

      return newProposal;
    });

    // 経験値付与
    await this.addExperience.execute({
      userId: input.callerId,
      action: "proposal_submit",
      referenceId: input.questionProposalId,
      amount: 30,
    });

    return newProposal;
  }
}
```

- [ ] **Step 3: SubmitQuestionProposalByAdmin に経験値付与を追加**

`apps/api/src/application/question-proposal/submit-question-proposal-by-admin.ts` を以下のように変更:

```typescript
import { Id } from "../../domain/shared/id.ts";
import { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";
import type { AddExperience } from "../user-experience/add-experience.ts";

export type SubmitQuestionProposalInput = {
  questionProposalId: string;
};

export class SubmitQuestionProposalByAdmin {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
    private addExperience: AddExperience,
  ) {}

  async execute(input: SubmitQuestionProposalInput): Promise<QuestionProposal> {
    const newProposal = await this.uow.run(async () => {
      const proposal = await this.questionProposalRepository.findById(
        Id.of(input.questionProposalId),
      );

      const { proposal: newProposal, event } = proposal.submit();

      await this.questionProposalRepository.save(newProposal, event);

      return newProposal;
    });

    // 管理者による提出でも、出題案にuserIdがあれば経験値を付与
    if (newProposal.userId) {
      await this.addExperience.execute({
        userId: newProposal.userId,
        action: "proposal_submit",
        referenceId: input.questionProposalId,
        amount: 30,
      });
    }

    return newProposal;
  }
}
```

- [ ] **Step 4: ApproveQuestionProposal に経験値付与を追加**

`apps/api/src/application/question-proposal/approve-question-proposal.ts` を以下のように変更:

```typescript
import { Id } from "../../domain/shared/id.ts";
import type { EventPublisher } from "../../domain/shared/event-publisher.ts";
import { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import type { QuestionProposalRepository } from "../../domain/question-proposal/repository/question-proposal-repository.ts";
import type { UnitOfWork } from "../unit-of-work.ts";
import type { AddExperience } from "../user-experience/add-experience.ts";

export type ApproveQuestionProposalInput = {
  questionProposalId: string;
};

export class ApproveQuestionProposal {
  constructor(
    private uow: UnitOfWork,
    private questionProposalRepository: QuestionProposalRepository,
    private eventPublisher: EventPublisher,
    private addExperience: AddExperience,
  ) {}

  async execute(
    input: ApproveQuestionProposalInput,
  ): Promise<QuestionProposal> {
    const { newProposal, event } = await this.uow.run(async () => {
      const proposal = await this.questionProposalRepository.findById(
        Id.of(input.questionProposalId),
      );

      const { proposal: newProposal, event } = proposal.approve();

      await this.questionProposalRepository.save(newProposal, event);

      return { newProposal, event };
    });

    await this.eventPublisher.publish(event);

    // 出題案の作成者に経験値を付与（管理者作成の場合はスキップ）
    if (newProposal.userId) {
      await this.addExperience.execute({
        userId: newProposal.userId,
        action: "proposal_approved",
        referenceId: input.questionProposalId,
        amount: 50,
      });
    }

    return newProposal;
  }
}
```

- [ ] **Step 5: コミット**

```bash
git add apps/api/src/application/drill-session/save-drill-session.ts apps/api/src/application/question-proposal/submit-question-proposal-by-user.ts apps/api/src/application/question-proposal/submit-question-proposal-by-admin.ts apps/api/src/application/question-proposal/approve-question-proposal.ts
git commit -m "feat: 既存ユースケースに経験値付与を組み込み"
```

---

## Task 8: CompositionRoot 更新 & ルートマウント

**Files:**

- Modify: `apps/api/src/composition-root.ts`
- Create: `apps/api/src/presentation/routes/rank/rank.route.ts`
- Modify: `apps/api/src/presentation/routes/index.ts`

- [ ] **Step 1: ランクAPIルートを作成**

```typescript
// apps/api/src/presentation/routes/rank/rank.route.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "../../../infrastructure/auth/auth-middleware.ts";
import type { Dependencies } from "../../../composition-root.ts";
import { errorSchema } from "../shared/schema.ts";

const rankInfoSchema = z
  .object({
    totalExp: z.number().int(),
    currentRank: z.number().int(),
    substance: z.string(),
    category: z.string(),
    progress: z.number().int().min(0).max(100),
    nextRankExp: z.number().int().nullable(),
  })
  .openapi("RankInfo");

const getRankRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Rank"],
  summary: "現在のランク情報を取得",
  responses: {
    200: {
      description: "ランク情報",
      content: { "application/json": { schema: rankInfoSchema } },
    },
  },
});

const rankUpEventSchema = z
  .object({
    id: z.string().uuid(),
    userId: z.string(),
    previousRank: z.number().int(),
    newRank: z.number().int(),
    createdAt: z.string().datetime(),
  })
  .openapi("RankUpEvent");

const getPendingRankUpsRoute = createRoute({
  method: "get",
  path: "/pending-rank-ups",
  tags: ["Rank"],
  summary: "未表示のランクアップイベントを取得",
  responses: {
    200: {
      description: "未表示ランクアップイベント一覧",
      content: {
        "application/json": { schema: z.array(rankUpEventSchema) },
      },
    },
  },
});

const markDisplayedRoute = createRoute({
  method: "post",
  path: "/mark-displayed",
  tags: ["Rank"],
  summary: "ランクアップイベントを表示済みにする",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              rankUpEventIds: z.array(z.string().uuid()).min(1),
            })
            .openapi("MarkRankUpDisplayedRequest"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "表示済みに更新",
      content: {
        "application/json": {
          schema: z
            .object({ ok: z.boolean() })
            .openapi("MarkDisplayedResponse"),
        },
      },
    },
  },
});

export const createRankRoute = (deps: Dependencies) =>
  new OpenAPIHono<AuthEnv>()
    .openapi(getRankRoute, async (c) => {
      const userId = c.get("user").id;
      const info = await deps.getUserRankInfo.execute(userId);
      return c.json(info);
    })
    .openapi(getPendingRankUpsRoute, async (c) => {
      const userId = c.get("user").id;
      const events = await deps.getPendingRankUps.execute(userId);
      return c.json(events);
    })
    .openapi(markDisplayedRoute, async (c) => {
      const { rankUpEventIds } = c.req.valid("json");
      await deps.markRankUpDisplayed.execute(rankUpEventIds);
      return c.json({ ok: true });
    });
```

- [ ] **Step 2: CompositionRoot に新しい依存関係を追加**

`apps/api/src/composition-root.ts` に以下を追加:

**import 追加（ファイル上部）:**

```typescript
import { DrizzleUserExperienceRepository } from "./infrastructure/user-experience/drizzle-user-experience-repository.ts";
import { DrizzleUserExperienceQueryService } from "./infrastructure/user-experience/drizzle-user-experience-query-service.ts";
import { AddExperience } from "./application/user-experience/add-experience.ts";
import { GetUserRankInfo } from "./application/user-experience/get-user-rank-info.ts";
import { GetPendingRankUps } from "./application/user-experience/get-pending-rank-ups.ts";
import { MarkRankUpDisplayed } from "./application/user-experience/mark-rank-up-displayed.ts";
```

**インスタンス生成（リポジトリ・クエリサービスセクション内）:**

```typescript
const userExperienceRepository = new DrizzleUserExperienceRepository();
const userExperienceQueryService = new DrizzleUserExperienceQueryService();
```

**ユースケース生成（ユースケースセクション内）:**

```typescript
const addExperience = new AddExperience(unitOfWork, userExperienceRepository);
const getUserRankInfo = new GetUserRankInfo(
  unitOfWork,
  userExperienceRepository,
);
const getPendingRankUps = new GetPendingRankUps(
  unitOfWork,
  userExperienceQueryService,
);
const markRankUpDisplayed = new MarkRankUpDisplayed(
  unitOfWork,
  userExperienceQueryService,
);
```

**既存ユースケースのコンストラクタ変更:**

`saveDrillSession` の生成を変更:

```typescript
const saveDrillSession = new SaveDrillSession(
  unitOfWork,
  drillSessionRepository,
  addExperience,
);
```

`submitQuestionProposalByAdmin` の生成を変更:

```typescript
const submitQuestionProposalByAdmin = new SubmitQuestionProposalByAdmin(
  unitOfWork,
  questionProposalRepository,
  addExperience,
);
```

`submitQuestionProposalByUser` の生成を変更:

```typescript
const submitQuestionProposalByUser = new SubmitQuestionProposalByUser(
  unitOfWork,
  questionProposalRepository,
  addExperience,
);
```

`approveQuestionProposal` の生成を変更:

```typescript
const approveQuestionProposal = new ApproveQuestionProposal(
  unitOfWork,
  questionProposalRepository,
  eventPublisher,
  addExperience,
);
```

**dependencies オブジェクトに追加:**

```typescript
export const dependencies = {
  // ... 既存のプロパティ ...
  getUserRankInfo,
  getPendingRankUps,
  markRankUpDisplayed,
};
```

- [ ] **Step 3: ルートをマウント**

`apps/api/src/presentation/routes/index.ts` に以下を追加:

**import 追加:**

```typescript
import { createRankRoute } from "./rank/rank.route.ts";
```

**ルートマウント（`.route("/drill-stats", ...)` の後に追加）:**

```typescript
.route("/rank", createRankRoute(deps))
```

- [ ] **Step 4: 型チェックを実行**

```bash
pnpm type-check
```

Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add apps/api/src/composition-root.ts apps/api/src/presentation/routes/rank/ apps/api/src/presentation/routes/index.ts
git commit -m "feat: ランクAPI ルート追加・CompositionRoot更新・ルートマウント"
```

---

## Task 9: フロントエンド — ランク情報カード

**Files:**

- Create: `apps/web/src/features/stats/rank-card.tsx`
- Modify: `apps/web/src/features/stats/stats-page.tsx`

- [ ] **Step 1: ランク情報カードコンポーネントを作成**

```tsx
// apps/web/src/features/stats/rank-card.tsx
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { client } from "@/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">
              Rank {rankInfo.currentRank} — {rankInfo.substance}
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
          あなたは{rankInfo.substance}を扱えます！！
        </p>

        {remaining !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>次のランクまで</span>
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

- [ ] **Step 2: StatsPage にランクカードを統合**

`apps/web/src/features/stats/stats-page.tsx` の先頭の import に追加:

```typescript
import { RankCard } from "./rank-card";
```

JSX内、`<div className="flex items-center justify-between">` の直前に追加:

```tsx
<RankCard />
```

- [ ] **Step 3: コミット**

```bash
git add apps/web/src/features/stats/rank-card.tsx apps/web/src/features/stats/stats-page.tsx
git commit -m "feat: Statsページにランク情報カードを追加"
```

---

## Task 10: フロントエンド — ランクアップ演出モーダル

**Files:**

- Create: `apps/web/src/features/question/rank-up-modal.tsx`
- Create: `apps/web/src/features/question/rank-up-modal.css`

- [ ] **Step 1: CSSアニメーションファイルを作成**

```css
/* apps/web/src/features/question/rank-up-modal.css */
@keyframes rank-up-title {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes rank-up-substance {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rank-up-glow {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(var(--glow-color), 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(var(--glow-color), 0.6);
  }
}

.rank-up-title {
  animation: rank-up-title 0.8s ease-out forwards;
}

.rank-up-substance {
  animation: rank-up-substance 0.6s ease-out 0.5s forwards;
  opacity: 0;
}

.rank-up-glow {
  animation: rank-up-glow 2s ease-in-out infinite;
}
```

- [ ] **Step 2: ランクアップモーダルコンポーネントを作成**

```tsx
// apps/web/src/features/question/rank-up-modal.tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { client } from "@/client";
import { RANK_DEFINITIONS } from "./rank-constants";
import "./rank-up-modal.css";

const CATEGORY_STYLES: Record<string, { text: string; glow: string }> = {
  日常物質: { text: "text-green-500", glow: "0, 200, 0" },
  一般薬品: { text: "text-blue-500", glow: "0, 100, 255" },
  劇物: { text: "text-orange-500", glow: "255, 165, 0" },
  毒物: { text: "text-red-500", glow: "255, 0, 0" },
  特定毒物: { text: "text-purple-500", glow: "128, 0, 255" },
  最終ランク: { text: "text-yellow-500", glow: "255, 215, 0" },
};

type RankUpEventDto = {
  id: string;
  userId: string;
  previousRank: number;
  newRank: number;
  createdAt: string;
};

type Props = {
  rankUps: RankUpEventDto[];
  onClose: () => void;
};

export function RankUpModal({ rankUps, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const markMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await client.api.rank["mark-displayed"].$post({
        json: { rankUpEventIds: ids },
      });
      if (!res.ok) throw new Error("Failed to mark rank ups as displayed");
    },
  });

  if (rankUps.length === 0) return null;

  const currentRankUp = rankUps[currentIndex];
  const rankDef = RANK_DEFINITIONS[currentRankUp.newRank - 1];
  const style =
    CATEGORY_STYLES[rankDef?.category ?? ""] ?? CATEGORY_STYLES["日常物質"];
  const isLast = currentIndex === rankUps.length - 1;

  const handleNext = () => {
    if (isLast) {
      markMutation.mutate(
        rankUps.map((r) => r.id),
        { onSettled: onClose },
      );
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <Dialog open onOpenChange={() => handleNext()}>
      <DialogContent
        className="rank-up-glow text-center sm:max-w-md"
        style={{ "--glow-color": style.glow } as React.CSSProperties}
      >
        <DialogHeader>
          <DialogTitle className="rank-up-title text-2xl font-bold">
            ランクアップ！
          </DialogTitle>
        </DialogHeader>

        <div className="rank-up-substance space-y-4 py-4">
          <p className={`text-4xl font-bold ${style.text}`}>
            Rank {currentRankUp.newRank}
          </p>
          <p className="text-xl font-semibold">{rankDef?.substance}</p>
          <p className="text-primary">
            あなたは{rankDef?.substance}を扱えるようになりました！！
          </p>
        </div>

        <Button onClick={handleNext} className="w-full">
          {isLast ? "閉じる" : "次へ"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: ランク定義をフロントに用意する**

ランクアップモーダルでランク番号から化学物質名を引くため、フロント用のランク定義を用意する。

```typescript
// apps/web/src/features/question/rank-constants.ts
export type RankDefinition = {
  rank: number;
  substance: string;
  category: string;
};

export const RANK_DEFINITIONS: RankDefinition[] = [
  { rank: 1, substance: "水 (H₂O)", category: "日常物質" },
  { rank: 2, substance: "食塩 (NaCl)", category: "日常物質" },
  { rank: 3, substance: "重曹 (NaHCO₃)", category: "日常物質" },
  { rank: 4, substance: "エタノール (C₂H₅OH)", category: "日常物質" },
  { rank: 5, substance: "酢酸 (CH₃COOH)", category: "日常物質" },
  { rank: 6, substance: "過酸化水素 (H₂O₂)", category: "一般薬品" },
  { rank: 7, substance: "アンモニア (NH₃)", category: "一般薬品" },
  { rank: 8, substance: "塩酸 (HCl)", category: "一般薬品" },
  { rank: 9, substance: "硫酸 (H₂SO₄)", category: "一般薬品" },
  { rank: 10, substance: "水酸化ナトリウム (NaOH)", category: "一般薬品" },
  { rank: 11, substance: "硝酸 (HNO₃)", category: "劇物" },
  { rank: 12, substance: "ホルムアルデヒド (HCHO)", category: "劇物" },
  { rank: 13, substance: "クロロホルム (CHCl₃)", category: "劇物" },
  { rank: 14, substance: "フッ化水素 (HF)", category: "毒物" },
  { rank: 15, substance: "黄リン (P₄)", category: "毒物" },
  { rank: 16, substance: "シアン化カリウム (KCN)", category: "毒物" },
  { rank: 17, substance: "ヒ素 (As)", category: "毒物" },
  { rank: 18, substance: "水銀 (Hg)", category: "特定毒物" },
  { rank: 19, substance: "VXガス", category: "特定毒物" },
  { rank: 20, substance: "プルトニウム (Pu)", category: "最終ランク" },
];
```

- [ ] **Step 4: コミット**

```bash
git add apps/web/src/features/question/rank-up-modal.tsx apps/web/src/features/question/rank-up-modal.css apps/web/src/features/question/rank-constants.ts
git commit -m "feat: ランクアップ演出モーダルコンポーネントを追加"
```

---

## Task 11: フロントエンド — ドリル完了時にランクアップモーダルを統合

**Files:**

- Modify: `apps/web/src/features/question/session-container.tsx`
- Modify: `apps/web/src/features/question/result-screen.tsx`

- [ ] **Step 1: ResultScreen にランクアップモーダルを統合**

`apps/web/src/features/question/result-screen.tsx` を以下のように変更:

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { AnswerResult } from "@/types/question";
import { Trophy } from "lucide-react";
import { client } from "@/client";
import { RankUpModal } from "./rank-up-modal";

type Props = {
  results: AnswerResult[];
  onRetry?: () => void;
  children?: React.ReactNode;
  checkRankUp?: boolean;
};

export function ResultScreen({
  results,
  onRetry,
  children,
  checkRankUp = true,
}: Props) {
  const total = results.length;
  const correct = results.filter((r) => r.isCorrect).length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  const [showRankUpModal, setShowRankUpModal] = useState(true);

  const { data: pendingRankUps } = useQuery({
    queryKey: ["rank", "pending-rank-ups"],
    queryFn: async () => {
      const res = await client.api.rank["pending-rank-ups"].$get();
      if (!res.ok) throw new Error("Failed to fetch pending rank ups");
      return res.json();
    },
    enabled: checkRankUp,
  });

  return (
    <>
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="size-6 text-primary" />
          </div>
          <CardTitle>結果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">
              {correct} / {total}
            </p>
            <p className="text-muted-foreground">問正解</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>正答率</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              もう一度挑戦する
            </Button>
          )}
          {children}
        </CardContent>
      </Card>

      {showRankUpModal && pendingRankUps && pendingRankUps.length > 0 && (
        <RankUpModal
          rankUps={pendingRankUps}
          onClose={() => setShowRankUpModal(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: SessionContainer の ResultScreen 呼び出しを確認**

`session-container.tsx` で `ResultScreen` を呼んでいる箇所を確認。`saveResult` prop がある場合のみランクアップチェックを行うよう `checkRankUp={saveResult}` を渡す:

```tsx
<ResultScreen
  results={state.results}
  onRetry={showRetry ? reset : undefined}
  checkRankUp={saveResult}
>
  {resultActions}
</ResultScreen>
```

- [ ] **Step 3: 型チェックとリントを実行**

```bash
pnpm type-check && pnpm lint
```

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add apps/web/src/features/question/result-screen.tsx apps/web/src/features/question/session-container.tsx
git commit -m "feat: ドリル完了時にランクアップ演出モーダルを表示"
```

---

## Task 12: 最終確認

- [ ] **Step 1: 全テスト実行**

```bash
pnpm test
```

Expected: 新規テスト含めて全てPASS（既存の QuestionProposal 関連8件の失敗は既知のため除外）

- [ ] **Step 2: 型チェック & リント**

```bash
pnpm type-check && pnpm lint && pnpm format:check
```

Expected: エラーなし

- [ ] **Step 3: ローカルでの動作確認**

```bash
docker compose up -d
pnpm --filter api db:push
pnpm dev
```

以下を手動確認:

1. ドリルを完了 → セッション保存後に経験値が付与される
2. Statsページにランク情報カードが表示される
3. 経験値が50を超えるとランクアップモーダルが表示される
4. モーダルを閉じた後、再度ドリルを完了してもランクアップモーダルが再表示されない（表示済みマーク）

- [ ] **Step 4: 動作確認後サーバーを停止**

```bash
# Ctrl+C で pnpm dev を停止
docker compose down
```

- [ ] **Step 5: コミット（フォーマット等の微修正がある場合）**

```bash
pnpm format
git add -A
git commit -m "chore: フォーマット修正"
```
