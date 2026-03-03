import type { DrillStatsQueryService } from "../../domain/drill-session/query-service/drill-stats-query-service.ts";
import type { CategoryScoreDto } from "./dto.ts";
import type { UnitOfWork } from "../unit-of-work.ts";

export class GetCategoryScores {
  constructor(
    private uow: UnitOfWork,
    private queryService: DrillStatsQueryService,
  ) {}

  async execute(userId: string): Promise<CategoryScoreDto[]> {
    return this.uow.run(async () => {
      const [latestAnswers, questionCounts] = await Promise.all([
        this.queryService.getLatestAnswers(userId),
        this.queryService.getQuestionCounts(),
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
    });
  }
}
