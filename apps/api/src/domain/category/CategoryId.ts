const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CategoryId {
  private constructor(readonly value: string) {}

  static create(value: string): CategoryId {
    if (!UUID_REGEX.test(value)) {
      throw new Error(
        `CategoryId が不正です: "${value}" は有効な UUID ではありません`,
      );
    }
    return new CategoryId(value);
  }

  equals(other: CategoryId): boolean {
    return this.value === other.value;
  }
}
