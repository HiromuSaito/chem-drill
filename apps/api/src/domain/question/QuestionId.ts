const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class QuestionId {
  private constructor(readonly value: string) {}

  static create(value: string): QuestionId {
    if (!UUID_REGEX.test(value)) {
      throw new Error(`Invalid QuestionId: "${value}" is not a valid UUID`);
    }
    return new QuestionId(value);
  }

  equals(other: QuestionId): boolean {
    return this.value === other.value;
  }
}
