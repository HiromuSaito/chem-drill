import { CategoryId } from "../category/CategoryId";
import { Id } from "../Id";
import { CorrectIndexes } from "../question/CorrectIndexes";
import { Difficulty } from "../question/Difficulty";
import { Explanation } from "../question/Explanation";
import { QuestionText } from "../question/QuestionText";
import {
  QuestionProposalApproved,
  QuestionProposalCreated,
  QuestionProposalEdited,
  QuestionProposalEvent,
  QuestionProposalRejected,
} from "./Events";
import { RejectReason } from "./RejectReason";

export class QuestionProposal {
  private constructor(
    private id: Id<QuestionProposal>,
    private status: "pending" | "approved" | "rejected",
    private questionText: QuestionText,
    private difficulty: Difficulty,
    private choices: readonly string[],
    private correctIndexes: CorrectIndexes,
    private explanation: Explanation,
    private categoryId: CategoryId,
    private rejectReason?: RejectReason,
  ) {}

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
      "pending",
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
    if (this.status == "approved") {
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
    this.questionText = params.questionText;
    this.status = "pending";
    this.difficulty = params.difficulty;
    this.choices = params.choices;
    this.correctIndexes = params.correctIndexes;
    this.explanation = params.explanation;
    this.categoryId = params.categoryId;

    return { proposal: this, event };
  }

  approve(): {
    proposal: QuestionProposal;
    event: QuestionProposalApproved;
  } {
    if (this.status != "pending") {
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

    this.status = "approved";

    return { proposal: this, event };
  }

  reject(rejectReason: RejectReason): {
    proposal: QuestionProposal;
    event: QuestionProposalRejected;
  } {
    if (this.status != "pending") {
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

    this.rejectReason = rejectReason;
    this.status = "rejected";

    return { proposal: this, event };
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

    const proposal = new QuestionProposal(
      first.payload.questionProposalId,
      "pending",
      first.payload.questionText,
      first.payload.difficulty,
      first.payload.choices,
      first.payload.correctIndexes,
      first.payload.explanation,
      first.payload.categoryId,
    );

    // 残りのイベントを適用
    for (const event of events.slice(1)) {
      proposal.apply(event);
    }

    return proposal;
  }

  private apply(event: QuestionProposalEvent) {
    switch (event.type) {
      case "QuestionProposalEdited": {
        this.questionText = event.payload.questionText;
        this.status = "pending";
        this.difficulty = event.payload.difficulty;
        this.choices = event.payload.choices;
        this.correctIndexes = event.payload.correctIndexes;
        this.explanation = event.payload.explanation;
        this.categoryId = event.payload.categoryId;
        break;
      }
      case "QuestionProposalApproved": {
        this.status = "approved";
        break;
      }
      case "QuestionProposalRejected": {
        this.status = "rejected";
        this.rejectReason = event.payload.rejectReason;
        break;
      }
    }
  }
}
