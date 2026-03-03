import type {
  DrillStatsQueryService,
  LatestAnswerRow,
  CategoryQuestionCountRow,
} from "../../domain/drill-session/query-service/drill-stats-query-service.ts";
import type { OverallStatsDto, StatsDto } from "./dto.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class GetDrillStats {
  constructor(
    private uow: UnitOfWork,
    private queryService: DrillStatsQueryService,
  ) {}

  async execute(params: {
    userId: string;
    categoryId?: string;
  }): Promise<OverallStatsDto | StatsDto | null> {
    return this.uow.run(async () => {
      const [latestAnswers, questionCounts] = await Promise.all([
        this.queryService.getLatestAnswers(params.userId, params.categoryId),
        this.queryService.getQuestionCounts(params.categoryId),
      ]);

      if (params.categoryId) {
        return this.buildCategoryStats(latestAnswers, questionCounts);
      }
      return this.buildOverallStats(latestAnswers, questionCounts);
    });
  }

  private buildCategoryStats(
    latestAnswers: LatestAnswerRow[],
    questionCounts: CategoryQuestionCountRow[],
  ): StatsDto | null {
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

  private buildOverallStats(
    latestAnswers: LatestAnswerRow[],
    questionCounts: CategoryQuestionCountRow[],
  ): OverallStatsDto {
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
}
