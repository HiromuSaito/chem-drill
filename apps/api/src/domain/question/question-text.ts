const MAX_LENGTH = 500;

export class QuestionText {
  private constructor(readonly value: string) {}

  static create(value: string): QuestionText {
    if (value.length === 0) {
      throw new Error("問題文は空にできません");
    }
    if (value.length > MAX_LENGTH) {
      throw new Error(
        `問題文は${MAX_LENGTH}文字以内にしてください（${value.length}文字）`,
      );
    }
    return new QuestionText(value);
  }

  equals(other: QuestionText): boolean {
    return this.value === other.value;
  }
}
