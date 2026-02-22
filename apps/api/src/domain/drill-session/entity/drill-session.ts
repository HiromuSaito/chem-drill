import type { Id } from "../../shared/id.ts";

export type DrillSessionId = Id<DrillSession>;

export type DrillAnswer = {
  questionId: string;
  selectedIndexes: number[];
  isCorrect: boolean;
};

export class DrillSession {
  private constructor(
    readonly id: DrillSessionId,
    readonly userId: string,
    readonly categoryId: string | null,
    readonly answers: readonly DrillAnswer[],
    readonly startedAt: Date,
    readonly completedAt: Date,
  ) {}

  static create(params: {
    id: DrillSessionId;
    userId: string;
    categoryId: string | null;
    answers: DrillAnswer[];
    startedAt: Date;
    completedAt: Date;
  }): DrillSession {
    if (params.answers.length === 0) {
      throw new Error("回答が1件以上必要です");
    }
    return new DrillSession(
      params.id,
      params.userId,
      params.categoryId,
      Object.freeze([...params.answers]),
      params.startedAt,
      params.completedAt,
    );
  }

  get totalCount(): number {
    return this.answers.length;
  }

  get correctCount(): number {
    return this.answers.filter((a) => a.isCorrect).length;
  }
}
