import type { Transaction } from "../../infrastructure/db/client.js";
import { Id } from "../id.js";
import { QuestionProposalEvent } from "./events.js";
import { QuestionProposal } from "./question-proposal.js";

export interface QuestionProposalQueryService {
  findEventsByQuestionProposalId(
    tx: Transaction,
    questionProposalId: Id<QuestionProposal>,
  ): Promise<QuestionProposalEvent[]>;
}
