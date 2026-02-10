import { Id } from "../id.js";
import { QuestionProposalEvent } from "./events.js";
import { QuestionProposal } from "./question-proposal.js";

export interface QuestionProposalQueryService {
  findEventsByQuestionProposalId(
    questionProposalId: Id<QuestionProposal>,
  ): Promise<QuestionProposalEvent[]>;
}
