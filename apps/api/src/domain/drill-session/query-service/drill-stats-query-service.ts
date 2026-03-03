// --- クエリサービスが返す生データ型 ---

export type LatestAnswerRow = {
  questionId: string;
  isCorrect: boolean;
  categoryId: string;
};

export type CategoryQuestionCountRow = {
  categoryId: string;
  categoryName: string;
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
