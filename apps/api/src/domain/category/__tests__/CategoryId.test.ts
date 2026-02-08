import { describe, expect, it } from "vitest";
import { Id } from "../../Id.js";
import type { Category } from "../Category.js";

describe("CategoryId", () => {
  it("正常なUUIDで生成できる", () => {
    const id = Id.of<Category>("550e8400-e29b-41d4-a716-446655440000");
    expect(id).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("不正な形式はエラー", () => {
    expect(() => Id.of<Category>("invalid")).toThrow("Invalid UUID");
  });

  it("=== で比較できる", () => {
    const a = Id.of<Category>("550e8400-e29b-41d4-a716-446655440000");
    const b = Id.of<Category>("550e8400-e29b-41d4-a716-446655440000");
    const c = Id.of<Category>("550e8400-e29b-41d4-a716-446655440001");
    expect(a === b).toBe(true);
    expect(a === c).toBe(false);
  });
});
