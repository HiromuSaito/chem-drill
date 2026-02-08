import { describe, expect, it } from "vitest";
import { Category } from "../Category.js";
import { CategoryId } from "../CategoryId.js";
import { CategoryName } from "../CategoryName.js";

describe("Category", () => {
  it("正常なパラメータで生成できる", () => {
    const category = Category.create({
      id: CategoryId.create("550e8400-e29b-41d4-a716-446655440000"),
      name: CategoryName.create("化学物質管理"),
    });
    expect(category.id.value).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(category.name.value).toBe("化学物質管理");
  });

  it("equals は id で比較する", () => {
    const a = Category.create({
      id: CategoryId.create("550e8400-e29b-41d4-a716-446655440000"),
      name: CategoryName.create("カテゴリA"),
    });
    const b = Category.create({
      id: CategoryId.create("550e8400-e29b-41d4-a716-446655440000"),
      name: CategoryName.create("カテゴリB"), // 名前が違っても
    });
    const c = Category.create({
      id: CategoryId.create("550e8400-e29b-41d4-a716-446655440001"),
      name: CategoryName.create("カテゴリA"),
    });
    expect(a.equals(b)).toBe(true); // id が同じなら等しい
    expect(a.equals(c)).toBe(false); // id が違えば等しくない
  });
});
