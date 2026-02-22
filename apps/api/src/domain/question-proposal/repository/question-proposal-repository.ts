import { Id } from "../../shared/id.ts";
import { QuestionProposalEvent } from "../event/events.ts";
import { QuestionProposal } from "../entity/question-proposal.ts";

export interface QuestionProposalRepository {
  save(proposal: QuestionProposal, event: QuestionProposalEvent): Promise<void>;

  findById(questionProposalId: Id<QuestionProposal>): Promise<QuestionProposal>;

  markQuestionCreated(questionProposalId: string): Promise<void>;
}
