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
  OverallStatsDto,
  StatsDto,
  CategoryScoreDto,
  SessionSummaryDto,
} from "../../domain/drill-session/query-service/drill-stats-query-service.ts";

type LatestAnswerRow = {
  questionId: string;
  isCorrect: boolean;
  categoryId: string;
};

type CategoryQuestionCountRow = {
  categoryId: string;
  categoryName: string;
  total: number;
};

export class DrizzleDrillStatsQueryService implements DrillStatsQueryService {
  async getOverallStats(userId: string): Promise<OverallStatsDto> {
    const [latestAnswers, questionCounts] = await Promise.all([
      this.getLatestAnswers(userId),
      this.getQuestionCounts(),
    ]);

    const countMap = new Map(questionCounts.map((r) => [r.categoryId, r]));
    const totalQuestions = questionCounts.reduce((sum, r) => sum + r.total, 0);
    const correctCount = latestAnswers.filter((a) => a.isCorrect).length;

    const categoryMap = new Map<string, LatestAnswerRow[]>();
    for (const a of latestAnswers) {
      const existing = categoryMap.get(a.categoryId);
      if (existing) {
        existing.push(a);
      } else {
        categoryMap.set(a.categoryId, [a]);
      }
    }

    return {
      totalAnswered: latestAnswers.length,
      correctCount,
      uniqueQuestionsAnswered: latestAnswers.length,
      totalQuestions,
      categoryStats: Array.from(categoryMap.entries()).map(
        ([categoryId, answers]) => ({
          categoryId,
          categoryName: countMap.get(categoryId)?.categoryName ?? "",
          totalAnswered: answers.length,
          correctCount: answers.filter((a) => a.isCorrect).length,
          uniqueQuestionsAnswered: answers.length,
          totalQuestions: countMap.get(categoryId)?.total ?? 0,
        }),
      ),
    };
  }

  async getCategoryStats(
    userId: string,
    categoryId: string,
  ): Promise<StatsDto | null> {
    const [latestAnswers, questionCounts] = await Promise.all([
      this.getLatestAnswers(userId, categoryId),
      this.getQuestionCounts(categoryId),
    ]);

    if (latestAnswers.length === 0) return null;

    const totalQuestions = questionCounts[0]?.total ?? 0;
    const correctCount = latestAnswers.filter((a) => a.isCorrect).length;

    return {
      totalAnswered: latestAnswers.length,
      correctCount,
      uniqueQuestionsAnswered: latestAnswers.length,
      totalQuestions,
    };
  }

  async getCategoryScores(userId: string): Promise<CategoryScoreDto[]> {
    const [latestAnswers, questionCounts] = await Promise.all([
      this.getLatestAnswers(userId),
      this.getQuestionCounts(),
    ]);

    const countMap = new Map(questionCounts.map((r) => [r.categoryId, r]));

    const categoryMap = new Map<string, { correct: number; total: number }>();
    for (const a of latestAnswers) {
      const existing = categoryMap.get(a.categoryId);
      if (existing) {
        existing.total++;
        if (a.isCorrect) existing.correct++;
      } else {
        categoryMap.set(a.categoryId, {
          correct: a.isCorrect ? 1 : 0,
          total: 1,
        });
      }
    }

    return Array.from(categoryMap.entries()).map(
      ([categoryId, { correct, total }]) => {
        const totalQuestions = countMap.get(categoryId)?.total ?? 0;
        return {
          categoryId,
          categoryName: countMap.get(categoryId)?.categoryName ?? "",
          correctRate: total > 0 ? correct / total : 0,
          coverageRate: totalQuestions > 0 ? total / totalQuestions : 0,
        };
      },
    );
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

  private async getLatestAnswers(
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

  private async getQuestionCounts(
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
}
