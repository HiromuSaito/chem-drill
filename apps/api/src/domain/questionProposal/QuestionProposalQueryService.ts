import type { Transaction } from "../../infrastructure/db/client.js";
import { Id } from "../Id.js";
import { QuestionProposalEvent } from "./Events.js";
import { QuestionProposal } from "./QuestionProposal.js";

export interface QuestionProposalQueryService {
  findEventsByQuestionProposalId(
    tx: Transaction,
    questionProposalId: Id<QuestionProposal>,
  ): Promise<QuestionProposalEvent[]>;
}
