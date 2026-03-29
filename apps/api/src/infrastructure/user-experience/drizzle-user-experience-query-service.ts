import { eq, isNull, and, inArray } from "drizzle-orm";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import { rankUpEvents } from "../db/schema.ts";
import type {
  UserExperienceQueryService,
  RankUpEventDto,
} from "../../domain/user-experience/query-service/user-experience-query-service.ts";

export class DrizzleUserExperienceQueryService implements UserExperienceQueryService {
  async getPendingRankUps(userId: string): Promise<RankUpEventDto[]> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select()
      .from(rankUpEvents)
      .where(
        and(eq(rankUpEvents.userId, userId), isNull(rankUpEvents.displayedAt)),
      )
      .orderBy(rankUpEvents.createdAt);
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      previousRank: r.previousRank,
      newRank: r.newRank,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async markRankUpsDisplayed(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;
    const tx = getCurrentTransaction();
    await tx
      .update(rankUpEvents)
      .set({ displayedAt: new Date() })
      .where(inArray(rankUpEvents.id, eventIds));
  }
}
