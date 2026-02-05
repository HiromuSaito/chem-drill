export class CorrectIndexes {
  readonly values: readonly number[];

  private constructor(values: readonly number[]) {
    this.values = values;
  }

  static create(values: number[]): CorrectIndexes {
    if (values.length === 0) {
      throw new Error("正解インデックスは1つ以上必要です");
    }

    const unique = [...new Set(values)];
    if (unique.length !== values.length) {
      throw new Error("正解インデックスに重複があります");
    }

    const sorted = [...values].sort((a, b) => a - b);
    return new CorrectIndexes(Object.freeze(sorted));
  }

  includes(index: number): boolean {
    return this.values.includes(index);
  }

  equals(other: CorrectIndexes): boolean {
    if (this.values.length !== other.values.length) return false;
    return this.values.every((v, i) => v === other.values[i]);
  }
}
