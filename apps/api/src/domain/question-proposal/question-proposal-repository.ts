import { Id } from "../id.js";
import { QuestionProposalEvent } from "./events.js";
import { QuestionProposal } from "./question-proposal.js";

export interface QuestionProposalRepository {
  save(proposal: QuestionProposal, event: QuestionProposalEvent): Promise<void>;

  findById(questionProposalId: Id<QuestionProposal>): Promise<QuestionProposal>;
}
