import { Id } from "../../shared/id.ts";
import { QuestionProposalEvent } from "../event/events.ts";
import { QuestionProposal } from "../entity/question-proposal.ts";

export interface QuestionProposalEventQueryService {
  findEventsByQuestionProposalId(
    questionProposalId: Id<QuestionProposal>,
  ): Promise<QuestionProposalEvent[]>;
}
