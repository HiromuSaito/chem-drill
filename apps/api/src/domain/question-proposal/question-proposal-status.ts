const VALID_LEVELS = ["pending", "approved", "rejected"] as const;
export type QuestionProposalStatusType = (typeof VALID_LEVELS)[number];

export class QuestionProposalStatus {
  private constructor(readonly value: QuestionProposalStatusType) {}

  static create(value: string): QuestionProposalStatus {
    if (!VALID_LEVELS.includes(value as QuestionProposalStatusType)) {
      throw new Error(
        `ステータスが不正です: "${value}"（${VALID_LEVELS.join(", ")} のいずれかを指定してください）`,
      );
    }
    return new QuestionProposalStatus(value as QuestionProposalStatusType);
  }

  equals(other: QuestionProposalStatus): boolean {
    return this.value === other.value;
  }
}
