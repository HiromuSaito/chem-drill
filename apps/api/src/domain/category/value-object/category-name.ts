const MAX_LENGTH = 100;

export class CategoryName {
  private constructor(readonly value: string) {}

  static create(value: string): CategoryName {
    if (value.length === 0) {
      throw new Error("カテゴリ名は空にできません");
    }
    if (value.length > MAX_LENGTH) {
      throw new Error(
        `カテゴリ名は${MAX_LENGTH}文字以内にしてください（${value.length}文字）`,
      );
    }
    return new CategoryName(value);
  }

  equals(other: CategoryName): boolean {
    return this.value === other.value;
  }
}
