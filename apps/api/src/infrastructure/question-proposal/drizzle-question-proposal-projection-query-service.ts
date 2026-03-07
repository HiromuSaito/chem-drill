import { eq, and, desc, count } from "drizzle-orm";
import type {
  QuestionProposalProjectionQueryService,
  ListQuestionProposalsResult,
  QuestionProposalProjectionDto,
} from "../../domain/question-proposal/query-service/question-proposal-projection-query-service.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import { questionProposalProjections } from "../db/schema.ts";

export class DrizzleQuestionProposalProjectionQueryService implements QuestionProposalProjectionQueryService {
  async list(
    status: string | undefined,
    categoryId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsResult> {
    const tx = getCurrentTransaction();

    const statusCondition = status
      ? eq(
          questionProposalProjections.status,
          status as
            | "pending"
            | "reviewed"
            | "approved"
            | "rejected"
            | "withdrawn",
        )
      : undefined;
    const categoryCondition = categoryId
      ? eq(questionProposalProjections.categoryId, categoryId)
      : undefined;
    const conditions = and(statusCondition, categoryCondition);

    const [items, totalResult] = await Promise.all([
      tx
        .select()
        .from(questionProposalProjections)
        .where(conditions)
        .orderBy(desc(questionProposalProjections.createdAt))
        .limit(limit)
        .offset(offset),
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
    userId: row.userId,
    questionId: row.questionId,
    questionCreated: row.questionCreated,
    isPublished: row.status === "approved",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
