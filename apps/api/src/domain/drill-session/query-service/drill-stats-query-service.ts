// --- DTO ---

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

export type SessionSummaryDto = {
  sessionId: string;
  categoryId: string | null;
  categoryName: string | null;
  totalCount: number;
  correctCount: number;
  completedAt: string;
};

// --- クエリサービスIF（集計済み DTO を返す） ---

export interface DrillStatsQueryService {
  getOverallStats(userId: string): Promise<OverallStatsDto>;

  getCategoryStats(
    userId: string,
    categoryId: string,
  ): Promise<StatsDto | null>;

  getCategoryScores(userId: string): Promise<CategoryScoreDto[]>;

  getRecentSessions(
    userId: string,
    limit: number,
    offset: number,
    categoryId?: string,
  ): Promise<SessionSummaryDto[]>;
}
