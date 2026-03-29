import { describe, expect, it } from "vitest";
import {
  RANK_DEFINITIONS,
  getRankForExp,
  getRankInfo,
} from "../rank-definitions.ts";

describe("RANK_DEFINITIONS", () => {
  it("21段階のランクが定義されている（0〜20）", () => {
    expect(RANK_DEFINITIONS).toHaveLength(21);
  });

  it("ランク0は見習い、必要経験値は0", () => {
    expect(RANK_DEFINITIONS[0].rank).toBe(0);
    expect(RANK_DEFINITIONS[0].requiredExp).toBe(0);
    expect(RANK_DEFINITIONS[0].substance).toBe("見習い");
  });

  it("ランク1の必要経験値は10", () => {
    expect(RANK_DEFINITIONS[1].rank).toBe(1);
    expect(RANK_DEFINITIONS[1].requiredExp).toBe(10);
  });

  it("必要経験値が昇順に並んでいる", () => {
    for (let i = 1; i < RANK_DEFINITIONS.length; i++) {
      expect(RANK_DEFINITIONS[i].requiredExp).toBeGreaterThan(
        RANK_DEFINITIONS[i - 1].requiredExp,
      );
    }
  });

  it("ランク番号が0から20まで連番", () => {
    RANK_DEFINITIONS.forEach((def, i) => {
      expect(def.rank).toBe(i);
    });
  });
});

describe("getRankForExp", () => {
  it("経験値0はランク0", () => {
    expect(getRankForExp(0)).toBe(0);
  });

  it("経験値9はランク0", () => {
    expect(getRankForExp(9)).toBe(0);
  });

  it("経験値10はランク1", () => {
    expect(getRankForExp(10)).toBe(1);
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
  it("ランク0の情報を返す", () => {
    const info = getRankInfo(0);
    expect(info.substance).toBe("見習い");
    expect(info.category).toBe("見習い");
  });

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
