import { Difficulty } from "./Difficulty.js";
import { QuestionId } from "./QuestionId.js";
import { QuestionText } from "./QuestionText.js";

export class Question {
  private constructor(
    readonly id: QuestionId,
    readonly text: QuestionText,
    private _difficulty: Difficulty,
    readonly choices: readonly string[],
    readonly correctIndex: number,
  ) {}

  static create(params: {
    id: QuestionId;
    text: QuestionText;
    difficulty: Difficulty;
    choices: string[];
    correctIndex: number;
  }): Question {
    if (params.choices.length < 2) {
      throw new Error("Question must have at least 2 choices");
    }
    if (
      params.correctIndex < 0 ||
      params.correctIndex >= params.choices.length
    ) {
      throw new Error(
        `correctIndex ${params.correctIndex} is out of range (0..${params.choices.length - 1})`,
      );
    }
    return new Question(
      params.id,
      params.text,
      params.difficulty,
      Object.freeze([...params.choices]),
      params.correctIndex,
    );
  }

  get difficulty(): Difficulty {
    return this._difficulty;
  }

  isCorrect(index: number): boolean {
    return index === this.correctIndex;
  }

  changeDifficulty(difficulty: Difficulty): Question {
    return new Question(
      this.id,
      this.text,
      difficulty,
      this.choices,
      this.correctIndex,
    );
  }
}
