import { eq, and, count, desc, inArray } from "drizzle-orm";
import {
  drillSessions,
  drillAnswers,
  questions,
  categories,
} from "../db/schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import type {
  DrillStatsQueryService,
  LatestAnswerRow,
  CategoryQuestionCountRow,
  SessionSummaryDto,
} from "../../domain/drill-session/query-service/drill-stats-query-service.ts";

export class DrizzleDrillStatsQueryService implements DrillStatsQueryService {
  async getLatestAnswers(
    userId: string,
    categoryId?: string,
  ): Promise<LatestAnswerRow[]> {
    const tx = getCurrentTransaction();

    const conditions = [eq(drillSessions.userId, userId)];
    if (categoryId) {
      conditions.push(eq(questions.categoryId, categoryId));
    }

    return tx
      .selectDistinctOn([drillAnswers.questionId], {
        questionId: drillAnswers.questionId,
        isCorrect: drillAnswers.isCorrect,
        categoryId: questions.categoryId,
      })
      .from(drillAnswers)
      .innerJoin(drillSessions, eq(drillAnswers.sessionId, drillSessions.id))
      .innerJoin(questions, eq(drillAnswers.questionId, questions.id))
      .where(and(...conditions))
      .orderBy(drillAnswers.questionId, desc(drillSessions.completedAt));
  }

  async getQuestionCounts(
    categoryId?: string,
  ): Promise<CategoryQuestionCountRow[]> {
    const tx = getCurrentTransaction();

    const query = tx
      .select({
        categoryId: questions.categoryId,
        categoryName: categories.name,
        total: count(questions.id),
      })
      .from(questions)
      .innerJoin(categories, eq(questions.categoryId, categories.id))
      .groupBy(questions.categoryId, categories.name);

    if (categoryId) {
      return query.where(eq(questions.categoryId, categoryId));
    }
    return query;
  }

  async getRecentSessions(
    userId: string,
    limit: number,
    offset: number,
    categoryId?: string,
  ): Promise<SessionSummaryDto[]> {
    const tx = getCurrentTransaction();

    const conditions = [eq(drillSessions.userId, userId)];
    if (categoryId) {
      const sessionIds = tx
        .selectDistinct({ sessionId: drillAnswers.sessionId })
        .from(drillAnswers)
        .innerJoin(questions, eq(drillAnswers.questionId, questions.id))
        .where(eq(questions.categoryId, categoryId));
      conditions.push(inArray(drillSessions.id, sessionIds));
    }

    const rows = await tx
      .select({
        sessionId: drillSessions.id,
        categoryId: drillSessions.categoryId,
        categoryName: categories.name,
        totalCount: drillSessions.totalCount,
        correctCount: drillSessions.correctCount,
        completedAt: drillSessions.completedAt,
      })
      .from(drillSessions)
      .leftJoin(categories, eq(drillSessions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(drillSessions.completedAt))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({
      sessionId: r.sessionId,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      totalCount: r.totalCount,
      correctCount: r.correctCount,
      completedAt: r.completedAt.toISOString(),
    }));
  }
}
