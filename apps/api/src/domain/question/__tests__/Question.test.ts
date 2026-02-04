import { describe, expect, it } from "vitest";
import { Difficulty } from "../Difficulty.js";
import { Question } from "../Question.js";
import { QuestionId } from "../QuestionId.js";
import { QuestionText } from "../QuestionText.js";

function buildQuestion(overrides?: {
  choices?: string[];
  correctIndex?: number;
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
    correctIndex: overrides?.correctIndex ?? 0,
  });
}

describe("Question", () => {
  it("正しいパラメータで生成できる", () => {
    const q = buildQuestion();
    expect(q.id.value).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(q.choices).toHaveLength(4);
    expect(q.correctIndex).toBe(0);
  });

  it("選択肢が2つ未満はエラー", () => {
    expect(() =>
      buildQuestion({ choices: ["唯一の選択肢"], correctIndex: 0 }),
    ).toThrow("at least 2 choices");
  });

  it("correctIndex が範囲外（負）ならエラー", () => {
    expect(() => buildQuestion({ correctIndex: -1 })).toThrow("out of range");
  });

  it("correctIndex が範囲外（超過）ならエラー", () => {
    expect(() => buildQuestion({ correctIndex: 4 })).toThrow("out of range");
  });

  it("isCorrect で正解判定できる", () => {
    const q = buildQuestion();
    expect(q.isCorrect(0)).toBe(true);
    expect(q.isCorrect(1)).toBe(false);
  });

  it("changeDifficulty で難易度を変更できる", () => {
    const q = buildQuestion();
    const changed = q.changeDifficulty(Difficulty.create("hard"));
    expect(changed.difficulty.value).toBe("hard");
    expect(q.difficulty.value).toBe("medium"); // 元は不変
  });

  it("choices は不変（frozen）", () => {
    const q = buildQuestion();
    expect(() => {
      (q.choices as string[]).push("追加");
    }).toThrow();
  });
});
