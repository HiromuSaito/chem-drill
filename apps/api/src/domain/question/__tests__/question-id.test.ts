import { describe, expect, it } from "vitest";
import { Id } from "../../id.js";
import type { Question } from "../question.js";

describe("QuestionId", () => {
  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

  it("有効な UUID で生成できる", () => {
    const id = Id.of<Question>(VALID_UUID);
    expect(id).toBe(VALID_UUID);
  });

  it("大文字の UUID も受け付ける", () => {
    const upper = VALID_UUID.toUpperCase();
    const id = Id.of<Question>(upper);
    expect(id).toBe(upper);
  });

  it("不正な文字列はエラー", () => {
    expect(() => Id.of<Question>("not-a-uuid")).toThrow("Invalid UUID");
  });

  it("空文字はエラー", () => {
    expect(() => Id.of<Question>("")).toThrow("Invalid UUID");
  });

  it("同じ値なら === が true", () => {
    const a = Id.of<Question>(VALID_UUID);
    const b = Id.of<Question>(VALID_UUID);
    expect(a === b).toBe(true);
  });

  it("異なる値なら === が false", () => {
    const a = Id.of<Question>(VALID_UUID);
    const b = Id.of<Question>("660e8400-e29b-41d4-a716-446655440000");
    expect(a === b).toBe(false);
  });
});
