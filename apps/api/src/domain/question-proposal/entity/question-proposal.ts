import type { CategoryId } from "../../category/entity/category.ts";
import { Id } from "../../shared/id.ts";
import { CorrectIndexes } from "../../shared/value-object/correct-indexes.ts";
import { Difficulty } from "../../shared/value-object/difficulty.ts";
import { Explanation } from "../../shared/value-object/explanation.ts";
import { QuestionText } from "../../shared/value-object/question-text.ts";
import type {
  QuestionProposalApproved,
  QuestionProposalApprovedEdited,
  QuestionProposalCreated,
  QuestionProposalEdited,
  QuestionProposalEvent,
  QuestionProposalRejected,
  QuestionProposalSubmitted,
  QuestionProposalWithdrawn,
} from "../event/events.ts";
import { QuestionProposalStatus } from "../value-object/question-proposal-status.ts";
import { RejectReason } from "../value-object/reject-reason.ts";

export class QuestionProposal {
  private constructor(
    readonly id: Id<QuestionProposal>,
    readonly status: QuestionProposalStatus,
    readonly text: QuestionText,
    readonly difficulty: Difficulty,
    readonly choices: readonly string[],
    readonly correctIndexes: CorrectIndexes,
    readonly explanation: Explanation,
    readonly categoryId: CategoryId,
    readonly rejectReason?: RejectReason,
    /** 出題案の提案者（管理者による提案の場合はnullになる） */
    readonly userId?: string | null,
  ) {}

  ensureOwnedBy(userId: string): void {
    if (this.userId !== userId) {
      throw new Error("この出題案へのアクセス権がありません");
    }
  }

  canEdit(): boolean {
    return (
      this.status.equals(QuestionProposalStatus.create("pending")) ||
      this.status.equals(QuestionProposalStatus.create("rejected")) ||
      this.status.equals(QuestionProposalStatus.create("approved"))
    );
  }
  canSubmit(): boolean {
    return this.status.equals(QuestionProposalStatus.create("pending"));
  }
  canApprove(): boolean {
    return this.status.equals(QuestionProposalStatus.create("reviewed"));
  }
  canReject(): boolean {
    return this.status.equals(QuestionProposalStatus.create("reviewed"));
  }
  canWithdraw(): boolean {
    return this.status.equals(QuestionProposalStatus.create("approved"));
  }

  static create(params: {
    questionText: QuestionText;
    difficulty: Difficulty;
    choices: readonly string[];
    correctIndexes: CorrectIndexes;
    explanation: Explanation;
    categoryId: CategoryId;
    userId?: string;
  }): {
    proposal: QuestionProposal;
    event: QuestionProposalCreated;
  } {
    const questionProposalId = Id.random<QuestionProposal>();

    const event: QuestionProposalCreated = {
      type: "QuestionProposalCreated",
      occurredAt: new Date(),
      payload: { questionProposalId, ...params },
    };
    const proposal = new QuestionProposal(
      questionProposalId,
      QuestionProposalStatus.create("pending"),
      params.questionText,
      params.difficulty,
      params.choices,
      params.correctIndexes,
      params.explanation,
      params.categoryId,
      undefined,
      params.userId,
    );

    return { proposal, event };
  }

  edit(params: {
    questionText: QuestionText;
    difficulty: Difficulty;
    choices: readonly string[];
    correctIndexes: CorrectIndexes;
    explanation: Explanation;
    categoryId: CategoryId;
  }): {
    proposal: QuestionProposal;
    event: QuestionProposalEdited;
  } {
    if (this.status.equals(QuestionProposalStatus.create("approved"))) {
      throw new Error(`承認済みの出題案は管理者のみ変更できます。`);
    }
    if (
      !this.status.equals(QuestionProposalStatus.create("pending")) &&
      !this.status.equals(QuestionProposalStatus.create("rejected"))
    ) {
      throw new Error(
        `出題案を編集できるステータスではありません。ステータス=${this.status.value}`,
      );
    }

    const event: QuestionProposalEdited = {
      type: "QuestionProposalEdited",
      occurredAt: new Date(),
      payload: {
        questionProposalId: this.id,
        ...params,
      },
    };

    const proposal = new QuestionProposal(
      this.id,
      QuestionProposalStatus.create("pending"),
      params.questionText,
      params.difficulty,
      params.choices,
      params.correctIndexes,
      params.explanation,
      params.categoryId,
      undefined,
      this.userId,
    );

    return { proposal, event };
  }

  editApproved(params: {
    questionText: QuestionText;
    difficulty: Difficulty;
    choices: readonly string[];
    correctIndexes: CorrectIndexes;
    explanation: Explanation;
    categoryId: CategoryId;
  }): {
    proposal: QuestionProposal;
    event: QuestionProposalApprovedEdited;
  } {
    if (!this.status.equals(QuestionProposalStatus.create("approved"))) {
      throw new Error(
        `承認済みの出題案ではありません。ステータス=${this.status.value}`,
      );
    }

    const event: QuestionProposalApprovedEdited = {
      type: "QuestionProposalApprovedEdited",
      occurredAt: new Date(),
      payload: {
        questionProposalId: this.id,
        ...params,
      },
    };

    const proposal = new QuestionProposal(
      this.id,
      QuestionProposalStatus.create("approved"),
      params.questionText,
      params.difficulty,
      params.choices,
      params.correctIndexes,
      params.explanation,
      params.categoryId,
      undefined,
      this.userId,
    );

    return { proposal, event };
  }

