import { describe, expect, it } from "vitest";
import { CategoryId } from "../CategoryId.js";

describe("CategoryId", () => {
  it("正常なUUIDで生成できる", () => {
    const id = CategoryId.create("550e8400-e29b-41d4-a716-446655440000");
    expect(id.value).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("不正な形式はエラー", () => {
    expect(() => CategoryId.create("invalid")).toThrow(
      "有効な UUID ではありません",
    );
  });

  it("equals で比較できる", () => {
    const a = CategoryId.create("550e8400-e29b-41d4-a716-446655440000");
    const b = CategoryId.create("550e8400-e29b-41d4-a716-446655440000");
    const c = CategoryId.create("550e8400-e29b-41d4-a716-446655440001");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
