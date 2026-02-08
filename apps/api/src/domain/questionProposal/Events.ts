import type { CategoryId } from "../category/CategoryId.js";
import { DomainEvent } from "../DomainEvent.js";
import { Id } from "../Id.js";
import type { CorrectIndexes } from "../question/CorrectIndexes.js";
import type { Difficulty } from "../question/Difficulty.js";
import type { Explanation } from "../question/Explanation.js";
import type { QuestionText } from "../question/QuestionText.js";
import type { QuestionProposal } from "./QuestionProposal.js";
import type { RejectReason } from "./RejectReason.js";

export type QuestionProposalCreated = DomainEvent<
  "QuestionProposalCreated",
  {
    questionProposalId: Id<QuestionProposal>;
    questionText: QuestionText;
    difficulty: Difficulty;
    choices: readonly string[];
    correctIndexes: CorrectIndexes;
    explanation: Explanation;
    categoryId: CategoryId;
  }
>;

export type QuestionProposalEdited = DomainEvent<
  "QuestionProposalEdited",
  {
    questionProposalId: Id<QuestionProposal>;
    questionText: QuestionText;
    difficulty: Difficulty;
    choices: readonly string[];
    correctIndexes: CorrectIndexes;
    explanation: Explanation;
    categoryId: CategoryId;
  }
>;

export type QuestionProposalApproved = DomainEvent<
  "QuestionProposalApproved",
  {
    questionProposalId: Id<QuestionProposal>;
  }
>;

export type QuestionProposalRejected = DomainEvent<
  "QuestionProposalRejected",
  {
    questionProposalId: Id<QuestionProposal>;
    rejectReason: RejectReason;
  }
>;

export type QuestionProposalEvent =
  | QuestionProposalCreated
  | QuestionProposalEdited
  | QuestionProposalApproved
  | QuestionProposalRejected;