  submit(): {
    proposal: QuestionProposal;
    event: QuestionProposalSubmitted;
  } {
    if (!this.canSubmit()) {
      throw new Error(
        `出題案を申請できるステータスではありません。ステータス=${this.status.value}`,
      );
    }

    const event: QuestionProposalSubmitted = {
      type: "QuestionProposalSubmitted",
      occurredAt: new Date(),
      payload: {
        questionProposalId: this.id,
      },
    };

    const proposal = new QuestionProposal(
      this.id,
      QuestionProposalStatus.create("reviewed"),
      this.text,
      this.difficulty,
      this.choices,
      this.correctIndexes,
      this.explanation,
      this.categoryId,
      undefined,
      this.userId,
    );

    return { proposal, event };
  }

  approve(): {
    proposal: QuestionProposal;
    event: QuestionProposalApproved;
  } {
    if (!this.canApprove()) {
      throw new Error(
        `出題案を承認できるステータスではありません。ステータス=${this.status.value}`,
      );
    }

    const event: QuestionProposalApproved = {
      type: "QuestionProposalApproved",
      occurredAt: new Date(),
      payload: {
        questionProposalId: this.id,
      },
    };

    const proposal = new QuestionProposal(
      this.id,
      QuestionProposalStatus.create("approved"),
      this.text,
      this.difficulty,
      this.choices,
      this.correctIndexes,
      this.explanation,
      this.categoryId,
      undefined,
      this.userId,
    );

    return { proposal, event };
  }

  reject(rejectReason: RejectReason): {
    proposal: QuestionProposal;
    event: QuestionProposalRejected;
  } {
    if (!this.canReject()) {
      throw new Error(
        `出題案を却下できるステータスではありません。ステータス=${this.status.value}`,
      );
    }

    const event: QuestionProposalRejected = {
      type: "QuestionProposalRejected",
      occurredAt: new Date(),
      payload: {
        questionProposalId: this.id,
        rejectReason,
      },
    };

    const proposal = new QuestionProposal(
      this.id,
      QuestionProposalStatus.create("rejected"),
      this.text,
      this.difficulty,
      this.choices,
      this.correctIndexes,
      this.explanation,
      this.categoryId,
      rejectReason,
      this.userId,
    );

    return { proposal, event };
  }

  withdraw(): {
    proposal: QuestionProposal;
    event: QuestionProposalWithdrawn;
  } {
    if (!this.canWithdraw()) {
      throw new Error(
        `出題案を取り下げできるステータスではありません。ステータス=${this.status.value}`,
      );
    }

    const event: QuestionProposalWithdrawn = {
      type: "QuestionProposalWithdrawn",
      occurredAt: new Date(),
      payload: {
        questionProposalId: this.id,
      },
    };

    const proposal = new QuestionProposal(
      this.id,
      QuestionProposalStatus.create("withdrawn"),
      this.text,
      this.difficulty,
      this.choices,
      this.correctIndexes,
      this.explanation,
      this.categoryId,
      undefined,
      this.userId,
    );

    return { proposal, event };
  }

  static fromEvents(events: QuestionProposalEvent[]): QuestionProposal {
    if (events.length === 0) {
      throw new Error("イベントが空です");
    }

    const first = events[0];
    if (first.type !== "QuestionProposalCreated") {
      throw new Error(
        "最初のイベントは QuestionProposalCreated である必要があります",
      );
    }

    let proposal = new QuestionProposal(
      first.payload.questionProposalId,
      QuestionProposalStatus.create("pending"),
      first.payload.questionText,
      first.payload.difficulty,
      first.payload.choices,
      first.payload.correctIndexes,
      first.payload.explanation,
      first.payload.categoryId,
    );

    // 残りのイベントを適用
    for (const event of events.slice(1)) {
      proposal = QuestionProposal.apply(proposal, event);
    }

    return proposal;
  }

  private static apply(
    proposal: QuestionProposal,
    event: QuestionProposalEvent,
  ): QuestionProposal {
    switch (event.type) {
      case "QuestionProposalEdited":
      case "QuestionProposalApprovedEdited":
        return new QuestionProposal(
          proposal.id,
          proposal.status,
          event.payload.questionText,
          event.payload.difficulty,
          event.payload.choices,
          event.payload.correctIndexes,
          event.payload.explanation,
          event.payload.categoryId,
          undefined,
          proposal.userId,
        );
      case "QuestionProposalSubmitted":
        return new QuestionProposal(
          proposal.id,
          QuestionProposalStatus.create("reviewed"),
          proposal.text,
          proposal.difficulty,
          proposal.choices,
          proposal.correctIndexes,
          proposal.explanation,
          proposal.categoryId,
          undefined,
          proposal.userId,
        );
      case "QuestionProposalApproved":
        return new QuestionProposal(
          proposal.id,
          QuestionProposalStatus.create("approved"),
          proposal.text,
          proposal.difficulty,
          proposal.choices,
          proposal.correctIndexes,
          proposal.explanation,
          proposal.categoryId,
          undefined,
          proposal.userId,
        );
      case "QuestionProposalRejected":
        return new QuestionProposal(
          proposal.id,
          QuestionProposalStatus.create("rejected"),
          proposal.text,
          proposal.difficulty,
          proposal.choices,
          proposal.correctIndexes,
          proposal.explanation,
          proposal.categoryId,
          event.payload.rejectReason,
          proposal.userId,
        );
      case "QuestionProposalWithdrawn":
        return new QuestionProposal(
          proposal.id,
          QuestionProposalStatus.create("withdrawn"),
          proposal.text,
          proposal.difficulty,
          proposal.choices,
          proposal.correctIndexes,
          proposal.explanation,
          proposal.categoryId,
          undefined,
          proposal.userId,
        );
      case "QuestionProposalCreated":
        throw new Error("QuestionProposalCreated は apply で処理されません");
    }
  }
}
