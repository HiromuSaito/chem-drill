import { eq, desc, count } from "drizzle-orm";
import type {
  QuestionProposalListQueryService,
  ListQuestionProposalsInput,
  ListQuestionProposalsResult,
  QuestionProposalProjectionDto,
} from "../../domain/question-proposal/question-proposal-list-query-service.js";
import { getCurrentTransaction } from "../db/transaction-context.js";
import { questionProposalProjections } from "../db/schema.js";

export class DrizzleQuestionProposalListQueryService implements QuestionProposalListQueryService {
  async list(
    input: ListQuestionProposalsInput,
  ): Promise<ListQuestionProposalsResult> {
    const tx = getCurrentTransaction();

    const conditions = input.status
      ? eq(
          questionProposalProjections.status,
          input.status as "pending" | "approved" | "rejected",
        )
      : undefined;

    const [items, totalResult] = await Promise.all([
      tx
        .select()
        .from(questionProposalProjections)
        .where(conditions)
        .orderBy(desc(questionProposalProjections.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      tx
        .select({ count: count() })
        .from(questionProposalProjections)
        .where(conditions),
    ]);

    return {
      items: items.map(toDto),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async findById(
    questionProposalId: string,
  ): Promise<QuestionProposalProjectionDto | null> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select()
      .from(questionProposalProjections)
      .where(
        eq(questionProposalProjections.questionProposalId, questionProposalId),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return toDto(row);
  }
}

function toDto(
  row: typeof questionProposalProjections.$inferSelect,
): QuestionProposalProjectionDto {
  return {
    questionProposalId: row.questionProposalId,
    status: row.status,
    text: row.text,
    difficulty: row.difficulty,
    choices: row.choices,
    correctIndexes: row.correctIndexes as number[],
    explanation: row.explanation,
    categoryId: row.categoryId,
    rejectReason: row.rejectReason,
    questionCreated: row.questionCreated,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
