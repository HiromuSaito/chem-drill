import { describe, expect, it } from "vitest";
import { Category } from "../Category.js";
import { CorrectIndexes } from "../CorrectIndexes.js";
import { Difficulty } from "../Difficulty.js";
import { Explanation } from "../Explanation.js";
import { Question } from "../Question.js";
import { QuestionId } from "../QuestionId.js";
import { QuestionText } from "../QuestionText.js";

function buildQuestion(overrides?: {
  choices?: string[];
  correctIndexes?: CorrectIndexes;
  explanation?: Explanation;
  category?: Category;
}) {
  return Question.create({
    id: QuestionId.create("550e8400-e29b-41d4-a716-446655440000"),
    text: QuestionText.create("SDSの記載項目として正しいものはどれか"),
    difficulty: Difficulty.create("medium"),
    choices: overrides?.choices ?? [
      "GHS分類",
      "市場価格",
      "製造者の趣味",
      "天気予報",
    ],
    correctIndexes: overrides?.correctIndexes ?? CorrectIndexes.create([0]),
    explanation:
      overrides?.explanation ??
      Explanation.create("GHS分類はSDSの必須記載項目です。"),
    category: overrides?.category ?? Category.create("化学物質管理"),
  });
}

describe("Question", () => {
  it("正しいパラメータで生成できる", () => {
    const q = buildQuestion();
    expect(q.id.value).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(q.choices).toHaveLength(4);
    expect(q.correctIndexes.values).toEqual([0]);
    expect(q.explanation.value).toBe("GHS分類はSDSの必須記載項目です。");
    expect(q.category.value).toBe("化学物質管理");
  });

  it("選択肢が4つ未満はエラー", () => {
    expect(() =>
      buildQuestion({
        choices: ["選択肢A", "選択肢B", "選択肢C"],
        correctIndexes: CorrectIndexes.create([0]),
      }),
    ).toThrow("4個以上必要です");
  });

  it("選択肢が9つ以上はエラー", () => {
    expect(() =>
      buildQuestion({
        choices: ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
        correctIndexes: CorrectIndexes.create([0]),
      }),
    ).toThrow("8個以内にしてください");
  });

  it("選択肢4個で生成できる", () => {
    const q = buildQuestion();
    expect(q.choices).toHaveLength(4);
  });

  it("選択肢8個で生成できる", () => {
    const q = buildQuestion({
      choices: ["A", "B", "C", "D", "E", "F", "G", "H"],
      correctIndexes: CorrectIndexes.create([0]),
    });
    expect(q.choices).toHaveLength(8);
  });

  it("correctIndexes が範囲外ならエラー", () => {
    expect(() =>
      buildQuestion({ correctIndexes: CorrectIndexes.create([4]) }),
    ).toThrow("範囲外です");
  });

  it("correctIndexes に負の値が含まれるとエラー", () => {
    expect(() =>
      buildQuestion({ correctIndexes: CorrectIndexes.create([-1]) }),
    ).toThrow("範囲外です");
  });

  it("単一正解で isCorrect 判定できる", () => {
    const q = buildQuestion();
    expect(q.isCorrect([0])).toBe(true);
    expect(q.isCorrect([1])).toBe(false);
  });

  it("複数正解で isCorrect 判定できる", () => {
    const q = buildQuestion({
      correctIndexes: CorrectIndexes.create([0, 2]),
    });
    expect(q.isCorrect([0, 2])).toBe(true);
    expect(q.isCorrect([2, 0])).toBe(true); // 順序違いでもOK
    expect(q.isCorrect([0])).toBe(false); // 不足
    expect(q.isCorrect([0, 1, 2])).toBe(false); // 過剰
  });

  it("choices は不変（frozen）", () => {
    const q = buildQuestion();
    expect(() => {
      (q.choices as string[]).push("追加");
    }).toThrow();
  });
});
