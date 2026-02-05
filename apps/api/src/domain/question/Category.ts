const MAX_LENGTH = 100;

export class Category {
  private constructor(readonly value: string) {}

  static create(value: string): Category {
    if (value.length === 0) {
      throw new Error("カテゴリは空にできません");
    }
    if (value.length > MAX_LENGTH) {
      throw new Error(
        `カテゴリは${MAX_LENGTH}文字以内にしてください（${value.length}文字）`,
      );
    }
    return new Category(value);
  }

  equals(other: Category): boolean {
    return this.value === other.value;
  }
}
