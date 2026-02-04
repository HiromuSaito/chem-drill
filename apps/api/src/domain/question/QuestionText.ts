const MAX_LENGTH = 500;

export class QuestionText {
  private constructor(readonly value: string) {}

  static create(value: string): QuestionText {
    if (value.length === 0) {
      throw new Error("QuestionText must not be empty");
    }
    if (value.length > MAX_LENGTH) {
      throw new Error(
        `QuestionText must be at most ${MAX_LENGTH} characters (got ${value.length})`,
      );
    }
    return new QuestionText(value);
  }

  equals(other: QuestionText): boolean {
    return this.value === other.value;
  }
}
