import type { Transaction } from "../../infrastructure/db/client.js";
import { Id } from "../id.js";
import { QuestionProposalEvent } from "./events.js";
import { QuestionProposal } from "./question-proposal.js";

export interface QuestionProposalRepository {
  save(
    tx: Transaction,
    proposal: QuestionProposal,
    event: QuestionProposalEvent,
  ): Promise<void>;

  findById(
    tx: Transaction,
    questionProposalId: Id<QuestionProposal>,
  ): Promise<QuestionProposal>;
}
