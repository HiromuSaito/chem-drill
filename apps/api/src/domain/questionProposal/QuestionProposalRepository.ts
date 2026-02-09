import type { Transaction } from "../../infrastructure/db/client.js";
import { Id } from "../Id.js";
import { QuestionProposalEvent } from "./Events.js";
import { QuestionProposal } from "./QuestionProposal.js";

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
