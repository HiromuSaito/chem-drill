import { describe, expect, it } from "vitest";
import { Difficulty } from "../Difficulty.js";

describe("Difficulty", () => {
  it.each(["easy", "medium", "hard"])("%s で生成できる", (level) => {
    const d = Difficulty.create(level);
    expect(d.value).toBe(level);
  });

  it("不正な値はエラー", () => {
    expect(() => Difficulty.create("extreme")).toThrow("Invalid Difficulty");
  });

  it("空文字はエラー", () => {
    expect(() => Difficulty.create("")).toThrow("Invalid Difficulty");
  });

  it("同じ値なら equals が true", () => {
    const a = Difficulty.create("easy");
    const b = Difficulty.create("easy");
    expect(a.equals(b)).toBe(true);
  });

  it("異なる値なら equals が false", () => {
    const a = Difficulty.create("easy");
    const b = Difficulty.create("hard");
    expect(a.equals(b)).toBe(false);
  });
});
