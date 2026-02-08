import type { CategoryId } from "../category/CategoryId.js";
import { CorrectIndexes } from "./CorrectIndexes.js";
import { Difficulty } from "./Difficulty.js";
import { Explanation } from "./Explanation.js";
import type { QuestionId } from "./QuestionId.js";
import { QuestionText } from "./QuestionText.js";

const MIN_CHOICES = 4;
const MAX_CHOICES = 8;

export class Question {
  private constructor(
    readonly id: QuestionId,
    readonly text: QuestionText,
    readonly difficulty: Difficulty,
    readonly choices: readonly string[],
    readonly correctIndexes: CorrectIndexes,
    readonly explanation: Explanation,
    readonly categoryId: CategoryId,
  ) {}

  static create(params: {
    id: QuestionId;
    text: QuestionText;
    difficulty: Difficulty;
    choices: string[];
    correctIndexes: CorrectIndexes;
    explanation: Explanation;
    categoryId: CategoryId;
  }): Question {
    if (params.choices.length < MIN_CHOICES) {
      throw new Error(
        `選択肢は${MIN_CHOICES}個以上必要です（${params.choices.length}個）`,
      );
    }
    if (params.choices.length > MAX_CHOICES) {
      throw new Error(
        `選択肢は${MAX_CHOICES}個以内にしてください（${params.choices.length}個）`,
      );
    }
    for (const idx of params.correctIndexes.values) {
      if (idx < 0 || idx >= params.choices.length) {
        throw new Error(
          `正解インデックス ${idx} が範囲外です（0〜${params.choices.length - 1}）`,
        );
      }
    }
    return new Question(
      params.id,
      params.text,
      params.difficulty,
      Object.freeze([...params.choices]),
      params.correctIndexes,
      params.explanation,
      params.categoryId,
    );
  }

  isCorrect(indexes: number[]): boolean {
    const sorted = [...indexes].sort((a, b) => a - b);
    if (sorted.length !== this.correctIndexes.values.length) return false;
    return sorted.every((v, i) => v === this.correctIndexes.values[i]);
  }
}
