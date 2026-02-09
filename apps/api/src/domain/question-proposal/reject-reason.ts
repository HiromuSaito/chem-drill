const MAX_LENGTH = 500;

export class RejectReason {
  private constructor(readonly value: string) {}

  static create(value: string): RejectReason {
    if (value.length === 0) {
      throw new Error("却下理由は空にできません");
    }
    if (value.length > MAX_LENGTH) {
      throw new Error(
        `却下理由は${MAX_LENGTH}文字以内にしてください（${value.length}文字）`,
      );
    }
    return new RejectReason(value);
  }

  equals(other: RejectReason): boolean {
    return this.value === other.value;
  }
}
