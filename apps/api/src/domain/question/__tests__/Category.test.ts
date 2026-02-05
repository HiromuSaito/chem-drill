import { describe, expect, it } from "vitest";
import { Category } from "../Category.js";

describe("Category", () => {
  it("正常な値で生成できる", () => {
    const c = Category.create("化学物質管理");
    expect(c.value).toBe("化学物質管理");
  });

  it("空文字はエラー", () => {
    expect(() => Category.create("")).toThrow("カテゴリは空にできません");
  });

  it("100文字を超えるとエラー", () => {
    const long = "あ".repeat(101);
    expect(() => Category.create(long)).toThrow("100文字以内");
  });

  it("100文字ちょうどは許可", () => {
    const exact = "あ".repeat(100);
    expect(Category.create(exact).value).toHaveLength(100);
  });

  it("equals で比較できる", () => {
    const a = Category.create("カテゴリA");
    const b = Category.create("カテゴリA");
    const c = Category.create("カテゴリB");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
