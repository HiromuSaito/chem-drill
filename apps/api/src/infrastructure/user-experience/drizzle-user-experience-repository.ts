import { eq } from "drizzle-orm";
import { getCurrentTransaction } from "../db/transaction-context.ts";
import {
  userExperience as userExperienceTable,
  experienceLogs,
  rankUpEvents,
} from "../db/schema.ts";
import { UserExperience } from "../../domain/user-experience/entity/user-experience.ts";
import type {
  UserExperienceRepository,
  ExperienceLogEntry,
  RankUpEventEntry,
} from "../../domain/user-experience/repository/user-experience-repository.ts";

export class DrizzleUserExperienceRepository implements UserExperienceRepository {
  async save(ue: UserExperience): Promise<void> {
    const tx = getCurrentTransaction();
    await tx
      .insert(userExperienceTable)
      .values({
        userId: ue.userId,
        totalExp: ue.totalExp,
        currentRank: ue.currentRank,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userExperienceTable.userId,
        set: {
          totalExp: ue.totalExp,
          currentRank: ue.currentRank,
          updatedAt: new Date(),
        },
      });
  }

  async findByUserId(userId: string): Promise<UserExperience | null> {
    const tx = getCurrentTransaction();
    const rows = await tx
      .select()
      .from(userExperienceTable)
      .where(eq(userExperienceTable.userId, userId))
      .limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return UserExperience.reconstruct(
      row.userId,
      row.totalExp,
      row.currentRank,
    );
  }

  async saveExperienceLog(entry: ExperienceLogEntry): Promise<boolean> {
    const tx = getCurrentTransaction();
    const result = await tx
      .insert(experienceLogs)
      .values({
        userId: entry.userId,
        action: entry.action,
        amount: entry.amount,
        referenceId: entry.referenceId,
      })
      .onConflictDoNothing({
        target: [
          experienceLogs.userId,
          experienceLogs.action,
          experienceLogs.referenceId,
        ],
      });
    return (result as { rowCount?: number }).rowCount !== 0;
  }

  async saveRankUpEvents(events: RankUpEventEntry[]): Promise<void> {
    if (events.length === 0) return;
    const tx = getCurrentTransaction();
    await tx.insert(rankUpEvents).values(
      events.map((e) => ({
        userId: e.userId,
        previousRank: e.previousRank,
        newRank: e.newRank,
      })),
    );
  }
}
