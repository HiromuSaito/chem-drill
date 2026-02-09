import { describe, expect, it } from "vitest";
import { CategoryName } from "../category-name.js";

describe("CategoryName", () => {
  it("正常な値で生成できる", () => {
    const c = CategoryName.create("化学物質管理");
    expect(c.value).toBe("化学物質管理");
  });

  it("空文字はエラー", () => {
    expect(() => CategoryName.create("")).toThrow("カテゴリ名は空にできません");
  });

  it("100文字を超えるとエラー", () => {
    const long = "あ".repeat(101);
    expect(() => CategoryName.create(long)).toThrow("100文字以内");
  });

  it("100文字ちょうどは許可", () => {
    const exact = "あ".repeat(100);
    expect(CategoryName.create(exact).value).toHaveLength(100);
  });

  it("equals で比較できる", () => {
    const a = CategoryName.create("カテゴリA");
    const b = CategoryName.create("カテゴリA");
    const c = CategoryName.create("カテゴリB");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
