export type StatsDto = {
  totalAnswered: number;
  correctCount: number;
  uniqueQuestionsAnswered: number;
  totalQuestions: number;
};

export type OverallStatsDto = StatsDto & {
  categoryStats: Array<
    StatsDto & {
      categoryId: string;
      categoryName: string;
    }
  >;
};

export type CategoryScoreDto = {
  categoryId: string;
  categoryName: string;
  correctRate: number;
  coverageRate: number;
};
