import { describe, expect, it } from "vitest";
import { QuestionId } from "../QuestionId.js";

describe("QuestionId", () => {
  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

  it("有効な UUID で生成できる", () => {
    const id = QuestionId.create(VALID_UUID);
    expect(id.value).toBe(VALID_UUID);
  });

  it("大文字の UUID も受け付ける", () => {
    const upper = VALID_UUID.toUpperCase();
    const id = QuestionId.create(upper);
    expect(id.value).toBe(upper);
  });

  it("不正な文字列はエラー", () => {
    expect(() => QuestionId.create("not-a-uuid")).toThrow(
      "QuestionId が不正です",
    );
  });

  it("空文字はエラー", () => {
    expect(() => QuestionId.create("")).toThrow("QuestionId が不正です");
  });

  it("同じ値なら equals が true", () => {
    const a = QuestionId.create(VALID_UUID);
    const b = QuestionId.create(VALID_UUID);
    expect(a.equals(b)).toBe(true);
  });

  it("異なる値なら equals が false", () => {
    const a = QuestionId.create(VALID_UUID);
    const b = QuestionId.create("660e8400-e29b-41d4-a716-446655440000");
    expect(a.equals(b)).toBe(false);
  });
});
