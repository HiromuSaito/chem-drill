// --- クエリサービスが返す生データ型 ---

export type LatestAnswerRow = {
  questionId: string;
  isCorrect: boolean;
  categoryId: string;
  categoryName: string;
};

export type CategoryQuestionCountRow = {
  categoryId: string;
  total: number;
};

export type SessionSummaryDto = {
  sessionId: string;
  categoryId: string | null;
  categoryName: string | null;
  totalCount: number;
  correctCount: number;
  completedAt: string;
};

// --- ユースケースが返す集計済み DTO ---

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

// --- クエリサービスIF（データ取得のみ） ---

export interface DrillStatsQueryService {
  getLatestAnswers(
    userId: string,
    categoryId?: string,
  ): Promise<LatestAnswerRow[]>;

  getQuestionCounts(categoryId?: string): Promise<CategoryQuestionCountRow[]>;

  getRecentSessions(
    userId: string,
    limit: number,
    offset: number,
    categoryId?: string,
  ): Promise<SessionSummaryDto[]>;
}
