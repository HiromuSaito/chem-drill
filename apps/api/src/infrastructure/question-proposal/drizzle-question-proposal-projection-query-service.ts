import { eq, and, desc, count } from "drizzle-orm";
import type {
  QuestionProposalProjectionQueryService,
  ListQuestionProposalsByUserIdResult,
  QuestionProposalProjectionDto,
} from "../../domain/question-proposal/query-service/question-proposal-projection-query-service.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import { questionProposalProjections, questions, user } from "../db/schema.ts";

export class DrizzleQuestionProposalProjectionQueryService implements QuestionProposalProjectionQueryService {
  async list(
    status: string | undefined,
    categoryId: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsByUserIdResult> {
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
        .select({
          projection: questionProposalProjections,
          isPublished: questions.isPublished,
          userName: user.name,
        })
        .from(questionProposalProjections)
        .leftJoin(
          questions,
          eq(questionProposalProjections.questionId, questions.id),
        )
        .leftJoin(user, eq(questionProposalProjections.userId, user.id))
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
      items: items.map((row) =>
        toDto(row.projection, row.isPublished, row.userName),
      ),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async listByUserId(
    userId: string,
    status: string | undefined,
    limit: number,
    offset: number,
  ): Promise<ListQuestionProposalsByUserIdResult> {
    const tx = getCurrentTransaction();

    const userCondition = eq(questionProposalProjections.userId, userId);
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
    const conditions = and(userCondition, statusCondition);

    const [items, totalResult] = await Promise.all([
      tx
        .select({
          projection: questionProposalProjections,
          isPublished: questions.isPublished,
        })
        .from(questionProposalProjections)
        .leftJoin(
          questions,
          eq(questionProposalProjections.questionId, questions.id),
        )
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
      items: items.map((row) => toDto(row.projection, row.isPublished, null)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async findById(
    questionProposalId: string,
  ): Promise<QuestionProposalProjectionDto | null> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select({
        projection: questionProposalProjections,
        isPublished: questions.isPublished,
        userName: user.name,
      })
      .from(questionProposalProjections)
      .leftJoin(
        questions,
        eq(questionProposalProjections.questionId, questions.id),
      )
      .leftJoin(user, eq(questionProposalProjections.userId, user.id))
      .where(
        eq(questionProposalProjections.questionProposalId, questionProposalId),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return toDto(row.projection, row.isPublished, row.userName);
  }
}

function toDto(
  row: typeof questionProposalProjections.$inferSelect,
  isPublished: boolean | null,
  userName: string | null,
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
    userName,
    questionId: row.questionId,
    questionCreated: row.questionCreated,
    isPublished: isPublished ?? false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
