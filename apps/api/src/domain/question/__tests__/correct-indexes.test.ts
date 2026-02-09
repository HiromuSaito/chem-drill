import { describe, expect, it } from "vitest";
import { CorrectIndexes } from "../correct-indexes.js";

describe("CorrectIndexes", () => {
  it("単一のインデックスで生成できる", () => {
    const ci = CorrectIndexes.create([0]);
    expect(ci.values).toEqual([0]);
  });

  it("複数のインデックスで生成できる", () => {
    const ci = CorrectIndexes.create([2, 0, 3]);
    expect(ci.values).toEqual([0, 2, 3]); // ソート済み
  });

  it("空配列はエラー", () => {
    expect(() => CorrectIndexes.create([])).toThrow("1つ以上必要です");
  });

  it("重複はエラー", () => {
    expect(() => CorrectIndexes.create([1, 1])).toThrow("重複があります");
  });

  it("includes で含まれるか判定できる", () => {
    const ci = CorrectIndexes.create([0, 2]);
    expect(ci.includes(0)).toBe(true);
    expect(ci.includes(1)).toBe(false);
    expect(ci.includes(2)).toBe(true);
  });

  it("equals で比較できる", () => {
    const a = CorrectIndexes.create([0, 2]);
    const b = CorrectIndexes.create([2, 0]); // 順序違い → ソート後同じ
    const c = CorrectIndexes.create([0, 1]);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it("要素数が異なれば equals は false", () => {
    const a = CorrectIndexes.create([0]);
    const b = CorrectIndexes.create([0, 1]);
    expect(a.equals(b)).toBe(false);
  });

  it("values は不変（frozen）", () => {
    const ci = CorrectIndexes.create([0, 1]);
    expect(() => {
      (ci.values as number[]).push(2);
    }).toThrow();
  });
});
