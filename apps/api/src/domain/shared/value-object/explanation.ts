const MAX_LENGTH = 1000;

export class Explanation {
  private constructor(readonly value: string) {}

  static create(value: string): Explanation {
    if (value.length === 0) {
      throw new Error("解説文は空にできません");
    }
    if (value.length > MAX_LENGTH) {
      throw new Error(
        `解説文は${MAX_LENGTH}文字以内にしてください（${value.length}文字）`,
      );
    }
    return new Explanation(value);
  }

  equals(other: Explanation): boolean {
    return this.value === other.value;
  }
}
