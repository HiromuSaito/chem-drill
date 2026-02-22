import { drillSessions, drillAnswers } from "../db/schema.ts";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import type { DrillSession } from "../../domain/drill-session/entity/drill-session.ts";
import type { DrillSessionRepository } from "../../domain/drill-session/repository/drill-session-repository.ts";

export class DrizzleDrillSessionRepository implements DrillSessionRepository {
  async save(session: DrillSession): Promise<void> {
    const tx = getCurrentTransaction();
    await tx.insert(drillSessions).values({
      id: session.id,
      userId: session.userId,
      categoryId: session.categoryId,
      totalCount: session.totalCount,
      correctCount: session.correctCount,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    });

    if (session.answers.length > 0) {
      await tx.insert(drillAnswers).values(
        session.answers.map((a) => ({
          sessionId: session.id,
          questionId: a.questionId,
          selectedIndexes: a.selectedIndexes,
          isCorrect: a.isCorrect,
        })),
      );
    }
  }
}
