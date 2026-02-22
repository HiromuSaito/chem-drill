import type {
  DrillStatsQueryService,
  CategoryScoreDto,
  LatestAnswerRow,
} from "../../domain/drill-session/query-service/drill-stats-query-service.ts";
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

      const countMap = new Map(
        questionCounts.map((r) => [r.categoryId, r.total]),
      );

      const categoryMap = new Map<
        string,
        { categoryName: string; answers: LatestAnswerRow[] }
      >();
      for (const a of latestAnswers) {
        const existing = categoryMap.get(a.categoryId);
        if (existing) {
          existing.answers.push(a);
        } else {
          categoryMap.set(a.categoryId, {
            categoryName: a.categoryName,
            answers: [a],
          });
        }
      }

      return Array.from(categoryMap.entries()).map(
        ([categoryId, { categoryName, answers }]) => {
          const totalQuestions = countMap.get(categoryId) ?? 0;
          const correctCount = answers.filter((a) => a.isCorrect).length;
          return {
            categoryId,
            categoryName,
            correctRate: answers.length > 0 ? correctCount / answers.length : 0,
            coverageRate:
              totalQuestions > 0 ? answers.length / totalQuestions : 0,
          };
        },
      );
    });
  }
}
