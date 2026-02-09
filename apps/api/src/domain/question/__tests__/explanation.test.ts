import { describe, expect, it } from "vitest";
import { Explanation } from "../explanation.js";

describe("Explanation", () => {
  it("正常な値で生成できる", () => {
    const e = Explanation.create(
      "GHS分類は化学品の分類と表示に関する国際的なルールです。",
    );
    expect(e.value).toBe(
      "GHS分類は化学品の分類と表示に関する国際的なルールです。",
    );
  });

  it("空文字はエラー", () => {
    expect(() => Explanation.create("")).toThrow("解説文は空にできません");
  });

  it("1000文字を超えるとエラー", () => {
    const long = "あ".repeat(1001);
    expect(() => Explanation.create(long)).toThrow("1000文字以内");
  });

  it("1000文字ちょうどは許可", () => {
    const exact = "あ".repeat(1000);
    expect(Explanation.create(exact).value).toHaveLength(1000);
  });

  it("equals で比較できる", () => {
    const a = Explanation.create("解説A");
    const b = Explanation.create("解説A");
    const c = Explanation.create("解説B");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
