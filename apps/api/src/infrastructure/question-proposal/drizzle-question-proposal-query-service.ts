import { eq } from "drizzle-orm";
import { Id } from "../../domain/shared/id.ts";
import { QuestionProposalEvent } from "../../domain/question-proposal/event/events.ts";
import { QuestionProposal } from "../../domain/question-proposal/entity/question-proposal.ts";
import type { QuestionProposalQueryService } from "../../domain/question-proposal/query-service/question-proposal-query-service.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import { questionProposalEvents } from "../db/schema.ts";

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
