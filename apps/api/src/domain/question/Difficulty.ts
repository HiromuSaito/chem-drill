const VALID_LEVELS = ["easy", "medium", "hard"] as const;
export type DifficultyLevel = (typeof VALID_LEVELS)[number];

export class Difficulty {
  private constructor(readonly value: DifficultyLevel) {}

  static create(value: string): Difficulty {
    if (!VALID_LEVELS.includes(value as DifficultyLevel)) {
      throw new Error(
        `Invalid Difficulty: "${value}". Must be one of: ${VALID_LEVELS.join(", ")}`,
      );
    }
    return new Difficulty(value as DifficultyLevel);
  }

  equals(other: Difficulty): boolean {
    return this.value === other.value;
  }
}
