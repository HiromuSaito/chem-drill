import { CategoryId } from "../category/category-id";
import { Id } from "../id";
import { CorrectIndexes } from "../question/correct-indexes";
import { Difficulty } from "../question/difficulty";
import { Explanation } from "../question/explanation";
import { QuestionText } from "../question/question-text";
import {
  QuestionProposalApproved,
  QuestionProposalCreated,
  QuestionProposalEdited,
  QuestionProposalEvent,
  QuestionProposalRejected,
} from "./events";
import { QuestionProposalStatus } from "./question-proposal-status";
import { RejectReason } from "./reject-reason";

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
  ) {}

  canEdit() {
    return !this.status.equals(QuestionProposalStatus.create("approved"));
  }
  canApprove() {
    return this.status.equals(QuestionProposalStatus.create("pending"));
  }
  canReject() {
    return this.status.equals(QuestionProposalStatus.create("pending"));
  }

  static create(params: {
    questionText: QuestionText;
    difficulty: Difficulty;
    choices: readonly string[];
    correctIndexes: CorrectIndexes;
    explanation: Explanation;
    categoryId: CategoryId;
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
    if (!this.canEdit()) {
      throw new Error(
        `問題提案を編集できるステータスではありません。ステータス=${this.status}`,
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
    );

    return { proposal, event };
  }

  approve(): {
    proposal: QuestionProposal;
    event: QuestionProposalApproved;
  } {
    if (!this.canApprove()) {
      throw new Error(
        `問題提案を承認できるステータスではありません。ステータス=${this.status}`,
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
    );

    return { proposal, event };
  }

  reject(rejectReason: RejectReason): {
    proposal: QuestionProposal;
    event: QuestionProposalRejected;
  } {
    if (!this.canReject()) {
      throw new Error(
        `問題提案を却下できるステータスではありません。ステータス=${this.status}`,
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
        return new QuestionProposal(
          proposal.id,
          QuestionProposalStatus.create("pending"),
          event.payload.questionText,
          event.payload.difficulty,
          event.payload.choices,
          event.payload.correctIndexes,
          event.payload.explanation,
          event.payload.categoryId,
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
        );
      case "QuestionProposalCreated":
        throw new Error("QuestionProposalCreated は apply で処理されません");
    }
  }
}
