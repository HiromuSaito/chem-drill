import { eq } from "drizzle-orm";
import { Id } from "../../domain/id.js";
import { QuestionProposalEvent } from "../../domain/question-proposal/events.js";
import { QuestionProposal } from "../../domain/question-proposal/question-proposal.js";
import type { QuestionProposalQueryService } from "../../domain/question-proposal/question-proposal-query-service.js";
import { getCurrentTransaction } from "../db/transaction-context.js";
import { questionProposalEvents } from "../db/schema.js";

export class DrizzleQuestionProposalQueryService implements QuestionProposalQueryService {
  async findEventsByQuestionProposalId(
    questionProposalId: Id<QuestionProposal>,
  ): Promise<QuestionProposalEvent[]> {
    const tx = getCurrentTransaction();
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
