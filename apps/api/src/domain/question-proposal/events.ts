import type { CategoryId } from "../category/category-id.js";
import { DomainEvent } from "../domain-event.js";
import { Id } from "../id.js";
import type { CorrectIndexes } from "../question/correct-indexes.js";
import type { Difficulty } from "../question/difficulty.js";
import type { Explanation } from "../question/explanation.js";
import type { QuestionText } from "../question/question-text.js";
import type { QuestionProposal } from "./question-proposal.js";
import type { RejectReason } from "./reject-reason.js";

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
