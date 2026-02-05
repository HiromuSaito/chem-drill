import { describe, expect, it } from "vitest";
import { QuestionText } from "../QuestionText.js";

describe("QuestionText", () => {
  it("通常の文字列で生成できる", () => {
    const text = QuestionText.create("化学物質の管理について");
    expect(text.value).toBe("化学物質の管理について");
  });

  it("空文字はエラー", () => {
    expect(() => QuestionText.create("")).toThrow("問題文は空にできません");
  });

  it("500文字ちょうどは OK", () => {
    const str = "あ".repeat(500);
    const text = QuestionText.create(str);
    expect(text.value).toBe(str);
  });

  it("501文字はエラー", () => {
    const str = "あ".repeat(501);
    expect(() => QuestionText.create(str)).toThrow("500文字以内");
  });

  it("同じ値なら equals が true", () => {
    const a = QuestionText.create("問題文");
    const b = QuestionText.create("問題文");
    expect(a.equals(b)).toBe(true);
  });

  it("異なる値なら equals が false", () => {
    const a = QuestionText.create("問題文A");
    const b = QuestionText.create("問題文B");
    expect(a.equals(b)).toBe(false);
  });
});
