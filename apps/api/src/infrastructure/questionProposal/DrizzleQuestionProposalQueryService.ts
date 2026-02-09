import { eq } from "drizzle-orm";
import { Id } from "../../domain/Id.js";
import { QuestionProposalEvent } from "../../domain/questionProposal/Events.js";
import { QuestionProposal } from "../../domain/questionProposal/QuestionProposal.js";
import { QuestionProposalQueryService } from "../../domain/questionProposal/QuestionProposalQueryService.js";
import type { Transaction } from "../../infrastructure/db/client.ts";
import { questionProposalEvents } from "../db/schema.js";

export class DrizzleQuestionProposalQueryService implements QuestionProposalQueryService {
  async findEventsByQuestionProposalId(
    tx: Transaction,
    questionProposalId: Id<QuestionProposal>,
  ): Promise<QuestionProposalEvent[]> {
    const rows = await tx
      .select({
        id: questionProposalEvents.id,
        questionProposalId: questionProposalEvents.questionProposalId,
        type: questionProposalEvents.type,
        payload: questionProposalEvents.payload,
        occurredAt: questionProposalEvents.occurredAt,
      })
      .from(questionProposalEvents)
      .where(eq(questionProposalEvents.questionProposalId, questionProposalId))
      .orderBy(questionProposalEvents.occurredAt);

    return rows.map(
      (row) =>
        ({
          type: row.type,
          payload: row.payload,
          occurredAt: row.occurredAt,
        }) as QuestionProposalEvent,
    );
  }
}
