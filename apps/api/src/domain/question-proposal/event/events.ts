import type { CategoryId } from "../../category/entity/category.ts";
import { DomainEvent } from "../../shared/domain-event.ts";
import { Id } from "../../shared/id.ts";
import type { CorrectIndexes } from "../../shared/value-object/correct-indexes.ts";
import type { Difficulty } from "../../shared/value-object/difficulty.ts";
import type { Explanation } from "../../shared/value-object/explanation.ts";
import type { QuestionText } from "../../shared/value-object/question-text.ts";
import type { QuestionProposal } from "../entity/question-proposal.ts";
import type { RejectReason } from "../value-object/reject-reason.ts";

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
