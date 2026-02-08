const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class QuestionId {
  private constructor(readonly value: string) {}

  static generate(): QuestionId {
    return new QuestionId(crypto.randomUUID());
  }

  static create(value: string): QuestionId {
    if (!UUID_REGEX.test(value)) {
      throw new Error(
        `QuestionId が不正です: "${value}" は有効な UUID ではありません`,
      );
    }
    return new QuestionId(value);
  }

  equals(other: QuestionId): boolean {
    return this.value === other.value;
  }
}
